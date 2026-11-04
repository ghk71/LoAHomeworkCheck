-- OPTIONAL: run after 20261104_task_active_days.sql.
-- Consolidate only simple root checklists with an explicit weekday suffix.
-- Originals are backed up; redundant rows are paused, never deleted.
begin;
lock table public.expedition_tasks in share row exclusive mode;
create table if not exists public.account_event_task_backup_20261104 (
  task_id uuid primary key,
  original_row jsonb not null,
  backed_up_at timestamptz not null default now()
);
do $$
declare
  family record;
  keeper uuid;
  completion timestamptz;
  boundary timestamptz := (date_trunc('day',now() at time zone 'Asia/Seoul' - interval '6 hours') + interval '6 hours') at time zone 'Asia/Seoul';
begin
  for family in
    select t.account_id,
      case when t.name ~ '^카오스' then '카오스게이트' else '필드보스' end as label,
      array_agg(t.id order by t.sort_order nulls last,t.created_at,t.id) as ids
    from public.expedition_tasks t
    where t.account_id is not null and t.parent_id is null
      and not coalesce(t.is_paused,false) and not coalesce(t.rest_enabled,false)
      and t.count_max is null and t.active_days is null
      and t.reset_type in ('daily','weekly')
      and t.name ~ '^(카오스[[:space:]]*게이트|필드[[:space:]]*보스)[[:space:]]*\([월화수목금토일](요일)?\)$'
      and not exists(select 1 from public.expedition_tasks child where child.parent_id=t.id)
      and not exists(select 1 from public.account_event_task_backup_20261104 backup where backup.task_id=t.id)
      and not exists(
        select 1 from public.expedition_tasks other
        where other.account_id=t.account_id and other.active_days is not null
          and regexp_replace(other.name,'[[:space:]]','','g')=case when t.name ~ '^카오스' then '카오스게이트' else '필드보스' end
      )
    group by t.account_id,case when t.name ~ '^카오스' then '카오스게이트' else '필드보스' end
  loop
    keeper:=family.ids[1];
    insert into public.account_event_task_backup_20261104(task_id,original_row)
      select id,to_jsonb(t) from public.expedition_tasks t where id=any(family.ids)
      on conflict do nothing;
    select max(last_completed_at) into completion from public.expedition_tasks
      where id=any(family.ids) and is_completed and last_completed_at>=boundary and last_completed_at<=now();
    update public.expedition_tasks
      set name=family.label,reset_type='daily',activate_day=null,
        active_days=case when family.label='카오스게이트' then array[1,4,6,0] else array[2,5,0] end,
        is_completed=completion is not null,last_completed_at=completion,
        count_current=0
      where id=keeper;
    update public.expedition_tasks set is_paused=true
      where id=any(family.ids) and id<>keeper;
  end loop;
end;
$$;
commit;
