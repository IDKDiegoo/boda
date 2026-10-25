import React, { useEffect, useRef, useState } from "react";

// ═══════════════════════════════════════════════════════════════════
// PIEZAS DE LOS JUEGOS (v2, 25-oct-2026)
// Lo que comparten: guardar en el teléfono, íconos dibujados, escenario con fondo animado, carta que
// se da vuelta, mazo que se desliza con el dedo, confeti, anillo de tiempo y vibración.
// 💰 Nada de esto escribe en la base: cada partida vive en el teléfono donde se juega.
// ═══════════════════════════════════════════════════════════════════

export function leerLocal<T>(clave: string, defecto: T): T {
  try { const v = localStorage.getItem("juegos_" + clave); return v ? { ...defecto as any, ...JSON.parse(v) } : defecto; }
  catch { return defecto; }
}
export function leerLista(clave: string): string[] {
  try { const v = localStorage.getItem("juegos_" + clave); return v ? JSON.parse(v) : []; } catch { return []; }
}
export function guardarLocal(clave: string, valor: unknown) {
  try { localStorage.setItem("juegos_" + clave, JSON.stringify(valor)); } catch { /* sin espacio o modo privado */ }
}
/** Un toquecito de vibración (Android; el iPhone lo ignora). */
export const vibrar = (ms: number | number[] = 12) => { try { (navigator as any).vibrate?.(ms); } catch { /* nada */ } };

export const C = {
  cafe: "#5c3d2e", dorado: "#c9956a", suave: "#a07855", crema: "#fdf8f3", borde: "#f0e0d0",
  vino: "#7a2440", vinoOscuro: "#3d0f20", rosa: "#e8a0b4",
};

