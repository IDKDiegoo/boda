import React, { useState } from "react";
import { InvPersona, cuantos } from "./invitacion";
import { Card } from "../../ui/base";

// Todo lo que respondieron, ordenado para usarlo: comida para el banquetero, canciones para la música,
// deseos para leerlos, y quiénes faltan (con recordatorio por WhatsApp).
export const fechaCorta = (iso?:string) => { if (!iso) return ""; const d = new Date(iso);
  return d.toLocaleDateString("es-CL", { day:"numeric", month:"short" }) + " " + d.toLocaleTimeString("es-CL", { hour:"2-digit", minute:"2-digit" }); };
export function RespuestasInv({ personas, recordar, avisar }: { personas:InvPersona[]; recordar:(p:InvPersona)=>void; avisar:(t:string)=>void }) {
  const [abierta, setAbierta] = useState<string|null>(null);
  const [todasFaltan, setTodasFaltan] = useState(false);
  const resp = personas.filter(p=>p.respuesta).sort((a,b)=>(b.respuesta!.fecha||"").localeCompare(a.respuesta!.fecha||""));
  const vienen = resp.filter(p=>p.respuesta!.asiste), noVienen = resp.filter(p=>!p.respuesta!.asiste);
  const nVienen = vienen.reduce((n,p)=>n+cuantos(p),0), nNo = noVienen.reduce((n,p)=>n+cuantos(p),0), nFaltan = personas.filter(p=>!p.respuesta).reduce((n,p)=>n+cuantos(p),0);
  const conQuien = (p:InvPersona) => p.acompanantes?.length ? ` + ${p.acompanantes.map(a=>a.nombre).join(" y ")}` : "";
  const faltan = personas.filter(p=>!p.respuesta).sort((a,b)=>a.para.localeCompare(b.para));
  const total = personas.length || 1;

  // Comida: cada restricción con quiénes la tienen
  const dietas = new Map<string,string[]>(); const alergias: [string,string][] = [];
  vienen.forEach(p => (p.respuesta!.comida?.length ? p.respuesta!.comida : ["Como de todo"]).forEach(c => {
    // En una invitación con acompañantes la pregunta es por la comida de todos ellos
    const nombres = [p.para, ...(p.acompanantes||[]).map(a=>a.nombre)];
    if (c.startsWith("Alergia")) { alergias.push([nombres.join(" / "), c.replace(/^Alergia:?\s*/,"") || "sin detalle"]); return; }
    const k = c==="Como de todo" ? "Come de todo" : c; dietas.set(k, [...(dietas.get(k)||[]), ...nombres]);
  }));
  const ordenDietas = Array.from(dietas.entries()).sort((a,b)=> (a[0]==="Come de todo"?1:0)-(b[0]==="Come de todo"?1:0) || b[1].length-a[1].length);
  const canciones = vienen.filter(p=>p.respuesta!.cancion);
  const deseos = resp.filter(p=>p.respuesta!.deseo);

  const copiar = async (t:string, ok:string) => { try { await navigator.clipboard.writeText(t); avisar(ok); } catch { window.prompt("Copia el texto:", t); } };
  const resumenComida = () => [`Comida — ${nVienen} personas confirmadas`, ...ordenDietas.map(([k,v])=>`• ${k}: ${v.length} (${v.join(", ")})`),
    ...alergias.map(([n,a])=>`• Alergia de ${n}: ${a}`)].join("\n");

  const titulo = (icono:string, t:string, extra?:React.ReactNode) => (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
      <span style={{ fontSize:17 }}>{icono}</span><span style={{ flex:1, fontSize:13, fontWeight:800, color:"#5c3d2e" }}>{t}</span>{extra}
    </div>);
  const boton = (t:string, f:()=>void) => <button onClick={f} style={{ background:"#fdf3ea", color:"#c9956a", border:"none", borderRadius:8, padding:"6px 10px", fontSize:10.5, fontWeight:800, cursor:"pointer", fontFamily:"inherit" }}>{t}</button>;
  const chipNombre = (n:string) => <span key={n} style={{ fontSize:10.5, background:"#fdf8f3", border:"1px solid #f0e2d4", color:"#a07855", borderRadius:20, padding:"2px 8px" }}>{n}</span>;

  if (!personas.length) return <Card style={{ textAlign:"center" as const, color:"#c4a882", fontSize:12, padding:28 }}>Todavía no hay invitaciones creadas. Créalas en «Invitaciones» y mándalas: las respuestas van a ir apareciendo acá.</Card>;

  return (
    <div>
      {/* Avance */}
      <Card style={{ marginBottom:12, padding:"14px 16px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, fontWeight:700, color:"#a07855", marginBottom:6 }}>
          <span>Respondieron {resp.length} de {personas.length}</span><span>{Math.round(resp.length/total*100)}%</span>
        </div>
        <div style={{ display:"flex", height:10, borderRadius:6, overflow:"hidden", background:"#f3e7dc" }}>
          <div style={{ width:`${vienen.length/total*100}%`, background:"#6aaa96" }}/>
          <div style={{ width:`${noVienen.length/total*100}%`, background:"#e07070" }}/>
        </div>
        <div style={{ fontSize:10, color:"#c4a882", marginTop:5 }}>Contando acompañantes: {nVienen+nNo+nFaltan} personas en total
        </div>
        <div style={{ display:"flex", gap:14, marginTop:8, fontSize:11, color:"#5c3d2e", flexWrap:"wrap" as const }}>
          <span><b style={{ color:"#6aaa96" }}>●</b> Vienen <b>{nVienen}</b></span>
          <span><b style={{ color:"#e07070" }}>●</b> No vienen <b>{nNo}</b></span>
          <span><b style={{ color:"#d8c6b4" }}>●</b> Faltan <b>{nFaltan}</b></span>
        </div>
      </Card>

      {/* Comida */}
      <Card style={{ marginBottom:12, padding:"14px 16px" }}>
        {titulo("🍽️", "Para la comida", vienen.length>0 && boton("Copiar resumen", ()=>copiar(resumenComida(), "✓ Resumen de comida copiado")))}
        {vienen.length===0 ? <div style={{ fontSize:11.5, color:"#c4a882" }}>Cuando confirmen, acá se suma qué come cada uno.</div> : <>
          {ordenDietas.map(([k,v])=>(
            <div key={k} style={{ padding:"8px 0", borderBottom:"1px solid #f6ede4" }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:12.5, fontWeight:700, color:"#5c3d2e", marginBottom:5 }}><span>{k}</span><span style={{ color:k==="Come de todo"?"#a07855":"#c46a6e" }}>{v.length}</span></div>
              {k!=="Come de todo" && <div style={{ display:"flex", gap:5, flexWrap:"wrap" as const }}>{v.map(chipNombre)}</div>}
            </div>
          ))}
          {alergias.length>0 && (
            <div style={{ marginTop:10, background:"#fdf0f0", borderRadius:9, padding:"9px 11px" }}>
              <div style={{ fontSize:11, fontWeight:800, color:"#c05050", marginBottom:4 }}>⚠️ Alergias</div>
              {alergias.map(([n,a])=><div key={n} style={{ fontSize:12, color:"#5c3d2e" }}><b>{n}:</b> {a}</div>)}
            </div>
          )}
        </>}
      </Card>

      {/* Canciones */}
      <Card style={{ marginBottom:12, padding:"14px 16px" }}>
        {titulo("🎵", `Canciones para bailar · ${canciones.length}`, canciones.length>0 && boton("Copiar lista", ()=>copiar(canciones.map(p=>`${p.respuesta!.cancion} (pidió ${p.para})`).join("\n"), "✓ Lista de canciones copiada")))}
        {canciones.length===0 ? <div style={{ fontSize:11.5, color:"#c4a882" }}>Todavía nadie pidió una canción.</div>
          : canciones.map(p=>(
            <div key={p.codigo} style={{ display:"flex", gap:8, padding:"6px 0", borderBottom:"1px solid #f6ede4", fontSize:12.5 }}>
              <span style={{ flex:1, color:"#5c3d2e", fontWeight:700 }}>{p.respuesta!.cancion}</span><span style={{ color:"#c4a882", fontSize:11 }}>{p.para}</span>
            </div>))}
      </Card>

      {/* Deseos */}
      <Card style={{ marginBottom:12, padding:"14px 16px", background:"#fffaf6" }}>
        {titulo("💌", `Deseos para los novios · ${deseos.length}`)}
        {deseos.length===0 ? <div style={{ fontSize:11.5, color:"#c4a882" }}>Acá van a aparecer los mensajes que les dejen.</div>
          : deseos.map(p=>(
            <div key={p.codigo} style={{ background:"#fff", border:"1px solid #f3e2d8", borderRadius:10, padding:"10px 12px", marginBottom:8 }}>
              <div style={{ fontSize:13, color:"#5c3d2e", fontStyle:"italic" as const, lineHeight:1.5 }}>“{p.respuesta!.deseo}”</div>
              <div style={{ fontSize:10.5, color:"#c46a6e", fontWeight:800, marginTop:5 }}>— {p.para} <span style={{ color:"#c4a882", fontWeight:600 }}>· {fechaCorta(p.respuesta!.fecha)}</span></div>
            </div>))}
      </Card>

      {/* Persona por persona */}
      <Card style={{ marginBottom:12, padding:"14px 16px" }}>
        {titulo("👥", "Persona por persona")}
        {resp.length===0 && <div style={{ fontSize:11.5, color:"#c4a882" }}>Nadie ha respondido todavía.</div>}
        {resp.map(p=>{ const r = p.respuesta!, ab = abierta===p.codigo; return (
          <div key={p.codigo} style={{ borderBottom:"1px solid #f6ede4" }}>
            <button onClick={()=>setAbierta(ab?null:p.codigo)} style={{ width:"100%", display:"flex", alignItems:"center", gap:9, background:"none", border:"none", padding:"9px 0", cursor:"pointer", fontFamily:"inherit", textAlign:"left" as const }}>
              <span style={{ width:26, height:26, borderRadius:"50%", background:r.asiste?"#6aaa96":"#e07070", color:"#fff", fontSize:12, fontWeight:900, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{r.asiste?"✓":"✕"}</span>
              <span style={{ flex:1, minWidth:0 }}>
                <span style={{ display:"block", fontSize:13, fontWeight:800, color:"#5c3d2e" }}>{p.para}{conQuien(p)}</span>
                <span style={{ display:"block", fontSize:10.5, color:"#c4a882" }}>{r.asiste ? ((r.comida||[]).join(", ")||"Come de todo") : "No podrá venir"} · {fechaCorta(r.fecha)}</span>
              </span>
              <span style={{ fontSize:11, color:"#c9956a", transform:ab?"rotate(180deg)":"none" }}>▾</span>
            </button>
            {ab && (
              <div style={{ fontSize:12, color:"#5c3d2e", background:"#fdf8f3", borderRadius:9, padding:"9px 11px", marginBottom:9, lineHeight:1.6 }}>
                <div><b>Asiste:</b> {r.asiste?"Sí":"No"}</div>
                {r.asiste && <div><b>Comida:</b> {(r.comida||[]).join(", ")||"Come de todo"}</div>}
                {r.cancion && <div><b>Canción:</b> {r.cancion}</div>}
                {r.deseo && <div><b>Deseo:</b> “{r.deseo}”</div>}
                <div style={{ color:"#a07855", fontSize:11 }}>Respondió el {fechaCorta(r.fecha)}{p.vistas?` · abrió la invitación ${p.vistas} ${p.vistas===1?"vez":"veces"}`:""}</div>
              </div>
            )}
          </div>); })}
      </Card>

      {/* Faltan */}
      {faltan.length>0 && (
        <Card style={{ marginBottom:12, padding:"14px 16px" }}>
          {titulo("⏳", `Faltan por responder · ${faltan.length}`)}
          {(todasFaltan ? faltan : faltan.slice(0,6)).map(p=>(
            <div key={p.codigo} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 0", borderBottom:"1px solid #f6ede4" }}>
              <span style={{ flex:1, minWidth:0 }}>
                <span style={{ display:"block", fontSize:12.5, fontWeight:700, color:"#5c3d2e" }}>{p.para}</span>
                <span style={{ display:"block", fontSize:10.5, color:"#c4a882" }}>{(p.abierta||p.vistas) ? "La abrió pero no ha respondido" : p.enviada ? "Enviada, sin abrir" : "Todavía no se la mandan"}</span>
              </span>
              {(p.enviada || p.abierta || p.vistas) && <button onClick={()=>recordar(p)} style={{ background:"#25a35a", color:"#fff", border:"none", borderRadius:8, padding:"6px 10px", fontSize:10.5, fontWeight:800, cursor:"pointer", fontFamily:"inherit" }}>Recordar</button>}
            </div>
          ))}
          {faltan.length>6 && <button onClick={()=>setTodasFaltan(!todasFaltan)} style={{ width:"100%", background:"none", border:"none", color:"#c9956a", fontSize:11.5, fontWeight:800, padding:"9px 0 0", cursor:"pointer", fontFamily:"inherit" }}>{todasFaltan ? "Mostrar menos" : `Ver los ${faltan.length}`}</button>}
        </Card>
      )}
      {noVienen.length>0 && (
        <Card style={{ marginBottom:12, padding:"14px 16px" }}>
          {titulo("💔", `No podrán venir · ${noVienen.length}`)}
          <div style={{ display:"flex", gap:5, flexWrap:"wrap" as const }}>{noVienen.map(p=>chipNombre(p.para+conQuien(p)))}</div>
        </Card>
      )}
    </div>
  );
}
