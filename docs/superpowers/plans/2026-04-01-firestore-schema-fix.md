# Firestore Schema & Deployment Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix Firestore schema inconsistency (status "premium" → "paid"), update CORS configuration, expand schema with subscription fields, and deploy updates to Firebase.

**Architecture:** Three independent layers need fixing: (1) Backend Cloud Functions with schema changes, (2) Frontend status value alignment, (3) Security rules upgrade. Each can be deployed independently, but executed sequentially.

**Tech Stack:** Firebase Firestore, Firebase Cloud Functions V2, Firebase Admin SDK

---

## File Structure Design

| File | Role | Changes |
|------|------|---------|
| `functions/index.js` | Cloud Functions | Schema expansion, CORS update |
| `public/index.html` | Frontend initialization | Status value fix ("premium" → "paid") |
| `firestore.rules` | Security rules | Temporary → Permanent auth-based rules |
| `.env.example` | Environment reference | Reference only (deployment uses secrets) |

---

## Task 1: Firestore Schema Modification (Backend)

**Files:**
- Modify: `functions/index.js:200-217` (getOrCreateUserProfile)
- Modify: `functions/index.js:156-165` (order.created webhook)

**Objective:** Standardize status values and expand schema with subscription metadata

- [ ] **Step 1: Verify current status values**

Run:
```bash
cd /home/yj437/coding/css_picker
grep -n "status:" functions/index.js
```

Expected Output: Shows `status: "free"`, `status: "paid"`, `status: "refunded"` in functions/index.js

- [ ] **Step 2: Update getOrCreateUserProfile with expanded schema**

Open `functions/index.js` and replace lines 194-218 with:

```javascript
exports.getOrCreateUserProfile = onCall(async (data, context) => {
  if (!context.auth) throw new Error("Unauthenticated");

  const uid = context.auth.uid;
  const userRef = db.collection("users").doc(uid);
  const doc = await userRef.get();

  if (!doc.exists) {
    // Firestore에 문서 없으면 새로 추가
    const newUser = {
      email: context.auth.token.email || null,
      name: context.auth.token.name || null,
      status: "free",  // "free" | "paid" | "cancelled" | "refunded"
      planType: "basic",  // Plan type
      orderId: null,
      purchasedAt: null,
      expiresAt: null,  // Subscription expiration
      refundedAt: null,  // Refund date
      cancelledAt: null,  // Cancellation date
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    await userRef.set(newUser);
    return newUser;
  }

  // 이미 있으면 기존 데이터 리턴
  return doc.data();
});
```

- [ ] **Step 3: Update order.created webhook handler**

Open `functions/index.js` and replace lines 155-165 with:

```javascript
        // Handle order.created event (Polar format - may differ from Lemon Squeezy)
        if (type === "order.created" || type === "order_created") {
          await userRef.set(
            {
              status: "paid",
              planType: "pro",
              orderId: data.id || data.orderId,
              purchasedAt: data.createdAt || data.created_at || new Date().toISOString(),
              expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: FieldValue.serverTimestamp(),
              email: data.email || data.userEmail || null,
            },
            { merge: true }
          );
```

- [ ] **Step 4: Verify schema consistency**

Run:
```bash
grep -A 15 "exports.getOrCreateUserProfile" functions/index.js | head -20
grep -B 2 -A 10 "order.created" functions/index.js | grep -A 8 "status:"
```

Expected: Both sections show status as "free" or "paid", with all 9 fields present (email, name, status, planType, orderId, purchasedAt, expiresAt, refundedAt, cancelledAt, createdAt, updatedAt)

- [ ] **Step 5: Commit Schema Changes**

```bash
cd /home/yj437/coding/css_picker
git add functions/index.js
git commit -m "fix: expand Firestore schema - add subscription fields (planType, expiresAt, refundedAt, cancelledAt)"
```

---

## Task 2: Frontend Status Value Alignment

**Files:**
- Modify: `public/index.html:1253` (handleUpgradeClick)
- Modify: `public/index.html:1324` (onAuthStateChanged)

**Objective:** Replace all "premium" status checks with "paid" to match backend schema

- [ ] **Step 1: Find all premium status references**

Run:
```bash
grep -n 'status.*premium\|premium.*status' /home/yj437/coding/css_picker/public/index.html
```

Expected Output: Lines 1253 and 1324 show `profile.data.status === "premium"`

- [ ] **Step 2: Update handleUpgradeClick function (line ~1253)**

Find this code:
```javascript
        // 3️⃣ 두 번째 필터: 이미 premium이면 결제 막기
        if (profile.data.status === "premium") {
            alert("You already have a premium subscription. Payment is not allowed.");
            console.warn("⏹️ Pay process stopped. User is already premium.");
            return;
        }
```

Replace with:
```javascript
        // 3️⃣ 두 번째 필터: 이미 paid면 결제 막기
        if (profile.data.status === "paid") {
            alert("You already have a premium subscription. Payment is not allowed.");
            console.warn("⏹️ Pay process stopped. User already has paid subscription.");
            return;
        }
```

