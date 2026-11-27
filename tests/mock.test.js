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
    for (const sec of ["l", "r"]) {
      assert.ok(t[sec].min > 0 && t[sec].parts.length >= 3, `${t.id} ${sec}`);
      let n = 0;
      for (const p of t[sec].parts) {
        assert.ok(p.t && p.d && ["mc", "gap"].includes(p.k), `${t.id} ${sec} ${p.t}`);
        for (const q of p.qs) {
          const at = `${t.id} ${sec} ${p.t}: ${q.q.slice(0, 30)}`;
          n++;
          assert.ok(q.e && q.e.length > 10, `${at}: explanation`);
          if (p.k === "gap") { assert.equal(q.q.split("___").length, 2, `${at}: one gap`); assert.ok(typeof q.a === "string" && q.a.trim(), at); }
          else { const o = q.o || p.o; assert.ok(o && o.length >= 3, `${at}: options`); assert.ok(Number.isInteger(q.a) && q.a >= 0 && q.a < o.length, `${at}: answer`); }
          if (sec === "l") assert.ok(p.audio || q.audio, `${at}: listening needs audio`);
        }
        for (const au of [p.audio].concat(p.qs.map(q => q.audio)).filter(Boolean)) {
          for (const [who, line] of au.lines) {
            assert.ok(au.cast[who], `${t.id}: ${who} has no gender in cast`);
            assert.ok(VOICES.cast[who], `${t.id}: ${who} has no voice in tools/audio-voice.json`);
            assert.ok(line.length > 5 && line.length < 600);
          }
        }
      }
      assert.ok(n >= 15, `${t.id} ${sec}: ${n} questions`);
    }
    assert.ok(t.w.min > 0 && t.w.tasks.length >= 2);
    for (const tk of t.w.tasks) {
      assert.ok(tk.id && tk.t && tk.d && tk.tr && tk.min < tk.max && tk.w > 0, tk.id);
      assert.ok(tk.need.length >= 3, tk.id);
      tk.need.forEach(([l, src]) => { assert.ok(l); new RegExp(src); });
    }
    for (const p of t.s.parts) {
      assert.ok(p.t && p.d && p.talk >= 20 && p.prep >= 0, p.t);
      p.qs.forEach(q => { assert.ok(q.q); new RegExp(q.kw); if (q.pro) assert.equal(q.pro.length, q.con.length); });
    }
  }
});

// Answers that are all right, written into the run as the page would
const allRight = sec => `(() => { const t = mkTest(MK.id); mkQs(t, "${sec}").forEach(x => { MK.ans["${sec}"][x.k] = x.p.k === "gap" ? x.q.a.split(" / ")[0] : x.q.a; }); mkSave(); mkRender(); })()`;
const GOOD = {
  "1.1": "Merhaba Selin! Gelecek ay gelmene çok sevindim. Bence bizim evde kalabilirsin, çünkü evimiz büyük ve sessiz. Ayrıca şehrimizde güzel bir müze ve büyük bir park var, onları mutlaka görmelisin. Cumartesi akşam saat yedide buluşalım mı? Sonra birlikte eski çarşıda yemek yeriz. Başka bir planın olursa bana yaz, ona göre değiştiririz. Görüşürüz, sevgiler!",
  "1.2": "Sayın Yetkili, on mart tarihinde sitenizden bir çamaşır makinesi sipariş ettim. Sipariş numaram 48213. Ancak makine iki hafta geç geldi ve kutuyu açtığımda kapağının çatlak olduğunu gördüm. Bu durum beni çok üzdü, çünkü makineyi hemen kullanmam gerekiyordu. Ayrıca kargo şirketini birkaç kez aradım ama kimse yardımcı olmadı. Müşteri hizmetlerinize de iki e-posta gönderdim, fakat henüz bir cevap alamadım. Ürünün fotoğraflarını bu e-postanın ekinde bulabilirsiniz. Makineyi kutusuyla birlikte sakladım, bu yüzden geri göndermek kolay olacaktır. Makineyi hâlâ kullanamıyorum ve evde çamaşırlar birikiyor. Bu nedenle makinenin en kısa sürede yenisiyle değiştirilmesini rica ediyorum. Eğer bu mümkün değilse, ödediğim paranın iade edilmesini talep ediyorum. Ayrıca bu gecikme için bir açıklama bekliyorum. Sorunun bir hafta içinde çözülmesini umuyorum. Cevabınızı sabırla bekliyorum. Saygılarımla, Dilnoza Karimova",
  "2": "Bence çocukların yabancı dili erken yaşta öğrenmesi çok faydalıdır. Çünkü küçük çocuklar yeni sesleri ve kelimeleri daha kolay taklit eder. Örneğin ilkokulun ilk yılında İngilizce şarkılar öğrenen bir çocuk, ileride bu dili daha rahat konuşur. Ayrıca erken başlayan öğrenciler farklı kültürleri merak eder ve dünyaya daha açık bakar. Bu yüzden yabancı dil derslerinin oyunlarla ve hikâyelerle başlaması gerekir. Öte yandan bazı uzmanlar, önce ana dilin iyice öğrenilmesi gerektiğini savunuyor. Onlara göre iki dili aynı anda öğrenen çocuklar bazen kelimeleri karıştırıyor. Ancak araştırmalar, bu karışıklığın kısa sürdüğünü ve çocukların zamanla iki dili de başarıyla kullandığını gösteriyor. Bununla birlikte ana dil derslerinin de ihmal edilmemesi gerekir. Okullar her iki dile de yeterli zaman ayırmalıdır. Örneğin haftada birkaç saat yabancı dil, geri kalan derslerde ise ana dil kullanılabilir. Öğretmenlerin de bu konuda iyi yetiştirilmesi çok önemlidir, çünkü küçük yaştaki çocuklara ders vermek özel bir beceri ister. Aileler de evde kitap okuyarak ana dili desteklemelidir. Sonuç olarak yabancı dili erken yaşta öğrenmek çocuklara büyük avantaj sağlar. Kısacası, ana dil ve yabancı dil birbirinin rakibi değil, birbirini tamamlayan iki beceridir. Bu nedenle ikisini birlikte ve dengeli bir şekilde öğretmek en doğru yoldur."
};
// An achievement may be celebrated at the end of a section: its window would cover the next button
const calm = page => page.evaluate(() => { for (let i = 0; i < 6 && !document.getElementById("celebrate").hidden; i++) nextCelebrate(); });
const SPOKEN = "Boş zamanlarımda kitap okumayı ve arkadaşlarımla yürüyüş yapmayı çok seviyorum çünkü bu beni rahatlatıyor ayrıca hafta sonları müzik dinliyorum ve bazen film izliyorum";

