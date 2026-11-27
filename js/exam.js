/* Türkçe Yoʻl — imtihon sinovi (mock): toʻliq imtihon yoki bitta boʻlim, vaqt bilan, avtomatik baholash va tahlil.
   One of the app's scripts (js/, loaded in order by index.html); the tests live in mock.js (loaded on demand).

   #mock — the tests; #mock-<id> — one test: its start page, the exam itself (MK) or the result of the last run.
   A run (MK) goes section by section (Tinglash → Oʻqish → Yozish → Gapirish, or one of them): an intro page, then the
   section with its own clock. The clock runs only while the exam page is open and visible (leaving pauses it); a section
   ends by hand or when the time is up. Listening audio plays at most MK_PLAYS times (the characters' own voices,
   speakSeq). Writing is scored by the writing check (wrCheck: length, the task's points, connectors, spelling,
   punctuation); speaking by the browser's speech recognition (length, variety, connectors, the topic's words) — both are
   estimates and say so. Every section is scored 0–75; the whole test is their average, the level comes from MOCK.scale.
   The run is kept in localStorage (MK_KEY): a reload goes on where it stopped; the scores in S.mk[id]
   ({b — best full test, l — last, n — full runs, s: {l, r, w, s} — best per section, d — day}). XP per section
   (key "mk|<id>|<section>"), every answer counts for its skill (skillLog).
   Strict mode (S.mkStrict, chosen before a run): the clock keeps running away from the page (deadline MK.dl), every
   audio plays once, listening and reading go forward only, a spoken answer cannot be redone. History S.mkh
   ({<time36>: {t, v, s, f — full, x — strict}}, 40 newest): the chart and the list under each test, the change since the
   last run on the result. Mistakes S.mkm ({"<test>|<section>|<question>": time·4 + rights still needed}; 0 — fixed; the
   latest event wins when two devices merge): wrong listening/reading answers, drilled on #mock-fix together with the same
   part of other tests; two right answers clear one. Writing gets four criteria (mkWriteCheck → c) and a model answer
   (task.m); speaking a model answer (q.m) and, where the browser can, the learner's own recording (MediaRecorder, kept
   for the session only; off by default on Android, where it can take the microphone from speech recognition). */
let MK = null, MK_P = null, MK_PLAYING = null, MK_FOCUS = null, MK_MIC = null, MK_TK = 0, MK_SAVE_T = 0;
const MK_KEY = "ty-mock-run", MK_PLAYS = 2, MK_SECS = ["l", "r", "w", "s"], MK_HIST = 40;
let MK_RECS = {}, MK_REC = null, MK_RECOFF = false, MKF = null;
const mkPlays = () => (MK && MK.strict ? 1 : MK_PLAYS);
const mkFwd = sec => MK && MK.strict && (sec === "l" || sec === "r");
const MK_KIND = { l: "listening", r: "reading", w: "writing", s: "speaking" };
const mkReady = () => typeof MOCK !== "undefined";
function loadMock() {
  if (mkReady()) return Promise.resolve();
  return MK_P || (MK_P = loadScript("mock.js").catch(e => { MK_P = null; throw e; }));
}
const mkTest = id => mkReady() ? MOCK.tests.find(t => t.id === id) : null;
const mkSk = sec => SKILLS.find(x => x.id === sec);
const mkClock = s => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const mkRe = src => new RegExp(`(^|[^a-zçğıöşü])(${src})`);
const mkWords = t => String(t || "").trim().split(/\s+/).filter(w => /[a-zçğıöşüA-ZÇĞİÖŞÜ]/.test(w)).length;
function mkLevel(v) { for (const [lv, min] of MOCK.scale.bands) if (v >= min) return lv; return "B1 dan past"; }
// The questions of a listening or reading section, numbered through the section
function mkQs(t, sec) {
  const out = [];
  t[sec].parts.forEach((p, pi) => p.qs.forEach((q, qi) => out.push({ p, pi, q, qi, k: `${pi}.${qi}`, n: out.length + 1 })));
  return out;
}
// Speaking: every question of every part is one turn
function mkTurns(t) {
  const out = [];
  t.s.parts.forEach((p, pi) => p.qs.forEach((q, qi) => out.push({ p, pi, q, qi, prep: p.prep, talk: p.talk })));
  return out;
}
const mkSecMin = (t, sec) => sec === "s" ? Math.ceil(mkTurns(t).reduce((a, x) => a + x.prep + x.talk + 20, 0) / 60) : t[sec].min;
const mkSecCount = (t, sec) => sec === "w" ? t.w.tasks.length : sec === "s" ? mkTurns(t).length : mkQs(t, sec).length;
const mkSecUnit = sec => sec === "w" ? "topshiriq" : sec === "s" ? "savol" : "savol";

/* ---------- The run ---------- */
function mkSave() { try { localStorage.setItem(MK_KEY, JSON.stringify(MK)); } catch (e) {} }
function mkSaveSoon() { clearTimeout(MK_SAVE_T); MK_SAVE_T = setTimeout(mkSave, 700); }
function mkLoad() {
  if (MK) return MK;
  try { MK = JSON.parse(localStorage.getItem(MK_KEY) || "null"); } catch (e) { MK = null; }
  if (MK && !mkTest(MK.id)) MK = null;
  // A reload in the middle of speaking starts that turn again
  if (MK && MK.sp && MK.sp.st !== "rev") MK.sp.st = "ready";
  if (MK && MK.phase === "wait") MK.phase = "run";
  return MK;
}
const mkBusy = () => MK && MK.phase !== "done";
function mkStart(id, which) {
  const t = mkTest(id);
  if (!t) return;
  if (mkLoad() && mkBusy() && MK.started) { toast("Boshlangan sinovni davom ettiring yoki bekor qiling"); go("mock-" + MK.id); return; }
  const secs = which === "all" ? MK_SECS.slice() : [which];
  Object.values(MK_RECS).forEach(u => { try { URL.revokeObjectURL(u); } catch (e) {} }); MK_RECS = {};
  MK = { id, secs, full: which === "all", strict: !!S.mkStrict, si: 0, pi: 0, phase: "intro", left: 0, t: 0, started: 0, ans: { l: {}, r: {}, w: {}, s: {} }, ord: {}, plays: {}, used: {}, score: {}, xp: {}, sp: { i: 0, st: "ready" }, res: null };
  // Options of a question with its own choices come in a new order every run (shared A–F options keep theirs)
  ["l", "r"].forEach(sec => mkQs(t, sec).forEach(x => { if (x.q.o) MK.ord[sec + x.k] = shuffle(x.q.o.map((_, i) => i)); }));
  mkSave();
  go("mock-" + id);
}
function mkBegin() {
  const t = mkTest(MK.id), sec = MK.secs[MK.si];
  MK.phase = "run"; MK.pi = 0; MK.t = 0; MK.started = MK.started || Date.now();
  if (sec === "s") MK.sp = { i: 0, st: "ready" };
  else { MK.left = t[sec].min * 60; MK.dl = Date.now() + MK.left * 1000; }
  mkSave(); mkRender(true);
}
function mkAway() {
  if (!MK) return;
  if (MK_PLAYING) { MK_PLAYING = null; ttsCancel(); }
  // Strict: a spoken answer left half-way counts as it is; otherwise the turn starts again on return
  if (MK.sp && MK.sp.st === "talk" && MK.strict && MK.phase === "run") mkSpStop();
  else if (MK.sp && (MK.sp.st === "prep" || MK.sp.st === "talk")) { mkMicStop(); mkRecStop(); MK.sp.st = "ready"; }
  MK.t = 0; mkSave();
}
window.addEventListener("hashchange", () => {
  if (MK && location.hash !== "#mock-" + MK.id) mkAway();
  // A finished drill starts afresh next time; an unfinished one waits where it stopped
  if (MKF && location.hash !== "#mock-fix") { ttsCancel(); if (MKF.done) MKF = null; }
});
// The clock: one tick a second; counts only while the exam page is open and visible
function mkTick() {
  if (!MK || MK.phase !== "run") return;
  const now = Date.now(), on = location.hash === "#mock-" + MK.id && !document.hidden, sec = MK.secs[MK.si];
  const dt = on && MK.t ? Math.min(5, (now - MK.t) / 1000) : 0;
  MK.t = on ? now : 0;
  // Strict: the deadline counts, wherever the learner is; the section ends once the exam page is open again
  if (MK.strict && sec !== "s" && MK.dl) MK.left = Math.max(0, (MK.dl - now) / 1000);
  if (!on) return;
  MK.used[sec] = (MK.used[sec] || 0) + dt;
  if (sec === "s") { mkSpTick(now); return; }
  if (!MK.strict) MK.left = Math.max(0, MK.left - dt);
  const el = $("mk-time");
  if (el) { el.textContent = mkClock(MK.left); el.classList.toggle("low", MK.left <= 300); }
  if (MK.left <= 0) { toast("Vaqt tugadi — boʻlim yakunlandi"); mkEnd(); return; }
  if (++MK_TK % 10 === 0) mkSave();
}
setInterval(mkTick, 1000);

