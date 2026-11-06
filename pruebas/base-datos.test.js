// @vitest-environment node
/* Grupos, alumnos y progreso en la base de datos (api/alumno.js, api/progreso.js, api/grupo.js).
   Supabase se simula en memoria con lo justo de su API REST, así que no hace falta internet. */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Readable } from "node:stream";
import { randomUUID } from "node:crypto";
import alumnoApi from "../api/alumno.js";
import progresoApi, { calificar } from "../api/progreso.js";
import grupoApi, { resumirRespuestas, resumirEvaluaciones } from "../api/grupo.js";
import evaluacionApi, { hoyEn } from "../api/evaluacion.js";
import encuestaApi from "../api/encuesta.js";
import { resumirEncuestas } from "../api/grupo.js";
import { JUEGOS } from "../src/juegos/registro.js";
import { ESCALA, PREGUNTAS as PREGUNTAS_EVAL, caritaDe } from "../src/data/evaluacion.js";
import { crearPase, leerPase, limpiarApodo } from "../api/_comun.js";
import { reiniciarMemoria } from "../api/_limites.js";
import { mezclarProgreso, limpiarProgreso } from "../src/lib/mezcla.js";
import { PERSONAJES } from "../src/data/personajes.js";

const RETO = PERSONAJES.sismo.misiones.find((m) => m.tipo === "reto" && m.retoSecundaria);
const BUENA = RETO.opciones.find((o) => o.ok).texto;
const MALA = RETO.opciones.find((o) => !o.ok).texto;

/* ---------------- Supabase de mentiras ---------------- */
let tablas;
const UNICOS = { grupos: [["codigo"]], alumnos: [["grupo_id", "apodo_normal"]], progreso: [["alumno_id"]], evaluaciones: [["alumno_id", "fecha"]] };

function filtrar(filas, params) {
  return filas.filter((f) =>
    [...params].every(([k, v]) => ["select", "order", "limit", "on_conflict"].includes(k) || (v.startsWith("eq.") && String(f[k]) === v.slice(3)))
  );
}
function incrustar(tabla, fila, select) {
  const r = { ...fila };
  if (tabla === "alumnos" && select?.includes("grupos(")) r.grupos = tablas.grupos.find((g) => g.id === fila.grupo_id) || null;
  if (tabla === "alumnos" && select?.includes("progreso(")) r.progreso = tablas.progreso.filter((p) => p.alumno_id === fila.id);
  return r;
}
const choca = (tabla, fila, ignorar) =>
  (UNICOS[tabla] || []).some((campos) => tablas[tabla].some((o) => o !== ignorar && campos.every((c) => o[c] === fila[c])));

function supabaseFalso(url, op = {}) {
  const u = new URL(url);
  const tabla = u.pathname.replace("/rest/v1/", "");
  const metodo = op.method || "GET";
  const cuerpo = op.body ? JSON.parse(op.body) : null;
  const prefer = op.headers?.Prefer || "";
  const ok = (datos, status = 200) => ({ ok: true, status, text: async () => (datos === undefined ? "" : JSON.stringify(datos)) });
  const error = (status, code) => ({ ok: false, status, text: async () => JSON.stringify({ code, message: "error " + code }) });
  if (op.headers?.apikey !== "sb_secret_prueba") return error(401, "PGRST301");

  if (metodo === "GET") return ok(filtrar(tablas[tabla], u.searchParams).map((f) => incrustar(tabla, f, u.searchParams.get("select"))));
  if (metodo === "POST") {
    const nuevas = [];
    for (const fila of Array.isArray(cuerpo) ? cuerpo : [cuerpo]) {
      const completa = { id: tabla === "respuestas" ? tablas[tabla].length + 1 : randomUUID(), creado_en: new Date().toISOString(), ultima_vez: new Date().toISOString(), ...fila };
      if (tabla === "progreso") delete completa.id;
      if (tabla === "evaluaciones" || tabla === "encuestas") completa.id = tablas[tabla].length + 1;
      if (choca(tabla, completa)) {
        if (!prefer.includes("merge-duplicates")) return error(409, "23505");
        const vieja = tablas[tabla].find((o) => UNICOS[tabla][0].every((c) => o[c] === completa[c]));
        Object.assign(vieja, fila);
        nuevas.push(vieja);
        continue;
      }
      tablas[tabla].push(completa);
      nuevas.push(completa);
    }
    return ok(prefer.includes("return=representation") ? nuevas : undefined, 201);
  }
  const elegidas = filtrar(tablas[tabla], u.searchParams);
  if (metodo === "PATCH") {
    elegidas.forEach((f) => Object.assign(f, cuerpo));
    return ok(prefer.includes("return=representation") ? elegidas : undefined);
  }
  if (metodo === "DELETE") {
    tablas[tabla] = tablas[tabla].filter((f) => !elegidas.includes(f));
    if (tabla === "alumnos") {
      const ids = elegidas.map((a) => a.id);
      tablas.progreso = tablas.progreso.filter((p) => !ids.includes(p.alumno_id));
      tablas.respuestas = tablas.respuestas.filter((p) => !ids.includes(p.alumno_id));
    }
    return ok(prefer.includes("return=representation") ? elegidas : undefined);
  }
  return error(405, "405");
}

