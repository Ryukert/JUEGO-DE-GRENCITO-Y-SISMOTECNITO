/**
 * El reloj de todo el juego: barra gruesa y número grande que pasa de verde a
 * amarillo (mitad del tiempo) y a rojo (los últimos segundos, vibra). Lo usan
 * las misiones, los minijuegos de las misiones y los 46 del Centro.
 */
export default function Reloj({ tiempo, total, etiqueta = true }) {
  const porcentaje = total > 0 ? Math.max(0, Math.min(100, (tiempo / total) * 100)) : 0;
  // con tiempos cortos (5 s por pieza) el rojo llega al último 30 %, no a los 5 s
  const nivel = tiempo <= 0 ? "fin" : tiempo <= Math.min(5, total * 0.3) ? "rojo" : porcentaje <= 50 ? "amarillo" : "verde";
  const segundos = Math.max(0, Math.ceil(tiempo));
  return (
    <div className={`reloj reloj--${nivel}`} role="timer" aria-label={`Quedan ${segundos} segundos`}>
      <div className="reloj__pista" aria-hidden="true">
        <div className="reloj__barra" style={{ width: `${porcentaje}%` }} />
      </div>
      {etiqueta && (
        <span className="reloj__numero" aria-hidden="true">
          <b>{segundos}</b>
          <small>s</small>
        </span>
      )}
    </div>
  );
}
