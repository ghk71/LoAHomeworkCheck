-- Run after 20261001_task_group_settings.sql. All DDL/backfill is transactional.
begin;

create table if not exists task_batch_requests (
  id uuid primary key,
  payload jsonb not null,
  result jsonb,
  created_at timestamptz not null default now()
);
create table if not exists task_lineage_backup_20261008 (
  table_name text not null,
  task_id uuid not null,
  original_row jsonb not null,
  primary key(table_name, task_id)
);

create or replace function task_shared_config(p_row jsonb)
returns jsonb language sql immutable as $$
  select coalesce(jsonb_object_agg(key,value), '{}'::jsonb) from jsonb_each(p_row)
  where key = any(array['name','icon_url','reset_type','reset_day','activate_day',
    'count_max','count_daily_limit','rest_enabled','rest_max','rest_charge',
    'rest_consume','rest_threshold','rest_daily_limit']);
$$;

-- Preserve every original row before assigning identities. Never merge root tasks by name.
do $$
declare tab text; item record; group_id uuid; signature jsonb; duplicate_owner boolean;
begin
  foreach tab in array array['tasks','expedition_tasks'] loop
    execute format('lock table %I in share row exclusive mode',tab);
    execute format('insert into task_lineage_backup_20261008 select %L,id,to_jsonb(t) from %I t on conflict do nothing',tab,tab);
    execute format('update %I set clone_group_id=pg_catalog.gen_random_uuid() where parent_id is null and clone_group_id is null',tab);
    -- Only unambiguous children under an already-linked parent family can share an identity.
    loop
      execute format('select t.id, t.parent_id, p.clone_group_id as parent_group, to_jsonb(t) as doc from %I t join %I p on p.id=t.parent_id where t.clone_group_id is null and p.clone_group_id is not null order by t.created_at,t.id limit 1',tab,tab) into item;
      exit when item.id is null;
      signature := task_shared_config(item.doc);
      execute format('select exists(select 1 from %I t join %I p on p.id=t.parent_id where p.clone_group_id=$1 and task_shared_config(to_jsonb(t))=$2 group by t.%I having count(*)>1)',tab,tab,case when tab='tasks' then 'character_id' else 'account_id' end)
        into duplicate_owner using item.parent_group,signature;
      group_id := pg_catalog.gen_random_uuid();
      if duplicate_owner then
        execute format('update %I set clone_group_id=$1 where id=$2',tab) using group_id,item.id;
      else
        -- Existing explicit child identities are authoritative; do not merge into them by name.
        execute format('update %I t set clone_group_id=$1 from %I p where p.id=t.parent_id and p.clone_group_id=$2 and t.clone_group_id is null and task_shared_config(to_jsonb(t))=$3',tab,tab)
          using group_id,item.parent_group,signature;
      end if;
    end loop;
    execute format('update %I set clone_group_id=pg_catalog.gen_random_uuid() where clone_group_id is null',tab);
  end loop;
end;
$$;

create or replace function task_insert_node(p_is_expedition boolean,p_owner uuid,p_parent uuid,p_group uuid,p_settings jsonb)
returns jsonb language plpgsql set search_path=public,pg_temp as $$
declare
  tab text := case when p_is_expedition then 'expedition_tasks' else 'tasks' end;
  owner_col text := case when p_is_expedition then 'account_id' else 'character_id' end;
  doc jsonb; result jsonb; cols text; vals text; next_sort int;
