// Progress on two devices (or as a guest and then in the account) is merged, never overwritten (sync.js, 2026-11-16)
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const Sync = require("../sync.js");
const { launch } = require("./helpers");
const { openFb } = require("./fakefb");

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

const st = o => Object.assign({ xp: 0, streak: 0, best: 0, lastDay: null, day: "2026-11-16", dayXp: 0, week: "2026-11-16", wxp: 0, srs: {}, days: {}, achv: {}, acc: [0, 0], sk: { r: [0, 0, 0, 0] }, gxm: {}, fr: [], goal: 50, lg: 1, lgw: "", savedAt: 1 }, JSON.parse(JSON.stringify(o)));

test("merge: counters add up, words keep the later review, achievements and lists join, removals stay removed", () => {
  const base = st({ xp: 100, dayXp: 20, wxp: 60, srs: { ev: { i: 1, d: 10, r: 1, t: 100 } }, days: { "2026-11-16": { xp: 20, rev: 4 } }, acc: [8, 10], sk: { r: [8, 10, 0, 60] }, achv: { first: "2026-11-02" }, gxm: { "A1.01#0": 1 }, fr: ["a"], streak: 3, best: 3, lastDay: "2026-11-16" });
  // This device: 50 XP more, «ev» reviewed again, a new word, a new friend, one more achievement
  const local = st(Object.assign(JSON.parse(JSON.stringify(base)), { xp: 150, dayXp: 70, wxp: 110, srs: { ev: { i: 3, d: 13, r: 2, t: 200 }, kedi: { i: 1, d: 17, r: 1, t: 210 } }, days: { "2026-11-16": { xp: 70, rev: 9 } }, acc: [12, 15], sk: { r: [12, 15, 0, 90] }, achv: { first: "2026-11-02", w10: "2026-11-16" }, fr: ["a", "b"], savedAt: 5 }));
  // The other device: 30 XP more, «ev» reviewed earlier there, another word, a mistake fixed, friend «a» removed
  const cloud = st(Object.assign(JSON.parse(JSON.stringify(base)), { xp: 130, dayXp: 50, wxp: 90, srs: { ev: { i: 1, d: 11, r: 1, t: 150 }, kuş: { i: 1, d: 17, r: 1, t: 160 } }, days: { "2026-11-16": { xp: 50, rev: 7 } }, acc: [10, 12], sk: { r: [10, 12, 0, 70] }, achv: { first: "2026-11-02", s3: "2026-11-15" }, gxm: {}, fr: [], savedAt: 4 }));
  const m = Sync.merge(base, local, cloud);
  assert.equal(m.xp, 180); assert.equal(m.dayXp, 100); assert.equal(m.wxp, 140);
  assert.deepEqual(m.days["2026-11-16"], { xp: 100, rev: 12 }); assert.deepEqual(m.acc, [14, 17]); assert.deepEqual(m.sk.r, [14, 17, 0, 100]);
  assert.deepEqual(Object.keys(m.srs).sort(), ["ev", "kedi", "kuş"]); assert.equal(m.srs.ev.t, 200, "the later review stands");
  assert.deepEqual(m.achv, { first: "2026-11-02", w10: "2026-11-16", s3: "2026-11-15" });
  assert.deepEqual(m.gxm, {}, "a mistake fixed on the other device stays fixed");
  assert.deepEqual(m.fr, ["b"], "a friend removed there stays removed, a new one here is added");
  // Nothing new on one side: the other side as it is
  assert.deepEqual(Sync.merge(base, base, cloud), cloud); assert.deepEqual(Sync.merge(base, local, base), local); assert.deepEqual(Sync.merge(base, local, local), local);
  // Both devices earned the same since the base (one vocab test each): both count
  const both = Sync.merge(st({ xp: 100, days: { d: { xp: 0 } } }), st({ xp: 130, days: { d: { xp: 30 } } }), st({ xp: 130, days: { d: { xp: 30 } }, savedAt: 2 }));
  assert.deepEqual([both.xp, both.days.d.xp], [160, 60]);
  // An earlier achievement date wins; settings changed on both sides: the copy saved last
  const s1 = Sync.merge(st({ goal: 50 }), st({ goal: 30, savedAt: 9, achv: { a: "2026-11-10" } }), st({ goal: 100, savedAt: 3, achv: { a: "2026-11-08" } }));
  assert.equal(s1.goal, 30); assert.equal(s1.achv.a, "2026-11-08");
});

