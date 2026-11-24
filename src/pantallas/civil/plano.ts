// ════════════════════════════════════════════════════════════════
// PLANO DE MESAS DE LA BODA CIVIL (23-nov-2026). Todo en METROS, visto desde arriba.
// Un mesón para los novios y sus padres (los puestos miran hacia los invitados), 5 mesas
// redondas de 7, un mesón de autoservicio (ensaladas y carne) y otro de bebidas y picoteo.
// Se avisa cuando entre dos cosas queda un paso de menos de PASO_MIN (para circular con plato).
// Lógica pura: test/plano.test.ts
// ════════════════════════════════════════════════════════════════
export type TipoElem = "principal" | "redonda" | "buffet" | "bebidas" | "otro";
export type Asiento = { inv?: number; texto?: string };            // un invitado de la lista, o un nombre escrito a mano
export type ElemPlano = {
  id: string; tipo: TipoElem; nombre: string;
  x: number; y: number;                                           // centro, en metros
  rot: 0 | 90 | 180 | 270;
  w: number; h: number;                                           // mesones: largo × ancho (redondas: diámetro en w)
  asientos: (Asiento | null)[];
};
export type PlanoCivil = { ancho: number; largo: number; elementos: ElemPlano[] };

export const PASO_MIN = 0.9;          // paso cómodo entre sillas/mesones (m)
export const SILLA = 0.45;            // lo que ocupa una silla con la persona sentada, desde el borde de la mesa (m)
export const R_REDONDA = 0.75;        // mesa redonda de 7: ~1,5 m de diámetro

const id = () => Math.random().toString(36).slice(2, 9);
const vacios = (n: number) => Array.from({ length: n }, () => null as Asiento | null);

export const ETIQUETA: Record<TipoElem, string> = {
  principal: "Novios y padres", redonda: "Mesa", buffet: "Autoservicio: ensaladas y carne", bebidas: "Bebidas y picoteo", otro: "Otro",
};

/** El plano de partida: lugar de 14 × 10 m. Mesón principal arriba mirando al resto, mesas en 3 + 2,
 *  autoservicio a la izquierda y bebidas a la derecha (cada uno con su fila para servirse). */
export function planoInicial(): PlanoCivil {
  const ancho = 14, largo = 10;
  const principal: ElemPlano = { id: id(), tipo: "principal", nombre: "Novios y padres", x: 7, y: 1.4, rot: 0, w: 4.2, h: 0.9,
    asientos: [{ texto: "Papá novio" }, { texto: "Mamá novio" }, { texto: "Diego" }, { texto: "Camila" }, { texto: "Mamá novia" }, { texto: "Papá novia" }] };
  const mesas: ElemPlano[] = [[3.6, 4.4], [7, 4.4], [10.4, 4.4], [5.3, 7.75], [8.7, 7.75]].map(([x, y], i) => (
    { id: id(), tipo: "redonda", nombre: `Mesa ${i + 1}`, x, y, rot: 0, w: R_REDONDA * 2, h: R_REDONDA * 2, asientos: vacios(7) }));
  const buffet: ElemPlano = { id: id(), tipo: "buffet", nombre: ETIQUETA.buffet, x: 0.9, y: 6, rot: 90, w: 2.4, h: 0.8, asientos: [] };
  const bebidas: ElemPlano = { id: id(), tipo: "bebidas", nombre: ETIQUETA.bebidas, x: 13.1, y: 6, rot: 90, w: 2.0, h: 0.8, asientos: [] };
  return { ancho, largo, elementos: [principal, ...mesas, buffet, bebidas] };
}

export function nuevoElemento(tipo: TipoElem, nombre: string, x: number, y: number, n = 0): ElemPlano {
  if (tipo === "redonda") return { id: id(), tipo, nombre, x, y, rot: 0, w: R_REDONDA * 2, h: R_REDONDA * 2, asientos: vacios(n || 7) };
  const med: Record<string, [number, number]> = { principal: [4.2, 0.9], buffet: [2.4, 0.8], bebidas: [2.0, 0.8], otro: [1.5, 0.8] };
  const [w, h] = med[tipo];
  return { id: id(), tipo, nombre, x, y, rot: 0, w, h, asientos: tipo === "principal" ? vacios(n || 6) : [] };
}

/** Medidas que ocupa en el piso (con la rotación). */
export const huella = (e: ElemPlano) => (e.tipo === "redonda" || e.rot === 0 || e.rot === 180) ? { w: e.w, h: e.h } : { w: e.h, h: e.w };

/** Dónde va cada puesto (centro de la silla), en metros. Redonda: alrededor. Mesón principal: todos
 *  del mismo lado (el de atrás), mirando hacia el salón; ese lado gira con el mesón. */
export function puestos(e: ElemPlano): { x: number; y: number }[] {
  const n = e.asientos.length;
  if (!n) return [];
  if (e.tipo === "redonda") {
    const r = e.w / 2 + SILLA * .62;
    return e.asientos.map((_, i) => { const a = -Math.PI / 2 + (i / n) * Math.PI * 2; return { x: e.x + r * Math.cos(a), y: e.y + r * Math.sin(a) }; });
  }
  const paso = e.w / n, d = e.h / 2 + SILLA * .62;
  const loc = e.asientos.map((_, i) => ({ u: -e.w / 2 + paso * (i + .5), v: -d }));   // sistema del mesón: u a lo largo, v hacia atrás
  const rad = (e.rot * Math.PI) / 180, c = Math.cos(rad), s = Math.sin(rad);
  return loc.map(({ u, v }) => ({ x: e.x + u * c - v * s, y: e.y + u * s + v * c }));
}

