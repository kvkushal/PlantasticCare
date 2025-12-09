/**
 * PlantasticCare Service Worker
 * Enables offline functionality and faster loading
 */

const CACHE_NAME = 'plantastic-cache-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/plants.html',
    '/care.html',
    '/about.html',
    '/forum.html',
    '/login.html',
    '/css/style.css',
    '/css/plants-style.css',
    '/css/care-style.css',
    '/css/about-style.css',
    '/css/forum-style.css',
    '/js/config.js',
    '/js/enhancements.js',
    '/js/index.js',
    '/js/plants.js',
    '/js/about.js',
    '/js/forum.js',
    '/data/plants.json',
    '/images/logo1.png',
    '/images/icon.png'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('PlantasticCare: Caching assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .catch((error) => {
                console.log('PlantasticCare: Cache failed', error);
            })
    );
    self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('PlantasticCare: Removing old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests and API calls
    if (event.request.method !== 'GET' || event.request.url.includes('/api/') || event.request.url.includes('localhost:5000')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Return cached version
                    return cachedResponse;
                }

                // Fetch from network
                return fetch(event.request)
                    .then((response) => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone and cache the response
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Offline fallback for HTML pages
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match('/index.html');
                        }
                    });
            })
    );
});
