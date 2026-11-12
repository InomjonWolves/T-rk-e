// Vercel serverless function: sign-in for the Telegram Mini App.
// The site (opened inside Telegram) POSTs Telegram.WebApp.initData here. Telegram signs that string with the bot token,
// so a valid signature proves who the visitor is. The answer is a Firebase custom token for the uid "tg<telegram id>";
// the site signs in with it (signInWithCustomToken). No password, no e-mail.
// Env (set at deploy by tools/bot-deploy.js): TG_BOT_TOKEN, FB_SA_B64 — the JSON key of a dedicated service account
// that has no roles (GitHub secret TG_LOGIN_SA), base64.
const crypto = require("crypto");

const ORIGINS = ["https://turkceyol.web.app", "https://t-rk-e.web.app"];
const MAX_AGE = 24 * 3600; // seconds: an old initData string is refused

// → the Telegram user object when the signature is right and fresh, otherwise null
function verifyInitData(initData, botToken, now = Date.now()) {
  if (!initData || !botToken || String(initData).length > 4096) return null;
  let p;
  try { p = new URLSearchParams(String(initData)); } catch (e) { return null; }
  const hash = p.get("hash");
  if (!hash || !/^[0-9a-f]{64}$/.test(hash)) return null;
  const lines = [];
  for (const [k, v] of p) if (k !== "hash") lines.push(k + "=" + v);
  lines.sort();
  const secret = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const calc = crypto.createHmac("sha256", secret).update(lines.join("\n")).digest();
  if (!crypto.timingSafeEqual(calc, Buffer.from(hash, "hex"))) return null;
  const at = +p.get("auth_date") || 0;
  if (!at || now / 1000 - at > MAX_AGE || at - now / 1000 > 300) return null;
  let user;
  try { user = JSON.parse(p.get("user") || "null"); } catch (e) { return null; }
  if (!user || !Number.isSafeInteger(user.id) || user.id <= 0 || user.is_bot) return null;
  return user;
}

// A Firebase custom token (RS256 JWT signed with the service account's key), valid for one hour
function customToken(sa, uid, claims, now = Date.now()) {
  const b64 = o => Buffer.from(JSON.stringify(o)).toString("base64url");
  const iat = Math.floor(now / 1000);
  const body = b64({ alg: "RS256", typ: "JWT" }) + "." + b64({
    iss: sa.client_email, sub: sa.client_email,
    aud: "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit",
    iat, exp: iat + 3600, uid, claims
  });
  return body + "." + crypto.createSign("RSA-SHA256").update(body).sign(sa.private_key).toString("base64url");
}
const uidOf = id => "tg" + id;
const nameOf = u => [u.first_name, u.last_name].filter(Boolean).join(" ").trim().slice(0, 60) || "Telegram foydalanuvchisi";

// Pure handler (tests call it directly): → { code, body }
function auth(initData, env, now = Date.now()) {
  if (!env.TG_BOT_TOKEN || !env.FB_SA_B64) return { code: 503, body: { error: "not-configured" } };
  const user = verifyInitData(initData, env.TG_BOT_TOKEN, now);
  if (!user) return { code: 401, body: { error: "bad-init-data" } };
  let sa;
  try { sa = JSON.parse(Buffer.from(env.FB_SA_B64, "base64").toString("utf8")); } catch (e) { return { code: 503, body: { error: "not-configured" } }; }
  return { code: 200, body: { token: customToken(sa, uidOf(user.id), { tg: true }, now), uid: uidOf(user.id), name: nameOf(user) } };
}

module.exports = async (req, res) => {
  const origin = req.headers.origin || "";
  if (ORIGINS.includes(origin)) { res.setHeader("Access-Control-Allow-Origin", origin); res.setHeader("Vary", "Origin"); }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "method" }); return; }
  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch (e) { b = null; } }
  let out;
  try { out = auth(b && b.initData, process.env); } catch (e) { console.error(e); out = { code: 500, body: { error: "server" } }; }
  res.status(out.code).json(out.body);
};
Object.assign(module.exports, { verifyInitData, customToken, auth, uidOf, nameOf });
