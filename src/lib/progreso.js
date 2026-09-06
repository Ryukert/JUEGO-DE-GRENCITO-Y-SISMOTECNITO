/**
 * Progreso guardado en el navegador: récords, insignias y grado escolar.
 * Si el almacenamiento está bloqueado, el juego sigue funcionando en memoria.
 */

const LLAVE = "escuadron-progreso-v1";

const VACIO = {
  grado: null,
  records: { sismo: 0, green: 0 },
  insignias: [],
  partidas: 0,
};

let memoria = { ...VACIO };

export function leerProgreso() {
  try {
    const crudo = localStorage.getItem(LLAVE);
    if (crudo) memoria = { ...VACIO, ...JSON.parse(crudo) };
  } catch (e) {}
  return memoria;
}

function guardar() {
  try {
    localStorage.setItem(LLAVE, JSON.stringify(memoria));
  } catch (e) {}
}

export function guardarGrado(grado) {
  memoria.grado = grado;
  guardar();
}

export function registrarPartida({ personaje, puntos, insignias }) {
  memoria.partidas += 1;
  const antes = memoria.records[personaje] || 0;
  const nuevoRecord = puntos > antes;
  if (nuevoRecord) memoria.records[personaje] = puntos;
  memoria.insignias = [...new Set([...memoria.insignias, ...insignias])];
  guardar();
  return { nuevoRecord, recordAnterior: antes };
}

export function borrarProgreso() {
  memoria = { ...VACIO };
  try {
    localStorage.removeItem(LLAVE);
  } catch (e) {}
  return memoria;
}

export const RANGOS = [
  { min: 0, nombre: "Aprendiz", icono: "🔰" },
  { min: 120, nombre: "Vigilante", icono: "🥉" },
  { min: 220, nombre: "Guardián", icono: "🥈" },
  { min: 320, nombre: "Capitán", icono: "🥇" },
  { min: 420, nombre: "Leyenda", icono: "👑" },
];

export function rangoPara(puntos) {
  return [...RANGOS].reverse().find((r) => puntos >= r.min) || RANGOS[0];
}