test("merge: periods, streak, freezes, leagues, bonuses paid twice; without a common base nothing is added twice", () => {
  // Today's XP belongs to the later day; the same day adds up
  assert.equal(Sync.merge(st({ day: "2026-11-15", dayXp: 0 }), st({ day: "2026-11-16", dayXp: 40 }), st({ day: "2026-11-15", dayXp: 90 })).dayXp, 40);
  // The streak: the side that practised last; two runs that meet are one run (10 days to yesterday + today = 11)
  const s = Sync.merge(st({}), st({ lastDay: "2026-11-16", streak: 1, best: 1 }), st({ lastDay: "2026-11-15", streak: 10, best: 10 }));
  assert.deepEqual([s.lastDay, s.streak, s.best], ["2026-11-16", 11, 11]);
  const gap = Sync.merge(st({}), st({ lastDay: "2026-11-16", streak: 1 }), st({ lastDay: "2026-11-12", streak: 10, best: 10 }));
  assert.deepEqual([gap.streak, gap.best], [1, 10], "a broken run is not joined");
  // Freezes: one given here, one spent there
  assert.equal(Sync.merge(st({ frz: 1 }), st({ frz: 2 }), st({ frz: 0 })).frz, 1);
  // …and a gap both devices froze on their own is paid once
  assert.equal(Sync.merge(st({ frz: 2, frzD: [] }), st({ frz: 1, frzD: ["2026-11-15"] }), st({ frz: 1, frzD: ["2026-11-15"], savedAt: 3 })).frz, 1);
  // The league: the later week; a tie goes to the server's copy (its league row was written from it)
  assert.equal(Sync.merge(st({}), st({ lg: 1, lgw: "2026-11-16" }), st({ lg: 4, lgw: "2026-11-16" })).lg, 4);
  assert.equal(Sync.merge(st({}), st({ lg: 5, lgw: "2026-11-16" }), st({ lg: 4, lgw: "2026-11-09" })).lg, 5);
  // Daily quests and the weekly challenge done on both devices the same day: the bonus is flagged once
  const b = st({ dq: { d: 5, ok: {}, paid: 0 } }), l = st({ dq: { d: 5, ok: { vocab: 1, grammar: 1, listen: 1 }, paid: 1 } }), c = st({ dq: { d: 5, ok: { vocab: 1, grammar: 1, listen: 1 }, paid: 1 } });
  assert.equal(Sync.paidTwice(b, l, c, "dq", "d"), true); assert.equal(Sync.paidTwice(l, l, c, "dq", "d"), false);
  assert.deepEqual(Sync.twice(st({ achv: {} }), st({ achv: { w10: "x" } }), st({ achv: { w10: "y" } })), ["w10"]);
  // No common base (an old device, the first sign-in): counters take the larger value, words and lists join
  const nb = Sync.merge(null, st({ xp: 300, srs: { a: { t: 5 } }, fr: ["x"] }), st({ xp: 500, srs: { b: { t: 6 } }, fr: ["y"] }));
  assert.deepEqual([nb.xp, Object.keys(nb.srs).sort(), nb.fr.sort()], [500, ["a", "b"], ["x", "y"]]);
  // Results by question: the better one, question by question
  assert.deepEqual(Sync.merge(st({}), st({ gx: { "A1.01": [true, false, true] } }), st({ gx: { "A1.01": [false, true] } })).gx["A1.01"], [true, true, true]);
});

const U = { uid: "u1", displayName: "Dilnoza", email: "d@x.uz" };
const KEYU = "turkce-yol-v1:u1";
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
async function device(seed, local, extra = {}) {
  const items = Object.assign(local ? { [KEYU]: local } : {}, extra), put = {};
  Object.keys(items).forEach(k => { put[k] = typeof items[k] === "string" ? items[k] : JSON.stringify(items[k]); });
  // Only on the first load: a reload must see what the app itself stored
  const init = { content: `if (!sessionStorage.getItem("__put")) { sessionStorage.setItem("__put", "1"); const p = ${JSON.stringify(put)}; Object.keys(p).forEach(k => localStorage.setItem(k, p[k])); }` };
  const { page, errors } = await openFb(browser, "#home", { user: U, seed, init });
  await page.waitForFunction(() => SYNC_AT > 0 && !SYNC_LOCK, null, { timeout: 15000 });
  return { page, errors };
}
const settle = page => page.waitForFunction(() => !PUSHING && !cloudTimer && SYNC_AT > 0);

