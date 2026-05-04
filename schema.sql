-- ============================================================
-- 로스트아크 숙제 트래커 전체 SQL (중복 실행 안전)
-- Supabase SQL Editor에서 전체 복사 후 실행하세요
-- ============================================================

create extension if not exists "uuid-ossp";

-- 계정
create table if not exists accounts(
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  sort_order int default 0,
  hide_from_filters boolean default false,
  created_at timestamptz default now()
);

-- 캐릭터
create table if not exists characters(
  id uuid default uuid_generate_v4() primary key,
  account_id uuid references accounts(id) on delete cascade,
  name text not null,
  class_name text default '',
  item_level numeric default 0,
  combat_power numeric default 0,
  show_raid_tasks boolean default true,
  show_currencies boolean default true,
  show_custom_notes boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 일반 숙제
create table if not exists tasks(
  id uuid default uuid_generate_v4() primary key,
  character_id uuid references characters(id) on delete cascade,
  parent_id uuid references tasks(id) on delete cascade,
  name text not null,
  reset_type text default 'weekly',
  reset_day int default 3,
  activate_day int default null,   -- ★ 활성화 요일 (0=일~6=토), null=항상 활성
  is_completed boolean default false,
  last_completed_at timestamptz,
  count_current int default 0,
  count_max int default null,
  rest_enabled boolean default false,
  rest_current int default 0,
  rest_max int default 200,
  rest_charge int default 20,
  rest_consume int default 40,
  rest_threshold int default 40,
  rest_daily_limit int default 1,
  rest_last_processed_at timestamptz,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 원정대 숙제
create table if not exists expedition_tasks(
  id uuid default uuid_generate_v4() primary key,
  account_id uuid references accounts(id) on delete cascade,
  parent_id uuid references expedition_tasks(id) on delete cascade,
  name text not null,
  reset_type text default 'weekly',
  reset_day int default 3,
  activate_day int default null,
  is_completed boolean default false,
  last_completed_at timestamptz,
  count_current int default 0,
  count_max int default null,
  rest_enabled boolean default false,
  rest_current int default 0,
  rest_max int default 200,
  rest_charge int default 20,
  rest_consume int default 40,
  rest_threshold int default 40,
  rest_daily_limit int default 1,
  rest_last_processed_at timestamptz,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 레이드 숙제 (index.html 용 — 캐릭터별 체크리스트)
create table if not exists raid_tasks(
  id uuid default uuid_generate_v4() primary key,
  character_id uuid references characters(id) on delete cascade,
  name text not null,
  difficulty text default '',
  entry_level numeric default 0,
  clear_gold numeric default 0,
  bound_gold numeric default 0,
  is_completed boolean default false,
  last_completed_at timestamptz,
  reset_day int default 3,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 재화
create table if not exists currencies(
  id uuid default uuid_generate_v4() primary key,
  character_id uuid references characters(id) on delete cascade,
  name text not null,
  amount bigint default 0,
  icon text default '💰',
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 커스텀 팝업
create table if not exists custom_popups(
  id uuid default uuid_generate_v4() primary key,
  character_id uuid references characters(id) on delete cascade,
  title text not null,
  icon text default '📋',
  content jsonb default '[]'::jsonb,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 코어정수 (core.html 용)
create table if not exists character_cores(
  id uuid default uuid_generate_v4() primary key,
  character_id uuid references characters(id) on delete cascade unique,
  cores jsonb default '{}'::jsonb,   -- { "order_sun_1": { "grade": "ancient", "priority": true }, ... }
  updated_at timestamptz default now()
);

-- 레이드 프리셋 (레이드 정보 마스터)
create table if not exists raid_presets(
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  difficulty text default '',
  entry_level numeric default 0,
  clear_gold numeric default 0,
  bound_gold numeric default 0,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 레이드 그룹 표시 설정
create table if not exists raid_group_settings(
  name text primary key,
  icon_url text,
  color text default '#4caf50',
  updated_at timestamptz default now()
);

-- 레이드 파티 (raid_presets에 종속)
create table if not exists raid_parties(
  id uuid default uuid_generate_v4() primary key,
  preset_id uuid references raid_presets(id) on delete cascade,
  name text default '파티',
  party_size int default 4,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 파티 멤버
create table if not exists raid_party_members(
  id uuid default uuid_generate_v4() primary key,
  party_id uuid references raid_parties(id) on delete cascade,
  character_id uuid references characters(id) on delete set null,
  slot_index int not null,
  created_at timestamptz default now()
);

-- 레이드 일정
create table if not exists raid_schedules(
  id uuid default uuid_generate_v4() primary key,
  party_id uuid references raid_parties(id) on delete cascade,
  day_of_week int not null,
  time_str text default '',
  is_fixed boolean default false,
  created_at timestamptz default now()
);

-- 주차별 일정 오버라이드 (임시 파티 변경 + 완료 여부)
create table if not exists raid_schedule_overrides(
  id uuid default uuid_generate_v4() primary key,
  schedule_id uuid references raid_schedules(id) on delete cascade,
  week_start_date text not null,
  slot_overrides jsonb default '{}'::jsonb,
  is_completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now(),
  unique(schedule_id, week_start_date)
);

-- 주차별 공지
create table if not exists raid_notices(
  id uuid default uuid_generate_v4() primary key,
  week_start_date text not null unique,
  content text default '',
  updated_at timestamptz default now()
);

-- 주차별 공지 댓글
create table if not exists raid_notice_comments(
  id uuid default uuid_generate_v4() primary key,
  week_start_date text not null,
  author_name text default '익명',
  content text not null,
  created_at timestamptz default now()
);

alter table accounts          disable row level security;
alter table characters        disable row level security;
alter table tasks             disable row level security;
alter table expedition_tasks  disable row level security;
alter table raid_tasks        disable row level security;
alter table currencies        disable row level security;
alter table custom_popups     disable row level security;
alter table character_cores   disable row level security;
alter table raid_presets      disable row level security;
alter table raid_group_settings disable row level security;
alter table raid_parties      disable row level security;
alter table raid_party_members disable row level security;
alter table raid_schedules    disable row level security;
alter table raid_schedule_overrides disable row level security;
alter table raid_notices      disable row level security;
alter table raid_notice_comments disable row level security;

-- ★ 기존 설치 업데이트용 (이미 있는 DB에서 실행 시)
alter table accounts         add column if not exists sort_order int default 0;
alter table accounts         add column if not exists hide_from_filters boolean default false;
alter table tasks            add column if not exists count_current int default 0;
alter table tasks            add column if not exists count_max int default null;
alter table tasks            add column if not exists parent_id uuid references tasks(id) on delete cascade;
alter table tasks            add column if not exists activate_day int default null;
alter table tasks            add column if not exists clone_group_id uuid;
alter table tasks            add column if not exists rest_enabled boolean default false;
alter table tasks            add column if not exists rest_current int default 0;
alter table tasks            add column if not exists rest_max int default 200;
alter table tasks            add column if not exists rest_charge int default 20;
alter table tasks            add column if not exists rest_consume int default 40;
alter table tasks            add column if not exists rest_threshold int default 40;
alter table tasks            add column if not exists rest_daily_limit int default 1;
alter table tasks            add column if not exists rest_last_processed_at timestamptz;
alter table expedition_tasks add column if not exists parent_id uuid references expedition_tasks(id) on delete cascade;
alter table expedition_tasks add column if not exists activate_day int default null;
alter table expedition_tasks add column if not exists clone_group_id uuid;
alter table expedition_tasks add column if not exists rest_enabled boolean default false;
alter table expedition_tasks add column if not exists rest_current int default 0;
alter table expedition_tasks add column if not exists rest_max int default 200;
alter table expedition_tasks add column if not exists rest_charge int default 20;
alter table expedition_tasks add column if not exists rest_consume int default 40;
alter table expedition_tasks add column if not exists rest_threshold int default 40;
alter table expedition_tasks add column if not exists rest_daily_limit int default 1;
alter table expedition_tasks add column if not exists rest_last_processed_at timestamptz;
-- raid_parties 기존 설치 업데이트
alter table raid_parties     add column if not exists preset_id uuid references raid_presets(id) on delete cascade;
-- raid_schedule_overrides 기존 설치 업데이트
alter table raid_schedule_overrides add column if not exists is_completed boolean default false;
alter table raid_schedule_overrides add column if not exists completed_at timestamptz;
-- raid_tasks에 preset 연동 컬럼 추가
alter table raid_tasks add column if not exists preset_id uuid references raid_presets(id) on delete set null;
-- 더보기 골드 컬럼 추가
alter table raid_tasks    add column if not exists bonus_gold numeric default 0;
alter table raid_presets  add column if not exists bonus_gold numeric default 0;
-- 일정 순서 정렬용
alter table raid_schedules add column if not exists sort_order int default 0;

-- ★ 신규 기능 업데이트 (현재 HTML 코드 호환)
-- 부계정
alter table accounts add column if not exists parent_account_id uuid references accounts(id) on delete set null;

-- 레이드/파티 색상
alter table raid_presets add column if not exists color text;
alter table raid_parties add column if not exists color text;

-- 레이드 숙제 골드 수령 여부 (초기화 안됨, 영구 설정)
alter table raid_tasks add column if not exists receive_gold boolean default true;
alter table raid_tasks add column if not exists receive_bound boolean default true;
alter table raid_tasks add column if not exists receive_bonus boolean default true;

-- 이미지 아이콘 URL
alter table characters add column if not exists icon_url text;
alter table characters add column if not exists combat_power numeric default 0;
alter table characters add column if not exists show_raid_tasks boolean default true;
alter table characters add column if not exists show_currencies boolean default true;
alter table characters add column if not exists show_custom_notes boolean default true;
alter table raid_presets add column if not exists icon_url text;
alter table expedition_tasks add column if not exists icon_url text;
alter table tasks add column if not exists icon_url text;
alter table currencies add column if not exists icon_url text;

-- 레이드 그룹 표시 설정
create table if not exists raid_group_settings(
  name text primary key,
  icon_url text,
  color text default '#4caf50',
  updated_at timestamptz default now()
);
alter table raid_group_settings disable row level security;

-- 재화 마지막 수정일
alter table currencies add column if not exists updated_at timestamptz;

-- 임시 파티 변경사항 추적 (주 초기화 시 복원용)
alter table raid_schedule_overrides add column if not exists temp_changes jsonb default '{}';

-- 성능 최적화용 인덱스 (중복 실행 안전)
create index if not exists idx_characters_account_sort on characters(account_id, sort_order, created_at);
create index if not exists idx_tasks_character_parent_sort on tasks(character_id, parent_id, sort_order, created_at);
create index if not exists idx_tasks_clone_group on tasks(clone_group_id);
create index if not exists idx_expedition_tasks_account_parent_sort on expedition_tasks(account_id, parent_id, sort_order, created_at);
create index if not exists idx_expedition_tasks_clone_group on expedition_tasks(clone_group_id);
create index if not exists idx_raid_tasks_character_sort on raid_tasks(character_id, sort_order, created_at);
create index if not exists idx_raid_tasks_character_preset on raid_tasks(character_id, preset_id);
create index if not exists idx_currencies_character_sort on currencies(character_id, sort_order, created_at);
create index if not exists idx_custom_popups_character_sort on custom_popups(character_id, sort_order, created_at);
create index if not exists idx_character_cores_character on character_cores(character_id);
create index if not exists idx_raid_presets_name_sort on raid_presets(name, sort_order, created_at);
create index if not exists idx_raid_parties_preset_sort on raid_parties(preset_id, sort_order, created_at);
create index if not exists idx_raid_party_members_party_slot on raid_party_members(party_id, slot_index);
create index if not exists idx_raid_schedules_party_day_sort on raid_schedules(party_id, day_of_week, sort_order, created_at);
create index if not exists idx_raid_schedule_overrides_week on raid_schedule_overrides(week_start_date);
create index if not exists idx_raid_notice_comments_week_created on raid_notice_comments(week_start_date, created_at);
