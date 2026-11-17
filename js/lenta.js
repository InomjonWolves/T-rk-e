/* Türkçe Yoʻl — Lenta (2026-11-17): the "reels" habit turned into learning. One of the app's scripts (js/, loaded in
   order by index.html). #lenta — a full-screen vertical feed of one-screen cards, swiped up like short videos:
   a new word (tap shows the meaning, the voice plays by itself), a question (word → meaning, meaning → word, by ear),
   a grammar rule, a line from a story or a guide example (every word can be tapped), a "did you know" fact.
   a word to say aloud (the microphone). Every LN_ROUND cards a reward card rates the round with 1–3 stars and gives its
   XP (xpAward "vocab", key "lenta" — the same diminishing return as any repeated practice, so endless scrolling is not
   endless XP). Pause cards (lnNudge) come by themselves: every LN_BREAK cards, after LN_TIME_MIN minutes, when cards fly
   past unread, late at night and after LN_DAY cards in a day. ♥ (or a double tap) keeps the card in «Saqlanganlar» (S.lk) and puts a word into spaced repetition.
   Cards come only from the open levels (lvOpen), words due for review and new words first; nothing repeats in a run.
   Today's count: S.ln = {d, n}. The feed is generated on the fly — no content file besides the facts below. */
const LN_ROUND = 8, LN_BREAK = 40, LN_KEEP = 200, LN_TIME_MIN = 20, LN_DAY = 150, LN_FAST_MS = 1200, LN_FAST_N = 6;
const LN_ICO = {
  share: sv('<path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>'),
  mute: sv('<path d="M11 5 6 9H3v6h3l5 4z"/><path d="m22 9-6 6M16 9l6 6"/>'),
  x: sv('<path d="M6 6l12 12M18 6 6 18"/>'),
  save: sv('<path d="M6 3h12v18l-6-4-6 4z"/>'),
  up: sv('<path d="m6 15 6-6 6 6"/>'),
  reels: sv('<rect x="4" y="3" width="16" height="18" rx="4"/><path d="m10 9 5 3-5 3z"/>')
};
// "Did you know" — short facts about Turkish and its ties with Uzbek (our own text); tr — a Turkish word to hear
const LN_FACTS = [
  { t: "Turk alifbosida 29 ta harf bor. Unda Q, X va W harflari yoʻq." },
  { t: "«ı» va «i» — ikki xil harf: «kır» — dala, «kir» — kir (iflos). Nuqta maʼnoni oʻzgartiradi!", tr: "kır, kir" },
  { t: "Turkchada soʻz qanday yozilsa, shunday oʻqiladi. Yozilishini bilsangiz, talaffuzini ham bilasiz." },
  { t: "«Ğ» (yumshoq g) hech qachon soʻz boshida kelmaydi: «dağ, yağmur, öğretmen». U oldingi unlini choʻzadi.", tr: "dağ, yağmur, öğretmen" },
  { t: "Turkcha va oʻzbekcha — bitta oila, turkiy tillar: «ay» — oy, «taş» — tosh, «baş» — bosh, «göz» — koʻz, «kulak» — quloq.", tr: "ay, taş, baş, göz, kulak" },
  { t: "Turkchada ham, oʻzbekchada ham grammatik rod yoʻq: «o» — erkak uchun ham, ayol uchun ham.", tr: "o" },
  { t: "«Afiyet olsun!» — ovqatlanayotgan odamga aytiladi: «Yoqimli ishtaha!»", tr: "Afiyet olsun!" },
  { t: "«Kolay gelsin!» — ishlayotgan odamga aytiladigan iliq tilak: «Ishingiz oson boʻlsin!»", tr: "Kolay gelsin!" },
  { t: "«Geçmiş olsun!» — kasal boʻlgan yoki qiyinchilikka uchragan odamga aytiladi: «Tezroq tuzaling!»", tr: "Geçmiş olsun!" },
  { t: "Qoʻshimcha soʻzning oxirgi unlisiga moslashadi — unli uygʻunligi: «ev — evler», «kitap — kitaplar».", tr: "evler, kitaplar" },
  { t: "Savol yuklamasi «mi» alohida yoziladi, lekin unli uygʻunligiga boʻysunadi: «Geliyor musun?»", tr: "Geliyor musun?" },
  { t: "Turk tili — turkiy tillar ichida eng koʻp soʻzlashiladigani: Turkiyada 85 milliondan ortiq odam yashaydi." },
  { t: "1928-yilda turk tili arab yozuvidan lotin yozuviga oʻtgan." },
  { t: "«Sağ ol» — «rahmat»ning samimiy shakli. Oʻzbekcha «sogʻ boʻl» ga juda oʻxshaydi!", tr: "Sağ ol!" },
  { t: "Salomlashishda koʻpincha «Merhaba» deyiladi, «Selam» esa doʻstlar orasida samimiyroq.", tr: "Merhaba! Selam!" },
  { t: "Kun vaqtiga qarab: «Günaydın» — ertalab, «İyi akşamlar» — kechqurun, «İyi geceler» — uxlashdan oldin.", tr: "Günaydın! İyi akşamlar! İyi geceler!" },
  { t: "İzmir — Turkiyaning uchinchi yirik shahri, Egey dengizi boʻyida. Bizning qahramonlarimiz shu yerda yashaydi!" },
  { t: "Turkchada ham feʼl odatda gap oxirida keladi — xuddi oʻzbekchadagidek: «Ben kitap okuyorum.»", tr: "Ben kitap okuyorum." },
  { t: "Turkiyada choy kichik, beli ingichka stakanda ichiladi. «Çay ister misin?» — choy ichasanmi?", tr: "Çay ister misin?" },
  { t: "Sanoq: «bir, iki, üç, dört, beş»… Oʻzbekchadagi bir, ikki, uch, toʻrt, besh bilan solishtiring!", tr: "bir, iki, üç, dört, beş" },
  { t: "Katta «I» ning kichigi — «ı», katta «İ» ning kichigi — «i». İstanbul soʻzi nuqtali İ bilan yoziladi.", tr: "İstanbul" },
  { t: "Turkchada ham «sen» — samimiy, «siz» — hurmat bilan murojaat. Xuddi oʻzbekchadagidek!", tr: "sen, siz" },
  { t: "Qoʻshimchalar zanjiri: «ev-ler-im-de-ki» — uylarimdagi. Bitta soʻz — butun bir iboraning maʼnosi.", tr: "evlerimdeki" },
  { t: "«İnşallah», «maşallah» kabi soʻzlar turkchada ham bor — oʻzbekchadagi bilan deyarli bir xil.", tr: "inşallah, maşallah" }
];
let LN = null;
const lnWLv = w => { const u = UNITS[w.unit] || {}; return u.course || u.lug || "A1"; };
const lnCut = (s, n) => { s = String(s).replace(/\s+/g, " ").trim(); return s.length <= n ? s : s.slice(0, s.lastIndexOf(" ", n - 1)).replace(/[,;:—–-]+$/, "") + "…"; };
const lnPickOne = a => a[Math.floor(Math.random() * a.length)];
// Everything the feed can show, from the open levels (built once per run)
function lnPool() {
  const open = new Set(LVS.filter(l => lvOpen(l))), top = LVS.filter(l => open.has(l)).pop() || "A1";
  const words = ALL.filter(w => open.has(lnWLv(w)) && w.tr.length <= 24 && !/[…?!/]/.test(w.tr) && w.uz && w.uz.length <= 40);
  const tips = (typeof GUIDE_ALL !== "undefined" ? GUIDE_ALL : []).filter(g => (g.level === "kirish" || open.has(g.level)) && g.rule && g.ex);
  const lines = [];
  if (typeof HK !== "undefined") HK.filter(h => open.has(h.lv)).forEach(h => h.s.forEach(x => { if (Array.isArray(x) && x[0] && x[1].length >= 10 && x[1].length <= 90) lines.push({ tr: x[1], uz: x[2], who: x[0], h }); }));
  tips.forEach(g => { const tr = plainSfx(g.ex[0]); if (tr.length <= 90) lines.push({ tr, uz: g.ex[1], g }); });
  return { open, top, words, tips, lines, due: new Set(dueWords().map(w => w.tr)) };
}
function lnWord(avoid) {
  const P = LN.pool, fresh = P.words.filter(w => !LN.used.has("w:" + w.tr) && w !== avoid);
  if (!fresh.length) return null;
  const r = Math.random(), due = fresh.filter(w => P.due.has(w.tr)), now = fresh.filter(w => !srs(w) && lnWLv(w) === P.top), unseen = fresh.filter(w => !srs(w));
  const w = r < 0.35 && due.length ? lnPickOne(due) : r < 0.75 && now.length ? lnPickOne(now) : lnPickOne(unseen.length ? unseen : fresh);
  LN.used.add("w:" + w.tr);
  return w;
}
// Two wrong options with another meaning (and another spelling), from the same level when possible
function lnOpts(w) {
  const same = LN.pool.words.filter(x => x !== w && lnWLv(x) === lnWLv(w)), base = same.length > 10 ? same : LN.pool.words;
  const out = [w], seen = new Set([fold(w.uz), fold(w.tr)]);
  for (let k = 0; k < 60 && out.length < 3; k++) { const x = lnPickOne(base); if (!seen.has(fold(x.uz)) && !seen.has(fold(x.tr))) { seen.add(fold(x.uz)); seen.add(fold(x.tr)); out.push(x); } }
  return shuffle(out);
}
const LN_KINDS = [["w", 22], ["q", 22], ["r", 12], ["l", 12], ["g", 10], ["s", 12], ["f", 8], ["p", 9]];
// Something short to say aloud: a word or a phrase of up to three words, or a short line from a story
function lnSayItem() {
  const P = LN.pool;
  if (Math.random() < 0.35) { const ls = P.lines.filter(x => x.h && x.tr.length <= 30 && !LN.used.has("p:" + x.tr)); if (ls.length) { const x = lnPickOne(ls); LN.used.add("p:" + x.tr); return { say: x.tr, uz: x.uz, lv: x.h.lv }; } }
  // A word not shown on another card of this feed (one word, one card)
  const ws = P.words.filter(w => !LN.used.has("p:" + w.tr) && !LN.used.has("w:" + w.tr) && w.tr.split(" ").length <= 3 && w.tr.length <= 22 && !/[\d()]/.test(w.tr));
  if (!ws.length) return null;
  const w = lnPickOne(ws.filter(w => srs(w)).length > 8 && Math.random() < 0.6 ? ws.filter(w => srs(w)) : ws); LN.used.add("p:" + w.tr); LN.used.add("w:" + w.tr);
  return { say: w.tr, uz: w.uz, w };
}
function lnMake() {
  const n = LN.cards.length, prev = LN.cards[n - 1];
  if (n && (n + 1) % (LN_ROUND + 1) === 0) return { k: "x" };
  for (let tries = 0; tries < 20; tries++) {
    const tot = LN_KINDS.reduce((a, [, x]) => a + x, 0);
    let r = Math.random() * tot, k = "w";
    for (const [kk, x] of LN_KINDS) { if ((r -= x) < 0) { k = kk; break; } }
    if (n === 0) k = "w";
    if (prev && prev.k === k) continue;
    if (k === "l" && !canSpeak()) continue;
    if (k === "p") { if (!SR || IN_TG || n < 3) continue; const x = lnSayItem(); if (!x) continue; return { k, id: "p:" + audioKey(x.say), ...x }; }
    if (k === "w" || k === "q" || k === "r" || k === "l") {
      const w = lnWord(); if (!w) continue;
      if (k === "w") return { k, id: "w:" + w.tr, w };
      const o = lnOpts(w); if (o.length < 3) continue;
      return { k, id: "w:" + w.tr, w, o, a: o.indexOf(w) };
    }
    if (k === "g") { const g = LN.pool.tips.filter(x => !LN.used.has("g:" + x.code)); if (!g.length) continue; const x = lnPickOne(g); LN.used.add("g:" + x.code); return { k, id: "g:" + x.code, g: x }; }
    if (k === "s") { const s = LN.pool.lines.filter(x => !LN.used.has("s:" + x.tr)); if (!s.length) continue; const x = lnPickOne(s); LN.used.add("s:" + x.tr); return { k, id: "s:" + audioKey(x.tr), s: x }; }
    if (k === "f") { const f = LN_FACTS.map((x, i) => i).filter(i => !LN.used.has("f:" + i)); if (!f.length) continue; const i = lnPickOne(f); LN.used.add("f:" + i); return { k, id: "f:" + i, f: LN_FACTS[i] }; }
  }
  const w = lnWord(); return w ? { k: "w", id: "w:" + w.tr, w } : { k: "f", id: "f:0", f: LN_FACTS[0] };
}
function lnMore(n) { const from = LN.cards.length; for (let i = 0; i < n; i++) LN.cards.push(lnMake()); return LN.cards.slice(from).map((c, j) => lnCardHTML(c, from + j)).join(""); }
function lnStart() {
  LN = { cards: [], used: new Set(), cur: -1, seenSet: new Set(), round: { n: 0, right: 0, times: [] }, combo: 0, best: 0, xp: 0, right: 0, n: 0, open: true, t: 0, t0: Date.now(), fast: 0, nud: {}, tapAt: 0, tapI: -1 };
  LN.pool = lnPool();
  return lnMore(6);
}

