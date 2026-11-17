/* Türkçe Yoʻl — interactive stories (hikoya.js, loaded on demand): the story's lines come one by one with their voice,
   questions in between keep the learner in the story. One of the app's scripts (js/, loaded in order by index.html). */

/* ---------- Stories (2026-11-16) ----------
   #hikoya — the list by level (a level opens with the course: lvOpen); #hikoya-<id> — the player.
   A step is a line ["Name", tr, uz] or a question (hikoya.js lists the kinds). Lines play their recording when they
   appear (women and the narrator: voice "a", men: "b"), every word can be tapped (mw), «Tarjima» shows the Uzbek line.
   A question must be answered before the story goes on; the first answer counts. Skills: mc, word, next — reading;
   order — writing; hear — listening. At the end: reading XP (xpAward, key "hk|<id>"), the best % in S.hk[id]. */
let HK_P = null, HK_LV = "A1", HKR = null, HK_AN = null;   // HK_AN: the step that just appeared (it alone slides in)
function loadHk() {
  if (typeof HK !== "undefined") return Promise.resolve();
  return HK_P || (HK_P = loadScript("hikoya.js").catch(e => { HK_P = null; throw e; }));
}
const hkReady = () => typeof HK !== "undefined";
const hkBest = id => (S.hk && S.hk[id] != null ? S.hk[id] : null);
const HK_SK = { mc: "r", word: "r", next: "r", order: "w", hear: "l" };
const hkQs = h => h.s.filter(x => !Array.isArray(x));
// The voice of a speaker: men "b", women and the narrator "a"
const hkVoice = (h, who) => (h.cast && h.cast[who] === "m" ? "b" : "a");
function hkSay(h, who, text, btn) {
  const t = audioNorm(text), v = hkVoice(h, who);
  if (btn) btn.classList.add("playing");
  const off = () => btn && btn.classList.remove("playing");
  if (playRec(t, v === "b" && hasRec(t, "b") ? "b" : "a", ttsRate(), off, () => speak(t, btn))) return;
  speak(t, btn);
}
// The line a question leaves in the story once it is answered (next, order, hear); null for mc and word
const hkLineOf = q => q.k === "next" ? [q.who, q.o[q.a], q.uz] : q.k === "order" ? [q.who, q.s + ".", q.uz] : q.k === "hear" ? [q.who, q.t, q.uz] : null;
const hkInit = () => ({ col: "", lineTr: {}, ans: {}, ord: {}, tiles: {} });
function hkRun(id) {
  if (!HKR || HKR.id !== id) {
    const h = HK.find(x => x.id === id);
    HKR = Object.assign(hkInit(), { id, n: 1, right: 0, done: null });
    // Options are shuffled once per run; tiles of an order question too
    h.s.forEach((x, i) => { if (!Array.isArray(x) && x.o) HKR.ord[i] = shuffle(x.o.map((_, j) => j)); if (x.k === "order") HKR.tiles[i] = { pool: shuffle(x.s.split(" ")), used: [] }; });
  }
  return HKR;
}

