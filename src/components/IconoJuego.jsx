/**
 * Insignias de los minijuegos y medallas de rango (SVG propio).
 *
 * Cada juego tiene su dibujo y el color de su categoría, así que en el Centro
 * se distingue de un vistazo qué es de sismos, de agua o de lógica. Se ven
 * igual en cualquier teléfono (los emojis cambian según la marca) y ningún
 * juego repite dibujo.
 *
 * Dibujo en una rejilla de 48 × 48, trazo blanco de 2.8. Clases de relleno:
 *   f blanco · s blanco translúcido · a amarillo · r rojo · v verde claro
 *   m café · d color de la insignia (para "perforar") · ta trazo amarillo
 */

export const COLOR_CATEGORIA = {
  "Evacuación": "#1b8a4f",
  "Sismos": "#0f6fc4",
  "Emergencias": "#c92a2a",
  "Incendios": "#d9480f",
  "Fenómenos naturales": "#5f3dc4",
  "Jefes finales": "#10304f",
  "Reciclaje": "#2b8a3e",
  "Naturaleza": "#3d7d1e",
  "Agua": "#1971c2",
  "Energía": "#b35c00",
  "Cambio climático": "#0b7285",
  "Velocidad": "#c2255c",
  "Lógica": "#6741d9",
  "Retos especiales": "#a61e4d",
  "Puzzle": "#7048e8",
  "Memoria": "#9c36b5",
};

const OLAS = "M6 0c3-3 6-3 9 0s6 3 9 0 6-3 9 0 6 3 9 0";

