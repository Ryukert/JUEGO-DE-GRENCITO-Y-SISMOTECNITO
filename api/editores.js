/**
 * Ventana de editores: resultados de las encuestas de satisfacción de los juegos.
 *
 *   POST /api/editores { correo, contrasena }                       → { pase, correo }  (8 horas)
 *   POST /api/editores { accion: "crear", correo, contrasena }      → { mensaje }  manda el correo de confirmación
 *   POST /api/editores { accion: "recuperar", correo }              → { mensaje }  manda el enlace para cambiarla
 *   POST /api/editores { accion: "contrasenaNueva", token, contrasena } → { ok }
 *        cuentas de Supabase Auth con correo institucional confirmado (ver api/_admin.js)
 *   POST /api/editores { clave }                      → { pase }   respaldo: EDITORES_CLAVE
 *   GET  /api/editores?desde=AAAA-MM-DD&hasta=…  (pase de editor)
 *     → { filas: [{ juego, tipo, grado, dia, gusto, dificultad, respuestas }] }
 *
 * Las filas ya vienen resumidas (cuántas respuestas por juego, grado, día, carita y dificultad):
 * nunca dicen quién contestó. Se leen con la llave secreta si está; si no, con la función
 * public.resumen_encuestas (llave publicable + llave de la API derivada de JUEGO_SECRETO).
 *
 * Para entrar hace falta al menos una de las dos: cuentas de administrador en Supabase Auth
 * (con SUPABASE_URL y la llave publicable) o EDITORES_CLAVE (10 caracteres o más).
 */
import { createHash, timingSafeEqual } from "node:crypto";
import { db, configuracionDb, configuracionRpc, rpc } from "./_db.js";
import { responderJson, quienEs, leerCuerpo, crearPase, paseDe, secreto } from "./_comun.js";
import { revisarIntentos, anotarFallo, contar, resumen as resumenLimite } from "./_limites.js";
import {
  entrarAdministrador, crearCuenta, pedirCambioDeContrasena, ponerContrasenaNueva,
  limpiarCorreo, contrasenaValida, configuracionAuth, esCorreoInstitucional, MINIMO_NUEVA,
} from "./_admin.js";
import { dominiosEnTexto } from "../src/data/institucion.js";

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const zonaEditores = (env = process.env) => env.EVALUACION_ZONA || "America/Tijuana";

/** Cuántos ms va adelantada la hora local de `zona` respecto a UTC en el instante `ms`. */
function diferencia(ms, zona) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: zona, hourCycle: "h23",
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
    }).formatToParts(new Date(ms)).map((x) => [x.type, x.value]),
  );
  return Date.UTC(+p.year, p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - ms;
}

/**
 * «AAAA-MM-DD» → instante (ISO, UTC) en que empieza ese día en `zona`. Respeta el horario de
 * verano: en Tijuana la medianoche es 08:00 UTC en invierno y 07:00 UTC en verano.
 * Con `siguiente`, el inicio del día después (para filtrar con «menor que»).
 */
export function inicioDelDia(fecha, zona = "America/Tijuana", { siguiente = false } = {}) {
  const [y, m, d] = fecha.split("-").map(Number);
  const local = Date.UTC(y, m - 1, d + (siguiente ? 1 : 0));
  let ms = local - diferencia(local, zona);
  ms = local - diferencia(ms, zona);   // segunda vuelta por si el cambio de horario cae en medio
  return new Date(ms).toISOString();
}
const resumen = (t) => createHash("sha256").update(String(t)).digest();

export function claveEditorCorrecta(clave, env = process.env) {
  const real = env.EDITORES_CLAVE;
  if (typeof real !== "string" || real.length < 10 || typeof clave !== "string") return false;
  return timingSafeEqual(resumen(clave), resumen(real));
}

/** Filas crudas de la tabla → el mismo resumen que da la función de Supabase. */
export function agrupar(crudas, zona = "America/Tijuana") {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit" });
  const mapa = new Map();
  for (const e of crudas) {
    const dia = fmt.format(new Date(e.creado_en));
    const k = [e.juego, e.tipo, e.grado, dia, e.gusto, e.dificultad].join("|");
    const v = mapa.get(k) || { juego: e.juego, tipo: e.tipo, grado: e.grado, dia, gusto: e.gusto, dificultad: e.dificultad, respuestas: 0 };
    v.respuestas += 1;
    mapa.set(k, v);
  }
  return [...mapa.values()];
}

