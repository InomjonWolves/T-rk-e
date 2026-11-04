// Friends: invite link, mutual adding through invites/{owner}/from/{uid}, bonuses, friends' leaderboard.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { ROOT, launch, closeCelebrate } = require("./helpers");
const { openFb } = require("./fakefb");

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

const DAY = 864e5;
const dayNum = (t = Date.now()) => Math.floor((t - new Date(t).getTimezoneOffset() * 6e4) / DAY);
const keyOf = n => new Date(n * DAY).toISOString().slice(0, 10);
const WEEK = keyOf(dayNum() - (new Date(dayNum() * DAY).getUTCDay() + 6) % 7);

const A = { uid: "a1aaaa", displayName: "Aziz Rahimov", email: "a@x.uz" };
const B = { uid: "b2bbbb", displayName: "Dilnoza Karimova", email: "d@x.uz" };
const prof = (name, extra) => ({ name, gender: "f", birth: "2000-01-01", progress: Object.assign({ onb: 1 }, extra || {}) });
const SEED = {
  "users/a1aaaa": prof("Aziz Rahimov"), "users/b2bbbb": prof("Dilnoza Karimova"),
  "league/a1aaaa": { name: "Aziz", week: WEEK, wxp: 300, xp: 1200, streak: 4, lg: 2 },
  "league/b2bbbb": { name: "Dilnoza", week: WEEK, wxp: 120, xp: 400, streak: 1, lg: 1 }
};
const as = async (page, u) => {
  await page.evaluate(u => { __fbUser(null); __fbUser(u); }, u);
  await page.waitForFunction(uid => USER && USER.uid === uid && document.getElementById("auth").hidden, u.uid);
};
const hash = async (page, h) => { await page.evaluate(h => { location.hash = h; }, h); await page.waitForTimeout(150); };

test("invite link → friend added on both sides, bonuses once, friends' table", async () => {
  const { page, errors } = await openFb(browser, "#home", { user: A, seed: SEED });
  // A: empty friends tab with the personal link
  await hash(page, "#rank-fr");
  await page.waitForSelector(".fr-invite");
  assert.match(await page.textContent(".fr-link"), /^https:\/\/turkceyol\.web\.app\/#do-a1aaaa$/);
  assert.match(await page.textContent("#rank-body"), /Hali doʻstlar yoʻq/);

  // B opens A's link and accepts
  await as(page, B);
  await hash(page, "#do-a1aaaa");
  await page.waitForSelector("[data-act=fr-add]");
  assert.match(await page.textContent("#fr-join"), /Aziz sizni taklif qilyapti[\s\S]*\+50 XP/);
  const xp0 = await page.evaluate(() => S.xp);
  await page.click("[data-act=fr-add]");
  await page.waitForFunction(() => location.hash === "#rank-fr" && document.querySelector("#rank-body .rank-row"));
  const b = await page.evaluate(x0 => ({ fr: S.fr, frIn: S.frIn, gain: S.xp - x0, note: __db["invites/a1aaaa/from/b2bbbb"] }), xp0);
  assert.deepEqual(b.fr, ["a1aaaa"]);
  assert.equal(b.frIn, "a1aaaa");
  assert.equal(b.gain, 50);
  assert.deepEqual(b.note, { name: "Dilnoza", at: "TS" });
  assert.match(await page.textContent("#rank-body"), /Aziz[\s\S]*300 XP[\s\S]*Siz/);
  // Opening the link again does not add twice
  await page.evaluate(() => frAdd("a1aaaa", true));
  assert.deepEqual(await page.evaluate(() => S.fr), ["a1aaaa"]);

  // A comes back: B is added from the inbox, +100 XP, the note is gone
  await page.evaluate(() => cloudFlush());
  await as(page, A);
  await page.waitForFunction(() => (S.fr || []).includes("b2bbbb"));
  const a = await page.evaluate(() => ({ fr: S.fr, frB: S.frB, note: __db["invites/a1aaaa/from/b2bbbb"], cel: ACH_QUEUE.map(c => c.title) }));
  assert.deepEqual(a.fr, ["b2bbbb"]);
  assert.equal(a.frB, 1);
  assert.equal(a.note, undefined);
  assert.ok(a.cel.includes("Dilnoza taklifingizni qabul qildi!"), a.cel.join());
  await closeCelebrate(page);
  await hash(page, "#rank-fr");
  await page.waitForSelector("#rank-body .rank-row");
  assert.match(await page.textContent("#rank-body"), /Siz[\s\S]*Dilnoza/);
  // Switching to another tab leaves the friends page
  await page.evaluate(() => document.querySelector("[data-act=rank-tab][data-t=week]").click());
  await page.waitForFunction(() => location.hash === "#rank" && RANK_TAB === "week");
  // Remove (two taps)
  await hash(page, "#rank-fr");
  await page.waitForSelector("[data-act=fr-del]");
  await page.evaluate(() => document.querySelector("[data-act=fr-del]").click());
  await page.evaluate(() => document.querySelector("[data-act=fr-del]").click());
  await page.waitForFunction(() => S.fr.length === 0);
  assert.deepEqual(errors, []);
});

test("a visitor without an account keeps the invite and is added after signing in", async () => {
  const { page, errors } = await openFb(browser, "#do-a1aaaa", { seed: SEED });
  await page.waitForFunction(() => localStorage["ty-friend"] === "a1aaaa");
  assert.equal(await page.evaluate(() => document.getElementById("auth").hidden), false, "sign-in screen first");
  await as(page, B);
  await page.waitForFunction(() => (S.fr || []).includes("a1aaaa") && !localStorage["ty-friend"], null, { timeout: 5000 });
  assert.ok(await page.evaluate(() => !!__db["invites/a1aaaa/from/b2bbbb"]));
  // Own link: no self-friendship
  await page.evaluate(() => frAdd(USER.uid, true));
  assert.deepEqual(await page.evaluate(() => S.fr), ["a1aaaa"]);
  assert.deepEqual(errors, []);
});

test("invite rules: only one's own note, read and cleared by the owner", () => {
  const rules = fs.readFileSync(path.join(ROOT, "firestore.rules"), "utf8");
  const m = rules.slice(rules.indexOf("match /invites/"), rules.indexOf("match /avatars/"));
  assert.match(m, /request\.auth\.uid == uid && uid != owner/);
  assert.match(m, /hasOnly\(\['name', 'at'\]\)/);
  assert.match(m, /allow read, delete: if okUser\(\) && request\.auth\.uid == owner/);
});
