import { useState, useMemo, useRef } from "react";
import { CODIGOS } from "../../data/juegos/retos.js";
import { segundos } from "../../lib/dificultad.js";
import { construirResultado } from "../../lib/recompensas.js";
import { useCronometro } from "../../hooks/useCronometro.js";
import { sonido } from "../../lib/sonido.js";
import { confeti } from "../../lib/confeti.js";
import { MarcoJuego, Cronometro, Progreso, Retroalimentacion } from "../ui/Marco.jsx";

const azar = (n) => Math.floor(Math.random() * n);

/**
 * Código secreto: deducción pura.
 *
 * Hay una combinación oculta de símbolos. El jugador propone y el juego
 * le dice cuántos están en su lugar y cuántos están en la clave pero mal
 * colocados. No hay suerte que valga: se resuelve razonando.
 *
 * Cada caja abierta suelta un dato de seguridad o de medio ambiente.
 */
export default function Codigo({ juego, personaje, dif, onTerminar, onSalir }) {
  const datos = CODIGOS[juego.codigo];

  const largo = dif.id === "facil" ? 3 : 4;
  const cuantosSimbolos = dif.id === "facil" ? 4 : dif.id === "medio" ? 5 : 6;
  const maxIntentos = dif.id === "facil" ? 8 : dif.id === "medio" ? 7 : 6;
  const cajasMeta = dif.id === "facil" ? 1 : dif.id === "medio" ? 2 : 3;
  const totalSegundos = segundos(dif, juego.segundos || 150, 45);

  const simbolos = useMemo(
    () => (datos?.simbolos || []).slice(0, cuantosSimbolos),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [caja, setCaja] = useState(0);
  const [clave, setClave] = useState(() =>
    Array.from({ length: largo }, () => simbolos[azar(simbolos.length)])
  );
  const [propuesta, setPropuesta] = useState([]);
  const [intentos, setIntentos] = useState([]);
  const [retro, setRetro] = useState(null);
  const [activo, setActivo] = useState(true);

  const abiertasRef = useRef(0);
  const intentosTotalRef = useRef(0);
  const cerrado = useRef(false);

  const tiempo = useCronometro({
    activo: activo && !retro,
    segundos: totalSegundos,
    alTerminar: () => cerrar(false),
  });

  function cerrar(completado) {
    if (cerrado.current) return;
    cerrado.current = true;
    setActivo(false);
    onTerminar(
      construirResultado({
        puntos: abiertasRef.current * 120 + Math.round(tiempo * 2),
        aciertos: abiertasRef.current,
        total: cajasMeta,
        dificultad: dif.id,
        vidasIniciales: cajasMeta,
        vidasRestantes: abiertasRef.current,
        completado,
        familia: juego.familia,
        resumen: `Abrió ${abiertasRef.current} de ${cajasMeta} cajas en ${intentosTotalRef.current} intentos.`,
      })
    );
  }

  function pistas(intento) {
    const exactos = intento.filter((s, i) => s === clave[i]).length;
    // símbolos correctos en el lugar equivocado, contando repetidos bien
    const restoClave = clave.filter((s, i) => intento[i] !== s);
    const restoIntento = intento.filter((s, i) => clave[i] !== s);
    let presentes = 0;
    const pila = [...restoClave];
    restoIntento.forEach((s) => {
      const i = pila.indexOf(s);
      if (i >= 0) {
        presentes += 1;
        pila.splice(i, 1);
      }
    });
    return { exactos, presentes };
  }

  function poner(simbolo) {
    if (retro || !activo || propuesta.length >= largo) return;
    sonido.clic();
    setPropuesta((p) => [...p, simbolo]);
  }

  function borrar() {
    if (retro) return;
    sonido.clic();
    setPropuesta((p) => p.slice(0, -1));
  }

  function probar() {
    if (retro || propuesta.length !== largo) return;
    intentosTotalRef.current += 1;
    const p = pistas(propuesta);
    const lista = [...intentos, { simbolos: propuesta, ...p }];
    setIntentos(lista);
    setPropuesta([]);

    if (p.exactos === largo) {
      abiertasRef.current += 1;
      sonido.victoria();
      confeti({ colores: personaje?.colores, cantidad: 70 });
      const info = datos.cajas[caja % datos.cajas.length];
      setRetro({
        correcto: true,
        explicacion: `Abriste ${info.nombre.toLowerCase()}.`,
        dato: info.premio,
        ultima: abiertasRef.current >= cajasMeta,
      });
      return;
    }

    sonido.tic();

    if (lista.length >= maxIntentos) {
      sonido.mal();
      setActivo(false);
      setRetro({
        correcto: false,
        respuestaCorrecta: clave.join(" "),
        explicacion:
          "Se acabaron los intentos. La clave estaba ahí: cada respuesta te decía cuántos símbolos eran correctos y cuántos estaban mal colocados.",
        dato: "En deducción conviene cambiar un solo símbolo a la vez: así sabes exactamente qué causó el cambio.",
        ultima: true,
        perdio: true,
      });
    }
  }

  function continuar() {
    sonido.clic();
    const era = retro;
    setRetro(null);

    if (era.ultima) {
      cerrar(!era.perdio);
      return;
    }
    setCaja((c) => c + 1);
    setClave(Array.from({ length: largo }, () => simbolos[azar(simbolos.length)]));
    setIntentos([]);
    setPropuesta([]);
  }

  if (!datos) return null;

  return (
    <div className="mini mini--codigo">
      <MarcoJuego
        juego={juego}
        dificultad={dif}
        puntos={abiertasRef.current * 120}
        onSalir={onSalir}
        extra={
          <span className="codigo__intentos">
            {intentos.length}/{maxIntentos}
          </span>
        }
      />

      <Cronometro tiempo={tiempo} total={totalSegundos} />
      <Progreso
        hechos={abiertasRef.current}
        total={cajasMeta}
        texto={datos.cajas[caja % datos.cajas.length].nombre}
      />

      {retro ? (
        <div className="quiz__retro">
          <Retroalimentacion
            correcto={retro.correcto}
            respuestaCorrecta={retro.respuestaCorrecta}
            explicacion={retro.explicacion}
            dato={retro.dato}
          />
          <div className="opciones">
            <button className="boton-grande" autoFocus onClick={continuar}>
              {retro.ultima ? "Ver resultado →" : "Siguiente caja 🔐"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="busca__pista">{datos.pista}</p>

          <ul className="codigo__historial" aria-label="Intentos anteriores">
            {intentos.map((it, i) => (
              <li key={i}>
                <span className="codigo__fila" aria-hidden="true">
                  {it.simbolos.join(" ")}
                </span>
                <span className="codigo__pista">
                  <b className="codigo__exacto">{it.exactos} en su lugar</b> ·{" "}
                  {it.presentes} mal colocados
                </span>
              </li>
            ))}
            {intentos.length === 0 && (
              <li className="codigo__vacio">Todavía no has propuesto nada.</li>
            )}
          </ul>

          <div className="codigo__ranura" aria-label="Tu propuesta">
            {Array.from({ length: largo }, (_, i) => (
              <span key={i} className="codigo__hueco">
                {propuesta[i] || "·"}
              </span>
            ))}
          </div>

          <div className="codigo__teclas">
            {simbolos.map((s) => (
              <button key={s} className="ficha ficha--simbolo" onClick={() => poner(s)} aria-label={`Poner ${s}`}>
                {s}
              </button>
            ))}
          </div>

          <div className="opciones opciones--fila">
            <button onClick={borrar} disabled={propuesta.length === 0}>
              ← Borrar
            </button>
            <button className="boton-grande" onClick={probar} disabled={propuesta.length !== largo}>
              Probar 🔐
            </button>
          </div>
        </>
      )}
    </div>
  );
}
