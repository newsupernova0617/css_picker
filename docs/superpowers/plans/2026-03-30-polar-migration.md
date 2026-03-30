# Polar.sh 결제 로직 마이그레이션 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Firebase Cloud Functions의 결제 로직을 Lemon Squeezy에서 Polar.sh로 완전히 전환합니다.

**Architecture:** 직접 교체 방식. Firestore 스키마는 유지하고, `functions/index.js`의 `createCheckout()` 및 `handleWebhook()` 두 함수만 Polar API로 변경합니다. 기존 `getOrCreateUserProfile()` 함수와 Firebase Auth 로직은 변경 없음.

**Tech Stack:** Firebase Cloud Functions v2, Node.js, Polar.sh REST API, HMAC-SHA256

---

## 파일 구조

```
functions/
├── index.js              (수정: createCheckout, handleWebhook)
├── package.json          (변경 없음)
└── .env.example          (수정: 환경 변수)

docs/
└── superpowers/
    └── specs/
        └── 2026-03-30-polar-migration-design.md  (참조)
```

---

## Task 1: 환경 변수 설정 파일 업데이트

**Files:**
- Modify: `functions/.env.example`

- [ ] **Step 1: .env.example 파일 열기**

파일 경로: `/home/yj437/coding/css_picker/functions/.env.example`

현재 내용 확인 (있다면):
```bash
cat functions/.env.example
```

파일이 없으면 생성.

- [ ] **Step 2: 환경 변수 업데이트**

`.env.example`을 다음과 같이 수정:

```
# Polar.sh API Configuration
POLAR_API_KEY=<your-polar-api-key-here>
POLAR_WEBHOOK_SECRET=<your-polar-webhook-secret-here>

# Firebase Configuration (기존)
# 다른 환경 변수가 있으면 유지
```

**주의:** Lemon Squeezy 관련 변수 제거 (LS_API_KEY, LS_WEBHOOK_SECRET)

- [ ] **Step 3: 커밋**

```bash
git add functions/.env.example
git commit -m "chore: update env vars for Polar.sh migration"
```

---

## Task 2: createCheckout() 함수 수정 (Polar API로 변경)

**Files:**
- Modify: `functions/index.js:19-102` (createCheckout 함수 전체)

**주의:** Polar.sh API 문서의 정확한 엔드포인트, 페이로드 구조, 응답 형식을 확인하고 아래 코드를 필요에 따라 조정하세요.

- [ ] **Step 1: Polar API 문서 확인**

Polar.sh 공식 문서에서 다음 정보를 확인:
- 체크아웃 생성 엔드포인트: `POST /v1/checkouts` (또는 다른 경로)
- 필수 요청 필드 (storeId, variantId, redirectUrl 등의 Polar 버전 이름)
- 응답 형식 (체크아웃 URL 위치)
- 인증 헤더 형식 (Bearer token인지 다른 형식인지)

문서 링크: https://docs.polar.sh (실제 문서 URL 확인 필수)

- [ ] **Step 2: createCheckout 함수 작성**

`functions/index.js`의 현재 createCheckout 함수를 다음과 같이 변경:

```javascript
/**
 * 1️⃣ Polar Checkout 생성
 */
exports.createCheckout = onRequest(
  {
    secrets: ["POLAR_API_KEY"],
    timeoutSeconds: 30,
    rawBody: true,
    cors: ALLOWED_ORIGINS,
  },
  async (req, res) => {
    try {
      if (req.method !== "POST")
        return res.status(405).json({ error: "Method Not Allowed" });

      // rawBody JSON 파싱
      let body;
      try {
        body = req.rawBody ? JSON.parse(req.rawBody.toString()) : {};
      } catch (err) {
        return res.status(400).json({ error: "Invalid JSON" });
      }

      const { storeId, variantId, redirectUrl, testMode = false, firebaseUid } = body;
      if (!storeId || !variantId)
        return res
          .status(400)
          .json({ error: "storeId and variantId are required" });

      if (!firebaseUid)
        return res.status(400).json({ error: "firebaseUid is required" });

      const apiKey = process.env.POLAR_API_KEY;
      if (!apiKey)
        return res.status(500).json({ error: "POLAR_API_KEY is missing" });

      // Polar Checkout 페이로드
      // 주의: 아래 구조는 예시입니다. Polar API 문서에서 정확한 형식을 확인하세요.
      const payload = {
        // Polar API 형식에 맞춰 조정 필요
        storeId: String(storeId),
        variantId: String(variantId),
        redirectUrl: redirectUrl,
        customData: {
          firebaseUid: firebaseUid,
        },
        // testMode 필드 확인 필수
      };

      const r = await fetch("https://api.polar.sh/v1/checkouts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        const errText = await r.text();
        return res
          .status(r.status)
          .json({ error: "Polar API error", detail: errText });
      }

      const data = await r.json();
      // Polar API 응답에서 URL 추출 (경로 확인 필수)
      const url = data?.url || data?.data?.url;
      if (!url)
        return res.status(500).json({ error: "Checkout URL not found in Polar response" });

      return res.status(200).json({ url });
    } catch (err) {
      console.error("createCheckout error:", err);
      return res
        .status(500)
        .json({ error: err?.message || "Internal server error" });
    }
  }
);
```