// ── Íconos dibujados de cada juego (blancos, sobre el color del juego) ──
const ICONOS: Record<string, React.ReactNode> = {
  fuego: <><path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.4 2.4-5.4 3.6-8.3.4 2 1.4 3.2 2.6 3.8C11.6 6.7 13 4.2 15.4 3c-.5 2.8.4 4.6 1.7 6.3 1.1 1.4 1.9 3 1.9 5.2C19 18.3 16 21 12 21Z"/><path d="M12 21c-1.8 0-3-1.2-3-2.9 0-1.6 1.2-2.6 1.8-4 .4 1 1 1.6 1.6 1.9.5-1.3 1.3-2.3 2.3-2.8-.2 1.6.3 2.4.8 3.3.4.6.6 1.2.6 1.9 0 1.6-1.5 2.6-3.1 2.6Z"/></>,
  charla: <><path d="M4 5.5h11a2 2 0 0 1 2 2V13a2 2 0 0 1-2 2H9l-4 3.2V15H4a2 2 0 0 1-2-2V7.5a2 2 0 0 1 2-2Z"/><path d="M17 9h3a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1v2.5L16 18h-3"/></>,
  balanza: <><path d="M12 3v18M7 21h10M4 7h16"/><path d="M6.5 7 3.5 13.5a3 3 0 0 0 6 0L6.5 7ZM17.5 7l-3 6.5a3 3 0 0 0 6 0l-3-6.5Z"/></>,
  cerebro: <><path d="M9.5 4A3 3 0 0 0 6.6 6.3 3 3 0 0 0 4.5 11a3 3 0 0 0 1 5.3A3 3 0 0 0 9.5 20h.5V4h-.5ZM14.5 4a3 3 0 0 1 2.9 2.3 3 3 0 0 1 2.1 4.7 3 3 0 0 1-1 5.3 3 3 0 0 1-4 3.7H14V4h.5Z"/></>,
  dados: <><rect x="2.5" y="8" width="11" height="11" rx="2.5"/><path d="M10 5.5 12.8 3a2 2 0 0 1 2.8.1l5.3 5.6a2 2 0 0 1-.1 2.8L17.5 14"/><circle cx="6" cy="11.5" r=".9" fill="currentColor"/><circle cx="10" cy="15.5" r=".9" fill="currentColor"/><circle cx="16.3" cy="7.3" r=".9" fill="currentColor"/></>,
  mascara: <><path d="M3 6.5c3-1.5 15-1.5 18 0 .3 5.8-3 10.5-9 11.5-6-1-9.3-5.7-9-11.5Z"/><path d="M7 10.5c.8-.8 2.2-.8 3 0M14 10.5c.8-.8 2.2-.8 3 0M9.5 14c1.5 1 3.5 1 5 0"/></>,
  diana: <><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><path d="m15 9 5.5-5.5M17.5 3.5h3v3"/></>,
  ticket: <><path d="M3 8a2 2 0 0 0 0 4v0a2 2 0 0 0 0 4v1.5A1.5 1.5 0 0 0 4.5 19h15a1.5 1.5 0 0 0 1.5-1.5V16a2 2 0 0 1 0-4 2 2 0 0 1 0-4V6.5A1.5 1.5 0 0 0 19.5 5h-15A1.5 1.5 0 0 0 3 6.5Z"/><path d="M15 5v14" strokeDasharray="2 2.2"/><path d="m8.5 9.5.9 1.8 2 .3-1.4 1.4.3 2-1.8-.9-1.8.9.3-2-1.4-1.4 2-.3z"/></>,
  pregunta: <><circle cx="12" cy="12" r="9"/><path d="M9.3 9.4a2.8 2.8 0 0 1 5.4 1c0 1.9-2.7 2.4-2.7 4"/><circle cx="12" cy="17.6" r=".8" fill="currentColor"/></>,
  teatro: <><path d="M3 4.5c2.5 1 7 1 9 0 .5 5-1.5 9-4.5 9.5C4.5 13.5 2.5 9.5 3 4.5Z"/><path d="M12.5 8.5c2.5 1 6.5 1 8.5 0 .5 5-1.5 9-4.3 9.5-2.6-.4-4.4-3.7-4.2-8"/><path d="M5.5 8h1M8.5 8h1M6 11c.8.6 1.7.6 2.5 0M15 12h1M18 12h1M15.5 15.5c.8-.6 1.7-.6 2.5 0"/></>,
  camara: <><rect x="2.5" y="6.5" width="19" height="14" rx="3"/><circle cx="12" cy="13.5" r="4"/><path d="M8.5 6.5 10 3.5h4l1.5 3M18 10h.5"/></>,
  copa: <><path d="M7 3h10l-.6 5.5A4.5 4.5 0 0 1 12 12.5a4.5 4.5 0 0 1-4.4-4L7 3Z"/><path d="M12 12.5V20M8.5 20.5h7M7.4 7h9.2"/></>,
  corazones: <><path d="M9 18.5S3 15 3 10.6A3.4 3.4 0 0 1 9 8.4a3.4 3.4 0 0 1 6 2.2c0 4.4-6 7.9-6 7.9Z"/><path d="M15.5 6.2A2.6 2.6 0 0 1 21 7.8c0 3-3.4 5.3-4 5.7"/></>,
  check: <><path d="m5 12.5 4.5 4.5L19 7.5"/></>,
  estrella: <><path d="m12 3.5 2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.9l-5.3 2.7 1-5.8-4.2-4.1 5.9-.9z"/></>,
  basura: <><path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 12.5A1.5 1.5 0 0 0 8.5 21h7a1.5 1.5 0 0 0 1.5-1.5L18 7"/><path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7"/></>,
  equis: <><path d="M7 7l10 10M17 7 7 17"/></>,
  volver: <><path d="M19 12H5M11 6l-6 6 6 6"/></>,
  barajar: <><path d="M3 7h3.5c2 0 3.2 1 4.3 2.7l2.4 4.6C14.3 16 15.5 17 17.5 17H21M3 17h3.5c1.3 0 2.3-.4 3.1-1.3M13.4 8.3C14.2 7.4 15.2 7 16.5 7H21"/><path d="m18.5 4.5 2.5 2.5-2.5 2.5M18.5 14.5l2.5 2.5-2.5 2.5"/></>,
  reloj: <><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M9.5 2.5h5"/></>,
  usuario: <><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.7-3.6 3.6-6 7-6s6.3 2.4 7 6"/></>,
  ojo: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/></>,
  mas: <><path d="M12 5v14M5 12h14"/></>,
  impresora: <><path d="M7 9V3.5h10V9"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v6.5H7z"/></>,
  trago: <><path d="M6 4h12l-1.6 14.3a2 2 0 0 1-2 1.7H9.6a2 2 0 0 1-2-1.7L6 4Z"/><path d="M6.6 9.5h10.8"/></>,
};
export function IconoJuego({ n, tam = 26, grosor = 1.7 }: { n: string; tam?: number; grosor?: number }) {
  return <svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "block", flexShrink: 0 }}>{ICONOS[n] || ICONOS.pregunta}</svg>;
}

