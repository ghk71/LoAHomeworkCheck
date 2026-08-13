-- 2026-08-13: complete atomic raid/week rollover operations used by the static clients

alter table raid_parties add column if not exists temp_task_changes jsonb
  default '{"added":{},"removed":{}}'::jsonb;
alter table raid_tasks add column if not exists temp_week_start_date text;
alter table raid_schedules add column if not exists week_start_date text;
alter table raid_group_settings add column if not exists sort_order int default 0;

with schedule_weeks as (
  select id,
    ((created_at at time zone 'Asia/Seoul' - interval '6 hours')::date
      - mod(extract(dow from (created_at at time zone 'Asia/Seoul' - interval '6 hours')::date)::int - 3 + 7, 7)) as week_date
  from raid_schedules
  where not coalesce(is_fixed, false) and week_start_date is null
)
update raid_schedules s
set week_start_date = to_char(w.week_date, 'YYYY-MM-DD')
from schedule_weeks w
where s.id = w.id;

create or replace function apply_task_pause_atomic(
  p_is_expedition boolean,
  p_changes jsonb
)
returns jsonb
language plpgsql
as $$
declare
  v_change jsonb;
  v_update jsonb;
  v_id uuid;
  v_count int := 0;
begin
  if jsonb_typeof(coalesce(p_changes, '[]'::jsonb)) <> 'array' then
    raise exception 'p_changes must be a JSON array';
  end if;

  for v_change in select value from jsonb_array_elements(coalesce(p_changes, '[]'::jsonb))
  loop
    v_id := nullif(v_change->>'id', '')::uuid;
    v_update := coalesce(v_change->'update', '{}'::jsonb);
    if v_id is null then raise exception 'task id is required'; end if;

    if p_is_expedition then
      update expedition_tasks set
        is_paused = case when v_update ? 'is_paused' then (v_update->>'is_paused')::boolean else is_paused end,
        rest_current = case when v_update ? 'rest_current' then (v_update->>'rest_current')::int else rest_current end,
        rest_last_processed_at = case when v_update ? 'rest_last_processed_at' then nullif(v_update->>'rest_last_processed_at', '')::timestamptz else rest_last_processed_at end,
        count_daily_current = case when v_update ? 'count_daily_current' then (v_update->>'count_daily_current')::int else count_daily_current end,
        count_daily_last_reset_at = case when v_update ? 'count_daily_last_reset_at' then nullif(v_update->>'count_daily_last_reset_at', '')::timestamptz else count_daily_last_reset_at end,
        is_completed = case when v_update ? 'is_completed' then (v_update->>'is_completed')::boolean else is_completed end,
        last_completed_at = case when v_update ? 'last_completed_at' then nullif(v_update->>'last_completed_at', '')::timestamptz else last_completed_at end,
        count_current = case when v_update ? 'count_current' then (v_update->>'count_current')::int else count_current end,
        rest_consumed_current_cycle = case when v_update ? 'rest_consumed_current_cycle' then (v_update->>'rest_consumed_current_cycle')::int else rest_consumed_current_cycle end
      where id = v_id;
    else
      update tasks set
        is_paused = case when v_update ? 'is_paused' then (v_update->>'is_paused')::boolean else is_paused end,
        rest_current = case when v_update ? 'rest_current' then (v_update->>'rest_current')::int else rest_current end,
        rest_last_processed_at = case when v_update ? 'rest_last_processed_at' then nullif(v_update->>'rest_last_processed_at', '')::timestamptz else rest_last_processed_at end,
        count_daily_current = case when v_update ? 'count_daily_current' then (v_update->>'count_daily_current')::int else count_daily_current end,
        count_daily_last_reset_at = case when v_update ? 'count_daily_last_reset_at' then nullif(v_update->>'count_daily_last_reset_at', '')::timestamptz else count_daily_last_reset_at end,
        is_completed = case when v_update ? 'is_completed' then (v_update->>'is_completed')::boolean else is_completed end,
        last_completed_at = case when v_update ? 'last_completed_at' then nullif(v_update->>'last_completed_at', '')::timestamptz else last_completed_at end,
        count_current = case when v_update ? 'count_current' then (v_update->>'count_current')::int else count_current end,
        rest_consumed_current_cycle = case when v_update ? 'rest_consumed_current_cycle' then (v_update->>'rest_consumed_current_cycle')::int else rest_consumed_current_cycle end
      where id = v_id;
    end if;

    if not found then raise exception 'task not found: %', v_id; end if;
    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('updated', v_count);
end;
$$;

create or replace function clone_task_tree_atomic(
  p_is_expedition boolean,
  p_source_id uuid,
  p_target_owner_ids uuid[]
)
returns jsonb
language plpgsql
as $$
declare
  v_target_id uuid;
  v_group_id uuid;
  v_new_root_id uuid;
  v_parent_new_id uuid;
  v_id_map jsonb;
  v_sort_order int;
  v_copied int := 0;
  v_skipped int := 0;
  v_rows jsonb := '[]'::jsonb;
  v_task_source tasks%rowtype;
  v_task_child record;
  v_task_new tasks%rowtype;
  v_exp_source expedition_tasks%rowtype;
  v_exp_child record;
  v_exp_new expedition_tasks%rowtype;
