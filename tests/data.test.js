// Content checks that need no browser: structure of lessons, rules, exercises, course and project rules.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { ROOT, loadContent } = require("./helpers");

const C = loadContent();
const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");

test("grammar guide: unique topic codes and balanced [suffix] marks", () => {
  const all = C.GUIDE.flatMap(l => l.groups.flatMap(g => g.items));
  const codes = all.map(i => i.code);
  assert.equal(new Set(codes).size, codes.length, "duplicate topic codes");
  for (const i of all) {
    assert.ok(i.rule && i.ex, `${i.code}: rule and example are required`);
    const strs = [i.ex[0], i.neg && i.neg[0], i.q && i.q[0], typeof i.forms === "string" ? i.forms : "", ...(i.forms && i.forms.r ? i.forms.r.flat() : [])].filter(Boolean);
    for (const s of strs) assert.equal((s.match(/\[/g) || []).length, (s.match(/\]/g) || []).length, `${i.code}: unbalanced brackets in "${s}"`);
    if (i.forms && i.forms.r) i.forms.r.forEach(r => assert.equal(r.length, i.forms.h.length, `${i.code}: table row has wrong column count`));
  }
});

test("rule exercises: every topic exists and every item is answerable", () => {
  const codes = new Set(C.GUIDE.flatMap(l => l.groups.flatMap(g => g.items.map(i => i.code))));
  for (const [code, items] of Object.entries(C.BX)) {
    assert.ok(codes.has(code), `exercises for unknown topic ${code}`);
    items.forEach((e, i) => {
      const at = `${code}#${i}`;
      if (e.t === "c") {
        assert.ok(e.a >= 0 && e.a < e.o.length, `${at}: answer index out of range`);
        assert.equal(new Set(e.o).size, e.o.length, `${at}: duplicate options`);
      } else if (e.t === "t") {
        assert.ok(e.ans && e.ans.length, `${at}: no accepted answers`);
        assert.ok(e.q.includes("___"), `${at}: no blank in the question`);
      } else if (e.t === "o") assert.ok(e.s && e.s.split(" ").length >= 2, `${at}: sentence too short`);
      else assert.fail(`${at}: unknown type ${e.t}`);
    });
  }
  // Every level from A1 to B2 has rule exercises
  for (const lv of ["A1", "A2", "B1", "B2", "C1"]) assert.ok(Object.keys(C.BX).some(c => c.startsWith(lv + ".")), `no exercises for ${lv}`);
});

