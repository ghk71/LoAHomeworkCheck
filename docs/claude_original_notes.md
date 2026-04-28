# 로스트아크 숙제 트래커 — Codex 인수인계 문서

**작성일**: 2026-04-28  
**스택**: HTML/CSS/JavaScript (Vanilla) + Supabase (PostgreSQL) + GitHub Pages  
**규모**: 5개 HTML 파일, ~7,300 라인, 함수 250+개

---

## 1. 프로젝트 개요

로스트아크 유저가 여러 계정·캐릭터의 주간 숙제, 레이드 파티, 골드 수급을 통합 관리하는 웹앱.  
백엔드 없이 **Supabase JS SDK (v2)**를 브라우저에서 직접 호출. 인증 없음, 단일 사용자 전제.

### 핵심 설계 원칙
- **낙관적 UI**: DB 저장 전에 DOM을 먼저 업데이트, 실패 시 toast 알림
- **Fire-and-forget vs await**: 체크박스 토글(빠른 반응)은 fire-and-forget, 골드·파티·임시파티 저장은 반드시 `await`
- **주간 리셋 기준**: 매주 수요일 오전 6시 KST (`getWeekStart()` 함수)
- **localStorage와 DB 분리**: 색상·아이콘 중 레이드명 색상/아이콘은 localStorage, 캐릭터/재화 아이콘은 DB

---

## 2. 파일별 역할

| 파일 | 라인 수 | 역할 |
|------|---------|------|
| `index.html` | 2,316 | 메인 숙제 페이지. 계정/캐릭터/일반숙제/원정대숙제/레이드숙제/재화 CRUD |
| `raid.html` | 2,231 | 레이드 파티 구성(좌) + 주간 일정(우) + 공유링크(뷰어 모드) |
| `core.html` | 926 | 코어정수 현황. 기본/번호별/사용자조합 3가지 뷰 |
| `overview.html` | 906 | 레이드 완료 현황. 전체 캐릭터 카드 그리드, 골드 집계 |
| `parties.html` | 688 | 캐릭터별 파티 목록, 탈퇴, raid.html 연동 이동 |
| `schema.sql` | 226 | Supabase 전체 테이블 정의 (멱등 실행 안전) |

### 페이지 간 데이터 흐름
```
index.html ←──── raid_tasks ────→ overview.html
     ↑              ↓                   ↑
     └── preset_id ─── raid_presets ────┘
                        ↓
              raid_parties → raid_party_members
                        ↓
              raid_schedules → raid_schedule_overrides
```

---

## 3. Supabase 스키마 설명

### 핵심 테이블

#### `accounts`
```
id, name, sort_order, parent_account_id (self-ref), created_at
```
- `parent_account_id`: 부계정 기능. NULL이면 본계정. 본계정 삭제 시 SET NULL.
- UI에서 본계정/부계정 그룹핑은 JS 레벨에서 처리 (DB join 없음)

#### `characters`
```
id, account_id (→accounts), name, class_name, item_level, sort_order,
icon_url (이미지 URL), created_at
```

#### `tasks` (일반·캐릭터 숙제)
```
id, character_id, parent_id (자기참조, 하위숙제), name,
reset_type ('daily'|'weekly'), reset_day (0~6, 3=수요일),
activate_day (null=항상, 0~6=특정요일만), is_completed, last_completed_at,
count_current, count_max, sort_order, icon_url
```

#### `expedition_tasks` (원정대 숙제)
```
tasks와 동일 구조, character_id → account_id로 대체, icon_url
```

#### `raid_tasks` (레이드 숙제 체크리스트)
```
id, character_id, name, difficulty, entry_level, clear_gold, bound_gold, bonus_gold,
is_completed, last_completed_at, reset_day, sort_order,
preset_id (→raid_presets, 파티연동 핵심 컬럼),
receive_gold (bool, 수령 여부, 리셋 안됨),
receive_bonus (bool, 더보기 수령 여부, 리셋 안됨)
```
- **`preset_id`가 핵심**: raid.html 파티와 index.html 레이드숙제를 연결하는 외래키
- `receive_gold/receive_bonus`는 주 리셋 후에도 유지 (골드 계산에서 제외 용도)

