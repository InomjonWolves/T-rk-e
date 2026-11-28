/* Türkçe Yoʻl — The A1–C1 course (course.js): levels, units, the learning path, locks.
   One of the app's scripts (js/, loaded in order by index.html); they share one global scope. */

/* ---------- A1–C1 course (course.js): levels, units, level tests ---------- */
const KU = {};
COURSE.units.forEach((u, i) => { KU[u.id] = u; u.idx = i; });
// index.html loads course-core.js (titles, goals, vocabulary); the full course.js (dialogs, texts, exercises)
// arrives right after the first paint. Until then those fields throw NEED_COURSE: route() and taps wait for it.
const NEED_COURSE = new Error("NEED_COURSE");
const COURSE_CORE = COURSE, COURSE_BODY = ["sections", "reading", "exercises"];
let COURSE_FULL = COURSE.units.every(u => Array.isArray(u.sections)), COURSE_P = null;
if (!COURSE_FULL) COURSE.units.forEach(u => COURSE_BODY.forEach(k => Object.defineProperty(u, k, { get() { throw NEED_COURSE; }, configurable: true })));
// Everything that comes after the first screen: the course bodies and the grammar files
const loadData = () => Promise.all([loadGram(), loadCourse()]);
function loadCourse() {
  if (COURSE_FULL) return Promise.resolve();
  return COURSE_P || (COURSE_P = new Promise((ok, fail) => {
    const s = document.createElement("script");
    s.src = "course.js";
    s.onload = () => {
      // course.js declares the same global COURSE: keep the core object (KU and indexes point to it), copy the bodies in
      const full = COURSE; COURSE = COURSE_CORE;
      full.units.forEach(f => { const u = KU[f.id]; if (u) COURSE_BODY.forEach(k => Object.defineProperty(u, k, { value: f[k], writable: true, enumerable: true, configurable: true })); });
      COURSE_FULL = true; ok();
    };
    s.onerror = () => { COURSE_P = null; s.remove(); fail(new Error("course.js")); };
    document.head.appendChild(s);
  }));
}
function courseOffline() { toast("Kurs maʼlumotlari yuklanmadi. Internetni tekshirib, qayta urinib koʻring"); }
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
  const u = KU[id], keys = u.keys || kKeys(u), st = S.k[id];
  if (!keys.length) return st && st.done ? 1 : 0;
  return st ? keys.filter(k => st.e[k] === 1).length / keys.length : 0;
}
const kDone = id => !!(S.k[id] && S.k[id].done);
const kDoneCount = (lv) => COURSE.units.filter(u => (!lv || u.level === lv) && kDone(u.id)).length;
const kNext = () => COURSE.units.find((u, i) => i >= (S.kStart || 0) && !kDone(u.id)) || COURSE.units.find(u => !kDone(u.id)) || COURSE.units[0];
// When the next unit waits behind a level test, the course goes on through that test
const kGate = () => { const u = kNext(); if (unitOpen(u.id)) return null; const i = COURSE.levels.findIndex(l => l.id === u.level); return i > 0 ? COURSE.levels[i - 1].id : null; };
const kTestBest = lv => (S.ktest && S.ktest[lv]) || 0;
/* The course order (2026-11-14, foydalanuvchi talabi). Levels open one after another: A1 first, the next one when
   the previous level's test is passed, or every level up to where the placement test put the learner. Inside a level
   the units open one by one (a unit when the one before it is finished) and the level test when all units are
   finished. Never locked: a unit already started (old progress stays reachable), units before the placement start
   (S.kStart), units a teacher assigned (S.gtk). */
