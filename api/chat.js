/**
 * Función serverless (Vercel) que conversa con Claude.
 * La API key vive solo aquí, en el servidor. Nunca llega al navegador.
 *
 * El navegador NO manda instrucciones para la IA: manda qué personaje, grado y misión se están
 * jugando, y la respuesta elegida o la pregunta del jugador. Las instrucciones se arman aquí con
 * el contenido del juego (src/data/personajes.js). Así nadie puede usar este servidor para pedirle
 * a Claude otra cosa a costa de la cuenta del juego.
 *
 *   POST /api/chat
 *   { personaje: "sismo"|"green", grado: "primaria"|"secundaria", mision: "s1",
 *     tipo: "respuesta", bono?: true, eleccion: "texto de la opción" | null }   ← null: se acabó el tiempo
 *   { personaje, grado, mision, tipo: "pregunta", texto: "lo que escribió el jugador" }
 *   → { texto }
 *
 * Variables de entorno: ANTHROPIC_API_KEY (requerida), ANTHROPIC_MODEL y las de api/_limites.js.
 */
import { PERSONAJES, GRADOS, construirSistema } from "../src/data/personajes.js";
import { revisarLimites } from "./_limites.js";

const MODELO = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
const MAX_PREGUNTA = 300;      // lo que escribe un niño en el chat
const MAX_TOKENS = 300;        // la regla pide máximo 35 palabras

function responderJson(res, codigo, cuerpo, extra = {}) {
  res.statusCode = codigo;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  for (const [k, v] of Object.entries(extra)) res.setHeader(k, v);
  return res.end(JSON.stringify(cuerpo));
}

function quienEs(req) {
  const cabecera = req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "";
  return String(cabecera).split(",")[0].trim() || req.socket?.remoteAddress || "anonimo";
}

async function leerCuerpo(req) {
  if (req.body) return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const partes = [];
  let total = 0;
  for await (const trozo of req) {
    total += trozo.length;
    if (total > 8_000) throw new Error("cuerpo demasiado grande");
    partes.push(trozo);
  }
  return JSON.parse(Buffer.concat(partes).toString("utf8") || "{}");
}

/** Arma las instrucciones y el mensaje a partir del contenido del juego, o explica por qué no. */
export function armarConsulta(datos) {
  const d = datos && typeof datos === "object" ? datos : {};
  const p = Object.prototype.hasOwnProperty.call(PERSONAJES, d.personaje) ? PERSONAJES[d.personaje] : null;
  if (!p) return { error: "Personaje desconocido" };
  const grado = Object.prototype.hasOwnProperty.call(GRADOS, d.grado) ? d.grado : null;
  if (!grado) return { error: "Grado desconocido" };
  const mision = p.misiones.find((m) => m.id === d.mision && m.tipo === "reto");
  if (!mision) return { error: "Misión desconocida" };

  if (d.tipo === "pregunta") {
    const texto = String(d.texto ?? "").trim().slice(0, MAX_PREGUNTA);
    if (!texto) return { error: "La pregunta llegó vacía" };
    return {
      sistema: construirSistema(p, grado, `Misión "${mision.titulo}": ${mision.escenario}`),
      mensaje: texto,
    };
  }

  if (d.tipo === "respuesta") {
    const bono = d.bono === true;
    if (bono && !(GRADOS[grado].retoExtra && mision.retoSecundaria)) return { error: "Esa misión no tiene pregunta de bonificación" };
    const pregunta = bono ? mision.retoSecundaria : mision;
    const opciones = pregunta.opciones.concat(!bono && GRADOS[grado].opcionExtra && mision.opcionExtra ? [mision.opcionExtra] : []);
    let elegido = "Se acabó el tiempo", correcto = false;
    if (d.eleccion !== null && d.eleccion !== undefined) {
      const opcion = opciones.find((o) => o.texto === d.eleccion);
      if (!opcion) return { error: "Respuesta desconocida" };
      elegido = opcion.texto;
      correcto = !!opcion.ok;   // se decide aquí, no lo dice el navegador
    }
    return {
      sistema: construirSistema(p, grado, `Misión "${mision.titulo}". Pregunta: ${bono ? pregunta.pregunta : mision.escenario}`),
      mensaje: `El jugador respondió: "${elegido}". La respuesta ${correcto ? "es correcta" : "no es correcta"}. Comenta en una o dos frases, ${correcto ? "celebrando" : "corrigiendo con ánimo"}, y cierra con este dato si viene al caso: ${mision.dato || pregunta.explicacion}`,
    };
  }
  return { error: "Tipo de mensaje desconocido" };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return responderJson(res, 405, { error: "Usa POST" }, { Allow: "POST" });

  const llave = process.env.ANTHROPIC_API_KEY;
  if (!llave) {
    console.error("[chat] falta ANTHROPIC_API_KEY");
    return responderJson(res, 503, { error: "El chat no está disponible ahorita." });
  }

  let datos;
  try { datos = await leerCuerpo(req); }
  catch { return responderJson(res, 400, { error: "No entendí el mensaje" }); }

  const consulta = armarConsulta(datos);
  if (consulta.error) return responderJson(res, 400, { error: consulta.error });

  const limite = await revisarLimites(quienEs(req));
  if (limite) {
    if (limite === "total") console.error("[chat] se alcanzó el tope diario de mensajes (CHAT_LIMITE_DIARIO)");
    return responderJson(res, 429,
      { error: limite === "minuto" ? "Demasiadas preguntas seguidas. Espera un momento." : "El personaje ya descansa por hoy. ¡Sigue jugando, las misiones funcionan sin chat!" },
      { "Retry-After": limite === "minuto" ? "60" : "3600" });
  }

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": llave, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: MODELO,
        max_tokens: MAX_TOKENS,
        temperature: 0.7,
        system: consulta.sistema,
        messages: [{ role: "user", content: consulta.mensaje }],
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      // el detalle (llave inválida, sin crédito, modelo inexistente…) solo va al registro del servidor
      console.error("[chat] Anthropic respondió", r.status, data?.error?.type || "", data?.error?.message || "");
      return responderJson(res, 502, { error: "El personaje no puede contestar ahorita." });
    }
    const texto = (data.content || []).map((c) => (c.type === "text" ? c.text : "")).join("").trim();
    return responderJson(res, 200, { texto });
  } catch (e) {
    console.error("[chat] error al consultar Anthropic:", e.message);
    return responderJson(res, 502, { error: "El personaje no puede contestar ahorita." });
  }
}
