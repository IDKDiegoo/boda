// Guarda un documento aplicando solo lo que cambió en este teléfono (ver ./fusionar.js).
import { DocumentReference, runTransaction } from "firebase/firestore";
import { db } from "./firebase";
import { fusionarDoc } from "./fusionar";

export async function guardarFusionando(ref: DocumentReference, antes: object, despues: object) {
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    tx.set(ref, fusionarDoc(snap.exists() ? snap.data() : null, antes, despues));
  });
}
