const CACHE_NAME = 'oh-wiki-v45';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './data/deviants.json',
  './data/variants.json',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './images/variants/atomic-snail-lightning.webp',
  './images/variants/atomic-snail-lunar.webp',
  './images/variants/beehive-pumpkin.webp',
  './images/variants/bunny-aquarius.webp',
  './images/variants/butterfly-starry.webp',
  './images/variants/buzzy-radiant.webp',
  './images/variants/cat-fortune.webp',
  './images/variants/cat-ginger.webp',
  './images/variants/digby-dice.webp',
  './images/variants/digby-emerald.webp',
  './images/variants/digby-prism.webp',
  './images/variants/doll-witch.webp',
  './images/variants/festering-rainbow.webp',
  './images/variants/festering-rose.webp',
  './images/variants/festering-starfish.webp',
  './images/variants/grumpy-violet.webp',
  './images/variants/h37-prototype.webp',
  './images/variants/jelly-radiant.webp',
  './images/variants/lonewolf-frost.webp',
  './images/variants/lonewolf-magma.webp',
  './images/variants/lonewolf-radiant.webp',
  './images/variants/mr-wish-park.webp',
  './images/variants/mr-wish-warrior.webp',
  './images/variants/nutcracker-admiral.webp',
  './images/variants/nutcracker-diamond.webp',
  './images/variants/nutcracker-fairy.webp',
  './images/variants/rainman-youth.webp',
  './images/variants/spaceturner-cliff.webp',
  './images/variants/teddy-morning.webp',
  './images/variants/teddy-pink.webp',
  './images/variants/voodoo-fluffy.webp',
  './images/variants/whalepup-dry.webp',
  './images/variants/zapamander-abyss.webp',
  './images/variants/zapcam-fool.webp',
  './images/variants/zapcam-light.webp',
  './images/variants/zapcam-obituary.webp',
  './images/variants/zeno-blade.webp',
  './images/variants/zeno-evernight.webp',
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

  // Strategy 1: HTML, JS, CSS, JSON - Network First, fallback to cache
  const isCodeOrData = url.pathname.endsWith('.html') ||
                       url.pathname.endsWith('.js') ||
                       url.pathname.endsWith('.css') ||
                       url.pathname.endsWith('.json') ||
                       url.pathname === '/' ||
                       url.pathname.endsWith('/');

  if (isCodeOrData) {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Strategy 2: Images, icons and static media - Cache First, fallback to network
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
      }).catch(() => cachedResponse);
    })
  );
});