#### `raid_presets` (레이드 마스터 데이터)
```
id, name, difficulty, entry_level, clear_gold, bound_gold, bonus_gold,
sort_order, color (미사용, localStorage 우선), icon_url (미사용, localStorage 우선)
```
- **주의**: 색상/아이콘은 DB가 아닌 localStorage에서 관리 (`la_gc_{name}`, `la_gicon_{name}`)
- `name` 필드가 그룹 키 역할 (같은 레이드 다른 난이도 = 같은 name, 다른 id)

#### `raid_parties` (파티)
```
id, preset_id (→raid_presets), name, party_size (4|8),
sort_order, color (파티명 색상, DB 저장)
```

#### `raid_party_members` (파티 슬롯)
```
id, party_id, character_id (ON DELETE SET NULL), slot_index (0-based)
```

#### `raid_schedules` (주간 일정)
```
id, party_id, day_of_week (0~6, 0=일), time_str, is_fixed, sort_order, created_at
```
- `is_fixed=false`인 비고정 일정은 이전 주 초기화 시 자동 삭제

#### `raid_schedule_overrides` ★★★ 가장 복잡한 테이블
```
id, schedule_id, week_start_date (YYYY-MM-DD 형식, 해당 주 수요일),
slot_overrides (JSONB: {"0": "charUUID", "2": null}),
temp_changes (JSONB: {
  "added":   {"charUUID": {"wasNew": bool, "taskId": "uuid"}},
  "removed": {"charUUID": {"taskId": "uuid",  "hadPreset": bool}}
}),
is_completed, completed_at,
UNIQUE(schedule_id, week_start_date)
```
- `slot_overrides`: 슬롯 인덱스 → 캐릭터 UUID (null = 명시적 비움)
- `temp_changes`: 임시파티 역방향 복원을 위한 추적 데이터

#### `character_cores` (코어현황)
```
id, character_id UNIQUE, cores (JSONB), updated_at
```
- `cores` JSONB 키 형식: `{type}_{elementKey}_{slot}` (예: `order_sun_1`, `chaos_moon_3`)
- 값: `{"grade": "ancient", "priority": true, "name": "커스텀이름"}`
- 특수 키: `__combos` (사용자 조합 데이터), `__chaosNames` (혼돈 코어 커스텀 이름)

#### `raid_notices` (주간 공지)
```
id, week_start_date UNIQUE, content, created_at
```

#### `currencies` (재화)
```
id, character_id, name, amount, icon (기존 이모지, 하위호환), 
icon_url (이미지 URL), sort_order, updated_at
```

---

## 4. 구현된 기능 목록

### index.html
- [x] 계정 CRUD + DnD 순서변경 + 숨김/표시
- [x] **부계정 설정** (parent_account_id) — 수정 모달에서 체크박스
- [x] 캐릭터 CRUD + 아이콘 설정 + 탭 DnD + 완료 시 초록 탭
- [x] 상위/하위 숙제 (parent_id), 활성화 요일 (activate_day)
- [x] 원정대 숙제 📋 복제 (다른 계정, 본계정/부계정 그룹으로 표시)
- [x] **일괄 삭제** (원정대/캐릭터 숙제 — 다른 계정/캐릭터의 동명 숙제 선택)
- [x] 레이드 숙제 추가 (raid_presets 팝업, 캐릭터 레벨 필터)
- [x] **골드 3분리 표시**: 💰 유통 / 귀속 / 더보기 각각
- [x] **골드 수령 토글**: 클릭으로 receive_gold/receive_bonus 변경, 취소선 표시
- [x] **🔗 파티연동 팝업**: 슬롯 멤버 + 일정 요일 + 캐릭터 아이콘 + 현재 캐릭터 금색 강조
- [x] 재화 현황 — 아이콘(이미지), 금액 조정, 마지막 수정일(YYYY.MM.DD)
- [x] 섹션별 아이콘 (localStorage: `la_icon_exp`, `la_icon_raid`, `la_icon_curr`, `la_icon_daily`)
- [x] 이미지 피커 모달 (GitHub API → images/ 폴더 탐색, sessionStorage 캐시)
- [x] 성능 최적화: `scheduleRenderArea`/`scheduleRenderTabs` → RAF 배치 렌더링
- [x] DOM partial update: `applyDoneToEl`, `updateParentDOM`, `updateTabDOM`

