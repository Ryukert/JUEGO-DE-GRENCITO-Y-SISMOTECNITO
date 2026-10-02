/**
 * Laberintos al azar para el motor Ruta.jsx.
 *
 * Un mapa hecho a mano se aprende de memoria a la segunda partida. Por eso
 * en medio y difícil el edificio se arma al momento: un laberinto con
 * algunos atajos, la salida en el punto más lejano de la entrada y los
 * peligros encima de la ruta corta para obligar a buscar otra. Siempre
 * queda al menos un camino seguro hasta la salida.
 */

import { revolver } from "./azar.js";

const DIRECCIONES = [
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0],
];

/** Casillas que no se pueden pisar: muros, zonas de riesgo, elevador y escombro. */
export const BLOQUEAN = new Set(["#", "X", "T", "R"]);

/**
 * Camino más corto desde `desde` hasta la salida (S) sin pisar nada que
 * bloquee. `extra` son llaves "x,y" bloqueadas además del mapa (escombro
 * que cayó durante la partida). Regresa la lista de casillas, incluidas la
 * de inicio y la salida, o null si no hay forma de llegar.
 */
export function rutaSegura(mapa, desde, extra = new Set()) {
  const previo = new Map([[`${desde.x},${desde.y}`, null]]);
  const cola = [desde];

  for (let i = 0; i < cola.length; i++) {
    const { x, y } = cola[i];
    if (mapa[y][x] === "S") {
      const ruta = [];
      for (let llave = `${x},${y}`; llave; llave = previo.get(llave)) {
        const [a, b] = llave.split(",").map(Number);
        ruta.unshift({ x: a, y: b });
      }
      return ruta;
    }
    for (const [dx, dy] of DIRECCIONES) {
      const nx = x + dx;
      const ny = y + dy;
      const llave = `${nx},${ny}`;
      const celda = mapa[ny]?.[nx];
      if (!celda || BLOQUEAN.has(celda) || extra.has(llave) || previo.has(llave)) continue;
      previo.set(llave, `${x},${y}`);
      cola.push({ x: nx, y: ny });
    }
  }
  return null;
}

/** Voltea un mapa en espejo. Mismo laberinto, otra cara: ya no sirve memorizarlo. */
export function voltear(mapa, horizontal, vertical) {
  const filas = vertical ? [...mapa].reverse() : [...mapa];
  return horizontal ? filas.map((f) => [...f].reverse().join("")) : filas;
}

/**
 * Arma un laberinto nuevo. `columnas` y `filas` deben ser impares.
 *
 *   peligros    zonas de riesgo (X) puestas sobre la ruta corta
 *   elevadores  elevadores (T), igual que los peligros
 *   extintores  extintores (E) escondidos en callejones sin salida
 *   atajos      probabilidad de tumbar un muro interior (0 = una sola ruta)
 */
