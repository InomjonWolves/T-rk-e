/* Türkçe Yoʻl — progressni xavfsiz birlashtirish. Ikki qurilmada (yoki mehmon rejimida va hisobda) toʻplangan natija
   bir-birini oʻchirmaydi: Sync.merge(base, local, cloud) uch tomonlama birlashtiradi.
   base — bu qurilma va server oxirgi marta kelishgan holat (umumiy ajdod); local — qurilmadagi; cloud — serverdagi.
   base yoʻq boʻlsa (eski qurilma, birinchi kirish) sanoqlar qoʻshilmaydi — kattasi olinadi, lugʻat va boʻlimlar birlashadi.
   Qoidalar: sanoq (XP, mashqlar, toʻgʻri javoblar) — serverdagi + shu qurilmada qoʻshilgani; soʻz (SRS) — oxirgi
   takrorlangani; yutuq — birlashma, ertaroq sana; seriya — oxirgi mashq kuni kechroq boʻlgan tomon; sozlama — oxirgi saqlangani. */
var Sync = (function () {
  "use strict";
  const isObj = v => v !== null && typeof v === "object" && !Array.isArray(v);
  function same(a, b) {
    if (a === b) return true;
    if (typeof a !== typeof b || a === null || b === null || typeof a !== "object") return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (Array.isArray(a)) { if (a.length !== b.length) return false; for (let i = 0; i < a.length; i++) if (!same(a[i], b[i])) return false; return true; }
    const ka = Object.keys(a), kb = Object.keys(b); if (ka.length !== kb.length) return false;
    for (const k of ka) if (!(k in b) || !same(a[k], b[k])) return false;
    return true;
  }
  const copy = v => v === undefined ? v : JSON.parse(JSON.stringify(v));
  const num = v => typeof v === "number" && isFinite(v) ? v : 0;

  // Counters at the top level; settings where the copy saved last wins as a whole; lists merged as sets
  const COUNT = new Set(["xp", "sessions", "perfect", "trUses", "shared", "night", "early", "roles", "dqn", "wcn", "frB"]);
  const LATEST = new Set(["goal", "pub", "anon", "tts", "rem", "hap", "sfx", "kView", "place", "statsAt", "guideLast", "frIn"]);
  const LIST = new Set(["fr", "grp", "frzD"]);
  // Fields merged together by their own rule (not key by key)
  const GROUPS = new Set(["day", "dayXp", "week", "wxp", "newDay", "xpr", "dq", "wc", "goalD", "goalN", "streak", "lastDay", "frz", "frzNew", "best", "lg", "lgw", "plg", "pw", "pwxp", "lgr", "savedAt", "first"]);
  // Whole trees of counters: answers and time per skill, per day, per old lesson; slips by rule
  const TREE = new Set(["acc", "pron", "sk", "ust", "days", "mor", "gramw"]);
  function kindOf(p) {
    const a = p[0], n = p.length;
    if (TREE.has(a)) return "count";
    if (n === 1) return COUNT.has(a) ? "count" : LATEST.has(a) ? "latest" : LIST.has(a) ? "list" : "";
    if (a === "achv" && n === 2) return "min";
    if (a === "srs" && n === 2) return "srs";
    return "";
  }
  // The same word reviewed on both devices: the later review stands (t — minutes; older records: due day minus interval)
  function srsPick(l, c) {
    const when = r => r && r.t ? r.t : -1, last = r => num(r && r.d) - num(r && r.i);
    if (when(l) !== when(c)) return when(l) > when(c) ? l : c;
    if (last(l) !== last(c)) return last(l) > last(c) ? l : c;
    return num(l && l.r) >= num(c && c.r) ? l : c;
  }
  // A list as a set: everything either side has, minus what either side removed since the base
  function listMerge(b, l, c) {
    const key = x => typeof x === "object" ? JSON.stringify(x) : String(x), bs = new Set((b || []).map(key)), ls = new Set((l || []).map(key)), cs = new Set((c || []).map(key));
    const out = [], seen = new Set();
    for (const x of (c || []).concat(l || [])) { const k = key(x); if (seen.has(k)) continue; seen.add(k); if (bs.has(k) && (!ls.has(k) || !cs.has(k))) continue; out.push(x); }
    return out;
  }
  function m3(b, l, c, p, x) {
    const kind = kindOf(p);
    // Counters are never "the same on both sides": two devices that each earned 30 XP since the base earned 60
    if (kind !== "count" && same(l, c)) return copy(l);
    if (kind === "count") {
      if (isObj(l) || isObj(c) || Array.isArray(l) || Array.isArray(c)) return walk(b, l, c, p, x);
      if ((l !== undefined && typeof l !== "number") || (c !== undefined && typeof c !== "number")) return copy(l === undefined ? c : c === undefined || x.lNew ? l : c);
      return x.nobase ? Math.max(num(l), num(c)) : Math.max(0, Math.round((num(c) + num(l) - num(b)) * 100) / 100);
    }
    if (l === undefined) return b !== undefined && !x.nobase && same(b, c) ? undefined : copy(c);   // removed here, untouched there
    if (c === undefined) return b !== undefined && !x.nobase && same(b, l) ? undefined : copy(l);
    if (!x.nobase && same(l, b)) return copy(c);
    if (!x.nobase && same(c, b)) return copy(l);
    if (kind === "srs") return copy(srsPick(l, c));
    if (kind === "min") return l < c ? l : c;
    if (kind === "latest") return copy(x.lNew ? l : c);
    if (kind === "list") return listMerge(x.nobase ? [] : b, l, c);
    if (isObj(l) && isObj(c)) return walk(b, l, c, p, x);
    if (Array.isArray(l) && Array.isArray(c)) {
      // Results by question (numbers, true/false): the better of the two, question by question
      const flat = v => v == null || typeof v === "number" || typeof v === "boolean";
      if (l.every(flat) && c.every(flat)) { const out = []; for (let i = 0; i < Math.max(l.length, c.length); i++) out.push(l[i] == null ? c[i] : c[i] == null ? l[i] : typeof l[i] === "number" && typeof c[i] === "number" ? Math.max(l[i], c[i]) : l[i] || c[i]); return out; }
      return copy(x.lNew ? l : c);
    }
    if (typeof l === "number" && typeof c === "number") return Math.max(l, c);
    return copy(x.lNew ? l : c);
  }
  function walk(b, l, c, p, x) {
    const arr = Array.isArray(l) || Array.isArray(c), out = arr ? [] : {};
    const keys = arr ? Array.from({ length: Math.max((l || []).length, (c || []).length) }, (_, i) => i) : [...new Set(Object.keys(c || {}).concat(Object.keys(l || {})))];
    for (const k of keys) {
      if (p.length === 0 && GROUPS.has(k)) continue;
      const v = m3(b == null ? undefined : b[k], l == null ? undefined : l[k], c == null ? undefined : c[k], p.concat(k), x);
      if (v !== undefined) out[k] = v; else if (arr) out[k] = 0;
    }
    return out;
  }
  const later = (a, b) => a === b ? 0 : a == null ? -1 : b == null ? 1 : a > b ? 1 : -1;
  // Counters that belong to a period (a day, a week): the same period — add up; different — the later period stands
  function scoped(out, B, L, C, x, id, fields) {
    const d = later(id(L), id(C));
    if (d !== 0) { const src = d > 0 ? L : C; fields.forEach(f => { if (src[f] !== undefined) out[f] = copy(src[f]); }); return; }
    const base = B && later(id(B), id(L)) === 0 ? B : {};
    fields.forEach(f => { const v = m3(base[f], L[f], C[f], ["#" + f], x); if (v !== undefined) out[f] = v; });
  }
  function merge(base, local, cloud) {
    const B = base || null, L = local || {}, C = cloud || {};
    if (same(L, C)) return copy(L);
    // Settings changed on both sides: the copy saved last; a tie (or a device that never saved, a fresh install) — the server
    const x = { nobase: !B, lNew: num(L.savedAt) > num(C.savedAt) };
    const out = walk(B, L, C, [], x);
    const cnt = (b, l, c) => x.nobase ? Math.max(num(l), num(c)) : Math.max(0, num(c) + num(l) - num(b));
    // Today's and this week's XP
    { const d = later(L.day, C.day), src = d > 0 ? L : C; out.day = src.day; out.dayXp = d === 0 ? cnt(B && B.day === L.day ? B.dayXp : 0, L.dayXp, C.dayXp) : num(src.dayXp); }
    { const d = later(L.week, C.week), src = d > 0 ? L : C; out.week = src.week; out.wxp = d === 0 ? cnt(B && B.week === L.week ? B.wxp : 0, L.wxp, C.wxp) : num(src.wxp); }
    // New words taken today, repeated-practice counts, daily quests, weekly challenge, today's goal
    const per = (f, idf, sum) => {
      const l = L[f], c = C[f]; if (!l || !c) { const v = l || c; if (v !== undefined) out[f] = copy(v); return; }
      const d = later(l[idf], c[idf]); if (d !== 0) { out[f] = copy(d > 0 ? l : c); return; }
      const b = B && B[f] && B[f][idf] === l[idf] ? B[f] : null, o = copy(x.lNew ? c : l); Object.assign(o, copy(x.lNew ? l : c));
      const deep = (bb, ll, cc, path) => { const r = Array.isArray(ll) || Array.isArray(cc) ? listMerge([], ll, cc) : {}; if (Array.isArray(r)) return r; for (const k of new Set(Object.keys(cc || {}).concat(Object.keys(ll || {})))) { const lv = (ll || {})[k], cv = (cc || {})[k], bv = (bb || {})[k]; r[k] = isObj(lv) || isObj(cv) || Array.isArray(lv) || Array.isArray(cv) ? deep(bv, lv, cv, path.concat(k)) : typeof lv === "number" || typeof cv === "number" ? (sum.includes(path.concat(k)[0]) ? (x.nobase || !b ? Math.max(num(lv), num(cv)) : Math.max(0, num(cv) + num(lv) - num(bv))) : Math.max(num(lv), num(cv))) : lv === undefined ? cv : cv === undefined ? lv : x.lNew ? lv : cv; } return r; };
      out[f] = Object.assign(o, deep(b, l, c, []));
    };
    per("newDay", "d", ["n"]); per("xpr", "d", ["a", "k"]); per("dq", "d", []); per("wc", "w", ["n", "sk"]);
    { const d = later(L.goalD, C.goalD), src = d >= 0 ? L : C; if (src.goalD !== undefined) { out.goalD = src.goalD; out.goalN = d === 0 ? Math.max(num(L.goalN), num(C.goalN)) : src.goalN; } }
    // The streak: the side that practised last, joined with the other side's run when the two runs meet
    // (account: 10 days up to yesterday + a guest run started today = 11)
    { const d = later(L.lastDay, C.lastDay), src = d > 0 ? L : C, oth = d > 0 ? C : L;
      out.lastDay = src.lastDay == null ? null : src.lastDay;
      let st = d === 0 ? Math.max(num(L.streak), num(C.streak)) : num(src.streak);
      if (d !== 0 && src.lastDay && oth.lastDay && num(oth.streak) > 0) {
        const day = k => Math.round(Date.parse(k) / 864e5), end = day(src.lastDay), start = end - st + 1, oEnd = day(oth.lastDay), oStart = oEnd - num(oth.streak) + 1;
        if (oEnd >= start - 1) st = Math.max(st, end - Math.min(start, oStart) + 1);
      }
      out.streak = st; out.best = Math.max(num(L.best), num(C.best), st);
      // Freezes: given on one device, spent on the other — both count (0…2). A missed day both devices froze
      // on their own (each fills the same gap when it opens) is paid once: the frozen days tell
      if (L.frz !== undefined || C.frz !== undefined) {
        let f = x.nobase ? Math.max(num(L.frz), num(C.frz)) : num(C.frz) + num(L.frz) - num(B.frz);
        if (!x.nobase) { const bd = new Set(B.frzD || []), nl = (L.frzD || []).filter(k => !bd.has(k)), nc = (C.frzD || []).filter(k => !bd.has(k)); f += nl.length + nc.length - new Set(nl.concat(nc)).size; }
        out.frz = Math.min(2, Math.max(0, f));
      }
      if (src.frzNew !== undefined) out.frzNew = src.frzNew; }
    // The league: the side whose league was settled for the later week
    // (a tie goes to the server's copy: the league row on the server was written from it)
    { const d = later(L.lgw, C.lgw) || later(L.pw, C.pw) || -1, src = d > 0 ? L : C; ["lg", "lgw", "plg", "pw", "pwxp", "lgr"].forEach(f => { if (src[f] !== undefined) out[f] = copy(src[f]); }); }
    { const f = [L.first, C.first].filter(Boolean).sort()[0]; if (f) out.first = f; }
    out.savedAt = Math.max(num(L.savedAt), num(C.savedAt));
    return out;
  }
  // Achievements both sides earned since the base: their bonus was counted twice
  const twice = (base, local, cloud) => base ? Object.keys((local && local.achv) || {}).filter(k => (cloud && cloud.achv || {})[k] && !(base.achv || {})[k]) : [];
  // A bonus paid on both devices for the same day or week (all daily quests, the weekly challenge)
  const paidTwice = (base, local, cloud, f, id) => !!(base && local && cloud && local[f] && cloud[f] && local[f][id] === cloud[f][id] && local[f].paid && cloud[f].paid && !(base[f] && base[f][id] === local[f][id] && base[f].paid));
  return { merge, same, copy, twice, paidTwice, listMerge };
})();
if (typeof module !== "undefined") module.exports = Sync;
