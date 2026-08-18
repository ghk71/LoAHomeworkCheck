# LOA Homework Tracker

로스트아크 숙제 트래커 프로젝트입니다.

## 배포 환경

- GitHub Pages
- Supabase
- 정적 HTML / CSS / JavaScript
- 빌드 도구 없음
- Supabase JS CDN 사용

## 주요 파일

| 파일 | 역할 |
|---|---|
| `index.html` | 메인 숙제, 계정, 캐릭터, 레이드 숙제, 재화 관리 |
| `core.html` | 코어 현황, 사용자 조합 관리 |
| `raid.html` | 레이드 프리셋, 난이도, 파티 구성, 주간 일정, 임시 파티, 공유 링크 |
| `overview.html` | 레이드 완료 현황 |
| `parties.html` | 파티 현황 |
| `party_generation.html` | 레이드 파티 생성 및 DB 적용 |
| `schema.sql` | Supabase 전체 스키마 |
| `AGENTS.md` | Codex/AI 에이전트 작업 규칙 |
| `CODEX_INSTRUCTIONS.md` | Codex 작업 상세 규칙 |
| `PROJECT_CONTEXT.md` | 프로젝트 배경과 인수인계 맥락 |
| `ARCHITECTURE.md` | 구조 및 데이터 흐름 |
| `FEATURE_SPEC.md` | 구현 기능 명세 |
| `BUG_HISTORY.md` | 버그 수정 이력 |
| `TEST_SCENARIO.md` | 수동 테스트 시나리오 |
| `CODEX_SESSION_LOG.md` | Codex 작업 세션 기록 |
| `DB_MIGRATION_LOG.md` | Supabase 스키마 변경 기록 |

## 작업 원칙

1. GitHub repo를 중앙 원본으로 둔다.
2. 회사 PC / 집 PC 모두 작업 전 `git pull`을 한다.
3. 작업 종료 전 반드시 `git add`, `git commit`, `git push`를 한다.
4. Codex 작업 전 `AGENTS.md`, `CODEX_INSTRUCTIONS.md`, `PROJECT_CONTEXT.md`를 읽힌다.
5. 현재 환경에서는 `AGENTS.md`의 fallback 검증을 사용하고, 사용자가 다시 요청한 경우에만 `node tools/check-project.js`를 실행한다.
6. 변경 내역은 `BUG_HISTORY.md` 또는 `CODEX_SESSION_LOG.md`에 기록한다.

## 기본 검증

```bash
git diff --check
```

- `index.html`, `core.html`, `raid.html`, `overview.html`, `parties.html`, `party_generation.html`의 `</html>` 뒤에 코드가 없는지 확인합니다.
- 6개 HTML에서 사용한 CSS 변수가 모두 정의되어 있는지 확인합니다.
- `tools/check-project.js`는 6개 HTML의 JavaScript 문법, `</html>`, CSS 변수를 검사하지만 현재 작업 환경에서는 사용자 요청이 있을 때만 실행합니다.

## Supabase 적용 순서

SQL Editor에서 아래 파일을 순서대로 전체 실행합니다.

1. `supabase/migrations/20260813_integrity_and_share_links.sql`
2. `supabase/migrations/20260813_raid_integrity_followup.sql`
3. `supabase/migrations/20260818_parent_task_completion_consistency.sql`

그다음 `create-share-link`, `resolve-share`, `send-homework-discord` Edge Function을 최신 소스로 재배포합니다. 두 번째 SQL에는 숙제 트리 복제, 레이드 임시 상태 복원, 파티 생성 적용, 정렬 저장 등 여러 화면이 공통으로 호출하는 원자적 RPC가 포함되며, 세 번째 SQL은 동시 하위 숙제 저장 후 상위 완료 상태를 DB 기준으로 다시 확정합니다.

## GitHub Pages 설정

```txt
Settings → Pages → Build and deployment
Source: Deploy from a branch
Branch: main
Folder: /root
```
