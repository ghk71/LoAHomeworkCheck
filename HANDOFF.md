# HANDOFF

다음 컴퓨터에서는 아래 문장으로 시작합니다.

```text
AGENTS.md를 따르고, HANDOFF.md, CHANGELOG_CLAUDE.md, CODEX_SESSION_LOG.md 마지막 섹션을 읽은 뒤 이어서 작업해주세요.
```

분석만 먼저 할 때:

```text
AGENTS.md를 따르고, HANDOFF.md, CHANGELOG_CLAUDE.md, CODEX_SESSION_LOG.md 마지막 섹션을 읽은 뒤 이어서 작업해주세요. 다만, 코드를 수정하지는 말고 우선 변경사항과 남은 위험 지점을 분석하세요.
```

## 프로젝트

- GitHub Pages + Supabase 기반 정적 HTML/CSS/JavaScript 프로젝트
- 주요 화면: `index.html`, `raid.html`, `overview.html`, `party_generation.html`, `parties.html`, `core.html`
- React/Vite/Next.js 전환 금지
- JavaScript는 각 HTML 내부 `<script>`에만 유지
- `</html>` 뒤 코드 금지, CSS 변수 누락 금지
- 현재 사용자 지시로 `node tools/check-project.js`는 실행하지 않음
- 대체 검증: 6개 HTML 후행 코드/CSS 변수, `git diff --check`, 브라우저 확인

## 2026-08-13 최신 작업

- 숙제 일시중지/완료/휴식/상위·하위 완료 동기화와 전체 숙제 트리 복제를 원자적 RPC로 전환했습니다.
- 레이드 그룹, 난이도, 파티, 일정, 임시 멤버, 파티 생성 적용 및 정렬의 다단계 저장을 DB 트랜잭션으로 묶었습니다.
- 임시 멤버/임시 파티의 활성 task 참조를 보호하고, 과거 기록은 3주 보존하면서 전역 숙제 연결은 새 주에 즉시 복원합니다.
- 임시해제 → 다른 파티 임시추가 → 제거 및 임시 파티 → 정규 파티 이동에서 원래 `preset_id`가 손상되는 경로를 보정했습니다.
- index/overview/parties/party_generation은 편집자 진입 시 공통 롤오버 RPC를 호출하고 공유 뷰어는 자동 정리와 localStorage DB 마이그레이션을 실행하지 않습니다.
- 모든 대량 조회에 페이지네이션과 안정적인 보조 정렬을 적용하고, 06:00 KST 완료 경계를 통일했습니다.
- `parties.html`과 파티 팝업은 선택 주차 override 요일을 적용하고 중복 요일을 제거합니다.
- `one_time_tasks` orphan 정리, 공유 링크 7/30/90일 만료/철회, 배포 루트 `*_old.html` 삭제 및 문서 정리를 완료했습니다.

## 반드시 적용할 Supabase 작업

1. Supabase SQL Editor에서 다음 파일 전체를 실행합니다.

```text
1. supabase/migrations/20260813_integrity_and_share_links.sql
2. supabase/migrations/20260813_raid_integrity_followup.sql
3. supabase/migrations/20260818_parent_task_completion_consistency.sql
```

2. 다음 Edge Function을 최신 소스로 재배포합니다.

- `create-share-link`
- `resolve-share`
- 이전 숙제 일시중지 작업까지 아직 배포하지 않았다면 `send-homework-discord`도 재배포

두 번째 SQL은 첫 번째 SQL의 일부 함수를 최신 정의로 교체하므로 순서를 지켜야 합니다. 적용 전에는 최신 원자적 숙제/레이드 작업이 안내 메시지와 함께 차단됩니다.

## 검증 결과

- 6개 HTML 모두 브라우저에서 로드되고 제목/본문 렌더링 확인
- 공유 링크 SQL 미적용 환경에서 생성 차단 메시지 확인
- 공유 뷰어 진입 및 편집자 자동 정리 미호출 코드 경로 확인
- `parties.html`에서 같은 요일 중복 제거와 override 요일 반영 확인
- 6개 HTML `</html>` 뒤 코드 없음
- 6개 HTML CSS 변수 정의 누락 없음
- `git diff --check` 통과, CRLF 경고만 존재
- `node tools/check-project.js`는 지침에 따라 실행하지 않음

## 남은 확인

- 실제 DB에 두 마이그레이션을 순서대로 적용한 뒤 숙제 복제/완료와 파티 생성/임시 멤버 RPC의 성공·실패 원자성 확인
- 이번 주와 다음 주에 같은 캐릭터를 서로 다른 임시 상태로 만든 뒤 주차별 표시와 롤오버 복원 확인
- 7/30/90일 링크 생성, 철회, 만료 응답 수동 확인
- 계정/캐릭터 삭제 시 일회용 숙제 트리거 정리 확인
- `docs/known_issues.md`에는 현재 재현 가능한 미해결 코드 결함이 없으며 운영 적용 확인만 기록되어 있음

## Git 상태

현재 변경은 commit되지 않았습니다. 작업 재개 시 먼저 `git status`와 최신 `CODEX_SESSION_LOG.md`를 확인합니다.

## 2026-08-13 최종 검증 보충

- 6개 HTML의 인라인 JavaScript 문법, `</html>` 뒤 잔여 코드, CSS 변수 정의 누락, 정적 ID 중복을 별도 검사했고 모두 통과했습니다.
- `git diff --check`는 `cr-at-eol`을 반영한 저장소 줄바꿈 기준으로 통과했습니다.
- 로컬 서버 `http://127.0.0.1:8765/`에서 `index.html`, `raid.html`, `overview.html`, `party_generation.html`, `parties.html`, `core.html`을 실제 Supabase 데이터로 열어 제목과 본문 렌더링을 확인했습니다.
- 여섯 화면 모두 데스크톱 뷰포트에서 문서 가로 넘침이 없었습니다. 파티 생성의 좌우 독립 스크롤과 8인 파티 4+4 배치도 확인했습니다.
- 브라우저 콘솔 오류는 없었습니다. `raid_group_settings.sort_order does not exist`와 `[raid-rollover]` 경고는 라이브 Supabase에 이번 두 마이그레이션이 아직 적용되지 않은 상태에서 발생하므로, 위 SQL 두 개를 순서대로 적용한 뒤 다시 확인해야 합니다.
- `node tools/check-project.js`는 저장소 지침에 따라 실행하지 않았습니다.

## 2026-08-18 하위 숙제 완료 일관성 보정

- 여러 하위 숙제 완료 요청이 동시에 진행될 때 오래된 상위 완료값이 마지막에 저장되는 경쟁 상태를 수정했습니다.
- `index.html`은 완료 클릭 직후와 각 저장 응답 후 현재 하위 상태로 모든 조상 완료 상태를 다시 계산하며, 실패 롤백 때도 같은 계산을 수행합니다.
- `apply_task_pause_atomic`은 변경된 숙제를 저장한 뒤 관련 부모 행을 잠그고 실제 DB의 활성 하위 숙제를 기준으로 조상 완료 상태를 아래에서 위 순서로 재계산합니다.
- 위 적용 순서의 세 번째 SQL을 Supabase SQL Editor에서 실행해야 DB 경쟁 상태 보정까지 활성화됩니다.
