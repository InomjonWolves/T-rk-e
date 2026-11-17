// Sends a fresh app build (APK) to the admin's private chat with @TurkceYolBot — after the daily audio update the phone
// gets the new version in Telegram, ready to install. Called by .github/workflows/native.yml (input «notify»).
//   node tools/telegram-apk.js out/turkce-yol-ilova.apk
// Needs TELEGRAM_BOT_TOKEN and TELEGRAM_ADMIN_ID (the chat ID: send /id to the bot). Without them nothing is sent.
// Optional: APK_VERSION (versionCode), APK_NOTE (what changed), APK_URL (the release page).
// Never the channel: learners do not need a test build every day.
const fs = require("fs");
const path = require("path");
const { esc } = require("./telegram.js");

const MAX_MB = 50; // Bot API limit for files a bot sends
function versionName() {
  const g = fs.readFileSync(path.join(__dirname, "..", "native", "android", "app", "build.gradle"), "utf8");
  return (/versionName\s+"([^"]+)"/.exec(g) || [])[1] || "";
}
// The message under the file (Telegram caption: at most 1024 characters)
function caption({ name = "", code = "", bytes = 0, note = "", url = "", date = new Date() } = {}) {
  const day = date.toLocaleDateString("ru-RU", { timeZone: "Asia/Tashkent", day: "2-digit", month: "2-digit", year: "numeric" });
  const ver = [name, code && `(${code})`].filter(Boolean).join(" ");
  const lines = [
    "📱 <b>Türkçe Yoʻl — ilovaning yangi versiyasi</b>",
    ver && `Versiya: ${esc(ver)}`,
    `Sana: ${day}` + (bytes ? ` · ${(bytes / 1048576).toFixed(1)} MB` : ""),
    note && "\n" + esc(note),
    "\nOʻrnatish: faylni bosing → «Oʻrnatish». Eski ilova ustiga yangilanadi, natijalaringiz saqlanadi.",
    url && `GitHub: ${esc(url)}`
  ];
  return lines.filter(Boolean).join("\n").slice(0, 1024);
}
async function send(file, env = process.env) {
  const token = (env.TELEGRAM_BOT_TOKEN || "").trim(), chat = (env.TELEGRAM_ADMIN_ID || "").trim();
  if (!token || !chat) { console.log("TELEGRAM_BOT_TOKEN yoki TELEGRAM_ADMIN_ID yoʻq — APK Telegramga yuborilmadi"); return false; }
  if (!/^-?\d+$/.test(chat)) throw new Error("TELEGRAM_ADMIN_ID — faqat raqam boʻlishi kerak (botga /id yozing)");
  const buf = fs.readFileSync(file);
  if (buf.length > MAX_MB * 1048576) throw new Error(`APK ${MAX_MB} MB dan katta — bot yubora olmaydi`);
  const form = new FormData();
  form.append("chat_id", chat);
  form.append("parse_mode", "HTML");
  form.append("caption", caption({ name: versionName(), code: env.APK_VERSION, bytes: buf.length, note: env.APK_NOTE, url: env.APK_URL }));
  form.append("document", new Blob([buf], { type: "application/vnd.android.package-archive" }), path.basename(file));
  let r;
  for (let i = 0; ; i++) {
    try { r = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, { method: "POST", body: form }); break; }
    catch (e) { if (i >= 3) throw e; await new Promise(res => setTimeout(res, 3000 * (i + 1))); }
  }
  const j = await r.json();
  // «chat not found» — the admin has not pressed /start in the bot yet
  if (!j.ok) throw new Error(`sendDocument: ${j.description}${/chat not found|blocked/i.test(j.description || "") ? " — botda /start bosing" : ""}`);
  console.log("APK Telegramga yuborildi:", j.result.message_id);
  return true;
}
module.exports = { caption, send, versionName };
if (require.main === module) {
  const file = process.argv[2];
  if (!file) { console.error("APK fayli koʻrsatilmagan"); process.exit(1); }
  send(file).catch(e => { console.error(e.message); process.exit(1); });
}
