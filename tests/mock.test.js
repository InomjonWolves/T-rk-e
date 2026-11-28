// Imtihon sinovi (mock.js + js/exam.js): the tests' data, the whole run section by section (clock, listening limit,
// answers kept over a reload), scoring 0–75 with a level, the review, XP and S.mk, single-section runs
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { ROOT, launch, openApp } = require("./helpers");

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

const MOCK = vm.runInNewContext(fs.readFileSync(path.join(ROOT, "mock.js"), "utf8") + ";MOCK", {});
const VOICES = JSON.parse(fs.readFileSync(path.join(ROOT, "tools", "audio-voice.json"), "utf8"));

test("mock: four sections, valid answers, explanations, speakers with voices, task patterns", () => {
  const sc = MOCK.scale;
  assert.equal(sc.max, 75);
  sc.bands.forEach(([lv, min], i) => { assert.ok(min > 0 && min < sc.max, lv); if (i) assert.ok(min < sc.bands[i - 1][1], "bands go down"); });
  assert.equal(new Set(MOCK.tests.map(t => t.id)).size, MOCK.tests.length);
  for (const t of MOCK.tests) {
    assert.match(t.id, /^[a-z0-9]+$/);
    assert.ok(t.tr && t.uz);
    // The multilevel exam's frame: listening 45 minutes, reading 60, writing 60 (three tasks), 35 questions each
    assert.deepEqual([t.l.min, t.r.min, t.w.min, t.w.tasks.length], [45, 60, 60, 3], t.id);
    for (const sec of ["l", "r"]) {
      assert.ok(t[sec].min > 0 && t[sec].parts.length >= 3, `${t.id} ${sec}`);
      let n = 0;
      for (const p of t[sec].parts) {
        assert.ok(p.t && p.d && ["mc", "gap"].includes(p.k), `${t.id} ${sec} ${p.t}`);
        let heard = !!p.audio;
        if (p.sum) assert.ok(p.qs.some(q => q.k === "gap"), `${p.t}: a summary has gaps`);
        if (p.map) { assert.equal(p.o.length, p.map.boxes.length, `${p.t}: a letter for every building`); p.map.boxes.forEach(b => assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.w <= p.map.w && b.y + b.h <= p.map.h, b.l)); }
        for (const q of p.qs) {
          const at = `${t.id} ${sec} ${p.t}: ${q.q.slice(0, 30)}`, k = q.k || p.k;
          n++;
          assert.ok(q.e && q.e.length > 10, `${at}: explanation`);
          assert.ok(["mc", "gap"].includes(k), at);
          if (k === "gap") { assert.equal(q.q.split("___").length, 2, `${at}: one gap`); assert.ok(typeof q.a === "string" && q.a.trim(), at); }
          else { const o = q.o || p.o; assert.ok(o && o.length >= 3, `${at}: options`); assert.ok(Number.isInteger(q.a) && q.a >= 0 && q.a < o.length, `${at}: answer`); }
          // Listening: the part's audio, the question's own, or the extract heard just before (two questions per extract)
          heard = heard || !!q.audio;
          if (sec === "l") assert.ok(heard, `${at}: listening needs audio`);
        }
        for (const au of [p.audio].concat(p.qs.map(q => q.audio)).filter(Boolean)) {
          for (const [who, line] of au.lines) {
            assert.ok(au.cast[who], `${t.id}: ${who} has no gender in cast`);
            assert.ok(VOICES.cast[who], `${t.id}: ${who} has no voice in tools/audio-voice.json`);
            assert.ok(line.length > 5 && line.length < 600);
          }
        }
      }
      assert.equal(n, 35, `${t.id} ${sec}: ${n} questions`);
    }
    assert.ok(t.w.min > 0 && t.w.tasks.length >= 2);
    for (const tk of t.w.tasks) {
      assert.ok(tk.id && tk.t && tk.d && tk.tr && tk.min < tk.max && tk.w > 0, tk.id);
      assert.ok(tk.need.length >= 3, tk.id);
      tk.need.forEach(([l, src]) => { assert.ok(l); new RegExp(src); });
    }
    const wc = x => x.trim().split(/\s+/).filter(w => /[a-zçğıöşüA-ZÇĞİÖŞÜ]/.test(w)).length;
    for (const tk of t.w.tasks) assert.ok(tk.m && wc(tk.m) >= tk.min && wc(tk.m) <= tk.max, `${t.id} ${tk.id}: model answer ${tk.m ? wc(tk.m) : 0} words`);
    for (const p of t.s.parts) {
      assert.ok(p.t && p.d && p.talk >= 20 && p.prep >= 0, p.t);
      (p.pics || []).forEach(k => assert.match(k, /^[a-z]+$/));
      p.qs.forEach(q => { assert.ok(q.q); new RegExp(q.kw); if (q.pro) assert.equal(q.pro.length, q.con.length); assert.ok(q.m && wc(q.m) >= (q.talk || p.talk) * 0.7, `${q.q}: model answer`); });
    }
    assert.notEqual(t.id, "fix", "#mock-fix is the mistakes drill");
  }
});