// ── Estilos y animaciones de los juegos (una sola vez) ──
export function EstilosJuego() {
  return <style>{`
    @keyframes j-entrar{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}
    @keyframes j-flotar{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(12px,-16px) scale(1.08)}}
    @keyframes j-latir{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
    @keyframes j-sello{0%{transform:scale(2.2) rotate(-18deg);opacity:0}60%{transform:scale(.92) rotate(-8deg);opacity:1}100%{transform:scale(1) rotate(-8deg);opacity:1}}
    @keyframes j-destello{0%{opacity:.85}100%{opacity:0}}
    @keyframes j-subir{from{transform:translateY(100%)}to{transform:none}}
    @keyframes j-llenar{from{transform:scaleY(0)}to{transform:scaleY(1)}}
    @keyframes j-pop{0%{transform:scale(.6);opacity:0}70%{transform:scale(1.08);opacity:1}100%{transform:scale(1)}}
    @keyframes j-temblar{0%,100%{transform:rotate(0)}25%{transform:rotate(-4deg)}75%{transform:rotate(4deg)}}
    .j-entrar{animation:j-entrar .45s cubic-bezier(.2,.8,.3,1) both}
    .j-tile{transition:transform .2s ease, box-shadow .25s ease}
    .j-tile:active{transform:scale(.97)}
    @media (hover:hover){.j-tile:hover{transform:translateY(-3px)}}
    .j-carta-3d{perspective:1200px}
    .j-carta-int{position:relative;width:100%;height:100%;transition:transform .7s cubic-bezier(.3,1.25,.4,1);transform-style:preserve-3d}
    .j-carta-int.volteada{transform:rotateY(180deg)}
    .j-cara{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:26px;overflow:hidden}
    .j-cara.atras{transform:rotateY(180deg)}
    @media (prefers-reduced-motion:reduce){.j-carta-int{transition:none}}
  `}</style>;
}

/** El fondo del juego: degradado de su color con dos luces que flotan. */
export function Escenario({ color, oscuro = "#2a1220", children, style }: { color: string; oscuro?: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 28, padding: "18px 16px 22px", color: "#fff", minHeight: "calc(100vh - 220px)",
      background: `radial-gradient(130% 90% at 0% 0%, ${color} 0%, ${oscuro} 75%)`, boxShadow: `0 24px 50px -24px ${oscuro}`, ...style }}>
      <EstilosJuego/>
      <div aria-hidden="true" style={{ position: "absolute", width: 260, height: 260, borderRadius: "50%", top: -80, right: -90, background: `radial-gradient(circle, ${color}cc, transparent 65%)`, filter: "blur(10px)", animation: "j-flotar 9s ease-in-out infinite" }}/>
      <div aria-hidden="true" style={{ position: "absolute", width: 220, height: 220, borderRadius: "50%", bottom: -90, left: -70, background: "radial-gradient(circle, rgba(255,255,255,.16), transparent 65%)", animation: "j-flotar 12s ease-in-out infinite reverse" }}/>
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
}

/** Barra superior del juego: volver + título + algo a la derecha. */
export function BarraJuego({ titulo, onVolver, derecha, claro = true }: { titulo: string; onVolver: () => void; derecha?: React.ReactNode; claro?: boolean }) {
  const col = claro ? "#fff" : C.cafe;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <button onClick={onVolver} aria-label="Volver" style={{ width: 40, height: 40, borderRadius: 14, display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0,
        background: claro ? "rgba(255,255,255,.14)" : "#fff", border: claro ? "1px solid rgba(255,255,255,.22)" : `1px solid ${C.borde}`, color: col }}><IconoJuego n="volver" tam={19}/></button>
      <div style={{ flex: 1, minWidth: 0, fontFamily: "var(--titulo)", fontSize: 24, fontWeight: 600, color: col, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{titulo}</div>
      {derecha}
    </div>
  );
}

export function Volver({ onClick, texto = "Juegos" }: { onClick: () => void; texto?: string }) {
  return <button onClick={onClick} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: C.suave, fontSize: 13, cursor: "pointer", padding: "4px 0", marginBottom: 12 }}><IconoJuego n="volver" tam={16}/>{texto.replace(/^←\s*/, "")}</button>;
}

