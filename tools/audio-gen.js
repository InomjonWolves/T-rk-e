// Recorded audio for the site and the app (.github/workflows/audio.yml): Azure AI Speech — the official
// text-to-speech REST API with a key. Free tier (F0): 500 000 characters a month; the whole site is ~100 000.
//   node tools/audio-gen.js   records audio/<k2>/<key>.mp3 for every text of tools/audio-texts.js that has no Azure
//                             recording yet (audio/azure.txt lists the ones that have: older files made another way are
//                             recorded again), removes files no text needs any more and rewrites audio/index.txt
// Secrets: AZURE_SPEECH_KEY and AZURE_SPEECH_REGION (the region of the Speech resource, e.g. westeurope).
// Without them nothing changes. The free tier answers 20 requests a minute: one request every 3.1 s, and a run stops
// after AUDIO_MINUTES (40); "left=<n>" goes to $GITHUB_OUTPUT and the workflow starts the next run while texts remain.
// Voices: tools/audio-voice.json { "provider": "azure", "a": { "name": … }, "b": { "name": … }, "rate": 0.9 }.
// Format: 24 kHz, 48 kbit/s mono MP3 (~15 KB a word). Keys: audioKey() of js/ui.js (copied below; tests/audio.test.js
// checks both give the same key).
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DIR = path.join(ROOT, "audio");
const FORMAT = "audio-24khz-48kbitrate-mono-mp3";
const GAP_MS = 3100, sleep = ms => new Promise(r => setTimeout(r, ms));

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

const xml = s => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]));
// SSML: the voice and its speed (0.9 → -10%)
function ssml(voice, text, rate) {
  const pct = Math.round((rate - 1) * 100);
  return `<speak version="1.0" xml:lang="tr-TR"><voice name="${voice}"><prosody rate="${pct < 0 ? "" : "+"}${pct}%">${xml(text)}</prosody></voice></speak>`;
}
async function synth(key, region, voice, text, rate) {
  for (let i = 0; ; i++) {
    const r = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: "POST",
      headers: { "Ocp-Apim-Subscription-Key": key, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": FORMAT, "User-Agent": "turkce-yol-audio" },
      body: ssml(voice, text, rate)
    });
    if (r.ok) { const b = Buffer.from(await r.arrayBuffer()); if (b.length < 500) throw new Error("Azure: bo'sh audio"); return b; }
    // Too many requests or a passing server error: wait and try again
    if ((r.status === 429 || r.status >= 500) && i < 5) { await sleep((+r.headers.get("retry-after") || 20 * (i + 1)) * 1000); continue; }
    const err = new Error(`Azure ${r.status}: ${(await r.text()).slice(0, 200)}`); err.status = r.status; throw err;
  }
}
const readList = f => fs.existsSync(f) ? fs.readFileSync(f, "utf8").split("\n").filter(Boolean) : [];
async function full(key, region) {
  const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, "audio-voice.json"), "utf8"));
  const list = await require("./audio-texts.js").collect();
  const want = new Map(list.map(([v, t]) => [audioKey(t, v), [v, t]]));
  const azure = new Set(readList(path.join(DIR, "azure.txt")).filter(k => want.has(k)));
  // New texts first, then the older recordings
  const todo = [...want].filter(([k]) => !azure.has(k)).sort(([a], [b]) => fs.existsSync(fileOf(a)) - fs.existsSync(fileOf(b)));
  const limit = +(process.env.AUDIO_MAX_CHARS || 400000), until = Date.now() + (+(process.env.AUDIO_MINUTES || 40)) * 60000;
  console.log(`${want.size} ta matn, Azure yozuvi yoʻq: ${todo.length} (${todo.reduce((a, [, x]) => a + x[1].length, 0)} belgi)`);
  let made = 0, chars = 0, removed = 0, stop = "";
  try {
    for (const [k, [v, t]] of todo) {
      if (Date.now() > until) { stop = "vaqt"; break; }
      if (chars + t.length > limit) { stop = "belgi chegarasi"; break; }
      const t0 = Date.now(), voice = (cfg[v] && cfg[v].name) || cfg.a.name;
      const mp3 = await synth(key, region, voice, t, (cfg[v] && cfg[v].rate) || cfg.rate || 0.9);
      fs.mkdirSync(path.dirname(fileOf(k)), { recursive: true });
      fs.writeFileSync(fileOf(k), mp3);
      azure.add(k); made++; chars += t.length;
      if (made % 100 === 0) console.log(`… ${made}/${todo.length}`);
      await sleep(Math.max(0, GAP_MS - (Date.now() - t0)));
    }
  } catch (e) { stop = e.message; if (e.status === 401 || e.status === 403) process.exitCode = 1; }
  // Files no text needs any more (text changed or removed)
  if (fs.existsSync(DIR)) for (const d of fs.readdirSync(DIR)) {
    const p = path.join(DIR, d);
    if (!fs.statSync(p).isDirectory()) continue;
    for (const f of fs.readdirSync(p)) if (f.endsWith(".mp3") && !want.has(f.slice(0, -4))) { fs.unlinkSync(path.join(p, f)); removed++; }
  }
  const have = [...want.keys()].filter(k => fs.existsSync(fileOf(k))).sort(), left = todo.length - made;
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(path.join(DIR, "index.txt"), have.join("\n") + "\n");
  fs.writeFileSync(path.join(DIR, "azure.txt"), [...azure].sort().join("\n") + "\n");
  console.log(`Yozildi: ${made} (${chars} belgi), oʻchirildi: ${removed}, jami audio: ${have.length}/${want.size}, Azure: ${azure.size}, qoldi: ${left}${stop ? ` (toʻxtadi: ${stop})` : ""}`);
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `left=${process.exitCode ? 0 : left}\n`);
}
async function main() {
  const key = process.env.AZURE_SPEECH_KEY, region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) { console.log("AZURE_SPEECH_KEY yoki AZURE_SPEECH_REGION yoʻq — audio oʻzgarmadi"); return; }
  await full(key, region.trim().toLowerCase());
}
module.exports = { audioKey, audioNorm, fileOf, ssml };
if (require.main === module) main().catch(e => { console.error(e.message); process.exit(1); });
