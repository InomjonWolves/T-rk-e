// Unified sections: one place for each thing (home status card, Darslar tabs in learning order, one grammar page,
// one vocabulary page, practice by the 4 skills with a single mistakes notebook).
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { launch, openApp } = require("./helpers");

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

const text = page => page.evaluate(() => document.getElementById("app").innerText);

test("home: one status card, no duplicated stats or old lesson lists", async () => {
  const { page, errors } = await openApp(browser, "#home", { state: { xp: 230 } });
  const r = await page.evaluate(() => ({
    status: document.querySelectorAll(".status-card").length,
    lvl: document.querySelectorAll(".lvl-card").length,
    week: document.querySelectorAll(".week").length,
    cards: document.querySelectorAll("#app .view > .glass, #app .view > section, #app .view > a.pcard, #app .view > div.pcard").length,
    old: [".tiles", ".goals", ".time-card", ".carousel", ".pcard.ai", ".sk-row"].filter(q => document.querySelector("#app " + q))
  }));
  assert.equal(r.status, 1); assert.equal(r.lvl, 1); assert.equal(r.week, 1);
  assert.deepEqual(r.old, [], "old duplicate home blocks are gone");
  assert.ok(r.cards <= 9, `home has ${r.cards} blocks`);
  const t = await text(page);
  assert.match(t, /Bugungi reja/); assert.match(t, /Kursni davom ettiring/); assert.match(t, /Bugungi vazifalar/); assert.match(t, /Hafta:/); assert.match(t, /Bugungi soʻz/);
  assert.equal((t.match(/Kunlik vazifalar|Haftalik challenge/g) || []).length, 0);
  assert.deepEqual(errors, []);
  await page.close();
});

test("Darslar: tabs Kurs · Grammatika · Lugʻat · Alifbo on every section page", async () => {
  const { page, errors } = await openApp(browser, "#course");
  for (const h of ["#course", "#grammar", "#guide", "#lugat", "#lessons", "#alphabet"]) {
    await page.evaluate(h => { location.hash = h; }, h);
    await page.waitForTimeout(80);
    const tabs = await page.evaluate(() => [...document.querySelectorAll(".seg a")].map(a => a.textContent + "=" + a.getAttribute("href")));
    assert.deepEqual(tabs, ["Kurs=#course", "Grammatika=#grammar", "Lugʻat=#lugat", "Alifbo=#alphabet"], h);
    const cur = await page.evaluate(() => (document.querySelector('.seg a[aria-current="page"]') || {}).textContent);
    assert.equal(cur, { "#course": "Kurs", "#grammar": "Grammatika", "#guide": "Grammatika", "#lugat": "Lugʻat", "#lessons": "Lugʻat", "#alphabet": "Alifbo" }[h], h);
  }
  // Grammar: one page with the handbook, exercise progress and (A1) the 10 short lessons folded
  await page.evaluate(() => { GUIDE_LV = "A1"; location.hash = "#grammar"; });
  await page.waitForTimeout(80);
  assert.ok(await page.locator('a[href="#gx"]').count());
  assert.ok(await page.locator("details.fold [data-to=grammar-1]").count(), "10 short lessons inside a fold");
  assert.ok(await page.locator('a.toc-row[href^="#g-a1"]').count() >= 30);
  // Vocabulary: A1 = lessons (folded by sub-level) + topic packs + course vocabulary; other levels: packs
  await page.evaluate(() => { LUG_LV = "A1"; location.hash = "#lugat"; });
  await page.waitForTimeout(80);
  assert.equal(await page.locator("details.fold").count(), 3);
  assert.equal(await page.locator("[data-to^=lesson-]").count(), 36);
  assert.ok(await page.locator('[data-act=modes][data-u="cat:kA1"]').count());
  await page.click("[data-act=lug-lv][data-l=B1]");
  assert.equal(await page.locator("details.fold").count(), 0);
  assert.ok(await page.locator('[data-act=modes][data-u="cat:kB1"]').count());
  // Back links lead to the unified pages
  await page.evaluate(() => { location.hash = "#lesson-3"; }); await page.waitForTimeout(60);
  assert.equal(await page.getAttribute(".back", "href"), "#lugat");
  await page.evaluate(() => { location.hash = "#g-a1-05"; }); await page.waitForTimeout(60);
  assert.equal(await page.getAttribute(".back", "href"), "#grammar");
  assert.deepEqual(errors, []);
  await page.close();
});

test("practice: 4 skill tiles, one mistakes notebook with every kind of mistake", async () => {
  const { page, errors } = await openApp(browser, "#practice");
  assert.equal(await page.locator(".sk-tile").count(), 4);
  assert.ok(await page.locator('.sk-tile[href="#oqish"]').count());
  for (const a of ["listen-modes", "write-modes", "speak-modes"]) assert.ok(await page.locator(`.sk-tile[data-act=${a}]`).count(), a);
  assert.match(await text(page), /Xatolar daftari[\s\S]*Hozircha boʻsh/);
  assert.doesNotMatch(await text(page), /Mavzular boʻyicha/, "topic list lives in Lugʻat now");
  await page.evaluate(() => {
    const w = ALL[0]; S.srs[w.tr] = Object.assign(S.srs[w.tr] || {}, { miss: 2 });
    S.lsm = { ["lw|" + ALL[1].tr]: { n: 1, at: Date.now() } }; S.gxm = { "A1.01#0": 1 }; save(); route();
  });
  const btns = await page.evaluate(() => [...document.querySelectorAll(".mis-btn")].map(b => b.dataset.mode));
  for (const m of ["gxm", "lmis"]) assert.ok(btns.includes(m), m + " in " + btns);
  assert.deepEqual(errors, []);
  await page.close();
});

test("profile: settings separate from links", async () => {
  const { page, errors } = await openApp(browser, "#profile");
  const heads = await page.evaluate(() => [...document.querySelectorAll(".section-head h2")].map(h => h.textContent));
  assert.ok(heads.includes("Sozlamalar") && heads.includes("Birga oʻrganish va yordam"), heads.join());
  const sets = await page.evaluate(() => [...document.querySelectorAll(".settings")].map(s => s.innerText));
  assert.doesNotMatch(sets[0], /Maxfiylik|Telegram|Guruhlar/);
  assert.match(sets[1], /Doʻstlarni taklif[\s\S]*Guruhlar[\s\S]*Telegram[\s\S]*Yordam[\s\S]*Maxfiylik/);
  assert.deepEqual(errors, []);
  await page.close();
});
