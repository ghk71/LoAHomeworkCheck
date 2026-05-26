-- 화요일 오후 8시(KST)에 미완료 숙제 요약을 Discord로 전송합니다.
-- 사전 준비:
-- 1. send-homework-discord Edge Function 배포
-- 2. Supabase Secret 설정:
--    - DISCORD_HOMEWORK_WEBHOOK_URL 또는 DISCORD_RAID_WEBHOOK_URL
--    - SUPABASE_SERVICE_ROLE_KEY
-- 3. Vault Secret 설정:
--    select vault.create_secret('https://프로젝트-ref.supabase.co', 'project_url');
--    select vault.create_secret('프로젝트 anon/publishable key', 'publishable_key');

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'send-homework-discord-tue-20-kst',
  '0 11 * * 2',
  $$
  select
    net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/send-homework-discord',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'publishable_key')
      ),
      body := '{"source":"cron","includeFilterHidden":false}'::jsonb
    ) as request_id;
  $$
);
