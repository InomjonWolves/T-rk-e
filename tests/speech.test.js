// Faster listening and speaking: a right repeat ends the microphone at once (no wait for the browser's silence timeout),
// the last words heard count when listening ends without a final result, a free answer is not cut short; a word played
// in the first moments after opening waits for the list of recordings instead of falling back to the device voice.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { launch, openApp } = require("./helpers");
const gen = require("../tools/audio-gen.js");

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

// A recognizer that hears window.__say(): words at once (not final); the final result only after 4 s — or, with
// __partialOnly, an end without any final result
const slowSR = () => {
  window.__srLog = [];
  delete window.webkitSpeechRecognition;
  window.SpeechRecognition = class {
    start() {
      const me = this, t = window.__say ? window.__say() : "";
      __srLog.push("start");
      setTimeout(() => me.onresult && me.onresult({ resultIndex: 0, results: [Object.assign([{ transcript: t }], { isFinal: false })] }), 30);
      me._t = setTimeout(() => { if (!window.__partialOnly && me.onresult) me.onresult({ results: [Object.assign([{ transcript: t }], { isFinal: true })] }); if (me.onend) me.onend(); }, window.__partialOnly ? 300 : 4000);
    }
    stop() { __srLog.push("stop"); }
    abort() { __srLog.push("abort"); clearTimeout(this._t); if (this.onend) this.onend(); }
  };
};

test("speech: a right repeat ends listening at once; words heard count without a final result; free answers are not cut", async () => {
  const { page, errors } = await openApp(browser, "#home", { init: slowSR });
  const cap = (q, say, partial) => page.evaluate(([q, say, partial]) => new Promise(res => {
    window.__say = () => say; window.__partialOnly = partial; __srLog = [];
    const b = document.createElement("button"), t0 = Date.now();
    micCapture(q, b, best => res({ best, ms: Date.now() - t0, log: __srLog.slice(), on: b.classList.contains("on") }));
  }), [q, say, partial]);
  const fast = await cap({ kind: "say", tr: "Merhaba" }, "merhaba", false);
  assert.equal(fast.best.score, 1);
  assert.ok(fast.ms < 1500, `${fast.ms} ms`);
  assert.deepEqual(fast.log, ["start", "abort"]);
  assert.equal(fast.on, false);
  // Not right yet: listening goes on; the words heard so far count when it ends without a final result
  const part = await cap({ kind: "say", tr: "Merhaba" }, "merha", true);
  assert.ok(part.best.score < 0.95 && part.best.text === "merha", JSON.stringify(part));
  assert.deepEqual(part.log, ["start"]);
  // A free answer: not stopped early even when the key words are there
  const oral = await cap({ kind: "oral", tr: "Yarım saat koştu." }, "yarım saat koştum", true);
  assert.equal(oral.best.score, 1); assert.deepEqual(oral.log, ["start"]);
  // The pronunciation practice: a right word is accepted at once
  await page.evaluate(() => startSession("say", "pron"));
  await page.waitForSelector("#mic-btn");
  await page.evaluate(() => { window.__partialOnly = false; window.__say = () => SES.items[SES.i].tr; __srLog = []; window.__t0 = Date.now(); });
  await page.click("#mic-btn");
  await page.waitForFunction(() => SES.answered);
  const r = await page.evaluate(() => ({ ms: Date.now() - __t0, log: __srLog, rec: REC, ok: document.getElementById("fb").className }));
  assert.ok(r.ms < 1500, `${r.ms} ms`);
  assert.deepEqual([r.log, r.rec, r.ok], [["start", "abort"], null, "feedback ok"]);
  assert.deepEqual(errors, []);
});

test("audio: a word played before the list of recordings came waits for it and plays the recording", async () => {
  const key = gen.audioKey("kitap");
  const init = { content: `(() => {
    const f = window.fetch;
    window.fetch = (u, o) => /index\\.txt$/.test(String(u)) ? new Promise(r => setTimeout(() => r(new Response("${key}\\n")), 1500)) : f(u, o);
    window.__played = []; window.__tts = [];
    window.Audio = class { constructor() { this.src = ""; } play() { if (!this.src.startsWith("data:")) __played.push(this.src); setTimeout(() => this.onended && this.onended(), 5); return Promise.resolve(); } pause() {} };
    window.speechSynthesis.speak = u => __tts.push(u.text);
  })();` };
  const { page, errors } = await openApp(browser, "#home", { init });
  const now = await page.evaluate(() => { speak("kitap"); return [!!AUDIO_SET, __played.length, __tts.length]; });
  assert.deepEqual(now, [false, 0, 0], "nothing yet: no device voice while the list is on its way");
  await page.waitForFunction(() => __played.length === 1, null, { timeout: 4000 });
  assert.ok(await page.evaluate(k => __played[0].endsWith(`${k}.mp3`) && !__tts.length, key));
  // Stopped while waiting: nothing plays later
  await page.evaluate(() => { AUDIO_SET = null; AUDIO_WAITED = false; AUDIO_P = null; __played = []; speak("kitap"); ttsCancel(); });
  await page.waitForTimeout(1800);
  assert.deepEqual(await page.evaluate(() => [__played.length, __tts.length]), [0, 0]);
  assert.deepEqual(errors, []);
});
