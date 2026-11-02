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
  for (const lv of ["A1", "A2", "B1", "B2"]) assert.ok(Object.keys(C.BX).some(c => c.startsWith(lv + ".")), `no exercises for ${lv}`);
});

test("vocabulary base: A1–B2 packs, one \"turkcha=oʻzbekcha\" pair per line, every level well filled", () => {
  const ids = new Set(), perLv = {};
  for (const p of C.LUGAT) {
    assert.ok(["A1", "A2", "B1", "B2"].includes(p.lv), `${p.id}: level`);
    assert.ok(!ids.has(p.id) && /^[a-z0-9-]+$/.test(p.id), `${p.id}: id`); ids.add(p.id);
    assert.ok(p.tr && p.uz, `${p.id}: titles`);
    const lines = p.w.trim().split("\n");
    assert.ok(lines.length >= 30, `${p.id}: only ${lines.length} words`);
    for (const l of lines) {
      const parts = l.split("=");
      assert.equal(parts.length, 2, `${p.id}: "${l}"`);
      assert.ok(parts[0].trim() && parts[1].trim(), `${p.id}: empty side in "${l}"`);
      assert.ok(!/[‘’']/.test(parts[1]), `${p.id}: use ʻ / ʼ in Uzbek, not quotes: "${l}"`);
    }
    perLv[p.lv] = (perLv[p.lv] || 0) + lines.length;
  }
  for (const lv of ["A1", "A2", "B1", "B2"]) assert.ok(perLv[lv] >= 500, `${lv}: ${perLv[lv]} words`);
});

test("course: 32 units, tests answerable, reading answers match questions", () => {
  assert.equal(C.COURSE.units.length, 32);
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
  for (const f of ["content.js", "lugat.js", "grammar.js", "grammar-ex.js", "course.js", "guide.js", "app.js", "index.html"]) {
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
  // Only confirmed accounts (verified e-mail, Google, Apple, Telegram) read or write anything
  assert.match(r, /function okUser\(\) \{\s*return request\.auth != null && \(request\.auth\.token\.get\('email_verified', false\) == true\s*\|\| request\.auth\.token\.firebase\.sign_in_provider in \['apple\.com', 'custom'\]\);/);
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
