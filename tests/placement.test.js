// Placement test: suggests where the course starts and moves the course there.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { launch, openApp, closeCelebrate } = require("./helpers");

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

// Answers the questions of the stage on screen; levels listed in `right` get correct answers, the rest wrong ones
async function answer(page, right) {
  await page.evaluate(right => {
    const P = plGet(), it = P.it, ok = lv => right.includes(lv), cur = q => plStage(q.lv) === P.stage;
    it.r.forEach((q, i) => cur(q) && document.querySelector(`[data-act=pl-r][data-i="${i}"][data-o="${ok(q.lv) ? q.a : (q.a + 1) % q.o.length}"]`).click());
    it.l.forEach((q, i) => { if (!cur(q)) return; const c = q.o.indexOf(q.a); document.querySelector(`[data-act=pl-l][data-i="${i}"][data-o="${ok(q.lv) ? c : (c + 1) % q.o.length}"]`).click(); });
    it.w.forEach((q, i) => { if (!cur(q)) return; const inp = document.querySelector(`[data-act=pl-w][data-i="${i}"]`); inp.value = ok(q.lv) ? q.a.split(/\s*\/\s*/)[0] : "xyz"; inp.dispatchEvent(new Event("input", { bubbles: true })); });
  }, right);
}
const stage = page => page.evaluate(() => plGet().stage);
async function done(page) { await page.click("[data-act=pl-done]"); await page.waitForTimeout(150); await closeCelebrate(page); }
const ready = page => page.waitForFunction(() => typeof PLB !== "undefined" && document.querySelector("[data-act=pl-done]"));

test("placement: three stages; every level right → C1; the speaking part is optional", async () => {
  const { page, errors } = await openApp(browser, "#placement", { sr: true });
  await ready(page);
  const sizes = await page.evaluate(() => { const it = plGet().it; return [it.r.length, it.l.length, it.w.length, it.s.length]; });
  assert.deepEqual(sizes, [20, 10, 10, 2]);
  // Only the first stage (A1–A2) is on screen at first
  assert.equal(await page.locator("[data-act=pl-r]:not(.opt-idk)").count(), 8 * 4);
  for (let st = 0; st < 3; st++) {
    assert.equal(await stage(page), st);
    await answer(page, ["A1", "A2", "B1", "B2", "C1"]);
    const sp = await page.evaluate(() => plGet().it.s.map((q, i) => plStage(q.lv) === plGet().stage ? i : -1).filter(i => i >= 0));
    for (const i of sp) {
      await page.evaluate(i => { window.__say = () => plGet().it.s[i].tr; }, i);
      await page.click(`[data-act=pl-mic][data-i="${i}"]`);
      await page.waitForFunction(i => !KT_REC && !!plGet().ans.s[i], i);
    }
    await done(page);
  }
  const r = await page.evaluate(() => plGet().res);
  assert.equal(r.passed, "C1");
  assert.equal(r.start, "C1");
  assert.deepEqual(r.sk, { r: "C1", l: "C1", w: "C1", s: "B1" });
  // Earlier stages fold away with their scores
  assert.equal(await page.locator("details.pl-stage").count(), 2);
  assert.deepEqual(errors, []);
});

test("placement: only A1 right → the test stops after the first stage, start at A2, and the course moves there", async () => {
  const { page, errors } = await openApp(browser, "#placement");
  await ready(page);
  await answer(page, ["A1"]);
  await done(page);
  const r = await page.evaluate(() => plGet().res);
  assert.equal(r.passed, "A1");
  assert.equal(r.start, "A2");
  assert.equal(r.sk.s, null, "speaking was not attempted");
  assert.deepEqual([r.byLv.B1, r.byLv.C1], [null, null], "B1–C1 were not asked");
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

test("placement: B2 needs B2 — guessing or 'Bilmayman' does not pass a level, writing must be produced", async () => {
  const { page, errors } = await openApp(browser, "#placement");
  await ready(page);
  await answer(page, ["A1", "A2"]); await done(page);
  // B1 right; B2: all reading right but writing empty → B2 is not passed
  await page.evaluate(() => {
    const P = plGet(), it = P.it;
    it.r.forEach((q, i) => { if (q.lv === "B1" || q.lv === "B2") P.ans.r[i] = q.a; });
    it.l.forEach((q, i) => { if (q.lv === "B1") P.ans.l[i] = q.o.indexOf(q.a); if (q.lv === "B2") P.ans.l[i] = q.o.length; });
    it.w.forEach((q, i) => { if (q.lv === "B1") P.ans.w[i] = q.a.split(/\s*\/\s*/)[0]; });
  });
  await done(page);
  const r = await page.evaluate(() => plGet().res);
  assert.equal(r.passed, "B1");
  assert.equal(r.start, "B2");
  assert.equal(r.byLv.C1, null, "C1 was not asked");
  // "Bilmayman" is offered for every choice question and counts as not known
  assert.equal(await page.evaluate(() => { const it = plGet().it; return it.r.every(q => q.o.length === 4) && document.querySelectorAll(".opt-idk").length > 0; }), true);
  const idk = await page.evaluate(() => { const rows = [{ sk: "r", lv: "C1", ok: false }, { sk: "r", lv: "C1", ok: true }, { sk: "r", lv: "C1", ok: true }, { sk: "r", lv: "C1", ok: true }, { sk: "l", lv: "C1", ok: true }, { sk: "l", lv: "C1", ok: true }, { sk: "w", lv: "C1", ok: false }, { sk: "w", lv: "C1", ok: false }]; return plLevel(rows, "C1"); });
  assert.deepEqual(idk, { pct: 63, ok: false });
  assert.deepEqual(errors, []);
});

test("placement bank: original items, 10 reading + 4 writing per level, listening from B1, options unique", async () => {
  const { page, errors } = await openApp(browser, "#placement");
  await ready(page);
  const b = await page.evaluate(() => Object.entries(PLB).map(([lv, x]) => [lv, x.r.length, x.w.length, (x.l || []).length,
    x.r.every(q => q.o.length === 4 && new Set(q.o).size === 4 && q.a >= 0 && q.a < 4 && /___|«/.test(q.q)),
    (x.l || []).every(q => q.o.includes(q.a) && new Set(q.o).size === 4), x.w.every(q => /___/.test(q.q) && q.a.trim())]));
  assert.deepEqual(b, [["A1", 10, 4, 0, true, true, true], ["A2", 10, 4, 0, true, true, true], ["B1", 10, 4, 3, true, true, true], ["B2", 10, 4, 3, true, true, true], ["C1", 10, 4, 3, true, true, true]]);
  // Shuffled options keep the right answer
  const mix = await page.evaluate(() => { for (let k = 0; k < 30; k++) { const it = plGen().it; if (!it.r.every(q => PLB[q.lv].r.some(o => o.q === q.q && o.o[o.a] === q.o[q.a]))) return false; } return true; });
  assert.equal(mix, true);
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
  await ready(page);
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