### raid.html
- [x] 레이드 목록 3단계 계층: 그룹(localStorage) → 난이도(DB) → 파티(DB)
- [x] 모든 DnD: 그룹 순서(localStorage), 난이도/파티/일정(DB sort_order)
- [x] **레이드명 색상/아이콘**: localStorage `la_gc_{name}`, `la_gicon_{name}` — 추가/수정 모달
- [x] **파티 색상**: DB `raid_parties.color` — 파티 추가/수정 모달
- [x] **난이도 텍스트 색상**: 나이트메어=보라/3단계, 하드=황갈/2단계, 노말=회색/1단계
- [x] `syncRaidTask`: 파티 슬롯 배치 시 raid_task 자동 생성/연동 (preset_id 세팅)
- [x] **임시파티 시스템** (전면 재설계 — 아래 §5 상세)
- [x] `toggleCompletion`: 완료 시 임시파티 포함 모든 유효 멤버 raid_tasks 업데이트
- [x] `autoResetNonFixed`: 이전 주 비고정 일정 삭제 + temp_changes 역방향 복원
- [x] 공지: 주별 저장, 미리 쓰기(8주), 뷰어 모드에서 읽기 전용 표시
- [x] **슬롯 강조 시스템** (필터가 아님): 선택 캐릭터 슬롯 금색 하이라이트, localStorage 저장
- [x] **날짜 묶기**: localStorage `la_day_groups_perm` (영구) + `la_day_groups_WEEKKEY` (주별 override)
- [x] **cross-day DnD**: 날짜 경계를 넘는 일정 드래그앤드롭, day_of_week DB 업데이트
- [x] **공유링크(뷰어 모드)**: URL param에 btoa(JSON) 형태로 Supabase 크리덴셜 인코딩
  - 상단 nav 완전 숨김
  - "📅 주간 일정 | 📊 레이드 현황" 탭 전환
  - 레이드 현황 탭: 체크 불가, 인라인 렌더링
  - 슬롯 강조 필터 초기 전체 해제
- [x] 파티 구성: 본계정/부계정 그룹핑된 캐릭터 피커
- [x] parties.html에서 "파티로 이동" 시 `la_open_party_id` localStorage → `autoOpenParty()`

### core.html
- [x] 1700+ 캐릭터만 표시
- [x] 보기 모드 3가지: 기본(renderBasic) / 번호별 묶음(renderNumbered) / 사용자 조합(renderCombo)
- [x] **기본 탭 = 무조건 사용자 조합** (`let viewMode='combo'` 하드코딩, localStorage 무관)
- [x] 등급 순환: 좌클릭 (none→hero→legend→relic→ancient→none), 우클릭=skip(검정)
- [x] ⭐ 필수 표시 토글
- [x] 코어 이름 직접 입력 (input.core-name-input)
- [x] 혼돈 코어 행 이름 클릭 편집 (`promptChaosName` → `__chaosNames` JSONB에 저장)
- [x] 질서 해/달/별 구분선 (6px 파란 강조선)
- [x] 섹션 접기/펼치기 (localStorage `la_core_collapsed`)
- [x] 코어 행 숨김 🙈 (localStorage `la_core_hidden`)
- [x] 잠금 🔒 (localStorage `la_core_locked`) — 잠금 시 전체 편집 비활성
- [x] 사용자 조합: 캐릭터별 해/달/별 번호 지정, character_cores에 `__combos` 저장
- [x] debounce 자동 저장 (500ms)
- [x] 캐릭터 헤더에 아이콘 표시

### overview.html
- [x] **부계정 그룹 섹션**: 본계정 섹션 + "겊삶-부계정" 별도 섹션
- [x] 섹션 헤더: 완료수 + 진행바 + 유통골드/귀속골드 표시
- [x] 캐릭터 카드: 아이콘 + 올클 시 초록 테두리
- [x] 레이드 행: 레이드명(색상)+난이도 한 줄, 캐릭터 아이콘
- [x] **🔗 파티연동 클릭**: 별도 동적 생성 모달 (`showOvPartyPopup`)
- [x] 체크박스 `await` DB 저장 (과거 버그 수정)
- [x] 캐릭터 필터: 본계정/부계정 그룹, localStorage, 접기/펼치기
- [x] 주차 이동 (이전/다음/이번 주)
- [x] 요약바: 유통골드/귀속골드 별도 표시, 초기화 카운트다운

