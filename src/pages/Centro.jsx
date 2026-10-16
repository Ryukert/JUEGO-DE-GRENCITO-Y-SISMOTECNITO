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
import Icono, { ICONO_FAMILIA, iconoMoneda } from "../components/Icono.jsx";
import BotonTema from "../components/BotonTema.jsx";

/**
 * Centro de entrenamiento: el mapa de minijuegos.
 *
 * Tres pestañas (Tecnito, Greencito, Desafíos), cada una agrupada por
 * categoría. Las tarjetas son compactas (icono, nombre, dificultades hechas
 * y récord) para que una pestaña quepa en pocas pantallas; la descripción y
 * el cómo se juega están en la pantalla de inicio de cada juego.
 */
export default function Centro({ progreso, onJugar, onSalir, tema, onTema }) {
  const [familia, setFamilia] = useState("tecnito");

  const rango = rangoPara(progreso.xp || 0);
  const siguiente = useMemo(() => siguienteEnDesbloquear(progreso), [progreso]);
  const categorias = useMemo(() => categoriasDe(familia), [familia]);

  const desbloqueados = JUEGOS.filter((j) => estaDesbloqueado(j, progreso)).length;

  return (
    <div className="pantalla centro">
      <header className="centro__cabeza">
        <div className="centro__barra">
          <button className="volver" onClick={onSalir}>
            <Icono nombre="volver" /> Inicio
          </button>
          <BotonTema tema={tema} onTema={onTema} />
        </div>
        <h1>
          <Icono nombre="control" /> Centro de entrenamiento
        </h1>
        <p className="centro__resumen">
          {desbloqueados} de {JUEGOS.length} retos disponibles
        </p>

        <div className="cartera" aria-label="Tu progreso">
          <span className="cartera__dato">
            <b aria-hidden="true">{rango.icono}</b> {rango.nombre}
          </span>
          <span className="cartera__dato">
            <Icono nombre="estrella" /> {progreso.xp || 0} XP
          </span>
          <span className="cartera__dato" aria-label={`${progreso.escudos || 0} escudos`}>
            <Icono nombre="escudo" /> {progreso.escudos || 0}
          </span>
          <span className="cartera__dato" aria-label={`${progreso.semillas || 0} semillas`}>
            <Icono nombre="brote" /> {progreso.semillas || 0}
          </span>
        </div>

        {siguiente && (
          <p className="centro__siguiente">
            <Icono nombre="candado" /> Te faltan {siguiente.xp - (progreso.xp || 0)} XP para{" "}
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
            <Icono nombre={ICONO_FAMILIA[f.id]} /> {f.nombre}
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
        Tu progreso se guarda en este navegador.
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
  const moneda = iconoMoneda(FAMILIAS[juego.familia].moneda);

  return (
    <button
      className={`tarjeta ${abierto ? "" : "tarjeta--bloqueada"}`}
      onClick={abierto ? onJugar : undefined}
      disabled={!abierto}
      title={abierto ? juego.descripcion : undefined}
      aria-label={
        abierto
          ? `Jugar ${juego.nombre}. ${juego.descripcion}`
          : `${juego.nombre}, bloqueado. Necesitas ${juego.xp} XP`
      }
    >
      <span className="tarjeta__icono" aria-hidden="true">
        <span className="tarjeta__emoji">{juego.icono}</span>
        {!abierto && <Icono nombre="candado" className="tarjeta__candado" />}
      </span>

      <strong className="tarjeta__nombre">{juego.nombre}</strong>

      <span className="tarjeta__pie" aria-hidden="true">
        {abierto ? (
          <>
            <span className="tarjeta__dif">
              {dificultades.map((d) => (
                <i key={d.id} className={`punto-dif punto-dif--${d.id} ${hechas.includes(d.id) ? "hecha" : ""}`} />
              ))}
            </span>
            {record > 0 ? (
              <span className="tarjeta__record">
                <Icono nombre="trofeo" /> {record}
              </span>
            ) : (
              <Icono nombre={moneda} className="tarjeta__premio" />
            )}
          </>
        ) : (
          <span className="tarjeta__xp">{juego.xp} XP</span>
        )}
      </span>
    </button>
  );
}