/** Tarjeta del menú de juegos: color propio, ícono dibujado y formas de fondo. */
export function TarjetaJuego({ titulo, desc, icono, color, onClick, etiqueta, indice = 0 }: { titulo: string; desc: string; icono: string; color: string; onClick: () => void; etiqueta?: string; indice?: number }) {
  return (
    <button onClick={() => { vibrar(); onClick(); }} className="j-tile j-entrar" style={{ position: "relative", overflow: "hidden", width: "100%", textAlign: "left", border: "none", cursor: "pointer",
      background: `linear-gradient(140deg, ${color} 0%, ${color}d9 55%, ${color}b3 100%)`, color: "#fff", borderRadius: 22, padding: "18px 16px", minHeight: 108,
      display: "flex", alignItems: "center", gap: 14, boxShadow: `0 14px 28px -14px ${color}`, animationDelay: `${indice * 0.05}s` }}>
      <span aria-hidden="true" style={{ position: "absolute", right: -28, top: -30, width: 130, height: 130, borderRadius: "50%", background: "rgba(255,255,255,.12)" }}/>
      <span aria-hidden="true" style={{ position: "absolute", right: 34, bottom: -46, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,.08)" }}/>
      <span style={{ position: "relative", width: 56, height: 56, borderRadius: 18, background: "rgba(255,255,255,.18)", border: "1px solid rgba(255,255,255,.28)", display: "grid", placeItems: "center", flexShrink: 0, backdropFilter: "blur(4px)" }}><IconoJuego n={icono} tam={28}/></span>
      <span style={{ position: "relative", flex: 1, minWidth: 0 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "var(--titulo)", fontSize: 23, fontWeight: 600, lineHeight: 1.05 }}>{titulo}</span>
          {etiqueta && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".06em", background: "rgba(0,0,0,.22)", borderRadius: 20, padding: "3px 8px" }}>{etiqueta}</span>}
        </span>
        <span style={{ display: "block", fontSize: 12.5, opacity: .92, marginTop: 5, lineHeight: 1.4 }}>{desc}</span>
      </span>
      <span style={{ position: "relative", opacity: .8, transform: "rotate(180deg)" }}><IconoJuego n="volver" tam={18} grosor={2}/></span>
    </button>
  );
}

/** Carta que se da vuelta: `atras` = el dorso (con el ícono del juego), `children` = lo que dice. */
export function CartaGiro({ volteada, color, icono, etiqueta, children, alto = 300, onToque }: { volteada: boolean; color: string; icono: string; etiqueta?: string; children: React.ReactNode; alto?: number; onToque?: () => void }) {
  return (
    <div className="j-carta-3d" style={{ height: alto, cursor: onToque ? "pointer" : "default" }} onClick={onToque}>
      <div className={`j-carta-int${volteada ? " volteada" : ""}`}>
        {/* dorso */}
        <div className="j-cara" style={{ background: `linear-gradient(150deg, ${color}, ${color}aa)`, border: "1px solid rgba(255,255,255,.25)", boxShadow: "0 18px 40px -16px rgba(0,0,0,.5)", display: "grid", placeItems: "center" }}>
          <div aria-hidden="true" style={{ position: "absolute", inset: 12, borderRadius: 18, border: "1.5px dashed rgba(255,255,255,.35)" }}/>
          <div style={{ display: "grid", placeItems: "center", gap: 10, color: "#fff", animation: "j-latir 2.4s ease-in-out infinite" }}>
            <span style={{ width: 78, height: 78, borderRadius: "50%", background: "rgba(255,255,255,.16)", display: "grid", placeItems: "center" }}><IconoJuego n={icono} tam={40}/></span>
            {onToque && <span style={{ fontSize: 12, letterSpacing: ".2em", textTransform: "uppercase", opacity: .85 }}>Toca para dar vuelta</span>}
          </div>
        </div>
        {/* frente */}
        <div className="j-cara atras" style={{ background: "#fffdfb", color: "#3b2a21", boxShadow: "0 18px 40px -16px rgba(0,0,0,.5)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "26px 22px", textAlign: "center" }}>
          <div aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: color }}/>
          {etiqueta && <div style={{ position: "absolute", top: 18, left: 0, right: 0, fontSize: 11, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color }}>{etiqueta}</div>}
          <div style={{ fontFamily: "var(--titulo)", fontSize: 25, lineHeight: 1.3, fontWeight: 500 }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Carta que se desliza con el dedo (como las apps de citas): a la derecha = sí, a la izquierda = no.
 * Muestra el color y la palabra de cada lado mientras se arrastra. También funciona con los botones.
 */
export function CartaDeslizable({ children, onDerecha, onIzquierda, textoDerecha = "Sí", textoIzquierda = "No", colorDerecha = "#3f9a6e", colorIzquierda = "#c0394f", activa = true }:
  { children: React.ReactNode; onDerecha: () => void; onIzquierda: () => void; textoDerecha?: string; textoIzquierda?: string; colorDerecha?: string; colorIzquierda?: string; activa?: boolean }) {
  const [dx, setDx] = useState(0); const [saliendo, setSaliendo] = useState<0 | 1 | -1>(0);
  const ini = useRef<number | null>(null);
  const soltar = () => {
    if (ini.current == null) return; ini.current = null;
    if (Math.abs(dx) > 90) { const lado = dx > 0 ? 1 : -1; setSaliendo(lado); vibrar(18); setTimeout(() => { setSaliendo(0); setDx(0); lado > 0 ? onDerecha() : onIzquierda(); }, 260); }
    else setDx(0);
  };
  const x = saliendo ? saliendo * 600 : dx; const giro = x / 18;
  const p = Math.min(1, Math.abs(dx) / 110);
  return (
    <div style={{ position: "relative", touchAction: "pan-y", userSelect: "none" }}
      onPointerDown={e => { if (!activa) return; ini.current = e.clientX; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); }}
      onPointerMove={e => { if (ini.current != null) setDx(e.clientX - ini.current); }}
      onPointerUp={soltar} onPointerCancel={soltar}>
      <div style={{ transform: `translateX(${x}px) rotate(${giro}deg)`, transition: ini.current != null ? "none" : "transform .3s cubic-bezier(.2,.8,.3,1)", position: "relative" }}>
        {children}
        {dx !== 0 && <div aria-hidden="true" style={{ position: "absolute", inset: 0, borderRadius: 26, pointerEvents: "none", display: "grid", placeItems: "center",
          background: `${dx > 0 ? colorDerecha : colorIzquierda}${Math.round(p * 70).toString(16).padStart(2, "0")}` }}>
          <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: ".1em", color: "#fff", border: "3px solid #fff", borderRadius: 14, padding: "6px 16px", transform: `rotate(${dx > 0 ? -10 : 10}deg)`, opacity: p }}>{dx > 0 ? textoDerecha : textoIzquierda}</span>
        </div>}
      </div>
    </div>
  );
}

