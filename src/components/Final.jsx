import { useEffect } from "react";
import { rangoPara, RANGOS } from "../lib/progreso.js";
import { confeti } from "../lib/confeti.js";
import { sonido } from "../lib/sonido.js";
import Creditos from "./Creditos.jsx";

export default function Final({ personaje: p, puntos, insignias, record, onRepetir, onOtro, onCentro, onInicio }) {
  const rango = rangoPara(puntos);
  const siguiente = RANGOS.find((r) => r.min > puntos);

  useEffect(() => {
    sonido.victoria();
    confeti({ colores: p.colores, cantidad: 110 });
  }, [p.colores]);

  return (
    <div className="pantalla final">
      <img className="final__figura flota" src={p.cuerpo} alt={p.nombre} />

      <p className="final__rango">
        <span aria-hidden="true">{rango.icono}</span> {rango.nombre}
      </p>
      <h2>{puntos} {p.moneda}</h2>

      {record.nuevoRecord ? (
        <p className="final__record final__record--nuevo">
          ¡Récord nuevo! Antes tenías {record.recordAnterior}.
        </p>
      ) : (
        <p className="final__record">Tu récord con {p.nombre}: {record.recordAnterior}</p>
      )}

      {siguiente && (
        <p className="final__meta">
          Te faltan {siguiente.min - puntos} para llegar a {siguiente.nombre} {siguiente.icono}
        </p>
      )}

      <ul className="insignias">
        {insignias.map((b, i) => (
          <li key={i}><span aria-hidden="true">{p.monedaIcono}</span> {b}</li>
        ))}
      </ul>

      <div className="opciones opciones--centro">
        <button className="boton-grande" onClick={onRepetir}>Otra vez, más rápido</button>
        <button onClick={onOtro}>Jugar con el otro personaje</button>
        <button onClick={onCentro}>🎮 Centro de entrenamiento</button>
        <button onClick={onInicio}>Volver al inicio</button>
      </div>

      <Creditos variante="sello" texto={false} />
    </div>
  );
}