begin
  if p_owner is null then raise exception 'owner required'; end if;
  if coalesce(length(btrim(p_settings->>'name')),0)=0 then raise exception 'task name is required'; end if;
  if coalesce(p_settings->>'reset_type','') not in ('daily','weekly','monthly') then raise exception 'invalid reset type'; end if;
  if p_parent is not null then
    execute format('select to_jsonb(t) from %I t where id=$1 and %I=$2',tab,owner_col) into doc using p_parent,p_owner;
    if doc is null then raise exception 'parent must belong to the same owner'; end if;
  end if;
  execute format('select coalesce(max(sort_order),-1)+1 from %I where %I=$1 and parent_id is not distinct from $2',tab,owner_col) into next_sort using p_owner,p_parent;
  doc := task_shared_config(p_settings) || jsonb_build_object(
    'id',pg_catalog.gen_random_uuid(),owner_col,p_owner,'parent_id',p_parent,'clone_group_id',p_group,'sort_order',next_sort,
    'is_completed',false,'last_completed_at',null,'is_paused',false,'count_current',0,
    'count_daily_current',0,'count_daily_last_reset_at',now(),'rest_consumed_current_cycle',0,
    'rest_current',greatest(0,least(coalesce((p_settings->>'rest_current')::int,0),coalesce((p_settings->>'rest_max')::int,200))),
    'rest_last_processed_at',now());
  select string_agg(format('%I',key),',' order by key),string_agg(format('(jsonb_populate_record(null::%I,$1)).%I',tab,key),',' order by key)
    into cols,vals from jsonb_object_keys(doc) keys(key);
  execute format('insert into %I (%s) select %s returning to_jsonb(%I.*)',tab,cols,vals,tab) into result using doc;
  return result;
end;
$$;

-- Recursively create the ancestor chain, then reuse/move the matching node by identity.
create or replace function task_ensure_copy_node(p_is_expedition boolean,p_source uuid,p_owner uuid,p_path uuid[] default '{}')
returns uuid language plpgsql set search_path=public,pg_temp as $$
declare
  tab text := case when p_is_expedition then 'expedition_tasks' else 'tasks' end;
  owner_col text := case when p_is_expedition then 'account_id' else 'character_id' end;
  src jsonb; dst jsonb; group_id uuid; parent_id uuid; matches int;
begin
  if p_owner is null then raise exception 'owner required'; end if;
  if p_source=any(p_path) then raise exception 'cyclic task hierarchy'; end if;
  execute format('select to_jsonb(t) from %I t where id=$1',tab) into src using p_source;
  if src is null then raise exception 'source task not found'; end if;
  group_id := coalesce((src->>'clone_group_id')::uuid,pg_catalog.gen_random_uuid());
  execute format('update %I set clone_group_id=$1 where id=$2 and clone_group_id is null',tab) using group_id,p_source;
  if (src->>'parent_id') is not null then
    execute format('select to_jsonb(t) from %I t where id=$1 and %I=$2',tab,owner_col) into dst using (src->>'parent_id')::uuid,(src->>owner_col)::uuid;
    if dst is null then raise exception 'invalid source parent ownership'; end if;
    parent_id := task_ensure_copy_node(p_is_expedition,(src->>'parent_id')::uuid,p_owner,p_path||p_source);
  end if;
  execute format('select count(*) from %I where %I=$1 and clone_group_id=$2',tab,owner_col) into matches using p_owner,group_id;
  if matches>1 then raise exception 'duplicate task identity for owner %, group %',p_owner,group_id; end if;
  execute format('select to_jsonb(t) from %I t where %I=$1 and clone_group_id=$2',tab,owner_col) into dst using p_owner,group_id;
  if dst is not null then
    if (dst->>'parent_id')::uuid is distinct from parent_id then
      if dst->>'parent_id' is not null or parent_id is null then raise exception 'conflicting task hierarchy'; end if;
      execute format('update %I set parent_id=$1 where id=$2',tab) using parent_id,(dst->>'id')::uuid;
    end if;
    return (dst->>'id')::uuid;
  end if;
  dst := task_insert_node(p_is_expedition,p_owner,parent_id,group_id,src);
  return (dst->>'id')::uuid;
end;
$$;

create or replace function task_refresh_parents(p_is_expedition boolean,p_ids uuid[])
returns jsonb language plpgsql set search_path=public,pg_temp as $$
declare tab text := case when p_is_expedition then 'expedition_tasks' else 'tasks' end;
  parent_id uuid; changes jsonb; response jsonb; affected uuid[]:='{}'; current_ids uuid[]; rows jsonb;
