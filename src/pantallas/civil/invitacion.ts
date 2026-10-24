import { SUG_CRONO_CIVIL } from "./datosCivil";

// ════════════════════════════════════════════════════════════════
// INVITACIONES DE LA BODA CIVIL
// La página pública es public/invitacion.html (link /i/{codigo}). Lee:
//   boda/invitacion                      → datos generales (lugar, hora, programa…)
//   boda/invitacion/invitados/{codigo}   → una por invitado: para quién es y su respuesta
// Cada invitado tiene un código propio, así cada link es distinto y su respuesta llega acá.
// ════════════════════════════════════════════════════════════════
export type InvItem   = { hora:string; actividad:string; detalle?:string; icono:string };
export type InvConfig = { lugarNombre:string; direccion:string; comoLlegar:string; mapsUrl:string; hora:string; limite:string; mensaje:string; programa:InvItem[]; musicaUrl:string; musicaInicio:string; musicaArchivo?:string; musicaNombre?:string };
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
