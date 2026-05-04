# 로스트아크 숙제 — index.html 변경 인계 문서

이 문서는 작업 컨텍스트가 없는 다음 작업자(예: codex)가 변경 사항을 빠르게 파악하기 위한 인계 자료입니다. 원본은 사용자가 가지고 있던 두 개의 index.html (구 버전 = `index_old.html`, 신 버전 = `index.html`)이며, 이 문서의 모든 작업은 신 버전 위에서 이뤄졌습니다.

## 1. 작업 환경 한눈에

- **기술 스택**: 단일 파일 SPA. HTML + Vanilla JS + Supabase JS SDK (CDN). 정적 호스팅 (GitHub Pages).
- **백엔드**: Supabase (`la_url`, `la_key`를 localStorage에 저장. 사용자가 직접 입력).
- **시간 기준**: 한국 표준시(KST). 내부적으로 모든 reset/계산은 UTC로 처리하되 06:00 KST = 21:00 UTC를 경계로 사용.
- **주요 테이블**: `accounts`, `characters`, `tasks`, `expedition_tasks`, `raid_tasks`, `currencies`, `custom_popups`, `raid_presets`, `raid_parties`, `raid_party_members`, `raid_schedules`, `raid_schedule_overrides`, `raid_group_settings`.

## 2. 파일 구조 (작업 디렉토리)

```
repo/
├── index.html                                  # 메인 페이지 (이번 작업 대상)
├── images/
│   ├── <카테고리>/*.png                          # 이미지 자산 (1단계 깊이)
│   └── index.json                              # 자동 생성됨 — 직접 편집 금지
├── scripts/
│   └── generate-image-index.js                 # 인덱스 빌드 스크립트
└── .github/workflows/
    └── build-image-index.yml                   # 인덱스 자동 갱신 워크플로
```

## 3. 변경 이력 — 무엇을, 왜 바꿨나

### 3.1. 아이콘 picker를 정적 인덱스 방식으로 전환

**배경**: 기존 picker는 GitHub Contents API(`api.github.com/repos/.../contents/...`)를 직접 호출해 폴더 트리를 탐색했음. 이 API는 인증되지 않은 요청에 대해 IP당 시간당 60회로 제한되며, GitHub Pages처럼 정적 배포 환경에서는 사용자가 늘면 거의 항상 한도가 차서 폴더가 안 보이는 증상이 발생.

**해결 방식 (옵션 A)**: 빌드 단계에서 `images/index.json`을 미리 만들어 두고, 런타임에는 이 정적 JSON 한 번만 fetch. API 호출 0회.

**index.json 구조** (1단계 깊이 기준):
```json
{
  "<카테고리명>": ["파일1.png", "파일2.png", ...],
  ...
}
```

**관련 파일/코드**:
- `scripts/generate-image-index.js`: `images/` 직속 하위 폴더만 카테고리로 인식, 이미지 확장자(png/jpg/jpeg/gif/webp/svg)만 포함, 한글 가나다 정렬, 파일 변경 없으면 쓰지 않음(불필요한 commit 방지).
- `.github/workflows/build-image-index.yml`: `images/**` 경로 변경 시(단 `images/index.json` 변경은 제외) + 스크립트/워크플로 자체 변경 시 자동 실행. `[skip ci]` commit으로 자체 트리거 루프 방지. `permissions: contents: write` 필요.
- `index.html` 내 picker 관련 변수/함수:
  - `IMAGE_INDEX_URL = 'images/index.json'`
  - `IMAGE_BASE = 'images/'`
  - `imageIndex` (모듈 스코프 캐시)
  - `ensureImageIndex()`: cache-busting 쿼리스트링 포함 fetch 1회
  - `renderPickerRoot()`, `renderPickerCategory(cat)`: 카테고리 → 파일 2단계 네비게이션
  - 모든 GitHub Contents API 호출 코드 제거됨 (`ICON_REPO`, `ICON_RAW`, `ICON_API` 모두 삭제)

**저장되는 icon URL 형식**: `images/카테고리/파일.png` (상대 경로). 이전에 절대 URL(`https://raw.githubusercontent.com/...`)로 저장된 값은 그대로 동작함 — 마이그레이션 불필요.

