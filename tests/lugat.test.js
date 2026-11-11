// Vocabulary base (lugat.js) in the app, and the grammar topics added in 2026-11.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { launch, openApp, answerAllRight, closeCelebrate } = require("./helpers");

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

test("vocabulary base: 3000+ words in the app, level pages, pack pages, homonyms keep their meaning", async () => {
  const { page, errors } = await openApp(browser, "#lessons");
  const r = await page.evaluate(() => ({ all: ALL.length, packs: LPACKS.length, card: !!document.querySelector('a[href="#lugat"]') }));
  assert.ok(r.all >= 3000, `only ${r.all} words`);
  assert.equal(r.card, true);
  await page.click('a[href="#lugat"]');
  await page.waitForTimeout(100);
  for (const lv of ["A1", "A2", "B1", "B2", "C1"]) {
    await page.click(`[data-act=lug-lv][data-l="${lv}"]`);
    const n = await page.evaluate(lv => [document.querySelectorAll('#app a.unit[href^="#lugat-"]').length, LPACKS.filter(p => p.lv === lv).length], lv);
    assert.equal(n[0], n[1], lv);
  }
  const m = await page.evaluate(() => {
    const f = (id, tr) => LWORDS[id].find(w => fold(w.tr) === tr).uz;
    return [f("a1-sehir", "pazar"), f("a1-zaman", "pazar"), f("a1-ev", "ocak"), f("a1-zaman", "ocak")];
  });
  assert.deepEqual(m, ["bozor", "yakshanba", "plita", "yanvar"]);
  // Every pack page opens
  const bad = await page.evaluate(() => LPACKS.filter(p => { location.hash = "#lugat-" + p.id; route(); return document.querySelectorAll("#app .word").length !== LWORDS[p.id].length; }).map(p => p.id));
  assert.deepEqual(bad, []);
  // Search finds a word that only the base has
  await page.evaluate(() => { location.hash = "#lessons"; });
  await page.waitForTimeout(80);
  await page.fill("#q", "sürdürülebilir");
  await page.waitForTimeout(80);
  assert.match(await page.textContent("#search-results"), /barqaror/);
  assert.deepEqual(errors, []);
  await page.close();
});

test("vocabulary base: every practice mode works on a pack and learning is shared with other lessons", async () => {
  const { page, errors } = await openApp(browser, "#lugat-a1-zaman");
  await page.click("[data-act=modes]");
  await page.click('[data-act=start][data-mode="quiz"]');
  assert.match(await answerAllRight(page), /^(\d+)\/\1$/);
  await page.evaluate(() => closeSession()); await closeCelebrate(page);
  for (const mode of ["cards", "type", "listen", "dict"]) {
    await page.evaluate(m => startSession(m, "l:b2-deyim"), mode);
    assert.match(await answerAllRight(page), /^(\d+)\/\1$/, mode);
    await page.evaluate(() => closeSession()); await closeCelebrate(page);
  }
  // A homonym practised in one pack counts in the other (one record per spelling)
  const shared = await page.evaluate(() => { const a = LWORDS["a1-sehir"].find(w => fold(w.tr) === "pazar"), b = LWORDS["a1-zaman"].find(w => fold(w.tr) === "pazar"); return a.tr === b.tr; });
  assert.equal(shared, true);
  assert.ok(await page.evaluate(() => Object.keys(S.srs).length) > 0);
  assert.deepEqual(errors, []);
  await page.close();
});

test("grammar topics added in 2026-11: pages open and every exercise can be answered right", async () => {
  const { page, errors } = await openApp(browser, "#guide");
  const codes = ["A1.34", "A2.30", "A2.31", "B1.28", "B1.29", "B2.24", "B2.25", "B2.26", "B2.27", "B2.28"];
  for (const c of codes) {
    await page.evaluate(c => { location.hash = "#" + gHash(c); }, c);
    await page.waitForTimeout(60);
    assert.ok(await page.evaluate(c => document.querySelector("#app h1") && document.querySelector("#app .sub").textContent === GUIDE_ALL.find(i => i.code === c).tr, c), c);
    await page.evaluate(c => startSession("gx", c), c);
    const n = await page.evaluate(() => SES.items.length);
    assert.equal(await answerAllRight(page), `${n}/${n}`, c);
    await page.evaluate(() => closeSession()); await closeCelebrate(page);
  }
  assert.deepEqual(errors, []);
  await page.close();
});
