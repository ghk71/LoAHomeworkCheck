-- 매주 수요일 10:00/18:00(KST)에 레이드 일정 자동 전송 여부를 확인합니다.
-- 조건:
-- 1. 이번 주 raid 메시지를 아직 보내지 않았고
-- 2. raid.html 우측 "미배치 파티" 목록이 비어 있으면
-- 3. send-raid-discord를 호출합니다.
--
-- 사전 준비:
-- 1. auto-send-raid-discord, send-raid-discord Edge Function 배포
-- 2. discord_sent_messages.week_start_date 컬럼 적용
-- 3. Supabase Secret 설정:
--    - DISCORD_RAID_WEBHOOK_URL
--    - SUPABASE_SERVICE_ROLE_KEY
-- 4. Vault Secret 설정:
--    select vault.create_secret('https://프로젝트-ref.supabase.co', 'project_url');
--    select vault.create_secret('프로젝트 anon/publishable key', 'publishable_key');

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- 수요일 10:00 KST = 수요일 01:00 UTC
select cron.schedule(
  'auto-send-raid-discord-wed-10-kst',
  '0 1 * * 3',
  $$
  select
    net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/auto-send-raid-discord',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'publishable_key')
      ),
      body := '{"source":"cron-wed-10"}'::jsonb
    ) as request_id;
  $$
);

-- 수요일 18:00 KST = 수요일 09:00 UTC
select cron.schedule(
  'auto-send-raid-discord-wed-18-kst',
  '0 9 * * 3',
  $$
  select
    net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/auto-send-raid-discord',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'publishable_key')
      ),
      body := '{"source":"cron-wed-18"}'::jsonb
    ) as request_id;
  $$
);
