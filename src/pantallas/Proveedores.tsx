import { useState } from "react";
import { fmt } from "../base/config";
import { Proveedor } from "../tipos";
import { Badge, Btn, Card, Inp, Sel, Title } from "../ui/base";
import { Icono } from "../ui/iconos";

// ════════════════════════════════════════════════════════════════
// PROVEEDORES
// ════════════════════════════════════════════════════════════════
export const CATS_PROV = ["Fotografía","Animador","Animación","Lugar","Catering","Música","Decoración","Cabina Fotos","Torta","Transporte","Otro"];
export const PROVEEDORES_INICIALES: Proveedor[] = [
  { id:1, categoria:"Fotografía", nombre:"Pancho Jorquez", descripcion:"Fotógrafo profesional", costo:650000, extras:[{desc:"Traslado",monto:40000}], estado:"confirmado", contacto:"", notas:"" },
];

export function Proveedores({ data, setData }: { data:{proveedores:Proveedor[]}; setData:(d:any)=>void }) {
  const lista = data.proveedores || PROVEEDORES_INICIALES;
  const [form, setForm]       = useState<Partial<Proveedor>>({});
  const [editId, setEditId]   = useState<number|null>(null);
  const [show, setShow]       = useState(false);
  const total = lista.filter(p=>p.estado!=="descartado").reduce((s,p)=>s+p.costo+(p.extras||[]).reduce((a,e)=>a+e.monto,0),0);
  const colorE = (e:string) => e==="confirmado"?"#6aaa96":e==="pendiente"?"#c9956a":"#e07070";

  const guardar = () => {
    if (!form.nombre||!form.costo) return;
    let nueva = [...lista];
    if (editId!==null) nueva = nueva.map(p=>p.id===editId?{...p,...form} as Proveedor:p);
    else nueva.push({id:Date.now(), categoria:form.categoria||"Otro", nombre:form.nombre!, descripcion:form.descripcion||"", costo:Number(form.costo)||0, extras:[], estado:form.estado||"pendiente", contacto:form.contacto||"", notas:form.notas||""} as Proveedor);
    setData({proveedores:nueva}); setForm({}); setEditId(null); setShow(false);
  };

  return (
    <div style={{ animation:"fadeUp .3s ease" }}>
      <Title icon="🤝" title="Proveedores"/>
      <Card style={{ marginBottom:16, background:"linear-gradient(135deg,#f9f0e8,#f5e6d8)" }}>
        <div style={{ fontSize:13, color:"#a07855" }}>Total estimado</div>
        <div style={{ fontSize:28, fontWeight:700, color:"#c9956a", marginTop:4 }}>{fmt(total)}</div>
      </Card>
      {show && (
        <Card style={{ marginBottom:16, border:"2px solid #e8d5c4" }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#5c3d2e", marginBottom:14 }}>{editId?"Editar":"Nuevo"} proveedor</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <Sel value={form.categoria||"Fotografía"} onChange={v=>setForm({...form,categoria:v})} options={CATS_PROV.map(c=>({value:c,label:c}))}/>
            <Inp value={form.nombre||""} onChange={v=>setForm({...form,nombre:v})} placeholder="Nombre"/>
            <Inp value={form.descripcion||""} onChange={v=>setForm({...form,descripcion:v})} placeholder="Descripción"/>
            <Inp value={form.costo?.toString()||""} onChange={v=>setForm({...form,costo:Number(v)})} placeholder="Costo ($)" type="number"/>
            <Inp value={form.contacto||""} onChange={v=>setForm({...form,contacto:v})} placeholder="Contacto"/>
            <Sel value={form.estado||"pendiente"} onChange={v=>setForm({...form,estado:v as any})} options={[{value:"pendiente",label:"⏳ Pendiente"},{value:"confirmado",label:"✅ Confirmado"},{value:"descartado",label:"❌ Descartado"}]}/>
            <Inp value={form.notas||""} onChange={v=>setForm({...form,notas:v})} placeholder="Notas"/>
          </div>
          <div style={{ display:"flex", gap:8, marginTop:14 }}>
            <Btn onClick={guardar}>Guardar</Btn>
            <Btn onClick={()=>{setShow(false);setForm({});setEditId(null);}} outline>Cancelar</Btn>
          </div>
        </Card>
      )}
      {!show && <Btn onClick={()=>setShow(true)} style={{ marginBottom:16 }}>+ Agregar proveedor</Btn>}
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {lista.map(p=>{
          const ct = p.costo+(p.extras||[]).reduce((a,e)=>a+e.monto,0);
          return (
            <Card key={p.id} style={{ opacity:p.estado==="descartado"?.5:1 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:"#5c3d2e" }}>{p.nombre}</div>
                  <div style={{ fontSize:11, color:"#a07855" }}>{p.categoria} · {p.descripcion}</div>
                </div>
                <Badge text={p.estado} color={colorE(p.estado)}/>
              </div>
              <div style={{ fontSize:18, fontWeight:700, color:"#c9956a", marginBottom:4 }}>{fmt(ct)}</div>
              {(p.extras||[]).length>0 && <div style={{ fontSize:11, color:"#a07855" }}>Base: {fmt(p.costo)} {p.extras.map(e=>`+ ${e.desc}: ${fmt(e.monto)}`).join(" ")}</div>}
              {p.contacto && <div style={{ fontSize:11, color:"#a07855", marginTop:4 }}>📞 {p.contacto}</div>}
              {p.notas && <div style={{ fontSize:11, color:"#c4a882", marginTop:4 }}>💬 {p.notas}</div>}
              <button onClick={()=>{setForm(p);setEditId(p.id);setShow(true);}} style={{ background:"none", border:"none", color:"#c9956a", fontSize:12, cursor:"pointer", marginTop:8, padding:0, fontFamily:"inherit" }}><Icono n="lapiz" tam={14}/>Editar</button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
