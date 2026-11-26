// @vitest-environment node
/* Cabeceras de seguridad (vercel.json): la Content-Security-Policy solo deja correr los scripts
   del propio sitio y el script del tema de index.html por su hash. Si alguien cambia ese script
   sin actualizar el hash, el modo oscuro dejaría de aplicarse antes de pintar: esta prueba avisa. */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";

const leer = (ruta) => readFileSync(new URL("../" + ruta, import.meta.url), "utf8");
const vercel = JSON.parse(leer("vercel.json"));
const cabecera = (nombre) =>
  vercel.headers.find((h) => h.source === "/(.*)").headers.find((h) => h.key === nombre)?.value || "";
const csp = cabecera("Content-Security-Policy");
const directiva = (nombre) => csp.split(";").map((d) => d.trim()).find((d) => d.startsWith(nombre + " ")) || "";

/** Scripts escritos dentro del HTML (sin src). En Vercel el archivo llega con saltos LF (.gitattributes). */
const scriptsEnLinea = (html) =>
  [...html.replace(/\r\n/g, "\n").matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const hash = (texto) => "'sha256-" + createHash("sha256").update(texto).digest("base64") + "'";

describe("Content-Security-Policy", () => {
  it("el hash del script del tema de index.html está en la política", () => {
    const scripts = scriptsEnLinea(leer("index.html"));
    expect(scripts).toHaveLength(1);
    expect(directiva("script-src")).toContain(hash(scripts[0]));
  });

  it("solo scripts del propio sitio: nada de 'unsafe-inline', 'unsafe-eval' ni otros dominios", () => {
    const scripts = directiva("script-src");
    expect(scripts).not.toMatch(/unsafe-inline|unsafe-eval|https?:|\*/);
    expect(directiva("connect-src")).toBe("connect-src 'self'");
    expect(directiva("object-src")).toBe("object-src 'none'");
    expect(directiva("frame-ancestors")).toBe("frame-ancestors 'self'");
  });

  it("las otras páginas de public/ no traen scripts escritos dentro (los bloquearía)", () => {
    const paginas = readdirSync(new URL("../public/", import.meta.url)).filter((f) => f.endsWith(".html"));
    for (const p of paginas) expect(scriptsEnLinea(leer("public/" + p)), p).toEqual([]);
  });

  it("Vercel instala exactamente lo del package-lock.json", () => {
    expect(vercel.installCommand).toMatch(/\bnpm ci\b/);
    expect(JSON.parse(leer("package.json")).engines.node).toBe("24.x");
  });
});
