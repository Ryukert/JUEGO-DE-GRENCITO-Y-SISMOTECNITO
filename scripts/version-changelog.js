/**
 * Lo corre `npm version patch|minor|major` (script "version" de package.json), después de
 * subir el número y antes de hacer el commit «Versión X.Y.Z» con su etiqueta vX.Y.Z.
 *
 * Convierte la sección «## [Sin publicar]» de CHANGELOG.md en «## [X.Y.Z] - AAAA-MM-DD»,
 * deja una «Sin publicar» vacía arriba para lo que sigue y agrega el enlace de comparación.
 * Si «Sin publicar» está vacía se detiene: no se saca una versión sin decir qué trae.
 *
 * También se puede probar a mano:  node scripts/version-changelog.js 1.9.0
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const SIN_PUBLICAR = "## [Sin publicar]";
const REPO = "https://github.com/Ryukert/JUEGO-DE-GRENCITO-Y-SISMOTECNITO";

/** Fecha de hoy en Tijuana (AAAA-MM-DD), que es donde se publica. */
export const hoy = (ahora = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Tijuana", year: "numeric", month: "2-digit", day: "2-digit" }).format(ahora);

/** Devuelve el CHANGELOG con la versión nueva, o lanza un error que explica qué falta. */
export function publicarVersion(texto, version, fecha = hoy()) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error(`versión inválida: ${version}`);
  const lineas = texto.split("\n");
  const inicio = lineas.findIndex((l) => l.trim() === SIN_PUBLICAR);
  if (inicio === -1) throw new Error(`CHANGELOG.md no tiene la sección «${SIN_PUBLICAR}»`);
  const fin = lineas.findIndex((l, i) => i > inicio && /^## \[/.test(l));
  const notas = lineas.slice(inicio + 1, fin === -1 ? undefined : fin).join("\n").trim();
  if (!notas) throw new Error(`«${SIN_PUBLICAR}» está vacía: anota qué trae la versión ${version} antes de publicarla`);
  if (texto.includes(`## [${version}]`)) throw new Error(`la versión ${version} ya está en CHANGELOG.md`);

  const anterior = lineas.slice(fin === -1 ? lineas.length : fin).join("\n").match(/^## \[(\d+\.\d+\.\d+)\]/m)?.[1];
  lineas.splice(inicio, 1, SIN_PUBLICAR, "", `## [${version}] - ${fecha}`);

  let nuevo = lineas.join("\n");
  const enlace = anterior ? `[${version}]: ${REPO}/compare/v${anterior}...v${version}` : `[${version}]: ${REPO}/releases/tag/v${version}`;
  const primerEnlace = nuevo.search(/^\[\d+\.\d+\.\d+\]: /m);
  nuevo = primerEnlace === -1 ? nuevo.trimEnd() + "\n\n" + enlace + "\n" : nuevo.slice(0, primerEnlace) + enlace + "\n" + nuevo.slice(primerEnlace);
  return nuevo;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const version = process.argv[2] || process.env.npm_package_version;
  const archivo = resolve(process.cwd(), "CHANGELOG.md");
  try {
    writeFileSync(archivo, publicarVersion(readFileSync(archivo, "utf8"), version));
    console.log(`CHANGELOG.md: «Sin publicar» ahora es la versión ${version}.`);
  } catch (e) {
    console.error("No se publicó la versión:", e.message);
    process.exit(1);
  }
}
