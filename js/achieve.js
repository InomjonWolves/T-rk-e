/* Türkçe Yoʻl — Achievements, tips and sharing, install and help, the first-run tour.
   One of the app's scripts (js/, loaded in order by index.html); they share one global scope. */

/* ---------- Achievements: categories, unlock celebration ---------- */
const ACH_CATS = [["elite", "Mahorat sinovlari"], ["learn", "Soʻzlar"], ["streak", "Seriya"], ["course", "Kurs"], ["gram", "Grammatika"], ["practice", "Mashq"], ["social", "Reyting va doʻstlar"], ["life", "Faollik"]];
// Rarity: the harder the task, the rarer the sticker and the bigger the reward
const ACH_TIERS = [null, { uz: "Oddiy", xp: 20 }, { uz: "Nodir", xp: 40 }, { uz: "Epik", xp: 80 }, { uz: "Afsonaviy", xp: 150 }];
const achTier = a => a.r || 1;
// Days (kept ~4 months): the best day, days with all four skills, the longest run of days with the daily goal met
const dayVals = () => Object.values(S.days || {});
const bestDay = f => Math.max(0, ...dayVals().map(f));
const fourDays = () => dayVals().filter(d => d.sk && Object.values(d.sk).filter(a => a[1]).length >= 4).length;
function goalRun() {
  let best = 0, run = 0;
  for (let i = 119; i >= 0; i--) { const d = S.days && S.days[keyOf(dayNum() - i)]; run = d && d.xp >= (S.goal || 30) ? run + 1 : 0; best = Math.max(best, run); }
  return best;
}
const plRank = () => { const p = S.place && (S.place.passed || S.place.applied); return p ? LVS.indexOf(p) + 1 : 0; };
const ACH = [
  { id: "w10", cat: "learn", t: "Ilk 10 soʻz", d: "10 ta soʻz oʻrganildi", v: learnedCount, n: 10, c: "sky", ico: "book" },
  { id: "w50", cat: "learn", t: "50 ta soʻz", d: "50 ta soʻz oʻrganildi", v: learnedCount, n: 50, c: "sky", ico: "book" },
  { id: "w200", cat: "learn", t: "200 ta soʻz", d: "200 ta soʻz oʻrganildi", v: learnedCount, n: 200, c: "green", ico: "book" },
  { id: "w500", r: 2, cat: "learn", t: "500 ta soʻz", d: "500 ta soʻz oʻrganildi", v: learnedCount, n: 500, c: "violet", ico: "crown" },
  { id: "w1000", r: 3, cat: "learn", t: "Soʻz ustasi", d: "1000 ta soʻz oʻrganildi", v: learnedCount, n: 1000, c: "pink", ico: "crown" },
  { id: "s3", cat: "streak", t: "3 kun", d: "3 kun ketma-ket", v: () => S.best, n: 3, c: "orange", ico: "flame" },
  { id: "s7", cat: "streak", t: "1 hafta", d: "7 kun ketma-ket", v: () => S.best, n: 7, c: "orange", ico: "flame" },
  { id: "s14", r: 2, cat: "streak", t: "2 hafta", d: "14 kun ketma-ket", v: () => S.best, n: 14, c: "orange", ico: "flame" },
  { id: "s30", r: 3, cat: "streak", t: "1 oy", d: "30 kun ketma-ket", v: () => S.best, n: 30, c: "pink", ico: "flame" },
  { id: "s100", r: 4, cat: "streak", t: "100 kun", d: "100 kun ketma-ket", v: () => S.best, n: 100, c: "violet", ico: "crown" },
  { id: "k1", cat: "course", t: "Ilk boʻlim", d: "Kursning 1 boʻlimi tugadi", v: () => kDoneCount(), n: 1, c: "sky", ico: "flag" },
  { id: "kA1", r: 2, cat: "course", t: "A1 bitiruvchisi", d: "A1 ning 8 boʻlimi", v: () => kDoneCount("A1"), n: 8, c: "sky", ico: "cap" },
  { id: "kA2", r: 2, cat: "course", t: "A2 bitiruvchisi", d: "A2 ning 8 boʻlimi", v: () => kDoneCount("A2"), n: 8, c: "violet", ico: "cap" },
  { id: "kB1", r: 3, cat: "course", t: "B1 bitiruvchisi", d: "B1 ning 8 boʻlimi", v: () => kDoneCount("B1"), n: 8, c: "orange", ico: "cap" },
  { id: "kB2", r: 3, cat: "course", t: "B2 bitiruvchisi", d: "B2 ning 8 boʻlimi", v: () => kDoneCount("B2"), n: 8, c: "pink", ico: "cap" },
  { id: "kC1", r: 4, cat: "course", t: "C1 bitiruvchisi", d: "C1 ning 8 boʻlimi", v: () => kDoneCount("C1"), n: 8, c: "teal", ico: "cap" },
  { id: "kt1", cat: "course", t: "Test gʻolibi", d: "1 ta daraja testidan oʻtish", v: () => COURSE.levels.filter(l => kTestBest(l.id) >= l.test.pass).length, n: 1, c: "teal", ico: "star" },
  { id: "kt4", r: 3, cat: "course", t: "A1 → C1", d: "5 ta testdan oʻtish", v: () => COURSE.levels.filter(l => kTestBest(l.id) >= l.test.pass).length, n: 5, c: "green", ico: "crown" },
  { id: "gram", cat: "gram", t: "Grammatika", d: "10 asosiy mavzu", v: gramCount, n: GRAMMAR.length, c: "violet", ico: "cap" },
  { id: "gx10", cat: "gram", t: "Qoida ustasi", d: "10 ta qoida mashqi", v: () => gxDoneCount(), n: 10, c: "sky", ico: "quiz" },
  { id: "gxa1", r: 2, cat: "gram", t: "A1 qoidalari", get d() { return `A1 ning ${GRAM_FULL ? gxCount("A1") : "barcha"} ta qoida mashqi`; }, v: () => gxDoneCount("A1"), get n() { return gxN("A1"); }, c: "green", ico: "crown" },
  { id: "gxa2", r: 2, cat: "gram", t: "A2 qoidalari", get d() { return `A2 ning ${GRAM_FULL ? gxCount("A2") : "barcha"} ta qoida mashqi`; }, v: () => gxDoneCount("A2"), get n() { return gxN("A2"); }, c: "violet", ico: "crown" },
  { id: "gxb1", r: 3, cat: "gram", t: "B1 qoidalari", get d() { return `B1 ning ${GRAM_FULL ? gxCount("B1") : "barcha"} ta qoida mashqi`; }, v: () => gxDoneCount("B1"), get n() { return gxN("B1"); }, c: "orange", ico: "crown" },
  { id: "gxb2", r: 3, cat: "gram", t: "B2 qoidalari", get d() { return `B2 ning ${GRAM_FULL ? gxCount("B2") : "barcha"} ta qoida mashqi`; }, v: () => gxDoneCount("B2"), get n() { return gxN("B2"); }, c: "pink", ico: "crown" },
  { id: "gxc1", r: 3, cat: "gram", t: "C1 qoidalari", get d() { return `C1 ning ${GRAM_FULL ? gxCount("C1") : "barcha"} ta qoida mashqi`; }, v: () => gxDoneCount("C1"), get n() { return gxN("C1"); }, c: "teal", ico: "crown" },
  { id: "first", cat: "practice", t: "Birinchi qadam", d: "1 ta mashq", v: () => S.sessions, n: 1, c: "violet", ico: "flag" },
  { id: "sess10", cat: "practice", t: "Tirishqoq", d: "10 ta mashq", v: () => S.sessions, n: 10, c: "sky", ico: "bolt" },
  { id: "sess50", r: 2, cat: "practice", t: "Chempion", d: "50 ta mashq", v: () => S.sessions, n: 50, c: "orange", ico: "bolt" },
  { id: "perfect", cat: "practice", t: "Mukammal", d: "xatosiz mashq", v: () => S.perfect, n: 1, c: "pink", ico: "target" },
  { id: "perfect5", r: 2, cat: "practice", t: "Aniq nishon", d: "5 ta xatosiz mashq", v: () => S.perfect, n: 5, c: "pink", ico: "target" },
  { id: "four", cat: "practice", t: "Toʻrt tomonlama", d: "Bir kunda 4 koʻnikmani mashq qilish", v: () => Math.max(0, ...Object.values(S.days).map(d => d.sk ? Object.values(d.sk).filter(a => a[1]).length : 0)), n: 4, c: "violet", ico: "target" },
  { id: "listen50", r: 2, cat: "practice", t: "Ziyrak quloq", d: "Tinglashda 50 ta toʻgʻri javob", v: () => S.sk.l[0], n: 50, c: "sky", ico: "ear" },
  { id: "allA1", r: 3, cat: "course", t: "Har tomonlama", d: "4 koʻnikmada daraja testidan oʻtish", v: () => SKILLS.filter(s => skLevel(s.id)).length, n: 4, c: "teal", ico: "crown" },
  { id: "writer5", r: 2, cat: "practice", t: "Yozuvchi", d: "5 ta yozish topshirigʻida 70+ ball", v: () => Object.values(S.k).reduce((a, st) => a + Object.values(st.wb || {}).filter(v => v >= 70).length, 0), n: 5, c: "pink", ico: "type" },
  { id: "roles3", cat: "practice", t: "Aktyor", d: "3 ta rolli dialogni oʻynash", v: () => S.roles || 0, n: 3, c: "orange", ico: "chat" },
  { id: "pron20", r: 2, cat: "practice", t: "Bulbul", d: "20 ta soʻzni toʻgʻri talaffuz qilish", v: () => S.pron[0], n: 20, c: "green", ico: "mic" },
  { id: "xp1k", cat: "practice", t: "1000 XP", d: "1000 XP toʻplandi", v: () => S.xp, n: 1000, c: "teal", ico: "star" },
  { id: "xp5k", r: 2, cat: "practice", t: "5000 XP", d: "5000 XP toʻplandi", v: () => S.xp, n: 5000, c: "violet", ico: "star" },
  { id: "photo", cat: "life", t: "Yangi qiyofa", d: "Profil rasmi qoʻyildi", v: () => (MYPHOTO ? 1 : 0), n: 1, c: "sky", ico: "camera" },
  { id: "tr10", cat: "life", t: "Tarjimon", d: "10 marta tarjima", v: () => S.trUses || 0, n: 10, c: "teal", ico: "translate" },
  { id: "share", cat: "life", t: "Doʻstlarga ulashdi", d: "Saytni doʻstlarga ulashish", v: () => S.shared || 0, n: 1, c: "green", ico: "heart" },
  { id: "night", cat: "life", t: "Tungi boyqush", d: "22:00 dan keyin mashq", v: () => S.night || 0, n: 1, c: "violet", ico: "moon" },
  { id: "early", cat: "life", t: "Erta qush", d: "07:00 dan oldin mashq", v: () => S.early || 0, n: 1, c: "orange", ico: "sun" },
  // Harder goals (2026-11): more words, longer streaks, the whole course, top results, leagues
  { id: "w2000", r: 3, cat: "learn", t: "Lugʻat xazinasi", d: "2000 ta soʻz oʻrganildi", v: learnedCount, n: 2000, c: "teal", ico: "crown" },
  { id: "w3000", r: 4, cat: "learn", t: "Tirik lugʻat", d: "3000 ta soʻz oʻrganildi", v: learnedCount, n: 3000, c: "orange", ico: "crown" },
  { id: "s60", r: 3, cat: "streak", t: "2 oy", d: "60 kun ketma-ket", v: () => S.best, n: 60, c: "pink", ico: "flame" },
  { id: "s180", r: 4, cat: "streak", t: "Yarim yil", d: "180 kun ketma-ket", v: () => S.best, n: 180, c: "violet", ico: "crown" },
  { id: "s365", r: 4, cat: "streak", t: "Bir yil", d: "365 kun ketma-ket", v: () => S.best, n: 365, c: "orange", ico: "crown" },
  { id: "kAll", r: 4, cat: "course", t: "Toʻliq kurs", d: `Kursning barcha ${COURSE.units.length} boʻlimi`, v: () => kDoneCount(), n: COURSE.units.length, c: "violet", ico: "cap" },
  { id: "ktC1", r: 3, cat: "course", t: "C1 sertifikati", d: "C1 daraja testidan 85%+", v: () => (kTestBest("C1") >= 85 ? 1 : 0), n: 1, c: "teal", ico: "star" },
  { id: "kt90", r: 4, cat: "course", t: "Aʼlochi", d: "Har bir daraja testidan 90%+", v: () => COURSE.levels.filter(l => kTestBest(l.id) >= 90).length, n: COURSE.levels.length, c: "orange", ico: "crown" },
  { id: "plB2", r: 3, cat: "course", t: "Isbotlangan daraja", d: "Darajani aniqlash testida B2 yoki C1", v: () => (plRank() >= 4 ? 1 : 0), n: 1, c: "pink", ico: "target" },
  { id: "gxAll", r: 4, cat: "gram", t: "Grammatika professori", get d() { return `Barcha ${GRAM_FULL ? GX_CODES.length : ""} ta qoida mashqi`.replace("  ", " "); }, v: () => gxDoneCount(), get n() { return gxN(); }, c: "violet", ico: "cap" },
  { id: "gx50", r: 2, cat: "gram", t: "Qoidalar bilimdoni", d: "50 ta qoida mashqi", v: () => gxDoneCount(), n: 50, c: "green", ico: "quiz" },
  { id: "sess200", r: 3, cat: "practice", t: "Marafonchi", d: "200 ta mashq", v: () => S.sessions, n: 200, c: "teal", ico: "bolt" },
  { id: "sess500", r: 4, cat: "practice", t: "Temir iroda", d: "500 ta mashq", v: () => S.sessions, n: 500, c: "violet", ico: "bolt" },
  { id: "perfect25", r: 3, cat: "practice", t: "Snayper", d: "25 ta xatosiz mashq", v: () => S.perfect, n: 25, c: "pink", ico: "target" },
  { id: "perfect100", r: 4, cat: "practice", t: "Benuqson", d: "100 ta xatosiz mashq", v: () => S.perfect, n: 100, c: "orange", ico: "target" },
  { id: "listen300", r: 3, cat: "practice", t: "Musiqiy quloq", d: "Tinglashda 300 ta toʻgʻri javob", v: () => S.sk.l[0], n: 300, c: "sky", ico: "ear" },
  { id: "pron200", r: 3, cat: "practice", t: "Notiq", d: "200 ta soʻzni toʻgʻri talaffuz qilish", v: () => S.pron[0], n: 200, c: "green", ico: "mic" },
  { id: "writer20", r: 3, cat: "practice", t: "Adib", d: "20 ta yozish topshirigʻida 70+ ball", v: () => Object.values(S.k).reduce((a, st) => a + Object.values(st.wb || {}).filter(v => v >= 70).length, 0), n: 20, c: "pink", ico: "type" },
  { id: "writer90", r: 4, cat: "practice", t: "Qalam sohibi", d: "5 ta yozish topshirigʻida 90+ ball", v: () => Object.values(S.k).reduce((a, st) => a + Object.values(st.wb || {}).filter(v => v >= 90).length, 0), n: 5, c: "violet", ico: "type" },
  { id: "roles20", r: 3, cat: "practice", t: "Sahna yulduzi", d: "20 ta rolli dialogni oʻynash", v: () => S.roles || 0, n: 20, c: "orange", ico: "chat" },
  { id: "oq15", r: 3, cat: "practice", t: "Kitobxon", d: "15 ta oʻqish matnida 80%+", v: () => Object.values(S.oq || {}).filter(v => v >= 80).length, n: 15, c: "teal", ico: "book" },
  { id: "xp20k", r: 3, cat: "practice", t: "20 000 XP", d: "20 000 XP toʻplandi", v: () => S.xp, n: 20000, c: "teal", ico: "star" },
  { id: "xp50k", r: 4, cat: "practice", t: "50 000 XP", d: "50 000 XP toʻplandi", v: () => S.xp, n: 50000, c: "orange", ico: "star" },
  { id: "day1k", r: 3, cat: "elite", t: "Rekord kun", d: "Bir kunda 1000 XP", v: () => bestDay(d => d.xp || 0), n: 1000, c: "orange", ico: "bolt" },
  { id: "hour", r: 2, cat: "elite", t: "Bir soatlik dars", d: "Bir kunda 60 daqiqa mashq", v: () => Math.floor(bestDay(d => d.sec || 0) / 60), n: 60, c: "sky", ico: "clock" },
  { id: "four7", r: 3, cat: "elite", t: "Toʻliq muvozanat", d: "7 kun davomida bir kunda 4 koʻnikma", v: fourDays, n: 7, c: "violet", ico: "target" },
  { id: "goal30", r: 4, cat: "elite", t: "Temir intizom", d: "30 kun ketma-ket kunlik XP maqsadi", v: goalRun, n: 30, c: "pink", ico: "flame" },
  { id: "dq7", r: 2, cat: "elite", t: "Vazifa ustasi", d: "7 kun uchala kunlik vazifa", v: () => S.dqn || 0, n: 7, c: "green", ico: "check" },
  { id: "dq30", r: 3, cat: "elite", t: "Vazifa sultoni", d: "30 kun uchala kunlik vazifa", v: () => S.dqn || 0, n: 30, c: "teal", ico: "check" },
  { id: "wc4", r: 3, cat: "elite", t: "Haftalik qahramon", d: "4 ta haftalik challenge", v: () => S.wcn || 0, n: 4, c: "orange", ico: "crown" },
  { id: "wc12", r: 4, cat: "elite", t: "Mavsum gʻolibi", d: "12 ta haftalik challenge", v: () => S.wcn || 0, n: 12, c: "violet", ico: "crown" },
  { id: "lg3", r: 2, cat: "social", t: "Oltin liga", d: "Oltin ligaga chiqish", v: () => S.lg || 1, n: 3, c: "orange", ico: "star" },
  { id: "lg5", r: 3, cat: "social", t: "Olmos liga", d: "Olmos ligaga chiqish", v: () => S.lg || 1, n: 5, c: "sky", ico: "star" },
  { id: "lg7", r: 4, cat: "social", t: "Afsona liga", d: "Eng yuqori — Afsona ligasi", v: () => S.lg || 1, n: 7, c: "pink", ico: "crown" },
  { id: "top3", r: 3, cat: "social", t: "Shohsupa", d: "Haftalik ligada top-3", v: () => (S.lgr && S.lgr.rank && S.lgr.rank <= 3 && S.lgr.n >= 5 ? 1 : 0), n: 1, c: "orange", ico: "trophy" },
  { id: "fr5", r: 2, cat: "social", t: "Doʻstlar davrasi", d: "5 ta doʻst", v: () => frList().length, n: 5, c: "green", ico: "heart" },
  { id: "frame5", r: 3, cat: "social", t: "Olmos ramka", d: "Olmos avatar ramkasini ochish", v: () => myFrame(), n: 5, c: "sky", ico: "crown" },
  { id: "frame7", r: 4, cat: "social", t: "Afsona ramka", d: "Afsona avatar ramkasini ochish", v: () => myFrame(), n: 7, c: "pink", ico: "crown" }
];
// Once earned, an achievement stays (some counts — days kept, the league — can go down later)
const achDone = a => !!(S.achv && S.achv[a.id]) || a.v() >= a.n;
let ACH_QUEUE = [], achTimer;
function checkAch() {
  if (!S.achv) {
    // First run for this profile: record what is already earned without a fanfare
    S.achv = {};
    ACH.forEach(a => { if (achDone(a)) S.achv[a.id] = todayKey(); });
    try { localStorage.setItem(KEYU, JSON.stringify(S)); } catch (e) {}
    return;
  }
  const fresh = ACH.filter(a => !S.achv[a.id] && a.v() >= a.n);
  if (!fresh.length) return;
  fresh.forEach(a => { S.achv[a.id] = todayKey(); addXPBonus(ACH_TIERS[achTier(a)].xp); });
  lvlCheck();
  try { localStorage.setItem(KEYU, JSON.stringify(S)); } catch (e) {}
  cloudSave();
  fresh.forEach(a => { const T = ACH_TIERS[achTier(a)]; celebrate({ eyebrow: achTier(a) > 1 ? `${T.uz} yutuq!` : "Yangi yutuq!", title: a.t, text: `${a.d}. Pamuk sizdan faxrlanadi! +${T.xp} XP`, ico: a.ico, c: a.c, r: achTier(a), ach: 1, share: true }); });
}
// During an exercise the pop-up waits for the result screen, so it never covers the answer buttons
const celebrateLater = () => !!(SES && !SES.done);
function celebrate(c) {
  ACH_QUEUE.push(c);
  if (ACH_QUEUE.length === 1 && !celebrateLater()) showCelebrate();
}
function celebrateQueued() { if (ACH_QUEUE.length && $("celebrate").hidden && !celebrateLater()) showCelebrate(); }
function showCelebrate() {
  const c = ACH_QUEUE[0];
  if (!c) return;
  beep("fanfare");
  const el = $("celebrate");
  const colors = ["#ffb422", "#e5484d", "#3b5bdb", "#17a36a", "#7a54e0", "#0fa3a0"];
  el.innerHTML = `<div class="confetti" aria-hidden="true">${Array.from({ length: 36 }, (_, i) => `<i style="left:${Math.random() * 100}%;background:${colors[i % colors.length]};animation-delay:${(Math.random() * 0.6).toFixed(2)}s;animation-duration:${(2 + Math.random() * 1.5).toFixed(2)}s;transform:rotate(${Math.random() * 360}deg)"></i>`).join("")}</div>
    <div class="cel-card" role="dialog" aria-modal="true" aria-label="${esc(c.eyebrow || "Yangi yutuq")}">
      <div class="cel-cat">${c.look ? catSVG({ pose: "sit", acc: "stars", look: c.look, cls: "mascot" }) : mascot("trophy")}</div>
      ${c.frame ? `<span class="cel-medal cel-frame">${avatarHTML(MYPHOTO, USER ? USER.uid : "me", "", { n: c.frame })}</span>` : c.league ? `<span class="cel-medal">${lgBadge(c.league, "lg-cel")}</span>` : c.ach ? `<span class="cel-medal cel-ach">${achBadge(ACH_COL(c.c), c.r, c.ico)}</span>` : `<span class="medal art ${c.c} cel-medal${c.r > 2 ? ` ach-r${c.r}` : ""}">${c.badge !== undefined ? `<b class="cel-num">${esc(c.badge)}</b>` : ICON[c.ico] || ICON.star}</span>`}
      <small class="eyebrow">${esc(c.eyebrow || "Yangi yutuq!")}</small>
      <h2>${esc(c.title)}</h2>
      <p>${esc(c.text)}</p>
      <div class="cel-actions">${c.share ? `<button class="btn btn-ghost" data-act="share" data-text="${esc(c.shareText || `Türkçe Yoʻl'da «${c.title}» yutugʻini oldim! Turk tilini bepul oʻrganing:`)}">${ICON.heart}Ulashish</button>` : ""}<button class="btn btn-grad" data-act="cel-next">Davom etish</button></div>
    </div>`;
  el.hidden = false;
  CatLife.scan();
  setTimeout(() => CatLife.mood(el.querySelector(".cat"), "wow", 3600), 300);
}
function nextCelebrate() {
  ACH_QUEUE.shift();
  if (ACH_QUEUE.length) showCelebrate(); else { $("celebrate").hidden = true; $("celebrate").innerHTML = ""; }
}
function viewAchievements() {
  const done = ACH.filter(achDone).length;
  const nextUp = ACH.filter(a => !achDone(a)).map(a => ({ a, p: Math.min(1, a.v() / a.n) })).sort((x, y) => y.p - x.p).slice(0, 3);
  const tierRow = [1, 2, 3, 4].map(r => { const all = ACH.filter(a => achTier(a) === r); return `<span class="ach-tier r${r}"><i></i>${ACH_TIERS[r].uz} <b>${all.filter(achDone).length}/${all.length}</b></span>`; }).join("");
  return `<div><a class="back" href="#profile">${ICON.back}Profil</a></div>
  <div class="ach-hero glass">${mascot("trophy")}<div><h1 class="page-title" style="font-size:26px">Yutuqlar</h1><p class="sub">${done} / ${ACH.length} ochildi · ${[1, 2, 3, 4].map(r => `+${ACH_TIERS[r].xp}`).join(" / ")} XP</p>
    <div class="bar" style="margin-top:8px"><i style="width:${pct(done, ACH.length)}%"></i></div></div></div>
  <div class="ach-tiers">${tierRow}</div>
  ${nextUp.length ? `<section class="section"><div class="section-head"><h2>Yaqin qolgan yutuqlar</h2></div>
    <div class="list">${nextUp.map(({ a, p }) => `<div class="unit glass"><span class="medal">${ICON[a.ico] || ICON.star}</span>
      <span class="unit-body"><span class="unit-title">${esc(a.t)} <span class="ach-r-tag r${achTier(a)}">${ACH_TIERS[achTier(a)].uz}</span></span><span class="unit-sub">${esc(a.d)} · yana ${Math.max(0, a.n - a.v())} ta</span><span class="bar"><i style="width:${Math.round(p * 100)}%"></i></span></span><span></span></div>`).join("")}</div></section>` : ""}
  ${ACH_CATS.map(([k, l]) => `<section class="section"><div class="section-head"><h2>${l}</h2><span class="tag violet-t">${ACH.filter(a => a.cat === k && achDone(a)).length}/${ACH.filter(a => a.cat === k).length}</span></div>
    <div class="achv">${ACH.filter(a => a.cat === k).sort((x, y) => achDone(y) - achDone(x)).map(achCard).join("")}</div></section>`).join("")}`;
}
// Achievement colours: the sticker's gradient (stars/cap are special colours used by a few achievements)
const ACH_COL = c => ["violet", "sky", "orange", "pink", "green", "teal"].includes(c) ? c : c === "stars" ? "orange" : "violet";
const achDate = a => { const w = S.achv && S.achv[a.id]; return w ? `${w.slice(8, 10)}.${w.slice(5, 7)}.${w.slice(0, 4)}` : ""; };
// Earned: an enamel disc in a metal rim on a ribbon, richer with rarity — bronze; silver with laurel; gold with wings
// and a star; the rainbow rim with wings, a crown and sparks. Not yet earned: a grey lock with progress
const achSticker = a => achBadge(ACH_COL(a.c), achTier(a), a.ico);
function achBadge(col, r, ico) {
  const O = FR_ORN;
  const back = r > 2 ? `<svg class="fr-orn fr-back ach-orn" viewBox="-30 -30 160 160" aria-hidden="true">${O.wings(r > 3 ? 0.8 : 0.66, "wg")}</svg>` : "";
  const front = (r === 2 ? O.laurel(2) : "") + O.ribbon + (r === 3 ? O.star(3) : r > 3 ? O.crown + O.sparks : "");
  return `<span class="ach-st st-${col} t${r}">${back}<i class="ach-disk${r > 2 ? ` ach-r${r}` : ""}">${ICON[ico] || ICON.star}</i><svg class="fr-orn ach-orn" viewBox="-30 -30 160 160" aria-hidden="true">${front}</svg></span>`;
}
function achCard(a, i) {
  const on = achDone(a), v = Math.min(a.v(), a.n);
  const r = achTier(a);
  return `<div class="ach glass${on ? ` on c-${ACH_COL(a.c)}` : ""} tier${r}">
    ${on ? achSticker(a, i) : `<span class="medal">${ICON.lock}</span>`}<span class="ach-r-tag r${r}">${ACH_TIERS[r].uz} · +${ACH_TIERS[r].xp}</span><b>${esc(a.t)}</b><small>${esc(a.d)}</small>
    ${on ? (achDate(a) ? `<small class="ach-date">${achDate(a)}</small>` : "") : `<span class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${a.n}" aria-valuenow="${v}" aria-label="${esc(a.t)}: ${v}/${a.n}"><i style="width:${pct(v, a.n)}%"></i></span><small class="muted">${v}/${a.n}</small>`}</div>`;
}
/* ---------- Tips, encouragement, sharing ---------- */
const TIPS = [
  ["Bir soʻzni 3 kun ichida 3 marta takrorlang", "Takrorlash tizimi soʻzlarni aynan unutish arafasida qaytaradi. Kuniga 10 daqiqa — eng samarali usul."],
  ["Turkcha «c» — bu «j»", "cep (choʻntak), cami (masjid). «ç» esa «ch»: çay (choy)."],
  ["Oʻzbekcha bilganingiz — katta ustunlik", "göz — koʻz, yol — yoʻl, kitap — kitob. Turkcha soʻzlarning katta qismi sizga allaqachon tanish."],
  ["Ovoz chiqarib oʻqing", "Har bir soʻzni tinglash tugmasi bilan eshitib, qaytaring. Talaffuz shunday tez oʻrnashadi."],
  ["Kechqurun takrorlang", "Uxlashdan oldin qilingan takrorlash xotirada yaxshiroq saqlanadi."],
  ["Xatolardan qoʻrqmang", "Har bir xato xatolar daftariga tushadi va keyinroq qayta soʻraladi. Xato — oʻrganishning yarmi."],
  ["Aldamchi soʻzlarga ehtiyot boʻling", "dil — til (yurak emas), ayna — koʻzgu (oyna emas), kurt — boʻri (qurt emas)."],
  ["Kuniga 5 ta gap yozing", "Bugungi soʻzlar bilan oʻzingiz haqingizda 5 ta gap yozing — kursdagi yozish mashqlari shu uchun."],
  ["Turk seriallarini subtitr bilan koʻring", "Avval oʻzbekcha, keyin turkcha subtitr bilan. Tanish soʻzlarni ushlashga harakat qiling."],
  ["Unli uygʻunligi — kalit", "Qoʻshimcha soʻzning oxirgi unlisiga moslashadi: evler, okullar. Grammatika boʻlimidagi 1-mavzuni oʻqing."],
  ["Seriyani uzmang", "Har kuni hech boʻlmasa bitta mashq qiling: Pamuk ketma-ket kunlaringizni sanaydi."],
  ["Telefoningizga ilova sifatida oʻrnating", "Profil → Yordam boʻlimida 1 daqiqada oʻrnatish yoʻriqnomasi bor. Internetsiz ham ishlaydi!"],
  ["Tarjimondan aqlli foydalaning", "Gapni tarjima qilganda Pamuk undagi grammatikani topib, qoʻllanma mavzusiga olib boradi."],
  ["-yor hech qachon oʻzgarmaydi", "geliyorum, okuyorum, gidiyorum — «yor» qismi doim bir xil."],
  ["Kichik maqsad qoʻying", "Kunlik maqsadni 30 XP ga qoʻyib, uni har kuni bajarish — katta maqsaddan samaraliroq."],
  ["Doʻstingiz bilan oʻrganing", "Reytingda doʻstingiz bilan bellashing — birga oʻrganish 2 barobar qiziqarli."],
  ["Ğ oʻqilmaydi", "dağ [daa], öğretmen [öö-retmen] — ğ oldingi unlini choʻzadi."],
  ["Dialoglarni rol oʻynab oʻqing", "Kurs dialoglarini ikkala rolda ovoz chiqarib oʻqing, keyin tinglash tugmasi bilan solishtiring."],
  ["Bepul — lekin jiddiy", "Bu kurs A1 dan C1 gacha toʻliq daraja beradi: 40 boʻlim, 5 test. Hech qanday toʻlov yoʻq."],
  ["Bir kunda emas, har kuni", "Damlaya damlaya göl olur — tomchi-tomchi koʻl boʻlur. Kuniga 10 daqiqa, oyiga 300 daqiqa!"]
];
const tipOfDay = () => TIPS[dayNum() % TIPS.length];
// The app: the phone's own share sheet (plugin Share); the WebView has no navigator.share
async function nativeShare(o) {
  const sh = nativePlugin("Share");
  if (!sh) return false;
  try { await sh.share(Object.assign({ title: "Türkçe Yoʻl", dialogTitle: "Ulashish" }, o)); }
  catch (e) { if (!/cancel/i.test(String((e && e.message) || e))) throw e; }
  return true;
}
async function shareSite(text) {
  const url = IS_NATIVE || /^https?:$/.test(location.protocol) ? "https://turkceyol.web.app/" : location.origin + location.pathname;
  const msg = text || "Turk tilini oʻzbek tilida bepul oʻrganing — Pamuk bilan har kuni 10 daqiqa:";
  try {
    if (await nativeShare({ text: msg, url })) {}
    else if (navigator.share) { await navigator.share({ title: "Türkçe Yoʻl", text: msg, url }); }
    else { await navigator.clipboard.writeText(msg + " " + url); toast("Havola nusxalandi — doʻstlaringizga yuboring"); }
    S.shared = (S.shared || 0) + 1; save();
  } catch (e) { /* the viewer closed the share sheet */ }
}
async function shareLink(url, msg) {
  try {
    if (await nativeShare({ text: msg, url })) {}
    else if (navigator.share) await navigator.share({ title: "Türkçe Yoʻl", text: msg, url });
    else copyText(msg + " " + url, "Havola nusxalandi — oʻquvchilaringizga yuboring");
  } catch (e) { /* the viewer closed the share sheet */ }
}
function copyText(t, done) {
  try { navigator.clipboard.writeText(t).then(() => toast(done), () => toast(t)); } catch (e) { toast(t); }
}

