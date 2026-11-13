// Draws the app icons from Pamuk's own SVG (cat.js): icon.svg, icon-192.png, icon-512.png, icon-maskable-512.png.
// Run after changing the cat: node tools/icons.js
const path = require("path");
const fs = require("fs");
const vm = require("vm");
const { chromium } = require("playwright");
const ROOT = path.resolve(__dirname, "..");
const ctx = {};
// Only the drawing part of cat.js (CatLife needs a browser)
const catSrc = fs.readFileSync(path.join(ROOT, "cat.js"), "utf8").split("/* ---------- CatLife")[0];
vm.runInNewContext(catSrc + ";this.catSVG = catSVG;", ctx);
// The head, without fur noise (icons are small), placed in a box of the icon
function head(x, y, w) {
  const svg = ctx.catSVG({ pose: "head", lite: true });
  const vb = svg.match(/viewBox="([^"]+)"/)[1].split(" ").map(Number);
  const h = w * vb[3] / vb[2];
  const inner = svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  return `<svg x="${x}" y="${y}" width="${w}" height="${h.toFixed(1)}" viewBox="${vb.join(" ")}">${inner}</svg>`;
}
const BG = `<radialGradient id="bgA" cx="35%" cy="25%" r="75%"><stop offset="0" stop-color="#ffd987"/><stop offset=".7" stop-color="#ff9a2f"/></radialGradient>`;
const round = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs>${BG}<clipPath id="cc"><circle cx="256" cy="256" r="256"/></clipPath></defs><circle cx="256" cy="256" r="256" fill="url(#bgA)"/><g clip-path="url(#cc)">${head(28, 52, 456)}</g></svg>`;
// Maskable: full-bleed background, the head inside the 80% safe circle
const mask = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs>${BG}</defs><rect width="512" height="512" fill="url(#bgA)"/>${head(92, 104, 328)}</svg>`;
(async () => {
  fs.writeFileSync(path.join(ROOT, "icon.svg"), round);
  const b = await chromium.launch();
  const p = await b.newPage();
  for (const [file, svg, size] of [["icon-192.png", round, 192], ["icon-512.png", round, 512], ["icon-maskable-512.png", mask, 512]]) {
    await p.setViewportSize({ width: size, height: size });
    await p.setContent(`<!DOCTYPE html><html><body style="margin:0;background:transparent">${svg.replace("<svg ", `<svg width="${size}" height="${size}" `)}</body></html>`);
    await p.screenshot({ path: path.join(ROOT, file), omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
  }
  await b.close();
  console.log("icon.svg, icon-192.png, icon-512.png, icon-maskable-512.png");
})();
