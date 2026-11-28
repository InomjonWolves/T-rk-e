/* Türkçe Yoʻl — Accounts, sync, guest mode, Telegram, boot, e-mail verification.
   One of the app's scripts (js/, loaded in order by index.html); they share one global scope. */

/* ---------- Accounts (Firebase) ---------- */
let FB = !!(window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey);
// EARLY: uid of the last signed-in user while the app runs on their local copy, before Firebase confirms the sign-in
let EARLY = null;
const FB_SDK = ["app", "auth", "firestore"].map(n => `${FB_BASE}firebase-${n}-compat.js`);
// The SDK is not render-blocking: scripts download in parallel and run in order (async = false)
// Once the first screen is fully drawn (page loaded, backgrounds and fonts painted) — then the files the first
// screen does not need start downloading (ms: a short pause after the load event)
function afterPaint(f, ms = 300) {
  const go = () => setTimeout(f, ms);
  if (document.readyState === "complete") go(); else addEventListener("load", go, { once: true });
}
function loadFirebase() {
  if (window.firebase && window.firebase.firestore) return Promise.resolve();
  return Promise.all(FB_SDK.map(src => new Promise((ok, fail) => {
    const s = document.createElement("script");
    s.src = src; s.async = false; s.onload = ok; s.onerror = fail;
    document.head.appendChild(s);
  })));
}
const LAST_KEY = "ty-last-user";
function lastUser() { try { const v = JSON.parse(localStorage.getItem(LAST_KEY) || "null"); return v && v.uid ? v : null; } catch (e) { return null; } }
function setLastUser(v) { try { if (v) localStorage.setItem(LAST_KEY, JSON.stringify(v)); else localStorage.removeItem(LAST_KEY); } catch (e) {} }
let auth = null, db = null, USER = null, USERNAME = "", PENDING_NAME = "", cloudTimer;
function cloudSave(now) {
  if (!USER || !db) return;
  clearTimeout(cloudTimer);
  cloudTimer = setTimeout(() => {
    cloudTimer = null;
    if (!USER || !db) return;
    const ts = firebase.firestore.FieldValue.serverTimestamp();
    cloudPush();
    if (S.pub) {
      const name = ((USERNAME || "").trim().split(/\s+/)[0] || "Oʻquvchi").slice(0, 20);
      const row = lgDoc(name, ts), ref = db.collection("league").doc(USER.uid);
      // Until the new Firestore rules are published, the old five-field row still keeps the tables alive
      // …and until they know the hero field, the row goes without it (the avatar is then Pamuk for others)
      if (LG_NOHR) delete row.hr;
      if (LG_OLD) ref.set(lgLegacy(row)).catch(() => {});
      else ref.set(row).catch(e => {
        if (!e || e.code !== "permission-denied") return;
        if (row.hr) { LG_NOHR = true; delete row.hr; ref.set(row).catch(e2 => { if (e2 && e2.code === "permission-denied") { LG_OLD = true; ref.set(lgLegacy(row)).catch(() => {}); } }); }
        else { LG_OLD = true; ref.set(lgLegacy(row)).catch(() => {}); }
      });
    }
    statsPush();
    errFlush();
    grpSync();
  }, now ? 0 : 1500);
}
// The public leaderboard row: today, this week (inside a league), all time; last week for settling leagues
let LG_OLD = false, LG_NOHR = false;
const lgLegacy = r => ({ name: r.name, week: r.week, wxp: r.wxp, xp: r.xp, streak: r.streak });
function lgDoc(name, ts) {
  const i = v => Math.max(0, Math.round(v || 0)), xp = i(S.xp);
  return { name, week: S.week, wxp: Math.min(i(S.wxp), xp, 25000), xp, streak: streakNow(), day: S.day, dxp: Math.min(i(S.dayXp), 3500),
    lg: lgOf(S.lg).n, lgw: S.lgw || "", pw: S.pw || "", pwxp: i(S.pwxp), plg: lgOf(S.plg).n, at: ts, ...(myHero() !== "pamuk" ? { hr: myHero() } : {}) };
}
// Write a pending save at once (before signing out)
function cloudFlush() {
  if (!USER || !db) return Promise.resolve();
  if (!cloudTimer) return PUSHING || Promise.resolve();
  clearTimeout(cloudTimer); cloudTimer = null;
  return cloudPush();
}
/* ---------- Sync: this device's progress and the server's are merged, never overwritten (sync.js) ----------
   BASE — the state this device and the server last agreed on (kept in localStorage next to the progress). */
