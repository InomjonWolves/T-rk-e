// Daily reminders: GitHub Actions runs this every hour (.github/workflows/push.yml).
// Reads Firestore push/{uid} = { t: FCM token, h: reminder hour in UTC, z: time zone offset (min), d: last practice day, s: streak }
// and sends a notification to everyone whose hour is now and who has not practised today in their own time zone.
// Needs env SA = service account JSON with roles "Cloud Datastore User" and "Firebase Cloud Messaging API Admin".
// Dry run (no sending): DRY=1 node tools/push.js
const crypto = require("crypto");

const PROJECT = "t-rk-e";
const localDay = (now, z) => new Date(now.getTime() - z * 6e4).toISOString().slice(0, 10);
const due = (doc, now) => doc.h === now.getUTCHours() && !!doc.t && doc.d !== localDay(now, doc.z || 0);
const text = s => s > 0
  ? { title: "Seriyangiz yoʻqolmasin!", body: `${s} kun ketma-ket — bugun ham 5 daqiqa mashq qiling. Pamuk kutyapti!` }
  : { title: "Pamuk sizni kutyapti", body: "Bugun 5 daqiqa turk tili? Bir nechta soʻz — katta qadam." };
// A streak survives only if the last practice was yesterday (local time)
const streakLeft = (doc, now) => doc.d === localDay(new Date(now.getTime() - 864e5), doc.z || 0) ? doc.s || 0 : 0;

const b64 = x => Buffer.from(x).toString("base64url");
async function accessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const body = b64(JSON.stringify({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/firebase.messaging", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const sig = crypto.createSign("RSA-SHA256").update(`${head}.${body}`).sign(sa.private_key).toString("base64url");
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${head}.${body}.${sig}` });
  const j = await r.json();
  if (!j.access_token) throw new Error("token: " + JSON.stringify(j));
  return j.access_token;
}
const fromFs = f => {
  const out = {};
  Object.keys(f || {}).forEach(k => { const v = f[k]; out[k] = "integerValue" in v ? +v.integerValue : "stringValue" in v ? v.stringValue : null; });
  return out;
};
async function run(now = new Date()) {
  const sa = JSON.parse(process.env.SA || "null");
  if (!sa) { console.log("SA yoʻq — eslatmalar oʻtkazib yuborildi"); return; }
  const tok = await accessToken(sa), auth = { Authorization: "Bearer " + tok, "Content-Type": "application/json" };
  const base = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
  const q = await fetch(`${base}:runQuery`, { method: "POST", headers: auth, body: JSON.stringify({ structuredQuery: { from: [{ collectionId: "push" }], where: { fieldFilter: { field: { fieldPath: "h" }, op: "EQUAL", value: { integerValue: String(now.getUTCHours()) } } } } }) });
  const rows = (await q.json()).filter(x => x.document).map(x => Object.assign({ name: x.document.name }, fromFs(x.document.fields)));
  let sent = 0, gone = 0, skipped = 0;
  for (const doc of rows) {
    if (!due(doc, now)) { skipped++; continue; }
    const s = streakLeft(doc, now), m = text(s);
    if (process.env.DRY) { console.log("DRY", doc.name.split("/").pop(), m.title); sent++; continue; }
    const r = await fetch(`https://fcm.googleapis.com/v1/projects/${PROJECT}/messages:send`, { method: "POST", headers: auth, body: JSON.stringify({ message: { token: doc.t, webpush: { headers: { TTL: "43200", Urgency: "normal" }, data: { title: m.title, body: m.body, s: String(s), url: "./#home" } } } }) });
    if (r.ok) { sent++; continue; }
    const e = await r.text();
    // The app was removed or the permission withdrawn: forget the token
    if (r.status === 404 || /UNREGISTERED|registration-token-not-registered/.test(e)) { await fetch(`https://firestore.googleapis.com/v1/${doc.name}`, { method: "DELETE", headers: auth }); gone++; }
    else console.log("FCM", r.status, e.slice(0, 300));
  }
  console.log(`soat ${now.getUTCHours()} UTC: ${rows.length} ta yozuv, ${sent} yuborildi, ${skipped} bugun mashq qilgan, ${gone} eskirgan token oʻchirildi`);
}
module.exports = { due, text, localDay, streakLeft };
if (require.main === module) run().catch(e => { console.error(e.message); process.exit(1); });
