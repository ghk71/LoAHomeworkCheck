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

## 2026-04-30 00:00 - 추가기능 및 버그 수정 문서 잔여 항목 반영

### 요청

- `추가기능 및 버그 수정.docx`에 남아 있던 공유링크/overview/임시파티/날짜 테스트/파티구성 동작 수정사항 전체 반영.

### 수정 파일

- `index.html`
- `raid.html`
- `overview.html`
- `parties.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용

- 공유링크 `레이드` 탭 주간일정 카드에서 파티 이동 버튼을 숨기고, 선택 계정 변경 버튼을 레이드 탭에도 추가.
- 공유링크 `레이드 현황` 상단 버튼을 `캐릭터 추가`로 변경하고, 각 캐릭터 카드 하단에 `레이드 추가` 버튼 배치.
- 공유링크에서 캐릭터 추가 모달을 제공하고, 선택 계정 범위에 캐릭터를 추가할 수 있게 함.
- 공유링크 슬롯 강조 필터가 선택 계정 및 부계정 캐릭터만 표시/유지하도록 보정.
- `overview.html` 레이드 행의 유통/귀속/더보기 표시는 금액이 아니라 `받음/안받음`, `함/안함` 여부만 표시하도록 변경.
- 임시파티 해제된 W 캐릭터가 `parties.html`에서 `파티 없음` 카드와 중복 표시되지 않도록 `removed.taskId` 기준으로 제외.
- 임시파티 해제된 W 캐릭터의 `overview.html` 레이드 아이콘/팝업이 사라지지 않도록 override schedule 기준 preset 정보를 복원해 표시.
- `index.html` 설정 모달에 테스트 기준 날짜 입력을 추가하고, index/raid/overview/parties의 주요 주차/초기화 계산이 `la_test_now`를 공유하도록 변경.
- `raid.html` 파티구성에서 레이드 그룹을 닫으면 하위 난이도 열림 상태도 함께 닫히도록 변경.
- 주간일정에서 파티구성으로 이동할 때 기존에 열려 있던 그룹/난이도를 모두 닫고 해당 파티의 그룹/난이도만 열리도록 변경.
- `parties.html` 파티 카드의 직업/전투력 표시가 긴 텍스트에서 카드 레이아웃을 밀지 않도록 grid/ellipsis 처리.

### 검증

- 권한 상승 실행 `node tools/check-project.js` 통과.
- 5개 주요 HTML 모두 `</html>` 뒤 코드 없음 확인.
- `git diff --check` 통과. 단, Git LF->CRLF 경고만 출력.

## 2026-04-30 00:00 - 레이드 연동 파생 버그 보정

### 요청

- `추가기능 및 버그 수정.docx` 반영 이후 발생 가능한 파생 버그 수정.

### 수정 파일

- `raid.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용

- 파티 배치/임시 파티/주간 일정 완료 처리에서 레이드 숙제를 찾을 때 `name.ilike` 또는 레이드명 포함 검색을 사용하지 않도록 수정.
- `preset_id`가 이미 일치하는 숙제를 최우선으로 사용하고, 기존 수동 숙제 마이그레이션은 레이드명/난이도가 정확히 맞는 경우에만 `preset_id`를 연결하도록 변경.
- 주간 일정 완료 처리 시 일부 캐릭터만 `preset_id`로 연결되어 있으면 일부만 완료 처리되던 문제를 보정. 각 유효 슬롯 캐릭터별로 정확한 레이드 숙제를 보장한 뒤 완료 상태를 반영한다.
- 공유 링크 뷰어의 주간 일정 강조 필터가 선택 계정 및 부계정 범위를 벗어난 캐릭터를 표시/유지하지 않도록 수정.
- `raid.html`에 중복 정의되어 있던 `openAddPreset()`를 정리.

### 검증

- 권한 상승 실행 `node tools/check-project.js` 통과.
- 5개 주요 HTML 모두 `</html>` 뒤 코드 없음 확인.
- `git diff --check` 통과. 단, Git의 LF->CRLF 경고만 출력.

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

## 2026-04-28 13:10 - 현재버그목록2.docx 기반 추가 조치

### 요청
- `현재버그목록2.docx`에 적힌 잔여 UI/동기화 버그 조치.
- 정적 HTML 구조 유지, 기존 기능 삭제 금지, 변경 내역 기록.

### 수정 파일
- `index.html`
- `raid.html`
- `overview.html`
- `parties.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- `index.html`
  - 계정 목록이 좁은 폭에서 계정명/캐릭터 수와 수정/숨김/삭제 버튼을 분리해 배치하도록 반응형 CSS 보강.
  - 원정대 숙제와 캐릭터 숙제에 각각 `활성화 보이기/숨기기` 토글 추가.
  - 하위 숙제 완료로 상위 숙제 상태가 바뀌는 경우 즉시 전체 목록/상단 캐릭터 탭을 다시 렌더링하도록 보강.
  - 숙제/레이드 체크 저장을 `await` 기반으로 바꿔 페이지 이동/새로고침 뒤 완료 상태가 되돌아갈 가능성을 낮춤.
  - 레이드 골드 요약을 유통/귀속/더보기 3개 뱃지로 분리하고 각 색상 스타일 적용.
  - 현재 주차 `raid_schedule_overrides.temp_changes.added`를 읽어 임시 파티 연동 레이드 숙제를 `임시파티연동`으로 표시하고 팝업에도 임시 배지를 표시.
- `raid.html`
  - 공유 링크 박스에 `overflow-wrap:anywhere`, `word-break:break-all`을 적용해 긴 공유 URL이 모달 밖으로 넘치지 않게 수정.
  - 뷰어 모드 레이드현황의 전체/미완료/완료 필터를 주간 일정 쪽과 같은 캐릭터 기반 필터 UI로 교체.
- `overview.html`
  - 골드 진행바 UI를 카드형 그리드로 정리하고 계정 헤더가 줄바꿈되어도 덜 깨지도록 조정.
  - 계정별 진행 표시 옆에 `레이드 완료` 라벨 추가.
  - 레이드 완료 토글 후 상단 요약뿐 아니라 계정별 골드/진행바도 즉시 갱신되도록 전체 렌더 호출로 변경.
  - 임시 파티 연동 레이드 숙제를 `임시파티연동`으로 표시하고 파티 팝업에도 임시 배지를 표시.
- `parties.html`
  - 요일/일정 링크에 hover 효과 추가.
  - 해상도 변화 시 탈퇴 버튼이 찌그러지지 않도록 footer wrap, min-width, 모바일 flex 규칙 보강.

### 검증
- `node tools/check-project.js` 통과.
- `index.html`, `core.html`, `raid.html`, `overview.html`, `parties.html` 모두 `</html>` 뒤 코드 없음 확인.

### 남은 수동 확인
- 실제 Supabase 데이터가 있는 브라우저에서 완료 저장 후 새로고침, 활성화 보이기 토글, 임시 파티 연동 표시, 공유 뷰어 필터를 한 번씩 확인 필요.

## 2026-04-28 13:45 - 현재버그목록3.docx 반영

### 요청
- `현재버그목록3.docx`의 추가 버그 및 UI 요구사항 반영.
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
  - 마지막으로 선택한 캐릭터를 `localStorage.la_index_last_char`에 저장하고, 새로고침/페이지 이동 후에도 해당 캐릭터로 복귀하도록 계정 선택 흐름을 수정.
  - 계정 선택 직후 해당 계정의 캐릭터 숙제 요약을 먼저 로드해 상단 캐릭터 탭의 완료 상태가 빈 상태로 보이지 않도록 수정.
  - 원정대/캐릭터 숙제 완료 토글과 카운트 변경을 DB 저장 성공 후 상태 반영 및 재렌더하도록 정리해 `완료 숨기기`가 즉시 적용되도록 수정.
  - 하위 숙제 순서 변경 시 화면상 인덱스 대신 task id 기준으로 이동하도록 수정해 완료 숨김/필터 상태에서 순서가 꼬일 가능성을 줄임.
  - 레이드 숙제의 난이도 텍스트 크기를 레이드명과 맞추고, 난이도별 CSS 색상이 유지되도록 인라인 색상 덮어쓰기를 제거.
  - 완료 캐릭터와 선택+완료 캐릭터가 시각적으로 구분되도록 상단 캐릭터 탭 스타일 보강.
  - 1600x900 전후의 좁은 데스크톱에서도 사이드바/계정 액션/헤더가 덜 깨지도록 반응형 CSS 보강.
- `core.html`
  - 혼돈 해/달/별 셀에서는 `core-name-input`을 렌더하지 않도록 수정하고, 질서 코어명 입력은 유지.
  - 사용자 조합의 질서 해/달/별 라벨이 코어명이 있으면 코어명, 없으면 기본 `질서해6` 형식으로 표시되도록 수정.
  - 질서 코어명이 변경되면 사용자 조합 라벨도 즉시 갱신되도록 수정.
- `raid.html`
  - 주간 일정 드래그 중 여러 날짜가 동시에 강조되지 않도록 드래그 오버 강조 클래스를 매번 정리.
  - 공유 링크 레이드 현황 필터를 계정/부계정 그룹형 캐릭터 필터로 조정하고, 기본 접힘 상태로 표시.
- `overview.html`, `parties.html`
  - 캐릭터 필터를 기본 접힘 상태로 변경.

### 검증
- `node tools/check-project.js` 통과.
- `index.html`, `core.html`, `raid.html`, `overview.html`, `parties.html` 모두 `</html>` 뒤 코드 없음 확인.

### 남은 수동 확인
- 실제 Supabase 데이터가 있는 브라우저에서 완료 처리 후 새로고침 유지, 상단 캐릭터 완료 표시, 하위 숙제 드래그 정렬, 공유 뷰어 필터 접힘/토글 동작을 확인 필요.

## 2026-04-29 00:25 - 현재 버그 및 추가 기능.docx 반영

### 요청
- `현재 버그 및 추가 기능.docx`에 적힌 공유 뷰어 필터, 일정 추가 UI, 숙제 분리, 재화 조작 개선 반영.
- 정적 HTML 구조 유지, 기존 기능 삭제 금지, 변경 내역 기록.

### 수정 파일
- `index.html`
- `raid.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- `raid.html`
  - 공유 링크 뷰어의 레이드 현황 캐릭터 필터에서 본계정 행에는 본계정 캐릭터만 표시하고, 부계정 캐릭터는 `본계정명-부계정` 행으로 묶어 표시하도록 수정했다.
  - 일정 추가/수정 모달의 파티 선택을 native select 대신 카드형 목록으로 보이게 하고, 카드 hover 시 해당 파티 구성원을 바로 확인할 수 있게 했다.
  - 일정 추가/수정 후 주간 일정 상단 슬롯 강조 캐릭터 목록이 즉시 갱신되도록 `renderSchFilter()`를 호출했다.
- `index.html`
  - 캐릭터 숙제 영역을 일일 숙제/주간 숙제 좌우 2열로 분리했다.
  - 숙제 추가 기본값을 일일 숙제로 바꾸고, 모달 라벨을 `일일/주간 선택`으로 명확히 했다.
  - 상단 캐릭터 탭 완료 상태와 숙제 영역 진행률은 일일 숙제만 기준으로 계산하도록 수정했다.
  - 재화 칩을 `- / 재화명 수량 / +` 형태로 바꾸고, 수량 클릭 시 직접 설정, `...` 클릭 시 기존 상세 수정 팝업을 열도록 보강했다.

### 검증
- `node tools/check-project.js` 실행 시 이 컴퓨터의 `node.exe` 실행 권한 문제로 `Access is denied` 실패.
- PowerShell 보조 검사로 5개 HTML 모두 `</html>` 뒤 후행 코드 없음 확인.
- PowerShell 보조 검사로 5개 HTML 모두 사용 CSS 변수 정의 확인.
- `git diff --check` 통과. 단, Git이 `index.html`, `raid.html` LF→CRLF 변환 경고를 출력함.

### 남은 수동 확인
- 실제 브라우저/Supabase 데이터에서 공유 뷰어 필터 그룹, 일정 추가 모달 파티 hover 구성원 표시, 일정 추가 직후 슬롯 강조 목록 갱신, 일일/주간 숙제 분리, 재화 빠른 증감/직접 입력 저장을 확인 필요.

## 2026-04-29 01:10 - 수정 기능 피드백 및 파생 버그 반영

### 요청
- `현재 버그 및 추가 기능.docx`의 수정 기능 피드백/파생 버그를 추가 반영.
- 기존 정적 HTML 구조와 Supabase 스키마를 유지하고 작은 범위로 수정.

### 수정 파일
- `index.html`
- `raid.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- `raid.html`
  - 공유 링크 뷰어의 레이드 현황 본문도 `overview.html`처럼 본계정 캐릭터와 `본계정 - 부계정` 캐릭터 묶음을 분리해서 표시하도록 수정.
  - 일정 추가/수정 모달을 넓은 레이아웃으로 바꾸고, 파티 목록 우측에 파티 구성원 미리보기 패널을 추가.
  - 파티 카드 hover/선택 시 우측 패널에 4인/8인 구성원이 세로 목록으로 즉시 표시되도록 수정.
- `index.html`
  - 숙제 추가/수정 모달에 별도의 `그룹 선택` 버튼 UI를 추가하고 일일/주간 숙제 영역 선택이 더 명확하게 보이도록 수정.
  - 재화 현황을 카드형 그리드로 재설계.
  - 재화 수량은 alert/prompt 대신 카드 안 숫자 입력칸에서 직접 수정하도록 변경.
  - 재화 섹션 우측 상단에 `추가`, `수정`, `삭제` 버튼을 배치.
  - 일반 모드에서는 `- / 수량 입력 / +`, 수정 모드에서는 각 카드 우측 수정 아이콘, 삭제 모드에서는 삭제 아이콘만 표시되도록 변경.
  - 수정 아이콘 클릭 시 기존 재화 추가 모달을 수정 모드로 재사용하여 이름/수량/아이콘을 저장하도록 변경.

### 검증
- `node tools/check-project.js` 실행 시 현재 컴퓨터의 `node.exe` 실행 권한 문제로 `Access is denied` 실패.
- PowerShell 보조 검사로 5개 HTML 모두 `</html>` 뒤 코드 없음 확인.
- PowerShell 보조 검사로 5개 HTML 모두 사용 CSS 변수 정의 확인.
- `git diff --check` 통과. 단, Git이 `index.html`, `raid.html` LF→CRLF 변환 경고를 출력.

### 남은 수동 확인
- 실제 브라우저/Supabase 데이터에서 공유 뷰어 본문/필터 부계정 묶음, 일정 모달 우측 파티 미리보기, 숙제 그룹 선택 저장, 재화 일반/수정/삭제 모드와 수량 입력 저장을 확인 필요.

## 2026-04-29 01:35 - 파티 미리보기 및 재화 현황 디자인 피드백 반영

### 요청
- `raid.html` 일정 추가/수정 모달 우측 파티 정보가 잘 보이도록 두 번째 참고 이미지 형태의 카드 디자인으로 개선.
- `index.html` 재화 현황 뱃지와 +/- 버튼이 따로 노는 디자인을 재구성하고, 텍스트 잘림과 숫자 입력 화살표 표시를 수정.
- 재화 수정/삭제 모드에서 다른 화면 영역을 클릭하면 토글이 꺼지도록 수정.

### 수정 파일
- `index.html`
- `raid.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- `raid.html`
  - 일정 모달 우측 파티 미리보기 폭을 넓히고 헤더/멤버 리스트가 분리된 카드형 디자인으로 수정.
  - 멤버 행을 슬롯 번호, 캐릭터명, 클래스가 명확히 보이는 리스트로 변경.
  - 요청에서 제외한 파티 이동/일정/탈퇴 버튼과 캐릭터 강조 슬롯 기능은 구현하지 않음.