// Answers that are all right, written into the run as the page would
const allRight = sec => `(() => { const t = mkTest(MK.id); mkQs(t, "${sec}").forEach(x => { MK.ans["${sec}"][x.k] = mkKind(x) === "gap" ? x.q.a.split(" / ")[0] : x.q.a; }); mkSave(); mkRender(); })()`;
const GOOD = {
  "1.1": "Merhaba Selin! Gelecek ay gelmene çok sevindim. Bence bizim evde kalabilirsin, çünkü evimiz büyük ve sessiz. Ayrıca şehrimizde güzel bir müze ve büyük bir park var, onları mutlaka görmelisin. Cumartesi akşam saat yedide buluşalım mı? Sonra birlikte eski çarşıda yemek yeriz. Başka bir planın olursa bana yaz, ona göre değiştiririz. Görüşürüz, sevgiler!",
  "1.2": "Sayın Yetkili, on mart tarihinde sitenizden bir çamaşır makinesi sipariş ettim. Sipariş numaram 48213. Ancak makine iki hafta geç geldi ve kutuyu açtığımda kapağının çatlak olduğunu gördüm. Bu durum beni çok üzdü, çünkü makineyi hemen kullanmam gerekiyordu. Ayrıca kargo şirketini birkaç kez aradım ama kimse yardımcı olmadı. Müşteri hizmetlerinize de iki e-posta gönderdim, fakat henüz bir cevap alamadım. Ürünün fotoğraflarını bu e-postanın ekinde bulabilirsiniz. Makineyi kutusuyla birlikte sakladım, bu yüzden geri göndermek kolay olacaktır. Makineyi hâlâ kullanamıyorum ve evde çamaşırlar birikiyor. Bu nedenle makinenin en kısa sürede yenisiyle değiştirilmesini rica ediyorum. Eğer bu mümkün değilse, ödediğim paranın iade edilmesini talep ediyorum. Ayrıca bu gecikme için bir açıklama bekliyorum. Sorunun bir hafta içinde çözülmesini umuyorum. Cevabınızı sabırla bekliyorum. Saygılarımla, Dilnoza Karimova",
  "2": "Bence çocukların yabancı dili erken yaşta öğrenmesi çok faydalıdır. Çünkü küçük çocuklar yeni sesleri ve kelimeleri daha kolay taklit eder. Örneğin ilkokulun ilk yılında İngilizce şarkılar öğrenen bir çocuk, ileride bu dili daha rahat konuşur. Ayrıca erken başlayan öğrenciler farklı kültürleri merak eder ve dünyaya daha açık bakar. Bu yüzden yabancı dil derslerinin oyunlarla ve hikâyelerle başlaması gerekir. Öte yandan bazı uzmanlar, önce ana dilin iyice öğrenilmesi gerektiğini savunuyor. Onlara göre iki dili aynı anda öğrenen çocuklar bazen kelimeleri karıştırıyor. Ancak araştırmalar, bu karışıklığın kısa sürdüğünü ve çocukların zamanla iki dili de başarıyla kullandığını gösteriyor. Bununla birlikte ana dil derslerinin de ihmal edilmemesi gerekir. Okullar her iki dile de yeterli zaman ayırmalıdır. Örneğin haftada birkaç saat yabancı dil, geri kalan derslerde ise ana dil kullanılabilir. Öğretmenlerin de bu konuda iyi yetiştirilmesi çok önemlidir, çünkü küçük yaştaki çocuklara ders vermek özel bir beceri ister. Aileler de evde kitap okuyarak ana dili desteklemelidir. Sonuç olarak yabancı dili erken yaşta öğrenmek çocuklara büyük avantaj sağlar. Kısacası, ana dil ve yabancı dil birbirinin rakibi değil, birbirini tamamlayan iki beceridir. Bu nedenle ikisini birlikte ve dengeli bir şekilde öğretmek en doğru yoldur."
};
// An achievement may be celebrated at the end of a section: its window would cover the next button
const calm = page => page.evaluate(() => { for (let i = 0; i < 6 && !document.getElementById("celebrate").hidden; i++) nextCelebrate(); });
const SPOKEN = "Boş zamanlarımda kitap okumayı ve arkadaşlarımla yürüyüş yapmayı çok seviyorum çünkü bu beni rahatlatıyor ayrıca hafta sonları müzik dinliyorum ve bazen film izliyorum";

