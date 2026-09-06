/**
 * Todo el contenido del juego vive aquí.
 *
 * Tipos de misión:
 *   - "reto"      → pregunta con opciones, cronómetro y comentario del personaje
 *   - "minijuego" → pantalla de acción (ver src/components/minijuegos/)
 *
 * Cada reto tiene:
 *   opciones        → las que ve primaria (3)
 *   opcionExtra     → distractor extra que se agrega en secundaria (4)
 *   retoSecundaria  → pregunta de bonificación, solo secundaria, vale doble
 */

export const GRADOS = {
  primaria: {
    id: "primaria",
    nombre: "Primaria",
    edades: "6 a 11 años",
    icono: "🎒",
    segundos: 22,
    vidas: 3,
    opcionExtra: false,
    retoExtra: false,
    estilo:
      "Háblale a una niña o niño de primaria: palabras muy sencillas, frases cortas de menos de 12 palabras, comparaciones con cosas de la escuela o la casa, y muchas exclamaciones. Usa uno o dos emojis.",
  },
  secundaria: {
    id: "secundaria",
    nombre: "Secundaria",
    edades: "12 a 15 años",
    icono: "🎧",
    segundos: 14,
    vidas: 3,
    opcionExtra: true,
    retoExtra: true,
    estilo:
      "Háblale a una o un adolescente de secundaria: nada de infantilizar, sin diminutivos ni voz de maestro regañón. Puedes soltar cifras concretas, retarlo un poco y usar humor seco. Máximo un emoji.",
  },
};

const MISIONES_SISMO = [
  {
    id: "s1",
    tipo: "reto",
    titulo: "El salón se mueve",
    lugar: "Escuela primaria",
    escenario:
      "¡Ay, mis resortes! Empezó a temblar en plena clase y los lápices bailan sobre la mesa. Estás en la fila de en medio, lejos de la puerta. ¿Qué haces primero?",
    opciones: [
      { texto: "Correr rapidísimo a las escaleras", ok: false },
      { texto: "Agacharme, cubrirme y agarrarme junto a mi banca", ok: true },
      { texto: "Asomarme a la ventana para ver qué pasa", ok: false },
    ],
    opcionExtra: { texto: "Grabar un video para subirlo después", ok: false },
    explicacion:
      "Agacharse, cubrirse la cabeza y sujetarse. Correr mientras el piso se mueve es como cruzar un puente que salta.",
    dato: "En Guerrero tiembla muchísimo porque debajo del mar se meten dos placas: la de Cocos y la Norteamericana.",
    retoSecundaria: {
      pregunta: "Nivel experto: la alerta sísmica te da unos segundos de ventaja. ¿Por qué alcanza a avisar?",
      opciones: [
        { texto: "Las ondas de radio viajan más rápido que las del sismo", ok: true },
        { texto: "Un satélite predice el temblor antes de que ocurra", ok: false },
        { texto: "Los sensores sienten el sismo un día antes", ok: false },
      ],
      explicacion:
        "Los sensores en la costa detectan el sismo y mandan la señal por radio. La señal corre más rápido que la sacudida, por eso llega antes.",
    },
  },
  {
    id: "s2",
    tipo: "minijuego",
    juego: "memorama",
    titulo: "Memorama de emergencia",
    lugar: "Bodega de protección civil",
    descripcion:
      "Encuentra las seis parejas antes de que se acabe el tiempo. Cada acierto trae un dato que sirve.",
  },
  {
    id: "s3",
    tipo: "reto",
    titulo: "La mochila que salva",
    lugar: "Tu casa, un sábado",
    escenario:
      "Vamos a armar la mochila de emergencia de tu familia. Solo caben cosas útiles, nada de peso de más. ¿Qué metemos primero?",
    opciones: [
      { texto: "Agua, linterna, silbato y copias de documentos", ok: true },
      { texto: "La consola de videojuegos y unos peluches", ok: false },
      { texto: "Velitas y cerillos para hacer luz", ok: false },
    ],
    opcionExtra: { texto: "Solo el celular, ahí traigo todo", ok: false },
    explicacion:
      "Agua, linterna, silbato, botiquín y copias de documentos. Nada de velas: si hay fuga de gas, una chispa se vuelve un problemón.",
    dato: "El silbato casi no pesa y se escucha más lejos que un grito. Es lo más subestimado de la mochila.",
    retoSecundaria: {
      pregunta: "Nivel experto: ¿cuánta agua por persona conviene guardar?",
      opciones: [
        { texto: "4 litros por persona al día, para tres días", ok: true },
        { texto: "Medio litro por persona, con eso basta", ok: false },
        { texto: "Un galón por familia para toda la semana", ok: false },
      ],
      explicacion:
        "Unos 4 litros por persona al día, con reserva para tres días. La mitad para beber, la otra mitad para lavar y cocinar.",
    },
  },
  {
    id: "s4",
    tipo: "minijuego",
    juego: "simulacro",
    titulo: "Simulacro relámpago",
    lugar: "Salón de clases",
    descripcion:
      "Está temblando. Toca las tres acciones correctas en orden antes de que se acabe el tiempo. Cuidado con las trampas.",
  },
  {
    id: "s5",
    tipo: "reto",
    titulo: "Después del temblor",
    lugar: "Patio de la escuela",
    escenario:
      "Dejó de temblar y ya estamos en el punto de reunión. Se fue la luz y hay un olor raro que viene de la cocina. ¿Qué sigue?",
    opciones: [
      { texto: "Avisar a un adulto del olor y no encender nada", ok: true },
      { texto: "Entrar de volada por mi mochila al salón", ok: false },
      { texto: "Llamar cien veces al 911 para contarles", ok: false },
    ],
    opcionExtra: { texto: "Prender la linterna del celular para ver mejor", ok: false },
    explicacion:
      "Avisar del olor a gas y no encender nada, ni el celular cerca de la fuga. No volver a entrar hasta que alguien revise el edificio.",
    dato: "La línea de emergencia se satura después de un sismo. Un mensaje de texto pasa mejor que una llamada.",
    retoSecundaria: {
      pregunta: "Nivel experto: después del sismo principal, ¿qué son las réplicas?",
      opciones: [
        { texto: "Sismos menores que siguen días o semanas después", ok: true },
        { texto: "El eco del sismo rebotando en las montañas", ok: false },
        { texto: "Temblores que solo se sienten en edificios altos", ok: false },
      ],
      explicacion:
        "Son sismos posteriores, casi siempre más chicos, mientras la falla se acomoda. Por eso un edificio dañado puede caer con la réplica.",
    },
  },
];

