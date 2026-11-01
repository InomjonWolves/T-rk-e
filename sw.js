// Offline support: cache the app shell, serve cache first, refresh in the background.
const CACHE = "turkce-yol-v14";
const ASSETS = ["./", "./index.html", "./firebase-config.js", "./content.js", "./grammar.js", "./grammar-ex.js", "./course.js", "./app.js", "./cat.js", "./guide.js", "./styles.css", "./privacy.html", "./manifest.webmanifest", "./icon.svg", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  // Only the app's own files, fonts and the Firebase SDK; Firebase API traffic goes straight to the network
  const cacheable = url.origin === location.origin || url.host.startsWith("fonts.") || url.pathname.startsWith("/firebasejs/");
  if (!cacheable) return;
  e.respondWith(caches.match(e.request).then(hit => {
    const net = fetch(e.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});
