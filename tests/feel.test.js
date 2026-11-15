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

const DAY = 864e5, dn = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / DAY), key = n => new Date(n * DAY).toISOString().slice(0, 10);

test("streak freeze: a missed day is kept when a freeze is there, shown in the week row; earned every 7 days, 2 at most", async () => {
  const { page, errors } = await openApp(browser, "#home", { state: { lastDay: key(dn() - 2), streak: 9, frz: 1, xp: 500 } });
  const r = await page.evaluate(() => [S.frz, S.lastDay === keyOf(dayNum() - 1), S.frzD.length, streakNow(), !!document.querySelector(".day.frz"), document.querySelector(".frz-badge")]);
  assert.deepEqual(r, [0, true, 1, 9, true, null]);
  await page.waitForFunction(() => /Muzlatgich seriyangizni saqlab qoldi/.test(document.getElementById("pamuk-say").textContent));
  // A practice today continues the run
  await page.evaluate(() => touchDay());
  assert.equal(await page.evaluate(() => streakNow()), 10);
  // Earned: every 7 days in a row, never more than 2
  await page.evaluate(() => { ACH_QUEUE.length = 0; S.frz = 1; S.streak = 14; catStreakCheer(0); catStreakCheer(0); });
  assert.equal(await page.evaluate(() => S.frz), 2);
  assert.match(await page.evaluate(() => ACH_QUEUE.find(c => c.eyebrow === "Ketma-ket kunlar").text), /seriya muzlatgichi/);
  assert.deepEqual(errors, []);
  await page.close();
  // Two missed days and one freeze: the streak is lost, the freeze stays
  const p2 = await openApp(browser, "#home", { state: { lastDay: key(dn() - 3), streak: 9, frz: 1 } });
  assert.deepEqual(await p2.page.evaluate(() => [S.frz, streakNow()]), [1, 0]);
  await p2.page.close();
});

test("streak calendar and the daily goal: the flame opens a month view; reaching the goal is celebrated once a day", async () => {
  const days = { [key(dn() - 1)]: { xp: 40, sec: 100, rev: 4 } };
  const { page, errors } = await openApp(browser, "#home", { state: { lastDay: key(dn() - 1), streak: 3, best: 5, frz: 1, frzD: [key(dn() - 2)], days } });
  await page.evaluate(() => document.querySelector('[data-act="streak"]').click());
  await page.waitForSelector("#sheet:not([hidden]) .cal-grid");
  const r = await page.evaluate(() => [document.querySelector(".stk-head b").textContent, document.querySelectorAll(".cd.today").length, document.querySelector(".stk-frz b").textContent,
    document.querySelector('[data-act="stk-m"][data-d="1"]').disabled, document.querySelector('[data-act="stk-m"][data-d="-1"]').disabled]);
  assert.deepEqual(r, ["3", 1, "Seriya muzlatgichi: 1/2", true, false]);
  // Yesterday and the frozen day before it are marked (when they fall in this month)
  const inMonth = await page.evaluate(() => new Date(dayNum() * DAY - 2 * DAY).getUTCMonth() === new Date().getMonth());
  if (inMonth) assert.deepEqual(await page.evaluate(() => [document.querySelectorAll(".cd.on").length, document.querySelectorAll(".cd.frz").length]), [1, 1]);
  await page.evaluate(() => document.querySelector('[data-act="stk-m"][data-d="-1"]').click());
  await page.waitForSelector('[data-act="stk-m"][data-d="1"]:not([disabled])');
  await page.evaluate(() => closeSheet(true));
  // Daily goal
  await page.evaluate(() => { ACH_QUEUE.length = 0; S.goal = 50; S.dayXp = 20; addXP(40); addXP(10); });
  assert.deepEqual(await page.evaluate(() => ACH_QUEUE.filter(c => c.eyebrow === "Kunlik maqsad").map(c => c.title)), ["Bugungi maqsad bajarildi!"]);
  assert.equal(await page.evaluate(() => S.goalD === todayKey()), true);
  assert.deepEqual(errors, []);
  await page.close();
});

