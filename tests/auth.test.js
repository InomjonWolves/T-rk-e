// E-mail accounts enter the app only after the address is confirmed; Google accounts enter at once (popup first).
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { launch } = require("./helpers");
const { openFb } = require("./fakefb");

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

const gate = page => page.evaluate(() => ({
  verify: !document.getElementById("auth-verify").hidden, overlay: !document.getElementById("auth").hidden,
  user: typeof USER !== "undefined" && USER ? USER.uid : null, email: document.getElementById("v-email").textContent
}));

test("sign-up with e-mail: the verification screen holds the app until the address is confirmed", async () => {
  const { page, errors } = await openFb(browser, "#home");
  await page.waitForFunction(() => !document.getElementById("auth-body").hidden);
  // The e-mail form is folded away; sign-up asks only for a name, an address and one password
  await page.evaluate(() => { document.getElementById("auth-email").open = true; });
  await page.click("#tab-signup");
  assert.equal(await page.evaluate(() => !!document.getElementById("f-gender") || !!document.getElementById("a-pass2")), false);
  await page.fill("#a-name", "Yasmina");
  await page.fill("#a-email", "yasmina@example.com");
  await page.fill("#a-pass", "parol-123456");
  await page.click("#auth-submit");
  await page.waitForFunction(() => !document.getElementById("auth-verify").hidden);
  assert.deepEqual(await gate(page), { verify: true, overlay: true, user: null, email: "yasmina@example.com" });
  assert.equal(await page.evaluate(() => window.__mails), 1);
  assert.equal(await page.evaluate(() => !!__db["users/new1"]), false, "nothing is written before verification");
  // Resending is paused for a minute (Firebase refuses quick repeats)
  assert.match(await page.textContent("#v-again"), /Qayta yuborish \(\d+ s\)/);
  assert.equal(await page.evaluate(() => document.getElementById("v-again").disabled), true);
  // "I confirmed" before confirming
  await page.click("[data-act=verify-check]");
  await page.waitForFunction(() => /hali tasdiqlanmagan/.test(document.getElementById("v-msg").textContent));
  // After the link in the mail is opened
  await page.evaluate(() => __fbVerify());
  await page.click("[data-act=verify-check]");
  await page.waitForFunction(() => USER && USER.uid === "new1" && document.getElementById("auth").hidden);
  const doc = await page.evaluate(() => __db["users/new1"]);
  assert.equal(doc.name, "Yasmina");
  assert.equal(await page.evaluate(() => document.getElementById("auth-verify").hidden), true);
  assert.deepEqual(errors, []);
  await page.close();
});

test("an unconfirmed account cannot stay in, even from an earlier local copy; it can switch accounts", async () => {
  const { page, errors } = await openFb(browser, "#home");
  await page.evaluate(() => { localStorage["ty-last-user"] = JSON.stringify({ uid: "u9", name: "X" }); });
  await page.evaluate(() => __fbUser({ uid: "u9", email: "x@example.com", providerData: [{ providerId: "password" }], emailVerified: false }));
  await page.waitForFunction(() => !document.getElementById("auth-verify").hidden);
  assert.equal((await gate(page)).user, null);
  assert.equal(await page.evaluate(() => localStorage["ty-last-user"] || null), null);
  // The resend button works once the pause is over
  await page.evaluate(() => { localStorage.removeItem("ty-verify-at"); verifyTick(); });
  await page.click("#v-again");
  await page.waitForFunction(() => /qayta yuborildi/.test(document.getElementById("v-msg").textContent));
  // "Boshqa pochta bilan kirish" signs out to the login form
  await page.click("[data-act=verify-out]");
  await page.waitForFunction(() => !document.getElementById("auth-body").hidden && document.getElementById("auth-verify").hidden);
  assert.equal(await page.evaluate(() => document.getElementById("auth-submit").disabled), false);
  // Google accounts are confirmed by Google and go straight in
  await page.evaluate(() => { __db["users/g1"] = { name: "G", gender: "m", birth: "2000-01-01", progress: { onb: 1 } }; __fbUser({ uid: "g1", email: "g@example.com", providerData: [{ providerId: "google.com" }], emailVerified: true }); });
  await page.waitForFunction(() => USER && USER.uid === "g1" && document.getElementById("auth").hidden);
  assert.deepEqual(errors, []);
  await page.close();
});

test("Google: a popup even in the installed app; redirect only when the popup is blocked; a lost redirect is explained", async () => {
  let { page, errors } = await openFb(browser, "#home");
  // Installed app (standalone display mode)
  await page.evaluate(() => { const mm = window.matchMedia; window.matchMedia = q => /standalone/.test(q) ? { matches: true, addListener() {}, addEventListener() {} } : mm(q); });
  await page.waitForFunction(() => !document.getElementById("auth-body").hidden);
  await page.click("[data-act=auth-google]");
  assert.deepEqual(await page.evaluate(() => window.__popups), ["google.com:"]);
  // A blocked popup falls back to the redirect and remembers it
  await page.evaluate(() => { window.__popupFail = "auth/popup-blocked"; });
  await page.click("[data-act=auth-google]");
  await page.waitForFunction(() => window.__popups.length === 3);
  assert.deepEqual(await page.evaluate(() => window.__popups.slice(1)), ["failed:google.com", "redirect:google.com"]);
  assert.ok(await page.evaluate(() => +sessionStorage.getItem("ty-redirect") > 0));
  await page.close();
  // Back from Google with no signed-in user (the browser dropped it): a clear message, not a silent login form
  ({ page, errors } = await openFb(browser, "#home", { session: { "ty-redirect": String(Date.now() - 5000) } }));
  await page.waitForFunction(() => /Google bilan kirish yakunlanmadi/.test(document.getElementById("auth-err").textContent));
  assert.equal(await page.evaluate(() => sessionStorage.getItem("ty-redirect")), null);
  // The message stays when the form is redrawn, and a new attempt clears it
  await page.evaluate(() => { document.getElementById("auth-email").open = true; });
  await page.click("#tab-signup"); await page.click("#tab-login");
  assert.match(await page.textContent("#auth-err"), /yakunlanmadi/);
  await page.click("[data-act=auth-google]");
  assert.equal(await page.textContent("#auth-err"), "");
  // Default config keeps the Firebase sign-in domain
  assert.equal(await page.evaluate(() => window.__fbConfig.authDomain), undefined);
  assert.deepEqual(errors, []);
  await page.close();
});

