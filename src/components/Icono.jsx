/**
 * Iconos propios de la interfaz (SVG en línea, sin archivos ni fuentes de iconos).
 *
 * Se dibujan con el color del texto (`currentColor`), así que funcionan igual en
 * el tema claro, el oscuro y sobre los botones de color. Los emojis se quedan
 * solo en el contenido de los juegos (residuos, objetos, escenas), donde son
 * parte del dibujo; los controles y el marcador usan estos.
 *
 * Trazo de 2.2 con puntas redondas: combina con los bordes gruesos del juego.
 * Las piezas con clase "r" van rellenas.
 */

const FORMAS = {
  volver: <path d="M19 12H5.5M11 5.5 4.5 12l6.5 6.5" />,
  siguiente: <path d="M5 12h13.5M13 5.5l6.5 6.5-6.5 6.5" />,
  sonido: (
    <>
      <path className="r" d="M3.5 9.2v5.6h3.8l5.2 4.3V4.9L7.3 9.2z" />
      <path d="M16 9a4.2 4.2 0 0 1 0 6M18.6 6.4a7.8 7.8 0 0 1 0 11.2" />
    </>
  ),
  silencio: (
    <>
      <path className="r" d="M3.5 9.2v5.6h3.8l5.2 4.3V4.9L7.3 9.2z" />
      <path d="m16 9.5 5 5M21 9.5l-5 5" />
    </>
  ),
  corazon: <path className="r" d="M12 20.2S4 15.4 4 9.6A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 8 2.2c0 5.8-8 10.6-8 10.6z" />,
  fuego: (
    <path
      className="r"
      d="M12 21.3c-3.9 0-6.6-2.7-6.6-6.3 0-3.3 2.2-5.1 3.4-7.6.4 1.6 1.3 2.7 2.5 3.2C11.2 7.6 12.6 4.7 15.2 3c-.3 2.7.8 4.5 2.1 6.2 1 1.3 1.9 2.9 1.9 5.1 0 3.8-3 7-7.2 7z"
    />
  ),
  escudo: (
    <>
      <path className="r" d="M12 2.8 19.5 6v5.3c0 4.7-3.1 8.5-7.5 10.2-4.4-1.7-7.5-5.5-7.5-10.2V6z" />
      <path className="hueco" d="m8.6 12 2.4 2.4 4.4-4.6" />
    </>
  ),
  brote: (
    <>
      <path d="M12 21v-8.5" />
      <path className="r" d="M12 12.8c0-4.3 2.6-7 7.4-7 0 4.8-2.6 7-7.4 7z" />
      <path className="r" d="M12 15.2c0-3.2-2.1-5.4-6.4-5.4 0 3.6 2.1 5.4 6.4 5.4z" />
    </>
  ),
  estrella: <path className="r" d="m12 3.2 2.7 5.5 6 .9-4.4 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6-4.4-4.2 6-.9z" />,
  "estrella-vacia": <path d="m12 3.2 2.7 5.5 6 .9-4.4 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6-4.4-4.2 6-.9z" />,
  trofeo: (
    <>
      <path className="r" d="M7.5 3.8h9v5.4a4.5 4.5 0 0 1-9 0z" />
      <path d="M7.5 5.8H4.6v1.1a3.4 3.4 0 0 0 3.2 3.4M16.5 5.8h2.9v1.1a3.4 3.4 0 0 1-3.2 3.4M12 13.8v3.4M8.4 20.4h7.2M9.8 17.2h4.4" />
    </>
  ),
  candado: (
    <>
      <rect className="r" x="5" y="10.5" width="14" height="10.5" rx="2.6" />
      <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
    </>
  ),
  control: (
    <>
      <path d="M7.2 7.6h9.6a4.3 4.3 0 0 1 4.3 4.6l-.4 4.2a2.8 2.8 0 0 1-4.8 1.6L14.4 16H9.6l-1.5 2a2.8 2.8 0 0 1-4.8-1.6l-.4-4.2a4.3 4.3 0 0 1 4.3-4.6z" />
      <path d="M8 10.4v3.6M6.2 12.2h3.6" />
      <circle className="r" cx="15.6" cy="11" r="1.1" />
      <circle className="r" cx="17.4" cy="13.4" r="1.1" />
    </>
  ),
  mochila: (
    <>
      <path d="M6.5 10a5.5 5.5 0 0 1 11 0v9a2.2 2.2 0 0 1-2.2 2.2H8.7A2.2 2.2 0 0 1 6.5 19z" />
      <path d="M10 4.6V4a2 2 0 0 1 4 0v.6M9.3 13.5h5.4v4H9.3z" />
    </>
  ),
  audifonos: (
    <>
      <path d="M4 15.5V12a8 8 0 0 1 16 0v3.5" />
      <rect className="r" x="3" y="13.6" width="4.6" height="7" rx="1.9" />
      <rect className="r" x="16.4" y="13.6" width="4.6" height="7" rx="1.9" />
    </>
  ),
  reloj: (
    <>
      <circle cx="12" cy="13.2" r="7.6" />
      <path d="M12 9.4v3.8l2.6 2.1M9.4 2.8h5.2" />
    </>
  ),
  lugar: (
    <>
      <path className="r" d="M12 21.4s-6.6-5.6-6.6-11.2a6.6 6.6 0 0 1 13.2 0c0 5.6-6.6 11.2-6.6 11.2z" />
      <circle className="hueco-r" cx="12" cy="10.2" r="2.5" />
    </>
  ),
  rayo: <path className="r" d="M13.4 2.4 4.8 13.6h6.3l-1.3 8 8.6-11.3h-6.3z" />,
  foco: (
    <>
      <path className="r" d="M12 2.8a6.2 6.2 0 0 0-3.7 11.2c.8.6 1.2 1.5 1.2 2.4h5c0-.9.4-1.8 1.2-2.4A6.2 6.2 0 0 0 12 2.8z" />
      <path d="M9.5 19h5M10.4 21.6h3.2" />
    </>
  ),
  bien: <path d="m5 12.6 4.4 4.4L19 7.4" />,
  mal: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  luna: <path className="r" d="M20 14.6A8.2 8.2 0 0 1 9.4 4a8.2 8.2 0 1 0 10.6 10.6z" />,
  sol: (
    <>
      <circle className="r" cx="12" cy="12" r="4.2" />
      <path d="M12 2.4v2.2M12 19.4v2.2M2.4 12h2.2M19.4 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M5.2 18.8l1.6-1.6M17.2 6.8l1.6-1.6" />
    </>
  ),
};

