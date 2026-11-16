/* Türkçe Yoʻl — the Cyrillic interface (2026-11-16). One of the app's scripts (js/, loaded in order by index.html).
   Sozlamalar → «Yozuv»: Lotin / Кирилл (this device: localStorage "ty-abc" = "cyr"). The app keeps writing Uzbek in
   Latin; in the Cyrillic mode every text that appears on the page is turned into Uzbek Cyrillic as it appears
   (a MutationObserver), while Turkish stays in Latin:
   · in an element with lang="tr" (or inside one) only a word that cannot be Turkish changes (oʻ gʻ ʼ q x, or yoki,
     va, keyin… — a table cell «a yoki ı»); data-uz — always Uzbek (an Uzbek suffix like "-lar"); data-lat — never;
   · a word with a Turkish letter (ç ş ğ ı ö ü â, c without h) is Turkish; one with an Uzbek mark (oʻ gʻ ʼ q x sh ch) is Uzbek;
   · any other word: the site's own Turkish words (kirill-lex.js, made by tools/kirill-lex.js from every Turkish text the
     app reads and every Uzbek string it shows) — Turkish only → Latin; known on both sides (bu, sen, Pamuk…) and single
     letters → like the nearest sure word of the same text, a comma list as a whole; unknown → Uzbek;
   · numbers, abbreviations (XP, SRS), brand names and suffix notation (-lAr, kitap[lar]) stay as they are.
   The original text of a node is kept (node.__lat), so switching back or a later lexicon re-reads it.
   What the learner types in Cyrillic is read as Latin (fold → cyrLat), so answers and search work in both. */
const ABC_KEY = "ty-abc";
let ABC = "lat";
try { ABC = localStorage.getItem(ABC_KEY) === "cyr" ? "cyr" : "lat"; } catch (e) {}

// Latin → Cyrillic, letter by letter (oʻ gʻ sh ch, yo yu ya ye, e → э at the start of a word and after a vowel, ʼ → ъ)
const KR_ONE = { a: "а", b: "б", d: "д", f: "ф", g: "г", h: "ҳ", i: "и", j: "ж", k: "к", l: "л", m: "м", n: "н", o: "о", p: "п", q: "қ", r: "р", s: "с", t: "т", u: "у", v: "в", x: "х", y: "й", z: "з", c: "с", w: "в", "ʼ": "ъ" };
const KR_Y = { o: "ё", u: "ю", a: "я", e: "е" };
const KR_VOW = /[aeiouаеиоуэюяёў]/;
function latCyrLow(w) {
  let out = "";
  for (let i = 0; i < w.length; i++) {
    const c = w[i], n = w[i + 1], prev = out[out.length - 1];
    if ((c === "o" || c === "g") && n === "ʻ") { out += c === "o" ? "ў" : "ғ"; i++; continue; }
    if ((c === "s" || c === "c") && n === "h") { out += c === "s" ? "ш" : "ч"; i++; continue; }
    if (c === "y" && KR_Y[n] && !(n === "o" && w[i + 2] === "ʻ")) { out += KR_Y[n]; i++; continue; }
    if (c === "e") { out += !prev || KR_VOW.test(prev) ? "э" : "е"; continue; }
    out += KR_ONE[c] || c;
  }
  return out;
}
function latCyr(w) {
  const low = w.toLowerCase(), r = latCyrLow(low);
  if (w === low) return r;
  if (w.length > 1 && w === w.toUpperCase()) return r.toUpperCase();
  return r[0].toUpperCase() + r.slice(1);
}
// Cyrillic → Latin (what the learner types; e → "e", ц → "ts", ь dropped)
const KR_BACK = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "x", ц: "ts", ч: "ch", ш: "sh", щ: "sh", ъ: "ʼ", ы: "i", ь: "", э: "e", ю: "yu", я: "ya", ў: "oʻ", қ: "q", ғ: "gʻ", ҳ: "h" };
const KR_ANY = /[Ѐ-ӿ]/;
function cyrLat(s) {
  if (!KR_ANY.test(s)) return s;
  return s.replace(/[Ѐ-ӿ]/g, c => {
    const l = c.toLowerCase(), r = KR_BACK[l];
    if (r === undefined) return c;
    return c === l ? r : r ? r[0].toUpperCase() + r.slice(1) : r;
  });
}

