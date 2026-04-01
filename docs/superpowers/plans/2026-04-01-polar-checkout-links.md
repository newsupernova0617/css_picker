# Polar Checkout Links Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace dynamic Polar checkout API calls with static pre-generated checkout links, simplifying the backend while maintaining proper user authentication and payment verification.

**Architecture:** 
- Frontend: Firebase-authenticated users click "Buy" button → redirected to static Polar checkout link with `?uid=USER_UID` query parameter
- Backend: Replace `createCheckout()` function with simple `getCheckoutLink()` that returns the pre-generated link
- Webhook handler: Keep existing signature verification, add user existence validation to prevent fake records
- Security: Polar's signature verification + Firebase token + user document validation ensure legitimacy

**Tech Stack:** Firebase Cloud Functions, Polar.sh API, Firebase Auth, Firestore

---

## File Structure

**Files to modify:**
1. `functions/index.js` - Backend: remove `createCheckout()`, add `getCheckoutLink()`, update webhook
2. `css_picker/css_picker/planManager.js` - Frontend: update `redirectToCheckout()` method
3. No new files needed

**Files to create (optional, for testing):**
- Manual test documentation (README notes)

---

### Task 1: Get your Polar checkout link from the dashboard

**Files:**
- No code changes (information gathering)

**Context:** You need the pre-generated static checkout link from Polar's dashboard. This link is created once and reused for all users.

- [ ] **Step 1: Get your checkout link from Polar**

