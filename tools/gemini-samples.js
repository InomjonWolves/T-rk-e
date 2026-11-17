// Voice samples with Gemini TTS (.github/workflows/voice-samples.yml), to compare with the site's current recordings
// before any change: the same five sentences in each voice of VOICES (one request a voice) and one short dialog of the
// story «kahvalti» with two speakers in one request, for each pair of PAIRS.
//   node tools/gemini-samples.js <out dir>   writes <voice>-gaplar.wav, dialog-<f>-<m>.wav and index.json
// Secret: GEMINI_API_KEY (a free Google AI Studio key: no billing needed). The free tier allows a few requests a
// minute and a day: requests go one by one, GAP_MS apart, and a model without free quota is skipped for the next one.
const fs = require("fs");
const path = require("path");

const API = "https://generativelanguage.googleapis.com/v1beta";
const GAP_MS = 25000, sleep = ms => new Promise(r => setTimeout(r, ms));
const VOICES = ["Kore", "Leda", "Charon", "Puck"];
const PAIRS = [["Leda", "Puck"], ["Kore", "Charon"]];
const SENTENCES = [
  "Pazar sabahı. Defne mutfakta kahvaltı hazırlıyor.",
  "Dilnoza ve Kerem bugün plaja gitmek istiyordu. Ama sabahtan beri yağmur yağıyor.",
  "Yazık! Peki, evde mi kalalım?",
  "İyi fikir! Ben o müzeye hiç gitmedim.",
  "Bu heykel kaç yaşında?"
];
const DIALOG = [
  ["Defne", "Kerem, kalk! Kahvaltı hazır!"],
  ["Kerem", "Günaydın! Saat kaç?"],
  ["Defne", "Saat dokuz. Çay da hazır."],
  ["Kerem", "Harika! Masada ne var?"],
  ["Defne", "Peynir, zeytin, domates ve sıcak simit var."],
  ["Kerem", "Afiyet olsun, Pamuk!"]
];
const STYLE = "Read aloud in Turkish, a little slowly and very clearly, in a warm and natural voice for people learning Turkish. Leave a short pause between sentences:";
const DSTYLE = "TTS the following conversation between Defne and Kerem in Turkish. Speak naturally, a little slowly and clearly, for people learning Turkish:";

// PCM (16-bit, mono) → WAV
function wav(pcm, rate) {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVE", 8); h.write("fmt ", 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28);
  h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}
const voice = name => ({ prebuiltVoiceConfig: { voiceName: name } });
const body = (text, speech) => ({ contents: [{ parts: [{ text }] }], generationConfig: { responseModalities: ["AUDIO"], speechConfig: speech } });
// TTS models of this key, the newest flash first
async function models(key) {
  const r = await fetch(`${API}/models?pageSize=200&key=${encodeURIComponent(key)}`);
  if (!r.ok) throw new Error(`Gemini ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const ver = n => +((n.match(/(\d+(?:\.\d+)?)/) || [0, 0])[1]);
  return ((await r.json()).models || []).filter(m => /tts/i.test(m.name) && (m.supportedGenerationMethods || []).includes("generateContent"))
    .map(m => m.name.replace(/^models\//, "")).sort((a, b) => (/flash/.test(b) - /flash/.test(a)) || ver(b) - ver(a));
}
async function say(key, list, req) {
  for (const model of list.slice()) {
    for (let i = 0; i < 4; i++) {
      const r = await fetch(`${API}/models/${model}:generateContent?key=${encodeURIComponent(key)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(req) });
      if (r.ok) {
        const part = (((((await r.json()).candidates || [])[0] || {}).content || {}).parts || []).find(p => p.inlineData);
        if (!part) throw new Error(`${model}: javobda audio yoʻq`);
        const rate = +((part.inlineData.mimeType || "").match(/rate=(\d+)/) || [0, 24000])[1];
        return { model, wav: wav(Buffer.from(part.inlineData.data, "base64"), rate) };
      }
      const t = await r.text();
      // No free quota for this model (limit 0) or the day is used up: the next model; a minute limit: wait and retry
      if (r.status === 429 && /limit: 0|PerDay/i.test(t)) { console.log(`${model}: bepul kvota yoʻq yoki kunlik limit tugadi`); list.splice(list.indexOf(model), 1); break; }
      if (r.status === 429 || r.status >= 500) { const s = +((t.match(/"retryDelay":\s*"(\d+)/) || [0, 30])[1]); await sleep((s + 2) * 1000); continue; }
      if (r.status === 404 || (r.status === 400 && /not supported|not found/i.test(t))) { list.splice(list.indexOf(model), 1); break; }
      throw new Error(`Gemini ${model} ${r.status}: ${t.replace(/\s+/g, " ").slice(0, 300)}`);
    }
  }
  throw new Error("Hech bir TTS modeli javob bermadi");
}
async function main() {
  const out = path.resolve(process.argv[2] || "out"), key = (process.env.GEMINI_API_KEY || "").trim();
  fs.mkdirSync(out, { recursive: true });
  const index = { at: new Date().toISOString(), sentences: SENTENCES, dialog: DIALOG, files: [], errors: [] };
  const done = () => fs.writeFileSync(path.join(out, "index.json"), JSON.stringify(index, null, 1));
  if (!key) { index.errors.push("GEMINI_API_KEY yoʻq"); done(); console.log("GEMINI_API_KEY yoʻq"); return; }
  const list = await models(key);
  console.log("TTS modellari:", list.join(", ") || "yoʻq");
  index.models = list.slice();
  const jobs = VOICES.map(v => [`${v.toLowerCase()}-gaplar.wav`, `${v}: 5 ta gap`, body(`${STYLE}\n${SENTENCES.join("\n")}`, { voiceConfig: voice(v) })])
    .concat(PAIRS.map(([f, m]) => [`dialog-${f.toLowerCase()}-${m.toLowerCase()}.wav`, `Dialog: Defne — ${f}, Kerem — ${m}`,
      body(`${DSTYLE}\n${DIALOG.map(([s, t]) => `${s}: ${t}`).join("\n")}`, { multiSpeakerVoiceConfig: { speakerVoiceConfigs: [{ speaker: "Defne", voiceConfig: voice(f) }, { speaker: "Kerem", voiceConfig: voice(m) }] } })]));
  for (let i = 0; i < jobs.length; i++) {
    const [file, label, req] = jobs[i];
    try {
      const r = await say(key, list, req);
      fs.writeFileSync(path.join(out, file), r.wav);
      index.files.push({ file, label, model: r.model, bytes: r.wav.length });
      console.log(`✓ ${file} (${r.model}, ${Math.round(r.wav.length / 1024)} KB)`);
    } catch (e) { index.errors.push(`${file}: ${e.message}`); console.log(`✗ ${file}: ${e.message}`); if (!list.length) break; }
    done();
    if (i < jobs.length - 1) await sleep(GAP_MS);
  }
  done();
  if (!index.files.length) process.exitCode = 1;
}
main().catch(e => { console.error(e.message); process.exit(1); });
