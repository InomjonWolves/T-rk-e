// Android app (2026-11): a Trusted Web Activity around turkceyol.web.app, built and signed by .github/workflows/android.yml
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { launch, openApp } = require("./helpers");
const ROOT = path.resolve(__dirname, "..");
const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");
const textFiles = dir => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap(e => {
  const p = path.join(dir, e.name);
  return e.isDirectory() ? textFiles(p) : /\.(gradle|xml|json|properties|txt)$/.test(e.name) ? [p] : [];
});

test("android project: the app opens turkceyol.web.app, package uz.turkceyol.app, notifications delegated, no local addresses", () => {
  const m = JSON.parse(read("android/twa-manifest.json"));
  assert.equal(m.packageId, "uz.turkceyol.app");
  assert.equal(m.host, "turkceyol.web.app");
  assert.equal(m.startUrl, "/");
  assert.equal(m.enableNotifications, true);
  assert.equal(m.webManifestUrl, "https://turkceyol.web.app/manifest.webmanifest");
  for (const f of textFiles("android")) assert.doesNotMatch(read(f), /localhost|127\.0\.0\.1/, f);
  const g = read("android/app/build.gradle");
  assert.match(g, /applicationId "uz\.turkceyol\.app"/);
  assert.match(g, /hostName: 'turkceyol\.web\.app'/);
  assert.match(g, /System\.getenv\('ANDROID_KEY_PASS'\)/, "signed with the secret");
  assert.match(g, /System\.getenv\('ANDROID_VERSION_CODE'\)/, "a new version code for every build");
  for (const r of ["mipmap-xxxhdpi/ic_launcher.png", "mipmap-xxxhdpi/ic_maskable.png"]) assert.ok(fs.existsSync(path.join(ROOT, "android/app/src/main/res", r)), r);
});

test("android signing: only the encrypted upload key may enter the repo; the workflow keeps the password secret", () => {
  const gi = read(".gitignore");
  assert.match(gi, /^android\/upload-key\.jks$/m);
  assert.ok(!fs.existsSync(path.join(ROOT, "android/upload-key.jks")), "no plain key in the repo");
  const w = read(".github/workflows/android.yml");
  assert.match(w, /secrets\.ANDROID_KEY_PASS/);
  assert.match(w, /openssl enc -aes-256-cbc -pbkdf2/);
  assert.match(w, /-pass env:ANDROID_KEY_PASS/, "the password is read from the environment, never from the command line of openssl");
  assert.doesNotMatch(w, /echo[^\n]*\$\{?ANDROID_KEY_PASS/, "the password is never printed");
  assert.match(w, /git add android\/upload-key\.jks\.enc \.well-known\/assetlinks\.json/);
  assert.match(w, /^permissions:/m);
});

test("digital asset links: the upload key plus Play's key; bad fingerprints are refused; the site serves /.well-known", () => {
  const { fingerprints, assetlinks } = require("../tools/assetlinks.js");
  const a = "AB:".repeat(31) + "CD";
  assert.deepEqual(fingerprints([a.toLowerCase()]), [a]);
  assert.throws(() => fingerprints(["12:34"]), /SHA-256/);
  const j = assetlinks([a]);
  assert.deepEqual(j[0].relation, ["delegate_permission/common.handle_all_urls"]);
  assert.deepEqual(j[0].target, { namespace: "android_app", package_name: "uz.turkceyol.app", sha256_cert_fingerprints: [a] });
  const ig = JSON.parse(read("firebase.json")).hosting.ignore;
  assert.ok(ig.includes("android/**") && !ig.includes("**/.*"));
});

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

test("inside the Android app the site does not offer to install itself", async () => {
  const { page, errors } = await openApp(browser, "#home");
  assert.equal(await page.evaluate(() => inTwa()), false);
  const r = await page.evaluate(() => { sessionStorage.setItem("ty-twa", "1"); return [inTwa(), isStandalone(), installCard()]; });
  assert.deepEqual(r, [true, true, ""]);
  assert.deepEqual(errors, []);
});
