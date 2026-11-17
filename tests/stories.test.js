// Interactive stories (hikoya.js + js/stories.js): the data, every word understood by the analyser,
// the player (lines one by one, questions in between, building a sentence), reading XP at the end, voices, locks
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { ROOT, launch, openApp } = require("./helpers");

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

const HK = vm.runInNewContext(fs.readFileSync(path.join(ROOT, "hikoya.js"), "utf8") + ";HK", {});
const KINDS = ["mc", "word", "next", "order", "hear"];

test("stories: ids, levels, cast, lines, questions with valid answers", () => {
  assert.equal(new Set(HK.map(h => h.id)).size, HK.length);
  for (const lv of ["A1", "A2", "B1", "B2"]) assert.ok(HK.filter(h => h.lv === lv).length >= 2, lv);
  for (const h of HK) {
    assert.match(h.id, /^[a-z0-9]+$/, h.id);
    assert.ok(h.tr && h.uz, h.id);
    assert.ok(Array.isArray(h.s[0]), `${h.id}: starts with a line`);
    const qs = h.s.filter(x => !Array.isArray(x));
    assert.ok(qs.length >= 4, `${h.id}: questions`);
    assert.ok(h.s.length - qs.length >= 7, `${h.id}: lines`);
    assert.ok(h.s.filter(Array.isArray).map(x => x[1]).join(" ").length >= 250, `${h.id}: length`);
    const seen = [];
    h.s.forEach((x, i) => {
      const at = `${h.id} #${i}`;
      if (Array.isArray(x)) {
        assert.equal(x.length, 3, at);
        assert.ok(x[0] === "" || h.cast[x[0]], `${at}: ${x[0]} is not in the cast`);
        assert.ok(x[1].trim() && x[2].trim(), at);
        seen.push(x[1]);
        return;
      }
      assert.ok(KINDS.includes(x.k), at);
      if (x.who) assert.ok(h.cast[x.who], `${at}: ${x.who} is not in the cast`);
      if (x.o) {
        assert.ok(x.o.length >= 3, at);
        assert.equal(new Set(x.o).size, x.o.length, `${at}: same option twice`);
        assert.ok(x.a >= 0 && x.a < x.o.length, at);
      }
      // The word asked about was in the story before the question
      if (x.k === "word") assert.ok(seen.some(t => t.toLocaleLowerCase("tr").includes(x.w.toLocaleLowerCase("tr"))), `${at}: ${x.w}`);
      if (x.k === "order") {
        assert.match(x.s, /^[^.,!?;:]+$/, `${at}: no punctuation in tiles`);
        assert.ok(x.s.split(" ").length >= 3, at);
      }
      if (x.k === "next" || x.k === "order" || x.k === "hear") assert.ok(x.uz, `${at}: Uzbek line`);
      if (x.k === "hear") assert.ok(x.t, at);
      if (x.k === "next") seen.push(x.o[x.a]);
      if (x.k === "order") seen.push(x.s);
      if (x.k === "hear") seen.push(x.t);
    });
  }
});

test("stories: every word can be tapped and is analysed; voices follow the cast", async () => {
  const { page, errors } = await openApp(browser, "#home");
  await page.evaluate(() => Promise.all([loadMorph(), loadHk()]));
  const r = await page.evaluate(() => {
    const t = [];
    HK.forEach(h => h.s.forEach(x => { const l = Array.isArray(x) ? x : hkLineOf(x); if (l) t.push(l[1]); if (x.k === "next") t.push(...x.o); }));
    const seen = new Set(), bad = [];
    t.join(" ").replace(MW_RE, w => { const k = Morph.strip(w); if (k && !seen.has(k)) { seen.add(k); if (!Morph.parse(k).length) bad.push(k); } return w; });
    const h = HK.find(x => x.id === "kahvalti");
    return { n: seen.size, bad, voices: ["Kerem", "Defne", "", "Pamuk"].map(w => hkVoice(h, w)) };
  });
  assert.ok(r.n > 500, "words: " + r.n);
  assert.deepEqual(r.bad, []);
  assert.deepEqual(r.voices, ["b", "a", "a", "a"]);
  // A line asks for the character's own voice first, then (a man) the male recording, then the main voice
  const played = await page.evaluate(() => {
    const out = [], h = HK.find(x => x.id === "kahvalti"), t = "Günaydın! Saat kaç?";
    window.playRec = (text, v) => { out.push(v); return true; };
    AUDIO_SET = new Set([audioKey(t, "b")]); hkSay(h, "Kerem", t);
    AUDIO_SET = new Set(); hkSay(h, "Kerem", t); hkSay(h, "Defne", t);
    return out;
  });
  assert.deepEqual(played, [["p:Kerem", "b", "a"], ["p:Kerem", "b", "a"], ["p:Defne", "a"]]);
  assert.deepEqual(errors, []);
});