/** Confeti: lanza papelitos desde un punto de la pantalla. */
export function confeti(x = window.innerWidth / 2, y = window.innerHeight / 2, colores = ["#f6c27a", "#e88aa3", "#ffffff", "#9fd3b8", "#c9a2e0"]) {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const cv = document.createElement("canvas"); cv.width = window.innerWidth; cv.height = window.innerHeight;
  Object.assign(cv.style, { position: "fixed", inset: "0", pointerEvents: "none", zIndex: "9999" });
  document.body.appendChild(cv); const cx = cv.getContext("2d")!;
  const ps = Array.from({ length: 90 }, (_, i) => { const a = Math.random() * Math.PI * 2, v = 4 + Math.random() * 8;
    return { x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 6, r: 4 + Math.random() * 5, rot: Math.random() * 6, vr: (Math.random() - .5) * .4, c: colores[i % colores.length], vida: 1 }; });
  const paso = () => {
    cx.clearRect(0, 0, cv.width, cv.height); let vivos = 0;
    for (const p of ps) { if (p.vida <= 0) continue; vivos++; p.vx *= .99; p.vy = p.vy * .99 + .25; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.vida -= .011;
      cx.save(); cx.globalAlpha = Math.max(0, p.vida); cx.translate(p.x, p.y); cx.rotate(p.rot); cx.fillStyle = p.c; cx.fillRect(-p.r, -p.r * .4, p.r * 2, p.r * .8); cx.restore(); }
    if (vivos) requestAnimationFrame(paso); else cv.remove();
  };
  requestAnimationFrame(paso);
}