### parties.html
- [x] 캐릭터 필터: 본계정/부계정 그룹
- [x] 파티 카드: 레이드명(색상), 파티명(색상), 난이도(색상), **일정 요일 표시**
- [x] 슬롯: 캐릭터 아이콘 + 본인 슬롯 금색 강조
- [x] **🗡️ 파티로 이동**: `la_open_party_id` localStorage → raid.html `autoOpenParty()`
- [x] **탈퇴**: raid_party_members 삭제 + 연동 raid_tasks 삭제

---

## 5. 중요한 함수/로직 설명

### 주간 리셋 계산 (raid.html)
```javascript
// 핵심: 수요일 오전 6시 KST 기준
function getWeekStart(off=0){
  const kst = new Date(now + 9*3600000);
  let b = (kst.getUTCDay()-3+7)%7; // 수요일=0, 목요일=1, ...
  if(b===0 && kst.getUTCHours()<6) b=7; // 수요일 6시 이전이면 이전 주
  // off: 0=이번주, -1=지난주, +1=다음주
}
// 주 키: "2025-04-22" 형식 (해당 주 수요일 날짜)
function getWeekKey(off=0){ ... }
```
**주의**: index.html에는 별도의 `getLastResetUTC()` 함수가 있고, 이것은 `reset_day` 파라미터를 받아 다른 요일 초기화도 지원함.

### 효과적인 파티 멤버 계산 (raid.html)
```javascript
function getEffectiveMembers(schId, partyId, wk){
  // 1. 원본 파티 멤버 조회
  const members = parties.find(p=>p.id===partyId)?.members || [];
  const ovr = overrides[schId+'_'+wk];
  // 2. slot_overrides 적용 (null = 명시적 비움)
  return slots.map((slot,i) => {
    if(ovr && String(i) in (ovr.slot_overrides||{})){
      const cid = ovr.slot_overrides[String(i)];
      return {...slot, character_id:cid, isOvr:true}; // null도 isOvr:true
    }
    return slot;
  });
}
```
**중요**: `null` 값을 slot_overrides에서 **키가 존재**하는 것으로 처리. `delete`가 아님.

### 임시파티 시스템 (raid.html)
임시 추가 시 (`assignOverrideChar`):
1. 해당 캐릭터에 preset 레이드가 있으면 → `preset_id` 연동만 세팅
2. 없으면 → `raid_tasks` 새로 생성 + `preset_id` 세팅
3. `temp_changes.added[charId] = {wasNew, taskId}` 기록

임시 삭제 시 (`removeOvrSlot`):
- 임시 추가된 캐릭터 삭제 → `revertTempAdd` 호출 (wasNew이면 삭제, 아니면 preset_id 해제)
- 원본 파티원 삭제 → `preset_id = null` (raid_task는 유지), `temp_changes.removed[charId]` 기록

주 초기화 (`autoResetNonFixed`):
- 이전 주 overrides의 `temp_changes` 읽어 역방향 복원
- `added` → 원상 복구 (삭제 or preset_id 해제)
- `removed` → `preset_id` 재연결

### 완료 처리 (`toggleCompletion`)
```
1. ovr.is_completed 토글 → DOM 즉시 업데이트
2. DB: raid_schedule_overrides.is_completed 업데이트
3. getEffectiveMembers()로 실제 참여 멤버 확인 (임시 포함)
4. preset_id 기준으로 해당 멤버들의 raid_tasks 일괄 업데이트
5. fallback: preset_id 없으면 이름 ILIKE로 검색
```

### 색상/아이콘 헬퍼 (공통)
```javascript
getGroupColor(name)  // localStorage 'la_gc_{name}' → 기본 '#4caf50'
getGroupIcon(name)   // localStorage 'la_gicon_{name}' → 기본 ''
getPartyColor(p)     // p.color || '#e0ddd5'
diffClass(d)         // 난이도 문자열 → CSS 클래스명
iconImg(url, cls)    // url이 있으면 <img> 태그, 없으면 ''
```