**한글 폴더/파일명**: `encodeURI`로 픽커에서 인코딩됨. 안전.

### 3.2. ⚙️ 설정 모달 추가 (DB/테스트 날짜)

**배경**: `index_old.html`에는 우측 상단 ⚙️ 버튼으로 여는 설정 모달이 있었으나, 신 버전에서 누락되어 한 번 입력한 Supabase 연결을 변경할 수 없고 테스트 기준 날짜(`la_test_now`)도 UI 없이 코드만 살아있는 상태였음.

**구현**:
- 상단바 도구 영역에 `⚙️` 버튼 추가 (새로고침 옆).
- `modal-settings` 모달: Supabase URL, Anon Key (password type), 테스트 기준 날짜 (`<input type="datetime-local">`), "현재 날짜" 버튼, "연결 해제" (danger), 저장.
- 신규 함수: `openSettings()`, `saveSettings()`, `clearTestDate()`, `clearConfig()`, `toLocalDateTimeValue(ms)`.
- `updateClock()`: `la_test_now`가 설정돼 있으면 시계 옆에 `· 테스트` 표시.

**중요**: `appNow()`/`appNowIso()` 함수는 신 버전에 이미 있었음. 코드 곳곳(완료 시각 기록, 주간 reset 계산 등)에서 이 함수를 사용 중이라 UI만 노출시키면 즉시 동작.

**저장 동작**: `saveSettings()`는 `location.reload()`을 호출 — 새 설정으로 앱 재시작.

### 3.3. 휴식 게이지 자동 충전/소모 로직 복원 (06:00 KST 기준)

**배경**: 휴식 게이지(`rest_enabled` 숙제)는 데이터 모델은 멀쩡한데 자동 충전/소모 로직이 빠져 있어 매 reset boundary마다 게이지가 안 움직였음. 구 버전의 `autoReset` 함수가 통째로 누락된 상태였음.

**휴식 게이지 의미** (이 코드베이스의 mental model):
- 매 reset 경계(daily 숙제는 매일 06:00 KST, weekly는 요일별 06:00 KST, monthly는 1일 06:00 KST)마다:
  - 직전 사이클에 클리어 안 했으면 → `rest_charge`만큼 충전 (max는 `rest_max`)
  - 직전 사이클에 클리어 했으면 → `rest_consume`만큼 소모
- `rest_threshold` 도달 시 활성 표시 (`isActive`에서 사용)
- `rest_last_processed_at`: 마지막으로 자동 처리한 reset 경계 시각. 이게 있어야 여러 사이클이 한꺼번에 지났을 때 (예: 며칠 만에 접속) 그 사이의 모든 경계를 빼먹지 않고 처리.

**추가된 함수**:
- `getResetBoundariesSince(t, latest)`: `rest_last_processed_at`(없으면 created_at - 1초) 이후 `latest`까지의 모든 reset 경계를 시간순으로 반환. 무한 루프 방지를 위해 62회로 cap.
- `autoResetTasks(list, table)`: 휴식 게이지 처리 + 만료된 `is_completed` 상태 정리. boundary마다 `staleCompleted`인지 아닌지로 충전/소모를 판정.
- `autoResetRaidList(list)`: 레이드 숙제(주간 단위)의 만료된 완료 상태만 풀어줌.

**호출 위치**: `loadAccountData()` 안에서 각 `tasks`/`expedition_tasks`/`raid_tasks` fetch가 끝나는 즉시 자기 리스트에 대해 호출. 따라서 페이지 로드, 새로고침, 계정 전환, 액션 모드 종료 등 모든 데이터 재로드 흐름에서 자동 동작.

**테스트 방법**:
1. 휴식 게이지 숙제 만들기 (max 100, charge 10, consume 20)
2. 며칠 동안 클리어 안 함
3. 설정 → 테스트 기준 날짜를 며칠 뒤로 설정 → 저장 → 새로고침
4. 게이지가 그만큼 충전되어 있어야 함
5. 반대로 클리어한 상태에서 며칠 뒤로 설정하면 소모되어야 함

