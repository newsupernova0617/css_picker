# Polar.sh Migration - Testing Guide

**Purpose:** Document comprehensive testing procedures for the migration from Lemon Squeezy to Polar.sh

**Status:** Ready for implementation
**Last Updated:** 2026-03-30

---

## Setup: Your Firebase Project

**Project ID:** project-fastsaas (from .firebaserc)
**Region:** us-central1 (default)

Use `project-fastsaas` in all commands throughout this guide.

---

## Environment Variables Setup

### Local Testing (Firebase Emulator)

Set environment variables in terminal:

```bash
export POLAR_API_KEY="test_key_for_emulator"
export POLAR_WEBHOOK_SECRET="test_secret_for_emulator"
firebase emulators:start --only functions
```

### Production Deployment (Real Polar Credentials)

Set Firebase secrets with actual credentials:

```bash
firebase functions:config:set polar.api_key="<real-api-key-from-polar>"
firebase functions:config:set polar.webhook_secret="<real-secret-from-polar>"
firebase deploy --only functions
```

---

## Quick Start Testing

### 1. Local Firebase Emulator Testing

#### Start the Emulator
```bash
cd /home/yj437/coding/css_picker
firebase emulators:start --only functions,firestore
```

This will start:
- Cloud Functions emulator on http://localhost:5001
- Firestore emulator on http://localhost:8080
- Firebase UI on http://localhost:4000

#### Access Emulator UI
```
http://localhost:4000
```

---

## Manual Testing Procedures

### Test 1: User Registration & Profile Creation

**Objective:** Verify user profile is created in Firestore on first login

**Steps:**
1. Start the Firebase emulator
2. Open app in browser (localhost)
3. Click "Sign In" and use test Google account
4. After login, call `getOrCreateUserProfile()`

**Expected Results:**
```javascript
{
  email: "test@example.com",
  name: "Test User",
  status: "free",
  orderId: null,
  purchasedAt: null,
  createdAt: <timestamp>,
  updatedAt: <timestamp>
}
```

**Verification:**
- [ ] User document created in Firestore `users/{uid}`
- [ ] Status is "free" for new users
- [ ] All fields present
- [ ] Timestamps correct

---

### Test 2: Checkout Creation

**Objective:** Verify Polar checkout creation works correctly

#### Test 2A: Valid Checkout Request

**Request:**
```bash
curl -X POST http://localhost:5001/project-fastsaas/us-central1/createCheckout \
  -H "Content-Type: application/json" \
  -d '{
    "storeId": "test_store_123",
    "variantId": "test_variant_456",
    "redirectUrl": "https://www.csspicker.site/success",
    "firebaseUid": "test_user_123"
  }'
```

**Expected Response:**
```json
{
  "url": "https://checkout.polar.sh/checkout/test_checkout_id"
}
```

**Verification:**
- [ ] Returns 200 status code
- [ ] Response contains valid Polar checkout URL
- [ ] URL can be used to access Polar checkout page

#### Test 2B: Missing Required Fields

**Request (missing `storeId`):**
```bash
curl -X POST http://localhost:5001/project-fastsaas/us-central1/createCheckout \
  -H "Content-Type: application/json" \
  -d '{
    "variantId": "test_variant_456",
    "redirectUrl": "https://www.csspicker.site/success",
    "firebaseUid": "test_user_123"
  }'
```

**Expected Response:**
```json
{
  "error": "storeId and variantId are required"
}
```

**Verification:**
- [ ] Returns 400 status code
- [ ] Error message is clear
- [ ] Request is rejected safely

#### Test 2C: Missing Firebase UID

**Request (missing `firebaseUid`):**
```bash
curl -X POST http://localhost:5001/project-fastsaas/us-central1/createCheckout \
  -H "Content-Type: application/json" \
  -d '{
    "storeId": "test_store_123",
    "variantId": "test_variant_456",
    "redirectUrl": "https://www.csspicker.site/success"
  }'
```

**Expected Response:**
```json
{
  "error": "firebaseUid is required"
}
```

**Verification:**
- [ ] Returns 400 status code
- [ ] Firebase UID requirement is enforced

---

### Test 3: Webhook Processing

#### Test 3A: Order Creation Webhook

**Objective:** Verify order.created webhook updates Firestore correctly

**Setup:** Generate test webhook with proper signature

