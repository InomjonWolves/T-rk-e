// Minifies the site's scripts and styles IN PLACE — only at deploy time (the Firebase workflow, the app bundle):
// the repository keeps the readable sources. esbuild without an output format keeps every top-level name (the
// scripts share them as globals), only shortens local names, spaces and comments; no syntax is lowered.
//   node tools/minify.js [dir] [--version <id>]   (dir: default the repository; --version writes CACHE in sw.js)
const fs = require("fs");
const path = require("path");

const JS = ["app.js", "cat.js", "content.js", "lugat.js", "grammar.js", "grammar-ex.js", "guide.js", "course-core.js", "course.js", "oqish.js", "placement.js", "morph.js", "sync.js"];
const CSS = ["styles.css", "pages.css"];

function esbuild() {
  for (const p of ["esbuild", path.join(__dirname, "..", "native", "node_modules", "esbuild")]) { try { return require(p); } catch (e) {} }
  return null;
}
function minifyDir(dir) {
  const eb = esbuild();
  if (!eb) { console.warn("esbuild topilmadi — fayllar siqilmadi"); return null; }
  let before = 0, after = 0;
  for (const f of [...JS, ...CSS]) {
    const p = path.join(dir, f);
    if (!fs.existsSync(p)) continue;
    const src = fs.readFileSync(p, "utf8");
    const out = eb.transformSync(src, { loader: f.endsWith(".css") ? "css" : "js", minify: true, legalComments: "none", charset: "utf8" }).code;
    fs.writeFileSync(p, out);
    before += Buffer.byteLength(src); after += Buffer.byteLength(out);
  }
  return { before, after };
}
// A new service worker for every deploy: CACHE carries the commit, so a forgotten version bump can not keep old files
function stampCache(dir, id) {
  const p = path.join(dir, "sw.js"), s = fs.readFileSync(p, "utf8");
  const out = s.replace(/const CACHE = "turkce-yol-[^"]*"/, `const CACHE = "turkce-yol-${id}"`);
  if (out === s) throw new Error("sw.js: CACHE topilmadi");
  fs.writeFileSync(p, out);
}
module.exports = { minifyDir, stampCache, JS, CSS };
if (require.main === module) {
  const args = process.argv.slice(2), vi = args.indexOf("--version");
  const ver = vi >= 0 ? args.splice(vi, 2)[1] : null;
  const dir = path.resolve(args[0] || path.join(__dirname, ".."));
  const r = minifyDir(dir);
  if (ver) stampCache(dir, String(ver).replace(/[^a-z0-9.-]/gi, "").slice(0, 16));
  if (r) console.log(`siqildi: ${Math.round(r.before / 1024)} KB → ${Math.round(r.after / 1024)} KB${ver ? `, CACHE turkce-yol-${ver}` : ""}`);
}
