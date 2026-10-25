import React from "react";

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

// ── Estilos globales ─────────────────────────────────────────────
export function S() {
  return <style>{`
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#fdf8f3;font-family:'Georgia','Times New Roman',serif}
    ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#e8d5c4;border-radius:4px}
    input,textarea,select{font-family:inherit}
    @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes slideInRight{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  `}</style>;
}

// ── Componentes base ─────────────────────────────────────────────
export function Card({ children, style }: { children:React.ReactNode; style?:React.CSSProperties }) {
  return <div style={{ background:"#fff", borderRadius:16, padding:20, boxShadow:"0 2px 16px rgba(180,130,100,.10)", ...style }}>{children}</div>;
}
export function Btn({ children, onClick, color="#c9956a", outline=false, style }: { children:React.ReactNode; onClick?:()=>void; color?:string; outline?:boolean; style?:React.CSSProperties }) {
  return <button onClick={onClick} style={{ background:outline?"transparent":color, border:`2px solid ${color}`, color:outline?color:"#fff", borderRadius:10, padding:"10px 18px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", ...style }}>{children}</button>;
}
export function Inp({ value, onChange, placeholder, type="text", style }: { value:string; onChange:(v:string)=>void; placeholder?:string; type?:string; style?:React.CSSProperties }) {
  return <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} type={type} style={{ background:"#fdf8f3", border:"1.5px solid #e8d5c4", borderRadius:9, padding:"9px 12px", fontSize:13, color:"#5c3d2e", width:"100%", outline:"none", fontFamily:"inherit", ...style }}/>;
}
export function Sel({ value, onChange, options, style }: { value:string; onChange:(v:string)=>void; options:{value:string;label:string}[]; style?:React.CSSProperties }) {
  return <select value={value} onChange={e=>onChange(e.target.value)} style={{ background:"#fdf8f3", border:"1.5px solid #e8d5c4", borderRadius:9, padding:"9px 12px", fontSize:13, color:"#5c3d2e", width:"100%", outline:"none", fontFamily:"inherit", ...style }}>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>;
}
export function Badge({ text, color }: { text:string; color:string }) {
  return <span style={{ background:color+"22", color, border:`1px solid ${color}44`, borderRadius:6, padding:"2px 8px", fontSize:10, fontWeight:700 }}>{text}</span>;
}
export function Title({ icon, title }: { icon:string; title:string }) {
  return <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}><span style={{ fontSize:22 }}>{icon}</span><h2 style={{ fontSize:18, fontWeight:700, color:"#5c3d2e" }}>{title}</h2></div>;
}

// ── Marca: los anillos del logo de My Wedding (el logo completo, con letras, está en /mywedding-logo.jpg) ──
export function Logo({ tam = 64 }: { tam?: number }) {
  return <img src="/mywedding-icono-512.png" alt="My Wedding" width={tam} height={tam}
    style={{ width:tam, height:tam, borderRadius:"50%", objectFit:"cover", border:"1px solid #f0e0d0", background:"#fbf0ea", flexShrink:0 }}/>;
}

/** La foto de la pareja; si no tiene, sus iniciales en un círculo. */
export function FotoPareja({ foto, nombre, tam = 38, borde = 2 }: { foto?: string; nombre?: string; tam?: number; borde?: number }) {
  if (foto) return <img src={foto} alt={nombre || "Pareja"} style={{ width:tam, height:tam, borderRadius:"50%", objectFit:"cover", border:`${borde}px solid #e8d5c4`, flexShrink:0 }}/>;
  const ini = String(nombre || "").split(/\s*[&y]\s*|\s+/).filter(Boolean).map(x => x[0]).slice(0, 2).join(" & ").toUpperCase();
  return <div style={{ width:tam, height:tam, borderRadius:"50%", background:"linear-gradient(135deg,#f5e3d3,#e8c9a6)", border:`${borde}px solid #e8d5c4`,
    display:"flex", alignItems:"center", justifyContent:"center", color:"#5c3d2e", fontSize:tam*0.3, fontWeight:700, flexShrink:0 }}>{ini || "♡"}</div>;
}