test("mock: the full test from the home page — always strict, sections in order, clock, one play, a reload, scores, review, XP", async () => {
  const { page, errors } = await openApp(browser, "#home", { sr: true });
  await page.waitForSelector(".mk-deneme");
  await page.click(".mk-dn-go");
  await page.waitForSelector(".mk-intro");
  assert.match(await page.textContent(".mk-intro"), /Tinglash/);
  assert.match(await page.textContent(".mk-intro"), /1 marta eshittiriladi/);
  assert.deepEqual(await page.evaluate(() => [MK.full, MK.strict, MK.id]), [true, true, "1"]);
  // The home page's numbers are the test's own
  assert.equal(await page.evaluate(() => { const t = mkTest("1"); return MK_SECS.every(s => MOCK_INFO[s][0] === mkSecCount(t, s) && MOCK_INFO[s][1] === mkSecMin(t, s)); }), true);
  // Before a section starts, nothing runs and the menu stays
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains("mk-run")), false);
  await page.click('[data-act="mk-go"]');
  await page.waitForSelector(".mk-bar #mk-time");
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains("mk-run")), true);
  assert.equal(await page.isVisible(".nav"), false);
  assert.match(await page.textContent("#mk-time"), /^(45:00|44:5\d)$/);
  // Listening: one play of every audio in the full test
  await page.evaluate(() => { speakSeq = (lines, done) => setTimeout(done, 30); });
  await page.click('[data-act="mk-play"] >> nth=0'); await page.waitForFunction(() => !MK_PLAYING);
  assert.equal(await page.locator('[data-act="mk-play"] >> nth=0').isDisabled(), true);
  assert.match(await page.textContent(".mk-audio >> nth=0"), /tugadi/);
  // One answer by tap, then a reload: the run goes on where it stopped
  const first = await page.evaluate(() => { const x = mkQs(mkTest(MK.id), "l")[0]; return MK.ord["l" + x.k].indexOf(x.q.a); });
  await page.click(`.mk-q >> nth=0 >> .opt >> nth=${first}`);
  assert.equal(await page.locator(".mk-q >> nth=0 >> .opt.picked").count(), 1);
  await page.reload();
  await page.waitForSelector(".mk-bar");
  assert.equal(await page.locator(".mk-q >> nth=0 >> .opt.picked").count(), 1);
  assert.equal(await page.evaluate(() => MK.plays["l0.0"]), 1);
  assert.match(await page.textContent(".mk-where small"), /^1\/4-boʻlim · 1\/35 javob$/);
  // A gap answer typed with the Turkish letter buttons (forward only: the next part by the button below)
  await page.click('.mk-nav [data-act="mk-part"][data-p="1"]');
  await page.fill(".mk-in >> nth=4", "per");
  await page.click('.mk-chars [data-c="ş"]');
  await page.type(".mk-in >> nth=4", "embe");
  assert.equal(await page.evaluate(() => MK.ans.l["1.4"]), "perşembe");
  assert.equal(await page.textContent("#mk-cnt"), "2", "the bar counts typed answers too");
  // Everything right; the clock running out ends the section
  await page.evaluate(allRight("l"));
  await page.evaluate(() => { MK.dl = Date.now() + 1200; });
  await page.waitForSelector(".mk-intro", { timeout: 5000 });
  await calm(page);
  assert.match(await page.textContent(".mk-intro"), /Oʻqish/);
  assert.equal(await page.evaluate(() => MK.score.l.v), 75);
  // Reading: some wrong — the end asks once when answers are missing
  await page.click('[data-act="mk-go"]');
  await page.waitForSelector(".mk-bar");
  await page.evaluate(allRight("r"));
  await page.evaluate(() => { const x = mkQs(mkTest("1"), "r").find(q => q.k === "3.0"); delete MK.ans.r["0.0"]; delete MK.ans.r["0.1"]; MK.ans.r["3.0"] = (x.q.a + 1) % x.q.o.length; MK.pi = 4; mkRender(); });
  await page.click('[data-act="mk-end"]');
  assert.match(await page.textContent('[data-act="mk-end"]'), /2 ta savol javobsiz/);
  await page.click('[data-act="mk-end"]');
  await page.waitForSelector(".mk-write, .mk-intro");
  await calm(page);
  const r = await page.evaluate(() => MK.score.r);
  assert.equal(r.n - r.right, 3);
  assert.equal(r.v, Math.round(r.right / r.n * 75));
  // Writing: the live word count, then the check
  await page.click('[data-act="mk-go"]');
  await page.waitForSelector(".mk-write");
  await page.fill(".mk-write", GOOD["1.1"]);
  assert.match(await page.textContent("#mk-wc-1-1"), /^\d+ soʻz$/);
  assert.equal(await page.evaluate(() => document.querySelector("#mk-wc-1-1").classList.contains("ok")), true);
  await page.evaluate(g => { MK.ans.w["1.2"] = g["1.2"]; MK.ans.w["2"] = g["2"]; MK.pi = 2; mkRender(); }, GOOD);
  await page.click('[data-act="mk-end"]');
  await page.waitForSelector(".mk-intro");
  await calm(page);
  const w = await page.evaluate(() => MK.score.w);
  assert.ok(w.items.every(s => s >= 70), `writing ${w.items}`);
  // Speaking: preparation, the microphone, what was heard
  await page.click('[data-act="mk-go"]');
  await page.waitForSelector(".mk-speak");
  await page.evaluate(s => { let n = 0; window.__say = () => (n++ ? "" : s); }, SPOKEN);
  await page.click('[data-act="mk-sp-go"]');
  await page.waitForSelector('[data-act="mk-sp-talk"]');
  await page.click('[data-act="mk-sp-talk"]');
  await page.waitForFunction(() => MK_MIC && MK_MIC.text.length > 20);
  await page.click('[data-act="mk-sp-stop"]');
  await page.waitForSelector('[data-act="mk-sp-next"]', { timeout: 5000 });
  assert.match(await page.textContent(".mk-heard.done"), /kitap okumayı/);
  await page.evaluate(() => { const t = mkTurns(mkTest("1")); t.forEach((x, i) => { if (i) MK.ans.s[i] = { text: x.q.m }; }); MK.sp = { i: t.length - 1, st: "rev" }; mkRender(); });
  await page.click('[data-act="mk-end"]');
  // The result: the score, the level, sections, the review, XP and the saved best
  await page.waitForSelector(".mk-res");
  await calm(page);
  const res = await page.evaluate(() => ({ res: MK.res, v: MK.secs.map(s => MK.score[s].v), mk: S.mk["1"], xp: MK.secs.map(s => MK.xp[s]), sk: S.sk.l[1] }));
  assert.equal(res.res.v, Math.round(res.v.reduce((a, x) => a + x, 0) / 4));
  assert.ok(res.res.v >= 51, `score ${res.res.v}`);
  assert.ok(["B2", "C1"].includes(res.res.lv));
  assert.deepEqual([res.mk.b, res.mk.l, res.mk.n], [res.res.v, res.res.v, 1]);
  assert.equal(res.mk.s.l, 75);
  assert.ok(res.xp.every(x => x > 0), `xp ${res.xp}`);
  assert.ok(res.sk >= 21, "listening answers counted for the skill");
  assert.match(await page.textContent(".mk-score"), new RegExp(`^${res.res.v}\\s*/\\s*75$`));
  assert.equal(await page.locator(".mk-srow").count(), 4);
  assert.equal(await page.locator(".mk-rvbox").count(), 4);
  assert.equal(await page.locator(".mk-rv.no").count(), 3);
  assert.equal(await page.isVisible(".nav"), true);
  // The list shows the best result
  await page.click('a.btn[href="#mock"]');
  await page.waitForSelector(".mk-best");
  assert.match(await page.textContent(".mk-best"), new RegExp(String(res.res.v)));
  // …and so does the home page
  await page.evaluate(() => { location.hash = "#home"; });
  await page.waitForSelector(".mk-dn-best");
  assert.match(await page.textContent(".mk-dn-best"), new RegExp(`${res.res.v}/75`));
  assert.match(await page.textContent('.mk-sk[data-s="l"]'), /75/);
  assert.deepEqual(errors, []);
  await page.close();
});