const MISIONES_GREEN = [
  {
    id: "g1",
    tipo: "reto",
    titulo: "La pila traicionera",
    lugar: "Patio de la escuela",
    escenario:
      "¡Ay, mis raíces! Alguien echó cáscaras de plátano, una botella y una pila usada en el mismo bote. ¿Qué hago con la pila?",
    opciones: [
      { texto: "Llevarla a un centro de acopio especial", ok: true },
      { texto: "Enterrarla en el jardín, al fin es tierra", ok: false },
      { texto: "Tirarla al bote de plástico", ok: false },
    ],
    opcionExtra: { texto: "Envolverla en papel y tirarla a la basura común", ok: false },
    explicacion:
      "Las pilas van a un acopio especial. Una sola pila enterrada puede contaminar miles de litros de agua subterránea.",
    dato: "Las cáscaras sí sirven: se vuelven composta y alimentan la tierra en dos o tres meses.",
    retoSecundaria: {
      pregunta: "Nivel experto: ¿qué metal de las pilas daña más el sistema nervioso?",
      opciones: [
        { texto: "El mercurio", ok: true },
        { texto: "El aluminio", ok: false },
        { texto: "El hierro", ok: false },
      ],
      explicacion:
        "El mercurio. Se acumula en el agua, sube por los peces y termina en la comida. Por eso las pilas nunca van a la basura común.",
    },
  },
  {
    id: "g2",
    tipo: "minijuego",
    juego: "memorama",
    titulo: "Memorama del terreno",
    lugar: "Huerto de la escuela",
    descripcion:
      "Encuentra las seis parejas antes de que se acabe el tiempo. Cada acierto trae un dato que sirve.",
  },
  {
    id: "g3",
    tipo: "reto",
    titulo: "Sembrar de verdad",
    lugar: "Terreno junto al río",
    escenario:
      "Vamos a plantar un arbolito en la orilla del río. Traigo tres ideas guardadas bajo el casco. ¿Cuál nos conviene?",
    opciones: [
      { texto: "Un árbol nativo de la región, en temporada de lluvias", ok: true },
      { texto: "El árbol más bonito, aunque sea de otro país", ok: false },
      { texto: "Sembrar en pleno mayo, cuando pega el sol fuerte", ok: false },
    ],
    opcionExtra: { texto: "Puros eucaliptos, porque crecen rapidísimo", ok: false },
    explicacion:
      "Árbol nativo y en lluvias. Las raíces de las especies de la región agarran mejor el suelo y evitan deslaves.",
    dato: "Un árbol grande sostiene toneladas de tierra con sus raíces. Por eso los cerros pelones se derrumban primero.",
    retoSecundaria: {
      pregunta: "Nivel experto: ¿por qué el eucalipto es mala idea junto a un río?",
      opciones: [
        { texto: "Consume muchísima agua y reseca el suelo alrededor", ok: true },
        { texto: "Sus hojas son venenosas para las personas", ok: false },
        { texto: "Atrae demasiados insectos polinizadores", ok: false },
      ],
      explicacion:
        "Bebe cantidades enormes de agua y suelta sustancias que frenan a otras plantas. Crece rápido, pero deja el terreno pobre.",
    },
  },
  {
    id: "g4",
    tipo: "minijuego",
    juego: "basura",
    titulo: "Separa o pierde",
    lugar: "Estación de reciclaje",
    descripcion:
      "Van a llegar diez residuos, uno por uno. Mándalos al bote correcto antes de que se acabe su tiempo.",
  },
  {
    id: "g5",
    tipo: "reto",
    titulo: "El agua que se va",
    lugar: "Tu casa",
    escenario:
      "Escucho un ¡ploc, ploc! toda la noche: la llave del patio gotea y nadie la cierra bien. Además lavan el carro con manguera. ¿Por dónde empezamos?",
    opciones: [
      { texto: "Arreglar la gotera y lavar con cubeta", ok: true },
      { texto: "Poner una cubeta bajo la gotera y ya", ok: false },
      { texto: "Nada, total, es poquita agua", ok: false },
    ],
    opcionExtra: { texto: "Cerrar la llave general toda la noche", ok: false },
    explicacion:
      "Reparar la fuga y cambiar la manguera por cubeta. Una llave que gotea tira más de 100 litros al mes sin que nadie la use.",
    dato: "Lavar el carro con manguera gasta hasta 400 litros. Con dos cubetas, menos de 40.",
    retoSecundaria: {
      pregunta: "Nivel experto: ¿dónde se pierde más agua en una casa típica?",
      opciones: [
        { texto: "En el escusado: fugas silenciosas del tanque", ok: true },
        { texto: "En el refrigerador", ok: false },
        { texto: "En el agua que se evapora de la cisterna", ok: false },
      ],
      explicacion:
        "El tanque del escusado. Una fuga que ni se oye tira cientos de litros al día. Se detecta con unas gotas de colorante en el tanque.",
    },
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
      "Sobrevive al simulacro relámpago, arma la mochila de emergencia y aprende qué hacer cuando el temblor ya pasó.",
    cuerpo: "/sismo.webp",
    cara: "/sismo-cara.webp",
    colores: ["#0f6fc4", "#f4691f", "#ffd23f", "#7fc4ff"],
    tema: {
      fondo: "#dbe9f8",
      fondo2: "#b3d2f0",
      tinta: "#10304f",
      acento: "#0f6fc4",
      acento2: "#f4691f",
      linea: "#8fb6dd",
    },
    persona:
      "Eres Sismo Tecnito: un edificio azul, alto y simpático, con ventanas por ojos, nariz naranja, manos naranjas y piernas de resorte. Enseñas protección civil en México. Tienes humor, bromeas sobre tus resortes y tus ventanas, y nunca asustas: das calma y pasos concretos.",
    misiones: MISIONES_SISMO,
  },
  green: {
    id: "green",
    nombre: "Greencito",
    apodo: "el terroncito del casco verde",
    moneda: "semillas",
    monedaIcono: "🌱",
    resumen:
      "Separa la basura contra reloj, siembra donde sí y ponle un alto al agua que se escapa de la llave.",
    cuerpo: "/greencito.webp",
    cara: "/greencito-cara.webp",
    colores: ["#5aa32a", "#d98430", "#ffd23f", "#a97141"],
    tema: {
      fondo: "#e8f3d6",
      fondo2: "#cbe4a5",
      tinta: "#2c4416",
      acento: "#5aa32a",
      acento2: "#d98430",
      linea: "#a9c97f",
    },
    persona:
      "Eres Greencito: un terroncito de tierra fértil con casco verde de constructor, un brote saliendo del casco y guantes naranjas de trabajo. Enseñas cuidado del medio ambiente en México. Eres cálido y juguetón, te emocionan las lombrices y la lluvia, y celebras cada acción pequeña.",
    misiones: MISIONES_GREEN,
  },
};