/* Streak sheet: the flame, the best run, the freezes and a month calendar (practised days, days a freeze kept) */
let STK_M = 0;
function streakSheetHTML() {
  const now = new Date(), first = new Date(now.getFullYear(), now.getMonth() + STK_M, 1), y = first.getFullYear(), m = first.getMonth();
  const days = new Date(y, m + 1, 0).getDate(), lead = (first.getDay() + 6) % 7, tn = dayNum(), fz = new Set(S.frzD || []);
  const cells = Array.from({ length: lead }, () => "<span></span>");
  let on = 0;
  for (let d = 1; d <= days; d++) {
    const n = dayNum(new Date(y, m, d, 12).getTime()), k = keyOf(n), done = !!(dayGet(k).xp || dayGet(k).rev), f = !done && fz.has(k);
    if (done) on++;
    cells.push(`<span class="cd${done ? " on" : ""}${f ? " frz" : ""}${n === tn ? " today" : ""}${n > tn ? " fut" : ""}" role="img" aria-label="${d}-${MONTHS[m]}${done ? ", mashq qilingan" : f ? ", muzlatgich" : ""}">${f ? ICON.snow : d}</span>`);
  }
  const st = streakNow(), fzn = S.frz || 0;
  return `<div class="stk-head"><span class="stk-flame${st ? "" : " off"}">${ICON.flame}</span><div><b>${st}</b><span>kun ketma-ket</span><small>Eng uzun seriya: ${Math.max(S.best || 0, st)} kun</small></div></div>
    <div class="stk-frz"><span class="frz-row">${Array.from({ length: FRZ_MAX }, (_, i) => `<i class="${i < fzn ? "has" : ""}">${ICON.snow}</i>`).join("")}</span>
      <div><b>Seriya muzlatgichi: ${fzn}/${FRZ_MAX}</b><small>Mashq qilinmagan kunni avtomatik saqlaydi. Har 7 kunlik seriya va haftalik challenge uchun bittadan beriladi.</small></div></div>
    <div class="stk-cal"><div class="stk-nav"><button class="icon-btn" data-act="stk-m" data-d="-1" aria-label="Oldingi oy" ${STK_M <= -3 ? "disabled" : ""}>${ICON.back}</button><b>${MONTHS[m][0].toUpperCase() + MONTHS[m].slice(1)} ${y}</b><button class="icon-btn" data-act="stk-m" data-d="1" aria-label="Keyingi oy" ${STK_M >= 0 ? "disabled" : ""}><span class="ico-mirror">${ICON.back}</span></button></div>
      <div class="cal-grid">${["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"].map(d => `<small>${d}</small>`).join("")}${cells.join("")}</div>
      <p class="muted" style="margin:8px 0 0;font-size:13px">Bu oy: ${on} kun mashq qilindi</p></div>
    <button class="btn btn-grad btn-block" data-act="sheet-close-btn">Yopish</button>`;
}

