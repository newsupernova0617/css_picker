// Firebase Admin & Functions V2
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { onRequest, onCall } = require("firebase-functions/v2/https");
const { beforeUserCreated } = require("firebase-functions/v2/identity");
const { initializeApp } = require("firebase-admin/app");
const crypto = require("crypto");
// Using Node.js 18+ built-in fetch (available in Node 24)
const fetch = globalThis.fetch;

const admin = require("firebase-admin");
initializeApp();
const db = getFirestore();

// 허용할 CORS 도메인
const ALLOWED_ORIGINS = [
  /firebase\.com$/,
  "https://www.csspicker.site",
  "https://css-picker.firebaseapp.com",
  "https://css-picker.web.app",
  "http://localhost:5000",
  "http://localhost:3000",
  "http://127.0.0.1:5500",
  "http://127.0.0.1:3000"
];

// Subscription expires after 1 year (365 days) from purchase date
// For future multi-tier support, consider making this configurable per plan type
const SUBSCRIPTION_DURATION_MS = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds

// ============================================
// Polar.sh 환경 설정 (하드코딩)
// ============================================
const POLAR_ENV = "sandbox";

// Pre-generated Polar checkout link (created in Polar dashboard)
const POLAR_CHECKOUT_LINK_SANDBOX = "https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_4HnQ8H67tsAtbxfWhBtzS5Mh64LoPdjw9iipP2MVpdG/redirect";
const POLAR_CHECKOUT_LINK_PRODUCTION = "https://checkout.polar.sh/YOUR_PRODUCTION_CHECKOUT_LINK";

// Select based on environment
const POLAR_CHECKOUT_LINK = POLAR_ENV === "production"
  ? POLAR_CHECKOUT_LINK_PRODUCTION
  : POLAR_CHECKOUT_LINK_SANDBOX;

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

// Sandbox 환경 설정 (하드코딩)
const POLAR_SANDBOX_API_KEY = "polar_oat_H8M8NBBqTmsbJaqNETo6kgr6OEY09CwOyLBUS0eBruT";
const POLAR_SANDBOX_WEBHOOK_SECRET = "polar_whs_Qgh7Ga6cBIPgpE9zleKRMNPgz62gfWEhfE31t0qHC4T";
const POLAR_SANDBOX_PRODUCT_ID = "8957f796-eaf0-4f85-8f51-b2b344f52e28";

// Production 환경 설정 (Firebase Secrets)
const POLAR_PRODUCTION_API_KEY = process.env.POLAR_API_KEY;
const POLAR_PRODUCTION_WEBHOOK_SECRET = process.env.POLAR_WEBHOOK_SECRET;
const POLAR_PRODUCTION_PRODUCT_ID = "c4ade100-97d2-4e56-93fa-fcbcf2eeba72";

// 환경에 따라 자동 선택
const POLAR_API_BASE_URL = POLAR_ENV === "production"
  ? "https://api.polar.sh"
  : "https://sandbox-api.polar.sh";

const POLAR_API_KEY = POLAR_ENV === "production"
  ? POLAR_PRODUCTION_API_KEY
  : POLAR_SANDBOX_API_KEY;

const POLAR_WEBHOOK_SECRET = POLAR_ENV === "production"
  ? POLAR_PRODUCTION_WEBHOOK_SECRET
  : POLAR_SANDBOX_WEBHOOK_SECRET;

/**
 * 1️⃣ Polar Webhook 처리
 */
