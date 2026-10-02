/**
 * Dibujo del edificio de "Construye un edificio".
 *
 * Cada etapa agrega su pieza al dibujo según lo que se eligió: el suelo,
 * la base, las columnas, las vigas y las paredes. Así el niño ve lo que
 * está construyendo sin tener que leerlo. Al final el sismo lo sacude y,
 * según cómo quedó, aguanta, se agrieta o se cae.
 *
 *   piezas   { suelo, cimentacion, columnas, trabes, muros } → opción elegida
 *   siguiente  id de la etapa que toca (se dibuja punteada, como plano)
 *   estado   "obra" | "sismo" | "excelente" | "regular" | "malo"
 *   revelar  pinta de rojo las piezas débiles (fácil y medio)
 */

const SUELO_Y = 190;
const PISO_1 = 130;
const PISO_2 = 70;
const IZQ = 50;
const DER = 190;

/* posiciones de las columnas según su forma */
function ejes(forma) {
  const n = forma === "delgadas" ? 7 : 4;
  return Array.from({ length: n }, (_, i) => IZQ + 5 + ((DER - IZQ - 10) * i) / (n - 1));
}

function Suelo({ forma }) {
  const color = forma === "lodo" ? "#8a7a5c" : forma === "dudoso" ? "#9b7447" : "#a0683a";
  return (
    <g className="edificio__suelo">
      <rect x="0" y={SUELO_Y} width="240" height="40" fill={color} />
      <rect x="0" y={SUELO_Y} width="240" height="5" fill={forma ? color : "#6fb35a"} />
      {forma === "firme" &&
        [204, 214, 224].map((y) => (
          <line key={y} x1="0" x2="240" y1={y} y2={y} stroke="#7d4f2a" strokeWidth="2" strokeDasharray="14 6" />
        ))}
      {forma === "lodo" &&
        [30, 80, 130, 180, 215].map((x, i) => (
          <path
            key={x}
            d={`M${x} ${205 + (i % 2) * 10} q6 -6 12 0 t12 0`}
            fill="none"
            stroke="#4aa3df"
            strokeWidth="3"
            strokeLinecap="round"
          />
        ))}
      {forma === "dudoso" &&
        [40, 120, 200].map((x) => (
          <text key={x} x={x} y="216" fontSize="16" fill="#5c3b1c" textAnchor="middle">
            ?
          </text>
        ))}
    </g>
  );
}

function Cimentacion({ forma, columnas, debil }) {
  if (forma === "nada") return null;
  if (forma === "zapatas") {
    return (
      <g className={`edificio__pieza ${debil}`}>
        {ejes(columnas || "gruesas").map((x) => (
          <rect key={x} x={x - 10} y={SUELO_Y} width="20" height="12" fill="#6b6f76" />
        ))}
      </g>
    );
  }
  return <rect className={`edificio__pieza ${debil}`} x={IZQ - 10} y={SUELO_Y} width={DER - IZQ + 20} height="12" fill="#5d636b" />;
}

function Columnas({ forma, debil }) {
  const ancho = (piso) => (forma === "delgadas" || (forma === "piso-debil" && piso === 1) ? 4 : 10);
  return (
    <g className={`edificio__pieza ${debil}`}>
      {[
        [PISO_1, SUELO_Y, 1],
        [PISO_2, PISO_1, 2],
      ].map(([arriba, abajo, piso]) =>
        ejes(forma).map((x) => (
          <rect
            key={`${piso}-${x}`}
            x={x - ancho(piso) / 2}
            y={arriba}
            width={ancho(piso)}
            height={abajo - arriba}
            fill="#9aa3ad"
            stroke="#4d5560"
            strokeWidth="1"
          />
        ))
      )}
      {forma === "piso-debil" && (
        <text x="120" y="178" fontSize="26" textAnchor="middle">
          🚗
        </text>
      )}
    </g>
  );
}

function Trabes({ forma, debil }) {
  const alto = forma === "marcos" ? 9 : forma === "un-sentido" ? 6 : 3;
  return (
    <g className={`edificio__pieza ${debil}`}>
      {[PISO_1, PISO_2].map((y) =>
        forma === "un-sentido" ? (
          // vigas con huecos: solo amarran de un lado
          <line key={y} x1={IZQ} x2={DER} y1={y} y2={y} stroke="#6f7a86" strokeWidth={alto} strokeDasharray="22 14" />
        ) : forma === "sin-trabes" ? (
          // losa delgada que se pandea entre columnas
          <path key={y} d={`M${IZQ} ${y} Q 120 ${y + 7} ${DER} ${y}`} fill="none" stroke="#8b949e" strokeWidth={alto} />
        ) : (
          <rect key={y} x={IZQ - 4} y={y - alto / 2} width={DER - IZQ + 8} height={alto} fill="#6f7a86" />
        )
      )}
    </g>
  );
}

