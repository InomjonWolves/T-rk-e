/* Türkçe Yoʻl — Helpers, recorded audio, speech, shared page pieces.
   One of the app's scripts (js/, loaded in order by index.html); they share one global scope. */

/* ---------- Helpers ---------- */
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
// Keep suffixes like "-ga" from breaking after the hyphen
const nb = s => esc(s).replace(/(^|\s)-(\S)/g, "$1‑$2");
const pad = n => String(n).padStart(2, "0");
/* Which columns of a grammar table hold Turkish (their cells get lang="tr": the right voice for screen readers, and the
   Cyrillic interface leaves them in Latin). The header decides when it names the language; otherwise the cells vote:
   a Turkish letter or a word of the vocabulary against an Uzbek mark (oʻ gʻ ʼ q x sh ch). */
const TCOL_UZ = /oʻzbek|maʼno|vazifa|ishlatil|qachon|izoh|nima|qoida|tarjima|xususiyat|strategiya|mezon|odatda|qanday|belgi|ohang|murojaat|turi$|daraja/i;
const TCOL_TR = /^(turkcha|misol|misollar|shakl|qoʻshimcha|qoʻsh\.|ibora|iboralar|turkcha iboralar|birikma|toʻgʻri turkchasi|gap)$/i;
let TCOL_VOC = null;
function trCols(head, rows) {
  if (!TCOL_VOC) { TCOL_VOC = new Set(); ALL.forEach(w => TCOL_VOC.add(fold(w.tr))); }
  const trCell = c => /[çşğıöüâîûÇŞĞİÖÜ]/.test(c) || TCOL_VOC.has(fold(String(c).replace(/[\[\]]/g, "").split(/[\s,(/]/)[0] || ""));
  const uzCell = c => /[ʻʼqxQX]|sh|ch/i.test(c);
  return head.map((h, i) => {
    if (TCOL_UZ.test(h)) return false;
    if (TCOL_TR.test(h) || /[çşğıöüÇŞĞİÖÜ]/.test(h) || /^[a-zçşğıöü]+$/.test(h)) return true;
    let t = 0, u = 0;
    rows.forEach(r => { const c = String(r[i] == null ? "" : r[i]).trim(); if (uzCell(c)) u++; else if (trCell(c) || /^-|^\S$/.test(c)) t++; });
    return t > u;
  });
}
const tdTr = (on, html) => `<td${on ? ' lang="tr"' : ""}>${html}</td>`;
const fold = s => cyrLat(String(s)).toLocaleLowerCase("tr").replace(/[?!.,;:…]/g, "").replace(/\s+/g, " ").trim();
const plain = s => fold(s).replace(/ç/g, "c").replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ü/g, "u").replace(/â/g, "a");
const $ = id => document.getElementById(id);
let uid = 0;

