// Avatar frames (2026-11): a ring round every avatar shows the learner's standing — by level or by league, whichever is higher
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { launch, openApp } = require("./helpers");
const { openFb } = require("./fakefb");

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });
const hideOverlays = page => page.evaluate(() => { for (const id of ["welcome", "onboard", "celebrate"]) { const el = document.getElementById(id); if (el) el.hidden = true; } document.body.classList.remove("locked"); });

test("frames: the level or the league opens a frame, whichever is higher; seven frames at most", async () => {
  const { page, errors } = await openApp(browser, "#home");
  const r = await page.evaluate(() => [frameOf(0, 1), frameOf(999, 1), frameOf(1000, 1), frameOf(4500, 1), frameOf(19000, 1), frameOf(200, 4), frameOf(4500, 6), frameOf(122500, 1), frameOf(9e6, 9), frameOf(undefined, undefined)]);
  assert.deepEqual(r, [1, 1, 2, 3, 4, 4, 6, 7, 7, 1]);
  assert.deepEqual(await page.evaluate(() => FRAMES.map(f => f.uz)), ["Bronza", "Kumush", "Oltin", "Platina", "Olmos", "Usta", "Afsona"]);
  // Ornaments grow with the frame: gem from Oltin, laurel from Platina, side gems from Olmos, wings (behind) from Usta, crown for Afsona
  const o = await page.evaluate(() => [1, 3, 4, 5, 6, 7].map(n => { const d = document.createElement("div"); d.innerHTML = framed("<span class='avatar'></span>", n); return [!!d.querySelector(".fr-gem"), !!d.querySelector(".fr-leaf"), d.querySelectorAll(".fr-gem").length >= 3, !!d.querySelector(".fr-back .fr-wing"), !!d.querySelector(".fr-crown")]; }));
  assert.deepEqual(o, [[false, false, false, false, false], [true, false, false, false, false], [true, true, false, false, false], [true, true, true, false, false], [true, false, true, true, false], [true, false, true, true, true]]);
  assert.deepEqual(errors, []);
});

test("frames: the topbar shows my frame small; a new frame is celebrated once", async () => {
  const { page, errors } = await openApp(browser, "#home");
  await hideOverlays(page);
  assert.equal(await page.evaluate(() => { const f = document.querySelector(".top .fr"); return f && f.classList.contains("fr-sm") && !f.querySelector(".fr-orn"); }), true);
  await page.evaluate(() => { ACH_QUEUE.length = 0; S.frm = 1; S.xp = 4600; save(); });
  const q = await page.evaluate(() => ACH_QUEUE.filter(c => c.frame).map(c => [c.frame, c.title]));
  assert.deepEqual(q, [[3, "Oltin ramka ochildi!"]]);
  await page.evaluate(() => { ACH_QUEUE.length = 0; save(); });
  assert.equal(await page.evaluate(() => ACH_QUEUE.filter(c => c.frame).length), 0, "not twice");
  assert.equal(await page.evaluate(() => S.frm), 3);
  assert.deepEqual(errors, []);
});

test("frames: the profile shows my frame with the level chip and a gallery of all seven, the next one explained", async () => {
  const { page, errors } = await openApp(browser, "#home");
  await page.evaluate(() => { S.xp = 4600; S.frm = 3; save(); location.hash = "#profile"; });
  await page.waitForTimeout(300);
  const p = await page.evaluate(() => ({
    head: [...document.querySelector(".profile-card .fr").classList].includes("fr3"), chip: document.querySelector(".profile-card .fr-lv").textContent,
    items: document.querySelectorAll(".fr-gallery .fr-item").length, locked: document.querySelectorAll(".fr-gallery .fr-item.locked").length,
    on: document.querySelector(".fr-gallery .fr-item.on b").textContent, next: document.querySelector(".fr-next").textContent
  }));
  assert.deepEqual(p.head && p.chip, "10");
  assert.equal(p.items, 7); assert.equal(p.locked, 4); assert.equal(p.on, "Oltin");
  assert.match(p.next, /Platina: 20-darajaga yana \d+ XP yoki Platina ligasiga chiqing/);
  assert.deepEqual(errors, []);
});

test("frames in the leaderboard: every row by its own level and league; the podium adds the level; no double crown", async () => {
  const seed = {
    "league/a": { name: "Afsona", week: "w", wxp: 1, xp: 130000, lg: 1 },
    "league/b": { name: "Usta", week: "w", wxp: 1, xp: 2000, lg: 6 },
    "league/c": { name: "Oltin", week: "w", wxp: 1, xp: 5000, lg: 1 },
    "league/d": { name: "Bronza", week: "w", wxp: 1, xp: 100, lg: 1 }
  };
  const { page, errors } = await openFb(browser, "#rank", { user: { uid: "me1", displayName: "Men", email: "m@x.uz" }, seed });
  await hideOverlays(page);
  await page.evaluate(() => document.querySelector("[data-act=rank-tab][data-t=all]").click());
  await page.waitForFunction(() => document.querySelector(".podium"));
  const r = await page.evaluate(() => ({
    pod: [...document.querySelectorAll(".pod")].map(p => [p.querySelector(":scope > b").textContent, (p.querySelector(".fr").className.match(/fr(\d)/) || [])[1], p.querySelector(".fr-lv").textContent]),
    crownSvg: !!document.querySelector(".pod.first svg.crown"),
    row: [...document.querySelectorAll(".rank-row")].map(x => [x.querySelector("b").textContent, (x.querySelector(".fr").className.match(/fr(\d)/) || [])[1], !!x.querySelector(".fr-lv")])
  }));
  assert.deepEqual(r.pod, [["Oltin", "3", "10"], ["Afsona", "7", "51"], ["Usta", "6", "6"]]);
  assert.equal(r.crownSvg, false, "the Afsona frame brings its own crown");
  assert.deepEqual(r.row, [["Bronza", "1", false]]);
  assert.deepEqual(errors, []);
  await page.close();
});