test("two devices: signing in merges both, later answers go both ways, nothing is counted twice", async () => {
  const d = today();
  const common = { xp: 200, day: d, dayXp: 0, srs: { ev: { i: 1, d: 1, r: 1, e: 2.5, m: 0, w: 0, t: 100 } }, achv: { first: "2026-11-02" }, savedAt: 10 };
  const phone = Object.assign({}, common, { xp: 260, srs: Object.assign({}, common.srs, { kedi: { i: 1, d: 1, r: 1, e: 2.5, m: 0, w: 0, t: 300 } }), savedAt: 20 });
  const laptop = Object.assign({}, common, { xp: 240, srs: Object.assign({}, common.srs, { kuş: { i: 1, d: 1, r: 1, e: 2.5, m: 0, w: 0, t: 310 } }), savedAt: 30 });
  // The phone signs in: its own copy, the last agreed copy (base) and the laptop's copy on the server
  const { page, errors } = await device({ "users/u1": { name: "Dilnoza", progress: laptop } }, phone, { [KEYU + ":base"]: common });
  const a = await page.evaluate(() => ({ xp: S.xp, words: Object.keys(S.srs).sort(), server: __db["users/u1"].progress.xp, sid: !!__db["users/u1"].sid, base: BASE.xp, name: __db["users/u1"].name }));
  assert.deepEqual(a, { xp: 300, words: ["ev", "kedi", "kuş"], server: 300, sid: true, base: 300, name: "Dilnoza" });
  // The laptop adds 40 XP and a word; the phone answers a question: both arrive everywhere
  await page.evaluate(() => { const p = __db["users/u1"].progress; p.xp += 40; p.srs.balık = { i: 1, d: 1, r: 1, e: 2.5, m: 0, w: 0, t: 400 }; p.savedAt = Date.now() + 5000; });
  await page.evaluate(() => { S.xp += 10; save(); cloudSave(true); });
  await settle(page);
  const b = await page.evaluate(() => ({ xp: S.xp, server: __db["users/u1"].progress.xp, words: Object.keys(S.srs).sort(), sw: Object.keys(__db["users/u1"].progress.srs).sort() }));
  assert.deepEqual(b, { xp: 350, server: 350, words: ["balık", "ev", "kedi", "kuş"], sw: ["balık", "ev", "kedi", "kuş"] });
  // Pushing again with nothing new changes nothing (no write, no double count)
  await page.evaluate(() => { __log = []; cloudPush(); });
  await settle(page);
  assert.deepEqual(await page.evaluate(() => [S.xp, __db["users/u1"].progress.xp, __log.filter(x => x.startsWith("update users") || x.startsWith("set users")).length]), [350, 350, 0]);
  // A word reviewed on the phone keeps its review time for the next merge
  assert.ok(await page.evaluate(() => { const w = ALL.find(x => x.tr === "ev") || ALL[0]; grade(w, true); return S.srs[w.tr].t > 1e6; }));
  assert.deepEqual(errors, []);
});

test("a write that reached the server though its answer was lost becomes the base: no double counting", async () => {
  const B0 = { xp: 100, savedAt: 1 }, M = { xp: 180, savedAt: 2 };
  // The server holds M written with id «w1»; this device did not hear back, so its base is still B0, and it earned 20 more since
  const { page, errors } = await device({ "users/u1": { progress: M, sid: "w1" } }, Object.assign({}, M, { xp: 200, savedAt: 3 }), { [KEYU + ":base"]: B0, [KEYU + ":base:p"]: { id: "w1", st: M } });
  assert.deepEqual(await page.evaluate(() => [S.xp, __db["users/u1"].progress.xp, localStorage.getItem(KEYU + ":base:p")]), [200, 200, null]);
  assert.deepEqual(errors, []);
});

test("guest progress joins the account: counts add up, the streak runs on, the guest copy is cleared after the merge", async () => {
  const d = today(), y = new Date(Date.parse(d) - 864e5).toISOString().slice(0, 10);
  const account = { xp: 1000, streak: 10, best: 10, lastDay: y, day: y, srs: { ev: { i: 3, d: 1, r: 2, t: 50 } }, savedAt: 5 };
  const guest = { xp: 60, streak: 1, best: 1, lastDay: d, day: d, dayXp: 60, srs: { kedi: { i: 1, d: 1, r: 1, t: 90 } }, savedAt: 9 };
  const { page, errors } = await device({ "users/u1": { progress: account } }, null, { "turkce-yol-v1": guest, "ty-guest": "1" });
  await settle(page);
  const r = await page.evaluate(() => ({ xp: S.xp, streak: S.streak, words: Object.keys(S.srs).sort(), server: __db["users/u1"].progress.xp, guest: localStorage.getItem("turkce-yol-v1"), flag: localStorage.getItem("ty-guest") }));
  assert.deepEqual(r, { xp: 1060, streak: 11, words: ["ev", "kedi"], server: 1060, guest: null, flag: null });
  assert.deepEqual(errors, []);
});
