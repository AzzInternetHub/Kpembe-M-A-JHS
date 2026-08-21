const CACHE_NAME = "kpembe-jhs-v1";
const urlsToCache = ["./", "./index.html", "./style.css", "./App.js", "./manifest.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
