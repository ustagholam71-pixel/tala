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
const COLLECTION = "products";

exports.handler = async function (event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    if (event.httpMethod === "GET") {
      const snap = await db.collection(COLLECTION).orderBy("createdAt", "desc").get();
      const list = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      return { statusCode: 200, headers, body: JSON.stringify(list) };
    }

    if (event.httpMethod === "POST") {
      const obj = JSON.parse(event.body || "{}");
      const id = obj.id;
      const ref = id ? db.collection(COLLECTION).doc(id) : db.collection(COLLECTION).doc();
      const data = { ...obj };
      delete data.id;
      if (!data.hasOwnProperty("comments")) data.comments = [];
      data.createdAt = Date.now();
      await ref.set(data);
      return { statusCode: 200, headers, body: JSON.stringify({ id: ref.id, ...data }) };
    }

    if (event.httpMethod === "PATCH") {
      const { id, patch } = JSON.parse(event.body || "{}");
      if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: "missing-id" }) };
      await db.collection(COLLECTION).doc(id).update(patch || {});
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    if (event.httpMethod === "DELETE") {
      const id = (event.queryStringParameters || {}).id;
      if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: "missing-id" }) };
      await db.collection(COLLECTION).doc(id).delete();
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: "method-not-allowed" }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "server-error", message: String(err.message || err) }) };
  }
};