/* ---------- Install (PWA) and help ---------- */
let INSTALL_EVT = null;
addEventListener("beforeinstallprompt", e => { e.preventDefault(); INSTALL_EVT = e; if (["#help", "#home", ""].includes(location.hash)) kRerender(); });
addEventListener("appinstalled", () => { INSTALL_EVT = null; toast("Ilova oʻrnatildi! Endi uni bosh ekrandan oching."); });
// Inside the Android app (Trusted Web Activity) the first page comes with the referrer android-app://uz.turkceyol.app
const inTwa = () => { try { if (/^android-app:\/\/uz\.turkceyol\.app/.test(document.referrer)) sessionStorage.setItem("ty-twa", "1"); return sessionStorage.getItem("ty-twa") === "1"; } catch (e) { return false; } };
inTwa();
const isStandalone = () => IS_NATIVE || inTwa() || matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
function installCard() {
  if (isStandalone()) return "";
  try { if (localStorage.getItem("ty-install-hide")) return ""; } catch (e) {}
  return `<div class="pcard glass install-card">
    <div class="pcard-head"><b>${ICON.download}Ilovani oʻrnating</b><button class="link" data-act="install-hide">Keyinroq</button></div>
    <p class="muted">Türkçe Yoʻl telefoningizda ilova boʻlib ochiladi, internetsiz ham ishlaydi. Bepul, 1 daqiqa.</p>
    ${INSTALL_EVT ? `<button class="btn btn-grad btn-block" data-act="install">Oʻrnatish</button>` : `<a class="btn btn-soft btn-block" href="#help">Qanday oʻrnatiladi?</a>`}
  </div>`;
}
async function doInstall() {
  if (!INSTALL_EVT) { go("help"); return; }
  INSTALL_EVT.prompt();
  try { await INSTALL_EVT.userChoice; } catch (e) {}
  INSTALL_EVT = null; kRerender();
}
function viewHelp() {
  const step = (n, t, d) => `<div class="help-step"><span class="help-n">${n}</span><div><b>${t}</b><p class="muted">${d}</p></div></div>`;
  return `<div><a class="back" href="#profile">${ICON.back}Profil</a></div>
  <div class="ach-hero glass">${mascot("wave")}<div><h1 class="page-title" style="font-size:26px">Yordam va qoʻllanma</h1><p class="sub">Pamuk saytdan qanday foydalanishni tushuntiradi</p></div></div>

  <section class="section"><div class="section-head"><h2>Telegram</h2></div>
    <div class="glass pad tg-card"><p class="muted">Kanalda har kuni “Kunning soʻzi”, botda esa sayt Telegram ichida ochiladi va soʻz tarjimasini soʻrash mumkin.</p>
      <div class="fr-actions tg-actions"><a class="btn btn-grad" href="${TG_CHANNEL}" target="_blank" rel="noopener">${ICON.chat}Kanal @turkceyoluz</a><a class="btn btn-ghost" href="${TG_BOT}" target="_blank" rel="noopener">${ICON.spark}Bot @TurkceYolBot</a></div>
      ${IN_TG ? `<p class="muted" style="margin-top:8px">Siz saytni Telegram ichida ochdingiz. Google bilan kirish uchun <button class="link" data-act="tg-browser">brauzerda oching</button>.</p>` : ""}</div></section>

  <section class="section"><div class="section-head"><h2>Ilovani oʻrnatish (PWA)</h2>${isStandalone() ? `<span class="tag green-t">${ICON.check}Oʻrnatilgan</span>` : ""}</div>
    ${INSTALL_EVT ? `<button class="btn btn-grad btn-block" data-act="install">${ICON.download}Hozir oʻrnatish</button>` : ""}
    <div class="glass pad help-box"><b>Android (Chrome)</b>
      ${step(1, "Saytni Chrome brauzerida oching", "turkceyol.web.app")}
      ${step(2, "Yuqori oʻng burchakdagi ⋮ menyusini bosing", "Uch nuqta belgisi")}
      ${step(3, "«Ilovani oʻrnatish» yoki «Bosh ekranga qoʻshish» ni tanlang", "Keyin «Oʻrnatish» ni tasdiqlang")}
      ${step(4, "Bosh ekranda Pamuk belgisi paydo boʻladi", "Endi sayt alohida ilova boʻlib ochiladi")}</div>
    <div class="glass pad help-box"><b>iPhone / iPad (Safari)</b>
      ${step(1, "Saytni Safari brauzerida oching", "Chrome emas, aynan Safari")}
      ${step(2, "Pastdagi «Ulashish» tugmasini bosing", "Kvadrat va yuqoriga qaragan oʻq belgisi")}
      ${step(3, "«Bosh ekranga» (Add to Home Screen) ni tanlang", "Roʻyxatni pastga suring")}
      ${step(4, "«Qoʻshish» ni bosing", "Pamuk belgisi bosh ekranda paydo boʻladi")}</div>
    <div class="glass pad help-box"><b>Kompyuter (Chrome, Edge)</b>
      ${step(1, "Manzil satrining oʻng tomonidagi ⊕ belgisini bosing", "«Ilovani oʻrnatish»")}
      ${step(2, "«Oʻrnatish» ni tasdiqlang", "Ilova alohida oynada ochiladi")}</div>
    <div class="tip glass">${ICON.bulb}<div><b>Nima uchun oʻrnatish kerak?</b>Ilova tezroq ochiladi, toʻliq ekranda ishlaydi va bir marta ochilgandan keyin internetsiz ham darslar ishlaydi.</div></div>
  </section>

  <section class="section"><div class="section-head"><h2>Saytdan qanday foydalanish kerak</h2></div>
    <div class="glass pad help-box">
      ${step(1, "Har kuni «Bugungi reja» ni bajaring", "Bosh sahifadagi kartada: takrorlash + 10 ta yangi soʻz, taxminan 10 daqiqa.")}
      ${step(2, "Kursni tartib bilan oʻqing", "Darslar → Kurs: A1 dan boshlang. Har boʻlimda Lugʻat → Grammatika → Dialog → Matn → Mashqlar.")}
      ${step(3, "Grammatika va lugʻatni mustahkamlang", "Darslar → Grammatika: A1–C1 mavzular va har biriga mashq. Darslar → Lugʻat: A1 darslari va mavzuli soʻz toʻplamlari.")}
      ${step(4, "4 koʻnikmani mashq qiling", "Mashq sahifasida: oʻqish, tinglash, yozish va gapirish. Xatolar daftari — barcha xatolaringiz bir joyda.")}
      ${step(5, "Aqlli tarjimondan foydalaning", "Yuqoridagi tarjimon belgisi: tarjima + lugʻat + gapdagi grammatika.")}
      ${step(6, "Daraja testini topshiring", "Har daraja oxirida test bor: 60% dan yuqori — keyingi darajaga oʻting.")}
    </div></section>

  <section class="section"><div class="section-head"><h2>Koʻp soʻraladigan savollar</h2></div>
    <details class="glass pad"><summary><b>Sayt rostdan ham bepulmi?</b></summary><p class="muted" style="margin-top:6px">Ha, 100% bepul va reklamasiz. Barcha darslar, kurs, testlar va tarjimon bepul.</p></details>
    <details class="glass pad"><summary><b>Qaysi darajagacha oʻrganish mumkin?</b></summary><p class="muted" style="margin-top:6px">A1 (boshlangʻich) dan C1 (ilgʻor) gacha: 40 boʻlim, 5 ta daraja testi, 1000 dan ortiq soʻz.</p></details>
    <details class="glass pad"><summary><b>Natijalarim yoʻqolmaydimi?</b></summary><p class="muted" style="margin-top:6px">Hisobga kirgan boʻlsangiz, natijalaringiz serverda saqlanadi va istalgan qurilmada davom etasiz.</p></details>
    <details class="glass pad"><summary><b>Ovoz eshitilmayapti, nima qilay?</b></summary><p class="muted" style="margin-top:6px">Telefon sozlamalarida «Matnni nutqqa aylantirish» (Text-to-speech) boʻlimida turk tilini yuklab oling va ovoz balandligini tekshiring.</p></details>
    <details class="glass pad"><summary><b>Internetsiz ishlaydimi?</b></summary><p class="muted" style="margin-top:6px">Ha, sayt bir marta ochilgandan keyin darslar internetsiz ham ochiladi. Tarjimon va reyting uchun internet kerak.</p></details>
  </section>

  <section class="section"><div class="section-head"><h2>Doʻstlaringizni taklif qiling</h2></div>
    <div class="glass pad"><p class="muted">Turk tilini birga oʻrganish qiziqarliroq! Havolani doʻstlaringizga yuboring va reytingda bellashing.</p>
      <button class="btn btn-grad btn-block" data-act="share" style="margin-top:10px">${ICON.heart}Doʻstlarga ulashish</button></div></section>`;
}