begin
  -- Recompute each chain separately so overlapping ancestor sets remain bottom-up.
  for parent_id in select distinct id from unnest(p_ids) ids(id) where id is not null order by id loop
    execute format('select jsonb_build_array(jsonb_build_object(''id'',t.id,''update'',case when exists(select 1 from %I c where c.parent_id=t.id) then ''{}''::jsonb else jsonb_build_object(''is_completed'',false,''last_completed_at'',null) end)) from %I t where t.id=$1',tab,tab) into changes using parent_id;
    if changes is null then continue; end if;
    response:=apply_task_pause_atomic(p_is_expedition,changes);
    select array_agg((r->>'id')::uuid) into current_ids from jsonb_array_elements(response->'parents') r;
    affected:=affected||parent_id||coalesce(current_ids,'{}'::uuid[]);
  end loop;
  execute format('select coalesce(jsonb_agg(jsonb_build_object(''id'',id,''is_completed'',is_completed,''last_completed_at'',last_completed_at)),''[]''::jsonb) from %I where id=any($1)',tab) into rows using affected;
  return jsonb_build_object('parents',rows);
end;
$$;

create or replace function clone_task_tree_atomic(p_is_expedition boolean,p_source_id uuid,p_target_owner_ids uuid[])
returns jsonb language plpgsql set search_path=public,pg_temp as $$
declare
  tab text := case when p_is_expedition then 'expedition_tasks' else 'tasks' end;
  owner_col text := case when p_is_expedition then 'account_id' else 'character_id' end;
  src jsonb; target uuid; node record; rows jsonb; parents uuid[]; before_ids uuid[]; changed_ids uuid[]; before_links jsonb;
begin
  if p_is_expedition is null or coalesce(cardinality(p_target_owner_ids),0)=0 then raise exception 'targets required'; end if;
  execute format('lock table %I in share row exclusive mode',tab);
  execute format('select to_jsonb(t) from %I t where id=$1',tab) into src using p_source_id;
  if src is null then raise exception 'source task not found'; end if;
  execute format('select coalesce(array_agg(id),''{}''::uuid[]) from %I',tab) into before_ids;
  execute format('select coalesce(jsonb_object_agg(id::text,to_jsonb(parent_id)),''{}''::jsonb) from %I',tab) into before_links;
  for target in select distinct id from unnest(p_target_owner_ids) t(id) loop
    for node in execute format('with recursive tree(id) as (select id from %I where id=$1 union select t.id from %I t join tree p on t.parent_id=p.id) select t.id from tree join %I t using(id) order by t.sort_order,t.created_at,t.id',tab,tab,tab) using p_source_id loop
      perform task_ensure_copy_node(p_is_expedition,node.id,target);
    end loop;
  end loop;
  execute format('select coalesce(array_agg(id),''{}''::uuid[]) from %I where not(id=any($1))',tab) into changed_ids using before_ids;
  execute format('select array_agg(distinct parent_id) from %I where parent_id is not null and (id=any($1) or (to_jsonb(parent_id) is distinct from ($2->id::text)))',tab) into parents using changed_ids,before_links;
  perform task_refresh_parents(p_is_expedition,parents);
  execute format('select coalesce(jsonb_agg(to_jsonb(t)),''[]''::jsonb) from %I t where %I=any($1)',tab,owner_col) into rows using array_append(p_target_owner_ids,(src->>owner_col)::uuid);
  execute format('select clone_group_id from %I where id=$1',tab) into target using p_source_id;
  return jsonb_build_object('rows',rows,'cloneGroupId',target,'created',cardinality(changed_ids),'copiedTargets',cardinality(p_target_owner_ids));
end;
$$;

create or replace function create_task_bundle_atomic(p_is_expedition boolean,p_nodes jsonb,p_target_owner_ids uuid[],p_request_id uuid,p_parent_source_id uuid default null)
returns jsonb language plpgsql set search_path=public,pg_temp as $$
declare
  tab text := case when p_is_expedition then 'expedition_tasks' else 'tasks' end;
  owner_col text := case when p_is_expedition then 'account_id' else 'character_id' end;
  payload jsonb; prior task_batch_requests%rowtype; node jsonb; item jsonb; rows jsonb:='[]'; mapping jsonb;
  target uuid; parent_id uuid; base_parent uuid; parents uuid[]:='{}'; keys uuid[]:='{}'; key_id uuid; source_owner uuid; already_exists boolean;
