const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();

exports.handler = async function (event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const ref = db.collection("settings").doc("site");

    if (event.httpMethod === "GET") {
      const snap = await ref.get();
      if (!snap.exists || !snap.data().siteName) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: "not-set" }) };
      }
      return { statusCode: 200, headers, body: JSON.stringify({ siteName: snap.data().siteName }) };
    }

    if (event.httpMethod === "POST") {
      const { siteName } = JSON.parse(event.body || "{}");
      if (!siteName) return { statusCode: 400, headers, body: JSON.stringify({ error: "missing-name" }) };
      await ref.set({ siteName }, { merge: true });
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: "method-not-allowed" }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "server-error", message: String(err.message || err) }) };
  }
};
