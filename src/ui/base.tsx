import React from "react";
import { Icono } from "./iconos";

// ── Error Boundary ───────────────────────────────────────────────
export class ErrorBoundary extends React.Component<{children:React.ReactNode},{error:string|null}> {
  constructor(props:any) { super(props); this.state = { error:null }; }
  static getDerivedStateFromError(e:any) { return { error: e?.message || String(e) }; }
  render() {
    if (this.state.error) return (
      <div style={{ padding:32, fontFamily:"sans-serif", color:"#c00" }}>
        <h2>Error en la app</h2>
        <pre style={{ fontSize:12, marginTop:12, whiteSpace:"pre-wrap" }}>{this.state.error}</pre>
        <button onClick={()=>window.location.reload()} style={{ marginTop:16, padding:"8px 16px", cursor:"pointer" }}>Recargar</button>
      </div>
    );
    return this.props.children;
  }
}

// ── Estilos globales (My Wedding) ────────────────────────────────
// Tipografía: Cormorant Garamond para títulos y cifras (la elegancia de siempre) e Inter para el
// texto de la app (más legible en pantallas chicas). Movimiento suave en todo, y nada si el teléfono
// pide «reducir movimiento».
export function S() {
  return <style>{`
    :root{--crema:#fdf8f3;--papel:#fffdfb;--tinta:#3b2a21;--cafe:#5c3d2e;--dorado:#c9956a;--dorado-osc:#a87447;--suave:#a07855;--tenue:#c4a882;
      --borde:#f0e3d7;--borde-2:#e8d5c4;--sombra:0 1px 2px rgba(92,61,46,.05),0 4px 14px -4px rgba(150,105,70,.14);
      --sombra-alta:0 2px 4px rgba(92,61,46,.06),0 14px 34px -10px rgba(150,105,70,.28);
      --titulo:"Cormorant Garamond","Georgia",serif;--ui:"Inter",-apple-system,"Segoe UI",Roboto,sans-serif;--radio:16px}
    *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
    html,body{background:var(--crema)}
    body{font-family:var(--ui);color:var(--cafe);font-variant-numeric:lining-nums;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
    ::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-thumb{background:#e8d5c4;border-radius:6px}
    input,textarea,select,button{font-family:inherit}
    button{transition:transform .14s ease,box-shadow .2s ease,background-color .2s ease,border-color .2s ease,color .2s ease,opacity .2s ease}
    button:not(:disabled):active{transform:scale(.97)}
    input,textarea,select{transition:border-color .2s ease,box-shadow .2s ease,background-color .2s ease}
    input:focus,textarea:focus,select:focus{border-color:var(--dorado)!important;box-shadow:0 0 0 3px rgba(201,149,106,.18);background:#fff!important}
    :focus-visible{outline:2px solid var(--dorado);outline-offset:2px}
    img{max-width:100%}
    @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes entrar{from{opacity:0;transform:translateY(8px) scale(.995)}to{opacity:1;transform:none}}
    @keyframes slideInRight{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}
    @keyframes subir{from{transform:translateY(100%)}to{transform:translateY(0)}}
    @keyframes velo{from{opacity:0}to{opacity:1}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
    @keyframes brillo{0%{background-position:-200% 0}100%{background-position:200% 0}}
    @keyframes latido{0%,100%{transform:scale(1);opacity:.9}50%{transform:scale(1.08);opacity:1}}
    .mw-pantalla{animation:entrar .32s cubic-bezier(.2,.7,.3,1) both}
    .mw-hueso{background:linear-gradient(90deg,#f4e9df 0%,#fbf4ee 40%,#f4e9df 80%);background-size:200% 100%;animation:brillo 1.4s ease-in-out infinite;border-radius:12px}
    @media (hover:hover){.mw-tarjeta-clic:hover{transform:translateY(-2px);box-shadow:var(--sombra-alta)}}
    @media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
  `}</style>;
}