```bash
# Generate signature
NODE_SECRET="test_webhook_secret"
PAYLOAD='{"type":"order.created","data":{"id":"order_123","createdAt":"2026-03-30T10:00:00Z","customData":{"firebaseUid":"test_user_123"},"email":"user@example.com"}}'

SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -mac HMAC -macopt key="$NODE_SECRET" -binary | base64)

# Send webhook
curl -X POST http://localhost:5001/project-fastsaas/us-central1/handleWebhook \
  -H "Content-Type: application/json" \
  -H "Polar-Signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

**Expected Response:**
```
200 OK
Webhook received
```

**Firestore Verification:**
Check `users/test_user_123` document:
```javascript
{
  status: "paid",
  orderId: "order_123",
  purchasedAt: "2026-03-30T10:00:00Z",
  updatedAt: <current_timestamp>,
  email: "user@example.com"
}
```

**Verification Checklist:**
- [ ] Returns 200 status code
- [ ] User status updated to "paid"
- [ ] Order ID captured correctly
- [ ] Purchase timestamp recorded
- [ ] Email saved (if provided)
- [ ] Webhook logged in `webhooks/` collection

#### Test 3B: Webhook Signature Validation

**Objective:** Verify invalid signatures are rejected

**Test 3B1: Missing Signature Header**

```bash
PAYLOAD='{"type":"order.created","data":{"id":"order_123"}}'

curl -X POST http://localhost:5001/project-fastsaas/us-central1/handleWebhook \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"
```

**Expected Response:**
```json
{
  "error": "Missing signature header"
}
```

**Verification:**
- [ ] Returns 400 status code
- [ ] Request rejected safely

**Test 3B2: Invalid Signature**

```bash
PAYLOAD='{"type":"order.created","data":{"id":"order_123"}}'
INVALID_SIGNATURE="invalid_base64_signature_here"

curl -X POST http://localhost:5001/project-fastsaas/us-central1/handleWebhook \
  -H "Content-Type: application/json" \
  -H "Polar-Signature: $INVALID_SIGNATURE" \
  -d "$PAYLOAD"
```

**Expected Response:**
```json
{
  "error": "Invalid signature"
}
```

**Verification:**
- [ ] Returns 401 status code (Unauthorized)
- [ ] Invalid signatures always rejected

#### Test 3C: Order Refund Webhook

**Objective:** Verify order.refunded webhook updates user status

**Setup:** First create a paid user

```bash
# 1. Send order.created webhook (as in Test 3A)
# 2. Verify user status is "paid"

# 3. Send refund webhook
PAYLOAD='{"type":"order.refunded","data":{"id":"order_123","customData":{"firebaseUid":"test_user_123"}}}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -mac HMAC -macopt key="test_webhook_secret" -binary | base64)

curl -X POST http://localhost:5001/project-fastsaas/us-central1/handleWebhook \
  -H "Content-Type: application/json" \
  -H "Polar-Signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

**Expected Response:**
```
200 OK
Webhook received
```

**Firestore Verification:**
Check `users/test_user_123` document:
```javascript
{
  status: "refunded",
  updatedAt: <current_timestamp>,
  // ... other fields unchanged
}
```

**Verification Checklist:**
- [ ] Returns 200 status code
- [ ] User status updated to "refunded"
- [ ] Other user data preserved
- [ ] Webhook logged correctly

---

## Automated Testing Scripts

### Firebase Emulator Unit Tests

Create file: `functions/test.js`

