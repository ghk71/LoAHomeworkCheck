-- Multiple opening weekdays; legacy activate_day and existing progress stay untouched.
begin;
alter table public.tasks add column if not exists active_days int[];
alter table public.expedition_tasks add column if not exists active_days int[];
do $$
declare tab text;
begin
  foreach tab in array array['tasks','expedition_tasks'] loop
    if not exists(select 1 from pg_constraint where conrelid=('public.'||tab)::regclass and conname=tab||'_active_days_check') then
      execute format('alter table public.%I add constraint %I check (active_days is null or (reset_type=''daily'' and cardinality(active_days) between 1 and 7 and array_position(active_days,null) is null and active_days <@ array[0,1,2,3,4,5,6]))',tab,tab||'_active_days_check');
    end if;
  end loop;
end;
$$;
create or replace function task_shared_config(p_row jsonb)
returns jsonb language sql immutable as $$
  select coalesce(jsonb_object_agg(key,value), '{}'::jsonb) from jsonb_each(p_row)
  where key = any(array['name','icon_url','reset_type','reset_day','activate_day','active_days',
    'count_max','count_daily_limit','rest_enabled','rest_max','rest_charge',
    'rest_consume','rest_threshold','rest_daily_limit']);
$$;
notify pgrst,'reload schema';
commit;
