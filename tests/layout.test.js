// Unified sections: one place for each thing (home status card, one «Oʻrganish» tab with Kurs · Mashq · Kutubxona,
// one grammar page, one vocabulary page, practice by the 4 skills with a single mistakes notebook).
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

test("Oʻrganish: one tab for the course, practice and the library; library pages open from Kutubxona and lead back", async () => {
  const { page, errors } = await openApp(browser, "#course");
  for (const h of ["#course", "#practice", "#library"]) {
    await page.evaluate(h => { location.hash = h; }, h);
    await page.waitForTimeout(80);
    const r = await page.evaluate(() => ({ tabs: [...document.querySelectorAll(".learn-seg a")].map(a => a.textContent + "=" + a.getAttribute("href")),
      cur: (document.querySelector('.learn-seg a[aria-current="page"]') || {}).textContent, nav: document.querySelector(".nav a[aria-current]").dataset.tab, title: document.querySelector(".page-title").textContent }));
    assert.deepEqual(r, { tabs: ["Kurs=#course", "Mashq=#practice", "Kutubxona=#library"], cur: { "#course": "Kurs", "#practice": "Mashq", "#library": "Kutubxona" }[h], nav: "learn", title: "Oʻrganish" }, h);
  }
  // The library: one list of rows
  await page.evaluate(() => { location.hash = "#library"; }); await page.waitForTimeout(80);
  assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll(".lrows .lrow")].map(a => a.getAttribute("href"))), ["#grammar", "#lugat", "#oqish", "#hikoya", "#alphabet", "#translate"]);
  for (const [h, name] of [["#grammar", "Grammatika"], ["#guide", "Grammatika"], ["#lugat", "Lugʻat"], ["#lessons", "Lugʻat"], ["#alphabet", "Alifbo"]]) {
    await page.evaluate(h => { location.hash = h; }, h);
    await page.waitForTimeout(80);
    const r = await page.evaluate(() => [document.querySelector(".back").getAttribute("href"), document.querySelector(".page-title").textContent, document.querySelector(".nav a[aria-current]").dataset.tab, document.querySelectorAll(".learn-seg").length]);
    assert.deepEqual(r, ["#library", name, "learn", 0], h);
  }
  // The menu's «Oʻrganish» opens the part seen last
  await page.evaluate(() => { location.hash = "#practice"; }); await page.waitForTimeout(60);
  await page.evaluate(() => { location.hash = "#home"; }); await page.waitForTimeout(60);
  await page.click(".nav a[data-tab=learn]"); await page.waitForTimeout(80);
  assert.equal(await page.evaluate(() => document.querySelector('.learn-seg a[aria-current="page"]').textContent), "Mashq");
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
  // Listening, writing and speaking tiles start that skill's mixed practice (2026-11-14); the separate kinds are one sheet away
  for (const k of ["l", "w", "s"]) assert.ok(await page.locator(`.sk-tile[data-act=sk-go][data-s=${k}]`).count(), k);
  assert.ok(await page.locator('[data-act="modes-all"]').count());
  // No lenta card, no stories card (the library has them), the mistakes notebook only when there are mistakes
  assert.equal(await page.locator(".ln-home, .hk-card").count(), 0);
  assert.doesNotMatch(await text(page), /Xatolar daftari/);
  assert.ok(await page.locator('.lrow[href="#gx"]').count() && await page.locator('.lrow[data-mode=morf]').count());
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

