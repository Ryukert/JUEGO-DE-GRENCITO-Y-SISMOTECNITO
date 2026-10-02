/**
 * Mapas del motor Ruta.jsx (ruta de evacuación).
 *
 * Cada mapa es un arreglo de renglones del mismo largo. Símbolos:
 *
 *   #  muro
 *   .  piso libre
 *   J  jugador (inicio)
 *   S  salida segura (la meta)
 *   X  zona peligrosa: cuesta una vida y explica por qué
 *   T  trampa señalizada: elevador, ventanal... explica y cuesta vida
 *   E  extintor / objeto que suma puntos
 *   P  punto de reunión (suma puntos, opcional)
 *   R  escombro de una réplica (no se escribe: lo pone el motor al temblar)
 *
 * Los mapas están pensados para caber en pantalla de celular: máximo 13
 * columnas. La dificultad elige qué nivel toca (posición 0, 1 o 2). Un
 * nivel puede ser una lista de variantes; se elige una al azar.
 *
 * Campos opcionales de cada nivel:
 *
 *   generar          en vez de `mapa`: arma un laberinto nuevo cada partida
 *                    (ver src/lib/laberinto.js)
 *   voltear          voltea el mapa en espejo al azar
 *   segundosPorPaso  el tiempo sale del largo de la ruta segura más corta,
 *                    no de `segundos`; luego se ajusta con la dificultad
 *   replicas         { cada, cuantas, enRuta }: cada tantos segundos tiembla
 *                    y cae escombro; con enRuta el primero cae en tu camino
 *   vision           casillas que alumbra la linterna; lo demás está oscuro
 *   castigo          segundos que se pierden al chocar con un peligro
 */

export const RUTAS = {
  /* Los tres niveles son laberintos nuevos en cada partida: no hay mapa
     que aprenderse de memoria. */
  "ruta-evacuacion": [
    /* Fácil: se ve todo, pero las réplicas tapan tu camino seguido. */
    {
      id: "pasillos-revueltos",
      titulo: "Pasillos después del sismo",
      pista: "Cada vez es un edificio distinto. Las réplicas tiran escombro: busca otra ruta.",
      generar: { columnas: 11, filas: 11, peligros: 4, elevadores: 1, extintores: 2, atajos: 0.15 },
      segundosPorPaso: 0.8,
      castigo: 2,
      replicas: { cada: 10, cuantas: 1, enRuta: true },
    },

    /* Medio: edificio más grande y sin luz; la linterna alumbra poco. */
    {
      id: "edificio-sin-luz",
      titulo: "Se fue la luz",
      pista: "Solo ves lo que alumbra tu linterna. Las señales de salida brillan en la oscuridad.",
      generar: { columnas: 13, filas: 13, peligros: 6, elevadores: 2, extintores: 3, atajos: 0.12 },
      segundosPorPaso: 0.9,
      castigo: 3,
      vision: 2,
      replicas: { cada: 7, cuantas: 2, enRuta: true },
    },

    /* Difícil: casi a ciegas, réplicas sin descanso y cada choque cuesta
       vida y tiempo. */
    {
      id: "edificio-a-ciegas",
      titulo: "A oscuras y temblando",
      pista: "Tu linterna apenas alumbra. Réplicas cada pocos segundos y cada choque te quita tiempo.",
      generar: { columnas: 13, filas: 15, peligros: 8, elevadores: 2, extintores: 3, atajos: 0.1 },
      segundosPorPaso: 1.1,
      castigo: 5,
      vision: 1,
      replicas: { cada: 5, cuantas: 2, enRuta: true },
    },
  ],

  /* ------------------------- 🐝 Polinizadores -------------------------
     Aquí la meta cambia: hay que visitar TODAS las flores (E) antes de
     volver a la colmena (S). El motor lo activa con `recolectarTodo`. */
  polinizadores: [
    {
      id: "jardin",
      titulo: "El jardín de la escuela",
      pista: "Visita todas las flores y regresa a la colmena. El insecticida y el asfalto caliente te frenan.",
      segundos: 50,
      mapa: [
        "#########",
        "#J.E...E#",
        "#.###.#.#",
        "#E..X...#",
        "#.#.###.#",
        "#...E..E#",
        "#.###.#.#",
        "#E....#S#",
        "#########",
      ],
    },
    {
      id: "milpa",
      titulo: "La milpa",
      pista: "Más flores, menos tiempo. Esquiva las zonas fumigadas.",
      segundos: 60,
      mapa: [
        "##########",
        "#J.E..X.E#",
        "#.##.##..#",
        "#E..E...E#",
        "#.#.##.#.#",
        "#..E..X..#",
        "#.###.##.#",
        "#E...E..E#",
        "#.####.#S#",
        "##########",
      ],
    },
    {
      id: "cerro",
      titulo: "El cerro florido",
      pista: "Todas las flores del cerro antes de que se acabe el día.",
      segundos: 75,
      mapa: [
        "###########",
        "#J.E...X.E#",
        "#.##.##.#.#",
        "#E...E...E#",
        "#.#.##.##.#",
        "#..E..X..E#",
        "#.##.##.#.#",
        "#E...E...E#",
        "#.#.##.##.#",
        "#..E...E..#",
        "#.#######S#",
        "###########",
      ],
    },
  ],
};

export const LECCIONES_RUTA = {
  X: [
    {
      titulo: "Zona de riesgo",
      texto: "Pasaste bajo un ventanal y junto a un librero suelto. En una evacuación se rodean las zonas donde algo puede caer.",
      dato: "Las rutas de evacuación se marcan justamente para esquivar estos puntos.",
    },
    {
      titulo: "Escombro en el paso",
      texto: "Ahí hay cosas caídas. Cruzar escombro en la oscuridad es cómo se tuerce un tobillo y se atora toda la fila.",
      dato: "Un pasillo de evacuación necesita 90 cm libres, siempre.",
    },
  ],
  E: [],
  T: [
    {
      titulo: "Eso no es una salida",
      texto: "Ese es el elevador. Durante o después de un sismo nunca se usa: se puede quedar atorado sin luz.",
      dato: "Los elevadores modernos se detienen solos en el piso más cercano al sentir movimiento.",
    },
  ],
  R: [
    {
      titulo: "Cayó con la réplica",
      texto: "Las réplicas tiran lo que el primer sismo dejó flojo. Si el camino se tapa, no se trepa el escombro: se busca otra ruta.",
      dato: "Después de un sismo fuerte puede haber réplicas durante días o semanas.",
    },
    {
      titulo: "Camino tapado",
      texto: "Escombro recién caído puede seguir moviéndose. Rodéalo aunque tardes un poco más.",
      dato: "Por eso los simulacros practican más de una ruta de salida.",
    },
  ],
};
