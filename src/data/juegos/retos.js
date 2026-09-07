/**
 * Datos de los desafíos generales que no encajan en los motores anteriores.
 */

/* ------------------------- 🔐 Código secreto ------------------------- */
/**
 * Deducción tipo "descifra la combinación". El jugador propone
 * combinaciones y el juego le dice cuántos símbolos acertó en su lugar
 * y cuántos están en la clave pero mal colocados. Cada caja abierta
 * suelta un consejo de seguridad.
 */
export const CODIGOS = {
  "codigo-secreto": {
    pista: "Propón una combinación. Te diré cuántos símbolos están en su lugar y cuántos están en la clave pero mal puestos.",
    simbolos: ["🛡️", "🌱", "💧", "🔥", "⚡", "🌳"],
    cajas: [
      {
        nombre: "Botiquín de la escuela",
        premio: "Dentro del botiquín debe haber gasas, vendas, guantes y las medicinas que alguien del grupo necesite. Se revisa dos veces al año porque todo caduca.",
      },
      {
        nombre: "Caja de la brigada",
        premio: "La brigada de protección civil de una escuela tiene funciones repartidas: alguien evacúa, alguien pasa lista, alguien apoya a quien lo necesita y alguien comunica.",
      },
      {
        nombre: "Archivo de emergencia",
        premio: "Las copias de actas e identificaciones van en una bolsa de plástico dentro de la mochila. Sin documentos es mucho más difícil recibir apoyo después de un desastre.",
      },
      {
        nombre: "Bodega del huerto",
        premio: "La composta necesita mezclar verde y seco: restos de comida con hojas o cartón. Solo verde apesta, solo seco no se descompone.",
      },
      {
        nombre: "Tablero de la cisterna",
        premio: "Una cisterna de captación se limpia al final de cada temporada de lluvias, antes de que empiece la siguiente. Si no, el sedimento echa a perder el agua nueva.",
      },
    ],
  },
};

/* ------------------------- 🔤 Palabras ocultas ------------------------- */
/**
 * Sopa de letras. El tablero se genera al vuelo en el motor a partir de
 * estas listas, así que cada partida es distinta.
 */
export const SOPAS = {
  "palabras-ocultas": {
    temas: [
      {
        nombre: "Protección civil",
        palabras: [
          { palabra: "SISMO", dato: "En México tiembla porque debajo del Pacífico se meten la placa de Cocos y la Norteamericana." },
          { palabra: "ALERTA", dato: "La alerta sísmica avisa porque la señal de radio viaja más rápido que la sacudida." },
          { palabra: "MOCHILA", dato: "Ligera, siempre en el mismo lugar y cerca de la salida." },
          { palabra: "SILBATO", dato: "Pesa casi nada y se oye mucho más lejos que un grito." },
          { palabra: "REPLICA", dato: "Los sismos que siguen días o semanas después, mientras la falla se acomoda." },
          { palabra: "EXTINTOR", dato: "Se apunta a la base del fuego, nunca a las llamas." },
          { palabra: "REFUGIO", dato: "Zona abierta, lejos de bardas, postes y ventanales." },
        ],
      },
      {
        nombre: "Medio ambiente",
        palabras: [
          { palabra: "COMPOSTA", dato: "Las cáscaras se vuelven tierra fértil en dos o tres meses." },
          { palabra: "RECICLAR", dato: "Enjuaga y aplasta los envases: ocupan menos y valen más." },
          { palabra: "NATIVO", dato: "Un árbol nativo necesita menos agua y sostiene mejor el suelo de la región." },
          { palabra: "FUGA", dato: "Una llave que gotea tira más de 100 litros al mes." },
          { palabra: "ABEJA", dato: "Uno de cada tres bocados de tu comida depende de un polinizador." },
          { palabra: "SOLAR", dato: "México recibe de las mejores radiaciones solares del planeta." },
          { palabra: "CUENCA", dato: "Reforestar la parte alta de la cuenca protege el agua de todos los de abajo." },
        ],
      },
    ],
  },
};

/* --------------------------- 🧩 Rompecabezas --------------------------- */
/**
 * Rompecabezas de deslizar sobre las imágenes que ya trae el proyecto.
 * No se agregan assets nuevos: se usan los personajes.
 */
export const ROMPECABEZAS = {
  rompecabezas: {
    laminas: [
      {
        id: "sismo",
        imagen: "/sismo.webp",
        nombre: "Sismo Tecnito",
        dato: "Un edificio bien hecho se mueve durante el sismo. Lo que no se mueve nada es lo que se parte.",
      },
      {
        id: "green",
        imagen: "/greencito.webp",
        nombre: "Greencito",
        dato: "El suelo fértil de un centímetro tarda cientos de años en formarse y se pierde en una sola lluvia sobre un cerro pelón.",
      },
    ],
  },
};

/* ------------------------- 🎲 Ruleta educativa ------------------------- */
/**
 * Cada gajo de la ruleta apunta a un banco de preguntas que ya existe.
 */
export const RULETA = {
  "ruleta-educativa": {
    gajos: [
      { banco: "agachate", nombre: "Sismos", icono: "🛡️", color: "#0f6fc4" },
      { banco: "incendio", nombre: "Incendios", icono: "🔥", color: "#c9432c" },
      { banco: "ahorra-agua", nombre: "Agua", icono: "💧", color: "#2f8fc4" },
      { banco: "transporte", nombre: "Clima", icono: "🚲", color: "#5aa32a" },
      { banco: "verdadero-falso", nombre: "Mitos", icono: "🔴", color: "#6b4fa8" },
      { banco: "quiz-relampago", nombre: "Mezcla", icono: "⚡", color: "#d98430" },
    ],
  },
};
