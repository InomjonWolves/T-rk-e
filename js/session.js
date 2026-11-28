/* Türkçe Yoʻl — Router, the practice session, skills dashboard, listening, the listening/speaking mistakes notebook.
   One of the app's scripts (js/, loaded in order by index.html); they share one global scope. */

/* ---------- Router ---------- */
function route() {
  try { routeNow(); }
  catch (err) {
    if (err !== NEED_COURSE) throw err;
    app.innerHTML = `<div class="view">${catLoader()}</div>`;
    CatLife.scan();
    loadData().then(route, () => { app.innerHTML = `<div class="view"><div class="glass empty"><b>Kurs yuklanmadi</b><span class="muted">Internetni tekshiring.</span><button class="btn btn-grad" data-act="course-retry">Qayta urinish</button></div></div>`; });
  }
}
function routeNow() {
  let h = (location.hash || "#home").slice(1);
  if (h === "learn") h = LEARN_SEG;
  if (/^(guide|grammar|gx|g-|practice|group-|translate|achievements|profile)/.test(h)) needGram();
  { const ps = $("pamuk-say"); if (ps) { clearTimeout(sayT); ps.classList.remove("show"); } }
  let html, tab = h, after = null;
  const m = /^lesson-(\d+)$/.exec(h), gm = /^grammar-(\d+)$/.exec(h);
  if (m && UNITS[+m[1] - 1]) { html = viewUnit(+m[1] - 1); tab = "lessons"; }
  else if (gm && GRAMMAR[+gm[1] - 1]) { html = viewGrammar(+gm[1] - 1); tab = "lessons"; }
  else if (h.startsWith("g-") && GUIDE_ALL.find(i => gHash(i.code) === h)) { html = viewGuideTopic(GUIDE_ALL.find(i => gHash(i.code) === h)); tab = "lessons"; }
  else if (h === "guide") { html = viewGuide(); tab = "lessons"; }
  else if (h === "lugat") { html = viewLugat(); tab = "lessons"; }
  else if (h.startsWith("lugat-") && LBY[h.slice(6)]) { html = viewLugPack(LBY[h.slice(6)]); tab = "lessons"; }
  else if (h === "translate") { html = viewTranslate(); tab = "home"; }
  else if (h === "course") { html = viewCourse(); tab = "lessons"; }
  else if (h.startsWith("k-") && KU[h.slice(2)]) { const id = h.slice(2); html = unitOpen(id) ? viewCourseUnit(id) : lockedView(KU[id].level, id); tab = "lessons"; }
  else if (/^ktest-(a1|a2|b1|b2|c1)$/.test(h)) { const lv = h.slice(6).toUpperCase(); html = testOpen(lv) ? viewCourseTest(lv) : lockedView(lv); tab = "lessons"; }
  else if (h === "achievements") { html = viewAchievements(); tab = "profile"; }
  else if (h === "skills") { html = viewSkills(); tab = "profile"; }
  else if (h === "write") { html = viewWrite(); tab = "practice"; }
  else if (h === "placement") { html = viewPlacement(); tab = "lessons"; if (!plbReady()) after = () => loadPlb().then(route, () => toast("Test yuklanmadi. Internetni tekshiring")); }
  else if (h === "admin") { html = viewAdmin(); tab = "profile"; }
  else if (h === "groups") { html = viewGroups(); tab = "profile"; after = loadGroups; }
  else if (/^group-[A-Z0-9]{6}$/.test(h)) { html = viewGroup(h.slice(6)); tab = "profile"; after = () => loadGroup(h.slice(6)); }
  else if (/^join-[A-Za-z0-9]{6}$/.test(h)) { const c = grpNorm(h.slice(5)); html = viewJoin(c); tab = "profile"; after = () => viewJoinLoad(c); }
  else if (h === "help") { html = viewHelp(); tab = "profile"; }
  else if (h === "gx") { html = viewGx(); tab = "lessons"; }
  else if (h === "lessons") html = viewLessons();
  else if (h === "grammar") { html = viewGrammarList(); tab = "lessons"; }
  else if (h === "alphabet") { html = viewAlphabet(); tab = "lessons"; }
  else if (h === "practice") html = viewPractice();
  else if (h === "library") html = viewLibrary();
  else if (h === "rank") { html = viewRank(); after = loadRank; }
  else if (h === "oqish") { html = viewOqish(); tab = "practice"; if (!oqReady()) after = () => loadOq().then(route, () => toast("Matnlar yuklanmadi. Internetni tekshiring")); }
  else if (h === "lenta") { html = viewLenta(); tab = "lenta"; after = GRAM_FULL && typeof HK !== "undefined" ? lnMount : () => Promise.all([loadGram(), loadHk()]).then(route, () => toast("Lenta yuklanmadi. Internetni tekshiring")); }
  else if (h === "mock") { html = viewMockList(); tab = "home"; if (!mkReady()) after = () => loadMock().then(route, () => toast("Sinov yuklanmadi. Internetni tekshiring")); }
  else if (/^mock-[a-z0-9]+$/.test(h)) { html = viewMock(h.slice(5)); tab = "home"; if (!mkReady()) after = () => loadMock().then(route, () => toast("Sinov yuklanmadi. Internetni tekshiring")); }
  else if (h === "hikoya") { html = viewHikoyalar(); tab = "practice"; if (!hkReady()) after = () => loadHk().then(route, () => toast("Hikoyalar yuklanmadi. Internetni tekshiring")); }
  else if (/^hikoya-[a-z0-9]+$/.test(h)) { html = viewHikoya(h.slice(7)); tab = "practice"; if (!hkReady()) after = () => loadHk().then(route, () => toast("Hikoyalar yuklanmadi. Internetni tekshiring")); }
  else if (/^oqish-[a-z0-9]+$/.test(h)) { html = viewOqText(h.slice(6)); tab = "practice"; if (!oqReady()) after = () => loadOq().then(route, () => toast("Matnlar yuklanmadi. Internetni tekshiring")); }
  else if (h === "rank-fr") { RANK_TAB = "fr"; html = viewRank(); tab = "rank"; after = loadRank; }
  else if (/^do-[A-Za-z0-9]{6,40}$/.test(h)) { const u = h.slice(3); html = viewFriendInvite(u); tab = "rank"; after = () => friendInviteLoad(u); }
  else if (h === "profile") html = viewProfile();
  else if (h === "settings") { html = viewSettings(); tab = "profile"; }
  else { html = viewHome(); tab = "home"; }
  if (tab === "lessons" || tab === "practice" || tab === "library") tab = "learn";
  document.documentElement.classList.toggle("ln-open", h === "lenta");
  document.documentElement.classList.toggle("mk-run", !!(typeof MK !== "undefined" && MK && MK.phase === "run" && h === "mock-" + MK.id));
  app.innerHTML = `<div class="view" data-v="${esc(h.replace(/[^a-z].*$/, "") || "home")}">${html}</div>`;
  document.querySelectorAll(".nav a").forEach(a => { if (a.dataset.tab === tab) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  // A row of chips that scrolls sideways shows its chosen chip
  app.querySelectorAll(".chips").forEach(c => { const on = c.querySelector('[aria-pressed="true"]'); if (on && c.scrollWidth > c.clientWidth) c.scrollLeft = on.offsetLeft - (c.clientWidth - on.offsetWidth) / 2; });
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
  if (String(u).startsWith("l:")) return (LWORDS[u.slice(2)] || []).slice();
  if (String(u).startsWith("cat:")) { const c = CATS.find(c => c.id === u.slice(4)); return ALL.filter(w => c.ids.includes(UNITS[w.unit].id)); }
  return ALL.filter(w => w.unit === +u);
}
const typeable = w => !w.tr.includes("…") && w.tr.length <= 20;
function startSession(mode, u) {
  if (mode === "gx" || mode === "gxm") needGram();
  if (mode === "morf" && !MORPH_OK) { loadMorph().then(() => startSession(mode, u), () => toast("Internet aloqasini tekshiring")); return; }
  closeSheet();
  let items;
  if (mode === "review") {
    // Due reviews first (oldest first), then today's share of new words in lesson order
    items = dueWords().slice(0, 20).concat(newWords(Math.min(newLeft(), NEW_PER_DAY)));
    if (!items.length) { toast("Bugun takrorlash yoʻq. Erkin mashq qiling!"); return; }
  } else if (mode === "mistakes") {
    items = shuffle(mistakeWords().slice(0, 15));
    if (!items.length) { toast("Xatolar daftari boʻsh"); return; }
  } else if (mode === "morf") {
    items = morItems(u === "all" ? "" : u);
    if (!items.length) { toast("Mashq uchun material topilmadi"); return; }
  } else if (mode === "gx") {
    if (!BX[u]) u = gxNext();
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
  } else if (mode === "mix-l" || mode === "mix-w" || mode === "mix-s") {
    const sk = mode.slice(4);
    if (sk === "l" && !canSpeak()) { toast("Bu brauzerda ovoz yoʻq"); return; }
    if (sk === "s" && !canListen()) { toast("Bu brauzer nutqni tanimaydi. Chrome yoki Safari'da oching"); return; }
    if (sk === "w") needGram();
    const words = shuffle(pickPool(u || "all").filter(w => sayable(w) && typeable(w)).sort((a, b) => known(a) - known(b)).slice(0, 30)).slice(0, 7);
    const forms = { l: ["listen", "dict"], w: ["type", "dict"], s: ["say"] }[sk];
    items = words.map((w, i) => Object.assign({}, w, { _m: forms[i % forms.length] }));
    // Sentences: course dialog lines to hear or repeat, rule exercises to write
    if (sk === "l") items = items.concat(shuffle(lsItems("auto")).slice(0, 3));
    if (sk === "s") items = items.concat(lineItems("auto").slice(0, 3).map(x => Object.assign(x, { _m: "sayline" })));
    if (sk === "w") { const lv = kNext().level, ex = []; GX_CODES.filter(c => c.startsWith(lv)).forEach(c => BX[c].forEach((x, i) => { if (x.t === "t") ex.push({ gx: true, code: c, i, ex: x }); })); items = items.concat(shuffle(ex).slice(0, 3)); }
    items = shuffle(items);
    if (!items.length) { toast("Mashq uchun material topilmadi"); return; }
  } else {
    let pool = pickPool(u);
    if (mode === "type") pool = pool.filter(typeable);
    // Least-known words first, with a little randomness
    items = shuffle(shuffle(pool).sort((a, b) => known(a) - known(b)).slice(0, 10));
    if (mode === "mix") items = mixItems(items);
  }
  audioWarm(items.map(w => w && w.tr));
  SES = { mode, u, items, weak: mode === "review" || mode === "mistakes" ? mixWeak() : null, mixOff: Math.floor(Math.random() * 5), i: 0, right: 0, xp: 0, combo: 0, best: 0, t0: Date.now(), answered: false, re: new Set(), skAll: new Set(), times: [], last: Date.now(), had: ACH.filter(achDone).map(a => a.id) };
  sessionEl.hidden = false;
  document.body.style.overflow = "hidden";
  delete sessionEl.dataset.combo; { const cb = $("s-combo"); if (cb) cb.remove(); const sb = $("s-say"); if (sb) sb.remove(); }
  $("s-cat").innerHTML = catSVG({ pose: "head", look: catLook() });
  renderStep();
  CatLife.scan();
}
function closeSession() {
  sPeekOff(true);
  ttsCancel();
  micStop(true);
  if (SES) { SES.shown = 0; tick(); save(); }
  sessionEl.hidden = true; SES = null;
  document.body.style.overflow = "";
  route();
  celebrateQueued();
  if (PAMUK_LATER) { const [m, t] = PAMUK_LATER; PAMUK_LATER = null; setTimeout(() => pamukSay(m, t), 500); }
  setTimeout(guestNudge, 1200);
}
function progressBar() {
  const n = SES.items.length;
  $("s-bar").style.width = (SES.i / n * 100) + "%";
  $("s-count").textContent = Math.min(SES.i + 1, n) + "/" + n;
}
function renderStep() {
  delete sessionEl.dataset.r;
  if (SES.i >= SES.items.length) { const sb = $("s-say"); if (sb) sb.classList.remove("show"); return renderResult(); }
  SES.answered = false;
  if (SES.i === 0 && !SES.saidStart) { SES.saidStart = 1; setTimeout(() => { if (SES && SES.i === 0 && !SES.answered) sPeek(); }, 350); }
  else if (SES.items.length >= 5 && SES.i === SES.items.length - 1 && !SES.saidLast) { SES.saidLast = 1; sSay("last"); }
  SES.shown = Date.now();
  progressBar();
  const w = SES.items[SES.i];
  if (w.gx) { SES.m = "gx"; return renderGx(w); }
  if (w.ls) { SES.m = "ls"; return renderLs(w); }
  if (w.mor) { SES.m = "mor"; return renderMor(w); }
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
/* One mixed practice (2026-11-14, foydalanuvchi talabi): instead of separate exercise kinds, a session gives every
   word in another form — the meaning test (reading), writing with the letter bank, listening, dictation and saying it
   (the four skills) — the learner's weakest skill a little more often. Modes: "mix" (a lesson, a word pack, "all"),
   "mix-l" / "mix-w" / "mix-s" (one skill: its word forms plus course sentences or rule exercises); review and
   mistakes sessions mix the same way (new words still start as cards). */
const MIX_ORDER = ["quiz", "listen", "type", "say", "dict"];
const MIX_SK = { quiz: "r", listen: "l", type: "w", say: "s", dict: "l" };
function mixModes(w) {
  const out = ["quiz"];
  if (typeable(w)) out.push("type");
  if (canSpeak() && sayable(w)) { out.push("listen"); if (typeable(w)) out.push("dict"); }
  if (canListen() && sayable(w)) out.push("say");
  return out;
}
function mixPick(w, i, weak) {
  const ms = mixModes(w);
  // A new word: recognise it (meaning, hearing) or build it from the letter bank — no dictation or speaking yet
  if (!srs(w)) { const nw = ["quiz", "listen", "type"].filter(m => ms.includes(m)); return nw[i % nw.length]; }
  const want = weak && Object.keys(MIX_SK).find(m => MIX_SK[m] === weak && ms.includes(m));
  if (want && i % 3 === 0) return want;
  for (let k = 0; k < MIX_ORDER.length; k++) { const m = MIX_ORDER[(i + k) % MIX_ORDER.length]; if (ms.includes(m)) return m; }
  return "quiz";
}
const mixWeak = () => (recs().find(x => x.sk) || {}).sk;
const mixItems = (words, weak = mixWeak()) => words.map((w, i) => Object.assign({}, w, { _m: mixPick(w, i, weak) }));
function itemMode(w) {
  if (w._m) return w._m;
  if (SES.mode !== "review" && SES.mode !== "mistakes") return SES.mode;
  if (!srs(w)) return "cards";
  return mixPick(w, SES.i + (SES.mixOff || 0), SES.weak);
}
function renderCard(w) {
  SES.sk = ["r"];
  stage.innerHTML = `<div class="flip" id="flip">
    <div class="flip-inner">
      <button class="face" data-act="flip">
        <span class="q-label">Turkcha</span>
        <span class="q-word" lang="tr">${esc(w.tr)}</span>
        <span class="hint-tap">Tarjimani koʻrish uchun bosing</span>
      </button>
      <button class="face back-face" data-act="flip">
        <span class="q-label">Oʻzbekcha</span>
        <span class="q-word">${esc(w.uz)}</span>
        ${w.note ? `<span class="note">${esc(w.note)}</span>` : ""}
        <span class="sr">Kartochkani agʻdarish</span>
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
  stage.innerHTML = `<div class="q-card"><div class="q-label">${toUz ? "Bu soʻz nimani anglatadi?" : "Turkchasini toping"}</div>
    <div class="q-row"><div class="q-word" ${toUz ? 'lang="tr"' : ""}>${esc(toUz ? w.tr : w.uz)}</div>
    ${toUz ? `<button class="say" data-act="say" data-t="${esc(w.tr)}" aria-label="Tinglash">${ICON.speak}</button>` : ""}</div></div>
    <div class="options">${opts.map((o, i) => `<button class="opt" data-act="answer" data-ok="${o === w ? 1 : 0}" ${toUz ? "" : 'lang="tr"'}><span class="k">${"ABCD"[i]}</span>${esc(toUz ? o.uz : o.tr)}</button>`).join("")}</div>
    <div class="feedback" id="fb" aria-live="polite"></div>`;
  foot.innerHTML = `<button class="btn btn-grad btn-block" data-act="next" disabled>Keyingi</button>`;
  if (toUz) speak(w.tr);
}
function renderType(w) {
  SES.sk = ["w"];
  stage.innerHTML = `<div class="q-card"><div class="q-label">Turkchasini yozing</div>
    <div class="q-word">${esc(w.uz)}</div></div>
    ${bankBox(w.tr)}
    <div class="feedback" id="fb" aria-live="polite"></div>`;
  foot.innerHTML = `<button class="btn btn-ghost" data-act="type-skip">Bilmayman</button><button class="btn btn-grad" data-act="type-check">Tekshirish</button>`;
  $("type-form").addEventListener("submit", e => { e.preventDefault(); if (SES.answered) nextStep(); else checkType(); });
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
// A skill tile (and a skill tip): straight into that skill's mixed practice; reading opens the texts
function skGo(id) {
  if (id === "r") go("oqish");
  else if (id === "s" && !canListen()) speakSheet();
  else if (id === "l" && !canSpeak()) listenSheet();
  else startSession("mix-" + id, "all");
}
// Every separate exercise kind of the three skills, in one sheet (Mashq → «Alohida mashq turlari»)
function modesAllSheet() {
  openSheet(`<h3>Alohida mashq turlari</h3><p class="sub" style="margin:-4px 0 10px">Aralash mashqdan tashqari, bitta turni alohida ham mashq qilish mumkin.</p>
    <button class="mode glass" data-act="listen-modes"><span class="ico violet-t">${ICON.ear}</span><span><b>Tinglash</b><span>Tinglab toping · diktant · dialog gaplari · xatolar</span></span>${ICON.chev}</button>
    <button class="mode glass" data-act="write-modes"><span class="ico pink-t">${ICON.type}</span><span><b>Yozish</b><span>Soʻz yozish · diktant · erkin yozish tekshiruvi</span></span>${ICON.chev}</button>
    <button class="mode glass" data-act="speak-modes"><span class="ico green-t">${ICON.mic}</span><span><b>Gapirish</b><span>Talaffuz · gapni takrorlash · ogʻzaki javob · rolli dialog</span></span>${ICON.chev}</button>`);
}
/* ---------- Listening (Dinleme) ----------
   Three exercises built on the browser's text-to-speech: hear a word and pick its meaning, dictation,
   and course dialog lines played without text (pick the sentence you heard, or type the missing word). */
const canSpeak = () => "speechSynthesis" in window || !!AUDIO_SET || !!ntts();
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
  stage.innerHTML = `${listenNotice()}<div class="q-card"><div class="q-label">Tinglang va maʼnosini toping</div>
    ${playBtns(w.tr)}
    <div class="ls-reveal" id="ls-reveal" hidden><b lang="tr">${esc(w.tr)}</b> — ${esc(w.uz)}</div></div>
    <div class="options">${opts.map((o, i) => `<button class="opt" data-act="answer" data-ok="${o === w ? 1 : 0}"><span class="k">${"ABCD"[i]}</span>${esc(o.uz)}</button>`).join("")}</div>
    <div class="feedback" id="fb" aria-live="polite"></div>`;
  foot.innerHTML = `<button class="btn btn-grad btn-block" data-act="next" disabled>Keyingi</button>`;
  speak(w.tr);
}
/* Letter bank (2026-11-14, foydalanuvchi talabi): written answers are built from tiles — the answer's own letters
   shuffled with 5–6 extra ones (first the look-alikes: ı/i, ş/s, ç/c, ğ/g, ö/o, ü/u…) — so the phone keyboard is
   not needed. Long answers (over BANK_MAX letters or 3+ words) come as word tiles with a few extra words. The tiles
   write into #type-input, so every check reads the same field; «Klaviatura» switches to typing (inputmode text). */
const BANK_MAX = 16;
const BANK_TWIN = { ı: "i", i: "ı", ş: "s", s: "ş", ç: "c", c: "ç", ğ: "g", g: "ğ", ö: "o", o: "ö", ü: "u", u: "ü", e: "a", a: "e", k: "g", d: "t", t: "d", b: "p", p: "b", r: "l", l: "r", n: "m", m: "n" };
let BANK = null;
function bankTiles(answer) {
  const ans = String(answer).replace(/[?!.,;:…«»"]/g, "").replace(/\s[—–-](?=\s)/g, " ").replace(/\s+/g, " ").trim();
  const words = ans.split(" ");
  if (ans.replace(/ /g, "").length > BANK_MAX || words.length >= 3) {
    // Word tiles: the answer's words and up to 3 others of a similar length from the vocabulary
    const extra = shuffle(ALL.map(w => w.tr).filter(t => !/ /.test(t) && !words.includes(t) && t.length >= 2 && t.length <= 12)).slice(0, Math.min(3, words.length));
    return { kind: "w", tiles: shuffle([...words, ...extra]) };
  }
  const letters = [...ans].map(c => c === " " ? "␣" : c);
  const low = ans.toLocaleLowerCase("tr"), pool = [];
  [...low].forEach(c => { const t = BANK_TWIN[c]; if (t && !low.includes(t) && !pool.includes(t)) pool.push(t); });
  const n = letters.length <= 3 ? 5 : 6;
  for (const c of shuffle("aeiıoöuübcçdgğklmnprsştyz".split(""))) { if (pool.length >= n) break; if (!pool.includes(c)) pool.push(c); }
  // An answer in capitals (a letter of the alphabet, an abbreviation) gets capital extras too
  const up = ans !== low && ans === ans.toLocaleUpperCase("tr");
  return { kind: "l", tiles: shuffle([...letters, ...shuffle(pool).slice(0, n).map(c => up ? c.toLocaleUpperCase("tr") : c)]) };
}
function bankBox(answer, ph = "Javobingiz…") {
  const t = bankTiles(answer);
  BANK = { kind: t.kind, tiles: t.tiles, used: [] };
  return `<form class="type-box bank-box" id="type-form" autocomplete="off">
    <label for="type-input" class="sr">Javob</label>
    <div class="bank-line"><input class="type-input" id="type-input" lang="tr" inputmode="none" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="${esc(ph)}">
      <button type="button" class="icon-btn bank-del" data-act="bk-del" aria-label="Oxirgisini oʻchirish"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 5H9l-6 7 6 7h12z"/><path d="m16 9-5 6M11 9l5 6"/></svg></button></div>
    <div class="bank${t.kind === "w" ? " words" : ""}" id="bank">${t.tiles.map((x, i) => `<button type="button" class="bk" data-act="bk" data-i="${i}" lang="tr">${esc(x)}</button>`).join("")}</div>
    <button type="button" class="link bank-kbd" data-act="bk-kbd">Klaviatura bilan yozish</button>
    <div class="keys" hidden>${["ç", "ş", "ğ", "ı", "İ", "ö", "ü", "'"].map(k => `<button type="button" data-act="key" data-k="${k}">${k}</button>`).join("")}</div>
  </form>`;
}
function bankWrite() {
  const inp = $("type-input"); if (!inp || !BANK) return;
  const parts = BANK.used.map(i => BANK.tiles[i].replace("␣", " "));
  inp.value = BANK.kind === "w" ? parts.join(" ") : parts.join("");
  document.querySelectorAll("#bank .bk").forEach(b => b.classList.toggle("used", BANK.used.includes(+b.dataset.i)));
}
const typeBox = answer => bankBox(answer, "Eshitganingizni yozing…");
/* The same tiles for pages with many answer fields (course exercises, level tests, the placement test): a tap on a
   field opens its tiles right under it — one panel at a time; the phone keyboard stays closed (inputmode none).
   The field keeps its own value, so the checks read it as before; «Klaviatura» turns one field back to typing. */
let IB = null;
const bkAttr = ans => `inputmode="none" data-bk="${esc(ansVariants(ans)[0])}"`;
function ibClose() { const el = $("ibank"); if (el) el.remove(); IB = null; }
function ibOpen(inp) {
  if (!inp || inp.disabled || inp.dataset.kbd || !inp.dataset.bk) return ibClose();
  if (IB && IB.inp === inp && $("ibank")) return;
  ibClose();
  const t = inp._bk || (inp._bk = bankTiles(inp.dataset.bk)), used = [];
  // Tiles already spent by what the field holds
  const parts = t.kind === "w" ? inp.value.trim().split(/\s+/).filter(Boolean) : [...inp.value].map(c => c === " " ? "␣" : c);
  parts.forEach(x => { const i = t.tiles.findIndex((y, j) => y === x && !used.includes(j)); if (i >= 0) used.push(i); });
  IB = { inp, kind: t.kind, tiles: t.tiles, used };
  const box = document.createElement("div");
  box.id = "ibank"; box.className = "ibank";
  box.innerHTML = `<div class="bank${t.kind === "w" ? " words" : ""}">${t.tiles.map((x, i) => `<button type="button" class="bk${used.includes(i) ? " used" : ""}" data-act="ibk" data-i="${i}" lang="tr">${esc(x)}</button>`).join("")}</div>
    <div class="ib-acts"><button type="button" class="link" data-act="ibk-kbd">Klaviatura bilan yozish</button>
      <button type="button" class="icon-btn bank-del" data-act="ibk-del" aria-label="Oxirgisini oʻchirish"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 5H9l-6 7 6 7h12z"/><path d="m16 9-5 6M11 9l5 6"/></svg></button></div>`;
  (inp.closest(".k-in") || inp).after(box);
  if (box.scrollIntoView) box.scrollIntoView({ block: "nearest" });
}
function ibSync() {
  IB.inp.dispatchEvent(new Event("input", { bubbles: true }));
  document.querySelectorAll("#ibank .bk").forEach(b => b.classList.toggle("used", IB.used.includes(+b.dataset.i)));
}
function ibTap(i) {
  if (!IB || !IB.inp.isConnected || IB.used.includes(i)) return;
  const inp = IB.inp, t = IB.tiles[i];
  IB.used.push(i);
  inp.value = IB.kind === "w" ? (inp.value.trim() ? inp.value.trim() + " " : "") + t : inp.value + (t === "␣" ? " " : t);
  ibSync();
}
function ibDel() {
  if (!IB || !IB.inp.isConnected) return;
  const inp = IB.inp, i = IB.used.pop(), t = i == null ? "" : IB.tiles[i] === "␣" ? " " : IB.tiles[i];
  inp.value = t && inp.value.endsWith(t) ? inp.value.slice(0, -t.length) : inp.value.slice(0, -1);
  if (IB.kind === "w") inp.value = inp.value.trimEnd();
  ibSync();
}
function ibKbd() {
  if (!IB) return;
  const inp = IB.inp;
  inp.dataset.kbd = "1"; inp.setAttribute("inputmode", "text");
  ibClose(); inp.focus();
}
function renderDict(w) {
  SES.sk = ["l", "w"];
  stage.innerHTML = `${listenNotice()}<div class="q-card"><div class="q-label">Diktant: eshitganingizni turkcha yozing</div>
    ${playBtns(w.tr)}
    <div class="ls-reveal" id="ls-reveal" hidden><b lang="tr">${esc(w.tr)}</b> — ${esc(w.uz)}</div></div>
    ${typeBox(w.tr)}
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
    stage.innerHTML = `${listenNotice()}<div class="q-card"><div class="q-label">Qaysi gapni eshitdingiz?</div>
      ${playBtns(it.t)}</div>
      <div class="options">${it.opts.map((o, i) => `<button class="opt" lang="tr" data-act="ls-ans" data-o="${i}"><span class="k">${"ABC"[i]}</span>${esc(o)}</button>`).join("")}</div>
      <div class="feedback" id="fb" aria-live="polite"></div>`;
    foot.innerHTML = `<button class="btn btn-grad btn-block" data-act="next" disabled>Keyingi</button>`;
  } else {
    SES.sk = ["l", "w"];
    stage.innerHTML = `${listenNotice()}<div class="q-card"><div class="q-label">Tinglang va tushib qolgan soʻzni yozing</div>
      ${playBtns(it.t)}
      <div class="q-sent" lang="tr">${blankHtml(it.shown)}</div></div>
      ${typeBox(it.word)}
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
  if (ok) { SES.right++; skillLog(SES.sk, true); save(); sMood("happy"); }
  else {
    skillLog(SES.sk, false); save(); sMood("sad");
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