- `index.html`
  - 재화 현황을 +/- 버튼과 중앙 카드가 하나의 컨트롤처럼 보이도록 캡슐형 디자인으로 재구성.
  - 재화명 텍스트가 말줄임으로 잘리지 않도록 카드 폭과 텍스트 줄바꿈 규칙을 조정.
  - 재화 수량 숫자 입력칸의 브라우저 기본 상하 화살표를 숨김.
  - 수정/삭제 모드에서 재화 섹션 바깥을 클릭하면 일반 모드로 돌아가도록 전역 클릭 처리 추가.

### 검증
- `node tools/check-project.js` 실행 시 현재 컴퓨터의 `node.exe` 실행 권한 문제로 `Access is denied` 실패.
- PowerShell 보조 검사로 5개 HTML 모두 `</html>` 뒤 코드 없음 확인.
- PowerShell 보조 검사로 5개 HTML 모두 사용 CSS 변수 정의 확인.
- `git diff --check` 통과. 단, Git이 `index.html`, `raid.html` LF→CRLF 변환 경고를 출력.

### 남은 수동 확인
- 실제 브라우저에서 일정 모달 파티 미리보기 가독성, 재화 현황 카드 폭/줄바꿈, 숫자 입력 화살표 숨김, 수정/삭제 토글 외부 클릭 해제를 확인 필요.

## 2026-04-29 01:55 - 전체 기능 테스트 시뮬레이션 문서 작성

### 요청
- 이전부터 요청했던 모든 기능과 파생 기능을 시나리오 형태로 테스트할 수 있는 MD 파일 작성.

### 수정 파일
- `FULL_TEST_SIMULATION.md`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- `FULL_TEST_SIMULATION.md` 신규 작성.
- 공통 정적 구조 검사, index/core/raid/overview/parties 전체 기능, 페이지 간 연동, 새로고침 유지, 반응형 회귀, 공유 링크 뷰어, 임시 파티, 재화 수정/삭제 모드 등 과거 요청과 파생 기능을 시나리오로 정리.
- 테스트 기록 템플릿과 최종 합격 체크리스트 추가.

### 검증
- 문서 추가 작업이므로 HTML 후행 코드/CSS 변수 보조 검사는 기존 5개 HTML 대상으로 확인 예정.
- `node tools/check-project.js`는 현재 컴퓨터의 `node.exe` 권한 문제로 실패 가능성이 있음.

## 2026-04-29 02:10 - 재화 현황 색감/폭 및 일정 모달 정렬 피드백 반영

### 요청
- `index.html` 재화 현황 색감과 카드/입력칸 overflow 문제 수정.
- `raid.html` 일정 추가 모달의 레이드/파티 선택 순서를 파티 구성 탭의 레이드 목록, 난이도, 파티 순서와 일치.
- 일정 추가 모달의 레이드 그룹 라벨을 더 크게 표시하고 지정 색상 적용.
- 우측 파티 정보창의 레이드명/난이도명도 지정 색상 적용.

### 수정 파일
- `index.html`
- `raid.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- `index.html`
  - 재화 카드 최소 폭을 넓히고 중앙 영역을 grid로 재구성해 수량 입력칸이 컨트롤 밖으로 빠져나가지 않도록 수정.
  - 재화 현황 색감을 기존 페이지 톤과 맞게 어두운 표면색과 골드 포인트 위주로 조정.
  - 재화명은 줄바꿈 가능하게 유지하고 입력칸은 고정 폭 안에 들어가도록 조정.
- `raid.html`
  - 일정 추가/수정 모달의 파티 선택 목록을 `getAllGroupNames()` 기반 레이드 그룹 순서, 난이도 `sort_order`, 파티 `sort_order` 순으로 렌더링하도록 수정.
  - 레이드 그룹 라벨을 키우고 `getGroupColor()`/`getGroupIcon()`을 적용.
  - 우측 파티 미리보기 헤더에서 레이드명은 그룹 지정 색상, 난이도명은 `diffClass()` 색상을 사용하도록 수정.

### 검증
- `node tools/check-project.js` 실행 시 현재 컴퓨터의 `node.exe` 실행 권한 문제로 `Access is denied` 실패.
- PowerShell 보조 검사로 5개 HTML 모두 `</html>` 뒤 코드 없음 확인.
- PowerShell 보조 검사로 5개 HTML 모두 사용 CSS 변수 정의 확인.
- `git diff --check` 통과. 단, Git이 `CODEX_SESSION_LOG.md`, `index.html`, `raid.html` LF→CRLF 변환 경고를 출력.

## 2026-04-29 02:50 - raid 뷰어 레이드 현황 진행률/정렬 재수정

### 요청
- `raid.html` 뷰어 레이드 현황에서 레이드 정렬이 파티 구성의 레이드명/난이도 순서를 따르도록 수정.
- 계정별 레이드 완료를 progress bar로 표시.
- 일정 표시는 `4/23` 같은 날짜가 아니라 요일로 표시.
- 레이드명과 난이도명 텍스트 크기를 맞춤.
- 캐릭터 카드 우상단의 `0/5` 숫자 표시를 progress bar로 대체.

### 수정 파일
- `raid.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- 뷰어 레이드 현황 정렬 키를 `getAllGroupNames()` 레이드 그룹 순서, 프리셋 `sort_order`, 숙제 `sort_order` 순서로 변경.
- 계정/부계정 헤더에 레이드 완료 progress bar와 overview 스타일의 유통/귀속/더보기 골드 `획득 / 전체` progress bar를 추가.
- 주간 일정 연동 표시는 날짜 대신 `목요일` 같은 요일 라벨로 변경.
- 레이드명/난이도명 텍스트 크기를 동일하게 맞추는 `.vo-diff` 스타일 추가.
- 캐릭터 카드 헤더의 완료 수 텍스트를 제거하고 진행률 바만 표시하도록 변경.

### 검증
- `node tools/check-project.js` 실행 시 현재 컴퓨터의 `node.exe` 실행 권한 문제로 `Access is denied` 실패.
- PowerShell 보조 검사로 5개 HTML 모두 `</html>` 뒤 코드 없음 확인.
- PowerShell 보조 검사로 5개 HTML 모두 사용 CSS 변수 정의 확인.
- `git diff --check` 통과. 단, Git이 `CODEX_SESSION_LOG.md`, `raid.html` LF→CRLF 변환 경고를 출력.

## 2026-04-29 03:00 - raid 뷰어 progress bar 렌더링 버그 수정

### 요청
- `raid.html` 뷰어 레이드 현황의 progress bar가 채워지지 않는 문제 수정.
- 캐릭터 카드 우상단 progress bar 오른쪽에 `0/5` 형식의 완료 수를 함께 표시.

### 수정 파일
- `raid.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- `.vo-progress-fill`, `.vo-card-progress-fill`에 `display:block`을 추가해 inline 요소 때문에 width/height가 막대로 렌더링되지 않던 문제를 수정.
- 캐릭터 카드 헤더를 `캐릭터명 / progress bar / 완료수` 3열로 변경.
- `.vo-card-count` 스타일을 추가해 progress bar 우측에 `done/total` 수치를 표시.

### 검증
- `node tools/check-project.js` 실행 시 현재 컴퓨터의 `node.exe` 실행 권한 문제로 `Access is denied` 실패.
- PowerShell 보조 검사로 5개 HTML 모두 `</html>` 뒤 코드 없음 확인.
- PowerShell 보조 검사로 5개 HTML 모두 사용 CSS 변수 정의 확인.
- `git diff --check` 통과. 단, Git이 `CODEX_SESSION_LOG.md`, `raid.html` LF→CRLF 변환 경고를 출력.

### 남은 수동 확인
- 실제 브라우저에서 재화 카드 폭/색감, 긴 재화명 줄바꿈, 일정 모달 목록 순서, 레이드 그룹/난이도 색상 표시를 확인 필요.

## 2026-04-29 02:35 - 재화 액션 모드 및 raid 뷰어/오늘 표시 피드백 반영

### 요청
- `index.html` 재화 현황에서 수정/삭제 모드로 전환하면 카드 내부 액션 아이콘 배치가 깨지는 문제 수정.
- `raid.html` 주간 일정의 "오늘" 표시를 자정 기준이 아니라 오전 6시 초기화 기준으로 변경.
- `raid.html` 뷰어 모드 주간 일정에서 완료 버튼 제거.
- `raid.html` 뷰어 모드 레이드 현황을 파티 구성의 레이드/난이도 순서에 맞게 정렬하고, 계정별 완료/유통골드/귀속골드/더보기골드 요약 및 일정 날짜 표시를 추가.

### 수정 파일
- `index.html`
- `raid.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- `index.html`
  - 재화 수정/삭제 모드에서 액션 아이콘이 별도 줄처럼 떨어지지 않도록 액션 모드 전용 그리드 폭과 카드 테두리 규칙을 추가.
- `raid.html`
  - `getGameNowKST()`를 추가해 오전 6시 전에는 전날을 게임 기준 날짜로 계산하도록 변경.
  - 주간 일정의 오늘 강조와 일정 추가 기본 요일을 게임 기준 날짜로 통일.
  - 뷰어 모드 일정 카드에서 완료 버튼을 렌더링하지 않도록 변경.
  - 뷰어 레이드 현황 데이터 로딩에 레이드 프리셋/파티/파티원/일정 정보를 포함.
  - 뷰어 레이드 현황 카드를 캐릭터별 카드형 UI로 개선하고, 레이드 정렬을 프리셋 `sort_order` 기준으로 맞춤.
  - 계정/부계정 묶음별 완료 수, 남은 유통골드, 귀속골드, 더보기골드를 표시.
  - 파티에 연동된 레이드가 이번 주 일정에 있으면 해당 카드 우측에 날짜를 표시.

### 검증
- `node tools/check-project.js` 실행 시 현재 컴퓨터의 `node.exe` 실행 권한 문제로 `Access is denied` 실패.
- PowerShell 보조 검사로 5개 HTML 모두 `</html>` 뒤 코드 없음 확인.
- PowerShell 보조 검사로 5개 HTML 모두 사용 CSS 변수 정의 확인.
- `git diff --check` 통과. 단, Git이 `CODEX_SESSION_LOG.md`, `index.html`, `raid.html` LF→CRLF 변환 경고를 출력.
## 2026-04-29 03:15 - HANDOFF 인수인계 문서 추가

### 요청
- 연구실/집 컴퓨터 사이에서 매번 긴 시작 프롬프트를 새로 요청하지 않도록 고정 인수인계 문서를 추가.
- 오늘 작업 종료 시점 기준으로 다음 작업자가 바로 이어받을 수 있게 `HANDOFF.md`를 갱신.

### 수정 파일
- `HANDOFF.md`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- `HANDOFF.md` 신규 작성.
- 다음 작업자가 사용할 시작 문장, 필수로 읽을 문서, 프로젝트 규칙, 최근 구현 내용, 다음 수동 확인 항목, 현재 PC의 검증 이슈, 작업 종료 루틴을 정리.
- 최근 `index.html` 재화현황 수정, `raid.html` 일정/뷰어/레이드 현황 수정, `FULL_TEST_SIMULATION.md` 작성 흐름을 인수인계 내용에 반영.

### 검증
- `node tools/check-project.js` 실행 시 현재 컴퓨터의 `node.exe` 권한 문제로 `Access is denied` 실패.
- PowerShell 보조 검증으로 5개 주요 HTML(`index.html`, `core.html`, `raid.html`, `overview.html`, `parties.html`) 모두 `</html>` 뒤 코드 없음 확인.
- `git diff --check` 통과. 단, Git이 `CODEX_SESSION_LOG.md`의 LF→CRLF 변환 경고를 출력.
- 문서 추가 작업이므로 HTML 구조 변경은 없음.

## 2026-04-29 10:52 - 일일숙제 선택 확장 및 파티구성 긴 레이드명 보정

### 요청
- `index.html` 일일숙제 복제 모달에 전체 선택과 계정별 선택 추가.
- `index.html` 숙제 삭제 일괄 선택에서 현재 계정 캐릭터만 보이던 범위를 전체 계정/전체 캐릭터로 확장하고 전체/계정별 선택 제공.
- `raid.html` 파티구성 탭에서 긴 레이드명이 이미지 옆에서 줄바꿈되어 레이아웃이 깨지는 문제 수정.

