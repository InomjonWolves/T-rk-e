// Static pages for search engines (kurs/, qoida/, sitemap.xml): up to date, linked correctly, and they open the app at the right place.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { ROOT, launch, openApp } = require("./helpers");
const { build, SITE } = require("../tools/seo");

const OUT = build();

test("generated pages match the content (run `node tools/seo.js` after editing course.js or guide.js)", () => {
  const stale = Object.entries(OUT).filter(([f, html]) => !fs.existsSync(path.join(ROOT, f)) || fs.readFileSync(path.join(ROOT, f), "utf8") !== html).map(([f]) => f);
  assert.deepEqual(stale, []);
  for (const dir of ["kurs", "qoida", "lugat", "oqish", "maqola"]) {
    const extra = fs.readdirSync(path.join(ROOT, dir)).filter(f => !OUT[`${dir}/${f}`]);
    assert.deepEqual(extra, [], `old files in ${dir}/`);
  }
  assert.equal(Object.keys(OUT).filter(f => f.startsWith("kurs/")).length, 33);
  const C = require("./helpers").loadContent();
  assert.equal(Object.keys(OUT).filter(f => f.startsWith("qoida/")).length, C.GUIDE.reduce((a, l) => a + l.groups.reduce((b, g) => b + g.items.length, 0), 0) + 1);
  assert.equal(Object.keys(OUT).filter(f => f.startsWith("lugat/")).length, C.LUGAT.length + 1);
  const OQ = vm.runInNewContext(fs.readFileSync(path.join(ROOT, "oqish.js"), "utf8") + ";OQ", {});
  assert.equal(Object.keys(OUT).filter(f => f.startsWith("oqish/")).length, OQ.length + 1);
  assert.equal(Object.keys(OUT).filter(f => f.startsWith("maqola/")).length, require("../tools/articles.js").length + 3);
});

test("every page: title, description, canonical, no broken local links, no forbidden words", () => {
  const bad = /\bTYS\b|\b(asker|askeri|komutan|kışla|nöbet|tatbikat)\b/i;
  const titles = new Set();
  for (const [f, html] of Object.entries(OUT)) {
    if (!f.endsWith(".html")) continue;
    const title = /<title>([^<]+)<\/title>/.exec(html)[1];
    assert.ok(!titles.has(title), `duplicate title ${title}`); titles.add(title);
    const desc = /name="description" content="([^"]+)"/.exec(html)[1];
    assert.ok(desc.length >= 50 && desc.length <= 160, `${f}: description length ${desc.length}`);
    assert.match(html, new RegExp(`rel="canonical" href="${SITE}`));
    assert.ok(!bad.test(html), `${f} has a forbidden word`);
    // JSON-LD parses
    JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)[1]);
    for (const [, href] of html.matchAll(/href="([^"#:]+)(#[^"]*)?"/g)) {
      if (/^https?:/.test(href)) continue;
      let target = path.normalize(path.join(path.dirname(path.join(ROOT, f)), href));
      if (href.endsWith("/")) target = path.join(target, "index.html");
      assert.ok(fs.existsSync(target), `${f}: broken link ${href}`);
    }
  }
});

test("sitemap lists the home page and every static page; robots.txt points to it", () => {
  const sm = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  assert.ok(locs.includes(SITE));
  for (const f of Object.keys(OUT).filter(f => f.endsWith(".html"))) assert.ok(locs.includes(SITE + f.replace(/index\.html$/, "")), `${f} missing from sitemap`);
  assert.match(fs.readFileSync(path.join(ROOT, "robots.txt"), "utf8"), /Sitemap: https:\/\/turkceyol\.web\.app\/sitemap\.xml/);
  const index = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  assert.match(index, /rel="canonical" href="https:\/\/turkceyol\.web\.app\/"/);
  assert.ok(fs.existsSync(path.join(ROOT, "img", "og.jpg")));
});

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

test("the app links on static pages open the right unit and grammar topic", async () => {
  const links = new Set();
  for (const [f, html] of Object.entries(OUT)) for (const [, h] of html.matchAll(/href="\.\.\/(#[^"]+)"/g)) links.add(h);
  assert.ok(links.size >= 32 + 114);
  const { page, errors } = await openApp(browser, "#home");
  const wrong = await page.evaluate(hs => {
    // Unknown hashes fall back to the home page
    location.hash = "#home"; route(); const home = document.querySelector(".nav a[aria-current]").dataset.tab;
    return hs.filter(h => { location.hash = h; route(); return document.querySelector(".nav a[aria-current]").dataset.tab === home; });
  }, [...links]);
  assert.deepEqual(wrong, []);
  assert.deepEqual(errors, []);
  await page.close();
});

test("static pages fit a phone screen", async () => {
  const page = await browser.newPage({ viewport: { width: 360, height: 740 } });
  await page.route(/^https?:\/\//, r => r.abort());
  for (const f of ["kurs/index.html", "kurs/b2-8.html", "qoida/index.html", "qoida/a1-02.html"]) {
    await page.goto("file://" + path.join(ROOT, f));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${f} scrolls sideways`);
  }
  await page.close();
});
