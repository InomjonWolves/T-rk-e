// Android 6-bosqich («Duolingo'dek his»): sound effects, answer streak (combo), result screen; the site has them too
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { launch, openApp, answerAllRight } = require("./helpers");

// A fake Web Audio: every tone's start frequency goes to window.__osc
const fakeAudio = () => {
  window.__osc = [];
  window.AudioContext = class {
    constructor() { this.state = "running"; this.currentTime = 0; this.destination = {}; }
    resume() { return Promise.resolve(); }
    createOscillator() { return { type: "", frequency: { setValueAtTime: f => window.__osc.push(f), exponentialRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} }; }
    createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
  };
};
let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

test("sounds: a chime for right, a low bump for wrong, a brighter run for 3 in a row; the combo badge and the glowing bar", async () => {
  const { page, errors } = await openApp(browser, "#practice", { init: fakeAudio });
  await page.evaluate(() => startSession("quiz", "all"));
  const step = ok => page.evaluate(ok => { window.__osc.length = 0; ok ? good() : bad(); const f = window.__osc[0]; nextStep(); return f; }, ok);
  assert.equal(await step(true), 784);
  assert.equal(await step(true), 784);
  assert.equal(await step(true), 1047, "third in a row: combo sound");
  assert.deepEqual(await page.evaluate(() => [SES.combo, document.getElementById("session").dataset.combo, document.getElementById("s-combo").textContent.trim()]), [3, "hot", "3 ketma-ket!"]);
  assert.equal(await step(false), 233);
  assert.deepEqual(await page.evaluate(() => [SES.combo, SES.best, "combo" in document.getElementById("session").dataset]), [0, 3, false]);
  // Turned off in the settings: silence
  await page.evaluate(() => { S.sfx = false; window.__osc.length = 0; beep("ok"); beep("done"); });
  assert.equal(await page.evaluate(() => window.__osc.length), 0);
  await page.evaluate(() => { closeSession(); location.hash = "#settings"; });
  await page.waitForSelector('[data-act="sfx"][aria-checked="false"]');
  await page.evaluate(() => document.querySelector('[data-act="sfx"]').click());
  await page.waitForSelector('[data-act="sfx"][aria-checked="true"]');
  assert.equal(await page.evaluate(() => S.sfx), true);
  assert.deepEqual(errors, []);
  await page.close();
});

test("result screen: fanfare, accuracy, best streak and time; XP counts up; confetti only for a good score", async () => {
  const { page, errors } = await openApp(browser, "#practice", { init: fakeAudio });
  await page.evaluate(() => { XP_FAST_MS = 0; startSession("quiz", "all"); });
  const n = await page.evaluate(() => SES.items.length);
  await page.evaluate(() => { window.__osc.length = 0; SES.t0 -= 75000; });
  assert.equal(await answerAllRight(page), `${n}/${n}`);
  const r = await page.evaluate(() => [window.__osc.includes(523), document.querySelector(".res-meta").textContent, !!document.querySelector(".res-confetti"), document.querySelector(".result").classList.contains("perfect")]);
  assert.equal(r[0], true, "the 'done' run");
  assert.match(r[1], /Aniqlik 100%/);
  assert.match(r[1], new RegExp(`${n} ketma-ket`));
  assert.match(r[1], /1:1\d/);
  assert.deepEqual(r.slice(2), [true, true]);
  await page.waitForFunction(() => { const b = document.querySelector("[data-count]"); return b && b.textContent === `+${b.dataset.count} XP`; });
  // A weak score: no confetti
  await page.evaluate(() => { closeSession(); startSession("quiz", "all"); for (let i = 0; i < SES.items.length; i++) { bad(); SES.i++; } SES.i = SES.items.length; renderStep(); });
  assert.equal(await page.evaluate(() => !!document.querySelector(".res-confetti")), false);
  assert.deepEqual(errors, []);
  await page.close();
});
