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
    week: "", wxp: 0, goal: 50, pub: true, gx: {}, gxm: {}, k: {}, ktest: {}, onb: 0, trUses: 0, shared: 0, night: 0, early: 0, pron: [0, 0]
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
  const now = Date.now();
  dayRec().sec += Math.min(now - SES.last, 45000) / 1000;
  SES.last = now;
}
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
function speak(text, btn) {
  const clean = text.replace(/…/g, "").trim();
  try {
    if (!("speechSynthesis" in window)) { toast("Bu brauzerda ovoz yoʻq"); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = "tr-TR"; u.rate = 0.85;
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

  <div class="pcard glass">
    <div class="pcard-head"><b>${ICON.cap}Qoidalar mashqi</b><span>${gxDoneCount()}/${GX_CODES.length}</span></div>
    <div class="tags"><span class="tag sky-t">${esc(gxNext())}</span><span class="tag violet-t">${esc((gxTopic(gxNext()) || {}).uz || "")}</span>${gxMistakes().length ? `<span class="tag pink-t">${gxMistakes().length} ta xato</span>` : ""}</div>
    <div class="facts"><span>${ICON.list}Variant tanlash, yozish va gap tuzish</span><span>${ICON.book}Qoʻllanmadagi qoida asosida</span></div>
    <button class="plus" data-act="gx-start" data-c="${gxNext()}" aria-label="Keyingi qoida mashqi">${ICON.play}</button>
  </div>

  <div class="pcard glass">
    <div class="pcard-head"><b>${ICON.mic}Talaffuz mashqi</b>${S.pron[1] ? `<span>${pct(S.pron[0], S.pron[1])}%</span>` : ""}</div>
    <div class="facts"><span>${ICON.list}Soʻzni tinglang va ovoz chiqarib ayting</span><span>${ICON.target}Notoʻgʻri aytilgan harflar qizil boʻladi</span><span>${ICON.quiz}${S.pron[1] ? `${S.pron[0]} ta soʻz toʻgʻri aytildi` : "Mikrofon kerak · ovoz saqlanmaydi"}</span></div>
    ${canListen() ? "" : `<p class="muted" style="margin-top:6px">Brauzeringiz nutqni tanishni qoʻllamaydi. Saytni Chrome (Android, kompyuter) yoki Safari (iPhone) da oching.</p>`}
    <button class="plus" data-act="start" data-mode="say" data-u="pron" aria-label="Talaffuz mashqini boshlash" ${canListen() ? "" : "disabled"}>${ICON.play}</button>
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
      ${USER ? `<button class="set-row" data-act="pub" role="switch" aria-checked="${S.pub}"><span><b>Reytingda koʻrinish</b><small>Ismingiz va XP boshqa oʻquvchilarga koʻrinadi</small></span><span class="switch" aria-checked="${S.pub}"></span></button>` : ""}
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
const kNext = () => COURSE.units.find(u => !kDone(u.id)) || COURSE.units[0];
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
  <div class="seg glass" role="tablist">${COURSE.levels.map(l => `<button role="tab" data-act="k-lv" data-l="${l.id}" aria-selected="${l.id === lvl.id}">${l.id}</button>`).join("")}</div>
  <div class="glass pad"><b>${esc(lvl.title)}</b><p class="sub" style="margin-top:4px">${esc(lvl.intro)}</p></div>
  <div class="list">${lvl.units.map(id => kUnitRow(KU[id])).join("")}
    <a class="unit glass" href="#ktest-${lvl.id.toLowerCase()}">
      <span class="art teal"><span style="font-size:13px">TEST</span></span>
      <span class="unit-body"><span class="unit-title">${esc(lvl.test.title)}</span><span class="unit-sub">20 savol · oʻtish bali ${lvl.test.pass}%${kTestBest(lvl.id) ? ` · eng yaxshi natija ${kTestBest(lvl.id)}%` : ""}</span></span>
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
    body = dlg.map(s => `<section class="section"><div class="section-head"><h2>${esc(s.title.replace(/^Dialog:\s*/, ""))}</h2></div>${renderBlocks(s.blocks)}</section>`).join("");
  } else if (KTAB === "read") {
    const r = u.reading;
    body = `<section class="section"><div class="section-head"><h2 lang="tr">${esc(r.title || "Oʻqish matni")}</h2><button class="say" data-act="say" data-t="${esc(r.text)}" aria-label="Matnni tinglash">${ICON.speak}</button></div>
      <div class="glass pad k-read" lang="tr">${esc(r.text)}</div>
      ${r.gloss && r.gloss.length ? `<div class="k-gloss">${r.gloss.map(([a, c]) => `<span><b lang="tr">${esc(a)}</b> — ${esc(c)}</span>`).join("")}</div>` : ""}</section>
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
      <textarea class="k-text glass" data-act="k-write" data-id="${id}" data-key="${key}" rows="5" placeholder="Shu yerga yozing… (faqat oʻzingiz uchun saqlanadi)" lang="tr">${esc(val)}</textarea>
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
  const l = KLEVEL(lv), t = l.test, res = KTEST_RES && KTEST_RES.lv === lv ? KTEST_RES : null;
  let qn = 0;
  return `<div><a class="back" href="#course">${ICON.back}Kurs</a></div>
  <div class="lesson-head"><div class="tags"><span class="tag teal-t">${lv}</span><span class="tag violet-t">Oʻtish bali ${t.pass}%</span></div><h1>${esc(t.title)}</h1>
    <p class="sub">Har bir savolga javob tanlang, oxirida «Natijani koʻrish» ni bosing. Test bepul va istalgancha qayta topshirish mumkin.</p></div>
  ${res ? `<div class="glass pad k-result ${res.pct >= t.pass ? "pass" : "fail"}">${mascot(res.pct >= t.pass ? "trophy" : "sit")}<h2>${res.pct}%</h2><p>${res.pct >= t.pass ? "Tabriklaymiz! Siz bu darajani muvaffaqiyatli yakunladingiz." : "Hali biroz mashq kerak. Qiyin boʻlgan boʻlimlarni takrorlab, yana urinib koʻring."}</p></div>` : ""}
  ${t.parts.map(p => `<section class="section"><div class="section-head"><h2>${esc(p.name)}</h2></div>
    ${p.text ? `<div class="glass pad k-read" lang="tr">${esc(p.text)}</div>` : ""}
    ${p.qs.map(q => { const i = qn++, chosen = KTEST_ANS[i]; return `<div class="k-item glass">
      <div class="k-q"><b>${i + 1}.</b> <span lang="tr">${esc(q.q)}</span></div>
      <div class="k-opts">${q.o.map((o, oi) => { let cls = chosen === oi ? " picked" : ""; if (res) cls = oi === q.a ? " right" : chosen === oi ? " wrong" : ""; return `<button class="opt${cls}" data-act="k-tq" data-i="${i}" data-o="${oi}" lang="tr" ${res ? "disabled" : ""}>${esc(o)}</button>`; }).join("")}</div></div>`; }).join("")}
  </section>`).join("")}
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
  } else if (mode === "say") {
    if (!canListen()) { toast("Bu brauzer nutqni tanimaydi. Chrome yoki Safari'da oching"); return; }
    items = sayItems(u);
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
  if (w.gx) return renderGx(w);
  const m = itemMode(w);
  if (m === "cards") renderCard(w);
  else if (m === "quiz") renderQuiz(w);
  else if (m === "say") renderSay(w);
  else renderType(w);
}
// Review sessions mix modes: new words are shown as cards, known ones are tested
function itemMode(w) {
  if (SES.mode !== "review" && SES.mode !== "mistakes") return SES.mode;
  const st = srs(w);
  if (!st) return "cards";
  return typeable(w) && (st.r >= 2 || (SES.mode === "mistakes" && Math.random() < 0.4)) && Math.random() < 0.5 ? "type" : "quiz";
}
function renderCard(w) {
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
  setTimeout(() => $("type-input").focus(), 60);
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
  speak(w.tr);
  foot.innerHTML = `<button class="btn btn-grad btn-block" data-act="next">Keyingi</button>`;
}
/* ---------- Pronunciation practice ----------
   Uses the browser's own speech recognition (Web Speech API, tr-TR). Nothing is recorded or stored by the site:
   the browser returns text, and we compare it letter by letter with the target word. */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const canListen = () => !!SR;
let REC = null;
const sayable = w => !/[…\/()=;]/.test(w.tr) && w.tr.length <= 26 && /[a-zçğıöşü]/i.test(w.tr);
function sayItems(u) {
  let pool;
  if (u === "pron") {
    // Words the learner has already met; for a fresh start, the first lessons
    pool = ALL.filter(w => srs(w) && sayable(w));
    if (pool.length < 8) pool = ALL.filter(sayable).slice(0, 80);
  } else pool = pickPool(u).filter(sayable);
  return shuffle(pool).slice(0, 8);
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
  SES.tries = 0; SES.best = null;
  stage.innerHTML = `<div class="q-label">Ovoz chiqarib ayting</div>
    <div class="q-row"><div class="q-word say-target" id="say-target" lang="tr">${esc(w.tr)}</div>
      <button class="say" data-act="say" data-t="${esc(w.tr)}" aria-label="Tinglash">${ICON.speak}</button></div>
    <div class="sub">${esc(w.uz)}</div>
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
  const target = sayNorm(w.tr).out;
  let best = null;
  alts.forEach(a => { const r = sayDiff(target, heardNorm(a)); r.text = a; if (!best || r.score > best.score) best = r; });
  if (!best) return;
  SES.tries++;
  const p = Math.round(best.score * 100), fb = $("fb");
  $("heard").textContent = best.text;
  $("say-target").innerHTML = sayMarked(w.tr, best.ok);
  if (best.score >= 0.85) {
    fb.className = "feedback ok";
    fb.innerHTML = `${p === 100 ? "Mükemmel! Juda toʻgʻri aytdingiz." : "Aferin! Yaxshi aytdingiz."} <span class="tag green-t">${p}%</span>`;
    sayFinish(true);
  } else if (SES.tries < 3) {
    fb.className = "feedback no";
    fb.innerHTML = `${p >= 60 ? "Yaqin!" : "Unchalik oʻxshamadi."} <span class="tag pink-t">${p}%</span><div class="sub" style="margin-top:4px">Qizil harflarga eʼtibor bering, yana tinglab qayta ayting (${3 - SES.tries} ta urinish qoldi).</div>`;
    CatLife.mood(sCat(), "sad", 1200);
  } else {
    fb.className = "feedback no";
    fb.innerHTML = `Bu safar chiqmadi <span class="tag pink-t">${p}%</span><div class="sub" style="margin-top:4px">Keyingi safar albatta chiqadi. Qizil harflarni alohida mashq qiling.</div>`;
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
    if (ok) { S.pron[0]++; SES.right++; SES.xp += 10; addXP(10); CatLife.mood(sCat(), "happy", 1000); }
    else { save(); CatLife.mood(sCat(), "sad", 1600); }
  }
  const w = SES.items[SES.i];
  foot.innerHTML = `<button class="btn btn-ghost" data-act="say" data-t="${esc(w.tr)}">${ICON.speak}Tinglash</button><button class="btn btn-grad" data-act="next">Keyingi</button>`;
}
/* ---------- Rule exercises ---------- */
const blankHtml = q => esc(q).replace("___", '<span class="blank">&nbsp;</span>');
function renderGx(it) {
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
    setTimeout(() => $("type-input").focus(), 60);
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
  addXP(10);
  if (!was && gxDone(it.code)) SES.topicDone = it.code;
  CatLife.mood(sCat(), "happy", 1000);
}
function gxBad(it) {
  tick();
  S.gxm[it.code + "#" + it.i] = 1;
  dayRec().rev++; S.acc[1]++;
  save();
  CatLife.mood(sCat(), "sad", 1600);
  const key = it.code + "#" + it.i;
  if (!SES.re.has(key) && SES.items.length < 40) { SES.re.add(key); SES.items.push(it); }
}
const sCat = () => $("s-cat").querySelector(".cat");
function good() { tick(); const w = SES.items[SES.i]; SES.right++; SES.xp += 10; grade(w, true); addXP(10); CatLife.mood(sCat(), "happy", 1000); }
function bad() {
  tick();
  const w = SES.items[SES.i];
  grade(w, false);
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
  foot.innerHTML = `<button class="btn btn-ghost" data-act="close-session">Yopish</button>${SES.mode === "gx" ? (() => { const nx = GX_CODES[GX_CODES.indexOf(SES.u) + 1]; return nx ? `<button class="btn btn-grad" data-act="gx-start" data-c="${nx}">Keyingi: ${esc(nx)}</button>` : ""; })() : SES.mode === "review" || SES.mode === "mistakes" || SES.mode === "gxm" ? "" : `<button class="btn btn-grad" data-act="again">Yana mashq</button>`}`;
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
  else if (act === "logout") { auth.signOut(); go("home"); }
  else if (act === "verify-again") { USER.sendEmailVerification().then(() => toast("Xat yuborildi. Pochtangizni tekshiring")).catch(err => toast(authMsg(err))); }
  else if (act === "delete-ask") {
    $("del-box").innerHTML = `<div class="notice"><div><b>Hisob butunlay oʻchirilsinmi?</b> Barcha natijalaringiz yoʻqoladi va buni qaytarib boʻlmaydi.</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><button class="btn btn-ghost" data-act="go" data-to="profile">Bekor qilish</button><button class="btn btn-danger" data-act="delete-yes">Ha, oʻchirish</button></div></div>`;
  }
  else if (act === "delete-yes") deleteAccount(b);
  else if (act === "close-session") closeSession();
  else if (act === "again") startSession(SES.mode, SES.u);
  else if (act === "mic") micToggle();
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
    const fb = $("fb");
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
  else if (act === "k-self") { const st = kState(b.dataset.id); if (st.e[b.dataset.key] !== 1) { st.e[b.dataset.key] = 1; addXP(5); pamukSay("happy", praise()); } kRerender(); }
  else if (act === "k-tq") { KTEST_ANS[+b.dataset.i] = +b.dataset.o; b.parentElement.querySelectorAll(".opt").forEach(o => o.classList.toggle("picked", o === b)); }
  else if (act === "k-test-done") {
    const lv = b.dataset.l, t = KLEVEL(lv).test, qs = t.parts.flatMap(p => p.qs);
    const miss = qs.findIndex((q, i) => KTEST_ANS[i] === undefined);
    if (miss >= 0) { toast(`${miss + 1}-savolga javob tanlanmagan`); return; }
    const right = qs.filter((q, i) => KTEST_ANS[i] === q.a).length, p = Math.round(right / qs.length * 100);
    KTEST_RES = { lv, pct: p };
    const was = kTestBest(lv);
    S.ktest[lv] = Math.max(was, p);
    addXP(right * 2);
    if (p >= t.pass) pamukSay("happy", `${p}% — Tabriklaymiz! Siz ${lv} darajasini tasdiqladingiz!`); else pamukSay("sad", `${p}% — Afsus, bu safar oʻtmadi. Qiyin boʻlimlarni takrorlab, yana urinib koʻring!`);
    window.scrollTo(0, 0); route();
  }
  else if (act === "k-test-again") { KTEST_ANS = {}; KTEST_RES = null; route(); window.scrollTo(0, 0); }
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
  const st = kState(e.target.dataset.id); st.v[e.target.dataset.key] = e.target.value;
  clearTimeout(kWriteT); kWriteT = setTimeout(save, 800);
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
