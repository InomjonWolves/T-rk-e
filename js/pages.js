/* Türkçe Yoʻl — Pages: home, level cards, lessons, vocabulary, grammar, guide, alphabet, practice, leaderboard, profile.
   One of the app's scripts (js/, loaded in order by index.html); they share one global scope. */

/* ---------- Home ---------- */
function wordOfDay(n = dayNum()) {
  const pool = kNext().level === "A1" ? ALL.filter(w => w.unit < 36) : ALL;
  return pool[(n * 7) % pool.length];
}
// Home: one status card (level, streak, today's XP, words, the week), today's plan, where to continue, tasks, the word of the day
function statusCard() {
  const L = lvlInfo(), wk = weekDays(), tn = dayNum(), learned = learnedCount();
  return `<section class="glass status-card">
    <a class="lvl-card" href="#profile">
      <div class="lvl-cat">${catSVG({ pose: "head", look: L.st.id })}</div>
      <div class="lvl-body"><div class="pcard-head"><b>${L.lv}-daraja · ${esc(L.st.uz)}</b>${lgBadge(S.lg)}</div>
        <div class="bar"><i style="width:${Math.round(L.p * 100)}%"></i></div>
        <small class="muted">${S.xp - L.from}/${L.to - L.from} XP · ${L.next ? `${L.next.lv}-darajada: ${esc(L.next.uz)}` : "Pamuk afsonaga aylandi!"}</small></div></a>
    <div class="stat-row">
      <button class="st-item st-btn" data-act="streak"><span class="ico orange-t">${ICON.flame}</span><b>${streakNow()}</b> <small>kun ketma-ket</small>${S.frz ? `<span class="frz-badge"><span class="sr">, muzlatgich: </span>${ICON.snow}${S.frz}</span>` : ""}<span class="sr"> — seriya kalendarini ochish</span></button>
      <div class="st-item"><span class="ico ${S.dayXp >= S.goal ? "green-t" : "sky-t"}">${S.dayXp >= S.goal ? ICON.check : ICON.bolt}</span><b>${S.dayXp}<i>/${S.goal}</i></b><small>bugungi XP</small></div>
      <div class="st-item"><span class="ico green-t">${ICON.book}</span><b>${learned}</b><small>soʻz oʻrganildi</small></div>
    </div>
    <div class="week" aria-label="Shu hafta">
      ${wk.map(d => { const on = dayGet(d.k).xp || dayGet(d.k).rev, fz = !on && (S.frzD || []).includes(d.k); return `<div class="day${d.n === tn ? " today" : ""}${on ? " on" : ""}${fz ? " frz" : ""}"><small>${d.l}</small><b>${new Date(d.n * DAY).getUTCDate()}</b>${fz ? `<span class="mark" role="img" aria-label="Muzlatgich saqlab qoldi">${ICON.snow}</span>` : `<svg class="mark" viewBox="0 0 24 24" fill="currentColor" aria-label="${on ? "Mashq qilingan" : "Mashq yoʻq"}">${pawPath}</svg>`}</div>`; }).join("")}
    </div>
  </section>`;
}
/* Personal advice (Duolingo darajasi, 3): what to practise next, from the learner's own numbers — the weakest of the
   four skills over 14 days (accuracy below 75% with enough answers, or hardly practised), the fullest mistake
   notebook, words about to be forgotten, a finished level whose test is waiting. Highest weight first. */
function recs() {
  const out = [], st = skStats(14), tot = SKILLS.reduce((a, s) => a + st[s.id].n, 0);
  const due = dueWords().length;
  if (due >= 8) out.push({ id: "due", ico: "cards", c: "sky", t: "Takrorlash vaqti", why: `${due} ta soʻz unutilish arafasida`, go: () => startSession("review"), w: 50 + Math.min(due, 40) });
  if (tot >= 20) {
    const sk = SKILLS.filter(s => s.id !== "s" || canListen()).map(s => ({ s, n: st[s.id].n, acc: st[s.id].n >= 8 ? st[s.id].o / st[s.id].n : null, share: st[s.id].n / tot }));
    const low = sk.filter(k => k.acc !== null && k.acc < 0.75).sort((a, b) => a.acc - b.acc)[0];
    const rare = sk.filter(k => k.share < 0.12).sort((a, b) => a.share - b.share)[0];
    if (low) out.push({ id: "sk-" + low.s.id, sk: low.s.id, ico: low.s.ico, c: low.s.c, t: `${low.s.uz}ni kuchaytiring`, why: `Oxirgi 14 kunda ${low.s.uz.toLowerCase()}da aniqlik ${Math.round(low.acc * 100)}% — boshqa koʻnikmalardan pastroq`, go: () => skGo(low.s.id), w: 80 + (75 - low.acc * 100) });
    if (rare && (!low || rare.s.id !== low.s.id)) out.push({ id: "sk-" + rare.s.id, sk: rare.s.id, ico: rare.s.ico, c: rare.s.c, t: `${rare.s.uz} mashqi`, why: rare.n ? `Oxirgi 14 kunda ${rare.s.uz.toLowerCase()} kam mashq qilindi: barcha javoblarning atigi ${Math.max(1, Math.round(rare.share * 100))}%` : `Oxirgi 14 kunda ${rare.s.uz.toLowerCase()} mashqi boʻlmadi — 4 koʻnikma teng oʻssin`, go: () => skGo(rare.s.id), w: 70 });
  }
  const books = [["mistakes", mistakeWords().length, "soʻz"], ["gxm", GRAM_FULL ? gxMistakes().length : 0, "qoida"], ["lmis", lsmList("l").length, "tinglash"], ["smis", canListen() ? lsmList("s").length : 0, "gapirish"]].sort((a, b) => b[1] - a[1])[0];
  if (books[1] >= 5) out.push({ id: "mis", ico: "target", c: "pink", t: "Xatolar ustida ishlang", why: `Xatolar daftarida ${books[1]} ta ${books[2]} xatosi turibdi`, mode: books[0], go: () => startSession(books[0], "all"), w: 55 + Math.min(books[1], 30) });
  const mor = Object.entries(S.mor || {}).sort((a, b) => b[1] - a[1])[0];
  if (mor && mor[1] >= 3) { if (!MORPH_OK) loadMorph().catch(() => {}); out.push({ id: "mor", ico: "cap", c: "teal", t: "Qoʻshimchalar mashqi", why: `Yozganda ${morName(mor[0])} boʻyicha ${Math.round(mor[1])} marta adashdingiz — mashq shunga moslab tuzildi`, go: () => startSession("morf", mor[0]), w: 72 + Math.min(18, mor[1] * 2) }); }
  const lvDone = COURSE.levels.find(l => l.units.every(kDone) && kTestBest(l.id) < l.test.pass);
  if (lvDone) out.push({ id: "test", ico: "trophy", c: "orange", t: `${lvDone.id} daraja testi`, why: `${lvDone.id} ning barcha boʻlimlari tugallandi — endi test bilan mustahkamlang`, go: () => go("ktest-" + lvDone.id.toLowerCase()), w: 90 });
  return (REC_LAST = out.sort((a, b) => b.w - a.w).slice(0, 3));
}
let REC_LAST = [];
// A tip's button: close a finished practice first, then do what the tip says
function recRun(id) { const x = REC_LAST.find(r => r.id === id) || recs().find(r => r.id === id); if (SES) closeSession(); if (x) x.go(); }
function recsCard() {
  const r = recs();
  if (!r.length) return "";
  return `<section class="section recs-sec"><div class="section-head"><h2>Pamuk tavsiyasi</h2><span class="tag violet-t">Siz uchun</span></div>
    <div class="recs glass">${r.map(x => `<button class="rec-row" data-act="rec" data-id="${x.id}"><span class="ico ${x.c}-t">${ICON[x.ico] || ICON.star}</span><span class="rec-txt"><b>${esc(x.t)}</b><small>${esc(x.why)}</small></span>${ICON.chev}</button>`).join("")}</div></section>`;
}
function viewHome() {
  const due = dueWords().length, fresh = Math.min(newLeft(), newWords(NEW_PER_DAY).length), todo = due + fresh;
  const w = wordOfDay(), t = tipOfDay();
  return `${topbar()}
  ${greeting()}
  <div class="home-side">
  ${statusCard()}
  ${guestCard()}
  ${comebackCard()}
  ${gtHomeCard()}
  ${dqCard()}
  ${installCard()}
  </div>
  <div class="home-main">
  ${todo ? `<section class="hero">
    <span class="hero-chip"><i>${ICON.spark}</i>Bugungi reja</span>
    <h2>Kuniga <span class="hl">10 daqiqa</span> yetarli</h2>
    <div class="hero-stats"><span><b>${due}</b> takrorlash</span><span><b>${fresh}</b> yangi soʻz</span><span>~<b>${Math.max(1, Math.round(todo * 0.25))}</b> daqiqa</span></div>
    <button class="btn btn-white hero-pill" data-act="start" data-mode="review">Boshlash<span class="hero-pill-go">${ICON.chev}</span></button>
    <div class="hero-cat">${catSVG({ pose: "wave", acc: "cap", ears: "up", look: catLook(), cls: "mascot" })}</div>
  </section>` : `<section class="hero warm">
    <span class="hero-chip"><i>${ICON.check}</i>Bajarildi</span>
    <h2>Bugungi reja <span class="hl">bajarildi!</span></h2>
    <div class="hero-note"><span class="hero-ico">${ICON.bulb}</span><p>Soʻzlar unutilish arafasida qaytadi. Ertaga yana keling.</p></div>
    <button class="btn hero-pill" data-act="go" data-to="practice">Erkin mashq<span class="hero-pill-go">${ICON.chev}</span></button>
    <div class="hero-cat">${catSVG({ pose: "cheer", ears: "up", look: catLook(), cls: "mascot" })}</div>
  </section>`}

  ${recsCard()}
  ${plHomeCard()}
  ${(() => { const u = kNext(), p = kProgress(u.id), gate = kGate(); if (gate) { const g = KLEVEL(gate); return `<section class="section">
    <div class="section-head"><h2>Kursni davom ettiring</h2><a class="link" href="#course">Barcha boʻlimlar</a></div>
    <a class="pcard glass k-next" href="#ktest-${gate.toLowerCase()}"><div class="k-next-row"><span class="art orange">${ICON.trophy}</span>
      <div class="unit-body"><small class="eyebrow">${gate} · daraja testi</small><b class="k-next-title">${esc(g.test.title)}</b></div>${ICON.chev}</div>
    <p class="muted">${gate} ning barcha boʻlimlari tugadi. Testdan ${g.test.pass}% olsangiz, ${u.level} darajasi ochiladi.</p></a></section>`; } return `<section class="section">
    <div class="section-head"><h2>Kursni davom ettiring</h2><a class="link" href="#course">Barcha boʻlimlar</a></div>
    <a class="pcard glass k-next" href="#${kHash(u.id)}">
    <div class="k-next-row"><span class="art ${LV_COLOR[u.level]}"><span>${u.level}.${u.n}</span></span>
      <div class="unit-body"><small class="eyebrow">${u.level} · ${u.n}-boʻlim</small><b class="k-next-title" lang="tr">${esc(u.title)}</b></div>${pctRing(p)}</div>
    <p class="muted">${esc(u.sub)}</p>
    <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${COURSE.units.length}" aria-valuenow="${kDoneCount()}" aria-label="Kurs: ${kDoneCount()}/${COURSE.units.length} boʻlim"><i style="width:${pct(kDoneCount(), COURSE.units.length)}%"></i></div>
    <small class="muted">Kurs: ${kDoneCount()}/${COURSE.units.length} boʻlim · A1 → C1</small></a></section>`; })()}

  <section class="section wd-sec">
    <div class="section-head"><h2>Bugungi soʻz</h2></div>
    <div class="glass pad word-day">
      <div class="tile-row"><div style="min-width:0"><div class="wd-tr" lang="tr">${esc(w.tr)}</div><div class="word-uz" style="font-size:16px">${esc(w.uz)}</div></div><button class="say" data-act="say" data-t="${esc(w.tr)}" aria-label="Tinglash">${ICON.speak}</button></div>
      ${w.note ? `<div class="word-note">${esc(w.note)}</div>` : ""}
      <div class="tip-line"><div class="tip-cat">${catSVG({ pose: "head", look: catLook() })}</div><div><small class="eyebrow">Pamuk maslahati</small><b>${esc(t[0])}</b><p class="muted">${esc(t[1])}</p></div></div>
    </div>
  </section>
  </div>`;
}

