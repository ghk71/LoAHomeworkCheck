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
5. 수정 후 `node tools/check-project.js`를 실행한다.
6. 변경 내역은 `BUG_HISTORY.md` 또는 `CODEX_SESSION_LOG.md`에 기록한다.

## 기본 검증 명령

```bash
node tools/check-project.js
```

## GitHub Pages 설정

```txt
Settings → Pages → Build and deployment
Source: Deploy from a branch
Branch: main
Folder: /root
```
