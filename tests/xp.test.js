// XP v2: fixed rewards per finished task, anti-farming guards, levels and Pamuk's growth,
// daily tasks, the weekly challenge, streak bonus, three leaderboards and leagues.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { ROOT, launch, openApp, answerAllRight, closeCelebrate } = require("./helpers");
const { openFb } = require("./fakefb");

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

// Same date helpers as app.js (local time zone of this machine = the browser's)
const DAY = 864e5;
const dayNum = (t = Date.now()) => Math.floor((t - new Date(t).getTimezoneOffset() * 6e4) / DAY);
const keyOf = n => new Date(n * DAY).toISOString().slice(0, 10);
const weekStart = n => n - (new Date(n * DAY).getUTCDay() + 6) % 7;
const THIS_WEEK = keyOf(weekStart(dayNum())), LAST_WEEK = keyOf(weekStart(dayNum()) - 7), TODAY = keyOf(dayNum());

// The result screen counts the XP up from 0: read it once the count has finished
const resText = async page => {
  await page.waitForFunction(() => { const b = document.querySelector("[data-count]"); return !b || b.textContent === `+${b.dataset.count} XP`; });
  return page.textContent(".result");
};
test("reward table: accuracy, set size, repeats, fast tapping, daily ceiling, self-rated cards", async () => {
  const { page, errors } = await openApp(browser, "#home");
  const r = await page.evaluate(() => {
    const c = (k, o) => xpCalc(k, o).xp;
    const out = {
      vals: [c("vocab", { right: 10, n: 10 }), c("grammar", { right: 10, n: 10 }), c("listening", { right: 10, n: 10 }), c("speaking", { right: 10, n: 10 }), c("writing", { acc: 0.9 }), c("reading", { right: 8, n: 10 })],
      low: xpCalc("vocab", { right: 3, n: 10 }), half: c("vocab", { right: 6, n: 10 }), small: c("vocab", { right: 2, n: 2 }),
      cards: c("vocab", { right: 10, n: 10, half: true }),
      fast: xpCalc("vocab", { right: 10, n: 10, times: [200, 300, 250, 260, 220] })
    };
    // The same exercise again on the same day: 30 → 15 → 8 → 0
    out.rep = [1, 2, 3, 4].map(() => xpAward("vocab", { right: 10, n: 10, key: "quiz|0" }).xp);
    // Daily ceiling for activity XP
    S.xpr.a = XP_DAY_CAP - 10;
    out.cap = xpCalc("speaking", { right: 10, n: 10, key: "new" });
    return out;
  });
  assert.deepEqual(r.vals, [30, 40, 40, 60, 60, 40]);
  assert.equal(r.low.xp, 0); assert.equal(r.low.why, "low");
  assert.equal(r.half, 18);
  assert.equal(r.small, 12);
  assert.equal(r.cards, 15);
  assert.equal(r.fast.xp, 0); assert.equal(r.fast.why, "fast");
  assert.deepEqual(r.rep, [30, 15, 8, 0]);
  assert.equal(r.cap.xp, 10); assert.equal(r.cap.why, "cap");
  assert.deepEqual(errors, []);
});

test("a practice session pays once at the end; repeating it pays less and says why; daily tasks pay 100", async () => {
  const { page, errors } = await openApp(browser, "#home");
  await page.evaluate(() => { XP_FAST_MS = 0; });
  await page.evaluate(() => startSession("quiz", "0"));
  await answerAllRight(page);
  assert.equal(await page.evaluate(() => S.xp), 30);
  assert.match(await resText(page), /\+30 XP[\s\S]*Lugʻat testi/);
  await page.click("[data-act=again]");
  await answerAllRight(page);
  assert.equal(await page.evaluate(() => S.xp), 45);
  assert.match(await resText(page), /\+15 XP[\s\S]*bugun 2-marta/);
  await page.click("[data-act=close-session]");
  // Too fast: no XP, the result explains it
  await page.evaluate(() => { XP_FAST_MS = 1e9; startSession("quiz", "1"); });
  await answerAllRight(page);
  assert.equal(await page.evaluate(() => S.xp), 45);
  assert.match(await resText(page), /juda tez/);
  await page.click("[data-act=close-session]");
  await page.evaluate(() => { XP_FAST_MS = 0; });
  // Daily tasks: vocab is done; grammar and the third task finish the set: +100 on top
  const q = await page.evaluate(() => { const q = dqToday(); return { k: q.k, ok: q.ok }; });
  assert.equal(q.k[0], "vocab"); assert.deepEqual(q.ok, { vocab: 1 });
  await page.evaluate(() => { location.hash = "#home"; });
  await page.waitForTimeout(150);
  assert.equal(await page.locator(".dq-row.ok").count(), 1);
  const res = await page.evaluate(() => { const q = dqToday(); xpAward("grammar", { right: 10, n: 10, key: "g" }); const before = S.xp; xpAward(q.k[2], { right: 10, n: 10, key: "t" }); return { gain: S.xp - before, paid: S.dq.paid, cel: ACH_QUEUE.map(c => c.title) }; });
  assert.equal(res.paid, 1);
  assert.ok(res.gain >= 140, `third task + bonus gave ${res.gain}`);
  assert.ok(res.cel.includes("Bugungi vazifalar bajarildi!"));
  // A careless session does not tick a task
  const low = await page.evaluate(() => { S.dq = null; xpAward("vocab", { right: 3, n: 10 }); return dqToday().ok; });
  assert.deepEqual(low, {});
  assert.deepEqual(errors, []);
});