/* ---------- Pages ---------- */
function mkSecGrid(t) {
  return `<div class="mk-grid">${MK_SECS.map(sec => { const k = mkSk(sec);
    return `<div class="mk-cell"><span class="ico ${k.c}-t">${ICON[k.ico]}</span><b>${k.uz}</b><small>${mkSecCount(t, sec)} ${mkSecUnit(sec)} · ${mkSecMin(t, sec)} daq</small></div>`; }).join("")}</div>`;
}
function mkTestCard(t) {
  const r = (S.mk || {})[t.id] || {}, k = (sec, n) => `<button class="btn btn-soft mk-one" data-act="mk-start" data-id="${t.id}" data-s="${sec}">${ICON[mkSk(sec).ico]}${mkSk(sec).uz}${r.s && r.s[sec] != null ? ` <small>${r.s[sec]}</small>` : ""}</button>`;
  const total = MK_SECS.reduce((a, s) => a + mkSecMin(t, s), 0);
  return `<div class="glass pad mk-test">
    <div class="mk-test-head"><div><b lang="tr">${esc(t.tr)}</b><small>${esc(t.uz)} · ~${Math.round(total / 6) / 10} soat</small></div>
      ${r.b != null ? `<span class="mk-best" title="Eng yaxshi natija"><b>${r.b}</b><small>/ ${MOCK.scale.max}</small></span>` : ""}</div>
    ${mkSecGrid(t)}
    <button class="btn btn-grad btn-block" data-act="mk-start" data-id="${t.id}" data-s="all">${ICON.trophy}Toʻliq sinovni boshlash</button>
    <p class="muted mk-or">Yoki faqat bitta boʻlim:</p>
    <div class="mk-ones">${MK_SECS.map(s => k(s)).join("")}</div>
    <button class="set-row mk-strict" data-act="mk-strict" role="switch" aria-checked="${!!S.mkStrict}"><span><b>Qatʼiy rejim</b><small>Haqiqiy imtihondagidek: vaqt toʻxtamaydi, audio 1 marta, orqaga qaytib boʻlmaydi</small></span><span class="switch"></span></button>
  </div>
  ${mkHistHTML(t)}`;
}
/* ---------- History ---------- */
const mkHistList = id => Object.entries(S.mkh || {}).filter(([, h]) => h && h.t === id).map(([k, h]) => Object.assign({ at: parseInt(k, 36) }, h)).sort((a, b) => a.at - b.at);
const mkDay = at => { const d = new Date(at); return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`; };
function mkHistAdd(t, v) {
  S.mkh = S.mkh || {};
  const s = {}; MK.secs.forEach(x => { s[x] = MK.score[x].v; });
  S.mkh[Date.now().toString(36)] = { t: t.id, v, s, f: MK.full ? 1 : 0, x: MK.strict ? 1 : 0 };
  const keys = Object.keys(S.mkh).sort((a, b) => parseInt(a, 36) - parseInt(b, 36));
  keys.slice(0, Math.max(0, keys.length - MK_HIST)).forEach(k => delete S.mkh[k]);
}
// The total of every full run as one line on the 0–75 scale, the level bands as quiet reference lines
function mkChart(runs) {
  const max = MOCK.scale.max, W = 320, H = 150, L = 30, R = 26, T = 12, B = 22, pts = runs.slice(-12);
  const x = i => pts.length < 2 ? L + (W - L - R) / 2 : L + i * (W - L - R) / (pts.length - 1), y = v => T + (1 - v / max) * (H - T - B);
  const bands = MOCK.scale.bands.map(([lv, min]) => `<line class="mk-ch-band" x1="${L}" x2="${W - R}" y1="${y(min)}" y2="${y(min)}"/><text class="mk-ch-lab" x="${W - R + 4}" y="${y(min) + 4}">${lv}</text>`).join("");
  const line = pts.length > 1 ? `<polyline class="mk-ch-line" points="${pts.map((p, i) => `${x(i)},${y(p.v)}`).join(" ")}"/>` : "";
  const dots = pts.map((p, i) => `<g class="mk-ch-pt"><circle class="mk-ch-hit" cx="${x(i)}" cy="${y(p.v)}" r="13"/><circle class="mk-ch-dot" cx="${x(i)}" cy="${y(p.v)}" r="4.5"/><title>${mkDay(p.at)} · ${p.v}/${max} (${mkLevel(p.v)})${p.x ? " · qatʼiy" : ""}</title></g>`).join("");
  const last = pts[pts.length - 1];
  const axis = `<text class="mk-ch-ax" x="${L - 6}" y="${y(0) + 4}" text-anchor="end">0</text><text class="mk-ch-ax" x="${L - 6}" y="${y(max) + 4}" text-anchor="end">${max}</text><line class="mk-ch-base" x1="${L}" x2="${W - R}" y1="${y(0)}" y2="${y(0)}"/>`;
  const days = pts.map((p, i) => i === 0 || i === pts.length - 1 ? `<text class="mk-ch-ax" x="${x(i)}" y="${H - 6}" text-anchor="middle">${mkDay(p.at)}</text>` : "").join("");
  return `<svg class="mk-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Toʻliq sinov natijalari: ${pts.map(p => p.v).join(", ")} (0–${max})">${axis}${bands}${line}${dots}${days}
    <text class="mk-ch-val" x="${Math.min(x(pts.length - 1), W - R - 8)}" y="${y(last.v) - 10}" text-anchor="middle">${last.v}</text></svg>`;
}
function mkHistHTML(t) {
  const all = mkHistList(t.id);
  if (!all.length) return "";
  const full = all.filter(h => h.f), max = MOCK.scale.max;
  const row = h => `<div class="mk-hrow"><span class="mk-hday">${mkDay(h.at)}</span>
    <span class="mk-hsecs">${MK_SECS.filter(s => h.s[s] != null).map(s => `<span class="mk-hs ${mkSk(s).c}-t" title="${mkSk(s).uz}">${ICON[mkSk(s).ico]}${h.s[s]}</span>`).join("")}${h.x ? `<span class="tag pink-t">qatʼiy</span>` : ""}</span>
    <b>${h.f ? `${h.v}<small>/${max}</small>` : `<small>${mkSk(Object.keys(h.s)[0]).uz}</small>`}</b></div>`;
  return `<section class="section"><div class="section-head"><h2>Natijalar tarixi</h2><span class="muted">${all.length} ta urinish</span></div>
    <div class="glass pad mk-hist">
      ${full.length ? `<p class="mk-ch-title"><b>Toʻliq sinov · umumiy ball</b>${full.length > 1 ? ` <span class="mk-delta ${full[full.length - 1].v >= full[full.length - 2].v ? "up" : "down"}">${mkDelta(full[full.length - 1].v - full[full.length - 2].v)}</span>` : ""}</p>${mkChart(full)}` : `<p class="muted">Toʻliq sinov topshirsangiz, umumiy ball oʻsishi shu yerda grafikda koʻrinadi.</p>`}
      <div class="mk-hrows">${all.slice(-8).reverse().map(row).join("")}</div>
    </div></section>`;
}
const mkDelta = d => (d > 0 ? `+${d}` : d < 0 ? `−${-d}` : "±0");
// The run before this one of the same kind (the full test, or the same single section)
function mkPrev() {
  const runs = mkHistList(MK.id).filter(h => MK.full ? h.f : !h.f && h.s[MK.secs[0]] != null);
  return runs.length > 1 ? runs[runs.length - 2] : null;
}
function mkResumeCard() {
  if (!mkLoad() || !mkBusy() || !MK.started) return "";
  const t = mkTest(MK.id), sec = mkSk(MK.secs[MK.si]);
  return `<div class="glass pad mk-resume"><b>${ICON.clock}Boshlangan sinov: <span lang="tr">${esc(t.tr)}</span></b>
    <p class="muted">Hozirgi boʻlim: ${sec.uz}${MK.phase === "run" && MK.secs[MK.si] !== "s" ? ` · ${mkClock(MK.left)} qoldi` : ""}. ${MK.strict ? "Qatʼiy rejim: vaqt toʻxtamaydi." : "Vaqt faqat sinov oynasi ochiq turganda yuradi."}</p>
    <div class="fr-actions"><button class="btn btn-ghost" data-act="mk-cancel">Bekor qilish</button><a class="btn btn-grad" href="#mock-${MK.id}">Davom ettirish</a></div></div>`;
}
function viewMockList() {
  if (!mkReady()) return `${topbar()}${catLoader()}`;
  const sc = MOCK.scale;
  return `${topbar()}
  <div><a class="back" href="#practice">${ICON.back}Mashq</a></div>
  <div class="lesson-head"><div class="tags"><span class="tag orange-t">${ICON.trophy}Imtihon sinovi</span></div>
    <h1>Imtihon sinovi</h1><p class="sub">Haqiqiy imtihondagidek: toʻrt boʻlim, vaqt chegarasi, avtomatik baholash va har bir xatoning izohi.</p></div>
  ${mkResumeCard()}
  ${mkFixCard()}
  ${MOCK.tests.map(mkTestCard).join("")}
  <details class="glass mk-how"><summary><b>Qanday baholanadi?</b></summary>
    <div class="mk-how-body">
      <p>Har bir boʻlim <b>0–${sc.max}</b> ball bilan baholanadi, umumiy ball — toʻrt boʻlimning oʻrtachasi.</p>
      <div class="mk-bands">${sc.bands.map(([lv, min], i) => `<span class="tag ${LV_COLOR[lv] || "sky"}-t">${lv}: ${min}${i ? `–${sc.bands[i - 1][1] - 1}` : `–${sc.max}`}</span>`).join("")}<span class="tag">B1 dan past: 0–${sc.bands[sc.bands.length - 1][1] - 1}</span></div>
      <p>Tinglash va oʻqish — toʻgʻri javoblar soni boʻyicha. Yozish va gapirish avtomatik tekshiriladi: hajm, topshiriq talablari, bogʻlovchilar, imlo, mavzu soʻzlari. Bu <b>taxminiy</b> baho — rasmiy imtihonda ularni imtihonchilar baholaydi.</p>
      <p>Vaqt faqat sinov oynasi ochiq turganda yuradi: chiqib ketsangiz, sinov toʻxtab turadi va javoblaringiz saqlanadi. <b>Qatʼiy rejimda</b> esa vaqt toʻxtamaydi, har bir audio bir marta eshittiriladi va oldingi qismga qaytib boʻlmaydi.</p>
    </div></details>`;
}
function viewMock(id) {
  if (!mkReady()) return `${topbar()}${catLoader()}`;
  if (id === "fix") return viewMockFix();
  const t = mkTest(id);
  if (!t) return `${topbar()}<div class="glass empty"><b>Sinov topilmadi</b><a class="link" href="#mock">Barcha sinovlar</a></div>`;
  mkLoad();
  if (MK && MK.id === id) {
    if (MK.phase === "done") return mkResultHTML(t);
    return mkRunHTML(t);
  }
  return `${topbar()}<div><a class="back" href="#mock">${ICON.back}Imtihon sinovi</a></div>${mkTestCard(t)}`;
}
// Redraw in place (the page does not slide in again); top — scroll to the top of the page
function mkRender(top) {
  const v = document.querySelector('.view[data-v="mock"]');
  if (!v || !MK || location.hash !== "#mock-" + MK.id) return;
  const y = window.scrollY, box = document.createElement("div");
  box.innerHTML = viewMock(MK.id);
  v.replaceChildren(...box.childNodes);
  document.documentElement.classList.toggle("mk-run", MK.phase === "run");
  CatLife.scan();
  window.scrollTo(0, top ? 0 : y);
}

/* ---------- The exam ---------- */
function mkBar(t, sec) {
  const k = mkSk(sec), n = MK.secs.length;
  return `<div class="mk-bar"><a class="mk-exit" href="#mock" aria-label="Toʻxtatish va chiqish">${ICON.back}</a>
    <span class="mk-where"><b>${k.uz}</b><small>${n > 1 ? `${MK.si + 1}/${n}-boʻlim · ` : ""}<span lang="tr">${esc(t.tr)}</span></small></span>
    <span class="mk-time${sec !== "s" && MK.left <= 300 ? " low" : ""}" id="mk-time" role="timer" aria-label="Qolgan vaqt">${sec === "s" ? mkSpClock() : mkClock(MK.left)}</span></div>`;
}
function mkRunHTML(t) {
  const sec = MK.secs[MK.si], k = mkSk(sec);
  if (MK.phase === "intro") {
    const parts = sec === "w" ? t.w.tasks : t[sec].parts, n = mkSecCount(t, sec);
    const st = MK.strict, rules = { l: st ? "Har bir audio faqat 1 marta eshittiriladi. Keyingi qismga oʻtgach, orqaga qaytib boʻlmaydi. Savollarni audio boshlanishidan oldin oʻqib oling." : `Har bir audioni ${MK_PLAYS} marta tinglash mumkin. Savollarni audio boshlanishidan oldin oʻqib oling.`, r: st ? "Keyingi qismga oʻtgach, oldingisiga qaytib boʻlmaydi. Vaqt sinovdan chiqib ketsangiz ham yuradi." : "Qismlar orasida bemalol oʻtishingiz mumkin. Javobni oʻzgartirish mumkin — boʻlim yakunlanguncha.", w: "Matnni telefon yoki kompyuter klaviaturasida yozing. Soʻz soni pastda koʻrinib turadi." + (st ? " Vaqt sinovdan chiqib ketsangiz ham yuradi." : ""), s: "Har bir savolda avval tayyorlanish, keyin gapirish vaqti bor. Mikrofon gapirish vaqtida oʻzi yoqiladi." + (st ? " Javobni qayta yozib boʻlmaydi." : "") }[sec];
    return `${topbar()}<div><a class="back" href="#mock">${ICON.back}Imtihon sinovi</a></div>
    <div class="glass pad mk-intro">
      <span class="mk-intro-ico ${k.c}-t">${ICON[k.ico]}</span>
      ${MK.secs.length > 1 ? `<small class="muted">${MK.si + 1}/${MK.secs.length}-boʻlim</small>` : ""}
      <h1>${k.uz} <span class="muted" lang="tr">· ${k.tr}</span></h1>
      <p><b>${parts.length} qism · ${n} ${mkSecUnit(sec)} · ${mkSecMin(t, sec)} daqiqa</b></p>
      <ul class="mk-parts-list">${parts.map(p => `<li>${esc(p.t)}</li>`).join("")}</ul>
      <p class="muted">${rules}</p>
      ${MK.strict ? `<span class="tag pink-t">Qatʼiy rejim</span>` : ""}
      ${sec === "s" && canListen() && mkRecAble() ? `<button class="set-row mk-recsw" data-act="mk-rec" role="switch" aria-checked="${mkRecWanted()}"><span><b>Ovozimni yozib olish</b><small>Javobingizni keyin qayta eshitasiz${mkRecRisk() ? ". Baʼzi telefonlarda yozish paytida nutqni tanish ishlamasligi mumkin" : ""}</small></span><span class="switch"></span></button>` : ""}
      ${sec === "s" && !canListen() ? `<div class="notice"><b>Bu brauzerda mikrofon ishlamaydi.</b> Gapirish boʻlimini Chrome (yoki ilovamiz) orqali topshiring. Hozir uni oʻtkazib yuborishingiz mumkin.</div>
        <button class="btn btn-ghost btn-block" data-act="mk-skip">Gapirish boʻlimini oʻtkazib yuborish</button>` :
        `<button class="btn btn-grad btn-block" data-act="mk-go">${ICON.clock}Boshlash</button>`}
    </div>`;
  }
  if (sec === "s") return mkBar(t, sec) + mkSpeakHTML(t);
  const parts = sec === "w" ? t.w.tasks : t[sec].parts, p = parts[MK.pi], last = MK.pi === parts.length - 1;
  const fwd = mkFwd(sec);
  const tabs = parts.map((x, i) => { const [a, n] = mkPartCount(t, sec, i); return `<button class="mk-ptab${i === MK.pi ? " on" : ""}${a === n ? " full" : ""}" data-act="mk-part" data-p="${i}"${i === MK.pi ? ' aria-current="step"' : ""}${fwd && i !== MK.pi ? " disabled" : ""}>${i + 1}<span class="sr">-qism, javoblar:</span><small>${a}/${n}</small></button>`; }).join("");
  const left = mkUnanswered(t, sec);
  return `${mkBar(t, sec)}
  <nav class="mk-ptabs" aria-label="Qismlar">${tabs}</nav>
  ${sec === "w" ? mkTaskHTML(p) : mkPartHTML(t, sec, p, MK.pi)}
  <div class="mk-nav">
    ${fwd ? `<span class="mk-fwd muted">Orqaga qaytib boʻlmaydi</span>` : `<button class="btn btn-ghost" data-act="mk-part" data-p="${MK.pi - 1}" ${MK.pi ? "" : "disabled"}>${ICON.back}Oldingi</button>`}
    ${last ? `<button class="btn btn-grad" data-act="mk-end" data-n="${left}">${ICON.check}Boʻlimni yakunlash</button>` : `<button class="btn btn-grad" data-act="mk-part" data-p="${MK.pi + 1}">Keyingi qism</button>`}
  </div>`;
}
function mkPartCount(t, sec, pi) {
  if (sec === "w") { const tk = t.w.tasks[pi]; return [mkWords(MK.ans.w[tk.id]) >= tk.min * 0.5 ? 1 : 0, 1]; }
  const qs = t[sec].parts[pi].qs, a = qs.filter((_, qi) => { const v = MK.ans[sec][`${pi}.${qi}`]; return v !== undefined && v !== ""; }).length;
  return [a, qs.length];
}
function mkUnanswered(t, sec) {
  const parts = sec === "w" ? t.w.tasks : t[sec].parts;
  return parts.reduce((a, _, i) => { const [x, n] = mkPartCount(t, sec, i); return a + n - x; }, 0);
}
const mkParas = s => String(s).split(/\n\n+/).map(x => `<p>${esc(x).replace(/\n/g, "<br>").replace(/\((\d+)\) ___/g, '<b class="mk-gapno">($1) ___</b>')}</p>`).join("");
function mkAudioHTML(key, au) {
  const n = MK.plays[key] || 0, on = MK_PLAYING === key, left = mkPlays() - n;
  return `<div class="mk-audio${on ? " on" : ""}"><button class="btn ${on ? "btn-soft" : "btn-grad"}" data-act="mk-play" data-k="${key}" ${on || left <= 0 || MK_PLAYING ? "disabled" : ""}>${ICON.speak}${on ? "Eshitilmoqda…" : n ? "Yana tinglash" : "Tinglash"}</button>
    <small>${on ? "Diqqat bilan tinglang" : left > 0 ? `${left} marta tinglash mumkin` : "Tinglash imkoniyati tugadi"}</small></div>`;
}
function mkPartHTML(t, sec, p, pi) {
  const qs = mkQs(t, sec).filter(x => x.pi === pi), shared = p.o, letters = shared && shared.some(o => o.length > 14);
  const opt = (x, j, label) => { const v = MK.ans[sec][x.k];
    return `<button class="opt${v === j ? " picked" : ""}" data-act="mk-o" data-k="${x.k}" data-o="${j}" aria-pressed="${v === j}"${letters ? ` aria-label="${String.fromCharCode(65 + j)}: ${esc(shared[j])}"` : ""}>${label}</button>`; };
  const q = x => {
    const num = `<span class="mk-n">${x.n}</span>`;
    if (p.k === "gap") {
      const [a, b] = x.q.q.split("___"), v = MK.ans[sec][x.k] || "";
      return `<div class="mk-q mk-gap">${num}<p lang="tr">${esc(a)}<input class="mk-in" data-mkk="${sec}|${x.k}" value="${esc(v)}" autocomplete="off" autocapitalize="off" spellcheck="false" lang="tr" aria-label="${x.n}-savol javobi">${esc(b || "")}</p></div>`;
    }
    const own = x.q.o, ord = own ? MK.ord[sec + x.k] || own.map((_, i) => i) : shared.map((_, i) => i);
    return `<div class="mk-q">${x.q.audio ? mkAudioHTML(sec + x.k, x.q.audio) : ""}<p class="mk-qt">${num}<span lang="tr">${esc(x.q.q)}</span></p>
      <div class="mk-opts${letters ? " letters" : shared ? " row" : ""}" lang="tr">${ord.map(j => opt(x, j, letters ? String.fromCharCode(65 + j) : own ? esc(own[j]) : esc(shared[j]))).join("")}</div></div>`;
  };
  return `<section class="glass pad mk-part">
    <h2>${esc(p.t)}</h2><p class="mk-d">${esc(p.d)}</p>
    ${p.audio ? mkAudioHTML(sec + pi, p.audio) : ""}
    ${p.text || p.title ? `<article class="mk-text" lang="tr">${p.title ? `<h3>${esc(p.title)}</h3>` : ""}${p.text ? mkParas(p.text) : ""}</article>` : ""}
    ${letters ? `<ol class="mk-legend" lang="tr">${shared.map((o, j) => `<li><b>${String.fromCharCode(65 + j)}</b>${esc(o)}</li>`).join("")}</ol>` : ""}
    <div class="mk-qs${qs.some(x => x.q.q.length > 60 && !x.q.o) ? " long" : ""}">${qs.map(q).join("")}</div>
    ${p.k === "gap" ? mkChars() : ""}
  </section>`;
}
// Turkish letters a phone keyboard may not have at hand: they go into the field typed in last
const mkChars = () => `<div class="mk-chars" lang="tr" aria-label="Turkcha harflar">${["ç", "ğ", "ı", "İ", "ö", "ş", "ü"].map(c => `<button data-act="mk-ch" data-c="${c}">${c}</button>`).join("")}</div>`;
function mkTaskHTML(tk) {
  const v = MK.ans.w[tk.id] || "", wc = mkWords(v);
  return `<section class="glass pad mk-part">
    <h2>${esc(tk.t)}</h2><p class="mk-d">${esc(tk.d)}</p>
    <article class="mk-text mk-task" lang="tr">${mkParas(tk.tr)}</article>
    <textarea class="mk-write" data-mkw="${tk.id}" lang="tr" spellcheck="false" autocapitalize="sentences" rows="10" aria-label="${esc(tk.t)} — matningiz" placeholder="Shu yerga turkcha yozing…">${esc(v)}</textarea>
    <div class="mk-wc"><span id="mk-wc-${tk.id.replace(".", "-")}" class="${wc >= tk.min && wc <= tk.max ? "ok" : ""}">${wc} soʻz</span><small>talab: ${tk.min}–${tk.max} soʻz</small></div>
    ${mkChars()}
  </section>`;
}

/* ---------- Speaking ---------- */
function mkSpClock() {
  const sp = MK.sp; if (!sp.until) return "—";
  return mkClock((sp.until - Date.now()) / 1000);
}
function mkSpeakHTML(t) {
  const turns = mkTurns(t), sp = MK.sp, x = turns[sp.i], q = x.q, last = sp.i === turns.length - 1, heard = MK.ans.s[sp.i];
  const cues = q.cues ? `<ul class="mk-cues" lang="tr">${q.cues.map(c => `<li>${esc(c)}</li>`).join("")}</ul>` : "";
  const pc = q.pro ? `<div class="mk-pc" lang="tr"><div><b>Lehte</b><ul>${q.pro.map(c => `<li>${esc(c)}</li>`).join("")}</ul></div><div><b>Aleyhte</b><ul>${q.con.map(c => `<li>${esc(c)}</li>`).join("")}</ul></div></div>` : "";
  let act;
  if (sp.st === "ready") act = `<p class="muted">Tayyorlanish: ${x.prep} soniya · gapirish: ${x.talk} soniya</p><button class="btn btn-grad btn-block" data-act="mk-sp-go">${ICON.clock}Boshlash</button>`;
  else if (sp.st === "prep") act = `<div class="mk-stage"><small>Tayyorlaning</small><b class="mk-big" id="mk-sp-time">${mkSpClock()}</b></div><button class="btn btn-soft btn-block" data-act="mk-sp-talk">${ICON.mic}Tayyorman — gapirishni boshlash</button>`;
  else if (sp.st === "talk") act = `<div class="mk-stage talk"><span class="mk-rec" aria-hidden="true">${ICON.mic}</span><small>Gapiring</small><b class="mk-big" id="mk-sp-time">${mkSpClock()}</b></div>
    <p class="mk-heard" id="mk-heard" lang="tr" aria-live="polite">${esc((MK_MIC && (MK_MIC.text + " " + MK_MIC.part).trim()) || "") || '<span class="muted">Eshitilgan soʻzlar shu yerda chiqadi…</span>'}</p>
    <button class="btn btn-grad btn-block" data-act="mk-sp-stop">${ICON.check}Tugatdim</button>`;
  else act = `<div class="mk-heard done" lang="tr">${heard && heard.text ? esc(heard.text) : '<span class="muted">Hech narsa eshitilmadi.</span>'}</div>
    ${mkRecAudio(sp.i)}
    <p class="muted">${heard && heard.text ? `${mkWords(heard.text)} soʻz eshitildi.` : "Mikrofonga yaqinroq gapiring."} Javob saqlandi.</p>
    <div class="fr-actions${MK.strict ? " one" : ""}">${MK.strict ? "" : `<button class="btn btn-ghost" data-act="mk-sp-again">Qayta javob berish</button>`}${last ? `<button class="btn btn-grad" data-act="mk-end" data-n="0">${ICON.check}Boʻlimni yakunlash</button>` : `<button class="btn btn-grad" data-act="mk-sp-next">Keyingi savol</button>`}</div>`;
  return `<section class="glass pad mk-part mk-speak">
    <h2>${esc(x.p.t)}</h2><p class="mk-d">${esc(x.p.d)}</p>
    <p class="mk-progress muted">${sp.i + 1}/${turns.length}-savol</p>
    <div class="mk-prompt"><p class="mk-qt" lang="tr">${esc(q.q)}</p>${cues}${pc}</div>
    ${act}
  </section>`;
}
function mkSpTick(now) {
  const sp = MK.sp;
  if (sp.st !== "prep" && sp.st !== "talk") return;
  const el = $("mk-sp-time"), bar = $("mk-time"), c = mkSpClock();
  if (el) el.textContent = c;
  if (bar) bar.textContent = c;
  if (now >= sp.until) { if (sp.st === "prep") mkSpTalk(); else mkSpStop(); }
}
function mkSpGo() {
  const x = mkTurns(mkTest(MK.id))[MK.sp.i];
  ttsCancel();
  if (x.prep > 0) { MK.sp.st = "prep"; MK.sp.until = Date.now() + x.prep * 1000; mkRender(); }
  else mkSpTalk();
}
function mkSpTalk() {
  const x = mkTurns(mkTest(MK.id))[MK.sp.i];
  MK.sp.st = "talk"; MK.sp.until = Date.now() + x.talk * 1000;
  mkMicStart();
  if (mkRecWanted() && !MK_RECOFF) mkRecStart(MK.sp.i);
  mkRender();
}
function mkSpStop() {
  const i = MK.sp.i;
  MK.sp.st = "wait"; MK.sp.until = 0;
  mkRecStop();
  mkMicStop(text => { MK.ans.s[i] = { text }; MK.sp.st = "rev"; mkSave(); mkRender(); });
}
/* A long answer: the recognizer is started again whenever it stops (browsers end it after a pause; the app's phone
   recognizer gives one sentence at a time) until the speaking time is over; what is heard adds up */
function mkMicStart() {
  mkMicStop();
  const rec = { on: true, text: "", part: "", done: null };
  MK_MIC = rec;
  const run = () => {
    if (!rec.on || !SR) return;
    let r; try { r = new SR(); } catch (e) { rec.on = false; return; }
    rec.r = r;
    r.lang = "tr-TR"; r.interimResults = true; r.continuous = true; r.maxAlternatives = 1;
    r.onresult = ev => {
      let fin = "", part = "";
      for (let k = ev.resultIndex || 0; k < ev.results.length; k++) { const res = ev.results[k], s = res[0] && res[0].transcript; if (!s) continue; if (res.isFinal) fin += " " + s; else part += " " + s; }
      if (fin) rec.text = (rec.text + fin).trim();
      rec.part = part.trim();
      const el = $("mk-heard"); if (el) el.textContent = (rec.text + " " + rec.part).trim();
    };
    r.onerror = ev => {
      if (ev.error === "not-allowed" || ev.error === "service-not-allowed") { rec.on = false; toast("Mikrofonga ruxsat berilmagan"); }
      else if (ev.error === "network") toast("Nutqni tanish uchun internet kerak");
      // The recording holds the microphone: speech recognition comes first, the recording is given up
      else if (ev.error === "audio-capture" && MK_REC) { mkRecStop(true); MK_RECOFF = true; toast("Ovoz yozish nutqni tanishga xalal berdi — u oʻchirildi"); }
    };
    r.onend = () => {
      if (rec.part) { rec.text = (rec.text + " " + rec.part).trim(); rec.part = ""; }
      if (rec.on) setTimeout(run, 200); else if (rec.done) { const d = rec.done; rec.done = null; d(rec.text); }
    };
    try { r.start(); } catch (e) { rec.on = false; }
  };
  run();
}
// Stops listening; done(text) gets everything heard once the recognizer has handed over its last words
function mkMicStop(done) {
  const rec = MK_MIC;
  if (!rec) { if (done) done(""); return; }
  MK_MIC = null; rec.on = false;
  if (done) { rec.done = done; setTimeout(() => { if (rec.done) { rec.done = null; done((rec.text + " " + rec.part).trim()); } }, 1500); }
  try { if (rec.r) rec.r.stop(); } catch (e) {}
}

/* The learner's own voice, to listen to after answering: MediaRecorder next to speech recognition (kept for the session
   only — a reload forgets it). Where the two may fight over the microphone (Android, the app) it is off unless chosen. */
const mkRecAble = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
const mkRecRisk = () => IS_NATIVE || /Android/i.test(navigator.userAgent || "");
const mkRecWanted = () => mkRecAble() && (S.mkRec !== undefined ? !!S.mkRec : !mkRecRisk());
function mkRecStart(i) {
  mkRecStop(true);
  const rec = { i, stop: false };
  MK_REC = rec;
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    rec.stream = stream;
    if (rec.stop) { stream.getTracks().forEach(t => t.stop()); return; }
    const mr = new MediaRecorder(stream), parts = [];
    rec.mr = mr;
    mr.ondataavailable = e => { if (e.data && e.data.size) parts.push(e.data); };
    mr.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      if (rec.drop || !parts.length) return;
      if (MK_RECS[i]) try { URL.revokeObjectURL(MK_RECS[i]); } catch (e) {}
      MK_RECS[i] = URL.createObjectURL(new Blob(parts, { type: parts[0].type || "audio/webm" }));
      if (MK && MK.sp && MK.sp.i === i && MK.sp.st === "rev") mkRender();
    };
    mr.start();
  }).catch(() => { if (MK_REC === rec) MK_REC = null; });
}
// drop — the recording is thrown away (a new attempt, or it got in the way of speech recognition)
function mkRecStop(drop) {
  const rec = MK_REC;
  if (!rec) return;
  MK_REC = null; rec.stop = true; rec.drop = !!drop;
  try { if (rec.mr && rec.mr.state !== "inactive") rec.mr.stop(); else if (rec.stream) rec.stream.getTracks().forEach(t => t.stop()); } catch (e) {}
}
const mkRecAudio = i => MK_RECS[i] ? `<div class="mk-myrec"><small>${ICON.ear}Javobingizni tinglang</small><audio controls preload="metadata" src="${MK_RECS[i]}"></audio></div>` : "";

/* ---------- Scoring ---------- */
/* Writing in four criteria, each 0–1, the way examiners look at a text: the task (its points and length), grammar and
   spelling, the range of words, and how the text holds together. The task score is their average. */
const MK_CRIT = [["ta", "Topshiriqni bajarish", "Talablar va hajm"], ["gr", "Grammatika va imlo", "Qoʻshimchalar, harflar, tinish belgilari"], ["lx", "Lugʻat boyligi", "Xilma-xil soʻzlar, takrorlarsiz"], ["co", "Bogʻlanish va tuzilish", "Bogʻlovchilar, gaplar uzunligi"]];
function mkWriteCheck(text, tk) {
  const r = wrCheck(text || "", { u: { id: "", level: tk.lv || "B1" }, tgt: { min: tk.min, max: tk.max, unit: "soʻz" }, goals: tk.need.map(([l, src]) => [l, mkRe(src)]) });
  if (!r.wc) return { s: 0, r, c: { ta: 0, gr: 0, lx: 0, co: 0 } };
  const vol = Math.min(1, r.wc / tk.min), goals = r.goals.length ? r.goals.filter(g => g.ok).length / r.goals.length : 1;
  const ta = Math.max(0, 0.6 * goals + 0.4 * vol - (r.wc > tk.max * 1.6 ? 0.15 : 0));
  const sp = 1 - Math.min(1, r.spell.length / Math.max(3, r.wc / 15)), pu = r.sc ? 1 - Math.min(1, (r.lowerStart + r.noEnd) / r.sc) : 0;
  const gr = 0.7 * sp + 0.3 * pu;
  const ws = String(text).toLocaleLowerCase("tr").match(/[a-zçğıöşüâîû]{3,}/g) || [], ttr = ws.length ? new Set(ws).size / ws.length : 0;
  const lx = Math.max(0, Math.min(1, ttr / 0.7) - 0.1 * r.reps.length) * vol;
  const avg = r.sc ? r.wc / r.sc : r.wc, sent = avg >= 5 && avg <= 26 ? 1 : avg < 5 ? avg / 5 : Math.max(0, 1 - (avg - 26) / 20);
  const co = (0.7 * Math.min(1, r.conns.length / r.needC) + 0.3 * sent) * Math.min(1, vol * 1.25);
  const c = { ta, gr, lx, co };
  let s = Math.round(100 * (ta + gr + lx + co) / 4);
  // Far too short is not a text yet
  if (r.wc < tk.min * 0.5) s = Math.round(s * r.wc / tk.min);
  return { s, r, c };
}
const mkBand = v => Math.round(v * 5);
const mkRubric = c => `<div class="mk-rub">${MK_CRIT.map(([k, name, sub]) => `<div class="mk-rrow"><span><b>${name}</b><small>${sub}</small></span>
  <span class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="5" aria-valuenow="${mkBand(c[k])}" aria-label="${name}"><i style="width:${mkBand(c[k]) * 20}%"></i></span><b class="mk-rv5">${mkBand(c[k])}/5</b></div>`).join("")}</div>`;
const mkModel = (m, say) => m ? `<details class="mk-model"><summary>${ICON.spark}Namunaviy javob</summary><div class="mk-model-body"><p lang="tr">${esc(m).replace(/\n/g, "<br>")}</p>${say ? `<button class="btn btn-soft" data-act="say" data-t="${esc(m)}">${ICON.speak}Tinglash</button>` : ""}<small class="muted">Bu — yaxshi javobning bir namunasi. Uni yodlash shart emas: tuzilishi, bogʻlovchilari va soʻzlariga eʼtibor bering.</small></div></details>` : "";
function mkSpeakScore(text, x) {
  const ws = String(text || "").toLocaleLowerCase("tr").split(/\s+/).filter(w => /[a-zçğıöşü]/.test(w)), wc = ws.length;
  if (wc < 3) return { s: 0, wc };
  const low = " " + ws.join(" ") + " ", need = Math.round(x.talk * 0.9);
  const vol = Math.min(1, wc / need), uniq = new Set(ws).size / wc, variety = Math.min(1, uniq / 0.6);
  const conns = WR_CONN.filter(c => new RegExp(`(^|[^a-zçğıöşü])${c}([^a-zçğıöşü]|$)`).test(low)).length, conn = Math.min(1, conns / (x.talk >= 90 ? 4 : 1));
  const kw = x.q.kw.split("|"), hits = kw.filter(k => mkRe(k).test(low)).length, topic = Math.min(1, hits / Math.min(3, kw.length));
  return { s: Math.round(100 * (0.45 * vol + 0.2 * variety + 0.15 * conn + 0.2 * topic)), wc, conns, hits };
}
function mkScoreSec(t, sec) {
  const max = MOCK.scale.max;
  if (sec === "w") {
    const items = t.w.tasks.map(tk => mkWriteCheck(MK.ans.w[tk.id], tk)), wsum = t.w.tasks.reduce((a, x) => a + x.w, 0);
    const p = t.w.tasks.reduce((a, tk, i) => a + items[i].s * tk.w, 0) / wsum / 100;
    return { v: Math.round(p * max), p, items: items.map(x => x.s) };
  }
  if (sec === "s") {
    const turns = mkTurns(t), items = turns.map((x, i) => mkSpeakScore((MK.ans.s[i] || {}).text, x)), wsum = turns.reduce((a, x) => a + x.talk, 0);
    const p = turns.reduce((a, x, i) => a + items[i].s * x.talk, 0) / wsum / 100;
    return { v: Math.round(p * max), p, items: items.map(x => x.s) };
  }
  const qs = mkQs(t, sec), ok = qs.map(x => mkRight(sec, x)), right = ok.filter(Boolean).length;
  return { v: Math.round(right / qs.length * max), p: right / qs.length, right, n: qs.length, ok };
}
function mkRight(sec, x) {
  const v = MK.ans[sec][x.k];
  if (x.p.k === "gap") return ansMatch(v || "", x.q.a) === 2;
  return v === x.q.a;
}
function mkEnd() {
  const sec = MK.secs[MK.si];
  if (sec === "s") { mkMicStop(); mkRecStop(); }
  MK.phase = "wait";
  const fin = () => {
    const t = mkTest(MK.id), sc = mkScoreSec(t, sec);
    MK.score[sec] = sc;
    // Every answer counts for its skill; the section's XP like any practice of that skill
    if (sec === "l" || sec === "r") { sc.ok.forEach(ok => skillLog(sec, ok)); mkQs(t, sec).forEach((x, i) => mkmMark(`${t.id}|${sec}|${x.k}`, sc.ok[i])); }
    else sc.items.forEach(s => skillLog(sec, s >= 70));
    skillTime(sec, MK.used[sec] || 0);
    const a = xpAward(MK_KIND[sec], { acc: sc.p, key: `mk|${MK.id}|${sec}`, sk: sec });
    MK.xp[sec] = a.xp;
    if (MK.si + 1 < MK.secs.length) { MK.si++; MK.phase = "intro"; MK.pi = 0; }
    else mkDone(t);
    mkSave(); mkRender(true);
  };
  // The writing check sees wrong suffixes with the word analyser; without it (offline) it checks the rest
  if (sec === "w" && !MORPH_OK) loadMorph().then(fin, fin); else fin();
}
function mkDone(t) {
  const vs = MK.secs.map(s => MK.score[s].v), v = Math.round(vs.reduce((a, x) => a + x, 0) / vs.length);
  MK.phase = "done"; MK.res = { v, lv: mkLevel(v), at: Date.now() };
  S.mk = S.mk || {};
  const r = S.mk[t.id] = S.mk[t.id] || {};
  r.s = r.s || {};
  MK.secs.forEach(s => { r.s[s] = Math.max(r.s[s] || 0, MK.score[s].v); });
  if (MK.full) { r.b = Math.max(r.b || 0, v); r.l = v; r.n = (r.n || 0) + 1; }
  r.d = todayKey();
  mkHistAdd(t, v);
  save();
  beep(v >= MOCK.scale.bands[1][1] ? "fanfare" : "done");
  if (v >= MOCK.scale.bands[1][1]) hapticDone();
}

/* ---------- The result ---------- */
function mkResultHTML(t) {
  const res = MK.res, max = MOCK.scale.max, k = s => mkSk(s), many = MK.secs.length > 1, prev = mkPrev(), nfix = mkmActive().length;
  const dl = (a, b) => b == null ? "" : `<span class="mk-delta ${a >= b ? "up" : "down"}" title="Oldingi urinishga nisbatan">${mkDelta(a - b)}</span>`;
  const weak = many ? MK.secs.slice().sort((a, b) => MK.score[a].v - MK.score[b].v)[0] : null;
  const xp = MK.secs.reduce((a, s) => a + (MK.xp[s] || 0), 0);
  const tips = { l: ['data-act="sk-go" data-s="l"', "Tinglash mashqi", "Suhbat va gaplarni matnsiz tinglab tushunish"], r: ['href="#oqish"', "Oʻqish matnlari", "Matn va savollar — har kuni bittadan"], w: ['href="#gx"', "Qoidalar mashqi", "Qoʻshimchalar, zamonlar va bogʻlovchilar"], s: ['data-act="sk-go" data-s="s"', "Gapirish mashqi", "Gaplarni ovoz chiqarib takrorlash va talaffuz"] };
  const row = s => { const v = MK.score[s].v; return `<div class="mk-srow"><span class="ico ${k(s).c}-t">${ICON[k(s).ico]}</span><span class="mk-sname"><b>${k(s).uz}</b><small>${mkLevel(v)}</small></span>
    <span class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${v}" aria-label="${k(s).uz}"><i style="width:${Math.round(v / max * 100)}%"></i></span><b class="mk-sv">${v}${prev ? dl(v, prev.s[s]) : ""}</b></div>`; };
  return `${topbar()}<div><a class="back" href="#mock">${ICON.back}Imtihon sinovi</a></div>
  <div class="glass pad mk-res">
    ${catSVG({ pose: res.v >= MOCK.scale.bands[1][1] ? "cheer" : "sit", cls: "mascot" })}
    <small class="muted">${many ? "Umumiy natija" : `${k(MK.secs[0]).uz} boʻlimi`} · <span lang="tr">${esc(t.tr)}</span></small>
    <div class="mk-score"><b>${res.v}</b><small>/ ${max}</small>${prev ? dl(res.v, prev.f ? prev.v : prev.s[MK.secs[0]]) : ""}</div>
    ${prev ? `<small class="muted">Oldingi urinish (${mkDay(prev.at)}): ${prev.f ? prev.v : prev.s[MK.secs[0]]}</small>` : ""}
    <span class="tag ${LV_COLOR[res.lv] || "pink"}-t mk-lv">Taxminiy daraja: ${res.lv}</span>
    <span class="mk-tags">${xp ? `<span class="tag orange-t">+${xp} XP</span>` : ""}${MK.strict ? `<span class="tag pink-t">Qatʼiy rejim</span>` : ""}</span>
    <p class="muted">${res.v >= MOCK.scale.bands[0][1] ? "Ajoyib natija! Imtihonga tayyorgarligingiz yuqori." : res.v >= MOCK.scale.bands[1][1] ? "Yaxshi natija! Zaif boʻlimni kuchaytirsangiz, yanada yuqori ball olasiz." : res.v >= MOCK.scale.bands[2][1] ? "Yomon emas! Pastdagi xatolar tahlilini koʻrib chiqing." : "Boshlanishi yaxshi. Kursni davom ettirib, sinovni keyinroq qayta topshiring."}</p>
  </div>
  ${many ? `<section class="section"><div class="section-head"><h2>Boʻlimlar</h2></div><div class="glass pad mk-srows">${MK.secs.map(row).join("")}</div></section>` : ""}
  ${weak ? `<section class="section"><div class="section-head"><h2>Keyingi qadam</h2></div><div class="lrows glass">${lrow(tips[weak][0], k(weak).ico, k(weak).c, `${k(weak).uz}ni kuchaytiring: ${tips[weak][1]}`, tips[weak][2])}</div></section>` : ""}
  ${nfix ? `<a class="glass pad mk-fixgo" href="#mock-fix"><span class="mk-entry-ico">${ICON.target}</span><span><b>Xatolar ustida ishlash</b><small>${nfix} ta savol: izohi bilan qayta yechib chiqing</small></span>${ICON.chev}</a>` : ""}
  <section class="section"><div class="section-head"><h2>Javoblar tahlili</h2></div>${MK.secs.map(s => mkReviewHTML(t, s)).join("")}</section>
  <div class="fr-actions mk-again"><a class="btn btn-ghost" href="#mock">Barcha sinovlar</a><button class="btn btn-grad" data-act="mk-again">Qayta topshirish</button></div>
  <p class="muted mk-note">Yozish va gapirish balli avtomatik va taxminiy: u hajm, topshiriq talablari, bogʻlovchilar va imloni koʻradi, fikrning mazmunini emas.</p>`;
}
function mkReviewHTML(t, sec) {
  const k = mkSk(sec), sc = MK.score[sec];
  let body = "";
  if (sec === "l" || sec === "r") {
    body = mkQs(t, sec).map((x, i) => {
      const ok = sc.ok[i], v = MK.ans[sec][x.k], o = x.q.o || x.p.o, letters = x.p.o && x.p.o.some(s => s.length > 14);
      const show = j => j === undefined || j === "" ? "—" : x.p.k === "gap" ? j : (letters ? String.fromCharCode(65 + j) + ") " : "") + o[j];
      const right = x.p.k === "gap" ? x.q.a.split(" / ")[0] : show(x.q.a);
      return `<div class="mk-rv${ok ? " ok" : " no"}"><span class="mk-n">${x.n}</span><div>
        <p lang="tr">${esc(x.p.k === "gap" ? x.q.q.replace("___", "…") : x.q.q.length > 140 ? x.q.q.slice(0, 140) + "…" : x.q.q)}</p>
        <p class="mk-rv-a">${ok ? `${ICON.check}<span lang="tr">${esc(show(v))}</span>` : `Sizning javobingiz: <span lang="tr">${esc(show(v))}</span><br>Toʻgʻri javob: <b lang="tr">${esc(right)}</b>`}</p>
        ${ok ? "" : `<p class="mk-why">${esc(x.q.e)}</p>`}</div></div>`;
    }).join("");
  } else if (sec === "w") {
    body = t.w.tasks.map((tk, i) => { const c = mkWriteCheck(MK.ans.w[tk.id], tk);
      return `<div class="mk-wrv"><b>${esc(tk.t)} · ${c.s}%</b>${MK.ans.w[tk.id] ? `${mkRubric(c.c)}<div class="mk-mine" lang="tr">${esc(MK.ans.w[tk.id])}</div><details class="mk-more"><summary>Batafsil tekshiruv</summary>${wrResultHtml(c.r, "Topshiriq talablari")}</details>` : `<p class="muted">Bu topshiriq yozilmagan.</p>`}${mkModel(tk.m)}</div>`; }).join("");
  } else {
    body = mkTurns(t).map((x, i) => { const a = MK.ans.s[i], sc2 = mkSpeakScore(a && a.text, x);
      return `<div class="mk-wrv"><b lang="tr">${esc(x.q.q)}</b><small class="muted">${sc2.s}% · ${sc2.wc || 0} soʻz${sc2.wc ? ` · bogʻlovchilar: ${sc2.conns} · mavzu soʻzlari: ${sc2.hits}` : ""}</small>
        <div class="mk-mine" lang="tr">${a && a.text ? esc(a.text) : '<span class="muted">Javob yozib olinmagan</span>'}</div>${mkRecAudio(i)}${mkModel(x.q.m, true)}</div>`; }).join("") + `<p class="muted mk-note">Nutqingizni brauzer matnga aylantirdi — baʼzi soʻzlar notoʻgʻri eshitilgan boʻlishi mumkin.</p>`;
  }
  const sum = sec === "l" || sec === "r" ? `${sc.right}/${sc.n} toʻgʻri` : `${Math.round(sc.p * 100)}%`;
  return `<details class="glass mk-rvbox"><summary><span class="ico ${k.c}-t">${ICON[k.ico]}</span><b>${k.uz}</b><small>${sum} · ${sc.v}/${MOCK.scale.max}</small></summary><div class="mk-rvbody">${body}</div></details>`;
}

