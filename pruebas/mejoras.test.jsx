/* Versión nueva sin recargar a mano, constancia en PDF y CSV de la ventana de editores. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { revisarVersion, hayVersionNueva, reiniciarVersion, scriptActual } from "../src/lib/version.js";
import { datosConstancia, crearConstancia } from "../src/lib/constancia.js";
import { csvResultados, resumir } from "../src/lib/resultados.js";

const pagina = (script) => ({ ok: true, text: async () => `<html><script type="module" crossorigin src="${script}"></script></html>` });

describe("versión nueva publicada", () => {
  beforeEach(() => reiniciarVersion());

  it("detecta que el script principal cambió", async () => {
    const pedir = vi.fn(async () => pagina("/assets/index-NUEVO123.js"));
    expect(await revisarVersion({ actual: "/assets/index-VIEJO999.js", pedir })).toBe(true);
    expect(hayVersionNueva()).toBe(true);
    expect(pedir).toHaveBeenCalledWith("/", expect.objectContaining({ cache: "no-store" }));
  });

  it("si es la misma versión, o no hay internet, no pasa nada", async () => {
    expect(await revisarVersion({ actual: "/assets/index-IGUAL.js", pedir: async () => pagina("/assets/index-IGUAL.js") })).toBe(false);
    expect(await revisarVersion({ actual: "/assets/index-IGUAL.js", pedir: async () => { throw new Error("sin red"); } })).toBe(false);
    expect(hayVersionNueva()).toBe(false);
  });

  it("en desarrollo (sin hash) no revisa", async () => {
    const pedir = vi.fn();
    expect(scriptActual(document)).toBeNull();
    expect(await revisarVersion({ actual: null, pedir })).toBe(false);
    expect(pedir).not.toHaveBeenCalled();
  });
});

describe("constancia", () => {
  it("toma nombre, ID, rango, misiones y XP del progreso", () => {
    const d = datosConstancia({ records: { sismo: 330, green: 10 }, insignias: ["a", "b"], xp: 90, juegos: { x: { partidas: 1 }, y: { partidas: 0 } } }, { nombre: "Ana", id: "K7P2QX" });
    expect(d).toMatchObject({ nombre: "Ana", id: "K7P2QX", rango: "Capitán", mejor: 330, misiones: 2, xp: 90, juegos: 1 });
    expect(d.totalMisiones).toBeGreaterThan(0);
  });

  it("sin nombre deja la línea para escribirlo a mano, y el PDF es de una hoja", async () => {
    const d = datosConstancia({}, null);
    expect(d.nombre).toBe("");
    const doc = await crearConstancia(d, { imagenes: false });
    expect(doc.getNumberOfPages()).toBe(1);
  });
});

describe("CSV de la ventana de editores", () => {
  it("abre en Excel con acentos y no deja colar fórmulas", () => {
    const r = resumir([
      { juego: "memorama", tipo: "minijuego", grado: "primaria", dia: "2026-11-01", gusto: 5, dificultad: 2, respuestas: 3 },
      { juego: "mision-green", tipo: "mision", grado: "primaria", dia: "2026-11-01", gusto: 1, dificultad: 3, respuestas: 1 },
    ]);
    const csv = csvResultados(r);
    expect(csv.startsWith("﻿")).toBe(true);
    const lineas = csv.slice(1).split("\r\n");
    expect(lineas[0]).toContain("Promedio (1 a 5)");
    expect(lineas[1]).toMatch(/^Memorama.*,Minijuego,3,5\.00,0,0,0,0,3,0,3,0,100$/);
    expect(lineas[2]).toContain("Misiones de Greencito,Misiones,1,1.00");
  });
});