begin
  if p_source_id is null then raise exception 'source task id is required'; end if;
  if coalesce(array_length(p_target_owner_ids, 1), 0) = 0 then
    raise exception 'at least one target owner is required';
  end if;

  if p_is_expedition then
    select * into v_exp_source
    from expedition_tasks
    where id = p_source_id and parent_id is null
    for update;
    if not found then raise exception 'source expedition task not found: %', p_source_id; end if;

    v_group_id := coalesce(v_exp_source.clone_group_id, uuid_generate_v4());
    if v_exp_source.clone_group_id is null then
      update expedition_tasks set clone_group_id = v_group_id where id = p_source_id;
    end if;

    for v_target_id in
      select distinct owner_id
      from unnest(p_target_owner_ids) as x(owner_id)
      where owner_id is not null and owner_id <> v_exp_source.account_id
    loop
      if exists(
        select 1 from expedition_tasks
        where account_id = v_target_id and parent_id is null and clone_group_id = v_group_id
      ) then
        v_skipped := v_skipped + 1;
        continue;
      end if;
      select count(*) into v_sort_order
      from expedition_tasks where account_id = v_target_id and parent_id is null;

      insert into expedition_tasks(
        account_id, parent_id, name, reset_type, reset_day, activate_day,
        is_paused, is_completed, last_completed_at,
        count_current, count_max, count_daily_current, count_daily_limit,
        count_daily_last_reset_at, rest_enabled, rest_current, rest_max,
        rest_charge, rest_consume, rest_threshold, rest_daily_limit,
        rest_last_processed_at, rest_consumed_current_cycle, sort_order,
        icon_url, clone_group_id
      ) values (
        v_target_id, null, v_exp_source.name, v_exp_source.reset_type,
        v_exp_source.reset_day, v_exp_source.activate_day,
        false, false, null,
        0, v_exp_source.count_max, 0, v_exp_source.count_daily_limit,
        case when v_exp_source.count_daily_limit is null then null else now() end,
        v_exp_source.rest_enabled, v_exp_source.rest_current, v_exp_source.rest_max,
        v_exp_source.rest_charge, v_exp_source.rest_consume, v_exp_source.rest_threshold,
        v_exp_source.rest_daily_limit, v_exp_source.rest_last_processed_at, 0,
        v_sort_order, v_exp_source.icon_url, v_group_id
      ) returning * into v_exp_new;
      v_new_root_id := v_exp_new.id;
      v_id_map := jsonb_build_object(v_exp_source.id::text, v_new_root_id::text);
      v_rows := v_rows || jsonb_build_array(to_jsonb(v_exp_new));

      for v_exp_child in
        with recursive tree as (
          select t.*, 1 as depth
          from expedition_tasks t where t.parent_id = p_source_id
          union all
          select child.*, tree.depth + 1
          from expedition_tasks child join tree on child.parent_id = tree.id
        )
        select * from tree order by depth, sort_order, created_at, id
      loop
        v_parent_new_id := nullif(v_id_map->>v_exp_child.parent_id::text, '')::uuid;
        if v_parent_new_id is null then raise exception 'cloned expedition parent mapping is missing: %', v_exp_child.parent_id; end if;
        insert into expedition_tasks(
          account_id, parent_id, name, reset_type, reset_day, activate_day,
          is_paused, is_completed, last_completed_at,
          count_current, count_max, count_daily_current, count_daily_limit,
          count_daily_last_reset_at, rest_enabled, rest_current, rest_max,
          rest_charge, rest_consume, rest_threshold, rest_daily_limit,
          rest_last_processed_at, rest_consumed_current_cycle, sort_order,
          icon_url, clone_group_id
        ) values (
          v_target_id, v_parent_new_id, v_exp_child.name, v_exp_child.reset_type,
          v_exp_child.reset_day, v_exp_child.activate_day,
          false, false, null,
          0, v_exp_child.count_max, 0, v_exp_child.count_daily_limit,
          case when v_exp_child.count_daily_limit is null then null else now() end,
          v_exp_child.rest_enabled, v_exp_child.rest_current, v_exp_child.rest_max,
          v_exp_child.rest_charge, v_exp_child.rest_consume, v_exp_child.rest_threshold,
          v_exp_child.rest_daily_limit, v_exp_child.rest_last_processed_at, 0,
          v_exp_child.sort_order, v_exp_child.icon_url, null
        ) returning * into v_exp_new;
        v_id_map := v_id_map || jsonb_build_object(v_exp_child.id::text, v_exp_new.id::text);
        v_rows := v_rows || jsonb_build_array(to_jsonb(v_exp_new));
      end loop;
      v_copied := v_copied + 1;
    end loop;
  else
    select * into v_task_source
    from tasks
    where id = p_source_id and parent_id is null
    for update;
    if not found then raise exception 'source task not found: %', p_source_id; end if;

    v_group_id := coalesce(v_task_source.clone_group_id, uuid_generate_v4());
    if v_task_source.clone_group_id is null then
      update tasks set clone_group_id = v_group_id where id = p_source_id;
    end if;

    for v_target_id in
      select distinct owner_id
      from unnest(p_target_owner_ids) as x(owner_id)
      where owner_id is not null and owner_id <> v_task_source.character_id
    loop
      if exists(
        select 1 from tasks
        where character_id = v_target_id and parent_id is null and clone_group_id = v_group_id
      ) then
        v_skipped := v_skipped + 1;
        continue;
      end if;
      select count(*) into v_sort_order
      from tasks where character_id = v_target_id and parent_id is null;

      insert into tasks(
        character_id, parent_id, name, reset_type, reset_day, activate_day,
        is_paused, is_completed, last_completed_at,
        count_current, count_max, count_daily_current, count_daily_limit,
        count_daily_last_reset_at, rest_enabled, rest_current, rest_max,
        rest_charge, rest_consume, rest_threshold, rest_daily_limit,
        rest_last_processed_at, rest_consumed_current_cycle, sort_order,
        icon_url, clone_group_id
      ) values (
        v_target_id, null, v_task_source.name, v_task_source.reset_type,
        v_task_source.reset_day, v_task_source.activate_day,
        false, false, null,
        0, v_task_source.count_max, 0, v_task_source.count_daily_limit,
        case when v_task_source.count_daily_limit is null then null else now() end,
        v_task_source.rest_enabled, v_task_source.rest_current, v_task_source.rest_max,
        v_task_source.rest_charge, v_task_source.rest_consume, v_task_source.rest_threshold,
        v_task_source.rest_daily_limit, v_task_source.rest_last_processed_at, 0,
        v_sort_order, v_task_source.icon_url, v_group_id
      ) returning * into v_task_new;
      v_new_root_id := v_task_new.id;
      v_id_map := jsonb_build_object(v_task_source.id::text, v_new_root_id::text);
      v_rows := v_rows || jsonb_build_array(to_jsonb(v_task_new));

      for v_task_child in
        with recursive tree as (
          select t.*, 1 as depth
          from tasks t where t.parent_id = p_source_id
          union all
          select child.*, tree.depth + 1
          from tasks child join tree on child.parent_id = tree.id
        )
        select * from tree order by depth, sort_order, created_at, id
      loop
        v_parent_new_id := nullif(v_id_map->>v_task_child.parent_id::text, '')::uuid;
        if v_parent_new_id is null then raise exception 'cloned task parent mapping is missing: %', v_task_child.parent_id; end if;
        insert into tasks(
          character_id, parent_id, name, reset_type, reset_day, activate_day,
          is_paused, is_completed, last_completed_at,
          count_current, count_max, count_daily_current, count_daily_limit,
          count_daily_last_reset_at, rest_enabled, rest_current, rest_max,
          rest_charge, rest_consume, rest_threshold, rest_daily_limit,
          rest_last_processed_at, rest_consumed_current_cycle, sort_order,
          icon_url, clone_group_id
        ) values (
          v_target_id, v_parent_new_id, v_task_child.name, v_task_child.reset_type,
          v_task_child.reset_day, v_task_child.activate_day,
          false, false, null,
          0, v_task_child.count_max, 0, v_task_child.count_daily_limit,
          case when v_task_child.count_daily_limit is null then null else now() end,
          v_task_child.rest_enabled, v_task_child.rest_current, v_task_child.rest_max,
          v_task_child.rest_charge, v_task_child.rest_consume, v_task_child.rest_threshold,
          v_task_child.rest_daily_limit, v_task_child.rest_last_processed_at, 0,
          v_task_child.sort_order, v_task_child.icon_url, null
        ) returning * into v_task_new;
        v_id_map := v_id_map || jsonb_build_object(v_task_child.id::text, v_task_new.id::text);
        v_rows := v_rows || jsonb_build_array(to_jsonb(v_task_new));
      end loop;
      v_copied := v_copied + 1;
    end loop;
  end if;

  return jsonb_build_object(
    'cloneGroupId', v_group_id,
    'copiedTargets', v_copied,
    'skippedTargets', v_skipped,
    'rows', v_rows
  );
end;
$$;

create or replace function raid_task_temp_reference_count(p_task_id uuid)
returns int
language sql
stable
as $$
  select count(*)::int
  from (
    select 1
    from raid_schedule_overrides o
    cross join lateral jsonb_each(coalesce(o.temp_changes->'added', '{}'::jsonb)) e
    where not coalesce((o.temp_changes->>'_restored')::boolean, false)
      and coalesce(e.value->>'taskId', e.value->>'task_id') = p_task_id::text
    union all
    select 1
    from raid_schedule_overrides o
    cross join lateral jsonb_each(coalesce(o.temp_changes->'removed', '{}'::jsonb)) e
    where not coalesce((o.temp_changes->>'_restored')::boolean, false)
      and coalesce(e.value->>'taskId', e.value->>'task_id') = p_task_id::text
    union all
    select 1
    from raid_parties p
    cross join lateral jsonb_each(coalesce(p.temp_task_changes->'added', '{}'::jsonb)) e
    where not coalesce((p.temp_task_changes->>'_restored')::boolean, false)
      and coalesce(e.value->>'taskId', e.value->>'task_id') = p_task_id::text
    union all
    select 1
    from raid_parties p
    cross join lateral jsonb_each(coalesce(p.temp_task_changes->'removed', '{}'::jsonb)) e
    where not coalesce((p.temp_task_changes->>'_restored')::boolean, false)
      and coalesce(e.value->>'taskId', e.value->>'task_id') = p_task_id::text
  ) refs;
$$;

create or replace function restore_raid_temp_changes(
  p_temp_changes jsonb,
  p_preset_id uuid
)
returns jsonb
language plpgsql
as $$
declare
  v_entry record;
  v_info jsonb;
  v_task_id uuid;
  v_was_new boolean;
  v_had_preset boolean;
  v_allowed_references int;
  v_restored int := 0;
  v_skipped int := 0;
