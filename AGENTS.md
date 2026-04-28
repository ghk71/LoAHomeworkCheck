# AGENTS.md

이 파일은 Codex 및 다른 AI 코딩 에이전트가 이 저장소를 열었을 때 우선 읽어야 하는 프로젝트 지침이다.

## Project

로스트아크 숙제 트래커.

- GitHub Pages
- Supabase
- 정적 HTML/CSS/JavaScript
- 빌드 도구 없음
- Supabase JS CDN 사용

## Must Read Before Work

- `CODEX_INSTRUCTIONS.md`
- `PROJECT_CONTEXT.md`
- `ARCHITECTURE.md`
- `FEATURE_SPEC.md`
- `BUG_HISTORY.md`
- `TEST_SCENARIO.md`
- `DB_MIGRATION_LOG.md`
- `CODEX_SESSION_LOG.md`
- `schema.sql`

## Hard Rules

- Do not convert to React/Vite/Next.js.
- Keep static HTML structure.
- Do not remove existing features.
- Do not place JavaScript outside `<script>`.
- Do not leave anything after `</html>`.
- Keep Supabase column names aligned with `schema.sql`.
- Define every CSS variable used by `var(--...)`.
- Make small, scoped changes.
- Run `node tools/check-project.js` after changes.
- Update `BUG_HISTORY.md` or `CODEX_SESSION_LOG.md` after meaningful changes.

## Validation Command

```bash
node tools/check-project.js
```

## Review Guidelines

When reviewing or editing:

- Check for runtime errors such as `ReferenceError`, `TypeError`, and Supabase column errors.
- Check that UI classes referenced in templates are defined in CSS.
- Check that sharing/viewer mode never exposes editing controls.
- Check that index/core/raid/overview/parties maintain consistent visual tone.
- Check that related data flows between index, raid, overview, and parties remain compatible.
