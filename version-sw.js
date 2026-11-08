/**
 * Plugin de Vite: le pone a dist/sw.js la huella de esta versión (sale del index.html, que trae
 * los nombres con hash de los scripts). Así el navegador ve un sw.js distinto en cada
 * publicación, lo reinstala y borra la caché vieja.
 *
 * Vive aparte de vite.config.js para que las pruebas lo importen sin cargar Vite.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export const MARCA = "__VERSION_BUILD__";

export function versionServiceWorker() {
  let salida = "dist";
  return {
    name: "version-service-worker",
    apply: "build",
    configResolved(cfg) { salida = path.resolve(cfg.root, cfg.build.outDir); },
    closeBundle() {
      const sw = path.join(salida, "sw.js");
      if (!existsSync(sw)) return;
      const huella = createHash("sha256").update(readFileSync(path.join(salida, "index.html"))).digest("hex").slice(0, 12);
      const texto = readFileSync(sw, "utf8");
      if (!texto.includes(MARCA)) throw new Error(`public/sw.js ya no trae ${MARCA}`);
      writeFileSync(sw, texto.replaceAll(MARCA, huella));
    },
  };
}
