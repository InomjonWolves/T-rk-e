// The "Koshin" design (2026-11): the site's own font, colours readable in both themes, a tab bar with names,
// the home page as one column on a phone and two on a wide screen, the verdict colours of a practice session.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { ROOT, launch, openApp, answerAllRight } = require("./helpers");

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });
const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");

test("fonts: served by the site itself, no third-party font requests", () => {
  for (const f of ["index.html", "privacy.html", "styles.css", "pages.css", "kurs/a1-1.html", "qoida/a1-01.html", "maqola/index.html", "tools/seo.js", "sw.js"]) {
    assert.doesNotMatch(read(f), /fonts\.(googleapis|gstatic)\.com|url\.host\.startsWith\("fonts\."\)/, f);
  }
  const files = [...read("styles.css").matchAll(/url\("(fonts\/[^"]+\.woff2)"\)/g)].map(m => m[1]);
  assert.ok(files.length >= 2, "Latin and Cyrillic files");
  for (const f of files) assert.ok(fs.existsSync(path.join(ROOT, f)), f);
  const main = files[0];
  assert.ok(fs.statSync(path.join(ROOT, main)).size < 40000, "the Latin file stays small");
  assert.ok(read("pages.css").includes(`url("${main}")`), "static pages use the same file");
  assert.ok(read("index.html").includes(`<link rel="preload" href="${main}" as="font" type="font/woff2" crossorigin>`), "preloaded");
  assert.ok(JSON.parse(read("sw.js").match(/const ASSETS = (\[[^\]]*\])/)[1]).includes("./" + main), "cached for offline use");
  const fb = JSON.parse(read("firebase.json"));
  assert.ok(fb.hosting.headers.some(h => h.source === "fonts/*.woff2" && /immutable/.test(h.headers[0].value)));
  assert.ok(fs.existsSync(path.join(ROOT, "fonts/OFL.txt")), "the font's licence comes with it");
});

test("fonts: Uzbek ʻ and ʼ and the Turkish letters are drawn by the site's font, not a fallback", async () => {
  const { page, errors } = await openApp(browser, "#home");
  const r = await page.evaluate(async () => {
    await document.fonts.load("700 40px Onest", "oʻgʻ maʼno ğışİ");
    const c = document.createElement("canvas").getContext("2d");
    const w = (font, t) => { c.font = font; return c.measureText(t).width; };
    return ["ʻ", "ʼ", "ğ", "ş", "ı", "İ", "ö", "ç"].map(ch => [ch, w("700 40px Onest, monospace", ch), w("700 40px monospace", ch)]);
  });
  for (const [ch, own, fallback] of r) assert.notEqual(own, fallback, `“${ch}” comes from the fallback font`);
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).fontFamily.split(",")[0].replace(/"/g, "")), "Onest");
  assert.deepEqual(errors, []);
  await page.close();
});

