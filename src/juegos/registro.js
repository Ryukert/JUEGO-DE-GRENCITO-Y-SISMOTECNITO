/**
 * Catálogo de minijuegos.
 *
 * Esta es la única lista de la que sale el Centro de entrenamiento. Para
 * agregar un juego nuevo se mete una entrada aquí; no hay que tocar el
 * ruteo ni la pantalla del centro.
 *
 * Campos de cada juego:
 *   id           identificador estable (se usa para guardar el récord)
 *   nombre, icono, descripcion, comoSeJuega
 *   familia      "tecnito" | "greencito" | "general"  → decide la moneda
 *   categoria    subsección dentro del centro
 *   personaje    "sismo" | "green"  → tema visual y mascota
 *   motor        componente que lo juega
 *   xp           XP necesaria para desbloquearlo (0 = disponible desde el inicio)
 *   dificultades cuáles se ofrecen (por omisión, las tres)
 *   + los datos que necesite su motor (banco, escenas, rutas, cultivo...)
 */

import Quiz from "./motores/Quiz.jsx";
import Busca from "./motores/Busca.jsx";
import Clasifica from "./motores/Clasifica.jsx";
import Ruta from "./motores/Ruta.jsx";
import Cultiva from "./motores/Cultiva.jsx";
import { MemoramaCentro, SimulacroCentro, BasuraCentro } from "./motores/Clasicos.jsx";

export const FAMILIAS = {
  tecnito: { id: "tecnito", nombre: "Tecnito", icono: "🛡️", moneda: "escudos", monedaIcono: "🛡️" },
  greencito: { id: "greencito", nombre: "Greencito", icono: "🌱", moneda: "semillas", monedaIcono: "🌱" },
  general: { id: "general", nombre: "Desafíos", icono: "🧠", moneda: "puntos", monedaIcono: "⭐" },
};