test("Pamuk in a practice: a word at the start, a hint after two misses, a cheer before the last question; a tap hides it", async () => {
  const { page, errors } = await openApp(browser, "#practice");
  await page.evaluate(() => startSession("quiz", "all"));
  await page.waitForFunction(() => { const b = document.getElementById("s-say"); return b && b.classList.contains("show") && b.dataset.k === "start"; });
  await page.evaluate(() => { bad(); nextStep(); bad(); });
  assert.equal(await page.evaluate(() => document.getElementById("s-say").dataset.k), "help");
  await page.evaluate(() => document.getElementById("s-say").click());
  assert.equal(await page.evaluate(() => document.getElementById("s-say").classList.contains("show")), false);
  await page.evaluate(() => { SES.i = SES.items.length - 2; nextStep(); });
  assert.equal(await page.evaluate(() => document.getElementById("s-say").dataset.k), "last");
  assert.deepEqual(errors, []);
  await page.close();
});

test("flash card: the word reads the right way round, the back face after a tap; no other style may take the .flip name", async () => {
  const fs = require("fs"), path = require("path");
  const css = fs.readFileSync(path.join(__dirname, "..", "styles.css"), "utf8");
  assert.equal((css.match(/^\.flip\s*\{/gm) || []).length, 1, ".flip is the flash card only");
  const { page, errors } = await openApp(browser, "#practice");
  await page.evaluate(() => startSession("cards", "all"));
  await page.waitForSelector("#flip");
  // Front: nothing turned (a mirrored card had transform matrix(-1, 0, 0, 1, 0, 0) on #flip)
  assert.deepEqual(await page.evaluate(() => [getComputedStyle(document.getElementById("flip")).transform, getComputedStyle(document.querySelector(".flip-inner")).transform]), ["none", "none"]);
  await page.evaluate(() => document.querySelector(".face[data-act=flip]").click());
  await page.waitForFunction(() => document.getElementById("flip").classList.contains("on"));
  await page.waitForTimeout(700);
  // Back: the inner turns 180°, the back face is turned 180° too → reads normally
  const m = await page.evaluate(() => [getComputedStyle(document.getElementById("flip")).transform, new DOMMatrix(getComputedStyle(document.querySelector(".flip-inner")).transform).multiply(new DOMMatrix(getComputedStyle(document.querySelector(".back-face")).transform)).m11]);
  assert.equal(m[0], "none");
  assert.ok(Math.abs(m[1] - 1) < 1e-6, `back face reads normally (${m[1]})`);
  assert.deepEqual(errors, []);
  await page.close();
});

test("personal advice: the weakest skill, a hardly practised one, the fullest mistake book; home card, practice tile, next step", async () => {
  const today = key(dn());
  const state = { onb: 1, xp: 1200, lastDay: today, streak: 3, days: { [today]: { xp: 40, sec: 600, rev: 20, sk: { r: [40, 45, 600], l: [30, 33, 300], w: [14, 24, 200], s: [1, 1, 10] } } } };
  const { page, errors } = await openApp(browser, "#home", { sr: true, state });
  const r = await page.evaluate(() => recs().map(x => [x.id, x.why]));
  assert.deepEqual(r.map(x => x[0]), ["sk-w", "sk-s"]);
  assert.match(r[0][1], /yozishda aniqlik 58%/);
  assert.match(r[1][1], /gapirish kam mashq qilindi/);
  assert.equal(await page.locator(".recs .rec-row").count(), 2);
  // The tip starts the mixed writing practice
  await page.evaluate(() => document.querySelector('.rec-row[data-id="sk-w"]').click());
  await page.waitForFunction(() => SES && SES.mode === "mix-w");
  await page.evaluate(() => { closeSession(); ACH_QUEUE.length = 0; document.getElementById("celebrate").hidden = true; location.hash = "#practice"; });
  await page.waitForSelector(".sk-tile.tip");
  assert.match(await page.textContent(".sk-tile.tip"), /Yozish[\s\S]*Tavsiya/);
  // A full mistake book comes first when it is the biggest need; the result screen offers the next step
  await page.evaluate(() => { ALL.slice(0, 40).forEach(w => { S.srs[w.tr] = { i: 1, e: 2.5, d: dayNum() + 3, r: 0, m: 2, w: 3 }; }); save(); });
  assert.ok(await page.evaluate(() => recs().some(x => x.id === "mis" && x.mode === "mistakes")));
  await page.evaluate(() => { XP_FAST_MS = 0; startSession("quiz", "all"); });
  await answerAllRight(page);
  await page.waitForSelector(".rec-next");
  await page.evaluate(() => document.querySelector(".rec-next").click());
  await page.waitForFunction(() => !document.getElementById("session").hidden && SES && SES.mode !== "quiz" || (document.getElementById("session").hidden && !document.getElementById("sheet").hidden));
  assert.deepEqual(errors, []);
  await page.close();
});