**중요 주의사항:**
- `https://api.polar.sh/v1/checkouts` 경로가 정확한지 Polar 문서에서 확인
- 요청 페이로드의 필드명 (storeId vs store_id, variantId vs variant_id 등) 확인
- 응답 형식에서 URL 위치 확인 (`data.url` vs `data.data.url` vs 다른 경로)

- [ ] **Step 3: 테스트 (로컬 Firebase Emulator)**

Firebase Emulator로 함수 테스트:

```bash
cd functions
npm install  # 의존성 확인
```

Emulator 실행:
```bash
firebase emulators:start --only functions
```

다른 터미널에서 테스트 요청:
```bash
curl -X POST http://localhost:5001/project-fastsaas/us-central1/createCheckout \
  -H "Content-Type: application/json" \
  -d '{
    "storeId": "123",
    "variantId": "456",
    "redirectUrl": "https://example.com/return",
    "firebaseUid": "test-uid-123"
  }'
```

**기대 결과:** 정상: `{ "url": "https://polar.sh/checkout/..." }` 또는 Polar 형식의 URL

- [ ] **Step 4: 커밋**

```bash
git add functions/index.js
git commit -m "feat: replace Lemon Squeezy with Polar.sh checkout creation"
```

---

## Task 3: handleWebhook() 함수 수정 (Polar 웹훅으로 변경)

**Files:**
- Modify: `functions/index.js:107-184` (handleWebhook 함수 전체)

**주의:** Polar.sh API 문서의 웹훅 형식, 이벤트 타입명, 서명 검증 방식을 정확히 확인하세요.

- [ ] **Step 1: Polar 웹훅 문서 확인**

Polar.sh 공식 문서에서 다음 정보를 확인:
- 웹훅 이벤트 타입 (예: `order.created`, `order.completed`, `order.refunded` 등)
- 웹훅 서명 검증 방식 (HMAC-SHA256 헤더 위치)
- 웹훅 페이로드 구조 (custom_data 또는 customData 위치)
- 이벤트 데이터의 주문 ID, 이메일 필드 위치

문서 링크: https://docs.polar.sh/webhooks (실제 문서 URL 확인 필수)

- [ ] **Step 2: handleWebhook 함수 작성**

`functions/index.js`의 현재 handleWebhook 함수를 다음과 같이 변경:

```javascript
/**
 * 2️⃣ Polar Webhook 처리
 */
exports.handleWebhook = onRequest(
  {
    secrets: ["POLAR_WEBHOOK_SECRET"],
    timeoutSeconds: 30,
    rawBody: true,
    cors: ALLOWED_ORIGINS,
  },
  async (req, res) => {
    try {
      if (req.method !== "POST")
        return res.status(405).send("Method Not Allowed");

      const payload = req.rawBody;
      if (!payload)
        return res.status(400).json({ error: "Missing payload" });

      const secret = process.env.POLAR_WEBHOOK_SECRET;
      if (!secret)
        return res.status(500).json({ error: "POLAR_WEBHOOK_SECRET is missing" });

      // Polar 웹훅 서명 검증
      // 주의: 아래 구조는 예시입니다. Polar 문서에서 정확한 헤더명과 검증 방식을 확인하세요.
      const signature = req.header("Polar-Signature") || req.header("X-Polar-Signature");
      if (!signature)
        return res.status(400).json({ error: "Missing signature header" });

      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("base64");

      const signatureBuffer = Buffer.from(signature, "base64");
      const expectedBuffer = Buffer.from(expectedSignature, "base64");

      if (
        signatureBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
      ) {
        return res.status(401).json({ error: "Invalid signature" });
      }

      const event = JSON.parse(payload.toString());
      const { type, data } = event;

      // Polar 이벤트 타입에 따라 처리
      // 주의: 이벤트 타입명과 데이터 구조는 Polar 문서에서 확인하세요.
      // 예시: order.created, order.refunded 등

      // custom_data 또는 customData에서 firebaseUid 추출 (경로 확인 필수)
      const uid =
        data?.customData?.firebaseUid ||
        data?.custom_data?.firebaseUid ||
        data?.metadata?.firebaseUid;

      if (uid) {
        const userRef = db.collection("users").doc(uid);

        if (type === "order.created" || type === "order_created") {
          // 주문 생성 시 사용자 상태를 "paid"로 업데이트
          await userRef.set(
            {
              status: "paid",
              orderId: data.id || data.orderId,
              purchasedAt: data.createdAt || data.created_at || new Date().toISOString(),
              updatedAt: FieldValue.serverTimestamp(),
              email: data.email || data.userEmail || null,
            },
            { merge: true }
          );
        } else if (type === "order.refunded" || type === "order_refunded") {
          // 환불 시 상태를 "refunded"로 업데이트
          const doc = await userRef.get();
          if (doc.exists) {
            await userRef.update({
              status: "refunded",
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
        }
      }

      // 웹훅 로그 저장 (디버깅용)
      await db.collection("webhooks").add({
        type,
        data,
        receivedAt: FieldValue.serverTimestamp(),
      });

      res.status(200).send("Webhook received");
    } catch (err) {
      console.error("Webhook error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);
```

