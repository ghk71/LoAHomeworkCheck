# HANDOFF

다음 컴퓨터에서 이어받을 때는 아래 프롬프트로 시작하면 됩니다.

```text
AGENTS.md를 따르고, HANDOFF.md와 CODEX_SESSION_LOG.md 마지막 섹션을 읽은 뒤 이어서 작업해주세요.
```

먼저 분석만 원하면 아래처럼 시작합니다.

```text
AGENTS.md를 따르고, HANDOFF.md와 CODEX_SESSION_LOG.md 마지막 섹션을 읽은 뒤 이어서 작업해주세요. 다만, 코드를 수정하지는 말고 우선 변경사항을 분석하세요.
```

## 반드시 읽을 파일

- `AGENTS.md`
- `CODEX_INSTRUCTIONS.md`
- `PROJECT_CONTEXT.md`
- `ARCHITECTURE.md`
- `FEATURE_SPEC.md`
- `BUG_HISTORY.md`
- `TEST_SCENARIO.md`
- `DB_MIGRATION_LOG.md`
- `CODEX_SESSION_LOG.md` 마지막 섹션
- `schema.sql`

## 프로젝트 고정 규칙

- GitHub Pages + Supabase 기반 정적 HTML/CSS/JavaScript 프로젝트입니다.
- React/Vite/Next.js로 바꾸지 않습니다.
- JavaScript는 HTML 내부 `<script>` 안에만 둡니다.
- `</html>` 뒤에 코드를 남기지 않습니다.
- Supabase 컬럼명은 `schema.sql`과 맞춥니다.
- CSS `var(--...)`는 반드시 정의되어 있어야 합니다.
- 기존 기능을 삭제하지 않습니다.
- 수정은 버그 단위로 작게 진행합니다.
- 의미 있는 변경 뒤에는 `CODEX_SESSION_LOG.md`를 갱신합니다.
- 현재 사용자 지시로 `node tools/check-project.js`는 실행하지 않습니다. 이 PC에서 `node.exe Access is denied`가 반복되었고, 다른 컴퓨터에서도 이 검증 명령 재시도 대신 아래 보조 검증을 우선합니다.
- 변경 뒤에는 5개 주요 HTML의 `</html>` 뒤 코드 없음, CSS `var(--...)` 정의 누락 없음, `git diff --check`를 확인합니다.

## 오늘 작업 요약

오늘 작업은 주로 공유링크 `raid.html`의 레이드현황 탭과 골드 수령 표시 기준을 정리했습니다.

- 공유링크 상단 배너에 `계정 변경` 버튼을 추가해 `레이드` 탭과 `레이드 현황` 탭 어디서든 계정 변경이 가능하게 했습니다.
- `index.html`, `overview.html`, 공유링크 `raid.html` 레이드현황에서 유통/귀속 수령 여부를 별도 `유통 O/X`, `귀속 O/X`로 보지 않고 `골드체크 O/X` 하나로 통합했습니다.
- DB 컬럼은 기존 `receive_gold`, `receive_bound`를 유지합니다. UI/집계에서는 두 값이 모두 true인 경우만 `골드체크 O`로 판단합니다.
- `더보기 O/X`는 기존처럼 별도 상태로 유지합니다.
- 공유링크 `raid.html` 레이드현황 탭에서 레이드 추가뿐 아니라 수정/삭제도 가능하게 했습니다.
- 공유링크 레이드현황의 수정/삭제는 선택 계정 범위 내 캐릭터의 레이드만 허용합니다.
- 공유링크에서 새 캐릭터 추가 후 레이드가 없어서 보이지 않는 문제를 처리했습니다.
- 단, 기존에 레이드가 없던 캐릭터까지 모두 보이는 부작용이 생기지 않도록 표시 범위를 다시 좁혔습니다.
- 현재 기준: 기본적으로 레이드 숙제가 있는 캐릭터만 보이고, 공유링크에서 방금 추가한 캐릭터만 `viewerPendingCharId` 메모리 상태로 임시 표시됩니다.
- 새 캐릭터에 첫 레이드 추가가 성공하면 임시 표시 상태가 해제됩니다.
- 계정 변경/계정 선택 시 임시 표시 상태가 초기화됩니다.
- 임시 상태는 localStorage에 저장하지 않아 새로고침하면 자동으로 사라집니다.

