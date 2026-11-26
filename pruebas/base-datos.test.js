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
let cuentasAuth = [];   // Supabase Auth: { email, password, confirmado, rol }
let correosAuth = [];   // los correos que Supabase «mandó»
const UNICOS = { grupos: [["codigo"]], alumnos: [["grupo_id", "apodo_normal"]], progreso: [["alumno_id"]], evaluaciones: [["alumno_id", "fecha"]], tareas: [["grupo_id"]] };

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
  if (u.pathname.startsWith("/auth/v1/")) {
    // Supabase Auth de mentira: cuentas { email, password, confirmado, rol }, correos mandados y tokens
    const json = (status, cuerpo) => ({ ok: status < 300, status, json: async () => cuerpo, text: async () => JSON.stringify(cuerpo) });
    if (op.headers?.apikey !== "sb_secret_prueba") return json(401, { message: "Invalid API key" });
    const cuerpo = op.body ? JSON.parse(op.body) : {};
    const ruta = u.pathname.replace("/auth/v1/", "");
    if (ruta === "token") {
      const c = cuentasAuth.find((x) => x.email === cuerpo.email && x.password === cuerpo.password);
      if (!c) return json(400, { error_code: "invalid_credentials", msg: "Invalid login credentials" });
      if (!c.confirmado) return json(400, { error_code: "email_not_confirmed", msg: "Email not confirmed" });
      return json(200, { access_token: "token-de-" + c.email, user: { id: c.id, email: c.email, email_confirmed_at: "2026-11-15T00:00:00Z", app_metadata: c.rol ? { rol: c.rol } : {} } });
    }
    if (ruta === "signup") {
      if (cuerpo.password.length < 8) return json(422, { error_code: "weak_password" });
      correosAuth.push({ tipo: "confirmar", email: cuerpo.email, regreso: u.searchParams.get("redirect_to") });
      if (!cuentasAuth.some((x) => x.email === cuerpo.email)) cuentasAuth.push({ email: cuerpo.email, password: cuerpo.password, confirmado: false });
      return json(200, { id: "nuevo", email: cuerpo.email });
    }
    if (ruta === "recover") {
      if (cuentasAuth.some((x) => x.email === cuerpo.email)) correosAuth.push({ tipo: "recuperar", email: cuerpo.email, regreso: u.searchParams.get("redirect_to") });
      return json(200, {});
    }
    if (ruta === "user" && op.method === "PUT") {
      const token = String(op.headers?.Authorization || "").replace("Bearer ", "");
      const c = cuentasAuth.find((x) => "token-de-" + x.email === token);
      if (!c) return json(401, { error_code: "bad_jwt" });
      if (c.password === cuerpo.password) return json(422, { error_code: "same_password" });
      c.password = cuerpo.password;
      return json(200, { email: c.email });
    }
    return json(404, {});
  }
  if (u.pathname.startsWith("/rest/v1/rpc/admin_")) return funcionesAdminFalsas(u.pathname.replace("/rest/v1/rpc/", ""), op);
  const tabla = u.pathname.replace("/rest/v1/", "");
  const metodo = op.method || "GET";
  const cuerpo = op.body ? JSON.parse(op.body) : null;
  const prefer = op.headers?.Prefer || "";
  const ok = (datos, status = 200) => ({ ok: true, status, text: async () => (datos === undefined ? "" : JSON.stringify(datos)) });
  const error = (status, code) => ({ ok: false, status, text: async () => JSON.stringify({ code, message: "error " + code }) });
  if (op.headers?.apikey !== "sb_secret_prueba") return error(401, "PGRST301");
  if (!(tabla in tablas)) return error(404, "PGRST205");   // como Supabase: la tabla no existe

  if (metodo === "GET") return ok(filtrar(tablas[tabla], u.searchParams).map((f) => incrustar(tabla, f, u.searchParams.get("select"))));
  if (metodo === "POST") {
    const nuevas = [];
    for (const fila of Array.isArray(cuerpo) ? cuerpo : [cuerpo]) {
      const completa = { id: tabla === "respuestas" ? tablas[tabla].length + 1 : randomUUID(), creado_en: new Date().toISOString(), ultima_vez: new Date().toISOString(), ...fila };
      if (tabla === "progreso" || tabla === "tareas") delete completa.id;
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

/* Las funciones public.admin_* (supabase/migrations/20261126000000_cuentas_admin.sql), de mentiras */
async function funcionesAdminFalsas(nombre, op) {
  const { llaveApi } = await import("../api/_db.js");
  const res = (status, datos) => ({ ok: status < 300, status, text: async () => (datos === undefined ? "" : JSON.stringify(datos)) });
  const falla = (code) => res(code === "42501" ? 403 : 400, { code, message: "error " + code });
  if (op.headers?.apikey !== "sb_secret_prueba") return falla("42501");
  const a = JSON.parse(op.body);
  if (a.p_llave !== llaveApi(ENV.JUEGO_SECRETO)) return falla("42501");
  if (!cuentasAuth.some((c) => c.id === a.p_quien && c.rol === "superusuario" && c.confirmado)) return falla("42501");
  const cuenta = cuentasAuth.find((c) => c.id === a.p_id);
  if (nombre === "admin_cuentas") {
    return res(200, cuentasAuth.map((c) => ({ id: c.id, correo: c.email, confirmado: !!c.confirmado, rol: c.rol || null, creado_en: null, ultimo_acceso: null })));
  }
  if (nombre === "admin_crear_cuenta") {
    if (a.p_contrasena.length < 8 || !["admin", "superusuario"].includes(a.p_rol)) return falla("22023");
    if (cuentasAuth.some((c) => c.email === a.p_correo)) return falla("23505");
    const id = randomUUID();
    cuentasAuth.push({ id, email: a.p_correo, password: a.p_contrasena, confirmado: true, rol: a.p_rol });
    return res(200, id);
  }
  if (a.p_id === a.p_quien) return falla("22023");
  if (!cuenta) return falla("P0002");
  if (nombre === "admin_cambiar_rol") {
    cuenta.rol = a.p_rol === "ninguno" ? undefined : a.p_rol;
    return res(200, null);
  }
  if (nombre === "admin_poner_contrasena") {
    cuenta.password = a.p_contrasena;
    return res(200, null);
  }
  return res(404, { code: "PGRST202" });
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
  tablas = { grupos: [], alumnos: [], progreso: [], respuestas: [], evaluaciones: [], encuestas: [], tareas: [], opiniones: [] };
  cuentasAuth = [];
  correosAuth = [];
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
    // se cambia el último carácter por otro que seguro es distinto (antes se ponía «AA» y, si la
    // firma ya terminaba así, no se alteraba nada: fallaba ~1 de cada 1,000 corridas)
    const alterada = firma.slice(0, -1) + (firma.at(-1) === "A" ? "B" : "A");
    expect(alterada).not.toBe(firma);
    expect(leerPase(cuerpo + "." + alterada)).toBeNull();
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
    expect(d.grupo).toEqual({ codigo: grupo.codigo, nombre: "5° B", grado: "secundaria", tarea: null });
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

  it("un salón entero detrás de la misma IP puede registrarse y entrar", async () => {
    const { grupo } = await grupoNuevo();
    const ip = "200.1.1.1";
    for (let i = 0; i < 35; i++) {
      const r = await registrar(grupo.codigo, { apodo: `Niño ${i}` }, { ip });
      expect(r.statusCode, `registro ${i}`).toBe(200);
    }
    for (let i = 0; i < 35; i++) {
      const r = await llamar(alumnoApi, { accion: "entrar", codigo: grupo.codigo, apodo: `Niño ${i}`, pin: "1234" }, { ip });
      expect(r.statusCode, `entrada ${i}`).toBe(200);
    }
  }, 30_000);   // 70 PIN con scrypt: es lento a propósito

  it("desde una IP, 20 intentos fallidos frenan a quien adivina aunque cambie de apodo", async () => {
    const { grupo } = await grupoNuevo();
    for (let i = 0; i < 25; i++) await registrar(grupo.codigo, { apodo: `Alumno ${i}` }, { ip: "1.1.1.1" });
    const ip = "66.6.6.6";
    for (let i = 0; i < 20; i++) {
      const r = await llamar(alumnoApi, { accion: "entrar", codigo: grupo.codigo, apodo: `Alumno ${i}`, pin: "9999" }, { ip });
      expect(r.statusCode).toBe(401);
    }
    // el siguiente ya no se revisa, aunque traiga el PIN bueno
    const bloqueado = await llamar(alumnoApi, { accion: "entrar", codigo: grupo.codigo, apodo: "Alumno 21", pin: "1234" }, { ip });
    expect(bloqueado.statusCode).toBe(429);
    // otra IP (otro salón) sigue entrando
    const otro = await llamar(alumnoApi, { accion: "entrar", codigo: grupo.codigo, apodo: "Alumno 21", pin: "1234" }, { ip: "77.7.7.7" });
    expect(otro.statusCode).toBe(200);
  }, 30_000);   // 45 PIN con scrypt: es lento a propósito

  it("probar códigos de grupo al azar también cuenta como fallo", async () => {
    const ip = "88.8.8.8";
    for (let i = 0; i < 20; i++) expect((await registrar("ZZZZZZ", { apodo: `Prueba ${i}` }, { ip })).statusCode).toBe(404);
    expect((await registrar("ZZZZZZ", { apodo: "Otra" }, { ip })).statusCode).toBe(429);
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

  it("los días empiezan a la medianoche de Tijuana, también en horario de verano", async () => {
    const { inicioDelDia } = await import("../api/editores.js");
    expect(inicioDelDia("2026-01-15")).toBe("2026-01-15T08:00:00.000Z");   // invierno, UTC-8
    expect(inicioDelDia("2026-07-15")).toBe("2026-07-15T07:00:00.000Z");   // verano, UTC-7
    expect(inicioDelDia("2026-07-15", "America/Tijuana", { siguiente: true })).toBe("2026-07-16T07:00:00.000Z");
    // los días del cambio de horario (8 de marzo y 1 de noviembre de 2026)
    expect(inicioDelDia("2026-03-08")).toBe("2026-03-08T08:00:00.000Z");
    expect(inicioDelDia("2026-03-09")).toBe("2026-03-09T07:00:00.000Z");
    expect(inicioDelDia("2026-11-01")).toBe("2026-11-01T07:00:00.000Z");
    expect(inicioDelDia("2026-11-02")).toBe("2026-11-02T08:00:00.000Z");
    expect(inicioDelDia("2026-07-15", "America/Mexico_City")).toBe("2026-07-15T06:00:00.000Z");
  });

  it("al filtrar por fechas pide a la base el periodo completo en hora local", async () => {
    const { editoresApi, pase } = await entrarEditor();
    fetch.mockClear();
    const req = peticion(undefined, { metodo: "GET", pase });
    req.url = "/api/editores?desde=2026-07-01&hasta=2026-07-31";
    const res = respuesta();
    await editoresApi(req, res);
    expect(res.statusCode).toBe(200);
    const url = decodeURIComponent(fetch.mock.calls.map((c) => c[0]).find((u) => u.includes("/encuestas?")));
    expect(url).toContain("creado_en=gte.2026-07-01T07:00:00.000Z");
    expect(url).toContain("creado_en=lt.2026-08-01T07:00:00.000Z");
  });
});

describe("resumen para las gráficas", () => {
  it("ordena del favorito al que menos, filtra por grado y aparta lo que no es del catálogo", async () => {
    const { resumir, rellenarDias } = await import("../src/lib/resultados.js");
    const filas = [
      { juego: "memorama", tipo: "minijuego", grado: "primaria", dia: "2026-11-01", gusto: 2, dificultad: 3, respuestas: 4 },
      { juego: "mision-sismo", tipo: "mision", grado: "secundaria", dia: "2026-11-03", gusto: 5, dificultad: 2, respuestas: 2 },
      { juego: "prueba-fuera", tipo: "minijuego", grado: "primaria", dia: "2026-11-03", gusto: 4, dificultad: 2, respuestas: 1 },
    ];
    const r = resumir(filas);
    expect(r.juegos.map((j) => j.nombre)).toEqual(["Misiones de Sismotecnito", expect.any(String)]);
    expect(r.general).toMatchObject({ total: 6, gusto: [0, 4, 0, 0, 2], dificultad: [0, 2, 4] });
    expect(r.fueraDeCatalogo).toBe(1);
    expect(resumir(filas, { grado: "primaria" }).juegos).toHaveLength(1);
    expect(rellenarDias(r.dias).map((d) => d.total)).toEqual([4, 0, 2]);
  });
});

describe("tarea del maestro y avance por tema", () => {
  const RETO_VAR = PERSONAJES.sismo.misiones.find((m) => m.id === "s1").variantes[0];
  const BUENA_VAR = RETO_VAR.opciones.find((o) => o.ok).texto;

  it("el maestro pone una tarea, el alumno la ve y cuenta cuando juega después", async () => {
    const { grupo, pase } = await grupoNuevo();
    const { pase: paseAna } = (await registrar(grupo.codigo)).json();
    const puesta = await llamar(grupoApi, { accion: "tarea", juegos: ["clasifica-basura", "energia-solar"], nota: "  Para   el viernes " }, { pase });
    expect(puesta.statusCode).toBe(200);
    expect(puesta.json().tarea).toMatchObject({ juegos: ["clasifica-basura", "energia-solar"], nota: "Para el viernes" });
    const desde = puesta.json().tarea.desde;

    // el alumno la recibe con los datos de su grupo
    const leido = await llamar(progresoApi, undefined, { metodo: "GET", pase: paseAna });
    expect(leido.json().grupo.tarea).toMatchObject({ juegos: ["clasifica-basura", "energia-solar"], desde });

    // jugó uno antes de la tarea (no cuenta) y otro después (sí cuenta)
    const antes = new Date(Date.parse(desde) - 60_000).toISOString();
    const despues = new Date(Date.parse(desde) + 60_000).toISOString();
    await llamar(progresoApi, { progreso: { juegos: {
      "clasifica-basura": { record: 10, partidas: 1, jugadoEn: antes },
      "energia-solar": { record: 20, partidas: 1, jugadoEn: despues },
    } } }, { metodo: "PUT", pase: paseAna });
    const panel = (await llamar(grupoApi, undefined, { metodo: "GET", pase })).json();
    expect(panel.tarea.juegos).toHaveLength(2);
    expect(panel.alumnos[0].tarea).toEqual({ hechos: 1, total: 2 });

    // al quitarla, ya no aparece
    expect((await llamar(grupoApi, { accion: "quitarTarea" }, { pase })).statusCode).toBe(200);
    expect((await llamar(grupoApi, undefined, { metodo: "GET", pase })).json().tarea).toBeNull();
  });

  it("valida la tarea, y solo el maestro de ese grupo la cambia", async () => {
    const { grupo, pase } = await grupoNuevo();
    const { pase: paseAna } = (await registrar(grupo.codigo)).json();
    const seis = ["a", "b", "c", "d", "e", "f"];
    expect((await llamar(grupoApi, { accion: "tarea", juegos: seis }, { pase })).statusCode).toBe(400);
    expect((await llamar(grupoApi, { accion: "tarea", juegos: [] }, { pase })).statusCode).toBe(400);
    expect((await llamar(grupoApi, { accion: "tarea", juegos: ["<script>"] }, { pase })).statusCode).toBe(400);
    expect((await llamar(grupoApi, { accion: "tarea", juegos: ["memorama"], nota: "x".repeat(141) }, { pase })).statusCode).toBe(400);
    expect((await llamar(grupoApi, { accion: "tarea", juegos: ["memorama"] }, { pase: paseAna })).statusCode).toBe(401);
    expect((await llamar(grupoApi, { accion: "tarea", juegos: ["memorama"] })).statusCode).toBe(401);
    expect(tablas.tareas).toHaveLength(0);
  });

  it("si la tabla de tareas todavía no existe, el panel sigue y poner una tarea avisa", async () => {
    delete tablas.tareas;
    const { grupo, pase } = await grupoNuevo();
    await registrar(grupo.codigo);
    const panel = await llamar(grupoApi, undefined, { metodo: "GET", pase });
    expect(panel.statusCode).toBe(200);
    expect(panel.json().tarea).toBeNull();
    const r = await llamar(grupoApi, { accion: "tarea", juegos: ["memorama"] }, { pase });
    expect(r.statusCode).toBe(503);
    expect(r.json().error).toMatch(/todavía no están activadas/);
  });

  it("califica las variantes de los retos y las junta por tema en el panel", async () => {
    const { grupo, pase } = await grupoNuevo();
    const { pase: paseAna } = (await registrar(grupo.codigo)).json();
    const base = { personaje: "sismo", grado: "primaria" };
    await llamar(progresoApi, { respuestas: [
      { ...base, mision: "s1", eleccion: PERSONAJES.sismo.misiones[0].opciones.find((o) => o.ok).texto },
      { ...base, mision: RETO_VAR.id, eleccion: BUENA_VAR },
      { ...base, mision: RETO_VAR.id, eleccion: null },
      { ...base, mision: "s3c", eleccion: "Dejarlo así: nunca se ha caído" },
    ] }, { metodo: "PUT", pase: paseAna });
    expect(tablas.respuestas.map((f) => [f.mision, f.correcta])).toEqual([["s1", true], [RETO_VAR.id, true], [RETO_VAR.id, false], ["s3c", false]]);
    const d = (await llamar(grupoApi, undefined, { metodo: "GET", pase })).json();
    expect(d.temas).toEqual([
      { personaje: "sismo", tema: "El salón se mueve", total: 3, aciertos: 2 },
      { personaje: "sismo", tema: "La mochila que salva", total: 1, aciertos: 0 },
    ]);
    // la pregunta de la variante sale con su propio título y escenario
    expect(d.preguntas.find((q) => q.mision === RETO_VAR.id)).toMatchObject({ titulo: RETO_VAR.titulo, pregunta: RETO_VAR.escenario });
  });
});

describe("administración: cuentas propias con correo institucional (Supabase Auth)", () => {
  const editores = async () => (await import("../api/editores.js")).default;
  beforeEach(() => {
    cuentasAuth = [
      { email: "directora@uabc.edu.mx", password: "secreta-123", confirmado: true },
      { email: "nueva@uabc.edu.mx", password: "todavia-no-1", confirmado: false },
      { email: "fuera@uabc.edu.mx", password: "bloqueada-1", confirmado: true, rol: "bloqueado" },
    ];
  });
  const pedir = (api, cuerpo, op) => llamar(api, cuerpo, { ip: "10.1.1.1", ...op });

  it("cualquiera con correo institucional crea su cuenta y le llega el correo para confirmarla", async () => {
    const api = await editores();
    const r = await pedir(api, { accion: "crear", correo: "Maestro.Perez@UABC.edu.mx", contrasena: "mi-clave-larga" });
    expect(r.statusCode).toBe(200);
    expect(r.json().mensaje).toMatch(/Te mandamos un correo a maestro\.perez@uabc\.edu\.mx/);
    expect(correosAuth).toEqual([{ tipo: "confirmar", email: "maestro.perez@uabc.edu.mx", regreso: "/admin" }]);
    // sin confirmar todavía no entra
    const antes = await pedir(api, { correo: "maestro.perez@uabc.edu.mx", contrasena: "mi-clave-larga" });
    expect(antes.statusCode).toBe(403);
    expect(antes.json().error).toMatch(/confirmar tu correo/);
    // al confirmar, entra
    cuentasAuth.find((c) => c.email === "maestro.perez@uabc.edu.mx").confirmado = true;
    const despues = await pedir(api, { correo: "maestro.perez@uabc.edu.mx", contrasena: "mi-clave-larga" });
    expect(despues.statusCode).toBe(200);
    expect(leerPase(despues.json().pase)).toMatchObject({ rol: "editor", correo: "maestro.perez@uabc.edu.mx" });
    expect(despues.json()).not.toHaveProperty("access_token");   // los tokens de Supabase no salen del servidor
  });

  it("no se crean cuentas con correo de otro dominio ni con contraseña corta", async () => {
    const api = await editores();
    const otro = await pedir(api, { accion: "crear", correo: "alguien@gmail.com", contrasena: "mi-clave-larga" });
    expect(otro.statusCode).toBe(400);
    expect(otro.json().error).toMatch(/correo institucional \(@uabc\.edu\.mx\)/);
    expect((await pedir(api, { accion: "crear", correo: "a@uabc.edu.mx", contrasena: "corta" })).statusCode).toBe(400);
    expect(correosAuth).toEqual([]);
    // también se aceptan subdominios de la institución, pero no dominios que solo se parecen
    const { esCorreoInstitucional } = await import("../src/data/institucion.js");
    expect(esCorreoInstitucional("ana@fcitec.uabc.edu.mx")).toBe(true);
    expect(esCorreoInstitucional("ana@uabc.edu.mx.falso.com")).toBe(false);
    expect(esCorreoInstitucional("ana@notuabc.edu.mx")).toBe(false);
  });

  it("crear una cuenta que ya existe responde igual (no revela quién está registrado)", async () => {
    const api = await editores();
    const r = await pedir(api, { accion: "crear", correo: "directora@uabc.edu.mx", contrasena: "otra-clave-larga" });
    expect(r.statusCode).toBe(200);
    expect(cuentasAuth.find((c) => c.email === "directora@uabc.edu.mx").password).toBe("secreta-123");
  });

  it("entrar: contraseña mala no; cuenta bloqueada no", async () => {
    const api = await editores();
    expect((await pedir(api, { correo: "directora@uabc.edu.mx", contrasena: "secreta-123" })).statusCode).toBe(200);
    const mala = await pedir(api, { correo: "directora@uabc.edu.mx", contrasena: "no-es-esta" });
    expect(mala.statusCode).toBe(401);
    expect(mala.json().error).toBe("Correo o contraseña incorrectos.");
    expect((await pedir(api, { correo: "fuera@uabc.edu.mx", contrasena: "bloqueada-1" })).statusCode).toBe(403);
  });

  it("el superusuario entra con un correo no institucional; cualquier otro Gmail no", async () => {
    cuentasAuth.push(
      { email: "jefe@gmail.com", password: "super-clave-1", confirmado: true, rol: "superusuario" },
      { email: "otro@gmail.com", password: "otra-clave-12", confirmado: true },
      { email: "sinconfirmar@gmail.com", password: "otra-clave-12", confirmado: false },
    );
    const api = await editores();
    const jefe = await pedir(api, { correo: "Jefe@Gmail.com", contrasena: "super-clave-1" });
    expect(jefe.statusCode).toBe(200);
    expect(jefe.json()).toMatchObject({ correo: "jefe@gmail.com", superusuario: true });
    expect(leerPase(jefe.json().pase)).toMatchObject({ rol: "editor", correo: "jefe@gmail.com" });
    // otro Gmail: con contraseña buena, mala, sin confirmar o sin cuenta, siempre el mismo mensaje
    const respuestas = await Promise.all([
      pedir(api, { correo: "otro@gmail.com", contrasena: "otra-clave-12" }),
      pedir(api, { correo: "otro@gmail.com", contrasena: "mala-clave-12" }),
      pedir(api, { correo: "sinconfirmar@gmail.com", contrasena: "otra-clave-12" }),
      pedir(api, { correo: "nadie@gmail.com", contrasena: "otra-clave-12" }),
    ]);
    for (const r of respuestas) {
      expect(r.statusCode).toBe(400);
      expect(r.json().error).toBe("Usa tu correo institucional (@uabc.edu.mx).");
    }
    // ni el superusuario crea cuentas ni pide enlaces con un correo no institucional
    expect((await pedir(api, { accion: "crear", correo: "nuevo@gmail.com", contrasena: "una-clave-larga" })).statusCode).toBe(400);
    expect((await pedir(api, { accion: "recuperar", correo: "jefe@gmail.com" })).statusCode).toBe(400);
    expect(correosAuth).toEqual([]);
  });

  it("olvidé mi contraseña: llega el enlace y con él se pone una nueva", async () => {
    const api = await editores();
    const r = await pedir(api, { accion: "recuperar", correo: "directora@uabc.edu.mx" });
    expect(r.statusCode).toBe(200);
    // a un correo sin cuenta se responde igual, pero no se manda nada
    expect((await pedir(api, { accion: "recuperar", correo: "nadie@uabc.edu.mx" })).json().mensaje).toMatch(/Si nadie@uabc\.edu\.mx tiene cuenta/);
    expect(correosAuth).toEqual([{ tipo: "recuperar", email: "directora@uabc.edu.mx", regreso: "/admin" }]);

    const token = "token-de-directora@uabc.edu.mx";
    expect((await pedir(api, { accion: "contrasenaNueva", token, contrasena: "corta" })).statusCode).toBe(400);
    expect((await pedir(api, { accion: "contrasenaNueva", token, contrasena: "secreta-123" })).statusCode).toBe(400);   // la misma
    expect((await pedir(api, { accion: "contrasenaNueva", token: "x".repeat(30), contrasena: "nueva-clave-99" })).statusCode).toBe(401);
    expect((await pedir(api, { accion: "contrasenaNueva", token, contrasena: "nueva-clave-99" })).statusCode).toBe(200);
    expect((await pedir(api, { correo: "directora@uabc.edu.mx", contrasena: "nueva-clave-99" })).statusCode).toBe(200);
  });

  it("los correos tienen tope: 3 por correo cada hora", async () => {
    const api = await editores();
    for (let i = 0; i < 3; i++) expect((await pedir(api, { accion: "recuperar", correo: "directora@uabc.edu.mx" })).statusCode).toBe(200);
    expect((await pedir(api, { accion: "recuperar", correo: "directora@uabc.edu.mx" })).statusCode).toBe(429);
    expect(correosAuth).toHaveLength(3);
  });

  it("20 fallos desde una IP la frenan, aunque luego traiga la contraseña buena", async () => {
    const api = await editores();
    for (let i = 0; i < 20; i++) {
      expect((await llamar(api, { correo: `prueba${i}@uabc.edu.mx`, contrasena: "adivinando" }, { ip: "5.5.5.5" })).statusCode).toBe(401);
    }
    expect((await llamar(api, { correo: "directora@uabc.edu.mx", contrasena: "secreta-123" }, { ip: "5.5.5.5" })).statusCode).toBe(429);
    expect((await llamar(api, { correo: "directora@uabc.edu.mx", contrasena: "secreta-123" }, { ip: "6.6.6.6" })).statusCode).toBe(200);
  });

  it("el enlace de los correos regresa a la administración de este mismo sitio", async () => {
    const { direccionDeRegreso } = await import("../api/editores.js");
    expect(direccionDeRegreso({ headers: { host: "juego.vercel.app" } })).toBe("https://juego.vercel.app/admin");
    expect(direccionDeRegreso({ headers: { "x-forwarded-host": "juego.vercel.app", host: "x" } })).toBe("https://juego.vercel.app/admin");
    expect(direccionDeRegreso({ headers: { host: "localhost:5173" } })).toBe("http://localhost:5173/admin");
    expect(direccionDeRegreso({ headers: { host: "malo.com/<script>" } })).toBe("/admin");
  });

  it("la clave de administración sigue sirviendo de respaldo", async () => {
    process.env.EDITORES_CLAVE = "clave-de-editores-123";
    const api = await editores();
    expect((await llamar(api, { clave: "clave-de-editores-123" })).statusCode).toBe(200);
    delete process.env.EDITORES_CLAVE;
  });
});

describe("evaluación abierta (/opinion): cualquiera, sin cuenta", () => {
  const opinionApi = async () => (await import("../api/opinion.js")).default;
  const BUENA = { juego: 5, trato: 4, explicacion: 5 };

  it("se guarda sin pase, sin correo y sin código; no guarda la IP ni quién fue", async () => {
    const api = await opinionApi();
    const r = await llamar(api, { ...BUENA, quien: "familia" });
    expect(r.statusCode).toBe(200);
    expect((await llamar(api, { juego: 1, trato: 2, explicacion: 3 })).statusCode).toBe(200);
    expect(tablas.opiniones.map(({ juego, trato, explicacion, quien }) => ({ juego, trato, explicacion, quien }))).toEqual([
      { ...BUENA, quien: "familia" },
      { juego: 1, trato: 2, explicacion: 3, quien: null },
    ]);
    expect(JSON.stringify(tablas.opiniones)).not.toMatch(/10\.0\.0\.1|alumno|grupo/);
  });

  it("rechaza caritas fuera de 1 a 5, preguntas sin contestar y un «soy» inventado", async () => {
    const api = await opinionApi();
    for (const cuerpo of [{ ...BUENA, juego: 6 }, { juego: 5, trato: 4 }, { ...BUENA, quien: "director" }, { ...BUENA, trato: "5" }]) {
      expect((await llamar(api, cuerpo)).statusCode).toBe(400);
    }
    expect(tablas.opiniones).toEqual([]);
  });

  it("tope de 120 por hora por IP, para que nadie llene la tabla", async () => {
    const api = await opinionApi();
    for (let i = 0; i < 120; i++) await llamar(api, BUENA, { ip: "7.7.7.7" });
    expect((await llamar(api, BUENA, { ip: "7.7.7.7" })).statusCode).toBe(429);
    expect((await llamar(api, BUENA, { ip: "8.8.8.8" })).statusCode).toBe(200);
  });

  it("solo la administración lee el resumen, agrupado por día y sin decir quién contestó", async () => {
    process.env.EDITORES_CLAVE = "clave-de-editores-123";
    const api = await opinionApi();
    const editoresApi = (await import("../api/editores.js")).default;
    await llamar(api, BUENA);
    await llamar(api, BUENA);
    await llamar(api, { ...BUENA, juego: 2, quien: "alumno" });
    expect((await llamar(api, undefined, { metodo: "GET" })).statusCode).toBe(401);
    const { pase: paseAlumnoOMaestro } = await grupoNuevo();
    expect((await llamar(api, undefined, { metodo: "GET", pase: paseAlumnoOMaestro })).statusCode).toBe(401);

    const pase = (await llamar(editoresApi, { clave: "clave-de-editores-123" })).json().pase;
    const r = await llamar(api, undefined, { metodo: "GET", pase });
    expect(r.statusCode).toBe(200);
    const filas = r.json().filas;
    expect(filas.find((f) => f.quien === null)).toMatchObject({ ...BUENA, respuestas: 2 });
    expect(filas.find((f) => f.quien === "alumno")).toMatchObject({ juego: 2, respuestas: 1 });
    expect(Object.keys(filas[0]).sort()).toEqual(["dia", "explicacion", "juego", "quien", "respuestas", "trato"]);
    delete process.env.EDITORES_CLAVE;
  });

  it("resumen para la administración: promedio y caritas por pregunta, con filtro por quién", async () => {
    const { resumirOpiniones } = await import("../src/lib/opiniones.js");
    const filas = [
      { dia: "2026-11-26", quien: null, juego: 5, trato: 4, explicacion: 5, respuestas: 2 },
      { dia: "2026-11-26", quien: "alumno", juego: 2, trato: 4, explicacion: 3, respuestas: 1 },
    ];
    const r = resumirOpiniones(filas);
    expect(r.total).toBe(3);
    expect(r.preguntas.find((p) => p.id === "juego")).toMatchObject({ conteo: [0, 1, 0, 0, 2], promedio: 4 });
    expect(r.quienes.find((q) => q.id === "alumno").total).toBe(1);
    expect(resumirOpiniones(filas, { quien: "alumno" }).total).toBe(1);
    expect(resumirOpiniones(filas, { quien: "sin" }).total).toBe(2);
  });
});

describe("administración: mi contraseña y cuentas del superusuario", () => {
  const editores = async () => (await import("../api/editores.js")).default;
  const JEFE = "11111111-1111-4111-8111-111111111111";
  const DIRECTORA = "22222222-2222-4222-8222-222222222222";
  beforeEach(() => {
    cuentasAuth = [
      { id: JEFE, email: "jefe@uagro.mx", password: "super-clave-1", confirmado: true, rol: "superusuario" },
      { id: DIRECTORA, email: "directora@uabc.edu.mx", password: "secreta-123", confirmado: true },
    ];
  });
  const entrar = async (api, correo, contrasena) => (await llamar(api, { correo, contrasena }, { ip: "10.2.2.2" })).json().pase;
  const pedir = (api, cuerpo, pase) => llamar(api, cuerpo, { ip: "10.2.2.2", pase });

  it("cada quien cambia su contraseña con la actual, también sin correo institucional", async () => {
    const api = await editores();
    for (const [correo, actual] of [["jefe@uagro.mx", "super-clave-1"], ["directora@uabc.edu.mx", "secreta-123"]]) {
      const pase = await entrar(api, correo, actual);
      const mala = await pedir(api, { accion: "miContrasena", actual: "no-es-esta", nueva: "nueva-clave-77" }, pase);
      expect(mala.statusCode).toBe(401);
      expect(mala.json().error).toBe("Tu contraseña actual no es esa.");
      expect((await pedir(api, { accion: "miContrasena", actual, nueva: "corta" }, pase)).statusCode).toBe(400);
      expect((await pedir(api, { accion: "miContrasena", actual, nueva: actual }, pase)).statusCode).toBe(400);
      expect((await pedir(api, { accion: "miContrasena", actual, nueva: "nueva-clave-77" }, pase)).statusCode).toBe(200);
      expect(await entrar(api, correo, "nueva-clave-77")).toBeTruthy();
      expect(await entrar(api, correo, actual)).toBeUndefined();
    }
    // sin pase, o con el de la clave de respaldo (no hay cuenta), no
    expect((await pedir(api, { accion: "miContrasena", actual: "x".repeat(8), nueva: "y".repeat(8) })).statusCode).toBe(401);
    const paseClave = crearPase({ rol: "editor" });
    expect((await pedir(api, { accion: "miContrasena", actual: "x".repeat(8), nueva: "y".repeat(8) }, paseClave)).statusCode).toBe(400);
  });

  it("el superusuario lista, agrega, cambia el rol, bloquea y pone contraseñas", async () => {
    const api = await editores();
    const pase = await entrar(api, "jefe@uagro.mx", "super-clave-1");
    expect(leerPase(pase)).toMatchObject({ su: 1, uid: JEFE });

    const lista = (await pedir(api, { accion: "cuentas" }, pase)).json().cuentas;
    expect(lista.map((c) => [c.correo, c.yo])).toEqual([["jefe@uagro.mx", true], ["directora@uabc.edu.mx", false]]);

    // una cuenta de otra universidad: ya confirmada, entra como administradora
    expect((await pedir(api, { accion: "nuevaCuenta", correo: "Profe@UAGro.mx", contrasena: "para-empezar-1", rol: "admin" }, pase)).statusCode).toBe(200);
    expect((await pedir(api, { accion: "nuevaCuenta", correo: "profe@uagro.mx", contrasena: "para-empezar-1", rol: "admin" }, pase)).statusCode).toBe(409);
    expect((await pedir(api, { accion: "nuevaCuenta", correo: "otra@uagro.mx", contrasena: "para-empezar-1", rol: "bloqueado" }, pase)).statusCode).toBe(400);
    const profe = await llamar(api, { correo: "profe@uagro.mx", contrasena: "para-empezar-1" }, { ip: "10.2.2.2" });
    expect(profe.statusCode).toBe(200);
    expect(profe.json().superusuario).toBe(false);
    expect(leerPase(profe.json().pase)).not.toHaveProperty("su");

    // bloquear y desbloquear
    expect((await pedir(api, { accion: "cambiarRol", id: DIRECTORA, rol: "bloqueado" }, pase)).statusCode).toBe(200);
    expect((await llamar(api, { correo: "directora@uabc.edu.mx", contrasena: "secreta-123" }, { ip: "10.2.2.2" })).statusCode).toBe(403);
    expect((await pedir(api, { accion: "cambiarRol", id: DIRECTORA, rol: "ninguno" }, pase)).statusCode).toBe(200);
    expect(await entrar(api, "directora@uabc.edu.mx", "secreta-123")).toBeTruthy();
    expect((await pedir(api, { accion: "cambiarRol", id: DIRECTORA, rol: "rey" }, pase)).statusCode).toBe(400);

    // ponerle contraseña a otra cuenta
    expect((await pedir(api, { accion: "contrasenaDe", id: DIRECTORA, contrasena: "la-del-jefe-1" }, pase)).statusCode).toBe(200);
    expect(await entrar(api, "directora@uabc.edu.mx", "la-del-jefe-1")).toBeTruthy();

    // a sí mismo no se cambia el rol ni la contraseña desde el panel
    expect((await pedir(api, { accion: "cambiarRol", id: JEFE, rol: "bloqueado" }, pase)).statusCode).toBe(400);
    expect((await pedir(api, { accion: "contrasenaDe", id: JEFE, contrasena: "otra-cosa-12" }, pase)).statusCode).toBe(400);
    expect(cuentasAuth.find((c) => c.id === JEFE).rol).toBe("superusuario");
  });

  it("quien no es superusuario no usa el panel, aunque arme el pedido a mano", async () => {
    const api = await editores();
    const pase = await entrar(api, "directora@uabc.edu.mx", "secreta-123");
    for (const cuerpo of [
      { accion: "cuentas" },
      { accion: "nuevaCuenta", correo: "x@gmail.com", contrasena: "una-clave-larga", rol: "superusuario" },
      { accion: "cambiarRol", id: JEFE, rol: "bloqueado" },
    ]) {
      expect((await pedir(api, cuerpo, pase)).statusCode).toBe(403);
    }
    // un pase de superusuario cuyo rol ya le quitaron: la base de datos lo rechaza
    const paseViejo = crearPase({ rol: "editor", correo: "directora@uabc.edu.mx", su: 1, uid: DIRECTORA });
    expect((await pedir(api, { accion: "cuentas" }, paseViejo)).statusCode).toBe(403);
    expect(cuentasAuth.find((c) => c.id === JEFE).rol).toBe("superusuario");
  });

  it("con rol «admin» entra aunque su correo no sea institucional", async () => {
    cuentasAuth.push({ id: randomUUID(), email: "invitada@uagro.mx", password: "invitada-123", confirmado: true, rol: "admin" });
    const api = await editores();
    expect(await entrar(api, "invitada@uagro.mx", "invitada-123")).toBeTruthy();
  });
});
