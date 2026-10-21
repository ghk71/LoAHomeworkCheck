# 2026-10-08 숙제 일괄 관리 적용

## 적용 순서

1. 기존 2026-08-13, 2026-08-18, 2026-10-01 마이그레이션이 적용된 DB에서 진행합니다.
2. Supabase SQL Editor에서 `supabase/migrations/20261008_task_batch_workflow.sql` 전체를 실행합니다. 성공 메시지를 확인합니다.
3. 그 다음 새 `index.html`을 배포하고 새로고침합니다. HTML부터 배포하면 새 RPC가 없어 추가/수정/삭제가 차단될 수 있습니다.
4. `관리 → 숙제 구조 점검`에서 복구 대상을 확인합니다. 캐릭터 숙제 탭에서는 캐릭터 숙제, 계정 숙제 탭에서는 계정 숙제를 검사합니다.
5. 필요한 항목을 선택해 부모 연결을 복구하고 화면을 다시 확인합니다.

이번 작업 환경에서는 Supabase 관리용 연결과 로그인된 대시보드가 없어 실제 운영 SQL 실행은 하지 않았습니다.

## 기존 데이터 처리

- `task_lineage_backup_20261008`에 마이그레이션 이전 숙제 전체 행을 최초 한 번 백업합니다. 재실행해도 원본 백업을 덮어쓰지 않습니다.
- 기존 `id`, `parent_id`, 완료/횟수/휴식/중지/정렬은 마이그레이션에서 변경하지 않습니다.
- 그룹이 없는 루트에는 각각 별도 `clone_group_id`를 부여합니다. 이름만 같은 루트를 하나로 합치지 않습니다.
- 이미 같은 그룹으로 연결된 부모들 아래에서 공통 설정이 완전히 같고 소유자별 중복이 없는 미연결 하위들만 같은 그룹으로 보정합니다. 그 외 하위는 별도 그룹을 부여합니다.
- 잘못 독립 숙제가 된 항목은 정상 하위 숙제와 같은 그룹 ID가 있고 부모 그룹도 하나로 확정되는 경우에만 복구 대상으로 제시합니다. 복구 시 기존 행 ID와 진행은 유지하며, 필요한 부모만 생성합니다.
- 원본 연결 흔적이 없는 동명 항목, 같은 소유자에 같은 그룹이 중복된 항목, 서로 충돌하는 부모 관계는 추측해서 합치지 않습니다. 이 경우 올바른 기준 숙제와 대상 행을 확인한 별도 보정이 필요합니다.
- 새 구성 저장 재시도를 식별하는 `task_batch_requests`는 숙제 데이터가 아니라 요청 기록입니다. 전송 결과를 확인하지 못한 요청을 재시도할 때 중복 생성을 막습니다.

## SQL 확인

```sql
-- 백업 행 수
select table_name, count(*) from task_lineage_backup_20261008 group by table_name;

-- 미리보기만 실행하며 부모 연결을 변경하지 않습니다.
select repair_task_parent_links_atomic(false, false); -- 캐릭터
select repair_task_parent_links_atomic(true, false);  -- 계정

-- 중복 그룹: 자동으로 삭제하거나 합치지 말고 검토합니다.
select character_id, clone_group_id, count(*)
from tasks where clone_group_id is not null
group by character_id, clone_group_id having count(*) > 1;
select account_id, clone_group_id, count(*)
from expedition_tasks where clone_group_id is not null
group by account_id, clone_group_id having count(*) > 1;

-- 다른 소유자의 부모를 가리키는 과거 오류 검사
select c.id, c.name, c.parent_id from tasks c join tasks p on p.id=c.parent_id
where c.character_id is distinct from p.character_id;
select c.id, c.name, c.parent_id from expedition_tasks c join expedition_tasks p on p.id=c.parent_id
where c.account_id is distinct from p.account_id;
```

백업은 자동 롤백 버튼이 아닙니다. 운영 중 추가 편집한 뒤 백업 전체를 덮어쓰면 새 작업을 잃을 수 있으므로, 복구가 필요하면 해당 행/컬럼을 검토한 뒤 선택적으로 복원합니다.

## 로컬 검증

- `tools/test-task-batch.js`: PGlite로 캐릭터/계정 생성, 중첩 하위, 반복 요청, 부모 생성/복구, 진행 보존, 선택 수정/삭제, 실패 롤백, 재실행 보정 검사
- `tools/test-task-batch-ui.js`: Playwright의 격리된 Edge 브라우저에서 검색/선택, 구성 편집, 하위 표시, 복제, 선택 수정/삭제, 재시도와 데스크톱/모바일 검사
- 두 테스트 모두 운영 Supabase에 접속하지 않습니다. 필요한 모듈은 실행 환경의 `NODE_PATH`에서 제공합니다.
- `node tools/check-project.js`는 프로젝트 지침에 따라 실행하지 않습니다.
