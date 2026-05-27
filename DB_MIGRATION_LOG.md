# DB Migration Log

Supabase 스키마 변경 이력을 기록한다.

## 작성 규칙

스키마를 바꿀 때마다 아래 형식으로 추가한다.

```md
## YYYY-MM-DD - 제목

### 변경
- 추가/수정한 테이블 또는 컬럼

### SQL
```sql
ALTER TABLE ...
```

### 적용 여부
- Supabase SQL Editor 실행 여부

### 관련 기능
- 어떤 기능 때문에 필요한지
```

---

## 2026-04-28 - currencies.icon_url 추가

### 변경

`currencies` 테이블에 이미지 아이콘 URL 저장 컬럼 추가.

### SQL

```sql
ALTER TABLE currencies ADD COLUMN IF NOT EXISTS icon_url TEXT;
```

### 적용 여부

수동 확인 필요.

### 관련 기능

- 재화별 이미지 아이콘 표시

---

## 2026-04-28 - raid_tasks.receive_bound 추가

### 변경

`raid_tasks` 테이블에 귀속골드 수령 여부 컬럼 추가.

### SQL

```sql
ALTER TABLE raid_tasks ADD COLUMN IF NOT EXISTS receive_bound BOOLEAN DEFAULT TRUE;
```

### 적용 여부

수동 확인 필요.

### 관련 기능

- index.html 레이드 숙제의 귀속골드 토글

---

## 2026-04-29 - tasks.clone_group_id / expedition_tasks.clone_group_id 추가

### 변경

복제된 숙제 묶음을 이름이 아니라 안정적인 그룹 ID로 추적하기 위해 컬럼과 인덱스 추가.

### SQL

```sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS clone_group_id UUID;
ALTER TABLE expedition_tasks ADD COLUMN IF NOT EXISTS clone_group_id UUID;
CREATE INDEX IF NOT EXISTS idx_tasks_clone_group ON tasks(clone_group_id);
CREATE INDEX IF NOT EXISTS idx_expedition_tasks_clone_group ON expedition_tasks(clone_group_id);
```

### 적용 여부

수동 확인 필요.

### 관련 기능

- 일일/주간 숙제 복제본 일괄 삭제 대상 조회
- 원정대 숙제 복제본 일괄 삭제 대상 조회

## 2026-04-29 - tasks / expedition_tasks 휴식 게이지 컬럼 추가

### 변경
일반 숙제와 원정대 숙제에 휴식 게이지 설정과 현재 상태를 저장하는 컬럼을 추가.

### SQL

```sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS rest_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS rest_current INT DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS rest_max INT DEFAULT 200;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS rest_charge INT DEFAULT 20;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS rest_consume INT DEFAULT 40;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS rest_threshold INT DEFAULT 40;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS rest_daily_limit INT DEFAULT 1;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS rest_last_processed_at TIMESTAMPTZ;

ALTER TABLE expedition_tasks ADD COLUMN IF NOT EXISTS rest_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE expedition_tasks ADD COLUMN IF NOT EXISTS rest_current INT DEFAULT 0;
ALTER TABLE expedition_tasks ADD COLUMN IF NOT EXISTS rest_max INT DEFAULT 200;
ALTER TABLE expedition_tasks ADD COLUMN IF NOT EXISTS rest_charge INT DEFAULT 20;
ALTER TABLE expedition_tasks ADD COLUMN IF NOT EXISTS rest_consume INT DEFAULT 40;
ALTER TABLE expedition_tasks ADD COLUMN IF NOT EXISTS rest_threshold INT DEFAULT 40;
ALTER TABLE expedition_tasks ADD COLUMN IF NOT EXISTS rest_daily_limit INT DEFAULT 1;
ALTER TABLE expedition_tasks ADD COLUMN IF NOT EXISTS rest_last_processed_at TIMESTAMPTZ;
```

### 적용 여부

수동 확인 필요.

### 관련 기능

- 휴식 게이지 기반 숙제 활성화/비활성화
- 리셋 시 미완료 충전, 완료 시 충분한 게이지에 한해 소모

## 2026-04-29 - raid_notice_comments 추가

### 변경

