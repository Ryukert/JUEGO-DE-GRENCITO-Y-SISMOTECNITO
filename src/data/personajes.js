/**
 * Aquí vive todo el contenido educativo.
 * Para agregar una misión, copia un bloque y cámbiale el texto.
 * Marca con ok: true la respuesta correcta.
 */

const MISIONES_SISMO = [
  {
    id: "s1",
    titulo: "El salón se mueve",
    lugar: "Escuela primaria",
    escenario:
      "¡Ay, mis resortes! Empezó a temblar en plena clase de matemáticas y los lápices bailan sobre la mesa. Estás en la fila de en medio, lejos de la puerta. ¿Qué haces primero?",
    opciones: [
      { texto: "Correr rapidísimo a las escaleras", ok: false },
      { texto: "Agacharme, cubrirme y agarrarme junto a mi banca", ok: true },
      { texto: "Asomarme a la ventana para ver qué pasa", ok: false },
    ],
    explicacion:
      "Agacharse, cubrirse la cabeza y sujetarse es lo primero. Correr mientras el piso se mueve es como cruzar un puente que salta.",
    dato: "En Guerrero tiembla muchísimo porque debajo del mar se meten dos placas: la de Cocos y la Norteamericana.",
  },
  {
    id: "s2",
    titulo: "La mochila que salva",
    lugar: "Tu casa, un sábado",
    escenario:
      "Vamos a armar la mochila de emergencia de tu familia. Solo caben cosas útiles, nada de peso de más. ¿Qué metemos primero?",
    opciones: [
      { texto: "Agua, linterna, silbato y copias de documentos", ok: true },
      { texto: "La consola de videojuegos y unos peluches", ok: false },
      { texto: "Velitas y cerillos para hacer luz", ok: false },
    ],
    explicacion:
      "Agua, linterna, silbato, botiquín y copias de documentos. Nada de velas: si hay fuga de gas, una chispa se vuelve un problemón.",
    dato: "El silbato casi no pesa y se escucha más lejos que un grito. Es lo más subestimado de la mochila.",
  },
  {
    id: "s3",
    titulo: "Después del temblor",
    lugar: "Patio de la escuela",
    escenario:
      "Dejó de temblar y ya estamos en el punto de reunión. Todos hablan al mismo tiempo, se fue la luz y hay un olor raro que viene de la cocina. ¿Qué sigue?",
    opciones: [
      { texto: "Avisar a un adulto del olor y no encender nada", ok: true },
      { texto: "Entrar de volada por mi mochila al salón", ok: false },
      { texto: "Llamar cien veces al 911 para contarles", ok: false },
    ],
    explicacion:
      "Avisar del olor a gas y no encender nada, ni el celular cerca de la fuga. Y no volver a entrar hasta que alguien revise el edificio.",
    dato: "La línea de emergencia se satura después de un sismo. Un mensaje de texto pasa mejor que una llamada.",
  },
];

const MISIONES_GREEN = [
  {
    id: "g1",
    titulo: "La basura revuelta",
    lugar: "Patio de la escuela",
    escenario:
      "¡Ay, mis raíces! Alguien echó cáscaras de plátano, una botella y una pila usada en el mismo bote. ¿Qué hago con la pila?",
    opciones: [
      { texto: "Llevarla a un centro de acopio especial", ok: true },
      { texto: "Enterrarla en el jardín, al fin es tierra", ok: false },
      { texto: "Tirarla al bote de plástico", ok: false },
    ],
    explicacion:
      "Las pilas van a un acopio especial. Una sola pila enterrada puede contaminar miles de litros de agua subterránea.",
    dato: "Las cáscaras sí sirven: se vuelven composta y alimentan la tierra en dos o tres meses.",
  },
  {
    id: "g2",
    titulo: "Sembrar de verdad",
    lugar: "Terreno junto al río",
    escenario:
      "Vamos a plantar un arbolito en la orilla del río. Traigo tres ideas guardadas bajo el casco. ¿Cuál nos conviene?",
    opciones: [
      { texto: "Un árbol nativo de la región, en temporada de lluvias", ok: true },
      { texto: "El árbol más bonito, aunque sea de otro país", ok: false },
      { texto: "Sembrar en pleno mayo, cuando pega el sol fuerte", ok: false },
    ],
    explicacion:
      "Árbol nativo y en lluvias. Las raíces de las especies de la región agarran mejor el suelo y evitan deslaves.",
    dato: "Un árbol grande sostiene toneladas de tierra con sus raíces. Por eso los cerros pelones se derrumban primero.",
  },
  {
    id: "g3",
    titulo: "El agua que se va",
    lugar: "Tu casa",
    escenario:
      "Escucho un ¡ploc, ploc! toda la noche: la llave del patio gotea y nadie la cierra bien. Además lavan el carro con manguera. ¿Por dónde empezamos?",
    opciones: [
      { texto: "Arreglar la gotera y lavar con cubeta", ok: true },
      { texto: "Poner una cubeta bajo la gotera y ya", ok: false },
      { texto: "Nada, total, es poquita agua", ok: false },
    ],
    explicacion:
      "Reparar la fuga y cambiar la manguera por cubeta. Una llave que gotea tira más de 100 litros al mes sin que nadie la use.",
    dato: "Lavar el carro con manguera gasta hasta 400 litros. Con dos cubetas, menos de 40.",
  },
];

