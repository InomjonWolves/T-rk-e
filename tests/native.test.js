// Standalone Android app (Capacitor, 2026-11): the site files are packed inside the app by tools/native-www.js
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { launch, openApp } = require("./helpers");
const { openFb } = require("./fakefb");
const { patchIndex, FILES } = require("../tools/native-www.js");
const ROOT = path.resolve(__dirname, "..");
const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");

test("native bundle: every file the app page loads is packed; the app index has the native flags and no CDN or redirect", () => {
  for (const f of FILES) assert.ok(fs.existsSync(path.join(ROOT, f)), f);
  const html = read("index.html");
  const local = [...html.matchAll(/(?:src|href)="([^"#:]+\.(?:js|css|png|svg))"/g)].map(m => m[1]);
  const lazy = [...read("app.js").matchAll(/\.src = "([a-z-]+\.js)"/g)].map(m => m[1]);
  for (const f of [...local, ...lazy]) assert.ok(FILES.includes(f), `${f} is not packed into the app`);
  const out = patchIndex(html);
  assert.match(out, /<meta charset="utf-8">\n<script>\/\* Ilova \(Capacitor\) \*\/window\.TY_NATIVE=1;window\.FB_SDK_BASE="vendor\/firebase\/";window\.AUDIO_BASE="https:\/\/turkceyol\.web\.app\/";<\/script>/);
  assert.doesNotMatch(out, /gstatic\.com|Yagona manzil|rel="manifest"/);
  assert.ok(out.indexOf("TY_NATIVE") < out.indexOf('src="app.js"'), "flags before the app");
});

test("native project: same package and upload key as the first app, portrait, Pamuk icons, the app's own Firebase SDK", () => {
  const cfg = JSON.parse(read("native/capacitor.config.json"));
  assert.equal(cfg.appId, "uz.turkceyol.app");
  assert.equal(cfg.webDir, "www");
  const g = read("native/android/app/build.gradle");
  assert.match(g, /applicationId "uz\.turkceyol\.app"/);
  assert.match(g, /System\.getenv\('ANDROID_KEY_PASS'\)/);
  assert.match(g, /System\.getenv\('ANDROID_VERSION_CODE'\) \?: '1000'/, "above the first app's version codes");
  assert.match(read("native/android/app/src/main/AndroidManifest.xml"), /android:screenOrientation="portrait"/);
  for (const d of ["mdpi", "xxxhdpi"]) assert.ok(fs.existsSync(path.join(ROOT, `native/android/app/src/main/res/mipmap-${d}/ic_launcher_foreground.png`)));
  // Android resource XML: well-formed comments (Gradle refuses "--" inside a comment)
  const resDir = path.join(ROOT, "native/android/app/src/main/res");
  for (const d of fs.readdirSync(resDir)) for (const f of fs.readdirSync(path.join(resDir, d)).filter(f => f.endsWith(".xml"))) {
    const x = fs.readFileSync(path.join(resDir, d, f), "utf8");
    for (const c of x.match(/<!--[\s\S]*?-->/g) || []) assert.doesNotMatch(c.slice(4, -3), /--/, `${d}/${f}`);
  }
  const pkg = JSON.parse(read("native/package.json"));
  assert.equal(pkg.devDependencies.firebase, "10.12.2");
  assert.match(read("app.js"), /firebasejs\/10\.12\.2\//, "the site and the app use one Firebase version");
  const w = read(".github/workflows/native.yml");
  assert.match(w, /android\/upload-key\.jks\.enc/, "signed with the same upload key");
  assert.match(w, /-pass env:ANDROID_KEY_PASS/);
  assert.match(w, /^permissions:/m);
  const gi = read(".gitignore");
  for (const x of ["native/node_modules/", "native/www/", "native/android/upload-key.jks"]) assert.ok(gi.includes(x), x);
});

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

test("app mode: no install card, no web push, recordings from the site; Google hidden when the app has no sign-in plugin", async () => {
  const { page, errors } = await openApp(browser, "#home", { native: true });
  const r = await page.evaluate(() => [IS_NATIVE, document.documentElement.classList.contains("native"), isStandalone(), installCard(), audioPath("abcdef"), FB_SDK[0]]);
  assert.deepEqual(r, [true, true, true, "", "https://turkceyol.web.app/audio/ab/abcdef.mp3", "vendor/firebase/firebase-app-compat.js"]);
  assert.equal(await page.evaluate(() => fcmToken()), null);
  await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "auth-google"; b.id = "g-test"; document.body.appendChild(b); });
  assert.equal(await page.evaluate(() => getComputedStyle(document.getElementById("g-test")).display), "none");
  assert.deepEqual(errors, []);
  // The website itself is unchanged
  const web = await openApp(browser, "#home");
  assert.deepEqual(await web.page.evaluate(() => [IS_NATIVE, audioPath("abcdef"), document.documentElement.classList.contains("native")]), [false, "audio/ab/abcdef.mp3", false]);
});

test("app Google sign-in: the phone's account window gives an ID token, Firebase signs in with it; sign-out forgets the phone account", async () => {
  const init = () => {
    window.TY_NATIVE = 1;
    window.__nativeCalls = [];
    window.Capacitor = { isNativePlatform: () => true, isPluginAvailable: n => n === "FirebaseAuthentication", Plugins: { FirebaseAuthentication: {
      signInWithGoogle: async () => { window.__nativeCalls.push("google"); return { credential: { idToken: "tok1" } }; },
      signOut: async () => { window.__nativeCalls.push("signOut"); }
    } } };
  };
  const { page, errors } = await openFb(browser, "#home", { init });
  await page.waitForFunction(() => document.querySelector('[data-act="auth-google"]') && getComputedStyle(document.querySelector('[data-act="auth-google"]')).display !== "none");
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains("native-nogoogle")), false);
  await page.evaluate(() => document.querySelector('[data-act="auth-google"]').click());
  await page.waitForFunction(() => (window.__credentials || []).length === 1);
  const r = await page.evaluate(() => [window.__nativeCalls.slice(), window.__credentials[0].idToken, window.__popups || []]);
  assert.deepEqual(r, [["google"], "tok1", []], "no web popup in the app");
  // A closed chooser is not an error
  await page.evaluate(() => { window.Capacitor.Plugins.FirebaseAuthentication.signInWithGoogle = async () => { throw new Error("The user canceled the sign-in flow."); }; });
  await page.evaluate(() => nativeGoogleSignIn());
  assert.equal(await page.evaluate(() => document.getElementById("auth-err").textContent), "");
  await page.evaluate(() => nativeSignOut());
  assert.deepEqual(await page.evaluate(() => window.__nativeCalls), ["google", "signOut"]);
  assert.deepEqual(errors, []);
  await page.close();
});

test("google-services.json check: the app must be in the file with a web client", () => {
  const { check } = require("../tools/google-services-check.js");
  const app = (oauth) => ({ project_info: { project_id: "t-rk-e" }, client: [{ client_info: { android_client_info: { package_name: "uz.turkceyol.app" } }, oauth_client: oauth }] });
  assert.deepEqual(check(app([{ client_type: 1 }, { client_type: 3 }])), { ok: true, project: "t-rk-e", web: true, android: true });
  assert.equal(check(app([])).web, false);
  assert.equal(check({ client: [{ client_info: { android_client_info: { package_name: "other.app" } } }] }).ok, false);
  assert.match(read(".github/workflows/native.yml"), /node tools\/google-services-check\.js/);
});
