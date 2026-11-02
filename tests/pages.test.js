// Every page opens without JavaScript errors.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { launch, openApp, closeCelebrate } = require("./helpers");

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

const ROUTES = ["#home", "#course", "#k-a1-1", "#k-b2-5", "#ktest-a1", "#ktest-b2", "#lessons", "#grammar", "#guide", "#g-a2-04", "#g-b2-09", "#gx",
  "#alphabet", "#practice", "#rank", "#profile", "#achievements", "#help", "#translate", "#skills", "#write", "#admin"];

test("all main pages render without errors", async () => {
  const { page, errors } = await openApp(browser, "#home");
  for (const h of ROUTES) {
    await page.evaluate(h => { location.hash = h; }, h);
    await page.waitForTimeout(120);
    await closeCelebrate(page);
    const len = await page.evaluate(() => document.getElementById("app").innerText.trim().length);
    assert.ok(len > 40, `${h} rendered almost nothing`);
  }
  assert.deepEqual(errors, []);
});

test("course unit tabs and guide level chips work", async () => {
  const { page, errors } = await openApp(browser, "#k-a2-7");
  for (const t of ["vocab", "grammar", "dialog", "read", "ex"]) {
    await page.evaluate(t => { KTAB = t; route(); }, t);
    assert.ok(await page.evaluate(() => document.getElementById("app").innerText.length > 100), `tab ${t}`);
  }
  await page.evaluate(() => { location.hash = "#guide"; });
  for (const lv of ["A1", "A2", "B1", "B2"]) {
    await page.click(`[data-act=guide-lv][data-l=${lv}]`);
    assert.ok(await page.evaluate(lv => document.querySelector(".level-head b").innerText === lv, lv));
  }
  assert.deepEqual(errors, []);
});