const sv = (d, extra = "") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
const ICON = {
  search: sv('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  gear: sv('<circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  speak: sv('<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>'),
  chev: sv('<path d="m9 6 6 6-6 6"/>', 'class="chev"'),
  back: sv('<path d="m15 6-6 6 6 6"/>'),
  arrow: sv('<path d="M5 12h14M13 6l6 6-6 6"/>', 'stroke-width="2.4"'),
  trophy: sv('<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 14v4M8 21h8l-1-3H9z"/>'),
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
  snow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2v20M3.3 7l17.4 10M20.7 7 3.3 17M9 3.5l3 2.2 3-2.2M9 20.5l3-2.2 3 2.2M3.6 10.6l3.4-1.3-.6-3.6M20.4 13.4l-3.4 1.3.6 3.6M20.4 10.6 17 9.3l.6-3.6M3.6 13.4 7 14.7l-.6 3.6"/></svg>',
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
  users: sv('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c1.8.7 3 2.3 3.5 5.2"/>'),
  moon: sv('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>'),
  sun: sv('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  globe: sv('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
  ear: sv('<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="5" height="7" rx="2"/><rect x="16" y="14" width="5" height="7" rx="2"/>'),
  mic: sv('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>')
};
const pawPath = '<ellipse cx="12" cy="16" rx="5.2" ry="4.4"/><ellipse cx="5.8" cy="10.4" rx="2.3" ry="2.7"/><ellipse cx="9.6" cy="6.6" rx="2.3" ry="2.8"/><ellipse cx="14.4" cy="6.6" rx="2.3" ry="2.8"/><ellipse cx="18.2" cy="10.4" rx="2.3" ry="2.7"/>';
const logo = `<span class="logo" aria-hidden="true">${catSVG({ pose: "head", lite: true })}</span>`;
// The side rail of wide screens starts with the brand
{ const nb = $("nav-brand"); if (nb) nb.innerHTML = `${logo}<span>Türkçe Yoʻl</span>`; }

/* Brand cat poses used across the app (drawn in cat.js) */
const HERO_CHART = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="4" y="13" width="4" height="7" rx="1.2"/><rect x="10" y="9" width="4" height="11" rx="1.2"/><rect x="16" y="4" width="4" height="16" rx="1.2"/></svg>`;
function mascot(kind, cls = "") {
  const opt = { wave: { pose: "wave" }, cap: { pose: "sit", acc: "cap" }, trophy: { pose: "sit", acc: "stars" }, sit: { pose: "sit" }, head: { pose: "head" } }[kind] || { pose: "sit" };
  return catSVG(Object.assign({ cls: "mascot " + cls, look: catLook() }, opt));
}

function ring(p, size, stroke, color, cls) {
  const r = (size - stroke) / 2, C = 2 * Math.PI * r;
  return `<svg class="${cls}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle class="ring-bg" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}"/><circle class="ring-fg" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}" stroke="${color}" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - Math.min(1, p))}"/></svg>`;
}
function pctRing(p) {
  if (p >= 1) return `<span class="pct-ring full" title="100%">${ICON.check}<span class="sr">100%</span></span>`;
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
    <defs><linearGradient id="lg${n}" x1="0" x2="1"><stop offset="0" style="stop-color:var(--accent)"/><stop offset="1" style="stop-color:var(--teal)"/></linearGradient>
    <linearGradient id="la${n}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.18"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient></defs>
    ${grid}
    <path d="${line} L${pts[pts.length - 1][0]},${y(0)} L${pts[0][0]},${y(0)} Z" fill="url(#la${n})"/>
    <path d="${line}" fill="none" stroke="url(#lg${n})" stroke-width="4" stroke-linecap="round"/>
    ${pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="${vals[i] ? 5 : 3.5}" class="dot" stroke="url(#lg${n})" stroke-width="3"/>${vals[i] ? `<text class="val" x="${p[0]}" y="${p[1] - 10}" text-anchor="middle">${vals[i]}</text>` : ""}`).join("")}
    ${labels.map((l, i) => `<text x="${x(i)}" y="${H - 6}" text-anchor="middle">${l}</text>`).join("")}
  </svg>`;
}
function barChart(vals, labels) {
  const n = ++uid, W = 320, H = 170, L = 30, R = 6, T = 20, B = 26;
  const max = niceMax(Math.max(...vals)), slot = (W - L - R) / vals.length, bw = Math.min(26, slot * 0.6);
  const y = v => T + (H - T - B) * (1 - v / max);
  const grid = [0, 0.5, 1].map(f => `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(max * f)}" y2="${y(max * f)}"/><text x="${L - 6}" y="${y(max * f) + 4}" text-anchor="end">${Math.round(max * f)}</text>`).join("");
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Kunlik oʻqish vaqti, daqiqa: ${vals.join(", ")}">
    <defs><linearGradient id="bg${n}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" style="stop-color:#ffc94a"/><stop offset="1" style="stop-color:#ff9a1f"/></linearGradient></defs>
    ${grid}
    ${vals.map((v, i) => {
      const cx = L + slot * i + slot / 2, top = y(v);
      return `<rect x="${cx - bw / 2}" y="${T}" width="${bw}" height="${H - T - B}" rx="${bw / 2}" class="track"/>
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

/* ---------- Recorded audio ----------
   Pre-made MP3s (tools/audio-gen.js, Azure AI Speech): audio/<2 chars>/<key>.mp3, key = audioKey(text, voice).
   audio/index.txt lists the keys that exist, so the choice "recording or device voice" is made at once (no 404 wait).
   Played through one shared <audio> element (unlocked on the first tap — iPhone allows it to play later on).
   The Android app carries no recordings (they would add ~80 MB): it loads one from the site when it is played and
   keeps it in the cache "ty-audio" (audioSrc), so a word heard once plays again at once and without internet;
   the coming words of a practice are fetched ahead (audioWarm). A kept file is checked again after 30 days. */
const audioNorm = s => String(s).replace(/…/g, "").replace(/\s+/g, " ").trim();
function audioKey(text, v = "a") {
  const str = v + "|" + audioNorm(text);
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36).padStart(11, "0");
}
const audioPath = k => `${AUDIO_BASE}audio/${k.slice(0, 2)}/${k}.mp3`;
let AUDIO_SET = null, AEL = null, AUDIO_DONE = null, AUDIO_N = 0, AUDIO_P = null, AUDIO_WAITED = false;
// The list of recordings: loaded a moment after the first screen, or at once when something is to be played
function audioIndex() {
  if (AUDIO_SET || !window.fetch) return Promise.resolve();
  if (AUDIO_P) return AUDIO_P;
  const load = u => fetch(u).then(r => r.ok ? r.text() : "").then(t => { const ks = t.split("\n").filter(Boolean); if (ks.length) AUDIO_SET = new Set(ks); return ks.length; });
  // The app: the site's list (new recordings too); offline — the list packed into the app
  AUDIO_P = load(AUDIO_BASE + "audio/index.txt").catch(() => 0).then(n => { if (!n && AUDIO_BASE) return load("audio/index.txt"); }).catch(() => {}).then(() => { AUDIO_WAITED = true; });
  return AUDIO_P;
}
const AUDIO_CACHE = "ty-audio", AUDIO_TTL = 30 * DAY;
let AUDIO_URL = "";
// The app: the recording from the cache, or from the site (then kept); the plain address when the cache cannot help
async function audioCached(k, fresh) {
  const url = audioPath(k), c = await caches.open(AUDIO_CACHE);
  const hit = await c.match(url), at = hit ? +hit.headers.get("x-at") || 0 : 0;
  if (hit && (Date.now() - at < AUDIO_TTL || navigator.onLine === false)) return hit;
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(r.status);
    const blob = await r.blob(), keep = new Response(blob, { headers: { "Content-Type": "audio/mpeg", "x-at": String(Date.now()) } });
    await c.put(url, keep.clone());
    return keep;
  } catch (e) { if (hit) return hit; throw e; }
}
async function audioSrc(k) {
  const url = audioPath(k);
  if (!IS_NATIVE || !window.caches) return url;
  try { return URL.createObjectURL(await (await audioCached(k)).blob()); } catch (e) { return url; }
}
// The next recordings are fetched while the learner answers (two at a time), so a tap plays at once: in the app into
// its cache (12), on the site into the browser's own cache (6, not with data saving on)
const AUDIO_WARM = new Set();
function audioWarm(texts) {
  if (!AUDIO_SET || !window.fetch || navigator.onLine === false || (navigator.connection && navigator.connection.saveData)) return;
  const app = IS_NATIVE && window.caches;
  const ks = [...new Set(texts.filter(t => typeof t === "string" && hasRec(t)).map(t => audioKey(t)))].filter(k => !AUDIO_WARM.has(k)).slice(0, app ? 12 : 6);
  ks.forEach(k => AUDIO_WARM.add(k));
  let i = 0;
  const get = k => app ? audioCached(k) : fetch(audioPath(k), { priority: "low" }).then(r => r.blob());
  const next = () => { if (i < ks.length) get(ks[i++]).catch(() => {}).then(next); };
  next(); next();
}
const hasRec = (text, v = "a") => !!AUDIO_SET && AUDIO_SET.has(audioKey(text, v));
function audioEl() {
  if (!AEL && window.Audio) { AEL = new Audio(); AEL.preload = "auto"; }
  return AEL;
}
// iPhone: the element must first play inside a tap; after that it can play from timers and callbacks too
function audioUnlock() {
  const a = audioEl(); if (!a || a._ok) return;
  a._ok = true;
  try { a.src = "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAACAAACcQCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAAAAnGMHkkIAAAAAAAAAAAAAAAAAAAA//sQZAAP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV"; const p = a.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
}
document.addEventListener("pointerdown", audioUnlock, { capture: true, once: true });
setTimeout(audioIndex, 1200);
setTimeout(() => frzNotice(), 2500);
function audioStop() {
  AUDIO_N++;
  const a = AEL; if (a) { a.onended = a.onerror = null; try { a.pause(); } catch (e) {} }
  const d = AUDIO_DONE; AUDIO_DONE = null; if (d) d();
}
/* In the Android app the phone's own text-to-speech (plugin TextToSpeech) speaks texts without a recording:
   speechSynthesis in the WebView often has no Turkish voice or no voice at all. */
let NTTS_N = 0;
const ntts = () => nativePlugin("TextToSpeech");
function nttsStop() { NTTS_N++; const t = ntts(); if (t) try { const r = t.stop(); if (r && r.catch) r.catch(() => {}); } catch (e) {} }
// Speaks text; done() runs when it ends (not when it was stopped by another text). false if there is no plugin.
function nttsSay(text, rate, done, pitch) {
  const t = ntts(); if (!t) return false;
  const n = ++NTTS_N;
  const end = () => { if (n === NTTS_N && done) done(); };
  try { t.speak({ text, lang: "tr-TR", rate: Math.min(2, Math.max(0.3, rate)), pitch: pitch || 1, volume: 1, queueStrategy: 0 }).then(end, end); } catch (e) { end(); }
  return true;
}
function ttsCancel() { audioStop(); nttsStop(); try { speechSynthesis.cancel(); } catch (e) {} }
// Plays the recording of text; false if there is none (then the caller uses the device voice).
// If the file cannot load (offline, not cached), fallback() runs instead — the device voice.
function playRec(text, v, rate, done, fallback) {
  const a = audioEl();
  // Played before the list of recordings came (the first moments after opening): wait for it, up to 2.5 s, rather
  // than speak with the device voice a text that has a recording
  if (a && !AUDIO_SET && !AUDIO_WAITED && window.fetch) {
    audioStop(); nttsStop();
    const n = AUDIO_N;
    AUDIO_DONE = done || null;
    Promise.race([audioIndex(), new Promise(r => setTimeout(r, 2500))]).then(() => {
      AUDIO_WAITED = true;
      if (n !== AUDIO_N) return;
      AUDIO_DONE = null;
      if (!playRec(text, v, rate, done, fallback)) { if (fallback) fallback(); else if (done) done(); }
    });
    return true;
  }
  if (!a || !hasRec(text, v)) return false;
  audioStop(); nttsStop();
  try { speechSynthesis.cancel(); } catch (e) {}
  const n = AUDIO_N, k = audioKey(text, v);
  AUDIO_DONE = done || null;
  const end = () => { if (n !== AUDIO_N) return; const d = AUDIO_DONE; AUDIO_DONE = null; if (d) d(); };
  a.onended = end;
  const fail = () => { if (n !== AUDIO_N) return; AUDIO_SET.delete(k); if (fallback) { AUDIO_DONE = null; fallback(); } else end(); };
  a.onerror = fail;
  const go = src => {
    if (n !== AUDIO_N) { if (src.startsWith("blob:")) URL.revokeObjectURL(src); return; }
    if (AUDIO_URL) URL.revokeObjectURL(AUDIO_URL);
    AUDIO_URL = src.startsWith("blob:") ? src : "";
    a.src = src;
    a.playbackRate = Math.min(2, Math.max(0.5, rate)); a.defaultPlaybackRate = a.playbackRate;
    try { a.preservesPitch = true; } catch (e) {}
    const p = a.play(); if (p && p.catch) p.catch(fail);
  };
  if (IS_NATIVE && window.caches) audioSrc(k).then(go); else go(audioPath(k));
  return true;
}

/* ---------- Speech ---------- */
let voices = [];
function loadVoices() { try { voices = speechSynthesis.getVoices(); } catch (e) {} }
try { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; } catch (e) {}
/* Turkish voice settings: speed (S.tts.r: 0.75 / 1 / 1.2 × the normal rate) and the chosen voice (S.tts.v) */
const trVoices = () => voices.filter(v => (v.lang || "").toLowerCase().replace("_", "-").startsWith("tr"));
const ttsRate = () => (S.tts && S.tts.r) || 1;
function ttsVoice(alt) {
  const vs = trVoices();
  if (!vs.length) return null;
  const i = Math.max(0, vs.findIndex(v => S.tts && v.name === S.tts.v));
  return alt && vs.length > 1 ? vs[(i + 1) % vs.length] : vs[i];
}
function speak(text, btn, rate) {
  SEQ_N++;
  const clean = text.replace(/…/g, "").trim();
  const off = () => btn && btn.classList.remove("playing");
  if (btn) btn.classList.add("playing");
  const tts = () => {
    try {
      if (nttsSay(clean, (rate || 0.85) * ttsRate(), off)) return;
      if (!("speechSynthesis" in window)) { off(); toast(AUDIO_SET ? "Bu matnning audiosi hali yoʻq" : "Bu brauzerda ovoz yoʻq"); return; }
      try { speechSynthesis.cancel(); } catch (e) {}
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = "tr-TR"; u.rate = (rate || 0.85) * ttsRate();
      const v = ttsVoice();
      if (v) u.voice = v;
      if (btn) u.onend = u.onerror = off;
      speechSynthesis.speak(u);
    } catch (e) { off(); toast("Ovozni ijro etib boʻlmadi"); }
  };
  // Recording first: same speed setting, the slow "ls-play" button (0.55) plays slower too
  if (playRec(clean, "a", ttsRate() * (rate || 0.85) / 0.85, off, tts)) return;
  audioStop();
  tts();
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
function avatarHTML(photo, seed, cls = "", fr) {
  const av = photo
    ? `<span class="avatar ${cls}"><img src="${esc(photo)}" alt=""></span>`
    : `<span class="avatar cat-av ${avClass(seed || "me")} ${cls}">${catSVG({ pose: "head", lite: true })}</span>`;
  return fr ? framed(av, fr.n, fr) : av;
}
const photoKey = () => "ty-photo" + (USER ? ":" + USER.uid : EARLY ? ":" + EARLY : "");
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
    <div class="brand"><span>Türkçe Yoʻl</span></div>
    <div class="top-actions">
      <a class="icon-btn" href="#translate" aria-label="Aqlli tarjimon">${ICON.translate}</a>
      <button class="icon-btn" data-act="go" data-to="lugat" data-focus="search" aria-label="Soʻz qidirish">${ICON.search}</button>
      <a class="top-av" href="#profile" aria-label="Profil: ${lvlOf(S.xp)}-daraja, ${FRAMES[myFrame() - 1].uz} ramka">${avatarHTML(MYPHOTO, USER ? USER.uid : "me", "", { n: myFrame(), sm: true, lv: lvlOf(S.xp) })}</a>
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
  const g = greetText(), away = daysAway();
  if (away >= 3 && !isBirthday()) { g.tr = `Seni özledim${firstName() ? ", " + firstName() : ""}!`; g.uz = "Pamuk sizni sogʻindi. Bugun ozgina takrorlashdan boshlaymizmi?"; }
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
function wordRow(w, showUnit) {
  const c = catOf(w.unit);
  return `<div class="word">
    <button class="say" data-act="say" data-t="${esc(w.tr)}" aria-label="${esc(w.tr)} — tinglash">${ICON.speak}</button>
    <div style="min-width:0">
      <div class="word-tr" lang="tr">${esc(w.tr)}</div>
      <div class="word-uz">${esc(w.uz)}</div>
      ${w.note ? `<div class="word-note">${esc(w.note)}</div>` : ""}
      ${showUnit ? `<div style="margin-top:4px"><span class="tag ${c.color}-t">${UNITS[w.unit].course || UNITS[w.unit].lug ? esc((UNITS[w.unit].lug ? UNITS[w.unit].lug + " · " : "") + UNITS[w.unit].uz) : `${pad(w.unit + 1)} · ${esc(UNITS[w.unit].uz)}`}</span></div>` : ""}
    </div>
    ${wordState(w)}
  </div>`;
}
function modeSheet(u, title) {
  openSheet(`<h3>${esc(title)}</h3>
    <button class="mode glass mode-mix" data-act="start" data-mode="mix" data-u="${u}"><span class="ico orange-t">${ICON.spark}</span><span><b>Mashq qilish</b><span>Bitta mashqda hammasi: maʼno, yozish, tinglash, diktant va talaffuz</span></span>${ICON.chev}</button>
    <details class="mode-more"><summary>Faqat bitta turdagi mashq</summary>
    <button class="mode glass" data-act="start" data-mode="cards" data-u="${u}"><span class="ico violet-t">${ICON.cards}</span><span><b>Kartochkalar</b><span>Koʻring, agʻdaring, eslang</span></span>${ICON.chev}</button>
    <button class="mode glass" data-act="start" data-mode="quiz" data-u="${u}"><span class="ico sky-t">${ICON.quiz}</span><span><b>Test</b><span>4 ta variantdan toʻgʻrisini tanlang</span></span>${ICON.chev}</button>
    <button class="mode glass" data-act="start" data-mode="type" data-u="${u}"><span class="ico pink-t">${ICON.type}</span><span><b>Yozish</b><span>Turkcha soʻzni harflardan yigʻing</span></span>${ICON.chev}</button>
    <button class="mode glass" data-act="start" data-mode="listen" data-u="${u}"><span class="ico violet-t">${ICON.ear}</span><span><b>Tinglab toping</b><span>Soʻzni eshitib, maʼnosini tanlang</span></span>${ICON.chev}</button>
    <button class="mode glass" data-act="start" data-mode="dict" data-u="${u}"><span class="ico pink-t">${ICON.type}</span><span><b>Diktant</b><span>Eshitganingizni yozing</span></span>${ICON.chev}</button>
    <button class="mode glass" data-act="start" data-mode="say" data-u="${u}"><span class="ico green-t">${ICON.mic}</span><span><b>Talaffuz</b><span>${canListen() ? "Soʻzni ovoz chiqarib ayting, Pamuk tekshiradi" : "Bu brauzerda ishlamaydi: Chrome yoki Safari kerak"}</span></span>${ICON.chev}</button></details>`);
}