Go to [Polar Dashboard](https://polar.sh/dashboard) (sandbox for testing):
1. Log in to your Polar sandbox account
2. Navigate to **Products** → select your product (CSS Picker Premium)
3. Look for a **Checkout Links** section (or similar)
4. Copy the pre-generated checkout link (should look like: `https://checkout.polar.sh/...` or similar)
5. Save it somewhere safe — you'll need it in Task 2

**Expected result:** You have a link that looks like:
```
https://checkout.polar.sh/YOUR_PRESET_CHECKOUT_ID
```

---

### Task 2: Update the backend - Remove `createCheckout` function

**Files:**
- Modify: `functions/index.js:61-128`

**Context:** The `createCheckout` function is no longer needed because you're using a pre-generated link instead of creating dynamic checkouts.

- [ ] **Step 1: Delete the `createCheckout` function**

Open `functions/index.js` and delete lines 61-128 (the entire `createCheckout` function). The function starts with:
```javascript
exports.createCheckout = onCall(async (request) => {
```

And ends with:
```javascript
});
```

**Why:** This function called Polar's API to create a checkout. With a static link, you don't need this API call anymore — it simplifies your backend.

- [ ] **Step 2: Verify deletion**

Run:
```bash
cd /home/yj437/coding/css_picker/functions
grep -n "createCheckout" index.js
```

Expected: No results (the function is deleted)

- [ ] **Step 3: Commit**

```bash
git add functions/index.js
git commit -m "feat: remove createCheckout function - switching to static Polar checkout links"
```

---

### Task 3: Add environment variable for your checkout link

**Files:**
- Modify: `functions/index.js` (add new constant near line 32)

**Context:** Store your Polar checkout link as a constant so it's easy to find and update later.

- [ ] **Step 1: Add the checkout link constant**

After line 32 (after `const POLAR_ENV = "sandbox";`), add:

```javascript
// Pre-generated Polar checkout link (created in Polar dashboard)
const POLAR_CHECKOUT_LINK_SANDBOX = "https://checkout.polar.sh/YOUR_SANDBOX_CHECKOUT_LINK";
const POLAR_CHECKOUT_LINK_PRODUCTION = "https://checkout.polar.sh/YOUR_PRODUCTION_CHECKOUT_LINK";

// Select based on environment
const POLAR_CHECKOUT_LINK = POLAR_ENV === "production"
  ? POLAR_CHECKOUT_LINK_PRODUCTION
  : POLAR_CHECKOUT_LINK_SANDBOX;
```

**Replace:**
- `YOUR_SANDBOX_CHECKOUT_LINK` with your actual sandbox checkout link (the one you got in Task 1)
- `YOUR_PRODUCTION_CHECKOUT_LINK` with your production link (get this later or use the same for now)

**Why:** This makes it easy to reference the link in your new function and update it without searching through code.

- [ ] **Step 2: Verify the constant is added**

Run:
```bash
grep -n "POLAR_CHECKOUT_LINK" functions/index.js | head -5
```

Expected output shows 3-4 lines with `POLAR_CHECKOUT_LINK` defined.

- [ ] **Step 3: Commit**

```bash
git add functions/index.js
git commit -m "feat: add Polar checkout link constants for sandbox and production"
```

---

### Task 4: Add `getCheckoutLink` function

**Files:**
- Modify: `functions/index.js` (add after line 60, where `createCheckout` used to be)

**Context:** This new function simply returns the pre-generated checkout link to your frontend. It's much simpler than `createCheckout` because it doesn't call any external APIs.

- [ ] **Step 1: Write the new function**

After the `POLAR_CHECKOUT_LINK` constant, add this new function (replacing the old `createCheckout`):

```javascript
/**
 * 1️⃣ Get Polar Checkout Link (Callable)
 * 
 * Returns the pre-generated checkout link to the frontend.
 * The frontend will redirect users to this link with their UID as a query parameter.
 */
exports.getCheckoutLink = onCall(async (request) => {
  try {
    const { auth } = request;
    
    // Verify user is authenticated
    if (!auth) {
      throw new Error("Unauthenticated");
    }

    // Return the pre-generated checkout link
    // Frontend will append ?uid=USER_UID to track which user made the purchase
    return { 
      url: POLAR_CHECKOUT_LINK,
      message: "Checkout link retrieved successfully"
    };
  } catch (err) {
    const errorMessage = err?.message || "Internal server error";
    console.error("getCheckoutLink error:", errorMessage, err);
    throw new Error(errorMessage);
  }
});
```

**Why this works:**
1. It checks the user is logged in (Firebase token required)
2. It returns the pre-generated checkout link
3. The frontend will add `?uid=USER_UID` to track which user started checkout
4. When Polar sends the webhook, you extract the UID to update the correct user

- [ ] **Step 2: Verify the function syntax is correct**

Run:
```bash
node -c functions/index.js
```

Expected: No output (syntax is valid)

- [ ] **Step 3: Commit**

```bash
git add functions/index.js
git commit -m "feat: add getCheckoutLink function to return pre-generated checkout link"
```

---

### Task 5: Update webhook handler - Add user existence check

**Files:**
- Modify: `functions/index.js:235-250` (inside `handleWebhook`, after the firebaseUid extraction)

**Context:** Currently, the webhook handler updates Firestore whenever a payment is made. We should verify the user actually exists before creating/updating their record, to prevent someone from crafting a fake webhook with a random UID.

- [ ] **Step 1: Find the user existence check location**

Look at your `handleWebhook` function around line 235 where the firebaseUid is extracted:

```javascript
const uid =
  data?.customData?.firebaseUid ||
  data?.custom_data?.firebaseUid ||
  data?.metadata?.firebaseUid;

if (!uid) {
  return res.status(400).json({ error: "Missing firebaseUid in webhook data" });
}
```

- [ ] **Step 2: Add user existence validation**

After the UID extraction (after line 233), add this check:

```javascript
// NEW: Verify the user actually exists in Firebase
const userRef = db.collection("users").doc(uid);
const userDoc = await userRef.get();

if (!userDoc.exists) {
  console.warn(`[WEBHOOK] Attempted purchase for non-existent user: ${uid}`);
  return res.status(400).json({ error: "User does not exist" });
}
```

**Why:** This ensures only real, logged-in users can trigger payment updates. Someone can't craft a fake webhook with a random UID and create ghost accounts.

- [ ] **Step 3: View the full webhook handler to verify placement**

Read the file:
```bash
sed -n '238,270p' functions/index.js
```

You should see the user existence check right after the firebaseUid is extracted, before the type check (`if (type === "order.created"...`).

- [ ] **Step 4: Verify syntax**

```bash
node -c functions/index.js
```

Expected: No output (syntax is valid)

- [ ] **Step 5: Commit**

```bash
git add functions/index.js
git commit -m "feat: add user existence validation in webhook handler to prevent fake payments"
```

---

### Task 6: Update frontend - Modify `planManager.redirectToCheckout()`

**Files:**
- Modify: `css_picker/css_picker/planManager.js:86-88`

**Context:** The current `redirectToCheckout()` opens a static Firebase page. We need to update it to call your new `getCheckoutLink()` function and redirect with the user's UID.

- [ ] **Step 1: Update the redirectToCheckout method**

Replace lines 86-88 in `planManager.js`:

**Old code:**
```javascript
async redirectToCheckout() {
  chrome.tabs.create({ url: 'https://project-fastsaas.firebaseapp.com/pricing' });
}
```

**New code:**
```javascript
async redirectToCheckout() {
  try {
    // Get the pre-generated checkout link from backend
    const functions = firebase.functions();
    const getCheckoutLink = functions.httpsCallable('getCheckoutLink');
    const result = await getCheckoutLink();
    
    if (!result.data || !result.data.url) {
      throw new Error("Failed to get checkout link");
    }

    // Get current user's UID
    const user = firebase.auth().currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Redirect to checkout with user's UID as query parameter
    // Polar will show the checkout page, and we'll get a webhook after payment
    const checkoutUrl = `${result.data.url}?uid=${user.uid}`;
    chrome.tabs.create({ url: checkoutUrl });
  } catch (error) {
    console.error("Error redirecting to checkout:", error);
    alert("Could not open checkout. Please try again.");
  }
}
```

**Why this works:**
1. Calls your new `getCheckoutLink()` backend function
2. Gets the user's Firebase UID
3. Appends the UID as a query parameter (`?uid=USER_UID`)
4. Opens the Polar checkout page in a new tab
5. When payment completes, Polar sends a webhook with the user's UID

- [ ] **Step 2: Verify the method is updated**

Run:
```bash
grep -A 20 "async redirectToCheckout" css_picker/css_picker/planManager.js | head -25
```

You should see the `getCheckoutLink()` call and the query parameter appending.

- [ ] **Step 3: Verify syntax**

```bash
node -c css_picker/css_picker/planManager.js
```

Expected: No output (syntax is valid)

- [ ] **Step 4: Commit**

```bash
git add css_picker/css_picker/planManager.js
git commit -m "feat: update redirectToCheckout to use static checkout link with user UID"
```

---

### Task 7: Manual test in sandbox

**Files:**
- No code changes (testing)

**Context:** Test that the flow works end-to-end before deploying to production.

- [ ] **Step 1: Ensure you're in sandbox mode**

Check `functions/index.js` line 33:
```javascript
const POLAR_ENV = "sandbox";
```

It should say `"sandbox"`, not `"production"`.

- [ ] **Step 2: Deploy functions to Firebase**

```bash
cd /home/yj437/coding/css_picker/functions
firebase deploy --only functions
```

Expected output: Functions deployed successfully

- [ ] **Step 3: Test in browser**

1. Open your extension in Chrome
2. Click the "Buy" / "Upgrade" button
3. Verify you're redirected to the Polar checkout page with your UID in the URL
4. **DO NOT complete a real payment** — just verify the URL looks correct

Expected URL pattern:
```
https://checkout.polar.sh/YOUR_CHECKOUT_ID?uid=<your-firebase-uid>
```

- [ ] **Step 4: Check Firebase logs**

```bash
firebase functions:log
```

Look for logs from `getCheckoutLink` showing it was called successfully.

Expected: You should see entries like:
```
getCheckoutLink called
Checkout link retrieved successfully
```

- [ ] **Step 5: Document results**

Create a test note:
```bash
cat > TEST_RESULTS.md << 'EOF'
# Checkout Links Migration - Test Results

## Sandbox Testing - [DATE]

### Setup
- Environment: sandbox
- Polar checkout link: [your link]
- Firebase project: css-picker

### Test Results
- [ ] Extension loaded without errors
- [ ] "Buy" button redirects to Polar checkout
- [ ] URL includes user UID query parameter
- [ ] Firebase logs show getCheckoutLink being called
- [ ] No errors in Chrome DevTools console

### Notes
[Add any observations here]
EOF
```

- [ ] **Step 6: Final check - Review all changes**

```bash
git log --oneline -10
```

You should see 5 commits:
1. "remove createCheckout function"
2. "add Polar checkout link constants"
3. "add getCheckoutLink function"
4. "add user existence validation in webhook handler"
5. "update redirectToCheckout to use static checkout link"

- [ ] **Step 7: Commit test results**

```bash
git add TEST_RESULTS.md
git commit -m "docs: add sandbox testing results for checkout links migration"
```

---

## Summary of Changes

| Component | Change | Why |
|-----------|--------|-----|
| Backend | Removed `createCheckout()` | No longer need dynamic checkout creation |
| Backend | Added `getCheckoutLink()` | Simple function to return pre-generated link |
| Backend | Added webhook user validation | Prevent fake payments from non-existent users |
| Frontend | Updated `redirectToCheckout()` | Redirect to static link with user's UID |
| Environment | Added checkout link constants | Easy to update links without code search |

---

## Security Verification Checklist

- ✅ Only logged-in users can access checkout (Firebase token required)
- ✅ User's UID passed via URL query parameter (visible but not a security issue)
- ✅ Polar signature verification prevents fake webhooks
- ✅ User existence check prevents ghost account creation
- ✅ Firebase UID cannot be spoofed (Polar controls actual payment, not URL param)

---

## Next Steps After Implementation

1. **Production Deployment:**
   - Get production Polar checkout link
   - Update `POLAR_CHECKOUT_LINK_PRODUCTION` constant
   - Change `POLAR_ENV` to `"production"`
   - Deploy to production Firebase

2. **Monitoring:**
   - Watch webhook logs for user creation
   - Monitor payment success rate
   - Check for any "Missing firebaseUid" errors

3. **Cleanup:**
   - Remove any old pricing page code if it exists
   - Update documentation to mention the new flow
