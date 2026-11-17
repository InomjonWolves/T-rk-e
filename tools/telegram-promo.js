// Sends the advertising banners (promo/*.jpg, drawn by tools/promo.js) with their ready post texts (promo/posts.json)
// to the admin's private chat with @TurkceYolBot — from there they are forwarded or copied to channels and groups.
// The story picture also goes as a file (a photo is shrunk by Telegram, a story needs the full 1080×1920).
// Needs TELEGRAM_BOT_TOKEN and TELEGRAM_ADMIN_ID. Run by .github/workflows/promo.yml (by hand).
const fs = require("fs");
const path = require("path");
const { upload } = require("./telegram-apk.js");
const DIR = path.join(__dirname, "..", "promo");
const posts = () => JSON.parse(fs.readFileSync(path.join(DIR, "posts.json"), "utf8"));

async function send(env = process.env) {
  const token = (env.TELEGRAM_BOT_TOKEN || "").trim(), chat = (env.TELEGRAM_ADMIN_ID || "").trim();
  if (!token || !chat) { console.log("TELEGRAM_BOT_TOKEN yoki TELEGRAM_ADMIN_ID yoʻq — yuborilmadi"); return 0; }
  let n = 0;
  for (const p of posts()) {
    const buf = fs.readFileSync(path.join(DIR, p.file));
    await upload(token, "sendPhoto", { chat_id: chat, parse_mode: "HTML", caption: p.caption }, "photo", buf, p.file, "image/jpeg");
    if (/story/.test(p.file)) await upload(token, "sendDocument", { chat_id: chat, caption: "Story uchun asl sifatdagi fayl" }, "document", buf, p.file, "image/jpeg");
    console.log("Yuborildi:", p.file); n++;
  }
  return n;
}
module.exports = { posts, send };
if (require.main === module) send().catch(e => { console.error(e.message); process.exit(1); });