- [ ] **Step 3: Update onAuthStateChanged (line ~1324)**

Find this code:
```javascript
            if (profile.data.status === "premium" && payButton) {
```

Replace with:
```javascript
            if (profile.data.status === "paid" && payButton) {
```

- [ ] **Step 4: Verify no remaining premium status checks**

Run:
```bash
grep -n 'status.*premium\|premium.*status' /home/yj437/coding/css_picker/public/index.html
```

Expected Output: No results (empty output)

- [ ] **Step 5: Commit Frontend Changes**

```bash
cd /home/yj437/coding/css_picker
git add public/index.html
git commit -m "fix: align frontend status checks - 'premium' → 'paid' to match schema"
```

---

## Task 3: CORS Configuration Update

**Files:**
- Modify: `functions/index.js:12-14` (ALLOWED_ORIGINS)

**Objective:** Update CORS whitelist for new css-picker Firebase project, remove old project-fastsaas references

- [ ] **Step 1: Review current ALLOWED_ORIGINS**

Run:
```bash
grep -A 4 "const ALLOWED_ORIGINS" /home/yj437/coding/css_picker/functions/index.js
```

Expected Output: Shows entries with `project-fastsaas` and other domains

- [ ] **Step 2: Update ALLOWED_ORIGINS in functions/index.js**

Find lines 12-14:
```javascript
const ALLOWED_ORIGINS = [/firebase\.com$/, "https://flutter.com", "https://www.csspicker.site","https://project-fastsaas.firebaseapp.com","https://project-fastsaas.web.app",    "http://localhost:5000",          // 로컬 개발 환경 주소 예시 (포트 번호는 실제 환경에 맞게 변경)
    "http://127.0.0.1:5500"];
```

Replace with:
```javascript
const ALLOWED_ORIGINS = [
  /firebase\.com$/,
  "https://www.csspicker.site",
  "https://css-picker.firebaseapp.com",
  "https://css-picker.web.app",
  "http://localhost:5000",
  "http://127.0.0.1:5500"
];
```

- [ ] **Step 3: Verify CORS update**

Run:
```bash
grep -A 7 "const ALLOWED_ORIGINS" /home/yj437/coding/css_picker/functions/index.js
```

Expected Output: Shows `css-picker.firebaseapp.com` and `css-picker.web.app`, NO `project-fastsaas` entries

- [ ] **Step 4: Commit CORS Changes**

```bash
cd /home/yj437/coding/css_picker
git add functions/index.js
git commit -m "fix: update CORS ALLOWED_ORIGINS for css-picker Firebase project"
```

---

## Task 4: Firestore Security Rules Upgrade

**Files:**
- Modify: `firestore.rules:1-18` (entire file)

**Objective:** Replace temporary time-limited rules with permanent auth-based rules

- [ ] **Step 1: Review current rules**

Run:
```bash
cat /home/yj437/coding/css_picker/firestore.rules
```

Expected Output: Shows rule expiration at `timestamp.date(2026, 5, 1)`

- [ ] **Step 2: Replace with permanent security rules**

Replace entire `firestore.rules` file with:

```javascript
rules_version='2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Authenticated users can only access their own user document
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }

    // Webhooks are backend-only (no client writes)
    match /webhooks/{document=**} {
      allow read: if request.auth.uid != null;
      allow write: if false;
    }

    // Block all other collections by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

- [ ] **Step 3: Verify rules syntax**

Run:
```bash
cat /home/yj437/coding/css_picker/firestore.rules
```

Expected Output: New rules visible, no expiration date, clear auth logic

- [ ] **Step 4: Commit Security Rules**

```bash
cd /home/yj437/coding/css_picker
git add firestore.rules
git commit -m "security: replace temporary Firestore rules with permanent auth-based rules"
```

---

## Task 5: Deploy Cloud Functions

**Files:**
- Deploy: `functions/index.js`, `functions/package.json`

**Objective:** Deploy all schema and CORS changes to Firebase Cloud Functions

- [ ] **Step 1: Verify function code compiles locally**

Run:
```bash
cd /home/yj437/coding/css_picker/functions
node -c index.js
```

Expected Output: No error output (successful syntax check)

- [ ] **Step 2: Check environment variables exist**

Run:
```bash
cat /home/yj437/coding/css_picker/functions/.env.example
```

Expected Output: Shows POLAR_API_KEY and POLAR_WEBHOOK_SECRET are defined

- [ ] **Step 3: Deploy Cloud Functions**

Run:
```bash
cd /home/yj437/coding/css_picker
firebase deploy --only functions
```

Expected Output:
```
...
✔  Deploy complete!
Functions HTTP endpoints:
  createCheckout: https://createcheckout-[HASH].cloudfunctions.net
  handleWebhook: https://handlewebhook-[HASH].cloudfunctions.net
  getOrCreateUserProfile: https://getoruserprofile-[HASH].cloudfunctions.net
