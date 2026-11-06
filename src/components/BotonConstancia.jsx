import { useState } from "react";
import Icono from "./Icono.jsx";

/** «Descargar mi constancia»: PDF con su nombre, ID, rango, misiones y XP. */
export default function BotonConstancia({ progreso, jugador, className = "" }) {
  const [haciendo, setHaciendo] = useState(false);
  const [error, setError] = useState("");
  return (
    <>
      <button
        type="button"
        className={`boton-constancia ${className}`.trim()}
        disabled={haciendo}
        onClick={async () => {
          setHaciendo(true);
          setError("");
          try {
            const { descargarConstancia } = await import("../lib/constancia.js");
            await descargarConstancia(progreso, jugador);
          } catch (e) {
            setError("No se pudo crear la constancia. Inténtalo otra vez.");
          } finally {
            setHaciendo(false);
          }
        }}
      >
        <Icono nombre="descargar" /> {haciendo ? "Creando constancia…" : "Descargar mi constancia"}
      </button>
      {error && <p className="cuenta__error" role="alert">{error}</p>}
    </>
  );
}
