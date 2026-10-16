import { useEffect, useState } from "react";
import { rangoPara, RANGOS } from "../lib/progreso.js";
import { confeti } from "../lib/confeti.js";
import { sonido } from "../lib/sonido.js";
import Creditos from "./Creditos.jsx";
import Icono, { iconoMoneda } from "./Icono.jsx";

/** Estrellas de la partida según el rango alcanzado: Vigilante 1, Guardián 2, Capitán o más 3. */
export function estrellasPara(puntos) {
  return Math.min(3, RANGOS.indexOf(rangoPara(puntos)));
}

function sinMovimiento() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {
    return false;
  }
}

/** Cuenta de 0 al total en ~1.2 s; sin animación si el sistema pide menos movimiento. */
function useCuenta(total, ms = 1200) {
  const [valor, setValor] = useState(() => (sinMovimiento() ? total : 0));
  useEffect(() => {
    if (sinMovimiento() || total <= 0) {
      setValor(total);
      return;
    }
    // pasos de 40 ms con frenado al final; Date.now y no el reloj de la animación,
    // para que la cuenta siempre termine aunque la pestaña esté en segundo plano
    const inicio = Date.now();
    const id = setInterval(() => {
      const t = Math.min(1, (Date.now() - inicio) / ms);
      setValor(Math.round(total * (1 - (1 - t) ** 3)));
      if (t >= 1) clearInterval(id);
    }, 40);
    return () => clearInterval(id);
  }, [total, ms]);
  return valor;
}

export default function Final({ personaje: p, puntos, insignias, record, onRepetir, onOtro, onCentro, onInicio }) {
  const rango = rangoPara(puntos);
  const siguiente = RANGOS.find((r) => r.min > puntos);
  const estrellas = estrellasPara(puntos);
  const cuenta = useCuenta(puntos);

  // festejo en tres tandas de confeti (izquierda, centro, derecha); con récord, una cuarta más grande
  useEffect(() => {
    sonido.victoria();
    const tandas = [0.2, 0.5, 0.8].map((desde, i) =>
      setTimeout(() => confeti({ colores: p.colores, cantidad: 70, desde }), i * 380)
    );
    if (record.nuevoRecord) {
      tandas.push(
        setTimeout(() => {
          sonido.moneda();
          confeti({ colores: p.colores, cantidad: 120 });
        }, 1500)
      );
    }
    return () => tandas.forEach(clearTimeout);
  }, [p.colores, record.nuevoRecord]);

  return (
    <div className="pantalla final">
      <div className="final__escenario">
        <span className="final__rayos" aria-hidden="true" />
        <img className="final__figura final__figura--festeja" src={p.cuerpo} alt={p.nombre} />
      </div>

      <p className="final__estrellas" aria-label={`${estrellas} de 3 estrellas`}>
        {[0, 1, 2].map((i) => (
          <Icono
            key={i}
            nombre={i < estrellas ? "estrella" : "estrella-vacia"}
            className={`final__estrella ${i < estrellas ? "final__estrella--ganada" : ""}`}
          />
        ))}
      </p>

      <p className="final__rango">
        <span className="final__sello" aria-hidden="true">{rango.icono}</span> {rango.nombre}
      </p>
      <h2 aria-label={`${puntos} ${p.moneda}`}>
        <span aria-hidden="true">{cuenta} {p.moneda}</span>
      </h2>

      {record.nuevoRecord ? (
        <p className="final__record final__record--nuevo">
          <span className="final__liston">
            <Icono nombre="trofeo" /> ¡Récord nuevo!
          </span>{" "}
          Antes tenías {record.recordAnterior}.
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
          <li key={i} style={{ "--i": i }}>
            <Icono nombre={iconoMoneda(p.moneda)} /> {b}
          </li>
        ))}
      </ul>

      <div className="opciones opciones--centro">
        <button className="boton-grande" onClick={onRepetir}>Otra vez, más rápido</button>
        <button onClick={onOtro}>Jugar con el otro personaje</button>
        <button onClick={onCentro}><Icono nombre="control" /> Centro de entrenamiento</button>
        <button onClick={onInicio}>Volver al inicio</button>
      </div>

      <Creditos variante="sello" />
    </div>
  );
}
