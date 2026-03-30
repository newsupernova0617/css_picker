# Quick Deployment Guide - Polar.sh Migration

**TL;DR:** Code is ready. Just add credentials and deploy.

---

## Prerequisites Checklist

- [ ] Polar.sh API Key (from https://dashboard.polar.sh → Settings → API Keys)
- [ ] Polar.sh Webhook Secret (from https://dashboard.polar.sh → Webhooks)
- [ ] Firebase CLI installed (`firebase --version` shows 15.12.0+)
- [ ] Node.js 20+ installed

---

## Deploy in 5 Minutes

### 1. Set Credentials in Firebase

```bash
cd /home/yj437/coding/css_picker

# Set API key
firebase functions:config:set polar.api_key="YOUR_POLAR_API_KEY_HERE"

# Set webhook secret
firebase functions:config:set polar.webhook_secret="YOUR_POLAR_WEBHOOK_SECRET_HERE"

# Verify
firebase functions:config:get
```

### 2. Deploy Functions

```bash
firebase deploy --only functions
```

**Expected output:**
```
✔ Deploy complete!

Function URL (createCheckout):
  https://us-central1-project-fastsaas.cloudfunctions.net/createCheckout

Function URL (handleWebhook):
  https://us-central1-project-fastsaas.cloudfunctions.net/handleWebhook
```

### 3. Configure Polar.sh Webhook

1. Go to https://dashboard.polar.sh
2. Navigate to Webhooks
3. Create new webhook with endpoint:
   ```
   https://us-central1-project-fastsaas.cloudfunctions.net/handleWebhook
   ```
4. Select events: `order.created`, `order.refunded`
5. Copy and save the webhook secret
6. Verify it matches your Firebase config

### 4. Test It Works

```bash
# Check functions are deployed
firebase functions:list

# View logs
firebase functions:log --limit 20
```

---

## Verify Deployment

### Test Endpoint (createCheckout)

```bash
curl -X POST https://us-central1-project-fastsaas.cloudfunctions.net/createCheckout \
  -H "Content-Type: application/json" \
  -d '{
    "storeId": "your-store-id",
    "variantId": "your-variant-id",
    "firebaseUid": "test-user-123",
    "redirectUrl": "https://example.com/success"
  }'
```

**Expected response:**
```json
{
  "url": "https://checkout.polar.sh/..."
}
```

### Test Webhook (Via Polar Dashboard)

1. In Polar Dashboard → Webhooks → [Your Webhook]
2. Click "Send Test Event"
3. Select "order.created"
4. Firebase logs should show webhook received and processed

---

## Common Issues

### Issue: "POLAR_API_KEY is missing"
**Solution:** You didn't run step 1. Set the credentials first.

### Issue: "Invalid signature"
**Solution:** POLAR_WEBHOOK_SECRET is wrong. Verify in Polar Dashboard.

### Issue: "Checkout URL not found in Polar response"
**Solution:** Check POLAR_API_KEY is valid. Polar API may be rejecting the request.

---

## What Got Deployed

| Function | Purpose | Auth | Timeout |
|----------|---------|------|---------|
| createCheckout | Creates Polar payment links | None | 30s |
| handleWebhook | Processes payment webhooks | Signature-verified | 30s |
| getOrCreateUserProfile | Creates user profiles | Firebase Auth | 30s |

---

## Rollback (If Needed)

```bash
# Revert to previous version
git revert HEAD
firebase deploy --only functions
```

---

## Next Steps

After deployment:
1. Test extension UI (trigger checkout)
2. Complete test payment in Polar sandbox
3. Verify user status in Firestore
4. Monitor logs for errors
5. Move to Task 6: Verification testing

---

## Support

For detailed deployment steps, see: `DEPLOYMENT_CHECKLIST.md`
For code changes, see: `TASK_5_SUMMARY.md`