주차별 공지 아래 댓글을 저장하기 위한 `raid_notice_comments` 테이블과 주차/작성일 인덱스 추가.

### SQL

```sql
CREATE TABLE IF NOT EXISTS raid_notice_comments(
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  week_start_date TEXT NOT NULL,
  author_name TEXT DEFAULT '익명',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE raid_notice_comments DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_raid_notice_comments_week_created
ON raid_notice_comments(week_start_date, created_at);
```

### 적용 여부

수동 확인 필요.

### 관련 기능

- `raid.html` 주간 공지 아래 주차별 댓글 표시
- 공유 링크 뷰어에서도 댓글 작성 가능
- 미래 주차 공지/일정으로 이동해 미리 댓글 작성 가능

## 2026-04-29 - characters 섹션 표시 설정 컬럼 추가

### 변경

캐릭터별로 `index.html`의 레이드 숙제, 재화 현황, 커스텀 노트 섹션 표시 여부를 저장하는 컬럼 추가.

### SQL

```sql
ALTER TABLE characters ADD COLUMN IF NOT EXISTS show_raid_tasks BOOLEAN DEFAULT TRUE;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS show_currencies BOOLEAN DEFAULT TRUE;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS show_custom_notes BOOLEAN DEFAULT TRUE;
```

### 적용 여부

수동 확인 필요.

### 관련 기능

- 캐릭터별 레이드 숙제 섹션 숨김/표시
- 캐릭터별 재화 현황 섹션 숨김/표시
- 캐릭터별 커스텀 노트 섹션 숨김/표시

## 2026-04-29 - raid_group_settings 추가

### 변경

`raid.html`의 레이드 그룹 아이콘과 색상을 브라우저 `localStorage`가 아니라 Supabase DB에 저장하기 위한 테이블 추가.

### SQL

```sql
CREATE TABLE IF NOT EXISTS raid_group_settings(
  name TEXT PRIMARY KEY,
  icon_url TEXT,
  color TEXT DEFAULT '#4caf50',
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE raid_group_settings DISABLE ROW LEVEL SECURITY;
```

### 적용 여부

수동 확인 필요.

### 관련 기능

- 레이드 그룹명 앞 아이콘을 모든 컴퓨터에서 동일하게 표시
- 레이드 그룹 색상 DB 저장
- 기존 `la_gicon_*`, `la_gc_*`, `la_raid_groups` localStorage 값의 DB 이전
## 2026-04-30 - characters 전투력 컬럼 추가

### 목적
- 캐릭터 정보에 아이템 레벨/직업/캐릭터명 외 전투력 값을 저장하고, 파티 구성/주간 일정/현황 화면에서 함께 표시하기 위함.

### SQL
```sql
alter table characters add column if not exists combat_power numeric default 0;
```

### 적용 파일
- `schema.sql`
- `index.html` 내부 초기 SQL

## 2026-05-04 - accounts 필터 숨김 컬럼 추가

### 목적
- 특정 계정을 코어/레이드 현황/파티 현황/공유 링크의 캐릭터 필터에서 제외하되, 파티 구성과 주간 일정 구성 데이터에는 그대로 남기기 위함.

### SQL
```sql
alter table accounts add column if not exists hide_from_filters boolean default false;
```

### 적용 파일
- `schema.sql`
- `index.html`
- `core.html`
- `overview.html`
- `raid.html`
- `parties.html`

## 2026-05-04 - characters 아제나의 축복 컬럼 추가

### 목적
- 캐릭터별 아제나의 축복 적용 여부를 저장하고 `index.html` 캐릭터 카드에 아이콘 배지로 표시하기 위함.

### SQL
```sql
alter table characters add column if not exists azena_blessing boolean default false;
```

### 적용 파일
- `schema.sql`
- `index.html`
## 2026-05-06 - share_links 짧은 공유 링크 테이블 추가

### 목적
- 기존 `?viewer=` 공유 링크에 Supabase URL/key payload가 포함되어 길어지는 문제를 줄이기 위해 짧은 토큰 기반 공유 링크를 저장.

### SQL
```sql
create table if not exists share_links(
  token text primary key,
  payload jsonb not null,
  created_at timestamptz default now()
);
```

