// Practice sessions for the four skills, and that each answer is counted for the right skill.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { launch, openApp, answerAllRight } = require("./helpers");

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

// Starts a session the way a learner would: any achievement pop-up from the previous one is dismissed first
const run = (page, mode, u) => page.evaluate(([m, u]) => { closeSheet(true); if (SES) closeSession(); ACH_QUEUE.length = 0; document.getElementById("celebrate").hidden = true; startSession(m, u); }, [mode, u]);
const sk = page => page.evaluate(() => JSON.parse(JSON.stringify(S.sk)));

test("word, writing and listening sessions: all right, counted per skill", async () => {
  const { page, errors } = await openApp(browser, "#practice");
  for (const [mode, u, skills] of [["quiz", "all", ["r"]], ["type", "all", ["w"]], ["listen", "pron", ["l"]], ["dict", "pron", ["l", "w"]], ["lsent", "auto", ["l"]], ["lsent", "a2-7", ["l"]]]) {
    const before = await sk(page);
    await run(page, mode, u);
    const n = await page.evaluate(() => SES.items.length);
    const score = await answerAllRight(page);
    assert.equal(score, `${n}/${n}`, `${mode} ${u}`);
    const after = await sk(page);
    for (const s of skills) assert.ok(after[s][1] > before[s][1], `${mode} should count for ${s}`);
  }
  assert.deepEqual(errors, []);
});

test("rule exercises: a full topic and the free-order sentence task", async () => {
  const { page, errors } = await openApp(browser, "#gx");
  for (const code of ["A1.32", "A2.19", "B1.24", "B2.02"]) {
    await page.evaluate(c => { if (SES) closeSession(); startSession("gx", c); }, code);
    const n = await page.evaluate(() => SES.items.length);
    assert.equal(await answerAllRight(page), `${n}/${n}`, code);
    assert.ok(await page.evaluate(c => gxDone(c), code), `${code} should be marked done`);
  }
  assert.deepEqual(errors, []);
});

test("speaking: words, sentences, oral answers and role play with a fake microphone", async () => {
  const { page, errors } = await openApp(browser, "#practice", { sr: true });
  for (const [mode, u] of [["say", "pron"], ["sayline", "auto"], ["oral", "auto"]]) {
    await run(page, mode, u);
    const n = await page.evaluate(() => SES.items.length);
    assert.equal(await answerAllRight(page), `${n}/${n}`, mode);
  }
  const spec = await page.evaluate(() => { const u = roleUnit(), si = u.sections.findIndex(s => s.kind === "dialog"); return `${u.id}|${si}|${u.sections[si].blocks.flatMap(b => b.dlg || [])[1][0]}`; });
  await run(page, "role", spec);
  const n = await page.evaluate(() => SES.items.length);
  assert.equal(await answerAllRight(page), `${n}/${n}`, "role");
  assert.equal(await page.evaluate(() => S.roles), 1);
  // A wrong answer: letters are marked and a retry is offered
  await run(page, "say", "pron");
  // A sound no target word contains (a real phrase could hide a short target such as "bir")
  await page.evaluate(() => { window.__say = () => "ğğğğ ğğğğ"; });
  await page.click("#mic-btn");
  await page.waitForFunction(() => !REC && SES.tries === 1);
  assert.equal(await page.evaluate(() => SES.answered), false);
  assert.ok(await page.evaluate(() => document.querySelectorAll("#say-target .miss").length > 0));
  // Oral answers are scored by key words, tolerant to suffixes
  assert.equal(await page.evaluate(() => oralScore("Yarım saat koştu.", "yarım saat koştum").score), 1);
  assert.deepEqual(errors, []);
});

test("speech recognition missing: speaking buttons are disabled", async () => {
  const { page, errors } = await openApp(browser, "#practice", { noSR: true });
  assert.equal(await page.evaluate(() => document.querySelector(".sk-tile[data-s=s]").disabled), true);
  assert.deepEqual(errors, []);
});

test("skills dashboard: balance and the weakest skill", async () => {
  const { page, errors } = await openApp(browser, "#skills");
  await run(page, "listen", "pron"); await answerAllRight(page);
  await page.evaluate(() => { closeSession(); location.hash = "#skills"; });
  const r = await page.evaluate(() => { const st = skStats(14); return { bal: skBalance(st), weak: skWeakest(st).id, l: st.l.o }; });
  assert.ok(r.l >= 10);
  assert.equal(r.bal, 0);
  assert.notEqual(r.weak, "l");
  assert.deepEqual(errors, []);
});

