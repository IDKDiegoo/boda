
// ── Marca ───────────────────────────────────────────────────────
export const MARCA = "My Wedding";

// ── Constantes ──────────────────────────────────────────────────
// La fecha la fija la sesión con la de cada boda (fijarFecha); esta es la de Diego y Camila.
export let BODA_FECHA   = new Date("2027-11-27T19:00:00");
export const fijarFecha = (iso?: string) => { if (iso && !isNaN(new Date(iso).getTime())) BODA_FECHA = new Date(iso); };
// Se entra con USUARIO y contraseña. Por dentro, Firebase pide un correo: es `usuario` + este dominio,
// que no existe ni recibe nada. Las reglas de la base deciden según la boda que trae la cuenta.
export const DOMINIO_USUARIOS = "@mywedding.invalid";
export const correoDe = (usuario: string) => { const u = usuario.trim().toLowerCase(); return u.includes("@") ? u : u + DOMINIO_USUARIOS; };
// La cuenta compartida de antes (novios@…): sigue entrando mientras los teléfonos se pasan al usuario propio.
export const EMAIL_NOVIOS = "novios@boda-diego-camila.cl";

// ── Helpers ─────────────────────────────────────────────────────
export const fmt = (n: number) => "$" + n.toLocaleString("es-CL");
export const diasFaltantes = () => Math.ceil((BODA_FECHA.getTime() - Date.now()) / 86400000);
const MESES = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];
const MESES_L = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
/** «27 · NOV · 2027» */
export const fechaCorta = () => `${BODA_FECHA.getDate()} · ${MESES[BODA_FECHA.getMonth()]} · ${BODA_FECHA.getFullYear()}`;
/** «27 de Noviembre 2027» */
export const fechaLarga = () => `${BODA_FECHA.getDate()} de ${MESES_L[BODA_FECHA.getMonth()]} ${BODA_FECHA.getFullYear()}`;