function Muros({ forma, columnas, debil }) {
  const xs = ejes(columnas || "gruesas");
  const tramos = xs.slice(0, -1).map((x, i) => [x, xs[i + 1]]);
  const pisos = [
    [PISO_1, SUELO_Y, 1],
    [PISO_2, PISO_1, 2],
  ];
  return (
    <g className={`edificio__pieza ${debil}`}>
      {pisos.map(([arriba, abajo, piso]) => {
        // planta baja abierta: abajo no hay paredes, es estacionamiento
        if (piso === 1 && columnas === "piso-debil") return null;
        const piedra = forma === "piedra" && piso === 2;
        const relleno = piedra ? "#7d8288" : forma === "ligeros" ? "#e3eef8" : "#f1d9b5";
        return tramos.map(([a, b]) => {
          const ancho = b - a - 8;
          const alto = abajo - arriba - 8;
          return (
            <g key={`${piso}-${a}`}>
              <rect x={a + 4} y={arriba + 4} width={ancho} height={alto} fill={relleno} opacity={forma === "ligeros" ? 0.85 : 1} />
              {piedra ? (
                [0.25, 0.55, 0.8].map((f) => (
                  <circle key={f} cx={a + 4 + ancho * f} cy={arriba + 4 + alto * (1 - f)} r="5" fill="#5f6469" />
                ))
              ) : (
                <rect
                  x={a + 4 + ancho * 0.3}
                  y={arriba + 4 + alto * 0.25}
                  width={ancho * 0.4}
                  height={alto * 0.35}
                  fill="#8fd0f5"
                  stroke="#4d5560"
                  strokeWidth="1"
                />
              )}
              {forma === "castillos" && (
                <>
                  <rect x={a + 4} y={arriba + 4} width="3" height={alto} fill="#c2533a" />
                  <rect x={b - 7} y={arriba + 4} width="3" height={alto} fill="#c2533a" />
                </>
              )}
            </g>
          );
        });
      })}
      {/* techo terminado */}
      <rect x={IZQ - 6} y={PISO_2 - 10} width={DER - IZQ + 12} height="8" fill="#4d5560" />
      <text x={DER - 4} y={PISO_2 - 14} fontSize="16" textAnchor="middle">
        🚩
      </text>
    </g>
  );
}

/* contorno punteado de lo que toca construir: el "plano" */
function Plano({ etapa }) {
  const forma = {
    suelo: <rect x="0" y={SUELO_Y} width="240" height="40" />,
    cimentacion: <rect x={IZQ - 10} y={SUELO_Y} width={DER - IZQ + 20} height="12" />,
    columnas: <rect x={IZQ} y={PISO_2} width={DER - IZQ} height={SUELO_Y - PISO_2} />,
    trabes: <rect x={IZQ} y={PISO_2 - 4} width={DER - IZQ} height={SUELO_Y - PISO_2} />,
    muros: <rect x={IZQ + 4} y={PISO_2 - 10} width={DER - IZQ - 8} height={SUELO_Y - PISO_2 + 6} />,
  }[etapa];
  if (!forma) return null;
  return <g className="edificio__plano">{forma}</g>;
}

/* grietas que aparecen si el edificio quedó dañado */
function Grietas() {
  return (
    <g className="edificio__grietas" stroke="#1d2329" strokeWidth="2.5" fill="none" strokeLinecap="round">
      <path d="M70 140 l8 10 l-6 8 l9 12" />
      <path d="M150 80 l-7 9 l6 7 l-8 11" />
      <path d="M175 140 l-5 12 l7 6" />
      <path d="M100 85 l6 8 l-5 9" />
    </g>
  );
}

export default function Edificio({ piezas, siguiente, estado = "obra", revelar = false }) {
  const debil = (etapa) => (revelar || estado !== "obra") && (piezas[etapa]?.solidez ?? 1) < 0 ? "edificio__pieza--debil" : "";
  const { suelo, cimentacion, columnas, trabes, muros } = piezas;
  const enPie = estado !== "malo";

  return (
    <div className={`edificio edificio--${estado}`}>
      <svg viewBox="0 0 240 230" role="img" aria-label={describir(piezas, estado)}>
        <rect x="0" y="0" width="240" height={SUELO_Y} fill="#cfe8fb" />
        {estado === "obra" && (
          <text x="214" y="34" fontSize="26" textAnchor="middle" aria-hidden="true">
            🏗️
          </text>
        )}

        <Suelo forma={suelo?.forma} />

        <g className="edificio__cuerpo">
          {cimentacion && <Cimentacion forma={cimentacion.forma} columnas={columnas?.forma} debil={debil("cimentacion")} />}
          <g className="edificio__arriba">
            {columnas && <Columnas forma={columnas.forma} debil={debil("columnas")} />}
            {trabes && <Trabes forma={trabes.forma} debil={debil("trabes")} />}
            {muros && <Muros forma={muros.forma} columnas={columnas?.forma} debil={debil("muros")} />}
            {estado === "regular" && <Grietas />}
          </g>
        </g>

        {estado === "obra" && <Plano etapa={siguiente} />}

        {estado === "malo" && (
          <text x="120" y="182" fontSize="30" textAnchor="middle" className="edificio__polvo" aria-hidden="true">
            💨💥💨
          </text>
        )}
      </svg>
      {estado !== "obra" && estado !== "sismo" && (
        <p className={`edificio__veredicto edificio__veredicto--${estado}`}>
          {estado === "excelente" ? "✅ ¡Aguantó!" : enPie ? "⚠️ Aguantó con daños" : "💥 Se cayó"}
        </p>
      )}
    </div>
  );
}

function describir(piezas, estado) {
  const hechas = Object.keys(piezas).length;
  if (estado === "excelente") return "El edificio aguantó el sismo";
  if (estado === "regular") return "El edificio aguantó el sismo con grietas";
  if (estado === "malo") return "El edificio se cayó con el sismo";
  return `Edificio en construcción: ${hechas} de 5 partes`;
}
