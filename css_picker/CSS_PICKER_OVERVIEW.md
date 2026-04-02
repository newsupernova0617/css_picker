# CSS Picker 코드 개요

## 확장 프로그램 개요
- Chrome 웹페이지에서 요소를 하이라이트하고 CSS 정보를 추출·편집하며, 색상·에셋·콘솔 데이터를 관리하는 확장입니다.
- 서비스 워커, 콘텐츠 스크립트, 사이드패널 UI가 메시지로 상태를 공유하며, 프리미엄 플랜과 GDPR 동의 흐름도 포함합니다.

## 주요 파일별 기능
### manifest.json
- Manifest V3 설정으로 `sidePanel`, `content_scripts`, `service_worker`를 등록하고 `tabs`·`scripting`·`downloads` 등 권한을 선언합니다.
- Google OAuth2 클라이언트 ID와 `<all_urls>` 호스트 권한을 사용하며, 사이드패널 기본 경로와 웹 접근 가능한 리소스를 지정합니다.

### service-worker.js
- REST 기반 Firebase Identity Toolkit과 Firestore HTTP API를 직접 호출하여 Google 로그인과 사용자 프로필 조회를 처리합니다(`config.js` 필요).
- `loginWithGoogle`, `getUserProfile`, `signOut`을 통해 인증을 담당하고, `BACKEND_ENDPOINTS` 후보를 순회하는 `fetchFromBackend` 유틸과 에셋 일괄 다운로드 로직을 제공합니다.
- 액션 아이콘 클릭 시 사이드패널을 여는 `handleActionClick`, 콘텐츠 스크립트에 피커 상태를 전달하는 `enablePicker`·`disablePicker`를 노출합니다.
- 탭 전환/로딩, 다운로드 상태 변화를 수신하고, `chrome.runtime.onMessage`에서 로그인·로그아웃·피커 토글·에셋 다운로드·상태 확인 메시지를 처리합니다.
- `chrome.alarms` 기반으로 사이드패널과의 연결 상태를 주기적으로 확인해 끊어졌을 때 피커를 비활성화합니다.

### content.js
- `ElementHighlighter`가 DOM 이벤트를 사용해 요소에 테두리를 입히고 클릭 요소의 CSS 선택자·computed style·커스텀 프로퍼티를 구조화해 사이드패널에 전달합니다.
- 기본값 필터링, LRU 캐시, 스로틀링, 캡처 타이밍 등을 적용해 CSS 추출 성능을 최적화하고, 선택된 요소의 인라인 스타일을 갱신하는 `updateElementStyle`을 제공합니다.
- html2canvas를 이용한 페이지 스크린샷, 색상 변환, 수정 스타일 추적, hover/selection outline 복원 등 편집 지원 기능을 포함합니다.
- `startConsoleCapture` 시 `console-injector.js`를 삽입하고 `window.postMessage`를 통해 콘솔 로그·에러·네트워크 이벤트를 사이드패널로 전달하며, fetch 래핑과 전역 에러/Promise rejection 핸들러도 구성합니다.
- `AssetCollector`가 이미지(백그라운드 포함), 스타일시트, 스크립트, 폰트, 비디오, 오디오를 수집하고 메타데이터·중복 제거를 수행합니다.
- `chrome.runtime.onMessage` 리스너가 피커 토글, CSS 업데이트, 에셋 수집, 스크린샷, 콘솔 캡처 제어, ping 요청 등을 처리합니다.

### console-injector.js
- 페이지 컨텍스트에서 `console.*` 메서드를 래핑해 원본 호출을 유지하면서 메시지를 직렬화해 `window.postMessage`로 전달합니다.
- 전역 오류와 미처리 Promise 거부도 캐치하여 동일한 경로로 전송해 디버깅 정보를 풍부하게 합니다.

