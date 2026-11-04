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
  assert.match(wf, /node tools\/telegram-bot\.js/);
  assert.match(wf, /grammar-ex\.js/, "the fallback needs the grammar exercises for /test");
});

const { quiz, one, pollBody, weekNo, LEVELS } = require("../tools/quiz.js");

test("weekly quiz: 5 valid Telegram quiz polls, level rotates every week, no forbidden words", () => {
  const bad = /\bTYS\b|\b(asker|askeri|komutan|kışla|nöbet|tatbikat)\b/i;
  const lvs = new Set(), firsts = new Set();
  for (let w = 0; w < 24; w++) {
    const d = new Date(Date.UTC(2026, 10, 7) + w * 7 * 864e5); // Saturdays
    const q = quiz(d);
    lvs.add(q.lv);
    assert.equal(q.polls.length, 5);
    assert.deepEqual(q.polls.map(p => p.kind), ["word", "rule", "word", "rule", "word"]);
    assert.match(q.intro, /Haftalik viktorina/);
    assert.match(q.outro, /https:\/\/turkceyol\.web\.app\//);
    assert.equal(new Set(q.polls.filter(p => p.code).map(p => p.code)).size, 2, "two different grammar topics");
    for (const p of q.polls) {
      assert.equal(p.lv, q.lv);
      assert.ok(p.question.length <= 300 && p.question.length > 0, p.question);
      assert.ok(p.options.length >= 2 && p.options.length <= 10);
      assert.ok(p.options.every(o => o.length >= 1 && o.length <= 100));
      assert.equal(new Set(p.options).size, p.options.length, "options are distinct");
      assert.ok(p.correct >= 0 && p.correct < p.options.length);
      assert.ok(p.explanation.length > 0 && p.explanation.length <= 200);
      assert.ok(!bad.test(p.question + p.options.join() + p.explanation));
      const b = pollBody("@x", p);
      assert.equal(b.type, "quiz"); assert.equal(b.is_anonymous, true);
      assert.deepEqual(b.options.map(o => o.text), p.options);
    }
    firsts.add(q.polls[0].question);
    // The same week always gives the same quiz
    assert.deepEqual(quiz(new Date(d.getTime() - 3 * 864e5)), q);
  }
  assert.deepEqual([...lvs].sort(), LEVELS);
  assert.ok(firsts.size >= 20, "different questions every week");
  assert.equal(weekNo(new Date(Date.UTC(2026, 10, 2))), weekNo(new Date(Date.UTC(2026, 10, 8))), "Mon..Sun is one week");
  // Bot /test: one quiz poll
  const r = reply("/test", new Date(123456789));
  assert.ok(r.poll && r.poll.options.length >= 2 && r.poll.correct >= 0);
  assert.ok(one(1).question !== one(99999).question || one(1).options.join() !== one(99999).options.join());
  assert.match(reply("/yordam").text, /\/test/);
  const tg = fs.readFileSync(path.join(ROOT, "tools/telegram.js"), "utf8");
  assert.match(tg, /getUTCDay\(\) === 6/);
  assert.match(tg, /sendPoll/);
});

const { handle, hookSecret } = require("../tools/telegram-bot.js");

test("bot webhook: the Vercel function answers in the webhook response, checks the secret, ignores what is not a private message", async () => {
  const now = Date.UTC(2026, 10, 4, 10);
  const msg = (text, extra = {}) => ({ update_id: 5, message: Object.assign({ message_id: 1, date: now / 1000 - 5, chat: { id: 42, type: "private" }, text }, extra) });
  const a = handle(msg("kitap"), now);
  assert.equal(a.method, "sendMessage"); assert.equal(a.chat_id, 42); assert.equal(a.parse_mode, "HTML");
  assert.match(a.text, /kitob/);
  const s = handle(msg("/start"), now);
  assert.equal(s.reply_markup.inline_keyboard[0][0].web_app.url, "https://turkceyol.web.app/");
  const p = handle(msg("/test"), now);
  assert.equal(p.method, "sendPoll"); assert.equal(p.type, "quiz"); assert.equal(p.chat_id, 42);
  assert.ok(p.options.length >= 2 && p.correct_option_id >= 0);
  assert.equal(handle(msg("salom", { chat: { id: -1, type: "group" } }), now), null, "groups are ignored");
  assert.equal(handle(msg("kitap", { date: now / 1000 - 2 * 86400 }), now), null, "old messages are ignored");
  assert.equal(handle({ update_id: 6 }, now), null);
  assert.equal(handle(null, now), null);
  assert.match(hookSecret("123:abc"), /^[0-9a-f]{48}$/);
  assert.notEqual(hookSecret("123:abc"), hookSecret("123:abd"));
  assert.ok(!hookSecret("123:abc").includes("abc"));

  // The function itself, from the folder that is deployed to Vercel, with a fake req/res
  const tmp = fs.mkdtempSync(path.join(require("os").tmpdir(), "bot-"));
  const dir = require("../tools/bot-deploy.js").assemble(tmp);
  for (const f of ["api/telegram.js", "vercel.json", "package.json", "tools/telegram-bot.js", "tools/quiz.js", "content.js", "lugat.js", "grammar-ex.js"]) assert.ok(fs.existsSync(path.join(dir, f)), f);
  const fn = require(path.join(dir, "api/telegram.js"));
  const call = async (req) => { const res = { code: 0, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; }, send(b) { this.body = b; return this; } }; await fn(req, res); return res; };
  process.env.TG_SECRET = "s3cret";
  const ok = await call({ method: "POST", headers: { "x-telegram-bot-api-secret-token": "s3cret" }, body: msg("kitap", { date: Math.floor(Date.now() / 1000) }) });
  assert.equal(ok.code, 200); assert.equal(ok.body.method, "sendMessage"); assert.match(ok.body.text, /kitob/);
  const str = await call({ method: "POST", headers: { "x-telegram-bot-api-secret-token": "s3cret" }, body: JSON.stringify(msg("/soz", { date: Math.floor(Date.now() / 1000) })) });
  assert.match(str.body.text, /Kunning so'zi/, "a string body is parsed too");
  assert.equal((await call({ method: "POST", headers: {}, body: msg("kitap") })).code, 401);
  assert.equal((await call({ method: "POST", headers: { "x-telegram-bot-api-secret-token": "wrong" }, body: msg("kitap") })).code, 401);
  assert.deepEqual((await call({ method: "POST", headers: { "x-telegram-bot-api-secret-token": "s3cret" }, body: { update_id: 1 } })).body, {});
  assert.equal((await call({ method: "GET", headers: {} })).code, 200);
  delete process.env.TG_SECRET;
  assert.equal((await call({ method: "POST", headers: { "x-telegram-bot-api-secret-token": "" }, body: msg("kitap") })).code, 401, "no secret configured → refuse");
  fs.rmSync(tmp, { recursive: true, force: true });

  // Deploy: the function gets every file it reads, the site does not publish bot/
  const vj = JSON.parse(fs.readFileSync(path.join(ROOT, "bot/vercel.json"), "utf8"));
  const inc = vj.functions["api/telegram.js"].includeFiles;
  for (const f of ["content.js", "lugat.js", "grammar-ex.js", "tools/**"]) assert.ok(inc.includes(f), f);
  const dep = fs.readFileSync(path.join(ROOT, "tools/bot-deploy.js"), "utf8");
  for (const f of ["telegram.js", "telegram-bot.js", "quiz.js", "content.js", "lugat.js", "grammar-ex.js"]) assert.ok(dep.includes(`"${f}"`), f);
  assert.match(dep, /setWebhook/); assert.match(dep, /secret_token/);
  const wf = fs.readFileSync(path.join(ROOT, ".github/workflows/telegram-bot-deploy.yml"), "utf8");
  assert.match(wf, /VERCEL_TOKEN/); assert.match(wf, /node tools\/bot-deploy\.js/);
  assert.ok(JSON.parse(fs.readFileSync(path.join(ROOT, "firebase.json"), "utf8")).hosting.ignore.includes("bot/**"));
});
