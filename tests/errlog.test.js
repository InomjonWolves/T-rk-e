// The error log (2026-11-16): errors on a learner's device are kept by kind with a count, noise is left out, and
// they reach errs/{sig} without any name or account id; the admin page lists them and clears a fixed one
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { launch, openApp } = require("./helpers");
const { openFb } = require("./fakefb");

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });
const log = page => page.evaluate(() => JSON.parse(localStorage.getItem("ty-errs") || "{}"));

test("error log: one entry per kind with a count; noise, extensions and a lost connection are left out", async () => {
  const { page } = await openApp(browser, "#home");
  await page.evaluate(() => { localStorage.removeItem("ty-errs"); location.hash = "#do-secretuid123"; });
  // The same error twice (numbers in the message do not make a new kind), then noise of every sort
  for (const n of [12, 13]) await page.addScriptTag({ content: `setTimeout(() => { throw new TypeError("Cannot read properties of undefined (reading 'x${n}')"); }, 0);` });
  await page.evaluate(() => {
    Promise.reject(new DOMException("The play() request was interrupted", "AbortError"));
    Promise.reject(new TypeError("Failed to fetch"));
    Promise.reject(Object.assign(new Error("Failed to get document because the client is offline."), { code: "unavailable" }));
    window.dispatchEvent(new ErrorEvent("error", { message: "ResizeObserver loop completed with undelivered notifications." }));
    window.dispatchEvent(new ErrorEvent("error", { message: "boom", filename: "chrome-extension://abc/content.js", lineno: 1, colno: 1 }));
    window.dispatchEvent(new ErrorEvent("error", { message: "Script error." }));
    Promise.reject(Object.assign(new Error("Missing or insufficient permissions."), { code: "permission-denied" }));
  });
  await page.waitForTimeout(300);
  const l = Object.values(await log(page));
  assert.equal(l.length, 2, JSON.stringify(l));
  const te = l.find(e => /TypeError/.test(e.m)), pd = l.find(e => /permission-denied/.test(e.m));
  assert.equal(te.n, 2); assert.equal(te.sent, 0); assert.equal(te.r, "#do", "the address part after «-» (an account id, a group code) is not kept");
  assert.equal(te.v, "dev"); assert.match(pd.m, /^permission-denied: Missing or insufficient permissions/);
  // At most 20 kinds: the oldest go
  await page.evaluate(() => { for (let i = 0; i < 25; i++) errNote("Error kind " + "abcdefghijklmnopqrstuvwxy"[i], "js/ui.js:1:" + i, ""); });
  const all = await log(page);
  assert.equal(Object.keys(all).length, 20);
  assert.ok(Object.values(all).some(e => e.m === "Error kind y") && !Object.values(all).some(e => /TypeError/.test(e.m)));
  // A script place is kept without the site's address
  assert.deepEqual(await page.evaluate(() => [errPlace("https://turkceyol.web.app/js/units.js:1:2"), errPlace("https://localhost/js/ui.js:3:4"), errPlace("file:///home/x/T-rk-e/morph.js:9:1")]), ["js/units.js:1:2", "js/ui.js:3:4", "morph.js:9:1"]);
});

const ME = { uid: "u1", displayName: "Dilnoza", email: "d@x.uz" };
const pending = { e1a: { m: "TypeError: x is undefined", f: "js/units.js:1:2", s: "at kPath (js/units.js:1:2)", n: 3, sent: 0, r: "#course", v: "dev", at: 1 } };

test("error log: sent without a name or account id, counts added once; «Anonim statistika» off sends nothing", async () => {
  let { page, errors } = await openFb(browser, "#home", { user: ME, init: { content: `localStorage.setItem("ty-errs", ${JSON.stringify(JSON.stringify(pending))});` } });
  await page.waitForFunction(() => window.__db["errs/e1a"], null, { timeout: 15000 });
  const doc = await page.evaluate(() => window.__db["errs/e1a"]);
  assert.deepEqual(Object.keys(doc).sort(), ["at", "f", "m", "n", "p", "r", "s", "ua", "v"]);
  assert.equal(doc.n, 3); assert.equal(doc.p, "web"); assert.ok(!JSON.stringify(doc).includes("u1") && !JSON.stringify(doc).includes("Dilnoza"));
  assert.equal((await log(page)).e1a.sent, 3);
  // Nothing new: nothing is sent again; a new occurrence adds one
  await page.evaluate(() => errFlush());
  assert.equal(await page.evaluate(() => window.__db["errs/e1a"].n), 3);
  await page.evaluate(() => { const l = JSON.parse(localStorage.getItem("ty-errs")); l.e1a.n++; localStorage.setItem("ty-errs", JSON.stringify(l)); return errFlush(); });
  assert.equal(await page.evaluate(() => window.__db["errs/e1a"].n), 4);
  assert.deepEqual(errors, []);
  await page.close();
  ({ page, errors } = await openFb(browser, "#home", { user: ME, seed: { "users/u1": { progress: { anon: false } } }, init: { content: `localStorage.setItem("ty-errs", ${JSON.stringify(JSON.stringify(pending))});` } }));
  await page.waitForFunction(() => SYNC_AT > 0);
  await page.evaluate(() => errFlush());
  assert.equal(await page.evaluate(() => Object.keys(window.__db).some(k => k.startsWith("errs/"))), false);
  assert.deepEqual(errors, []);
});

test("error log on #admin: the most frequent first, details, «Tuzatildi» clears one", async () => {
  const seed = {
    "admins/u1": { on: true },
    "errs/eaaa": { m: "TypeError: rare", f: "js/ui.js:1:1", s: "", r: "#home", v: "abc", p: "app", ua: "Android 14 · Chrome 131", n: 2, at: "TS" },
    "errs/ebbb": { m: "ReferenceError: often", f: "js/units.js:1:9", s: "at kPath (js/units.js:1:9)", r: "#course", v: "abc", p: "web", ua: "Windows · Chrome 131", n: 40, at: "TS" }
  };
  const { page, errors } = await openFb(browser, "#home", { user: ME, seed });
  await page.waitForFunction(() => ADMIN);
  await page.evaluate(() => { location.hash = "#admin"; });
  await page.waitForSelector(".err-row");
  const rows = await page.evaluate(() => [...document.querySelectorAll(".err-row .err-top")].map(r => r.textContent.trim()));
  assert.deepEqual(rows, ["40×ReferenceError: often", "2×TypeError: rare"]);
  assert.ok(await page.locator(".err-row details pre").count());
  await page.evaluate(() => document.querySelector(".err-row [data-act=err-del]").click());
  await page.waitForFunction(() => !window.__db["errs/ebbb"] && document.querySelectorAll(".err-row").length === 1);
  assert.deepEqual(errors, []);
});
