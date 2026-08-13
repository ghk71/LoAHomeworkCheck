# Architecture

## 전체 구조

이 프로젝트는 별도 서버 없이 GitHub Pages에서 정적 HTML로 실행되며, 데이터 저장과 조회는 Supabase JS SDK를 통해 처리한다.

```txt
Browser
  ├─ index.html
  ├─ core.html
  ├─ raid.html
  ├─ overview.html
  ├─ party_generation.html
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
  ├─ raid_notices / raid_notice_comments
  ├─ one_time_tasks
  ├─ party_generation_drafts
  └─ share_links
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

### `party_generation.html`

- 레이드/난이도별 파티 작업안 생성
- 캐릭터 후보 및 파티 배치 편집
- 검증 후 현재 파티와 캐릭터별 레이드 숙제에 적용

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

`one_time_tasks.owner_id`는 계정/캐릭터를 함께 가리키는 polymorphic 키라 FK 대신 계정/캐릭터 삭제 트리거로 정리한다.

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

임시 상태 복원과 일정 삭제는 여러 REST 요청으로 나누지 않는다.

- `restore_raid_schedule_override_atomic`
- `delete_raid_schedule_atomic`

두 RPC가 `raid_tasks` 복원과 override/일정 변경을 같은 DB 트랜잭션에서 처리한다.

주차별 임시 상태는 다음 원칙을 따른다.

- 현재 주차와 이전 두 주의 override/임시 파티 기록은 조회용으로 보존한다.
- 주차가 바뀌면 과거 JSON 기록은 유지한 채 전역 `raid_tasks.preset_id` 연결만 즉시 원복한다.
- JSON의 `_restored` 표시는 이미 원복된 과거 기록을 다시 적용하지 않게 한다.
- `raid_task_temp_reference_count`는 아직 활성인 주차 참조만 계산해 다른 주의 임시 작업을 삭제하거나 덮어쓰지 않게 한다.
- `temp_week_start_date`가 있는 주차 전용 숙제는 선택 주차에서만 로드하며 보존 기간 뒤 정리한다.

여러 행이 함께 바뀌는 작업은 브라우저 REST 요청 묶음이 아니라 아래 RPC 한 번으로 처리한다.

- `apply_task_pause_atomic`: 일시중지, 완료, 휴식 게이지, 상위/하위 완료 동기화
- `clone_task_tree_atomic`: 루트와 모든 자손 숙제 복제
- `apply_raid_override_changes_atomic`: override와 레이드 숙제 임시 변경
- `apply_party_generation_atomic`: 파티 생성기 적용과 레이드 숙제 동기화
- `set_raid_party_member_atomic`, `create_raid_temp_party_atomic`: 멤버/임시 파티와 숙제 변경
- `cleanup_raid_week_rollover_atomic`: 06:00 KST 주차 롤오버 복원 및 보존 기간 정리

### 공유 링크

`share_links`는 실제 Supabase URL/key payload와 함께 `expires_at`, `revoked_at`을 저장한다.

- `create-share-link`: 1~365일 범위의 만료 링크 생성 및 토큰 철회
- `resolve-share`: 철회 또는 만료 링크를 HTTP 410으로 거절
- UI에서 제공하는 만료 선택지는 7/30/90일
- 기존 `?viewer=` 긴 링크는 과거 링크 호환용으로만 읽고 새로 생성하지 않는다.
