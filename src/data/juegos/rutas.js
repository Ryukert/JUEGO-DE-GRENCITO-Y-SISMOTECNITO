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
 *
 * Los mapas están pensados para caber en pantalla de celular: máximo 11
 * columnas. La dificultad elige qué mapa toca y cuánto tiempo hay.
 */

export const RUTAS = {
  "ruta-evacuacion": [
    {
      id: "salon",
      titulo: "Tu salón de clases",
      pista: "Sal del salón al patio sin pasar por las zonas de riesgo.",
      segundos: 45,
      mapa: [
        "###########",
        "#J...#....#",
        "#.##.#.##.#",
        "#.#X.....E#",
        "#.#.###.#.#",
        "#.......#.#",
        "#T##.##.#.#",
        "#....#....#",
        "####.####S#",
      ],
    },
    {
      id: "pasillo",
      titulo: "El pasillo del segundo piso",
      pista: "El elevador no es salida. Busca la escalera.",
      segundos: 55,
      mapa: [
        "###########",
        "#J..#....E#",
        "#.#.#.##..#",
        "#.#....#X.#",
        "#.####.#..#",
        "#....#.#.T#",
        "#.##.#.#..#",
        "#..X.....P#",
        "#####.###S#",
      ],
    },
    {
      id: "edificio",
      titulo: "Todo el edificio",
      pista: "Recoge el extintor, evita el ventanal y llega al punto de reunión.",
      segundos: 70,
      mapa: [
        "###########",
        "#J..#..X..#",
        "#.#.#.###.#",
        "#.#.....#E#",
        "#.###.#.#.#",
        "#T..#.#...#",
        "##.##.###.#",
        "#....X..#.#",
        "#.####..#.#",
        "#....##.#P#",
        "####.....S#",
      ],
    },
  ],

  /* Significado de cada casilla, para el mensaje educativo del motor. */
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
  T: [
    {
      titulo: "Eso no es una salida",
      texto: "Ese es el elevador. Durante o después de un sismo nunca se usa: se puede quedar atorado sin luz.",
      dato: "Los elevadores modernos se detienen solos en el piso más cercano al sentir movimiento.",
    },
  ],
};