export function generarMapa(
  { columnas, filas, peligros = 0, elevadores = 0, extintores = 0, atajos = 0.1 },
  azar = Math.random
) {
  const rejilla = Array.from({ length: filas }, () => Array(columnas).fill("#"));
  const texto = () => rejilla.map((f) => f.join(""));
  const dentro = (x, y) => x > 0 && y > 0 && x < columnas - 1 && y < filas - 1;

  // 1. laberinto perfecto: se excava desde una esquina saltando de dos en dos
  rejilla[1][1] = ".";
  const pila = [{ x: 1, y: 1 }];
  while (pila.length) {
    const { x, y } = pila[pila.length - 1];
    const vecinos = revolver(
      DIRECCIONES.map(([dx, dy]) => ({ x: x + dx * 2, y: y + dy * 2, mx: x + dx, my: y + dy })),
      azar
    ).filter((c) => dentro(c.x, c.y) && rejilla[c.y][c.x] === "#");
    if (!vecinos.length) {
      pila.pop();
      continue;
    }
    const c = vecinos[0];
    rejilla[c.my][c.mx] = ".";
    rejilla[c.y][c.x] = ".";
    pila.push({ x: c.x, y: c.y });
  }

  // 2. atajos: sin ellos un peligro en el pasillo único cerraría el paso
  const murosDeAtajo = () => {
    const lista = [];
    for (let y = 1; y < filas - 1; y++) {
      for (let x = 1; x < columnas - 1; x++) {
        // solo muros entre dos casillas; los pilares (x, y pares) se quedan
        if (rejilla[y][x] !== "#" || (x + y) % 2 === 0) continue;
        const horizontal = rejilla[y][x - 1] !== "#" && rejilla[y][x + 1] !== "#";
        const vertical = rejilla[y - 1][x] !== "#" && rejilla[y + 1][x] !== "#";
        if (horizontal !== vertical) lista.push({ x, y });
      }
    }
    return lista;
  };
  murosDeAtajo().forEach((m) => {
    if (azar() < atajos) rejilla[m.y][m.x] = ".";
  });

  // 3. entrada en una esquina al azar, salida en la casilla más lejana
  const esquinas = [
    { x: 1, y: 1 },
    { x: columnas - 2, y: 1 },
    { x: 1, y: filas - 2 },
    { x: columnas - 2, y: filas - 2 },
  ];
  const inicio = esquinas[Math.floor(azar() * esquinas.length)];
  const distancia = new Map([[`${inicio.x},${inicio.y}`, 0]]);
  const cola = [inicio];
  let lejos = inicio;
  for (let i = 0; i < cola.length; i++) {
    const { x, y } = cola[i];
    const d = distancia.get(`${x},${y}`);
    if (d > distancia.get(`${lejos.x},${lejos.y}`)) lejos = { x, y };
    for (const [dx, dy] of DIRECCIONES) {
      const llave = `${x + dx},${y + dy}`;
      if (rejilla[y + dy][x + dx] === "#" || distancia.has(llave)) continue;
      distancia.set(llave, d + 1);
      cola.push({ x: x + dx, y: y + dy });
    }
  }
  rejilla[inicio.y][inicio.x] = "J";
  rejilla[lejos.y][lejos.x] = "S";

  // 4. peligros: primero sobre la ruta corta (obligan a desviarse), y solo
  //    se quedan si todavía hay un camino seguro. Si el laberinto salió como
  //    un solo pasillo y ya no caben, se abre otro atajo y se reintenta.
  const cercaDelInicio = (c) => Math.abs(c.x - inicio.x) + Math.abs(c.y - inicio.y) <= 1;
  const colocar = (tipo) => {
    const ruta = rutaSegura(texto(), inicio) || [];
    const enRuta = new Set(ruta.map((c) => `${c.x},${c.y}`));
    const resto = [];
    rejilla.forEach((fila, y) =>
      fila.forEach((celda, x) => {
        if (celda === "." && !enRuta.has(`${x},${y}`)) resto.push({ x, y });
      })
    );
    const candidatas = [...revolver(ruta.slice(2, -1), azar), ...revolver(resto, azar)];
    for (const c of candidatas) {
      if (rejilla[c.y][c.x] !== "." || cercaDelInicio(c)) continue;
      rejilla[c.y][c.x] = tipo;
      if (rutaSegura(texto(), inicio)) return true;
      rejilla[c.y][c.x] = ".";
    }
    return false;
  };
  const tipos = revolver([...Array(peligros).fill("X"), ...Array(elevadores).fill("T")], azar);
  // un atajo de emergencia no puede dejar la salida a dos pasos
  const minimo = columnas + filas - 6;
  const abrirAtajo = () => {
    for (const m of revolver(murosDeAtajo(), azar)) {
      rejilla[m.y][m.x] = ".";
      if (rutaSegura(texto(), inicio).length - 1 >= minimo) return true;
      rejilla[m.y][m.x] = "#";
    }
    return false;
  };
  for (const tipo of tipos) {
    for (let intento = 0; intento < 8 && !colocar(tipo); intento++) {
      if (!abrirAtajo()) break;
    }
  }

  // 5. extintores en callejones sin salida: puntos extra a cambio de tiempo
  const libres = [];
  const callejones = [];
  rejilla.forEach((fila, y) =>
    fila.forEach((celda, x) => {
      if (celda !== ".") return;
      libres.push({ x, y });
      const salidas = DIRECCIONES.filter(([dx, dy]) => rejilla[y + dy][x + dx] !== "#").length;
      if (salidas === 1) callejones.push({ x, y });
    })
  );
  const lugares = [...revolver(callejones, azar), ...revolver(libres, azar)];
  let puestos = 0;
  for (const c of lugares) {
    if (puestos >= extintores) break;
    if (rejilla[c.y][c.x] !== ".") continue;
    rejilla[c.y][c.x] = "E";
    puestos++;
  }

  return texto();
}
