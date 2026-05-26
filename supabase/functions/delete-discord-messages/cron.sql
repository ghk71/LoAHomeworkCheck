-- Discord Webhook으로 보낸 메시지를 정해진 시각에 삭제합니다.
-- KST 기준:
-- - 레이드 일정 메시지: 매주 화요일 22:00
-- - 미완료 숙제 메시지: 매주 수요일 06:00
--
-- 사전 준비:
-- 1. delete-discord-messages Edge Function 배포
-- 2. discord_sent_messages 테이블 생성
-- 3. Supabase Secret 설정:
--    - DISCORD_RAID_WEBHOOK_URL
--    - DISCORD_HOMEWORK_WEBHOOK_URL 또는 DISCORD_RAID_WEBHOOK_URL
--    - SUPABASE_SERVICE_ROLE_KEY
-- 4. Vault Secret 설정:
--    select vault.create_secret('https://프로젝트-ref.supabase.co', 'project_url');
--    select vault.create_secret('프로젝트 anon/publishable key', 'publishable_key');

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- 화요일 22:00 KST = 화요일 13:00 UTC
select cron.schedule(
  'delete-raid-discord-messages-tue-22-kst',
  '0 13 * * 2',
  $$
  select
    net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/delete-discord-messages',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'publishable_key')
      ),
      body := '{"kind":"raid"}'::jsonb
    ) as request_id;
  $$
);

-- 수요일 06:00 KST = 화요일 21:00 UTC
select cron.schedule(
  'delete-homework-discord-messages-wed-06-kst',
  '0 21 * * 2',
  $$
  select
    net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/delete-discord-messages',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'publishable_key')
      ),
      body := '{"kind":"homework"}'::jsonb
    ) as request_id;
  $$
);
