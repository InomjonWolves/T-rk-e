// Advertising banners for Telegram channels and groups → promo/: the app's own screens (drawn by Playwright, the same
// demo progress as the Play pictures), Pamuk (our SVG) and our texts. Sizes Telegram shows well: 1280×720 (post),
// 1080×1080 (square), 1080×1350 (tall post), 1080×1920 (story). Post texts: promo/posts.json (sent to the admin's chat
// by tools/telegram-promo.js). Run: node tools/promo.js
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");
const { SHOTS, appShot, BG, font } = require("./play-assets.js");
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "promo");

const shot = name => SHOTS.find(s => s[0] === name);
const SCREENS = {
  home: shot("01-bosh"), path: shot("02-yol"), quiz: shot("03-mashq"), word: shot("07-soz"),
  lenta: ["lenta", "", "#lenta", async () => { await new Promise(r => setTimeout(r, 600)); }, 500]
};
const SITE = "turkceyol.web.app", BOT = "@TurkceYolBot";
const SKY = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 130'%3E%3Cpath fill='%23fff' fill-opacity='.13' d='M0 130V104h18V74l3-16 3 16v30h12V92q0-22 26-30q26 8 26 30v12h8V64l3-18 3 18v40h14V96q0-14 15-18q15 4 15 18v8h16V40l5-22 5 22v64h12V86q0-34 38-46q38 12 38 46v18h10V58l3-20 3 20v46h22V74h-6l3-8h-3v-6h6l14-38 14 38h6v6h-3l3 8h-6v56z'/%3E%3C/svg%3E")`;
// Our own line icons (the same drawings as the app's ICON set)
const ic = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ICO = {
  cap: ic('<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5M22 9v6"/>'),
  feed: ic('<rect x="5" y="2.5" width="14" height="19" rx="3"/><path d="M9 8l3-3 3 3M9 16l3 3 3-3"/>'),
  book: ic('<path d="M2 5.5C4 4 7 4 12 6c5-2 8-2 10-.5V19c-2-1.5-5-1.5-10 .5-5-2-8-2-10-.5z"/><path d="M12 6v13.5"/>'),
  mic: ic('<rect x="9" y="2.5" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3.5"/>'),
  word: ic('<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>'),
  trophy: ic('<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 14v4M8 21h8l-1-3H9z"/>'),
  check: ic('<path d="m5 12 5 5 9-10"/>'),
  send: ic('<path d="M21 3 3 10.5l7 2.5 2.5 7z"/><path d="m10 13 4-4"/>')
};

const css = w => `
  @font-face{font-family:Onest;src:url(data:font/woff2;base64,${font()}) format("woff2");font-weight:400 900}
  *{box-sizing:border-box} body{margin:0;overflow:hidden;font-family:Onest,sans-serif;color:#fff;position:relative;
    background:${SKY} bottom/${w}px auto no-repeat,${BG}}
  .brand{display:flex;align-items:center;gap:14px;font-weight:800;letter-spacing:-.02em}
  .brand img{border-radius:24%;box-shadow:0 6px 16px rgba(8,14,60,.35)}
  h1{margin:0;font-weight:800;letter-spacing:-.035em;line-height:1.04}
  .hl{color:#ffc53d}
  p{margin:0;font-weight:500;color:rgba(255,255,255,.92);line-height:1.32}
  .chips{display:flex;gap:12px;flex-wrap:wrap} .chips span{padding:10px 20px 12px;border-radius:999px;background:rgba(255,255,255,.17);font-weight:700}
  .chips span:first-child{background:#ffb422;color:#2e1c00}
  .cta{display:inline-flex;align-items:center;gap:12px;padding:16px 30px 18px;border-radius:999px;background:#ffb422;color:#2e1c00;font-weight:800;
    box-shadow:0 6px 0 #c77d00,0 16px 30px rgba(8,14,60,.35)}
  .cta svg,.tg svg{width:1em;height:1em}
  .tg{display:inline-flex;align-items:center;gap:10px;font-weight:700;color:#fff;opacity:.95}
  .phone{position:absolute;padding:12px;border-radius:52px;background:#10163a;box-shadow:0 40px 70px rgba(6,10,48,.5),inset 0 0 0 2px rgba(255,255,255,.08)}
  .phone img{display:block;width:100%;border-radius:41px}
  .sun{position:absolute;display:grid;place-items:center}
  .sun::before{content:"";position:absolute;inset:6%;border-radius:50%;background:radial-gradient(circle at 50% 35%,#ffe08a 0%,#ffbe3d 55%,#ff9f1c 100%);
    box-shadow:0 0 0 22px rgba(255,190,61,.16),0 0 0 48px rgba(255,190,61,.07)}
  .cat{position:relative;width:96%;height:96%;filter:drop-shadow(0 18px 22px rgba(8,16,70,.4))} .cat svg{width:100%;height:100%} .cat-cover{opacity:0}
  .tile{background:rgba(255,255,255,.12);border:2px solid rgba(255,255,255,.16);border-radius:28px;padding:22px 22px 24px;display:flex;flex-direction:column;gap:10px}
  .tile i{width:58px;height:58px;border-radius:18px;display:grid;place-items:center;color:#fff} .tile i svg{width:32px;height:32px}
  .tile b{font-size:30px;letter-spacing:-.02em} .tile span{font-size:22px;color:rgba(255,255,255,.88);font-weight:500;line-height:1.3}
  .c1{background:#f08c00}.c2{background:#e8590c}.c3{background:#0ca678}.c4{background:#d6336c}.c5{background:#7048e8}.c6{background:#1098ad}
  .ticks{display:flex;flex-direction:column;gap:18px;margin:0;padding:0;list-style:none}
  .ticks li{display:flex;align-items:center;gap:16px;font-weight:700}
  .ticks li i{flex:none;width:44px;height:44px;border-radius:50%;background:#12b886;display:grid;place-items:center} .ticks li i svg{width:26px;height:26px}
`;

