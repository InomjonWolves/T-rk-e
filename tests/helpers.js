// Shared helpers for the test suite: open the site from disk in guest mode, offline, at phone size.
const path = require("path");
const fs = require("fs");
const vm = require("vm");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const BASE = "file://" + path.join(ROOT, "index.html");

// Content files evaluated without a browser: returns { UNITS, LETTERS, GRAMMAR, BX, COURSE, GUIDE }
function loadContent() {
  const code = ["content.js", "lugat.js", "grammar.js", "grammar-ex.js", "course.js", "guide.js"].map(f => fs.readFileSync(path.join(ROOT, f), "utf8")).join("\n;\n");
  return vm.runInNewContext(code + "\n;({ UNITS, LETTERS, GRAMMAR, BX, COURSE, GUIDE, LUGAT })", {});
}

const launch = () => chromium.launch();

// opts.sr: install a fake SpeechRecognition that "hears" window.__say() (default: the current exercise text)
// opts.noSR: remove speech recognition entirely (like Firefox)
async function openApp(browser, hash = "#home", opts = {}) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.route("**/firebase-config.js", r => r.fulfill({ body: "window.FIREBASE_CONFIG=null", contentType: "text/javascript" }));
  await page.route(/^https?:\/\//, r => r.abort());
  // opts.native: open the page as the standalone Android app does (tools/native-www.js sets these globals)
  if (opts.native) await page.addInitScript(() => { window.TY_NATIVE = 1; window.AUDIO_BASE = "https://turkceyol.web.app/"; window.FB_SDK_BASE = "vendor/firebase/"; });
  // opts.init: a script run before the page (for example fake Capacitor plugins)
  if (opts.init) await page.addInitScript(opts.init);
  await page.addInitScript(({ sr, noSR, state }) => {
    sessionStorage["ty-welcomed"] = "1";
    if (!localStorage["turkce-yol-v1"]) localStorage["turkce-yol-v1"] = JSON.stringify(state);
    if (noSR || sr) { delete window.webkitSpeechRecognition; delete window.SpeechRecognition; }
    if (sr) {
      window.SpeechRecognition = class {
        start() {
          setTimeout(() => {
            let t = "";
            try { t = window.__say ? window.__say() : SES.items[SES.i].tr; } catch (e) {}
            const alts = [{ transcript: t }];
            if (this.onresult) this.onresult({ results: [Object.assign(alts, { isFinal: true })] });
            if (this.onend) this.onend();
          }, 40);
        }
        stop() {} abort() {}
      };
    }
  }, { sr: !!opts.sr, noSR: !!opts.noSR, state: Object.assign({ onb: 1 }, opts.state || {}) });
  await page.goto(BASE + hash);
  await page.waitForTimeout(250);
  await closeCelebrate(page);
  return { page, errors };
}

// The achievement pop-up can cover buttons
const closeCelebrate = page => page.evaluate(() => {
  if (window.ACH_QUEUE) ACH_QUEUE.length = 0;
  const c = document.getElementById("celebrate"); if (c) c.hidden = true;
});

// Answers every step of the running practice session correctly; returns the "right/total" score text
async function answerAllRight(page) {
  for (let k = 0; k < 60; k++) {
    const state = await page.evaluate(() => {
      if (!SES || SES.i >= SES.items.length) return "end";
      const it = SES.items[SES.i], q = s => document.querySelector(s);
      if (it.ls === "pick") q(`[data-act=ls-ans][data-o="${it.opts.indexOf(it.t)}"]`).click();
      else if (it.ls === "cloze") { q("#type-input").value = it.word; q("[data-act=ls-check]").click(); }
      else if (it.gx) {
        const ex = it.ex;
        if (ex.t === "c") q(`[data-act=gx-ans][data-o="${ex.a}"]`).click();
        else if (ex.t === "t") { q("#type-input").value = ex.ans[0]; q("[data-act=gx-check]").click(); }
        else { ex.s.split(" ").forEach((_, i) => q(`#ord-pool [data-act=ord-tok][data-i="${i}"]`).click()); q("[data-act=gx-order]").click(); }
      }
      else if (q("[data-act=card-know]")) { q("[data-act=card-know]").click(); return "card"; }
      else if (q('[data-act=answer][data-ok="1"]')) q('[data-act=answer][data-ok="1"]').click();
      else if (q("#type-input")) { q("#type-input").value = it.tr; q("[data-act=type-check]").click(); }
      else if (q("#mic-btn")) return "mic";
      const fb = q("#fb"), ok = !fb || !fb.className.includes("no");
      const n = q("[data-act=next]"); if (n) { n.disabled = false; n.click(); }
      return ok ? "ok" : "wrong";
    });
    if (state === "end") break;
    if (state === "wrong") throw new Error("A correct answer was marked wrong");
    if (state === "mic") {
      await page.click("#mic-btn");
      await page.waitForFunction(() => !REC && document.getElementById("fb").textContent.trim().length > 0);
      const ok = await page.evaluate(() => !document.getElementById("fb").className.includes("no"));
      if (!ok) throw new Error("Correct speech was marked wrong: " + await page.evaluate(() => document.getElementById("fb").innerText));
      await page.evaluate(() => document.querySelector("[data-act=next]").click());
    }
  }
  return page.evaluate(() => { const s = document.querySelector(".score"); return s ? s.innerText : null; });
}

module.exports = { ROOT, BASE, loadContent, launch, openApp, closeCelebrate, answerAllRight };
