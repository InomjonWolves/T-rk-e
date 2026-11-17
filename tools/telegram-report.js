// The admin's Telegram window into the project while nobody is watching (private chat with @TurkceYolBot,
// secret TELEGRAM_ADMIN_ID):
//   node tools/telegram-report.js report — the daily report: learners (anonymous stats/), app errors (errs/), the audio
//     recording (audio/progress.json), yesterday's automatic jobs (GitHub Actions) and the app build
//   node tools/telegram-report.js alert  — one automatic job has failed (.github/workflows/watch.yml, workflow_run)
// Secrets: TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_ID; SA (= PUSH_SERVICE_ACCOUNT, reads Firestore; without it the learner
// part is left out); GITHUB_TOKEN + GITHUB_REPOSITORY (the jobs). Nothing is sent without the Telegram secrets.
const fs = require("fs");
const path = require("path");
const { api, esc } = require("./telegram.js");
const { accessToken, fromFs, PROJECT } = require("./push.js");
const ROOT = path.join(__dirname, "..");

const DAY = 864e5;
// The learner's own day key (YYYY-MM-DD) in Tashkent time, as close as a server can get
const tkDay = (t = Date.now()) => new Date(t + 5 * 3600e3).toISOString().slice(0, 10);
const dayDiff = (a, b) => Math.round((Date.parse(a) - Date.parse(b)) / DAY);

// stats/ docs {d (written that day), f (first day), a ("0"/"1" × 30, the last = d), ses} → numbers
function learners(rows, today) {
  let day = 0, week = 0, fresh = 0, ses = 0;
  for (const r of rows) {
    const a = String(r.a || ""), k = r.d ? dayDiff(today, r.d) : 99;
    if (k === 0 && a.endsWith("1")) day++;
    if (k < 7 && a.slice(-(7 - k)).includes("1")) week++;
    if (r.f && dayDiff(today, r.f) < 7) fresh++;
    ses += r.ses || 0;
  }
  return { all: rows.length, day, week, fresh, ses };
}
// GitHub runs of the last day → per workflow: ok / failed (only the main branch)
function jobs(runs) {
  const by = {};
  for (const r of runs) {
    if (r.head_branch && r.head_branch !== "main") continue;
    const w = by[r.name] || (by[r.name] = { ok: 0, bad: 0, last: null });
    if (r.conclusion === "success" || r.conclusion === "skipped") w.ok++;
    else if (r.conclusion === "failure" || r.conclusion === "timed_out") { w.bad++; w.last = w.last || r; }
  }
  return by;
}
function reportText({ today, users, errs, audio, by, app }) {
  const [y, m, d] = today.split("-");
  const out = [`📊 <b>Türkçe Yoʻl — kunlik hisobot</b> · ${d}.${m}.${y}`];
  if (users) out.push("", "👥 <b>Oʻquvchilar</b> (hisobga kirganlar)",
    `Jami: <b>${users.all}</b> · bugun faol: <b>${users.day}</b> · 7 kunda: <b>${users.week}</b>`,
    `Yangi (7 kun): <b>${users.fresh}</b> · jami mashqlar: ${users.ses}`);
  if (errs) out.push("", errs.length ? `🐞 <b>Ilova xatolari</b>: ${errs.length} tur` : "🐞 Ilova xatolari: yoʻq",
    ...errs.slice(0, 3).map(e => `• ${esc(String(e.m || "").slice(0, 90))} — ${e.n || 1} marta`));
  if (audio) out.push("", "🔊 <b>Audio</b> (qahramonlar ovozi)",
    `Oxirgi yozuv: ${audio.made} ta gap · navbatda: <b>${audio.left}</b>` + (audio.left ? ` (≈${Math.ceil(audio.left / 40)} kun)` : " — hammasi yozildi ✅"));
  const names = Object.keys(by || {});
  if (names.length) {
    const bad = names.filter(n => by[n].bad);
    out.push("", bad.length ? "⚙️ <b>Avtomatik ishlar</b> — xato bor:" : `⚙️ Avtomatik ishlar: hammasi joyida ✅ (${names.reduce((a, n) => a + by[n].ok, 0)} ta)`,
      ...bad.map(n => `❌ ${esc(n)}: ${by[n].bad} marta — ${by[n].last.html_url}`));
  }
  if (app) out.push("", `📱 Ilova: oxirgi versiya ${app.code} (${app.ok ? "yigʻildi" : "yigʻilmadi ❌"})`);
  return out.join("\n");
}
function alertText(r) {
  return `⚠️ <b>«${esc(r.name)}» ishlamay qoldi</b>\n${esc(r.display_title || "").slice(0, 120)}\n\n${r.html_url}\n\nClaude kunlik tekshiruvda koʻrib chiqadi.`;
}

