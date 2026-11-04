// Deploys @TurkceYolBot to Vercel and points the Telegram webhook at it (.github/workflows/telegram-bot-deploy.yml).
//   1. assembles a folder: bot/ (function + vercel.json) + tools/telegram*.js, quiz.js + content.js, lugat.js, grammar-ex.js
//   2. `vercel deploy --prod` (project "turkceyol-bot"), TG_SECRET as the function's env
//   3. turns off Vercel login protection (Telegram must reach the URL), finds the production *.vercel.app domain
//   4. checks the function: with the secret → a reply, without → 401
//   5. setWebhook (secret_token = TG_SECRET)
// Needs VERCEL_TOKEN and TELEGRAM_BOT_TOKEN.
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { hookSecret } = require("./telegram-bot.js");
const { api } = require("./telegram.js");

const ROOT = path.resolve(__dirname, "..");
const NAME = "turkceyol-bot";
const VT = process.env.VERCEL_TOKEN, TT = process.env.TELEGRAM_BOT_TOKEN;

function assemble(base = process.env.RUNNER_TEMP || os.tmpdir()) {
  const dir = path.join(base, NAME);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(path.join(dir, "api"), { recursive: true });
  fs.mkdirSync(path.join(dir, "tools"), { recursive: true });
  const cp = (from, to) => fs.copyFileSync(path.join(ROOT, from), path.join(dir, to || from));
  cp("bot/api/telegram.js", "api/telegram.js"); cp("bot/vercel.json", "vercel.json"); cp("bot/package.json", "package.json");
  ["telegram.js", "telegram-bot.js", "quiz.js"].forEach(f => cp("tools/" + f));
  ["content.js", "lugat.js", "grammar-ex.js"].forEach(f => cp(f));
  return dir;
}
async function vapi(p, opt = {}, team) {
  const url = "https://api.vercel.com" + p + (team ? (p.includes("?") ? "&" : "?") + "teamId=" + team : "");
  const r = await fetch(url, Object.assign({}, opt, { headers: { Authorization: "Bearer " + VT, "Content-Type": "application/json" } }));
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Vercel ${p}: ${r.status} ${JSON.stringify(j.error || j).slice(0, 300)}`);
  return j;
}
async function main() {
  if (!VT || !TT) { console.log("VERCEL_TOKEN yoki TELEGRAM_BOT_TOKEN yoʻq"); return; }
  const secret = hookSecret(TT);
  console.log("::add-mask::" + secret);
  const dir = assemble();
  console.log("Vercel'ga joylanmoqda…");
  const out = execFileSync("npx", ["--yes", "vercel@latest", "deploy", "--prod", "--yes", "--token", VT, "-e", "TG_SECRET=" + secret], { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
  const depUrl = (out.match(/https:\/\/\S+\.vercel\.app/g) || []).pop();
  const link = JSON.parse(fs.readFileSync(path.join(dir, ".vercel/project.json"), "utf8"));
  const team = /^team_/.test(link.orgId) ? link.orgId : null;
  console.log("Joylandi:", depUrl, "loyiha", link.projectId);
  // Telegram cannot log in to Vercel: the bot URL must be public (the function itself checks TG_SECRET)
  await vapi(`/v9/projects/${link.projectId}`, { method: "PATCH", body: JSON.stringify({ ssoProtection: null, passwordProtection: null }) }, team)
    .catch(e => console.log("Himoyani oʻchirib boʻlmadi:", e.message));
  const doms = await vapi(`/v9/projects/${link.projectId}/domains`, {}, team);
  const names = (doms.domains || []).map(d => d.name).filter(n => n.endsWith(".vercel.app"));
  const host = names.sort((a, b) => a.length - b.length)[0];
  if (!host) throw new Error("Production domeni topilmadi: " + JSON.stringify(doms).slice(0, 300));
  const hook = `https://${host}/api/telegram`;
  console.log("Bot manzili:", hook);
  // Self-check (a fresh deployment may need a few seconds)
  const upd = { update_id: 1, message: { message_id: 1, date: Math.floor(Date.now() / 1000), chat: { id: 1, type: "private" }, text: "kitap" } };
  let ok = false, last = "";
  for (let i = 0; i < 6 && !ok; i++) {
    if (i) await new Promise(r => setTimeout(r, 5000));
    try {
      const r = await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json", "X-Telegram-Bot-Api-Secret-Token": secret }, body: JSON.stringify(upd) });
      last = r.status + " " + (await r.text()).slice(0, 200);
      const j = JSON.parse(last.slice(4));
      ok = r.status === 200 && j.method === "sendMessage" && /kitob/.test(j.text);
    } catch (e) { last = last || e.message; }
  }
  if (!ok) throw new Error("Funksiya javob bermadi: " + last);
  const bad = await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(upd) });
  if (bad.status !== 401) throw new Error("Kalitsiz soʻrov rad etilmadi: " + bad.status);
  console.log("Funksiya ishlayapti ✔");
  await api(TT, "setWebhook", { url: hook, secret_token: secret, allowed_updates: ["message"], max_connections: 20 });
  const info = await api(TT, "getWebhookInfo");
  console.log("Webhook:", info.url, "| kutayotgan xabarlar:", info.pending_update_count, info.last_error_message ? "| oxirgi xato: " + info.last_error_message : "");
}
module.exports = { assemble };
if (require.main === module) main().catch(e => { console.error(e.message); process.exit(1); });
