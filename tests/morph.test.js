// The word analyser (morph.js): root + suffixes of any Turkish word, the correct form of a misspelt suffix,
// tappable words in texts, smarter spelling in the writing check, suffix practice aimed at the learner's weak rule
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { launch, openApp } = require("./helpers");

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });
const C1 = { place: { applied: "C1" } };

test("analyser: roots and suffixes, irregular forms, generation, and the site's own texts are understood", async () => {
  const { page, errors } = await openApp(browser, "#home");
  await page.evaluate(() => Promise.all([loadMorph(), loadCourse(), loadOq()]));
  const an = await page.evaluate(() => {
    const top = w => { const r = Morph.parse(w)[0]; return r ? r.lem + r.parts.map(p => "+" + (p.s || "") + ":" + p.t).join("") : null; };
    return ["evlerimizden", "kitabıma", "geliyorum", "gelmiyorum", "başlıyor", "söylüyorsun", "gidiyor", "gelemedim", "bana", "onunla", "evdeki", "bugünkü", "suyu", "şehrin", "diyor", "gelmez", "güzeldir", "öğrenciyim", "İzmir'de", "yapılır", "geliyorlardı", "hâlinde"].map(top);
  });
  assert.deepEqual(an, ["ev+ler:PL+imiz:P1p+den:ABL", "kitap+ım:P1s+a:DAT", "gelmek+iyor:PROG+um:S1s", "gelmek+m:NEG+iyor:PROG+um:S1s", "başlamak+ıyor:PROG", "söylemek+üyor:PROG+sun:S2s", "gitmek+iyor:PROG", "gelmek+eme:INAB+di:PAST+m:S1s",
    "ben+:DAT", "o+:INS", "ev+de:LOC+ki:KI", "bugün+kü:KI", "su+u:P3s", "şehir+in:GEN", "demek+yor:PROG", "gelmek+me:NEG+z:NAOR", "güzel+dir:DIR", "öğrenci+yim:S1s", "izmir+de:LOC", "yapmak+ıl:PASS+ır:AOR", "gelmek+iyor:PROG+lar:S3p+dı:CPST", "hâl+i:P3s+nde:LOC"]);
  // Both readings of an ambiguous word are offered
  assert.deepEqual(await page.evaluate(() => Morph.parse("evi").map(r => r.parts.map(p => p.t).join("+")).sort()), ["ACC", "P3s"]);
  // The generator writes the form by the rules
  const built = await page.evaluate(() => [["ev", ["PL", "P1p", "ABL"]], ["kitap", ["P1s", "DAT"]], ["gitmek", ["PROG", "S1s"], "v"], ["başlamak", ["NEG", "PROG", "S2s"], "v"], ["şehir", ["P3s"]], ["su", ["P3s"]], ["okumak", ["FUT", "S1s"], "v"], ["demek", ["PROG"], "v"], ["çocuk", ["GEN"]], ["sınıf", ["LOC"]], ["araba", ["DAT"]], ["gelmek", ["NEG", "NAOR"], "v"], ["saat", ["P3s"]]].map(([l, t, p]) => Morph.build(l, t, p)));
  assert.deepEqual(built, ["evlerimizden", "kitabıma", "gidiyorum", "başlamıyorsun", "şehri", "suyu", "okuyacağım", "diyor", "çocuğun", "sınıfta", "arabaya", "gelmez", "saati"]);
  // A misspelt suffix gets its correct form and the broken rule; real words the dictionary does not know are left alone
  const fixes = await page.evaluate(() => ["evlar", "evda", "okulde", "gitiyor", "kitapda", "kitapı", "arabaa", "evye", "şehirin", "geliyorim", "yapacakım"].map(w => { const f = Morph.fix(w); return f ? f.fix + ":" + f.kind : null; }));
  assert.deepEqual(fixes, ["evler:h", "evde:h", "okulda:h", "gidiyor:s", "kitapta:c", "kitabı:s", "arabaya:y", "eve:y", "şehrin:d", "geliyorum:h", "yapacağım:s"]);
  assert.deepEqual(await page.evaluate(() => ["beklenti", "antik", "adli", "ani", "asli", "anten", "evler", "televizyoncu", "abrakadabra"].map(w => Morph.fix(w))), Array(9).fill(null));
  // Every text of the site: nearly all words are analysed, and none of them is "corrected"
  const cov = await page.evaluate(() => {
    const texts = [];
    COURSE.units.forEach(u => { if (u.reading && u.reading.text) texts.push(u.reading.text); (u.sections || []).forEach(s => (s.blocks || []).forEach(b => (b.dlg || []).forEach(([, t]) => texts.push(t)))); });
    OQ.forEach(t => texts.push(t.text));
    const seen = new Set(); let n = 0, ok = 0; const fixed = [];
    texts.join(" ").replace(MW_RE, w => { const k = Morph.strip(w); if (!k || seen.has(k)) return w; seen.add(k); n++; if (Morph.parse(k).length) ok++; else { const f = Morph.fix(k); if (f) fixed.push(k + ">" + f.fix); } return w; });
    return { n, share: ok / n, fixed };
  });
  assert.ok(cov.n > 3000, "words checked: " + cov.n);
  assert.ok(cov.share > 0.985, "analysed: " + cov.share);
  assert.deepEqual(cov.fixed, []);
  assert.deepEqual(errors, []);
});

