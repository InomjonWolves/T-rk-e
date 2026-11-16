/* Türkçe Yoʻl — Daily tasks and the weekly challenge, leagues, avatar frames, friends.
   One of the app's scripts (js/, loaded in order by index.html); they share one global scope. */

/* ---------- Daily tasks (+100 for all three) and the weekly challenge (+250) ---------- */
function dqToday() {
  const t = todayKey();
  if (!S.dq || S.dq.d !== t) {
    const third = dayNum() % 2 && canListen() ? "speaking" : "listening";
    S.dq = { d: t, k: ["vocab", "grammar", third], ok: {}, paid: 0 };
  }
  return S.dq;
}
function dqMark(kind) {
  const q = dqToday();
  if (!q.k.includes(kind) || q.ok[kind]) return;
  q.ok[kind] = 1;
  if (q.k.every(k => q.ok[k]) && !q.paid) {
    q.paid = 1; S.dqn = (S.dqn || 0) + 1; addXPBonus(XP_VAL.daily); save();
    celebrate({ eyebrow: "Kunlik vazifalar", title: "Bugungi vazifalar bajarildi!", text: `Uchala vazifa tayyor. Pamuk xursand! +${XP_VAL.daily} XP`, ico: "check", c: "green" });
  }
}
const WC = [
  { id: "days", t: "5 kun mashq", d: "Bu hafta 5 xil kunda mashq qiling", n: 5, v: w => w.days.length },
  { id: "tasks", t: "15 ta mashq", d: "Bu hafta 15 ta mashqni sifatli yakunlang", n: 15, v: w => w.n },
  { id: "four", t: "4 koʻnikma", d: "Oʻqish, tinglash, yozish va gapirish — har biridan 2 tadan mashq", n: 8, v: w => ["r", "l", "w", "s"].reduce((a, k) => a + Math.min(2, w.sk[k] || 0), 0) }
];
function wcWeek() {
  const wk = weekKey();
  if (!S.wc || S.wc.w !== wk) S.wc = { w: wk, c: Math.floor(weekStart(dayNum()) / 7) % WC.length, n: 0, days: [], sk: {}, paid: 0 };
  return S.wc;
}
function wcMark(sk) {
  const w = wcWeek(), ch = WC[w.c], t = todayKey();
  w.n++;
  if (!w.days.includes(t)) w.days.push(t);
  [].concat(sk || []).forEach(k => { w.sk[k] = (w.sk[k] || 0) + 1; });
  if (!w.paid && ch.v(w) >= ch.n) {
    w.paid = 1; S.wcn = (S.wcn || 0) + 1; addXPBonus(XP_VAL.weekly); const fz = frzGive(); save();
    celebrate({ eyebrow: "Haftalik challenge", title: `«${ch.t}» bajarildi!`, text: `Haftaning eng katta mukofoti sizniki. +${XP_VAL.weekly} XP${fz ? " va 1 ta seriya muzlatgichi" : ""}`, ico: "crown", c: "pink", share: true });
  }
}

/* ---------- Leagues: Bronze → Legend, settled by each client at the start of a week ----------
   The top 30% of a league (with at least LG_MIN XP last week) move up, an idle week (< LG_DOWN XP) moves down. */
