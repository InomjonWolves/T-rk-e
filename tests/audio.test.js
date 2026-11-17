// Recorded audio (Gemini TTS files in audio/, each story and dialog character in a voice of their own): the app plays them first and falls back to the device voice;
// the Android app plays them from the site and keeps the ones it played.
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
  // No list of recordings (it could not load): device voice
  await page.evaluate(() => { AUDIO_SET = null; speak("kitap"); });
  await page.waitForFunction(() => __tts.length === 1);
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
  // A character recorded in their own voice (Gemini, "p:<speaker>"): the dialog, a bubble's button and a story use it
  await page.evaluate(() => { __played = []; __tts = []; ["Selam", "Merhaba"].forEach(t => AUDIO_SET.add(audioKey(t, "p:Ali"))); AUDIO_SET.add(audioKey("Günaydın", "p:_")); speakSeq([["Ali", "Selam"], ["Ayşe", "Merhaba"]]); });
  await page.waitForFunction(() => __played.length + __tts.length >= 2, null, { timeout: 4000 });
  const cv = await page.evaluate(() => {
    const out = { seq: __played.map(x => x.src.split("/").pop()), ali: audioKey("Selam", "p:Ali") + ".mp3", ayseB: audioKey("Merhaba", "b") + ".mp3" };
    __played = []; sayWho("Ali", "Merhaba"); out.bubble = __played.map(x => x.src.split("/").pop()); out.aliM = audioKey("Merhaba", "p:Ali") + ".mp3";
    __played = []; hkSay({ cast: {} }, "", "Günaydın"); out.narr = __played.map(x => x.src.split("/").pop()); out.n = audioKey("Günaydın", "p:_") + ".mp3";
    return out;
  });
  assert.deepEqual(cv.seq, [cv.ali, cv.ayseB], "Ali in his own voice; Ayşe (not recorded as a character) falls back to b");
  assert.deepEqual(cv.bubble, [cv.aliM]); assert.deepEqual(cv.narr, [cv.n]);
  assert.deepEqual(d.tts, ["Nasılsın?"]);
  // With recordings the listening exercises work even without a device voice (Telegram's browser)
  assert.equal(await page.evaluate(() => { const s = window.speechSynthesis; delete window.speechSynthesis; const r = canSpeak(); window.speechSynthesis = s; return r; }), true);
  assert.deepEqual(errors, []);
  await page.close();
});

