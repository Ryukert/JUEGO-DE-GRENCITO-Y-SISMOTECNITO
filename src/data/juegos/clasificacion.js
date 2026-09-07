/**
 * Datos del motor Clasifica.jsx: arrastrar (o tocar) objetos hacia el
 * contenedor correcto. Mismo motor para separar basura y para armar la
 * mochila de emergencia; lo único que cambia son los contenedores.
 */

export const CLASIFICACIONES = {
  /* ------------------------ ♻️ Clasifica la basura ------------------------ */
  "clasifica-basura": {
    pista: "Manda cada residuo a su contenedor.",
    contenedores: [
      { id: "organico", nombre: "Orgánico", icono: "🍂", color: "#7a5a2e" },
      { id: "papel", nombre: "Papel", icono: "📄", color: "#2f6fa8" },
      { id: "plastico", nombre: "Plástico", icono: "🥤", color: "#e0a020" },
      { id: "vidrio", nombre: "Vidrio", icono: "🍾", color: "#2e9e4f" },
      { id: "metal", nombre: "Metal", icono: "🥫", color: "#6c7a89" },
      { id: "no-reciclable", nombre: "No reciclable", icono: "🚯", color: "#c9432c" },
    ],
    objetos: [
      { nombre: "Cáscara de mango", icono: "🥭", contenedor: "organico", explicacion: "Todo lo que fue planta o comida va a orgánico.", dato: "Se vuelve composta en dos o tres meses." },
      { nombre: "Cuaderno viejo", icono: "📓", contenedor: "papel", explicacion: "Papel limpio y seco se recicla completo.", dato: "Reciclar una tonelada de papel salva unos 17 árboles." },
      { nombre: "Botella de refresco", icono: "🥤", contenedor: "plastico", explicacion: "El PET es de los plásticos más fáciles de reciclar.", dato: "Enjuagada y aplastada vale más y ocupa menos." },
      { nombre: "Frasco de mermelada", icono: "🍯", contenedor: "vidrio", explicacion: "El vidrio se recicla infinitas veces sin perder calidad.", dato: "Fundir vidrio reciclado gasta 30% menos energía que hacerlo nuevo." },
      { nombre: "Lata de atún", icono: "🥫", contenedor: "metal", explicacion: "El aluminio y la hojalata se reciclan una y otra vez.", dato: "Reciclar una lata de aluminio ahorra la energía de tres horas de tele." },
      { nombre: "Servilleta usada", icono: "🧻", contenedor: "no-reciclable", explicacion: "El papel con grasa o comida ya no se puede reciclar.", dato: "Una servilleta sucia puede echar a perder toda una paca de papel limpio." },
      { nombre: "Hojas secas del patio", icono: "🍁", contenedor: "organico", explicacion: "Las hojas son material orgánico perfecto para composta.", dato: "Mezcladas con restos de comida aceleran la composta." },
      { nombre: "Caja de cereal", icono: "📦", contenedor: "papel", explicacion: "El cartón limpio va con el papel.", dato: "Aplastarla hace que quepa cinco veces más en el camión." },
      { nombre: "Envase de yogurt", icono: "🥛", contenedor: "plastico", explicacion: "Enjuagado, el envase de yogurt sí se recicla.", dato: "Con restos de comida adentro, se rechaza en la planta." },
      { nombre: "Botella de vino rota", icono: "🍾", contenedor: "vidrio", explicacion: "El vidrio roto también se recicla, envuelto para que nadie se corte.", dato: "Se separa por color: transparente, verde y ámbar." },
      { nombre: "Papel aluminio limpio", icono: "🥇", contenedor: "metal", explicacion: "El aluminio limpio se recicla igual que las latas.", dato: "Hecho bolita se recupera mejor que en hojas sueltas." },
      { nombre: "Charola de unicel", icono: "🍱", contenedor: "no-reciclable", explicacion: "Casi ningún centro recibe unicel: no se biodegrada ni se recicla fácil.", dato: "El unicel es 95% aire, por eso transportarlo no sale rentable." },
      { nombre: "Restos de sopa", icono: "🍲", contenedor: "organico", explicacion: "La comida sobrante es orgánico.", dato: "En México se desperdicia un tercio de la comida que se produce." },
      { nombre: "Periódico", icono: "📰", contenedor: "papel", explicacion: "El periódico es de lo más fácil de reciclar.", dato: "También sirve para arrancar composta o proteger plantas del frío." },
      { nombre: "Bolsa del súper", icono: "🛍️", contenedor: "plastico", explicacion: "Va con los plásticos, aunque lo mejor es no usarla.", dato: "Se usa 12 minutos en promedio y dura siglos en el ambiente." },
      { nombre: "Chicle mascado", icono: "🍬", contenedor: "no-reciclable", explicacion: "El chicle es plástico sintético mezclado: no se recicla ni se degrada.", dato: "Un chicle en la banqueta tarda unos cinco años en desaparecer." },
    ],
  },

  /* ----------------------- 🎒 Mochila de emergencia ----------------------- */
  "mochila-emergencia": {
    pista: "Decide qué se va a la mochila y qué se queda en casa.",
    contenedores: [
      { id: "si", nombre: "Sí va", icono: "🎒", color: "#2e9e4f" },
      { id: "no", nombre: "Se queda", icono: "🏠", color: "#c9432c" },
    ],
    objetos: [
      { nombre: "Agua embotellada", icono: "💧", contenedor: "si", explicacion: "Lo primero de todo: 4 litros por persona al día.", dato: "La reserva recomendada es de tres días." },
      { nombre: "Linterna de pilas", icono: "🔦", contenedor: "si", explicacion: "Luz sin flama y sin depender del celular.", dato: "Guarda las pilas aparte para que no se descarguen." },
      { nombre: "Silbato", icono: "📣", contenedor: "si", explicacion: "Pesa casi nada y se oye mucho más lejos que un grito.", dato: "Es lo más subestimado de toda la mochila." },
      { nombre: "Botiquín", icono: "🩹", contenedor: "si", explicacion: "Gasas, vendas y las medicinas que alguien de la casa necesite.", dato: "Anota también las alergias de cada quien." },
      { nombre: "Copias de documentos", icono: "📄", contenedor: "si", explicacion: "Actas, identificaciones y cartilla, en una bolsa de plástico.", dato: "Sin documentos es más difícil recibir apoyo después." },
      { nombre: "Radio de pilas", icono: "📻", contenedor: "si", explicacion: "Cuando no hay luz ni señal, el radio sigue informando.", dato: "Los de manivela no necesitan pilas." },
      { nombre: "Velas y cerillos", icono: "🕯️", contenedor: "no", explicacion: "Jamás: si hay fuga de gas, una chispa se vuelve incendio.", dato: "Por eso siempre linterna, nunca vela." },
      { nombre: "Consola de videojuegos", icono: "🎮", contenedor: "no", explicacion: "Pesa, se descarga y no sirve de nada en una emergencia.", dato: "La mochila debe poder cargarla quien la va a usar." },
      { nombre: "Álbum de fotos grande", icono: "📔", contenedor: "no", explicacion: "Precioso, pero pesa demasiado. Mejor foto digital respaldada.", dato: "Cada kilo de más cuenta si hay que caminar." },
      { nombre: "Comida enlatada", icono: "🥫", contenedor: "si", explicacion: "Se aguanta meses y no necesita cocinarse.", dato: "No olvides el abrelatas: es el error clásico." },
      { nombre: "Cargador solar", icono: "🔋", contenedor: "si", explicacion: "Mantiene vivo el celular cuando no hay luz.", dato: "Un celular con batería es tu contacto con la familia." },
      { nombre: "Ropa gruesa de repuesto", icono: "🧥", contenedor: "si", explicacion: "Una muda y algo abrigador, sobre todo para pasar la noche fuera.", dato: "Una manta térmica pesa 50 gramos y ocupa como un celular." },
      { nombre: "Bicicleta", icono: "🚲", contenedor: "no", explicacion: "No cabe en la mochila. Útil, pero no es contenido de mochila.", dato: "La mochila debe estar lista y cerca de la salida." },
      { nombre: "Peluche gigante", icono: "🧸", contenedor: "no", explicacion: "Ocupa el espacio del agua. Uno chiquito para calmar a un peque, sí.", dato: "En albergues, un objeto pequeño y familiar ayuda mucho a los niños." },
    ],
  },
};
