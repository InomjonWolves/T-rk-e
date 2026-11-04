// Writing check, four-part level tests and the anonymous statistics.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { launch, openApp, closeCelebrate } = require("./helpers");

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

const GOOD = "Dün sabah erken kalktım. Önce kahvaltı yaptım, sonra işe gittim. Otobüse binerken arkadaşımı gördüm. İşe vardıktan sonra e-postalarımı okudum. Öğle yemeğinden sonra bir toplantıya katıldım. Eve dönerken markete uğradım ve ekmek aldım. Akşam yemeğini yedikten sonra biraz kitap okudum. Yatmadan önce annemi aradım. En sonunda saat on birde uyudum.";
const BAD = "dun cok guzel bir gun oldu. qizim ile parka gittik ve cok guzel oynadik";

test("writing check: a good text scores high, a careless one gets concrete advice", async () => {
  const { page, errors } = await openApp(browser, "#write");
  const r = await page.evaluate(([g, b]) => {
    const u = KU["a2-8"], e = u.exercises.find(x => /^Yozish/.test(x.title));
    const a = wrCheck(g, { u, e }), c = wrCheck(b, { u, e });
    return { good: a.score, goals: a.goals.every(x => x.ok), bad: c.score, fixes: c.spell.map(s => s.w + ">" + (s.fix || "-")), lower: c.lowerStart, noEnd: c.noEnd };
  }, [GOOD, BAD]);
  assert.ok(r.good >= 90, `good text scored ${r.good}`);
  assert.ok(r.goals);
  assert.ok(r.bad < 40, `bad text scored ${r.bad}`);
  for (const f of ["dun>dün", "cok>çok", "guzel>güzel", "qizim>-"]) assert.ok(r.fixes.includes(f), `missing advice ${f}`);
  assert.ok(r.lower >= 1 && r.noEnd === 1);
  // Turkish-aware word boundaries: "önce" is found, "erken" is not a -ken form
  const b = await page.evaluate(() => { const t = (u, i, s) => WT[u][i][1].test(" " + s.toLocaleLowerCase("tr") + " "); return [t("a1-5", 2, "Önce geldim."), t("a2-8", 1, "Erken kalktım."), t("a2-8", 1, "Eve dönerken")]; });
  assert.deepEqual(b, [true, false, true]);
  // Through the page: the check counts once for Yazma and gives the writing reward (60 XP) once
  await page.evaluate(() => { KTAB = "ex"; location.hash = "#k-a2-8"; });
  await page.waitForTimeout(150);
  await page.evaluate(g => { const ta = document.querySelector("textarea[data-act=k-write]"); ta.value = g; ta.dispatchEvent(new Event("input", { bubbles: true })); }, GOOD);
  await page.click("[data-act=wr-check]"); await closeCelebrate(page);
  await page.click("[data-act=wr-check]"); await closeCelebrate(page);
  assert.deepEqual(await page.evaluate(() => [S.sk.w[0], S.sk.w[1], S.xp, S.sk.w[2]]), [1, 1, 60, 60]);
  assert.deepEqual(errors, []);
});

test("level test: four parts are generated for every level and scored per skill", async () => {
  const { page, errors } = await openApp(browser, "#ktest-a2", { sr: true });
  const sizes = await page.evaluate(() => LVS.map(lv => { const g = ktGen(lv); return [g.l.length, g.w.length, g.s.length]; }));
  sizes.forEach(s => assert.deepEqual(s, [6, 6, 4]));
  await page.evaluate(() => {
    const t = KLEVEL("A2").test, qs = t.parts.flatMap(x => x.qs), g = ktGen("A2");
    qs.forEach((q, i) => document.querySelector(`[data-act=k-tq][data-i="${i}"][data-o="${q.a}"]`).click());
    g.l.forEach((q, i) => document.querySelector(`[data-act=kt-l][data-i="${i}"][data-o="${q.o.indexOf(q.a)}"]`).click());
    g.w.forEach((q, i) => { const inp = document.querySelector(`[data-act=kt-w][data-i="${i}"]`); inp.value = q.a.split(/\s*\/\s*/)[0]; inp.dispatchEvent(new Event("input", { bubbles: true })); });
  });
  const n = await page.evaluate(() => ktGen("A2").s.length);
  for (let i = 0; i < n; i++) {
    await page.evaluate(i => { window.__say = () => ktGen("A2").s[i].tr; }, i);
    await page.click(`[data-act=kt-mic][data-i="${i}"]`);
    await page.waitForFunction(i => !KT_REC && !!KT_ANS.s[i], i);
  }
  await page.click("[data-act=k-test-done]"); await page.waitForTimeout(200); await closeCelebrate(page);
  const res = await page.evaluate(() => ({ r: KTEST_RES, lv: SKILLS.map(s => skLevel(s.id)) }));
  assert.deepEqual(res.r.parts, { r: 100, l: 100, w: 100, s: 100 });
  assert.deepEqual(res.lv, ["A2", "A2", "A2", "A2"]);
  // Skipping the speaking part leaves it out of the average
  await page.evaluate(() => { location.hash = "#ktest-b1"; });
  await page.waitForTimeout(150);
  await page.evaluate(() => {
    const t = KLEVEL("B1").test, qs = t.parts.flatMap(x => x.qs), g = ktGen("B1");
    qs.forEach((q, i) => document.querySelector(`[data-act=k-tq][data-i="${i}"][data-o="${q.a}"]`).click());
    g.l.forEach((q, i) => document.querySelector(`[data-act=kt-l][data-i="${i}"][data-o="${q.o.indexOf(q.a)}"]`).click());
  });
  await page.click("[data-act=k-test-done]"); await page.waitForTimeout(200);
  assert.deepEqual(await page.evaluate(() => KTEST_RES.parts), { r: 100, l: 100, w: 0, s: null });
  assert.deepEqual(errors, []);
});