test("vocabulary base: A1–B2 packs, one \"turkcha=oʻzbekcha\" pair per line, every level well filled", () => {
  const ids = new Set(), perLv = {};
  for (const p of C.LUGAT) {
    assert.ok(["A1", "A2", "B1", "B2", "C1"].includes(p.lv), `${p.id}: level`);
    assert.ok(!ids.has(p.id) && /^[a-z0-9-]+$/.test(p.id), `${p.id}: id`); ids.add(p.id);
    assert.ok(p.tr && p.uz, `${p.id}: titles`);
    const lines = p.w.trim().split("\n");
    assert.ok(lines.length >= 30, `${p.id}: only ${lines.length} words`);
    for (const l of lines) {
      const parts = l.split("=");
      assert.equal(parts.length, 2, `${p.id}: "${l}"`);
      assert.ok(parts[0].trim() && parts[1].trim(), `${p.id}: empty side in "${l}"`);
      assert.ok(!/[‘’']/.test(parts[1]), `${p.id}: use ʻ / ʼ in Uzbek, not quotes: "${l}"`);
      // The Turkish side is what learners type and hear: no notes in brackets, no slashes, "…" not "..."
      assert.ok(!/[()\/]|\.\.\./.test(parts[0]), `${p.id}: put notes on the Uzbek side: "${l}"`);
    }
    perLv[p.lv] = (perLv[p.lv] || 0) + lines.length;
  }
  for (const lv of ["A1", "A2", "B1", "B2", "C1"]) assert.ok(perLv[lv] >= 500, `${lv}: ${perLv[lv]} words`);
});

test("one address: the old GitHub Pages copy sends every page to the same page on turkceyol.web.app", () => {
  const vm = require("vm");
  const run = (file, pathname, hash = "", hostname = "inomjonwolves.github.io") => {
    const code = read(file).match(/<script>\/\* Yagona manzil[\s\S]*?<\/script>/)[0].replace(/^<script>|<\/script>$/g, "");
    let to = null;
    vm.runInNewContext(code, { location: { hostname, pathname, hash, replace: u => { to = u; } } });
    return to;
  };
  assert.equal(run("index.html", "/T-rk-e/", "#k-a1-1"), "https://turkceyol.web.app/#k-a1-1");
  assert.equal(run("index.html", "/T-rk-e/index.html", "#join-K7M2QX"), "https://turkceyol.web.app/#join-K7M2QX");
  assert.equal(run("index.html", "/T-rk-e"), "https://turkceyol.web.app/");
  assert.equal(run("privacy.html", "/T-rk-e/privacy.html"), "https://turkceyol.web.app/privacy.html");
  assert.equal(run("kurs/a1-1.html", "/T-rk-e/kurs/a1-1.html"), "https://turkceyol.web.app/kurs/a1-1.html");
  assert.equal(run("lugat/index.html", "/T-rk-e/lugat/"), "https://turkceyol.web.app/lugat/");
  // On the real address nothing happens
  assert.equal(run("index.html", "/", "#home", "turkceyol.web.app"), null);
  // No other address is offered anywhere on the site
  for (const f of ["index.html", "app.js", "privacy.html", "sitemap.xml", "robots.txt", "manifest.webmanifest"]) {
    // (the verification e-mail really comes from noreply@t-rk-e.firebaseapp.com — that sender is not a site address)
    const t = read(f).replace(/<script>\/\* Yagona manzil[\s\S]*?<\/script>/, "").replace(/noreply@t-rk-e\.firebaseapp\.com/g, "");
    assert.ok(!/github\.io|firebaseapp\.com|t-rk-e\.web\.app/.test(t), `${f} mentions another address`);
  }
});

test("course: 40 units, tests answerable, reading answers match questions", () => {
  assert.equal(C.COURSE.units.length, 40);
  for (const l of C.COURSE.levels) {
    for (const p of l.test.parts) p.qs.forEach((q, i) => assert.ok(q.a >= 0 && q.a < q.o.length, `${l.id} test ${p.name} #${i + 1}`));
    for (const id of l.units) assert.ok(C.COURSE.units.some(u => u.id === id), `${l.id}: unknown unit ${id}`);
  }
  for (const u of C.COURSE.units) {
    if (u.reading && u.reading.ans) Object.keys(u.reading.ans).forEach(k => assert.ok(u.reading.qs[+k - 1], `${u.id}: reading answer ${k} has no question`));
    assert.ok(u.vocab.length && u.exercises.length, `${u.id}: vocabulary and exercises are required`);
  }
});

test("project rule: no exam brand names or military vocabulary in the content", () => {
  const bad = /\bTYS\b|\b(asker|askeri|komutan|kışla|nöbet|tatbikat)\b/i;
  for (const f of ["content.js", "lugat.js", "grammar.js", "grammar-ex.js", "course.js", "guide.js", "oqish.js", "app.js", "index.html"]) {
    const m = read(f).match(bad);
    assert.equal(m, null, `${f} contains "${m && m[0]}"`);
  }
});

test("older Safari: no regex lookbehind in app.js", () => {
  assert.equal(/\(\?<[=!]/.test(read("app.js")), false, "lookbehind breaks Safari before 16.4");
});

test("service worker: every cached file exists", () => {
  const sw = read("sw.js");
  assert.match(sw, /const CACHE = "turkce-yol-v\d+"/);
  const assets = JSON.parse(sw.match(/const ASSETS = (\[[^\]]*\])/)[1]);
  for (const a of assets) if (a !== "./") assert.ok(fs.existsSync(path.join(ROOT, a)), `missing ${a}`);
});

test("firestore rules: stats are writable only by their owner and readable only by admins", () => {
  const r = read("firestore.rules");
  assert.match(r, /match \/stats\/\{uid\}[\s\S]*allow read: if isAdmin\(\);/);
  assert.match(r, /match \/stats\/\{uid\}[\s\S]*request\.auth\.uid == uid/);
  // Only confirmed accounts (verified e-mail or Google, or Telegram through our bot server) read or write anything
  assert.match(r, /function okUser\(\) \{\s*return request\.auth != null && \(request\.auth\.token\.get\('email_verified', false\) == true \|\| tgUser\(\)\);\s*\}/);
  assert.equal((r.match(/request\.auth != null/g) || []).length, 1, "every rule goes through okUser()");
  assert.match(r, /match \/admins\/\{uid\}\s*\{\s*allow get: if okUser\(\) && request\.auth\.uid == uid;\s*\}/);
});

test("firebase hosting: publishes the site files only, never tests or project notes", () => {
  const cfg = JSON.parse(read("firebase.json")).hosting;
  assert.equal(cfg.public, ".");
  assert.match(cfg.site, /^[a-z0-9-]{4,30}$/, "site name");
  for (const x of ["tests/**", "*.md", "package.json", "firestore.rules", "**/.*"]) assert.ok(cfg.ignore.includes(x), `should ignore ${x}`);
  assert.equal(JSON.parse(read(".firebaserc")).projects.default, "t-rk-e");
});

// Audit fixes (2026-11): dialogs keep one speaker per line, explanations are not dialogs, no duplicate words in a pack,
// Uzbek words use ʻ / ʼ (not a plain apostrophe) — Turkish proper nouns (İstanbul'da) are left alone
test("course dialogs: one speaker per line, dialog blocks only in dialog sections", () => {
  for (const u of C.COURSE.units) u.sections.forEach((s, si) => s.blocks.forEach(b => {
    if (!b.dlg) return;
    assert.equal(s.kind, "dialog", `${u.id} section ${si} (${s.kind}): an explanation written as a dialog — use p / note`);
    const names = new Set(b.dlg.map(d => d[0]));
    b.dlg.forEach(([who, t], i) => {
      const m = t.match(/[.!?…]\s+([A-ZÇĞİÖŞÜ][a-zçğıöşü]+(?: [a-zçğıöşü]+)?):\s/);
      assert.ok(!m, `${u.id} line ${i} (${who}): another speaker «${m && m[1]}:» is glued into the line`);
      assert.ok(t.length <= 400, `${u.id} line ${i}: too long for one dialog line`);
    });
    assert.ok(names.size >= 2, `${u.id} section ${si}: a dialog needs two speakers`);
  }));
});

test("vocabulary packs: no word twice in one pack", () => {
  for (const p of C.LUGAT) {
    const seen = new Set();
    for (const l of p.w.trim().split("\n")) {
      const t = l.split("=")[0].trim().toLocaleLowerCase("tr");
      assert.ok(!seen.has(t), `${p.id}: «${t}» twice`);
      seen.add(t);
    }
  }
});

test("Uzbek spelling: oʻ/gʻ and the tutuq belgisi ʼ, never a plain apostrophe", () => {
  const re = /(^|[^A-Za-zÇĞİÖŞÜçğıöşüʻʼ])(fe|ma|ta|ba|a|e|va|hay|qat|mas|o|bo|ko|og|so|to|yo|qo|go|sa|ra)'[a-zʻ]/gi;
  for (const f of ["content.js", "lugat.js", "grammar.js", "grammar-ex.js", "course.js", "guide.js", "oqish.js"]) {
    const s = read(f), bad = [...s.matchAll(re)].map(m => s.slice(m.index, m.index + 18).trim());
    assert.deepEqual(bad, [], `${f}: plain apostrophe in Uzbek words`);
  }
});

// C1 (2026-11): advanced level — longer dialogs, extended readings, its own level test
test("course: C1 has 8 units with long dialogs, extended readings, six exercises and a 20-question test", () => {
  const lv = C.COURSE.levels.find(l => l.id === "C1");
  assert.ok(lv, "C1 level");
  assert.equal(lv.units.length, 8);
  for (const id of lv.units) {
    const u = C.COURSE.units.find(x => x.id === id);
    assert.equal(u.level, "C1");
    const dlg = u.sections.find(s => s.kind === "dialog").blocks.find(b => b.dlg).dlg;
    assert.ok(dlg.length >= 12, `${id}: ${dlg.length} dialog lines`);
    assert.ok(u.reading.text.length >= 1000, `${id}: reading ${u.reading.text.length} chars`);
    assert.equal(u.reading.qs.length, 6, `${id}: reading questions`);
    assert.ok(u.exercises.length >= 6 && u.exercises.some(e => /^Yozish/.test(e.title)), `${id}: exercises and a writing task`);
    assert.ok(u.vocab[0].words.length >= 15, `${id}: vocabulary`);
  }
  assert.equal(lv.test.parts[0].qs.length + lv.test.parts[1].qs.length, 20);
});
