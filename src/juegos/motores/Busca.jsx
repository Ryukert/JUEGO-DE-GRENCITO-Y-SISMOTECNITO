import { useState, useMemo, useRef } from "react";
import { ESCENAS } from "../../data/juegos/escenas.js";
import { segundos, cuantos } from "../../lib/dificultad.js";
import { construirResultado, puntosAcierto } from "../../lib/recompensas.js";
import { useCronometro, useTemporizadores } from "../../hooks/useCronometro.js";
import { sonido } from "../../lib/sonido.js";
import { confeti } from "../../lib/confeti.js";
import { MarcoJuego, Cronometro, Progreso, Retroalimentacion, Aviso } from "../ui/Marco.jsx";

const revolver = (lista) => [...lista].sort(() => Math.random() - 0.5);

/**
 * Motor de "encuentra los N objetos en la escena".
 *
 * Sirve para casa segura, escuela segura, detective de riesgos, repara la
 * fuga, apaga las luces y limpia el río: el motor no sabe de qué trata,
 * solo sabe que hay objetos `objetivo` y objetos que no lo son.
 *
 * La dificultad cambia cuántos objetivos hay que encontrar, cuánto tiempo
 * hay y con cuántas vidas se arranca. Tocar un objeto que no es objetivo
 * cuesta una vida y explica por qué no lo es: también se aprende de ahí.
 */
export default function Busca({ juego, personaje, dif, onTerminar, onSalir }) {
  const enTiempo = useTemporizadores();

  const escena = useMemo(() => {
    const lista = ESCENAS[juego.escenas] || [];
    return lista[Math.floor(Math.random() * lista.length)] || null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Los objetivos se recortan según la dificultad; los distractores siempre
  // se muestran todos para que la escena no se sienta vacía en fácil.
  const objetos = useMemo(() => {
    if (!escena) return [];
    const objetivos = escena.objetos.filter((o) => o.objetivo);
    const otros = escena.objetos.filter((o) => !o.objetivo);
    const cuantosBuscar = Math.min(
      objetivos.length,
      cuantos(dif, juego.objetivos || 5, 3, objetivos.length)
    );
    return [...revolver(objetivos).slice(0, cuantosBuscar), ...otros];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escena]);

  const meta = objetos.filter((o) => o.objetivo).length;
  const totalSegundos = segundos(dif, juego.segundos || 55, 15);

  const [hallados, setHallados] = useState([]);
  const [errados, setErrados] = useState([]);
  const [vidas, setVidas] = useState(dif.vidas);
  const [puntos, setPuntos] = useState(0);
  const [retro, setRetro] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [activo, setActivo] = useState(true);

  const puntosRef = useRef(0);
  const vidasRef = useRef(dif.vidas);
  const halladosRef = useRef(0);
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
        puntos: puntosRef.current,
        aciertos: halladosRef.current,
        total: meta,
        dificultad: dif.id,
        vidasIniciales: dif.vidas,
        vidasRestantes: vidasRef.current,
        completado,
        familia: juego.familia,
        resumen: `Encontró ${halladosRef.current} de ${meta}.`,
      })
    );
  }

  function mostrarAviso(texto, tipo) {
    setAviso({ texto, tipo });
    enTiempo(() => setAviso(null), 900);
  }

  function tocar(obj) {
    if (!activo || retro) return;
    if (hallados.includes(obj.id) || errados.includes(obj.id)) return;

    if (obj.objetivo) {
      halladosRef.current += 1;
      const ganados = puntosAcierto({ base: 25, tiempo, factorTiempo: 1, racha: 0 });
      puntosRef.current += ganados;
      setPuntos(puntosRef.current);
      setHallados((h) => [...h, obj.id]);
      sonido.moneda();
      mostrarAviso(`+${ganados} · ${obj.nombre}`, "bien");

      if (halladosRef.current >= meta) {
        // bono por el tiempo que sobró
        const bono = Math.round(tiempo * 3);
        puntosRef.current += bono;
        setPuntos(puntosRef.current);
        setActivo(false);
        confeti({ colores: personaje?.colores, cantidad: 90 });
        enTiempo(() => cerrar(true), 900);
        return;
      }

      setRetro({
        correcto: true,
        titulo: obj.nombre,
        explicacion: obj.explicacion,
        dato: obj.dato,
        ganados,
      });
      return;
    }

    // no era objetivo
    setErrados((e) => [...e, obj.id]);
    vidasRef.current -= 1;
    setVidas(vidasRef.current);
    sonido.mal();

    if (vidasRef.current <= 0) {
      setActivo(false);
      enTiempo(() => cerrar(false), 900);
      mostrarAviso("Se acabaron las vidas", "mal");
      return;
    }

    setRetro({
      correcto: false,
      titulo: obj.nombre,
      explicacion: obj.explicacion || "Eso no es lo que buscas aquí.",
      dato: obj.dato,
      respuestaCorrecta: `Sigue buscando: te faltan ${meta - halladosRef.current}.`,
    });
  }

  if (!escena) return null;

  return (
    <div className="mini mini--busca">
      <MarcoJuego
        juego={juego}
        dificultad={dif}
        vidas={vidas}
        vidasMax={dif.vidas}
        puntos={puntos}
        onSalir={onSalir}
      />

      <Cronometro tiempo={tiempo} total={totalSegundos} />
      <Progreso
        hechos={hallados.length}
        total={meta}
        texto={`${hallados.length} / ${meta} ${juego.verbo || "encontrados"}`}
      />

      <p className="busca__pista">
        <strong>{escena.titulo}.</strong> {escena.pista}
      </p>

      <div className="tablero-zona">
        <div
          className="escena"
          style={{ "--escena-cielo": escena.cielo, "--escena-piso": escena.piso }}
        >
        {objetos.map((o) => {
          const encontrado = hallados.includes(o.id);
          const fallado = errados.includes(o.id);
          return (
            <button
              key={o.id}
              className={`escena__obj ${encontrado ? "escena__obj--ok" : ""} ${
                fallado ? "escena__obj--no" : ""
              }`}
              style={{ left: `${o.x}%`, top: `${o.y}%` }}
              onClick={() => tocar(o)}
              disabled={encontrado || fallado || !activo}
              aria-label={o.nombre}
              title={o.nombre}
            >
              <span aria-hidden="true">{o.icono}</span>
              {encontrado && <span className="escena__marca" aria-hidden="true">✓</span>}
              {fallado && <span className="escena__marca escena__marca--no" aria-hidden="true">✕</span>}
            </button>
          );
          })}
        </div>
      </div>

      {retro && (
        <div className="busca__retro">
          <Retroalimentacion
            correcto={retro.correcto}
            respuestaCorrecta={retro.respuestaCorrecta}
            explicacion={`${retro.titulo}. ${retro.explicacion}`}
            dato={retro.dato}
            ganados={retro.ganados}
          />
          <div className="opciones">
            <button
              className="boton-grande"
              autoFocus
              onClick={() => {
                sonido.clic();
                setRetro(null);
              }}
            >
              Seguir buscando →
            </button>
          </div>
        </div>
      )}

      <Aviso aviso={aviso} />
    </div>
  );
}
