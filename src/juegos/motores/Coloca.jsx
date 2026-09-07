import { useState, useMemo, useRef } from "react";
import { COLOCACIONES } from "../../data/juegos/colocaciones.js";
import { segundos, cuantos } from "../../lib/dificultad.js";
import { construirResultado } from "../../lib/recompensas.js";
import { useCronometro } from "../../hooks/useCronometro.js";
import { sonido } from "../../lib/sonido.js";
import { confeti } from "../../lib/confeti.js";
import { MarcoJuego, Cronometro, Retroalimentacion } from "../ui/Marco.jsx";

/**
 * Motor de "coloca los equipos donde mejor rindan".
 *
 * Lo usan energía solar y energía eólica. El terreno tiene casillas de
 * distinta calidad y el jugador solo tiene unos cuantos equipos, así que
 * la decisión de verdad es dónde NO ponerlos.
 *
 * En fácil las casillas muestran su pista visual; en difícil el jugador
 * tiene que deducirla del paisaje, que es de lo que trata el juego.
 */
export default function Coloca({ juego, personaje, dif, onTerminar, onSalir }) {
  const datos = COLOCACIONES[juego.colocacion];

  const equipos = cuantos(dif, datos?.equipos || 4, 2, 8);
  const totalSegundos = segundos(dif, juego.segundos || 60, 20);
  const muestraPistas = dif.id === "facil";

  const [puestos, setPuestos] = useState([]);
  const [fase, setFase] = useState("colocando"); // colocando | resultado
  const [resumen, setResumen] = useState(null);
  const cerrado = useRef(false);

  const tiempo = useCronometro({
    activo: fase === "colocando",
    segundos: totalSegundos,
    alTerminar: () => evaluar(true),
  });

  const filas = datos?.mapa.length || 0;
  const columnas = datos?.mapa[0]?.length || 0;

  /** Rendimiento teórico máximo con esta cantidad de equipos. */
  const maximo = useMemo(() => {
    if (!datos) return 1;
    const todas = datos.mapa.flat().map((t) => datos.terrenos[t].rinde);
    return todas.sort((a, b) => b - a).slice(0, equipos).reduce((a, b) => a + b, 0) || 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function calcular(lista) {
    let bruto = lista.reduce((a, { f, c }) => a + datos.terrenos[datos.mapa[f][c]].rinde, 0);

    // La estela: dos aerogeneradores en la misma columna se quitan viento.
    let penalizacion = 0;
    if (datos.penalizaColumna) {
      const porColumna = {};
      lista.forEach(({ c }) => {
        porColumna[c] = (porColumna[c] || 0) + 1;
      });
      Object.values(porColumna).forEach((n) => {
        if (n > 1) penalizacion += (n - 1) * 30;
      });
    }
    return { bruto, penalizacion, neto: Math.max(0, bruto - penalizacion) };
  }

  function poner(f, c) {
    if (fase !== "colocando") return;
    const terreno = datos.terrenos[datos.mapa[f][c]];
    const yaEsta = puestos.findIndex((p) => p.f === f && p.c === c);

    if (yaEsta >= 0) {
      sonido.clic();
      setPuestos((p) => p.filter((_, i) => i !== yaEsta));
      return;
    }

    if (terreno.rinde === 0) {
      sonido.mal();
      return;
    }
    if (puestos.length >= equipos) {
      sonido.mal();
      return;
    }

    sonido.moneda();
    const nuevos = [...puestos, { f, c }];
    setPuestos(nuevos);
    if (nuevos.length === equipos) sonido.combo(3);
  }

  function evaluar(porTiempo = false) {
    if (cerrado.current) return;
    const cuentas = calcular(puestos);
    const eficiencia = Math.round((cuentas.neto / maximo) * 100);
    const completado = !porTiempo && puestos.length === equipos && eficiencia >= 60;

    setResumen({ ...cuentas, eficiencia, completado, porTiempo });
    setFase("resultado");
    if (completado) {
      sonido.victoria();
      confeti({ colores: personaje?.colores, cantidad: 90 });
    } else {
      sonido.mal();
    }
  }

  function terminar() {
    if (cerrado.current) return;
    cerrado.current = true;
    onTerminar(
      construirResultado({
        puntos: Math.round(resumen.eficiencia * 5 + tiempo * 2),
        aciertos: Math.round((resumen.eficiencia / 100) * equipos),
        total: equipos,
        dificultad: dif.id,
        vidasIniciales: equipos,
        vidasRestantes: Math.round((resumen.eficiencia / 100) * equipos),
        completado: resumen.completado,
        familia: juego.familia,
        resumen: `Rendimiento del ${resumen.eficiencia}% de lo máximo posible.`,
      })
    );
  }

  if (!datos) return null;

  const produccion = calcular(puestos);

  return (
    <div className="mini mini--coloca">
      <MarcoJuego
        juego={juego}
        dificultad={dif}
        puntos={Math.round(produccion.neto * datos.factor)}
        onSalir={onSalir}
        extra={
          <span className="coloca__cuenta">
            {datos.unidad} {puestos.length}/{equipos}
          </span>
        }
      />

      <Cronometro tiempo={fase === "colocando" ? tiempo : 0} total={totalSegundos} />

      <p className="busca__pista">
        <strong>{datos.titulo}.</strong> {datos.pista}
      </p>

      <div className="tablero-zona">
        <div
          className="terreno tablero-ajustable"
          style={{ "--columnas": columnas, "--filas": filas }}
          role="grid"
          aria-label={`Terreno de ${filas} por ${columnas}`}
        >
        {datos.mapa.map((fila, f) =>
          fila.map((clave, c) => {
            const t = datos.terrenos[clave];
            const puesto = puestos.some((p) => p.f === f && p.c === c);
            return (
              <button
                key={`${f}-${c}`}
                className={`terreno__celda ${puesto ? "terreno__celda--puesto" : ""}`}
                style={{ background: t.color }}
                onClick={() => poner(f, c)}
                disabled={fase !== "colocando"}
                aria-label={`${t.nombre}${puesto ? `, con ${datos.nombreUnidad}` : ""}`}
                title={muestraPistas ? t.nombre : undefined}
              >
                <span aria-hidden="true">{puesto ? datos.unidad : t.icono}</span>
                {muestraPistas && !puesto && t.rinde > 0 && (
                  <small className="terreno__rinde">{t.rinde}%</small>
                )}
              </button>
            );
          })
          )}
        </div>
      </div>

      {fase === "colocando" ? (
        <div className="opciones">
          <button
            className="boton-grande"
            onClick={() => evaluar(false)}
            disabled={puestos.length === 0}
          >
            {puestos.length < equipos
              ? `Faltan ${equipos - puestos.length} · Probar así`
              : "Poner en marcha ⚡"}
          </button>
          <p className="mini__texto mini__texto--chico coloca__ayuda">
            Toca una casilla para colocar y vuelve a tocarla para quitar.
          </p>
        </div>
      ) : (
        <div className="quiz__retro">
          <div className="coloca__marcador">
            <b>{Math.round(produccion.neto * datos.factor)}</b> {datos.medida}
            <span> · {resumen.eficiencia}% de lo máximo posible</span>
            {resumen.penalizacion > 0 && (
              <span className="coloca__penal">
                Perdiste rendimiento por poner equipos en la misma línea de viento.
              </span>
            )}
          </div>
          <Retroalimentacion
            correcto={resumen.completado}
            respuestaCorrecta={
              resumen.completado
                ? null
                : resumen.porTiempo
                  ? "Se acabó el tiempo antes de terminar la instalación."
                  : "El mejor lugar era donde el rendimiento del terreno es más alto."
            }
            explicacion={datos.lecciones[0]}
            dato={datos.lecciones[Math.min(1, datos.lecciones.length - 1)]}
          />
          <div className="opciones">
            <button className="boton-grande" autoFocus onClick={terminar}>
              Ver recompensa →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
