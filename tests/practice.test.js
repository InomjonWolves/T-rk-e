// Practice sessions for the four skills, and that each answer is counted for the right skill.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { launch, openApp, answerAllRight } = require("./helpers");

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

const run = (page, mode, u) => page.evaluate(([m, u]) => { closeSheet(true); if (SES) closeSession(); startSession(m, u); }, [mode, u]);
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
  await page.evaluate(() => { window.__say = () => "yanlış bir şey"; });
  await page.click("#mic-btn"); await page.waitForTimeout(120);
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