begin
  if p_is_expedition is null or p_request_id is null or coalesce(cardinality(p_target_owner_ids),0)=0 or jsonb_typeof(p_nodes) is distinct from 'array' or jsonb_array_length(p_nodes)=0 then raise exception 'nodes and targets required'; end if;
  if jsonb_array_length(p_nodes)>500 then raise exception 'too many task nodes'; end if;
  payload:=jsonb_build_object('expedition',p_is_expedition,'nodes',p_nodes,'targets',p_target_owner_ids,'parent',p_parent_source_id);
  insert into task_batch_requests(id,payload) values(p_request_id,payload) on conflict do nothing;
  select * into prior from task_batch_requests where id=p_request_id for update;
  if prior.payload<>payload then raise exception 'request payload changed; reopen the editor'; end if;
  if prior.result is not null then return prior.result; end if;
  execute format('lock table %I in share row exclusive mode',tab);
  for node in select value from jsonb_array_elements(p_nodes) loop
    key_id:=(node->>'key')::uuid;
    if key_id is null or key_id=any(keys) then raise exception 'duplicate node key'; end if;
    if node->>'parentKey' is not null and not((node->>'parentKey')::uuid=any(keys)) then raise exception 'parent must precede child'; end if;
    keys:=keys||key_id;
  end loop;
  for target in select distinct id from unnest(p_target_owner_ids) t(id) loop
    execute format('select exists(select 1 from %I where %I=$1 and clone_group_id=any($2))',tab,owner_col) into already_exists using target,keys;
    if already_exists then raise exception 'this task bundle already exists; refresh before creating another'; end if;
    mapping:='{}';base_parent:=null;
    if p_parent_source_id is not null then base_parent:=task_ensure_copy_node(p_is_expedition,p_parent_source_id,target); end if;
    for node in select value from jsonb_array_elements(p_nodes) loop
      parent_id:=case when node->>'parentKey' is null then base_parent else (mapping->>(node->>'parentKey'))::uuid end;
      item:=task_insert_node(p_is_expedition,target,parent_id,(node->>'key')::uuid,node->'settings');
      if (node->'settings'->>'count_daily_limit') is not null then
        execute format('update %I set count_current=greatest(0,least(count_max,coalesce(($1->>''count_current'')::int,0))),count_daily_current=greatest(0,least(count_daily_limit,coalesce(($1->>''count_daily_current'')::int,0),coalesce(($1->>''count_current'')::int,0))),is_completed=coalesce(($1->>''count_current'')::int,0)>=count_max,last_completed_at=case when coalesce(($1->>''count_current'')::int,0)>0 then now() else null end where id=$2',tab) using node->'settings',(item->>'id')::uuid;
      end if;
      mapping:=mapping||jsonb_build_object(node->>'key',item->>'id');
      if parent_id is not null then parents:=parents||parent_id; end if;
    end loop;
  end loop;
  perform task_refresh_parents(p_is_expedition,parents);
  if p_parent_source_id is not null then
    execute format('select %I from %I where id=$1',owner_col,tab) into source_owner using p_parent_source_id;
  end if;
  execute format('select coalesce(jsonb_agg(to_jsonb(t)),''[]''::jsonb) from %I t where %I=any($1)',tab,owner_col) into rows using array_append(p_target_owner_ids,source_owner);
  prior.result:=jsonb_build_object('rows',rows,'targets',cardinality(p_target_owner_ids));
  update task_batch_requests set result=prior.result where id=p_request_id;
  return prior.result;
end;
$$;

