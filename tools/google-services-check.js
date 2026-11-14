// Checks native/android/app/google-services.json (written by the native workflow from the GOOGLE_SERVICES_JSON secret):
// the Android app uz.turkceyol.app must be in it, with the web OAuth client Google sign-in needs.
const fs = require("fs");
const path = require("path");
const file = process.argv[2] || path.join(__dirname, "..", "native", "android", "app", "google-services.json");
function check(j) {
  const c = (j.client || []).find(c => c.client_info && c.client_info.android_client_info && c.client_info.android_client_info.package_name === "uz.turkceyol.app");
  if (!c) return { ok: false, msg: "google-services.json da uz.turkceyol.app ilovasi yoʻq" };
  const kinds = (c.oauth_client || []).map(o => o.client_type);
  const all = (c.services && c.services.appinvite_service && c.services.appinvite_service.other_platform_oauth_client || []).map(o => o.client_type);
  return { ok: true, project: j.project_info && j.project_info.project_id, web: kinds.includes(3) || all.includes(3), android: kinds.includes(1) };
}
module.exports = { check };
if (require.main === module) {
  const r = check(JSON.parse(fs.readFileSync(file, "utf8")));
  if (!r.ok) { console.log("::error::" + r.msg); process.exit(1); }
  console.log(`loyiha: ${r.project} | veb mijoz: ${r.web} | android mijoz (SHA-1): ${r.android}`);
  if (!r.web) console.log("::warning::veb mijoz (client_type 3) yoʻq — Firebase'da Google bilan kirish yoqilganini tekshiring");
  if (!r.android) console.log("::warning::android mijoz yoʻq — Firebase'dagi ilovaga SHA-1 qoʻshilganini tekshiring");
}
