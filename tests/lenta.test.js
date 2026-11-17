// Lenta (js/lenta.js): a full-screen feed of one-screen cards — a tab of its own in the menu, cards from the open levels
// only, swiping, answers with a streak, a round rated with stars and its XP on the reward card (less for the same feed
// again), the open round counted when leaving, ♥ / double tap keeps a card and puts a word into review, the saved list,
// mute, saying a word aloud, pause cards for long scrolling, the ways in.
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
    first: LN.cards[0].k, open: document.documentElement.classList.contains("ln-open"), nav: document.querySelector(".nav a[aria-current=page]").dataset.tab,
    h: document.querySelector(".ln-card").offsetHeight === innerHeight, lv: [...new Set(LN.cards.filter(c => c.w).map(c => lnWLv(c.w)))],
    hint: !!document.getElementById("ln-swipe")
  }));
  assert.deepEqual(r, { first: "w", open: true, nav: "lenta", h: true, lv: ["A1"], hint: true });
  // The menu stays on screen over the feed; the card on screen is marked, with Pamuk and the round's progress in it
  const look = await page.evaluate(() => {
    const nav = document.querySelector(".nav").getBoundingClientRect(), panel = document.querySelector(".ln-card.cur .ln-panel").getBoundingClientRect();
    return { navTop: document.elementFromPoint(innerWidth / 2, nav.top + nav.height / 2).closest(".nav") !== null, above: panel.bottom <= nav.top, cat: !!document.querySelector(".ln-card.cur .lnp svg.cat"), sign: !!document.querySelector(".ln-card.cur .lnp-sign") };
  });
  assert.deepEqual(look, { navTop: true, above: true, cat: true, sign: true });
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
  // The menu takes you away
  await page.click(".nav a[href='#home']");
  await page.waitForFunction(() => location.hash === "#home" && !document.documentElement.classList.contains("ln-open"));
  assert.equal(await page.evaluate(() => LN), null);
  // The only way in is the menu's own tab: no lenta cards on the home or practice pages
  assert.equal(await page.locator(".ln-home, #app a[href='#lenta']").count(), 0);
  await page.evaluate(() => { location.hash = "#practice"; });
  await page.waitForSelector(".learn-seg");
  assert.equal(await page.locator(".ln-home, #app a[href='#lenta']").count(), 0);
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
  assert.deepEqual(await page.evaluate(t => [!!S.lk["w:" + t], S.srs[t] && S.srs[t].d === dayNum(), document.querySelectorAll('.ln-card[data-i="0"] .ln-heart.on').length], tr), [true, true, 1]);
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

test("lenta: a round is rated with stars; pause cards for long or fast scrolling; a word said aloud counts", async () => {
  const { page, errors } = await openApp(browser, "#lenta", { sr: true });
  await page.waitForFunction(() => LN && LN.cur === 0);
  // Stars: 3 — 90%+, 2 — 70%+, 1 — 40%+, none below or with fewer than 3 answers; kept for today and in total
  assert.deepEqual(await page.evaluate(() => [[8, 8], [7, 8], [6, 8], [4, 8], [3, 8], [2, 2]].map(([r, n]) => lnStarsOf(r, n))), [3, 2, 2, 1, 0, 0]);
  const st = await page.evaluate(() => { XP_FAST_MS = 0; LN.round = { n: 6, right: 6, times: [] }; const c = { k: "x" }; LN.cards.push(c); lnRound(c); return [c.done.stars, S.lnS, S.ln.s, S.ln.r, S.ln3, lnBody(c, LN.cards.length - 1)]; });
  assert.deepEqual(st.slice(0, 5), [3, 3, 3, 1, 1]);
  assert.equal((st[5].match(/<i class="on"/g) || []).length, 3);
  // Pause cards take the place of the next card (never a reward card): every 40 cards, cards flying past, late at night
  const nudge = await page.evaluate(() => {
    const out = {};
    LN.n = 40; LN.nud = {}; lnNudgeCheck(LN.cur); out.count = LN.cards[LN.cur + 1].k + ":" + LN.cards[LN.cur + 1].v;
    LN.n = 80; lnNudgeCheck(LN.cur); out.long = LN.cards[LN.cur + 1].v === "long" || LN.cards[LN.cur + 2].v === "long";
    LN.n = 81; LN.fast = 6; lnNudgeCheck(LN.cur); out.fast = LN.cards.some(c => c.v === "fast");
    LN.n = 82; LN.t0 = Date.now() - 21 * 60000; lnNudgeCheck(LN.cur); out.time = LN.cards.some(c => c.v === "time");
    S.ln.n = 150; LN.n = 83; lnNudgeCheck(LN.cur); out.day = LN.cards.some(c => c.v === "day") && S.ln.b === 1;
    out.html = document.querySelectorAll(".ln-card.t-b").length;
    out.x = LN.cards.every((c, i) => (i + 1) % 9 !== 0 || c.k === "x");
    return out;
  });
  assert.deepEqual(nudge, { count: "b:count", long: true, fast: true, time: true, day: true, html: nudge.html, x: true });
  assert.ok(nudge.html >= 4, "the pause cards are on the page");
  assert.match(await page.evaluate(() => lnBody(LN.cards.find(c => c.v === "fast"), 0)), /Shoshilmang/);
  // Saying a word: the card asks, the microphone hears it, the round and the speaking skill count it
  const i = await page.evaluate(() => { const c = { k: "p", id: "p:x", say: "merhaba", uz: "salom" }; LN.cards.push(c); const i = LN.cards.length - 1;
    document.getElementById("ln-feed").insertAdjacentHTML("beforeend", lnCardHTML(c, i)); LN.round = { n: 0, right: 0, times: [] }; return i; });
  const s0 = await page.evaluate(() => [S.sk.s[0], S.pron[0]]);
  await page.evaluate(i => { window.__say = () => "merhaba"; document.querySelector(`.ln-card[data-i="${i}"] [data-act=ln-mic]`).click(); }, i);
  await page.waitForFunction(i => LN.cards[i].heard, i);
  const p = await page.evaluate(i => [LN.cards[i].heard.ok, LN.round.n, LN.round.right, S.sk.s[0], S.pron[0], document.querySelector(`.ln-card[data-i="${i}"]`).textContent], i);
  assert.deepEqual(p.slice(0, 3), [true, 1, 1]);
  assert.equal(p[3], s0[0] + 1); assert.equal(p[4], s0[1] + 1);
  assert.match(p[5], /Zoʻr talaffuz/);
  // Lenta achievements
  assert.deepEqual(await page.evaluate(() => ["ln100", "lnstar", "ln3x", "ln1000"].map(id => !!ACH.find(a => a.id === id))), [true, true, true, true]);
  assert.deepEqual(errors, []);
});
