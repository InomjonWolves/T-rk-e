// The lexicon of the Cyrillic interface (js/kirill.js): which Latin words on the page are Turkish.
// t — words of the site's Turkish texts (every text the app reads aloud: tools/audio-texts.js) that have no letter
//     telling the language (ç ş ğ ı ö ü / oʻ gʻ q x sh ch) and never appear in an Uzbek string;
// b — such words that the app also uses in Uzbek (bu, sen, kim, Pamuk, names…): their language comes from the text around.
// Uzbek strings: every quoted string in the app and its data that has an Uzbek mark and no Turkish letter.
// Usage: node tools/kirill-lex.js          (writes kirill-lex.js; part of npm run build — tests/kirill.test.js checks it)
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const { collect } = require("./audio-texts");

const WORD = /[A-Za-zÇŞĞİÖÜçşğıöüâîûÂÎÛʻʼ]+/g;
const TRL = /[çşğıöüâîû]|c(?!h)/, UZL = /[ʻʼqxw]|sh|ch/;
const low = w => w.replace(/I/g, "ı").replace(/İ/g, "i").toLowerCase();
const plainWord = w => w.length > 1 && !TRL.test(w) && !UZL.test(w);
const SOURCES = ["content.js", "lugat.js", "grammar.js", "grammar-ex.js", "course.js", "guide.js", "oqish.js", "placement.js", "hikoya.js", "morph.js", "index.html", "privacy.html"];

function uzWords() {
  const files = SOURCES.concat(fs.readdirSync(path.join(ROOT, "js")).filter(f => f.endsWith(".js")).map(f => "js/" + f));
  const U = new Set();
  for (const f of files) {
    const src = fs.readFileSync(path.join(ROOT, f), "utf8");
    for (const m of src.matchAll(/"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`|>([^<>]{3,})</g)) {
      const ws = ((m[1] ?? m[2] ?? m[3]).replace(/<[^>]+>|\$\{[^}]*\}/g, " ").match(WORD) || []).map(low);
      const s = (m[1] ?? m[2] ?? m[3]).trim();
      // A word counts as Uzbek when an Uzbek string uses it next to a surely Uzbek word (bu qoida, Defne oshxonada) —
      // not a Turkish example inside an Uzbek sentence (Ben kitap okuyorum — Men kitob oʻqiyapman)
      if (ws.some(w => TRL.test(w))) continue;
      const label = f.startsWith("js/") && /^[A-Z][a-z]+(?: [a-z]+)*$/.test(s);
      if (label) { ws.forEach(w => { if (plainWord(w)) U.add(w); }); continue; }
      ws.forEach((w, i) => { if (plainWord(w) && [ws[i - 1], ws[i + 1]].some(n => n && UZL.test(n))) U.add(w); });
    }
  }
  return U;
}
async function build() {
  const texts = await collect();
  const T = new Set();
  for (const [, t] of texts) for (const w of t.match(WORD) || []) { const l = low(w); if (plainWord(l)) T.add(l); }
  const U = uzWords(), both = [...T].filter(w => U.has(w)).sort(), only = [...T].filter(w => !U.has(w)).sort();
  return `/* Türkçe Yoʻl — the Cyrillic interface's lexicon. Made by tools/kirill-lex.js (npm run build); do not edit. */\nvar KLEX = { t: ${JSON.stringify(only.join(" "))},\n  b: ${JSON.stringify(both.join(" "))} };\n`;
}
if (require.main === module) build().then(s => { fs.writeFileSync(path.join(ROOT, "kirill-lex.js"), s); console.log("kirill-lex.js:", s.length, "bayt"); });
module.exports = { build };