test("audio: the text list covers every word, dialogs and readings; site config serves files right", async () => {
  const list = await require("../tools/audio-texts.js").collect();
  const a = list.filter(x => x[0] === "a"), b = list.filter(x => x[0] === "b"), p = list.filter(x => x[0].startsWith("p:"));
  assert.ok(a.length > 3500, `${a.length} texts`);
  assert.ok(b.length > 50, "second dialog voice");
  // Every dialog and story line in its character's voice, and the conversations in order (stories first) for one request each
  assert.ok(p.length > 500 && p.some(x => x[0] === "p:Dilnoza") && p.some(x => x[0] === "p:_"), `${p.length} character lines`);
  assert.ok(list.groups.length > 40 && list.groups[0].id.startsWith("hk:") && list.groups.every(g => g.lines.length && g.lines.every(([w, t]) => p.some(x => x[0] === "p:" + w && x[1] === t))));
  const keys = new Set(list.map(([v, t]) => gen.audioKey(t, v)));
  assert.equal(keys.size, list.length, "no key collisions");
  assert.ok(list.some(x => x[1] === "Ben de memnun oldum."), "course dialog line");
  assert.ok(list.some(x => x[1].startsWith("Merhaba! Benim adım Ali.")), "reading paragraph");
  // Content quality (2026-11-14): the Turkish voice reads only Turkish — no Uzbek notes slipped into the Turkish side
  const UZ_ONLY = new Set(["kerak", "nima", "ekan", "uchun", "bilan", "yoki", "emas", "harakat", "egalik", "kesimda", "inkor", "qanday", "boʻladi"]);
  const uz = list.filter(([, t]) => t.toLocaleLowerCase("tr").split(/[^a-zçğıöşüâîûʻʼ]+/).some(w => UZ_ONLY.has(w)));
  assert.deepEqual(uz.map(x => x[1]), [], "Uzbek words in a text read by the Turkish voice");
  const chars = list.reduce((s, x) => s + x[1].length, 0);
  assert.ok(chars < 300000, `${chars} characters — keep it inside the free tier`);
  const sw = fs.readFileSync(path.join(ROOT, "sw.js"), "utf8");
  assert.match(sw, /\\\/audio\\\//, "the service worker leaves audio ranges to the network");
  const fb = JSON.parse(fs.readFileSync(path.join(ROOT, "firebase.json"), "utf8"));
  // A month in the cache (a file recorded again reaches everyone), readable by the app (CORS)
  assert.ok(fb.hosting.headers.some(h => h.source === "audio/**/*.mp3" && /max-age=2592000/.test(h.headers[0].value)));
  const wf = fs.readFileSync(path.join(ROOT, ".github/workflows/audio.yml"), "utf8");
  for (const re of [/GEMINI_API_KEY/, /node tools\/audio-gen\.js/, /gh workflow run firebase-hosting\.yml/, /gh workflow run audio\.yml/, /schedule:\s*\n\s*- cron:/, /ffmpeg/]) assert.match(wf, re);
  assert.doesNotMatch(wf, /edge-tts|AZURE_|GOOGLE_TTS/, "only the official key-based service");
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "tools/audio-voice.json"), "utf8"));
  assert.equal(cfg.provider, "gemini");
  const voices = new Set(cfg.female.concat(cfg.male));
  assert.ok([cfg.a, cfg.b].concat(Object.values(cfg.cast)).every(v => voices.has(v)), "every voice is a known Gemini voice");
  assert.ok(cfg.female.includes(cfg.cast.Dilnoza) && cfg.male.includes(cfg.cast.Jasur) && cfg.female.includes(cfg.cast["Elif Hoca"]) && cfg.male.includes(cfg.cast["Murat Bey"]));
  // Two speakers of one conversation never share a voice; a new name gets one by its title (Bey — a man's voice)
  const gv = gen.groupVoices(cfg, { lines: [["Pamuk", "x"], ["Rehber", "y"], ["Ali Bey", "z"]] });
  assert.equal(new Set(gv.values()).size, 3); assert.ok(cfg.male.includes(gv.get("Ali Bey")));
  // Requests: one voice, or a conversation of two speakers
  assert.deepEqual(gen.gBody("Merhaba", "Kore").generationConfig, { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } } });
  assert.deepEqual(gen.gBody("x", [["Defne", "Zephyr"], ["Kerem", "Achird"]]).generationConfig.speechConfig.multiSpeakerVoiceConfig.speakerVoiceConfigs.map(c => [c.speaker, c.voiceConfig.prebuiltVoiceConfig.voiceName]), [["Defne", "Zephyr"], ["Kerem", "Achird"]]);
  assert.equal(gen.label("Elif Hoca"), "ElifHoca"); assert.equal(gen.label("_"), "Anlatici");
  // One recording of many lines is cut at its long pauses into one piece a line; pauses that do not match → null
  const rate = 24000, tone = sec => { const b = Buffer.alloc(Math.floor(rate * sec) * 2); for (let i = 0; i < b.length / 2; i++) { const t = i / rate; b.writeInt16LE(Math.round((Math.floor(t / 0.25) % 4 === 3 ? 0 : 1) * 6000 * Math.sin(2 * Math.PI * 220 * t)), i * 2); } return b; };
  const sil = sec => Buffer.alloc(Math.floor(rate * sec) * 2), lens = [20, 45, 12];
  const pcm = Buffer.concat([sil(0.4), tone(0.3 + 0.075 * 20), sil(1.5), tone(0.3 + 0.075 * 45), sil(1.4), tone(0.3 + 0.075 * 12), sil(0.5)]);
  const parts = gen.splitPcm(pcm, rate, 3, lens);
  assert.equal(parts && parts.length, 3);
  assert.ok(parts.every((x, i) => gen.okLen(x.length / 2 / rate, lens[i])));
  assert.equal(gen.splitPcm(pcm, rate, 4, [10, 10, 10, 10]), null);
  assert.equal(gen.splitPcm(pcm, rate, 3, [200, 3, 3]), null, "pieces far from the lines' lengths");
});

test("app audio: a recording comes from the site when played, is kept, plays again without the network; next words fetched ahead", async () => {
  const { page, errors } = await openApp(browser, "#home", { native: true });
  let hits = [];
  await page.route(/^https:\/\/turkceyol\.web\.app\/audio\//, r => {
    hits.push(r.request().url().split("/").pop());
    if (/offline/.test(r.request().url()) || r.request().url().includes(globalThis.__deny || "-")) return r.abort();
    r.fulfill({ status: 200, contentType: "audio/mpeg", body: Buffer.alloc(800, 1) });
  });
  await page.evaluate(stubs);
  const k = await page.evaluate(() => { AUDIO_SET = new Set(["kitap", "defter", "kalem"].map(t => audioKey(t))); speak("kitap"); return audioKey("kitap"); });
  await page.waitForFunction(() => __played.length === 1);
  assert.match(await page.evaluate(() => __played[0].src), /^blob:/);
  assert.deepEqual(hits, [k + ".mp3"]);
  assert.ok(await page.evaluate(async key => !!(await (await caches.open("ty-audio")).match(audioPath(key))), k));
  // Again: from the phone, no request
  await page.evaluate(() => { speak("kitap"); });
  await page.waitForFunction(() => __played.length === 2);
  assert.equal(hits.length, 1);
  // The coming words of a practice are fetched ahead
  await page.evaluate(() => audioWarm(["defter", "kalem", "kitap", "yok"]));
  const kept = () => page.evaluate(async () => { const c = await caches.open("ty-audio"); return !!(await c.match(audioPath(audioKey("kalem")))) && !!(await c.match(audioPath(audioKey("defter")))); });
  for (let i = 0; i < 50 && !(await kept()); i++) await page.waitForTimeout(50);
  assert.ok(await kept());
  assert.equal(hits.length, 3);
  // Not kept and no internet: the device voice speaks
  const s = await page.evaluate(() => { AUDIO_SET.add(audioKey("Selam")); __audioFail = true; __tts = []; speak("Selam"); return audioKey("Selam"); });
  globalThis.__deny = s;
  await page.waitForFunction(() => __tts.length === 1);
  assert.deepEqual(await page.evaluate(() => __tts), ["Selam"]);
  assert.deepEqual(errors, []);
});
