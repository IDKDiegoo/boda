// Guarda un documento aplicando solo lo que cambió en este teléfono (ver ./fusionar.js).
//
// 🔴 11-nov-2026 · «escribo y se me borra lo que estoy escribiendo, y dice sin conexión»:
//  1. Los campos que guardan con cada letra lanzaban una transacción por letra. Una transacción no se
//     ve en el teléfono hasta que el servidor la confirma, así que al llegar la confirmación de la letra
//     anterior la pantalla volvía a ese texto y se comía lo último que se había escrito.
//  2. Sin señal la transacción falla («client is offline»): el cambio se perdía y el texto volvía atrás.
// Ahora los cambios de un documento van en fila (uno a la vez, juntando los que se acumulan mientras
// tanto), la pantalla no se pisa mientras haya algo por guardar (ver useDocVivo en ./hooks) y, si no hay
// conexión, se reintenta solo hasta que vuelva la señal. Nunca se descarta lo que se escribió.
import { DocumentReference, runTransaction } from "firebase/firestore";
import { db } from "./firebase";
import { fusionarDoc } from "./fusionar";

export async function guardarFusionando(ref: DocumentReference, antes: object, despues: object) {
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    tx.set(ref, fusionarDoc(snap.exists() ? snap.data() : null, antes, despues));
  });
}

// ── Estado del guardado, para el aviso de la pantalla ──────────────
export type EstadoGuardado = "ok" | "guardando" | "sin-conexion";
let estado: EstadoGuardado = "ok";
const oyentes = new Set<(e: EstadoGuardado) => void>();
const avisar = (e: EstadoGuardado) => { if (e !== estado) { estado = e; oyentes.forEach(f => f(e)); } };
export const estadoGuardado = () => estado;
export const oirGuardado = (f: (e: EstadoGuardado) => void) => { oyentes.add(f); return () => { oyentes.delete(f); }; };

type Fila = { ref: DocumentReference; antes: object | null; despues: object | null; corriendo: boolean; esperas: (() => void)[] };
const filas = new Map<string, Fila>();
const pendientes = () => Array.from(filas.values()).some(f => f.corriendo || f.despues);
const esperar = (ms: number) => new Promise(r => setTimeout(r, ms));
const hayRed = () => new Promise<void>(r => {
  if (typeof navigator === "undefined" || navigator.onLine) { setTimeout(r, 0); return; }
  const f = () => { window.removeEventListener("online", f); r(); };
  window.addEventListener("online", f);
});

/**
 * Pone un cambio en la fila del documento. Resuelve cuando el cambio (o uno posterior que lo incluye)
 * quedó guardado en el servidor. No falla nunca: si no hay conexión, espera y reintenta.
 */
export function encolarGuardado(ref: DocumentReference, antes: object, despues: object): Promise<void> {
  let f = filas.get(ref.path);
  if (!f) { f = { ref, antes: null, despues: null, corriendo: false, esperas: [] }; filas.set(ref.path, f); }
  // Los cambios que esperan se juntan: desde el «antes» del primero hasta el «después» del último.
  if (!f.despues) f.antes = antes;
  f.despues = despues;
  const listo = new Promise<void>(r => f!.esperas.push(r));
  if (!f.corriendo) correr(f);
  return listo;
}

async function correr(f: Fila) {
  f.corriendo = true; avisar("guardando");
  let fallos = 0;
  while (f.despues) {
    const antes = f.antes!, despues = f.despues, esperas = f.esperas;
    f.antes = null; f.despues = null; f.esperas = [];
    for (;;) {
      if (!navigator.onLine) avisar("sin-conexion");
      try { await guardarFusionando(f.ref, antes, despues); fallos = 0; avisar("guardando"); break; }
      catch (e: any) {
        if (e?.code === "permission-denied") { console.error("No se pudo guardar (sin permiso):", f.ref.path, e); break; }
        fallos++;
        if (fallos >= 2 || !navigator.onLine) avisar("sin-conexion");
        await hayRed(); await esperar(Math.min(15000, 1000 * 2 ** Math.min(fallos, 4)));
      }
    }
    esperas.forEach(r => r());
  }
  f.corriendo = false;
  if (!pendientes()) avisar("ok");
}

// Avisa al cerrar o recargar la página si quedó algo sin guardar, y muestra al tiro si se cortó la señal.
if (typeof window !== "undefined") {
  window.addEventListener("offline", () => { if (pendientes()) avisar("sin-conexion"); });
  window.addEventListener("online", () => { if (pendientes()) avisar("guardando"); });
  window.addEventListener("beforeunload", e => { if (pendientes()) { e.preventDefault(); e.returnValue = ""; } });
}
