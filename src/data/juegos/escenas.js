/**
 * Escenas del motor Busca.jsx: el jugador toca objetos dentro de una escena
 * y tiene que encontrar los que están marcados como `objetivo`.
 *
 * Sirve para juegos muy distintos con el mismo motor, solo cambiando datos:
 * riesgos en una casa, fugas de agua, aparatos encendidos o basura en un río.
 *
 * Forma de un objeto:
 *   { id, icono, nombre, x, y, objetivo, explicacion, dato }
 *
 * x e y son porcentajes dentro de la escena (0 a 100). El motor los coloca
 * en posición absoluta, así que la escena se adapta sola a cualquier pantalla.
 */

export const ESCENAS = {
  /* ------------------------- 🏠 Casa segura ------------------------- */
  "casa-segura": [
    {
      id: "sala",
      titulo: "La sala de tu casa",
      pista: "Busca lo que puede caerse, romperse o bloquear la salida durante un sismo.",
      cielo: "#cfe3f7",
      piso: "#e6d3b3",
      objetos: [
        { id: "librero", icono: "🗄️", nombre: "Librero sin anclar", x: 12, y: 26, objetivo: true, explicacion: "Un librero alto sin sujetar al muro se vuelca en los primeros segundos.", dato: "Anclarlo con dos escuadras al muro cuesta menos de cien pesos." },
        { id: "espejo", icono: "🪞", nombre: "Espejo sobre el sillón", x: 33, y: 20, objetivo: true, explicacion: "Los vidrios colgados encima de donde te sientas o duermes son de los peores riesgos.", dato: "Una película de seguridad transparente evita que el vidrio se convierta en esquirlas." },
        { id: "ventana", icono: "🪟", nombre: "Ventana grande sin película", x: 55, y: 18, objetivo: true, explicacion: "El vidrio sin protección se rompe hacia adentro. Aléjate de ventanas durante el sismo.", dato: "La mayoría de heridas en sismos urbanos son cortadas por vidrio." },
        { id: "cables", icono: "🔌", nombre: "Cables amontonados en un contacto", x: 78, y: 55, objetivo: true, explicacion: "Sobrecargar un contacto calienta el cable y es causa común de incendio.", dato: "Un multicontacto no multiplica la corriente disponible, solo los enchufes." },
        { id: "caja", icono: "📦", nombre: "Cajas bloqueando la puerta", x: 86, y: 74, objetivo: true, explicacion: "La ruta de salida siempre despejada. En la oscuridad no vas a poder rodearlas.", dato: "Protección civil pide 90 cm libres en cualquier pasillo de evacuación." },
        { id: "maceta", icono: "🪴", nombre: "Maceta pesada en repisa alta", x: 66, y: 33, objetivo: true, explicacion: "Todo lo pesado va abajo. En una repisa alta se convierte en proyectil.", dato: "Regla simple: lo pesado a la altura de la rodilla, lo ligero arriba." },
        { id: "sillon", icono: "🛋️", nombre: "Sillón", x: 30, y: 62, objetivo: false, explicacion: "El sillón está bien donde está." },
        { id: "planta", icono: "🌿", nombre: "Planta en el piso", x: 8, y: 72, objetivo: false, explicacion: "En el piso no representa riesgo." },
        { id: "alfombra", icono: "🧶", nombre: "Tapete", x: 48, y: 78, objetivo: false, explicacion: "Un tapete plano no es un riesgo de sismo." },
        { id: "cuadro", icono: "🖼️", nombre: "Cuadro pequeño de tela", x: 20, y: 44, objetivo: false, explicacion: "Un cuadro ligero y sin vidrio no es peligroso." },
      ],
    },
    {
      id: "cocina",
      titulo: "La cocina",
      pista: "Encuentra lo que puede provocar fuego, fuga o caída de objetos.",
      cielo: "#f7e6cf",
      piso: "#dfe6ea",
      objetos: [
        { id: "gas", icono: "🫙", nombre: "Tanque de gas sin sujetar", x: 84, y: 60, objetivo: true, explicacion: "Un tanque suelto se cae, jala la manguera y la rompe.", dato: "Se sujeta con una cadena o cincho a la pared, siempre en zona ventilada." },
        { id: "manguera", icono: "🧵", nombre: "Manguera de gas vieja y cuarteada", x: 68, y: 45, objetivo: true, explicacion: "Las mangueras caducan. Cuarteada, la fuga es cuestión de tiempo.", dato: "Traen fecha impresa: se cambian aunque se vean bien por fuera." },
        { id: "sarten", icono: "🍳", nombre: "Sartén con el mango hacia afuera", x: 45, y: 42, objetivo: true, explicacion: "El mango hacia afuera es lo que hace que un niño lo jale y se queme.", dato: "Los mangos siempre hacia adentro de la estufa." },
        { id: "trastes", icono: "🍽️", nombre: "Trastes apilados en repisa alta", x: 22, y: 22, objetivo: true, explicacion: "Una torre de platos en alto se cae completa con la primera sacudida.", dato: "Un pasador o borde en la repisa evita que se deslicen." },
        { id: "quimicos", icono: "🧴", nombre: "Cloro junto a la comida", x: 12, y: 58, objetivo: true, explicacion: "Los productos de limpieza van aparte, cerrados y abajo.", dato: "Mezclar cloro con otros limpiadores libera gases tóxicos." },
        { id: "extintor", icono: "🧯", nombre: "Extintor a la vista", x: 92, y: 30, objetivo: false, explicacion: "Justo donde debe estar: visible y accesible." },
        { id: "refri", icono: "🧊", nombre: "Refrigerador", x: 60, y: 70, objetivo: false, explicacion: "No es un riesgo por sí mismo." },
        { id: "botiquin", icono: "🩹", nombre: "Botiquín en su lugar", x: 34, y: 68, objetivo: false, explicacion: "Bien: cerca y señalizado." },
        { id: "toalla", icono: "🧻", nombre: "Toalla de papel", x: 52, y: 24, objetivo: false, explicacion: "No es riesgo si está lejos de la flama." },
      ],
    },
  ],

  /* ------------------------ 🏫 Escuela segura ------------------------ */
  "escuela-segura": [
    {
      id: "pasillo",
      titulo: "El pasillo de tu escuela",
      pista: "Encuentra lo que sí debe estar señalado y lo que estorba la evacuación.",
      cielo: "#dbe9f8",
      piso: "#c9d6c0",
      objetos: [
        { id: "salida", icono: "🚪", nombre: "Salida de emergencia bloqueada", x: 88, y: 40, objetivo: true, explicacion: "Una salida de emergencia con candado o cosas encima es la falla más grave que existe.", dato: "Debe abrirse empujando desde adentro, sin llave, siempre." },
        { id: "extintor", icono: "🧯", nombre: "Extintor vencido", x: 14, y: 34, objetivo: true, explicacion: "Un extintor sin recarga vigente no sirve el día que se ocupa.", dato: "Traen etiqueta con la fecha de la última recarga; se revisan cada año." },
        { id: "ruta", icono: "🪧", nombre: "Señal de ruta borrada", x: 40, y: 22, objetivo: true, explicacion: "Si la señal no se ve, la ruta no existe para quien no conoce el edificio.", dato: "Las señales de evacuación son verdes; las de riesgo, amarillas o rojas." },
        { id: "escalera", icono: "🪜", nombre: "Escalera sin barandal", x: 62, y: 30, objetivo: true, explicacion: "En una evacuación con mucha gente, un barandal roto provoca caídas en cadena.", dato: "En los simulacros se baja pegado al barandal y sin correr." },
        { id: "macetones", icono: "🪴", nombre: "Macetones en medio del pasillo", x: 30, y: 62, objetivo: true, explicacion: "Cualquier cosa en la ruta reduce el ancho y hace cuello de botella.", dato: "Un pasillo de evacuación necesita al menos 90 cm libres." },
        { id: "vidrio", icono: "🪟", nombre: "Ventanal sin película de seguridad", x: 72, y: 62, objetivo: true, explicacion: "Los ventanales del pasillo se rompen hacia donde pasa la gente.", dato: "La película no evita que se rompa: evita que vuele en pedazos." },
        { id: "punto", icono: "🟢", nombre: "Punto de reunión señalado", x: 50, y: 78, objetivo: false, explicacion: "Correcto: el punto de reunión debe estar marcado y en zona abierta." },
        { id: "boton", icono: "🔔", nombre: "Alarma en buen estado", x: 22, y: 76, objetivo: false, explicacion: "Bien colocada y accesible." },
        { id: "banca", icono: "🪑", nombre: "Banca pegada al muro", x: 6, y: 60, objetivo: false, explicacion: "Pegada al muro no estorba el paso." },
        { id: "botiquin", icono: "🩹", nombre: "Botiquín visible", x: 55, y: 46, objetivo: false, explicacion: "Correcto: visible y señalizado." },
      ],
    },
  ],

  /* ----------------------- 🔎 Detective de riesgos ----------------------- */
  "detective-riesgos": [
    {
      id: "recamara",
      titulo: "La recámara",
      pista: "Cinco cosas aquí pueden lastimarte si tiembla de madrugada.",
      cielo: "#e6dcf5",
      piso: "#e6d3b3",
      objetos: [
        { id: "repisa", icono: "📚", nombre: "Repisa de libros sobre la cama", x: 26, y: 18, objetivo: true, explicacion: "Nada pesado arriba de donde duermes. Es la regla número uno de la recámara.", dato: "Si no se puede mover, al menos que sea de materiales ligeros." },
        { id: "lampara", icono: "🪔", nombre: "Lámpara pesada en el buró", x: 52, y: 44, objetivo: true, explicacion: "Una lámpara de cerámica cae justo a la altura de tu cabeza.", dato: "Un poco de cinta adhesiva de doble cara la mantiene en su lugar." },
        { id: "ropero", icono: "🚪", nombre: "Ropero alto sin anclar", x: 80, y: 26, objetivo: true, explicacion: "Los muebles altos y angostos son los primeros en volcarse.", dato: "Un ropero de dos metros puede caer en menos de un segundo." },
        { id: "zapatos", icono: "👟", nombre: "Sin zapatos junto a la cama", x: 40, y: 74, objetivo: true, explicacion: "Después de un sismo el piso se llena de vidrio. Ten zapatos y linterna al lado.", dato: "Se recomienda amarrarlos a la pata de la cama para que no se muevan." },
        { id: "vela", icono: "🕯️", nombre: "Vela encendida en el buró", x: 14, y: 50, objetivo: true, explicacion: "Una vela olvidada es de las causas más comunes de incendio en casa.", dato: "Si se va la luz, linterna de pilas. Nunca velas." },
        { id: "cama", icono: "🛏️", nombre: "Cama", x: 60, y: 68, objetivo: false, explicacion: "La cama es el lugar seguro si tiembla mientras duermes." },
        { id: "peluche", icono: "🧸", nombre: "Peluche", x: 88, y: 70, objetivo: false, explicacion: "Un peluche no le hace daño a nadie." },
        { id: "reloj", icono: "⏰", nombre: "Despertador ligero", x: 8, y: 78, objetivo: false, explicacion: "Ligero y bajo: sin problema." },
        { id: "poster", icono: "🖼️", nombre: "Póster de papel", x: 68, y: 16, objetivo: false, explicacion: "El papel no lastima al caer." },
      ],
    },
  ],

  /* ------------------------- 💧 Repara la fuga ------------------------- */
  "repara-fuga": [
    {
      id: "casa-agua",
      titulo: "Busca por dónde se va el agua",
      pista: "Toca cada fuga para repararla antes de que se acabe el tiempo.",
      cielo: "#d6ecf7",
      piso: "#cfd9e0",
      objetos: [
        { id: "llave", icono: "🚰", nombre: "Llave del patio goteando", x: 16, y: 30, objetivo: true, explicacion: "Un empaque gastado de cinco pesos tira más de cien litros al mes.", dato: "El goteo constante llena una cubeta cada dos días." },
        { id: "tanque", icono: "🚽", nombre: "Fuga silenciosa del escusado", x: 44, y: 26, objetivo: true, explicacion: "El tanque que se sigue llenando solo puede tirar 200 litros al día sin hacer ruido.", dato: "Se detecta con unas gotas de colorante en el tanque." },
        { id: "regadera", icono: "🚿", nombre: "Regadera que escurre cerrada", x: 72, y: 22, objetivo: true, explicacion: "Escurrir con la llave cerrada significa que el empaque interno ya falló.", dato: "Una regadera ahorradora usa la mitad de agua y se siente igual." },
        { id: "tuberia", icono: "🔧", nombre: "Tubería del jardín rota", x: 84, y: 62, objetivo: true, explicacion: "Las fugas bajo tierra son las que más se tardan en descubrir.", dato: "Si una parte del jardín está siempre húmeda sin regarla, hay fuga." },
        { id: "manguera", icono: "🪣", nombre: "Manguera abierta olvidada", x: 30, y: 66, objetivo: true, explicacion: "Una manguera abierta tira unos 20 litros por minuto.", dato: "Una pistola en la punta corta el agua sola al soltarla." },
        { id: "tinaco", icono: "🛢️", nombre: "Tinaco que se derrama", x: 58, y: 48, objetivo: true, explicacion: "Si la boya está trabada, el tinaco se desborda día y noche.", dato: "Cambiar la boya cuesta poco y ahorra miles de litros." },
        { id: "planta", icono: "🪴", nombre: "Maceta regada a mano", x: 8, y: 74, objetivo: false, explicacion: "Regar a mano es lo más eficiente que hay." },
        { id: "cubeta", icono: "🧺", nombre: "Cubeta juntando agua fría", x: 92, y: 34, objetivo: false, explicacion: "Perfecto: esa agua se reusa para el escusado." },
        { id: "lavadora", icono: "🧼", nombre: "Lavadora con carga completa", x: 50, y: 76, objetivo: false, explicacion: "Lavar con carga llena es lo correcto." },
      ],
    },
  ],

  /* -------------------------- 💡 Apaga las luces -------------------------- */
  "apaga-luces": [
    {
      id: "casa-luz",
      titulo: "Nadie está usando esto",
      pista: "Apaga o desconecta todo lo que está gastando luz sin que nadie lo use.",
      cielo: "#f7f0d6",
      piso: "#d8d2c4",
      objetos: [
        { id: "foco", icono: "💡", nombre: "Luz encendida de día", x: 18, y: 20, objetivo: true, explicacion: "Con luz de sol entrando por la ventana, el foco solo gasta.", dato: "La iluminación es cerca del 20% del recibo de luz de una casa." },
        { id: "tv", icono: "📺", nombre: "Tele prendida sin nadie", x: 46, y: 28, objetivo: true, explicacion: "Una pantalla encendida sin público es puro gasto.", dato: "Una pantalla grande consume como diez focos LED juntos." },
        { id: "cargador", icono: "🔌", nombre: "Cargador conectado sin celular", x: 74, y: 34, objetivo: true, explicacion: "Sigue consumiendo aunque no cargue nada. Se le llama consumo fantasma.", dato: "El consumo fantasma puede ser hasta el 10% del recibo." },
        { id: "compu", icono: "💻", nombre: "Computadora encendida sin usar", x: 30, y: 52, objetivo: true, explicacion: "Si nadie la va a usar en un rato, se apaga o se suspende.", dato: "Suspender gasta unas cien veces menos que dejarla encendida." },
        { id: "consola", icono: "🎮", nombre: "Consola en reposo toda la noche", x: 60, y: 60, objetivo: true, explicacion: "El modo reposo consume todo el tiempo sin que nadie juegue.", dato: "Algunas consolas gastan más en reposo durante un mes que jugando." },
        { id: "clima", icono: "❄️", nombre: "Ventilador con la ventana abierta", x: 86, y: 56, objetivo: true, explicacion: "Enfriar con la ventana abierta es tirar la energía a la calle.", dato: "Cerrar y usar cortinas baja varios grados sin gastar nada." },
        { id: "refri", icono: "🧊", nombre: "Refrigerador cerrado", x: 8, y: 66, objetivo: false, explicacion: "Ese sí tiene que estar prendido siempre." },
        { id: "led", icono: "🔋", nombre: "Foco LED de la escalera", x: 66, y: 16, objetivo: false, explicacion: "Es una luz de seguridad y consume muy poco." },
        { id: "medidor", icono: "🔆", nombre: "Panel solar en el techo", x: 40, y: 76, objetivo: false, explicacion: "Ese produce energía, no la gasta." },
      ],
    },
  ],

  /* --------------------------- 🌊 Limpia el río --------------------------- */
  "limpia-rio": [
    {
      id: "rio",
      titulo: "El río de tu comunidad",
      pista: "Saca los residuos del agua. Cuidado con lo que sí pertenece al río.",
      cielo: "#cfe8f7",
      piso: "#8fc3a8",
      objetos: [
        { id: "botella", icono: "🥤", nombre: "Botella de PET", x: 20, y: 32, objetivo: true, explicacion: "El PET flota y viaja kilómetros hasta el mar.", dato: "Una botella tarda cientos de años en degradarse; reciclada vuelve en semanas." },
        { id: "llanta", icono: "🛞", nombre: "Llanta vieja", x: 52, y: 24, objetivo: true, explicacion: "Las llantas juntan agua estancada donde se cría el mosquito del dengue.", dato: "Una llanta puede criar miles de larvas en una semana." },
        { id: "bolsa", icono: "🛍️", nombre: "Bolsa de plástico", x: 76, y: 38, objetivo: true, explicacion: "Las tortugas las confunden con medusas y se las comen.", dato: "Una bolsa se usa 12 minutos en promedio y dura siglos en el agua." },
        { id: "aceite", icono: "🛢️", nombre: "Bidón de aceite", x: 34, y: 58, objetivo: true, explicacion: "Un litro de aceite contamina hasta mil litros de agua.", dato: "El aceite usado se lleva a acopio, nunca al drenaje." },
        { id: "unicel", icono: "🍱", nombre: "Charolas de unicel", x: 66, y: 66, objetivo: true, explicacion: "El unicel se rompe en bolitas que los peces confunden con comida.", dato: "El unicel no se biodegrada: solo se hace más chiquito." },
        { id: "pila", icono: "🔋", nombre: "Pilas tiradas", x: 88, y: 60, objetivo: true, explicacion: "Los metales pesados se disuelven y suben por la cadena alimenticia.", dato: "Una pila de botón puede contaminar 600 mil litros de agua." },
        { id: "pez", icono: "🐟", nombre: "Pez", x: 12, y: 70, objetivo: false, explicacion: "Ese vive ahí. Déjalo en paz." },
        { id: "rana", icono: "🐸", nombre: "Rana", x: 44, y: 78, objetivo: false, explicacion: "Las ranas son señal de que el río está sanando." },
        { id: "junco", icono: "🌾", nombre: "Juncos de la orilla", x: 92, y: 80, objetivo: false, explicacion: "Los juncos filtran el agua de forma natural." },
        { id: "piedra", icono: "🪨", nombre: "Piedras del cauce", x: 60, y: 44, objetivo: false, explicacion: "Las piedras oxigenan el agua al pasar sobre ellas." },
      ],
    },
  ],
};
