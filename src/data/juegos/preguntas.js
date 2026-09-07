/**
 * Bancos de preguntas de los minijuegos de decisión.
 *
 * El motor Quiz.jsx no sabe nada de sismos ni de agua: solo lee de aquí.
 * Para agregar contenido basta con meter otra pregunta al arreglo; no hay
 * que tocar ni una línea de lógica.
 *
 * Forma de una pregunta:
 *   {
 *     id, icono, situacion,
 *     opciones: [{ texto, ok }],   // el orden se revuelve al jugar
 *     explicacion,                 // por qué la buena es la buena
 *     dato,                        // el "¿sabías que...?"
 *   }
 *
 * En los bancos de verdadero/falso se usa `afirmacion` y `verdadero`.
 */

export const PREGUNTAS = {
  /* ===================== 🛡️ TECNITO ===================== */

  agachate: [
    {
      id: "ag1",
      icono: "🏫",
      situacion: "Estás en el salón y empieza a temblar fuerte. Tu banca está a dos pasos.",
      opciones: [
        { texto: "Agacharme junto a la banca, cubrirme la cabeza y agarrarme", ok: true },
        { texto: "Correr al pasillo antes de que se ponga peor", ok: false },
        { texto: "Quedarme parado hasta ver qué hacen los demás", ok: false },
        { texto: "Asomarme por la ventana a ver el edificio de enfrente", ok: false },
      ],
      explicacion:
        "Agáchate, cúbrete y agárrate. Mientras el piso se mueve, caminar es lo más peligroso que puedes hacer.",
      dato: "La mayoría de las lesiones en un sismo no son por derrumbe: son por golpes con cosas que caen.",
    },
    {
      id: "ag2",
      icono: "🛏️",
      situacion: "Tiembla de madrugada y estás en tu cama, a oscuras.",
      opciones: [
        { texto: "Quedarme en la cama y cubrirme la cabeza con la almohada", ok: true },
        { texto: "Levantarme a buscar la puerta en la oscuridad", ok: false },
        { texto: "Prender la luz para ver por dónde salir", ok: false },
        { texto: "Meterme debajo de la cama", ok: false },
      ],
      explicacion:
        "En la cama estás protegido y no pisas vidrios. La almohada cubre lo más importante: la cabeza.",
      dato: "Después de un sismo nocturno lo más común son cortadas en los pies. Ten zapatos junto a la cama.",
    },
    {
      id: "ag3",
      icono: "🛗",
      situacion: "Vas en el pasillo del segundo piso y empieza la alerta sísmica.",
      opciones: [
        { texto: "Alejarme de las ventanas y agacharme junto a un muro firme", ok: true },
        { texto: "Tomar el elevador para bajar rápido", ok: false },
        { texto: "Correr por las escaleras mientras tiembla", ok: false },
        { texto: "Pararme bajo el marco de la puerta", ok: false },
      ],
      explicacion:
        "Elevador nunca: se puede quedar atorado sin luz. El marco de la puerta es un mito, no aguanta más que un muro.",
      dato: "La alerta sísmica funciona porque la señal de radio viaja más rápido que la sacudida del suelo.",
    },
    {
      id: "ag4",
      icono: "🚌",
      situacion: "Vas en el camión de la escuela y el chofer se orilla porque está temblando.",
      opciones: [
        { texto: "Quedarme sentado, con el cinturón puesto y la cabeza cubierta", ok: true },
        { texto: "Bajarme corriendo del camión", ok: false },
        { texto: "Pararme junto a la puerta para salir primero", ok: false },
      ],
      explicacion:
        "Dentro del vehículo detenido y lejos de puentes estás más seguro que afuera, donde caen postes y cables.",
      dato: "Un camión detenido en zona abierta es de los lugares más seguros durante un sismo.",
    },
    {
      id: "ag5",
      icono: "🏬",
      situacion: "Estás en una tienda grande y los anaqueles empiezan a moverse.",
      opciones: [
        { texto: "Alejarme de los anaqueles y cubrirme en un espacio abierto", ok: true },
        { texto: "Correr a la salida junto con toda la gente", ok: false },
        { texto: "Detener los productos para que no se caigan", ok: false },
        { texto: "Meterme debajo de un anaquel", ok: false },
      ],
      explicacion:
        "Los anaqueles altos se vuelcan. Correr a la salida en bola provoca caídas y aplastamientos.",
      dato: "En las tiendas de Japón los anaqueles van anclados al muro por ley, justo por esto.",
    },
    {
      id: "ag6",
      icono: "🌊",
      situacion: "Estás en la playa de Guerrero, tiembla muy fuerte y el mar se retira de golpe.",
      opciones: [
        { texto: "Alejarme de la costa y subir a un lugar alto de inmediato", ok: true },
        { texto: "Acercarme a ver los peces que quedaron en la arena", ok: false },
        { texto: "Esperar a que suene una alarma oficial", ok: false },
      ],
      explicacion:
        "Que el mar se retire es la señal natural de tsunami. El sismo mismo es la alerta: no esperes ninguna otra.",
      dato: "Después de un sismo costero fuerte, la ola puede llegar en menos de 15 minutos.",
    },
    {
      id: "ag7",
      icono: "♿",
      situacion: "Tiembla y tu compañero usa silla de ruedas y está a tu lado.",
      opciones: [
        { texto: "Frenar la silla, ayudarlo a cubrirse la cabeza y quedarme con él", ok: true },
        { texto: "Empujar la silla corriendo hacia la salida", ok: false },
        { texto: "Ir por un maestro y dejarlo solo mientras tiembla", ok: false },
      ],
      explicacion:
        "Frenar y proteger la cabeza. Moverse mientras tiembla es peligroso para los dos.",
      dato: "Los planes de protección civil incluyen una persona asignada para apoyar a cada compañero que lo necesite.",
    },
    {
      id: "ag8",
      icono: "⏱️",
      situacion: "Dejó de temblar hace diez segundos. Estás en el salón, todo quedó quieto.",
      opciones: [
        { texto: "Salir con calma por la ruta marcada al punto de reunión", ok: true },
        { texto: "Quedarme sentado, ya pasó todo", ok: false },
        { texto: "Correr por mi mochila al casillero", ok: false },
        { texto: "Hablar por teléfono a mi casa desde el salón", ok: false },
      ],
      explicacion:
        "Cuando deja de temblar es cuando se evacúa, en orden y sin regresar por cosas. Pueden venir réplicas.",
      dato: "Las réplicas siguen días o semanas. Un muro cuarteado puede caer con la segunda sacudida.",
    },
  ],

  incendio: [
    {
      id: "in1",
      icono: "🔥",
      situacion: "Se prende el sartén con aceite en la cocina de tu casa.",
      opciones: [
        { texto: "Tapar el sartén con una tapa y apagar la estufa", ok: true },
        { texto: "Echarle agua para apagarlo rápido", ok: false },
        { texto: "Sacar el sartén ardiendo al patio", ok: false },
        { texto: "Soplarle fuerte para apagar la flama", ok: false },
      ],
      explicacion:
        "Sin oxígeno el fuego se apaga. El agua sobre aceite ardiendo lo hace explotar hacia arriba.",
      dato: "El agua en aceite caliente se vuelve vapor de golpe y avienta el fuego hasta tres metros.",
    },
    {
      id: "in2",
      icono: "💨",
      situacion: "Hay humo en el pasillo y tienes que salir del edificio.",
      opciones: [
        { texto: "Avanzar agachado, casi a gatas, cubriéndome nariz y boca", ok: true },
        { texto: "Correr de pie lo más rápido posible", ok: false },
        { texto: "Aguantar la respiración y caminar normal", ok: false },
      ],
      explicacion:
        "El humo caliente sube. Cerca del piso queda el aire respirable y además se ve mejor.",
      dato: "En un incendio el humo mata antes que las llamas: en tres respiraciones puedes desmayarte.",
    },
    {
      id: "in3",
      icono: "🚪",
      situacion: "Vas a abrir una puerta para salir y no sabes qué hay del otro lado.",
      opciones: [
        { texto: "Tocar la puerta con el dorso de la mano; si quema, buscar otra salida", ok: true },
        { texto: "Abrirla de golpe para salir rápido", ok: false },
        { texto: "Abrirla poco a poco asomando la cara", ok: false },
      ],
      explicacion:
        "Una puerta caliente significa fuego atrás. Abrirla le da oxígeno al incendio y te lo echa encima.",
      dato: "Se toca con el dorso de la mano porque si te quemas ahí, la palma te sigue sirviendo para agarrarte.",
    },
    {
      id: "in4",
      icono: "🧯",
      situacion: "Tu ropa se prende fuego.",
      opciones: [
        { texto: "Detenerme, tirarme al piso y rodar", ok: true },
        { texto: "Correr a buscar una llave de agua", ok: false },
        { texto: "Quitarme la ropa jalándola hacia arriba", ok: false },
        { texto: "Sacudirme con las manos", ok: false },
      ],
      explicacion:
        "Alto, tírate y rueda. Correr le echa aire al fuego y lo hace más grande.",
      dato: "Rodar apaga el fuego porque le quita el oxígeno contra el piso.",
    },
    {
      id: "in5",
      icono: "🪟",
      situacion: "Estás atrapado en un cuarto con humo bajo la puerta y no puedes salir.",
      opciones: [
        { texto: "Tapar la rendija con ropa mojada y hacerme ver desde la ventana", ok: true },
        { texto: "Romper la ventana y saltar", ok: false },
        { texto: "Esconderme en el clóset", ok: false },
      ],
      explicacion:
        "Sellar la entrada de humo y señalizar dónde estás. Los bomberos buscan primero en las ventanas.",
      dato: "Un trapo mojado en la rendija puede darte varios minutos extra de aire limpio.",
    },
    {
      id: "in6",
      icono: "📱",
      situacion: "Ya saliste de la casa que se está incendiando y tu mochila quedó adentro.",
      opciones: [
        { texto: "No volver a entrar por nada y llamar al 911", ok: true },
        { texto: "Entrar rápido, sé exactamente dónde está", ok: false },
        { texto: "Pedirle a alguien más que entre por ella", ok: false },
      ],
      explicacion:
        "Nunca se regresa a un edificio en llamas. Ninguna cosa vale una vida.",
      dato: "Un cuarto puede pasar de fuego pequeño a incendio total en menos de tres minutos.",
    },
    {
      id: "in7",
      icono: "🕯️",
      situacion: "Se fue la luz en tu casa y hay que alumbrar.",
      opciones: [
        { texto: "Usar linterna de pilas", ok: true },
        { texto: "Encender velas en toda la casa", ok: false },
        { texto: "Prender la estufa para que dé luz", ok: false },
      ],
      explicacion:
        "Linterna siempre. Una vela olvidada es una de las causas más comunes de incendio en casa.",
      dato: "Por eso en la mochila de emergencia van linternas y no velas.",
    },
    {
      id: "in8",
      icono: "🔔",
      situacion: "Suena la alarma de incendio en la escuela durante el examen.",
      opciones: [
        { texto: "Dejar todo y salir en orden por la ruta de evacuación", ok: true },
        { texto: "Terminar la pregunta en la que voy", ok: false },
        { texto: "Esperar a que el maestro confirme si es real", ok: false },
        { texto: "Recoger mis cosas antes de salir", ok: false },
      ],
      explicacion:
        "Toda alarma se trata como real y se sale sin recoger nada.",
      dato: "En los simulacros se mide el tiempo justo para descubrir qué salidas se hacen cuello de botella.",
    },
  ],

  extintor: [
    {
      id: "ex1",
      icono: "🗑️",
      situacion: "Se está quemando un bote de basura con papel y cartón. ¿Qué extintor usas?",
      opciones: [
        { texto: "Clase A: agua o polvo ABC, para sólidos como papel y madera", ok: true },
        { texto: "Clase B, el de líquidos inflamables", ok: false },
        { texto: "Clase C, el de equipos eléctricos", ok: false },
        { texto: "Ninguno, mejor le echo tierra encima", ok: false },
      ],
      explicacion:
        "Papel, madera y tela son fuego clase A. El polvo ABC sirve para casi todo y es el más común.",
      dato: "La letra del extintor dice qué material puede apagar, no qué tan potente es.",
    },
    {
      id: "ex2",
      icono: "💻",
      situacion: "Se incendia la computadora del salón, todavía conectada.",
      opciones: [
        { texto: "Extintor clase C o CO₂, y desconectar si se puede sin riesgo", ok: true },
        { texto: "Echarle agua", ok: false },
        { texto: "Extintor de espuma", ok: false },
      ],
      explicacion:
        "Los equipos con corriente necesitan un agente que no conduzca electricidad. Agua y espuma sí conducen.",
      dato: "El CO₂ no deja residuo, por eso se usa donde hay equipo electrónico caro.",
    },
    {
      id: "ex3",
      icono: "🍳",
      situacion: "Arde el aceite de la freidora de la cocina de la escuela.",
      opciones: [
        { texto: "Extintor clase K, hecho para grasas de cocina", ok: true },
        { texto: "Extintor de agua a presión", ok: false },
        { texto: "Extintor clase A", ok: false },
      ],
      explicacion:
        "Las grasas de cocina son clase K. Necesitan un químico que forme una capa sobre el aceite.",
      dato: "Un extintor clase A sobre aceite ardiendo lo esparce en lugar de apagarlo.",
    },
    {
      id: "ex4",
      icono: "⛽",
      situacion: "Se derramó gasolina y se prendió en el patio.",
      opciones: [
        { texto: "Extintor clase B, para líquidos inflamables", ok: true },
        { texto: "Cubetas de agua", ok: false },
        { texto: "Extintor clase C", ok: false },
      ],
      explicacion:
        "La gasolina flota sobre el agua: echarle agua reparte el fuego en vez de apagarlo.",
      dato: "Los líquidos inflamables son clase B, la B de bidón ayuda a recordarlo.",
    },
    {
      id: "ex5",
      icono: "🎯",
      situacion: "Ya tienes el extintor correcto en la mano. ¿A dónde apuntas?",
      opciones: [
        { texto: "A la base del fuego, moviendo la boquilla en abanico", ok: true },
        { texto: "A las llamas más altas", ok: false },
        { texto: "Al humo que sale", ok: false },
      ],
      explicacion:
        "A la base: ahí está el material que arde. Las llamas son solo el resultado.",
      dato: "Se recuerda como PASA: Pasador, Apuntar, Sujetar, Abanicar.",
    },
    {
      id: "ex6",
      icono: "🚪",
      situacion: "Vas a usar el extintor en un cuarto pequeño. ¿Cómo te paras?",
      opciones: [
        { texto: "De espaldas a la salida, con el fuego enfrente", ok: true },
        { texto: "Entre el fuego y la salida, para que no se escape", ok: false },
        { texto: "Lo más cerca posible de las llamas", ok: false },
      ],
      explicacion:
        "Nunca dejes que el fuego quede entre tú y la puerta. Si crece, necesitas poder salir.",
      dato: "Un extintor casero dura entre 10 y 20 segundos. No es para pelear, es para ganar tiempo.",
    },
  ],

  "fuga-gas": [
    {
      id: "fg1",
      icono: "👃",
      situacion: "Entras a la cocina y huele fuerte a gas.",
      opciones: [
        { texto: "No tocar interruptores, abrir puertas y ventanas y salir", ok: true },
        { texto: "Prender la luz para revisar la estufa", ok: false },
        { texto: "Usar la linterna del celular para ver la fuga", ok: false },
        { texto: "Prender el ventilador para que se vaya el olor", ok: false },
      ],
      explicacion:
        "Cualquier chispa enciende el gas, y los apagadores hacen chispa por dentro. Ventilar y salir.",
      dato: "El gas natural no huele. Le agregan un químico apestoso a propósito para que lo detectes.",
    },
    {
      id: "fg2",
      icono: "📞",
      situacion: "Ya saliste de la casa y hueles gas desde la banqueta.",
      opciones: [
        { texto: "Llamar desde lejos de la casa a emergencias o a la empresa de gas", ok: true },
        { texto: "Llamar desde la cocina para explicar mejor", ok: false },
        { texto: "Esperar a ver si el olor se quita solo", ok: false },
      ],
      explicacion:
        "El celular también puede hacer chispa. Se llama desde afuera, lejos de la fuga.",
      dato: "El gas LP es más pesado que el aire y se acumula en el piso, por eso el peligro está abajo.",
    },
    {
      id: "fg3",
      icono: "🔧",
      situacion: "Ves que la manguera del tanque de gas está partida.",
      opciones: [
        { texto: "Cerrar la llave del tanque y avisar a un adulto", ok: true },
        { texto: "Taparla con cinta adhesiva", ok: false },
        { texto: "Amarrarla con un trapo mojado", ok: false },
      ],
      explicacion:
        "Cerrar el paso del gas primero. Los parches caseros fallan y la fuga vuelve.",
      dato: "Las mangueras de gas tienen fecha de caducidad impresa: se cambian aunque se vean bien.",
    },
    {
      id: "fg4",
      icono: "🫧",
      situacion: "Quieren revisar si una conexión de gas tiene fuga pequeña.",
      opciones: [
        { texto: "Untar agua con jabón: si burbujea, hay fuga", ok: true },
        { texto: "Acercar un cerillo para ver si se aviva", ok: false },
        { texto: "Oler muy de cerca la conexión", ok: false },
      ],
      explicacion:
        "El agua jabonosa hace burbujas donde escapa el gas. Es la prueba que usan los técnicos.",
      dato: "Nunca se busca una fuga con flama, ni siquiera una chiquita.",
    },
    {
      id: "fg5",
      icono: "🌬️",
      situacion: "Después de un sismo, tu casa huele a gas.",
      opciones: [
        { texto: "Cerrar la llave general del gas y no encender nada", ok: true },
        { texto: "Encender la estufa para gastar el gas que quedó", ok: false },
        { texto: "Quedarme adentro con las ventanas cerradas", ok: false },
      ],
      explicacion:
        "Las tuberías se rompen con la sacudida. Cerrar el paso general y ventilar.",
      dato: "Muchos incendios después de un sismo no los causa el temblor: los causa el gas acumulado.",
    },
  ],

  "llamada-emergencia": [
    {
      id: "ll1",
      icono: "☎️",
      situacion: "Contesta el 911. ¿Qué dices primero?",
      opciones: [
        { texto: "Qué está pasando, en una frase clara", ok: true },
        { texto: "Mi nombre completo y mi edad", ok: false },
        { texto: "Que tengo mucho miedo", ok: false },
        { texto: "Que se apuren", ok: false },
      ],
      explicacion:
        "Primero qué pasa: eso decide qué ayuda mandan, si ambulancia, bomberos o policía.",
      dato: "El 911 funciona en todo México desde 2016 y atiende desde cualquier teléfono, aunque no tenga saldo.",
    },
    {
      id: "ll2",
      icono: "📍",
      situacion: "Te preguntan dónde es la emergencia.",
      opciones: [
        { texto: "Calle, número, colonia y una referencia como 'frente a la tienda azul'", ok: true },
        { texto: "'Aquí en mi casa'", ok: false },
        { texto: "'Cerca del centro'", ok: false },
      ],
      explicacion:
        "La dirección exacta y una referencia visible. La referencia es lo que hace que la ambulancia no se pase de largo.",
      dato: "En muchas emergencias el tiempo se pierde buscando la dirección, no en el camino.",
    },
    {
      id: "ll3",
      icono: "🧑‍🤝‍🧑",
      situacion: "Preguntan cuántas personas están involucradas.",
      opciones: [
        { texto: "El número exacto que veo y si alguna no responde", ok: true },
        { texto: "'Varias, no sé cuántas'", ok: false },
        { texto: "'Muchísimas, es un caos'", ok: false },
      ],
      explicacion:
        "El número decide cuántas unidades mandan. Si no estás seguro, di lo que sí ves.",
      dato: "Decir si alguien no responde cambia la prioridad de la llamada de inmediato.",
    },
    {
      id: "ll4",
      icono: "⚠️",
      situacion: "Preguntan si hay algún riesgo en el lugar.",
      opciones: [
        { texto: "Avisar de fuga de gas, cables caídos, fuego o gente atrapada", ok: true },
        { texto: "Decir que no, para que lleguen más rápido", ok: false },
        { texto: "No mencionarlo, ya lo verán al llegar", ok: false },
      ],
      explicacion:
        "Los rescatistas necesitan saberlo antes de bajar del camión, por su seguridad y la tuya.",
      dato: "Un cable caído puede electrificar el charco de agua alrededor sin que se note.",
    },
    {
      id: "ll5",
      icono: "📴",
      situacion: "Ya diste toda la información. ¿Cuándo cuelgas?",
      opciones: [
        { texto: "Cuando quien contesta me diga que puedo colgar", ok: true },
        { texto: "En cuanto termino de dar la dirección", ok: false },
        { texto: "Cuando escucho la sirena a lo lejos", ok: false },
      ],
      explicacion:
        "El operador puede irte guiando mientras llega la ayuda. Colgar antes corta esa guía.",
      dato: "Los operadores del 911 están entrenados para dar instrucciones de primeros auxilios por teléfono.",
    },
    {
      id: "ll6",
      icono: "🚫",
      situacion: "Un compañero quiere llamar al 911 de broma.",
      opciones: [
        { texto: "Decirle que no: una broma ocupa la línea de alguien que sí la necesita", ok: true },
        { texto: "Grabarlo para subirlo", ok: false },
        { texto: "Llamar yo también, para ver qué dicen", ok: false },
      ],
      explicacion:
        "Cada llamada falsa deja a alguien real esperando. Además está sancionado por la ley.",
      dato: "Más de la mitad de las llamadas al 911 en México han llegado a ser falsas o improcedentes.",
    },
  ],

  volcan: [
    {
      id: "vo1",
      icono: "🌋",
      situacion: "El semáforo de alerta volcánica pasa a amarillo fase 3 en tu comunidad.",
      opciones: [
        { texto: "Tener lista la mochila y seguir las indicaciones de protección civil", ok: true },
        { texto: "Subir al volcán a tomar fotos", ok: false },
        { texto: "Ignorarlo, siempre está echando humo", ok: false },
      ],
      explicacion:
        "Amarillo fase 3 significa preparar la salida y estar pendiente de las autoridades.",
      dato: "El semáforo volcánico va de verde a rojo y lo actualiza el CENAPRED todos los días.",
    },
    {
      id: "vo2",
      icono: "🌫️",
      situacion: "Está cayendo ceniza volcánica sobre tu colonia.",
      opciones: [
        { texto: "Quedarme adentro, cerrar ventanas y taparme nariz y boca con un trapo húmedo", ok: true },
        { texto: "Salir a barrer la calle sin protección", ok: false },
        { texto: "Mojar la ceniza del techo con mucha agua", ok: false },
      ],
      explicacion:
        "La ceniza raspa los pulmones. Y mojada pesa muchísimo: puede tirar un techo.",
      dato: "Un centímetro de ceniza mojada sobre un techo puede pesar más de 10 kilos por metro cuadrado.",
    },
    {
      id: "vo3",
      icono: "🏃",
      situacion: "Ordenan evacuar por la erupción. Tienes 20 minutos.",
      opciones: [
        { texto: "Tomar la mochila y salir por la ruta oficial hacia el albergue", ok: true },
        { texto: "Buscar el camino más corto aunque cruce el barranco", ok: false },
        { texto: "Esperar a que llegue el resto de la familia del trabajo", ok: false },
      ],
      explicacion:
        "Las rutas oficiales evitan barrancas y ríos, que es justo por donde bajan los flujos de lodo.",
      dato: "Los lahares, ríos de lodo volcánico, bajan por las barrancas a más de 40 km/h.",
    },
    {
      id: "vo4",
      icono: "😷",
      situacion: "Vas caminando bajo lluvia de ceniza.",
      opciones: [
        { texto: "Cubrirme nariz, boca y ojos, y usar manga larga", ok: true },
        { texto: "Correr para llegar más rápido", ok: false },
        { texto: "Usar lentes de sol nada más", ok: false },
      ],
      explicacion:
        "La ceniza es vidrio molido: irrita ojos, piel y pulmones. Correr te hace respirar más.",
      dato: "La ceniza volcánica no se disuelve con agua como el polvo: son partículas de roca y vidrio.",
    },
  ],

  inundacion: [
    {
      id: "iu1",
      icono: "🌧️",
      situacion: "Llueve fuerte y el agua ya sube en tu calle.",
      opciones: [
        { texto: "Subir a la parte más alta de la casa con la mochila", ok: true },
        { texto: "Salir a caminar para ver hasta dónde llegó", ok: false },
        { texto: "Bajar al sótano por las cosas de valor", ok: false },
      ],
      explicacion:
        "Hacia arriba, nunca hacia abajo, y con la mochila. El agua sube más rápido de lo que parece.",
      dato: "Treinta centímetros de agua en movimiento pueden tumbar a una persona adulta.",
    },
    {
      id: "iu2",
      icono: "🚗",
      situacion: "El carro va por una calle inundada y el agua le llega a media llanta.",
      opciones: [
        { texto: "No cruzar, dar la vuelta y buscar otra ruta", ok: true },
        { texto: "Acelerar para pasar rápido", ok: false },
        { texto: "Cruzar despacio pegado a la orilla", ok: false },
      ],
      explicacion:
        "Nunca se cruza agua en movimiento. No se ve si abajo ya se cayó el pavimento.",
      dato: "Sesenta centímetros de agua flotan un carro y se lo llevan.",
    },
    {
      id: "iu3",
      icono: "⚡",
      situacion: "Hay agua entrando a la casa y los contactos eléctricos están cerca del piso.",
      opciones: [
        { texto: "Bajar el interruptor general antes de que el agua llegue", ok: true },
        { texto: "Desconectar los aparatos con las manos mojadas", ok: false },
        { texto: "Poner los aparatos sobre sillas y dejar la luz prendida", ok: false },
      ],
      explicacion:
        "Cortar la corriente desde el interruptor general, con las manos secas, antes de que haya agua.",
      dato: "El agua sucia conduce electricidad mucho mejor que el agua limpia.",
    },
    {
      id: "iu4",
      icono: "🚱",
      situacion: "Después de la inundación tienes sed y hay agua de la llave.",
      opciones: [
        { texto: "Tomar solo agua embotellada o hervida", ok: true },
        { texto: "Tomar de la llave, se ve limpia", ok: false },
        { texto: "Tomar del agua que quedó en el patio", ok: false },
      ],
      explicacion:
        "Las inundaciones mezclan drenaje con agua potable. Se ve limpia y no lo está.",
      dato: "La mayoría de las enfermedades después de una inundación vienen del agua, no del agua misma que arrasó.",
    },
  ],

  /* ===================== 🌱 GREENCITO ===================== */

  "ahorra-agua": [
    {
      id: "aa1",
      icono: "🪥",
      situacion: "Te lavas los dientes por dos minutos.",
      opciones: [
        { texto: "Cerrar la llave mientras me cepillo y usar un vaso", ok: true },
        { texto: "Dejar la llave abierta, así enjuago rápido", ok: false },
        { texto: "Abrir la llave a la mitad todo el tiempo", ok: false },
      ],
      explicacion:
        "Con la llave abierta se van hasta 12 litros; con un vaso, medio litro.",
      dato: "Solo cerrando la llave al cepillarte ahorras más de 4 mil litros al año.",
    },
    {
      id: "aa2",
      icono: "🚿",
      situacion: "Vas a bañarte y el agua tarda en calentar.",
      opciones: [
        { texto: "Juntar en una cubeta el agua fría y usarla para el escusado", ok: true },
        { texto: "Dejarla correr al drenaje hasta que caliente", ok: false },
        { texto: "Abrir las dos llaves al máximo para que caliente antes", ok: false },
      ],
      explicacion:
        "Esa agua está limpia. Una cubeta llena alcanza para varias descargas del escusado.",
      dato: "Se pierden entre 5 y 10 litros cada vez que esperas a que salga caliente.",
    },
    {
      id: "aa3",
      icono: "🚽",
      situacion: "Sospechan que el tanque del baño tiene una fuga silenciosa.",
      opciones: [
        { texto: "Echar unas gotas de colorante al tanque y ver si la taza se pinta", ok: true },
        { texto: "Esperar a que se note en el recibo", ok: false },
        { texto: "Cerrar la llave del baño y no usarlo", ok: false },
      ],
      explicacion:
        "Si la taza se pinta sin jalarle, hay fuga. Es la prueba más barata que existe.",
      dato: "Una fuga silenciosa del escusado tira hasta 200 litros al día sin hacer ruido.",
    },
    {
      id: "aa4",
      icono: "🚗",
      situacion: "Toca lavar el carro el domingo.",
      opciones: [
        { texto: "Dos cubetas y una jerga", ok: true },
        { texto: "Manguera abierta todo el tiempo", ok: false },
        { texto: "Manguera con pistola, pero abierta 20 minutos", ok: false },
      ],
      explicacion:
        "Con cubeta se usan menos de 40 litros; con manguera abierta, hasta 400.",
      dato: "Lavar un carro con manguera gasta más agua que la que bebe una persona en medio año.",
    },
    {
      id: "aa5",
      icono: "🌱",
      situacion: "Vas a regar el jardín de la escuela.",
      opciones: [
        { texto: "Regar temprano o al atardecer, directo a la raíz", ok: true },
        { texto: "Regar a mediodía con el sol pegando", ok: false },
        { texto: "Regar por encima de las hojas a cualquier hora", ok: false },
      ],
      explicacion:
        "A mediodía se evapora casi la mitad antes de llegar a la raíz.",
      dato: "El riego por goteo usa hasta 60% menos agua que la manguera.",
    },
    {
      id: "aa6",
      icono: "🍽️",
      situacion: "Hay una montaña de trastes sucios.",
      opciones: [
        { texto: "Tallar todos con la llave cerrada y enjuagar al final", ok: true },
        { texto: "Enjuagar cada traste conforme lo tallo", ok: false },
        { texto: "Dejarlos remojando con la llave goteando", ok: false },
      ],
      explicacion:
        "Tallar todo con la llave cerrada y enjuagar de una vez ahorra más de la mitad.",
      dato: "Lavar trastes con la llave abierta gasta unos 100 litros en 10 minutos.",
    },
  ],

  transporte: [
    {
      id: "tr1",
      icono: "🚲",
      situacion: "La escuela está a diez cuadras de tu casa.",
      opciones: [
        { texto: "Ir caminando o en bici", ok: true },
        { texto: "Que me lleven en carro", ok: false },
        { texto: "Pedir un taxi", ok: false },
      ],
      explicacion:
        "Diez cuadras son 15 minutos a pie y cero emisiones.",
      dato: "Los viajes cortos en carro son los que más contaminan por kilómetro: el motor frío gasta el doble.",
    },
    {
      id: "tr2",
      icono: "🚌",
      situacion: "Cuarenta personas tienen que cruzar la ciudad.",
      opciones: [
        { texto: "Un camión para las cuarenta", ok: true },
        { texto: "Cuarenta carros, uno cada quien", ok: false },
        { texto: "Veinte carros compartidos de dos", ok: false },
      ],
      explicacion:
        "El camión contamina más que un carro, pero repartido entre 40 personas contamina mucho menos por persona.",
      dato: "Un camión lleno saca de circulación hasta 30 automóviles.",
    },
    {
      id: "tr3",
      icono: "🚦",
      situacion: "Vas en el carro con tu familia y quedan parados 5 minutos esperando a alguien.",
      opciones: [
        { texto: "Apagar el motor mientras esperan", ok: true },
        { texto: "Dejarlo encendido, prenderlo gasta más", ok: false },
        { texto: "Acelerar de vez en cuando para que no se apague", ok: false },
      ],
      explicacion:
        "Después de 30 segundos parado, apagar el motor gasta menos que dejarlo prendido.",
      dato: "Un motor en ralentí gasta hasta un litro de gasolina por hora sin avanzar un metro.",
    },
    {
      id: "tr4",
      icono: "🛻",
      situacion: "Cinco compañeros van al mismo lugar desde la misma colonia.",
      opciones: [
        { texto: "Organizar un solo viaje compartido", ok: true },
        { texto: "Que cada quien pida su viaje", ok: false },
        { texto: "Dos carros, para ir más cómodos", ok: false },
      ],
      explicacion:
        "Compartir el viaje divide las emisiones entre todos los que van.",
      dato: "El auto compartido puede bajar las emisiones por persona hasta 75%.",
    },
    {
      id: "tr5",
      icono: "⚡",
      situacion: "¿Qué transporte urbano contamina menos por pasajero?",
      opciones: [
        { texto: "El metro o tren eléctrico", ok: true },
        { texto: "El taxi individual", ok: false },
        { texto: "La motocicleta", ok: false },
        { texto: "La camioneta familiar", ok: false },
      ],
      explicacion:
        "El tren eléctrico mueve a miles de personas a la vez y no quema combustible en la calle.",
      dato: "Un solo tren del metro puede llevar a más de mil personas por viaje.",
    },
  ],

  /* ===================== 🧠 GENERALES ===================== */

  tormenta: [
    {
      id: "to1",
      icono: "⛈️",
      situacion: "Vas caminando a casa y empieza una tormenta eléctrica.",
      opciones: [
        { texto: "Meterme a un edificio o a un carro cerrado", ok: true },
        { texto: "Refugiarme bajo el árbol más grande", ok: false },
        { texto: "Seguir caminando con el paraguas de metal", ok: false },
        { texto: "Acostarme en el pasto del parque", ok: false },
      ],
      explicacion:
        "Un techo o un carro cerrado. El árbol solitario es justo lo que atrae el rayo.",
      dato: "El carro protege por la carrocería metálica, no por las llantas.",
    },
    {
      id: "to2",
      icono: "⚡",
      situacion: "Ves el relámpago y cuentas 3 segundos hasta el trueno.",
      opciones: [
        { texto: "La tormenta está a un kilómetro: refugiarme ya", ok: true },
        { texto: "Está a 30 kilómetros, hay tiempo de sobra", ok: false },
        { texto: "El conteo no sirve para nada", ok: false },
      ],
      explicacion:
        "Cada 3 segundos entre relámpago y trueno es aproximadamente un kilómetro.",
      dato: "Si el trueno llega en menos de 30 segundos, ya estás en zona de riesgo.",
    },
    {
      id: "to3",
      icono: "🔌",
      situacion: "Hay tormenta eléctrica fuerte y estás en casa.",
      opciones: [
        { texto: "Desconectar aparatos y no usar la ducha", ok: true },
        { texto: "Cargar el celular por si se va la luz", ok: false },
        { texto: "Salir al balcón a grabar los rayos", ok: false },
      ],
      explicacion:
        "La descarga viaja por cables y tuberías. Ni enchufes ni agua durante la tormenta.",
      dato: "Un rayo puede meterse por la instalación eléctrica y quemar todo lo conectado.",
    },
    {
      id: "to4",
      icono: "🌪️",
      situacion: "Se anuncia viento muy fuerte para esta noche.",
      opciones: [
        { texto: "Meter macetas, tendederos y todo lo suelto del patio", ok: true },
        { texto: "Amarrar la lámina del techo con un mecate", ok: false },
        { texto: "Abrir las ventanas para que pase el viento", ok: false },
      ],
      explicacion:
        "Todo lo suelto se vuelve proyectil. Abrir ventanas no equilibra nada: mete el viento.",
      dato: "Una maceta a 80 km/h atraviesa un vidrio sin problema.",
    },
    {
      id: "to5",
      icono: "🚗",
      situacion: "Vas en carretera y la lluvia no deja ver nada.",
      opciones: [
        { texto: "Orillarse fuera del carril, con luces intermitentes", ok: true },
        { texto: "Prender las altas para ver mejor", ok: false },
        { texto: "Pegarse al carro de adelante y seguirlo", ok: false },
      ],
      explicacion:
        "Orillarse completamente fuera del carril. Las luces altas rebotan en la lluvia y ciegan más.",
      dato: "Pegarse al de adelante es como se producen los choques en cadena.",
    },
  ],

  "quiz-relampago": [
    {
      id: "qr1",
      icono: "🌎",
      situacion: "¿Cuál de estas acciones ayuda más a que llueva menos ceniza y más agua limpia?",
      opciones: [
        { texto: "Reforestar con árboles nativos", ok: true },
        { texto: "Pavimentar el cerro", ok: false },
        { texto: "Sembrar puro eucalipto", ok: false },
      ],
      explicacion: "Los árboles nativos sostienen el suelo y filtran el agua que se va al subsuelo.",
      dato: "Un árbol adulto puede filtrar cientos de litros de agua de lluvia al año.",
    },
    {
      id: "qr2",
      icono: "🔋",
      situacion: "¿Dónde va una pila usada?",
      opciones: [
        { texto: "A un centro de acopio especial", ok: true },
        { texto: "Al bote de reciclables", ok: false },
        { texto: "A la basura común, envuelta", ok: false },
      ],
      explicacion: "Las pilas llevan metales pesados que contaminan agua y suelo.",
      dato: "Una sola pila de botón puede contaminar hasta 600 mil litros de agua.",
    },
    {
      id: "qr3",
      icono: "🚨",
      situacion: "Suena la alerta sísmica y estás en planta baja, cerca de una salida despejada.",
      opciones: [
        { texto: "Salir de inmediato a la zona abierta", ok: true },
        { texto: "Subir por mis cosas al segundo piso", ok: false },
        { texto: "Esperar a que empiece a temblar para decidir", ok: false },
      ],
      explicacion: "Si la salida está a segundos y despejada, salir es lo correcto. Si no, agacharse y cubrirse.",
      dato: "La alerta da entre 10 y 60 segundos según qué tan lejos esté el epicentro.",
    },
    {
      id: "qr4",
      icono: "💧",
      situacion: "¿Cuánta agua conviene guardar por persona al día en una emergencia?",
      opciones: [
        { texto: "Unos 4 litros", ok: true },
        { texto: "Medio litro", ok: false },
        { texto: "20 litros", ok: false },
      ],
      explicacion: "Cuatro litros: la mitad para beber y la otra mitad para lavar y cocinar.",
      dato: "Se recomienda reserva para tres días, o sea 12 litros por persona.",
    },
    {
      id: "qr5",
      icono: "🍌",
      situacion: "¿Qué pasa con una cáscara de plátano en la composta?",
      opciones: [
        { texto: "Se vuelve tierra fértil en unos meses", ok: true },
        { texto: "Se queda igual muchos años", ok: false },
        { texto: "Contamina el suelo", ok: false },
      ],
      explicacion: "Lo orgánico se descompone y alimenta la tierra en dos o tres meses.",
      dato: "Casi la mitad de la basura de una casa mexicana es orgánica y podría ser composta.",
    },
    {
      id: "qr6",
      icono: "🧯",
      situacion: "¿A dónde se apunta un extintor?",
      opciones: [
        { texto: "A la base del fuego", ok: true },
        { texto: "A la punta de las llamas", ok: false },
        { texto: "Al humo", ok: false },
      ],
      explicacion: "A la base, que es donde está el material que arde.",
      dato: "PASA: Pasador, Apuntar, Sujetar, Abanicar.",
    },
    {
      id: "qr7",
      icono: "🌳",
      situacion: "¿Por qué los cerros sin árboles se derrumban más?",
      opciones: [
        { texto: "Porque sin raíces nada detiene la tierra cuando llueve", ok: true },
        { texto: "Porque el sol calienta más la roca", ok: false },
        { texto: "Porque el viento pega más fuerte", ok: false },
      ],
      explicacion: "Las raíces amarran el suelo. Sin ellas, el agua se lleva la tierra.",
      dato: "Un árbol grande puede sostener varias toneladas de tierra con sus raíces.",
    },
    {
      id: "qr8",
      icono: "💡",
      situacion: "¿Qué foco gasta menos luz para la misma cantidad de luz?",
      opciones: [
        { texto: "El LED", ok: true },
        { texto: "El incandescente de siempre", ok: false },
        { texto: "El halógeno", ok: false },
      ],
      explicacion: "El LED da la misma luz con hasta 85% menos electricidad.",
      dato: "Un foco incandescente convierte en calor el 90% de la energía que consume.",
    },
    {
      id: "qr9",
      icono: "🎒",
      situacion: "¿Qué NO va en la mochila de emergencia?",
      opciones: [
        { texto: "Velas y cerillos", ok: true },
        { texto: "Silbato", ok: false },
        { texto: "Copias de documentos", ok: false },
      ],
      explicacion: "Velas no: si hay fuga de gas, una chispa se vuelve un incendio.",
      dato: "El silbato pesa casi nada y se escucha mucho más lejos que un grito.",
    },
    {
      id: "qr10",
      icono: "🐝",
      situacion: "¿Por qué importan las abejas para la comida?",
      opciones: [
        { texto: "Polinizan buena parte de las frutas y verduras que comemos", ok: true },
        { texto: "Porque hacen miel y nada más", ok: false },
        { texto: "Porque se comen las plagas", ok: false },
      ],
      explicacion: "Sin polinizadores muchas plantas no dan fruto.",
      dato: "Cerca de uno de cada tres bocados de tu comida depende de un polinizador.",
    },
  ],

  "verdadero-falso": [
    {
      id: "vf1",
      icono: "🚪",
      afirmacion: "El lugar más seguro durante un sismo es el marco de la puerta.",
      verdadero: false,
      explicacion:
        "Es un mito viejo. En construcciones modernas el marco no es más fuerte que un muro, y la puerta puede golpearte.",
      dato: "Ese consejo viene de casas de adobe de hace un siglo, donde el marco sí era lo último en caer.",
    },
    {
      id: "vf2",
      icono: "💬",
      afirmacion: "Después de un sismo, un mensaje de texto pasa mejor que una llamada.",
      verdadero: true,
      explicacion: "Las llamadas saturan la red. El texto ocupa muchísimo menos y se abre paso.",
      dato: "Por eso protección civil pide avisar por mensaje y dejar la línea libre.",
    },
    {
      id: "vf3",
      icono: "♻️",
      afirmacion: "Los envases se reciclan mejor si van enjuagados y aplastados.",
      verdadero: true,
      explicacion: "Los restos de comida echan a perder el lote entero de papel y cartón.",
      dato: "Un envase sucio puede mandar a la basura toda una paca de material reciclable.",
    },
    {
      id: "vf4",
      icono: "🔥",
      afirmacion: "El agua sirve para apagar cualquier incendio.",
      verdadero: false,
      explicacion: "En aceite lo hace explotar y en equipo eléctrico conduce la corriente.",
      dato: "Por eso los extintores tienen letras: A, B, C y K, según qué material arde.",
    },
    {
      id: "vf5",
      icono: "🌳",
      afirmacion: "Cualquier árbol sirve igual para reforestar un río.",
      verdadero: false,
      explicacion: "Las especies nativas sostienen el suelo de la región; otras pueden secarlo.",
      dato: "El eucalipto crece rápido pero bebe tanta agua que deja el terreno pobre.",
    },
    {
      id: "vf6",
      icono: "🛗",
      afirmacion: "Está bien usar el elevador si el sismo fue leve.",
      verdadero: false,
      explicacion: "Se puede ir la luz en cualquier momento y quedas atrapado adentro.",
      dato: "Los elevadores modernos se detienen solos en el piso más cercano al detectar movimiento.",
    },
    {
      id: "vf7",
      icono: "💧",
      afirmacion: "Una llave que gotea desperdicia más de 100 litros al mes.",
      verdadero: true,
      explicacion: "El goteo constante suma una cubeta llena cada dos días.",
      dato: "Cambiar un empaque de 5 pesos puede ahorrar más de mil litros al año.",
    },
    {
      id: "vf8",
      icono: "🌫️",
      afirmacion: "En un incendio conviene caminar agachado.",
      verdadero: true,
      explicacion: "El humo caliente sube; cerca del piso queda aire respirable y se ve mejor.",
      dato: "El humo puede dejarte inconsciente en menos de tres respiraciones.",
    },
    {
      id: "vf9",
      icono: "🔌",
      afirmacion: "Un cargador conectado sin celular no gasta nada de luz.",
      verdadero: false,
      explicacion: "Sigue consumiendo un poco todo el tiempo. Se le llama consumo fantasma.",
      dato: "El consumo fantasma puede ser hasta el 10% del recibo de luz de una casa.",
    },
    {
      id: "vf10",
      icono: "🌊",
      afirmacion: "Si el mar se retira de golpe después de un sismo, hay que alejarse de la costa.",
      verdadero: true,
      explicacion: "Es la señal natural de tsunami y a veces la única advertencia que hay.",
      dato: "La ola puede llegar en menos de 15 minutos tras un sismo costero fuerte.",
    },
    {
      id: "vf11",
      icono: "🔋",
      afirmacion: "Enterrar una pila en el jardín es una forma segura de deshacerse de ella.",
      verdadero: false,
      explicacion: "Los metales pesados se filtran al subsuelo y llegan al agua.",
      dato: "El mercurio sube por la cadena alimenticia hasta llegar a los peces que comemos.",
    },
    {
      id: "vf12",
      icono: "🎒",
      afirmacion: "La mochila de emergencia debe estar siempre en el mismo lugar y cerca de la salida.",
      verdadero: true,
      explicacion: "En una emergencia no hay tiempo de buscarla. Todos en la casa deben saber dónde está.",
      dato: "Conviene revisarla dos veces al año y cambiar agua, pilas y medicinas.",
    },
  ],
};

/** Convierte una afirmación de verdadero/falso en una pregunta normal. */
export function comoOpciones(pregunta) {
  if (!pregunta.afirmacion) return pregunta;
  return {
    ...pregunta,
    situacion: pregunta.afirmacion,
    fijas: true,
    opciones: [
      { texto: "✅ Verdadero", ok: pregunta.verdadero === true },
      { texto: "❌ Falso", ok: pregunta.verdadero === false },
    ],
  };
}