```javascript
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const crypto = require("crypto");
const fetch = require("node-fetch");

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// Test Suite: createCheckout
describe("createCheckout", () => {
  test("should return 400 if storeId is missing", async () => {
    const response = await fetch("http://localhost:5001/project-fastsaas/us-central1/createCheckout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        variantId: "test_variant_456",
        redirectUrl: "https://www.csspicker.site/success",
        firebaseUid: "test_user_123"
      })
    });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("storeId");
  });

  test("should return 400 if variantId is missing", async () => {
    const response = await fetch("http://localhost:5001/project-fastsaas/us-central1/createCheckout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeId: "test_store_123",
        redirectUrl: "https://www.csspicker.site/success",
        firebaseUid: "test_user_123"
      })
    });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("variantId");
  });

  test("should return 400 if firebaseUid is missing", async () => {
    const response = await fetch("http://localhost:5001/project-fastsaas/us-central1/createCheckout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeId: "test_store_123",
        variantId: "test_variant_456",
        redirectUrl: "https://www.csspicker.site/success"
      })
    });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("firebaseUid");
  });

  test("should return 200 with checkout URL for valid request", async () => {
    const response = await fetch("http://localhost:5001/project-fastsaas/us-central1/createCheckout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeId: "test_store_123",
        variantId: "test_variant_456",
        redirectUrl: "https://www.csspicker.site/success",
        firebaseUid: "test_user_123"
      })
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.url).toBeDefined();
    expect(data.url).toContain("checkout.polar.sh");
  });
});

// Test Suite: handleWebhook
describe("handleWebhook", () => {
  test("should reject webhook without signature", async () => {
    const payload = JSON.stringify({
      type: "order.created",
      data: { id: "order_123" }
    });

    const response = await fetch("http://localhost:5001/project-fastsaas/us-central1/handleWebhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload
    });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("signature");
  });

  test("should reject webhook with invalid signature", async () => {
    const payload = JSON.stringify({
      type: "order.created",
      data: { id: "order_123" }
    });

    const response = await fetch("http://localhost:5001/project-fastsaas/us-central1/handleWebhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Polar-Signature": "invalid_signature_here"
      },
      body: payload
    });
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toContain("Invalid signature");
  });

  test("should process order.created event and update user status", async () => {
    const payload = JSON.stringify({
      type: "order.created",
      data: {
        id: "order_test_123",
        createdAt: "2026-03-30T10:00:00Z",
        customData: { firebaseUid: "test_user_webhook" },
        email: "test@example.com"
      }
    });

    const secret = "test_webhook_secret_for_emulator";
    const signature = crypto.createHmac("sha256", secret).update(payload).digest("base64");

    const response = await fetch("http://localhost:5001/project-fastsaas/us-central1/handleWebhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Polar-Signature": signature
      },
      body: payload
    });
    expect(response.status).toBe(200);

    // Verify Firestore update
    const userDoc = await db.collection("users").doc("test_user_webhook").get();
    expect(userDoc.data().status).toBe("paid");
    expect(userDoc.data().orderId).toBe("order_test_123");
  });

  test("should process order.refunded event and update user status", async () => {
    const payload = JSON.stringify({
      type: "order.refunded",
      data: {
        id: "order_test_123",
        customData: { firebaseUid: "test_user_webhook" }
      }
    });

    const secret = "test_webhook_secret_for_emulator";
    const signature = crypto.createHmac("sha256", secret).update(payload).digest("base64");

    const response = await fetch("http://localhost:5001/project-fastsaas/us-central1/handleWebhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Polar-Signature": signature
      },
      body: payload
    });
    expect(response.status).toBe(200);

    // Verify Firestore update
    const userDoc = await db.collection("users").doc("test_user_webhook").get();
    expect(userDoc.data().status).toBe("refunded");
  });

  test("should log webhook to Firestore", async () => {
    const payload = JSON.stringify({
      type: "order.created",
      data: { id: "order_log_test" }
    });

    const secret = "test_webhook_secret_for_emulator";
    const signature = crypto.createHmac("sha256", secret).update(payload).digest("base64");

    await fetch("http://localhost:5001/project-fastsaas/us-central1/handleWebhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Polar-Signature": signature
      },
      body: payload
    });

    // Verify webhook logged
    const webhooks = await db.collection("webhooks").where("eventId", "==", "order_log_test").get();
    expect(webhooks.size).toBeGreaterThan(0);
  });
});

// Test Suite: Signature Verification
describe("Signature Verification", () => {
  test("should correctly verify HMAC-SHA256 signature", async () => {
    const payload = JSON.stringify({ test: "data" });
    const secret = "test_secret";
    const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("base64");

    // Verify the signature format
    expect(expectedSignature).toBeDefined();
    expect(typeof expectedSignature).toBe("string");

    // Verify it's valid base64
    expect(Buffer.from(expectedSignature, "base64").toString("base64")).toBe(expectedSignature);
  });

  test("should use timing-safe comparison", async () => {
    const secret = "test_secret";
    const payload = JSON.stringify({ test: "data" });
    const correctSignature = crypto.createHmac("sha256", secret).update(payload).digest("base64");
    const wrongSignature = "invalid_signature";

    // Both signatures should be compared safely (no timing attacks)
    // The function should reject the wrong signature consistently
    const response = await fetch("http://localhost:5001/project-fastsaas/us-central1/handleWebhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Polar-Signature": wrongSignature
      },
      body: payload
    });
    expect(response.status).toBe(401);
  });
});
```

### Example: Simple Webhook Test with curl