/* ---------- Level, Pamuk's growth, daily tasks, weekly challenge (home and profile cards) ---------- */
function lvlInfo() {
  const lv = lvlOf(S.xp), a = lvlXP(lv), b = lvlXP(lv + 1);
  return { lv, from: a, to: b, p: (S.xp - a) / (b - a), st: catStage(lv), next: CAT_STAGES.find(s => s.lv > lv) };
}
const DQ_GO = {
  vocab: ["Lugʻat testi", "Kamida 50% toʻgʻri javob", "quiz", "start", "review"],
  grammar: ["Qoida mashqi", "Bitta mavzu mashqi", "cap", "gx", ""],
  listening: ["Tinglash mashqi", "Eshitib, maʼnosini toping", "ear", "start", "listen"],
  speaking: ["Gapirish mashqi", "Ovoz chiqarib ayting", "mic", "start", "say"]
};
function dqBtn(k) {
  const g = DQ_GO[k];
  return g[3] === "gx" ? `data-act="gx-start" data-c="${esc(gxNext())}"` : `data-act="start" data-mode="${g[4]}" data-u="all"`;
}
function dqCard() {
  const q = dqToday(), done = q.k.filter(k => q.ok[k]).length;
  return `<section class="glass pad dq-card dq-today">
    <div class="pcard-head"><b>${ICON.target}Bugungi vazifalar</b><span class="tag ${q.paid ? "green-t" : "violet-t"}">${q.paid ? `${ICON.check}+${XP_VAL.daily} XP olindi` : `${done}/3 · +${XP_VAL.daily} XP`}</span></div>
    ${q.k.map(k => { const g = DQ_GO[k], ok = q.ok[k]; return `<button class="dq-row${ok ? " ok" : ""}" ${ok ? "disabled" : dqBtn(k)}>
      <span class="dq-ico">${ok ? ICON.check : ICON[g[2]]}</span><span><b>${g[0]}</b><small>${g[1]}</small></span><span class="dq-xp">+${XP_VAL[k]} XP</span>${ok ? "" : ICON.chev}</button>`; }).join("")}
    ${wcMini()}
  </section>`;
}
function dqMini() {
  const q = dqToday(), done = q.k.filter(k => q.ok[k]).length;
  return `<p class="muted">Kunlik vazifalar: ${done}/3${q.paid ? " ✔" : ` · hammasi uchun +${XP_VAL.daily} XP`}</p>`;
}
// The weekly challenge as the last row of the daily tasks card
function wcMini() {
  const w = wcWeek(), ch = WC[w.c], v = Math.min(ch.n, ch.v(w)), left = 7 - (dayNum() - weekStart(dayNum()));
  return `<div class="wc-card wc-mini">
    <div class="pcard-head"><b>${ICON.crown}Hafta: ${esc(ch.t)}</b><span class="tag ${w.paid ? "green-t" : "pink-t"}">${w.paid ? `${ICON.check}bajarildi` : `+${XP_VAL.weekly} XP`}</span></div>
    <div class="bar"><i style="width:${Math.round(v / ch.n * 100)}%"></i></div>
    <small class="muted">${esc(ch.d)} · ${v}/${ch.n}${w.paid ? "" : ` · ${left} kun qoldi`}</small>
  </div>`;
}
function comebackCard() {
  const away = daysAway();
  if (away < 3 || dayGet(todayKey()).rev) return "";
  return `<section class="glass pad comeback">
    <div class="lvl-cat">${catSVG({ pose: "head", look: catLook() })}</div>
    <div><b>Pamuk sizni sogʻindi!</b><p class="muted">${away} kun koʻrishmadik. Hech gap emas — 5 daqiqalik takrorlashdan boshlaymiz, soʻzlar tezda esga tushadi.</p>
    <button class="btn btn-grad" data-act="start" data-mode="review">5 daqiqa takrorlash</button></div>
  </section>`;
}
// Profile: every frame, the one in use, and what opens the next
/* Profile hero: the big Pamuk stands inside the current frame (the same ring and ornaments as on the avatar, large),
   two main achievements on each side, the level under it and the next frame as the goal. */
