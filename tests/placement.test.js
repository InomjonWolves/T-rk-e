// Placement test: suggests where the course starts and moves the course there.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { launch, openApp, closeCelebrate } = require("./helpers");

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

// Answers placement questions; levels listed in `right` get correct answers, the rest wrong ones
async function answer(page, right) {
  await page.evaluate(right => {
    const P = plGet(), it = P.it, ok = lv => right.includes(lv);
    it.r.forEach((q, i) => document.querySelector(`[data-act=pl-r][data-i="${i}"][data-o="${ok(q.lv) ? q.a : (q.a + 1) % q.o.length}"]`).click());
    it.l.forEach((q, i) => { const c = q.o.indexOf(q.a); document.querySelector(`[data-act=pl-l][data-i="${i}"][data-o="${ok(q.lv) ? c : (c + 1) % q.o.length}"]`).click(); });
    it.w.forEach((q, i) => { const inp = document.querySelector(`[data-act=pl-w][data-i="${i}"]`); inp.value = ok(q.lv) ? q.a.split(/\s*\/\s*/)[0] : "xyz"; inp.dispatchEvent(new Event("input", { bubbles: true })); });
  }, right);
}

test("placement: every level right → C1; the speaking part is optional", async () => {
  const { page, errors } = await openApp(browser, "#placement", { sr: true });
  const sizes = await page.evaluate(() => { const it = plGet().it; return [it.r.length, it.l.length, it.w.length, it.s.length]; });
  assert.deepEqual(sizes, [10, 5, 5, 2]);
  await answer(page, ["A1", "A2", "B1", "B2", "C1"]);
  const n = await page.evaluate(() => plGet().it.s.length);
  for (let i = 0; i < n; i++) {
    await page.evaluate(i => { window.__say = () => plGet().it.s[i].tr; }, i);
    await page.click(`[data-act=pl-mic][data-i="${i}"]`);
    await page.waitForFunction(i => !KT_REC && !!plGet().ans.s[i], i);
  }
  await page.click("[data-act=pl-done]"); await page.waitForTimeout(150); await closeCelebrate(page);
  const r = await page.evaluate(() => plGet().res);
  assert.equal(r.passed, "C1");
  assert.equal(r.start, "C1");
  assert.deepEqual(r.sk, { r: "C1", l: "C1", w: "C1", s: "B1" });
  assert.deepEqual(errors, []);
});

test("placement: only A1 right → start at A2, and the course moves there", async () => {
  const { page, errors } = await openApp(browser, "#placement");
  await answer(page, ["A1"]);
  await page.click("[data-act=pl-done]"); await page.waitForTimeout(150); await closeCelebrate(page);
  const r = await page.evaluate(() => plGet().res);
  assert.equal(r.passed, "A1");
  assert.equal(r.start, "A2");
  assert.equal(r.sk.s, null, "speaking was not attempted");
  await page.click('[data-act=pl-apply][data-l="A2"]'); await page.waitForTimeout(150); await closeCelebrate(page);
  assert.equal(await page.evaluate(() => location.hash), "#course");
  assert.deepEqual(await page.evaluate(() => [kNext().id, kDoneCount(), S.kStart]), ["a2-1", 0, 8]);
  // A missing answer is reported, not scored
  await page.evaluate(() => { PL = null; location.hash = "#placement"; });
  await page.waitForTimeout(100);
  await page.click("[data-act=pl-done]");
  assert.match(await page.evaluate(() => document.getElementById("toast").innerText), /javob tanlanmagan/);
  assert.deepEqual(errors, []);
});

test("home page offers the placement test to new learners until skipped", async () => {
  const { page, errors } = await openApp(browser, "#home");
  assert.ok(await page.evaluate(() => !!document.querySelector('a[href="#placement"]')));
  await page.click("[data-act=pl-skip]"); await page.waitForTimeout(100);
  assert.equal(await page.evaluate(() => !!document.querySelector("[data-act=pl-skip]")), false);
  assert.deepEqual(errors, []);
});

test("speaking: a sentence with digits is scored right when said correctly", async () => {
  const { page, errors } = await openApp(browser, "#placement");
  const r = await page.evaluate(() => {
    const t = sayNorm("Gerekirse 112'yi ararız.").out;
    const one = [heardNorm("gerekirse 112'yi ararız"), heardNorm("Gerekirse yüz on iki yi ararız")].map(h => sayDiff(t, h).score);
    // Every speaking item the tests can pick passes when its own text is heard
    const low = [];
    for (let k = 0; k < 150; k++) plGen().it.s.forEach(q => {
      const sc = q.kind === "oral" ? oralScore(q.tr, q.tr).score : sayDiff(sayNorm(q.tr).out, heardNorm(q.tr)).score;
      if (sc < ktNeed(q)) low.push(q.tr);
    });
    return { t, one, low: [...new Set(low)] };
  });
  assert.equal(r.t, "gerekirse yüz on iki yi ararız");
  assert.deepEqual(r.one, [1, 1]);
  assert.deepEqual(r.low, []);
  assert.deepEqual(errors, []);
});
