// Lenta (js/lenta.js): a full-screen feed of one-screen cards — cards from the open levels only, swiping, answers with
// a streak, XP per round on the reward card (less for the same feed again), the open round counted when leaving,
// ♥ / double tap keeps a card and puts a word into review, the saved list, mute, the ways in.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { launch, openApp } = require("./helpers");

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

test("lenta: a full-screen feed from the open levels; it starts with a word, swiping moves on, more cards come", async () => {
  const { page, errors } = await openApp(browser, "#lenta");
  await page.waitForFunction(() => LN && LN.cur === 0);
  const r = await page.evaluate(() => ({
    first: LN.cards[0].k, open: document.documentElement.classList.contains("ln-open"), nav: getComputedStyle(document.querySelector(".nav")).visibility,
    h: document.querySelector(".ln-card").offsetHeight === innerHeight, lv: [...new Set(LN.cards.filter(c => c.w).map(c => lnWLv(c.w)))],
    hint: !!document.getElementById("ln-swipe")
  }));
  assert.deepEqual(r, { first: "w", open: true, nav: "hidden", h: true, lv: ["A1"], hint: true });
  await page.evaluate(() => lnGo(1));
  await page.waitForFunction(() => LN.cur === 1);
  assert.equal(await page.evaluate(() => !!document.getElementById("ln-swipe")), false, "the swipe hint goes after the first swipe");
  // Near the end, more cards are added; no word comes twice; every few cards a reward card
  const n = await page.evaluate(() => { lnActive(LN.cards.length - 2); for (let i = 0; i < 6; i++) lnActive(LN.cards.length - 2); return LN.cards.length; });
  assert.ok(n >= 30, String(n));
  const c = await page.evaluate(() => ({ ws: LN.cards.filter(c => c.w).map(c => c.w.tr), x: LN.cards.map((c, i) => c.k === "x" ? i : -1).filter(i => i >= 0), kinds: [...new Set(LN.cards.map(c => c.k))].sort().join("") }));
  assert.equal(new Set(c.ws).size, c.ws.length, "no word twice");
  assert.deepEqual(c.x.slice(0, 2), [8, 17]);
  assert.match(c.kinds, /f/); assert.match(c.kinds, /g/); assert.match(c.kinds, /q/); assert.match(c.kinds, /w/);
  assert.ok(await page.evaluate(() => S.ln.n >= 2), "today's count");
  // Closing goes back; the nav returns
  await page.click(".ln-top a.ln-x");
  await page.waitForFunction(() => location.hash === "#home" && !document.documentElement.classList.contains("ln-open"));
  assert.equal(await page.evaluate(() => LN), null);
  assert.equal(await page.locator(".ln-home[href='#lenta']").count(), 1, "the way in on the home page");
  await page.evaluate(() => { location.hash = "#practice"; });
  await page.waitForSelector(".ln-home");
  assert.deepEqual(errors, []);
});

