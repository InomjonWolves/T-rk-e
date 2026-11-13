// Offline support. App files: network first (so a new version shows at once), cache when offline or slow.
// The site's own font files and the Firebase SDK: cache first.
const CACHE = "turkce-yol-v70";
const META = "ty-meta";
const ASSETS = ["./", "./index.html", "./firebase-config.js", "./content.js", "./lugat.js", "./grammar.js", "./grammar-ex.js", "./course-core.js", "./course.js", "./app.js", "./cat.js", "./guide.js", "./oqish.js", "./placement.js", "./styles.css", "./fonts/onest-v1.woff2", "./privacy.html", "./manifest.webmanifest", "./icon.svg", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png"];

self.addEventListener("install", e => {
  // cache: "reload" skips the browser's HTTP cache, so the new cache really gets the new files
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(a => new Request(a, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== META).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
function networkFirst(req) {
  const net = fetch(new Request(req.url, { cache: "no-cache", credentials: "same-origin" })).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  });
  const cached = () => caches.match(req).then(hit => hit || (req.mode === "navigate" ? caches.match("./index.html") : undefined));
  // On a very slow connection fall back to the cached copy after 3.5 s; the network copy still updates the cache
  const slow = new Promise(r => setTimeout(r, 3500)).then(cached);
  return Promise.race([net.catch(cached), slow.then(hit => hit || net)]).then(r => r || net);
}
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  // Recorded audio: the browser asks for byte ranges (Safari plays media only from 206 answers) — leave it to the
  // network and the HTTP cache (the files never change: the name is the text's key)
  if (url.origin === location.origin && /\/audio\/[^/]+\/[^/]+\.mp3$/.test(url.pathname)) return;
  // Font files carry a version in their name and never change: cache first, like the Firebase SDK
  const font = url.origin === location.origin && /\/fonts\/[^/]+\.woff2$/.test(url.pathname);
  if (url.origin === location.origin && !font) { e.respondWith(networkFirst(e.request)); return; }
  // Firebase API traffic goes straight to the network
  if (!(font || url.pathname.startsWith("/firebasejs/"))) return;
  e.respondWith(caches.match(e.request).then(hit => {
    const net = fetch(e.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});

/* Daily reminder. The app keeps ty-meta/__remind = { on, h, last, s, sent } up to date.
   push: a message from the server (tools/push.js through FCM); periodicsync: an installed app without a server. */
const localDay = () => { const t = Date.now(); return new Date(t - new Date(t).getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
const remindText = s => s > 0
  ? { title: "Seriyangiz yoʻqolmasin!", body: `${s} kun ketma-ket — bugun ham 5 daqiqa mashq qiling. Pamuk kutyapti!` }
  : { title: "Pamuk sizni kutyapti", body: "Bugun 5 daqiqa turk tili? Bir nechta soʻz — katta qadam." };
function notify(d) {
  return self.registration.showNotification(d.title, { body: d.body, icon: "icon-192.png", badge: "icon-192.png", tag: "ty-remind", renotify: false, data: { url: d.url || "./#home" } });
}
async function remindLocal() {
  const c = await caches.open(META), r = await c.match("./__remind");
  if (!r) return;
  const m = await r.json(), today = localDay();
  if (!m.on || new Date().getHours() < m.h || m.last === today || m.sent === today) return;
  m.sent = today;
  await c.put("./__remind", new Response(JSON.stringify(m)));
  return notify(remindText(m.s));
}
self.addEventListener("periodicsync", e => { if (e.tag === "ty-remind") e.waitUntil(remindLocal()); });
self.addEventListener("push", e => {
  let d = {};
  try { const j = e.data ? e.data.json() : {}; d = j.data || j.notification || j; } catch (err) {}
  // Practised meanwhile (the server copy may be a little old): stay quiet
  e.waitUntil(caches.open(META).then(c => c.match("./__remind")).then(r => r ? r.json() : {}).catch(() => ({})).then(m => {
    if (m.last === localDay()) return;
    const t = remindText(+d.s || m.s || 0);
    return notify({ title: d.title || t.title, body: d.body || t.body, url: d.url });
  }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "./#home", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(ws => {
    const w = ws.find(x => x.url.startsWith(self.registration.scope));
    if (w) { w.navigate && w.navigate(url).catch(() => {}); return w.focus(); }
    return self.clients.openWindow(url);
  }));
});