### 이미지 피커 (공통, 모든 파일에 삽입)
```javascript
// GitHub API로 폴더 탐색
const ICON_REPO = 'ghk71/LoAHomeworkCheck';
const ICON_RAW = `https://raw.githubusercontent.com/${ICON_REPO}/main/`;
// 폴더 목록은 sessionStorage에 캐시 ('la_ic_'+path)
openImagePicker(callback, path='images/')
```

---

## 6. 과거 버그와 수정 내역

| 버그 | 원인 | 수정 방법 |
|------|------|-----------|
| **overview 체크 DB 미저장** | `sb.from().update()` 앞에 `await` 누락 (Supabase v2에서 await 없으면 쿼리 미실행) | 모든 DB 저장에 `await` 명시 |
| **toggleReceiveGold ReferenceError** | 함수 정의 누락 (이전 수정에서 삽입 위치 오류) | 올바른 위치에 함수 재삽입 |
| **임시 슬롯 삭제 모달 미갱신** | `removeOvrSlot`이 DB 저장 후 모달을 갱신 안 함 | `removeOvrSlot` → `openSchEdit` 재호출 래퍼 추가 |
| **아코디언 버그** | `togglePreset` 함수가 `selPartyId` 체크 없이 `selPresetId`만 비교 | 파티 선택 상태도 확인 후 닫힘 처리 |
| **난이도 DnD 버블링** | `rdStart`에서 `e.stopPropagation()` 누락 | 추가 |
| **임시 추가 페이지 이동 후 소실** | `overrideSlot`에서 DB `await` 없음 | `persistOverride()` 함수로 분리, 항상 `await` |
| **overview/parties 피커 레이아웃 깨짐** | `.overlay` CSS 미삽입 (파일에 모달 공통 CSS 없음) | 각 파일에 `.overlay`/`.modal` CSS + `openModal`/`closeModal` 함수 추가 |
| **레이드 아이콘 목록 미표시** | 추가 시 `_rnIconUrl` 미초기화 / `gPresets[0]?.icon_url` 잘못된 소스 참조 | `openAddPreset`에서 `_rnIconUrl=null` 초기화, `getGroupIcon(gname)` 일관 사용 |
| **코어 기본탭 사용자조합 아닌 기본** | `localStorage.getItem('la_core_view')` 값이 'basic'으로 저장된 상태 지속 | `let viewMode='combo'` 하드코딩 (localStorage 완전 무시) |
| **cross-day DnD 타입 충돌** | `sch_3`, `sch_4` 날짜별 타입으로 날짜 간 이동 불가 | `'sched'` 단일 타입 + `{schId, srcDn, srcIdx}` 구조체로 통일 |
| **공유링크 공지 미표시** | 뷰어 모드에서 `notice-input`은 숨겼지만 `notice-display` span 없음 | 별도 `#notice-display` span 추가, `loadNotice()`에서 내용 채움 |

---

## 7. 아직 불안정한 기능

### 🔴 높은 위험도
1. **임시파티 temp_changes 복원 로직**  
   - `autoResetNonFixed`에서 이전 주 temp_changes를 읽어 복원하는 로직은 **아직 실제 환경 테스트 미완**
   - `temp_changes` 컬럼이 schema에 없으면 silent fail 발생 가능
   - **반드시 SQL 실행 후 테스트**: `ALTER TABLE raid_schedule_overrides ADD COLUMN IF NOT EXISTS temp_changes JSONB DEFAULT '{}'`

2. **뷰어 모드 레이드 현황 탭**  
   - `loadViewerOverview()` 함수가 raid.html 내부의 `getGroupColor`, `diffClass`에 의존
   - 이 함수들이 `applyViewer()` 호출 이전에 정의되어 있어야 함 (현재 순서 확인 필요)

### 🟡 중간 위험도
3. **GitHub API Rate Limit**  
   - 비인증 요청: 60회/시간. 이미지 피커를 빠르게 여러 번 열면 429 발생
   - sessionStorage 캐시로 완화하지만, 캐시 만료(탭 닫기) 후 재호출 시 발생 가능
   - 에러 처리: `if(!r.ok)` → "폴더를 불러올 수 없습니다" 메시지만 표시, 재시도 없음