test("mock: one section only, leaving pauses the clock, cancelling a started run", async () => {
  const { page, errors } = await openApp(browser, "#mock");
  await page.waitForSelector(".mk-test");
  await page.click('[data-act="mk-start"][data-s="r"]');
  await page.click('[data-act="mk-go"]');
  await page.waitForSelector(".mk-bar");
  const left = await page.evaluate(() => MK.left);
  await page.click(".mk-exit");
  await page.waitForSelector(".mk-resume");
  await page.waitForTimeout(2300);
  const paused = await page.evaluate(() => MK.left);
  assert.ok(left - paused < 1.5, `clock ran while away: ${left} → ${paused}`);
  // A second test cannot start over a started one
  await page.click('[data-act="mk-start"][data-s="l"]');
  await page.waitForSelector(".mk-bar");
  assert.equal(await page.evaluate(() => MK.secs.join()), "r");
  await page.evaluate(allRight("r"));
  await page.click('[data-act="mk-part"][data-p="4"]');
  await page.click('[data-act="mk-end"]');
  await page.waitForSelector(".mk-res");
  await calm(page);
  assert.match(await page.textContent(".mk-res"), /Oʻqish boʻlimi/);
  assert.equal(await page.locator(".mk-srow").count(), 0);
  const mk = await page.evaluate(() => S.mk["1"]);
  assert.equal(mk.s.r, 75);
  assert.equal(mk.b, undefined, "one section is not a full test");
  // Cancel: a new run, started and then thrown away
  await page.click('[data-act="mk-again"]');
  await page.click('[data-act="mk-go"]');
  await page.click(".mk-exit");
  await page.waitForSelector('[data-act="mk-cancel"]');
  await page.click('[data-act="mk-cancel"]');
  await page.click('[data-act="mk-cancel"]');
  await page.waitForFunction(() => !document.querySelector(".mk-resume"));
  assert.equal(await page.evaluate(() => localStorage.getItem("ty-mock-run")), null);
  assert.deepEqual(errors, []);
  await page.close();
});

