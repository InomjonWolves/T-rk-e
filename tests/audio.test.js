// Recorded audio (Google TTS files in audio/): the app plays them first and falls back to the device voice.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { launch, openApp, ROOT } = require("./helpers");
const gen = require("../tools/audio-gen.js");

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

// Fake <audio> and speechSynthesis: record what would be played
const stubs = () => {
  window.__played = []; window.__tts = [];
  window.Audio = class {
    constructor() { this.src = ""; }
    play() { const me = this; __played.push({ src: me.src, rate: me.playbackRate }); if (window.__audioFail && !me.src.startsWith("data:")) setTimeout(() => me.onerror && me.onerror(), 5); else setTimeout(() => me.onended && me.onended(), 5); return Promise.resolve(); }
    pause() {}
  };
  AEL = null;
  window.speechSynthesis.speak = u => { __tts.push(u.text); setTimeout(() => u.onend && u.onend(), 5); };
  window.speechSynthesis.cancel = () => {};
};

test("audio: the same key in the app and in the generator; recordings first, device voice otherwise", async () => {
  const { page, errors } = await openApp(browser, "#home");
  const texts = ["Merhaba", "Teşekkür ederim…", "  Benim  adım Ali. ", "ağaç", "Iğdır'a gidelim mi?"];
  const keys = await page.evaluate(t => t.map(x => [audioKey(x), audioKey(x, "b")]), texts);
  assert.deepEqual(keys, texts.map(x => [gen.audioKey(x), gen.audioKey(x, "b")]));
  assert.ok(keys.every(([a, b]) => /^[0-9a-z]{11}$/.test(a) && a !== b));
  assert.equal(gen.audioKey("Merhaba"), gen.audioKey(" Merhaba… "), "normalised like the app");

  await page.evaluate(stubs);
  // No index yet: device voice
  await page.evaluate(() => { AUDIO_SET = null; speak("kitap"); });
  assert.deepEqual(await page.evaluate(() => [__played.length, __tts]), [0, ["kitap"]]);
  // With a recording: the file plays, at the chosen speed, and the device voice stays quiet
  await page.evaluate(() => { AUDIO_SET = new Set([audioKey("kitap"), audioKey("Selam"), audioKey("Merhaba", "b")]); __tts = []; S.tts = { r: 0.75 }; speak("kitap"); });
  const p = await page.evaluate(() => ({ played: __played, tts: __tts, key: audioKey("kitap") }));
  assert.equal(p.played.length, 1);
  assert.ok(p.played[0].src.endsWith(`audio/${p.key.slice(0, 2)}/${p.key}.mp3`), p.played[0].src);
  assert.ok(Math.abs(p.played[0].rate - 0.75) < 1e-6);
  assert.deepEqual(p.tts, []);
  // The slow button plays slower
  await page.evaluate(() => { __played = []; S.tts = {}; speak("kitap", null, 0.55); });
  assert.ok(Math.abs(await page.evaluate(() => __played[0].rate) - 0.55 / 0.85) < 1e-6);
  // Text without a recording → device voice
  await page.evaluate(() => { __played = []; __tts = []; speak("defter"); });
  assert.deepEqual(await page.evaluate(() => [__played.length, __tts]), [0, ["defter"]]);
  // A file that cannot load (offline) → device voice, and it is not tried again
  await page.evaluate(() => { __audioFail = true; __tts = []; speak("Selam"); });
  await page.waitForFunction(() => __tts.length === 1);
  assert.equal(await page.evaluate(() => hasRec("Selam")), false);
  await page.evaluate(() => { __audioFail = false; });
  // Dialog: the second speaker uses voice "b" when it was recorded; lines without files use the device voice
  await page.evaluate(() => { __played = []; __tts = []; AUDIO_SET.add(audioKey("kitap", "b")); AUDIO_SET.add(audioKey("Selam")); speakSeq([["Ali", "Selam"], ["Ayşe", "Merhaba"], ["Ali", "Nasılsın?"]]); });
  await page.waitForFunction(() => __played.length + __tts.length >= 3, null, { timeout: 4000 });
  const d = await page.evaluate(() => ({ played: __played.map(x => x.src.split("/").pop()), tts: __tts, a: audioKey("Selam") + ".mp3", b: audioKey("Merhaba", "b") + ".mp3" }));
  assert.deepEqual(d.played, [d.a, d.b]);
  assert.deepEqual(d.tts, ["Nasılsın?"]);
  // With recordings the listening exercises work even without a device voice (Telegram's browser)
  assert.equal(await page.evaluate(() => { const s = window.speechSynthesis; delete window.speechSynthesis; const r = canSpeak(); window.speechSynthesis = s; return r; }), true);
  assert.deepEqual(errors, []);
  await page.close();
});

test("audio: the text list covers every word, dialogs and readings; site config serves files right", async () => {
  const list = await require("../tools/audio-texts.js").collect();
  const a = list.filter(x => x[0] === "a"), b = list.filter(x => x[0] === "b");
  assert.ok(a.length > 3500, `${a.length} texts`);
  assert.ok(b.length > 50, "second dialog voice");
  const keys = new Set(list.map(([v, t]) => gen.audioKey(t, v)));
  assert.equal(keys.size, list.length, "no key collisions");
  assert.ok(list.some(x => x[1] === "Günaydın, hocam!"), "course dialog line");
  assert.ok(list.some(x => x[1].startsWith("Merhaba! Benim adım Ali.")), "reading paragraph");
  const chars = list.reduce((s, x) => s + x[1].length, 0);
  assert.ok(chars < 300000, `${chars} characters — keep it inside the free tier`);
  const sw = fs.readFileSync(path.join(ROOT, "sw.js"), "utf8");
  assert.match(sw, /\\\/audio\\\//, "the service worker leaves audio ranges to the network");
  const fb = JSON.parse(fs.readFileSync(path.join(ROOT, "firebase.json"), "utf8"));
  assert.ok(fb.hosting.headers.some(h => h.source === "audio/**/*.mp3" && /immutable/.test(h.headers[0].value)));
  const wf = fs.readFileSync(path.join(ROOT, ".github/workflows/audio.yml"), "utf8");
  assert.match(wf, /GOOGLE_TTS_KEY/); assert.match(wf, /node tools\/audio-gen\.js/); assert.match(wf, /gh workflow run firebase-hosting\.yml/);
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "tools/audio-voice.json"), "utf8"));
  assert.ok("a" in cfg && "b" in cfg);
});
