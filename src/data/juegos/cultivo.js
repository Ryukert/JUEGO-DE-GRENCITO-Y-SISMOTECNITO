/**
 * Datos del motor Cultiva.jsx.
 *
 * El jugador toma decisiones seguidas y el árbol crece (o se marchita)
 * según lo que elija. Cada opción tiene un efecto en la salud del árbol:
 *
 *   efecto  > 0 → el árbol crece
 *   efecto  = 0 → sobrevive pero no avanza
 *   efecto  < 0 → se marchita
 */

export const ETAPAS = ["🌰", "🌱", "🌿", "🪴", "🌳", "🌳"];

export const CULTIVOS = {
  /* -------------------------- 🌱 Planta un árbol -------------------------- */
  "planta-arbol": {
    escenario: "Terreno junto al río, en tu comunidad",
    pista: "Cada decisión hace crecer o marchitar el árbol. Piénsale.",
    pasos: [
      {
        id: "especie",
        pregunta: "¿Qué especie plantamos junto al río?",
        opciones: [
          { texto: "Un árbol nativo de la región", icono: "🌳", efecto: 2, explicacion: "Las especies nativas ya están adaptadas al clima y al suelo de aquí.", dato: "Un nativo necesita menos riego y sostiene mejor la tierra de la orilla." },
          { texto: "Eucalipto, porque crece rapidísimo", icono: "🌲", efecto: -2, explicacion: "Bebe cantidades enormes de agua y suelta sustancias que frenan a otras plantas.", dato: "Crece rápido, pero deja el terreno reseco y pobre." },
          { texto: "Una palmera decorativa importada", icono: "🌴", efecto: -1, explicacion: "Bonita, pero no pertenece a este ecosistema ni alimenta a la fauna local.", dato: "Los árboles nativos alimentan aves e insectos de la región; los importados casi no." },
        ],
      },
      {
        id: "temporada",
        pregunta: "¿Cuándo lo sembramos?",
        opciones: [
          { texto: "Al inicio de la temporada de lluvias", icono: "🌧️", efecto: 2, explicacion: "Con lluvia el arbolito agarra raíz antes de enfrentar la sequía.", dato: "En México la reforestación se hace entre junio y septiembre." },
          { texto: "En mayo, con el sol más fuerte", icono: "☀️", efecto: -2, explicacion: "El calor seca la tierra antes de que la raíz alcance humedad.", dato: "Un arbolito recién plantado en pleno mayo casi siempre muere." },
          { texto: "En pleno invierno frío", icono: "❄️", efecto: -1, explicacion: "El frío frena el crecimiento y la raíz no se establece.", dato: "Cada especie tiene su ventana; la mayoría prefiere lluvias." },
        ],
      },
      {
        id: "hoyo",
        pregunta: "¿Cómo preparamos el hoyo?",
        opciones: [
          { texto: "Del doble de ancho que el cepellón, con tierra suelta", icono: "🕳️", efecto: 2, explicacion: "La tierra suelta alrededor deja que la raíz se expanda desde el primer mes.", dato: "Un hoyo apretado hace que la raíz dé vueltas y estrangule al árbol." },
          { texto: "Justo del tamaño de la bolsa, bien apretado", icono: "🪣", efecto: -1, explicacion: "La raíz no puede salir y el árbol se queda enano.", dato: "Se le llama raíz espiralada y es la causa más común de fracaso." },
          { texto: "Nada más quito el pasto y lo pongo encima", icono: "🌾", efecto: -2, explicacion: "Sin hoyo la raíz queda expuesta y se seca en días.", dato: "El cepellón debe quedar completo bajo tierra, al ras del suelo." },
        ],
      },
      {
        id: "agua",
        pregunta: "¿Cuánta agua le damos las primeras semanas?",
        opciones: [
          { texto: "Riego profundo dos veces por semana", icono: "💧", efecto: 2, explicacion: "El riego profundo obliga a la raíz a bajar y buscar humedad.", dato: "Regar poquito todos los días deja la raíz superficial y débil." },
          { texto: "Un chorrito diario en la superficie", icono: "🚿", efecto: 0, explicacion: "Sobrevive, pero la raíz se queda arriba y sufre en la primera sequía.", dato: "Mejor poco seguido y mucha cantidad." },
          { texto: "Inundarlo todos los días", icono: "🌊", efecto: -2, explicacion: "El exceso de agua pudre la raíz y ahoga al árbol.", dato: "Se puede ahogar un árbol con cariño: la raíz también necesita aire." },
        ],
      },
      {
        id: "cuidado",
        pregunta: "El arbolito ya prendió. ¿Qué le ponemos?",
        opciones: [
          { texto: "Acolchado de hojas secas y un tutor de madera", icono: "🍂", efecto: 2, explicacion: "El acolchado conserva humedad y el tutor lo endereza contra el viento.", dato: "El acolchado puede reducir a la mitad el agua que necesita." },
          { texto: "Una llanta pintada alrededor", icono: "🛞", efecto: -1, explicacion: "Junta agua estancada y calienta la tierra de más.", dato: "Además cría mosquito de dengue." },
          { texto: "Nada, que se defienda solo", icono: "🤷", efecto: 0, explicacion: "Puede que sobreviva, pero los primeros dos años son los críticos.", dato: "Los programas serios de reforestación dan seguimiento por tres años." },
        ],
      },
    ],
    finales: {
      excelente: "Tu árbol está fuerte, con raíz profunda y sombra propia. Dentro de veinte años va a sostener el suelo de toda esta orilla.",
      regular: "El árbol sobrevivió, pero le costó. Con mejores decisiones habría crecido al doble en el mismo tiempo.",
      malo: "El árbol no aguantó. Pasa mucho: siete de cada diez árboles mal plantados no llegan al segundo año.",
    },
  },

  /* --------------------------- 🌳 Reforestación --------------------------- */
  reforestacion: {
    escenario: "Un cerro pelón arriba de tu comunidad",
    pista: "Vas a reforestar el cerro completo. Piensa en el sistema, no en un solo árbol.",
    pasos: [
      {
        id: "donde",
        pregunta: "¿Por dónde empezamos a reforestar el cerro?",
        opciones: [
          { texto: "Por la parte alta y las cañadas, donde nace el agua", icono: "⛰️", efecto: 2, explicacion: "Arriba es donde el agua empieza a correr y donde más suelo se pierde.", dato: "Reforestar la parte alta protege todo lo que está abajo." },
          { texto: "Por la orilla de la carretera, se ve más bonito", icono: "🛣️", efecto: -1, explicacion: "Se ve bien pero no resuelve el problema de erosión del cerro.", dato: "Reforestar por estética es común y por eso muchos programas fracasan." },
          { texto: "Todo parejo, sin ver el terreno", icono: "📏", efecto: 0, explicacion: "Sin leer el terreno se desperdician árboles en lugares donde no prenden.", dato: "Un estudio de suelo previo duplica la tasa de supervivencia." },
        ],
      },
      {
        id: "variedad",
        pregunta: "¿Qué mezcla de especies sembramos?",
        opciones: [
          { texto: "Varias especies nativas mezcladas", icono: "🌳", efecto: 2, explicacion: "La diversidad resiste plagas, sequías e incendios mucho mejor.", dato: "Un monocultivo entero puede perderse con una sola plaga." },
          { texto: "Una sola especie, para que se vea uniforme", icono: "🌲", efecto: -2, explicacion: "Un monocultivo es frágil: lo que mata a uno mata a todos.", dato: "Los bosques naturales tienen decenas de especies conviviendo." },
          { texto: "Puros frutales para la comunidad", icono: "🍎", efecto: 0, explicacion: "Buena intención, pero los frutales necesitan cuidado y riego constante.", dato: "Se combinan: nativos para el cerro, frutales cerca de las casas." },
        ],
      },
      {
        id: "suelo",
        pregunta: "El agua de lluvia se lleva la tierra ladera abajo. ¿Qué hacemos?",
        opciones: [
          { texto: "Hacer terrazas y zanjas de infiltración siguiendo la curva del cerro", icono: "🏞️", efecto: 2, explicacion: "Frenan el agua, la hacen infiltrarse y retienen la tierra.", dato: "Una zanja bien hecha puede captar miles de litros por temporada." },
          { texto: "Hacer surcos derechos cerro abajo", icono: "📉", efecto: -2, explicacion: "Los surcos verticales son autopistas para el agua: aceleran la erosión.", dato: "Siempre se trabaja siguiendo la curva de nivel, nunca de arriba abajo." },
          { texto: "Poner una barda de concreto abajo", icono: "🧱", efecto: -1, explicacion: "Detiene un poco de tierra pero no evita que el cerro se siga lavando.", dato: "Las soluciones vivas funcionan mejor y cuestan menos." },
        ],
      },
      {
        id: "ganado",
        pregunta: "Hay chivos que suben a comer los brotes tiernos.",
        opciones: [
          { texto: "Cercar el área reforestada los primeros años", icono: "🚧", efecto: 2, explicacion: "Los primeros años son los críticos: un chivo acaba con un año de trabajo en una tarde.", dato: "Se cerca, se cuida tres años y luego se abre." },
          { texto: "Plantar más árboles para compensar lo que se coman", icono: "🌱", efecto: -1, explicacion: "Es tirar árboles y dinero. El problema sigue ahí.", dato: "Sin protección, la supervivencia baja a menos del 20%." },
          { texto: "Sacar a los chivos del cerro para siempre", icono: "🐐", efecto: 0, explicacion: "Es de la comunidad que vive de ellos. La reforestación tiene que convivir con la gente.", dato: "Los proyectos que ignoran a la comunidad son los que fracasan." },
        ],
      },
      {
        id: "seguimiento",
        pregunta: "Ya quedaron plantados los mil árboles. ¿Y ahora?",
        opciones: [
          { texto: "Dar mantenimiento y reponer los que se pierdan por tres años", icono: "📋", efecto: 2, explicacion: "Sembrar es el 20% del trabajo. El otro 80% es cuidar.", dato: "Sin seguimiento, sobrevive menos de un tercio de lo plantado." },
          { texto: "Tomar la foto y dar por terminado el proyecto", icono: "📸", efecto: -2, explicacion: "Es el error más común de las campañas de reforestación.", dato: "Se han documentado campañas con menos del 10% de supervivencia real." },
          { texto: "Volver en diez años a ver qué pasó", icono: "⏳", efecto: -1, explicacion: "Para entonces ya se perdió lo que se podía salvar.", dato: "El primer año es donde se decide casi todo." },
        ],
      },
    ],
    finales: {
      excelente: "El cerro tiene cobertura, el agua se infiltra y la tierra dejó de irse con la lluvia. Abajo, tu comunidad se inunda menos.",
      regular: "Hay bosque nuevo, pero disparejo. Va a tardar el doble en cerrar la cobertura.",
      malo: "La mayoría de los árboles se perdieron. El cerro sigue lavándose con cada lluvia fuerte.",
    },
  },
};