// The four achievements to show off: the rarest first, then the newest; empty places go to the closest ones still locked
function achTop(n = 5) {
  const when = a => (S.achv || {})[a.id] || "";
  const got = ACH.filter(achDone).sort((x, y) => achTier(y) - achTier(x) || when(y).localeCompare(when(x))).slice(0, n);
  const next = ACH.filter(a => !achDone(a)).sort((x, y) => y.v() / y.n - x.v() / x.n).slice(0, n - got.length);
  return [...got.map(a => [a, true]), ...next.map(a => [a, false])];
}
function frameNextRow() {
  const cur = myFrame(), nx = FRAMES[cur], seed = USER ? USER.uid : "me";
  if (!nx) return `<div class="ph-next top"><span class="ph-next-txt"><b>Afsona ramkasi sizda!</b><small>Bundan yuqori ramka yoʻq — siz choʻqqidasiz.</small></span></div>`;
  const base = lvlXP(FRAMES[frameByLv(lvlOf(S.xp)) - 1].lv), goal = lvlXP(nx.lv), p = Math.max(0, Math.min(1, (S.xp - base) / (goal - base)));
  return `<div class="ph-next">
    <span class="ph-next-fr">${avatarHTML(MYPHOTO, seed, "", { n: nx.n })}<i class="fr-lock" role="img" aria-label="Yopiq">${ICON.lock}</i></span>
    <span class="ph-next-txt"><small class="eyebrow">Keyingi ramka</small><b>${nx.uz}</b>
      <span class="bar" style="--frn:var(--fr${nx.n}c)" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(p * 100)}" aria-label="${nx.uz} ramkasigacha"><i style="width:${Math.round(p * 100)}%"></i></span>
      <small class="fr-next">${nx.lv}-darajaga yana ${Math.max(0, goal - S.xp)} XP${(S.lg || 1) < nx.n ? ` yoki ${nx.uz} ligasiga chiqing` : ""}</small></span>
  </div>`;
}
function pamukHero() {
  const L = lvlInfo(), fr = myFrame(), top = achTop(), done = ACH.filter(achDone).length;
  const medal = ([a, on], i) => `<a class="ph-medal${on ? "" : " locked"}" href="#achievements" title="${esc(a.d)}">${on ? achSticker(a, i) : `<span class="ach-st ach-lock">${ICON.lock}</span>`}<small>${esc(a.t)}</small></a>`;
  return `<section class="section">
    <div class="glass pad grow-card ph-card ph-fr${fr}">
      <div class="ph-stage"><div class="ph-cat">${framed(`<span class="avatar ph-av">${catSVG({ pose: "sit", look: L.st.id, cls: "mascot" })}</span>`, fr, { cls: "fr-hero" })}</div></div>
      <div class="ph-shelf" role="group" aria-label="Asosiy yutuqlar">${top.map(medal).join("")}</div>
      <div class="tags ph-tags"><span class="tag violet-t">${L.lv}-daraja</span><span class="tag orange-t">${FRAMES[fr - 1].uz} ramka</span></div>
      <b>${esc(L.st.uz)}</b><p class="muted">${esc(L.st.d)}</p>
      <div class="bar"><i style="width:${Math.round(L.p * 100)}%"></i></div>
      <small class="muted">${L.lv + 1}-darajagacha ${L.to - S.xp} XP${L.next ? ` · ${L.next.lv}-darajada «${esc(L.next.uz)}»` : ""}</small>
      ${frameNextRow()}
      <a class="ph-all" href="#achievements"><span>${ICON.trophy}<b>Yutuqlar</b></span><span>${done}/${ACH.length}${ICON.chev}</span></a>
    </div>
  </section>`;
}

/* ---------- Lessons ---------- */
let CAT = "all", Q = "";
/* Oʻrganish (one tab for what used to be Darslar and Mashq): Kurs · Mashq · Kutubxona at the top; the library's
   pages (grammar, vocabulary, alphabet, reading, stories) open from Kutubxona with a way back to it. The menu's
   «Oʻrganish» opens the part seen last (LEARN_SEG). */
let LEARN_SEG = "course";
function learnTabs(active) {
  LEARN_SEG = active;
  const t = (id, name) => `<a href="#${id}"${active === id ? ' aria-current="page"' : ""}>${name}</a>`;
  return `<h1 class="page-title">Oʻrganish</h1>
  <nav class="seg glass learn-seg" aria-label="Oʻrganish boʻlimlari">${t("course", "Kurs")}${t("practice", "Mashq")}${t("library", "Kutubxona")}</nav>`;
}
function libHead(name) { LEARN_SEG = "library"; return `<div><a class="back" href="#library">${ICON.back}Kutubxona</a></div><h1 class="page-title">${name}</h1>`; }
const lrow = (attrs, ico, c, t, sub, end) => `<${attrs.startsWith("href") ? "a" : "button"} class="lrow" ${attrs}><span class="lrow-ico ${c}-t">${ICON[ico]}</span><span class="lrow-txt"><b>${t}</b><small>${sub}</small></span>${end || ICON.chev}</${attrs.startsWith("href") ? "a" : "button"}>`;
function viewLibrary() {
  return `${topbar()}${learnTabs("library")}
  <div class="lrows glass">
    ${lrow('href="#grammar"', "cap", "violet", "Grammatika", "Qoidalar, misollar va mashqlar · A1–C1")}
    ${lrow('href="#lugat"', "cards", "sky", "Lugʻat", `${ALL.length} ta soʻz · mavzuli toʻplamlar`)}
    ${lrow('href="#oqish"', "book", "teal", "Oʻqish matnlari", "Qisqa matnlar va savollar")}
    ${lrow('href="#hikoya"', "chat", "orange", "Hikoyalar", "Tinglab, oʻqib, javob berib")}
    ${lrow('href="#alphabet"', "type", "green", "Alifbo", "29 harf va ularning talaffuzi")}
    ${lrow('href="#translate"', "translate", "pink", "Tarjimon", "Soʻz va gaplarni tarjima qilish")}
  </div>`;
}
function searchResults() {
  const q = plain(Q);
  if (!q) return "";
  const hits = ALL.filter(w => plain(w.tr).includes(q) || plain(w.uz).includes(q)).slice(0, 30);
  return hits.length
    ? `<div class="words glass">${hits.map(w => wordRow(w, true)).join("")}</div>`
    : `<div class="glass empty"><b>“${esc(Q)}” topilmadi</b><span class="muted">Boshqacha yozib koʻring: turkcha yoki oʻzbekcha.</span></div>`;
}
function unitsList() {
  return LEVELS.map((L, li) => {
    const rows = UNITS.slice(L.from, L.to).map((u, i) => L.from + i);
    const p = rows.reduce((a, ui) => a + unitProgress(ui), 0) / rows.length;
    const open = li === 0 ? p < 1 : LEVELS.slice(0, li).every(P => UNITS.slice(P.from, P.to).every((u, i) => unitProgress(P.from + i) >= 1)) && p < 1;
    return `<details class="glass fold"${open ? " open" : ""}><summary><span class="art ${["violet", "sky", "pink"][li % 3]}"><span style="font-size:13px">${L.name}</span></span>
      <span class="unit-body"><span class="unit-title">${esc(L.uz)}</span><span class="unit-sub">${rows.length} ta dars · ${rows.reduce((a, ui) => a + UNITS[ui].words.length, 0)} ta soʻz</span></span>${pctRing(p)}</summary>
      <div class="list">${rows.map(ui => unitRow(UNITS[ui], ui)).join("")}</div></details>`;
  }).join("");
}
// Kutubxona → Lugʻat: search over every word, levels A1–C1; A1 starts with the step-by-step lessons, then topic packs and the course vocabulary
function viewLessons() { return viewLugat(); }
function viewUnit(ui) {
  const u = UNITS[ui], c = catOf(ui), ws = unitWords(ui), k = ws.filter(w => known(w) >= 2).length;
  const acc = accOf([u.id]);
  return `<div><a class="back" href="#lugat">${ICON.back}Lugʻat</a></div>
  <div class="lesson-head">
    <div class="tags"><span class="tag ${c.color}-t">${ICON[c.ico]}${esc(c.uz)}</span><span class="tag violet-t">${pad(ui + 1)}-dars</span>${acc !== null ? `<span class="tag green-t">${acc}% toʻgʻri</span>` : ""}</div>
    <h1>${esc(u.uz)}</h1>
    <p class="sub" lang="tr">${esc(u.tr)}</p>
  </div>
  <div class="tip glass">${ICON.bulb}<div><b>${esc(u.tip[0])}</b>${esc(u.tip[1])}</div></div>
  <section class="section">
    <div class="section-head"><h2>Soʻzlar <span class="muted" style="font-weight:700">(${ws.length})</span></h2><span class="tag green-t">${k} oʻrganilgan</span></div>
    <div class="words glass">${ws.map(w => wordRow(w)).join("")}</div>
  </section>
  <div class="sticky-cta"><button class="btn btn-grad btn-block" data-act="modes" data-u="${ui}" data-title="${esc(u.uz)}">${ICON.cards}Mashq qilish</button></div>`;
}

