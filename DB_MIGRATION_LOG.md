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
