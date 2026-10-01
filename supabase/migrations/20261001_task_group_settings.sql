-- Update only shared configuration. Per-owner progress and pause state stay intact.
create or replace function update_task_group_settings_atomic(
  p_is_expedition boolean,
  p_source_id uuid,
  p_group_id uuid,
  p_target_ids uuid[],
  p_settings jsonb
)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_table text := case when p_is_expedition then 'expedition_tasks' else 'tasks' end;
  v_ids uuid[];
  v_count int;
  v_assignments text;
begin
  if p_is_expedition is null or p_source_id is null or p_group_id is null then
    raise exception 'source task and clone group are required';
  end if;
  select coalesce(array_agg(distinct id order by id), '{}'::uuid[])
  into v_ids from unnest(p_target_ids) as targets(id) where id is not null;
  if cardinality(v_ids) = 0 or not (p_source_id = any(v_ids)) then
    raise exception 'targets must include the source task';
  end if;
  if p_settings is null or jsonb_typeof(p_settings) <> 'object' or p_settings = '{}'::jsonb then
    raise exception 'settings must be a nonempty JSON object';
  end if;
  if exists (
    select 1 from jsonb_object_keys(p_settings) as fields(key)
    where key <> all(array[
      'name','icon_url','reset_type','reset_day','activate_day','count_max',
      'count_daily_limit','rest_enabled','rest_max','rest_charge','rest_consume',
      'rest_threshold','rest_daily_limit'
    ])
  ) then
    raise exception 'only shared task settings can be changed';
  end if;
  if p_settings ? 'name' and coalesce(length(btrim(p_settings->>'name')), 0) = 0 then
    raise exception 'task name is required';
  end if;
  if p_settings ? 'reset_type' and coalesce(p_settings->>'reset_type', '') not in ('daily','weekly','monthly') then
    raise exception 'invalid reset type';
  end if;

  -- Lock the same rows in the same order, then verify the preview still matches.
  execute format('select id from public.%I where id = any($1) order by id for update', v_table)
    using v_ids;
  execute format('select count(*) from public.%I where id = any($1) and clone_group_id = $2', v_table)
    into v_count using v_ids, p_group_id;
  if v_count <> cardinality(v_ids) then
    raise exception 'task group changed; reopen the task editor';
  end if;

  select string_agg(
    format('%1$I = (jsonb_populate_record(null::public.%2$I, $1)).%1$I', key, v_table),
    ', ' order by key
  ) into v_assignments from jsonb_object_keys(p_settings) as fields(key);
  execute format('update public.%I set %s where id = any($2) and clone_group_id = $3', v_table, v_assignments)
    using p_settings, v_ids, p_group_id;
  get diagnostics v_count = row_count;
  return jsonb_build_object('updated', v_count);
end;
$$;

grant execute on function update_task_group_settings_atomic(boolean, uuid, uuid, uuid[], jsonb) to anon, authenticated;