exports.handleWebhook = onRequest(
  {
    timeoutSeconds: 30,
    rawBody: true,
    cors: ALLOWED_ORIGINS,
  },
  async (req, res) => {
    try {
      if (req.method !== "POST")
        return res.status(405).send("Method Not Allowed");

      console.log("[WEBHOOK RECEIVED] Type:", typeof req.rawBody, "isBuffer:", Buffer.isBuffer(req.rawBody));

      // rawBody를 string으로 변환 (Buffer인 경우 처리)
      let payload = req.rawBody;
      if (Buffer.isBuffer(payload)) {
        payload = payload.toString("utf-8");
      } else if (typeof payload === "object") {
        // JSON 객체인 경우 다시 string으로
        payload = JSON.stringify(payload);
      }

      console.log("[WEBHOOK PAYLOAD]", {
        type: typeof payload,
        length: payload.length,
        first100chars: payload.substring(0, 100)
      });

      if (!payload)
        return res.status(400).json({ error: "Missing payload" });

      // Production 환경 검증
      if (POLAR_ENV === "production" && !POLAR_WEBHOOK_SECRET) {
        return res.status(500).json({ error: "POLAR_WEBHOOK_SECRET is missing in Firebase secrets" });
      }

      let secret = POLAR_WEBHOOK_SECRET;
      if (!secret || secret.includes("YOUR_"))
        return res.status(500).json({ error: "POLAR_WEBHOOK_SECRET is not configured" });

      // Polar secret에서 prefix 제거 (polar_whs_XXXXXX → XXXXXX)
      if (secret.startsWith("polar_whs_")) {
        secret = secret.replace("polar_whs_", "");
      }

      // Polar webhook signature verification (Standard Webhooks format)
      const webhookId = req.header("webhook-id");
      const webhookTimestamp = req.header("webhook-timestamp");
      let webhookSignature = req.header("webhook-signature");

      if (!webhookId || !webhookTimestamp || !webhookSignature) {
        return res.status(400).json({ error: "Missing webhook headers" });
      }

      // Polar signature format: v1,<signature> → remove v1, prefix
      if (webhookSignature.startsWith("v1,")) {
        webhookSignature = webhookSignature.substring(3);
      }

      const signedMessage = `${webhookId}.${webhookTimestamp}.${payload}`;
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(signedMessage)
        .digest("base64");

      console.log("[WEBHOOK DEBUG]", {
        webhookId,
        webhookTimestamp,
        payloadLength: payload.length,
        receivedSignature: webhookSignature.substring(0, 30) + "...",
        expectedSignature: expectedSignature.substring(0, 30) + "...",
        signatureMatch: webhookSignature === expectedSignature,
      });

      if (webhookSignature !== expectedSignature) {
        console.error("[WEBHOOK SIGNATURE FAILED]");
        console.error("  Received: ", webhookSignature);
        console.error("  Expected: ", expectedSignature);
        console.error("  Signed Message:", signedMessage.substring(0, 100) + "...");
        return res.status(401).json({ error: "Invalid signature" });
      }

      const event = JSON.parse(payload.toString());
      const { type, data } = event;

      // Extract firebaseUid from custom data (field path may vary)
      // Try multiple possible paths: customData, custom_data, metadata, etc.
      const uid =
        data?.customData?.firebaseUid ||
        data?.custom_data?.firebaseUid ||
        data?.metadata?.firebaseUid;

      if (!uid) {
        return res.status(400).json({ error: "Missing firebaseUid in webhook data" });
      }

      // NEW: Verify the user actually exists in Firebase
      const userRef = db.collection("users").doc(uid);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        console.warn(`[WEBHOOK] Attempted purchase for non-existent user: ${uid}`);
        return res.status(400).json({ error: "User does not exist" });
      }

      // ✨ Add this validation block
      if (!data.id) {
        console.warn("Webhook received order.created event without order ID");
        return res.status(400).json({ error: "Missing order ID in webhook data" });
      }

      // Handle order.created event (Polar format - may differ from Lemon Squeezy)
      if (type === "order.created" || type === "order_created") {
        await userRef.set(
          {
            status: "paid",
            planType: "pro",
            orderId: data.id || data.orderId,
            purchasedAt: FieldValue.serverTimestamp(),
            expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + SUBSCRIPTION_DURATION_MS)),
            updatedAt: FieldValue.serverTimestamp(),
            email: data.email || data.userEmail || null,
          },
          { merge: true }
        );
      } else if (type === "order.refunded" || type === "order_refunded") {
        // Handle refund event
        const doc = await userRef.get();
        if (doc.exists) {
          await userRef.update({
            status: "refunded",
            refundedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      }

      // Log webhook for debugging
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


exports.getOrCreateUserProfile = onCall(async (request) => {
  const { auth, data } = request;
  console.log("DEBUG auth:", auth);
  console.log("DEBUG auth type:", typeof auth);
  console.log("DEBUG auth?.uid:", auth?.uid);
  if (!auth) throw new Error("Unauthenticated");

  const uid = auth.uid;
  const userRef = db.collection("users").doc(uid);
  const doc = await userRef.get();

  if (!doc.exists) {
    // Firestore에 문서 없으면 새로 추가
    const newUser = {
      email: auth.token.email || null,
      name: auth.token.name || null,
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
    return { data: newUser };
  }

  // 이미 있으면 기존 데이터 리턴
  return { data: doc.data() };
});
