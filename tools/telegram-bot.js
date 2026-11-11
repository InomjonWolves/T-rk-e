// @TurkceYolBot replies. Main path: a Telegram webhook → Vercel function bot/api/telegram.js → handle() — the answer goes
// back in the webhook response, instantly (deployed by .github/workflows/telegram-bot-deploy.yml).
// Fallback without a webhook: `node tools/telegram-bot.js` reads new messages with getUpdates and answers them.
//   /start  — welcome + "Ilovani ochish" (the site as a Telegram Mini App) + the channel
//   /soz    — the word of the day (same as the channel post)
//   /test   — one quiz question (a Telegram quiz poll, from tools/quiz.js)
//   /kurs   — course and grammar links
//   /yordam — what the bot can do
//   any word (Turkish or Uzbek) — its translation from the site's dictionary
// Needs TELEGRAM_BOT_TOKEN. Try a reply locally: node tools/telegram-bot.js "kitap"
const { word, content, api, esc, SITE, CHANNEL } = require("./telegram.js");

const fold = s => String(s).toLocaleLowerCase("tr").replace(/[ʻʼ‘’`']/g, "'").replace(/[?!.,;:…"«»()]/g, "").replace(/\s+/g, " ").trim();
let DICT = null;
function dict() {
  if (DICT) return DICT;
  const { UNITS, LUGAT } = content(), rows = [];
  UNITS.forEach(u => u.words.forEach(w => rows.push({ tr: w[0], uz: w[1], note: w[2] || "", lv: "A1" })));
  LUGAT.forEach(p => p.w.trim().split("\n").forEach(l => { const i = l.indexOf("="); if (i > 0) rows.push({ tr: l.slice(0, i).trim(), uz: l.slice(i + 1).trim(), lv: p.lv, pack: p.id }); }));
  return (DICT = rows.filter(r => r.tr && r.uz));
}
// Exact Turkish match first, then Uzbek, then words starting with the query; at most 5
function lookup(q) {
  const f = fold(q);
  if (!f || f.length < 2) return [];
  const all = dict(), seen = new Set(), out = [];
  const add = r => { const k = r.tr + "=" + r.uz; if (!seen.has(k) && out.length < 5) { seen.add(k); out.push(r); } };
  all.filter(r => fold(r.tr) === f).forEach(add);
  all.filter(r => fold(r.uz).split(/[,;] */).includes(f)).forEach(add);
  if (out.length < 5 && f.length >= 3) all.filter(r => fold(r.tr).startsWith(f)).forEach(add);
  return out;
}
const openApp = { text: "📱 Ilovani ochish", web_app: { url: SITE } };
const channel = { text: "📢 Kanal", url: CHANNEL };
// The reply to one message: { text, reply_markup }
function reply(text, date = new Date()) {
  const t = String(text || "").trim(), cmd = (/^\/([a-z_]+)/i.exec(t) || [])[1];
  const c = cmd && cmd.toLowerCase();
  if (c === "start") return {
    text: "Assalomu alaykum! Men Pamuk 🐱 — <b>Türkçe Yo'l</b> boti.\n\nTurk tilini o'zbek tilida bepul o'rganing: A1–C1 kurs, grammatika, lug'at, tinglash va gapirish mashqlari, reyting va kunlik vazifalar.\n\n👇 Pastdagi tugmani bosing — sayt Telegram ichida ochiladi.\nMenga turkcha yoki o'zbekcha so'z yozsangiz, tarjimasini aytaman.",
    reply_markup: { inline_keyboard: [[openApp], [channel]] }
  };
  if (c === "soz") {
    const { w, tip } = word(date);
    return { text: `🇹🇷 <b>Kunning so'zi</b> · ${w.lv}\n\n<b>${esc(w.tr)}</b> — ${esc(w.uz)}${w.note ? `\n<i>${esc(w.note)}</i>` : ""}\n\n💡 ${esc(tip)}`, reply_markup: { inline_keyboard: [[openApp]] } };
  }
  if (c === "test" || c === "viktorina") {
    const p = require("./quiz.js").one(date.getTime());
    return { poll: p, text: "Yana savol: /test" };
  }
  if (c === "kurs") return {
    text: "📚 <b>Turk tili kursi A1–C1</b> — 40 bo'lim, lug'at, grammatika, dialog va mashqlar.\n\nKurs: " + SITE + "kurs/\nGrammatika: " + SITE + "qoida/\nO'qish matnlari: " + SITE + "oqish/",
    reply_markup: { inline_keyboard: [[openApp]] }
  };
  if (c === "yordam" || c === "help") return {
    text: "Men nima qila olaman:\n\n/start — ilovani ochish\n/soz — kunning so'zi\n/test — viktorina savoli\n/kurs — kurs va grammatika\n\nYoki shunchaki so'z yozing: <i>kitap</i>, <i>salom</i>, <i>çalışmak</i> — tarjimasini topaman.",
    reply_markup: { inline_keyboard: [[openApp], [channel]] }
  };
  if (c) return reply("/yordam");
  const hits = lookup(t);
  if (hits.length) return {
    text: hits.map(r => `<b>${esc(r.tr)}</b> — ${esc(r.uz)}${r.note ? ` <i>(${esc(r.note)})</i>` : ""} · ${r.lv}`).join("\n") + "\n\nMashq qilish — ilovada 👇",
    reply_markup: { inline_keyboard: [[openApp]] }
  };
  return { text: `"${esc(t.slice(0, 40))}" lug'atimda topilmadi 🙈\nBoshqa so'z yozib ko'ring yoki /yordam`, reply_markup: { inline_keyboard: [[openApp]] } };
}
// A webhook update → the Bot API call to make in the webhook response ({ method, ... }), or null to ignore it.
// Private chats only; messages older than a day are skipped (the bot may have been off).
function handle(u, now = Date.now()) {
  const m = u && u.message;
  if (!m || !m.chat || m.chat.type !== "private" || !m.text || now / 1000 - m.date > 86400) return null;
  const r = reply(m.text, new Date(now));
  if (r.poll) return Object.assign({ method: "sendPoll" }, require("./quiz.js").pollBody(m.chat.id, r.poll));
  return Object.assign({ method: "sendMessage", chat_id: m.chat.id, parse_mode: "HTML", disable_web_page_preview: true }, r);
}
// Secret for X-Telegram-Bot-Api-Secret-Token, derived from the bot token (no extra secret to keep)
const hookSecret = token => require("crypto").createHash("sha256").update("turkceyol-hook:" + token).digest("hex").slice(0, 48);
// Polling fallback (when no webhook is set): read new messages, answer, confirm with offset
async function run() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) { console.log("TELEGRAM_BOT_TOKEN yoʻq — oʻtkazib yuborildi"); return; }
  const ups = await api(token, "getUpdates", { timeout: 0, limit: 100, allowed_updates: ["message"] });
  let last = 0, answered = 0;
  for (const u of ups) {
    last = Math.max(last, u.update_id);
    try {
      const call = handle(u);
      if (!call) continue;
      const { method, ...body } = call;
      await api(token, method, body); answered++;
    } catch (e) { console.log(e.message); }
  }
  // Confirm everything read so far
  if (last) await api(token, "getUpdates", { offset: last + 1, limit: 1, timeout: 0 });
  console.log(`${ups.length} ta yangilanish, ${answered} ta javob`);
}
module.exports = { reply, lookup, handle, hookSecret };
if (require.main === module) {
  if (process.argv[2]) console.log(JSON.stringify(reply(process.argv.slice(2).join(" ")), null, 1));
  else run().catch(e => { console.error(e.message); process.exit(1); });
}