**중요 주의사항:**
- Polar 웹훅 서명 헤더명 확인 (`Polar-Signature`, `X-Polar-Signature`, 또는 다른 이름)
- 이벤트 타입명 확인 (`order.created` vs `order_created` 등)
- custom_data 경로 확인 (`data.customData`, `data.custom_data`, `data.metadata` 등)
- 주문 ID, 이메일 필드명 확인 (`data.id` vs `data.orderId`, `data.email` vs `data.userEmail` 등)

- [ ] **Step 3: 웹훅 URL 등록**

Polar Dashboard에서:
1. Webhooks 설정 페이지 이동
2. Webhook 엔드포인트 등록: `https://<your-firebase-region>-<your-project>.cloudfunctions.net/handleWebhook`
3. 이벤트 타입 선택: `order.created`, `order.refunded` (또는 Polar에서 제공하는 정확한 이름)

- [ ] **Step 4: 로컬 테스트 (Polar 대시보드 웹훅 재시도)**

Polar Dashboard의 웹훅 섹션에서:
1. 이전 웹훅 전송 기록 확인
2. 실패한 웹훅 재시도 (또는 테스트 웹훅 전송)
3. Firebase 로그 확인: `firebase functions:log`

```bash
firebase functions:log
```

**기대 결과:** 로그에 "Webhook received" 메시지, Firestore의 `webhooks` 컬렉션에 항목 추가

- [ ] **Step 5: Firestore 확인**

Firebase Console에서:
1. Firestore Database 이동
2. `webhooks` 컬렉션 확인 → 웹훅 이벤트 기록 확인
3. `users` 컬렉션 확인 → 해당 UID의 문서 확인
4. `status: "paid"` 확인

- [ ] **Step 6: 커밋**

```bash
git add functions/index.js
git commit -m "feat: replace Lemon Squeezy with Polar.sh webhook handling"
```

---

## Task 4: CORS 및 기타 설정 확인

**Files:**
- Modify: `functions/index.js:13-14` (ALLOWED_ORIGINS)

- [ ] **Step 1: ALLOWED_ORIGINS 업데이트**

필요시 Polar 관련 도메인 추가. 현재 코드:

```javascript
const ALLOWED_ORIGINS = [/firebase\.com$/, "https://flutter.com", "https://www.csspicker.site","https://project-fastsaas.firebaseapp.com","https://project-fastsaas.web.app",    "http://localhost:5000",
    "http://127.0.0.1:5500"];
```

Polar 체크아웃 URL이 특정 도메인에서만 호출되는 경우, 해당 도메인 추가. 예:

```javascript
const ALLOWED_ORIGINS = [
  /firebase\.com$/,
  "https://flutter.com",
  "https://www.csspicker.site",
  "https://project-fastsaas.firebaseapp.com",
  "https://project-fastsaas.web.app",
  "https://checkout.polar.sh",  // Polar 도메인 추가 (필요시)
  "http://localhost:5000",
  "http://127.0.0.1:5500"
];
```

**주의:** Polar 문서에서 체크아웃이 호출되는 도메인 확인 후 필요시만 추가.

- [ ] **Step 2: package.json 의존성 확인**

`node-fetch` 패키지가 이미 설치되어 있는지 확인:

```bash
cd functions
npm list node-fetch
```

설치되지 않았으면:
```bash
npm install node-fetch
```

- [ ] **Step 3: 커밋**

