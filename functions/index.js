// Firebase Functions v6 (Gen2) + CommonJS 스타일
const { getFirestore,FieldValue  } = require("firebase-admin/firestore");
const functions = require("firebase-functions"); // 그대로 사용 가능 (v1 onCall/onRequest)
const { beforeUserCreated  } = require("firebase-functions/v2/identity"); // ← 여기만 변경
const admin = require("firebase-admin");

admin.initializeApp();
const db = getFirestore();

exports.handleBeforeUserCreated = beforeUserCreated(async (event) => {
  const user = event.data;  // 생성될 유저 데이터가 담겨 있음
  const uid = user.uid;

  // 여기서 도메인 필터링 등 검증 가능
  // 예: 이메일이 특정 도메인이 아니면 거부
  // if (!user.email || !user.email.endsWith("@example.com")) {
  //   throw new HttpsError('invalid-argument', 'Email domain not allowed');
  // }

  // Firestore에 유저 문서를 미리 생성
  await db.collection("users").doc(uid).set({
    status: "free",
    orderId: null,
    purchasedAt: null,
    updatedAt: FieldValue.serverTimestamp(),
    email: user.email || null,
  });

  // blocking 함수는 보통 반환값이 특별히 필요 없을 수도 있음
  return;
});
/**
 * 사용자 프로필 반환 (Callable Function)
 */
exports.getUserProfile = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const uid = context.auth.uid;
  const userDoc = await db.collection("users").doc(uid).get();

  if (!userDoc.exists) {
    throw new functions.https.HttpsError("not-found", "User not found in Firestore.");
  }

  const userData = userDoc.data();
  return {
    status: userData.status || "free",
    orderId: userData.orderId || null,
    purchasedAt: userData.purchasedAt || null,
    email: userData.email || null,
    updatedAt: userData.updatedAt || null,
  };
});





/**
 * Lemon Squeezy 웹훅 처리 (HTTP Function)
 */
exports.handleLemonWebhook = functions.https.onRequest(async (req, res) => {
  try {
    const event = req.body;
    const eventType = event.meta?.event_name;
    const uid = event.data?.attributes?.custom_data?.firebase_uid;

    if (!uid) {
      res.status(400).send("Missing firebase_uid in custom_data");
      return;
    }

    const userRef = db.collection("users").doc(uid);

    if (eventType === "order_created") {
      await userRef.set(
        {
          status: "paid",
          orderId: event.data.id,
          purchasedAt: event.data.attributes.created_at,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          email: event.data.attributes.user_email || null,
        },
        { merge: true }
      );
      functions.logger.info(`User ${uid} upgraded to paid.`);
    }

    if (eventType === "order_refunded") {
      await userRef.update({
        status: "refunded",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      functions.logger.info(`User ${uid} refunded, premium revoked.`);
    }

    res.status(200).send("ok");
  } catch (error) {
    functions.logger.error("Webhook handling error:", error);
    res.status(500).send("Internal Server Error");
  }
});
