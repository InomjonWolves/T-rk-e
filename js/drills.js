/* Türkçe Yoʻl — Anonymous statistics, pronunciation, rule exercises, sound effects and the app feel.
   One of the app's scripts (js/, loaded in order by index.html); they share one global scope. */

/* ---------- Anonymous learning statistics ----------
   Every few hours a signed-in learner's app writes a small summary to stats/{uid}: skill counts, balance,
   skill levels and test results. No name, e-mail, answers or texts. Learners can switch it off in Settings.
   Only accounts listed in admins/{uid} (added by hand in the Firebase console) can read the collection;
   their summary page is #admin. */
let ADMIN = false, ADMIN_DATA = null, ADMIN_BUSY = false, ADMIN_ERR = "";
const STATS_EVERY = 3 * 3600 * 1000;
function statsDoc() {
  const st = skStats(14), t = {}, w = {}, lvl = {}, kt = {};
  SKILLS.forEach(s => {
    t[s.id] = [S.sk[s.id][0], S.sk[s.id][1]];
    w[s.id] = [st[s.id].o, st[s.id].n, Math.round(st[s.id].t / 60)];
    lvl[s.id] = skLevel(s.id) || "";
  });
  LVS.forEach(lv => {
    const x = (S.ktsk || {})[lv];
    if (x) kt[lv] = { r: x.r ?? null, l: x.l ?? null, w: x.w ?? null, s: x.s ?? null };
  });
  let act = 0;
  for (let i = 0; i < 14; i++) if (dayGet(keyOf(dayNum() - i)).xp) act++;
  // Return metrics: first active day, the last 30 days as "0"/"1" (oldest first, today last), finished exercises
  let a = "";
  for (let i = 29; i >= 0; i--) { const d = dayGet(keyOf(dayNum() - i)); a += d.xp || d.rev ? "1" : "0"; }
  return { v: 1, d: todayKey(), lv: kNext().level, units: kDoneCount(), t, w, bal: skBalance(st), lvl, kt, act, f: firstDay(), a, ses: S.sessions || 0 };
}
// The first day with any practice (older profiles: the earliest kept day)
function firstDay() {
  if (S.first) return S.first;
  const ks = Object.keys(S.days).filter(k => S.days[k].xp || S.days[k].rev).sort();
  return ks[0] || S.lastDay || todayKey();
}
function statsPush(force) {
  if (!USER || !db || S.anon === false) return;
  if (!force && S.statsAt && Date.now() - S.statsAt < STATS_EVERY) return;
  S.statsAt = Date.now();
  const d = statsDoc(), ref = db.collection("stats").doc(USER.uid);
  // Older published rules do not know f, a, ses yet: send the rest
  ref.set(d).catch(e => {
    if (!e || e.code !== "permission-denied") throw e;
    const o = Object.assign({}, d); delete o.f; delete o.a; delete o.ses;
    return ref.set(o);
  }).catch(() => { S.statsAt = 0; });
}
// The error log (js/state.js) goes to errs/{sig}: the kind of error and how many times, never who
let ERR_FLUSHING = false;
const errUa = () => { const u = navigator.userAgent, os = /Android [\d.]+|iPhone OS [\d_]+|iPad|Windows|Mac OS X|Linux/.exec(u), br = /(Edg|OPR|SamsungBrowser|YaBrowser|Firefox|CriOS|Chrome|Version)\/(\d+)/.exec(u);
  return [os ? os[0].replace(/_/g, ".") : "?", br ? (br[1] === "Version" ? "Safari" : br[1]) + " " + br[2] : ""].join(" · ").trim().slice(0, 80); };