test("mock: strict mode — one play, forward only, the clock runs away from the page", async () => {
  const { page, errors } = await openApp(browser, "#mock");
  await page.waitForSelector('[data-act="mk-strict"]');
  await page.click('[data-act="mk-strict"]');
  assert.equal(await page.getAttribute('[data-act="mk-strict"]', "aria-checked"), "true");
  await page.click('[data-act="mk-start"][data-s="l"]');
  await page.waitForSelector(".mk-intro");
  assert.match(await page.textContent(".mk-intro"), /1 marta eshittiriladi/);
  await page.click('[data-act="mk-go"]');
  await page.waitForSelector(".mk-bar");
  await page.evaluate(() => { speakSeq = (lines, done) => setTimeout(done, 30); });
  await page.click('[data-act="mk-play"] >> nth=0');
  await page.waitForFunction(() => !MK_PLAYING);
  assert.equal(await page.locator('[data-act="mk-play"] >> nth=0').isDisabled(), true);
  // Forward only: no «Oldingi», other parts closed
  assert.equal(await page.locator('.mk-nav [data-act="mk-part"][data-p="-1"]').count(), 0);
  assert.equal(await page.isVisible(".mk-fwd"), true);
  assert.equal(await page.locator('.mk-ptab[data-p="1"]').isDisabled(), true);
  await page.click('.mk-nav [data-act="mk-part"][data-p="1"]');
  assert.equal(await page.evaluate(() => MK.pi), 1);
  assert.equal(await page.locator('.mk-ptab[data-p="0"]').isDisabled(), true);
  await page.evaluate(() => { mkAct("mk-part", { dataset: { p: "0" } }); });
  assert.equal(await page.evaluate(() => MK.pi), 1, "no way back");
  // Away from the page the deadline still counts; back on the page the section ends
  await page.evaluate(() => { MK.dl = Date.now() + 1500; });
  await page.click(".mk-exit");
  await page.waitForSelector(".mk-resume");
  assert.match(await page.textContent(".mk-resume"), /vaqt toʻxtamaydi/);
  await page.waitForFunction(() => MK.left === 0, null, { timeout: 5000 });
  await page.evaluate(() => { location.hash = "#mock-1"; });
  await page.waitForSelector(".mk-res", { timeout: 5000 });
  assert.match(await page.textContent(".mk-res"), /Qatʼiy rejim/);
  assert.deepEqual(errors, []);
  await page.close();
});

