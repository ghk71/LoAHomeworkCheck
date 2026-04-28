# Project Context

## 프로젝트 배경

이 프로젝트는 Claude에서 처음 개발된 뒤, ChatGPT와 함께 다수의 버그 수정, UI 개선, Supabase 스키마 보정, 테스트 시나리오 작성이 진행된 로스트아크 숙제 트래커입니다.

## 현재 상태

- GitHub Pages에서 정적 HTML 파일로 배포한다.
- Supabase를 백엔드 DB로 사용한다.
- 로그인/회원가입은 아직 구현하지 않는다.
- 현재 단계에서는 보안/RLS보다 기능 안정성과 사용성을 우선한다.
- 향후 로그인/회원가입과 사용자별 데이터 격리를 추가할 예정이다.

## 절대 유지해야 하는 방향

- React, Vite, Next.js 등으로 전환하지 않는다.
- 빌드 과정 없이 GitHub Pages에 올리면 바로 동작해야 한다.
- 단일 HTML 파일 구조를 유지한다.
- 기존 Supabase 데이터와 호환되어야 한다.
- 기존 기능을 삭제하지 않고, 버그 단위로 안정화한다.

## 최근 주요 수정 방향

- CSS 깨짐 수정
- `</html>` 뒤에 JavaScript 코드가 노출되는 문제 수정
- Supabase 컬럼 누락 수정
- 부계정 표시 방식 그룹화
- 레이드 골드 표시를 유통/귀속/더보기로 분리
- 레이드 숙제에서 파티연동 팝업 표시 개선
- 코어 현황의 스크롤 및 카드 CSS 수정
- `raid.html` 파티 선택 시 `gPresets is not defined` 오류 수정
- 공유 링크 뷰어 모드에서 레이드 현황 표시 개선
- `parties.html` 난이도 위치 개선

## Claude 원본 작업 노트

Claude에서 받은 원본 인수인계 문서는 별도로 `docs/claude_original_notes.md`에 저장한다.

이 파일은 사용자가 Claude에서 별도로 받아서 추가한다.
