// Reading texts (oqish.js) and speech settings: data shape, the reading page, reading XP, voice speed.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { ROOT, launch, openApp } = require("./helpers");

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

const OQ = vm.runInNewContext(fs.readFileSync(path.join(ROOT, "oqish.js"), "utf8") + ";OQ", {});

test("reading texts: three per level, four questions each, glossary, unique ids, correct answers in range", () => {
  for (const lv of ["A1", "A2", "B1", "B2", "C1"]) assert.ok(OQ.filter(t => t.lv === lv).length >= 3, lv);
  assert.equal(new Set(OQ.map(t => t.id)).size, OQ.length);
  for (const t of OQ) {
    assert.match(t.id, /^[a-z0-9]+$/, t.id);
    assert.ok(t.tr && t.uz && t.text.length > 200, t.id);
    assert.ok(t.gloss.length >= 5, `${t.id}: glossary`);
    assert.equal(t.q.length, 4, `${t.id}: questions`);
    for (const q of t.q) {
      assert.equal(q.o.length, 4, `${t.id}: ${q.q}`);
      assert.ok(q.a >= 0 && q.a < 4, `${t.id}: ${q.q}`);
      assert.equal(new Set(q.o).size, 4, `${t.id}: duplicate option in ${q.q}`);
    }
  }
});

test("reading page: levels, a text with listening and glossary, answers → reading XP once a day at full value", async () => {
  const { page, errors } = await openApp(browser, "#oqish");
  await page.waitForSelector(".list .unit");
  assert.equal(await page.locator(".list .unit").count(), 3);
  await page.click("[data-act=oq-lv][data-l=B2]");
  assert.match(await page.textContent(".list"), /Bir Fincan Kahve/);
  await page.evaluate(() => { location.hash = "#oqish-aile"; });
  await page.waitForSelector(".oq-text");
  assert.match(await page.textContent(".oq-text"), /Benim adım Ali/);
  assert.ok(await page.locator(".oq-gloss > div").count() >= 5);
  assert.equal(await page.isDisabled("[data-act=oq-check]"), true, "check waits for all answers");
  const answerAll = () => page.evaluate(() => OQ.find(t => t.id === "aile").q.forEach((q, i) => document.querySelector(`[data-act=oq-ans][data-q="${i}"][data-o="${q.a}"]`).click()));
  await answerAll();
  await page.click("[data-act=oq-check]");
  const r = await page.evaluate(() => ({ xp: S.xp, best: S.oq.aile, r: S.sk.r.slice(0, 2), dq: dqToday().ok }));
  assert.equal(r.xp, 40);
  assert.equal(r.best, 100);
  assert.deepEqual(r.r, [4, 4]);
  assert.match(await page.textContent(".oq-res"), /4\/4 toʻgʻri · \+40 XP/);
  // Again today: less XP, with the reason
  await page.click("[data-act=oq-again]");
  await answerAll();
  await page.click("[data-act=oq-check]");
  assert.equal(await page.evaluate(() => S.xp), 60);
  assert.match(await page.textContent(".oq-res"), /2-marta/);
  assert.deepEqual(errors, []);
});

test("speech settings: speed changes the rate, dialog lines carry speakers", async () => {
  const { page, errors } = await openApp(browser, "#settings");
  await page.evaluate(() => {
    window.__utter = [];
    window.speechSynthesis.speak = u => window.__utter.push({ t: u.text, r: u.rate, p: u.pitch });
    window.speechSynthesis.cancel = () => {};
  });
  await page.click("[data-act=tts-rate][data-v='0.75']");
  assert.equal(await page.evaluate(() => S.tts.r), 0.75);
  const u = await page.evaluate(() => { __utter = []; speak("Merhaba"); speakSeq([["Ali", "Selam"], ["Ayşe", "Merhaba"]]); return __utter; });
  assert.ok(Math.abs(u[0].r - 0.85 * 0.75) < 1e-4, String(u[0].r));
  assert.equal(u[1].t, "Selam");
  assert.deepEqual(errors, []);
});