/* ---------- Vocabulary base ---------- */
let LUG_LV = "A1";
function lugRow(p) {
  const n = LWORDS[p.id].length, k = lugKnown(p.id);
  return `<a class="unit glass" href="#lugat-${p.id}">
    <span class="art ${LV_COLOR[p.lv]}"><span style="font-size:13px">${p.lv}</span></span>
    <span class="unit-body"><span class="unit-title">${esc(p.uz)}</span><span class="unit-sub"><span lang="tr">${esc(p.tr)}</span> · ${n} ta soʻz</span></span>
    ${pctRing(n ? k / n : 0)}</a>`;
}
function viewLugat() {
  const lvs = ["A1", "A2", "B1", "B2", "C1"], packs = lugLevel(LUG_LV);
  const total = ALL.length, learned = learnedCount(), kc = CATS.find(c => c.id === "k" + LUG_LV);
  const kw = kc ? ALL.filter(w => kc.ids.includes(UNITS[w.unit].id)) : [];
  return `${topbar()}
  ${libHead("Lugʻat")}
  <label class="search glass" for="q">${ICON.search}<span class="sr">Soʻz qidirish</span><input id="q" type="search" placeholder="${total} ta soʻz ichidan qidiring" value="${esc(Q)}" autocomplete="off" lang="tr"></label>
  <div id="search-results">${searchResults()}</div>
  <div id="units-block" class="stack" ${Q ? "hidden" : ""}>
    <p class="sub">Soʻzlar darajalar boʻyicha: avval A1 darslari, keyin mavzuli toʻplamlar. Jami oʻrganilgan: <b>${learned}/${total}</b></p>
    <div class="chips">${lvs.map(l => `<button class="chip" data-act="lug-lv" data-l="${l}" aria-pressed="${l === LUG_LV}">${l}<small style="font-weight:600;margin-left:4px">${new Set(lugLevel(l).flatMap(p => LWORDS[p.id].map(w => w.tr))).size}</small></button>`).join("")}</div>
    ${LUG_LV === "A1" ? `<div class="section-head"><h2>1. Boshlangʻich darslar</h2><span class="tag violet-t">36 dars</span></div>
    <div style="display:flex;flex-direction:column;gap:10px">${unitsList()}</div>` : ""}
    <div class="section-head"><h2>${LUG_LV === "A1" ? "2. " : ""}Mavzuli toʻplamlar · ${LUG_LV}</h2><span class="tag sky-t">${packs.length} mavzu</span></div>
    <div class="list">${packs.map(lugRow).join("")}</div>
    ${kc ? `<button class="unit glass" data-act="modes" data-u="cat:${kc.id}" data-title="${esc(kc.uz)}">
      <span class="art teal"><span style="font-size:13px">${LUG_LV}</span></span>
      <span class="unit-body"><span class="unit-title">Kurs lugʻati · ${LUG_LV}</span><span class="unit-sub">${kw.length} ta soʻz · ${LUG_LV} kurs boʻlimlaridagi barcha soʻzlar</span></span>
      ${pctRing(kw.length ? kw.filter(w => known(w) >= 2).length / kw.length : 0)}</button>` : ""}
    <button class="btn btn-ghost btn-block" data-act="modes" data-u="all" data-title="Barcha soʻzlar">${ICON.globe}Barcha soʻzlardan erkin mashq</button>
  </div>`;
}
function viewLugPack(p) {
  const ws = LWORDS[p.id], k = lugKnown(p.id), i = LPACKS.indexOf(p), next = LPACKS[i + 1];
  return `<div><a class="back" href="#lugat">${ICON.back}Lugʻat</a></div>
  <div class="lesson-head">
    <div class="tags"><span class="tag ${LV_COLOR[p.lv]}-t">${p.lv}</span><span class="tag green-t">${k}/${ws.length} oʻrganilgan</span></div>
    <h1>${esc(p.uz)}</h1>
    <p class="sub" lang="tr">${esc(p.tr)}</p>
  </div>
  <section class="section">
    <div class="section-head"><h2>Soʻzlar <span class="muted" style="font-weight:700">(${ws.length})</span></h2></div>
    <div class="words glass">${ws.map(w => wordRow(w)).join("")}</div>
  </section>
  ${next ? `<a class="btn btn-ghost btn-block" href="#lugat-${next.id}">Keyingi: ${esc(next.lv)} · ${esc(next.uz)}</a>` : ""}
  <div class="sticky-cta"><button class="btn btn-grad btn-block" data-act="modes" data-u="l:${p.id}" data-title="${esc(p.uz)}">${ICON.cards}Mashq qilish</button></div>`;
}

