import { useState, useEffect, useRef, useCallback } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { guardarFusionando } from "../../base/guardar";
import { fmt } from "../../base/config";
import { db } from "../../base/firebase";
import { Paquete, PaquetesData, ViajeConfig, ViajesData } from "./datosViaje";
import { LunaItem } from "../../tipos";
import { Card } from "../../ui/base";

export function useViajesConfig() {
  const [data, setDataEstado] = useState<ViajesData>({ viajes: [] });
  const actual = useRef<ViajesData>({ viajes: [] });
  const setData = useCallback((d: ViajesData) => { actual.current = d; setDataEstado(d); }, []);
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "boda", "viajes_config"), snap => {
      if (snap.exists()) setData(snap.data() as ViajesData);
      else setData({ viajes: [] });
    });
    return unsub;
  }, [setData]);
  const guardar = async (nuevo: ViajesData) => {
    const antes = actual.current;
    setData(nuevo);
    await guardarFusionando(doc(db, "boda", "viajes_config"), antes, nuevo);
  };
  return { data, guardar };
}

export function usePaquetes(): Record<string, PaquetesData> {
  const [data, setData] = useState<Record<string, PaquetesData>>({});
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "boda", "paquetes"), snap => {
      if (snap.exists()) setData(snap.data() as Record<string, PaquetesData>);
    });
    return unsub;
  }, []);
  return data;
}

export function PaqueteCard({ p, mejorId }: { p: Paquete; mejorId: string|null }) {
  const [exp, setExp] = useState(false);
  const esMejor = p.id === mejorId;
  return (
    <Card style={{ marginBottom:10, padding:14, border: esMejor ? "2px solid #c9956a" : p.es_oferta ? "2px solid #6aaa96" : "1.5px solid #f0e8e0", background: esMejor ? "#fffaf5" : "#fff" }}>
      <div style={{ display:"flex", gap:5, marginBottom:8, flexWrap:"wrap" as const }}>
        {esMejor && <span style={{ background:"#c9956a", color:"#fff", borderRadius:6, padding:"2px 8px", fontSize:9, fontWeight:700 }}>⭐ MEJOR OPCIÓN</span>}
        {p.es_oferta && <span style={{ background:"#6aaa9622", color:"#6aaa96", border:"1px solid #6aaa9644", borderRadius:6, padding:"2px 8px", fontSize:9, fontWeight:700 }}>OFERTA</span>}
        {!p.disponible && <span style={{ background:"#e0707022", color:"#e07070", border:"1px solid #e0707044", borderRadius:6, padding:"2px 8px", fontSize:9, fontWeight:700 }}>FECHAS CERCANAS</span>}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:700, color:"#5c3d2e" }}>{p.destino} — {p.hotel}</div>
          <div style={{ fontSize:11, color:"#a07855", marginTop:2 }}>{p.categoria_hotel} · {p.pension}</div>
          <div style={{ fontSize:11, color:"#7090c0", marginTop:2 }}>{p.fecha_salida} → {p.fecha_regreso} · {p.noches} noches</div>
          <div style={{ fontSize:10, color:"#a07855", marginTop:2 }}>{p.aerolinea} · {p.fuente}</div>
        </div>
        <div style={{ textAlign:"right" as const, minWidth:90 }}>
          {p.precio_pareja ? (
            <>
              <div style={{ fontSize:15, fontWeight:700, color:"#3060a0" }}>{fmt(p.precio_pareja)}</div>
              <div style={{ fontSize:10, color:"#7090c0" }}>total {p.noches}n</div>
              {p.precio_persona && <div style={{ fontSize:10, color:"#a07855" }}>{fmt(p.precio_persona)}/pers.</div>}
            </>
          ) : <div style={{ fontSize:11, color:"#a07855" }}>Consultar</div>}
        </div>
      </div>
      {p.ahorro_vs_separado != null && (
        <div style={{ background: p.ahorro_vs_separado >= 0 ? "#f0f8f4" : "#fff5f5", borderRadius:8, padding:"5px 10px", marginBottom:8 }}>
          <span style={{ fontSize:11, fontWeight:700, color: p.ahorro_vs_separado >= 0 ? "#6aaa96" : "#e07070" }}>
            {p.ahorro_vs_separado >= 0 ? `Ahorras ${fmt(p.ahorro_vs_separado)} vs separado` : `${fmt(Math.abs(p.ahorro_vs_separado))} más caro que separado`}
          </span>
        </div>
      )}
      {exp && (
        <div style={{ borderTop:"1px solid #f0e8e0", paddingTop:10, marginTop:4 }}>
          <div style={{ display:"flex", gap:8, marginBottom:8 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:10, fontWeight:700, color:"#6aaa96", marginBottom:4 }}>INCLUYE</div>
              {(p.incluye||[]).map((item,i)=><div key={i} style={{ fontSize:11, color:"#5c3d2e", marginBottom:3 }}>✓ {item}</div>)}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:10, fontWeight:700, color:"#e07070", marginBottom:4 }}>NO INCLUYE</div>
              {(p.no_incluye||[]).map((item,i)=><div key={i} style={{ fontSize:11, color:"#5c3d2e", marginBottom:3 }}>✗ {item}</div>)}
            </div>
          </div>
          {p.notas && <div style={{ fontSize:11, color:"#7a5c42", background:"#fdf8f3", borderRadius:8, padding:"8px 10px", marginBottom:8, lineHeight:1.5 }}>{p.notas}</div>}
          {p.url && <a href={p.url} target="_blank" rel="noreferrer" style={{ display:"block", background:"#c9956a", color:"#fff", borderRadius:9, padding:"9px 14px", fontSize:12, fontWeight:700, textDecoration:"none", textAlign:"center" as const }}>Ver paquete y comprar →</a>}
        </div>
      )}
      <button onClick={()=>setExp(!exp)} style={{ width:"100%", background:"none", border:"1px solid #e8d5c4", borderRadius:8, padding:"6px", fontSize:11, color:"#a07855", cursor:"pointer", fontFamily:"inherit", marginTop:exp?8:0 }}>
        {exp ? "▲ Ocultar detalle" : "▼ Ver qué incluye y link de compra"}
      </button>
    </Card>
  );
}