test("weekly challenge, 7-day streak bonus, Pamuk cheers a streak and welcomes back after a break", async () => {
  const { page, errors } = await openApp(browser, "#home", { state: { lastDay: keyOf(dayNum() - 1), streak: 6, best: 6, achv: {} } });
  const r = await page.evaluate(() => { const b = S.xp; skillLog("r", true); return { streak: S.streak, gain: S.xp - b, cel: ACH_QUEUE.map(c => c.title) }; });
  assert.deepEqual(r, { streak: 7, gain: 150, cel: ["7 kun ketma-ket!"] });
  // Weekly challenge: whichever of the three runs this week, enough good sessions finish it
  const w = await page.evaluate(() => {
    const wc = wcWeek(); wc.days = ["a", "b", "c", "d"]; wc.n = 14; wc.sk = { r: 2, l: 2, w: 2, s: 1 };
    const b = S.xp; xpAward("speaking", { right: 10, n: 10, key: "x1" });
    return { paid: S.wc.paid, gain: S.xp - b, id: WC[S.wc.c].id };
  });
  assert.equal(w.paid, 1, `challenge ${w.id}`);
  assert.equal(w.gain, 60 + 250);
  await closeCelebrate(page);
  await page.close();

  // A day off between: Pamuk says the streak count; after 5 days away he misses you
  const b = await openApp(browser, "#home", { state: { lastDay: keyOf(dayNum() - 5), streak: 9, best: 9, achv: {} } });
  assert.match(await b.page.textContent(".comeback"), /Pamuk sizni sogʻindi[\s\S]*5 kun/);
  await b.page.evaluate(() => { S.xp; skillLog("r", true); });
  await b.page.waitForTimeout(600);
  assert.match(await b.page.textContent("#pamuk-say"), /Qaytganingizdan xursandman/);
  assert.equal(await b.page.evaluate(() => S.streak), 1);
  assert.deepEqual(errors.concat(b.errors), []);
});

test("levels from XP and Pamuk's look: kitten → legend, a party on level up", async () => {
  const { page, errors } = await openApp(browser, "#profile", { state: { xp: 90, lvl: 1, achv: {} } });
  const lv = await page.evaluate(() => [0, 99, 100, 999, 1000, 4500, 19000, 43500, 78000, 122500].map(lvlOf));
  assert.deepEqual(lv, [1, 1, 2, 4, 5, 10, 20, 30, 40, 50]);
  const st = await page.evaluate(() => [1, 5, 10, 20, 30, 40, 50].map(l => catStage(l).id));
  assert.deepEqual(st, ["kitten", "student", "smart", "grad", "wizard", "royal", "legend"]);
  // Each stage draws its own accessories
  const parts = await page.evaluate(() => {
    const has = (look, sel) => { const d = document.createElement("div"); d.innerHTML = catSVG({ look }); return !!d.querySelector(sel); };
    return [has("kitten", ".cat-tie"), has("student", ".cat-tie"), has("smart", ".cat-glasses"), has("grad", ".cat-diploma"), has("wizard", ".cat-wizhat"), has("royal", ".cat-crown"), has("legend", ".cat-aura")];
  });
  assert.deepEqual(parts, [false, true, true, true, true, true, true]);
  assert.match(await page.textContent(".grow-card"), /Mushukcha/);
  // 90 → 4600 XP: level 10, Pamuk becomes the glasses-wearing scholar
  const c = await page.evaluate(() => { addXP(4510); return { lvl: S.lvl, cel: ACH_QUEUE.filter(c => c.eyebrow !== "Kunlik maqsad").map(c => [c.title, c.look]) }; });
  assert.equal(c.lvl, 10);
  assert.deepEqual(c.cel[0], ["10-daraja ochildi!", "smart"]);
  await page.waitForSelector("#celebrate:not([hidden]) .cat-glasses");
  await closeCelebrate(page);
  await page.evaluate(() => { location.hash = "#home"; });
  await page.waitForTimeout(150);
  assert.match(await page.textContent(".lvl-card"), /10-daraja · Bilimdon mushuk/);
  assert.ok(await page.locator(".lvl-card .cat-glasses").count());
  assert.deepEqual(errors, []);
});

