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
