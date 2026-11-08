/* El confeti no debe romper nada si la animación sigue viva cuando la página ya se cerró. */
import { describe, it, expect, vi, afterEach } from "vitest";
import { confeti } from "../src/lib/confeti.js";

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("confeti", () => {
  it("se detiene sin error si requestAnimationFrame desaparece a media animación", () => {
    vi.useFakeTimers();
    HTMLCanvasElement.prototype.getContext = () => ({ clearRect() {}, save() {}, restore() {}, translate() {}, rotate() {}, fillRect() {} });
    window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
    vi.stubGlobal("requestAnimationFrame", (cb) => setTimeout(cb, 16));
    confeti({ cantidad: 10 });
    vi.advanceTimersByTime(50);
    vi.stubGlobal("requestAnimationFrame", undefined);   // como al desmontar el entorno de pruebas
    expect(() => vi.advanceTimersByTime(2_000)).not.toThrow();
    // y vuelve a arrancar normal la siguiente vez
    vi.stubGlobal("requestAnimationFrame", (cb) => setTimeout(cb, 16));
    expect(() => { confeti({ cantidad: 5 }); vi.advanceTimersByTime(3_000); }).not.toThrow();
  });
});