/* ============================== memorama =============================
   simples      → primaria: las dos cartas del par son iguales
   conceptuales → secundaria: una carta es la situación y la otra la
                  respuesta correcta, así que hay que razonar el par
   ==================================================================== */

export const MEMORAMA = {
  sismo: {
    simples: [
      { icono: "🔦", texto: "Linterna", dato: "Nunca velas: si hay fuga de gas, una chispa basta." },
      { icono: "🎒", texto: "Mochila de emergencia", dato: "Ligera y siempre en el mismo lugar, cerca de la puerta." },
      { icono: "📻", texto: "Radio de pilas", dato: "Cuando no hay luz ni señal, el radio sigue informando." },
      { icono: "🩹", texto: "Botiquín", dato: "Gasas, vendas y las medicinas que alguien de la casa necesite." },
      { icono: "🚨", texto: "Alerta sísmica", dato: "Si suena, aléjate de ventanas y busca un lugar seguro." },
      { icono: "📣", texto: "Silbato", dato: "Pesa casi nada y se oye más lejos que un grito." },
    ],
    conceptuales: [
      { a: { icono: "🚨", texto: "Suena la alerta" }, b: { icono: "🧎", texto: "Agáchate y cúbrete" }, dato: "La alerta da segundos, no minutos. Úsalos para protegerte, no para correr." },
      { a: { icono: "👃", texto: "Huele a gas" }, b: { icono: "🚫", texto: "No enciendas nada" }, dato: "Ni el foco ni la linterna del celular. Avisa a un adulto y salgan." },
      { a: { icono: "🛗", texto: "Elevador" }, b: { icono: "❌", texto: "Jamás durante un sismo" }, dato: "Se puede quedar atorado sin luz. Siempre escaleras, y después del temblor." },
      { a: { icono: "📱", texto: "Líneas saturadas" }, b: { icono: "💬", texto: "Manda un mensaje" }, dato: "El texto pasa aunque las llamadas no. Ocupa mucho menos red." },
      { a: { icono: "🪧", texto: "Punto de reunión" }, b: { icono: "👨‍👩‍👧", texto: "Ahí te encuentran" }, dato: "Acuérdenlo en familia antes de que pase algo, no durante." },
      { a: { icono: "🏚️", texto: "Edificio dañado" }, b: { icono: "⏳", texto: "Cuidado con la réplica" }, dato: "Las réplicas siguen días. Un muro cuarteado puede caer con la segunda." },
    ],
  },
  green: {
    simples: [
      { icono: "🍂", texto: "Composta", dato: "Las cáscaras se vuelven tierra en dos o tres meses." },
      { icono: "♻️", texto: "Reciclable", dato: "Enjuaga y aplasta los envases: ocupan menos y valen más." },
      { icono: "🪣", texto: "Cubeta", dato: "Lavar el carro con cubeta gasta 40 litros; con manguera, 400." },
      { icono: "🌳", texto: "Árbol nativo", dato: "Sus raíces agarran el suelo de la región y evitan deslaves." },
      { icono: "🔋", texto: "Pila usada", dato: "Va a un acopio especial. Enterrada contamina el agua del subsuelo." },
      { icono: "💧", texto: "Llave cerrada", dato: "Una gotera tira más de 100 litros al mes sin que nadie la use." },
    ],
    conceptuales: [
      { a: { icono: "🥭", texto: "Cáscara de mango" }, b: { icono: "🍂", texto: "Composta" }, dato: "Lo orgánico alimenta la tierra en lugar de apestar en el relleno." },
      { a: { icono: "🔋", texto: "Pila del control" }, b: { icono: "☣️", texto: "Acopio especial" }, dato: "El mercurio sube por el agua, llega a los peces y termina en tu plato." },
      { a: { icono: "🥤", texto: "Botella de PET" }, b: { icono: "♻️", texto: "Reciclable" }, dato: "Una botella tarda cientos de años en degradarse. Reciclada vuelve en semanas." },
      { a: { icono: "🚿", texto: "Fuga que gotea" }, b: { icono: "💧", texto: "100 litros al mes" }, dato: "El ploc-ploc de la noche es una cubeta llena cada dos días." },
      { a: { icono: "🌳", texto: "Árbol junto al río" }, b: { icono: "⛰️", texto: "Sostiene el cerro" }, dato: "Sin raíces el agua se lleva la tierra. Por eso los cerros pelones se derrumban." },
      { a: { icono: "🚗", texto: "Lavar el carro" }, b: { icono: "🪣", texto: "Dos cubetas bastan" }, dato: "La manguera abierta tira más agua de la que bebe una persona en un mes." },
    ],
  },
};