const DIBUJOS = {
  /* ---------------------------- Tecnito ---------------------------- */
  "ruta-evacuacion": (
    <>
      <path className="s" d="M10 40V9h16v31" />
      <path d="M10 40V9h16v31M6 40h36" />
      <circle className="f" cx="21" cy="16" r="3" />
      <path d="M20 21l-3 8 5 3-2 7M17 25l-5 2M20 21l5 4 5-1M19 31l-5 6" />
      <path className="ta" d="M30 31h11M37 27l4 4-4 4" />
    </>
  ),
  agachate: (
    <>
      <path d="M6 21h36M10 21v19M38 21v19" />
      <circle className="f" cx="19" cy="29" r="3.4" />
      <path className="f" d="M16 40c0-5 3-8 8-8s8 3 8 8z" />
      <path className="ta" d="M12 8l2 5M24 6v6M36 8l-2 5" />
    </>
  ),
  "casa-segura": (
    <>
      <path className="s" d="M12 22v18h24V22L24 12z" />
      <path d="M7 25 24 10l17 15M12 22v18h24V22" />
      <path className="ta" d="M18 30l4 4 8-9" />
    </>
  ),
  "mochila-emergencia": (
    <>
      <path className="s" d="M13 21a11 11 0 0 1 22 0v16a3 3 0 0 1-3 3H16a3 3 0 0 1-3-3z" />
      <path d="M13 21a11 11 0 0 1 22 0v16a3 3 0 0 1-3 3H16a3 3 0 0 1-3-3zM19 10.5a5 5 0 0 1 10 0" />
      <rect className="f" x="17" y="26" width="14" height="10" rx="2.5" />
      <path className="r n" d="M22.5 27.5h3v2.5h2.5v3h-2.5v2.5h-3V33H20v-3h2.5z" />
    </>
  ),
  simulacro: (
    <>
      <path className="r" d="M14 32v-8a10 10 0 0 1 20 0v8z" />
      <path d="M17 24a7 7 0 0 1 7-7" />
      <rect className="f" x="10" y="32" width="28" height="7" rx="2.5" />
      <path className="ta" d="M24 4v5M10 9l3.5 3.5M38 9l-3.5 3.5M5 21h4M39 21h4" />
    </>
  ),
  "escuela-segura": (
    <>
      <path className="s" d="M9 40V23l15-9 15 9v17z" />
      <path d="M9 40V23l15-9 15 9v17M5 40h38M21 40v-8h6v8M24 14V5" />
      <circle className="f" cx="24" cy="24" r="3" />
      <path className="a" d="M24 5l8 3-8 3z" />
    </>
  ),
  "detective-riesgos": (
    <>
      <circle className="s" cx="20" cy="20" r="11" />
      <circle cx="20" cy="20" r="11" />
      <path d="M28.5 28.5 39 39" strokeWidth="5" />
      <path className="a" d="M20 12.5l7 12.5H13z" />
      <path className="tc" d="M20 17v3.6M20 22.7v.3" strokeWidth="2.2" />
    </>
  ),
  incendio: (
    <>
      <path className="f" d="M24 41c-7 0-11-4.5-11-10.5 0-6 3.5-8.5 6-13 1 3 2.5 4.6 4.6 5.6C23.4 17.6 25.6 12 30 8.6c-.5 4.6 1.2 7.6 3.4 10.4C35 21.2 36 23.6 36 26.8 36 34.6 31 41 24 41z" />
      <path className="a n" d="M24 41c-3.6 0-6-2.4-6-5.6 0-3.4 2.2-4.6 3.6-6.8.8 1.8 1.8 2.6 3 3.2.3-2.4 1.4-4.2 3.2-5.4-.1 2.4.8 3.8 1.8 5.2.8 1.2 1.4 2.4 1.4 3.8 0 3.4-2.8 5.6-7 5.6z" />
    </>
  ),
  "llamada-emergencia": (
    <>
      <path className="f" d="M13 9.5l5.6.9 2.3 7.4-3.9 2.8a19.6 19.6 0 0 0 8.4 8.4l2.8-3.9 7.4 2.3.9 5.6c0 3.4-2.4 5.5-5.6 5.5C19 38.5 8.5 28 8.5 15.1c0-3.2 2.1-5.6 4.5-5.6z" />
      <path className="ta" d="M29 7.5a11.5 11.5 0 0 1 11.5 11.5M29 13.5a5.5 5.5 0 0 1 5.5 5.5" />
    </>
  ),
  extintor: (
    <>
      <rect className="r" x="16" y="17" width="14" height="23" rx="6" />
      <path d="M16 23a7 7 0 0 1 14 0v11a6 6 0 0 1-6 6h-2a6 6 0 0 1-6-6zM20 17v-5h6v5M26 12h6l5 6M17 8h12" />
      <rect className="f n" x="19.5" y="25" width="7" height="8" rx="1.5" />
    </>
  ),
  "fuga-gas": (
    <>
      <rect className="s" x="12" y="16" width="16" height="24" rx="7" />
      <path d="M12 23a7 7 0 0 1 7-7h2a7 7 0 0 1 7 7v10a7 7 0 0 1-7 7h-2a7 7 0 0 1-7-7zM17 16v-5h6v5M12 28h16" />
      <path className="ta" d="M34 12c-2.5 2.5 2.5 4.5 0 7s2.5 4.5 0 7M40 16c-2.5 2.5 2.5 4.5 0 7s2.5 4.5 0 7" />
    </>
  ),
  volcan: (
    <>
      <path className="f" d="M5 40 18 19h12l13 21z" />
      <path className="r n" d="M18 19h12l-2.6 4.4c-.9 1.6-2 1.6-2.8 0L24 21.8l-1.2 3c-.8 1.8-2.2 1.8-3 0z" />
      <circle className="s" cx="20" cy="11" r="3.4" />
      <circle className="s" cx="27.5" cy="8.5" r="4" />
      <circle cx="20" cy="11" r="3.4" />
      <circle cx="27.5" cy="8.5" r="4" />
    </>
  ),
  inundacion: (
    <>
      <path className="s" d="M14 30V20l10-8 10 8v10z" />
      <path d="M9 24 24 11l15 13M14 20v9M34 20v9" />
      <path className="ta" d={OLAS} transform="translate(0 31)" />
      <path d={OLAS} transform="translate(0 38)" />
    </>
  ),
  electricidad: (
    <>
      <path className="a" d="M27 5 13 27h10l-3 16 15-23H25z" />
    </>
  ),
  "construye-edificio": (
    <>
      <path d="M12 41V9M8 41h10M12 9h28M12 15l6-6M34 9v8" />
      <rect className="a" x="30" y="17" width="8" height="6" rx="1" />
      <rect className="s" x="20" y="27" width="16" height="13" rx="1" />
      <path d="M20 40V27h16v13M24 31h2M30 31h2M24 35h2M30 35h2" />
    </>
  ),
  "mapa-riesgos": (
    <>
      <path className="s" d="M5 14l11-4 15 4 12-4v26l-12 4-15-4-11 4z" />
      <path d="M5 14l11-4 15 4 12-4v26l-12 4-15-4-11 4zM16 10v26M31 14v26" />
      <path className="r" d="M24 8.5c-3.2 0-5.5 2.4-5.5 5.4 0 4.2 5.5 9.6 5.5 9.6s5.5-5.4 5.5-9.6c0-3-2.3-5.4-5.5-5.4z" />
      <circle className="f n" cx="24" cy="14" r="2" />
    </>
  ),
  tormenta: (
    <>
      <path className="f" d="M14 28a7 7 0 0 1 .8-14 9.5 9.5 0 0 1 18.2-2 7.5 7.5 0 0 1 1.5 16z" />
      <path className="a" d="M25 26l-6 9h5l-2 8 8-11h-5l2-6z" />
      <path d="M13 33l-2 4M37 32l-2 4" />
    </>
  ),
  "simulador-emergencia": (
    <>
      <rect className="s" x="6" y="9" width="36" height="24" rx="3.5" />
      <rect x="6" y="9" width="36" height="24" rx="3.5" />
      <path d="M18 40h12M24 33v7" />
      <path className="ta" d="M10 22h7l3-6 4 12 3-7 2 1h9" />
    </>
  ),
  "comandante-emergencias": (
    <>
      <path className="f" d="M9 31c0-9 6.7-16 15-16s15 7 15 16z" />
      <rect className="f" x="5" y="31" width="38" height="5" rx="2.5" />
      <path className="a" d="M24 18.5l5.5 2.2v4.2c0 3.2-2.2 5.4-5.5 6.6-3.3-1.2-5.5-3.4-5.5-6.6v-4.2z" />
      <path d="M24 9v6" />
    </>
  ),

  /* --------------------------- Greencito --------------------------- */
  "clasifica-basura": (
    <>
      <path className="s" d="M13 16h22l-2.4 24H15.4z" />
      <path d="M13 16h22l-2.4 24H15.4zM9 16h30M20 16v-4h8v4" />
      <path className="ta" d="M29 29.5a5.2 5.2 0 1 1-1.5-6.6" />
      <path className="ta" d="M28.5 19.5v4h-4" />
    </>
  ),
  "planta-arbol": (
    <>
      <path className="m" d="M6 40c4-6 32-6 36 0z" />
      <path d="M24 37V20" />
      <path className="v" d="M24 22c0-8 4.5-12.5 13-12.5 0 8.5-4.5 12.5-13 12.5z" />
      <path className="v" d="M24 27c0-6-3.5-9.5-10-9.5 0 6.5 3.5 9.5 10 9.5z" />
    </>
  ),
  "repara-fuga": (
    <>
      <path className="s" d="M7 17h15a8 8 0 0 1 8 8v3h-7v-3a1 1 0 0 0-1-1H7z" />
      <path d="M7 17h15a8 8 0 0 1 8 8v3h-7v-3a1 1 0 0 0-1-1H7M14 17v-6M10 11h8" />
      <path className="a" d="M26.5 33c-2.2 3.2-3.3 5-3.3 6.6a3.3 3.3 0 0 0 6.6 0c0-1.6-1.1-3.4-3.3-6.6z" />
      <circle className="ta" cx="36.5" cy="11.5" r="3.6" />
      <path className="ta" d="M39 14l4 4" strokeWidth="3.4" />
    </>
  ),
  "carrera-reciclaje": (
    <>
      <path d="M36 17a13 13 0 0 0-21-3.5M14 31a13 13 0 0 0 21 3.5" />
      <path className="f" d="M13 8l1.4 8.4L22.4 14zM35 40l-1.4-8.4L25.6 34z" />
      <path className="ta" d="M3 21h7M1 27h9M3 33h7" />
      <circle className="a" cx="24" cy="24" r="4" />
    </>
  ),
  "ahorra-agua": (
    <>
      <path d="M10 41V13a5 5 0 0 1 5-5h9a6 6 0 0 1 6 6v3" />
      <path className="f" d="M21 17h18l-2.5 5h-13z" />
      <path className="a n" d="M25 27c-1.4 2-2 3-2 4a2 2 0 0 0 4 0c0-1-.6-2-2-4zM33 27c-1.4 2-2 3-2 4a2 2 0 0 0 4 0c0-1-.6-2-2-4zM29 34c-1.4 2-2 3-2 4a2 2 0 0 0 4 0c0-1-.6-2-2-4z" />
    </>
  ),
  "apaga-luces": (
    <>
      <path className="a" d="M24 6a11 11 0 0 0-6.5 19.8c1.3 1 2 2.3 2 3.7h9c0-1.4.7-2.7 2-3.7A11 11 0 0 0 24 6z" />
      <path d="M19.5 34h9M21 39h6" />
      <path d="M24 29.5v-8l-3-3M24 21.5l3-3" strokeWidth="2.2" className="tc" />
    </>
  ),
  "limpia-rio": (
    <>
      <path className="f" d="M8 21c5-7 13-8 20 0-7 8-15 7-20 0z" />
      <path className="f" d="M28 21l7-6v12z" />
      <circle className="d" cx="14" cy="20" r="1.6" />
      <path className="ta" d={OLAS} transform="translate(0 35)" />
      <path d="M38 6v7M34.5 9.5h7" />
    </>
  ),
  transporte: (
    <>
      <circle cx="13" cy="31" r="8" />
      <circle cx="35" cy="31" r="8" />
      <path d="M13 31l7-12h11l4 12M20 19l5 12h-12M17 14h6M29 13l2 6" />
      <circle className="a" cx="25" cy="31" r="2.5" />
    </>
  ),
  reforestacion: (
    <>
      <path className="v" d="M24 6l8.5 14H28l6.5 10h-21L20 20h-4.5z" />
      <path d="M24 30v9M11 32v7M37 32v7M5 39h38" />
      <circle className="s" cx="11" cy="27" r="5.5" />
      <circle className="s" cx="37" cy="27" r="5.5" />
      <circle cx="11" cy="27" r="5.5" />
      <circle cx="37" cy="27" r="5.5" />
    </>
  ),
  "casa-eficiente": (
    <>
      <path className="s" d="M11 22v18h26V22L24 11z" />
      <path d="M6 25 24 9l18 16M11 22v18h26V22" />
      <path className="a" d="M26 19l-7 10h5l-2 8 8-11h-5z" />
    </>
  ),
  "captura-lluvia": (
    <>
      <path className="f" d="M14 18a5.5 5.5 0 0 1 .8-11 7.5 7.5 0 0 1 14.4-1.4A6 6 0 0 1 31 18z" />
      <path className="ta" d="M17 22v4M23.5 22v4M30 22v4" />
      <path className="s" d="M14 29h20l-2.4 11H16.4z" />
      <path d="M14 29h20l-2.4 11H16.4zM15.5 34.5h17" />
    </>
  ),
  polinizadores: (
    <>
      <ellipse className="s" cx="18.5" cy="15" rx="6" ry="7.5" transform="rotate(-20 18.5 15)" />
      <ellipse className="s" cx="30" cy="15" rx="6" ry="7.5" transform="rotate(20 30 15)" />
      <ellipse className="a" cx="24" cy="28" rx="11" ry="8.5" />
      <path className="tc" d="M21 20.5v15M27.5 20.5v15" strokeWidth="3" />
      <path d="M35 28h5" />
      <circle className="f" cx="15.5" cy="26" r="1.8" />
    </>
  ),
  "energia-solar": (
    <>
      <circle className="a" cx="35" cy="12" r="5" />
      <path className="ta" d="M35 3v2M35 19v2M26 12h2M42 12h2M28.6 5.6l1.4 1.4M40 17l1.4 1.4M41.4 5.6 40 7" />
      <path className="s" d="M6 40l5-17h22l5 17z" />
      <path d="M6 40l5-17h22l5 17zM8.5 31.5h27M17 23l-2 17M27 23l2 17" />
    </>
  ),
  "energia-eolica": (
    <>
      <path className="f" d="M22.5 22h3l1.5 19h-6z" />
      <path className="f" d="M24 19 22 5c1.3-1.3 2.7-1.3 4 0z" />
      <path className="f" d="M24 19 22 5c1.3-1.3 2.7-1.3 4 0z" transform="rotate(120 24 19)" />
      <path className="f" d="M24 19 22 5c1.3-1.3 2.7-1.3 4 0z" transform="rotate(240 24 19)" />
      <circle className="a" cx="24" cy="19" r="3" />
      <path className="ta" d="M3 33h9M6 38h8" />
    </>
  ),
  "salva-planeta": (
    <>
      <circle className="s" cx="24" cy="24" r="16" />
      <path className="v n" d="M14.5 13.5c5 0 6.5 4 4 6.5s-1 6 2.5 7 1.4 6.6-3.6 6.6c-4.2-3.6-7.4-10.4-2.9-20.1zM28 9c5 1 10 5.5 10.2 11.8-3.6.2-5.8-2.4-7.4-.2s2.4 6.4-1.4 9.2c-2.6-3.8-5-6.4-2.6-11.2S25.8 12.6 28 9z" />
      <circle cx="24" cy="24" r="16" />
    </>
  ),
  ecosistema: (
    <>
      <path d="M38 21a14 14 0 0 0-24-8M10 27a14 14 0 0 0 24 8" />
      <path className="f" d="M13 7.5l1 7.5 7-2.5zM35 40.5l-1-7.5-7 2.5z" />
      <path className="v" d="M17 31c0-9 5.5-14.5 15-14.5 0 9.5-5.5 15-15 14.5z" />
      <path className="tc" d="M17 31l9-9" strokeWidth="2.2" />
    </>
  ),
  "ciudad-sostenible": (
    <>
      <path className="s" d="M7 40V21h8v19zM15 40V11h11v29zM26 40V23h9v17z" />
      <path d="M7 40V21h8v19M15 40V11h11v29M26 40V23h9v17M4 40h40M19 16h3M19 21h3M19 26h3M30 28h1.5M30 33h1.5" />
      <path className="v" d="M33 19c0-7 4.5-10.5 10.5-10.5 0 7-4.5 10.5-10.5 10.5z" />
    </>
  ),

  /* --------------------------- Desafíos ---------------------------- */
  "quiz-relampago": (
    <>
      <path className="s" d="M10 9h28a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H22l-9 7v-7h-3a4 4 0 0 1-4-4V13a4 4 0 0 1 4-4z" />
      <path d="M10 9h28a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H22l-9 7v-7h-3a4 4 0 0 1-4-4V13a4 4 0 0 1 4-4z" />
      <path className="a" d="M27 12l-7.5 10h5.5l-2.5 7.5 8-10.5h-5.5z" />
    </>
  ),
  "verdadero-falso": (
    <>
      <path className="s" d="M24 7v34" />
      <path d="M24 7v34" strokeWidth="2" />
      <path d="M7 25l5 5.5 8-11" strokeWidth="4" />
      <path className="ta" d="M30 18l11 11M41 18 30 29" strokeWidth="4" />
    </>
  ),
  "atrapa-respuesta": (
    <>
      <circle className="s" cx="22" cy="26" r="15" />
      <circle cx="22" cy="26" r="15" />
      <circle cx="22" cy="26" r="9" />
      <circle className="r" cx="22" cy="26" r="3.6" />
      <path className="ta" d="M22 26 40 8M40 8v6M40 8h-6" />
    </>
  ),
  "reto-contrarreloj": (
    <>
      <circle className="s" cx="24" cy="27" r="14" />
      <circle cx="24" cy="27" r="14" />
      <path d="M19.5 6h9M24 6v7M35 14l3-3" />
      <path className="ta" d="M24 27l6-7" strokeWidth="3.4" />
      <circle className="f" cx="24" cy="27" r="2.4" />
    </>
  ),
  "ruleta-educativa": (
    <>
      <path className="a n" d="M24 26V11a15 15 0 0 1 15 15z" />
      <path className="v n" d="M24 26H9a15 15 0 0 0 15 15z" />
      <circle cx="24" cy="26" r="15" />
      <path d="M24 11v30M9 26h30M13.4 15.4l21.2 21.2M34.6 15.4 13.4 36.6" strokeWidth="2" />
      <circle className="f" cx="24" cy="26" r="3" />
      <path className="f" d="M24 9.5 20 3h8z" />
    </>
  ),
  "palabras-ocultas": (
    <>
      <rect className="s" x="7" y="7" width="34" height="34" rx="6" />
      <rect x="7" y="7" width="34" height="34" rx="6" />
      <path d="M15 33 33 15" stroke="#ffd23f" strokeWidth="8" opacity="0.75" />
      <circle className="f n" cx="15" cy="15" r="2.4" />
      <circle className="f n" cx="24" cy="15" r="2.4" />
      <circle className="f n" cx="33" cy="15" r="2.4" />
      <circle className="f n" cx="15" cy="24" r="2.4" />
      <circle className="f n" cx="24" cy="24" r="2.4" />
      <circle className="f n" cx="33" cy="24" r="2.4" />
      <circle className="f n" cx="15" cy="33" r="2.4" />
      <circle className="f n" cx="24" cy="33" r="2.4" />
      <circle className="f n" cx="33" cy="33" r="2.4" />
    </>
  ),
  rompecabezas: (
    <>
      <path className="f" d="M9 13h9a4.5 4.5 0 1 1 9 0h9v9a4.5 4.5 0 1 1 0 9v9h-9a4.5 4.5 0 1 0-9 0H9v-9a4.5 4.5 0 1 0 0-9z" />
      <circle className="a n" cx="22.5" cy="26.5" r="4" />
    </>
  ),
  "codigo-secreto": (
    <>
      <path d="M16 21v-5a8 8 0 0 1 16 0v5" />
      <rect className="f" x="10" y="21" width="28" height="19" rx="4.5" />
      <circle className="d" cx="17.5" cy="30.5" r="2.3" />
      <circle className="d" cx="24" cy="30.5" r="2.3" />
      <circle className="a" cx="30.5" cy="30.5" r="2.3" />
    </>
  ),
  "tecnito-vs-greencito": (
    <>
      <path className="a" d="M15 7h18v10a9 9 0 0 1-18 0z" />
      <path d="M15 10h-5v2.5a6 6 0 0 0 6 6M33 10h5v2.5a6 6 0 0 1-6 6M24 26v6" />
      <rect className="f" x="16" y="32" width="16" height="7" rx="2" />
      <path className="tc" d="M20 12.5l2.5 6 2.5-6M30 13a2.5 2 0 1 0-2.5 2.5 2.5 2 0 1 1-2.5 2.5" strokeWidth="1.8" />
    </>
  ),
  memorama: (
    <>
      <rect className="s" x="7" y="11" width="18" height="25" rx="3.5" transform="rotate(-10 16 23.5)" />
      <rect x="7" y="11" width="18" height="25" rx="3.5" transform="rotate(-10 16 23.5)" />
      <rect className="f" x="22" y="12" width="18" height="25" rx="3.5" transform="rotate(8 31 24.5)" />
      <path className="a n" d="m31 17.5 2.1 4.2 4.7.7-3.4 3.3.8 4.6-4.2-2.2-4.2 2.2.8-4.6-3.4-3.3 4.7-.7z" transform="rotate(8 31 24.5)" />
    </>
  ),
};

