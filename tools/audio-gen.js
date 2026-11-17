// Recorded audio for the site and the app (.github/workflows/audio.yml): Gemini TTS (Google AI Studio, free key).
//   node tools/audio-gen.js   records audio/<k2>/<key>.mp3: first every line of the stories and course dialogs in its
//                             character's own voice ("p:<speaker>" texts of tools/audio-texts.js), then — when
//                             "fill" is on — the texts that have no recording at all; removes files no text needs any
//                             more and rewrites audio/index.txt. audio/gemini.txt lists "<key> <voice>" of what Gemini
//                             recorded (a voice changed in tools/audio-voice.json is recorded again).
// The free tier allows a few requests a minute and a day, so requests carry many lines: a conversation of two speakers
// goes in one request (multiSpeakerVoiceConfig) — it also sounds like people talking — other lines in one request a
// voice; the audio is cut at its pauses (splitPcm) into one file a line. A cut that does not match the lines is
// tried again in halves, down to one line a request. When the day's quota is used up the run stops quietly and the
// daily schedule goes on the next day; a run also stops after AUDIO_MINUTES (40) and starts the next one.
// Secret: GEMINI_API_KEY. Voices: tools/audio-voice.json ({ a, b, cast: {speaker: voice}, female, male, models }).
// Keys: audioKey() of js/ui.js (copied below; tests/audio.test.js checks both give the same key). ffmpeg makes the MP3s.
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const DIR = path.join(ROOT, "audio");
const DONE = path.join(DIR, "gemini.txt");
const API = "https://generativelanguage.googleapis.com/v1beta";
const CHUNK = 8, CHUNK_CHARS = 700, FILL_N = 12, sleep = ms => new Promise(r => setTimeout(r, ms));
const P_ONE = "Say the following in Turkish, naturally and clearly, a little slowly, for people learning Turkish:";
const P_LIST = "Read the following Turkish lines aloud one by one, naturally and clearly, a little slowly, for people learning Turkish. Make a clear pause of about one and a half seconds after each line. Do not say anything else.";
const P_DLG = "Read this Turkish conversation naturally, like real people talking, a little slowly and clearly, for people learning Turkish. Make a clear pause of about one and a half seconds after each line.";

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

/* ---------- Voices: every character keeps one voice; two speakers of one conversation never share one ---------- */
const hashN = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
function genderOf(who, cast) { const g = cast && cast[who]; return g || (/Bey$/.test(who) ? "m" : /Hanım$/.test(who) ? "f" : hashN(who) % 2 ? "m" : "f"); }
function baseVoice(cfg, who, cast) {
  if (cfg.cast && cfg.cast[who]) return cfg.cast[who];
  const list = genderOf(who, cast) === "m" ? cfg.male : cfg.female;
  return list[hashN(who) % list.length];
}
function groupVoices(cfg, g) {
  const out = new Map(), used = new Set();
  for (const [who] of g.lines) {
    if (out.has(who)) continue;
    let v = baseVoice(cfg, who, g.cast);
    if (used.has(v)) { const list = cfg.female.includes(v) ? cfg.female : cfg.male; v = list.find(x => !used.has(x)) || v; }
    out.set(who, v); used.add(v);
  }
  return out;
}
// A speaker's name as a label Gemini accepts in a conversation
const label = who => who === "_" ? "Anlatici" : (who.normalize("NFD").replace(/[^A-Za-z]/g, "") || "Kisi");