/** Moneda de cada personaje o familia → su icono. */
export function iconoMoneda(moneda) {
  return moneda === "escudos" ? "escudo" : moneda === "semillas" ? "brote" : "estrella";
}

/** Pestañas del Centro y grados de la portada. */
export const ICONO_FAMILIA = { tecnito: "escudo", greencito: "brote", general: "foco" };
export const ICONO_GRADO = { primaria: "mochila", secundaria: "audifonos" };

export default function Icono({ nombre, className = "", titulo }) {
  const forma = FORMAS[nombre];
  if (!forma) return null;
  return (
    <svg
      className={`icono icono--${nombre} ${className}`.trim()}
      viewBox="0 0 24 24"
      width="24"
      height="24"
      focusable="false"
      role={titulo ? "img" : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : "true"}
    >
      {forma}
    </svg>
  );
}

/** Corazones de vida: llenos los que quedan, vacíos los que se perdieron. */
export function Vidas({ vidas, max, className = "", children }) {
  const quedan = Math.max(0, vidas);
  const perdidas = Math.max(0, (max ?? vidas) - quedan);
  return (
    <span className={`vidas ${className}`.trim()} aria-label={`${quedan} vidas`}>
      {Array.from({ length: quedan }, (_, i) => (
        <Icono key={`l${i}`} nombre="corazon" className="vida vida--llena" />
      ))}
      {Array.from({ length: perdidas }, (_, i) => (
        <Icono key={`v${i}`} nombre="corazon" className="vida vida--vacia" />
      ))}
      {children}
    </span>
  );
}
