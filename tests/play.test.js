// Google Play (Android 7-bosqich): store texts within Play's limits, pictures in Play's sizes, the pages Play asks for
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");
// Width × height of a JPEG (SOF marker) or a PNG (IHDR)
function size(f) {
  const b = fs.readFileSync(path.join(ROOT, f));
  if (b[0] === 0x89) return [b.readUInt32BE(16), b.readUInt32BE(20)];
  for (let i = 2; i < b.length;) {
    const m = b[i + 1], len = b.readUInt16BE(i + 2);
    if (m >= 0xc0 && m <= 0xc3) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
    i += 2 + len;
  }
  return null;
}

test("store listing: Play's length limits, our facts, no forbidden words or other addresses", () => {
  const L = JSON.parse(read("native/play/listing.json"));
  assert.ok(L.title.length <= 30, `title ${L.title.length}`);
  assert.ok(L.short.length <= 80, `short ${L.short.length}`);
  assert.ok(L.full.length <= 4000, `full ${L.full.length}`);
  assert.ok(L.notes.length <= 500, `notes ${L.notes.length}`);
  const all = [L.title, L.short, L.full, L.notes].join("\n");
  assert.doesNotMatch(all, /\bTYS\b|askar|komutan|kışla|nöbet|tatbikat/i);
  assert.doesNotMatch(all, /github\.io|firebaseapp\.com|t-rk-e\.web\.app/);
  assert.doesNotMatch(all, /'/, "Uzbek apostrophes are ʻ and ʼ");
  for (const k of ["privacy", "deletion", "website"]) assert.match(L[k], /^https:\/\/turkceyol\.web\.app(\/|$)/);
  assert.ok(fs.existsSync(path.join(ROOT, L.deletion.replace("https://turkceyol.web.app/", ""))));
  // The step-by-step guide carries the same texts
  const g = read("native/play/QOLLANMA.md");
  for (const k of ["title", "short", "full", "notes"]) assert.ok(g.includes(L[k]), `QOLLANMA.md: ${k}`);
});

test("store pictures: 8 phone screenshots 1080×1920, the feature graphic 1024×500, the icon 512×512", () => {
  const shots = fs.readdirSync(path.join(ROOT, "native/play/screenshots")).filter(f => f.endsWith(".jpg"));
  assert.equal(shots.length, 8);
  for (const f of shots) assert.deepEqual(size("native/play/screenshots/" + f), [1080, 1920], f);
  assert.deepEqual(size("native/play/feature-1024x500.jpg"), [1024, 500]);
  assert.deepEqual(size("native/play/icon-512.png"), [512, 512]);
  assert.equal(require("../tools/play-assets.js").SHOTS.length, 8);
});

test("pages Play asks for: the privacy policy covers the app, account deletion has its own page; the AAB is in the release", () => {
  const p = read("privacy.html");
  for (const x of ["Android ilova", "Mikrofon", "Bildirishnomalar", "vidjet", "reklama identifikatori", 'href="hisob-ochirish.html"']) assert.ok(p.includes(x), x);
  const d = read("hisob-ochirish.html");
  assert.match(d, /<script>\/\* Yagona manzil/);
  assert.match(d, /Profil<\/b>[\s\S]*Sozlamalar[\s\S]*Hisobni oʻchirish/);
  assert.match(d, /href="privacy.html"/);
  assert.match(read("sitemap.xml"), /turkceyol\.web\.app\/hisob-ochirish\.html/);
  assert.match(read(".github/workflows/native.yml"), /gh release create ilova-latest out\/turkce-yol-ilova\.apk out\/turkce-yol-ilova\.aab/);
});
