/* Velocidad: los motores de minijuegos se descargan hasta que se abren, y el service worker
   los guarda para jugar sin internet. */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { diferido } from "../src/juegos/diferido.jsx";
import { JUEGOS } from "../src/juegos/registro.js";
import { archivosDiferidos } from "../version-sw.js";

const raiz = (f) => resolve(process.cwd(), f);
afterEach(() => cleanup());

const Hola = ({ nombre }) => <p>Hola, {nombre}</p>;

describe("componente diferido", () => {
  it("mientras llega dice «Cargando el juego…» y luego se dibuja con sus props", async () => {
    let soltar;
    const Comp = diferido(() => new Promise((r) => { soltar = r; }));
    render(<Comp nombre="Ana" />);
    expect(screen.getByRole("status").textContent).toMatch(/Cargando el juego/);
    await act(async () => soltar({ default: Hola }));
    expect(screen.getByText("Hola, Ana")).toBeTruthy();
  });

  it("si ya se descargó, aparece en el mismo render, sin «Cargando»", async () => {
    const Comp = diferido(async () => ({ Saludo: Hola }), "Saludo");
    await Comp.precargar();
    render(<Comp nombre="Luis" />);
    expect(screen.getByText("Hola, Luis")).toBeTruthy();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("descarga una sola vez aunque lo pidan varias pantallas", async () => {
    const cargar = vi.fn(async () => ({ default: Hola }));
    const Comp = diferido(cargar);
    await Promise.all([Comp.precargar(), Comp.precargar()]);
    render(<><Comp nombre="a" /><Comp nombre="b" /></>);
    expect(cargar).toHaveBeenCalledTimes(1);
  });

  it("sin internet avisa y deja reintentar", async () => {
    const cargar = vi.fn()
      .mockRejectedValueOnce(new Error("sin red"))
      .mockResolvedValueOnce({ default: Hola });
    const Comp = diferido(cargar);
    await act(async () => { render(<Comp nombre="Sol" />); });
    expect(screen.getByRole("alert").textContent).toMatch(/No se pudo abrir el juego/);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Intentar de nuevo" })); });
    expect(screen.getByText("Hola, Sol")).toBeTruthy();
    expect(cargar).toHaveBeenCalledTimes(2);
  });
});

describe("los minijuegos no viajan en el script principal", () => {
  it("el catálogo no importa ningún motor de forma directa: todos son diferidos", () => {
    const registro = readFileSync(raiz("src/juegos/registro.js"), "utf8");
    expect(registro).not.toMatch(/^import .* from "\.\/motores\//m);
    for (const j of JUEGOS) expect(typeof j.motor.precargar, j.id).toBe("function");
  });

  it("la pantalla del minijuego empieza a descargar el motor desde las instrucciones", () => {
    expect(readFileSync(raiz("src/juegos/PantallaMinijuego.jsx"), "utf8")).toMatch(/Motor\.precargar/);
  });
});

describe("el service worker guarda los motores para jugar sin internet", () => {
  const chunk = (fileName, extra = {}) => ({ type: "chunk", fileName, imports: [], ...extra });
  const bundle = {
    a: chunk("assets/index-1.js", { facadeModuleId: "/p/src/main.jsx", imports: ["assets/react-1.js"] }),
    b: chunk("assets/react-1.js"),
    c: chunk("assets/Quiz-1.js", { facadeModuleId: "/p/src/juegos/motores/Quiz.jsx", imports: ["assets/preguntas-1.js", "assets/react-1.js"] }),
    d: chunk("assets/preguntas-1.js", { facadeModuleId: "/p/src/data/juegos/preguntas.js" }),
    e: chunk("assets/Ruta-1.js", { facadeModuleId: "C:\\p\\src\\juegos\\motores\\Ruta.jsx", dynamicImports: ["assets/jspdf-1.js"] }),
    f: chunk("assets/jspdf-1.js", { facadeModuleId: "/p/node_modules/jspdf/x.js" }),
    g: { type: "asset", fileName: "assets/fuente.woff2" },
  };

  it("lista los motores y lo que importan, pero no lo que cargan aparte (como el PDF)", () => {
    expect(archivosDiferidos(bundle)).toEqual(["/assets/Quiz-1.js", "/assets/Ruta-1.js", "/assets/preguntas-1.js", "/assets/react-1.js"]);
  });

  it("sw.js trae la marca para la lista y la guarda al instalarse", () => {
    const sw = readFileSync(raiz("public/sw.js"), "utf8");
    expect(sw).toContain('"__DIFERIDOS_BUILD__".split(",")');
    expect(sw).toMatch(/cache\.addAll\(DIFERIDOS\)/);
  });
});
