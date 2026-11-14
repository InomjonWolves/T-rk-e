// Course order (2026-11-14): levels and units open one after another; the placement test opens levels at once
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { launch, openApp } = require("./helpers");
let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });
const done = { e: {}, v: {}, done: 1 };

test("a new learner: A1 open, the rest locked; units one by one; the level test after all units", async () => {
  const { page, errors } = await openApp(browser, "#course", { state: { onb: 1 } });
  assert.deepEqual(await page.evaluate(() => LVS.map(lvOpen)), [true, false, false, false, false]);
  assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll(".pnode")].map(n => n.className.match(/s-(\w+)/g).join(" "))),
    ["s-now", "s-lock", "s-lock", "s-lock", "s-lock", "s-lock", "s-lock", "s-lock", "s-test s-lock"]);
  assert.equal(await page.locator("#app .seg .seg-lock").count(), 4);
  // A locked unit and a locked test show why and what opens them
  await page.evaluate(() => { location.hash = "#k-a1-3"; });
  await page.waitForSelector(".lock-card");
  assert.match(await page.textContent(".lock-card"), /Avval A1\.2/);
  await page.evaluate(() => { location.hash = "#ktest-a1"; });
  await page.waitForFunction(() => /barcha boʻlimlari tugagach/.test(document.querySelector(".lock-card").textContent));
  // Finishing a unit opens the next one
  await page.evaluate(() => { S.k["a1-1"] = { e: {}, v: {}, done: 1 }; save(); });
  assert.deepEqual(await page.evaluate(() => [unitOpen("a1-2"), unitOpen("a1-3")]), [true, false]);
  assert.deepEqual(errors, []);
  await page.close();
});

test("the level test opens the next level; the home card leads to the test when it is the way on", async () => {
  const k = {}; ["a1-1", "a1-2", "a1-3", "a1-4", "a1-5", "a1-6", "a1-7", "a1-8"].forEach(id => { k[id] = done; });
  const { page, errors } = await openApp(browser, "#home", { state: { onb: 1, k } });
  assert.deepEqual(await page.evaluate(() => [kGate(), testOpen("A1"), lvOpen("A2")]), ["A1", true, false]);
  assert.equal(await page.getAttribute(".k-next", "href"), "#ktest-a1");
  await page.evaluate(() => { S.ktest = { A1: 80 }; save(); route(); });
  assert.deepEqual(await page.evaluate(() => [kGate(), lvOpen("A2"), unitOpen("a2-1"), unitOpen("a2-2")]), [null, true, true, false]);
  assert.equal(await page.getAttribute(".k-next", "href"), "#k-a2-1");
  assert.deepEqual(errors, []);
  await page.close();
});

test("the placement test opens every level up to its result; old progress and teacher tasks stay open; C1 test page", async () => {
  const { page, errors } = await openApp(browser, "#course", { state: { onb: 1, place: { passed: "A2", start: "B1" }, k: { "c1-2": { e: { "1-1": 1 }, v: {} } }, gtk: { ABC123: [{ id: "t1", kind: "k", ref: "b2-4" }] } } });
  const r = await page.evaluate(() => [LVS.map(lvOpen), unitOpen("a1-8"), unitOpen("a2-5"), unitOpen("b1-1"), unitOpen("b1-2"), unitOpen("c1-2"), unitOpen("c1-3"), unitOpen("b2-4"), unitOpen("b2-5")]);
  assert.deepEqual(r, [[true, true, true, true, true], true, true, true, false, true, false, true, false]);
  await page.evaluate(() => { S.place = { passed: "C1", start: "C1" }; save(); location.hash = "#ktest-c1"; });
  await page.waitForFunction(() => /C1/.test(document.getElementById("app").textContent) && !document.querySelector(".lock-card"));
  assert.ok(await page.evaluate(() => document.querySelector('[data-act="k-tq"]') !== null));
  assert.deepEqual(errors, []);
  await page.close();
});