/* ---------- Requests ---------- */
function gBody(text, voices) {
  const pv = name => ({ prebuiltVoiceConfig: { voiceName: name } });
  const speechConfig = typeof voices === "string" ? { voiceConfig: pv(voices) }
    : { multiSpeakerVoiceConfig: { speakerVoiceConfigs: voices.map(([spk, v]) => ({ speaker: spk, voiceConfig: pv(v) })) } };
  return { contents: [{ parts: [{ text }] }], generationConfig: { responseModalities: ["AUDIO"], speechConfig } };
}
class Stop extends Error {}
async function listModels(key, pref) {
  const r = await fetch(`${API}/models?pageSize=200&key=${encodeURIComponent(key)}`);
  const t = await r.text();
  if (!r.ok) throw new Stop(`Gemini ${r.status}${/API key not valid|API_KEY_INVALID/.test(t) ? " — kalit notoʻgʻri (GEMINI_API_KEY)" : ""}: ${t.replace(/\s+/g, " ").slice(0, 240)}`);
  const ver = n => +((n.match(/(\d+(?:\.\d+)?)/) || [0, 0])[1]);
  const all = (JSON.parse(t).models || []).filter(m => /tts/i.test(m.name) && (m.supportedGenerationMethods || []).includes("generateContent")).map(m => m.name.replace(/^models\//, ""));
  return pref.filter(m => all.includes(m)).concat(all.filter(m => !pref.includes(m)).sort((a, b) => (/flash/.test(b) - /flash/.test(a)) || ver(b) - ver(a)));
}
// One request → raw PCM (16-bit mono) and its rate. A model without (more) free quota today is dropped; none left → Stop.
async function gen(key, models, body) {
  for (;;) {
    const model = models[0];
    if (!model) throw new Stop("bugungi bepul limit tugadi — ertaga davom etadi");
    for (let i = 0; ; i++) {
      const r = await fetch(`${API}/models/${model}:generateContent?key=${encodeURIComponent(key)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (r.ok) {
        const part = (((((await r.json()).candidates || [])[0] || {}).content || {}).parts || []).find(p => p.inlineData);
        if (!part) throw new Error("javobda audio yoʻq");
        return { pcm: Buffer.from(part.inlineData.data, "base64"), rate: +((part.inlineData.mimeType || "").match(/rate=(\d+)/) || [0, 24000])[1], model };
      }
      const t = await r.text();
      if (r.status === 429 && /PerDay|limit: 0/i.test(t)) { console.log(`${model}: bugungi limit tugadi`); models.shift(); break; }
      if ((r.status === 429 || r.status >= 500) && i < 4) { await sleep(((+(t.match(/"retryDelay":\s*"(\d+)/) || [0, 20])[1]) + 2) * 1000); continue; }
      if (r.status === 404) { models.shift(); break; }
      if (r.status === 400 && /API key not valid|API_KEY_INVALID/.test(t)) throw new Stop("kalit notoʻgʻri (GEMINI_API_KEY)");
      if (r.status === 403) throw new Stop(`ruxsat yoʻq: ${t.replace(/\s+/g, " ").slice(0, 200)}`);
      throw new Error(`${model} ${r.status}: ${t.replace(/\s+/g, " ").slice(0, 200)}`);
    }
  }
}

/* ---------- Cutting the audio at its pauses ---------- */
const FRAME = 0.02;
function rmsFrames(pcm, rate) {
  const n = Math.floor(rate * FRAME), out = [];
  for (let i = 0; i + n * 2 <= pcm.length; i += n * 2) { let s = 0; for (let j = 0; j < n; j++) { const x = pcm.readInt16LE(i + j * 2); s += x * x; } out.push(Math.sqrt(s / n)); }
  return out;
}
// Expected length of a line: a moment plus the letters (Gemini reads a little slowly); far from it — the cut went wrong
const expLen = chars => 0.35 + 0.085 * chars;
const okLen = (sec, chars) => sec >= 0.6 * expLen(chars) && sec <= 2.4 * expLen(chars);
/* n pieces of speech, or null when they cannot be found for sure (lens — the letters of each line). Line breaks are
   found by both cues at once: the pauses, and where each line should end by its length (a line of two sentences has a
   pause inside, which alone looks like a break). Among the pauses, the cut points are chosen together (dynamic
   programming) so that every piece is close to its share of the speech by its letters and sits on a pause as long as
   possible; then every piece must match its share and its expected length. */
function splitPcm(pcm, rate, n, lens, why) {
  const f = rmsFrames(pcm, rate), bytes = Math.floor(rate * FRAME) * 2, fail = m => { if (why) why.push(m); return null; };
  if (!f.length) return fail("boʻsh");
  const sorted = f.slice().sort((a, b) => a - b), floor = sorted[Math.floor(sorted.length * 0.1)], peak = sorted[Math.floor(sorted.length * 0.95)];
  const thr = Math.max(150, floor + 0.1 * (peak - floor)), loud = f.map(x => x >= thr);
  const first = loud.indexOf(true), last = loud.lastIndexOf(true);
  if (first < 0) return fail("ovoz yoʻq");
  const span = last + 1 - first, w = lens.map(c => c + 5), W = w.reduce((a, b) => a + b, 0);
  let cuts = [];
  if (n > 1) {
    const cand = [];
    for (let i = first; i <= last; i++) if (!loud[i]) { let j = i; while (j <= last && !loud[j]) j++; if (j - i >= 8) cand.push({ pos: i + Math.floor((j - i) / 2), len: j - i }); i = j; }
    if (cand.length < n - 1) return fail(`pauza kam: ${cand.length}/${n - 1}`);
    const target = [], C = cand.length;
    for (let k = 0, acc = 0; k < n - 1; k++) { acc += w[k]; target.push(first + span * acc / W); }
    const cost = (k, c) => 60 * ((cand[c].pos - target[k]) / span) ** 2 - Math.min(cand[c].len, 75) / 75;
    const dp = [], from = [];
    for (let k = 0; k < n - 1; k++) {
      dp.push(new Array(C).fill(Infinity)); from.push(new Array(C).fill(-1));
      let best = Infinity, arg = -1;
      for (let c = 0; c < C; c++) {
        if (k === 0) dp[k][c] = cost(k, c);
        else { if (c > 0 && dp[k - 1][c - 1] < best) { best = dp[k - 1][c - 1]; arg = c - 1; } if (arg >= 0) { dp[k][c] = best + cost(k, c); from[k][c] = arg; } }
      }
    }
    let end = -1, bestEnd = Infinity;
    dp[n - 2].forEach((v, c) => { if (v < bestEnd) { bestEnd = v; end = c; } });
    if (end < 0) return fail("kesish topilmadi");
    for (let k = n - 2, c = end; k >= 0; c = from[k][c], k--) cuts.unshift(cand[c].pos);
  }
  const bounds = [first].concat(cuts, [last + 1]), pad = 6, out = [];
  for (let k = 0; k < n; k++) {
    let a = bounds[k], b = bounds[k + 1];
    while (a < b && !loud[a]) a++;
    while (b > a && !loud[b - 1]) b--;
    if (b <= a) return fail(`${k + 1}-gap boʻsh`);
    const sec = (b - a) * FRAME, share = span * FRAME * w[k] / W;
    if (n > 1 && (sec < 0.5 * share || sec > 1.9 * share)) return fail(`${k + 1}-gap ulushi: ${sec.toFixed(1)} s, kutilgan ${share.toFixed(1)} s`);
    if (!okLen(sec + 0.1, lens[k])) return fail(`${k + 1}-gap uzunligi: ${sec.toFixed(1)} s, kutilgan ${expLen(lens[k]).toFixed(1)} s`);
    out.push(pcm.subarray(Math.max(0, a - pad) * bytes, Math.min(f.length, b + pad) * bytes));
  }
  return out;
}
// Length of one of our MP3s from its size (48 kbit/s)
const mp3Sec = file => fs.statSync(file).size / 6000;
function mp3(pcm, rate) {
  const r = spawnSync("ffmpeg", ["-loglevel", "error", "-f", "s16le", "-ar", String(rate), "-ac", "1", "-i", "pipe:0", "-ar", "24000", "-ac", "1", "-c:a", "libmp3lame", "-b:a", "48k", "-f", "mp3", "pipe:1"], { input: pcm, maxBuffer: 64e6 });
  if (r.status !== 0 || !r.stdout || r.stdout.length < 300) throw new Error("ffmpeg: " + String(r.stderr || r.error || "").slice(0, 200));
  return r.stdout;
}

/* ---------- The work ---------- */
const readList = f => fs.existsSync(f) ? fs.readFileSync(f, "utf8").split("\n").filter(Boolean) : [];
function chunks(items, size, chars) {
  const out = []; let cur = [], n = 0;
  for (const it of items) { if (cur.length && (cur.length >= size || n + it.text.length > chars)) { out.push(cur); cur = []; n = 0; } cur.push(it); n += it.text.length; }
  if (cur.length) out.push(cur);
  return out;
}
// A job: lines of one voice, or a conversation of two speakers
function jobsOf(lines, voices) {
  const who = [...new Set(lines.map(l => l.who))];
  if (who.length <= 2 && who.length > 1) return [{ lines, multi: who.map(w => [label(w), voices.get(w)]) }];
  return who.map(w => ({ lines: lines.filter(l => l.who === w), voice: voices.get(w) }));
}
function plan(cfg, list, done) {
  const want = new Map(list.map(([v, t]) => [audioKey(t, v), [v, t]])), expect = new Map(), jobs = [];
  const fresh = (k, chars) => !(done.get(k) === expect.get(k) && fs.existsSync(fileOf(k)) && (chars === undefined || okLen(mp3Sec(fileOf(k)), chars)));
  // Characters: every story and dialog, in order (stories first)
  for (const g of list.groups || []) {
    const voices = groupVoices(cfg, g), need = [];
    for (const [who, text] of g.lines) {
      const key = audioKey(text, "p:" + who);
      if (!want.has(key) || expect.has(key)) continue;
      expect.set(key, voices.get(who));
      if (fresh(key, text.length)) need.push({ key, who, text });
    }
    for (const c of chunks(need, CHUNK, CHUNK_CHARS)) jobs.push(...jobsOf(c, voices));
  }
  // Texts without any recording yet (new words and sentences): in the plain voices
  if (cfg.fill) for (const v of ["a", "b"]) {
    const need = [];
    for (const [k, [vv, text]] of want) if (vv === v && !fs.existsSync(fileOf(k))) { expect.set(k, cfg[v]); need.push({ key: k, who: v, text }); }
    const long = need.filter(x => x.text.length > 250), short = need.filter(x => x.text.length <= 250);
    for (const c of chunks(short, FILL_N, 400).concat(long.map(x => [x]))) jobs.push({ lines: c, voice: cfg[v] });
  }
  return { want, expect, jobs };
}
async function run(key) {
  const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, "audio-voice.json"), "utf8"));
  const list = await require("./audio-texts.js").collect();
  const done = new Map(readList(DONE).map(l => l.split(" ")));
  const { want, expect, jobs } = plan(cfg, list, done);
  const models = await listModels(key, cfg.models || []);
  console.log(`TTS modellari: ${models.join(", ") || "yoʻq"}`);
  console.log(`${want.size} ta matn; yoziladigan: ${jobs.reduce((a, j) => a + j.lines.length, 0)} gap, ${jobs.length} ta soʻrov`);
  const until = Date.now() + (+(process.env.AUDIO_MINUTES || 40)) * 60000, gap = +(process.env.AUDIO_GAP_MS || 21000);
  let made = 0, reqs = 0, stop = "", fails = 0, skipped = 0, dbg = 0;
  const DEBUG = process.env.AUDIO_DEBUG_DIR || "";
  while (jobs.length) {
    if (Date.now() > until) { stop = "vaqt"; break; }
    const job = jobs.shift(), n = job.lines.length, t0 = Date.now();
    const text = job.multi ? `${P_DLG}\n\n${job.lines.map(l => `${label(l.who)}: ${l.text}`).join("\n")}` : n === 1 ? `${P_ONE}\n${job.lines[0].text}` : `${P_LIST}\n\n${job.lines.map(l => l.text).join("\n")}`;
    try {
      const r = await gen(key, models, gBody(text, job.multi || job.voice)); reqs++;
      const why = [], parts = splitPcm(r.pcm, r.rate, n, job.lines.map(l => l.text.length), why);
      if (!parts) {
        console.log(`Boʻlinmadi (${n} gap, ${r.model}): ${why.join("; ")} — «${job.lines[0].text.slice(0, 40)}»`);
        if (DEBUG && dbg < 12) { fs.mkdirSync(DEBUG, { recursive: true }); fs.writeFileSync(path.join(DEBUG, `${++dbg}.pcm`), r.pcm); fs.appendFileSync(path.join(DEBUG, "index.txt"), `${dbg}.pcm ${r.rate} ${n} ${why.join("; ")} | ${job.lines.map(l => l.text).join(" | ")}\n`); }
        // The pauses did not match the lines: halves, down to one line a request; a single line that fails twice is left
        if (n > 1) { const h = Math.ceil(n / 2), voices = new Map(job.multi ? job.lines.map(l => [l.who, job.multi.find(m => m[0] === label(l.who))[1]]) : job.lines.map(l => [l.who, job.voice])); jobs.unshift(...jobsOf(job.lines.slice(h), voices)); jobs.unshift(...jobsOf(job.lines.slice(0, h), voices)); }
        else if (!job.again) jobs.unshift(Object.assign({}, job, { again: 1 }));
        else { skipped++; console.log(`Oʻtkazib yuborildi: «${job.lines[0].text.slice(0, 50)}»`); }
      } else {
        parts.forEach((p, i) => { const l = job.lines[i]; fs.mkdirSync(path.dirname(fileOf(l.key)), { recursive: true }); fs.writeFileSync(fileOf(l.key), mp3(p, r.rate)); done.set(l.key, expect.get(l.key)); made++; });
        if (made && made % 50 < n) console.log(`… ${made} ta gap, ${reqs} ta soʻrov`);
      }
    } catch (e) {
      if (e instanceof Stop) { stop = e.message; if (!/limit/.test(e.message)) process.exitCode = 1; break; }
      if (++fails > 10) { stop = e.message; break; }
      console.log(`Xato (${fails}): ${e.message}`);
    }
    await sleep(Math.max(0, gap - (Date.now() - t0)));
  }
  // Files no text needs any more (text changed or removed)
  let removed = 0;
  if (fs.existsSync(DIR)) for (const d of fs.readdirSync(DIR)) {
    const p = path.join(DIR, d);
    if (!fs.statSync(p).isDirectory()) continue;
    for (const f of fs.readdirSync(p)) if (f.endsWith(".mp3") && !want.has(f.slice(0, -4))) { fs.unlinkSync(path.join(p, f)); removed++; }
  }
  const have = [...want.keys()].filter(k => fs.existsSync(fileOf(k))).sort(), left = jobs.reduce((a, j) => a + j.lines.length, 0);
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(path.join(DIR, "index.txt"), have.join("\n") + "\n");
  fs.writeFileSync(DONE, [...done].filter(([k]) => want.has(k)).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k} ${v}`).join("\n") + "\n");
  console.log(`Yozildi: ${made} ta gap (${reqs} ta soʻrov), oʻtkazildi: ${skipped}, oʻchirildi: ${removed}, jami audio: ${have.length}/${want.size}, qoldi: ${left}${stop ? ` (toʻxtadi: ${stop})` : ""}`);
  // The next run today only when this one stopped for time and moved forward; the day's quota waits for tomorrow
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `left=${stop === "vaqt" && made ? left : 0}\n`);
}
async function main() {
  const key = (process.env.GEMINI_API_KEY || "").trim();
  if (!key) { console.log("GEMINI_API_KEY yoʻq — audio oʻzgarmadi"); return; }
  await run(key);
}
module.exports = { audioKey, audioNorm, fileOf, gBody, splitPcm, okLen, expLen, groupVoices, label, plan, jobsOf };
if (require.main === module) main().catch(e => { console.error(e.message); process.exit(1); });
