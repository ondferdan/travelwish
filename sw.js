const CACHE = 'twl-v2';

const OFFLINE_PAGE = `<!DOCTYPE html>
<html lang="cs"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Travel Wishlist</title>
<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;
background:#F2EDE6;flex-direction:column;gap:12px;color:#6B5E52;margin:0}
h1{font-size:22px;color:#1A2B20}
button{background:#1A2B20;color:white;border:none;border-radius:12px;padding:12px 24px;font-size:15px;cursor:pointer}</style>
</head><body>
<div style="font-size:64px">🗺️</div>
<h1>Travel Wishlist</h1>
<p style="text-align:center;font-size:14px">Offline — data jsou uložena lokálně.</p>
<button onclick="location.reload()">Zkusit znovu</button>
</body></html>`;

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.addAll(['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'])
        .catch(() => {})
    )
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (url.includes('anthropic.com') ||
      url.includes('nominatim.openstreetmap.org') ||
      url.includes('googleapis.com') ||
      url.includes('tile.openstreetmap.org') ||
      url.includes('cdnjs.cloudflare.com') ||
      url.includes('fonts.g')) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if (res.ok) {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => null);
      return cached || network || new Response(OFFLINE_PAGE, {
        headers: { 'Content-Type': 'text/html' }
      });
    })
  );
});
