// Google Play store pictures (Android 7-bosqich): 8 phone screenshots 1080×1920 with a caption, the feature graphic
// 1024×500 and the 512×512 icon → native/play/. The screens are the app itself (index.html in app mode, a demo
// progress), drawn by Playwright; captions are ours. Run: node tools/play-assets.js
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "native", "play");
const URL = "file://" + path.join(ROOT, "index.html");

// [file, caption, route, setup in the page (async), wait ms]
const SHOTS = [
  ["01-bosh", "Har kuni 10 daqiqa — Pamuk reja tuzib beradi", "#home", null],
  ["02-yol", "A1 dan C1 gacha: 40 boʻlimli oʻrganish yoʻli", "#course", () => { const p = document.querySelectorAll(".pn-row")[1]; window.scrollTo(0, p.getBoundingClientRect().top + scrollY - 40); }],
  ["03-mashq", "Oʻyindek mashqlar: seriya, XP va ovozlar", "#practice", async () => {
    startSession("quiz", "all");
    const pick = () => document.querySelector('[data-act=answer][data-ok="1"]').click();
    for (let i = 0; i < 2; i++) { pick(); document.querySelector("[data-act=next]").click(); }
    pick();
  }, 380],
  ["04-gapirish", "Gapiring — ilova talaffuzingizni tekshiradi", "#practice", async () => {
    startSession("say", "pron");
    await new Promise(r => setTimeout(r, 700));
    document.getElementById("mic-btn").click();
    await new Promise(r => setTimeout(r, 400));
  }, 300],
  ["05-natija", "Har mashqdan keyin natija va mukofot", "#practice", async () => {
    XP_FAST_MS = 0; startSession("quiz", "all"); SES.t0 -= 154000;
    for (let i = 0; i < 40 && SES && SES.i < SES.items.length; i++) { document.querySelector('[data-act=answer][data-ok="1"]').click(); document.querySelector("[data-act=next]").click(); }
  }, 3000],
  ["06-seriya", "Seriya kalendari va muzlatgich", "#home", () => document.querySelector('[data-act="streak"]').click(), 500],
  ["07-soz", "Soʻzni bosing — tarjima va har bir qoʻshimcha", "#oqish", async () => {
    await loadOq(); await loadMorph(); location.hash = "#oqish-" + OQ[3].id;
    for (let i = 0; i < 40 && !document.querySelector(".oq-text .mw"); i++) await new Promise(r => setTimeout(r, 100));
    const ws = [...document.querySelectorAll(".oq-text .mw")], deep = n => ws.find(x => { const r = Morph.parse(x.textContent)[0]; return r && r.parts.length >= n; });
    const w = deep(3) || deep(2) || ws[4];
    window.scrollTo(0, w.getBoundingClientRect().top + scrollY - 160); mwOpen(w);
  }, 700],
  ["08-lugat", "3000+ soʻz, mavzuli lugʻat va internetsiz audio", "#lugat", null]
];

// Demo progress: a 12-day streak with a frozen day, A1 half done, today's XP on the way to the goal
function demoState() {
  const DAY = 864e5, dn = Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / DAY), key = n => new Date(n * DAY).toISOString().slice(0, 10);
  const days = {};
  for (let k = 0; k < 26; k++) if (k !== 4 && k !== 13 && k !== 14) days[key(dn - k)] = { xp: 40 + (k * 17) % 60, sec: 600, rev: 12 };
  const done = { e: {}, v: {}, done: 1 };
  return { xp: 3480, lvl: 9, streak: 12, best: 15, lastDay: key(dn), day: key(dn), dayXp: 40, goal: 50, frz: 1, frzD: [key(dn - 4)], days, onb: 1,
    k: { "a1-1": done, "a1-2": done, "a1-3": done, "a1-4": { e: {}, v: {} } }, place: { skipped: 1 }, achv: {}, sfx: false, first: key(dn - 40) };
}

