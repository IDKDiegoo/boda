import { useState } from "react";
import { setDoc } from "firebase/firestore";
import { fmt } from "../../base/config";
import { dref } from "../../base/firebase";
import { PaquetesTab, PresupuestoViaje, usePaquetes, useViajesConfig } from "./Paquetes";
import { CATS_LUNA, DESTINOS, Destino, ITINERARIO_BZC, ITINERARIO_FLN, PRESUPUESTOS, VENTANAS, Ventana, ViajeConfig } from "./datosViaje";
import { LunaItem } from "../../tipos";
import { Btn, Card, Inp, Sel, Title } from "../../ui/base";

export function LunaMiel({ data, setData }: { data:{items:LunaItem[]}; setData:(d:any)=>void }) {
  const lista = data.items || [];
  const [subTab, setSubTab]   = useState<"viajes"|"paquetes"|"gastos">("viajes");
  const [destino, setDestino] = useState<Destino>("bzc");
  const [ventana, setVentana] = useState<Ventana>("ene");
  const [form, setForm]       = useState<Partial<LunaItem>>({ categoria:"Vuelos" });
  const [showForm, setShowForm] = useState(false);

  // ── Trip planner state ─────────────────────────────────────
  const { data: viajesData, guardar: guardarViajes } = useViajesConfig();
  const allPaquetes = usePaquetes();
  const viajes = viajesData.viajes || [];
  const [selectedViajeId,    setSelectedViajeId]    = useState<string|null>(null);
  const [selectedPaqueteId,  setSelectedPaqueteId]  = useState<string|null>(null);
  const [showNuevoViaje,     setShowNuevoViaje]      = useState(false);
  const [showGuia,           setShowGuia]            = useState(false);
  const [vForm, setVForm] = useState({ nombre:"", destino:"", fechaSalida:"", fechaRegreso:"", personas:"2", notas:"" });

  const selectedViaje = viajes.find(v => v.id === selectedViajeId) || (viajes.length > 0 ? viajes[0] : null);

  const viajeDataPaquetes = selectedViaje ? allPaquetes[selectedViaje.id] : null;

  const calcNoches = (s: string, r: string) => {
    if (!s || !r) return 0;
    return Math.max(0, Math.round((new Date(r).getTime() - new Date(s).getTime()) / 86400000));
  };

  const solicitarBusqueda = async (viajeId?: string) => {
    await setDoc(dref("config_busqueda"), {
      solicitada: true,
      viaje_id: viajeId || null,
      ts: new Date().toISOString(),
    }, { merge: true });
  };

  const guardarNuevoViaje = async () => {
    if (!vForm.nombre || !vForm.destino || !vForm.fechaSalida || !vForm.fechaRegreso) return;
    const nuevo: ViajeConfig = {
      id: `viaje_${Date.now()}`,
      nombre: vForm.nombre,
      destino: vForm.destino,
      fechaSalida: vForm.fechaSalida,
      fechaRegreso: vForm.fechaRegreso,
      noches: calcNoches(vForm.fechaSalida, vForm.fechaRegreso),
      personas: Number(vForm.personas) || 2,
      notas: vForm.notas,
      creado: new Date().toISOString(),
    };
    await guardarViajes({ viajes: [...viajes, nuevo] });
    await solicitarBusqueda(nuevo.id);  // búsqueda inmediata al crear
    setSelectedViajeId(nuevo.id);
    setShowNuevoViaje(false);
    setVForm({ nombre:"", destino:"", fechaSalida:"", fechaRegreso:"", personas:"2", notas:"" });
    setSubTab("paquetes");
  };

  const eliminarViaje = async (id: string) => {
    await guardarViajes({ viajes: viajes.filter(v => v.id !== id) });
    if (selectedViajeId === id) setSelectedViajeId(null);
  };

  const total  = lista.reduce((s,i)=>s+i.monto,0);
  const pagado = lista.filter(i=>i.confirmado).reduce((s,i)=>s+i.monto,0);

  const guardar = () => {
    if (!form.descripcion) return;
    setData({ items:[...lista,{ id:Date.now(), categoria:form.categoria||"Otro", descripcion:form.descripcion!, monto:Number(form.monto)||0, confirmado:false, notas:form.notas||"" }] });
    setForm({ categoria:"Vuelos" }); setShowForm(false);
  };
  const toggle   = (id:number) => setData({ items:lista.map(i=>i.id===id?{...i,confirmado:!i.confirmado}:i) });
  const eliminar = (id:number) => setData({ items:lista.filter(i=>i.id!==id) });

  const d   = DESTINOS[destino];
  const pre = PRESUPUESTOS[destino][ventana];
  const itinerario = destino === "fln" ? ITINERARIO_FLN : ITINERARIO_BZC;

  const calcMin = () => pre.vuelos.min + pre.hotel.min + (pre.transfer?.min||0) + pre.comida.min + pre.actividades.min + pre.seguro.min;
  const calcMax = () => pre.vuelos.max + pre.hotel.max + (pre.transfer?.max||0) + pre.comida.max + pre.actividades.max + pre.seguro.max;

  const TAB_BTN = (id:"viajes"|"paquetes"|"gastos", label:string, icon:string) => (
    <button onClick={()=>setSubTab(id)} style={{ flex:1, background:subTab===id?"#c9956a":"#fdf8f3", border:`1.5px solid ${subTab===id?"#c9956a":"#e8d5c4"}`, color:subTab===id?"#fff":"#a07855", borderRadius:9, padding:"8px 4px", fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", flexDirection:"column" as const, alignItems:"center", gap:2 }}>
      <span style={{ fontSize:15 }}>{icon}</span>{label}
    </button>
  );

  return (
    <div style={{ animation:"fadeUp .3s ease" }}>
      <Title icon="✈️" title="Planificador de Viajes"/>

      {/* Sub-tabs */}
      <div style={{ display:"flex", gap:5, marginBottom:16 }}>
        {TAB_BTN("viajes","Viajes","🗺️")}
        {TAB_BTN("paquetes","Paquetes","🎁")}
        {TAB_BTN("gastos","Mis Gastos","📋")}
      </div>

      {/* ── TAB: VIAJES ── */}
      {subTab==="viajes" && (
        <div>
          {/* ── Nuevo viaje form ─────────────────────────────── */}
          {showNuevoViaje ? (
            <Card style={{ marginBottom:16, border:"2px solid #c9956a" }}>
              <div style={{ fontSize:14, fontWeight:700, color:"#5c3d2e", marginBottom:14 }}>Nuevo viaje</div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <Inp value={vForm.nombre} onChange={v=>setVForm({...vForm,nombre:v})} placeholder="Nombre del viaje (ej: Luna de miel, Viaje familia)"/>
                <Inp value={vForm.destino} onChange={v=>setVForm({...vForm,destino:v})} placeholder="Destino (ej: Florianópolis Brasil, Buenos Aires)"/>
                <div style={{ display:"flex", gap:8 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:10, color:"#a07855", marginBottom:4 }}>Salida</div>
                    <input type="date" value={vForm.fechaSalida} onChange={e=>setVForm({...vForm,fechaSalida:e.target.value})} style={{ width:"100%", background:"#fdf8f3", border:"1.5px solid #e8d5c4", borderRadius:9, padding:"8px 10px", fontSize:12, color:"#5c3d2e", fontFamily:"inherit", boxSizing:"border-box" as const }}/>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:10, color:"#a07855", marginBottom:4 }}>Regreso</div>
                    <input type="date" value={vForm.fechaRegreso} onChange={e=>setVForm({...vForm,fechaRegreso:e.target.value})} style={{ width:"100%", background:"#fdf8f3", border:"1.5px solid #e8d5c4", borderRadius:9, padding:"8px 10px", fontSize:12, color:"#5c3d2e", fontFamily:"inherit", boxSizing:"border-box" as const }}/>
                  </div>
                </div>
                {vForm.fechaSalida && vForm.fechaRegreso && (
                  <div style={{ fontSize:11, color:"#6aaa96", fontWeight:700, textAlign:"center" as const }}>
                    {calcNoches(vForm.fechaSalida, vForm.fechaRegreso)} noches
                  </div>
                )}
                <div>
                  <div style={{ fontSize:10, color:"#a07855", marginBottom:4 }}>Número de personas</div>
                  <div style={{ display:"flex", gap:8 }}>
                    {["1","2","3","4","5","6"].map(n=>(
                      <button key={n} onClick={()=>setVForm({...vForm,personas:n})} style={{ flex:1, background:vForm.personas===n?"#c9956a":"#fdf8f3", border:`1.5px solid ${vForm.personas===n?"#c9956a":"#e8d5c4"}`, color:vForm.personas===n?"#fff":"#a07855", borderRadius:8, padding:"8px 4px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{n}</button>
                    ))}
                  </div>
                </div>
                <Inp value={vForm.notas} onChange={v=>setVForm({...vForm,notas:v})} placeholder="Notas opcionales (presupuesto máx, preferencias...)"/>
              </div>
              <div style={{ display:"flex", gap:8, marginTop:14 }}>
                <Btn onClick={guardarNuevoViaje}>Guardar viaje</Btn>
                <Btn onClick={()=>setShowNuevoViaje(false)} outline>Cancelar</Btn>
              </div>
            </Card>
          ) : (
            <Btn onClick={()=>setShowNuevoViaje(true)} style={{ marginBottom:16, width:"100%" }}>+ Nuevo viaje</Btn>
          )}

          {/* ── Lista de viajes guardados ─────────────────────── */}
          {viajes.length === 0 && !showNuevoViaje && (
            <Card style={{ textAlign:"center" as const, padding:32, color:"#a07855" }}>
              <div style={{ fontSize:28, marginBottom:8 }}>🗺️</div>
              <div style={{ fontSize:13, fontWeight:700, marginBottom:4 }}>Sin viajes configurados</div>
              <div style={{ fontSize:11, lineHeight:1.5 }}>Crea un viaje y Claude buscará paquetes automáticamente cada día a las 9am</div>
            </Card>
          )}
          {viajes.map(v => {
            const sel = v.id === (selectedViaje?.id);
            return (
              <Card key={v.id} style={{ marginBottom:10, padding:14, border: sel ? "2px solid #c9956a" : "1.5px solid #f0e8e0", background: sel ? "#fffaf5" : "#fff" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#5c3d2e" }}>{v.nombre}</div>
                    <div style={{ fontSize:12, color:"#a07855", marginTop:2 }}>📍 {v.destino}</div>
                    <div style={{ fontSize:11, color:"#7090c0", marginTop:3 }}>
                      {v.fechaSalida} → {v.fechaRegreso} · <strong>{v.noches} noches</strong> · {v.personas} persona{v.personas!==1?"s":""}
                    </div>
                    {v.notas && <div style={{ fontSize:10, color:"#c4a882", marginTop:3 }}>{v.notas}</div>}
                  </div>
                  <button onClick={()=>eliminarViaje(v.id)} style={{ background:"none", border:"none", color:"#e07070", cursor:"pointer", fontSize:18, padding:"0 4px" }}>🗑</button>
                </div>
                <div style={{ display:"flex", gap:6, marginTop:10 }}>
                  <button onClick={()=>{ setSelectedViajeId(v.id); setSubTab("paquetes"); }} style={{ flex:2, background:"#c9956a", color:"#fff", border:"none", borderRadius:9, padding:"9px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                    Ver paquetes →
                  </button>
                  <button onClick={async ()=>{ await solicitarBusqueda(v.id); setSelectedViajeId(v.id); setSubTab("paquetes"); }} style={{ flex:1, background:"#5070a0", color:"#fff", border:"none", borderRadius:9, padding:"9px", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                    🔍 Buscar ahora
                  </button>
                </div>
              </Card>
            );
          })}

          {/* ── Guías de destino (collapsible) ───────────────── */}
          <button onClick={()=>setShowGuia(!showGuia)} style={{ width:"100%", background:"#fdf8f3", border:"1.5px solid #e8d5c4", borderRadius:10, padding:"12px", fontSize:12, fontWeight:700, color:"#a07855", cursor:"pointer", fontFamily:"inherit", marginTop:8, display:"flex", justifyContent:"space-between" as const, alignItems:"center" }}>
            <span>📚 Guías: Florianópolis & Búzios</span>
            <span>{showGuia?"▲":"▼"}</span>
          </button>
          {showGuia && (
            <div style={{ marginTop:8 }}>
              {/* Selector destino guía */}
              <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                {(["fln","bzc"] as Destino[]).map(id=>{
                  const dest = DESTINOS[id];
                  const sel  = destino === id;
                  return (
                    <button key={id} onClick={()=>setDestino(id)} style={{ flex:1, background:sel?"linear-gradient(135deg,#c9956a,#e8b48a)":"#fff", border:`2px solid ${sel?"#c9956a":"#e8d5c4"}`, borderRadius:12, padding:"10px 8px", cursor:"pointer", fontFamily:"inherit", textAlign:"left" as const }}>
                      <div style={{ fontSize:18, marginBottom:3 }}>{dest.emoji}</div>
                      <div style={{ fontSize:12, fontWeight:700, color:sel?"#fff":"#5c3d2e" }}>{dest.nombre}</div>
                      <div style={{ fontSize:9, color:sel?"#fde8d0":"#a07855" }}>{dest.perfil}</div>
                    </button>
                  );
                })}
              </div>
              <Card style={{ background:"linear-gradient(135deg,#fdf0e8,#fae8d8)", marginBottom:12, border:"1.5px solid #e8d5c4" }}>
                <div style={{ fontSize:14, fontWeight:700, color:"#5c3d2e", marginBottom:4 }}>{d.emoji} {d.nombre}</div>
                <div style={{ fontSize:12, color:"#7a5c42", marginBottom:10, lineHeight:1.5 }}>{d.descripcion}</div>
                <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:"#6aaa96", marginBottom:3 }}>LO BUENO</div>
                    {d.pros.map((p,i)=><div key={i} style={{ fontSize:11, color:"#5c3d2e", marginBottom:2 }}>✓ {p}</div>)}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:"#e07070", marginBottom:3 }}>A TENER EN CUENTA</div>
                    {d.contras.map((c,i)=><div key={i} style={{ fontSize:11, color:"#5c3d2e", marginBottom:2 }}>• {c}</div>)}
                  </div>
                </div>
                {/* Selector ventana */}
                <div style={{ display:"flex", gap:6, marginBottom:10 }}>
                  {(["dic","ene"] as Ventana[]).map(id=>{
                    const ven = VENTANAS[id]; const sel = ventana === id;
                    return <button key={id} onClick={()=>setVentana(id)} style={{ flex:1, background:sel?"#c9956a":"#fdf8f3", border:`1.5px solid ${sel?"#c9956a":"#e8d5c4"}`, color:sel?"#fff":"#a07855", borderRadius:8, padding:"6px 4px", fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{ven.icon} {ven.label}</button>;
                  })}
                </div>
                {/* Presupuesto estimado */}
                <div style={{ background:"#fff", borderRadius:10, padding:12 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:"#5070a0", marginBottom:6 }}>PRESUPUESTO ESTIMADO — {ventana==="dic"?"7 noches Diciembre":"7 noches Enero"}</div>
                  {[
                    { icon:"✈️", l:"Vuelos", data:pre.vuelos },
                    ...(pre.transfer ? [{ icon:"🚌", l:"Transfer", data:pre.transfer }] : []),
                    { icon:"🏨", l:"Hotel 7n", data:pre.hotel },
                    { icon:"🍽️", l:"Comida", data:pre.comida },
                    { icon:"🏄", l:"Actividades", data:pre.actividades },
                    { icon:"🛡️", l:"Seguro", data:pre.seguro },
                  ].map((item,i)=>(
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid #f5ede4" }}>
                      <span style={{ fontSize:11, color:"#5c3d2e" }}>{item.icon} {item.l}</span>
                      <span style={{ fontSize:11, fontWeight:700, color:"#3060a0" }}>{fmt(item.data.min)} – {fmt(item.data.max)}</span>
                    </div>
                  ))}
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:8, paddingTop:6, borderTop:"2px solid #e8d5c4" }}>
                    <span style={{ fontSize:12, fontWeight:700, color:"#5c3d2e" }}>TOTAL PAREJA</span>
                    <span style={{ fontSize:14, fontWeight:700, color:"#3060a0" }}>{fmt(calcMin())} – {fmt(calcMax())}</span>
                  </div>
                  {/* Links compra */}
                  <div style={{ marginTop:10, display:"flex", flexWrap:"wrap" as const, gap:5 }}>
                    {pre.vuelos.links.map((lnk,i)=>(
                      <a key={i} href={lnk.url} target="_blank" rel="noreferrer" style={{ background:"#c9956a", color:"#fff", borderRadius:7, padding:"4px 9px", fontSize:10, fontWeight:700, textDecoration:"none" }}>{lnk.label} →</a>
                    ))}
                  </div>
                </div>
                {/* Itinerario sugerido */}
                <div style={{ marginTop:10 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:"#a07855", marginBottom:6 }}>ITINERARIO SUGERIDO</div>
                  {itinerario.map((item,i)=>(
                    <div key={i} style={{ display:"flex", gap:8, marginBottom:5 }}>
                      <div style={{ minWidth:40, background:"#c9956a22", borderRadius:6, padding:"3px 5px", textAlign:"center" as const }}>
                        <div style={{ fontSize:9, fontWeight:700, color:"#c9956a" }}>{item.dia}</div>
                      </div>
                      <div style={{ flex:1, fontSize:11, color:"#5c3d2e", paddingTop:3, lineHeight:1.4 }}>{item.plan}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: PAQUETES ── */}
      {subTab==="paquetes" && (
        <div>
          {/* Selector de viaje si hay varios */}
          {viajes.length > 1 && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:10, fontWeight:700, color:"#a07855", marginBottom:6 }}>VIAJE SELECCIONADO</div>
              {viajes.map(v => (
                <button key={v.id} onClick={()=>setSelectedViajeId(v.id)} style={{ display:"block", width:"100%", textAlign:"left" as const, background:selectedViaje?.id===v.id?"#c9956a":"#fdf8f3", border:`1.5px solid ${selectedViaje?.id===v.id?"#c9956a":"#e8d5c4"}`, color:selectedViaje?.id===v.id?"#fff":"#a07855", borderRadius:9, padding:"9px 12px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", marginBottom:5 }}>
                  {v.nombre} — {v.destino} · {v.noches}n · {v.personas} pers.
                </button>
              ))}
            </div>
          )}
          <PaquetesTab viajeId={selectedViaje?.id || null} viaje={selectedViaje || null} onBuscarAhora={solicitarBusqueda}/>
          {selectedViaje && (
            <PresupuestoViaje
              viaje={selectedViaje}
              paquetes={viajeDataPaquetes?.paquetes || []}
              mejorPaqueteId={viajeDataPaquetes?.mejor_opcion || null}
              selectedId={selectedPaqueteId}
              onSelectId={setSelectedPaqueteId}
              lista={lista}
              onAgregar={(items) => setData({ items:[...lista, ...items] })}
            />
          )}
        </div>
      )}

      {/* ── TAB: MIS GASTOS ── */}
      {subTab==="gastos" && (
        <div>
          <Card style={{ background:"linear-gradient(135deg,#e8f4ff,#d8e8ff)", marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <div><div style={{ fontSize:11, color:"#7090c0" }}>Total registrado</div><div style={{ fontSize:22, fontWeight:700, color:"#4070b0" }}>{fmt(total)}</div></div>
              <div><div style={{ fontSize:11, color:"#7090c0" }}>Confirmado/Pagado</div><div style={{ fontSize:22, fontWeight:700, color:"#6aaa96" }}>{fmt(pagado)}</div></div>
            </div>
          </Card>
          {showForm && (
            <Card style={{ marginBottom:16, border:"2px solid #e8d5c4" }}>
              <div style={{ fontSize:14, fontWeight:700, color:"#5c3d2e", marginBottom:14 }}>Nuevo gasto</div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <Sel value={form.categoria||"Vuelos"} onChange={v=>setForm({...form,categoria:v})} options={CATS_LUNA.map(c=>({value:c,label:c}))}/>
                <Inp value={form.descripcion||""} onChange={v=>setForm({...form,descripcion:v})} placeholder="Descripción"/>
                <Inp value={form.monto?.toString()||""} onChange={v=>setForm({...form,monto:Number(v)})} placeholder="Costo ($)" type="number"/>
                <Inp value={form.notas||""} onChange={v=>setForm({...form,notas:v})} placeholder="Notas (fechas, aerolínea, etc.)"/>
              </div>
              <div style={{ display:"flex", gap:8, marginTop:14 }}>
                <Btn onClick={guardar}>Guardar</Btn>
                <Btn onClick={()=>{setShowForm(false);setForm({categoria:"Vuelos"});}} outline>Cancelar</Btn>
              </div>
            </Card>
          )}
          {!showForm && <Btn onClick={()=>setShowForm(true)} style={{ marginBottom:16 }}>+ Agregar gasto</Btn>}
          {CATS_LUNA.map(cat=>{
            const items = lista.filter(i=>i.categoria===cat);
            if (!items.length) return null;
            return (
              <div key={cat} style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#7090c0", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.08em" }}>{cat}</div>
                {items.map(i=>(
                  <Card key={i.id} style={{ padding:14, marginBottom:8, background:i.confirmado?"#f0f8f4":"#fff" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:"#5c3d2e" }}>{i.descripcion}</div>
                        {i.notas && <div style={{ fontSize:11, color:"#a07855", marginTop:2 }}>{i.notas}</div>}
                        <div style={{ fontSize:14, fontWeight:700, color:"#4070b0", marginTop:4 }}>{fmt(i.monto)}</div>
                      </div>
                      <div style={{ display:"flex", gap:6 }}>
                        <button onClick={()=>toggle(i.id)} style={{ background:i.confirmado?"#e8f5ec":"none", border:`1px solid ${i.confirmado?"#6aaa96":"#e8d5c4"}`, borderRadius:6, padding:"4px 8px", fontSize:11, color:i.confirmado?"#6aaa96":"#a07855", cursor:"pointer", fontFamily:"inherit" }}>{i.confirmado?"✓ Pagado":"Confirmar"}</button>
                        <button onClick={()=>eliminar(i.id)} style={{ background:"none", border:"none", color:"#e07070", cursor:"pointer", fontSize:14 }}>🗑</button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            );
          })}
          {lista.length===0 && <div style={{ textAlign:"center", color:"#c4a882", padding:32 }}>Aún no hay gastos registrados.<br/>Usa el Presupuesto para planificar ✈️</div>}
        </div>
      )}
    </div>
  );
}