const img64 = b => "data:image/png;base64," + b.toString("base64");
const icon = () => img64(fs.readFileSync(path.join(ROOT, "icon-192.png")));
const cat = (pose, look) => `<div class="cat" data-pose="${pose}" data-look="${look || ""}"></div>`;
const phone = (png, style) => `<div class="phone" style="${style}"><img src="${img64(png)}"></div>`;
const brand = size => `<div class="brand" style="font-size:${size}px"><img src="${icon()}" width="${Math.round(size * 1.7)}" height="${Math.round(size * 1.7)}">Türkçe Yoʻl</div>`;

const BANNERS = [
  // 1280×720: the post picture (16:9)
  ["01-asosiy", 1280, 720, s => `
    <div style="position:absolute;left:72px;top:64px;width:640px;display:flex;flex-direction:column;gap:24px">
      ${brand(30)}
      <h1 style="font-size:66px">Turk tilini oʻzbek tilida <span class="hl">bepul</span> oʻrganing</h1>
      <p style="font-size:27px;max-width:600px">A1 dan C1 gacha kurs, lenta, hikoyalar, gapirish va tinglash mashqlari — kuniga 10 daqiqa.</p>
      <div class="chips" style="font-size:21px"><span>100% bepul</span><span>Reklamasiz</span><span>A1 → C1</span></div>
      <div style="display:flex;align-items:center;gap:26px;margin-top:6px"><span class="cta" style="font-size:28px">${SITE}</span><span class="tg" style="font-size:24px">${ICO.send}${BOT}</span></div>
    </div>
    ${phone(s.lenta, "right:60px;top:70px;width:262px;transform:rotate(7deg)")}
    ${phone(s.home, "right:262px;top:40px;width:282px;transform:rotate(-5deg)")}
    <div class="sun" style="right:430px;bottom:-40px;width:250px;height:250px">${cat("wave")}</div>`],
  // 1080×1080: what is inside
  ["02-imkoniyatlar", 1080, 1080, () => `
    <div style="position:absolute;inset:70px 70px auto;display:flex;flex-direction:column;gap:20px">
      ${brand(30)}
      <h1 style="font-size:70px">Bitta ilovada — <span class="hl">hammasi</span></h1>
      <p style="font-size:28px">Turk tilini oʻzbek tilida, oʻz surʼatingizda oʻrganing.</p>
    </div>
    <div style="position:absolute;left:70px;right:70px;top:318px;display:grid;grid-template-columns:repeat(3,1fr);gap:20px">
      <div class="tile"><i class="c5">${ICO.cap}</i><b>Kurs A1–C1</b><span>40 boʻlim va daraja testlari</span></div>
      <div class="tile"><i class="c2">${ICO.feed}</i><b>Lenta</b><span>Varaqlab soʻz va qoida yodlang</span></div>
      <div class="tile"><i class="c1">${ICO.book}</i><b>Hikoyalar</b><span>Qahramonlar bilan interaktiv</span></div>
      <div class="tile"><i class="c4">${ICO.mic}</i><b>Gapirish</b><span>Talaffuzni mikrofon tekshiradi</span></div>
      <div class="tile"><i class="c6">${ICO.word}</i><b>Lugʻat</b><span>3000+ soʻz, ovozi bilan</span></div>
      <div class="tile"><i class="c3">${ICO.trophy}</i><b>Reyting</b><span>Ligalar, doʻstlar, seriya</span></div>
    </div>
    <div style="position:absolute;left:70px;bottom:90px;display:flex;flex-direction:column;gap:20px">
      <span class="cta" style="font-size:32px">${SITE}</span><span class="tg" style="font-size:26px">${ICO.send}Telegramda: ${BOT}</span>
    </div>
    <div class="sun" style="right:56px;bottom:40px;width:270px;height:270px">${cat("cheer")}</div>`],
  // 1080×1350: the feed (tall post)
  ["03-lenta", 1080, 1350, s => `
    <div style="position:absolute;inset:70px 70px auto;display:flex;flex-direction:column;gap:22px">
      ${brand(30)}
      <h1 style="font-size:74px">Varaqlang — <span class="hl">turkcha</span> oʻrganing</h1>
      <p style="font-size:30px;max-width:880px">Ijtimoiy tarmoqdagi 10 daqiqangizni til oʻrganishga bering: soʻzlar, qoidalar va tinglash — Reels kabi lentada.</p>
    </div>
    ${phone(s.lenta, "left:120px;top:424px;width:400px;transform:rotate(-4deg)")}
    <ul class="ticks" style="position:absolute;left:610px;top:560px;width:410px;font-size:29px">
      <li><i>${ICO.check}</i>Har karta — yangi soʻz yoki qoida</li>
      <li><i>${ICO.check}</i>Tinglang va gapiring</li>
      <li><i>${ICO.check}</i>Yulduz va XP yigʻing</li>
    </ul>
    <div class="sun" style="right:40px;bottom:200px;width:300px;height:300px">${cat("wave")}</div>
    <div style="position:absolute;left:0;right:0;bottom:70px;display:flex;justify-content:center;align-items:center;gap:30px">
      <span class="cta" style="font-size:32px">${SITE}</span><span class="tg" style="font-size:26px">${ICO.send}${BOT}</span>
    </div>`],
  // 1080×1920: a story (the top and bottom 250 px stay free for Telegram's own buttons)
  ["04-story", 1080, 1920, s => `
    <div style="position:absolute;inset:250px 80px auto;display:flex;flex-direction:column;align-items:center;text-align:center;gap:22px">
      ${brand(34)}
      <h1 style="font-size:84px">Turk tili — <span class="hl">oʻzbek tilida</span></h1>
      <p style="font-size:32px">Bepul, reklamasiz, kuniga 10 daqiqa</p>
    </div>
    ${phone(s.path, "left:40px;top:610px;width:320px;transform:rotate(-9deg)")}
    ${phone(s.word, "right:40px;top:610px;width:320px;transform:rotate(9deg)")}
    ${phone(s.quiz, "left:360px;top:550px;width:360px")}
    <ul class="ticks" style="position:absolute;left:90px;top:1275px;width:620px;font-size:31px">
      <li><i>${ICO.check}</i>Kurs: A1 dan C1 gacha</li>
      <li><i>${ICO.check}</i>Gapirish va tinglash mashqlari</li>
      <li><i>${ICO.check}</i>Lenta va hikoyalar</li>
    </ul>
    <div class="sun" style="right:60px;top:1170px;width:270px;height:270px">${cat("wave")}</div>
    <div style="position:absolute;left:0;right:0;bottom:280px;display:flex;flex-direction:column;align-items:center;gap:22px">
      <span class="cta" style="font-size:40px">${SITE}</span><span class="tg" style="font-size:30px">${ICO.send}Telegramda: ${BOT}</span>
    </div>`]
];

async function banner(browser, [name, w, h, body], screens) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const catJs = fs.readFileSync(path.join(ROOT, "cat.js"), "utf8");
  await page.setContent(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{width:${w}px;height:${h}px}${css(w)}</style></head>
    <body>${body(screens)}<script>${catJs}; document.querySelectorAll(".cat").forEach(c => c.innerHTML = catSVG({ pose: c.dataset.pose }));</script></body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const out = await page.screenshot({ type: "jpeg", quality: 90 });
  await page.close();
  fs.writeFileSync(path.join(OUT, name + ".jpg"), out);
  console.log("promo/" + name + ".jpg");
}

if (require.main === module) (async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const screens = {};
  for (const [k, s] of Object.entries(SCREENS)) screens[k] = await appShot(browser, s);
  for (const b of BANNERS) await banner(browser, b, screens);
  await browser.close();
})();
module.exports = { BANNERS };
