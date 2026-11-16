/* Türkçe Yoʻl — Groups and teacher tasks.
   One of the app's scripts (js/, loaded in order by index.html); they share one global scope. */

/* ---------- Groups: a teacher creates a class, learners join with a code or link ----------
   Firestore: groups/{CODE} = { name, owner, oname, at }; groups/{CODE}/members/{uid} = a short progress card.
   Joined groups live in S.grp (synced with the progress); the member card is refreshed by grpSync(). */
const GRP_ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", GRP_MAX = 5, GRP_EVERY = 3 * 60 * 1000;
const GRP_SITE = "https://turkceyol.web.app/";
let GRP = {}, GRP_OWN = null, GRP_SYNC_AT = 0, GRP_ERR = "";
const grpCode = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), b => GRP_ABC[b % GRP_ABC.length]).join("");
const grpNorm = c => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
const grpLink = c => GRP_SITE + "#join-" + c;
const grpMine = () => (S.grp || []).filter(c => /^[A-Z0-9]{6}$/.test(c));
const grpRef = c => db.collection("groups").doc(c);
const grpName = () => (USERNAME || (USER && USER.email ? USER.email.split("@")[0] : "") || "Oʻquvchi").trim().slice(0, 40);
function grpCard() {
  const st = skStats(14), sk = {};
  SKILLS.forEach(s => { sk[s.id] = [st[s.id].o, st[s.id].n, Math.round(st[s.id].t / 60)]; });
  let act = 0;
  for (let i = 0; i < 14; i++) if (dayGet(keyOf(dayNum() - i)).xp) act++;
  return { name: grpName(), week: weekKey(), wxp: S.week === weekKey() ? S.wxp : 0, xp: S.xp, streak: streakNow(), last: S.lastDay || "",
    sk, units: kDoneCount(), lv: kNext().level, act, tk: gtDoneMap(), at: firebase.firestore.FieldValue.serverTimestamp() };
}
/* ---------- Group tasks: the teacher sets a course unit, a grammar topic or a reading text with a deadline ----------
   groups/{KOD}/tasks/{id} = { title, kind: "k" | "gx" | "oq", ref, due, at }. A learner's copy lives in S.gtk[KOD];
   whether a task is done is worked out from the learner's own progress and sent on the member card as tk: { id: 1 }. */