const kStarted = id => !!(S.k[id] && (S.k[id].done || Object.keys(S.k[id].e || {}).length || Object.keys(S.k[id].v || {}).length));
const plReach = () => { const p = S.place || {}; return Math.max(...[p.passed, p.start, p.applied].map(x => LVS.indexOf(x))); };
const kTeacher = id => Object.values(S.gtk || {}).some(arr => (arr || []).some(t => t.kind === "k" && t.ref === id));
function lvOpen(lv) {
  const ids = COURSE.levels.map(l => l.id), i = ids.indexOf(lv);
  if (i <= 0 || plReach() >= i) return true;
  const prev = KLEVEL(ids[i - 1]);
  return kTestBest(prev.id) >= prev.test.pass || KLEVEL(lv).units.some(id => kStarted(id) || kTeacher(id));
}
function unitOpen(id) {
  const u = KU[id];
  if (!u) return false;
  if (kStarted(id) || kTeacher(id)) return true;
  if (!lvOpen(u.level)) return false;
  const lu = KLEVEL(u.level).units, k = lu.indexOf(id);
  return k <= 0 || u.idx <= (S.kStart || 0) || plReach() > LVS.indexOf(u.level) || kDone(lu[k - 1]);
}
const testOpen = lv => lvOpen(lv) && (KLEVEL(lv).units.every(kDone) || kTestBest(lv) > 0 || plReach() > LVS.indexOf(lv) || LVS.indexOf((S.place || {}).passed) >= LVS.indexOf(lv));
// Why something is locked, and what opens it
function lockWhy(lv, id) {
  if (!lvOpen(lv)) { const prev = COURSE.levels[COURSE.levels.findIndex(l => l.id === lv) - 1]; return `${lv} darajasi ${prev.id} testidan ${prev.test.pass}% olinganda ochiladi — yoki darajani aniqlash testi bilan.`; }
  if (id) { const lu = KLEVEL(lv).units, prevU = KU[lu[lu.indexOf(id) - 1]]; return `Avval ${prevU.level}.${prevU.n} «${prevU.title}» boʻlimini tugating.`; }
  return `${lv} testi shu darajaning barcha boʻlimlari tugagach ochiladi.`;
}
function lockedView(lv, id) {
  return `<div><a class="back" href="#course">${ICON.back}Kurs</a></div>
  <div class="glass pad lock-card">${mascot("sit")}<span class="lock-ico">${ICON.lock}</span><h2>Bu qism hali yopiq</h2><p>${esc(lockWhy(lv, id))}</p>
    <div class="lock-acts">${!lvOpen(lv) ? `<a class="btn btn-grad btn-block" href="#placement">Darajani aniqlash testi</a>` : ""}<a class="btn ${lvOpen(lv) ? "btn-grad" : "btn-ghost"} btn-block" href="#${kGate() ? `ktest-${kGate().toLowerCase()}` : kHash(kNext().id)}">${kGate() ? `${kGate()} testiga oʻtish` : "Joriy boʻlimga qaytish"}</a></div></div>`;
}

// Normalise an answer for comparison: drop notes in brackets, quotes and punctuation
// (a dash between two parts — «Saat kaç? — Saat üç.» — is not required: the tiles have no punctuation)
const ansNorm = s => fold(String(s).replace(/\([^)]*\)/g, " ").replace(/[«»"“”]/g, "").replace(/[’ʼ`]/g, "'").replace(/\s+[—–-]\s+/g, " "));
const ansPlain = s => plain(String(s).replace(/\([^)]*\)/g, " ").replace(/[«»"“”’ʼ`']/g, "").replace(/\s+[—–-]\s+/g, " "));
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
  box.innerHTML = `${catSVG({ pose: "head", cls: mood === "sad" ? "sad" : "happy", look: catLook() })}<p>${esc(text)}</p>`;
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
    if (b.table) { const tc = trCols(b.table.h, b.table.r); return `<div class="table-wrap glass" tabindex="0" role="region" aria-label="Jadval"><table class="gtable k-table"><thead><tr>${b.table.h.map(h => `<th scope="col">${esc(h)}</th>`).join("")}</tr></thead><tbody>${b.table.r.map(r => `<tr>${r.map((c, j) => tdTr(tc[j], esc(c))).join("")}</tr>`).join("")}</tbody></table></div>`; }
    if (b.gloss) return `<div class="k-gloss">${b.gloss.map(([a, c]) => `<span><b lang="tr">${esc(a)}</b> — ${esc(c)}</span>`).join("")}</div>`;
    if (b.dlg) {
      const sides = {};
      let n = 0;
      b.dlg.forEach(([who]) => { if (!(who in sides)) sides[who] = n++ % 2 ? "r" : "l"; });
      return `<div class="dlg">
        <button class="btn btn-soft" data-act="say-seq" data-lines="${esc(JSON.stringify(b.dlg.map(x => [x[0], x[1]])))}">${ICON.speak}Dialogni tinglash</button>
        ${b.dlg.map(([who, t]) => `<div class="bubble ${sides[who]}"><small>${esc(who)}</small><span lang="tr">${mw(t)}</span><button class="say mini" data-act="say" data-t="${esc(t)}" data-w="${esc(who)}" aria-label="Tinglash">${ICON.speak}</button></div>`).join("")}
      </div>`;
    }
    return "";
  }).join("");
}
// Lines are strings or [speaker, text]: each speaker gets a voice of their own (another voice, or another pitch)
// done() — once the last line has played (not when the sequence was cancelled)
// o.rate — a fixed speed (the exam plays its recordings at their own pace, whatever the learner's setting)
function speakSeq(lines, done, o = {}) {
  ttsCancel();
  const rate = o.rate || ttsRate();
  const who = [], run = ++SEQ_N;
  let i = 0;
  const next = () => {
    if (run !== SEQ_N) return;
    if (i >= lines.length) { if (done) done(); return; }
    const ln = lines[i++], spk = Array.isArray(ln) ? ln[0] : "", text = audioNorm(Array.isArray(ln) ? ln[1] : ln);
    if (spk && !who.includes(spk)) who.push(spk);
    const alt = spk ? who.indexOf(spk) % 2 === 1 : false;
    const later = () => setTimeout(next, 350);
    const tts = () => {
      if (nttsSay(text, 0.9 * rate, () => { if (run === SEQ_N) later(); }, alt ? 1.3 : 1)) return;
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "tr-TR"; u.rate = 0.9 * rate;
        const v = ttsVoice(alt); if (v) u.voice = v;
        // Only one Turkish voice: tell the speakers apart by pitch
        if (alt && trVoices().length < 2) u.pitch = 1.35;
        u.onend = () => { if (run === SEQ_N) later(); };
        speechSynthesis.speak(u);
      } catch (e) {}
    };
    // Recordings: the character's own voice, else the second speaker's "b", else "a"
    if (!playRec(text, spk ? whoVoices(spk, alt) : "a", o.rate || ttsRate() * 0.9 / 0.85, () => { if (run === SEQ_N) later(); }, tts)) tts();
  };
  next();
}
let SEQ_N = 0;

