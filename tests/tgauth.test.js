// Telegram sign-in (2026-11): the bot server checks Telegram's signature and gives a Firebase custom token;
// the site shows "Telegram orqali kirish" inside the Mini App and signs in with that token.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const { launch } = require("./helpers");
const { openFb } = require("./fakefb");
const T = require("../bot/api/tgauth.js");

const BOT = "123456:TEST-token";
function initData(fields, bot = BOT) {
  const p = new URLSearchParams(fields);
  const dcs = [...p].map(([k, v]) => k + "=" + v).sort().join("\n");
  const key = crypto.createHmac("sha256", "WebAppData").update(bot).digest();
  p.set("hash", crypto.createHmac("sha256", key).update(dcs).digest("hex"));
  return p.toString();
}
const now = Date.UTC(2026, 10, 12, 10);
const fresh = (user = { id: 777, first_name: "Dilnoza", last_name: "R" }) => initData({ auth_date: String(now / 1000 - 60), query_id: "AA", user: JSON.stringify(user) });
const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });
const ENV = { TG_BOT_TOKEN: BOT, FB_SA_B64: Buffer.from(JSON.stringify({ client_email: "tg-login@t-rk-e.iam.gserviceaccount.com", private_key: privateKey })).toString("base64") };

test("tgauth: a correctly signed, fresh initData → a signed custom token for tg<id> with the tg claim", () => {
  const r = T.auth(fresh(), ENV, now);
  assert.equal(r.code, 200);
  assert.equal(r.body.uid, "tg777");
  assert.equal(r.body.name, "Dilnoza R");
  const [h, b, s] = r.body.token.split(".");
  assert.ok(crypto.createVerify("RSA-SHA256").update(h + "." + b).verify(publicKey, Buffer.from(s, "base64url")), "signed with the service account key");
  const c = JSON.parse(Buffer.from(b, "base64url"));
  assert.equal(c.uid, "tg777"); assert.deepEqual(c.claims, { tg: true });
  assert.equal(c.iss, "tg-login@t-rk-e.iam.gserviceaccount.com");
  assert.equal(c.aud, "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit");
  assert.equal(c.exp - c.iat, 3600);
});

test("tgauth: a changed field, another bot's signature, an old date, a bot account or no setup are refused", () => {
  assert.equal(T.auth(fresh().replace("Dilnoza", "Boshqa"), ENV, now).code, 401, "tampered user");
  assert.equal(T.auth(initData({ auth_date: String(now / 1000 - 60), user: JSON.stringify({ id: 777 }) }, "999:OTHER"), ENV, now).code, 401, "other bot");
  assert.equal(T.auth(initData({ auth_date: String(now / 1000 - 2 * 86400), user: JSON.stringify({ id: 777 }) }), ENV, now).code, 401, "older than a day");
  assert.equal(T.auth(fresh({ id: 5, is_bot: true }), ENV, now).code, 401, "a bot");
  assert.equal(T.auth(fresh({ id: -5 }), ENV, now).code, 401, "bad id");
  assert.equal(T.auth("", ENV, now).code, 401);
  assert.equal(T.auth("hash=zz&user=x", ENV, now).code, 401);
  assert.equal(T.auth(fresh(), {}, now).code, 503, "not configured");
});

test("tgauth: the HTTP handler answers the site's origin only, and only to POST", async () => {
  const call = (method, origin, body) => new Promise(done => {
    const res = { h: {}, setHeader(k, v) { this.h[k] = v; }, status(c) { this.code = c; return this; }, json(j) { done({ code: this.code, h: this.h, j }); }, end() { done({ code: this.code, h: this.h }); } };
    T({ method, headers: { origin }, body }, res);
  });
  const o = await call("OPTIONS", "https://turkceyol.web.app");
  assert.equal(o.code, 204); assert.equal(o.h["Access-Control-Allow-Origin"], "https://turkceyol.web.app");
  const e = await call("POST", "https://evil.example", { initData: "x" });
  assert.equal(e.h["Access-Control-Allow-Origin"], undefined);
  assert.equal((await call("GET", "https://turkceyol.web.app")).code, 405);
});