```javascript
// Example: Simple webhook test with curl
const TEST_SECRET = "test_webhook_secret_for_emulator";
const PAYLOAD = JSON.stringify({
  type: "order.created",
  data: {
    id: "test_order_123",
    customData: { firebaseUid: "test_user_123" },
    email: "test@example.com",
    createdAt: new Date().toISOString()
  }
});

// Generate signature
const signature = require('crypto')
  .createHmac('sha256', TEST_SECRET)
  .update(PAYLOAD)
  .digest('base64');

// Test webhook (emulator)
curl -X POST http://localhost:5001/project-fastsaas/us-central1/handleWebhook \
  -H "Content-Type: application/json" \
  -H "Polar-Signature: $signature" \
  -d "$PAYLOAD"

// Expected: 200 OK response with "Webhook received"
```

---

## Integration Testing with Polar.sh Test Environment

### Prerequisites
1. Create Polar.sh test account
2. Generate test API credentials
3. Set up test store and product variant

### Test Procedures

#### Test 1: Full Checkout Flow (Test Mode)

**Steps:**
1. Set environment variables with test credentials:
   ```bash
   export POLAR_API_KEY="test_pk_..."
   export POLAR_WEBHOOK_SECRET="test_secret_..."
   ```

2. Deploy to Firebase emulator or staging environment

3. Navigate to app and click "Premium"

4. On Polar checkout page:
   - Use test payment method (4242 4242 4242 4242)
   - Enter any future expiration date
   - Complete payment

5. Verify redirect to success page

6. Check Firestore for user status update

#### Test 2: Webhook Delivery (Test Mode)

**Steps:**
1. In Polar Dashboard → Webhooks
2. Set endpoint to deployed function URL
3. Configure events: `order.created`, `order.refunded`
4. Send test webhook
5. Verify webhook is received and processed
6. Check Firebase logs for any errors

#### Test 3: Refund Processing (Test Mode)

**Steps:**
1. Complete a test payment (from Test 1)
2. In Polar Dashboard → Orders
3. Select the test order
4. Click "Refund"
5. Verify webhook is sent for refund event
6. Check Firestore user status changed to "refunded"

---

## Error Scenario Testing

### Scenario 1: API Key Invalid/Expired

**Setup:**
1. Set POLAR_API_KEY to invalid value
2. Request checkout creation

**Expected:**
- [ ] Returns 500 error
- [ ] Error message indicates Polar API error
- [ ] Log shows API error details

### Scenario 2: Webhook Secret Mismatch

**Setup:**
1. Webhook arrives with wrong secret
2. System verifies signature

**Expected:**
- [ ] Returns 401 Unauthorized
- [ ] Webhook NOT processed
- [ ] No Firestore changes

### Scenario 3: Firestore Write Failure

**Setup:**
1. Firestore temporarily unavailable
2. Webhook arrives

**Expected:**
- [ ] Returns 500 error
- [ ] Error message indicates database error
- [ ] Log shows connection error
- [ ] Can retry after service restored

### Scenario 4: Malformed Event Data

**Setup:**
1. Webhook arrives with incomplete data
2. Missing customData.firebaseUid

**Expected:**
- [ ] Webhook still marked as received (200)
- [ ] Webhook logged to Firestore
- [ ] No Firestore user update (uid not found)
- [ ] Log shows handling of missing uid

---

## Performance Testing

### Load Testing Checklist

Test with multiple concurrent requests:

- [ ] 10 concurrent checkout requests
  - Expected: All succeed within 5 seconds
  - Monitor Firebase function duration

- [ ] 10 concurrent webhook events
  - Expected: All processed within 2 seconds
  - Monitor Firebase function duration
  - Check Firestore write latency

- [ ] Monitor function execution times
  - createCheckout: Target < 2 seconds
  - handleWebhook: Target < 1 second

---

## Production Testing Before Deployment

### Pre-Production Checklist

Before deploying to production:

- [ ] Run all manual tests
- [ ] Run all automated tests
- [ ] Verify error handling
- [ ] Check Firebase function logs
- [ ] Review Firestore data
- [ ] Confirm CORS settings
- [ ] Verify environment variables
- [ ] Load test with expected volume

### Staging Environment Testing

```bash
# Deploy to staging project
firebase deploy --only functions --project=project-fastsaas-staging

# Run full test suite
npm test

# Monitor logs
firebase functions:log --project=project-fastsaas-staging
```

---

## Monitoring & Logging

### Key Metrics to Monitor

**createCheckout:**
- Success rate (should be 95%+)
- Response time (should be < 2s)
- API error rate
- Authentication failures

