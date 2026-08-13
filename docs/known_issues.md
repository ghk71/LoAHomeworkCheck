# Known Issues

현재 코드 점검에서 재현 가능한 미해결 기능 버그는 남아 있지 않다.

## 운영 확인 사항

- `supabase/migrations/20260813_integrity_and_share_links.sql`과 `supabase/migrations/20260813_raid_integrity_followup.sql`을 순서대로 적용해야 최신 원자적 RPC가 동작한다.
- `create-share-link`, `resolve-share`, `send-homework-discord`는 최신 소스로 재배포해야 한다.
- 실제 Supabase 적용 전에는 RPC 트랜잭션, 링크 만료/철회, 삭제 트리거를 브라우저에서 끝까지 검증할 수 없다.
- 새 문제가 재현되면 증상, 재현 순서, 콘솔 오류, 관련 행의 ID와 주차 키를 이 문서에 추가한다.
