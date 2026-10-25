/**
 * Lógica de los juegos (24-oct-2026). Pura, sin React: pruebas en test/juegos.test.mjs.
 */

/** Baraja (Fisher-Yates). `azar` se puede fijar en las pruebas. */
export function barajar(lista, azar = Math.random) {
  const a = [...(lista || [])];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(azar() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/**
 * Saca la siguiente carta SIN repetir hasta que se acaba el mazo; ahí se vuelve a barajar.
 * `usadas` = ids ya salidos (se guarda en el teléfono para que no se repitan entre partidas).
 * Devuelve { carta, usadas }.
 */
export function sacar(cartas, usadas = [], azar = Math.random) {
  if (!cartas || !cartas.length) return { carta: null, usadas: [] };
  const ya = new Set(usadas);
  let quedan = cartas.filter((c) => !ya.has(c.id));
  let base = usadas;
  if (!quedan.length) { quedan = cartas; base = []; }      // se acabó el mazo: parte de nuevo
  const carta = quedan[Math.floor(azar() * quedan.length)];
  return { carta, usadas: [...base, carta.id] };
}

/** Penitencia por no cumplir, según el nivel. config: { alcohol, bebida, cantidades: {nivel: n}, unidad } */
export const CANTIDAD_DEFECTO = { suave: 1, caliente: 2, duro: 1, extremo: 2, sinfiltro: 3 };
export const UNIDAD_DEFECTO = { suave: "sorbo", caliente: "sorbo", duro: "corto", extremo: "corto", sinfiltro: "corto" };
export function penitencia(nivel, config = {}) {
  if (!config.alcohol) return "Pierdes el punto y tu pareja elige tu castigo";
  const n = Number((config.cantidades || {})[nivel] ?? CANTIDAD_DEFECTO[nivel] ?? 1) || 1;
  const u = (config.unidades || {})[nivel] || UNIDAD_DEFECTO[nivel] || "trago";
  const bebida = String(config.bebida || "").trim();
  return `Toma ${n} ${u}${n === 1 ? "" : "s"}${bebida ? ` de ${bebida}` : ""}`;
}

/** Cambia {yo} y {tu} por los nombres. */
export const conNombres = (t, yo, tu) => String(t || "").replace(/\{yo\}/g, yo || "").replace(/\{tu\}/g, tu || "");

// ── Impostor ──
/** Reparte: a cada jugador la palabra, salvo a los impostores. Devuelve [{nombre, palabra|null}]. */
export function repartirImpostor(jugadores, palabra, nImpostores = 1, azar = Math.random) {
  const js = (jugadores || []).filter((x) => String(x || "").trim());
  const n = Math.max(1, Math.min(Number(nImpostores) || 1, Math.max(1, js.length - 2)));
  const impostores = new Set(barajar(js.map((_, i) => i), azar).slice(0, n));
  return js.map((nombre, i) => ({ nombre, palabra: impostores.has(i) ? null : palabra }));
}

// ── Bingo ──
/** Un cartón de 5×5 con el centro libre, sin repetir. */
export function carton(frases, azar = Math.random) {
  const f = barajar(frases, azar).slice(0, 24);
  return [...f.slice(0, 12), "★ LIBRE", ...f.slice(12)];
}
/** ¿Hay línea? (fila, columna o diagonal). marcadas = índices 0..24 (el 12 siempre cuenta). */
export function hayLinea(marcadas) {
  const m = new Set([...(marcadas || []), 12]);
  const L = [];
  for (let i = 0; i < 5; i++) { L.push([0, 1, 2, 3, 4].map((j) => i * 5 + j)); L.push([0, 1, 2, 3, 4].map((j) => j * 5 + i)); }
  L.push([0, 6, 12, 18, 24], [4, 8, 12, 16, 20]);
  return L.some((l) => l.every((x) => m.has(x)));
}
