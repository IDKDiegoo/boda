import { useState } from "react";
import { fmt } from "../base/config";
import { Regalo } from "../tipos";
import { Badge, Btn, Card, Inp, Sel, Title } from "../ui/base";

// ════════════════════════════════════════════════════════════════
// REGALOS
// ════════════════════════════════════════════════════════════════
export function Regalos({ data, setData }: { data:{regalos:Regalo[]}; setData:(d:any)=>void }) {
  const lista = data.regalos || [];
  const [form, setForm] = useState<Partial<Regalo>>({ prioridad:"media", recibido:false });
  const [show, setShow] = useState(false);
  const guardar = () => {
    if (!form.nombre) return;
    setData({regalos:[...lista,{id:Date.now(),nombre:form.nombre!,precio:Number(form.precio)||0,prioridad:form.prioridad||"media",recibido:false,link:form.link||""}]});
    setForm({prioridad:"media",recibido:false}); setShow(false);
  };
  const toggle   = (id:number) => setData({regalos:lista.map(r=>r.id===id?{...r,recibido:!r.recibido}:r)});
  const eliminar = (id:number) => setData({regalos:lista.filter(r=>r.id!==id)});
  const colorP   = (p:string)  => p==="alta"?"#e07070":p==="media"?"#c9956a":"#6aaa96";

  return (
    <div style={{ animation:"fadeUp .3s ease" }}>
      <Title icon="🎁" title="Lista de Regalos"/>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
        <Card style={{ padding:14, textAlign:"center" }}><div style={{ fontSize:22, fontWeight:700, color:"#6aaa96" }}>{lista.filter(r=>r.recibido).length}</div><div style={{ fontSize:11, color:"#a07855" }}>Recibidos</div></Card>
        <Card style={{ padding:14, textAlign:"center" }}><div style={{ fontSize:22, fontWeight:700, color:"#c9956a" }}>{lista.filter(r=>!r.recibido).length}</div><div style={{ fontSize:11, color:"#a07855" }}>Pendientes</div></Card>
      </div>
      {show && (
        <Card style={{ marginBottom:16, border:"2px solid #e8d5c4" }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#5c3d2e", marginBottom:14 }}>Nuevo regalo</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <Inp value={form.nombre||""} onChange={v=>setForm({...form,nombre:v})} placeholder="Nombre del regalo"/>
            <Inp value={form.precio?.toString()||""} onChange={v=>setForm({...form,precio:Number(v)})} placeholder="Precio estimado ($)" type="number"/>
            <Sel value={form.prioridad||"media"} onChange={v=>setForm({...form,prioridad:v as any})} options={[{value:"alta",label:"🔴 Alta"},{value:"media",label:"🟡 Media"},{value:"baja",label:"🟢 Baja"}]}/>
            <Inp value={form.link||""} onChange={v=>setForm({...form,link:v})} placeholder="Link (opcional)"/>
          </div>
          <div style={{ display:"flex", gap:8, marginTop:14 }}>
            <Btn onClick={guardar}>Guardar</Btn>
            <Btn onClick={()=>{setShow(false);setForm({prioridad:"media",recibido:false});}} outline>Cancelar</Btn>
          </div>
        </Card>
      )}
      {!show && <Btn onClick={()=>setShow(true)} style={{ marginBottom:16 }}>+ Agregar regalo</Btn>}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {lista.map(r=>(
          <Card key={r.id} style={{ padding:14, opacity:r.recibido?.6:1 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:"#5c3d2e", textDecoration:r.recibido?"line-through":"none" }}>{r.nombre}</span>
                  <Badge text={r.prioridad} color={colorP(r.prioridad)}/>
                </div>
                {r.precio>0 && <div style={{ fontSize:12, color:"#c9956a" }}>{fmt(r.precio)}</div>}
                {r.link && <a href={r.link} target="_blank" rel="noreferrer" style={{ fontSize:11, color:"#9b7bb5" }}>🔗 Ver</a>}
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={()=>toggle(r.id)} style={{ background:r.recibido?"#e8f5ec":"none", border:`1px solid ${r.recibido?"#6aaa96":"#e8d5c4"}`, borderRadius:6, padding:"4px 8px", fontSize:11, color:r.recibido?"#6aaa96":"#a07855", cursor:"pointer", fontFamily:"inherit" }}>{r.recibido?"✓ Recibido":"¿Recibido?"}</button>
                <button onClick={()=>eliminar(r.id)} style={{ background:"none", border:"none", color:"#e07070", cursor:"pointer", fontSize:14 }}>🗑</button>
              </div>
            </div>
          </Card>
        ))}
        {lista.length===0 && <div style={{ textAlign:"center", color:"#c4a882", padding:32 }}>Agrega cosas a tu lista de regalos 🎁</div>}
      </div>
    </div>
  );
}
