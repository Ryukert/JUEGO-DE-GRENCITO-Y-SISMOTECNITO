/**
 * Datos del motor Construye.jsx.
 *
 * El jugador arma algo por etapas: en cada etapa elige una pieza entre
 * varias y la pieza se apila en pantalla. Al final se corre una prueba
 * (un sismo, una lluvia) y el resultado depende de lo que eligió.
 *
 * Cada opción tiene:
 *   solidez  → cuánto aporta al resultado final (-2 a 2)
 *   icono    → lo que se dibuja en la pila
 *   forma    → cómo se dibuja la pieza (solo con `dibujo: "edificio"`,
 *              ver src/juegos/ui/Edificio.jsx)
 *
 * Lectura fácil (primaria): `preguntaCorta`, `corto`, `explicacionCorta` y
 * `resultadosCortos` reemplazan a los textos largos en fácil. Son opcionales;
 * si faltan se usa el texto normal.
 */

export const CONSTRUCCIONES = {
  /* ------------------------ 🏗️ Construye un edificio ------------------------ */
  "construye-edificio": {
    titulo: "Construye un edificio",
    escenario: "Un terreno en zona sísmica",
    prueba: "🌋 Simulacro de sismo magnitud 7.5",
    dibujo: "edificio",
    etapas: [
      {
        id: "suelo",
        nombre: "Estudio del terreno",
        pregunta: "Antes de nada: ¿sobre qué vamos a construir?",
        preguntaCorta: "¿Revisamos el suelo antes de construir?",
        opciones: [
          { texto: "Hacer estudio de mecánica de suelos primero", corto: "Estudiar el suelo primero", forma: "firme", icono: "🧪", solidez: 2, explicacion: "El suelo decide todo lo demás. Un suelo blando amplifica la sacudida hasta cinco veces.", explicacionCorta: "¡Bien! Así sabemos si el suelo es firme o blando.", dato: "La Ciudad de México sufre tanto porque está sobre el lecho de un lago." },
          { texto: "Construir directo, el terreno se ve firme", corto: "Construir sin revisar", forma: "lodo", icono: "👀", solidez: -2, explicacion: "Lo que se ve firme en seco puede volverse lodo con agua y vibración.", explicacionCorta: "Con el sismo, el suelo puede volverse lodo. Siempre se revisa.", dato: "Se llama licuefacción: el suelo se comporta como líquido durante el sismo." },
          { texto: "Preguntarle al vecino cómo le fue a él", corto: "Preguntarle al vecino", forma: "dudoso", icono: "🗣️", solidez: -1, explicacion: "Sirve como pista, no como estudio. Dos lotes pegados pueden tener suelos distintos.", explicacionCorta: "Tu vecino no sabe cómo es tu suelo. Hay que estudiarlo.", dato: "El estudio de suelos es obligatorio por reglamento en la mayoría de los municipios." },
        ],
      },
      {
        id: "cimentacion",
        nombre: "Cimentación",
        pregunta: "¿Qué cimentación le ponemos?",
        preguntaCorta: "¿Qué ponemos abajo del edificio?",
        opciones: [
          { texto: "Losa de cimentación amarrada, del ancho del edificio", corto: "Una base grande y unida", forma: "losa", icono: "🟫", solidez: 2, explicacion: "La losa reparte el peso y hace que todo el edificio se mueva como una sola pieza.", explicacionCorta: "¡Bien! La base unida hace que todo se mueva junto.", dato: "Si una parte se hunde más que otra, el edificio se parte solo." },
          { texto: "Zapatas sueltas, cada una por su lado", corto: "Bloques sueltos", forma: "zapatas", icono: "🧱", solidez: -1, explicacion: "Sin trabes de liga cada zapata se mueve distinto y agrieta los muros.", explicacionCorta: "Cada bloque se mueve por su lado y el edificio se agrieta.", dato: "Las zapatas van amarradas entre sí, siempre." },
          { texto: "Nada, el edificio es chico", corto: "Nada, es chiquito", forma: "nada", icono: "🚫", solidez: -2, explicacion: "Sin cimentación el edificio se voltea completo, no importa qué tan bueno sea arriba.", explicacionCorta: "Sin base, el edificio se puede voltear.", dato: "En un sismo la falla más común empieza abajo, no arriba." },
        ],
      },
      {
        id: "columnas",
        nombre: "Columnas",
        pregunta: "¿Cómo van las columnas?",
        preguntaCorta: "¿Cómo son las columnas?",
        opciones: [
          { texto: "Columnas gruesas, parejas y bien distribuidas", corto: "Gruesas y parejas", forma: "gruesas", icono: "🏛️", solidez: 2, explicacion: "La regularidad es lo que salva edificios. Las cargas se reparten y nada se concentra.", explicacionCorta: "¡Bien! Columnas fuertes y repartidas aguantan más.", dato: "Los edificios simétricos aguantan muchísimo mejor que los caprichosos." },
          { texto: "Planta baja abierta para estacionamiento, sin muros", corto: "Abajo sin paredes, para coches", forma: "piso-debil", icono: "🅿️", solidez: -2, explicacion: "Es el famoso piso débil: todo el edificio se apoya en columnas delgadas que ceden primero.", explicacionCorta: "Abajo queda débil y es lo primero que se cae.", dato: "En 1985 y en 2017 muchos colapsos en México fueron por planta baja débil." },
          { texto: "Columnas delgadas pero muchas", corto: "Muchas y delgaditas", forma: "delgadas", icono: "📏", solidez: 0, explicacion: "Aguantan el peso vertical, pero se doblan con el movimiento lateral.", explicacionCorta: "Las columnas delgadas se doblan cuando tiembla.", dato: "En sismo lo que importa no es sostener: es no doblarse de lado." },
        ],
      },
      {
        id: "trabes",
        nombre: "Vigas y trabes",
        pregunta: "¿Cómo unimos las columnas entre sí?",
        preguntaCorta: "¿Cómo unimos las columnas?",
        opciones: [
          { texto: "Trabes en los dos sentidos, formando marcos", corto: "Vigas por todos lados", forma: "marcos", icono: "🔲", solidez: 2, explicacion: "Los marcos rígidos son lo que evita que el edificio se abra como caja de cartón.", explicacionCorta: "¡Bien! Las vigas forman una caja fuerte.", dato: "Se busca que la trabe falle antes que la columna: columna fuerte, viga débil." },
          { texto: "Trabes solo en un sentido", corto: "Vigas de un solo lado", forma: "un-sentido", icono: "➖", solidez: -1, explicacion: "En el otro sentido el edificio queda flojo y ahí se abre.", explicacionCorta: "Del otro lado queda flojo y se abre.", dato: "El sismo no elige dirección: llega por donde quiere." },
          { texto: "Losa apoyada directo sobre las columnas", corto: "Sin vigas", forma: "sin-trabes", icono: "⬜", solidez: -2, explicacion: "Sin trabes la losa se punzona alrededor de la columna y se cae plana.", explicacionCorta: "Sin vigas, el techo se puede caer.", dato: "Se le llama falla por punzonamiento y es de las más violentas." },
        ],
      },
      {
        id: "muros",
        nombre: "Muros y acabados",
        pregunta: "Faltan los muros. ¿Qué hacemos?",
        preguntaCorta: "¿Qué paredes le ponemos?",
        opciones: [
          { texto: "Muros de relleno separados de la estructura, con castillos", corto: "Paredes con castillos", forma: "castillos", icono: "🧱", solidez: 2, explicacion: "Bien confinados aportan rigidez sin pelearse con las columnas.", explicacionCorta: "¡Bien! Los castillos hacen las paredes más fuertes.", dato: "Un muro pegado a media columna la parte: se llama columna corta." },
          { texto: "Muros pesados de piedra en los pisos altos", corto: "Paredes de piedra arriba", forma: "piedra", icono: "🪨", solidez: -2, explicacion: "El peso arriba multiplica la fuerza del sismo. Lo pesado va abajo.", explicacionCorta: "Lo pesado arriba hace que se mueva más. Lo pesado va abajo.", dato: "Un edificio con la cabeza pesada se sacude como un martillo invertido." },
          { texto: "Tablaroca ligera en todo", corto: "Paredes ligeras", forma: "ligeros", icono: "🪟", solidez: 1, explicacion: "Ligera y segura, aunque no aporta rigidez. Depende toda la estructura.", explicacionCorta: "Ligeras está bien: menos peso, menos fuerza.", dato: "Ligero es bueno en sismo: menos masa, menos fuerza." },
        ],
      },
    ],
    resultados: {
      excelente: "El edificio se movió, crujió y se quedó parado. Grietas de acabados, nada estructural. Así se ve un edificio bien hecho después de un sismo fuerte.",
      regular: "Aguantó, pero con daño: columnas agrietadas y un muro caído. Habitable después de revisión, aunque una réplica fuerte sería otro problema.",
      malo: "El edificio falló. No fue mala suerte: las decisiones de abajo se pagan arriba, y la planta baja débil o la cimentación floja no perdonan.",
    },
    resultadosCortos: {
      excelente: "¡Tu edificio aguantó el sismo! Lo construiste muy bien.",
      regular: "Aguantó, pero quedó dañado. Algunas partes estaban débiles.",
      malo: "Tu edificio se cayó. Las partes débiles no aguantan un sismo.",
    },
  },

  /* ------------------------- 🌧️ Captura de lluvia ------------------------- */
  "captura-lluvia": {
    titulo: "Sistema de captación de lluvia",
    escenario: "El techo de tu escuela",
    prueba: "🌧️ Temporada de lluvias completa",
    etapas: [
      {
        id: "techo",
        nombre: "Superficie de captación",
        pregunta: "¿De dónde captamos el agua?",
        opciones: [
          { texto: "Del techo limpio de lámina o losa impermeabilizada", icono: "🏠", solidez: 2, explicacion: "Superficie lisa y limpia: el agua llega con menos tierra y menos hojas.", dato: "Un techo de 100 m² capta unos 80 mil litros en una temporada normal." },
          { texto: "Del patio de tierra", icono: "🟤", solidez: -2, explicacion: "El agua del suelo trae lodo, animales y contaminación. No sirve ni para regar bien.", dato: "El agua de techo es la más limpia que se puede captar sin planta de tratamiento." },
          { texto: "De un techo con teja vieja y musgo", icono: "🍃", solidez: 0, explicacion: "Capta, pero arrastra mucho material orgánico que después tapa el filtro.", dato: "El musgo suelta esporas que echan a perder el agua guardada." },
        ],
      },
      {
        id: "canaleta",
        nombre: "Canaletas",
        pregunta: "¿Cómo llevamos el agua del techo al almacenamiento?",
        opciones: [
          { texto: "Canaletas con pendiente y malla contra hojas", icono: "📐", solidez: 2, explicacion: "La pendiente evita charcos y la malla evita que se tape con hojas.", dato: "Una canaleta tapada desborda y el sistema entero deja de servir." },
          { texto: "Canaletas planas, sin pendiente", icono: "➖", solidez: -1, explicacion: "El agua se queda parada, cría mosquito y se pudre.", dato: "Basta 1 cm de caída por metro para que corra sola." },
          { texto: "Que el agua caiga directo del techo a la cisterna", icono: "💦", solidez: -2, explicacion: "Sin canaleta se pierde casi todo y lo que entra llega sucio.", dato: "La canaleta es lo más barato del sistema y lo que más rendimiento da." },
        ],
      },
      {
        id: "primeras",
        nombre: "Separador de primeras lluvias",
        pregunta: "La primera lluvia arrastra todo el polvo del techo. ¿Qué hacemos?",
        opciones: [
          { texto: "Poner un separador que deseche los primeros litros", icono: "🚿", solidez: 2, explicacion: "Los primeros minutos lavan el techo. Esa agua se tira y el resto entra limpia.", dato: "Se le llama first flush y es lo que decide si el agua se puede usar o no." },
          { texto: "Guardarla toda, el filtro se encarga", icono: "🪣", solidez: -1, explicacion: "El filtro se satura en una semana y hay que cambiarlo constantemente.", dato: "Separar primero cuesta menos que filtrar de más." },
          { texto: "Barrer el techo antes de cada lluvia", icono: "🧹", solidez: 0, explicacion: "Funciona, pero nadie lo sostiene tres meses seguidos.", dato: "Los sistemas que dependen de disciplina diaria son los que se abandonan." },
        ],
      },
      {
        id: "filtro",
        nombre: "Filtrado",
        pregunta: "¿Qué filtro le ponemos?",
        opciones: [
          { texto: "Filtro de grava, arena y carbón, con acceso para limpiarlo", icono: "🪨", solidez: 2, explicacion: "Sencillo, barato y sobre todo mantenible: si no se puede limpiar, no sirve.", dato: "Un filtro que nadie puede abrir se convierte en tapón en dos meses." },
          { texto: "Una malla de mosquitero y ya", icono: "🕸️", solidez: 0, explicacion: "Detiene hojas, no partículas. Para riego alcanza; para más, no.", dato: "Para agua de uso doméstico hace falta filtrado y desinfección." },
          { texto: "Sin filtro, se asienta solo en la cisterna", icono: "🚫", solidez: -2, explicacion: "El sedimento se acumula y el agua se echa a perder en semanas.", dato: "Una cisterna sin filtro se limpia a mano cada temporada." },
        ],
      },
      {
        id: "cisterna",
        nombre: "Almacenamiento",
        pregunta: "¿Dónde guardamos el agua?",
        opciones: [
          { texto: "Cisterna cerrada, oscura y con tapa hermética", icono: "🛢️", solidez: 2, explicacion: "Sin luz no crecen algas y sin acceso no entra el mosquito.", dato: "Una cisterna destapada se vuelve criadero de dengue en una semana." },
          { texto: "Tambos abiertos en el patio", icono: "🪣", solidez: -2, explicacion: "Luz, mosquitos, hojas y evaporación: se pierde casi todo.", dato: "En zona de dengue, el agua descubierta es un problema de salud pública." },
          { texto: "Tinaco negro en el techo", icono: "⬛", solidez: 1, explicacion: "Funciona y además da presión por gravedad, aunque cabe menos.", dato: "El color negro sí ayuda: bloquea la luz y frena las algas." },
        ],
      },
    ],
    resultados: {
      excelente: "El sistema captó agua limpia toda la temporada. La escuela dejó de comprar pipas para los baños y el jardín, y nadie tuvo que limpiar la cisterna a media lluvia.",
      regular: "Captó agua, pero con problemas: sedimento en el fondo y un par de tapones en las canaletas. Con dos ajustes quedaría bien.",
      malo: "El sistema se tapó a la tercera lluvia y el agua guardada se echó a perder. Se aprende: el 90% de las fallas están en la canaleta y el filtro, no en la cisterna.",
    },
  },
};