const LEAGUES = [
  { n: 1, uz: "Bronza", c: "#cd7f32" }, { n: 2, uz: "Kumush", c: "#9aa7b4" }, { n: 3, uz: "Oltin", c: "#f2b31c" },
  { n: 4, uz: "Platina", c: "#3fb8ae" }, { n: 5, uz: "Olmos", c: "#4a9cff" }, { n: 6, uz: "Usta", c: "#9b5cff" }, { n: 7, uz: "Afsona", c: "#ff4f87" }
];
const LG_UP = 0.3, LG_MIN = 300, LG_SOLO = 1000, LG_DOWN = 50; // tools/league.js uses the same
const LG_WAIT_H = 36;
const lgOf = n => LEAGUES[Math.min(7, Math.max(1, n || 1)) - 1];
const lgBadge = (n, cls = "") => { const l = lgOf(n); return `<svg class="lg-badge ${cls}" viewBox="0 0 24 28" aria-label="${l.uz} ligasi"><path d="M12 1l10 4v8c0 7-4.5 11.5-10 14C6.5 24.5 2 20 2 13V5z" fill="${l.c}"/><path d="M12 1l10 4v8c0 7-4.5 11.5-10 14z" fill="#000" opacity=".12"/><text x="12" y="17.5" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">${l.n}</text></svg>`; };
/* ---------- Avatar frames (ramkalar): a ring round every avatar shows the learner's standing ----------
   Seven frames named like the leagues. A frame opens with the level (permanent) or with the league (weekly),
   whichever is higher. Gem from Oltin, laurel from Platina, wings from Usta, crown and a turning glow for Afsona. */
