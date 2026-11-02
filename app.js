/* Türkçe Yoʻl — app logic.
   Data comes from content.js (UNITS) and grammar.js (LETTERS, GRAMMAR). */

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
function blank() {
  return {
    xp: 0, streak: 0, best: 0, lastDay: null, day: todayKey(), dayXp: 0,
    known: {}, gram: {}, srs: {}, newDay: { d: 0, n: 0 },
    days: {}, sessions: 0, perfect: 0, acc: [0, 0], ust: {},
    week: "", wxp: 0, goal: 50, pub: true, gx: {}, gxm: {}, k: {}, ktest: {}, onb: 0, trUses: 0, shared: 0, night: 0, early: 0, pron: [0, 0], sk: skBlank(), roles: 0, anon: true
  };
}
let S = blank();
let KEYU = KEY;
function loadLocal(key) {
  let v = blank();
  try { const raw = localStorage.getItem(key); if (raw) v = Object.assign(blank(), JSON.parse(raw)); } catch (e) {}
  return migrate(v);
}
function save() { try { localStorage.setItem(KEYU, JSON.stringify(S)); } catch (e) {} cloudSave(); clearTimeout(achTimer); achTimer = setTimeout(checkAch, 450); }

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
  if (st.week !== weekKey()) { st.week = weekKey(); st.wxp = 0; }
  st.best = Math.max(st.best || 0, st.streak || 0);
  // Skill stats arrived later: start them from what we already know (pronunciation)
  if (!st.skv) { st.skv = 1; st.sk = skBlank(); const p = st.pron || [0, 0]; st.sk.s[0] = p[0]; st.sk.s[1] = p[1]; }
  ["r", "l", "w", "s"].forEach(id => { if (!st.sk[id]) st.sk[id] = [0, 0, 0, 0]; });
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
/* Rule exercises tied to the book topics (grammar-ex.js) */
const GX_CODES = Object.keys(BX);
const gxSolved = c => (S.gx[c] || []).filter(Boolean).length;
const gxDone = c => gxSolved(c) >= BX[c].length;
const gxDoneCount = lv => GX_CODES.filter(c => (!lv || c.startsWith(lv + ".")) && gxDone(c)).length;
const gxCount = lv => GX_CODES.filter(c => c.startsWith(lv + ".")).length;
const gxMistakes = () => Object.keys(S.gxm).filter(k => S.gxm[k] > 0 && BX[k.split("#")[0]]);
const GUIDE_ALL = [];
GUIDE.forEach(l => l.groups.forEach(g => g.items.forEach(i => GUIDE_ALL.push(Object.assign({ level: l.id, group: g.name }, i)))));
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
function addXP(n) {
  const t = todayKey();
  if (S.day !== t) { S.day = t; S.dayXp = 0; }
  if (S.week !== weekKey()) { S.week = weekKey(); S.wxp = 0; }
  if (S.lastDay !== t) {
    S.streak = S.lastDay === keyOf(dayNum() - 1) ? S.streak + 1 : 1;
    S.lastDay = t;
    S.best = Math.max(S.best, S.streak);
    // Keep about four months of history
    const old = keyOf(dayNum() - 120);
    Object.keys(S.days).forEach(k => { if (k < old) delete S.days[k]; });
  }
  S.xp += n; S.dayXp += n; S.wxp += n; dayRec().xp += n;
  const hr = new Date().getHours();
  if (hr >= 22) S.night = 1;
  if (hr < 7) S.early = 1;
  save();
}
function record(w, ok) {
  dayRec().rev++;
  S.acc[1]++; if (ok) S.acc[0]++;
  const id = UNITS[w.unit].id, u = S.ust[id] || (S.ust[id] = [0, 0]);
  u[1]++; if (ok) u[0]++;
}
function tick() {
  if (!SES) return;
  const now = Date.now(), sec = Math.min(now - SES.last, 45000) / 1000;
  dayRec().sec += sec;
  if (SES.sk) skillTime(SES.sk, sec);
  SES.last = now;
}
/* ---------- Four skills: Okuma, Dinleme, Yazma, Konuşma ----------
   Every exercise is tagged with one or two skills. Totals live in S.sk[id] = [right, tries, xp, seconds],
   and each day keeps S.days[k].sk[id] = [right, tries, seconds] for the charts and the balance score. */
const SKILLS = [
  { id: "r", tr: "Okuma", uz: "Oʻqish", ico: "book", c: "sky" },
  { id: "l", tr: "Dinleme", uz: "Tinglash", ico: "ear", c: "violet" },
  { id: "w", tr: "Yazma", uz: "Yozish", ico: "type", c: "pink" },
  { id: "s", tr: "Konuşma", uz: "Gapirish", ico: "mic", c: "green" }
];
function skBlank() { return { r: [0, 0, 0, 0], l: [0, 0, 0, 0], w: [0, 0, 0, 0], s: [0, 0, 0, 0] }; }
function skDay(id) { const d = dayRec(); d.sk = d.sk || {}; return d.sk[id] || (d.sk[id] = [0, 0, 0]); }
function skillLog(ids, ok, xp = 0) {
  ids = [].concat(ids || []);
  ids.forEach(id => {
    const a = S.sk[id]; if (!a) return;
    a[1]++; if (ok) a[0]++; a[2] += Math.round(xp / ids.length);
    const b = skDay(id); b[1]++; if (ok) b[0]++;
  });
}
function skillTime(ids, sec) {
  ids = [].concat(ids || []);
  ids.forEach(id => { if (!S.sk[id]) return; S.sk[id][3] += sec / ids.length; skDay(id)[2] += sec / ids.length; });
}
// Sums over the last `days` days: o = right, n = tries, t = seconds
function skStats(days = 14, from = 0) {
  const out = {};
  SKILLS.forEach(s => out[s.id] = { o: 0, n: 0, t: 0 });
  for (let i = from; i < from + days; i++) {
    const d = dayGet(keyOf(dayNum() - i));
    if (!d.sk) continue;
    Object.keys(d.sk).forEach(id => { if (!out[id]) return; const a = d.sk[id]; out[id].o += a[0]; out[id].n += a[1]; out[id].t += a[2] || 0; });
  }
  return out;
}
// Balance = weakest skill's right answers / strongest skill's right answers
const skBalance = st => { const v = SKILLS.map(s => st[s.id].o), mx = Math.max(...v); return mx ? Math.round(Math.min(...v) / mx * 100) : 0; };
const skAcc = x => x.n ? pct(x.o, x.n) : null;
const skWeakest = st => SKILLS.slice().sort((a, b) => st[a.id].o - st[b.id].o || st[a.id].n - st[b.id].n)[0];
const skToday = () => { const d = dayGet(todayKey()).sk || {}; return SKILLS.filter(s => d[s.id] && d[s.id][1]); };
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
const accOf = ids => { let c = 0, t = 0; ids.forEach(id => { const u = S.ust[id]; if (u) { c += u[0]; t += u[1]; } }); return t ? pct(c, t) : null; };

/* ---------- Helpers ---------- */
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
// Keep suffixes like "-ga" from breaking after the hyphen
const nb = s => esc(s).replace(/(^|\s)-(\S)/g, "$1‑$2");
const pad = n => String(n).padStart(2, "0");
const fold = s => s.toLocaleLowerCase("tr").replace(/[?!.,;:…]/g, "").replace(/\s+/g, " ").trim();
const plain = s => fold(s).replace(/ç/g, "c").replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ü/g, "u").replace(/â/g, "a");
const $ = id => document.getElementById(id);
let uid = 0;

const sv = (d, extra = "") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
const ICON = {
  search: sv('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  speak: sv('<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>'),
  chev: sv('<path d="m9 6 6 6-6 6"/>', 'class="chev"'),
  back: sv('<path d="m15 6-6 6 6 6"/>'),
  play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>',
  plus: sv('<path d="M12 5v14M5 12h14"/>'),
  check: sv('<path d="m5 12 5 5 9-10"/>', 'stroke-width="3"'),
  bulb: sv('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>'),
  cards: sv('<rect x="3" y="6" width="13" height="15" rx="3"/><path d="M8 3h10a3 3 0 0 1 3 3v11"/>'),
  quiz: sv('<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>'),
  type: sv('<rect x="2" y="6" width="20" height="12" rx="3"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>'),
  list: sv('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'),
  clock: sv('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  target: sv('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
  spark: sv('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>'),
  chat: sv('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>'),
  home: sv('<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>'),
  cup: sv('<path d="M4 8h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 2v3M12 2v3"/>'),
  plane: sv('<path d="M10.5 13.5 3 11l1.5-1.5 7.5 1L16.5 6a2 2 0 0 1 3 3L15 13.5l1 7.5-1.5 1.5-2.5-7.5L9 18l.5 2.5L8 22l-1.5-4.5L2 16l1.5-1.5L6 15z"/>'),
  case: sv('<rect x="3" y="7" width="18" height="13" rx="3"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>'),
  book: sv('<path d="M2 5.5C4 4 7 4 12 6c5-2 8-2 10-.5V19c-2-1.5-5-1.5-10 .5-5-2-8-2-10-.5z"/><path d="M12 6v13.5"/>'),
  star: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2.5 2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.2 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>',
  flame: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2c1 4 5 5.5 5 11a5 5 0 0 1-10 0c0-2.5 1.2-4 2.5-5 .2 1.8 1 3 2.2 3.4C11 9 11 5 12 2z"/></svg>',
  crown: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 7l4.5 4L12 4l4.5 7L21 7l-2 12H5z"/></svg>',
  cap: sv('<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5M22 9v6"/>'),
  flag: sv('<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>'),
  bolt: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
  lock: sv('<rect x="5" y="11" width="14" height="10" rx="3"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  word: sv('<path d="M4 7V5h16v2M9 19h6M12 5v14"/>'),
  camera: sv('<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>'),
  translate: sv('<path d="M4 5h8M8 3v2M5.5 5c.5 3 2.5 5.5 5.5 7M10.5 5c-.5 3-2.5 5.5-5.5 7"/><path d="M12 21l4.5-10L21 21M13.5 17.5h6"/>'),
  copy: sv('<rect x="8" y="8" width="12" height="12" rx="3"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>'),
  swap: sv('<path d="M7 7h13l-4-4M17 17H4l4 4"/>'),
  male: sv('<circle cx="10" cy="14" r="5"/><path d="M14 10l6-6M15 4h5v5"/>'),
  female: sv('<circle cx="12" cy="9" r="5"/><path d="M12 14v7M9 18h6"/>'),
  download: sv('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
  heart: sv('<path d="M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z"/>'),
  moon: sv('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>'),
  sun: sv('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  globe: sv('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
  ear: sv('<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="5" height="7" rx="2"/><rect x="16" y="14" width="5" height="7" rx="2"/>'),
  mic: sv('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>')
};
const pawPath = '<ellipse cx="12" cy="16" rx="5.2" ry="4.4"/><ellipse cx="5.8" cy="10.4" rx="2.3" ry="2.7"/><ellipse cx="9.6" cy="6.6" rx="2.3" ry="2.8"/><ellipse cx="14.4" cy="6.6" rx="2.3" ry="2.8"/><ellipse cx="18.2" cy="10.4" rx="2.3" ry="2.7"/>';
const logo = `<span class="logo" aria-hidden="true">${catSVG({ pose: "head", lite: true })}</span>`;

/* Brand cat poses used across the app (drawn in cat.js) */
function mascot(kind, cls = "") {
  const opt = { wave: { pose: "wave" }, cap: { pose: "sit", acc: "cap" }, trophy: { pose: "sit", acc: "stars" }, sit: { pose: "sit" }, head: { pose: "head" } }[kind] || { pose: "sit" };
  return catSVG(Object.assign({ cls: "mascot " + cls }, opt));
}

function ring(p, size, stroke, color, cls) {
  const r = (size - stroke) / 2, C = 2 * Math.PI * r;
  return `<svg class="${cls}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle class="ring-bg" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}"/><circle class="ring-fg" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}" stroke="${color}" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - Math.min(1, p))}"/></svg>`;
}
function pctRing(p) {
  return `<span class="pct-ring">${ring(p, 44, 4, "var(--accent)", "")}${Math.round(p * 100)}%</span>`;
}
function wordState(w) {
  const k = known(w);
  if (k === 2) return `<span class="state done" title="Oʻrganilgan">${ICON.check}</span>`;
  const st = srs(w);
  const p = !st ? 0 : 0.25 + Math.min(st.r, 2) * 0.25;
  return `<span class="state" title="${st ? "Oʻrganilmoqda" : "Yangi"}">${ring(p, 28, 3, "var(--accent)", "")}</span>`;
}

/* Charts */
function smoothPath(pts) {
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    // Keep control points between the two ends so the curve never dips below a real value (e.g. under 0)
    const lo = Math.min(p1[1], p2[1]), hi = Math.max(p1[1], p2[1]), cl = v => Math.min(hi, Math.max(lo, v));
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, cl(p1[1] + (p2[1] - p0[1]) / 6)];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, cl(p2[1] - (p3[1] - p1[1]) / 6)];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0]},${p2[1]}`;
  }
  return d;
}
const niceMax = v => { if (v <= 10) return 10; const p = Math.pow(10, Math.floor(Math.log10(v))); return Math.ceil(v / p * 2) / 2 * p; };
function lineChart(vals, labels) {
  const n = ++uid, W = 320, H = 170, L = 30, R = 10, T = 22, B = 26;
  const max = niceMax(Math.max(...vals)), x = i => L + i * (W - L - R) / (vals.length - 1), y = v => T + (H - T - B) * (1 - v / max);
  const pts = vals.map((v, i) => [+x(i).toFixed(1), +y(v).toFixed(1)]);
  const line = smoothPath(pts);
  const grid = [0, 0.5, 1].map(f => `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(max * f)}" y2="${y(max * f)}"/><text x="${L - 6}" y="${y(max * f) + 4}" text-anchor="end">${Math.round(max * f)}</text>`).join("");
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Haftalik XP: ${vals.join(", ")}">
    <defs><linearGradient id="lg${n}" x1="0" x2="1"><stop offset="0" style="stop-color:#ff6b8b"/><stop offset=".35" style="stop-color:#ffa94d"/><stop offset=".65" style="stop-color:#4fd18b"/><stop offset="1" style="stop-color:#6f8dff"/></linearGradient>
    <linearGradient id="la${n}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.18"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient></defs>
    ${grid}
    <path d="${line} L${pts[pts.length - 1][0]},${y(0)} L${pts[0][0]},${y(0)} Z" fill="url(#la${n})"/>
    <path d="${line}" fill="none" stroke="url(#lg${n})" stroke-width="4" stroke-linecap="round"/>
    ${pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="${vals[i] ? 5 : 3.5}" fill="var(--card-strong)" stroke="url(#lg${n})" stroke-width="3"/>${vals[i] ? `<text class="val" x="${p[0]}" y="${p[1] - 10}" text-anchor="middle">${vals[i]}</text>` : ""}`).join("")}
    ${labels.map((l, i) => `<text x="${x(i)}" y="${H - 6}" text-anchor="middle">${l}</text>`).join("")}
  </svg>`;
}
function barChart(vals, labels) {
  const n = ++uid, W = 320, H = 170, L = 30, R = 6, T = 20, B = 26;
  const max = niceMax(Math.max(...vals)), slot = (W - L - R) / vals.length, bw = Math.min(26, slot * 0.6);
  const y = v => T + (H - T - B) * (1 - v / max);
  const grid = [0, 0.5, 1].map(f => `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(max * f)}" y2="${y(max * f)}"/><text x="${L - 6}" y="${y(max * f) + 4}" text-anchor="end">${Math.round(max * f)}</text>`).join("");
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Kunlik oʻqish vaqti, daqiqa: ${vals.join(", ")}">
    <defs><linearGradient id="bg${n}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" style="stop-color:#4fd18b"/><stop offset=".55" style="stop-color:#ffb547"/><stop offset="1" style="stop-color:#ff6b8b"/></linearGradient></defs>
    ${grid}
    ${vals.map((v, i) => {
      const cx = L + slot * i + slot / 2, top = y(v);
      return `<rect x="${cx - bw / 2}" y="${T}" width="${bw}" height="${H - T - B}" rx="${bw / 2}" fill="var(--hair)"/>
        ${v ? `<rect x="${cx - bw / 2}" y="${top}" width="${bw}" height="${Math.max(bw, y(0) - top)}" rx="${bw / 2}" fill="url(#bg${n})"/><text class="val" x="${cx}" y="${top - 6}" text-anchor="middle">${v}</text>` : ""}
        <text x="${cx}" y="${H - 6}" text-anchor="middle">${labels[i]}</text>`;
    }).join("")}
  </svg>`;
}
function spark(vals) {
  const n = ++uid, W = 200, H = 54, max = Math.max(1, ...vals);
  const pts = vals.map((v, i) => [+(i * W / (vals.length - 1)).toFixed(1), +(H - 4 - (H - 10) * v / max).toFixed(1)]);
  const d = smoothPath(pts);
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
    <defs><linearGradient id="sp${n}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--green);stop-opacity:.35"/><stop offset="1" style="stop-color:var(--green);stop-opacity:0"/></linearGradient></defs>
    <path d="${d} L${W},${H} L0,${H} Z" fill="url(#sp${n})"/><path d="${d}" fill="none" stroke="var(--green)" stroke-width="2.5" vector-effect="non-scaling-stroke"/></svg>`;
}
const weekDays = () => { const s = weekStart(dayNum()); return WD.map((l, i) => ({ l, n: s + i, k: keyOf(s + i) })); };
const last7 = () => Array.from({ length: 7 }, (_, i) => { const d = dayNum() - 6 + i; return { k: keyOf(d), l: WD[(new Date(d * DAY).getUTCDay() + 6) % 7] }; });

/* ---------- Speech ---------- */
let voices = [];
function loadVoices() { try { voices = speechSynthesis.getVoices(); } catch (e) {} }
try { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; } catch (e) {}
function speak(text, btn, rate) {
  const clean = text.replace(/…/g, "").trim();
  try {
    if (!("speechSynthesis" in window)) { toast("Bu brauzerda ovoz yoʻq"); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = "tr-TR"; u.rate = rate || 0.85;
    const v = voices.find(v => (v.lang || "").toLowerCase().startsWith("tr"));
    if (v) u.voice = v;
    if (btn) { btn.classList.add("playing"); u.onend = u.onerror = () => btn.classList.remove("playing"); }
    speechSynthesis.speak(u);
  } catch (e) { toast("Ovozni ijro etib boʻlmadi"); }
}
let toastTimer;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}
function openSheet(html) { $("sheet-body").innerHTML = `<div class="grabber"></div>${html}`; $("sheet").hidden = false; CatLife.scan(); }
function closeSheet(force) { if ($("sheet").dataset.locked && !force) return; $("sheet").hidden = true; }

/* ---------- Shared pieces ---------- */
const app = $("app");
const initial = () => (USERNAME || (USER && USER.email) || "M").trim().charAt(0).toLocaleUpperCase("tr");
const avClass = s => "c" + (1 + [...String(s)].reduce((a, c) => a + c.charCodeAt(0), 0) % 4);
// A user's photo, or the brand cat on a coloured disc for those without one
let MYPHOTO = "";
const AV_CACHE = {};
function avatarHTML(photo, seed, cls = "") {
  return photo
    ? `<span class="avatar ${cls}"><img src="${esc(photo)}" alt=""></span>`
    : `<span class="avatar cat-av ${avClass(seed || "me")} ${cls}">${catSVG({ pose: "head", lite: true })}</span>`;
}
const photoKey = () => "ty-photo" + (USER ? ":" + USER.uid : "");
function loadMyPhoto() { try { MYPHOTO = localStorage.getItem(photoKey()) || ""; } catch (e) { MYPHOTO = ""; } }
async function setMyPhoto(data) {
  MYPHOTO = data;
  try { if (data) localStorage.setItem(photoKey(), data); else localStorage.removeItem(photoKey()); } catch (e) {}
  if (db && USER) {
    const ref = db.collection("avatars").doc(USER.uid);
    try { if (data) await ref.set({ photo: data }); else await ref.delete(); AV_CACHE[USER.uid] = data; }
    catch (e) { toast(e && e.code === "permission-denied" ? "Rasm faqat shu qurilmada saqlandi: Firestore qoidalarini yangilang" : "Rasm serverga yuklanmadi, internetni tekshiring"); }
  }
}
// Square-crop and shrink a picked photo to a small JPEG data URL
function processPhoto(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const s = Math.min(img.naturalWidth, img.naturalHeight), c = document.createElement("canvas");
      c.width = c.height = 256;
      c.getContext("2d").drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, 256, 256);
      URL.revokeObjectURL(url);
      let q = 0.85, out = c.toDataURL("image/jpeg", q);
      while (out.length > 100000 && q > 0.4) { q -= 0.15; out = c.toDataURL("image/jpeg", q); }
      resolve(out);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("bad image")); };
    img.src = url;
  });
}
function topbar() {
  return `<header class="top">
    <div class="brand">${logo}<span>Türkçe Yoʻl</span></div>
    <div class="top-actions">
      <a class="icon-btn" href="#translate" aria-label="Aqlli tarjimon">${ICON.translate}</a>
      <button class="icon-btn" data-act="go" data-to="lessons" data-focus="search" aria-label="Soʻz qidirish">${ICON.search}</button>
      <a href="#profile" aria-label="Profil" style="border-radius:50%">${avatarHTML(MYPHOTO, USER ? USER.uid : "me")}</a>
    </div>
  </header>`;
}
// Parts of the day: 05–11 morning, 11–17 day, 17–22 evening, 22–05 night
function dayPart(h = new Date().getHours()) {
  return h >= 5 && h < 11 ? { tr: "Günaydın", uz: "Xayrli tong", k: "tong" }
    : h >= 11 && h < 17 ? { tr: "İyi günler", uz: "Xayrli kun", k: "kun" }
    : h >= 17 && h < 22 ? { tr: "İyi akşamlar", uz: "Xayrli kech", k: "kech" }
    : { tr: "İyi geceler", uz: "Xayrli tun", k: "tun" };
}
const firstName = () => (USERNAME || "").trim().split(/\s+/)[0];
const isBirthday = () => PROFILE.birth && PROFILE.birth.slice(5) === todayKey().slice(5);
function greetText() {
  const n = firstName();
  if (isBirthday()) return { tr: `Doğum günün kutlu olsun${n ? ", " + n : ""}!`, uz: "Tugʻilgan kuningiz muborak! Pamuk sizni tabriklaydi." };
  const g = dayPart();
  return { tr: `${g.tr}${n ? ", " + n : ""}!`, uz: g.uz };
}
function greeting() {
  const g = greetText();
  return `<div class="greet"><small>${esc(g.uz)}</small><h1 lang="tr">${esc(g.tr)}</h1></div>`;
}
// Repaint the greeting when the part of the day changes while the app is open
let lastPart = dayPart().k;
setInterval(() => { const k = dayPart().k; if (k !== lastPart) { lastPart = k; if ((location.hash || "#home") === "#home" && !SES) route(); } }, 60000);
function showWelcome() {
  try { if (sessionStorage.getItem("ty-welcomed")) return; sessionStorage.setItem("ty-welcomed", "1"); } catch (e) {}
  const g = greetText();
  $("welcome-card").innerHTML = `${mascot(isBirthday() ? "trophy" : "wave")}<h2 lang="tr">${esc(g.tr)}</h2><p>${esc(g.uz)}</p>`;
  const w = $("welcome");
  w.hidden = false; w.classList.remove("out");
  CatLife.scan();
  clearTimeout(w._t); w._t = setTimeout(hideWelcome, 2400);
}
function hideWelcome() { const w = $("welcome"); if (w.hidden) return; w.classList.add("out"); setTimeout(() => { w.hidden = true; maybeOnboard(); }, 340); }
function unitRow(u, ui) {
  const c = catOf(ui), p = unitProgress(ui);
  return `<button class="unit glass" data-act="go" data-to="lesson-${ui + 1}">
    <span class="art ${c.color}"><span>${pad(ui + 1)}</span></span>
    <span class="unit-body"><span class="unit-title">${esc(u.uz)}</span><span class="unit-sub"><span lang="tr">${esc(u.tr)}</span> · ${u.words.length} ta soʻz</span></span>
    ${pctRing(p)}
  </button>`;
}
function courseCard(ui) {
  const u = UNITS[ui], c = catOf(ui), ws = unitWords(ui), k = ws.filter(w => known(w) >= 2).length;
  return `<button class="course glass" data-act="go" data-to="lesson-${ui + 1}">
    <span class="art ${c.color}"><span>${pad(ui + 1)}</span></span>
    <span><b>${esc(u.uz)}</b><span class="unit-sub" lang="tr">${esc(u.tr)}</span>
      <span class="row"><span class="pill-mini">${k}/${ws.length} soʻz</span><span class="play">${ICON.play}</span></span></span>
  </button>`;
}
function wordRow(w, showUnit) {
  const c = catOf(w.unit);
  return `<div class="word">
    <button class="say" data-act="say" data-t="${esc(w.tr)}" aria-label="${esc(w.tr)} — tinglash">${ICON.speak}</button>
    <div style="min-width:0">
      <div class="word-tr" lang="tr">${esc(w.tr)}</div>
      <div class="word-uz">${esc(w.uz)}</div>
      ${w.note ? `<div class="word-note">${esc(w.note)}</div>` : ""}
      ${showUnit ? `<div style="margin-top:4px"><span class="tag ${c.color}-t">${UNITS[w.unit].course ? esc(UNITS[w.unit].uz) : `${pad(w.unit + 1)} · ${esc(UNITS[w.unit].uz)}`}</span></div>` : ""}
    </div>
    ${wordState(w)}
  </div>`;
}
function modeSheet(u, title) {
  openSheet(`<h3>${esc(title)}</h3>
    <button class="mode glass" data-act="start" data-mode="cards" data-u="${u}"><span class="ico violet-t">${ICON.cards}</span><span><b>Kartochkalar</b><span>Koʻring, agʻdaring, eslang</span></span>${ICON.chev}</button>
    <button class="mode glass" data-act="start" data-mode="quiz" data-u="${u}"><span class="ico sky-t">${ICON.quiz}</span><span><b>Test</b><span>4 ta variantdan toʻgʻrisini tanlang</span></span>${ICON.chev}</button>
    <button class="mode glass" data-act="start" data-mode="type" data-u="${u}"><span class="ico pink-t">${ICON.type}</span><span><b>Yozish</b><span>Turkcha yozing: ç, ş, ğ, ı tugmalari bor</span></span>${ICON.chev}</button>
    <button class="mode glass" data-act="start" data-mode="listen" data-u="${u}"><span class="ico violet-t">${ICON.ear}</span><span><b>Tinglab toping</b><span>Soʻzni eshitib, maʼnosini tanlang</span></span>${ICON.chev}</button>
    <button class="mode glass" data-act="start" data-mode="dict" data-u="${u}"><span class="ico pink-t">${ICON.type}</span><span><b>Diktant</b><span>Eshitganingizni yozing</span></span>${ICON.chev}</button>
    <button class="mode glass" data-act="start" data-mode="say" data-u="${u}"><span class="ico green-t">${ICON.mic}</span><span><b>Talaffuz</b><span>${canListen() ? "Soʻzni ovoz chiqarib ayting, Pamuk tekshiradi" : "Bu brauzerda ishlamaydi: Chrome yoki Safari kerak"}</span></span>${ICON.chev}</button>`);
}

/* ---------- Home ---------- */
function wordOfDay() { return ALL[(dayNum() * 7) % ALL.length]; }
function viewHome() {
  const learned = learnedCount(), today = dayGet(todayKey());
  const minToday = Math.round(today.sec / 60);
  const due = dueWords().length, fresh = Math.min(newLeft(), newWords(NEW_PER_DAY).length), todo = due + fresh;
  const wk = weekDays(), tn = dayNum();
  const l7 = last7(), minArr = l7.map(d => Math.round(dayGet(d.k).sec / 60)), weekMin = minArr.reduce((a, b) => a + b, 0);
  let next = UNITS.findIndex((u, i) => unitProgress(i) < 1); if (next < 0) next = 0;
  const courses = Array.from({ length: 5 }, (_, i) => (next + i) % UNITS.length);
  const w = wordOfDay(), wc = catOf(w.unit);
  const gi = GRAMMAR.findIndex(g => !gramDone(g)), g = GRAMMAR[gi < 0 ? 0 : gi];
  const pXP = Math.min(1, S.dayXp / S.goal), pRev = Math.min(1, today.rev / WORD_GOAL);
  const R1 = 34, R2 = 23, C1 = 2 * Math.PI * R1, C2 = 2 * Math.PI * R2;
  return `${topbar()}
  ${greeting()}
  <div class="tiles">
    <div class="tile glass">
      <span class="tile-label"><span class="dot-ico violet-t">${ICON.book}</span>Oʻrganilgan</span>
      <div class="tile-row"><span class="big-num">${learned}<small>soʻz</small></span>${ring(learned / ALL.length, 34, 4.5, "var(--green)", "mini-ring")}</div>
    </div>
    <div class="tile glass">
      <span class="tile-label"><span class="dot-ico sky-t">${ICON.clock}</span>Bugun</span>
      <div class="tile-row"><span class="big-num">${minToday}<small>daq</small></span>${ring(minToday / 10, 34, 4.5, "var(--sky)", "mini-ring")}</div>
    </div>
  </div>

  <div class="week glass" aria-label="Shu hafta">
    ${wk.map(d => `<div class="day${d.n === tn ? " today" : ""}${dayGet(d.k).xp ? " on" : ""}"><small>${d.l}</small><b>${new Date(d.n * DAY).getUTCDate()}</b><svg class="mark" viewBox="0 0 24 24" fill="currentColor" aria-label="${dayGet(d.k).xp ? "Mashq qilingan" : "Mashq yoʻq"}">${pawPath}</svg></div>`).join("")}
  </div>

  ${todo ? `<section class="hero">
    <span class="chip-float">${ICON.spark.replace("<svg", '<svg style="width:14px;height:14px;vertical-align:-2px;color:var(--accent)"')} Bugungi reja</span>
    <div>${mascot("cap")}</div>
    <h2>Kuniga 10 daqiqa yetarli</h2>
    <div class="hero-stats"><span>${due} takrorlash</span><span>${fresh} yangi soʻz</span><span>~${Math.max(1, Math.round(todo * 0.25))} daqiqa</span></div>
    <button class="btn btn-white" data-act="start" data-mode="review">Boshlash</button>
  </section>` : `<section class="hero warm">
    <span class="chip-float">Bajarildi</span>
    <div>${mascot("trophy")}</div>
    <h2>Bugungi reja bajarildi!</h2>
    <p>Soʻzlar unutilish arafasida qaytadi. Ertaga yana keling.</p>
    <button class="btn btn-white" data-act="go" data-to="practice">Erkin mashq</button>
  </section>`}

  ${plHomeCard()}
  ${skillsHomeCard()}

  ${(() => { const u = kNext(), p = kProgress(u.id); return `<a class="pcard glass" href="#${kHash(u.id)}" style="color:inherit;text-decoration:none">
    <div class="pcard-head"><b>${ICON.cap}Kurs: ${u.level}.${u.n}</b><span class="tag green-t">bepul</span></div>
    <div style="font-size:20px;font-weight:800" lang="tr">${esc(u.title)}</div><p class="muted">${esc(u.sub)}</p>
    <div class="bar"><i style="width:${Math.round(p * 100)}%"></i></div>
    <small class="muted">Kurs: ${kDoneCount()}/${COURSE.units.length} boʻlim · A1 → B2</small></a>`; })()}

  <div class="goals">
    <div class="goal-card glass">
      <h3>Kunlik maqsad</h3>
      <div class="goal-body">
        <svg class="dual-ring" viewBox="0 0 80 80" aria-hidden="true">
          <circle class="ring-bg" cx="40" cy="40" r="${R1}"/><circle class="ring-fg" cx="40" cy="40" r="${R1}" stroke="var(--accent)" stroke-dasharray="${C1}" stroke-dashoffset="${C1 * (1 - pXP)}"/>
          <circle class="ring-bg" cx="40" cy="40" r="${R2}"/><circle class="ring-fg" cx="40" cy="40" r="${R2}" stroke="var(--green)" stroke-dasharray="${C2}" stroke-dashoffset="${C2 * (1 - pRev)}"/>
        </svg>
        <div class="goal-legend">
          <span><i class="violet-t">${ICON.bolt}</i>${S.dayXp}/${S.goal} XP</span>
          <span><i class="green-t">${ICON.cards}</i>${today.rev}/${WORD_GOAL} javob</span>
        </div>
      </div>
    </div>
    <div class="streak-card glass">
      <span class="flame" style="color:var(--orange)">${ICON.flame}</span>
      <div><b>${streakNow()} kun</b><span>Ketma-ket</span></div>
    </div>
  </div>

  <div class="time-card glass">
    <span class="lbl">${ICON.clock}Bu hafta oʻqish vaqti</span>
    <span class="big-num">${weekMin}<small>daq</small></span>
    ${spark(minArr)}
  </div>

  <section class="section">
    <div class="section-head"><h2>Davom ettiring</h2><a class="link" href="#lessons">Hammasi</a></div>
    <div class="carousel">${courses.map(courseCard).join("")}</div>
  </section>

  <section class="section">
    <div class="section-head"><h2>Bugungi soʻz</h2></div>
    <div class="glass pad" style="display:flex;flex-direction:column;gap:8px">
      <div class="tile-row"><span class="tag ${wc.color}-t">${ICON[wc.ico]}${esc(wc.uz)}</span><button class="say" data-act="say" data-t="${esc(w.tr)}" aria-label="Tinglash">${ICON.speak}</button></div>
      <div style="font-size:28px;font-weight:800;letter-spacing:-.02em" lang="tr">${esc(w.tr)}</div>
      <div class="word-uz" style="font-size:16px">${esc(w.uz)}</div>
      ${w.note ? `<div class="word-note">${esc(w.note)}</div>` : ""}
    </div>
  </section>

  ${(() => { const t = tipOfDay(); return `<div class="tip-card glass"><div class="tip-cat">${catSVG({ pose: "head" })}</div><div><small class="eyebrow">Pamuk maslahati</small><b>${esc(t[0])}</b><p class="muted">${esc(t[1])}</p></div></div>`; })()}
  ${installCard()}

  <a class="pcard ai" href="#translate" style="text-decoration:none">
    <div class="pcard-head"><b>${ICON.translate}Aqlli tarjimon</b><span>bepul</span></div>
    <p>Turkcha ⇄ oʻzbekcha tarjima. Pamuk gapdagi grammatikani ham topib beradi.</p>
  </a>

  <section class="section">
    <div class="section-head"><h2>Grammatika</h2><a class="link" href="#grammar">${gramCount()}/${GRAMMAR.length}</a></div>
    <button class="unit glass" data-act="go" data-to="grammar-${GRAMMAR.indexOf(g) + 1}">
      <span class="art violet"><span>G${GRAMMAR.indexOf(g) + 1}</span></span>
      <span class="unit-body"><span class="unit-title">${nb(g.uz)}</span><span class="unit-sub" lang="tr">${esc(g.tr)}</span></span>
      ${ICON.chev}
    </button>
  </section>`;
}

/* ---------- Lessons ---------- */
let CAT = "all", Q = "";
function lessonTabs(active) {
  return `<nav class="seg glass" aria-label="Darslar boʻlimlari">
    <a href="#course" ${active === "course" ? 'aria-current="page"' : ""}>Kurs</a>
    <a href="#lessons" ${active === "lessons" ? 'aria-current="page"' : ""}>Soʻzlar</a>
    <a href="#grammar" ${active === "grammar" ? 'aria-current="page"' : ""}>Grammatika</a>
    <a href="#alphabet" ${active === "alphabet" ? 'aria-current="page"' : ""}>Alifbo</a>
  </nav>`;
}
function searchResults() {
  const q = plain(Q);
  if (!q) return "";
  const hits = ALL.filter(w => plain(w.tr).includes(q) || plain(w.uz).includes(q)).slice(0, 30);
  return hits.length
    ? `<div class="words glass">${hits.map(w => wordRow(w, true)).join("")}</div>`
    : `<div class="glass empty"><b>“${esc(Q)}” topilmadi</b><span class="muted">Boshqacha yozib koʻring: turkcha yoki oʻzbekcha.</span></div>`;
}
function unitsList() {
  const inCat = ui => CAT === "all" || catOf(ui).id === CAT;
  return LEVELS.map(L => {
    const rows = UNITS.slice(L.from, L.to).map((u, i) => L.from + i).filter(inCat);
    if (!rows.length) return "";
    return `<div class="level-head"><b>${L.name}</b><span>${esc(L.uz)}</span></div>
      <div class="list">${rows.map(ui => unitRow(UNITS[ui], ui)).join("")}</div>`;
  }).join("");
}
function viewLessons() {
  return `${topbar()}
  <h1 class="page-title">Darslar</h1>
  ${lessonTabs("lessons")}
  <label class="search glass" for="q">${ICON.search}<span class="sr">Soʻz qidirish</span><input id="q" type="search" placeholder="${ALL.length} ta soʻz ichidan qidiring" value="${esc(Q)}" autocomplete="off" lang="tr"></label>
  <div id="search-results">${searchResults()}</div>
  <div id="units-block" ${Q ? "hidden" : ""}>
    <div class="chips" id="cats" style="margin-bottom:14px">
      <button class="chip" data-act="cat" data-c="all" aria-pressed="${CAT === "all"}">Hammasi</button>
      ${CATS.map(c => `<button class="chip ${CAT === c.id ? "" : c.color + "-t"}" data-act="cat" data-c="${c.id}" aria-pressed="${CAT === c.id}">${ICON[c.ico]}${esc(c.uz)}</button>`).join("")}
    </div>
    <div style="display:flex;flex-direction:column;gap:12px">${unitsList()}</div>
  </div>`;
}
function viewUnit(ui) {
  const u = UNITS[ui], c = catOf(ui), ws = unitWords(ui), k = ws.filter(w => known(w) >= 2).length;
  const acc = accOf([u.id]);
  return `<div><button class="back" data-act="go" data-to="lessons">${ICON.back}Darslar</button></div>
  <div class="lesson-head">
    <div class="tags"><span class="tag ${c.color}-t">${ICON[c.ico]}${esc(c.uz)}</span><span class="tag violet-t">${pad(ui + 1)}-dars</span>${acc !== null ? `<span class="tag green-t">${acc}% toʻgʻri</span>` : ""}</div>
    <h1>${esc(u.uz)}</h1>
    <p class="sub" lang="tr">${esc(u.tr)}</p>
  </div>
  <div class="tip glass">${ICON.bulb}<div><b>${esc(u.tip[0])}</b>${esc(u.tip[1])}</div></div>
  <section class="section">
    <div class="section-head"><h2>Soʻzlar <span class="muted" style="font-weight:700">(${ws.length})</span></h2><span class="tag green-t">${k} oʻrganilgan</span></div>
    <div class="words glass">${ws.map(w => wordRow(w)).join("")}</div>
  </section>
  <div class="sticky-cta"><button class="btn btn-grad btn-block" data-act="modes" data-u="${ui}" data-title="${esc(u.uz)}">${ICON.cards}Mashq qilish</button></div>`;
}

