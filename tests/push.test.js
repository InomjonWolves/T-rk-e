// Daily reminders: the settings switch, the push/{uid} row for the server, the service worker handlers
// and the server's choice of whom to remind (tools/push.js).
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { ROOT, launch, openApp, closeCelebrate } = require("./helpers");
const { openFb } = require("./fakefb");
const push = require("../tools/push.js");

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

test("server: reminds at the chosen hour only those who have not practised today in their own time zone", () => {
  const now = new Date("2026-11-03T14:07:00Z"); // 19:07 in Tashkent (UTC+5, offset −300)
  const doc = { t: "tok", h: 14, z: -300, d: "2026-11-02", s: 6 };
  assert.equal(push.localDay(now, -300), "2026-11-03");
  assert.equal(push.due(doc, now), true);
  assert.equal(push.due(Object.assign({}, doc, { d: "2026-11-03" }), now), false, "already practised today");
  assert.equal(push.due(Object.assign({}, doc, { h: 15 }), now), false, "another hour");
  assert.equal(push.due(Object.assign({}, doc, { t: "" }), now), false, "no token");
  // Late evening UTC is already tomorrow in Tashkent
  assert.equal(push.localDay(new Date("2026-11-03T20:30:00Z"), -300), "2026-11-04");
  assert.equal(push.streakLeft(doc, now), 6, "practised yesterday: the streak is still alive");
  assert.equal(push.streakLeft(Object.assign({}, doc, { d: "2026-10-30" }), now), 0);
  assert.match(push.text(6).body, /6 kun ketma-ket/);
  assert.match(push.text(0).title, /Pamuk/);
});

test("settings: turning the reminder on writes push/{uid} with the UTC hour; turning it off removes it", async () => {
  const me = { uid: "r1", displayName: "Aziz", email: "a@x.uz" };
  const { page, errors } = await openFb(browser, "#profile", { user: me, seed: { "users/r1": { name: "Aziz", gender: "m", birth: "2000-01-01", progress: { onb: 1, achv: {}, lastDay: "2026-11-01", streak: 3 } } } });
  await page.evaluate(() => {
    window.FCM_VAPID = "test-key";
    window.Notification = { permission: "default", requestPermission: async () => { Notification.permission = "granted"; return "granted"; } };
    firebase.messaging = Object.assign(() => ({ getToken: async o => (window.__vapid = o.vapidKey, "fcm-token-1") }), { isSupported: () => true });
    location.hash = "#profile";
  });
  await page.waitForSelector("[data-act=remind][data-v='19']");
  await page.click("[data-act=remind][data-v='19']");
  await page.waitForFunction(() => __db["push/r1"]);
  const row = await page.evaluate(() => ({ row: __db["push/r1"], utc: remUtcHour(19), vapid: __vapid, rem: S.rem }));
  assert.deepEqual(Object.keys(row.row).sort(), ["at", "d", "h", "s", "t", "z"]);
  assert.equal(row.row.t, "fcm-token-1");
  assert.equal(row.row.h, row.utc);
  assert.equal(row.vapid, "test-key");
  assert.deepEqual(row.rem, { h: 19 });
  assert.match(await page.textContent(".rem-row"), /Har kuni 19:00 da/);
  assert.equal(await page.evaluate(() => remUtcHour(19, -300)), 14);
  assert.equal(await page.evaluate(() => remUtcHour(1, -300)), 20);
  assert.equal(await page.evaluate(() => remUtcHour(9, 330)), 14);
  // Practice today: the row learns it (the server then stays quiet)
  await page.evaluate(() => { skillLog("r", true); save(); });
  await page.waitForFunction(() => __db["push/r1"].d === todayKey(), null, { timeout: 6000 });
  // Off
  await closeCelebrate(page);
  await page.click("[data-act=remind][data-v='0']");
  await page.waitForFunction(() => !__db["push/r1"]);
  assert.deepEqual(await page.evaluate(() => S.rem), { h: 0 });
  assert.deepEqual(errors, []);
});

test("settings: a refused permission keeps the reminder off and explains", async () => {
  const { page, errors } = await openApp(browser, "#profile");
  await page.evaluate(() => { window.Notification = { permission: "default", requestPermission: async () => "denied" }; });
  await page.click("[data-act=remind][data-v='21']");
  await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => remHour()), 0);
  assert.match(await page.textContent("#toast"), /ruxsat berilmadi/);
  assert.deepEqual(errors, []);
});

test("service worker: push, periodic sync and notification click are handled; the reminder cache survives updates", () => {
  const sw = fs.readFileSync(path.join(ROOT, "sw.js"), "utf8");
  for (const ev of ["push", "periodicsync", "notificationclick"]) assert.match(sw, new RegExp(`addEventListener\\("${ev}"`));
  assert.match(sw, /k !== CACHE && k !== META/);
  const rules = fs.readFileSync(path.join(ROOT, "firestore.rules"), "utf8");
  assert.match(rules, /match \/push\/\{uid\}[\s\S]*hasOnly\(\['t', 'h', 'z', 'd', 's', 'at'\]\)/);
  const wf = fs.readFileSync(path.join(ROOT, ".github/workflows/push.yml"), "utf8");
  assert.match(wf, /cron: "7 \* \* \* \*"/);
  assert.match(wf, /node tools\/push\.js/);
});
