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

const PROV = { apple: true, telegram: { botId: "123456", url: "https://tg.example/" } };

test("Apple and Telegram buttons appear only when configured; Apple asks for e-mail and name", async () => {
  let { page, errors } = await openFb(browser, "#home");
  await page.waitForFunction(() => !document.getElementById("auth-body").hidden);
  assert.deepEqual(await page.evaluate(() => [document.getElementById("auth-apple").hidden, document.getElementById("auth-tg").hidden]), [true, true]);
  await page.close();
  ({ page, errors } = await openFb(browser, "#home", { providers: PROV }));
  await page.waitForFunction(() => !document.getElementById("auth-body").hidden);
  assert.deepEqual(await page.evaluate(() => [document.getElementById("auth-apple").hidden, document.getElementById("auth-tg").hidden]), [false, false]);
  await page.click("#auth-apple");
  assert.deepEqual(await page.evaluate(() => window.__popups), ["apple.com:email,name"]);
  // Apple may hide the name: the first profile form asks for it
  await page.evaluate(() => __fbUser({ uid: "ap1", email: "x@privaterelay.appleid.com", providerData: [{ providerId: "apple.com" }], emailVerified: true, updateProfile(p) { Object.assign(this, p); return Promise.resolve(); } }));
  await page.waitForSelector("#ps-name");
  await page.fill("#ps-name", "Malika");
  await page.click('[data-act="ps-gender"][data-g="f"]');
  await page.evaluate(() => { for (const id of ["ps-day", "ps-month", "ps-year"]) { const s = document.getElementById(id); if (s) { s.selectedIndex = s.options.length > 20 ? 20 : 3; } } });
  await page.click("[data-act=ps-save]");
  await page.waitForFunction(() => __db["users/ap1"] && __db["users/ap1"].name === "Malika");
  assert.equal(await page.evaluate(() => USERNAME), "Malika");
  assert.deepEqual(errors, []);
  await page.close();
});

test("Telegram: the signed login goes to the server, its token signs in, no e-mail check needed", async () => {
  const { page, errors } = await openFb(browser, "#home", { providers: PROV });
  await page.waitForFunction(() => !document.getElementById("auth-body").hidden);
  let sent = null, fail = false;
  await page.route(/telegram\.org\/js\/telegram-widget\.js/, r => r.fulfill({ contentType: "text/javascript",
    body: "window.Telegram={Login:{auth:function(o,cb){window.__tgOpts=o;setTimeout(function(){cb({id:555,first_name:'Aziz',last_name:'Karimov',auth_date:1793600000,hash:'abc'})},10)}}};" }));
  await page.route("https://tg.example/auth", async r => {
    sent = JSON.parse(r.request().postData());
    if (fail) return r.fulfill({ status: 401, contentType: "application/json", body: '{"error":"bad_signature"}' });
    r.fulfill({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ token: "tok-555", uid: "tg555", name: "Aziz Karimov" }) });
  });
  // A refused signature shows a message and keeps the login form
  fail = true;
  await page.click("#auth-tg");
  await page.waitForFunction(() => /Telegram orqali kirib boʻlmadi/.test(document.getElementById("auth-err").textContent));
  assert.equal(await page.evaluate(() => !document.getElementById("auth-body").hidden), true);
  fail = false;
  await page.click("#auth-tg");
  await page.waitForFunction(() => USER && USER.uid === "tg555");
  assert.equal(sent.id, 555); assert.equal(sent.hash, "abc");
  assert.deepEqual(await page.evaluate(() => window.__tgOpts), { bot_id: "123456", request_access: "write", lang: "uz" });
  assert.deepEqual(await page.evaluate(() => window.__tokens), ["tok-555"]);
  assert.equal(await page.evaluate(() => document.getElementById("auth-verify").hidden), true, "no e-mail gate for Telegram");
  await page.waitForFunction(() => __db["users/tg555"] && __db["users/tg555"].name === "Aziz Karimov");
  // The name came from Telegram, so the profile form asks only gender and birth date
  await page.waitForSelector("[data-act=ps-save]");
  assert.equal(await page.evaluate(() => !!document.getElementById("ps-name")), false);
  assert.deepEqual(errors, []);
  await page.close();
});