// ── Componentes base ─────────────────────────────────────────────
// `enfocar`: para los formularios de agregar/editar. Al aparecer, o cuando cambia el ítem que se edita,
// la tarjeta se desliza a la vista (el lápiz suele estar mucho más abajo que el formulario).
export function Card({ children, style, enfocar }: { children:React.ReactNode; style?:React.CSSProperties; enfocar?:string|number|boolean|null }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (enfocar === undefined) return;
    const t = setTimeout(() => ref.current?.scrollIntoView({ behavior:"smooth", block:"start" }), 30);
    return () => clearTimeout(t);
  }, [enfocar]);
  return <div ref={ref} style={{ background:"var(--papel)", borderRadius:"var(--radio)", padding:20, border:"1px solid var(--borde)", boxShadow:"var(--sombra)", scrollMarginTop:84, ...style }}>{children}</div>;
}
export function Btn({ children, onClick, color="#c9956a", outline=false, style }: { children:React.ReactNode; onClick?:()=>void; color?:string; outline?:boolean; style?:React.CSSProperties }) {
  return <button onClick={onClick} style={{ background:outline?"transparent":`linear-gradient(180deg, ${color}, ${color}e6)`, border:`1.5px solid ${color}`, color:outline?color:"#fff",
    borderRadius:12, padding:"11px 18px", fontSize:13.5, fontWeight:600, letterSpacing:".01em", cursor:"pointer",
    boxShadow:outline?"none":`0 1px 0 rgba(255,255,255,.25) inset, 0 6px 14px -6px ${color}aa`,
    display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8, ...style }}>{children}</button>;
}
export function Inp({ value, onChange, placeholder, type="text", style }: { value:string; onChange:(v:string)=>void; placeholder?:string; type?:string; style?:React.CSSProperties }) {
  return <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} type={type} style={{ background:"#fdf8f3", border:"1.5px solid var(--borde-2)", borderRadius:11, padding:"10px 13px", fontSize:14, color:"var(--cafe)", width:"100%", outline:"none", ...style }}/>;
}
export function Sel({ value, onChange, options, style }: { value:string; onChange:(v:string)=>void; options:{value:string;label:string}[]; style?:React.CSSProperties }) {
  return <select value={value} onChange={e=>onChange(e.target.value)} style={{ background:"#fdf8f3", border:"1.5px solid var(--borde-2)", borderRadius:11, padding:"10px 13px", fontSize:14, color:"var(--cafe)", width:"100%", outline:"none", ...style }}>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>;
}
export function Badge({ text, color }: { text:string; color:string }) {
  return <span style={{ background:color+"1c", color, border:`1px solid ${color}38`, borderRadius:20, padding:"2px 9px", fontSize:10.5, fontWeight:600, whiteSpace:"nowrap", alignSelf:"flex-start", display:"inline-block", lineHeight:1.6 }}>{text}</span>;
}
export function Title({ icon, title }: { icon:string; title:string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
      <span style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,#fbefe4,#f3dcc8)", color:"var(--dorado-osc)", display:"grid", placeItems:"center",
        border:"1px solid #f0dcc9", flexShrink:0 }}><Icono n={icon} tam={21}/></span>
      <h2 style={{ fontFamily:"var(--titulo)", fontSize:26, fontWeight:600, color:"var(--tinta)", letterSpacing:".005em", lineHeight:1.1 }}>{title}</h2>
    </div>
  );
}
/** Mientras carga: siluetas con brillo en vez de «Cargando…». */
export function Cargando({ filas = 4 }: { filas?: number }) {
  return (
    <div aria-label="Cargando" style={{ display:"flex", flexDirection:"column", gap:12, padding:"6px 0" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}><div className="mw-hueso" style={{ width:40, height:40 }}/><div className="mw-hueso" style={{ width:"45%", height:22 }}/></div>
      <div className="mw-hueso" style={{ height:110, borderRadius:16 }}/>
      {Array.from({ length: filas }, (_, i) => <div key={i} className="mw-hueso" style={{ height:58, borderRadius:14, opacity: 1 - i * .15 }}/>)}
    </div>
  );
}

// ── Marca: los anillos del logo de My Wedding (el logo completo, con letras, está en /mywedding-logo.jpg) ──
export function Logo({ tam = 64 }: { tam?: number }) {
  return <img src="/mywedding-icono-512.png" alt="My Wedding" width={tam} height={tam}
    style={{ width:tam, height:tam, borderRadius:"50%", objectFit:"cover", border:"1px solid #f0e0d0", background:"#fbf0ea", flexShrink:0 }}/>;
}

/** La foto de la pareja; si no tiene, sus iniciales en un círculo. */
export function FotoPareja({ foto, nombre, tam = 38, borde = 2 }: { foto?: string; nombre?: string; tam?: number; borde?: number }) {
  if (foto) return <img src={foto} alt={nombre || "Pareja"} style={{ width:tam, height:tam, borderRadius:"50%", objectFit:"cover", border:`${borde}px solid #e8d5c4`, flexShrink:0 }}/>;
  const ini = String(nombre || "").split(/\s*[&y]\s*|\s+/).filter(Boolean).map(x => x[0]).slice(0, 2).join("&").toUpperCase();
  return <div style={{ width:tam, height:tam, borderRadius:"50%", background:"linear-gradient(135deg,#f5e3d3,#e8c9a6)", border:`${borde}px solid #e8d5c4`,
    display:"flex", alignItems:"center", justifyContent:"center", color:"#5c3d2e", fontSize:tam*0.34, fontWeight:600, fontFamily:"var(--titulo)", whiteSpace:"nowrap", letterSpacing:"-.02em", flexShrink:0 }}>{ini || "♡"}</div>;
}
