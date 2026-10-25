import React, { useState, useEffect } from "react";
import { onSnapshot, setDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { uploadBytes, getDownloadURL } from "firebase/storage";
import { bodaActual, cref, db, dref, indiceInv, infoBoda, sref } from "../../base/firebase";
import { RespuestasInv } from "./RespuestasInv";
import { CivilData } from "./datosCivil";
import { INV_ICONOS, InvConfig, InvItem, InvPersona, PALETAS, cuantos, iconoPara, idYoutube, invBase, linkDe, nuevoCodigo, origenVista } from "./invitacion";
import { comprimirImg } from "./datosCivil";
import { Card, Inp, Sel } from "../../ui/base";

const MESES_INV = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const DIAS_INV = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
/** «el sábado 20 de marzo» a partir de AAAA-MM-DD */
const fechaTexto = (f?:string) => { const m = String(f||"").match(/^(\d{4})-(\d{2})-(\d{2})/); if (!m) return ""; const d = new Date(+m[1], +m[2]-1, +m[3]); return `el ${DIAS_INV[d.getDay()]} ${+m[3]} de ${MESES_INV[d.getMonth()]}`; };

export function InvitacionCivil({ data, guardar }: { data:CivilData; guardar:(d:CivilData)=>Promise<void> }) {
  const [cfg, setCfg]       = useState<InvConfig|null>(null);   // lo guardado
  const [borr, setBorr]     = useState<InvConfig|null>(null);   // lo que se está editando
  const [personas, setPersonas] = useState<InvPersona[]>([]);
  const [aviso, setAviso]   = useState("");
  const [filtro, setFiltro] = useState<"todas"|"sin"|"si"|"no">("todas");
  const [abierto, setAbierto] = useState<"diseno"|"datos"|"programa"|"musica"|null>(null);
  const original = !!infoBoda().legado;
  const [vista, setVista]     = useState<"invitaciones"|"respuestas">("invitaciones");
  const [sumando, setSumando] = useState<string|null>(null);   // invitación a la que se le está sumando un acompañante

  useEffect(() => {
    const u1 = onSnapshot(dref("invitacion"), snap => {
      const c = { ...invBase(!!infoBoda().legado, infoBoda().nombre), ...(snap.data() as Partial<InvConfig>||{}) } as InvConfig;
      setCfg(c); setBorr(b => b ?? c);
    });
    const u2 = onSnapshot(cref("invitacion","invitados"), snap =>
      setPersonas(snap.docs.map(d=>({ codigo:d.id, ...(d.data() as any) }))));
    return () => { u1(); u2(); };
  }, []);
  const avisar = (t:string) => { setAviso(t); window.setTimeout(()=>setAviso(""), 2200); };
  // Canción como archivo propio: es lo único que el iPhone deja sonar con el toque del sello
  const [subiendoMusica, setSubiendoMusica] = useState(false);
  const subirMusica = async (f:File|undefined) => {
    if (!f || !borr) return;
    if (!/audio|mpeg|mp3|m4a|aac|wav/i.test(f.type + f.name)) { alert("Elige un archivo de audio (MP3 o M4A)."); return; }
    if (f.size > 15 * 1024 * 1024) { alert("El archivo pesa más de 15 MB. Usa uno más liviano (un MP3 normal pesa 4 a 8 MB)."); return; }
    setSubiendoMusica(true);
    try {
      const ext = (f.name.split(".").pop() || "mp3").toLowerCase();
      const r = sref(`boda-civil/musica_${Date.now()}.${ext}`);
      // Cache largo: los 40 invitados la bajan una sola vez cada uno (ver costo de Storage)
      const tipo = ext === "m4a" || ext === "aac" ? "audio/mp4" : ext === "mp3" ? "audio/mpeg" : (f.type || "audio/mpeg");   // Safari reconoce mejor audio/mp4
      await uploadBytes(r, f, { contentType: tipo, cacheControl: "public, max-age=31536000, immutable" });
      const url = await getDownloadURL(r);
      setBorr({ ...borr, musicaArchivo:url, musicaNombre:f.name });
      avisar("✓ Canción subida: falta tocar «Guardar cambios»");
    } catch (e:any) { alert("No se pudo subir la canción: " + (e?.message || "error")); }
    finally { setSubiendoMusica(false); }
  };

  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const subirFoto = async (f:File|undefined) => {
    if (!f || !borr) return;
    setSubiendoFoto(true);
    try {
      const r = sref(`boda-civil/invitacion_foto_${Date.now()}.jpg`);   // en la boda original, su carpeta de siempre (las reglas la permiten)
      await uploadBytes(r, await comprimirImg(f), { contentType:"image/jpeg", cacheControl:"public, max-age=31536000, immutable" });
      setBorr({ ...borr, foto: await getDownloadURL(r) }); avisar("✓ Foto lista: falta tocar «Guardar cambios»");
    } catch (e:any) { alert("No se pudo subir la foto: " + (e?.message || "error")); }
    finally { setSubiendoFoto(false); }
  };
  if (!cfg || !borr) return <div style={{ textAlign:"center" as const, color:"#c4a882", padding:30, fontSize:12 }}>Cargando…</div>;

  const cambios = JSON.stringify(cfg) !== JSON.stringify(borr);
  const guardarCfg = async () => {
    const programa = [...borr.programa].filter(p=>p.actividad.trim()).sort((a,b)=>a.hora.localeCompare(b.hora));
    await setDoc(dref("invitacion"), { ...borr, programa });
    setBorr({ ...borr, programa }); avisar("✓ Invitación actualizada: los links ya muestran estos datos");
  };
  const setP = (i:number, campo:keyof InvItem, v:string) =>
    setBorr({ ...borr, programa: borr.programa.map((p,j)=>j===i ? { ...p, [campo]:v, ...(campo==="actividad" && p.icono===iconoPara(p.actividad) ? { icono:iconoPara(v) } : {}) } : p) });

  // ── Invitaciones ──
  const invitados = data.invitados || [];
  const conInv = new Set(personas.flatMap(p=>[p.invitadoId, ...(p.acompanantes||[]).map(a=>a.invitadoId)]).filter(Boolean));
  const faltan = invitados.filter(i=>!conInv.has(i.id));
  const crearFaltantes = async () => {
    const b = writeBatch(db);
    faltan.forEach(i => { const c = nuevoCodigo(); b.set(dref("invitacion","invitados",c), { para:i.nombre, invitadoId:i.id, enviada:false });
      const ix = indiceInv(c); if (ix) b.set(ix, { bodaId: bodaActual() }); });
    await b.commit(); avisar(`✓ ${faltan.length} invitaciones creadas`);
  };
  const crearSuelta = async () => { const c = nuevoCodigo(); const ix = indiceInv(c); if (ix) await setDoc(ix, { bodaId: bodaActual() });
    await setDoc(dref("invitacion","invitados",c), { para:"Nueva invitación", enviada:false }); };
  const quitarDelIndice = (codigo:string) => { const ix = indiceInv(codigo); if (ix) deleteDoc(ix).catch(()=>{}); };
  const cambiarPara = (p:InvPersona, para:string) => { if (para.trim() && para.trim()!==p.para) setDoc(dref("invitacion","invitados",p.codigo), { para:para.trim() }, { merge:true }); };
  const marcarEnviada = (p:InvPersona) => { if (!p.enviada) setDoc(dref("invitacion","invitados",p.codigo), { enviada:true }, { merge:true }); };
  const copiar = async (p:InvPersona) => { try { await navigator.clipboard.writeText(linkDe(p.codigo)); avisar(`✓ Link de ${p.para} copiado`); marcarEnviada(p); } catch { window.prompt("Copia el link:", linkDe(p.codigo)); } };
  // Mensaje que se abre en WhatsApp (texto de Diego y Camila); el link es el de cada invitado
  const textoWsp = (p:InvPersona) => [
    "🤍💍 ¡Nos casamos!",
    "",
    "Con mucho cariño, les compartimos nuestra invitación para celebrar este día tan especial junto a nosotros. ✨",
    "",
    `🔗 Invitación: [${linkDe(p.codigo)}]`,
    "",
    "Les pedimos confirmar su asistencia. ¡Esperamos contar con ustedes! 🥂",
    "",
    `${infoBoda().nombre || "Diego & Camila"} ♡`,
  ].join("\n");
  const whatsapp = (p:InvPersona) => { window.open(`https://wa.me/?text=${encodeURIComponent(textoWsp(p))}`, "_blank"); marcarEnviada(p); };
  const borrar = (p:InvPersona) => { if (window.confirm(`¿Borrar la invitación de ${p.para}? Su link deja de funcionar.`)) { deleteDoc(dref("invitacion","invitados",p.codigo)); quitarDelIndice(p.codigo); } };
  const copiarTodos = async () => {
    const t = personas.slice().sort((a,b)=>a.para.localeCompare(b.para)).map(p=>`${p.para}: ${linkDe(p.codigo)}`).join("\n");
    try { await navigator.clipboard.writeText(t); avisar(`✓ ${personas.length} links copiados`); } catch { window.prompt("Copia la lista:", t); }
  };

  const si = personas.filter(p=>p.respuesta?.asiste===true), no = personas.filter(p=>p.respuesta?.asiste===false);
  const sinResp = personas.filter(p=>!p.respuesta);
  const abiertas = personas.filter(p=>p.abierta || p.vistas).length;
  const lista = personas.filter(p => filtro==="todas" || (filtro==="sin" && !p.respuesta) || (filtro==="si" && p.respuesta?.asiste===true) || (filtro==="no" && p.respuesta?.asiste===false))
    .sort((a,b)=>a.para.localeCompare(b.para));
  const nombreReal = (p:InvPersona) => invitados.find(i=>i.id===p.invitadoId)?.nombre;
  const idsDe = (p:InvPersona) => [p.invitadoId, ...(p.acompanantes||[]).map(a=>a.invitadoId)].filter(Boolean) as number[];
  const porConfirmar = si.flatMap(idsDe).filter(id=>{ const i = invitados.find(x=>x.id===id); return i && !i.confirmado; });
  const personasSi = si.reduce((n,p)=>n+cuantos(p),0), personasNo = no.reduce((n,p)=>n+cuantos(p),0);
  // Acompañantes: sumar a alguien de la lista a una invitación (su link propio, si no se ha mandado, se borra)
  const sumarAcomp = async (p:InvPersona, invitadoId:number) => {
    const i = invitados.find(x=>x.id===invitadoId); if (!i) return;
    const propia = personas.find(x=>x.invitadoId===invitadoId);
    if (propia && (propia.enviada || propia.respuesta || propia.vistas) && !window.confirm(`${i.nombre} ya tiene su propia invitación enviada. ¿Juntarla igual con la de ${p.para}? Su link deja de funcionar.`)) return;
    await setDoc(dref("invitacion","invitados",p.codigo), { acompanantes:[...(p.acompanantes||[]), { invitadoId, nombre:i.nombre }] }, { merge:true });
    if (propia) { await deleteDoc(dref("invitacion","invitados",propia.codigo)); quitarDelIndice(propia.codigo); }
    setSumando(null); avisar(`✓ ${i.nombre} va con ${p.para}`);
  };
  const sacarAcomp = async (p:InvPersona, invitadoId:number) => {
    await setDoc(dref("invitacion","invitados",p.codigo), { acompanantes:(p.acompanantes||[]).filter(a=>a.invitadoId!==invitadoId) }, { merge:true });
    avisar("Separado: si quieres, créale su propia invitación con el botón de arriba");
  };
  const pasarConfirmados = () => {
    const ids = new Set(porConfirmar);
    guardar({ ...data, invitados: invitados.map(i=>ids.has(i.id)?{ ...i, confirmado:true }:i) });
    avisar(`✓ ${ids.size} marcados como confirmados en Invitados`);
  };

  const estado = (p:InvPersona) => p.respuesta ? (p.respuesta.asiste ? ["✓ Viene","#6aaa96","#eef7f2"] : ["✕ No viene","#e07070","#fdf0f0"])
    : (p.abierta || p.vistas) ? ["👀 La abrió","#c9956a","#fdf3ea"] : p.enviada ? ["Enviada","#a07855","#f6efe8"] : ["Sin enviar","#c4a882","#fbf7f2"];
  const lbl = { fontSize:10, fontWeight:700, color:"#a07855", marginBottom:3, display:"block" } as React.CSSProperties;
  const mini = (bg:string, color="#fff") => ({ background:bg, color, border:"none", borderRadius:8, padding:"7px 10px", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" as const });
  const Seccion = ({ id, icono, titulo, resumen }: { id:"diseno"|"datos"|"programa"|"musica"; icono:string; titulo:string; resumen:string }) => (
    <button onClick={()=>setAbierto(abierto===id?null:id)}
      style={{ width:"100%", display:"flex", alignItems:"center", gap:10, background:"none", border:"none", padding:0, cursor:"pointer", fontFamily:"inherit", textAlign:"left" as const }}>
      <span style={{ fontSize:20 }}>{icono}</span>
      <span style={{ flex:1 }}>
        <span style={{ display:"block", fontSize:13, fontWeight:800, color:"#5c3d2e" }}>{titulo}</span>
        <span style={{ display:"block", fontSize:11, color:"#a07855", marginTop:1 }}>{resumen}</span>
      </span>
      <span style={{ fontSize:12, color:"#c9956a", transform:abierto===id?"rotate(180deg)":"none", transition:"transform .2s" }}>▾</span>
    </button>
  );

  return (
    <div>
      {aviso && <div style={{ position:"fixed" as const, left:"50%", bottom:84, transform:"translateX(-50%)", background:"#5c3d2e", color:"#fff", borderRadius:20, padding:"9px 16px", fontSize:12, fontWeight:700, zIndex:500, boxShadow:"0 6px 20px rgba(0,0,0,.2)", maxWidth:"90vw", textAlign:"center" as const }}>{aviso}</div>}

      {/* Resumen */}
      <Card style={{ background:"linear-gradient(135deg,#f6e3df,#efd0ca)", marginBottom:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"#9e4f56", letterSpacing:"0.06em" }}>INVITACIONES</div>
            <div style={{ fontSize:26, fontWeight:900, color:"#9e4f56", lineHeight:1.1, marginTop:2 }}>{personasSi} <span style={{ fontSize:13, fontWeight:700 }}>{personasSi===1?"persona viene":"personas vienen"}</span></div>
          </div>
          <a href={original ? `${origenVista()}/invitacion.html` : `${origenVista()}/m/${bodaActual()}`} target="_blank" rel="noopener noreferrer" style={{ ...mini("#fff","#9e4f56"), textDecoration:"none" }}>👁 Ver muestra</a>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginTop:12 }}>
          {[["Invitaciones",personas.length],["Abiertas",abiertas],["No vienen",personasNo],["Sin responder",sinResp.length]].map(([t,n])=>(
            <div key={t as string} style={{ background:"rgba(255,255,255,.65)", borderRadius:10, padding:"7px 4px", textAlign:"center" as const }}>
              <div style={{ fontSize:17, fontWeight:900, color:"#5c3d2e" }}>{n}</div>
              <div style={{ fontSize:9, color:"#9e4f56", fontWeight:700 }}>{t}</div>
            </div>
          ))}
        </div>
        {porConfirmar.length>0 && (
          <button onClick={pasarConfirmados} style={{ ...mini("#6aaa96"), width:"100%", marginTop:10, padding:"9px" }}>
            Marcar {porConfirmar.length} como confirmados en la lista de Invitados
          </button>
        )}
      </Card>

      {/* Dos vistas: armar y mandar las invitaciones, o leer lo que respondieron */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", background:"#f3e7dc", borderRadius:12, padding:4, marginBottom:14 }}>
        {([["invitaciones","💌 Invitaciones"],["respuestas",`📋 Respuestas${personas.some(p=>p.respuesta) ? ` · ${personas.filter(p=>p.respuesta).length}` : ""}`]] as const).map(([id,t])=>(
          <button key={id} onClick={()=>setVista(id)} style={{ background:vista===id?"#fff":"transparent", border:"none", borderRadius:9, padding:"9px 6px", fontSize:12, fontWeight:800, color:vista===id?"#5c3d2e":"#a07855", cursor:"pointer", fontFamily:"inherit", boxShadow:vista===id?"0 2px 8px rgba(160,120,85,.18)":"none" }}>{t}</button>
        ))}
      </div>

      {vista==="respuestas" ? (
        <RespuestasInv personas={personas} recordar={(p:InvPersona)=>{ window.open(`https://wa.me/?text=${encodeURIComponent(`${p.para}, ¡te esperamos ${fechaTexto(borr.fecha) || (original ? "el viernes 18 de diciembre" : "")}! 💍 Cuando puedas, confírmanos aquí: ${linkDe(p.codigo)}`)}`, "_blank"); }} avisar={avisar}/>
      ) : <>
      {/* Diseño y textos (My Wedding): nombres, fecha, foto, colores y los textos de cada tarjeta */}
      <Card style={{ marginBottom:10, padding:"14px 16px" }}>
        <Seccion id="diseno" icono="✨" titulo="Diseño y textos" resumen={`${[borr.nombre1, borr.nombre2].filter(Boolean).join(" & ") || (original ? "Diego & Camila" : "Sin nombres")} · ${fechaTexto(borr.fecha) || (original ? "18 de diciembre" : "sin fecha")} · ${(PALETAS.find(p=>p.id===(borr.paleta||"salvia"))||PALETAS[0]).nombre}`}/>
        {abierto==="diseno" && (
          <div style={{ display:"flex", flexDirection:"column" as const, gap:10, marginTop:14 }}>
            {original && <div style={{ fontSize:11, color:"#5c3d2e", background:"#fdf3ea", border:"1px solid #f0e0d0", borderRadius:9, padding:"8px 10px", lineHeight:1.5 }}>Lo que dejes vacío sigue como está hoy en su invitación.</div>}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              <div><span style={lbl}>Nombre de uno</span><Inp value={borr.nombre1||""} onChange={v=>setBorr({...borr,nombre1:v})} placeholder="Valentina"/></div>
              <div><span style={lbl}>Nombre del otro</span><Inp value={borr.nombre2||""} onChange={v=>setBorr({...borr,nombre2:v})} placeholder="Matías"/></div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              <div><span style={lbl}>Fecha</span><Inp type="date" value={borr.fecha||""} onChange={v=>setBorr({...borr,fecha:v})}/></div>
              <div><span style={lbl}>Ciudad o comuna</span><Inp value={borr.ciudad||""} onChange={v=>setBorr({...borr,ciudad:v})} placeholder="Pirque"/></div>
            </div>
            <div><span style={lbl}>Título de la invitación</span><Inp value={borr.titulo||""} onChange={v=>setBorr({...borr,titulo:v})} placeholder="¡Nos casamos!"/></div>
            <div>
              <span style={lbl}>Colores</span>
              <div style={{ display:"flex", flexWrap:"wrap" as const, gap:8, marginTop:4 }}>
                {PALETAS.map(p=>{ const act=(borr.paleta||"salvia")===p.id; return (
                  <button key={p.id} onClick={()=>setBorr({...borr,paleta:p.id})} title={p.nombre} style={{ display:"flex", flexDirection:"column" as const, alignItems:"center", gap:4, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", padding:0 }}>
                    <span style={{ display:"flex", borderRadius:20, overflow:"hidden", border:`2px solid ${act?"#5c3d2e":"#f0e0d0"}`, boxShadow:act?"0 0 0 2px #fff inset":"none" }}>
                      {p.colores.map(c=><i key={c} style={{ width:14, height:26, background:c, display:"block" }}/>)}
                    </span>
                    <span style={{ fontSize:9, color:act?"#5c3d2e":"#a07855", fontWeight:act?800:500 }}>{p.nombre}</span>
                  </button>); })}
              </div>
            </div>
            <div>
              <span style={lbl}>Foto de la pareja</span>
              <div style={{ display:"flex", gap:10, alignItems:"center", marginTop:4 }}>
                {(borr.foto || original) && <img src={borr.foto || "/pareja.jpg"} alt="" style={{ width:64, height:64, borderRadius:10, objectFit:"cover", border:"1px solid #f0e0d0" }}/>}
                <label style={{ ...mini("#fdf3ea","#c9956a"), cursor:"pointer" }}>{subiendoFoto ? "Subiendo…" : borr.foto ? "Cambiar foto" : "Subir foto"}
                  <input type="file" accept="image/*" style={{ display:"none" }} onChange={e=>subirFoto(e.target.files?.[0])}/></label>
                {borr.foto && <button onClick={()=>setBorr({...borr,foto:""})} style={mini("transparent","#e07070")}>Quitar</button>}
              </div>
            </div>
            <div><span style={lbl}>Texto bajo la foto</span><Inp value={borr.fotoTexto||""} onChange={v=>setBorr({...borr,fotoTexto:v})} placeholder="Caminando juntos"/></div>
            <div><span style={lbl}>Frase o versículo (vacío = no se muestra)</span>
              <textarea value={borr.frase||""} onChange={e=>setBorr({...borr,frase:e.target.value})} rows={3} placeholder="El amor es paciente, es bondadoso…" style={{ width:"100%", background:"#fdf8f3", border:"1.5px solid #e8d5c4", borderRadius:9, padding:"9px 12px", fontSize:13, color:"#5c3d2e", fontFamily:"inherit", outline:"none", resize:"vertical" as const }}/></div>
            <div><span style={lbl}>De dónde es la frase</span><Inp value={borr.fraseCita||""} onChange={v=>setBorr({...borr,fraseCita:v})} placeholder="1 Corintios 13:4"/></div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              <div><span style={lbl}>Celebración</span><Inp value={borr.celebracion||""} onChange={v=>setBorr({...borr,celebracion:v})} placeholder="Cena, brindis y baile"/></div>
              <div><span style={lbl}>Detalle</span><Inp value={borr.celebracionNota||""} onChange={v=>setBorr({...borr,celebracionNota:v})} placeholder="en el mismo lugar"/></div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              <div><span style={lbl}>Vestimenta</span><Inp value={borr.vestimenta||""} onChange={v=>setBorr({...borr,vestimenta:v})} placeholder="Formal"/></div>
              <div><span style={lbl}>Nota de vestimenta</span><Inp value={borr.vestimentaNota||""} onChange={v=>setBorr({...borr,vestimentaNota:v})} placeholder="Hay piscina: trae traje de baño"/></div>
            </div>
            <div><span style={lbl}>Texto de vestimenta</span><Inp value={borr.vestimentaTexto||""} onChange={v=>setBorr({...borr,vestimentaTexto:v})} placeholder="Es sobre pasto: mejor taco ancho"/></div>
            <div><span style={lbl}>Regalos</span><Inp value={borr.regalos||""} onChange={v=>setBorr({...borr,regalos:v})} placeholder="Tu presencia es nuestro mejor regalo. Habrá lluvia de sobres."/></div>
            <div><span style={lbl}>Nota final</span><Inp value={borr.regalosNota||""} onChange={v=>setBorr({...borr,regalosNota:v})} placeholder="Trae algo para abrigarte en la noche"/></div>
          </div>
        )}
      </Card>

      {/* Datos del lugar */}
      <Card style={{ marginBottom:10, padding:"14px 16px" }}>
        <Seccion id="datos" icono="📍" titulo="Lugar y datos" resumen={`${borr.lugarNombre} · ${borr.direccion} · ${borr.hora} hrs`}/>
        {abierto==="datos" && (
          <div style={{ display:"flex", flexDirection:"column" as const, gap:10, marginTop:14 }}>
            <div><span style={lbl}>Nombre del lugar</span><Inp value={borr.lugarNombre} onChange={v=>setBorr({...borr,lugarNombre:v})} placeholder="Parcela Los Aromos"/></div>
            <div><span style={lbl}>Dirección exacta</span><Inp value={borr.direccion} onChange={v=>setBorr({...borr,direccion:v})} placeholder="Camino Lipangue 1234, parcela 12, Lampa"/></div>
            <div><span style={lbl}>Cómo llegar / referencias</span><Inp value={borr.comoLlegar} onChange={v=>setBorr({...borr,comoLlegar:v})} placeholder="Portón verde, estacionamiento adentro"/></div>
            <div><span style={lbl}>Link de Google Maps (opcional: si no, se busca la dirección)</span><Inp value={borr.mapsUrl} onChange={v=>setBorr({...borr,mapsUrl:v})} placeholder="https://maps.app.goo.gl/…"/></div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              <div><span style={lbl}>Hora de inicio</span><Inp type="time" value={borr.hora} onChange={v=>setBorr({...borr,hora:v})}/></div>
              <div><span style={lbl}>Confirmar antes del</span><Inp value={borr.limite} onChange={v=>setBorr({...borr,limite:v})} placeholder="1 de diciembre"/></div>
            </div>
            <div><span style={lbl}>Frase bajo el nombre del invitado</span><Inp value={borr.mensaje} onChange={v=>setBorr({...borr,mensaje:v})}/></div>
            <a href={borr.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(borr.lugarNombre+", "+borr.direccion)}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:"#c9956a", fontWeight:700 }}>Probar el botón «Cómo llegar» →</a>
          </div>
        )}
      </Card>

      {/* Programa */}
      <Card style={{ marginBottom:10, padding:"14px 16px" }}>
        <Seccion id="programa" icono="🕐" titulo="Programa del día" resumen={`${borr.programa.length} momentos · de ${borr.programa[0]?.hora||"—"} a ${borr.programa[borr.programa.length-1]?.hora||"—"}`}/>
        {abierto==="programa" && (
          <div style={{ marginTop:12 }}>
            {borr.programa.map((p,i)=>(
              <div key={i} style={{ display:"grid", gridTemplateColumns:"74px 1fr 30px", gap:6, padding:"8px 0", borderBottom:"1px solid #f3e7dc" }}>
                <Inp type="time" value={p.hora} onChange={v=>setP(i,"hora",v)} style={{ padding:"8px 6px" }}/>
                <Inp value={p.actividad} onChange={v=>setP(i,"actividad",v)} placeholder="Qué pasa"/>
                <button onClick={()=>setBorr({...borr,programa:borr.programa.filter((_,j)=>j!==i)})} style={{ background:"none", border:"none", color:"#e07070", fontSize:14, cursor:"pointer" }}>✕</button>
                <Sel value={p.icono} onChange={v=>setP(i,"icono",v)} options={INV_ICONOS.map(([value,label])=>({value,label}))} style={{ padding:"7px 4px", fontSize:11 }}/>
                <Inp value={p.detalle||""} onChange={v=>setP(i,"detalle",v)} placeholder="Detalle chico (opcional)" style={{ fontSize:12, padding:"7px 10px" }}/>
              </div>
            ))}
            <div style={{ display:"flex", gap:8, marginTop:10, flexWrap:"wrap" as const }}>
              <button onClick={()=>setBorr({...borr,programa:[...borr.programa,{ hora:"", actividad:"", detalle:"", icono:"anillos" }]})} style={mini("#fdf3ea","#c9956a")}>+ Agregar momento</button>
              {(data.cronograma||[]).length>0 && (
                <button onClick={()=>setBorr({...borr,programa:(data.cronograma||[]).map(c=>({ hora:c.hora, actividad:c.actividad, detalle:"", icono:iconoPara(c.actividad) }))})} style={mini("#fdf3ea","#a07855")}>Traer de la pestaña Programa</button>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Música */}
      <Card style={{ marginBottom:10, padding:"14px 16px" }}>
        <Seccion id="musica" icono="🎵" titulo="Música al abrir la carta" resumen={borr.musicaArchivo ? `${borr.musicaNombre || "Canción subida"}${borr.musicaInicio ? ` · desde ${borr.musicaInicio}` : ""}` : idYoutube(borr.musicaUrl) ? "YouTube (en iPhone puede no sonar)" : "Sin canción todavía"}/>
        {abierto==="musica" && (
          <div style={{ display:"flex", flexDirection:"column" as const, gap:10, marginTop:14 }}>
            <div style={{ fontSize:11, color:"#5c3d2e", background:"#f0f6f1", border:"1px solid #cfe3d6", borderRadius:9, padding:"8px 10px", lineHeight:1.5 }}>
              <b>Sube el archivo de la canción (MP3 o M4A).</b> Es lo que suena en todos los teléfonos. Con un link de YouTube, el iPhone no la deja sonar al tocar el sello.
            </div>
            {borr.musicaArchivo ? (
              <div style={{ background:"#fdf8f3", borderRadius:10, padding:10 }}>
                <div style={{ fontSize:12, fontWeight:800, color:"#5c3d2e", marginBottom:6 }}>🎵 {borr.musicaNombre || "Canción subida"}</div>
                <audio controls src={borr.musicaArchivo} style={{ width:"100%" }}/>
                <button onClick={()=>setBorr({ ...borr, musicaArchivo:"", musicaNombre:"" })} style={{ ...mini("transparent","#e07070"), marginTop:6, padding:"4px 0" }}>Quitar esta canción</button>
              </div>
            ) : (
              <label style={{ ...mini("#c9956a"), padding:"11px", textAlign:"center" as const, display:"block", opacity:subiendoMusica?.6:1 }}>
                {subiendoMusica ? "Subiendo canción…" : "Subir canción (MP3 o M4A)"}
                <input type="file" accept="audio/*,.mp3,.m4a" disabled={subiendoMusica} onChange={e=>{ subirMusica(e.target.files?.[0]); e.target.value=""; }} style={{ display:"none" }}/>
              </label>
            )}
            <div><span style={lbl}>Desde qué minuto parte (opcional, ej. 0:20)</span><Inp value={borr.musicaInicio} onChange={v=>setBorr({...borr,musicaInicio:v.trim()})} placeholder="0:00"/></div>
            <details style={{ fontSize:11, color:"#a07855" }}>
              <summary style={{ cursor:"pointer", fontWeight:700 }}>O usar un link de YouTube (solo de respaldo)</summary>
              <div style={{ marginTop:8 }}><Inp value={borr.musicaUrl} onChange={v=>setBorr({...borr,musicaUrl:v.trim()})} placeholder="https://youtu.be/…"/></div>
              {borr.musicaUrl && !idYoutube(borr.musicaUrl) && <div style={{ color:"#e07070", fontWeight:700, marginTop:4 }}>No reconozco ese link.</div>}
              <div style={{ marginTop:6, lineHeight:1.5 }}>Se usa solo si no hay archivo. Suena en Android y computador; en iPhone, no.</div>
            </details>
          </div>
        )}
      </Card>

      {cambios && (
        <div style={{ position:"sticky" as const, bottom:76, zIndex:20, display:"flex", gap:8, marginBottom:10 }}>
          <button onClick={guardarCfg} style={{ ...mini("#c46a6e"), flex:1, padding:"12px", fontSize:13, boxShadow:"0 6px 18px rgba(196,106,110,.4)" }}>Guardar cambios de la invitación</button>
          <button onClick={()=>setBorr(cfg)} style={{ ...mini("#fff","#a07855"), padding:"12px" }}>Descartar</button>
        </div>
      )}

      {/* Invitaciones una por una */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", margin:"18px 2px 8px" }}>
        <div style={{ fontSize:13, fontWeight:800, color:"#5c3d2e" }}>💌 Una invitación por persona</div>
        {personas.length>0 && <button onClick={copiarTodos} style={mini("#fdf3ea","#c9956a")}>Copiar todos los links</button>}
      </div>

      {faltan.length>0 && (
        <Card style={{ marginBottom:10, background:"#fff8f0", border:"1px dashed #e8c8a0", padding:"14px 16px" }}>
          <div style={{ fontSize:12, color:"#a07855", lineHeight:1.5, marginBottom:9 }}>
            {personas.length===0 ? <>Tienes <strong>{invitados.length} invitados</strong> en la lista. Crea un link distinto para cada uno; después puedes cambiar cómo sale su nombre («Tía Carmen», «Familia Pérez»…).</>
              : <><strong>{faltan.length}</strong> invitado{faltan.length>1?"s":""} de la lista todavía no tiene{faltan.length>1?"n":""} invitación.</>}
          </div>
          <button onClick={crearFaltantes} style={{ ...mini("#c9956a"), width:"100%", padding:"11px", fontSize:12 }}>Crear {faltan.length} invitacion{faltan.length>1?"es":""}</button>
        </Card>
      )}

      {personas.length>0 && (
        <div style={{ display:"flex", gap:6, marginBottom:10, overflowX:"auto" as const }}>
          {([["todas","Todas",personas.length],["sin","Sin responder",sinResp.length],["si","Vienen",si.length],["no","No vienen",no.length]] as const).map(([id,t,n])=>(
            <button key={id} onClick={()=>setFiltro(id)} style={{ ...mini(filtro===id?"#5c3d2e":"#fff", filtro===id?"#fff":"#a07855"), border:"1px solid #ecdccb", borderRadius:20 }}>{t} · {n}</button>
          ))}
        </div>
      )}

      {lista.map(p=>{
        const [et, col, fondo] = estado(p);
        const real = nombreReal(p);
        return (
          <Card key={p.codigo} style={{ padding:"11px 12px", marginBottom:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <input defaultValue={p.para} key={p.para} onBlur={e=>cambiarPara(p,e.target.value)} onKeyDown={e=>{ if (e.key==="Enter") (e.target as HTMLInputElement).blur(); }}
                  title="Así sale el nombre en la invitación"
                  style={{ width:"100%", border:"none", borderBottom:"1px dashed #e8d5c4", background:"transparent", fontSize:14, fontWeight:800, color:"#5c3d2e", fontFamily:"inherit", padding:"2px 0", outline:"none" }}/>
                <div style={{ fontSize:10, color:"#c4a882", marginTop:2 }}>{real && real!==p.para ? `${real} · ` : ""}/i/{p.codigo}{p.vistas ? ` · la abrió ${p.vistas} ${p.vistas===1?"vez":"veces"}` : ""}</div>
              </div>
              <span style={{ fontSize:10, fontWeight:800, color:col, background:fondo, borderRadius:20, padding:"4px 9px", whiteSpace:"nowrap" as const }}>{et}</span>
            </div>
            {/* Acompañantes */}
            <div style={{ display:"flex", flexWrap:"wrap" as const, gap:5, alignItems:"center", marginTop:7 }}>
              {(p.acompanantes||[]).map(a=>(
                <span key={a.invitadoId} style={{ fontSize:10.5, fontWeight:700, color:"#6a7d5c", background:"#eef3ea", borderRadius:20, padding:"3px 4px 3px 9px", display:"inline-flex", alignItems:"center", gap:4 }}>
                  + {a.nombre}<button onClick={()=>sacarAcomp(p,a.invitadoId)} title="Separar" style={{ background:"none", border:"none", color:"#9aab8c", cursor:"pointer", fontSize:11, padding:"0 3px" }}>✕</button></span>
              ))}
              {sumando===p.codigo ? (
                <select autoFocus defaultValue="" onChange={e=>{ if (e.target.value) sumarAcomp(p, Number(e.target.value)); }} onBlur={()=>setSumando(null)}
                  style={{ fontSize:11, border:"1px solid #e8d5c4", borderRadius:8, padding:"4px 6px", background:"#fff", color:"#5c3d2e", fontFamily:"inherit" }}>
                  <option value="">¿Quién va con {p.para}?</option>
                  {invitados.filter(i=>i.id!==p.invitadoId && !personas.some(x=>(x.acompanantes||[]).some(a=>a.invitadoId===i.id)) && !personas.some(x=>x.invitadoId===i.id && (x.acompanantes||[]).length))
                    .sort((a,b)=>a.nombre.localeCompare(b.nombre)).map(i=><option key={i.id} value={i.id}>{i.nombre}{i.notas?` · ${i.notas}`:""}</option>)}
                </select>
              ) : (
                <button onClick={()=>setSumando(p.codigo)} style={{ fontSize:10.5, fontWeight:700, color:"#a07855", background:"transparent", border:"1px dashed #e8d5c4", borderRadius:20, padding:"3px 9px", cursor:"pointer", fontFamily:"inherit" }}>+ Acompañante</button>
              )}
            </div>
            {p.respuesta && (
              <div style={{ fontSize:11, color:"#a07855", background:"#fdf8f3", borderRadius:8, padding:"7px 9px", marginTop:8, lineHeight:1.5 }}>
                {cuantos(p)>1 && <div style={{ fontWeight:800, color:p.respuesta.asiste?"#4f8a73":"#c05050" }}>{p.respuesta.asiste?`Vienen ${cuantos(p)}`:`No vienen (${cuantos(p)})`}</div>}
                {p.respuesta.asiste ? <>
                  🍽️ {(p.respuesta.comida||[]).join(", ")||"Come de todo"}
                  {p.respuesta.cancion && <> · 🎵 {p.respuesta.cancion}</>}
                  {p.respuesta.deseo && <div style={{ fontStyle:"italic" as const, marginTop:3 }}>“{p.respuesta.deseo}”</div>}
                </> : "Avisó que no podrá venir"}
              </div>
            )}
            <div style={{ display:"flex", gap:6, marginTop:9 }}>
              <button onClick={()=>whatsapp(p)} style={{ ...mini("#25a35a"), flex:1 }}>WhatsApp</button>
              <button onClick={()=>copiar(p)} style={{ ...mini("#fdf3ea","#c9956a"), flex:1 }}>Copiar link</button>
              <a href={`${origenVista()}/i/${p.codigo}#vista`} target="_blank" rel="noopener noreferrer" style={{ ...mini("#fdf3ea","#a07855"), textDecoration:"none" }}>Ver</a>
              <button onClick={()=>borrar(p)} style={mini("transparent","#e0a0a0")}>✕</button>
            </div>
          </Card>
        );
      })}
      <button onClick={crearSuelta} style={{ ...mini("#fff","#c9956a"), width:"100%", padding:"10px", border:"1.5px dashed #e8d5c4", marginTop:4 }}>+ Invitación extra (alguien que no está en la lista)</button>
      <div style={{ fontSize:10, color:"#c4a882", lineHeight:1.5, marginTop:10, padding:"0 2px" }}>
        Toca el nombre para cambiar cómo sale en la invitación. «Ver» abre su invitación tal como la va a ver, sin contarla como abierta ni guardar nada.
      </div>
      </>}
    </div>
  );
}
