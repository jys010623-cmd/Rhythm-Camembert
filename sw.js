/* 리듬베르 service worker — offline + fast repeat loads
   음악(music/)은 캐시 우선(큰 파일·잘 안 바뀜), 나머지는 네트워크 우선(항상 최신).
   게임을 크게 업데이트하면 아래 CACHE 버전을 올려 강제 갱신하세요. */
const CACHE = 'rc-v5';
const CORE = ['./rhythm-game.html', './manifest.json', './icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {}).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || req.url.indexOf('http') !== 0) return;
  const isAudio = req.url.indexOf('/music/') >= 0;

  if (isAudio) {
    // cache-first
    e.respondWith(
      caches.match(req).then((hit) =>
        hit || fetch(req).then((res) => {
          if (res && res.status === 200) {
            const cp = res.clone();
            caches.open(CACHE).then((c) => c.put(req, cp));
          }
          return res;
        })
      )
    );
  } else {
    // network-first, fall back to cache when offline
    e.respondWith(
      fetch(req).then((res) => {
        if (res && res.status === 200) {
          const cp = res.clone();
          caches.open(CACHE).then((c) => c.put(req, cp));
        }
        return res;
      }).catch(() => caches.match(req))
    );
  }
});
