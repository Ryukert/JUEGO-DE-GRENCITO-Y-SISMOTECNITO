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

/* ------------------------- variantes de los retos -------------------------
 * Cada reto de misión tiene otras situaciones del mismo tema. Al empezar una partida se
 * elige una al azar para cada lugar (armarPartida), así que dos partidas casi nunca son
 * iguales. La insignia sigue siendo la del reto original (`insignia`), para que las
 * medallas ya ganadas valgan igual. Cada variante tiene su propio id (lo usan el servidor
 * para calificar, el repaso y el panel del maestro): máximo 10 caracteres.
 */
const VARIANTES = {
  s1: [
    {
      id: "s1b",
      titulo: "Libros que vuelan",
      lugar: "Biblioteca de la escuela",
      escenario:
        "Estás junto a un librero altísimo, lleno de enciclopedias, cuando empieza a temblar. Las repisas ya rechinan. ¿Qué haces?",
      opciones: [
        { texto: "Alejarme del librero y protegerme bajo una mesa firme", ok: true },
        { texto: "Detener el librero con las manos para que no se caiga", ok: false },
        { texto: "Correr hacia la salida entre los libreros", ok: false },
      ],
      opcionExtra: { texto: "Pararme bajo el marco de la puerta", ok: false },
      explicacion:
        "Lejos de lo que se puede caer: libreros, vitrinas, lámparas y ventanas. Bajo una mesa firme, agachado y sujetándote de una pata.",
      dato: "En los sismos, muchas lesiones las causan objetos que se caen o se vuelcan, no solo los edificios.",
      retoSecundaria: {
        pregunta: "Nivel experto: ¿por qué ya no se recomienda refugiarse bajo el marco de la puerta?",
        opciones: [
          { texto: "En construcciones actuales no es más fuerte que el resto y la puerta puede golpearte", ok: true },
          { texto: "Porque las puertas atraen las ondas del sismo", ok: false },
          { texto: "Porque el marco se derrite con la vibración", ok: false },
        ],
        explicacion:
          "Era un consejo para casas antiguas de adobe. Hoy el marco no protege más que una mesa firme, y la puerta se azota con la sacudida.",
      },
    },
    {
      id: "s1c",
      titulo: "Temblor en el recreo",
      lugar: "Patio, en educación física",
      escenario:
        "Estás jugando futbol en el patio y empieza a temblar fuerte. Cerca hay una barda, un poste con cables y el edificio de los salones. ¿Qué haces?",
      opciones: [
        { texto: "Ir al centro del patio, lejos de bardas, postes y cables, y agacharme", ok: true },
        { texto: "Correr a meterme al salón para protegerme", ok: false },
        { texto: "Abrazar el poste para no caerme", ok: false },
      ],
      opcionExtra: { texto: "Subirme a las gradas para ver mejor", ok: false },
      explicacion:
        "Al aire libre, lo más seguro es un espacio abierto, lejos de lo que pueda caer: bardas, vidrios, postes, cables y árboles. Entrar al edificio mientras tiembla es más peligroso.",
      dato: "Un cable caído puede tener corriente aunque no saque chispas: nunca se toca.",
      retoSecundaria: {
        pregunta: "Nivel experto: ¿qué mide la magnitud de un sismo?",
        opciones: [
          { texto: "La energía que se liberó donde empezó el sismo", ok: true },
          { texto: "Qué tanto se movió tu casa", ok: false },
          { texto: "Cuántos minutos duró la sacudida", ok: false },
        ],
        explicacion:
          "La magnitud es una sola para cada sismo: la energía liberada. Lo que cambia de lugar a lugar es la intensidad, qué tanto se sintió.",
      },
    },
  ],
  s3: [
    {
      id: "s3b",
      titulo: "El plan de la familia",
      lugar: "La sala de tu casa",
      escenario:
        "Tu familia quiere un plan por si tiembla cuando cada quien está en otro lado: unos en la escuela y otros en el trabajo. ¿Qué acuerdan?",
      opciones: [
        { texto: "Un punto de reunión y los teléfonos importantes anotados en papel", ok: true },
        { texto: "Que todos salgan a buscarse por la ciudad", ok: false },
        { texto: "Nada: con el celular basta", ok: false },
      ],
      opcionExtra: { texto: "Que cada quien publique en redes dónde está y ya", ok: false },
      explicacion:
        "Un lugar donde encontrarse y los números anotados en papel. Después de un sismo el celular puede quedarse sin pila o sin señal.",
      dato: "Tener un familiar de contacto en otra ciudad ayuda: a veces entran mejor las llamadas de lejos que las de la zona del sismo.",
      retoSecundaria: {
        pregunta: "Nivel experto: ¿cada cuánto conviene revisar la mochila de emergencia?",
        opciones: [
          { texto: "Cada seis meses, para cambiar agua, pilas y medicinas que caducan", ok: true },
          { texto: "Solo cuando ya tembló", ok: false },
          { texto: "Nunca: una vez armada dura para siempre", ok: false },
        ],
        explicacion:
          "El agua, las pilas, la comida y las medicinas caducan. Revisarla dos veces al año asegura que todo sirva cuando haga falta.",
      },
    },
    {
      id: "s3c",
      titulo: "Un cuarto seguro",
      lugar: "Tu cuarto",
      escenario:
        "Estamos revisando tu cuarto. Junto a tu cama hay un librero alto con cosas pesadas en la repisa de arriba. ¿Qué hacemos?",
      opciones: [
        { texto: "Fijar el librero a la pared y poner lo pesado abajo", ok: true },
        { texto: "Dejarlo así: nunca se ha caído", ok: false },
        { texto: "Mover la cama justo debajo del librero", ok: false },
      ],
      opcionExtra: { texto: "Colgar un espejo grande sobre la cabecera", ok: false },
      explicacion:
        "Los muebles altos se fijan a la pared y lo pesado va abajo. Así no se vuelcan y nada cae sobre la cama mientras duermes.",
      dato: "Unas escuadras de metal para fijar un librero cuestan poco y pueden evitar un accidente.",
      retoSecundaria: {
        pregunta: "Nivel experto: ¿por qué en el antiguo lago de la Ciudad de México los sismos se sienten más fuertes?",
        opciones: [
          { texto: "El suelo blando de arcilla amplifica las ondas, como una gelatina", ok: true },
          { texto: "Porque ahí siempre está el epicentro", ok: false },
          { texto: "Porque los edificios son más altos", ok: false },
        ],
        explicacion:
          "La arcilla blanda del antiguo lago hace que las ondas crezcan y duren más. Por eso un sismo lejano se siente tanto en algunas colonias.",
      },
    },
  ],
  s5: [
    {
      id: "s5b",
      titulo: "Cables en la banqueta",
      lugar: "La calle de tu casa",
      escenario:
        "Ya pasó el temblor y salen a la calle. Un cable de luz cayó sobre la banqueta y junto hay un charco. ¿Qué haces?",
      opciones: [
        { texto: "Alejarme, no tocar el cable ni el charco y avisar a un adulto", ok: true },
        { texto: "Moverlo con un palo para que nadie se tropiece", ok: false },
        { texto: "Saltar el charco rápido para pasar", ok: false },
      ],
      opcionExtra: { texto: "Acercarme a tomarle una foto", ok: false },
      explicacion:
        "Un cable caído puede tener corriente y el agua la conduce. Hay que alejarse de los dos y que un adulto reporte la falla.",
      dato: "En México, las fallas de luz se reportan a la CFE al 071.",
      retoSecundaria: {
        pregunta: "Nivel experto: ¿por qué un charco es peligroso junto a un cable caído?",
        opciones: [
          { texto: "El agua con sales disueltas conduce la electricidad", ok: true },
          { texto: "El agua apaga la corriente del cable", ok: false },
          { texto: "Solo es peligroso si el agua está fría", ok: false },
        ],
        explicacion:
          "El agua de la calle trae sales disueltas y conduce la corriente: tocar el charco puede ser como tocar el cable.",
      },
    },
    {
      id: "s5c",
      titulo: "El mensaje falso",
      lugar: "El chat de la familia",
      escenario:
        "Después del sismo llega un mensaje: «Mañana a las 3 viene uno más fuerte. ¡Compártelo!». ¿Qué haces?",
      opciones: [
        { texto: "No compartirlo: los sismos no se pueden predecir; reviso fuentes oficiales", ok: true },
        { texto: "Reenviarlo a todos, por si acaso", ok: false },
        { texto: "Salir a dormir a la calle mañana", ok: false },
      ],
      opcionExtra: { texto: "Creerle, porque lo mandó alguien conocido", ok: false },
      explicacion:
        "Nadie puede decir el día ni la hora de un sismo. La información confiable viene de Protección Civil y del Servicio Sismológico Nacional.",
      dato: "El Servicio Sismológico Nacional, de la UNAM, informa la magnitud y el epicentro minutos después de cada sismo.",
      retoSecundaria: {
        pregunta: "Nivel experto: si no se pueden predecir, ¿qué sí se puede hacer?",
        opciones: [
          { texto: "Detectar el sismo cuando ya empezó y avisar segundos antes con la alerta", ok: true },
          { texto: "Medir el nivel del mar para saber la fecha", ok: false },
          { texto: "Observar a los animales del zoológico", ok: false },
        ],
        explicacion:
          "La alerta sísmica no predice: detecta el sismo cerca de donde empieza y avisa antes de que lleguen las ondas fuertes.",
      },
    },
  ],
  g1: [
    {
      id: "g1b",
      titulo: "Aceite en el fregadero",
      lugar: "La cocina de tu casa",
      escenario:
        "Sobró aceite de freír quesadillas y alguien quiere echarlo al fregadero con agua caliente. ¿Qué hacemos?",
      opciones: [
        { texto: "Dejarlo enfriar, guardarlo en una botella cerrada y llevarlo a acopio", ok: true },
        { texto: "Echarlo al fregadero con agua caliente", ok: false },
        { texto: "Tirarlo en el jardín, es natural", ok: false },
      ],
      opcionExtra: { texto: "Echarlo al escusado y jalarle dos veces", ok: false },
      explicacion:
        "El aceite tapa las tuberías y en el agua forma una capa que no deja pasar el oxígeno. Se junta en una botella y se lleva a un centro de acopio.",
      dato: "Un solo litro de aceite usado puede contaminar miles de litros de agua.",
      retoSecundaria: {
        pregunta: "Nivel experto: ¿en qué se puede convertir el aceite de cocina que se recolecta?",
        opciones: [
          { texto: "En biodiésel o en jabón", ok: true },
          { texto: "En agua potable", ok: false },
          { texto: "En aceite para cocinar otra vez, sin tratarlo", ok: false },
        ],
        explicacion:
          "Con el proceso adecuado se vuelve biodiésel o jabón. Por eso vale la pena juntarlo en vez de tirarlo.",
      },
    },
    {
      id: "g1c",
      titulo: "El celular viejo",
      lugar: "Tu casa",
      escenario:
        "El celular viejo de tu tía ya no prende y tiene la batería hinchada. ¿Qué hacemos con él?",
      opciones: [
        { texto: "Llevarlo a un centro de reciclaje de electrónicos", ok: true },
        { texto: "Tirarlo con la basura orgánica", ok: false },
        { texto: "Desarmarlo y quemar los cables para sacar el cobre", ok: false },
      ],
      opcionExtra: { texto: "Aventarlo al río, ahí nadie lo ve", ok: false },
      explicacion:
        "Los aparatos electrónicos tienen metales tóxicos y otros valiosos que se pueden recuperar. Van a un reciclaje especial, nunca a la basura común.",
      dato: "En la Ciudad de México, el Reciclatrón recibe gratis aparatos eléctricos y electrónicos viejos.",
      retoSecundaria: {
        pregunta: "Nivel experto: ¿qué metal valioso se recupera de las tarjetas de los celulares?",
        opciones: [
          { texto: "Oro", ok: true },
          { texto: "Uranio", ok: false },
          { texto: "Hierro de la pantalla", ok: false },
        ],
        explicacion:
          "Las tarjetas electrónicas llevan pequeñas cantidades de oro, plata y cobre. Juntando muchos aparatos, recuperarlos vale la pena.",
      },
    },
  ],
  g3: [
    {
      id: "g3b",
      titulo: "Plaga en el huerto",
      lugar: "Huerto de la escuela",
      escenario:
        "Unos pulgones se están comiendo las hojas de los jitomates del huerto. ¿Cómo los frenamos?",
      opciones: [
        { texto: "Quitarlos a mano y sembrar albahaca y caléndulas cerca", ok: true },
        { texto: "Echar mucho insecticida químico a todo", ok: false },
        { texto: "Arrancar todas las plantas y empezar de nuevo", ok: false },
      ],
      opcionExtra: { texto: "Acabar también con las catarinas del huerto", ok: false },
      explicacion:
        "Quitar los pulgones a mano y sembrar plantas que los alejan. Las catarinas son aliadas: se comen a los pulgones.",
      dato: "Una sola catarina puede comerse decenas de pulgones en un día.",
      retoSecundaria: {
        pregunta: "Nivel experto: ¿por qué los insecticidas fuertes dañan el huerto a la larga?",
        opciones: [
          { texto: "Matan también a los polinizadores y a los que se comen las plagas", ok: true },
          { texto: "Hacen que las plantas crezcan demasiado", ok: false },
          { texto: "Cambian el color de los frutos", ok: false },
        ],
        explicacion:
          "Acaban con abejas, catarinas y otros aliados. Sin ellos, la plaga regresa más fuerte y las flores no se polinizan.",
      },
    },
    {
      id: "g3c",
      titulo: "Fogata en el bosque",
      lugar: "Bosque cerca de tu comunidad",
      escenario:
        "Fueron de día de campo al bosque. Hace mucho viento, el pasto está seco y alguien quiere hacer una fogata para asar elotes. ¿Qué dices?",
      opciones: [
        { texto: "Mejor no: con viento y pasto seco el fuego se escapa fácil", ok: true },
        { texto: "Hacerla junto a los árboles para que nos den sombra", ok: false },
        { texto: "Hacerla y, si crece, echarle un poco de refresco", ok: false },
      ],
      opcionExtra: { texto: "Tirar una colilla de cigarro en el pasto: ya está apagada", ok: false },
      explicacion:
        "Con viento y pasto seco, una chispa basta para un incendio. Casi todos los incendios forestales empiezan por un descuido de las personas.",
      dato: "En México, la gran mayoría de los incendios forestales los provocan actividades humanas: fogatas, quemas agrícolas y colillas.",
      retoSecundaria: {
        pregunta: "Nivel experto: ¿por qué después de un incendio forestal hay más deslaves en las lluvias?",
        opciones: [
          { texto: "Sin plantas ni raíces, el suelo queda suelto y el agua lo arrastra", ok: true },
          { texto: "Porque la ceniza atrae más lluvia", ok: false },
          { texto: "Porque el fuego derrite las piedras del cerro", ok: false },
        ],
        explicacion:
          "Las raíces amarran el suelo. Cuando se queman, la lluvia arrastra la tierra cerro abajo y llegan los deslaves.",
      },
    },
  ],
  g5: [
    {
      id: "g5b",
      titulo: "Baños eternos",
      lugar: "El baño de tu casa",
      escenario:
        "Tu hermano se baña 25 minutos y deja la regadera abierta mientras se enjabona. ¿Qué le propones?",
      opciones: [
        { texto: "Cerrar la llave al enjabonarse y bañarse en unos 5 minutos", ok: true },
        { texto: "Nada: el agua siempre regresa", ok: false },
        { texto: "Llenar la tina todos los días mejor", ok: false },
      ],
      opcionExtra: { texto: "Bañarse dos veces al día para estar más limpio", ok: false },
      explicacion:
        "Cerrar la llave al enjabonarse y bañarse rápido. Una regadera común gasta alrededor de 10 litros por minuto.",
      dato: "El agua fría que sale antes de que llegue la caliente se puede juntar en una cubeta y usar para el escusado o las plantas.",
      retoSecundaria: {
        pregunta: "Nivel experto: ¿cuánta agua puede gastar un baño de 20 minutos con regadera común?",
        opciones: [
          { texto: "Unos 200 litros o más", ok: true },
          { texto: "Unos 10 litros", ok: false },
          { texto: "Unos 2 litros", ok: false },
        ],
        explicacion:
          "A unos 10 litros por minuto, 20 minutos son cerca de 200 litros: el agua que una persona toma en más de tres meses.",
      },
    },
    {
      id: "g5c",
      titulo: "Jabón en el arroyo",
      lugar: "Arroyo cerca de la escuela",
      escenario:
        "Alguien quiere lavar su camioneta junto al arroyo y echar el agua con jabón directo al cauce. ¿Qué le dices?",
      opciones: [
        { texto: "Que lave lejos, sin que el agua con jabón llegue al arroyo", ok: true },
        { texto: "Que está bien: el arroyo se limpia solo", ok: false },
        { texto: "Que le eche cloro al arroyo para que quede limpio", ok: false },
      ],
      opcionExtra: { texto: "Que no pasa nada porque es poquito jabón", ok: false },
      explicacion:
        "El jabón y el detergente alimentan algas que llenan el agua y le quitan el oxígeno. Los peces y las ranas se quedan sin aire.",
      dato: "Un arroyo limpio tiene más vida de la que se ve: insectos, ranas y peces chiquitos que dependen del oxígeno del agua.",
      retoSecundaria: {
        pregunta: "Nivel experto: ¿cómo se llama cuando el exceso de nutrientes llena un río o lago de algas?",
        opciones: [
          { texto: "Eutrofización", ok: true },
          { texto: "Erosión", ok: false },
          { texto: "Evaporación", ok: false },
        ],
        explicacion:
          "Eutrofización: los nutrientes de más (de jabones y fertilizantes) hacen crecer algas que, al morir, gastan el oxígeno del agua.",
      },
    },
  ],
};

