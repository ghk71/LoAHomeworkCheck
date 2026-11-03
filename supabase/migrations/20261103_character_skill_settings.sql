begin;

alter table public.characters add column if not exists skill_settings jsonb not null default '[]'::jsonb;

notify pgrst, 'reload schema';
commit;