/** A dónde regresa el enlace de los correos de Supabase: la administración de este mismo sitio. */
export function direccionDeRegreso(req) {
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  if (!/^[a-z0-9.-]+(:\d+)?$/i.test(host)) return "/admin";
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  return `${local ? "http" : "https"}://${host}/admin`;
}

export default async function handler(req, res) {
  if (!secreto() || !(configuracionDb() || configuracionRpc())) {
    return responderJson(res, 503, { error: "La ventana de editores no está configurada en el servidor." });
  }
  if (!process.env.EDITORES_CLAVE && !configuracionAuth()) {
    return responderJson(res, 503, { error: "La administración no tiene cómo revisar quién entra (faltan las cuentas o EDITORES_CLAVE)." });
  }

  if (req.method === "POST") {
    const ip = quienEs(req);
    let d;
    try { d = await leerCuerpo(req, 6_000); }   // el token del enlace del correo es largo
    catch { return responderJson(res, 400, { error: "No entendí el mensaje" }); }

    // cuentas con correo institucional: crear, entrar, olvidé mi contraseña y contraseña nueva
    if (d?.accion === "contrasenaNueva") {
      if (!contrasenaValida(d.contrasena, MINIMO_NUEVA)) return responderJson(res, 400, { error: `La contraseña nueva lleva de ${MINIMO_NUEVA} a 128 caracteres.` });
      if (await revisarIntentos(ip, null)) return responderJson(res, 429, { error: "Demasiados intentos. Espera un rato." }, { "Retry-After": "600" });
      const r = await ponerContrasenaNueva(d.token, d.contrasena);
      if (r.ok) return responderJson(res, 200, { ok: true });
      if (r.motivo === "sin-servicio") return responderJson(res, 503, { error: "No se pudo cambiar ahorita. Intenta en un momento." });
      if (r.motivo === "misma") return responderJson(res, 400, { error: "Elige una contraseña distinta a la anterior." });
      if (r.motivo === "contrasena") return responderJson(res, 400, { error: "Esa contraseña no sirve: usa una más larga o menos común." });
      return responderJson(res, 401, { error: "El enlace ya no sirve. Pide otro con «¿Olvidaste tu contraseña?»." });
    }

    if (d?.correo !== undefined) {
      const correo = limpiarCorreo(d.correo);
      if (!correo) return responderJson(res, 400, { error: "Escribe tu correo." });
      const institucional = esCorreoInstitucional(correo);
      const pideInstitucional = () => responderJson(res, 400, { error: `Usa tu correo institucional (${dominiosEnTexto()}).` });
      const regreso = direccionDeRegreso(req);

      if (d.accion === "crear" || d.accion === "recuperar") {
        // las cuentas nuevas y los correos de recuperación son solo para correos institucionales
        if (!institucional) return pideInstitucional();
        if (d.accion === "crear" && !contrasenaValida(d.contrasena, MINIMO_NUEVA)) {
          return responderJson(res, 400, { error: `La contraseña lleva de ${MINIMO_NUEVA} a 128 caracteres.` });
        }
        // cada uno manda un correo: tope bajo por IP y por correo para que nadie llene buzones
        const hora = Math.floor(Date.now() / 3_600_000);
        const tope = await contar([
          { clave: `correo-envio:${resumenLimite("ip", ip)}:${hora}`, segundos: 4_000, max: 6, motivo: "ip" },
          { clave: `correo-envio:${resumenLimite("correo", correo)}:${hora}`, segundos: 4_000, max: 3, motivo: "correo" },
        ]);
        if (tope) return responderJson(res, 429, { error: "Ya se mandaron varios correos. Espera una hora e intenta otra vez." }, { "Retry-After": "3600" });
        const r = d.accion === "crear" ? await crearCuenta(correo, d.contrasena, regreso) : await pedirCambioDeContrasena(correo, regreso);
        if (r.ok) {
          return responderJson(res, 200, {
            ok: true,
            mensaje: d.accion === "crear"
              ? `Listo. Te mandamos un correo a ${correo}: abre el enlace para confirmar tu cuenta y luego entra aquí.`
              : `Si ${correo} tiene cuenta, te llegará un correo con un enlace para poner una contraseña nueva.`,
          });
        }
        if (r.motivo === "muchos-correos") return responderJson(res, 429, { error: "Se mandaron muchos correos en poco tiempo. Espera una hora e intenta otra vez." });
        if (r.motivo === "contrasena") return responderJson(res, 400, { error: "Esa contraseña no sirve: usa una más larga o menos común." });
        console.error("[editores] Supabase Auth no respondió al", d.accion === "crear" ? "crear la cuenta" : "pedir el cambio de contraseña");
        return responderJson(res, 503, { error: "No se pudo mandar el correo ahorita. Intenta en un momento." });
      }

      // entrar
      if (!contrasenaValida(d.contrasena)) return responderJson(res, 400, { error: "Escribe tu correo y tu contraseña." });
      if (await revisarIntentos(ip, `admin|${correo}`)) {
        return responderJson(res, 429, { error: "Demasiados intentos. Espera un rato." }, { "Retry-After": "600" });
      }
      // entrar: con correo institucional, o la cuenta de superusuario (la marca está en Supabase)
      const r = await entrarAdministrador(correo, d.contrasena);
      if (r.ok) {
        return responderJson(res, 200, { pase: crearPase({ rol: "editor", correo: r.correo }), correo: r.correo, superusuario: !!r.superusuario });
      }
      if (r.motivo === "sin-servicio") {
        console.error("[editores] Supabase Auth no respondió");
        return responderJson(res, 503, { error: "No se pudo revisar la cuenta ahorita. Intenta en un momento." });
      }
      // un correo no institucional que no es superusuario: siempre el mismo mensaje, sea cual sea
      // la razón (no revela si esa cuenta existe o si le falta confirmar)
      if (!institucional) {
        await anotarFallo(ip);
        return pideInstitucional();
      }
      if (r.motivo === "sin-confirmar") {
        return responderJson(res, 403, { error: "Falta confirmar tu correo: abre el enlace que te mandamos (revisa también «No deseado»)." });
      }
      await anotarFallo(ip);
      if (r.motivo === "bloqueado") return responderJson(res, 403, { error: "Esta cuenta no tiene acceso a la administración." });
      return responderJson(res, 401, { error: "Correo o contraseña incorrectos." });
    }

    // respaldo: la clave de administración
    if (await revisarIntentos(ip, "editores|clave")) {
      return responderJson(res, 429, { error: "Demasiados intentos. Espera un rato." }, { "Retry-After": "600" });
    }
    if (!claveEditorCorrecta(d?.clave)) {
      await anotarFallo(ip);
      return responderJson(res, 401, { error: "Clave incorrecta." });
    }
    return responderJson(res, 200, { pase: crearPase({ rol: "editor" }) });
  }

  if (req.method !== "GET") return responderJson(res, 405, { error: "Usa GET o POST" }, { Allow: "GET, POST" });
  if (!paseDe(req, "editor")) return responderJson(res, 401, { error: "Vuelve a escribir la clave de editores." });

  const url = new URL(req.url || "/", "http://x");
  const desde = FECHA.test(url.searchParams.get("desde") || "") ? url.searchParams.get("desde") : null;
  const hasta = FECHA.test(url.searchParams.get("hasta") || "") ? url.searchParams.get("hasta") : null;

  try {
    let filas;
    if (configuracionRpc()) {
      filas = await rpc("resumen_encuestas", { p_desde: desde, p_hasta: hasta });
    } else {
      const zona = zonaEditores();
      const filtros = [
        desde && `creado_en=gte.${encodeURIComponent(inicioDelDia(desde, zona))}`,
        hasta && `creado_en=lt.${encodeURIComponent(inicioDelDia(hasta, zona, { siguiente: true }))}`,
      ].filter(Boolean).join("&");
      const crudas = await db(`encuestas?select=juego,tipo,grado,gusto,dificultad,creado_en&limit=100000${filtros ? "&" + filtros : ""}`);
      filas = agrupar(crudas || [], zona);
    }
    return responderJson(res, 200, { filas: (filas || []).map((f) => ({ ...f, respuestas: Number(f.respuestas) })) });
  } catch (e) {
    console.error("[editores]", e.estado || "", e.codigo || "", e.message);
    return responderJson(res, 502, { error: "No pude leer las encuestas ahorita." });
  }
}