export function useBusquedaPendiente(): { pendiente: boolean; ts: string|null } {
  const [estado, setEstado] = useState({ pendiente: false, ts: null as string|null });
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "boda", "config_busqueda"), snap => {
      if (snap.exists()) {
        const d = snap.data();
        // pendiente = solicitada (esperando al watcher) OR buscando (Claude corriendo)
        setEstado({ pendiente: !!(d.solicitada || d.buscando), ts: d.ts || null });
      } else {
        setEstado({ pendiente: false, ts: null });
      }
    });
    return unsub;
  }, []);
  return estado;
}

export function PaquetesTab({ viajeId, viaje, onBuscarAhora }: { viajeId: string|null; viaje: ViajeConfig|null; onBuscarAhora: (id: string) => void }) {
  const allPaquetes = usePaquetes();
  const busqueda    = useBusquedaPendiente();

  if (!viajeId || !viaje) return (
    <Card style={{ textAlign:"center" as const, padding:32, color:"#a07855" }}>
      <div style={{ fontSize:28, marginBottom:8 }}>✈️</div>
      <div style={{ fontSize:13, fontWeight:700, marginBottom:4 }}>Configura un viaje primero</div>
      <div style={{ fontSize:11 }}>Ve a "Viajes" y crea un viaje para buscar paquetes</div>
    </Card>
  );

  const data = allPaquetes[viajeId] || null;

  // Estado: búsqueda en progreso
  if (busqueda.pendiente) return (
    <Card style={{ textAlign:"center" as const, padding:32, color:"#5070a0", background:"linear-gradient(135deg,#e8f0ff,#d8e8ff)" }}>
      <div style={{ fontSize:32, marginBottom:8, animation:"spin 2s linear infinite", display:"inline-block" }}>🔄</div>
      <div style={{ fontSize:14, fontWeight:700, marginBottom:8 }}>Buscando paquetes para {viaje.destino}...</div>
      <div style={{ fontSize:11, lineHeight:1.8, color:"#4060a0" }}>
        Claude está revisando en este momento:<br/>
        Despegar · LATAM · Falabella Viajes · Atrapalo · Cocha<br/>
        <br/>
        <strong>Tarda entre 5 y 10 minutos.</strong><br/>
        Los resultados aparecen solos cuando termina — no cierres la app.
      </div>
      {busqueda.ts && <div style={{ fontSize:10, color:"#7090c0", marginTop:12, background:"rgba(255,255,255,0.5)", borderRadius:6, padding:"4px 8px", display:"inline-block" }}>
        Iniciado: {new Date(busqueda.ts).toLocaleString("es-CL",{hour:"2-digit",minute:"2-digit"})}
      </div>}
      {data && <div style={{ fontSize:10, color:"#7090c0", marginTop:6 }}>Última búsqueda previa: {new Date(data.fecha_consulta).toLocaleString("es-CL",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</div>}
    </Card>
  );

  // Sin resultados aún
  if (!data) return (
    <Card style={{ textAlign:"center" as const, padding:28, color:"#a07855" }}>
      <div style={{ fontSize:28, marginBottom:8 }}>🔍</div>
      <div style={{ fontSize:13, fontWeight:700, marginBottom:6 }}>Sin resultados aún para {viaje.destino}</div>
      <div style={{ fontSize:11, lineHeight:1.5, marginBottom:14 }}>
        La búsqueda automática corre todos los días a las 9am,<br/>o puedes lanzarla ahora mismo:
      </div>
      <button onClick={()=>onBuscarAhora(viajeId)} style={{ background:"#5070a0", color:"#fff", border:"none", borderRadius:9, padding:"10px 20px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
        🔍 Buscar ahora
      </button>
    </Card>
  );

  // Error en última búsqueda
  if ((data as any).error || !data.paquetes?.length) return (
    <Card style={{ textAlign:"center" as const, padding:28, color:"#a07855" }}>
      <div style={{ fontSize:28, marginBottom:8 }}>📭</div>
      <div style={{ fontSize:13, fontWeight:700, marginBottom:4 }}>
        {(data as any).error ? "Error en la última búsqueda" : "Sin paquetes encontrados aún"}
      </div>
      <div style={{ fontSize:11, color:"#c4a882", lineHeight:1.5, marginBottom:12 }}>{data.resumen || "Puede que no haya paquetes para esas fechas exactas."}</div>
      {data.fecha_consulta && <div style={{ fontSize:10, color:"#c4a882", marginBottom:12 }}>Última búsqueda: {new Date(data.fecha_consulta).toLocaleString("es-CL",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</div>}
      <button onClick={()=>onBuscarAhora(viajeId)} style={{ background:"#5070a0", color:"#fff", border:"none", borderRadius:9, padding:"10px 20px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
        🔍 Buscar de nuevo
      </button>
    </Card>
  );

  return (
    <div>
      <Card style={{ background:"linear-gradient(135deg,#e8f0ff,#d8e8ff)", marginBottom:12, padding:12 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#5070a0" }}>🔄 BÚSQUEDA AUTOMÁTICA DIARIA — 9am</div>
            <div style={{ fontSize:10, color:"#7090c0" }}>{viaje.destino} · {viaje.personas} pers. · {viaje.noches} noches</div>
          </div>
          <div style={{ textAlign:"right" as const, marginLeft:8 }}>
            <div style={{ fontSize:10, color:"#7090c0" }}>Actualizado</div>
            <div style={{ fontSize:11, fontWeight:700, color:"#5070a0" }}>
              {new Date(data.fecha_consulta).toLocaleString("es-CL",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}
            </div>
          </div>
        </div>
        {data.resumen && <div style={{ fontSize:11, color:"#5070a0", marginTop:8, paddingTop:8, borderTop:"1px solid #c0d0f0", lineHeight:1.5 }}>{data.resumen}</div>}
        <button onClick={()=>onBuscarAhora(viajeId)} style={{ width:"100%", marginTop:10, background:"#5070a0", color:"#fff", border:"none", borderRadius:8, padding:"8px", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
          🔍 Buscar de nuevo ahora
        </button>
      </Card>
      {data.paquetes.map(p => <PaqueteCard key={p.id} p={p} mejorId={data.mejor_opcion} />)}
    </div>
  );
}

export function PresupuestoViaje({ viaje, paquetes, mejorPaqueteId, selectedId, onSelectId, lista, onAgregar }: {
  viaje: ViajeConfig;
  paquetes: Paquete[];
  mejorPaqueteId: string | null;
  selectedId: string | null;           // controlado por el padre
  onSelectId: (id: string | null) => void;
  lista: LunaItem[];
  onAgregar: (items: LunaItem[]) => void;
}) {
  // Mostrar todos los paquetes en el selector (no sólo disponibles)
  const todos = paquetes;
  // Para el desglose usar el seleccionado, o el mejor por defecto
  const effectiveId = selectedId ?? mejorPaqueteId ?? todos[0]?.id ?? null;
  const paquete = effectiveId ? (todos.find(p => p.id === effectiveId) || null) : null;

  const noches   = viaje.noches   || 7;
  const personas = viaje.personas || 2;

  const precioPackage = paquete
    ? (paquete.precio_pareja ?? (paquete.precio_persona ? paquete.precio_persona * personas : null))
    : null;

  const estimComida      = Math.round(noches * personas * 28000 / 1000) * 1000;
  const estimTransporte  = Math.round(noches * 9000 / 1000) * 1000;
  const estimActividades = Math.round(noches * personas * 12000 / 1000) * 1000;
  const estimSeguro      = personas * 35000;
  const estimOtros       = Math.round(noches * personas * 8000 / 1000) * 1000;
  const estimVuelos      = personas * 850000;
  const estimHotel       = Math.round(noches * personas * 65000 / 1000) * 1000;

  const baseViaje   = precioPackage ?? (estimVuelos + estimHotel);
  const totalFinal  = baseViaje + estimComida + estimTransporte + estimActividades + estimSeguro + estimOtros;

  const tagViaje  = `[${viaje.id}]`;
  const yaAgregado = lista.some(i => i.notas?.includes(tagViaje));

  const agregarTodo = () => {
    const ts = Date.now();
    const nuevos: LunaItem[] = [
      {
        id: ts+1, categoria:"Vuelos",
        descripcion: paquete
          ? `Paquete ${viaje.destino} — ${paquete.aerolinea} · ${paquete.hotel} (${paquete.noches}n)`
          : `Vuelos + Alojamiento ${viaje.destino} (estimado)`,
        monto: baseViaje, confirmado:false, notas:tagViaje,
      },
      { id:ts+2, categoria:"Comidas",     descripcion:`Comidas ${noches}n · ${personas} pers.`,  monto:estimComida,      confirmado:false, notas:tagViaje },
      { id:ts+3, categoria:"Transporte",  descripcion:`Transporte local ${viaje.destino}`,        monto:estimTransporte,  confirmado:false, notas:tagViaje },
      { id:ts+4, categoria:"Actividades", descripcion:`Excursiones y actividades`,               monto:estimActividades, confirmado:false, notas:tagViaje },
      { id:ts+5, categoria:"Seguro",      descripcion:`Seguro de viaje (${personas} pers.)`,     monto:estimSeguro,      confirmado:false, notas:tagViaje },
      { id:ts+6, categoria:"Otro",        descripcion:`Gastos varios y souvenirs`,               monto:estimOtros,       confirmado:false, notas:tagViaje },
    ];
    onAgregar(nuevos);
  };

  type RowProps = { icon:string; cat:string; desc:string; monto:number; enPaquete?:boolean };
  const Row = ({ icon, cat, desc, monto, enPaquete }: RowProps) => (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:"1px solid #f0e8e0" }}>
      <div style={{ fontSize:20, width:28, textAlign:"center" as const }}>{icon}</div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:12, fontWeight:700, color:"#5c3d2e" }}>{cat}</div>
        <div style={{ fontSize:10, color:"#a07855", lineHeight:1.3 }}>{desc}</div>
      </div>
      <div style={{ textAlign:"right" as const, minWidth:80 }}>
        {enPaquete && <div style={{ fontSize:9, color:"#6aaa96", fontWeight:700, background:"#e8f5ec", padding:"1px 5px", borderRadius:4, marginBottom:2, display:"inline-block" }}>EN PAQUETE</div>}
        <div style={{ fontSize:13, fontWeight:700, color:enPaquete?"#6aaa96":"#4070b0" }}>{fmt(monto)}</div>
      </div>
    </div>
  );

  return (
    <Card style={{ marginTop:14 }}>
      <div style={{ fontSize:13, fontWeight:700, color:"#5c3d2e", marginBottom:3 }}>💰 Desglose del presupuesto</div>
      <div style={{ fontSize:11, color:"#a07855", marginBottom:12 }}>
        {viaje.destino} · {noches} noches · {personas} persona{personas>1?"s":""}
      </div>

      {/* Selector de paquete */}
      {todos.length > 0 && (
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:700, color:"#7090c0", marginBottom:8, letterSpacing:"0.05em" }}>
            ELIGE EL PAQUETE BASE ({todos.length} encontrados)
          </div>
          <div style={{ display:"flex", flexDirection:"column" as const, gap:6 }}>
            {/* Opción sin paquete */}
            <button
              onClick={()=>onSelectId(null)}
              style={{ display:"flex", justifyContent:"space-between", alignItems:"center", textAlign:"left" as const, padding:"9px 12px", borderRadius:9, border:`1.5px solid ${effectiveId===null?"#5070a0":"#e8d5c4"}`, background:effectiveId===null?"#e8f0ff":"#fdf8f3", cursor:"pointer", fontFamily:"inherit", gap:8 }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:effectiveId===null?"#4060a0":"#a07855" }}>Sin paquete — usar estimados</div>
                <div style={{ fontSize:10, color:effectiveId===null?"#6080c0":"#c4a882" }}>Calcula con valores aproximados de mercado</div>
              </div>
              <div style={{ fontSize:12, fontWeight:700, color:effectiveId===null?"#4060a0":"#c4a882" }}>{fmt(estimVuelos+estimHotel)}</div>
            </button>
            {/* Un botón por cada paquete */}
            {todos.map(p => {
              const precio = p.precio_pareja ?? (p.precio_persona ? p.precio_persona*personas : null);
              const active = effectiveId === p.id;
              return (
                <button key={p.id} onClick={()=>onSelectId(p.id)}
                  style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", textAlign:"left" as const, padding:"9px 12px", borderRadius:9, border:`1.5px solid ${active?"#c9956a":"#e8d5c4"}`, background:active?"#fff5ec":"#fdf8f3", cursor:"pointer", fontFamily:"inherit", gap:8 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:2 }}>
                      {mejorPaqueteId===p.id && <span style={{ fontSize:9, background:"#6aaa96", color:"#fff", borderRadius:4, padding:"1px 5px", fontWeight:700 }}>MEJOR</span>}
                      {p.es_oferta && <span style={{ fontSize:9, background:"#e07070", color:"#fff", borderRadius:4, padding:"1px 5px", fontWeight:700 }}>OFERTA</span>}
                      {!p.disponible && <span style={{ fontSize:9, background:"#b0b0b0", color:"#fff", borderRadius:4, padding:"1px 5px", fontWeight:700 }}>NO CONFIRMADO</span>}
                      <span style={{ fontSize:11, fontWeight:700, color:active?"#c9956a":"#a07855" }}>{p.fuente}</span>
                    </div>
                    <div style={{ fontSize:10, color:active?"#a07855":"#c4a882", lineHeight:1.3 }}>
                      {p.hotel} · {p.categoria_hotel} · {p.noches}n
                    </div>
                    <div style={{ fontSize:10, color:active?"#a07855":"#c4a882" }}>{p.aerolinea} · {p.pension}</div>
                  </div>
                  <div style={{ textAlign:"right" as const, flexShrink:0 }}>
                    {precio ? <div style={{ fontSize:13, fontWeight:700, color:active?"#c9956a":"#a07855" }}>{fmt(precio)}</div>
                            : <div style={{ fontSize:11, color:"#c4a882" }}>Ver precio</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Desglose */}
      {paquete ? (
        <Row icon="🎁" cat="Paquete vuelo + hotel"
          desc={`${paquete.aerolinea} · ${paquete.hotel} · ${paquete.noches}n · ${paquete.fuente}`}
          monto={baseViaje} enPaquete />
      ) : (
        <>
          <Row icon="✈️" cat="Vuelos (estimado)"       desc={`Ida y vuelta · ${personas} pers. desde SCL`} monto={estimVuelos} />
          <Row icon="🏨" cat="Alojamiento (estimado)"  desc={`${noches} noches`}                           monto={estimHotel} />
        </>
      )}
      <Row icon="🍽️" cat="Comidas"         desc={`~${fmt(Math.round(estimComida/noches/personas))}/persona/día`} monto={estimComida} />
      <Row icon="🚗" cat="Transporte local" desc="Taxis, Uber, colectivos"                                        monto={estimTransporte} />
      <Row icon="🎯" cat="Actividades"      desc="Excursiones, entradas, paseos"                                  monto={estimActividades} />
      <Row icon="🛡️" cat="Seguro de viaje"  desc={`Assist Card o similar · ${personas} pers.`}                    monto={estimSeguro} />
      <Row icon="🛍️" cat="Gastos varios"    desc="Souvenirs, extras, imprevistos"                                 monto={estimOtros} />

      {/* Total */}
      <div style={{ background:"linear-gradient(135deg,#fdf0e8,#fae0cc)", borderRadius:10, padding:"12px 14px", margin:"14px 0 10px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#8c4820" }}>TOTAL ESTIMADO</div>
          <div style={{ fontSize:22, fontWeight:900, color:"#c9956a" }}>{fmt(totalFinal)}</div>
        </div>
        <div style={{ fontSize:10, color:"#a07855", marginTop:3 }}>
          {personas} persona{personas>1?"s":""} · {noches} noches
          {paquete ? ` · Paquete ${paquete.fuente}` : " · Valores estimados"}
        </div>
      </div>

      {/* Incluye / No incluye */}
      {(paquete?.incluye?.length || 0) > 0 && (
        <div style={{ marginBottom:8 }}>
          <div style={{ fontSize:9, fontWeight:700, color:"#6aaa96", letterSpacing:"0.05em", marginBottom:4 }}>✅ EL PAQUETE INCLUYE</div>
          {paquete!.incluye.map((item,i) => <div key={i} style={{ fontSize:10, color:"#6aaa96", marginBottom:1 }}>• {item}</div>)}
        </div>
      )}
      {(paquete?.no_incluye?.length || 0) > 0 && (
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:9, fontWeight:700, color:"#e07070", letterSpacing:"0.05em", marginBottom:4 }}>⚠️ DEBES PAGAR APARTE</div>
          {paquete!.no_incluye.map((item,i) => <div key={i} style={{ fontSize:10, color:"#c47070", marginBottom:1 }}>• {item}</div>)}
        </div>
      )}

      <button
        onClick={agregarTodo}
        disabled={yaAgregado}
        style={{ width:"100%", background:yaAgregado?"#e8f5ec":"#c9956a", color:yaAgregado?"#6aaa96":"#fff", border:yaAgregado?"1.5px solid #6aaa96":"none", borderRadius:10, padding:"12px", fontSize:12, fontWeight:700, cursor:yaAgregado?"default":"pointer", fontFamily:"inherit" }}>
        {yaAgregado ? "✅ Ya está en tu presupuesto" : "📋 Agregar todo al presupuesto"}
      </button>
    </Card>
  );
}
