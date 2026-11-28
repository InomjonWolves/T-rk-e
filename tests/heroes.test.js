// Heroes (heroes.js): Pamuk's six friends — drawn on Pamuk's frame so CatLife moves them all alike, met by practising
// their skills, chosen as the avatar (own pages, the top bar, others' rankings), hosting their skills' cards in the Lenta
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { ROOT, launch, openApp } = require("./helpers");

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });
const calm = page => page.evaluate(() => { for (let i = 0; i < 8 && !document.getElementById("celebrate").hidden; i++) nextCelebrate(); });

test("heroes: the file is everywhere the app's files are", () => {
  for (const [f, s] of [["index.html", '<script src="heroes.js"></script>'], ["sw.js", '"./heroes.js"'], ["tools/native-www.js", '"heroes.js"'], ["tools/minify.js", '"heroes.js"']])
    assert.ok(fs.readFileSync(path.join(ROOT, f), "utf8").includes(s), f);
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  assert.ok(html.indexOf("heroes.js") > html.indexOf("cat.js"), "after cat.js (it uses catSVG)");
});

test("heroes: seven drawn on Pamuk's frame — the parts CatLife moves, unique ids, their own moves", async () => {
  const { page, errors } = await openApp(browser, "#home");
  const r = await page.evaluate(() => HERO_IDS.map(id => {
    const box = document.createElement("div");
    box.innerHTML = heroSVG(id, {}) + heroSVG(id, { pose: "head", lite: true });
    document.body.appendChild(box);
    const [a, b] = box.querySelectorAll("svg");
    const q = (s, el = a) => el.querySelectorAll(s).length;
    const ids = [...box.querySelectorAll("[id]")].map(e => e.id);
    const out = { id, cls: a.getAttribute("class"), hero: !!document.querySelector(`#app svg.hero`), eyes: q(".cat-eye"), pupils: q(".cat-pupil"), lids: q(".cat-lid"), joy: q(".cat-joy"),
      head: q(".cat-head"), mouth: q(".cat-mouth"), open: q(".cat-open"), tear: q(".cat-tear"), headPose: b.dataset.pose, headEyes: q(".cat-eye", b), uniq: new Set(ids).size === ids.length,
      wings: q(".hro-wing-l") + q(".hro-wing-r"), tail: q(".cat-tail-a"), body: q(".cat-body"), w: a.getBoundingClientRect().width > 0 };
    box.remove();
    return out;
  }));
  for (const h of r) {
    assert.deepEqual([h.eyes, h.pupils, h.lids, h.joy, h.head, h.tear, h.headEyes], [2, 2, 2, 2, 1, 1, 2], h.id);
    assert.ok(h.mouth >= 1 && h.open >= 1 && h.body >= 1 && h.uniq && h.w, h.id);
    assert.equal(h.headPose, "head", h.id);
    if (h.id !== "pamuk") assert.match(h.cls, new RegExp(`^cat hro hro-${h.id}`), "own class, not .hero (the home page's blue card)");
  }
  assert.deepEqual(r.filter(h => h.wings).map(h => h.id), ["yunus", "leylek", "marti"], "the birds and the dolphin flap");
  assert.deepEqual(r.filter(h => h.tail).map(h => h.id), ["pamuk", "yunus", "sincap", "tilki"], "tails and a fluke");
  // CatLife moves them like Pamuk: a sad hero lowers its lids, a happy one squints and hops, wings flap on wow
  const m = await page.evaluate(async () => {
    document.body.insertAdjacentHTML("beforeend", `<div id="t" style="width:200px">${heroSVG("marti", {})}</div>`);
    const s = document.querySelector("#t svg"); CatLife.scan();
    CatLife.mood(s, "sad", 0); await new Promise(r => setTimeout(r, 400));
    const lid = getComputedStyle(s.querySelector(".cat-lid")).transform;
    CatLife.mood(s, "wow", 0); await new Promise(r => setTimeout(r, 120));
    const wing = getComputedStyle(s.querySelector(".hro-wing-l")).animationName;
    return { lid, wing, cls: s.getAttribute("class") };
  });
  assert.notEqual(m.lid, "none");
  assert.equal(m.wing, "hroFlapL");
  assert.match(m.cls, /wow/);
  assert.deepEqual(errors, []);
  await page.close();
});