/* ---------------- llamadas ---------------- */
function peticion(cuerpo, { metodo = "POST", ip = "10.0.0.1", pase } = {}) {
  const req = Readable.from(cuerpo === undefined ? [] : [Buffer.from(JSON.stringify(cuerpo))]);
  req.method = metodo;
  req.headers = { "x-forwarded-for": ip, ...(pase ? { authorization: "Bearer " + pase } : {}) };
  return req;
}
function respuesta() {
  const r = { statusCode: 200, cabeceras: {}, cuerpo: "" };
  r.setHeader = (k, v) => { r.cabeceras[k.toLowerCase()] = v; };
  r.end = (c) => { r.cuerpo = c || ""; return r; };
  r.json = () => JSON.parse(r.cuerpo);
  return r;
}
const llamar = async (api, cuerpo, op) => { const res = respuesta(); await api(peticion(cuerpo, op), res); return res; };

const ENV = { SUPABASE_URL: "https://falso.supabase.co", SUPABASE_SECRET_KEY: "sb_secret_prueba", JUEGO_SECRETO: "x".repeat(40) };

beforeEach(() => {
  tablas = { grupos: [], alumnos: [], progreso: [], respuestas: [], evaluaciones: [], encuestas: [] };
  reiniciarMemoria();
  Object.assign(process.env, ENV);
  for (const k of ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "SUPABASE_SERVICE_ROLE_KEY"]) delete process.env[k];
  vi.stubGlobal("fetch", vi.fn(async (url, op) => supabaseFalso(url, op)));
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

async function grupoNuevo(ip = "10.0.0.9") {
  const r = await llamar(grupoApi, { accion: "crear", nombre: "5° B", grado: "secundaria", clave: "maestra123" }, { ip });
  expect(r.statusCode).toBe(200);
  return r.json();
}
const registrar = (codigo, extra = {}, op) =>
  llamar(alumnoApi, { accion: "registrar", codigo, apodo: "Ana", pin: "1234", avatar: "green", ...extra }, op);

/* ---------------- pruebas ---------------- */

describe("combinar el progreso", () => {
  it("se queda con lo mejor de cada copia y nunca baja", () => {
    const a = { xp: 120, records: { sismo: 300, green: 10 }, insignias: ["A"], juegos: { memorama: { record: 50, partidas: 2, mejorPrecision: 80, dificultades: ["facil"] } } };
    const b = { xp: 90, records: { sismo: 100, green: 200 }, insignias: ["B"], grado: "primaria", juegos: { memorama: { record: 70, partidas: 1, mejorPrecision: 60, dificultades: ["medio"] } } };
    const m = mezclarProgreso(a, b);
    expect(m.xp).toBe(120);
    expect(m.records).toEqual({ sismo: 300, green: 200 });
    expect(m.insignias.sort()).toEqual(["A", "B"]);
    expect(m.juegos.memorama).toEqual({ record: 70, partidas: 2, mejorPrecision: 80, dificultades: ["facil", "medio"] });
    expect(m.grado).toBe("primaria");
  });
  it("tira lo que no es del juego (números raros, llaves extrañas, textos larguísimos)", () => {
    const l = limpiarProgreso({ xp: -5, escudos: "9e99", records: { sismo: NaN, hacker: 9 }, juegos: { "<script>": {}, ok: { record: 3 } }, insignias: ["x".repeat(500), 7, "Bien"], admin: true });
    expect(l.xp).toBe(0);
    expect(l.escudos).toBe(10_000_000);
    expect(l.records).toEqual({ sismo: 0, green: 0 });
    expect(Object.keys(l.juegos)).toEqual(["ok"]);
    expect(l.insignias).toEqual(["Bien"]);
    expect(l).not.toHaveProperty("admin");
  });
});

describe("pases firmados", () => {
  it("un pase alterado, vencido o sin secreto no sirve", () => {
    const pase = crearPase({ rol: "alumno", a: "1", g: "2" });
    expect(leerPase(pase)).toMatchObject({ rol: "alumno", a: "1", g: "2" });
    const [cuerpo, firma] = pase.split(".");
    const otro = Buffer.from(JSON.stringify({ rol: "maestro", g: "2", exp: Date.now() + 1e9 })).toString("base64url");
    expect(leerPase(otro + "." + firma)).toBeNull();
    expect(leerPase(cuerpo + "." + firma.slice(0, -2) + "AA")).toBeNull();
    expect(leerPase(pase, { ahora: Date.now() + 400 * 86_400_000 })).toBeNull();
    expect(leerPase(pase, { env: { JUEGO_SECRETO: "corto" } })).toBeNull();
  });
  it("los apodos se comparan sin mayúsculas ni acentos y no aceptan símbolos", () => {
    expect(limpiarApodo("  Ána   López ")).toEqual({ visible: "Ána López", normal: "ana lopez" });
    expect(limpiarApodo("<b>")).toBeNull();
    expect(limpiarApodo("a")).toBeNull();
  });
});

describe("sin base de datos el juego sigue", () => {
  it("avisa que no hay grupos y no intenta conectar", async () => {
    delete process.env.SUPABASE_URL;
    expect((await llamar(alumnoApi, undefined, { metodo: "GET" })).json()).toEqual({ disponible: false });
    expect((await registrar("ABCDEF")).statusCode).toBe(503);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("con todo configurado dice que sí", async () => {
    expect((await llamar(alumnoApi, undefined, { metodo: "GET" })).json()).toEqual({ disponible: true });
  });
});

describe("alumnos", () => {
  it("se une con el código, entra con su PIN y el PIN nunca se guarda tal cual", async () => {
    const { grupo } = await grupoNuevo();
    expect(grupo.codigo).toMatch(/^[A-Z2-9]{6}$/);
    expect(grupo).not.toHaveProperty("id");

    const r = await registrar(grupo.codigo.toLowerCase());
    expect(r.statusCode).toBe(200);
    const d = r.json();
    expect(d.alumno).toMatchObject({ apodo: "Ana", avatar: "green" });
    expect(d.grupo).toEqual({ codigo: grupo.codigo, nombre: "5° B", grado: "secundaria" });
    expect(d.progreso.grado).toBe("secundaria");
    expect(JSON.stringify(tablas)).not.toContain("1234");
    expect(JSON.stringify(tablas)).not.toContain("maestra123");

    const bien = await llamar(alumnoApi, { accion: "entrar", codigo: grupo.codigo, apodo: "ANA", pin: "1234" });
    expect(bien.statusCode).toBe(200);
    const mal = await llamar(alumnoApi, { accion: "entrar", codigo: grupo.codigo, apodo: "ana", pin: "9999" });
    expect(mal.statusCode).toBe(401);
    expect(mal.json().error).toMatch(/Apodo o PIN/);
  });

  it("no deja repetir apodo en el mismo grupo (aunque cambie acentos o mayúsculas)", async () => {
    const { grupo } = await grupoNuevo();
    await registrar(grupo.codigo);
    const otra = await registrar(grupo.codigo, { apodo: "  ÁNA " });
    expect(otra.statusCode).toBe(409);
  });

  it("un código que no existe o datos mal escritos se rechazan con un mensaje claro", async () => {
    expect((await registrar("ZZZZZZ")).statusCode).toBe(404);
    expect((await registrar("ABC")).statusCode).toBe(400);
    expect((await registrar("ABCDEF", { pin: "12a4" })).statusCode).toBe(400);
  });

  it("adivinar el PIN a lo bruto se frena a los 10 intentos", async () => {
    const { grupo } = await grupoNuevo();
    await registrar(grupo.codigo, {}, { ip: "1.1.1.1" });
    let ultimo;
    for (let i = 0; i < 11; i++) {
      ultimo = await llamar(alumnoApi, { accion: "entrar", codigo: grupo.codigo, apodo: "Ana", pin: String(1000 + i) }, { ip: `2.2.2.${i}` });
    }
    expect(ultimo.statusCode).toBe(429);
  });
});

describe("progreso en la base de datos", () => {
  it("combina en el servidor: un equipo con datos viejos no borra lo ganado", async () => {
    const { grupo } = await grupoNuevo();
    const { pase } = (await registrar(grupo.codigo)).json();
    const p1 = await llamar(progresoApi, { progreso: { xp: 300, records: { sismo: 250 } } }, { metodo: "PUT", pase });
    expect(p1.statusCode).toBe(200);
    const p2 = await llamar(progresoApi, { progreso: { xp: 40, records: { green: 90 } } }, { metodo: "PUT", pase });
    expect(p2.json().progreso).toMatchObject({ xp: 300, records: { sismo: 250, green: 90 } });
    const leido = await llamar(progresoApi, undefined, { metodo: "GET", pase });
    expect(leido.json().progreso.xp).toBe(300);
    expect(leido.json().alumno.apodo).toBe("Ana");
  });

  it("si la respuesta es correcta lo decide el servidor; lo inventado se ignora", async () => {
    const { grupo } = await grupoNuevo();
    const { pase } = (await registrar(grupo.codigo)).json();
    const base = { personaje: "sismo", grado: "secundaria", mision: RETO.id };
    const r = await llamar(progresoApi, {
      respuestas: [
        { ...base, eleccion: BUENA },
        { ...base, eleccion: MALA, correcta: true },
        { ...base, eleccion: null },
        { ...base, eleccion: "opción inventada" },
        { ...base, mision: "zz9", eleccion: BUENA },
      ],
    }, { metodo: "PUT", pase });
    expect(r.json().guardadas).toBe(3);
    expect(tablas.respuestas.map((f) => [f.correcta, f.sin_tiempo])).toEqual([[true, false], [false, false], [false, true]]);
    expect(calificar({ ...base, bono: true, grado: "primaria", eleccion: BUENA })).toBeNull();
  });

  it("sin pase, o con uno de maestro, no se puede leer ni escribir", async () => {
    const { pase: paseMaestro } = await grupoNuevo();
    expect((await llamar(progresoApi, undefined, { metodo: "GET" })).statusCode).toBe(401);
    expect((await llamar(progresoApi, undefined, { metodo: "GET", pase: paseMaestro })).statusCode).toBe(401);
  });
});

describe("panel del maestro", () => {
  it("ve a sus alumnos, sus aciertos y las preguntas que más cuestan", async () => {
    const { grupo, pase } = await grupoNuevo();
    const { pase: paseAna } = (await registrar(grupo.codigo)).json();
    await llamar(progresoApi, {
      progreso: { xp: 150, records: { sismo: 230 }, insignias: [RETO.titulo] },
      respuestas: [1, 2, 3].map(() => ({ personaje: "sismo", grado: "secundaria", mision: RETO.id, eleccion: MALA })),
    }, { metodo: "PUT", pase: paseAna });

    const r = await llamar(grupoApi, undefined, { metodo: "GET", pase });
    expect(r.statusCode).toBe(200);
    const d = r.json();
    expect(d.grupo.codigo).toBe(grupo.codigo);
    expect(d.alumnos).toHaveLength(1);
    expect(d.alumnos[0]).toMatchObject({ apodo: "Ana", xp: 150, mejor: 230, misiones: 1, respuestas: { total: 3, aciertos: 0 } });
    expect(d.alumnos[0]).not.toHaveProperty("pin");
    expect(d.preguntas[0]).toMatchObject({ mision: RETO.id, titulo: RETO.titulo, total: 3, fallos: 3 });
  });

  it("entra con código y clave; con clave mala no", async () => {
    const { grupo } = await grupoNuevo();
    expect((await llamar(grupoApi, { accion: "entrar", codigo: grupo.codigo, clave: "maestra123" })).statusCode).toBe(200);
    expect((await llamar(grupoApi, { accion: "entrar", codigo: grupo.codigo, clave: "otra-clave" })).statusCode).toBe(401);
  });

  it("pone un PIN nuevo y quita alumnos, pero solo de su propio grupo", async () => {
    const mio = await grupoNuevo("3.3.3.3");
    const ajeno = await grupoNuevo("4.4.4.4");
    const { alumno, pase: paseAna } = (await registrar(mio.grupo.codigo)).json();

    expect((await llamar(grupoApi, { accion: "quitar", alumno: alumno.id }, { pase: ajeno.pase })).statusCode).toBe(404);
    expect((await llamar(grupoApi, { accion: "pin", alumno: alumno.id, pin: "4321" }, { pase: ajeno.pase })).statusCode).toBe(404);

    expect((await llamar(grupoApi, { accion: "pin", alumno: alumno.id, pin: "4321" }, { pase: mio.pase })).statusCode).toBe(200);
    expect((await llamar(alumnoApi, { accion: "entrar", codigo: mio.grupo.codigo, apodo: "Ana", pin: "4321" })).statusCode).toBe(200);

    expect((await llamar(grupoApi, { accion: "quitar", alumno: alumno.id }, { pase: mio.pase })).statusCode).toBe(200);
    expect((await llamar(progresoApi, undefined, { metodo: "GET", pase: paseAna })).statusCode).toBe(401);
  });

  it("un alumno no puede abrir el panel ni usar acciones de maestro", async () => {
    const { grupo } = await grupoNuevo();
    const { alumno, pase } = (await registrar(grupo.codigo)).json();
    expect((await llamar(grupoApi, undefined, { metodo: "GET", pase })).statusCode).toBe(401);
    expect((await llamar(grupoApi, { accion: "quitar", alumno: alumno.id }, { pase })).statusCode).toBe(401);
  });

  it("ordena las preguntas de la que más se falla a la que menos", () => {
    const filas = [
      ...Array(4).fill({ alumno_id: "a", personaje: "sismo", mision: "s1", bono: false, correcta: true }),
      ...Array(2).fill({ alumno_id: "a", personaje: "sismo", mision: "s3", bono: false, correcta: false }),
    ];
    const { preguntas, porAlumno } = resumirRespuestas(filas);
    expect(preguntas.map((q) => q.mision)).toEqual(["s3", "s1"]);
    expect(porAlumno.a).toEqual({ total: 6, aciertos: 4 });
  });
});

describe("los alumnos evalúan al maestro con caritas", () => {
  const CARITAS = { explica: 5, divierte: 4, aprendo: 2 };

  it("la escala va de 😡 rojo a 😄 verde y cada pregunta tiene su carita", () => {
    expect(ESCALA.map((c) => c.emoji)).toEqual(["😡", "🙁", "😐", "🙂", "😄"]);
    expect(ESCALA[0].color).toMatch(/^#d/);          // rojo
    expect(ESCALA[4].color).toBe("#2c9c48");          // verde
    expect(caritaDe(4.4).emoji).toBe("🙂");
    expect(caritaDe(1.2).emoji).toBe("😡");
    expect(PREGUNTAS_EVAL).toHaveLength(3);
  });

  it("guarda una por día: si la repite, se actualiza", async () => {
    const { grupo } = await grupoNuevo();
    const { pase } = (await registrar(grupo.codigo)).json();
    expect((await llamar(evaluacionApi, CARITAS, { pase })).statusCode).toBe(200);
    expect((await llamar(evaluacionApi, { ...CARITAS, aprendo: 5 }, { pase })).statusCode).toBe(200);
    expect(tablas.evaluaciones).toHaveLength(1);
    expect(tablas.evaluaciones[0]).toMatchObject({ aprendo: 5, fecha: hoyEn() });
    const hoy = await llamar(evaluacionApi, undefined, { metodo: "GET", pase });
    expect(hoy.json().hoy).toEqual({ ...CARITAS, aprendo: 5 });
  });

  it("rechaza caritas que no existen y a quien no es alumno", async () => {
    const { grupo, pase: paseMaestro } = await grupoNuevo();
    const { pase } = (await registrar(grupo.codigo)).json();
    expect((await llamar(evaluacionApi, { ...CARITAS, explica: 9 }, { pase })).statusCode).toBe(400);
    expect((await llamar(evaluacionApi, { explica: 5 }, { pase })).statusCode).toBe(400);
    expect((await llamar(evaluacionApi, CARITAS)).statusCode).toBe(401);
    expect((await llamar(evaluacionApi, CARITAS, { pase: paseMaestro })).statusCode).toBe(401);
    expect(tablas.evaluaciones).toHaveLength(0);
  });

  it("el maestro ve promedios solo con 3 o más evaluaciones, y nunca quién votó", async () => {
    const { grupo, pase } = await grupoNuevo();
    const alumnos = [];
    for (const [i, apodo] of ["Ana", "Beto", "Caro"].entries()) {
      alumnos.push((await registrar(grupo.codigo, { apodo }, { ip: `5.5.5.${i}` })).json().pase);
    }
    await llamar(evaluacionApi, { explica: 5, divierte: 5, aprendo: 1 }, { pase: alumnos[0] });
    await llamar(evaluacionApi, { explica: 4, divierte: 3, aprendo: 1 }, { pase: alumnos[1] });

    let ev = (await llamar(grupoApi, undefined, { metodo: "GET", pase })).json().evaluacion;
    expect(ev).toMatchObject({ total: 2, suficientes: false, preguntas: [] });

    await llamar(evaluacionApi, { explica: 3, divierte: 4, aprendo: 2 }, { pase: alumnos[2] });
    const panel = (await llamar(grupoApi, undefined, { metodo: "GET", pase })).json();
    ev = panel.evaluacion;
    expect(ev.suficientes).toBe(true);
    expect(ev.preguntas.find((p) => p.id === "explica")).toMatchObject({ promedio: 4, conteo: [0, 0, 1, 1, 1] });
    expect(ev.preguntas.find((p) => p.id === "aprendo")).toMatchObject({ promedio: 1.3, conteo: [2, 1, 0, 0, 0] });
    expect(JSON.stringify(ev)).not.toMatch(/alumno/);
  });

  it("cuenta las de la semana", () => {
    const filas = [{ fecha: "2026-11-06", explica: 5, divierte: 5, aprendo: 5 }, { fecha: "2026-11-01", explica: 1, divierte: 1, aprendo: 1 }, { fecha: "2026-10-01", explica: 3, divierte: 3, aprendo: 3 }];
    const r = resumirEvaluaciones(filas, { hoy: "2026-11-06" });
    expect(r).toMatchObject({ total: 3, semana: 2, suficientes: true });
    expect(r.preguntas[0].promedio).toBe(3);
  });
});

describe("encuestas de satisfacción de los juegos", () => {
  const OPINION = { juego: "memorama", tipo: "minijuego", gusto: 5, dificultad: 2, grado: "primaria" };

  it("todos los juegos del catálogo tienen un id que la encuesta acepta", () => {
    const malos = JUEGOS.filter((j) => !/^[a-z0-9-]{1,40}$/.test(j.id)).map((j) => j.id);
    expect(malos).toEqual([]);
  });

  it("se puede contestar sin cuenta (no se liga a ningún grupo)", async () => {
    const r = await llamar(encuestaApi, OPINION);
    expect(r.statusCode).toBe(200);
    expect(tablas.encuestas[0]).toMatchObject({ juego: "memorama", gusto: 5, dificultad: 2, grupo_id: null, alumno_id: null });
  });

  it("con el pase del alumno cuenta para su grupo", async () => {
    const { grupo } = await grupoNuevo();
    const { pase } = (await registrar(grupo.codigo)).json();
    await llamar(encuestaApi, OPINION, { pase });
    expect(tablas.encuestas[0].grupo_id).toBe(tablas.grupos[0].id);
  });

  it("rechaza respuestas fuera de escala o juegos con nombres raros", async () => {
    for (const malo of [
      { ...OPINION, gusto: 6 },
      { ...OPINION, dificultad: 0 },
      { ...OPINION, juego: "<script>" },
      { ...OPINION, tipo: "otro" },
      { ...OPINION, tipo: "mision", juego: "mision-hacker" },
    ]) {
      expect((await llamar(encuestaApi, malo)).statusCode).toBe(400);
    }
    expect((await llamar(encuestaApi, { ...OPINION, tipo: "mision", juego: "mision-sismo" })).statusCode).toBe(200);
    expect(tablas.encuestas).toHaveLength(1);
  });

  it("frena el spam: 40 por hora por IP", async () => {
    let ultimo;
    for (let i = 0; i < 41; i++) ultimo = await llamar(encuestaApi, OPINION, { ip: "8.8.8.8" });
    expect(ultimo.statusCode).toBe(429);
    expect(tablas.encuestas).toHaveLength(40);
  });

  it("el maestro ve por juego el promedio y la dificultad, ordenados del favorito al que menos", async () => {
    const { grupo, pase } = await grupoNuevo();
    const { pase: paseAna } = (await registrar(grupo.codigo)).json();
    await llamar(encuestaApi, { ...OPINION, gusto: 2, dificultad: 3 }, { pase: paseAna });
    await llamar(encuestaApi, { ...OPINION, juego: "sopa-letras", gusto: 5, dificultad: 1 }, { pase: paseAna });
    await llamar(encuestaApi, { ...OPINION, gusto: 4, dificultad: 3 }, { pase: paseAna });
    await llamar(encuestaApi, { ...OPINION, gusto: 1 });   // sin cuenta: no es de su grupo
    const { encuestas } = (await llamar(grupoApi, undefined, { metodo: "GET", pase })).json();
    expect(encuestas.map((e) => e.juego)).toEqual(["sopa-letras", "memorama"]);
    expect(encuestas[1]).toMatchObject({ total: 2, promedio: 3, dificultad: [0, 0, 2] });
    expect(JSON.stringify(encuestas)).not.toMatch(/alumno/);
  });

  it("resume por juego", () => {
    const r = resumirEncuestas([{ juego: "a", tipo: "minijuego", gusto: 4, dificultad: 2 }, { juego: "a", tipo: "minijuego", gusto: 5, dificultad: 1 }]);
    expect(r).toEqual([{ juego: "a", tipo: "minijuego", total: 2, promedio: 4.5, dificultad: [1, 1, 0] }]);
  });
});

describe("encuestas sin llave secreta (solo con la publicable)", () => {
  it("usan la función registrar_encuesta con la llave de la API derivada de JUEGO_SECRETO", async () => {
    const { llaveApi } = await import("../api/_db.js");
    delete process.env.SUPABASE_SECRET_KEY;
    process.env.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_prueba";
    const llamadas = [];
    vi.stubGlobal("fetch", vi.fn(async (url, op) => {
      llamadas.push({ url, op, cuerpo: JSON.parse(op.body) });
      return { ok: true, status: 200, text: async () => "true" };
    }));
    expect((await llamar(encuestaApi, undefined, { metodo: "GET" })).json()).toEqual({ disponible: true });
    const pase = crearPase({ rol: "alumno", a: "11111111-1111-1111-1111-111111111111", g: "22222222-2222-2222-2222-222222222222" });
    const r = await llamar(encuestaApi, { juego: "memorama", tipo: "minijuego", gusto: 4, dificultad: 1, grado: "primaria" }, { pase });
    expect(r.statusCode).toBe(200);
    expect(llamadas[0].url).toBe("https://falso.supabase.co/rest/v1/rpc/registrar_encuesta");
    expect(llamadas[0].op.headers.apikey).toBe("sb_publishable_prueba");
    expect(llamadas[0].cuerpo).toMatchObject({
      p_llave: llaveApi(ENV.JUEGO_SECRETO), p_juego: "memorama", p_gusto: 4, p_dificultad: 1,
      p_alumno: "11111111-1111-1111-1111-111111111111", p_grupo: "22222222-2222-2222-2222-222222222222",
    });
    expect(llamadas[0].cuerpo.p_llave).not.toContain(ENV.JUEGO_SECRETO);
    delete process.env.SUPABASE_PUBLISHABLE_KEY;
  });
});

describe("ventana de editores", () => {
  const CLAVE = "clave-de-editores-123";
  async function entrarEditor() {
    process.env.EDITORES_CLAVE = CLAVE;
    const { default: editoresApi } = await import("../api/editores.js");
    const r = await llamar(editoresApi, { clave: CLAVE });
    return { editoresApi, pase: r.json().pase, r };
  }
  afterEach(() => { delete process.env.EDITORES_CLAVE; });

  it("pide la clave de editores; con la mala no entra", async () => {
    const { editoresApi, r } = await entrarEditor();
    expect(r.statusCode).toBe(200);
    expect((await llamar(editoresApi, { clave: "otra" })).statusCode).toBe(401);
    expect((await llamar(editoresApi, undefined, { metodo: "GET" })).statusCode).toBe(401);
  });

  it("un pase de alumno o de maestro no abre los resultados", async () => {
    const { editoresApi } = await entrarEditor();
    const { grupo, pase: paseMaestro } = await grupoNuevo();
    const { pase: paseAlumno } = (await registrar(grupo.codigo)).json();
    for (const pase of [paseMaestro, paseAlumno]) {
      expect((await llamar(editoresApi, undefined, { metodo: "GET", pase })).statusCode).toBe(401);
    }
  });

  it("entrega los resultados agrupados por juego, día, carita y dificultad, sin decir quién contestó", async () => {
    const { editoresApi, pase } = await entrarEditor();
    const { grupo } = await grupoNuevo();
    const { pase: paseAna } = (await registrar(grupo.codigo)).json();
    const OP = { juego: "memorama", tipo: "minijuego", gusto: 5, dificultad: 2, grado: "primaria" };
    await llamar(encuestaApi, OP, { pase: paseAna });
    await llamar(encuestaApi, OP);
    await llamar(encuestaApi, { ...OP, gusto: 1 });
    const r = await llamar(editoresApi, undefined, { metodo: "GET", pase });
    expect(r.statusCode).toBe(200);
    const filas = r.json().filas;
    expect(filas.find((f) => f.gusto === 5)).toMatchObject({ juego: "memorama", dificultad: 2, respuestas: 2 });
    expect(filas.find((f) => f.gusto === 1).respuestas).toBe(1);
    expect(JSON.stringify(filas)).not.toMatch(/alumno|grupo/);
  });
});

describe("resumen para las gráficas", () => {
  it("ordena del favorito al que menos, filtra por grado y aparta lo que no es del catálogo", async () => {
    const { resumir, rellenarDias } = await import("../src/lib/resultados.js");
    const filas = [
      { juego: "memorama", tipo: "minijuego", grado: "primaria", dia: "2026-11-01", gusto: 2, dificultad: 3, respuestas: 4 },
      { juego: "mision-sismo", tipo: "mision", grado: "secundaria", dia: "2026-11-03", gusto: 5, dificultad: 2, respuestas: 2 },
      { juego: "prueba-claude", tipo: "minijuego", grado: "primaria", dia: "2026-11-03", gusto: 4, dificultad: 2, respuestas: 1 },
    ];
    const r = resumir(filas);
    expect(r.juegos.map((j) => j.nombre)).toEqual(["Misiones de Sismo Tecnito", expect.any(String)]);
    expect(r.general).toMatchObject({ total: 6, gusto: [0, 4, 0, 0, 2], dificultad: [0, 2, 4] });
    expect(r.fueraDeCatalogo).toBe(1);
    expect(resumir(filas, { grado: "primaria" }).juegos).toHaveLength(1);
    expect(rellenarDias(r.dias).map((d) => d.total)).toEqual([4, 0, 2]);
  });
});