create or replace function delete_task_selection_atomic(p_is_expedition boolean,p_source_id uuid,p_group_id uuid,p_target_ids uuid[])
returns jsonb language plpgsql set search_path=public,pg_temp as $$
declare tab text:=case when p_is_expedition then 'expedition_tasks' else 'tasks' end; ids uuid[]; parents uuid[]; n int;
begin
  if p_is_expedition is null or p_source_id is null then raise exception 'source required'; end if;
  execute format('lock table %I in share row exclusive mode',tab);
  select array_agg(distinct id) into ids from unnest(p_target_ids) t(id) where id is not null;
  if coalesce(cardinality(ids),0)=0 then raise exception 'targets required'; end if;
  execute format('select count(*) from %I where id=$1 and clone_group_id is not distinct from $2',tab) into n using p_source_id,p_group_id;
  if n<>1 then raise exception 'source group changed'; end if;
  execute format('select count(*) from %I where id=any($1) and (clone_group_id=$2 or ($2 is null and id=$3))',tab) into n using ids,p_group_id,p_source_id;
  if n<>cardinality(ids) then raise exception 'selected task group changed'; end if;
  execute format('with recursive tree(id) as (select id from %I where id=any($1) union select t.id from %I t join tree p on t.parent_id=p.id) select array_agg(id) from tree',tab,tab) into ids using ids;
  execute format('select array_agg(distinct parent_id) from %I where id=any($1) and parent_id is not null and not(parent_id=any($1))',tab) into parents using ids;
  execute format('delete from %I where id=any($1)',tab) using ids;
  return jsonb_build_object('deletedIds',ids,'completion',task_refresh_parents(p_is_expedition,parents));
end;
$$;

-- Allow editing selected copies without forcing a write to the source.
create or replace function update_task_group_settings_atomic(p_is_expedition boolean,p_source_id uuid,p_group_id uuid,p_target_ids uuid[],p_settings jsonb)
returns jsonb language plpgsql set search_path=public,pg_temp as $$
declare tab text:=case when p_is_expedition then 'expedition_tasks' else 'tasks' end; ids uuid[]; n int; assignments text;
begin
  if p_is_expedition is null or p_source_id is null then raise exception 'source required'; end if;
  if p_settings is null or p_settings='{}'::jsonb or task_shared_config(p_settings)<>p_settings then raise exception 'only shared settings allowed'; end if;
  if p_settings ? 'name' and coalesce(length(btrim(p_settings->>'name')),0)=0 then raise exception 'task name is required'; end if;
  if p_settings ? 'reset_type' and coalesce(p_settings->>'reset_type','') not in ('daily','weekly','monthly') then raise exception 'invalid reset type'; end if;
  execute format('lock table %I in share row exclusive mode',tab);
  select array_agg(distinct id order by id) into ids from unnest(p_target_ids) t(id) where id is not null;
  if coalesce(cardinality(ids),0)=0 then raise exception 'targets required'; end if;
  execute format('select id from %I where id=any($1) or id=$2 order by id for update',tab) using ids,p_source_id;
  execute format('select count(*) from %I where id=$1 and clone_group_id is not distinct from $2',tab) into n using p_source_id,p_group_id;
  if n<>1 then raise exception 'source group changed'; end if;
  execute format('select count(*) from %I where id=any($1) and (clone_group_id=$2 or ($2 is null and id=$3))',tab) into n using ids,p_group_id,p_source_id;
  if n<>cardinality(ids) then raise exception 'selected task group changed'; end if;
  select string_agg(format('%1$I=(jsonb_populate_record(null::%2$I,$1)).%1$I',key,tab),',') into assignments from jsonb_object_keys(p_settings) keys(key);
  execute format('update %I set %s where id=any($2)',tab,assignments) using p_settings,ids;
  return jsonb_build_object('updated',n);
end;
$$;

create or replace function repair_task_parent_links_atomic(p_is_expedition boolean,p_apply boolean default false,p_target_ids uuid[] default null)
returns jsonb language plpgsql set search_path=public,pg_temp as $$
declare
  tab text:=case when p_is_expedition then 'expedition_tasks' else 'tasks' end;
  owner_col text:=case when p_is_expedition then 'account_id' else 'character_id' end;
  candidates jsonb; item jsonb; result jsonb:='[]'; parent_id uuid; parents uuid[]:='{}';
