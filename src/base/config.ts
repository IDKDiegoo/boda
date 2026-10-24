

// ── Constantes ──────────────────────────────────────────────────
export const BODA_FECHA   = new Date("2027-11-27T19:00:00");
export const ACCESO_PIN   = "2711";
export const FOTOS_PIN    = "BODA27";

// ── Helpers ─────────────────────────────────────────────────────
export const fmt = (n: number) => "$" + n.toLocaleString("es-CL");
export const diasFaltantes = () => Math.ceil((BODA_FECHA.getTime() - Date.now()) / 86400000);