function kUnitRow(u) {
  const p = kProgress(u.id), done = kDone(u.id), open = unitOpen(u.id), now = !done && open && u === kNext();
  if (!open) return `<a class="unit glass locked" href="#${kHash(u.id)}"><span class="art"><span style="font-size:15px">${u.level}.${u.n}</span></span>
    <span class="unit-body"><span class="unit-title" lang="tr">${esc(u.title)}</span><span class="unit-sub">${esc(u.sub)}</span></span><span class="state lock" title="Yopiq">${ICON.lock}</span></a>`;
  return `<a class="unit glass${now ? " now" : ""}" href="#${kHash(u.id)}">
    <span class="art ${done ? "green" : LV_COLOR[u.level]}"><span style="font-size:15px">${u.level}.${u.n}</span></span>
    <span class="unit-body">${now ? `<small class="tag sky-t now-tag">Shu yerdan davom eting</small>` : ""}<span class="unit-title" lang="tr">${esc(u.title)}</span><span class="unit-sub">${esc(u.sub)}</span></span>
    ${done ? `<span class="state done" title="Tugallangan">${ICON.check}</span>` : pctRing(p)}
  </a>`;
}
let KLV = null;
function viewCourse() {
  const lvl = KLEVEL(KLV || kNext().level);
  const total = COURSE.units.length, done = kDoneCount();
  return `${topbar()}
  ${learnTabs("course")}
  <div class="k-hero">
    <div class="k-hero-txt"><span class="hero-chip"><i>${ICON.check}</i>100% bepul</span>
      <h2>Turk tili <span class="hl">A1 → C1</span></h2>
      <div class="hero-note"><span class="hero-ico">${HERO_CHART}</span><p>${COURSE.units.length} boʻlim, ${COURSE.levels.length} ta daraja testi va ${Object.values(KWORDS).reduce((a, w) => a + w.length, 0)} ta soʻz. Oʻzbek tilida tushuntirilgan, reklamasiz.</p></div></div>
    <div class="k-hero-cat"><span class="hero-bubble" aria-hidden="true">Aa</span><span class="hero-mini" aria-hidden="true">${ICON.book}</span>${catSVG({ pose: "read", acc: "cap", ears: "up", look: catLook(), cls: "mascot" })}</div>
    <div class="hero-prog"><span class="hero-ico">${ICON.trophy}</span><div><small>${done}/${total} boʻlim tugallangan</small>
      <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}" aria-label="Kurs: ${done}/${total} boʻlim"><i style="width:${pct(done, total)}%"></i></div></div></div>
    <a class="hero-go" href="#${kGate() ? `ktest-${kGate().toLowerCase()}` : `k-${kNext().id}`}" aria-label="Kursni davom ettirish">${ICON.arrow}</a>
  </div>
  ${S.place || done ? "" : `<a class="pcard glass" href="#placement" style="color:inherit;text-decoration:none;padding:14px 16px">
    <div class="pcard-head"><b>${ICON.target}Darajani aniqlash testi</b>${ICON.chev}</div>
    <p class="muted" style="margin:0">Turkchani biroz bilsangiz, 5–7 daqiqada mos boʻlimni topamiz.</p>
  </a>`}
  <div class="seg glass" role="tablist">${COURSE.levels.map(l => `<button role="tab" data-act="k-lv" data-l="${l.id}" aria-selected="${l.id === lvl.id}"${lvOpen(l.id) ? "" : ` aria-label="${l.id} — yopiq"`}>${l.id}${lvOpen(l.id) ? "" : `<i class="seg-lock">${ICON.lock}</i>`}</button>`).join("")}</div>
  ${S.kView === "list" ? "" : kPath(lvl)}
  ${S.kView !== "list" ? "" : `<div class="glass pad"><div class="pcard-head"><b>${esc(lvl.title)}</b><button class="path-toggle" data-act="k-view" data-v="path" aria-label="Yoʻl koʻrinishi">${ICON.flag}</button></div><p class="sub" style="margin-top:4px">${esc(lvl.intro)}</p></div>
  <div class="list">${lvl.units.map(id => kUnitRow(KU[id])).join("")}
    <a class="unit glass" href="#ktest-${lvl.id.toLowerCase()}">
      <span class="art teal"><span style="font-size:13px">TEST</span></span>
      <span class="unit-body"><span class="unit-title">${esc(lvl.test.title)}</span><span class="unit-sub">4 qism: Okuma · Dinleme · Yazma · Konuşma · oʻtish bali ${lvl.test.pass}%${kTestBest(lvl.id) ? ` · eng yaxshi natija ${kTestBest(lvl.id)}%` : ""}</span></span>
      ${kTestBest(lvl.id) >= lvl.test.pass ? `<span class="state done">${ICON.check}</span>` : ICON.chev}
    </a></div>`}`;
}
/* The learning path (Android 6-bosqich, 2-qism): the units of a level as round steps on a winding road, like a board
   game — done steps are gold with a tick, the current one is in the level colour with its progress ring, a
   "Boshlash"/"Davom etish" bubble and Pamuk beside it; the level test is a trophy at the end. Every step stays open
   (the course never locks a unit). S.kView = "list" shows the old list instead. */
