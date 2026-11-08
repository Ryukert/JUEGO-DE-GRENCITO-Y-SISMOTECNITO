/**
 * Topes de uso (no es una función: el «_» hace que Vercel no la publique): intentos de entrar
 * (PIN del alumno, clave del maestro y de editores) y escrituras de progreso. Cuenta por
 * ventanas fijas.
 *
 * Si están UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN (Upstash o Vercel KV), los
 * contadores se comparten entre todas las copias del servidor y sobreviven a los reinicios.
 * Si no, se cuentan en la memoria de cada copia: frena el abuso obvio, pero Vercel puede abrir
 * varias copias y cada una lleva su cuenta. La IP se guarda resumida (sha256), nunca tal cual.
 */
import { createHash } from "node:crypto";

const num = (v, def) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : def);

export function configuracion(env = process.env) {
  return {
    upstash: env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
      ? { url: String(env.UPSTASH_REDIS_REST_URL).replace(/\/+$/, ""), token: env.UPSTASH_REDIS_REST_TOKEN }
      : null,
  };
}

const memoria = new Map();   // clave → { n, vence }

function contarEnMemoria(claves, ahora) {
  if (memoria.size > 5000) for (const [k, v] of memoria) if (v.vence <= ahora) memoria.delete(k);
  return claves.map(({ clave, segundos, suma = 1 }) => {
    const v = memoria.get(clave);
    const actual = v && v.vence > ahora ? v : { n: 0, vence: ahora + segundos * 1000 };
    actual.n += suma;
    memoria.set(clave, actual);
    return actual.n;
  });
}

async function contarEnUpstash({ url, token }, claves) {
  // suma 0 = solo leer cómo va el contador (INCRBY 0 devuelve el valor sin cambiarlo)
  const comandos = claves.flatMap(({ clave, segundos, suma = 1 }) => [["INCRBY", clave, String(suma)], ["EXPIRE", clave, String(segundos), "NX"]]);
  const r = await fetch(url + "/pipeline", {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify(comandos),
  });
  if (!r.ok) throw new Error("Upstash " + r.status);
  const datos = await r.json();
  return claves.map((_, i) => Number(datos[i * 2]?.result));
}

/** Resume un dato (IP, apodo…) para usarlo de clave sin guardarlo tal cual. */
export function resumen(prefijo, valor) {
  return createHash("sha256").update(prefijo + "|" + String(valor || "anonimo")).digest("hex").slice(0, 20);
}

/**
 * Suma una visita a cada contador y devuelve el motivo del primero que se pasó, o null.
 * claves: [{ clave, segundos, max, motivo }]
 */
export async function contar(claves, { env = process.env, ahora = Date.now() } = {}) {
  const cfg = configuracion(env);
  let cuentas;
  if (cfg.upstash) {
    try { cuentas = await contarEnUpstash(cfg.upstash, claves); }
    catch (e) { console.error("[límites] contadores compartidos no disponibles, se usan los de memoria:", e.message); }
  }
  if (!cuentas) cuentas = contarEnMemoria(claves, ahora);
  const pasado = claves.find((c, i) => !(cuentas[i] <= c.max));
  return pasado ? pasado.motivo : null;
}

/**
 * Intentos de entrar (PIN del alumno o clave del maestro). Un PIN de 4 cifras se adivina
 * a lo bruto si no hay tope, así que se cuenta por IP y por cuenta:
 *   - por IP, intentos FALLIDOS: 20 cada 10 minutos (ENTRAR_FALLOS_IP),
 *   - por IP, intentos en total: 200 cada 10 minutos (ENTRAR_LIMITE_IP). En la escuela todo el
 *     salón sale a internet por la misma IP: 30 niños entrando a la vez no deben bloquearse,
 *     por eso los que entran bien solo cuentan contra este tope alto,
 *   - por cuenta (grupo + apodo, o el grupo para el maestro): 10 intentos por hora.
 * El de cuenta se suma antes de revisar el PIN, así que adivinar 10,000 PIN tomaría más de un mes.
 * Quien llama avisa de cada fallo con anotarFallo().
 */
export function configuracionIntentos(env = process.env) {
  return { fallosIp: num(env.ENTRAR_FALLOS_IP, 20), totalIp: num(env.ENTRAR_LIMITE_IP, 200) };
}

const claveFallos = (ip, ahora) => `fallos:${resumen("ip", ip)}:${Math.floor(ahora / 600_000)}`;

export async function revisarIntentos(ip, cuenta, { env = process.env, ahora = Date.now() } = {}) {
  const cfg = configuracionIntentos(env);
  const bloque = Math.floor(ahora / 600_000), hora = Math.floor(ahora / 3_600_000);
  const claves = [
    // suma 0: solo se lee; pasa mientras haya menos de fallosIp fallos
    { clave: claveFallos(ip, ahora), segundos: 900, suma: 0, max: cfg.fallosIp - 1, motivo: "ip" },
    { clave: `entrar:${resumen("ip", ip)}:${bloque}`, segundos: 900, max: cfg.totalIp, motivo: "ip" },
  ];
  if (cuenta) claves.push({ clave: `cuenta:${resumen("cuenta", cuenta)}:${hora}`, segundos: 4_000, max: 10, motivo: "cuenta" });
  return contar(claves, { env, ahora });
}

/** Anota un intento fallido (PIN, clave o código equivocado) para el tope por IP. */
export async function anotarFallo(ip, { env = process.env, ahora = Date.now() } = {}) {
  await contar([{ clave: claveFallos(ip, ahora), segundos: 900, max: Infinity, motivo: "ip" }], { env, ahora });
}

/** Escrituras de progreso y respuestas: 240 por minuto por IP (un salón entero sale por la misma IP). */
export async function revisarEscrituras(ip, { env = process.env, ahora = Date.now() } = {}) {
  const minuto = Math.floor(ahora / 60_000);
  return contar([{ clave: `escribe:${resumen("ip", ip)}:${minuto}`, segundos: 120, max: 240, motivo: "minuto" }], { env, ahora });
}

/** Solo para las pruebas */
export function reiniciarMemoria() { memoria.clear(); }
