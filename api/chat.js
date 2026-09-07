/**
 * Función serverless (Vercel) que conversa con Claude.
 * La API key vive solo aquí, en el servidor. Nunca llega al navegador.
 *
 * Variable de entorno requerida: ANTHROPIC_API_KEY
 */

const MODELO = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
const MAX_MENSAJES = 10;
const MAX_LARGO_MENSAJE = 600;   // lo que escribe un niño en el chat
const MAX_LARGO_SISTEMA = 4000;  // el prompt lo arma el propio juego

/* ---------------------------- rate limiting ----------------------------
   Ventana deslizante en memoria. En Vercel cada instancia tiene la suya,
   así que no es un candado perfecto, pero sí frena el abuso obvio de un
   salón entero o de un bot. Para un límite duro conviene Upstash/Redis.
------------------------------------------------------------------------ */

const VENTANA_MS = 60_000;
const MAX_POR_VENTANA = 12;
const visitas = new Map();

function quienEs(req) {
  const cabecera = req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "";
  return String(cabecera).split(",")[0].trim() || req.socket?.remoteAddress || "anonimo";
}

function pasaElLimite(id) {
  const ahora = Date.now();
  const previas = (visitas.get(id) || []).filter((t) => ahora - t < VENTANA_MS);
  previas.push(ahora);
  visitas.set(id, previas);

  // limpieza para que el mapa no crezca sin fin
  if (visitas.size > 500) {
    for (const [llave, tiempos] of visitas) {
      if (!tiempos.some((t) => ahora - t < VENTANA_MS)) visitas.delete(llave);
    }
  }

  return previas.length <= MAX_POR_VENTANA;
}

async function leerCuerpo(req) {
  if (req.body) {
    return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  }
  const partes = [];
  for await (const trozo of req) partes.push(trozo);
  return JSON.parse(Buffer.concat(partes).toString("utf8") || "{}");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: "Usa POST" }));
  }

  const llave = process.env.ANTHROPIC_API_KEY;
  if (!llave) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    return res.end(
      JSON.stringify({ error: "Falta ANTHROPIC_API_KEY en las variables de entorno" })
    );
  }

  if (!pasaElLimite(quienEs(req))) {
    res.statusCode = 429;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Retry-After", "60");
    return res.end(
      JSON.stringify({ error: "Demasiadas preguntas seguidas. Espera un momento." })
    );
  }

  try {
    const { system, messages } = await leerCuerpo(req);

    if (!Array.isArray(messages) || messages.length === 0) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ error: "Faltan mensajes" }));
    }

    const limpios = messages
      .slice(-MAX_MENSAJES)
      .map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: String(m?.content ?? "").trim().slice(0, MAX_LARGO_MENSAJE),
      }))
      .filter((m) => m.content.length > 0);

    if (limpios.length === 0) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ error: "El mensaje llegó vacío" }));
    }

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": llave,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELO,
        max_tokens: 700,
        temperature: 0.7,
        system: String(system || "").slice(0, MAX_LARGO_SISTEMA),
        messages: limpios,
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      res.statusCode = r.status;
      res.setHeader("Content-Type", "application/json");
      return res.end(
        JSON.stringify({ error: data?.error?.message || "Error de la API" })
      );
    }

    const texto = (data.content || [])
      .map((c) => (c.type === "text" ? c.text : ""))
      .join("")
      .trim();

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    return res.end(JSON.stringify({ texto }));
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ error: "No se pudo procesar la respuesta" }));
  }
}