/* ---------- Mistakes (#mock-fix) ----------
   S.mkm[key] = minute·4 + rights still needed (2 → 1 → 0 = fixed): the latest event wins a merge of two devices. A wrong
   answer in a run or in the drill needs two right ones again; a right one in a later run counts as one. */
const mkmNow = st => Math.floor(Date.now() / 60000) * 4 + st;
const mkmSt = v => v % 4;
function mkmMark(key, ok) {
  S.mkm = S.mkm || {};
  const v = S.mkm[key];
  if (!ok) S.mkm[key] = mkmNow(2);
  else if (v && mkmSt(v)) S.mkm[key] = mkmNow(mkmSt(v) - 1);
}
// The open mistakes, newest first, with their questions (a test or a question that is gone is skipped)
function mkmActive() {
  if (!mkReady()) return [];
  return Object.entries(S.mkm || {}).filter(([, v]) => mkmSt(v)).sort((a, b) => b[1] - a[1]).map(([key]) => {
    const [id, sec, k] = key.split("|"), t = mkTest(id), x = t && (sec === "l" || sec === "r") && mkQs(t, sec).find(q => q.k === k);
    return x ? { key, t, sec, x } : null;
  }).filter(Boolean);
}
function mkFixCard() {
  const n = mkmActive().length;
  if (!n) return "";
  return `<a class="glass pad mk-fixgo" href="#mock-fix"><span class="mk-entry-ico">${ICON.target}</span><span><b>Sinov xatolari · ${n} ta savol</b><small>Xato javob bergan savollaringiz va ularga oʻxshash savollar — izoh bilan</small></span>${ICON.chev}</a>`;
}
// A drill: every open mistake (up to 12), each followed by the same part's question from another test when there is one
function mkFixStart() {
  const list = mkmActive().slice(0, 12), keys = new Set(list.map(m => m.key)), items = [];
  list.forEach(m => {
    items.push(m);
    const sim = MOCK.tests.filter(t => t.id !== m.t.id).flatMap(t => mkQs(t, m.sec).filter(x => x.pi === m.x.pi).map(x => ({ key: `${t.id}|${m.sec}|${x.k}`, t, sec: m.sec, x, sim: 1 })))
      .filter(c => !keys.has(c.key) && !items.some(i => i.key === c.key));
    if (sim.length) items.push(sim[Math.floor(Math.random() * sim.length)]);
  });
  MKF = { items, i: 0, a: null, v: "", right: 0, done: null, ord: items.map(m => m.x.q.o ? shuffle(m.x.q.o.map((_, j) => j)) : null) };
}
function viewMockFix() {
  if (!MKF || (!MKF.items.length && !MKF.done)) mkFixStart();
  const head = `${topbar()}<div><a class="back" href="#mock">${ICON.back}Imtihon sinovi</a></div>`;
  if (!MKF.items.length) return `${head}<div class="glass empty">${mascot("trophy")}<b>Xatolar yoʻq!</b><span class="muted">Sinovda xato qilgan savollaringiz shu yerga tushadi.</span><a class="btn btn-grad" href="#mock">Sinovlar</a></div>`;
  if (MKF.done) {
    const d = MKF.done, n = MKF.items.length, left = mkmActive().length;
    return `${head}<div class="glass pad mk-res">${catSVG({ pose: d.right === n ? "cheer" : "sit", cls: "mascot" })}
      <b class="mk-fix-sum">${d.right}/${n} toʻgʻri${d.xp ? ` · +${d.xp} XP` : ""}</b>
      <p class="muted">${left ? `Yana ${left} ta savol daftarda qoldi — har biriga ikki marta toʻgʻri javob bersangiz, u daftardan chiqadi.` : "Barcha xatolar tuzatildi. Ajoyib!"}</p>
      <div class="fr-actions"><a class="btn btn-ghost" href="#mock">Sinovlar</a>${left ? `<button class="btn btn-grad" data-act="mk-fagain">Yana mashq qilish</button>` : `<a class="btn btn-grad" href="#mock">Yangi sinov</a>`}</div></div>`;
  }
  const m = MKF.items[MKF.i], x = m.x, p = x.p, k = mkSk(m.sec), q = x.q, answered = MKF.a !== null, n = MKF.items.length;
  const ctxAudio = m.sec === "l" ? (q.audio || p.audio) : null;
  let body;
  if (p.k === "gap") {
    const [a, b] = q.q.split("___"), ok = answered && MKF.a === 1;
    body = `<p class="mk-gapline" lang="tr">${esc(a)}<input class="mk-in" id="mk-fin" value="${esc(MKF.v)}" autocomplete="off" autocapitalize="off" spellcheck="false" lang="tr" aria-label="Javob" ${answered ? "disabled" : ""}>${esc(b || "")}</p>
      ${answered ? `<div class="feedback ${ok ? "ok" : "no"}">${ok ? "Toʻgʻri!" : `Toʻgʻri javob: <b lang="tr">${esc(q.a.split(" / ")[0])}</b>`}</div>` : `${mkChars()}<button class="btn btn-grad btn-block" data-act="mk-fcheck">${ICON.check}Tekshirish</button>`}`;
  } else {
    const shared = p.o, letters = shared && shared.some(o => o.length > 14), opts = q.o || shared, ord = MKF.ord[MKF.i] || opts.map((_, j) => j);
    body = `${letters ? `<ol class="mk-legend" lang="tr">${shared.map((o, j) => `<li><b>${String.fromCharCode(65 + j)}</b>${esc(o)}</li>`).join("")}</ol>` : ""}
      <div class="mk-opts${letters ? " letters" : shared ? " row" : ""}" lang="tr">${ord.map(j => { const cls = answered ? (j === q.a ? " right" : MKF.a === j ? " wrong" : "") : "";
        return `<button class="opt${cls}" data-act="mk-fo" data-o="${j}" ${answered ? "disabled" : ""}${letters ? ` aria-label="${String.fromCharCode(65 + j)}: ${esc(shared[j])}"` : ""}>${letters ? String.fromCharCode(65 + j) : esc(opts[j])}</button>`; }).join("")}</div>
      ${answered ? `<div class="feedback ${MKF.a === q.a ? "ok" : "no"}">${MKF.a === q.a ? "Toʻgʻri!" : "Afsus — toʻgʻri javob yashil bilan belgilangan."}</div>` : ""}`;
  }
  return `${head}
  <div class="lesson-head"><div class="tags"><span class="tag ${k.c}-t">${ICON[k.ico]}${k.uz}</span><span class="tag ${m.sim ? "teal" : "pink"}-t">${m.sim ? "Oʻxshash savol" : "Xato qilingan savol"}</span></div>
    <h1>Xatolar ustida ishlash</h1></div>
  <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${MKF.i}" aria-label="Mashq"><i style="width:${Math.round(MKF.i / n * 100)}%"></i></div>
  <section class="glass pad mk-part mk-fix">
    <small class="muted">${MKF.i + 1}/${n} · ${esc(p.t)} · <span lang="tr">${esc(m.t.tr)}</span></small>
    ${ctxAudio ? `<div class="mk-audio"><button class="btn btn-grad" data-act="mk-fplay">${ICON.speak}Tinglash</button><small>Istalgancha tinglash mumkin</small></div>` : ""}
    ${m.sec === "r" && (p.text || p.title) ? `<details class="mk-ctx"${p.k === "gap" || p.text && p.text.length < 900 ? " open" : ""}><summary>Matn${p.title ? `: <span lang="tr">${esc(p.title)}</span>` : ""}</summary><article class="mk-text" lang="tr">${p.text ? mkParas(p.text) : ""}</article></details>` : ""}
    ${p.k === "gap" ? "" : `<p class="mk-qt" lang="tr">${esc(q.q)}</p>`}
    ${body}
    ${answered ? `<p class="mk-why">${esc(q.e)}</p><button class="btn btn-grad btn-block" data-act="mk-fnext">${MKF.i + 1 < n ? "Keyingi savol" : "Yakunlash"}</button>` : ""}
  </section>`;
}
function mkfRender() {
  const v = document.querySelector('.view[data-v="mock"]');
  if (!v || location.hash !== "#mock-fix") return;
  const box = document.createElement("div");
  box.innerHTML = viewMockFix();
  v.replaceChildren(...box.childNodes);
  CatLife.scan();
}
function mkfAnswer(ok, a) {
  const m = MKF.items[MKF.i];
  if (MKF.a !== null) return;
  MKF.a = a; if (ok) MKF.right++;
  skillLog(m.sec, ok); beep(ok ? "ok" : "no"); haptic(ok);
  // A wrong «similar» question becomes a mistake of its own
  if (!m.sim || !ok) mkmMark(m.key, ok);
  save(); mkfRender();
}
function mkfAct(act, b) {
  if (act === "mk-fagain") { MKF = null; mkfRender(); window.scrollTo(0, 0); return; }
  if (!MKF || MKF.done) return;
  const m = MKF.items[MKF.i];
  if (act === "mk-fo") mkfAnswer(+b.dataset.o === m.x.q.a, +b.dataset.o);
  else if (act === "mk-fcheck") { const v = ($("mk-fin") || {}).value || ""; if (!v.trim()) { toast("Avval javob yozing"); return; } MKF.v = v; const ok = ansMatch(v, m.x.q.a) === 2; mkfAnswer(ok, ok ? 1 : 0); }
  else if (act === "mk-fplay") { const au = m.x.q.audio || m.x.p.audio; speakSeq(au.lines.map(l => [l[0], l[1]])); }
  else if (act === "mk-fnext") {
    ttsCancel();
    if (MKF.i + 1 < MKF.items.length) { MKF.i++; MKF.a = null; MKF.v = ""; mkfRender(); window.scrollTo(0, 0); return; }
    const n = MKF.items.length, secs = [...new Set(MKF.items.map(i => i.sec))];
    const r = xpAward(secs.length === 1 && secs[0] === "l" ? "listening" : "reading", { right: MKF.right, n, key: "mkfix", sk: secs });
    MKF.done = { right: MKF.right, xp: r.xp };
    mkfRender(); window.scrollTo(0, 0);
  }
}