/* ---------- Cards: a glossy panel in its own colour, Pamuk with his props, the round's progress, one big button ----------
   Pamuk's props are drawn in his own coordinates (an SVG over the cat with the same viewBox), so headphones sit on his
   head whatever accessory his level gives him; the rest are small HTML pieces around him. Only the card on screen
   animates (.cur). */
const LN_TAG = { w: "Yangi soʻz", q: "Savol", r: "Turkchasini toping", l: "Tinglash", g: "Qoida", s: "Gap", f: "Bilasizmi?", p: "Gapirish", x: "Natija", b: "Tanaffus" };
const lnLiked = id => !!(S.lk && S.lk[id]);
const lnSpark = (x, y, s, d) => `<path class="lnp-spark" style="--d:${d}s" d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}z"/>`;
const LN_NOTE = (x, y, c) => `<g class="lnp-note ${c}"><ellipse cx="${x}" cy="${y}" rx="8" ry="6.5" transform="rotate(-18 ${x} ${y})"/><path d="M${x + 7} ${y - 2}V${y - 32}l13 4v8l-13-4" /></g>`;
function lnOver(k, sm) {
  let g = "";
  if (k === "l") g = `<g class="lnp-hp"><path d="M40 114C30 22 210 22 200 114" fill="none" stroke="#252a4d" stroke-width="13" stroke-linecap="round"/><path d="M47 102C44 38 196 38 193 102" fill="none" stroke="#8f98ff" stroke-width="3.5" stroke-linecap="round" opacity=".8"/>
      <rect x="20" y="94" width="36" height="58" rx="17" fill="#ffbf47"/><rect x="27" y="103" width="22" height="40" rx="11" fill="#ff8f1f"/><rect x="184" y="94" width="36" height="58" rx="17" fill="#ffbf47"/><rect x="191" y="103" width="22" height="40" rx="11" fill="#ff8f1f"/></g>
    <g fill="#fff">${LN_NOTE(16, 64, "n1")}${LN_NOTE(206, 40, "n2")}${sm ? "" : LN_NOTE(222, 132, "n3")}</g>`;
  if (k === "f") g = `<g class="lnp-bulb"><circle cx="206" cy="44" r="30" fill="#ffe27a" opacity=".35"/><circle cx="206" cy="40" r="17" fill="#ffd43b"/><path d="M199 56h14v9a3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3z" fill="#e8e3ff"/><path d="M200 61h12" stroke="#a49fd0" stroke-width="2"/><path d="M202 36q4-6 8 0" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/></g>`;
  const sp = { w: [[30, 40, 9, 0], [214, 70, 7, 0.6]], g: [[28, 60, 8, 0.2], [212, 34, 10, 0.9]], f: [[30, 70, 8, 0.3]], x: [[26, 50, 10, 0], [214, 46, 8, 0.5], [218, 150, 6, 1]], p: [[30, 46, 7, 0.4]] }[k];
  if (sp) g += `<g fill="#fff">${sp.map(([x, y, s, d]) => lnSpark(x, y, s, d)).join("")}</g>`;
  return g;
}
function lnScene(c, i) {
  const k = c.k, v = c.v, sm = /^[qrlg]$/.test(k);
  const cat = catSVG({ pose: { g: "read", x: "cheer", p: "wave" }[k] || "sit", look: catLook(), ears: "up" });
  const vb = (cat.match(/viewBox="([^"]+)"/) || [])[1] || "0 8 240 236", over = lnOver(k, sm);
  const SIGN = { count: "Barakalla!", time: "Dam oling", long: "Yetarli!", fast: "Sekinroq", night: "Xayrli tun", day: "Ajoyib!" };
  let props = "";
  if (k === "w") props = `<span class="lnp-sign"${c.open ? "" : ' aria-hidden="true"'}>${c.open ? esc(lnCut(c.w.uz, 26)) : "?"}</span>`;
  else if (k === "q") props = `<span class="lnp-paper" aria-hidden="true">${[1, 2, 3].map(() => `<i>${ICON.check}<b></b></i>`).join("")}</span>`;
  else if (k === "r") props = `<b class="lnp-qm" aria-hidden="true">?</b><b class="lnp-qm q2" aria-hidden="true">?</b>`;
  else if (k === "s") props = `<span class="lnp-tiles" aria-hidden="true" lang="tr">${c.s.tr.replace(/[.,!?«»"]/g, "").split(" ").filter(Boolean).slice(0, 3).map((w, j) => `<i style="--j:${j}">${esc(w)}</i>`).join("")}</span><b class="lnp-qm q3" aria-hidden="true">?</b>`;
  else if (k === "p") props = `<span class="lnp-mic" aria-hidden="true"><svg viewBox="0 0 40 90"><rect x="10" y="2" width="20" height="32" rx="10" fill="#e8ecff"/><path d="M14 10h12M14 16h12M14 22h12" stroke="#9aa4d6" stroke-width="2"/><path d="M5 26a15 15 0 0 0 30 0" fill="none" stroke="#2b2f4a" stroke-width="4"/><path d="M20 41v40M8 84h24" stroke="#2b2f4a" stroke-width="5" stroke-linecap="round"/></svg></span><span class="lnp-bubble" lang="tr">${esc(lnCut(c.say, 18))}</span>`;
  else if (k === "x") props = `<span class="lnp-check" aria-hidden="true">${ICON.check}</span>`;
  else if (k === "g") props = `<b class="lnp-bang" aria-hidden="true">!</b>`;
  else if (k === "b") props = `<span class="lnp-sign lnp-sign-b">${SIGN[v] || "Dam oling"}</span>${v === "night" || v === "long" || v === "time" ? `<span class="lnp-z" aria-hidden="true"><i>Z</i><i>z</i><i>z</i></span>` : ""}`;
  return `<div class="ln-scene${sm ? " sm" : ""}"><div class="lnp lnp-${k}">${cat}${over ? `<svg class="lnp-over" viewBox="${vb}" aria-hidden="true">${over}</svg>` : ""}${props}</div></div>`;
}
function lnTools(c, i) {
  if (c.k === "x" || c.k === "b") return "";
  const heard = c.k !== "f" || c.f.tr;
  return `<span class="ln-tools">
    ${heard ? `<button class="ln-ic" data-act="ln-say" data-i="${i}" aria-label="Tinglash">${ICON.speak}</button>` : ""}
    <button class="ln-ic" data-act="ln-share" data-i="${i}" aria-label="Ulashish">${LN_ICO.share}</button>
    <button class="ln-ic ln-heart${lnLiked(c.id) ? " on" : ""}" data-act="ln-like" data-i="${i}" aria-pressed="${lnLiked(c.id)}" aria-label="${lnLiked(c.id) ? "Saqlangan" : "Saqlash"}">${ICON.heart}</button>
  </span>`;
}
function lnOptsHTML(c, i, tr) {
  const ans = c.ans;
  return `<div class="ln-opts">${c.o.map((w, j) => { const cls = ans === undefined ? "" : j === c.a ? " right" : j === ans ? " wrong" : " dim";
    return `<button class="ln-opt${cls}" data-act="ln-ans" data-i="${i}" data-j="${j}"${ans !== undefined ? " disabled" : ""}${tr ? ' lang="tr"' : ""}>${esc(tr ? w.tr : w.uz)}</button>`; }).join("")}</div>
    ${ans === undefined ? "" : `<p class="ln-fb ${ans === c.a ? "ok" : "no"}">${ans === c.a ? (LN.combo >= 3 ? `${ICON.flame} ${LN.combo} ta ketma-ket!` : "Barakalla!") : `Toʻgʻrisi: <b${tr ? ' lang="tr"' : ""}>${esc(tr ? c.w.tr : c.w.uz)}</b>`}</p>`}`;
}
const LN_NUDGE = {
  count: [n => `${n} ta karta!`, "Ajoyib! Oʻrganganlaringizni mustahkamlash uchun qisqa takrorlash qiling — soʻzlar xotirada uzoqroq qoladi."],
  time: [() => "20 daqiqa lentada", "Koʻzlaringizga dam bering: 20 soniya uzoqqa qarang, keyin davom etamiz."],
  long: [() => "Bugun yetarli!", "Uzoq varaqlash charchatadi. Bugungi soʻzlarni takrorlash mashqida mustahkamlang va ertaga yangi kuch bilan qayting."],
  fast: [() => "Shoshilmang!", "Kartalar juda tez oʻtib ketyapti. Har biri ustida bir necha soniya toʻxtang, ovozini tinglang — shunda soʻz yodda qoladi."],
  night: [() => "Kech boʻldi", "Uyqu ham oʻrganishning bir qismi: miya kunduzgi soʻzlarni tunda mustahkamlaydi. Xayrli tun!"],
  day: [() => "Bugun juda koʻp ishladingiz", "Endi takrorlash vaqti — ertaga sizni yangi kartalar kutadi."]
};
const lnStars = n => `<div class="ln-stars" role="img" aria-label="${n} yulduz">${[1, 2, 3].map(k => `<i class="${k <= n ? "on" : ""}" style="--k:${k}">${ICON.star}</i>`).join("")}</div>`;
function lnBody(c, i) {
  const glv = g => g.level === "kirish" ? "A1" : g.level, lv = c.w ? lnWLv(c.w) : c.g ? glv(c.g) : c.s ? (c.s.h ? c.s.h.lv : glv(c.s.g)) : c.lv || "";
  const head = `<div class="ln-head"><span class="ln-tag">${LN_TAG[c.k]}${lv ? ` · ${lv}` : ""}</span>${lnTools(c, i)}</div>`;
  const next = `<button class="ln-cta" data-act="ln-next" data-i="${i}">Keyingisi ${ICON.chev}</button>`;
  let body = "", cta = "";
  if (c.k === "w") { body = `<h2 class="ln-big" lang="tr">${esc(c.w.tr)}</h2>${c.open ? `<p class="ln-mean">${esc(c.w.uz)}</p>${c.w.note ? `<p class="ln-sub">${esc(c.w.note)}</p>` : ""}` : `<p class="ln-sub">Bosing — maʼnosi ochiladi. Ikki marta bosing — saqlanadi.</p>`}`;
    cta = c.open ? next : `<button class="ln-cta" data-act="ln-open" data-i="${i}">Maʼnosini koʻrish</button>`; }
  else if (c.k === "q") { body = `<p class="ln-ask">Bu soʻz nimani bildiradi?</p><h2 class="ln-big ln-md" lang="tr">${esc(c.w.tr)}</h2>${lnOptsHTML(c, i, false)}`; cta = c.ans !== undefined ? next : ""; }
  else if (c.k === "r") { body = `<p class="ln-ask">Turkchada qanday?</p><h2 class="ln-big ln-md">${esc(c.w.uz)}</h2>${lnOptsHTML(c, i, true)}`; cta = c.ans !== undefined ? next : ""; }
  else if (c.k === "l") { body = `<p class="ln-ask">Tinglang va maʼnosini tanlang</p>${c.ans !== undefined ? `<h2 class="ln-big ln-md" lang="tr">${esc(c.w.tr)}</h2>` : ""}${lnOptsHTML(c, i, false)}`;
    cta = c.ans !== undefined ? next : `<button class="ln-cta" data-act="ln-say" data-i="${i}">${ICON.speak} Yana tinglash</button>`; }
  else if (c.k === "g") { const g = c.g; body = `<h2 class="ln-title">${esc(g.uz)}</h2><p class="ln-sub" lang="tr">${esc(g.tr)}</p>
    ${g.f ? `<div class="ln-formula"><b lang="tr">${esc(g.f[0])}</b><span>${esc(g.f[1])}</span></div>` : ""}<p class="ln-rule">${esc(lnCut(g.rule, 150))}</p>
    <div class="ln-ex"><p lang="tr">${sfx(g.ex[0])}</p><small>${esc(g.ex[1])}</small></div>`;
    cta = `<a class="ln-cta" href="#${gHash(g.code)}">Mavzuni ochish ${ICON.chev}</a>`; }
  else if (c.k === "s") { const s = c.s; body = `${s.who ? `<span class="ln-who">${esc(s.who)}</span>` : ""}<p class="ln-line" lang="tr">${mw(s.tr)}</p>${c.open ? `<p class="ln-mean ln-sm">${esc(s.uz)}</p>` : ""}
    ${s.h ? `<a class="ln-link" href="#hikoya-${s.h.id}">Hikoya: <span lang="tr">${esc(s.h.tr)}</span> ${ICON.chev}</a>` : ""}`;
    cta = c.open ? next : `<button class="ln-cta" data-act="ln-open" data-i="${i}">Tarjimasi</button>`; }
  else if (c.k === "f") { body = `<p class="ln-fact">${esc(c.f.t)}</p>`; cta = next; }
  else if (c.k === "p") { const h = c.heard; body = `<p class="ln-ask">Ovoz chiqarib ayting</p><h2 class="ln-big ln-md" lang="tr">${esc(c.say)}</h2><p class="ln-sub">${esc(c.uz)}</p>
    ${h ? `<p class="ln-fb ${h.ok ? "ok" : "no"}">${h.ok ? "Zoʻr talaffuz!" : "Yana bir bor urinib koʻring"} · ${Math.round(h.score * 100)}%</p><p class="ln-heard">Eshitildi: <span lang="tr">${esc(h.text)}</span></p>` : ""}`;
    cta = h && h.ok ? next : `<button class="ln-cta ln-mic" data-act="ln-mic" data-i="${i}">${ICON.mic} ${h ? "Yana gapirish" : "Gapirish"}</button>`; }
  else if (c.k === "x") { const d = c.done; body = `${lnStars(d ? d.stars : 0)}<h2 class="ln-title">${d ? (d.n ? `${d.right}/${d.n} toʻgʻri javob` : "Savollarga javob bering") : "Natija…"}</h2>
    ${d && d.xp ? `<p class="ln-xp">+${d.xp} XP</p>` : `<p class="ln-sub">${esc(d && d.n >= 3 ? d.why || "Bu safar XP yoʻq — keyingi kartalarda omad!" : "XP olish uchun bir bosqichda kamida 3 ta savolga javob bering.")}</p>`}
    <div class="ln-sum"><span><b>${LN.n}</b>karta</span><span><b>${LN.best}</b>eng uzun seriya</span><span><b>${LN.xp}</b>XP lentada</span></div>`; cta = next; }
  else if (c.k === "b") { const [t, p] = LN_NUDGE[c.v] || LN_NUDGE.count; body = `<h2 class="ln-title">${esc(t(c.at))}</h2><p class="ln-fact ln-sm">${esc(p)}</p>
    <div class="ln-btns"><button class="ln-ghost" data-act="ln-review">Takrorlash mashqi</button><a class="ln-ghost" href="#home">Bosh sahifa</a></div>`; cta = `<button class="ln-cta" data-act="ln-next" data-i="${i}">Davom etish</button>`; }
  const pos = i % (LN_ROUND + 1), foot = c.k === "x" || c.k === "b" ? "" : i === 0 && !S.lnHint ? `<p class="ln-swipe" id="ln-swipe">${LN_ICO.up}Keyingisi uchun yuqoriga suring</p>` : `<div class="ln-foot"><span class="ln-pbar"><i style="width:${Math.round(Math.min(pos + 1, LN_ROUND) / LN_ROUND * 100)}%"></i></span><small>${Math.min(pos + 1, LN_ROUND)} / ${LN_ROUND}</small></div>`;
  return `${head}<div class="ln-body">${body}</div>${lnScene(c, i)}${foot}${cta}`;
}
function lnCardHTML(c, i) { return `<section class="ln-card t-${c.k}${c.v ? " v-" + c.v : ""}${LN.cur === i ? " cur" : ""}" data-i="${i}" aria-roledescription="karta"><div class="ln-panel">${lnBody(c, i)}</div></section>`; }
function lnRedraw(i) { const el = document.querySelector(`.ln-card[data-i="${i}"]`); if (el) { el.firstElementChild.innerHTML = lnBody(LN.cards[i], i); CatLife.scan(); } }
const lnCat = i => document.querySelector(`.ln-card[data-i="${i}"] .lnp .cat`);
function lnTopStats() {
  const t = $("ln-stats"); if (!t) return;
  t.innerHTML = `<span class="${LN.combo >= 3 ? "hot" : ""}">${ICON.flame}${LN.combo}</span><span>${ICON.star}${LN.xp} XP</span>`;
}