let BASE = null, PUSHING = null, PUSH_AGAIN = false, SYNC_AT = 0, SYNC_LOCK = false;
const baseKey = () => KEYU + ":base";
function baseLoad() { try { const r = localStorage.getItem(baseKey()); BASE = r ? JSON.parse(r) : null; } catch (e) { BASE = null; } }
function baseSave(st) { BASE = Sync.copy(st); try { localStorage.setItem(baseKey(), JSON.stringify(BASE)); localStorage.removeItem(baseKey() + ":p"); } catch (e) {} }
// Before a write: what it will store and its id. If the answer is lost but the write landed, the next sync finds the id
// on the server and takes that state as the base — so nothing is counted twice
function pendSave(id, st) { try { localStorage.setItem(baseKey() + ":p", JSON.stringify({ id, st })); } catch (e) {} }
function pendCheck(sid) { try { const p = JSON.parse(localStorage.getItem(baseKey() + ":p") || "null"); if (p && sid && p.id === sid) baseSave(p.st); } catch (e) {} }
function mergeStates(base, local, cloud) {
  const m = Sync.merge(base, local, cloud);
  // A bonus earned on both devices since they last agreed was paid twice: an achievement, all daily quests, the weekly challenge
  let extra = 0;
  Sync.twice(base, local, cloud).forEach(id => { const a = ACH.find(x => x.id === id); if (a) extra += ACH_TIERS[achTier(a)].xp; });
  if (Sync.paidTwice(base, local, cloud, "dq", "d")) extra += XP_VAL.daily;
  if (Sync.paidTwice(base, local, cloud, "wc", "w")) extra += XP_VAL.weekly;
  if (extra) { m.xp = Math.max(0, m.xp - extra); m.wxp = Math.max(0, Math.min(m.wxp - extra, m.xp)); }
  return m;
}
// Read the server's copy, merge this device's state into it and write the result back — in one transaction where the SDK
// has it. mine() is asked after the server answered; extra(doc) adds profile fields. → { merged, got, brought }
function cloudWrite(ref, mine, extra) {
  const ts = firebase.firestore.FieldValue.serverTimestamp();
  let merged, got = null, brought = false, local;
  const body = (get, upd, set) => get().then(snap => {
    got = snap.exists ? snap.data() : null; local = mine();
    if (got) pendCheck(got.sid);
    // The server's copy is brought to today and this week first, as this device's copy is (last week's XP → pw)
    const cloud = got && got.progress ? migrate(Object.assign(blank(), Sync.copy(got.progress))) : null;
    merged = cloud ? mergeStates(BASE, local, cloud) : local;
    brought = !!cloud && !Sync.same(merged, local);
    if (cloud && !extra && Sync.same(merged, cloud)) return;   // this device has nothing new for the server
    const sid = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    pendSave(sid, merged);
    const data = Object.assign({ progress: merged, sid, updatedAt: ts }, extra ? extra(got) : null);
    return snap.exists ? upd(data) : set(data);
  });
  const run = db.runTransaction ? db.runTransaction(tx => body(() => tx.get(ref), d => { tx.update(ref, d); }, d => { tx.set(ref, d); }))
    : body(() => ref.get(), d => ref.update(d), d => ref.set(d));
  return run.then(() => ({ merged, got, brought, local }));
}
function cloudPush() {
  if (!USER || !db) return Promise.resolve();
  // One sync at a time: two at once would both add this device's new results onto the server's copy
  if (PUSHING || SYNC_LOCK) { PUSH_AGAIN = true; return PUSHING || Promise.resolve(); }
  const uid = USER.uid;
  PUSHING = cloudWrite(db.collection("users").doc(uid), () => Sync.copy(S)).then(({ merged, brought, local }) => {
    if (!USER || USER.uid !== uid) return;
    baseSave(merged); SYNC_AT = Date.now();
    if (!brought) return;
    // The other device's progress arrived. What was done here while the request was on its way goes on top of it
    S = migrate(Object.assign(blank(), Sync.same(S, local) ? merged : mergeStates(local, Sync.copy(S), merged)));
    try { localStorage.setItem(KEYU, JSON.stringify(S)); } catch (e) {}
    syncShown();
  }, () => {}).then(() => { PUSHING = null; if (PUSH_AGAIN) { PUSH_AGAIN = false; cloudSave(); } });
  return PUSHING;
}
// Show what arrived — but never under the learner's hands (an exercise, an open sheet, a field being typed in)
function syncShown() {
  const a = document.activeElement;
  if ((SES && !SES.done) || !$("sheet").hidden || !$("celebrate").hidden || (a && /INPUT|TEXTAREA/.test(a.tagName))) return;
  const y = window.scrollY; route(); window.scrollTo(0, y);
}
document.addEventListener("visibilitychange", () => { if (!document.hidden && USER && db && Date.now() - SYNC_AT > 60000) cloudPush(); });
// Back online: what was done offline goes to the server (and the other device's progress comes here)
window.addEventListener("online", () => { if (USER && db) cloudPush(); });
const authEl = $("auth");
let authMode = "login";
// Shown on the sign-in form when a redirect sign-in came back empty (kept when the form is redrawn)
let REDIR_MSG = "";
const AUTH_ERR = {
  "auth/invalid-email": "Elektron pochta manzili notoʻgʻri yozilgan.",
  "auth/missing-email": "Elektron pochtani kiriting.",
  "auth/missing-password": "Parolni kiriting.",
  "auth/weak-password": "Parol kamida 6 ta belgidan iborat boʻlsin.",
  "auth/email-already-in-use": "Bu pochta bilan allaqachon roʻyxatdan oʻtilgan. “Kirish” ni tanlang.",
  "auth/invalid-credential": "Pochta yoki parol notoʻgʻri.",
  "auth/invalid-login-credentials": "Pochta yoki parol notoʻgʻri.",
  "auth/wrong-password": "Pochta yoki parol notoʻgʻri.",
  "auth/user-not-found": "Bu pochta bilan hisob topilmadi. Avval roʻyxatdan oʻting.",
  "auth/too-many-requests": "Juda koʻp urinish boʻldi. Birozdan keyin qayta urinib koʻring.",
  "auth/network-request-failed": "Internetga ulanib boʻlmadi. Aloqani tekshiring.",
  "auth/unauthorized-domain": "Bu sayt manzili Firebase sozlamalarida ruxsat etilmagan.",
  "auth/operation-not-allowed": "Bu kirish usuli Firebase’da hali yoqilmagan.",
  "auth/account-exists-with-different-credential": "Bu pochta boshqa usul bilan roʻyxatdan oʻtgan. Oʻsha usul bilan kiring.",
  "auth/popup-blocked": "Brauzer kirish oynasini toʻsib qoʻydi. Qalqib chiquvchi oynalarga (popup) ruxsat bering.",
  "auth/web-storage-unsupported": "Brauzerda saytlar maʼlumot saqlashi oʻchirilgan (cookie). Uni yoqing yoki boshqa brauzerda oching.",
  "auth/internal-error": "Kirishda ichki xatolik. Sahifani yangilab, qayta urinib koʻring.",
  "auth/redirect-cancelled-by-user": "Kirish bekor qilindi."
};
const authMsg = e => AUTH_ERR[e && e.code] || ("Xatolik yuz berdi" + (e && e.code ? ` (${e.code})` : "") + ". Qayta urinib koʻring.");
/* ---------- Guest mode: the app opens without an account; progress stays on the device until the visitor signs in ---------- */
const GUEST_KEY = "ty-guest";
function isGuest() { try { return localStorage.getItem(GUEST_KEY) === "1"; } catch (e) { return false; } }
function guestEnd() { try { localStorage.removeItem(GUEST_KEY); localStorage.removeItem(KEY); localStorage.removeItem("ty-guest-asked"); } catch (e) {} }
function startGuest() {
  try { localStorage.setItem(GUEST_KEY, "1"); } catch (e) {}
  hideVerify(); hideAuth();
  if (!USER) { KEYU = KEY; S = loadLocal(KEY); }
  lgSettle(); route(); showWelcome();
}
// Sign-in buttons work as soon as they are visible: they wait for the SDK if it is still loading
let FB_READY = null;
async function authReady() {
  if (auth) return true;
  authError("Ulanmoqda…", true);
  try { await FB_READY; } catch (e) {}
  if (auth) { authError(""); return true; }
  authError("Internetga ulanib boʻlmadi. “Hoziroq boshlash” ni bosib, hisobsiz davom etishingiz mumkin.");
  return false;
}
// A gentle, one-time offer to keep the result after the first finished exercise
function guestNudge() {
  if (!isGuest() || USER || !(S.xp > 0) || SES || !$("sheet").hidden) return;
  try { if (localStorage.getItem("ty-guest-asked")) return; localStorage.setItem("ty-guest-asked", "1"); } catch (e) { return; }
  openSheet(`<div class="guest-sheet">${mascot("happy")}<h2>Zoʻr boshladingiz!</h2>
    <p>Hozircha natijangiz faqat shu qurilmada turibdi. Hisob ochsangiz, u saqlanib qoladi: telefon almashsa ham yoʻqolmaydi, reyting va doʻstlar ochiladi.</p>
    <button class="btn btn-grad btn-block" data-act="guest-signup">Natijamni saqlash</button>
    <button class="btn btn-ghost btn-block" data-act="close-sheet">Keyinroq</button></div>`);
}
function guestCard() {
  if (USER || EARLY || !window.FIREBASE_CONFIG || !window.FIREBASE_CONFIG.apiKey || !isGuest()) return "";
  const u = auth && auth.currentUser, wait = u && needsVerify(u);
  if (!wait && !(S.xp > 0)) return ""; // nothing to save yet: let the visitor look around first
  return `<section class="section guest-card"><div class="glass pad"><b>${wait ? "Pochtangizni tasdiqlang" : "Natijangizni saqlab qoʻying"}</b>
    <p class="muted">${wait ? `${esc(u.email || "")} manziliga xat yubordik. Tasdiqlasangiz, natijangiz hisobingizga saqlanadi.` : "Hozir natijalar faqat shu qurilmada. Hisob oching — yoʻqolmaydi, reyting va doʻstlar ochiladi."}</p>
    <button class="btn btn-grad btn-block" data-act="guest-signup">${wait ? "Tasdiqlash" : "Hisob ochish (bepul)"}</button></div></section>`;
}
function authError(e, ok) {
  const el = $("auth-err");
  if (e && (e.code === "auth/popup-closed-by-user" || e.code === "auth/cancelled-popup-request")) { el.textContent = ""; return; }
  el.className = "auth-err" + (ok ? " ok" : "");
  el.textContent = typeof e === "string" ? e : authMsg(e);
}
function setAuthTab(t) {
  authMode = t;
  const up = t === "signup";
  $("tab-login").setAttribute("aria-selected", String(!up));
  $("tab-signup").setAttribute("aria-selected", String(up));
  $("f-name").hidden = !up; $("auth-reset").hidden = up;
  $("auth-speech").textContent = up ? "Tanishaylik! Men Pamuk." : "Salom! Men Pamuk.";
  $("a-pass").setAttribute("autocomplete", up ? "new-password" : "current-password");
  $("auth-submit").textContent = up ? "Roʻyxatdan oʻtish" : "Kirish";
  $("auth-submit").disabled = false;
  $("auth-err").className = "auth-err"; $("auth-err").textContent = REDIR_MSG || "";
}
function showAuth(loading) {
  document.body.classList.add("locked");
  authEl.hidden = false;
  if (!$("auth-mascot").innerHTML) { $("auth-mascot").innerHTML = mascot("wave"); CatLife.scan(); }
  $("auth-loading").hidden = !loading;
  $("auth-body").hidden = !!loading;
  $("auth-body").style.display = loading ? "none" : "flex";
  const back = isGuest();
  // Inside Telegram the one-tap Telegram sign-in leads; the no-account start becomes the quieter option
  const tg = !!tgAuthUrl();
  $("auth-tg").hidden = !tg;
  $("auth-guest").classList.toggle("btn-grad", !tg); $("auth-guest").classList.toggle("btn-soft", tg);
  $("auth-guest").textContent = back ? "Mehmon sifatida davom etish" : "Hoziroq boshlash";
  $("auth-guest-note").textContent = back ? "Hisob ochsangiz, shu qurilmadagi natijangiz hisobingizga oʻtadi." : "Roʻyxatdan oʻtish shart emas. Natijangizni keyin bir bosishda saqlab olasiz.";
}
function hideAuth() { authEl.hidden = true; document.body.classList.remove("locked"); }
function busy(on) { const b = $("auth-submit"); b.disabled = on; if (on) b.textContent = "Kuting…"; else setAuthTab(authMode); }

