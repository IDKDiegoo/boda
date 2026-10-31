import { useEffect, useState } from "react";
import { deleteField, doc, onSnapshot, runTransaction, serverTimestamp, Timestamp, updateDoc } from "firebase/firestore";
import { db } from "../../base/firebase";

// ═══════════════════════════════════════════════════════════════════
// SALAS DE JUEGO EN GRUPO (30-oct-2026)
// El que abre el juego crea /salas/{código}; los demás entran con el QR o el código, sin cuenta.
// Cada teléfono tiene un id propio (pid) guardado en el teléfono. La sala vence a las 12 h.
// Un solo documento por sala: lo escuchan todos (onSnapshot), sin consultas periódicas.
// ═══════════════════════════════════════════════════════════════════

export type JuegoSala = "impostor" | "mimica" | "rosco" | "probable" | "quien";
export type JugSala = { n: string; t: number };
export type Sala = {
  id: string; b: string; j: JuegoSala; host: string; est: "lobby" | "juego";
  jug: Record<string, JugSala>; cfg: any; ron: any; v: Record<string, any>; mesa?: number | null;
};

const LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";       // sin 0/O ni 1/I, que se confunden
const nuevoCodigo = () => Array.from({ length: 5 }, () => LETRAS[Math.floor(Math.random() * LETRAS.length)]).join("");
export const limpiarCodigo = (c: string) => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);

// Lo que el teléfono recuerda (id, nombre, salas en que entró). Si el navegador no deja guardar nada
// (modo privado, el navegador de WhatsApp), igual queda en memoria mientras la página esté abierta:
// antes el id cambiaba en cada llamada y la sala dejaba de reconocer al invitado.
const MEMORIA: Record<string, string> = {};
const leer = (k: string) => { try { const v = localStorage.getItem(k); if (v != null) return v; } catch { /* nada */ } try { const v = sessionStorage.getItem(k); if (v != null) return v; } catch { /* nada */ } return MEMORIA[k] ?? null; };
const guardar = (k: string, v: string) => { MEMORIA[k] = v; try { localStorage.setItem(k, v); } catch { try { sessionStorage.setItem(k, v); } catch { /* nada */ } } };

/** Id de este teléfono (no es una cuenta: solo para saber quién es quién en la sala). */
export function miPid(): string {
  let p = leer("mw_pid");
  if (!p) { p = Math.random().toString(36).slice(2, 12); guardar("mw_pid", p); }
  return p;
}
export const miNombre = () => leer("mw_nombre") || "";
const guardarNombre = (n: string) => guardar("mw_nombre", n);
/** ¿Este teléfono ya había entrado a la sala? (para volver a entrar solo si la sala lo perdió). */
export const yaEstuve = (codigo: string) => leer(`mw_sala_${codigo}`) === "1";

export const urlSala = (codigo: string) => `${window.location.origin}/?sala=${codigo}`;
export const qrDe = (texto: string, tam = 240) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${tam}x${tam}&margin=0&data=${encodeURIComponent(texto)}&bgcolor=ffffff&color=2c1424`;

export async function crearSala(b: string, j: JuegoSala, nombre: string, cfg: any, mesa?: number | null): Promise<string> {
  const pid = miPid(); const n = nombre.trim().slice(0, 24); guardarNombre(n);
  for (let intento = 0; intento < 5; intento++) {
    const codigo = nuevoCodigo(), ref = doc(db, "salas", codigo);
    const ok = await runTransaction(db, async tx => {
      if ((await tx.get(ref)).exists()) return false;
      tx.set(ref, { b, j, host: pid, est: "lobby", jug: { [pid]: { n, t: Date.now() } }, cfg: cfg || {}, ron: {}, v: {},
        mesa: mesa ?? null, creada: serverTimestamp(), expira: Timestamp.fromMillis(Date.now() + 12 * 3600 * 1000) });
      return true;
    });
    if (ok) { guardar(`mw_sala_${codigo}`, "1"); return codigo; }
  }
  throw new Error("No se pudo crear la sala. Intenta de nuevo.");
}

export async function unirse(codigo: string, nombre: string) {
  const n = nombre.trim().slice(0, 24); guardarNombre(n);
  await updateDoc(doc(db, "salas", codigo), { [`jug.${miPid()}`]: { n, t: Date.now() } });
  guardar(`mw_sala_${codigo}`, "1");
}
export const salir = (codigo: string) => { guardar(`mw_sala_${codigo}`, "0"); return updateDoc(doc(db, "salas", codigo), { [`jug.${miPid()}`]: deleteField(), [`v.${miPid()}`]: deleteField() }).catch(() => {}); };

/** Cambia campos de la sala. Acepta rutas con punto ("ron.fase", `v.${pid}`). */
export const cambiar = (codigo: string, patch: Record<string, any>) => updateDoc(doc(db, "salas", codigo), patch);
export const borrarCampo = deleteField;

/** La sala en vivo. undefined = cargando · null = no existe o venció. */
export function useSala(codigo: string): [Sala | null | undefined, string] {
  const [sala, setSala] = useState<Sala | null | undefined>(undefined);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!codigo) { setSala(null); return; }
    return onSnapshot(doc(db, "salas", codigo), s => {
      if (!s.exists()) { setSala(null); return; }
      const d: any = s.data();
      if (d.expira?.toMillis && d.expira.toMillis() < Date.now()) { setSala(null); return; }
      setSala({ id: s.id, jug: {}, v: {}, ron: {}, cfg: {}, ...d });
    }, e => setError(e.code === "permission-denied" ? "No tienes acceso a esta sala." : "Sin conexión. Revisa tu internet."));
  }, [codigo]);
  return [sala, error];
}

/** Jugadores en orden de llegada. */
export const jugadores = (s: Sala) => Object.entries(s.jug || {}).sort((a, b) => a[1].t - b[1].t).map(([pid, j]) => ({ pid, ...j }));
/** Quién manda: el que creó la sala; si se fue, el más antiguo que queda. */
export const anfitrion = (s: Sala) => (s.jug || {})[s.host] ? s.host : (jugadores(s)[0]?.pid || s.host);

/** Segundos que faltan para `fin` (milisegundos). Se calcula en cada render (nunca queda un valor viejo
 *  justo cuando cambia `fin`) y un intervalo solo fuerza a volver a dibujar mientras corre. */
export function useFaltan(fin: number | undefined, pausado = false) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!fin || pausado) return;
    const t = setInterval(() => setTick(x => x + 1), 250);
    return () => clearInterval(t);
  }, [fin, pausado]);
  return Math.max(0, Math.ceil(((fin || 0) - Date.now()) / 1000));
}

/** Mientras se juega, la pantalla no se apaga (si se apaga, algunos teléfonos recargan la página al volver). */
export function usePantallaEncendida(activo: boolean) {
  useEffect(() => {
    if (!activo || !(navigator as any).wakeLock) return;
    let lock: any = null, vivo = true;
    const pedir = async () => { try { if (vivo && document.visibilityState === "visible") lock = await (navigator as any).wakeLock.request("screen"); } catch { /* sin permiso */ } };
    const alVolver = () => { if (document.visibilityState === "visible") pedir(); };
    pedir(); document.addEventListener("visibilitychange", alVolver);
    return () => { vivo = false; document.removeEventListener("visibilitychange", alVolver); try { lock?.release(); } catch { /* nada */ } };
  }, [activo]);
}