test("heroes: met by practising their skill, greeted once; the avatar sheet, the cards page, the choice everywhere", async () => {
  const { page, errors } = await openApp(browser, "#profile", { state: { xp: 300 } });
  await calm(page);
  assert.deepEqual(await page.evaluate(() => [myHero(), HERO_IDS.filter(heroOpen)]), ["pamuk", ["pamuk"]]);
  // A locked friend cannot be chosen: the sheet says what brings it
  await page.click(".avatar-edit");
  await page.waitForSelector(".hsheet");
  assert.equal(await page.locator(".hp").count(), 7);
  assert.equal(await page.locator('.hp[aria-disabled="true"]').count(), 6);
  await page.evaluate(() => document.querySelector('.hp[data-id="kirpi"]').click());
  assert.match(await page.textContent("#toast"), /Kirpi hali yoʻq: Oʻqish mashqlarida 25 ta toʻgʻri javob \(0\/25\)/);
  assert.equal(await page.evaluate(() => S.hero || "pamuk"), "pamuk");
  await page.evaluate(() => closeSheet(true));
  // 25 right reading answers bring Kirpi: one greeting with Kirpi in it
  await page.evaluate(() => { S.sk.r[0] = 25; ACH_QUEUE.length = 0; save(); });
  const g = await page.evaluate(() => ({ hu: S.hu, q: ACH_QUEUE.map(c => [c.title, c.hero]) }));
  assert.deepEqual(g.hu, { kirpi: 1 });
  assert.deepEqual(g.q.find(c => c[1]), ["Kirpi — tipratikan siz bilan!", "kirpi"]);
  await page.waitForSelector("#celebrate:not([hidden]) .cel-cat svg.hro-kirpi");
  await calm(page);
  // Met for good: even when the counter would fall, Kirpi stays; nothing is greeted twice
  await page.evaluate(() => { S.sk.r[0] = 0; ACH_QUEUE.length = 0; save(); });
  assert.deepEqual(await page.evaluate(() => [heroOpen("kirpi"), ACH_QUEUE.length]), [true, 0]);
  // Several at once: one greeting for all
  await page.evaluate(() => { S.sk.l[0] = 30; S.sk.w[0] = 30; ACH_QUEUE.length = 0; save(); });
  assert.equal(await page.evaluate(() => ACH_QUEUE.filter(c => c.hero).map(c => c.title).join()), "2 ta yangi qahramon!");
  await calm(page);
  // Choosing Kirpi: the profile, the top bar and the league row show it
  await page.click(".avatar-edit");
  await page.waitForSelector(".hsheet");
  await page.evaluate(() => document.querySelector('.hp[data-id="kirpi"]').click());
  await page.waitForFunction(() => S.hero === "kirpi");
  assert.equal(await page.getAttribute(".avatar-edit .avatar", "data-hero"), "kirpi");
  assert.equal(await page.locator(".ph-av svg.hro-kirpi").count(), 1);
  assert.match(await page.textContent(".ph-card"), /Kirpi · Oʻqish/);
  await page.evaluate(() => { location.hash = "#home"; });
  await page.waitForSelector(".top-av .avatar");
  assert.equal(await page.getAttribute(".top-av .avatar", "data-hero"), "kirpi");
  assert.equal(await page.evaluate(() => lgDoc("A", 0).hr), "kirpi");
  // Others' rows show their own hero; without one, Pamuk
  assert.match(await page.evaluate(() => avatarHTML("", "someone", "", null, "tilki")), /data-hero="tilki"[\s\S]*hro-tilki/);
  assert.match(await page.evaluate(() => avatarHTML("", "someone")), /data-hero="pamuk"/);
  // The cards page: seven cards, the met ones can be chosen, the others show the way to them
  await page.evaluate(() => { location.hash = "#heroes"; });
  await page.waitForSelector(".hgrid");
  const p = await page.evaluate(() => ({ cards: document.querySelectorAll(".hcard").length, locked: document.querySelectorAll(".hcard.locked").length, mine: document.querySelector(".hc-mine").closest(".hcard").querySelector(".hc-name b").textContent, need: document.querySelectorAll(".hc-need .bar").length, nav: document.querySelector(".nav a[aria-current]").dataset.tab }));
  assert.deepEqual(p, { cards: 7, locked: 3, mine: "Kirpi", need: 3, nav: "profile" });
  await page.evaluate(() => document.querySelector('.hc-pick[data-id="yunus"]').click());
  await page.waitForFunction(() => S.hero === "yunus");
  assert.match(await page.evaluate(() => document.querySelector(".hc-mine").closest(".hcard").textContent), /Yunus/);
  assert.deepEqual(errors, []);
  await page.close();
});

test("heroes: each skill's hero hosts its cards in the Lenta, Pamuk the facts, results and breaks", async () => {
  const { page, errors } = await openApp(browser, "#home");
  const r = await page.evaluate(() => {
    const w = ALL[0], c = { w: { k: "w", w }, q: { k: "q", w }, r: { k: "r", w }, l: { k: "l", w }, g: { k: "g" }, s: { k: "s", s: { tr: "Bu bir kitap." } }, p: { k: "p", say: "Merhaba" }, f: { k: "f" }, x: { k: "x" }, b: { k: "b", v: "time" } };
    const out = {};
    for (const k in c) { const d = document.createElement("div"); d.innerHTML = lnScene(c[k], 0); const s = d.querySelector("svg.cat"); out[k] = s.dataset.hero || "pamuk"; if (k === "l") out.phones = d.querySelectorAll(".lnp-hp").length; }
    return out;
  });
  assert.deepEqual(r, { w: "sincap", q: "sincap", r: "leylek", l: "yunus", phones: 0, g: "tilki", s: "kirpi", p: "marti", f: "pamuk", x: "pamuk", b: "pamuk" });
  assert.deepEqual(errors, []);
  await page.close();
});