### 3.4. 파티 연동 정보 팝업 복원

**배경**: 신 버전에서 레이드 숙제의 파티 연동 정보가 정적 badge(`link-badge`)로만 표시되고 클릭 불가. 구 버전에는 클릭하면 어느 파티에 누가 들어있는지 보여주는 모달이 있었으나 누락됨.

**복원**:
- `modal-party-link` 모달 추가 (대상: ID `party-link-content`).
- `showPartyLinkPopup(presetId, taskId, charId)` 함수 추가 — 구 버전 로직을 신 버전 state 구조(`state.raidTasks`, `state.tempRaidTaskIds`, `state.tempRemovedPresetByTask`, `state.raidGroupSettings`)에 맞게 재작성.
- 표시 내용:
  - 레이드 프리셋 정보 (이름/난이도/입장레벨)
  - 해당 캐릭터가 속한 파티 카드들 (요일/파티 인원/멤버 슬롯/파티 이동 링크 `raid.html?party=<id>`)
  - 임시 파티 연동인 경우 시각적으로 구분 (`temp` 클래스, 골드 톤)
- `raidRow`의 link-badge에 `onclick="showPartyLinkPopup(...)"` 와 `cursor:pointer` 추가, `event.stopPropagation()`으로 행 클릭 이벤트와 분리.
- 관련 CSS: `.party-link-preset`, `.party-link-card`, `.party-link-card-head`, `.party-link-slots`, `.party-link-slot`, `.party-link-slot.me` 추가.

### 3.5. 재화 최종 수정 날짜 pill

**배경**: 구 버전에는 재화 섹션 헤더에 "최종 수정 날짜: YYYY.MM.DD"라는 pill 표시가 있었음. 신 버전에서 누락.

**구현**:
- `getLatestCurrencyUpdated(list)`: `updated_at` 중 최신 ISO 문자열 반환.
- `fmtRelDate(iso)`: `YYYY.MM.DD` 형식 변환.
- `renderDailyCard`의 재화 섹션 헤더에 인라인 IIFE로 표시. 재화가 없거나 `updated_at`이 없으면 표시 안 됨.
- 새 CSS 클래스: `.curr-updated` (작은 pill 스타일).

### 3.6. Enter 키로 모달 저장 (전역)

**배경**: 모달 입력 후 Enter로 저장하는 키보드 단축키가 신 버전에 없었음 (Esc는 닫기만 동작).

**구현**: 기존 keydown 핸들러를 확장.
- Esc: 열린 모달 모두 닫기 (기존 동작 유지)
- Enter: 다음 조건일 때 현재 열린 모달의 primary 버튼을 클릭한 것과 동일하게 처리:
  - `e.target`이 textarea/select가 아니어야 함 (멀티라인 입력 보호)
  - shift/ctrl/alt/meta 미사용, IME 조합 중(`isComposing`) 아님
  - 열린 `.overlay.open .modal` 안의 요소에서 발생한 이벤트
  - 그 모달의 `.modal-foot .btn.primary`가 있고 disabled 아님
- 동작: `e.preventDefault()` 후 `primary.click()`

**부작용 주의**: select 요소에서 Enter는 OS에 따라 옵션 확정 동작과 충돌할 수 있어 의도적으로 제외함. 필요하면 select에서도 Enter로 저장하도록 조건 완화 가능.

### 3.7. 캐릭터 모달에 아이콘 picker 추가

**배경**: 캐릭터 카드 헤더에서 `ch.icon_url`을 읽어 표시는 하는데, 정작 캐릭터 추가/수정 모달에 아이콘 선택 UI가 없어 사용자가 아이콘을 설정할 방법이 없었음.

**구현**:
- `modal-character` 모달 body 맨 위에 `.icon-control` 추가 (`character-icon-preview`, "선택"/"제거" 버튼).
- `state.characterIconUrl`로 임시 상태 보관.
- `setCharacterIcon(url)`, `openCharacterIconPicker()` 신규 함수.
- `openCharacterModal(id)`: 기존 캐릭터 수정일 때 `setCharacterIcon(ch.icon_url)`로 미리보기 채움.
- `saveCharacter()`: `rec.icon_url = state.characterIconUrl || null` 추가하여 DB 저장.

