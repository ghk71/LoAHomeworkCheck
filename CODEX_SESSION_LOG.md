# Codex Session Log

Codex와 나눈 중요한 작업 내용을 기록한다.

이 파일은 다른 컴퓨터에서 작업할 때 이전 맥락을 빠르게 복원하기 위한 용도다.

## 작성 규칙

각 세션 종료 시 아래 형식으로 추가한다.

```md
## YYYY-MM-DD HH:mm - 세션 제목

### 요청
- Codex에게 요청한 내용

### 수정 파일
- index.html
- core.html

### 변경 내용
- 무엇을 바꿨는지

### 검증
- node tools/check-project.js 결과
- 브라우저 테스트 결과

### 남은 문제
- 다음에 이어서 볼 것
```

---

## 2026-04-28 00:00 - 초기 인수인계 문서 생성

### 요청

Claude/ChatGPT/Codex 간 프로젝트 인수인계를 위해 문서 세트를 생성.

### 수정 파일

- README.md
- AGENTS.md
- CODEX_INSTRUCTIONS.md
- PROJECT_CONTEXT.md
- ARCHITECTURE.md
- FEATURE_SPEC.md
- BUG_HISTORY.md
- TEST_SCENARIO.md
- DB_MIGRATION_LOG.md
- CODEX_FIRST_PROMPT.md
- WORKFLOW_TWO_COMPUTERS.md
- CODEX_SESSION_LOG.md

### 변경 내용

- 프로젝트 맥락 문서화
- Codex 작업 규칙 문서화
- 두 컴퓨터 작업 루틴 문서화
- 테스트 시나리오 문서화

### 검증

- Markdown 파일 생성 완료

### 남은 문제

- Claude에서 받은 원본 인수인계 문서를 `docs/claude_original_notes.md`로 추가해야 함.

---

## 2026-04-28 11:05 - 문서 지적 버그 및 스키마 정합성 수정

### 요청

- `schema.sql` 이름 변경 후 전체 버그 수정
- 사용자가 제공한 `3.docx`의 버그 목록 반영
- 변경 내역을 `CODEX_SESSION_LOG.md`에 기록

### 수정 파일

- schema.sql
- index.html
- core.html
- raid.html
- parties.html
- CODEX_SESSION_LOG.md

### 변경 내용

- `schema.sql`에 현재 HTML 코드가 사용하는 부계정, 아이콘 URL, 레이드 골드 수령 여부, 색상, 임시 파티 변경 추적, 인덱스 컬럼/DDL을 추가했다.
- `raid.html`에서 누락되어 `init is not defined`를 일으키던 스크립트 본문을 이전 정상 함수 블록으로 복구하고, 레이드 숙제 자동 생성 시 `receive_bound`/`bonus_gold`도 함께 저장되도록 보정했다.
- `index.html` 상단 캐릭터 탭 아이콘 위치/크기를 조정하고, 좁은 해상도에서 레이아웃이 세로로 대응되도록 보강했다.
- 일반/원정대 숙제 복제 시 `icon_url`과 활성화 요일이 함께 복제되도록 수정했다.
- 레이드 숙제 난이도 색상을 레이드명 색상과 맞추고, 유통/귀속/더보기 골드를 각각 별도 색상 박스로 표시했다.
- 레이드 골드 수령 토글 저장에 `await`와 오류 처리를 추가했다.
- `core.html` 잠금 상태에서 코어 등급/우선순위/조합 편집이 동작하지 않도록 막고, 질서 해/달/별 접기 헤더 색상을 구분했다.
- `parties.html`에서 파티에는 없지만 레이드 숙제가 있는 캐릭터를 필터/목록에 포함하고 `파티 없음` 카드로 표시하도록 했다.

### 검증

- `node tools/check-project.js` 통과
- 5개 HTML 모두 JavaScript syntax OK
- `</html>` 뒤 코드 없음

### 남은 문제

- 실제 Supabase DB에 최신 `schema.sql` 적용 필요
- 브라우저에서 `3.docx` 시나리오 기준 수동 확인 필요
- 시스템 Git 설정 `C:/Program Files/Git/etc/gitconfig`의 `core.longpaths=true~` 값 때문에 일반 `git status`가 실패하며, 이번 작업에서는 `GIT_CONFIG_NOSYSTEM=true`로 우회했다.
## 2026-04-28 12:05 - 현재버그목록.docx 기반 추가 조치

### 요청
- `현재버그목록.docx`의 형광 표시/버그 항목을 기준으로 실제 조치.
- 정적 HTML 구조 유지, 기존 기능 삭제 금지, 변경 내역 기록.

### 수정 파일
- `index.html`
- `core.html`
- `raid.html`
- `overview.html`
- `parties.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- `index.html`
  - 좁은 해상도에서 계정명/캐릭터 수와 수정/숨김/삭제 버튼이 겹치지 않도록 계정 행을 반응형 2줄 구조로 보강.
  - 원정대 숙제 완료 숨김과 캐릭터 숙제 완료 숨김을 별도 상태로 분리.
  - 캐릭터 숙제 체크/카운트 변경 시 탭/본문 프로그레스가 즉시 갱신되도록 렌더 트리거 추가.
  - 재화 추가/수정 팝업에 이미지 아이콘 선택 및 수정 기능 추가.
- `core.html`
  - 잠금 상태에서 코어 셀/조합 카드 hover, 포인터, 입력 커서가 편집 가능처럼 보이지 않도록 잠금 CSS 보강.
  - 사용자 설정 조합의 등급 배지 cursor를 클릭형으로 명시.
- `raid.html`
  - 주간 일정 임시 파티 캐릭터 선택 시 해당 레이드 입장 레벨 이상만 표시.
  - 임시 변경 멤버를 `임시파티연동` 배지로 표시.
  - 임시 추가/제거 직후 슬롯 강조 필터와 일정 카드가 즉시 갱신되도록 보강.
  - 공유 뷰어의 레이드 현황 탭에 전체/미완료/완료 필터 추가.
  - `parties.html`에서 일정 버튼으로 이동할 때 주간 일정 탭을 열도록 연동.
- `overview.html`
  - 전체/계정별 레이드 현황에 유통 골드, 귀속 골드, 더보기 골드를 각각 완료/총량 및 프로그레스 바로 표시.
- `parties.html`
  - 난이도 텍스트 크기를 레이드명과 맞춤.
  - 일정 요일/일정 버튼 클릭 시 `raid.html` 주간 일정 탭으로 이동.
  - 현재 주 임시 파티 연동 정보를 읽어 임시 파티 카드/배지로 표시.
  - 캐릭터별 파티 카드 정렬 토글 추가: `파티 없음 뒤` / `레이드 순서`.

### 검증
- `node tools/check-project.js` 통과.
- `index.html`, `core.html`, `raid.html`, `overview.html`, `parties.html` 모두 `</html>` 뒤 후행 코드 없음 확인.

### 남은 확인
- 실제 Supabase 데이터가 있는 브라우저 화면에서 임시 파티 override, 공유 링크 필터, 골드 집계가 의도대로 보이는지 수동 확인 필요.