export const PERSONAJES = {
  sismo: {
    id: "sismo",
    nombre: "Sismo Tecnito",
    apodo: "el edificio que sí sabe qué hacer",
    moneda: "escudos",
    monedaIcono: "🛡️",
    resumen:
      "Sobrevive al simulacro, arma la mochila de emergencia y aprende qué hacer cuando el temblor ya pasó.",
    cuerpo: "/sismo.webp",
    cara: "/sismo-cara.webp",
    tema: {
      fondo: "#dbe9f8",
      fondo2: "#b3d2f0",
      tinta: "#10304f",
      acento: "#0f6fc4",
      acento2: "#f4691f",
      linea: "#8fb6dd",
    },
    persona:
      "Eres Sismo Tecnito: un edificio azul, alto y simpático, con ventanas por ojos, nariz naranja, manos naranjas y piernas de resorte. Eres instructor de protección civil para niños de 8 a 12 años en México. Hablas con humor, con expresiones mexicanas suaves, y a veces bromeas sobre tus resortes o tus ventanas. Nunca asustas: das calma y pasos concretos.",
    misiones: MISIONES_SISMO,
  },
  green: {
    id: "green",
    nombre: "Greencito",
    apodo: "el terroncito del casco verde",
    moneda: "semillas",
    monedaIcono: "🌱",
    resumen:
      "Separa la basura, siembra donde sí y ponle un alto al agua que se escapa de la llave.",
    cuerpo: "/greencito.webp",
    cara: "/greencito-cara.webp",
    tema: {
      fondo: "#e8f3d6",
      fondo2: "#cbe4a5",
      tinta: "#2c4416",
      acento: "#5aa32a",
      acento2: "#d98430",
      linea: "#a9c97f",
    },
    persona:
      "Eres Greencito: un terroncito de tierra fértil con casco verde de constructor, un brote saliendo del casco, brotecitos en el cuerpo y guantes naranjas de trabajo. Enseñas cuidado del medio ambiente a niños de 8 a 12 años en México. Hablas cálido y juguetón, te emocionas con las lombrices, la composta y la lluvia. Nunca regañas: celebras cada acción pequeña.",
    misiones: MISIONES_GREEN,
  },
};

export function construirSistema(p, mision) {
  return `${p.persona}

Estás jugando una aventura por turnos con un niño o niña. Misión actual: "${mision.titulo}" (${mision.lugar}).
Escenario: ${mision.escenario}
Respuesta correcta esperada: ${mision.opciones.find((o) => o.ok).texto}
Por qué: ${mision.explicacion}
Dato curioso disponible: ${mision.dato}

Reglas:
- Español de México, sencillo, frases cortas. Máximo 45 palabras en "mensaje".
- Si la respuesta del jugador es buena, celébrala y explica por qué funciona. Si no, corrige con cariño y sin miedo, y di qué hacer en su lugar.
- Nunca describas lesiones, muertes ni escenas que asusten.
- Si el jugador pregunta algo fuera de tema, respóndele breve y regrésalo a la misión.
- Marca "misionCompleta": true en cuanto el jugador ya entendió la idea clave (turno 1 o 2, no lo alargues).

Responde ÚNICAMENTE con este JSON, sin texto extra ni backticks:
{"reaccion":"3 palabras máximo","correcto":true,"mensaje":"tu respuesta en personaje","opciones":["opción corta 1","opción corta 2","opción corta 3"],"puntos":10,"dato":"dato curioso o cadena vacía","misionCompleta":false}`;
}
