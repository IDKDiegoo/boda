import { useState } from "react";
import { useData } from "../base/hooks";
import { Invitados } from "./Invitados";
import { Btn, Card, Title } from "../ui/base";

// ════════════════════════════════════════════════════════════════
// CHECKLIST
// ════════════════════════════════════════════════════════════════
export type Tarea = { id:number; titulo:string; categoria:string; hecho:boolean; prioridad:"alta"|"media"|"baja"; fecha?:string; notas?:string; };

export const CATS_CHECK   = ["Boda Civil","Matrimonio","Vestimenta","Decoración","Catering","Música","Fotografía","Trámites","Invitados","Luna de miel","Otro"];
export const PRIO_COLOR   = { alta:"#e8544a", media:"#e8a94a", baja:"#6ab04c" };
export const PRIO_LABEL   = { alta:"Alta", media:"Media", baja:"Baja" };

export function CheckList() {
  const [data, setData] = useData<{tareas:Tarea[]}>("checklist", {tareas:[]});
  const [form,    setForm]    = useState(false);
  const [edit,    setEdit]    = useState<Tarea|null>(null);
  const [filtro,  setFiltro]  = useState<"todas"|"pendientes"|"hechas">("pendientes");
  const [cat,     setCat]     = useState("Todas");
  const [nueva,   setNueva]   = useState<Partial<Tarea>>({titulo:"",categoria:"Otro",prioridad:"media",fecha:"",notas:""});

  const tareas  = data.tareas || [];
  const guardar = (t: Tarea[]) => setData({tareas:t});

  const filtradas = tareas
    .filter(t => filtro==="todas" ? true : filtro==="hechas" ? t.hecho : !t.hecho)
    .filter(t => cat==="Todas" || t.categoria===cat)
    .sort((a,b) => {
      if (a.hecho !== b.hecho) return a.hecho ? 1 : -1;
      const p = {alta:0,media:1,baja:2};
      return p[a.prioridad] - p[b.prioridad];
    });

  const hechas    = tareas.filter(t=>t.hecho).length;
  const pct       = tareas.length ? Math.round((hechas/tareas.length)*100) : 0;

  const toggleHecho = (id:number) => guardar(tareas.map(t => t.id===id ? {...t,hecho:!t.hecho} : t));
  const eliminar    = (id:number) => { if (!window.confirm("¿Eliminar esta tarea?")) return; guardar(tareas.filter(t=>t.id!==id)); };

  const handleGuardar = () => {
    if (!nueva.titulo?.trim()) return;
    if (edit) {
      guardar(tareas.map(t => t.id===edit.id ? {...t,...nueva} as Tarea : t));
    } else {
      const t: Tarea = { id:Date.now(), titulo:nueva.titulo!, categoria:nueva.categoria||"Otro", hecho:false, prioridad:(nueva.prioridad||"media") as any, fecha:nueva.fecha, notas:nueva.notas };
      guardar([...tareas, t]);
    }
    setForm(false); setEdit(null); setNueva({titulo:"",categoria:"Otro",prioridad:"media",fecha:"",notas:""});
  };

  const abrirEditar = (t:Tarea) => { setEdit(t); setNueva({...t}); setForm(true); };

  return (
    <div style={{animation:"fadeUp .3s ease"}}>
      <Title icon="✅" title="Lista de pendientes"/>

      {/* Progreso */}
      <Card style={{marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:13,fontWeight:700,color:"#5c3d2e"}}>{hechas} de {tareas.length} completadas</div>
          <div style={{fontSize:18,fontWeight:800,color:"#c9956a"}}>{pct}%</div>
        </div>
        <div style={{height:8,background:"#f0e0d0",borderRadius:4}}>
          <div style={{height:8,borderRadius:4,background:"linear-gradient(90deg,#c9956a,#e8b88a)",width:`${pct}%`,transition:"width .4s ease"}}/>
        </div>
        {tareas.filter(t=>!t.hecho&&t.prioridad==="alta").length>0&&(
          <div style={{marginTop:10,background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:"8px 10px",fontSize:11,color:"#e8544a"}}>
            ⚠️ {tareas.filter(t=>!t.hecho&&t.prioridad==="alta").length} tarea{tareas.filter(t=>!t.hecho&&t.prioridad==="alta").length>1?"s":""} de prioridad alta pendiente{tareas.filter(t=>!t.hecho&&t.prioridad==="alta").length>1?"s":""}
          </div>
        )}
      </Card>

      {/* Filtros */}
      <div style={{display:"flex",gap:5,marginBottom:8}}>
        {(["pendientes","todas","hechas"] as const).map(f=>(
          <button key={f} onClick={()=>setFiltro(f)}
            style={{flex:1,background:filtro===f?"#c9956a":"#fff",border:`1px solid ${filtro===f?"#c9956a":"#e8d5c4"}`,color:filtro===f?"#fff":"#a07855",padding:"7px 4px",borderRadius:9,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
            {f==="pendientes"?`⏳ Pendientes (${tareas.filter(t=>!t.hecho).length})`:f==="hechas"?`✅ Hechas (${hechas})`:"📋 Todas"}
          </button>
        ))}
      </div>

      {/* Filtro categoría */}
      <select value={cat} onChange={e=>setCat(e.target.value)}
        style={{width:"100%",background:"#fff",border:"1px solid #e8d5c4",borderRadius:9,padding:"8px 12px",fontSize:12,color:"#5c3d2e",marginBottom:10,fontFamily:"inherit",outline:"none"}}>
        <option value="Todas">Todas las categorías</option>
        {CATS_CHECK.map(c=><option key={c} value={c}>{c}</option>)}
      </select>

      {/* Botón agregar */}
      <Btn onClick={()=>{setEdit(null);setNueva({titulo:"",categoria:"Otro",prioridad:"media",fecha:"",notas:""});setForm(true);}} style={{width:"100%",marginBottom:12}}>
        + Agregar tarea
      </Btn>

      {/* Formulario */}
      {form&&(
        <Card style={{marginBottom:12,border:"1px solid #e8d5c4"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#5c3d2e",marginBottom:12}}>{edit?"Editar tarea":"Nueva tarea"}</div>
          <div style={{display:"flex",flexDirection:"column",gap:9}}>
            <div>
              <div style={{fontSize:10,color:"#a07855",fontWeight:600,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>Tarea *</div>
              <input value={nueva.titulo||""} onChange={e=>setNueva({...nueva,titulo:e.target.value})} placeholder="Ej: Comprar los anillos"
                style={{width:"100%",background:"#fdf8f3",border:"1.5px solid #e8d5c4",borderRadius:9,padding:"9px 12px",fontSize:13,color:"#5c3d2e",fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
            </div>
            <div>
              <div style={{fontSize:10,color:"#a07855",fontWeight:600,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>Categoría</div>
              <select value={nueva.categoria||"Otro"} onChange={e=>setNueva({...nueva,categoria:e.target.value})}
                style={{width:"100%",background:"#fdf8f3",border:"1.5px solid #e8d5c4",borderRadius:9,padding:"9px 12px",fontSize:13,color:"#5c3d2e",fontFamily:"inherit",outline:"none"}}>
                {CATS_CHECK.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:10,color:"#a07855",fontWeight:600,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>Prioridad</div>
              <div style={{display:"flex",gap:6}}>
                {(["alta","media","baja"] as const).map(p=>(
                  <button key={p} onClick={()=>setNueva({...nueva,prioridad:p})}
                    style={{flex:1,background:nueva.prioridad===p?PRIO_COLOR[p]+"20":"#fff",border:`1.5px solid ${nueva.prioridad===p?PRIO_COLOR[p]:"#e8d5c4"}`,color:nueva.prioridad===p?PRIO_COLOR[p]:"#a07855",padding:"8px 4px",borderRadius:9,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                    {PRIO_LABEL[p]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{fontSize:10,color:"#a07855",fontWeight:600,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>Fecha límite (opcional)</div>
              <input type="date" value={nueva.fecha||""} onChange={e=>setNueva({...nueva,fecha:e.target.value})}
                style={{width:"100%",background:"#fdf8f3",border:"1.5px solid #e8d5c4",borderRadius:9,padding:"9px 12px",fontSize:13,color:"#5c3d2e",fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
            </div>
            <div>
              <div style={{fontSize:10,color:"#a07855",fontWeight:600,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>Notas</div>
              <textarea value={nueva.notas||""} onChange={e=>setNueva({...nueva,notas:e.target.value})} placeholder="Opcional..." rows={2}
                style={{width:"100%",background:"#fdf8f3",border:"1.5px solid #e8d5c4",borderRadius:9,padding:"9px 12px",fontSize:12,color:"#5c3d2e",fontFamily:"inherit",outline:"none",resize:"none",boxSizing:"border-box"}}/>
            </div>
            <div style={{display:"flex",gap:8}}>
              <Btn onClick={handleGuardar} style={{flex:2}}>💾 Guardar</Btn>
              <Btn outline onClick={()=>{setForm(false);setEdit(null);}} style={{flex:1}}>Cancelar</Btn>
            </div>
          </div>
        </Card>
      )}

      {/* Lista */}
      {filtradas.length===0&&<div style={{textAlign:"center",padding:24,color:"#c4a882",fontSize:13}}>
        {tareas.length===0?"Aún no hay tareas. ¡Agrega la primera! 💍":"Sin tareas para este filtro"}
      </div>}

      {filtradas.map(t=>(
        <div key={t.id} style={{background:"#fff",border:`1px solid ${t.hecho?"#e8d5c4":"#f0e0d0"}`,borderRadius:13,padding:14,marginBottom:8,opacity:t.hecho?0.7:1,borderLeft:`3px solid ${t.hecho?"#c4a882":PRIO_COLOR[t.prioridad]}`}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
            <button onClick={()=>toggleHecho(t.id)}
              style={{width:24,height:24,borderRadius:"50%",border:`2px solid ${t.hecho?"#c9956a":"#e8d5c4"}`,background:t.hecho?"#c9956a":"transparent",flexShrink:0,cursor:"pointer",marginTop:1,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff"}}>
              {t.hecho?"✓":""}
            </button>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700,color:t.hecho?"#c4a882":"#5c3d2e",textDecoration:t.hecho?"line-through":"none"}}>{t.titulo}</div>
              <div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap",alignItems:"center"}}>
                <span style={{fontSize:9,background:"#fdf0e8",color:"#c9956a",padding:"2px 7px",borderRadius:10,fontWeight:700}}>{t.categoria}</span>
                <span style={{fontSize:9,background:PRIO_COLOR[t.prioridad]+"15",color:PRIO_COLOR[t.prioridad],padding:"2px 7px",borderRadius:10,fontWeight:700}}>{PRIO_LABEL[t.prioridad]}</span>
                {t.fecha&&<span style={{fontSize:9,color:"#a07855"}}>📅 {new Date(t.fecha+"T12:00:00").toLocaleDateString("es-CL",{day:"numeric",month:"short",year:"numeric"})}</span>}
              </div>
              {t.notas&&<div style={{fontSize:11,color:"#a07855",marginTop:5}}>{t.notas}</div>}
            </div>
            <div style={{display:"flex",gap:5,flexShrink:0}}>
              <button onClick={()=>abrirEditar(t)} style={{background:"#fdf0e8",border:"none",borderRadius:7,padding:"5px 8px",fontSize:12,cursor:"pointer"}}>✏️</button>
              <button onClick={()=>eliminar(t.id)} style={{background:"#fef2f2",border:"none",borderRadius:7,padding:"5px 8px",fontSize:12,cursor:"pointer"}}>🗑️</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
