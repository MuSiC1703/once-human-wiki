const CACHE_NAME = 'oh-wiki-v21';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './fusion-sim.js',
  './manifest.json',
  './data/deviants.json',
  './data/fusion_data.json',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './images/artisans-touch.webp',
  './images/atomic-snail.webp',
  './images/atomic.webp',
  './images/beaver.webp',
  './images/beehive.webp',
  './images/behemoth.webp',
  './images/blackback.webp',
  './images/brave-george.webp',
  './images/butterfly.webp',
  './images/by-the-wind.webp',
  './images/cattiva.webp',
  './images/chefosaurus-rex.webp',
  './images/chillet.webp',
  './images/digby.webp',
  './images/director-fox.webp',
  './images/disco-ball.webp',
  './images/doctor-raven.webp',
  './images/dream-catcher.webp',
  './images/eel.webp',
  './images/enchanting.webp',
  './images/extradimensional-cat.webp',
  './images/festering.webp',
  './images/fetch-a-lot-bunny.webp',
  './images/flame-essence.webp',
  './images/frog.webp',
  './images/gazocchio.webp',
  './images/gingerbread.webp',
  './images/growshroom.webp',
  './images/grumpy-bulb.webp',
  './images/h37.webp',
  './images/harveseed.webp',
  './images/hug-in-a-bowl.webp',
  './images/hydronaut-fish.webp',
  './images/ice-pot.webp',
  './images/invincible-sun.webp',
  './images/lethal-rabbit.webp',
  './images/lonewolf.webp',
  './images/masonic-pyramid.webp',
  './images/mini-feaster.webp',
  './images/mini-wonder.webp',
  './images/mr-wish.webp',
  './images/nutcracker.webp',
  './images/orb-lightning.webp',
  './images/paper-doll.webp',
  './images/party-monkey.webp',
  './images/polar-jelly.webp',
  './images/pup-buddy.webp',
  './images/pyro-dino.webp',
  './images/rain-man.webp',
  './images/rebecca.webp',
  './images/shattered-maiden.webp',
  './images/snapshot.webp',
  './images/snow-globe.webp',
  './images/snowsprite.webp',
  './images/soul-summoner.webp',
  './images/space-turner.webp',
  './images/strange-door.webp',
  './images/tar-pudding.webp',
  './images/teddy.webp',
  './images/upper-world-spawn.webp',
  './images/voodoo.webp',
  './images/whalepup.webp',
  './images/wish-box.webp',
  './images/zapamander.webp',
  './images/zeno-purifier.webp'
];

// Install: precache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: strategy based on request type
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignore non-GET requests or browser extension requests
  if (event.request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Strategy 1: Data JSON - Network First, fallback to cache
  if (url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Strategy 2: Images and static assets - Cache First, fallback to network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch((err) => {
        // If offline and request is an image, browser handles fallback or placeholder
        return cachedResponse;
      });
    })
  );
});
