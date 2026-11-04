// Recorded audio for the site with Google Cloud Text-to-Speech (.github/workflows/audio.yml).
//   node tools/audio-gen.js --samples   every tr-TR voice reads the same words/sentences → ./samples (to choose a voice)
//   node tools/audio-gen.js             writes the missing audio/<k2>/<key>.mp3 for tools/audio-texts.js, removes
//                                       files no text needs any more, and rewrites audio/index.txt
// Needs GOOGLE_TTS_KEY (service account JSON of a Google Cloud project with the Text-to-Speech API and billing).
// Voices come from tools/audio-voice.json: { "a": { "name": … }, "b": { "name": … }, "rate": 0.9 }.
// Keys: audioKey() in app.js (copied below; tests/audio.test.js checks both give the same key).
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const DIR = path.join(ROOT, "audio");
const API = "https://texttospeech.googleapis.com/v1";

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

const b64 = s => Buffer.from(s).toString("base64url");
async function accessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const body = b64(JSON.stringify({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/cloud-platform", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const sig = crypto.createSign("RSA-SHA256").update(`${head}.${body}`).sign(sa.private_key).toString("base64url");
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${head}.${body}.${sig}` });
  const j = await r.json();
  if (!j.access_token) throw new Error("token: " + JSON.stringify(j));
  return j.access_token;
}
async function gapi(tok, sa, method, url, body) {
  for (let t = 0; t < 5; t++) {
    const r = await fetch(API + url, { method, headers: { Authorization: "Bearer " + tok, "Content-Type": "application/json", "x-goog-user-project": sa.project_id }, body: body ? JSON.stringify(body) : undefined });
    const j = await r.json().catch(() => ({}));
    if (r.ok) return j;
    if (r.status === 429 || r.status >= 500) { await new Promise(res => setTimeout(res, 2000 * (t + 1))); continue; }
    throw new Error(`${url}: ${r.status} ${JSON.stringify(j.error || j).slice(0, 400)}`);
  }
  throw new Error(url + ": too many retries");
}
// One MP3 (mono, 24 kHz). Chirp voices take no speakingRate/pitch in some regions: retried without them.
async function synth(tok, sa, voice, text, rate) {
  const req = { input: { text }, voice: { languageCode: "tr-TR", name: voice }, audioConfig: { audioEncoding: "MP3", sampleRateHertz: 24000, speakingRate: rate } };
  try { return Buffer.from((await gapi(tok, sa, "POST", "/text:synthesize", req)).audioContent, "base64"); }
  catch (e) { if (!/speaking|rate|INVALID_ARGUMENT/i.test(e.message)) throw e; delete req.audioConfig.speakingRate; return Buffer.from((await gapi(tok, sa, "POST", "/text:synthesize", req)).audioContent, "base64"); }
}
const SAMPLE_TEXTS = [
  ["w1", "Merhaba"], ["w2", "Teşekkür ederim"], ["w3", "öğretmen"], ["w4", "ağaç"], ["w5", "ışık"], ["w6", "çiçek"], ["w7", "güzel"], ["w8", "Nasılsın?"],
  ["s1", "Benim adım Ali. Ben bir öğretmenim."], ["s2", "Bugün hava çok güzel, parka gidelim mi?"],
  ["s3", "Dün akşam arkadaşlarımla lokantada yemek yedik."], ["s4", "Türkçe öğrenmek sandığınız kadar zor değil."]
];
async function samples(sa, tok) {
  const out = path.join(ROOT, "samples");
  fs.mkdirSync(out, { recursive: true });
  const { voices } = await gapi(tok, sa, "GET", "/voices?languageCode=tr-TR");
  const tr = voices.filter(v => v.languageCodes.includes("tr-TR")).sort((a, b) => a.name.localeCompare(b.name));
  console.log(tr.length + " ta tr-TR ovoz:\n" + tr.map(v => `${v.name}\t${v.ssmlGender}`).join("\n"));
  const index = [];
  let chars = 0;
  for (const v of tr) {
    try {
      for (const [k, t] of SAMPLE_TEXTS) { fs.writeFileSync(path.join(out, `${v.name}-${k}.mp3`), await synth(tok, sa, v.name, t, 0.9)); chars += t.length; }
      index.push({ name: v.name, gender: v.ssmlGender });
    } catch (e) { console.log(v.name, "o'tkazildi:", e.message.slice(0, 200)); }
  }
  fs.writeFileSync(path.join(out, "index.json"), JSON.stringify({ voices: index, texts: SAMPLE_TEXTS }, null, 1));
  console.log(`${index.length} ta ovoz, ${chars} belgi`);
}
async function full(sa, tok) {
  const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, "audio-voice.json"), "utf8"));
  if (!cfg.a || !cfg.a.name) { console.log("tools/audio-voice.json da ovoz tanlanmagan — avval namunalar (--samples)"); return; }
  const list = await require("./audio-texts.js").collect();
  const want = new Map(list.map(([v, t]) => [audioKey(t, v), [v, t]]));
  let made = 0, chars = 0, removed = 0;
  const todo = [...want].filter(([k]) => !fs.existsSync(fileOf(k)));
  const limit = +(process.env.AUDIO_MAX_CHARS || 400000);
  console.log(`${want.size} ta matn, ${todo.length} tasi yangi, ${todo.reduce((a, [, x]) => a + x[1].length, 0)} belgi`);
  let i = 0;
  const worker = async () => {
    while (i < todo.length) {
      const [k, [v, t]] = todo[i++];
      if (chars + t.length > limit) continue;
      const voice = (cfg[v] && cfg[v].name) || cfg.a.name;
      const mp3 = await synth(tok, sa, voice, t, (cfg[v] && cfg[v].rate) || cfg.rate || 0.9);
      fs.mkdirSync(path.dirname(fileOf(k)), { recursive: true });
      fs.writeFileSync(fileOf(k), mp3);
      made++; chars += t.length;
      if (made % 250 === 0) console.log(`… ${made}/${todo.length}`);
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  // Files no text needs any more (text changed or removed)
  if (fs.existsSync(DIR)) for (const d of fs.readdirSync(DIR)) {
    const p = path.join(DIR, d);
    if (!fs.statSync(p).isDirectory()) continue;
    for (const f of fs.readdirSync(p)) if (f.endsWith(".mp3") && !want.has(f.slice(0, -4))) { fs.unlinkSync(path.join(p, f)); removed++; }
  }
  const have = [...want.keys()].filter(k => fs.existsSync(fileOf(k))).sort();
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(path.join(DIR, "index.txt"), have.join("\n") + "\n");
  console.log(`Yaratildi: ${made} (${chars} belgi), o'chirildi: ${removed}, jami audio: ${have.length}/${want.size}`);
}
async function main() {
  const sa = JSON.parse(process.env.GOOGLE_TTS_KEY || "null");
  if (!sa) { console.log("GOOGLE_TTS_KEY yo'q — o'tkazib yuborildi"); return; }
  const tok = await accessToken(sa);
  if (process.argv.includes("--samples")) await samples(sa, tok); else await full(sa, tok);
}
module.exports = { audioKey, audioNorm, fileOf };
if (require.main === module) main().catch(e => { console.error(e.message); process.exit(1); });