/* ---------- First-run tour ---------- */
const ONB = [
  { m: "wave", t: "Salom! Men Pamukman", d: "Turk tilini oʻzbek tilida, 100% bepul va reklamasiz oʻrganishga yordam beraman. Har kuni atigi 10 daqiqa yetarli." },
  { m: "cap", t: "A1 dan C1 gacha toʻliq kurs", d: "40 boʻlim, grammatika qoʻllanmasi, 1000 dan ortiq soʻz va daraja testlari. Hammasi tartib bilan, oʻzbekcha tushuntirish bilan." },
  { m: "trophy", t: "Yutuqlar va reyting", d: "Har kuni mashq qiling, seriyani uzmang, yutuqlarni yigʻing va doʻstlaringiz bilan reytingda bellashing." },
  { m: "sit", t: "Telefoningizga oʻrnating", d: "Saytni ilova sifatida oʻrnatsangiz, u tezroq ochiladi va internetsiz ham ishlaydi. Yoʻriqnoma: Profil → Yordam." }
];
let ONB_I = 0;
function showOnboard() {
  const s = ONB[ONB_I], el = $("onboard");
  el.innerHTML = `<div class="onb-card glass blur" role="dialog" aria-modal="true" aria-label="Tanishuv">
    <div class="onb-cat">${mascot(s.m)}</div>
    <h2>${esc(s.t)}</h2><p>${esc(s.d)}</p>
    <div class="onb-dots">${ONB.map((_, i) => `<i class="${i === ONB_I ? "on" : ""}"></i>`).join("")}</div>
    <div class="cel-actions onb-actions"><button class="btn btn-grad btn-block" data-act="onb-next">${ONB_I < ONB.length - 1 ? "Keyingi" : "Boshladik!"}</button>${ONB_I < ONB.length - 1 ? `<button class="link" data-act="onb-skip">Oʻtkazib yuborish</button>` : ""}</div>
  </div>`;
  el.hidden = false;
  CatLife.scan();
}
function endOnboard() { S.onb = 1; save(); $("onboard").hidden = true; $("onboard").innerHTML = ""; }
function maybeOnboard() {
  if (S.onb || !$("onboard").hidden || !$("auth").hidden || !$("welcome").hidden) return;
  if (S.xp > 0 || S.sessions > 0) { S.onb = 1; save(); return; }
  ONB_I = 0; showOnboard();
}

/* A dancing Pamuk with floating notes instead of a bare spinner (loading screens), and a tip to read meanwhile */
const NOTE_SVG = ['<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 4.5 20 2v13.2a3.3 3.3 0 1 1-2-3V6.1L11 7.7v9.5a3.3 3.3 0 1 1-2-3z"/></svg>',
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11 3h2c.3 2.6 2 3.6 4 5-2.2-.7-3.3-.9-4-1.5V17a3.5 3.5 0 1 1-2-3.1z"/></svg>'];
function catLoader(text = "Yuklanmoqda…") {
  const tip = TIPS[Math.floor(Math.random() * TIPS.length)];
  return `<div class="glass cat-loader" role="status"><div class="cl-stage"><span class="cl-note n1">${NOTE_SVG[0]}</span><span class="cl-note n2">${NOTE_SVG[1]}</span><span class="cl-note n3">${NOTE_SVG[1]}</span>${catSVG({ pose: "sit", cls: "joy dance", look: catLook() })}</div>
    <b>${esc(text)}</b><small class="muted">${esc(tip[0])}</small></div>`;
}
