// Draws img/og.jpg (1200×630), the picture shown when a link is shared (Telegram, Facebook…). Run: node tools/og.js
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");
const ROOT = path.resolve(__dirname, "..");
(async () => {
  const cat = fs.readFileSync(path.join(ROOT, "cat.js"), "utf8");
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  // The site's own font, embedded (the page has no address to load files from)
  const font = fs.readFileSync(path.join(ROOT, "fonts", "onest-v1.woff2")).toString("base64");
  await p.setContent(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    @font-face{font-family:Onest;src:url(data:font/woff2;base64,${font}) format("woff2");font-weight:400 900}
    body{margin:0;width:1200px;height:630px;display:flex;align-items:center;justify-content:space-between;gap:30px;padding:0 70px 0 80px;box-sizing:border-box;
      font-family:Onest,system-ui,sans-serif;color:#fff;overflow:hidden;
      background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='112' height='112' viewBox='0 0 56 56' fill='none' stroke='%23fff' stroke-opacity='.12' stroke-width='1.1'%3E%3Crect x='16' y='16' width='24' height='24'/%3E%3Cpath d='M28 11 45 28 28 45 11 28zM0-5l5 5-5 5-5-5zM56-5l5 5-5 5-5-5zM0 51l5 5-5 5-5-5zM56 51l5 5-5 5-5-5z'/%3E%3C/svg%3E"),linear-gradient(150deg,#4c6ff2 0%,#3654d4 55%,#2a41b3 100%)}
    .sun{position:relative;width:430px;height:430px;flex:none;display:grid;place-items:center}
    .sun::before{content:"";position:absolute;inset:10px;border-radius:50%;background:radial-gradient(circle at 50% 35%,#ffe08a 0%,#ffbe3d 55%,#ff9f1c 100%);box-shadow:0 0 0 26px rgba(255,190,61,.16),0 0 0 58px rgba(255,190,61,.08)}
    .cat{position:relative;width:400px;height:400px;filter:drop-shadow(0 22px 26px rgba(8,16,70,.4))} .cat svg{width:100%;height:100%} .cat-cover{opacity:0}
    h1{font-size:96px;line-height:1;margin:0 0 22px;letter-spacing:-.04em;font-weight:800}
    p{font-size:36px;line-height:1.3;margin:0 0 32px;color:rgba(255,255,255,.92);font-weight:500;max-width:600px}
    .chips{display:flex;gap:12px;flex-wrap:wrap} .chips span{padding:11px 22px 13px;border-radius:999px;background:rgba(255,255,255,.17);font-size:26px;font-weight:700}
    .chips span:first-child{background:#ffb422;color:#2e1c00}
  </style></head><body><div><h1>Türkçe Yoʻl</h1>
  <p>Turk tilini oʻzbek tilida, kuniga 10 daqiqada oʻrganing</p>
  <div class="chips"><span>100% bepul</span><span>A1 → B2</span><span>Reklamasiz</span></div></div>
  <div class="sun"><div class="cat" id="c"></div></div>
  <script>${cat}; document.getElementById("c").innerHTML = catSVG({ pose: "wave" });</script></body></html>`);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(ROOT, "img", "og.jpg"), type: "jpeg", quality: 86 });
  await b.close();
  console.log("img/og.jpg");
})();
