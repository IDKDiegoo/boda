const admin = require("firebase-admin");
const sa    = require("/Users/idk/ARAINv3/bot/firebase-service-account.json");

admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const tareas = [
  // ── BODA CIVIL · 18 dic 2026 ───────────────────────────────────
  { id:1, titulo:"Confirmar fecha en Registro Civil",       categoria:"Boda Civil",  prioridad:"alta",  hecho:false, fecha:"2026-12-18", notas:"Tramitar con anticipación" },
  { id:2, titulo:"Documentos legales (certificados, etc.)", categoria:"Boda Civil",  prioridad:"alta",  hecho:false, fecha:"2026-11-15", notas:"" },
  { id:3, titulo:"Confirmar testigos boda civil",           categoria:"Boda Civil",  prioridad:"alta",  hecho:false, fecha:"2026-12-01", notas:"Se necesitan 2 testigos" },
  { id:4, titulo:"Definir invitados boda civil",            categoria:"Boda Civil",  prioridad:"media", hecho:false, fecha:"", notas:"" },
  { id:5, titulo:"Contratar animador boda civil",           categoria:"Boda Civil",  prioridad:"media", hecho:false, fecha:"", notas:"" },
  { id:6, titulo:"Cabina de fotos boda civil",              categoria:"Boda Civil",  prioridad:"media", hecho:false, fecha:"", notas:"" },
  { id:7, titulo:"Reservar lugar para celebración civil",   categoria:"Boda Civil",  prioridad:"alta",  hecho:false, fecha:"", notas:"" },
  { id:8, titulo:"Organizar comida / celebración civil",    categoria:"Boda Civil",  prioridad:"media", hecho:false, fecha:"", notas:"" },
  { id:9, titulo:"Vestimenta para el civil",                categoria:"Boda Civil",  prioridad:"media", hecho:false, fecha:"", notas:"" },
  { id:10,titulo:"Fotógrafo para la boda civil",            categoria:"Boda Civil",  prioridad:"media", hecho:false, fecha:"", notas:"" },

  // ── MATRIMONIO · 27 nov 2027 ───────────────────────────────────
  { id:11,titulo:"Comprar los anillos",                     categoria:"Matrimonio",  prioridad:"alta",  hecho:false, fecha:"2027-06-01", notas:"" },
  { id:12,titulo:"Confirmar recinto / lugar",               categoria:"Matrimonio",  prioridad:"alta",  hecho:false, fecha:"2027-01-01", notas:"" },
  { id:13,titulo:"Contratar fotógrafo",                     categoria:"Matrimonio",  prioridad:"alta",  hecho:false, fecha:"2027-03-01", notas:"Pancho Jorquez ya confirmado" },
  { id:14,titulo:"Contratar animador",                      categoria:"Matrimonio",  prioridad:"alta",  hecho:false, fecha:"2027-04-01", notas:"" },
  { id:15,titulo:"Cabina de fotos",                         categoria:"Matrimonio",  prioridad:"media", hecho:false, fecha:"", notas:"" },
  { id:16,titulo:"Catering / comida",                       categoria:"Matrimonio",  prioridad:"alta",  hecho:false, fecha:"2027-05-01", notas:"" },
  { id:17,titulo:"Torta de matrimonio",                     categoria:"Matrimonio",  prioridad:"media", hecho:false, fecha:"2027-08-01", notas:"" },
  { id:18,titulo:"Lista definitiva de invitados",           categoria:"Matrimonio",  prioridad:"alta",  hecho:false, fecha:"2027-02-01", notas:"" },
  { id:19,titulo:"Diseño y envío de invitaciones",          categoria:"Matrimonio",  prioridad:"media", hecho:false, fecha:"2027-06-01", notas:"" },
  { id:20,titulo:"Vestido de novia",                        categoria:"Matrimonio",  prioridad:"alta",  hecho:false, fecha:"2027-04-01", notas:"Requiere tiempo para confección" },
  { id:21,titulo:"Terno / ropa del novio",                  categoria:"Matrimonio",  prioridad:"media", hecho:false, fecha:"2027-06-01", notas:"" },
  { id:22,titulo:"Decoraciones y arreglos florales",        categoria:"Matrimonio",  prioridad:"media", hecho:false, fecha:"2027-07-01", notas:"" },
  { id:23,titulo:"Música / DJ o banda",                     categoria:"Matrimonio",  prioridad:"media", hecho:false, fecha:"2027-05-01", notas:"" },
  { id:24,titulo:"Transporte para los novios",              categoria:"Matrimonio",  prioridad:"baja",  hecho:false, fecha:"", notas:"" },
  { id:25,titulo:"Mesa de dulces / candy bar",              categoria:"Matrimonio",  prioridad:"baja",  hecho:false, fecha:"", notas:"" },
  { id:26,titulo:"Planificar luna de miel",                 categoria:"Matrimonio",  prioridad:"media", hecho:false, fecha:"2027-08-01", notas:"" },
  { id:27,titulo:"Contratar maquillaje y peinado",          categoria:"Matrimonio",  prioridad:"media", hecho:false, fecha:"2027-09-01", notas:"" },
  { id:28,titulo:"Ramo de flores de la novia",              categoria:"Matrimonio",  prioridad:"media", hecho:false, fecha:"2027-10-01", notas:"" },
];

async function main() {
  await db.collection("boda").doc("checklist").set({ tareas });
  console.log(`✅ ${tareas.length} tareas guardadas en Firestore (boda/checklist)`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
