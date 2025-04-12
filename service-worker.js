// Cache name
const CACHE_NAME = 'calabouco-v1';

// Arquivos para cache
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json',
    '/images/icon-192x192.png',
    '/images/icon-512x512.png',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
    'https://kit.fontawesome.com/your-code.js',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// Instala o Service Worker e faz cache dos arquivos
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache aberto');
                return cache.addAll(urlsToCache);
            })
    );
});

// Ativa o Service Worker e limpa caches antigos
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Intercepta requisições e serve do cache quando possível
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

// Recebe notificações push
self.addEventListener('push', event => {
    const options = {
        body: event.data.text(),
        icon: '/images/logo.png',
        badge: '/images/badge.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Ver mensagem',
                icon: '/images/checkmark.png'
            },
            {
                action: 'close',
                title: 'Fechar',
                icon: '/images/xmark.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('Calabouço Tinder', options)
    );
});

// Lida com cliques nas notificações
self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
}); 