document.addEventListener("submit", e => {
  const f = e.target.closest("[data-form]");
  if (!f) return;
  e.preventDefault();
  if (f.dataset.form === "grp-join") grpJoin($("grp-code").value);
  else if (f.dataset.form === "grp-create") grpCreate($("grp-name").value);
});
$("auth-form").addEventListener("submit", async e => {
  e.preventDefault();
  const email = $("a-email").value.trim(), pass = $("a-pass").value;
  if (!email || !pass) { authError("Elektron pochta va parolni yozing."); return; }
  if (!(await authReady())) return;
  if (authMode === "signup") {
    const name = $("a-name").value.trim();
    if (!name) { authError("Ismingizni kiriting."); return; }
    if (pass.length < 6) { authError("Parol kamida 6 belgidan iborat boʻlsin."); return; }
    PENDING_NAME = name;
    busy(true);
    try {
      const cred = await auth.createUserWithEmailAndPassword(email, pass);
      await cred.user.updateProfile({ displayName: name });
      USERNAME = name;
      markVerifySent();
      cred.user.sendEmailVerification().catch(() => {});
    } catch (err) { busy(false); authError(err); }
  } else {
    busy(true);
    try { await auth.signInWithEmailAndPassword(email, pass); }
    catch (err) { busy(false); authError(err); }
  }
});
const authCat = () => $("auth-mascot").querySelector(".cat");
// Answer fields with tiles: the bank opens under the field that takes the focus
document.addEventListener("focusin", e => { const t = e.target; if (t && t.dataset && t.dataset.bk) ibOpen(t); });
document.addEventListener("focusin", e => {
  const c = authCat(); if (!c) return;
  if (e.target.type === "password") c.classList.add("shy");
  else c.classList.remove("shy");
});
document.addEventListener("focusout", e => {
  const c = authCat(); if (!c || e.target.type !== "password") return;
  setTimeout(() => { if (!document.activeElement || document.activeElement.type !== "password") c.classList.remove("shy"); }, 0);
});
document.addEventListener("input", e => {
  if (!["a-email", "a-name"].includes(e.target.id)) return;
  const c = authCat(); if (!c) return;
  const k = Math.min(1, e.target.value.length / 26);
  CatLife.look(c, -6 + 12 * k, 6);
});
/* ---------- Telegram sign-in (inside the bot's Mini App) ----------
   Telegram signs Telegram.WebApp.initData with the bot token; our bot server (bot/api/tgauth.js) checks the signature
   and answers with a Firebase custom token for the uid "tg<telegram id>". No password, no e-mail. */
