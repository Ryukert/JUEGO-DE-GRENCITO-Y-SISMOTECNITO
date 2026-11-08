/**
 * Limpia y combina dos copias del progreso (la del navegador y la de la base de datos).
 *
 * La usan el juego y el servidor (api/progreso.js), así que las dos partes combinan igual.
 * Regla: el progreso solo sube. Récords, XP y monedas se quedan con el mayor; insignias,
 * logros y dificultades superadas se juntan. Si un alumno jugó sin internet en dos equipos
 * a la vez, se conserva lo mejor de cada uno (la XP no se suma: gana la más alta).
 *
 * Repaso: `repaso.fallos[clave]` cuenta cuántas veces se falló una pregunta de misión y
 * `repaso.dominadas[clave]` cuántos de esos fallos ya se corrigieron. Las dos solo suben, así
 * que también se combinan con el mayor. Clave: «personaje:reto» o «personaje:reto:b» (bonificación).
 */

const MAXIMO = 10_000_000;
const ID = /^[a-z0-9-]{1,40}$/;
const TEXTO_CORTO = 80;
const CLAVE_REPASO = /^(sismo|green):[a-z0-9]{1,10}(:b)?$/;
const FECHA_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
const fecha = (v) => (typeof v === "string" && FECHA_ISO.test(v) ? v : null);
const mayorFecha = (a, b) => (a && b ? (a > b ? a : b) : a || b || null);

/** { clave: número } con claves de repaso válidas (máximo 300). */
const contadores = (obj) => {
  const r = {};
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return r;
  for (const [k, v] of Object.entries(obj).slice(0, 300)) if (CLAVE_REPASO.test(k) && numero(v) > 0) r[k] = Math.min(numero(v), 10_000);
  return r;
};
const juntarContadores = (a, b) => {
  const r = { ...a };
  for (const [k, v] of Object.entries(b)) r[k] = Math.max(r[k] || 0, v);
  return r;
};

const numero = (v) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n > 0 ? Math.min(n, MAXIMO) : 0;
};
const textos = (lista, max = 300) =>
  Array.isArray(lista)
    ? [...new Set(lista.filter((t) => typeof t === "string" && t.length > 0 && t.length <= TEXTO_CORTO))].slice(0, max)
    : [];
const juntar = (a, b, max) => textos([...(a || []), ...(b || [])], max);

/** Deja el progreso con la forma que espera el juego, sin nada de más. */
export function limpiarProgreso(crudo) {
  const c = crudo && typeof crudo === "object" && !Array.isArray(crudo) ? crudo : {};
  const records = {};
  for (const id of ["sismo", "green"]) records[id] = numero(c.records?.[id]);
  const juegos = {};
  const fuente = c.juegos && typeof c.juegos === "object" ? c.juegos : {};
  for (const [id, j] of Object.entries(fuente).slice(0, 300)) {
    if (!ID.test(id) || !j || typeof j !== "object") continue;
    juegos[id] = {
      record: numero(j.record),
      partidas: numero(j.partidas),
      mejorPrecision: Math.min(100, numero(j.mejorPrecision)),
      dificultades: textos(j.dificultades, 10),
      ...(fecha(j.jugadoEn) ? { jugadoEn: fecha(j.jugadoEn) } : {}),
    };
  }
  const repaso = c.repaso && typeof c.repaso === "object" ? c.repaso : {};
  return {
    version: 2,
    grado: c.grado === "primaria" || c.grado === "secundaria" ? c.grado : null,
    records,
    insignias: textos(c.insignias),
    partidas: numero(c.partidas),
    xp: numero(c.xp),
    escudos: numero(c.escudos),
    semillas: numero(c.semillas),
    juegos,
    logros: textos(c.logros),
    repaso: { fallos: contadores(repaso.fallos), dominadas: contadores(repaso.dominadas) },
  };
}

/** Combina dos copias; si las dos dicen un grado distinto, gana el de `nuevo`. */
export function mezclarProgreso(viejo, nuevo) {
  const a = limpiarProgreso(viejo);
  const b = limpiarProgreso(nuevo);
  const juegos = { ...a.juegos };
  for (const [id, j] of Object.entries(b.juegos)) {
    const antes = juegos[id];
    juegos[id] = antes
      ? {
          record: Math.max(antes.record, j.record),
          partidas: Math.max(antes.partidas, j.partidas),
          mejorPrecision: Math.max(antes.mejorPrecision, j.mejorPrecision),
          dificultades: juntar(antes.dificultades, j.dificultades, 10),
          ...(mayorFecha(antes.jugadoEn, j.jugadoEn) ? { jugadoEn: mayorFecha(antes.jugadoEn, j.jugadoEn) } : {}),
        }
      : j;
  }
  return {
    version: 2,
    grado: b.grado || a.grado,
    records: {
      sismo: Math.max(a.records.sismo, b.records.sismo),
      green: Math.max(a.records.green, b.records.green),
    },
    insignias: juntar(a.insignias, b.insignias),
    partidas: Math.max(a.partidas, b.partidas),
    xp: Math.max(a.xp, b.xp),
    escudos: Math.max(a.escudos, b.escudos),
    semillas: Math.max(a.semillas, b.semillas),
    juegos,
    logros: juntar(a.logros, b.logros),
    repaso: {
      fallos: juntarContadores(a.repaso.fallos, b.repaso.fallos),
      dominadas: juntarContadores(a.repaso.dominadas, b.repaso.dominadas),
    },
  };
}
