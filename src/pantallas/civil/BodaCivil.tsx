import React, { useState, useEffect, useRef, useCallback } from "react";
import { onSnapshot } from "firebase/firestore";
import { guardarFusionando } from "../../base/guardar";
import { uploadBytes, getDownloadURL } from "firebase/storage";
import { fmt } from "../../base/config";
import { dref, infoBoda, sref } from "../../base/firebase";
import { InvitacionCivil } from "./InvitacionCivil";
import { LunaCivil } from "./LunaCivil";
import { CATS_CIVIL, CAT_ICON_CIVIL, CivilData, CivilGasto, CivilInvitado, PLAZOS_CIVIL, SUG_CRONO_CIVIL, SUG_DECO_CIVIL, SUG_GASTOS_CIVIL, SUG_TAREAS_CIVIL, SUG_TIPS_CIVIL, UNIDS_CIVIL, comprimirImg, totalGasto } from "./datosCivil";
import { Btn, Card, Inp, Sel, Title } from "../../ui/base";
import { Icono } from "../../ui/iconos";

export function useCivil() {
  const [data, setLocalEstado] = useState<CivilData>({ invitados:[], gastos:[] });
  const actual = useRef<CivilData>({ invitados:[], gastos:[] });   // base del cambio (ver base/fusionar.js)
  const setLocal = useCallback((d:CivilData) => { actual.current = d; setLocalEstado(d); }, []);
  useEffect(()=>{
    const unsub = onSnapshot(dref("civil"), snap=>{
      if (snap.exists()) setLocal(snap.data() as CivilData);
      else setLocal({ invitados:[], gastos:[] });
    });
    return unsub;
  },[setLocal]);
  const guardar = async (d:CivilData) => { const antes = actual.current; setLocal(d); await guardarFusionando(dref("civil"), antes, d); };
  return { data, guardar };
}

