# Codex Instructions

Codex는 작업 전에 이 파일과 `AGENTS.md`, `PROJECT_CONTEXT.md`, `ARCHITECTURE.md`, `FEATURE_SPEC.md`, `BUG_HISTORY.md`, `TEST_SCENARIO.md`를 먼저 읽어야 한다.

## 절대 규칙

1. React, Vite, Next.js, Webpack 등으로 전환하지 않는다.
2. GitHub Pages 정적 HTML 구조를 유지한다.
3. 기존 파일 이름을 유지한다.
4. 기존 기능을 삭제하지 않는다.
5. 함수명을 임의로 변경하지 않는다.
6. Supabase 컬럼명은 `schema.sql`과 반드시 일치해야 한다.
7. HTML 밖에 JS 코드가 노출되면 안 된다.
8. `</html>` 뒤에는 어떤 코드도 있으면 안 된다.
9. CSS 변수 `var(--...)`를 추가하면 반드시 `:root`에 정의한다.
10. 한 번에 대규모 리팩토링하지 않는다.
11. 버그 단위로 작게 수정한다.
12. 수정 전후 `git diff`로 변경 범위를 확인한다.
13. 현재 사용자 지시로 `node tools/check-project.js`는 실행하지 않는다. 이 PC에서 `node.exe Access is denied`가 반복되었으므로 다른 컴퓨터에서도 이 명령 재시도 대신 보조 검증을 수행한다.
14. 변경 사항은 `BUG_HISTORY.md` 또는 `CODEX_SESSION_LOG.md`에 기록한다.

## 작업 방식

좋은 요청 예:

```txt
index.html의 레이드 숙제 골드 칩 hover 효과와 수정 버튼 제거만 처리하세요.
다른 파일은 건드리지 마세요.
수정 후 node tools/check-project.js를 실행하세요.
```

나쁜 요청 예:

```txt
전체 코드 최적화하고 다 고쳐줘.
```

## 검증

현재 사용자 지시로 아래 명령은 실행하지 않는다.

```bash
node tools/check-project.js
```

대신 수정 후 반드시 아래를 확인한다.

- `index.html`, `core.html`, `raid.html`, `overview.html`, `parties.html`에서 `</html>` 뒤 코드가 없는지 확인한다.
- 5개 주요 HTML에서 사용한 CSS `var(--...)`가 모두 정의되어 있는지 확인한다.
- `git diff --check`를 실행한다.

## Supabase 주의사항

- 새 컬럼을 추가하면 `schema.sql`에 `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` 형태로 넣는다.
- 기존 데이터와 호환되어야 한다.
- 마이그레이션 내용은 `DB_MIGRATION_LOG.md`에 기록한다.

## UI 주의사항

- index/core/raid/overview/parties의 디자인 톤을 통일한다.
- CSS 누락으로 기본 HTML 버튼이 노출되면 실패다.
- hover 효과를 추가할 때 모바일/터치 환경도 깨지지 않아야 한다.
- 모달은 화면 밖으로 나가면 안 된다.

## 작업 종료 전 체크리스트

```txt
[ ] 관련 문서를 읽었다
[ ] 관련 파일만 수정했다
[ ] schema.sql과 컬럼명을 대조했다
[ ] node tools/check-project.js는 사용자 지시로 생략
[ ] 5개 주요 HTML `</html>` 뒤 코드 없음 확인
[ ] 5개 주요 HTML CSS 변수 누락 없음 확인
[ ] git diff --check 통과
[ ] git diff 확인
[ ] BUG_HISTORY.md 또는 CODEX_SESSION_LOG.md 기록
[ ] 테스트 시나리오 중 관련 항목 수행
```
