import { useState } from "react";
import { fmt } from "../base/config";
import { Invitado } from "../tipos";
import { Btn, Card, Inp, Sel, Title } from "../ui/base";
import { Icono } from "../ui/iconos";

// ════════════════════════════════════════════════════════════════
// INVITADOS
// ════════════════════════════════════════════════════════════════
export function Invitados({ data, setData }: { data:{invitados:Invitado[]}; setData:(d:any)=>void }) {
  const lista = data.invitados || [];
  const [form, setForm] = useState<Partial<Invitado>>({ tipo:"adulto", confirmado:"pendiente" });
  const [show, setShow] = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const [filtro, setFiltro] = useState("todos");
  const [buscar, setBuscar] = useState("");

  const guardar = () => {
    if (!form.nombre) return;
    if (editId !== null) {
      setData({invitados:lista.map(i=>i.id===editId?{...i,...form} as Invitado:i)});
    } else {
      const nuevo: Invitado = { id:Date.now(), nombre:form.nombre!, tipo:form.tipo||"adulto", mesa:form.mesa||0, confirmado:form.confirmado||"pendiente", dieta:form.dieta||"", notas:form.notas||"" };
      setData({invitados:[...lista,nuevo]});
    }
    setForm({tipo:"adulto",confirmado:"pendiente"}); setEditId(null); setShow(false);
  };
  const editar   = (i:Invitado) => { setForm(i); setEditId(i.id); setShow(true); };
  const cambiar  = (id:number, v:"si"|"no"|"pendiente") => setData({invitados:lista.map(i=>i.id===id?{...i,confirmado:v}:i)});
  const eliminar = (id:number) => { setData({invitados:lista.filter(i=>i.id!==id)}); if(editId===id){setShow(false);setEditId(null);setForm({tipo:"adulto",confirmado:"pendiente"});} };
  const colorC  = (c:string)  => c==="si"?"#6aaa96":c==="no"?"#e07070":"#c9956a";
  const filtrados = lista.filter(i=>filtro==="todos"||i.confirmado===filtro||i.tipo===filtro).filter(i=>i.nombre.toLowerCase().includes(buscar.toLowerCase()));

  return (
    <div>
      <Title icon="invitados" title="Invitados"/>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:16 }}>
        {[{l:"Total",v:lista.length,c:"#a87447"},{l:"Confirmados",v:lista.filter(i=>i.confirmado==="si").length,c:"#4f9a83"},{l:"Pendientes",v:lista.filter(i=>i.confirmado==="pendiente").length,c:"#8a6aa8"}].map(s=>(
          <Card key={s.l} style={{ padding:"14px 10px", textAlign:"center" }}>
            <div style={{ fontFamily:"var(--titulo)", fontSize:30, fontWeight:600, color:s.c, lineHeight:1 }}>{s.v}</div>
            <div style={{ fontSize:11, color:"var(--suave)", marginTop:4, fontWeight:500 }}>{s.l}</div>
          </Card>
        ))}
      </div>
      {show && (
        <Card style={{ marginBottom:16, border:"2px solid #e8d5c4" }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#5c3d2e", marginBottom:14 }}>{editId?"Editar":"Nuevo"} invitado</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <Inp value={form.nombre||""} onChange={v=>setForm({...form,nombre:v})} placeholder="Nombre completo"/>
            <Sel value={form.tipo||"adulto"} onChange={v=>setForm({...form,tipo:v as any})} options={[{value:"adulto",label:"👤 Adulto ($75.000)"},{value:"niño",label:"👶 Niño ($35.000)"}]}/>
            <Sel value={form.confirmado||"pendiente"} onChange={v=>setForm({...form,confirmado:v as any})} options={[{value:"pendiente",label:"⏳ Pendiente"},{value:"si",label:"✅ Confirmado"},{value:"no",label:"❌ No viene"}]}/>
            <Inp value={form.mesa?.toString()||""} onChange={v=>setForm({...form,mesa:Number(v)})} placeholder="Mesa Nº" type="number"/>
            <Inp value={form.dieta||""} onChange={v=>setForm({...form,dieta:v})} placeholder="Restricción dietética (opcional)"/>
            <Inp value={form.notas||""} onChange={v=>setForm({...form,notas:v})} placeholder="Notas (opcional)"/>
          </div>
          <div style={{ display:"flex", gap:8, marginTop:14 }}>
            <Btn onClick={guardar}>Guardar</Btn>
            <Btn onClick={()=>{setShow(false);setForm({tipo:"adulto",confirmado:"pendiente"});setEditId(null);}} outline>Cancelar</Btn>
          </div>
        </Card>
      )}
      <div style={{ display:"flex", gap:8, marginBottom:12 }}>
        {!show && <Btn onClick={()=>setShow(true)} style={{ flexShrink:0 }}><Icono n="mas" tam={16} grosor={2.2}/>Agregar</Btn>}
        <div style={{ position:"relative", flex:1 }}>
          <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"var(--tenue)" }}><Icono n="buscar" tam={17}/></span>
          <Inp value={buscar} onChange={setBuscar} placeholder="Buscar invitado" style={{ paddingLeft:38 }}/>
        </div>
      </div>
      <div style={{ display:"flex", gap:6, marginBottom:14, overflowX:"auto", paddingBottom:4, scrollbarWidth:"none" }}>
        {([["todos","Todos"],["si","Confirmados"],["pendiente","Pendientes"],["no","No vienen"],["adulto","Adultos"],["niño","Niños"]] as const).map(([f,l])=>{
          const n = f==="todos" ? lista.length : lista.filter(i=>i.confirmado===f||i.tipo===f).length; const act = filtro===f; return (
          <button key={f} onClick={()=>setFiltro(f)} style={{ background:act?"var(--cafe)":"#fff", border:`1px solid ${act?"var(--cafe)":"var(--borde-2)"}`, borderRadius:20, padding:"7px 13px", fontSize:12, fontWeight:600,
            color:act?"#fff":"var(--suave)", cursor:"pointer", whiteSpace:"nowrap", display:"flex", gap:6, alignItems:"center" }}>{l}<span style={{ fontSize:10.5, opacity:.7 }}>{n}</span></button>); })}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(min(100%, 420px), 1fr))", gap:8 }}>
        {filtrados.map((i,k)=>{ const col = colorC(i.confirmado); const ini = i.nombre.split(/\s+/).filter(Boolean).map(x=>x[0]).slice(0,2).join("").toUpperCase(); return (
          <Card key={i.id} style={{ padding:"12px 12px 12px 14px", display:"flex", alignItems:"center", gap:12, animation:`fadeUp .3s ${Math.min(k,12)*0.02}s both` }}>
            <div style={{ width:40, height:40, borderRadius:"50%", background:i.tipo==="adulto"?"linear-gradient(135deg,#f6e6d8,#eed4bf)":"linear-gradient(135deg,#e3f2ea,#cfe8db)", color:"var(--cafe)",
              display:"grid", placeItems:"center", fontSize:13.5, fontWeight:600, flexShrink:0, boxShadow:`0 0 0 2px #fff, 0 0 0 3.5px ${col}66` }}>{i.tipo==="niño" ? "👶" : ini}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:14.5, fontWeight:600, color:"var(--tinta)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{i.nombre}</div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:6, flexWrap:"wrap" }}>
                <div style={{ fontSize:11.5, color:"var(--suave)", flex:"1 1 110px", minWidth:0 }}>{i.mesa?`Mesa ${i.mesa} · `:""}{fmt(i.tipo==="adulto"?75000:35000)}{i.dieta?` · ${i.dieta}`:""}</div>
                {/* Respuesta: un control de tres posiciones */}
                <div role="group" aria-label="Asistencia" style={{ display:"flex", background:"#f8efe7", borderRadius:10, padding:2, flexShrink:0 }}>
                  {([["si","check","Sí"],["pendiente","reloj","Pendiente"],["no","equis","No"]] as const).map(([v,ic,l])=>{ const on = i.confirmado===v; return (
                    <button key={v} onClick={()=>cambiar(i.id,v)} aria-label={l} aria-pressed={on} title={l} style={{ width:32, height:28, display:"grid", placeItems:"center", border:"none", borderRadius:8, cursor:"pointer",
                      background:on?"#fff":"transparent", color:on?colorC(v):"#c4ad97", boxShadow:on?"0 1px 3px rgba(92,61,46,.15)":"none" }}><Icono n={ic} tam={15} grosor={on?2.3:1.8}/></button>); })}
                </div>
                <div style={{ display:"flex", gap:0, flexShrink:0 }}>
                  <button onClick={()=>editar(i)} aria-label={`Editar a ${i.nombre}`} title="Editar" style={{ width:32, height:32, display:"grid", placeItems:"center", background:"none", border:"none", borderRadius:9, color:"var(--suave)", cursor:"pointer" }}><Icono n="lapiz" tam={16}/></button>
                  <button onClick={()=>{ if (window.confirm(`¿Eliminar a ${i.nombre} de la lista?`)) eliminar(i.id); }} aria-label={`Eliminar a ${i.nombre}`} title="Eliminar" style={{ width:32, height:32, display:"grid", placeItems:"center", background:"none", border:"none", borderRadius:9, color:"#d48a8a", cursor:"pointer" }}><Icono n="basura" tam={16}/></button>
                </div>
              </div>
            </div>
          </Card>); })}
      </div>
      <div>
        {filtrados.length===0 && <div style={{ textAlign:"center", color:"#c4a882", padding:32 }}>Sin invitados en este filtro</div>}
      </div>
    </div>
  );
}