test("listening and speaking mistakes go to the notebook and leave it after two right answers", async () => {
  const { page, errors } = await openApp(browser, "#practice", { sr: true });
  // A wrong listening answer
  await run(page, "listen", "pron");
  const tr = await page.evaluate(() => { const w = SES.items[0]; document.querySelector('[data-act=answer][data-ok="0"]').click(); return w.tr; });
  assert.deepEqual(await page.evaluate(() => Object.keys(S.lsm)), ["lw|" + tr]);
  // A failed sentence in the dialog listening exercise and a failed spoken word
  await run(page, "lsent", "a2-7");
  await page.evaluate(() => { const it = SES.items[0]; document.querySelector(`[data-act=ls-ans][data-o="${(it.opts.indexOf(it.t) + 1) % 3}"]`).click(); });
  await run(page, "say", "pron");
  await page.evaluate(() => { window.__say = () => "tamamen yanlış"; });
  for (let i = 0; i < 3; i++) { await page.click("#mic-btn"); await page.waitForFunction(n => !REC && (SES.tries >= n || SES.answered), i + 1); }
  await page.evaluate(() => { window.__say = null; closeSession(); location.hash = "#practice"; });
  await page.waitForTimeout(100);
  assert.deepEqual(await page.evaluate(() => [lsmList("l").length, lsmList("s").length]), [2, 1]);
  assert.ok(await page.evaluate(() => !!document.querySelector('[data-mode=lmis]') && !!document.querySelector('[data-mode=smis]')));
  // Two right rounds empty the notebook
  for (let round = 0; round < 2; round++) {
    await run(page, "lmis", "lmis");
    assert.equal(await page.evaluate(() => SES.items.length), 2);
    assert.equal(await answerAllRight(page), "2/2");
    await run(page, "smis", "smis");
    assert.equal(await answerAllRight(page), "1/1");
  }
  assert.deepEqual(await page.evaluate(() => S.lsm), {});
  assert.deepEqual(errors, []);
});

test("an achievement earned during an exercise waits for the result screen", async () => {
  const { page, errors } = await openApp(browser, "#practice", { state: { achv: { first: "x" }, skv: 1, sk: { r: [0, 0, 0, 0], l: [49, 49, 0, 0], w: [0, 0, 0, 0], s: [0, 0, 0, 0] } } });
  await run(page, "listen", "pron");
  await page.evaluate(() => { document.querySelector('[data-act=answer][data-ok="1"]').click(); });
  await page.waitForTimeout(700);
  assert.equal(await page.evaluate(() => S.achv.listen50 !== undefined), true, "achievement recorded");
  assert.equal(await page.evaluate(() => document.getElementById("celebrate").hidden), true, "no pop-up during the exercise");
  await page.evaluate(() => document.querySelector("[data-act=next]").click());
  await answerAllRight(page);
  await page.waitForTimeout(1100);
  assert.equal(await page.evaluate(() => document.getElementById("celebrate").hidden), false, "pop-up on the result screen");
  assert.deepEqual(errors, []);
});