test("firestore rules: a Telegram account counts as confirmed only with the tg claim and a tg<digits> uid", () => {
  const rules = require("fs").readFileSync(require("path").join(__dirname, "..", "firestore.rules"), "utf8");
  assert.match(rules, /sign_in_provider == 'custom'/);
  assert.match(rules, /token\.get\('tg', false\) == true/);
  assert.match(rules, /matches\('tg\[0-9\]\+'\)/);
});

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

test("site in the Mini App: Telegram sign-in leads, signs in with the server's token and keeps the guest progress", async () => {
  let posted = null;
  // As in real Telegram: the signed data comes only in the address (tgWebAppData). The site cleans the address at once,
  // so telegram-web-app.js, loaded later, finds nothing there — the site must keep the data itself.
  const signed = "query_id=AA&user=%7B%22id%22%3A42%7D&auth_date=1&hash=ab";
  const { page, errors } = await openFb(browser, "#tgWebAppData=" + encodeURIComponent(signed) + "&tgWebAppVersion=7.0&tgWebAppPlatform=android", {
    cfg: "window.TG_AUTH_URL='https://bot.test/api/tgauth';",
    init: "window.Telegram = { WebApp: { initData: '', ready() {}, expand() {} } }; ",
    routes: [["https://bot.test/api/tgauth", r => { posted = JSON.parse(r.request().postData()); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ token: "tg42.payload.sig", uid: "tg42", name: "Jasur" }) }); }]]
  });
  await page.waitForFunction(() => !document.getElementById("auth-body").hidden);
  assert.equal(await page.evaluate(() => !document.getElementById("auth-tg").hidden), true, "Telegram button shown inside Telegram");
  assert.equal(await page.evaluate(() => document.getElementById("auth-guest").classList.contains("btn-soft")), true, "guest start is the second option");
  // A guest with progress, then the Telegram button
  await page.evaluate(() => { localStorage.setItem("ty-guest", "1"); S.xp = 30; save(); });
  await page.click("#auth-tg");
  await page.waitForFunction(() => USER && USER.uid === "tg42" && document.getElementById("auth").hidden);
  assert.deepEqual(posted, { initData: signed }, "the exact signed string Telegram gave");
  assert.equal(await page.evaluate(() => location.hash), "#home", "the address is still cleaned");
  assert.equal(await page.evaluate(() => [USERNAME, __db["users/tg42"].name, __db["users/tg42"].progress.xp].join()), "Jasur,Jasur,30");
  assert.deepEqual(errors, []);
  await page.close();
});

test("site outside Telegram: no Telegram button; inside Telegram without signed data the bot is offered", async () => {
  let { page, errors } = await openFb(browser, "#home", { cfg: "window.TG_AUTH_URL='https://bot.test/api/tgauth';" });
  await page.waitForFunction(() => !document.getElementById("auth-body").hidden);
  assert.equal(await page.evaluate(() => document.getElementById("auth-tg").hidden), true);
  await page.close();
  // A link opened inside Telegram (not the bot's button): Telegram's browser, but no signed data in the address
  ({ page, errors } = await openFb(browser, "#home", { cfg: "window.TG_AUTH_URL='https://bot.test/api/tgauth';", init: "window.TelegramWebviewProxy = {}; window.Telegram = { WebApp: { initData: '', ready() {}, expand() {}, openTelegramLink(u) { window.__opened = u; } } };" }));
  await page.waitForFunction(() => !document.getElementById("auth-body").hidden);
  await page.click("#auth-tg");
  await page.waitForFunction(() => window.__opened, null, { timeout: 8000 });
  assert.equal(await page.evaluate(() => window.__opened), "https://t.me/TurkceYolBot");
  assert.match(await page.textContent("#auth-err"), /Ilovani ochish/);
  assert.deepEqual(errors, []);
  await page.close();
});