const tgAuthUrl = () => (IN_TG && window.TG_AUTH_URL) || "";
function tgInitData() {
  try { const d = window.Telegram && Telegram.WebApp && Telegram.WebApp.initData; if (d) return d; } catch (e) {}
  try { return sessionStorage.getItem("ty-tg-init") || ""; } catch (e) { return ""; }
}
async function tgSignIn() {
  const btn = $("auth-tg");
  // telegram-web-app.js may still be loading
  for (let i = 0; i < 20 && !tgInitData(); i++) await new Promise(r => setTimeout(r, 150));
  const data = tgInitData();
  if (!data) {
    // Opened from a link inside Telegram, not from the bot's button: the bot's "Ilovani ochish" gives the signed data
    authError("Telegram orqali kirish uchun botdagi “📱 Ilovani ochish” tugmasidan oching. Bot ochilmoqda…");
    try { if (window.Telegram && Telegram.WebApp && Telegram.WebApp.openTelegramLink) Telegram.WebApp.openTelegramLink(TG_BOT); else location.href = TG_BOT; } catch (e) { location.href = TG_BOT; }
    return;
  }
  if (!(await authReady())) return;
  btn.disabled = true; authError("Telegram orqali kirilmoqda…", true);
  try {
    const r = await fetch(tgAuthUrl(), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ initData: data }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.token) throw new Error(r.status === 503 ? "Telegram orqali kirish hali sozlanmagan. “Hoziroq boshlash” ni bosing." : "Telegram maʼlumotlari tasdiqlanmadi. Ilovani bot orqali qayta oching.");
    PENDING_NAME = j.name || "";
    const cred = await auth.signInWithCustomToken(j.token);
    if (cred && cred.user && !cred.user.displayName && j.name) cred.user.updateProfile({ displayName: j.name }).catch(() => {});
    authError("");
  } catch (e) {
    authError(e && e.message && !e.code ? e.message : "Internet bilan muammo. Qayta urinib koʻring yoki “Hoziroq boshlash” ni bosing.");
  } finally { btn.disabled = false; }
}
// Google refuses sign-in inside app web views (Telegram included): say so and offer the real browser
const TG_AUTH_MSG = "Telegram ichida Google bilan kirib boʻlmaydi (bu Google cheklovi). “Hoziroq boshlash” ni bosing yoki email va parol bilan kiring. Google uchun saytni brauzerda oching: turkceyol.web.app";
async function googleSignIn() {
  if (IN_TG) { authError(""); $("auth-err").className = "auth-err"; $("auth-err").textContent = TG_AUTH_MSG; tgOpenBrowser(); return; }
  if (!(await authReady())) return;
  if (IS_NATIVE) return nativeGoogleSignIn();
  oauthSignIn(new firebase.auth.GoogleAuthProvider());
}
// The app: the phone shows its Google account chooser and returns an ID token; Firebase signs in with it,
// so the rest (onAuthStateChanged, cloud sync, the league) works exactly as on the website
async function nativeGoogleSignIn() {
  const fa = nativePlugin("FirebaseAuthentication");
  if (!fa) { authError("Google bilan kirish ilovaning bu versiyasida yoʻq. Email bilan kiring yoki ilovani yangilang."); return; }
  authError("");
  try {
    const r = await fa.signInWithGoogle();
    const tok = r && r.credential && r.credential.idToken;
    if (!tok) throw new Error("token yoʻq");
    await auth.signInWithCredential(firebase.auth.GoogleAuthProvider.credential(tok));
  } catch (e) {
    if (/cancel|bekor/i.test(String(e && (e.message || e.code) || ""))) return; // the chooser was closed
    authError("Google bilan kirib boʻlmadi. Internetni tekshiring yoki email bilan kiring.");
  }
}
// Leaving the account also forgets the Google account on the phone, so the chooser shows again next time
function nativeSignOut() { const fa = nativePlugin("FirebaseAuthentication"); if (fa) fa.signOut().catch(() => {}); }
// A popup first, also in the installed app: the page-redirect flow loses the sign-in on browsers that block
// cross-site storage (Chrome, Safari) when the sign-in page is on the Firebase auth domain, not the site's own.
// The redirect is only a fallback when the popup cannot open.
function oauthSignIn(provider) {
  REDIR_MSG = "";
  authError("");
  auth.signInWithPopup(provider).catch(err => {
    if (err && (err.code === "auth/popup-blocked" || err.code === "auth/operation-not-supported-in-this-environment")) {
      try { sessionStorage.setItem("ty-redirect", String(Date.now())); } catch (e) {}
      auth.signInWithRedirect(provider).catch(authError);
    } else authError(err);
  });
}
async function resetPassword() {
  const email = $("a-email").value.trim();
  if (!(await authReady())) return;
  if (!email) { authError("Avval elektron pochtangizni yozing, keyin “Parolni unutdingizmi?” ni bosing."); $("a-email").focus(); return; }
  auth.sendPasswordResetEmail(email)
    .then(() => authError(`Parolni tiklash xati ${email} manziliga yuborildi.`, true))
    .catch(authError);
}
async function deleteAccount(btn) {
  btn.disabled = true; btn.textContent = "Oʻchirilmoqda…";
  const u = USER;
  try {
    await db.collection("league").doc(u.uid).delete().catch(() => {});
    await db.collection("avatars").doc(u.uid).delete().catch(() => {});
    await db.collection("stats").doc(u.uid).delete().catch(() => {});
    await db.collection("push").doc(u.uid).delete().catch(() => {});
    await db.collection("invites").doc(u.uid).collection("from").get().then(q => Promise.all(q.docs.map(d => d.ref.delete()))).catch(() => {});
    await grpWipe(u.uid).catch(() => {});
    try { localStorage.removeItem("ty-photo:" + u.uid); } catch (e) {}
    await db.collection("users").doc(u.uid).delete();
    await u.delete();
    try { localStorage.removeItem(KEY + ":" + u.uid); localStorage.removeItem(KEY + ":" + u.uid + ":base"); BASE = null; } catch (e) {}
    toast("Hisobingiz oʻchirildi");
  } catch (e) {
    btn.disabled = false; btn.textContent = "Ha, oʻchirish";
    cloudSave();
    if (e.code === "auth/requires-recent-login") toast("Xavfsizlik uchun hisobdan chiqib, qayta kiring va yana urinib koʻring");
    else toast(authMsg(e));
  }
}
async function loadCloud(u) {
  KEYU = KEY + ":" + u.uid;
  let local = loadLocal(KEYU);
  baseLoad();
  // Coming from guest mode: the progress made without an account is added to the account (below)
  const guest = isGuest() ? loadLocal(KEY) : null;
  USERNAME = u.displayName || PENDING_NAME || "";
  const ref = db.collection("users").doc(u.uid);
  SYNC_LOCK = true;
  try {
    // The server's copy and this device's are merged (sync.js) — neither overwrites the other.
    // The app may have been used while waiting for the server: the local copy is read when the answer comes
    const r = await cloudWrite(ref, () => Sync.copy(loadLocal(KEYU)), d => {
      if (d && d.name) USERNAME = d.name;
      PROFILE = { gender: (d && d.gender) || "", birth: (d && d.birth) || "" };
      const x = { name: USERNAME, email: u.email || "" };
      if (PROFILE.gender) { x.gender = PROFILE.gender; x.birth = PROFILE.birth; }
      if (!d) x.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      return x;
    });
    baseSave(r.merged); SYNC_AT = Date.now();
    // Answers given while the server was answering are kept on top of the merged state
    const cur = loadLocal(KEYU);
    S = migrate(Object.assign(blank(), Sync.same(cur, r.local) ? Sync.copy(r.merged) : mergeStates(r.local, cur, r.merged)));
  } catch (e) {
    S = loadLocal(KEYU);
    toast("Natijalarni serverdan yuklab boʻlmadi. Internetni tekshiring");
  }
  SYNC_LOCK = false;
  // Progress made without an account is added to it (counts add up, words and units join)
  const fromGuest = guest && ((guest.xp || 0) > 0 || Object.keys(guest.srs || {}).length);
  if (fromGuest) S = migrate(Object.assign(blank(), mergeStates(blank(), Sync.copy(guest), Sync.copy(S))));
  try { localStorage.setItem(KEYU, JSON.stringify(S)); } catch (e) {}
  if (guest) guestEnd();
  // The guest's results reach the server before the app opens
  if (fromGuest) await cloudPush();
  try { localStorage.setItem(KEYU, JSON.stringify(S)); } catch (e) {}
  setLastUser({ uid: u.uid, name: USERNAME });
  cloudSave();
  adminCheck(u.uid);
  loadMyPhoto();
  db.collection("avatars").doc(u.uid).get().then(d => {
    const ph = d.exists ? d.data().photo || "" : "";
    if (ph && ph !== MYPHOTO) { MYPHOTO = ph; try { localStorage.setItem(photoKey(), ph); } catch (e) {} route(); }
    else if (!ph && MYPHOTO) setMyPhoto(MYPHOTO);
  }).catch(() => {});
}

