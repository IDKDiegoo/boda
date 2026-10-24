

// ── Constantes ──────────────────────────────────────────────────
export const BODA_FECHA   = new Date("2027-11-27T19:00:00");
// El código de los novios ya NO vive acá (cualquiera lo leía en el JavaScript de la página): es la
// contraseña de esta cuenta de Firebase, y las reglas de la base solo dejan entrar a esta cuenta.
export const EMAIL_NOVIOS = "novios@boda-diego-camila.cl";
export const FOTOS_PIN    = "BODA27";

// ── Helpers ─────────────────────────────────────────────────────
export const fmt = (n: number) => "$" + n.toLocaleString("es-CL");
export const diasFaltantes = () => Math.ceil((BODA_FECHA.getTime() - Date.now()) / 86400000);