/* ---------- Taps and typing ---------- */
function mkChar(c) {
  const el = MK_FOCUS && document.body.contains(MK_FOCUS) ? MK_FOCUS : document.querySelector("[data-mkk],[data-mkw],#mk-fin");
  if (!el) return;
  const s = el.selectionStart ?? el.value.length, e = el.selectionEnd ?? s;
  el.setRangeText(c, s, e, "end"); el.focus();
  el.dispatchEvent(new Event("input", { bubbles: true }));
}
function mkAct(act, b) {
  if (act === "mk-start") { mkStart(b.dataset.id, b.dataset.s); return; }
  if (act.startsWith("mk-f")) { mkfAct(act, b); return; }
  if (act === "mk-ch") { mkChar(b.dataset.c); return; }
  if (act === "mk-strict") { S.mkStrict = !S.mkStrict; save(); b.setAttribute("aria-checked", String(S.mkStrict)); return; }
  if (act === "mk-rec") { S.mkRec = !mkRecWanted(); save(); b.setAttribute("aria-checked", String(S.mkRec)); return; }
  if (act === "mk-cancel") {
    if (!b.dataset.sure) { b.dataset.sure = "1"; b.textContent = "Javoblar oʻchadi. Bekor qilinsinmi?"; return; }
    mkAway(); MK = null; try { localStorage.removeItem(MK_KEY); } catch (e) {} route(); return;
  }
  if (!MK) return;
  const t = mkTest(MK.id), sec = MK.secs[MK.si];
  if (act === "mk-go") mkBegin();
  else if (act === "mk-again") { const which = MK.full ? "all" : MK.secs[0]; MK = null; try { localStorage.removeItem(MK_KEY); } catch (e) {} mkStart(t.id, which); }
  else if (act === "mk-skip") { MK.score.s = { v: 0, p: 0, items: mkTurns(t).map(() => 0), skipped: true }; MK.secs = MK.secs.filter(s => s !== "s"); if (!MK.secs.length) { MK = null; try { localStorage.removeItem(MK_KEY); } catch (e) {} go("mock"); return; } mkDone(t); mkSave(); mkRender(true); }
  else if (act === "mk-part") { const p = +b.dataset.p; if (mkFwd(sec) && p < MK.pi) return; MK.pi = p; mkSave(); mkRender(true); }
  else if (act === "mk-o") { MK.ans[sec][b.dataset.k] = +b.dataset.o; mkSave(); mkRender(); }
  else if (act === "mk-end") {
    const n = +b.dataset.n;
    if (n && !b.dataset.sure) { b.dataset.sure = "1"; b.textContent = `${n} ta ${sec === "w" ? "topshiriq" : "savol"} javobsiz. Baribir yakunlansinmi?`; return; }
    mkEnd();
  }
  else if (act === "mk-play") {
    const key = b.dataset.k, au = key.length > 1 && key.includes(".") ? mkQs(t, sec).find(x => sec + x.k === key).q.audio : t[sec].parts[+key.slice(1)].audio;
    if (MK_PLAYING || (MK.plays[key] || 0) >= mkPlays()) return;
    MK.plays[key] = (MK.plays[key] || 0) + 1; MK_PLAYING = key; mkSave(); mkRender();
    const n = MK.plays[key], stop = () => { if (MK_PLAYING !== key || (MK && MK.plays[key] !== n)) return; MK_PLAYING = null; if (MK && location.hash === "#mock-" + MK.id) mkRender(); };
    speakSeq(au.lines.map(l => [l[0], l[1]]), stop);
    // A voice that never reports its end (some browsers) does not lock the button for good
    setTimeout(stop, 4000 + au.lines.reduce((a, l) => a + l[1].length * 110 + 600, 0));
  }
  else if (act === "mk-sp-go" || act === "mk-sp-again") {
    if (act === "mk-sp-again") { if (MK.strict) return; delete MK.ans.s[MK.sp.i]; if (MK_RECS[MK.sp.i]) { try { URL.revokeObjectURL(MK_RECS[MK.sp.i]); } catch (e) {} delete MK_RECS[MK.sp.i]; } MK.sp.st = "ready"; }
    mkSpGo();
  }
  else if (act === "mk-sp-talk") mkSpTalk();
  else if (act === "mk-sp-stop") mkSpStop();
  else if (act === "mk-sp-next") { MK.sp = { i: MK.sp.i + 1, st: "ready" }; mkSave(); mkRender(true); }
}
document.addEventListener("input", e => {
  const d = e.target.dataset;
  if (!MK || !d || !(d.mkk || d.mkw)) return;
  if (d.mkk) { const [sec, k] = d.mkk.split("|"); MK.ans[sec][k] = e.target.value; }
  else {
    MK.ans.w[d.mkw] = e.target.value;
    const tk = mkTest(MK.id).w.tasks.find(x => x.id === d.mkw), wc = mkWords(e.target.value), el = $("mk-wc-" + d.mkw.replace(".", "-"));
    if (el) { el.textContent = wc + " soʻz"; el.classList.toggle("ok", wc >= tk.min && wc <= tk.max); }
    const tab = document.querySelector(".mk-ptab.on small"); if (tab) tab.textContent = (wc >= tk.min * 0.5 ? 1 : 0) + "/1";
  }
  mkSaveSoon();
});
document.addEventListener("focusin", e => { if (e.target.matches && e.target.matches("[data-mkk],[data-mkw],#mk-fin")) MK_FOCUS = e.target; });
document.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.id === "mk-fin") { const b = document.querySelector('[data-act="mk-fcheck"]'); if (b) b.click(); } });
// The letter buttons keep the focus (and the phone keyboard) in the field
document.addEventListener("mousedown", e => { if (e.target.closest && e.target.closest(".mk-chars")) e.preventDefault(); });