/** Ids de los juegos que ya tienen dibujo propio (las pruebas revisan que estén todos). */
export const JUEGOS_CON_DIBUJO = Object.keys(DIBUJOS);

/** Insignia de un minijuego: dibujo propio sobre el color de su categoría. */
export default function IconoJuego({ juego, className = "" }) {
  const dibujo = DIBUJOS[juego.id];
  if (!dibujo) return <span className={`insignia insignia--emoji ${className}`}>{juego.icono}</span>;
  const jefe = juego.categoria === "Jefes finales";
  return (
    <svg
      className={`insignia ${jefe ? "insignia--jefe" : ""} ${className}`.trim()}
      viewBox="0 0 48 48"
      width="48"
      height="48"
      aria-hidden="true"
      focusable="false"
      style={{ "--c": COLOR_CATEGORIA[juego.categoria] || "#0f6fc4" }}
    >
      <rect className="insignia__fondo" x="1.5" y="1.5" width="45" height="45" rx="12" />
      <path className="insignia__brillo" d="M7 17V13a6 6 0 0 1 6-6h14" />
      <g className="insignia__dibujo" transform="translate(24 24) scale(0.74) translate(-24 -24)">
        {dibujo}
      </g>
      {jefe && <path className="insignia__corona" d="M33 9.5 35.5 2l4 4.5L43 1l1 8.5z" />}
    </svg>
  );
}

