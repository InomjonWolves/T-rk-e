// Draws img/og.jpg (1200×630), the picture shown when a link is shared (Telegram, Facebook…). Run: node tools/og.js
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");
const ROOT = path.resolve(__dirname, "..");
(async () => {
  const cat = fs.readFileSync(path.join(ROOT, "cat.js"), "utf8");
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.setContent(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{margin:0;width:1200px;height:630px;display:flex;align-items:center;gap:40px;padding:0 80px;box-sizing:border-box;
      font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1a1d3a;
      background:radial-gradient(circle at 15% 20%,#b7d0ff 0,transparent 45%),radial-gradient(circle at 85% 15%,#d9ccff 0,transparent 45%),radial-gradient(circle at 70% 95%,#ffd2e4 0,transparent 50%),#edf1fc}
    .cat{width:380px;height:380px;flex:none} .cat svg{width:100%;height:100%}
    h1{font-size:84px;line-height:1;margin:0 0 18px;letter-spacing:-.02em}
    p{font-size:34px;line-height:1.3;margin:0 0 28px;color:#464b70}
    .chips{display:flex;gap:12px;flex-wrap:wrap} .chips span{padding:10px 20px;border-radius:999px;background:#fff;font-size:26px;font-weight:700;color:#4453e6}
    .g{background:linear-gradient(135deg,#6f8dff,#8f6bf5 55%,#e27bd0);-webkit-background-clip:text;color:transparent}
  </style></head><body><div class="cat" id="c"></div><div><h1>Türkçe <span class="g">Yoʻl</span></h1>
  <p>Turk tilini oʻzbek tilida, kuniga 10 daqiqada oʻrganing</p>
  <div class="chips"><span>A1 → B2</span><span>100% bepul</span><span>Reklamasiz</span></div></div>
  <script>${cat}; document.getElementById("c").innerHTML = catSVG({ pose: "wave" });</script></body></html>`);
  await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(ROOT, "img", "og.jpg"), type: "jpeg", quality: 86 });
  await b.close();
  console.log("img/og.jpg");
})();
