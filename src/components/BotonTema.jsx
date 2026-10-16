import Icono from "./Icono.jsx";

/** Botón redondo para pasar del tema claro al oscuro y de regreso. */
export default function BotonTema({ tema, onTema }) {
  if (!onTema) return null;
  const oscuro = tema === "oscuro";
  return (
    <button
      type="button"
      className="boton-tema"
      onClick={onTema}
      aria-pressed={oscuro}
      aria-label={oscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      title={oscuro ? "Tema claro" : "Tema oscuro"}
    >
      <Icono nombre={oscuro ? "sol" : "luna"} />
    </button>
  );
}
