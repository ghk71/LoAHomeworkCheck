# Changelog

## Unreleased

### Fixed

- 임시 추가 → 해제를 반복하면 원래부터 프리셋에 연동돼 있던 레이드 숙제의 `preset_id`가 영구히 끊겨 index/overview에서 레이드 이미지가 사라지던 문제 수정 (`raid.html`: `revertTempAdd`가 `hadPreset` 플래그로 "원래 연동" vs "임시추가로 연동"을 구분)
- 임시추가 캐릭터 제거 시 임시해제 상태인 원래 슬롯 주인이 파티에 복귀한 것처럼 보이던 표시 불일치 수정 (`raid.html`: `removeOvrSlot`)
- `temp_changes`의 레거시 `task_id`(snake_case) 기록을 index/overview가 읽지 못하던 문제 수정
- index/overview에서 프리셋 미연결 숙제도 이름(접두어) 매칭으로 레이드 그룹 아이콘을 표시하도록 폴백 추가

### Added

- index.html 무결성 검사 모달에 "미연결 숙제 자동 복구" 버튼 추가 — 이름/난이도가 일치하는 프리셋에 `preset_id` 재연동 (이번 주 임시해제 숙제는 제외)

- Codex 인수인계 문서 세트
- AGENTS.md 기반 AI 작업 규칙
- 두 컴퓨터 작업 워크플로우
- Codex 세션 로그
- DB 마이그레이션 로그
