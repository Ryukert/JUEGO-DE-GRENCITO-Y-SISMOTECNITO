/* Versionado: package.json, CHANGELOG.md y el número que se ve en Ajustes van de acuerdo. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import App from "../src/App.jsx";
import { VERSION } from "../src/lib/version.js";
import { publicarVersion } from "../scripts/version-changelog.js";

const raiz = (f) => resolve(process.cwd(), f);
const paquete = JSON.parse(readFileSync(raiz("package.json"), "utf8"));
const historial = readFileSync(raiz("CHANGELOG.md"), "utf8");
const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

/** Las versiones del CHANGELOG en el orden en que aparecen: [{ version, fecha }]. */
const entradas = [...historial.matchAll(/^## \[(\d+\.\d+\.\d+)\] - (\d{4}-\d{2}-\d{2})$/gm)].map((m) => ({ version: m[1], fecha: m[2] }));
const comparar = (a, b) => {
  const [x, y] = [a, b].map((v) => v.split(".").map(Number));
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
};
const texto = (...lineas) => lineas.join("\n");

describe("versión del juego", () => {
  it("package.json lleva una versión MAYOR.MENOR.PARCHE y el juego usa la misma", () => {
    expect(paquete.version).toMatch(SEMVER);
    expect(VERSION).toBe(paquete.version);
  });

  it("arriba está «Sin publicar» para lo que viene, y luego la versión actual con fecha", () => {
    expect(historial).toMatch(/^## \[Sin publicar\]$/m);
    expect(historial.indexOf("## [Sin publicar]")).toBeLessThan(historial.indexOf(`## [${paquete.version}]`));
    expect(entradas.length).toBeGreaterThan(0);
    expect(entradas[0].version, "agrega su entrada en CHANGELOG.md").toBe(paquete.version);
  });

  it("el CHANGELOG va de la más nueva a la más vieja, sin repetir, y cada una tiene su enlace", () => {
    for (let i = 1; i < entradas.length; i++) {
      expect(comparar(entradas[i - 1].version, entradas[i].version), `${entradas[i - 1].version} antes de ${entradas[i].version}`).toBeGreaterThan(0);
      expect(entradas[i - 1].fecha >= entradas[i].fecha).toBe(true);
    }
    for (const { version } of entradas) {
      expect(historial, `enlace de ${version}`).toMatch(new RegExp(`^\\[${version.replaceAll(".", "\\.")}\\]: https://github\\.com/`, "m"));
    }
  });
});

describe("npm version: «Sin publicar» pasa a la versión nueva", () => {
  it("mueve las notas, deja «Sin publicar» vacía arriba y agrega el enlace", () => {
    const antes = texto(
      "# Historial", "", "## [Sin publicar]", "", "### Agregado", "- Algo nuevo.", "",
      "## [1.8.0] - 2026-11-08", "", "- Viejo.", "", "[1.8.0]: https://github.com/x/compare/v1.7.3...v1.8.0", "",
    );
    const despues = publicarVersion(antes, "1.9.0", "2026-12-01");
    expect(despues).toContain(texto("## [Sin publicar]", "", "## [1.9.0] - 2026-12-01", "", "### Agregado", "- Algo nuevo.", "", "## [1.8.0]"));
    expect(despues).toContain(texto(
      "[1.9.0]: https://github.com/Ryukert/JUEGO-DE-GRENCITO-Y-SISMOTECNITO/compare/v1.8.0...v1.9.0",
      "[1.8.0]: https://github.com/x/compare/v1.7.3...v1.8.0",
    ));
  });

  it("no deja sacar una versión sin notas, ni repetir una", () => {
    expect(() => publicarVersion(texto("## [Sin publicar]", "", "## [1.8.0] - 2026-11-08", "- x"), "1.9.0")).toThrow(/vacía/);
    expect(() => publicarVersion(texto("## [Sin publicar]", "- y", "", "## [1.8.0] - 2026-11-08"), "1.8.0")).toThrow(/ya está/);
    expect(() => publicarVersion(texto("## [1.8.0] - 2026-11-08", "- x"), "1.9.0")).toThrow(/Sin publicar/);
  });

  it("package.json la conecta con npm version", () => {
    expect(paquete.scripts.version).toContain("scripts/version-changelog.js");
    expect(readFileSync(raiz(".npmrc"), "utf8")).toMatch(/tag-version-prefix="v"/);
  });
});

describe("la versión se ve en Ajustes", () => {
  beforeEach(() => {
    localStorage.clear();
    window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
    window.scrollTo = () => {};
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ disponible: false }) })));
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it("al pie de la ventana de Ajustes", () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText("Ajustes"));
    expect(screen.getByText(`Escuadrón Tecnito y Greencito · versión ${paquete.version}`)).toBeTruthy();
  });
});