/* ---------- Telegram: the bot's Mini App opens the site with #tgWebAppData=… ----------
   Remember that we run inside Telegram (Google sign-in does not work there) and keep the user data out of the address. */
const TG_CHANNEL = "https://t.me/turkceyoluz", TG_BOT = "https://t.me/TurkceYolBot";
const IN_TG = (() => {
  let tg = /tgWebApp/.test(location.hash) || !!window.TelegramWebviewProxy;
  try { if (tg) sessionStorage.setItem("ty-tg", "1"); else tg = sessionStorage.getItem("ty-tg") === "1"; } catch (e) {}
  return tg;
})();
// Telegram puts the signed sign-in data (tgWebAppData) in the address; telegram-web-app.js reads it from there.
// Keep it before the address is cleaned, or Telegram.WebApp.initData would come out empty.
if (/tgWebApp/.test(location.hash)) {
  try { const d = new URLSearchParams(location.hash.slice(1)).get("tgWebAppData"); if (d) sessionStorage.setItem("ty-tg-init", d); } catch (e) {}
  try { history.replaceState(null, "", location.pathname + location.search + "#home"); } catch (e) { location.hash = "#home"; }
}
if (IN_TG) {
  document.documentElement.classList.add("in-tg");
  loadScript("https://telegram.org/js/telegram-web-app.js").then(() => { try { Telegram.WebApp.ready(); Telegram.WebApp.expand(); } catch (e) {} }, () => {});
}
function tgOpenBrowser(url = "https://turkceyol.web.app/") {
  try { if (window.Telegram && Telegram.WebApp && Telegram.WebApp.openLink) { Telegram.WebApp.openLink(url, { try_instant_view: false }); return; } } catch (e) {}
}