### 수정 파일
- `index.html`
- `raid.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- `index.html`
  - 일일숙제 복제 캐릭터 목록에 전체 선택 체크박스와 계정별 선택 체크박스를 추가.
  - 복제 실행 시 계정 체크박스가 대상 캐릭터로 처리되지 않도록 캐릭터 체크박스만 수집하도록 변경.
  - 캐릭터 숙제 삭제 시 같은 이름 숙제를 현재 계정이 아니라 모든 계정의 모든 캐릭터에서 찾도록 변경.
  - 일괄 삭제 모달에서 캐릭터 선택 변경 시 계정별 체크박스와 전체 선택 상태가 함께 갱신되도록 보정.
- `raid.html`
  - 파티구성 레이드 그룹명과 파티명 영역에 `min-width:0`, `overflow:hidden`, `text-overflow:ellipsis`, `white-space:nowrap`를 적용.
  - 레이드명 텍스트를 별도 span으로 감싸 아이콘 옆 텍스트가 두 줄로 밀리지 않고 말줄임 처리되도록 수정.

### 검증
- `node tools/check-project.js`는 일반 권한에서 현재 PC의 `node.exe` EPERM 문제로 실패했으나, 권한 우회 실행으로 통과.
- 5개 주요 HTML(`index.html`, `core.html`, `raid.html`, `overview.html`, `parties.html`) 모두 JavaScript syntax OK.
- 5개 주요 HTML 모두 `</html>` 뒤 코드 없음 확인.
- 5개 주요 HTML 모두 CSS 변수 누락 없음 확인.
- `git diff --check` 통과. 단, Git이 `index.html`, `raid.html`의 LF→CRLF 변환 경고를 출력.

### 남은 수동 확인
- 브라우저에서 일일숙제 복제 모달의 전체 선택/계정별 선택/개별 선택 조합 확인.
- 숙제 삭제 모달에서 다른 계정 캐릭터의 같은 이름 숙제가 표시되고 선택 삭제되는지 확인.
- `raid.html` 파티구성 탭에서 긴 레이드명이 아이콘 옆 한 줄 말줄임으로 보이는지 확인.

## 2026-04-29 11:03 - 숙제 일괄 삭제 기준을 복제 그룹 ID로 변경

### 요청
- 숙제 삭제 버튼 클릭 시 같은 이름 기준으로 전체 계정/캐릭터를 찾으면서 관련 없는 숙제가 삭제 후보로 표시되는 문제 수정.
- 복제본끼리만 안정적으로 묶일 수 있도록 이름이 아닌 ID 기반 방식 검토 및 적용.

### 수정 파일
- `index.html`
- `schema.sql`
- `DB_MIGRATION_LOG.md`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- `schema.sql`
  - `tasks.clone_group_id`, `expedition_tasks.clone_group_id` 컬럼 추가.
  - 두 컬럼에 대한 조회 인덱스 추가.
- `index.html`
  - 신규 상위 숙제 생성 시 생성된 자기 `id`를 `clone_group_id`로 저장하도록 보정.
  - 일일/주간 숙제 복제 시 원본과 복제본이 같은 `clone_group_id`를 공유하도록 변경.
  - 원정대 숙제 복제도 같은 방식으로 `clone_group_id`를 공유하도록 변경.
  - 삭제 모달 후보 조회를 숙제명 비교에서 `clone_group_id` 비교로 변경해 이름만 같은 다른 숙제가 섞이지 않도록 수정.
  - 삭제 모달 안내 문구를 "같은 이름"이 아니라 "복제본" 기준으로 변경.
- `DB_MIGRATION_LOG.md`
  - Supabase SQL Editor에서 적용할 clone group 컬럼/인덱스 마이그레이션 기록 추가.

### 검증
- `node tools/check-project.js`는 일반 권한에서 현재 PC의 `node.exe` EPERM 문제로 실패했으나, 권한 우회 실행으로 통과.
- 5개 주요 HTML(`index.html`, `core.html`, `raid.html`, `overview.html`, `parties.html`) 모두 JavaScript syntax OK.
- 5개 주요 HTML 모두 `</html>` 뒤 코드 없음 확인.
- 5개 주요 HTML 모두 CSS 변수 누락 없음 확인.
- `git diff --check` 통과. 단, Git이 `DB_MIGRATION_LOG.md`, `index.html`, `schema.sql`의 LF→CRLF 변환 경고를 출력.

### 남은 수동 확인
- Supabase SQL Editor에 최신 `schema.sql` 또는 clone group ALTER/INDEX SQL 적용 필요.
- 새로 복제한 숙제 삭제 시 복제본만 후보로 뜨고, 이름만 같은 별도 숙제는 뜨지 않는지 확인.
- 기존에 이미 복제되어 있던 과거 숙제는 `clone_group_id`가 없을 수 있으므로, 이후 새 복제본부터 정확히 묶이는지 확인.

## 2026-04-29 11:29 - 숙제 월간 초기화 주기 추가

### 요청
- 현재 일일숙제/원정대 숙제의 초기화 주기가 매일/매주만 있으므로 `매달 1일` 초기화 옵션 추가.

### 수정 파일
- `index.html`
- `FEATURE_SPEC.md`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- `index.html`
  - 숙제 추가/수정 모달의 그룹 선택에 `월간 숙제` 버튼 추가.
  - 초기화 주기 select에 `매월 1일 (06:00 KST)` 옵션 추가.
  - `reset_type='monthly'`를 지원하도록 초기화 기준 계산 추가.
  - 월간 초기화 기준은 KST 매월 1일 06:00으로 계산.
  - 캐릭터 숙제 영역에 `월간 숙제` 컬럼을 추가하고 월간 배지 색상 추가.
  - 월간 숙제는 활성화 요일 설정 없이 항상 표시 대상으로 처리.
- `FEATURE_SPEC.md`
  - 숙제 초기화 스펙을 일일/주간/월간으로 갱신.

### 검증
- `node tools/check-project.js`는 일반 권한에서 현재 PC의 `node.exe` EPERM 문제로 실패했으나, 권한 우회 실행으로 통과.
- 5개 주요 HTML(`index.html`, `core.html`, `raid.html`, `overview.html`, `parties.html`) 모두 JavaScript syntax OK.
- 5개 주요 HTML 모두 `</html>` 뒤 코드 없음 확인.
- 5개 주요 HTML 모두 CSS 변수 누락 없음 확인.
- `git diff --check` 통과. 단, Git이 `index.html`의 LF→CRLF 변환 경고를 출력.

### 남은 수동 확인
- 브라우저에서 숙제 추가/수정 모달의 월간 선택 UI 확인.
- 월간 숙제가 월간 컬럼에 표시되고 `매월 1일` 배지가 보이는지 확인.
- 매월 1일 06:00 KST 기준 전후 완료 상태 초기화가 기대대로 계산되는지 확인.

## 2026-04-29 12:20 - 휴식 게이지 및 레이드 연동 표시 보정

### 요청
- 일반/원정대 숙제에 휴식 게이지 설정과 현재 게이지 입력, 강조 포인트 기반 활성화 표시를 추가.
- 월간 숙제는 별도 칸이 아니라 주간 숙제 칸에 같이 표시.
- `raid.html` 파티 슬롯 제거 시 `index.html` 레이드 숙제가 삭제되는 문제 수정.
- 공유 링크 레이드 현황에 골드 정보와 레이드순/요일순 정렬 토글 추가.
- 파티 배치가 없는 레이드 숙제에 파티연동 배지가 표시되는 문제를 `index.html`, `overview.html`, `raid.html` 공유 링크에서 수정.

### 수정 파일
- `index.html`
- `raid.html`
- `overview.html`
- `schema.sql`
- `FEATURE_SPEC.md`
- `BUG_HISTORY.md`
- `DB_MIGRATION_LOG.md`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- `tasks`, `expedition_tasks`에 휴식 게이지 컬럼을 추가하고 `schema.sql` 및 마이그레이션 로그에 반영.
- 숙제 추가/수정 모달에 휴식 게이지 사용 체크, 최대/현재/충전/소모/강조 포인트/일일 최대 클리어 횟수 입력 UI 추가.
- 휴식 게이지 사용 숙제는 현재 게이지가 강조 포인트 미만이면 기본 숨김 처리하고, 활성화 보이기 상태에서는 표시되도록 기존 활성화 필터와 결합.
- 리셋 처리 시 미완료 숙제는 충전, 완료 숙제는 현재 게이지가 1회 소모량 이상인 경우에만 소모하도록 처리.
- 월간 숙제 별도 칸을 제거하고 주간/월간 칸에 함께 렌더링.
- 일반 파티 슬롯 제거는 `raid_party_members`만 제거하도록 변경해 레이드 숙제가 삭제되지 않게 수정.
- 같은 레이드 프리셋 내에서 동일 캐릭터를 다시 배치하면 기존 중복 슬롯을 먼저 제거.
- 파티연동 배지는 실제 파티 멤버 배치 또는 임시 파티 추가가 있을 때만 표시하도록 `index.html`, `overview.html`, 공유 링크 현황 로직 보정.
- 공유 링크 레이드 현황 캐릭터 카드에 유통/귀속/더보기 골드 칩을 표시하고, 레이드 목록 순서/요일 순서 토글을 추가.

### 검증
- `node tools/check-project.js`는 일반 샌드박스에서 Windows 사용자 경로 EPERM으로 실패 후, 권한 상승 실행으로 통과.
- 5개 주요 HTML(`index.html`, `core.html`, `raid.html`, `overview.html`, `parties.html`) 모두 `</html>` 뒤 코드 없음 확인.
- CSS 변수 누락 없음 확인.
- `git diff --check` 통과. 단, Git LF→CRLF 경고 출력.

### 남은 수동 확인
- Supabase SQL Editor에 최신 `schema.sql` 또는 휴식 게이지 ALTER SQL 수동 적용 필요.
- 브라우저에서 휴식 게이지 미완료/완료 후 다음 초기화 시 충전/소모 동작 확인.
- 공유 링크 뷰어에서 레이드순/요일순 토글, 골드 칩, 파티연동 배지 표시 조건 확인.

## 2026-04-29 12:28 - 공유 링크 레이드 현황 기본 정렬 변경

### 요청
- `raid.html` 공유 링크 레이드 현황의 기본 탭을 요일순으로 변경.
- 요일순 정렬은 수요일이 가장 먼저, 화요일이 가장 마지막이 되도록 변경.

### 수정 파일
- `raid.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- 공유 링크 레이드 현황 정렬 기본값을 `요일 순`으로 변경.
- 요일 정렬 우선순위를 수 → 목 → 금 → 토 → 일 → 월 → 화로 변경.
- 요일 정보가 없는 레이드는 기존처럼 맨 뒤에서 레이드 목록 순서로 정렬.

## 2026-04-29 16:37 - 작업 종료용 HANDOFF 갱신

### 요청
- `HANDOFF.md`를 만들어달라는 요청과 함께 오늘 작업 종료용 인수인계 내용을 최신화.

### 수정 파일
- `HANDOFF.md`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- 기존 `HANDOFF.md`를 오늘 최종 작업 상태 기준으로 갱신.
- 다음 컴퓨터에서 사용할 시작 문장과 분석 전용 시작 문장을 정리.
- 최근 반영된 일일숙제 복제/삭제 선택 확장, `clone_group_id` 삭제 기준, 월간 초기화, 휴식 게이지, 파티연동 배지 보정, 공유 링크 레이드 현황 요일순 기본값을 인수인계에 반영.
- 실제 Supabase SQL Editor에 적용해야 하는 `clone_group_id` 및 휴식 게이지 컬럼 목록을 별도 알림으로 정리.
- 다음 수동 확인 항목과 현재 PC의 검증 이슈를 최신화.

### 검증
- 문서 갱신 작업이라 HTML 코드는 수정하지 않음.
- `node tools/check-project.js`는 일반 권한에서 Windows 사용자 경로 EPERM으로 실패 후, 권한 상승 실행으로 통과.

### 남은 문제
- 다음 작업 시작 전 Supabase SQL Editor에 최신 `schema.sql` 또는 `DB_MIGRATION_LOG.md`의 ALTER SQL 적용 여부 확인 필요.
## 2026-04-29 17:05 - raid 공지 댓글 기능 추가

### 요청
- `raid.html` 공지 아래 댓글 기능 추가.
- 댓글은 공유 링크 뷰어에서도 작성 가능해야 함.
- 댓글은 주마다 달라져야 하며, 미래 주차에도 미리 작성 가능해야 함.

### 수정 파일
- `raid.html`
- `schema.sql`
- `DB_MIGRATION_LOG.md`
- `FEATURE_SPEC.md`
- `HANDOFF.md`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- `raid.html`
  - 주간 공지 아래 댓글 영역을 추가.
  - 댓글은 `week_start_date` 기준으로 현재 선택된 주차에만 표시되도록 구현.
  - 닉네임과 댓글 내용을 입력해 등록할 수 있도록 구현.
  - 공유 링크 뷰어 모드에서도 댓글 입력/등록 가능.
  - 편집 모드에서는 댓글 삭제 버튼을 제공하고, 뷰어 모드에서는 삭제 버튼을 숨김.
  - `raid_notice_comments` 테이블이 아직 Supabase에 없을 경우 페이지 전체 로딩은 유지하고 댓글 영역에 테이블 미적용 안내를 표시.
- `schema.sql`
  - `raid_notice_comments` 테이블 추가.
  - `raid_notice_comments` RLS 비활성화 및 주차/작성일 인덱스 추가.
- `DB_MIGRATION_LOG.md`
  - Supabase SQL Editor에서 적용할 `raid_notice_comments` 생성 SQL 기록.
- `FEATURE_SPEC.md`
  - 주차별 공지 댓글과 공유 링크 댓글 작성 요구사항 추가.

### 검증
- `node tools/check-project.js`는 일반 권한과 권한 상승 실행 모두 현재 컴퓨터의 `node.exe` 권한 문제로 `Access is denied` 실패.
- 앱 내 Node REPL 기반 JavaScript parse 검사도 같은 OS 권한 문제로 실패.
- PowerShell 보조 검증으로 5개 주요 HTML(`index.html`, `core.html`, `raid.html`, `overview.html`, `parties.html`) 모두 `</html>` 뒤 코드 없음 확인.
- PowerShell 보조 검증으로 5개 주요 HTML 모두 CSS 변수 누락 없음 확인.
- `git diff --check` 통과. 단, Git LF→CRLF 변환 경고 출력.
## 2026-04-29 17:18 - raid 공지 댓글 접기 기능 추가

### 요청
- 공지 아래 댓글 영역에 접기 기능 추가.

### 수정 파일
- `raid.html`
- `FEATURE_SPEC.md`
- `HANDOFF.md`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- `raid.html`
  - 공지 댓글 헤더에 접기/펼치기 버튼 추가.
  - 댓글 목록과 입력폼을 `notice-comment-body`로 감싸 접힘 상태에서 숨기도록 변경.
  - 접힘 상태를 `localStorage.la_notice_comments_collapsed`에 저장해 새로고침 후에도 유지.
  - 접힌 상태에서도 댓글 개수는 헤더에 표시되도록 조정.
- `FEATURE_SPEC.md`, `HANDOFF.md`
  - 공지 댓글 접기/펼치기 요구사항과 수동 확인 항목 추가.

### 검증
- `node tools/check-project.js`는 일반 권한과 권한 상승 실행 모두 현재 컴퓨터의 `node.exe` 권한 문제로 `Access is denied` 실패.
- PowerShell 보조 검증으로 5개 주요 HTML(`index.html`, `core.html`, `raid.html`, `overview.html`, `parties.html`) 모두 `</html>` 뒤 코드 없음 확인.
- PowerShell 보조 검증으로 5개 주요 HTML 모두 CSS 변수 누락 없음 확인.
- `git diff --check` 통과. 단, Git LF→CRLF 변환 경고 출력.
## 2026-04-29 17:35 - raid 파티 구성 목록 다중 펼침 상태 추가

### 요청
- `raid.html` 레이드 그룹 앞 아이콘이 PC마다 다르게 보이는 이유 확인.
- 파티 구성 왼쪽 목록에서 한 레이드/난이도를 열어둔 상태로 다른 레이드/난이도를 눌러도 기존 항목이 닫히지 않게 수정.

### 수정 파일
- `raid.html`
- `HANDOFF.md`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- `raid.html`
  - 레이드 그룹 아이콘은 현재 `localStorage`의 `la_gicon_레이드명` 기반이라 PC별로 다를 수 있음을 확인.
  - 파티 구성 왼쪽 목록의 펼침 상태를 기존 단일 선택 상태(`selGroupName`, `selPresetId`)와 분리.
  - 열린 레이드 그룹은 `openRaidGroups`, 열린 난이도는 `openRaidPresets` Set으로 관리.
  - 펼침 상태를 `localStorage.la_raid_open_groups`, `localStorage.la_raid_open_presets`에 저장.
  - 그룹/난이도/파티 선택 시 기존에 열려 있던 다른 항목을 닫지 않도록 변경.

### 검증
- `node tools/check-project.js`는 일반 권한과 권한 상승 실행 모두 현재 컴퓨터의 `node.exe` 권한 문제로 `Access is denied` 실패.
- PowerShell 보조 검증으로 5개 주요 HTML(`index.html`, `core.html`, `raid.html`, `overview.html`, `parties.html`) 모두 `</html>` 뒤 코드 없음 확인.
- PowerShell 보조 검증으로 5개 주요 HTML 모두 CSS 변수 누락 없음 확인.
- `git diff --check` 통과. 단, Git LF→CRLF 변환 경고 출력.
## 2026-04-29 17:50 - 캐릭터별 섹션 표시 설정 추가

