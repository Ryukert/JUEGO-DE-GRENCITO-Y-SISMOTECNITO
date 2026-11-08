import TareaAlumno from "./TareaAlumno.jsx";
import { pendientesDeRepaso } from "../lib/repaso.js";
import { useState } from "react";
import { PERSONAJES, GRADOS } from "../data/personajes.js";
import { rangoPara } from "../lib/progreso.js";
import { sonido } from "../lib/sonido.js";
import Creditos from "./Creditos.jsx";
import { JUEGOS } from "../juegos/registro.js";
import Icono, { ICONO_GRADO } from "./Icono.jsx";
import BotonTema from "./BotonTema.jsx";
import { IconoRango } from "./IconoJuego.jsx";
import TarjetaNombre from "./TarjetaNombre.jsx";

/* Los números de la portada salen del contenido: si se agrega una misión o un juego, se actualizan solos. */
const EN_LETRA = ["cero", "una", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez"];
const enLetra = (n) => EN_LETRA[n] || String(n);
const MISIONES = PERSONAJES.sismo.misiones.length;
const VIDAS = GRADOS.primaria.vidas;

/** Arriba de la portada: Mis logros y Mi grupo a la izquierda; tema y ajustes a la derecha. */
function Barra({ onLogros, onAjustes, onGrupo, cuenta, jugador, onQuien, tema, onTema }) {
  return (
    <nav className="portada__barra" aria-label="Opciones">
      <span className="portada__barra-izq">
        {onQuien && (
          <button
            className="boton-chico portada__quien"
            onClick={onQuien}
            aria-label={jugador ? `Juega ${jugador.nombre}, ID ${jugador.id}. Cambiar de jugador` : "¿Quién juega? Escribe tu nombre"}
          >
            <Icono nombre="grupo" />
            {jugador ? (
              <>
                {jugador.nombre} <small className="quien__id">{jugador.id}</small>
              </>
            ) : (
              "¿Quién juega?"
            )}
          </button>
        )}
        {onLogros && (
          <button className="boton-chico" onClick={onLogros}>
            <Icono nombre="trofeo" /> Mis logros
          </button>
        )}
        {onGrupo && (
          <button className="boton-chico" onClick={onGrupo}>
            <Icono nombre="grupo" /> {cuenta ? cuenta.alumno.apodo : "Mi grupo"}
          </button>
        )}
      </span>
      <span className="portada__barra-der">
        <BotonTema tema={tema} onTema={onTema} />
        {onAjustes && (
          <button className="boton-tema" onClick={onAjustes} aria-label="Ajustes" title="Ajustes">
            <Icono nombre="engrane" />
          </button>
        )}
      </span>
    </nav>
  );
}

export default function Portada({ progreso, ultimo, onElegir, onCentro, onLogros, onAjustes, onGrupo, cuenta, jugador, onQuien, tema, onTema, onRepaso, onJugar }) {
  const [grado, setGrado] = useState(progreso.grado || null);
  const barra = (
    <Barra
      onLogros={onLogros} onAjustes={onAjustes} onGrupo={onGrupo} cuenta={cuenta}
      jugador={jugador} onQuien={onQuien} tema={tema} onTema={onTema}
    />
  );
  // tarjeta grande para escribir el nombre (no aparece si el alumno entró con cuenta de grupo)
  const nombre = onQuien ? <TarjetaNombre jugador={jugador} onVerTodos={onQuien} /> : null;
  const quienSigue = ultimo && PERSONAJES[ultimo.personaje] && GRADOS[ultimo.grado] ? ultimo : null;
  // tarea del maestro (solo con cuenta de grupo) y preguntas que quedan por repasar
  const tarea = cuenta?.grupo?.tarea && onJugar ? (
    <TareaAlumno tarea={cuenta.grupo.tarea} progreso={progreso} onJugar={onJugar} />
  ) : null;
  const porRepasar = pendientesDeRepaso(progreso).length;
  const repaso = porRepasar > 0 && onRepaso ? (
    <button className="boton-repaso" onClick={onRepaso}>
      <Icono nombre="foco" /> Repasar lo que fallé
      <span className="boton-repaso__cuenta">{porRepasar} {porRepasar === 1 ? "pregunta" : "preguntas"}</span>
    </button>
  ) : null;

  function elegirGrado(id) {
    sonido.despertar();
    sonido.clic();
    setGrado(id);
  }

  if (!grado) {
    return (
      <div className="pantalla portada">
        {barra}
        {nombre}
        {tarea}
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
        {repaso}

        <p className="portada__pie">
          Secundaria tiene menos tiempo y retos dobles. En el Centro hay {JUEGOS.length} minijuegos sueltos.
        </p>

        <Creditos />
      </div>
    );
  }

  return (
    <div className="pantalla portada">
      {barra}
      {nombre}
      {tarea}
      {quienSigue && (
        <button
          className={`seguir seguir--${quienSigue.personaje}`}
          onClick={() => {
            sonido.despertar();
            sonido.clic();
            onElegir(quienSigue.personaje, quienSigue.grado);
          }}
        >
          <img className="seguir__cara" src={PERSONAJES[quienSigue.personaje].cara} alt="" width="56" height="56" />
          <span className="seguir__texto">
            <small>¡Hola de nuevo!</small>
            <strong>Seguir con {PERSONAJES[quienSigue.personaje].nombre}</strong>
            <small>{GRADOS[quienSigue.grado].nombre}</small>
          </span>
          <Icono nombre="siguiente" className="seguir__flecha" />
        </button>
      )}
      <header className="portada__intro">
        <button className="volver" onClick={() => setGrado(null)}><Icono nombre="volver" /> Cambiar grado</button>
        <h1>{quienSigue ? "O elige otra partida" : "¿Con quién juegas?"}</h1>
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
      {repaso}

      <p className="portada__pie">
        Preguntas contra reloj y minijuegos. Encadena aciertos para multiplicar tus puntos.
      </p>

      <Creditos />
    </div>
  );
}
