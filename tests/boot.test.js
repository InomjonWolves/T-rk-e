// Fast start: the Firebase SDK does not block the first paint, and a returning user sees their local copy at once.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { BASE, launch } = require("./helpers");

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

// A tiny fake of the Firebase compat SDK. The sign-in answer waits until the test calls window.__fbResolve(user|null).
const FAKE_APP = `
window.__fbCalls = [];
(function () {
  let cb = null, pending;
  window.__fbResolve = u => { pending = u; if (cb) cb(u); };
  const doc = id => ({
    get: () => Promise.resolve({ exists: !!window.__cloud, data: () => window.__cloud }),
    set: d => { window.__fbCalls.push(["set", id]); return Promise.resolve(); },
    delete: () => Promise.resolve()
  });
  const col = () => ({ doc, get: () => Promise.resolve({ docs: [], forEach() {} }), where() { return this; }, orderBy() { return this; }, limit() { return this; } });
  const fs = () => ({ collection: col });
  fs.FieldValue = { serverTimestamp: () => 0 };
  const au = () => ({
    languageCode: "", getRedirectResult: () => Promise.resolve(null),
    onAuthStateChanged: f => { cb = f; if (pending !== undefined) f(pending); },
    signOut: () => { window.__fbCalls.push(["signOut"]); if (cb) cb(null); return Promise.resolve(); }
  });
  au.GoogleAuthProvider = function () {};
  window.firebase = { initializeApp: () => {}, auth: au, firestore: fs };
})();`;

async function open(state, { sdk = true, last = null } = {}) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.route("**/firebase-config.js", r => r.fulfill({ body: "window.FIREBASE_CONFIG={apiKey:'test',projectId:'test'}", contentType: "text/javascript" }));
  await page.route(/gstatic\.com\/firebasejs\//, r => {
    if (!sdk) return r.abort();
    r.fulfill({ body: r.request().url().includes("-app-") ? FAKE_APP : "", contentType: "text/javascript" });
  });
  await page.route(/^https?:\/\/(?!www\.gstatic\.com\/firebasejs\/)/, r => r.abort());
  await page.addInitScript(({ state, last }) => {
    sessionStorage["ty-welcomed"] = "1";
    if (last) {
      localStorage["ty-last-user"] = JSON.stringify(last);
      localStorage["turkce-yol-v1:" + last.uid] = JSON.stringify(state);
      localStorage["ty-profile:" + last.uid] = JSON.stringify({ gender: "f", birth: "2000-01-01" });
    }
  }, { state, last });
  await page.goto(BASE + "#home");
  await page.waitForTimeout(250);
  return { page, errors };
}

test("returning user: the local copy opens before Firebase answers, then syncs quietly", async () => {
  const { page, errors } = await open({ onb: 1, xp: 345 }, { last: { uid: "u1", name: "Malika" } });
  const early = await page.evaluate(() => ({ auth: document.getElementById("auth").hidden, xp: S.xp, early: EARLY, user: USER, name: USERNAME, home: !!document.querySelector("#app").children.length }));
  assert.deepEqual(early, { auth: true, xp: 345, early: "u1", user: null, name: "Malika", home: true });
  // Progress made while waiting is kept when the cloud copy (older, less XP) arrives
  await page.evaluate(() => { S.xp += 5; save(); window.__cloud = { name: "Malika", gender: "f", birth: "2000-01-01", progress: { xp: 100 } }; __fbResolve({ uid: "u1", email: "m@x.uz", providerData: [] }); });
  await page.waitForFunction(() => USER && !EARLY);
  await page.waitForTimeout(100);
  const later = await page.evaluate(() => ({ auth: document.getElementById("auth").hidden, xp: S.xp, saved: __fbCalls.some(c => c[0] === "set" && c[1] === "u1") }));
  assert.deepEqual(later, { auth: true, xp: 350, saved: true });
  // Signing out forgets the last user and shows the sign-in screen
  await page.evaluate(() => document.querySelector("[data-act=logout]") ? null : (location.hash = "#settings"));
  await page.waitForTimeout(100);
  await page.click("[data-act=logout]");
  await page.waitForTimeout(100);
  const out = await page.evaluate(() => ({ auth: document.getElementById("auth").hidden, last: localStorage["ty-last-user"] || null, user: USER }));
  assert.deepEqual(out, { auth: false, last: null, user: null });
  assert.deepEqual(errors, []);
  await page.close();
});

