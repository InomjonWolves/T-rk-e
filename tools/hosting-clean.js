// Firebase Hosting storage: the free plan keeps 10 GB, and every deploy leaves a whole copy of the site (~120 MB with
// the audio). Left alone, the copies fill it and deploys fail (429 «exceeded the Hosting storage quota», 2026-11-28).
// Before each deploy (.github/workflows/firebase-hosting.yml): every site's live channel keeps KEEP releases from now
// on (retainedReleaseCount), and versions older than those are deleted now. The live version, the last KEEP releases
// and any channel's current version are never touched; if the live version cannot be read, nothing is deleted.
//   SA='<service account json>' node tools/hosting-clean.js      (DRY=1 — only lists)
const { accessToken, PROJECT } = require("./push.js");
const API = "https://firebasehosting.googleapis.com/v1beta1/";
const KEEP = 5;
const vid = name => String(name || "").split("/versions/")[1] || "";

// The versions of the KEEP newest releases (whatever order the list comes in)
const lastReleases = rel => rel.slice().sort((a, b) => Date.parse(b.releaseTime || 0) - Date.parse(a.releaseTime || 0)).slice(0, KEEP).map(r => vid(r.version?.name)).filter(Boolean);
// Which versions go: finished copies (and old unfinished ones) that no kept release or channel uses
function toDelete(versions, keep, now = Date.now()) {
  return versions.filter(v => !keep.has(vid(v.name)) && (v.status === "FINALIZED" || (v.status === "CREATED" || v.status === "ABANDONED") && now - Date.parse(v.createTime || 0) > 864e5));
}

async function run() {
  const sa = JSON.parse(process.env.SA || "null");
  if (!sa) { console.log("SA yoʻq — oʻtkazib yuborildi"); return; }
  const dry = !!process.env.DRY;
  const tok = await accessToken(sa, "https://www.googleapis.com/auth/firebase");
  const call = async (path, o = {}) => {
    const r = await fetch(path.startsWith("http") ? path : API + path, { ...o, headers: { Authorization: "Bearer " + tok, "Content-Type": "application/json" } });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`${o.method || "GET"} ${path}: ${r.status} ${j.error?.message || ""}`);
    return j;
  };
  const all = async (path, key) => {
    const out = [];
    let page = "";
    do {
      const j = await call(`${path}${path.includes("?") ? "&" : "?"}pageSize=100${page ? "&pageToken=" + page : ""}`);
      out.push(...(j[key] || []));
      page = j.nextPageToken || "";
    } while (page);
    return out;
  };
  let sites;
  try { sites = (await all(`projects/${PROJECT}/sites`, "sites")).map(s => s.name.split("/sites/")[1]); }
  catch (e) { console.log("Saytlar roʻyxati olinmadi:", e.message); sites = ["turkceyol"]; }
  let freed = 0, gone = 0;
  for (const site of sites) {
    const channels = await all(`sites/${site}/channels`, "channels");
    const live = channels.find(c => c.name.endsWith("/channels/live"));
    const keep = new Set(channels.map(c => vid(c.release?.version?.name)).filter(Boolean));
    const liveV = vid(live?.release?.version?.name);
    if (live && live.retainedReleaseCount !== KEEP && !dry)
      await call(`sites/${site}/channels/live?updateMask=retainedReleaseCount`, { method: "PATCH", body: JSON.stringify({ retainedReleaseCount: KEEP }) });
    const rel = live ? await all(`sites/${site}/channels/live/releases`, "releases") : [];
    lastReleases(rel).forEach(v => keep.add(v));
    const versions = await all(`sites/${site}/versions`, "versions");
    if (live && !liveV) { console.log(`${site}: jonli versiya oʻqilmadi — hech narsa oʻchirilmadi`); continue; }
    const del = toDelete(versions, keep);
    const mb = del.reduce((a, v) => a + (+v.versionBytes || 0), 0) / 1048576;
    console.log(`${site}: ${versions.length} ta versiya, ${keep.size} tasi qoladi, ${del.length} tasi oʻchiriladi (~${Math.round(mb)} MB)${live ? `, saqlash: ${KEEP} ta reliz` : ""}`);
    if (dry) continue;
    for (const v of del) {
      try { await call(v.name, { method: "DELETE" }); gone++; freed += (+v.versionBytes || 0) / 1048576; }
      catch (e) { console.log("Oʻchmadi:", e.message); }
    }
  }
  console.log(`Jami oʻchirildi: ${gone} ta versiya, ~${Math.round(freed)} MB`);
}

if (require.main === module) run().catch(e => { console.error(e.message); process.exit(1); });
module.exports = { toDelete, lastReleases, vid, KEEP };
