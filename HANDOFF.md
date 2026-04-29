# HANDOFF

이 파일은 연구실/집 컴퓨터 사이에서 작업을 넘길 때 사용하는 고정 인수인계 문서입니다.
다음 작업자는 긴 프롬프트 대신 아래 한 줄로 시작하면 됩니다.

```text
AGENTS.md를 따르고, HANDOFF.md와 CODEX_SESSION_LOG.md 마지막 섹션을 읽은 뒤 이어서 작업해주세요.
```

코드를 바로 고치지 않고 먼저 분석만 받고 싶으면 아래처럼 시작합니다.

```text
AGENTS.md를 따르고, HANDOFF.md와 CODEX_SESSION_LOG.md 마지막 섹션을 읽은 뒤 이어서 작업해주세요. 다만, 코드를 수정하지는 말고 우선 변경사항을 분석하세요.
```

## Always Read First

- AGENTS.md
- CODEX_INSTRUCTIONS.md
- PROJECT_CONTEXT.md
- ARCHITECTURE.md
- FEATURE_SPEC.md
- BUG_HISTORY.md
- TEST_SCENARIO.md
- DB_MIGRATION_LOG.md
- CODEX_SESSION_LOG.md 마지막 섹션
- schema.sql

## Project Rules

- GitHub Pages + Supabase 기반 정적 HTML/CSS/JavaScript 프로젝트입니다.
- React/Vite/Next.js로 전환하지 않습니다.
- 기존 기능을 삭제하지 않습니다.
- JavaScript는 HTML 내부 `<script>` 안에만 둡니다.
- `</html>` 뒤에 어떤 코드도 남기지 않습니다.
- Supabase 컬럼명은 `schema.sql`과 일치시킵니다.
- 사용한 CSS `var(--...)`는 반드시 정의되어 있어야 합니다.
- 수정은 버그 단위로 작게 진행합니다.
- 의미 있는 수정 후 `CODEX_SESSION_LOG.md`에 날짜와 함께 기록합니다.
- 수정 후 `node tools/check-project.js`를 실행합니다.
- 가능하면 `index.html`, `core.html`, `raid.html`, `overview.html`, `parties.html` 5개 HTML의 `</html>` 뒤 코드 여부도 확인합니다.

## Current Work State

- 오늘 작업 종료 시점의 주요 수정 파일은 `index.html`, `raid.html`, `overview.html`, `schema.sql`, `FEATURE_SPEC.md`, `BUG_HISTORY.md`, `DB_MIGRATION_LOG.md`, `CODEX_SESSION_LOG.md`, `HANDOFF.md`입니다.
- `index.html`에는 일일숙제 복제/삭제 선택 범위 확장, 복제 그룹 ID 기반 삭제, 월간 초기화 옵션, 휴식 게이지 기능, 파티연동 배지 표시 조건 보정이 들어갔습니다.
- `raid.html`에는 파티구성 긴 레이드명 말줄임, 파티 슬롯 제거 시 레이드 숙제 삭제 방지, 공유 링크 레이드 현황 골드 표시/정렬 토글/요일순 기본값이 들어갔습니다.
- `raid.html`에는 공지 아래 주차별 댓글 기능이 추가되었고, 공유 링크 뷰어에서도 댓글 작성이 가능해야 합니다.
- `overview.html`에는 실제 파티 배치가 있는 레이드에만 파티연동 표시가 나오도록 보정이 들어갔습니다.
- `schema.sql`과 `DB_MIGRATION_LOG.md`에는 `clone_group_id`, 휴식 게이지 컬럼, `raid_notice_comments` 테이블이 반영되어 있습니다.

## Recent User Requests Reflected