4. **혼돈 코어 이름 다중 캐릭터 처리**  
   - 현재 `getChaosName(charId, type, ek, slot)` 첫 번째 인자가 `vis[0]?.id`
   - 즉, **첫 번째 표시 캐릭터의 이름**을 모든 캐릭터에 표시
   - 본래 캐릭터별로 달라야 하는지 여부가 불명확 (스펙 확인 필요)

5. **날짜 묶기(공유링크 동기화)**  
   - localStorage 기반이므로 뷰어(공유링크)와 편집자가 다른 기기면 다르게 보임
   - 공유링크에서 묶기 버튼은 표시되지 않으므로 편집 불가, 편집자 설정 그대로 보임

### 🟢 낮은 위험도
6. **재화 아이콘 이모지 하위호환**  
   - 기존 재화는 `icon` 컬럼에 이모지 저장, 신규는 `icon_url`에 이미지 URL 저장
   - 렌더링: `icon_url` 우선, 없으면 `icon` 이모지 표시 (현재 코드에서 혼재)

---

## 8. 절대 바꾸면 안 되는 것

### DB 스키마
1. **`raid_schedule_overrides.week_start_date` 형식**: `YYYY-MM-DD` 문자열 (해당 주 수요일)  
   - `UNIQUE(schedule_id, week_start_date)` 제약 의존
   - `getWeekKey(off)` 함수가 이 형식으로 생성

2. **`slot_overrides` JSONB 키**: 슬롯 인덱스를 **문자열**로 저장 (`String(i)`)  
   - `"0"`, `"1"`, ... — 숫자 키로 바꾸면 `String(i) in obj` 체크 깨짐

3. **`temp_changes` JSONB 구조**:
   ```json
   {
     "added":   {"charUUID": {"wasNew": boolean, "taskId": "uuid"}},
     "removed": {"charUUID": {"taskId": "uuid", "hadPreset": boolean}}
   }
   ```

4. **`character_cores.cores` JSONB 키 형식**: `{type}_{elementKey}_{slot}`
   - `order_sun_1` ~ `order_sun_6`, `chaos_moon_1` ~ `chaos_moon_6` 등
   - 특수 키: `__combos`, `__chaosNames` (이중 언더스코어 prefix)

### 비즈니스 로직
5. **주 리셋 기준 수요일 6시 KST 절대 유지**  
   - `getWeekStart()`의 `b=(kst.getUTCDay()-3+7)%7` 계산식
   - 이것을 바꾸면 모든 주차 데이터 키가 틀어짐

6. **`preset_id` = 파티↔레이드숙제 연결 외래키**  
   - `raid_tasks.preset_id` → `raid_presets.id`
   - 이 연결이 완료 처리, 파티 탈퇴, 임시파티 추가/삭제 전체에 사용됨
   - ON DELETE SET NULL — 프리셋 삭제 시 연동 해제 (이벤트 없음)

7. **Supabase v2 `await` 필수**  
   - `sb.from().update().eq()` 체인에 `await` 없으면 쿼리 실행 안 됨 (v2 SDK 특성)
   - 성능상 빠른 업데이트는 fire-and-forget도 허용하지만, **파티/임시파티/골드 저장은 반드시 await**

### CSS/디자인
8. **CSS 변수명** (공통 디자인 시스템):
   - `--gold`, `--gold-text`, `--green`, `--surface-1~4` 등은 모든 파일 공통
   - 변경 시 5개 파일 전체 영향

9. **`.overlay.open` / `openModal(id)` 패턴**  
   - 모든 모달이 이 패턴으로 제어됨, 변경 시 전체 모달 파괴

### localStorage 키 (변경 시 기존 설정 전체 소실)
```
la_url, la_key          → Supabase 연결 정보
la_gc_{name}            → 레이드명 색상
la_gicon_{name}         → 레이드명 아이콘
la_raid_group_order     → 레이드 그룹 순서
la_raid_groups          → 추가 그룹명 목록
la_core_view            → 코어 보기 모드 (현재 무시됨)
la_core_collapsed       → 코어 섹션 접기 상태
la_core_hidden          → 숨긴 코어 행
la_core_locked          → 잠금 상태
la_ov_collapsed         → overview 섹션 접기
la_ov_sel_chars         → overview 캐릭터 필터
la_pt_sel_chars         → parties 캐릭터 필터
la_sch_highlight        → 일정 슬롯 강조 상태
la_sch_filter_v         → 뷰어 모드 슬롯 강조
la_day_groups_perm      → 날짜 묶기 영구 설정
la_day_groups_{key}     → 날짜 묶기 주별 override
la_open_party_id        → parties→raid 파티 이동 임시 저장
la_viewer_name          → (삭제됨, 현재 미사용)
la_ic_{path}            → 이미지 피커 폴더 캐시 (sessionStorage)
```