// ── Pasos entre elementos (con las sillas incluidas) ──
type Forma = { tipo: "circ"; x: number; y: number; r: number } | { tipo: "rect"; x0: number; y0: number; x1: number; y1: number };
export function forma(e: ElemPlano): Forma {
  if (e.tipo === "redonda") return { tipo: "circ", x: e.x, y: e.y, r: e.w / 2 + (e.asientos.length ? SILLA : 0) };
  const { w, h } = huella(e);
  // el mesón principal ocupa además la fila de sillas de atrás
  let x0 = e.x - w / 2, x1 = e.x + w / 2, y0 = e.y - h / 2, y1 = e.y + h / 2;
  if (e.tipo === "principal" && e.asientos.length) {
    if (e.rot === 0) y0 -= SILLA; else if (e.rot === 180) y1 += SILLA; else if (e.rot === 90) x1 += SILLA; else x0 -= SILLA;
  }
  return { tipo: "rect", x0, y0, x1, y1 };
}
function distancia(a: Forma, b: Forma): number {
  if (a.tipo === "circ" && b.tipo === "circ") return Math.hypot(a.x - b.x, a.y - b.y) - a.r - b.r;
  if (a.tipo === "rect" && b.tipo === "rect") {
    const dx = Math.max(0, a.x0 - b.x1, b.x0 - a.x1), dy = Math.max(0, a.y0 - b.y1, b.y0 - a.y1);
    return dx > 0 || dy > 0 ? Math.hypot(dx, dy) : -Math.min(a.x1 - b.x0, b.x1 - a.x0, a.y1 - b.y0, b.y1 - a.y0);
  }
  const c = (a.tipo === "circ" ? a : b) as Extract<Forma, { tipo: "circ" }>, r = (a.tipo === "rect" ? a : b) as Extract<Forma, { tipo: "rect" }>;
  const px = Math.min(Math.max(c.x, r.x0), r.x1), py = Math.min(Math.max(c.y, r.y0), r.y1);
  return Math.hypot(c.x - px, c.y - py) - c.r;
}
/** Pares de elementos con menos paso que PASO_MIN, y los que se salen del lugar. */
export function problemas(p: PlanoCivil) {
  const estrechos: { a: string; b: string; paso: number }[] = [], fuera: string[] = [];
  const fs = p.elementos.map(forma);
  p.elementos.forEach((e, i) => {
    const f = fs[i];
    const [x0, y0, x1, y1] = f.tipo === "circ" ? [f.x - f.r, f.y - f.r, f.x + f.r, f.y + f.r] : [f.x0, f.y0, f.x1, f.y1];
    if (x0 < -0.01 || y0 < -0.01 || x1 > p.ancho + .01 || y1 > p.largo + .01) fuera.push(e.id);
    for (let j = i + 1; j < p.elementos.length; j++) {
      const d = distancia(f, fs[j]);
      if (d < PASO_MIN) estrechos.push({ a: e.id, b: p.elementos[j].id, paso: Math.round(d * 100) / 100 });
    }
  });
  return { estrechos, fuera };
}

// ── Invitados en los puestos ──
export const sentados = (p: PlanoCivil) => new Set(p.elementos.flatMap((e) => e.asientos.map((a) => a?.inv).filter((x): x is number => x != null)));
export const capacidad = (p: PlanoCivil) => p.elementos.reduce((s, e) => s + e.asientos.length, 0);
export const ocupados = (p: PlanoCivil) => p.elementos.reduce((s, e) => s + e.asientos.filter((a) => a && (a.inv != null || a.texto)).length, 0);
/** Llena los puestos libres de las mesas redondas, mesa por mesa, con los invitados que faltan (en el orden de la lista). */
export function sentarAutomatico(p: PlanoCivil, invitados: { id: number }[]): PlanoCivil {
  const ya = sentados(p), cola = invitados.filter((i) => !ya.has(i.id)).map((i) => i.id);
  return { ...p, elementos: p.elementos.map((e) => e.tipo !== "redonda" ? e : { ...e, asientos: e.asientos.map((a) => (a && (a.inv != null || a.texto)) || !cola.length ? a : { inv: cola.shift()! }) }) };
}
/** Saca a un invitado de donde esté sentado (al borrarlo de la lista o al moverlo de puesto). */
export const quitarInvitado = (p: PlanoCivil, inv: number): PlanoCivil =>
  ({ ...p, elementos: p.elementos.map((e) => ({ ...e, asientos: e.asientos.map((a) => (a?.inv === inv ? null : a)) })) });
export function sentar(p: PlanoCivil, elem: string, puesto: number, a: Asiento | null): PlanoCivil {
  const base = a?.inv != null ? quitarInvitado(p, a.inv) : p;
  return { ...base, elementos: base.elementos.map((e) => e.id !== elem ? e : { ...e, asientos: e.asientos.map((x, i) => (i === puesto ? a : x)) }) };
}
/** Texto para WhatsApp: cada mesa con su gente. */
export function listaTexto(p: PlanoCivil, nombre: (id: number) => string) {
  return p.elementos.filter((e) => e.asientos.length).map((e) => {
    const gente = e.asientos.map((a) => (a?.inv != null ? nombre(a.inv) : a?.texto || "")).filter(Boolean);
    return `*${e.nombre}* (${gente.length}/${e.asientos.length})\n${gente.map((g) => `• ${g}`).join("\n") || "• (vacía)"}`;
  }).join("\n\n");
}