function viewHikoyalar() {
  if (!hkReady()) return `${topbar()}${catLoader()}`;
  const lvs = ["A1", "A2", "B1", "B2"], list = HK.filter(h => h.lv === HK_LV), open = lvOpen(HK_LV);
  const read = HK.filter(h => hkBest(h.id) !== null).length;
  return `${topbar()}
  <div><a class="back" href="#library">${ICON.back}Kutubxona</a></div>
  <div class="lesson-head"><div class="tags"><span class="tag violet-t">${ICON.book}Hikoyalar</span><span class="tag green-t">${read}/${HK.length} oʻqilgan</span></div>
    <h1>Hikoyalar</h1><p class="sub">Qisqa voqealar Dilnoza, Jasur, Defne, Kerem va Pamuk bilan. Har bir gapni tinglang, notanish soʻzni bosing va savollarga javob bering. Har hikoya uchun +${XP_VAL.reading} XP.</p></div>
  <div class="seg glass" role="tablist">${lvs.map(l => `<button role="tab" data-act="hk-lv" data-l="${l}" aria-selected="${HK_LV === l}">${l}${lvOpen(l) ? "" : `<span class="seg-lock">${ICON.lock}</span>`}</button>`).join("")}</div>
  ${open ? "" : `<div class="glass pad lock-note"><b>${ICON.lock}${HK_LV} hikoyalari hali yopiq</b><p class="muted">${esc(lockWhy(HK_LV))}</p><a class="link" href="#placement">Darajani aniqlash testi</a></div>`}
  <div class="list hk-list">${list.map(h => { const b = hkBest(h.id), who = Object.keys(h.cast).filter(n => n !== "Hepsi").slice(0, 2);
    return `<a class="unit glass${open ? "" : " locked"}" href="#hikoya-${h.id}">
      <span class="hk-cast" aria-hidden="true">${who.map(n => hkFace(h, n)).join("")}</span>
      <span class="unit-body"><span class="unit-title" lang="tr">${esc(h.tr)}</span><span class="unit-sub">${esc(h.uz)} · ${hkQs(h).length} ta savol${b !== null ? ` · eng yaxshi natija ${b}%` : ""}</span></span>
      ${b !== null ? pctRing(b / 100) : open ? ICON.chev : `<span class="state lock" title="Yopiq">${ICON.lock}</span>`}</a>`; }).join("")}</div>`;
}
// A speaker's face: Pamuk is Pamuk; everyone else is a round initial in a colour of their own
const HK_COLS = ["sky", "violet", "orange", "pink", "green", "teal"];
function hkFace(h, who) {
  if (who === "Pamuk") return `<span class="hk-face pamuk" aria-hidden="true">${catSVG({ pose: "head" })}</span>`;
  if (!who) return `<span class="hk-face narr" aria-hidden="true">${ICON.book}</span>`;
  let n = 0; for (const c of who) n = (n * 31 + c.charCodeAt(0)) % 997;
  return `<span class="hk-face ${HK_COLS[n % HK_COLS.length]}-t" aria-hidden="true">${esc(who[0])}</span>`;
}
function hkLineHTML(h, ln, key) {
  const [who, tr, uz] = ln, open = HKR.lineTr[key];
  return `<div class="hk-line${who ? "" : " narr"}${HK_AN === key ? " hk-in" : ""}">${hkFace(h, who)}
    <div class="hk-bubble">${who ? `<small class="hk-who">${esc(who)}</small>` : ""}<p lang="tr">${mw(tr)}</p>${open ? `<p class="hk-uz">${esc(uz)}</p>` : ""}
      <span class="hk-tools"><button class="say" data-act="hk-say" data-k="${esc(key)}" aria-label="Tinglash">${ICON.speak}</button><button class="link hk-trb" data-act="hk-tr" data-k="${esc(key)}">${open ? "Tarjimani yashirish" : "Tarjima"}</button></span></div></div>`;
}
function hkQHTML(h, q, i) {
  const a = HKR.ans[i], answered = a !== undefined, ord = HKR.ord[i] || [];
  const opt = j => { const cls = answered ? (j === q.a ? " right" : a === j ? " wrong" : "") : ""; return `<button class="opt${cls}" data-act="hk-ans" data-i="${i}" data-o="${j}" ${answered ? "disabled" : ""}${q.k === "next" ? ' lang="tr"' : ""}>${esc(q.o[j])}</button>`; };
  let body = "";
  if (q.k === "mc") body = `<b>${esc(q.q)}</b>`;
  else if (q.k === "word") body = `<b>«<span lang="tr">${esc(q.w)}</span>» soʻzi nimani bildiradi?</b>`;
  else if (q.k === "next") body = `<b>${esc(q.who)} keyin nima deydi?</b>`;
  else if (q.k === "hear") body = `<b>${esc(q.who)} nima dedi? Tinglang va maʼnosini tanlang.</b><button class="btn btn-soft hk-play" data-act="hk-hear" data-i="${i}">${ICON.speak}Tinglash</button>`;
  else if (q.k === "order") {
    const t = HKR.tiles[i], right = answered && a === 1;
    body = `<b>${esc(q.who)}: «${esc(q.uz)}» — turkchada yigʻing</b>
      <div class="hk-built" lang="tr">${t.used.map((w, j) => `<button class="bk" data-act="hk-tile-back" data-i="${i}" data-j="${j}" ${answered ? "disabled" : ""}>${esc(w)}</button>`).join("") || `<span class="muted">Soʻzlarni tartib bilan bosing</span>`}</div>
      ${answered ? "" : `<div class="bank words hk-pool" lang="tr">${t.pool.map((w, j) => `<button class="bk" data-act="hk-tile" data-i="${i}" data-j="${j}">${esc(w)}</button>`).join("")}</div>
      <button class="btn btn-grad btn-block" data-act="hk-order" data-i="${i}" ${t.pool.length ? "disabled" : ""}>${ICON.check}Tekshirish</button>`}
      ${answered ? `<div class="feedback ${right ? "ok" : "no"}">${right ? "Barakalla! Toʻgʻri." : `Toʻgʻrisi: <b lang="tr">${esc(q.s)}</b>`}</div>` : ""}`;
    return `<div class="glass pad hk-q${HK_AN === "c" + i ? " hk-in" : ""}">${body}</div>${answered ? hkLineHTML(h, hkLineOf(q), "q" + i) : ""}`;
  }
  const fb = answered ? `<div class="feedback ${a === q.a ? "ok" : "no"}">${a === q.a ? "Barakalla! Toʻgʻri." : "Afsus — toʻgʻri javob yashil bilan belgilangan."}</div>` : "";
  const line = answered ? hkLineOf(q) : null;
  return `<div class="glass pad hk-q${HK_AN === "c" + i ? " hk-in" : ""}">${body}<div class="hk-opts">${ord.map(opt).join("")}</div>${fb}</div>${line ? hkLineHTML(h, line, "q" + i) : ""}`;
}
function viewHikoya(id) {
  if (!hkReady()) return `${topbar()}${catLoader()}`;
  const h = HK.find(x => x.id === id);
  if (!h) return `${topbar()}<div class="glass empty"><b>Hikoya topilmadi</b><a class="link" href="#hikoya">Barcha hikoyalar</a></div>`;
  HK_LV = h.lv;
  if (!lvOpen(h.lv)) return lockedView(h.lv);
  const r = hkRun(id), shown = h.s.slice(0, r.n), last = shown.length - 1, cur = h.s[last];
  const waiting = !Array.isArray(cur) && HKR.ans[last] === undefined, end = r.n >= h.s.length && !waiting;
  HK_AN = r.anim || null; r.anim = null;
  const steps = shown.map((x, i) => Array.isArray(x) ? hkLineHTML(h, x, "l" + i) : hkQHTML(h, x, i)).join("");
  const total = h.s.length, pctDone = Math.round(r.n / total * 100);
  return `${topbar()}
  <div><a class="back" href="#hikoya">${ICON.back}Hikoyalar</a></div>
  <div class="lesson-head"><div class="tags"><span class="tag ${LV_COLOR[h.lv]}-t">${h.lv}</span><span class="tag violet-t">${ICON.book}Hikoya</span></div>
    <h1 lang="tr">${esc(h.tr)}</h1><p class="sub">${esc(h.uz)}</p></div>
  <div class="bar hk-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pctDone}" aria-label="Hikoya"><i style="width:${pctDone}%"></i></div>
  <div class="hk-story">${steps}</div>
  ${r.n === 1 ? mwHint() : ""}
  ${end ? hkEndHTML(h) : `<div class="sticky-cta"><button class="btn btn-grad btn-block" data-act="hk-next" ${waiting ? "disabled" : ""}>${waiting ? "Avval savolga javob bering" : "Davom etish"}</button></div>`}`;
}
function hkEndHTML(h) {
  if (!HKR.done) hkFinish(h);
  const d = HKR.done, n = hkQs(h).length, i = HK.indexOf(h), nx = HK.slice(i + 1).find(x => lvOpen(x.lv));
  return `<div class="glass pad hk-end${HK_AN ? " hk-in" : ""}">${catSVG({ pose: d.right === n ? "cheer" : "sit", cls: "mascot" })}
    <b>Hikoya tugadi! ${d.right}/${n} toʻgʻri${d.xp ? ` · +${d.xp} XP` : ""}</b>${d.why ? `<p class="xp-why">${esc(d.why)}</p>` : ""}
    <p class="muted">${d.right === n ? "Mukammal! Hikoyani toʻliq tushundingiz." : d.right >= n / 2 ? "Yaxshi! Notanish soʻzlarni bosib, maʼnosini yana bir koʻrib chiqing." : "Hikoyani qayta oʻqing — har bir soʻzni bosib, maʼnosini koʻrish mumkin."}</p>
    <div class="fr-actions"><button class="btn btn-ghost" data-act="hk-again" data-id="${h.id}">Qayta oʻqish</button>${nx ? `<a class="btn btn-grad" href="#hikoya-${nx.id}">Keyingi hikoya</a>` : `<a class="btn btn-grad" href="#hikoya">Barcha hikoyalar</a>`}</div></div>`;
}
function hkFinish(h) {
  const n = hkQs(h).length, right = HKR.right, r = xpAward("reading", { acc: right / n, key: "hk|" + h.id, sk: ["r", "l"] });
  S.hk = S.hk || {};
  S.hk[h.id] = Math.max(S.hk[h.id] || 0, Math.round(right / n * 100));
  dayRec().rev += n;
  save();
  HKR.done = { right, xp: r.xp, why: xpWhy(r) };
}
// Answer a question: the first answer counts; the line it leaves is spoken
function hkAnswer(i, ok, chosen) {
  const h = HK.find(x => x.id === HKR.id), q = h.s[i];
  if (HKR.ans[i] !== undefined) return;
  HKR.ans[i] = chosen; HKR.anim = "q" + i; if (ok) HKR.right++;
  skillLog(HK_SK[q.k], ok);
  beep(ok ? "ok" : "no"); haptic(ok);
  hkRender(true);
  const ln = hkLineOf(q); if (ln) setTimeout(() => hkSay(h, ln[0], ln[1]), 250);
}
function hkNext() {
  const h = HK.find(x => x.id === HKR.id);
  if (HKR.n >= h.s.length) return;
  HKR.n++;
  HKR.anim = (Array.isArray(h.s[HKR.n - 1]) ? "l" : "c") + (HKR.n - 1);
  hkRender(true);
  const x = h.s[HKR.n - 1];
  if (Array.isArray(x)) hkSay(h, x[0], x[1]);
  else if (x.k === "hear") setTimeout(() => hkSay(h, x.who, x.t), 200);
}
// Redraw the player in place (the page itself does not slide in again) and bring the newest step into view above the button
function hkRender(down) {
  const v = document.querySelector('.view[data-v="hikoya"]');
  if (!v || !HKR) { route(); return; }
  const y = window.scrollY, box = document.createElement("div");
  box.innerHTML = viewHikoya(HKR.id);
  v.replaceChildren(...box.childNodes);
  CatLife.scan();
  window.scrollTo(0, y);
  if (!down && !v.querySelector(".hk-end.hk-in")) return;
  const el = v.querySelector(".hk-end") || v.querySelector(".hk-story > :last-child");
  if (!el) return;
  // offsetTop ignores the slide-in transform, so the measure is where the step will rest
  let top = 0; for (let e = el; e; e = e.offsetParent) top += e.offsetTop;
  const cta = v.querySelector(".sticky-cta"), nav = document.querySelector(".nav");
  const navTop = nav && nav.getBoundingClientRect().top > innerHeight / 2 ? nav.getBoundingClientRect().top : innerHeight;
  const limit = Math.min(cta ? innerHeight - parseFloat(getComputedStyle(cta).bottom || 0) - cta.offsetHeight : navTop, navTop) - 12;
  const over = top + el.offsetHeight - window.scrollY - limit;
  if (over > 0) window.scrollTo({ top: window.scrollY + over, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}
function hkAct(act, b) {
  const h = HKR && HK.find(x => x.id === HKR.id);
  if (act === "hk-lv") { HK_LV = b.dataset.l; route(); return; }
  if (act === "hk-again") { HKR = null; route(); window.scrollTo(0, 0); return; }
  if (!h) return;
  const i = +b.dataset.i;
  if (act === "hk-next") hkNext();
  else if (act === "hk-ans") { const q = h.s[i], o = +b.dataset.o; hkAnswer(i, o === q.a, o); }
  else if (act === "hk-hear") hkSay(h, h.s[i].who, h.s[i].t, b);
  else if (act === "hk-tile" || act === "hk-tile-back") {
    const t = HKR.tiles[i], j = +b.dataset.j;
    if (act === "hk-tile") t.used.push(t.pool.splice(j, 1)[0]); else t.pool.push(t.used.splice(j, 1)[0]);
    hkRender();
  }
  else if (act === "hk-order") { const t = HKR.tiles[i], ok = t.used.join(" ") === h.s[i].s; hkAnswer(i, ok, ok ? 1 : 0); }
  else if (act === "hk-tr") { HKR.lineTr[b.dataset.k] = !HKR.lineTr[b.dataset.k]; hkRender(); }
  else if (act === "hk-say") {
    const k = b.dataset.k, x = k[0] === "l" ? h.s[+k.slice(1)] : hkLineOf(h.s[+k.slice(1)]);
    if (x) hkSay(h, x[0], x[1], b);
  }
}