export const JUEGOS = [
  /* ============================ 🛡️ TECNITO ============================ */
  {
    id: "ruta-evacuacion",
    nombre: "Ruta de evacuación",
    icono: "🏃",
    familia: "tecnito",
    categoria: "Evacuación",
    personaje: "sismo",
    motor: Ruta,
    rutas: "ruta-evacuacion",
    xp: 0,
    descripcion: "Sal del edificio por la ruta segura antes de que se acabe el tiempo.",
    comoSeJuega: "Muévete con las flechas, WASD o la cruceta. Esquiva las zonas de riesgo y recoge el extintor.",
  },
  {
    id: "agachate",
    nombre: "Agáchate, cúbrete y agárrate",
    icono: "🛡️",
    familia: "tecnito",
    categoria: "Sismos",
    personaje: "sismo",
    motor: Quiz,
    banco: "agachate",
    rondas: 8,
    segundos: 14,
    xp: 0,
    descripcion: "Está temblando en distintos lugares. Elige rápido la acción correcta.",
    comoSeJuega: "Poco tiempo por situación. Cada error explica qué había que hacer.",
  },
  {
    id: "casa-segura",
    nombre: "Casa segura",
    icono: "🏠",
    familia: "tecnito",
    categoria: "Sismos",
    personaje: "sismo",
    motor: Busca,
    escenas: "casa-segura",
    objetivos: 5,
    segundos: 60,
    verbo: "riesgos",
    xp: 0,
    descripcion: "Encuentra los riesgos de una casa antes de que tiemble.",
    comoSeJuega: "Toca lo que puede caerse, romperse o bloquear la salida. Tocar algo seguro cuesta una vida.",
  },
  {
    id: "mochila-emergencia",
    nombre: "Mochila de emergencia",
    icono: "🎒",
    familia: "tecnito",
    categoria: "Emergencias",
    personaje: "sismo",
    motor: Clasifica,
    clasificacion: "mochila-emergencia",
    rondas: 10,
    segundos: 8,
    xp: 0,
    descripcion: "Decide qué se va a la mochila y qué se queda en casa.",
    comoSeJuega: "Arrastra el objeto al contenedor o toca el contenedor directamente.",
  },
  {
    id: "simulacro",
    nombre: "Simulacro relámpago",
    icono: "🚨",
    familia: "tecnito",
    categoria: "Sismos",
    personaje: "sismo",
    motor: SimulacroCentro,
    xp: 0,
    dificultades: ["facil", "dificil"],
    descripcion: "Toca las tres acciones en orden mientras la pantalla tiembla.",
    comoSeJuega: "Agáchate, cúbrete y agárrate. Cuidado con los botones trampa.",
  },
  {
    id: "escuela-segura",
    nombre: "Escuela segura",
    icono: "🏫",
    familia: "tecnito",
    categoria: "Evacuación",
    personaje: "sismo",
    motor: Busca,
    escenas: "escuela-segura",
    objetivos: 5,
    segundos: 60,
    verbo: "fallas",
    xp: 40,
    descripcion: "Revisa el pasillo de tu escuela y encuentra las fallas de seguridad.",
    comoSeJuega: "Busca salidas bloqueadas, extintores vencidos y señales borradas.",
  },
  {
    id: "detective-riesgos",
    nombre: "Detective de riesgos",
    icono: "🔎",
    familia: "tecnito",
    categoria: "Emergencias",
    personaje: "sismo",
    motor: Busca,
    escenas: "detective-riesgos",
    objetivos: 5,
    segundos: 50,
    verbo: "riesgos",
    xp: 60,
    descripcion: "Cinco cosas en esta recámara pueden lastimarte si tiembla de noche.",
    comoSeJuega: "Encuéntralas todas antes de que se acabe el tiempo.",
  },
  {
    id: "incendio",
    nombre: "Incendio",
    icono: "🔥",
    familia: "tecnito",
    categoria: "Incendios",
    personaje: "sismo",
    motor: Quiz,
    banco: "incendio",
    rondas: 8,
    segundos: 18,
    xp: 60,
    descripcion: "Ocho situaciones de incendio. Decide qué haces en cada una.",
  },
  {
    id: "llamada-emergencia",
    nombre: "Llamada de emergencia",
    icono: "🚑",
    familia: "tecnito",
    categoria: "Emergencias",
    personaje: "sismo",
    motor: Quiz,
    banco: "llamada-emergencia",
    rondas: 6,
    segundos: 20,
    piel: "llamada",
    xp: 80,
    descripcion: "Estás llamando al 911. Da bien la información que te piden.",
    comoSeJuega: "Qué pasó, dónde, cuántas personas y qué riesgos hay.",
  },
  {
    id: "extintor",
    nombre: "Extintor correcto",
    icono: "🧯",
    familia: "tecnito",
    categoria: "Incendios",
    personaje: "sismo",
    motor: Quiz,
    banco: "extintor",
    rondas: 6,
    segundos: 20,
    xp: 100,
    descripcion: "Cada tipo de fuego necesita su extintor. Elige el correcto.",
  },
  {
    id: "fuga-gas",
    nombre: "Fuga de gas",
    icono: "☁️",
    familia: "tecnito",
    categoria: "Emergencias",
    personaje: "sismo",
    motor: Quiz,
    banco: "fuga-gas",
    rondas: 5,
    segundos: 18,
    xp: 120,
    descripcion: "Huele a gas. Una chispa basta: elige bien cada paso.",
  },
  {
    id: "volcan",
    nombre: "Volcán",
    icono: "🌋",
    familia: "tecnito",
    categoria: "Fenómenos naturales",
    personaje: "sismo",
    motor: Quiz,
    banco: "volcan",
    rondas: 4,
    segundos: 20,
    xp: 150,
    descripcion: "Semáforo volcánico, ceniza y evacuación.",
  },
  {
    id: "inundacion",
    nombre: "Inundación",
    icono: "🌊",
    familia: "tecnito",
    categoria: "Fenómenos naturales",
    personaje: "sismo",
    motor: Quiz,
    banco: "inundacion",
    rondas: 4,
    segundos: 20,
    xp: 150,
    descripcion: "El agua sube. Identifica las zonas seguras y decide.",
  },

  /* =========================== 🌱 GREENCITO =========================== */
  {
    id: "clasifica-basura",
    nombre: "Clasifica la basura",
    icono: "♻️",
    familia: "greencito",
    categoria: "Reciclaje",
    personaje: "green",
    motor: Clasifica,
    clasificacion: "clasifica-basura",
    rondas: 12,
    segundos: 8,
    xp: 0,
    descripcion: "Seis contenedores: orgánico, papel, plástico, vidrio, metal y no reciclable.",
    comoSeJuega: "Arrastra el residuo al contenedor o tócalo directamente.",
  },
  {
    id: "planta-arbol",
    nombre: "Planta un árbol",
    icono: "🌱",
    familia: "greencito",
    categoria: "Naturaleza",
    personaje: "green",
    motor: Cultiva,
    cultivo: "planta-arbol",
    xp: 0,
    descripcion: "Especie, temporada, hoyo, agua y cuidados. El árbol crece con tus decisiones.",
    comoSeJuega: "Sin cronómetro: aquí se trata de pensarle.",
  },
  {
    id: "repara-fuga",
    nombre: "Repara la fuga",
    icono: "💧",
    familia: "greencito",
    categoria: "Agua",
    personaje: "green",
    motor: Busca,
    escenas: "repara-fuga",
    objetivos: 5,
    segundos: 50,
    verbo: "fugas",
    xp: 0,
    descripcion: "Encuentra por dónde se está yendo el agua de la casa.",
    comoSeJuega: "Toca cada fuga para repararla. Ojo: no todo lo que gotea es fuga.",
  },
  {
    id: "carrera-reciclaje",
    nombre: "Carrera del reciclaje",
    icono: "🏃",
    familia: "greencito",
    categoria: "Reciclaje",
    personaje: "green",
    motor: BasuraCentro,
    xp: 0,
    dificultades: ["facil", "dificil"],
    descripcion: "Llegan diez residuos, uno por uno, contra reloj.",
    comoSeJuega: "Orgánico, reciclable o peligroso. Tres seguidos y los puntos se duplican.",
  },
  {
    id: "ahorra-agua",
    nombre: "Ahorra agua",
    icono: "🚿",
    familia: "greencito",
    categoria: "Agua",
    personaje: "green",
    motor: Quiz,
    banco: "ahorra-agua",
    rondas: 6,
    segundos: 18,
    xp: 40,
    descripcion: "Situaciones de consumo diario. Elige la opción más eficiente.",
  },
  {
    id: "apaga-luces",
    nombre: "Apaga las luces",
    icono: "💡",
    familia: "greencito",
    categoria: "Energía",
    personaje: "green",
    motor: Busca,
    escenas: "apaga-luces",
    objetivos: 5,
    segundos: 45,
    verbo: "aparatos",
    xp: 60,
    descripcion: "Encuentra todo lo que está gastando luz sin que nadie lo use.",
    comoSeJuega: "Cuidado: hay cosas que sí deben quedarse encendidas.",
  },
  {
    id: "limpia-rio",
    nombre: "Limpia el río",
    icono: "🌊",
    familia: "greencito",
    categoria: "Naturaleza",
    personaje: "green",
    motor: Busca,
    escenas: "limpia-rio",
    objetivos: 5,
    segundos: 50,
    verbo: "residuos",
    xp: 80,
    descripcion: "Saca la basura del río sin molestar a lo que sí vive ahí.",
  },
  {
    id: "transporte",
    nombre: "Transporte sostenible",
    icono: "🚲",
    familia: "greencito",
    categoria: "Cambio climático",
    personaje: "green",
    motor: Quiz,
    banco: "transporte",
    rondas: 5,
    segundos: 18,
    xp: 100,
    descripcion: "Elige cómo moverte con el menor impacto posible.",
  },
  {
    id: "reforestacion",
    nombre: "Reforestación",
    icono: "🌳",
    familia: "greencito",
    categoria: "Naturaleza",
    personaje: "green",
    motor: Cultiva,
    cultivo: "reforestacion",
    xp: 140,
    descripcion: "Un cerro pelón completo. Piensa en el sistema, no en un árbol.",
    comoSeJuega: "Cinco decisiones grandes: dónde, qué especies, suelo, ganado y seguimiento.",
  },

  /* ============================ 🧠 DESAFÍOS ============================ */
  {
    id: "quiz-relampago",
    nombre: "Quiz relámpago",
    icono: "⚡",
    familia: "general",
    categoria: "Velocidad",
    personaje: "sismo",
    motor: Quiz,
    banco: "quiz-relampago",
    rondas: 10,
    segundos: 12,
    xp: 0,
    descripcion: "Preguntas de todo, contra reloj. Mezcla Tecnito y Greencito.",
  },
  {
    id: "verdadero-falso",
    nombre: "Verdadero o falso",
    icono: "🔴",
    familia: "general",
    categoria: "Lógica",
    personaje: "green",
    motor: Quiz,
    banco: "verdadero-falso",
    rondas: 10,
    segundos: 14,
    xp: 0,
    descripcion: "Afirmaciones que suenan bien pero no siempre lo son.",
  },
  {
    id: "memorama",
    nombre: "Memorama educativo",
    icono: "🧠",
    familia: "general",
    categoria: "Memoria",
    personaje: "sismo",
    motor: MemoramaCentro,
    xp: 0,
    dificultades: ["facil", "dificil"],
    descripcion: "Seis parejas contra reloj. Cada acierto suelta un dato.",
    comoSeJuega: "En difícil no emparejas cartas iguales: emparejas la situación con su respuesta.",
  },
];

export const POR_ID = Object.fromEntries(JUEGOS.map((j) => [j.id, j]));

/** Categorías en el orden en que se muestran en el Centro. */
export function categoriasDe(familia) {
  const vistas = [];
  JUEGOS.filter((j) => j.familia === familia).forEach((j) => {
    if (!vistas.includes(j.categoria)) vistas.push(j.categoria);
  });
  return vistas;
}

/**
 * Un juego se desbloquea con XP acumulada. Es a propósito generoso:
 * la mitad del catálogo está disponible desde el primer minuto.
 */
export function estaDesbloqueado(juego, progreso) {
  return (progreso?.xp || 0) >= (juego.xp || 0);
}

export function siguienteEnDesbloquear(progreso) {
  const xp = progreso?.xp || 0;
  return JUEGOS.filter((j) => j.xp > xp).sort((a, b) => a.xp - b.xp)[0] || null;
}
