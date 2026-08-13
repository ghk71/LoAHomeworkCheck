-- 2026-08-13: atomic task/schedule operations, one-time cleanup, expiring share links

alter table tasks add column if not exists is_paused boolean default false;
alter table expedition_tasks add column if not exists is_paused boolean default false;

alter table share_links add column if not exists expires_at timestamptz;
alter table share_links add column if not exists revoked_at timestamptz;
update share_links
set expires_at = coalesce(expires_at, created_at + interval '30 days', now() + interval '30 days')
where expires_at is null;
alter table share_links alter column expires_at set default (now() + interval '30 days');
alter table share_links alter column expires_at set not null;
create index if not exists idx_share_links_expires on share_links(expires_at) where revoked_at is null;

create or replace function cleanup_character_one_time_tasks()
returns trigger
language plpgsql
as $$
begin
  delete from one_time_tasks where owner_type = 'character' and owner_id = old.id;
  return old;
end;
$$;

drop trigger if exists trg_cleanup_character_one_time_tasks on characters;
create trigger trg_cleanup_character_one_time_tasks
after delete on characters
for each row execute function cleanup_character_one_time_tasks();

create or replace function cleanup_account_one_time_tasks()
returns trigger
language plpgsql
as $$
begin
  delete from one_time_tasks where owner_type = 'account' and owner_id = old.id;
  return old;
end;
$$;

drop trigger if exists trg_cleanup_account_one_time_tasks on accounts;
create trigger trg_cleanup_account_one_time_tasks
after delete on accounts
for each row execute function cleanup_account_one_time_tasks();

delete from one_time_tasks t
where t.owner_type = 'character'
  and not exists (select 1 from characters c where c.id = t.owner_id);
delete from one_time_tasks t
where t.owner_type = 'account'
  and not exists (select 1 from accounts a where a.id = t.owner_id);

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
  v_restored int := 0;
begin
  for v_entry in select * from jsonb_each(coalesce(p_temp_changes->'added', '{}'::jsonb))
  loop
    v_info := v_entry.value;
    v_task_id := nullif(coalesce(v_info->>'taskId', v_info->>'task_id'), '')::uuid;
    v_was_new := coalesce(nullif(coalesce(v_info->>'wasNew', v_info->>'was_new'), '')::boolean, false);
    v_had_preset := coalesce(nullif(coalesce(v_info->>'hadPreset', v_info->>'had_preset'), '')::boolean, false);
    if v_task_id is null then continue; end if;

    if v_was_new then
      delete from raid_tasks where id = v_task_id;
    elsif v_had_preset and p_preset_id is not null then
      update raid_tasks set preset_id = p_preset_id where id = v_task_id;
    else
      update raid_tasks set preset_id = null where id = v_task_id;
    end if;
    v_restored := v_restored + 1;
  end loop;

  for v_entry in select * from jsonb_each(coalesce(p_temp_changes->'removed', '{}'::jsonb))
  loop
    v_info := v_entry.value;
    v_task_id := nullif(coalesce(v_info->>'taskId', v_info->>'task_id'), '')::uuid;
    v_had_preset := coalesce(nullif(coalesce(v_info->>'hadPreset', v_info->>'had_preset'), '')::boolean, false);
    if v_task_id is not null and v_had_preset and p_preset_id is not null then
      update raid_tasks set preset_id = p_preset_id where id = v_task_id;
      v_restored := v_restored + 1;
    end if;
  end loop;

  return jsonb_build_object('restored', v_restored);
end;
$$;

create or replace function restore_raid_schedule_override_atomic(
  p_override_id uuid,
  p_mode text default 'clear_all'
)
returns jsonb
language plpgsql
as $$
declare
  v_temp_changes jsonb;
  v_preset_id uuid;
  v_result jsonb;
begin
  if p_mode not in ('clear_temp', 'clear_all', 'delete') then
    raise exception 'invalid restore mode: %', p_mode;
  end if;

  select coalesce(o.temp_changes, '{}'::jsonb), p.preset_id
    into v_temp_changes, v_preset_id
  from raid_schedule_overrides o
  join raid_schedules s on s.id = o.schedule_id
  join raid_parties p on p.id = s.party_id
  where o.id = p_override_id
  for update of o;
  if not found then raise exception 'schedule override not found: %', p_override_id; end if;

  v_result := restore_raid_temp_changes(v_temp_changes, v_preset_id);
  if p_mode = 'delete' then
    delete from raid_schedule_overrides where id = p_override_id;
  elsif p_mode = 'clear_all' then
    update raid_schedule_overrides
    set slot_overrides = '{}'::jsonb,
        temp_changes = jsonb_build_object('added', '{}'::jsonb, 'removed', '{}'::jsonb),
        schedule_overrides = '{}'::jsonb
    where id = p_override_id;
  else
    update raid_schedule_overrides
    set temp_changes = jsonb_build_object('added', '{}'::jsonb, 'removed', '{}'::jsonb)
    where id = p_override_id;
  end if;

  return v_result || jsonb_build_object('mode', p_mode);
end;
$$;

create or replace function delete_raid_schedule_atomic(p_schedule_id uuid)
returns jsonb
language plpgsql
as $$
declare
  v_override record;
  v_preset_id uuid;
  v_restored int := 0;
begin
  select p.preset_id into v_preset_id
  from raid_schedules s
  join raid_parties p on p.id = s.party_id
  where s.id = p_schedule_id
  for update of s;
  if not found then raise exception 'schedule not found: %', p_schedule_id; end if;

  for v_override in
    select id, coalesce(temp_changes, '{}'::jsonb) as temp_changes
    from raid_schedule_overrides
    where schedule_id = p_schedule_id
    for update
  loop
    perform restore_raid_temp_changes(v_override.temp_changes, v_preset_id);
    delete from raid_schedule_overrides where id = v_override.id;
    v_restored := v_restored + 1;
  end loop;

  delete from raid_schedules where id = p_schedule_id;
  return jsonb_build_object('deleted', true, 'restoredOverrides', v_restored);
end;
$$;

grant execute on function apply_task_pause_atomic(boolean, jsonb) to anon, authenticated;
grant execute on function restore_raid_temp_changes(jsonb, uuid) to anon, authenticated;
grant execute on function restore_raid_schedule_override_atomic(uuid, text) to anon, authenticated;
grant execute on function delete_raid_schedule_atomic(uuid) to anon, authenticated;