begin
  v_allowed_references := case
    when coalesce((p_temp_changes->>'_restored')::boolean, false) then 0
    else 1
  end;
  for v_entry in select * from jsonb_each(coalesce(p_temp_changes->'added', '{}'::jsonb))
  loop
    v_info := v_entry.value;
    v_task_id := nullif(coalesce(v_info->>'taskId', v_info->>'task_id'), '')::uuid;
    v_was_new := coalesce(nullif(coalesce(v_info->>'wasNew', v_info->>'was_new'), '')::boolean, false);
    v_had_preset := coalesce(nullif(coalesce(v_info->>'hadPreset', v_info->>'had_preset'), '')::boolean, false);
    if v_task_id is null then continue; end if;

    if v_was_new then
      if raid_task_temp_reference_count(v_task_id) <= v_allowed_references then
        delete from raid_tasks where id = v_task_id;
      else
        v_skipped := v_skipped + 1;
        continue;
      end if;
    elsif v_had_preset and p_preset_id is not null then
      if raid_task_temp_reference_count(v_task_id) <= v_allowed_references then
        update raid_tasks set preset_id = p_preset_id where id = v_task_id;
      else
        v_skipped := v_skipped + 1;
        continue;
      end if;
    else
      if raid_task_temp_reference_count(v_task_id) <= v_allowed_references then
        update raid_tasks set preset_id = null where id = v_task_id;
      else
        v_skipped := v_skipped + 1;
        continue;
      end if;
    end if;
    v_restored := v_restored + 1;
  end loop;

  for v_entry in select * from jsonb_each(coalesce(p_temp_changes->'removed', '{}'::jsonb))
  loop
    v_info := v_entry.value;
    v_task_id := nullif(coalesce(v_info->>'taskId', v_info->>'task_id'), '')::uuid;
    v_had_preset := coalesce(nullif(coalesce(v_info->>'hadPreset', v_info->>'had_preset'), '')::boolean, false);
    if v_task_id is not null and v_had_preset and p_preset_id is not null then
      if raid_task_temp_reference_count(v_task_id) <= v_allowed_references then
        update raid_tasks set preset_id = p_preset_id where id = v_task_id;
        v_restored := v_restored + 1;
      else
        v_skipped := v_skipped + 1;
      end if;
    end if;
  end loop;

  return jsonb_build_object('restored', v_restored, 'sharedReferencesKept', v_skipped);
end;
$$;

create or replace function restore_raid_temp_links_only(
  p_temp_changes jsonb,
  p_preset_id uuid
)
returns jsonb
language plpgsql
as $$
declare
  v_entry record;
  v_info jsonb;
  v_task_id uuid;
  v_was_new boolean;
  v_had_preset boolean;
  v_restored int := 0;
  v_skipped int := 0;
begin
  for v_entry in select * from jsonb_each(coalesce(p_temp_changes->'added', '{}'::jsonb))
  loop
    v_info := v_entry.value;
    v_task_id := nullif(coalesce(v_info->>'taskId', v_info->>'task_id'), '')::uuid;
    v_was_new := coalesce(nullif(coalesce(v_info->>'wasNew', v_info->>'was_new'), '')::boolean, false);
    v_had_preset := coalesce(nullif(coalesce(v_info->>'hadPreset', v_info->>'had_preset'), '')::boolean, false);
    if v_task_id is null or v_was_new then continue; end if;
    if (not v_had_preset or p_preset_id is not null)
       and raid_task_temp_reference_count(v_task_id) <= 1 then
      update raid_tasks
      set preset_id = case when v_had_preset then p_preset_id else null end
      where id = v_task_id;
      v_restored := v_restored + 1;
    else
      v_skipped := v_skipped + 1;
    end if;
  end loop;

  for v_entry in select * from jsonb_each(coalesce(p_temp_changes->'removed', '{}'::jsonb))
  loop
    v_info := v_entry.value;
    v_task_id := nullif(coalesce(v_info->>'taskId', v_info->>'task_id'), '')::uuid;
    v_had_preset := coalesce(nullif(coalesce(v_info->>'hadPreset', v_info->>'had_preset'), '')::boolean, false);
    if v_task_id is null or not v_had_preset or p_preset_id is null then continue; end if;
    if raid_task_temp_reference_count(v_task_id) <= 1 then
      update raid_tasks set preset_id = p_preset_id where id = v_task_id;
      v_restored := v_restored + 1;
    else
      v_skipped := v_skipped + 1;
    end if;
  end loop;

  return jsonb_build_object('restored', v_restored, 'sharedReferencesKept', v_skipped);
end;
$$;

create or replace function apply_raid_task_mutations(p_mutations jsonb)
returns int
language plpgsql
as $$
declare
  v_item jsonb;
  v_patch jsonb;
  v_record jsonb;
  v_id uuid;
  v_op text;
  v_count int := 0;
begin
  if jsonb_typeof(coalesce(p_mutations, '[]'::jsonb)) <> 'array' then
    raise exception 'p_mutations must be a JSON array';
  end if;

  for v_item in select value from jsonb_array_elements(coalesce(p_mutations, '[]'::jsonb))
  loop
    v_op := coalesce(v_item->>'op', '');
    v_id := nullif(v_item->>'id', '')::uuid;
    if v_op = 'delete' then
      if v_id is null then raise exception 'delete task id is required'; end if;
      if raid_task_temp_reference_count(v_id) > 0 then
        raise exception 'raid task still has temporary references: %', v_id;
      end if;
      delete from raid_tasks where id = v_id;
      if not found then raise exception 'raid task not found: %', v_id; end if;
    elsif v_op = 'update' then
      if v_id is null then raise exception 'update task id is required'; end if;
      v_patch := coalesce(v_item->'patch', '{}'::jsonb);
      if v_patch ? 'temp_week_start_date'
         and coalesce(v_patch->>'temp_week_start_date', '') <> ''
         and (v_patch->>'temp_week_start_date') !~ '^\d{4}-\d{2}-\d{2}$' then
        raise exception 'invalid temp_week_start_date';
      end if;
      update raid_tasks set
        preset_id = case when v_patch ? 'preset_id' then nullif(v_patch->>'preset_id', '')::uuid else preset_id end,
        name = case when v_patch ? 'name' then v_patch->>'name' else name end,
        difficulty = case when v_patch ? 'difficulty' then coalesce(v_patch->>'difficulty', '') else difficulty end,
        entry_level = case when v_patch ? 'entry_level' then coalesce((v_patch->>'entry_level')::numeric, 0) else entry_level end,
        clear_gold = case when v_patch ? 'clear_gold' then coalesce((v_patch->>'clear_gold')::numeric, 0) else clear_gold end,
        bound_gold = case when v_patch ? 'bound_gold' then coalesce((v_patch->>'bound_gold')::numeric, 0) else bound_gold end,
        bonus_gold = case when v_patch ? 'bonus_gold' then coalesce((v_patch->>'bonus_gold')::numeric, 0) else bonus_gold end,
        reset_day = case when v_patch ? 'reset_day' then coalesce((v_patch->>'reset_day')::int, 3) else reset_day end,
        temp_week_start_date = case when v_patch ? 'temp_week_start_date' then nullif(v_patch->>'temp_week_start_date', '') else temp_week_start_date end,
        sort_order = case when v_patch ? 'sort_order' then coalesce((v_patch->>'sort_order')::int, 0) else sort_order end,
        receive_gold = case when v_patch ? 'receive_gold' then coalesce((v_patch->>'receive_gold')::boolean, true) else receive_gold end,
        receive_bound = case when v_patch ? 'receive_bound' then coalesce((v_patch->>'receive_bound')::boolean, true) else receive_bound end,
        receive_bonus = case when v_patch ? 'receive_bonus' then coalesce((v_patch->>'receive_bonus')::boolean, true) else receive_bonus end,
        is_completed = case when v_patch ? 'is_completed' then coalesce((v_patch->>'is_completed')::boolean, false) else is_completed end,
        last_completed_at = case when v_patch ? 'last_completed_at' then nullif(v_patch->>'last_completed_at', '')::timestamptz else last_completed_at end
      where id = v_id;
      if not found then raise exception 'raid task not found: %', v_id; end if;
    elsif v_op = 'insert' then
      v_record := coalesce(v_item->'record', '{}'::jsonb);
      if coalesce(v_record->>'temp_week_start_date', '') <> ''
         and (v_record->>'temp_week_start_date') !~ '^\d{4}-\d{2}-\d{2}$' then
        raise exception 'invalid temp_week_start_date';
      end if;
      v_id := coalesce(nullif(v_record->>'id', '')::uuid, uuid_generate_v4());
      insert into raid_tasks(
        id, character_id, preset_id, name, difficulty, entry_level,
        clear_gold, bound_gold, bonus_gold, reset_day, temp_week_start_date, sort_order,
        receive_gold, receive_bound, receive_bonus, is_completed, last_completed_at
      ) values (
        v_id,
        nullif(v_record->>'character_id', '')::uuid,
        nullif(v_record->>'preset_id', '')::uuid,
        coalesce(nullif(v_record->>'name', ''), '레이드'),
        coalesce(v_record->>'difficulty', ''),
        coalesce((v_record->>'entry_level')::numeric, 0),
        coalesce((v_record->>'clear_gold')::numeric, 0),
        coalesce((v_record->>'bound_gold')::numeric, 0),
        coalesce((v_record->>'bonus_gold')::numeric, 0),
        coalesce((v_record->>'reset_day')::int, 3),
        nullif(v_record->>'temp_week_start_date', ''),
        coalesce((v_record->>'sort_order')::int, 0),
        coalesce((v_record->>'receive_gold')::boolean, true),
        coalesce((v_record->>'receive_bound')::boolean, true),
        coalesce((v_record->>'receive_bonus')::boolean, true),
        coalesce((v_record->>'is_completed')::boolean, false),
        nullif(v_record->>'last_completed_at', '')::timestamptz
      );
    else
      raise exception 'invalid raid task mutation: %', v_op;
    end if;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

