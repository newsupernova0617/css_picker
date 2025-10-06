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
 * 1️⃣ Lemon Squeezy Checkout 생성
 */
exports.createCheckout = onRequest(
  {
    secrets: ["LS_API_KEY"],
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

      const apiKey = process.env.LS_API_KEY;
      if (!apiKey)
        return res.status(500).json({ error: "LS_API_KEY is missing" });

      // Checkout payload
      const payload = {
        data: {
          type: "checkouts",
          attributes: {
            checkout_data: { // checkout_data 추가
              custom: {
                firebase_uid: firebaseUid, // 여기에 UID를 넣어줘야 웹훅에서 사용 가능
              },
            },
            product_options: { redirect_url: redirectUrl },
            test_mode: !!testMode,
          },
          relationships: {
            store: { data: { type: "stores", id: String(storeId) } },
            variant: { data: { type: "variants", id: String(variantId) } },
          },
        },
      };

      const r = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
        },
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        const errText = await r.text();
        return res
          .status(r.status)
          .json({ error: "Lemon Squeezy error", detail: errText });
      }

      const data = await r.json();
      const url = data?.data?.attributes?.url;
      if (!url)
        return res.status(500).json({ error: "Checkout URL not found" });

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
 * 2️⃣ Lemon Squeezy Webhook 처리
 */
exports.handleWebhook = onRequest(
  {
    secrets: ["LS_WEBHOOK_SECRET"],
    timeoutSeconds: 30,
    rawBody: true,
    cors: ALLOWED_ORIGINS,
  },
  async (req, res) => {
    try {
      if (req.method !== "POST")
        return res.status(405).send("Method Not Allowed");

      const signature = req.header("Lemon-Squeezy-Signature");
      const payload = req.rawBody;
      if (!signature || !payload)
        return res.status(400).json({ error: "Missing signature or payload" });

      const secret = process.env.LS_WEBHOOK_SECRET;
      if (!secret)
        return res.status(500).json({ error: "LS_WEBHOOK_SECRET is missing" });

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
      const uid = data?.attributes?.custom_data?.firebase_uid;

      if (uid) {
        const userRef = db.collection("users").doc(uid);

        if (type === "order_created") {
          await userRef.set(
            {
              status: "paid",
              orderId: data.id,
              purchasedAt: data.attributes.created_at,
              updatedAt: FieldValue.serverTimestamp(),
              email: data.attributes.user_email || null,
            },
            { merge: true }
          );
        } else if (type === "order_refunded") {
          const doc = await userRef.get();
          if (doc.exists) {
            await userRef.update({
              status: "refunded",
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
        }
      }

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
