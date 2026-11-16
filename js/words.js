/* Türkçe Yoʻl — Word analysis (morph.js), reading texts, the week summary, the four skills.
   One of the app's scripts (js/, loaded in order by index.html); they share one global scope. */

/* ---------- Word analysis (morph.js, loaded on demand): tap a word → root + suffixes; smarter spelling; suffix practice ---------- */
let MORPH_P = null, MORPH_OK = false;
function loadMorph() {
  if (MORPH_OK) return Promise.resolve();
  return MORPH_P || (MORPH_P = loadScript("morph.js").then(() => { Morph.load(ALL.map(w => [w.tr, w.uz])); MORPH_OK = true; }, e => { MORPH_P = null; throw e; }));
}
// Turkish text with every word tappable
const MW_RE = /[A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû][A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû'’]*/g;
function mw(text) {
  text = String(text); let out = "", last = 0;
  text.replace(MW_RE, (m, i) => { out += esc(text.slice(last, i)) + `<i class="mw" data-act="mw">${esc(m)}</i>`; last = i + m.length; return m; });
  return out + esc(text.slice(last));
}
const mwHint = () => `<p class="mw-hint">${ICON.spark}Istalgan soʻzni bosing — tarjimasi va tuzilishi chiqadi</p>`;
function mwOpen(el) {
  const box = el.closest("[lang]") || el.parentElement, all = [...box.querySelectorAll(".mw")], i = all.indexOf(el), words = all.map(x => x.textContent);
  document.querySelectorAll(".mw.on").forEach(x => x.classList.remove("on")); el.classList.add("on");
  loadMorph().then(() => openSheet(mwSheet(words, i)), () => toast("Internet aloqasini tekshiring"));
}
const MW_FIN = new Set(["PROG", "FUT", "EVID", "AOR", "NAOR", "NEC", "PAST", "COND"]);
function mwRows(r) {
  const tag = t => Morph.TAGS[t] || [t, ""], bare = r.lem.replace(/m[ae]k$/, "");
  const rows = [`<div class="mw-row root"><b lang="tr">${esc(r.root)}</b><span>${r.pos === "p" ? "atoqli ot (ism, joy nomi)" : `${r.pos === "v" || (r.root !== r.lem && r.root !== bare) ? `<i lang="tr">${esc(r.lem)}</i> — ` : ""}${esc(r.uz)}`}<small>oʻzak</small></span></div>`];
  r.parts.forEach(p => rows.push(`<div class="mw-row"><b lang="tr">${p.s ? "-" + esc(p.s) : "•"}</b><span>${esc(tag(p.t)[0])}<small>oʻzbekchada: ${esc(tag(p.t)[1])}</small></span></div>`));
  const last = r.parts.length ? r.parts[r.parts.length - 1].t : "";
  if (r.pos === "v" && !r.parts.length) rows.push(`<div class="mw-row"><b>•</b><span>buyruq: sen<small>qoʻshimchasiz shakl</small></span></div>`);
  else if (MW_FIN.has(last)) rows.push(`<div class="mw-row"><b>•</b><span>shaxs: u<small>qoʻshimchasiz</small></span></div>`);
  return rows.join("");
}
function mwSheet(words, i) {
  const word = words[i], clean = Morph.strip(word), res = Morph.parse(word), ph = Morph.phrase(words, i), best = res[0];
  const alts = best ? res.slice(1).filter(r => r.cost <= best.cost + 1.6).slice(0, 2) : [];
  return `<div class="mw-sheet">
    <div class="mw-head"><b lang="tr">${esc(clean)}</b><button class="say" data-act="say" data-t="${esc(clean)}" aria-label="Tinglash">${ICON.speak}</button></div>
    ${ph ? `<div class="mw-phrase"><span class="tag violet-t">Ibora</span><span><b lang="tr">${esc(ph.tr)}</b> — ${esc(ph.uz)}</span></div>` : ""}
    ${best ? `<div class="mw-rows">${mwRows(best)}</div>${alts.length ? `<details class="mw-alt"><summary>Boshqacha ham tushunish mumkin</summary>${alts.map(a => `<div class="mw-rows">${mwRows(a)}</div>`).join("")}</details>` : ""}`
      : `<p class="muted">Bu soʻz lugʻatimizda hali yoʻq.${/^[A-ZÇĞİÖŞÜ]/.test(word) ? " Bosh harf bilan yozilgan — ehtimol, ism yoki joy nomi." : ""}</p><a class="btn btn-soft btn-block" href="#translate">Tarjimonda koʻrish</a>`}
    <button class="btn btn-grad btn-block" data-act="sheet-x">Tushunarli</button></div>`;
}
/* Suffix slips: every wrong written answer is compared with the right one — which rule was broken (S.mor) */
const MOR_WHY = {
  h: ["unli uygʻunligi", "Qoʻshimchadagi unli oʻzakning oxirgi unlisiga moslashadi: ev-ler, okul-lar; göz-ü, kol-u."],
  c: ["jarangsiz undoshdan keyin t, ç", "f, s, t, k, ç, ş, h, p dan keyin qoʻshimcha d emas t, c emas ç bilan boshlanadi: kitap-ta, sınıf-tan."],
  s: ["undosh yumshashi", "Unli bilan boshlanadigan qoʻshimcha oldida p, ç, t, k → b, c, d, ğ: kitap — kitabı, çocuk — çocuğu, git — gidiyor."],
  y: ["oraliq harf (y, n, s)", "Ikki unli yonma-yon kelmaydi, orasiga harf qoʻyiladi: araba-y-a, oda-s-ı, kapı-n-ın."],
  d: ["unli tushishi", "Baʼzi soʻzlarda unli bilan boshlanadigan qoʻshimcha oldida oxirgi unli tushadi: şehir — şehri, burun — burnu."]
};
const morName = k => MOR_WHY[k] ? MOR_WHY[k][0] : MORPH_OK && Morph.TAGS[k.slice(2)] ? `«${Morph.TAGS[k.slice(2)][0]}» qoʻshimchasi` : "qoʻshimchalar";
function morBump(k, n = 1) { S.mor = S.mor || {}; const v = Math.round(((S.mor[k] || 0) + n) * 100) / 100; if (v > 0) S.mor[k] = Math.min(v, 12); else delete S.mor[k]; }
function morLog(exp, got, ok) {
  if (!MORPH_OK) { loadMorph().catch(() => {}); return; }
  const a = String(exp).trim().split(/\s+/), b = String(got).trim().split(/\s+/);
  if (ok) {
    if (!S.mor) return;
    a.forEach(w => { const r = Morph.parse(w)[0]; if (!r || !r.parts.length) return; r.parts.forEach(p => { if (S.mor["t:" + p.t]) morBump("t:" + p.t, -1); }); Object.keys(MOR_WHY).forEach(k => { if (S.mor[k]) morBump(k, -0.34); }); });
    return;
  }
  if (a.length !== b.length) return;
  a.forEach((w, i) => {
    const x = Morph.strip(w), y = Morph.strip(b[i]); if (!y || x === y) return;
    const e = Morph.parse(x)[0]; if (!e || !e.parts.length) return;
    const tags = e.parts.map(p => p.t).join("+");
    if (Morph.parse(y, { lax: true }).some(r => r.lem === e.lem && r.parts.map(p => p.t).join("+") === tags)) { const k = Morph.errKind(y, x, e.root.length); if (k !== "o") { morBump(k); return; } }
    const g = Morph.parse(y).find(r => r.lem === e.lem);
    const miss = e.parts.find((p, j) => !g || !g.parts[j] || g.parts[j].t !== p.t);
    if (miss && (g || y.startsWith(e.root.slice(0, Math.max(2, e.root.length - 1))))) morBump("t:" + miss.t);
  });
}
/* Suffix practice: a root and the suffixes to add; built by the generator, aimed at the learner's weak rule (focus) */
const MOR_N = "ev okul kitap kalem masa araba anne baba kardeş arkadaş öğrenci öğretmen doktor şehir köy sokak oda kapı pencere bahçe çocuk kedi köpek kuş balık ekmek su çay süt elma mutfak park otobüs tren uçak yol deniz göl dağ ağaç çiçek gün hafta yıl para iş telefon bilgisayar defter çanta sınıf ders soru cevap isim göz el burun ağız kulak ayak renk şarkı film oyun resim mektup haber ülke dil kelime cümle otel hastane banka lokanta pazar bilet anahtar yatak dolap sandalye tabak bardak kaşık bıçak ayakkabı gömlek ceket şapka gözlük yağmur güneş misafir komşu aile hediye tatil müzik".split(" ");
const MOR_V = "gelmek gitmek yapmak almak vermek okumak yazmak görmek bilmek istemek sevmek konuşmak anlamak çalışmak oturmak kalkmak içmek uyumak beklemek bakmak başlamak bitirmek açmak kapatmak dinlemek söylemek sormak bulmak kalmak yaşamak öğrenmek oynamak yürümek koşmak gezmek dönmek girmek çıkmak aramak satmak kullanmak unutmak düşünmek izlemek pişirmek yıkamak giymek taşımak".split(" ");
const MOR_T = {
  n: [[["PL"], 1], [["LOC"], 1], [["DAT"], 1], [["ABL"], 1], [["ACC"], 1], [["GEN"], 1], [["P1s"], 1], [["P3s"], 1], [["INS"], 1], [["PL", "LOC"], 1], [["P1s", "DAT"], 2], [["P3s", "LOC"], 2], [["P1p", "ABL"], 2], [["PL", "P1s"], 2], [["P2p", "ACC"], 2], [["LI"], 2], [["SIZ"], 2], [["PL", "P3s", "GEN"], 3], [["LOC", "KI"], 3], [["P1s", "INS"], 3]],
  v: [[["PROG", "S1s"], 1], [["PROG", "S2s"], 1], [["NEG", "PROG", "S1s"], 1], [["PAST", "S1s"], 1], [["PAST", "S1p"], 1], [["IMP2p"], 1], [["NEG", "PAST", "S2s"], 2], [["FUT", "S1s"], 2], [["FUT", "S1p"], 2], [["AOR", "S1s"], 2], [["NEG", "NAOR"], 2], [["ABIL", "AOR", "S1s"], 2], [["NEC", "S1p"], 2], [["OPT1p"], 2], [["EVID"], 3], [["COND", "S2s"], 3], [["INAB", "PAST", "S1s"], 3], [["PASS", "PAST"], 3], [["DIK", "P1s", "ACC"], 3], [["IP"], 3], [["INCA"], 3]]
};
function morItems(focus, n = 8) {
  const lvN = Math.min(3, LVS.indexOf(kNext().level) + 1) || 1, tag = String(focus || "").startsWith("t:") ? focus.slice(2) : "";
  const vowelStart = new Set(["ACC", "DAT", "GEN", "P1s", "P2s", "P3s", "P1p", "P2p", "PROG", "FUT", "AOR", "ABIL", "INAB", "OPT1p", "IMP2p", "IP", "INCA", "PASS"]);
  const hard = new Set(["LOC", "ABL", "PAST", "DIK"]);
  const roots = pos => (pos === "n" ? MOR_N : MOR_V).filter(w => Morph.parse(pos === "v" ? w.slice(0, -3) : w).some(r => r.lem === w && r.pos === pos && !r.parts.length));
  const pick = { n: roots("n"), v: roots("v") };
  const fits = (w, pos) => { const st = pos === "v" ? w.slice(0, -3) : w, l = st[st.length - 1];
    return focus === "s" ? (pos === "n" ? /[kpç]$/.test(w) && /[aeıioöuü].*[aeıioöuü]/.test(w) : ["git", "et", "tat"].includes(st)) : focus === "c" ? "fstkçşhp".includes(l) : focus === "y" ? /[aeıioöuü]$/.test(st) : focus === "d" ? Morph.DROPS.includes(w) : true; };
  const tfits = t => focus === "s" || focus === "y" || focus === "d" ? vowelStart.has(t[0]) : focus === "c" ? hard.has(t[0]) : tag ? t.includes(tag) : true;
  const out = [], seen = new Set();
  for (let guard = 0; guard < 400 && out.length < n; guard++) {
    const pos = focus === "d" ? "n" : Math.random() < 0.5 ? "n" : "v";
    let ts = MOR_T[pos].filter(([t, l]) => l <= lvN && tfits(t)); if (!ts.length) ts = MOR_T[pos].filter(([t]) => tfits(t)); if (!ts.length) continue;
    let rs = pick[pos].filter(w => fits(w, pos)); if (!rs.length) { if (guard < 200) continue; rs = pick[pos]; }
    const w = rs[Math.floor(Math.random() * rs.length)], [tags] = ts[Math.floor(Math.random() * ts.length)], tr = Morph.build(w, tags, pos);
    if (!tr || seen.has(tr)) continue; seen.add(tr);
    const an = Morph.parse(tr).find(r => r.lem === w && r.parts.map(p => p.t).join("+") === tags.join("+")); if (!an) continue;
    out.push({ mor: true, tr, uz: an.uz, lem: w, pos, tags, an });
  }
  return out;
}
function renderMor(w) {
  SES.sk = ["w"];
  stage.innerHTML = `<div class="q-card"><div class="q-label">Qoʻshimchalarni qoʻshib yozing</div>
    <div class="q-word mor-root"><span lang="tr">${esc(w.lem)}</span><small>${esc(w.uz)}</small></div>
    <div class="mor-need">${w.tags.map(t => `<span class="tag sky-t">${esc(Morph.TAGS[t][0])}<i>${esc(Morph.TAGS[t][1])}</i></span>`).join('<b aria-hidden="true">+</b>')}</div></div>
    ${bankBox(w.tr)}
    <div class="feedback" id="fb" aria-live="polite"></div>`;
  foot.innerHTML = `<button class="btn btn-ghost" data-act="mor-skip">Bilmayman</button><button class="btn btn-grad" data-act="mor-check">Tekshirish</button>`;
  $("type-form").addEventListener("submit", e => { e.preventDefault(); if (SES.answered) nextStep(); else checkMor(); });
}
function checkMor(skip) {
  if (SES.answered) return;
  const w = SES.items[SES.i], inp = $("type-input"), v = inp.value, fb = $("fb");
  if (!skip && !v.trim()) { inp.focus(); return; }
  SES.answered = true;
  const split = `<b lang="tr">${esc(w.an.root)}${w.an.parts.map(p => p.s ? `<i>·</i>${esc(p.s)}` : "").join("")}</b>`;
  if (!skip && fold(v) === fold(w.tr)) { good(); morLog(w.tr, v, true); inp.classList.add("right"); fb.className = "feedback ok"; fb.innerHTML = `Barakalla! ${split}`; }
  else {
    const k = skip ? "o" : Morph.errKind(Morph.strip(v), w.tr, w.an.root.length);
    bad(); if (!skip) morLog(w.tr, v, false); inp.classList.add("wrong"); fb.className = "feedback no";
    fb.innerHTML = `Toʻgʻri javob: ${split}${MOR_WHY[k] ? `<small class="mor-why">${esc(MOR_WHY[k][1])}</small>` : ""}`;
  }
  speak(w.tr);
  foot.innerHTML = `<button class="btn btn-grad btn-block" data-act="next">Keyingi</button>`;
}

/* ---------- Reading texts (oqish.js, loaded on demand): text, glossary, listening, 4 questions → reading XP ---------- */
let OQ_P = null, OQ_ANS = {};
function loadOq() {
  if (typeof OQ !== "undefined") return Promise.resolve();
  return OQ_P || (OQ_P = new Promise((ok, fail) => { const s = document.createElement("script"); s.src = "oqish.js"; s.onload = ok; s.onerror = () => { OQ_P = null; s.remove(); fail(); }; document.head.appendChild(s); }));
}
const oqReady = () => typeof OQ !== "undefined";
const oqBest = id => (S.oq && S.oq[id]) || null;
let OQ_LV = "A1";
function viewOqish() {
  if (!oqReady()) return `${topbar()}${catLoader()}`;
  const lvs = ["A1", "A2", "B1", "B2", "C1"], list = OQ.filter(t => t.lv === OQ_LV);
  return `${topbar()}
  <div><a class="back" href="#practice">${ICON.back}Mashq</a></div>
  <div class="lesson-head"><div class="tags"><span class="tag sky-t">${ICON.book}Okuma</span><span class="tag green-t">${OQ.filter(t => oqBest(t.id) !== null).length}/${OQ.length} oʻqilgan</span></div>
    <h1>Oʻqish matnlari</h1><p class="sub">Matnni oʻqing (yoki tinglang), notanish soʻzlarni lugʻatdan koʻring va savollarga javob bering. Har matn uchun +${XP_VAL.reading} XP.</p></div>
  <div class="seg glass" role="tablist">${lvs.map(l => `<button role="tab" data-act="oq-lv" data-l="${l}" aria-selected="${OQ_LV === l}">${l}</button>`).join("")}</div>
  <div class="list">${list.map(t => { const b = oqBest(t.id); return `<a class="unit glass" href="#oqish-${t.id}">
    <span class="art ${b === 100 ? "green" : LV_COLOR[t.lv]}"><span style="font-size:14px">${t.lv}</span></span>
    <span class="unit-body"><span class="unit-title" lang="tr">${esc(t.tr)}</span><span class="unit-sub">${esc(t.uz)}${b !== null ? ` · eng yaxshi natija ${b}%` : ""}</span></span>
    ${b !== null ? pctRing(b / 100) : ICON.chev}</a>`; }).join("")}</div>`;
}
// Options keep their order per visit (shuffled once), so an answer does not jump around
const OQ_ORDER = {};
function oqOrder(t) { return OQ_ORDER[t.id] || (OQ_ORDER[t.id] = t.q.map(q => shuffle(q.o.map((_, i) => i)))); }
function viewOqText(id) {
  if (!oqReady()) return `${topbar()}${catLoader()}`;
  const t = OQ.find(x => x.id === id);
  if (!t) return `${topbar()}<div class="glass empty"><b>Matn topilmadi</b><a class="link" href="#oqish">Barcha matnlar</a></div>`;
  const ans = OQ_ANS[id] || (OQ_ANS[id] = {}), done = ans.done, ord = oqOrder(t);
  const paras = t.text.split("\n\n");
  return `${topbar()}
  <div><a class="back" href="#oqish">${ICON.back}Oʻqish matnlari</a></div>
  <div class="lesson-head"><div class="tags"><span class="tag ${LV_COLOR[t.lv]}-t">${t.lv}</span><span class="tag sky-t">${ICON.book}Okuma</span></div>
    <h1 lang="tr">${esc(t.tr)}</h1><p class="sub">${esc(t.uz)}</p></div>
  <button class="btn btn-soft" data-act="say-seq" data-lines="${esc(JSON.stringify(paras))}">${ICON.speak}Matnni tinglash</button>
  <div class="glass pad oq-text" lang="tr">${paras.map(p => `<p>${mw(p).replace(/\n/g, "<br>")}</p>`).join("")}</div>${mwHint()}
  <details class="glass pad"><summary><b>Lugʻat (${t.gloss.length})</b></summary><div class="oq-gloss">${t.gloss.map(([a, b]) => `<div><b lang="tr">${esc(a)}</b><span>${esc(b)}</span></div>`).join("")}</div></details>
  <section class="section"><div class="section-head"><h2>Savollar</h2>${done ? `<span class="tag green-t">${done.right}/${t.q.length}</span>` : ""}</div>
  ${t.q.map((q, qi) => `<div class="glass pad gq oq-q">
    <b lang="tr">${qi + 1}. ${esc(q.q)}</b>
    <div class="opts">${ord[qi].map(oi => { const cls = done ? (oi === q.a ? " right" : ans[qi] === oi ? " wrong" : "") : ans[qi] === oi ? " picked" : "";
      return `<button class="opt${cls}" data-act="oq-ans" data-id="${t.id}" data-q="${qi}" data-o="${oi}" ${done ? "disabled" : ""} lang="tr">${esc(q.o[oi])}</button>`; }).join("")}</div></div>`).join("")}
  ${done ? `<div class="glass pad oq-res"><b>${done.right}/${t.q.length} toʻgʻri${done.xp ? ` · +${done.xp} XP` : ""}</b>${done.why ? `<p class="xp-why">${esc(done.why)}</p>` : ""}
      <div class="fr-actions"><button class="btn btn-ghost" data-act="oq-again" data-id="${t.id}">Qayta yechish</button>${(() => { const n = OQ[OQ.indexOf(t) + 1]; return n ? `<a class="btn btn-grad" href="#oqish-${n.id}">Keyingi matn</a>` : `<a class="btn btn-grad" href="#oqish">Barcha matnlar</a>`; })()}</div></div>`
    : `<button class="btn btn-grad btn-block" data-act="oq-check" data-id="${t.id}" ${Object.keys(ans).length < t.q.length ? "disabled" : ""}>${ICON.check}Tekshirish</button>`}
  </section>`;
}
function oqCheck(id) {
  const t = OQ.find(x => x.id === id), ans = OQ_ANS[id];
  const oks = t.q.map((q, i) => ans[i] === q.a), right = oks.filter(Boolean).length;
  oks.forEach(ok => skillLog("r", ok));
  dayRec().rev += t.q.length;
  const r = xpAward("reading", { acc: right / t.q.length, key: "oq|" + id, sk: ["r"] });
  S.oq = S.oq || {};
  S.oq[id] = Math.max(S.oq[id] || 0, Math.round(right / t.q.length * 100));
  save();
  ans.done = { right, xp: r.xp, why: xpWhy(r) };
  const y = window.scrollY; route(); window.scrollTo(0, y);
  pamukSay(right >= 3 ? "happy" : "sad", right === t.q.length ? `Mukammal! Hammasi toʻgʻri${r.xp ? ` · +${r.xp} XP` : ""}` : right >= 3 ? `Yaxshi! ${right}/${t.q.length}${r.xp ? ` · +${r.xp} XP` : ""}` : "Matnni yana bir bor oʻqib chiqing — lugʻat yordam beradi.");
}

/* ---------- Week summary: shown once after a new week is settled, and again from the leaderboard ---------- */
function weekStats(wk) {
  const n0 = Math.round(Date.parse(wk) / DAY), days = Array.from({ length: 7 }, (_, i) => dayGet(keyOf(n0 + i)));
  return { xp: days.map(d => d.xp || 0), active: days.filter(d => d.xp || d.rev).length, min: Math.round(days.reduce((a, d) => a + (d.sec || 0), 0) / 60), rev: days.reduce((a, d) => a + (d.rev || 0), 0), from: n0 };
}
const dm = n => keyOf(n).slice(5).split("-").reverse().join(".");
function recapHTML() {
  const r = S.lgr, st = weekStats(r.w), up = r.to > r.from, down = r.to < r.from, L = lgOf(r.to);
  const head = up ? `${L.uz} ligasiga koʻtarildingiz!` : down ? `Bu hafta ${L.uz} ligasidamiz` : `${L.uz} ligasida qoldingiz`;
  const note = up ? "Pamuk sizdan juda faxrlanadi! Yangi ligada raqiblar kuchliroq — kuniga 10 daqiqa yetarli."
    : down ? "Hech gap emas — bitta faol hafta bilan qaytarib olamiz. Pamuk yoningizda!"
    : r.to < 7 ? `Keyingi ligaga chiqish uchun haftaning eng yaxshi ${Math.round(LG_UP * 100)}% ichiga kiring (kamida ${LG_MIN} XP).` : "Siz eng yuqori ligadasiz. Chempionlikni saqlab qoling!";
  const best = Math.max(...st.xp), bestDay = st.xp.indexOf(best);
  return `<div class="recap">
    <small class="eyebrow">Hafta yakuni · ${dm(st.from)} – ${dm(st.from + 6)}</small>
    <div class="recap-cat">${mascot(up ? "trophy" : "sit")}</div>
    <div class="recap-lg">${lgBadge(r.from, "lg-big")}${r.to !== r.from ? `<span class="recap-arrow ${up ? "up" : "down"}">→</span>${lgBadge(r.to, "lg-big")}` : ""}</div>
    <h3>${esc(head)}</h3>
    <p class="muted">${esc(note)}</p>
    <div class="recap-grid">
      <div><b>${r.xp}</b><span>XP</span></div>
      <div><b>${r.rank ? `${r.rank}/${r.n}` : "—"}</b><span>Oʻrin</span></div>
      <div><b>${st.active}/7</b><span>Faol kun</span></div>
      <div><b>${st.min}</b><span>Daqiqa</span></div>
    </div>
    <div class="chart-card glass">${barChart(st.xp, WD)}</div>
    ${best ? `<p class="muted">Eng yaxshi kun: ${WD[bestDay]} — ${best} XP${st.rev ? ` · jami ${st.rev} ta javob` : ""}</p>` : ""}
    <div class="cel-actions"><button class="btn btn-ghost" data-act="share" data-text="${esc(`Türkçe Yoʻl'da bu hafta ${r.xp} XP toʻpladim${up ? ` va ${L.uz} ligasiga chiqdim` : ""}! Turk tilini bepul oʻrganing:`)}">${ICON.heart}Ulashish</button><button class="btn btn-grad" data-act="sheet-done">Yangi hafta!</button></div>
  </div>`;
}
function showRecap() {
  if (!S.lgr || !S.lgr.w) return;
  openSheet(recapHTML());
  if (S.lgr.to > S.lgr.from) setTimeout(() => CatLife.mood($("sheet").querySelector(".cat"), "wow", 3200), 300);
  if (!S.lgr.seen) { S.lgr.seen = 1; save(); }
}
// Wait until nothing else is on screen (welcome, an exercise, another sheet)
function recapSoon(tries = 0) {
  setTimeout(() => {
    if (!S.lgr || S.lgr.seen) return;
    const busy = SES || !$("sheet").hidden || !$("celebrate").hidden || !$("welcome").hidden || !$("auth").hidden;
    if (busy) { if (tries < 40) recapSoon(tries + 1); return; }
    showRecap();
  }, tries ? 3000 : 2600);
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
  // Time from showing a question to the answer: the anti-tapping check uses the median
  if (SES.shown) { (SES.times = SES.times || []).push(now - SES.shown); SES.shown = 0; }
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
function skDay(id) { const d = dayRec(); d.sk = d.sk || {}; return d.sk[id] || (d.sk[id] = [0, 0, 0]); }
function skillLog(ids, ok) {
  ids = [].concat(ids || []);
  touchDay();
  if (SES && !SES.done) ids.forEach(id => SES.skAll.add(id));
  ids.forEach(id => {
    const a = S.sk[id]; if (!a) return;
    a[1]++; if (ok) a[0]++;
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