/* ---------- Grammar ---------- */
function gramRow(g, gi) {
  const r = S.gram[g.id] || [], n = g.quiz.filter((q, i) => r[i]).length;
  return `<button class="unit glass" data-act="go" data-to="grammar-${gi + 1}">
    <span class="art ${gramDone(g) ? "green" : "violet"}"><span>G${gi + 1}</span></span>
    <span class="unit-body"><span class="unit-title">${nb(g.uz)}</span><span class="unit-sub" lang="tr">${esc(g.tr)}</span></span>
    ${pctRing(n / g.quiz.length)}
  </button>`;
}
function guideCard() {
  const last = S.guideLast && gxTopic(S.guideLast);
  return `<a class="book-card glass" href="#guide">
    <span class="art pink" style="width:74px;height:74px;border-radius:20px;display:grid;place-items:center;position:relative;overflow:hidden"><span style="font-size:15px;line-height:1.1;text-align:center">A1<br>B2</span></span>
    <span><span class="tag pink-t">${ICON.book}Qoʻllanma · ${GUIDE_ALL.length} mavzu</span>
      <b style="margin-top:6px">Turk tili grammatikasi</b>
      <span class="unit-sub">${last ? `Oxirgi: ${esc(last.code)} ${esc(last.uz)}` : "Formulalar, jadvallar va misollar bilan"}</span></span>
  </a>`;
}
function viewGrammarList() {
  return `${topbar()}
  <h1 class="page-title">Darslar</h1>
  ${lessonTabs("grammar")}
  <div class="tip glass">${ICON.bulb}<div><b>Qaysidan boshlash kerak?</b>Tartib bilan boring: 1-mavzu (unli uygʻunligi) qolgan barcha qoidalarning asosi. Har mavzu oʻzbek tili bilan solishtirilgan.</div></div>
  ${guideCard()}
  <a class="pcard glass" href="#gx" style="color:inherit;text-decoration:none">
    <div class="pcard-head"><b>${ICON.quiz}Qoidalar mashqi · A1–B2</b><span>${gxDoneCount()}/${GX_CODES.length}</span></div>
    <div class="bar"><i style="width:${pct(gxDoneCount(), GX_CODES.length)}%"></i></div>
    <p class="muted">${GX_CODES.length} mavzu, ${GX_CODES.reduce((a, c) => a + BX[c].length, 0)} ta mashq. Keyingisi: ${esc(gxNext())} ${esc((gxTopic(gxNext()) || {}).uz || "")}</p>
  </a>
  <div class="section-head" style="margin-top:4px"><h2>Asosiy mavzular</h2></div>
  <div class="list">${GRAMMAR.map(gramRow).join("")}</div>`;
}
function gqHtml(g, qi) {
  const q = g.quiz[qi];
  return `<div class="gq glass" id="gq-${qi}">
    <div class="gq-q">${qi + 1}. ${esc(q.q)}</div>
    <div class="gq-opts">${shuffle(q.o.map((o, oi) => [o, oi])).map(([o, oi]) => `<button class="opt" lang="tr" data-act="gq" data-q="${qi}" data-o="${oi}">${esc(o)}</button>`).join("")}</div>
    <div class="feedback" aria-live="polite"></div>
  </div>`;
}
function viewGrammar(gi) {
  const g = GRAMMAR[gi], t = g.table, next = GRAMMAR[gi + 1];
  return `<div><button class="back" data-act="go" data-to="grammar">${ICON.back}Grammatika</button></div>
  <div class="lesson-head">
    <div class="tags"><span class="tag violet-t">${ICON.cap}${gi + 1}-mavzu</span>${gramDone(g) ? `<span class="tag green-t">Tugallangan</span>` : ""}</div>
    <h1>${nb(g.uz)}</h1>
    <p class="sub" lang="tr">${esc(g.tr)}</p>
  </div>
  <p class="lead">${esc(g.lead)}</p>
  <ul class="rules">${g.points.map(p => `<li><span>${esc(p)}</span></li>`).join("")}</ul>
  <div class="table-wrap glass"><table class="gtable">
    <thead><tr>${t.head.map(h => `<th scope="col">${esc(h)}</th>`).join("")}</tr></thead>
    <tbody>${t.rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody>
  </table></div>
  <div class="tip glass">${ICON.bulb}<div><b>Oʻzbekcha bilan solishtiring</b>${esc(g.compare)}</div></div>
  <section class="section">
    <div class="section-head"><h2>Misollar</h2></div>
    <div class="words glass">${g.examples.map(e => `<div class="word"><button class="say" data-act="say" data-t="${esc(e[0])}" aria-label="${esc(e[0])} — tinglash">${ICON.speak}</button><div><div class="word-tr" lang="tr">${esc(e[0])}</div><div class="word-uz">${esc(e[1])}</div></div><span></span></div>`).join("")}</div>
  </section>
  <section class="section">
    <div class="section-head"><h2>Oʻzingizni tekshiring</h2><span class="tag violet-t">+5 XP</span></div>
    ${g.quiz.map((q, qi) => gqHtml(g, qi)).join("")}
  </section>
  ${next ? `<button class="btn btn-grad btn-block" data-act="go" data-to="grammar-${gi + 2}">Keyingi: ${nb(next.uz)}</button>`
         : `<button class="btn btn-soft btn-block" data-act="go" data-to="grammar">Barcha mavzular</button>`}`;
}

/* ---------- Grammar guide (written from the A1–B2 handbook, in the site's own design) ---------- */
let GUIDE_LV = "A1", GUIDE_Q = "";
// "gel[iyor][um]" → stem with highlighted suffixes
const sfx = t => esc(t).replace(/\[([^\]]+)\]/g, '<span class="sfx">$1</span>');
const plainSfx = t => t.replace(/[\[\]]/g, "");
function guideRow(i) {
  const st = BX[i.code] ? (gxDone(i.code) ? `<span class="state done" style="width:24px;height:24px" title="Mashq bajarilgan">${ICON.check}</span>` : `<span class="pg">${gxSolved(i.code)}/${BX[i.code].length}</span>`) : ICON.chev;
  return `<a class="toc-row" href="#${gHash(i.code)}"><span class="code">${esc(i.code)}</span>
    <span><b>${esc(i.uz)}</b><small lang="tr">${esc(i.tr)}</small></span>${st}</a>`;
}
function guideHits() {
  const q = plain(GUIDE_Q.trim());
  if (q.length < 2) return "";
  const hits = GUIDE_ALL.filter(i => plain([i.code, i.tr, i.uz, i.rule || "", typeof i.forms === "string" ? i.forms : "", plainSfx(i.ex ? i.ex.join(" ") : "")].join(" ")).includes(q));
  return hits.length ? `<div class="glass words">${hits.map(guideRow).join("")}</div>` : `<div class="glass empty"><b>“${esc(GUIDE_Q)}” topilmadi</b></div>`;
}
function viewGuide() {
  const lv = GUIDE.find(l => l.id === GUIDE_LV) || GUIDE[1];
  return `<div><button class="back" data-act="go" data-to="grammar">${ICON.back}Grammatika</button></div>
  <div class="lesson-head">
    <div class="tags"><span class="tag pink-t">${ICON.book}Qoʻllanma</span><span class="tag green-t">${GX_CODES.filter(gxDone).length}/${GX_CODES.length} mashq bajarilgan</span></div>
    <h1>Turk tili grammatikasi</h1>
    <p class="sub">Har mavzu: formula, shakllar, qoida, misol va mashqlar. Qoʻshimchalar rangli ajratilgan.</p>
  </div>
  <label class="search glass" for="gq">${ICON.search}<span class="sr">Qoʻllanmadan qidirish</span><input id="gq" type="search" placeholder="Qidirish: iyor, kelishik, -lar…" value="${esc(GUIDE_Q)}" autocomplete="off" lang="tr"></label>
  <div id="guide-hits">${guideHits()}</div>
  <div class="chips">${GUIDE.map(l => `<button class="chip" data-act="guide-lv" data-l="${l.id}" aria-pressed="${l.id === lv.id}">${esc(l.name)}</button>`).join("")}</div>
  <div class="level-head"><b>${esc(lv.name)}</b><span>${esc(lv.uz)}${gxCount(lv.id) ? ` · ${gxDoneCount(lv.id)}/${gxCount(lv.id)} mashq` : ""}</span></div>
  ${lv.groups.map(g => `<div class="glass words"><div class="toc-group">${esc(g.name)}</div>${g.items.map(guideRow).join("")}</div>`).join("")}`;
}
function guideTable(t) {
  return `<div class="table-wrap glass"><table class="gtable g-forms">
    <thead><tr>${t.h.map(h => `<th scope="col">${esc(h)}</th>`).join("")}</tr></thead>
    <tbody>${t.r.map(r => `<tr>${r.map(c => `<td lang="tr">${sfx(c)}</td>`).join("")}</tr>`).join("")}</tbody>
  </table></div>`;
}
function viewGuideTopic(i) {
  S.guideLast = i.code; save();
  const idx = GUIDE_ALL.indexOf(i), prev = GUIDE_ALL[idx - 1], next = GUIDE_ALL[idx + 1];
  const line = (label, pair, cls) => pair ? `<div class="g-line"><span class="tag ${cls}">${label}</span><div><div class="g-tr" lang="tr">${sfx(pair[0])}</div><div class="word-uz">${esc(pair[1])}</div></div></div>` : "";
  return `<div><button class="back" data-act="go" data-to="guide">${ICON.back}Qoʻllanma</button></div>
  <div class="lesson-head">
    <div class="tags"><span class="tag sky-t">${esc(i.code)}</span><span class="tag violet-t">${esc(i.group)}</span>${BX[i.code] && gxDone(i.code) ? `<span class="tag green-t">${ICON.check}Mashq bajarilgan</span>` : ""}</div>
    <h1>${nb(i.uz)}</h1>
    <p class="sub" lang="tr">${esc(i.tr)}</p>
  </div>
  ${i.f ? `<div class="g-formula"><div class="g-f-tr" lang="tr">${esc(i.f[0])}</div><div class="g-f-uz">${esc(i.f[1])}</div></div>` : ""}
  ${i.forms ? `<section class="section"><div class="section-head"><h2>Shakllar</h2></div>${typeof i.forms === "string" ? `<div class="glass pad g-forms-text" lang="tr">${sfx(i.forms)}</div>` : guideTable(i.forms)}</section>` : ""}
  <div class="tip glass">${ICON.bulb}<div><b>Qoida</b>${esc(i.rule)}${i.note ? `<div style="margin-top:6px">${esc(i.note)}</div>` : ""}</div></div>
  <section class="section"><div class="section-head"><h2>Misol</h2></div>
    <div class="glass g-ex"><div style="min-width:0"><div class="g-tr big" lang="tr">${sfx(i.ex[0])}</div><div class="word-uz">${esc(i.ex[1])}</div></div>
      <button class="say" data-act="say" data-t="${esc(plainSfx(i.ex[0]))}" aria-label="Tinglash">${ICON.speak}</button></div>
    ${i.neg || i.q ? `<div class="glass words">${line("Boʻlishsiz", i.neg, "pink-t")}${line("Soʻroq", i.q, "sky-t")}</div>` : ""}
  </section>
  ${BX[i.code] ? `<section class="section"><div class="section-head"><h2>Mashq</h2><span class="tag sky-t">+10 XP</span></div><div class="list">${gxRow(i.code)}</div></section>` : ""}
  <div class="pager" style="grid-template-columns:1fr 1fr">
    ${prev ? `<a class="btn btn-ghost" href="#${gHash(prev.code)}">${ICON.back}${esc(prev.code)}</a>` : "<span></span>"}
    ${next ? `<a class="btn btn-grad" href="#${gHash(next.code)}">${esc(next.code)}${ICON.chev.replace('class="chev"', 'style="width:20px;height:20px"')}</a>` : "<span></span>"}
  </div>`;
}
function gxRow(c) {
  const tp = gxTopic(c), n = BX[c].length, k = gxSolved(c);
  return `<button class="unit glass" data-act="gx-start" data-c="${c}">
    <span class="art ${gxDone(c) ? "green" : "sky"}"><span style="font-size:13px">${c}</span></span>
    <span class="unit-body"><span class="unit-title">${esc(tp ? tp.uz : c)}</span><span class="unit-sub"><span lang="tr">${esc(tp ? tp.tr : "")}</span> · ${n} ta mashq</span></span>
    ${pctRing(k / n)}
  </button>`;
}
let GX_LV = "";
function viewGx() {
  const ms = gxMistakes();
  const lvs = GUIDE.filter(l => gxCount(l.id));
  const lv = (lvs.find(l => l.id === GX_LV) || lvs.find(l => gxDoneCount(l.id) < gxCount(l.id)) || lvs[0]).id;
  return `<div><button class="back" data-act="go" data-to="grammar">${ICON.back}Grammatika</button></div>
  <div class="lesson-head">
    <div class="tags"><span class="tag sky-t">${ICON.quiz}A1–B2 · ${GX_CODES.length} mavzu</span><span class="tag green-t">${gxDoneCount()} tugallangan</span></div>
    <h1>Qoidalar mashqi</h1>
    <p class="sub">Har mavzu qoʻllanmadagi qoida asosida: variant tanlash, toʻldirib yozish va gap tuzish.</p>
  </div>
  ${ms.length ? `<button class="pcard glass" data-act="start" data-mode="gxm"><div class="pcard-head"><b>${ICON.target}Qoida xatolari</b><span class="badge">${ms.length}</span></div><p class="muted">Xato qilgan mashqlaringizni qayta ishlang.</p></button>` : ""}
  <div class="chips">${lvs.map(l => `<button class="chip" data-act="gx-lv" data-l="${l.id}" aria-pressed="${l.id === lv}" style="gap:5px;padding:9px 12px">${esc(l.name)}<small style="font-weight:600;opacity:.7">${gxDoneCount(l.id)}/${gxCount(l.id)}</small></button>`).join("")}</div>
  ${LEVEL_GROUPS(lv).map(g => `<div class="toc-group" style="padding-left:2px">${esc(g.name)}</div><div class="list">${g.codes.map(gxRow).join("")}</div>`).join("")}`;
}
function LEVEL_GROUPS(lv) {
  const out = [];
  GUIDE_ALL.forEach(i => { if (!BX[i.code] || (lv && i.level !== lv)) return; let g = out[out.length - 1]; if (!g || g.name !== i.group) out.push(g = { name: i.group, codes: [] }); g.codes.push(i.code); });
  return out;
}
/* ---------- Alphabet ---------- */
let letterSel = 2;
function viewAlphabet() {
  const L = LETTERS[letterSel];
  return `${topbar()}
  <h1 class="page-title">Darslar</h1>
  ${lessonTabs("alphabet")}
  <p class="sub">Turk alifbosida 29 harf bor, Q, X va W yoʻq. Harfni bosing va misolni tinglang.</p>
  <div class="letter-detail glass">
    <span class="big" lang="tr">${esc(L[0])}</span>
    <div><div style="font-weight:800;font-size:18px" lang="tr">${esc(L[1])}</div><div class="muted" style="font-weight:600">${esc(L[2])}</div><div style="font-size:14px;margin-top:2px;color:var(--ink-2)">${esc(L[3])}</div></div>
    <button class="say" data-act="say" data-t="${esc(L[1])}" aria-label="${esc(L[1])} — tinglash">${ICON.speak}</button>
  </div>
  <div class="legend"><i></i>Oʻzbek lotin yozuvidan farq qiladigan harflar</div>
  <div class="letters">${LETTERS.map((l, i) => `<button class="letter glass${l[4] ? " diff" : ""}" data-act="letter" data-i="${i}" aria-pressed="${i === letterSel}">
    <span class="big" lang="tr">${esc(l[0])}</span><span class="ex" lang="tr">${esc(l[1])}</span><span class="hint">${esc(l[4] ? l[3] : l[2])}</span></button>`).join("")}</div>`;
}

/* ---------- Practice ---------- */
const mins = n => Math.max(1, Math.round(n * 0.25));
function viewPractice() {
  const due = dueWords(), fresh = newWords(Math.min(newLeft(), NEW_PER_DAY)), items = due.slice(0, 20).concat(fresh);
  const cats = [...new Set(items.map(w => catOf(w.unit).id))].map(id => CATS.find(c => c.id === id));
  const ms = mistakeWords();
  const acc = S.acc[1] ? pct(S.acc[0], S.acc[1]) : null;
  return `${topbar()}
  <div><h1 class="page-title">Mashq</h1><p class="sub">Toʻgʻri javob uchun 10 XP</p></div>

  <button class="pcard ai" data-act="start" data-mode="review" ${items.length ? "" : "disabled"}>
    <div class="pcard-head"><b>${ICON.spark}Aqlli takrorlash</b><span>~${mins(items.length)} daq</span></div>
    <p>${items.length ? "Unutilish arafasidagi soʻzlar va bugungi yangi soʻzlar. Nimani qachon takrorlashni tizim oʻzi tanlaydi." : "Bugungi reja bajarildi. Ertaga yangi soʻzlar va takrorlashlar keladi."}</p>
    ${cats.length ? `<div class="tags">${cats.slice(0, 2).map(c => `<span class="tag">${ICON[c.ico]}${esc(c.uz)}</span>`).join("")}${cats.length > 2 ? `<span class="tag">+${cats.length - 2}</span>` : ""}</div>` : ""}
    <div class="facts">
      <span>${ICON.list}${due.length} ta takrorlash · ${fresh.length} ta yangi soʻz</span>
      <span>${ICON.clock}Taxminan ${mins(items.length)} daqiqa</span>
      <span>${ICON.quiz}${acc === null ? "Hali javoblar yoʻq" : `Toʻgʻri javoblar: ${acc}%`}</span>
    </div>
  </button>

  <div class="pcard glass">
    <div class="pcard-head"><b>${ICON.target}Xatolar daftari</b>${ms.length ? `<span class="badge">${ms.length}</span>` : ""}</div>
    ${ms.length ? `<div class="tags">${ms.slice(0, 3).map(w => `<span class="tag pink-t" lang="tr">${esc(w.tr)}</span>`).join("")}${ms.length > 3 ? `<span class="tag pink-t">+${ms.length - 3}</span>` : ""}</div>
      <div class="facts"><span>${ICON.list}${ms.length} ta soʻz</span><span>${ICON.clock}Taxminan ${mins(Math.min(15, ms.length))} daqiqa</span><span>${ICON.quiz}Ketma-ket 2 marta toʻgʻri topsangiz, daftardan chiqadi</span></div>
      <button class="plus" data-act="start" data-mode="mistakes" aria-label="Xatolar ustida ishlash">${ICON.play}</button>`
    : `<p class="muted">Xato qilgan soʻzlaringiz shu yerga tushadi va alohida mashq qilinadi.</p>`}
  </div>

  ${lsmCard()}

  <div class="pcard glass">
    <div class="pcard-head"><b>${ICON.cap}Qoidalar mashqi</b><span>${gxDoneCount()}/${GX_CODES.length}</span></div>
    <div class="tags"><span class="tag sky-t">${esc(gxNext())}</span><span class="tag violet-t">${esc((gxTopic(gxNext()) || {}).uz || "")}</span>${gxMistakes().length ? `<span class="tag pink-t">${gxMistakes().length} ta xato</span>` : ""}</div>
    <div class="facts"><span>${ICON.list}Variant tanlash, yozish va gap tuzish</span><span>${ICON.book}Qoʻllanmadagi qoida asosida</span></div>
    <button class="plus" data-act="gx-start" data-c="${gxNext()}" aria-label="Keyingi qoida mashqi">${ICON.play}</button>
  </div>

  <div class="pcard glass">
    <div class="pcard-head"><b>${ICON.type}Yozish mashqi</b>${S.sk.w[1] ? `<span>${pct(S.sk.w[0], S.sk.w[1])}%</span>` : ""}</div>
    <div class="facts"><span>${ICON.list}Soʻz yozish · Diktant · Erkin yozish</span><span>${ICON.target}Erkin yozish avtomatik tekshiriladi: hajm, grammatika, imlo</span></div>
    <button class="plus" data-act="write-modes" aria-label="Yozish mashqlari">${ICON.play}</button>
  </div>

  <div class="pcard glass">
    <div class="pcard-head"><b>${ICON.ear}Tinglash mashqi</b>${S.sk.l[1] ? `<span>${pct(S.sk.l[0], S.sk.l[1])}%</span>` : ""}</div>
    <div class="facts"><span>${ICON.list}Tinglab toping · Diktant · Gaplarni tinglash</span><span>${ICON.target}Matn koʻrinmaydi, faqat ovoz</span><span>${ICON.quiz}${S.sk.l[1] ? `${S.sk.l[0]} ta toʻgʻri javob` : "Quloqni turkchaga oʻrgating"}</span></div>
    <button class="plus" data-act="listen-modes" aria-label="Tinglash mashqlari">${ICON.play}</button>
  </div>

  <div class="pcard glass">
    <div class="pcard-head"><b>${ICON.mic}Gapirish mashqi</b>${S.pron[1] ? `<span>${pct(S.pron[0], S.pron[1])}%</span>` : ""}</div>
    <div class="facts"><span>${ICON.list}Talaffuz · Gaplarni takrorlash · Ogʻzaki javob · Rolli dialog</span><span>${ICON.target}Notoʻgʻri aytilgan harflar qizil boʻladi</span><span>${ICON.quiz}${S.pron[1] ? `${S.pron[0]} ta soʻz toʻgʻri aytildi` : "Mikrofon kerak · ovoz saqlanmaydi"}</span></div>
    ${canListen() ? "" : `<p class="muted" style="margin-top:6px">Brauzeringiz nutqni tanishni qoʻllamaydi. Saytni Chrome (Android, kompyuter) yoki Safari (iPhone) da oching.</p>`}
    <button class="plus" data-act="speak-modes" aria-label="Gapirish mashqlari" ${canListen() ? "" : "disabled"}>${ICON.play}</button>
  </div>

  <section class="section">
    <div class="section-head"><h2>Mavzular boʻyicha</h2></div>
    ${CATS.map(c => {
      const ws = ALL.filter(w => c.ids.includes(UNITS[w.unit].id)), k = ws.filter(w => known(w) >= 2).length, a = accOf(c.ids);
      return `<div class="pcard glass">
        <div class="pcard-head"><b><span class="tag ${c.color}-t" style="padding:6px">${ICON[c.ico]}</span>${esc(c.uz)}</b><span>~3 daq</span></div>
        <div class="tags"><span class="tag ${c.color}-t">${c.ids.length} dars</span><span class="tag violet-t">${k}/${ws.length} oʻrganilgan</span></div>
        <div class="facts"><span>${ICON.list}${ws.length} ta soʻz</span><span>${ICON.quiz}${a === null ? "Hali mashq qilinmagan" : `Toʻgʻri javoblar: ${a}%`}</span></div>
        <button class="plus" data-act="modes" data-u="cat:${c.id}" data-title="${esc(c.uz)}" aria-label="${esc(c.uz)} — mashq">${ICON.plus}</button>
      </div>`;
    }).join("")}
    <button class="btn btn-ghost btn-block" data-act="modes" data-u="all" data-title="Barcha soʻzlar">${ICON.globe}Barcha soʻzlardan erkin mashq</button>
  </section>`;
}

/* ---------- Leaderboard ---------- */
let RANK_TAB = "week", RANK_CACHE = {};
function viewRank() {
  return `${topbar()}
  <div><h1 class="page-title">Reyting</h1><p class="sub">Har dushanba haftalik reyting yangilanadi</p></div>
  <div class="seg glass" role="tablist">
    <button role="tab" data-act="rank-tab" data-t="week" aria-selected="${RANK_TAB === "week"}">Bu hafta</button>
    <button role="tab" data-act="rank-tab" data-t="all" aria-selected="${RANK_TAB === "all"}">Umumiy</button>
  </div>
  <div id="rank-body"><div class="glass empty"><div class="spin"></div>Yuklanmoqda…</div></div>`;
}
// Fetch leaderboard photos once per session and drop them into the rendered rows
function loadRankPhotos(ids) {
  ids.filter(id => !(id in AV_CACHE) && id !== USER.uid).forEach(id => {
    AV_CACHE[id] = "";
    db.collection("avatars").doc(id).get().then(d => {
      const ph = d.exists && d.data().photo;
      if (!ph) return;
      AV_CACHE[id] = ph;
      document.querySelectorAll(`[data-av="${CSS.escape(id)}"]`).forEach(el => { el.innerHTML = avatarHTML(ph, id); });
    }).catch(() => {});
  });
}
async function loadRank() {
  const box = $("rank-body");
  if (!box) return;
  if (!FB || !USER) {
    box.innerHTML = `<div class="glass empty">${mascot("trophy")}<b>Reyting hisob bilan ishlaydi</b><span class="muted">Hisobga kirsangiz, boshqa oʻquvchilar bilan bellasha olasiz.</span></div>`;
    return;
  }
  const tab = RANK_TAB, cached = RANK_CACHE[tab];
  let rows;
  if (cached && Date.now() - cached.t < 60000) rows = cached.rows;
  else {
    try {
      const ref = db.collection("league");
      const snap = tab === "week" ? await ref.where("week", "==", weekKey()).limit(200).get() : await ref.orderBy("xp", "desc").limit(100).get();
      rows = snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
      RANK_CACHE[tab] = { t: Date.now(), rows };
    } catch (e) {
      if ($("rank-body")) $("rank-body").innerHTML = `<div class="glass empty">${mascot("trophy")}<b>Reytingni yuklab boʻlmadi</b><span class="muted">${e && e.code === "permission-denied" ? "Reyting hali sozlanmagan (Firestore qoidalari)." : "Internet aloqasini tekshiring."}</span></div>`;
      return;
    }
  }
  if (tab !== RANK_TAB || !$("rank-body")) return;
  const key = tab === "week" ? "wxp" : "xp";
  rows = rows.filter(r => r[key] > 0).sort((a, b) => b[key] - a[key]);
  if (!rows.length) {
    $("rank-body").innerHTML = `<div class="glass empty">${mascot("trophy")}<b>Hali hech kim yoʻq</b><span class="muted">Pamuk birinchi boʻlishingizni kutyapti: mashq qilib XP toʻplang.</span></div>`;
    return;
  }
  const me = rows.findIndex(r => r.id === USER.uid);
  const pod = i => { const r = rows[i]; if (!r) return "<div></div>"; return `<div class="pod${i === 0 ? " first" : ""}">
      ${i === 0 ? `<svg class="crown" viewBox="0 0 24 18" fill="#ffc83d" aria-hidden="true"><path d="M2 5l5 4 5-8 5 8 5-4-2 12H4z"/></svg>` : `<span class="place">${i + 1}</span>`}
      <span data-av="${esc(r.id)}">${avatarHTML(r.id === USER.uid ? MYPHOTO : AV_CACHE[r.id], r.id)}</span>
      <b>${esc(r.name || "Oʻquvchi")}</b><span>${r[key]} XP</span></div>`; };
  $("rank-body").innerHTML = `<div class="glass podium">${pod(1)}${pod(0)}${pod(2)}</div>
    ${rows.length > 3 ? `<div class="glass words" style="margin-top:12px">${rows.slice(3, 50).map((r, i) => `<div class="rank-row${r.id === USER.uid ? " me" : ""}">
      <span class="n">${i + 4}</span><span data-av="${esc(r.id)}">${avatarHTML(r.id === USER.uid ? MYPHOTO : AV_CACHE[r.id], r.id)}</span>
      <span style="min-width:0"><b>${esc(r.name || "Oʻquvchi")}</b><small>${r.streak || 0} kun ketma-ket</small></span><span class="xp">${r[key]} XP</span></div>`).join("")}</div>` : ""}
    <p class="sub" style="text-align:center;margin-top:12px">${me >= 0 ? `Siz ${me + 1}-oʻrindasiz · eng yaxshi ${Math.max(1, Math.round((me + 1) / rows.length * 100))}%` : S.pub ? "Mashq qilib XP toʻplang, shunda reytingda paydo boʻlasiz." : "Siz reytingda koʻrinmaysiz. Buni Profil → Sozlamalarda yoqish mumkin."}</p>`;
  loadRankPhotos(rows.slice(0, 50).map(r => r.id));
}

/* ---------- Profile & statistics ---------- */
function viewProfile() {
  const l7 = last7(), xpv = l7.map(d => dayGet(d.k).xp), minv = l7.map(d => Math.round(dayGet(d.k).sec / 60));
  const isPass = USER && USER.providerData.some(p => p.providerId === "password");
  const range = `${keyOf(dayNum() - 6).slice(5).split("-").reverse().join(".")} – ${todayKey().slice(5).split("-").reverse().join(".")}`;
  const th = (() => { try { return localStorage.getItem("ty-theme") || "auto"; } catch (e) { return "auto"; } })();
  return `<div class="top"><h1 class="page-title">Profil</h1>${logo}</div>
  <div class="profile-card glass">
    <button class="avatar-edit" data-act="photo" aria-label="Profil rasmini oʻzgartirish">${avatarHTML(MYPHOTO, USER ? USER.uid : "me", "lg")}<span class="cam">${ICON.camera}</span>${genderSticker()}</button>
    <input type="file" id="photo-input" accept="image/*" hidden>
    <div style="min-width:0"><b>${esc(USERNAME || (USER ? "Oʻquvchi" : "Mehmon"))}</b><span>${esc(USER ? USER.email || "" : "Hisobsiz rejim")}</span>
      ${PROFILE.birth ? `<span style="display:block">${esc(birthText(PROFILE.birth))}</span>` : ""}
      <div class="tags" style="margin-top:6px">${USER && USER.emailVerified ? `<span class="tag green-t">${ICON.check}Tasdiqlangan</span>` : ""}${MYPHOTO ? `<button class="tag pink-t" data-act="photo-remove">Rasmni olib tashlash</button>` : `<button class="tag violet-t" data-act="photo">Rasm qoʻyish</button>`}</div></div>
  </div>
  ${isPass && !USER.emailVerified ? `<div class="notice"><div><b>Pochtangizni tasdiqlang.</b> ${esc(USER.email)} manziliga xat yubordik.</div><button class="btn btn-ghost" data-act="verify-again">Xatni qayta yuborish</button></div>` : ""}

  <section class="section">
    <div class="section-head"><h2>Statistika</h2></div>
    <div class="stat-grid">
      <div class="stat glass"><span class="ico orange-t">${ICON.flame}</span><span><b>${streakNow()}</b><span>Ketma-ket kun · eng yaxshi ${S.best}</span></span></div>
      <div class="stat glass"><span class="ico violet-t">${ICON.star}</span><span><b>${S.xp}</b><span>Jami XP</span></span></div>
      <div class="stat glass"><span class="ico sky-t">${ICON.book}</span><span><b>${learnedCount()}</b><span>Oʻrganilgan soʻz</span></span></div>
      <div class="stat glass"><span class="ico green-t">${ICON.quiz}</span><span><b>${S.acc[1] ? pct(S.acc[0], S.acc[1]) + "%" : "—"}</b><span>Toʻgʻri javoblar</span></span></div>
    </div>
  </section>

  ${skillsProfileCard()}
  <div class="chart-card glass"><h3>Haftalik faollik (XP)</h3><span class="range">${range}</span>${lineChart(xpv, l7.map(d => d.l))}</div>
  <div class="chart-card glass"><h3>Oʻqish vaqti (daqiqa)</h3><span class="range">${range}</span>${barChart(minv, l7.map(d => d.l))}</div>

  <section class="section">
    <div class="section-head"><h2>Yutuqlar</h2><a class="link" href="#achievements">${ACH.filter(achDone).length}/${ACH.length} · Hammasi</a></div>
    <div class="achv">${ACH.slice().sort((x, y) => (achDone(y) - achDone(x)) || (y.v() / y.n - x.v() / x.n)).slice(0, 6).map(achCard).join("")}</div>
  </section>

  <section class="section">
    <div class="section-head"><h2>Sozlamalar</h2></div>
    <div class="settings glass">
      ${USER ? `<button class="set-row" data-act="profile-edit"><span><b>Shaxsiy maʼlumotlar</b><small>${PROFILE.gender ? (PROFILE.gender === "f" ? "Ayol" : "Erkak") : "Jins koʻrsatilmagan"} · ${PROFILE.birth ? esc(birthText(PROFILE.birth)) : "tugʻilgan sana yoʻq"}</small></span>${ICON.chev}</button>` : ""}
      <div class="set-row"><span><b>Mavzu</b><small>Yorugʻ yoki qorongʻi koʻrinish</small></span>
        <span class="mini-seg">${[["auto", "Avto"], ["light", "Yorugʻ"], ["dark", "Tun"]].map(([v, l]) => `<button data-act="theme" data-v="${v}" aria-pressed="${th === v}">${l}</button>`).join("")}</span></div>
      <div class="set-row"><span><b>Kunlik maqsad</b><small>Har kuni toʻplanadigan XP</small></span>
        <span class="mini-seg">${[30, 50, 100].map(v => `<button data-act="goal" data-v="${v}" aria-pressed="${S.goal === v}">${v}</button>`).join("")}</span></div>
      ${USER ? `<button class="set-row" data-act="pub" role="switch" aria-checked="${S.pub}"><span><b>Reytingda koʻrinish</b><small>Ismingiz va XP boshqa oʻquvchilarga koʻrinadi</small></span><span class="switch" aria-checked="${S.pub}"></span></button>
      <button class="set-row" data-act="anon" role="switch" aria-checked="${S.anon !== false}"><span><b>Anonim statistika</b><small>Ism va pochtasiz koʻnikma koʻrsatkichlari saytni yaxshilash uchun yuboriladi</small></span><span class="switch" aria-checked="${S.anon !== false}"></span></button>
      ${ADMIN ? `<a class="set-row" href="#admin" style="color:inherit;text-decoration:none"><span><b>Umumiy analitika</b><small>Faqat admin: barcha foydalanuvchilar boʻyicha</small></span>${ICON.chev}</a>` : ""}` : ""}
      <a class="set-row" href="#help" style="color:inherit;text-decoration:none"><span><b>Yordam va qoʻllanma</b><small>Ilovani oʻrnatish, saytdan foydalanish, savollar</small></span>${ICON.chev}</a>
      <button class="set-row" data-act="share"><span><b>Doʻstlarni taklif qilish</b><small>Turk tilini birga, bepul oʻrganing</small></span>${ICON.heart}</button>
      <a class="set-row" href="privacy.html" style="color:inherit;text-decoration:none"><span><b>Maxfiylik siyosati</b></span>${ICON.chev}</a>
    </div>
  </section>
  ${USER ? `<button class="btn btn-ghost btn-block" data-act="logout">Hisobdan chiqish</button>
  <div id="del-box" style="display:flex;flex-direction:column;gap:10px"><button class="link" data-act="delete-ask" style="align-self:center;color:var(--pink)">Hisobni oʻchirish</button></div>` : ""}`;
}

/* ---------- Smart translator ----------
   Machine translation comes from MyMemory's free public API (no key, about 5000 characters a day per user).
   On top of it the page adds our own dictionary hits and points to the grammar topics found in the Turkish text. */