test("story player: lines one by one, questions stop the story, sentence tiles, translation, XP once at the end", async () => {
  const { page, errors } = await openApp(browser, "#hikoya");
  await page.waitForSelector(".hk-list .unit");
  assert.equal(await page.locator(".hk-list .unit").count(), 4);
  // Higher levels open with the course
  await page.click("[data-act=hk-lv][data-l=B1]");
  await page.waitForSelector(".lock-note");
  assert.equal(await page.locator(".hk-list .unit.locked").count(), 2);
  await page.evaluate(() => { location.hash = "#hikoya-staj"; });
  await page.waitForSelector(".lock-card");
  // The library points to the stories
  await page.evaluate(() => { location.hash = "#library"; });
  await page.waitForSelector('.lrow[href="#hikoya"]');

  await page.evaluate(() => { location.hash = "#hikoya-kahvalti"; });
  await page.waitForSelector(".hk-story .hk-line");
  assert.equal(await page.locator(".hk-story > *").count(), 1);
  assert.ok(await page.locator(".hk-story .mw").count() > 3, "words can be tapped");
  // Translation of a line
  await page.click(".hk-line [data-act=hk-tr]");
  assert.match(await page.textContent(".hk-line .hk-uz"), /Yakshanba ertalabi/);
  const xp0 = await page.evaluate(() => S.xp);

  // Walk the story: lines with «Davom etish», questions answered — one on purpose wrong
  const h = HK.find(x => x.id === "kahvalti");
  let wrong = false;
  for (let i = 1; i < h.s.length; i++) {
    await page.click("[data-act=hk-next]");
    const x = h.s[i];
    if (Array.isArray(x)) continue;
    assert.ok(await page.locator("[data-act=hk-next]").isDisabled(), "a question stops the story");
    if (x.k === "order") {
      for (const w of x.s.split(" ")) await page.locator(".hk-pool .bk", { hasText: new RegExp(`^${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`) }).first().click();
      await page.click("[data-act=hk-order]");
      await page.waitForSelector(".hk-q .feedback.ok");
      // The built sentence stays in the story as Defne's line
      assert.match(await page.locator(".hk-story > .hk-line").last().textContent(), /Bu çay çok güzel/);
    } else {
      const pick = !wrong && x.k === "mc" ? x.o[(x.a + 1) % x.o.length] : x.o[x.a];
      if (pick !== x.o[x.a]) wrong = true;
      await page.evaluate(t => [...document.querySelectorAll("[data-act=hk-ans]:not([disabled])")].find(b => b.textContent === t).click(), pick);
    }
  }
  await page.waitForSelector(".hk-end");
  const qn = h.s.filter(x => !Array.isArray(x)).length;
  assert.match(await page.textContent(".hk-end"), new RegExp(`${qn - 1}/${qn} toʻgʻri`));
  const st = await page.evaluate(() => ({ best: S.hk.kahvalti, xp: S.xp, r: S.sk.r[1], w: S.sk.w[1] }));
  assert.equal(st.best, Math.round((qn - 1) / qn * 100));
  assert.ok(st.xp > xp0, "reading XP");
  assert.ok(st.r >= qn - 1 && st.w >= 1, "skills logged");
  // The list shows the result; reading it again gives a fresh run
  await page.click("[data-act=hk-again]");
  await page.waitForSelector(".hk-story .hk-line");
  assert.equal(await page.locator(".hk-story > *").count(), 1);
  await page.evaluate(() => { location.hash = "#hikoya"; });
  await page.waitForSelector(".hk-list .unit");
  assert.match(await page.textContent(".hk-list"), /eng yaxshi natija/);
  assert.match(await page.textContent(".lesson-head"), /1\/12 oʻqilgan/);
  assert.deepEqual(errors, []);
});