### 요청
- 캐릭터마다 레이드 숙제 / 재화 현황 / 커스텀 노트를 비활성화할 수 있게 수정.
- 비활성화하면 화면에서 안 보이고, 나중에 다시 볼 수 있어야 함.

### 수정 파일
- `index.html`
- `schema.sql`
- `DB_MIGRATION_LOG.md`
- `FEATURE_SPEC.md`
- `HANDOFF.md`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- `index.html`
  - 캐릭터 수정 모달에 `레이드 숙제`, `재화 현황`, `커스텀 노트` 표시 체크박스 추가.
  - 체크 해제된 섹션은 `renderTaskArea()`에서 렌더링하지 않도록 변경.
  - 데이터는 삭제하지 않고 숨김 처리만 하므로, 다시 체크하면 기존 내용이 그대로 표시됨.
  - 설정값은 `characters.show_raid_tasks`, `characters.show_currencies`, `characters.show_custom_notes`에 저장.
- `schema.sql`
  - `characters` 테이블 생성 정의와 기존 설치 업데이트용 ALTER에 표시 설정 컬럼 3개 추가.
- `DB_MIGRATION_LOG.md`, `FEATURE_SPEC.md`, `HANDOFF.md`
  - 신규 컬럼과 수동 확인 항목 기록.

### 검증
- `node tools/check-project.js`는 일반 권한과 권한 상승 실행 모두 현재 컴퓨터의 `node.exe` 권한 문제로 `Access is denied` 실패.
- PowerShell 보조 검증으로 5개 주요 HTML(`index.html`, `core.html`, `raid.html`, `overview.html`, `parties.html`) 모두 `</html>` 뒤 코드 없음 확인.
- PowerShell 보조 검증으로 5개 주요 HTML 모두 CSS 변수 누락 없음 확인.
- `git diff --check` 통과. 단, Git LF→CRLF 변환 경고 출력.
## 2026-04-29 18:05 - raid 그룹 아이콘 DB 저장 전환

### 요청
- `raid.html` 파티 구성의 레이드명 앞 아이콘이 localStorage에 저장되는 문제 수정.
- 모든 아이콘은 localStorage가 아니라 DB에 저장되어야 한다는 기존 규칙 반영.

### 수정 파일
- `raid.html`
- `index.html`
- `schema.sql`
- `DB_MIGRATION_LOG.md`
- `FEATURE_SPEC.md`
- `HANDOFF.md`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- `raid.html`
  - 레이드 그룹 아이콘/색상 저장소를 `localStorage(la_gicon_*, la_gc_*)`에서 `raid_group_settings` DB 테이블로 전환.
  - `getGroupIcon()`, `getGroupColor()`가 DB 로드 결과를 기준으로 동작하도록 변경.
  - 기존 localStorage의 `la_gicon_*`, `la_gc_*`, `la_raid_groups` 값은 `raid_group_settings`에 upsert 후 제거하는 마이그레이션 로직 추가.
  - 새 레이드 그룹 추가/수정/삭제 시 `raid_group_settings`를 함께 upsert/delete.
  - `raid_group_settings` 테이블이 없으면 페이지 전체는 유지하되, 레이드 그룹 저장 시 테이블 적용 안내를 표시.
- `schema.sql`, `index.html` 내 초기 SQL
  - `raid_group_settings` 테이블 생성 및 RLS 비활성화 SQL 추가.
- `DB_MIGRATION_LOG.md`, `FEATURE_SPEC.md`, `HANDOFF.md`
  - 신규 테이블과 localStorage 아이콘 저장 제거 흐름 기록.

### 검증
- `node tools/check-project.js`는 일반 권한과 권한 상승 실행 모두 현재 컴퓨터의 `node.exe` 권한 문제로 `Access is denied` 실패.
- PowerShell 보조 검증으로 5개 주요 HTML(`index.html`, `core.html`, `raid.html`, `overview.html`, `parties.html`) 모두 `</html>` 뒤 코드 없음 확인.
- PowerShell 보조 검증으로 5개 주요 HTML 모두 CSS 변수 누락 없음 확인.
- `git diff --check` 통과. 단, Git LF→CRLF 변환 경고 출력.

## 2026-04-29 18:20 - 작업 종료용 HANDOFF 갱신

### 요청
- 오늘 대화를 종료하고 다른 컴퓨터로 넘어가기 위한 인수인계 작업 수행.
- 다른 컴퓨터에서 실행할 시작 프롬프트 제공.

### 수정 파일
- `HANDOFF.md`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- `HANDOFF.md`의 현재 작업 상태와 Supabase Migration Reminder를 최신 상태로 보정.
- `raid_group_settings`, 캐릭터 섹션 표시 설정 컬럼, `raid_notice_comments` 적용 필요성을 명시.
- 현재 PC의 `node.exe Access is denied` 검증 실패 상태를 실제 결과에 맞게 수정.
- 현재 작업 트리에 untracked `images/*.png` 파일들이 있음을 다음 작업자가 확인하도록 기록.

### 검증
- `node tools/check-project.js`는 일반 권한과 권한 상승 실행 모두 현재 컴퓨터의 `node.exe` 권한 문제로 `Access is denied` 실패.
- PowerShell 보조 검증으로 5개 주요 HTML(`index.html`, `core.html`, `raid.html`, `overview.html`, `parties.html`) 모두 `</html>` 뒤 코드 없음 확인.
- PowerShell 보조 검증으로 5개 주요 HTML 모두 CSS 변수 누락 없음 확인.
- `git diff --check` 통과. 단, Git LF→CRLF 변환 경고 출력.

## 2026-04-30 00:00 - 전체 점검 후 고위험 버그 및 성능 보정

### 요청
- 이전 분석에서 나온 위험 지점을 전부 수정하고, 렉을 유발할 수 있는 코드를 최적화.

### 수정 파일
- `index.html`
- `raid.html`
- `overview.html`
- `parties.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- `index.html` 초기 SQL에 누락되어 있던 `raid_notice_comments` 테이블/RLS 비활성화/인덱스 SQL을 추가.
- `index.html`, `overview.html`, `parties.html`에서 레이드 그룹 아이콘/색상을 `raid_group_settings` DB 기준으로 로드하도록 변경.
- `raid_group_settings` 테이블이 없을 때만 기존 localStorage 아이콘/색상을 fallback으로 사용하도록 보정.
- `overview.html`, `parties.html`에 `raid_group_settings` 로딩 실패 시 페이지 전체가 깨지지 않는 방어 로직 추가.
- `parties.html` 캐릭터 필터 계정 버튼 템플릿에 남아 있던 불필요한 `}` 출력 가능성을 제거.
- `index.html`, `raid.html` 드래그 정렬 저장에서 `Promise.all`을 `await`하고 저장 실패를 사용자에게 알리도록 변경.
- `raid.html` 공지 댓글 로드를 전체 댓글 조회에서 현재 선택 주차 조회로 변경해 댓글 데이터가 많아질 때 초기 로딩 부담을 줄임.

### 검증
- 일반 권한 `node tools/check-project.js`는 Windows 사용자 경로 `EPERM`으로 실패.
- 권한 상승 실행 `node tools/check-project.js` 통과.
- 5개 주요 HTML 모두 `</html>` 뒤 코드 없음 확인.
- 5개 주요 HTML 모두 CSS 변수 누락 없음 확인.
- `git diff --check` 통과. 단, Git LF→CRLF 변환 경고 출력.

### 남은 문제
- 실제 Supabase SQL Editor에 최신 `schema.sql` 또는 `index.html` 초기 SQL의 `raid_notice_comments`, `raid_group_settings` 적용 여부 확인 필요.
- 브라우저에서 다른 컴퓨터 기준 레이드 그룹 아이콘/색상, 공지 댓글 주차 이동, 드래그 정렬 저장을 수동 확인 필요.

## 2026-04-30 00:00 - 공유 뷰어 탭/overview 골드바/파티 목록 접힘 보정

### 요청
- 공유 링크 뷰어는 상단에 레이드 / 레이드 현황 두 탭만 보이도록 정리.
- `overview.html` 레이드 완료 progress bar는 정상이나 유통/귀속/더보기 골드 progress bar가 보기 좋지 않은 문제 수정.
- `raid.html` 파티 구성 목록에서 선택된 파티가 없어도 레이드/난이도가 접히지 않는 문제 수정.

### 수정 파일
- `raid.html`
- `overview.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- `raid.html`
  - 뷰어 상단 탭의 `주간 일정` 문구를 `레이드`로 변경.
  - 공유 링크 뷰어에서는 내부 `파티 구성 / 주간 일정` 탭 바를 숨기고, 뷰어 전용 `레이드 / 레이드 현황` 탭만 보이도록 변경.
  - 파티 구성 목록의 펼침 판정을 `openRaidGroups`, `openRaidPresets` 기준으로만 하도록 변경.
  - 그룹/난이도 토글 시 선택 상태(`selGroupName`, `selPresetId`)를 강제로 갱신하지 않게 해 사용자가 닫은 항목이 다시 열리지 않도록 보정.
- `overview.html`
  - 골드 progress chip의 최소 너비와 grid column을 조정해 숫자가 progress bar를 밀어내거나 줄바꿈으로 깨지지 않게 수정.
  - 유통/귀속/더보기 골드 progress bar가 충분한 폭을 확보하도록 보정.

### 검증
- 일반 권한 `node tools/check-project.js`는 Windows 사용자 경로 `EPERM`으로 실패.
- 권한 상승 실행 `node tools/check-project.js` 통과.
- 5개 주요 HTML 모두 `</html>` 뒤 코드 없음 확인.
- `git diff --check` 통과. 단, Git LF→CRLF 변환 경고 출력.

## 2026-04-30 00:00 - 추가기능 및 버그 수정 문서 전체 반영

### 요청
- `추가기능 및 버그 수정.docx`의 기능/버그 수정 항목을 빠짐없이 구현.
- 공유링크, overview 골드 표시, core 사용자 조합 순서, 임시파티 표시/중복, 전투력, 파티 목록 접힘, 주간일정 파티 이동을 포함.

### 수정 파일
- `index.html`
- `raid.html`
- `overview.html`
- `parties.html`
- `core.html`
- `schema.sql`
- `DB_MIGRATION_LOG.md`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- `schema.sql`, `index.html` 초기 SQL
  - `characters.combat_power numeric default 0` 컬럼 추가.
- `index.html`
  - 캐릭터 추가/수정 모달에 전투력 입력 추가.
  - 캐릭터 탭/복제 삭제 후보/레이드 숙제 아이콘 fallback 표시 보정.
  - 임시파티해제 상태를 `임시파티해제` 배지로 표시.
- `raid.html`
  - 공유 링크 최초 진입 시 본계정 선택 화면 표시.
  - 선택한 본계정과 부계정 캐릭터 범위를 localStorage에 저장하고, 공유 링크의 슬롯 강조/레이드 현황 필터 기본값으로 사용.
  - 공유 링크 상단 탭을 `레이드 / 레이드 현황` 두 개만 쓰도록 정리.
  - 공유 링크 레이드 현황에서 선택 계정 범위에 한해 레이드 완료 처리 가능.
  - 공유 링크 레이드 현황에 레이드 추가 모달 추가. 추가된 레이드 숙제는 DB 기준으로 index/overview/parties에 반영.
  - 댓글과 슬롯 강조 필터 기본 상태를 접힘으로 변경.
  - 파티 구성 목록 열림 판정을 선택 상태와 분리해 사용자가 닫은 그룹/난이도가 다시 강제 열리지 않게 수정.
  - 주간 일정 카드에서 파티 버튼으로 파티 구성의 해당 파티로 이동 가능.
  - 임시파티 교체 시 기존 멤버는 `removed`로 기록해 `임시파티해제`, 신규 멤버는 `added`로 기록해 `임시파티연동`으로 표시.
  - 전투력을 파티 슬롯/캐릭터 선택/임시파티 UI에 표시.
- `overview.html`
  - 개별 레이드 행에 유통/귀속/더보기 골드 수령 여부 칩 표시.
  - 골드 progress bar 레이아웃 보정.
  - 임시파티해제 배지 표시.
  - 전투력 표시 보강.
- `parties.html`
  - 임시 제거된 기존 멤버는 `임시파티해제`로 표시.
  - 임시 추가/임시 해제/파티 없는 레이드가 중복으로 보이지 않도록 정리.
  - 파티 탈퇴 시 레이드 숙제는 삭제하지 않고 파티 슬롯만 제거하도록 변경.
  - 전투력 표시 보강.
- `core.html`
  - 사용자 조합 카드에 위/아래 이동 버튼 추가.
  - 조합 순서 변경 시 `character_cores.cores.__combos` 배열 순서를 저장.
  - 전투력 표시 보강.

### 검증
- 일반 권한 `node tools/check-project.js`는 Windows 사용자 경로 `EPERM`으로 실패.
- 권한 상승 실행 `node tools/check-project.js` 통과.
- 5개 주요 HTML 모두 `</html>` 뒤 코드 없음 확인.
- 5개 주요 HTML 모두 CSS 변수 누락 없음 확인.
- `git diff --check` 통과. 단, Git LF→CRLF 변환 경고 출력.

### 수동 확인 필요
- Supabase SQL Editor에 `characters.combat_power` 컬럼 적용 필요.
- 공유링크 최초 진입 계정 선택, 계정 변경, 선택 계정 레이드 완료 처리, 레이드 추가를 브라우저에서 확인 필요.
- 임시파티에서 기존 W 제거 + 신규 Y 추가 시 index/overview/parties 표시와 다음 주 복구 확인 필요.

## 2026-04-30 00:00 - 추가기능 및 버그 수정2 문서 반영

### 요청
- `추가기능 및 버그 수정2.docx`의 공유링크, overview 표기, 임시파티해제 아이콘, 테스트 날짜, 전투력 CSS 관련 잔여 항목 반영.