create or replace function apply_raid_override_changes_atomic(
  p_overrides jsonb,
  p_task_mutations jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
as $$
declare
  v_item jsonb;
  v_row raid_schedule_overrides%rowtype;
  v_result jsonb := '{}'::jsonb;
  v_task_count int;
begin
  if jsonb_typeof(coalesce(p_overrides, '[]'::jsonb)) <> 'array' then
    raise exception 'p_overrides must be a JSON array';
  end if;
  for v_item in select value from jsonb_array_elements(coalesce(p_overrides, '[]'::jsonb))
  loop
    if coalesce(v_item->>'week_start_date', '') !~ '^\d{4}-\d{2}-\d{2}$' then
      raise exception 'invalid override week_start_date';
    end if;
    insert into raid_schedule_overrides(
      schedule_id, week_start_date, slot_overrides, temp_changes,
      schedule_overrides, is_completed, completed_at
    ) values (
      nullif(v_item->>'schedule_id', '')::uuid,
      v_item->>'week_start_date',
      coalesce(v_item->'slot_overrides', '{}'::jsonb),
      coalesce(v_item->'temp_changes', jsonb_build_object('added', '{}'::jsonb, 'removed', '{}'::jsonb)),
      coalesce(v_item->'schedule_overrides', '{}'::jsonb),
      coalesce((v_item->>'is_completed')::boolean, false),
      nullif(v_item->>'completed_at', '')::timestamptz
    )
    on conflict(schedule_id, week_start_date) do update set
      slot_overrides = excluded.slot_overrides,
      temp_changes = excluded.temp_changes,
      schedule_overrides = excluded.schedule_overrides,
      is_completed = excluded.is_completed,
      completed_at = excluded.completed_at
    returning * into v_row;
    v_result := v_result || jsonb_build_object(v_row.schedule_id::text || '_' || v_row.week_start_date, v_row.id);
  end loop;
  v_task_count := apply_raid_task_mutations(p_task_mutations);
  return jsonb_build_object('overrides', v_result, 'taskMutations', v_task_count);
end;
$$;

create or replace function delete_raid_task_and_links_atomic(p_task_id uuid)
returns jsonb
language plpgsql
as $$
declare
  v_character_id uuid;
  v_preset_id uuid;
  v_temp_week text;
  v_party_ids uuid[];
  v_schedule_ids uuid[];
  v_row record;
  v_slot record;
  v_slots jsonb;
  v_temp jsonb;
  v_info jsonb;
  v_member_count int := 0;
  v_override_count int := 0;
  v_party_change_count int := 0;
begin
  select character_id, preset_id, temp_week_start_date into v_character_id, v_preset_id, v_temp_week
  from raid_tasks where id = p_task_id for update;
  if not found then raise exception 'raid task not found: %', p_task_id; end if;

  if v_preset_id is not null then
    select coalesce(array_agg(id), '{}'::uuid[]) into v_party_ids
    from raid_parties where preset_id = v_preset_id;
    with deleted as (
      delete from raid_party_members m
      using raid_parties p
      where m.party_id = p.id
        and p.preset_id = v_preset_id
        and m.character_id = v_character_id
        and (v_temp_week is null or (coalesce(p.is_temporary, false) and p.temp_week_start_date = v_temp_week))
      returning m.id
    ) select count(*) into v_member_count from deleted;
    select coalesce(array_agg(id), '{}'::uuid[]) into v_schedule_ids
    from raid_schedules where party_id = any(v_party_ids);

    for v_row in
      select id, coalesce(slot_overrides, '{}'::jsonb) as slot_overrides,
        coalesce(temp_changes, jsonb_build_object('added', '{}'::jsonb, 'removed', '{}'::jsonb)) as temp_changes
      from raid_schedule_overrides
      where schedule_id = any(v_schedule_ids)
        and (v_temp_week is null or week_start_date = v_temp_week)
      for update
    loop
      v_slots := v_row.slot_overrides;
      v_temp := v_row.temp_changes;
      for v_slot in select key, value from jsonb_each(v_slots)
      loop
        if v_slot.value#>>'{}' = v_character_id::text then
          v_slots := jsonb_set(v_slots, array[v_slot.key], 'null'::jsonb, true);
        end if;
      end loop;
      v_info := coalesce(v_temp->'added'->v_character_id::text, '{}'::jsonb);
      if v_temp->'added' ? v_character_id::text
         and (coalesce(v_info->>'taskId', v_info->>'task_id', '') in ('', p_task_id::text)) then
        v_temp := jsonb_set(v_temp, '{added}', coalesce(v_temp->'added', '{}'::jsonb) - v_character_id::text, true);
      end if;
      v_info := coalesce(v_temp->'removed'->v_character_id::text, '{}'::jsonb);
      if v_temp->'removed' ? v_character_id::text
         and (coalesce(v_info->>'taskId', v_info->>'task_id', '') in ('', p_task_id::text)) then
        v_temp := jsonb_set(v_temp, '{removed}', coalesce(v_temp->'removed', '{}'::jsonb) - v_character_id::text, true);
      end if;
      if v_slots is distinct from v_row.slot_overrides or v_temp is distinct from v_row.temp_changes then
        update raid_schedule_overrides set slot_overrides = v_slots, temp_changes = v_temp where id = v_row.id;
        v_override_count := v_override_count + 1;
      end if;
    end loop;
  end if;

  for v_row in
    select id, coalesce(temp_task_changes, jsonb_build_object('added', '{}'::jsonb, 'removed', '{}'::jsonb)) as temp_task_changes
    from raid_parties
    where coalesce(is_temporary, false)
      and (v_temp_week is null or temp_week_start_date = v_temp_week)
    for update
  loop
    v_temp := v_row.temp_task_changes;
    v_info := coalesce(v_temp->'added'->v_character_id::text, '{}'::jsonb);
    if v_temp->'added' ? v_character_id::text
       and coalesce(v_info->>'taskId', v_info->>'task_id', '') in ('', p_task_id::text) then
      v_temp := jsonb_set(v_temp, '{added}', coalesce(v_temp->'added', '{}'::jsonb) - v_character_id::text, true);
    end if;
    v_info := coalesce(v_temp->'removed'->v_character_id::text, '{}'::jsonb);
    if v_temp->'removed' ? v_character_id::text
       and coalesce(v_info->>'taskId', v_info->>'task_id', '') in ('', p_task_id::text) then
      v_temp := jsonb_set(v_temp, '{removed}', coalesce(v_temp->'removed', '{}'::jsonb) - v_character_id::text, true);
    end if;
    if v_temp is distinct from v_row.temp_task_changes then
      update raid_parties set temp_task_changes = v_temp where id = v_row.id;
      v_party_change_count := v_party_change_count + 1;
    end if;
  end loop;

  delete from raid_tasks where id = p_task_id;
  return jsonb_build_object('deleted', true, 'membersRemoved', v_member_count, 'overridesUpdated', v_override_count, 'tempPartiesUpdated', v_party_change_count);
end;
$$;

create or replace function reorder_sort_order_atomic(
  p_entity text,
  p_ids uuid[]
)
returns int
language plpgsql
as $$
declare
  v_item record;
  v_count int := 0;
begin
  if p_entity not in (
    'accounts', 'characters', 'tasks', 'expedition_tasks', 'one_time_tasks',
    'raid_tasks', 'currencies', 'custom_popups', 'raid_presets', 'raid_parties'
  ) then
    raise exception 'unsupported reorder entity: %', p_entity;
  end if;
  for v_item in select id, ordinality from unnest(coalesce(p_ids, '{}'::uuid[])) with ordinality as x(id, ordinality)
  loop
    if p_entity = 'accounts' then
      update accounts set sort_order = v_item.ordinality - 1 where id = v_item.id;
    elsif p_entity = 'characters' then
      update characters set sort_order = v_item.ordinality - 1 where id = v_item.id;
    elsif p_entity = 'tasks' then
      update tasks set sort_order = v_item.ordinality - 1 where id = v_item.id;
    elsif p_entity = 'expedition_tasks' then
      update expedition_tasks set sort_order = v_item.ordinality - 1 where id = v_item.id;
    elsif p_entity = 'one_time_tasks' then
      update one_time_tasks set sort_order = v_item.ordinality - 1 where id = v_item.id;
    elsif p_entity = 'raid_tasks' then
      update raid_tasks set sort_order = v_item.ordinality - 1 where id = v_item.id;
    elsif p_entity = 'currencies' then
      update currencies set sort_order = v_item.ordinality - 1 where id = v_item.id;
    elsif p_entity = 'custom_popups' then
      update custom_popups set sort_order = v_item.ordinality - 1 where id = v_item.id;
    elsif p_entity = 'raid_presets' then
      update raid_presets set sort_order = v_item.ordinality - 1 where id = v_item.id;
    elsif p_entity = 'raid_parties' then
      update raid_parties set sort_order = v_item.ordinality - 1 where id = v_item.id;
    end if;
    if not found then raise exception '% row not found: %', p_entity, v_item.id; end if;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

create or replace function save_character_cores_atomic(p_rows jsonb)
returns jsonb
language plpgsql
as $$
declare
  v_item jsonb;
  v_character_id uuid;
  v_row character_cores%rowtype;
  v_result jsonb := '{}'::jsonb;
begin
  if jsonb_typeof(coalesce(p_rows, '[]'::jsonb)) <> 'array' then
    raise exception 'p_rows must be a JSON array';
  end if;
  for v_item in select value from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb))
  loop
    v_character_id := nullif(v_item->>'character_id', '')::uuid;
    if v_character_id is null then raise exception 'character_id is required'; end if;
    insert into character_cores(character_id, cores, updated_at)
    values(v_character_id, coalesce(v_item->'cores', '{}'::jsonb), now())
    on conflict(character_id) do update set
      cores = excluded.cores,
      updated_at = now()
    returning * into v_row;
    v_result := v_result || jsonb_build_object(v_character_id::text, v_row.id);
  end loop;
  return v_result;
