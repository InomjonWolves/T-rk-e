// The Cyrillic interface (js/kirill.js): Uzbek in Cyrillic, Turkish left in Latin, answers typed in Cyrillic accepted,
// switching back restores the Latin text, the lexicon (kirill-lex.js) matches the site's texts
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { ROOT, launch, openApp } = require("./helpers");

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });
const CYR = { init: () => localStorage.setItem("ty-abc", "cyr"), state: { place: { applied: "C1" } } };

test("cyrillic: letters, Turkish words kept, lists, suffixes, names and numbers, typed Cyrillic read as Latin", async () => {
  const { page, errors } = await openApp(browser, "#home");
  await page.evaluate(() => krLoadLex());
  await page.waitForFunction(() => typeof KLEX !== "undefined");
  const r = await page.evaluate(() => {
    const words = ["oʻqish", "gʻalaba", "yoʻl", "Toshkent", "yaxshi", "eslab", "maʼno", "Shahar", "SHAHAR", "kuyov", "yetti", "choy", "Yangi"].map(latCyr);
    const texts = [
      "Yoʻgʻon (qalin) unlilar: a, ı, o, u.", "Koʻplik -lar/-ler", "Kelasi zamon (-adi)", "1-boʻlim · A1 → C1 · 40 XP", "tez-tez",
      "Türkçe Yoʻl", "Bot @TurkceYolBot", "«Geçen hafta sonu» mavzusida 8–10 gap yozing.", "-yor hech qachon oʻzgarmaydi",
      "Dilnoza, Jasur, Defne va Pamuk bilan", "Ankara'ya, Türkiye'ye"
    ].map(t => krText(t, false));
    return { words, texts, mix: krText("a yoki ı", "mix"), mixTr: krText("Bu kitap çok güzel.", "mix"),
      back: ["ўқиш", "Тошкент", "Ғалаба", "ёки"].map(cyrLat), fold: fold("Китоб") === fold("kitob") && ansNorm("ўқиш") === ansNorm("oʻqish") };
  });
  assert.deepEqual(r.words, ["ўқиш", "ғалаба", "йўл", "Тошкент", "яхши", "эслаб", "маъно", "Шаҳар", "ШАҲАР", "куёв", "етти", "чой", "Янги"]);
  assert.deepEqual(r.texts, [
    "Йўғон (қалин) унлилар: a, ı, o, u.", "Кўплик -lar/-ler", "Келаси замон (-ади)", "1-бўлим · A1 → C1 · 40 XP", "тез-тез",
    "Türkçe Yoʻl", "Бот @TurkceYolBot", "«Geçen hafta sonu» мавзусида 8–10 гап ёзинг.", "-yor ҳеч қачон ўзгармайди",
    "Дилноза, Жасур, Дефне ва Памук билан", "Ankara'ya, Türkiye'ye"
  ]);
  assert.equal(r.mix, "a ёки ı");
  assert.equal(r.mixTr, "Bu kitap çok güzel.");
  assert.deepEqual(r.back, ["oʻqish", "Toshkent", "Gʻalaba", "yoki"]);
  assert.ok(r.fold);
  assert.deepEqual(errors, []);
});

test("cyrillic page: menu and pages in Cyrillic, Turkish lines and table columns in Latin, switch back and forth", async () => {
  const { page, errors } = await openApp(browser, "#home", CYR);
  await page.waitForSelector(".nav");
  assert.equal(await page.evaluate(() => document.documentElement.lang), "uz-Cyrl");
  assert.match(await page.textContent(".nav"), /Асосий.*Дарслар.*Машқ.*Рейтинг.*Профил/s);
  // No Uzbek word (with an Uzbek letter) is left in Latin on the main pages, and no Turkish line is touched
  for (const h of ["#home", "#practice", "#settings", "#course", "#skills", "#k-a1-2"]) {
    await page.evaluate(x => { location.hash = x; }, h);
    await page.waitForTimeout(h === "#k-a1-2" ? 1500 : 400);
    const left = await page.evaluate(() => {
      const out = [], w = document.createTreeWalker(document.getElementById("app"), NodeFilter.SHOW_TEXT);
      for (let x = w.nextNode(); x; x = w.nextNode()) {
        if (krSkip(x.parentNode)) continue;
        for (const m of x.data.replace(/Türkçe Yoʻl|@\w+/g, "").match(/[A-Za-zʻʼ]+/g) || []) if (/[ʻʼqx]|sh|ch/i.test(m) && krKind(m) !== "k") out.push(m);
      }
      return out;
    });
    assert.deepEqual(left, [], h);
  }
  // Course unit: dialog lines and the Turkish column of a grammar table stay in Latin
  await page.evaluate(() => { KTAB = "grammar"; route(); });
  const cells = await page.evaluate(() => [...document.querySelectorAll(".k-table")][0].querySelectorAll("td").length && [...[...document.querySelectorAll(".k-table")][0].querySelectorAll("tr")][1].innerText);
  assert.match(cells, /ben/);
  assert.match(cells, /мен/);
  await page.evaluate(() => { KTAB = "dialog"; route(); });
  assert.doesNotMatch(await page.evaluate(() => [...document.querySelectorAll('[lang="tr"]')].map(e => e.textContent).join(" ")), /[а-яўқғҳ]/i);
  // Back to Latin from Settings, and to Cyrillic again
  await page.evaluate(() => { location.hash = "#settings"; });
  await page.waitForSelector("[data-act=abc][data-v=lat]");
  await page.click("[data-act=abc][data-v=lat]");
  assert.match(await page.textContent(".nav"), /Asosiy/);
  assert.equal(await page.evaluate(() => localStorage.getItem("ty-abc")), "lat");
  await page.click("[data-act=abc][data-v=cyr]");
  assert.match(await page.textContent(".nav"), /Асосий/);
  // The sign-in screen has the switch too
  await page.evaluate(() => { $("auth").hidden = false; });
  assert.equal(await page.textContent(".abc-flip"), "Lotincha");
  await page.click(".abc-flip");
  assert.equal(await page.textContent(".abc-flip"), "Кириллча");
  assert.match(await page.textContent(".auth-hero"), /Turk tilini/);
  assert.deepEqual(errors, []);
});

test("cyrillic lexicon is up to date (npm run build)", async () => {
  const { build } = require("../tools/kirill-lex.js");
  assert.equal(fs.readFileSync(path.join(ROOT, "kirill-lex.js"), "utf8"), await build(), "kirill-lex.js eskirgan: npm run build");
});
