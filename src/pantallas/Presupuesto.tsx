import { useState } from "react";
import { fmt } from "../base/config";
import { GastoExtra, Invitado, Proveedor } from "../tipos";
import { Btn, Card, Inp, Sel, Title } from "../ui/base";

// ════════════════════════════════════════════════════════════════
// PRESUPUESTO
// ════════════════════════════════════════════════════════════════
export const CATS_GASTO = ["Decoración","Vestuario","Papelería","Recuerdos","Cabina Fotos","Torta","Música","Transporte","Ceremonia","Luna de Miel","Otro"];

export function Presupuesto({ gastos, setGastos, proveedores, invitados }: any) {
  const lista: GastoExtra[] = gastos.gastos || [];
  const prov: Proveedor[]   = proveedores.proveedores || [];
  const inv: Invitado[]     = invitados.invitados || [];
  const [form, setForm]     = useState<Partial<GastoExtra>>({ pagado:false });
  const [show, setShow]     = useState(false);
  const adultos  = inv.filter(i=>i.tipo==="adulto").length;
  const ninos    = inv.filter(i=>i.tipo==="niño").length;
  const costoInv = adultos*75000 + ninos*35000;
  const totalProv= prov.filter(p=>p.estado!=="descartado").reduce((s,p)=>s+p.costo+(p.extras||[]).reduce((a,e)=>a+e.monto,0),0);
  const totalG   = lista.reduce((s,g)=>s+g.monto,0);
  const pagado   = lista.filter(g=>g.pagado).reduce((s,g)=>s+g.monto,0);
  const gran     = costoInv + totalProv + totalG;

  const guardar = () => {
    if (!form.nombre||!form.monto) return;
    setGastos({gastos:[...lista,{id:Date.now(),nombre:form.nombre!,categoria:form.categoria||"Otro",monto:Number(form.monto)||0,pagado:form.pagado||false}]});
    setForm({pagado:false}); setShow(false);
  };
  const toggleP  = (id:number) => setGastos({gastos:lista.map(g=>g.id===id?{...g,pagado:!g.pagado}:g)});
  const eliminar = (id:number) => setGastos({gastos:lista.filter(g=>g.id!==id)});

  return (
    <div style={{ animation:"fadeUp .3s ease" }}>
      <Title icon="💰" title="Presupuesto"/>
      <Card style={{ background:"linear-gradient(135deg,#f9f0e8,#f5e6d8)", marginBottom:16 }}>
        <div style={{ fontSize:13, color:"#a07855", marginBottom:4 }}>Gran total estimado</div>
        <div style={{ fontSize:32, fontWeight:700, color:"#c9956a" }}>{fmt(gran)}</div>
        <div style={{ display:"flex", gap:16, marginTop:12, flexWrap:"wrap" }}>
          {[{l:"Invitados",v:costoInv,c:"#9b7bb5"},{l:"Proveedores",v:totalProv,c:"#6aaa96"},{l:"Otros",v:totalG,c:"#c9956a"},{l:"Pagado",v:pagado,c:"#e07070"}].map(r=>(
            <div key={r.l}><div style={{ fontSize:10, color:r.c, fontWeight:700 }}>{r.l}</div><div style={{ fontSize:14, fontWeight:700, color:"#5c3d2e" }}>{fmt(r.v)}</div></div>
          ))}
        </div>
      </Card>
      {show && (
        <Card style={{ marginBottom:16, border:"2px solid #e8d5c4" }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#5c3d2e", marginBottom:14 }}>Nuevo gasto</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <Inp value={form.nombre||""} onChange={v=>setForm({...form,nombre:v})} placeholder="Descripción"/>
            <Sel value={form.categoria||"Otro"} onChange={v=>setForm({...form,categoria:v})} options={CATS_GASTO.map(c=>({value:c,label:c}))}/>
            <Inp value={form.monto?.toString()||""} onChange={v=>setForm({...form,monto:Number(v)})} placeholder="Monto ($)" type="number"/>
            <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"#5c3d2e", cursor:"pointer" }}><input type="checkbox" checked={form.pagado||false} onChange={e=>setForm({...form,pagado:e.target.checked})}/> Ya está pagado</label>
          </div>
          <div style={{ display:"flex", gap:8, marginTop:14 }}>
            <Btn onClick={guardar}>Guardar</Btn>
            <Btn onClick={()=>{setShow(false);setForm({pagado:false});}} outline>Cancelar</Btn>
          </div>
        </Card>
      )}
      {!show && <Btn onClick={()=>setShow(true)} style={{ marginBottom:16 }}>+ Agregar gasto</Btn>}
      <div style={{ fontSize:13, fontWeight:700, color:"#5c3d2e", marginBottom:10 }}>🤝 Proveedores</div>
      <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
        {prov.filter(p=>p.estado!=="descartado").map(p=>(
          <div key={p.id} style={{ display:"flex", justifyContent:"space-between", padding:"10px 14px", background:"#fdf8f3", borderRadius:10, border:"1px solid #f0e0d0" }}>
            <span style={{ fontSize:13, color:"#5c3d2e" }}>{p.nombre} <span style={{ fontSize:10, color:"#a07855" }}>({p.categoria})</span></span>
            <span style={{ fontSize:13, fontWeight:700, color:"#c9956a" }}>{fmt(p.costo+(p.extras||[]).reduce((a,e)=>a+e.monto,0))}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize:13, fontWeight:700, color:"#5c3d2e", marginBottom:10 }}>📋 Otros gastos</div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {lista.map(g=>(
          <div key={g.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:g.pagado?"#f0f8f4":"#fdf8f3", borderRadius:10, border:`1px solid ${g.pagado?"#c0e8d0":"#f0e0d0"}` }}>
            <div>
              <div style={{ fontSize:13, color:"#5c3d2e", textDecoration:g.pagado?"line-through":"none" }}>{g.nombre}</div>
              <div style={{ fontSize:10, color:"#a07855" }}>{g.categoria}</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:13, fontWeight:700, color:g.pagado?"#6aaa96":"#c9956a" }}>{fmt(g.monto)}</span>
              <button onClick={()=>toggleP(g.id)} style={{ background:"none", border:`1px solid ${g.pagado?"#6aaa96":"#e8d5c4"}`, borderRadius:6, padding:"3px 8px", fontSize:11, color:g.pagado?"#6aaa96":"#a07855", cursor:"pointer", fontFamily:"inherit" }}>{g.pagado?"✓":"Pagar"}</button>
              <button onClick={()=>eliminar(g.id)} style={{ background:"none", border:"none", color:"#e07070", cursor:"pointer", fontSize:14 }}>🗑</button>
            </div>
          </div>
        ))}
        {lista.length===0 && <div style={{ textAlign:"center", color:"#c4a882", padding:24, fontSize:13 }}>Sin gastos adicionales</div>}
      </div>
    </div>
  );
}
