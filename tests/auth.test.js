// E-mail accounts enter the app only after the address is confirmed; Google accounts enter at once.
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
  await page.click("#tab-signup");
  await page.fill("#a-name", "Yasmina");
  await page.click('#f-gender [data-g="f"]');
  await page.evaluate(() => { for (const id of ["b-day", "b-month", "b-year"]) { const s = document.getElementById(id); s.selectedIndex = s.options.length > 20 ? 20 : 3; s.dispatchEvent(new Event("change", { bubbles: true })); } });
  await page.fill("#a-email", "yasmina@example.com");
  await page.fill("#a-pass", "parol-123456");
  await page.fill("#a-pass2", "parol-123456");
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
  assert.equal(doc.gender, "f");
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