// Colours: every text colour of the palette against the backgrounds it is used on (WCAG AA, 4.5:1)
test("palette: text colours are readable on their backgrounds in the light and the dark theme", () => {
  const css = read("styles.css");
  const vars = block => { const o = {}; for (const m of block.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) o[m[1]] = m[2].trim(); return o; };
  const light = vars(css.slice(css.indexOf(":root {"), css.indexOf("@media (prefers-color-scheme: dark)")));
  const darkAt = css.indexOf(':root[data-theme="dark"] {');
  const dark = Object.assign({}, light, vars(css.slice(darkAt, css.indexOf("/* ---------- Base"))));
  // The system-dark block repeats the forced-dark one
  const sys = vars(css.slice(css.indexOf(":root:not([data-theme=\"light\"]) {"), darkAt));
  for (const k of Object.keys(sys)) assert.equal(sys[k], dark[k], `--${k} differs between the system-dark and the forced-dark theme`);
  const hex = h => { h = h.slice(1); if (h.length === 3) h = [...h].map(c => c + c).join(""); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
  const color = (v, t, under) => {
    let m;
    if ((m = /^var\(--([a-z0-9-]+)\)$/.exec(v))) return color(t[m[1]], t, under);
    if (v[0] === "#") return hex(v);
    if ((m = /^rgba?\(([^)]+)\)$/.exec(v))) { const [r, g, b, a = 1] = m[1].split(",").map(Number); return [r, g, b].map((c, i) => c * a + under[i] * (1 - a)); }
    throw new Error("not a colour: " + v);
  };
  const lum = c => { const [r, g, b] = c.map(x => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  for (const [name, t] of [["light", light], ["dark", dark]]) {
    const solid = k => color(t[k], t, [0, 0, 0]);
    const check = (fg, bg, under = "surface") => {
      const u = solid(under), r = ratio(color(fg[0] === "#" ? fg : t[fg], t, u), color(t[bg], t, u));
      assert.ok(r >= 4.5, `${name}: ${fg} on ${bg} (over ${under}) is ${r.toFixed(2)}:1`);
    };
    for (const bg of ["bg", "surface", "surface-2"]) for (const fg of ["ink", "ink-2", "muted", "accent-ink"]) check(fg, bg);
    check("muted", "bg-2");
    for (const c of ["sky", "violet", "teal", "green", "orange", "pink"]) for (const under of ["surface", "surface-2", "bg"]) check(c + "-ink", c + "-soft", under);
    for (const under of ["surface", "bg"]) check("accent-ink", "accent-soft", under);
    for (const bg of ["primary", "danger", "tile-sky", "tile-violet", "tile-teal", "tile-green", "tile-pink"]) check("#ffffff", bg);
    check("gold-ink", "gold"); check("tile-orange-ink", "tile-orange"); check("on-primary", "primary");
  }
});

test("tab bar: five tabs with visible names; a side rail with the brand on a wide screen", async () => {
  const { page, errors } = await openApp(browser, "#practice");
  const tabs = () => page.evaluate(() => [...document.querySelectorAll("nav.nav a")].map(a => {
    const s = a.querySelector("span"), b = s.getBoundingClientRect(), r = a.getBoundingClientRect();
    return { t: s.textContent, shown: b.width > 10 && b.height > 8 && b.right <= innerWidth && getComputedStyle(s).display !== "none", cur: a.getAttribute("aria-current"), h: Math.round(r.height), w: Math.round(r.width) };
  }));
  for (const w of [390, 320]) {
    await page.setViewportSize({ width: w, height: 700 });
    const t = await tabs();
    assert.deepEqual(t.map(x => x.t), ["Asosiy", "Darslar", "Mashq", "Reyting", "Profil"]);
    assert.ok(t.every(x => x.shown), `every name is visible at ${w}px`);
    assert.ok(t.every(x => x.h >= 44 && x.w >= 44), `tabs are at least 44px at ${w}px: ${JSON.stringify(t.map(x => [x.w, x.h]))}`);
    assert.deepEqual(t.map(x => x.cur), [null, null, "page", null, null]);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `no sideways scroll at ${w}px`);
  }
  await page.setViewportSize({ width: 1280, height: 800 });
  const rail = await page.evaluate(() => { const r = document.querySelector("nav.nav").getBoundingClientRect(), b = document.querySelector("#nav-brand"); return [r.left, r.top, r.height >= innerHeight - 1, r.width < 300, !!b.querySelector(".logo .cat"), b.textContent.trim()]; });
  assert.deepEqual(rail, [0, 0, true, true, true, "Türkçe Yoʻl"]);
  assert.ok((await tabs()).every(x => x.shown));
  assert.deepEqual(errors, []);
  await page.close();
});

test("home: one column in reading order on a phone, two columns on a wide screen", async () => {
  const { page, errors } = await openApp(browser, "#home", { state: { xp: 230 } });
  const boxes = () => page.evaluate(() => {
    const b = q => { const r = document.querySelector(q).getBoundingClientRect(); return { y: Math.round(r.top + scrollY), x: Math.round(r.left), w: Math.round(r.width) }; };
    return { status: b(".status-card"), hero: b(".hero"), course: b(".k-next"), tasks: b(".dq-today"), word: b(".wd-sec"), sw: document.documentElement.scrollWidth, W: innerWidth };
  });
  let t = await boxes();
  assert.ok(t.status.y < t.hero.y && t.hero.y < t.course.y && t.course.y < t.tasks.y && t.tasks.y < t.word.y, "status → plan → course → tasks → word: " + JSON.stringify(t));
  assert.ok(t.hero.w > 300 && t.sw <= t.W);
  // The plan's button is the saffron one and Pamuk sits in the card
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector(".hero .btn")).getPropertyValue("--b").trim()), "#ffb422");
  assert.equal(await page.locator(".hero .hero-cat .cat").count(), 1);
  await page.setViewportSize({ width: 1280, height: 800 });
  t = await boxes();
  assert.ok(t.status.x >= t.hero.x + t.hero.w, "the status card stands beside the plan");
  assert.ok(Math.abs(t.status.y - t.hero.y) < 4, "both columns start on one line");
  assert.equal(t.tasks.x, t.status.x, "tasks are in the side column");
  assert.equal(t.course.x, t.hero.x, "the course is in the main column");
  assert.ok(t.sw <= t.W);
  assert.deepEqual(errors, []);
  await page.close();
});