/* ---------------- residuos del minijuego de separación ---------------- */
export const BOTES = [
  { id: "organico", nombre: "Orgánico", icono: "🍂", color: "#7a5a2e" },
  { id: "reciclable", nombre: "Reciclable", icono: "♻️", color: "#0f6fc4" },
  { id: "peligroso", nombre: "Peligroso", icono: "☣️", color: "#c9432c" },
];

export const RESIDUOS = [
  { nombre: "Cáscara de mango", icono: "🥭", bote: "organico" },
  { nombre: "Botella de refresco", icono: "🥤", bote: "reciclable" },
  { nombre: "Pila de control", icono: "🔋", bote: "peligroso" },
  { nombre: "Hojas secas", icono: "🍁", bote: "organico" },
  { nombre: "Lata de atún", icono: "🥫", bote: "reciclable" },
  { nombre: "Termómetro roto", icono: "🌡️", bote: "peligroso" },
  { nombre: "Cáscara de huevo", icono: "🥚", bote: "organico" },
  { nombre: "Periódico viejo", icono: "📰", bote: "reciclable" },
  { nombre: "Bote de pintura", icono: "🎨", bote: "peligroso" },
  { nombre: "Restos de sopa", icono: "🍲", bote: "organico" },
  { nombre: "Caja de cartón", icono: "📦", bote: "reciclable" },
  { nombre: "Foco fundido", icono: "💡", bote: "peligroso" },
];

/* ------------------- acciones del simulacro de sismo ------------------ */

export const ACCIONES_SIMULACRO = [
  { id: 1, texto: "Agáchate", icono: "🧎" },
  { id: 2, texto: "Cúbrete la cabeza", icono: "🙆" },
  { id: 3, texto: "Agárrate firme", icono: "✊" },
];

export const TRAMPAS_SIMULACRO = [
  { id: 4, texto: "Correr a la salida", icono: "🏃" },
  { id: 5, texto: "Usar el elevador", icono: "🛗" },
  { id: 6, texto: "Gritar y empujar", icono: "😱" },
  { id: 7, texto: "Asomarte al balcón", icono: "🪟" },
];

/* ---------------------------- prompt de la IA ------------------------- */

export function construirSistema(p, grado, contexto) {
  return `${p.persona}

${GRADOS[grado].estilo}

Contexto del juego: ${contexto}

Reglas:
- Español de México. Máximo 35 palabras.
- Nunca describas lesiones, muertes ni escenas que asusten.
- Si preguntan algo fuera de tema, contesta breve y regresa al juego.
- Responde en texto plano, sin JSON, sin comillas, sin formato.`;
}
