/* Türkçe Yoʻl — State and the learning engine: dates, progress (S), spaced repetition, daily activity, XP, streak freeze, reminders.
   The app is split into scripts in js/, loaded in this order by index.html (state, kirill, social, words, stories, ui,
   pages, translate, units, achieve, session, skills, drills, lenta, events, groups, account). They share one global scope like one file:
   a script may call what a later one declares only from inside a function, never while it loads (tools/app-order.js
   checks this). Data comes from content.js (UNITS) and grammar.js (LETTERS, GRAMMAR). */

/* ---------- Error log (2026-11-16): what breaks on a learner's device reaches the admin page ----------
   Kept on the device first (localStorage "ty-errs"): one entry per kind of error (message + script), with a count.
   Sent without any name, address or account id to errs/{sig} when the learner is signed in and keeps «Anonim statistika»
   on (errFlush, js/drills.js); #admin lists them. Noise (browser extensions, a lost connection, an interrupted sound)
   is left out. Set first, so even an error while the next scripts load is caught. */
const APP_V = "dev";   // the deploy writes the commit here (tools/minify.js), the Android app its build number
const ERR_KEY = "ty-errs", ERR_MAX = 20;
const errHash = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return "e" + (h >>> 0).toString(36); };
// A script address without the site: "js/units.js:1:2345" (the same on the site, in the app and in a test)
const errPlace = u => { u = String(u || "").replace(/^[a-z-]+:\/\/[^/]*/i, ""); const i = u.lastIndexOf("/js/"); return (i >= 0 ? u.slice(i + 1) : u.replace(/^.*\//, "")).slice(0, 120); };
function errNoise(m, f, s) {
  if (!m || /^Script error\.?$/i.test(m)) return true;   // another site's script: the browser tells nothing
  if (/extension:\/\//.test(f + " " + s)) return true;     // a browser extension, not the app
  return /ResizeObserver loop|AbortError|NotAllowedError|play\(\) request|operation was aborted|Failed to fetch|NetworkError|Load failed|network error|offline|client is offline|unavailable|deadline-exceeded|cancelled|Importing a module script failed/i.test(m);
}
function errNote(m, f, s) {
  try {
    if (/extension:\/\//.test(String(f))) return;            // a browser extension's own script
    m = String(m || "").replace(/^Uncaught (\w*Error: )/, "$1").replace(/\s+/g, " ").trim().slice(0, 300); f = errPlace(f);
    s = String(s || "").split("\n").slice(0, 5).map(x => x.trim().replace(/\(?(https?|capacitor|file):\/\/[^)\s]*?\/(js\/|[a-z-]+\.js)/g, "($2")).join("\n").slice(0, 800);
    if (errNoise(m, f, s)) return;
    const all = JSON.parse(localStorage.getItem(ERR_KEY) || "{}"), sig = errHash(m.replace(/\d+/g, "#") + "|" + f.replace(/:\d+(:\d+)?$/, ""));
    const e = all[sig] || (all[sig] = { m, n: 0, sent: 0 });
    Object.assign(e, { f, s, n: e.n + 1, r: (location.hash || "#home").split("-")[0].slice(0, 30), v: APP_V, at: Date.now() });
    const keys = Object.keys(all).sort((a, b) => all[b].at - all[a].at);
    keys.slice(ERR_MAX).forEach(k => delete all[k]);
    localStorage.setItem(ERR_KEY, JSON.stringify(all));
  } catch (x) {}
}
window.addEventListener("error", e => { if (e && e.message) errNote(e.message, e.filename ? `${e.filename}:${e.lineno}:${e.colno}` : "", e.error && e.error.stack); });
window.addEventListener("unhandledrejection", e => {
  const r = e && e.reason; if (!r) return;
  const m = r.message || (typeof r === "string" ? r : ""), st = r.stack || "", at = /(?:https?|capacitor|file):\/\/\S+?:\d+:\d+/.exec(st);
  errNote((r.code ? r.code + ": " : "") + m, at ? at[0] : "", st);
});

/* ---------- Content ---------- */
const ALL = [];
UNITS.forEach((u, ui) => u.words.forEach(w => ALL.push({ tr: w[0], uz: w[1], note: w[2] || "", unit: ui })));

const CATS = [
  { id: "asos", uz: "Asoslar", color: "violet", ico: "chat", ids: ["selam", "tanisma", "sayilar", "zamir", "soru", "kalip", "sayi2"] },
  { id: "hayot", uz: "Kundalik hayot", color: "sky", ico: "home", ids: ["aile", "ev", "vucut", "gunler", "hava", "rutin", "duygu", "telefon", "zaman", "renkler"] },
  { id: "ovqat", uz: "Ovqat", color: "orange", ico: "cup", ids: ["yemek", "kahvalti", "meyve", "restoran"] },
  { id: "sayohat", uz: "Sayohat", color: "pink", ico: "plane", ids: ["sehir", "ulasim", "sehir2", "yon", "alisveris", "giysi", "saglik"] },
  { id: "ish", uz: "Ish va oʻqish", color: "green", ico: "case", ids: ["meslek", "isokul", "fiiller", "fiil2", "sifat"] },
  { id: "madaniyat", uz: "Madaniyat", color: "teal", ico: "spark", ids: ["dostlar", "bayram", "hayvan"] }
];
const catOf = ui => CATS.find(c => c.ids.includes(UNITS[ui].id)) || CATS[0];
const LEVELS = [
  { name: "A1.1", uz: "Birinchi qadamlar", from: 0, to: 12 },
  { name: "A1.2", uz: "Kundalik hayot", from: 12, to: 24 },
  { name: "A1.3", uz: "Shahar va muloqot", from: 24, to: 36 }
];

/* ---------- Dates ---------- */
const DAY = 864e5;
const dayNum = (t = Date.now()) => Math.floor((t - new Date(t).getTimezoneOffset() * 6e4) / DAY);
const keyOf = n => new Date(n * DAY).toISOString().slice(0, 10);
const todayKey = () => keyOf(dayNum());
const weekStart = n => n - (new Date(n * DAY).getUTCDay() + 6) % 7;
const weekKey = () => keyOf(weekStart(dayNum()));
const WD = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];

/* ---------- State ---------- */
const KEY = "turkce-yol-v1";
const WORD_GOAL = 20;
// Answers per skill: [right, tries, xp, seconds] (the four skills — js/words.js)
function skBlank() { return { r: [0, 0, 0, 0], l: [0, 0, 0, 0], w: [0, 0, 0, 0], s: [0, 0, 0, 0] }; }
function blank() {
  return {
    xp: 0, streak: 0, best: 0, lastDay: null, day: todayKey(), dayXp: 0,
    known: {}, gram: {}, srs: {}, newDay: { d: 0, n: 0 },
    days: {}, sessions: 0, perfect: 0, acc: [0, 0], ust: {},
    week: "", wxp: 0, lg: 1, goal: 50, pub: true, gx: {}, gxm: {}, k: {}, ktest: {}, onb: 0, trUses: 0, shared: 0, night: 0, early: 0, pron: [0, 0], sk: skBlank(), roles: 0, anon: true
  };
}
let S = blank();
let KEYU = KEY;
function loadLocal(key) {
  let v = blank();
  try { const raw = localStorage.getItem(key); if (raw) v = Object.assign(blank(), JSON.parse(raw)); } catch (e) {}
  return migrate(v);
}
let remTimer;
function save() { lvlCheck(); frameCheck(); S.savedAt = Date.now(); try { localStorage.setItem(KEYU, JSON.stringify(S)); } catch (e) {} cloudSave(); clearTimeout(remTimer); remTimer = setTimeout(() => remSync(), 2500); clearTimeout(achTimer); achTimer = setTimeout(checkAch, 450); }

/* ---------- Spaced repetition (simplified SM-2) ----------
   Each word: i = interval in days, e = ease, d = due day, r = successful reviews in a row,
   m = correct answers still needed to leave the mistake notebook, w = total mistakes. */
const NEW_PER_DAY = 10;
const LEARNED_DAYS = 3;
const srs = w => S.srs[w.tr];
function migrate(st) {
  st.srs = st.srs || {};
  const t = dayNum();
  Object.keys(st.known || {}).forEach(tr => {
    if (st.srs[tr]) return;
    const k = st.known[tr];
    if (k >= 2) st.srs[tr] = { i: LEARNED_DAYS, e: 2.5, d: t, r: 2, m: 0, w: 0 };
    else if (k === 1) st.srs[tr] = { i: 0, e: 2.5, d: t, r: 0, m: 0, w: 0 };
  });
  st.known = {};
  if (!st.newDay) st.newDay = { d: 0, n: 0 };
  if (st.day !== todayKey()) { st.day = todayKey(); st.dayXp = 0; }
  rollWeek(st);
  st.best = Math.max(st.best || 0, st.streak || 0);
  // Skill stats arrived later: start them from what we already know (pronunciation)
  if (!st.skv) { st.skv = 1; st.sk = skBlank(); const p = st.pron || [0, 0]; st.sk.s[0] = p[0]; st.sk.s[1] = p[1]; }
  ["r", "l", "w", "s"].forEach(id => { if (!st.sk[id]) st.sk[id] = [0, 0, 0, 0]; });
  frzApply(st);
  return st;
}
function grade(w, ok) {
  const t = dayNum();
  let st = srs(w);
  if (!st) {
    st = S.srs[w.tr] = { i: 0, e: 2.5, d: t, r: 0, m: 0, w: 0 };
    if (S.newDay.d !== t) S.newDay = { d: t, n: 0 };
    S.newDay.n++;
  }
  if (ok) {
    // Only a review that was due moves the word forward: cramming the same day does not count twice
    if (st.d <= t || st.r === 0) {
      st.i = st.r === 0 ? 1 : st.r === 1 ? LEARNED_DAYS : Math.round(st.i * st.e);
      st.r++;
      st.d = t + st.i;
    }
    if (st.m > 0) st.m--;
  } else {
    st.w++; st.m = 2; st.r = 0; st.i = 0; st.d = t;
    st.e = Math.max(1.3, +(st.e - 0.2).toFixed(2));
  }
  st.t = Math.floor(Date.now() / 60000);   // when it was last reviewed: two devices keep the later review (sync.js)
  record(w, ok);
  save();
}
// 0 = new, 1 = learning, 2 = learned (survived reviews on different days)
const known = w => { const st = srs(w); return !st ? 0 : st.i >= LEARNED_DAYS ? 2 : 1; };
const dueWords = () => { const t = dayNum(); return ALL.filter(w => { const st = srs(w); return st && st.d <= t; }).sort((a, b) => srs(a).d - srs(b).d); };
const newLeft = () => Math.max(0, NEW_PER_DAY - (S.newDay.d === dayNum() ? S.newDay.n : 0));
const newWords = n => ALL.filter(w => !srs(w)).slice(0, n);
const mistakeWords = () => ALL.filter(w => { const st = srs(w); return st && st.m > 0; }).sort((a, b) => srs(b).w - srs(a).w);
const unitWords = ui => ALL.filter(w => w.unit === ui);
const unitProgress = ui => { const ws = unitWords(ui); return ws.length ? ws.filter(w => known(w) >= 2).length / ws.length : 0; };
const learnedCount = () => ALL.filter(w => known(w) >= 2).length;
const gramDone = g => { const r = S.gram[g.id] || []; return g.quiz.every((q, i) => r[i]); };
const gramCount = () => GRAMMAR.filter(gramDone).length;
/* Rule exercises tied to the book topics (grammar-ex.js → BX) and the grammar guide (guide.js → GUIDE) come right
   after the first screen (loadGram, like course.js) — the home page does not need them (~190 KB less to load and run
   before it shows). Until then BX/GUIDE are empty: views that need them wait (needGram → the NEED_COURSE path of
   route() and taps), the rule achievements are not counted (gxN → Infinity). Both files declare them with var. */
var BX = typeof BX !== "undefined" ? BX : {}, GUIDE = typeof GUIDE !== "undefined" ? GUIDE : [];
let GX_CODES = [], GRAM_FULL = false, GRAM_P = null;
const needGram = () => { if (!GRAM_FULL) throw NEED_COURSE; };
const gxN = lv => GRAM_FULL ? (lv ? gxCount(lv) : GX_CODES.length) : Infinity;
function gramInit() {
  GX_CODES = Object.keys(BX);
  GUIDE_ALL.length = 0;
  GUIDE.forEach(l => l.groups.forEach(g => g.items.forEach(i => GUIDE_ALL.push(Object.assign({ level: l.id, group: g.name }, i)))));
  GRAM_FULL = GX_CODES.length > 0 && GUIDE.length > 0;
}
function loadGram() {
  if (GRAM_FULL) return Promise.resolve();
  return GRAM_P || (GRAM_P = Promise.all(["guide.js", "grammar-ex.js"].map(src => new Promise((ok, fail) => {
    const sc = document.createElement("script");
    sc.src = src; sc.onload = ok; sc.onerror = () => { sc.remove(); fail(new Error(src)); };
    document.head.appendChild(sc);
  }))).then(() => { gramInit(); if (!GRAM_FULL) throw new Error("grammar"); }, e => { GRAM_P = null; throw e; }));
}
const gxSolved = c => (S.gx[c] || []).filter(Boolean).length;
const gxDone = c => gxSolved(c) >= BX[c].length;
const gxDoneCount = lv => GX_CODES.filter(c => (!lv || c.startsWith(lv + ".")) && gxDone(c)).length;
const gxCount = lv => GX_CODES.filter(c => c.startsWith(lv + ".")).length;
const gxMistakes = () => Object.keys(S.gxm).filter(k => S.gxm[k] > 0 && BX[k.split("#")[0]]);
const GUIDE_ALL = [];
if (Object.keys(BX).length && GUIDE.length) gramInit();
const gxTopic = c => GUIDE_ALL.find(i => i.code === c) || null;
const gHash = c => "g-" + c.toLowerCase().replace(/\./g, "-");
const gxNext = () => GX_CODES.find(c => !gxDone(c)) || GX_CODES[0];

/* ---------- Daily activity ---------- */
function dayRec(k = todayKey()) { return S.days[k] || (S.days[k] = { xp: 0, sec: 0, rev: 0 }); }
const dayGet = k => S.days[k] || { xp: 0, sec: 0, rev: 0 };
function streakNow() {
  if (!S.lastDay) return 0;
  return S.lastDay === todayKey() || S.lastDay === keyOf(dayNum() - 1) ? S.streak : 0;
}
// A new week: remember last week's result for the league table, then start from zero
function rollWeek(st = S) {
  const wk = weekKey();
  if (st.week === wk) return;
  const prev = keyOf(weekStart(dayNum()) - 7);
  if (st.week) { st.pw = prev; st.pwxp = st.week === prev ? st.wxp || 0 : 0; st.plg = st.lg || 1; }
  st.week = wk; st.wxp = 0;
  if (st === S) setTimeout(lgSettle, 0);
}
// Any answer keeps the streak alive (XP may be zero for a careless session, the day still counts)
function touchDay() {
  const t = todayKey();
  if (S.day !== t) { S.day = t; S.dayXp = 0; }
  rollWeek();
  if (!S.first) S.first = firstDay();
  if (S.lastDay === t) return;
  frzApply();
  const back = S.lastDay ? dayNum() - Math.round(Date.parse(S.lastDay) / DAY) : 0;
  S.streak = S.lastDay === keyOf(dayNum() - 1) ? S.streak + 1 : 1;
  S.lastDay = t;
  S.best = Math.max(S.best, S.streak);
  // Keep about four months of history
  const old = keyOf(dayNum() - 120);
  Object.keys(S.days).forEach(k => { if (k < old) delete S.days[k]; });
  catStreakCheer(back);
}
function addXP(n) {
  touchDay();
  S.xp += n; S.dayXp += n; S.wxp += n; dayRec().xp += n;
  goalCheck();
  const hr = new Date().getHours();
  if (hr >= 22) S.night = 1;
  if (hr < 7) S.early = 1;
  save();
}

/* ---------- XP: a fixed reward for each finished task, guarded against farming ----------
   Vocabulary test 30, grammar 40, reading 40, listening 40, writing 60, speaking 60;
   all daily tasks 100, every 7th day of a streak 150, the weekly challenge 250.
   The reward shrinks with a low share of right answers, a short set, repeating the same exercise on
   the same day and random fast tapping; activity XP per day has a ceiling (bonuses come on top). */
const XP_VAL = { vocab: 30, grammar: 40, reading: 40, listening: 40, writing: 60, speaking: 60, daily: 100, streak7: 150, weekly: 250 };
const XP_KIND = { vocab: "Lugʻat testi", grammar: "Grammatika mashqi", reading: "Oʻqish", listening: "Tinglash", writing: "Yozish topshirigʻi", speaking: "Gapirish" };
const XP_DAY_CAP = 1500;
const XP_MIN_ACC = 0.4, XP_FULL_ACC = 0.8;
const XP_REPEAT = [1, 0.5, 0.25];
const XP_MIN_ITEMS = 5;
let XP_FAST_MS = 900;
function xpDay() {
  const t = todayKey();
  if (!S.xpr || S.xpr.d !== t) S.xpr = { d: t, a: 0, k: {} };
  return S.xpr;
}
const median = a => { const b = a.slice().sort((x, y) => x - y), m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
// o: { right, n } or { acc }, key (same exercise = same key), times (ms per answer), half (self-rated cards)
function xpCalc(kind, o) {
  const base = XP_VAL[kind] || 0, d = xpDay();
  const acc = o.acc !== undefined ? o.acc : o.n ? o.right / o.n : 0;
  const rep = o.key ? d.k[o.key] || 0 : 0;
  const out = { kind, acc, base, xp: 0, why: "", rep, q: false };
  if (o.times && o.times.length >= 3 && median(o.times) < XP_FAST_MS) { out.why = "fast"; return out; }
  if (acc < XP_MIN_ACC) { out.why = "low"; return out; }
  out.q = acc >= 0.5 && rep < 2;
  let k = Math.min(1, (acc - 0.3) / (XP_FULL_ACC - 0.3));
  if (o.n !== undefined && o.acc === undefined) k *= Math.min(1, o.n / XP_MIN_ITEMS);
  if (o.half) k *= 0.5;
  const f = rep < XP_REPEAT.length ? XP_REPEAT[rep] : 0;
  if (f < 1) out.why = "repeat";
  let xp = Math.round(base * k * f);
  if (xp > XP_DAY_CAP - d.a) { xp = Math.max(0, XP_DAY_CAP - d.a); out.why = "cap"; }
  out.xp = xp;
  return out;
}
// Grants the reward, counts the attempt, moves daily tasks and the weekly challenge forward
function xpAward(kind, o = {}) {
  const r = xpCalc(kind, o), d = xpDay();
  if (o.key) d.k[o.key] = (d.k[o.key] || 0) + 1;
  touchDay();
  if (r.xp > 0) {
    d.a += r.xp;
    const sk = [].concat(o.sk || XP_SKILL[kind] || []);
    sk.forEach(id => { if (S.sk[id]) S.sk[id][2] += Math.round(r.xp / sk.length); });
    addXP(r.xp);
  } else save();
  if (r.q) { dqMark(kind); wcMark(o.sk || XP_SKILL[kind]); }
  return r;
}
const XP_SKILL = { vocab: ["r"], grammar: ["r"], reading: ["r"], listening: ["l"], writing: ["w"], speaking: ["s"] };
const xpWhy = r => r.why === "fast" ? "Javoblar juda tez bosildi — bu safar XP berilmadi. Har bir savolni oʻqib javob bering."
  : r.why === "low" ? `Toʻgʻri javoblar ${Math.round(r.acc * 100)}% — XP uchun kamida ${Math.round(XP_MIN_ACC * 100)}% kerak.`
  : r.why === "repeat" ? (r.xp ? `Bu mashq bugun ${r.rep + 1}-marta — XP kamaydi. Yangi mashq tanlang!` : "Bu mashqni bugun koʻp takrorladingiz — XP endi ertaga. Boshqa mashq tanlang!")
  : r.why === "cap" ? `Bugungi XP chegarasi (${XP_DAY_CAP}) toʻldi. Dam oling, ertaga davom etamiz!` : "";

/* Levels: level n needs 50·n·(n−1) XP (2 → 100, 5 → 1000, 10 → 4500, 20 → 19000, 50 → 122500) */
const lvlXP = n => 50 * n * (n - 1);
const lvlOf = xp => Math.max(1, Math.floor((1 + Math.sqrt(1 + Math.max(0, xp) / 12.5)) / 2));
const CAT_STAGES = [
  { lv: 1, id: "kitten", uz: "Mushukcha", d: "Qiziquvchan, endi oʻrganishni boshlagan mushukcha" },
  { lv: 5, id: "student", uz: "Oʻquvchi mushuk", d: "Bantikli tirishqoq oʻquvchi" },
  { lv: 10, id: "smart", uz: "Bilimdon mushuk", d: "Koʻzoynak taqqan bilimdon" },
  { lv: 20, id: "grad", uz: "Diplomli mushuk", d: "Qalpoq va diplom — haqiqiy bitiruvchi" },
  { lv: 30, id: "wizard", uz: "Sehrgar mushuk", d: "Turk tilining sehrini egallagan" },
  { lv: 40, id: "royal", uz: "Qirollik mushugi", d: "Toj va qirollik plashi" },
  { lv: 50, id: "legend", uz: "Afsonaviy mushuk", d: "Oltin nur taratuvchi afsona" }
];
const catStage = (lv = lvlOf(S.xp)) => CAT_STAGES.filter(s => s.lv <= lv).pop();
const catLook = () => catStage().id;
// A new level is a small party; a new look for Pamuk is a big one
function lvlCheck() {
  const lv = lvlOf(S.xp);
  if (!S.lvl) { S.lvl = lv; return; }
  if (lv <= S.lvl) return;
  const was = catStage(S.lvl), now = catStage(lv);
  S.lvl = lv;
  celebrate({ eyebrow: "Yangi daraja!", badge: lv, title: `${lv}-daraja ochildi!`, c: "violet",
    text: now !== was ? `Pamuk endi — «${now.uz}»! ${now.d}.` : `Pamuk bayram qilyapti! Keyingi daraja uchun ${lvlXP(lv + 1) - S.xp} XP qoldi.`,
    look: now.id, share: now !== was, shareText: `Türkçe Yoʻl'da ${lv}-darajaga chiqdim! Turk tilini bepul oʻrganing:` });
}

/* Pamuk's mood follows the learner: a streak makes him glad, a long break makes him miss you */
let PAMUK_LATER = null;
function pamukSoon(mood, text) { if (SES && !SES.done) PAMUK_LATER = [mood, text]; else setTimeout(() => pamukSay(mood, text), 400); }
function catStreakCheer(back) {
  if (S.streak > 1 && S.streak % 7 === 0) {
    addXPBonus(XP_VAL.streak7);
    const fz = frzGive();
    celebrate({ eyebrow: "Ketma-ket kunlar", badge: S.streak, title: `${S.streak} kun ketma-ket!`, text: `Pamuk quvonchdan sakrayapti! Seriya uchun +${XP_VAL.streak7} XP${fz ? " va 1 ta seriya muzlatgichi" : ""}.`, ico: "flame", c: "orange", share: true });
  } else if (S.streak > 1) pamukSoon("happy", `${S.streak} kun ketma-ket! Pamuk sizdan juda xursand`);
  else if (back >= 3) pamukSoon("happy", "Qaytganingizdan xursandman! Bugun ozgina boʻlsa ham mashq qilamiz");
}
// Bonus XP (daily tasks, streak, weekly challenge) — outside the daily activity ceiling
function addXPBonus(n) { S.xp += n; S.dayXp += n; S.wxp += n; dayRec().xp += n; }

/* ---------- Streak freeze (Android 6-bosqich, 2-qism) ----------
   A freeze keeps the streak over a day without practice. Freezes are earned, not bought — spending XP would lower
   levels, frames and league places: one for every 7 days in a row and one for a weekly challenge, FRZ_MAX at most.
   Missed days are covered when the progress loads (migrate), the app comes back or the next practice starts:
   lastDay moves to yesterday, the covered days go to S.frzD (calendar, week row), S.frzNew → one Pamuk message. */
const FRZ_MAX = 2;
function frzApply(st = S) {
  if (!st.lastDay || !st.streak || !st.frz) return 0;
  const last = Math.round(Date.parse(st.lastDay) / DAY), miss = dayNum() - last - 1;
  if (miss < 1 || miss > st.frz) return 0;
  st.frz -= miss;
  st.frzD = (st.frzD || []).concat(Array.from({ length: miss }, (_, i) => keyOf(last + 1 + i))).slice(-40);
  st.lastDay = keyOf(dayNum() - 1);
  st.frzNew = miss;
  return miss;
}
function frzGive() { if ((S.frz || 0) >= FRZ_MAX) return false; S.frz = (S.frz || 0) + 1; return true; }
function frzNotice() {
  if (!S.frzNew) return;
  const n = S.frzNew; delete S.frzNew; save();
  pamukSoon("happy", `Muzlatgich seriyangizni saqlab qoldi${n > 1 ? ` (${n} kun)` : ""}! Bugun mashq qilib, davom ettiring`);
}
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && frzApply()) { save(); frzNotice(); kRerender(); } });

/* Daily goal: the first time practice XP today reaches the goal — a celebration (after the practice, like achievements); bonuses alone do not trigger it */
function goalCheck() {
  if (S.dayXp < S.goal || S.goalD === todayKey()) return;
  S.goalD = todayKey(); S.goalN = (S.goalN || 0) + 1;
  const st = streakNow();
  celebrate({ eyebrow: "Kunlik maqsad", badge: S.goal, title: "Bugungi maqsad bajarildi!", text: `${S.goal} XP toʻplandi. ${st > 1 ? `Seriya: ${st} kun — ertaga ham kutaman!` : "Ertaga ham shu tempda davom etamiz!"}`, ico: "target", c: "green", share: true, shareText: `Bugun Türkçe Yoʻl'da kunlik maqsadimni bajardim (${S.goal} XP)! Turk tilini bepul oʻrganing:` });
}
const daysAway = () => S.lastDay ? dayNum() - Math.round(Date.parse(S.lastDay) / DAY) : 0;

/* ---------- Daily reminders ----------
   The learner picks an hour; if that day has no practice yet, a notification comes.
   Two ways: the server push (GitHub Actions → tools/push.js reads push/{uid} and sends through FCM; needs
   window.FCM_VAPID) and, without a server, Periodic Background Sync of an installed app (sw.js reads ty-meta). */
const remHour = () => (S.rem && S.rem.h) || 0;
// In the Android app the phone's own notification permission (LocalNotifications plugin, NREM_PERM)
let NREM_PERM = "prompt";
const remOk = () => IS_NATIVE ? NREM_PERM === "granted" : typeof Notification !== "undefined" && Notification.permission === "granted";
function remText() {
  const h = remHour();
  if (!h) return "Mashq qilinmagan kuni eslatamiz";
  if (!remOk()) return `Bildirishnomalarga ruxsat yoʻq — ${IS_NATIVE ? "telefon" : "brauzer"} sozlamalarida yoqing`;
  return `Har kuni ${h}:00 da, agar oʻsha kuni hali mashq qilmagan boʻlsangiz`;
}
async function remSet(v) {
  const h = +v || 0;
  if (h && IS_NATIVE) {
    const ln = nativePlugin("LocalNotifications");
    if (!ln) { toast("Bu ilova versiyasida eslatmalar yoʻq — ilovani yangilang"); return; }
    let p = {};
    try { p = await ln.requestPermissions(); } catch (e) {}
    NREM_PERM = p.display || "denied";
    if (NREM_PERM !== "granted") { toast("Eslatmaga ruxsat berilmadi. Telefon sozlamalari → Ilovalar → Türkçe Yoʻl → Bildirishnomalar"); return; }
  } else if (h) {
    if (typeof Notification === "undefined") { toast(isIOS() && !isStandalone() ? "iPhone'da eslatmalar uchun saytni bosh ekranga qoʻshing (Ulashish → Bosh ekranga)" : "Bu brauzer eslatmalarni qoʻllamaydi"); return; }
    if (Notification.permission !== "granted") {
      let p = "denied";
      try { p = await Notification.requestPermission(); } catch (e) {}
      if (p !== "granted") { toast("Eslatmaga ruxsat berilmadi. Brauzer sozlamalarida bildirishnomalarni yoqish mumkin"); return; }
    }
  }
  S.rem = { h }; save();
  const y = window.scrollY; route(); window.scrollTo(0, y);
  remSync();
  if (h) { toast(`Har kuni ${h}:00 da eslatamiz — agar oʻsha kuni mashq qilmagan boʻlsangiz`); pamukSoon("happy", "Kelishdik! Men sizga eslatib turaman"); }
  else toast("Eslatma oʻchirildi");
}
// The standalone Android app (Capacitor) opens these same files from inside the app: tools/native-www.js sets
// window.TY_NATIVE, the local Firebase SDK folder and the site address for the audio recordings
const IS_NATIVE = window.TY_NATIVE === 1 || !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
const FB_BASE = window.FB_SDK_BASE || "https://www.gstatic.com/firebasejs/10.12.2/";
// Recordings: the website reads its own audio/; the app plays them from the site (they are not packed into the app)
const AUDIO_BASE = window.AUDIO_BASE || (IS_NATIVE ? "https://turkceyol.web.app/" : "");
// Capacitor plugins without a bundler: the native bridge gives a proxy (null on the website or when the plugin is missing)
const nativePlugin = name => {
  try { const C = window.Capacitor; if (!IS_NATIVE || !C) return null; if (C.isPluginAvailable && !C.isPluginAvailable(name)) return null; return (C.Plugins && C.Plugins[name]) || (C.registerPlugin ? C.registerPlugin(name) : null); } catch (e) { return null; }
};
if (IS_NATIVE) document.documentElement.classList.add("native");
// The app: a long press on text gives no "Copy / Select all" menu (styles.css → html.native); only typing fields keep it
if (IS_NATIVE) document.addEventListener("contextmenu", e => { if (!(e.target.closest && e.target.closest("input, textarea, [contenteditable='true']"))) e.preventDefault(); });
// Google sign-in in the app goes through the phone's own account window (FirebaseAuthentication plugin)
if (IS_NATIVE && !nativePlugin("FirebaseAuthentication")) document.documentElement.classList.add("native-nogoogle");
let REM_SIG = "", FCM_T = null;
const swReady = () => !IS_NATIVE && location.protocol === "https:" && "serviceWorker" in navigator ? Promise.race([navigator.serviceWorker.ready, new Promise(r => setTimeout(r, 4000))]) : Promise.resolve(null);
function loadScript(src) { return new Promise((ok, fail) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = fail; document.head.appendChild(s); }); }
async function fcmToken() {
  if (FCM_T) return FCM_T;
  if (IS_NATIVE) return null; // the app gets its own push channel later (Android 4-bosqich)
  if (!firebase.messaging) await loadScript(FB_BASE + "firebase-messaging-compat.js");
  if (!firebase.messaging || (firebase.messaging.isSupported && !firebase.messaging.isSupported())) return null;
  const reg = await swReady();
  FCM_T = await firebase.messaging().getToken(Object.assign({ vapidKey: window.FCM_VAPID }, reg ? { serviceWorkerRegistration: reg } : {}));
  return FCM_T;
}
// UTC hour for a local hour (the server runs in UTC)
const remUtcHour = (h, z = new Date().getTimezoneOffset()) => ((Math.floor(h + z / 60) % 24) + 24) % 24;
async function remSync() {
  if (IS_NATIVE) { widgetSync(); return nremSync(); }
  const h = remHour(), on = !!h && remOk(), s = streakNow();
  // For the service worker: what to say and whether today already has practice
  try {
    const c = await caches.open("ty-meta"), old = await c.match("./__remind").then(r => r ? r.json() : {}).catch(() => ({}));
    await c.put("./__remind", new Response(JSON.stringify({ on, h, last: S.lastDay || "", s, sent: old.sent || "" })));
    if (on) { const reg = await swReady(); if (reg && reg.periodicSync) await reg.periodicSync.register("ty-remind", { minInterval: 6 * 3600e3 }).catch(() => {}); }
  } catch (e) {}
  if (!USER || !db || !FB) return;
  if (!on) {
    if (S.rem && REM_SIG !== "off") { REM_SIG = "off"; db.collection("push").doc(USER.uid).delete().catch(() => {}); }
    return;
  }
  if (!window.FCM_VAPID) return;
  const z = new Date().getTimezoneOffset(), sig = [h, z, S.lastDay, s].join("|");
  if (sig === REM_SIG) return;
  REM_SIG = sig;
  try {
    const t = await fcmToken();
    if (!t) return;
    await db.collection("push").doc(USER.uid).set({ t, h: remUtcHour(h, z), z, d: S.lastDay || "", s, at: firebase.firestore.FieldValue.serverTimestamp() });
  } catch (e) { REM_SIG = ""; }
}

/* The Android app: reminders scheduled on the phone itself (LocalNotifications), no server needed.
   The next NREM_DAYS days at the chosen hour get one notification each (ids NREM_ID…); a day with practice gets none,
   so every save()/return to the app schedules them again: practice today → the list starts tomorrow. After
   NREM_DAYS days without the app the reminders stop by themselves. */
const NREM_ID = 7000, NREM_DAYS = 7;
const NREM_TXT = [
  ["Pamuk sizni kutyapti", "Bugun 5 daqiqa turk tili? Bir nechta soʻz — katta qadam."],
  ["Bugungi soʻzni koʻrdingizmi?", "Pamuk yangi soʻz tayyorlab qoʻydi. 5 daqiqalik mashq — va kun bekor ketmaydi."],
  ["Merhaba! Nasılsın?", "Turk tilingiz sizni sogʻindi. Bitta qisqa mashq bilan qayting."],
  ["Damlaya damlaya göl olur", "Tomchi-tomchi koʻl boʻlur: bugun ham ozgina mashq qilamizmi?"]
];
let NREM_SIG = "";
// The notifications to schedule (pure: tests read it): [{ id, at, title, body }]
function nremPlan(now = Date.now()) {
  const h = remHour(), out = [];
  if (!h) return out;
  const done = S.lastDay === todayKey(), s = streakNow(), t0 = new Date(now);
  for (let k = 0; k < NREM_DAYS; k++) {
    const at = new Date(t0.getFullYear(), t0.getMonth(), t0.getDate() + k, h, 0, 0, 0);
    if (k === 0 && (done || at.getTime() <= now + 60e3)) continue;
    // The streak is still alive only on the first reminder day
    const first = !out.length && s > 0 && (k === 0 || (k === 1 && done));
    const [title, body] = first ? ["Seriyangiz yoʻqolmasin!", `${s} kun ketma-ket — bugun ham 5 daqiqa mashq qiling. Pamuk kutyapti!`] : NREM_TXT[(dayNum(at.getTime()) + k) % NREM_TXT.length];
    out.push({ id: NREM_ID + k, at, title, body });
  }
  return out;
}
async function nremSync(force) {
  const ln = nativePlugin("LocalNotifications"); if (!ln) return;
  const plan = remOk() ? nremPlan() : [];
  const sig = plan.map(n => n.id + "@" + n.at.getTime() + n.title).join("|");
  if (sig === NREM_SIG && !force) return;
  NREM_SIG = sig;
  try {
    await ln.cancel({ notifications: Array.from({ length: NREM_DAYS }, (_, k) => ({ id: NREM_ID + k })) });
    if (!plan.length) return;
    await ln.schedule({ notifications: plan.map(n => ({ id: n.id, title: n.title, body: n.body, channelId: "remind", smallIcon: "ic_stat_pamuk", iconColor: "#3B5BDB", extra: { url: "#home" }, autoCancel: true, isExactNotification: false, schedule: { at: n.at, allowWhileIdle: true } })) });
  } catch (e) { NREM_SIG = ""; }
}
if (IS_NATIVE) (() => {
  const ln = nativePlugin("LocalNotifications"); if (!ln) return;
  try {
    const c = ln.createChannel({ id: "remind", name: "Kunlik eslatma", description: "Mashq qilinmagan kuni Pamuk eslatadi", importance: 4, visibility: 1 }); if (c && c.catch) c.catch(() => {});
    ln.addListener("localNotificationActionPerformed", a => { const u = a && a.notification && a.notification.extra && a.notification.extra.url; location.hash = /^#[a-z0-9-]+$/.test(u || "") ? u : "#home"; });
    ln.checkPermissions().then(p => { NREM_PERM = p.display || "prompt"; nremSync(true); }, () => {});
  } catch (e) {}
  // Back in the app (maybe on another day, or the permission was changed in the phone settings)
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") ln.checkPermissions().then(p => { NREM_PERM = p.display || "prompt"; nremSync(); }, () => {}); });
})();

/* The Android app's home-screen widget (native TyWidget + TyWidgetPlugin): the streak, today's XP and goal, and the
   word of the day for the next 7 days — the widget itself works out a new day (no practice yet → 0 XP, streak kept
   only from yesterday). Sent after save() (with the reminders) and when the app goes to the background. */
let WG_SIG = "";
function widgetData() {
  const n = dayNum();
  return { day: todayKey(), last: S.lastDay || "", streak: S.streak || 0, xp: S.day === todayKey() ? S.dayXp || 0 : 0, goal: S.goal || 50,
    words: Array.from({ length: 7 }, (_, k) => { const w = wordOfDay(n + k); return [keyOf(n + k), w.tr, w.uz]; }) };
}
function widgetSync() {
  const p = nativePlugin("TyWidget"); if (!p) return;
  let d; try { d = widgetData(); } catch (e) { return; }
  const sig = JSON.stringify(d);
  if (sig === WG_SIG) return;
  WG_SIG = sig;
  try { const r = p.update(d); if (r && r.catch) r.catch(() => { WG_SIG = ""; }); } catch (e) { WG_SIG = ""; }
}
if (IS_NATIVE) document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") widgetSync(); });
