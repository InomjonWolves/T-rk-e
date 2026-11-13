// Every Turkish text the site can read aloud, taken from the running app itself (so the list matches exactly what
// speak()/speakSeq() get). Output: [[voice, text], …] — voice "a" for everything, "b" for the second speaker of a dialog.
// Usage: node tools/audio-texts.js [out.json]   (prints counts; used by tools/audio-gen.js)
const fs = require("fs");
const path = require("path");
const { launch, openApp } = require("../tests/helpers");

async function collect() {
  const browser = await launch();
  try {
    const { page } = await openApp(browser, "#home");
    await page.evaluate(() => Promise.all([loadCourse(), loadOq(), loadPlb()]));
    return await page.evaluate(() => {
      const out = [], seen = new Set();
      const add = (t, v = "a") => {
        if (typeof t !== "string") return;
        const n = audioNorm(t);
        if (!n || n.length > 600 || !/[a-zçğıöşü]/i.test(n)) return;
        const k = v + "|" + n;
        if (!seen.has(k)) { seen.add(k); out.push([v, n]); }
      };
      ALL.forEach(w => add(w.tr));
      LETTERS.forEach(l => add(l[1]));
      GRAMMAR.forEach(g => g.examples.forEach(e => add(e[0])));
      GUIDE_ALL.forEach(i => { [i.ex, i.neg, i.q].forEach(p => p && add(plainSfx(p[0]))); });
      Object.values(BX).forEach(list => list.forEach(x => { if (x.t === "t" && x.ans) add(x.ans[0]); if (x.t === "o" && x.s) add(x.s); }));
      COURSE.units.forEach(u => {
        u.sections.forEach(s => s.blocks.forEach(b => {
          if (b.dlg) { const who = []; b.dlg.forEach(([spk, t]) => { if (!who.includes(spk)) who.push(spk); add(t); if (who.indexOf(spk) % 2 === 1) add(t, "b"); }); }
          (b.gloss || []).forEach(g => add(g[0]));
          (b.ex || []).forEach(e => Array.isArray(e) && add(e[0]));
        }));
        if (u.reading && u.reading.text) add(u.reading.text);
      });
      OQ.forEach(t => { t.text.split("\n\n").forEach(p => add(p)); (t.gloss || []).forEach(g => add(g[0])); });
      // Placement test: listening comprehension sentences from its own bank
      Object.values(PLB).forEach(b => (b.l || []).forEach(x => add(x.t)));
      // Listening/speaking items built at run time from the course (dialog lines, oral answers)
      try { lsItems("auto").forEach(it => add(it.t)); } catch (e) {}
      add("Merhaba! Türkçe öğreniyorum.");
      return out;
    });
  } finally { await browser.close(); }
}
module.exports = { collect };
if (require.main === module) collect().then(list => {
  const chars = list.reduce((a, x) => a + x[1].length, 0);
  console.log(`${list.length} ta matn (a: ${list.filter(x => x[0] === "a").length}, b: ${list.filter(x => x[0] === "b").length}), ${chars} belgi`);
  if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(list));
}).catch(e => { console.error(e); process.exit(1); });