## 2026-05-07 - 휴식 게이지 현재 사이클 소모량 컬럼 추가

휴식 게이지 숙제 완료 시 즉시 소모하고, 완료 체크 해제 시 정확히 소모량을 반납하기 위한 컬럼입니다.

```sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS rest_consumed_current_cycle INT DEFAULT 0;
ALTER TABLE expedition_tasks ADD COLUMN IF NOT EXISTS rest_consumed_current_cycle INT DEFAULT 0;
```

## 2026-05-10 - 주차 전용 임시 파티 컬럼 추가

주간 일정의 미배치 파티 패널에서 이번 주에만 쓰는 임시 파티를 만들기 위한 컬럼입니다.

```sql
ALTER TABLE raid_parties ADD COLUMN IF NOT EXISTS is_temporary BOOLEAN DEFAULT FALSE;
ALTER TABLE raid_parties ADD COLUMN IF NOT EXISTS temp_week_start_date TEXT;
```

## 2026-05-10 - 고정 일정 주차별 위치 오버라이드 컬럼 추가

고정 일정의 원본 요일/시간은 유지하면서 특정 주에만 드래그 위치를 바꾸기 위한 컬럼입니다.

```sql
ALTER TABLE raid_schedule_overrides ADD COLUMN IF NOT EXISTS schedule_overrides JSONB DEFAULT '{}';
```

### 적용 파일
- `schema.sql`
- `raid.html`
- `supabase/functions/create-share-link/index.ts`
- `supabase/functions/resolve-share/index.ts`

## 2026-05-26 - 미완료 숙제 Discord 자동 전송 Cron

### 목적
- 매주 화요일 오후 8시(KST)에 `send-homework-discord` Edge Function을 호출해 미완료 캐릭터 숙제 / 주간·월간 숙제 / 계정 숙제 요약을 Discord Webhook으로 전송.

### 사전 준비
- `supabase/functions/send-homework-discord/index.ts` 배포.
- Supabase Edge Function Secret 설정:
  - `DISCORD_HOMEWORK_WEBHOOK_URL` 또는 기존 `DISCORD_RAID_WEBHOOK_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Supabase Vault Secret 설정:

```sql
select vault.create_secret('https://프로젝트-ref.supabase.co', 'project_url');
select vault.create_secret('프로젝트 anon/publishable key', 'publishable_key');
```

### SQL

```sql
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
```

### 적용 여부
- 수동 확인 필요.

## 2026-05-26 - 레이드 디스코드 전송 줄임말 및 Cron Vault 점검

### 변경
- `raid_group_settings.short_name` 컬럼을 추가했습니다.
- `raid.html` 레이드 그룹 추가/수정 모달에서 디스코드 전송용 줄임말을 직접 입력할 수 있습니다.
- `send-raid-discord`는 레이드 그룹의 `short_name`을 우선 사용하고, 값이 없으면 기존 레이드명을 사용합니다.

```sql
alter table raid_group_settings add column if not exists short_name text;
```

### Cron 장애 확인
- `send-homework-discord-tue-20-kst` Cron 실패 원인은 JWT 체크보다 먼저 `project_url`, `publishable_key` Vault Secret 조회 결과가 `null`인 것입니다.
- `pg_net` 오류의 핵심은 `url := null` 및 `Authorization := null`입니다.
- Supabase SQL Editor 또는 Vault 화면에서 아래 두 Secret을 먼저 채워야 합니다.

```sql
-- 값은 실제 프로젝트 값으로 교체해서 적용
select vault.create_secret('https://wmritejklhggnzcwoxse.supabase.co', 'project_url');
select vault.create_secret('<legacy anon key 또는 publishable key>', 'publishable_key');
```

### JWT 설정 메모
- Edge Function의 `Verify JWT with legacy secret`을 끄면 Cron 요청에서 Authorization 헤더가 없어도 호출은 가능해질 수 있습니다.
- 다만 현재 실패는 URL 자체가 `null`이라서, JWT 설정을 바꾸기 전에 `project_url` Vault Secret은 반드시 필요합니다.
- JWT를 끈 상태로 운영하려면 공개 호출 가능성이 생기므로, 별도 Cron Secret 헤더 검증을 추가하는 것이 더 안전합니다.

### 적용 여부
- `raid_group_settings.short_name` SQL 적용 필요.
- Vault Secret 적용 필요.

## 2026-05-26 - Discord 전송 메시지 예약 삭제

### 목적
- `send-raid-discord`로 보낸 레이드 일정 메시지는 매주 화요일 22:00(KST)에 삭제.
- `send-homework-discord`로 보낸 미완료 숙제 메시지는 매주 수요일 06:00(KST)에 삭제.
- Discord Webhook 메시지 삭제를 위해 전송 시 message id를 저장.

### SQL

```sql
create table if not exists discord_sent_messages(
  id uuid default uuid_generate_v4() primary key,
  kind text not null,
  week_start_date text,
  webhook_env text not null,
  message_id text not null,
  delete_after timestamptz not null,
  deleted_at timestamptz,
  delete_attempts int default 0,
  last_error text,
  content_preview text,
  created_at timestamptz default now()
);