// A microphone stand-in: getUserMedia and MediaRecorder that hand over a short recording
const REC = `if (!navigator.mediaDevices) Object.defineProperty(navigator, "mediaDevices", { value: {} });
navigator.mediaDevices.getUserMedia = async () => ({ getTracks: () => [{ stop() {} }] });
window.MediaRecorder = class { constructor() { this.state = "inactive"; } start() { this.state = "recording"; }
  stop() { this.state = "inactive"; setTimeout(() => { this.ondataavailable && this.ondataavailable({ data: new Blob(["x"], { type: "audio/webm" }) }); this.onstop && this.onstop(); }, 10); } };`;

test("mock: history and its chart, the change since last time, the mistakes drill, writing criteria, models, own recording", async () => {
  const now = Date.now(), mkh = {};
  mkh[(now - 5 * 864e5).toString(36)] = { t: "1", v: 30, s: { l: 30, r: 32, w: 28, s: 30 }, f: 1, x: 0 };
  mkh[(now - 2 * 864e5).toString(36)] = { t: "1", v: 41, s: { l: 44, r: 40, w: 38, s: 42 }, f: 1, x: 0 };
  const { page, errors } = await openApp(browser, "#mock", { sr: true, init: REC, state: { mkh } });
  await page.waitForSelector(".mk-hist");
  assert.equal(await page.locator(".mk-chart .mk-ch-dot").count(), 2);
  assert.equal(await page.locator(".mk-hrow").count(), 2);
  assert.match(await page.textContent(".mk-ch-title"), /\+11/);
  // A full run with four wrong answers in listening and reading, the model texts as writing, a recorded first answer
  await page.click('[data-act="mk-start"][data-s="all"]');
  await page.click('[data-act="mk-go"]');
  await page.waitForSelector(".mk-bar");
  const wrong = await page.evaluate(() => {
    const t = mkTest("1"), bad = [];
    ["l", "r"].forEach(s => mkQs(t, s).forEach((x, i) => { const miss = i === 2 || (s === "r" && i < 2); if (miss) bad.push(`1|${s}|${x.k}`);
      MK.ans[s][x.k] = miss ? (mkKind(x) === "gap" ? "yok" : (x.q.a + 1) % (x.q.o || x.p.o).length) : mkKind(x) === "gap" ? x.q.a.split(" / ")[0] : x.q.a; }));
    t.w.tasks.forEach(tk => { MK.ans.w[tk.id] = tk.m; });
    ["l", "r", "w"].forEach(s => { MK.si = MK.secs.indexOf(s); MK.phase = "run"; mkEnd(); });
    return bad;
  });
  await page.waitForFunction(() => MK.si === 3 && MK.phase === "intro");
  await calm(page);
  await page.click('[data-act="mk-go"]');
  await page.waitForSelector(".mk-speak");
  await page.evaluate(s => { let n = 0; window.__say = () => (n++ ? "" : s); }, SPOKEN);
  await page.click('[data-act="mk-sp-go"]');
  await page.click('[data-act="mk-sp-talk"]');
  await page.waitForFunction(() => MK_MIC && MK_MIC.text.length > 20);
  await page.click('[data-act="mk-sp-stop"]');
  await page.waitForSelector(".mk-myrec audio", { timeout: 5000 });
  await page.evaluate(() => { const t = mkTurns(mkTest("1")); t.forEach((x, i) => { if (i) MK.ans.s[i] = { text: x.q.m }; }); MK.sp = { i: t.length - 1, st: "rev" }; mkRender(); });
  await page.click('[data-act="mk-end"]');
  await page.waitForSelector(".mk-res");
  await calm(page);
  // The change since the last full run, the history grows
  assert.ok(await page.locator(".mk-score .mk-delta").count());
  assert.match(await page.textContent(".mk-res"), /Oldingi urinish/);
  assert.equal(await page.evaluate(() => Object.keys(S.mkh).length), 3);
  // Writing: four criteria per task, the detailed check folded, the model answers score high
  assert.equal(await page.locator(".mk-rub .mk-rrow").count(), 12);
  assert.equal(await page.locator(".mk-model").count(), 3 + 8);
  const models = await page.evaluate(() => mkTest("1").w.tasks.map(tk => mkWriteCheck(tk.m, tk).s));
  assert.ok(models.every(s => s >= 80), `model answers ${models}`);
  assert.equal(await page.locator(".mk-rvbox >> nth=3 >> .mk-myrec audio").count(), 1, "the recording is in the review");
  // Mistakes: the four wrong questions; two right answers clear each
  assert.deepEqual((await page.evaluate(() => mkmActive().map(m => m.key))).sort(), wrong.sort());
  assert.equal(wrong.length, 4);
  assert.match(await page.textContent(".mk-fixgo"), /4 ta savol/);
  const fixAll = async () => {
    for (let g = 0; g < 30; g++) {
      const done = await page.evaluate(() => {
        if (!MKF || MKF.done) return true;
        const m = MKF.items[MKF.i];
        if (MKF.a === null) {
          if (mkKind(m.x) === "gap") { document.getElementById("mk-fin").value = m.x.q.a.split(" / ")[0]; document.querySelector('[data-act="mk-fcheck"]').click(); }
          else document.querySelector(`[data-act="mk-fo"][data-o="${m.x.q.a}"]`).click();
        }
        document.querySelector('[data-act="mk-fnext"]').click();
        return false;
      });
      if (done) break;
    }
  };
  await page.click(".mk-fixgo");
  await page.waitForSelector(".mk-fix");
  assert.match(await page.textContent(".mk-fix"), /Afsus|Tinglash|Matn|\?/);
  await fixAll();
  await page.waitForSelector(".mk-fix-sum");
  assert.match(await page.textContent(".mk-fix-sum"), /4\/4/);
  assert.match(await page.textContent(".mk-res"), /Yana 4 ta savol/);
  await page.click('[data-act="mk-fagain"]');
  await fixAll();
  await page.waitForSelector(".mk-fix-sum");
  assert.match(await page.textContent(".mk-res"), /Barcha xatolar tuzatildi/);
  assert.equal(await page.evaluate(() => mkmActive().length), 0);
  // A wrong answer in the drill sends the question back: two right answers needed again
  await page.evaluate(() => { mkmMark("1|r|0.0", false); MKF = null; location.hash = "#mock"; });
  await page.waitForSelector(".mk-fixgo");
  assert.match(await page.textContent(".mk-fixgo"), /1 ta savol/);
  assert.deepEqual(errors, []);
  await page.close();
});

