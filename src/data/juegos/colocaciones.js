/**
 * Datos del motor Coloca.jsx.
 *
 * Hay una cuadrícula de terreno donde cada casilla rinde distinto. El
 * jugador coloca una cantidad limitada de equipos y al final se calcula
 * cuánta energía produce el conjunto.
 *
 * Cada casilla:
 *   tipo       clave del terreno (ver `terrenos`)
 *   El rendimiento sale de `terrenos[tipo].rinde` (0 a 100).
 *
 * `pistas` son las señales visibles para que el jugador pueda razonar
 * dónde poner las cosas en vez de adivinar.
 */

export const COLOCACIONES = {
  /* ------------------------ ☀️ Construye un sistema solar ------------------------ */
  "energia-solar": {
    titulo: "Sistema solar en el techo",
    unidad: "☀️",
    nombreUnidad: "panel",
    equipos: 5,
    medida: "kWh al día",
    factor: 0.09,
    pista: "El sol de mediodía pega desde arriba. La sombra del árbol y del tinaco se mueve, pero siempre cae del mismo lado.",
    terrenos: {
      sol: { icono: "", nombre: "Techo despejado al sur", rinde: 100, color: "#f7e6b0", explicacion: "Sin sombra y con buena orientación: el mejor lugar del techo." },
      medio: { icono: "", nombre: "Techo con sombra parcial", rinde: 55, color: "#e6dfc4", explicacion: "Recibe sol medio día. Produce, pero a la mitad." },
      sombra: { icono: "🌳", nombre: "Bajo la sombra del árbol", rinde: 10, color: "#bcc9a8", explicacion: "Un panel a la sombra casi no produce, y de paso baja el rendimiento de la cadena entera." },
      tinaco: { icono: "🛢️", nombre: "Tinaco", rinde: 0, color: "#c2cbd4", explicacion: "Ahí no cabe un panel." },
      norte: { icono: "🧭", nombre: "Faldón norte del techo", rinde: 35, color: "#d6dbe0", explicacion: "En México los paneles van al sur: el faldón norte recibe mucho menos sol." },
    },
    mapa: [
      ["norte", "norte", "norte", "norte", "norte"],
      ["medio", "sol", "sol", "medio", "tinaco"],
      ["sombra", "sol", "sol", "sol", "medio"],
      ["sombra", "sombra", "medio", "sol", "sol"],
    ],
    lecciones: [
      "Los paneles van al sur y sin sombra. Una sola sombra parcial puede tirar el rendimiento de toda una cadena de paneles.",
      "Vale más poner menos paneles bien orientados que muchos a media sombra.",
      "El tinaco y las antenas se toman en cuenta desde el diseño: su sombra se mueve durante el día.",
    ],
  },

  /* ---------------------------- 🌬️ Energía eólica ---------------------------- */
  "energia-eolica": {
    titulo: "Parque eólico de la comunidad",
    unidad: "🌬️",
    nombreUnidad: "aerogenerador",
    equipos: 4,
    medida: "MWh al año",
    factor: 4.2,
    pista: "El viento entra por el paso entre los cerros. Detrás de una loma se frena, y una turbina le roba viento a la que tiene justo atrás.",
    terrenos: {
      cresta: { icono: "", nombre: "Cresta abierta al viento", rinde: 100, color: "#cfe3f7", explicacion: "Viento limpio y constante: es donde de verdad se ponen los aerogeneradores." },
      loma: { icono: "", nombre: "Ladera media", rinde: 60, color: "#dbe6ef", explicacion: "Algo de viento, pero turbulento por el relieve." },
      abrigo: { icono: "⛰️", nombre: "Detrás del cerro", rinde: 15, color: "#b9c4b0", explicacion: "El cerro corta el viento. Ahí una turbina casi no gira." },
      bosque: { icono: "🌲", nombre: "Bosque", rinde: 20, color: "#a8c295", explicacion: "Los árboles frenan el viento y además habría que talarlos: doble mala idea." },
      pueblo: { icono: "🏘️", nombre: "Casas", rinde: 0, color: "#e0d3bd", explicacion: "No se ponen turbinas encima de la gente: ruido, sombra parpadeante y riesgo." },
    },
    mapa: [
      ["abrigo", "abrigo", "loma", "cresta", "cresta"],
      ["bosque", "loma", "cresta", "cresta", "loma"],
      ["bosque", "loma", "loma", "cresta", "loma"],
      ["pueblo", "pueblo", "abrigo", "loma", "abrigo"],
    ],
    lecciones: [
      "El viento se estudia un año entero antes de decidir dónde va cada turbina.",
      "Dos turbinas muy juntas en la misma línea de viento compiten: la de atrás recibe aire revuelto.",
      "Un parque eólico se planea con la comunidad: distancia a las casas, ruido y reparto del beneficio.",
    ],
    /* penalización si dos equipos quedan en la misma columna (estela) */
    penalizaColumna: true,
  },
};
