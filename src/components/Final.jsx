export default function Final({ personaje: p, puntos, insignias, onRepetir, onInicio }) {
  const otro = p.id === "sismo" ? "Greencito" : "Sismo Tecnito";

  return (
    <div className="pantalla final">
      <img className="final__figura flota" src={p.cuerpo} alt={p.nombre} />
      <h2>¡Misiones completas!</h2>
      <p className="final__puntos">
        Juntaste <strong>{puntos} {p.moneda}</strong> <span aria-hidden="true">{p.monedaIcono}</span> con {p.nombre}.
      </p>

      <ul className="insignias">
        {insignias.map((b, i) => (
          <li key={i}><span aria-hidden="true">{p.monedaIcono}</span> {b}</li>
        ))}
      </ul>

      <div className="opciones opciones--centro">
        <button onClick={onRepetir}>Jugar con {otro}</button>
        <button onClick={onInicio}>Volver al inicio</button>
      </div>
    </div>
  );
}
