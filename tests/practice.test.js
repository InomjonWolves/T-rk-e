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
  assert.equal(await page.evaluate(() => document.querySelector("[data-act=speak-modes]").disabled), true);
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
