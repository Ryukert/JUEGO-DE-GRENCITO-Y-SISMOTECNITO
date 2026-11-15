/**
 * Correos institucionales: a la administración solo se entra con un correo de estos dominios
 * (también sus subdominios, p. ej. «facultad.uabc.edu.mx»). Lo usan el servidor (api/_admin.js),
 * que rechaza cualquier otro antes de preguntar a Supabase, y la pantalla de entrada.
 * Para aceptar otra institución, se agrega su dominio aquí.
 */
export const DOMINIOS_INSTITUCIONALES = ["uabc.edu.mx"];

/** ¿El correo es de un dominio institucional? */
export function esCorreoInstitucional(correo, dominios = DOMINIOS_INSTITUCIONALES) {
  const dominio = String(correo ?? "").trim().toLowerCase().split("@")[1] || "";
  return dominios.some((d) => dominio === d || dominio.endsWith("." + d));
}

/** «@uabc.edu.mx» (o «@uabc.edu.mx o @otra.mx»), para los mensajes. */
export const dominiosEnTexto = (dominios = DOMINIOS_INSTITUCIONALES) => dominios.map((d) => "@" + d).join(" o ");
