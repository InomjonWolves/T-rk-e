// Offline support. App files: network first (so a new version shows at once), cache when offline or slow.
// Fonts and the Firebase SDK: cache first.
const CACHE = "turkce-yol-v36";
const ASSETS = ["./", "./index.html", "./firebase-config.js", "./content.js", "./grammar.js", "./grammar-ex.js", "./course-core.js", "./course.js", "./app.js", "./cat.js", "./guide.js", "./styles.css", "./privacy.html", "./manifest.webmanifest", "./icon.svg", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png"];

self.addEventListener("install", e => {
  // cache: "reload" skips the browser's HTTP cache, so the new cache really gets the new files
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(a => new Request(a, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
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
  if (url.origin === location.origin) { e.respondWith(networkFirst(e.request)); return; }
  // Fonts and the Firebase SDK; Firebase API traffic goes straight to the network
  if (!(url.host.startsWith("fonts.") || url.pathname.startsWith("/firebasejs/"))) return;
  e.respondWith(caches.match(e.request).then(hit => {
    const net = fetch(e.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});