/* ---------- Which words are Turkish ---------- */
const KR_TR = /[çşğıöüâîûÇŞĞİÖÜÂÎÛ]|c(?!h)|C(?![hH])/;
const KR_UZ = /[ʻʼqxQX]|sh|ch|Sh|Ch|SH|CH/;
const KR_TSFX = new Set("yor iyor uyor mak acak cak ken abil arak madan ince ip mak maz dur tur dır sun lu ta tan tır ca ça".split(" "));
const KR_UZW = new Set("yoki va keyin uchun emas lekin hamda yoxud".split(" "));
const KR_KEEP = new Set("Google Telegram Firebase Android iPhone iPad iOS Chrome Safari Firefox Edge Opera Samsung Huawei Xiaomi Windows Mac macOS Linux GitHub Gmail Play App Store Apple Microsoft Vercel Capacitor email e-mail Wi-Fi WhatsApp Instagram YouTube Facebook TikTok PWA HTML CSV JSON PDF OK Onest Duolingo TDK".split(" "));
const KR_PHRASES = [/Türkçe Yoʻl/g, /@\w+/g, /turkceyol\.web\.app/g, /[\w.+-]+@[\w-]+\.[\w.]+/g, /https?:\/\/\S+/g];
let KR_T = null, KR_B = null;   // the lexicon: Turkish-only words, words on both sides
function krLex() {
  if (KR_T || typeof KLEX === "undefined") return !!KR_T;
  KR_T = new Set(KLEX.t.split(" ")); KR_B = new Set(KLEX.b.split(" "));
  return true;
}
// A word's class: "k" keep as it is, "t" Turkish (sure), "u" Uzbek (sure), "ts"/"us" Turkish/Uzbek by the lexicon, "a" ambiguous
function krKind(w, before, before2) {
  if (/\d/.test(w) || KR_KEEP.has(w)) return "k";
  if (/^[A-Z]{2,3}$/.test(w)) return "k";                         // XP, SRS, PDF
  if (/^[A-ZİÜÖ]$/.test(w) && w !== "U") return "k";                // (A), -lAr: a Turkish sound class; «U» is the Uzbek «he»
  if (/[a-zçşğıöü][A-ZÇŞĞİÖÜ]/.test(w)) return "k";              // -lAr, -DIr, iPhone
  if (before === "[" || before === "+") return "t";                // kitap[lar]: a Turkish example
  if (KR_TR.test(w)) return "t";
  if (KR_UZ.test(w)) return "u";
  // Suffix notation (-yor, -lar/-ler, but not tez-tez or 1-dars): Turkish-only shapes stay, the rest follow the text
  if ((before === "-" || before === "‑") && !/[\wʻʼçşğıöü]/.test(before2 || "")) return /e/i.test(w) || KR_TSFX.has(w.toLowerCase()) ? "t" : "a";
  const l = w.replace(/I/g, "ı").replace(/İ/g, "i").toLowerCase();
  if (l.length === 1) return "a";
  if (!krLex()) return "us";                                       // no lexicon (yet): an Uzbek page
  if (KR_B.has(l)) return "a";
  return KR_T.has(l) ? "ts" : "us";
}
const KR_WORD = /[A-Za-z0-9ÇŞĞİÖÜçşğıöüâîûÂÎÛʻʼ'’]+/g;
// A text (one node): returns it with the Uzbek words in Cyrillic
function krText(s, uz) {
  if (uz === "mix") return krMix(s);
  if (!/[A-Za-z]/.test(s)) return s;
  // Parts that never change: the brand, addresses
  const keep = [];
  KR_PHRASES.forEach(re => { s = s.replace(re, m => "\u0001" + (keep.push(m) - 1) + "\u0002"); });
  const toks = [];
  s.replace(KR_WORD, (w, at) => {
    const ap = w.match(/^(.*?)['’]+([a-zçşğıöü]*)$/);        // İzmir'de: Turkish apostrophe
    toks.push({ w, at, k: uz ? (krKind(w) === "k" ? "k" : "u") : ap && /^[A-ZÇŞĞİÖÜ]/.test(w) ? "t" : krKind(w.replace(/['’]/g, ""), s[at - 1], s[at - 2]) });
    return w;
  });
  if (!uz) {
    // A comma list (a, ı, o, u · kitap, kız) is one language: a sure Turkish member makes the whole list Turkish
    for (let i = 0; i < toks.length; i++) {
      let j = i; while (j + 1 < toks.length && /^[\s\])]*[,/][\s[(\-‑]*$/.test(s.slice(toks[j].at + toks[j].w.length, toks[j + 1].at))) j++;
      if (j > i) {
        const grp = toks.slice(i, j + 1);
        const tr = grp.some(t => t.k === "t") || (grp.some(t => t.k === "ts") && !grp.some(t => t.k === "u" || t.k === "us"));
        if (tr) grp.forEach(t => { if (t.k === "a" || t.k === "us") t.k = "t"; });
        i = j;
      }
    }
    // The rest of the ambiguous words follow the nearest word whose language is known (a sure one wins a tie)
    const known = t => t.k === "t" || t.k === "u" || t.k === "ts" || t.k === "us";
    // A sentence end (. ! ? : ;) between two words weakens their tie
    let sent = 0; toks.forEach((t, i) => { if (i && /[.!?:;]\s/.test(s.slice(toks[i - 1].at + toks[i - 1].w.length, t.at) + " ")) sent++; t.sn = sent; });
    toks.forEach((t, i) => {
      if (t.k !== "a") return;
      let best = null, bd = 1e9;
      toks.forEach((o, j) => {
        if (!known(o)) return;
        const d = Math.abs(i - j) * 2 + (o.k.length > 1 ? 1 : 0) + (o.sn !== t.sn ? 20 : 0);
        if (d < bd) { bd = d; best = o; }
      });
      t.k = best && best.k[0] === "t" ? "ts" : "us";
    });
  }
  let out = "", last = 0;
  toks.forEach(t => {
    out += s.slice(last, t.at);
    out += t.k[0] === "u" ? latCyr(t.w) : t.w;
    last = t.at + t.w.length;
  });
  out += s.slice(last);
  return out.replace(/\u0001(\d+)\u0002/g, (m, i) => keep[+i]);
}

// Turkish text (lang="tr"): only the words that cannot be Turkish
function krMix(s) {
  if (!/[ʻʼqxQX]|\b(yoki|va|keyin|uchun|emas|lekin|hamda|yoxud)\b/.test(s)) return s;
  return s.replace(KR_WORD, w => /[ʻʼqxQX]/.test(w) && !KR_KEEP.has(w) && !KR_TR.test(w) || KR_UZW.has(w.toLowerCase()) ? latCyr(w) : w);
}

/* ---------- The page ---------- */
const KR_ATTR = ["placeholder", "aria-label", "title", "alt"];
const KR_SKIP = new Set(["SCRIPT", "STYLE", "TEXTAREA", "CODE", "PRE", "svg", "SVG"]);
let KR_OBS = null;
function krSkip(el) {
  for (let e = el; e && e.nodeType === 1; e = e.parentNode) {
    if (KR_SKIP.has(e.nodeName)) return "s";
    if (e.hasAttribute("data-uz")) return "uz";
    if (e.hasAttribute("data-lat")) return "s";
    const l = e.getAttribute("lang");
    if (l) return /^tr/i.test(l) ? "mix" : "";
  }
  return "";
}
function krNode(n) {
  if (n.nodeType === 3) {
    const p = n.parentNode; if (!p || p.nodeType !== 1) return;
    const sk = krSkip(p); if (sk === "s") return;
    const src = n.__lat !== undefined && n.__cyr === n.data ? n.__lat : n.data;
    const out = krText(src, sk === "uz" ? true : sk === "mix" ? "mix" : false);
    if (out !== n.data) { n.__lat = src; n.__cyr = out; n.data = out; }
    else if (out === src) { n.__lat = undefined; }
    return;
  }
  if (n.nodeType !== 1 || KR_SKIP.has(n.nodeName)) return;
  krAttrs(n);
  const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let x = w.nextNode(); x; x = w.nextNode()) { if (x.nodeType === 3) krNode(x); else krAttrs(x); }
}
function krAttrs(el) {
  if (el.nodeType !== 1 || !el.hasAttribute) return;
  KR_ATTR.forEach(a => {
    if (!el.hasAttribute(a)) return;
    const v = el.getAttribute(a), key = "__lat_" + a;
    const src = el[key] !== undefined && el["__cyr_" + a] === v ? el[key] : v;
    const out = krText(src, false);
    if (out !== v) { el[key] = src; el["__cyr_" + a] = out; el.setAttribute(a, out); }
  });
}
function krTitle() { if (document.title && /[A-Za-z]/.test(document.title)) document.title = krText(document.title, false); }
function krStart() {
  document.documentElement.classList.add("cyr");
  document.documentElement.lang = "uz-Cyrl";
  if (!KR_OBS && typeof MutationObserver !== "undefined") {
    KR_OBS = new MutationObserver(list => {
      for (const m of list) {
        if (m.type === "characterData") krNode(m.target);
        else if (m.type === "attributes") krAttrs(m.target);
        else m.addedNodes.forEach(krNode);
      }
    });
    KR_OBS.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: KR_ATTR });
  }
  if (document.body) krNode(document.body);
  krTitle();
}
// Back to Latin: every changed text gets its original back
function krStop() {
  if (KR_OBS) { KR_OBS.disconnect(); KR_OBS = null; }
  document.documentElement.classList.remove("cyr");
  document.documentElement.lang = "uz";
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let x = w.nextNode(); x; x = w.nextNode()) {
    if (x.nodeType === 3) { if (x.__lat !== undefined && x.__cyr === x.data) x.data = x.__lat; x.__lat = undefined; }
    else KR_ATTR.forEach(a => { if (x["__lat_" + a] !== undefined && x["__cyr_" + a] === x.getAttribute(a)) x.setAttribute(a, x["__lat_" + a]); x["__lat_" + a] = undefined; });
  }
}
// The lexicon: while the page is still loading it is read right here (before the first screen); later — added and the page re-read
function krLoadLex(then) {
  if (typeof KLEX !== "undefined") { krLex(); return then && then(); }
  if (document.readyState === "loading") { document.write('<script src="kirill-lex.js"><\/script>'); return; }
  const s = document.createElement("script"); s.src = "kirill-lex.js"; s.async = true;
  s.onload = () => { KR_T = null; krLex(); if (ABC === "cyr" && document.body) krNode(document.body); if (then) then(); };
  document.head.appendChild(s);
}
function abcSet(v) {
  ABC = v === "cyr" ? "cyr" : "lat";
  try { localStorage.setItem(ABC_KEY, ABC); } catch (e) {}
  if (ABC === "cyr") { krLoadLex(); krStart(); } else krStop();
  abcFlipLabel();
}
// The switch on the sign-in screen names the other script, in that script
function abcFlipLabel() {
  document.querySelectorAll(".abc-flip").forEach(b => { b.textContent = ABC === "cyr" ? "Lotincha" : "Кириллча"; b.lang = ABC === "cyr" ? "uz-Latn" : "uz-Cyrl"; });
}
if (ABC === "cyr") {
  krLoadLex();
  document.documentElement.classList.add("cyr");
  const go = () => { krStart(); abcFlipLabel(); };
  if (document.body) go(); else document.addEventListener("DOMContentLoaded", go);
}