test("course exercises pay per finished exercise (first tries count), not per answer", async () => {
  const { page, errors } = await openApp(browser, "#k-a1-1");
  await page.evaluate(() => loadCourse());
  const r = await page.evaluate(() => {
    const u = KU["a1-1"], keys = kKeys(u), blk = keys[0].split("-")[0], mine = keys.filter(k => k.split("-")[0] === blk);
    const ans = k => { const [n, i] = k.split("-"); return n === "r" ? u.reading.ans[i] : u.exercises.find(e => String(e.n) === n).ans[i]; };
    const xs = [];
    mine.forEach((k, i) => { kSubmit("a1-1", k, i === 0 ? "yanlış cevap" : ans(k)); xs.push(S.xp); });
    kSubmit("a1-1", mine[0], ans(mine[0]));
    return { n: mine.length, xs, after: S.xp, xb: S.k["a1-1"].xb };
  });
  assert.ok(r.xs.slice(0, -1).every(x => x === 0), "no XP before the exercise is finished");
  const right = r.n - 1, k = Math.min(1, (right / r.n - 0.3) / 0.5) * Math.min(1, r.n / 5);
  assert.equal(r.xs[r.xs.length - 1], right / r.n < 0.4 ? 0 : Math.round(40 * k));
  assert.equal(r.after, r.xs[r.xs.length - 1], "fixing an answer later does not pay again");
  assert.deepEqual(errors, []);
});

test("guest leagues: a strong week moves up even without the table", async () => {
  const { page, errors } = await openApp(browser, "#rank", { state: { week: LAST_WEEK, wxp: 1200, xp: 1500, lg: 1 } });
  await page.waitForTimeout(100);
  const r = await page.evaluate(() => ({ lg: S.lg, lgw: S.lgw, pw: S.pw, pwxp: S.pwxp, wxp: S.wxp }));
  assert.deepEqual(r, { lg: 2, lgw: THIS_WEEK, pw: LAST_WEEK, pwxp: 1200, wxp: 0 });
  assert.match(await page.textContent("#app .seg"), /Bugun[\s\S]*Hafta[\s\S]*Umumiy/);
  assert.deepEqual(errors, []);
});