test("inside Telegram (Mini App): the Telegram data leaves the address, Google sign-in explains to use e-mail or a browser", async () => {
  const { openFb } = require("./fakefb");
  const { page, errors } = await openFb(browser, "#tgWebAppData=query_id%3DAA%26user%3D1&tgWebAppVersion=7.0&tgWebAppPlatform=android");
  assert.equal(await page.evaluate(() => location.hash), "#home");
  assert.equal(await page.evaluate(() => [IN_TG, sessionStorage["ty-tg"], document.documentElement.classList.contains("in-tg")].join()), "true,1,true");
  assert.equal(await page.evaluate(() => document.getElementById("auth-guest").offsetParent !== null), true, "the no-account start is offered inside Telegram too");
  await page.click("[data-act=auth-google]");
  assert.match(await page.textContent("#auth-err"), /Google bilan kirib boʻlmaydi/);
  assert.deepEqual(await page.evaluate(() => window.__popups || []), [], "no Google popup inside Telegram");
  assert.deepEqual(errors, []);
});

// Closes the welcome / celebration overlays that cover the page for a new visitor
async function closeAll(page) {
  await page.evaluate(() => { for (const id of ["welcome", "onboard", "celebrate"]) { const el = document.getElementById(id); if (el) el.hidden = true; } document.body.classList.remove("locked"); document.body.style.overflow = ""; });
}

// Guest mode (2026-11): the app opens without an account; the progress moves into the account on sign-in
test("guest: start without an account, a card offers to save the result, sign-in keeps the guest progress", async () => {
  const { openFb } = require("./fakefb");
  const { page, errors } = await openFb(browser, "#home");
  await page.waitForFunction(() => !document.getElementById("auth-body").hidden);
  await page.click("#auth-guest");
  await page.waitForFunction(() => document.getElementById("auth").hidden && !!document.querySelector("#app").children.length);
  assert.equal(await page.evaluate(() => [USER, localStorage.getItem("ty-guest")].join()), ",1");
  await closeAll(page);
  await page.evaluate(() => { S.xp = 50; save(); route(); });
  assert.match(await page.textContent(".guest-card"), /Natijangizni saqlab qoʻying/);
  assert.equal(await page.evaluate(() => Object.keys(__db).length), 0, "a guest writes nothing to the server");
  // The one-time offer after the first exercise
  await page.evaluate(() => guestNudge());
  assert.match(await page.textContent("#sheet-body"), /Natijamni saqlash/);
  await page.click("#sheet-body [data-act=guest-signup]");
  assert.equal(await page.evaluate(() => document.getElementById("auth").hidden), false);
  assert.match(await page.textContent("#auth-guest"), /Mehmon sifatida davom etish/);
  // Signing in (Google here) carries the guest progress into the account
  await page.evaluate(() => __fbUser({ uid: "g1", displayName: "Ali", email: "ali@example.com" }));
  await page.waitForFunction(() => USER && USER.uid === "g1" && document.getElementById("auth").hidden);
  assert.equal(await page.evaluate(() => S.xp), 50);
  assert.equal(await page.evaluate(() => __db["users/g1"].progress.xp), 50);
  assert.equal(await page.evaluate(() => localStorage.getItem("ty-guest")), null);
  assert.equal(await page.evaluate(() => !!document.querySelector(".guest-card")), false);
  assert.deepEqual(errors, []);
  await page.close();
});

test("guest: an unconfirmed e-mail account can start learning at once and confirm later", async () => {
  const { openFb } = require("./fakefb");
  const { page, errors } = await openFb(browser, "#home");
  await page.waitForFunction(() => !document.getElementById("auth-body").hidden);
  await page.evaluate(() => { document.getElementById("auth-email").open = true; });
  await page.click("#tab-signup");
  await page.fill("#a-name", "Dilnoza"); await page.fill("#a-email", "d@example.com"); await page.fill("#a-pass", "parol-123456");
  await page.click("#auth-submit");
  await page.waitForFunction(() => !document.getElementById("auth-verify").hidden);
  await page.click("#auth-verify [data-act=auth-guest]");
  await page.waitForFunction(() => document.getElementById("auth").hidden);
  await closeAll(page);
  await page.evaluate(() => route());
  assert.match(await page.textContent(".guest-card"), /Pochtangizni tasdiqlang/);
  assert.equal(await page.evaluate(() => !!__db["users/new1"]), false, "still nothing on the server");
  // Confirmed in the mail app, then back through the card
  await page.evaluate(() => __fbVerify());
  await page.evaluate(() => document.querySelector(".guest-card [data-act=guest-signup]").click()); // the first-visit tour may cover the page
  await page.waitForFunction(() => USER && USER.uid === "new1" && document.getElementById("auth").hidden);
  assert.equal(await page.evaluate(() => __db["users/new1"].name), "Dilnoza");
  assert.deepEqual(errors, []);
  await page.close();
});