/* ---------- Grammar ---------- */
function gramRow(g, gi) {
  const r = S.gram[g.id] || [], n = g.quiz.filter((q, i) => r[i]).length;
  return `<button class="unit glass" data-act="go" data-to="grammar-${gi + 1}">
    <span class="art ${gramDone(g) ? "green" : "violet"}"><span>G${gi + 1}</span></span>
    <span class="unit-body"><span class="unit-title">${nb(g.uz)}</span><span class="unit-sub" lang="tr">${esc(g.tr)}</span></span>
    ${pctRing(n / g.quiz.length)}
  </button>`;
}
// Kutubxona → Grammatika: the handbook by level (topics with their exercises), search, the exercise progress, and for A1 the 10 short lessons
function viewGrammarList() { return viewGuide(); }
function gqHtml(g, qi) {
  const q = g.quiz[qi];
  return `<div class="gq glass" id="gq-${qi}">
    <div class="gq-q">${qi + 1}. ${esc(q.q)}</div>
    <div class="gq-opts">${shuffle(q.o.map((o, oi) => [o, oi])).map(([o, oi]) => `<button class="opt" lang="tr" data-act="gq" data-q="${qi}" data-o="${oi}">${esc(o)}</button>`).join("")}</div>
    <div class="feedback" aria-live="polite"></div>
  </div>`;
}
function viewGrammar(gi) {
  const g = GRAMMAR[gi], t = g.table, next = GRAMMAR[gi + 1];
  return `<div><button class="back" data-act="go" data-to="grammar">${ICON.back}Grammatika</button></div>
  <div class="lesson-head">
    <div class="tags"><span class="tag violet-t">${ICON.cap}${gi + 1}-mavzu</span>${gramDone(g) ? `<span class="tag green-t">Tugallangan</span>` : ""}</div>
    <h1>${nb(g.uz)}</h1>
    <p class="sub" lang="tr">${esc(g.tr)}</p>
  </div>
  <p class="lead">${esc(g.lead)}</p>
  <ul class="rules">${g.points.map(p => `<li><span>${esc(p)}</span></li>`).join("")}</ul>
  <div class="table-wrap glass" tabindex="0" role="region" aria-label="Jadval"><table class="gtable">
    <thead><tr>${t.head.map(h => `<th scope="col">${esc(h)}</th>`).join("")}</tr></thead>
    <tbody>${(tc => t.rows.map(r => `<tr>${r.map((c, j) => tdTr(tc[j], esc(c))).join("")}</tr>`).join(""))(trCols(t.head, t.rows))}</tbody>
  </table></div>
  <div class="tip glass">${ICON.bulb}<div><b>Oʻzbekcha bilan solishtiring</b>${esc(g.compare)}</div></div>
  <section class="section">
    <div class="section-head"><h2>Misollar</h2></div>
    <div class="words glass">${g.examples.map(e => `<div class="word"><button class="say" data-act="say" data-t="${esc(e[0])}" aria-label="${esc(e[0])} — tinglash">${ICON.speak}</button><div><div class="word-tr" lang="tr">${esc(e[0])}</div><div class="word-uz">${esc(e[1])}</div></div><span></span></div>`).join("")}</div>
  </section>
  <section class="section">
    <div class="section-head"><h2>Oʻzingizni tekshiring</h2><span class="tag violet-t">+${XP_VAL.grammar} XP</span></div>
    ${g.quiz.map((q, qi) => gqHtml(g, qi)).join("")}
  </section>
  ${next ? `<button class="btn btn-grad btn-block" data-act="go" data-to="grammar-${gi + 2}">Keyingi: ${nb(next.uz)}</button>`
         : `<button class="btn btn-soft btn-block" data-act="go" data-to="grammar">Barcha mavzular</button>`}`;
}

/* ---------- Grammar guide (written from the A1–B2 handbook, in the site's own design) ---------- */
let GUIDE_LV = "A1", GUIDE_Q = "";
// "gel[iyor][um]" → stem with highlighted suffixes
const sfx = t => esc(t).replace(/\[([^\]]+)\]/g, '<span class="sfx">$1</span>');
const plainSfx = t => t.replace(/[\[\]]/g, "");
function guideRow(i) {
  const st = BX[i.code] ? (gxDone(i.code) ? `<span class="state done" style="width:24px;height:24px" title="Mashq bajarilgan">${ICON.check}</span>` : `<span class="pg">${gxSolved(i.code)}/${BX[i.code].length}</span>`) : ICON.chev;
  return `<a class="toc-row" href="#${gHash(i.code)}"><span class="code">${esc(i.code)}</span>
    <span><b>${esc(i.uz)}</b><small lang="tr">${esc(i.tr)}</small></span>${st}</a>`;
}
function guideHits() {
  const q = plain(GUIDE_Q.trim());
  if (q.length < 2) return "";
  const hits = GUIDE_ALL.filter(i => plain([i.code, i.tr, i.uz, i.rule || "", typeof i.forms === "string" ? i.forms : "", plainSfx(i.ex ? i.ex.join(" ") : "")].join(" ")).includes(q));
  return hits.length ? `<div class="glass words">${hits.map(guideRow).join("")}</div>` : `<div class="glass empty"><b>“${esc(GUIDE_Q)}” topilmadi</b></div>`;
}
function viewGuide() {
  const lv = GUIDE.find(l => l.id === GUIDE_LV) || GUIDE[1], nx = gxNext(), ms = gxMistakes().length;
  return `${topbar()}
  ${libHead("Grammatika")}
  <label class="search glass" for="gq">${ICON.search}<span class="sr">Grammatikadan qidirish</span><input id="gq" type="search" placeholder="Qidirish: iyor, kelishik, -lar…" value="${esc(GUIDE_Q)}" autocomplete="off" lang="tr"></label>
  <div id="guide-hits">${guideHits()}</div>
  <a class="pcard glass" href="#gx" style="color:inherit;text-decoration:none">
    <div class="pcard-head"><b>${ICON.quiz}Qoidalar mashqi</b><span>${gxDoneCount()}/${GX_CODES.length}</span></div>
    <div class="bar"><i style="width:${pct(gxDoneCount(), GX_CODES.length)}%"></i></div>
    <small class="muted">Keyingisi: ${esc(nx)} ${esc((gxTopic(nx) || {}).uz || "")}${ms ? ` · ${ms} ta xato qayta ishlashni kutyapti` : ""}</small>
  </a>
  <p class="sub">Har mavzu: formula, shakllar, qoida, misol va mashq. Tartib bilan boring — oʻzbek tili bilan solishtirib tushuntirilgan.</p>
  <div class="chips">${GUIDE.map(l => `<button class="chip" data-act="guide-lv" data-l="${l.id}" aria-pressed="${l.id === lv.id}">${esc(l.name)}</button>`).join("")}</div>
  <div class="level-head"><b>${esc(lv.name)}</b><span>${esc(lv.uz)}${gxCount(lv.id) ? ` · ${gxDoneCount(lv.id)}/${gxCount(lv.id)} mashq` : ""}</span></div>
  ${lv.id === "A1" ? `<details class="glass fold"><summary><span class="art violet"><span style="font-size:13px">10</span></span>
    <span class="unit-body"><span class="unit-title">Tez boshlash: 10 ta qisqa dars</span><span class="unit-sub">Eng muhim qoidalar jadval va test bilan · ${gramCount()}/${GRAMMAR.length}</span></span>${pctRing(gramCount() / GRAMMAR.length)}</summary>
    <div class="list">${GRAMMAR.map(gramRow).join("")}</div></details>` : ""}
  ${lv.groups.map(g => `<div class="glass words"><div class="toc-group">${esc(g.name)}</div>${g.items.map(guideRow).join("")}</div>`).join("")}`;
}
function guideTable(t) {
  return `<div class="table-wrap glass" tabindex="0" role="region" aria-label="Jadval"><table class="gtable g-forms">
    <thead><tr>${t.h.map(h => `<th scope="col">${esc(h)}</th>`).join("")}</tr></thead>
    <tbody>${(tc => t.r.map(r => `<tr>${r.map((c, j) => tdTr(tc[j], sfx(c))).join("")}</tr>`).join(""))(trCols(t.h, t.r))}</tbody>
  </table></div>`;
}
function viewGuideTopic(i) {
  S.guideLast = i.code; save();
  const idx = GUIDE_ALL.indexOf(i), prev = GUIDE_ALL[idx - 1], next = GUIDE_ALL[idx + 1];
  const line = (label, pair, cls) => pair ? `<div class="g-line"><span class="tag ${cls}">${label}</span><div><div class="g-tr" lang="tr">${sfx(pair[0])}</div><div class="word-uz">${esc(pair[1])}</div></div></div>` : "";
  return `<div><a class="back" href="#grammar">${ICON.back}Grammatika</a></div>
  <div class="lesson-head">
    <div class="tags"><span class="tag sky-t">${esc(i.code)}</span><span class="tag violet-t">${esc(i.group)}</span>${BX[i.code] && gxDone(i.code) ? `<span class="tag green-t">${ICON.check}Mashq bajarilgan</span>` : ""}</div>
    <h1>${nb(i.uz)}</h1>
    <p class="sub" lang="tr">${esc(i.tr)}</p>
  </div>
  ${i.f ? `<div class="g-formula"><div class="g-f-tr" lang="tr">${esc(i.f[0])}</div><div class="g-f-uz">${esc(i.f[1])}</div></div>` : ""}
  ${i.forms ? `<section class="section"><div class="section-head"><h2>Shakllar</h2></div>${typeof i.forms === "string" ? `<div class="glass pad g-forms-text"${/[ʻʼqx]|sh|ch/i.test(i.forms) ? "" : ' lang="tr"'}>${sfx(i.forms)}</div>` : guideTable(i.forms)}</section>` : ""}
  <div class="tip glass">${ICON.bulb}<div><b>Qoida</b>${esc(i.rule)}${i.note ? `<div style="margin-top:6px">${esc(i.note)}</div>` : ""}</div></div>
  <section class="section"><div class="section-head"><h2>Misol</h2></div>
    <div class="glass g-ex"><div style="min-width:0"><div class="g-tr big" lang="tr">${sfx(i.ex[0])}</div><div class="word-uz">${esc(i.ex[1])}</div></div>
      <button class="say" data-act="say" data-t="${esc(plainSfx(i.ex[0]))}" aria-label="Tinglash">${ICON.speak}</button></div>
    ${i.neg || i.q ? `<div class="glass words">${line("Boʻlishsiz", i.neg, "pink-t")}${line("Soʻroq", i.q, "sky-t")}</div>` : ""}
  </section>
  ${BX[i.code] ? `<section class="section"><div class="section-head"><h2>Mashq</h2><span class="tag sky-t">+${XP_VAL.grammar} XP</span></div><div class="list">${gxRow(i.code)}</div></section>` : ""}
  <div class="pager" style="grid-template-columns:1fr 1fr">
    ${prev ? `<a class="btn btn-ghost" href="#${gHash(prev.code)}">${ICON.back}${esc(prev.code)}</a>` : "<span></span>"}
    ${next ? `<a class="btn btn-grad" href="#${gHash(next.code)}">${esc(next.code)}${ICON.chev.replace('class="chev"', 'style="width:20px;height:20px"')}</a>` : "<span></span>"}
  </div>`;
}
function gxRow(c) {
  const tp = gxTopic(c), n = BX[c].length, k = gxSolved(c);
  return `<button class="unit glass" data-act="gx-start" data-c="${c}">
    <span class="art ${gxDone(c) ? "green" : "sky"}"><span style="font-size:13px">${c}</span></span>
    <span class="unit-body"><span class="unit-title">${esc(tp ? tp.uz : c)}</span><span class="unit-sub"><span lang="tr">${esc(tp ? tp.tr : "")}</span> · ${n} ta mashq</span></span>
    ${pctRing(k / n)}
  </button>`;
}
let GX_LV = "";
function viewGx() {
  const ms = gxMistakes();
  const lvs = GUIDE.filter(l => gxCount(l.id));
  const lv = (lvs.find(l => l.id === GX_LV) || lvs.find(l => gxDoneCount(l.id) < gxCount(l.id)) || lvs[0]).id;
  return `<div><button class="back" data-act="go" data-to="grammar">${ICON.back}Grammatika</button></div>
  <div class="lesson-head">
    <div class="tags"><span class="tag sky-t">${ICON.quiz}A1–C1 · ${GX_CODES.length} mavzu</span><span class="tag green-t">${gxDoneCount()} tugallangan</span></div>
    <h1>Qoidalar mashqi</h1>
    <p class="sub">Har mavzu qoʻllanmadagi qoida asosida: variant tanlash, toʻldirib yozish va gap tuzish.</p>
  </div>
  ${ms.length ? `<button class="pcard glass" data-act="start" data-mode="gxm"><div class="pcard-head"><b>${ICON.target}Qoida xatolari</b><span class="badge">${ms.length}</span></div><p class="muted">Xato qilgan mashqlaringizni qayta ishlang.</p></button>` : ""}
  <div class="chips">${lvs.map(l => `<button class="chip" data-act="gx-lv" data-l="${l.id}" aria-pressed="${l.id === lv}" style="gap:5px;padding:9px 12px">${esc(l.name)}<small style="font-weight:600">${gxDoneCount(l.id)}/${gxCount(l.id)}</small></button>`).join("")}</div>
  ${LEVEL_GROUPS(lv).map(g => `<div class="toc-group" style="padding-left:2px">${esc(g.name)}</div><div class="list">${g.codes.map(gxRow).join("")}</div>`).join("")}`;
}
function LEVEL_GROUPS(lv) {
  const out = [];
  GUIDE_ALL.forEach(i => { if (!BX[i.code] || (lv && i.level !== lv)) return; let g = out[out.length - 1]; if (!g || g.name !== i.group) out.push(g = { name: i.group, codes: [] }); g.codes.push(i.code); });
  return out;
}
/* ---------- Alphabet ---------- */
let letterSel = 2;
function viewAlphabet() {
  const L = LETTERS[letterSel];
  return `${topbar()}
  ${libHead("Alifbo")}
  <p class="sub">Turk alifbosida 29 harf bor, Q, X va W yoʻq. Harfni bosing va misolni tinglang.</p>
  <div class="letter-detail glass">
    <span class="big" lang="tr">${esc(L[0])}</span>
    <div><div style="font-weight:800;font-size:18px" lang="tr">${esc(L[1])}</div><div class="muted" style="font-weight:600">${esc(L[2])}</div><div style="font-size:14px;margin-top:2px;color:var(--ink-2)">${esc(L[3])}</div></div>
    <button class="say" data-act="say" data-t="${esc(L[1])}" aria-label="${esc(L[1])} — tinglash">${ICON.speak}</button>
  </div>
  <div class="legend"><i></i>Oʻzbek lotin yozuvidan farq qiladigan harflar</div>
  <div class="letters">${LETTERS.map((l, i) => `<button class="letter glass${l[4] ? " diff" : ""}" data-act="letter" data-i="${i}" aria-pressed="${i === letterSel}">
    <span class="big" lang="tr">${esc(l[0])}</span><span class="ex" lang="tr">${esc(l[1])}</span><span class="hint">${esc(l[4] ? l[3] : l[2])}</span></button>`).join("")}</div>`;
}