**DB**: `characters` 테이블에 `icon_url` 컬럼이 이미 있음 (구 버전에서도 사용했던 컬럼). 마이그레이션 불필요.

### 3.8. "+ 현재 탭 숙제" 버튼 제거

**배경**: 추가 버튼 메뉴의 "+ 현재 탭 숙제"가 사실상 동작 안 했음. 코드를 보면 `state.accounts[0]` 또는 `visibleChars()[0]`을 항상 사용 — 즉 현재 선택된 계정/캐릭터가 아니라 첫 번째에 추가하고 있어서 사용자 입장에서 "엉뚱한 곳에 추가됨"으로 보임.

**처리**: 버튼과 `openCreateForCurrent()` 함수 둘 다 삭제. 각 캐릭터/계정 카드에는 별도의 `+` 버튼이 이미 있어서 정상적인 추가 흐름은 영향 없음.

## 4. 구 버전과 NEW 버전의 의도된 차이 (복원하지 않은 것)

다음은 의도적으로 복원하지 않은 항목 — 사용자가 명시적으로 불필요하다고 했거나, 신 버전 디자인 철학과 맞지 않거나, 구 버전에서도 절름발이였던 기능:

- **재화 빠른 조정 팝업** (±1/10/100/1000/10000 버튼): 사용자 요청으로 미복원. 신 버전은 텍스트 입력 + ±1 인라인으로 운영.
- **`la_icon_repo` 설정**: 구 버전에서도 코드만 있고 UI 없는 dormant 기능. 신 버전은 정적 `images/index.json` 방식으로 대체되어 의미 없음.
- **`la_icon_exp/raid/curr/daily`** (섹션 헤더용 커스텀 아이콘): 구 버전에서 읽기만 하고 setter UI 없는 반쪽짜리 기능.
- **사이드바 레이아웃**: 구 버전은 좌측 세로 사이드바, 신 버전은 가로 탭. 디자인이 완전히 다름. 모드 기반 액션 (수정/복제/삭제 모드) 도 신 버전 고유 디자인.
- **레이아웃 변경**: 구 버전은 캐릭터별 단일 화면 사이드바 네비, 신 버전은 그리드 카드 + 모드 탭(daily / weekly / account).

## 5. 신 버전에서 추가된 기능 (구 버전에 없음)

작업자가 이미 만들어둔 것으로, 인계받는 입장에서 알아야 할 것들:

- **Lost Ark Open API 캐릭터 업데이트** (`modal-character-api-update`): 공식 API에서 아이템 레벨/전투력 자동 갱신. localStorage `la_lostark_api_token`에 토큰 저장 가능. "캐릭 업데이트" 버튼 (daily mode 전용).
- **숨김 계정**: `la_hidden_accs` localStorage. "관리 → 계정 설정" 모달에서 토글.
- **단계별 숙제** (step task type): 최대 단계까지 클릭으로 진행. 신 버전에서 추가된 type.
- **모드 기반 액션**: "관리" 메뉴 안의 수정/복제/삭제 모드. 평소엔 액션 버튼 숨김, 모드 진입 시 노출.
- **자동 인덱스 빌드 워크플로** (위 3.1).

## 6. localStorage 키 일람 (현재 사용 중)

- `la_url`, `la_key`: Supabase 연결 정보
- `la_test_now`: 테스트 기준 날짜 (ms timestamp). 비어 있으면 실제 현재 시간 사용.
- `la_lostark_api_token`: Lost Ark Open API Bearer 토큰
- `la_lostark_update_excluded`: 캐릭터 ID 배열 — API 업데이트에서 제외할 캐릭터
- `la_hidden_accs`: 숨김 계정 ID 배열
- `la_redesign_collapsed_currency`, `la_redesign_collapsed_raid`, `la_redesign_collapsed_notes`: 캐릭터 ID 배열 — 섹션이 접혀 있는 상태
- `la_redesign_hide_done`, `la_redesign_show_inactive`: 보기 옵션 토글 상태

