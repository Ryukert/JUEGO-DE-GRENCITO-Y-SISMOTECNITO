/**
 * Límites de uso del chat (no es una función: el «_» hace que Vercel no la publique).
 *
 * Cuenta por ventanas fijas:
 *   - por persona (IP): CHAT_LIMITE_MINUTO por minuto y CHAT_LIMITE_IP_DIA por día,
 *   - del juego completo: CHAT_LIMITE_DIARIO mensajes por día (tope de gasto).
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
    porMinuto: num(env.CHAT_LIMITE_MINUTO, 12),
    porDia: num(env.CHAT_LIMITE_IP_DIA, 150),
    total: num(env.CHAT_LIMITE_DIARIO, 3000),
    upstash: env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
      ? { url: String(env.UPSTASH_REDIS_REST_URL).replace(/\/+$/, ""), token: env.UPSTASH_REDIS_REST_TOKEN }
      : null,
  };
}

const memoria = new Map();   // clave → { n, vence }

function contarEnMemoria(claves, ahora) {
  if (memoria.size > 5000) for (const [k, v] of memoria) if (v.vence <= ahora) memoria.delete(k);
  return claves.map(({ clave, segundos }) => {
    const v = memoria.get(clave);
    const actual = v && v.vence > ahora ? v : { n: 0, vence: ahora + segundos * 1000 };
    actual.n += 1;
    memoria.set(clave, actual);
    return actual.n;
  });
}

async function contarEnUpstash({ url, token }, claves) {
  const comandos = claves.flatMap(({ clave, segundos }) => [["INCR", clave], ["EXPIRE", clave, String(segundos), "NX"]]);
  const r = await fetch(url + "/pipeline", {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify(comandos),
  });
  if (!r.ok) throw new Error("Upstash " + r.status);
  const datos = await r.json();
  return claves.map((_, i) => Number(datos[i * 2]?.result));
}

/** Suma una visita y dice si pasa. Devuelve null si pasa, o el motivo si no. */
export async function revisarLimites(ip, { env = process.env, ahora = Date.now() } = {}) {
  const cfg = configuracion(env);
  const quien = createHash("sha256").update("chat|" + String(ip || "anonimo")).digest("hex").slice(0, 20);
  const minuto = Math.floor(ahora / 60_000), dia = Math.floor(ahora / 86_400_000);
  const claves = [
    { clave: `chat:${quien}:m:${minuto}`, segundos: 120, max: cfg.porMinuto, motivo: "minuto" },
    { clave: `chat:${quien}:d:${dia}`, segundos: 90_000, max: cfg.porDia, motivo: "dia" },
    { clave: `chat:total:d:${dia}`, segundos: 90_000, max: cfg.total, motivo: "total" },
  ];
  let cuentas;
  if (cfg.upstash) {
    try { cuentas = await contarEnUpstash(cfg.upstash, claves); }
    catch (e) { console.error("[chat] límites compartidos no disponibles, se usan los de memoria:", e.message); }
  }
  if (!cuentas) cuentas = contarEnMemoria(claves, ahora);
  const pasado = claves.find((c, i) => !(cuentas[i] <= c.max));
  return pasado ? pasado.motivo : null;
}

/** Solo para las pruebas */
export function reiniciarMemoria() { memoria.clear(); }
