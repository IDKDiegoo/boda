import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
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
    const docRef = doc(db, "boda", "notif");
    let disp = localStorage.getItem("boda_dispositivo");
    if (!disp) { disp = Math.random().toString(36).slice(2, 12); localStorage.setItem("boda_dispositivo", disp); }
    const { updateDoc, arrayRemove } = await import("firebase/firestore");
    await setDoc(docRef, { dispositivos: { [disp]: { token, fecha: new Date().toISOString() } } }, { merge: true });
    await updateDoc(docRef, { tokens: arrayRemove(token) }).catch(() => {});
  } catch(e) { console.error("FCM boda:", e); }
}
