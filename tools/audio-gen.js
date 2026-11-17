// Recorded audio for the site and the app (.github/workflows/audio.yml): Google Cloud Text-to-Speech, «Chirp 3: HD»
// voices — the official REST API with an API key. Free tier (Chirp 3: HD): about 1 000 000 characters a month; the
// whole site is ~100 000.
//   node tools/audio-gen.js   records audio/<k2>/<key>.mp3 for every text of tools/audio-texts.js that has no recording
//                             of the current voices yet (audio/google.txt lists "<key> <voice name>" of the ones that
//                             have: older files, or files of a voice changed in tools/audio-voice.json, are recorded
//                             again), removes files no text needs any more and rewrites audio/index.txt
// Secret: GOOGLE_TTS_API_KEY (a key of a Google Cloud project with the Text-to-Speech API and billing on; the key is
// restricted to that API). Without it nothing changes. Requests go WORKERS at a time, slowing down when Google asks
// (429); a run stops after AUDIO_MINUTES (40), "left=<n>" goes to $GITHUB_OUTPUT and the workflow starts the next run
// while texts remain.
// Voices: tools/audio-voice.json { "provider": "google", "a": { "name": … }, "b": { "name": … }, "rate": 0.9 }.
// Keys: audioKey() of js/ui.js (copied below; tests/audio.test.js checks both give the same key).
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DIR = path.join(ROOT, "audio");
const DONE = path.join(DIR, "google.txt");
const API = "https://texttospeech.googleapis.com/v1/text:synthesize";
const WORKERS = 3, sleep = ms => new Promise(r => setTimeout(r, ms));

const audioNorm = s => String(s).replace(/…/g, "").replace(/\s+/g, " ").trim();
function audioKey(text, v = "a") {
  const str = v + "|" + audioNorm(text);
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36).padStart(11, "0");
}
const fileOf = k => path.join(DIR, k.slice(0, 2), k + ".mp3");