async function firestore(sa, coll) {
  const tok = await accessToken(sa);
  const r = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents:runQuery`, {
    method: "POST", headers: { Authorization: "Bearer " + tok, "Content-Type": "application/json" },
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId: coll }] } })
  });
  const j = await r.json();
  if (!Array.isArray(j)) throw new Error(`${coll}: ` + JSON.stringify(j).slice(0, 200));
  return j.filter(x => x.document).map(x => fromFs(x.document.fields));
}
async function gh(p, env) {
  const r = await fetch(`https://api.github.com/repos/${env.GITHUB_REPOSITORY}/${p}`, { headers: { Authorization: "Bearer " + env.GITHUB_TOKEN, Accept: "application/vnd.github+json" } });
  if (!r.ok) throw new Error(`github ${p}: ${r.status}`);
  return r.json();
}
async function collect(env = process.env, now = Date.now()) {
  const today = tkDay(now), data = { today };
  const sa = JSON.parse(env.SA || "null");
  if (sa) {
    try { data.users = learners(await firestore(sa, "stats"), today); } catch (e) { console.log("stats:", e.message); }
    try { data.errs = (await firestore(sa, "errs")).sort((a, b) => (b.n || 0) - (a.n || 0)); } catch (e) { console.log("errs:", e.message); }
  }
  try { data.audio = JSON.parse(fs.readFileSync(path.join(ROOT, "audio", "progress.json"), "utf8")); } catch (e) { /* not yet */ }
  if (env.GITHUB_TOKEN && env.GITHUB_REPOSITORY) {
    try {
      const since = new Date(now - DAY).toISOString();
      const runs = (await gh(`actions/runs?per_page=100&created=${encodeURIComponent(">=" + since)}`, env)).workflow_runs || [];
      data.by = jobs(runs.filter(r => r.name !== "pages build and deployment"));
      const nat = ((await gh("actions/workflows/native.yml/runs?per_page=5&status=completed", env)).workflow_runs || []).find(r => r.conclusion !== "cancelled");
      if (nat) data.app = { code: 1000 + nat.run_number, ok: nat.conclusion === "success" };
    } catch (e) { console.log("github:", e.message); }
  }
  return data;
}
async function main(mode, env = process.env) {
  const token = (env.TELEGRAM_BOT_TOKEN || "").trim(), chat = (env.TELEGRAM_ADMIN_ID || "").trim();
  let text;
  if (mode === "alert") {
    const r = JSON.parse(fs.readFileSync(env.GITHUB_EVENT_PATH, "utf8")).workflow_run;
    if (!r || r.conclusion !== "failure" || r.head_branch !== "main") { console.log("Xato emas — xabar yoʻq"); return; }
    text = alertText(r);
  } else text = reportText(await collect(env));
  if (!token || !chat) { console.log(text + "\n\n(TELEGRAM_BOT_TOKEN yoki TELEGRAM_ADMIN_ID yoʻq — yuborilmadi)"); return; }
  await api(token, "sendMessage", { chat_id: chat, text, parse_mode: "HTML", disable_web_page_preview: true });
  console.log("Yuborildi");
}
module.exports = { learners, jobs, reportText, alertText, tkDay };
if (require.main === module) main(process.argv[2] || "report").catch(e => { console.error(e.message); process.exit(1); });
