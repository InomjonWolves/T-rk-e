// Turkish spell check of every text the app reads aloud (tools/audio-texts.js) with the Hunspell Turkish dictionary.
// Prints the words the dictionary does not know, most frequent first, with an example. Not part of `npm test`:
//   cd <scratch> && npm i dictionary-tr@2 nspell@2
//   NODE_PATH=<scratch>/node_modules node tools/tr-spell.js [texts.json]
// Expected leftovers (checked 2026-11-14): names (Dilnoza, Zeynep…), TDK forms with ^ (hâlde, rüzgâr, kâğıt),
// correct suffixed forms the dictionary lacks (uyuyayazdım, toplantıdaydınız), loanwords (online, internet).
const fs = require("fs");
const path = require("path");
(async () => {
  const dir = (process.env.NODE_PATH || "").split(path.delimiter).map(p => path.join(p, "dictionary-tr")).find(p => fs.existsSync(p));
  if (!dir) { console.error("dictionary-tr topilmadi (NODE_PATH)"); process.exit(1); }
  const sp = require("nspell")({ aff: fs.readFileSync(path.join(dir, "index.aff")), dic: fs.readFileSync(path.join(dir, "index.dic")) });
  const texts = process.argv[2] ? JSON.parse(fs.readFileSync(process.argv[2], "utf8")) : await require("./audio-texts.js").collect();
  const bad = new Map();
  for (const [, t] of texts) for (const raw of t.split(/[^A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû']+/)) {
    const w = raw.replace(/^'+|'+$/g, ""), parts = w.split("'"), stem = parts[0];
    if (stem.length < 2 || sp.correct(stem) || sp.correct(stem.toLocaleLowerCase("tr")) || (/^[A-ZÇĞİÖŞÜ]/.test(stem) && parts.length > 1)) continue;
    const k = stem.toLocaleLowerCase("tr"), v = bad.get(k) || { n: 0, ex: t.slice(0, 70) };
    v.n++; bad.set(k, v);
  }
  [...bad.entries()].sort((a, b) => b[1].n - a[1].n).forEach(([w, v]) => console.log(`${w}\t${v.n}\t${v.ex}`));
  console.error(`${texts.length} ta matn, ${bad.size} ta notanish soʻz`);
})();