test("mock: a full run — sections in order, clock, listening limit, a reload, scores, review, XP", async () => {
  const { page, errors } = await openApp(browser, "#practice", { sr: true });
  await page.waitForSelector('.mk-entry[href="#mock"]');
  await page.click(".mk-entry");
  await page.waitForSelector(".mk-test");
  assert.equal(await page.locator('.mk-cell').count(), 4);
  await page.click('[data-act="mk-start"][data-s="all"]');
  await page.waitForSelector(".mk-intro");
  assert.match(await page.textContent(".mk-intro"), /Tinglash/);
  // Before a section starts, nothing runs and the menu stays
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains("mk-run")), false);
  await page.click('[data-act="mk-go"]');
  await page.waitForSelector(".mk-bar #mk-time");
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains("mk-run")), true);
  assert.equal(await page.isVisible(".nav"), false);
  assert.match(await page.textContent("#mk-time"), /^(30:00|29:5\d)$/);
  // Listening: at most two plays of one audio
  await page.evaluate(() => { speakSeq = (lines, done) => setTimeout(done, 30); });
  for (let i = 0; i < 2; i++) { await page.click('[data-act="mk-play"] >> nth=0'); await page.waitForFunction(() => !MK_PLAYING); }
  assert.equal(await page.locator('[data-act="mk-play"] >> nth=0').isDisabled(), true);
  assert.match(await page.textContent(".mk-audio >> nth=0"), /tugadi/);
  // One answer by tap, then a reload: the run goes on where it stopped
  const first = await page.evaluate(() => { const x = mkQs(mkTest(MK.id), "l")[0]; return MK.ord["l" + x.k].indexOf(x.q.a); });
  await page.click(`.mk-q >> nth=0 >> .opt >> nth=${first}`);
  assert.equal(await page.locator(".mk-q >> nth=0 >> .opt.picked").count(), 1);
  await page.reload();
  await page.waitForSelector(".mk-bar");
  assert.equal(await page.locator(".mk-q >> nth=0 >> .opt.picked").count(), 1);
  assert.equal(await page.evaluate(() => MK.plays["l0.0"]), 2);
  // A gap answer typed with the Turkish letter buttons
  await page.click('[data-act="mk-part"][data-p="1"]');
  await page.fill(".mk-in >> nth=4", "per");
  await page.click('.mk-chars [data-c="ş"]');
  await page.type(".mk-in >> nth=4", "embe");
  assert.equal(await page.evaluate(() => MK.ans.l["1.4"]), "perşembe");
  // Everything right; the clock running out ends the section
  await page.evaluate(allRight("l"));
  await page.evaluate(() => { MK.left = 1.2; });
  await page.waitForSelector(".mk-intro", { timeout: 5000 });
  await calm(page);
  assert.match(await page.textContent(".mk-intro"), /Oʻqish/);
  assert.equal(await page.evaluate(() => MK.score.l.v), 75);
  // Reading: some wrong — the end asks once when answers are missing
  await page.click('[data-act="mk-go"]');
  await page.waitForSelector(".mk-bar");
  await page.evaluate(allRight("r"));
  await page.evaluate(() => { delete MK.ans.r["0.0"]; delete MK.ans.r["0.1"]; MK.ans.r["3.0"] = 2; mkRender(); });
  await page.click('[data-act="mk-part"][data-p="3"]');
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
  await page.evaluate(s => { [1, 2, 3, 4].forEach(i => { MK.ans.s[i] = { text: s + " " + s }; }); MK.sp = { i: 4, st: "rev" }; mkRender(); }, SPOKEN);
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
  await page.click('[data-act="mk-part"][data-p="3"]');
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