for (const mision of [...MISIONES_SISMO, ...MISIONES_GREEN]) {
  if (mision.tipo === "reto") mision.variantes = VARIANTES[mision.id] || [];
}

/** Todos los retos de un personaje: los originales y sus variantes (para calificar y repasar). */
export function retosDe(p) {
  return p.misiones
    .filter((m) => m.tipo === "reto")
    .flatMap((m) => [m, ...m.variantes].map((r) => ({ ...m, ...r, variantes: undefined, insignia: m.titulo, tipo: "reto" })));
}

/** Busca un reto (original o variante) por su id. */
export function buscarReto(p, id) {
  return p ? retosDe(p).find((r) => r.id === id) || null : null;
}

/** Las misiones de una partida: en cada lugar de reto, el original o una de sus variantes al azar. */
export function armarPartida(p, azar = Math.random) {
  return p.misiones.map((m) => {
    if (m.tipo !== "reto" || !m.variantes.length) return { ...m, insignia: m.titulo };
    const opciones = [m, ...m.variantes];
    const r = opciones[Math.min(opciones.length - 1, Math.floor(azar() * opciones.length))];
    return { ...m, ...r, variantes: undefined, insignia: m.titulo, tipo: "reto" };
  });
}

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
    // acento2 más oscuro que el naranja del dibujo: con letra blanca encima pasa el contraste AA
    tema: {
      fondo: "#dbe9f8",
      fondo2: "#b3d2f0",
      tinta: "#10304f",
      acento: "#0f6fc4",
      acento2: "#c4500e",
      linea: "#8fb6dd",
      "acento-texto": "#0f6fc4",
      "acento2-texto": "#b0470c",
    },
    temaOscuro: {
      fondo: "#0b1828",
      fondo2: "#0f2540",
      tinta: "#e8f1fa",
      acento: "#0f6fc4",
      acento2: "#c4500e",
      linea: "#2f4c6b",
      "acento-texto": "#7cc0ff",
      "acento2-texto": "#ffa36b",
    },
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
    // verde y naranja un poco más oscuros que los del dibujo: con letra blanca encima pasan AA
    tema: {
      fondo: "#e8f3d6",
      fondo2: "#cbe4a5",
      tinta: "#2c4416",
      acento: "#3d7d1e",
      acento2: "#a85a17",
      linea: "#a9c97f",
      "acento-texto": "#3d7d1e",
      "acento2-texto": "#9a5215",
    },
    temaOscuro: {
      fondo: "#0f1a0b",
      fondo2: "#1a2e12",
      tinta: "#eaf4dd",
      acento: "#3d7d1e",
      acento2: "#a85a17",
      linea: "#3b5a28",
      "acento-texto": "#9bd468",
      "acento2-texto": "#ffa36b",
    },
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
      { icono: "💊", texto: "Botiquín", dato: "Gasas, vendas y las medicinas que alguien de la casa necesite." },
      { icono: "🚨", texto: "Alerta sísmica", dato: "Si suena, aléjate de ventanas y busca un lugar seguro." },
      { icono: "📣", texto: "Silbato", dato: "Pesa casi nada y se oye más lejos que un grito." },
    ],
    conceptuales: [
      { a: { icono: "🚨", texto: "Suena la alerta" }, b: { icono: "🙇", texto: "Agáchate y cúbrete" }, dato: "La alerta da segundos, no minutos. Úsalos para protegerte, no para correr." },
      { a: { icono: "👃", texto: "Huele a gas" }, b: { icono: "🚫", texto: "No enciendas nada" }, dato: "Ni el foco ni la linterna del celular. Avisa a un adulto y salgan." },
      { a: { icono: "🔼", texto: "Elevador" }, b: { icono: "❌", texto: "Jamás durante un sismo" }, dato: "Se puede quedar atorado sin luz. Siempre escaleras, y después del temblor." },
      { a: { icono: "📱", texto: "Líneas saturadas" }, b: { icono: "💬", texto: "Manda un mensaje" }, dato: "El texto pasa aunque las llamadas no. Ocupa mucho menos red." },
      { a: { icono: "🚩", texto: "Punto de reunión" }, b: { icono: "👪", texto: "Ahí te encuentran" }, dato: "Acuérdenlo en familia antes de que pase algo, no durante." },
      { a: { icono: "🏚️", texto: "Edificio dañado" }, b: { icono: "⏳", texto: "Cuidado con la réplica" }, dato: "Las réplicas siguen días. Un muro cuarteado puede caer con la segunda." },
    ],
  },
  green: {
    simples: [
      { icono: "🍂", texto: "Composta", dato: "Las cáscaras se vuelven tierra en dos o tres meses." },
      { icono: "♻️", texto: "Reciclable", dato: "Enjuaga y aplasta los envases: ocupan menos y valen más." },
      { icono: "🧽", texto: "Cubeta", dato: "Lavar el carro con cubeta gasta 40 litros; con manguera, 400." },
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
      { a: { icono: "🚗", texto: "Lavar el carro" }, b: { icono: "🧽", texto: "Dos cubetas bastan" }, dato: "La manguera abierta tira más agua de la que bebe una persona en un mes." },
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
  { id: 1, texto: "Agáchate", icono: "🙇" },
  { id: 2, texto: "Cúbrete la cabeza", icono: "🙆" },
  { id: 3, texto: "Agárrate firme", icono: "✊" },
];

export const TRAMPAS_SIMULACRO = [
  { id: 4, texto: "Correr a la salida", icono: "🏃" },
  { id: 5, texto: "Usar el elevador", icono: "🔼" },
  { id: 6, texto: "Gritar y empujar", icono: "😱" },
  { id: 7, texto: "Asomarte al balcón", icono: "🌇" },
];