const errPlat = () => IS_NATIVE ? "app" : IN_TG ? "tg" : isStandalone() ? "pwa" : "web";
function errFlush() {
  if (!USER || !db || S.anon === false || ERR_FLUSHING) return Promise.resolve();
  let all; try { all = JSON.parse(localStorage.getItem(ERR_KEY) || "{}"); } catch (e) { return Promise.resolve(); }
  const todo = Object.keys(all).filter(k => all[k].n > (all[k].sent || 0)).slice(0, 5);
  if (!todo.length) return Promise.resolve();
  ERR_FLUSHING = true;
  const FV = firebase.firestore.FieldValue, p = errPlat(), ua = errUa();
  return Promise.all(todo.map(sig => {
    const e = all[sig], k = Math.min(50, e.n - (e.sent || 0));
    return db.collection("errs").doc(sig).set({ m: e.m, f: e.f || "", s: e.s || "", r: e.r || "", v: e.v || "", p, ua, n: FV.increment(k), at: FV.serverTimestamp() }, { merge: true }).then(() => k, () => 0);
  })).then(ks => {
    try { const cur = JSON.parse(localStorage.getItem(ERR_KEY) || "{}"); todo.forEach((sig, i) => { if (cur[sig] && ks[i]) cur[sig].sent = (cur[sig].sent || 0) + ks[i]; }); localStorage.setItem(ERR_KEY, JSON.stringify(cur)); } catch (e) {}
  }).finally(() => { ERR_FLUSHING = false; });
}
// #admin: the latest kinds of error, the most frequent first; «Tuzatildi» removes one (it comes back if it happens again)
let ADMIN_ERRS = null;
function errsLoad() {
  if (!db) return;
  ADMIN_ERRS = { busy: 1 };
  db.collection("errs").orderBy("at", "desc").limit(40).get().then(snap => { ADMIN_ERRS = { list: snap.docs.map(d => Object.assign({ id: d.id }, d.data())) }; })
    .catch(e => { ADMIN_ERRS = { err: e && e.code === "permission-denied" ? "Ruxsat yoʻq: Firestore qoidalarida errs boʻlimi hali joylanmagan." : "Xatolar roʻyxatini yuklab boʻlmadi." }; })
    .finally(() => { if (location.hash === "#admin") route(); });
}
function errsHtml() {
  if (!ADMIN_ERRS) { errsLoad(); return ""; }
  if (ADMIN_ERRS.busy) return "";
  const head = n => `<div class="section-head"><h2>Ilovadagi xatolar</h2><span class="tag ${n ? "pink-t" : "green-t"}">${n ? n + " xil" : "yoʻq"}</span></div>`;
  if (ADMIN_ERRS.err) return `<section class="section">${head(0)}<div class="notice"><div>${esc(ADMIN_ERRS.err)}</div></div></section>`;
  const list = ADMIN_ERRS.list.slice().sort((a, b) => (b.n || 0) - (a.n || 0));
  if (!list.length) return `<section class="section">${head(0)}<div class="glass pad"><p class="muted">Foydalanuvchilarda xato qayd etilmagan.</p></div></section>`;
  const when = t => t && t.toDate ? t.toDate().toLocaleString("uz") : "—";
  return `<section class="section">${head(list.length)}<div class="list">${list.map(e => `<div class="glass pad err-row">
      <div class="err-top"><b>${e.n || 1}×</b><code>${esc(e.m)}</code></div>
      <small class="muted">${esc(e.f || "—")} · ${esc(e.r || "")} · ${esc(e.p || "")} · ${esc(e.ua || "")} · versiya ${esc(e.v || "—")} · oxirgi: ${when(e.at)}</small>
      ${e.s ? `<details><summary>Stek</summary><pre>${esc(e.s)}</pre></details>` : ""}
      <button class="btn btn-ghost err-fix" data-act="err-del" data-id="${esc(e.id)}">${ICON.check}Tuzatildi</button></div>`).join("")}</div></section>`;
}
function errDel(id) {
  db.collection("errs").doc(id).delete().then(() => { if (ADMIN_ERRS && ADMIN_ERRS.list) ADMIN_ERRS.list = ADMIN_ERRS.list.filter(e => e.id !== id); route(); }, () => toast("Oʻchirib boʻlmadi"));
}
function adminCheck(uid) {
  ADMIN = false; ADMIN_ERR = "";
  db.collection("admins").doc(uid).get().then(d => {
    ADMIN = d.exists; ADMIN_ERR = d.exists ? "" : "notfound";
    if (/^#?(profile|admin)$/.test(location.hash.replace("#", ""))) route();
  }).catch(e => { ADMIN_ERR = (e && e.code) || "error"; if (location.hash === "#admin") route(); });
}
function adminLoad() {
  if (ADMIN_BUSY || !db) return;
  ADMIN_BUSY = true;
  db.collection("stats").get().then(snap => {
    ADMIN_DATA = { at: new Date(), docs: snap.docs.map(d => d.data()) };
  }).catch(e => { ADMIN_DATA = { err: e && e.code === "permission-denied" ? "Ruxsat yoʻq: Firestore qoidalari yangilanmagan yoki hisobingiz admins roʻyxatida emas." : "Maʼlumotni yuklab boʻlmadi. Internetni tekshiring." }; })
    .finally(() => { ADMIN_BUSY = false; if (location.hash === "#admin") route(); });
}
// Turns the raw summaries into the numbers shown on #admin
function adminAgg(docs) {
  const all = docs.filter(x => x && x.v === 1), from = keyOf(dayNum() - 13);
  const active = all.filter(x => x.d >= from && SKILLS.some(s => x.w && x.w[s.id] && x.w[s.id][1]));
  const sk = {};
  SKILLS.forEach(s => sk[s.id] = { o: 0, n: 0, min: 0, weak: 0, users: 0 });
  active.forEach(x => {
    SKILLS.forEach(s => { const a = x.w[s.id] || [0, 0, 0]; sk[s.id].o += a[0]; sk[s.id].n += a[1]; sk[s.id].min += a[2] || 0; if (a[1]) sk[s.id].users++; });
    const weak = SKILLS.slice().sort((a, b) => (x.w[a.id] || [0])[0] - (x.w[b.id] || [0])[0])[0];
    sk[weak.id].weak++;
  });
  const balB = [0, 0, 0, 0, 0];
  active.forEach(x => balB[Math.min(4, Math.floor((x.bal || 0) / 20))]++);
  const lvl = {};
  SKILLS.forEach(s => { lvl[s.id] = { "": 0, A1: 0, A2: 0, B1: 0, B2: 0, C1: 0 }; all.forEach(x => { const v = (x.lvl || {})[s.id] || ""; if (v in lvl[s.id]) lvl[s.id][v]++; }); });
  const course = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0 };
  all.forEach(x => { if (x.lv in course) course[x.lv]++; });
  const tests = {};
  LVS.forEach(lv => { tests[lv] = {}; SKILLS.forEach(s => { const v = all.map(x => ((x.kt || {})[lv] || {})[s.id]).filter(v => typeof v === "number"); tests[lv][s.id] = v.length ? { avg: Math.round(v.reduce((a, b) => a + b, 0) / v.length), n: v.length } : null; }); });
  const avg = a => a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0;
  return { total: all.length, active: active.length, actDays: avg(active.map(x => x.act || 0)), bal: avg(active.map(x => x.bal || 0)), sk, balB, lvl, course, tests, ret: retention(all) };
}
/* Return metrics from the anonymous stats: x.f first day, x.a 30 days of activity ending x.d, x.ses exercises */
function retention(docs, today = todayKey()) {
  const n = k => Math.round(Date.parse(k) / DAY), T = n(today);
  const on = (x, day) => { if (!x.a || !x.d) return false; const i = x.a.length - 1 - (n(x.d) - day); return i >= 0 && i < x.a.length && x.a[i] === "1"; };
  const rows = docs.filter(x => x.f && x.a);
  const share = (pool, test) => pool.length ? { p: Math.round(pool.filter(test).length / pool.length * 100), n: pool.length } : { p: null, n: 0 };
  const c1 = rows.filter(x => n(x.f) <= T - 1 && n(x.f) >= T - 30), c7 = rows.filter(x => n(x.f) <= T - 7 && n(x.f) >= T - 37);
  const d1 = share(c1, x => on(x, n(x.f) + 1));
  const d7 = share(c7, x => on(x, n(x.f) + 7));
  const w1 = share(c7, x => [1, 2, 3, 4, 5, 6, 7].some(k => on(x, n(x.f) + k)));
  const dau = rows.filter(x => on(x, T)).length, wau = rows.filter(x => [0, 1, 2, 3, 4, 5, 6].some(k => on(x, T - k))).length;
  const fresh = Array.from({ length: 14 }, (_, i) => rows.filter(x => n(x.f) === T - 13 + i).length);
  const ses = rows.map(x => x.ses || 0);
  return { d1, d7, w1, dau, wau, fresh, freshDays: Array.from({ length: 14 }, (_, i) => keyOf(T - 13 + i)), ses: ses.length ? Math.round(ses.reduce((a, b) => a + b, 0) / ses.length) : 0, n: rows.length };
}
function retentionHtml(r) {
  if (!r.n) return `<section class="section"><div class="section-head"><h2>Qaytish</h2></div><div class="glass pad"><p class="muted">Yangi koʻrsatkichlar foydalanuvchilar ilovani yangilab, mashq qilgach paydo boʻladi.</p></div></section>`;
  const p = x => x.p === null ? "—" : x.p + "%";
  const tile = (v, l, c, ico) => `<div class="stat glass"><span class="ico ${c}-t">${ICON[ico]}</span><span><b>${v}</b><span>${l}</span></span></div>`;
  return `<section class="section"><div class="section-head"><h2>Qaytish va faollik</h2><span class="tag green-t">${r.n} kishi</span></div>
    <div class="stat-grid">${tile(p(r.d1), `1-kun qaytish (${r.d1.n} kishidan)`, "green", "flame")}${tile(p(r.d7), `7-kun qaytish (${r.d7.n} kishidan)`, "violet", "flame")}
    ${tile(p(r.w1), "Birinchi haftada qaytgan", "sky", "check")}${tile(`${r.dau} / ${r.wau}`, "Bugun / 7 kunda faol", "orange", "users")}</div>
    <div class="chart-card glass"><h3>Yangi foydalanuvchilar (14 kun)</h3><span class="range">oʻrtacha ${r.ses} ta mashq / kishi</span>${barChart(r.fresh, r.freshDays.map(k => k.slice(8)))}</div>
    <p class="muted" style="font-size:13px">1-kun qaytish — birinchi kundan keyingi kuni ham mashq qilganlar ulushi; 7-kun — 7-kuni. Qiymatlar 30 kunlik anonim faollik qatoridan hisoblanadi.</p></section>`;
}
function viewAdmin() {
  const head = `<div><a class="back" href="#profile">${ICON.back}Profil</a></div>
  <div class="lesson-head"><div class="tags"><span class="tag violet-t">${ICON.lock}Faqat admin</span></div><h1>Umumiy analitika</h1>
    <p class="sub">Barcha foydalanuvchilarning anonim koʻnikma koʻrsatkichlari. Ism, pochta va yozilgan matnlar bu yerga kelmaydi.</p></div>`;
  if (!USER || !db) return head + `<div class="glass empty"><b>Hisobga kiring</b></div>`;
  if (!ADMIN) {
    const why = ADMIN_ERR === "notfound" ? `Firestore'da <code>admins</code> toʻplamida aynan shu ID bilan hujjat topilmadi. Hujjat ID'si quyidagi UID bilan harfma-harf mos boʻlishi kerak (boʻsh joysiz).`
      : ADMIN_ERR === "permission-denied" ? "Firestore qoidalari admin tekshiruviga ruxsat bermadi: konsolda yangi qoidalar joylanganini (Publish) tekshiring."
      : ADMIN_ERR ? `Admin tekshiruvida xato: ${esc(ADMIN_ERR)}. Internetni tekshirib, sahifani yangilang.` : "Admin tekshiruvi hali tugamadi. Bir necha soniyadan keyin sahifani yangilang.";
    return head + `<div class="glass pad"><b>Bu sahifa faqat admin uchun</b><p class="muted" style="margin-top:6px">${why}</p>
      <p style="margin-top:10px"><small class="muted">Sizning UID'ingiz:</small><br><code style="word-break:break-all">${esc(USER.uid)}</code></p>
      <button class="btn btn-soft btn-block" data-act="copy-uid" style="margin-top:8px">${ICON.copy}UID'ni nusxalash</button></div>`;
  }
  if (!ADMIN_DATA) { adminLoad(); return head + `<div class="glass empty"><b>Yuklanmoqda…</b></div>`; }
  if (ADMIN_DATA.err) return head + `<div class="notice"><div>${esc(ADMIN_DATA.err)}</div></div><button class="btn btn-ghost btn-block" data-act="admin-reload">Qayta urinish</button>`;
  return head + errsHtml() + adminHtml(adminAgg(ADMIN_DATA.docs), ADMIN_DATA.at);
}
function adminHtml(a, at) {
  if (!a.total) return `<div class="glass empty"><b>Hali maʼlumot yoʻq</b><p class="muted">Foydalanuvchilar hisobga kirib mashq qilganda statistikalar shu yerda paydo boʻladi.</p></div>`;
  const tile = (n, l, c) => `<div class="stat glass"><span class="ico ${c}-t">${ICON.star}</span><span><b>${n}</b><span>${l}</span></span></div>`;
  const weakest = SKILLS.slice().sort((x, y) => a.sk[y.id].weak - a.sk[x.id].weak)[0];
  const accOf = s => a.sk[s.id].n ? pct(a.sk[s.id].o, a.sk[s.id].n) : null;
  const lowAcc = SKILLS.filter(s => accOf(s) !== null).sort((x, y) => accOf(x) - accOf(y))[0];
  const maxN = Math.max(1, ...SKILLS.map(s => a.sk[s.id].n));
  const bar = (v, mx, c) => `<span class="sk-track"><i style="width:${Math.round(v / Math.max(1, mx) * 100)}%;background:var(--${c})"></i></span>`;
  const bMax = Math.max(1, ...a.balB);
  return `${retentionHtml(a.ret)}<div class="stat-grid">${tile(a.total, "Jami foydalanuvchi", "violet")}${tile(a.active, "14 kunda faol", "green")}${tile(a.actDays, "Oʻrtacha faol kun (14 dan)", "orange")}${tile(a.bal + "%", "Oʻrtacha muvozanat", "sky")}</div>
  ${a.active ? `<div class="tip glass">${ICON.bulb}<div><b>Xulosa</b>Faol foydalanuvchilarning ${pct(a.sk[weakest.id].weak, a.active)}% ida eng zaif koʻnikma <b>${weakest.tr} (${weakest.uz})</b> boʻlib chiqdi.${lowAcc ? ` Eng past aniqlik: ${lowAcc.tr} — ${accOf(lowAcc)}%.` : ""} Shu koʻnikma uchun mashqlarni koʻpaytirish va bosh sahifada koʻproq taklif qilish foydali.</div></div>` : ""}
  <section class="section"><div class="section-head"><h2>Koʻnikmalar · 14 kun</h2><span class="tag sky-t">${a.active} ta faol</span></div>
    <div class="glass pad"><div class="sk-bars">${SKILLS.map(s => { const x = a.sk[s.id], ac = accOf(s); return `<div class="sk-line"><span class="ico ${s.c}-t">${ICON[s.ico]}</span>
      <span class="sk-name"><b>${s.tr}</b><small>${x.users} kishi</small></span>${bar(x.n, maxN, s.c)}
      <span class="sk-val">${x.n}<small>${ac === null ? "—" : ac + "%"}</small></span></div>`; }).join("")}</div>
    <p class="muted" style="font-size:13px;margin-top:10px">Chiziq — mashqlar soni, raqam ostida — oʻrtacha aniqlik. Sarflangan vaqt: ${SKILLS.map(s => `${s.tr} ${a.sk[s.id].min} daq`).join(" · ")}.</p></div></section>
  <section class="section"><div class="section-head"><h2>Eng zaif koʻnikma</h2><span class="tag pink-t">foydalanuvchilar ulushi</span></div>
    <div class="glass pad"><div class="sk-bars">${SKILLS.map(s => `<div class="sk-line"><span class="ico ${s.c}-t">${ICON[s.ico]}</span><span class="sk-name"><b>${s.tr}</b><small>${s.uz}</small></span>${bar(a.sk[s.id].weak, a.active, s.c)}<span class="sk-val">${pct(a.sk[s.id].weak, a.active || 1)}%<small>${a.sk[s.id].weak} kishi</small></span></div>`).join("")}</div></div></section>
  <section class="section"><div class="section-head"><h2>Muvozanat taqsimoti</h2></div>
    <div class="glass pad"><div class="sk-bars">${["0–19%", "20–39%", "40–59%", "60–79%", "80–100%"].map((l, i) => `<div class="sk-line"><span></span><span class="sk-name"><b>${l}</b></span>${bar(a.balB[i], bMax, i >= 4 ? "green" : i >= 2 ? "sky" : "pink")}<span class="sk-val">${a.balB[i]}<small>kishi</small></span></div>`).join("")}</div></div></section>
  <section class="section"><div class="section-head"><h2>Koʻnikma boʻyicha daraja</h2><span class="tag teal-t">jami ${a.total}</span></div>
    <div class="table-wrap glass" tabindex="0" role="region" aria-label="Jadval"><table class="gtable"><thead><tr><th scope="col">Koʻnikma</th><th>—</th>${LVS.map(l => `<th scope="col">${l}</th>`).join("")}</tr></thead>
    <tbody>${SKILLS.map(s => `<tr><td><b>${s.tr}</b></td><td>${a.lvl[s.id][""]}</td>${LVS.map(l => `<td>${a.lvl[s.id][l]}</td>`).join("")}</tr>`).join("")}</tbody></table></div></section>
  <section class="section"><div class="section-head"><h2>Daraja testlari · oʻrtacha foiz</h2></div>
    <div class="table-wrap glass" tabindex="0" role="region" aria-label="Jadval"><table class="gtable"><thead><tr><th scope="col">Test</th>${SKILLS.map(s => `<th scope="col">${s.tr}</th>`).join("")}</tr></thead>
    <tbody>${LVS.map(l => `<tr><td><b>${l}</b></td>${SKILLS.map(s => { const x = a.tests[l][s.id]; return `<td>${x ? `${x.avg}%<br><small class="muted">${x.n} kishi</small>` : "—"}</td>`; }).join("")}</tr>`).join("")}</tbody></table></div></section>
  <section class="section"><div class="section-head"><h2>Kursdagi joriy daraja</h2></div>
    <div class="glass pad"><div class="sk-bars">${LVS.map(l => `<div class="sk-line"><span></span><span class="sk-name"><b>${l}</b></span>${bar(a.course[l], a.total, "violet")}<span class="sk-val">${a.course[l]}<small>kishi</small></span></div>`).join("")}</div></div></section>
  <p class="muted" style="font-size:13px">Yangilangan: ${at ? at.toLocaleString("uz") : "—"}. Har bir foydalanuvchi maʼlumoti taxminan har 3 soatda yangilanadi (u ilovani ochganda).</p>
  <button class="btn btn-ghost btn-block" data-act="admin-reload">Yangilash</button>`;
}
/* ---------- Pronunciation practice ----------
   Uses the browser's own speech recognition (Web Speech API, tr-TR). Nothing is recorded or stored by the site:
   the browser returns text, and we compare it letter by letter with the target word. */