let TR_DIR = "tr", TR_TEXT = "", TR_OUT = null, TR_BUSY = false;
const TR_HINTS = [
  { re: /\S+(saydı|seydi|saydım|seydim|saydın|seydin)/i, code: "B2.07", what: "xayoliy shart (-saydı)" },
  { re: /\S+(mış|miş|muş|müş)(tı|ti|tu|tü)/i, code: "B2.03", what: "uzoq oʻtgan zamon (-mıştı)" },
  { re: /\S+(acak|ecek)(tı|ti)/i, code: "B2.04", what: "amalga oshmagan niyat (-acaktı)" },
  { re: /(?:^|[\s(])\S+(makta|mekte)(dır|dir)?(?=$|[\s.,!?;:])/i, code: "B2.19", what: "rasmiy hozirgi zamon (-makta)" },
  { re: /(?:^|[\s(])rağmen/i, code: "B2.11", what: "zidlik: rağmen" },
  { re: /(?:^|[\s(])(hâlde|halde)(?=$|[\s.,!?;:])/i, code: "B2.12", what: "zidlik: -dığı hâlde" },
  { re: /(?:^|[\s(])(oysa|hâlbuki|halbuki)(?=$|[\s.,!?;:])/i, code: "B2.14", what: "oysa / hâlbuki" },
  { re: /(?:^|[\s(])keşke(?=$|[\s.,!?;:])/i, code: "B1.15", what: "istak: keşke" },
  { re: /(?:^|[\s(])(yüzünden|sayesinde|nedeniyle)(?=$|[\s.,!?;:])/i, code: "B1.10", what: "sabab: yüzünden / sayesinde" },
  { re: /(?:^|[\s(])tarafından(?=$|[\s.,!?;:])/i, code: "B1.16", what: "majhul nisbat: tarafından" },
  { re: /\S+(dığı|diği|duğu|düğü|tığı|tiği|tuğu|tüğü|dığım|diğim|duğum|düğüm|tığım|tiğim|tuğum|tüğüm)/i, code: "B1.02", what: "sifatdosh (-dığı)" },
  { re: /(?:^|[\s(])\S+(ınca|ince|unca|ünce)(?=$|[\s.,!?;:])/i, code: "B1.05", what: "ravishdosh (-ınca)" },
  { re: /(?:^|[\s(])\S{2,}(ırsa|irse|ursa|ürse|arsa|erse)\S*/i, code: "B1.12", what: "shart (-ırsa)" },
  { re: /\S+(ıyor|iyor|uyor|üyor)(du|lardı)/i, code: "A2.04", what: "davomli oʻtgan zamon (-yordu)" },
  { re: /(?:^|[\s(])\S+(mış|miş|muş|müş)(?!t)/i, code: "A2.05", what: "naqli oʻtgan zamon (-mış)" },
  { re: /\S+(abil|ebil)/i, code: "A2.09", what: "qila olmoq (-abil)" },
  { re: /\S+(malı|meli)/i, code: "A2.11", what: "kerak (-malı)" },
  { re: /\S+(dıktan|dikten|duktan|dükten|tıktan|tikten|tuktan|tükten) sonra/i, code: "A2.16", what: "-dıktan sonra" },
  { re: /\S+(madan|meden) önce/i, code: "A2.17", what: "-madan önce" },
  { re: /(?:^|[\s(])\S{2,}(arak|erek)(?=$|[\s.,!?;:])/i, code: "A2.18", what: "ravishdosh (-arak)" },
  { re: /(?:^|[\s(])(?!erken)\S+(ken)(?=$|[\s.,!?;:])/i, code: "A2.15", what: "-ken (…ayotganda)" },
  { re: /(?:^|[\s(])\S+(ıyor|iyor|uyor|üyor)\S*/i, code: "A1.24", what: "hozirgi zamon (-yor)" },
  { re: /(?:^|[\s(])\S+(acak|ecek|acağ|eceğ)\S*/i, code: "A1.26", what: "kelasi zamon (-acak)" },
  { re: /(?:^|[\s(])\S+(alım|elim)(?=$|[\s.,!?;:])/i, code: "A1.27", what: "taklif (-alım)" },
  { re: /(?:^|[\s(])\S+(mak|mek)(?=$|[\s.,!?;:])/i, code: "A1.22", what: "feʼlning noaniq shakli (-mak)" },
  { re: /\s(mı|mi|mu|mü)(\s|\?|$)|\s(mı|mi|mu|mü)(sın|sin|sun|sün|yım|yim|yum|yüm|yız|yiz|yuz|yüz|sınız|siniz|sunuz|sünüz)(?=$|[\s.,!?;:])/i, code: "A1.33", what: "soʻroq yuklamasi (mı)" },
  { re: /(?:^|[\s(])(var|yok)(?=$|[\s.,!?;:])/i, code: "A1.21", what: "var / yok" },
  { re: /(?:^|[\s(])değil/i, code: "A1.20", what: "inkor: değil" },
  { re: /(?:^|[\s(])(ile|için|gibi)(?=$|[\s.,!?;:])/i, code: "A1.29", what: "koʻmakchi: ile / için / gibi" },
  { re: /(?:^|[\s(])(daha|en)\s/i, code: "A1.14", what: "qiyoslash: daha / en" },
  { re: /(?:^|[\s(])(üst|alt|iç|ön|arka|yan)(ı|i|u|ü|sı)?n?(da|de|a|e|dan|den)(?=$|[\s.,!?;:])/i, code: "A1.30", what: "joy soʻzlari (üstünde…)" },
  { re: /(?:^|[\s(])\S{2,}(lar|ler)(?=$|[\s.,!?;:])/i, code: "A1.01", what: "koʻplik (-lar)" },
  { re: /'(da|de|ta|te)(?=$|[\s.,!?;:])/i, code: "A1.06", what: "oʻrin-payt (-da)" },
  { re: /'(dan|den|tan|ten)(?=$|[\s.,!?;:])/i, code: "A1.07", what: "chiqish (-dan)" },
  { re: /'(ya|ye|a|e)(?=$|[\s.,!?;:])/i, code: "A1.05", what: "joʻnalish (-ga)" }
];
function trHistory() { try { return JSON.parse(localStorage.getItem("ty-tr-hist") || "[]"); } catch (e) { return []; } }
function trRemember(item) {
  const h = trHistory().filter(x => !(x.s === item.s && x.d === item.d));
  h.unshift(item);
  try { localStorage.setItem("ty-tr-hist", JSON.stringify(h.slice(0, 8))); } catch (e) {}
}
function dictHits(text, dir) {
  const words = plain(text).split(/[\s,.;:!?]+/).filter(w => w.length > 1);
  if (!words.length) return [];
  const out = [];
  ALL.forEach(w => {
    const src = plain(dir === "tr" ? w.tr : w.uz).split(/[;,]/)[0].replace(/^\d+ — /, "").trim();
    if (src && (words.includes(src) || (src.includes(" ") && plain(text).includes(src)))) out.push(w);
  });
  return out.slice(0, 8);
}
function grammarHints(trText) {
  if (!trText) return [];
  const t = " " + trText + " ";
  return TR_HINTS.filter(h => h.re.test(t)).slice(0, 4);
}
function trResultHtml() {
  const o = TR_OUT;
  if (!o) return "";
  const trSide = TR_DIR === "tr" ? TR_TEXT : o.text;
  const hints = grammarHints(trSide), hits = dictHits(TR_TEXT, TR_DIR);
  return `${o.text ? `<div class="glass pad tr-out">
      <div class="tile-row"><span class="tag violet-t">${TR_DIR === "tr" ? "Oʻzbekcha" : "Turkcha"}</span>
        <span style="display:flex;gap:8px">${TR_DIR === "uz" ? `<button class="say" data-act="say" data-t="${esc(o.text)}" aria-label="Tinglash">${ICON.speak}</button>` : ""}<button class="say" data-act="tr-copy" aria-label="Nusxa olish">${ICON.copy}</button></span></div>
      <div class="tr-text" ${TR_DIR === "uz" ? 'lang="tr"' : ""}>${esc(o.text)}</div>
      ${o.alts && o.alts.length ? `<div class="sub">Boshqa variantlar: ${o.alts.map(esc).join(" · ")}</div>` : ""}
    </div>` : ""}
    ${o.err ? `<div class="notice"><div>${esc(o.err)}</div></div>` : ""}
    ${hints.length ? `<section class="section"><div class="section-head"><h2>Bu gapdagi grammatika</h2></div><div class="list">${hints.map(h => {
      const tp = gxTopic(h.code);
      return `<a class="unit glass" href="#${gHash(h.code)}"><span class="art sky"><span style="font-size:13px">${h.code}</span></span><span class="unit-body"><span class="unit-title">${esc(tp ? tp.uz : h.what)}</span><span class="unit-sub">Topildi: ${esc(h.what)}</span></span>${ICON.chev}</a>`;
    }).join("")}</div></section>` : ""}
    ${hits.length ? `<section class="section"><div class="section-head"><h2>Lugʻatimizda bor</h2></div><div class="words glass">${hits.map(w => wordRow(w, true)).join("")}</div></section>` : ""}`;
}
function viewTranslate() {
  const hist = trHistory();
  const from = TR_DIR === "tr" ? "Turkcha" : "Oʻzbekcha", to = TR_DIR === "tr" ? "Oʻzbekcha" : "Turkcha";
  return `${topbar()}
  <div><h1 class="page-title">Aqlli tarjimon</h1><p class="sub">Tarjima, lugʻatimizdagi soʻzlar va gapdagi grammatika bir joyda</p></div>
  <div class="tr-dir glass"><b>${from}</b><button class="icon-btn" data-act="tr-swap" aria-label="Yoʻnalishni almashtirish">${ICON.swap}</button><b>${to}</b></div>
  <div class="glass tr-in">
    <label class="sr" for="tr-src">${from} matn</label>
    <textarea id="tr-src" rows="4" maxlength="500" ${TR_DIR === "tr" ? 'lang="tr"' : ""}>${esc(TR_TEXT)}</textarea>
    ${TR_DIR === "tr" ? `<div class="keys">${["ç", "ş", "ğ", "ı", "İ", "ö", "ü"].map(k => `<button type="button" data-act="tr-key" data-k="${k}">${k}</button>`).join("")}</div>` : ""}
    <div class="tile-row"><span class="sub" id="tr-count">${TR_TEXT.length}/500</span>
      <span style="display:flex;gap:8px">${TR_DIR === "tr" ? `<button class="say" data-act="tr-say" aria-label="Tinglash">${ICON.speak}</button>` : ""}<button class="btn btn-ghost" style="min-height:42px;padding:0 14px" data-act="tr-clear">Tozalash</button></span></div>
  </div>
  <button class="btn btn-grad btn-block" data-act="tr-go" ${TR_BUSY ? "disabled" : ""}>${ICON.translate}${TR_BUSY ? "Tarjima qilinmoqda…" : "Tarjima qilish"}</button>
  <div id="tr-result">${trResultHtml()}</div>
  ${hist.length ? `<section class="section"><div class="section-head"><h2>Oxirgi tarjimalar</h2><button class="link" data-act="tr-hist-clear">Tozalash</button></div>
    <div class="words glass">${hist.map((h, i) => `<button class="toc-row" data-act="tr-hist" data-i="${i}"><span class="code">${h.d === "tr" ? "TR" : "UZ"}</span><span style="min-width:0"><b ${h.d === "tr" ? 'lang="tr"' : ""}>${esc(h.s.slice(0, 60))}</b><small>${esc(h.t.slice(0, 70))}</small></span>${ICON.chev}</button>`).join("")}</div></section>` : ""}
  <p class="auth-small">Tarjima bepul MyMemory xizmati orqali qilinadi, natija taxminiy boʻlishi mumkin. Matningiz shu xizmatga yuboriladi: shaxsiy maʼlumot yozmang.</p>`;
}
async function translateNow() {
  const text = ($("tr-src") ? $("tr-src").value : TR_TEXT).trim();
  TR_TEXT = text;
  if (!text) { toast("Avval matn yozing"); return; }
  TR_BUSY = true; route();
  const pair = TR_DIR === "tr" ? "tr|uz" : "uz|tr";
  try {
    const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(pair)}`);
    const j = await r.json();
    let out = (j.responseData && j.responseData.translatedText) || "";
    if (/MYMEMORY WARNING|QUOTA/i.test(out) || j.quotaFinished) {
      TR_OUT = { text: "", err: "Bugungi bepul tarjima limiti tugadi. Ertaga yana urinib koʻring. Lugʻatimizdan topilganlar pastda." };
    } else if (!out || j.responseStatus >= 400) {
      TR_OUT = { text: "", err: "Tarjima qilib boʻlmadi. Boshqacha yozib koʻring." };
    } else {
      const ta = document.createElement("textarea"); ta.innerHTML = out; out = ta.value;
      const alts = [...new Set((j.matches || []).map(m => (m.translation || "").trim()).filter(t => t && fold(t) !== fold(out) && t.length < 200))].slice(0, 2);
      TR_OUT = { text: out, alts };
      S.trUses = (S.trUses || 0) + 1; save();
      trRemember({ s: text, t: out, d: TR_DIR });
    }
  } catch (e) {
    TR_OUT = { text: "", err: "Tarjima uchun internet kerak. Lugʻatimizdan topilganlar pastda." };
  }
  TR_BUSY = false; route();
}

/* ---------- Personal details: gender and birth date ---------- */
let PROFILE = { gender: "", birth: "" }, PENDING_PROFILE = null;
const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
function ageOf(birth) {
  const [y, m, d] = birth.split("-").map(Number), now = new Date();
  let a = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) a--;
  return a;
}
const birthText = b => { const [y, m, d] = b.split("-").map(Number); return `${d}-${MONTHS[m - 1]}, ${y} · ${ageOf(b)} yosh`; };
function genderSticker() {
  if (!PROFILE.gender) return "";
  return PROFILE.gender === "f" ? `<span class="sticker f" title="Ayol" aria-label="Ayol">${ICON.female}</span>` : `<span class="sticker m" title="Erkak" aria-label="Erkak">${ICON.male}</span>`;
}
function birthSelects(prefix, value) {
  const [y, m, d] = (value || "").split("-").map(Number), maxY = new Date().getFullYear() - 5;
  const opt = (v, l, sel) => `<option value="${v}" ${sel ? "selected" : ""}>${l}</option>`;
  return `<select id="${prefix}-day" aria-label="Kun">${opt("", "Kun", !d)}${Array.from({ length: 31 }, (_, i) => opt(i + 1, i + 1, d === i + 1)).join("")}</select>
    <select id="${prefix}-month" aria-label="Oy">${opt("", "Oy", !m)}${MONTHS.map((n, i) => opt(i + 1, n, m === i + 1)).join("")}</select>
    <select id="${prefix}-year" aria-label="Yil">${opt("", "Yil", !y)}${Array.from({ length: maxY - 1939 }, (_, i) => maxY - i).map(v => opt(v, v, y === v)).join("")}</select>`;
}
// Returns "YYYY-MM-DD" or an error message
function readBirth(prefix) {
  const d = +$(prefix + "-day").value, m = +$(prefix + "-month").value, y = +$(prefix + "-year").value;
  if (!d || !m || !y) return { err: "Tugʻilgan sanani toʻliq tanlang: kun, oy va yil." };
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCMonth() !== m - 1) return { err: `${MONTHS[m - 1]} oyida ${d}-kun yoʻq.` };
  return { v: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}` };
}
function profileSheet(required) {
  openSheet(`<h3>${required ? "Profilingizni toʻldiring" : "Shaxsiy maʼlumotlar"}</h3>
    ${required ? `<p class="sub">Pamuk sizni yaxshiroq tanishi uchun ikki savol. Bu maʼlumotlar boshqalarga koʻrinmaydi.</p>` : ""}
    <div class="field"><span class="flabel" id="ps-g">Jinsingiz</span>
      <div class="seg glass" role="radiogroup" aria-labelledby="ps-g">
        <button type="button" role="radio" data-act="ps-gender" data-g="m" aria-checked="${PROFILE.gender === "m"}">Erkak</button>
        <button type="button" role="radio" data-act="ps-gender" data-g="f" aria-checked="${PROFILE.gender === "f"}">Ayol</button>
      </div></div>
    <div class="field"><span class="flabel" id="ps-b">Tugʻilgan sana</span><div class="birth" role="group" aria-labelledby="ps-b">${birthSelects("ps", PROFILE.birth)}</div></div>
    <p class="auth-err" id="ps-err" role="alert"></p>
    <button class="btn btn-grad btn-block" data-act="ps-save">Saqlash</button>
    ${required ? "" : `<button class="btn btn-ghost btn-block" data-act="sheet-x">Bekor qilish</button>`}`);
  $("sheet").dataset.locked = required ? "1" : "";
}
async function saveProfile(p) {
  PROFILE = Object.assign(PROFILE, p);
  try { localStorage.setItem("ty-profile" + (USER ? ":" + USER.uid : ""), JSON.stringify(PROFILE)); } catch (e) {}
  if (db && USER) await db.collection("users").doc(USER.uid).set({ gender: PROFILE.gender, birth: PROFILE.birth }, { merge: true }).catch(() => toast("Maʼlumot serverga yozilmadi, internetni tekshiring"));
}

/* Course vocabulary joins the shared word list (thematic words keep their place, duplicates are skipped) */
const ALL_BY_TR = {};
ALL.forEach(w => { const k = fold(w.tr); if (!(k in ALL_BY_TR)) ALL_BY_TR[k] = w; });
[["A1", "sky"], ["A2", "violet"], ["B1", "orange"], ["B2", "pink"]].forEach(([lv, color]) => {
  const ui = UNITS.length, unit = { id: "kurs" + lv, tr: "Kurs " + lv, uz: "Kurs lugʻati " + lv, course: lv, tip: ["Kurs lugʻati", `${lv} darajasidagi kurs boʻlimlarining soʻzlari.`], words: [] };
  UNITS.push(unit);
  COURSE.units.filter(u => u.level === lv).forEach(u => u.vocab.forEach(g => g.words.forEach(([tr, uzz]) => {
    const k = fold(tr);
    if (k in ALL_BY_TR) return;
    const w = { tr, uz: uzz, note: "", unit: ui };
    ALL.push(w); ALL_BY_TR[k] = w; unit.words.push([tr, uzz]);
  })));
  CATS.push({ id: "k" + lv, uz: `Kurs ${lv} lugʻati`, color, ico: "book", ids: [unit.id] });
});

/* ---------- A1–B2 course (course.js): levels, units, level tests ---------- */
const KU = {};
COURSE.units.forEach((u, i) => { KU[u.id] = u; u.idx = i; });
const kHash = id => "k-" + id;
const KLEVEL = id => COURSE.levels.find(l => l.id === id);
// Vocabulary of each unit, resolved to entries of the shared word list (SRS state is shared by Turkish spelling)
const KWORDS = {};
COURSE.units.forEach(u => {
  KWORDS[u.id] = [];
  u.vocab.forEach(g => g.words.forEach(([tr]) => { const w = ALL_BY_TR[fold(tr)]; if (w && !KWORDS[u.id].includes(w)) KWORDS[u.id].push(w); }));
});
let KTAB = "vocab";
const kState = id => S.k[id] || (S.k[id] = { e: {}, v: {} });
// Answer keys that can be checked: "1-a", "2-3"…, plus reading "r-1"
function kKeys(u) {
  const keys = [];
  u.exercises.forEach(e => {
    if (e.match) e.match.left.forEach((_, i) => { if (e.ans[String(i + 1)]) keys.push(`${e.n}-${i + 1}`); });
    else e.items.forEach(([k]) => { if (e.ans[k]) keys.push(`${e.n}-${k}`); });
  });
  if (u.reading && u.reading.ans) Object.keys(u.reading.ans).forEach(k => keys.push(`r-${k}`));
  return keys;
}
function kProgress(id) {
  const u = KU[id], keys = kKeys(u), st = S.k[id];
  if (!keys.length) return st && st.done ? 1 : 0;
  return st ? keys.filter(k => st.e[k] === 1).length / keys.length : 0;
}
const kDone = id => !!(S.k[id] && S.k[id].done);
const kDoneCount = (lv) => COURSE.units.filter(u => (!lv || u.level === lv) && kDone(u.id)).length;
const kNext = () => COURSE.units.find((u, i) => i >= (S.kStart || 0) && !kDone(u.id)) || COURSE.units.find(u => !kDone(u.id)) || COURSE.units[0];
const kTestBest = lv => (S.ktest && S.ktest[lv]) || 0;

// Normalise an answer for comparison: drop notes in brackets, quotes and punctuation
const ansNorm = s => fold(String(s).replace(/\([^)]*\)/g, " ").replace(/[«»"“”]/g, "").replace(/[’ʼ`]/g, "'").replace(/\s+—\s+/g, " — "));
const ansPlain = s => plain(String(s).replace(/\([^)]*\)/g, " ").replace(/[«»"“”’ʼ`']/g, ""));
function ansVariants(a) { return String(a).split(/\s+\/\s+|;\s*/).map(x => x.trim()).filter(Boolean).concat([a]); }
// 2 = exact, 1 = only letters differ (ç/c, ı/i…), 0 = wrong
function ansMatch(user, right) {
  if (!user.trim()) return 0;
  const vs = ansVariants(right);
  if (vs.some(v => ansNorm(v) === ansNorm(user))) return 2;
  if (vs.some(v => ansPlain(v) === ansPlain(user))) return 1;
  return 0;
}

/* Pamuk's little speech bubble that reacts to answers */
const PRAISE = [["Harika!", "Ajoyib!"], ["Aferin!", "Barakalla!"], ["Süper!", "Zoʻr!"], ["Doğru!", "Toʻgʻri!"], ["Mükemmel!", "Mukammal!"], ["Çok iyi!", "Juda yaxshi!"]];
const COMFORT = ["Afsus… Hech gap emas, yana urinib koʻramiz.", "Xato — oʻrganishning bir qismi. Toʻgʻri javobni eslab qoling.", "Ozgina qoldi! Keyingisi albatta chiqadi.", "Pamuk ham xafa… lekin siz uddalaysiz!"];
let sayT;
function pamukSay(mood, text) {
  const box = $("pamuk-say");
  box.innerHTML = `${catSVG({ pose: "head", cls: mood === "sad" ? "sad" : "happy" })}<p>${esc(text)}</p>`;
  box.className = "pamuk-say show " + mood;
  CatLife.scan();
  const c = box.querySelector(".cat");
  CatLife.mood(c, mood === "sad" ? "sad" : "happy", 1900);
  clearTimeout(sayT); sayT = setTimeout(() => { box.className = "pamuk-say " + mood; }, 2200);
}
const praise = () => { const p = PRAISE[Math.floor(Math.random() * PRAISE.length)]; return `${p[0]} ${p[1]}`; };
const comfort = () => COMFORT[Math.floor(Math.random() * COMFORT.length)];

function renderBlocks(blocks) {
  return blocks.map(b => {
    if (b.sub) return `<h3 class="k-sub">${nb(b.sub)}</h3>`;
    if (b.p) return `<p class="k-p">${esc(b.p)}</p>`;
    if (b.note) return `<div class="tip glass">${ICON.bulb}<div>${esc(b.note)}</div></div>`;
    if (b.table) return `<div class="table-wrap glass"><table class="gtable k-table"><thead><tr>${b.table.h.map(h => `<th scope="col">${esc(h)}</th>`).join("")}</tr></thead><tbody>${b.table.r.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    if (b.gloss) return `<div class="k-gloss">${b.gloss.map(([a, c]) => `<span><b lang="tr">${esc(a)}</b> — ${esc(c)}</span>`).join("")}</div>`;
    if (b.dlg) {
      const sides = {};
      let n = 0;
      b.dlg.forEach(([who]) => { if (!(who in sides)) sides[who] = n++ % 2 ? "r" : "l"; });
      return `<div class="dlg">
        <button class="btn btn-soft" data-act="say-seq" data-lines="${esc(JSON.stringify(b.dlg.map(x => x[1])))}">${ICON.speak}Dialogni tinglash</button>
        ${b.dlg.map(([who, t]) => `<div class="bubble ${sides[who]}"><small>${esc(who)}</small><span lang="tr">${esc(t)}</span><button class="say mini" data-act="say" data-t="${esc(t)}" aria-label="Tinglash">${ICON.speak}</button></div>`).join("")}
      </div>`;
    }
    return "";
  }).join("");
}
function speakSeq(lines) {
  try { speechSynthesis.cancel(); } catch (e) { return; }
  let i = 0;
  const next = () => {
    if (i >= lines.length) return;
    const u = new SpeechSynthesisUtterance(lines[i++].replace(/…/g, ""));
    u.lang = "tr-TR"; u.rate = 0.9;
    const v = voices.find(v => (v.lang || "").toLowerCase().startsWith("tr")); if (v) u.voice = v;
    u.onend = () => setTimeout(next, 350);
    speechSynthesis.speak(u);
  };
  next();
}

function kUnitRow(u) {
  const p = kProgress(u.id), done = kDone(u.id);
  return `<a class="unit glass" href="#${kHash(u.id)}">
    <span class="art ${done ? "green" : { A1: "sky", A2: "violet", B1: "orange", B2: "pink" }[u.level]}"><span style="font-size:15px">${u.level}.${u.n}</span></span>
    <span class="unit-body"><span class="unit-title" lang="tr">${esc(u.title)}</span><span class="unit-sub">${esc(u.sub)}</span></span>
    ${done ? `<span class="state done" title="Tugallangan">${ICON.check}</span>` : pctRing(p)}
  </a>`;
}
let KLV = null;
function viewCourse() {
  const lvl = KLEVEL(KLV || kNext().level);
  const total = COURSE.units.length, done = kDoneCount();
  return `${topbar()}
  <h1 class="page-title">Darslar</h1>
  ${lessonTabs("course")}
  <div class="k-hero glass">
    <div class="k-hero-txt"><span class="tag green-t">${ICON.check}100% bepul</span>
      <h2>Turk tili A1 → B2</h2>
      <p>32 boʻlim, 4 ta daraja testi va ${Object.values(KWORDS).reduce((a, w) => a + w.length, 0)} ta soʻz. Oʻzbek tilida tushuntirilgan, reklamasiz.</p>
      <div class="bar" aria-label="${done}/${total}"><i style="width:${pct(done, total)}%"></i></div>
      <small class="muted">${done}/${total} boʻlim tugallangan</small></div>
    <div class="k-hero-cat">${mascot("cap")}</div>
  </div>
  <a class="pcard glass" href="#placement" style="color:inherit;text-decoration:none;padding:14px 16px">
    <div class="pcard-head"><b>${ICON.target}${S.place && (S.place.start || S.place.applied) ? `Darajangiz: ${esc(S.place.applied || S.place.start)} dan · qayta aniqlash` : "Darajani aniqlash testi"}</b>${ICON.chev}</div>
    ${S.place && (S.place.start || S.place.applied) ? "" : `<p class="muted" style="margin:0">Turkchani biroz bilsangiz, 5–7 daqiqada mos boʻlimni topamiz.</p>`}
  </a>
  <div class="seg glass" role="tablist">${COURSE.levels.map(l => `<button role="tab" data-act="k-lv" data-l="${l.id}" aria-selected="${l.id === lvl.id}">${l.id}</button>`).join("")}</div>
  <div class="glass pad"><b>${esc(lvl.title)}</b><p class="sub" style="margin-top:4px">${esc(lvl.intro)}</p></div>
  <div class="list">${lvl.units.map(id => kUnitRow(KU[id])).join("")}
    <a class="unit glass" href="#ktest-${lvl.id.toLowerCase()}">
      <span class="art teal"><span style="font-size:13px">TEST</span></span>
      <span class="unit-body"><span class="unit-title">${esc(lvl.test.title)}</span><span class="unit-sub">4 qism: Okuma · Dinleme · Yazma · Konuşma · oʻtish bali ${lvl.test.pass}%${kTestBest(lvl.id) ? ` · eng yaxshi natija ${kTestBest(lvl.id)}%` : ""}</span></span>
      ${kTestBest(lvl.id) >= lvl.test.pass ? `<span class="state done">${ICON.check}</span>` : ICON.chev}
    </a></div>`;
}
const KTABS = [["vocab", "Lugʻat"], ["grammar", "Grammatika"], ["dialog", "Dialog"], ["read", "Matn"], ["ex", "Mashqlar"]];
function viewCourseUnit(id) {
  const u = KU[id], st = kState(id), p = kProgress(id);
  const gram = u.sections.filter(s => s.kind !== "dialog"), dlg = u.sections.filter(s => s.kind === "dialog");
  const tabs = KTABS.filter(([k]) => !(k === "read" && !u.reading) && !(k === "dialog" && !dlg.length));
  if (!tabs.some(([k]) => k === KTAB)) KTAB = "vocab";
  const prev = COURSE.units[u.idx - 1], next = COURSE.units[u.idx + 1];
  let body = "";
  if (KTAB === "vocab") {
    body = `${u.vocab.map(g => `<section class="section"><div class="section-head"><h2>${esc(g.title)}</h2></div>
      <div class="words glass">${g.words.map(([tr, uzz]) => { const w = ALL_BY_TR[fold(tr)] || { tr, uz: uzz, note: "", unit: 0 }; return `<div class="word">
        <button class="say" data-act="say" data-t="${esc(tr)}" aria-label="${esc(tr)} — tinglash">${ICON.speak}</button>
        <div style="min-width:0"><div class="word-tr" lang="tr">${esc(tr)}</div><div class="word-uz">${esc(uzz)}</div></div>${wordState(w)}</div>`; }).join("")}</div></section>`).join("")}
      <div class="sticky-cta"><button class="btn btn-grad btn-block" data-act="modes" data-u="k:${id}" data-title="${esc(u.title)}">${ICON.cards}Soʻzlarni mashq qilish</button></div>`;
  } else if (KTAB === "grammar") {
    body = gram.map(s => `<section class="section"><div class="section-head"><h2>${esc(s.title)}</h2></div>${renderBlocks(s.blocks)}</section>`).join("");
  } else if (KTAB === "dialog") {
    body = `<button class="btn btn-soft btn-block" data-act="start" data-mode="lsent" data-u="${u.id}">${ICON.ear}Matnsiz tinglash mashqi</button>
      ${canListen() ? `<details class="glass pad"><summary><b>${ICON.mic}Gapirish: rolli dialog va takrorlash</b></summary><div style="display:flex;flex-direction:column;gap:10px;margin-top:10px">
        <button class="mode glass" data-act="start" data-mode="sayline" data-u="${u.id}"><span class="ico sky-t">${ICON.speak}</span><span><b>Gaplarni takrorlash</b><span>Shu boʻlim dialoglaridan</span></span>${ICON.chev}</button>${roleButtons(u)}</div></details>` : ""}` + dlg.map(s => `<section class="section"><div class="section-head"><h2>${esc(s.title.replace(/^Dialog:\s*/, ""))}</h2></div>${renderBlocks(s.blocks)}</section>`).join("");
  } else if (KTAB === "read") {
    const r = u.reading;
    body = `<section class="section"><div class="section-head"><h2 lang="tr">${esc(r.title || "Oʻqish matni")}</h2><button class="say" data-act="say" data-t="${esc(r.text)}" aria-label="Matnni tinglash">${ICON.speak}</button></div>
      <div class="glass pad k-read" lang="tr">${esc(r.text)}</div>
      ${r.gloss && r.gloss.length ? `<div class="k-gloss">${r.gloss.map(([a, c]) => `<span><b lang="tr">${esc(a)}</b> — ${esc(c)}</span>`).join("")}</div>` : ""}</section>
      ${canListen() && r.ans && Object.values(r.ans).some(x => !/^[DY]$/.test(x)) ? `<button class="btn btn-soft btn-block" data-act="start" data-mode="oral" data-u="${u.id}">${ICON.mic}Savollarga ogʻzaki javob berish</button>` : ""}
      ${r.qs.length ? `<section class="section"><div class="section-head"><h2>${esc(r.qtitle || "Savollar")}</h2></div>
        ${r.qs.map((q, i) => kItem(id, "r", String(i + 1), q, r.ans ? r.ans[String(i + 1)] : "", false, st)).join("")}</section>` : ""}`;
  } else {
    body = u.exercises.map(e => kExercise(id, e, st)).join("") || `<div class="glass empty">Bu boʻlimda mashq yoʻq.</div>`;
  }
  return `<div><a class="back" href="#course">${ICON.back}Kurs</a></div>
  <div class="lesson-head">
    <div class="tags"><span class="tag sky-t">${u.level} · ${u.n}-boʻlim</span>${kDone(id) ? `<span class="tag green-t">${ICON.check}Tugallangan</span>` : `<span class="tag violet-t">${Math.round(p * 100)}%</span>`}</div>
    <h1 lang="tr">${esc(u.title)}</h1>
    <p class="sub">${esc(u.sub)}</p>
  </div>
  ${u.goals.length ? `<details class="glass k-goals"><summary><b>Bu boʻlimda oʻrganasiz</b></summary><ul>${u.goals.map(g => `<li>${esc(g)}</li>`).join("")}</ul></details>` : ""}
  <nav class="chips k-tabs" aria-label="Boʻlim qismlari">${tabs.map(([k, l]) => `<button class="chip" data-act="k-tab" data-t="${k}" aria-pressed="${KTAB === k}">${l}</button>`).join("")}</nav>
  <div id="k-body">${body}</div>
  <div class="pager" style="grid-template-columns:1fr 1fr">
    ${prev ? `<a class="btn btn-ghost" href="#${kHash(prev.id)}">${ICON.back}${prev.level}.${prev.n}</a>` : "<span></span>"}
    ${next ? `<a class="btn btn-grad" href="#${kHash(next.id)}">${next.level}.${next.n}${ICON.chev.replace('class="chev"', 'style="width:20px;height:20px"')}</a>` : "<span></span>"}
  </div>`;
}
// One answerable line: prompt + input (or D/Y buttons) + check
function kItem(id, n, k, prompt, ans, sample, st, label) {
  const key = `${n}-${k}`, val = st.v[key] || "", res = st.e[key];
  const dy = ans && /^[DY]$/.test(ans.trim());
  const status = res === 1 ? "ok" : res === 0 ? "no" : "";
  const fb = res === 1 ? `<span class="ok">${ICON.check} Toʻgʻri</span>` : res === 0 ? `<span class="no">Toʻgʻri javob: <b lang="tr">${esc(ans)}</b></span>` : "";
  if (!ans) {
    return `<div class="k-item glass"><div class="k-q"><b>${esc(label || k)})</b> <span lang="tr">${esc(prompt)}</span>${sample ? "" : ` <span class="tag sky-t">namuna</span>`}</div></div>`;
  }
  return `<div class="k-item glass ${status}" data-key="${key}">
    <div class="k-q"><b>${esc(label || k)})</b> <span>${esc(prompt)}</span></div>
    ${dy ? `<div class="k-dy"><button class="opt${val === "D" ? (res === 1 ? " right" : " wrong") : ""}" data-act="k-dy" data-id="${id}" data-key="${key}" data-v="D">D · Toʻgʻri</button><button class="opt${val === "Y" ? (res === 1 ? " right" : " wrong") : ""}" data-act="k-dy" data-id="${id}" data-key="${key}" data-v="Y">Y · Notoʻgʻri</button></div>`
      : `<div class="k-in"><input class="type-input k-input" id="ki-${id}-${key}" lang="tr" autocomplete="off" autocapitalize="off" spellcheck="false" value="${esc(val)}" aria-label="Javob ${esc(label || k)}"><button class="btn btn-soft" data-act="k-check" data-id="${id}" data-key="${key}">Tekshirish</button></div>`}
    <div class="k-fb">${fb}${sample && res !== 1 ? ` <button class="link" data-act="k-reveal" data-id="${id}" data-key="${key}">Namuna javob</button>` : ""}</div>
  </div>`;
}
function kExercise(id, e, st) {
  const head = `<div class="section-head"><h2>${e.n}-mashq</h2></div><p class="k-p"><b>${esc(e.title)}</b>${e.extra ? `<br>${esc(e.extra)}` : ""}</p>`;
  if (e.match) {
    const keys = e.match.keys.length ? e.match.keys : e.match.right.map((_, i) => "abcdefghij"[i]);
    return `<section class="section">${head}
      <div class="k-gloss">${e.match.right.map((r, i) => `<span><b>${keys[i]})</b> <span lang="tr">${esc(r)}</span></span>`).join("")}</div>
      ${e.match.left.map((l, i) => { const key = `${e.n}-${i + 1}`, res = st.e[key], ans = e.ans[String(i + 1)]; return `<div class="k-item glass ${res === 1 ? "ok" : res === 0 ? "no" : ""}">
        <div class="k-q"><b>${i + 1}.</b> <span lang="tr">${esc(l)}</span></div>
        <div class="k-in"><select class="k-select" data-act="k-match" data-id="${id}" data-key="${key}" aria-label="${i + 1}-band javobi"><option value="">— tanlang —</option>${keys.map(k => `<option value="${k}" ${st.v[key] === k ? "selected" : ""}>${k}) ${esc(e.match.right[keys.indexOf(k)] || "")}</option>`).join("")}</select></div>
        <div class="k-fb">${res === 1 ? `<span class="ok">${ICON.check} Toʻgʻri</span>` : res === 0 ? `<span class="no">Toʻgʻri javob: <b>${esc(ans)})</b></span>` : ""}</div></div>`; }).join("")}
    </section>`;
  }
  const hasAns = e.items.some(([k]) => e.ans[k]);
  if (!e.items.length || !hasAns) {
    const key = `${e.n}-w`, val = st.v[key] || "", sample = e.ans._;
    return `<section class="section">${head}
      ${e.items.length ? `<div class="glass pad">${e.items.map(([k, q]) => `<div><b>${k})</b> <span lang="tr">${esc(q)}</span></div>`).join("")}</div>` : ""}
      ${/^Yozish/.test(e.title) && WT[id] ? `<div class="tags">${WT[id].map(([l]) => `<span class="tag violet-t">${esc(l)}</span>`).join("")}</div>` : ""}
      <textarea class="k-text glass" data-act="k-write" data-id="${id}" data-key="${key}" rows="${/^Yozish/.test(e.title) ? 9 : 5}" placeholder="Shu yerga yozing… (faqat oʻzingiz uchun saqlanadi)" lang="tr">${esc(val)}</textarea>
      ${/^Yozish/.test(e.title) ? `<button class="btn btn-grad btn-block" data-act="wr-check" data-id="${id}" data-key="${key}">${ICON.check}Yozganimni tekshirish</button>
      <div class="glass pad wr-box" id="wr-${id}-${key}" ${WR_RES[id + "|" + key] ? "" : "hidden"}>${WR_RES[id + "|" + key] ? wrResultHtml(WR_RES[id + "|" + key]) : ""}</div>` : ""}
      ${sample ? `<details class="glass pad"><summary><b>Namuna javob</b></summary><p class="k-p" lang="tr" style="margin-top:8px">${esc(sample)}</p></details>` : `<p class="sub">Yozganingizni ovoz chiqarib oʻqing. Imkoni boʻlsa, turkcha biladigan doʻstingizga koʻrsating.</p>`}
    </section>`;
  }
  return `<section class="section">${head}${e.items.map(([k, q]) => kItem(id, e.n, k, q, e.ans[k], !!e.sample || (e.ans[k] || "").split(" ").length > 3, st)).join("")}</section>`;
}
// Check one answer, store it, react, award XP the first time it is right
function kSubmit(id, key, value) {
  const u = KU[id], st = kState(id);
  let right;
  if (key.startsWith("r-")) right = u.reading.ans[key.slice(2)];
  else {
    const [n, k] = key.split("-"), e = u.exercises.find(x => String(x.n) === n);
    right = e.match ? e.ans[k] : e.ans[k];
  }
  const m = ansMatch(value, right);
  const was = st.e[key];
  const isMatch = !key.startsWith("r-") && (u.exercises.find(x => String(x.n) === key.split("-")[0]) || {}).match;
  skillLog(key.startsWith("r-") || isMatch ? "r" : "w", !!m, m && was !== 1 ? 5 : 0);
  st.v[key] = value;
  st.e[key] = m ? 1 : 0;
  dayRec().rev++; S.acc[1]++; if (m) S.acc[0]++;
  if (m && was !== 1) addXP(5); else save();
  if (m === 2) pamukSay("happy", praise());
  else if (m === 1) pamukSay("happy", "Deyarli toʻgʻri! Harflarga eʼtibor bering: " + right);
  else pamukSay("sad", comfort());
  // A unit counts as finished at 70% correct
  if (!st.done && kProgress(id) >= 0.7) {
    st.done = todayKey(); addXP(30);
    celebrate({ title: `${u.level}.${u.n} tugallandi!`, text: `«${u.title}» boʻlimini bepul va mustaqil tugatdingiz. +30 XP`, ico: "check", c: "green" });
  }
  return m;
}
function kRerender() { const y = window.scrollY; route(); window.scrollTo(0, y); }

function viewCourseTest(lv) {
  if (KT_ANS.lv !== lv) { KT_ANS = { lv, l: {}, w: {}, s: {} }; KTEST_ANS = {}; }
  const l = KLEVEL(lv), t = l.test, res = KTEST_RES && KTEST_RES.lv === lv ? KTEST_RES : null, g = ktGen(lv);
  let qn = 0;
  return `<div><a class="back" href="#course">${ICON.back}Kurs</a></div>
  <div class="lesson-head"><div class="tags"><span class="tag teal-t">${lv}</span><span class="tag violet-t">Oʻtish bali ${t.pass}%</span></div><h1>${esc(t.title)}</h1>
    <p class="sub">Test 4 qismdan iborat: Okuma, Dinleme, Yazma va Konuşma. Har qism alohida baholanadi va koʻnikma boʻyicha darajangizni koʻrsatadi. Oxirida «Natijani koʻrish» ni bosing. Test bepul, istalgancha qayta topshirish mumkin.</p></div>
  ${res ? ktResultHtml(res, t.pass) : ""}
  ${t.parts.map(p => `<section class="section">${ktPartHead("r", "Okuma · " + p.name)}
    ${p.text ? `<div class="glass pad k-read" lang="tr">${esc(p.text)}</div>` : ""}
    ${p.qs.map(q => { const i = qn++, chosen = KTEST_ANS[i]; return `<div class="k-item glass">
      <div class="k-q"><b>${i + 1}.</b> <span lang="tr">${esc(q.q)}</span></div>
      <div class="k-opts">${q.o.map((o, oi) => { let cls = chosen === oi ? " picked" : ""; if (res) cls = oi === q.a ? " right" : chosen === oi ? " wrong" : ""; return `<button class="opt${cls}" data-act="k-tq" data-i="${i}" data-o="${oi}" lang="tr" ${res ? "disabled" : ""}>${esc(o)}</button>`; }).join("")}</div></div>`; }).join("")}
  </section>`).join("")}
  ${ktListenHtml(lv, res, qn)}
  ${ktWriteHtml(lv, res, qn + g.l.length)}
  ${ktSpeakHtml(lv, res, qn + g.l.length + g.w.length)}
  ${res ? `<button class="btn btn-ghost btn-block" data-act="k-test-again" data-l="${lv}">Qayta topshirish</button>` : `<button class="btn btn-grad btn-block" data-act="k-test-done" data-l="${lv}">Natijani koʻrish</button>`}`;
}
let KTEST_ANS = {}, KTEST_RES = null;

/* ---------- Achievements: categories, unlock celebration ---------- */
const ACH_CATS = [["learn", "Soʻzlar"], ["streak", "Seriya"], ["course", "Kurs"], ["gram", "Grammatika"], ["practice", "Mashq"], ["life", "Faollik"]];
const ACH = [
  { id: "w10", cat: "learn", t: "Ilk 10 soʻz", d: "10 ta soʻz oʻrganildi", v: learnedCount, n: 10, c: "sky", ico: "book" },
  { id: "w50", cat: "learn", t: "50 ta soʻz", d: "50 ta soʻz oʻrganildi", v: learnedCount, n: 50, c: "sky", ico: "book" },
  { id: "w200", cat: "learn", t: "200 ta soʻz", d: "200 ta soʻz oʻrganildi", v: learnedCount, n: 200, c: "green", ico: "book" },
  { id: "w500", cat: "learn", t: "500 ta soʻz", d: "500 ta soʻz oʻrganildi", v: learnedCount, n: 500, c: "violet", ico: "crown" },
  { id: "w1000", cat: "learn", t: "Soʻz ustasi", d: "1000 ta soʻz oʻrganildi", v: learnedCount, n: 1000, c: "pink", ico: "crown" },
  { id: "s3", cat: "streak", t: "3 kun", d: "3 kun ketma-ket", v: () => S.best, n: 3, c: "orange", ico: "flame" },
  { id: "s7", cat: "streak", t: "1 hafta", d: "7 kun ketma-ket", v: () => S.best, n: 7, c: "orange", ico: "flame" },
  { id: "s14", cat: "streak", t: "2 hafta", d: "14 kun ketma-ket", v: () => S.best, n: 14, c: "orange", ico: "flame" },
  { id: "s30", cat: "streak", t: "1 oy", d: "30 kun ketma-ket", v: () => S.best, n: 30, c: "pink", ico: "flame" },
  { id: "s100", cat: "streak", t: "100 kun", d: "100 kun ketma-ket", v: () => S.best, n: 100, c: "violet", ico: "crown" },
  { id: "k1", cat: "course", t: "Ilk boʻlim", d: "Kursning 1 boʻlimi tugadi", v: () => kDoneCount(), n: 1, c: "sky", ico: "flag" },
  { id: "kA1", cat: "course", t: "A1 bitiruvchisi", d: "A1 ning 8 boʻlimi", v: () => kDoneCount("A1"), n: 8, c: "sky", ico: "cap" },
  { id: "kA2", cat: "course", t: "A2 bitiruvchisi", d: "A2 ning 8 boʻlimi", v: () => kDoneCount("A2"), n: 8, c: "violet", ico: "cap" },
  { id: "kB1", cat: "course", t: "B1 bitiruvchisi", d: "B1 ning 8 boʻlimi", v: () => kDoneCount("B1"), n: 8, c: "orange", ico: "cap" },
  { id: "kB2", cat: "course", t: "B2 bitiruvchisi", d: "B2 ning 8 boʻlimi", v: () => kDoneCount("B2"), n: 8, c: "pink", ico: "cap" },
  { id: "kt1", cat: "course", t: "Test gʻolibi", d: "1 ta daraja testidan oʻtish", v: () => COURSE.levels.filter(l => kTestBest(l.id) >= l.test.pass).length, n: 1, c: "teal", ico: "star" },
  { id: "kt4", cat: "course", t: "A1 → B2", d: "4 ta testdan oʻtish", v: () => COURSE.levels.filter(l => kTestBest(l.id) >= l.test.pass).length, n: 4, c: "green", ico: "crown" },
  { id: "gram", cat: "gram", t: "Grammatika", d: "10 asosiy mavzu", v: gramCount, n: GRAMMAR.length, c: "violet", ico: "cap" },
  { id: "gx10", cat: "gram", t: "Qoida ustasi", d: "10 ta qoida mashqi", v: () => gxDoneCount(), n: 10, c: "sky", ico: "quiz" },
  { id: "gxa1", cat: "gram", t: "A1 qoidalari", d: `A1 ning ${gxCount("A1")} ta qoida mashqi`, v: () => gxDoneCount("A1"), n: gxCount("A1"), c: "green", ico: "crown" },
  { id: "gxa2", cat: "gram", t: "A2 qoidalari", d: `A2 ning ${gxCount("A2")} ta qoida mashqi`, v: () => gxDoneCount("A2"), n: gxCount("A2"), c: "violet", ico: "crown" },
  { id: "gxb1", cat: "gram", t: "B1 qoidalari", d: `B1 ning ${gxCount("B1")} ta qoida mashqi`, v: () => gxDoneCount("B1"), n: gxCount("B1"), c: "orange", ico: "crown" },
  { id: "gxb2", cat: "gram", t: "B2 qoidalari", d: `B2 ning ${gxCount("B2")} ta qoida mashqi`, v: () => gxDoneCount("B2"), n: gxCount("B2"), c: "pink", ico: "crown" },
  { id: "first", cat: "practice", t: "Birinchi qadam", d: "1 ta mashq", v: () => S.sessions, n: 1, c: "violet", ico: "flag" },
  { id: "sess10", cat: "practice", t: "Tirishqoq", d: "10 ta mashq", v: () => S.sessions, n: 10, c: "sky", ico: "bolt" },
  { id: "sess50", cat: "practice", t: "Chempion", d: "50 ta mashq", v: () => S.sessions, n: 50, c: "orange", ico: "bolt" },
  { id: "perfect", cat: "practice", t: "Mukammal", d: "xatosiz mashq", v: () => S.perfect, n: 1, c: "pink", ico: "target" },
  { id: "perfect5", cat: "practice", t: "Aniq nishon", d: "5 ta xatosiz mashq", v: () => S.perfect, n: 5, c: "pink", ico: "target" },
  { id: "four", cat: "practice", t: "Toʻrt tomonlama", d: "Bir kunda 4 koʻnikmani mashq qilish", v: () => Math.max(0, ...Object.values(S.days).map(d => d.sk ? Object.values(d.sk).filter(a => a[1]).length : 0)), n: 4, c: "violet", ico: "target" },
  { id: "listen50", cat: "practice", t: "Ziyrak quloq", d: "Tinglashda 50 ta toʻgʻri javob", v: () => S.sk.l[0], n: 50, c: "sky", ico: "ear" },
  { id: "allA1", cat: "course", t: "Har tomonlama", d: "4 koʻnikmada daraja testidan oʻtish", v: () => SKILLS.filter(s => skLevel(s.id)).length, n: 4, c: "teal", ico: "crown" },
  { id: "writer5", cat: "practice", t: "Yozuvchi", d: "5 ta yozish topshirigʻida 70+ ball", v: () => Object.values(S.k).reduce((a, st) => a + Object.values(st.wb || {}).filter(v => v >= 70).length, 0), n: 5, c: "pink", ico: "type" },
  { id: "roles3", cat: "practice", t: "Aktyor", d: "3 ta rolli dialogni oʻynash", v: () => S.roles || 0, n: 3, c: "orange", ico: "chat" },
  { id: "pron20", cat: "practice", t: "Bulbul", d: "20 ta soʻzni toʻgʻri talaffuz qilish", v: () => S.pron[0], n: 20, c: "green", ico: "mic" },
  { id: "xp1k", cat: "practice", t: "1000 XP", d: "1000 XP toʻplandi", v: () => S.xp, n: 1000, c: "teal", ico: "star" },
  { id: "xp5k", cat: "practice", t: "5000 XP", d: "5000 XP toʻplandi", v: () => S.xp, n: 5000, c: "violet", ico: "star" },
  { id: "photo", cat: "life", t: "Yangi qiyofa", d: "Profil rasmi qoʻyildi", v: () => (MYPHOTO ? 1 : 0), n: 1, c: "sky", ico: "camera" },
  { id: "tr10", cat: "life", t: "Tarjimon", d: "10 marta tarjima", v: () => S.trUses || 0, n: 10, c: "teal", ico: "translate" },
  { id: "share", cat: "life", t: "Doʻstlarga ulashdi", d: "Saytni doʻstlarga ulashish", v: () => S.shared || 0, n: 1, c: "green", ico: "heart" },
  { id: "night", cat: "life", t: "Tungi boyqush", d: "22:00 dan keyin mashq", v: () => S.night || 0, n: 1, c: "violet", ico: "moon" },
  { id: "early", cat: "life", t: "Erta qush", d: "07:00 dan oldin mashq", v: () => S.early || 0, n: 1, c: "orange", ico: "sun" }
];
const achDone = a => a.v() >= a.n;
let ACH_QUEUE = [], achTimer;
function checkAch() {
  if (!S.achv) {
    // First run for this profile: record what is already earned without a fanfare
    S.achv = {};
    ACH.forEach(a => { if (achDone(a)) S.achv[a.id] = todayKey(); });
    try { localStorage.setItem(KEYU, JSON.stringify(S)); } catch (e) {}
    return;
  }
  const fresh = ACH.filter(a => !S.achv[a.id] && achDone(a));
  if (!fresh.length) return;
  fresh.forEach(a => { S.achv[a.id] = todayKey(); S.xp += 20; S.dayXp += 20; S.wxp += 20; dayRec().xp += 20; });
  try { localStorage.setItem(KEYU, JSON.stringify(S)); } catch (e) {}
  cloudSave();
  fresh.forEach(a => celebrate({ title: a.t, text: `${a.d}. Pamuk sizdan faxrlanadi! +20 XP`, ico: a.ico, c: a.c, share: true }));
}
function celebrate(c) {
  ACH_QUEUE.push(c);
  if (ACH_QUEUE.length === 1) showCelebrate();
}
function showCelebrate() {
  const c = ACH_QUEUE[0];
  if (!c) return;
  const el = $("celebrate");
  const colors = ["#ffcf4a", "#ff7aa8", "#6f8dff", "#45d29b", "#a98bff", "#ffa552"];
  el.innerHTML = `<div class="confetti" aria-hidden="true">${Array.from({ length: 36 }, (_, i) => `<i style="left:${Math.random() * 100}%;background:${colors[i % colors.length]};animation-delay:${(Math.random() * 0.6).toFixed(2)}s;animation-duration:${(2 + Math.random() * 1.5).toFixed(2)}s;transform:rotate(${Math.random() * 360}deg)"></i>`).join("")}</div>
    <div class="cel-card" role="dialog" aria-modal="true" aria-label="Yangi yutuq">
      <div class="cel-cat">${mascot("trophy")}</div>
      <span class="medal art ${c.c} cel-medal">${ICON[c.ico] || ICON.star}</span>
      <small class="eyebrow">Yangi yutuq!</small>
      <h2>${esc(c.title)}</h2>
      <p>${esc(c.text)}</p>
      <div class="cel-actions">${c.share ? `<button class="btn btn-ghost" data-act="share" data-text="${esc(`Türkçe Yoʻl'da «${c.title}» yutugʻini oldim! Turk tilini bepul oʻrganing:`)}">${ICON.heart}Ulashish</button>` : ""}<button class="btn btn-grad" data-act="cel-next">Davom etish</button></div>
    </div>`;
  el.hidden = false;
  CatLife.scan();
  setTimeout(() => CatLife.mood(el.querySelector(".cat"), "happy", 2400), 300);
}
function nextCelebrate() {
  ACH_QUEUE.shift();
  if (ACH_QUEUE.length) showCelebrate(); else { $("celebrate").hidden = true; $("celebrate").innerHTML = ""; }
}
function viewAchievements() {
  const done = ACH.filter(achDone).length;
  const nextUp = ACH.filter(a => !achDone(a)).map(a => ({ a, p: Math.min(1, a.v() / a.n) })).sort((x, y) => y.p - x.p).slice(0, 3);
  return `<div><a class="back" href="#profile">${ICON.back}Profil</a></div>
  <div class="ach-hero glass">${mascot("trophy")}<div><h1 class="page-title" style="font-size:26px">Yutuqlar</h1><p class="sub">${done} / ${ACH.length} ochildi · har biri +20 XP</p>
    <div class="bar" style="margin-top:8px"><i style="width:${pct(done, ACH.length)}%"></i></div></div></div>
  ${nextUp.length ? `<section class="section"><div class="section-head"><h2>Yaqin qolgan yutuqlar</h2></div>
    <div class="list">${nextUp.map(({ a, p }) => `<div class="unit glass"><span class="medal art ${a.c}" style="width:56px;height:56px;border-radius:50%;display:grid;place-items:center;color:#fff">${ICON[a.ico] || ICON.star}</span>
      <span class="unit-body"><span class="unit-title">${esc(a.t)}</span><span class="unit-sub">${esc(a.d)} · yana ${Math.max(0, a.n - a.v())} ta</span><span class="bar"><i style="width:${Math.round(p * 100)}%"></i></span></span><span></span></div>`).join("")}</div></section>` : ""}
  ${ACH_CATS.map(([k, l]) => `<section class="section"><div class="section-head"><h2>${l}</h2><span class="tag violet-t">${ACH.filter(a => a.cat === k && achDone(a)).length}/${ACH.filter(a => a.cat === k).length}</span></div>
    <div class="achv">${ACH.filter(a => a.cat === k).map(achCard).join("")}</div></section>`).join("")}`;
}
function achCard(a) {
  const on = achDone(a), v = Math.min(a.v(), a.n), when = S.achv && S.achv[a.id];
  return `<div class="ach glass${on ? " on" : ""}">
    <span class="medal${on ? " art " + a.c : ""}">${on ? (ICON[a.ico] || ICON.star) : ICON.lock}</span><b>${esc(a.t)}</b><small>${esc(a.d)}</small>
    ${on ? (when ? `<small class="muted">${when.slice(8, 10)}.${when.slice(5, 7)}.${when.slice(0, 4)}</small>` : "") : `<span class="bar" aria-label="${v}/${a.n}"><i style="width:${pct(v, a.n)}%"></i></span><small class="muted">${v}/${a.n}</small>`}</div>`;
}

/* ---------- Tips, encouragement, sharing ---------- */
const TIPS = [
  ["Bir soʻzni 3 kun ichida 3 marta takrorlang", "Takrorlash tizimi soʻzlarni aynan unutish arafasida qaytaradi. Kuniga 10 daqiqa — eng samarali usul."],
  ["Turkcha «c» — bu «j»", "cep (choʻntak), cami (masjid). «ç» esa «ch»: çay (choy)."],
  ["Oʻzbekcha bilganingiz — katta ustunlik", "göz — koʻz, yol — yoʻl, kitap — kitob. Turkcha soʻzlarning katta qismi sizga allaqachon tanish."],
  ["Ovoz chiqarib oʻqing", "Har bir soʻzni tinglash tugmasi bilan eshitib, qaytaring. Talaffuz shunday tez oʻrnashadi."],
  ["Kechqurun takrorlang", "Uxlashdan oldin qilingan takrorlash xotirada yaxshiroq saqlanadi."],
  ["Xatolardan qoʻrqmang", "Har bir xato xatolar daftariga tushadi va keyinroq qayta soʻraladi. Xato — oʻrganishning yarmi."],
  ["Aldamchi soʻzlarga ehtiyot boʻling", "dil — til (yurak emas), ayna — koʻzgu (oyna emas), kurt — boʻri (qurt emas)."],
  ["Kuniga 5 ta gap yozing", "Bugungi soʻzlar bilan oʻzingiz haqingizda 5 ta gap yozing — kursdagi yozish mashqlari shu uchun."],
  ["Turk seriallarini subtitr bilan koʻring", "Avval oʻzbekcha, keyin turkcha subtitr bilan. Tanish soʻzlarni ushlashga harakat qiling."],
  ["Unli uygʻunligi — kalit", "Qoʻshimcha soʻzning oxirgi unlisiga moslashadi: evler, okullar. Grammatika boʻlimidagi 1-mavzuni oʻqing."],
  ["Seriyani uzmang", "Har kuni hech boʻlmasa bitta mashq qiling: Pamuk ketma-ket kunlaringizni sanaydi."],
  ["Telefoningizga ilova sifatida oʻrnating", "Profil → Yordam boʻlimida 1 daqiqada oʻrnatish yoʻriqnomasi bor. Internetsiz ham ishlaydi!"],
  ["Tarjimondan aqlli foydalaning", "Gapni tarjima qilganda Pamuk undagi grammatikani topib, qoʻllanma mavzusiga olib boradi."],
  ["-yor hech qachon oʻzgarmaydi", "geliyorum, okuyorum, gidiyorum — «yor» qismi doim bir xil."],
  ["Kichik maqsad qoʻying", "Kunlik maqsadni 30 XP ga qoʻyib, uni har kuni bajarish — katta maqsaddan samaraliroq."],
  ["Doʻstingiz bilan oʻrganing", "Reytingda doʻstingiz bilan bellashing — birga oʻrganish 2 barobar qiziqarli."],
  ["Ğ oʻqilmaydi", "dağ [daa], öğretmen [öö-retmen] — ğ oldingi unlini choʻzadi."],
  ["Dialoglarni rol oʻynab oʻqing", "Kurs dialoglarini ikkala rolda ovoz chiqarib oʻqing, keyin tinglash tugmasi bilan solishtiring."],
  ["Bepul — lekin jiddiy", "Bu kurs A1 dan B2 gacha toʻliq daraja beradi: 32 boʻlim, 4 test. Hech qanday toʻlov yoʻq."],
  ["Bir kunda emas, har kuni", "Damlaya damlaya göl olur — tomchi-tomchi koʻl boʻlur. Kuniga 10 daqiqa, oyiga 300 daqiqa!"]
];
const tipOfDay = () => TIPS[dayNum() % TIPS.length];
async function shareSite(text) {
  const url = location.origin + location.pathname;
  const msg = text || "Turk tilini oʻzbek tilida bepul oʻrganing — Pamuk bilan har kuni 10 daqiqa:";
  try {
    if (navigator.share) { await navigator.share({ title: "Türkçe Yoʻl", text: msg, url }); }
    else { await navigator.clipboard.writeText(msg + " " + url); toast("Havola nusxalandi — doʻstlaringizga yuboring"); }
    S.shared = (S.shared || 0) + 1; save();
  } catch (e) { /* the viewer closed the share sheet */ }
}

/* ---------- Install (PWA) and help ---------- */
let INSTALL_EVT = null;
addEventListener("beforeinstallprompt", e => { e.preventDefault(); INSTALL_EVT = e; if (["#help", "#home", ""].includes(location.hash)) kRerender(); });
addEventListener("appinstalled", () => { INSTALL_EVT = null; toast("Ilova oʻrnatildi! Endi uni bosh ekrandan oching."); });
const isStandalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
function installCard() {
  if (isStandalone()) return "";
  try { if (localStorage.getItem("ty-install-hide")) return ""; } catch (e) {}
  return `<div class="pcard glass install-card">
    <div class="pcard-head"><b>${ICON.download}Ilovani oʻrnating</b><button class="link" data-act="install-hide" aria-label="Yopish">Keyinroq</button></div>
    <p class="muted">Türkçe Yoʻl telefoningizda ilova boʻlib ochiladi, internetsiz ham ishlaydi. Bepul, 1 daqiqa.</p>
    ${INSTALL_EVT ? `<button class="btn btn-grad btn-block" data-act="install">Oʻrnatish</button>` : `<a class="btn btn-soft btn-block" href="#help">Qanday oʻrnatiladi?</a>`}
  </div>`;
}
async function doInstall() {
  if (!INSTALL_EVT) { go("help"); return; }
  INSTALL_EVT.prompt();
  try { await INSTALL_EVT.userChoice; } catch (e) {}
  INSTALL_EVT = null; kRerender();
}
function viewHelp() {
  const step = (n, t, d) => `<div class="help-step"><span class="help-n">${n}</span><div><b>${t}</b><p class="muted">${d}</p></div></div>`;
  return `<div><a class="back" href="#profile">${ICON.back}Profil</a></div>
  <div class="ach-hero glass">${mascot("wave")}<div><h1 class="page-title" style="font-size:26px">Yordam va qoʻllanma</h1><p class="sub">Pamuk saytdan qanday foydalanishni tushuntiradi</p></div></div>

  <section class="section"><div class="section-head"><h2>Ilovani oʻrnatish (PWA)</h2>${isStandalone() ? `<span class="tag green-t">${ICON.check}Oʻrnatilgan</span>` : ""}</div>
    ${INSTALL_EVT ? `<button class="btn btn-grad btn-block" data-act="install">${ICON.download}Hozir oʻrnatish</button>` : ""}
    <div class="glass pad help-box"><b>Android (Chrome)</b>
      ${step(1, "Saytni Chrome brauzerida oching", "inomjonwolves.github.io/T-rk-e")}
      ${step(2, "Yuqori oʻng burchakdagi ⋮ menyusini bosing", "Uch nuqta belgisi")}
      ${step(3, "«Ilovani oʻrnatish» yoki «Bosh ekranga qoʻshish» ni tanlang", "Keyin «Oʻrnatish» ni tasdiqlang")}
      ${step(4, "Bosh ekranda Pamuk belgisi paydo boʻladi", "Endi sayt alohida ilova boʻlib ochiladi")}</div>
    <div class="glass pad help-box"><b>iPhone / iPad (Safari)</b>
      ${step(1, "Saytni Safari brauzerida oching", "Chrome emas, aynan Safari")}
      ${step(2, "Pastdagi «Ulashish» tugmasini bosing", "Kvadrat va yuqoriga qaragan oʻq belgisi")}
      ${step(3, "«Bosh ekranga» (Add to Home Screen) ni tanlang", "Roʻyxatni pastga suring")}
      ${step(4, "«Qoʻshish» ni bosing", "Pamuk belgisi bosh ekranda paydo boʻladi")}</div>
    <div class="glass pad help-box"><b>Kompyuter (Chrome, Edge)</b>
      ${step(1, "Manzil satrining oʻng tomonidagi ⊕ belgisini bosing", "«Ilovani oʻrnatish»")}
      ${step(2, "«Oʻrnatish» ni tasdiqlang", "Ilova alohida oynada ochiladi")}</div>
    <div class="tip glass">${ICON.bulb}<div><b>Nima uchun oʻrnatish kerak?</b>Ilova tezroq ochiladi, toʻliq ekranda ishlaydi va bir marta ochilgandan keyin internetsiz ham darslar ishlaydi.</div></div>
  </section>

  <section class="section"><div class="section-head"><h2>Saytdan qanday foydalanish kerak</h2></div>
    <div class="glass pad help-box">
      ${step(1, "Har kuni «Bugungi reja» ni bajaring", "Bosh sahifadagi kartada: takrorlash + 10 ta yangi soʻz, taxminan 10 daqiqa.")}
      ${step(2, "Kursni tartib bilan oʻqing", "Darslar → Kurs: A1 dan boshlang. Har boʻlimda Lugʻat → Grammatika → Dialog → Matn → Mashqlar.")}
      ${step(3, "Grammatikani mustahkamlang", "Darslar → Grammatika: qoʻllanma mavzulari va qoidalar mashqi.")}
      ${step(4, "Xatolar daftarini tozalang", "Mashq sahifasida: xato qilgan soʻzlaringiz alohida mashq qilinadi.")}
      ${step(5, "Aqlli tarjimondan foydalaning", "Bosh sahifadagi tarjimon: tarjima + lugʻat + gapdagi grammatika.")}
      ${step(6, "Daraja testini topshiring", "Har daraja oxirida test bor: 60% dan yuqori — keyingi darajaga oʻting.")}
    </div></section>

  <section class="section"><div class="section-head"><h2>Koʻp soʻraladigan savollar</h2></div>
    <details class="glass pad"><summary><b>Sayt rostdan ham bepulmi?</b></summary><p class="muted" style="margin-top:6px">Ha, 100% bepul va reklamasiz. Barcha darslar, kurs, testlar va tarjimon bepul.</p></details>
    <details class="glass pad"><summary><b>Qaysi darajagacha oʻrganish mumkin?</b></summary><p class="muted" style="margin-top:6px">A1 (boshlangʻich) dan B2 (yuqori oʻrta) gacha: 32 boʻlim, 4 ta daraja testi, 1000 dan ortiq soʻz.</p></details>
    <details class="glass pad"><summary><b>Natijalarim yoʻqolmaydimi?</b></summary><p class="muted" style="margin-top:6px">Hisobga kirgan boʻlsangiz, natijalaringiz serverda saqlanadi va istalgan qurilmada davom etasiz.</p></details>
    <details class="glass pad"><summary><b>Ovoz eshitilmayapti, nima qilay?</b></summary><p class="muted" style="margin-top:6px">Telefon sozlamalarida «Matnni nutqqa aylantirish» (Text-to-speech) boʻlimida turk tilini yuklab oling va ovoz balandligini tekshiring.</p></details>
    <details class="glass pad"><summary><b>Internetsiz ishlaydimi?</b></summary><p class="muted" style="margin-top:6px">Ha, sayt bir marta ochilgandan keyin darslar internetsiz ham ochiladi. Tarjimon va reyting uchun internet kerak.</p></details>
  </section>

  <section class="section"><div class="section-head"><h2>Doʻstlaringizni taklif qiling</h2></div>
    <div class="glass pad"><p class="muted">Turk tilini birga oʻrganish qiziqarliroq! Havolani doʻstlaringizga yuboring va reytingda bellashing.</p>
      <button class="btn btn-grad btn-block" data-act="share" style="margin-top:10px">${ICON.heart}Doʻstlarga ulashish</button></div></section>`;
}

/* ---------- First-run tour ---------- */
const ONB = [
  { m: "wave", t: "Salom! Men Pamukman", d: "Turk tilini oʻzbek tilida, 100% bepul va reklamasiz oʻrganishga yordam beraman. Har kuni atigi 10 daqiqa yetarli." },
  { m: "cap", t: "A1 dan B2 gacha toʻliq kurs", d: "32 boʻlim, grammatika qoʻllanmasi, 1000 dan ortiq soʻz va daraja testlari. Hammasi tartib bilan, oʻzbekcha tushuntirish bilan." },
  { m: "trophy", t: "Yutuqlar va reyting", d: "Har kuni mashq qiling, seriyani uzmang, yutuqlarni yigʻing va doʻstlaringiz bilan reytingda bellashing." },
  { m: "sit", t: "Telefoningizga oʻrnating", d: "Saytni ilova sifatida oʻrnatsangiz, u tezroq ochiladi va internetsiz ham ishlaydi. Yoʻriqnoma: Profil → Yordam." }
];
let ONB_I = 0;
function showOnboard() {
  const s = ONB[ONB_I], el = $("onboard");
  el.innerHTML = `<div class="onb-card glass blur" role="dialog" aria-modal="true" aria-label="Tanishuv">
    <div class="onb-cat">${mascot(s.m)}</div>
    <h2>${esc(s.t)}</h2><p>${esc(s.d)}</p>
    <div class="onb-dots">${ONB.map((_, i) => `<i class="${i === ONB_I ? "on" : ""}"></i>`).join("")}</div>
    <div class="cel-actions"><button class="btn btn-ghost" data-act="onb-skip">Oʻtkazib yuborish</button><button class="btn btn-grad" data-act="onb-next">${ONB_I < ONB.length - 1 ? "Keyingi" : "Boshladik!"}</button></div>
  </div>`;
  el.hidden = false;
  CatLife.scan();
}
function endOnboard() { S.onb = 1; save(); $("onboard").hidden = true; $("onboard").innerHTML = ""; }
function maybeOnboard() {
  if (S.onb || !$("onboard").hidden || !$("auth").hidden || !$("welcome").hidden) return;
  if (S.xp > 0 || S.sessions > 0) { S.onb = 1; save(); return; }
  ONB_I = 0; showOnboard();
}

/* ---------- Router ---------- */
function route() {
  const h = (location.hash || "#home").slice(1);
  { const ps = $("pamuk-say"); if (ps) { clearTimeout(sayT); ps.classList.remove("show"); } }
  let html, tab = h, after = null;
  const m = /^lesson-(\d+)$/.exec(h), gm = /^grammar-(\d+)$/.exec(h);
  if (m && UNITS[+m[1] - 1]) { html = viewUnit(+m[1] - 1); tab = "lessons"; }
  else if (gm && GRAMMAR[+gm[1] - 1]) { html = viewGrammar(+gm[1] - 1); tab = "lessons"; }
  else if (h.startsWith("g-") && GUIDE_ALL.find(i => gHash(i.code) === h)) { html = viewGuideTopic(GUIDE_ALL.find(i => gHash(i.code) === h)); tab = "lessons"; }
  else if (h === "guide") { html = viewGuide(); tab = "lessons"; }
  else if (h === "translate") { html = viewTranslate(); tab = "home"; }
  else if (h === "course") { html = viewCourse(); tab = "lessons"; }
  else if (h.startsWith("k-") && KU[h.slice(2)]) { html = viewCourseUnit(h.slice(2)); tab = "lessons"; }
  else if (/^ktest-(a1|a2|b1|b2)$/.test(h)) { html = viewCourseTest(h.slice(6).toUpperCase()); tab = "lessons"; }
  else if (h === "achievements") { html = viewAchievements(); tab = "profile"; }
  else if (h === "skills") { html = viewSkills(); tab = "profile"; }
  else if (h === "write") { html = viewWrite(); tab = "practice"; }
  else if (h === "placement") { html = viewPlacement(); tab = "lessons"; }
  else if (h === "admin") { html = viewAdmin(); tab = "profile"; }
  else if (h === "help") { html = viewHelp(); tab = "profile"; }
  else if (h === "gx") { html = viewGx(); tab = "lessons"; }
  else if (h === "lessons") html = viewLessons();
  else if (h === "grammar") { html = viewGrammarList(); tab = "lessons"; }
  else if (h === "alphabet") { html = viewAlphabet(); tab = "lessons"; }
  else if (h === "practice") html = viewPractice();
  else if (h === "rank") { html = viewRank(); after = loadRank; }
  else if (h === "profile") html = viewProfile();
  else { html = viewHome(); tab = "home"; }
  app.innerHTML = `<div class="view">${html}</div>`;
  document.querySelectorAll(".nav a").forEach(a => { if (a.dataset.tab === tab) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  if (after) after();
  CatLife.scan();
  if ($("auth").hidden && $("welcome").hidden) setTimeout(maybeOnboard, 600);
}
function go(to) {
  if (location.hash === "#" + to) route(); else location.hash = to;
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", () => { closeSheet(); route(); window.scrollTo(0, 0); });

/* ---------- Session ---------- */
const sessionEl = $("session"), stage = $("stage"), foot = $("s-foot");
let SES = null;
function pickPool(u) {
  if (u === "all") return ALL.slice();
  if (String(u).startsWith("k:")) return (KWORDS[u.slice(2)] || []).slice();
  if (String(u).startsWith("cat:")) { const c = CATS.find(c => c.id === u.slice(4)); return ALL.filter(w => c.ids.includes(UNITS[w.unit].id)); }
  return ALL.filter(w => w.unit === +u);
}
const typeable = w => !w.tr.includes("…") && w.tr.length <= 20;
function startSession(mode, u) {
  closeSheet();
  let items;
  if (mode === "review") {
    // Due reviews first (oldest first), then today's share of new words in lesson order
    items = dueWords().slice(0, 20).concat(newWords(Math.min(newLeft(), NEW_PER_DAY)));
    if (!items.length) { toast("Bugun takrorlash yoʻq. Erkin mashq qiling!"); return; }
  } else if (mode === "mistakes") {
    items = shuffle(mistakeWords().slice(0, 15));
    if (!items.length) { toast("Xatolar daftari boʻsh"); return; }
  } else if (mode === "gx") {
    items = BX[u].map((ex, i) => ({ gx: true, code: u, i, ex }));
  } else if (mode === "gxm") {
    items = shuffle(gxMistakes()).slice(0, 15).map(k => { const [c, i] = k.split("#"); return { gx: true, code: c, i: +i, ex: BX[c][+i] }; });
    if (!items.length) { toast("Qoida xatolari yoʻq"); return; }
  } else if (mode === "lmis" || mode === "smis") {
    if (mode === "lmis" ? !canSpeak() : !canListen()) { toast(mode === "lmis" ? "Bu brauzerda ovoz yoʻq" : "Bu brauzer nutqni tanimaydi. Chrome yoki Safari'da oching"); return; }
    items = shuffle(lsmList(mode[0])).slice(0, 12).map(lsmItem).filter(Boolean);
    if (!items.length) { toast("Xatolar daftari boʻsh"); return; }
  } else if (mode === "listen" || mode === "dict" || mode === "lsent") {
    if (!canSpeak()) { toast("Bu brauzerda ovoz yoʻq"); return; }
    items = mode === "lsent" ? lsItems(u) : sayItems(u, mode === "dict" ? w => sayable(w) && typeable(w) : sayable, 10);
    if (!items.length) { toast("Tinglash uchun material topilmadi"); return; }
  } else if (mode === "say" || mode === "sayline" || mode === "oral" || mode === "role") {
    if (!canListen()) { toast("Bu brauzer nutqni tanimaydi. Chrome yoki Safari'da oching"); return; }
    items = mode === "say" ? sayItems(u) : mode === "sayline" ? lineItems(u) : mode === "oral" ? oralItems(u) : roleItems(u);
    if (!items.length) { toast("Talaffuz uchun soʻz topilmadi"); return; }
  } else {
    let pool = pickPool(u);
    if (mode === "type") pool = pool.filter(typeable);
    // Least-known words first, with a little randomness
    items = shuffle(shuffle(pool).sort((a, b) => known(a) - known(b)).slice(0, 10));
  }
  SES = { mode, u, items, i: 0, right: 0, xp: 0, answered: false, re: new Set(), last: Date.now(), had: ACH.filter(achDone).map(a => a.id) };
  sessionEl.hidden = false;
  document.body.style.overflow = "hidden";
  $("s-cat").innerHTML = catSVG({ pose: "head" });
  renderStep();
  CatLife.scan();
}
function closeSession() {
  try { speechSynthesis.cancel(); } catch (e) {}
  micStop(true);
  if (SES) { tick(); save(); }
  sessionEl.hidden = true; SES = null;
  document.body.style.overflow = "";
  route();
}
function progressBar() {
  const n = SES.items.length;
  $("s-bar").style.width = (SES.i / n * 100) + "%";
  $("s-count").textContent = Math.min(SES.i + 1, n) + "/" + n;
}
function renderStep() {
  if (SES.i >= SES.items.length) return renderResult();
  SES.answered = false;
  progressBar();
  const w = SES.items[SES.i];
  if (w.gx) { SES.m = "gx"; return renderGx(w); }
  if (w.ls) { SES.m = "ls"; return renderLs(w); }
  const m = itemMode(w);
  SES.m = m;
  if (m === "cards") renderCard(w);
  else if (m === "quiz") renderQuiz(w);
  else if (m === "say" || m === "sayline") renderSay(w);
  else if (m === "oral") renderOral(w);
  else if (m === "role") renderRole(w);
  else if (m === "listen") renderListen(w);
  else if (m === "dict") renderDict(w);
  else renderType(w);
}
// Review sessions mix modes: new words are shown as cards, known ones are tested
function itemMode(w) {
  if (w._m) return w._m;
  if (SES.mode !== "review" && SES.mode !== "mistakes") return SES.mode;
  const st = srs(w);
  if (!st) return "cards";
  return typeable(w) && (st.r >= 2 || (SES.mode === "mistakes" && Math.random() < 0.4)) && Math.random() < 0.5 ? "type" : "quiz";
}
function renderCard(w) {
  SES.sk = ["r"];
  stage.innerHTML = `<div class="flip" id="flip">
    <div class="flip-inner">
      <button class="face" data-act="flip" aria-label="Kartochkani agʻdarish">
        <span class="q-label">Turkcha</span>
        <span class="q-word" lang="tr">${esc(w.tr)}</span>
        <span class="hint-tap">Tarjimani koʻrish uchun bosing</span>
      </button>
      <button class="face back-face" data-act="flip" aria-label="Kartochkani agʻdarish">
        <span class="q-label" style="color:rgba(255,255,255,.85)">Oʻzbekcha</span>
        <span class="q-word">${esc(w.uz)}</span>
        ${w.note ? `<span class="note">${esc(w.note)}</span>` : ""}
      </button>
    </div>
  </div>
  <div style="display:flex;justify-content:center"><button class="btn btn-ghost" data-act="say" data-t="${esc(w.tr)}">${ICON.speak}Tinglash</button></div>`;
  foot.innerHTML = `<button class="btn btn-ghost" data-act="card-again">Yana koʻraman</button><button class="btn btn-grad" data-act="card-know">Bilaman</button>`;
  speak(w.tr);
}
function renderQuiz(w) {
  SES.sk = ["r"];
  const toUz = Math.random() < 0.6;
  const pool = (SES.u === "all" ? ALL : ALL.filter(x => x.unit === w.unit)).filter(x => x.tr !== w.tr && x.uz !== w.uz);
  const wrong = shuffle(pool.length >= 3 ? pool : ALL.filter(x => x.tr !== w.tr)).slice(0, 3);
  const opts = shuffle([w, ...wrong]);
  SES.correct = w;
  stage.innerHTML = `<div class="q-label">${toUz ? "Bu soʻz nimani anglatadi?" : "Turkchasini toping"}</div>
    <div class="q-row"><div class="q-word" ${toUz ? 'lang="tr"' : ""}>${esc(toUz ? w.tr : w.uz)}</div>
    ${toUz ? `<button class="say" data-act="say" data-t="${esc(w.tr)}" aria-label="Tinglash">${ICON.speak}</button>` : ""}</div>
    <div class="options">${opts.map((o, i) => `<button class="opt" data-act="answer" data-ok="${o === w ? 1 : 0}" ${toUz ? "" : 'lang="tr"'}><span class="k">${"ABCD"[i]}</span>${esc(toUz ? o.uz : o.tr)}</button>`).join("")}</div>
    <div class="feedback" id="fb" aria-live="polite"></div>`;
  foot.innerHTML = `<button class="btn btn-grad btn-block" data-act="next" disabled>Keyingi</button>`;
  if (toUz) speak(w.tr);
}
function renderType(w) {
  SES.sk = ["w"];
  stage.innerHTML = `<div class="q-label">Turkchasini yozing</div>
    <div class="q-word">${esc(w.uz)}</div>
    <form class="type-box" id="type-form" autocomplete="off">
      <label for="type-input" class="sr">Javob</label>
      <input class="type-input" id="type-input" lang="tr" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Javobingiz…">
      <div class="keys">${["ç", "ş", "ğ", "ı", "İ", "ö", "ü"].map(k => `<button type="button" data-act="key" data-k="${k}">${k}</button>`).join("")}</div>
    </form>
    <div class="feedback" id="fb" aria-live="polite"></div>`;
  foot.innerHTML = `<button class="btn btn-ghost" data-act="type-skip">Bilmayman</button><button class="btn btn-grad" data-act="type-check">Tekshirish</button>`;
  $("type-form").addEventListener("submit", e => { e.preventDefault(); if (SES.answered) nextStep(); else checkType(); });
  setTimeout(() => { const i = $("type-input"); if (i) i.focus(); }, 60);
}
function checkType(skip) {
  if (SES.answered) return;
  const w = SES.items[SES.i], inp = $("type-input"), v = inp.value, fb = $("fb");
  if (!skip && !v.trim()) { inp.focus(); return; }
  SES.answered = true;
  if (!skip && fold(v) === fold(w.tr)) {
    good(); inp.classList.add("right"); fb.className = "feedback ok"; fb.textContent = "Barakalla! Toʻgʻri.";
  } else if (!skip && plain(v) === plain(w.tr)) {
    good(); inp.classList.add("right"); fb.className = "feedback ok"; fb.innerHTML = `Deyarli! Harflarga eʼtibor bering: <b lang="tr">${esc(w.tr)}</b>`;
  } else {
    bad(); inp.classList.add("wrong"); fb.className = "feedback no"; fb.innerHTML = `Toʻgʻri javob: <b lang="tr">${esc(w.tr)}</b>`;
  }
  const rv = $("ls-reveal"); if (rv) rv.hidden = false;
  speak(w.tr);
  foot.innerHTML = `<button class="btn btn-grad btn-block" data-act="next">Keyingi</button>`;
}
/* ---------- Skills dashboard ---------- */
const SK_HOW = {
  r: "Soʻz testlari, kartochkalar, qoida testlari (variant tanlash), kurs matnlari savollari va daraja testlari",
  l: "Tinglab toping, diktant va dialog gaplarini matnsiz tinglash",
  w: "Soʻz yozish, diktant, qoida mashqlaridagi yozish va gap tuzish, kursdagi tarjima va erkin yozish (avtomatik tekshiruvda 70 ball va undan yuqori — toʻgʻri)",
  s: "Soʻzlar talaffuzi, dialog gaplarini takrorlash, rolli dialog va kurs matnlari savollariga ogʻzaki javob"
};
function skBars(st) {
  const mx = Math.max(1, ...SKILLS.map(s => st[s.id].o));
  return `<div class="sk-bars">${SKILLS.map(s => { const x = st[s.id], a = skAcc(x); return `<div class="sk-line">
    <span class="ico ${s.c}-t">${ICON[s.ico]}</span>
    <span class="sk-name"><b>${s.tr}</b><small>${s.uz}</small></span>
    <span class="sk-track"><i style="width:${Math.round(x.o / mx * 100)}%;background:var(--${s.c})"></i></span>
    <span class="sk-val">${x.o}<small>${a === null ? "—" : a + "%"}</small></span></div>`; }).join("")}</div>`;
}
function skillsHomeCard() {
  const st = skStats(14), done = skToday(), weak = skWeakest(st);
  return `<div class="pcard glass">
    <div class="pcard-head"><b>${ICON.target}4 koʻnikma</b><a class="link" href="#skills">Batafsil</a></div>
    <div class="sk-row">${SKILLS.map(s => { const on = done.includes(s); return `<div class="sk-mini${on ? " on" : ""}"><span class="ico ${s.c}-t">${ICON[s.ico]}</span><small>${s.tr}</small><span class="sk-dot" aria-label="${on ? "Bugun bajarildi" : "Bugun hali yoʻq"}">${on ? ICON.check : ""}</span></div>`; }).join("")}</div>
    <p class="muted">${done.length === 4 ? "Barakalla! Bugun toʻrttala koʻnikmani mashq qildingiz." : `Bugun ${done.length}/4 koʻnikma. Eng koʻp eʼtibor kerak: <b>${weak.uz}</b>.`}</p>
    ${done.length === 4 ? "" : `<button class="btn btn-soft btn-block" data-act="sk-go" data-s="${weak.id}">${ICON[weak.ico]}${weak.tr} · ${weak.uz} mashqi</button>`}
  </div>`;
}
function skillsProfileCard() {
  const st = skStats(14);
  return `<a class="pcard glass" href="#skills" style="color:inherit;text-decoration:none">
    <div class="pcard-head"><b>${ICON.target}4 koʻnikma · 14 kun</b><span>Muvozanat ${skBalance(st)}%</span></div>
    ${skBars(st)}
  </a>`;
}
// Right answers per skill for each of the last 4 weeks (oldest first)
function skWeeksChart() {
  const weeks = [3, 2, 1, 0].map(w => skStats(7, w * 7));
  const mx = Math.max(1, ...weeks.flatMap(st => SKILLS.map(s => st[s.id].o)));
  const W = 320, H = 150, gw = W / 4, bw = 13, base = H - 22;
  const bars = weeks.map((st, wi) => SKILLS.map((s, si) => {
    const v = st[s.id].o, h = Math.round(v / mx * (base - 10)), x = wi * gw + (gw - 4 * bw - 9) / 2 + si * (bw + 3);
    return `<rect x="${x}" y="${base - h}" width="${bw}" height="${Math.max(h, 1.5)}" rx="4" fill="var(--${s.c})"><title>${s.tr}: ${v}</title></rect>`;
  }).join("")).join("");
  const labels = ["3 hafta oldin", "2 hafta oldin", "Oʻtgan hafta", "Shu hafta"].map((l, i) => `<text x="${i * gw + gw / 2}" y="${H - 5}" text-anchor="middle" class="chart-label">${l}</text>`).join("");
  return `<svg viewBox="0 0 ${W} ${H}" class="sk-chart" role="img" aria-label="Soʻnggi 4 hafta: koʻnikmalar boʻyicha toʻgʻri javoblar">${bars}${labels}</svg>
    <div class="sk-legend">${SKILLS.map(s => `<span><i style="background:var(--${s.c})"></i>${s.tr}</span>`).join("")}</div>`;
}
function viewSkills() {
  const st = skStats(14), all = S.sk, bal = skBalance(st), weak = skWeakest(st), any = SKILLS.some(s => all[s.id][1]);
  return `<div><a class="back" href="#profile">${ICON.back}Profil</a></div>
  <div class="lesson-head">
    <div class="tags"><span class="tag violet-t">${ICON.target}Okuma · Dinleme · Yazma · Konuşma</span></div>
    <h1>4 koʻnikma</h1>
    <p class="sub">Tilni toʻliq bilish uchun toʻrttala koʻnikma teng rivojlanishi kerak. Bu yerda soʻnggi 14 kunlik natijalaringiz.</p>
  </div>
  <div class="pcard glass sk-balance">
    ${pctRing(bal / 100)}
    <div><b>Muvozanat</b><p class="muted">${!any ? "Hali maʼlumot yoʻq. Mashq qila boshlang, natijalar shu yerda chiqadi." : bal >= 80 ? "Ajoyib! Koʻnikmalaringiz teng rivojlanmoqda." : `Eng koʻp eʼtibor kerak: <b>${weak.tr} (${weak.uz})</b>. Bugun shundan boshlang.`}</p>
    <button class="btn btn-grad" data-act="sk-go" data-s="${weak.id}">${ICON[weak.ico]}${weak.tr} mashqi</button></div>
  </div>
  ${skLevelsCard()}
  <section class="section"><div class="section-head"><h2>Soʻnggi 14 kun</h2><span class="tag sky-t">toʻgʻri javoblar</span></div>
    <div class="glass pad">${skBars(st)}</div></section>
  <section class="section"><div class="section-head"><h2>Koʻnikmalar</h2></div>
    ${SKILLS.map(s => { const x = st[s.id], t = all[s.id], a = skAcc(x); return `<div class="pcard glass">
      <div class="pcard-head"><b><span class="tag ${s.c}-t" style="padding:6px">${ICON[s.ico]}</span>${s.tr} · ${s.uz}</b><span>${a === null ? "—" : a + "%"}</span></div>
      <div class="facts"><span>${ICON.list}14 kunda: ${x.n} ta mashq, ${x.o} ta toʻgʻri</span><span>${ICON.clock}14 kunda: ${Math.ceil(x.t / 60)} daqiqa</span><span>${ICON.star}Jami: ${t[1]} ta mashq · ${t[1] ? pct(t[0], t[1]) + "% toʻgʻri" : "hali yoʻq"} · ${t[2]} XP</span></div>
      <p class="muted" style="margin-top:6px;padding-right:48px">${esc(SK_HOW[s.id])}</p>
      <button class="plus" data-act="sk-go" data-s="${s.id}" aria-label="${s.tr} mashqi">${ICON.play}</button>
    </div>`; }).join("")}
  </section>
  <div class="chart-card glass"><h3>Soʻnggi 4 hafta</h3><span class="range">toʻgʻri javoblar</span>${skWeeksChart()}</div>
  <div class="tip glass">${ICON.bulb}<div><b>Muvozanat qanday hisoblanadi?</b>Soʻnggi 14 kunda eng kam toʻgʻri javob berilgan koʻnikma eng koʻp toʻgʻri javob berilganiga boʻlinadi. 80% dan yuqori — yaxshi muvozanat. Har kuni toʻrttala koʻnikmadan kamida bitta mashq qiling.</div></div>`;
}
function skGo(id) {
  if (id === "r") { const u = kNext(); KTAB = u.reading ? "read" : "vocab"; go(kHash(u.id)); }
  else if (id === "l") listenSheet();
  else if (id === "w") writeSheet();
  else speakSheet();
}
/* ---------- Listening (Dinleme) ----------
   Three exercises built on the browser's text-to-speech: hear a word and pick its meaning, dictation,
   and course dialog lines played without text (pick the sentence you heard, or type the missing word). */
const canSpeak = () => "speechSynthesis" in window;
const hasTrVoice = () => !voices.length || voices.some(v => (v.lang || "").toLowerCase().startsWith("tr"));
function listenNotice() {
  return hasTrVoice() ? "" : `<div class="notice"><div>Qurilmangizda turkcha ovoz topilmadi, talaffuz notoʻgʻri boʻlishi mumkin. Telefon sozlamalarida «Matnni nutqqa aylantirish» boʻlimidan turk tilini yuklab oling.</div></div>`;
}
function playBtns(t) {
  return `<div class="mic-wrap"><button class="mic-btn play-btn" data-act="ls-play" data-t="${esc(t)}" aria-label="Yana tinglash">${ICON.speak}</button>
    <button class="link" data-act="ls-play" data-t="${esc(t)}" data-slow="1">Sekinroq tinglash</button></div>`;
}
/* ---------- Listening and speaking mistakes notebook ----------
   A missed listening or speaking item is saved in S.lsm by a small text key and comes back in
   "lmis" / "smis" sessions. Two correct answers (anywhere) take it out of the notebook. */
const LSM_MAX = 60;
const LSM_CLEAN = /[.,!?;:«»"…—]/g;
function lsmKey(it, m) {
  if (!it) return null;
  if (it.ls === "pick") return "lp|" + it.t;
  if (it.ls === "cloze") return "lc|" + it.t + "|" + it.word;
  if (it.oral) return "so|" + it.unit + "|" + it.q;
  if (it.line || it.role) return "sl|" + it.tr;
  if (m === "listen") return "lw|" + it.tr;
  if (m === "dict") return "ld|" + it.tr;
  if (m === "say") return "sw|" + it.tr;
  return null;
}
function lsmMiss(it, m) {
  const k = lsmKey(it, m);
  if (!k) return;
  S.lsm = S.lsm || {};
  S.lsm[k] = { n: 2, d: dayNum() };
  const keys = Object.keys(S.lsm);
  if (keys.length > LSM_MAX) keys.sort((a, b) => S.lsm[a].d - S.lsm[b].d).slice(0, keys.length - LSM_MAX).forEach(x => delete S.lsm[x]);
}
function lsmHit(it, m) {
  const k = lsmKey(it, m);
  if (!k || !S.lsm || !S.lsm[k]) return;
  if (--S.lsm[k].n <= 0) delete S.lsm[k];
}
const lsmList = kind => Object.keys(S.lsm || {}).filter(k => k[0] === kind);
// Rebuilds a practice item from its notebook key
function lsmItem(k) {
  const [t, a, b] = k.split("|");
  if (t === "lw" || t === "ld" || t === "sw") {
    const w = ALL.find(x => x.tr === a);
    return w ? Object.assign({}, w, { _m: { lw: "listen", ld: "dict", sw: "say" }[t] }) : null;
  }
  if (t === "lp") {
    const near = lsLines("auto").filter(x => x.t !== a).sort((x, y) => Math.abs(x.t.length - a.length) - Math.abs(y.t.length - a.length)).slice(0, 6);
    return near.length < 2 ? null : { ls: "pick", t: a, opts: shuffle([a, ...shuffle(near).slice(0, 2).map(x => x.t)]) };
  }
  if (t === "lc") {
    let done = false;
    const shown = a.split(" ").map(w => { if (!done && w.replace(LSM_CLEAN, "") === b) { done = true; return w.replace(b, "___"); } return w; }).join(" ");
    return done ? { ls: "cloze", t: a, word: b, shown } : null;
  }
  if (t === "sl") return { tr: a, uz: "Xatolar daftaridan", line: true, _m: "sayline" };
  if (t === "so") {
    const un = KU[a], r = un && un.reading, i = r ? r.qs.indexOf(b) : -1;
    if (i < 0 || !r.ans[String(i + 1)]) return null;
    return { oral: true, tr: cleanLine(r.ans[String(i + 1)]), q: b, unit: a, rtitle: r.title, rtext: r.text, _m: "oral" };
  }
  return null;
}
function lsmCard() {
  const l = lsmList("l").length, s = lsmList("s").length;
  if (!l && !s) return "";
  return `<div class="pcard glass">
    <div class="pcard-head"><b>${ICON.target}Tinglash va gapirish xatolari</b><span class="badge">${l + s}</span></div>
    <div class="facts"><span>${ICON.ear}Tinglash: ${l} ta</span><span>${ICON.mic}Gapirish: ${s} ta</span><span>${ICON.quiz}Ikki marta toʻgʻri boʻlsa, daftardan chiqadi</span></div>
    <div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap">
      ${l ? `<button class="btn btn-soft" style="flex:1" data-act="start" data-mode="lmis" data-u="lmis">${ICON.ear}Tinglash</button>` : ""}
      ${s && canListen() ? `<button class="btn btn-soft" style="flex:1" data-act="start" data-mode="smis" data-u="smis">${ICON.mic}Gapirish</button>` : ""}
    </div>
  </div>`;
}
const lsmSheetRow = kind => {
  const n = lsmList(kind).length;
  return n ? `<button class="mode glass" data-act="start" data-mode="${kind}mis" data-u="${kind}mis"><span class="ico pink-t">${ICON.target}</span><span><b>Xatolarni takrorlash</b><span>Daftarda ${n} ta ${kind === "l" ? "tinglash" : "gapirish"} xatosi</span></span>${ICON.chev}</button>` : "";
};
function listenSheet() {
  if (!canSpeak()) { toast("Bu brauzerda ovoz yoʻq"); return; }
  openSheet(`<h3>Tinglash mashqi</h3>
    ${lsmSheetRow("l")}
    <button class="mode glass" data-act="start" data-mode="listen" data-u="pron"><span class="ico violet-t">${ICON.ear}</span><span><b>Tinglab toping</b><span>Soʻzni eshitasiz, maʼnosini tanlaysiz</span></span>${ICON.chev}</button>
    <button class="mode glass" data-act="start" data-mode="dict" data-u="pron"><span class="ico pink-t">${ICON.type}</span><span><b>Diktant</b><span>Eshitganingizni turkcha yozasiz</span></span>${ICON.chev}</button>
    <button class="mode glass" data-act="start" data-mode="lsent" data-u="auto"><span class="ico sky-t">${ICON.chat}</span><span><b>Gaplarni tinglash</b><span>Kurs dialoglaridan gaplar, matnsiz</span></span>${ICON.chev}</button>`);
}
function writeSheet() {
  openSheet(`<h3>Yozish mashqi</h3>
    <button class="mode glass" data-act="start" data-mode="type" data-u="all"><span class="ico pink-t">${ICON.type}</span><span><b>Soʻz yozish</b><span>Oʻzbekchasini koʻrib, turkcha yozasiz</span></span>${ICON.chev}</button>
    <button class="mode glass" data-act="start" data-mode="dict" data-u="pron"><span class="ico violet-t">${ICON.ear}</span><span><b>Diktant</b><span>Eshitganingizni yozasiz</span></span>${ICON.chev}</button>
    <a class="mode glass" href="#write" data-act="sheet-close-link"><span class="ico green-t">${ICON.book}</span><span><b>Erkin yozish</b><span>Kurs mavzulari boʻyicha matn, avtomatik tekshiruv</span></span>${ICON.chev}</a>`);
}
function renderListen(w) {
  SES.sk = ["l"]; SES.correct = w;
  const pool = (SES.u === "all" || SES.u === "pron" ? ALL : ALL.filter(x => x.unit === w.unit)).filter(x => x.tr !== w.tr && x.uz !== w.uz);
  const opts = shuffle([w, ...shuffle(pool.length >= 3 ? pool : ALL.filter(x => x.tr !== w.tr)).slice(0, 3)]);
  stage.innerHTML = `${listenNotice()}<div class="q-label">Tinglang va maʼnosini toping</div>
    ${playBtns(w.tr)}
    <div class="ls-reveal" id="ls-reveal" hidden><b lang="tr">${esc(w.tr)}</b> — ${esc(w.uz)}</div>
    <div class="options">${opts.map((o, i) => `<button class="opt" data-act="answer" data-ok="${o === w ? 1 : 0}"><span class="k">${"ABCD"[i]}</span>${esc(o.uz)}</button>`).join("")}</div>
    <div class="feedback" id="fb" aria-live="polite"></div>`;
  foot.innerHTML = `<button class="btn btn-grad btn-block" data-act="next" disabled>Keyingi</button>`;
  speak(w.tr);
}
const typeBox = () => `<form class="type-box" id="type-form" autocomplete="off">
    <label for="type-input" class="sr">Javob</label>
    <input class="type-input" id="type-input" lang="tr" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Eshitganingizni yozing…">
    <div class="keys">${["ç", "ş", "ğ", "ı", "İ", "ö", "ü"].map(k => `<button type="button" data-act="key" data-k="${k}">${k}</button>`).join("")}</div>
  </form>`;
function renderDict(w) {
  SES.sk = ["l", "w"];
  stage.innerHTML = `${listenNotice()}<div class="q-label">Diktant: eshitganingizni turkcha yozing</div>
    ${playBtns(w.tr)}
    ${typeBox()}
    <div class="ls-reveal" id="ls-reveal" hidden><b lang="tr">${esc(w.tr)}</b> — ${esc(w.uz)}</div>
    <div class="feedback" id="fb" aria-live="polite"></div>`;
  foot.innerHTML = `<button class="btn btn-ghost" data-act="type-skip">Bilmayman</button><button class="btn btn-grad" data-act="type-check">Tekshirish</button>`;
  $("type-form").addEventListener("submit", e => { e.preventDefault(); if (SES.answered) nextStep(); else checkType(); });
  speak(w.tr);
}
// Dialog lines from the course: one unit, or ("auto") every unit up to the learner's current one
function lsLines(u) {
  let units;
  if (KU[u]) units = [KU[u]];
  else { const cur = COURSE.units.indexOf(kNext()); units = COURSE.units.slice(0, Math.max(cur + 1, 4)); }
  const lines = [];
  units.forEach(un => un.sections.filter(s => s.kind === "dialog").forEach(s => s.blocks.forEach(b => (b.dlg || []).forEach(([, t]) => {
    const clean = t.replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim(), n = clean.split(" ").length;
    if (n >= 3 && n <= 14 && !lines.some(x => x.t === clean)) lines.push({ t: clean, unit: un.id });
  }))));
  return lines;
}
function lsItems(u) {
  const lines = shuffle(lsLines(u)), items = [];
  lines.forEach(ln => {
    if (items.length >= 8) return;
    if (items.length % 2 === 0) {
      const near = lines.filter(x => x.t !== ln.t).sort((a, b) => Math.abs(a.t.length - ln.t.length) - Math.abs(b.t.length - ln.t.length)).slice(0, 6);
      if (near.length < 2) return;
      items.push({ ls: "pick", t: ln.t, opts: shuffle([ln.t, ...shuffle(near).slice(0, 2).map(x => x.t)]) });
    } else {
      const words = ln.t.split(" ");
      const cand = words.map((w, k) => [w.replace(/[.,!?;:«»"…—]/g, ""), k]).filter(([w]) => w.replace(/'.*/, "").length >= 4 && !/\d/.test(w));
      if (!cand.length) return;
      const [word, k] = cand[Math.floor(Math.random() * cand.length)];
      items.push({ ls: "cloze", t: ln.t, word, shown: words.map((w, j) => j === k ? w.replace(word, "___") : w).join(" ") });
    }
  });
  return items;
}
function renderLs(it) {
  if (it.ls === "pick") {
    SES.sk = ["l"];
    stage.innerHTML = `${listenNotice()}<div class="q-label">Qaysi gapni eshitdingiz?</div>
      ${playBtns(it.t)}
      <div class="options">${it.opts.map((o, i) => `<button class="opt" lang="tr" data-act="ls-ans" data-o="${i}"><span class="k">${"ABC"[i]}</span>${esc(o)}</button>`).join("")}</div>
      <div class="feedback" id="fb" aria-live="polite"></div>`;
    foot.innerHTML = `<button class="btn btn-grad btn-block" data-act="next" disabled>Keyingi</button>`;
  } else {
    SES.sk = ["l", "w"];
    stage.innerHTML = `${listenNotice()}<div class="q-label">Tinglang va tushib qolgan soʻzni yozing</div>
      ${playBtns(it.t)}
      <div class="q-sent" lang="tr">${blankHtml(it.shown)}</div>
      ${typeBox()}
      <div class="feedback" id="fb" aria-live="polite"></div>`;
    foot.innerHTML = `<button class="btn btn-ghost" data-act="ls-skip">Bilmayman</button><button class="btn btn-grad" data-act="ls-check">Tekshirish</button>`;
    $("type-form").addEventListener("submit", e => { e.preventDefault(); if (SES.answered) nextStep(); else lsCheck(); });
  }
  speak(it.t);
}
function lsFinish(ok, html) {
  SES.answered = true;
  tick();
  const it = SES.items[SES.i], fb = $("fb");
  if (ok) lsmHit(it); else lsmMiss(it);
  if (ok) { SES.right++; SES.xp += 10; skillLog(SES.sk, true, 10); addXP(10); CatLife.mood(sCat(), "happy", 1000); }
  else {
    skillLog(SES.sk, false); save(); CatLife.mood(sCat(), "sad", 1600);
    if (!SES.re.has(it.t) && SES.items.length < 40) { SES.re.add(it.t); SES.items.push(it); }
  }
  fb.className = "feedback " + (ok ? "ok" : "no"); fb.innerHTML = html;
  foot.innerHTML = `<button class="btn btn-ghost" data-act="ls-play" data-t="${esc(it.t)}">${ICON.speak}Tinglash</button><button class="btn btn-grad" data-act="next">Keyingi</button>`;
}
function lsPick(o, btn) {
  if (SES.answered) return;
  const it = SES.items[SES.i], ok = it.opts[o] === it.t;
  document.querySelectorAll("[data-act=ls-ans]").forEach(x => { if (it.opts[+x.dataset.o] === it.t) x.classList.add("right"); });
  if (!ok) btn.classList.add("wrong");
  lsFinish(ok, ok ? "Doğru! Toʻgʻri eshitdingiz." : `Eshitilgan gap: <b lang="tr">${esc(it.t)}</b>`);
}
function lsCheck(skip) {
  if (SES.answered) return;
  const it = SES.items[SES.i], inp = $("type-input"), v = inp.value;
  if (!skip && !v.trim()) { inp.focus(); return; }
  const exact = !skip && gxNorm(v) === gxNorm(it.word), near = !skip && !exact && gxPlain(v) === gxPlain(it.word);
  inp.classList.add(exact || near ? "right" : "wrong");
  lsFinish(exact || near, `${exact ? "Barakalla! Toʻgʻri." : near ? `Deyarli! Toʻgʻri yozilishi: <b lang="tr">${esc(it.word)}</b>` : `Tushib qolgan soʻz: <b lang="tr">${esc(it.word)}</b>`}<div class="sub" lang="tr" style="margin-top:4px">${esc(it.t)}</div>`);
}
/* ---------- Speaking (Konuşma): sentences, role play, oral answers ----------
   All three reuse the pronunciation machinery (micToggle → sayCheck → sayFinish). */
const cleanLine = t => t.replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").replace(/\s+([.,!?;:])/g, "$1").trim();
const kUnitsUpTo = () => { const cur = COURSE.units.indexOf(kNext()); return COURSE.units.slice(0, Math.max(cur + 1, 4)); };
// The current course unit if it has a dialog, otherwise the nearest earlier one
function roleUnit() {
  const cur = COURSE.units.indexOf(kNext());
  for (let i = cur; i >= 0; i--) if (COURSE.units[i].sections.some(s => s.kind === "dialog")) return COURSE.units[i];
  return COURSE.units.find(u => u.sections.some(s => s.kind === "dialog"));
}
function roleButtons(u) {
  const out = [];
  u.sections.forEach((s, si) => {
    if (s.kind !== "dialog") return;
    const lines = s.blocks.flatMap(b => b.dlg || []), who = [...new Set(lines.map(l => l[0]))];
    who.forEach(w => {
      const n = lines.filter(l => l[0] === w).length;
      out.push(`<button class="mode glass" data-act="start" data-mode="role" data-u="${esc(u.id + "|" + si + "|" + w)}"><span class="ico orange-t">${ICON.chat}</span><span><b>${esc(w)} rolida</b><span lang="tr">${esc(s.title.replace(/^Dialog:\s*/, ""))} · ${n} ta gap</span></span>${ICON.chev}</button>`);
    });
  });
  return out.join("");
}
function speakSheet() {
  if (!canListen()) { toast("Bu brauzer nutqni tanimaydi. Chrome yoki Safari'da oching"); return; }
  const ru = roleUnit();
  openSheet(`<h3>Gapirish mashqi</h3>
    ${lsmSheetRow("s")}
    <button class="mode glass" data-act="start" data-mode="say" data-u="pron"><span class="ico green-t">${ICON.mic}</span><span><b>Soʻzlar talaffuzi</b><span>Soʻzni ovoz chiqarib ayting</span></span>${ICON.chev}</button>
    <button class="mode glass" data-act="start" data-mode="sayline" data-u="auto"><span class="ico sky-t">${ICON.speak}</span><span><b>Gaplarni takrorlash</b><span>Dialog gapini tinglab, oʻzingiz ayting</span></span>${ICON.chev}</button>
    <button class="mode glass" data-act="start" data-mode="oral" data-u="auto"><span class="ico violet-t">${ICON.quiz}</span><span><b>Savollarga ogʻzaki javob</b><span>Kurs matnlari boʻyicha, ovoz bilan</span></span>${ICON.chev}</button>
    ${ru ? `<div class="sheet-sub">Rolli dialog · ${esc(ru.level)}.${ru.n} <span lang="tr">${esc(ru.title)}</span></div>${roleButtons(ru)}` : ""}`);
}
function lineItems(u) {
  return shuffle(lsLines(u)).slice(0, 8).map(l => ({ tr: l.t, uz: `Kurs dialogidan · ${KU[l.unit].level}.${KU[l.unit].n}`, unit: l.unit, line: true }));
}
function oralItems(u) {
  const units = KU[u] ? [KU[u]] : kUnitsUpTo(), items = [];
  units.forEach(un => {
    const r = un.reading;
    if (!r || !r.ans) return;
    Object.keys(r.ans).forEach(k => {
      const a = cleanLine(r.ans[k]);
      if (/^[DY]$/.test(a) || a.split(" ").length < 2 || /[…\/]/.test(a) || !r.qs[+k - 1]) return;
      items.push({ oral: true, tr: a, q: r.qs[+k - 1], unit: un.id, rtitle: r.title, rtext: r.text });
    });
  });
  return shuffle(items).slice(0, 6);
}
function roleItems(spec) {
  const [uid, si, who] = String(spec).split("|"), un = KU[uid], sec = un && un.sections[+si];
  if (!sec) return [];
  const items = [];
  let before = [];
  sec.blocks.flatMap(b => b.dlg || []).forEach(([w, t]) => {
    const c = cleanLine(t);
    if (!c) return;
    if (w === who) { items.push({ role: true, tr: c, who, before, unit: uid, title: sec.title.replace(/^Dialog:\s*/, "") }); before = []; }
    else before.push([w, c]);
  });
  if (items.length && before.length) items[items.length - 1].after = before;
  return items;
}
// Oral answers: how many content words of the model answer were said (suffixes may differ)
const ORAL_STOP = new Set(["ve", "bir", "bu", "şu", "da", "de", "mi", "mı", "mu", "mü", "ile", "için", "çok", "ama", "evet", "hayır", "var", "yok", "değil"]);
function oralScore(sample, heard) {
  const kw = [...new Set(sayNorm(sample).out.split(" ").filter(x => x.length >= 3 && !ORAL_STOP.has(x)))];
  const hw = heardNorm(heard).split(" ").filter(Boolean);
  const stem = k => k.slice(0, Math.max(4, k.length - 3));
  const hit = kw.map(k => hw.some(h => h === k || (k.length >= 4 && h.length >= 4 && h.startsWith(stem(k)))));
  return { kw, hit, score: kw.length ? hit.filter(Boolean).length / kw.length : 0 };
}
function oralMarked(sample, r) {
  return esc(sample).replace(/[A-Za-zÇĞİÖŞÜçğıöşüÂâÎîÛû]+/g, word => {
    const k = sayNorm(word).out, i = r.kw.indexOf(k);
    return i < 0 ? word : `<span class="${r.hit[i] ? "kw-ok" : "miss"}">${word}</span>`;
  });
}
function renderOral(it) {
  SES.sk = ["s", "r"]; SES.tries = 0;
  const un = KU[it.unit];
  stage.innerHTML = `<div class="tags"><span class="tag sky-t">${esc(un.level)}.${un.n}</span><span class="tag violet-t" lang="tr">${esc(it.rtitle || "")}</span></div>
    <div class="q-label">Savolga ovoz chiqarib, toʻliq gap bilan javob bering</div>
    <div class="q-row"><div class="q-sent" lang="tr">${esc(it.q)}</div><button class="say" data-act="say" data-t="${esc(it.q.replace(/\([^)]*\)/g, ""))}" aria-label="Savolni tinglash">${ICON.speak}</button></div>
    ${it.rtext ? `<details class="glass pad"><summary><b>Matnni koʻrish</b></summary><p class="k-p" lang="tr" style="margin-top:8px">${esc(it.rtext)}</p></details>` : ""}
    <div class="mic-wrap">
      <button class="mic-btn" id="mic-btn" data-act="mic" aria-label="Mikrofon: gapirishni boshlash">${ICON.mic}</button>
      <div class="mic-hint" id="mic-hint">Mikrofonni bosib, javobingizni ayting</div>
      <div class="heard" id="heard" lang="tr" aria-live="polite"></div>
    </div>
    <div class="ls-reveal" id="oral-sample" hidden></div>
    <div class="feedback" id="fb" aria-live="polite"></div>`;
  foot.innerHTML = `<button class="btn btn-ghost btn-block" data-act="say-skip">Hozir gapira olmayman</button>`;
}
function roleBubble(who, t, me) {
  return `<div class="bubble ${me ? "r" : "l"}"><small>${esc(who)}${me ? " (siz)" : ""}</small><span lang="tr">${esc(t)}</span></div>`;
}
function renderRole(it) {
  SES.sk = ["s"]; SES.tries = 0;
  const hist = SES.items.slice(0, SES.i).flatMap(x => [...x.before.map(([w, t]) => roleBubble(w, t)), roleBubble(x.who, x.tr, true)]);
  stage.innerHTML = `<div class="tags"><span class="tag orange-t">${ICON.chat}Rolli dialog</span><span class="tag violet-t" lang="tr">${esc(it.title)}</span></div>
    <div class="dlg role-chat" id="role-chat">${hist.join("")}${it.before.map(([w, t]) => roleBubble(w, t)).join("")}
      <div class="bubble r me"><small>Sizning navbatingiz · ${esc(it.who)}</small><span class="say-target" id="say-target" lang="tr">${esc(it.tr)}</span></div>
    </div>
    <div class="mic-wrap">
      <button class="mic-btn" id="mic-btn" data-act="mic" aria-label="Mikrofon: gapirishni boshlash">${ICON.mic}</button>
      <div class="mic-hint" id="mic-hint">${it.before.length ? "Sherigingizni tinglang, keyin oʻz gapingizni ayting" : "Dialogni siz boshlaysiz: gapingizni ayting"}</div>
      <div class="heard" id="heard" lang="tr" aria-live="polite"></div>
    </div>
    <div class="feedback" id="fb" aria-live="polite"></div>`;
  foot.innerHTML = `<button class="btn btn-ghost" data-act="say" data-t="${esc(it.tr)}">${ICON.speak}Namuna</button><button class="btn btn-ghost" data-act="say-skip">Oʻtkazib yuborish</button>`;
  const chat = $("role-chat"); chat.scrollTop = chat.scrollHeight;
  if (it.before.length) speakSeq(it.before.map(x => x[1]));
}
// After the learner's last line, show and play what the partner says to close the dialog
function roleAfter(it) {
  if (!it.role || !it.after || !it.after.length) return;
  const chat = $("role-chat"); if (!chat) return;
  chat.insertAdjacentHTML("beforeend", it.after.map(([w, t]) => roleBubble(w, t)).join(""));
  chat.scrollTop = chat.scrollHeight;
  setTimeout(() => speakSeq(it.after.map(x => x[1])), 900);
}
/* ---------- Writing check (Yazma) ----------
   Free writing tasks in the course get an automatic, rule-based review: length, the unit's target grammar,
   connectors, Turkish letters / spelling against our own corpus, punctuation and repetition. No AI, no server. */
const WT = {
  "a1-2": [["Oʻzingiz haqingizda: adım, -(y)Im", /\badım\b|\S(yım|yim|yum|yüm|ım|im|um|üm)\b/], ["Qayerliksiz: -lI", /\S(lı|li|lu|lü)(yım|yim|yum|yüm)?\b/], ["Yosh: … yaşındayım", /yaşında/]],
  "a1-3": [["var / yok", /\b(var|yok)\b/], ["Oʻrin kelishigi -DA", /\S(da|de|ta|te)\b/], ["Joy soʻzlari: üstünde, yanında…", /(üst|alt|iç|ön|arka|yan|karşı)(ı|i|ü|u|sı|sın)?n?(da|de)\b/]],
  "a1-5": [["Hozirgi zamon -(I)yor", /\S(ıyor|iyor|uyor|üyor)/], ["Soat: saat … -DA", /\bsaat\b/], ["Tartib: önce, sonra", /\b(önce|sonra|ardından)\b/]],
  "a1-6": [["Egalik: annem, babam…", /\b(annem|babam|kardeşim|ablam|abim|ailem|eşim|dedem|ninem)\b/], ["… var", /\bvar\b/], ["Kasb yoki yosh", /(yaşında|öğretmen|doktor|mühendis|öğrenci|çalışıyor)/]],
  "a1-8": [["Oʻtgan zamon -DI", /\S(dı|di|du|dü|tı|ti|tu|tü)(m|n|k|nız|niz|nuz|nüz|lar|ler)?\b/], ["Vaqt: geçen hafta sonu, cumartesi…", /(cumartesi|pazar|hafta sonu|dün|geçen)/], ["Bogʻlash: sonra, ve", /\b(sonra|ve|ama)\b/]],
  "a2-1": [["Kelasi zamon -(y)AcAk", /\S(acak|ecek|acağ|eceğ)/], ["Vaqt: yarın, gelecek…", /\b(yarın|gelecek|sonra|yazın|tatilde)\b/], ["Istak: -mAk istiyorum", /(mak|mek) ist/]],
  "a2-2": [["Geniş zaman: -(A/I)rIm", /\S{2,}(arım|erim|ırım|irim|urum|ürüm|mam|mem)\b/], ["Takroriylik: her gün, genellikle, bazen…", /(her gün|genellikle|bazen|sık sık|hiç|asla|her zaman|her sabah|her akşam)/]],
  "a2-3": [["Yoʻnalish: sağa, sola, düz", /\b(sağa|sola|düz|dön)/], ["-(y)ArAk / -(y)Ip", /\S{2,}(arak|erek|ıp|ip|up|üp)\b/], ["Joy: yanında, karşısında…", /(yanında|karşısında|önünde|arkasında|köşe)/]],
  "a2-5": [["Qiyos: daha", /\bdaha\b/], ["Orttirma: en", /\ben\b/], ["Tenglik / oʻxshatish: kadar, gibi", /\b(kadar|gibi)\b/]],
  "a2-6": [["-(I)yordu", /(ıyor|iyor|uyor|üyor)(du|dum|dun|duk|lardı)/], ["Oʻtgan zamon -DI", /\S(dı|di|du|dü|tı|ti|tu|tü)(m|k|n)?\b/], ["Eshitilgan -mIş", /\S(mış|miş|muş|müş)/]],
  "a2-8": [["Tartib: önce, sonra", /\b(önce|sonra)\b/], ["-(y)ken", /(?:^|[^a-zçğıöşü])(?!erken)[a-zçğıöşü]+ken(?![a-zçğıöşü])/], ["-DIktAn sonra", /(dıktan|dikten|duktan|dükten|tıktan|tikten|tuktan|tükten) sonra/], ["-mAdAn önce", /(madan|meden) önce/]],
  "b1-1": [["Sifatdosh -(y)An", /\b\S{2,}[^ıiuüaeoö\s'](an|en)\s+[a-zçğıöşü]/], ["Sifatdosh -DIK + egalik", /(dığ|diğ|duğ|düğ|tığ|tiğ|tuğ|tüğ)(ı|i|u|ü)|(dık|dik|duk|dük|tık|tik|tuk|tük)(ları|leri)/]],
  "b1-2": [["Sabab: -DIğI için", /(dığı|diği|duğu|düğü|tığı|tiği|tuğu|tüğü|dığım|diğim|duğum|düğüm|dığın|diğin|duğun|düğün|tığım|tiğim|tığın|tiğin)\S* için/], ["yüzünden / sayesinde / nedeniyle", /(yüzünden|sayesinde|nedeniyle|dolayı)/], ["Natija: bu yüzden, bu nedenle", /(bu yüzden|bu nedenle|bu sebeple|dolayısıyla|çünkü)/]],
  "b1-3": [["Real shart -ArsA", /\S{2,}(arsa|erse|ırsa|irse|ursa|ürse)/], ["Buyruq yoki -mAlI", /\S(malı|meli|malıyız|meliyiz)|\S(ın|in|un|ün|yın|yin|yun|yün)\.?$/m], ["varsa / yoksa", /\b(varsa|yoksa)\b/]],
  "b1-4": [["Majhul nisbat", /\S{2,}(ıl|il|ul|ül|ın|in|un|ün|n)(ır|ir|ur|ür|maz|mez|malı|meli|malıdır|melidir|dı|di|du|dü)\b/], ["Tartib: önce, sonra", /\b(önce|sonra|ardından|en son)/]],
  "b1-5": [["Orttirma nisbat (-DIr, -t)", /\S{2,}(tır|tir|tur|tür|dır|dir|dur|dür|t)(acak|ecek|ıyor|iyor|uyor|üyor|ır|ir|ur|ür|dı|di|tı|ti|tu|tü|alım|elim|sın|sin|ıyorum|iyorum)/], ["Kimga -(y)A … nimani -(y)I", /\S(ya|ye|a|e) \S+(ı|i|u|ü|yı|yi|yu|yü|nı|ni) /]],
  "b1-6": [["-DIğInI / -(y)AcAğInI söyledi", /(dığını|diğini|duğunu|düğünü|tığını|tiğini|tuğunu|tüğünü|acağını|eceğini)/], ["Buyruq: -mAsInI istedi", /(masını|mesini|mamı|memi|manı|meni|mamızı|memizi)/], ["Feʼllar: söyledi, sordu, dedi", /\b(sordu|söyledi|dedi|istedi|anlattı)\b/]],
  "b1-7": [["-(y)IncA", /\S(ınca|ince|unca|ünce)\b/], ["-(y)Ip", /\S{2,}(ıp|ip|up|üp)\b/], ["-DIkçA yoki -(y)ArAk", /\S(dıkça|dikçe|dukça|dükçe|tıkça|tikçe|tukça|tükçe|arak|erek)\b/]],
  "b1-8": [["Fikr: bence, bana göre, düşünüyorum", /(bence|bana göre|düşünüyorum|kanımca|bana kalırsa)/], ["Dalil: ayrıca, örneğin, ancak", /(ayrıca|örneğin|ancak|öte yandan|üstelik|mesela)/], ["Xulosa: sonuç olarak", /(sonuç olarak|kısacası|özetle)/]],
  "b2-1": [["Harakat nomi -mAk / -mA", /\S{2,}(mak|mek|ması|mesi|maya|meye|mayı|meyi)\b/], ["Ehtiyoj: ihtiyaç, gerekli", /(ihtiyaç|gerekli|gerekiyor|lazım)/], ["Qachon: tarih, saat, gün", /(saat|tarih|günü|pazar|cumartesi|ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)/]],
  "b2-2": [["-mIştI", /(mıştı|mişti|muştu|müştü)/], ["-(y)AcAktI", /(acaktı|ecekti)/], ["-ArdI", /\S{2,}(ardı|erdi|ırdı|irdi|urdu|ürdü)/]],
  "b2-3": [["Xayoliy shart -sAydI", /(saydı|seydi)/], ["Natija -ArdI", /\S{2,}(ardı|erdi|ırdı|irdi|urdu|ürdü)/], ["keşke", /keşke/]],
  "b2-4": [["Zidlik: rağmen, hâlde, oysa", /(rağmen|halde|hâlde|oysa|halbuki|hâlbuki|yine de)/], ["Kuchaytirish: sadece … değil, üstelik", /(sadece|üstelik|dahası|aksine)/], ["Xulosa: sonuç olarak", /(sonuç olarak|kısacası|özetle)/]],
  "b2-5": [["Murojaat: … MÜDÜRLÜĞÜNE", /(müdürlüğüne|rektörlüğüne|başkanlığına|sayın)/], ["Rasmiy shakl: -mAktAyIm, -mIştIr", /(maktayım|mekteyim|maktadır|mektedir|mıştır|miştir|muştur|müştür)/], ["Yakun: Gereğini arz ederim", /(arz ederim|rica ederim|saygılarımla)/]],
  "b2-6": [["Maqol", /(damlaya|birlikten|bir elin|acele|ayağını|dost kara|ak akçe|sabreden|ağaç yaş|bugünün işini|söz gümüş|az olsun|görünen köy|bin bilsen|her işte)/], ["Misol: örneğin, mesela", /(örneğin|mesela|bence|bana göre)/], ["Xulosa: sonuç olarak", /(sonuç olarak|kısacası|özetle)/]],
  "b2-7": [["Xabar feʼllari: açıkladı, belirtti…", /(açıkladı|belirtti|vurguladı|kaydetti|ifade etti|bildirdi)/], ["Rasmiy birikma: kapsamında, çerçevesinde", /(kapsamında|çerçevesinde|doğrultusunda|ilişkin|ile ilgili)/], ["Raqam yoki sana", /\d|yüzde/]]
};
// JavaScript's \b does not treat ç, ğ, ı, ö, ş, ü as letters: rewrite it with Turkish-aware boundaries
// (a leading boundary consumes one non-letter, a trailing one only looks ahead; no lookbehind for older Safari)
const WR_L = "a-zçğıöşüâîû";
Object.values(WT).forEach(arr => arr.forEach(g => {
  const src = g[1].source.replace(/\\b(?=[(\\a-zçğıöşü])/g, `(?:^|[^${WR_L}])`).replace(/\\b/g, `(?![${WR_L}])`);
  g[1] = new RegExp(src, g[1].flags);
}));
const WR_CONN = ["ve", "ama", "fakat", "ancak", "çünkü", "ayrıca", "örneğin", "mesela", "bu yüzden", "bu nedenle", "önce", "sonra", "ardından", "sonuç olarak", "kısacası", "üstelik", "ya da", "veya", "hem", "yani", "oysa", "bence", "en sonunda", "öte yandan", "buna rağmen", "yine de"];
const WR_STOP = new Set(["için", "gibi", "kadar", "daha", "sonra", "önce", "çok", "benim", "bizim", "onun", "senin", "olarak", "ama", "ancak", "değil", "şimdi", "bugün"]);
// Writing tasks: course exercises whose title starts with "Yozish"
function wrTasks() {
  const out = [];
  COURSE.units.forEach(u => u.exercises.forEach(e => { if (/^Yozish/.test(e.title) && !e.match && !(e.items || []).some(([k]) => e.ans && e.ans[k])) out.push({ u, e, key: `${e.n}-w` }); }));
  return out;
}
function wrTarget(title) {
  const m = title.match(/(\d+)\s*[–-]\s*(\d+)\s*(gap|soʻz|band|qator)/) || title.match(/(\d+)()\s*(gap|soʻz|band)/);
  if (!m) return { min: 60, max: 180, unit: "soʻz" };
  return { min: +m[1], max: +(m[2] || Math.round(m[1] * 1.25)), unit: m[3] === "soʻz" ? "soʻz" : "gap" };
}
// Every Turkish word form the site itself uses, keyed by its form without Turkish letters
let WR_CORPUS = null;
function wrCorpus() {
  if (WR_CORPUS) return WR_CORPUS;
  const forms = new Set(), byPlain = {};
  const add = t => String(t).toLocaleLowerCase("tr").split(/[^a-zçğıöşüâîû]+/).forEach(w => { if (w.length > 1) forms.add(w); });
  ALL.forEach(w => add(w.tr));
  const walk = o => { if (typeof o === "string") { if (/[çğıöşü]/i.test(o) || !/[ʻʼ]/.test(o)) add(o); } else if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === "object") Object.keys(o).forEach(k => { if (!["uz", "goals", "title", "sub", "note"].includes(k)) walk(o[k]); }); };
  COURSE.units.forEach(u => { walk(u.sections); walk(u.reading); walk(u.exercises); u.vocab.forEach(v => v.words.forEach(([tr]) => add(tr))); });
  Object.values(BX).forEach(arr => arr.forEach(x => { (x.o || []).forEach(add); (x.ans || []).forEach(add); if (x.s) add(x.s); }));
  forms.forEach(f => { if (!/[çğıöşü]/.test(f)) return; const p = plain(f); (byPlain[p] = byPlain[p] || []).push(f); });
  return (WR_CORPUS = { forms, byPlain });
}
function wrCheck(text, task) {
  const t = text.trim(), low = " " + t.toLocaleLowerCase("tr") + " ";
  const words = t.split(/\s+/).filter(w => /[a-zçğıöşüA-ZÇĞİÖŞÜ]/.test(w)), wc = words.length;
  const sents = t.replace(/([.!?…])\s+/g, "$1\n").split(/\n+/).map(x => x.trim()).filter(x => /[a-zçğıöşü]/i.test(x)), sc = sents.length;
  const tgt = wrTarget(task.e.title), have = tgt.unit === "soʻz" ? wc : sc;
  const vol = Math.min(1, have / tgt.min);
  const goals = (WT[task.u.id] || []).map(([label, re]) => ({ label, ok: re.test(low) }));
  const gScore = goals.length ? goals.filter(g => g.ok).length / goals.length : 1;
  const conns = WR_CONN.filter(c => new RegExp(`(^|[^a-zçğıöşü])${c}([^a-zçğıöşü]|$)`).test(low));
  const needC = task.u.level === "A1" ? 2 : task.u.level === "A2" ? 3 : 4;
  const cScore = Math.min(1, conns.length / needC);
  // Spelling: letters that Turkish does not have, and words written without ç, ğ, ı, ö, ş, ü
  const C = wrCorpus(), spell = [];
  words.forEach(raw => {
    const w = raw.toLocaleLowerCase("tr").replace(/^[^a-zçğıöşüâîûqxw]+|[^a-zçğıöşüâîûqxw]+$/g, "").replace(/'.*$/, "");
    if (!w || spell.some(s => s.w === w)) return;
    if (/[qxw]|[ʻʼ]/.test(w)) spell.push({ w, fix: null, why: "turk alifbosida q, x, w harflari yoʻq" });
    else if (!C.forms.has(w) && C.byPlain[w]) spell.push({ w, fix: C.byPlain[w][0], why: "turkcha harflar" });
  });
  const sScore = 1 - Math.min(1, spell.length / Math.max(3, wc / 15));
  // Punctuation: sentences should start with a capital letter and the text should end with . ! or ?
  const lowerStart = sents.filter(x => /^[a-zçğıöşü]/.test(x)).length, noEnd = /[.!?…]$/.test(t) ? 0 : 1;
  const pScore = sc ? 1 - Math.min(1, (lowerStart + noEnd) / sc) : 0;
  const freq = {};
  words.forEach(raw => { const w = raw.toLocaleLowerCase("tr").replace(/[^a-zçğıöşü]/g, ""); if (w.length >= 4 && !WR_STOP.has(w)) freq[w] = (freq[w] || 0) + 1; });
  const reps = Object.entries(freq).filter(([, n]) => n >= Math.max(4, wc / 25)).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const score = Math.round(100 * (0.25 * vol + 0.35 * gScore + 0.15 * cScore + 0.15 * sScore + 0.10 * pScore));
  return { score, wc, sc, tgt, have, goals, conns, needC, spell, lowerStart, noEnd, reps };
}
const WR_RES = {};
function wrResultHtml(r) {
  const row = (ok, title, body) => `<div class="wr-row"><span class="state ${ok ? "done" : "warn"}">${ok ? ICON.check : "!"}</span><div><b>${title}</b><div class="sub">${body}</div></div></div>`;
  const verdict = r.score >= 85 ? "Ajoyib yozilgan!" : r.score >= 70 ? "Yaxshi! Kichik kamchiliklar bor." : r.score >= 50 ? "Yomon emas, lekin toʻldirish kerak." : "Hali qisqa yoki talablarga mos emas.";
  return `<div class="wr-head">${pctRing(r.score / 100)}<div><b>${verdict}</b><div class="sub">${r.wc} ta soʻz · ${r.sc} ta gap</div></div></div>
    ${row(r.have >= r.tgt.min, "Hajm", `${r.have} ${r.tgt.unit} (talab: ${r.tgt.min}–${r.tgt.max} ${r.tgt.unit})${r.have > r.tgt.max * 1.5 ? " — juda uzun, qisqartiring" : ""}`)}
    ${r.goals.length ? row(r.goals.every(g => g.ok), "Mavzu grammatikasi", r.goals.map(g => `${g.ok ? "✔" : "✘"} ${esc(g.label)}`).join("<br>")) : ""}
    ${row(r.conns.length >= r.needC, "Bogʻlovchilar", r.conns.length ? `Ishlatilgan: <span lang="tr">${r.conns.map(esc).join(", ")}</span>${r.conns.length < r.needC ? `. Yana qoʻshing: ayrıca, örneğin, bu yüzden, sonuç olarak…` : ""}` : "Gaplarni bogʻlang: ve, ama, çünkü, sonra, bu yüzden…")}
    ${row(!r.spell.length, "Imlo va turkcha harflar", r.spell.length ? r.spell.slice(0, 8).map(s => s.fix ? `<span lang="tr">${esc(s.w)} → <b>${esc(s.fix)}</b></span>` : `<span lang="tr">${esc(s.w)}</span> — ${esc(s.why)}`).join("<br>") : "Xato topilmadi")}
    ${row(!r.lowerStart && !r.noEnd, "Tinish belgilari", !r.lowerStart && !r.noEnd ? "Gaplar katta harf bilan boshlanib, nuqta bilan tugagan" : [r.lowerStart ? `${r.lowerStart} ta gap kichik harf bilan boshlangan` : "", r.noEnd ? "matn oxirida nuqta yoʻq" : ""].filter(Boolean).join(", "))}
    ${r.reps.length ? row(false, "Takrorlar", r.reps.map(([w, n]) => `<span lang="tr">«${esc(w)}»</span> ${n} marta`).join(", ") + " — boshqa soʻz bilan almashtirib koʻring") : ""}
    <p class="muted" style="font-size:13px">Avtomatik tekshiruv taxminiy: u grammatika va shaklni koʻradi, mazmunni emas. Imkoni boʻlsa, matnni turkcha biladigan odamga ham koʻrsating.</p>`;
}
function wrRun(id, key) {
  const u = KU[id], e = u.exercises.find(x => `${x.n}-w` === key), st = kState(id), text = st.v[key] || "";
  if (text.trim().split(/\s+/).length < 5) { toast("Avval kamida bir necha gap yozing"); return; }
  const r = wrCheck(text, { u, e });
  WR_RES[id + "|" + key] = r;
  st.wb = st.wb || {}; st.wl = st.wl || {};
  // Count each different text once; XP the first time the task reaches 70
  if (st.wl[key] !== text.length + ":" + r.score) {
    st.wl[key] = text.length + ":" + r.score;
    const first = r.score >= 70 && !(st.wb[key] >= 70);
    skillLog("w", r.score >= 70, first ? 15 : 0);
    if (first) addXP(15); else save();
  }
  st.wb[key] = Math.max(st.wb[key] || 0, r.score);
  const box = $(`wr-${id}-${key}`);
  if (box) { box.hidden = false; box.innerHTML = wrResultHtml(r); }
  pamukSay(r.score >= 70 ? "happy" : "sad", r.score >= 70 ? `${r.score} ball — barakalla!` : `${r.score} ball. Tavsiyalarni koʻrib, matnni toʻldiring.`);
}
function viewWrite() {
  const tasks = wrTasks(), cur = COURSE.units.indexOf(kNext());
  const lv = ["A1", "A2", "B1", "B2"];
  return `${topbar()}
  <div><a class="back" href="#practice">${ICON.back}Mashq</a></div>
  <div class="lesson-head">
    <div class="tags"><span class="tag pink-t">${ICON.type}Yazma</span><span class="tag green-t">${tasks.filter(t => ((S.k[t.u.id] || {}).wb || {})[t.key] >= 70).length}/${tasks.length} bajarilgan</span></div>
    <h1>Erkin yozish</h1>
    <p class="sub">Har bir kurs boʻlimidagi yozish topshirigʻi. Yozganingizni sayt avtomatik tekshiradi: hajm, mavzu grammatikasi, bogʻlovchilar, imlo va tinish belgilari.</p>
  </div>
  ${lv.map(l => { const ts = tasks.filter(t => t.u.level === l); return ts.length ? `<div class="toc-group" style="padding-left:2px">${l}</div><div class="list">${ts.map(t => {
    const best = ((S.k[t.u.id] || {}).wb || {})[t.key], locked = COURSE.units.indexOf(t.u) > cur + 1;
    return `<a class="unit glass" href="#${kHash(t.u.id)}" data-act="wr-open" data-id="${t.u.id}">
      <span class="art ${best >= 70 ? "green" : "pink"}"><span style="font-size:14px">${t.u.level}.${t.u.n}</span></span>
      <span class="unit-body"><span class="unit-title">${esc(t.e.title.replace(/^Yozish\.?\s*/, ""))}</span><span class="unit-sub">${best !== undefined ? `Eng yaxshi natija: ${best} ball` : locked ? "Kursda hali bu boʻlimga yetmagansiz" : "Hali yozilmagan"}</span></span>
      ${best !== undefined ? pctRing(best / 100) : ICON.chev}</a>`; }).join("")}</div>` : ""; }).join("")}`;
}
/* ---------- Level tests in four parts ----------
   Okuma = the book's own questions (grammar/vocabulary + reading). Dinleme, Yazma and Konuşma are built
   from the same level's vocabulary, dialogs, exercises and reading questions, fresh for every attempt. */
const LVS = ["A1", "A2", "B1", "B2"];
let KT_GEN = {}, KT_ANS = { lv: null, l: {}, w: {}, s: {} }, KT_REC = null;
function ktGen(lv) {
  if (KT_GEN[lv]) return KT_GEN[lv];
  const units = COURSE.units.filter(u => u.level === lv);
  const words = shuffle(units.flatMap(u => u.vocab.flatMap(v => v.words)).filter(([tr, uz]) => uz && sayable({ tr })));
  const lines = shuffle(units.flatMap(u => lsLines(u.id)));
  const l = [];
  words.slice(0, 3).forEach(([tr, uz]) => {
    const wrong = [...new Set(shuffle(words.filter(x => x[1] !== uz && x[0] !== tr)).map(x => x[1]))].slice(0, 3);
    l.push({ kind: "word", t: tr, a: uz, o: shuffle([uz, ...wrong]) });
  });
  lines.slice(0, 3).forEach(ln => {
    const near = lines.filter(x => x.t !== ln.t).sort((a, b) => Math.abs(a.t.length - ln.t.length) - Math.abs(b.t.length - ln.t.length)).slice(0, 6);
    l.push({ kind: "line", t: ln.t, a: ln.t, o: shuffle([ln.t, ...shuffle(near).slice(0, 2).map(x => x.t)]) });
  });
  // Writing: one short fill-in item from each of six different exercises
  const ex = shuffle(units.flatMap(u => u.exercises.filter(e => !e.match && !e.sample).map(e => ({ e, items: (e.items || []).filter(([k, q]) => {
    const a = e.ans && e.ans[k];
    return a && a.split(" ").length <= 4 && !/…/.test(a) && /___|→/.test(q);
  }) })).filter(x => x.items.length)));
  const w = ex.slice(0, 6).map(({ e, items }) => { const [k, q] = items[Math.floor(Math.random() * items.length)]; return { title: e.title, q, a: e.ans[k] }; });
  // Speaking: repeat dialog lines and answer reading questions aloud
  const oral = shuffle(units.flatMap(u => oralItems(u.id))).slice(0, 2);
  const s = [...lines.slice(3, 3 + 4 - oral.length).map(ln => ({ kind: "line", tr: ln.t })), ...oral.map(o => ({ kind: "oral", tr: o.tr, q: o.q }))];
  return (KT_GEN[lv] = { l, w, s });
}
const ktNeed = it => it.kind === "oral" ? 0.6 : 0.8;
// Best result per skill and level, and the highest level passed in each skill
const ktSkill = (lv, id) => ((S.ktsk || {})[lv] || {})[id];
function skLevel(id) {
  let best = null;
  LVS.forEach(lv => { const v = ktSkill(lv, id); if (v !== undefined && v !== null && v >= KLEVEL(lv).test.pass) best = lv; });
  return best;
}
function skLevelsCard() {
  // Next test to take: the level after the highest one passed in this skill
  const next = id => { const lv = skLevel(id); return lv ? LVS[Math.min(LVS.indexOf(lv) + 1, 3)] : "A1"; };
  return `<section class="section"><div class="section-head"><h2>Koʻnikma boʻyicha daraja</h2><span class="tag teal-t">daraja testlaridan</span></div>
    <div class="sk-lv">${SKILLS.map(s => { const lv = skLevel(s.id), nx = next(s.id); return `<a class="sk-lv-item glass" href="#ktest-${nx.toLowerCase()}">
      <span class="ico ${s.c}-t">${ICON[s.ico]}</span><small>${s.tr}</small><b>${lv || "—"}</b><span class="muted">${lv === "B2" ? "Eng yuqori" : `Keyingi: ${nx} testi`}</span></a>`; }).join("")}</div>
    <p class="muted" style="font-size:13px;margin-top:8px">Daraja testining har bir qismi alohida baholanadi. Qismdan ${KLEVEL("A1").test.pass}% va undan yuqori olsangiz, oʻsha koʻnikmada daraja tasdiqlanadi.</p></section>`;
}
function ktPartHead(id, name) {
  const s = SKILLS.find(x => x.id === id);
  return `<div class="section-head"><h2><span class="tag ${s.c}-t" style="padding:6px;margin-right:6px">${ICON[s.ico]}</span>${esc(name)}</h2></div>`;
}
function ktListenHtml(lv, res, start) {
  const g = ktGen(lv);
  return `<section class="section">${ktPartHead("l", "Dinleme · Tinglash")}
    <p class="sub">Tugmani bosib tinglang va javobni tanlang. Matn koʻrsatilmaydi.</p>
    ${g.l.map((q, i) => { const chosen = KT_ANS.l[i]; return `<div class="k-item glass">
      <div class="k-q" style="display:flex;align-items:center;gap:10px"><b>${start + i + 1}.</b><button class="say" data-act="ls-play" data-t="${esc(q.t)}" aria-label="Tinglash">${ICON.speak}</button>
        <span>${q.kind === "word" ? "Soʻzning maʼnosini toping" : "Qaysi gapni eshitdingiz?"}</span>${res ? `<span lang="tr" class="muted">— ${esc(q.t)}</span>` : ""}</div>
      <div class="k-opts">${q.o.map((o, oi) => { let cls = chosen === oi ? " picked" : ""; if (res) cls = o === q.a ? " right" : chosen === oi ? " wrong" : ""; return `<button class="opt${cls}" data-act="kt-l" data-i="${i}" data-o="${oi}" ${q.kind === "line" ? 'lang="tr"' : ""} ${res ? "disabled" : ""}>${esc(o)}</button>`; }).join("")}</div></div>`; }).join("")}
  </section>`;
}
function ktWriteHtml(lv, res, start) {
  const g = ktGen(lv);
  return `<section class="section">${ktPartHead("w", "Yazma · Yozish")}
    ${g.w.map((q, i) => { const v = KT_ANS.w[i] || "", m = res ? ansMatch(v, q.a) : -1; return `<div class="k-item glass">
      <div class="k-q"><b>${start + i + 1}.</b> <small class="muted">${esc(q.title)}</small><div lang="tr" style="margin-top:4px">${esc(q.q)}</div></div>
      <div class="k-in"><input class="k-input${m > 0 ? " right" : m === 0 ? " wrong" : ""}" data-act="kt-w" data-i="${i}" value="${esc(v)}" lang="tr" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Javob…" ${res ? "disabled" : ""}></div>
      ${res && m <= 0 ? `<div class="k-fb"><span class="no">Toʻgʻri javob: <b lang="tr">${esc(q.a)}</b></span></div>` : ""}</div>`; }).join("")}
  </section>`;
}
function ktSpeakHtml(lv, res, start) {
  const g = ktGen(lv);
  if (!canListen()) return `<section class="section">${ktPartHead("s", "Konuşma · Gapirish")}<div class="notice"><div>Bu brauzer nutqni tanimaydi, shuning uchun gapirish qismi ishlamaydi. Natija 3 qism boʻyicha hisoblanadi. Chrome yoki Safari'da oching.</div></div></section>`;
  return `<section class="section">${ktPartHead("s", "Konuşma · Gapirish")}
    <p class="sub">Mikrofonni bosib ayting. Har savolni bir necha marta urinib koʻrish mumkin, eng yaxshi natija olinadi. Hozir gapira olmasangiz, bu qismni oʻtkazib yuboring: natija qolgan qismlar boʻyicha chiqadi.</p>
    ${g.s.map((q, i) => { const r = KT_ANS.s[i]; return `<div class="k-item glass">
      <div class="k-q"><b>${start + i + 1}.</b> ${q.kind === "oral" ? `<span>Savolga toʻliq gap bilan javob bering:</span><div lang="tr" style="margin-top:4px"><b>${esc(q.q)}</b></div>` : `<span>Gapni ovoz chiqarib ayting:</span><div lang="tr" style="margin-top:4px"><b>${esc(q.tr)}</b></div>`}</div>
      <div class="kt-mic-row">${res ? "" : `<button class="mic-btn kt-mic" data-act="kt-mic" data-l="${lv}" data-i="${i}" aria-label="Mikrofon">${ICON.mic}</button>`}
        <div class="kt-heard" id="kt-s-${i}">${r ? ktHeard(q, r) : res ? `<span class="muted">Javob berilmadi</span>` : `<span class="muted">Mikrofonni bosing</span>`}</div></div>
      ${res && q.kind === "oral" ? `<div class="k-fb"><span class="muted">Namuna: <b lang="tr">${esc(q.tr)}</b></span></div>` : ""}</div>`; }).join("")}
  </section>`;
}
const ktHeard = (q, r) => `<span lang="tr">«${esc(r.text)}»</span> <span class="tag ${r.score >= ktNeed(q) ? "green-t" : "pink-t"}">${Math.round(r.score * 100)}%</span>`;
// Records one answer with the browser's speech recognition and passes the best-scoring transcript to done()
function micCapture(q, btn, done) {
  if (KT_REC) { try { KT_REC.stop(); } catch (e) {} return; }
  try { speechSynthesis.cancel(); } catch (e) {}
  const r = new SR();
  r.lang = "tr-TR"; r.interimResults = false; r.maxAlternatives = 5;
  let alts = null;
  r.onresult = ev => { const res = ev.results[ev.results.length - 1]; alts = [...res].map(a => a.transcript); };
  r.onerror = ev => { if (ev.error === "not-allowed" || ev.error === "service-not-allowed") toast("Mikrofonga ruxsat berilmagan"); else if (ev.error === "no-speech") toast("Ovoz eshitilmadi, yana urinib koʻring"); else if (ev.error === "network") toast("Nutqni tanish uchun internet kerak"); };
  r.onend = () => {
    KT_REC = null; btn.classList.remove("on");
    if (!alts) return;
    let best = null;
    alts.forEach(a => { const sc = q.kind === "oral" ? oralScore(q.tr, a).score : sayDiff(sayNorm(q.tr).out, heardNorm(a)).score; if (!best || sc > best.score) best = { score: sc, text: a }; });
    done(best);
  };
  try { r.start(); KT_REC = r; btn.classList.add("on"); } catch (e) { toast("Mikrofonni ishga tushirib boʻlmadi"); }
}
const keepBest = (store, i, best) => { if (!store[i] || best.score > store[i].score) store[i] = best; return store[i]; };
function ktMic(lv, i, btn) {
  const q = ktGen(lv).s[i];
  micCapture(q, btn, best => { const r = keepBest(KT_ANS.s, i, best), el = $(`kt-s-${i}`); if (el) el.innerHTML = ktHeard(q, r); });
}
function plMic(i, btn) {
  const q = plGet().it.s[i];
  micCapture(q, btn, best => { const r = keepBest(plGet().ans.s, i, best), el = $(`pl-s-${i}`); if (el) el.innerHTML = ktHeard(q, r); });
}
/* ---------- Placement test (Darajani aniqlash) ----------
   About 18 questions from A1 to B2 in all four skills, built from the level tests' material. The highest level
   answered well in a row decides where the course starts (S.kStart); earlier units stay open, nothing is marked done. */
let PL = null;
function plGen() {
  const it = { r: [], l: [], w: [], s: [] };
  LVS.forEach(lv => {
    const saved = KT_GEN[lv]; KT_GEN[lv] = null;
    const g = ktGen(lv);
    KT_GEN[lv] = saved;
    shuffle(KLEVEL(lv).test.parts[0].qs).slice(0, 2).forEach(q => it.r.push({ lv, q: q.q, o: q.o, a: q.a }));
    const li = g.l.find(x => x.kind === (lv === "A1" ? "word" : "line")) || g.l[0];
    it.l.push(Object.assign({ lv }, li));
    if (g.w[0]) it.w.push(Object.assign({ lv }, g.w[0]));
    if (lv === "A1" || lv === "B1") { const s = g.s.find(x => x.kind === "line") || g.s[0]; if (s) it.s.push(Object.assign({ lv }, s)); }
  });
  return { it, ans: { r: {}, l: {}, w: {}, s: {} }, res: null };
}
const plGet = () => PL || (PL = plGen());
function plHomeCard() {
  if (S.place || kDoneCount() > 0 || S.xp > 400) return "";
  return `<div class="pcard glass">
    <div class="pcard-head"><b>${ICON.target}Turkchani biroz bilasizmi?</b><span class="tag teal-t">5–7 daq</span></div>
    <p class="muted">Qisqa test darajangizni aniqlaydi va kursni mos joydan boshlaydi: oʻqish, tinglash, yozish va gapirish boʻyicha.</p>
    <a class="btn btn-grad btn-block" href="#placement" style="margin-top:8px">Darajani aniqlash</a>
    <button class="link" data-act="pl-skip" style="display:block;margin:10px auto 0">Kerak emas, A1 dan boshlayman</button>
  </div>`;
}
function plSection(id, name, sub, body) {
  return `<section class="section">${ktPartHead(id, name)}${sub ? `<p class="sub">${sub}</p>` : ""}${body}</section>`;
}
function viewPlacement() {
  const P = plGet(), res = P.res, it = P.it;
  let n = 0;
  const opts = (kind, i, q, chosen, right, trLang) => `<div class="k-opts">${q.o.map((o, oi) => {
    let cls = chosen === oi ? " picked" : "";
    if (res) cls = (kind === "r" ? oi === q.a : o === q.a) ? " right" : chosen === oi ? " wrong" : "";
    return `<button class="opt${cls}" data-act="pl-${kind}" data-i="${i}" data-o="${oi}" ${trLang ? 'lang="tr"' : ""} ${res ? "disabled" : ""}>${esc(o)}</button>`;
  }).join("")}</div>`;
  return `<div><a class="back" href="#course">${ICON.back}Kurs</a></div>
  <div class="lesson-head"><div class="tags"><span class="tag teal-t">${ICON.target}A1 → B2</span><span class="tag violet-t">~${it.r.length + it.l.length + it.w.length + it.s.length} savol</span></div>
    <h1>Darajani aniqlash</h1>
    <p class="sub">Savollar osondan qiyinga qarab boradi. Bilmasangiz, taxmin qilmang — oxirgi variantni tanlab davom eting. Natija taxminiy: u kursni qayerdan boshlashni tavsiya qiladi.</p></div>
  ${res ? plResultHtml(res) : ""}
  ${plSection("r", "Okuma · Grammatika va lugʻat", "", it.r.map((q, i) => `<div class="k-item glass"><div class="k-q"><b>${++n}.</b> <span lang="tr">${esc(q.q)}</span></div>${opts("r", i, q, P.ans.r[i], q.a, true)}</div>`).join(""))}
  ${plSection("l", "Dinleme · Tinglash", "Tugmani bosib tinglang. Matn koʻrsatilmaydi.", it.l.map((q, i) => `<div class="k-item glass">
      <div class="k-q" style="display:flex;align-items:center;gap:10px"><b>${++n}.</b><button class="say" data-act="ls-play" data-t="${esc(q.t)}" aria-label="Tinglash">${ICON.speak}</button><span>${q.kind === "word" ? "Soʻzning maʼnosini toping" : "Qaysi gapni eshitdingiz?"}</span>${res ? `<span lang="tr" class="muted">— ${esc(q.t)}</span>` : ""}</div>
      ${opts("l", i, q, P.ans.l[i], q.a, q.kind === "line")}</div>`).join(""))}
  ${plSection("w", "Yazma · Yozish", "", it.w.map((q, i) => { const v = P.ans.w[i] || "", m = res ? ansMatch(v, q.a) : -1; return `<div class="k-item glass">
      <div class="k-q"><b>${++n}.</b> <small class="muted">${esc(q.title)}</small><div lang="tr" style="margin-top:4px">${esc(q.q)}</div></div>
      <div class="k-in"><input class="k-input${m > 0 ? " right" : m === 0 ? " wrong" : ""}" data-act="pl-w" data-i="${i}" value="${esc(v)}" lang="tr" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Bilmasangiz, boʻsh qoldiring" ${res ? "disabled" : ""}></div>
      ${res && m <= 0 ? `<div class="k-fb"><span class="no">Toʻgʻri javob: <b lang="tr">${esc(q.a)}</b></span></div>` : ""}</div>`; }).join(""))}
  ${canListen() ? plSection("s", "Konuşma · Gapirish", "Ixtiyoriy: hozir gapira olmasangiz, oʻtkazib yuboring.", it.s.map((q, i) => { const r = P.ans.s[i]; return `<div class="k-item glass">
      <div class="k-q"><b>${++n}.</b> Gapni ovoz chiqarib ayting:<div lang="tr" style="margin-top:4px"><b>${esc(q.tr)}</b></div></div>
      <div class="kt-mic-row">${res ? "" : `<button class="mic-btn kt-mic" data-act="pl-mic" data-i="${i}" aria-label="Mikrofon">${ICON.mic}</button>`}<div class="kt-heard" id="pl-s-${i}">${r ? ktHeard(q, r) : `<span class="muted">${res ? "Javob berilmadi" : "Mikrofonni bosing"}</span>`}</div></div></div>`; }).join("")) : ""}
  ${res ? `<button class="btn btn-ghost btn-block" data-act="pl-again">Qayta topshirish</button>` : `<button class="btn btn-grad btn-block" data-act="pl-done">Natijani koʻrish</button>`}`;
}
function plFinish() {
  const P = plGet(), it = P.it;
  const mr = it.r.findIndex((q, i) => P.ans.r[i] === undefined);
  if (mr >= 0) { toast(`${mr + 1}-savolga javob tanlanmagan`); return; }
  const ml = it.l.findIndex((q, i) => P.ans.l[i] === undefined);
  if (ml >= 0) { toast(`${it.r.length + ml + 1}-savolga javob tanlanmagan`); return; }
  if (KT_REC) { try { KT_REC.abort(); } catch (e) {} KT_REC = null; }
  const sTried = canListen() && Object.keys(P.ans.s).length > 0;
  const rows = [
    ...it.r.map((q, i) => ({ sk: "r", lv: q.lv, ok: P.ans.r[i] === q.a })),
    ...it.l.map((q, i) => ({ sk: "l", lv: q.lv, ok: q.o[P.ans.l[i]] === q.a })),
    ...it.w.map((q, i) => ({ sk: "w", lv: q.lv, ok: ansMatch(P.ans.w[i] || "", q.a) > 0 })),
    ...(sTried ? it.s.map((q, i) => ({ sk: "s", lv: q.lv, ok: !!P.ans.s[i] && P.ans.s[i].score >= ktNeed(q) })) : [])
  ];
  const byLv = {};
  LVS.forEach(lv => { const r = rows.filter(x => x.lv === lv); byLv[lv] = r.length ? Math.round(r.filter(x => x.ok).length / r.length * 100) : 0; });
  // Highest level answered well, counting up from A1 without gaps
  let passed = null;
  for (const lv of LVS) { if (byLv[lv] >= 60) passed = lv; else break; }
  const start = !passed ? "A1" : passed === "B2" ? "B2" : LVS[LVS.indexOf(passed) + 1];
  const sk = {};
  SKILLS.forEach(s => {
    const r = rows.filter(x => x.sk === s.id);
    if (!r.length) { sk[s.id] = null; return; }
    let best = "";
    for (const lv of LVS) { const q = r.filter(x => x.lv === lv); if (!q.length) continue; if (q.filter(x => x.ok).length / q.length >= 0.5) best = lv; else break; }
    sk[s.id] = best;
  });
  rows.forEach(x => skillLog(x.sk, x.ok));
  P.res = { byLv, passed, start, sk };
  S.place = { at: todayKey(), passed, start, sk };
  addXP(rows.filter(x => x.ok).length);
  pamukSay("happy", passed ? `Ajoyib! ${passed} darajasidagi savollarni yaxshi bildingiz.` : "Zoʻr, endi qayerdan boshlashni bilamiz!");
  window.scrollTo(0, 0); route();
}
function plResultHtml(r) {
  const su = COURSE.units.find(u => u.level === r.start);
  return `<div class="glass pad k-result pass">${mascot("trophy")}<h2>${r.start}</h2>
    <p>${r.passed ? `Siz ${r.passed} darajasigacha boʻlgan savollarni yaxshi bildingiz. Kursni <b>${r.start}</b> dan boshlashni tavsiya qilamiz.` : "Kursni boshidan — A1 dan boshlashni tavsiya qilamiz. Har bir boʻlim sizga mos tezlikda."}</p>
    <div class="sk-bars" style="text-align:left;margin-top:10px;width:100%;align-self:stretch">${LVS.map(lv => `<div class="sk-line"><span></span><span class="sk-name"><b>${lv}</b><small>savollar</small></span>
      <span class="sk-track"><i style="width:${r.byLv[lv]}%;background:var(--${r.byLv[lv] >= 60 ? "green" : "pink"})"></i></span><span class="sk-val">${r.byLv[lv]}%<small>${r.byLv[lv] >= 60 ? "✔" : "✘"}</small></span></div>`).join("")}</div>
    <div class="tags" style="justify-content:center;margin-top:10px">${SKILLS.map(s => `<span class="tag ${s.c}-t">${s.tr}: ${r.sk[s.id] === null ? "—" : r.sk[s.id] || "boshlangʻich"}</span>`).join("")}</div>
    <div style="display:flex;flex-direction:column;gap:10px;margin-top:14px;width:100%">
      <button class="btn btn-grad btn-block" data-act="pl-apply" data-l="${r.start}">${su ? `${su.level}.${su.n} dan boshlash` : "Boshlash"}</button>
      ${r.start !== "A1" ? `<button class="btn btn-ghost btn-block" data-act="pl-apply" data-l="A1">Baribir A1 dan boshlayman</button>` : ""}
    </div>
    <p class="muted" style="font-size:13px;margin-top:8px">Oldingi boʻlimlar ochiq qoladi: istalgan vaqtda qaytib takrorlashingiz mumkin. Darajani tasdiqlash uchun keyin daraja testini topshiring.</p>
  </div>`;
}
function plApply(lv) {
  S.kStart = Math.max(0, COURSE.units.findIndex(u => u.level === lv));
  if (S.place) S.place.applied = lv; else S.place = { at: todayKey(), applied: lv };
  KLV = lv; save();
  toast(`Kurs ${lv} dan boshlanadi`);
  go("course");
}
function ktFinish(lv) {
  const t = KLEVEL(lv).test, qs = t.parts.flatMap(p => p.qs), g = ktGen(lv);
  const miss = qs.findIndex((q, i) => KTEST_ANS[i] === undefined);
  if (miss >= 0) { toast(`Okuma: ${miss + 1}-savolga javob tanlanmagan`); return; }
  const lMiss = g.l.findIndex((q, i) => KT_ANS.l[i] === undefined);
  if (lMiss >= 0) { toast(`Dinleme: ${qs.length + lMiss + 1}-savolga javob tanlanmagan`); return; }
  if (KT_REC) { try { KT_REC.abort(); } catch (e) {} KT_REC = null; }
  const rOk = qs.map((q, i) => KTEST_ANS[i] === q.a);
  const lOk = g.l.map((q, i) => q.o[KT_ANS.l[i]] === q.a);
  const wOk = g.w.map((q, i) => ansMatch(KT_ANS.w[i] || "", q.a) > 0);
  const sTried = canListen() && Object.keys(KT_ANS.s).length > 0;
  const sOk = g.s.map((q, i) => !!KT_ANS.s[i] && KT_ANS.s[i].score >= ktNeed(q));
  const share = a => a.length ? Math.round(a.filter(Boolean).length / a.length * 100) : null;
  const parts = { r: share(rOk), l: share(lOk), w: share(wOk), s: sTried ? share(sOk) : null };
  const vals = Object.values(parts).filter(v => v !== null), p = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  KTEST_RES = { lv, pct: p, parts };
  rOk.forEach(ok => skillLog("r", ok)); lOk.forEach(ok => skillLog("l", ok)); wOk.forEach(ok => skillLog("w", ok));
  if (sTried) sOk.forEach(ok => skillLog("s", ok));
  S.ktest[lv] = Math.max(kTestBest(lv), p);
  S.ktsk = S.ktsk || {};
  const best = S.ktsk[lv] || (S.ktsk[lv] = {});
  Object.keys(parts).forEach(k => { if (parts[k] !== null) best[k] = Math.max(best[k] || 0, parts[k]); });
  const right = [...rOk, ...lOk, ...wOk, ...(sTried ? sOk : [])].filter(Boolean).length;
  addXP(right * 2);
  if (p >= t.pass) pamukSay("happy", `${p}% — Tabriklaymiz! Siz ${lv} darajasini tasdiqladingiz!`); else pamukSay("sad", `${p}% — Afsus, bu safar oʻtmadi. Zaif qismni takrorlab, yana urinib koʻring!`);
  window.scrollTo(0, 0); route();
}
function ktResultHtml(res, pass) {
  return `<div class="glass pad k-result ${res.pct >= pass ? "pass" : "fail"}">${mascot(res.pct >= pass ? "trophy" : "sit")}<h2>${res.pct}%</h2>
    <p>${res.pct >= pass ? "Tabriklaymiz! Siz bu darajani muvaffaqiyatli yakunladingiz." : "Hali biroz mashq kerak. Zaif qismni takrorlab, yana urinib koʻring."}</p>
    ${res.parts ? `<div class="sk-bars" style="text-align:left;margin-top:10px;width:100%;align-self:stretch">${SKILLS.map(s => { const v = res.parts[s.id]; return `<div class="sk-line">
      <span class="ico ${s.c}-t">${ICON[s.ico]}</span><span class="sk-name"><b>${s.tr}</b><small>${s.uz}</small></span>
      <span class="sk-track"><i style="width:${v || 0}%;background:var(--${s.c})"></i></span>
      <span class="sk-val">${v === null ? "—" : v + "%"}<small>${v === null ? "topshirilmadi" : v >= pass ? "✔ oʻtdi" : "✘"}</small></span></div>`; }).join("")}</div>` : ""}
  </div>`;
}
/* ---------- Anonymous learning statistics ----------
   Every few hours a signed-in learner's app writes a small summary to stats/{uid}: skill counts, balance,
   skill levels and test results. No name, e-mail, answers or texts. Learners can switch it off in Settings.
   Only accounts listed in admins/{uid} (added by hand in the Firebase console) can read the collection;
   their summary page is #admin. */
let ADMIN = false, ADMIN_DATA = null, ADMIN_BUSY = false, ADMIN_ERR = "";
const STATS_EVERY = 3 * 3600 * 1000;
function statsDoc() {
  const st = skStats(14), t = {}, w = {}, lvl = {}, kt = {};
  SKILLS.forEach(s => {
    t[s.id] = [S.sk[s.id][0], S.sk[s.id][1]];
    w[s.id] = [st[s.id].o, st[s.id].n, Math.round(st[s.id].t / 60)];
    lvl[s.id] = skLevel(s.id) || "";
  });
  LVS.forEach(lv => {
    const x = (S.ktsk || {})[lv];
    if (x) kt[lv] = { r: x.r ?? null, l: x.l ?? null, w: x.w ?? null, s: x.s ?? null };
  });
  let act = 0;
  for (let i = 0; i < 14; i++) if (dayGet(keyOf(dayNum() - i)).xp) act++;
  return { v: 1, d: todayKey(), lv: kNext().level, units: kDoneCount(), t, w, bal: skBalance(st), lvl, kt, act };
}
function statsPush(force) {
  if (!USER || !db || S.anon === false) return;
  if (!force && S.statsAt && Date.now() - S.statsAt < STATS_EVERY) return;
  S.statsAt = Date.now();
  db.collection("stats").doc(USER.uid).set(statsDoc()).catch(() => { S.statsAt = 0; });
}
function adminCheck(uid) {
  ADMIN = false; ADMIN_ERR = "";
  db.collection("admins").doc(uid).get().then(d => {
    ADMIN = d.exists; ADMIN_ERR = d.exists ? "" : "notfound";
    if (/^#?(profile|admin)$/.test(location.hash.replace("#", ""))) route();
  }).catch(e => { ADMIN_ERR = (e && e.code) || "error"; if (location.hash === "#admin") route(); });
}
function adminLoad() {
  if (ADMIN_BUSY || !db) return;
  ADMIN_BUSY = true;
  db.collection("stats").get().then(snap => {
    ADMIN_DATA = { at: new Date(), docs: snap.docs.map(d => d.data()) };
  }).catch(e => { ADMIN_DATA = { err: e && e.code === "permission-denied" ? "Ruxsat yoʻq: Firestore qoidalari yangilanmagan yoki hisobingiz admins roʻyxatida emas." : "Maʼlumotni yuklab boʻlmadi. Internetni tekshiring." }; })
    .finally(() => { ADMIN_BUSY = false; if (location.hash === "#admin") route(); });
}
// Turns the raw summaries into the numbers shown on #admin
function adminAgg(docs) {
  const all = docs.filter(x => x && x.v === 1), from = keyOf(dayNum() - 13);
  const active = all.filter(x => x.d >= from && SKILLS.some(s => x.w && x.w[s.id] && x.w[s.id][1]));
  const sk = {};
  SKILLS.forEach(s => sk[s.id] = { o: 0, n: 0, min: 0, weak: 0, users: 0 });
  active.forEach(x => {
    SKILLS.forEach(s => { const a = x.w[s.id] || [0, 0, 0]; sk[s.id].o += a[0]; sk[s.id].n += a[1]; sk[s.id].min += a[2] || 0; if (a[1]) sk[s.id].users++; });
    const weak = SKILLS.slice().sort((a, b) => (x.w[a.id] || [0])[0] - (x.w[b.id] || [0])[0])[0];
    sk[weak.id].weak++;
  });
  const balB = [0, 0, 0, 0, 0];
  active.forEach(x => balB[Math.min(4, Math.floor((x.bal || 0) / 20))]++);
  const lvl = {};
  SKILLS.forEach(s => { lvl[s.id] = { "": 0, A1: 0, A2: 0, B1: 0, B2: 0 }; all.forEach(x => { const v = (x.lvl || {})[s.id] || ""; if (v in lvl[s.id]) lvl[s.id][v]++; }); });
  const course = { A1: 0, A2: 0, B1: 0, B2: 0 };
  all.forEach(x => { if (x.lv in course) course[x.lv]++; });
  const tests = {};
  LVS.forEach(lv => { tests[lv] = {}; SKILLS.forEach(s => { const v = all.map(x => ((x.kt || {})[lv] || {})[s.id]).filter(v => typeof v === "number"); tests[lv][s.id] = v.length ? { avg: Math.round(v.reduce((a, b) => a + b, 0) / v.length), n: v.length } : null; }); });
  const avg = a => a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0;
  return { total: all.length, active: active.length, actDays: avg(active.map(x => x.act || 0)), bal: avg(active.map(x => x.bal || 0)), sk, balB, lvl, course, tests };
}
function viewAdmin() {
  const head = `<div><a class="back" href="#profile">${ICON.back}Profil</a></div>
  <div class="lesson-head"><div class="tags"><span class="tag violet-t">${ICON.lock}Faqat admin</span></div><h1>Umumiy analitika</h1>
    <p class="sub">Barcha foydalanuvchilarning anonim koʻnikma koʻrsatkichlari. Ism, pochta va yozilgan matnlar bu yerga kelmaydi.</p></div>`;
  if (!USER || !db) return head + `<div class="glass empty"><b>Hisobga kiring</b></div>`;
  if (!ADMIN) {
    const why = ADMIN_ERR === "notfound" ? `Firestore'da <code>admins</code> toʻplamida aynan shu ID bilan hujjat topilmadi. Hujjat ID'si quyidagi UID bilan harfma-harf mos boʻlishi kerak (boʻsh joysiz).`
      : ADMIN_ERR === "permission-denied" ? "Firestore qoidalari admin tekshiruviga ruxsat bermadi: konsolda yangi qoidalar joylanganini (Publish) tekshiring."
      : ADMIN_ERR ? `Admin tekshiruvida xato: ${esc(ADMIN_ERR)}. Internetni tekshirib, sahifani yangilang.` : "Admin tekshiruvi hali tugamadi. Bir necha soniyadan keyin sahifani yangilang.";
    return head + `<div class="glass pad"><b>Bu sahifa faqat admin uchun</b><p class="muted" style="margin-top:6px">${why}</p>
      <p style="margin-top:10px"><small class="muted">Sizning UID'ingiz:</small><br><code style="word-break:break-all">${esc(USER.uid)}</code></p>
      <button class="btn btn-soft btn-block" data-act="copy-uid" style="margin-top:8px">${ICON.copy}UID'ni nusxalash</button></div>`;
  }
  if (!ADMIN_DATA) { adminLoad(); return head + `<div class="glass empty"><b>Yuklanmoqda…</b></div>`; }
  if (ADMIN_DATA.err) return head + `<div class="notice"><div>${esc(ADMIN_DATA.err)}</div></div><button class="btn btn-ghost btn-block" data-act="admin-reload">Qayta urinish</button>`;
  return head + adminHtml(adminAgg(ADMIN_DATA.docs), ADMIN_DATA.at);
}
function adminHtml(a, at) {
  if (!a.total) return `<div class="glass empty"><b>Hali maʼlumot yoʻq</b><p class="muted">Foydalanuvchilar hisobga kirib mashq qilganda statistikalar shu yerda paydo boʻladi.</p></div>`;
  const tile = (n, l, c) => `<div class="stat glass"><span class="ico ${c}-t">${ICON.star}</span><span><b>${n}</b><span>${l}</span></span></div>`;
  const weakest = SKILLS.slice().sort((x, y) => a.sk[y.id].weak - a.sk[x.id].weak)[0];
  const accOf = s => a.sk[s.id].n ? pct(a.sk[s.id].o, a.sk[s.id].n) : null;
  const lowAcc = SKILLS.filter(s => accOf(s) !== null).sort((x, y) => accOf(x) - accOf(y))[0];
  const maxN = Math.max(1, ...SKILLS.map(s => a.sk[s.id].n));
  const bar = (v, mx, c) => `<span class="sk-track"><i style="width:${Math.round(v / Math.max(1, mx) * 100)}%;background:var(--${c})"></i></span>`;
  const bMax = Math.max(1, ...a.balB);
  return `<div class="stat-grid">${tile(a.total, "Jami foydalanuvchi", "violet")}${tile(a.active, "14 kunda faol", "green")}${tile(a.actDays, "Oʻrtacha faol kun (14 dan)", "orange")}${tile(a.bal + "%", "Oʻrtacha muvozanat", "sky")}</div>
  ${a.active ? `<div class="tip glass">${ICON.bulb}<div><b>Xulosa</b>Faol foydalanuvchilarning ${pct(a.sk[weakest.id].weak, a.active)}% ida eng zaif koʻnikma <b>${weakest.tr} (${weakest.uz})</b> boʻlib chiqdi.${lowAcc ? ` Eng past aniqlik: ${lowAcc.tr} — ${accOf(lowAcc)}%.` : ""} Shu koʻnikma uchun mashqlarni koʻpaytirish va bosh sahifada koʻproq taklif qilish foydali.</div></div>` : ""}
  <section class="section"><div class="section-head"><h2>Koʻnikmalar · 14 kun</h2><span class="tag sky-t">${a.active} ta faol</span></div>
    <div class="glass pad"><div class="sk-bars">${SKILLS.map(s => { const x = a.sk[s.id], ac = accOf(s); return `<div class="sk-line"><span class="ico ${s.c}-t">${ICON[s.ico]}</span>
      <span class="sk-name"><b>${s.tr}</b><small>${x.users} kishi</small></span>${bar(x.n, maxN, s.c)}
      <span class="sk-val">${x.n}<small>${ac === null ? "—" : ac + "%"}</small></span></div>`; }).join("")}</div>
    <p class="muted" style="font-size:13px;margin-top:10px">Chiziq — mashqlar soni, raqam ostida — oʻrtacha aniqlik. Sarflangan vaqt: ${SKILLS.map(s => `${s.tr} ${a.sk[s.id].min} daq`).join(" · ")}.</p></div></section>
  <section class="section"><div class="section-head"><h2>Eng zaif koʻnikma</h2><span class="tag pink-t">foydalanuvchilar ulushi</span></div>
    <div class="glass pad"><div class="sk-bars">${SKILLS.map(s => `<div class="sk-line"><span class="ico ${s.c}-t">${ICON[s.ico]}</span><span class="sk-name"><b>${s.tr}</b><small>${s.uz}</small></span>${bar(a.sk[s.id].weak, a.active, s.c)}<span class="sk-val">${pct(a.sk[s.id].weak, a.active || 1)}%<small>${a.sk[s.id].weak} kishi</small></span></div>`).join("")}</div></div></section>
  <section class="section"><div class="section-head"><h2>Muvozanat taqsimoti</h2></div>
    <div class="glass pad"><div class="sk-bars">${["0–19%", "20–39%", "40–59%", "60–79%", "80–100%"].map((l, i) => `<div class="sk-line"><span></span><span class="sk-name"><b>${l}</b></span>${bar(a.balB[i], bMax, i >= 4 ? "green" : i >= 2 ? "sky" : "pink")}<span class="sk-val">${a.balB[i]}<small>kishi</small></span></div>`).join("")}</div></div></section>
  <section class="section"><div class="section-head"><h2>Koʻnikma boʻyicha daraja</h2><span class="tag teal-t">jami ${a.total}</span></div>
    <div class="table-wrap glass"><table class="gtable"><thead><tr><th scope="col">Koʻnikma</th><th>—</th>${LVS.map(l => `<th scope="col">${l}</th>`).join("")}</tr></thead>
    <tbody>${SKILLS.map(s => `<tr><td><b>${s.tr}</b></td><td>${a.lvl[s.id][""]}</td>${LVS.map(l => `<td>${a.lvl[s.id][l]}</td>`).join("")}</tr>`).join("")}</tbody></table></div></section>
  <section class="section"><div class="section-head"><h2>Daraja testlari · oʻrtacha foiz</h2></div>
    <div class="table-wrap glass"><table class="gtable"><thead><tr><th scope="col">Test</th>${SKILLS.map(s => `<th scope="col">${s.tr}</th>`).join("")}</tr></thead>
    <tbody>${LVS.map(l => `<tr><td><b>${l}</b></td>${SKILLS.map(s => { const x = a.tests[l][s.id]; return `<td>${x ? `${x.avg}%<br><small class="muted">${x.n} kishi</small>` : "—"}</td>`; }).join("")}</tr>`).join("")}</tbody></table></div></section>
  <section class="section"><div class="section-head"><h2>Kursdagi joriy daraja</h2></div>
    <div class="glass pad"><div class="sk-bars">${LVS.map(l => `<div class="sk-line"><span></span><span class="sk-name"><b>${l}</b></span>${bar(a.course[l], a.total, "violet")}<span class="sk-val">${a.course[l]}<small>kishi</small></span></div>`).join("")}</div></div></section>
  <p class="muted" style="font-size:13px">Yangilangan: ${at ? at.toLocaleString("uz") : "—"}. Har bir foydalanuvchi maʼlumoti taxminan har 3 soatda yangilanadi (u ilovani ochganda).</p>
  <button class="btn btn-ghost btn-block" data-act="admin-reload">Yangilash</button>`;
}
/* ---------- Pronunciation practice ----------
   Uses the browser's own speech recognition (Web Speech API, tr-TR). Nothing is recorded or stored by the site:
   the browser returns text, and we compare it letter by letter with the target word. */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const canListen = () => !!SR;
let REC = null;
const sayable = w => !/[…\/()=;]/.test(w.tr) && w.tr.length <= 26 && /[a-zçğıöşü]/i.test(w.tr);
function sayItems(u, f = sayable, n = 8) {
  let pool;
  if (u === "pron") {
    // Words the learner has already met; for a fresh start, the first lessons
    pool = ALL.filter(w => srs(w) && f(w));
    if (pool.length < n) pool = ALL.filter(f).slice(0, 80);
  } else pool = pickPool(u).filter(f);
  return shuffle(pool).slice(0, n);
}
// Recognisers often write numbers as digits: turn them back into Turkish words
const TR_ONES = ["", "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz"];
const TR_TENS = ["", "on", "yirmi", "otuz", "kırk", "elli", "altmış", "yetmiş", "seksen", "doksan"];
function trNum(n) {
  if (n === 0) return "sıfır";
  const part = (k, word) => k ? (k > 1 ? trNum(k) + " " : "") + word : "";
  const out = [part(Math.floor(n / 1000) % 1000, "bin"), part(Math.floor(n / 100) % 10, "yüz"), TR_TENS[Math.floor(n / 10) % 10], TR_ONES[n % 10]];
  return out.filter(Boolean).join(" ");
}
// Lower-case letters only, with a map back to the original characters (to colour them)
function sayNorm(s) {
  let out = "", map = [];
  for (let i = 0; i < s.length; i++) {
    const c = s[i].toLocaleLowerCase("tr").replace(/[âáà]/, "a").replace(/[îí]/, "i").replace(/[ûú]/, "u");
    if (/[a-zçğıöşü]/.test(c)) { out += c; map.push(i); }
    else if (/[\s\-]/.test(c) && out && out[out.length - 1] !== " ") { out += " "; map.push(-1); }
  }
  if (out.endsWith(" ")) { out = out.slice(0, -1); map.pop(); }
  return { out, map };
}
const heardNorm = s => sayNorm(s.replace(/\d+/g, d => " " + trNum(Math.min(+d, 999999)) + " ")).out;
// Edit distance plus, for each target letter, whether it was matched
function sayDiff(a, b) {
  const m = a.length, n = b.length, d = [];
  for (let i = 0; i <= m; i++) { d.push(new Array(n + 1).fill(0)); d[i][0] = i; }
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  const ok = new Array(m).fill(false);
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1] && d[i][j] === d[i - 1][j - 1]) { ok[i - 1] = true; i--; j--; }
    else if (d[i][j] === d[i - 1][j - 1] + 1) { i--; j--; }
    else if (d[i][j] === d[i - 1][j] + 1) i--;
    else j--;
  }
  return { dist: d[m][n], ok, score: Math.max(0, 1 - d[m][n] / Math.max(m, n, 1)) };
}
function sayMarked(target, ok) {
  const { map } = sayNorm(target), bad = new Set();
  map.forEach((idx, k) => { if (idx >= 0 && !ok[k]) bad.add(idx); });
  return [...target].map((c, i) => bad.has(i) ? `<span class="miss">${esc(c)}</span>` : esc(c)).join("");
}
function renderSay(w) {
  SES.sk = ["s"]; SES.tries = 0; SES.best = null;
  stage.innerHTML = `<div class="q-label">${w.line ? "Tinglang va gapni ovoz chiqarib takrorlang" : "Ovoz chiqarib ayting"}</div>
    <div class="q-row"><div class="q-word say-target" id="say-target" lang="tr">${esc(w.tr)}</div>
      <button class="say" data-act="say" data-t="${esc(w.tr)}" aria-label="Tinglash">${ICON.speak}</button></div>
    <div class="sub">${esc(w.uz || "")}</div>
    <div class="mic-wrap">
      <button class="mic-btn" id="mic-btn" data-act="mic" aria-label="Mikrofon: gapirishni boshlash">${ICON.mic}</button>
      <div class="mic-hint" id="mic-hint">Avval tinglang, keyin mikrofonni bosib ayting</div>
      <div class="heard" id="heard" lang="tr" aria-live="polite"></div>
    </div>
    <div class="feedback" id="fb" aria-live="polite"></div>`;
  foot.innerHTML = `<button class="btn btn-ghost btn-block" data-act="say-skip">Hozir gapira olmayman</button>`;
  speak(w.tr);
}
function micStop(abort) {
  if (!REC) return;
  const r = REC; REC = null;
  try { abort ? r.abort() : r.stop(); } catch (e) {}
}
function micUi(on, hint) {
  const b = $("mic-btn"), h = $("mic-hint");
  if (b) { b.classList.toggle("on", on); b.setAttribute("aria-label", on ? "Mikrofon: toʻxtatish" : "Mikrofon: gapirishni boshlash"); }
  if (h && hint) h.textContent = hint;
}
function micToggle() {
  if (!SES || SES.answered) return;
  if (REC) { micStop(false); return; }
  try { speechSynthesis.cancel(); } catch (e) {}
  const w = SES.items[SES.i];
  const r = new SR();
  r.lang = "tr-TR"; r.interimResults = true; r.maxAlternatives = 5; r.continuous = false;
  let finalAlts = null;
  r.onresult = ev => {
    const res = ev.results[ev.results.length - 1];
    const h = $("heard"); if (h) h.textContent = res[0].transcript;
    if (res.isFinal) finalAlts = [...res].map(a => a.transcript);
  };
  r.onerror = ev => {
    const msg = { "not-allowed": "Mikrofonga ruxsat berilmagan. Brauzer sozlamalarida ruxsat bering.", "service-not-allowed": "Mikrofonga ruxsat berilmagan. Brauzer sozlamalarida ruxsat bering.",
      "no-speech": "Ovoz eshitilmadi. Mikrofonni bosib, soʻzni aniq ayting.", "audio-capture": "Mikrofon topilmadi.", "network": "Nutqni tanish uchun internet kerak." }[ev.error];
    if (msg) { const fb = $("fb"); if (fb) { fb.className = "feedback no"; fb.textContent = msg; } }
  };
  r.onend = () => {
    if (REC === r) REC = null;
    micUi(false, "Yana aytish uchun mikrofonni bosing");
    if (finalAlts && SES && !SES.answered && SES.items[SES.i] === w) sayCheck(w, finalAlts);
  };
  try { r.start(); REC = r; micUi(true, "Tinglayapman… soʻzni ayting"); const h = $("heard"); if (h) h.textContent = ""; }
  catch (e) { toast("Mikrofonni ishga tushirib boʻlmadi"); }
}
function sayCheck(w, alts) {
  let best = null;
  if (w.oral) alts.forEach(a => { const r = oralScore(w.tr, a); r.text = a; if (!best || r.score > best.score) best = r; });
  else { const target = sayNorm(w.tr).out; alts.forEach(a => { const r = sayDiff(target, heardNorm(a)); r.text = a; if (!best || r.score > best.score) best = r; }); }
  if (!best) return;
  SES.tries++;
  const p = Math.round(best.score * 100), fb = $("fb"), need = w.oral ? 0.6 : w.tr.includes(" ") ? 0.8 : 0.85;
  const ok = best.score >= need, last = ok || SES.tries >= 3;
  $("heard").textContent = best.text;
  if (!w.oral) $("say-target").innerHTML = sayMarked(w.tr, best.ok);
  else if (last) { const smp = $("oral-sample"); smp.hidden = false; smp.innerHTML = `<small class="muted">Namuna javob:</small><br><span lang="tr">${oralMarked(w.tr, best)}</span>`; }
  const hits = w.oral ? `${best.hit.filter(Boolean).length}/${best.kw.length} kalit soʻz` : `${p}%`;
  if (ok) {
    fb.className = "feedback ok";
    fb.innerHTML = `${w.oral ? "Aferin! Javobingiz toʻgʻri." : p === 100 ? "Mükemmel! Juda toʻgʻri aytdingiz." : "Aferin! Yaxshi aytdingiz."} <span class="tag green-t">${hits}</span>`;
    sayFinish(true);
  } else if (!last) {
    fb.className = "feedback no";
    fb.innerHTML = w.oral
      ? `Javob toʻliq emas <span class="tag pink-t">${hits}</span><div class="sub" style="margin-top:4px">Savolni yana tinglang, matnga qarang va toʻliq gap bilan javob bering (${3 - SES.tries} ta urinish qoldi).</div>`
      : `${p >= 60 ? "Yaqin!" : "Unchalik oʻxshamadi."} <span class="tag pink-t">${p}%</span><div class="sub" style="margin-top:4px">Qizil harflarga eʼtibor bering, yana tinglab qayta ayting (${3 - SES.tries} ta urinish qoldi).</div>`;
    CatLife.mood(sCat(), "sad", 1200);
  } else {
    fb.className = "feedback no";
    fb.innerHTML = `Bu safar chiqmadi <span class="tag pink-t">${hits}</span><div class="sub" style="margin-top:4px">${w.oral ? "Namuna javobni ovoz chiqarib oʻqib chiqing: yashil soʻzlarni aytdingiz, qizillari yetishmadi." : "Keyingi safar albatta chiqadi. Qizil harflarni alohida mashq qiling."}</div>`;
    sayFinish(false);
  }
}
function sayFinish(ok, skipped) {
  if (!SES || SES.answered) return;
  micStop(true);
  SES.answered = true;
  tick();
  if (!skipped) {
    S.pron[1]++; dayRec().rev++;
    skillLog(SES.sk || "s", ok, ok ? 10 : 0);
    if (ok) lsmHit(SES.items[SES.i], SES.m); else lsmMiss(SES.items[SES.i], SES.m);
    if (ok) { S.pron[0]++; SES.right++; SES.xp += 10; addXP(10); CatLife.mood(sCat(), "happy", 1000); }
    else { save(); CatLife.mood(sCat(), "sad", 1600); }
  }
  const w = SES.items[SES.i];
  foot.innerHTML = `<button class="btn btn-ghost" data-act="say" data-t="${esc(w.tr)}">${ICON.speak}${w.oral ? "Namunani tinglash" : "Tinglash"}</button><button class="btn btn-grad" data-act="next">Keyingi</button>`;
  roleAfter(w);
}
/* ---------- Rule exercises ---------- */
const blankHtml = q => esc(q).replace("___", '<span class="blank">&nbsp;</span>');
function renderGx(it) {
  SES.sk = it.ex.t === "c" ? ["r"] : ["w"];
  const ex = it.ex, tp = gxTopic(it.code);
  const head = `<div class="tags"><span class="tag sky-t">${esc(it.code)}</span><span class="tag violet-t">${esc(tp ? tp.uz : "")}</span></div>`;
  if (ex.t === "c") {
    stage.innerHTML = `${head}<div class="q-label">Toʻgʻri variantni tanlang</div>
      <div class="q-sent">${blankHtml(ex.q)}</div>
      <div class="options">${shuffle(ex.o.map((o, i) => [o, i])).map(([o, i], k) => `<button class="opt" lang="tr" data-act="gx-ans" data-o="${i}"><span class="k">${"ABCD"[k]}</span>${esc(o)}</button>`).join("")}</div>
      <div class="feedback" id="fb" aria-live="polite"></div>`;
    foot.innerHTML = `<button class="btn btn-grad btn-block" data-act="next" disabled>Keyingi</button>`;
  } else if (ex.t === "t") {
    stage.innerHTML = `${head}<div class="q-label">Boʻsh joyni toʻldiring</div>
      <div class="q-sent" lang="tr">${blankHtml(ex.q)}</div>
      ${ex.uz ? `<div class="sub">${esc(ex.uz)}</div>` : ""}
      <form class="type-box" id="type-form" autocomplete="off">
        <label for="type-input" class="sr">Javob</label>
        <input class="type-input" id="type-input" lang="tr" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Javobingiz…">
        <div class="keys">${["ç", "ş", "ğ", "ı", "İ", "ö", "ü", "'"].map(k => `<button type="button" data-act="key" data-k="${k}">${k}</button>`).join("")}</div>
      </form>
      <div class="feedback" id="fb" aria-live="polite"></div>`;
    foot.innerHTML = `<button class="btn btn-ghost" data-act="gx-skip">Bilmayman</button><button class="btn btn-grad" data-act="gx-check">Tekshirish</button>`;
    $("type-form").addEventListener("submit", e => { e.preventDefault(); if (SES.answered) nextStep(); else gxCheckType(); });
    setTimeout(() => { const i = $("type-input"); if (i) i.focus(); }, 60);
  } else {
    const toks = ex.s.split(" ");
    let order = shuffle(toks.map((t, i) => i));
    if (order.every((v, i) => v === i)) order = order.reverse();
    SES.ord = [];
    stage.innerHTML = `${head}<div class="q-label">Soʻzlardan gap tuzing</div>
      <div class="sub" style="font-size:16px;color:var(--ink-2)">${esc(ex.uz || "")}</div>
      <div class="ord-ans glass" id="ord-ans" aria-label="Sizning gapingiz"></div>
      <div class="ord-pool" id="ord-pool">${order.map(i => `<button class="tok" lang="tr" data-act="ord-tok" data-i="${i}">${esc(toks[i])}</button>`).join("")}</div>
      <div class="feedback" id="fb" aria-live="polite"></div>`;
    foot.innerHTML = `<button class="btn btn-ghost" data-act="gx-skip">Bilmayman</button><button class="btn btn-grad" data-act="gx-order" disabled>Tekshirish</button>`;
  }
}
function gxExplain(ex, ok, right) {
  return `${ok ? "Doğru! Toʻgʻri." : `Toʻgʻri javob: <b lang="tr">${esc(right)}</b>`}${ex.uz && ex.t !== "t" && ex.t !== "o" ? `<div class="sub" style="margin-top:4px">${esc(ex.uz)}</div>` : ""}${ex.e ? `<div class="sub" style="margin-top:4px">${esc(ex.e)}</div>` : ""}`;
}
const gxNorm = s => fold(s.replace(/[’ʼ`]/g, "'"));
const gxPlain = s => plain(s.replace(/[’ʼ`']/g, ""));
function gxFinish(ok, right, near) {
  SES.answered = true;
  const it = SES.items[SES.i], fb = $("fb");
  if (ok) gxGood(it); else gxBad(it);
  fb.className = "feedback " + (ok ? "ok" : "no");
  fb.innerHTML = near ? `Deyarli! Toʻgʻri yozilishi: <b lang="tr">${esc(right)}</b>${it.ex.e ? `<div class="sub" style="margin-top:4px">${esc(it.ex.e)}</div>` : ""}` : gxExplain(it.ex, ok, right);
  if (it.ex.t !== "c") speak(right);
  foot.innerHTML = `<button class="btn btn-grad btn-block" data-act="next">Keyingi</button>`;
}
function gxCheckType(skip) {
  if (SES.answered) return;
  const ex = SES.items[SES.i].ex, inp = $("type-input"), v = inp.value;
  if (!skip && !v.trim()) { inp.focus(); return; }
  const exact = !skip && ex.ans.some(a => gxNorm(a) === gxNorm(v));
  const near = !skip && !exact && ex.ans.some(a => gxPlain(a) === gxPlain(v));
  inp.classList.add(exact || near ? "right" : "wrong");
  gxFinish(exact || near, ex.ans[0], near);
}
function gxCheckOrder(skip) {
  if (SES.answered) return;
  const ex = SES.items[SES.i].ex, toks = ex.s.split(" ");
  const said = SES.ord.map(i => toks[i]).join(" ");
  const ok = !skip && said === ex.s;
  $("ord-ans").classList.add(ok ? "right" : "wrong");
  document.querySelectorAll("#ord-pool .tok, #ord-ans .tok").forEach(t => t.disabled = true);
  gxFinish(ok, ex.s);
}
function gxGood(it) {
  tick(); SES.right++; SES.xp += 10;
  const arr = S.gx[it.code] || (S.gx[it.code] = []);
  const was = gxDone(it.code);
  arr[it.i] = true;
  const k = it.code + "#" + it.i;
  if (S.gxm[k]) delete S.gxm[k];
  dayRec().rev++; S.acc[0]++; S.acc[1]++;
  skillLog(SES.sk, true, 10);
  addXP(10);
  if (!was && gxDone(it.code)) SES.topicDone = it.code;
  CatLife.mood(sCat(), "happy", 1000);
}
function gxBad(it) {
  tick();
  S.gxm[it.code + "#" + it.i] = 1;
  dayRec().rev++; S.acc[1]++;
  skillLog(SES.sk, false);
  save();
  CatLife.mood(sCat(), "sad", 1600);
  const key = it.code + "#" + it.i;
  if (!SES.re.has(key) && SES.items.length < 40) { SES.re.add(key); SES.items.push(it); }
}
const sCat = () => $("s-cat").querySelector(".cat");
function good() { tick(); const w = SES.items[SES.i]; SES.right++; SES.xp += 10; grade(w, true); skillLog(SES.sk, true, 10); lsmHit(w, SES.m); addXP(10); CatLife.mood(sCat(), "happy", 1000); }
function bad() {
  tick();
  const w = SES.items[SES.i];
  grade(w, false);
  skillLog(SES.sk, false);
  lsmMiss(w, SES.m);
  CatLife.mood(sCat(), "sad", 1600);
  // Show a missed word once more at the end of the session
  if (!SES.re.has(w.tr) && SES.items.length < 40) { SES.re.add(w.tr); SES.items.push(w); }
}
function nextStep() { micStop(true); SES.i++; renderStep(); }
function renderResult() {
  const n = SES.items.length;
  $("s-bar").style.width = "100%";
  $("s-count").textContent = n + "/" + n;
  if (!SES.done) {
    SES.done = true;
    S.sessions++;
    if (SES.right === n && n >= 8) S.perfect++;
    if (SES.mode === "role" && SES.right >= n / 2) S.roles = (S.roles || 0) + 1;
    tick(); save();
  }
  const r = SES.right / n;
  const title = r === 1 ? "Mükemmel! Hammasi toʻgʻri" : r >= 0.7 ? "Harika! Juda yaxshi" : r >= 0.4 ? "İyi! Yaxshi boshlanish" : "Pes etme! Taslim boʻlmang";
  const fresh = ACH.filter(a => achDone(a) && !SES.had.includes(a.id));
  stage.innerHTML = `<div class="result stage" style="flex:none;overflow:visible">
    <div>${mascot(r >= 0.7 ? "trophy" : "sit")}</div>
    <div class="score">${SES.right}/${n}</div>
    <h2>${esc(title)}</h2>
    <p>${r >= 0.7 ? "Pamuk sizdan faxrlanadi!" : "Pamuk aytadi: xatolar ham oʻrganishning bir qismi."}</p>
    <p class="muted">Siz bugun yana bir qadam qoʻydingiz — bepul va mustaqil. Ertaga ham kutamiz!</p>
    <p>+${SES.xp} XP · bugun ${S.dayXp}/${S.goal} XP · ${streakNow()} kun ketma-ket</p>
    <p>Takrorlash navbatida: ${dueWords().length} ta · Xatolar daftarida: ${mistakeWords().length} ta</p>
    ${SES.topicDone ? `<div class="tags" style="justify-content:center"><span class="tag green-t">${ICON.check}${esc(SES.topicDone)} mavzusi tugallandi</span></div>` : ""}
    ${fresh.length ? `<div class="tags" style="justify-content:center">${fresh.map(a => `<span class="tag violet-t">${ICON.star}Yangi yutuq: ${esc(a.t)}</span>`).join("")}</div>` : ""}
  </div>`;
  CatLife.scan();
  setTimeout(() => CatLife.mood(stage.querySelector(".cat"), r >= 0.7 ? "happy" : "sad", 1500), 250);
  foot.innerHTML = `<button class="btn btn-ghost" data-act="close-session">Yopish</button>${SES.mode === "gx" ? (() => { const nx = GX_CODES[GX_CODES.indexOf(SES.u) + 1]; return nx ? `<button class="btn btn-grad" data-act="gx-start" data-c="${nx}">Keyingi: ${esc(nx)}</button>` : ""; })() : ["review", "mistakes", "gxm", "lmis", "smis"].includes(SES.mode) ? "" : `<button class="btn btn-grad" data-act="again">Yana mashq</button>`}`;
}

/* ---------- Events ---------- */
document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]");
  if (!b) return;
  const act = b.dataset.act;
  if (act === "sheet-close") { if (e.target === b && !$("sheet").dataset.locked) closeSheet(); return; }
  if (act === "welcome-close") { hideWelcome(); return; }
  if (act === "say") speak(b.dataset.t, b.classList.contains("say") ? b : null);
  else if (act === "go") { go(b.dataset.to); if (b.dataset.focus) setTimeout(() => $("q") && $("q").focus(), 50); }
  else if (act === "start") startSession(b.dataset.mode, b.dataset.u || "all");
  else if (act === "modes") modeSheet(b.dataset.u, b.dataset.title);
  else if (act === "cat") { CAT = b.dataset.c; route(); }
  else if (act === "gx-lv") { GX_LV = b.dataset.l; const y = window.scrollY; route(); window.scrollTo(0, y); }
  else if (act === "guide-lv") { GUIDE_LV = b.dataset.l; const y = window.scrollY; route(); window.scrollTo(0, y); }
  else if (act === "rank-tab") { RANK_TAB = b.dataset.t; route(); }
  else if (act === "letter") {
    letterSel = +b.dataset.i;
    const y = window.scrollY; route(); window.scrollTo(0, y);
    speak(LETTERS[letterSel][1]);
  }
  else if (act === "theme") {
    const v = b.dataset.v;
    try { if (v === "auto") localStorage.removeItem("ty-theme"); else localStorage.setItem("ty-theme", v); } catch (err) {}
    if (v === "auto") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = v;
    const y = window.scrollY; route(); window.scrollTo(0, y);
  }
  else if (act === "goal") { S.goal = +b.dataset.v; save(); const y = window.scrollY; route(); window.scrollTo(0, y); }
  else if (act === "anon") {
    S.anon = S.anon === false; save();
    if (S.anon) statsPush(true); else if (db && USER) db.collection("stats").doc(USER.uid).delete().catch(() => {});
    toast(S.anon ? "Anonim statistika yoqildi" : "Anonim statistika oʻchirildi, maʼlumotlaringiz oʻchirildi");
    const y = window.scrollY; route(); window.scrollTo(0, y);
  }
  else if (act === "admin-reload") { ADMIN_DATA = null; route(); }
  else if (act === "copy-uid" && USER) { try { navigator.clipboard.writeText(USER.uid).then(() => toast("UID nusxalandi"), () => toast(USER.uid)); } catch (err) { toast(USER.uid); } }
  else if (act === "pub") {
    S.pub = !S.pub; save(); RANK_CACHE = {};
    if (!S.pub && db && USER) db.collection("league").doc(USER.uid).delete().catch(() => {});
    const y = window.scrollY; route(); window.scrollTo(0, y);
  }
  else if (act === "gq") {
    const box = b.closest(".gq");
    if (box.dataset.done) return;
    const gi = +location.hash.slice(9) - 1, g = GRAMMAR[gi], qi = +b.dataset.q, q = g.quiz[qi];
    const ok = +b.dataset.o === q.a;
    box.dataset.done = "1";
    box.querySelectorAll(".opt").forEach(o => { if (+o.dataset.o === q.a) o.classList.add("right"); });
    const fb = box.querySelector(".feedback");
    const r = S.gram[g.id] || (S.gram[g.id] = []);
    if (ok) {
      fb.className = "feedback ok"; fb.textContent = "Doğru! Toʻgʻri.";
      if (!r[qi]) { r[qi] = true; addXP(5); if (gramDone(g)) toast("Mavzu tugallandi! Tebrikler"); }
      save();
    } else {
      b.classList.add("wrong");
      fb.className = "feedback no";
      fb.innerHTML = `Toʻgʻri javob: <b lang="tr">${esc(q.o[q.a])}</b> <button class="link" data-act="gq-retry" data-q="${qi}">Qayta urinish</button>`;
    }
  }
  else if (act === "gq-retry") {
    const gi = +location.hash.slice(9) - 1, qi = +b.dataset.q;
    $("gq-" + qi).outerHTML = gqHtml(GRAMMAR[gi], qi);
  }
  else if (act === "photo") $("photo-input").click();
  else if (act === "sheet-x") closeSheet();
  else if (act === "tr-go") translateNow();
  else if (act === "tr-swap") { TR_DIR = TR_DIR === "tr" ? "uz" : "tr"; if (TR_OUT && TR_OUT.text) TR_TEXT = TR_OUT.text; TR_OUT = null; route(); }
  else if (act === "tr-clear") { TR_TEXT = ""; TR_OUT = null; route(); setTimeout(() => $("tr-src") && $("tr-src").focus(), 30); }
  else if (act === "tr-say") speak($("tr-src").value);
  else if (act === "tr-copy") { try { navigator.clipboard.writeText(TR_OUT.text).then(() => toast("Nusxa olindi"), () => toast("Nusxa olib boʻlmadi")); } catch (err) { toast("Nusxa olib boʻlmadi"); } }
  else if (act === "tr-hist") { const h = trHistory()[+b.dataset.i]; TR_DIR = h.d; TR_TEXT = h.s; TR_OUT = { text: h.t }; route(); }
  else if (act === "tr-hist-clear") { try { localStorage.removeItem("ty-tr-hist"); } catch (err) {} route(); }
  else if (act === "tr-key") {
    const inp = $("tr-src"), st = inp.selectionStart ?? inp.value.length, en = inp.selectionEnd ?? st;
    inp.value = inp.value.slice(0, st) + b.dataset.k + inp.value.slice(en); TR_TEXT = inp.value;
    inp.focus(); inp.setSelectionRange(st + 1, st + 1);
  }
  else if (act === "profile-edit") profileSheet(false);
  else if (act === "gender" || act === "ps-gender") b.parentElement.querySelectorAll("[role=radio]").forEach(r => r.setAttribute("aria-checked", String(r === b)));
  else if (act === "ps-save") {
    const g = document.querySelector('[data-act="ps-gender"][aria-checked="true"]'), bd = readBirth("ps");
    if (!g) { $("ps-err").textContent = "Jinsingizni tanlang."; return; }
    if (bd.err) { $("ps-err").textContent = bd.err; return; }
    b.disabled = true;
    saveProfile({ gender: g.dataset.g, birth: bd.v }).then(() => { $("sheet").dataset.locked = ""; closeSheet(true); toast("Saqlandi"); route(); });
  }
  else if (act === "photo-remove") { setMyPhoto(""); const y = window.scrollY; route(); window.scrollTo(0, y); }
  else if (act === "auth-tab") setAuthTab(b.dataset.t);
  else if (act === "auth-google") googleSignIn();
  else if (act === "auth-reset") resetPassword();
  else if (act === "logout") { ADMIN = false; ADMIN_DATA = null; auth.signOut(); go("home"); }
  else if (act === "verify-again") { USER.sendEmailVerification().then(() => toast("Xat yuborildi. Pochtangizni tekshiring")).catch(err => toast(authMsg(err))); }
  else if (act === "delete-ask") {
    $("del-box").innerHTML = `<div class="notice"><div><b>Hisob butunlay oʻchirilsinmi?</b> Barcha natijalaringiz yoʻqoladi va buni qaytarib boʻlmaydi.</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><button class="btn btn-ghost" data-act="go" data-to="profile">Bekor qilish</button><button class="btn btn-danger" data-act="delete-yes">Ha, oʻchirish</button></div></div>`;
  }
  else if (act === "delete-yes") deleteAccount(b);
  else if (act === "close-session") closeSession();
  else if (act === "again") startSession(SES.mode, SES.u);
  else if (act === "mic") micToggle();
  else if (act === "ls-play") speak(b.dataset.t, null, b.dataset.slow ? 0.55 : 0.85);
  else if (act === "ls-ans") lsPick(+b.dataset.o, b);
  else if (act === "ls-check") lsCheck();
  else if (act === "ls-skip") lsCheck(true);
  else if (act === "listen-modes") listenSheet();
  else if (act === "speak-modes") speakSheet();
  else if (act === "write-modes") writeSheet();
  else if (act === "wr-check") wrRun(b.dataset.id, b.dataset.key);
  else if (act === "wr-open") { KTAB = "ex"; closeSheet(true); }
  else if (act === "sheet-close-link") closeSheet(true);
  else if (act === "sk-go") skGo(b.dataset.s);
  else if (act === "say-skip") sayFinish(false, true);
  else if (act === "flip") $("flip").classList.toggle("on");
  else if (act === "card-know") { good(); nextStep(); }
  else if (act === "card-again") {
    tick();
    const w = SES.items[SES.i];
    if (srs(w)) grade(w, false);
    if (!SES.re.has(w.tr)) { SES.re.add(w.tr); SES.items.push(w); }
    nextStep();
  }
  else if (act === "answer") {
    if (SES.answered) return;
    SES.answered = true;
    const ok = b.dataset.ok === "1";
    document.querySelectorAll(".opt").forEach(o => { if (o.dataset.ok === "1") o.classList.add("right"); });
    const fb = $("fb"), rv = $("ls-reveal");
    if (rv) rv.hidden = false;
    if (ok) { good(); fb.className = "feedback ok"; fb.textContent = "Doğru! Toʻgʻri javob."; }
    else { bad(); b.classList.add("wrong"); fb.className = "feedback no"; fb.innerHTML = `Yanlış. Toʻgʻrisi: <b>${esc(SES.correct.tr)}</b> — ${esc(SES.correct.uz)}`; }
    const nbtn = foot.querySelector("[data-act=next]"); nbtn.disabled = false; nbtn.focus();
  }
  else if (act === "next") nextStep();
  else if (act === "k-lv") { KLV = b.dataset.l; kRerender(); }
  else if (act === "k-tab") { KTAB = b.dataset.t; route(); const t = document.querySelector(".k-tabs"); if (t) window.scrollTo(0, t.getBoundingClientRect().top + window.scrollY - 70); }
  else if (act === "k-check") { const inp = $(`ki-${b.dataset.id}-${b.dataset.key}`); kSubmit(b.dataset.id, b.dataset.key, inp.value); kRerender(); }
  else if (act === "k-dy") { kSubmit(b.dataset.id, b.dataset.key, b.dataset.v); kRerender(); }
  else if (act === "k-reveal") {
    const id = b.dataset.id, key = b.dataset.key, u = KU[id], [n, k] = key.split("-");
    const right = n === "r" ? u.reading.ans[k] : u.exercises.find(x => String(x.n) === n).ans[k];
    b.outerHTML = `<span class="muted">Namuna: <b lang="tr">${esc(right)}</b></span> <button class="link" data-act="k-self" data-id="${id}" data-key="${key}">Men ham shunday yozdim ✓</button>`;
  }
  else if (act === "k-self") { const st = kState(b.dataset.id); if (st.e[b.dataset.key] !== 1) { st.e[b.dataset.key] = 1; skillLog("w", true, 5); addXP(5); pamukSay("happy", praise()); } kRerender(); }
  else if (act === "k-tq") { KTEST_ANS[+b.dataset.i] = +b.dataset.o; b.parentElement.querySelectorAll(".opt").forEach(o => o.classList.toggle("picked", o === b)); }
  else if (act === "k-test-done") ktFinish(b.dataset.l);
  else if (act === "kt-l") { KT_ANS.l[+b.dataset.i] = +b.dataset.o; b.parentElement.querySelectorAll(".opt").forEach(o => o.classList.toggle("picked", o === b)); }
  else if (act === "kt-mic") ktMic(b.dataset.l, +b.dataset.i, b);
  else if (act === "pl-r" || act === "pl-l") { plGet().ans[act.slice(3)][+b.dataset.i] = +b.dataset.o; b.parentElement.querySelectorAll(".opt").forEach(o => o.classList.toggle("picked", o === b)); }
  else if (act === "pl-mic") plMic(+b.dataset.i, b);
  else if (act === "pl-done") plFinish();
  else if (act === "pl-again") { PL = null; route(); window.scrollTo(0, 0); }
  else if (act === "pl-apply") plApply(b.dataset.l);
  else if (act === "pl-skip") { S.place = { at: todayKey(), skipped: 1 }; save(); route(); }
  else if (act === "k-test-again") { KTEST_ANS = {}; KTEST_RES = null; KT_GEN[b.dataset.l] = null; KT_ANS = { lv: b.dataset.l, l: {}, w: {}, s: {} }; route(); window.scrollTo(0, 0); }
  else if (act === "say-seq") speakSeq(JSON.parse(b.dataset.lines));
  else if (act === "cel-next") nextCelebrate();
  else if (act === "share") shareSite(b.dataset.text);
  else if (act === "install") doInstall();
  else if (act === "install-hide") { try { localStorage.setItem("ty-install-hide", "1"); } catch (err) {} kRerender(); }
  else if (act === "onb-next") { if (ONB_I < ONB.length - 1) { ONB_I++; showOnboard(); } else endOnboard(); }
  else if (act === "onb-skip") endOnboard();
  else if (act === "gx-start") startSession("gx", b.dataset.c);
  else if (act === "gx-ans") {
    if (SES.answered) return;
    const ex = SES.items[SES.i].ex, ok = +b.dataset.o === ex.a;
    document.querySelectorAll(".opt").forEach(o => { o.disabled = true; if (+o.dataset.o === ex.a) o.classList.add("right"); });
    if (!ok) b.classList.add("wrong");
    gxFinish(ok, ex.o[ex.a]);
  }
  else if (act === "gx-check") gxCheckType();
  else if (act === "gx-order") gxCheckOrder();
  else if (act === "gx-skip") { const ex = SES.items[SES.i].ex; if (ex.t === "t") gxCheckType(true); else gxCheckOrder(true); }
  else if (act === "ord-tok") {
    if (SES.answered) return;
    const i = +b.dataset.i, inAns = b.parentElement.id === "ord-ans";
    if (inAns) { SES.ord.splice(SES.ord.indexOf(i), 1); $("ord-pool").appendChild(b); }
    else { SES.ord.push(i); $("ord-ans").appendChild(b); }
    const total = SES.items[SES.i].ex.s.split(" ").length;
    foot.querySelector("[data-act=gx-order]").disabled = SES.ord.length !== total;
  }
  else if (act === "type-check") checkType();
  else if (act === "type-skip") checkType(true);
  else if (act === "key") {
    const inp = $("type-input");
    const s = inp.selectionStart ?? inp.value.length, en = inp.selectionEnd ?? s;
    inp.value = inp.value.slice(0, s) + b.dataset.k + inp.value.slice(en);
    inp.focus(); inp.setSelectionRange(s + 1, s + 1);
  }
});
document.addEventListener("change", e => {
  if (e.target.dataset && e.target.dataset.act === "k-match") { kSubmit(e.target.dataset.id, e.target.dataset.key, e.target.value); kRerender(); }
});
let kWriteT;
document.addEventListener("input", e => {
  if (!e.target.dataset || e.target.dataset.act !== "k-write") return;
  const st = kState(e.target.dataset.id), key = e.target.dataset.key; st.v[key] = e.target.value;
  clearTimeout(kWriteT); kWriteT = setTimeout(save, 800);
});
document.addEventListener("input", e => {
  if (e.target.dataset && e.target.dataset.act === "kt-w") KT_ANS.w[+e.target.dataset.i] = e.target.value;
  if (e.target.dataset && e.target.dataset.act === "pl-w") plGet().ans.w[+e.target.dataset.i] = e.target.value;
});
document.addEventListener("keydown", e => {
  if (e.key === "Enter" && e.target.classList && e.target.classList.contains("k-input")) { const btn = e.target.parentElement.querySelector("[data-act=k-check]"); if (btn) btn.click(); }
});
document.addEventListener("change", async e => {
  if (e.target.id !== "photo-input" || !e.target.files[0]) return;
  try {
    const data = await processPhoto(e.target.files[0]);
    await setMyPhoto(data);
    toast("Rasm saqlandi");
  } catch (err) { toast("Bu faylni rasm sifatida ochib boʻlmadi"); }
  const y = window.scrollY; route(); window.scrollTo(0, y);
});
document.addEventListener("input", e => {
  if (e.target.id === "tr-src") { TR_TEXT = e.target.value; $("tr-count").textContent = TR_TEXT.length + "/500"; return; }
  if (e.target.id === "gq") { GUIDE_Q = e.target.value; $("guide-hits").innerHTML = guideHits(); return; }
  if (e.target.id !== "q") return;
  Q = e.target.value;
  $("search-results").innerHTML = searchResults();
  $("units-block").hidden = !!Q.trim();
});
document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  if (!$("sheet").hidden) { if (!$("sheet").dataset.locked) closeSheet(); } else if (SES) closeSession();
});

/* ---------- Accounts (Firebase) ---------- */
const FB = !!(window.firebase && window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey);
let auth = null, db = null, USER = null, USERNAME = "", PENDING_NAME = "", cloudTimer;
function cloudSave() {
  if (!USER || !db) return;
  clearTimeout(cloudTimer);
  cloudTimer = setTimeout(() => {
    const ts = firebase.firestore.FieldValue.serverTimestamp();
    db.collection("users").doc(USER.uid).set({ progress: S, updatedAt: ts }, { merge: true }).catch(() => {});
    if (S.pub) {
      const name = ((USERNAME || "").trim().split(/\s+/)[0] || "Oʻquvchi").slice(0, 20);
      db.collection("league").doc(USER.uid).set({ name, week: S.week, wxp: S.wxp, xp: S.xp, streak: streakNow() }).catch(() => {});
    }
    statsPush();
  }, 1500);
}
const authEl = $("auth");
let authMode = "login";
const AUTH_ERR = {
  "auth/invalid-email": "Elektron pochta manzili notoʻgʻri yozilgan.",
  "auth/missing-email": "Elektron pochtani kiriting.",
  "auth/missing-password": "Parolni kiriting.",
  "auth/weak-password": "Parol kamida 6 ta belgidan iborat boʻlsin.",
  "auth/email-already-in-use": "Bu pochta bilan allaqachon roʻyxatdan oʻtilgan. “Kirish” ni tanlang.",
  "auth/invalid-credential": "Pochta yoki parol notoʻgʻri.",
  "auth/invalid-login-credentials": "Pochta yoki parol notoʻgʻri.",
  "auth/wrong-password": "Pochta yoki parol notoʻgʻri.",
  "auth/user-not-found": "Bu pochta bilan hisob topilmadi. Avval roʻyxatdan oʻting.",
  "auth/too-many-requests": "Juda koʻp urinish boʻldi. Birozdan keyin qayta urinib koʻring.",
  "auth/network-request-failed": "Internetga ulanib boʻlmadi. Aloqani tekshiring.",
  "auth/unauthorized-domain": "Bu sayt manzili Firebase sozlamalarida ruxsat etilmagan.",
  "auth/operation-not-allowed": "Bu kirish usuli Firebase’da hali yoqilmagan.",
  "auth/account-exists-with-different-credential": "Bu pochta boshqa usul bilan roʻyxatdan oʻtgan. Oʻsha usul bilan kiring."
};
const authMsg = e => AUTH_ERR[e && e.code] || ("Xatolik yuz berdi" + (e && e.code ? ` (${e.code})` : "") + ". Qayta urinib koʻring.");
function authError(e, ok) {
  const el = $("auth-err");
  if (e && (e.code === "auth/popup-closed-by-user" || e.code === "auth/cancelled-popup-request")) { el.textContent = ""; return; }
  el.className = "auth-err" + (ok ? " ok" : "");
  el.textContent = typeof e === "string" ? e : authMsg(e);
}
function setAuthTab(t) {
  authMode = t;
  const up = t === "signup";
  $("tab-login").setAttribute("aria-selected", String(!up));
  $("tab-signup").setAttribute("aria-selected", String(up));
  $("f-name").hidden = !up; $("f-pass2").hidden = !up; $("auth-reset").hidden = up;
  $("f-gender").hidden = !up; $("f-birth").hidden = !up;
  $("auth-speech").textContent = up ? "Tanishaylik! Men Pamuk." : "Salom! Men Pamuk.";
  $("a-pass").setAttribute("autocomplete", up ? "new-password" : "current-password");
  $("auth-submit").textContent = up ? "Roʻyxatdan oʻtish" : "Kirish";
  $("auth-err").textContent = "";
}
function showAuth(loading) {
  document.body.classList.add("locked");
  authEl.hidden = false;
  if (!$("auth-mascot").innerHTML) { $("auth-mascot").innerHTML = mascot("wave"); CatLife.scan(); }
  $("auth-loading").hidden = !loading;
  $("auth-body").hidden = !!loading;
  $("auth-body").style.display = loading ? "none" : "flex";
}
function hideAuth() { authEl.hidden = true; document.body.classList.remove("locked"); }
function busy(on) { const b = $("auth-submit"); b.disabled = on; if (on) b.textContent = "Kuting…"; else setAuthTab(authMode); }

$("auth-form").addEventListener("submit", async e => {
  e.preventDefault();
  const email = $("a-email").value.trim(), pass = $("a-pass").value;
  if (authMode === "signup") {
    const name = $("a-name").value.trim();
    if (!name) { authError("Ismingizni kiriting."); return; }
    const g = document.querySelector('#f-gender [aria-checked="true"]');
    if (!g) { authError("Jinsingizni tanlang: erkak yoki ayol."); return; }
    const bd = readBirth("b");
    if (bd.err) { authError(bd.err); return; }
    if (pass !== $("a-pass2").value) { authError("Parollar bir xil emas."); return; }
    PENDING_NAME = name;
    PENDING_PROFILE = { gender: g.dataset.g, birth: bd.v };
    busy(true);
    try {
      const cred = await auth.createUserWithEmailAndPassword(email, pass);
      await cred.user.updateProfile({ displayName: name });
      USERNAME = name;
      cred.user.sendEmailVerification().catch(() => {});
    } catch (err) { busy(false); authError(err); }
  } else {
    busy(true);
    try { await auth.signInWithEmailAndPassword(email, pass); }
    catch (err) { busy(false); authError(err); }
  }
});
const authCat = () => $("auth-mascot").querySelector(".cat");
document.addEventListener("focusin", e => {
  const c = authCat(); if (!c) return;
  if (e.target.type === "password") c.classList.add("shy");
  else c.classList.remove("shy");
});
document.addEventListener("focusout", e => {
  const c = authCat(); if (!c || e.target.type !== "password") return;
  setTimeout(() => { if (!document.activeElement || document.activeElement.type !== "password") c.classList.remove("shy"); }, 0);
});
document.addEventListener("input", e => {
  if (!["a-email", "a-name"].includes(e.target.id)) return;
  const c = authCat(); if (!c) return;
  const k = Math.min(1, e.target.value.length / 26);
  CatLife.look(c, -6 + 12 * k, 6);
});
function googleSignIn() {
  const provider = new firebase.auth.GoogleAuthProvider();
  const standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  if (standalone) { auth.signInWithRedirect(provider); return; }
  auth.signInWithPopup(provider).catch(err => {
    if (err.code === "auth/popup-blocked" || err.code === "auth/operation-not-supported-in-this-environment") auth.signInWithRedirect(provider);
    else authError(err);
  });
}
function resetPassword() {
  const email = $("a-email").value.trim();
  if (!email) { authError("Avval elektron pochtangizni yozing, keyin “Parolni unutdingizmi?” ni bosing."); $("a-email").focus(); return; }
  auth.sendPasswordResetEmail(email)
    .then(() => authError(`Parolni tiklash xati ${email} manziliga yuborildi.`, true))
    .catch(authError);
}
async function deleteAccount(btn) {
  btn.disabled = true; btn.textContent = "Oʻchirilmoqda…";
  const u = USER;
  try {
    await db.collection("league").doc(u.uid).delete().catch(() => {});
    await db.collection("avatars").doc(u.uid).delete().catch(() => {});
    await db.collection("stats").doc(u.uid).delete().catch(() => {});
    try { localStorage.removeItem("ty-photo:" + u.uid); } catch (e) {}
    await db.collection("users").doc(u.uid).delete();
    await u.delete();
    try { localStorage.removeItem(KEY + ":" + u.uid); } catch (e) {}
    toast("Hisobingiz oʻchirildi");
  } catch (e) {
    btn.disabled = false; btn.textContent = "Ha, oʻchirish";
    cloudSave();
    if (e.code === "auth/requires-recent-login") toast("Xavfsizlik uchun hisobdan chiqib, qayta kiring va yana urinib koʻring");
    else toast(authMsg(e));
  }
}
async function loadCloud(u) {
  KEYU = KEY + ":" + u.uid;
  const local = loadLocal(KEYU);
  USERNAME = u.displayName || PENDING_NAME || "";
  const ref = db.collection("users").doc(u.uid);
  try {
    const snap = await ref.get();
    const d = snap.exists ? snap.data() : null;
    if (d && d.name) USERNAME = d.name;
    PROFILE = { gender: (d && d.gender) || "", birth: (d && d.birth) || "" };
    if (PENDING_PROFILE) { PROFILE = PENDING_PROFILE; PENDING_PROFILE = null; }
    const cloud = d && d.progress ? Object.assign(blank(), d.progress) : null;
    S = migrate(cloud && cloud.xp >= local.xp ? cloud : local);
    const base = { name: USERNAME, email: u.email || "", progress: S, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
    if (PROFILE.gender) { base.gender = PROFILE.gender; base.birth = PROFILE.birth; }
    if (!d) base.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    await ref.set(base, { merge: true });
  } catch (e) {
    S = local;
    toast("Natijalarni serverdan yuklab boʻlmadi. Internetni tekshiring");
  }
  try { localStorage.setItem(KEYU, JSON.stringify(S)); } catch (e) {}
  cloudSave();
  adminCheck(u.uid);
  loadMyPhoto();
  db.collection("avatars").doc(u.uid).get().then(d => {
    const ph = d.exists ? d.data().photo || "" : "";
    if (ph && ph !== MYPHOTO) { MYPHOTO = ph; try { localStorage.setItem(photoKey(), ph); } catch (e) {} route(); }
    else if (!ph && MYPHOTO) setMyPhoto(MYPHOTO);
  }).catch(() => {});
}

/* ---------- Boot ---------- */
S = loadLocal(KEY);
loadMyPhoto();
try { PROFILE = Object.assign(PROFILE, JSON.parse(localStorage.getItem("ty-profile") || "{}")); } catch (e) {}
document.querySelector("#f-birth .birth").innerHTML = birthSelects("b", "");
if (FB) {
  firebase.initializeApp(window.FIREBASE_CONFIG);
  auth = firebase.auth(); auth.languageCode = "uz";
  db = firebase.firestore();
  showAuth(true);
  auth.getRedirectResult().catch(err => { showAuth(false); authError(err); });
  auth.onAuthStateChanged(async u => {
    if (!u) {
      USER = null; USERNAME = ""; S = blank(); KEYU = KEY; RANK_CACHE = {}; MYPHOTO = ""; PROFILE = { gender: "", birth: "" };
      try { sessionStorage.removeItem("ty-welcomed"); } catch (e) {}
      if (SES) closeSession();
      showAuth(false); setAuthTab(authMode);
      return;
    }
    showAuth(true);
    USER = u;
    await loadCloud(u);
    hideAuth();
    route();
    if (!PROFILE.gender || !PROFILE.birth) profileSheet(true);
    else showWelcome();
  });
} else {
  route();
  showWelcome();
}
if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