test("letter bank: written answers are built from tiles — the answer's letters plus 5–6 extra; long answers as words; the keyboard is optional", async () => {
  const { page, errors } = await openApp(browser, "#practice");
  const t = await page.evaluate(() => {
    const a = bankTiles("şekersiz"), b = bankTiles("Bu sabah okula erken gittim"), c = bankTiles("ev");
    const has = (tiles, word) => { const left = tiles.slice(); return [...word].every(ch => { const i = left.indexOf(ch); if (i < 0) return false; left.splice(i, 1); return true; }); };
    return [a.kind, a.tiles.length - 8, has(a.tiles, "şekersiz"), b.kind, ["Bu", "sabah", "okula", "erken", "gittim"].every(w => b.tiles.includes(w)), b.tiles.length > 5, c.tiles.length - 2];
  });
  assert.deepEqual(t, ["l", 6, true, "w", true, true, 5]);
  // Spell a word with the tiles in a writing session and check it
  await run(page, "type", "all");
  // (a short answer comes as letters, a long one as words — the session picks the word at random)
  const [clean, parts, sep] = await page.evaluate(() => {
    const c = SES.items[SES.i].tr.replace(/[?!.,;:…«»"]/g, "").replace(/\s+/g, " ").trim();
    return BANK.kind === "w" ? [c, c.split(" "), " "] : [c, [...c].map(x => x === " " ? "␣" : x), ""];
  });
  await page.evaluate(ps => {
    const used = new Set();
    for (const t of ps) {
      const b = [...document.querySelectorAll("#bank .bk")].find(x => !used.has(x) && x.textContent === t);
      used.add(b); b.click();
    }
  }, parts);
  assert.equal(await page.evaluate(() => $("type-input").value), clean);
  await page.evaluate(() => { document.querySelector("[data-act=bk-del]").click(); document.querySelector("[data-act=bk-del]").click(); });
  assert.equal(await page.evaluate(() => $("type-input").value), parts.slice(0, -2).join(sep).replace(/␣/g, " "));
  assert.equal(await page.getAttribute("#type-input", "inputmode"), "none", "the phone keyboard stays closed");
  await page.evaluate(() => document.querySelector("[data-act=bk-kbd]").click());
  assert.deepEqual(await page.evaluate(() => [$("type-input").getAttribute("inputmode"), $("type-form").classList.contains("kbd")]), ["text", true]);
  assert.deepEqual(errors, []);
  await page.close();
});

test("tiles on pages with many fields: course exercises, the level test and the placement test open a bank under the tapped field", async () => {
  const { page, errors } = await openApp(browser, "#k-a1-1", { state: { onb: 1, place: { applied: "C1" } } });
  await page.evaluate(() => { KTAB = "ex"; route(); });
  // Builds the answer of a field with its tiles (letters or words) and returns [the field's value, inputmode]
  const build = sel => page.evaluate(sel => {
    const inp = typeof sel === "number" ? document.querySelectorAll("input[data-bk]")[sel] : document.querySelector(sel);
    inp.focus();
    const c = inp.dataset.bk.replace(/[?!.,;:…«»"]/g, "").replace(/\s[—–-](?=\s)/g, " ").replace(/\s+/g, " ").trim();
    const parts = IB.kind === "w" ? c.split(" ") : [...c].map(x => x === " " ? "␣" : x), used = new Set();
    for (const t of parts) { const b = [...document.querySelectorAll("#ibank .bk")].find(x => !used.has(x) && x.textContent === t); used.add(b); b.click(); }
    return [inp.value === c, inp.getAttribute("inputmode"), document.querySelectorAll("#ibank").length, document.querySelectorAll("#ibank .bk").length - parts.length];
  }, sel);
  const idx = await page.evaluate(() => { const ins = [...document.querySelectorAll("input[data-bk]")]; return [ins.findIndex(x => x.dataset.bk.split(" ").length < 3 && x.dataset.bk.length > 1), ins.findIndex(x => x.dataset.bk.split(" ").length >= 3)]; });
  assert.ok(idx[0] >= 0 && idx[1] >= 0, "a short and a long answer in the unit");
  const short = await build(idx[0]);
  assert.deepEqual(short.slice(0, 3), [true, "none", 1], "letters; the phone keyboard stays closed; one panel");
  assert.ok(short[3] >= 5, "extra letters");
  const long = await build(idx[1]);
  assert.deepEqual(long.slice(0, 3), [true, "none", 1], "words; the panel moved to the second field");
  assert.ok(long[3] >= 1 && long[3] <= 3, "extra words");
  // ⌫ takes the last tile back; the check accepts the built answer (no punctuation, no dash needed)
  await page.evaluate(() => document.querySelector("[data-act=ibk-del]").click());
  assert.equal(await page.evaluate(() => IB.inp.dataset.bk.replace(/[?!.,;:…]/g, "").trim().startsWith(IB.inp.value) && IB.inp.value.length > 0), true);
  await build(idx[1]).catch(() => {});
  const res = await page.evaluate(i => {
    const inp = document.querySelectorAll("input[data-bk]")[i], key = inp.id, bk = inp.dataset.bk;
    inp.value = bk.replace(/[?!.,;:…«»"]/g, "").replace(/\s[—–-](?=\s)/g, " ").replace(/\s+/g, " ").trim();
    inp.parentElement.querySelector("[data-act=k-check]").click();
    return [document.getElementById(key).closest(".k-item").classList.contains("ok"), ansMatch("Saat kaç Saat üç buçuk", "Saat kaç? — Saat üç buçuk.")];
  }, idx[1]);
  assert.deepEqual(res, [true, 2]);
  // «Klaviatura» gives one field back to typing
  await page.evaluate(() => { const inp = document.querySelector(".k-item:not(.ok) input[data-bk]"); inp.id = "kbd-probe"; inp.focus(); document.querySelector("[data-act=ibk-kbd]").click(); });
  assert.deepEqual(await page.evaluate(() => [document.getElementById("kbd-probe").getAttribute("inputmode"), !!document.getElementById("ibank"), document.activeElement.id]), ["text", false, "kbd-probe"]);
  // The level test and the placement test: the tiles write into the stored answers
  await page.evaluate(() => go("ktest-a1"));
  await page.waitForSelector("input[data-act=kt-w]");
  assert.equal((await build('input[data-act=kt-w][data-i="0"]'))[0], true);
  assert.equal(await page.evaluate(() => ansMatch(KT_ANS.w[0], ktGen("A1").w[0].a) > 0), true);
  await page.evaluate(() => go("placement"));
  await page.waitForFunction(() => document.querySelector("[data-act=pl-start]") || document.querySelector("input[data-act=pl-w]"));
  await page.evaluate(() => { const b = document.querySelector("[data-act=pl-start]"); if (b) b.click(); });
  await page.waitForSelector("input[data-act=pl-w]");
  const sel = await page.evaluate(() => { const inp = document.querySelector("input[data-act=pl-w]:not([disabled])"); return `input[data-act=pl-w][data-i="${inp.dataset.i}"]`; });
  assert.equal((await build(sel))[0], true);
  assert.equal(await page.evaluate(s => { const i = +document.querySelector(s).dataset.i, P = plGet(); return ansMatch(P.ans.w[i], P.it.w[i].a) > 0; }, sel), true);
  assert.deepEqual(errors, []);
  await page.close();
});

test("one mixed practice: a word set mixes the forms; review mixes the four skills; skill tiles start that skill's mix; no duplicate cards", async () => {
  const { page, errors } = await openApp(browser, "#practice", { sr: true, state: { onb: 1, place: { applied: "C1" } } });
  // Known words come in many forms (reading, writing, listening, speaking)
  const kinds = await page.evaluate(() => {
    ALL.slice(0, 60).forEach(w => { S.srs[w.tr] = { i: 3, e: 2.5, d: dayNum() - 1, r: 2, m: 0, w: 0 }; });
    startSession("mix", "all"); const a = new Set(SES.items.map(x => x._m)); closeSession();
    startSession("review"); const r = new Set(SES.items.map(() => 0).map((_, i) => { SES.i = i; return itemMode(SES.items[i]); })); SES.i = 0; closeSession();
    return [a.size, r.size, [...r].every(m => ["quiz", "type", "listen", "dict", "say", "cards"].includes(m))];
  });
  assert.ok(kinds[0] >= 3, `mix forms: ${kinds[0]}`);
  assert.ok(kinds[1] >= 3, `review forms: ${kinds[1]}`);
  assert.equal(kinds[2], true);
  for (const m of ["mix", "mix-l", "mix-w", "mix-s"]) {
    await page.evaluate(() => { XP_FAST_MS = 0; });
    await run(page, m, "all");
    const n = await page.evaluate(() => SES.items.length);
    assert.equal(await answerAllRight(page), `${n}/${n}`, m);
  }
  await page.evaluate(() => { closeSession(); ACH_QUEUE.length = 0; document.getElementById("celebrate").hidden = true; });
  // Practice page: skill tiles start the mixed skill practice; the separate kinds sit in one sheet; no "by topic" card
  await page.evaluate(() => { location.hash = "#practice"; route(); });
  assert.equal(await page.evaluate(() => /Mavzu boʻyicha soʻz mashqi/.test(document.getElementById("app").textContent)), false);
  await page.evaluate(() => document.querySelector('.sk-tile[data-s="w"]').click());
  assert.equal(await page.evaluate(() => SES && SES.mode), "mix-w");
  await page.evaluate(() => { closeSession(); document.querySelector('[data-act="modes-all"]').click(); });
  assert.equal(await page.locator("#sheet .mode").count(), 3);
  // A word set: the mixed practice first, the single kinds folded
  await page.evaluate(() => { closeSheet(true); modeSheet("all", "Hammasi"); });
  assert.equal(await page.getAttribute("#sheet .mode >> nth=0", "data-mode"), "mix");
  assert.equal(await page.locator("#sheet details.mode-more .mode").count(), 6);
  assert.deepEqual(errors, []);
  await page.close();
});