end;
$$;

create or replace function save_raid_group_order_atomic(p_names text[])
returns int
language plpgsql
as $$
declare
  v_item record;
  v_count int := 0;
begin
  for v_item in select name, ordinality from unnest(coalesce(p_names, '{}'::text[])) with ordinality as x(name, ordinality)
  loop
    insert into raid_group_settings(name, sort_order)
    values(v_item.name, v_item.ordinality - 1)
    on conflict(name) do update set sort_order = excluded.sort_order;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

create or replace function save_raid_group_atomic(
  p_old_name text,
  p_name text,
  p_color text,
  p_icon_url text,
  p_hidden boolean,
  p_sort_order int
)
returns jsonb
language plpgsql
as $$
declare
  v_row raid_group_settings%rowtype;
  v_entry record;
  v_task_id uuid;
begin
  if coalesce(trim(p_name), '') = '' then raise exception 'raid group name is required'; end if;
  if coalesce(p_old_name, '') <> '' and p_old_name <> p_name
     and (exists(select 1 from raid_group_settings where name = p_name)
       or exists(select 1 from raid_presets where name = p_name)) then
    raise exception 'raid group already exists: %', p_name;
  end if;
  insert into raid_group_settings(name, icon_url, color, hidden, sort_order, updated_at)
  values(p_name, p_icon_url, coalesce(p_color, '#4caf50'), coalesce(p_hidden, false), coalesce(p_sort_order, 0), now())
  on conflict(name) do update set
    icon_url = excluded.icon_url,
    color = excluded.color,
    hidden = excluded.hidden,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning * into v_row;
  if coalesce(p_old_name, '') <> '' and p_old_name <> p_name then
    update raid_presets set name = p_name where name = p_old_name;
    update raid_tasks t set name = p_name
    where exists(select 1 from raid_presets p where p.id = t.preset_id and p.name = p_name);
    for v_entry in
      select e.value
      from raid_schedule_overrides o
      join raid_schedules s on s.id = o.schedule_id
      join raid_parties p on p.id = s.party_id
      join raid_presets r on r.id = p.preset_id
      cross join lateral jsonb_each(coalesce(o.temp_changes->'removed', '{}'::jsonb)) e
      where r.name = p_name
    loop
      v_task_id := nullif(coalesce(v_entry.value->>'taskId', v_entry.value->>'task_id'), '')::uuid;
      if v_task_id is not null then update raid_tasks set name = p_name where id = v_task_id; end if;
    end loop;
    delete from raid_group_settings where name = p_old_name;
  end if;
  return to_jsonb(v_row);
end;
$$;

create or replace function save_raid_preset_atomic(
  p_preset_id uuid,
  p_name text,
  p_difficulty text,
  p_short_name text,
  p_entry_level numeric,
  p_clear_gold numeric,
  p_bound_gold numeric,
  p_bonus_gold numeric,
  p_sort_order int
)
returns jsonb
language plpgsql
as $$
declare
  v_row raid_presets%rowtype;
  v_entry record;
  v_task_id uuid;
begin
  if p_preset_id is null then
    insert into raid_presets(name, difficulty, short_name, entry_level, clear_gold, bound_gold, bonus_gold, sort_order)
    values(p_name, p_difficulty, nullif(p_short_name, ''), coalesce(p_entry_level, 0), coalesce(p_clear_gold, 0), coalesce(p_bound_gold, 0), coalesce(p_bonus_gold, 0), coalesce(p_sort_order, 0))
    returning * into v_row;
  else
    update raid_presets set
      name = p_name,
      difficulty = p_difficulty,
      short_name = nullif(p_short_name, ''),
      entry_level = coalesce(p_entry_level, 0),
      clear_gold = coalesce(p_clear_gold, 0),
      bound_gold = coalesce(p_bound_gold, 0),
      bonus_gold = coalesce(p_bonus_gold, 0),
      sort_order = coalesce(p_sort_order, sort_order)
    where id = p_preset_id returning * into v_row;
    if not found then raise exception 'raid preset not found: %', p_preset_id; end if;
  end if;
  update raid_tasks set
    name = v_row.name,
    difficulty = coalesce(v_row.difficulty, ''),
    entry_level = coalesce(v_row.entry_level, 0),
    clear_gold = coalesce(v_row.clear_gold, 0),
    bound_gold = coalesce(v_row.bound_gold, 0),
    bonus_gold = coalesce(v_row.bonus_gold, 0)
  where preset_id = v_row.id;
  for v_entry in
    select e.value
    from raid_schedule_overrides o
    join raid_schedules s on s.id = o.schedule_id
    join raid_parties p on p.id = s.party_id
    cross join lateral jsonb_each(coalesce(o.temp_changes->'removed', '{}'::jsonb)) e
    where p.preset_id = v_row.id
  loop
    v_task_id := nullif(coalesce(v_entry.value->>'taskId', v_entry.value->>'task_id'), '')::uuid;
    if v_task_id is not null then
      update raid_tasks set
        name = v_row.name,
        difficulty = coalesce(v_row.difficulty, ''),
        entry_level = coalesce(v_row.entry_level, 0),
        clear_gold = coalesce(v_row.clear_gold, 0),
        bound_gold = coalesce(v_row.bound_gold, 0),
        bonus_gold = coalesce(v_row.bonus_gold, 0)
      where id = v_task_id;
    end if;
  end loop;
  return to_jsonb(v_row);
end;
$$;

create or replace function delete_raid_preset_atomic(p_preset_id uuid)
returns jsonb
language plpgsql
as $$
declare
  v_override record;
