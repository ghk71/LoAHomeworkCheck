-- Prevent concurrent child-task saves from leaving an ancestor in a stale completion state.

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
  v_changed_ids uuid[] := '{}'::uuid[];
  v_parent_ids uuid[] := '{}'::uuid[];
  v_parent_id uuid;
  v_parent_done boolean;
  v_parent_completed_at timestamptz;
  v_parent_rows jsonb := '[]'::jsonb;
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
    v_changed_ids := array_append(v_changed_ids, v_id);
    v_count := v_count + 1;
  end loop;

  if cardinality(v_changed_ids) > 0 then
    if p_is_expedition then
      with recursive seed(id, depth) as (
        select task.id, 0
        from expedition_tasks task
        where task.id = any(v_changed_ids)
          and exists(select 1 from expedition_tasks child where child.parent_id = task.id)
        union
        select task.parent_id, 1
        from expedition_tasks task
        where task.id = any(v_changed_ids) and task.parent_id is not null
      ), affected(id, depth) as (
        select id, depth from seed
        union all
        select task.parent_id, affected.depth + 1
        from affected
        join expedition_tasks task on task.id = affected.id
        where task.parent_id is not null
      )
      select coalesce(array_agg(id order by depth, id), '{}'::uuid[])
      into v_parent_ids
      from (
        select id, min(depth) as depth
        from affected
        where id is not null
        group by id
      ) ordered_parents;

      if cardinality(v_parent_ids) > 0 then
        perform 1
        from expedition_tasks
        where id = any(v_parent_ids)
        order by id
        for update;

        foreach v_parent_id in array v_parent_ids
        loop
          select count(*) > 0 and coalesce(bool_and(coalesce(is_completed, false)), false)
          into v_parent_done
          from expedition_tasks
          where parent_id = v_parent_id and not coalesce(is_paused, false);

          update expedition_tasks
          set is_completed = v_parent_done,
              last_completed_at = case
                when v_parent_done then case
                  when is_completed and last_completed_at is not null then last_completed_at
                  else now()
                end
                else null
              end
          where id = v_parent_id
          returning last_completed_at into v_parent_completed_at;

          if found then
            v_parent_rows := v_parent_rows || jsonb_build_array(jsonb_build_object(
              'id', v_parent_id,
              'is_completed', v_parent_done,
              'last_completed_at', v_parent_completed_at
            ));
          end if;
        end loop;
      end if;
    else
      with recursive seed(id, depth) as (
        select task.id, 0
        from tasks task
        where task.id = any(v_changed_ids)
          and exists(select 1 from tasks child where child.parent_id = task.id)
        union
        select task.parent_id, 1
        from tasks task
        where task.id = any(v_changed_ids) and task.parent_id is not null
      ), affected(id, depth) as (
        select id, depth from seed
        union all
        select task.parent_id, affected.depth + 1
        from affected
        join tasks task on task.id = affected.id
        where task.parent_id is not null
      )
      select coalesce(array_agg(id order by depth, id), '{}'::uuid[])
      into v_parent_ids
      from (
        select id, min(depth) as depth
        from affected
        where id is not null
        group by id
      ) ordered_parents;

      if cardinality(v_parent_ids) > 0 then
        perform 1
        from tasks
        where id = any(v_parent_ids)
        order by id
        for update;

        foreach v_parent_id in array v_parent_ids
        loop
          select count(*) > 0 and coalesce(bool_and(coalesce(is_completed, false)), false)
          into v_parent_done
          from tasks
          where parent_id = v_parent_id and not coalesce(is_paused, false);

          update tasks
          set is_completed = v_parent_done,
              last_completed_at = case
                when v_parent_done then case
                  when is_completed and last_completed_at is not null then last_completed_at
                  else now()
                end
                else null
              end
          where id = v_parent_id
          returning last_completed_at into v_parent_completed_at;

          if found then
            v_parent_rows := v_parent_rows || jsonb_build_array(jsonb_build_object(
              'id', v_parent_id,
              'is_completed', v_parent_done,
              'last_completed_at', v_parent_completed_at
            ));
          end if;
        end loop;
      end if;
    end if;
  end if;

  return jsonb_build_object('updated', v_count, 'parents', v_parent_rows);
end;
$$;

grant execute on function apply_task_pause_atomic(boolean, jsonb) to anon, authenticated;
