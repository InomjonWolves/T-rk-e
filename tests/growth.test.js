// Growth tools: the daily Telegram post (tools/telegram.js) and its workflow.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { ROOT } = require("./helpers");
const { post } = require("../tools/telegram.js");

test("telegram: a different word every day, a link to the site only, no forbidden words, valid HTML tags", () => {
  const bad = /\bTYS\b|\b(asker|askeri|komutan|kışla|nöbet|tatbikat)\b/i;
  const seen = new Set();
  for (let d = 0; d < 60; d++) {
    const t = post(new Date(Date.UTC(2026, 10, 1) + d * 864e5));
    assert.match(t, /Kunning so'zi/);
    assert.match(t, /https:\/\/turkceyol\.web\.app\//);
    assert.ok(!bad.test(t), t);
    assert.ok(t.length < 1000);
    // Only <b> and <i>, balanced
    const tags = t.match(/<\/?[a-z]+>/g) || [];
    assert.ok(tags.every(x => /^<\/?[bi]>$/.test(x)), tags.join());
    assert.equal(tags.filter(x => !x.startsWith("</")).length, tags.filter(x => x.startsWith("</")).length);
    seen.add(t.split("\n")[2]);
  }
  assert.ok(seen.size >= 55, `only ${seen.size} different words in 60 days`);
  const wf = fs.readFileSync(path.join(ROOT, ".github/workflows/telegram.yml"), "utf8");
  assert.match(wf, /TELEGRAM_BOT_TOKEN/);
  assert.match(wf, /node tools\/telegram\.js/);
});