test("anonymous statistics: the summary fits the Firestore rules and the admin numbers add up", async () => {
  const { page, errors } = await openApp(browser, "#home", { state: { ktsk: { A1: { r: 80, l: 50, w: 70, s: null } } } });
  const d = await page.evaluate(() => statsDoc());
  assert.deepEqual(Object.keys(d).sort(), ["a", "act", "bal", "d", "f", "kt", "lv", "lvl", "ses", "t", "units", "v", "w"]);
  assert.ok(/^[01]{30}$/.test(d.a) && d.f.length === 10 && Number.isInteger(d.ses));
  assert.ok(Number.isInteger(d.v) && d.d.length === 10 && d.lv.length <= 2 && Number.isInteger(d.units) && d.bal >= 0 && d.bal <= 100 && d.act <= 14);
  assert.equal(JSON.stringify(d).includes("@"), false, "no e-mail in the summary");
  const a = await page.evaluate(() => {
    const today = todayKey(), old = keyOf(dayNum() - 30);
    const doc = (d, weakL) => ({ v: 1, d, lv: "A1", units: 1, bal: 50, act: 3, lvl: { r: "A1", l: "", w: "", s: "" }, kt: {},
      t: {}, w: { r: [20, 25, 5], l: [weakL ? 1 : 30, 5, 1], w: [10, 12, 3], s: [8, 9, 2] } });
    const docs = [doc(today, true), doc(today, true), doc(today, false), doc(old, true)];
    const r = adminAgg(docs);
    return { total: r.total, active: r.active, weakL: r.sk.l.weak, sumWeak: SKILLS.reduce((x, s) => x + r.sk[s.id].weak, 0), lvlR: r.lvl.r.A1 };
  });
  assert.deepEqual(a, { total: 4, active: 3, weakL: 2, sumWeak: 3, lvlR: 4 });
  // Return metrics: four learners who started 8 days ago
  const r = await page.evaluate(() => {
    const T = dayNum(), f = keyOf(T - 8), today = todayKey();
    // a = 30 days ending today; index 29 = today, 21 = f, 22 = f+1, 28 = f+7
    const row = on => { const a = Array(30).fill("0"); on.forEach(i => a[i] = "1"); return { f, d: today, a: a.join(""), ses: 4 }; };
    return retention([row([21, 22, 28, 29]), row([21, 22]), row([21, 24]), row([21])]);
  });
  assert.deepEqual([r.d1.p, r.d7.p, r.w1.p, r.dau, r.wau, r.n, r.ses], [50, 25, 75, 1, 2, 4, 4]);
  assert.equal(r.fresh[13 - 8], 4);
  assert.deepEqual(errors, []);
});

test("admin page explains why access is missing and shows the UID to compare", async () => {
  const { page, errors } = await openApp(browser, "#home");
  await page.evaluate(() => { USER = { uid: "abc123XYZ", providerData: [], email: "" }; db = {}; ADMIN = false; ADMIN_ERR = "notfound"; location.hash = "#admin"; });
  await page.waitForTimeout(150);
  const text = await page.evaluate(() => document.getElementById("app").innerText);
  assert.match(text, /abc123XYZ/);
  assert.match(text, /hujjat topilmadi/);
  assert.ok(await page.evaluate(() => !!document.querySelector("[data-act=copy-uid]")));
  await page.evaluate(() => { ADMIN_ERR = "permission-denied"; route(); });
  assert.match(await page.evaluate(() => document.getElementById("app").innerText), /qoidalar/);
  assert.deepEqual(errors, []);
});