/* ----------------------------- rangos ----------------------------- */

const MEDALLAS = {
  Aprendiz: { color: "#2fb35a", estrellas: 0 },
  Vigilante: { color: "#c8793a", estrellas: 1 },
  "Guardián": { color: "#9fb3c8", estrellas: 2 },
  "Capitán": { color: "#f2b705", estrellas: 3 },
};
// la estrella de Icono.jsx (24 × 24) a la mitad: 12 × 12 centrada en (x, y)
const ESTRELLA = "m12 3.2 2.7 5.5 6 .9-4.4 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6-4.4-4.2 6-.9z";
const POS = { 1: [[24, 30]], 2: [[20, 30], [28, 30]], 3: [[24, 26], [19.5, 33], [28.5, 33]] };

/** Medalla del rango (Aprendiz, Vigilante, Guardián, Capitán) o corona de Leyenda. */
export function IconoRango({ rango, className = "" }) {
  const m = MEDALLAS[rango.nombre];
  return (
    <svg
      className={`medalla ${className}`.trim()}
      viewBox="0 0 48 48"
      width="48"
      height="48"
      aria-hidden="true"
      focusable="false"
    >
      {m ? (
        <>
          <path d="M14 3h9l3 15h-9z" fill="#e5484d" />
          <path d="M34 3h-9l-3 15h9z" fill="#3b82f6" />
          <circle className="medalla__disco" cx="24" cy="30" r="14" fill={m.color} />
          <circle cx="24" cy="30" r="9.5" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
          {m.estrellas === 0 ? (
            <path d="M24 37v-8M24 30c0-4.5 2.5-7 7-7 0 4.5-2.5 7-7 7zM24 32c0-3.4-2-5.5-6-5.5 0 3.6 2 5.5 6 5.5z" fill="#fff" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
          ) : (
            POS[m.estrellas].map(([x, y], i) => (
              <path key={i} d={ESTRELLA} fill="#fff" transform={`translate(${x - 6} ${y - 6.2}) scale(0.5)`} />
            ))
          )}
        </>
      ) : (
        <>
          <path className="medalla__disco" d="M7 38 5 15l10 8 9-14 9 14 10-8-2 23z" fill="#ffd23f" />
          <path d="M7 38h34" stroke="#c98a00" strokeWidth="3" />
          <circle cx="24" cy="29" r="3.4" fill="#e5484d" />
          <circle cx="14" cy="31" r="2.4" fill="#3b82f6" />
          <circle cx="34" cy="31" r="2.4" fill="#2fb35a" />
        </>
      )}
    </svg>
  );
}
