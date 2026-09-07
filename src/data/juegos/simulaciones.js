/**
 * Datos del motor Simulacion.jsx: los retos avanzados.
 *
 * Son partidas por turnos. En cada turno el jugador ve tres decisiones
 * posibles y elige una. Cada decisión mueve varios indicadores a la vez,
 * y a veces cuesta un recurso limitado. Al final gana si todos los
 * indicadores quedaron por encima de su meta.
 *
 * Forma:
 *   indicadores  [{ id, nombre, icono, inicial, meta }]   0 a 100
 *   recurso      { nombre, icono, inicial } o null
 *   decisiones   [{ id, texto, icono, costo, efectos, explicacion, dato }]
 *   eventos      cosas que pasan solas y mueven indicadores
 *
 * `efectos` es un objeto { idIndicador: delta }. Los deltas son de -25 a 25.
 */

export const SIMULACIONES = {
  /* --------------------------- 🌎 Salva el planeta --------------------------- */
  "salva-planeta": {
    titulo: "Salva el planeta",
    escenario: "Eres quien decide en una región del país. Seis años, seis decisiones.",
    turnos: 6,
    indicadores: [
      { id: "emisiones", nombre: "Aire limpio", icono: "💨", inicial: 45, meta: 55 },
      { id: "bosques", nombre: "Bosques", icono: "🌳", inicial: 50, meta: 55 },
      { id: "agua", nombre: "Agua", icono: "💧", inicial: 45, meta: 55 },
      { id: "biodiversidad", nombre: "Biodiversidad", icono: "🐝", inicial: 50, meta: 55 },
      { id: "gente", nombre: "Bienestar", icono: "🧑‍🤝‍🧑", inicial: 55, meta: 50 },
    ],
    decisiones: [
      { id: "sp1", icono: "🚌", texto: "Transporte público eléctrico en la ciudad", efectos: { emisiones: 18, gente: 10, agua: -2 }, explicacion: "Sacar carros de circulación es la medida urbana que más limpia el aire.", dato: "Un camión lleno saca de circulación hasta 30 automóviles." },
      { id: "sp2", icono: "🏭", texto: "Permitir una fábrica sin filtros a cambio de empleos", efectos: { emisiones: -22, gente: 12, agua: -12 }, explicacion: "Los empleos son reales, pero el costo lo paga el aire y el río de todos.", dato: "Un filtro industrial cuesta una fracción de lo que cuesta limpiar un río después." },
      { id: "sp3", icono: "🌳", texto: "Reforestar las cuencas altas con especies nativas", efectos: { bosques: 20, agua: 14, biodiversidad: 12 }, explicacion: "Reforestar arriba protege el agua y el suelo de todo lo que está abajo.", dato: "Un bosque sano infiltra al subsuelo casi la mitad de la lluvia que recibe." },
      { id: "sp4", icono: "🪓", texto: "Abrir tierra al cultivo talando bosque", efectos: { bosques: -22, biodiversidad: -16, gente: 10, agua: -8 }, explicacion: "Da comida un par de años; después el suelo sin bosque se agota y se lava.", dato: "La agricultura es la principal causa de deforestación en el mundo." },
      { id: "sp5", icono: "💧", texto: "Reparar la red de agua de la ciudad", efectos: { agua: 20, gente: 8 }, explicacion: "En muchas ciudades mexicanas se pierde en fugas cerca del 40% del agua potable.", dato: "Reparar fugas sale más barato que traer agua de más lejos." },
      { id: "sp6", icono: "☀️", texto: "Instalar generación solar en escuelas y hospitales", efectos: { emisiones: 15, gente: 6 }, explicacion: "Techos que ya existen, energía que no se transporta y ahorro público directo.", dato: "México recibe de las mejores radiaciones solares del planeta." },
      { id: "sp7", icono: "🐝", texto: "Prohibir los plaguicidas que matan polinizadores", efectos: { biodiversidad: 20, gente: -4, bosques: 4 }, explicacion: "Cuesta a corto plazo, pero sin polinizadores no hay fruta ni verdura.", dato: "Uno de cada tres bocados de tu comida depende de un polinizador." },
      { id: "sp8", icono: "🛢️", texto: "Subsidiar la gasolina para bajar el precio", efectos: { emisiones: -18, gente: 14, agua: -4 }, explicacion: "Alivia el bolsillo hoy y empuja a usar más el carro mañana.", dato: "Los subsidios a combustibles suelen beneficiar más a quien más consume." },
      { id: "sp9", icono: "♻️", texto: "Sistema municipal de separación y composta", efectos: { agua: 8, biodiversidad: 6, gente: 6, emisiones: 8 }, explicacion: "La basura orgánica en el relleno genera metano; en composta, tierra.", dato: "El metano calienta la atmósfera unas 80 veces más que el CO₂ en 20 años." },
      { id: "sp10", icono: "🏗️", texto: "Fraccionamiento nuevo sobre el humedal", efectos: { biodiversidad: -20, agua: -16, gente: 12 }, explicacion: "El humedal era la esponja que evitaba las inundaciones de la ciudad.", dato: "Construir sobre humedales es cambiar casas hoy por inundaciones cada año." },
      { id: "sp11", icono: "🐟", texto: "Crear un área natural protegida en la sierra", efectos: { biodiversidad: 18, bosques: 14, gente: -4 }, explicacion: "Proteger no es cerrar: se acuerda con las comunidades que viven ahí.", dato: "Las áreas protegidas con manejo comunitario son las que mejor se conservan." },
      { id: "sp12", icono: "🚰", texto: "Concesionar el agua a una embotelladora", efectos: { agua: -20, gente: 8, biodiversidad: -8 }, explicacion: "El pozo es finito. Lo que se extrae de más no vuelve en toda una generación.", dato: "Un acuífero sobreexplotado puede tardar siglos en recuperarse." },
    ],
    eventos: [
      { icono: "🔥", texto: "Temporada de incendios forestales muy seca.", efectos: { bosques: -8, emisiones: -6 } },
      { icono: "🌧️", texto: "Llueve más de lo normal: se recargan los acuíferos.", efectos: { agua: 8 } },
      { icono: "📈", texto: "Llega población nueva a la región.", efectos: { agua: -6, gente: 4 } },
    ],
    finales: {
      excelente: "La región llegó a fin de sexenio con aire limpio, bosques creciendo y agua suficiente. Nada de eso se logró con una sola medida: se logró sin sacrificar unas cosas por otras.",
      regular: "Se sostuvo, pero con desequilibrios. Algún indicador quedó corto y eso se va a cobrar en la siguiente década.",
      malo: "La región terminó peor de como empezó. Casi siempre pasa por lo mismo: decisiones que dan resultados rápidos y facturas lentas.",
    },
  },

  /* ---------------------------- 🧬 Ecosistema ---------------------------- */
  ecosistema: {
    titulo: "Salva el ecosistema",
    escenario: "Una laguna con su bosque alrededor. Mantén el equilibrio ocho temporadas.",
    turnos: 8,
    indicadores: [
      { id: "plantas", nombre: "Plantas", icono: "🌿", inicial: 55, meta: 40 },
      { id: "herbivoros", nombre: "Herbívoros", icono: "🦌", inicial: 50, meta: 35 },
      { id: "depredadores", nombre: "Depredadores", icono: "🦅", inicial: 45, meta: 30 },
      { id: "insectos", nombre: "Insectos", icono: "🐝", inicial: 50, meta: 40 },
      { id: "agua", nombre: "Agua", icono: "💧", inicial: 55, meta: 45 },
    ],
    /* el ecosistema se mueve solo entre turnos: ver Simulacion.jsx */
    dinamica: true,
    decisiones: [
      { id: "ec1", icono: "🦌", texto: "Reintroducir venados que ya no estaban", efectos: { herbivoros: 18, plantas: -10 }, explicacion: "Vuelven los herbívoros y con ellos la presión sobre la vegetación.", dato: "Un ecosistema sin herbívoros tampoco está sano: la vegetación se cierra." },
      { id: "ec2", icono: "🐺", texto: "Proteger a los depredadores de la zona", efectos: { depredadores: 16, herbivoros: -8, plantas: 8 }, explicacion: "Los depredadores controlan a los herbívoros y así se recupera la vegetación.", dato: "En Yellowstone, el regreso de los lobos hasta cambió el curso de los ríos." },
      { id: "ec3", icono: "🌸", texto: "Sembrar flores nativas en la orilla", efectos: { insectos: 16, plantas: 10 }, explicacion: "Las flores nativas sostienen a los polinizadores locales.", dato: "Un metro cuadrado de flores nativas alimenta más insectos que diez de pasto." },
      { id: "ec4", icono: "🧪", texto: "Fumigar contra una plaga de mosquitos", efectos: { insectos: -22, depredadores: -10, plantas: -4 }, explicacion: "El insecticida no distingue: mata mosquitos, abejas y de paso a quien se los come.", dato: "Los efectos suben por la cadena alimenticia hasta las aves." },
      { id: "ec5", icono: "🐟", texto: "Introducir una especie de pez que crece rápido", efectos: { agua: -12, insectos: -12, depredadores: 6 }, explicacion: "Las especies introducidas se comen todo y desplazan a las nativas.", dato: "Las invasiones biológicas son la segunda causa de extinción en el mundo." },
      { id: "ec6", icono: "🌳", texto: "Reforestar la ribera de la laguna", efectos: { plantas: 16, agua: 14, insectos: 6 }, explicacion: "La vegetación de la orilla filtra el agua y da sombra a la laguna.", dato: "Se le llama bosque de galería y es de los hábitats más ricos que hay." },
      { id: "ec7", icono: "🚜", texto: "Permitir ganado suelto en la orilla", efectos: { plantas: -16, agua: -12, herbivoros: 6 }, explicacion: "El ganado se come los brotes, pisa la orilla y ensucia el agua.", dato: "Basta una cerca a 10 metros del agua para que la ribera se recupere sola." },
      { id: "ec8", icono: "🚱", texto: "Extraer agua de la laguna para riego", efectos: { agua: -18, plantas: -6, herbivoros: -6 }, explicacion: "Bajar el nivel de la laguna afecta a todo lo que vive de ella.", dato: "Una laguna somera pierde muchísima agua por evaporación cuando baja." },
      { id: "ec9", icono: "🪵", texto: "Dejar los troncos caídos en su lugar", efectos: { insectos: 12, depredadores: 8, plantas: 4 }, explicacion: "La madera muerta es casa y comida de insectos, hongos y aves.", dato: "Un bosque 'limpio' de troncos caídos es un bosque más pobre." },
      { id: "ec10", icono: "🎣", texto: "Abrir la laguna a la pesca sin límite", efectos: { depredadores: -14, insectos: 8, agua: -4 }, explicacion: "Sacar a los depredadores desordena toda la cadena de abajo.", dato: "Las vedas existen para que las poblaciones alcancen a reproducirse." },
      { id: "ec11", icono: "🧹", texto: "Retirar la basura de la laguna con la comunidad", efectos: { agua: 16, insectos: 6, plantas: 4 }, explicacion: "Lo más eficaz y lo más barato: que no llegue basura y sacar la que ya está.", dato: "Las jornadas comunitarias funcionan si además se resuelve de dónde viene la basura." },
      { id: "ec12", icono: "🏞️", texto: "No hacer nada esta temporada y observar", efectos: {}, explicacion: "A veces es la mejor decisión: dejar que el sistema se acomode solo.", dato: "El monitoreo antes de actuar evita 'arreglar' lo que no estaba roto." },
    ],
    finales: {
      excelente: "La laguna terminó equilibrada: plantas, herbívoros, depredadores e insectos sosteniéndose entre sí. Eso es un ecosistema sano, no uno lleno de una sola cosa.",
      regular: "Sobrevivió, pero desbalanceado. Un grupo creció de más y otro quedó al mínimo: es cuando llegan las plagas.",
      malo: "La cadena se rompió. Casi nunca es por una decisión grande: es por varias medianas que empujaron en la misma dirección.",
    },
  },

  /* ------------------------- 🏙️ Ciudad sostenible ------------------------- */
  "ciudad-sostenible": {
    titulo: "Ciudad sostenible",
    escenario: "Administras una ciudad de 200 mil habitantes. Ocho turnos y un presupuesto.",
    turnos: 8,
    recurso: { nombre: "Presupuesto", icono: "🪙", inicial: 100 },
    indicadores: [
      { id: "vivienda", nombre: "Vivienda", icono: "🏘️", inicial: 45, meta: 50 },
      { id: "servicios", nombre: "Escuelas y salud", icono: "🏥", inicial: 45, meta: 50 },
      { id: "agua", nombre: "Agua", icono: "💧", inicial: 50, meta: 50 },
      { id: "energia", nombre: "Energía", icono: "⚡", inicial: 50, meta: 50 },
      { id: "verde", nombre: "Áreas verdes", icono: "🌳", inicial: 40, meta: 50 },
      { id: "residuos", nombre: "Manejo de residuos", icono: "♻️", inicial: 40, meta: 50 },
    ],
    decisiones: [
      { id: "ci1", icono: "🏘️", texto: "Vivienda densa cerca del centro", costo: 20, efectos: { vivienda: 20, verde: -4, servicios: 4 }, explicacion: "Densificar donde ya hay servicios cuesta menos que extender la ciudad.", dato: "Una ciudad que se extiende gasta mucho más en tubería, camión y pavimento." },
      { id: "ci2", icono: "🛣️", texto: "Fraccionamiento en las afueras", costo: 25, efectos: { vivienda: 16, verde: -14, agua: -10, servicios: -6 }, explicacion: "Casas baratas hoy, servicios carísimos para siempre.", dato: "Llevar agua y drenaje a la periferia puede costar el triple por vivienda." },
      { id: "ci3", icono: "🏫", texto: "Dos escuelas y un centro de salud", costo: 25, efectos: { servicios: 20, vivienda: 4 }, explicacion: "Los servicios son lo que convierte casas en barrio.", dato: "La distancia a la escuela es uno de los factores que más pesa en la deserción." },
      { id: "ci4", icono: "🌳", texto: "Parque lineal sobre el arroyo", costo: 20, efectos: { verde: 22, agua: 10, servicios: 4 }, explicacion: "Un parque en la zona inundable protege y da espacio público a la vez.", dato: "El área verde recomendada por la OMS es de 9 m² por habitante." },
      { id: "ci5", icono: "🚰", texto: "Reparar fugas de la red de agua", costo: 20, efectos: { agua: 22 }, explicacion: "Es lo más rentable que puede hacer una ciudad con su agua.", dato: "En varias ciudades mexicanas se fuga cerca del 40% del agua potable." },
      { id: "ci6", icono: "☀️", texto: "Paneles solares en edificios públicos", costo: 20, efectos: { energia: 18, residuos: 2 }, explicacion: "Baja el recibo del municipio y libera presupuesto para lo demás.", dato: "El ahorro de un edificio público paga los paneles en pocos años." },
      { id: "ci7", icono: "♻️", texto: "Planta de separación y composta", costo: 25, efectos: { residuos: 24, verde: 6, agua: 4 }, explicacion: "Separar en origen y compostar reduce a la mitad lo que llega al relleno.", dato: "Casi la mitad de la basura urbana en México es orgánica." },
      { id: "ci8", icono: "🗑️", texto: "Ampliar el relleno sanitario", costo: 15, efectos: { residuos: 10, agua: -10, verde: -8 }, explicacion: "Resuelve el síntoma. La basura sigue llegando y los lixiviados también.", dato: "Los lixiviados de un relleno mal sellado contaminan el agua del subsuelo." },
      { id: "ci9", icono: "🚌", texto: "Corredor de transporte público", costo: 25, efectos: { servicios: 12, energia: 8, verde: 4, vivienda: 6 }, explicacion: "Mover gente sin mover carros mejora casi todos los indicadores a la vez.", dato: "Una línea de autobús rápido cuesta una fracción de una línea de metro." },
      { id: "ci10", icono: "⚡", texto: "Planta térmica de gas para la demanda", costo: 25, efectos: { energia: 22, verde: -8 }, explicacion: "Da energía firme y barata, pero emite y amarra a la ciudad por décadas.", dato: "Una planta térmica se planea para 30 años de operación." },
      { id: "ci11", icono: "🌧️", texto: "Captación de lluvia en escuelas y mercados", costo: 15, efectos: { agua: 16, servicios: 4 }, explicacion: "Aprovecha techos que ya existen y baja la presión sobre el pozo.", dato: "Un mercado grande puede captar cientos de miles de litros por temporada." },
      { id: "ci12", icono: "💡", texto: "Cambiar todo el alumbrado público a LED", costo: 15, efectos: { energia: 16, servicios: 6 }, explicacion: "El alumbrado es de los gastos más grandes de un municipio.", dato: "El cambio a LED puede recortar dos tercios de ese consumo." },
      { id: "ci13", icono: "🏦", texto: "No gastar este turno y guardar presupuesto", costo: -20, efectos: {}, explicacion: "Ahorrar es una decisión válida cuando lo que viene cuesta más.", dato: "Los fondos de contingencia son lo que permite responder a un desastre sin endeudarse." },
    ],
    eventos: [
      { icono: "🌧️", texto: "Temporal fuerte: se inunda la zona baja.", efectos: { agua: -6, vivienda: -6 } },
      { icono: "📈", texto: "La ciudad crece más rápido de lo previsto.", efectos: { vivienda: -8, servicios: -6, residuos: -6 } },
      { icono: "🎉", texto: "Llega participación federal extra.", efectos: {}, recurso: 20 },
    ],
    finales: {
      excelente: "Ciudad equilibrada: hay dónde vivir, con qué servicios, agua que alcanza, energía limpia y verde suficiente. Ninguna ciudad real llega ahí por accidente.",
      regular: "Funciona, pero cojea de un lado. Ese indicador bajo es el que va a explotar en la siguiente administración.",
      malo: "La ciudad quedó en crisis. El patrón de siempre: crecer primero y pensar en agua, residuos y verde después.",
    },
  },

  /* ----------------------- 🚨 Simulador de emergencia ----------------------- */
  "simulador-emergencia": {
    titulo: "Simulador de emergencia",
    escenario: "Sismo magnitud 7.8 a las 11:20 de la mañana. Estás en tu escuela.",
    turnos: 6,
    ordenado: true,
    indicadores: [
      { id: "seguridad", nombre: "Seguridad del grupo", icono: "🛡️", inicial: 60, meta: 60 },
      { id: "calma", nombre: "Calma", icono: "😌", inicial: 55, meta: 50 },
      { id: "tiempo", nombre: "Tiempo", icono: "⏱️", inicial: 70, meta: 40 },
      { id: "comunicacion", nombre: "Comunicación", icono: "📻", inicial: 40, meta: 50 },
    ],
    fases: [
      {
        nombre: "1. Alerta",
        pregunta: "Suena la alerta sísmica y todavía no se siente nada.",
        decisiones: [
          { id: "e1a", icono: "🧭", texto: "Ubicar la zona segura del salón y avisar en voz alta", efectos: { seguridad: 18, calma: 12, tiempo: -6 }, explicacion: "Los segundos de la alerta son para ubicarse, no para correr.", dato: "La alerta da entre 10 y 60 segundos según la distancia al epicentro." },
          { id: "e1b", icono: "🏃", texto: "Correr todos hacia las escaleras de inmediato", efectos: { seguridad: -18, calma: -14, tiempo: -10 }, explicacion: "Cuarenta personas corriendo a unas escaleras se caen unas sobre otras.", dato: "Muchas lesiones de sismo ocurren en la evacuación, no por el edificio." },
          { id: "e1c", icono: "📱", texto: "Sacar el celular a grabar", efectos: { seguridad: -14, calma: -8, tiempo: -8 }, explicacion: "Los segundos que da la alerta no se recuperan.", dato: "En el momento del sismo el celular solo sirve para una cosa: no distraerte." },
        ],
      },
      {
        nombre: "2. Protección",
        pregunta: "Ya está temblando fuerte. Los vidrios vibran.",
        decisiones: [
          { id: "e2a", icono: "🧎", texto: "Agacharse, cubrirse la cabeza y agarrarse lejos de ventanas", efectos: { seguridad: 20, calma: 10 }, explicacion: "Agáchate, cúbrete, agárrate. Lo demás se hace cuando deje de temblar.", dato: "La mayoría de lesiones son por objetos que caen, no por derrumbe." },
          { id: "e2b", icono: "🚪", texto: "Pararse bajo el marco de la puerta", efectos: { seguridad: -10, calma: -4 }, explicacion: "Mito viejo: el marco no es más fuerte que el muro y la puerta golpea.", dato: "El consejo viene de casas de adobe de hace un siglo." },
          { id: "e2c", icono: "🪟", texto: "Asomarse a la ventana a ver el edificio de enfrente", efectos: { seguridad: -20, calma: -10 }, explicacion: "La ventana es exactamente el peor lugar del salón.", dato: "El vidrio se rompe hacia adentro y a la altura de la cara." },
        ],
      },
      {
        nombre: "3. Evacuación",
        pregunta: "Dejó de temblar. Hay polvo en el pasillo.",
        decisiones: [
          { id: "e3a", icono: "🚶", texto: "Salir en fila, sin correr, por la ruta marcada", efectos: { seguridad: 16, calma: 10, tiempo: -10 }, explicacion: "En orden se sale más rápido que en desorden, aunque no lo parezca.", dato: "Los simulacros se cronometran justo para descubrir dónde se hace cuello de botella." },
          { id: "e3b", icono: "🛗", texto: "Bajar por el elevador para ir más rápido", efectos: { seguridad: -22, tiempo: -6 }, explicacion: "Puede irse la luz en cualquier momento y quedarse atorado con la réplica.", dato: "Los elevadores modernos se detienen solos al sentir movimiento." },
          { id: "e3c", icono: "🎒", texto: "Regresar por las mochilas del salón", efectos: { seguridad: -16, tiempo: -16 }, explicacion: "No se regresa. Las réplicas empiezan en minutos.", dato: "Un muro cuarteado puede caer con la segunda sacudida." },
        ],
      },
      {
        nombre: "4. Mochila",
        pregunta: "Ya en el patio. La mochila de emergencia del grupo está en la dirección.",
        decisiones: [
          { id: "e4a", icono: "🎒", texto: "Un adulto la toma de la salida, donde siempre estuvo", efectos: { seguridad: 10, comunicacion: 12, calma: 6 }, explicacion: "Por eso la mochila va cerca de la salida y todos saben dónde está.", dato: "Se revisa dos veces al año: agua, pilas y medicinas caducan." },
          { id: "e4b", icono: "🏫", texto: "Mandar a dos alumnos a buscarla al edificio", efectos: { seguridad: -20, calma: -10 }, explicacion: "Nadie vuelve a entrar a un edificio que acaba de temblar, y menos un alumno.", dato: "Si la mochila quedó adentro, la mochila se pierde. Punto." },
          { id: "e4c", icono: "🤷", texto: "Prescindir de ella, total ya salimos", efectos: { comunicacion: -10, calma: -4 }, explicacion: "Ahí están el radio, el botiquín y la lista del grupo.", dato: "La lista de asistencia es lo que permite saber si falta alguien." },
        ],
      },
      {
        nombre: "5. Punto de reunión",
        pregunta: "Están todos afuera, dispersos por el patio.",
        decisiones: [
          { id: "e5a", icono: "🪧", texto: "Concentrarse en el punto de reunión y pasar lista", efectos: { seguridad: 14, calma: 14, comunicacion: 10 }, explicacion: "Pasar lista es cómo se sabe, en minutos, si falta alguien adentro.", dato: "El punto de reunión va en zona abierta, lejos de cables y bardas." },
          { id: "e5b", icono: "🚧", texto: "Esperar pegados a la barda perimetral", efectos: { seguridad: -16, calma: -6 }, explicacion: "Las bardas son de lo primero que se cae con una réplica.", dato: "Por eso el punto de reunión se marca lejos de bardas y postes." },
          { id: "e5c", icono: "🚪", texto: "Que cada quien se vaya a su casa de inmediato", efectos: { seguridad: -12, comunicacion: -16, calma: -8 }, explicacion: "Sin lista nadie sabe quién salió y quién no.", dato: "Los alumnos se entregan a un adulto responsable, no se sueltan a la calle." },
        ],
      },
      {
        nombre: "6. Comunicación",
        pregunta: "Todos quieren avisar a su familia. La red está saturada.",
        decisiones: [
          { id: "e6a", icono: "💬", texto: "Mensajes de texto cortos y encender el radio de pilas", efectos: { comunicacion: 22, calma: 12 }, explicacion: "El texto pasa cuando la llamada no, y el radio da información oficial.", dato: "Un mensaje ocupa una fracción de la red que ocupa una llamada." },
          { id: "e6b", icono: "📞", texto: "Que todos llamen al mismo tiempo", efectos: { comunicacion: -18, calma: -10 }, explicacion: "Saturar más la red deja fuera también a las llamadas de emergencia.", dato: "Después de un sismo, la red de voz es lo primero que colapsa." },
          { id: "e6c", icono: "📲", texto: "Reenviar los audios que están circulando", efectos: { comunicacion: -20, calma: -16 }, explicacion: "Los rumores en emergencia hacen daño real: mandan gente al lugar equivocado.", dato: "Solo se comparte lo que viene de protección civil o de fuentes oficiales." },
        ],
      },
    ],
    finales: {
      excelente: "Grupo completo, sin heridos, en el punto de reunión y con las familias avisadas. Eso no salió bien por suerte: salió bien porque cada paso se hizo en el orden correcto.",
      regular: "Salieron todos, pero con sustos evitables y tiempo perdido. En un sismo más fuerte, esos minutos importan.",
      malo: "La emergencia se manejó mal. Lo más duro de esto es que casi todos los errores se ven obvios después, y ninguno se ve obvio durante.",
    },
  },

  /* --------------------- 🧑‍🚒 Comandante de emergencias --------------------- */
  "comandante-emergencias": {
    titulo: "Comandante de emergencias",
    escenario: "Centro de mando. Un sismo dejó daños en toda la ciudad y tienes recursos limitados.",
    turnos: 7,
    recurso: { nombre: "Unidades", icono: "🚒", inicial: 12 },
    indicadores: [
      { id: "rescate", nombre: "Rescate", icono: "🧑‍🚒", inicial: 40, meta: 55 },
      { id: "salud", nombre: "Atención médica", icono: "🏥", inicial: 45, meta: 55 },
      { id: "refugio", nombre: "Refugios", icono: "⛺", inicial: 35, meta: 50 },
      { id: "info", nombre: "Información", icono: "📻", inicial: 40, meta: 50 },
    ],
    decisiones: [
      { id: "cm1", icono: "🐕", texto: "Mandar brigada con binomios caninos al edificio colapsado", costo: 3, efectos: { rescate: 22, salud: 4 }, explicacion: "Las primeras horas son las que más vidas salvan en un colapso.", dato: "Se les llama las 72 horas críticas por eso." },
      { id: "cm2", icono: "🏥", texto: "Instalar puesto médico avanzado cerca de la zona cero", costo: 3, efectos: { salud: 22, rescate: 6 }, explicacion: "Atender ahí mismo evita que los hospitales se saturen de casos leves.", dato: "El triage en campo es lo que permite priorizar a quien de verdad no puede esperar." },
      { id: "cm3", icono: "⛺", texto: "Habilitar refugios en escuelas con agua y sanitarios", costo: 3, efectos: { refugio: 22, salud: 8 }, explicacion: "Un refugio sin agua ni sanitarios se vuelve un problema sanitario en dos días.", dato: "Las enfermedades por agua son la segunda emergencia después del desastre." },
      { id: "cm4", icono: "📻", texto: "Boletín cada hora por radio y altavoz", costo: 2, efectos: { info: 22, refugio: 6 }, explicacion: "Información constante y oficial es lo que corta los rumores.", dato: "Un rumor puede mandar a cientos de personas al lugar equivocado." },
      { id: "cm5", icono: "🚧", texto: "Cerrar y acordonar las zonas con edificios dañados", costo: 2, efectos: { rescate: 10, salud: 8, info: 6 }, explicacion: "Evita que curiosos y voluntarios sin equipo entren y se conviertan en víctimas.", dato: "El acordonamiento también deja pasar a las máquinas pesadas." },
      { id: "cm6", icono: "🙋", texto: "Aceptar a todos los voluntarios sin coordinarlos", costo: 0, efectos: { rescate: -12, info: -14, salud: -6 }, explicacion: "La ayuda sin coordinar estorba y satura. Se organiza o no sirve.", dato: "En 2017 hubo zonas donde se pidió a los voluntarios retirarse por saturación." },
      { id: "cm7", icono: "🚰", texto: "Pipas de agua potable a colonias sin servicio", costo: 2, efectos: { salud: 16, refugio: 10 }, explicacion: "Sin agua potable, en 48 horas empiezan las infecciones intestinales.", dato: "Se calculan mínimo 15 litros por persona al día en emergencia." },
      { id: "cm8", icono: "📋", texto: "Censo de daños casa por casa", costo: 2, efectos: { info: 16, refugio: 10, rescate: 4 }, explicacion: "Sin censo se reparte la ayuda a quien grita más fuerte, no a quien más la necesita.", dato: "El censo es lo que después permite la reconstrucción con apoyo." },
      { id: "cm9", icono: "📸", texto: "Dedicar unidades a la conferencia de prensa en el centro", costo: 2, efectos: { info: 6, rescate: -10, salud: -6 }, explicacion: "Informar es necesario, pero no a costa de las unidades que están rescatando.", dato: "La comunicación en emergencia la lleva un vocero, no las brigadas." },
      { id: "cm10", icono: "🔌", texto: "Restablecer energía en hospitales y refugios", costo: 3, efectos: { salud: 16, refugio: 14, info: 6 }, explicacion: "Sin luz no hay quirófano, ni cadena de frío para medicinas, ni radio.", dato: "Los hospitales tienen planta de emergencia, pero con combustible contado." },
      { id: "cm11", icono: "🛢️", texto: "Revisar y cortar fugas de gas de la zona", costo: 2, efectos: { rescate: 12, salud: 10 }, explicacion: "Muchos incendios después de un sismo no los causa el temblor: los causa el gas.", dato: "Es de las primeras tareas de bomberos tras un sismo urbano." },
      { id: "cm12", icono: "🛌", texto: "Rotar a las brigadas para que descansen", costo: 1, efectos: { rescate: 10, salud: 6 }, explicacion: "Un rescatista agotado se equivoca y se lastima. El relevo no es un lujo.", dato: "Los turnos de rescate se limitan por protocolo, justamente por eso." },
    ],
    eventos: [
      { icono: "🌪️", texto: "Réplica fuerte: un edificio ya dañado cede.", efectos: { rescate: -10, refugio: -6 } },
      { icono: "🚚", texto: "Llega apoyo de otro estado.", efectos: {}, recurso: 3 },
      { icono: "🌧️", texto: "Empieza a llover sobre los refugios improvisados.", efectos: { refugio: -10, salud: -6 } },
    ],
    finales: {
      excelente: "Rescate, salud, refugio e información funcionando a la vez. Lo difícil de una emergencia no es hacer una cosa bien: es no abandonar las otras tres mientras la haces.",
      regular: "Se salió adelante, pero con un frente descuidado. Casi siempre es el refugio o la información: se ven menos urgentes y cobran caro.",
      malo: "El operativo se desbordó. Recursos limitados obligan a priorizar, y priorizar mal cuesta más que no tener recursos.",
    },
  },

  /* -------------------- 🏆 Gran desafío Tecnito vs Greencito -------------------- */
  "tecnito-vs-greencito": {
    titulo: "Ciudad 100% segura y sostenible",
    escenario: "El reto final: Tecnito cuida seguridad, emergencias e infraestructura; Greencito cuida agua, residuos, energía y naturaleza. La ciudad necesita las dos cosas.",
    turnos: 10,
    recurso: { nombre: "Presupuesto", icono: "🪙", inicial: 120 },
    indicadores: [
      { id: "seguridad", nombre: "Seguridad", icono: "🛡️", inicial: 45, meta: 55, equipo: "tecnito" },
      { id: "emergencias", nombre: "Emergencias", icono: "🚨", inicial: 40, meta: 55, equipo: "tecnito" },
      { id: "infra", nombre: "Infraestructura", icono: "🏗️", inicial: 45, meta: 55, equipo: "tecnito" },
      { id: "agua", nombre: "Agua", icono: "💧", inicial: 45, meta: 55, equipo: "greencito" },
      { id: "residuos", nombre: "Residuos", icono: "♻️", inicial: 40, meta: 55, equipo: "greencito" },
      { id: "energia", nombre: "Energía", icono: "⚡", inicial: 45, meta: 55, equipo: "greencito" },
      { id: "naturaleza", nombre: "Naturaleza", icono: "🌳", inicial: 40, meta: 55, equipo: "greencito" },
    ],
    decisiones: [
      { id: "tg1", icono: "🏗️", texto: "Reforzar escuelas y hospitales contra sismo", costo: 20, efectos: { seguridad: 20, infra: 14 }, explicacion: "Los edificios donde se refugia la gente son los primeros que deben aguantar.", dato: "Reforzar cuesta una fracción de reconstruir." },
      { id: "tg2", icono: "🚨", texto: "Sistema de alerta y simulacros en toda la ciudad", costo: 15, efectos: { emergencias: 22, seguridad: 8 }, explicacion: "La alerta sirve solo si la gente sabe qué hacer con esos segundos.", dato: "Un simulacro anual bien hecho vale más que diez alertas sin practicar." },
      { id: "tg3", icono: "🚒", texto: "Equipar y capacitar cuerpos de emergencia", costo: 20, efectos: { emergencias: 20, seguridad: 8 }, explicacion: "Equipo y entrenamiento, no uno u otro.", dato: "Muchos municipios tienen camión de bomberos y nadie capacitado para operarlo." },
      { id: "tg4", icono: "🌳", texto: "Reforestar el cerro que domina la ciudad", costo: 15, efectos: { naturaleza: 20, agua: 12, seguridad: 10 }, explicacion: "Un cerro con bosque no se derrumba sobre las casas de abajo.", dato: "Aquí seguridad y naturaleza son exactamente lo mismo." },
      { id: "tg5", icono: "🌊", texto: "Parque inundable en la zona de riesgo del río", costo: 20, efectos: { naturaleza: 16, agua: 14, seguridad: 14, infra: 6 }, explicacion: "En vez de casas donde se inunda, un parque que absorbe la crecida.", dato: "Es la solución más barata a largo plazo contra inundaciones urbanas." },
      { id: "tg6", icono: "♻️", texto: "Separación de residuos y planta de composta", costo: 20, efectos: { residuos: 24, naturaleza: 8 }, explicacion: "Reduce a la mitad lo que llega al relleno y devuelve tierra fértil.", dato: "El relleno mal manejado también es un riesgo: los taludes de basura colapsan." },
      { id: "tg7", icono: "☀️", texto: "Solar en edificios públicos con respaldo de batería", costo: 25, efectos: { energia: 20, emergencias: 12 }, explicacion: "Energía limpia todos los días y energía disponible el día de la emergencia.", dato: "Un refugio con batería sigue funcionando cuando se cae la red." },
      { id: "tg8", icono: "🚰", texto: "Reparar fugas y captación de lluvia municipal", costo: 20, efectos: { agua: 24, infra: 8 }, explicacion: "Lo más rentable que puede hacer una ciudad con su agua.", dato: "El agua que no se fuga no hay que traerla de otro lado." },
      { id: "tg9", icono: "🌉", texto: "Reforzar puentes y rutas de evacuación", costo: 20, efectos: { infra: 22, emergencias: 12, seguridad: 6 }, explicacion: "Una ruta de evacuación cortada convierte una emergencia en tragedia.", dato: "Los puentes se revisan después de cada sismo y cada crecida." },
      { id: "tg10", icono: "🏘️", texto: "Reubicar viviendas de la barranca a suelo firme", costo: 25, efectos: { seguridad: 22, naturaleza: 10, infra: 6 }, explicacion: "Es caro, es impopular y es lo único que de verdad resuelve el riesgo.", dato: "La reubicación funciona solo si la gente participa en decidir a dónde." },
      { id: "tg11", icono: "💡", texto: "Alumbrado LED con respaldo en rutas de evacuación", costo: 15, efectos: { energia: 16, seguridad: 10, emergencias: 6 }, explicacion: "Ahorra todos los días y alumbra la noche que se va la luz.", dato: "Una ruta de evacuación a oscuras es una ruta que nadie usa." },
      { id: "tg12", icono: "🏢", texto: "Aprobar torres en la zona de suelo blando", costo: -15, efectos: { seguridad: -22, infra: -12, agua: -8, naturaleza: -8 }, explicacion: "Entra dinero hoy y se construye el desastre de mañana.", dato: "El suelo blando amplifica la sacudida hasta cinco veces." },
      { id: "tg13", icono: "🏦", texto: "Guardar presupuesto para el fondo de contingencia", costo: -20, efectos: { emergencias: 6 }, explicacion: "El fondo es lo que permite responder sin endeudar a la ciudad.", dato: "Cada peso invertido en prevención ahorra varios en reconstrucción." },
    ],
    eventos: [
      { icono: "🌎", texto: "Sismo moderado: se prueba lo que construiste.", efectos: { infra: -8, emergencias: -6 } },
      { icono: "🌧️", texto: "Temporal histórico sobre la cuenca.", efectos: { agua: -6, seguridad: -6 } },
      { icono: "🤝", texto: "Fondo federal de resiliencia urbana.", efectos: {}, recurso: 25 },
    ],
    finales: {
      excelente: "Ciudad segura y sostenible al mismo tiempo. Ese era el punto: Tecnito y Greencito no compiten por el presupuesto, casi siempre las mismas obras sirven a los dos.",
      regular: "La ciudad quedó fuerte de un lado y floja del otro. Una ciudad muy segura pero sin agua, o muy verde pero que se cae, no está terminada.",
      malo: "No alcanzó. La lección no es que faltó dinero: es que las decisiones que sirven a un solo equipo cuestan lo mismo que las que sirven a los dos.",
    },
  },
};
