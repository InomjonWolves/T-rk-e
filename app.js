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
    week: "", wxp: 0, goal: 50, pub: true
  };
}
let S = blank();
let KEYU = KEY;
function loadLocal(key) {
  let v = blank();
  try { const raw = localStorage.getItem(key); if (raw) v = Object.assign(blank(), JSON.parse(raw)); } catch (e) {}
  return migrate(v);
}
function save() { try { localStorage.setItem(KEYU, JSON.stringify(S)); } catch (e) {} cloudSave(); }

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
const unitProgress = ui => { const ws = unitWords(ui); return ws.filter(w => known(w) >= 2).length / ws.length; };
const learnedCount = () => ALL.filter(w => known(w) >= 2).length;
const gramDone = g => { const r = S.gram[g.id] || []; return g.quiz.every((q, i) => r[i]); };
const gramCount = () => GRAMMAR.filter(gramDone).length;

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

/* ---------- Achievements ---------- */
const ACH = [
  { id: "first", t: "Birinchi qadam", d: "1 ta mashq", v: () => S.sessions, n: 1, c: "violet", ico: "flag" },
  { id: "w50", t: "50 ta soʻz", d: "oʻrganildi", v: learnedCount, n: 50, c: "sky", ico: "book" },
  { id: "w200", t: "200 ta soʻz", d: "oʻrganildi", v: learnedCount, n: 200, c: "green", ico: "crown" },
  { id: "s3", t: "3 kun", d: "ketma-ket", v: () => S.best, n: 3, c: "orange", ico: "flame" },
  { id: "s7", t: "1 hafta", d: "ketma-ket", v: () => S.best, n: 7, c: "orange", ico: "flame" },
  { id: "s30", t: "1 oy", d: "ketma-ket", v: () => S.best, n: 30, c: "pink", ico: "flame" },
  { id: "gram", t: "Grammatika", d: "10 mavzu", v: gramCount, n: GRAMMAR.length, c: "violet", ico: "cap" },
  { id: "xp1k", t: "1000 XP", d: "toʻplandi", v: () => S.xp, n: 1000, c: "teal", ico: "star" },
  { id: "perfect", t: "Mukammal", d: "xatosiz mashq", v: () => S.perfect, n: 1, c: "pink", ico: "target" }
];
const achDone = a => a.v() >= a.n;

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
  globe: sv('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>')
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
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
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
function closeSheet() { $("sheet").hidden = true; }

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
      <button class="icon-btn" data-act="go" data-to="lessons" data-focus="search" aria-label="Soʻz qidirish">${ICON.search}</button>
      <a href="#profile" aria-label="Profil" style="border-radius:50%">${avatarHTML(MYPHOTO, USER ? USER.uid : "me")}</a>
    </div>
  </header>`;
}
function greeting() {
  const h = new Date().getHours();
  const g = h < 11 ? ["Günaydın", "Xayrli tong"] : h < 17 ? ["İyi günler", "Xayrli kun"] : h < 22 ? ["İyi akşamlar", "Xayrli kech"] : ["İyi geceler", "Xayrli tun"];
  const name = (USERNAME || "").split(" ")[0];
  return `<div class="greet"><small lang="tr">${g[0]} · ${g[1]}</small><h1>${name ? esc(name) : "Xush kelibsiz"}</h1></div>`;
}
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
      ${showUnit ? `<div style="margin-top:4px"><span class="tag ${c.color}-t">${pad(w.unit + 1)} · ${esc(UNITS[w.unit].uz)}</span></div>` : ""}
    </div>
    ${wordState(w)}
  </div>`;
}
function modeSheet(u, title) {
  openSheet(`<h3>${esc(title)}</h3>
    <button class="mode glass" data-act="start" data-mode="cards" data-u="${u}"><span class="ico violet-t">${ICON.cards}</span><span><b>Kartochkalar</b><span>Koʻring, agʻdaring, eslang</span></span>${ICON.chev}</button>
    <button class="mode glass" data-act="start" data-mode="quiz" data-u="${u}"><span class="ico sky-t">${ICON.quiz}</span><span><b>Test</b><span>4 ta variantdan toʻgʻrisini tanlang</span></span>${ICON.chev}</button>
    <button class="mode glass" data-act="start" data-mode="type" data-u="${u}"><span class="ico pink-t">${ICON.type}</span><span><b>Yozish</b><span>Turkcha yozing: ç, ş, ğ, ı tugmalari bor</span></span>${ICON.chev}</button>`);
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
function bookCard() {
  const last = S.bookPage || 0;
  return `<a class="book-card glass" href="#book">
    <span class="book-cover"><img src="book/p01.webp" alt="" loading="lazy"></span>
    <span><span class="tag pink-t">${ICON.book}Qoʻllanma · ${BOOK.pages} bet</span>
      <b style="margin-top:6px">Turk tili grammatikasi A1–B2</b>
      <span class="unit-sub">${last > 3 ? `${last}-betda toʻxtagansiz · davom eting` : "Formulalar va misollar bilan toʻliq qoʻllanma"}</span></span>
  </a>`;
}
function viewGrammarList() {
  return `${topbar()}
  <h1 class="page-title">Darslar</h1>
  ${lessonTabs("grammar")}
  <div class="tip glass">${ICON.bulb}<div><b>Qaysidan boshlash kerak?</b>Tartib bilan boring: 1-mavzu (unli uygʻunligi) qolgan barcha qoidalarning asosi. Har mavzu oʻzbek tili bilan solishtirilgan.</div></div>
  ${bookCard()}
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

/* ---------- Grammar book (A1–B2 PDF, shown page by page) ---------- */
let BOOK_LV = "A1", BOOK_Q = "", BOOK_TEXT = null;
const bookTopic = n => { let hit = null; BOOK.toc.forEach(l => l.items.forEach(i => { if (i.page <= n && (!hit || i.page >= hit.page)) hit = i; })); return hit; };
function viewBook() {
  const lv = BOOK.toc.find(l => l.id === BOOK_LV) || BOOK.toc[1];
  let group = null;
  const rows = lv.items.map(i => {
    const head = i.group && i.group !== group ? `<div class="toc-group">${esc(i.group === "MASHQ" ? "MASHQLAR" : i.group)}</div>` : "";
    group = i.group;
    return `${head}<a class="toc-row" href="#book-${i.page}">
      ${i.code ? `<span class="code">${esc(i.code)}</span>` : `<span class="code">${ICON.book.replace("<svg", '<svg style="width:14px;height:14px;vertical-align:-2px"')}</span>`}
      <span>${i.tr ? `<b lang="tr">${esc(i.tr)}</b><small>${esc(i.uz)}</small>` : `<b>${esc(i.uz)}</b>`}</span>
      <span class="pg">${i.page}</span></a>`;
  }).join("");
  return `<div><button class="back" data-act="go" data-to="grammar">${ICON.back}Grammatika</button></div>
  <div class="book-card glass" style="grid-template-columns:90px 1fr">
    <a class="book-cover" href="#book-1" style="width:90px;height:122px"><img src="book/p01.webp" alt="Muqova"></a>
    <span><b style="font-size:20px">Turk tili grammatikasi A1–B2</b>
      <span class="unit-sub">${BOOK.pages} bet · 128 mavzu · formulalar va misollar</span>
      <span style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
        <a class="btn btn-grad" style="min-height:42px;padding:0 16px;font-size:14px;text-decoration:none" href="#book-${S.bookPage || 2}">${S.bookPage > 3 ? `${S.bookPage}-betdan davom` : "Oʻqishni boshlash"}</a>
        <a class="btn btn-ghost" style="min-height:42px;padding:0 14px;font-size:14px;text-decoration:none" href="${BOOK.pdf}" download>PDF</a>
      </span></span>
  </div>
  <label class="search glass" for="bq">${ICON.search}<span class="sr">Kitobdan qidirish</span><input id="bq" type="search" placeholder="Kitobdan qidiring: iyor, kelishik…" value="${esc(BOOK_Q)}" autocomplete="off" lang="tr"></label>
  <div id="book-hits"></div>
  <div class="chips">${BOOK.toc.map(l => `<button class="chip" data-act="book-lv" data-l="${l.id}" aria-pressed="${l.id === lv.id}">${esc(l.name)}</button>`).join("")}</div>
  <div class="level-head"><b>${esc(lv.name)}</b><span>${esc(lv.uz)}</span></div>
  <div class="glass words">${rows}</div>
  <div class="glass words">${BOOK.front.map(f => `<a class="toc-row" href="#book-${f.page}"><span class="code">${ICON.list.replace("<svg", '<svg style="width:14px;height:14px;vertical-align:-2px"')}</span><span><b>${esc(f.uz)}</b></span><span class="pg">${f.page}</span></a>`).join("")}</div>`;
}
async function bookSearch() {
  const box = $("book-hits");
  if (!box) return;
  const q = BOOK_Q.trim();
  if (q.length < 2) { box.innerHTML = ""; return; }
  if (!BOOK_TEXT) {
    box.innerHTML = `<div class="glass empty"><div class="spin"></div></div>`;
    try { BOOK_TEXT = await (await fetch("book/text.json")).json(); } catch (e) { box.innerHTML = `<div class="glass empty">Qidiruv uchun internet kerak</div>`; return; }
  }
  const nq = q.toLocaleLowerCase("tr"), ns = nq.replace(/\s+/g, "");
  const hits = [];
  BOOK_TEXT.forEach((t, i) => {
    const low = t.toLocaleLowerCase("tr");
    let at = low.indexOf(nq);
    // Suffixes are typeset apart in the book ("gel iyor um"), so also match with spaces removed
    if (at < 0 && low.replace(/\s+/g, "").includes(ns)) at = -2;
    if (at !== -1) hits.push({ p: i + 1, at, t });
  });
  if ($("bq") && $("bq").value.trim() !== q) return;
  box.innerHTML = hits.length ? `<div class="glass words">${hits.slice(0, 25).map(h => {
      const tp = bookTopic(h.p);
      let snip = "";
      if (h.at >= 0) { const a = Math.max(0, h.at - 50); snip = esc(h.t.slice(a, h.at)) + "<mark>" + esc(h.t.slice(h.at, h.at + q.length)) + "</mark>" + esc(h.t.slice(h.at + q.length, h.at + q.length + 70)); }
      else snip = esc(h.t.slice(0, 110));
      return `<a class="hit" href="#book-${h.p}"><b>${h.p}-bet${tp && tp.code ? " · " + esc(tp.code) : ""}${tp ? " · " + esc(tp.uz || tp.tr) : ""}</b><p>…${snip}…</p></a>`;
    }).join("")}</div>${hits.length > 25 ? `<p class="sub">Yana ${hits.length - 25} ta bet topildi. Soʻrovni aniqroq yozing.</p>` : ""}`
    : `<div class="glass empty"><b>“${esc(q)}” topilmadi</b></div>`;
}
function viewBookPage(n) {
  S.bookPage = n; save();
  const tp = bookTopic(n);
  return `<div class="reader-top">
    <a class="icon-btn" href="#book" aria-label="Mundarija">${ICON.list}</a>
    <div class="info"><b>${tp ? esc((tp.code ? tp.code + " · " : "") + (tp.uz || tp.tr)) : n === 1 ? "Muqova" : "Turk tili grammatikasi"}</b><small>${n} / ${BOOK.pages}</small></div>
    <a class="icon-btn" href="${BOOK.pdf}" download aria-label="PDF yuklab olish">${sv('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>')}</a>
  </div>
  <div class="book-page" id="book-page"><img src="book/p${pad(n)}.webp" alt="${n}-bet" width="936" height="1323"></div>
  <div class="pager">
    <a class="btn btn-ghost" href="#book-${Math.max(1, n - 1)}" ${n <= 1 ? 'aria-disabled="true" style="opacity:.4;pointer-events:none"' : ""}>${ICON.back}Oldingi</a>
    <input class="page-jump" id="page-jump" type="number" inputmode="numeric" min="1" max="${BOOK.pages}" value="${n}" aria-label="Betga oʻtish">
    <a class="btn btn-grad" href="#book-${Math.min(BOOK.pages, n + 1)}" ${n >= BOOK.pages ? 'aria-disabled="true" style="opacity:.4;pointer-events:none"' : ""}>Keyingi${ICON.chev.replace('class="chev"', 'style="width:20px;height:20px"')}</a>
  </div>
  <p class="sub" style="text-align:center">Barmogʻingiz bilan chapga yoki oʻngga suring. Kattalashtirish uchun ikki barmoq bilan oching.</p>`;
}
function bookAfter(n) {
  // Preload neighbours so turning pages feels instant
  [n + 1, n - 1].forEach(k => { if (k >= 1 && k <= BOOK.pages) { const im = new Image(); im.src = `book/p${pad(k)}.webp`; } });
  const pg = $("book-page");
  let sx = 0, sy = 0, multi = false;
  pg.addEventListener("touchstart", e => { multi = e.touches.length > 1; sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  pg.addEventListener("touchend", e => {
    if (multi || (window.visualViewport && visualViewport.scale > 1.05)) return;
    const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) > 60 && Math.abs(dy) < 50) go("book-" + Math.min(BOOK.pages, Math.max(1, n + (dx < 0 ? 1 : -1))));
  });
  $("page-jump").addEventListener("change", e => { const v = Math.min(BOOK.pages, Math.max(1, parseInt(e.target.value, 10) || n)); go("book-" + v); });
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
    $("rank-body").innerHTML = `<div class="glass empty">${mascot("trophy")}<b>Hali hech kim yoʻq</b><span class="muted">Birinchi boʻling: mashq qilib XP toʻplang.</span></div>`;
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
    <button class="avatar-edit" data-act="photo" aria-label="Profil rasmini oʻzgartirish">${avatarHTML(MYPHOTO, USER ? USER.uid : "me", "lg")}<span class="cam">${ICON.camera}</span></button>
    <input type="file" id="photo-input" accept="image/*" hidden>
    <div style="min-width:0"><b>${esc(USERNAME || (USER ? "Oʻquvchi" : "Mehmon"))}</b><span>${esc(USER ? USER.email || "" : "Hisobsiz rejim")}</span>
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
    <div class="section-head"><h2>Yutuqlar</h2><span class="tag violet-t">${ACH.filter(achDone).length}/${ACH.length}</span></div>
    <div class="achv">${ACH.map(a => { const on = achDone(a), v = Math.min(a.v(), a.n); return `<div class="ach glass${on ? " on" : ""}">
      <span class="medal${on ? " art " + a.c : ""}">${on ? ICON[a.ico] : ICON.lock}</span><b>${esc(a.t)}</b><small>${esc(a.d)}</small>
      ${on ? "" : `<span class="bar" aria-label="${v}/${a.n}"><i style="width:${pct(v, a.n)}%"></i></span>`}</div>`; }).join("")}</div>
  </section>

  <section class="section">
    <div class="section-head"><h2>Sozlamalar</h2></div>
    <div class="settings glass">
      <div class="set-row"><span><b>Mavzu</b><small>Yorugʻ yoki qorongʻi koʻrinish</small></span>
        <span class="mini-seg">${[["auto", "Avto"], ["light", "Yorugʻ"], ["dark", "Tun"]].map(([v, l]) => `<button data-act="theme" data-v="${v}" aria-pressed="${th === v}">${l}</button>`).join("")}</span></div>
      <div class="set-row"><span><b>Kunlik maqsad</b><small>Har kuni toʻplanadigan XP</small></span>
        <span class="mini-seg">${[30, 50, 100].map(v => `<button data-act="goal" data-v="${v}" aria-pressed="${S.goal === v}">${v}</button>`).join("")}</span></div>
      ${USER ? `<button class="set-row" data-act="pub" role="switch" aria-checked="${S.pub}"><span><b>Reytingda koʻrinish</b><small>Ismingiz va XP boshqa oʻquvchilarga koʻrinadi</small></span><span class="switch" aria-checked="${S.pub}"></span></button>` : ""}
      <a class="set-row" href="privacy.html" style="color:inherit;text-decoration:none"><span><b>Maxfiylik siyosati</b></span>${ICON.chev}</a>
    </div>
  </section>
  ${USER ? `<button class="btn btn-ghost btn-block" data-act="logout">Hisobdan chiqish</button>
  <div id="del-box" style="display:flex;flex-direction:column;gap:10px"><button class="link" data-act="delete-ask" style="align-self:center;color:var(--pink)">Hisobni oʻchirish</button></div>` : ""}`;
}

/* ---------- Router ---------- */
function route() {
  const h = (location.hash || "#home").slice(1);
  let html, tab = h, after = null;
  const m = /^lesson-(\d+)$/.exec(h), gm = /^grammar-(\d+)$/.exec(h);
  if (m && UNITS[+m[1] - 1]) { html = viewUnit(+m[1] - 1); tab = "lessons"; }
  else if (gm && GRAMMAR[+gm[1] - 1]) { html = viewGrammar(+gm[1] - 1); tab = "lessons"; }
  else if (/^book-(\d+)$/.test(h) && +h.slice(5) >= 1 && +h.slice(5) <= BOOK.pages) { const n = +h.slice(5); html = viewBookPage(n); tab = "lessons"; after = () => bookAfter(n); }
  else if (h === "book") { html = viewBook(); tab = "lessons"; after = () => bookSearch(); }
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
  const w = SES.items[SES.i], m = itemMode(w);
  if (m === "cards") renderCard(w);
  else if (m === "quiz") renderQuiz(w);
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
function nextStep() { SES.i++; renderStep(); }
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
    <p>+${SES.xp} XP · bugun ${S.dayXp}/${S.goal} XP · ${streakNow()} kun ketma-ket</p>
    <p>Takrorlash navbatida: ${dueWords().length} ta · Xatolar daftarida: ${mistakeWords().length} ta</p>
    ${fresh.length ? `<div class="tags" style="justify-content:center">${fresh.map(a => `<span class="tag violet-t">${ICON.star}Yangi yutuq: ${esc(a.t)}</span>`).join("")}</div>` : ""}
  </div>`;
  CatLife.scan();
  setTimeout(() => CatLife.mood(stage.querySelector(".cat"), r >= 0.7 ? "happy" : "sad", 1500), 250);
  foot.innerHTML = `<button class="btn btn-ghost" data-act="close-session">Yopish</button>${SES.mode === "review" || SES.mode === "mistakes" ? "" : `<button class="btn btn-grad" data-act="again">Yana mashq</button>`}`;
}

/* ---------- Events ---------- */
document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]");
  if (!b) return;
  const act = b.dataset.act;
  if (act === "sheet-close") { if (e.target === b) closeSheet(); return; }
  if (act === "say") speak(b.dataset.t, b.classList.contains("say") ? b : null);
  else if (act === "go") { go(b.dataset.to); if (b.dataset.focus) setTimeout(() => $("q") && $("q").focus(), 50); }
  else if (act === "start") startSession(b.dataset.mode, b.dataset.u || "all");
  else if (act === "modes") modeSheet(b.dataset.u, b.dataset.title);
  else if (act === "cat") { CAT = b.dataset.c; route(); }
  else if (act === "book-lv") { BOOK_LV = b.dataset.l; const y = window.scrollY; route(); window.scrollTo(0, y); }
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
  else if (act === "type-check") checkType();
  else if (act === "type-skip") checkType(true);
  else if (act === "key") {
    const inp = $("type-input");
    const s = inp.selectionStart ?? inp.value.length, en = inp.selectionEnd ?? s;
    inp.value = inp.value.slice(0, s) + b.dataset.k + inp.value.slice(en);
    inp.focus(); inp.setSelectionRange(s + 1, s + 1);
  }
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
let bookT;
document.addEventListener("input", e => {
  if (e.target.id === "bq") { BOOK_Q = e.target.value; clearTimeout(bookT); bookT = setTimeout(bookSearch, 200); return; }
  if (e.target.id !== "q") return;
  Q = e.target.value;
  $("search-results").innerHTML = searchResults();
  $("units-block").hidden = !!Q.trim();
});
document.addEventListener("keydown", e => {
  const bm = /^#book-(\d+)$/.exec(location.hash);
  if (bm && !SES && e.target.tagName !== "INPUT" && (e.key === "ArrowRight" || e.key === "ArrowLeft")) { go("book-" + Math.min(BOOK.pages, Math.max(1, +bm[1] + (e.key === "ArrowRight" ? 1 : -1)))); return; }
  if (e.key !== "Escape") return;
  if (!$("sheet").hidden) closeSheet(); else if (SES) closeSession();
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
    if (pass !== $("a-pass2").value) { authError("Parollar bir xil emas."); return; }
    PENDING_NAME = name;
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
    const cloud = d && d.progress ? Object.assign(blank(), d.progress) : null;
    S = migrate(cloud && cloud.xp >= local.xp ? cloud : local);
    const base = { name: USERNAME, email: u.email || "", progress: S, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
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
if (FB) {
  firebase.initializeApp(window.FIREBASE_CONFIG);
  auth = firebase.auth(); auth.languageCode = "uz";
  db = firebase.firestore();
  showAuth(true);
  auth.getRedirectResult().catch(err => { showAuth(false); authError(err); });
  auth.onAuthStateChanged(async u => {
    if (!u) {
      USER = null; USERNAME = ""; S = blank(); KEYU = KEY; RANK_CACHE = {}; MYPHOTO = "";
      if (SES) closeSession();
      showAuth(false); setAuthTab(authMode);
      return;
    }
    showAuth(true);
    USER = u;
    await loadCloud(u);
    hideAuth();
    route();
  });
} else {
  route();
}
if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