### 수정 파일
- `index.html`
- `raid.html`
- `parties.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- `raid.html`
  - 공유링크에서 계정 선택 또는 계정 변경 후 레이드 탭으로 이동할 때 기존 내부 파티 구성 탭이 같이 보이지 않도록 `view-party`를 명시적으로 숨김.
  - 공유링크 레이드 탭의 주간일정 영역에서도 기존 계정 변경 버튼 흐름을 유지.
  - 공유링크 레이드현황의 개별 레이드 골드 여부 칩을 금액 표기에서 `유통 O/X`, `귀속 O/X`, `더보기 O/X`로 변경.
- `overview.html`
  - 이전 작업에서 이미 개별 레이드 골드 여부 칩을 `유통 O/X`, `귀속 O/X`, `더보기 O/X`로 반영한 상태 확인.
- `index.html`
  - 임시파티해제된 레이드 숙제가 `preset_id`를 잃은 경우에도 해당 주차 일정의 파티/프리셋을 역추적해 레이드명, 난이도, 아이콘, 색상, 파티 팝업 기준 프리셋을 복구.
  - 이로써 W 캐릭터가 임시파티에서 제거된 뒤 index 레이드 숙제에 아이콘이 빠지는 문제를 보정.
- `parties.html`
  - 전투력 표시 추가 과정에서 바뀐 파티 슬롯 CSS를 원래 flex 기반 레이아웃에 가깝게 되돌림.

### 검증
- 일반 권한 `node tools/check-project.js`는 Windows 사용자 경로 `EPERM`으로 실패.
- 권한 상승 실행은 현재 Codex 사용량 제한으로 승인되지 않아 수행하지 못함.
- 5개 주요 HTML 모두 `</html>` 뒤 코드 없음 확인.
- `git diff --check` 통과. 단, Git LF→CRLF 변환 경고 출력.

### 수동 확인 필요
- 공유링크에서 계정 선택 후 파티구성 화면이 아니라 레이드 주간일정 화면만 보이는지 확인 필요.
- 공유링크 레이드현황과 `overview.html`의 개별 레이드 칩이 `유통 O/X`, `귀속 O/X`, `더보기 O/X`로 보이는지 확인 필요.
- 임시파티에서 W 제거 + Y 추가 후 W의 `index.html` 레이드 숙제 아이콘과 파티 팝업이 정상인지 확인 필요.

## 2026-04-30 00:15 - 공유링크 계정 변경 버튼 상단 고정

### 요청
- 공유링크의 두 탭 모두에서 계정 변경 버튼에 접근할 수 있도록 보정.

### 수정 파일
- `raid.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- 공유 모드 상단 배너의 레이드/레이드 현황 탭 버튼 옆에 `계정 변경` 버튼을 추가.
- 기존 주간일정 topbar 및 레이드 현황 topbar의 계정 변경 버튼은 유지하고, 탭 전환 상태와 관계없이 상단에서 항상 접근 가능하도록 함.

### 검증 필요
- 공유링크에서 레이드 탭과 레이드 현황 탭을 각각 열었을 때 상단 배너의 `계정 변경` 버튼이 보이고 계정 선택 화면으로 이동하는지 브라우저에서 확인 필요.

## 2026-04-30 00:35 - 골드체크 통합 및 공유 레이드현황 편집 기능

### 요청
- `overview.html`과 공유링크 레이드현황에서 유통/귀속 골드 수령 여부를 각각 표시하지 않고 `골드체크 O/X`로 통합.
- `index.html` 레이드 숙제에서도 유통/귀속 체크를 하나의 `골드체크`로 통합.
- 공유링크 레이드현황 탭에서 레이드 추가뿐 아니라 수정/삭제도 가능하게 보정.
- 공유링크에서 캐릭터 추가 후 레이드가 없어 현황에 보이지 않는 문제 해결.

### 수정 파일
- `index.html`
- `overview.html`
- `raid.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- 기존 DB 컬럼 `receive_gold`, `receive_bound`는 유지하되 UI와 집계에서는 두 값이 모두 켜진 경우만 `골드체크 O`로 판단하도록 변경.
- `index.html` 레이드 숙제 아이템의 유통/귀속 개별 토글을 `골드체크 O/X` 단일 토글로 교체하고, 클릭 시 두 컬럼을 함께 업데이트.
- `overview.html` 및 공유링크 레이드현황의 개별 레이드 칩을 `골드체크 O/X`, `더보기 O/X` 형태로 정리.
- 공유링크 레이드현황의 캐릭터 카드는 레이드 숙제가 없어도 표시되도록 변경.
- 공유링크에서 캐릭터 추가 완료 후 해당 캐릭터의 레이드 추가 모달을 자동으로 열어 첫 레이드 등록을 이어서 진행하도록 변경.
- 공유링크 레이드현황의 각 레이드 행에 `수정`, `삭제` 버튼을 추가하고, 선택 계정 범위 내 레이드만 수정/삭제되도록 제한.

### 검증 필요
- `index.html`에서 `골드체크` 클릭 시 유통/귀속 합산과 남은 골드 표시가 함께 바뀌는지 확인 필요.
- 공유링크 레이드현황에서 레이드 수정/삭제 후 카드와 집계가 즉시 갱신되는지 확인 필요.
- 공유링크에서 캐릭터 추가 후 빈 캐릭터 카드가 보이고, 이어서 열린 레이드 추가 모달로 첫 레이드를 추가할 수 있는지 확인 필요.

## 2026-04-30 00:45 - 공유 레이드현황 빈 캐릭터 표시 범위 축소

### 요청
- 공유링크 레이드현황에서 새 캐릭터 추가 문제를 해결하면서 기존 레이드 없는 캐릭터까지 표시되는 부작용 보정.

### 수정 파일
- `raid.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- 공유링크 레이드현황의 기본 표시 기준을 다시 `레이드 숙제가 있는 캐릭터`로 제한.
- 공유링크에서 방금 추가한 캐릭터만 메모리 상태 `viewerPendingCharId`로 임시 표시하도록 변경.
- 새 캐릭터에 첫 레이드 추가가 성공하면 임시 표시 상태를 해제.
- 계정 선택/계정 변경 시 임시 표시 상태를 초기화.
- 임시 상태는 localStorage에 저장하지 않아 새로고침 시 자동으로 사라지도록 처리.

### 검증 필요
- 기존 레이드 없는 캐릭터는 공유 레이드현황에 보이지 않는지 확인 필요.
- 공유링크에서 새 캐릭터 추가 직후 해당 캐릭터만 빈 카드로 보이고 레이드 추가 모달이 이어서 열리는지 확인 필요.
- 첫 레이드 추가 후 새 캐릭터가 정상 레이드 카드로 유지되는지 확인 필요.

## 2026-05-02 - overview 레이드 상태 배지 정리

### 요청
- `overview.html`의 레이드 행에서 `골드체크 O/X`, `더보기 O/X`, `파티연동` 텍스트 칩이 난잡해 보이는 문제를 개선.
- `index.html`은 수정하지 않고 `overview.html`만 변경.

### 수정 파일
- `overview.html`

### 변경 내용
- 개별 레이드 행의 상태 표시를 `O/X` 텍스트 대신 짧은 아이콘 배지로 변경.
- 골드체크는 `🪙 수령/제외`, 더보기는 `🎁 적용/제외`, 파티는 `🔗 연동/없음`, 임시파티는 `✨ 임시연동`, `↩ 임시해제`로 표시.
- 파티연동 없음도 회색 배지로 표시해 각 레이드의 상태를 같은 위치에서 확인할 수 있게 정리.
- 기존 파티연동/임시파티 클릭 동작은 유지.

### 검증
- `node tools/check-project.js`는 일반 권한과 권한 상승 실행 모두 현재 컴퓨터의 `node.exe Access is denied`로 실패.
- 5개 주요 HTML 모두 `</html>` 뒤 코드 없음 확인.
- 5개 주요 HTML 모두 CSS 변수 누락 없음 확인.
- `git diff --check` 통과. 단, Git LF→CRLF 변환 경고 출력.

## 2026-05-04 - raid 미배치 파티 클릭 선택 및 상단 정보창 개선

### 요청
- `raid.html` 주간 일정 우측 미배치 파티 패널에서 마우스를 올리는 것만으로 정보창이 바뀌지 않게 하고, 파티를 클릭했을 때 해당 파티 정보가 보이도록 수정.
- 미배치 파티 패널 최상단의 선택 파티 정보창이 더 명확하게 보이도록 개선.

### 수정 파일
- `raid.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- 미배치 파티 카드의 `mouseenter`/`focus` 기반 정보 표시를 제거하고, 클릭 및 키보드 Enter/Space 선택으로만 상단 정보창을 갱신하도록 변경.
- 선택된 미배치 파티 카드에 `selected` 상태와 `aria-selected`를 부여해 현재 보고 있는 파티를 목록에서도 구분 가능하게 함.
- 상단 `unplaced-preview`에 `선택 파티 정보` 라벨, 강조 상단 라인, 파티/인원/입장 레벨 칩 스타일을 추가해 정보창의 시각적 우선순위를 강화.
- 미선택 상태 안내 문구를 클릭 방식에 맞게 수정.

### 검증
- 사용자 지시에 따라 `node tools/check-project.js`는 실행하지 않음.
- `index.html`, `core.html`, `raid.html`, `overview.html`, `parties.html` 모두 `</html>` 뒤 코드 없음 확인.
- 5개 주요 HTML 모두 CSS `var(--...)` 정의 누락 없음 확인.
- `git diff --check` 통과. 단, `CODEX_SESSION_LOG.md`, `core.html`, `index.html`, `overview.html`, `parties.html`, `raid.html` LF→CRLF 경고 출력.
- `index.html`, `core.html`, `raid.html`, `overview.html`, `parties.html` 모두 `</html>` 뒤 코드 없음 확인.
- 5개 주요 HTML 모두 CSS `var(--...)` 정의 누락 없음 확인.
- `git diff --check` 통과. 단, `CODEX_SESSION_LOG.md`, `index.html` LF→CRLF 경고 출력.

## 2026-05-04 - core/raid/overview/parties 저위험 최적화 및 저장소 파싱 보강

### 요청
- `core.html`, `raid.html`, `overview.html`, `parties.html`도 코드 최적화 및 리팩토링.

### 수정 파일
- `core.html`
- `raid.html`
- `overview.html`
- `parties.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- 네 페이지에 `safeJson()` 보조 함수를 추가해 `localStorage`에 저장된 JSON 설정이 깨져 있어도 페이지 초기화가 중단되지 않도록 보강.
- `core.html`의 접힘/숨김/캐릭터 필터 복원 로직을 `safeJson()`과 캐릭터 id Set 기반 검증으로 정리.
- `overview.html`의 접힌 계정/캐릭터 필터 복원 로직을 안전화하고, 레이드 보유 캐릭터 계산을 `charsWithRaidTasks()`로 모아 반복 `some()` 탐색을 줄임.
- `overview.html`에서 레이드 그룹 설정 조회와 임시 파티 변경 조회를 병렬 처리.
- `parties.html`의 캐릭터 필터 복원과 레이드 그룹 정렬 설정 파싱을 안전화하고, 파티/레이드 숙제 관련 캐릭터 계산을 `charsInPartyScope()`로 통합.
- `parties.html`에서 레이드 그룹 설정 조회와 주간 일정 오버라이드 조회를 병렬 처리.
- `raid.html`의 레이드 그룹 접힘/정렬/legacy 그룹, 공유 링크 레이드 현황 필터, 주간 일정 캐릭터 필터/강조, 요일 묶음 설정 파싱을 `safeJson()` 기반으로 변경.
- `raid.html` 주간 일정 필터 초기화에서 전체 캐릭터 id Set을 재사용해 반복 `allChars.some()` 탐색을 줄임.

### 검증
- 사용자 지시에 따라 `node tools/check-project.js`는 실행하지 않음.
- `index.html`, `core.html`, `raid.html`, `overview.html`, `parties.html` 모두 `</html>` 뒤 코드 없음 확인.
- 5개 주요 HTML 모두 CSS `var(--...)` 정의 누락 없음 확인.
- `git diff --check` 통과. 단, `CODEX_SESSION_LOG.md`, `index.html`, `raid.html` LF→CRLF 경고 출력.

## 2026-05-04 - index 저위험 내부 최적화 및 렌더 보조 로직 정리

### 요청
- 코드 최적화 및 리팩토링.

### 수정 파일
- `index.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- `localStorage` JSON 파싱을 `safeJson()`으로 통합해 저장된 설정값이 깨져 있어도 페이지 초기화 전체가 중단되지 않도록 보강.
- `init()` 재호출 시 KST 시계 `setInterval`이 중복 생성되지 않도록 `ensureClock()`으로 기존 interval을 정리한 뒤 새 interval을 등록.
- `loadRaidMetaForCurrent()`에서 현재 캐릭터 목록과 캐릭터 id 목록을 한 번만 계산해 재사용하도록 정리.
- 레이드 그룹 설정 조회와 임시 파티 변경 조회를 병렬로 시작해 계정 데이터 로딩 대기 시간을 줄임.
- 숙제 완료/활성화 판정에서 반복 호출되는 `getLastResetUTC()` 결과를 분 단위 캐시로 보관해 카드 렌더링 중 날짜 계산 중복을 줄임.
- 휴식 게이지 미리보기 input listener 5개를 하나의 위임 listener로 통합.

### 검증
- 사용자 지시에 따라 `node tools/check-project.js`는 실행하지 않음.
- `index.html`, `core.html`, `raid.html`, `overview.html`, `parties.html` 모두 `</html>` 뒤 코드 없음 확인.
- 5개 주요 HTML 모두 CSS `var(--...)` 정의 누락 없음 확인.
- `git diff --check` 통과. 단, `raid.html` LF→CRLF 경고 출력.

## 2026-05-04 - index 공식 API 기반 캐릭터 레벨/전투력 업데이트

### 요청
- 첨부된 `curl.docx`의 Lost Ark 공식 API 사용 방식에 맞춰 캐릭터 정보를 업데이트하는 기능 추가.
- 일일숙제 우상단 버튼 영역에 `캐릭 업데이트` 버튼을 추가.
- 버튼 실행 시 모든 캐릭터를 대상으로 하되, 업데이트 제외 캐릭터를 선택할 수 있게 함.

### 수정 파일
- `index.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- `index.html` 캐릭터 숙제 탭 상단 도구 영역에 `캐릭 업데이트` 버튼을 추가하고, 일일 숙제 탭에서만 보이도록 처리.
- `캐릭터 공식 API 업데이트` 모달을 추가해 API 토큰 입력, 브라우저 저장 선택, 계정별 업데이트 제외 캐릭터 선택, 진행률/결과 로그를 제공.
- 공식 API `GET https://developer-lostark.game.onstove.com/armories/characters/{캐릭터명}?filters=profiles` 호출을 추가.
- API 응답의 `ArmoryProfile.CharacterName` 기준 캐릭터를 찾고, `ItemAvgLevel`, `CombatPower`를 숫자로 변환해 `characters.item_level`, `characters.combat_power`에 저장.
- API 토큰은 코드에 하드코딩하지 않고, 저장 선택 시 현재 브라우저 localStorage에만 저장되도록 처리.
- 제외 캐릭터 목록은 반복 실행 편의를 위해 localStorage에 저장하되, 실제 캐릭터 데이터는 기존 Supabase `characters` 테이블만 갱신.

### 검증
- 사용자 지시에 따라 `node tools/check-project.js`는 실행하지 않음.
- 공식 API 문서 워드 파일은 읽기 공유 모드로 텍스트 추출해 요청 URL/헤더/응답 필드를 확인.
- `index.html`, `core.html`, `raid.html`, `overview.html`, `parties.html` 모두 `</html>` 뒤 코드 없음 확인.
- 5개 주요 HTML 모두 CSS `var(--...)` 정의 누락 없음 확인.
- `git diff --check` 통과. 단, `CODEX_SESSION_LOG.md`, `index.html`, `raid.html` LF→CRLF 경고 출력.
- 첨부 문서의 Bearer 토큰 문자열이 코드/로그에 하드코딩되지 않았는지 검색 확인.

## 2026-05-04 - 미배치 파티 프리뷰 높이 보정 및 index 상단 탭 정렬

### 요청
- `raid.html` 미배치 파티 패널 최상단의 `선택 파티 정보` 영역이 잘 보이지 않는 문제 수정.
- `index.html` 상단 탭을 다른 페이지 상단 탭처럼 아이콘이 있는 공통 네비게이션 형태로 수정.

