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

// ═══ Juegos en grupo (30-oct-2026): cada uno con su teléfono ═══

/** Elige tema y palabra. `cat` = nombre del tema o "Todos". `otra` = una palabra distinta del mismo tema (modo infiltrado). */
export function elegirPalabra(temas, cat, azar = Math.random) {
  const nombres = Object.keys(temas || {}).filter((k) => (temas[k] || []).length >= 2);
  if (!nombres.length) return null;
  const t = nombres.includes(cat) ? cat : nombres[Math.floor(azar() * nombres.length)];
  const [palabra, otra] = barajar(temas[t], azar);
  return { cat: t, palabra, otra };
}

/** Reparte la ronda del impostor entre ids. Devuelve { pal: {pid: palabra|null}, imp: [pids], orden: [pids] }.
 *  Con `otra` (infiltrado) el impostor recibe esa palabra en vez de nada, y no sabe que es el impostor. */
export function repartirSala(pids, palabra, nImpostores = 1, otra = null, azar = Math.random) {
  const ids = (pids || []).filter(Boolean);
  const n = Math.max(1, Math.min(Number(nImpostores) || 1, Math.max(1, ids.length - 2)));
  const imp = barajar(ids, azar).slice(0, n);
  const pal = {};
  ids.forEach((p) => { pal[p] = imp.includes(p) ? (otra || null) : palabra; });
  return { pal, imp, orden: barajar(ids, azar) };
}

/** Cuenta votos { votante: votado } → [{ pid, n }] de más a menos (solo votos a jugadores válidos). */
export function contarVotos(votos, validos) {
  const ok = new Set(validos || Object.values(votos || {}));
  const c = {};
  Object.values(votos || {}).forEach((x) => { if (ok.has(x)) c[x] = (c[x] || 0) + 1; });
  return Object.entries(c).map(([pid, n]) => ({ pid, n })).sort((a, b) => b.n - a.n);
}

/** Mímica: arma dos equipos alternados y el orden de turnos (A, B, A, B…). */
export function armarEquipos(pids, azar = Math.random) {
  const ids = barajar((pids || []).filter(Boolean), azar);
  const eq = {}; const A = [], B = [];
  ids.forEach((p, i) => { if (i % 2 === 0) { eq[p] = "A"; A.push(p); } else { eq[p] = "B"; B.push(p); } });
  const cola = [];
  for (let i = 0; i < Math.max(A.length, B.length); i++) { if (A[i]) cola.push(A[i]); if (B[i]) cola.push(B[i]); }
  return { eq, cola };
}

// ── Pasapalabra ── est = texto de 25 letras: "-" pendiente, "o" acierto, "x" error.
/** Siguiente letra pendiente desde `desde` (sin contarla), dando la vuelta. -1 si no queda ninguna. */
export function siguientePendiente(est, desde) {
  const n = est.length;
  for (let k = 1; k <= n; k++) { const i = (desde + k) % n; if (est[i] === "-") return i; }
  return -1;
}
/**
 * Aplica una jugada al rosco. ron = { est:[e0,e1], pos:[p0,p1], rest:[ms,ms], turno, desde, fase }.
 * accion: "ok" | "mal" | "pasa" | "tiempo". `ahora` en ms. Devuelve el ron nuevo.
 * Un acierto sigue jugando; un error o un pasapalabra le pasa el turno al otro (si le queda algo).
 */
export function jugarRosco(ron, accion, ahora) {
  const r = { ...ron, est: [...ron.est], pos: [...ron.pos], rest: [...ron.rest] };
  const t = r.turno, n = r.est.length;
  if (r.desde) r.rest[t] = Math.max(0, r.rest[t] - (ahora - r.desde));
  const vivo = (k) => k < n && r.est[k].includes("-") && r.rest[k] > 0;
  if (accion === "ok" || accion === "mal") {
    const e = r.est[t].split(""); e[r.pos[t]] = accion === "ok" ? "o" : "x"; r.est[t] = e.join("");
  }
  if (accion !== "tiempo" && r.rest[t] > 0) {
    const sig = siguientePendiente(r.est[t], r.pos[t]);
    if (sig >= 0) r.pos[t] = sig;
  }
  if (accion === "tiempo") r.rest[t] = 0;
  const otro = n === 2 ? 1 - t : t;
  let turno = t;
  if (accion !== "ok" || !vivo(t)) turno = vivo(otro) ? otro : (vivo(t) ? t : -1);
  if (turno === -1) { r.fase = "fin"; r.desde = 0; r.turno = t; return r; }
  r.turno = turno;
  // Al cambiar de turno el reloj queda en pausa hasta que el presentador lo vuelva a partir.
  r.desde = turno === t ? ahora : 0;
  return r;
}
/** Puntaje del rosco: aciertos y errores. */
export const puntajeRosco = (e) => ({ ok: (e.match(/o/g) || []).length, mal: (e.match(/x/g) || []).length });
