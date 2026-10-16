import { useState } from "react";
import { PERSONAJES, GRADOS } from "../data/personajes.js";
import { rangoPara } from "../lib/progreso.js";
import { sonido } from "../lib/sonido.js";
import Creditos from "./Creditos.jsx";
import { JUEGOS } from "../juegos/registro.js";
import Icono, { ICONO_GRADO } from "./Icono.jsx";
import BotonTema from "./BotonTema.jsx";
import { IconoRango } from "./IconoJuego.jsx";

/* Los números de la portada salen del contenido: si se agrega una misión o un juego, se actualizan solos. */
const EN_LETRA = ["cero", "una", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez"];
const enLetra = (n) => EN_LETRA[n] || String(n);
const MISIONES = PERSONAJES.sismo.misiones.length;
const VIDAS = GRADOS.primaria.vidas;

export default function Portada({ progreso, onElegir, onCentro, tema, onTema }) {
  const [grado, setGrado] = useState(progreso.grado || null);

  function elegirGrado(id) {
    sonido.despertar();
    sonido.clic();
    setGrado(id);
  }

  if (!grado) {
    return (
      <div className="pantalla portada">
        <BotonTema tema={tema} onTema={onTema} />
        <div className="portada__duo" aria-hidden="true">
          <img className="portada__mini flota" src={PERSONAJES.sismo.cuerpo} alt="" />
          <img className="portada__mini flota flota--tarde" src={PERSONAJES.green.cuerpo} alt="" />
        </div>
        <header className="portada__intro">
          <h1>Escuadrón Tecnito y Greencito</h1>
          <p>{enLetra(MISIONES).replace(/^./, (c) => c.toUpperCase())} misiones, {enLetra(VIDAS)} vidas y un cronómetro. ¿En qué grado vas?</p>
        </header>

        <div className="grados">
          {Object.values(GRADOS).map((g) => (
            <button key={g.id} className="grado" onClick={() => elegirGrado(g.id)}>
              <span className="grado__icono" aria-hidden="true"><Icono nombre={ICONO_GRADO[g.id]} /></span>
              <strong>{g.nombre}</strong>
              <span className="grado__edades">{g.edades}</span>
              <span className="grado__detalle">
                {g.segundos} s por pregunta
                {g.retoExtra ? " · preguntas de bonificación" : ""}
              </span>
            </button>
          ))}
        </div>

        <button className="boton-centro" onClick={onCentro}>
          <Icono nombre="control" /> Centro de entrenamiento
        </button>

        <p className="portada__pie">
          Puedes cambiar de grado cuando quieras. Secundaria tiene menos tiempo,
          un distractor más y retos que valen doble. En el Centro de
          entrenamiento hay {JUEGOS.length} minijuegos sueltos.
        </p>

        <Creditos />
      </div>
    );
  }

  return (
    <div className="pantalla portada">
      <BotonTema tema={tema} onTema={onTema} />
      <header className="portada__intro">
        <button className="volver" onClick={() => setGrado(null)}><Icono nombre="volver" /> Cambiar grado</button>
        <h1>¿Con quién juegas?</h1>
        <p>Modo {GRADOS[grado].nombre}. Cada partida son {enLetra(MISIONES)} misiones seguidas.</p>
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
                {record > 0 ? (
                  <>
                    <IconoRango rango={rango} /> Récord: {record} {p.moneda}
                  </>
                ) : (
                  "Sin récord todavía"
                )}
              </span>
              <span className="carta__cta">Jugar <Icono nombre="siguiente" /></span>
            </button>
          );
        })}
      </div>

      <button className="boton-centro" onClick={onCentro}>
        <Icono nombre="control" /> Centro de entrenamiento
      </button>

      <p className="portada__pie">
        Misiones de preguntas contra reloj + un minijuego de acción por
        personaje. Responde rápido y encadena aciertos para multiplicar puntos.
      </p>

      <Creditos />
    </div>
  );
}