test("practice session: the prompt sits on a card, the answer colours the Next button, the result shows three numbers", async () => {
  const { page, errors } = await openApp(browser, "#practice");
  await page.evaluate(() => { XP_FAST_MS = 0; startSession("quiz", "all"); });
  const colour = () => page.evaluate(() => getComputedStyle(document.querySelector("[data-act=next]")).getPropertyValue("--b").trim());
  assert.equal(await page.locator(".q-card .q-word").count(), 1);
  assert.equal(await page.getAttribute("#session", "data-r"), null);
  await page.evaluate(() => document.querySelector('[data-act=answer][data-ok="0"]').click());
  assert.equal(await page.getAttribute("#session", "data-r"), "no");
  assert.equal(await page.locator(".feedback.no").count(), 1);
  assert.equal(await page.locator(".opt.wrong").count(), 1);
  assert.equal(await page.locator(".opt.right").count(), 1);
  assert.equal(await colour(), "#d53b41", "a wrong answer: the red button");
  await page.evaluate(() => document.querySelector("[data-act=next]").click());
  assert.equal(await page.getAttribute("#session", "data-r"), null, "a new step starts neutral");
  await page.evaluate(() => document.querySelector('[data-act=answer][data-ok="1"]').click());
  assert.equal(await page.getAttribute("#session", "data-r"), "ok");
  assert.equal(await colour(), "#0c8352", "a right answer: the green button");
  await page.evaluate(() => document.querySelector("[data-act=next]").click());
  await answerAllRight(page);
  assert.equal(await page.getAttribute("#session", "data-r"), null);
  assert.equal(await page.locator(".result .res-grid > div").count(), 3);
  assert.match(await page.textContent(".result .res-grid"), /\+\d+ XP[\s\S]*bugungi XP[\s\S]*kun ketma-ket/);
  // Other kinds of exercises use the same card
  for (const [mode, u] of [["type", "all"], ["listen", "all"], ["dict", "all"], ["gx", "A1.01"]]) {
    await page.evaluate(([m, u]) => { closeSession(); startSession(m, u); }, [mode, u]);
    assert.equal(await page.locator("#stage .q-card").count(), 1, mode);
  }
  assert.deepEqual(errors, []);
  await page.close();
});

test("lists: a finished ring is a tick; the next course unit is marked", async () => {
  const { page, errors } = await openApp(browser, "#course", { state: { k: { "a1-1": { e: {}, v: {}, done: 1 } } } });
  assert.equal(await page.evaluate(() => pctRing(1).includes("full") && !pctRing(0.99).includes("full")), true);
  assert.equal(await page.locator(".unit.now").count(), 1);
  assert.equal(await page.getAttribute(".unit.now", "href"), "#k-a1-2");
  assert.match(await page.textContent(".unit.now"), /Shu yerdan davom eting/);
  assert.deepEqual(errors, []);
  await page.close();
});

test("theme: the chosen theme also colours the browser bar, at once and after a reload", async () => {
  const { page, errors } = await openApp(browser, "#settings");
  const metas = () => page.evaluate(() => [...document.querySelectorAll('meta[name="theme-color"]')].map(m => m.media + "|" + m.content));
  assert.deepEqual(await metas(), ["(prefers-color-scheme: light)|#f7f4ee", "(prefers-color-scheme: dark)|#0d1124"]);
  await page.click("[data-act=theme][data-v=dark]");
  assert.deepEqual(await metas(), ["|#0d1124", "|#0d1124"]);
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), "rgb(13, 17, 36)");
  await page.reload();
  await page.waitForTimeout(200);
  assert.deepEqual(await metas(), ["|#0d1124", "|#0d1124"], "applied before the first paint");
  await page.click("[data-act=theme][data-v=light]");
  assert.deepEqual(await metas(), ["|#f7f4ee", "|#f7f4ee"]);
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), "rgb(247, 244, 238)");
  await page.click("[data-act=theme][data-v=auto]");
  assert.deepEqual(await metas(), ["(prefers-color-scheme: light)|#f7f4ee", "(prefers-color-scheme: dark)|#0d1124"]);
  // The manifest and the static pages carry the same two colours
  const mf = JSON.parse(read("manifest.webmanifest"));
  assert.equal(mf.background_color, "#f7f4ee");
  for (const f of ["privacy.html", "kurs/a1-1.html"]) { assert.match(read(f), /theme-color" content="#f7f4ee"/, f); assert.match(read(f), /theme-color" content="#0d1124"/, f); }
  assert.deepEqual(errors, []);
  await page.close();
});

test("touch targets: buttons a finger lands on are at least 44px, chips and tabs at least 40px", async () => {
  const { page, errors } = await openApp(browser, "#home");
  const small = async (sel, min) => page.evaluate(([sel, min]) => [...document.querySelectorAll(sel)].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.height < min - 0.5 || r.width < min - 0.5); }).map(e => `${e.className} ${Math.round(e.getBoundingClientRect().width)}×${Math.round(e.getBoundingClientRect().height)}`), [sel, min]);
  for (const h of ["#home", "#course", "#lugat", "#lesson-1", "#grammar", "#practice", "#settings", "#k-a1-1"]) {
    await page.evaluate(h => { location.hash = h; }, h);
    await page.waitForTimeout(120);
    assert.deepEqual(await small("#app .btn, #app .icon-btn, #app .say:not(.mini), #app .back, nav.nav a", 44), [], h);
    assert.deepEqual(await small("#app .chip, #app .seg a, #app .seg button", 40), [], h);
  }
  assert.deepEqual(errors, []);
  await page.close();
});