/* ---------- Boot ---------- */
// An invite link opened before signing in: remember it, the friend is added right after sign-in
{ const m = /^#do-([A-Za-z0-9]{6,40})$/.exec(location.hash); if (m) frPending(m[1]); }
S = loadLocal(KEY);
loadMyPhoto();
try { PROFILE = Object.assign(PROFILE, JSON.parse(localStorage.getItem("ty-profile") || "{}")); } catch (e) {}
/* ---------- E-mail verification: a password account enters the app only after confirming its address ---------- */
const needsVerify = u => !!u && !u.emailVerified && (u.providerData || []).some(p => p && p.providerId === "password");
const VERIFY_GAP = 60000;
let VERIFY_U = null, verifyTimer = null;
function verifyLeft() { let t = 0; try { t = +localStorage.getItem("ty-verify-at") || 0; } catch (e) {} return Math.max(0, VERIFY_GAP - (Date.now() - t)); }
function markVerifySent() { try { localStorage.setItem("ty-verify-at", String(Date.now())); } catch (e) {} if (VERIFY_U) verifyTick(); }
function verifyTick() {
  clearInterval(verifyTimer);
  const b = $("v-again"), upd = () => {
    const sec = Math.ceil(verifyLeft() / 1000);
    b.disabled = sec > 0; b.textContent = sec > 0 ? `Qayta yuborish (${sec} s)` : "Xatni qayta yuborish";
    if (!sec) clearInterval(verifyTimer);
  };
  upd(); verifyTimer = setInterval(upd, 1000);
}
function showVerify(u) {
  VERIFY_U = u;
  showAuth(false);
  $("auth-body").hidden = true; $("auth-body").style.display = "none";
  $("auth-verify").hidden = false;
  $("v-email").textContent = u.email || "";
  $("v-msg").textContent = ""; $("v-msg").className = "auth-err";
  verifyTick();
}
function hideVerify() { VERIFY_U = null; clearInterval(verifyTimer); $("auth-verify").hidden = true; }
async function verifyCheck(silent) {
  const u = auth && auth.currentUser;
  if (!u) return;
  try { await u.reload(); } catch (e) { if (!silent) $("v-msg").textContent = authMsg(e); return; }
  const cur = auth.currentUser;
  if (cur && cur.emailVerified) {
    // A fresh token carries email_verified for the database rules
    await cur.getIdToken(true).catch(() => {});
    hideVerify();
    enterApp(cur, false);
  } else if (!silent) { $("v-msg").className = "auth-err"; $("v-msg").textContent = "Pochta hali tasdiqlanmagan. Xatdagi havolani bosib, keyin qayta urinib koʻring."; }
}
function verifySend() {
  const u = auth && auth.currentUser;
  if (!u || verifyLeft()) return;
  markVerifySent();
  u.sendEmailVerification()
    .then(() => { $("v-msg").className = "auth-err ok"; $("v-msg").textContent = `Xat ${u.email} manziliga qayta yuborildi.`; })
    .catch(err => { $("v-msg").className = "auth-err"; $("v-msg").textContent = err && err.code === "auth/too-many-requests" ? "Xat yaqinda yuborilgan. Bir necha daqiqadan keyin qayta urinib koʻring va Spam papkasini tekshiring." : authMsg(err); });
}
// Coming back from the mail app: check again without a tap
document.addEventListener("visibilitychange", () => { const u = auth && auth.currentUser; if (!document.hidden && (VERIFY_U || (!USER && u && needsVerify(u)))) verifyCheck(true); });

async function enterApp(u, quiet) {
  EARLY = null;
  hideVerify();
  if (!quiet) showAuth(true);
  USER = u;
  await loadCloud(u);
  lgSettle();
  frInbox();
  gtRefresh();
  if (frPendingGet()) setTimeout(() => frAdd(frPendingGet(), true), 600);
  if (!quiet) hideAuth();
  if (!quiet || !SES) route();
  if (!quiet) { closeSheet(true); showWelcome(); }
}
function fbStart() {
  // On a Firebase Hosting site whose sign-in handler is registered with Google, sign in on the same domain
  const cfg = Object.assign({}, window.FIREBASE_CONFIG);
  if ((window.AUTH_SAME_DOMAIN || []).includes(location.hostname)) cfg.authDomain = location.hostname;
  firebase.initializeApp(cfg);
  auth = firebase.auth(); auth.languageCode = "uz";
  db = firebase.firestore();
  // Back from a redirect sign-in: if the browser lost it, say so instead of silently showing the form again
  let redirAt = 0;
  try { redirAt = +sessionStorage.getItem("ty-redirect") || 0; sessionStorage.removeItem("ty-redirect"); } catch (e) {}
  auth.getRedirectResult().then(r => {
    if (redirAt && Date.now() - redirAt < 600000 && !(r && r.user) && !auth.currentUser) { REDIR_MSG = "Google bilan kirish yakunlanmadi: brauzer uni toʻxtatib qoʻydi. Qalqib chiquvchi oynalarga (popup) ruxsat bering yoki saytni oddiy brauzer oynasida oching."; showAuth(false); setAuthTab(authMode); }
  }).catch(err => { showAuth(false); authError(err); });
  auth.onAuthStateChanged(async u => {
    if (!u) {
      if (isGuest() && !USER && !EARLY) return; // a guest is already using the app on the local copy
      EARLY = null; setLastUser(null);
      USER = null; USERNAME = ""; S = blank(); KEYU = KEY; RANK_CACHE = {}; GRP = {}; GRP_OWN = null; GRP_SYNC_AT = 0; MYPHOTO = ""; PROFILE = { gender: "", birth: "" };
      try { sessionStorage.removeItem("ty-welcomed"); } catch (e) {}
      if (SES) closeSession();
      hideVerify();
      showAuth(false); setAuthTab(authMode);
      return;
    }
    if (needsVerify(u) && isGuest() && !USER && !EARLY) { VERIFY_U = u; route(); return; } // learning goes on while the mail is on its way
    if (needsVerify(u)) {
      // Not confirmed yet: none of the app (and no cloud writes) until the address is verified
      if (EARLY) { EARLY = null; S = blank(); KEYU = KEY; USERNAME = ""; MYPHOTO = ""; if (SES) closeSession(); }
      setLastUser(null);
      USER = null;
      showVerify(u);
      return;
    }
    // Same user as the local copy already on screen: sync quietly in the background
    enterApp(u, EARLY === u.uid);
  });
}
if (FB) {
  const last = lastUser();
  if (last && localStorage.getItem(KEY + ":" + last.uid)) {
    // Returning user: open their local copy at once, Firebase confirms the sign-in later
    EARLY = last.uid; KEYU = KEY + ":" + last.uid; S = loadLocal(KEYU); USERNAME = last.name || "";
    try { PROFILE = Object.assign({ gender: "", birth: "" }, JSON.parse(localStorage.getItem("ty-profile:" + last.uid) || "{}")); } catch (e) {}
    loadMyPhoto();
    route();
    showWelcome();
  } else if (isGuest()) {
    // A guest from an earlier visit: straight into the app
    lgSettle(); route(); showWelcome();
  } else { showAuth(false); setAuthTab(authMode); }
  // The Firebase SDK too waits for the first paint: it must not share the bandwidth with the screen being drawn
  FB_READY = new Promise(r => afterPaint(r, 150)).then(loadFirebase).then(fbStart);
  FB_READY.catch(() => {
    // No SDK (offline and not cached): work locally, as before
    if (EARLY || isGuest()) return;
    FB = false; hideAuth(); lgSettle(); route(); showWelcome();
  });
} else {
  lgSettle();
  route();
  showWelcome();
}
// The rest of the course downloads right after the first screen is drawn
// Right after the first screen has been painted: the grammar files (small), then the course bodies
afterPaint(() => loadGram().catch(() => {}).then(() => loadCourse()).catch(() => {}));
/* The service worker serves the app from its cache at once; a new version installs in the background and waits.
   Then a bar offers «Yangilash» (the new version starts now) — otherwise it starts the next time the app opens. */
let SW_UPDATING = false;
function updBar(w) {
  if (!w || $("upd-bar")) return;
  const b = document.createElement("div");
  b.id = "upd-bar"; b.className = "upd-bar"; b.setAttribute("role", "status");
  b.innerHTML = `<span>${ICON.spark}Yangi versiya tayyor</span><button class="btn btn-grad" data-act="sw-update">Yangilash</button><button class="icon-btn" data-act="sw-later" aria-label="Keyinroq"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>`;
  b._w = w;
  document.body.appendChild(b);
}
function swWatch(reg) {
  const ask = w => { if (w && navigator.serviceWorker.controller) updBar(w); };
  ask(reg.waiting);
  reg.addEventListener("updatefound", () => { const w = reg.installing; if (w) w.addEventListener("statechange", () => { if (w.state === "installed") ask(w); }); });
  // Look for a new version whenever the app comes back to the screen
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") reg.update().catch(() => {}); });
}
if (!IS_NATIVE && "serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("sw.js").then(swWatch).catch(() => {});
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (SW_UPDATING) location.reload(); });
}
