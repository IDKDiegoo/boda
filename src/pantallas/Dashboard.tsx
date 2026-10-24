import { fmt } from "../base/config";
import { useCuentaRegresiva } from "../base/hooks";
import { BannerNotificaciones } from "../componentes/BannerNotificaciones";
import { GastoExtra, Invitado, Proveedor } from "../tipos";
import { Card, Title } from "../ui/base";

export function Dashboard({ invitados, proveedores, gastos }: { invitados:{invitados:Invitado[]}; proveedores:{proveedores:Proveedor[]}; gastos:{gastos:GastoExtra[]} }) {
  const inv   = invitados.invitados   || [];
  const prov  = proveedores.proveedores || [];
  const gsts  = gastos.gastos         || [];
  const adultos = inv.filter(i=>i.tipo==="adulto").length;
  const ninos   = inv.filter(i=>i.tipo==="niño").length;
  const costoInv= adultos*75000 + ninos*35000;
  const totalProv = prov.filter(p=>p.estado!=="descartado").reduce((s,p)=>s+p.costo+(p.extras||[]).reduce((a,e)=>a+e.monto,0),0);
  const totalGastos = gsts.reduce((s,g)=>s+g.monto,0);
  const gran_total  = costoInv + totalProv + totalGastos;
  const confirmados = inv.filter(i=>i.confirmado==="si").length;

  const cr = useCuentaRegresiva();

  return (
    <div style={{ animation:"fadeUp .3s ease" }}>
      <BannerNotificaciones/>
      <Title icon="💍" title="Nuestra Boda"/>
      <Card style={{ background:"linear-gradient(135deg,#c9956a,#a07040)", marginBottom:16, overflow:"hidden", position:"relative" }}>
        <img src="/pareja.jpg" alt="Diego & Camila" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", opacity:0.25 }}/>
        <div style={{ position:"relative", textAlign:"center", padding:"8px 0" }}>
          <div style={{ fontSize:11, color:"#ffe8d4", letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:12 }}>Faltan</div>
          <div style={{ display:"flex", justifyContent:"center", gap:12, marginBottom:12 }}>
            {[{v:cr.dias,l:"días"},{v:cr.horas,l:"horas"},{v:cr.minutos,l:"min"},{v:cr.segundos,l:"seg"}].map(({v,l})=>(
              <div key={l} style={{ textAlign:"center" }}>
                <div style={{ fontSize:36, fontWeight:700, color:"#fff", lineHeight:1, fontVariantNumeric:"tabular-nums", minWidth:48 }}>{String(v).padStart(2,"0")}</div>
                <div style={{ fontSize:10, color:"#ffd4b8", marginTop:3, letterSpacing:"0.05em" }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:13, color:"#ffe8d4" }}>Diego & Camila · 27 de Noviembre 2027 💍</div>
        </div>
      </Card>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
        {[
          { icon:"👥", label:"Invitados", valor:`${confirmados}/${inv.length}`, sub:`${adultos} adultos · ${ninos} niños`, color:"#9b7bb5" },
          { icon:"💰", label:"Presupuesto total", valor:fmt(gran_total), sub:`Proveedores: ${fmt(totalProv)}`, color:"#6aaa96" },
          { icon:"✅", label:"Proveedores OK", valor:`${prov.filter(p=>p.estado==="confirmado").length}/${prov.length}`, sub:"Servicios contratados", color:"#c9956a" },
          { icon:"🎁", label:"Costo invitados", valor:fmt(costoInv), sub:`$75k adulto · $35k niño`, color:"#e07070" },
        ].map(s=>(
          <Card key={s.label} style={{ padding:16 }}>
            <div style={{ fontSize:22, marginBottom:6 }}>{s.icon}</div>
            <div style={{ fontSize:18, fontWeight:700, color:s.color }}>{s.valor}</div>
            <div style={{ fontSize:11, color:"#a07855", marginTop:2 }}>{s.label}</div>
            <div style={{ fontSize:10, color:"#c4a882", marginTop:1 }}>{s.sub}</div>
          </Card>
        ))}
      </div>
      <Card>
        <div style={{ fontSize:13, fontWeight:700, color:"#5c3d2e", marginBottom:12 }}>💵 Desglose de costos</div>
        {[
          { l:`Adultos (${adultos} × $75.000)`, v:adultos*75000 },
          { l:`Niños (${ninos} × $35.000)`,     v:ninos*35000 },
          { l:"Proveedores y servicios",          v:totalProv },
          { l:"Otros gastos",                     v:totalGastos },
        ].map(r=>(
          <div key={r.l} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #f5e8dc" }}>
            <span style={{ fontSize:13, color:"#a07855" }}>{r.l}</span>
            <span style={{ fontSize:13, fontWeight:700, color:"#5c3d2e" }}>{fmt(r.v)}</span>
          </div>
        ))}
        <div style={{ display:"flex", justifyContent:"space-between", paddingTop:10, marginTop:4 }}>
          <span style={{ fontSize:14, fontWeight:700, color:"#5c3d2e" }}>TOTAL</span>
          <span style={{ fontSize:14, fontWeight:700, color:"#c9956a" }}>{fmt(gran_total)}</span>
        </div>
      </Card>
    </div>
  );
}
