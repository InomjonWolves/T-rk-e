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
   (key "mk|<id>|<section>"), every answer counts for its skill (skillLog). */
let MK = null, MK_P = null, MK_PLAYING = null, MK_FOCUS = null, MK_MIC = null, MK_TK = 0, MK_SAVE_T = 0;
const MK_KEY = "ty-mock-run", MK_PLAYS = 2, MK_SECS = ["l", "r", "w", "s"];
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
  MK = { id, secs, full: which === "all", si: 0, pi: 0, phase: "intro", left: 0, t: 0, started: 0, ans: { l: {}, r: {}, w: {}, s: {} }, ord: {}, plays: {}, used: {}, score: {}, xp: {}, sp: { i: 0, st: "ready" }, res: null };
  // Options of a question with its own choices come in a new order every run (shared A–F options keep theirs)
  ["l", "r"].forEach(sec => mkQs(t, sec).forEach(x => { if (x.q.o) MK.ord[sec + x.k] = shuffle(x.q.o.map((_, i) => i)); }));
  mkSave();
  go("mock-" + id);
}
function mkBegin() {
  const t = mkTest(MK.id), sec = MK.secs[MK.si];
  MK.phase = "run"; MK.pi = 0; MK.t = 0; MK.started = MK.started || Date.now();
  if (sec === "s") MK.sp = { i: 0, st: "ready" };
  else MK.left = t[sec].min * 60;
  mkSave(); mkRender(true);
}
function mkAway() {
  if (!MK) return;
  if (MK_PLAYING) { MK_PLAYING = null; ttsCancel(); }
  if (MK.sp && (MK.sp.st === "prep" || MK.sp.st === "talk")) { mkMicStop(); MK.sp.st = "ready"; }
  MK.t = 0; mkSave();
}
window.addEventListener("hashchange", () => { if (MK && location.hash !== "#mock-" + MK.id) mkAway(); });
// The clock: one tick a second; counts only while the exam page is open and visible
function mkTick() {
  if (!MK || MK.phase !== "run") return;
  const now = Date.now(), on = location.hash === "#mock-" + MK.id && !document.hidden;
  if (!on) { MK.t = 0; return; }
  const dt = MK.t ? Math.min(5, (now - MK.t) / 1000) : 0, sec = MK.secs[MK.si];
  MK.t = now;
  MK.used[sec] = (MK.used[sec] || 0) + dt;
  if (sec === "s") { mkSpTick(now); return; }
  MK.left = Math.max(0, MK.left - dt);
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
    ${r.n ? `<p class="muted mk-hist">Toʻliq sinov ${r.n} marta topshirilgan · oxirgi natija ${r.l} (${mkLevel(r.l)})</p>` : ""}
  </div>`;
}
function mkResumeCard() {
  if (!mkLoad() || !mkBusy() || !MK.started) return "";
  const t = mkTest(MK.id), sec = mkSk(MK.secs[MK.si]);
  return `<div class="glass pad mk-resume"><b>${ICON.clock}Boshlangan sinov: <span lang="tr">${esc(t.tr)}</span></b>
    <p class="muted">Hozirgi boʻlim: ${sec.uz}${MK.phase === "run" && MK.secs[MK.si] !== "s" ? ` · ${mkClock(MK.left)} qoldi` : ""}. Vaqt faqat sinov oynasi ochiq turganda yuradi.</p>
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
  ${MOCK.tests.map(mkTestCard).join("")}
  <details class="glass mk-how"><summary><b>Qanday baholanadi?</b></summary>
    <div class="mk-how-body">
      <p>Har bir boʻlim <b>0–${sc.max}</b> ball bilan baholanadi, umumiy ball — toʻrt boʻlimning oʻrtachasi.</p>
      <div class="mk-bands">${sc.bands.map(([lv, min], i) => `<span class="tag ${LV_COLOR[lv] || "sky"}-t">${lv}: ${min}${i ? `–${sc.bands[i - 1][1] - 1}` : `–${sc.max}`}</span>`).join("")}<span class="tag">B1 dan past: 0–${sc.bands[sc.bands.length - 1][1] - 1}</span></div>
      <p>Tinglash va oʻqish — toʻgʻri javoblar soni boʻyicha. Yozish va gapirish avtomatik tekshiriladi: hajm, topshiriq talablari, bogʻlovchilar, imlo, mavzu soʻzlari. Bu <b>taxminiy</b> baho — rasmiy imtihonda ularni imtihonchilar baholaydi.</p>
      <p>Vaqt faqat sinov oynasi ochiq turganda yuradi: chiqib ketsangiz, sinov toʻxtab turadi va javoblaringiz saqlanadi.</p>
    </div></details>`;
}
function viewMock(id) {
  if (!mkReady()) return `${topbar()}${catLoader()}`;
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
  if (!v || !MK) { route(); return; }
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
    const rules = { l: `Har bir audioni ${MK_PLAYS} marta tinglash mumkin. Savollarni audio boshlanishidan oldin oʻqib oling.`, r: "Qismlar orasida bemalol oʻtishingiz mumkin. Javobni oʻzgartirish mumkin — boʻlim yakunlanguncha.", w: "Matnni telefon yoki kompyuter klaviaturasida yozing. Soʻz soni pastda koʻrinib turadi.", s: "Har bir savolda avval tayyorlanish, keyin gapirish vaqti bor. Mikrofon gapirish vaqtida oʻzi yoqiladi." }[sec];
    return `${topbar()}<div><a class="back" href="#mock">${ICON.back}Imtihon sinovi</a></div>
    <div class="glass pad mk-intro">
      <span class="mk-intro-ico ${k.c}-t">${ICON[k.ico]}</span>
      ${MK.secs.length > 1 ? `<small class="muted">${MK.si + 1}/${MK.secs.length}-boʻlim</small>` : ""}
      <h1>${k.uz} <span class="muted" lang="tr">· ${k.tr}</span></h1>
      <p><b>${parts.length} qism · ${n} ${mkSecUnit(sec)} · ${mkSecMin(t, sec)} daqiqa</b></p>
      <ul class="mk-parts-list">${parts.map(p => `<li>${esc(p.t)}</li>`).join("")}</ul>
      <p class="muted">${rules}</p>
      ${sec === "s" && !canListen() ? `<div class="notice"><b>Bu brauzerda mikrofon ishlamaydi.</b> Gapirish boʻlimini Chrome (yoki ilovamiz) orqali topshiring. Hozir uni oʻtkazib yuborishingiz mumkin.</div>
        <button class="btn btn-ghost btn-block" data-act="mk-skip">Gapirish boʻlimini oʻtkazib yuborish</button>` :
        `<button class="btn btn-grad btn-block" data-act="mk-go">${ICON.clock}Boshlash</button>`}
    </div>`;
  }
  if (sec === "s") return mkBar(t, sec) + mkSpeakHTML(t);
  const parts = sec === "w" ? t.w.tasks : t[sec].parts, p = parts[MK.pi], last = MK.pi === parts.length - 1;
  const tabs = parts.map((x, i) => { const [a, n] = mkPartCount(t, sec, i); return `<button class="mk-ptab${i === MK.pi ? " on" : ""}${a === n ? " full" : ""}" data-act="mk-part" data-p="${i}"${i === MK.pi ? ' aria-current="step"' : ""}>${i + 1}<span class="sr">-qism, javoblar:</span><small>${a}/${n}</small></button>`; }).join("");
  const left = mkUnanswered(t, sec);
  return `${mkBar(t, sec)}
  <nav class="mk-ptabs" aria-label="Qismlar">${tabs}</nav>
  ${sec === "w" ? mkTaskHTML(p) : mkPartHTML(t, sec, p, MK.pi)}
  <div class="mk-nav">
    <button class="btn btn-ghost" data-act="mk-part" data-p="${MK.pi - 1}" ${MK.pi ? "" : "disabled"}>${ICON.back}Oldingi</button>
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
  const n = MK.plays[key] || 0, on = MK_PLAYING === key, left = MK_PLAYS - n;
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
    <p class="muted">${heard && heard.text ? `${mkWords(heard.text)} soʻz eshitildi.` : "Mikrofonga yaqinroq gapiring."} Javob saqlandi.</p>
    <div class="fr-actions"><button class="btn btn-ghost" data-act="mk-sp-again">Qayta javob berish</button>${last ? `<button class="btn btn-grad" data-act="mk-end" data-n="0">${ICON.check}Boʻlimni yakunlash</button>` : `<button class="btn btn-grad" data-act="mk-sp-next">Keyingi savol</button>`}</div>`;
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
  mkRender();
}
function mkSpStop() {
  const i = MK.sp.i;
  MK.sp.st = "wait"; MK.sp.until = 0;
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
    r.onerror = ev => { if (ev.error === "not-allowed" || ev.error === "service-not-allowed") { rec.on = false; toast("Mikrofonga ruxsat berilmagan"); } else if (ev.error === "network") toast("Nutqni tanish uchun internet kerak"); };
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

/* ---------- Scoring ---------- */
function mkWriteCheck(text, tk) {
  const r = wrCheck(text || "", { u: { id: "", level: tk.lv || "B1" }, tgt: { min: tk.min, max: tk.max, unit: "soʻz" }, goals: tk.need.map(([l, src]) => [l, mkRe(src)]) });
  let s = r.wc ? r.score : 0;
  // Far too short is not a text yet; far too long misses the task's frame
  if (r.wc < tk.min * 0.5) s = Math.round(s * r.wc / tk.min);
  if (r.wc > tk.max * 1.6) s = Math.max(0, s - 10);
  return { s, r };
}
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
  if (sec === "s") mkMicStop();
  MK.phase = "wait";
  const fin = () => {
    const t = mkTest(MK.id), sc = mkScoreSec(t, sec);
    MK.score[sec] = sc;
    // Every answer counts for its skill; the section's XP like any practice of that skill
    if (sec === "l" || sec === "r") sc.ok.forEach(ok => skillLog(sec, ok)); else sc.items.forEach(s => skillLog(sec, s >= 70));
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
  save();
  beep(v >= MOCK.scale.bands[1][1] ? "fanfare" : "done");
  if (v >= MOCK.scale.bands[1][1]) hapticDone();
}

/* ---------- The result ---------- */
function mkResultHTML(t) {
  const res = MK.res, max = MOCK.scale.max, k = s => mkSk(s), many = MK.secs.length > 1;
  const weak = many ? MK.secs.slice().sort((a, b) => MK.score[a].v - MK.score[b].v)[0] : null;
  const xp = MK.secs.reduce((a, s) => a + (MK.xp[s] || 0), 0);
  const tips = { l: ['data-act="sk-go" data-s="l"', "Tinglash mashqi", "Suhbat va gaplarni matnsiz tinglab tushunish"], r: ['href="#oqish"', "Oʻqish matnlari", "Matn va savollar — har kuni bittadan"], w: ['href="#gx"', "Qoidalar mashqi", "Qoʻshimchalar, zamonlar va bogʻlovchilar"], s: ['data-act="sk-go" data-s="s"', "Gapirish mashqi", "Gaplarni ovoz chiqarib takrorlash va talaffuz"] };
  const row = s => { const v = MK.score[s].v; return `<div class="mk-srow"><span class="ico ${k(s).c}-t">${ICON[k(s).ico]}</span><span class="mk-sname"><b>${k(s).uz}</b><small>${mkLevel(v)}</small></span>
    <span class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${v}" aria-label="${k(s).uz}"><i style="width:${Math.round(v / max * 100)}%"></i></span><b class="mk-sv">${v}</b></div>`; };
  return `${topbar()}<div><a class="back" href="#mock">${ICON.back}Imtihon sinovi</a></div>
  <div class="glass pad mk-res">
    ${catSVG({ pose: res.v >= MOCK.scale.bands[1][1] ? "cheer" : "sit", cls: "mascot" })}
    <small class="muted">${many ? "Umumiy natija" : `${k(MK.secs[0]).uz} boʻlimi`} · <span lang="tr">${esc(t.tr)}</span></small>
    <div class="mk-score"><b>${res.v}</b><small>/ ${max}</small></div>
    <span class="tag ${LV_COLOR[res.lv] || "pink"}-t mk-lv">Taxminiy daraja: ${res.lv}</span>
    ${xp ? `<span class="tag orange-t">+${xp} XP</span>` : ""}
    <p class="muted">${res.v >= MOCK.scale.bands[0][1] ? "Ajoyib natija! Imtihonga tayyorgarligingiz yuqori." : res.v >= MOCK.scale.bands[1][1] ? "Yaxshi natija! Zaif boʻlimni kuchaytirsangiz, yanada yuqori ball olasiz." : res.v >= MOCK.scale.bands[2][1] ? "Yomon emas! Pastdagi xatolar tahlilini koʻrib chiqing." : "Boshlanishi yaxshi. Kursni davom ettirib, sinovni keyinroq qayta topshiring."}</p>
  </div>
  ${many ? `<section class="section"><div class="section-head"><h2>Boʻlimlar</h2></div><div class="glass pad mk-srows">${MK.secs.map(row).join("")}</div></section>` : ""}
  ${weak ? `<section class="section"><div class="section-head"><h2>Keyingi qadam</h2></div><div class="lrows glass">${lrow(tips[weak][0], k(weak).ico, k(weak).c, `${k(weak).uz}ni kuchaytiring: ${tips[weak][1]}`, tips[weak][2])}</div></section>` : ""}
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
      return `<div class="mk-wrv"><b>${esc(tk.t)} · ${c.s}%</b>${MK.ans.w[tk.id] ? `<div class="mk-mine" lang="tr">${esc(MK.ans.w[tk.id])}</div>${wrResultHtml(c.r, "Topshiriq talablari")}` : `<p class="muted">Bu topshiriq yozilmagan.</p>`}</div>`; }).join("");
  } else {
    body = mkTurns(t).map((x, i) => { const a = MK.ans.s[i], sc2 = mkSpeakScore(a && a.text, x);
      return `<div class="mk-wrv"><b lang="tr">${esc(x.q.q)}</b><small class="muted">${sc2.s}% · ${sc2.wc || 0} soʻz${sc2.wc ? ` · bogʻlovchilar: ${sc2.conns} · mavzu soʻzlari: ${sc2.hits}` : ""}</small>
        <div class="mk-mine" lang="tr">${a && a.text ? esc(a.text) : '<span class="muted">Javob yozib olinmagan</span>'}</div></div>`; }).join("") + `<p class="muted mk-note">Nutqingizni brauzer matnga aylantirdi — baʼzi soʻzlar notoʻgʻri eshitilgan boʻlishi mumkin.</p>`;
  }
  const sum = sec === "l" || sec === "r" ? `${sc.right}/${sc.n} toʻgʻri` : `${Math.round(sc.p * 100)}%`;
  return `<details class="glass mk-rvbox"><summary><span class="ico ${k.c}-t">${ICON[k.ico]}</span><b>${k.uz}</b><small>${sum} · ${sc.v}/${MOCK.scale.max}</small></summary><div class="mk-rvbody">${body}</div></details>`;
}

/* ---------- Taps and typing ---------- */
function mkAct(act, b) {
  if (act === "mk-start") { mkStart(b.dataset.id, b.dataset.s); return; }
  if (act === "mk-cancel") {
    if (!b.dataset.sure) { b.dataset.sure = "1"; b.textContent = "Javoblar oʻchadi. Bekor qilinsinmi?"; return; }
    mkAway(); MK = null; try { localStorage.removeItem(MK_KEY); } catch (e) {} route(); return;
  }
  if (!MK) return;
  const t = mkTest(MK.id), sec = MK.secs[MK.si];
  if (act === "mk-go") mkBegin();
  else if (act === "mk-again") { const which = MK.full ? "all" : MK.secs[0]; MK = null; try { localStorage.removeItem(MK_KEY); } catch (e) {} mkStart(t.id, which); }
  else if (act === "mk-skip") { MK.score.s = { v: 0, p: 0, items: mkTurns(t).map(() => 0), skipped: true }; MK.secs = MK.secs.filter(s => s !== "s"); if (!MK.secs.length) { MK = null; try { localStorage.removeItem(MK_KEY); } catch (e) {} go("mock"); return; } mkDone(t); mkSave(); mkRender(true); }
  else if (act === "mk-part") { MK.pi = +b.dataset.p; mkSave(); mkRender(true); }
  else if (act === "mk-o") { MK.ans[sec][b.dataset.k] = +b.dataset.o; mkSave(); mkRender(); }
  else if (act === "mk-end") {
    const n = +b.dataset.n;
    if (n && !b.dataset.sure) { b.dataset.sure = "1"; b.textContent = `${n} ta ${sec === "w" ? "topshiriq" : "savol"} javobsiz. Baribir yakunlansinmi?`; return; }
    mkEnd();
  }
  else if (act === "mk-play") {
    const key = b.dataset.k, au = key.length > 1 && key.includes(".") ? mkQs(t, sec).find(x => sec + x.k === key).q.audio : t[sec].parts[+key.slice(1)].audio;
    if (MK_PLAYING || (MK.plays[key] || 0) >= MK_PLAYS) return;
    MK.plays[key] = (MK.plays[key] || 0) + 1; MK_PLAYING = key; mkSave(); mkRender();
    const n = MK.plays[key], stop = () => { if (MK_PLAYING !== key || (MK && MK.plays[key] !== n)) return; MK_PLAYING = null; if (MK && location.hash === "#mock-" + MK.id) mkRender(); };
    speakSeq(au.lines.map(l => [l[0], l[1]]), stop);
    // A voice that never reports its end (some browsers) does not lock the button for good
    setTimeout(stop, 4000 + au.lines.reduce((a, l) => a + l[1].length * 110 + 600, 0));
  }
  else if (act === "mk-ch") {
    const el = MK_FOCUS && document.body.contains(MK_FOCUS) ? MK_FOCUS : document.querySelector("[data-mkk],[data-mkw]");
    if (!el) return;
    const s = el.selectionStart ?? el.value.length, e = el.selectionEnd ?? s;
    el.setRangeText(b.dataset.c, s, e, "end"); el.focus();
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
  else if (act === "mk-sp-go" || act === "mk-sp-again") { if (act === "mk-sp-again") { delete MK.ans.s[MK.sp.i]; MK.sp.st = "ready"; } mkSpGo(); }
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
document.addEventListener("focusin", e => { if (e.target.matches && e.target.matches("[data-mkk],[data-mkw]")) MK_FOCUS = e.target; });
// The letter buttons keep the focus (and the phone keyboard) in the field
document.addEventListener("mousedown", e => { if (e.target.closest && e.target.closest(".mk-chars")) e.preventDefault(); });