/* In the Android app the WebView has no Web Speech API: the phone's own recognizer (plugin SpeechRecognition,
   @capacitor-community/speech-recognition) behind the same small interface (lang, start/stop, onresult/onerror/onend). */
const NSR_ERR = m => /speech input|no match/i.test(m) ? "no-speech" : /network|server/i.test(m) ? "network" : /permission/i.test(m) ? "not-allowed" : /audio/i.test(m) ? "audio-capture" : "aborted";
class NativeSR {
  constructor() { this.lang = "tr-TR"; this.maxAlternatives = 5; this.onresult = this.onerror = this.onend = null; this._p = nativePlugin("SpeechRecognition"); }
  start() {
    const p = this._p, fire = (f, ev) => { try { if (f) f(ev); } catch (e) {} };
    const end = () => { if (this._end) return; this._end = true; fire(this.onend, {}); };
    (async () => {
      try {
        const av = await p.available().catch(() => ({ available: true }));
        if (av && av.available === false) { toast("Telefonda nutqni tanish xizmati yoʻq (Google ilovasini yangilang)"); return end(); }
        let perm = await p.checkPermissions().catch(() => ({}));
        if (perm.speechRecognition !== "granted") perm = await p.requestPermissions().catch(() => ({}));
        if (perm.speechRecognition !== "granted") { fire(this.onerror, { error: "not-allowed" }); return end(); }
        if (this._stop) return end();
        const r = await p.start({ language: this.lang, maxResults: this.maxAlternatives, partialResults: false, popup: false });
        const m = (r && r.matches) || [];
        if (m.length) { const res = m.map(t => ({ transcript: t })); res.isFinal = true; fire(this.onresult, { results: [res] }); }
        else fire(this.onerror, { error: "no-speech" });
      } catch (e) { fire(this.onerror, { error: NSR_ERR(String((e && e.message) || e)) }); }
      end();
    })();
  }
  stop() { this._stop = true; try { const r = this._p.stop(); if (r && r.catch) r.catch(() => {}); } catch (e) {} }
  abort() { this.stop(); }
}
const SR = IS_NATIVE && nativePlugin("SpeechRecognition") ? NativeSR : window.SpeechRecognition || window.webkitSpeechRecognition;
const canListen = () => !!SR;
let REC = null;
const sayable = w => !/[…\/()=;]/.test(w.tr) && w.tr.length <= 26 && /[a-zçğıöşü]/i.test(w.tr);
function sayItems(u, f = sayable, n = 8) {
  let pool;
  if (u === "pron") {
    // Words the learner has already met; for a fresh start, the first lessons
    pool = ALL.filter(w => srs(w) && f(w));
    if (pool.length < n) pool = ALL.filter(f).slice(0, 80);
  } else pool = pickPool(u).filter(f);
  return shuffle(pool).slice(0, n);
}
// Recognisers often write numbers as digits: turn them back into Turkish words
const TR_ONES = ["", "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz"];
const TR_TENS = ["", "on", "yirmi", "otuz", "kırk", "elli", "altmış", "yetmiş", "seksen", "doksan"];
function trNum(n) {
  if (n === 0) return "sıfır";
  const part = (k, word) => k ? (k > 1 ? trNum(k) + " " : "") + word : "";
  const out = [part(Math.floor(n / 1000) % 1000, "bin"), part(Math.floor(n / 100) % 10, "yüz"), TR_TENS[Math.floor(n / 10) % 10], TR_ONES[n % 10]];
  return out.filter(Boolean).join(" ");
}
// Lower-case letters only, with a map back to the original characters (to colour them)
function sayNorm(s) {
  let out = "", map = [];
  const add = (c, i) => {
    if (/[a-zçğıöşü]/.test(c)) { out += c; map.push(i); }
    else if (/[\s\-]/.test(c) && out && out[out.length - 1] !== " ") { out += " "; map.push(-1); }
  };
  for (let i = 0; i < s.length; i++) {
    // Digits are said as words ("112" → "yüz on iki"), mapped back to the first digit
    if (/\d/.test(s[i])) {
      let j = i; while (j < s.length && /\d/.test(s[j])) j++;
      for (const c of " " + trNum(Math.min(+s.slice(i, j), 999999)) + " ") add(c, c === " " ? -1 : i);
      i = j - 1; continue;
    }
    add(s[i].toLocaleLowerCase("tr").replace(/[âáà]/, "a").replace(/[îí]/, "i").replace(/[ûú]/, "u"), i);
  }
  if (out.endsWith(" ")) { out = out.slice(0, -1); map.pop(); }
  return { out, map };
}
const heardNorm = s => sayNorm(s).out;
// Edit distance plus, for each target letter, whether it was matched
function sayDiff(a, b) {
  const m = a.length, n = b.length, d = [];
  for (let i = 0; i <= m; i++) { d.push(new Array(n + 1).fill(0)); d[i][0] = i; }
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  const ok = new Array(m).fill(false);
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1] && d[i][j] === d[i - 1][j - 1]) { ok[i - 1] = true; i--; j--; }
    else if (d[i][j] === d[i - 1][j - 1] + 1) { i--; j--; }
    else if (d[i][j] === d[i - 1][j] + 1) i--;
    else j--;
  }
  return { dist: d[m][n], ok, score: Math.max(0, 1 - d[m][n] / Math.max(m, n, 1)) };
}
function sayMarked(target, ok) {
  const { map } = sayNorm(target), bad = new Set();
  map.forEach((idx, k) => { if (idx >= 0 && !ok[k]) bad.add(idx); });
  return [...target].map((c, i) => bad.has(i) ? `<span class="miss">${esc(c)}</span>` : esc(c)).join("");
}
function renderSay(w) {
  SES.sk = ["s"]; SES.tries = 0; SES.best = null;
  stage.innerHTML = `<div class="q-card"><div class="q-label">${w.line ? "Tinglang va gapni ovoz chiqarib takrorlang" : "Ovoz chiqarib ayting"}</div>
    <div class="q-row"><div class="q-word say-target${w.line ? " q-line" : ""}" id="say-target" lang="tr">${esc(w.tr)}</div>
      <button class="say" data-act="say" data-t="${esc(w.tr)}" aria-label="Tinglash">${ICON.speak}</button></div>
    ${w.uz ? `<div class="sub">${esc(w.uz)}</div>` : ""}</div>
    <div class="mic-wrap">
      <button class="mic-btn" id="mic-btn" data-act="mic" aria-label="Mikrofon: gapirishni boshlash">${ICON.mic}</button>
      <div class="mic-hint" id="mic-hint">Avval tinglang, keyin mikrofonni bosib ayting</div>
      <div class="heard" id="heard" lang="tr" aria-live="polite"></div>
    </div>
    <div class="feedback" id="fb" aria-live="polite"></div>`;
  foot.innerHTML = `<button class="btn btn-ghost btn-block" data-act="say-skip">Hozir gapira olmayman</button>`;
  speak(w.tr);
}
function micStop(abort) {
  if (!REC) return;
  const r = REC; REC = null;
  try { abort ? r.abort() : r.stop(); } catch (e) {}
}
function micUi(on, hint) {
  const b = $("mic-btn"), h = $("mic-hint");
  if (b) { b.classList.toggle("on", on); b.setAttribute("aria-label", on ? "Mikrofon: toʻxtatish" : "Mikrofon: gapirishni boshlash"); }
  if (h && hint) h.textContent = hint;
}
function micToggle() {
  if (!SES || SES.answered) return;
  if (REC) { micStop(false); return; }
  ttsCancel();
  const w = SES.items[SES.i];
  const r = new SR();
  r.lang = "tr-TR"; r.interimResults = true; r.maxAlternatives = 5; r.continuous = false;
  let finalAlts = null;
  r.onresult = ev => {
    const res = ev.results[ev.results.length - 1];
    const h = $("heard"); if (h) h.textContent = res[0].transcript;
    if (res.isFinal) finalAlts = [...res].map(a => a.transcript);
  };
  r.onerror = ev => {
    const msg = { "not-allowed": "Mikrofonga ruxsat berilmagan. Brauzer sozlamalarida ruxsat bering.", "service-not-allowed": "Mikrofonga ruxsat berilmagan. Brauzer sozlamalarida ruxsat bering.",
      "no-speech": "Ovoz eshitilmadi. Mikrofonni bosib, soʻzni aniq ayting.", "audio-capture": "Mikrofon topilmadi.", "network": "Nutqni tanish uchun internet kerak." }[ev.error];
    if (msg) { const fb = $("fb"); if (fb) { fb.className = "feedback no"; fb.textContent = msg; } }
  };
  r.onend = () => {
    if (REC === r) REC = null;
    micUi(false, "Yana aytish uchun mikrofonni bosing");
    if (finalAlts && SES && !SES.answered && SES.items[SES.i] === w) sayCheck(w, finalAlts);
  };
  try { r.start(); REC = r; micUi(true, "Tinglayapman… soʻzni ayting"); const h = $("heard"); if (h) h.textContent = ""; }
  catch (e) { toast("Mikrofonni ishga tushirib boʻlmadi"); }
}
function sayCheck(w, alts) {
  let best = null;
  if (w.oral) alts.forEach(a => { const r = oralScore(w.tr, a); r.text = a; if (!best || r.score > best.score) best = r; });
  else { const target = sayNorm(w.tr).out; alts.forEach(a => { const r = sayDiff(target, heardNorm(a)); r.text = a; if (!best || r.score > best.score) best = r; }); }
  if (!best) return;
  SES.tries++;
  const p = Math.round(best.score * 100), fb = $("fb"), need = w.oral ? 0.6 : w.tr.includes(" ") ? 0.8 : 0.85;
  const ok = best.score >= need, last = ok || SES.tries >= 3;
  $("heard").textContent = best.text;
  if (!w.oral) $("say-target").innerHTML = sayMarked(w.tr, best.ok);
  else if (last) { const smp = $("oral-sample"); smp.hidden = false; smp.innerHTML = `<small class="muted">Namuna javob:</small><br><span lang="tr">${oralMarked(w.tr, best)}</span>`; }
  const hits = w.oral ? `${best.hit.filter(Boolean).length}/${best.kw.length} kalit soʻz` : `${p}%`;
  if (ok) {
    fb.className = "feedback ok";
    fb.innerHTML = `${w.oral ? "Aferin! Javobingiz toʻgʻri." : p === 100 ? "Mükemmel! Juda toʻgʻri aytdingiz." : "Aferin! Yaxshi aytdingiz."} <span class="tag green-t">${hits}</span>`;
    sayFinish(true);
  } else if (!last) {
    fb.className = "feedback no";
    fb.innerHTML = w.oral
      ? `Javob toʻliq emas <span class="tag pink-t">${hits}</span><div class="sub" style="margin-top:4px">Savolni yana tinglang, matnga qarang va toʻliq gap bilan javob bering (${3 - SES.tries} ta urinish qoldi).</div>`
      : `${p >= 60 ? "Yaqin!" : "Unchalik oʻxshamadi."} <span class="tag pink-t">${p}%</span><div class="sub" style="margin-top:4px">Qizil harflarga eʼtibor bering, yana tinglab qayta ayting (${3 - SES.tries} ta urinish qoldi).</div>`;
    CatLife.mood(sCat(), "sad", 1200);
  } else {
    fb.className = "feedback no";
    fb.innerHTML = `Bu safar chiqmadi <span class="tag pink-t">${hits}</span><div class="sub" style="margin-top:4px">${w.oral ? "Namuna javobni ovoz chiqarib oʻqib chiqing: yashil soʻzlarni aytdingiz, qizillari yetishmadi." : "Keyingi safar albatta chiqadi. Qizil harflarni alohida mashq qiling."}</div>`;
    sayFinish(false);
  }
}
function sayFinish(ok, skipped) {
  if (!SES || SES.answered) return;
  micStop(true);
  SES.answered = true;
  tick();
  if (!skipped) {
    S.pron[1]++; dayRec().rev++;
    skillLog(SES.sk || "s", ok);
    if (ok) lsmHit(SES.items[SES.i], SES.m); else lsmMiss(SES.items[SES.i], SES.m);
    if (ok) { S.pron[0]++; SES.right++; save(); sMood("happy"); }
    else { save(); sMood("sad"); }
  }
  const w = SES.items[SES.i];
  foot.innerHTML = `<button class="btn btn-ghost" data-act="say" data-t="${esc(w.tr)}">${ICON.speak}${w.oral ? "Namunani tinglash" : "Tinglash"}</button><button class="btn btn-grad" data-act="next">Keyingi</button>`;
  roleAfter(w);
}
/* ---------- Rule exercises ---------- */
const blankHtml = q => esc(q).replace("___", '<span class="blank">&nbsp;</span>');
function renderGx(it) {
  SES.sk = it.ex.t === "c" ? ["r"] : ["w"];
  const ex = it.ex, tp = gxTopic(it.code);
  const head = `<div class="tags"><span class="tag sky-t">${esc(it.code)}</span><span class="tag violet-t">${esc(tp ? tp.uz : "")}</span></div>`;
  if (ex.t === "c") {
    stage.innerHTML = `<div class="q-card">${head}<div class="q-label">Toʻgʻri variantni tanlang</div>
      <div class="q-sent">${blankHtml(ex.q)}</div></div>
      <div class="options">${shuffle(ex.o.map((o, i) => [o, i])).map(([o, i], k) => `<button class="opt" lang="tr" data-act="gx-ans" data-o="${i}"><span class="k">${"ABCD"[k]}</span>${esc(o)}</button>`).join("")}</div>
      <div class="feedback" id="fb" aria-live="polite"></div>`;
    foot.innerHTML = `<button class="btn btn-grad btn-block" data-act="next" disabled>Keyingi</button>`;
  } else if (ex.t === "t") {
    stage.innerHTML = `<div class="q-card">${head}<div class="q-label">Boʻsh joyni toʻldiring</div>
      <div class="q-sent" lang="tr">${blankHtml(ex.q)}</div>
      ${ex.uz ? `<div class="sub">${esc(ex.uz)}</div>` : ""}</div>
      ${bankBox(ex.ans[0])}
      <div class="feedback" id="fb" aria-live="polite"></div>`;
    foot.innerHTML = `<button class="btn btn-ghost" data-act="gx-skip">Bilmayman</button><button class="btn btn-grad" data-act="gx-check">Tekshirish</button>`;
    $("type-form").addEventListener("submit", e => { e.preventDefault(); if (SES.answered) nextStep(); else gxCheckType(); });
  } else {
    const toks = ex.s.split(" ");
    let order = shuffle(toks.map((t, i) => i));
    if (order.every((v, i) => v === i)) order = order.reverse();
    SES.ord = [];
    stage.innerHTML = `<div class="q-card">${head}<div class="q-label">Soʻzlardan gap tuzing</div>
      <div class="q-sent q-uz">${esc(ex.uz || "")}</div></div>
      <div class="ord-ans" id="ord-ans" role="group" aria-label="Sizning gapingiz"></div>
      <div class="ord-pool" id="ord-pool">${order.map(i => `<button class="tok" lang="tr" data-act="ord-tok" data-i="${i}">${esc(toks[i])}</button>`).join("")}</div>
      <div class="feedback" id="fb" aria-live="polite"></div>`;
    foot.innerHTML = `<button class="btn btn-ghost" data-act="gx-skip">Bilmayman</button><button class="btn btn-grad" data-act="gx-order" disabled>Tekshirish</button>`;
  }
}
function gxExplain(ex, ok, right) {
  return `${ok ? "Doğru! Toʻgʻri." : `Toʻgʻri javob: <b lang="tr">${esc(right)}</b>`}${ex.uz && ex.t !== "t" && ex.t !== "o" ? `<div class="sub" style="margin-top:4px">${esc(ex.uz)}</div>` : ""}${ex.e ? `<div class="sub" style="margin-top:4px">${esc(ex.e)}</div>` : ""}`;
}
const gxNorm = s => fold(s.replace(/[’ʼ`]/g, "'"));
const gxPlain = s => plain(s.replace(/[’ʼ`']/g, ""));
function gxFinish(ok, right, near) {
  SES.answered = true;
  const it = SES.items[SES.i], fb = $("fb");
  if (ok) gxGood(it); else gxBad(it);
  fb.className = "feedback " + (ok ? "ok" : "no");
  fb.innerHTML = near ? `Deyarli! Toʻgʻri yozilishi: <b lang="tr">${esc(right)}</b>${it.ex.e ? `<div class="sub" style="margin-top:4px">${esc(it.ex.e)}</div>` : ""}` : gxExplain(it.ex, ok, right);
  if (it.ex.t !== "c") speak(right);
  foot.innerHTML = `<button class="btn btn-grad btn-block" data-act="next">Keyingi</button>`;
}
function gxCheckType(skip) {
  if (SES.answered) return;
  const ex = SES.items[SES.i].ex, inp = $("type-input"), v = inp.value;
  if (!skip && !v.trim()) { inp.focus(); return; }
  const exact = !skip && ex.ans.some(a => gxNorm(a) === gxNorm(v));
  const near = !skip && !exact && ex.ans.some(a => gxPlain(a) === gxPlain(v));
  inp.classList.add(exact || near ? "right" : "wrong");
  if (!skip) morLog(ex.ans[0], v, exact || near);
  gxFinish(exact || near, ex.ans[0], near);
}
function gxCheckOrder(skip) {
  if (SES.answered) return;
  const ex = SES.items[SES.i].ex, toks = ex.s.split(" ");
  const said = SES.ord.map(i => toks[i]).join(" ");
  const ok = !skip && said === ex.s;
  $("ord-ans").classList.add(ok ? "right" : "wrong");
  document.querySelectorAll("#ord-pool .tok, #ord-ans .tok").forEach(t => t.disabled = true);
  gxFinish(ok, ex.s);
}
function gxGood(it) {
  tick(); SES.right++;
  const arr = S.gx[it.code] || (S.gx[it.code] = []);
  const was = gxDone(it.code);
  arr[it.i] = true;
  const k = it.code + "#" + it.i;
  if (S.gxm[k]) delete S.gxm[k];
  dayRec().rev++; S.acc[0]++; S.acc[1]++;
  skillLog(SES.sk, true);
  save();
  if (!was && gxDone(it.code)) SES.topicDone = it.code;
  sMood("happy");
}
function gxBad(it) {
  tick();
  S.gxm[it.code + "#" + it.i] = 1;
  dayRec().rev++; S.acc[1]++;
  skillLog(SES.sk, false);
  save();
  sMood("sad");
  const key = it.code + "#" + it.i;
  if (!SES.re.has(key) && SES.items.length < 40) { SES.re.add(key); SES.items.push(it); }
}
/* ---------- Sound effects (Android 6-bosqich, the site too) ----------
   Short tones made on the spot with Web Audio — our own, no sound files: a rising two-note chime for a right answer,
   a soft low bump for a wrong one, a brighter run for an answer streak (combo), a short fanfare when a practice
   ends and a longer one for a celebration. Profil → Sozlamalar → «Ovoz effektlari» (S.sfx, on by default). */
let ACTX = null;
function sfxCtx() {
  if (!ACTX) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; try { ACTX = new C(); } catch (e) { return null; } }
  if (ACTX.state === "suspended") try { const r = ACTX.resume(); if (r && r.catch) r.catch(() => {}); } catch (e) {}
  return ACTX;
}
// [start s, frequency Hz, length s, wave, volume, glide-to Hz]
const SFX = {
  ok: [[0, 784, 0.11, "sine", 0.16], [0.085, 1175, 0.24, "sine", 0.15]],
  no: [[0, 233, 0.16, "triangle", 0.17, 175], [0.13, 175, 0.24, "triangle", 0.13, 131]],
  combo: [[0, 1047, 0.09, "sine", 0.13], [0.065, 1319, 0.09, "sine", 0.13], [0.13, 1568, 0.26, "sine", 0.14]],
  done: [[0, 523, 0.14, "triangle", 0.15], [0.11, 659, 0.14, "triangle", 0.15], [0.22, 784, 0.14, "triangle", 0.15], [0.34, 1047, 0.5, "sine", 0.15], [0.34, 784, 0.5, "sine", 0.08]],
  fanfare: [[0, 392, 0.13, "triangle", 0.14], [0.12, 523, 0.13, "triangle", 0.14], [0.24, 659, 0.13, "triangle", 0.14], [0.36, 784, 0.2, "triangle", 0.15], [0.56, 659, 0.12, "triangle", 0.12], [0.68, 1047, 0.7, "sine", 0.16], [0.68, 784, 0.7, "sine", 0.09], [0.68, 523, 0.7, "sine", 0.07]]
};
function beep(name) {
  if (S.sfx === false || !SFX[name]) return;
  const c = sfxCtx(); if (!c) return;
  try {
    const t0 = c.currentTime + 0.01;
    for (const [dt, f, d, type, vol, f2] of SFX[name]) {
      const o = c.createOscillator(), g = c.createGain(), t = t0 + dt;
      o.type = type; o.frequency.setValueAtTime(f, t);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d + 0.03);
    }
  } catch (e) {}
}
// Mobile browsers start sound only after a tap: prepare it on the first one
document.addEventListener("pointerdown", () => { if (S.sfx !== false) sfxCtx(); }, { capture: true, once: true });
const sCat = () => $("s-cat").querySelector(".cat");
// The verdict of the current step: Pamuk reacts and the "next" button takes the colour of the answer
// The app: a light tap for a right answer, the "error" pattern for a wrong one (Profil → Sozlamalar → Tebranish, S.hap)
function hapticDone() {
  if (S.hap === false) return;
  const h = nativePlugin("Haptics"); if (!h) return;
  try { const r = h.notification({ type: "SUCCESS" }); if (r && r.catch) r.catch(() => {}); } catch (e) {}
}
function haptic(ok) {
  if (S.hap === false) return;
  const h = nativePlugin("Haptics"); if (!h) return;
  try { const r = ok ? h.impact({ style: "LIGHT" }) : h.notification({ type: "ERROR" }); if (r && r.catch) r.catch(() => {}); } catch (e) {}
}
/* Pamuk talks during a practice (6-bosqich, 2-qism): a word at the start, a hint after two misses in a row,
   a cheer halfway and before the last question — short Turkish phrases with the Uzbek meaning. Not on combo steps
   (the combo badge has the spot then); one bubble at a time, gone after a few seconds or a tap. */
const PSAY = {
  start: ["Hadi başlayalım! Qani, boshladik!", "Hazırım! Siz-chi?", "Bugün de harika olacak! Bugun ham zoʻr boʻladi", "Yavaş yavaş — shoshilmasdan, diqqat bilan"],
  help: ["Sorun yok! Xato — oʻrganishning bir qismi", "Shoshilmang: savolni yana bir bor oʻqing", "Tinglash tugmasi yordam beradi — bosib koʻring", "Ben de yanılırım! Men ham adashaman — davom etamiz"],
  half: ["Yarısı bitti! Yarmi tugadi", "Çok iyi gidiyorsun! Zoʻr ketyapsiz"],
  last: ["Son soru! Oxirgi savol", "Bir tane kaldı! Bittagina qoldi"]
};
let PSAY_T = 0;
function sSay(kind) {
  const list = PSAY[kind], top = sessionEl.querySelector(".session-top");
  if (!list || !top || !SES) return;
  let b = $("s-say");
  if (!b) { b = document.createElement("div"); b.id = "s-say"; b.className = "s-say"; b.setAttribute("role", "status"); b.dataset.act = "s-say-x"; top.appendChild(b); }
  let t = list[(SES.sayN = (SES.sayN || 0) + 1) % list.length];
  // The listening hint only where the question has a listen button
  if (/^Tinglash/.test(t) && !stage.querySelector("button.say, [data-act='say'], [data-act='ls-play']")) t = list[(SES.sayN = SES.sayN + 1) % list.length];
  b.textContent = t;
  b.dataset.k = kind;
  b.classList.remove("show"); void b.offsetWidth; b.classList.add("show");
  clearTimeout(PSAY_T); PSAY_T = setTimeout(() => b.classList.remove("show"), 3200);
}
/* Pamuk greets at the start of a practice: rises from behind the button row, waves, says a line and goes back down.
   It never takes a tap (pointer-events: none) and the first touch sends it away. No motion wanted — the plain bubble. */
let PEEK_T = 0;
function sPeek() {
  if (!SES) return;
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return sSay("start");
  sPeekOff(true);
  const list = PSAY.start, el = document.createElement("div");
  el.id = "s-peek"; el.className = "s-peek"; el.setAttribute("role", "status");
  el.innerHTML = `<div class="peek-cat">${catSVG({ pose: "wave", look: catLook() })}</div><div class="peek-bubble">${esc(list[(SES.sayN = (SES.sayN || 0) + 1) % list.length])}</div>`;
  // It stands on the button row: the box ends at the row's top edge and clips what is below
  const inner = sessionEl.querySelector(".session-inner"), foot = $("s-foot");
  el.style.bottom = (foot ? foot.offsetHeight : 0) + "px";
  inner.appendChild(el);
  CatLife.scan();
  PEEK_T = setTimeout(sPeekOff, 3000);
}
function sPeekOff(now) {
  const el = $("s-peek"); if (!el) return;
  clearTimeout(PEEK_T);
  if (now === true) return el.remove();
  if (el.classList.contains("out")) return;
  el.classList.add("out"); setTimeout(() => el.remove(), 420);
}
sessionEl.addEventListener("pointerdown", () => sPeekOff(), { passive: true });
/* Leaving an unfinished practice: Pamuk asks to stay (the XP comes only at the end) */
function quitAsk() {
  if (!SES || SES.done || !(SES.i > 0 || SES.answered)) return closeSession();
  const left = SES.items.length - SES.i - (SES.answered ? 1 : 0);
  openSheet(`<div class="quit-sheet"><div class="quit-cat">${catSVG({ pose: "sit", cls: "mascot", look: catLook() })}</div>
    <h2>Ketmang, ozgina qoldi!</h2>
    <p class="muted">${left > 0 ? `Yana ${left} ta savol qoldi. ` : ""}Hozir chiqsangiz, bu mashq uchun XP berilmaydi.</p>
    <button class="btn btn-grad btn-block" data-act="quit-stay">Davom etaman</button>
    <button class="btn btn-ghost btn-block" data-act="quit-go">Baribir chiqish</button></div>`);
  setTimeout(() => CatLife.mood($("sheet").querySelector(".quit-cat .cat"), "plead", 0), 150);
}
/* Answer streak inside one practice (combo): 3, 5, 10… right answers in a row get a badge, a brighter sound and a glowing bar */
const COMBO_AT = n => n === 3 || n === 5 || (n >= 10 && n % 5 === 0);
function comboShow(n) {
  const top = sessionEl.querySelector(".session-top"); if (!top) return;
  let b = $("s-combo");
  if (!b) { b = document.createElement("div"); b.id = "s-combo"; b.className = "combo"; b.setAttribute("role", "status"); top.appendChild(b); }
  b.innerHTML = `${ICON.flame}<b>${n}</b> ketma-ket!`;
  b.classList.remove("show"); void b.offsetWidth; b.classList.add("show");
  clearTimeout(COMBO_T); COMBO_T = setTimeout(() => b.classList.remove("show"), 1800);
}
let COMBO_T = 0;
function sMood(m) {
  const ok = m === "happy";
  haptic(ok);
  sessionEl.dataset.r = ok ? "ok" : "no";
  if (SES) {
    SES.combo = ok ? (SES.combo || 0) + 1 : 0;
    SES.best = Math.max(SES.best || 0, SES.combo);
    if (SES.combo >= 3) sessionEl.dataset.combo = "hot"; else delete sessionEl.dataset.combo;
  }
  const hot = ok && SES && COMBO_AT(SES.combo);
  beep(hot ? "combo" : ok ? "ok" : "no");
  if (hot) { comboShow(SES.combo); const sb = $("s-say"); if (sb) sb.classList.remove("show"); }
  else if (SES) {
    SES.miss = ok ? 0 : (SES.miss || 0) + 1;
    const n = SES.items.length;
    if (SES.miss === 2) sSay("help");
    else if (ok && n >= 6 && SES.i + 1 === Math.ceil(n / 2) && !SES.saidHalf) { SES.saidHalf = 1; sSay("half"); }
  }
  // The question card answers too: a little hop for right, a shake for wrong (choice buttons have their own)
  const card = stage.querySelector(".q-card");
  if (card) { card.classList.remove("hop", "shake"); void card.offsetWidth; card.classList.add(ok ? "hop" : "shake"); }
  sPeekOff();
  // A streak milestone: starry eyes
  CatLife.mood(sCat(), hot ? "wow" : m, hot ? 1700 : ok ? 1000 : 1600);
}
function good() { tick(); const w = SES.items[SES.i]; SES.right++; skillLog(SES.sk, true); if (!w.mor) { grade(w, true); lsmHit(w, SES.m); } sMood("happy"); }
function bad() {
  tick();
  const w = SES.items[SES.i];
  if (!w.mor) grade(w, false);
  skillLog(SES.sk, false);
  if (!w.mor) lsmMiss(w, SES.m);
  sMood("sad");
  // Show a missed word once more at the end of the session
  if (!SES.re.has(w.tr) && SES.items.length < 40) { SES.re.add(w.tr); SES.items.push(w); }
}
// Which reward a practice session earns
function sesKind(mode) {
  if (mode === "gx" || mode === "gxm" || mode === "morf") return "grammar";
  if (["listen", "dict", "lsent", "lmis", "mix-l"].includes(mode)) return "listening";
  if (["say", "sayline", "oral", "role", "smis", "mix-s"].includes(mode)) return "speaking";
  return "vocab";
}
function nextStep() { micStop(true); SES.i++; renderStep(); }
// The XP on the result screen counts up from 0 (at once when the system asks for less motion)
function countUp(el) {
  if (!el) return;
  const to = +el.dataset.count || 0, fmt = v => `+${v} XP`;
  if (!to || matchMedia("(prefers-reduced-motion: reduce)").matches) { el.textContent = fmt(to); return; }
  const t0 = performance.now(), dur = 900;
  el.textContent = fmt(0);
  const step = t => { const k = Math.max(0, Math.min(1, (t - t0) / dur)), v = Math.round(to * (1 - Math.pow(1 - k, 3))); el.textContent = fmt(v); if (k < 1 && el.isConnected) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
function renderResult() {
  const n = SES.items.length;
  $("s-bar").style.width = "100%";
  $("s-count").textContent = n + "/" + n;
  if (!SES.done) {
    SES.done = true;
    S.sessions++;
    if (SES.right === n && n >= 8) S.perfect++;
    if (SES.mode === "role" && SES.right >= n / 2) S.roles = (S.roles || 0) + 1;
    SES.shown = 0; tick();
    SES.award = xpAward(sesKind(SES.mode), { right: SES.right, n, key: SES.mode + "|" + SES.u, times: SES.times, half: SES.mode === "cards", sk: [...SES.skAll] });
    SES.xp = SES.award.xp;
    SES.secs = Math.round((Date.now() - (SES.t0 || Date.now())) / 1000);
    const rr = SES.right / n;
    beep(rr >= 0.4 ? "done" : "no");
    if (rr >= 0.7) hapticDone();
  }
  delete sessionEl.dataset.combo; { const cb = $("s-combo"); if (cb) cb.remove(); }
  const r = SES.right / n;
  const title = r === 1 ? "Mükemmel! Hammasi toʻgʻri" : r >= 0.7 ? "Harika! Juda yaxshi" : r >= 0.4 ? "İyi! Yaxshi boshlanish" : "Pes etme! Taslim boʻlmang";
  const fresh = ACH.filter(a => achDone(a) && !SES.had.includes(a.id));
  const mm = Math.floor((SES.secs || 0) / 60), ss = String((SES.secs || 0) % 60).padStart(2, "0");
  stage.innerHTML = `<div class="result stage${r === 1 ? " perfect" : ""}" style="flex:none;overflow:visible">
    ${r >= 0.8 ? `<div class="confetti res-confetti" aria-hidden="true">${Array.from({ length: 24 }, (_, i) => `<i class="c${i % 6}" style="left:${(i * 37 + 11) % 100}%;animation-delay:${(i % 8) * 0.07}s;animation-duration:${(1.8 + (i % 5) * 0.25).toFixed(2)}s"></i>`).join("")}</div>` : ""}
    <div>${mascot(r >= 0.7 ? "trophy" : "sit")}</div>
    <div class="score">${SES.right}/${n}</div>
    <h2>${esc(title)}</h2>
    <p>${r >= 0.7 ? "Pamuk sizdan faxrlanadi!" : "Pamuk aytadi: xatolar ham oʻrganishning bir qismi."}</p>
    <div class="res-meta"><span class="tag green-t">Aniqlik ${Math.round(r * 100)}%</span>${(SES.best || 0) >= 3 ? `<span class="tag orange-t">${ICON.flame}${SES.best} ketma-ket</span>` : ""}${SES.secs ? `<span class="tag sky-t">${mm}:${ss}</span>` : ""}</div>
    <div class="res-grid">
      <div class="res-xp"><b data-count="${SES.xp}">+${SES.xp} XP</b><span>${esc(XP_KIND[SES.award.kind])}</span></div>
      <div><b>${S.dayXp}<i>/${S.goal}</i></b><span>bugungi XP</span></div>
      <div><b>${streakNow()}</b><span>kun ketma-ket</span></div>
    </div>
    ${xpWhy(SES.award) ? `<p class="xp-why">${esc(xpWhy(SES.award))}</p>` : ""}
    ${(() => { const nx = recs().find(x => x.mode !== SES.mode && !(x.id === "due" && SES.mode === "review")); return nx ? `<button class="rec-row rec-next glass" data-act="rec" data-id="${nx.id}"><span class="ico ${nx.c}-t">${ICON[nx.ico] || ICON.star}</span><span class="rec-txt"><small>Keyingi qadam</small><b>${esc(nx.t)}</b></span>${ICON.chev}</button>` : ""; })()}
    ${dqMini()}
    <p class="muted">Takrorlash navbatida: ${dueWords().length} ta · Xatolar daftarida: ${mistakeWords().length} ta</p>
    ${SES.topicDone ? `<div class="tags" style="justify-content:center"><span class="tag green-t">${ICON.check}${esc(SES.topicDone)} mavzusi tugallandi</span></div>` : ""}
    ${fresh.length ? `<div class="tags" style="justify-content:center">${fresh.map(a => `<span class="tag violet-t">${ICON.star}Yangi yutuq: ${esc(a.t)}</span>`).join("")}</div>` : ""}
  </div>`;
  CatLife.scan();
  countUp(stage.querySelector("[data-count]"));
  setTimeout(() => CatLife.mood(stage.querySelector(".cat"), r >= 0.9 ? "wow" : r >= 0.7 ? "happy" : "sad", r >= 0.9 ? 2600 : 1500), 250);
  setTimeout(celebrateQueued, 900);
  foot.innerHTML = `<button class="btn btn-ghost" data-act="close-session">Yopish</button>${SES.mode === "gx" ? (() => { const nx = GX_CODES[GX_CODES.indexOf(SES.u) + 1]; return nx ? `<button class="btn btn-grad" data-act="gx-start" data-c="${nx}">Keyingi: ${esc(nx)}</button>` : ""; })() : ["review", "mistakes", "gxm", "lmis", "smis"].includes(SES.mode) ? "" : `<button class="btn btn-grad" data-act="again">Yana mashq</button>`}`;
}

// The browser bar (and the phone's status bar in the installed app) takes the colour of the page: by the system setting, or the chosen theme
function themeMeta(v) {
  // In the Android app the status bar icons follow the chosen theme (DARK = light icons for a dark page)
  if (IS_NATIVE) { try { const sb = nativePlugin("SystemBars"); if (sb) sb.setStyle({ style: v === "dark" ? "DARK" : v === "light" ? "LIGHT" : "DEFAULT" }); } catch (e) {} }
  const m = document.querySelectorAll('meta[name="theme-color"]');
  if (m.length < 2) return;
  m[0].media = v === "auto" ? "(prefers-color-scheme: light)" : ""; m[0].content = v === "dark" ? "#0d1124" : "#f7f4ee";
  m[1].media = v === "auto" ? "(prefers-color-scheme: dark)" : ""; m[1].content = v === "light" ? "#f7f4ee" : "#0d1124";
}