const PATH_X = [0, -1, -1.6, -1, 0, 1, 1.6, 1];
function kPath(lvl) {
  const nx = kNext(), units = lvl.units.map(id => KU[id]), dn = units.filter(u => kDone(u.id)).length;
  const passed = kTestBest(lvl.id) >= lvl.test.pass;
  const node = (i, html, now) => `<div class="pn-row${now ? " now" : ""}" style="--x:${PATH_X[i % PATH_X.length]}">${html}</div>`;
  const steps = units.map((u, i) => {
    const done = kDone(u.id), open = unitOpen(u.id), now = !done && open && u === nx, p = kProgress(u.id);
    const st = done ? "done" : !open ? "lock" : now ? "now" : p > 0 ? "part" : "next";
    const say = now ? (p > 0 ? "Davom etish" : "Boshlash") : "";
    const cat = now ? `<span class="pn-cat${PATH_X[i % PATH_X.length] > 0 ? " left" : ""}" aria-hidden="true">${catSVG({ pose: "wave", look: catLook() })}</span>` : "";
    return node(i, `<a class="pnode s-${st}" href="#${kHash(u.id)}" style="--p:${Math.round(p * 100)}" aria-label="${say ? say + " " : ""}${u.level}.${u.n} ${esc(u.title)} — ${done ? "tugallangan" : now ? "shu yerdan davom eting" : p > 0 ? `${Math.round(p * 100)}%` : open ? "hali boshlanmagan" : "yopiq"}">
      ${say ? `<span class="pn-bubble">${say}</span>` : ""}<span class="pn-btn">${done ? ICON.check : now ? ICON.star : !open ? ICON.lock : `<b>${u.n}</b>`}</span>
      <span class="pn-label"><b>${u.level}.${u.n}</b> <span lang="tr">${esc(u.title)}</span></span></a>${cat}`, now);
  });
  const tOpen = testOpen(lvl.id);
  steps.push(node(units.length, `<a class="pnode s-test${passed ? " s-done" : tOpen ? "" : " s-lock"}" href="#ktest-${lvl.id.toLowerCase()}" aria-label="${lvl.id} testi${kTestBest(lvl.id) ? ` ${kTestBest(lvl.id)}%` : ""} — ${esc(lvl.test.title)}${passed ? ", oʻtilgan" : tOpen ? "" : ", yopiq"}">
    <span class="pn-btn">${ICON.trophy}${tOpen ? "" : `<i class="pn-lock">${ICON.lock}</i>`}</span><span class="pn-label"><b>${lvl.id} testi</b>${kTestBest(lvl.id) ? ` ${kTestBest(lvl.id)}%` : ""}</span></a>`));
  return `<section class="path lv-${LV_COLOR[lvl.id]}" aria-label="${lvl.id} darajasi yoʻli">
    <div class="path-banner"><div><small>${lvl.id} · ${dn}/${units.length} boʻlim</small><b>${esc(lvl.title)}</b></div>
      <button class="path-toggle" data-act="k-view" data-v="list" aria-label="Roʻyxat koʻrinishi">${ICON.list}</button></div>
    ${lvOpen(lvl.id) ? `<p class="sub path-intro">${esc(lvl.intro)}</p>` : `<div class="lock-note">${ICON.lock}<div><b>${lvl.id} darajasi hali yopiq</b><span>${esc(lockWhy(lvl.id))}</span><a class="link" href="#placement">Darajani aniqlash testi</a></div></div>`}
    <div class="path-road">${steps.join("")}</div>
  </section>`;
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
      <div class="glass pad k-read" lang="tr">${mw(r.text)}</div>${mwHint()}
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
      : `<div class="k-in"><input class="type-input k-input" id="ki-${id}-${key}" lang="tr" ${res === 1 ? "" : bkAttr(ans)} autocomplete="off" autocapitalize="off" spellcheck="false" value="${esc(val)}" aria-label="Javob ${esc(label || k)}"><button class="btn btn-soft" data-act="k-check" data-id="${id}" data-key="${key}">Tekshirish</button></div>`}
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
  if (!key.startsWith("r-") && value.trim()) morLog(ansVariants(right)[0], value, !!m);
  const was = st.e[key];
  const isMatch = !key.startsWith("r-") && (u.exercises.find(x => String(x.n) === key.split("-")[0]) || {}).match;
  skillLog(key.startsWith("r-") || isMatch ? "r" : "w", !!m);
  st.v[key] = value;
  st.e[key] = m ? 1 : 0;
  // The first try of every answer decides the reward for the whole exercise
  st.f = st.f || {};
  if (!(key in st.f)) st.f[key] = m ? 1 : 0;
  dayRec().rev++; S.acc[1]++; if (m) S.acc[0]++;
  save();
  const paid = kBlockAward(id, key);
  if (!paid) {
    if (m === 2) pamukSay("happy", praise());
    else if (m === 1) pamukSay("happy", "Deyarli toʻgʻri! Harflarga eʼtibor bering: " + right);
    else pamukSay("sad", comfort());
  }
  // A unit counts as finished at 70% correct
  if (!st.done && kProgress(id) >= 0.7) {
    st.done = todayKey(); addXPBonus(50); save();
    celebrate({ title: `${u.level}.${u.n} tugallandi!`, text: `«${u.title}» boʻlimini bepul va mustaqil tugatdingiz. +50 XP`, ico: "check", c: "green" });
  }
  return m;
}
// When every answer of one course exercise (or of the reading questions) is in: reading 40 / grammar 40 XP once
function kBlockAward(id, key) {
  const u = KU[id], st = kState(id), blk = key.split("-")[0];
  const keys = (u.keys || kKeys(u)).filter(k => k.split("-")[0] === blk);
  st.xb = st.xb || {};
  if (st.xb[blk] || !keys.length || keys.some(k => st.e[k] === undefined)) return null;
  st.xb[blk] = 1;
  const f = st.f || {}, right = keys.filter(k => (k in f ? f[k] : st.e[k]) === 1).length;
  const r = xpAward(blk === "r" ? "reading" : "grammar", { right, n: keys.length, key: `k|${id}|${blk}`, sk: [blk === "r" ? "r" : "w"] });
  pamukSay(r.xp ? "happy" : "sad", r.xp ? `Mashq bajarildi! +${r.xp} XP` : xpWhy(r) || "Mashq bajarildi!");
  return r;
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
    ${p.text ? `<div class="glass pad k-read" lang="tr">${mw(p.text)}</div>` : ""}
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
