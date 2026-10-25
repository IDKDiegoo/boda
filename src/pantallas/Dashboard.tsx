import { fechaLarga, fmt } from "../base/config";
import { infoBoda } from "../base/firebase";
import { useCuentaRegresiva } from "../base/hooks";
import { BannerNotificaciones } from "../componentes/BannerNotificaciones";
import { GastoExtra, Invitado, Proveedor } from "../tipos";
import { Card, Title } from "../ui/base";
import { Icono } from "../ui/iconos";

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
    <div>
      <BannerNotificaciones/>
      <Title icon="anillos" title="Nuestra boda"/>
      {/* Cuenta regresiva */}
      <div style={{ position:"relative", overflow:"hidden", borderRadius:22, marginBottom:16, color:"#fff",
        background:"radial-gradient(120% 140% at 0% 0%, #d9a77b 0%, #b37d52 45%, #8e5d3a 100%)", boxShadow:"0 18px 40px -18px rgba(142,93,58,.65)" }}>
        {(infoBoda().foto || infoBoda().legado) && <img src={infoBoda().foto || "/pareja.jpg"} alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", opacity:.22, mixBlendMode:"luminosity" }}/>}
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(60% 80% at 100% 0%, rgba(255,255,255,.18), transparent 60%)" }}/>
        <div style={{ position:"relative", textAlign:"center", padding:"26px 16px 22px" }}>
          <div style={{ fontSize:11, letterSpacing:".28em", textTransform:"uppercase", opacity:.85, marginBottom:14 }}>Faltan</div>
          <div style={{ display:"flex", justifyContent:"center", gap:8 }}>
            {[{v:cr.dias,l:"días"},{v:cr.horas,l:"horas"},{v:cr.minutos,l:"min"},{v:cr.segundos,l:"seg"}].map(({v,l},k)=>(
              <div key={l} style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
                <div style={{ minWidth:62, background:"rgba(255,255,255,.14)", border:"1px solid rgba(255,255,255,.22)", borderRadius:14, padding:"10px 6px 8px", backdropFilter:"blur(4px)" }}>
                  <div style={{ fontFamily:"var(--titulo)", fontSize:36, fontWeight:600, lineHeight:1, fontVariantNumeric:"lining-nums tabular-nums" }}>{String(v).padStart(2,"0")}</div>
                  <div style={{ fontSize:10, opacity:.85, marginTop:4, letterSpacing:".08em" }}>{l}</div>
                </div>
                {k<3 && <div style={{ fontFamily:"var(--titulo)", fontSize:28, opacity:.5, marginTop:10 }}>:</div>}
              </div>
            ))}
          </div>
          <div style={{ fontFamily:"var(--titulo)", fontSize:19, marginTop:16, opacity:.95 }}>{infoBoda().nombre} · {fechaLarga()}</div>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(150px, 1fr))", gap:12, marginBottom:16 }}>
        {[
          { icon:"invitados", label:"Invitados confirmados", valor:`${confirmados}/${inv.length}`, sub:`${adultos} adultos · ${ninos} niños`, color:"#8a6aa8", pct: inv.length ? confirmados/inv.length : 0 },
          { icon:"presupuesto", label:"Presupuesto total", valor:fmt(gran_total), sub:`Proveedores: ${fmt(totalProv)}`, color:"#4f9a83" },
          { icon:"proveedores", label:"Proveedores listos", valor:`${prov.filter(p=>p.estado==="confirmado").length}/${prov.length}`, sub:"Servicios contratados", color:"#b07d52", pct: prov.length ? prov.filter(p=>p.estado==="confirmado").length/prov.length : 0 },
          { icon:"regalos", label:"Costo por invitados", valor:fmt(costoInv), sub:`$75k adulto · $35k niño`, color:"#c96a6a" },
        ].map((s,k)=>(
          <Card key={s.label} style={{ padding:16, animation:`fadeUp .4s ${k*0.05}s both` }}>
            <span style={{ width:36, height:36, borderRadius:11, display:"grid", placeItems:"center", background:s.color+"18", color:s.color, marginBottom:10 }}><Icono n={s.icon} tam={19}/></span>
            <div style={{ fontFamily:"var(--titulo)", fontSize:25, fontWeight:600, color:"var(--tinta)", lineHeight:1.05, fontVariantNumeric:"lining-nums tabular-nums" }}>{s.valor}</div>
            <div style={{ fontSize:12, color:"var(--cafe)", marginTop:4, fontWeight:500 }}>{s.label}</div>
            <div style={{ fontSize:11, color:"var(--tenue)", marginTop:2 }}>{s.sub}</div>
            {s.pct!=null && <div style={{ height:4, borderRadius:4, background:"#f3e7dc", marginTop:10, overflow:"hidden" }}><div style={{ width:`${Math.round(s.pct*100)}%`, height:"100%", borderRadius:4, background:s.color, transition:"width .8s ease" }}/></div>}
          </Card>
        ))}
      </div>
      <Card>
        <div style={{ fontFamily:"var(--titulo)", fontSize:20, fontWeight:600, color:"var(--tinta)", marginBottom:10 }}>Desglose de costos</div>
        {[
          { l:`Adultos (${adultos} × $75.000)`, v:adultos*75000 },
          { l:`Niños (${ninos} × $35.000)`,     v:ninos*35000 },
          { l:"Proveedores y servicios",          v:totalProv },
          { l:"Otros gastos",                     v:totalGastos },
        ].map(r=>(
          <div key={r.l} style={{ display:"flex", justifyContent:"space-between", gap:10, padding:"10px 0", borderBottom:"1px solid #f5e8dc" }}>
            <span style={{ fontSize:13.5, color:"var(--suave)" }}>{r.l}</span>
            <span style={{ fontSize:13.5, fontWeight:600, color:"var(--cafe)", fontVariantNumeric:"lining-nums tabular-nums" }}>{fmt(r.v)}</span>
          </div>
        ))}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", paddingTop:12 }}>
          <span style={{ fontSize:12, fontWeight:600, color:"var(--cafe)", letterSpacing:".14em" }}>TOTAL</span>
          <span style={{ fontFamily:"var(--titulo)", fontSize:26, fontWeight:600, color:"var(--dorado-osc)", fontVariantNumeric:"lining-nums tabular-nums" }}>{fmt(gran_total)}</span>
        </div>
      </Card>
    </div>
  );
}
