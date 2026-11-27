// Builds native/www — the site files packed inside the standalone Android app (Capacitor).
// The app opens from these local files (works offline, no browser needed). Differences from the site:
//  • window.TY_NATIVE = 1 — the app switches to the app mode (no service worker, no "install the app" card, Google sign-in
//    through the phone later — see CLAUDE.md, Android 2-bosqich);
//  • Firebase SDK comes from the app itself (vendor/firebase/, copied from the "firebase" npm package), not from a CDN;
//  • the audio recordings are NOT packed (2026-11-16: they made the app ~80 MB bigger): the app plays each one from the
//    site when it is needed and keeps it (js/ui.js audioSrc — the "ty-audio" cache); only the list audio/index.txt is
//    packed, for the first start without internet. The site lets the app read them (firebase.json: CORS on audio/).
// Run: cd native && npm install && node ../tools/native-www.js && npx cap sync android
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "native", "www");
const SITE = "https://turkceyol.web.app/";
const FB_VERSION = "10.12.2";
// Everything the app page loads (index.html, scripts loaded on demand, styles, fonts, icons, the document pages)
const FILES = [
  "index.html", "privacy.html", "shartlar.html", "biz-haqimizda.html", "hisob-ochirish.html", "styles.css", "pages.css", "firebase-config.js",
  "cat.js", "content.js", "lugat.js", "grammar.js", "grammar-ex.js", "guide.js",
  "course-core.js", "course.js", "oqish.js", "placement.js", "hikoya.js", "mock.js", "kirill-lex.js", "morph.js", "sync.js",
  "icon.svg", "icon-192.png", "icon-512.png", "icon-maskable-512.png"
];
const DIRS = ["fonts", "js"];
// The app's own scripts (js/, as index.html loads them)
const APP_JS = fs.readdirSync(path.join(ROOT, "js")).filter(f => f.endsWith(".js")).map(f => "js/" + f);
const FB_FILES = ["app", "auth", "firestore", "messaging"].map(n => `firebase-${n}-compat.js`);

function nativeHead() {
  return `<script>/* Ilova (Capacitor) */window.TY_NATIVE=1;window.FB_SDK_BASE="vendor/firebase/";</script>`;
}
// The app's index.html: the native flags first, no CDN preloads, no manifest (the app has its own icon)
function patchIndex(html) {
  return html
    .replace(/<script>\/\* Yagona manzil[^<]*<\/script>\s*/, "")
    .replace(/<link rel="preload" as="script" href="https:\/\/www\.gstatic\.com\/[^"]+">\s*/g, "")
    .replace(/<!-- Firebase SDK:[^>]*-->\s*<link rel="preconnect" href="https:\/\/www\.gstatic\.com"[^>]*>\s*/, "")
    .replace(/<link rel="manifest"[^>]*>\s*/, "")
    .replace(/<meta charset="utf-8">/i, m => m + "\n" + nativeHead());
}
function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}
// Only the list of recordings goes into the app (the files stay on the site)
function copyAudio() {
  fs.mkdirSync(path.join(OUT, "audio"), { recursive: true });
  fs.copyFileSync(path.join(ROOT, "audio", "index.txt"), path.join(OUT, "audio", "index.txt"));
  return fs.readFileSync(path.join(ROOT, "audio", "index.txt"), "utf8").split("\n").filter(Boolean).length;
}
function build() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  for (const f of FILES) fs.copyFileSync(path.join(ROOT, f), path.join(OUT, f));
  for (const d of DIRS) copyDir(path.join(ROOT, d), path.join(OUT, d));
  const idx = path.join(OUT, "index.html"), html = fs.readFileSync(idx, "utf8"), out = patchIndex(html);
  if (!out.includes("window.TY_NATIVE=1")) throw new Error("index.html: <meta charset> topilmadi");
  fs.writeFileSync(idx, out);
  const fb = path.join(ROOT, "native", "node_modules", "firebase");
  const ver = JSON.parse(fs.readFileSync(path.join(fb, "package.json"), "utf8")).version;
  if (ver !== FB_VERSION) throw new Error(`firebase ${ver} — ilova ${FB_VERSION} ni kutadi`);
  fs.mkdirSync(path.join(OUT, "vendor", "firebase"), { recursive: true });
  for (const f of FB_FILES) fs.copyFileSync(path.join(fb, f), path.join(OUT, "vendor", "firebase", f));
  // The phone parses less: the same minified code as the website (tools/minify.js)
  require("./minify.js").minifyDir(OUT);
  // The app's version in the error log: its build number (the same as versionCode)
  const st = path.join(OUT, "js", "state.js"), run = process.env.GITHUB_RUN_NUMBER, a = fs.readFileSync(st, "utf8");
  fs.writeFileSync(st, a.replace(/const APP_V\s*=\s*"[^"]*"/, `const APP_V="app-${run ? 1000 + +run : "dev"}"`));
  const n = copyAudio();
  return `${OUT} (audio roʻyxati: ${n} ta yozuv, fayllar saytda)`;
}
module.exports = { build, patchIndex, FILES, APP_JS, SITE };
if (require.main === module) console.log(build());
