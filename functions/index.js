// Firebase Admin & Functions V2
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { onRequest, onCall } = require("firebase-functions/v2/https");
const { beforeUserCreated } = require("firebase-functions/v2/identity");
const { initializeApp } = require("firebase-admin/app");
const crypto = require("crypto");
const fetch = require("node-fetch");

initializeApp();
const db = getFirestore();

// 허용할 CORS 도메인
const ALLOWED_ORIGINS = [/firebase\.com$/, "https://flutter.com", "https://www.csspicker.site","https://project-fastsaas.firebaseapp.com","https://project-fastsaas.web.app",    "http://localhost:5000",          // 로컬 개발 환경 주소 예시 (포트 번호는 실제 환경에 맞게 변경)
    "http://127.0.0.1:5500"];

/**
 * 1️⃣ Polar.sh Checkout 생성
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

      if (!firebaseUid) // UID가 없으면 에러 처리
        return res.status(400).json({ error: "firebaseUid is required" });

      const apiKey = process.env.POLAR_API_KEY;
      if (!apiKey)
        return res.status(500).json({ error: "POLAR_API_KEY is missing" });

      // Polar Checkout payload
      const payload = {
        storeId: String(storeId),
        variantId: String(variantId),
        redirectUrl: redirectUrl,
        customData: {
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
        return res
          .status(r.status)
          .json({ error: "Polar API error", detail: errText });
      }

      const data = await r.json();
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

      // Polar webhook signature verification
      // Note: Verify the exact header name from Polar docs (Polar-Signature or X-Polar-Signature)
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

      // Extract firebaseUid from custom data (field path may vary)
      // Try multiple possible paths: customData, custom_data, metadata, etc.
      const uid =
        data?.customData?.firebaseUid ||
        data?.custom_data?.firebaseUid ||
        data?.metadata?.firebaseUid;

      if (uid) {
        const userRef = db.collection("users").doc(uid);

        // Handle order.created event (Polar format - may differ from Lemon Squeezy)
        if (type === "order.created" || type === "order_created") {
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
          // Handle refund event
          const doc = await userRef.get();
          if (doc.exists) {
            await userRef.update({
              status: "refunded",
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
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
      status: "free",
      orderId: null,
      purchasedAt: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    await userRef.set(newUser);
    return newUser;
  }

  // 이미 있으면 기존 데이터 리턴
  return doc.data();
});
