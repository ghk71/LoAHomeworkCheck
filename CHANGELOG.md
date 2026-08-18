# Changelog

## Unreleased

### Fixed

- 공유 뷰어 진입 시 `autoResetNonFixed()`가 DB 정리를 수행하던 문제 수정
- `parties.html`이 일정 override를 무시하고 같은 요일을 중복 표시하던 문제 수정
- 숙제 일시중지와 레이드 일정 삭제 중 일부 DB 요청만 성공할 수 있던 경로를 원자적 RPC로 교체
- 계정/캐릭터 삭제 후 `one_time_tasks` orphan 데이터가 남던 문제 수정

- 임시 추가 → 해제를 반복하면 원래부터 프리셋에 연동돼 있던 레이드 숙제의 `preset_id`가 영구히 끊겨 index/overview에서 레이드 이미지가 사라지던 문제 수정 (`raid.html`: `revertTempAdd`가 `hadPreset` 플래그로 "원래 연동" vs "임시추가로 연동"을 구분)
- 임시추가 캐릭터 제거 시 임시해제 상태인 원래 슬롯 주인이 파티에 복귀한 것처럼 보이던 표시 불일치 수정 (`raid.html`: `removeOvrSlot`)
- `temp_changes`의 레거시 `task_id`(snake_case) 기록을 index/overview가 읽지 못하던 문제 수정
- index/overview에서 프리셋 미연결 숙제도 이름(접두어) 매칭으로 레이드 그룹 아이콘을 표시하도록 폴백 추가
- 숙제 복제를 단일 RPC로 전환하고 임의 깊이 하위 숙제의 부모 관계를 보존하며 중복 대상 복제를 차단
- 하위 숙제 완료와 상위 숙제 자동 완료를 한 트랜잭션으로 저장
- 임시 멤버/임시 파티의 주차별 참조 충돌을 방지하고, 지난 주 기록은 3주 보존하면서 전역 숙제 연결은 새 주에 즉시 복원
- 임시 파티에서 정규 파티로 멤버를 옮길 때 레이드 숙제 연결이 끊길 수 있던 전이 경로 수정
- 모든 대량 조회에 페이지네이션과 안정적인 보조 정렬을 적용하고, 수요일/일일 06:00 경계의 완료 판정을 통일
- 여러 하위 숙제를 빠르게 완료할 때 늦게 도착한 요청이 상위 숙제를 미완료로 덮던 경쟁 상태를 제거하고, DB가 잠금 후 조상 완료 상태를 다시 계산하도록 수정

### Added

- 7/30/90일 만료와 즉시 철회를 지원하는 공유 링크 관리
- `supabase/migrations/20260813_integrity_and_share_links.sql` 실행형 마이그레이션 추가
- `supabase/migrations/20260813_raid_integrity_followup.sql` 후속 원자성/주차 무결성 마이그레이션 추가
- `supabase/migrations/20260818_parent_task_completion_consistency.sql` 상위 숙제 완료 일관성 마이그레이션 추가

- index.html 무결성 검사 모달에 "미연결 숙제 자동 복구" 버튼 추가 — 이름/난이도가 일치하는 프리셋에 `preset_id` 재연동 (이번 주 임시해제 숙제는 제외)

- Codex 인수인계 문서 세트
- AGENTS.md 기반 AI 작업 규칙
- 두 컴퓨터 작업 워크플로우
- Codex 세션 로그
- DB 마이그레이션 로그