/* ---------- The page ---------- */
function viewLenta() {
  if (!GRAM_FULL || typeof HK === "undefined") return `${topbar()}${catLoader()}`;
  const first = LN && LN.open && LN.cards.length ? LN.cards.map((c, i) => lnCardHTML(c, i)).join("") : lnStart();
  return `<div class="ln" id="ln">
    <header class="ln-top">
      <h1 class="ln-h">${LN_ICO.reels}<span>Lenta</span></h1>
      <div class="ln-stats" id="ln-stats"></div>
      <button class="ln-x" data-act="ln-mute" aria-pressed="${!!S.lnMute}" aria-label="${S.lnMute ? "Ovozni yoqish" : "Ovozni oʻchirish"}">${S.lnMute ? LN_ICO.mute : ICON.speak}</button>
      <button class="ln-x" data-act="ln-saved" aria-label="Saqlanganlar">${LN_ICO.save}</button>
    </header>
    <div class="ln-feed" id="ln-feed" tabindex="-1">${first}</div>
  </div>`;
}
let LN_OBS = null;
function lnMount() {
  const feed = $("ln-feed"); if (!feed || !LN) return;
  if (LN_OBS) LN_OBS.disconnect();
  LN_OBS = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && e.intersectionRatio >= 0.6) lnActive(+e.target.dataset.i); }), { root: feed, threshold: [0.6] });
  feed.querySelectorAll(".ln-card").forEach(c => LN_OBS.observe(c));
  if (LN.cur > 0) { const el = feed.querySelector(`.ln-card[data-i="${LN.cur}"]`); if (el) feed.scrollTop = el.offsetTop; }
  feed.focus({ preventScroll: true });
  lnTopStats();
}
function lnActive(i) {
  if (!LN || i === LN.cur) return;
  const now = Date.now(), was = LN.cards[LN.cur];
  // Cards flying past unread (only moving on, not back)
  if (was && i > LN.cur && was.k !== "x" && was.k !== "b" && was.ans === undefined && !was.heard) LN.fast = now - LN.t < LN_FAST_MS ? LN.fast + 1 : 0;
  LN.cur = i; LN.t = now;
  const c = LN.cards[i], feed = $("ln-feed");
  feed && feed.querySelectorAll(".ln-card.cur").forEach(el => el.classList.remove("cur"));
  const el = feed && feed.querySelector(`.ln-card[data-i="${i}"]`);
  if (el) { el.classList.add("cur"); setTimeout(() => el.classList.add("seen"), 900); const cat = el.querySelector(".lnp .cat"); if (cat && c.k === "x" && c.done && c.done.stars >= 2) setTimeout(() => CatLife.mood(cat, "wow", 1600), 500); }
  if (!LN.seenSet.has(i)) {
    LN.seenSet.add(i);
    if (c.k !== "x" && c.k !== "b") { LN.n++; S.lnN = (S.lnN || 0) + 1; lnDay().n++; }
  }
  lnNudgeCheck(i);
  // The voices of the next cards are fetched now, so they play at once
  audioWarm(LN.cards.slice(i + 1, i + 4).map(x => x.w ? x.w.tr : x.s ? x.s.tr : x.say || (x.f && x.f.tr) || ""));
  if (i >= 1 && !S.lnHint) { S.lnHint = 1; lnRedraw(0); }
  if (c.k === "x" && !c.done) lnRound(c, i);
  // More cards before the end comes
  if (feed && i >= LN.cards.length - 3) { feed.insertAdjacentHTML("beforeend", lnMore(5)); feed.querySelectorAll(".ln-card").forEach(el => { if (+el.dataset.i > i) LN_OBS.observe(el); }); }
  ttsCancel();
  if (!S.lnMute) setTimeout(() => { if (LN && LN.cur === i && location.hash === "#lenta") lnSay(i, null, true); }, 350);
  lnTopStats();
  save();
}
// The voice of a card (auto: only cards that are about one word or line)
function lnSay(i, btn, auto) {
  const c = LN.cards[i]; if (!c) return;
  if (c.k === "w" || c.k === "q" || c.k === "l") speak(c.w.tr, btn);
  else if (c.k === "r") { if (!auto || c.ans !== undefined) speak(c.w.tr, btn); }
  else if (c.k === "s") { if (c.s.h) hkSay(c.s.h, c.s.who, c.s.tr, btn); else speak(c.s.tr, btn); }
  else if (c.k === "g") { if (!auto) speak(plainSfx(c.g.ex[0]), btn); }
  else if (c.k === "f" && c.f.tr && !auto) speak(c.f.tr, btn);
}
// The reward card: the round's answers become XP (reading; listening cards count for listening too)
// 3 stars — every answer right (or ≥ 90%), 2 — ≥ 70%, 1 — ≥ 40%; a round needs at least 3 answers to be rated
const lnStarsOf = (right, n) => n < 3 ? 0 : right / n >= 0.9 ? 3 : right / n >= 0.7 ? 2 : right / n >= 0.4 ? 1 : 0;
function lnDay() { const t = dayNum(); if (!S.ln || S.ln.d !== t) S.ln = { d: t, n: 0, s: 0, r: 0 }; return S.ln; }
function lnRound(c) {
  const r = LN.round;
  if (r.n >= 3) {
    const a = xpAward("vocab", { right: r.right, n: r.n, key: "lenta", times: r.times, sk: ["r"] }), stars = lnStarsOf(r.right, r.n), d = lnDay();
    LN.xp += a.xp; LN.stars = (LN.stars || 0) + stars; c.done = { right: r.right, n: r.n, xp: a.xp, stars, why: a.xp ? "" : xpWhy(a) };
    S.lnS = (S.lnS || 0) + stars; d.s = (d.s || 0) + stars; d.r = (d.r || 0) + 1;
    if (stars === 3) S.ln3 = (S.ln3 || 0) + 1;
    if (a.xp || stars) { beep(stars === 3 ? "fanfare" : "done"); hapticDone(); }
  } else c.done = { right: r.right, n: r.n, xp: 0, stars: 0 };
  LN.round = { n: 0, right: 0, times: [] };
  lnRedraw(LN.cards.indexOf(c)); lnTopStats(); save();
}
function lnAnswer(i, j) {
  const c = LN.cards[i]; if (!c || c.ans !== undefined) return;
  const ok = j === c.a;
  c.ans = j;
  lnScore(ok);
  skillLog(c.k === "l" ? "l" : c.k === "r" ? "w" : "r", ok);
  grade(c.w, ok);
  lnFeel(i, ok);
  if (c.k !== "q" || !ok) setTimeout(() => { if (LN && LN.cur === i) speak(c.w.tr); }, 300);
  // A right answer moves on by itself after a moment
  if (ok) setTimeout(() => { if (LN && LN.cur === i && location.hash === "#lenta") lnGo(1); }, 1300);
  save();
}
// One answer of the round (a choice or the first try at saying a word)
function lnScore(ok) {
  LN.round.n++; LN.round.times.push(Date.now() - LN.t);
  if (ok) { LN.round.right++; LN.right++; LN.combo++; LN.best = Math.max(LN.best, LN.combo); S.lnB = Math.max(S.lnB || 0, LN.combo); } else LN.combo = 0;
}
// Sound, a buzz, the card hops or shakes, Pamuk jumps for joy (or sheds a tear)
function lnFeel(i, ok) {
  beep(ok ? (LN.combo >= 3 && LN.combo % 5 === 0 ? "combo" : "ok") : "no"); haptic(ok);
  lnRedraw(i); lnTopStats();
  const el = document.querySelector(`.ln-card[data-i="${i}"]`); if (!el) return;
  el.classList.remove("hop", "shake"); void el.offsetWidth; el.classList.add(ok ? "hop" : "shake");
  const cat = lnCat(i); if (cat) CatLife.mood(cat, ok ? (LN.combo >= 3 ? "wow" : "happy") : "sad", 1500);
}
// Saying a word aloud: the first try counts for the round; ≥ 75% is right
function lnMic(i, btn) {
  const c = LN.cards[i]; if (!c || !SR) { toast("Bu qurilmada nutqni tanish ishlamaydi"); return; }
  micCapture({ kind: "say", tr: c.say }, btn, best => {
    if (!LN || LN.cards[i] !== c) return;
    const ok = best.score >= 0.75, first = !c.heard;
    c.heard = { ok, score: best.score, text: best.text };
    if (first) lnScore(ok);
    skillLog("s", ok);
    S.pron[1]++; if (ok) S.pron[0]++;
    lnFeel(i, ok);
    if (ok) setTimeout(() => { if (LN && LN.cur === i && location.hash === "#lenta") lnGo(1); }, 1600);
    save();
  });
}
/* Pause cards. A reminder takes the place of the next card (not a reward card), so the feed's order stays the same:
   count — every LN_BREAK cards of this visit (long — from the second time); time — every LN_TIME_MIN minutes;
   fast — LN_FAST_N cards in a row passed in under LN_FAST_MS without an answer; night — 23:00–04:59 after 15 cards;
   day — LN_DAY cards today (once a day, S.ln.b). Each kind at most once in a while (LN.nud). */