test("signed-in leagues: last week's table decides promotion; three leaderboards", async () => {
  const me = { uid: "u1", displayName: "Aziz Rahimov", email: "a@x.uz" };
  const seed = {
    "users/u1": { name: "Aziz Rahimov", gender: "m", birth: "2000-01-01", progress: { onb: 1, xp: 2000, week: LAST_WEEK, wxp: 900, lg: 1, lvl: 6 } },
    // Last week in Bronze: p2 (already in the new week) 1200, me 900, p1 500, p3 100 → top 30% of 4 = 2 places
    "league/p1": { name: "Bek", week: LAST_WEEK, wxp: 500, xp: 3000, lg: 1 },
    "league/p2": { name: "Dilnoza", week: THIS_WEEK, wxp: 80, xp: 9000, lg: 2, pw: LAST_WEEK, pwxp: 1200, plg: 1, day: TODAY, dxp: 80 },
    "league/p3": { name: "Sardor", week: LAST_WEEK, wxp: 100, xp: 400, lg: 1 },
    "league/p4": { name: "Laylo", week: LAST_WEEK, wxp: 5000, xp: 40000, lg: 2 },
    "league/p5": { name: "Olim", week: THIS_WEEK, wxp: 300, xp: 700, lg: 1, day: TODAY, dxp: 120 }
  };
  const { page, errors } = await openFb(browser, "#home", { user: me, seed });
  await page.waitForFunction(() => S.lgw === weekKey());
  assert.deepEqual(await page.evaluate(() => [S.lg, S.lgr.rank, S.lgr.n, S.lgr.from, S.lgr.to]), [2, 2, 4, 1, 2]);
  // The week summary opens by itself once (after the achievement pop-ups are closed): league step, place, XP
  await page.waitForFunction(() => {
    if (!$("celebrate").hidden) { ACH_QUEUE.length = 0; $("celebrate").hidden = true; }
    return !$("sheet").hidden && document.querySelector(".recap");
  }, null, { timeout: 15000, polling: 300 });
  const recap = await page.textContent(".recap");
  assert.match(recap, /Kumush ligasiga koʻtarildingiz[\s\S]*900[\s\S]*2\/4/);
  assert.equal(await page.evaluate(() => S.lgr.seen), 1);
  await page.click("[data-act=sheet-done]");
  await closeCelebrate(page);
  // The public row carries today, the week inside the league and last week for the others to settle
  await page.evaluate(() => { addXP(40); cloudSave(true); });
  await page.waitForFunction(() => __db["league/u1"] && __db["league/u1"].lg === 2 && __db["league/u1"].wxp >= 40);
  const row = await page.evaluate(() => __db["league/u1"]);
  assert.deepEqual(Object.keys(row).sort(), ["at", "day", "dxp", "lg", "lgw", "name", "plg", "pw", "pwxp", "streak", "week", "wxp", "xp"]);
  // (an achievement unlocked meanwhile may add +20 on top of the 40)
  assert.deepEqual([row.pw, row.pwxp, row.plg, row.day], [LAST_WEEK, 900, 1, TODAY]);
  assert.ok(row.dxp >= 40 && row.wxp === row.dxp, `dxp ${row.dxp}, wxp ${row.wxp}`);
  // Weekly table = my league only (Silver): Dilnoza and me, not Olim (Bronze)
  await page.evaluate(() => { RANK_TAB = "week"; location.hash = "#rank"; });
  await page.waitForSelector(".podium");
  const week = await page.textContent("#rank-body");
  assert.match(week, /Dilnoza/); assert.doesNotMatch(week, /Olim/);
  assert.match(await page.textContent(".lg-card"), /Kumush ligasi[\s\S]*2-oʻrin \(4 kishi\)/);
  // …and again from the leaderboard
  await closeCelebrate(page);
  await page.evaluate(() => document.querySelector("[data-act=recap]").click());
  await page.waitForSelector("#sheet:not([hidden]) .recap");
  await page.evaluate(() => document.querySelector("[data-act=sheet-done]").click());
  // Today: everyone with XP today
  await closeCelebrate(page);
  await page.evaluate(() => document.querySelector("[data-act=rank-tab][data-t=day]").click());
  await page.waitForSelector(".podium");
  const day = await page.textContent("#rank-body");
  assert.match(day, /Olim[\s\S]*120 XP/); assert.match(day, /Dilnoza/);
  // All time: by XP with levels
  await closeCelebrate(page);
  await page.evaluate(() => document.querySelector("[data-act=rank-tab][data-t=all]").click());
  await page.waitForSelector(".podium");
  assert.match(await page.textContent("#rank-body"), /Laylo[\s\S]*40000 XP/);
  assert.deepEqual(errors, []);
});

test("an idle week moves one league down, with a gentle word from Pamuk", async () => {
  const me = { uid: "u2", displayName: "Malika", email: "m@x.uz" };
  const seed = { "users/u2": { name: "Malika", gender: "f", birth: "2000-01-01", progress: { onb: 1, xp: 3000, week: keyOf(weekStart(dayNum()) - 21), wxp: 700, lg: 4, lvl: 8, achv: {} } } };
  const { page, errors } = await openFb(browser, "#home", { user: me, seed });
  await page.waitForFunction(() => S.lgw === weekKey());
  assert.deepEqual(await page.evaluate(() => [S.lg, S.pwxp]), [3, 0]);
  await page.waitForTimeout(1400);
  assert.match(await page.textContent("#pamuk-say"), /Oltin/);
  assert.deepEqual(errors, []);
});

