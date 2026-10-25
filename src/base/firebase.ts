import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, ref, connectStorageEmulator } from "firebase/storage";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getMessaging, getToken } from "firebase/messaging";

// ── Firebase ────────────────────────────────────────────────────
export const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyAc0WdoLmTjfR-ucxAON1Lr9abcQAeHM-4",
  authDomain:        "arain-database.firebaseapp.com",
  projectId:         "arain-database",
  storageBucket:     "arain-database.firebasestorage.app",
  messagingSenderId: "541671718502",
  appId:             "1:541671718502:web:ed236770ea20bd34cf37a7"
};
export const app  = initializeApp(FIREBASE_CONFIG);
export const db   = getFirestore(app);
export const stor = getStorage(app);
export const auth = getAuth(app);
// Solo para probar en el Mac contra los emuladores (npm run build con REACT_APP_EMULADOR=1). En producción no existe.
if (process.env.REACT_APP_EMULADOR === "1") {
  connectFirestoreEmulator(db, "127.0.0.1", 8098); connectStorageEmulator(stor, "127.0.0.1", 9198);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
}

// ── De qué boda son los datos (My Wedding: varias parejas) ──
// Se fija al iniciar sesión. La boda original (Diego y Camila) vive en /boda; las demás en
// /bodas/{id}/datos. Así la de ellos no se movió: sus links, respuestas y los programas del Mac
// siguen funcionando igual.
export const LEGADO = "diego-camila";
let BODA_ID = "";
export const fijarBoda = (id: string) => { BODA_ID = id; };
export const bodaActual = () => BODA_ID;
const raiz = (): [string, ...string[]] => BODA_ID === LEGADO ? ["boda"] : ["bodas", BODA_ID, "datos"];
/** Documento de la boda actual: dref("invitacion") · dref("invitacion","invitados",codigo) */
export const dref = (...segs: string[]) => { const r = raiz(); return doc(db, r[0], ...r.slice(1), ...segs); };
export const cref = (...segs: string[]) => { const r = raiz(); return collection(db, r[0], ...r.slice(1), ...segs); };
/** Archivo de la boda actual. La original conserva sus carpetas de siempre. */
/** Índice público de links (/i/{codigo} → boda). La boda original no lo usa: sus links ya funcionan. */
export const indiceInv = (codigo: string) => BODA_ID === LEGADO ? null : doc(db, "invitaciones", codigo);
/** Lo que se sabe de la boda actual (nombre, fecha, módulos), para títulos y textos. */
export type InfoBoda = { id: string; nombre: string; fecha?: string; modulos?: Record<string, boolean>; estado?: string; legado?: boolean; foto?: string };
let INFO: InfoBoda = { id: "", nombre: "" };
export const fijarInfo = (i: InfoBoda) => { INFO = i; };
export const infoBoda = () => INFO;
export const sref = (ruta: string) => ref(stor, BODA_ID === LEGADO ? ruta : `bodas/${BODA_ID}/${ruta.replace(/^fotos-boda/, "fotos")}`);
export let messaging: any = null;
try { messaging = getMessaging(app); } catch(e) { console.warn("FCM no disponible:", e); }

export const VAPID_KEY = "BF8iV0eX06sZu_rJyPrTFeGZtB1d8qWoqrM_zFsU62CEUM6XXnwrL7ylpQzKMiCYrVF6pUPrVxJUyHfvR8keRZg";

export async function initFCM() {
  try {
    if (!messaging || !("Notification" in window)) return;
    if ("serviceWorker" in navigator) {
      await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (!token) return;
    // Un registro por teléfono: si el token se renueva, se reemplaza el del mismo teléfono (antes se acumulaban
    // y la misma notificación llegaba 2 y 3 veces). El token se saca de la lista vieja `tokens`.
    const docRef = dref("notif");
    let disp = localStorage.getItem("boda_dispositivo");
    if (!disp) { disp = Math.random().toString(36).slice(2, 12); localStorage.setItem("boda_dispositivo", disp); }
    const { updateDoc, arrayRemove } = await import("firebase/firestore");
    await setDoc(docRef, { dispositivos: { [disp]: { token, fecha: new Date().toISOString() } } }, { merge: true });
    await updateDoc(docRef, { tokens: arrayRemove(token) }).catch(() => {});
  } catch(e) { console.error("FCM boda:", e); }
}
