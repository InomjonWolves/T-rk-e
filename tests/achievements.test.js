// Achievements (2026-11): rarity tiers with bigger rewards, harder goals, earned ones stay earned
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { launch, openApp } = require("./helpers");

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

test("achievements: four rarity tiers, harder goals in every group and a 'Mahorat sinovlari' group", async () => {
  const { page, errors } = await openApp(browser, "#home");
  const r = await page.evaluate(() => ({
    n: ACH.length, ids: new Set(ACH.map(a => a.id)).size,
    tiers: [1, 2, 3, 4].map(t => ACH.filter(a => achTier(a) === t).length > 0), xp: ACH_TIERS.slice(1).map(t => t.xp),
    cats: ACH_CATS.map(c => c[0]), empty: ACH_CATS.filter(c => !ACH.some(a => a.cat === c[0])).length,
    bad: ACH.filter(a => typeof a.v() !== "number" || !(a.n > 0) || !ICON[a.ico]).map(a => a.id)
  }));
  assert.ok(r.n >= 80, `${r.n} achievements`);
  assert.equal(r.ids, r.n, "unique ids");
  assert.deepEqual(r.tiers, [true, true, true, true]);
  assert.deepEqual(r.xp, [20, 40, 80, 150]);
  assert.ok(r.cats.includes("elite") && r.cats.includes("social"));
  assert.equal(r.empty, 0);
  assert.deepEqual(r.bad, []);
  assert.deepEqual(errors, []);
});

test("achievements: a legendary one pays 150 XP once and stays earned when its count goes down", async () => {
  const { page, errors } = await openApp(browser, "#home", { state: { achv: {} } });
  const r = await page.evaluate(() => {
    ACH_QUEUE.length = 0;
    const xp0 = S.xp; S.lg = 7; save(); checkAch();
    const got = S.xp - xp0, cel = ACH_QUEUE.find(c => c.title === "Afsona liga");
    S.lg = 2; save(); checkAch();
    return { got, eyebrow: cel && cel.eyebrow, stays: achDone(ACH.find(a => a.id === "lg7")), dated: !!S.achv.lg7 };
  });
  assert.ok(r.got >= 150 + 80 + 40, `XP for lg7 + lg5 + lg3 (got ${r.got})`);
  assert.equal(r.eyebrow, "Afsonaviy yutuq!");
  assert.equal(r.stays, true);
  assert.equal(r.dated, true);
  // Counters behind the new goals: days with all daily quests done, weekly challenges won
  const c = await page.evaluate(() => { const n0 = S.dqn || 0; dqToday().k.forEach(k => dqMark(k)); const w0 = S.wcn || 0; const w = wcWeek(); w.paid = 0; w.n = 99; w.days = ["1", "2", "3", "4", "5"]; w.sk = { r: 9, l: 9, w: 9, s: 9 }; wcMark("r"); return [S.dqn - n0, S.wcn - w0]; });
  assert.deepEqual(c, [1, 1]);
  assert.deepEqual(errors, []);
});

test("achievements page: tier summary, tier tag and reward on every card, rare stickers shine", async () => {
  const { page, errors } = await openApp(browser, "#achievements", { state: { achv: { s100: "2026-11-01", w10: "2026-11-01" }, best: 100 } });
  await page.evaluate(() => { for (const id of ["welcome", "onboard", "celebrate"]) { const e = document.getElementById(id); if (e) e.hidden = true; } });
  const r = await page.evaluate(() => ({
    tiers: [...document.querySelectorAll(".ach-tier")].map(t => t.textContent.replace(/\s+/g, " ").trim().split(" ")[0]),
    cards: document.querySelectorAll(".ach").length, tags: document.querySelectorAll(".ach .ach-r-tag").length,
    legend: !!document.querySelector(".ach.on.tier4 .ach-st.ach-r4"), heads: [...document.querySelectorAll(".section-head h2")].map(h => h.textContent)
  }));
  assert.deepEqual(r.tiers, ["Oddiy", "Nodir", "Epik", "Afsonaviy"]);
  assert.equal(r.tags, r.cards);
  assert.equal(r.legend, true);
  assert.ok(r.heads.includes("Mahorat sinovlari") && r.heads.includes("Reyting va doʻstlar"));
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.deepEqual(errors, []);
});