### gdpr-init.js
- DOM 로드 시 GDPR 모달의 필수 체크박스를 감시하고, 동의 완료 여부를 `chrome.storage.local`에 저장합니다.
- Bootstrap 모달 인스턴스를 이용해 동의 수락/거부를 제어하며, 거부 시 현재 탭을 닫도록 요청합니다.

### sidepanel.html
- 인증 영역, 프리미엄 안내, GDPR/업그레이드/도움말 모달, 도구별 섹션(CSS 인스펙터, Tailwind 변환, 컬러 팔레트, 에셋 매니저, 콘솔 모니터)을 정의합니다.
- JSZip·html2canvas·Bootstrap·Firebase·Stripe·`planManager.js`·`sidepanel.js`·`gdpr-init.js`를 순서대로 로드합니다.

### sidepanel.css
- 브랜드 컬러 팔레트와 타이포그래피/간격 변수, 애니메이션, 레이아웃 유틸리티, 프리미엄 잠금 오버레이 등 사이드패널 전체 스타일을 제공합니다.
- 홈 카드, 아코디언, 콘솔 로그 테이블, 색상 팔레트, 에셋 목록 같은 뷰 전반에 일관된 테마를 적용합니다.

### sidepanel.js
- `TailwindConverter`가 CSS 속성을 Tailwind 클래스 맵과 색상/spacing 테이블로 변환하고, 변환 통계·추천 메시지를 생성합니다.
- `ConsoleManager`가 콘텐츠 스크립트에 콘솔 캡처 시작/중지 메시지를 보내고, 메시지 큐 관리·필터링·검색·성능 지표(UI 업데이트 포함)를 담당합니다.
- `SidePanel`은 UI 요소 바인딩, 이벤트 리스너, 메시지 라우팅을 총괄하며 다음을 처리합니다:
  - 피커 토글, CSS 정보 요청/표시, 선택 속성 편집·복원·복사, Tailwind 보기 전환 및 결과 복사/내보내기
  - html2canvas 기반 컬러 스포이드와 팔레트 관리, CSV/JSON 내보내기, 프리미엄 제한 체크
  - `AssetCollector` 결과 표시 및 선택 다운로드(서비스 워커에 `download_assets` 요청)
  - 콘솔 모니터 모드 전환, 필터·검색·내보내기, 성능 메트릭과 알림 토스트
  - Google 인증/플랜 상태를 갱신하고, `PlanManager`를 통해 기능 잠금/업그레이드 모달을 제어(PlanManager 구현체는 별도 스크립트로 기대)
  - GDPR 동의 확인, 사이드패널 개폐 상태를 백그라운드에 통지, 다수의 디버그 헬퍼 제공
- Clerk 연동 코드는 대부분 비활성화 상태로 남아 있으며, Google OAuth 결과를 받아 UI만 갱신하도록 단순화돼 있습니다.

## 라이브러리 및 외부 의존성
- 번들된 라이브러리: `lib/html2canvas.min.js`, `lib/jszip.min.js`, `lib/bootstrap.bundle.min.js`.
- Manifest에는 `lib/petite-vue.iife.min.js`, `lib/stripe.js` 등이 웹 접근 리소스로 선언돼 있으나 현재 디렉터리에는 존재하지 않습니다.
- 서비스 워커는 `chrome.identity`, `chrome.tabs`, `chrome.downloads`, `chrome.sidePanel`, `chrome.alarms`, `chrome.storage` API를 사용합니다.

## 추가 확인이 필요한 부분
- `service-worker.js`가 임포트하는 `config.js`와 사이드패널이 로드하는 `planManager.js` 파일이 현재 저장소에는 포함돼 있지 않아 실제 실행 시 의존성이 충족되지 않습니다.
- `BACKEND_ENDPOINTS` 정의가 코드에 포함돼 있지 않아 백엔드 호출 로직을 사용하려면 별도 설정이 필요합니다.
- Stripe/Clerk과 같은 결제·인증 외부 서비스는 대부분 자리 표시자 상태이므로 배포 전 환경 변수를 점검해야 합니다.
