import { useState } from "react";
import { PERSONAJES, GRADOS } from "../data/personajes.js";
import { rangoPara } from "../lib/progreso.js";
import { sonido } from "../lib/sonido.js";

export default function Portada({ progreso, onElegir }) {
  const [grado, setGrado] = useState(progreso.grado || null);

  function elegirGrado(id) {
    sonido.despertar();
    sonido.clic();
    setGrado(id);
  }

  if (!grado) {
    return (
      <div className="pantalla portada">
        <div className="portada__duo" aria-hidden="true">
          <img className="portada__mini flota" src={PERSONAJES.sismo.cuerpo} alt="" />
          <img className="portada__mini flota flota--tarde" src={PERSONAJES.green.cuerpo} alt="" />
        </div>
        <header className="portada__intro">
          <h1>Escuadrón Tecnito y Greencito</h1>
          <p>Cuatro misiones, tres vidas y un cronómetro. ¿En qué grado vas?</p>
        </header>

        <div className="grados">
          {Object.values(GRADOS).map((g) => (
            <button key={g.id} className="grado" onClick={() => elegirGrado(g.id)}>
              <span className="grado__icono" aria-hidden="true">{g.icono}</span>
              <strong>{g.nombre}</strong>
              <span className="grado__edades">{g.edades}</span>
              <span className="grado__detalle">
                {g.segundos} s por pregunta
                {g.retoExtra ? " · preguntas de bonificación" : ""}
              </span>
            </button>
          ))}
        </div>

        <p className="portada__pie">
          Puedes cambiar de grado cuando quieras. Secundaria tiene menos tiempo,
          un distractor más y retos que valen doble.
        </p>
      </div>
    );
  }

  return (
    <div className="pantalla portada">
      <header className="portada__intro">
        <button className="volver" onClick={() => setGrado(null)}>← Cambiar grado</button>
        <h1>¿Con quién juegas?</h1>
        <p>Modo {GRADOS[grado].nombre}. Cada partida son cuatro misiones seguidas.</p>
      </header>

      <div className="cartas">
        {Object.values(PERSONAJES).map((p) => {
          const record = progreso.records[p.id] || 0;
          const rango = rangoPara(record);
          return (
            <button
              key={p.id}
              className={`carta carta--${p.id}`}
              onClick={() => {
                sonido.clic();
                onElegir(p.id, grado);
              }}
            >
              <img className="carta__figura flota" src={p.cuerpo} alt={p.nombre} />
              <h2>{p.nombre}</h2>
              <p>{p.resumen}</p>
              <span className="carta__record">
                {record > 0
                  ? `${rango.icono} Récord: ${record} ${p.moneda}`
                  : "Sin récord todavía"}
              </span>
              <span className="carta__cta">Jugar</span>
            </button>
          );
        })}
      </div>

      <p className="portada__pie">
        Misiones de preguntas contra reloj + un minijuego de acción por
        personaje. Responde rápido y encadena aciertos para multiplicar puntos.
      </p>
    </div>
  );
}