- 다른 컴퓨터에서 이어받기 쉽도록 `HANDOFF.md`를 최신화하는 흐름을 도입했습니다.
- 일일숙제 복제 모달에 전체 선택과 계정별 선택을 추가했습니다.
- 숙제 삭제 모달이 전체 계정/전체 캐릭터의 복제본을 보여주도록 수정했습니다.
- 숙제 삭제 기준을 이름이 아니라 `clone_group_id`로 바꿨습니다.
- 일일/원정대 숙제 초기화 주기에 `매월 1일 06:00 KST`를 추가했습니다.
- 월간 숙제는 별도 월간 칸이 아니라 주간/월간 숙제 칸에 함께 표시하도록 조정했습니다.
- 휴식 게이지 사용 여부, 현재 게이지, 충전량, 소모량, 강조 포인트, 일일 최대 클리어 가능 횟수 UI와 로직을 추가했습니다.
- `raid.html` 파티 슬롯에서 캐릭터를 제거해도 `index.html` 레이드 숙제가 삭제되지 않게 수정했습니다.
- 파티연동 배지는 실제 파티 배치 또는 임시 파티 추가가 있을 때만 표시되도록 보정했습니다.
- 공유 링크 레이드 현황에 유통/귀속/더보기 골드 표시와 레이드순/요일순 토글을 추가했습니다.
- 공유 링크 레이드 현황 기본 정렬은 요일순이며, 요일 순서는 수요일부터 화요일까지입니다.
- 공지 아래 댓글 기능을 추가했고, 댓글은 주차별로 분리되며 공유 링크 뷰어에서도 작성 가능합니다.

## Recent Implemented Items

- `index.html`
  - 일일숙제 복제 대상 선택에 전체/계정별 체크박스 추가.
  - 숙제 삭제 대상 조회를 전체 계정/전체 캐릭터의 같은 복제 그룹으로 확장.
  - 신규/복제 숙제에 `clone_group_id`를 부여하고 같은 복제본끼리 공유.
  - 일일/주간/월간 초기화 계산 지원.
  - 월간 숙제 표시 위치를 주간/월간 숙제 칸으로 정리.
  - 숙제 추가/수정 모달에 휴식 게이지 설정 UI 추가.
  - 휴식 게이지가 강조 포인트 미만인 숙제는 기본 비활성 숨김 처리.
  - 리셋 시 미완료는 휴식 게이지 충전, 완료는 충분한 게이지가 있을 때만 소모.
  - 실제 파티 배치가 없는 레이드 숙제에는 파티연동 배지를 표시하지 않도록 보정.

- `raid.html`
  - 파티구성 탭의 긴 레이드명/파티명이 줄바꿈으로 깨지지 않게 말줄임 처리.
  - 파티 슬롯 제거는 `raid_party_members`만 삭제하도록 변경.
  - 같은 레이드 프리셋 안에서 동일 캐릭터를 다시 배치하면 기존 중복 슬롯을 먼저 제거.
  - 공유 링크 레이드 현황 캐릭터 카드에 유통/귀속/더보기 골드 칩 추가.
  - 공유 링크 레이드 현황에 레이드순/요일순 정렬 토글 추가.
  - 공유 링크 레이드 현황 기본값을 요일순으로 변경.
  - 요일순 정렬은 수 -> 목 -> 금 -> 토 -> 일 -> 월 -> 화 순서.
  - 주간 공지 아래 댓글 영역 추가.
  - 댓글은 선택된 `week_start_date` 기준으로 표시되며 공유 링크에서도 등록 가능.
  - 요일이 없는 레이드는 맨 뒤에서 레이드 목록 순서로 정렬.

- `overview.html`
  - 파티연동 배지를 `preset_id` 존재 여부가 아니라 실제 파티 멤버 배치 기준으로 표시하도록 수정.

- `schema.sql` / `DB_MIGRATION_LOG.md`
  - `tasks.clone_group_id`, `expedition_tasks.clone_group_id`와 인덱스 추가.
  - `tasks`, `expedition_tasks` 휴식 게이지 관련 컬럼 추가.

## Supabase Migration Reminder

다음 컬럼은 실제 Supabase SQL Editor에 적용되어야 최신 코드가 정상 동작합니다.

