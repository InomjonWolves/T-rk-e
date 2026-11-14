// Builds native/www — the site files packed inside the standalone Android app (Capacitor).
// The app opens from these local files (works offline, no browser needed). Differences from the site:
//  • window.TY_NATIVE = 1 — app.js switches to the app mode (no service worker, no "install the app" card, Google sign-in
//    through the phone later — see CLAUDE.md, Android 2-bosqich);
//  • Firebase SDK comes from the app itself (vendor/firebase/, copied from the "firebase" npm package), not from a CDN;
//  • every audio recording is packed too (audio/index.txt and the mp3 files it lists, ~80 MB): Turkish sounds the same
//    offline and without the site (decision of 2026-11-14, Android 5-bosqich). app.js reads them from audio/ (AUDIO_BASE "").
// Run: cd native && npm install && node ../tools/native-www.js && npx cap sync android
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "native", "www");
const SITE = "https://turkceyol.web.app/";
const FB_VERSION = "10.12.2";
// Everything the app page loads (index.html, scripts loaded on demand, styles, fonts, icons, the privacy policy)
const FILES = [
  "index.html", "privacy.html", "styles.css", "pages.css", "firebase-config.js",
  "app.js", "cat.js", "content.js", "lugat.js", "grammar.js", "grammar-ex.js", "guide.js",
  "course-core.js", "course.js", "oqish.js", "placement.js",
  "icon.svg", "icon-192.png", "icon-512.png", "icon-maskable-512.png"
];
const DIRS = ["fonts"];
const FB_FILES = ["app", "auth", "firestore", "messaging"].map(n => `firebase-${n}-compat.js`);

function nativeHead() {
  return `<script>/* Ilova (Capacitor) */window.TY_NATIVE=1;window.FB_SDK_BASE="vendor/firebase/";</script>`;
}
// The app's index.html: the native flags first, no CDN preloads, no manifest (the app has its own icon)
function patchIndex(html) {
  return html
    .replace(/<script>\/\* Yagona manzil[^<]*<\/script>\s*/, "")
    .replace(/<link rel="preload" as="script" href="https:\/\/www\.gstatic\.com\/[^"]+">\s*/g, "")
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
// The recordings listed in audio/index.txt (the app's audioIndex() reads the same list); a listed file must exist
function audioFiles() {
  const keys = fs.readFileSync(path.join(ROOT, "audio", "index.txt"), "utf8").split("\n").filter(Boolean);
  return keys.map(k => `audio/${k.slice(0, 2)}/${k}.mp3`);
}
function copyAudio() {
  const files = audioFiles(), miss = files.filter(f => !fs.existsSync(path.join(ROOT, f)));
  if (miss.length) throw new Error(`audio: ${miss.length} ta fayl yoʻq, masalan ${miss[0]}`);
  for (const f of files) { fs.mkdirSync(path.dirname(path.join(OUT, f)), { recursive: true }); fs.copyFileSync(path.join(ROOT, f), path.join(OUT, f)); }
  fs.copyFileSync(path.join(ROOT, "audio", "index.txt"), path.join(OUT, "audio", "index.txt"));
  return files.length;
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
  if (ver !== FB_VERSION) throw new Error(`firebase ${ver} — app.js ${FB_VERSION} ni kutadi`);
  fs.mkdirSync(path.join(OUT, "vendor", "firebase"), { recursive: true });
  for (const f of FB_FILES) fs.copyFileSync(path.join(fb, f), path.join(OUT, "vendor", "firebase", f));
  const n = copyAudio();
  return `${OUT} (audio: ${n} ta fayl)`;
}
module.exports = { build, patchIndex, audioFiles, FILES, SITE };
if (require.main === module) console.log(build());