export function BodaCivil() {
  const { data, guardar } = useCivil();
  const invitados = data.invitados || [];
  const gastos    = data.gastos    || [];

  // Las bodas nuevas (My Wedding) ven acá solo sus invitados y la invitación: el resto de este
  // planificador (presupuesto, checklist, programa y la luna de miel en Florianópolis) es de la boda original.
  const legado = !!infoBoda().legado;
  const [subTab, setSubTab] = useState<"presupuesto"|"checklist"|"programa"|"invitados"|"luna"|"invitacion">(legado ? "presupuesto" : "invitacion");

  // ── Invitados ────────────────────────────────────────────────
  const [showFInv, setShowFInv] = useState(false);
  const [editInvId, setEditInvId] = useState<number|null>(null);
  const [fInv, setFInv]           = useState({ nombre:"", notas:"" });
  const confirmados = invitados.filter(i=>i.confirmado).length;

  const abrirNuevoInv = () => { setEditInvId(null); setFInv({ nombre:"", notas:"" }); setShowFInv(true); };
  const abrirEditInv  = (inv: CivilInvitado) => { setEditInvId(inv.id); setFInv({ nombre:inv.nombre, notas:inv.notas||"" }); setShowFInv(true); };
  const cerrarFInv    = () => { setShowFInv(false); setEditInvId(null); setFInv({ nombre:"", notas:"" }); };

  const guardarInv = () => {
    if (!fInv.nombre.trim()) return;
    if (editInvId !== null) {
      guardar({ ...data, invitados:invitados.map(i=>i.id===editInvId?{...i,nombre:fInv.nombre.trim(),notas:fInv.notas}:i) });
    } else {
      guardar({ ...data, invitados:[...invitados,{ id:Date.now(), nombre:fInv.nombre.trim(), confirmado:false, notas:fInv.notas }] });
    }
    cerrarFInv();
  };
  const toggleInv = (id:number) =>
    guardar({ ...data, invitados:invitados.map(i=>i.id===id?{...i,confirmado:!i.confirmado}:i) });
  const delInv = (id:number) =>
    guardar({ ...data, invitados:invitados.filter(i=>i.id!==id) });

  // ── Gastos ───────────────────────────────────────────────────
  const [showFG,   setShowFG]   = useState(false);
  const [editGId,  setEditGId]  = useState<number|null>(null);
  const [fG, setFG] = useState({ categoria:"Carnes", descripcion:"", cantidad:"", unidad:"kg", precioPorUnidad:"", notas:"", monto:"" });
  // "simple" = un monto total (lo habitual). "detalle" = cantidad × precio por unidad.
  const [modoG, setModoG] = useState<"simple"|"detalle">("simple");

  const totalGeneral = gastos.reduce((s,g)=>s+totalGasto(g),0);
  const totalLugar   = gastos.filter(g=>g.categoria==="Lugar").reduce((s,g)=>s+totalGasto(g),0);
  const totalComida  = gastos.filter(g=>["Carnes","Acompañamientos","Pan","Bebidas","Alcohol","Picoteo","Torta"].includes(g.categoria)).reduce((s,g)=>s+totalGasto(g),0);
  const totalServ    = gastos.filter(g=>g.categoria==="Servicios").reduce((s,g)=>s+totalGasto(g),0);
  const totalListo   = gastos.filter(g=>g.listo).reduce((s,g)=>s+totalGasto(g),0);   // lo ya comprado
  // ── Listas de la organización (decoración, cronograma, tips y checklist) ──
  const deco   = data.deco   || [];
  const crono  = data.cronograma || [];
  const tips   = data.tips   || [];
  const tareas = data.tareas || [];
  const hechas = tareas.filter(t=>t.listo).length;
  const togglear = (campo:"deco"|"tips", id:number) =>
    guardar({ ...data, [campo]: (data[campo]||[]).map(x=>x.id===id?{...x,listo:!x.listo}:x) });
  const editarTexto = (campo:"deco"|"tips", id:number, texto:string) =>
    guardar({ ...data, [campo]: (data[campo]||[]).map(x=>x.id===id?{...x,texto}:x) });
  const borrarDe = (campo:"deco"|"tips"|"tareas"|"cronograma", id:number) =>
    guardar({ ...data, [campo]: ((data[campo] as any[]) || []).filter((x:any)=>x.id!==id) });
  const agregarA = (campo:"deco"|"tips", texto="") =>
    guardar({ ...data, [campo]: [...(data[campo]||[]), { id:Date.now(), texto, listo:false }] });
  // Carga la sugerencia SOLO en las secciones que estén vacías (nunca pisa lo cargado)
  // ── Fotos en el checklist (tareas y decoración) ──
  const [subiendoFoto, setSubiendoFoto] = useState<number|null>(null);   // id del item que está subiendo
  const [zoomFoto, setZoomFoto]         = useState<string|null>(null);   // foto abierta a pantalla completa
  const fotoDestino = useRef<{campo:"tareas"|"deco"|"tips"; id:number}|null>(null);
  const fotoInputRef = useRef<HTMLInputElement|null>(null);

  const pedirFoto = (campo:"tareas"|"deco"|"tips", id:number) => {
    fotoDestino.current = { campo, id };
    fotoInputRef.current?.click();
  };
  const onFotoElegida = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []); e.target.value = "";
    const dest = fotoDestino.current; fotoDestino.current = null;
    if (!files.length || !dest) return;
    setSubiendoFoto(dest.id);
    try {
      const urls: string[] = [];
      for (const f of files) {
        const blob = await comprimirImg(f);
        const r = sref(`boda-civil/${dest.campo}_${dest.id}_${Date.now()}_${urls.length}.jpg`);
        await uploadBytes(r, blob, { contentType:"image/jpeg" });
        urls.push(await getDownloadURL(r));
      }
      const lista = ((data[dest.campo] as any[]) || []).map((x:any) =>
        x.id === dest.id ? { ...x, fotos:[...(x.fotos||[]), ...urls] } : x);
      await guardar({ ...data, [dest.campo]: lista });
    } catch (err:any) { alert("No se pudo subir la foto: " + (err?.message || "error")); }
    finally { setSubiendoFoto(null); }
  };
  const quitarFoto = (campo:"tareas"|"deco"|"tips", id:number, url:string) => {
    // Se saca de la lista; el archivo queda en Storage (no se borra por si está en otro item)
    const lista = ((data[campo] as any[]) || []).map((x:any) =>
      x.id === id ? { ...x, fotos:(x.fotos||[]).filter((u:string)=>u!==url) } : x);
    guardar({ ...data, [campo]: lista });
  };
  // Botón chico de cámara, dentro de la fila. Va siempre, pero discreto: si el item ya
  // tiene fotos muestra la cantidad. Antes el recuadro punteado de "agregar" aparecía en
  // TODAS las filas y ensuciaba el checklist, porque la mayoría no lleva foto.
  const botonFoto = (campo:"tareas"|"deco"|"tips", item:{id:number; fotos?:string[]}) => {
    const n = (item.fotos||[]).length;
    return (
      <button onClick={()=>pedirFoto(campo,item.id)} disabled={subiendoFoto===item.id} title="Agregar foto"
        style={{ background:n?"#fdf0e8":"transparent", border:"none", borderRadius:7, cursor:"pointer",
                 color:n?"#c9956a":"#dcc9b6", fontSize:13, fontFamily:"inherit", padding:"3px 6px",
                 display:"flex", alignItems:"center", gap:3, flexShrink:0 }}>
        {subiendoFoto===item.id ? <span style={{ fontSize:9 }}>…</span> : <>📷{n>0 && <span style={{ fontSize:9.5, fontWeight:800 }}>{n}</span>}</>}
      </button>
    );
  };
  // Miniaturas: SOLO si el item tiene fotos.
  const tiraFotos = (campo:"tareas"|"deco"|"tips", item:{id:number; fotos?:string[]}) => {
    const fs = item.fotos || [];
    if (!fs.length) return null;
    return (
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" as const, marginTop:7, paddingLeft:35 }}>
        {fs.map(u=>(
          <div key={u} style={{ position:"relative" as const }}>
            <img src={u} alt="" onClick={()=>setZoomFoto(u)} loading="lazy"
              style={{ width:68, height:68, objectFit:"cover" as const, borderRadius:9, border:"1.5px solid #e8d5c4", cursor:"pointer", display:"block" }}/>
            <button onClick={()=>quitarFoto(campo,item.id,u)}
              style={{ position:"absolute" as const, top:-6, right:-6, width:21, height:21, borderRadius:"50%", background:"#e07070", border:"2px solid #fff", color:"#fff", fontSize:10, fontWeight:900, cursor:"pointer", lineHeight:1, fontFamily:"inherit", padding:0 }}>✕</button>
          </div>
        ))}
      </div>
    );
  };

  const cargarSugerencia = () => {
    const base = Date.now();
    guardar({
      ...data,
      gastos:     gastos.length ? gastos : SUG_GASTOS_CIVIL.map((g,i)=>({ id:base+i, categoria:g.categoria, descripcion:g.descripcion, cantidad:0, unidad:"unid", precioPorUnidad:0, monto:g.monto, notas:g.notas||"", listo:false })),
      deco:       deco.length   ? deco   : SUG_DECO_CIVIL.map((t,i)=>({ id:base+100+i, texto:t, listo:false })),
      cronograma: crono.length  ? crono  : SUG_CRONO_CIVIL.map((c,i)=>({ id:base+200+i, hora:c[0], actividad:c[1] })),
      tips:       tips.length   ? tips   : SUG_TIPS_CIVIL.map((t,i)=>({ id:base+300+i, texto:t, listo:false })),
      tareas:     tareas.length ? tareas : SUG_TAREAS_CIVIL.map((t,i)=>({ id:base+400+i, cuando:t[0], texto:t[1], listo:false })),
    });
  };

  const abrirNuevoG = () => { setEditGId(null); setFG({ categoria:"Carnes", descripcion:"", cantidad:"", unidad:"kg", precioPorUnidad:"", notas:"", monto:"" }); setModoG("simple"); setShowFG(true); };
  const abrirEditG  = (g: CivilGasto) => { setEditGId(g.id); const simple = (g.monto!=null && g.monto>0); setModoG(simple?"simple":"detalle"); setFG({ categoria:g.categoria, descripcion:g.descripcion, cantidad:g.cantidad?String(g.cantidad):"", unidad:g.unidad||"kg", precioPorUnidad:g.precioPorUnidad?String(g.precioPorUnidad):"", notas:g.notas||"", monto:simple?String(g.monto):"" }); setShowFG(true); };
  const cerrarFG    = () => { setShowFG(false); setEditGId(null); };

  const guardarGasto = () => {
    if (!fG.descripcion.trim()) return;
    if (modoG==="simple" ? !fG.monto : (!fG.cantidad || !fG.precioPorUnidad)) return;
    const item = modoG==="simple"
      ? { categoria:fG.categoria, descripcion:fG.descripcion.trim(), cantidad:0, unidad:fG.unidad, precioPorUnidad:0, monto:Number(fG.monto), notas:fG.notas }
      : { categoria:fG.categoria, descripcion:fG.descripcion.trim(), cantidad:Number(fG.cantidad), unidad:fG.unidad, precioPorUnidad:Number(fG.precioPorUnidad), monto:0, notas:fG.notas };
    if (editGId !== null) {
      guardar({ ...data, gastos:gastos.map(g=>g.id===editGId?{...g,...item}:g) });
    } else {
      guardar({ ...data, gastos:[...gastos,{ id:Date.now(), ...item }] });
    }
    cerrarFG();
  };
  const delGasto = (id:number) => guardar({ ...data, gastos:gastos.filter(g=>g.id!==id) });

  // ── Sugerencia local de arriendo ─────────────────────────────
  const precioArriendo = 8000;
  const sugerenciaLugar = (confirmados || invitados.length || 37) * precioArriendo;

  const SUB = (id:"presupuesto"|"checklist"|"programa"|"invitados"|"luna"|"invitacion", label:string, icon:string) => (
    <button onClick={()=>setSubTab(id)} style={{ flex:1, background:subTab===id?"#c9956a":"#fdf8f3", border:`1.5px solid ${subTab===id?"#c9956a":"#e8d5c4"}`, color:subTab===id?"#fff":"#a07855", borderRadius:9, padding:"8px 4px", fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", flexDirection:"column" as const, alignItems:"center", gap:2 }}>
      <span style={{ fontSize:15 }}>{icon}</span>{label}
    </button>
  );

  return (
    <div style={{ animation:"fadeUp .3s ease" }}>
      <Title icon="💒" title={legado ? "Boda Civil" : "Invitaciones"}/>
      <input ref={fotoInputRef} type="file" accept="image/*" multiple onChange={onFotoElegida} style={{ display:"none" }}/>
      {zoomFoto && (
        <div onClick={()=>setZoomFoto(null)}
          style={{ position:"fixed" as const, inset:0, background:"rgba(0,0,0,.9)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <img src={zoomFoto} alt="" style={{ maxWidth:"100%", maxHeight:"100%", borderRadius:10 }}/>
          <button onClick={()=>setZoomFoto(null)}
            style={{ position:"absolute" as const, top:16, right:16, width:38, height:38, borderRadius:"50%", background:"rgba(0,0,0,.55)", border:"none", color:"#fff", fontSize:18, cursor:"pointer", fontFamily:"inherit" }}>✕</button>
        </div>
      )}

      {/* Sub-tabs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:5, marginBottom:16 }}>
        {legado && SUB("presupuesto","Presupuesto","💰")}
        {legado && SUB("checklist","Checklist","✅")}
        {legado && SUB("programa","Programa","🕐")}
        {SUB("invitados","Invitados","👥")}
        {SUB("invitacion","Invitación","💌")}
        {legado && SUB("luna","Luna de miel","🌴")}
      </div>

      {/* ══ PRESUPUESTO ══ */}
      {(gastos.length===0 && deco.length===0 && tareas.length===0 && subTab!=="luna" && subTab!=="invitacion") && (
        <Card style={{ background:"#fff8f0", marginBottom:14, border:"1px dashed #e8c8a0" }}>
          <div style={{ fontSize:12, fontWeight:800, color:"#c9956a", marginBottom:4 }}>✨ Empezar con una base</div>
          <div style={{ fontSize:11, color:"#a07855", lineHeight:1.5, marginBottom:10 }}>
            Carga un presupuesto estimado para 40 personas, ideas de decoración, el programa del día,
            tips para ahorrar y el checklist por plazos. <strong>Después editas todo</strong>: textos, montos y cantidades.
          </div>
          <button onClick={cargarSugerencia} style={{ background:"#c9956a", color:"#fff", border:"none", borderRadius:9, padding:"11px 16px", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"inherit", width:"100%" }}>
            Cargar sugerencia
          </button>
        </Card>
      )}

      {subTab==="presupuesto" && (
        <div>
          {/* Resumen */}
          <Card style={{ background:"linear-gradient(135deg,#fdf0e8,#fae0cc)", marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#8c4820", marginBottom:8, letterSpacing:"0.06em" }}>RESUMEN BODA CIVIL</div>
            <div style={{ fontSize:26, fontWeight:900, color:"#c9956a", marginBottom:8 }}>{fmt(totalGeneral)}</div>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" as const }}>
              <div style={{ fontSize:10, color:"#a07855" }}>🏡 Lugar: <strong>{fmt(totalLugar)}</strong></div>
              <div style={{ fontSize:10, color:"#a07855" }}>🍽️ Comida: <strong>{fmt(totalComida)}</strong></div>
              <div style={{ fontSize:10, color:"#a07855" }}>👨‍🍳 Servicios: <strong>{fmt(totalServ)}</strong></div>
            </div>
            {/* Avance de compras: lo tildado sobre el total */}
            {gastos.length>0 && (
              <div style={{ marginTop:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"#8c4820", fontWeight:700, marginBottom:4 }}>
                  <span>✓ Ya comprado: {fmt(totalListo)}</span>
                  <span>Falta: {fmt(Math.max(0,totalGeneral-totalListo))}</span>
                </div>
                <div style={{ height:8, background:"#fff", borderRadius:5, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${totalGeneral?Math.round(totalListo/totalGeneral*100):0}%`, background:"#7aa87a", borderRadius:5, transition:"width .3s ease" }}/>
                </div>
              </div>
            )}
            <div style={{ fontSize:10, color:"#c4a882", marginTop:8 }}>
              {invitados.length} invitados · {confirmados} confirmados
            </div>
          </Card>

          {/* Sugerencia de arriendo si no hay item Lugar */}
          {!gastos.some(g=>g.categoria==="Lugar") && invitados.length === 0 && (
            <Card style={{ background:"#fff8f0", marginBottom:12, border:"1px dashed #e8c8a0" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#c9956a", marginBottom:4 }}>💡 Sugerencia — Arriendo del lugar</div>
              <div style={{ fontSize:11, color:"#a07855" }}>
                Con ~37 invitados × $8.000/pers. = <strong>{fmt(37*8000)}</strong><br/>
                Agrega el ítem y ajusta según el número real de asistentes.
              </div>
            </Card>
          )}
          {!gastos.some(g=>g.categoria==="Lugar") && invitados.length > 0 && (
            <Card style={{ background:"#fff8f0", marginBottom:12, border:"1px dashed #e8c8a0" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#c9956a", marginBottom:4 }}>💡 Arriendo estimado del lugar</div>
              <div style={{ fontSize:11, color:"#a07855", marginBottom:8 }}>
                {invitados.length} invitados × $8.000/pers. = <strong>{fmt(sugerenciaLugar)}</strong>
              </div>
              <button onClick={()=>{ guardar({ ...data, gastos:[...gastos,{ id:Date.now(), categoria:"Lugar", descripcion:"Arriendo del lugar", cantidad:invitados.length||37, unidad:"persona", precioPorUnidad:8000, notas:"$8.000 por persona" }]}); }} style={{ background:"#c9956a", color:"#fff", border:"none", borderRadius:8, padding:"8px 14px", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                + Agregar arriendo
              </button>
            </Card>
          )}

          {/* Formulario */}
          {showFG && (
            <Card style={{ marginBottom:14, border:`2px solid ${editGId?"#5070a0":"#e8d5c4"}` }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#5c3d2e", marginBottom:12 }}>
                {editGId ? "✏️ Editar ítem" : "Nuevo ítem"}
              </div>
              <div style={{ display:"flex", flexDirection:"column" as const, gap:9 }}>
                <Sel value={fG.categoria} onChange={v=>setFG({...fG,categoria:v})} options={CATS_CIVIL.map(c=>({value:c,label:`${CAT_ICON_CIVIL[c]} ${c}`}))}/>
                <Inp value={fG.descripcion} onChange={v=>setFG({...fG,descripcion:v})} placeholder="Descripción (ej: Lomo vetado, Arroz, Gaseosas)"/>
                {/* La mayoría de los ítems son un monto y punto ("Decoración $50.000").
                    El cálculo por cantidad queda para lo que sí se compra por kg o por persona. */}
                <div style={{ display:"flex", gap:5, background:"#fdf8f3", border:"1.5px solid #e8d5c4", borderRadius:9, padding:4 }}>
                  {([["simple","Monto total"],["detalle","Por cantidad"]] as const).map(([m,l])=>(
                    <button key={m} onClick={()=>setModoG(m)} style={{ flex:1, background:modoG===m?"#c9956a":"transparent", color:modoG===m?"#fff":"#a07855", border:"none", borderRadius:7, padding:"8px 4px", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{l}</button>
                  ))}
                </div>
                {modoG==="simple" ? (
                  <Inp value={fG.monto} onChange={v=>setFG({...fG,monto:v})} placeholder="Monto ($)" type="number"/>
                ) : (<>
                  <div style={{ display:"flex", gap:8 }}>
                    <div style={{ flex:1 }}>
                      <Inp value={fG.cantidad} onChange={v=>setFG({...fG,cantidad:v})} placeholder="Cantidad" type="number"/>
                    </div>
                    <div style={{ flex:1 }}>
                      <Sel value={fG.unidad} onChange={v=>setFG({...fG,unidad:v})} options={UNIDS_CIVIL.map(u=>({value:u,label:u}))}/>
                    </div>
                  </div>
                  <Inp value={fG.precioPorUnidad} onChange={v=>setFG({...fG,precioPorUnidad:v})} placeholder={`Precio por ${fG.unidad} ($)`} type="number"/>
                  {fG.cantidad && fG.precioPorUnidad && (
                    <div style={{ background:"#fdf0e8", borderRadius:8, padding:"8px 12px", fontSize:12, fontWeight:700, color:"#c9956a" }}>
                      Total: {fmt(Number(fG.cantidad)*Number(fG.precioPorUnidad))}
                    </div>
                  )}
                </>)}
                <Inp value={fG.notas} onChange={v=>setFG({...fG,notas:v})} placeholder="Notas (opcional)"/>
              </div>
              <div style={{ display:"flex", gap:8, marginTop:12 }}>
                <Btn onClick={guardarGasto}>{editGId ? "Guardar cambios" : "Agregar"}</Btn>
                <Btn onClick={cerrarFG} outline>Cancelar</Btn>
              </div>
            </Card>
          )}
          {!showFG && <Btn onClick={abrirNuevoG} style={{ marginBottom:16 }}>+ Agregar ítem</Btn>}

          {/* Lista por categoría */}
          {gastos.length === 0 && (
            <div style={{ textAlign:"center" as const, color:"#c4a882", padding:32, fontSize:12 }}>
              Aún no hay ítems.<br/>Agrega el arriendo, comida y servicios.
            </div>
          )}
          {CATS_CIVIL.map(cat=>{
            const items = gastos.filter(g=>g.categoria===cat);
            if (!items.length) return null;
            const subtotal = items.reduce((s,g)=>s+totalGasto(g),0);
            return (
              <div key={cat} style={{ marginBottom:20 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#7090c0", letterSpacing:"0.07em", textTransform:"uppercase" as const }}>
                    {CAT_ICON_CIVIL[cat]} {cat}
                  </div>
                  <div style={{ fontSize:12, fontWeight:700, color:"#c9956a" }}>{fmt(subtotal)}</div>
                </div>
                {items.map(g=>{
                  const total = totalGasto(g);
                  const porCantidad = !(g.monto != null && g.monto > 0) && g.cantidad > 0;
                  return (
                    <Card key={g.id} style={{ padding:12, marginBottom:8, opacity:g.listo?0.62:1 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                        {/* Tilde para ir marcando lo que YA está comprado */}
                        <button onClick={()=>guardar({ ...data, gastos:gastos.map(x=>x.id===g.id?{...x,listo:!x.listo}:x) })}
                          style={{ width:26, height:26, flexShrink:0, marginTop:1, borderRadius:8, cursor:"pointer", background:g.listo?"#7aa87a":"#fff", border:`2px solid ${g.listo?"#7aa87a":"#e8d5c4"}`, color:"#fff", fontSize:14, fontWeight:900, lineHeight:1, fontFamily:"inherit" }}>{g.listo?"✓":""}</button>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:700, color:"#5c3d2e", textDecoration:g.listo?"line-through":"none" }}>{g.descripcion}</div>
                          {porCantidad && (
                            <div style={{ fontSize:11, color:"#a07855", marginTop:2 }}>
                              {g.cantidad} {g.unidad} × {fmt(g.precioPorUnidad)}/{g.unidad}
                            </div>
                          )}
                          {g.notas && <div style={{ fontSize:10, color:"#c4a882", marginTop:2 }}>{g.notas}</div>}
                        </div>
                        <div style={{ textAlign:"right" as const, flexShrink:0 }}>
                          <div style={{ fontSize:15, fontWeight:700, color:"#4070b0", marginBottom:4 }}>{fmt(total)}</div>
                          <div style={{ display:"flex", gap:4, justifyContent:"flex-end" }}>
                            <button onClick={()=>abrirEditG(g)} style={{ background:"none", border:"1px solid #d0c0b0", borderRadius:6, padding:"3px 7px", fontSize:11, color:"#a07855", cursor:"pointer" }}><Icono n="lapiz" tam={16} style={{ color:"#a87447" }}/></button>
                            <button onClick={()=>delGasto(g.id)} style={{ background:"none", border:"none", color:"#e07070", cursor:"pointer", fontSize:14 }}><Icono n="basura" tam={16} style={{ color:"#d48a8a" }}/></button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* ══ INVITADOS ══ */}
      {/* ── CHECKLIST: tareas por plazo + decoración + tips, todo tildeable ── */}
      {subTab==="checklist" && (
        <div>
          <Card style={{ background:"linear-gradient(135deg,#fdf0e8,#fae0cc)", marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#8c4820", letterSpacing:"0.06em", marginBottom:6 }}>ORGANIZACIÓN</div>
            <div style={{ fontSize:26, fontWeight:900, color:"#c9956a" }}>{hechas}<span style={{ fontSize:15, color:"#a07855" }}> / {tareas.length}</span></div>
            <div style={{ height:8, background:"#fff", borderRadius:5, overflow:"hidden", marginTop:8 }}>
              <div style={{ height:"100%", width:`${tareas.length?Math.round(hechas/tareas.length*100):0}%`, background:"#c9956a", borderRadius:5, transition:"width .3s ease" }}/>
            </div>
            <div style={{ fontSize:10, color:"#a07855", marginTop:6 }}>Tocá cada tarea para marcarla lista</div>
          </Card>

          {PLAZOS_CIVIL.filter(pl=>tareas.some(t=>t.cuando===pl)).map(pl=>{
            const ts = tareas.filter(t=>t.cuando===pl);
            return (
              <Card key={pl} style={{ marginBottom:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <div style={{ fontSize:12, fontWeight:800, color:"#8c4820", flex:1 }}>{pl}</div>
                  <div style={{ fontSize:10, color:"#c4a882" }}>{ts.filter(t=>t.listo).length}/{ts.length}</div>
                </div>
                {ts.map(t=>(
                  <div key={t.id} style={{ padding:"9px 0", borderTop:"1px solid #f4e6d8" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                    <button onClick={()=>guardar({ ...data, tareas:tareas.map(x=>x.id===t.id?{...x,listo:!x.listo}:x) })}
                      style={{ width:26, height:26, flexShrink:0, borderRadius:8, cursor:"pointer", background:t.listo?"#c9956a":"#fff", border:`2px solid ${t.listo?"#c9956a":"#e8d5c4"}`, color:"#fff", fontSize:14, fontWeight:900, lineHeight:1, fontFamily:"inherit" }}>{t.listo?"✓":""}</button>
                    <input value={t.texto} onChange={e=>guardar({ ...data, tareas:tareas.map(x=>x.id===t.id?{...x,texto:e.target.value}:x) })}
                      style={{ flex:1, minWidth:0, border:"none", background:"transparent", fontSize:12.5, color:t.listo?"#c4a882":"#6b4423", textDecoration:t.listo?"line-through":"none", fontFamily:"inherit", outline:"none", padding:0 }}/>
                    {botonFoto("tareas", t)}
                    <button onClick={()=>borrarDe("tareas",t.id)} style={{ background:"none", border:"none", color:"#e0c0a0", fontSize:15, cursor:"pointer", padding:"0 2px", fontFamily:"inherit" }}>✕</button>
                  </div>
                  {tiraFotos("tareas", t)}
                  </div>
                ))}
                <button onClick={()=>guardar({ ...data, tareas:[...tareas,{ id:Date.now(), cuando:pl, texto:"", listo:false }] })}
                  style={{ marginTop:8, background:"#fdf8f3", border:"1.5px dashed #e8d5c4", color:"#a07855", borderRadius:8, padding:"8px", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", width:"100%" }}>+ Agregar tarea</button>
              </Card>
            );
          })}
          {tareas.length===0 && (
            <Card style={{ marginBottom:12, textAlign:"center" as const }}>
              <div style={{ fontSize:11, color:"#a07855", marginBottom:10 }}>Todavía no hay tareas cargadas.</div>
              <button onClick={cargarSugerencia} style={{ background:"#c9956a", color:"#fff", border:"none", borderRadius:9, padding:"10px 16px", fontSize:11.5, fontWeight:800, cursor:"pointer", fontFamily:"inherit" }}>Cargar checklist sugerido</button>
            </Card>
          )}

          {/* Decoración */}
          <Card style={{ marginBottom:12 }}>
            <div style={{ fontSize:12, fontWeight:800, color:"#8c4820", marginBottom:8 }}>🎀 Decoración campestre</div>
            {deco.map(d=>(
              <div key={d.id} style={{ padding:"9px 0", borderTop:"1px solid #f4e6d8" }}>
              <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                <button onClick={()=>togglear("deco",d.id)} style={{ width:26, height:26, flexShrink:0, borderRadius:8, cursor:"pointer", background:d.listo?"#c9956a":"#fff", border:`2px solid ${d.listo?"#c9956a":"#e8d5c4"}`, color:"#fff", fontSize:14, fontWeight:900, lineHeight:1, fontFamily:"inherit" }}>{d.listo?"✓":""}</button>
                <input value={d.texto} onChange={e=>editarTexto("deco",d.id,e.target.value)}
                  style={{ flex:1, minWidth:0, border:"none", background:"transparent", fontSize:12.5, color:d.listo?"#c4a882":"#6b4423", textDecoration:d.listo?"line-through":"none", fontFamily:"inherit", outline:"none", padding:0 }}/>
                {botonFoto("deco", d)}
                <button onClick={()=>borrarDe("deco",d.id)} style={{ background:"none", border:"none", color:"#e0c0a0", fontSize:15, cursor:"pointer", padding:"0 2px", fontFamily:"inherit" }}>✕</button>
              </div>
              {tiraFotos("deco", d)}
              </div>
            ))}
            <button onClick={()=>agregarA("deco")} style={{ marginTop:8, background:"#fdf8f3", border:"1.5px dashed #e8d5c4", color:"#a07855", borderRadius:8, padding:"8px", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", width:"100%" }}>+ Agregar idea</button>
          </Card>

          {/* Tips para ahorrar */}
          <Card>
            <div style={{ fontSize:12, fontWeight:800, color:"#8c4820", marginBottom:8 }}>💡 Para ahorrar sin que se note</div>
            {tips.map(t=>(
              <div key={t.id} style={{ display:"flex", alignItems:"center", gap:9, padding:"9px 0", borderTop:"1px solid #f4e6d8" }}>
                <button onClick={()=>togglear("tips",t.id)} style={{ width:26, height:26, flexShrink:0, borderRadius:8, cursor:"pointer", background:t.listo?"#c9956a":"#fff", border:`2px solid ${t.listo?"#c9956a":"#e8d5c4"}`, color:"#fff", fontSize:14, fontWeight:900, lineHeight:1, fontFamily:"inherit" }}>{t.listo?"✓":""}</button>
                <input value={t.texto} onChange={e=>editarTexto("tips",t.id,e.target.value)}
                  style={{ flex:1, minWidth:0, border:"none", background:"transparent", fontSize:12.5, color:t.listo?"#c4a882":"#6b4423", textDecoration:t.listo?"line-through":"none", fontFamily:"inherit", outline:"none", padding:0 }}/>
                <button onClick={()=>borrarDe("tips",t.id)} style={{ background:"none", border:"none", color:"#e0c0a0", fontSize:15, cursor:"pointer", padding:"0 2px", fontFamily:"inherit" }}>✕</button>
              </div>
            ))}
            <button onClick={()=>agregarA("tips")} style={{ marginTop:8, background:"#fdf8f3", border:"1.5px dashed #e8d5c4", color:"#a07855", borderRadius:8, padding:"8px", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", width:"100%" }}>+ Agregar tip</button>
          </Card>
        </div>
      )}

      {/* ── PROGRAMA DEL DÍA: hora + actividad, editable ── */}
      {subTab==="programa" && (
        <div>
          <Card style={{ marginBottom:12 }}>
            <div style={{ fontSize:12, fontWeight:800, color:"#8c4820", marginBottom:4 }}>🕐 Cronograma del día</div>
            <div style={{ fontSize:10.5, color:"#a07855", marginBottom:10 }}>Tocá la hora o el texto para editarlos.</div>
            {[...crono].sort((a,b)=>String(a.hora).localeCompare(String(b.hora))).map(c=>(
              <div key={c.id} style={{ display:"flex", alignItems:"center", gap:9, padding:"9px 0", borderTop:"1px solid #f4e6d8" }}>
                <input value={c.hora} onChange={e=>guardar({ ...data, cronograma:crono.map(x=>x.id===c.id?{...x,hora:e.target.value}:x) })}
                  style={{ width:62, flexShrink:0, border:"1.5px solid #e8d5c4", borderRadius:7, background:"#fdf8f3", fontSize:12, fontWeight:800, color:"#c9956a", fontFamily:"inherit", outline:"none", padding:"6px 4px", textAlign:"center" as const }}/>
                <input value={c.actividad} onChange={e=>guardar({ ...data, cronograma:crono.map(x=>x.id===c.id?{...x,actividad:e.target.value}:x) })}
                  style={{ flex:1, minWidth:0, border:"none", background:"transparent", fontSize:12.5, color:"#6b4423", fontFamily:"inherit", outline:"none", padding:0 }}/>
                <button onClick={()=>borrarDe("cronograma",c.id)} style={{ background:"none", border:"none", color:"#e0c0a0", fontSize:15, cursor:"pointer", padding:"0 2px", fontFamily:"inherit" }}>✕</button>
              </div>
            ))}
            <button onClick={()=>guardar({ ...data, cronograma:[...crono,{ id:Date.now(), hora:"00:00", actividad:"" }] })}
              style={{ marginTop:8, background:"#fdf8f3", border:"1.5px dashed #e8d5c4", color:"#a07855", borderRadius:8, padding:"8px", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", width:"100%" }}>+ Agregar horario</button>
          </Card>
          {crono.length===0 && (
            <Card style={{ textAlign:"center" as const }}>
              <div style={{ fontSize:11, color:"#a07855", marginBottom:10 }}>Sin cronograma todavía.</div>
              <button onClick={cargarSugerencia} style={{ background:"#c9956a", color:"#fff", border:"none", borderRadius:9, padding:"10px 16px", fontSize:11.5, fontWeight:800, cursor:"pointer", fontFamily:"inherit" }}>Cargar programa sugerido</button>
            </Card>
          )}
        </div>
      )}


      {subTab==="invitados" && (
        <div>
          {/* Resumen */}
          <Card style={{ background:"linear-gradient(135deg,#e8f4ff,#d8e8ff)", marginBottom:14, padding:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <div><div style={{ fontSize:10, color:"#7090c0" }}>Total invitados</div><div style={{ fontSize:24, fontWeight:700, color:"#4070b0" }}>{invitados.length}</div></div>
              <div style={{ textAlign:"center" as const }}><div style={{ fontSize:10, color:"#6aaa96" }}>Confirmados</div><div style={{ fontSize:24, fontWeight:700, color:"#6aaa96" }}>{confirmados}</div></div>
              <div style={{ textAlign:"right" as const }}><div style={{ fontSize:10, color:"#c4a882" }}>Por confirmar</div><div style={{ fontSize:24, fontWeight:700, color:"#c9956a" }}>{invitados.length-confirmados}</div></div>
            </div>
          </Card>

          {/* Formulario agregar / editar */}
          {showFInv && (
            <Card style={{ marginBottom:14, border:`2px solid ${editInvId?"#5070a0":"#e8d5c4"}` }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#5c3d2e", marginBottom:10 }}>
                {editInvId ? "✏️ Editar invitado" : "Nuevo invitado"}
              </div>
              <div style={{ display:"flex", flexDirection:"column" as const, gap:8 }}>
                <Inp value={fInv.nombre} onChange={v=>setFInv({...fInv,nombre:v})} placeholder="Nombre completo"/>
                <Inp value={fInv.notas}  onChange={v=>setFInv({...fInv,notas:v})}  placeholder="Notas (relación, dieta, etc.)"/>
              </div>
              <div style={{ display:"flex", gap:8, marginTop:10 }}>
                <Btn onClick={guardarInv}>{editInvId ? "Guardar cambios" : "Agregar"}</Btn>
                <Btn onClick={cerrarFInv} outline>Cancelar</Btn>
              </div>
            </Card>
          )}
          {!showFInv && <Btn onClick={abrirNuevoInv} style={{ marginBottom:14 }}>+ Agregar invitado</Btn>}

          {/* Lista */}
          {invitados.length===0 && (
            <div style={{ textAlign:"center" as const, color:"#c4a882", padding:32, fontSize:12 }}>
              Sin invitados aún. ¡Agrega los ~37 invitados de la boda civil!
            </div>
          )}
          {invitados.map(inv=>(
            <Card key={inv.id} style={{ padding:12, marginBottom:8, background:inv.confirmado?"#f0f8f4":"#fff" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:32, height:32, borderRadius:"50%", background:inv.confirmado?"#6aaa96":"#e8d5c4", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:"#fff", flexShrink:0 }}>
                  {inv.nombre.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#5c3d2e" }}>{inv.nombre}</div>
                  {inv.notas && <div style={{ fontSize:10, color:"#a07855" }}>{inv.notas}</div>}
                </div>
                <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                  <button onClick={()=>toggleInv(inv.id)} style={{ background:inv.confirmado?"#e8f5ec":"none", border:`1px solid ${inv.confirmado?"#6aaa96":"#e8d5c4"}`, borderRadius:6, padding:"4px 8px", fontSize:10, color:inv.confirmado?"#6aaa96":"#a07855", cursor:"pointer", fontFamily:"inherit" }}>
                    {inv.confirmado?"✓ Conf.":"Confirmar"}
                  </button>
                  <button onClick={()=>abrirEditInv(inv)} style={{ background:"none", border:"1px solid #d0c0b0", borderRadius:6, padding:"4px 8px", fontSize:12, color:"#a07855", cursor:"pointer" }}><Icono n="lapiz" tam={16} style={{ color:"#a87447" }}/></button>
                  <button onClick={()=>delInv(inv.id)} style={{ background:"none", border:"none", color:"#e07070", cursor:"pointer", fontSize:14 }}><Icono n="basura" tam={16} style={{ color:"#d48a8a" }}/></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {subTab==="invitacion" && <InvitacionCivil data={data} guardar={guardar}/>}

      {subTab==="luna" && (
        <LunaCivil hechos={data.lunaHechos||[]}
          onToggle={id=>{ const h=data.lunaHechos||[]; guardar({ ...data, lunaHechos: h.includes(id) ? h.filter(x=>x!==id) : [...h,id] }); }}/>
      )}
    </div>
  );
}
