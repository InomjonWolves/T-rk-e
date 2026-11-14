// Weekly league results computed on the server (GitHub Actions, every Monday) instead of on each phone: the same
// rule as the app (top 30% of a league with at least LG_MIN XP move up, an idle week below LG_DOWN moves down),
// over the whole league table, written to lgres/{uid} = { w, from, to, rank, n, xp, at }. Users can only read their
// own result (firestore.rules); nobody can write it but this service account. The app takes it when it is there
// (lgSettle); with window.LEAGUE_SERVER = true it waits up to LG_WAIT_H hours for it, otherwise falls back to the
// phone's own count. Secret: PUSH_SERVICE_ACCOUNT (role "Cloud Datastore User"). DRY=1 — print, write nothing.
const { accessToken, fromFs, PROJECT } = require("./push.js");
const LG_UP = 0.3, LG_MIN = 300, LG_SOLO = 1000, LG_DOWN = 50; // the same as app.js

// The Monday of the week before `now` (UTC), as the app writes week keys (YYYY-MM-DD)
function lastWeek(now = new Date()) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7 - 7);
  return d.toISOString().slice(0, 10);
}
// rows: league docs {id, week, wxp, lg, pw, pwxp, plg} → { uid: { w, from, to, rank, n, xp } } for week w
function settle(rows, w) {
  const players = [];
  for (const r of rows) {
    const p = r.week === w ? { lg: r.lg || 1, xp: r.wxp || 0 } : r.pw === w ? { lg: r.plg || 1, xp: r.pwxp || 0 } : null;
    if (p) players.push(Object.assign({ id: r.id }, p));
  }
  const out = {};
  for (let lg = 1; lg <= 7; lg++) {
    const all = players.filter(p => p.lg === lg), active = all.filter(p => p.xp > 0).sort((a, b) => b.xp - a.xp);
    const n = active.length, top = Math.max(1, Math.ceil(n * LG_UP));
    for (const p of all) {
      const rank = p.xp > 0 ? active.indexOf(p) + 1 : 0;
      const up = p.xp >= LG_MIN && lg < 7 && rank > 0 && rank <= top;
      const to = up ? lg + 1 : p.xp < LG_DOWN && lg > 1 ? lg - 1 : lg;
      out[p.id] = { w, from: lg, to, rank, n, xp: p.xp };
    }
  }
  return out;
}
const toFs = o => ({ fields: Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === "number" ? { integerValue: String(v) } : { stringValue: String(v) }])) });

async function run(now = new Date()) {
  const sa = JSON.parse(process.env.SA || "null");
  if (!sa) { console.log("SA yoʻq — liga hisoblanmadi"); return; }
  const w = process.env.WEEK || lastWeek(now);
  const tok = await accessToken(sa), auth = { Authorization: "Bearer " + tok, "Content-Type": "application/json" };
  const root = `projects/${PROJECT}/databases/(default)/documents`, base = `https://firestore.googleapis.com/v1/${root}`;
  const query = async field => {
    const r = await fetch(`${base}:runQuery`, { method: "POST", headers: auth, body: JSON.stringify({ structuredQuery: { from: [{ collectionId: "league" }], where: { fieldFilter: { field: { fieldPath: field }, op: "EQUAL", value: { stringValue: w } } } } }) });
    const j = await r.json();
    if (!Array.isArray(j)) throw new Error("runQuery: " + JSON.stringify(j).slice(0, 300));
    return j.filter(x => x.document).map(x => Object.assign({ id: x.document.name.split("/").pop() }, fromFs(x.document.fields)));
  };
  const rows = Object.values(Object.fromEntries([...await query("week"), ...await query("pw")].map(r => [r.id, r])));
  const res = settle(rows, w), ids = Object.keys(res);
  const moved = ids.filter(id => res[id].to !== res[id].from).length;
  if (process.env.DRY) { console.log(`DRY ${w}: ${ids.length} ta, ${moved} ta liga oʻzgaradi`); return res; }
  const at = new Date().toISOString();
  for (let i = 0; i < ids.length; i += 400) {
    const writes = ids.slice(i, i + 400).map(id => ({ update: Object.assign({ name: `${root}/lgres/${id}` }, toFs(Object.assign({}, res[id], { at }))) }));
    const r = await fetch(`${base}:commit`, { method: "POST", headers: auth, body: JSON.stringify({ writes }) });
    if (!r.ok) throw new Error("commit: " + (await r.text()).slice(0, 300));
  }
  console.log(`${w}: ${ids.length} ta oʻquvchi, ${moved} ta liga oʻzgardi`);
  return res;
}
module.exports = { settle, lastWeek, LG_UP, LG_MIN, LG_SOLO, LG_DOWN };
if (require.main === module) run().catch(e => { console.error(e.message); process.exit(1); });
