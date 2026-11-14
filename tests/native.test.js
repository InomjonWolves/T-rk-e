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
  assert.match(out, /<meta charset="utf-8">\n<script>\/\* Ilova \(Capacitor\) \*\/window\.TY_NATIVE=1;window\.FB_SDK_BASE="vendor\/firebase\/";<\/script>/);
  assert.doesNotMatch(out, /AUDIO_BASE/, "recordings are inside the app");
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
  for (const d of ["@capacitor/local-notifications", "@capacitor-community/speech-recognition", "@capacitor-community/text-to-speech", "@capacitor/app", "@capacitor/haptics", "@capacitor/share"]) assert.ok(pkg.dependencies[d], d);
  const mf = read("native/android/app/src/main/AndroidManifest.xml");
  assert.match(mf, /android\.permission\.RECORD_AUDIO/);
  assert.match(mf, /android\.permission\.POST_NOTIFICATIONS/);
  assert.match(mf, /SCHEDULE_EXACT_ALARM" tools:node="remove"/, "a daily reminder needs no exact alarm (Play policy)");
  assert.match(read("native/android/app/src/main/res/drawable/ic_stat_pamuk.xml"), /<vector/);
  assert.equal(cfg.plugins.LocalNotifications.smallIcon, "ic_stat_pamuk");
  for (const d of ["capacitor-community-speech-recognition", "capacitor-community-text-to-speech", "capacitor-haptics", "capacitor-share"]) assert.match(read("native/android/capacitor.settings.gradle"), new RegExp(d), "cap sync android was run");
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

test("app mode: no install card, no web push, recordings from inside the app; Google hidden when the app has no sign-in plugin", async () => {
  const { page, errors } = await openApp(browser, "#home", { native: true });
  const r = await page.evaluate(() => [IS_NATIVE, document.documentElement.classList.contains("native"), isStandalone(), installCard(), audioPath("abcdef"), FB_SDK[0]]);
  assert.deepEqual(r, [true, true, true, "", "audio/ab/abcdef.mp3", "vendor/firebase/firebase-app-compat.js"]);
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

test("app audio: every recording in audio/index.txt is packed into the app and rebuilt when the audio changes", () => {
  const { audioFiles } = require("../tools/native-www.js");
  const files = audioFiles();
  assert.ok(files.length > 4000, String(files.length));
  for (const f of files) assert.ok(fs.existsSync(path.join(ROOT, f)), f);
  assert.match(read(".github/workflows/native.yml"), /- "audio\/\*\*"/);
  assert.match(read(".github/workflows/audio.yml"), /gh workflow run native\.yml/, "a commit by the workflow token starts no other workflow");
});

test("google-services.json check: the app must be in the file with a web client", () => {
  const { check } = require("../tools/google-services-check.js");
  const app = (oauth) => ({ project_info: { project_id: "t-rk-e" }, client: [{ client_info: { android_client_info: { package_name: "uz.turkceyol.app" } }, oauth_client: oauth }] });
  assert.deepEqual(check(app([{ client_type: 1 }, { client_type: 3 }])), { ok: true, project: "t-rk-e", web: true, android: true });
  assert.equal(check(app([])).web, false);
  assert.equal(check({ client: [{ client_info: { android_client_info: { package_name: "other.app" } } }] }).ok, false);
  assert.match(read(".github/workflows/native.yml"), /node tools\/google-services-check\.js/);
});

/* 3-bosqich: the phone's own speech recognition, voice, Back button, vibration and share sheet.
   Fake Capacitor plugins record their calls in window.__nc. */
const phone = () => {
  window.TY_NATIVE = 1;
  window.__nc = [];
  const log = (n, a) => window.__nc.push([n, a === undefined ? null : a]);
  window.__perm = "prompt"; window.__grant = "granted"; window.__heard = null;
  const P = {
    SpeechRecognition: {
      available: async () => ({ available: true }),
      checkPermissions: async () => ({ speechRecognition: window.__perm }),
      requestPermissions: async () => { log("perm"); window.__perm = window.__grant; return { speechRecognition: window.__grant }; },
      start: async o => { log("listen", o); await new Promise(r => setTimeout(r, 30)); if (window.__heard === "!") throw new Error("No speech input"); return { matches: [window.__heard || SES.items[SES.i].tr, "boşluk"] }; },
      stop: async () => log("stopListen")
    },
    TextToSpeech: { speak: async o => { log("speak", o); await new Promise(r => setTimeout(r, 20)); }, stop: async () => log("stopSpeak") },
    App: { addListener: (ev, f) => { if (ev === "backButton") window.__back = f; return Promise.resolve({ remove() {} }); }, minimizeApp: async () => log("minimize") },
    Haptics: { impact: async o => log("impact", o.style), notification: async o => log("notify", o.type) },
    Share: { share: async o => { log("share", o); if (window.__cancelShare) throw new Error("Share canceled"); return {}; } },
    LocalNotifications: {
      checkPermissions: async () => ({ display: window.__nperm || "prompt" }),
      requestPermissions: async () => { log("nperm"); window.__nperm = window.__ngrant || "granted"; return { display: window.__nperm }; },
      createChannel: async o => log("channel", o.id),
      schedule: async o => { log("schedule", JSON.parse(JSON.stringify(o.notifications))); return { notifications: o.notifications.map(n => ({ id: n.id })) }; },
      cancel: async o => log("cancel", o.notifications.map(n => n.id)),
      addListener: (ev, f) => { if (ev === "localNotificationActionPerformed") window.__tap = f; return Promise.resolve({ remove() {} }); }
    }
  };
  window.Capacitor = { isNativePlatform: () => true, isPluginAvailable: n => n in P, Plugins: P };
};
const calls = (page, n) => page.evaluate(n => window.__nc.filter(c => c[0] === n).map(c => c[1]), n);

test("app speech recognition: the phone's recognizer (tr-TR) asks for the microphone once, then scores the answer", async () => {
  const { page, errors } = await openApp(browser, "#practice", { native: true, init: phone });
  assert.deepEqual(await page.evaluate(() => [canListen(), SR === NativeSR]), [true, true]);
  await page.evaluate(() => startSession("say", "pron"));
  await page.click("#mic-btn");
  await page.waitForFunction(() => !REC && SES.answered);
  const [o] = await calls(page, "listen");
  assert.deepEqual([o.language, o.popup, o.maxResults], ["tr-TR", false, 5]);
  assert.match(await page.textContent("#fb"), /Aferin|Mükemmel/);
  // The permission is asked only the first time; a silent answer is a "no speech" message
  await page.evaluate(() => { window.__heard = "!"; });
  await page.evaluate(() => startSession("say", "pron"));
  await page.click("#mic-btn");
  await page.waitForFunction(() => !REC && /Ovoz eshitilmadi/.test(document.getElementById("fb").textContent));
  assert.equal((await calls(page, "perm")).length, 1);
  // Microphone refused
  await page.evaluate(() => { window.__perm = "prompt"; window.__grant = "denied"; window.__heard = null; });
  await page.click("#mic-btn");
  await page.waitForFunction(() => !REC && /ruxsat berilmagan/.test(document.getElementById("fb").textContent));
  assert.equal((await calls(page, "listen")).length, 2);
  // The placement / level test microphone uses the same recognizer
  await page.evaluate(() => { window.__grant = "granted"; window.__heard = "Merhaba, nasılsın?"; });
  const best = await page.evaluate(() => new Promise(ok => { const b = document.createElement("button"); micCapture({ kind: "say", tr: "Merhaba, nasılsın?" }, b, ok); }));
  assert.equal(best.score, 1);
  assert.deepEqual(errors, []);
  await page.close();
});

test("app voice: texts without a recording are spoken by the phone (tr-TR, speed setting); dialogs one line after another", async () => {
  const { page, errors } = await openApp(browser, "#home", { native: true, init: phone });
  assert.equal(await page.evaluate(() => canSpeak()), true);
  await page.evaluate(() => { S.tts = { r: 1.2 }; speak("Merhaba"); });
  await page.waitForFunction(() => window.__nc.some(c => c[0] === "speak"));
  const [o] = await calls(page, "speak");
  assert.deepEqual([o.text, o.lang, Math.round(o.rate * 100)], ["Merhaba", "tr-TR", 102]);
  await page.evaluate(() => speakSeq([["Defne", "Günaydın!"], ["Kerem", "Günaydın, nasılsın?"], ["Defne", "İyiyim."]]));
  await page.waitForFunction(() => window.__nc.filter(c => c[0] === "speak").length === 4, null, { timeout: 5000 });
  const seq = (await calls(page, "speak")).slice(1);
  assert.deepEqual(seq.map(s => [s.text, s.pitch]), [["Günaydın!", 1], ["Günaydın, nasılsın?", 1.3], ["İyiyim.", 1]]);
  await page.evaluate(() => ttsCancel());
  assert.ok((await calls(page, "stopSpeak")).length >= 1);
  assert.deepEqual(errors, []);
  await page.close();
});

test("app Back button: closes the top window first, asks before leaving a practice, then goes back; home goes to the background", async () => {
  const { page, errors } = await openApp(browser, "#home", { native: true, init: phone });
  await page.waitForFunction(() => typeof window.__back === "function");
  const back = () => page.evaluate(() => nativeBack(history.length > 1));
  await page.evaluate(() => { location.hash = "#lugat"; });
  await page.waitForFunction(() => document.querySelector('.view[data-v="lugat"]'));
  await page.evaluate(() => openSheet("<p>test</p>"));
  assert.equal(await back(), "sheet");
  assert.equal(await page.evaluate(() => $("sheet").hidden), true);
  await page.evaluate(() => startSession("say", "pron"));
  assert.equal(await back(), "confirm");
  assert.equal(await page.evaluate(() => !!SES), true, "one press does not lose the practice");
  assert.equal(await back(), "session");
  assert.equal(await page.evaluate(() => SES), null);
  assert.equal(await back(), "history");
  await page.waitForFunction(() => ["", "#home"].includes(location.hash));
  assert.equal(await back(), "minimize");
  assert.equal((await calls(page, "minimize")).length, 1);
  // The plugin's own event reaches the same handler
  await page.evaluate(() => window.__back({ canGoBack: false }));
  assert.equal((await calls(page, "minimize")).length, 2);
  assert.deepEqual(errors, []);
  await page.close();
});

test("app vibration: a light tap when right, the error pattern when wrong; it can be turned off in the settings", async () => {
  const { page, errors } = await openApp(browser, "#settings", { native: true, init: phone });
  await page.evaluate(() => { startSession("say", "pron"); sMood("happy"); sMood("sad"); closeSession(); });
  assert.deepEqual(await page.evaluate(() => window.__nc.filter(c => c[0] === "impact" || c[0] === "notify")), [["impact", "LIGHT"], ["notify", "ERROR"]]);
  await page.evaluate(() => { location.hash = "#settings"; });
  await page.waitForSelector('[data-act="hap"][aria-checked="true"]');
  await page.evaluate(() => document.querySelector('[data-act="hap"]').click());
  await page.waitForSelector('[data-act="hap"][aria-checked="false"]');
  const n = (await calls(page, "impact")).length;
  await page.evaluate(() => { startSession("say", "pron"); sMood("happy"); sMood("sad"); closeSession(); });
  assert.equal((await calls(page, "impact")).length + (await calls(page, "notify")).length, n + 1, "no vibration when off");
  assert.equal(await page.evaluate(() => JSON.parse(localStorage["turkce-yol-v1"]).hap), false);
  assert.deepEqual(errors, []);
  await page.close();
});

test("app share: the phone's share sheet with the site link; closing it is not an error", async () => {
  const { page, errors } = await openApp(browser, "#home", { native: true, init: phone });
  await page.evaluate(() => shareSite("Yutuq oldim!"));
  const [o] = await calls(page, "share");
  assert.deepEqual([o.text, o.url, o.title], ["Yutuq oldim!", "https://turkceyol.web.app/", "Türkçe Yoʻl"]);
  assert.equal(await page.evaluate(() => S.shared), 1);
  await page.evaluate(() => { window.__cancelShare = true; return shareLink("https://turkceyol.web.app/#do-x", "Doʻst boʻlaylik"); });
  assert.equal((await calls(page, "share")).length, 2);
  assert.deepEqual(errors, []);
  await page.close();
});

test("website: none of the phone features are used — browser speech, voice and share stay as they were", async () => {
  const { page, errors } = await openApp(browser, "#settings");
  const r = await page.evaluate(() => [IS_NATIVE, SR === NativeSR, ntts(), nativePlugin("Share"), !!document.querySelector('[data-act="hap"]')]);
  assert.deepEqual(r, [false, false, null, null, false]);
  await page.evaluate(() => { startSession("say", "pron"); sMood("happy"); closeSession(); });
  assert.deepEqual(errors, []);
  await page.close();
});

test("app reminders: scheduled on the phone for the coming days at the chosen hour; a day with practice gets none", async () => {
  const { page, errors } = await openApp(browser, "#settings", { native: true, init: phone });
  await page.waitForFunction(() => window.__nc.some(c => c[0] === "channel"));
  // Permission refused: nothing is turned on
  await page.evaluate(() => { window.__ngrant = "denied"; document.querySelector('[data-act="remind"][data-v="19"]').click(); });
  await page.waitForFunction(() => window.__nc.some(c => c[0] === "nperm"));
  await page.waitForFunction(() => /ruxsat berilmadi/.test(document.getElementById("toast").textContent));
  assert.equal(await page.evaluate(() => remHour()), 0);
  await page.evaluate(() => { window.__ngrant = "granted"; document.querySelector('[data-act="remind"][data-v="19"]').click(); });
  await page.waitForFunction(() => window.__nc.some(c => c[0] === "schedule"));
  const [ns] = await calls(page, "schedule");
  assert.ok(ns.length >= 6 && ns.length <= 7, String(ns.length));
  assert.ok(ns.every(n => new Date(n.schedule.at).getHours() === 19 && n.channelId === "remind" && n.smallIcon === "ic_stat_pamuk" && n.schedule.allowWhileIdle && n.isExactNotification === false));
  assert.ok(ns.every(n => n.id >= 7000 && n.id < 7007 && n.title && n.body));
  assert.match(await page.textContent('.rem-row small'), /Har kuni 19:00 da/);
  // Practised today with a 5-day streak: the list starts tomorrow and keeps the streak
  await page.evaluate(() => { S.lastDay = todayKey(); S.streak = 5; nremSync(); });
  await page.waitForFunction(() => window.__nc.filter(c => c[0] === "schedule").length === 2);
  const ns2 = (await calls(page, "schedule"))[1];
  assert.equal(ns2.length, 6);
  assert.equal(ns2[0].id, 7001);
  assert.deepEqual([ns2[0].title, ns2[0].body], ["Seriyangiz yoʻqolmasin!", "5 kun ketma-ket — bugun ham 5 daqiqa mashq qiling. Pamuk kutyapti!"]);
  assert.notEqual(ns2[1].title, "Seriyangiz yoʻqolmasin!");
  assert.deepEqual((await calls(page, "cancel")).pop(), [7000, 7001, 7002, 7003, 7004, 7005, 7006]);
  // Nothing changed: no new scheduling
  await page.evaluate(() => nremSync());
  assert.equal((await calls(page, "schedule")).length, 2);
  // Tapping the notification opens the home page
  await page.evaluate(() => window.__tap({ notification: { id: 7001, extra: { url: "#home" } } }));
  await page.waitForFunction(() => location.hash === "#home");
  // Turned off: all cancelled, nothing scheduled
  await page.evaluate(() => { location.hash = "#settings"; });
  await page.waitForSelector('[data-act="remind"][data-v="0"]');
  const nc = (await calls(page, "cancel")).length;
  await page.evaluate(() => document.querySelector('[data-act="remind"][data-v="0"]').click());
  await page.waitForFunction(n => window.__nc.filter(c => c[0] === "cancel").length > n, nc);
  assert.equal((await calls(page, "schedule")).length, 2);
  assert.deepEqual(errors, []);
  await page.close();
});
