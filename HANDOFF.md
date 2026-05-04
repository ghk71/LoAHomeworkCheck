# HANDOFF

다음 컴퓨터에서 이어받을 때는 아래 프롬프트로 시작하면 됩니다.

```text
AGENTS.md를 따르고, HANDOFF.md, CHANGELOG_CLAUDE.md, CODEX_SESSION_LOG.md 마지막 섹션을 읽은 뒤 이어서 작업해주세요.
```

먼저 분석만 원하면 아래처럼 시작합니다.

```text
AGENTS.md를 따르고, HANDOFF.md, CHANGELOG_CLAUDE.md, CODEX_SESSION_LOG.md 마지막 섹션을 읽은 뒤 이어서 작업해주세요. 다만, 코드를 수정하지는 말고 우선 변경사항과 남은 위험 지점을 분석하세요.
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
- `CHANGELOG_CLAUDE.md`
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
- 현재 사용자 지시로 `node tools/check-project.js`는 실행하지 않습니다.
- 변경 뒤에는 5개 주요 HTML의 `</html>` 뒤 코드 없음, CSS `var(--...)` 정의 누락 없음, `git diff --check`를 확인합니다.

## 오늘 종료 시점 요약

오늘은 사용자가 직접 Claude와 작업한 `index.html` 대규모 변경 위에 Codex가 버그 수정과 종료 정리를 이어서 수행했습니다.

### Claude 변경 요약

세부 내용은 `CHANGELOG_CLAUDE.md`를 반드시 확인하세요. 핵심은 다음과 같습니다.

- `index.html`이 새 숙제 UI 기준 메인 페이지가 되었고, 기존 흐름은 `index_old.html` 쪽으로 남아 있습니다.
- 아이콘 선택 기능이 GitHub API 직접 호출 방식에서 `images/index.json` 정적 인덱스 방식으로 전환되었습니다.
- `images/` 하위 폴더 기반 아이콘 카테고리 구조가 도입되었습니다.
- `scripts/generate-image-index.js`와 `.github/workflows/build-image-index.yml`로 이미지 인덱스 자동 생성 흐름이 추가되었습니다.
- 설정 모달, 테스트 기준 날짜, 휴식 게이지 자동 충전/소모 로직, 캐릭터 아이콘 picker, 파티연동 팝업, Enter 저장 동작 등이 `index.html`에 반영되었습니다.
- `CHANGELOG_CLAUDE.md`에는 구 버전과 새 버전의 의도적 차이와 미복원 항목도 적혀 있으므로 다음 작업자는 이 문서를 기준으로 “기능 누락인지 의도적 변경인지”를 구분해야 합니다.

### Codex 변경 요약

- 캐릭터 수정 모달에서 아이콘 선택 picker가 다른 모달 뒤에 가려지는 문제를 방지했습니다.
- `images/index.json` 로드 실패 시에도 `index.html` picker가 기본 카테고리/파일 목록을 보여주도록 fallback을 추가했습니다.
- 휴식 게이지 첫 그룹의 왼쪽 끝 클릭으로 `rest_current=0` 저장이 가능하도록 수정했습니다.
- 재화 현황 추가 `+` 버튼이 관리 모드가 아니어도 보이도록 수정했습니다.
- 복제/삭제 대상 모달에서 캐릭터명뿐 아니라 레벨/직업을 같이 표시하고, `la_hidden_accs`로 숨김 처리된 계정은 대상 목록에서 제외했습니다.
- 계정 추가/수정 모달에 계정 삭제 버튼과 `캐릭터 필터에서 이 계정 숨김` 체크박스를 추가했습니다.
- `accounts.hide_from_filters` 컬럼을 `schema.sql`과 `DB_MIGRATION_LOG.md`에 추가했습니다.
- `core.html`, `overview.html`, `raid.html`, `parties.html` 및 공유 링크의 캐릭터 필터/계정 선택 UI에서 `hide_from_filters=true` 계정을 제외했습니다.
- 단, `raid.html`의 파티 구성과 주간 일정 파티 구성용 캐릭터 선택은 기존대로 전체 캐릭터를 유지하도록 했습니다.
- 설정 모달의 테스트 날짜 버튼을 `현재 시각으로`와 `테스트 끄기`로 분리했습니다.

## 현재 중요한 동작 기준

- 일상 사용에서는 설정 모달의 테스트 기준 날짜를 비워두어야 실제 시간이 흐릅니다.
- `현재 시각으로`는 입력란만 현재 시각으로 채우며, 저장하면 테스트 모드가 됩니다.
- `테스트 끄기`는 입력란을 비우고 `la_test_now`를 즉시 제거합니다.
- `accounts.hide_from_filters=true`는 필터 UI에서만 숨김입니다. 파티 구성 데이터나 주간 일정 구성 데이터에서 캐릭터를 삭제하거나 숨기면 안 됩니다.
- `la_hidden_accs`는 `index.html`의 계정 숨김 UI와 복제/삭제 대상 모달 제외에 사용됩니다.
- `accounts.hide_from_filters`는 core/overview/raid/parties 및 공유 링크 필터 제외에 사용됩니다.
- 이미지 picker의 정상 기준은 `images/index.json`이지만, `index.html`에는 fallback도 있습니다. 다른 HTML의 picker는 아직 기존 구현이 남아 있을 수 있으므로, 아이콘 picker 관련 추가 버그가 있으면 페이지별 구현을 따로 확인해야 합니다.

## Supabase 적용 필요

최신 기능을 안정적으로 쓰려면 Supabase SQL Editor에 `schema.sql`의 최신 ALTER 문이 적용되어 있어야 합니다.

특히 오늘 추가된 컬럼:

```sql
alter table accounts add column if not exists hide_from_filters boolean default false;
```

이 컬럼이 없으면 `index.html`은 계정 저장 시 fallback으로 저장 자체는 시도하지만, 필터 숨김 설정은 DB에 남지 않습니다.

그 외 확인 대상:

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

## 종료 시점 검증

사용자 지시에 따라 `node tools/check-project.js`는 실행하지 않았습니다.

대체 검증 기준:

- `index.html`, `core.html`, `raid.html`, `overview.html`, `parties.html` 모두 `</html>` 뒤 코드 없음 확인.
- 5개 주요 HTML 모두 CSS `var(--...)` 정의 누락 없음 확인.
- `git diff --check` 통과. 단, Git LF→CRLF 변환 경고가 출력될 수 있습니다.

## 다음 수동 확인 우선순위

1. `index.html` 캐릭터 수정 모달에서 아이콘 선택을 눌렀을 때 picker 폴더가 보이는지 확인.
2. 휴식 게이지 첫 칸 왼쪽 끝 클릭 시 0으로 저장되는지 확인.
3. 재화 현황 `+` 버튼으로 재화 추가 모달이 열리고 저장되는지 확인.
4. 복제/삭제 모달에서 캐릭터 레벨/직업이 보이고, 숨김 계정이 제외되는지 확인.
5. 계정 수정/삭제와 `캐릭터 필터에서 이 계정 숨김` 체크 저장을 확인.
6. `hide_from_filters=true` 계정이 core/overview/raid/parties 및 공유 링크 필터에서 빠지는지 확인.
7. 같은 계정의 캐릭터가 raid 파티 구성/주간 일정 파티 구성에서는 여전히 선택 가능한지 확인.
8. 설정 모달에서 `현재 시각으로`와 `테스트 끄기`가 의도대로 동작하는지 확인.
9. `CHANGELOG_CLAUDE.md`의 TODO/주의 사항 중 아직 실제 화면에서 재현되는 문제가 있는지 점검.

## Git 상태 메모

오늘 종료 시점의 작업 파일은 아직 commit되지 않았습니다. 다음 작업자는 먼저 `git status`를 확인하세요.

최근 주요 수정 파일:

- `index.html`
- `core.html`
- `overview.html`
- `raid.html`
- `parties.html`
- `schema.sql`
- `DB_MIGRATION_LOG.md`
- `CODEX_SESSION_LOG.md`
- `HANDOFF.md`