test("returning user signed out elsewhere: the sign-in screen replaces the local copy", async () => {
  const { page, errors } = await open({ onb: 1, xp: 50 }, { last: { uid: "u2", name: "Aziz" } });
  await page.evaluate(() => __fbResolve(null));
  await page.waitForTimeout(100);
  const r = await page.evaluate(() => ({ auth: document.getElementById("auth").hidden, form: !document.getElementById("auth-body").hidden, xp: S.xp, last: localStorage["ty-last-user"] || null }));
  assert.deepEqual(r, { auth: false, form: true, xp: 0, last: null });
  assert.deepEqual(errors, []);
  await page.close();
});

test("new visitor: the sign-in screen with its buttons is there at once, before Firebase answers; no SDK at all falls back to guest mode", async () => {
  let { page, errors } = await open({});
  assert.equal(await page.evaluate(() => !document.getElementById("auth").hidden && document.getElementById("auth-loading").hidden && !document.getElementById("auth-body").hidden), true);
  await page.evaluate(() => __fbResolve(null));
  await page.waitForTimeout(100);
  assert.equal(await page.evaluate(() => !document.getElementById("auth-body").hidden), true);
  assert.deepEqual(errors, []);
  await page.close();

  ({ page, errors } = await open({}, { sdk: false }));
  const g = await page.evaluate(() => ({ auth: document.getElementById("auth").hidden, fb: FB, home: !!document.querySelector("#app").children.length }));
  assert.deepEqual(g, { auth: true, fb: false, home: true });
  assert.deepEqual(errors, []);
  await page.close();
});

test("index.html does not load the Firebase SDK with blocking script tags", () => {
  const html = require("fs").readFileSync(require("path").join(__dirname, "..", "index.html"), "utf8");
  assert.ok(!/<script[^>]+gstatic\.com\/firebasejs/.test(html));
});

// ---- The full course arrives after the first paint
test("course-core.js is up to date and its answer keys match the app's kKeys()", async () => {
  const fs = require("fs"), path = require("path");
  const { build } = require("../tools/course-core");
  assert.equal(fs.readFileSync(path.join(__dirname, "..", "course-core.js"), "utf8"), build(), "run `npm run build` after editing course.js");
  const { openApp } = require("./helpers");
  const { page, errors } = await openApp(browser, "#home");
  await page.waitForFunction(() => COURSE_FULL);
  const bad = await page.evaluate(() => COURSE.units.filter(u => JSON.stringify(u.keys) !== JSON.stringify(kKeys(u))).map(u => u.id));
  assert.deepEqual(bad, []);
  assert.deepEqual(errors, []);
  await page.close();
});

test("home is drawn without course.js; a unit page and a tap wait for it", async () => {
  const { BASE } = require("./helpers");
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  let release;
  const gate = new Promise(r => { release = r; });
  await page.route("**/firebase-config.js", r => r.fulfill({ body: "window.FIREBASE_CONFIG=null", contentType: "text/javascript" }));
  await page.route(/\/course\.js$/, async r => { await gate; r.continue(); });
  await page.route(/^https?:\/\//, r => r.abort());
  await page.addInitScript(() => { sessionStorage["ty-welcomed"] = "1"; localStorage["turkce-yol-v1"] = JSON.stringify({ onb: 1 }); });
  await page.goto(BASE + "#home", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelector("#app .view"));
  const home = await page.evaluate(() => ({ full: COURSE_FULL, loading: !!document.querySelector("#app .spin"), next: kNext().id, progress: kProgress("a1-1") }));
  assert.deepEqual(home, { full: false, loading: false, next: "a1-1", progress: 0 });
  // Other pages that do not need the course body also work
  for (const h of ["#course", "#practice", "#guide", "#profile", "#skills"]) {
    await page.evaluate(h => { location.hash = h; }, h);
    await page.waitForTimeout(50);
    assert.equal(await page.evaluate(() => !!document.querySelector("#app .spin")), false, `${h} waited for the course`);
  }
  await page.evaluate(() => { location.hash = "#k-a1-2"; });
  await page.waitForTimeout(50);
  assert.equal(await page.evaluate(() => !!document.querySelector("#app .spin")), true);
  // A tap that needs dialogs (speaking practice sheet) is replayed once the course is there
  await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "start"; b.dataset.mode = "lsent"; b.dataset.u = "auto"; b.id = "t-lsent"; document.body.appendChild(b); b.click(); });
  release();
  await page.waitForFunction(() => COURSE_FULL && !document.querySelector("#app .spin"));
  await page.waitForFunction(() => SES && SES.mode === "lsent" && SES.items.length > 0);
  assert.equal(await page.evaluate(() => KU["a1-2"].exercises.length > 0 && COURSE.units[0] === KU["a1-1"]), true);
  assert.deepEqual(errors, []);
  await page.close();
});