- `tasks.clone_group_id`
- `expedition_tasks.clone_group_id`
- `tasks.rest_enabled`
- `tasks.rest_current`
- `tasks.rest_max`
- `tasks.rest_charge`
- `tasks.rest_consume`
- `tasks.rest_threshold`
- `tasks.rest_daily_limit`
- `tasks.rest_last_processed_at`
- `expedition_tasks.rest_enabled`
- `expedition_tasks.rest_current`
- `expedition_tasks.rest_max`
- `expedition_tasks.rest_charge`
- `expedition_tasks.rest_consume`
- `expedition_tasks.rest_threshold`
- `expedition_tasks.rest_daily_limit`
- `expedition_tasks.rest_last_processed_at`
- `raid_notice_comments` 테이블

SQL은 `schema.sql` 또는 `DB_MIGRATION_LOG.md`의 2026-04-29 항목을 기준으로 적용합니다.

## Next Manual Checks

- Supabase SQL Editor에 최신 `schema.sql` 또는 `DB_MIGRATION_LOG.md`의 ALTER SQL을 적용합니다.
- 브라우저에서 일일숙제 복제 모달의 전체 선택/계정별 선택/개별 선택 조합을 확인합니다.
- 새로 복제한 숙제를 삭제할 때 이름만 같은 숙제가 아니라 같은 `clone_group_id` 복제본만 후보로 뜨는지 확인합니다.
- 휴식 게이지 숙제가 강조 포인트 미만일 때 기본 숨김되고, 활성화 보이기에서 보이는지 확인합니다.
- 휴식 게이지가 리셋 시 미완료 충전/완료 소모 규칙대로 움직이는지 확인합니다.
- `raid.html` 파티구성에서 긴 레이드명이 한 줄 말줄임으로 보이는지 확인합니다.
- 파티 슬롯에서 캐릭터를 제거해도 `index.html` 레이드 숙제가 삭제되지 않는지 확인합니다.
- 파티 배치가 없는 레이드 숙제에 파티연동 배지가 나오지 않는지 `index.html`, `overview.html`, 공유 링크에서 확인합니다.
- 공유 링크 레이드 현황의 기본 탭이 요일순인지 확인합니다.
- 공유 링크 레이드 현황 요일순이 수요일부터 화요일까지 정렬되는지 확인합니다.
- 공유 링크 레이드 현황의 골드 칩과 레이드순/요일순 토글이 정상 동작하는지 확인합니다.
- `raid.html` 공지 아래 댓글이 현재 주차/다음 주차별로 분리되어 표시되는지 확인합니다.
- 공유 링크 뷰어에서 댓글 등록이 가능하고 삭제 버튼은 보이지 않는지 확인합니다.

## Known Local Validation Issue

- 현재 PC에서는 일반 권한으로 `node tools/check-project.js` 실행 시 Windows 사용자 경로 EPERM 문제가 날 수 있습니다.
- 권한 상승 실행으로 `node tools/check-project.js`는 통과했습니다.
- `git diff --check`도 통과했으나, 일부 파일에서 LF -> CRLF 변환 경고가 출력될 수 있습니다.
- 5개 주요 HTML의 `</html>` 뒤 코드 없음은 확인했습니다.

## End Of Day Routine

작업 종료 전에 다음 순서로 정리합니다.

1. 변경 내용을 작게 요약합니다.
2. `CODEX_SESSION_LOG.md`에 날짜와 함께 기록합니다.
3. `HANDOFF.md`의 `Current Work State`, `Recent User Requests Reflected`, `Recent Implemented Items`, `Supabase Migration Reminder`, `Next Manual Checks`, `Known Local Validation Issue`를 최신화합니다.
4. `node tools/check-project.js`를 실행하고 결과를 기록합니다.
5. 가능하면 5개 주요 HTML의 `</html>` 뒤 코드 없음과 CSS 변수 정의 여부를 확인합니다.
