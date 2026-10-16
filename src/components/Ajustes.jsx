import { useState, useEffect, useRef } from "react";
import Icono from "./Icono.jsx";

/**
 * Ajustes en un solo lugar: sonido, tema, letra grande, menos animaciones,
 * vibración, volver a ver el tutorial, instalar la app y borrar el progreso.
 */
function Interruptor({ id, etiqueta, detalle, activo, onCambiar }) {
  return (
    <div className="ajuste">
      <span className="ajuste__texto">
        <span id={id}>{etiqueta}</span>
        {detalle && <small>{detalle}</small>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={activo}
        aria-labelledby={id}
        className={`interruptor ${activo ? "interruptor--on" : ""}`}
        onClick={onCambiar}
      >
        <span className="interruptor__bolita" />
      </button>
    </div>
  );
}

export default function Ajustes({
  sonidoOn,
  onSonido,
  tema,
  onTema,
  preferencias,
  onPreferencia,
  onTutorial,
  onBorrar,
  instalar,
  onCerrar,
}) {
  const [confirmar, setConfirmar] = useState(false);
  const [borrado, setBorrado] = useState(false);
  const cerrarRef = useRef(null);
  const puedeVibrar = typeof navigator !== "undefined" && "vibrate" in navigator;

  useEffect(() => {
    cerrarRef.current?.focus();
    const alTeclear = (e) => e.key === "Escape" && onCerrar();
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [onCerrar]);

  return (
    <div className="ajustes-fondo" onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="ajustes" role="dialog" aria-modal="true" aria-labelledby="ajustes-titulo">
        <header className="ajustes__cabeza">
          <h2 id="ajustes-titulo">
            <Icono nombre="engrane" /> Ajustes
          </h2>
          <button className="ajustes__cerrar" onClick={onCerrar} ref={cerrarRef} aria-label="Cerrar ajustes">
            <Icono nombre="mal" />
          </button>
        </header>

        <Interruptor id="aj-sonido" etiqueta="Sonido" activo={sonidoOn} onCambiar={onSonido} />
        <Interruptor id="aj-tema" etiqueta="Tema oscuro" activo={tema === "oscuro"} onCambiar={onTema} />
        <Interruptor
          id="aj-letra"
          etiqueta="Letra grande"
          detalle="Para leer más fácil"
          activo={preferencias.letraGrande}
          onCambiar={() => onPreferencia("letraGrande", !preferencias.letraGrande)}
        />
        <Interruptor
          id="aj-mov"
          etiqueta="Menos animaciones"
          detalle="Sin confeti ni temblores"
          activo={preferencias.menosMovimiento}
          onCambiar={() => onPreferencia("menosMovimiento", !preferencias.menosMovimiento)}
        />
        {puedeVibrar && (
          <Interruptor
            id="aj-vib"
            etiqueta="Vibración"
            detalle="Al acertar y al fallar"
            activo={preferencias.vibracion}
            onCambiar={() => onPreferencia("vibracion", !preferencias.vibracion)}
          />
        )}

        <div className="ajustes__acciones">
          <button onClick={onTutorial}>
            <Icono nombre="foco" /> Ver la explicación otra vez
          </button>
          {instalar && (
            <button onClick={instalar}>
              <Icono nombre="descargar" /> Instalar el juego
            </button>
          )}
        </div>

        <div className="ajustes__peligro">
          {borrado ? (
            <p role="status">Listo: el progreso se borró.</p>
          ) : confirmar ? (
            <>
              <p>¿Seguro? Se borran récords, XP, escudos, semillas y medallas.</p>
              <div className="ajustes__fila">
                <button
                  className="ajustes__borrar"
                  onClick={() => {
                    onBorrar();
                    setBorrado(true);
                  }}
                >
                  Sí, borrar todo
                </button>
                <button onClick={() => setConfirmar(false)}>Cancelar</button>
              </div>
            </>
          ) : (
            <button className="ajustes__borrar-1" onClick={() => setConfirmar(true)}>
              Borrar mi progreso
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