## 7. 알려진 이슈 / TODO 후보

- **이미지 인덱스의 첫 워크플로 트리거**: 사용자가 처음 이 시스템을 도입할 때, `images/` 변경이 없으면 워크플로가 트리거되지 않을 수 있음. `Actions` 탭에서 `Run workflow`로 한 번 수동 실행 필요. (워크플로 자체에 `workflow_dispatch` 있음.)
- **워크플로 권한**: 저장소 Settings → Actions → General → "Workflow permissions"에서 "Read and write permissions"가 켜져 있어야 봇 commit이 가능. 안 켜져 있으면 워크플로는 돌지만 push 단계에서 실패함.
- **휴식 게이지 자동 처리의 멱등성**: `autoResetTasks`는 같은 데이터에 대해 여러 번 호출돼도 `rest_last_processed_at`로 중복 처리를 방지함. 다만 동시에 여러 탭이 열려 있으면 race condition 가능성 — 마지막 쓰기가 이김. 거의 영향 없을 것으로 봄.
- **파티 연동 팝업의 `raid_schedules`/`raid_schedule_overrides` 의존**: 임시 파티 연동 표시는 이 두 테이블이 채워져 있어야 정확. 데이터가 비어 있으면 에러 없이 "현재 캐릭터가 배치된 파티가 없습니다" 표시.
- **Enter 키 단축키 - select 요소 제외**: 의도된 동작이지만, select 안에서 Enter로 저장하길 원하면 keydown 핸들러의 `if(tag==='SELECT')return;` 조건 제거.
- **`character.icon_url` 스키마**: `characters` 테이블에 이 컬럼이 없는 환경이면 저장 시 Supabase 에러. 기존 운영 환경엔 있는 것으로 확인.

## 8. 검증 체크리스트 (배포 후 빠른 동작 확인용)

- [ ] 사이트 로드 → 시계가 KST로 표시되는지
- [ ] ⚙️ 버튼 클릭 → 설정 모달 열림 → URL/Key 미리 채워져 있음
- [ ] 설정 모달에서 테스트 날짜 설정 → 저장 → 시계 옆 `· 테스트` 표시 → 비우고 저장 → 표시 사라짐
- [ ] 캐릭터 추가 모달 → 아이콘 선택 → 카테고리 폴더가 보이는지 (이미지 인덱스 동작 확인)
- [ ] 캐릭터 수정 → 아이콘 picker로 변경 → 저장 → 카드 헤더에 새 아이콘 반영
- [ ] 어떤 모달이든 input에서 Enter → primary 버튼 동작 (textarea에서는 줄바꿈)
- [ ] 레이드 숙제 행의 `파티연동` badge 클릭 → 파티 정보 팝업 열림
- [ ] 재화 섹션 헤더 → "최종 YYYY.MM.DD" pill 표시 (재화가 있고 `updated_at`이 있을 때)
- [ ] 휴식 게이지 숙제 → 테스트 날짜 며칠 뒤로 설정 → 새로고침 → 게이지 충전 확인

## 9. 추가 작업이 필요할 때 진입점

- 새 모달 추가: `<div class="overlay" id="modal-...">...</div>` 패턴 + `openModal(id)`/`closeModal(id)`. modal-foot에 primary 버튼 두면 Enter 단축키 자동 동작.
- 새 localStorage 토글: `state.foo = !!localStorage.getItem('la_foo')` 초기화 + `localStorage.setItem('la_foo', ...)` 저장. localStorage 키 명명 규칙 `la_<feature>`.
- 새 reset 정책: `getLastResetUTC(type, day)`에 분기 추가. 모든 시각 비교는 UTC로.
- 이미지 폴더 깊이 확장: `scripts/generate-image-index.js`를 재귀 스캔하도록 수정 + index.html의 `renderPickerCategory`/`renderPickerRoot` 를 트리 네비게이션 가능하도록 확장.

---

이 문서는 사용자에게서 받은 명시적 작업 지시 외의 변경은 하지 않은 상태에서 끝남. 이후 디자인 결정이나 추가 기능은 사용자와 다시 상의 필요.