alter table discord_sent_messages disable row level security;

create index if not exists idx_discord_sent_messages_due
on discord_sent_messages(kind, delete_after)
where deleted_at is null;

create index if not exists idx_discord_sent_messages_week
on discord_sent_messages(kind, week_start_date, created_at);
```

### Cron SQL

```sql
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- 화요일 22:00 KST = 화요일 13:00 UTC
select cron.schedule(
  'delete-raid-discord-messages-tue-22-kst',
  '0 13 * * 2',
  $$
  select net.http_post(
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
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/delete-discord-messages',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'publishable_key')
    ),
    body := '{"kind":"homework"}'::jsonb
  ) as request_id;
  $$
);
```

### 적용 파일
- `schema.sql`
- `supabase/functions/send-raid-discord/index.ts`
- `supabase/functions/send-homework-discord/index.ts`
- `supabase/functions/delete-discord-messages/index.ts`
- `supabase/functions/delete-discord-messages/cron.sql`

### 적용 여부
- 수동 확인 필요.

## 2026-05-26 - 레이드 일정 자동 전송 체크 Cron

### 목적
- 매주 수요일 10:00(KST)에 이번 주 레이드 일정 메시지를 보냈는지 확인.
- 아직 보내지 않았고, `raid.html` 우측 `미배치 파티` 목록이 비어 있으면 `send-raid-discord` 자동 호출.
- 10:00에 미배치 파티가 하나라도 있으면 보내지 않고, 수요일 18:00(KST)에 같은 조건을 다시 확인.

### 판정 기준
- `raid.html`의 `unplacedPartiesForWeek()`와 같은 기준입니다.
- 이번 주에 유효한 `raid_parties` 중 `raid_schedules`에 배치되지 않은 파티가 1개라도 있으면 전송하지 않습니다.
- 임시 파티는 `temp_week_start_date = 이번 주`인 경우만 이번 주 파티로 봅니다.
- 고정 일정은 항상 배치된 일정으로 봅니다.
- 비고정 일정은 이번 주 생성된 일정만 배치된 일정으로 봅니다.

### 추가/변경
- `discord_sent_messages.week_start_date` 컬럼으로 이번 주 레이드 메시지를 이미 보냈는지 판정합니다.

```sql
alter table discord_sent_messages add column if not exists week_start_date text;

create index if not exists idx_discord_sent_messages_week
on discord_sent_messages(kind, week_start_date, created_at);
```

### Cron SQL

```sql
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- 수요일 10:00 KST = 수요일 01:00 UTC
select cron.schedule(
  'auto-send-raid-discord-wed-10-kst',
  '0 1 * * 3',
  $$
  select net.http_post(
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
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/auto-send-raid-discord',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'publishable_key')
    ),
    body := '{"source":"cron-wed-18"}'::jsonb
  ) as request_id;
  $$
);
```

### 적용 파일
- `schema.sql`
- `supabase/functions/auto-send-raid-discord/index.ts`
- `supabase/functions/auto-send-raid-discord/cron.sql`
- `supabase/functions/send-raid-discord/index.ts`
- `supabase/functions/send-homework-discord/index.ts`

### 적용 여부
- 수동 확인 필요.
