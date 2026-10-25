import { useState, useEffect } from "react";
import { onSnapshot } from "firebase/firestore";
import { dref } from "../base/firebase";
import { Card } from "../ui/base";

// ── Departamentos (búsqueda automática diaria por el bot check_deptos.py) ──
export type Depto = {
  id: string; proyecto: string; inmobiliaria: string; comuna: string; direccion: string;
  cerca_metro: string|null; etapa: string; fecha_entrega: string|null;
  dormitorios: number|string; banos: number|null; m2: number|string|null;
  precio_desde_uf: number|null; subsidio: string|null; amenidades: string[];
  fuente: string; url: string|null; calza_presupuesto: boolean; disponible: boolean; notas: string;
};
export type DeptosData = { departamentos: Depto[]; resumen: string; mejor_opcion: string|null; fecha_consulta: string; error?: boolean };

export function useDepartamentos(): DeptosData|null {
  const [data, setData] = useState<DeptosData|null>(null);
  useEffect(() => {
    const unsub = onSnapshot(dref("departamentos"), snap => {
      if (snap.exists()) setData(snap.data() as DeptosData);
      else setData({ departamentos: [], resumen: "", mejor_opcion: null, fecha_consulta: "" });
    });
    return unsub;
  }, []);
  return data;
}

export function DeptoCard({ d, mejorId }: { d: Depto; mejorId: string|null }) {
  const [exp, setExp] = useState(false);
  const esMejor = d.id === mejorId;
  const precio = d.precio_desde_uf ? `${d.precio_desde_uf.toLocaleString("es-CL")} UF` : "Consultar";
  const etapaColor = d.etapa === "en blanco" ? "#5070a0" : d.etapa === "en verde" ? "#3d8a5c" : "#a07855";
  return (
    <div style={{ background:"#fff", border:esMejor?"2px solid #c9956a":"1px solid #f0e0d0", borderRadius:12, padding:14, marginBottom:10, opacity:d.disponible?1:0.6, boxShadow:esMejor?"0 4px 16px rgba(201,149,106,.18)":"none" }}>
      {esMejor && <div style={{ fontSize:10, fontWeight:700, color:"#c9956a", marginBottom:6 }}>⭐ MÁS RECOMENDADO</div>}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:700, color:"#5c3d2e" }}>{d.proyecto}</div>
          <div style={{ fontSize:11, color:"#a07855" }}>{d.inmobiliaria} · {d.comuna}</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:15, fontWeight:700, color:"#c9956a" }}>{precio}</div>
          <div style={{ fontSize:9, color: d.calza_presupuesto?"#3d8a5c":"#b05050", fontWeight:700 }}>{d.calza_presupuesto?"✓ en presupuesto":"sobre presupuesto"}</div>
        </div>
      </div>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:8 }}>
        <span style={{ fontSize:10, fontWeight:700, color:"#fff", background:etapaColor, borderRadius:6, padding:"2px 8px" }}>{d.etapa}</span>
        <span style={{ fontSize:10, color:"#5c3d2e", background:"#fdf0e8", borderRadius:6, padding:"2px 8px" }}>🛏️ {d.dormitorios}D{d.banos?` · ${d.banos}B`:""}</span>
        {d.m2 && <span style={{ fontSize:10, color:"#5c3d2e", background:"#fdf0e8", borderRadius:6, padding:"2px 8px" }}>📐 {d.m2} m²</span>}
        {d.cerca_metro && <span style={{ fontSize:10, color:"#fff", background:"#d05a2a", borderRadius:6, padding:"2px 8px" }}>🚇 {d.cerca_metro}</span>}
        {d.subsidio && <span style={{ fontSize:10, color:"#5c3d2e", background:"#e8f0e0", borderRadius:6, padding:"2px 8px" }}>🏛️ {d.subsidio}</span>}
      </div>
      <button onClick={()=>setExp(!exp)} style={{ background:"none", border:"none", color:"#c9956a", fontSize:11, fontWeight:700, cursor:"pointer", marginTop:8, padding:0, fontFamily:"inherit" }}>
        {exp ? "Ocultar detalles ▲" : "Ver detalles ▼"}
      </button>
      {exp && (
        <div style={{ marginTop:8, fontSize:11, color:"#7a5c48", lineHeight:1.6 }}>
          {d.direccion && <div>📍 {d.direccion}</div>}
          {d.fecha_entrega && <div>📅 Entrega: {d.fecha_entrega}</div>}
          {d.amenidades?.length>0 && <div>✨ {d.amenidades.join(" · ")}</div>}
          {d.notas && <div style={{ fontStyle:"italic", marginTop:4 }}>{d.notas}</div>}
          <div style={{ marginTop:6, color:"#a07855", fontSize:10 }}>Fuente: {d.fuente}</div>
          {d.url && <a href={d.url} target="_blank" rel="noreferrer" style={{ display:"inline-block", marginTop:8, background:"#c9956a", color:"#fff", borderRadius:8, padding:"7px 14px", fontSize:11, fontWeight:700, textDecoration:"none" }}>Ver proyecto →</a>}
        </div>
      )}
    </div>
  );
}

export function Departamentos() {
  const data = useDepartamentos();
  if (data === null) return <Card><div style={{ textAlign:"center", padding:24, color:"#a07855" }}>Cargando…</div></Card>;
  const lista = data.departamentos || [];
  const dentro = lista.filter(d => d.calza_presupuesto);
  const fuera  = lista.filter(d => !d.calza_presupuesto);
  const fecha = data.fecha_consulta ? new Date(data.fecha_consulta).toLocaleDateString("es-CL", { day:"numeric", month:"long" }) : null;
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
        <span style={{ fontSize:22 }}>🏢</span>
        <div>
          <div style={{ fontSize:18, fontWeight:700, color:"#5c3d2e" }}>Departamentos</div>
          <div style={{ fontSize:10, color:"#a07855" }}>Búsqueda automática diaria · Quilicura / metro L3{fecha?` · actualizado ${fecha}`:""}</div>
        </div>
      </div>
      {data.resumen && <div style={{ background:"#fdf0e8", borderRadius:10, padding:12, fontSize:12, color:"#7a5c48", lineHeight:1.5, margin:"10px 0" }}>{data.resumen}</div>}
      {lista.length === 0 && (
        <Card><div style={{ textAlign:"center", padding:24 }}>
          <div style={{ fontSize:32, marginBottom:8 }}>🏗️</div>
          <div style={{ fontSize:13, fontWeight:700, color:"#5c3d2e", marginBottom:4 }}>Aún sin resultados</div>
          <div style={{ fontSize:11, color:"#a07855", lineHeight:1.5 }}>El bot busca cada día a las 9:30am proyectos en blanco/verde en Quilicura y el eje de la L3. Vuelve mañana o corre la búsqueda manual en el Mac.</div>
        </div></Card>
      )}
      {dentro.length > 0 && <div style={{ fontSize:12, fontWeight:700, color:"#3d8a5c", margin:"8px 0" }}>✓ En presupuesto ({dentro.length})</div>}
      {dentro.map(d => <DeptoCard key={d.id} d={d} mejorId={data.mejor_opcion} />)}
      {fuera.length > 0 && <div style={{ fontSize:12, fontWeight:700, color:"#a07855", margin:"12px 0 8px" }}>Sobre presupuesto ({fuera.length})</div>}
      {fuera.map(d => <DeptoCard key={d.id} d={d} mejorId={data.mejor_opcion} />)}
    </div>
  );
}
