// Weekly Telegram quiz: 5 quiz polls (3 words + 2 grammar rules) for one level; the level rotates every week A1 → B2.
// tools/telegram.js sends it to the channel on Saturdays (or any day with QUIZ=1); the bot's /test sends one question.
// Preview: node tools/quiz.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const LEVELS = ["A1", "A2", "B1", "B2", "C1"];
const fold = s => String(s).toLocaleLowerCase("tr").replace(/[.,!?;:…"«»()]/g, "").replace(/\s+/g, " ").trim();

let DATA = null;
function data() {
  if (DATA) return DATA;
  const code = ["content.js", "lugat.js", "grammar-ex.js"].map(f => fs.readFileSync(path.join(ROOT, f), "utf8")).join("\n;\n");
  const { UNITS, LUGAT, BX } = vm.runInNewContext(code + "\n;({ UNITS, LUGAT, BX })", {});
  const words = [];
  UNITS.forEach(u => u.words.forEach(w => words.push({ tr: w[0], uz: w[1], lv: "A1" })));
  LUGAT.forEach(p => p.w.trim().split("\n").forEach(l => { const i = l.indexOf("="); if (i > 0) words.push({ tr: l.slice(0, i).trim(), uz: l.slice(i + 1).trim(), lv: p.lv, pack: p.id }); }));
  const okW = words.filter(w => w.tr && w.uz && !/[…]/.test(w.tr + w.uz) && w.tr.length <= 40 && w.uz.length <= 60);
  // Grammar: only choice items that fit a Telegram poll (question ≤ 300, options ≤ 100, explanation ≤ 200)
  const rules = [];
  Object.keys(BX).forEach(code => BX[code].forEach((x, n) => {
    if (x.t !== "c" || !Array.isArray(x.o) || x.o.length < 2 || x.o.length > 6) return;
    if (new Set(x.o.map(fold)).size !== x.o.length || x.o.some(o => !o || o.length > 100)) return;
    const q = x.q + (x.uz ? `\n(${x.uz})` : "");
    if (q.length > 250 || (x.e && x.e.length > 190)) return;
    rules.push({ lv: code.slice(0, 2), code, n, q, o: x.o.slice(), a: x.a, e: x.e || "" });
  }));
  return (DATA = { words: okW, rules });
}
// Small deterministic random generator, so a given week always gives the same quiz
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
const pick = (arr, r) => arr[Math.floor(r() * arr.length)];
function shuffle(arr, r) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// One vocabulary question: Turkish → Uzbek (rev = Uzbek → Turkish), 4 options from the same level
function wordPoll(lv, r, rev) {
  const pool = data().words.filter(w => w.lv === lv);
  for (let tries = 0; tries < 50; tries++) {
    const w = pick(pool, r), ask = rev ? w.uz : w.tr, key = rev ? "tr" : "uz";
    const opts = [w[key]], seen = new Set([fold(w.tr), fold(w.uz)]);
    for (let k = 0; k < 200 && opts.length < 4; k++) {
      const d = pick(pool, r);
      if (seen.has(fold(d.tr)) || seen.has(fold(d.uz))) continue;
      seen.add(fold(d.tr)); seen.add(fold(d.uz));
      opts.push(d[key]);
    }
    if (opts.length < 4) continue;
    const o = shuffle(opts, r);
    return {
      question: rev ? `"${ask}" turkchada qanday?` : `"${ask}" so'zining ma'nosi nima?`,
      options: o, correct: o.indexOf(w[key]),
      explanation: `${w.tr} — ${w.uz}`.slice(0, 200), lv, kind: "word"
    };
  }
  return null;
}
function rulePoll(lv, r, avoid = new Set()) {
  const pool = data().rules.filter(x => x.lv === lv && !avoid.has(x.code));
  if (!pool.length) return null;
  const x = pick(pool, r), right = x.o[x.a], o = shuffle(x.o, r);
  avoid.add(x.code);
  return { question: "Qaysi javob to'g'ri?\n\n" + x.q, options: o, correct: o.indexOf(right), explanation: x.e || `To'g'ri javob: ${right}`, lv, kind: "rule", code: x.code };
}
const weekNo = (date = new Date()) => Math.floor((Math.floor(date.getTime() / 864e5) + 3) / 7); // weeks start on Monday
function quiz(date = new Date()) {
  const wk = weekNo(date), lv = LEVELS[wk % LEVELS.length], r = rng(wk * 2654435761 + 7);
  const avoid = new Set(), polls = [wordPoll(lv, r, false), rulePoll(lv, r, avoid), wordPoll(lv, r, true), rulePoll(lv, r, avoid), wordPoll(lv, r, false)].filter(Boolean);
  return {
    lv, polls,
    intro: `🧠 <b>Haftalik viktorina</b> · ${lv}\n\n${polls.length} ta savol: so'zlar va grammatika. Javobingizni tanlang — to'g'ri javob va izoh darhol ko'rinadi.`,
    outro: `Nechta to'g'ri topdingiz? 💬\n\n${lv} darajasidagi mashqlar — bepul: https://turkceyol.web.app/`
  };
}
// One random question for the bot's /test (different every call)
function one(seed = Date.now()) {
  const r = rng(seed % 4294967295), lv = pick(LEVELS, r);
  return (r() < 0.5 ? wordPoll(lv, r, r() < 0.4) : rulePoll(lv, r)) || wordPoll("A1", r, false);
}
// Bot API sendPoll body (channels only accept anonymous polls)
const pollBody = (chat, p) => ({
  chat_id: chat, question: p.question, options: p.options.map(text => ({ text })),
  type: "quiz", correct_option_id: p.correct, explanation: p.explanation, is_anonymous: true
});
module.exports = { quiz, one, pollBody, weekNo, data, LEVELS };
if (require.main === module) {
  const q = quiz();
  console.log(q.intro + "\n");
  q.polls.forEach((p, i) => console.log(`${i + 1}. ${p.question}\n   ${p.options.map((o, j) => (j === p.correct ? "✔ " : "  ") + o).join(" | ")}\n   💡 ${p.explanation}\n`));
  console.log(q.outro);
}