const FRAMES = [
  { n: 1, uz: "Bronza", lv: 1 }, { n: 2, uz: "Kumush", lv: 5 }, { n: 3, uz: "Oltin", lv: 10 }, { n: 4, uz: "Platina", lv: 20 },
  { n: 5, uz: "Olmos", lv: 30 }, { n: 6, uz: "Usta", lv: 40 }, { n: 7, uz: "Afsona", lv: 50 }
];
const frameByLv = lv => FRAMES.filter(f => lv >= f.lv).pop().n;
const frameOf = (xp, lg) => Math.max(frameByLv(lvlOf(+xp || 0)), Math.min(7, Math.max(1, +lg || 1)));
const myFrame = () => frameOf(S.xp, S.lg);
// Ornaments, drawn by us (the reference pictures were only ideas): viewBox -30…130, the ring is the 0…100 circle.
// Metal, gem and feather fills are gradients kept once in the page (ORN_DEFS); their colours come from styles.css.
const ORN_DEFS = (() => {
  const g3 = id => `<linearGradient id="${id}" class="og-m ${id}" x1="0" y1="0" x2="0" y2="1"><stop class="s-hi" offset="0"/><stop class="s-md" offset=".52"/><stop class="s-lo" offset="1"/></linearGradient>`;
  const g2 = id => `<linearGradient id="${id}" class="og-2 ${id}" x1="0" y1="0" x2="0" y2="1"><stop class="s-a" offset="0"/><stop class="s-b" offset="1"/></linearGradient>`;
  return `<svg class="orn-defs" aria-hidden="true" focusable="false"><defs>${[1, 2, 3, 4, 5, 6, 7].map(n => g3("og-m" + n)).join("")}${["og-gem", "og-ruby", "og-ice", "og-w6a", "og-w6b", "og-w6c", "og-w7a", "og-w7b", "og-w7c", "og-wga", "og-wgb", "og-wgc"].map(g2).join("")}</defs></svg>`;
})();
const FR_ORN = (() => {
  const f = v => +v.toFixed(1), rad = d => d * Math.PI / 180;
  const P = (r, d) => [50 + r * Math.cos(rad(d)), 50 + r * Math.sin(rad(d))];
  // One feather: a full blade from the base (bx, by) along angle a (degrees, y down), length l, half-width w; its tip leans by `bend`
  const feather = (bx, by, a, l, w, bend = 0.5) => {
    const cx = Math.cos(rad(a)), cy = Math.sin(rad(a)), nx = -cy, ny = cx, at = (u, v) => `${f(bx + l * u * cx + w * v * nx)} ${f(by + l * u * cy + w * v * ny)}`;
    return `M${f(bx)} ${f(by)}C${at(0.2, -1)} ${at(0.72, -1.05)} ${at(1, bend)}C${at(0.8, 0.75)} ${at(0.3, 0.7)} ${f(bx)} ${f(by)}Z`;
  };
  const rib = (bx, by, a, l) => `M${f(bx)} ${f(by)}L${f(bx + l * Math.cos(rad(a)))} ${f(by + l * Math.sin(rad(a)))}`;
  // The left wing: three rows of feathers fanning from the ring's left side — long primaries, coverts, and a short fluffy row
  const wingL = (k, w) => {
    const a = [], b = [], c = [], hl = [];
    [23, 31, 38, 44, 48, 49, 44].forEach((n, i) => { const ph = 136 + i * 12.5, [x, y] = P(45, ph), t = ph + 32 + i * 3.6, l = n * k; a.push(feather(x, y, t, l, (5.6 + i * 0.2) * k)); hl.push(rib(x, y, t, l * 0.8)); });
    [15, 19, 23, 26, 28, 27].forEach((n, i) => { const ph = 142 + i * 12.5, [x, y] = P(46, ph); b.push(feather(x, y, ph + 28 + i * 3, n * k, 5 * k)); });
    [9, 11, 13, 14, 14].forEach((n, i) => { const ph = 150 + i * 12.5, [x, y] = P(47, ph); c.push(feather(x, y, ph + 22 + i * 2, n * k, 4.4 * k, 0.3)); });
    return `<path class="fr-fo" fill="url(#og-${w}a)" d="${a.join("")}"/><path class="fr-hl" d="${hl.join("")}"/><path class="fr-fi" fill="url(#og-${w}b)" d="${b.join("")}"/><path class="fr-fc" fill="url(#og-${w}c)" d="${c.join("")}"/>`;
  };
  const mirror = x => `<g transform="matrix(-1 0 0 1 100 0)">${x}</g>`;
  const wings = (k, w) => `<g class="fr-wing"><g class="fr-wl">${wingL(k, w)}</g><g class="fr-wr">${mirror(wingL(k, w))}</g></g>`;
  // A laurel branch up the left side: a stem with leaves in pairs, the outer ones longer
  const laurelL = m => {
    const out = [], inn = [];
    for (let ph = 114; ph <= 212; ph += 14) { const [x, y] = P(56, ph); out.push(feather(x, y, ph + 46, 15.5, 4, 0.3)); inn.push(feather(x, y, ph + 120, 9, 3, -0.3)); }
    const [sx, sy] = P(56, 106), [ex, ey] = P(56, 222), [tx, ty] = P(56, 222);
    return `<path class="fr-stem" d="M${f(sx)} ${f(sy)}A56 56 0 0 1 ${f(ex)} ${f(ey)}"/><path class="fr-leaf" fill="url(#og-m${m})" d="${out.join("")}${feather(tx, ty, 302, 14, 3.6, 0)}"/><path class="fr-leaf fr-leaf-in" fill="url(#og-m${m})" d="${inn.join("")}"/>`;
  };
  const laurel = m => `<g class="fr-laurel"><g class="fr-ll">${laurelL(m)}</g><g class="fr-lr">${mirror(laurelL(m))}</g></g>`;
  // A cut gem: the stone, a lit facet, a glint that twinkles
  const gem = (x, y, r, cls = "fr-gem", fill = "og-gem", d = 0) => `<path class="${cls}" fill="url(#${fill})" d="M${x} ${f(y - r)}L${f(x + r * 0.74)} ${y}L${x} ${f(y + r)}L${f(x - r * 0.74)} ${y}Z"/><path class="fr-facet" d="M${x} ${f(y - r)}L${f(x - r * 0.74)} ${y}L${x} ${f(y - r * 0.12)}Z"/>${glint(x + r * 0.2, y - r * 0.28, r * 0.42, d)}`;
  const star = (x, y, r) => `M${f(x)} ${f(y - r)}Q${f(x)} ${f(y)} ${f(x + r)} ${f(y)}Q${f(x)} ${f(y)} ${f(x)} ${f(y + r)}Q${f(x)} ${f(y)} ${f(x - r)} ${f(y)}Q${f(x)} ${f(y)} ${f(x)} ${f(y - r)}Z`;
  const glint = (x, y, r, d) => `<path class="fr-glint" style="animation-delay:${d}s" d="${star(x, y, r)}"/>`;
  const spark = (x, y, r, d) => `<path class="fr-spark" style="animation-delay:${d}s" d="${star(x, y, r)}"/>`;
  const ember = (x, y, r, d) => `<circle class="fr-ember" style="animation-delay:${d}s" cx="${x}" cy="${y}" r="${r}"/>`;
  // Top crest: a gem between two swept spikes (from Oltin); bottom crest: a smaller gem with short spikes
  const spikes = (y, s, m) => `<path class="fr-metal" fill="url(#og-m${m})" d="M${f(50 - 5 * s)} ${f(y + 1)}Q${f(50 - 15 * s)} ${f(y - 12 * s)} ${f(50 - 27 * s)} ${f(y - 5 * s)}Q${f(50 - 17 * s)} ${f(y - 3 * s)} ${f(50 - 9 * s)} ${f(y + 6 * s)}ZM${f(50 + 5 * s)} ${f(y + 1)}Q${f(50 + 15 * s)} ${f(y - 12 * s)} ${f(50 + 27 * s)} ${f(y - 5 * s)}Q${f(50 + 17 * s)} ${f(y - 3 * s)} ${f(50 + 9 * s)} ${f(y + 6 * s)}Z"/>`;
  // Ice crystals (Olmos): a fan of long cut stones low on each side, each with a pale and a deep half
  const crystalL = () => {
    const lit = [], deep = [];
    [[142, 172, 20], [156, 194, 29], [170, 214, 36], [184, 232, 30], [198, 250, 22]].forEach(([ph, a, l]) => {
      const [x, y] = P(47, ph), cx = Math.cos(rad(a)), cy = Math.sin(rad(a)), nx = -cy, ny = cx, w = 5.4;
      const m = [x + l * 0.32 * cx, y + l * 0.32 * cy], t = [x + l * cx, y + l * cy];
      lit.push(`M${f(x)} ${f(y)}L${f(m[0] - w * nx)} ${f(m[1] - w * ny)}L${f(t[0])} ${f(t[1])}Z`);
      deep.push(`M${f(x)} ${f(y)}L${f(m[0] + w * nx)} ${f(m[1] + w * ny)}L${f(t[0])} ${f(t[1])}Z`);
    });
    return `<path class="fr-ice" fill="url(#og-ice)" d="${deep.join("")}"/><path class="fr-ice fr-ice-lit" d="${lit.join("")}"/>`;
  };
  const crystals = `<g class="fr-crystals">${crystalL()}${mirror(crystalL())}</g>`;
  const shield = ruby => `<g transform="matrix(1 0 0 -1 0 100)">${spikes(-2, 0.95, 3)}</g><path class="fr-metal fr-shield" fill="url(#og-m3)" d="M38 96Q50 100 62 96L61.5 107Q60 115 50 121Q40 115 38.5 107Z"/>${gem(50, 107.5, 6.5, ruby ? "fr-ruby" : "fr-gem", ruby ? "og-ruby" : "og-gem", 0.6)}`;
  const crown = `<g class="fr-crown-g"><path class="fr-crown" fill="url(#og-m3)" d="M28-2L22-17L31-10L36.5-23L43-12L50-28L57-12L63.5-23L69-10L78-17L72-2Q50-10 28-2Z"/><path class="fr-band" d="M27 4Q50-4 73 4L72-3Q50-11 28-3Z"/><circle class="fr-pearl" cx="22" cy="-18" r="2.5"/><circle class="fr-pearl" cx="36.5" cy="-24" r="2.5"/><circle class="fr-pearl" cx="50" cy="-29" r="3"/><circle class="fr-pearl" cx="63.5" cy="-24" r="2.5"/><circle class="fr-pearl" cx="78" cy="-18" r="2.5"/><circle class="fr-ruby" fill="url(#og-ruby)" cx="50" cy="-3.6" r="3.6"/><circle class="fr-gem" fill="url(#og-gem)" cx="38" cy="-1.4" r="2.2"/><circle class="fr-gem" fill="url(#og-gem)" cx="62" cy="-1.4" r="2.2"/>${glint(50, -16, 4, 0.3)}</g>`;
  // A medal's ribbon: two folded tails behind a banner that crosses the foot of the disc
  const ribbon = `<path class="fr-rib-d" d="M10 86L-13 81L-7 90L-14 99L12 101ZM90 86L113 81L107 90L114 99L88 101Z"/><path class="fr-rib" d="M4 83Q50 101 96 83L96 97Q50 116 4 97Z"/><path class="fr-rib-hl" d="M8 87.5Q50 104.5 92 87.5"/>`;
  const sprig = m => `<path class="fr-leaf" fill="url(#og-m${m})" d="${feather(45, 101, 196, 15, 4, 0.4)}${feather(55, 101, -16, 15, 4, -0.4)}"/>`;
  return {
    top: m => `${spikes(-1, 1, m)}${gem(50, -6, 10.5)}`,
    bottom: m => `<g transform="matrix(1 0 0 -1 0 100)">${spikes(-1, 0.7, m)}</g>${gem(50, 103, 7, "fr-gem", "og-gem", 0.9)}`,
    bottomGem: m => `${sprig(m)}${gem(50, 101, 6.5, "fr-gem", "og-gem", 0.9)}`,
    sides: `${gem(-1, 50, 7, "fr-gem", "og-gem", 1.3)}${gem(101, 50, 7, "fr-gem", "og-gem", 1.9)}`,
    laurel, wings, crystals, shield, crown, ribbon,
    star: m => `<path class="fr-metal" fill="url(#og-m${m})" d="${star(50, -4, 11)}"/>${glint(50, -4, 4.5, 0)}`,
    sparks: `${spark(-17, 26, 5, 0)}${spark(114, 12, 4, 0.7)}${spark(119, 74, 5, 1.4)}${spark(-8, 100, 3.5, 2.1)}`,
    embers: `${ember(8, 20, 1.8, 0)}${ember(92, 26, 1.5, 0.9)}${ember(-12, 58, 1.6, 1.7)}${ember(112, 50, 1.9, 2.4)}${ember(30, -18, 1.4, 3.1)}${ember(74, -14, 1.6, 0.5)}`
  };
})();
document.body.insertAdjacentHTML("afterbegin", ORN_DEFS);
// The avatar inside its frame; o.lv adds the level chip, o.sm is the topbar version, o.cls extra classes.
// Bronza — a plain ring; Kumush — a gem on a sprig; Oltin — a gem crest; Platina — laurel; Olmos — ice crystals;
// Usta — feathered wings and a shield; Afsona — wings of flame, a jewelled crown, embers.
function framed(av, n, o = {}) {
  n = Math.min(7, Math.max(1, n || 1));
  // With the level chip at the bottom, the bottom crest would hide under it
  const O = FR_ORN, lv = o.lv, bot = lv ? "" : O.bottom(n), parts = n === 2 ? (lv ? "" : O.bottomGem(2))
    : n === 3 ? O.top(3) + bot
    : n === 4 ? O.laurel(4) + O.top(4) + bot
    : n === 5 ? O.top(5) + bot + O.sides + O.sparks
    : n === 6 ? O.top(6) + (lv ? "" : O.shield()) + O.sides + O.sparks
    : n === 7 ? O.crown + (lv ? "" : O.shield(1)) + O.sides + O.sparks + O.embers : "";
  // Wings and crystals sit behind the ring and the avatar, everything else in front.
  // The topbar avatar shows the same ornaments and the level chip;
  // there the drawing box is the ring itself (viewBox 0…100, painted outside it) so it never widens a narrow page
  const vb = o.sm ? "0 0 100 100" : "-30 -30 160 160";
  // (the small topbar frame keeps its wings short: its neighbours are a few pixels away)
  const wk = o.sm ? 0.74 : 1, behind = n === 5 ? O.crystals : n === 6 ? O.wings(wk, "w6") : n === 7 ? O.wings(wk * 1.08, "w7") : "";
  const back = behind ? `<svg class="fr-orn fr-back" viewBox="${vb}" aria-hidden="true">${behind}</svg>` : "";
  const orn = back + (parts ? `<svg class="fr-orn" viewBox="${vb}" aria-hidden="true">${parts}</svg>` : "");
  return `<span class="fr fr${n}${o.sm ? " fr-sm" : ""}${o.cls ? " " + o.cls : ""}" title="${FRAMES[n - 1].uz} ramka">${av}${orn}${o.lv ? `<b class="fr-lv">${o.lv}</b>` : ""}</span>`;
}
// A new frame earned: celebrate once (S.frm keeps the highest frame reached)
function frameCheck() {
  const n = myFrame();
  if (!S.frm) { S.frm = n; return; }
  if (n <= S.frm) return;
  S.frm = n;
  const f = FRAMES[n - 1];
  celebrate({ eyebrow: "Yangi ramka!", title: `${f.uz} ramka ochildi!`, frame: n,
    text: n < 7 ? `Endi reytingda, doʻstlar roʻyxatida va profilda avataringiz atrofida shu ramka turadi. Keyingisi — ${FRAMES[n].uz}: ${FRAMES[n].lv}-daraja yoki ${FRAMES[n].uz} liga.` : "Eng yuqori ramka — Afsona! Siz Türkçe Yoʻl afsonasisiz.",
    share: true, shareText: `Türkçe Yoʻl'da «${f.uz}» ramkasini ochdim! Turk tilini bepul oʻrganing:` });
}
let LG_BUSY = false;
async function lgSettle() {
  const wk = weekKey();
  if (S.lgw === wk || LG_BUSY) return;
  // A signed-in user waits for the cloud copy before settling
  if (FB && !(USER && db)) return;
  if (!S.pw) { S.lgw = wk; S.lg = S.lg || 1; return; }
  const me = S.lg || 1, mine = S.pwxp || 0;
  let rank = 0, n = 0;
  // The server's result (tools/league.js → lgres/{uid}, every Monday) — the whole league table, the same rule
  if (USER && db) {
    LG_BUSY = true;
    let res = null;
    try { const d = await db.collection("lgres").doc(USER.uid).get(); res = d.exists ? d.data() : null; } catch (e) {}
    LG_BUSY = false;
    if (S.lgw === wk) return;
    if (res && res.w === S.pw && res.from === me && Math.abs((res.to || me) - me) <= 1) return lgApply(wk, me, res.to || me, res.rank || 0, res.n || 0, mine);
    // With the server switched on (firebase-config.js), wait for it a while before counting on the phone
    if (window.LEAGUE_SERVER && Date.now() - Date.parse(wk) < LG_WAIT_H * 3600e3) return;
  }
  if (USER && db && S.pub && mine > 0) {
    LG_BUSY = true;
    try {
      const ref = db.collection("league");
      const [a, b] = await Promise.all([ref.where("week", "==", S.pw).limit(300).get(), ref.where("pw", "==", S.pw).limit(300).get()]);
      const map = {};
      a.docs.forEach(d => { const x = d.data(); map[d.id] = { lg: x.lg || 1, xp: x.wxp || 0 }; });
      b.docs.forEach(d => { const x = d.data(); map[d.id] = { lg: x.plg || 1, xp: x.pwxp || 0 }; });
      map[USER.uid] = { lg: me, xp: mine, me: 1 };
      const peers = Object.values(map).filter(p => p.lg === me && p.xp > 0).sort((x, y) => y.xp - x.xp || (y.me || 0) - (x.me || 0));
      n = peers.length; rank = peers.findIndex(p => p.me) + 1;
    } catch (e) { LG_BUSY = false; return; }
    LG_BUSY = false;
    if (S.lgw === wk) return;
  }
  const up = mine >= LG_MIN && me < 7 && (rank ? rank <= Math.max(1, Math.ceil(n * LG_UP)) : mine >= LG_SOLO);
  const to = up ? me + 1 : mine < LG_DOWN && me > 1 ? me - 1 : me;
  lgApply(wk, me, to, rank, n, mine);
}
function lgApply(wk, me, to, rank, n, mine) {
  S.lg = to; S.lgw = wk;
  S.lgr = { w: S.pw, from: me, to, rank, n, xp: mine };
  save();
  // An active week gets its own summary screen; an idle one just a gentle word
  if (mine > 0) recapSoon();
  else if (to < me) setTimeout(() => pamukSay("sad", `Oʻtgan hafta dam oldik — liga ${lgOf(to).uz} boʻldi. Bu hafta qaytarib olamiz!`), 1200);
  if (location.hash === "#rank") route();
}

