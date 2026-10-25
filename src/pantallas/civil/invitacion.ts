import { SUG_CRONO_CIVIL } from "./datosCivil";

// ════════════════════════════════════════════════════════════════
// INVITACIONES DE LA BODA CIVIL
// La página pública es public/invitacion.html (link /i/{codigo}). Lee:
//   boda/invitacion                      → datos generales (lugar, hora, programa…)
//   boda/invitacion/invitados/{codigo}   → una por invitado: para quién es y su respuesta
// Cada invitado tiene un código propio, así cada link es distinto y su respuesta llega acá.
// ════════════════════════════════════════════════════════════════
export type InvItem   = { hora:string; actividad:string; detalle?:string; icono:string };
export type InvConfig = { lugarNombre:string; direccion:string; comoLlegar:string; mapsUrl:string; hora:string; limite:string; mensaje:string; programa:InvItem[]; musicaUrl:string; musicaInicio:string; musicaArchivo?:string; musicaNombre?:string;
  // My Wedding: lo que cada pareja personaliza (vacío en la boda original = queda lo que ya tenía su invitación)
  nombre1?:string; nombre2?:string; fecha?:string; ciudad?:string; titulo?:string; foto?:string; fotoTexto?:string; frase?:string; fraseCita?:string;
  celebracion?:string; celebracionNota?:string; vestimenta?:string; vestimentaTexto?:string; vestimentaNota?:string; regalos?:string; regalosNota?:string; paleta?:string };
// Colores de la invitación: [principal, claro, oscuro, más oscuro]. Iguales a los de public/invitacion.html.
export const PALETAS: { id:string; nombre:string; colores:string[] }[] = [
  { id:"salvia", nombre:"Verde salvia", colores:["#7f8c6c","#8a9778","#5d694e","#3f4a36"] },
  { id:"rosa", nombre:"Rosa empolvado", colores:["#b98a8f","#c49aa0","#8f5f66","#5e3a40"] },
  { id:"azul", nombre:"Azul niebla", colores:["#7d8fa8","#8c9db4","#566a85","#36465c"] },
  { id:"terracota", nombre:"Terracota", colores:["#b8806a","#c4917c","#8e5a45","#5c3a2c"] },
  { id:"champana", nombre:"Champaña", colores:["#b59a6a","#c2aa7d","#8a7148","#5a4a2e"] },
  { id:"burdeo", nombre:"Burdeo", colores:["#8e4a57","#9c5c68","#6a2f3c","#45202a"] },
  { id:"negro", nombre:"Blanco y negro", colores:["#6e6e6e","#808080","#3d3d3d","#1f1f1f"] },
];
export type InvRespuesta = { asiste:boolean; comida?:string[]; cancion?:string; deseo?:string; fecha:string };
// `acompanantes`: personas de la lista que van con esta invitación (un niño con su mamá, un abuelito con su hija).
// No tienen link propio: cuando responde la persona principal, la respuesta vale para todos.
export type InvAcomp = { invitadoId:number; nombre:string };
export type InvPersona = { codigo:string; para:string; invitadoId?:number; enviada?:boolean; vistas?:number; abierta?:any; respuesta?:InvRespuesta; acompanantes?:InvAcomp[] };
export const cuantos = (p:InvPersona) => 1 + (p.acompanantes?.length || 0);

export const INV_ICONOS: [string,string][] = [["anillos","💍 Anillos"],["parrilla","🔥 Parrilla"],["plato","🍽️ Plato"],["copas","🥂 Copas"],["torta","🎂 Torta"],["camara","📷 Cámara"],["musica","🎵 Música"],["atardecer","🌅 Atardecer"]];
export const iconoPara = (t:string) => {
  const x = t.toLowerCase();
  if (/asado|parrill|carne/.test(x)) return "parrilla";
  if (/almuerzo|comida|cena|once/.test(x)) return "plato";
  if (/brindis|palabras|cóctel|coctel|bebida/.test(x)) return "copas";
  if (/torta|café|cafe|postre/.test(x)) return "torta";
  if (/foto|juego/.test(x)) return "camara";
  if (/música|musica|baile|bailar/.test(x)) return "musica";
  if (/cierre|despedida|atardecer/.test(x)) return "atardecer";
  return "anillos";
};
/** Lo que trae una invitación nueva. La boda original conserva sus datos de siempre. */
export const invBase = (original:boolean, nombre = ""): InvConfig => original ? INV_BASE : {
  ...INV_BASE, lugarNombre:"", direccion:"", comoLlegar:"", limite:"", programa:[], paleta:"salvia",
  nombre1: nombre.split(/\s*&\s*|\s+y\s+/)[0] || "", nombre2: nombre.split(/\s*&\s*|\s+y\s+/)[1] || "", titulo:"¡Nos casamos!",
};
export const INV_BASE: InvConfig = {
  lugarNombre:"Parcela en Lampa", direccion:"Lampa, Región Metropolitana", comoLlegar:"A unos 40 minutos de Santiago",
  mapsUrl:"", hora:"13:00", limite:"1 de diciembre", mensaje:"Queremos que estés con nosotros el día en que unimos nuestras vidas.", musicaUrl:"", musicaInicio:"",
  programa: SUG_CRONO_CIVIL.map(([hora,actividad])=>({ hora, actividad, detalle:"", icono:iconoPara(actividad) })),
};
// Códigos sin letras que se confunden (0/o, 1/l)
export const nuevoCodigo = () => Array.from({length:7}, ()=>"abcdefghijkmnpqrstuvwxyz23456789"[Math.floor(Math.random()*32)]).join("");
export const linkDe = (codigo:string) => `${window.location.origin}/i/${codigo}`;
// Vista previa por el OTRO dominio de la app: así el iPhone la abre en Safari y no dentro de la app instalada
// en el inicio (ahí no suena la música con el teléfono en silencio). Ambos dominios son el mismo sitio.
export const DOMINIOS_BODA = ["https://boda-4ype.vercel.app", "https://boda-eight-psi.vercel.app"];
export const origenVista = () => DOMINIOS_BODA.find(d => d !== window.location.origin) || window.location.origin;
// Mismo criterio que la página de la invitación para reconocer el video
export const idYoutube = (url:string) => (String(url).match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/|\/live\/)([A-Za-z0-9_-]{11})/) || [])[1] || null;
