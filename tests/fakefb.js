// An in-memory stand-in for the Firebase compat SDK (auth + firestore), enough for the app's own calls.
// Sign in/out from a test with window.__fbUser({ uid, displayName, email }) or window.__fbUser(null).
// opts.seed prefills documents. window.__db holds the documents by path ("groups/ABC123/members/u1"); window.__deny(fn) can refuse writes like rules would.
const FAKE_FIREBASE = `
(function () {
  const db = window.__db = Object.assign({}, window.__seed || {}), listeners = [];
  let user, deny = () => false;
  window.__deny = f => { deny = f; };
  window.__fbUser = u => { user = u ? Object.assign({ providerData: [], emailVerified: true, delete: () => Promise.resolve(), reload: () => Promise.resolve(), getIdToken: () => Promise.resolve("t"),
    sendEmailVerification: () => { window.__mails = (window.__mails || 0) + 1; return Promise.resolve(); } }, u) : null; listeners.forEach(f => f(user)); };
  // Confirm the address "in the mail app": the next reload() sees it
  window.__fbVerify = () => { if (user) user.emailVerified = true; };
  const err = code => Promise.reject(Object.assign(new Error(code), { code }));
  const clone = v => v === undefined ? v : JSON.parse(JSON.stringify(v));
  const kids = (path) => Object.keys(db).filter(k => k.startsWith(path + "/") && !k.slice(path.length + 1).includes("/"));
  function snap(path) {
    const id = path.split("/").pop(), d = db[path];
    return { id, exists: d !== undefined, data: () => clone(d), ref: docRef(path) };
  }
  function docRef(path) {
    return {
      id: path.split("/").pop(), path,
      get: () => Promise.resolve(snap(path)),
      set: (data, opt) => { (window.__log = window.__log || []).push("set " + path); if (deny("set", path, data, user)) return err("permission-denied"); db[path] = Object.assign(opt && opt.merge ? (db[path] || {}) : {}, clone(data)); return Promise.resolve(); },
      update: data => { (window.__log = window.__log || []).push("update " + path + (db[path] === undefined ? " MISSING" : "")); if (db[path] === undefined) return err("not-found"); if (deny("update", path, data, user)) return err("permission-denied"); Object.assign(db[path], clone(data)); return Promise.resolve(); },
      delete: () => { (window.__log = window.__log || []).push("delete " + path); if (deny("delete", path, null, user)) return err("permission-denied"); delete db[path]; return Promise.resolve(); },
      collection: name => colRef(path + "/" + name)
    };
  }
  function colRef(path, filters = [], lim = 1e9) {
    const run = () => {
      if (deny("list", path, null, user)) return err("permission-denied");
      let docs = kids(path).filter(k => filters.every(([f, v]) => (db[k] || {})[f] === v)).slice(0, lim).map(snap);
      return Promise.resolve({ docs, size: docs.length, empty: !docs.length, forEach: f => docs.forEach(f) });
    };
    return { doc: id => docRef(path + "/" + id), where: (f, op, v) => colRef(path, filters.concat([[f, v]]), lim), orderBy() { return this; }, limit: n => colRef(path, filters, n), get: run };
  }
  const fs = () => ({ collection: name => colRef(name) });
  fs.FieldValue = { serverTimestamp: () => "TS" };
  const auth = () => ({
    languageCode: "", get currentUser() { return user; },
    getRedirectResult: () => Promise.resolve(null),
    onAuthStateChanged: f => { listeners.push(f); if (user !== undefined) f(user); },
    createUserWithEmailAndPassword: (email) => { window.__fbUser({ uid: "new1", email, providerData: [{ providerId: "password" }], emailVerified: false, updateProfile(p) { Object.assign(this, p); return Promise.resolve(); } }); return Promise.resolve({ user }); },
    signInWithPopup: p => { window.__popups = (window.__popups || []).concat([p.providerId + ":" + (p.scopes || []).join(",")]); return Promise.resolve(); },
    signInWithRedirect: p => { window.__popups = (window.__popups || []).concat(["redirect:" + p.providerId]); return Promise.resolve(); },
    signInWithCustomToken: tok => { window.__tokens = (window.__tokens || []).concat([tok]); window.__fbUser({ uid: "tg" + tok.split("-").pop(), providerData: [], emailVerified: false, updateProfile(p) { Object.assign(this, p); return Promise.resolve(); } }); return Promise.resolve({ user }); },
    signOut: () => { window.__fbUser(null); return Promise.resolve(); }
  });
  auth.GoogleAuthProvider = function () { this.providerId = "google.com"; };
  auth.OAuthProvider = function (id) { this.providerId = id; this.scopes = []; this.addScope = sc => this.scopes.push(sc); this.setCustomParameters = () => {}; };
  window.firebase = { initializeApp: () => {}, auth, firestore: fs };
})();`;

// Opens the app with the fake Firebase; the visitor starts signed out unless opts.user is given
async function openFb(browser, hash = "#home", opts = {}) {
  const { BASE } = require("./helpers");
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.route("**/firebase-config.js", r => r.fulfill({ body: "window.FIREBASE_CONFIG={apiKey:'test',projectId:'test'};window.AUTH_PROVIDERS=" + JSON.stringify(opts.providers || {}), contentType: "text/javascript" }));
  await page.route(/gstatic\.com\/firebasejs\//, r => r.fulfill({ body: r.request().url().includes("-app-") ? FAKE_FIREBASE : "", contentType: "text/javascript" }));
  await page.route(/^https?:\/\/(?!www\.gstatic\.com\/firebasejs\/)/, r => r.abort());
  await page.addInitScript(([user, seed]) => {
    sessionStorage["ty-welcomed"] = "1";
    window.__seed = seed;
    if (!window.__fbWrapped) {
      window.__fbWrapped = 1;
      // Sign the user in as soon as the SDK is there
      Object.defineProperty(window, "firebase", { configurable: true, set(v) { Object.defineProperty(window, "firebase", { value: v, writable: true, configurable: true }); if (user) setTimeout(() => window.__fbUser(user), 0); else setTimeout(() => window.__fbUser(null), 0); } });
    }
  }, [opts.user || null, opts.seed || {}]);
  await page.goto(BASE + hash);
  await page.waitForFunction(() => typeof db !== "undefined" && db);
  if (opts.user) await page.waitForFunction(() => USER && !EARLY);
  await page.waitForTimeout(100);
  return { page, errors };
}

module.exports = { FAKE_FIREBASE, openFb };
