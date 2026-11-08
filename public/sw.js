/* Service worker: el juego funciona sin internet después de la primera visita.
 *
 * - Al instalarse guarda la página, sus scripts y estilos (los lee del index.html,
 *   que trae los nombres con hash de cada versión), la fuente, las imágenes y los motores
 *   de los minijuegos, que se cargan diferidos y no salen en el index.html (la lista la
 *   pone version-sw.js al compilar). Las librerías de PDF se guardan al usarlas.
 * - Páginas: primero la red (para recibir versiones nuevas); sin red, la guardada.
 * - Lo demás: lo guardado al instante y se actualiza por detrás.
 * - Las funciones del servidor (/api/) nunca se guardan: siempre van a la red.
 *
 * El navegador solo reinstala el service worker si ESTE archivo cambia. Por eso, al compilar,
 * version-sw.js (plugin de Vite) cambia __VERSION_BUILD__ por una huella de la versión: cada publicación trae un
 * sw.js distinto, se instala con una caché nueva y al activarse borra la de la versión anterior
 * (si no, los scripts viejos con hash se quedaban guardados para siempre).
 */
const VERSION = "escuadron-__VERSION_BUILD__";
// archivos de los motores diferidos; sin compilar queda el texto de marca y se ignora
const DIFERIDOS = "__DIFERIDOS_BUILD__".split(",").filter((a) => a.startsWith("/assets/"));
const BASE = [
  "/",
  "/manifest.webmanifest",
  "/sismo.webp",
  "/greencito.webp",
  "/sismo-cara.webp",
  "/greencito-cara.webp",
  "/fondo.webp",
  "/fondo-movil.webp",
  "/fcitec.webp",
  "/bcia.webp",
  "/copits.webp",
  "/uabc-escudo.webp",
  "/icono-192.png",
  "/icono-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    (async () => {
      const cache = await caches.open(VERSION);
      await cache.addAll(BASE);
      // los archivos con hash de esta versión salen del index.html
      try {
        const html = await (await fetch("/", { cache: "no-store" })).text();
        const archivos = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]);
        await cache.addAll([...new Set(archivos)]);
        // la fuente va dentro del CSS
        for (const hoja of archivos.filter((a) => a.endsWith(".css"))) {
          const css = await (await fetch(hoja)).text();
          const fuentes = [...css.matchAll(/url\(["']?(\/assets\/[^"')]+\.woff2)/g)].map((m) => m[1]);
          await cache.addAll([...new Set(fuentes)]);
        }
      } catch (err) {
        /* sin red al instalar: se llenará al navegar */
      }
      // los minijuegos, para jugarlos sin internet aunque nunca se hayan abierto
      try {
        await cache.addAll(DIFERIDOS);
      } catch (err) {
        /* se guardarán la primera vez que se abran */
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      const nombres = await caches.keys();
      await Promise.all(nombres.filter((n) => n !== VERSION).map((n) => caches.delete(n)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (req.mode === "navigate") {
    e.respondWith(
      (async () => {
        try {
          const red = await fetch(req);
          const cache = await caches.open(VERSION);
          cache.put("/", red.clone());
          return red;
        } catch (err) {
          return (await caches.match("/")) || Response.error();
        }
      })()
    );
    return;
  }

  e.respondWith(
    (async () => {
      const cache = await caches.open(VERSION);
      const guardada = await cache.match(req);
      const deRed = fetch(req)
        .then((r) => {
          if (r.ok) cache.put(req, r.clone());
          return r;
        })
        .catch(() => null);
      return guardada || (await deRed) || Response.error();
    })()
  );
});