const GT_KINDS = { k: "Kurs boʻlimi", gx: "Qoida mavzusi", oq: "Oʻqish matni" };
function gtDone(t) {
  if (t.kind === "k") return kDone(t.ref);
  if (t.kind === "gx") return BX[t.ref] ? gxDone(t.ref) : false;
  if (t.kind === "oq") return ((S.oq || {})[t.ref] || 0) >= 50;
  return false;
}
const gtAll = () => Object.values(S.gtk || {}).flat();
function gtDoneMap() { const m = {}; gtAll().forEach(t => { if (gtDone(t)) m[t.id] = 1; }); return m; }
const gtHref = t => t.kind === "k" ? "#" + kHash(t.ref) : t.kind === "gx" ? "#" + gHash(t.ref) : "#oqish-" + t.ref;
function gtLabel(kind, ref) {
  if (kind === "k") { const u = KU[ref]; return u ? `${u.level}.${u.n} ${u.title}` : ref; }
  if (kind === "gx") { const g = gxTopic(ref); return g ? `${ref} ${g.uz}` : ref; }
  if (kind === "oq") { const t = oqReady() && OQ.find(x => x.id === ref); return t ? `${t.lv} · ${t.tr}` : ref; }
  return ref;
}
function gtOptions(kind) {
  if (kind === "k") return COURSE.units.map(u => [u.id, `${u.level}.${u.n} ${u.title}`]);
  if (kind === "gx") return GX_CODES.map(c => [c, gtLabel("gx", c)]);
  return oqReady() ? OQ.map(t => [t.id, `${t.lv} · ${t.tr}`]) : [];
}
const gtDaysLeft = due => due ? Math.round(Date.parse(due) / DAY) - dayNum() : null;
const gtDueText = due => { const d = gtDaysLeft(due); return d === null ? "" : d < 0 ? "muddati oʻtgan" : d === 0 ? "bugun" : d === 1 ? "ertaga" : `${d} kun qoldi`; };
// Fetch the tasks of every joined group (after sign-in and on the group page)
async function gtRefresh() {
  if (!USER || !db || !grpMine().length) return;
  const next = {};
  for (const c of grpMine()) {
    try { const q = await grpRef(c).collection("tasks").limit(50).get(); next[c] = q.docs.map(d => Object.assign({ id: d.id }, d.data(), { at: null })); } catch (e) { next[c] = (S.gtk || {})[c] || []; }
  }
  S.gtk = next; save(); grpSync(true);
}
// Home: the nearest unfinished tasks
function gtHomeCard() {
  const open = gtAll().filter(t => !gtDone(t)).sort((a, b) => (a.due || "9").localeCompare(b.due || "9")).slice(0, 3);
  if (!open.length) return "";
  return `<section class="glass pad dq-card"><div class="pcard-head"><b>${ICON.users}Oʻqituvchi topshiriqlari</b><span class="tag pink-t">${open.length}</span></div>
    ${open.map(t => `<a class="dq-row" href="${gtHref(t)}" style="color:inherit;text-decoration:none"><span class="dq-ico">${ICON.flag}</span><span><b>${esc(t.title)}</b><small>${esc(GT_KINDS[t.kind] || "")}${t.due ? ` · ${esc(gtDueText(t.due))}` : ""}</small></span>${ICON.chev}</a>`).join("")}</section>`;
}
async function gtAdd(code) {
  const kind = $("gt-kind").value, ref = $("gt-ref").value, due = $("gt-due").value;
  if (!ref) { toast("Topshiriqni tanlang"); return; }
  const id = "t" + Date.now().toString(36);
  try { await grpRef(code).collection("tasks").doc(id).set({ title: gtLabel(kind, ref).slice(0, 80), kind, ref, due: due || "", at: firebase.firestore.FieldValue.serverTimestamp() }); }
  catch (e) { toast(grpErr(e)); return; }
  toast("Topshiriq berildi"); loadGroup(code, true);
}
async function gtDel(code, id) {
  try { await grpRef(code).collection("tasks").doc(id).delete(); } catch (e) { toast(grpErr(e)); return; }
  loadGroup(code, true);
}
// Teacher: the class as a spreadsheet (UTF-8 with BOM so Excel shows the letters right)
function grpCsv(code) {
  const c = GRP[code];
  if (!c) return;
  const wk = weekKey(), tasks = c.tk || [];
  const head = ["Ism", "Bu hafta XP", "Jami XP", "Daraja", "Ketma-ket kun", "Oxirgi faollik", "Kurs darajasi", "Tugatilgan boʻlimlar", "14 kun: daqiqa", "14 kun: faol kun", ...SKILLS.map(s => `${s.tr} %`), ...tasks.map(t => `Topshiriq: ${t.title}`)];
  const rows = c.m.map(m => {
    const st = grpSt(m), mins = Math.round(SKILLS.reduce((a, s) => a + st[s.id].t, 0) / 60);
    return [m.name || "", m.week === wk ? m.wxp || 0 : 0, m.xp || 0, lvlOf(m.xp || 0), m.streak || 0, m.last || "", m.lv || "", m.units || 0, mins, m.act || 0,
      ...SKILLS.map(s => st[s.id].n ? Math.round(st[s.id].o / st[s.id].n * 100) : ""), ...tasks.map(t => (m.tk || {})[t.id] ? "ha" : "yoʻq")];
  });
  // A name like "=HYPERLINK(…)" must stay text in Excel: cells starting with = + - @ get a leading apostrophe
  const cell = v => { let x = String(v); if (/^[=+\-@\t\r]/.test(x)) x = "'" + x; return /[",;\n]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x; };
  const csv = "\ufeff" + [head, ...rows].map(r => r.map(cell).join(";")).join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = `${(c.g.name || code).replace(/[^\w\u0400-\u04FF -]+/g, "").trim() || code}-${todayKey()}.csv`;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  window.__lastCsv = csv;
}
// Refresh my card in every joined group; a missing card means the teacher removed me or deleted the group
function grpSync(force) {
  if (!USER || !db || !grpMine().length) return;
  if (!force && Date.now() - GRP_SYNC_AT < GRP_EVERY) return;
  GRP_SYNC_AT = Date.now();
  const card = grpCard(), old = Object.assign({}, card);
  delete old.tk;
  // Rules published before group tasks existed refuse "tk": try the older card before deciding I was removed
  grpMine().forEach(c => { const ref = grpRef(c).collection("members").doc(USER.uid); ref.update(card).catch(e => {
    if (e && e.code === "permission-denied") return ref.update(old);
    throw e;
  }).catch(e => {
    if (e && (e.code === "not-found" || e.code === "permission-denied")) grpForget(c, "Siz guruhdan chiqarilgansiz yoki guruh oʻchirilgan");
  }); });
}
function grpForget(c, msg) {
  if (!grpMine().includes(c)) return;
  S.grp = grpMine().filter(x => x !== c); delete GRP[c]; save(); cloudSave(true);
  if (msg) toast(msg);
  if (/^#(groups|group-)/.test(location.hash)) route();
}
async function grpJoin(code) {
  code = grpNorm(code);
  if (code.length !== 6) { toast("Guruh kodi 6 ta belgidan iborat"); return; }
  if (!USER || !db) { toast("Guruhga qoʻshilish uchun hisobga kiring"); return; }
  if (grpMine().includes(code)) { go("group-" + code); return; }
  if (grpMine().length >= GRP_MAX) { toast(`Eng koʻpi bilan ${GRP_MAX} ta guruhga qoʻshilish mumkin`); return; }
  try {
    const g = await grpRef(code).get();
    if (!g.exists) { toast("Bunday guruh topilmadi. Kodni tekshiring"); return; }
    if (g.data().owner === USER.uid) { go("group-" + code); return; }
    await grpRef(code).collection("members").doc(USER.uid).set(grpCard());
    S.grp = grpMine().concat(code); delete GRP[code]; save(); cloudSave(true);
    try { localStorage.removeItem("ty-join"); } catch (e) {}
    GRP_SYNC_AT = Date.now();
    pamukSay("happy", `“${g.data().name}” guruhiga qoʻshildingiz!`);
    go("group-" + code);
  } catch (e) { toast(grpErr(e)); }
}
async function grpCreate(name) {
  name = String(name || "").trim().slice(0, 40);
  if (!name) { toast("Guruh nomini yozing, masalan: “A1 kechki guruh”"); $("grp-name") && $("grp-name").focus(); return; }
  if (!USER || !db) return;
  for (let k = 0; k < 3; k++) {
    const code = grpCode();
    try {
      await grpRef(code).set({ name, owner: USER.uid, oname: grpName(), at: firebase.firestore.FieldValue.serverTimestamp() });
      GRP_OWN = null;
      go("group-" + code);
      return;
    } catch (e) { if (!(e && e.code === "permission-denied") || k === 2) { toast(grpErr(e)); return; } }
  }
}
const grpErr = e => e && e.code === "permission-denied" ? "Ruxsat yoʻq: Firestore qoidalari yangilanmagan boʻlishi mumkin" : "Internet aloqasini tekshiring";
const grpDay = d => { if (!d) return "hali faol emas"; const n = dayNum() - dayNum(new Date(d + "T12:00:00")); return n <= 0 ? "bugun" : n === 1 ? "kecha" : `${n} kun oldin`; };
const grpSt = m => { const st = {}; SKILLS.forEach(s => { const a = (m.sk || {})[s.id] || [0, 0, 0]; st[s.id] = { o: a[0] || 0, n: a[1] || 0, t: (a[2] || 0) * 60 }; }); return st; };

function viewGroups() {
  const head = `<div><a class="back" href="#profile">${ICON.back}Profil</a></div>
  <div class="lesson-head"><div class="tags"><span class="tag violet-t">${ICON.users}Sinf bilan oʻrganish</span></div>
    <h1>Guruhlar</h1><p class="sub">Oʻqituvchi guruh yaratadi va havolani ulashadi. Oʻquvchilar qoʻshiladi, oʻqituvchi esa har kimning 4 koʻnikma boʻyicha natijasini koʻradi.</p></div>`;
  if (!FB || !USER) return head + `<div class="glass empty">${mascot("trophy")}<b>Guruhlar hisob bilan ishlaydi</b><span class="muted">Hisobga kirsangiz, sinfingiz bilan birga oʻrganasiz.</span></div>`;
  return head + `
  <section class="section"><div class="section-head"><h2>Guruhga qoʻshilish</h2></div>
    <form class="glass pad grp-form" data-form="grp-join"><label for="grp-code" class="muted">Oʻqituvchingiz bergan 6 belgili kod</label>
      <div class="grp-row"><input id="grp-code" maxlength="8" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Masalan: K7M2QX" value="${esc(grpNorm(localStorage.getItem("ty-join") || ""))}">
      <button class="btn btn-grad" type="submit">Qoʻshilish</button></div></form></section>
  <section class="section"><div class="section-head"><h2>Mening guruhlarim</h2></div><div id="grp-list"><div class="glass empty"><div class="spin"></div>Yuklanmoqda…</div></div></section>
  <section class="section"><div class="section-head"><h2>Oʻqituvchimisiz?</h2></div>
    <form class="glass pad grp-form" data-form="grp-create"><label for="grp-name" class="muted">Guruh yarating — oʻquvchilaringiz natijasini bir joyda koʻrasiz. Bepul.</label>
      <div class="grp-row"><input id="grp-name" maxlength="40" autocomplete="off" placeholder="Guruh nomi: A1 kechki guruh"><button class="btn btn-soft" type="submit">Yaratish</button></div></form></section>
  <div class="tip glass">${ICON.bulb}<div><b>Guruhda nima koʻrinadi?</b>Ismingiz, XP, ketma-ket kunlar, oxirgi faollik, kurs darajasi va soʻnggi 14 kundagi 4 koʻnikma natijalari. Pochta, tugʻilgan sana va rasm koʻrinmaydi. Guruhdan istalgan payt chiqishingiz mumkin.</div></div>`;
}
async function loadGroups() {
  const box = $("grp-list");
  if (!box || !USER || !db) return;
  try {
    if (!GRP_OWN) { const snap = await db.collection("groups").where("owner", "==", USER.uid).limit(20).get(); GRP_OWN = snap.docs.map(d => Object.assign({ id: d.id }, d.data())); }
    const joined = await Promise.all(grpMine().map(c => GRP[c] ? Promise.resolve(Object.assign({ id: c }, GRP[c].g)) : grpRef(c).get().then(d => d.exists ? Object.assign({ id: c }, d.data()) : (grpForget(c), null)).catch(() => ({ id: c, name: c }))));
    if (!$("grp-list")) return;
    const row = (g, own) => `<a class="unit glass" href="#group-${esc(g.id)}"><span class="art ${own ? "violet" : "sky"}">${ICON.users}</span>
      <span class="unit-body"><span class="unit-title">${esc(g.name)}</span><span class="unit-sub">${own ? "Siz — oʻqituvchi" : "Oʻqituvchi: " + esc(g.oname || "—")} · kod ${esc(g.id)}</span></span>${ICON.chev}</a>`;
    const list = GRP_OWN.map(g => row(g, true)).concat(joined.filter(Boolean).map(g => row(g, false)));
    $("grp-list").innerHTML = list.length ? `<div class="list">${list.join("")}</div>` : `<div class="glass empty"><b>Hali guruh yoʻq</b><span class="muted">Kod bilan qoʻshiling yoki oʻzingiz yarating.</span></div>`;
  } catch (e) { if ($("grp-list")) $("grp-list").innerHTML = `<div class="glass empty"><b>Guruhlarni yuklab boʻlmadi</b><span class="muted">${esc(grpErr(e))}</span></div>`; }
}
function viewGroup(code) {
  return `<div><a class="back" href="#groups">${ICON.back}Guruhlar</a></div><div id="grp-body" data-code="${esc(code)}"><div class="glass empty"><div class="spin"></div>Yuklanmoqda…</div></div>`;
}
async function loadGroup(code, fresh) {
  if (!USER || !db) { if ($("grp-body")) $("grp-body").innerHTML = `<div class="glass empty"><b>Hisobga kiring</b></div>`; return; }
  try {
    let c = GRP[code];
    if (!c || fresh || Date.now() - c.t > 60000) {
      const g = await grpRef(code).get();
      if (!g.exists) { grpForget(code); if ($("grp-body")) $("grp-body").innerHTML = `<div class="glass empty"><b>Guruh topilmadi</b><span class="muted">U oʻchirilgan boʻlishi mumkin.</span></div>`; return; }
      const own = g.data().owner === USER.uid;
      if (!own && grpMine().includes(code)) await grpRef(code).collection("members").doc(USER.uid).update(grpCard()).catch(() => {});
      if (own) await loadOq().catch(() => {});
      const [snap, tq] = await Promise.all([grpRef(code).collection("members").limit(200).get(), grpRef(code).collection("tasks").limit(50).get().catch(() => ({ docs: [] }))]);
      const tk = tq.docs.map(d => Object.assign({ id: d.id }, d.data(), { at: null })).sort((a, b) => (a.due || "9").localeCompare(b.due || "9"));
      if (!own) { S.gtk = Object.assign({}, S.gtk, { [code]: tk }); save(); }
      c = GRP[code] = { g: g.data(), m: snap.docs.map(d => Object.assign({ id: d.id }, d.data())), tk, t: Date.now() };
    }
    const box = $("grp-body");
    if (box && box.dataset.code === code) box.innerHTML = groupHTML(code, c);
  } catch (e) {
    if (e && e.code === "permission-denied" && !grpMine().includes(code)) { go("join-" + code); return; }
    if ($("grp-body")) $("grp-body").innerHTML = `<div class="glass empty"><b>Guruhni yuklab boʻlmadi</b><span class="muted">${esc(grpErr(e))}</span></div>`;
  }
}
function groupHTML(code, c) {
  const own = c.g.owner === USER.uid, wk = weekKey();
  const ms = c.m.map(m => Object.assign({}, m, { w: m.week === wk ? m.wxp || 0 : 0 })).sort((a, b) => b.w - a.w || (b.xp || 0) - (a.xp || 0));
  const tk = c.tk || [], others = ms.filter(m => m.id !== c.g.owner);
  const total = {}; SKILLS.forEach(s => total[s.id] = { o: 0, n: 0, t: 0 });
  ms.forEach(m => { const st = grpSt(m); SKILLS.forEach(s => { total[s.id].o += st[s.id].o; total[s.id].n += st[s.id].n; total[s.id].t += st[s.id].t; }); });
  const activeWeek = ms.filter(m => m.w > 0).length, any = SKILLS.some(s => total[s.id].n), weak = skWeakest(total);
  const head = `<div class="lesson-head"><div class="tags"><span class="tag violet-t">${ICON.users}${ms.length} aʼzo</span><span class="tag sky-t">kod ${esc(code)}</span>${own ? `<span class="tag green-t">${ICON.crown}Siz — oʻqituvchi</span>` : ""}</div>
    <h1>${esc(c.g.name)}</h1><p class="sub">${own ? "Havolani oʻquvchilaringizga yuboring: ular bir bosishda qoʻshiladi." : "Oʻqituvchi: " + esc(c.g.oname || "—")}</p></div>`;
  const share = own ? `<div class="glass pad grp-share"><div><small class="muted">Qoʻshilish havolasi</small><code>${esc(grpLink(code))}</code></div>
    <div class="grp-row"><button class="btn btn-grad" data-act="grp-share" data-c="${esc(code)}">${ICON.heart}Ulashish</button><button class="btn btn-ghost" data-act="grp-copy" data-c="${esc(code)}">${ICON.copy}Nusxa</button></div></div>` : "";
  const sum = own && ms.length ? `<section class="section"><div class="section-head"><h2>Guruh — soʻnggi 14 kun</h2><span class="tag sky-t">${activeWeek}/${ms.length} bu hafta faol</span></div>
    <div class="glass pad">${skBars(total)}${any ? `<p class="muted" style="margin-top:10px">Guruhning eng zaif koʻnikmasi: <b>${weak.tr} (${weak.uz})</b>. Darsda shunga koʻproq vaqt ajrating.</p>` : `<p class="muted" style="margin-top:10px">Oʻquvchilar mashq qila boshlaganda natijalar shu yerda chiqadi.</p>`}</div></section>` : "";
  const rows = ms.length ? ms.map((m, i) => {
    const st = grpSt(m), me = m.id === USER.uid, mins = SKILLS.reduce((a, s) => a + st[s.id].t, 0) / 60;
    const line = `<span class="n">${i + 1}</span><span class="grp-name"><b>${esc(m.name || "Oʻquvchi")}${me ? " (siz)" : ""}</b><small>${ICON.flame}${m.streak || 0} kun · ${grpDay(m.last)}</small></span><span class="grp-xp">${m.w} XP</span>`;
    if (!own) return `<div class="rank-row${me ? " me" : ""}">${line}</div>`;
    return `<details class="grp-m"><summary class="rank-row">${line}</summary><div class="grp-detail">
      <div class="facts"><span>${ICON.book}Kurs: ${esc(m.lv || "A1")} · ${m.units || 0}/${COURSE.units.length} boʻlim</span><span>${ICON.clock}14 kunda: ${Math.round(mins)} daqiqa, ${m.act || 0} faol kun</span><span>${ICON.star}Jami: ${m.xp || 0} XP</span></div>
      ${skBars(st)}
      ${tk.length ? `<div class="tags">${tk.map(t => `<span class="tag ${(m.tk || {})[t.id] ? "green-t" : "pink-t"}">${(m.tk || {})[t.id] ? ICON.check : ""}${esc(t.title.slice(0, 28))}</span>`).join("")}</div>` : ""}
      <button class="link" data-act="grp-kick" data-c="${esc(code)}" data-u="${esc(m.id)}" data-n="${esc(m.name || "")}" style="color:var(--pink-ink);align-self:flex-start">Guruhdan chiqarish</button></div></details>`;
  }).join("") : "";
  const list = `<section class="section"><div class="section-head"><h2>${own ? "Oʻquvchilar" : "Guruh reytingi"}</h2><span class="tag violet-t">bu hafta XP</span></div>
    ${ms.length ? `<div class="glass words grp-list">${rows}</div>` : `<div class="glass empty">${mascot("trophy")}<b>Hali hech kim qoʻshilmagan</b><span class="muted">Havolani oʻquvchilaringizga yuboring.</span></div>`}</section>`;
  const tasks = own ? `<section class="section"><div class="section-head"><h2>Topshiriqlar</h2><span class="tag violet-t">${tk.length}</span></div>
    <div class="glass pad gt-form">
      <div class="grp-row"><select id="gt-kind" class="k-select" data-act="gt-kind">${Object.keys(GT_KINDS).map(k => `<option value="${k}">${GT_KINDS[k]}</option>`).join("")}</select>
      <input id="gt-due" type="date" class="k-select" min="${todayKey()}" aria-label="Muddat"></div>
      <select id="gt-ref" class="k-select" aria-label="Topshiriq">${gtOptions("k").map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join("")}</select>
      <button class="btn btn-grad" data-act="gt-add" data-c="${esc(code)}">${ICON.plus}Topshiriq berish</button>
    </div>
    ${tk.length ? `<div class="glass words">${tk.map(t => { const n = others.filter(m => (m.tk || {})[t.id]).length; return `<div class="rank-row gt-row">
      <span class="dq-ico">${ICON.flag}</span><span style="min-width:0"><b>${esc(t.title)}</b><small>${esc(GT_KINDS[t.kind] || "")}${t.due ? ` · ${esc(t.due.split("-").reverse().join("."))} (${esc(gtDueText(t.due))})` : ""}</small></span>
      <span class="xp">${n}/${others.length}<button class="fr-x" data-act="gt-del" data-c="${esc(code)}" data-t="${esc(t.id)}" aria-label="Topshiriqni oʻchirish">×</button></span></div>`; }).join("")}</div>` : `<p class="sub">Hali topshiriq yoʻq. Kurs boʻlimi, qoida mavzusi yoki oʻqish matnini muddat bilan bering — kim bajarganini shu yerda koʻrasiz.</p>`}
    ${ms.length ? `<button class="btn btn-ghost btn-block" data-act="grp-csv" data-c="${esc(code)}">${ICON.download}Natijalarni yuklab olish (Excel, CSV)</button>` : ""}
  </section>`
    : tk.length ? `<section class="section"><div class="section-head"><h2>Topshiriqlar</h2><span class="tag violet-t">${tk.filter(gtDone).length}/${tk.length}</span></div>
    <div class="glass words">${tk.map(t => { const ok = gtDone(t); return `<a class="rank-row gt-row${ok ? " me" : ""}" href="${gtHref(t)}" style="color:inherit;text-decoration:none">
      <span class="dq-ico">${ok ? ICON.check : ICON.flag}</span><span style="min-width:0"><b>${esc(t.title)}</b><small>${esc(GT_KINDS[t.kind] || "")}${t.due ? ` · ${esc(gtDueText(t.due))}` : ""}</small></span><span class="xp">${ok ? "bajarildi" : "Boshlash"}</span></a>`; }).join("")}</div></section>` : "";
  const foot = own ? `<div id="grp-del" style="display:flex;flex-direction:column;gap:10px"><button class="btn btn-ghost btn-block" data-act="grp-reload" data-c="${esc(code)}">Yangilash</button><button class="link" data-act="grp-del-ask" data-c="${esc(code)}" style="align-self:center;color:var(--pink-ink)">Guruhni oʻchirish</button></div>`
    : `<button class="btn btn-ghost btn-block" data-act="grp-leave" data-c="${esc(code)}">Guruhdan chiqish</button>`;
  return head + share + tasks + sum + list + foot;
}
async function viewJoinLoad(code) {
  const box = $("grp-join");
  if (!box) return;
  if (!USER || !db) { box.innerHTML = `<div class="glass empty"><b>Hisobga kiring</b><span class="muted">Guruhga qoʻshilish uchun avval hisobga kiring yoki roʻyxatdan oʻting.</span></div>`; return; }
  if (grpMine().includes(code)) { go("group-" + code); return; }
  try {
    const g = await grpRef(code).get();
    if (!$("grp-join")) return;
    if (!g.exists) { $("grp-join").innerHTML = `<div class="glass empty"><b>Guruh topilmadi</b><span class="muted">Havola eskirgan yoki kod notoʻgʻri. Oʻqituvchingizdan yangisini soʻrang.</span></div>`; return; }
    if (g.data().owner === USER.uid) { go("group-" + code); return; }
    $("grp-join").innerHTML = `<div class="glass pad grp-invite">${mascot("wave")}<h2>${esc(g.data().name)}</h2><p class="muted">Oʻqituvchi: ${esc(g.data().oname || "—")}</p>
      <p class="muted">Qoʻshilsangiz, oʻqituvchi va guruhdoshlar ismingiz, XP va 4 koʻnikma natijalaringizni koʻradi.</p>
      <button class="btn btn-grad btn-block" data-act="grp-join" data-c="${esc(code)}">Guruhga qoʻshilish</button></div>`;
    CatLife.scan();
  } catch (e) { if ($("grp-join")) $("grp-join").innerHTML = `<div class="glass empty"><b>Guruhni ochib boʻlmadi</b><span class="muted">${esc(grpErr(e))}</span></div>`; }
}
function viewJoin(code) {
  try { localStorage.setItem("ty-join", code); } catch (e) {}
  return `<div><a class="back" href="#groups">${ICON.back}Guruhlar</a></div><div class="lesson-head"><div class="tags"><span class="tag violet-t">${ICON.users}Taklif</span></div><h1>Guruhga taklif</h1></div><div id="grp-join"><div class="glass empty"><div class="spin"></div>Yuklanmoqda…</div></div>`;
}
async function grpLeave(code) {
  try { await grpRef(code).collection("members").doc(USER.uid).delete(); } catch (e) { toast(grpErr(e)); return; }
  grpForget(code); toast("Guruhdan chiqdingiz"); go("groups");
}
async function grpKick(code, uid) {
  try { await grpRef(code).collection("members").doc(uid).delete(); } catch (e) { toast(grpErr(e)); return; }
  if (GRP[code]) GRP[code].m = GRP[code].m.filter(m => m.id !== uid);
  route();
}
async function grpDelete(code) {
  try {
    const snap = await grpRef(code).collection("members").get();
    await Promise.all(snap.docs.map(d => d.ref.delete()));
    await grpRef(code).delete();
  } catch (e) { toast(grpErr(e)); return; }
  delete GRP[code]; GRP_OWN = null; toast("Guruh oʻchirildi"); go("groups");
}
// Account deletion: leave joined groups, delete own groups
async function grpWipe(uid) {
  await Promise.all(grpMine().map(c => grpRef(c).collection("members").doc(uid).delete().catch(() => {})));
  const own = await db.collection("groups").where("owner", "==", uid).get().catch(() => null);
  if (own) for (const g of own.docs) { const m = await g.ref.collection("members").get().catch(() => null); if (m) await Promise.all(m.docs.map(d => d.ref.delete().catch(() => {}))); await g.ref.delete().catch(() => {}); }
}
