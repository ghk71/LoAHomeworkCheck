-- Run after 20261008_task_batch_workflow.sql. Does not modify existing task rows.
begin;
set local search_path = public, pg_temp;

do $$
begin
  if to_regprocedure('public.create_task_bundle_atomic(boolean,jsonb,uuid[],uuid,uuid)') is null
     or to_regprocedure('public.task_insert_node(boolean,uuid,uuid,uuid,jsonb)') is null
     or to_regprocedure('public.task_ensure_copy_node(boolean,uuid,uuid,uuid[])') is null then
    raise exception 'Apply 20261008_task_batch_workflow.sql before this repair';
  end if;
end;
$$;

-- Use the built-in UUID generator regardless of the uuid-ossp extension schema.
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

notify pgrst, 'reload schema';
commit;

