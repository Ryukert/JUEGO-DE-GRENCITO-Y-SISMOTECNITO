/* Panel de cuentas del superusuario y «Mi cuenta» dentro de la administración. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import axe from "axe-core";
import { MiContrasena, CuentasAdmin, describirRol } from "../src/components/CuentasAdmin.jsx";

const CUENTAS = [
  { id: "a", correo: "jefe@uagro.mx", confirmado: true, rol: "superusuario", yo: true, ultimo_acceso: "2026-11-20T10:00:00Z" },
  { id: "b", correo: "directora@uabc.edu.mx", confirmado: true, rol: null, yo: false, ultimo_acceso: null },
  { id: "c", correo: "fuera@uabc.edu.mx", confirmado: true, rol: "bloqueado", yo: false, ultimo_acceso: null },
];

let pedidos;
beforeEach(() => {
  pedidos = [];
  vi.stubGlobal("fetch", vi.fn(async (url, op) => {
    const cuerpo = JSON.parse(op.body);
    pedidos.push({ cuerpo, autorizacion: op.headers.Authorization });
    if (cuerpo.accion === "cuentas") return { ok: true, status: 200, json: async () => ({ cuentas: CUENTAS }) };
    if (cuerpo.accion === "miContrasena" && cuerpo.actual !== "la-buena-1") {
      return { ok: false, status: 401, json: async () => ({ error: "Tu contraseña actual no es esa." }) };
    }
    return { ok: true, status: 200, json: async () => ({ ok: true }) };
  }));
  vi.spyOn(window, "confirm").mockReturnValue(true);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

const enMain = () => ({ container: document.body.appendChild(document.createElement("main")) });

describe("cuentas de administración", () => {
  it("lista las cuentas con lo que puede hacer cada una, sin problemas de accesibilidad", async () => {
    render(<CuentasAdmin pase="p" />, enMain());
    expect(await screen.findByText("directora@uabc.edu.mx")).toBeTruthy();
    expect(screen.getByText("Administrador (correo institucional)")).toBeTruthy();
    expect(screen.getByText("fuera@uabc.edu.mx").closest("tr").textContent).toContain("Bloqueado");
    // la propia cuenta no se cambia desde aquí
    expect(screen.queryByLabelText("Rol de jefe@uagro.mx")).toBeNull();
    const { violations } = await axe.run(document.body, { rules: { "color-contrast": { enabled: false } } });
    expect(violations.map((v) => v.id)).toEqual([]);
  });

  it("cambia el rol, agrega cuentas y pone contraseñas con el pase", async () => {
    render(<CuentasAdmin pase="p" />, enMain());
    fireEvent.change(await screen.findByLabelText("Rol de directora@uabc.edu.mx"), { target: { value: "bloqueado" } });
    await waitFor(() => expect(pedidos.some((p) => p.cuerpo.accion === "cambiarRol")).toBe(true));
    expect(window.confirm).toHaveBeenCalled();
    expect(pedidos.find((p) => p.cuerpo.accion === "cambiarRol")).toMatchObject({ cuerpo: { id: "b", rol: "bloqueado" }, autorizacion: "Bearer p" });

    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "profe@uagro.mx" } });
    fireEvent.change(screen.getByLabelText("Contraseña para empezar"), { target: { value: "para-empezar-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Agregar" }));
    expect(await screen.findByText(/profe@uagro\.mx ya puede entrar/)).toBeTruthy();
    expect(pedidos.find((p) => p.cuerpo.accion === "nuevaCuenta").cuerpo).toMatchObject({ correo: "profe@uagro.mx", rol: "admin" });

    fireEvent.click(screen.getAllByRole("button", { name: "Poner contraseña" })[0]);
    fireEvent.change(screen.getByLabelText("Contraseña nueva para directora@uabc.edu.mx"), { target: { value: "otra-clave-12" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText(/La contraseña de directora@uabc\.edu\.mx quedó cambiada/)).toBeTruthy();
  });

  it("describe el acceso real de cada cuenta", () => {
    expect(describirRol({ correo: "x@gmail.com", confirmado: true })).toBe("Sin acceso (correo no institucional)");
    expect(describirRol({ correo: "x@gmail.com", confirmado: true, rol: "admin" })).toBe("Administrador");
    expect(describirRol({ correo: "x@uabc.edu.mx", confirmado: false })).toBe("Falta confirmar su correo");
  });
});

describe("mi contraseña", () => {
  it("pide la actual y que la nueva se escriba igual dos veces", async () => {
    render(<MiContrasena pase="p" />, enMain());
    const llenar = (actual, nueva, repetida) => {
      fireEvent.change(screen.getByLabelText("Contraseña actual"), { target: { value: actual } });
      fireEvent.change(screen.getByLabelText("Contraseña nueva"), { target: { value: nueva } });
      fireEvent.change(screen.getByLabelText("Repite la contraseña nueva"), { target: { value: repetida } });
      fireEvent.click(screen.getByRole("button", { name: "Cambiar mi contraseña" }));
    };
    llenar("la-buena-1", "nueva-clave-1", "otra-cosa-99");
    expect(await screen.findByText("Las dos contraseñas nuevas no son iguales.")).toBeTruthy();
    expect(pedidos).toEqual([]);
    llenar("la-mala-11", "nueva-clave-1", "nueva-clave-1");
    expect(await screen.findByText("Tu contraseña actual no es esa.")).toBeTruthy();
    llenar("la-buena-1", "nueva-clave-1", "nueva-clave-1");
    expect(await screen.findByText(/tu contraseña quedó cambiada/)).toBeTruthy();
  });
});