test("league rules: new fields, limits and once-a-week league change are in firestore.rules", () => {
  const rules = fs.readFileSync(path.join(ROOT, "firestore.rules"), "utf8");
  const m = rules.slice(rules.indexOf("match /league/"), rules.indexOf("match /groups/"));
  assert.match(m, /hasOnly\(\['name', 'week', 'wxp', 'xp', 'streak', 'day', 'dxp', 'lg', 'lgw', 'pw', 'pwxp', 'plg', 'at'\]\)/);
  assert.match(m, /d\.get\('dxp', 0\) <= 3500/);
  assert.match(m, /d\.at == request\.time/);
  assert.match(m, /request\.resource\.data\.get\('lgw', ''\) != resource\.data\.get\('lgw', ''\)/);
  assert.match(m, /request\.time\.toMillis\(\) - resource\.data\.at\.toMillis\(\)/);
});

test("old Firestore rules (not yet republished): the league row falls back to the five old fields", async () => {
  const me = { uid: "u3", displayName: "Bek", email: "b@x.uz" };
  const { page, errors } = await openFb(browser, "#home", { user: me, seed: { "users/u3": { name: "Bek", gender: "m", birth: "2000-01-01", progress: { onb: 1, achv: {} } } } });
  await page.evaluate(() => { __deny((op, p, d) => p.startsWith("league/") && d && Object.keys(d).some(k => !["name", "week", "wxp", "xp", "streak"].includes(k))); addXP(30); cloudSave(true); });
  await page.waitForFunction(() => __db["league/u3"]);
  assert.deepEqual(Object.keys(await page.evaluate(() => __db["league/u3"])).sort(), ["name", "streak", "week", "wxp", "xp"]);
  assert.deepEqual(errors, []);
});

/* Server league results (tools/league.js → lgres/{uid}): the same rule over the whole table; the app takes them */
test("server leagues: the weekly job settles every league with the app's rule", () => {
  const { settle, lastWeek, orphans } = require("../tools/league.js");
  // Results of deleted accounts are cleaned up: only lgres documents without a league row go
  assert.deepEqual(orphans(["u1", "u2"], ["u1", "u3", "u2", "u4"]), ["u3", "u4"]);
  assert.equal(lastWeek(new Date("2026-11-16T02:17:00Z")), "2026-11-09");
  const W = "2026-11-09";
  const rows = [
    { id: "a", week: W, wxp: 900, lg: 1 }, { id: "b", week: "2026-11-16", pw: W, pwxp: 1200, plg: 1 },
    { id: "c", week: W, wxp: 500, lg: 1 }, { id: "d", week: W, wxp: 100, lg: 1 }, { id: "e", week: W, wxp: 0, lg: 1 },
    { id: "f", week: W, wxp: 20, lg: 3 }, { id: "g", week: W, wxp: 5000, lg: 7 }, { id: "h", week: "2026-11-02", wxp: 999, lg: 2 }
  ];
  const r = settle(rows, W);
  // Bronze: b 1200, a 900, c 500, d 100 active → top 30% of 4 = 2 places with ≥300 XP
  assert.deepEqual([r.b.to, r.b.rank, r.a.to, r.a.rank, r.c.to, r.d.to, r.e.to], [2, 1, 2, 2, 1, 1, 1]);
  assert.equal(r.a.n, 4);
  assert.equal(r.f.to, 2, "an idle week moves down");
  assert.equal(r.g.to, 7, "Legend is the top");
  assert.equal(r.h, undefined, "an older week is not this week's");
});

test("server leagues: the app takes the server's result over its own count", async () => {
  const me = { uid: "u1", displayName: "Aziz Rahimov", email: "a@x.uz" };
  const seed = {
    "users/u1": { name: "Aziz Rahimov", gender: "m", birth: "2000-01-01", progress: { onb: 1, xp: 2000, week: LAST_WEEK, wxp: 900, lg: 1, lvl: 6 } },
    // The table alone would promote (only player), the server says otherwise — the server wins
    "lgres/u1": { w: LAST_WEEK, from: 1, to: 1, rank: 5, n: 12, xp: 900 }
  };
  const { page, errors } = await openFb(browser, "#home", { user: me, seed });
  await page.waitForFunction(() => S.lgw === weekKey());
  assert.deepEqual(await page.evaluate(() => [S.lg, S.lgr.rank, S.lgr.n, S.lgr.to]), [1, 5, 12, 1]);
  assert.match(fs.readFileSync(path.join(ROOT, "firestore.rules"), "utf8"), /match \/lgres\/\{uid\} \{\s*allow read: if okUser\(\) && request\.auth\.uid == uid;\s*\}/);
  assert.match(fs.readFileSync(path.join(ROOT, ".github/workflows/league.yml"), "utf8"), /node tools\/league\.js/);
  assert.deepEqual(errors, []);
  await page.close();
});