```bash
git add functions/index.js functions/package.json
git commit -m "chore: update CORS and dependencies for Polar.sh"
```

---

## Task 5: 프로덕션 배포

**Files:**
- Deploy: `functions/index.js`

- [ ] **Step 1: Firebase 환경 변수 설정**

다음 명령으로 Polar API 키와 웹훅 시크릿을 Firebase에 설정:

```bash
firebase functions:config:set polar.api_key="<actual-polar-api-key>" polar.webhook_secret="<actual-polar-webhook-secret>"
```

또는 Firebase Console에서 Environment Variables 설정.

- [ ] **Step 2: Cloud Functions 배포**

```bash
firebase deploy --only functions
```

**기대 결과:**
```
Functions code updated successfully
✔  Deploy complete!
```

- [ ] **Step 3: 배포 후 로그 확인**

```bash
firebase functions:log
```

오류가 없는지 확인.

- [ ] **Step 4: 스모크 테스트 (실제 체크아웃 생성)**

사이드패널에서 구독 버튼 클릭 → Polar 체크아웃 URL 생성되는지 확인.

**기대 결과:** Polar 체크아웃 페이지로 이동.

- [ ] **Step 5: 최종 커밋**

```bash
git add -A
git commit -m "chore: deploy Polar.sh migration to production"
```

---

## Task 6: 마이그레이션 검증

**Files:**
- Verify: `functions/index.js`, Firestore `users`, `webhooks` 컬렉션

- [ ] **Step 1: 기능 테스트 (전체 흐름)**

1. 사이드패널 열기
2. 로그인 (Google)
3. Premium 구독 버튼 클릭
4. Polar 체크아웃 페이지 로드 확인
5. 테스트 결제 진행 (또는 Polar 대시보드에서 테스트 주문 생성)
6. 웹훅 처리 확인

- [ ] **Step 2: Firestore 검증**

Firebase Console에서:

```
users/{uid}
├── status: "paid" (또는 "free")
├── orderId: "<polar-order-id>"
├── purchasedAt: "<timestamp>"
├── email: "<user-email>"
└── updatedAt: "<timestamp>"
```

- [ ] **Step 3: 웹훅 로그 확인**

Firestore의 `webhooks` 컬렉션에 다음 구조의 문서가 있는지 확인:

```json
{
  "type": "order.created",
  "data": { ... },
  "receivedAt": "<timestamp>"
}
```

- [ ] **Step 4: 최종 커밋**

```bash
git add -A
git commit -m "chore: verify Polar.sh migration complete"
```

---

## 주의사항 & 참고

### ⚠️ 필수 확인 항목

1. **Polar API 문서**: 다음 정보를 반드시 확인하세요.
   - 체크아웃 생성 엔드포인트 및 페이로드 형식
   - 웹훅 이벤트 타입명 및 데이터 구조
   - 웹훅 서명 검증 방식 및 헤더명
   - Custom data 또는 메타데이터 저장 방식

2. **Polar 대시보드 설정**:
   - API 키 발급 (storeId, variantId 확인)
   - 웹훅 엔드포인트 등록
   - 웹훅 시크릿 생성 및 저장

3. **환경 변수**:
   - 로컬: `functions/.env`에 Polar 키 설정
   - 프로덕션: Firebase Console 또는 CLI에서 설정

### 📋 체크리스트

- [ ] Polar API 문서 읽음
- [ ] Polar 계정 생성 및 API 키 발급
- [ ] 로컬 테스트 완료
- [ ] Firebase Emulator로 함수 동작 확인
- [ ] 스테이징 배포 및 웹훅 테스트
- [ ] Polar 대시보드에서 웹훅 URL 등록
- [ ] 프로덕션 배포
- [ ] 실제 구독 흐름 테스트
- [ ] 모든 커밋 완료

### 🔗 참고 자료

- **현재 구현:**
  - createCheckout: `functions/index.js:19-102`
  - handleWebhook: `functions/index.js:107-184`

- **설계 문서:**
  - `docs/superpowers/specs/2026-03-30-polar-migration-design.md`

- **Firestore 스키마:**
  ```javascript
  users/{uid}: {
    status: "free" | "paid",
    orderId: string,
    purchasedAt: timestamp,
    email: string,
    createdAt: timestamp,
    updatedAt: timestamp
  }
  ```

---

## 다음 단계

- [ ] 계획 실행 (Subagent-Driven 또는 Inline Execution)
- [ ] 모든 태스크 완료 후 검증
- [ ] 프로덕션 배포
- [ ] 사이드패널 및 관리자 대시보드에서 사용자 결제 상태 확인