begin
  execute format('lock table %I in share row exclusive mode',tab);
  execute format('with anchors as (
    select c.clone_group_id, min(c.id::text)::uuid source_id
    from %I c join %I p on p.id=c.parent_id and p.%I=c.%I
    where c.clone_group_id is not null and p.clone_group_id is not null
    group by c.clone_group_id having count(distinct p.clone_group_id)=1
  ) select coalesce(jsonb_agg(jsonb_build_object(''id'',t.id,''ownerId'',t.%I,''name'',t.name,''sourceId'',a.source_id)),''[]''::jsonb)
    from %I t join anchors a on a.clone_group_id=t.clone_group_id
    where t.parent_id is null and (select count(*) from %I x where x.%I=t.%I and x.clone_group_id=t.clone_group_id)=1',tab,tab,owner_col,owner_col,owner_col,tab,tab,owner_col,owner_col)
    into candidates;
  if not p_apply then return jsonb_build_object('candidates',candidates); end if;
  if p_target_ids is not null then
    if exists(select 1 from unnest(p_target_ids) t(id) where not exists(select 1 from jsonb_array_elements(candidates) c where (c->>'id')::uuid=t.id)) then raise exception 'repair candidates changed; refresh the preview'; end if;
    select coalesce(jsonb_agg(c),'[]'::jsonb) into candidates from jsonb_array_elements(candidates) c where (c->>'id')::uuid=any(p_target_ids);
  end if;
  for item in select value from jsonb_array_elements(candidates) loop
    perform task_ensure_copy_node(p_is_expedition,(item->>'sourceId')::uuid,(item->>'ownerId')::uuid);
    execute format('select parent_id from %I where id=$1',tab) into parent_id using (item->>'id')::uuid;
    parents:=parents||parent_id;
  end loop;
  perform task_refresh_parents(p_is_expedition,parents);
  return jsonb_build_object('repaired',jsonb_array_length(candidates),'candidates',candidates);
end;
$$;

create or replace function save_task_settings_atomic(p_is_expedition boolean,p_id uuid,p_group_id uuid,p_settings jsonb,p_progress jsonb default '{}')
returns jsonb language plpgsql set search_path=public,pg_temp as $$
declare tab text:=case when p_is_expedition then 'expedition_tasks' else 'tasks' end; assignments text; result jsonb;
begin
  perform update_task_group_settings_atomic(p_is_expedition,p_id,p_group_id,array[p_id],p_settings);
  if exists(select 1 from jsonb_object_keys(p_progress) keys(key) where key<>all(array['rest_current','count_current','count_daily_current','count_daily_last_reset_at','is_completed','last_completed_at'])) then raise exception 'invalid progress fields'; end if;
  if p_progress<>'{}'::jsonb then
    select string_agg(format('%1$I=(jsonb_populate_record(null::%2$I,$1)).%1$I',key,tab),',') into assignments from jsonb_object_keys(p_progress) keys(key);
    execute format('update %I set %s where id=$1',tab,replace(assignments,'$1','$2')) using p_id,p_progress;
  end if;
  perform apply_task_pause_atomic(p_is_expedition,jsonb_build_array(jsonb_build_object('id',p_id)));
  execute format('select to_jsonb(t) from %I t where id=$1',tab) into result using p_id;
  return result;
end;
$$;

grant select,insert,update on task_batch_requests to anon,authenticated;
grant execute on function create_task_bundle_atomic(boolean,jsonb,uuid[],uuid,uuid) to anon,authenticated;
grant execute on function clone_task_tree_atomic(boolean,uuid,uuid[]) to anon,authenticated;
grant execute on function delete_task_selection_atomic(boolean,uuid,uuid,uuid[]) to anon,authenticated;
grant execute on function update_task_group_settings_atomic(boolean,uuid,uuid,uuid[],jsonb) to anon,authenticated;
grant execute on function repair_task_parent_links_atomic(boolean,boolean,uuid[]) to anon,authenticated;
grant execute on function save_task_settings_atomic(boolean,uuid,uuid,jsonb,jsonb) to anon,authenticated;

notify pgrst,'reload schema';
commit;
