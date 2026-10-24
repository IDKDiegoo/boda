import { useState } from "react";
import { fmt } from "../base/config";
import { Invitado } from "../tipos";
import { Badge, Btn, Card, Inp, Sel, Title } from "../ui/base";

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
    <div style={{ animation:"fadeUp .3s ease" }}>
      <Title icon="👥" title="Invitados"/>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:16 }}>
        {[{l:"Total",v:lista.length,c:"#c9956a"},{l:"Confirmados",v:lista.filter(i=>i.confirmado==="si").length,c:"#6aaa96"},{l:"Pendientes",v:lista.filter(i=>i.confirmado==="pendiente").length,c:"#9b7bb5"}].map(s=>(
          <Card key={s.l} style={{ padding:14, textAlign:"center" }}>
            <div style={{ fontSize:22, fontWeight:700, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:10, color:"#a07855", marginTop:2 }}>{s.l}</div>
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
        {!show && <Btn onClick={()=>setShow(true)}>+ Agregar</Btn>}
        <Inp value={buscar} onChange={setBuscar} placeholder="🔍 Buscar..." style={{ flex:1 }}/>
      </div>
      <div style={{ display:"flex", gap:6, marginBottom:14, overflowX:"auto", paddingBottom:4 }}>
        {["todos","si","no","pendiente","adulto","niño"].map(f=>(
          <button key={f} onClick={()=>setFiltro(f)} style={{ background:filtro===f?"#c9956a":"#f5e8dc", border:"none", borderRadius:8, padding:"6px 12px", fontSize:11, fontWeight:700, color:filtro===f?"#fff":"#a07855", cursor:"pointer", whiteSpace:"nowrap", fontFamily:"inherit" }}>{f}</button>
        ))}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {filtrados.map(i=>(
          <Card key={i.id} style={{ padding:14, display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:"50%", background:i.tipo==="adulto"?"#f5e8dc":"#e8f5ec", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{i.tipo==="adulto"?"👤":"👶"}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#5c3d2e" }}>{i.nombre}</div>
              <div style={{ fontSize:11, color:"#a07855" }}>{fmt(i.tipo==="adulto"?75000:35000)}{i.mesa?` · Mesa ${i.mesa}`:""}{i.dieta?` · ${i.dieta}`:""}</div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end" }}>
              <Badge text={i.confirmado==="si"?"✓ Sí":i.confirmado==="no"?"✗ No":"⏳"} color={colorC(i.confirmado)}/>
              <div style={{ display:"flex", gap:4 }}>
                {(["si","no","pendiente"] as const).map(v=>(
                  <button key={v} onClick={()=>cambiar(i.id,v)} style={{ background:i.confirmado===v?colorC(v)+"33":"none", border:`1px solid ${colorC(v)}44`, borderRadius:5, padding:"2px 6px", fontSize:10, color:colorC(v), cursor:"pointer", fontFamily:"inherit" }}>{v==="si"?"✓":v==="no"?"✗":"?"}</button>
                ))}
                <button onClick={()=>editar(i)} style={{ background:"none", border:"1px solid #c9956a44", borderRadius:5, padding:"2px 6px", fontSize:10, color:"#c9956a", cursor:"pointer" }}>✏️</button>
                <button onClick={()=>eliminar(i.id)} style={{ background:"none", border:"1px solid #e0c0c0", borderRadius:5, padding:"2px 6px", fontSize:10, color:"#e07070", cursor:"pointer" }}>🗑</button>
              </div>
            </div>
          </Card>
        ))}
        {filtrados.length===0 && <div style={{ textAlign:"center", color:"#c4a882", padding:32 }}>Sin invitados en este filtro</div>}
      </div>
    </div>
  );
}