## 오늘 변경 파일

- `index.html`
- `overview.html`
- `raid.html`
- `CODEX_SESSION_LOG.md`
- `HANDOFF.md`

## 현재 중요한 동작 기준

- `index.html` 레이드 숙제 아이템의 `골드체크`를 클릭하면 `receive_gold`, `receive_bound`가 함께 토글됩니다.
- `overview.html`과 공유링크 레이드현황의 개별 레이드 칩은 `골드체크 O/X`, `더보기 O/X` 형태입니다.
- 공유링크 레이드현황에서 캐릭터 추가 후에는 해당 캐릭터의 빈 카드가 임시로 보이고, 레이드 추가 모달이 이어서 열립니다.
- 첫 레이드 추가를 완료하면 해당 캐릭터는 정상 레이드 보유 캐릭터가 되어 계속 보입니다.
- 레이드 추가를 취소하거나 새로고침하면 임시 빈 카드는 사라집니다.
- 기존에 레이드가 없던 캐릭터는 공유링크 레이드현황에 표시되지 않아야 합니다.

## 검증 결과

마지막 검증:

- 사용자 지시: 앞으로 `node tools/check-project.js`는 실행하지 않습니다.
- 이유: 이 PC에서 일반 권한/권한 상승 모두 `node.exe Access is denied`로 반복 실패했고, 동일 검증 재시도는 작업 흐름만 지연시킵니다.
- 대체 검증: `index.html`, `core.html`, `raid.html`, `overview.html`, `parties.html` 모두 `</html>` 뒤 코드 없음 확인.
- 대체 검증: 5개 주요 HTML 모두 CSS `var(--...)` 정의 누락 없음 확인.
- 대체 검증: `git diff --check` 통과. 단, 일부 파일에 LF -> CRLF 경고가 출력될 수 있습니다.

## 다음 수동 확인 우선순위

1. 공유링크에서 `레이드` 탭과 `레이드 현황` 탭 모두 상단 `계정 변경` 버튼이 보이고 동작하는지 확인.
2. 공유링크 레이드현황에서 기존 레이드 없는 캐릭터가 표시되지 않는지 확인.
3. 공유링크에서 새 캐릭터 추가 직후 그 캐릭터만 빈 카드로 보이고 레이드 추가 모달이 바로 열리는지 확인.
4. 첫 레이드 추가 후 새 캐릭터가 정상 레이드 카드로 유지되는지 확인.
5. 공유링크 레이드현황에서 레이드 수정/삭제 후 카드와 집계가 즉시 갱신되는지 확인.
6. `index.html`에서 `골드체크` 토글 시 유통/귀속 골드 집계가 함께 바뀌는지 확인.
7. `overview.html`과 공유링크 레이드현황에서 `골드체크 O/X`, `더보기 O/X` 표시가 의도대로 보이는지 확인.

## Supabase 확인 필요

다음 컬럼/테이블이 실제 Supabase SQL Editor에 적용되어 있어야 최신 기능이 안정적으로 동작합니다.

- `raid_notice_comments`
- `raid_group_settings`
- `characters.show_raid_tasks`
- `characters.show_currencies`
- `characters.show_custom_notes`
- `characters.combat_power`
- `tasks.clone_group_id`
- `expedition_tasks.clone_group_id`
- 휴식 게이지 관련 컬럼들

최신 기준은 `schema.sql`과 `DB_MIGRATION_LOG.md`를 확인하세요.

## Git 상태 메모

오늘 종료 시점에는 작업 파일이 아직 commit되지 않았습니다. 다음 작업자가 먼저 `git status`를 확인해야 합니다.

최근 주요 수정 파일은 `index.html`, `overview.html`, `raid.html`, `CODEX_SESSION_LOG.md`, `HANDOFF.md`입니다.
