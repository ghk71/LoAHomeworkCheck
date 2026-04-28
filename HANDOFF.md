# HANDOFF

이 파일은 연구실/집 컴퓨터 사이에서 작업을 넘길 때 사용하는 고정 인수인계 문서입니다.
다음 작업자는 긴 프롬프트 대신 아래 한 줄로 시작하면 됩니다.

```text
AGENTS.md를 따르고, HANDOFF.md와 CODEX_SESSION_LOG.md 마지막 섹션을 읽은 뒤 이어서 작업해주세요.
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

- 오늘 작업 종료 시점의 주요 수정 흐름은 `index.html`, `raid.html`, `CODEX_SESSION_LOG.md`, `FULL_TEST_SIMULATION.md`에 집중되어 있었습니다.
- 가장 최근의 핵심 작업은 `raid.html` 뷰어 레이드 현황의 progress bar 렌더링 버그 수정입니다.
- `HANDOFF.md`는 오늘부터 새로 도입한 고정 인수인계 파일입니다.

## Recent User Feedback

- 매번 다음 작업용 프롬프트를 새로 부탁하는 것은 비효율적입니다.
- 앞으로는 작업 종료 시 `HANDOFF.md`를 갱신해서 다른 컴퓨터에서 바로 이어받을 수 있게 합니다.
- 다른 컴퓨터의 작업자는 과거 프로젝트 맥락은 알고 있지만, 오늘 Codex와 나눈 대화의 세부 요구사항은 모를 수 있습니다.

## Recent Implemented Items

- `index.html`
  - 재화현황 디자인을 +/- 버튼, 금액 입력, 뱃지가 따로 놀지 않도록 재구성했습니다.
  - 재화 텍스트 overflow와 number input spinner 표시 문제를 수정했습니다.
  - 수정/삭제 모드에서 화면 다른 곳을 클릭하면 토글이 꺼지도록 했습니다.
  - 수정/삭제 모드 아이콘 배치로 카드 레이아웃이 깨지는 문제를 보정했습니다.

- `raid.html`
  - 일정 추가/수정 모달의 파티 정보 미리보기 디자인을 개선했습니다.
  - 일정 추가 모달의 레이드/난이도/파티 선택 순서를 파티 구성 기준 순서에 맞췄습니다.
  - 레이드명/난이도명 색상을 지정 색상에 맞게 표시하도록 수정했습니다.
  - 주간 일정의 "오늘" 표시는 오전 6시 초기화 기준을 따르도록 수정했습니다.
  - 뷰어 모드에서 편집 컨트롤이 보이지 않도록 수정했습니다.
  - 뷰어 레이드 현황에서 레이드 순서, 계정별 progress bar, 요일 표시, 텍스트 크기, 캐릭터 카드 progress bar를 수정했습니다.
  - progress bar fill 요소가 inline 상태라 채워지지 않던 문제를 `display:block`으로 수정했습니다.
  - 캐릭터 카드 우상단에 progress bar와 `done/total` 표시가 함께 나오도록 수정했습니다.

- `FULL_TEST_SIMULATION.md`
  - 과거 요청 기능과 파생 기능을 시나리오 형태로 테스트할 수 있는 문서를 작성했습니다.

## Next Manual Checks

- 실제 브라우저에서 `raid.html` 뷰어 레이드 현황을 확인합니다.
- 계정별 progress bar가 실제 완료 수치만큼 채워지는지 확인합니다.
- 캐릭터 카드 우상단 progress bar와 `0/5` 형식 숫자가 함께 보이는지 확인합니다.
- 레이드 순서가 파티 구성의 레이드 명 / 난이도 명 순서를 따르는지 확인합니다.
- 일정 연동 표시는 `4/23` 같은 날짜가 아니라 `목요일` 같은 요일명으로 보이는지 확인합니다.
- 뷰어 모드에서 완료/수정/삭제 등 편집 컨트롤이 보이지 않는지 확인합니다.
- `index.html` 재화현황에서 수정/삭제 모드 진입 시 레이아웃이 깨지지 않는지 확인합니다.
- `node tools/check-project.js`를 실행합니다.

## Known Local Validation Issue

- 오늘 작업한 이 컴퓨터에서는 `node tools/check-project.js` 실행 시 `node.exe` 권한 문제로 `Access is denied`가 발생했습니다.
- 다른 컴퓨터에서는 정상 실행될 수 있으므로 반드시 다시 실행해봐야 합니다.
- 보조 검증으로 5개 주요 HTML의 `</html>` 뒤 코드 없음, CSS 변수 정의 여부, `git diff --check`를 확인했습니다.

## End Of Day Routine

작업 종료 전에 다음 순서로 정리합니다.

1. 변경 내용을 작게 요약합니다.
2. `CODEX_SESSION_LOG.md`에 날짜와 함께 기록합니다.
3. `HANDOFF.md`의 `Current Work State`, `Recent User Feedback`, `Recent Implemented Items`, `Next Manual Checks`, `Known Local Validation Issue`를 최신화합니다.
4. `node tools/check-project.js`를 실행하고 결과를 기록합니다.
5. 가능하면 5개 주요 HTML의 `</html>` 뒤 코드 없음과 CSS 변수 정의 여부를 확인합니다.

