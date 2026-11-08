/**
 * Plugin de Vite para el service worker (dist/sw.js), al compilar:
 *
 * 1. Le pone la huella de esta versión (sale del index.html, que trae los nombres con hash de
 *    los scripts). Así el navegador ve un sw.js distinto en cada publicación, lo reinstala y
 *    borra la caché vieja.
 * 2. Le pasa la lista de archivos de los motores de minijuegos, que se cargan diferidos
 *    (src/juegos/diferido.jsx) y por eso no salen en el index.html. El service worker los
 *    guarda al instalarse para que los minijuegos funcionen sin internet.
 *
 * Vive aparte de vite.config.js para que las pruebas lo importen sin cargar Vite.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export const MARCA = "__VERSION_BUILD__";
export const MARCA_DIFERIDOS = "__DIFERIDOS_BUILD__";

/** Módulos cuyo archivo (y lo que importa) se guarda para jugar sin internet. */
const DIFERIDO = /[\\/]src[\\/]juegos[\\/]motores[\\/]/;

/**
 * Del bundle de Rollup/Rolldown: los archivos de los motores y todo lo que importan, sin
 * las cargas dinámicas que ellos mismos hagan (como las librerías de PDF).
 */
export function archivosDiferidos(bundle) {
  const porNombre = new Map(Object.values(bundle).filter((c) => c.type === "chunk").map((c) => [c.fileName, c]));
  const vistos = new Set();
  const pendientes = [...porNombre.values()].filter((c) => c.facadeModuleId && DIFERIDO.test(c.facadeModuleId)).map((c) => c.fileName);
  while (pendientes.length) {
    const nombre = pendientes.pop();
    if (vistos.has(nombre)) continue;
    vistos.add(nombre);
    const chunk = porNombre.get(nombre);
    if (chunk) pendientes.push(...(chunk.imports || []));
    for (const css of chunk?.viteMetadata?.importedCss || []) vistos.add(css);
  }
  return [...vistos].map((f) => "/" + f.replaceAll("\\", "/")).sort();
}

export function versionServiceWorker() {
  let salida = "dist";
  let diferidos = [];
  return {
    name: "version-service-worker",
    apply: "build",
    configResolved(cfg) { salida = path.resolve(cfg.root, cfg.build.outDir); },
    generateBundle(_opciones, bundle) { diferidos = archivosDiferidos(bundle); },
    closeBundle() {
      const sw = path.join(salida, "sw.js");
      if (!existsSync(sw)) return;
      const huella = createHash("sha256").update(readFileSync(path.join(salida, "index.html"))).digest("hex").slice(0, 12);
      const texto = readFileSync(sw, "utf8");
      if (!texto.includes(MARCA)) throw new Error(`public/sw.js ya no trae ${MARCA}`);
      if (!texto.includes(MARCA_DIFERIDOS)) throw new Error(`public/sw.js ya no trae ${MARCA_DIFERIDOS}`);
      writeFileSync(sw, texto.replaceAll(MARCA, huella).replaceAll(MARCA_DIFERIDOS, diferidos.join(",")));
    },
  };
}
