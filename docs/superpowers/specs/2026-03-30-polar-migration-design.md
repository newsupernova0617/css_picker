# Polar.sh 결제 로직 마이그레이션 설계

**작성일:** 2026-03-30
**상태:** 설계 승인됨
**대상:** CSS Picker Chrome Extension

---

## 1. 개요

현재 Lemon Squeezy 기반 결제 시스템을 Polar.sh로 전환합니다.

**이유:**
- 비용 절감
- Polar.sh 계정 검증 필요
- 유료 사용자 없는 상태에서 깨끗한 전환 가능

**범위:** Firebase Cloud Functions의 결제 로직만 변경 (Firestore 스키마, 프론트엔드 UI 유지)

---

## 2. 변경 범위

### 변경 대상

| 파일 | 변경 사항 | 상세 |
|------|---------|------|
| `functions/index.js` | 수정 | `createCheckout()` - Polar API로 변경 |
| `functions/index.js` | 수정 | `handleWebhook()` - Polar 웹훅 형식 변경 |
| `functions/index.js` | 수정 | `ALLOWED_ORIGINS` - Polar 도메인 추가 |
| `.env.example` | 수정 | LS_API_KEY → POLAR_API_KEY, POLAR_WEBHOOK_SECRET 추가 |
| `.env` | 수정 | 개발자가 Polar 키로 업데이트 |

### 유지 (변경 없음)

| 항목 | 이유 |
|------|------|
| Firestore `users` 컬렉션 | Polar도 동일한 필드 구조 지원 (status, orderId, purchasedAt) |
| `sidepanel.js` | Polar 체크아웃 URL만 교체 (로직 변경 없음) |
| Firebase Authentication | Polar는 인증 담당 안 함 (그대로 유지) |
| `getOrCreateUserProfile()` | Polar와 무관한 사용자 프로필 로직 |

---

## 3. API 비교

### Lemon Squeezy
```javascript
// 체크아웃 생성
POST https://api.lemonsqueezy.com/v1/checkouts
Header: Authorization: Bearer <LS_API_KEY>

// 웹훅 검증
HMAC-SHA256(secret, payload) → base64 비교
```

### Polar.sh
```javascript
// 체크아웃 생성
POST https://api.polar.sh/v1/checkouts
Header: Authorization: Bearer <POLAR_API_KEY>

// 웹훅 검증
HMAC-SHA256(secret, payload) → 헤더 비교
```

---

## 4. 구현 상세

### 4.1 createCheckout() 함수 변경

**현재 로직:**
```javascript
exports.createCheckout = onRequest({
  secrets: ["LS_API_KEY"],
  timeoutSeconds: 30,
  rawBody: true,
  cors: ALLOWED_ORIGINS,
}, async (req, res) => {
  // Lemon Squeezy API 호출
});
```

**변경 후:**
1. `LS_API_KEY` → `POLAR_API_KEY` 시크릿 변경
2. Polar API 엔드포인트로 변경: `https://api.polar.sh/v1/checkouts`
3. 요청 페이로드 구조 적응 (Polar 형식)
4. 응답 형식 적응 (Polar 응답에서 URL 추출)

**결과:** 동일한 입력(`storeId`, `variantId`, `redirectUrl`, `firebaseUid`) → Polar 체크아웃 URL 반환

### 4.2 handleWebhook() 함수 변경

**현재 로직:**
```javascript
exports.handleWebhook = onRequest({
  secrets: ["LS_WEBHOOK_SECRET"],
  timeoutSeconds: 30,
  rawBody: true,
  cors: ALLOWED_ORIGINS,
}, async (req, res) => {
  // HMAC 검증
  // 이벤트 타입 분기: order_created, order_refunded
  // Firestore 업데이트
});
```

**변경 후:**
1. `LS_WEBHOOK_SECRET` → `POLAR_WEBHOOK_SECRET` 변경
2. 웹훅 서명 검증 로직 유지 (HMAC-SHA256이므로 동일)
3. 이벤트 타입 매핑:
   - Lemon: `order_created` → Polar: `order.created`
   - Lemon: `order_refunded` → Polar: `order.refunded`
4. 웹훅 데이터 구조 적응 (custom_data 경로 변경)

**결과:** Polar 웹훅 → Firestore `users` 문서 업데이트 (동일)

### 4.3 Firestore 스키마 (변경 없음)

```javascript
// users/{uid}
{
  status: "free" | "paid",
  orderId: string,           // Polar order ID
  purchasedAt: timestamp,
  email: string,
  updatedAt: timestamp,
  createdAt: timestamp
}
```

---

## 5. 환경 변수 변경

### .env.example
```diff
- LS_API_KEY=xxx
+ POLAR_API_KEY=xxx

- LS_WEBHOOK_SECRET=xxx
+ POLAR_WEBHOOK_SECRET=xxx
```

### Cloud Functions 배포
```bash
firebase deploy --only functions
```

Polar 키를 환경 변수로 설정:
```bash
firebase functions:config:set polar.api_key="xxx" polar.webhook_secret="xxx"
```

---

## 6. 테스트 계획

| 항목 | 방법 | 기준 |
|------|------|------|
| 체크아웃 생성 | Polar Dashboard에서 테스트 링크 생성 후 비교 | URL 정상 생성 |
| 웹훅 검증 | Polar의 웹훅 재시도 기능으로 테스트 | 200 OK 응답 |
| Firestore 동기화 | 테스트 주문 후 users 문서 확인 | status: "paid" 업데이트됨 |
| 환경 변수 | `firebase functions:config:get` | 키 정상 로드됨 |

---

## 7. 마이그레이션 체크리스트

- [ ] Polar.sh 계정 생성 및 검증
- [ ] Polar API 키 발급 (API key, Webhook secret)
- [ ] `functions/index.js` 수정 (createCheckout, handleWebhook)
- [ ] `.env.example` 업데이트
- [ ] 로컬 테스트 (Firebase Emulator)
- [ ] 스테이징 배포 및 Polar 웹훅 테스트
- [ ] 프로덕션 배포
- [ ] 사이드패널 UI 테스트 (Polar 링크 생성 확인)

---

## 8. 주의사항

1. **Polar API 문서 확인 필수**: 이 설계는 일반적인 결제 API 패턴을 기반으로 함. Polar 공식 문서의 정확한 엔드포인트, 페이로드, 웹훅 이벤트명 확인 필수.
2. **웹훅 URL 변경**: Polar Dashboard에서 새로운 웹훅 URL 등록 필수.
3. **기존 Lemon Squeezy 코드 제거**: 혼동을 피하기 위해 완전히 제거.

---

## 9. 참고

**현재 Lemon Squeezy 구현 위치:**
- 체크아웃: `/functions/index.js:19-102`
- 웹훅: `/functions/index.js:107-184`

**관련 파일:**
- 사이드패널 결제 UI: `/css_picker/css_picker/sidepanel.js` (plan manager 로직)
- Firebase 설정: `/firebase.json`, `/firestore.rules`
