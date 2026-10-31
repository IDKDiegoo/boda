/**
 * DIRECCIÓN PROPIA PARA CADA PANTALLA (31-oct-2026), igual que en la app de ARAIN.
 * Antes la pantalla vivía solo en un estado y el historial del navegador no tenía entradas propias:
 * la flecha de ATRÁS sacaba de la app (al inicio de sesión o a Google). Ahora cada apartado tiene su
 * ruta (/invitados, /mesas, /juegos/impostor…) y ATRÁS vuelve a la anterior. Vercel manda cualquier
 * ruta a index.html (vercel.json), salvo /i/… (invitaciones) y /api. Lógica pura: test/rutas.test.mjs.
 */
export const RUTAS = {
  dashboard: "inicio", invitados: "invitados", mesas: "mesas", presupuesto: "presupuesto", proveedores: "proveedores",
  decoraciones: "decoraciones", programa: "programa", regalos: "regalos", civil: "invitaciones", luna: "luna-de-miel",
  deptos: "departamentos", checklist: "pendientes", juegos: "juegos", fotos: "galeria", qr: "qr-invitados",
};
const partes = (path) => {
  let p = String(path || "").split(/[?#]/)[0];
  try { p = decodeURIComponent(p); } catch (_) { /* se usa tal cual */ }
  return p.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
};
export const rutaDe = (tab, ...sub) => "/" + [RUTAS[tab] || RUTAS.dashboard, ...sub.filter(Boolean)].map(encodeURIComponent).join("/");
/** Ruta → id de pantalla, o null si no es de la app. */
export function tabDeRuta(path) {
  const [p] = partes(path);
  if (!p) return null;
  const e = Object.entries(RUTAS).find(([, r]) => r === p.toLowerCase());
  return e ? e[0] : null;
}
/** Lo que viene después de la pantalla: «/juegos/impostor» → ["impostor"]. */
export const subRuta = (path) => partes(path).slice(1);
/** Dirección actual con un parámetro cambiado (o sacado, si el valor viene vacío). */
export function conParametro(href, clave, valor) {
  const u = new URL(href);
  if (valor) u.searchParams.set(clave, valor); else u.searchParams.delete(clave);
  return u.pathname + (u.searchParams.toString() ? "?" + u.searchParams.toString() : "") + u.hash;
}
