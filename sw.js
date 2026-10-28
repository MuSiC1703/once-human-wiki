const CACHE_NAME = 'oh-wiki-v76';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './data/deviants.json',
  './data/variants.json',
  './data/perks.json',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './images/artisans-touch.webp',
  './images/atomic.webp',
  './images/atomic-snail.webp',
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
  './images/peach-weasel.webp',
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
  './images/zeno-purifier.webp',
  './images/variants/atomic-96102405.webp',
  './images/variants/atomic-96102406.webp',
  './images/variants/atomic-snail-96104201.webp',
  './images/variants/atomic-snail-96104202.webp',
  './images/variants/beaver-96102891.webp',
  './images/variants/beehive-96101904.webp',
  './images/variants/beehive-96101905.webp',
  './images/variants/butterfly-96100101.webp',
  './images/variants/butterfly-96100102.webp',
  './images/variants/butterfly-96100103.webp',
  './images/variants/by-the-wind-96103201.webp',
  './images/variants/by-the-wind-96103202.webp',
  './images/variants/by-the-wind-96103203.webp',
  './images/variants/chefosaurus-rex-93000020.webp',
  './images/variants/chefosaurus-rex-96102091.webp',
  './images/variants/digby-96102901.webp',
  './images/variants/digby-96102902.webp',
  './images/variants/digby-96102903.webp',
  './images/variants/digby-96102907.webp',
  './images/variants/digby-96102908.webp',
  './images/variants/digby-96102909.webp',
  './images/variants/disco-ball-96100205.webp',
  './images/variants/eel-96100501.webp',
  './images/variants/eel-96100502.webp',
  './images/variants/eel-96100505.webp',
  './images/variants/enchanting-96102501.webp',
  './images/variants/enchanting-96102502.webp',
  './images/variants/extradimensional-cat-96105101.webp',
  './images/variants/extradimensional-cat-96105109.webp',
  './images/variants/extradimensional-cat-96105111.webp',
  './images/variants/festering-96100801.webp',
  './images/variants/festering-96100802.webp',
  './images/variants/festering-96100803.webp',
  './images/variants/festering-96100805.webp',
  './images/variants/festering-96100807.webp',
  './images/variants/fetch-a-lot-bunny-96101401.webp',
  './images/variants/fetch-a-lot-bunny-96101402.webp',
  './images/variants/fetch-a-lot-bunny-96101405.webp',
  './images/variants/fetch-a-lot-bunny-96101406.webp',
  './images/variants/fetch-a-lot-bunny-96101408.webp',
  './images/variants/flame-essence-96104801.webp',
  './images/variants/flame-essence-96104802.webp',
  './images/variants/gingerbread-96102205.webp',
  './images/variants/growshroom-96103701.webp',
  './images/variants/growshroom-96103702.webp',
  './images/variants/growshroom-96103703.webp',
  './images/variants/growshroom-96103709.webp',
  './images/variants/grumpy-bulb-96103501.webp',
  './images/variants/h37-96102101.webp',
  './images/variants/h37-96102105.webp',
  './images/variants/hug-in-a-bowl-96102305.webp',
  './images/variants/hydronaut-fish-96104401.webp',
  './images/variants/invincible-sun-96102601.webp',
  './images/variants/invincible-sun-96102602.webp',
  './images/variants/invincible-sun-96102605.webp',
  './images/variants/lonewolf-96101101.webp',
  './images/variants/lonewolf-96101102.webp',
  './images/variants/lonewolf-96101103.webp',
  './images/variants/lonewolf-96101104.webp',
  './images/variants/mini-feaster-96105301.webp',
  './images/variants/mini-feaster-96105302.webp',
  './images/variants/mini-wonder-96105001.webp',
  './images/variants/mini-wonder-96105002.webp',
  './images/variants/mini-wonder-99200050.webp',
  './images/variants/mr-wish-96103402.webp',
  './images/variants/mr-wish-96107601.webp',
  './images/variants/mr-wish-chaos.webp',
  './images/variants/nutcracker-96100001.webp',
  './images/variants/nutcracker-96100002.webp',
  './images/variants/nutcracker-96100003.webp',
  './images/variants/nutcracker-96100004.webp',
  './images/variants/nutcracker-96100005.webp',
  './images/variants/nutcracker-96100006.webp',
  './images/variants/nutcracker-96100007.webp',
  './images/variants/nutcracker-96100008.webp',
  './images/variants/nutcracker-96100009.webp',
  './images/variants/nutcracker-96100010.webp',
  './images/variants/nutcracker-96100011.webp',
  './images/variants/nutcracker-96100012.webp',
  './images/variants/nutcracker-96100013.webp',
  './images/variants/nutcracker-96100014.webp',
  './images/variants/nutcracker-96100015.webp',
  './images/variants/nutcracker-96100016.webp',
  './images/variants/nutcracker-96100017.webp',
  './images/variants/nutcracker-96100018.webp',
  './images/variants/nutcracker-96102705.webp',
  './images/variants/nutcracker-96102720.webp',
  './images/variants/paper-doll-96105401.webp',
  './images/variants/paper-doll-96105405.webp',
  './images/variants/party-monkey-96104505.webp',
  './images/variants/polar-jelly-96100301.webp',
  './images/variants/polar-jelly-96100303.webp',
  './images/variants/pup-buddy-96100701.webp',
  './images/variants/pup-buddy-96100705.webp',
  './images/variants/pyro-dino-96103001.webp',
  './images/variants/rain-man-96103902.webp',
  './images/variants/rain-man-96103903.webp',
  './images/variants/rain-man-96103904.webp',
  './images/variants/rain-man-96103909.webp',
  './images/variants/rebecca-96103109.webp',
  './images/variants/shattered-maiden-96104903.webp',
  './images/variants/snapshot-93000040.webp',
  './images/variants/snapshot-96100304.webp',
  './images/variants/snapshot-96104002.webp',
  './images/variants/snapshot-96104005.webp',
  './images/variants/snow-globe-96103605.webp',
  './images/variants/snow-globe-96103609.webp',
  './images/variants/snowsprite-96105801.webp',
  './images/variants/snowsprite-96105803.webp',
  './images/variants/snowsprite-chaos.webp',
  './images/variants/space-turner-96101301.webp',
  './images/variants/space-turner-96101305.webp',
  './images/variants/tar-pudding-96105701.webp',
  './images/variants/tar-pudding-96105702.webp',
  './images/variants/teddy-96101805.webp',
  './images/variants/teddy-96101807.webp',
  './images/variants/teddy-96101809.webp',
  './images/variants/teddy-96101891.webp',
  './images/variants/upper-world-spawn-96104609.webp',
  './images/variants/voodoo-96104701.webp',
  './images/variants/voodoo-96104702.webp',
  './images/variants/wish-box-96106005.webp',
  './images/variants/zapamander-96105901.webp',
  './images/variants/zapamander-96105902.webp',
  './images/variants/zeno-purifier-96103801.webp',
  './images/perks/brute_force_rules.png',
  './images/perks/cleanliness_hygiene.png',
  './images/perks/eureka.png',
  './images/perks/extra_ammo.png',
  './images/perks/feline_creatures.png',
  './images/perks/forever_young.png',
  './images/perks/herbivore.png',
  './images/perks/knights_round_table.png',
  './images/perks/moon_rush.png',
  './images/perks/musical_resonance.png',
  './images/perks/neon_shimmer.png',
  './images/perks/nightmare_waters.png',
  './images/perks/polar_beast.png',
  './images/perks/pollution_adaptation.png',
  './images/perks/precision_moment.png',
  './images/perks/sensible_massage.png',
  './images/perks/temperature_lord.png',
  './images/perks/top_grenadier.png',
  './images/perks/vile_symbiosis.png',
  './images/perks/warm_flame.png',
  // Newly added deviant and morphs (v76)
  './images/duet.webp',
  './images/variants/space-turner-96101306.webp',
  './images/variants/wish-box-96106006.webp',
  './images/variants/shattered-maiden-96104905.webp',
  './images/variants/whalepup-dont-get-wet.webp',
  './images/variants/h37-96102106.webp',
  './images/variants/gingerbread-96102206.webp',
  './images/variants/snow-globe-96103607.webp',
  './images/variants/director-fox-96107006.webp',
  './images/variants/mr-wish-96103404.webp',
  './images/variants/rebecca-chaos.webp',
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