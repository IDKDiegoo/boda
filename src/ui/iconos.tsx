import React from "react";

// ═══════════════════════════════════════════════════════════════════
// ÍCONOS DE LÍNEA (My Wedding) — reemplazan a los emojis del menú, los títulos y las tarjetas.
// Trazo fino y redondeado, 24×24, toman el color del texto (currentColor).
// ═══════════════════════════════════════════════════════════════════
const P: Record<string, React.ReactNode> = {
  inicio: <><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/></>,
  invitados: <><circle cx="9" cy="8" r="3.2"/><path d="M3 20c.6-3.4 3-5.5 6-5.5s5.4 2.1 6 5.5"/><path d="M16 4.6a3.2 3.2 0 0 1 0 6.3"/><path d="M18 14.8c1.7.8 2.8 2.6 3 5.2"/></>,
  mesas: <><ellipse cx="12" cy="9" rx="8" ry="3.2"/><path d="M12 12.2V20"/><path d="M8 20h8"/><path d="M4 9v1.5M20 9v1.5"/></>,
  presupuesto: <><rect x="3" y="6" width="18" height="14" rx="2.5"/><path d="M3 10h18"/><path d="M16 15h2"/><path d="M7 6V4.5A1.5 1.5 0 0 1 8.5 3h7A1.5 1.5 0 0 1 17 4.5V6"/></>,
  proveedores: <><path d="M3 9.5 7 6l4 2 2-1 4 2.5 4 1.5"/><path d="M3 9.5V15l4.5 4 3-2 3 2.5 2-1.5 4.5-3.5V11"/><path d="m10.5 17 2.5-2.5M13.5 19.5 16 17"/></>,
  decoraciones: <><path d="M12 7.5c1.2-2.6 4.8-2.6 5 .3.2 2.3-2.4 3.4-5 4.7-2.6-1.3-5.2-2.4-5-4.7.2-2.9 3.8-2.9 5-.3Z"/><path d="M12 12.5V21"/><path d="M12 17c-1.8-1.6-4-1.8-5.5-.8M12 15.5c1.6-1.4 3.6-1.6 5-.7"/></>,
  programa: <><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></>,
  musica: <><path d="M9 18V5.5l11-2V16"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/></>,
  regalos: <><rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v8h14v-8"/><path d="M12 8v12"/><path d="M12 8C10.5 4.5 7 4.2 7 6.4 7 8 9.5 8 12 8Zm0 0c1.5-3.5 5-3.8 5-1.6C17 8 14.5 8 12 8Z"/></>,
  invitaciones: <><rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.5 7 8.5 6.2L20.5 7"/></>,
  luna: <><path d="M3 15.5 21 8l-2.4-1.5-6.3 1.8L7.5 4 5.8 5l2.6 4.2-3.6 1-1.8-1.2L2 9.8z"/><path d="M3 20h18"/></>,
  deptos: <><rect x="5" y="3" width="10" height="18" rx="1"/><path d="M15 9h4v12h-4"/><path d="M8 7h1M11 7h1M8 11h1M11 11h1M8 15h1M11 15h1"/><path d="M9 21v-3h2v3"/></>,
  pendientes: <><rect x="4" y="3.5" width="16" height="17" rx="2.5"/><path d="m8 9 1.5 1.5L12.5 7.5"/><path d="M14.5 9.5H17"/><path d="m8 15 1.5 1.5 3-3"/><path d="M14.5 15.5H17"/></>,
  juegos: <><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><circle cx="8.5" cy="8.5" r="1" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1" fill="currentColor"/></>,
  galeria: <><rect x="3" y="5" width="18" height="15" rx="2.5"/><circle cx="12" cy="12.5" r="3.5"/><path d="M8 5l1.5-2h5L16 5"/></>,
  qr: <><rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.2"/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1.2"/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1.2"/><path d="M14 14h2.5v2.5H14zM18 18h2.5v2.5H18zM14 18.5v2M18.5 14h2"/></>,
  anillos: <><circle cx="9" cy="14" r="5.5"/><circle cx="15" cy="14" r="5.5"/><path d="m13.5 4.5 1.5-2 1.5 2-1.5 1.8z"/></>,
  corazon: <><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z"/></>,
  mas: <><path d="M12 5v14M5 12h14"/></>,
  menu: <><circle cx="5" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="19" cy="12" r="1.3" fill="currentColor"/></>,
  cerrar: <><path d="M6 6l12 12M18 6 6 18"/></>,
  salir: <><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 16l-4-4 4-4M6 12h10"/></>,
  buscar: <><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></>,
  check: <><path d="m5 12.5 4.5 4.5L19 7.5"/></>,
  calendario: <><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></>,
  estrella: <><path d="m12 3.5 2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.9l-5.3 2.7 1-5.8-4.2-4.1 5.9-.9z"/></>,
  brillo: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></>,
  campana: <><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></>,
  flecha: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
  volver: <><path d="M19 12H5M11 6l-6 6 6 6"/></>,
  lapiz: <><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/></>,
  basura: <><path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 12.5A1.5 1.5 0 0 0 8.5 21h7a1.5 1.5 0 0 0 1.5-1.5L18 7"/><path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7"/></>,
  equis: <><path d="M7 7l10 10M17 7 7 17"/></>,
  reloj: <><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></>,
  soporte: <><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5"/><path d="m6 6 3.5 3.5M14.5 14.5 18 18M18 6l-3.5 3.5M9.5 14.5 6 18"/></>,
};
// Los títulos de las pantallas todavía llaman con su emoji de siempre: se traduce acá.
const DE_EMOJI: Record<string, string> = { "💍":"anillos", "👥":"invitados", "🪑":"mesas", "💰":"presupuesto", "🤝":"proveedores", "🌸":"decoraciones",
  "🎵":"musica", "🎁":"regalos", "💒":"invitaciones", "✈️":"luna", "✅":"pendientes", "📷":"galeria", "📱":"qr", "🏢":"deptos", "🎲":"juegos" };
export const iconoDe = (nombreOEmoji: string) => P[nombreOEmoji] ? nombreOEmoji : DE_EMOJI[nombreOEmoji] || "";

export function Icono({ n, tam = 20, grosor = 1.7, style }: { n: string; tam?: number; grosor?: number; style?: React.CSSProperties }) {
  const k = iconoDe(n);
  if (!k) return <span style={{ fontSize: tam * .9, lineHeight: 1, ...style }}>{n}</span>;   // sin ícono propio: queda el emoji
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" style={{ flexShrink: 0, display: "inline-block", verticalAlign: "-0.2em", ...style }}>{P[k]}</svg>
  );
}