test("lenta: answers build a streak; the reward card gives the round's XP (less for the same feed again); leaving counts the open round", async () => {
  const { page, errors } = await openApp(browser, "#lenta");
  await page.waitForFunction(() => LN && LN.cur === 0);
  const q = () => page.evaluate(() => {
    const w = LN.pool.words[LN.cards.length % LN.pool.words.length], o = lnOpts(w);
    LN.cards.push({ k: "q", id: "w:" + w.tr, w, o, a: o.indexOf(w) }); return LN.cards.length - 1;
  });
  await page.evaluate(() => { XP_FAST_MS = 0; LN.round = { n: 0, right: 0, times: [] }; });
  for (let k = 0; k < 4; k++) { const i = await q(); await page.evaluate(i => { LN.cur = i; lnAnswer(i, LN.cards[i].a); }, i); }
  assert.equal(await page.evaluate(() => LN.combo), 4);
  assert.match(await page.evaluate(() => document.getElementById("ln-stats").innerHTML), /class="hot"/);
  // A wrong answer: the streak ends and the word is marked for review
  const wrong = await q();
  const w = await page.evaluate(i => { const c = LN.cards[i]; lnAnswer(i, (c.a + 1) % 3); return [LN.combo, S.srs[c.w.tr].m > 0]; }, wrong);
  assert.deepEqual(w, [0, true]);
  const xp0 = await page.evaluate(() => S.xp);
  const first = await page.evaluate(() => { const c = { k: "x" }; LN.cards.push(c); lnRound(c); return c.done; });
  assert.ok(first.xp > 0 && first.n === 5 && first.right === 4, JSON.stringify(first));
  assert.equal(await page.evaluate(() => S.xp) - xp0, first.xp);
  for (let k = 0; k < 5; k++) { const i = await q(); await page.evaluate(i => lnAnswer(i, LN.cards[i].a), i); }
  const second = await page.evaluate(() => { const c = { k: "x" }; LN.cards.push(c); lnRound(c); return c.done; });
  assert.ok(second.xp > 0 && second.xp < 30 && second.xp <= first.xp + 6, JSON.stringify(second));
  // Fewer than 3 answers: no XP, and the card says why
  const few = await page.evaluate(() => { const c = { k: "x" }; LN.cards.push(c); lnRound(c); return [c.done.xp, lnBody(c, 0)]; });
  assert.equal(few[0], 0); assert.match(few[1], /kamida 3 ta savolga/);
  // Leaving with 3 answers in the open round: they count
  for (let k = 0; k < 3; k++) { const i = await q(); await page.evaluate(i => lnAnswer(i, LN.cards[i].a), i); }
  const xp1 = await page.evaluate(() => S.xp);
  await page.evaluate(() => { location.hash = "#home"; });
  await page.waitForFunction(() => LN === null);
  assert.ok(await page.evaluate(x => S.xp > x, xp1));
  assert.deepEqual(errors, []);
});

test("lenta: ♥ or a double tap keeps a card and puts a word into review; saved list; mute", async () => {
  const { page, errors } = await openApp(browser, "#lenta");
  await page.waitForFunction(() => LN && LN.cur === 0);
  const tr = await page.evaluate(() => LN.cards[0].w.tr);
  assert.equal(await page.evaluate(t => !!S.srs[t], tr), false);
  await page.click('.ln-card[data-i="0"] [data-act=ln-like]');
  assert.deepEqual(await page.evaluate(t => [!!S.lk["w:" + t], S.srs[t] && S.srs[t].d === dayNum(), document.querySelectorAll('.ln-card[data-i="0"] .ln-act.on').length], tr), [true, true, 1]);
  await page.click('.ln-card[data-i="0"] [data-act=ln-like]');
  assert.equal(await page.evaluate(t => !!S.lk["w:" + t], tr), false, "♥ again takes it out of the saved list");
  // A double tap on the card keeps it, with a heart flying up; a single tap shows the meaning
  const box = await page.locator('.ln-card[data-i="0"]').boundingBox();
  await page.mouse.click(box.x + 60, box.y + 160);
  assert.match(await page.textContent('.ln-card[data-i="0"]'), new RegExp(await page.evaluate(() => LN.cards[0].w.uz.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))));
  await page.mouse.click(box.x + 60, box.y + 160);
  assert.equal(await page.evaluate(t => !!S.lk["w:" + t], tr), true);
  assert.equal(await page.locator(".ln-burst").count(), 1);
  // The saved list
  await page.click("[data-act=ln-saved]");
  await page.waitForSelector("#sheet:not([hidden]) .ln-saved");
  assert.match(await page.textContent("#sheet"), new RegExp(tr));
  await page.evaluate(() => closeSheet(true));
  // Sound off: kept in the settings
  await page.click("[data-act=ln-mute]");
  assert.equal(await page.evaluate(() => S.lnMute), true);
  assert.deepEqual(errors, []);
});
