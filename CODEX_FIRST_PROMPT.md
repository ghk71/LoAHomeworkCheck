# Codex First Prompt

Codex를 처음 실행한 뒤 아래 프롬프트를 그대로 붙여넣는다.

```txt
이 프로젝트는 Claude에서 시작되고 ChatGPT와 함께 여러 차례 수정된 GitHub Pages + Supabase 기반 로스트아크 숙제 트래커입니다.

먼저 아래 문서를 읽으세요.

- AGENTS.md
- CODEX_INSTRUCTIONS.md
- PROJECT_CONTEXT.md
- ARCHITECTURE.md
- FEATURE_SPEC.md
- BUG_HISTORY.md
- TEST_SCENARIO.md
- DB_MIGRATION_LOG.md
- CODEX_SESSION_LOG.md
- schema.sql

그 다음 아래 HTML 파일을 분석하세요.

- index.html
- core.html
- raid.html
- overview.html
- parties.html

중요 규칙:
- 아직 코드를 수정하지 마세요.
- 먼저 전체 구조를 요약하세요.
- 페이지별 역할을 요약하세요.
- Supabase 테이블과 주요 관계를 요약하세요.
- 현재 가장 위험한 버그 가능성이 높은 부분을 목록화하세요.
- 테스트 우선순위를 제안하세요.
- React/Vite/Next.js로 바꾸지 마세요.
- 정적 HTML 구조를 유지해야 합니다.
- 기존 기능을 삭제하면 안 됩니다.
- HTML 밖에 JS가 노출되면 안 됩니다.
- </html> 뒤에 코드가 있으면 안 됩니다.
- CSS 변수 누락이 있으면 안 됩니다.
- 이후 수정 작업은 버그 단위로 작게 진행합니다.
```

## 첫 프롬프트 이후 해야 할 일

1. Codex가 구조 요약을 내놓으면, 본인이 알고 있는 프로젝트 내용과 맞는지 확인한다.
2. 틀린 부분이 있으면 바로 정정한다.
3. Codex에게 `node tools/check-project.js`를 먼저 실행하게 한다.
4. 현재 코드의 정적 검증 결과를 확인한다.
5. 그 다음 가장 급한 버그 하나만 지정한다.
6. 수정 범위를 제한한다.
7. 수정 후 `git diff`를 확인한다.
8. 브라우저에서 직접 테스트한다.
9. 통과하면 `BUG_HISTORY.md` 또는 `CODEX_SESSION_LOG.md`에 기록하게 한다.
10. commit 후 push한다.

## 두 번째 프롬프트 예시

```txt
좋습니다. 이제 index.html의 레이드 숙제 영역에서 hover 효과와 수정 버튼 제거만 처리하세요.

범위:
- index.html만 수정
- 다른 파일 수정 금지
- 기존 기능 삭제 금지
- 수정 후 node tools/check-project.js 실행
- 변경 내역을 CODEX_SESSION_LOG.md에 기록
```