---

## 9. 테스트 시나리오

### STEP 0: 환경 설정
```sql
-- Supabase SQL Editor에서 실행 (schema.sql 전체)
-- 특히 신규 컬럼 확인:
SELECT column_name FROM information_schema.columns 
WHERE table_name='raid_schedule_overrides' AND column_name='temp_changes';
-- 없으면: ALTER TABLE raid_schedule_overrides ADD COLUMN IF NOT EXISTS temp_changes JSONB DEFAULT '{}';
```

### STEP 1: 부계정 설정
1. index.html → 계정 "겊삶" 추가
2. 계정 "있윳" 추가 → ✏️ → 부계정 체크 → 본계정 "겊삶" 선택
3. **검증**: 각 페이지 필터에서 "겊삶" 행 + "겊삶-부계정" 행 분리 표시

### STEP 2: 레이드 설정 (색상/아이콘)
1. raid.html → 파티구성 탭 → `+ 레이드 추가` → "에기르 익스트림" → 색상 선택 → 아이콘 선택(images/ 폴더)
2. `+난이도` → "나이트메어"
3. `＋파티 추가` → "나기르 1파" → 색상 선택
4. **검증**: 
   - 목록에 아이콘+색상 표시
   - "나이트메어" 텍스트 보라색
   - `localStorage.getItem('la_gc_에기르 익스트림')` 값 확인

### STEP 3: 임시파티 핵심 테스트
1. 주간 일정 탭 → 일정 추가 (나기르 1파, 목요일)
2. 일정 카드 ✏️ → 임시 편집 모달
3. **임시 추가**: 빈 슬롯 클릭 → "있윳" 선택
   - 검증: 슬롯에 "임시추가" 뱃지
   - `index.html` 새로고침: 있윳에 "에기르 익스트림" raid_task 존재, preset_id 세팅됨
4. **임시 삭제 (원본 파티원)**: 원본 멤버 슬롯 ✕
   - 검증: 해당 캐릭터 raid_task는 유지되지만 preset_id = null
5. **완료 버튼**: "○ 완료" 클릭
   - 검증: 임시 추가 "있윳" 포함 모든 유효 멤버 raid_tasks 완료 처리
   - `index.html` → 있윳 레이드 체크됨
6. **원본 초기화**: ↩ 버튼
   - 검증: 있윳 슬롯 제거, 원본 멤버 슬롯 복원
   - `index.html` → 있윳 레이드 삭제됨, 원본 멤버 preset_id 복원

### STEP 4: 공유링크 테스트
1. 🔗 공유 버튼 → URL 복사 → 새 탭
2. **검증**:
   - 상단 nav 없음
   - "📅 주간 일정 | 📊 레이드 현황" 탭 표시
   - 슬롯 강조 필터 초기 선택 없음
   - 레이드 현황 탭: 체크 클릭해도 반응 없음
   - 일정 카드에 레이드명 아이콘 표시

### STEP 5: overview 완료 연동 확인
1. overview.html → 레이드 카드 체크박스 클릭
2. `index.html` 새로고침 → 해당 캐릭터 레이드 완료 체크 확인
3. **역방향**: index.html에서 체크 → overview.html 새로고침 → 체크됨

### STEP 6: parties.html → raid.html 이동
1. parties.html → 파티 카드 → "🗡️ 파티로 이동"
2. **검증**: raid.html이 파티구성 탭으로 열리면서 해당 파티 자동 선택

### STEP 7: core.html 혼돈 이름 편집
1. core.html → 기본 탭 → 혼돈 해 섹션의 "혼돈해1" 텍스트 클릭
2. prompt에서 새 이름 입력
3. 새로고침 → **검증**: 변경된 이름 유지 (DB 저장)

