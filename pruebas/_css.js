/* Lee los estilos de los minijuegos (src/estilos/minijuegos/*.css) en el orden en que se cargan. */
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

export const CARPETA_MINIJUEGOS = resolve(process.cwd(), "src/estilos/minijuegos");

/** Los .css de la carpeta, ordenados por su número (01-, 02-…). */
export const archivosMinijuegos = () => readdirSync(CARPETA_MINIJUEGOS).filter((f) => f.endsWith(".css")).sort();

export const cssMinijuegos = () =>
  archivosMinijuegos().map((f) => readFileSync(resolve(CARPETA_MINIJUEGOS, f), "utf8")).join("\n");
