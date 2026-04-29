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
