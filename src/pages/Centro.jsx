import { useState, useMemo } from "react";
import {
  JUEGOS,
  FAMILIAS,
  categoriasDe,
  estaDesbloqueado,
  siguienteEnDesbloquear,
} from "../juegos/registro.js";
import { recordDeJuego, rangoPara } from "../lib/progreso.js";
import { LISTA_DIFICULTADES } from "../lib/dificultad.js";
import { sonido } from "../lib/sonido.js";
import Creditos from "../components/Creditos.jsx";

/**
 * Centro de entrenamiento: el mapa de minijuegos.
 *
 * Tres pestañas (Tecnito, Greencito, Desafíos), cada una agrupada por
 * categoría. Cada tarjeta muestra icono, nombre, descripción, dificultades,
 * récord, recompensa y si está bloqueado.
 */
export default function Centro({ progreso, onJugar, onSalir }) {
  const [familia, setFamilia] = useState("tecnito");

  const rango = rangoPara(progreso.xp || 0);
  const siguiente = useMemo(() => siguienteEnDesbloquear(progreso), [progreso]);
  const categorias = useMemo(() => categoriasDe(familia), [familia]);

  const desbloqueados = JUEGOS.filter((j) => estaDesbloqueado(j, progreso)).length;

  return (
    <div className="pantalla centro">
      <header className="centro__cabeza">
        <button className="volver" onClick={onSalir}>
          ← Inicio
        </button>
        <h1>🎮 Centro de entrenamiento</h1>
        <p className="centro__resumen">
          {desbloqueados} de {JUEGOS.length} retos disponibles
        </p>

        <div className="cartera" aria-label="Tu progreso">
          <span className="cartera__dato">
            <b>{rango.icono}</b> {rango.nombre}
          </span>
          <span className="cartera__dato">
            <b>⭐</b> {progreso.xp || 0} XP
          </span>
          <span className="cartera__dato">
            <b>🛡️</b> {progreso.escudos || 0}
          </span>
          <span className="cartera__dato">
            <b>🌱</b> {progreso.semillas || 0}
          </span>
        </div>

        {siguiente && (
          <p className="centro__siguiente">
            Te faltan {siguiente.xp - (progreso.xp || 0)} XP para desbloquear{" "}
            <strong>
              {siguiente.icono} {siguiente.nombre}
            </strong>
          </p>
        )}
      </header>

      <nav className="pestanas" role="tablist" aria-label="Categorías de minijuegos">
        {Object.values(FAMILIAS).map((f) => (
          <button
            key={f.id}
            role="tab"
            aria-selected={familia === f.id}
            className={`pestana pestana--${f.id} ${familia === f.id ? "pestana--on" : ""}`}
            onClick={() => {
              sonido.clic();
              setFamilia(f.id);
            }}
          >
            <span aria-hidden="true">{f.icono}</span> {f.nombre}
          </button>
        ))}
      </nav>

      <div className="centro__lista">
        {categorias.map((cat) => (
          <section key={cat} className="categoria">
            <h2 className="categoria__titulo">{cat}</h2>
            <div className="tarjetas">
              {JUEGOS.filter((j) => j.familia === familia && j.categoria === cat).map((j) => (
                <TarjetaJuego
                  key={j.id}
                  juego={j}
                  progreso={progreso}
                  onJugar={() => {
                    sonido.clic();
                    onJugar(j.id);
                  }}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="portada__pie centro__pie">
        Tu progreso se guarda solo en este navegador. Los récords, la XP, los
        escudos y las semillas no se reinician al cerrar la página.
      </p>

      <Creditos variante="compacto" />
    </div>
  );
}

function TarjetaJuego({ juego, progreso, onJugar }) {
  const abierto = estaDesbloqueado(juego, progreso);
  const record = recordDeJuego(progreso, juego.id);
  const hechas = progreso?.juegos?.[juego.id]?.dificultades || [];
  const dificultades = juego.dificultades
    ? LISTA_DIFICULTADES.filter((d) => juego.dificultades.includes(d.id))
    : LISTA_DIFICULTADES;
  const moneda = FAMILIAS[juego.familia].monedaIcono;

  return (
    <button
      className={`tarjeta ${abierto ? "" : "tarjeta--bloqueada"}`}
      onClick={abierto ? onJugar : undefined}
      disabled={!abierto}
      aria-label={
        abierto
          ? `Jugar ${juego.nombre}`
          : `${juego.nombre}, bloqueado. Necesitas ${juego.xp} XP`
      }
    >
      <span className="tarjeta__icono" aria-hidden="true">
        {abierto ? juego.icono : "🔒"}
      </span>

      <span className="tarjeta__cuerpo">
        <strong className="tarjeta__nombre">{juego.nombre}</strong>
        <span className="tarjeta__desc">
          {abierto ? juego.descripcion : `Se abre con ${juego.xp} XP`}
        </span>

        <span className="tarjeta__pie">
          <span className="tarjeta__dif" aria-hidden="true">
            {dificultades.map((d) => (
              <i key={d.id} className={hechas.includes(d.id) ? "hecha" : ""}>
                {d.icono}
              </i>
            ))}
          </span>
          {record > 0 ? (
            <span className="tarjeta__record">🏆 {record}</span>
          ) : (
            <span className="tarjeta__record tarjeta__record--vacio">sin récord</span>
          )}
          <span className="tarjeta__premio" aria-hidden="true">
            {moneda}
          </span>
        </span>
      </span>
    </button>
  );
}