/* ---------- Practice ---------- */
const mins = n => Math.max(1, Math.round(n * 0.25));
// One card for every mistake notebook: words, listening, speaking, grammar rules
function mistakesCard() {
  const w = mistakeWords().length, l = lsmList("l").length, sp = lsmList("s").length, g = gxMistakes().length, n = w + l + sp + g;
  const btn = (k, mode, ico, label, dis) => k ? `<button class="btn btn-soft mis-btn" data-act="start" data-mode="${mode}" data-u="${mode}" ${dis ? "disabled" : ""}>${ICON[ico]}${label}<span class="badge">${k}</span></button>` : "";
  return `<div class="pcard glass">
    <div class="pcard-head"><b>${ICON.target}Xatolar daftari</b>${n ? `<span class="badge">${n}</span>` : ""}</div>
    ${n ? `<p class="muted">Xato qilganlaringiz shu yerda. Ikki marta toʻgʻri javob bersangiz, daftardan chiqadi.</p>
    <div class="mis-row">${btn(w, "mistakes", "cards", "Soʻzlar")}${btn(g, "gxm", "cap", "Qoidalar")}${btn(l, "lmis", "ear", "Tinglash")}${btn(sp, "smis", "mic", "Gapirish", !canListen())}</div>`
    : `<p class="muted">Hozircha boʻsh. Mashqlarda xato qilgan soʻz, qoida, tinglash va gapirish savollari shu yerga tushadi.</p>`}
  </div>`;
}
function viewPractice() {
  const due = dueWords(), fresh = newWords(Math.min(newLeft(), NEW_PER_DAY)), items = due.slice(0, 20).concat(fresh);
  const done = skToday(), adv = (recs().find(x => x.sk) || {}).sk;
  const mis = mistakeWords().length + lsmList("l").length + lsmList("s").length + gxMistakes().length;
  const stat = id => { const v = id === "s" ? S.pron : S.sk[id]; return v[1] ? `${pct(v[0], v[1])}% toʻgʻri` : "Boshlanmagan"; };
  const SK_GO = { r: 'href="#oqish"', l: 'data-act="sk-go" data-s="l"', w: 'data-act="sk-go" data-s="w"', s: 'data-act="sk-go" data-s="s"' };
  return `${topbar()}${learnTabs("practice")}
  <button class="pcard ai" data-act="start" data-mode="review" ${items.length ? "" : "disabled"}>
    <div class="pcard-head"><b>${ICON.spark}Aqlli takrorlash</b><span>~${mins(items.length)} daq</span></div>
    <p>${items.length ? `${due.length} ta takrorlash va ${fresh.length} ta yangi soʻz — maʼno, yozish, tinglash va talaffuz bitta mashqda.` : "Bugungi takrorlash bajarildi. Ertaga yangi soʻzlar keladi."}</p>
  </button>

  <section class="section">
    <div class="section-head"><h2>Koʻnikmalar</h2><a class="link" href="#skills">Natijalar</a></div>
    <div class="sk-grid">${SKILLS.map(sk => { const g = SK_GO[sk.id], off = sk.id === "s" && !canListen(), on = done.includes(sk), tip = adv === sk.id;
      const inner = `<span class="ico ${sk.c}-t">${ICON[sk.ico]}</span><b>${sk.uz}</b><span class="sk-stat">${off ? "Bu brauzerda ishlamaydi" : stat(sk.id)}</span>${tip ? `<span class="tag violet-t sk-tip">Tavsiya</span>` : ""}${on ? `<span class="sk-done" aria-label="Bugun bajarildi">${ICON.check}</span>` : ""}`;
      return g.startsWith("href") ? `<a class="sk-tile glass${tip ? " tip" : ""}" ${g}>${inner}</a>` : `<button class="sk-tile glass${tip ? " tip" : ""}" ${g} ${off ? "disabled" : ""}>${inner}</button>`; }).join("")}</div>
  </section>

  <div class="lrows glass">
    ${lrow('href="#gx"', "cap", "violet", "Qoidalar mashqi", `${gxDoneCount()}/${GX_CODES.length} mavzu · keyingisi: ${esc((gxTopic(gxNext()) || {}).uz || gxNext())}`)}
    ${lrow('data-act="start" data-mode="morf"', "spark", "teal", "Qoʻshimchalar mashqi", "Soʻzga toʻgʻri qoʻshimcha qoʻshish")}
    ${lrow('data-act="modes-all"', "list", "sky", "Boshqa mashq turlari", "Kartochka, test, diktant, talaffuz…")}
  </div>

  ${mis ? mistakesCard() : ""}`;
}