---

## 10. Codex에게 줄 작업 지시문

```
당신은 이 로스트아크 숙제 트래커 프로젝트를 이어받아 개발합니다.

=== 기술 스택 ===
- 순수 HTML/CSS/JavaScript (프레임워크 없음)
- Supabase JS SDK v2 (브라우저 직접 호출, `await` 필수)
- GitHub Pages 배포

=== 절대 준수 사항 ===
1. 모든 Supabase DB 쓰기에 `await` 명시 (누락 시 쿼리 미실행)
2. `getWeekStart()` / `getWeekKey()` 함수 로직 변경 금지 (수요일 6시 KST 기준)
3. `slot_overrides` JSONB 키는 반드시 문자열 (`String(i)`) 사용
4. `character_cores.cores` JSONB 키 형식 `{type}_{elementKey}_{slot}` 유지
5. localStorage 키명 변경 금지 (기존 사용자 설정 소실)
6. `.overlay.open` / `openModal(id)` 모달 패턴 유지
7. CSS 변수 `--gold`, `--surface-*`, `--green` 등 공통 변수 유지

=== 코드 수정 시 주의 ===
- 한 파일 수정 시 다른 파일에서 동일 함수 중복 정의 여부 확인
  (getGroupColor, diffClass, iconImg, esc 등은 파일별로 각각 정의되어 있음)
- 임시파티 관련 코드(assignOverrideChar, removeOvrSlot, persistOverride, 
  revertTempAdd, autoResetNonFixed)는 단위 테스트 후 변경
- Supabase 쿼리 추가 시 해당 컬럼이 schema.sql에 있는지 먼저 확인
- 새 기능의 localStorage 키는 `la_` prefix로 통일

=== 현재 우선 수정 필요 항목 ===
1. temp_changes SQL 컬럼 실제 적용 확인 및 autoResetNonFixed 실환경 테스트
2. 혼돈 코어 이름이 첫 번째 캐릭터 기준으로만 적용되는 문제 — 캐릭터별 독립 이름 필요
3. 이미지 피커 GitHub API Rate Limit 대응 (토큰 입력 UI 또는 더 적극적인 캐싱)
4. currencies 테이블의 icon_url 컬럼이 없는 기존 설치에서의 재화 아이콘 에러 처리

=== 기능 추가 시 체크리스트 ===
□ Supabase 컬럼 추가 필요한가? → schema.sql ALTER TABLE 추가
□ localStorage 키 새로 사용하는가? → 인수인계 문서 §8에 추가
□ 완료 처리/파티 연동에 영향 있는가? → toggleCompletion, syncRaidTask 검토
□ 주간 리셋에 역방향 복원이 필요한가? → autoResetNonFixed에 로직 추가
□ 5개 파일 중 여러 파일에서 동일 기능이 필요한가? → 각 파일에 독립 구현 (번들러 없음)
```

---

## 부록: 빠른 참조

### DB 쿼리 패턴
```javascript
// 항상 await (Supabase v2)
const {data, error} = await sb.from('table').select('*').eq('id', id).single();
await sb.from('table').update({field: val}).eq('id', id);
await sb.from('table').insert({...}).select().single(); // .select()로 반환값 받기
await sb.from('table').delete().eq('id', id);
```

### 주요 상태 변수 (raid.html)
```javascript
let schedules   = [];  // 로드된 전체 일정
let overrides   = {};  // {schId+'_'+wk: {id, slot_overrides, temp_changes, is_completed}}
let parties     = [];  // p.members도 포함
let raids       = [];  // raid_presets
let allChars    = [];  // 전체 캐릭터
let accounts    = [];
let weekOffset  = 0;   // 0=이번주, -1=지난주
let selGroupName, selPresetId, selPartyId; // 파티 구성 선택 상태
```

### 주요 상태 변수 (index.html)
```javascript
const S = {
  accounts: [], characters: {}, // {accountId: [chars]}
  tasks: {}, expTasks: {}, raidTasks: {}, // {charId or accId: [tasks]}
  currencies: {}, customPopups: {},
  presetsCache: {}, // {presetId: {name}}
  selAcc: null, selChar: null,
  currPopupId: null,
  expCollapsed: false, raidCollapsed: false, ...
};
```