/** Anillo que se va vaciando con los segundos. */
export function AnilloTiempo({ seg, total, tam = 150, color = "#fff" }: { seg: number; total: number; tam?: number; color?: string }) {
  const r = tam / 2 - 8, L = 2 * Math.PI * r, f = total ? seg / total : 0;
  const urgente = seg <= 10 && seg > 0;
  return (
    <div style={{ position: "relative", width: tam, height: tam, animation: urgente ? "j-latir .8s ease-in-out infinite" : "none" }}>
      <svg width={tam} height={tam} style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
        <circle cx={tam / 2} cy={tam / 2} r={r} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth={8}/>
        <circle cx={tam / 2} cy={tam / 2} r={r} fill="none" stroke={urgente ? "#ffb3b3" : color} strokeWidth={8} strokeLinecap="round"
          strokeDasharray={L} strokeDashoffset={L * (1 - f)} style={{ transition: "stroke-dashoffset 1s linear, stroke .3s" }}/>
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontFamily: "var(--titulo)", fontSize: tam * .3, fontWeight: 600, fontVariantNumeric: "lining-nums tabular-nums" }}>{seg}</div>
    </div>
  );
}

/** Cuenta regresiva en segundos (se detiene en 0 y avisa). */
export function useReloj(alTerminar?: () => void) {
  const [seg, setSeg] = useState(0); const [total, setTotal] = useState(0);
  const t = useRef<any>(null); const fin = useRef(alTerminar); fin.current = alTerminar;
  useEffect(() => () => clearInterval(t.current), []);
  const partir = (s: number) => { clearInterval(t.current); setSeg(s); setTotal(s);
    t.current = setInterval(() => setSeg(x => { if (x <= 1) { clearInterval(t.current); vibrar([60, 40, 60]); fin.current?.(); return 0; } return x - 1; }), 1000); };
  const parar = () => { clearInterval(t.current); setSeg(0); };
  return { seg, total, partir, parar, corriendo: seg > 0 };
}

/** Botón grande de los juegos. `claro` = blanco con texto de color. */
export function Boton({ children, onClick, color = C.dorado, claro, style, disabled }: { children: React.ReactNode; onClick?: () => void; color?: string; claro?: boolean; style?: React.CSSProperties; disabled?: boolean }) {
  return <button disabled={disabled} onClick={() => { vibrar(8); onClick?.(); }} className="j-tile" style={{ background: claro ? "#fff" : color.startsWith("#") ? `linear-gradient(180deg, ${color}, ${color}e0)` : color, color: claro ? color : "#fff",
    border: claro ? `1.5px solid ${color}55` : "none", borderRadius: 16, padding: "14px 18px", fontSize: 15, fontWeight: 600, cursor: disabled ? "default" : "pointer",
    opacity: disabled ? .45 : 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    boxShadow: claro ? "0 6px 16px -10px rgba(0,0,0,.35)" : color.startsWith("#") ? `0 10px 22px -12px ${color}` : "none", ...(color.startsWith("#") || claro ? {} : { border: "1px solid rgba(255,255,255,.25)" }), ...style }}>{children}</button>;
}

/** Carta simple (para juegos de la fiesta en fondo claro). */
export function Carta({ children, color = C.dorado, chico }: { children: React.ReactNode; color?: string; chico?: string }) {
  return (
    <div className="j-entrar" key={String(children).slice(0, 40)} style={{ position: "relative", overflow: "hidden", background: "#fffdfb", borderRadius: 24, padding: "30px 22px", minHeight: 190, display: "flex",
      flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", border: `1px solid ${color}33`, boxShadow: `0 16px 34px -18px ${color}` }}>
      <div aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: color }}/>
      {chico && <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".2em", color, marginBottom: 12, textTransform: "uppercase" }}>{chico}</div>}
      <div style={{ fontFamily: "var(--titulo)", fontSize: 24, lineHeight: 1.35, color: C.cafe }}>{children}</div>
    </div>
  );
}

/** Pastillas para elegir una opción (segmentado). */
export function Opciones<T extends string | number>({ valor, opciones, onCambiar, claro = true }: { valor: T; opciones: [T, string][]; onCambiar: (v: T) => void; claro?: boolean }) {
  return (
    <div style={{ display: "flex", background: claro ? "rgba(255,255,255,.12)" : "#f5ebe1", borderRadius: 14, padding: 4, gap: 4 }}>
      {opciones.map(([v, l]) => { const on = v === valor; return (
        <button key={String(v)} onClick={() => { vibrar(6); onCambiar(v); }} style={{ flex: 1, border: "none", borderRadius: 11, padding: "9px 6px", fontSize: 13, fontWeight: 600, cursor: "pointer",
          background: on ? (claro ? "#fff" : C.cafe) : "transparent", color: on ? (claro ? "#3b2a21" : "#fff") : (claro ? "rgba(255,255,255,.85)" : C.suave), transition: "all .25s ease" }}>{l}</button>); })}
    </div>
  );
}