```

- [ ] **Step 4: Verify deployment success**

Run:
```bash
firebase functions:list
```

Expected Output: All three functions listed with status "active" and their endpoints

- [ ] **Step 5: Commit Deployment**

```bash
cd /home/yj437/coding/css_picker
git add -A
git commit -m "deploy: update Cloud Functions with schema changes and CORS fixes"
```

---

## Task 6: Deploy Firestore Rules

**Files:**
- Deploy: `firestore.rules`

**Objective:** Publish permanent security rules to Firestore

- [ ] **Step 1: Validate rules syntax**

Run:
```bash
firebase rules:test firestore.rules 2>&1 | head -20
```

Expected Output: Either validation success or clear error message

- [ ] **Step 2: Deploy Firestore Rules**

Run:
```bash
cd /home/yj437/coding/css_picker
firebase deploy --only firestore:rules
```

Expected Output:
```
✔  Deploy complete!
i  Firestore Rules have been successfully published.
```

- [ ] **Step 3: Verify rules in Firebase Console**

1. Open [Firebase Console](https://console.firebase.google.com)
2. Select `css-picker` project
3. Go to Firestore Database → Rules tab
4. Verify new auth-based rules are active

Expected: Rules show auth checks, no expiration date

- [ ] **Step 4: Commit Deployment**

```bash
cd /home/yj437/coding/css_picker
git add firestore.rules
git commit -m "deploy: publish permanent Firestore auth-based security rules"
```

---

## Task 7: Integration Testing

**Objective:** Verify complete flow works with schema changes (login → profile creation → payment flow)

- [ ] **Step 1: Start local development server**

Run:
```bash
cd /home/yj437/coding/css_picker
npm start
```

Expected Output: Server running on `http://localhost:3000` (or configured port)

- [ ] **Step 2: Login and verify profile creation**

Actions:
1. Navigate to `http://localhost:3000` (or local URL)
2. Click "Login" button
3. Complete Google OAuth flow
4. Check browser console (F12) for logs

Expected Console Output:
```
✅ User is valid. Fetching profile for UID: [USER_UID]
User profile: {
  email: "your@email.com",
  status: "free",
  planType: "basic",
  createdAt: {...},
  ...
}
```

- [ ] **Step 3: Verify profile in Firestore**

1. Open [Firebase Console](https://console.firebase.google.com) → css-picker project
2. Go to Firestore Database
3. Navigate to `users` collection
4. Find document with your UID

Expected Data:
```javascript
{
  email: "your@email.com",
  name: "Your Name",
  status: "free",
  planType: "basic",
  orderId: null,
  purchasedAt: null,
  expiresAt: null,
  refundedAt: null,
  cancelledAt: null,
  createdAt: <timestamp>,
  updatedAt: <timestamp>
}
```

- [ ] **Step 4: Test payment flow**

Actions:
1. Click "Upgrade" or payment button
2. Check console for logs
3. Verify no error about "premium" status

Expected Console Output:
```
▶️ pay function called with UID: [USER_UID]
📦 Sending this data to backend: {...}
Backend response status: 200
📦 Received this data from backend: {url: "https://checkout.polar.sh/..."}
```

Then: Redirected to Polar checkout page

- [ ] **Step 5: Verify CORS headers**

Actions (in browser console):
```javascript
fetch('https://[YOUR_FUNCTION_URL]/createCheckout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({storeId: "226265", variantId: "1025119", firebaseUid: "test"})
}).then(r => console.log('Status:', r.status, 'OK:', r.ok))
```

Expected Output:
```
Status: 200 OK: true
```

If CORS issue: Status 0 or 403

- [ ] **Step 6: Document test results**

Create test summary noting:
- ✅ Login successful
- ✅ Profile created with correct status "free"
- ✅ All schema fields present
- ✅ Payment flow initiated without "premium" error
- ✅ CORS working
- ✅ Firestore data visible

---

## Self-Review Checklist

| Item | Status | Notes |
|------|--------|-------|
| **Spec Coverage** | ✅ | All issues addressed: status alignment, CORS, schema expansion, security rules |
| **No Placeholders** | ✅ | All code complete, no "TBD" or "implement later" |
| **Type Consistency** | ✅ | Status: "free"\|"paid"\|"cancelled"\|"refunded" consistent across all files |
| **File Paths** | ✅ | All paths verified in codebase |
| **Task Dependencies** | ✅ | Tasks 1-6 independent, Task 7 depends on 1-6 |
| **Code Quality** | ✅ | Follows existing patterns, proper error handling |
| **Deployment Order** | ✅ | Functions then Rules then Test |

---

**Plan complete and saved to `/home/yj437/coding/css_picker/docs/superpowers/plans/2026-04-01-firestore-schema-fix.md`**

Ready to execute with Subagent-Driven approach!
