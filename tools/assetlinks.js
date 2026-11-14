// Writes .well-known/assetlinks.json — the site's proof that the Android app uz.turkceyol.app belongs to it,
// so Android opens turkceyol.web.app inside the app full screen (no address bar).
// Fingerprints: the upload key (passed by the Android workflow: node tools/assetlinks.js AA:BB:…) and, after the first
// Google Play upload, Play's app signing key — one per line in android/play-sha256.txt (Play Console → App integrity).
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const PKG = "uz.turkceyol.app";
const FP = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/;
function fingerprints(extra = []) {
  const file = path.join(ROOT, "android", "play-sha256.txt");
  const play = fs.existsSync(file) ? fs.readFileSync(file, "utf8").split("\n").map(l => l.replace(/#.*/, "").trim()).filter(Boolean) : [];
  const all = [...extra, ...play].map(s => s.trim().toUpperCase());
  const bad = all.filter(s => !FP.test(s));
  if (bad.length) throw new Error("Notoʻgʻri SHA-256: " + bad.join(", "));
  return [...new Set(all)];
}
function assetlinks(fps) {
  return [{ relation: ["delegate_permission/common.handle_all_urls"], target: { namespace: "android_app", package_name: PKG, sha256_cert_fingerprints: fps } }];
}
module.exports = { fingerprints, assetlinks, PKG };
if (require.main === module) {
  const fps = fingerprints(process.argv.slice(2));
  if (!fps.length) { console.error("Barmoq izi yoʻq"); process.exit(1); }
  const out = path.join(ROOT, ".well-known", "assetlinks.json");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(assetlinks(fps), null, 2) + "\n");
  console.log(out, fps.length);
}
