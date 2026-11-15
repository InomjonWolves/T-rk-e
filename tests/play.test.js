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

test("documents: a full privacy policy, terms of use and an about page — one template, linked from the app, the static pages and the sitemap", () => {
  const p = read("privacy.html");
  // What the policy has to answer: who, what, why, who sees it, where, how long, security, age, rights, changes and contact
  for (const x of ["Kim javobgar", "Qanday maʼlumot saqlanadi", "Nima uchun kerak", "Kimga koʻrinadi", "Qayerda saqlanadi", "Qancha vaqt saqlanadi", "Xavfsizlik", "Yosh chegarasi", "Sizning huquqlaringiz", "Oʻzgarishlar va bogʻlanish", "MyMemory", "Haftalik liga natijasi"]) assert.ok(p.includes(x), x);
  const docs = ["privacy.html", "shartlar.html", "biz-haqimizda.html", "hisob-ochirish.html"];
  for (const f of docs) {
    const d = read(f);
    assert.match(d, /<script>\/\* Yagona manzil/, f);
    assert.match(d, /<main class="doc">/, f);
    assert.match(d, /theme-color" content="#0d1124"/, f);
    assert.ok(!/<style>/.test(d), `${f}: styles live in pages.css`);
    for (const g of docs) assert.ok(d.includes(`href="${g}"`), `${f} → ${g}`);
    // A public issue tracker is no place for an e-mail address: the pages say so
    assert.ok(!/pochtasini yozib murojaat/.test(d), f);
  }
  for (const x of ["Foydalanish qoidalari", "Kontent va mualliflik huquqi", "Kafolatlar va javobgarlik", "Amaldagi qonunchilik"]) assert.ok(read("shartlar.html").includes(x), x);
  for (const x of ["Tamoyillarimiz", "Pamuk", "Bogʻlanish"]) assert.ok(read("biz-haqimizda.html").includes(x), x);
  const app = read("app.js"), seo = read("kurs/a1-1.html"), map = read("sitemap.xml"), { FILES } = require("../tools/native-www.js");
  for (const f of ["shartlar.html", "biz-haqimizda.html"]) {
    assert.ok(app.includes(`href="${f}"`), `settings → ${f}`);
    assert.ok(seo.includes(`${f}"`), `static footer → ${f}`);
    assert.ok(map.includes("turkceyol.web.app/" + f), `sitemap → ${f}`);
  }
  for (const f of docs) assert.ok(FILES.includes(f), `${f} is packed into the app`);
  assert.match(read("index.html"), /href="shartlar.html">foydalanish shartlari<\/a> va <a href="privacy.html">/);
});