test("mock: the home page shows the exam first — Deneme and the four skills, no extra card in Mashq", async () => {
  const { page, errors } = await openApp(browser, "#home");
  await page.waitForSelector(".mk-hub");
  // Right after the greeting, before everything else
  assert.equal(await page.evaluate(() => { const v = document.querySelector('.view[data-v="home"]'), a = [...v.children]; return a.indexOf(v.querySelector(".mk-hub")) === a.indexOf(v.querySelector(".greet")) + 1; }), true);
  assert.equal(await page.locator(".mk-sk").count(), 4);
  assert.equal(await page.evaluate(() => typeof MOCK), "undefined", "the tests load only when needed");
  // One skill: the writing section, not strict unless chosen
  await page.click('.mk-sk[data-s="w"]');
  await page.waitForSelector(".mk-intro");
  assert.match(await page.textContent(".mk-intro"), /Yozish/);
  assert.deepEqual(await page.evaluate(() => [MK.secs.join(), MK.full, MK.strict]), ["w", false, false]);
  await page.click('[data-act="mk-go"]');
  await page.waitForSelector(".mk-situ");
  // Back home: the started run is offered instead of a new one
  await page.evaluate(() => { location.hash = "#home"; });
  await page.waitForSelector('.mk-dn-go[href="#mock-1"]');
  // The speaking section draws its pictures, the listening map its letters
  await page.evaluate(() => { MK = null; localStorage.removeItem(MK_KEY); mkStart("1", "s"); });
  await page.waitForSelector('[data-act="mk-go"]');
  await page.click('[data-act="mk-go"]');
  await page.evaluate(() => { MK.sp = { i: 3, st: "ready" }; mkRender(true); });
  assert.equal(await page.locator(".mk-pics.two .mk-pic svg").count(), 2);
  assert.equal(await page.evaluate(() => mkTurns(mkTest("1"))[3].talk), 45, "a question's own time");
  await page.evaluate(() => { MK = null; localStorage.removeItem(MK_KEY); mkStart("1", "l"); });
  await page.click('[data-act="mk-go"]');
  await page.evaluate(() => { MK.pi = mkTest("1").l.parts.findIndex(p => p.map); mkRender(true); });
  assert.equal(await page.locator(".mk-map .mk-mb").count(), 7);
  assert.equal(await page.locator(".mk-q >> nth=0 >> .mk-opts.letters .opt").count(), 7);
  await page.evaluate(() => { location.hash = "#practice"; });
  await page.waitForSelector(".sk-tile");
  assert.equal(await page.locator(".mk-entry").count(), 0);
  assert.deepEqual(errors, []);
  await page.close();
});
