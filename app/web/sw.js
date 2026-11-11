/* RCD · service worker: guarda la «carcasa» de la app para que abra rápido y se pueda instalar.
   Los datos (el motor en Google) nunca se guardan aquí: siempre se piden en directo. */
const VERSION = 'rcd-v1';
const CARCASA = ['./', 'index.html', 'css/paciente.css', 'css/comun.css', 'js/config.js', 'js/comun.js', 'js/paciente.js',
  'data/rcd-datos.js', 'data/rcd-cuestionarios.js', 'fonts/geist-latin.woff2', 'fonts/outfit-latin.woff2', 'img/icono.svg', 'img/icono-192.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(VERSION).then(c => c.addAll(CARCASA)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== VERSION).map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // el motor va siempre por red
  // Primero la red (para tener siempre la última versión); si no hay conexión, lo guardado.
  e.respondWith(fetch(e.request).then(r => { const copia = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copia)); return r; }).catch(() => caches.match(e.request)));
});
