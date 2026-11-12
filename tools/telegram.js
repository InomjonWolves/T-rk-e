// Daily Telegram channel post: "Kunning so'zi" + an example phrase + a tip + a link to the site.
// GitHub Actions runs it every morning (.github/workflows/telegram.yml) when the secrets exist:
//   TELEGRAM_BOT_TOKEN — from @BotFather; the bot must be an admin of the channel
//   TELEGRAM_CHAT_ID   — the channel, e.g. @turkceyol or -100…
// On Saturdays it also sends the weekly quiz (tools/quiz.js): an intro, 5 quiz polls and a closing message.
// Preview without sending: DRY=1 node tools/telegram.js  (with the quiz: DRY=1 QUIZ=1 node tools/telegram.js)
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const SITE = "https://turkceyol.web.app/";
const BOT = "https://t.me/TurkceYolBot", CHANNEL = "https://t.me/turkceyoluz";
const esc = s => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

function content() {
  const code = ["content.js", "lugat.js"].map(f => fs.readFileSync(path.join(ROOT, f), "utf8")).join("\n;\n");
  return vm.runInNewContext(code + "\n;({ UNITS, LUGAT })", {});
}
const TIPS = [
  "Har kuni 10 daqiqa — haftada bir marta 2 soatdan samaraliroq.",
  "Yangi so'zni ovoz chiqarib 3 marta ayting: talaffuz xotirada yaxshi qoladi.",
  "Qo'shimcha unlisi so'zning oxirgi unlisiga moslashadi: ev-ler, kitap-lar.",
  "Turkchada C harfi \"j\" deb o'qiladi: cep — cho'ntak, cami — jome'.",
  "So'zni gap ichida o'rganing — shunda qanday ishlatishni ham bilasiz.",
  "Xato qilishdan qo'rqmang: har bir xato — yangi bilim.",
  "Kechqurun bugungi so'zlarni bir marta takrorlang — ertalab yaxshiroq eslaysiz."
];
// One word per day, the same for everyone; packs rotate through A1 → C1
function word(date = new Date()) {
  const { UNITS, LUGAT } = content();
  const words = [];
  UNITS.forEach(u => u.words.forEach(w => words.push({ tr: w[0], uz: w[1], note: w[2] || "", lv: "A1" })));
  LUGAT.forEach(p => p.w.trim().split("\n").forEach(l => { const i = l.indexOf("="); if (i > 0) words.push({ tr: l.slice(0, i).trim(), uz: l.slice(i + 1).trim(), lv: p.lv, pack: p.id }); }));
  const ok = words.filter(w => w.tr && w.uz && !/[…]/.test(w.tr) && w.tr.length <= 24);
  const day = Math.floor(date.getTime() / 864e5);
  return { w: ok[(day * 7919) % ok.length], tip: TIPS[day % TIPS.length] };
}
function post(date = new Date()) {
  const { w, tip } = word(date);
  const link = w.pack ? `${SITE}lugat/${w.pack}.html` : SITE;
  return [
    `🇹🇷 <b>Kunning so'zi</b> · ${w.lv}`,
    "",
    `<b>${esc(w.tr)}</b> — ${esc(w.uz)}`,
    w.note ? `<i>${esc(w.note)}</i>` : "",
    "",
    `💡 ${esc(tip)}`,
    "",
    `📚 Bepul mashq: ${link}`
  ].filter((l, i, a) => l !== "" || a[i - 1] !== "").join("\n").trim();
}
// Buttons under the channel post (a channel cannot open a Mini App directly: the bot does)
const postButtons = () => ({ inline_keyboard: [[{ text: "📚 Mashq qilish", url: SITE }, { text: "🤖 Botda ochish", url: BOT }]] });
// The bot's command menu, refreshed with the daily post
const COMMANDS = [
  { command: "start", description: "Ilovani ochish" },
  { command: "soz", description: "Kunning so'zi" },
  { command: "test", description: "Bitta viktorina savoli" },
  { command: "kurs", description: "Turk tili kursi A1–C1" },
  { command: "yordam", description: "Bot nima qila oladi" }
];
async function api(token, method, body) {
  // A dropped connection ("fetch failed") is retried a few times; an answer from Telegram is final
  let r;
  for (let i = 0; ; i++) {
    try { r = await fetch(`https://api.telegram.org/bot${token}/${method}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}) }); break; }
    catch (e) { if (i >= 3) throw e; await new Promise(res => setTimeout(res, 2000 * (i + 1))); }
  }
  const j = await r.json();
  if (!j.ok) throw new Error(`${method}: ${j.description}`);
  return j.result;
}
async function sendQuiz(token, chat) {
  const { quiz, pollBody } = require("./quiz.js");
  const q = quiz();
  await api(token, "sendMessage", { chat_id: chat, text: q.intro, parse_mode: "HTML" });
  for (const p of q.polls) await api(token, "sendPoll", pollBody(chat, p));
  await api(token, "sendMessage", { chat_id: chat, text: q.outro, disable_web_page_preview: true, reply_markup: postButtons() });
  console.log("Viktorina yuborildi:", q.lv, q.polls.length);
}
async function send() {
  const token = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  const text = post();
  if (process.env.DRY && process.env.QUIZ) { const { quiz } = require("./quiz.js"); const q = quiz(); console.log(text + "\n\n" + q.intro + "\n" + q.polls.map(p => "• " + p.question.replace(/\n+/g, " ")).join("\n")); return; }
  if (process.env.DRY || !token || !chat) { console.log(text); if (!process.env.DRY) console.log("\n(TELEGRAM_BOT_TOKEN yoki TELEGRAM_CHAT_ID yoʻq — yuborilmadi)"); return; }
  const m = await api(token, "sendMessage", { chat_id: chat, text, parse_mode: "HTML", reply_markup: postButtons() });
  console.log("Yuborildi:", m.message_id);
  // Saturdays (or QUIZ=1): the weekly quiz after the word of the day
  if (process.env.QUIZ || new Date().getUTCDay() === 6) await sendQuiz(token, chat).catch(e => console.log("Viktorina:", e.message));
  await api(token, "setMyCommands", { commands: COMMANDS }).catch(e => console.log(e.message));
  await api(token, "setChatMenuButton", { menu_button: { type: "web_app", text: "Ochish", web_app: { url: SITE } } }).catch(e => console.log(e.message));
}
module.exports = { post, word, content, api, esc, SITE, BOT, CHANNEL, COMMANDS };
if (require.main === module) send().catch(e => { console.error(e.message); process.exit(1); });
