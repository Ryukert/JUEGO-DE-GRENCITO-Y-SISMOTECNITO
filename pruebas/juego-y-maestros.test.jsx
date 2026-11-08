/* Juego y maestros: variantes de los retos, repaso de lo que falló, tarea en la portada,
   PDF del panel y registro de errores del navegador. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Readable } from "node:stream";
import { PERSONAJES, GRADOS, retosDe, buscarReto, armarPartida } from "../src/data/personajes.js";
import { borrarProgreso, leerProgreso, registrarRespuesta, registrarMinijuego } from "../src/lib/progreso.js";
import { pendientesDeRepaso, preguntaDeRepaso } from "../src/lib/repaso.js";
import { mezclarProgreso, limpiarProgreso } from "../src/lib/mezcla.js";
import { reiniciarPreferencias } from "../src/lib/preferencias.js";
import Repaso from "../src/pages/Repaso.jsx";
import TareaAlumno, { tareaHecha } from "../src/components/TareaAlumno.jsx";
import { esDelJuego, reportarError, reiniciarErrores, MAXIMO } from "../src/lib/errores.js";
import errorApi, { armarReporte } from "../api/error.js";
import { reiniciarMemoria } from "../api/_limites.js";

beforeEach(() => {
  localStorage.clear();
  borrarProgreso();
  reiniciarPreferencias();
  reiniciarErrores();
  window.AudioContext = undefined;
  window.scrollTo = () => {};
  HTMLCanvasElement.prototype.getContext = () => ({ clearRect() {}, save() {}, restore() {}, translate() {}, rotate() {}, fillRect() {} });
  window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  Element.prototype.scrollIntoView = function () {};
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("más retos: variantes al azar en cada partida", () => {
  it("cada reto tiene sus variantes, con una sola respuesta buena y su bonificación", () => {
    for (const p of Object.values(PERSONAJES)) {
      const retos = retosDe(p);
      expect(retos.length, p.id).toBe(9);
      expect(new Set(retos.map((r) => r.id)).size).toBe(retos.length);
      for (const r of retos) {
        expect(r.id.length, r.id).toBeLessThanOrEqual(10);
        expect(r.opciones.filter((o) => o.ok), r.id).toHaveLength(1);
        expect(r.opcionExtra?.ok, r.id).toBe(false);
        expect(r.retoSecundaria.opciones.filter((o) => o.ok), r.id).toHaveLength(1);
        for (const campo of ["titulo", "lugar", "escenario", "explicacion", "dato"]) expect(r[campo], `${r.id}.${campo}`).toBeTruthy();
      }
    }
  });

  it("la partida elige al azar en cada reto y conserva la insignia del original", () => {
    const p = PERSONAJES.green;
    const siempreUltima = armarPartida(p, () => 0.999);
    expect(siempreUltima.map((m) => m.id)).toEqual(["g1c", "g2", "g3c", "g4", "g5c"]);
    expect(siempreUltima.map((m) => m.insignia)).toEqual(p.misiones.map((m) => m.titulo));
    expect(armarPartida(p, () => 0).map((m) => m.id)).toEqual(p.misiones.map((m) => m.id));
    // los minijuegos de la misión no cambian
    expect(siempreUltima[1]).toMatchObject({ tipo: "minijuego", juego: "memorama" });
    // con el azar de verdad, en 200 partidas salen las tres opciones de cada reto
    const vistos = new Set();
    for (let i = 0; i < 200; i++) armarPartida(p).forEach((m) => vistos.add(m.id));
    expect([...vistos].filter((id) => /^g[135]/.test(id)).sort()).toEqual(["g1", "g1b", "g1c", "g3", "g3b", "g3c", "g5", "g5b", "g5c"]);
  });

  it("buscarReto encuentra originales y variantes; lo inventado no", () => {
    expect(buscarReto(PERSONAJES.sismo, "s5c").titulo).toBe("El mensaje falso");
    expect(buscarReto(PERSONAJES.sismo, "s5c").insignia).toBe("Después del temblor");
    expect(buscarReto(PERSONAJES.sismo, "s2")).toBeNull();   // es minijuego, no reto
    expect(buscarReto(PERSONAJES.sismo, "zz")).toBeNull();
    expect(buscarReto(undefined, "s1")).toBeNull();
  });
});

describe("repasar lo que falló", () => {
  it("fallar deja la pregunta pendiente; acertarla la quita; fallarla otra vez la regresa", () => {
    registrarRespuesta({ personaje: "sismo", mision: "s3b", correcto: false });
    registrarRespuesta({ personaje: "sismo", mision: "s3b", correcto: false });
    registrarRespuesta({ personaje: "green", mision: "g1", bono: true, correcto: false });
    let lista = pendientesDeRepaso(leerProgreso());
    expect(lista.map((x) => [x.clave, x.pendientes])).toEqual([["sismo:s3b", 2], ["green:g1:b", 1]]);

    registrarRespuesta({ personaje: "sismo", mision: "s3b", correcto: true });
    expect(pendientesDeRepaso(leerProgreso()).map((x) => x.clave)).toEqual(["green:g1:b"]);

    registrarRespuesta({ personaje: "sismo", mision: "s3b", correcto: false });
    lista = pendientesDeRepaso(leerProgreso());
    expect(lista.find((x) => x.clave === "sismo:s3b").pendientes).toBe(1);
    // acertar algo que nunca se falló no guarda nada
    registrarRespuesta({ personaje: "green", mision: "g5", correcto: true });
    expect(leerProgreso().repaso.dominadas["green:g5"]).toBeUndefined();
  });

  it("la pregunta de bonificación se repasa como pregunta principal, sin otra bonificación", () => {
    const item = { reto: buscarReto(PERSONAJES.green, "g1"), bono: true };
    const q = preguntaDeRepaso(item);
    expect(q.escenario).toBe("¿qué metal de las pilas daña más el sistema nervioso?");
    expect(q.opciones).toBe(item.reto.retoSecundaria.opciones);
    expect(q).not.toHaveProperty("retoSecundaria");
    expect(preguntaDeRepaso({ reto: item.reto, bono: false })).not.toHaveProperty("retoSecundaria");
  });

  it("se combina entre computadoras con el mayor, y lo que no es del juego se tira", () => {
    const a = { repaso: { fallos: { "sismo:s1": 3, "green:g3:b": 1 }, dominadas: { "sismo:s1": 1 } } };
    const b = { repaso: { fallos: { "sismo:s1": 2, "otro:x": 9, "sismo:s1;drop": 1 }, dominadas: { "sismo:s1": 3 } } };
    const r = mezclarProgreso(a, b).repaso;
    expect(r).toEqual({ fallos: { "sismo:s1": 3, "green:g3:b": 1 }, dominadas: { "sismo:s1": 3 } });
    expect(limpiarProgreso({ repaso: "nada" }).repaso).toEqual({ fallos: {}, dominadas: {} });
  });

  it("la pantalla de repaso pone las preguntas y al final dice cómo te fue", () => {
    const reto = buscarReto(PERSONAJES.sismo, "s1c");
    registrarRespuesta({ personaje: "sismo", mision: "s1c", correcto: false });
    render(<Repaso grado="primaria" onSalir={() => {}} />);
    expect(screen.getByText(reto.escenario)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: new RegExp(reto.opciones.find((o) => o.ok).texto.slice(0, 25)) }));
    fireEvent.click(screen.getByRole("button", { name: /Ver cómo me fue/ }));
    expect(screen.getByText("¡Repaso terminado!")).toBeTruthy();
    expect(screen.getByText(/Dejaste bien 1 de 1/)).toBeTruthy();
    expect(pendientesDeRepaso(leerProgreso())).toHaveLength(0);
  });

  it("sin nada pendiente, lo dice", () => {
    render(<Repaso grado="secundaria" onSalir={() => {}} />);
    expect(screen.getByText("No tienes nada que repasar")).toBeTruthy();
  });
});

describe("tarea del maestro en la portada del alumno", () => {
  const tarea = { juegos: ["clasifica-basura", "energia-solar", "no-existe"], nota: "Para el viernes", desde: "2026-11-05T00:00:00.000Z" };

  it("enseña los minijuegos que existen, los abre y palomea los jugados después de la tarea", () => {
    const progreso = { juegos: { "energia-solar": { jugadoEn: "2026-11-06T10:00:00.000Z" }, "clasifica-basura": { jugadoEn: "2026-11-01T10:00:00.000Z" } } };
    const abrir = vi.fn();
    render(<TareaAlumno tarea={tarea} progreso={progreso} onJugar={abrir} />);
    expect(screen.getByText("Tarea de tu maestro")).toBeTruthy();
    expect(screen.getByText("1 de 2")).toBeTruthy();
    expect(screen.getByText("«Para el viernes»")).toBeTruthy();
    expect(screen.getAllByRole("button")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: /Construye un sistema solar/ }));
    expect(abrir).toHaveBeenCalledWith("energia-solar");
    expect(tareaHecha(tarea, progreso, "energia-solar")).toBe(true);
    expect(tareaHecha(tarea, progreso, "clasifica-basura")).toBe(false);
  });

  it("al terminarla lo celebra; sin juegos válidos no aparece", () => {
    const todo = { juegos: { "clasifica-basura": { jugadoEn: "2026-11-06T00:00:00.000Z" }, "energia-solar": { jugadoEn: "2026-11-06T00:00:00.000Z" } } };
    const { unmount } = render(<TareaAlumno tarea={tarea} progreso={todo} onJugar={() => {}} />);
    expect(screen.getByText("¡Terminaste la tarea!")).toBeTruthy();
    unmount();
    const { container } = render(<TareaAlumno tarea={{ ...tarea, juegos: ["no-existe"] }} progreso={todo} onJugar={() => {}} />);
    expect(container.innerHTML).toBe("");
  });

  it("jugar un minijuego guarda la fecha (para saber si cumplió la tarea)", () => {
    registrarMinijuego("energia-solar", { score: 10, completed: true, dificultad: "facil" });
    expect(leerProgreso().juegos["energia-solar"].jugadoEn).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
    expect(limpiarProgreso({ juegos: { x: { jugadoEn: "ayer" } } }).juegos.x).not.toHaveProperty("jugadoEn");
  });
});

describe("PDF del panel del maestro", () => {
  it("se arma con alumnos, tarea, temas y preguntas difíciles", async () => {
    const { crearPdfGrupo } = await import("../src/lib/pdfGrupo.js");
    const alumnos = Array.from({ length: 40 }, (_, i) => ({
      apodo: `Alumno ${i}`, xp: i * 10, misiones: i % 6, minijuegos: i % 9, ultima_vez: "2026-11-07T00:00:00Z",
      respuestas: { total: 10, aciertos: i % 10 }, tarea: { hechos: i % 3, total: 2 },
    }));
    const doc = await crearPdfGrupo({
      grupo: { codigo: "ABC234", nombre: "5° B", grado: "primaria" },
      tarea: { juegos: ["memorama"], nota: "Para el viernes", desde: "2026-11-01T00:00:00Z" },
      temas: [{ personaje: "sismo", tema: "El salón se mueve", total: 10, aciertos: 7 }],
      preguntas: [{ personaje: "green", mision: "g1", bono: false, total: 5, fallos: 4, titulo: "La pila traicionera", pregunta: "¿Qué hago con la pila?" }],
      alumnos,
    }, { nombres: { memorama: "Memorama" } });
    expect(doc.getNumberOfPages()).toBeGreaterThan(1);   // 40 alumnos no caben en una hoja
    expect(new TextDecoder().decode(new Uint8Array(doc.output("arraybuffer")).slice(0, 5))).toBe("%PDF-");
  });
});

describe("errores del navegador → registro de Vercel", () => {
  it("solo avisa de lo que es del juego", () => {
    expect(esDelJuego("x is not a function", "https://juego.mx/assets/index.js", "https://juego.mx")).toBe(true);
    expect(esDelJuego("Script error.")).toBe(false);
    expect(esDelJuego("ResizeObserver loop limit exceeded")).toBe(false);
    expect(esDelJuego("falla", "chrome-extension://abc/x.js")).toBe(false);
    expect(esDelJuego("falla", "https://otro-sitio.com/x.js", "https://juego.mx")).toBe(false);
    expect(esDelJuego("")).toBe(false);
  });

  it("no repite el mismo mensaje y manda como máximo " + MAXIMO + " por visita", () => {
    const enviar = vi.fn();
    expect(reportarError(new Error("uno"), { enviar })).toBe(true);
    expect(reportarError(new Error("uno"), { enviar })).toBe(false);
    for (let i = 0; i < 10; i++) reportarError(new Error("otro " + i), { enviar });
    expect(enviar).toHaveBeenCalledTimes(MAXIMO);
    const cuerpo = JSON.parse(enviar.mock.calls[0][0]);
    expect(cuerpo).toMatchObject({ mensaje: "uno", version: expect.stringMatching(/^\d+\.\d+\.\d+$/) });
    expect(Object.keys(cuerpo).sort()).toEqual(["donde", "mensaje", "pila", "version"]);
  });

  it("el servidor recorta, quita la consulta de la página y tapa correos y teléfonos", () => {
    const r = armarReporte({
      mensaje: "Falló al guardar ana.lopez@escuela.mx tel 664 123 4567",
      donde: "/editores?clave=secreta#x",
      pila: "Error: x\n    at f (https://juego.mx/assets/index-abc.js:1:200)",
      version: "2.1.0",
    });
    expect(r.mensaje).toBe("Falló al guardar [correo] tel [número]");
    expect(r.donde).toBe("/editores");
    expect(r.pila).toContain("(/assets/index-abc.js:1:200)");
    expect(r.pila).not.toContain("juego.mx");
    expect(armarReporte({ mensaje: "x", version: "<b>" }).version).toBe("?");
    expect(armarReporte({ mensaje: "   " })).toBeNull();
  });

  it("escribe en el registro con tope por IP y responde 204", async () => {
    reiniciarMemoria();
    const registro = vi.spyOn(console, "error").mockImplementation(() => {});
    const llamar = async (cuerpo, metodo = "POST") => {
      const req = Readable.from([Buffer.from(JSON.stringify(cuerpo))]);
      req.method = metodo;
      req.headers = { "x-forwarded-for": "9.9.9.9" };
      const res = { statusCode: 200, setHeader() {}, end() { return this; } };
      await errorApi(req, res);
      return res.statusCode;
    };
    expect(await llamar({ mensaje: "se rompió" })).toBe(204);
    expect(registro).toHaveBeenCalledWith("[navegador]", expect.stringContaining("se rompió"));
    for (let i = 0; i < 40; i++) await llamar({ mensaje: "otra vez " + i });
    expect(registro).toHaveBeenCalledTimes(30);   // pasado el tope ya no escribe
    expect(await llamar({})).toBe(400);
    expect(await llamar({ mensaje: "x" }, "GET")).toBe(405);
  });
});

describe("el grado y la portada siguen funcionando", () => {
  it("GRADOS no cambió", () => {
    expect(Object.keys(GRADOS)).toEqual(["primaria", "secundaria"]);
  });
});
