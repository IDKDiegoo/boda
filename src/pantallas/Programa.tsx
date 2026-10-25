import { useState } from "react";
import { Cancion } from "../tipos";
import { Btn, Card, Inp, Sel, Title } from "../ui/base";
import { Icono } from "../ui/iconos";

// ════════════════════════════════════════════════════════════════
// PROGRAMA
// ════════════════════════════════════════════════════════════════
export const MOMENTOS_DIA = ["Entrada novios","Primer baile","Vals","Baile general","Karaoke","Juegos","Recuerdos","Salida"];
export const JUEGOS = ["Tarro del amor","Trivia de la pareja","Baile de la escoba","El rey/reina","Silla musical","Caricatura pareja","Penitencias","Bingo"];

export function Programa({ canciones, setCanciones }: { canciones:{canciones:Cancion[]}; setCanciones:(d:any)=>void }) {
  const lista = canciones.canciones || [];
  const [form, setForm] = useState<Partial<Cancion>>({ momento:"Baile general" });
  const [show, setShow] = useState(false);
  const [playerUrl, setPlayerUrl] = useState<string|null>(null);
  const guardar = () => {
    if (!form.titulo) return;
    setCanciones({canciones:[...lista,{id:Date.now(),titulo:form.titulo!,artista:form.artista||"",momento:form.momento||"Baile general",link:form.link||""}]});
    setForm({momento:"Baile general"}); setShow(false);
  };
  const eliminar = (id:number) => setCanciones({canciones:lista.filter(c=>c.id!==id)});

  const toEmbedUrl = (url:string): string|null => {
    const u = url.trim();
    // YouTube
    const ytMatch = u.match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
    // Spotify — acepta cualquier variante de open.spotify.com
    const spMatch = u.match(/spotify\.com\/(?:intl-[a-z]+\/)?(track|album|playlist|artist)\/([a-zA-Z0-9]+)/);
    if (spMatch) return `https://open.spotify.com/embed/${spMatch[1]}/${spMatch[2]}?utm_source=generator&nd=1`;
    return null;
  };
  const linkIcon = (url:string) => url.includes("spotify")?"🎧":url.includes("youtube")||url.includes("youtu.be")?"▶️":"🔗";

  return (
    <div style={{ animation:"fadeUp .3s ease" }}>
      <Title icon="🎵" title="Programa del Día"/>
      <Card style={{ marginBottom:16, background:"#f9f0fb" }}>
        <div style={{ fontSize:13, fontWeight:700, color:"#9b7bb5", marginBottom:10 }}>🎮 Juegos sugeridos</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {JUEGOS.map(j=><span key={j} style={{ background:"#fff", border:"1px solid #d4b8e8", borderRadius:8, padding:"4px 10px", fontSize:11, color:"#9b7bb5" }}>{j}</span>)}
        </div>
      </Card>
      {show && (
        <Card style={{ marginBottom:16, border:"2px solid #e8d5c4" }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#5c3d2e", marginBottom:14 }}>Agregar canción / actividad</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <Inp value={form.titulo||""} onChange={v=>setForm({...form,titulo:v})} placeholder="Título o actividad"/>
            <Inp value={form.artista||""} onChange={v=>setForm({...form,artista:v})} placeholder="Artista (opcional)"/>
            <Sel value={form.momento||"Baile general"} onChange={v=>setForm({...form,momento:v})} options={MOMENTOS_DIA.map(m=>({value:m,label:m}))}/>
            <Inp value={form.link||""} onChange={v=>setForm({...form,link:v})} placeholder="🔗 Link Spotify / YouTube (opcional)"/>
          </div>
          <div style={{ display:"flex", gap:8, marginTop:14 }}>
            <Btn onClick={guardar}>Guardar</Btn>
            <Btn onClick={()=>{setShow(false);setForm({momento:"Baile general"});}} outline>Cancelar</Btn>
          </div>
        </Card>
      )}
      {!show && <Btn onClick={()=>setShow(true)} style={{ marginBottom:16 }}>+ Agregar</Btn>}
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {MOMENTOS_DIA.map(m=>{
          const items = lista.filter(c=>c.momento===m);
          if (!items.length) return null;
          return (
            <Card key={m}>
              <div style={{ fontSize:13, fontWeight:700, color:"#9b7bb5", marginBottom:10 }}>🎵 {m}</div>
              {items.map(c=>(
                <div key={c.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:"1px solid #f5e8dc" }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, color:"#5c3d2e" }}>{c.titulo}</div>
                    {c.artista&&<div style={{ fontSize:11, color:"#a07855" }}>{c.artista}</div>}
                  </div>
                  <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
                    {c.link && (
                      <button onClick={()=>{ const e=toEmbedUrl(c.link!); if(e){setPlayerUrl(e);}else{window.open(c.link,"_blank");} }} style={{ background: toEmbedUrl(c.link)?"#f5e8dc":"#fdf0e8", border:`1px solid ${toEmbedUrl(c.link)?"#e8d5c4":"#f0c080"}`, borderRadius:8, padding:"4px 10px", fontSize:16, cursor:"pointer" }} title={toEmbedUrl(c.link)?"Reproducir en la app":"Abrir en navegador"}>{linkIcon(c.link)}</button>
                    )}
                    <button onClick={()=>eliminar(c.id)} style={{ background:"none", border:"none", color:"#e07070", cursor:"pointer", fontSize:14 }}><Icono n="basura" tam={16} style={{ color:"#d48a8a" }}/></button>
                  </div>
                </div>
              ))}
            </Card>
          );
        })}
        {lista.length===0 && <div style={{ textAlign:"center", color:"#c4a882", padding:32 }}>Agrega canciones y actividades para el gran día</div>}
      </div>

      {/* Reproductor embebido */}
      {playerUrl && (
        <div onClick={()=>setPlayerUrl(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", zIndex:999, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e=>e.stopPropagation()} style={{ width:"100%", maxWidth:480, background:"#1a1a1a", borderRadius:16, overflow:"hidden", boxShadow:"0 8px 40px rgba(0,0,0,.5)" }}>
            <div style={{ display:"flex", justifyContent:"flex-end", padding:"8px 12px", background:"#111" }}>
              <button onClick={()=>setPlayerUrl(null)} style={{ background:"none", border:"none", color:"#fff", fontSize:20, cursor:"pointer", lineHeight:1 }}>✕</button>
            </div>
            <iframe
              src={playerUrl}
              width="100%"
              height={playerUrl.includes("spotify") ? 352 : 280}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              loading="lazy"
              style={{ border:"none", display:"block" }}
              title="Reproductor"
            />
          </div>
          <div style={{ marginTop:12, fontSize:12, color:"rgba(255,255,255,.5)" }}>Toca fuera para cerrar</div>
        </div>
      )}
    </div>
  );
}