function lnNudgeCheck(i) {
  const n = LN.n, h = new Date().getHours(), d = lnDay(), last = LN.nud, ago = k => n - (last[k] === undefined ? -1e9 : last[k]);
  let v = "";
  if (n && n % LN_BREAK === 0 && ago("count") >= LN_BREAK) v = n >= LN_BREAK * 2 ? "long" : "count";
  else if (Date.now() - LN.t0 >= LN_TIME_MIN * 60000 * ((LN.tn || 0) + 1)) { v = "time"; LN.tn = (LN.tn || 0) + 1; }
  else if (LN.fast >= LN_FAST_N && ago("fast") >= 25) v = "fast";
  else if ((h >= 23 || h < 5) && n >= 15 && last.night === undefined) v = "night";
  else if (d.n >= LN_DAY && !d.b) { v = "day"; d.b = 1; }
  if (v) lnNudge(i, v);
}
function lnNudge(i, v) {
  let j = i + 1;
  while (LN.cards[j] && (LN.cards[j].k === "x" || LN.cards[j].k === "b")) j++;
  const c = { k: "b", v, at: LN.n };
  LN.nud[v === "long" ? "count" : v] = LN.n; LN.fast = 0;
  if (j >= LN.cards.length) LN.cards.push(lnMake());
  LN.cards[j] = c;
  const old = document.querySelector(`.ln-card[data-i="${j}"]`);
  if (old) { old.insertAdjacentHTML("afterend", lnCardHTML(c, j)); const el = old.nextElementSibling; old.remove(); if (LN_OBS) LN_OBS.observe(el); CatLife.scan(); }
}
function lnGo(d) { const feed = $("ln-feed"); if (!feed) return; const el = feed.querySelector(`.ln-card[data-i="${Math.max(0, LN.cur + d)}"]`); if (el) feed.scrollTo({ top: el.offsetTop, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }
// ♥: the card is kept; a word also joins spaced repetition (due today)
function lnLike(i, x, y) {
  const c = LN.cards[i]; if (!c || !c.id) return;
  S.lk = S.lk || {};
  if (S.lk[c.id] && x === undefined) delete S.lk[c.id];
  else if (!S.lk[c.id]) {
    const a = c.w ? [c.w.tr, c.w.uz] : c.g ? [c.g.tr, c.g.uz, c.g.code] : c.s ? [c.s.tr, c.s.uz] : [c.f.tr || "", c.f.t];
    S.lk[c.id] = { k: c.k === "q" || c.k === "r" || c.k === "l" ? "w" : c.k, a, at: Date.now() };
    const ks = Object.keys(S.lk); if (ks.length > LN_KEEP) ks.sort((p, q) => S.lk[p].at - S.lk[q].at).slice(0, ks.length - LN_KEEP).forEach(k => delete S.lk[k]);
    if (c.w && !srs(c.w)) S.srs[c.w.tr] = { i: 0, e: 2.5, d: dayNum(), r: 0, m: 0, w: 0 };
    haptic(true);
  }
  lnRedraw(i);
  const el = document.querySelector(`.ln-card[data-i="${i}"]`);
  if (el && x !== undefined) { const r = el.getBoundingClientRect(), h = document.createElement("i"); h.className = "ln-burst"; h.innerHTML = ICON.heart; h.style.left = `${x - r.left}px`; h.style.top = `${y - r.top}px`; el.appendChild(h); setTimeout(() => h.remove(), 900); }
  save();
}
function lnShare(i) {
  const c = LN.cards[i]; if (!c) return;
  const msg = c.w ? `Turkcha «${c.w.tr}» — «${c.w.uz}».` : c.g ? `${c.g.uz}: ${plainSfx(c.g.ex[0])} — ${c.g.ex[1]}` : c.s ? `«${c.s.tr}» — ${c.s.uz}` : c.f.t;
  shareLink("https://turkceyol.web.app/#lenta", `${msg}\nTurk tilini lentada varaqlab oʻrganing — Türkçe Yoʻl`);
}
function lnSavedSheet() {
  const ls = Object.entries(S.lk || {}).sort((a, b) => b[1].at - a[1].at);
  const ws = ls.filter(([, v]) => v.k === "w").length;
  openSheet(`<h2>Saqlanganlar</h2><p class="muted">${ls.length ? `${ls.length} ta karta${ws ? ` · ${ws} ta soʻz takrorlashga qoʻshilgan` : ""}` : "Hali hech narsa saqlanmagan. Kartani ikki marta bosing yoki ♥ ni bosing."}</p>
    ${ls.length ? `<div class="words glass ln-saved">${ls.slice(0, 60).map(([id, v]) => `<div class="word"><div><div class="word-tr" lang="tr">${esc(v.a[0] || "")}</div><div class="word-uz">${esc(v.a[1] || "")}</div></div>
      ${v.k === "g" && v.a[2] ? `<a class="link" href="#${gHash(v.a[2])}">Ochish</a>` : `<button class="link" data-act="ln-unlike" data-id="${esc(id)}">Olib tashlash</button>`}</div>`).join("")}</div>` : ""}
    ${ws ? `<button class="btn btn-grad btn-block" data-act="ln-review">Soʻzlarni takrorlash</button>` : ""}`);
}
function lnAct(act, b) {
  if (act === "ln-saved") { lnSavedSheet(); return; }
  if (act === "ln-unlike") { if (S.lk) delete S.lk[b.dataset.id]; save(); lnSavedSheet(); if (LN) LN.cards.forEach((c, i) => { if (c.id === b.dataset.id) lnRedraw(i); }); return; }
  if (act === "ln-review") { closeSheet(); startSession("review"); return; }
  if (act === "ln-mute") { S.lnMute = !S.lnMute; save(); if (S.lnMute) ttsCancel(); b.setAttribute("aria-pressed", !!S.lnMute); b.innerHTML = S.lnMute ? LN_ICO.mute : ICON.speak; toast(S.lnMute ? "Ovoz oʻchirildi" : "Ovoz yoqildi"); return; }
  if (!LN) return;
  const i = +b.dataset.i;
  if (act === "ln-ans") lnAnswer(i, +b.dataset.j);
  else if (act === "ln-open") lnOpen(i);
  else if (act === "ln-next") { if (LN.cards[i] && LN.cards[i].k === "b") { const s = document.querySelector(`.ln-card[data-i="${i + 1}"]`); if (!s) $("ln-feed").insertAdjacentHTML("beforeend", lnMore(3)); } lnGo(1); }
  else if (act === "ln-mic") lnMic(i, b);
  else if (act === "ln-like") lnLike(i);
  else if (act === "ln-say") lnSay(i, b);
  else if (act === "ln-share") lnShare(i);
}
// A tap on a card shows the meaning; two quick taps keep it (like a heart on a short video)
document.addEventListener("click", e => {
  if (!LN || location.hash !== "#lenta" || e.target.closest("[data-act], a, button")) return;
  const card = e.target.closest(".ln-card"); if (!card) return;
  const i = +card.dataset.i, c = LN.cards[i], now = Date.now();
  if (LN.tapI === i && now - LN.tapAt < 350) { LN.tapAt = 0; lnLike(i, e.clientX, e.clientY); return; }
  LN.tapI = i; LN.tapAt = now;
  if ((c.k === "w" || c.k === "s") && !c.open) lnOpen(i);
});
// The meaning shows up (on Pamuk's sign too) and Pamuk is amazed
function lnOpen(i) { const c = LN.cards[i]; if (!c || c.open) return; c.open = 1; lnRedraw(i); const cat = lnCat(i); if (cat) CatLife.mood(cat, "wow", 1300); }
document.addEventListener("keydown", e => {
  if (!LN || location.hash !== "#lenta" || /INPUT|TEXTAREA/.test((e.target || {}).tagName || "") || !$("sheet").hidden) return;
  if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === "j") { e.preventDefault(); lnGo(1); }
  else if (e.key === "ArrowUp" || e.key === "PageUp" || e.key === "k") { e.preventDefault(); lnGo(-1); }
});
// Leaving the feed: answers of an unfinished round still count; the next visit starts a fresh feed
window.addEventListener("hashchange", () => {
  if (!LN || !LN.open || location.hash === "#lenta") return;
  ttsCancel();
  if (LN.round.n >= 3) { const a = xpAward("vocab", { right: LN.round.right, n: LN.round.n, key: "lenta", times: LN.round.times, sk: ["r"] }); if (a.xp) toast(`Lenta: +${a.xp} XP`); save(); }
  LN = null;
});
