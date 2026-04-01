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

/**
 * 1️⃣ Polar.sh Checkout 생성 (Callable)
 */
exports.createCheckout = onCall(async (request) => {
  try {
    const { auth, data } = request;
    if (!auth) throw new Error("Unauthenticated");

    const { redirectUrl, firebaseUid } = data;

    if (!firebaseUid)
      throw new Error("firebaseUid is required");

    if (!redirectUrl)
      throw new Error("redirectUrl is required");

    const apiKey = process.env.POLAR_API_KEY;
    if (!apiKey)
      throw new Error("POLAR_API_KEY is missing");

    // 🔴 PASTE YOUR PRODUCT ID HERE 🔴
    const POLAR_PRODUCT_ID = "c4ade100-97d2-4e56-93fa-fcbcf2eeba72";

    // Get customer name from Firebase auth
    const customerName = auth.token.name || auth.token.email || "Premium User";

    // Polar Checkout payload - using correct API format
    const payload = {
      products: [POLAR_PRODUCT_ID],
      customerName: customerName,
      customerBillingAddress: {
        country: "US"
      },
      locale: "en",
      custom_data: {
        firebaseUid: firebaseUid,
      },
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
      throw new Error(`Polar API error: ${r.status} - ${errText}`);
    }

    const responseData = await r.json();
    const url = responseData?.url || responseData?.data?.url;
    if (!url)
      throw new Error("Checkout URL not found in Polar response");

    return { url };
  } catch (err) {
    const errorMessage = err?.message || "Internal server error";
    console.error("createCheckout error:", errorMessage, err);
    throw new Error(errorMessage);
  }
});

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

      // Polar webhook signature verification (Standard Webhooks format)
      const webhookId = req.header("webhook-id");
      const webhookTimestamp = req.header("webhook-timestamp");
      const webhookSignature = req.header("webhook-signature");

      if (!webhookId || !webhookTimestamp || !webhookSignature) {
        return res.status(400).json({ error: "Missing webhook headers" });
      }

      const signedMessage = `${webhookId}.${webhookTimestamp}.${payload}`;
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(signedMessage)
        .digest("base64");

      const signatureBuffer = Buffer.from(webhookSignature, "base64");
      const expectedBuffer = Buffer.from(expectedSignature, "base64");

      if (
        signatureBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
      ) {
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

      // ✨ Add this validation block
      if (!data.id) {
        console.warn("Webhook received order.created event without order ID");
        return res.status(400).json({ error: "Missing order ID in webhook data" });
      }

      const userRef = db.collection("users").doc(uid);

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