/* ---------- Leaderboard ---------- */
let RANK_TAB = "week", RANK_CACHE = {};
const RANK_TABS = { day: ["Bugun", "Bugun eng koʻp XP toʻplaganlar"], week: ["Hafta", "Liga ichidagi haftalik reyting · har dushanba yangilanadi"], fr: ["Doʻstlar", "Doʻstlaringiz bilan haftalik bellashuv"], all: ["Umumiy", "Eng yuqori darajali oʻquvchilar"] };
function viewRank() {
  const lg = lgOf(S.lg), r = S.lgr;
  return `${topbar()}
  <div><h1 class="page-title">Reyting</h1><p class="sub">${RANK_TABS[RANK_TAB][1]}</p></div>
  <div class="seg glass" role="tablist">
    ${Object.keys(RANK_TABS).map(t => `<button role="tab" data-act="rank-tab" data-t="${t}" aria-selected="${RANK_TAB === t}">${RANK_TABS[t][0]}</button>`).join("")}
  </div>
  ${RANK_TAB === "week" ? `<div class="glass pad lg-card">
    ${lgBadge(lg.n, "lg-big")}
    <div><b>${lg.uz} ligasi</b><small class="muted">${lg.n < 7 ? `Haftaning eng yaxshi ${Math.round(LG_UP * 100)}% oʻquvchisi (kamida ${LG_MIN} XP) ${lgOf(lg.n + 1).uz} ligasiga chiqadi` : "Eng yuqori liga — chempionlar shu yerda"}</small>
    ${r && r.w ? `<small class="muted">Oʻtgan hafta: ${r.xp} XP${r.rank ? ` · ${r.rank}-oʻrin (${r.n} kishi)` : ""} · ${r.to > r.from ? "koʻtarildingiz ⬆" : r.to < r.from ? "tushdingiz ⬇" : "oʻz ligangizda qoldingiz"}</small>
    ${r.xp > 0 ? `<button class="link" data-act="recap" style="align-self:flex-start">Hafta yakunini koʻrish</button>` : ""}` : ""}</div>
    <div class="lg-path">${LEAGUES.map(l => `<span class="${l.n === lg.n ? "on" : ""}" title="${l.uz}">${lgBadge(l.n)}</span>`).join("")}</div>
  </div>` : ""}
  <div id="rank-body"><div class="glass empty"><div class="spin"></div>Yuklanmoqda…</div></div>`;
}
// Fetch leaderboard photos once per session and drop them into the rendered rows
function loadRankPhotos(ids) {
  ids.filter(id => !(id in AV_CACHE) && id !== USER.uid).forEach(id => {
    AV_CACHE[id] = "";
    db.collection("avatars").doc(id).get().then(d => {
      const ph = d.exists && d.data().photo;
      if (!ph) return;
      AV_CACHE[id] = ph;
      document.querySelectorAll(`[data-av="${CSS.escape(id)}"]`).forEach(el => { const a = el.querySelector(".avatar"); if (a) a.outerHTML = avatarHTML(ph, id); else el.innerHTML = avatarHTML(ph, id); });
    }).catch(() => {});
  });
}
async function loadRank() {
  const box = $("rank-body");
  if (!box) return;
  if (!FB || !USER) {
    box.innerHTML = `<div class="glass empty">${mascot("trophy")}<b>Reyting hisob bilan ishlaydi</b><span class="muted">Hisobga kirsangiz, boshqa oʻquvchilar bilan bellasha olasiz.</span></div>`;
    return;
  }
  const tab = RANK_TAB, cached = RANK_CACHE[tab];
  let rows;
  if (cached && Date.now() - cached.t < 60000) rows = cached.rows;
  else {
    try {
      const ref = db.collection("league");
      const snap = tab === "fr" ? { docs: (await Promise.all(frList().concat([USER.uid]).map(id => ref.doc(id).get().catch(() => null)))).filter(d => d && d.exists) }
        : tab === "week" ? await ref.where("week", "==", weekKey()).limit(300).get()
        : tab === "day" ? await ref.where("day", "==", todayKey()).limit(300).get()
        : await ref.orderBy("xp", "desc").limit(100).get();
      rows = snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
      RANK_CACHE[tab] = { t: Date.now(), rows };
    } catch (e) {
      if ($("rank-body")) $("rank-body").innerHTML = `<div class="glass empty">${mascot("trophy")}<b>Reytingni yuklab boʻlmadi</b><span class="muted">${e && e.code === "permission-denied" ? "Reyting hali sozlanmagan (Firestore qoidalari)." : "Internet aloqasini tekshiring."}</span></div>`;
      return;
    }
  }
  if (tab !== RANK_TAB || !$("rank-body")) return;
  const key = tab === "week" || tab === "fr" ? "wxp" : tab === "day" ? "dxp" : "xp";
  // Friends: this week's XP only counts for rows of this week
  if (tab === "fr") rows = rows.map(r => r.week === weekKey() || r.id === USER.uid ? r : Object.assign({}, r, { wxp: 0 }));
  // My own row always shows the latest local numbers; the weekly table is the table of my league
  const mine = rows.find(r => r.id === USER.uid);
  if (mine) { mine.wxp = S.wxp; mine.xp = S.xp; mine.lg = S.lg; if (S.day === todayKey()) mine.dxp = S.dayXp; }
  if (tab === "fr") return frRender(rows);
  rows = rows.filter(r => r[key] > 0 && (tab !== "week" || (r.lg || 1) === (S.lg || 1))).sort((a, b) => b[key] - a[key]);
  const upN = tab === "week" && S.lg < 7 ? Math.max(1, Math.ceil(rows.length * LG_UP)) : 0;
  const sub = r => tab === "all" ? `${lvlOf(r.xp)}-daraja · ${lgOf(r.lg).uz}` : `${r.streak || 0} kun ketma-ket`;
  if (!rows.length) {
    $("rank-body").innerHTML = `<div class="glass empty">${mascot("trophy")}<b>Hali hech kim yoʻq</b><span class="muted">Pamuk birinchi boʻlishingizni kutyapti: mashq qilib XP toʻplang.</span></div>`;
    return;
  }
  const me = rows.findIndex(r => r.id === USER.uid);
  const pod = i => { const r = rows[i]; if (!r) return "<div></div>"; const fr = frameOf(r.xp, r.lg); return `<div class="pod${i === 0 ? " first" : ""}">
      ${i === 0 && fr === 7 ? `<span class="crown" aria-hidden="true"></span>` : i === 0 ? `<svg class="crown" viewBox="0 0 24 18" fill="#ffc83d" aria-hidden="true"><path d="M2 5l5 4 5-8 5 8 5-4-2 12H4z"/></svg>` : `<span class="place">${i + 1}</span>`}
      <span data-av="${esc(r.id)}">${avatarHTML(r.id === USER.uid ? MYPHOTO : AV_CACHE[r.id], r.id, "", { n: fr, lv: lvlOf(r.xp) })}</span>
      <b>${esc(r.name || "Oʻquvchi")}</b><span>${r[key]} XP${tab === "all" ? ` · ${lvlOf(r.xp)}-dar.` : ""}</span><i class="ped" aria-hidden="true">${i + 1}</i></div>`; };
  $("rank-body").innerHTML = `<div class="glass podium">${pod(1)}${pod(0)}${pod(2)}</div>
    ${rows.length > 3 ? `<div class="glass words" style="margin-top:12px">${rows.slice(3, 50).map((r, i) => `<div class="rank-row${r.id === USER.uid ? " me" : ""}">
      <span class="n">${i + 4}</span><span data-av="${esc(r.id)}">${avatarHTML(r.id === USER.uid ? MYPHOTO : AV_CACHE[r.id], r.id, "", { n: frameOf(r.xp, r.lg) })}</span>
      <span style="min-width:0"><b>${esc(r.name || "Oʻquvchi")}</b><small>${sub(r)}</small></span><span class="xp">${r[key]} XP</span></div>${i + 4 === upN && rows.length > upN ? `<div class="lg-zone">⬆ Koʻtarilish zonasi</div>` : ""}`).join("")}</div>` : ""}
    <p class="sub" style="text-align:center;margin-top:12px">${me >= 0 ? `Siz ${me + 1}-oʻrindasiz · eng yaxshi ${Math.max(1, Math.round((me + 1) / rows.length * 100))}%` : S.pub ? "Mashq qilib XP toʻplang, shunda reytingda paydo boʻlasiz." : "Siz reytingda koʻrinmaysiz. Buni Profil → Sozlamalarda yoqish mumkin."}</p>`;
  loadRankPhotos(rows.slice(0, 50).map(r => r.id));
}