async function appShot(browser, [name, , hash, setup, wait = 250]) {
  const page = await browser.newPage({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3 });
  await page.route("**/firebase-config.js", r => r.fulfill({ body: "window.FIREBASE_CONFIG=null", contentType: "text/javascript" }));
  await page.route(/^https?:\/\//, r => r.abort());
  await page.addInitScript(st => {
    window.TY_NATIVE = 1;
    sessionStorage["ty-welcomed"] = "1";
    localStorage["turkce-yol-v1"] = JSON.stringify(st);
    // The phone "hears" the word exactly (speaking screen)
    window.SpeechRecognition = class { start() { setTimeout(() => { const res = [{ transcript: SES.items[SES.i].tr }]; res.isFinal = true; this.onresult({ results: [res] }); this.onend(); }, 60); } stop() {} };
  }, demoState());
  await page.goto(URL + hash);
  await page.addStyleTag({ content: "#pamuk-say,#celebrate,.toast{display:none!important} *{caret-color:transparent!important}" });
  await page.waitForTimeout(600);
  // About 400 words already learned (the demo progress), then the page is drawn again
  await page.evaluate(() => { ALL.slice(0, 412).forEach(w => { S.srs[w.tr] = { i: 8, e: 2.5, d: dayNum() + 5, r: 3, m: 0, w: 0 }; }); save(); route(); ACH_QUEUE.length = 0; document.getElementById("celebrate").hidden = true; });
  await page.waitForTimeout(200);
  if (setup) await page.evaluate(setup);
  await page.waitForTimeout(wait);
  const buf = await page.screenshot({ type: "png" });
  await page.close();
  return buf;
}

const font = () => fs.readFileSync(path.join(ROOT, "fonts", "onest-v1.woff2")).toString("base64");
const BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='112' height='112' viewBox='0 0 56 56' fill='none' stroke='%23fff' stroke-opacity='.12' stroke-width='1.1'%3E%3Crect x='16' y='16' width='24' height='24'/%3E%3Cpath d='M28 11 45 28 28 45 11 28zM0-5l5 5-5 5-5-5zM56-5l5 5-5 5-5-5zM0 51l5 5-5 5-5-5zM56 51l5 5-5 5-5-5z'/%3E%3C/svg%3E"),linear-gradient(160deg,#4c6ff2 0%,#3654d4 55%,#2a41b3 100%)`;

async function frame(browser, caption, png) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.setContent(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    @font-face{font-family:Onest;src:url(data:font/woff2;base64,${font()}) format("woff2");font-weight:400 900}
    body{margin:0;width:1080px;height:1920px;overflow:hidden;background:${BG};font-family:Onest,sans-serif;display:flex;flex-direction:column;align-items:center}
    h1{margin:96px 70px 0;height:200px;display:flex;align-items:center;text-align:center;color:#fff;font-size:70px;line-height:1.12;font-weight:800;letter-spacing:-.03em}
    .ph{margin-top:46px;padding:16px;border-radius:64px;background:#10163a;box-shadow:0 40px 80px rgba(8,14,60,.45)}
    .ph img{display:block;width:810px;height:1440px;border-radius:50px}
  </style></head><body><h1>${caption}</h1><div class="ph"><img src="data:image/png;base64,${png.toString("base64")}"></div></body></html>`);
  await page.evaluate(() => document.fonts.ready);
  const out = await page.screenshot({ type: "jpeg", quality: 90 });
  await page.close();
  return out;
}

async function feature(browser) {
  const cat = fs.readFileSync(path.join(ROOT, "cat.js"), "utf8");
  const page = await browser.newPage({ viewport: { width: 1024, height: 500 } });
  await page.setContent(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    @font-face{font-family:Onest;src:url(data:font/woff2;base64,${font()}) format("woff2");font-weight:400 900}
    body{margin:0;width:1024px;height:500px;display:flex;align-items:center;justify-content:space-between;padding:0 50px 0 70px;box-sizing:border-box;overflow:hidden;background:${BG};font-family:Onest,sans-serif;color:#fff}
    .sun{position:relative;width:360px;height:360px;flex:none;display:grid;place-items:center}
    .sun::before{content:"";position:absolute;inset:8px;border-radius:50%;background:radial-gradient(circle at 50% 35%,#ffe08a 0%,#ffbe3d 55%,#ff9f1c 100%);box-shadow:0 0 0 22px rgba(255,190,61,.16),0 0 0 48px rgba(255,190,61,.08)}
    .cat{position:relative;width:330px;height:330px;filter:drop-shadow(0 18px 22px rgba(8,16,70,.4))} .cat svg{width:100%;height:100%} .cat-cover{opacity:0}
    h1{font-size:80px;line-height:1;margin:0 0 18px;letter-spacing:-.04em;font-weight:800}
    p{font-size:31px;line-height:1.3;margin:0 0 26px;color:rgba(255,255,255,.93);font-weight:500;max-width:520px}
    .chips{display:flex;gap:10px} .chips span{padding:9px 18px 11px;border-radius:999px;background:rgba(255,255,255,.17);font-size:22px;font-weight:700}
    .chips span:first-child{background:#ffb422;color:#2e1c00}
  </style></head><body><div><h1>Türkçe Yoʻl</h1><p>Turk tilini oʻzbek tilida, kuniga 10 daqiqada oʻrganing</p>
  <div class="chips"><span>100% bepul</span><span>A1 → C1</span><span>Reklamasiz</span></div></div>
  <div class="sun"><div class="cat" id="c"></div></div>
  <script>${cat}; document.getElementById("c").innerHTML = catSVG({ pose: "wave" });</script></body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const out = await page.screenshot({ type: "jpeg", quality: 92 });
  await page.close();
  return out;
}

if (require.main === module) (async () => {
  fs.mkdirSync(path.join(OUT, "screenshots"), { recursive: true });
  const browser = await chromium.launch();
  for (const s of SHOTS) {
    const png = await appShot(browser, s);
    fs.writeFileSync(path.join(OUT, "screenshots", s[0] + ".jpg"), await frame(browser, s[1], png));
    console.log("screenshots/" + s[0] + ".jpg");
  }
  fs.writeFileSync(path.join(OUT, "feature-1024x500.jpg"), await feature(browser));
  fs.copyFileSync(path.join(ROOT, "icon-maskable-512.png"), path.join(OUT, "icon-512.png"));
  await browser.close();
  console.log("feature-1024x500.jpg, icon-512.png");
})();
module.exports = { SHOTS };