/* ---------- Friends: invite link, mutual friends, friends' leaderboard ----------
   A shares https://turkceyol.web.app/#do-<uid>. B opens it and adds A (S.fr), and leaves a note in
   invites/{A}/from/{B}; next time A opens the app, frInbox() adds B too. Bonus: the inviter +100 XP per new
   friend (up to FR_BONUS_MAX friends in all), the invited +50 XP once. */
const FR_MAX = 50, FR_BONUS_MAX = 10, FR_XP = 100, FR_JOIN_XP = 50;
const frList = () => (S.fr = Array.isArray(S.fr) ? S.fr : []);
const frLink = () => `https://turkceyol.web.app/#do-${USER ? USER.uid : ""}`;
const frMyName = () => ((USERNAME || "").trim().split(/\s+/)[0] || "Oʻquvchi").slice(0, 20);
function frPending(uid) { try { if (uid) localStorage.setItem("ty-friend", uid); else localStorage.removeItem("ty-friend"); } catch (e) {} }
const frPendingGet = () => { try { return localStorage.getItem("ty-friend") || ""; } catch (e) { return ""; } };
async function frAdd(uid, quiet) {
  if (!uid) return;
  if (!USER || !db) { frPending(uid); if (!quiet) toast("Avval hisobga kiring — keyin doʻstingiz avtomatik qoʻshiladi"); return; }
  frPending(null);
  if (uid === USER.uid) { if (!quiet) toast("Bu sizning havolangiz — uni doʻstlaringizga yuboring"); return; }
  const L = frList();
  if (L.includes(uid)) { if (!quiet) toast("Allaqachon doʻstingiz"); go("rank-fr"); return; }
  if (L.length >= FR_MAX) { toast(`Doʻstlar soni ${FR_MAX} tagacha`); return; }
  try { await db.collection("invites").doc(uid).collection("from").doc(USER.uid).set({ name: frMyName(), at: firebase.firestore.FieldValue.serverTimestamp() }); }
  catch (e) { toast(e && e.code === "permission-denied" ? "Ruxsat yoʻq: Firestore qoidalari yangilanmagan boʻlishi mumkin" : "Internet aloqasini tekshiring"); return; }
  L.push(uid);
  let bonus = 0;
  if (!S.frIn) { S.frIn = uid; bonus = FR_JOIN_XP; addXPBonus(bonus); }
  save();
  RANK_CACHE.fr = null;
  pamukSoon("happy", bonus ? `Yangi doʻst qoʻshildi! Taklif uchun +${bonus} XP` : "Yangi doʻst qoʻshildi! Endi birga bellashasiz");
  go("rank-fr");
}
// Friends who opened my link: add them back, pay the invite bonus, clear the notes
async function frInbox() {
  if (!USER || !db) return;
  let snap;
  try { snap = await db.collection("invites").doc(USER.uid).collection("from").get(); } catch (e) { return; }
  const L = frList();
  let added = 0;
  for (const d of snap.docs) {
    const id = d.id, name = (d.data() || {}).name || "Doʻstingiz";
    if (id !== USER.uid && !L.includes(id) && L.length < FR_MAX) {
      L.push(id); added++;
      if ((S.frB || 0) < FR_BONUS_MAX) { S.frB = (S.frB || 0) + 1; addXPBonus(FR_XP); celebrate({ eyebrow: "Yangi doʻst", title: `${name} taklifingizni qabul qildi!`, text: `Endi doʻstlar reytingida birga bellashasiz. Taklif uchun +${FR_XP} XP`, ico: "users", c: "sky" }); }
    }
    d.ref.delete().catch(() => {});
  }
  if (added) { RANK_CACHE.fr = null; save(); if (location.hash === "#rank-fr" || (location.hash === "#rank" && RANK_TAB === "fr")) loadRank(); }
}
function frRemove(uid) {
  S.fr = frList().filter(x => x !== uid); save();
  RANK_CACHE.fr = null; loadRank();
}
function frInviteBox() {
  return `<div class="glass pad fr-invite">
    <b>${ICON.users}Doʻstlarni taklif qiling</b>
    <p class="muted">Havolani yuboring: doʻstingiz uni ochib qoʻshilsa, ikkalangiz bir-biringizni reytingda koʻrasiz. Har bir yangi doʻst uchun +${FR_XP} XP${(S.frB || 0) >= FR_BONUS_MAX ? " (bonus chegarasi toʻldi)" : ""}.</p>
    <code class="fr-link">${esc(frLink())}</code>
    <div class="fr-actions"><button class="btn btn-grad" data-act="fr-share">${ICON.heart}Taklif yuborish</button><button class="btn btn-ghost" data-act="fr-copy">${ICON.copy}Nusxalash</button></div>
  </div>`;
}
function viewFriendInvite(uid) {
  if (USER && uid !== USER.uid && !frList().includes(uid)) frPending(uid); else if (!USER) frPending(uid);
  return `${topbar()}<div class="lesson-head"><div class="tags"><span class="tag sky-t">${ICON.users}Taklif</span></div><h1>Doʻstlik taklifi</h1></div>
  <div id="fr-join"><div class="glass empty"><div class="spin"></div>Yuklanmoqda…</div></div>`;
}
async function friendInviteLoad(uid) {
  const box = $("fr-join");
  if (!box) return;
  if (!USER || !db) { box.innerHTML = `<div class="glass pad grp-invite">${mascot("wave")}<h2>Sizni Türkçe Yoʻl'ga taklif qilishdi!</h2><p class="muted">Turk tilini oʻzbek tilida bepul oʻrganing. Hisobga kiring yoki roʻyxatdan oʻting — doʻstingiz avtomatik qoʻshiladi va siz +${FR_JOIN_XP} XP olasiz.</p></div>`; CatLife.scan(); return; }
  if (uid === USER.uid) { box.innerHTML = `<div class="glass empty"><b>Bu sizning taklif havolangiz</b><span class="muted">Uni doʻstlaringizga yuboring.</span></div>${frInviteBox()}`; return; }
  if (frList().includes(uid)) { go("rank-fr"); return; }
  let name = "";
  try { const d = await db.collection("league").doc(uid).get(); name = d.exists ? d.data().name || "" : ""; } catch (e) {}
  if (!$("fr-join")) return;
  $("fr-join").innerHTML = `<div class="glass pad grp-invite">${mascot("wave")}<h2>${esc(name || "Doʻstingiz")} sizni taklif qilyapti</h2>
    <p class="muted">Doʻst boʻlsangiz, bir-biringizning haftalik XP, darajasi va ketma-ket kunlarini koʻrasiz.${S.frIn ? "" : ` Taklif uchun +${FR_JOIN_XP} XP!`}</p>
    <button class="btn btn-grad btn-block" data-act="fr-add" data-u="${esc(uid)}">Doʻst boʻlish</button></div>`;
  CatLife.scan();
}