### 수정 파일
- `raid.html`
- `index.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- `raid.html` 미배치 파티 목록 영역에 `flex:1`/`min-height:0`을 부여하고, 상단 `unplaced-preview`는 `flex:0 0 auto`와 최소 높이를 갖게 해 목록에 눌려 안내/선택 정보가 잘리지 않도록 수정.
- 미배치 프리뷰의 빈 상태 안내 문구에 최소 높이와 제목 강조 스타일을 추가.
- `index.html` 상단 네비게이션에서 `기존 숙제`, `새 숙제 UI 테스트` 이중 탭을 제거하고, 다른 페이지와 같은 `숙제`, `코어현황`, `레이드`, `레이드 현황`, `파티 현황` 탭 구성으로 변경.
- `index.html` 네비게이션 높이, 패딩, 글자 크기, 활성 탭 색상을 다른 페이지 톤에 가깝게 조정.

### 검증
- 사용자 지시에 따라 `node tools/check-project.js`는 실행하지 않음.

## 2026-05-03 - index_redesign 현대화 및 누락 기능 보강

### 요청
- `index_redesign.html` 테스트 화면의 디자인을 더 현대적이고 깔끔한 톤으로 전면 개선.
- 기존 `index.html` 기능 중 새 테스트 화면에서 빠진 핵심 기능을 확인하고 보강.
- 사용자가 확인한 누락/파생 이슈인 숙제 삭제, 완료/활성화 필터, 숨긴 계정 처리, 체크 버튼 디자인, 휴식 게이지 표시, 레이드 아이콘, 이미지 피커, 단계 체크 해제, 빠른 중복 클릭 문제를 수정.

### 수정 파일
- `index_redesign.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- Pretendard 기반 폰트와 청록/보라/골드 포인트를 사용하는 어두운 현대식 카드 디자인으로 변경.
- 상단 전역 `숙제 생성` 버튼을 제거하고 카드별 `+` 추가 흐름만 유지.
- 상단 캐릭터명 필터 행을 숨겨 한 계정의 캐릭터 숙제를 한 화면에서 보는 구조로 정리.
- `완료 숨기기/보이기`, `활성화 보이기/숨기기`, `숨긴 계정 보기/접기` 토글 추가.
- 기존 `la_hidden_accs` localStorage와 연동해 계정 선택 칩과 계정 숙제 탭에서 숨김 계정을 제외하고, 필요 시 다시 볼 수 있게 처리.
- 일반/원정대 숙제 행에 수정/삭제 버튼을 추가하고, 삭제 시 하위 숙제도 로컬 목록에서 함께 제거.
- 레이드 숙제 행에 삭제 버튼을 추가하고, 체크 버튼을 우측 pill 형태로 정리.
- 숙제 체크/단계 체크/레이드 체크/휴식 게이지/재화 저장에 중복 클릭 방지용 busy guard 추가.
- 단계별 체크박스는 같은 단계를 다시 누르면 한 단계 내려가도록 변경해 체크 상태를 해제할 수 있게 수정.
- 휴식 게이지는 `1회 소모 / 1회 충전` 묶음 단위가 하나의 칸처럼 보이도록 렌더링하고, 내부 클릭 영역만 충전 단위로 유지.
- 레이드 현황은 `raid_presets`, `raid_group_settings`를 추가 조회해 DB에 저장된 레이드 아이콘을 표시.
- 숙제 생성/수정 모달에서 URL 직접 입력 대신 기존 이미지 피커 방식으로 아이콘 선택/제거 가능하게 변경.
- 휴식 게이지/체크박스/단계별 체크박스 생성 설정 영역의 세로 공간을 줄이고, 단계별 체크 UI를 원형 단계 버튼으로 정리.

### 검증
- 사용자 지시에 따라 `node tools/check-project.js`는 실행하지 않음.
- `index.html`, `index_redesign.html`, `core.html`, `raid.html`, `overview.html`, `parties.html` 모두 `</html>` 뒤 코드 없음 확인.
- 위 6개 HTML 모두 CSS 변수 누락 없음 확인.
- `git diff --check` 통과. 단, `CODEX_SESSION_LOG.md`, `index_redesign.html` LF→CRLF 변환 경고 출력.

## 2026-05-03 - index 새 숙제 UI 테스트 페이지 추가

### 요청
- 기존 `index.html`을 바로 덮어쓰지 않고, RLoA 스타일을 참고한 새 숙제 체크/생성 UI를 별도 테스트 페이지로 먼저 구성.
- 최상단을 `일일숙제 / 주간,월간숙제 / 계정숙제` 흐름으로 나누고, 일일/주간 화면은 계정 선택 후 해당 계정 캐릭터들을 한 화면에 표시.
- 숙제 생성은 `휴식 게이지 / 체크박스 / 단계별 체크박스` 타입을 선택하고, 공통 기본 정보와 타입별 설정을 입력하는 형태로 실험.

### 수정 파일
- `index.html`
- `index-redesign.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- `index-redesign.html` 신규 추가.
- 기존 Supabase `la_url`, `la_key` localStorage 연결 정보를 그대로 사용해 `accounts`, `characters`, `tasks`, `expedition_tasks`, `raid_tasks`, `currencies`, `custom_popups`를 읽는 테스트 화면 구현.
- `캐릭터 숙제` 탭에는 선택 계정의 캐릭터별 일일 숙제와 재화 현황을 카드형으로 표시.
- `주간/월간 숙제` 탭에는 캐릭터별 주간/월간 일반 숙제, 레이드 현황, 커스텀 노트를 표시.
- `계정 숙제` 탭에는 원정대 숙제를 계정별 카드로 표시.
- 새 숙제 생성 모달은 현재 스키마를 유지하며 `휴식 게이지=rest_enabled`, `체크박스=기본 완료`, `단계별 체크박스=count_max/count_current`로 매핑.
- 기존 `index.html` 상단 내비게이션에 `새 숙제 UI` 테스트 페이지 이동 링크만 추가하고 기존 기능 코드는 변경하지 않음.

### 검증
- 사용자 지시에 따라 `node tools/check-project.js`는 실행하지 않음.
- `index.html`, `index-redesign.html`, `core.html`, `raid.html`, `overview.html`, `parties.html` 모두 `</html>` 뒤 코드 없음 확인.
- 위 6개 HTML 모두 CSS 변수 누락 없음 확인.
- `git diff --check` 통과. 단, `index.html` LF→CRLF 변환 경고 출력.

## 2026-05-03 - 숙제 복제 시 휴식 게이지 0값 보존

### 요청
- 휴식 게이지 강조 포인트를 0으로 설정해도 일일 숙제/원정대 숙제 복제 시 기본값 40으로 바뀌는 문제 수정.
- 복제 기능은 기본값이 아니라 사용자가 설정한 값을 그대로 복제해야 함.

### 수정 파일
- `index.html`

### 변경 내용
- 일일 숙제와 원정대 숙제 복제 insert에서 `|| 기본값`으로 휴식 게이지 값이 덮이는 문제를 공통 `taskCopyFields()`로 정리.
- `rest_threshold: 0`, `rest_current: 0`, `rest_charge: 0`, `rest_consume: 0` 같은 유효한 0 값을 `??` 기준으로 보존.
- 숙제 수정 모달을 열 때도 휴식 게이지 입력값이 0이면 기본값으로 바뀌지 않도록 `??` 기준으로 보정.
- 복제 시 `rest_last_processed_at`도 함께 넘겨 기존 휴식 게이지 처리 기준이 임의로 초기화되지 않도록 유지.

### 검증
- `node tools/check-project.js`는 일반 권한과 권한 상승 실행 모두 현재 컴퓨터의 `node.exe Access is denied`로 실패.
- 5개 주요 HTML 모두 `</html>` 뒤 코드 없음 확인.
- 5개 주요 HTML 모두 CSS 변수 누락 없음 확인.
- `git diff --check` 통과. 단, Git LF→CRLF 변환 경고 출력.

## 2026-05-03 - node 검증 생략 규칙 문서화

### 요청
- `node tools/check-project.js`는 현재 워크플로에서 어차피 실행되지 않으므로 앞으로 실행하지 않도록 문서에 명시.
- 다른 컴퓨터에서도 동일 명령을 반복 시도하지 않게 인수인계 문서에 남김.

### 수정 파일
- `AGENTS.md`
- `CODEX_INSTRUCTIONS.md`
- `HANDOFF.md`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- `AGENTS.md`의 검증 규칙을 `node tools/check-project.js` 필수 실행에서 사용자 재요청 전까지 생략으로 변경.
- `CODEX_INSTRUCTIONS.md`의 절대 규칙/검증/체크리스트에 node 검증 생략과 대체 검증 항목을 반영.
- `HANDOFF.md`에 다른 컴퓨터에서도 node 검증 재시도 대신 보조 검증을 수행하라고 명시.
- 대체 검증 기준은 5개 주요 HTML `</html>` tail 확인, CSS var 정의 확인, `git diff --check`.

### 검증
- 사용자 지시에 따라 `node tools/check-project.js`는 실행하지 않음.
- 문서 변경만 수행.

## 2026-05-03 - 숙제 활성화 기능 전 초기화 타입 복구

### 요청
- 이전 대화 흐름을 기준으로 사라진 숙제 활성화 기능이 무엇인지 판별.
- 일일 숙제, 주간 숙제, 월간 숙제 및 원정대 숙제에 활성화 기능을 다시 추가.

### 수정 파일
- `index.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- 활성화 기능은 `activate_day` 기준으로 특정 요일 06:00 KST 이후부터 숙제를 기본 표시하는 기능으로 판별.
- 기존 구현에서 활성화 UI가 주간 숙제에만 보이던 제한을 제거하고, 루트 숙제 추가/수정 시 일일/주간/월간 및 원정대 숙제 모두에서 설정 가능하게 변경.
- `isTaskActive()`가 일일/월간 숙제를 무조건 활성 처리하던 예외를 제거하고, 각 숙제의 `reset_type` 기준 마지막 초기화 시점과 활성화 요일 시점을 비교하도록 보정.
- 하위 숙제 추가 화면에서는 기존처럼 활성화 설정을 숨김 처리.

### 검증
- 사용자 지시에 따라 `node tools/check-project.js`는 실행하지 않음.
- 5개 주요 HTML 모두 `</html>` 뒤 코드 없음 확인.
- 5개 주요 HTML 모두 CSS 변수 누락 없음 확인.
- `git diff --check` 통과. 단, Git LF→CRLF 변환 경고 출력.

## 2026-05-02 - overview progress bar 및 공유링크 상태 배지 보정

### 요청
- `overview.html`의 골드 progress bar가 채워지지 않는 문제 수정.
- 골드/더보기/파티연동 O/X 상태가 한눈에 더 명확히 구분되도록 개선.
- 같은 상태 배지 규칙을 `raid.html` 공유 링크 레이드 현황에도 적용.

### 수정 파일
- `overview.html`
- `raid.html`

### 변경 내용
- `overview.html`의 summary/account/gold progress fill 요소에 `display:block`을 명시해 inline span 폭/높이 문제를 방지.
- `overview.html` 개별 레이드 상태 배지를 `✅ 골드O`, `❌ 골드X`, `✅ 더보기O`, `❌ 더보기X`, `✅ 파티O`, `❌ 파티X`로 변경.
- 상태 O는 초록/청록/보라 계열, X는 빨강 계열로 분리해 시각 구분을 강화.
- `raid.html` 공유 링크 레이드 현황에도 동일한 골드/더보기/파티 O/X 배지 스타일과 렌더링을 적용.

### 검증
- `node tools/check-project.js`는 일반 권한과 권한 상승 실행 모두 현재 컴퓨터의 `node.exe Access is denied`로 실패.
- 5개 주요 HTML 모두 `</html>` 뒤 코드 없음 확인.
- 5개 주요 HTML 모두 CSS 변수 누락 없음 확인.
- `git diff --check` 통과. 단, Git LF→CRLF 변환 경고 출력.

## 2026-05-02 - overview/공유링크 상태 배지 X 중심 정리

### 요청
- 골드/더보기/파티 상태는 정상 O까지 표시하지 말고 `골드X`, `더보기X`, `파티X`만 보이도록 정리.
- 숙제가 모두 완료된 캐릭터 카드를 더 가독성 좋게 완료 처리.
- `overview.html`과 `raid.html` 공유 링크 레이드 현황 모두 반영.

### 수정 파일
- `overview.html`
- `raid.html`

### 변경 내용
- `overview.html` 개별 레이드 행에서 골드체크/더보기/파티연동이 정상인 경우 배지를 숨기고, 제외/미연동 상태만 `골드X`, `더보기X`, `파티X`로 표시.
- `raid.html` 공유 링크 레이드 현황에도 동일한 X 중심 배지 규칙 적용.
- 임시파티연동/임시파티해제는 예외 상태이므로 기존처럼 별도 배지로 유지.
- 전체 레이드가 완료된 캐릭터 카드에 초록 테두리/배경/헤더 강조와 `완료` 배지를 추가해 완료 상태를 더 명확하게 표시.

### 검증
- `node tools/check-project.js`는 일반 권한과 권한 상승 실행 모두 현재 컴퓨터의 `node.exe Access is denied`로 실패.
- 5개 주요 HTML 모두 `</html>` 뒤 코드 없음 확인.
- 5개 주요 HTML 모두 CSS 변수 누락 없음 확인.
- `git diff --check` 통과. 단, Git LF→CRLF 변환 경고 출력.

## 2026-05-03 - raid 주간 일정 미배치 파티 패널 및 2주 보존

### 요청
- `raid.html` 주간 일정에서 전체 파티 중 현재 주간 일정에 배치되지 않은 파티를 별도 우측 패널에 표시.
- 미배치 파티 패널은 접을 수 있고, 공유링크에서는 보이지 않아야 함.
- 미배치 파티 카드를 요일 칸으로 꺼내와 일정에 배치할 수 있어야 함.
- 레이드 일정은 2주 전까지 저장하고, 그보다 오래된 기록은 삭제.

### 수정 파일
- `raid.html`

### 변경 내용
- 주간 일정 화면 우측에 `미배치 파티` 패널을 추가하고 `localStorage.la_unplaced_panel_collapsed`로 접힘 상태를 유지.
- 현재 주차에 표시되는 고정/비고정 일정의 `party_id`를 기준으로 이미 배치된 파티를 제외하고, 남은 파티만 미배치 목록에 표시.
- 미배치 파티 카드를 요일 칸 또는 기존 일정 카드 위치로 드래그하면 해당 주차의 비고정 일정으로 `raid_schedules`에 추가.
- 공유링크 뷰어 모드에서는 미배치 패널이 `edit-only`로 숨겨짐.
- 비고정 레이드 일정 삭제 기준을 기존 “지난 주 즉시 삭제”에서 “현재 주 기준 2주 전까지 보존, 그 이전 삭제”로 변경.
- `raid_schedule_overrides`도 2주 전보다 오래된 주차 기록은 정리하도록 보정.

### 검증
- `node tools/check-project.js`는 일반 권한과 권한 상승 실행 모두 현재 컴퓨터의 `node.exe Access is denied`로 실패.
- 5개 주요 HTML 모두 `</html>` 뒤 코드 없음 확인.
- 5개 주요 HTML 모두 CSS 변수 누락 없음 확인.
- `git diff --check` 통과. 단, Git LF→CRLF 변환 경고 출력.

