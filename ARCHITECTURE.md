# Architecture

## 전체 구조

이 프로젝트는 별도 서버 없이 GitHub Pages에서 정적 HTML로 실행되며, 데이터 저장과 조회는 Supabase JS SDK를 통해 처리한다.

```txt
Browser
  ├─ index.html
  ├─ core.html
  ├─ raid.html
  ├─ overview.html
  └─ parties.html
        │
        ▼
Supabase
  ├─ accounts
  ├─ characters
  ├─ tasks
  ├─ expedition_tasks
  ├─ raid_tasks
  ├─ currencies
  ├─ character_cores
  ├─ raid_presets
  ├─ raid_parties
  ├─ raid_party_members
  ├─ raid_schedules
  ├─ raid_schedule_overrides
  └─ raid_notices
```

## 페이지별 역할

### `index.html`

- 계정 관리
- 부계정 그룹 표시
- 캐릭터 관리
- 원정대 숙제 관리
- 캐릭터별 숙제 관리
- 레이드 숙제 관리
- 유통/귀속/더보기 골드 표시 및 수령 토글
- 재화 관리
- 파티연동 팝업

### `core.html`

- 캐릭터별 코어 등급 관리
- 기본 보기
- 번호별 묶음 보기
- 사용자 조합 보기
- 혼돈 코어 이름 직접 편집
- 숨긴 코어 관리

### `raid.html`

- 레이드 프리셋 관리
- 난이도 관리
- 파티 구성
- 파티 멤버 배치
- 주간 일정 관리
- 임시 파티 추가/삭제
- 일정 완료/해제
- 주차별 공지
- 공유 링크 뷰어 모드

### `overview.html`

- 캐릭터별 레이드 완료 현황 표시
- 부계정 그룹화
- 파티연동 팝업

### `parties.html`

- 레이드별 파티 목록 표시
- 파티 멤버 표시
- 난이도 표시

## 핵심 Supabase 관계

```txt
accounts.id
  └─ characters.account_id

characters.id
  ├─ tasks.character_id
  ├─ raid_tasks.character_id
  ├─ currencies.character_id
  ├─ character_cores.character_id
  └─ raid_party_members.character_id

raid_presets.id
  ├─ raid_tasks.preset_id
  └─ raid_parties.preset_id

raid_parties.id
  ├─ raid_party_members.party_id
  └─ raid_schedules.party_id

raid_schedules.id
  └─ raid_schedule_overrides.schedule_id
```

## 중요한 데이터 설계

### 계정/부계정

`accounts.parent_account_id`로 부계정을 표현한다.

- 본계정: `parent_account_id IS NULL`
- 부계정: `parent_account_id = 본계정 id`

UI에서는 본계정 아래에 부계정을 하위 탭으로 묶어야 한다.

### 레이드 숙제와 파티 연동

`raid_tasks.preset_id`가 `raid_presets.id`와 연결된다.

- 연결되어 있으면 `index.html`에서 파티연동 배지가 표시된다.
- 파티연동 팝업은 전체 파티가 아니라 해당 캐릭터가 속한 파티만 보여줘야 한다.
- 파티 이동 버튼은 `raid.html`의 해당 파티로 이동해야 한다.

### 레이드 골드

`raid_tasks`는 세 종류의 골드를 가진다.

- `clear_gold`: 유통골드
- `bound_gold`: 귀속골드
- `bonus_gold`: 더보기 골드

각각 수령 여부를 별도로 가진다.

- `receive_gold`
- `receive_bound`
- `receive_bonus`

### 임시 파티

`raid_schedule_overrides.temp_changes`에 임시 추가/삭제 정보를 저장한다.

권장 JSON 형식:

```json
{
  "added": {
    "characterId": {
      "wasNew": true,
      "taskId": "uuid"
    }
  },
  "removed": {
    "characterId": {
      "taskId": "uuid",
      "hadPreset": true
    }
  }
}
```

기존 데이터 호환을 위해 `was_new`, `task_id`, `had_preset`도 읽을 수 있어야 한다.