test("profile: ⚙ opens one settings page with every setting and link; four main achievements stand beside Pamuk, the rest live on their own page", async () => {
  const { page, errors } = await openApp(browser, "#profile", { state: { achv: { w10: "2026-11-02", first: "2026-11-02" }, sessions: 1, known: {} } });
  assert.ok(await page.locator('.top a.gear-btn[href="#settings"]').count(), "gear in the corner");
  assert.equal(await page.locator("#app .settings, #app [data-act=remind], #app [data-act=theme]").count(), 0, "no settings on the profile page");
  const got = await page.evaluate(() => ACH.filter(achDone).length);
  assert.ok(got >= 1);
  // A shelf of five medals under Pamuk (beside him they hid the frame's wings): the earned ones first, the closest locked ones fill the rest
  const hero = await page.evaluate(() => ({
    sides: document.querySelectorAll(".ph-stage .ph-medal, .ph-side").length, shelf: document.querySelectorAll(".ph-shelf > .ph-medal").length, cols: getComputedStyle(document.querySelector(".ph-shelf")).gridTemplateColumns.split(" ").length,
    below: document.querySelector(".ph-shelf").getBoundingClientRect().top >= document.querySelector(".ph-stage .fr-hero").getBoundingClientRect().bottom, ribbon: document.querySelectorAll(".ph-medal:not(.locked) .ach-st .fr-rib").length, earned: document.querySelectorAll(".ph-medal:not(.locked) .ach-st").length,
    locked: document.querySelectorAll(".ph-medal.locked .ach-lock").length, old: document.querySelectorAll(".sticker-wall, .grow-path, .fr-gallery, #app .achv").length,
    all: document.querySelector(".ph-all").textContent, href: document.querySelector(".ph-all").getAttribute("href"),
    bg: getComputedStyle(document.querySelector(".ph-medal:not(.locked) .ach-st .ach-disk")).backgroundImage, tilt: getComputedStyle(document.querySelector(".ph-medal .ach-st")).transform
  }));
  assert.deepEqual([hero.sides, hero.shelf, hero.cols, hero.below], [0, 5, 5, true]);
  assert.equal(hero.earned, Math.min(5, got)); assert.equal(hero.ribbon, hero.earned, "every earned medal hangs on its ribbon"); assert.equal(hero.locked, 5 - Math.min(5, got)); assert.equal(hero.old, 0);
  assert.match(hero.all, new RegExp(`Yutuqlar\\s*${got}/${await page.evaluate(() => ACH.length)}`)); assert.equal(hero.href, "#achievements");
  // The medal: enamel (a gradient) in a metal rim (a conic gradient), upright
  assert.match(hero.bg, /linear-gradient/); assert.match(hero.bg, /conic-gradient/); assert.equal(hero.tilt, "none");
  // The rarest come first
  assert.deepEqual(await page.evaluate(() => { const keep = S.achv; S.achv = { first: "2026-11-01", w10: "2026-11-02", lg7: "2026-11-03", s100: "2026-11-04", x5000: "2026-11-05" }; const t = achTop().map(([a, on]) => on && achTier(a)); S.achv = keep; return t; }).then(t => t.every((x, i) => i === 0 || x <= t[i - 1])), true);
  await page.click(".gear-btn");
  await page.waitForTimeout(100);
  const heads = await page.evaluate(() => [...document.querySelectorAll(".section-head h2")].map(h => h.textContent));
  assert.deepEqual(heads, ["Ilova", "Birga oʻrganish va yordam"]);
  for (const a of ["theme", "goal", "tts-rate", "remind"]) assert.ok(await page.locator(`[data-act=${a}]`).count(), a);
  const sets = await page.evaluate(() => [...document.querySelectorAll(".settings")].map(s => s.innerText));
  assert.doesNotMatch(sets[0], /Maxfiylik|Telegram|Guruhlar/);
  assert.match(sets[1], /Doʻstlarni taklif[\s\S]*Guruhlar[\s\S]*Telegram[\s\S]*Yordam[\s\S]*Maxfiylik/);
  assert.equal(await page.getAttribute(".back", "href"), "#profile");
  // On the achievements page earned ones are stickers too, first in each group
  await page.evaluate(() => { location.hash = "#achievements"; });
  await page.waitForTimeout(80);
  assert.equal(await page.locator(".ach.on .ach-st").count(), got);
  assert.deepEqual(errors, []);
  await page.close();
});

// Audit fixes (2026-11): a 324 px microphone icon on every course Dialog tab, the Help page wider than the phone,
// bottom-menu icons without a name for screen readers
test("phone layout: no page wider than the screen, no oversized icons, every menu item has a name", async () => {
  const { page, errors } = await openApp(browser, "#home");
  const check = async name => {
    const r = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth, W: innerWidth,
      big: [...document.querySelectorAll("#app svg")].filter(s => s.getBoundingClientRect().width > 100 && !/\b(cat|mascot|chart|sk-chart)\b/.test(s.getAttribute("class") || "")).map(s => s.parentElement.outerHTML.slice(0, 90))
    }));
    assert.ok(r.sw <= r.W, `${name}: page is ${r.sw}px wide on a ${r.W}px screen`);
    assert.deepEqual(r.big, [], `${name}: oversized icon`);
  };
  for (const h of ["#home", "#course", "#grammar", "#g-b2-09", "#lugat", "#practice", "#oqish", "#rank", "#profile", "#settings", "#achievements", "#help", "#translate", "#skills", "#placement", "#ktest-a1"]) {
    await page.evaluate(h => { location.hash = h; }, h);
    await page.waitForTimeout(150);
    await check(h);
  }
  for (const u of ["a1-1", "a1-3", "a2-3", "b2-8"]) for (const t of ["vocab", "grammar", "dialog", "read", "ex"]) {
    await page.evaluate(([u, t]) => { location.hash = "#k-" + u; KTAB = t; route(); }, [u, t]);
    await page.waitForTimeout(120);
    await check(`#k-${u}/${t}`);
  }
  const nav = await page.evaluate(() => [...document.querySelectorAll("nav.nav a")].map(a => a.getAttribute("aria-label")));
  assert.deepEqual(nav, ["Asosiy", "Lenta", "Oʻrganish", "Reyting", "Profil"]);
  assert.deepEqual(errors, []);
  await page.close();
});