## 2026-05-03 - index 휴식 게이지 칸형 조정 UI

### 요청
- 기존 단일 progress bar 형태의 휴식 게이지를 `최대 휴식 게이지 / 1회 충전 게이지` 기준의 칸형 UI로 변경.
- `1회 소모 휴식 게이지 / 1회 충전 게이지`만큼을 한 묶음으로 보여 예시처럼 최대 200, 충전 20, 소모 40이면 10칸을 5묶음으로 표현.
- 각 칸에 마우스를 올리고 클릭하면 해당 구간 끝값으로 휴식 게이지가 조정되어야 함.

### 수정 파일
- `index.html`

### 변경 내용
- 휴식 게이지 카드의 단일 fill bar를 충전 단위별 segment UI로 교체.
- 소모량 기준 묶음 단위를 계산해 여러 칸을 시각적으로 그룹화.
- 각 칸 hover 시 해당 칸까지 강조하고, 클릭 시 `tasks` 또는 `expedition_tasks`의 `rest_current`를 즉시 Supabase에 저장.
- 기존 `rest_max`, `rest_current`, `rest_charge`, `rest_consume`, `rest_threshold` 컬럼은 그대로 사용해 DB 구조 변경 없이 UI만 보정.

### 검증
- `node tools/check-project.js`는 일반 권한과 권한 상승 실행 모두 현재 컴퓨터의 `node.exe Access is denied`로 실패.
- 5개 주요 HTML 모두 `</html>` 뒤 코드 없음 확인.
- 5개 주요 HTML 모두 CSS 변수 누락 없음 확인.
- `git diff --check` 통과. 단, Git LF→CRLF 변환 경고 출력.

## 2026-05-03 - index_redesign 재화 접힘/계정 설정/복제 보강

### 요청
- 캐릭터 카드의 재화 현황을 접었다 펼 수 있게 변경.
- 일일 숙제 행에서 `매일 06시` 배지를 제거하고, 수정/삭제 버튼을 숙제명 옆으로 이동.
- 체크 버튼 위치와 휴식 게이지 폭을 조정.
- 계정 숨김을 계정 칩 옆 버튼이 아니라 설정 모달에서 처리하도록 변경.
- 숙제 복제 기능과 복제본 일괄 삭제 기능 추가.

### 수정 파일
- `index_redesign.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- 캐릭터별 재화 현황 접힘 상태를 `localStorage.la_redesign_collapsed_currency`에 저장하고, 일일 숙제 카드에서 접기/펼치기 버튼을 제공.
- 일일 숙제 행의 초기화 배지를 숨기고, 주간/월간 및 활성화 요일 배지만 필요할 때 표시.
- 숙제명 라인에 `복제`, `수정`, `삭제`, `일괄` 버튼을 배치하고, 휴식 게이지는 행 전체 폭을 사용하도록 조정.
- 상단 계정 선택 칩의 직접 숨김 버튼을 제거하고 `계정 설정` 모달을 추가.
- 계정 설정 모달에서 계정별 표시/숨김 스위치와 숨긴 계정 임시 표시 스위치를 제공.
- 캐릭터 숙제는 다른 캐릭터로, 계정 숙제는 다른 계정으로 복제할 수 있는 모달을 추가.
- 복제 시 `clone_group_id`를 유지하고 `rest_threshold: 0` 같은 0 설정값을 `??` 기준으로 보존.
- 복제 그룹 기준 일괄 삭제 모달을 추가하고, 선택한 복제본과 하위 숙제를 함께 삭제하도록 처리.

### 검증
- 사용자 지시에 따라 `node tools/check-project.js`는 실행하지 않음.
- `index.html`, `index_redesign.html`, `core.html`, `raid.html`, `overview.html`, `parties.html` 모두 `</html>` 뒤 코드 없음 확인.
- 위 6개 HTML 모두 CSS `var(--...)` 정의 누락 없음 확인.
- `git diff --check` 통과. 단, `index_redesign.html` LF→CRLF 경고 출력.

## 2026-05-03 - index_redesign 주간 카드 접힘 및 레이드 추가 보강

### 요청
- 주간/월간 숙제 화면에서 레이드 현황과 커스텀 노트를 접었다 펼 수 있게 변경.
- 레이드 현황의 삭제 버튼 위치를 레이드명 옆으로 이동.
- 사라졌던 레이드 추가 버튼을 다시 제공.
- 주간/월간 숙제 행의 수정/삭제 버튼 위치를 정리하고 `매주 수요일`, `활성 일요일` 같은 배지는 표시하지 않도록 변경.

### 수정 파일
- `index_redesign.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- 캐릭터별 레이드 현황/커스텀 노트 접힘 상태를 각각 `localStorage.la_redesign_collapsed_raid`, `localStorage.la_redesign_collapsed_notes`에 저장.
- 주간/월간 카드의 `레이드 현황` 헤더에 추가/접기 버튼을 배치하고, `커스텀 노트`에도 접기 버튼을 배치.
- 레이드 추가 모달을 추가해 `raid_presets`를 선택하면 해당 캐릭터의 `raid_tasks`에 프리셋 기반 레이드 숙제를 추가하도록 구현.
- 레이드 삭제 버튼을 레이드명/난이도 라인 옆 액션으로 이동.
- 일반 숙제 행의 reset/activate 배지를 숨겨 버튼과 숙제명이 더 가까이 보이도록 정리.

### 검증
- 사용자 지시에 따라 `node tools/check-project.js`는 실행하지 않음.
- `index.html`, `index_redesign.html`, `core.html`, `raid.html`, `overview.html`, `parties.html` 모두 `</html>` 뒤 코드 없음 확인.
- 위 6개 HTML 모두 CSS `var(--...)` 정의 누락 없음 확인.
- `git diff --check` 통과. 단, `CODEX_SESSION_LOG.md`, `index_redesign.html` LF→CRLF 경고 출력.

## 2026-05-03 - index_redesign 관리 모드 및 기존 index 기능 보강

### 요청
- 캐릭터 숙제 행의 `복제/수정/삭제/일괄` 상시 노출을 정리하고 삭제와 일괄 삭제를 통합.
- 복제/일괄 삭제 대상 선택 UI를 계정별 그룹 아래 캐릭터가 가로로 이어지는 형태로 변경하고 전체/계정별 선택을 제공.
- 상단 보기 버튼을 정리하고 `수정`, `복제`, `삭제`, `순서` 관리 모드를 배치.
- 캐릭터 정보, 재화 현황에도 수정/삭제가 가능해야 하며 캐릭터 전투력을 표시.
- 계정 추가, 캐릭터 추가, 일괄 접기, 부계정 표시, 상위/하위 숙제, 순서 변경, 커스텀 노트 보기 기능 보강.
- `index.html` 기능과 `index_redesign.html` 기능을 비교하며 빠진 기능을 새 UI에 반영.

### 수정 파일
- `index_redesign.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- 상단에 `보기 옵션`, `수정`, `복제`, `삭제`, `순서`, `일괄접기`, 계정/캐릭터 추가 버튼을 배치하고, 행별 관리 버튼은 선택한 관리 모드에서만 보이도록 변경.
- `완료 숙제 숨기기`, `비활성 숙제 보이기`는 `보기 옵션` 팝오버 안의 토글로 이동.
- 숙제 삭제 버튼은 단일 삭제와 `clone_group_id` 기반 복제본 일괄 삭제를 자동 분기하도록 통합.
- 복제/일괄 삭제 모달을 계정별 그룹 + 가로 캐릭터/계정 칩 형태로 재구성하고 전체 선택/계정별 선택을 추가.
- 캐릭터 카드 헤더에 전투력 표시, 캐릭터 정보 수정/삭제, 캐릭터 순서 변경 액션을 추가.
- 계정 추가/수정/삭제 및 부계정 지정 UI를 추가하고, 부계정에는 계정 탭/선택 UI에 표시 아이콘을 붙임.
- 재화 추가/수정/삭제 및 재화 순서 변경 액션을 추가.
- 커스텀 노트 보기/추가/수정/삭제, 텍스트/표/구분선 블록 편집 UI를 추가.
- 상위 숙제 아래 하위 숙제가 들여쓰기와 진행 수로 드러나도록 렌더링하고, 하위 숙제 추가/체크/순서 변경을 지원.
- 계정, 캐릭터, 일반 숙제, 원정대 숙제, 레이드 현황, 재화, 커스텀 노트의 `sort_order` 기반 위/아래 순서 변경을 추가.
- 캐릭터별 `show_raid_tasks`, `show_currencies`, `show_custom_notes` 설정을 새 UI 렌더링에 반영.

### 검증
- 사용자 지시에 따라 `node tools/check-project.js`는 실행하지 않음.
- `index.html`, `index_redesign.html`, `core.html`, `raid.html`, `overview.html`, `parties.html` 모두 `</html>` 뒤 코드 없음 확인.
- 위 6개 HTML 모두 CSS `var(--...)` 정의 누락 없음 확인.
- `git diff --check` 통과. 단, `index_redesign.html` LF→CRLF 경고 출력.

## 2026-05-03 - index_redesign 캐릭터 숙제 사용성 및 드래그 정렬 보강

### 요청
- 캐릭터 숙제 탭의 상단 버튼을 그룹화하고 보기 옵션 팝오버 위치를 정리.
- 비활성 숙제 표시 시 회색 계열로 구분하고, 휴식 게이지 강조 기준을 반영.
- 캐릭터 카드의 레벨/전투력 표시와 숙제 타입별 체크 UI를 개선.
- 일일 숙제/재화 현황 섹션 제목 크기를 키우고 카드 내부 구분감을 강화.
- 주간/월간 숙제의 레이드 현황에 파티연동/임시파티연동/임시파티체크해제 표시를 추가.
- 순서 버튼을 제거하고 캐릭터/숙제/레이드/재화/노트/계정 순서를 마우스 드래그로 변경.
- 상위 숙제는 직접 체크하지 못하고 하위 숙제 완료 상태로만 완료되게 변경.
- 렌더링 부담을 줄이기 위해 불필요한 설정 모달 렌더를 줄임.

### 수정 파일
- `index_redesign.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- 상단 도구를 `보기 옵션`, `+ 추가`, `관리`, `새로고침`으로 재배치하고, 보기/추가/관리 팝오버를 버튼 기준 위치에 뜨도록 변경.
- `완료 숙제 숨기기`, `비활성 숙제 보이기` 토글은 보기 옵션 안에 유지하되, 비활성 숙제는 회색/저채도 스타일과 `비활성` 배지로 표시.
- 캐릭터 헤더에서 직업, 아이템 레벨, 전투력을 한 줄에 표시하고 레벨/전투력 색상을 분리.
- 휴식 게이지 숙제는 `rest_daily_limit` 기준 1/2/3 형태의 완료 버튼을 사용하고, 체크박스 숙제는 텍스트 없는 사각 체크박스로 표시하며, 단계별 숙제도 번호 버튼 형태로 통일.
- 휴식/단계형 진행도는 `last_completed_at`이 현재 초기화 구간 안에 있을 때만 완료/진행으로 인정해 이전 날짜 진행도가 그대로 남지 않도록 보정.
- 휴식 게이지 `rest_threshold`가 0이면 기존 녹색 계열을 유지하고, 0 초과 상태에서 현재 휴식 게이지가 강조값 이상이면 파란색 계열로 표시.
- 상위 숙제는 `하위 연동` 표시만 보여 직접 체크를 막고, 하위 숙제가 모두 완료될 때 기존 동기화 로직으로 완료 처리.
- 일일/주간 카드 내부를 `card-section`, `currency-block`, `collapse-block` 박스로 구분하고 섹션 제목 크기를 키워 가독성을 개선.
- `raid_parties`, `raid_party_members`, `raid_schedule_overrides.temp_changes`를 읽어 레이드 행에 `파티연동`, `임시파티연동`, `임시파티체크해제` 배지를 표시.
- `순서` 관리 모드 버튼과 위/아래 화살표 UI 노출을 제거하고, HTML5 drag/drop으로 계정, 캐릭터 카드, 숙제, 레이드, 재화, 커스텀 노트 순서를 저장하도록 추가.
- 렌더링 때마다 계정 설정 목록을 다시 그리지 않고, 계정 설정 모달이 열려 있을 때만 갱신하도록 변경.

### 검증
- 사용자 지시에 따라 `node tools/check-project.js`는 실행하지 않음.
- `index.html`, `index_redesign.html`, `core.html`, `raid.html`, `overview.html`, `parties.html` 모두 `</html>` 뒤 코드 없음 확인.
- 위 6개 HTML 모두 CSS `var(--...)` 정의 누락 없음 확인.
- `git diff --check` 통과. 단, `index_redesign.html` LF→CRLF 경고 출력.

## 2026-05-03 - index_redesign 관리 모드 종료 및 숙제 항목 구분 강화

### 요청
- 관리 메뉴에서 수정/복제/삭제 모드 선택 후 모드를 명확히 종료할 방법 추가.
- 일일 숙제/재화 현황 섹션은 카드로 분리되지만, 일일 숙제 내부 항목 구분이 약하므로 RLOA처럼 항목 단위가 잘 보이게 개선.

### 수정 파일
- `index_redesign.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- 수정/복제/삭제 모드가 켜진 동안 관리 버튼 옆에 `수정 완료`, `복제 완료`, `삭제 완료` 버튼이 나타나도록 추가.
- 화면 바깥 클릭으로 자동 종료하는 방식은 체크/드래그/팝오버 조작 중 오작동 여지가 있어, 명시적인 완료 버튼 방식으로 적용.
- 일일/주간 숙제 섹션 내부의 각 `task-group`을 개별 미니 카드 형태로 표시하고, 테두리/배경/좌측 포인트 라인/hover 상태를 추가해 숙제 간 구분감을 강화.

### 검증
- 사용자 지시에 따라 `node tools/check-project.js`는 실행하지 않음.
- `index.html`, `index_redesign.html`, `core.html`, `raid.html`, `overview.html`, `parties.html` 모두 `</html>` 뒤 코드 없음 확인.
- 위 6개 HTML 모두 CSS `var(--...)` 정의 누락 없음 확인.
- `git diff --check` 통과. 단, `CODEX_SESSION_LOG.md`, `index_redesign.html` LF→CRLF 경고 출력.

## 2026-05-03 - overview/raid/parties/core 새 숙제 UI 톤 정렬 및 미배치 파티 프리뷰

### 요청
- `index_redesign.html`에서 넘어온 새 `index.html` 디자인을 기준으로 `overview.html`, `raid.html`, `parties.html`, `core.html`의 디자인과 색감을 맞춤.
- `index.html`/`index_redesign.html`은 사용자가 직접 파일 교체 작업을 할 예정이므로 수정하지 않음.
- `raid.html` 주간 일정 우측 미배치 파티 패널에서 파티 hover 또는 클릭 시 해당 파티 정보를 보여주도록 개선.

### 수정 파일
- `overview.html`
- `raid.html`
- `parties.html`
- `core.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- 네 페이지에 Pretendard 웹폰트 링크와 `index.html` 기반 청록 포인트/어두운 패널 팔레트 CSS 오버라이드를 추가.
- 공통 네비게이션, 헤더, 버튼, 입력창, 카드/패널/필터/모달 배경과 테두리 톤을 새 숙제 UI와 더 가깝게 정렬.
- `raid.html` 미배치 파티 패널에 `unplaced-preview` 영역을 추가하고, 미배치 파티 카드에 hover/focus/click 이벤트를 연결.
- 미배치 파티 프리뷰에서 레이드명/난이도, 파티명, 채워진 인원 수, 입장 레벨, 슬롯별 캐릭터 구성을 표시.