begin
  if not exists(select 1 from raid_presets where id = p_preset_id) then
    raise exception 'raid preset not found: %', p_preset_id;
  end if;
  for v_override in
    select o.id, coalesce(o.temp_changes, '{}'::jsonb) as temp_changes
    from raid_schedule_overrides o
    join raid_schedules s on s.id = o.schedule_id
    join raid_parties p on p.id = s.party_id
    where p.preset_id = p_preset_id for update of o
  loop
    perform restore_raid_temp_changes(v_override.temp_changes, p_preset_id);
    delete from raid_schedule_overrides where id = v_override.id;
  end loop;
  delete from raid_tasks where preset_id = p_preset_id;
  delete from raid_presets where id = p_preset_id;
  return jsonb_build_object('deleted', true);
end;
$$;

create or replace function delete_raid_group_atomic(p_name text)
returns jsonb
language plpgsql
as $$
declare
  v_preset record;
  v_count int := 0;
begin
  for v_preset in select id from raid_presets where name = p_name for update
  loop
    perform delete_raid_preset_atomic(v_preset.id);
    v_count := v_count + 1;
  end loop;
  delete from raid_group_settings where name = p_name;
  return jsonb_build_object('deletedPresets', v_count);
end;
$$;

create or replace function delete_raid_party_atomic(p_party_id uuid)
returns jsonb
language plpgsql
as $$
declare
  v_preset_id uuid;
  v_is_temporary boolean;
  v_temp_task_changes jsonb;
  v_char_ids uuid[];
  v_override record;
  v_task record;
  v_deleted_tasks int := 0;
begin
  select preset_id, coalesce(is_temporary, false), coalesce(temp_task_changes, '{}'::jsonb)
    into v_preset_id, v_is_temporary, v_temp_task_changes
  from raid_parties where id = p_party_id for update;
  if not found then raise exception 'raid party not found: %', p_party_id; end if;
  select coalesce(array_agg(character_id), '{}'::uuid[]) into v_char_ids
  from raid_party_members where party_id = p_party_id and character_id is not null;
  for v_override in
    select o.id, coalesce(o.temp_changes, '{}'::jsonb) as temp_changes
    from raid_schedule_overrides o
    join raid_schedules s on s.id = o.schedule_id
    where s.party_id = p_party_id for update of o
  loop
    perform restore_raid_temp_changes(v_override.temp_changes, v_preset_id);
    delete from raid_schedule_overrides where id = v_override.id;
  end loop;
  if v_is_temporary then
    perform restore_raid_temp_changes(v_temp_task_changes, v_preset_id);
  end if;
  delete from raid_parties where id = p_party_id;
  if v_is_temporary then
    return jsonb_build_object('deleted', true, 'deletedTasks', 0);
  end if;
  for v_task in select id, character_id from raid_tasks where preset_id = v_preset_id and character_id = any(v_char_ids) and temp_week_start_date is null
  loop
    if not exists(
      select 1 from raid_party_members m
      join raid_parties p on p.id = m.party_id
      where p.preset_id = v_preset_id and m.character_id = v_task.character_id
    ) and not exists(
      select 1 from raid_schedule_overrides o
      cross join lateral jsonb_each(coalesce(o.temp_changes->'added', '{}'::jsonb)) e
      where coalesce(e.value->>'taskId', e.value->>'task_id') = v_task.id::text
    ) then
      delete from raid_tasks where id = v_task.id;
      v_deleted_tasks := v_deleted_tasks + 1;
    end if;
  end loop;
  return jsonb_build_object('deleted', true, 'deletedTasks', v_deleted_tasks);
end;
$$;

create or replace function save_raid_party_atomic(
  p_party_id uuid,
  p_preset_id uuid,
  p_name text,
  p_party_size int,
  p_color text,
  p_sort_order int
)
returns jsonb
language plpgsql
as $$
declare
  v_row raid_parties%rowtype;
begin
  if p_preset_id is null then raise exception 'preset_id is required'; end if;
  if p_party_size not in (4, 8) then raise exception 'party_size must be 4 or 8'; end if;
  if p_party_id is null then
    insert into raid_parties(preset_id, name, party_size, color, sort_order, is_temporary, temp_week_start_date)
    values(p_preset_id, coalesce(nullif(trim(p_name), ''), '파티'), p_party_size, p_color, coalesce(p_sort_order, 0), false, null)
    returning * into v_row;
  else
    update raid_parties set
      preset_id = p_preset_id,
      name = coalesce(nullif(trim(p_name), ''), '파티'),
      party_size = p_party_size,
      color = p_color
    where id = p_party_id and not coalesce(is_temporary, false)
    returning * into v_row;
    if not found then raise exception 'raid party not found or temporary: %', p_party_id; end if;
    delete from raid_party_members where party_id = p_party_id and slot_index >= p_party_size;
  end if;
  return to_jsonb(v_row);
end;
$$;

create or replace function save_raid_schedule_order_atomic(
  p_changes jsonb
)
returns jsonb
language plpgsql
as $$
declare
  v_change jsonb;
  v_schedule raid_schedules%rowtype;
  v_override_id uuid;
  v_week text;
  v_day int;
  v_sort int;
  v_count int := 0;
  v_overrides jsonb := '{}'::jsonb;
begin
  if jsonb_typeof(coalesce(p_changes, '[]'::jsonb)) <> 'array' then
    raise exception 'p_changes must be a JSON array';
  end if;
  for v_change in select value from jsonb_array_elements(coalesce(p_changes, '[]'::jsonb))
  loop
    v_week := v_change->>'week_start_date';
    v_day := (v_change->>'day_of_week')::int;
    v_sort := (v_change->>'sort_order')::int;
    if coalesce(v_week, '') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'invalid week_start_date'; end if;
    if v_day < 0 or v_day > 6 then raise exception 'invalid day_of_week'; end if;
    select * into v_schedule
    from raid_schedules
    where id = nullif(v_change->>'schedule_id', '')::uuid
    for update;
    if not found and coalesce((v_change->>'create')::boolean, false) then
      insert into raid_schedules(
        id, party_id, day_of_week, time_str, is_fixed,
        week_start_date, sort_order, created_at
      ) values (
        nullif(v_change->>'schedule_id', '')::uuid,
        nullif(v_change->>'party_id', '')::uuid,
        v_day,
        coalesce(v_change->>'time_str', ''),
        coalesce((v_change->>'is_fixed')::boolean, false),
        case when coalesce((v_change->>'is_fixed')::boolean, false) then null else v_week end,
        v_sort,
        coalesce(nullif(v_change->>'created_at', '')::timestamptz, now())
      ) returning * into v_schedule;
    elsif not found then
      raise exception 'schedule not found: %', v_change->>'schedule_id';
    end if;
    if coalesce(v_schedule.is_fixed, false) then
      insert into raid_schedule_overrides(
        schedule_id, week_start_date, slot_overrides, temp_changes,
        schedule_overrides, is_completed
      ) values (
        v_schedule.id, v_week, '{}'::jsonb,
        jsonb_build_object('added', '{}'::jsonb, 'removed', '{}'::jsonb),
        jsonb_build_object('day_of_week', v_day, 'sort_order', v_sort), false
      )
      on conflict(schedule_id, week_start_date) do update set
        schedule_overrides = coalesce(raid_schedule_overrides.schedule_overrides, '{}'::jsonb)
          || excluded.schedule_overrides
      returning id into v_override_id;
      v_overrides := v_overrides || jsonb_build_object(v_schedule.id::text || '_' || v_week, v_override_id);
    else
      update raid_schedules set
        day_of_week = v_day,
        sort_order = v_sort,
        week_start_date = v_week
      where id = v_schedule.id;
    end if;
    v_count := v_count + 1;
  end loop;
  return jsonb_build_object('count', v_count, 'overrides', v_overrides);
end;
$$;

create or replace function filter_raid_temp_changes_for_tasks(
  p_temp_changes jsonb,
  p_skip_task_ids uuid[]
)
returns jsonb
language plpgsql
immutable
as $$
declare
  v_result jsonb := coalesce(p_temp_changes, jsonb_build_object('added', '{}'::jsonb, 'removed', '{}'::jsonb));
  v_entry record;
  v_task_id uuid;
begin
  for v_entry in select key, value from jsonb_each(coalesce(v_result->'added', '{}'::jsonb))
  loop
    v_task_id := nullif(coalesce(v_entry.value->>'taskId', v_entry.value->>'task_id'), '')::uuid;
    if v_task_id is not null and v_task_id = any(coalesce(p_skip_task_ids, '{}'::uuid[])) then
      v_result := jsonb_set(v_result, '{added}', coalesce(v_result->'added', '{}'::jsonb) - v_entry.key, true);
    end if;
  end loop;
  for v_entry in select key, value from jsonb_each(coalesce(v_result->'removed', '{}'::jsonb))
  loop
    v_task_id := nullif(coalesce(v_entry.value->>'taskId', v_entry.value->>'task_id'), '')::uuid;
    if v_task_id is not null and v_task_id = any(coalesce(p_skip_task_ids, '{}'::uuid[])) then
      v_result := jsonb_set(v_result, '{removed}', coalesce(v_result->'removed', '{}'::jsonb) - v_entry.key, true);
    end if;
  end loop;
  return v_result;