**handleWebhook:**
- Webhook processing rate
- Signature verification failures
- Firestore update latency
- Error rate

### Logs to Check

```bash
# View function logs
firebase functions:log

# View specific function
firebase functions:log --function=createCheckout

# Follow logs in real-time
firebase functions:log --follow
```

### Firestore Queries for Verification

```javascript
// Check paid users
db.collection("users").where("status", "==", "paid").get()

// Check refunded users
db.collection("users").where("status", "==", "refunded").get()

// View all webhooks
db.collection("webhooks").get()

// Check recent webhooks
db.collection("webhooks")
  .orderBy("receivedAt", "desc")
  .limit(10)
  .get()
```

---

## Troubleshooting Guide

### Issue: Checkout creation returns 500 error

**Possible Causes:**
1. POLAR_API_KEY not set
2. POLAR_API_KEY invalid/expired
3. Polar API endpoint unreachable
4. Invalid payload format

**Debug Steps:**
1. Check function logs for error message
2. Verify POLAR_API_KEY is set: `firebase functions:config:get`
3. Test Polar API directly with curl
4. Check Firebase function timeout settings

### Issue: Webhook not processed

**Possible Causes:**
1. Webhook endpoint not configured in Polar
2. Signature verification failing
3. POLAR_WEBHOOK_SECRET not set
4. Event not matching expected types

**Debug Steps:**
1. Check webhook configuration in Polar Dashboard
2. Verify webhook is being sent (check Polar webhook logs)
3. Check Firebase function logs for signature errors
4. Verify POLAR_WEBHOOK_SECRET is set
5. Check event type in webhook payload

### Issue: Firestore not updating after payment

**Possible Causes:**
1. Firebase UID not in webhook payload
2. Firestore rules preventing updates
3. User document doesn't exist yet
4. Webhook event type not recognized

**Debug Steps:**
1. Check webhook content in `webhooks/` collection
2. Verify `customData.firebaseUid` is present
3. Check Firestore security rules
4. Verify event type (`order.created` vs `order_created`)
5. Check Firebase function error logs

---

## Test Data & Fixtures

### Sample Test User

```javascript
{
  uid: "test_user_123",
  email: "test@example.com",
  name: "Test User",
  status: "free",
  orderId: null,
  purchasedAt: null,
  createdAt: <timestamp>,
  updatedAt: <timestamp>
}
```

### Sample Checkout Request

```json
{
  "storeId": "store_test_123",
  "variantId": "variant_test_456",
  "redirectUrl": "https://www.csspicker.site/success",
  "firebaseUid": "test_user_123"
}
```

### Sample order.created Webhook

```json
{
  "type": "order.created",
  "data": {
    "id": "order_test_789",
    "createdAt": "2026-03-30T10:00:00Z",
    "email": "user@example.com",
    "customData": {
      "firebaseUid": "test_user_123"
    }
  }
}
```

### Sample order.refunded Webhook

```json
{
  "type": "order.refunded",
  "data": {
    "id": "order_test_789",
    "customData": {
      "firebaseUid": "test_user_123"
    }
  }
}
```

---

## Testing Timeline

### Before Production Deployment

| Phase | Duration | Tasks |
|-------|----------|-------|
| Unit Testing | 1-2 hours | Run automated tests, fix any issues |
| Manual Testing | 2-3 hours | Test all user flows, error scenarios |
| Integration Testing | 1-2 hours | Test with Polar test environment |
| Performance Testing | 1 hour | Load test, check metrics |
| Staging Testing | 4-8 hours | Deploy to staging, full test suite |
| **Total** | **1 day** | Ready for production |

### Post-Deployment Monitoring

| Phase | Duration | Tasks |
|-------|----------|-------|
| Immediate Monitoring | 24 hours | Watch logs, monitor errors |
| Extended Monitoring | 7 days | Verify no issues, stable operation |
| **Stabilization** | **1 week** | Production stable, ready for promotion |

---

## Sign-Off Checklist

Before declaring migration complete:

- [ ] All code changes verified
- [ ] All tests passing
- [ ] Manual testing complete
- [ ] Error scenarios tested
- [ ] Performance acceptable
- [ ] Logs reviewed
- [ ] Security verified
- [ ] Documentation complete
- [ ] Rollback plan in place
- [ ] Team trained on new system

---

**Document Created:** 2026-03-30
**Last Updated:** 2026-03-30
**Status:** Ready for Implementation ✅