### 검증
- 사용자 지시에 따라 `node tools/check-project.js`는 실행하지 않음.
- `index.html`, `core.html`, `raid.html`, `overview.html`, `parties.html` 모두 `</html>` 뒤 코드 없음 확인.
- 5개 주요 HTML 모두 CSS `var(--...)` 정의 누락 없음 확인.
- `git diff --check` 통과. 단, Git LF→CRLF 변환 경고 출력.

## 2026-05-04 - 테스트 날짜 버튼 분리

### 요청
- 설정 모달의 테스트 기준 날짜 버튼을 `현재 시각으로`와 `테스트 끄기` 두 동작으로 분리.

### 수정 파일
- `index.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- `현재 시각으로` 버튼은 입력란만 현재 시각으로 채워 테스트 시작점을 잡도록 변경.
- `테스트 끄기` 버튼은 입력란을 비우고 `la_test_now`를 즉시 제거해 실제 현재 시간 모드로 복귀하도록 변경.

### 검증
- 사용자 지시에 따라 `node tools/check-project.js`는 실행하지 않음.
- `index.html`, `core.html`, `raid.html`, `overview.html`, `parties.html` 모두 `</html>` 뒤 코드 없음 확인.
- 5개 주요 HTML 모두 CSS `var(--...)` 정의 누락 없음 확인.
- `git diff --check` 통과. 단, Git LF→CRLF 변환 경고 출력.

## 2026-05-04 - 작업 종료 HANDOFF 갱신

### 요청
- 오늘 작업을 종료하며 다음 컴퓨터로 넘길 종료 루틴 작성.
- Claude가 수정한 내용도 포함해 정리.

### 수정 파일
- `HANDOFF.md`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- 다음 작업 시작 프롬프트에 `CHANGELOG_CLAUDE.md` 필수 참조를 추가.
- Claude 변경 요약을 `HANDOFF.md`에 반영하고, 상세 내용은 `CHANGELOG_CLAUDE.md`를 기준으로 확인하도록 정리.
- 오늘 Codex 변경 사항과 현재 동작 기준, Supabase 적용 필요 컬럼, 다음 수동 확인 우선순위를 종료 상태 기준으로 갱신.
- `node tools/check-project.js` 금지 지시와 대체 검증 기준을 유지.

### 검증
- 사용자 지시에 따라 `node tools/check-project.js`는 실행하지 않음.
- `index.html`, `core.html`, `raid.html`, `overview.html`, `parties.html` 모두 `</html>` 뒤 코드 없음 확인.
- 5개 주요 HTML 모두 CSS `var(--...)` 정의 누락 없음 확인.
- `git diff --check` 통과. 단, Git LF→CRLF 변환 경고 출력.

## 2026-05-04 - index 버그 수정 및 계정 필터 숨김 추가

### 요청
- 캐릭터 수정 모달의 아이콘 선택창이 보이지 않는 문제 수정.
- 휴식 게이지를 클릭해서 0으로도 조정할 수 있게 수정.
- 복제/삭제 대상 모달에서 캐릭터 레벨을 함께 표시하고 숨김 계정은 제외.
- 재화 현황 추가 버튼, 계정 수정/삭제, 계정별 필터 숨김 설정 추가.
- 필터 숨김 계정이 core/overview/raid/parties 및 공유 링크 필터에는 보이지 않되 파티 구성/주간 일정 구성에는 남도록 처리.

### 수정 파일
- `index.html`
- `core.html`
- `overview.html`
- `raid.html`
- `parties.html`
- `schema.sql`
- `DB_MIGRATION_LOG.md`

### 변경 내용
- `index.html` 이미지 picker에 `images/index.json` 로드 실패 시 사용하는 정적 fallback index를 추가하고 picker overlay z-index 공백을 정리.
- 휴식 게이지 그룹 클릭 계산을 추가해 첫 게이지 왼쪽 끝 클릭 시 `rest_current=0`으로 저장되도록 수정.
- 복제/일괄 삭제 모달의 대상 칩에 캐릭터명, 아이템 레벨, 직업을 표시하고 `la_hidden_accs` 숨김 계정은 대상 목록에서 제외.
- 재화 현황 `+` 버튼을 관리 모드가 아니어도 보이도록 변경.
- 계정 추가/수정 모달에 삭제 버튼과 `캐릭터 필터에서 이 계정 숨김` 체크박스를 추가.
- `accounts.hide_from_filters` 컬럼을 `schema.sql`에 추가하고, 해당 값이 true인 계정은 core/overview/parties/raid 및 공유 링크의 캐릭터 필터/계정 선택 UI에서 제외.
- raid 파티 구성과 주간 일정 파티 구성용 캐릭터 선택 로직은 기존대로 전체 캐릭터를 유지.

### 검증
- 사용자 지시에 따라 `node tools/check-project.js`는 실행하지 않음.
- `index.html`, `core.html`, `raid.html`, `overview.html`, `parties.html` 모두 `</html>` 뒤 코드 없음 확인.
- 5개 주요 HTML 모두 CSS `var(--...)` 정의 누락 없음 확인.
- `git diff --check` 통과. 단, Git LF→CRLF 변환 경고 출력.

## 2026-05-04 - index 아제나의 축복 캐릭터 표시 추가

### 요청
- 캐릭터 추가/수정 때 아제나의 축복 여부를 체크할 수 있게 하고, `index.html` 캐릭터 카드에서 체크 여부를 아이콘 형태로 표시.

### 수정 파일
- `index.html`
- `schema.sql`
- `DB_MIGRATION_LOG.md`

### 변경 내용
- `characters.azena_blessing` boolean 컬럼을 `schema.sql`과 마이그레이션 로그에 추가.
- 캐릭터 추가/수정 모달에 `아제나의 축복 적용` 체크박스를 추가.
- 캐릭터 저장 시 `azena_blessing` 값을 함께 저장하고, 컬럼 미적용 환경에서는 기존 캐릭터 저장만 fallback 처리.
- 캐릭터 카드 헤더에 아제나 체크 캐릭터를 나타내는 `images/goods/azena.png` 원형 아이콘 배지를 표시.

### 검증
- 사용자 지시에 따라 `node tools/check-project.js`는 실행하지 않음.
- `index.html`, `core.html`, `raid.html`, `overview.html`, `parties.html` 모두 `</html>` 뒤 코드 없음 확인.
- 5개 주요 HTML 모두 CSS `var(--...)` 정의 누락 없음 확인.
- `git diff --check` 통과. 단, Git LF→CRLF 변환 경고 출력.

## 2026-05-05 - index 카드 높이 통일 및 색감 경량화

### 요청
- 캐릭터 숙제, 주간/월간 숙제, 계정 숙제 카드의 높이를 동일하게 맞추고 넘치는 내용은 카드 내부에서 휠 스크롤로 탐색.
- 참고 이미지처럼 디자인과 색감을 조금 더 가볍게 조정.

### 수정 파일
- `index.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- 캐릭터/계정 카드 그리드에 고정 행 높이를 적용하고, 카드 자체는 flex column으로 변경.
- `.card-body`에 내부 스크롤을 적용해 숙제 수가 많아도 카드 높이가 늘어나지 않도록 조정.
- 모바일에서는 카드 행 높이를 별도로 늘려 터치 환경에서 탐색 공간을 확보.
- 배경, 패널, 버튼, 카드, 섹션 박스의 대비와 그림자를 낮춰 전체 톤을 조금 더 가볍게 조정.

### 검증
- 사용자 지시에 따라 `node tools/check-project.js`는 실행하지 않음.
- `index.html`, `core.html`, `raid.html`, `overview.html`, `parties.html` 모두 `</html>` 뒤 코드 없음 확인.
- 5개 주요 HTML 모두 CSS `var(--...)` 정의 누락 없음 확인.
- `git diff --check` 통과. 단, Git LF→CRLF 변환 경고 출력.

## 2026-05-05 - 계정 숙제 카드 CSS 및 레이드 완료 주간 기준 수정

### 요청
- 사용자가 `div.grid`의 `grid-auto-rows`를 600px로 변경한 상태를 유지.
- 계정 숙제 화면에서 숙제 항목 사이가 과도하게 벌어지는 CSS 문제 수정.
- `index.html` 주간/월간 탭의 레이드 완료 체크가 daily reset처럼 풀리지 않고 `raid.html`, `overview.html`과 동일하게 수요일 오전 6시 기준으로 연동되도록 수정.
- 각 주요 HTML의 브라우저 탭 title 수정.

### 수정 파일
- `index.html`
- `core.html`
- `raid.html`
- `overview.html`
- `parties.html`
- `index_old.html`
- `core_old.html`
- `raid_old.html`
- `overview_old.html`
- `parties_old.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- `.grid`와 `.account-grid`의 `grid-auto-rows`를 600px로 통일.
- `.card-body`에 `grid-auto-rows:max-content`와 `align-content:start`를 추가해 계정 숙제 카드 내부 항목이 남는 높이에 늘어나지 않도록 수정.
- `index.html`의 `isDone()`에서 `raid_tasks` 레코드는 수요일 오전 6시 기준 주간 reset으로 판정하도록 분기 추가.
- 주요 HTML 및 보관용 old HTML title을 `로스트아크 ...` 형식으로 정리.

### 검증
- 사용자 지시에 따라 `node tools/check-project.js`는 실행하지 않음.
- `index.html`, `core.html`, `raid.html`, `overview.html`, `parties.html` 모두 `</html>` 뒤 코드 없음 확인.
- 5개 주요 HTML 모두 CSS `var(--...)` 정의 누락 없음 확인.
- `git diff --check` 통과. 단, Git LF→CRLF 변환 경고 출력.

## 2026-05-05 - index 초기화 기준 및 렌더링 지연 개선

### 요청
- 캐릭터 숙제 탭의 일일/주간 초기화 기준 확인.
- 일일 숙제는 오전 6시 기준으로 완료 상태 유지 및 휴식 게이지 충전/소모가 이루어져야 함.
- 테스트 모드에서 일부 캐릭터만 휴식 게이지가 처리되는 문제 확인.
- `index.html`의 완료/수정/삭제/복제 작업 중 버벅임 최적화.

### 수정 파일
- `index.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- `getLastResetUTC()` 기준상 일일은 KST 매일 오전 6시, 주간은 선택 요일 KST 오전 6시로 동작함을 확인.
- 캐릭터별/계정별 숙제 데이터를 owner id 기준 배치 조회로 변경.
- 테스트 모드 및 일반 로드 시 전체 캐릭터/계정 숙제를 로드 후 자동 초기화하도록 변경.
- 휴식 게이지 월간 boundary 역산에서 월말 날짜 overflow가 생기지 않도록 이전 reset boundary 계산 함수를 분리.
- 휴식 게이지 reset boundary 통과 시 `count_current`도 함께 0으로 정리.
- 휴식 게이지/완료 만료 DB 업데이트를 순차 update에서 병렬 update로 변경.
- 완료 체크, 단계형 카운트, 휴식 게이지 카운트, 휴식 게이지 직접 조정, 레이드 완료 체크는 로컬 상태를 먼저 갱신하고 DB 저장 실패 시 되돌리는 optimistic UI로 변경.
- 계정 전환/숨김 전환은 전체 숙제 재조회 대신 현재 계정 레이드 메타만 다시 로드하도록 변경.
- 복제/일괄 삭제 완료 후 불필요한 `loadAccountData()` 재호출을 제거하고 로컬 상태 기반으로 즉시 렌더링하도록 변경.

### 검증
- 사용자 지침에 따라 `node tools/check-project.js`는 실행하지 않음.

## 2026-05-05 - index 탭 전환 시 스크롤 위치 보존

### 요청
- 상단 탭에서 주간/월간 숙제와 캐릭터 숙제를 오갈 때 주간/월간 숙제의 스크롤이 초기화되어 체크 실수가 발생하는 문제 방지.

### 수정 파일
- `index.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- 모드별로 `window.scrollY`와 각 카드 내부 `.card-body` 스크롤 위치를 저장/복원하는 `saveViewScroll`, `restoreViewScroll` 추가.
- 캐릭터 일일/주간 카드와 계정 숙제 카드에 안정적인 `data-scroll-key`를 부여.
- `setMode()`에서 탭 전환 전 현재 모드 스크롤을 저장하도록 변경.
- `render()` 후 현재 모드의 이전 스크롤 위치를 복원하도록 변경해 탭 전환 및 체크 후 재렌더 시 위치 이탈을 줄임.

### 검증
- 사용자 지침에 따라 `node tools/check-project.js`는 실행하지 않음.

## 2026-05-05 - 파티 연동 레이드 삭제 시 파티 구성 잔존 수정

### 요청
- `index.html` 주간/월간 숙제에서 파티 연동된 레이드를 삭제해도 `raid.html`의 파티 구성 등에 캐릭터가 남는 문제 수정.

### 수정 파일
- `index.html`
- `raid.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- `index.html` 레이드 숙제 삭제 시 `raid_tasks` 삭제 성공 후 같은 `preset_id`와 `character_id`로 연결된 `raid_party_members`를 함께 삭제하도록 변경.
- 같은 레이드/캐릭터가 주간 일정 임시 배치에 남아 있는 경우 `raid_schedule_overrides.slot_overrides`와 `temp_changes`의 관련 항목도 정리하도록 추가.
- 공유 링크 레이드 현황에서 레이드를 삭제하는 경우에도 같은 파티 연동 정리 로직을 적용.

### 검증
- 사용자 지침에 따라 `node tools/check-project.js`는 실행하지 않음.

## 2026-05-05 - index 테스트 모드 배지 및 카드 높이 동작 수정

### 요청
- 테스트 모드가 켜져 있을 때 시간 표시 오른쪽에 별도 표시 추가.
- 계정 숙제도 캐릭터 숙제/주간 월간 숙제처럼 숙제별 카드 처리가 되도록 개선.
- 카드 높이는 고정 600px가 아니라 내용이 적으면 줄어들고, 내용이 많아 600px를 넘을 때만 카드 내부 스크롤이 뜨도록 수정.

### 수정 파일
- `index.html`
- `CODEX_SESSION_LOG.md`

### 변경 내용
- 상단 시계 오른쪽에 `TEST MODE` 배지를 추가하고, `la_test_now`가 있을 때만 표시되도록 변경.
- `.grid`, `.account-grid`의 `grid-auto-rows:600px` 고정 행 높이를 제거.
- `.char-card`, `.account-card`에 `max-height:600px`를 적용해 내용이 적을 때는 카드가 줄어들고 600px를 넘으면 내부 스크롤되도록 변경.
- 계정 숙제의 `.task-group`에도 캐릭터 숙제와 동일한 카드형 테두리/배경/hover 스타일을 적용.

### 검증
- 사용자 지침에 따라 `node tools/check-project.js`는 실행하지 않음.