end;
$$;

create or replace function apply_party_generation_atomic(
  p_parties jsonb,
  p_delete_party_ids uuid[] default '{}'::uuid[],
  p_task_mutations jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
as $$
declare
  v_party jsonb;
  v_slot record;
  v_override record;
  v_party_id uuid;
  v_existing_preset_id uuid;
  v_mutated_task_ids uuid[];
  v_count int := 0;
  v_task_count int;
begin
  if jsonb_typeof(coalesce(p_parties, '[]'::jsonb)) <> 'array' then
    raise exception 'p_parties must be a JSON array';
  end if;
  select coalesce(array_agg(task_id), '{}'::uuid[]) into v_mutated_task_ids
  from (
    select nullif(coalesce(value->>'id', value->'record'->>'id'), '')::uuid as task_id
    from jsonb_array_elements(coalesce(p_task_mutations, '[]'::jsonb))
  ) x where task_id is not null;
  for v_party in select value from jsonb_array_elements(coalesce(p_parties, '[]'::jsonb))
  loop
    v_party_id := nullif(v_party->>'id', '')::uuid;
    if v_party_id is null then
      insert into raid_parties(preset_id, name, party_size, sort_order, is_temporary, temp_week_start_date)
      values(
        nullif(v_party->>'preset_id', '')::uuid,
        coalesce(nullif(v_party->>'name', ''), '파티'),
        greatest(1, coalesce((v_party->>'party_size')::int, 4)),
        coalesce((v_party->>'sort_order')::int, 0),
        false,
        null
      ) returning id into v_party_id;
    else
      select preset_id into v_existing_preset_id
      from raid_parties where id = v_party_id and not coalesce(is_temporary, false) for update;
      if not found then raise exception 'party not found or temporary: %', v_party_id; end if;
      for v_override in
        select o.id, coalesce(o.temp_changes, '{}'::jsonb) as temp_changes
        from raid_schedule_overrides o
        join raid_schedules s on s.id = o.schedule_id
        where s.party_id = v_party_id for update of o
      loop
        perform restore_raid_temp_changes(filter_raid_temp_changes_for_tasks(v_override.temp_changes, v_mutated_task_ids), v_existing_preset_id);
        update raid_schedule_overrides
        set slot_overrides = '{}'::jsonb,
            temp_changes = jsonb_build_object('added', '{}'::jsonb, 'removed', '{}'::jsonb)
        where id = v_override.id;
      end loop;
      update raid_parties set
        preset_id = nullif(v_party->>'preset_id', '')::uuid,
        name = coalesce(nullif(v_party->>'name', ''), '파티'),
        party_size = greatest(1, coalesce((v_party->>'party_size')::int, 4)),
        sort_order = coalesce((v_party->>'sort_order')::int, 0)
      where id = v_party_id and not coalesce(is_temporary, false);
      delete from raid_party_members where party_id = v_party_id;
    end if;
    for v_slot in
      select value, ordinality from jsonb_array_elements(coalesce(v_party->'slots', '[]'::jsonb)) with ordinality
    loop
      if nullif(v_slot.value#>>'{}', '') is not null then
        insert into raid_party_members(party_id, character_id, slot_index)
        values(v_party_id, nullif(v_slot.value#>>'{}', '')::uuid, v_slot.ordinality - 1);
      end if;
    end loop;
    v_count := v_count + 1;
  end loop;

  if coalesce(array_length(p_delete_party_ids, 1), 0) > 0 then
    for v_party_id, v_existing_preset_id in
      select id, preset_id from raid_parties
      where id = any(p_delete_party_ids) and not coalesce(is_temporary, false)
      for update
    loop
      for v_override in
        select o.id, coalesce(o.temp_changes, '{}'::jsonb) as temp_changes
        from raid_schedule_overrides o
        join raid_schedules s on s.id = o.schedule_id
        where s.party_id = v_party_id for update of o
      loop
        perform restore_raid_temp_changes(filter_raid_temp_changes_for_tasks(v_override.temp_changes, v_mutated_task_ids), v_existing_preset_id);
        delete from raid_schedule_overrides where id = v_override.id;
      end loop;
    end loop;
    delete from raid_parties where id = any(p_delete_party_ids) and not coalesce(is_temporary, false);
  end if;
  v_task_count := apply_raid_task_mutations(p_task_mutations);
  return jsonb_build_object('parties', v_count, 'taskMutations', v_task_count);
end;
$$;

create or replace function update_raid_schedule_atomic(
  p_schedule_id uuid,
  p_party_id uuid,
  p_day_of_week int,
  p_time_str text,
  p_is_fixed boolean,
  p_week_start_date text
)
returns jsonb
language plpgsql
as $$
declare
  v_old_party_id uuid;
  v_old_fixed boolean;
  v_old_preset_id uuid;
  v_override record;
  v_row raid_schedules%rowtype;
begin
  if p_day_of_week < 0 or p_day_of_week > 6 then raise exception 'invalid day_of_week'; end if;
  if not p_is_fixed and coalesce(p_week_start_date, '') !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception 'week_start_date is required for non-fixed schedule';
  end if;

  select s.party_id, coalesce(s.is_fixed, false), p.preset_id
    into v_old_party_id, v_old_fixed, v_old_preset_id
  from raid_schedules s
  join raid_parties p on p.id = s.party_id
  where s.id = p_schedule_id
  for update of s;
  if not found then raise exception 'schedule not found: %', p_schedule_id; end if;

  if v_old_party_id is distinct from p_party_id or v_old_fixed is distinct from p_is_fixed then
    for v_override in
      select id, coalesce(temp_changes, '{}'::jsonb) as temp_changes
      from raid_schedule_overrides where schedule_id = p_schedule_id for update
    loop
      perform restore_raid_temp_changes(v_override.temp_changes, v_old_preset_id);
      delete from raid_schedule_overrides where id = v_override.id;
    end loop;
  end if;

  update raid_schedules set
    party_id = p_party_id,
    day_of_week = p_day_of_week,
    time_str = coalesce(p_time_str, ''),
    is_fixed = p_is_fixed,
    week_start_date = case when p_is_fixed then null else p_week_start_date end
  where id = p_schedule_id
  returning * into v_row;
  return to_jsonb(v_row);
end;
$$;

create or replace function create_raid_temp_party_atomic(
  p_preset_id uuid,
  p_name text,
  p_party_size int,
  p_week_start_date text,
  p_slots jsonb,
  p_temp_task_changes jsonb,
  p_task_mutations jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
as $$
declare
  v_party raid_parties%rowtype;
  v_slot record;
begin
  if coalesce(p_week_start_date, '') !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception 'invalid temporary party week_start_date';
  end if;
  insert into raid_parties(
    preset_id, name, party_size, sort_order, is_temporary,
    temp_week_start_date, temp_task_changes
  ) values (
    p_preset_id,
    coalesce(nullif(p_name, ''), '임시 파티'),
    greatest(1, p_party_size),
    (select count(*) from raid_parties where preset_id = p_preset_id),
    true,
    p_week_start_date,
    coalesce(p_temp_task_changes, jsonb_build_object('added', '{}'::jsonb, 'removed', '{}'::jsonb))
  ) returning * into v_party;

  for v_slot in select value, ordinality from jsonb_array_elements(coalesce(p_slots, '[]'::jsonb)) with ordinality
  loop
    if nullif(v_slot.value#>>'{}', '') is not null then
      insert into raid_party_members(party_id, character_id, slot_index)
      values(v_party.id, nullif(v_slot.value#>>'{}', '')::uuid, v_slot.ordinality - 1);
    end if;
  end loop;
  perform apply_raid_task_mutations(p_task_mutations);
  return to_jsonb(v_party);
end;
$$;

drop function if exists set_raid_party_member_atomic(uuid, int, uuid, uuid[], jsonb, jsonb);
create or replace function set_raid_party_member_atomic(
  p_party_id uuid,
  p_slot_index int,
  p_character_id uuid,
  p_duplicate_member_ids uuid[] default '{}'::uuid[],
  p_task_mutations jsonb default '[]'::jsonb,
  p_temp_task_changes jsonb default null,
  p_other_temp_party_changes jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
as $$
declare
  v_is_temporary boolean;
  v_other jsonb;
begin
  select coalesce(is_temporary, false) into v_is_temporary
  from raid_parties where id = p_party_id for update;
  if not found then raise exception 'party not found: %', p_party_id; end if;
  if coalesce(array_length(p_duplicate_member_ids, 1), 0) > 0 then
    delete from raid_party_members where id = any(p_duplicate_member_ids);
  end if;
  delete from raid_party_members where party_id = p_party_id and slot_index = p_slot_index;
  if p_character_id is not null then
    insert into raid_party_members(party_id, character_id, slot_index)
    values(p_party_id, p_character_id, p_slot_index);
  end if;
  if v_is_temporary and p_temp_task_changes is not null then
    update raid_parties set temp_task_changes = p_temp_task_changes where id = p_party_id;
  end if;
  for v_other in select value from jsonb_array_elements(coalesce(p_other_temp_party_changes, '[]'::jsonb))
  loop
    update raid_parties
    set temp_task_changes = coalesce(v_other->'temp_task_changes', jsonb_build_object('added', '{}'::jsonb, 'removed', '{}'::jsonb))
    where id = nullif(v_other->>'party_id', '')::uuid and coalesce(is_temporary, false);
    if not found then raise exception 'other temporary party not found: %', v_other->>'party_id'; end if;
  end loop;
  perform apply_raid_task_mutations(p_task_mutations);
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function cleanup_raid_week_rollover_atomic()
returns jsonb
language plpgsql
as $$
declare
  v_game_date date;
  v_current_week text;
  v_keep_week text;
  v_override record;
  v_party record;
  v_restored int := 0;
  v_marked_parties int := 0;
  v_deleted_schedules int := 0;
  v_deleted_parties int := 0;
begin
  perform pg_advisory_xact_lock(hashtext('loa_cleanup_raid_week_rollover'));
  v_game_date := (timezone('Asia/Seoul', now()) - interval '6 hours')::date;
  v_current_week := to_char(v_game_date - mod(extract(dow from v_game_date)::int - 3 + 7, 7), 'YYYY-MM-DD');
  v_keep_week := to_char((v_current_week::date - 14), 'YYYY-MM-DD');

  for v_override in
    select o.id, o.schedule_id, o.week_start_date, coalesce(o.temp_changes, '{}'::jsonb) as temp_changes, p.preset_id
    from raid_schedule_overrides o
    join raid_schedules s on s.id = o.schedule_id
    join raid_parties p on p.id = s.party_id
    where o.week_start_date < v_current_week
      and not coalesce((o.temp_changes->>'_restored')::boolean, false)
    for update of o
  loop
    if exists(select 1 from jsonb_object_keys(coalesce(v_override.temp_changes->'added', '{}'::jsonb)))
       or exists(select 1 from jsonb_object_keys(coalesce(v_override.temp_changes->'removed', '{}'::jsonb))) then
      perform restore_raid_temp_links_only(v_override.temp_changes, v_override.preset_id);
      v_restored := v_restored + 1;
    end if;
    update raid_schedule_overrides
    set temp_changes = jsonb_set(v_override.temp_changes, '{_restored}', 'true'::jsonb, true)
    where id = v_override.id;
  end loop;

  for v_party in
    select id, preset_id, coalesce(temp_task_changes, '{}'::jsonb) as temp_task_changes
    from raid_parties
    where coalesce(is_temporary, false)
      and temp_week_start_date is not null
      and temp_week_start_date < v_current_week
      and not coalesce((temp_task_changes->>'_restored')::boolean, false)
    for update
  loop
    perform restore_raid_temp_links_only(v_party.temp_task_changes, v_party.preset_id);
    update raid_parties
    set temp_task_changes = jsonb_set(v_party.temp_task_changes, '{_restored}', 'true'::jsonb, true)
    where id = v_party.id;
    v_marked_parties := v_marked_parties + 1;
  end loop;

  for v_override in
    select o.id, coalesce(o.temp_changes, '{}'::jsonb) as temp_changes, p.preset_id
    from raid_schedule_overrides o
    join raid_schedules s on s.id = o.schedule_id
    join raid_parties p on p.id = s.party_id
    where o.week_start_date < v_keep_week
    for update of o
  loop
    perform restore_raid_temp_changes(v_override.temp_changes, v_override.preset_id);
    delete from raid_schedule_overrides where id = v_override.id;
  end loop;

  for v_party in
    select id, preset_id, coalesce(temp_task_changes, '{}'::jsonb) as temp_task_changes
    from raid_parties
    where coalesce(is_temporary, false)
      and temp_week_start_date is not null
      and temp_week_start_date < v_keep_week
    for update
  loop
    perform restore_raid_temp_changes(v_party.temp_task_changes, v_party.preset_id);
    delete from raid_parties where id = v_party.id;
    v_deleted_parties := v_deleted_parties + 1;
  end loop;

  delete from raid_tasks
  where temp_week_start_date is not null
    and temp_week_start_date < v_keep_week
    and raid_task_temp_reference_count(id) = 0;

  with deleted as (
    delete from raid_schedules
    where not coalesce(is_fixed, false)
      and coalesce(week_start_date, '') <> ''
      and week_start_date < v_keep_week
    returning id
  ) select count(*) into v_deleted_schedules from deleted;

  delete from share_links
  where expires_at < now() - interval '30 days'
     or (revoked_at is not null and revoked_at < now() - interval '30 days');

  return jsonb_build_object(
    'currentWeek', v_current_week,
    'restoredOverrides', v_restored,
    'restoredTempParties', v_marked_parties,
    'deletedSchedules', v_deleted_schedules,
    'deletedTempParties', v_deleted_parties
  );
end;
$$;

grant execute on function apply_task_pause_atomic(boolean, jsonb) to anon, authenticated;
grant execute on function clone_task_tree_atomic(boolean, uuid, uuid[]) to anon, authenticated;
grant execute on function raid_task_temp_reference_count(uuid) to anon, authenticated;
grant execute on function restore_raid_temp_links_only(jsonb, uuid) to anon, authenticated;
grant execute on function apply_raid_task_mutations(jsonb) to anon, authenticated;
grant execute on function apply_raid_override_changes_atomic(jsonb, jsonb) to anon, authenticated;
grant execute on function delete_raid_task_and_links_atomic(uuid) to anon, authenticated;
grant execute on function reorder_sort_order_atomic(text, uuid[]) to anon, authenticated;
grant execute on function save_character_cores_atomic(jsonb) to anon, authenticated;
grant execute on function save_raid_group_order_atomic(text[]) to anon, authenticated;
grant execute on function save_raid_group_atomic(text, text, text, text, boolean, int) to anon, authenticated;
grant execute on function save_raid_preset_atomic(uuid, text, text, text, numeric, numeric, numeric, numeric, int) to anon, authenticated;
grant execute on function delete_raid_preset_atomic(uuid) to anon, authenticated;
grant execute on function delete_raid_group_atomic(text) to anon, authenticated;
grant execute on function delete_raid_party_atomic(uuid) to anon, authenticated;
grant execute on function save_raid_party_atomic(uuid, uuid, text, int, text, int) to anon, authenticated;
grant execute on function save_raid_schedule_order_atomic(jsonb) to anon, authenticated;
grant execute on function apply_party_generation_atomic(jsonb, uuid[], jsonb) to anon, authenticated;
grant execute on function update_raid_schedule_atomic(uuid, uuid, int, text, boolean, text) to anon, authenticated;
grant execute on function create_raid_temp_party_atomic(uuid, text, int, text, jsonb, jsonb, jsonb) to anon, authenticated;
grant execute on function set_raid_party_member_atomic(uuid, int, uuid, uuid[], jsonb, jsonb, jsonb) to anon, authenticated;
grant execute on function cleanup_raid_week_rollover_atomic() to anon, authenticated;

create index if not exists idx_raid_tasks_temp_week on raid_tasks(temp_week_start_date) where temp_week_start_date is not null;

create index if not exists idx_raid_schedules_week
  on raid_schedules(week_start_date, is_fixed, day_of_week, sort_order);
