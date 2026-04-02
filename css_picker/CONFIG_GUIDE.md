# Config 교체 가이드

## 1. config.js - Firebase → 자체 인증 서버로 변경
```javascript
// 기존 (삭제할 부분)
self.firebaseConfig = {
  apiKey: "...",
  authDomain: "project-fastsaas.firebaseapp.com",
  projectId: "project-fastsaas",
  ...
}

// 새로운 형식 (예시)
self.authConfig = {
  apiKey: "YOUR_API_KEY",
  authServerUrl: "https://your-auth-server.com",
  backendUrl: "https://your-api.com"
}
```

## 2. manifest.json - OAuth2 클라이언트 ID 변경
```json
"oauth2": {
  "client_id": "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
  "scopes": [
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email"
  ]
}
```

## 3. service-worker.js 수정 필요
- **라인 9-17:** Firebase 엔드포인트 → 자체 서버 엔드포인트
- **라인 306-316:** BACKEND_ENDPOINTS 수정
  ```javascript
  BACKEND_ENDPOINTS = [
    { label: "prod", baseUrl: "https://your-api.com" },
    { label: "dev", baseUrl: "http://localhost:3000" }
  ]
  ```
- **라인 340-432:** `loginWithGoogle()` 함수 - Firebase 대신 자체 인증 로직
- **라인 248:** Firestore 호출 → 자체 API 호출

## 4. planManager.js 수정 필요
- **라인 14-18:** 백엔드 URL 변경
  ```javascript
  this.backendUrl = options.backendUrl || "https://your-api.com";
  this.checkoutUrl = options.checkoutUrl || "https://your-site.com/pricing";
  ```
- **라인 21-27:** featureMatrix 유지 (구독 정책은 동일 가능)

## 5. 저장소 키 (변경 불필요)
- `csspicker_auth_state` - 현재 사용자 정보
- `plan_manager_state` - 구독 상태
- `plan_usage_counters` - 사용량 추적

## 체크리스트
- [ ] config.js 인증 서버 URL 입력
- [ ] manifest.json Google OAuth 클라이언트 ID 변경
- [ ] service-worker.js BACKEND_ENDPOINTS 수정
- [ ] service-worker.js Firebase 호출 → 자체 API 호출로 변경
- [ ] planManager.js backendUrl/checkoutUrl 수정
- [ ] 자체 서버의 API 엔드포인트 명세 확인 (Google 토큰 검증, 사용자 정보 조회, 구독 상태 조회)