function frRender(rows) {
  rows = rows.sort((a, b) => (b.wxp || 0) - (a.wxp || 0) || (b.xp || 0) - (a.xp || 0));
  const others = rows.filter(r => r.id !== USER.uid);
  const hidden = frList().length - others.length;
  $("rank-body").innerHTML = `${others.length ? `<div class="glass words">${rows.map((r, i) => `<div class="rank-row${r.id === USER.uid ? " me" : ""}">
      <span class="n">${i + 1}</span><span data-av="${esc(r.id)}">${avatarHTML(r.id === USER.uid ? MYPHOTO : AV_CACHE[r.id], r.id, "", { n: frameOf(r.xp, r.lg) })}</span>
      <span style="min-width:0"><b>${esc(r.id === USER.uid ? "Siz" : r.name || "Oʻquvchi")}</b><small>${lvlOf(r.xp)}-daraja · ${lgOf(r.lg).uz} · ${r.streak || 0} kun</small></span>
      <span class="xp">${r.wxp || 0} XP${r.id === USER.uid ? "" : `<button class="fr-x" data-act="fr-del" data-u="${esc(r.id)}" aria-label="Doʻstlikdan olib tashlash">×</button>`}</span></div>`).join("")}</div>
    ${hidden > 0 ? `<p class="sub" style="text-align:center">${hidden} ta doʻstingiz reytingda koʻrinishni oʻchirgan</p>` : ""}`
    : `<div class="glass empty">${mascot("wave")}<b>Hali doʻstlar yoʻq</b><span class="muted">Doʻstlaringizni taklif qiling — birga oʻrganish qiziqroq va natija yuqoriroq boʻladi.</span></div>`}
  ${frInviteBox()}`;
  CatLife.scan();
  loadRankPhotos(others.map(r => r.id));
}

/* ---------- Profile & statistics ---------- */
function viewProfile() {
  const l7 = last7(), xpv = l7.map(d => dayGet(d.k).xp), minv = l7.map(d => Math.round(dayGet(d.k).sec / 60));
  const isPass = USER && USER.providerData.some(p => p.providerId === "password");
  const range = `${keyOf(dayNum() - 6).slice(5).split("-").reverse().join(".")} – ${todayKey().slice(5).split("-").reverse().join(".")}`;
  const th = (() => { try { return localStorage.getItem("ty-theme") || "auto"; } catch (e) { return "auto"; } })();
  return `<div class="top"><h1 class="page-title">Profil</h1><a class="icon-btn gear-btn" href="#settings" aria-label="Sozlamalar">${ICON.gear}</a></div>
  <div class="profile-card glass">
    <button class="avatar-edit" data-act="photo"><span class="sr">Profil rasmini oʻzgartirish, daraja: </span>${avatarHTML(MYPHOTO, USER ? USER.uid : "me", "lg", { n: myFrame(), lv: lvlOf(S.xp) })}<span class="cam">${ICON.camera}</span>${genderSticker()}</button>
    <input type="file" id="photo-input" accept="image/*" hidden>
    <div class="pc-txt"><b>${esc(USERNAME || (USER ? "Oʻquvchi" : "Mehmon"))}</b><span>${esc(USER ? USER.email || (/^tg\d+$/.test(USER.uid) ? "Telegram hisobi" : "") : "Hisobsiz rejim")}</span>
      ${PROFILE.birth ? `<span style="display:block">${esc(birthText(PROFILE.birth))}</span>` : ""}
      <div class="tags" style="margin-top:6px">${USER && USER.emailVerified ? `<span class="tag green-t">${ICON.check}Tasdiqlangan</span>` : ""}${MYPHOTO ? `<button class="tag pink-t" data-act="photo-remove">Rasmni olib tashlash</button>` : `<button class="tag violet-t" data-act="photo">Rasm qoʻyish</button>`}</div></div>
  </div>
  ${isPass && !USER.emailVerified ? `<div class="notice"><div><b>Pochtangizni tasdiqlang.</b> ${esc(USER.email)} manziliga xat yubordik.</div><button class="btn btn-ghost" data-act="verify-again">Xatni qayta yuborish</button></div>` : ""}

  ${pamukHero()}

  <section class="section">
    <div class="section-head"><h2>Statistika</h2></div>
    <div class="stat-grid">
      <div class="stat glass"><span class="ico orange-t">${ICON.flame}</span><span><b>${streakNow()}</b><span>Ketma-ket kun · eng yaxshi ${S.best}</span></span></div>
      <div class="stat glass"><span class="ico violet-t">${ICON.star}</span><span><b>${S.xp}</b><span>Jami XP · ${lvlOf(S.xp)}-daraja</span></span></div>
      <div class="stat glass"><span class="ico sky-t">${ICON.book}</span><span><b>${learnedCount()}</b><span>Oʻrganilgan soʻz</span></span></div>
      <div class="stat glass"><span class="ico green-t">${ICON.quiz}</span><span><b>${S.acc[1] ? pct(S.acc[0], S.acc[1]) + "%" : "—"}</b><span>Toʻgʻri javoblar</span></span></div>
    </div>
  </section>

  ${skillsProfileCard()}
  <div class="chart-card glass"><h3>Haftalik faollik</h3><span class="range">${range} · XP</span>${lineChart(xpv, l7.map(d => d.l))}
    <h3 style="margin-top:14px">Oʻqish vaqti</h3><span class="range">daqiqa</span>${barChart(minv, l7.map(d => d.l))}</div>
`;
}