test("tap a word in a text: a sheet with the root, every suffix and its Uzbek twin; phrases; unknown words", async () => {
  const { page, errors } = await openApp(browser, "#oqish", { state: C1 });
  await page.evaluate(() => loadOq().then(() => { location.hash = "#oqish-" + OQ[0].id; }));
  await page.waitForSelector(".oq-text .mw");
  assert.ok(await page.locator(".mw-hint").count(), "a hint under the text");
  // The page still shows the text exactly as written
  assert.equal(await page.evaluate(() => document.querySelector(".oq-text").innerText.replace(/\s+/g, " ").trim() === OQ[0].text.replace(/\s+/g, " ").trim()), true);
  // The analyser is loaded on the first tap
  assert.equal(await page.evaluate(() => MORPH_OK), false);
  const tapped = await page.evaluate(() => { const el = document.querySelectorAll(".oq-text .mw")[2]; el.click(); return el.textContent; });
  await page.waitForSelector("#sheet:not([hidden]) .mw-sheet");
  const s1 = await page.evaluate(() => ({ head: document.querySelector(".mw-head b").textContent, on: document.querySelectorAll(".mw.on").length, rows: document.querySelectorAll(".mw-rows .mw-row").length, say: !!document.querySelector(".mw-head [data-act=say]") }));
  assert.equal(s1.head, tapped.toLocaleLowerCase("tr").replace(/[’']+$/, "")); assert.equal(s1.on, 1); assert.ok(s1.rows >= 1, "the root row"); assert.equal(s1.say, true);
  await page.evaluate(() => document.querySelector(".mw-sheet [data-act=sheet-x]").click());
  assert.equal(await page.evaluate(() => document.getElementById("sheet").hidden), true);
  // A long word: every suffix on its own row with the Uzbek equivalent
  const rows = await page.evaluate(() => { openSheet(mwSheet(["Çok", "teşekkür", "ediyorum"], 2)); return { rows: [...document.querySelectorAll(".mw-rows:not(.mw-alt .mw-rows) .mw-row")].map(r => r.querySelector("b").textContent + "|" + r.querySelector("span").textContent), phrase: document.querySelector(".mw-phrase").textContent }; });
  assert.equal(rows.rows.length, 3);
  assert.match(rows.rows[0], /^ed\|etmek — /); assert.match(rows.rows[1], /^-iyor\|hozirgi zamon.*-yap-/); assert.match(rows.rows[2], /^-um\|shaxs: men/);
  assert.match(rows.phrase, /teşekkür etmek/);
  const more = await page.evaluate(() => { openSheet(mwSheet(["Xyzqw"], 0)); const a = document.querySelector(".mw-sheet").textContent; openSheet(mwSheet(["gel"], 0)); const b = document.querySelector(".mw-rows").textContent; openSheet(mwSheet(["evi"], 0)); return [a, b, !!document.querySelector(".mw-alt")]; });
  assert.match(more[0], /lugʻatimizda hali yoʻq.*ism yoki joy nomi/); assert.match(more[1], /buyruq: sen/); assert.equal(more[2], true);
  // Course dialogues and reading texts are tappable too
  await page.evaluate(async () => { closeSheet(); await loadCourse(); KTAB = "dialog"; location.hash = "#k-" + COURSE.units[1].id; });
  await page.waitForSelector(".bubble .mw");
  await page.evaluate(() => document.querySelector(".bubble .mw").click());
  await page.waitForSelector("#sheet:not([hidden]) .mw-sheet");
  assert.equal(await page.evaluate(() => { closeSheet(); KTAB = "read"; route(); return document.querySelectorAll(".k-read .mw").length > 20 && !!document.querySelector(".mw-hint"); }), true);
  assert.deepEqual(errors, []);
});

test("writing check and written answers: a wrong suffix is named by its rule; the tip offers practice built for it", async () => {
  const { page, errors } = await openApp(browser, "#home", { state: C1 });
  await page.evaluate(() => Promise.all([loadMorph(), loadCourse(), loadGram()]));
  // The free-writing check: «evlar» → «evler» with the rule; names and correct words are not touched
  const r = await page.evaluate(() => {
    const u = COURSE.units[0], e = u.exercises.find(x => /yoz/i.test(x.title)) || u.exercises[u.exercises.length - 1];
    return wrCheck("Benim evlar çok güzel. Ben okulde çalışıyorum. Dilnoza İzmir'de yaşıyor. Arkadaşlarım kitapları okuyor.", { u, e }).spell.map(s => [s.w, s.fix, s.kind, s.why]);
  });
  assert.deepEqual(r, [["evlar", "evler", "h", "unli uygʻunligi"], ["okulde", "okulda", "h", "unli uygʻunligi"]]);
  // Written answers: which rule was broken, or which suffix was missed
  const log = await page.evaluate(() => {
    S.mor = {};
    morLog("evler", "evlar", false); morLog("kitapta", "kitapda", false); morLog("çocuğu", "çocuku", false); morLog("arabaya", "arabaa", false);
    morLog("şehri", "şehiri", false); morLog("evden", "evde", false); morLog("geliyorum", "geliyorsun", false); morLog("kitap", "defter", false);
    return JSON.parse(JSON.stringify(S.mor));
  });
  assert.deepEqual(log, { h: 1, c: 1, s: 1, y: 1, d: 1, "t:ABL": 1, "t:S1s": 1 });
  // Right answers wear the count down; three slips of one kind bring the tip and a practice aimed at that rule
  const tip = await page.evaluate(() => {
    morLog("evden", "evden", true); const a = S.mor["t:ABL"];
    S.mor = { s: 4 }; const rec = recs().find(x => x.id === "mor");
    S.mor = { h: 2 }; const none = recs().some(x => x.id === "mor"); S.mor = { s: 4 };
    return { a, t: rec && rec.t, why: rec && rec.why, none };
  });
  assert.equal(tip.a, undefined); assert.equal(tip.t, "Qoʻshimchalar mashqi"); assert.match(tip.why, /undosh yumshashi boʻyicha 4 marta/); assert.equal(tip.none, false);
  await page.evaluate(() => { location.hash = "#practice"; route(); });
  await page.waitForSelector(".recs");
  assert.ok(await page.locator(".recs [data-id=mor]").count(), "the tip is on the practice page");
  assert.deepEqual(errors, []);
});

test("suffix practice: a root and the suffixes to add, checked by the generator; the dictionary's progress is not touched", async () => {
  const { page, errors } = await openApp(browser, "#practice", { state: Object.assign({ mor: { s: 4 } }, C1) });
  assert.ok(await page.locator(".lrow[data-mode=morf]").count(), "the entry on the practice page");
  await page.evaluate(() => { XP_FAST_MS = 0; startSession("morf", "s"); });
  await page.waitForSelector(".mor-need");
  const it = await page.evaluate(() => SES.items.map(x => ({ tr: x.tr, ok: Morph.build(x.lem, x.tags, x.pos) === x.tr, soft: /[bcdğ]/.test(x.tr.slice(x.an.root.length - 1, x.an.root.length)) })));
  assert.equal(it.length, 8); assert.ok(it.every(x => x.ok)); assert.ok(it.every(x => x.soft), "every item practises the softening: " + it.map(x => x.tr).join(" "));
  const srs = await page.evaluate(() => JSON.stringify(S.srs || {}));
  // A wrong answer names the rule and is logged; the tiles write the right one
  const wrong = await page.evaluate(() => { const w = SES.items[0], bad = (w.pos === "v" ? w.lem.slice(0, -3) : w.lem) + w.an.parts.map(p => p.s).join(""); document.getElementById("type-input").value = bad; checkMor(); return { fb: document.getElementById("fb").textContent, cls: document.getElementById("fb").className, mor: S.mor.s, n: SES.items.length }; });
  assert.match(wrong.fb, /Toʻgʻri javob:.*p, ç, t, k → b, c, d, ğ/); assert.match(wrong.cls, /no/); assert.equal(wrong.mor, 5); assert.equal(wrong.n, 9, "asked once more at the end");
  for (let i = 1; i < 9; i++) {
    await page.evaluate(() => document.querySelector("[data-act=next]").click());
    await page.waitForSelector(".mor-need");
    await page.evaluate(() => { document.getElementById("type-input").value = SES.items[SES.i].tr; checkMor(); });
    assert.match(await page.evaluate(() => document.getElementById("fb").className), /ok/);
  }
  await page.evaluate(() => document.querySelector("[data-act=next]").click());
  await page.waitForFunction(() => SES && SES.done);
  const end = await page.evaluate(() => ({ kind: sesKind(SES.mode), right: SES.right, srs: JSON.stringify(S.srs || {}), mor: S.mor.s || 0, w: S.sk.w[1] }));
  assert.equal(end.kind, "grammar"); assert.equal(end.right, 8); assert.equal(end.srs, srs); assert.ok(end.mor < 5, "right answers wear the slips down"); assert.equal(end.w, 9);
  // Without a focus the practice mixes nouns and verbs
  const mix = await page.evaluate(() => { const a = morItems("", 30); return [a.some(x => x.pos === "n"), a.some(x => x.pos === "v"), a.every(x => Morph.build(x.lem, x.tags, x.pos) === x.tr)]; });
  assert.deepEqual(mix, [true, true, true]);
  assert.deepEqual(errors, []);
});