// One request: the voice, Turkish, MP3 (mono, 24 kHz) at the learners' speed. If the voice takes no speed setting,
// it is sent once without it and never again in this run.
let NO_RATE = false;
function ttsBody(voice, text, rate) {
  const audioConfig = { audioEncoding: "MP3", sampleRateHertz: 24000 };
  if (!NO_RATE && rate && rate !== 1) audioConfig.speakingRate = rate;
  return { input: { text: audioNorm(text) }, voice: { languageCode: "tr-TR", name: voice }, audioConfig };
}
// What a refusal means, in plain words for the run's log
function why(status, msg) {
  if (/API key not valid|API_KEY_INVALID/i.test(msg)) return "kalit notoʻgʻri (GOOGLE_TTS_API_KEY ni tekshiring)";
  if (/billing/i.test(msg)) return "loyihada toʻlov hisobi (billing) yoqilmagan";
  if (/has not been used|is disabled|SERVICE_DISABLED/i.test(msg)) return "Cloud Text-to-Speech API yoqilmagan";
  if (/API_KEY_SERVICE_BLOCKED|blocked/i.test(msg)) return "kalit bu API uchun ruxsat etilmagan (API restrictions)";
  if (status === 400 && /voice/i.test(msg)) return "ovoz nomi notoʻgʻri (tools/audio-voice.json)";
  return "";
}
async function synth(key, voice, text, rate) {
  for (let i = 0; ; i++) {
    const r = await fetch(`${API}?key=${encodeURIComponent(key)}`, {
      method: "POST", headers: { "Content-Type": "application/json", "User-Agent": "turkce-yol-audio" }, body: JSON.stringify(ttsBody(voice, text, rate))
    });
    if (r.ok) {
      const b = Buffer.from((await r.json()).audioContent || "", "base64");
      if (b.length < 300) throw new Error("Google: boʻsh audio");
      return b;
    }
    const msg = (await r.text()).slice(0, 400);
    if (r.status === 400 && !NO_RATE && /speaking_?rate|speakingRate/i.test(msg)) { NO_RATE = true; console.log("Bu ovoz tezlikni qabul qilmaydi — tezliksiz yoziladi"); continue; }
    // Too many requests or a passing server error: wait and try again
    if ((r.status === 429 || r.status >= 500) && i < 6) { await sleep((+r.headers.get("retry-after") || 15 * (i + 1)) * 1000); continue; }
    const w = why(r.status, msg), err = new Error(`Google ${r.status}${w ? ` — ${w}` : ""}: ${msg.replace(/\s+/g, " ").slice(0, 240)}`);
    // The key, billing, the API or a voice name: nothing else can be recorded either. Otherwise only this text failed.
    err.status = r.status; err.fatal = r.status === 401 || r.status === 403 || (r.status === 400 && !!w); throw err;
  }
}
const readList = f => fs.existsSync(f) ? fs.readFileSync(f, "utf8").split("\n").filter(Boolean) : [];
async function full(key) {
  const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, "audio-voice.json"), "utf8"));
  const voiceOf = v => (cfg[v] && cfg[v].name) || cfg.a.name, rateOf = v => (cfg[v] && cfg[v].rate) || cfg.rate || 0.9;
  const list = await require("./audio-texts.js").collect();
  const want = new Map(list.map(([v, t]) => [audioKey(t, v), [v, t]]));
  // Recorded with the voice set now (a voice changed in the settings is recorded again)
  const done = new Map(readList(DONE).map(l => l.split(" ")).filter(([k, n]) => want.has(k) && n === voiceOf(want.get(k)[0])));
  // New texts first, then the older recordings
  const todo = [...want].filter(([k]) => !done.has(k)).sort(([a], [b]) => fs.existsSync(fileOf(a)) - fs.existsSync(fileOf(b)));
  const limit = +(process.env.AUDIO_MAX_CHARS || 400000), until = Date.now() + (+(process.env.AUDIO_MINUTES || 40)) * 60000;
  console.log(`${want.size} ta matn, hozirgi ovozda yozuvi yoʻq: ${todo.length} (${todo.reduce((a, [, x]) => a + x[1].length, 0)} belgi); ovozlar: a = ${voiceOf("a")}, b = ${voiceOf("b")}`);
  let made = 0, chars = 0, removed = 0, stop = "", next = 0, fails = 0;
  const worker = async () => {
    while (!stop && next < todo.length) {
      if (Date.now() > until) { stop = "vaqt"; break; }
      const [k, [v, t]] = todo[next++];
      if (chars + t.length > limit) { stop = "belgi chegarasi"; break; }
      chars += t.length;
      try {
        const mp3 = await synth(key, voiceOf(v), t, rateOf(v));
        fs.mkdirSync(path.dirname(fileOf(k)), { recursive: true });
        fs.writeFileSync(fileOf(k), mp3);
        done.set(k, voiceOf(v)); made++;
        if (made % 200 === 0) console.log(`… ${made}/${todo.length}`);
      } catch (e) {
        chars -= t.length;
        if (e.fatal) { stop = e.message; process.exitCode = 1; }
        else if (++fails > 20) stop = e.message;
        else console.log(`Oʻtkazib yuborildi: «${t.slice(0, 40)}» — ${e.message}`);
      }
    }
  };
  await Promise.all(Array.from({ length: WORKERS }, worker));
  // Files no text needs any more (text changed or removed)
  if (fs.existsSync(DIR)) for (const d of fs.readdirSync(DIR)) {
    const p = path.join(DIR, d);
    if (!fs.statSync(p).isDirectory()) continue;
    for (const f of fs.readdirSync(p)) if (f.endsWith(".mp3") && !want.has(f.slice(0, -4))) { fs.unlinkSync(path.join(p, f)); removed++; }
  }
  const have = [...want.keys()].filter(k => fs.existsSync(fileOf(k))).sort(), left = todo.length - made;
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(path.join(DIR, "index.txt"), have.join("\n") + "\n");
  fs.writeFileSync(DONE, [...done].sort(([a], [b]) => a.localeCompare(b)).map(([k, n]) => `${k} ${n}`).join("\n") + "\n");
  console.log(`Yozildi: ${made} (${chars} belgi), oʻchirildi: ${removed}, jami audio: ${have.length}/${want.size}, hozirgi ovozda: ${done.size}, qoldi: ${left}${stop ? ` (toʻxtadi: ${stop})` : ""}`);
  // The next run only when this one moved forward (a text that always fails does not start runs without end)
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `left=${process.exitCode || !made ? 0 : left}\n`);
}
async function main() {
  const key = (process.env.GOOGLE_TTS_API_KEY || "").trim();
  if (!key) { console.log("GOOGLE_TTS_API_KEY yoʻq — audio oʻzgarmadi"); return; }
  await full(key);
}
module.exports = { audioKey, audioNorm, fileOf, ttsBody, why };
if (require.main === module) main().catch(e => { console.error(e.message); process.exit(1); });
