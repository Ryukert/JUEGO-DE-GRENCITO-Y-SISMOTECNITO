import { useState, useEffect } from "react";

/**
 * «¿Sigues jugando?»: sale unos segundos antes de que el juego vuelva a pedir el nombre
 * por inactividad. Tocar en cualquier lado lo quita (eso ya cuenta como actividad).
 */
export default function AvisoInactividad({ segundos, nombre }) {
  const [quedan, setQuedan] = useState(segundos);
  useEffect(() => {
    const id = setInterval(() => setQuedan((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="ajustes-fondo aviso-inactivo" role="alertdialog" aria-modal="true" aria-labelledby="aviso-inactivo-titulo" aria-describedby="aviso-inactivo-texto">
      <div className="ajustes aviso-inactivo__caja">
        <p className="aviso-inactivo__reloj" aria-hidden="true">⏰</p>
        <h2 id="aviso-inactivo-titulo">¿Sigues jugando{nombre ? `, ${nombre}` : ""}?</h2>
        <p id="aviso-inactivo-texto">
          <strong>Toca la pantalla</strong> para seguir. Si no, en <b className="aviso-inactivo__cuenta">{quedan}</b> segundos
          el juego vuelve al inicio para que juegue alguien más.
        </p>
        <button type="button" className="boton-grande">¡Sigo aquí!</button>
      </div>
    </div>
  );
}
