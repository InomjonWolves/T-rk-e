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

const { reply, lookup } = require("../tools/telegram-bot.js");

test("bot: /start opens the site as a Mini App, /soz is the word of the day, a word gets its translation", () => {
  const s = reply("/start");
  assert.match(s.text, /Türkçe Yo'l/);
  assert.equal(s.reply_markup.inline_keyboard[0][0].web_app.url, "https://turkceyol.web.app/");
  assert.equal(s.reply_markup.inline_keyboard[1][0].url, "https://t.me/turkceyoluz");
  assert.match(reply("/soz").text, /Kunning so'zi/);
  assert.match(reply("/kurs").text, /turkceyol\.web\.app\/kurs\//);
  assert.match(reply("/yordam").text, /\/soz/);
  assert.match(reply("/nimadir").text, /\/soz/, "unknown command → help");
  assert.match(reply("kitap").text, /<b>kitap<\/b> — kitob/);
  assert.match(reply("Kitap!").text, /kitob/, "case and punctuation do not matter");
  assert.ok(lookup("salom").some(r => r.tr === "Merhaba"), "Uzbek → Turkish");
  assert.match(reply("qwrtzx").text, /topilmadi/);
  assert.ok(lookup("kita").length <= 5);
  // Replies are valid Telegram HTML: only <b> and <i>
  for (const q of ["/start", "/soz", "/kurs", "/yordam", "kitap", "<script>"]) {
    const tags = reply(q).text.match(/<\/?[a-z]+>/g) || [];
    assert.ok(tags.every(x => /^<\/?[bi]>$/.test(x)), q + ": " + tags.join());
  }
  const wf = fs.readFileSync(path.join(ROOT, ".github/workflows/telegram-bot.yml"), "utf8");
  assert.match(wf, /cron: "\*\/5 \* \* \* \*"/);
  assert.match(wf, /node tools\/telegram-bot\.js/);
});
