import React, { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc, collection, deleteDoc, writeBatch } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, listAll, deleteObject } from "firebase/storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// ── Firebase ────────────────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyAc0WdoLmTjfR-ucxAON1Lr9abcQAeHM-4",
  authDomain:        "arain-database.firebaseapp.com",
  projectId:         "arain-database",
  storageBucket:     "arain-database.firebasestorage.app",
  messagingSenderId: "541671718502",
  appId:             "1:541671718502:web:ed236770ea20bd34cf37a7"
};
const app  = initializeApp(FIREBASE_CONFIG);
const db   = getFirestore(app);
const stor = getStorage(app);
let messaging: any = null;
try { messaging = getMessaging(app); } catch(e) { console.warn("FCM no disponible:", e); }

const VAPID_KEY = "BF8iV0eX06sZu_rJyPrTFeGZtB1d8qWoqrM_zFsU62CEUM6XXnwrL7ylpQzKMiCYrVF6pUPrVxJUyHfvR8keRZg";

async function initFCM() {
  try {
    if (!messaging || !("Notification" in window)) return;
    if ("serviceWorker" in navigator) {
      await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (!token) return;
    // Un registro por teléfono: si el token se renueva, se reemplaza el del mismo teléfono (antes se acumulaban
    // y la misma notificación llegaba 2 y 3 veces). El token se saca de la lista vieja `tokens`.
    const docRef = doc(db, "boda", "notif");
    let disp = localStorage.getItem("boda_dispositivo");
    if (!disp) { disp = Math.random().toString(36).slice(2, 12); localStorage.setItem("boda_dispositivo", disp); }
    const { updateDoc, arrayRemove } = await import("firebase/firestore");
    await setDoc(docRef, { dispositivos: { [disp]: { token, fecha: new Date().toISOString() } } }, { merge: true });
    await updateDoc(docRef, { tokens: arrayRemove(token) }).catch(() => {});
  } catch(e) { console.error("FCM boda:", e); }
}

// ── Constantes ──────────────────────────────────────────────────
const BODA_FECHA   = new Date("2027-11-27T19:00:00");
const ACCESO_PIN   = "2711";
const FOTOS_PIN    = "BODA27";

// ── Helpers ─────────────────────────────────────────────────────
const fmt = (n: number) => "$" + n.toLocaleString("es-CL");
const diasFaltantes = () => Math.ceil((BODA_FECHA.getTime() - Date.now()) / 86400000);

type VideoInfo = { tipo: "youtube" | "tiktok" | "otro"; id?: string; url: string };

function getVideoInfo(url: string): VideoInfo | null {
  if (!url) return null;
  // YouTube: youtu.be/ID, youtube.com/watch?v=ID, youtube.com/shorts/ID
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([a-zA-Z0-9_-]{11})/);
  if (yt) return { tipo:"youtube", id:yt[1], url };
  // TikTok
  if (url.includes("tiktok.com")) return { tipo:"tiktok", url };
  // Otro link genérico
  if (url.startsWith("http")) return { tipo:"otro", url };
  return null;
}

function useCuentaRegresiva() {
  const [tiempo, setTiempo] = useState({ dias:0, horas:0, minutos:0, segundos:0 });
  useEffect(() => {
    const calc = () => {
      const diff = BODA_FECHA.getTime() - Date.now();
      if (diff <= 0) { setTiempo({ dias:0, horas:0, minutos:0, segundos:0 }); return; }
      setTiempo({
        dias:     Math.floor(diff / 86400000),
        horas:    Math.floor((diff % 86400000) / 3600000),
        minutos:  Math.floor((diff % 3600000) / 60000),
        segundos: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);
  return tiempo;
}

function useData<T>(coleccion: string, inicial: T) {
  const [data, setData] = useState<T>(inicial);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "boda", coleccion), snap => {
      if (snap.exists()) setData(snap.data() as T);
    });
    return unsub;
  }, [coleccion]);

  const guardar = async (nuevo: T) => {
    setData(nuevo);
    await setDoc(doc(db, "boda", coleccion), nuevo as object);
  };

  return [data, guardar] as const;
}

// ── Tipos ────────────────────────────────────────────────────────
type Invitado  = { id:number; nombre:string; tipo:"adulto"|"niño"; mesa:number; confirmado:"si"|"no"|"pendiente"; dieta?:string; notas?:string; };
type Proveedor = { id:number; categoria:string; nombre:string; descripcion:string; costo:number; extras:{desc:string;monto:number}[]; estado:"confirmado"|"pendiente"|"descartado"; contacto?:string; notas?:string; };
type GastoExtra= { id:number; nombre:string; categoria:string; monto:number; pagado:boolean; };
type Cancion   = { id:number; titulo:string; artista:string; momento:string; link?:string; };
type Regalo    = { id:number; nombre:string; precio:number; prioridad:"alta"|"media"|"baja"; recibido:boolean; link?:string; };
type LunaItem  = { id:number; categoria:string; descripcion:string; monto:number; confirmado:boolean; notas?:string; };
type MesaPos   = { id:number; numero:number; x:number; y:number; forma:"circular"|"rectangular"|"cuadrada"; };
type Foto      = { url:string; nombre:string; };
// `checks` = lo que hace falta para montar ESA decoración (trípode, cuadro, flores…).
// Se agregan a mano, los que cada una necesite.
type DecoCheck = { id:number; texto:string; listo:boolean };
type DecoItem  = { id:number; nombre:string; categoria:string; cantidad:number; precio:number; foto?:string; videoUrl?:string; notas?:string; comprado:boolean; checks?:DecoCheck[]; };

// ── Error Boundary ───────────────────────────────────────────────
export class ErrorBoundary extends React.Component<{children:React.ReactNode},{error:string|null}> {
  constructor(props:any) { super(props); this.state = { error:null }; }
  static getDerivedStateFromError(e:any) { return { error: e?.message || String(e) }; }
  render() {
    if (this.state.error) return (
      <div style={{ padding:32, fontFamily:"sans-serif", color:"#c00" }}>
        <h2>Error en la app</h2>
        <pre style={{ fontSize:12, marginTop:12, whiteSpace:"pre-wrap" }}>{this.state.error}</pre>
        <button onClick={()=>window.location.reload()} style={{ marginTop:16, padding:"8px 16px", cursor:"pointer" }}>Recargar</button>
      </div>
    );
    return this.props.children;
  }
}

// ── Estilos globales ─────────────────────────────────────────────
function S() {
  return <style>{`
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#fdf8f3;font-family:'Georgia','Times New Roman',serif}
    ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#e8d5c4;border-radius:4px}
    input,textarea,select{font-family:inherit}
    @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes slideInRight{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  `}</style>;
}

// ── Componentes base ─────────────────────────────────────────────
function Card({ children, style }: { children:React.ReactNode; style?:React.CSSProperties }) {
  return <div style={{ background:"#fff", borderRadius:16, padding:20, boxShadow:"0 2px 16px rgba(180,130,100,.10)", ...style }}>{children}</div>;
}
function Btn({ children, onClick, color="#c9956a", outline=false, style }: { children:React.ReactNode; onClick?:()=>void; color?:string; outline?:boolean; style?:React.CSSProperties }) {
  return <button onClick={onClick} style={{ background:outline?"transparent":color, border:`2px solid ${color}`, color:outline?color:"#fff", borderRadius:10, padding:"10px 18px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", ...style }}>{children}</button>;
}
function Inp({ value, onChange, placeholder, type="text", style }: { value:string; onChange:(v:string)=>void; placeholder?:string; type?:string; style?:React.CSSProperties }) {
  return <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} type={type} style={{ background:"#fdf8f3", border:"1.5px solid #e8d5c4", borderRadius:9, padding:"9px 12px", fontSize:13, color:"#5c3d2e", width:"100%", outline:"none", fontFamily:"inherit", ...style }}/>;
}
function Sel({ value, onChange, options, style }: { value:string; onChange:(v:string)=>void; options:{value:string;label:string}[]; style?:React.CSSProperties }) {
  return <select value={value} onChange={e=>onChange(e.target.value)} style={{ background:"#fdf8f3", border:"1.5px solid #e8d5c4", borderRadius:9, padding:"9px 12px", fontSize:13, color:"#5c3d2e", width:"100%", outline:"none", fontFamily:"inherit", ...style }}>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>;
}
function Badge({ text, color }: { text:string; color:string }) {
  return <span style={{ background:color+"22", color, border:`1px solid ${color}44`, borderRadius:6, padding:"2px 8px", fontSize:10, fontWeight:700 }}>{text}</span>;
}
function Title({ icon, title }: { icon:string; title:string }) {
  return <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}><span style={{ fontSize:22 }}>{icon}</span><h2 style={{ fontSize:18, fontWeight:700, color:"#5c3d2e" }}>{title}</h2></div>;
}

// ════════════════════════════════════════════════════════════════
// LOGIN
// ════════════════════════════════════════════════════════════════
function PantallaLogin({ onLogin }: { onLogin:(tipo:"admin"|"fotos")=>void }) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const intentar = () => {
    if (pin === ACCESO_PIN) { onLogin("admin"); return; }
    if (pin.toUpperCase() === FOTOS_PIN) { onLogin("fotos"); return; }
    setErr("Código incorrecto"); setPin("");
  };
  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#fff5ee 0%,#fde8d8 50%,#f8d5c2 100%)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
      <S/>
      <div style={{ animation:"float 3s ease-in-out infinite", marginBottom:24 }}>
        <img src="/pareja.jpg" alt="Boda" style={{ width:100, height:100, borderRadius:"50%", objectFit:"cover", border:"4px solid #c9956a", boxShadow:"0 8px 32px rgba(201,149,106,.3)" }}/>
      </div>
      <div style={{ textAlign:"center", marginBottom:32, animation:"fadeUp .6s ease" }}>
        <div style={{ fontSize:12, letterSpacing:"0.2em", color:"#c9956a", marginBottom:8, textTransform:"uppercase" }}>💍 27 · Noviembre · 2027 💍</div>
        <h1 style={{ fontSize:32, color:"#5c3d2e", fontWeight:400, marginBottom:4 }}>Diego & Camila</h1>
        <div style={{ fontSize:14, color:"#a07855" }}>Nuestra boda</div>
      </div>
      <Card style={{ width:"100%", maxWidth:340, animation:"fadeUp .7s ease" }}>
        <div style={{ fontSize:13, color:"#a07855", marginBottom:16, textAlign:"center" }}>Ingresa tu código de acceso</div>
        <Inp value={pin} onChange={v=>{setPin(v);setErr("");}} placeholder="Código..." type="password"/>
        {err && <div style={{ color:"#e07070", fontSize:12, marginTop:8, textAlign:"center" }}>{err}</div>}
        <Btn onClick={intentar} style={{ width:"100%", marginTop:14 }}>Entrar →</Btn>
        <div style={{ fontSize:11, color:"#c4a882", marginTop:14, textAlign:"center" }}>Invitados: usa el código del QR para subir fotos</div>
      </Card>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════════
function BannerNotificaciones() {
  const [estado, setEstado] = React.useState<"idle"|"cargando"|"listo"|"negado">("idle");
  const esPWA = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;

  React.useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") setEstado("listo");
    if (Notification.permission === "denied")  setEstado("negado");
  }, []);

  if (estado === "listo") return null;

  const activar = async () => {
    if (!esPWA) return;
    setEstado("cargando");
    await initFCM();
    const perm = ("Notification" in window) ? Notification.permission : "denied";
    setEstado(perm === "granted" ? "listo" : "negado");
  };

  if (!esPWA) return (
    <Card style={{border:"1px solid #c9956a",background:"#fdf0e8"}}>
      <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
        <span style={{fontSize:22,flexShrink:0}}>📲</span>
        <div>
          <div style={{fontSize:12,fontWeight:700,color:"#c9956a",marginBottom:4}}>Instala la app para activar notificaciones</div>
          <div style={{fontSize:11,color:"#a07855",lineHeight:1.6}}>En Safari: toca <strong>Compartir →</strong> luego <strong>"Añadir a pantalla de inicio"</strong> y abre la app desde el ícono.</div>
        </div>
      </div>
    </Card>
  );

  if (estado === "negado") return (
    <Card style={{border:"1px solid #f87171",background:"#fef2f2"}}>
      <div style={{fontSize:11,color:"#e8544a"}}>❌ Notificaciones bloqueadas. Ve a Configuración → Safari para activarlas.</div>
    </Card>
  );

  return (
    <button onClick={activar} disabled={estado==="cargando"}
      style={{width:"100%",background:"linear-gradient(135deg,#c9956a,#a07040)",border:"none",borderRadius:14,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",fontFamily:"inherit",opacity:estado==="cargando"?0.7:1,marginBottom:4}}>
      <span style={{fontSize:22}}>🔔</span>
      <div style={{textAlign:"left"}}>
        <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>Activar notificaciones</div>
        <div style={{fontSize:10,color:"#fde8d0",marginTop:2}}>Recibe avisos sobre tareas urgentes de la boda</div>
      </div>
    </button>
  );
}

function Dashboard({ invitados, proveedores, gastos }: { invitados:{invitados:Invitado[]}; proveedores:{proveedores:Proveedor[]}; gastos:{gastos:GastoExtra[]} }) {
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

// ════════════════════════════════════════════════════════════════
// PROVEEDORES
// ════════════════════════════════════════════════════════════════
const CATS_PROV = ["Fotografía","Animador","Animación","Lugar","Catering","Música","Decoración","Cabina Fotos","Torta","Transporte","Otro"];
const PROVEEDORES_INICIALES: Proveedor[] = [
  { id:1, categoria:"Fotografía", nombre:"Pancho Jorquez", descripcion:"Fotógrafo profesional", costo:650000, extras:[{desc:"Traslado",monto:40000}], estado:"confirmado", contacto:"", notas:"" },
];

function Proveedores({ data, setData }: { data:{proveedores:Proveedor[]}; setData:(d:any)=>void }) {
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
              <button onClick={()=>{setForm(p);setEditId(p.id);setShow(true);}} style={{ background:"none", border:"none", color:"#c9956a", fontSize:12, cursor:"pointer", marginTop:8, padding:0, fontFamily:"inherit" }}>✏️ Editar</button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// INVITADOS
// ════════════════════════════════════════════════════════════════
function Invitados({ data, setData }: { data:{invitados:Invitado[]}; setData:(d:any)=>void }) {
  const lista = data.invitados || [];
  const [form, setForm] = useState<Partial<Invitado>>({ tipo:"adulto", confirmado:"pendiente" });
  const [show, setShow] = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const [filtro, setFiltro] = useState("todos");
  const [buscar, setBuscar] = useState("");

  const guardar = () => {
    if (!form.nombre) return;
    if (editId !== null) {
      setData({invitados:lista.map(i=>i.id===editId?{...i,...form} as Invitado:i)});
    } else {
      const nuevo: Invitado = { id:Date.now(), nombre:form.nombre!, tipo:form.tipo||"adulto", mesa:form.mesa||0, confirmado:form.confirmado||"pendiente", dieta:form.dieta||"", notas:form.notas||"" };
      setData({invitados:[...lista,nuevo]});
    }
    setForm({tipo:"adulto",confirmado:"pendiente"}); setEditId(null); setShow(false);
  };
  const editar   = (i:Invitado) => { setForm(i); setEditId(i.id); setShow(true); };
  const cambiar  = (id:number, v:"si"|"no"|"pendiente") => setData({invitados:lista.map(i=>i.id===id?{...i,confirmado:v}:i)});
  const eliminar = (id:number) => { setData({invitados:lista.filter(i=>i.id!==id)}); if(editId===id){setShow(false);setEditId(null);setForm({tipo:"adulto",confirmado:"pendiente"});} };
  const colorC  = (c:string)  => c==="si"?"#6aaa96":c==="no"?"#e07070":"#c9956a";
  const filtrados = lista.filter(i=>filtro==="todos"||i.confirmado===filtro||i.tipo===filtro).filter(i=>i.nombre.toLowerCase().includes(buscar.toLowerCase()));

  return (
    <div style={{ animation:"fadeUp .3s ease" }}>
      <Title icon="👥" title="Invitados"/>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:16 }}>
        {[{l:"Total",v:lista.length,c:"#c9956a"},{l:"Confirmados",v:lista.filter(i=>i.confirmado==="si").length,c:"#6aaa96"},{l:"Pendientes",v:lista.filter(i=>i.confirmado==="pendiente").length,c:"#9b7bb5"}].map(s=>(
          <Card key={s.l} style={{ padding:14, textAlign:"center" }}>
            <div style={{ fontSize:22, fontWeight:700, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:10, color:"#a07855", marginTop:2 }}>{s.l}</div>
          </Card>
        ))}
      </div>
      {show && (
        <Card style={{ marginBottom:16, border:"2px solid #e8d5c4" }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#5c3d2e", marginBottom:14 }}>{editId?"Editar":"Nuevo"} invitado</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <Inp value={form.nombre||""} onChange={v=>setForm({...form,nombre:v})} placeholder="Nombre completo"/>
            <Sel value={form.tipo||"adulto"} onChange={v=>setForm({...form,tipo:v as any})} options={[{value:"adulto",label:"👤 Adulto ($75.000)"},{value:"niño",label:"👶 Niño ($35.000)"}]}/>
            <Sel value={form.confirmado||"pendiente"} onChange={v=>setForm({...form,confirmado:v as any})} options={[{value:"pendiente",label:"⏳ Pendiente"},{value:"si",label:"✅ Confirmado"},{value:"no",label:"❌ No viene"}]}/>
            <Inp value={form.mesa?.toString()||""} onChange={v=>setForm({...form,mesa:Number(v)})} placeholder="Mesa Nº" type="number"/>
            <Inp value={form.dieta||""} onChange={v=>setForm({...form,dieta:v})} placeholder="Restricción dietética (opcional)"/>
            <Inp value={form.notas||""} onChange={v=>setForm({...form,notas:v})} placeholder="Notas (opcional)"/>
          </div>
          <div style={{ display:"flex", gap:8, marginTop:14 }}>
            <Btn onClick={guardar}>Guardar</Btn>
            <Btn onClick={()=>{setShow(false);setForm({tipo:"adulto",confirmado:"pendiente"});setEditId(null);}} outline>Cancelar</Btn>
          </div>
        </Card>
      )}
      <div style={{ display:"flex", gap:8, marginBottom:12 }}>
        {!show && <Btn onClick={()=>setShow(true)}>+ Agregar</Btn>}
        <Inp value={buscar} onChange={setBuscar} placeholder="🔍 Buscar..." style={{ flex:1 }}/>
      </div>
      <div style={{ display:"flex", gap:6, marginBottom:14, overflowX:"auto", paddingBottom:4 }}>
        {["todos","si","no","pendiente","adulto","niño"].map(f=>(
          <button key={f} onClick={()=>setFiltro(f)} style={{ background:filtro===f?"#c9956a":"#f5e8dc", border:"none", borderRadius:8, padding:"6px 12px", fontSize:11, fontWeight:700, color:filtro===f?"#fff":"#a07855", cursor:"pointer", whiteSpace:"nowrap", fontFamily:"inherit" }}>{f}</button>
        ))}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {filtrados.map(i=>(
          <Card key={i.id} style={{ padding:14, display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:"50%", background:i.tipo==="adulto"?"#f5e8dc":"#e8f5ec", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{i.tipo==="adulto"?"👤":"👶"}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#5c3d2e" }}>{i.nombre}</div>
              <div style={{ fontSize:11, color:"#a07855" }}>{fmt(i.tipo==="adulto"?75000:35000)}{i.mesa?` · Mesa ${i.mesa}`:""}{i.dieta?` · ${i.dieta}`:""}</div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end" }}>
              <Badge text={i.confirmado==="si"?"✓ Sí":i.confirmado==="no"?"✗ No":"⏳"} color={colorC(i.confirmado)}/>
              <div style={{ display:"flex", gap:4 }}>
                {(["si","no","pendiente"] as const).map(v=>(
                  <button key={v} onClick={()=>cambiar(i.id,v)} style={{ background:i.confirmado===v?colorC(v)+"33":"none", border:`1px solid ${colorC(v)}44`, borderRadius:5, padding:"2px 6px", fontSize:10, color:colorC(v), cursor:"pointer", fontFamily:"inherit" }}>{v==="si"?"✓":v==="no"?"✗":"?"}</button>
                ))}
                <button onClick={()=>editar(i)} style={{ background:"none", border:"1px solid #c9956a44", borderRadius:5, padding:"2px 6px", fontSize:10, color:"#c9956a", cursor:"pointer" }}>✏️</button>
                <button onClick={()=>eliminar(i.id)} style={{ background:"none", border:"1px solid #e0c0c0", borderRadius:5, padding:"2px 6px", fontSize:10, color:"#e07070", cursor:"pointer" }}>🗑</button>
              </div>
            </div>
          </Card>
        ))}
        {filtrados.length===0 && <div style={{ textAlign:"center", color:"#c4a882", padding:32 }}>Sin invitados en este filtro</div>}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MESAS
// ════════════════════════════════════════════════════════════════
function Mesas({ invitados, setInvitados, mesasData, setMesasData }: {
  invitados:{invitados:Invitado[]}; setInvitados:(d:any)=>void;
  mesasData:{mesas:MesaPos[]}; setMesasData:(d:any)=>void;
}) {
  const lista  = invitados.invitados || [];
  const [localMesas, setLocalMesas] = useState<MesaPos[]>([]);
  const [seleccionada, setSeleccionada] = useState<number|null>(null);
  const dragRef = useRef<{id:number;startX:number;startY:number;origX:number;origY:number;moved:boolean}|null>(null);
  const roomRef = useRef<HTMLDivElement>(null);

  const TR      = 36;
  const cols    = 3;
  const spacing = 110;
  const RoomH   = Math.max(320, 60 + Math.ceil((localMesas.length + 1) / cols) * spacing + TR);
  const [formaAgregar, setFormaAgregar] = useState<"circular"|"rectangular"|"cuadrada">("circular");

  useEffect(() => { setLocalMesas(mesasData.mesas || []); }, [mesasData]);

  const sinMesa    = lista.filter(i=>!i.mesa||i.mesa===0);
  const invDeMesa  = (num:number) => lista.filter(i=>i.mesa===num);
  const mesaActual = localMesas.find(m=>m.numero===seleccionada);

  const cambiarForma = (id:number, forma:"circular"|"rectangular"|"cuadrada") => {
    const nuevas = localMesas.map(m=>m.id===id?{...m,forma}:m);
    setLocalMesas(nuevas);
    setMesasData({ mesas: nuevas });
  };

  const addMesa = () => {
    const nums    = localMesas.map(m=>m.numero);
    const next    = nums.length ? Math.max(...nums)+1 : 1;
    const idx     = localMesas.length;
    const col     = idx % cols;
    const row     = Math.floor(idx / cols);
    const x       = 60 + col * spacing;
    const y       = 60 + row * spacing;
    const nuevo: MesaPos = { id:Date.now(), numero:next, x, y, forma:formaAgregar };
    const nuevas  = [...localMesas, nuevo];
    setLocalMesas(nuevas);
    setMesasData({ mesas: nuevas });
  };

  const eliminarMesa = (num:number) => {
    setInvitados({ invitados: lista.map(i=>i.mesa===num?{...i,mesa:0}:i) });
    const nuevas = localMesas.filter(m=>m.numero!==num);
    setLocalMesas(nuevas);
    setMesasData({ mesas: nuevas });
    setSeleccionada(null);
  };

  const toggleInvitado = (invId:number, mesaNum:number) => {
    const inv = lista.find(i=>i.id===invId);
    if (!inv) return;
    const newMesa = inv.mesa===mesaNum ? 0 : mesaNum;
    setInvitados({ invitados: lista.map(i=>i.id===invId?{...i,mesa:newMesa}:i) });
  };

  // ── Drag (touch + mouse) ───────────────────────────────────────
  const startDrag = (e:React.TouchEvent|React.MouseEvent, mesa:MesaPos) => {
    e.stopPropagation();
    const touch = "touches" in e ? e.touches[0] : null;
    if ("touches" in e && !touch) return;
    const clientX = touch ? touch.clientX : (e as React.MouseEvent).clientX;
    const clientY = touch ? touch.clientY : (e as React.MouseEvent).clientY;
    dragRef.current = { id:mesa.id, startX:clientX, startY:clientY, origX:mesa.x, origY:mesa.y, moved:false };
  };

  const moveDrag = (e:React.TouchEvent|React.MouseEvent) => {
    if (!dragRef.current||!roomRef.current) return;
    const touch = "touches" in e ? e.touches[0] : null;
    if ("touches" in e && !touch) return;
    if ("touches" in e) e.preventDefault();
    const clientX = touch ? touch.clientX : (e as React.MouseEvent).clientX;
    const clientY = touch ? touch.clientY : (e as React.MouseEvent).clientY;
    const drag = dragRef.current;
    const dx = clientX - drag.startX;
    const dy = clientY - drag.startY;
    if (Math.abs(dx)>5||Math.abs(dy)>5) drag.moved = true;
    const roomW = roomRef.current.offsetWidth;
    const newX  = Math.max(TR, Math.min(roomW-TR, drag.origX+dx));
    const newY  = Math.max(TR, Math.min(RoomH-TR, drag.origY+dy));
    const dragId = drag.id;
    setLocalMesas(prev=>prev.map(m=>m.id===dragId?{...m,x:newX,y:newY}:m));
  };

  const endDrag = (mesa:MesaPos) => {
    if (!dragRef.current) return;
    if (!dragRef.current.moved) {
      setSeleccionada(prev=>prev===mesa.numero?null:mesa.numero);
    } else {
      setMesasData({ mesas: localMesas });
    }
    dragRef.current = null;
  };

  return (
    <div style={{ animation:"fadeUp .3s ease" }}>
      <Title icon="🪑" title="Plano de Mesas"/>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:14 }}>
        {[
          {l:"Mesas",     v:localMesas.length,          c:"#c9956a"},
          {l:"Asignados", v:lista.length-sinMesa.length, c:"#6aaa96"},
          {l:"Sin mesa",  v:sinMesa.length,              c:"#e07070"},
        ].map(s=>(
          <Card key={s.l} style={{ padding:12, textAlign:"center" }}>
            <div style={{ fontSize:20, fontWeight:700, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:10, color:"#a07855" }}>{s.l}</div>
          </Card>
        ))}
      </div>

      {/* Sala — plano visual */}
      <Card style={{ padding:8, marginBottom:14 }}>
        <div style={{ marginBottom:8 }}>
          <div style={{ fontSize:11, color:"#a07855", marginBottom:8 }}>Arrastra las mesas · Toca para asignar invitados</div>
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            {([["circular","⬤ Redonda"],["rectangular","▬ Rectangular"],["cuadrada","■ Cuadrada"]] as const).map(([f,l])=>(
              <button key={f} onClick={()=>setFormaAgregar(f)} style={{ flex:1, background:formaAgregar===f?"#c9956a":"#f5e8dc", border:`2px solid ${formaAgregar===f?"#c9956a":"#e8d5c4"}`, borderRadius:8, padding:"6px 4px", fontSize:10, fontWeight:700, color:formaAgregar===f?"#fff":"#a07855", cursor:"pointer", fontFamily:"inherit" }}>{l}</button>
            ))}
            <Btn onClick={addMesa} style={{ padding:"6px 14px", fontSize:12, whiteSpace:"nowrap" }}>+ Agregar</Btn>
          </div>
        </div>
        <div
          ref={roomRef}
          onTouchMove={moveDrag as any}
          onMouseMove={moveDrag as any}
          onTouchEnd={()=>{ if(dragRef.current) setMesasData({mesas:localMesas}); dragRef.current=null; }}
          onMouseUp={()=>{ if(dragRef.current) setMesasData({mesas:localMesas}); dragRef.current=null; }}
          style={{
            width:"100%", height:RoomH,
            background:"#fdf8f3",
            backgroundImage:"radial-gradient(#e8d5c4 1px, transparent 1px)",
            backgroundSize:"22px 22px",
            border:"2px solid #e8d5c4", borderRadius:12,
            position:"relative", overflow:"hidden",
            touchAction:"none", userSelect:"none",
          }}
        >
          {/* Etiqueta entrada */}
          <div style={{ position:"absolute", bottom:6, left:"50%", transform:"translateX(-50%)", fontSize:9, color:"#c4a882", background:"#fff", border:"1px solid #e8d5c4", borderRadius:4, padding:"2px 8px" }}>🚪 ENTRADA</div>

          {localMesas.map(mesa=>{
            const inv    = invDeMesa(mesa.numero);
            const isSel  = seleccionada===mesa.numero;
            const isDrag = dragRef.current?.id===mesa.id;
            const forma  = mesa.forma || "circular";
            const W = forma==="rectangular" ? TR*2+20 : TR*2;
            const H = forma==="rectangular" ? TR*1.2  : TR*2;
            const radius = forma==="circular" ? "50%" : forma==="cuadrada" ? "10px" : "8px";
            const bgSel  = "linear-gradient(135deg,#c9956a,#a07040)";
            return (
              <div
                key={mesa.id}
                onTouchStart={e=>startDrag(e,mesa)}
                onMouseDown={e=>startDrag(e,mesa)}
                onTouchEnd={()=>endDrag(mesa)}
                onMouseUp={()=>endDrag(mesa)}
                style={{
                  position:"absolute",
                  left:mesa.x-W/2, top:mesa.y-H/2,
                  width:W, height:H,
                  borderRadius:radius,
                  background:isSel?bgSel:"#fff",
                  border:`3px solid ${isSel?"#a07040":"#e8d5c4"}`,
                  display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                  cursor:"grab", touchAction:"none",
                  boxShadow: isDrag?"0 8px 24px rgba(180,130,100,.5)":isSel?"0 4px 16px rgba(180,130,100,.3)":"0 2px 8px rgba(180,130,100,.15)",
                  zIndex:isDrag?10:isSel?5:1,
                  transition: isDrag?"none":"box-shadow .15s",
                }}
              >
                <div style={{ fontSize:15, fontWeight:800, color:isSel?"#fff":"#5c3d2e", lineHeight:1 }}>{mesa.numero}</div>
                <div style={{ fontSize:9, color:isSel?"#ffe8d4":"#a07855", marginTop:2 }}>{inv.length} pers.</div>
                {inv.length>0 && (
                  <div style={{ position:"absolute", top:-6, right:-6, width:16, height:16, borderRadius:"50%", background:"#6aaa96", border:"2px solid #fff", fontSize:8, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>{inv.length}</div>
                )}
              </div>
            );
          })}
          {localMesas.length===0 && (
            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", color:"#c4a882", fontSize:13, flexDirection:"column", gap:8 }}>
              <span style={{ fontSize:32 }}>🪑</span>
              <span>Toca "+ Mesa" para agregar</span>
            </div>
          )}
        </div>
      </Card>

      {/* Panel de la mesa seleccionada */}
      {seleccionada!==null && mesaActual && (
        <Card style={{ border:"2px solid #c9956a", marginBottom:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:"#5c3d2e" }}>Mesa {seleccionada}</div>
              <div style={{ fontSize:11, color:"#a07855" }}>{invDeMesa(seleccionada).length} personas asignadas</div>
            </div>
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              <button onClick={()=>eliminarMesa(seleccionada)} style={{ background:"none", border:"none", color:"#e07070", cursor:"pointer", fontSize:12, fontFamily:"inherit" }}>🗑 Eliminar</button>
              <button onClick={()=>setSeleccionada(null)} style={{ background:"none", border:"none", color:"#a07855", cursor:"pointer", fontSize:18 }}>✕</button>
            </div>
          </div>
          {/* Cambiar forma */}
          <div style={{ display:"flex", gap:5, marginBottom:12 }}>
            {([["circular","⬤"],["rectangular","▬"],["cuadrada","■"]] as const).map(([f,l])=>(
              <button key={f} onClick={()=>cambiarForma(mesaActual.id,f)} style={{ flex:1, background:(mesaActual.forma||"circular")===f?"#c9956a":"#f5e8dc", border:`1.5px solid ${(mesaActual.forma||"circular")===f?"#c9956a":"#e8d5c4"}`, borderRadius:7, padding:"5px 4px", fontSize:12, color:(mesaActual.forma||"circular")===f?"#fff":"#a07855", cursor:"pointer", fontFamily:"inherit" }}>{l}</button>
            ))}
          </div>
          <div style={{ fontSize:11, color:"#a07855", marginBottom:10 }}>Toca un invitado para asignar / quitar:</div>
          <div style={{ display:"flex", flexDirection:"column", gap:5, maxHeight:260, overflowY:"auto" }}>
            {lista.map(inv=>{
              const enEsta   = inv.mesa===seleccionada;
              const enOtra   = inv.mesa&&inv.mesa!==seleccionada;
              return (
                <div
                  key={inv.id}
                  onClick={()=>{ if(!enOtra) toggleInvitado(inv.id, seleccionada); }}
                  style={{
                    display:"flex", justifyContent:"space-between", alignItems:"center",
                    padding:"8px 12px", borderRadius:9,
                    background: enEsta?"#f5e8dc":"#fdf8f3",
                    border:`1px solid ${enEsta?"#c9956a":"#f0e0d0"}`,
                    cursor: enOtra?"default":"pointer",
                    opacity: enOtra?.4:1,
                  }}
                >
                  <span style={{ fontSize:12, color:"#5c3d2e" }}>{inv.tipo==="adulto"?"👤":"👶"} {inv.nombre}</span>
                  {enEsta && <span style={{ fontSize:11, color:"#c9956a", fontWeight:700 }}>✓ Aquí</span>}
                  {enOtra && <span style={{ fontSize:10, color:"#a07855" }}>Mesa {inv.mesa}</span>}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Resumen por mesa */}
      {localMesas.length>0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#5c3d2e", marginBottom:4 }}>Resumen</div>
          {localMesas.slice().sort((a,b)=>a.numero-b.numero).map(m=>{
            const inv = invDeMesa(m.numero);
            return (
              <div key={m.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:"#fff", borderRadius:10, border:"1px solid #f0e0d0" }}>
                <span style={{ fontSize:13, fontWeight:700, color:"#5c3d2e" }}>Mesa {m.numero}</span>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  <Badge text={`${inv.length} personas`} color="#c9956a"/>
                  <button onClick={()=>setSeleccionada(m.numero)} style={{ background:"none", border:"1px solid #e8d5c4", borderRadius:6, padding:"3px 8px", fontSize:11, color:"#a07855", cursor:"pointer", fontFamily:"inherit" }}>Ver</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// PRESUPUESTO
// ════════════════════════════════════════════════════════════════
const CATS_GASTO = ["Decoración","Vestuario","Papelería","Recuerdos","Cabina Fotos","Torta","Música","Transporte","Ceremonia","Luna de Miel","Otro"];

function Presupuesto({ gastos, setGastos, proveedores, invitados }: any) {
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

// ════════════════════════════════════════════════════════════════
// PROGRAMA
// ════════════════════════════════════════════════════════════════
const MOMENTOS_DIA = ["Entrada novios","Primer baile","Vals","Baile general","Karaoke","Juegos","Recuerdos","Salida"];
const JUEGOS = ["Tarro del amor","Trivia de la pareja","Baile de la escoba","El rey/reina","Silla musical","Caricatura pareja","Penitencias","Bingo"];

function Programa({ canciones, setCanciones }: { canciones:{canciones:Cancion[]}; setCanciones:(d:any)=>void }) {
  const lista = canciones.canciones || [];
  const [form, setForm] = useState<Partial<Cancion>>({ momento:"Baile general" });
  const [show, setShow] = useState(false);
  const [playerUrl, setPlayerUrl] = useState<string|null>(null);
  const guardar = () => {
    if (!form.titulo) return;
    setCanciones({canciones:[...lista,{id:Date.now(),titulo:form.titulo!,artista:form.artista||"",momento:form.momento||"Baile general",link:form.link||""}]});
    setForm({momento:"Baile general"}); setShow(false);
  };
  const eliminar = (id:number) => setCanciones({canciones:lista.filter(c=>c.id!==id)});

  const toEmbedUrl = (url:string): string|null => {
    const u = url.trim();
    // YouTube
    const ytMatch = u.match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
    // Spotify — acepta cualquier variante de open.spotify.com
    const spMatch = u.match(/spotify\.com\/(?:intl-[a-z]+\/)?(track|album|playlist|artist)\/([a-zA-Z0-9]+)/);
    if (spMatch) return `https://open.spotify.com/embed/${spMatch[1]}/${spMatch[2]}?utm_source=generator&nd=1`;
    return null;
  };
  const linkIcon = (url:string) => url.includes("spotify")?"🎧":url.includes("youtube")||url.includes("youtu.be")?"▶️":"🔗";

  return (
    <div style={{ animation:"fadeUp .3s ease" }}>
      <Title icon="🎵" title="Programa del Día"/>
      <Card style={{ marginBottom:16, background:"#f9f0fb" }}>
        <div style={{ fontSize:13, fontWeight:700, color:"#9b7bb5", marginBottom:10 }}>🎮 Juegos sugeridos</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {JUEGOS.map(j=><span key={j} style={{ background:"#fff", border:"1px solid #d4b8e8", borderRadius:8, padding:"4px 10px", fontSize:11, color:"#9b7bb5" }}>{j}</span>)}
        </div>
      </Card>
      {show && (
        <Card style={{ marginBottom:16, border:"2px solid #e8d5c4" }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#5c3d2e", marginBottom:14 }}>Agregar canción / actividad</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <Inp value={form.titulo||""} onChange={v=>setForm({...form,titulo:v})} placeholder="Título o actividad"/>
            <Inp value={form.artista||""} onChange={v=>setForm({...form,artista:v})} placeholder="Artista (opcional)"/>
            <Sel value={form.momento||"Baile general"} onChange={v=>setForm({...form,momento:v})} options={MOMENTOS_DIA.map(m=>({value:m,label:m}))}/>
            <Inp value={form.link||""} onChange={v=>setForm({...form,link:v})} placeholder="🔗 Link Spotify / YouTube (opcional)"/>
          </div>
          <div style={{ display:"flex", gap:8, marginTop:14 }}>
            <Btn onClick={guardar}>Guardar</Btn>
            <Btn onClick={()=>{setShow(false);setForm({momento:"Baile general"});}} outline>Cancelar</Btn>
          </div>
        </Card>
      )}
      {!show && <Btn onClick={()=>setShow(true)} style={{ marginBottom:16 }}>+ Agregar</Btn>}
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {MOMENTOS_DIA.map(m=>{
          const items = lista.filter(c=>c.momento===m);
          if (!items.length) return null;
          return (
            <Card key={m}>
              <div style={{ fontSize:13, fontWeight:700, color:"#9b7bb5", marginBottom:10 }}>🎵 {m}</div>
              {items.map(c=>(
                <div key={c.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:"1px solid #f5e8dc" }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, color:"#5c3d2e" }}>{c.titulo}</div>
                    {c.artista&&<div style={{ fontSize:11, color:"#a07855" }}>{c.artista}</div>}
                  </div>
                  <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
                    {c.link && (
                      <button onClick={()=>{ const e=toEmbedUrl(c.link!); if(e){setPlayerUrl(e);}else{window.open(c.link,"_blank");} }} style={{ background: toEmbedUrl(c.link)?"#f5e8dc":"#fdf0e8", border:`1px solid ${toEmbedUrl(c.link)?"#e8d5c4":"#f0c080"}`, borderRadius:8, padding:"4px 10px", fontSize:16, cursor:"pointer" }} title={toEmbedUrl(c.link)?"Reproducir en la app":"Abrir en navegador"}>{linkIcon(c.link)}</button>
                    )}
                    <button onClick={()=>eliminar(c.id)} style={{ background:"none", border:"none", color:"#e07070", cursor:"pointer", fontSize:14 }}>🗑</button>
                  </div>
                </div>
              ))}
            </Card>
          );
        })}
        {lista.length===0 && <div style={{ textAlign:"center", color:"#c4a882", padding:32 }}>Agrega canciones y actividades para el gran día</div>}
      </div>

      {/* Reproductor embebido */}
      {playerUrl && (
        <div onClick={()=>setPlayerUrl(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", zIndex:999, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e=>e.stopPropagation()} style={{ width:"100%", maxWidth:480, background:"#1a1a1a", borderRadius:16, overflow:"hidden", boxShadow:"0 8px 40px rgba(0,0,0,.5)" }}>
            <div style={{ display:"flex", justifyContent:"flex-end", padding:"8px 12px", background:"#111" }}>
              <button onClick={()=>setPlayerUrl(null)} style={{ background:"none", border:"none", color:"#fff", fontSize:20, cursor:"pointer", lineHeight:1 }}>✕</button>
            </div>
            <iframe
              src={playerUrl}
              width="100%"
              height={playerUrl.includes("spotify") ? 352 : 280}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              loading="lazy"
              style={{ border:"none", display:"block" }}
              title="Reproductor"
            />
          </div>
          <div style={{ marginTop:12, fontSize:12, color:"rgba(255,255,255,.5)" }}>Toca fuera para cerrar</div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// REGALOS
// ════════════════════════════════════════════════════════════════
function Regalos({ data, setData }: { data:{regalos:Regalo[]}; setData:(d:any)=>void }) {
  const lista = data.regalos || [];
  const [form, setForm] = useState<Partial<Regalo>>({ prioridad:"media", recibido:false });
  const [show, setShow] = useState(false);
  const guardar = () => {
    if (!form.nombre) return;
    setData({regalos:[...lista,{id:Date.now(),nombre:form.nombre!,precio:Number(form.precio)||0,prioridad:form.prioridad||"media",recibido:false,link:form.link||""}]});
    setForm({prioridad:"media",recibido:false}); setShow(false);
  };
  const toggle   = (id:number) => setData({regalos:lista.map(r=>r.id===id?{...r,recibido:!r.recibido}:r)});
  const eliminar = (id:number) => setData({regalos:lista.filter(r=>r.id!==id)});
  const colorP   = (p:string)  => p==="alta"?"#e07070":p==="media"?"#c9956a":"#6aaa96";

  return (
    <div style={{ animation:"fadeUp .3s ease" }}>
      <Title icon="🎁" title="Lista de Regalos"/>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
        <Card style={{ padding:14, textAlign:"center" }}><div style={{ fontSize:22, fontWeight:700, color:"#6aaa96" }}>{lista.filter(r=>r.recibido).length}</div><div style={{ fontSize:11, color:"#a07855" }}>Recibidos</div></Card>
        <Card style={{ padding:14, textAlign:"center" }}><div style={{ fontSize:22, fontWeight:700, color:"#c9956a" }}>{lista.filter(r=>!r.recibido).length}</div><div style={{ fontSize:11, color:"#a07855" }}>Pendientes</div></Card>
      </div>
      {show && (
        <Card style={{ marginBottom:16, border:"2px solid #e8d5c4" }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#5c3d2e", marginBottom:14 }}>Nuevo regalo</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <Inp value={form.nombre||""} onChange={v=>setForm({...form,nombre:v})} placeholder="Nombre del regalo"/>
            <Inp value={form.precio?.toString()||""} onChange={v=>setForm({...form,precio:Number(v)})} placeholder="Precio estimado ($)" type="number"/>
            <Sel value={form.prioridad||"media"} onChange={v=>setForm({...form,prioridad:v as any})} options={[{value:"alta",label:"🔴 Alta"},{value:"media",label:"🟡 Media"},{value:"baja",label:"🟢 Baja"}]}/>
            <Inp value={form.link||""} onChange={v=>setForm({...form,link:v})} placeholder="Link (opcional)"/>
          </div>
          <div style={{ display:"flex", gap:8, marginTop:14 }}>
            <Btn onClick={guardar}>Guardar</Btn>
            <Btn onClick={()=>{setShow(false);setForm({prioridad:"media",recibido:false});}} outline>Cancelar</Btn>
          </div>
        </Card>
      )}
      {!show && <Btn onClick={()=>setShow(true)} style={{ marginBottom:16 }}>+ Agregar regalo</Btn>}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {lista.map(r=>(
          <Card key={r.id} style={{ padding:14, opacity:r.recibido?.6:1 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:"#5c3d2e", textDecoration:r.recibido?"line-through":"none" }}>{r.nombre}</span>
                  <Badge text={r.prioridad} color={colorP(r.prioridad)}/>
                </div>
                {r.precio>0 && <div style={{ fontSize:12, color:"#c9956a" }}>{fmt(r.precio)}</div>}
                {r.link && <a href={r.link} target="_blank" rel="noreferrer" style={{ fontSize:11, color:"#9b7bb5" }}>🔗 Ver</a>}
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={()=>toggle(r.id)} style={{ background:r.recibido?"#e8f5ec":"none", border:`1px solid ${r.recibido?"#6aaa96":"#e8d5c4"}`, borderRadius:6, padding:"4px 8px", fontSize:11, color:r.recibido?"#6aaa96":"#a07855", cursor:"pointer", fontFamily:"inherit" }}>{r.recibido?"✓ Recibido":"¿Recibido?"}</button>
                <button onClick={()=>eliminar(r.id)} style={{ background:"none", border:"none", color:"#e07070", cursor:"pointer", fontSize:14 }}>🗑</button>
              </div>
            </div>
          </Card>
        ))}
        {lista.length===0 && <div style={{ textAlign:"center", color:"#c4a882", padding:32 }}>Agrega cosas a tu lista de regalos 🎁</div>}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// LUNA DE MIEL
// ════════════════════════════════════════════════════════════════
const CATS_LUNA = ["Vuelos","Alojamiento","Actividades","Comidas","Transporte","Seguro","Otro"];

type Destino = "fln" | "bzc";
type Ventana = "dic" | "ene";
type ViajeConfig = {
  id: string; nombre: string; destino: string; fechaSalida: string; fechaRegreso: string;
  noches: number; personas: number; notas: string; creado: string;
};
type ViajesData = { viajes: ViajeConfig[] };

const DESTINOS = {
  fln: {
    nombre: "Florianópolis",
    pais: "Brasil",
    emoji: "🏝️",
    descripcion: "Isla tranquila, verano austral perfecto. Menos masivo, ideal para descanso total.",
    pros: ["Vuelo más corto (3h directa)","Más económica","Verano austral en enero","Playas tranquilas"],
    contras: ["Más enfocada en jóvenes / vida nocturna","Menos romántica que Búzios"],
    perfil: "Económica & Tranquila",
    colorPerfil: "#6aaa96",
  },
  bzc: {
    nombre: "Búzios",
    pais: "Brasil",
    emoji: "🌊",
    descripcion: "El 'St. Tropez de Brasil'. Agua cristalina, ambiente boutique. El destino de pareja por excelencia.",
    pros: ["Más romántica y boutique","Agua cristalina","Ambiente íntimo de pareja","Rua das Pedras al atardecer"],
    contras: ["Más cara","Requiere bus de 2.5h desde Río","Sin vuelo directo"],
    perfil: "Romántica & Premium",
    colorPerfil: "#c9956a",
  },
};

const VENTANAS = {
  dic: {
    label: "20–27 Dic 2026",
    titulo: "Justo después de casarse",
    descripcion: "Sales el 20 de diciembre, un día después de la boda. Celebras Navidad en Brasil.",
    alerta: "Temporada ALTA — precios +50% en todo",
    alertaColor: "#e07070",
    icon: "🎄",
  },
  ene: {
    label: "10–17 Ene 2027",
    titulo: "Luna de miel relajada",
    descripcion: "Disfrutas las fiestas en Chile y sales en enero cuando bajan los precios.",
    alerta: "Precios normalizados — mejor relación calidad/precio",
    alertaColor: "#6aaa96",
    icon: "✨",
  },
};

// Presupuestos reales por combinación (pareja, 7 noches)
const PRESUPUESTOS: Record<Destino, Record<Ventana, {
  vuelos: { min:number; max:number; aerolinea:string; nota:string; links:{label:string;url:string}[] };
  hotel:  { min:number; max:number; tipo:string; recomendado:string; nota:string; links:{label:string;url:string}[] };
  transfer?: { min:number; max:number; nota:string };
  comida: { min:number; max:number; nota:string };
  actividades: { min:number; max:number; nota:string };
  seguro: { min:number; max:number; nota:string };
  incluido: string[];
  noIncluido: string[];
}>> = {
  fln: {
    dic: {
      vuelos:      { min:900000, max:1300000, aerolinea:"LATAM / JetSMART / SKY", nota:"Temporada alta Navidad — comprar en oct 2026", links:[{label:"LATAM",url:"https://www.latamairlines.com/cl/es"},{label:"JetSMART",url:"https://jetsmart.com/cl/es"},{label:"SKY",url:"https://www.skyairline.com/chile"},{label:"Comparar en KAYAK",url:"https://www.kayak.cl/vuelos/Santiago-de-Chile-Aeropuerto-Internacional-Comodoro-Arturo-Merino-Benitez-SCL/Florianopolis-Hercilio-Luz-FLN"}] },
      hotel:       { min:450000, max:700000, tipo:"Pousada boutique 4★", recomendado:"Pousada Villa Rossa o similar", nota:"7 noches. Precio sube 40% en diciembre", links:[{label:"Booking.com Floripa",url:"https://www.booking.com/searchresults.html?ss=Florian%C3%B3polis"},{label:"Airbnb Floripa",url:"https://www.airbnb.cl/s/Florian%C3%B3polis--Brasil/homes"}] },
      comida:      { min:250000, max:320000, nota:"~$36.000/día pareja. Restaurantes frente al mar incluidos" },
      actividades: { min:80000,  max:120000, nota:"Paseo en barco (~$50.000), playas, alquiler bicicleta" },
      seguro:      { min:60000,  max:90000,  nota:"Recomendado: Assist Card o Heymondo con cancelación" },
      incluido:    ["1 maleta bodega 23kg c/u (LATAM Light)","Equipaje de mano 8kg","Check-in online","Desayuno en hotel (pousada boutique)","Wi-Fi en hotel","Piscina"],
      noIncluido:  ["Selección de asiento (LATAM Light: $8-20 USD)","Vuelos de conexión domésticos en Brasil","Excursiones","Cenas en restaurante","Transporte local entre playas"],
    },
    ene: {
      vuelos:      { min:600000, max:900000, aerolinea:"LATAM / JetSMART / SKY", nota:"Mejores precios del año. Comprar en ago-sep 2026", links:[{label:"LATAM",url:"https://www.latamairlines.com/cl/es"},{label:"JetSMART",url:"https://jetsmart.com/cl/es"},{label:"SKY",url:"https://www.skyairline.com/chile"},{label:"Comparar en KAYAK",url:"https://www.kayak.cl/vuelos/Santiago-de-Chile-Aeropuerto-Internacional-Comodoro-Arturo-Merino-Benitez-SCL/Florianopolis-Hercilio-Luz-FLN"}] },
      hotel:       { min:350000, max:530000, tipo:"Pousada boutique 4★", recomendado:"Pousada Villa Rossa o similar", nota:"7 noches. Enero es temporada baja brasileña para turistas internacionales", links:[{label:"Booking.com Floripa",url:"https://www.booking.com/searchresults.html?ss=Florian%C3%B3polis"},{label:"Airbnb Floripa",url:"https://www.airbnb.cl/s/Florian%C3%B3polis--Brasil/homes"}] },
      comida:      { min:220000, max:290000, nota:"~$32.000/día pareja" },
      actividades: { min:70000,  max:100000, nota:"Paseo en barco, snorkeling Lagoa da Conceição, playas" },
      seguro:      { min:60000,  max:90000,  nota:"Recomendado: Assist Card o Heymondo con cancelación" },
      incluido:    ["1 maleta bodega 23kg c/u (LATAM Light)","Equipaje de mano 8kg","Desayuno en pousada","Wi-Fi hotel","Piscina"],
      noIncluido:  ["Selección de asiento","Cenas","Transporte local","Excursiones premium"],
    },
  },
  bzc: {
    dic: {
      vuelos:      { min:1000000, max:1400000, aerolinea:"LATAM vía GIG (Río de Janeiro)", nota:"Temporada alta — vuela a Río, luego bus a Búzios", links:[{label:"LATAM a Río",url:"https://www.latamairlines.com/cl/es"},{label:"SKY a Río",url:"https://www.skyairline.com/chile"},{label:"KAYAK SCL→RIO",url:"https://www.kayak.cl/vuelos/Santiago-de-Chile-Aeropuerto-Internacional-Comodoro-Arturo-Merino-Benitez-SCL/Rio-de-Janeiro-RIO"}] },
      hotel:       { min:700000, max:1100000, tipo:"Hotel boutique 4-5★", recomendado:"Insólito Boutique & Spa", nota:"7 noches. Diciembre es alta temporada en Búzios", links:[{label:"Insólito Hotel",url:"https://www.booking.com/hotel/br/insolito-boutique.html"},{label:"Casas Brancas",url:"https://www.booking.com/hotel/br/casas-brancas-boutique-spa.html"},{label:"Booking Búzios",url:"https://www.booking.com/searchresults.html?ss=B%C3%BAzios"}] },
      transfer:    { min:100000, max:160000, nota:"Bus/transfer privado GIG→Búzios x2. ~2.5h de viaje" },
      comida:      { min:280000, max:360000, nota:"~$40.000/día pareja. Restaurantes frente al mar en Rua das Pedras" },
      actividades: { min:80000,  max:130000, nota:"Escuna por las playas, snorkeling, Rua das Pedras" },
      seguro:      { min:60000,  max:90000,  nota:"Imprescindible para luna de miel. Assist Card con cancelación" },
      incluido:    ["Desayuno en hotel boutique","Piscina con vista al mar","Wi-Fi","Playa privada (Insólito)","Spa acceso (Insólito)"],
      noIncluido:  ["Maleta bodega (agregar online: ~$35-45 USD c/u)","Selección asiento","Transfer aeropuerto","Cenas","Excursiones","Bebidas en hotel"],
    },
    ene: {
      vuelos:      { min:700000, max:1000000, aerolinea:"LATAM vía GIG (Río de Janeiro)", nota:"Post fiestas — los mejores precios del año. Comprar ago-sep 2026", links:[{label:"LATAM a Río",url:"https://www.latamairlines.com/cl/es"},{label:"JetSMART a Río",url:"https://jetsmart.com/cl/es"},{label:"KAYAK SCL→RIO",url:"https://www.kayak.cl/vuelos/Santiago-de-Chile-Aeropuerto-Internacional-Comodoro-Arturo-Merino-Benitez-SCL/Rio-de-Janeiro-RIO"}] },
      hotel:       { min:500000, max:800000, tipo:"Hotel boutique 4★", recomendado:"Insólito Boutique & Spa", nota:"7 noches. Enero tiene mejor disponibilidad y precios que diciembre", links:[{label:"Insólito Hotel",url:"https://www.booking.com/hotel/br/insolito-boutique.html"},{label:"Casas Brancas",url:"https://www.booking.com/hotel/br/casas-brancas-boutique-spa.html"},{label:"Booking Búzios",url:"https://www.booking.com/searchresults.html?ss=B%C3%BAzios"}] },
      transfer:    { min:100000, max:160000, nota:"Bus/transfer privado GIG→Búzios x2. Reservar con anticipación" },
      comida:      { min:250000, max:320000, nota:"~$36.000/día pareja" },
      actividades: { min:70000,  max:110000, nota:"Escuna, snorkeling, paseo a caballo por las playas" },
      seguro:      { min:60000,  max:90000,  nota:"Assist Card o Heymondo. Para luna de miel es imprescindible" },
      incluido:    ["Desayuno en hotel","Piscina","Wi-Fi","Playa privada (Insólito)"],
      noIncluido:  ["Maleta bodega (agregar online)","Selección asiento","Transfer GIG→Búzios","Cenas","Excursiones"],
    },
  },
};


const ITINERARIO_FLN = [
  { dia:"Día 1", plan:"Llegada FLN → check-in → atardecer en Lagoa da Conceição" },
  { dia:"Día 2", plan:"Playa Ferradura — la más cristalina y tranquila de la isla" },
  { dia:"Día 3", plan:"Paseo en barco por las playas del norte" },
  { dia:"Día 4", plan:"Día relax total — spa, piscina, sin agenda" },
  { dia:"Día 5", plan:"Jurerê Internacional — zona más boutique de la isla" },
  { dia:"Día 6", plan:"Cena romántica frente al mar. Última noche" },
  { dia:"Día 7", plan:"Checkout → vuelo de regreso a SCL" },
];

const ITINERARIO_BZC = [
  { dia:"Día 1", plan:"Llegada GIG → transfer 2.5h → check-in Búzios → descanso" },
  { dia:"Día 2", plan:"Playa João Fernandes — agua cristalina, snorkeling natural" },
  { dia:"Día 3", plan:"Escuna por las 27 playas de la península" },
  { dia:"Día 4", plan:"Día en el hotel — spa, playa privada, relax total" },
  { dia:"Día 5", plan:"Playa Ferradurinha — la más pintoresca de Búzios" },
  { dia:"Día 6", plan:"Atardecer en Rua das Pedras + cena romántica frente al mar" },
  { dia:"Día 7", plan:"Checkout → transfer GIG → vuelo de regreso" },
];

type Paquete = {
  id: string; destino: string; ventana: string; aerolinea: string; hotel: string;
  categoria_hotel: string; pension: string; fecha_salida: string; fecha_regreso: string;
  noches: number; precio_persona: number|null; precio_pareja: number|null;
  ahorro_vs_separado: number|null; incluye: string[]; no_incluye: string[];
  fuente: string; url: string; es_oferta: boolean; disponible: boolean; notas: string;
};
type PaquetesData = {
  paquetes: Paquete[]; resumen: string; mejor_opcion: string|null;
  fecha_consulta: string; error?: boolean;
};

function useViajesConfig() {
  const [data, setData] = useState<ViajesData>({ viajes: [] });
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "boda", "viajes_config"), snap => {
      if (snap.exists()) setData(snap.data() as ViajesData);
      else setData({ viajes: [] });
    });
    return unsub;
  }, []);
  const guardar = async (nuevo: ViajesData) => {
    setData(nuevo);
    await setDoc(doc(db, "boda", "viajes_config"), nuevo);
  };
  return { data, guardar };
}

function usePaquetes(): Record<string, PaquetesData> {
  const [data, setData] = useState<Record<string, PaquetesData>>({});
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "boda", "paquetes"), snap => {
      if (snap.exists()) setData(snap.data() as Record<string, PaquetesData>);
    });
    return unsub;
  }, []);
  return data;
}

function PaqueteCard({ p, mejorId }: { p: Paquete; mejorId: string|null }) {
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

function useBusquedaPendiente(): { pendiente: boolean; ts: string|null } {
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

function PaquetesTab({ viajeId, viaje, onBuscarAhora }: { viajeId: string|null; viaje: ViajeConfig|null; onBuscarAhora: (id: string) => void }) {
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

function PresupuestoViaje({ viaje, paquetes, mejorPaqueteId, selectedId, onSelectId, lista, onAgregar }: {
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

// ── Departamentos (búsqueda automática diaria por el bot check_deptos.py) ──
type Depto = {
  id: string; proyecto: string; inmobiliaria: string; comuna: string; direccion: string;
  cerca_metro: string|null; etapa: string; fecha_entrega: string|null;
  dormitorios: number|string; banos: number|null; m2: number|string|null;
  precio_desde_uf: number|null; subsidio: string|null; amenidades: string[];
  fuente: string; url: string|null; calza_presupuesto: boolean; disponible: boolean; notas: string;
};
type DeptosData = { departamentos: Depto[]; resumen: string; mejor_opcion: string|null; fecha_consulta: string; error?: boolean };

function useDepartamentos(): DeptosData|null {
  const [data, setData] = useState<DeptosData|null>(null);
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "boda", "departamentos"), snap => {
      if (snap.exists()) setData(snap.data() as DeptosData);
      else setData({ departamentos: [], resumen: "", mejor_opcion: null, fecha_consulta: "" });
    });
    return unsub;
  }, []);
  return data;
}

function DeptoCard({ d, mejorId }: { d: Depto; mejorId: string|null }) {
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

function Departamentos() {
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

function LunaMiel({ data, setData }: { data:{items:LunaItem[]}; setData:(d:any)=>void }) {
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
    await setDoc(doc(db, "boda", "config_busqueda"), {
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

// ════════════════════════════════════════════════════════════════
// DECORACIONES
// ════════════════════════════════════════════════════════════════
const CATS_DECO = ["Flores","Centros de mesa","Iluminación","Arcos y estructuras","Telas y manteles","Detalles","Otro"];

function Decoraciones({ data, setData }: { data:{items:DecoItem[]}; setData:(d:any)=>void }) {
  const lista = data.items || [];
  const [show, setShow]     = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const [form, setForm]     = useState<Partial<DecoItem>>({ categoria:"Flores", cantidad:1, comprado:false });
  const [subiendo, setSubiendo] = useState(false);
  const [preview, setPreview]   = useState<string|null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const totalEst    = lista.reduce((s,i)=>s+i.precio*i.cantidad,0);
  const comprados   = lista.filter(i=>i.comprado).length;

  const comprimir = (file: File): Promise<Blob> => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 1080;
      const ratio = Math.min(MAX / img.naturalWidth, MAX / img.naturalHeight, 1);
      const w = Math.max(1, Math.round(img.naturalWidth * ratio));
      const h = Math.max(1, Math.round(img.naturalHeight * ratio));
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas no disponible")); return; }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(b => b ? resolve(b) : reject(new Error("toBlob falló")), "image/jpeg", 0.80);
    };
    img.onerror = () => reject(new Error("No se pudo cargar la imagen"));
    img.src = URL.createObjectURL(file);
  });

  const subirFoto = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setSubiendo(true);
    try {
      const blob  = await comprimir(files[0]);
      const nombre = `deco_${Date.now()}.jpg`;
      const r = ref(stor, `decoraciones-boda/${nombre}`);
      await uploadBytes(r, blob, { contentType:"image/jpeg" });
      const url = await getDownloadURL(r);
      setForm(f => ({ ...f, foto: url }));
    } catch(e:any) { alert("Error al subir foto: " + e.message); }
    finally { setSubiendo(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const guardar = () => {
    if (!form.nombre) return;
    const item: DecoItem = {
      id:        editId ?? Date.now(),
      nombre:    form.nombre!,
      categoria: form.categoria || "Flores",
      cantidad:  Number(form.cantidad) || 1,
      precio:    Number(form.precio)   || 0,
      foto:      form.foto || "",
      videoUrl:  form.videoUrl || "",
      notas:     form.notas || "",
      comprado:  form.comprado || false,
    };
    if (editId !== null) {
      setData({ items: lista.map(i => i.id === editId ? item : i) });
    } else {
      setData({ items: [...lista, item] });
    }
    setForm({ categoria:"Flores", cantidad:1, comprado:false });
    setEditId(null); setShow(false);
  };

  const abrirEditar = (i: DecoItem) => {
    setForm({ ...i }); setEditId(i.id); setShow(true);
  };

  const eliminar = (id: number) => {
    if (!window.confirm("¿Eliminar este ítem?")) return;
    setData({ items: lista.filter(i => i.id !== id) });
  };

  const toggleComprado = (id: number) =>
    setData({ items: lista.map(i => i.id === id ? { ...i, comprado: !i.comprado } : i) });

  // ── Lo que se necesita para montar cada decoración ──
  const mapChecks = (itemId:number, fn:(cs:DecoCheck[])=>DecoCheck[]) =>
    setData({ items: lista.map(i => i.id === itemId ? { ...i, checks: fn(i.checks || []) } : i) });
  const addCheck    = (itemId:number) => mapChecks(itemId, cs => [...cs, { id:Date.now(), texto:"", listo:false }]);
  const toggleCheck = (itemId:number, cid:number) => mapChecks(itemId, cs => cs.map(c => c.id===cid ? {...c, listo:!c.listo} : c));
  const textoCheck  = (itemId:number, cid:number, t:string) => mapChecks(itemId, cs => cs.map(c => c.id===cid ? {...c, texto:t} : c));
  const delCheck    = (itemId:number, cid:number) => mapChecks(itemId, cs => cs.filter(c => c.id!==cid));

  return (
    <div style={{ animation:"fadeUp .3s ease" }}>
      <Title icon="🌸" title="Decoraciones"/>

      {/* Resumen */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
        <Card style={{ padding:14, textAlign:"center" }}>
          <div style={{ fontSize:22, fontWeight:700, color:"#c9956a" }}>{fmt(totalEst)}</div>
          <div style={{ fontSize:11, color:"#a07855" }}>Presupuesto estimado</div>
        </Card>
        <Card style={{ padding:14, textAlign:"center" }}>
          <div style={{ fontSize:22, fontWeight:700, color:"#6aaa96" }}>{comprados}/{lista.length}</div>
          <div style={{ fontSize:11, color:"#a07855" }}>Comprados</div>
        </Card>
      </div>

      {/* Formulario */}
      {show && (
        <Card style={{ marginBottom:16, border:"2px solid #e8d5c4" }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#5c3d2e", marginBottom:14 }}>
            {editId !== null ? "Editar ítem" : "Nuevo ítem"}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div>
              <div style={{ fontSize:10, color:"#a07855", fontWeight:600, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>Nombre *</div>
              <Inp value={form.nombre||""} onChange={v=>setForm({...form,nombre:v})} placeholder="Ej: Rosas blancas"/>
            </div>
            <div>
              <div style={{ fontSize:10, color:"#a07855", fontWeight:600, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>Categoría</div>
              <Sel value={form.categoria||"Flores"} onChange={v=>setForm({...form,categoria:v})} options={CATS_DECO.map(c=>({value:c,label:c}))}/>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              <div>
                <div style={{ fontSize:10, color:"#a07855", fontWeight:600, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>Cantidad</div>
                <Inp value={form.cantidad?.toString()||"1"} onChange={v=>setForm({...form,cantidad:Number(v)})} placeholder="1" type="number"/>
              </div>
              <div>
                <div style={{ fontSize:10, color:"#a07855", fontWeight:600, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>Precio aprox ($)</div>
                <Inp value={form.precio?.toString()||""} onChange={v=>setForm({...form,precio:Number(v)})} placeholder="0" type="number"/>
              </div>
            </div>
            <div>
              <div style={{ fontSize:10, color:"#a07855", fontWeight:600, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>Foto de referencia</div>
              {form.foto && (
                <div style={{ position:"relative", marginBottom:8 }}>
                  <img src={form.foto} alt="ref" style={{ width:"100%", maxHeight:180, objectFit:"cover", borderRadius:10, border:"1.5px solid #e8d5c4" }}/>
                  <button onClick={()=>setForm({...form,foto:""})} style={{ position:"absolute", top:6, right:6, background:"rgba(0,0,0,.55)", border:"none", borderRadius:6, color:"#fff", fontSize:12, cursor:"pointer", padding:"2px 7px" }}>✕</button>
                </div>
              )}
              <button onClick={()=>fileRef.current?.click()} disabled={subiendo}
                style={{ width:"100%", background:"#fdf8f3", border:"1.5px dashed #c9956a", borderRadius:9, padding:"10px", fontSize:12, color:"#c9956a", cursor:"pointer", fontFamily:"inherit", opacity:subiendo?.6:1 }}>
                {subiendo ? "Subiendo..." : form.foto ? "📷 Cambiar foto" : "📷 Agregar foto desde teléfono"}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={e=>subirFoto(e.target.files)} style={{ display:"none" }}/>
            </div>
            <div>
              <div style={{ fontSize:10, color:"#a07855", fontWeight:600, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>Link de YouTube o TikTok</div>
              <Inp value={form.videoUrl||""} onChange={v=>setForm({...form,videoUrl:v})} placeholder="https://youtu.be/... o tiktok.com/..."/>
            </div>
            <div>
              <div style={{ fontSize:10, color:"#a07855", fontWeight:600, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>Notas</div>
              <textarea value={form.notas||""} onChange={e=>setForm({...form,notas:e.target.value})} placeholder="Color, tamaño, dónde comprarlo..." rows={2}
                style={{ width:"100%", background:"#fdf8f3", border:"1.5px solid #e8d5c4", borderRadius:9, padding:"9px 12px", fontSize:12, color:"#5c3d2e", fontFamily:"inherit", outline:"none", resize:"none", boxSizing:"border-box" as any }}/>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <Btn onClick={guardar} style={{ flex:2 }}>💾 Guardar</Btn>
              <Btn outline onClick={()=>{ setShow(false); setEditId(null); setForm({ categoria:"Flores", cantidad:1, comprado:false }); }} style={{ flex:1 }}>Cancelar</Btn>
            </div>
          </div>
        </Card>
      )}

      {!show && <Btn onClick={()=>setShow(true)} style={{ marginBottom:16 }}>+ Agregar ítem</Btn>}

      {/* Lista por categoría */}
      {lista.length === 0 && (
        <div style={{ textAlign:"center", color:"#c4a882", padding:32 }}>Empieza a armar tu lista de decoraciones 🌸</div>
      )}

      {CATS_DECO.map(cat => {
        const items = lista.filter(i => i.categoria === cat);
        if (!items.length) return null;
        return (
          <div key={cat} style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#c9956a", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.08em" }}>{cat}</div>
            {items.map(item => {
              const vi = getVideoInfo(item.videoUrl || "");
              const opacidad = item.comprado ? 0.7 : 1;
              return (
                <Card key={item.id} style={{ marginBottom:10, opacity:opacidad, borderLeft:`3px solid ${item.comprado?"#6aaa96":"#e8d5c4"}` }}>
                  {/* Foto */}
                  {!!item.foto && (
                    <img src={item.foto} alt={item.nombre} onClick={()=>setPreview(item.foto as string)}
                      style={{ width:"100%", maxHeight:200, objectFit:"cover", borderRadius:10, marginBottom:10, cursor:"pointer", display:"block" }}/>
                  )}
                  {/* Video: YouTube con thumbnail */}
                  {vi && vi.tipo === "youtube" && vi.id && (
                    <a href={vi.url} target="_blank" rel="noreferrer" style={{ display:"block", position:"relative", marginBottom:10, borderRadius:10, overflow:"hidden", textDecoration:"none" }}>
                      <img src={`https://img.youtube.com/vi/${vi.id}/mqdefault.jpg`} alt="YouTube" style={{ width:"100%", display:"block", borderRadius:10 }}/>
                      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,.35)", borderRadius:10 }}>
                        <div style={{ width:48, height:48, background:"#ff0000", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <div style={{ width:0, height:0, borderTop:"10px solid transparent", borderBottom:"10px solid transparent", borderLeft:"18px solid #fff", marginLeft:4 }}/>
                        </div>
                      </div>
                      <div style={{ position:"absolute", bottom:8, left:10, fontSize:10, color:"#fff", fontWeight:700, background:"rgba(0,0,0,.5)", padding:"2px 6px", borderRadius:6 }}>Ver en YouTube ↗</div>
                    </a>
                  )}
                  {/* Video: TikTok u otro link */}
                  {vi && vi.tipo !== "youtube" && (
                    <a href={vi.url} target="_blank" rel="noreferrer"
                      style={{ display:"flex", alignItems:"center", gap:8, background:vi.tipo==="tiktok"?"#010101":"#f0f0f0", borderRadius:10, padding:"10px 14px", marginBottom:10, textDecoration:"none" }}>
                      <span style={{ fontSize:22 }}>{vi.tipo==="tiktok"?"🎵":"🔗"}</span>
                      <div>
                        <div style={{ fontSize:12, fontWeight:700, color:vi.tipo==="tiktok"?"#fff":"#333" }}>{vi.tipo==="tiktok"?"Ver en TikTok ↗":"Ver referencia ↗"}</div>
                        <div style={{ fontSize:10, color:vi.tipo==="tiktok"?"#aaa":"#888", marginTop:1 }}>Abre en Safari</div>
                      </div>
                    </a>
                  )}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"#5c3d2e", textDecoration:item.comprado?"line-through":"none", marginBottom:2 }}>{item.nombre}</div>
                      <div style={{ display:"flex", gap:8, flexWrap:"wrap" as any, alignItems:"center", marginBottom:4 }}>
                        {item.cantidad > 1 && <span style={{ fontSize:11, color:"#a07855" }}>×{item.cantidad}</span>}
                        {item.precio > 0 && <span style={{ fontSize:12, fontWeight:700, color:"#c9956a" }}>{fmt(item.precio * item.cantidad)}</span>}
                        {item.precio > 0 && item.cantidad > 1 && <span style={{ fontSize:10, color:"#c4a882" }}>({fmt(item.precio)} c/u)</span>}
                      </div>
                      {item.notas && <div style={{ fontSize:11, color:"#a07855" }}>{item.notas}</div>}
                    </div>
                    <div style={{ display:"flex", gap:5, flexShrink:0, marginLeft:8 }}>
                      <button onClick={()=>toggleComprado(item.id)}
                        style={{ background:item.comprado?"#e8f5ec":"none", border:`1px solid ${item.comprado?"#6aaa96":"#e8d5c4"}`, borderRadius:6, padding:"4px 7px", fontSize:11, color:item.comprado?"#6aaa96":"#a07855", cursor:"pointer", fontFamily:"inherit" }}>
                        {item.comprado?"✓":"Comprar"}
                      </button>
                      <button onClick={()=>abrirEditar(item)} style={{ background:"#fdf0e8", border:"none", borderRadius:6, padding:"4px 7px", fontSize:12, cursor:"pointer" }}>✏️</button>
                      <button onClick={()=>eliminar(item.id)} style={{ background:"#fef2f2", border:"none", borderRadius:6, padding:"4px 7px", fontSize:12, cursor:"pointer" }}>🗑️</button>
                    </div>
                  </div>

                  {/* Lo que hace falta para montar esta decoración. Solo aparece si tiene checks;
                      el botón de agregar queda siempre, discreto. */}
                  {(() => {
                    const cs = item.checks || [];
                    const ok = cs.filter(c=>c.listo).length;
                    return (
                      <div style={{ marginTop:10, paddingTop:9, borderTop:"1px solid #f4e6d8" }}>
                        {cs.length > 0 && (
                          <>
                            <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:6 }}>
                              <span style={{ fontSize:10, fontWeight:800, color:"#a07855", letterSpacing:"0.04em" }}>QUÉ NECESITO</span>
                              <span style={{ fontSize:10, fontWeight:800, color:ok===cs.length?"#6aaa96":"#c9956a" }}>{ok}/{cs.length}</span>
                              <div style={{ flex:1, height:5, background:"#f4e6d8", borderRadius:3, overflow:"hidden" }}>
                                <div style={{ height:"100%", width:`${Math.round(ok/cs.length*100)}%`, background:ok===cs.length?"#6aaa96":"#c9956a", borderRadius:3, transition:"width .3s ease" }}/>
                              </div>
                            </div>
                            {cs.map(c=>(
                              <div key={c.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 0" }}>
                                <button onClick={()=>toggleCheck(item.id, c.id)}
                                  style={{ width:22, height:22, flexShrink:0, borderRadius:7, cursor:"pointer", background:c.listo?"#6aaa96":"#fff", border:`2px solid ${c.listo?"#6aaa96":"#e8d5c4"}`, color:"#fff", fontSize:12, fontWeight:900, lineHeight:1, fontFamily:"inherit", padding:0 }}>{c.listo?"✓":""}</button>
                                <input value={c.texto} onChange={e=>textoCheck(item.id, c.id, e.target.value)} placeholder="Ej: trípode, flores, cuadro…"
                                  style={{ flex:1, minWidth:0, border:"none", background:"transparent", fontSize:12, color:c.listo?"#c4a882":"#6b4423", textDecoration:c.listo?"line-through":"none", fontFamily:"inherit", outline:"none", padding:0 }}/>
                                <button onClick={()=>delCheck(item.id, c.id)}
                                  style={{ background:"none", border:"none", color:"#e0c0a0", fontSize:14, cursor:"pointer", padding:"0 2px", fontFamily:"inherit", flexShrink:0 }}>✕</button>
                              </div>
                            ))}
                          </>
                        )}
                        <button onClick={()=>addCheck(item.id)}
                          style={{ marginTop:cs.length?6:0, background:"none", border:"none", color:"#c9956a", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", padding:"3px 0" }}>
                          + Añadir check
                        </button>
                      </div>
                    );
                  })()}
                </Card>
              );
            })}
          </div>
        );
      })}

      {/* Preview foto */}
      {preview && (
        <div onClick={()=>setPreview(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.85)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <img src={preview} alt="preview" style={{ maxWidth:"100%", maxHeight:"90vh", borderRadius:12, objectFit:"contain" }}/>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// FOTOS
// ════════════════════════════════════════════════════════════════
function Fotos({ esAdmin }: { esAdmin:boolean }) {
  const [fotos, setFotos]       = useState<Foto[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState("");
  const [preview, setPreview]   = useState<string|null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [cargando, setCargando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      const r = await listAll(ref(stor, "fotos-boda"));
      const urls = await Promise.all(r.items.map(async it=>({ url:await getDownloadURL(it), nombre:it.name })));
      setFotos(urls.reverse());
    } catch(e:any) {
      console.error(e);
      setProgreso(`❌ Error al cargar: ${e?.message||"sin acceso"}`);
      setTimeout(()=>setProgreso(""),5000);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { if (esAdmin) cargar(); }, [esAdmin]);

  const withTimeout = <T,>(p: Promise<T>, ms=30000): Promise<T> =>
    Promise.race([p, new Promise<T>((_,reject)=>setTimeout(()=>reject(new Error(`Tiempo agotado — revisa las reglas de Firebase Storage`)),ms))]);

  const comprimir = (file: File): Promise<Blob> => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 1280;
      const ratio = Math.min(MAX / img.naturalWidth, MAX / img.naturalHeight, 1);
      const w = Math.max(1, Math.round(img.naturalWidth * ratio));
      const h = Math.max(1, Math.round(img.naturalHeight * ratio));
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas no disponible")); return; }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(b => {
        if (b) {
          console.log(`Compresión: ${(file.size/1024/1024).toFixed(2)}MB → ${(b.size/1024/1024).toFixed(2)}MB (${w}x${h})`);
          resolve(b);
        } else {
          reject(new Error("toBlob falló"));
        }
      }, "image/jpeg", 0.78);
    };
    img.onerror = () => reject(new Error("No se pudo cargar la imagen"));
    img.src = URL.createObjectURL(file);
  });

  const subir = async (files:FileList|null) => {
    if (!files||!files.length) return;
    setSubiendo(true);
    try {
      let n=0;
      for (const f of Array.from(files)) {
        setProgreso(`Comprimiendo ${++n}/${files.length}...`);
        const blob = await comprimir(f);
        const orig = (f.size/1024/1024).toFixed(1);
        const comp = (blob.size/1024/1024).toFixed(1);
        setProgreso(`Subiendo ${n}/${files.length}... ${orig}MB → ${comp}MB`);
        const nombre = `${Date.now()}_${f.name.replace(/\.[^.]+$/, "")}.jpg`;
        await withTimeout(uploadBytes(ref(stor,`fotos-boda/${nombre}`), blob, { contentType:"image/jpeg" }));
      }
      setProgreso("¡Fotos subidas! 🎉");
      if (esAdmin) await cargar();
      setTimeout(()=>setProgreso(""),3000);
    } catch(e:any) {
      setProgreso(`❌ ${e?.message||"No se pudo subir"}`);
      setTimeout(()=>setProgreso(""),6000);
    } finally {
      setSubiendo(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div style={{ animation:"fadeUp .3s ease" }}>
      <Title icon="📷" title={esAdmin?"Galería de fotos":"Subir fotos"}/>
      <Card style={{ marginBottom:16, textAlign:"center", border:"2px dashed #e8d5c4", background:"#fdf8f3" }}>
        <div style={{ fontSize:36, marginBottom:8 }}>📸</div>
        <div style={{ fontSize:14, color:"#5c3d2e", fontWeight:700, marginBottom:4 }}>{esAdmin?"Agregar fotos a la galería":"Comparte tus fotos de la boda"}</div>
        <div style={{ fontSize:12, color:"#a07855", marginBottom:16 }}>Selecciona una o varias fotos desde tu teléfono</div>
        <Btn color="#c9956a" onClick={()=>!subiendo&&fileRef.current?.click()}>{subiendo?progreso||"Subiendo...":"📁 Elegir fotos"}</Btn>
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={e=>subir(e.target.files)} style={{ display:"none" }} disabled={subiendo}/>
        {progreso && <div style={{ marginTop:12, fontSize:13, color:"#6aaa96", fontWeight:700 }}>{progreso}</div>}
      </Card>
      {esAdmin && (
        <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ fontSize:13, color:"#a07855" }}>{fotos.length} fotos</div>
            <button onClick={cargar} disabled={cargando} style={{ background:"none", border:"none", color:"#c9956a", fontSize:12, cursor:"pointer", fontFamily:"inherit", opacity:cargando?.5:1 }}>{cargando?"⏳ Cargando...":"🔄 Actualizar"}</button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }}>
            {fotos.map(f=>(
              <div key={f.nombre} style={{ position:"relative", borderRadius:10, overflow:"hidden", aspectRatio:"1", border:"2px solid #f0e0d0" }}>
                <img src={f.url} alt={f.nombre} onClick={()=>setPreview(f.url)} style={{ width:"100%", height:"100%", objectFit:"cover", cursor:"pointer", display:"block" }}/>
                <button
                  onClick={async()=>{
                    if (!window.confirm("¿Eliminar esta foto?")) return;
                    try {
                      await deleteObject(ref(stor, `fotos-boda/${f.nombre}`));
                      setFotos(prev=>prev.filter(x=>x.nombre!==f.nombre));
                    } catch(e:any){ alert("Error al eliminar: "+e.message); }
                  }}
                  style={{ position:"absolute", top:4, right:4, background:"rgba(0,0,0,.55)", border:"none", borderRadius:6, color:"#fff", fontSize:13, cursor:"pointer", padding:"2px 6px", lineHeight:1.4 }}
                >🗑</button>
              </div>
            ))}
          </div>
          {fotos.length===0 && <div style={{ textAlign:"center", color:"#c4a882", padding:32 }}>Aún no hay fotos. ¡Comparte el QR!</div>}

          {/* QR integrado para admin */}
          <Card style={{ marginTop:16, textAlign:"center", background:"#fdf8f3" }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#5c3d2e", marginBottom:8 }}>📱 QR para invitados</div>
            <div style={{ fontSize:11, color:"#a07855", marginBottom:12 }}>Muestra este QR en la boda para que los invitados suban fotos</div>
            <div style={{ background:"#fff", border:"6px solid #f5e8dc", borderRadius:14, padding:16, display:"inline-block", marginBottom:10 }}>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.origin+"?fotos=1")}&bgcolor=ffffff&color=5c3d2e`} alt="QR" style={{ width:180, height:180, display:"block" }}/>
            </div>
            <div style={{ fontSize:11, color:"#c4a882" }}>Código: <strong style={{ color:"#c9956a" }}>{FOTOS_PIN}</strong></div>
          </Card>
        </>
      )}
      {preview && (
        <div onClick={()=>setPreview(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.85)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <img src={preview} alt="preview" style={{ maxWidth:"100%", maxHeight:"90vh", borderRadius:12, objectFit:"contain" }}/>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// QR INVITADOS
// ════════════════════════════════════════════════════════════════
function QRInvitados() {
  const url = window.location.origin + "?fotos=1";
  return (
    <div style={{ animation:"fadeUp .3s ease" }}>
      <Title icon="📱" title="QR para invitados"/>
      <Card style={{ textAlign:"center" }}>
        <div style={{ fontSize:13, color:"#a07855", marginBottom:16 }}>Muestra este QR en la boda para que los invitados suban fotos</div>
        <div style={{ background:"#fff", border:"8px solid #f5e8dc", borderRadius:16, padding:20, display:"inline-block", marginBottom:16 }}>
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=5c3d2e`} alt="QR" style={{ width:200, height:200, display:"block" }}/>
        </div>
        <div style={{ fontSize:11, color:"#c4a882", marginBottom:12 }}>Código invitados: <strong style={{ color:"#c9956a" }}>{FOTOS_PIN}</strong></div>
        <div style={{ fontSize:12, color:"#a07855", background:"#fdf8f3", padding:12, borderRadius:10, border:"1px solid #f0e0d0" }}>
          Los invitados solo podrán subir fotos. Sin acceso a ninguna otra sección.
        </div>
      </Card>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// CHECKLIST
// ════════════════════════════════════════════════════════════════
type Tarea = { id:number; titulo:string; categoria:string; hecho:boolean; prioridad:"alta"|"media"|"baja"; fecha?:string; notas?:string; };

const CATS_CHECK   = ["Boda Civil","Matrimonio","Vestimenta","Decoración","Catering","Música","Fotografía","Trámites","Invitados","Luna de miel","Otro"];
const PRIO_COLOR   = { alta:"#e8544a", media:"#e8a94a", baja:"#6ab04c" };
const PRIO_LABEL   = { alta:"Alta", media:"Media", baja:"Baja" };

function CheckList() {
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

// ════════════════════════════════════════════════════════════════
// BODA CIVIL
// ════════════════════════════════════════════════════════════════
type CivilInvitado = { id:number; nombre:string; confirmado:boolean; notas?:string; };
// `monto` = importe total del ítem (lo normal: "Decoración $50.000"). Los campos
// cantidad/precioPorUnidad quedan opcionales, solo para lo que sí se calcula por kg o
// por persona; los ítems viejos siguen funcionando porque el total cae a cantidad×precio.
// `listo` es el tilde: sirve para ir marcando lo que ya está comprado.
type CivilGasto    = { id:number; categoria:string; descripcion:string; cantidad:number; unidad:string; precioPorUnidad:number; notas?:string; monto?:number; listo?:boolean; };
type CivilItem     = { id:number; texto:string; listo:boolean; fotos?:string[] };    // decoración y tips
type CivilHora     = { id:number; hora:string; actividad:string };                  // cronograma del día
type CivilTarea    = { id:number; cuando:string; texto:string; listo:boolean; fotos?:string[] };  // checklist por plazo
type CivilData     = { invitados:CivilInvitado[]; gastos:CivilGasto[]; deco?:CivilItem[]; cronograma?:CivilHora[]; tips?:CivilItem[]; tareas?:CivilTarea[]; lunaHechos?:string[] };
// Total de un ítem: si tiene monto, manda el monto; si no, cantidad × precio unitario.
const totalGasto = (g:CivilGasto) => (g.monto != null && g.monto > 0) ? g.monto : (Number(g.cantidad)||0)*(Number(g.precioPorUnidad)||0);
// Comprime una imagen antes de subirla (las fotos del celular pesan varios MB).
const comprimirImg = (file: File): Promise<Blob> => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => {
    const MAX = 1280;
    const r = Math.min(MAX/img.naturalWidth, MAX/img.naturalHeight, 1);
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(img.naturalWidth*r));
    c.height = Math.max(1, Math.round(img.naturalHeight*r));
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    c.toBlob(b => b ? resolve(b) : reject(new Error("No se pudo procesar la imagen")), "image/jpeg", 0.82);
    URL.revokeObjectURL(img.src);
  };
  img.onerror = () => reject(new Error("No se pudo cargar la imagen"));
  img.src = URL.createObjectURL(file);
});
const PLAZOS_CIVIL = ["2 meses antes","1 mes antes","1 semana antes","2 días antes","El día anterior","El día"];

const CATS_CIVIL  = ["Lugar","Carnes","Acompañamientos","Pan","Bebidas","Alcohol","Picoteo","Torta","Insumos","Desechables","Decoración","Servicios","Otro"];
const UNIDS_CIVIL = ["kg","lt","unid","persona","porción","hora"];

const CAT_ICON_CIVIL: Record<string,string> = {
  "Lugar":"🏡","Carnes":"🥩","Acompañamientos":"🥗","Pan":"🥖","Bebidas":"🥤","Alcohol":"🍷",
  "Picoteo":"🧀","Torta":"🎂","Insumos":"🔥","Desechables":"🧻","Decoración":"🎀","Servicios":"👨‍🍳","Otro":"📦"
};

// Sugerencia base (40 personas, Chile). Se carga con un botón y después se edita todo:
// textos, montos y cantidades. No pisa nada de lo que ya haya cargado.
const SUG_GASTOS_CIVIL: {categoria:string; descripcion:string; monto:number; notas?:string}[] = [
  { categoria:"Carnes",          descripcion:"Carnes",                     monto:220000, notas:"20–21 kg" },
  { categoria:"Acompañamientos", descripcion:"Ensaladas y acompañamientos",monto:70000 },
  { categoria:"Pan",             descripcion:"Pan",                        monto:18000 },
  { categoria:"Bebidas",         descripcion:"Bebidas y agua",             monto:45000, notas:"Formato 3 L sale más barato" },
  { categoria:"Alcohol",         descripcion:"Cervezas, vinos y espumantes",monto:120000, notas:"El vino por caja tiene descuento" },
  { categoria:"Picoteo",         descripcion:"Picoteo",                    monto:45000 },
  { categoria:"Torta",           descripcion:"Torta",                      monto:80000 },
  { categoria:"Insumos",         descripcion:"Carbón e hielo",             monto:30000 },
  { categoria:"Desechables",     descripcion:"Desechables y servilletas",  monto:35000 },
  { categoria:"Decoración",      descripcion:"Decoración",                 monto:50000 },
];
const SUG_DECO_CIVIL = [
  "Manteles de lino o color crudo",
  "Flores de estación en frascos de vidrio reciclados",
  "Guirnaldas de luces cálidas",
  "Caminos de mesa de yute",
  "Carteles de madera o acrílico",
  "Velas LED para la tarde",
  "Rincón de fotos con arco de madera y flores",
];
const SUG_CRONO_CIVIL = [
  ["13:00","Recepción con jugos, bebidas y picoteo"],
  ["14:00","Comienza el asado"],
  ["15:00","Almuerzo"],
  ["16:30","Brindis y palabras"],
  ["17:00","Torta y café"],
  ["17:30","Fotos y juegos"],
  ["18:30","Música y baile"],
  ["20:00","Cierre"],
];
const SUG_TIPS_CIVIL = [
  "Comprar la carne en carnicería mayorista o a un distribuidor",
  "Preferir bebidas en formato de 3 L",
  "Hacer nosotros el pebre y las ensaladas",
  "Arrendar la vajilla: suele lucir mejor que los desechables y la diferencia es poca",
  "Comprar el vino por caja, que tiene descuento",
];
const SUG_TAREAS_CIVIL: [string,string][] = [
  ["2 meses antes","Reservar el lugar"],
  ["2 meses antes","Definir el menú"],
  ["2 meses antes","Hacer la lista de invitados"],
  ["1 mes antes","Comprar decoración"],
  ["1 mes antes","Encargar la torta"],
  ["1 mes antes","Confirmar asistencia"],
  ["1 semana antes","Comprar bebidas y productos no perecibles"],
  ["1 semana antes","Revisar mesas, sillas y parrilla"],
  ["2 días antes","Comprar la carne"],
  ["2 días antes","Comprar verduras y pan"],
  ["2 días antes","Preparar adobos y aliños"],
  ["El día anterior","Dejar todo organizado"],
  ["El día anterior","Enfriar las bebidas"],
  ["El día anterior","Preparar las mesas"],
];

function useCivil() {
  const [data, setLocal] = useState<CivilData>({ invitados:[], gastos:[] });
  useEffect(()=>{
    const unsub = onSnapshot(doc(db,"boda","civil"), snap=>{
      if (snap.exists()) setLocal(snap.data() as CivilData);
      else setLocal({ invitados:[], gastos:[] });
    });
    return unsub;
  },[]);
  const guardar = async (d:CivilData) => { setLocal(d); await setDoc(doc(db,"boda","civil"),d); };
  return { data, guardar };
}

function BodaCivil() {
  const { data, guardar } = useCivil();
  const invitados = data.invitados || [];
  const gastos    = data.gastos    || [];

  const [subTab, setSubTab] = useState<"presupuesto"|"checklist"|"programa"|"invitados"|"luna"|"invitacion">("presupuesto");

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
        const r = ref(stor, `boda-civil/${dest.campo}_${dest.id}_${Date.now()}_${urls.length}.jpg`);
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
      <Title icon="💒" title="Boda Civil"/>
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
        {SUB("presupuesto","Presupuesto","💰")}
        {SUB("checklist","Checklist","✅")}
        {SUB("programa","Programa","🕐")}
        {SUB("invitados","Invitados","👥")}
        {SUB("invitacion","Invitación","💌")}
        {SUB("luna","Luna de miel","🌴")}
      </div>

      {/* ══ PRESUPUESTO ══ */}
      {(gastos.length===0 && deco.length===0 && tareas.length===0 && subTab!=="luna" && subTab!=="invitacion") && (
        <Card style={{ background:"#fff8f0", marginBottom:14, border:"1px dashed #e8c8a0" }}>
          <div style={{ fontSize:12, fontWeight:800, color:"#c9956a", marginBottom:4 }}>✨ Empezar con una base</div>
          <div style={{ fontSize:11, color:"#a07855", lineHeight:1.5, marginBottom:10 }}>
            Carga un presupuesto estimado para 40 personas, ideas de decoración, el programa del día,
            tips para ahorrar y el checklist por plazos. <strong>Después editás todo</strong>: textos, montos y cantidades.
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
                            <button onClick={()=>abrirEditG(g)} style={{ background:"none", border:"1px solid #d0c0b0", borderRadius:6, padding:"3px 7px", fontSize:11, color:"#a07855", cursor:"pointer" }}>✏️</button>
                            <button onClick={()=>delGasto(g.id)} style={{ background:"none", border:"none", color:"#e07070", cursor:"pointer", fontSize:14 }}>🗑</button>
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
                  <button onClick={()=>abrirEditInv(inv)} style={{ background:"none", border:"1px solid #d0c0b0", borderRadius:6, padding:"4px 8px", fontSize:12, color:"#a07855", cursor:"pointer" }}>✏️</button>
                  <button onClick={()=>delInv(inv.id)} style={{ background:"none", border:"none", color:"#e07070", cursor:"pointer", fontSize:14 }}>🗑</button>
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

// ════════════════════════════════════════════════════════════════
// INVITACIONES DE LA BODA CIVIL
// La página pública es public/invitacion.html (link /i/{codigo}). Lee:
//   boda/invitacion                      → datos generales (lugar, hora, programa…)
//   boda/invitacion/invitados/{codigo}   → una por invitado: para quién es y su respuesta
// Cada invitado tiene un código propio, así cada link es distinto y su respuesta llega acá.
// ════════════════════════════════════════════════════════════════
type InvItem   = { hora:string; actividad:string; detalle?:string; icono:string };
type InvConfig = { lugarNombre:string; direccion:string; comoLlegar:string; mapsUrl:string; hora:string; limite:string; mensaje:string; programa:InvItem[]; musicaUrl:string; musicaInicio:string; musicaArchivo?:string; musicaNombre?:string };
type InvRespuesta = { asiste:boolean; comida?:string[]; cancion?:string; deseo?:string; fecha:string };
type InvPersona = { codigo:string; para:string; invitadoId?:number; enviada?:boolean; vistas?:number; abierta?:any; respuesta?:InvRespuesta };

const INV_ICONOS: [string,string][] = [["anillos","💍 Anillos"],["parrilla","🔥 Parrilla"],["plato","🍽️ Plato"],["copas","🥂 Copas"],["torta","🎂 Torta"],["camara","📷 Cámara"],["musica","🎵 Música"],["atardecer","🌅 Atardecer"]];
const iconoPara = (t:string) => {
  const x = t.toLowerCase();
  if (/asado|parrill|carne/.test(x)) return "parrilla";
  if (/almuerzo|comida|cena|once/.test(x)) return "plato";
  if (/brindis|palabras|cóctel|coctel|bebida/.test(x)) return "copas";
  if (/torta|café|cafe|postre/.test(x)) return "torta";
  if (/foto|juego/.test(x)) return "camara";
  if (/música|musica|baile|bailar/.test(x)) return "musica";
  if (/cierre|despedida|atardecer/.test(x)) return "atardecer";
  return "anillos";
};
const INV_BASE: InvConfig = {
  lugarNombre:"Parcela en Lampa", direccion:"Lampa, Región Metropolitana", comoLlegar:"A unos 40 minutos de Santiago",
  mapsUrl:"", hora:"13:00", limite:"1 de diciembre", mensaje:"Queremos que estés con nosotros el día en que unimos nuestras vidas.", musicaUrl:"", musicaInicio:"",
  programa: SUG_CRONO_CIVIL.map(([hora,actividad])=>({ hora, actividad, detalle:"", icono:iconoPara(actividad) })),
};
// Códigos sin letras que se confunden (0/o, 1/l)
const nuevoCodigo = () => Array.from({length:7}, ()=>"abcdefghijkmnpqrstuvwxyz23456789"[Math.floor(Math.random()*32)]).join("");
const linkDe = (codigo:string) => `${window.location.origin}/i/${codigo}`;
// Vista previa por el OTRO dominio de la app: así el iPhone la abre en Safari y no dentro de la app instalada
// en el inicio (ahí no suena la música con el teléfono en silencio). Ambos dominios son el mismo sitio.
const DOMINIOS_BODA = ["https://boda-4ype.vercel.app", "https://boda-eight-psi.vercel.app"];
const origenVista = () => DOMINIOS_BODA.find(d => d !== window.location.origin) || window.location.origin;
// Mismo criterio que la página de la invitación para reconocer el video
const idYoutube = (url:string) => (String(url).match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/|\/live\/)([A-Za-z0-9_-]{11})/) || [])[1] || null;

function InvitacionCivil({ data, guardar }: { data:CivilData; guardar:(d:CivilData)=>Promise<void> }) {
  const [cfg, setCfg]       = useState<InvConfig|null>(null);   // lo guardado
  const [borr, setBorr]     = useState<InvConfig|null>(null);   // lo que se está editando
  const [personas, setPersonas] = useState<InvPersona[]>([]);
  const [aviso, setAviso]   = useState("");
  const [filtro, setFiltro] = useState<"todas"|"sin"|"si"|"no">("todas");
  const [abierto, setAbierto] = useState<"datos"|"programa"|"musica"|null>(null);
  const [vista, setVista]     = useState<"invitaciones"|"respuestas">("invitaciones");

  useEffect(() => {
    const u1 = onSnapshot(doc(db,"boda","invitacion"), snap => {
      const c = { ...INV_BASE, ...(snap.data() as Partial<InvConfig>||{}) } as InvConfig;
      setCfg(c); setBorr(b => b ?? c);
    });
    const u2 = onSnapshot(collection(db,"boda","invitacion","invitados"), snap =>
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
      const r = ref(stor, `boda-civil/musica_${Date.now()}.${ext}`);
      // Cache largo: los 40 invitados la bajan una sola vez cada uno (ver costo de Storage)
      const tipo = ext === "m4a" || ext === "aac" ? "audio/mp4" : ext === "mp3" ? "audio/mpeg" : (f.type || "audio/mpeg");   // Safari reconoce mejor audio/mp4
      await uploadBytes(r, f, { contentType: tipo, cacheControl: "public, max-age=31536000, immutable" });
      const url = await getDownloadURL(r);
      setBorr({ ...borr, musicaArchivo:url, musicaNombre:f.name });
      avisar("✓ Canción subida: falta tocar «Guardar cambios»");
    } catch (e:any) { alert("No se pudo subir la canción: " + (e?.message || "error")); }
    finally { setSubiendoMusica(false); }
  };

  if (!cfg || !borr) return <div style={{ textAlign:"center" as const, color:"#c4a882", padding:30, fontSize:12 }}>Cargando…</div>;

  const cambios = JSON.stringify(cfg) !== JSON.stringify(borr);
  const guardarCfg = async () => {
    const programa = [...borr.programa].filter(p=>p.actividad.trim()).sort((a,b)=>a.hora.localeCompare(b.hora));
    await setDoc(doc(db,"boda","invitacion"), { ...borr, programa });
    setBorr({ ...borr, programa }); avisar("✓ Invitación actualizada: los links ya muestran estos datos");
  };
  const setP = (i:number, campo:keyof InvItem, v:string) =>
    setBorr({ ...borr, programa: borr.programa.map((p,j)=>j===i ? { ...p, [campo]:v, ...(campo==="actividad" && p.icono===iconoPara(p.actividad) ? { icono:iconoPara(v) } : {}) } : p) });

  // ── Invitaciones ──
  const invitados = data.invitados || [];
  const conInv = new Set(personas.map(p=>p.invitadoId).filter(Boolean));
  const faltan = invitados.filter(i=>!conInv.has(i.id));
  const crearFaltantes = async () => {
    const b = writeBatch(db);
    faltan.forEach(i => b.set(doc(db,"boda","invitacion","invitados",nuevoCodigo()), { para:i.nombre, invitadoId:i.id, enviada:false }));
    await b.commit(); avisar(`✓ ${faltan.length} invitaciones creadas`);
  };
  const crearSuelta = async () => { await setDoc(doc(db,"boda","invitacion","invitados",nuevoCodigo()), { para:"Nueva invitación", enviada:false }); };
  const cambiarPara = (p:InvPersona, para:string) => { if (para.trim() && para.trim()!==p.para) setDoc(doc(db,"boda","invitacion","invitados",p.codigo), { para:para.trim() }, { merge:true }); };
  const marcarEnviada = (p:InvPersona) => { if (!p.enviada) setDoc(doc(db,"boda","invitacion","invitados",p.codigo), { enviada:true }, { merge:true }); };
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
    "Diego & Camila ♡",
  ].join("\n");
  const whatsapp = (p:InvPersona) => { window.open(`https://wa.me/?text=${encodeURIComponent(textoWsp(p))}`, "_blank"); marcarEnviada(p); };
  const borrar = (p:InvPersona) => { if (window.confirm(`¿Borrar la invitación de ${p.para}? Su link deja de funcionar.`)) deleteDoc(doc(db,"boda","invitacion","invitados",p.codigo)); };
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
  const porConfirmar = si.filter(p=>{ const i = invitados.find(x=>x.id===p.invitadoId); return i && !i.confirmado; });
  const pasarConfirmados = () => {
    const ids = new Set(porConfirmar.map(p=>p.invitadoId));
    guardar({ ...data, invitados: invitados.map(i=>ids.has(i.id)?{ ...i, confirmado:true }:i) });
    avisar(`✓ ${ids.size} marcados como confirmados en Invitados`);
  };

  const estado = (p:InvPersona) => p.respuesta ? (p.respuesta.asiste ? ["✓ Viene","#6aaa96","#eef7f2"] : ["✕ No viene","#e07070","#fdf0f0"])
    : (p.abierta || p.vistas) ? ["👀 La abrió","#c9956a","#fdf3ea"] : p.enviada ? ["Enviada","#a07855","#f6efe8"] : ["Sin enviar","#c4a882","#fbf7f2"];
  const lbl = { fontSize:10, fontWeight:700, color:"#a07855", marginBottom:3, display:"block" } as React.CSSProperties;
  const mini = (bg:string, color="#fff") => ({ background:bg, color, border:"none", borderRadius:8, padding:"7px 10px", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" as const });
  const Seccion = ({ id, icono, titulo, resumen }: { id:"datos"|"programa"|"musica"; icono:string; titulo:string; resumen:string }) => (
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
            <div style={{ fontSize:26, fontWeight:900, color:"#9e4f56", lineHeight:1.1, marginTop:2 }}>{si.length} <span style={{ fontSize:13, fontWeight:700 }}>confirmaron</span></div>
          </div>
          <a href={`${origenVista()}/invitacion.html`} target="_blank" rel="noopener noreferrer" style={{ ...mini("#fff","#9e4f56"), textDecoration:"none" }}>👁 Ver muestra</a>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginTop:12 }}>
          {[["Creadas",personas.length],["Abiertas",abiertas],["No vienen",no.length],["Sin responder",sinResp.length]].map(([t,n])=>(
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
        <RespuestasInv personas={personas} recordar={(p:InvPersona)=>{ window.open(`https://wa.me/?text=${encodeURIComponent(`${p.para}, ¡te esperamos el viernes 18 de diciembre! 💍 Cuando puedas, confírmanos aquí: ${linkDe(p.codigo)}`)}`, "_blank"); }} avisar={avisar}/>
      ) : <>
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
            {p.respuesta && (
              <div style={{ fontSize:11, color:"#a07855", background:"#fdf8f3", borderRadius:8, padding:"7px 9px", marginTop:8, lineHeight:1.5 }}>
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
              <a href={`${origenVista()}/i/${p.codigo}?admin=1`} target="_blank" rel="noopener noreferrer" style={{ ...mini("#fdf3ea","#a07855"), textDecoration:"none" }}>Ver</a>
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

// Todo lo que respondieron, ordenado para usarlo: comida para el banquetero, canciones para la música,
// deseos para leerlos, y quiénes faltan (con recordatorio por WhatsApp).
const fechaCorta = (iso?:string) => { if (!iso) return ""; const d = new Date(iso);
  return d.toLocaleDateString("es-CL", { day:"numeric", month:"short" }) + " " + d.toLocaleTimeString("es-CL", { hour:"2-digit", minute:"2-digit" }); };
function RespuestasInv({ personas, recordar, avisar }: { personas:InvPersona[]; recordar:(p:InvPersona)=>void; avisar:(t:string)=>void }) {
  const [abierta, setAbierta] = useState<string|null>(null);
  const [todasFaltan, setTodasFaltan] = useState(false);
  const resp = personas.filter(p=>p.respuesta).sort((a,b)=>(b.respuesta!.fecha||"").localeCompare(a.respuesta!.fecha||""));
  const vienen = resp.filter(p=>p.respuesta!.asiste), noVienen = resp.filter(p=>!p.respuesta!.asiste);
  const faltan = personas.filter(p=>!p.respuesta).sort((a,b)=>a.para.localeCompare(b.para));
  const total = personas.length || 1;

  // Comida: cada restricción con quiénes la tienen
  const dietas = new Map<string,string[]>(); const alergias: [string,string][] = [];
  vienen.forEach(p => (p.respuesta!.comida?.length ? p.respuesta!.comida : ["Como de todo"]).forEach(c => {
    if (c.startsWith("Alergia")) { alergias.push([p.para, c.replace(/^Alergia:?\s*/,"") || "sin detalle"]); return; }
    const k = c==="Como de todo" ? "Come de todo" : c; dietas.set(k, [...(dietas.get(k)||[]), p.para]);
  }));
  const ordenDietas = Array.from(dietas.entries()).sort((a,b)=> (a[0]==="Come de todo"?1:0)-(b[0]==="Come de todo"?1:0) || b[1].length-a[1].length);
  const canciones = vienen.filter(p=>p.respuesta!.cancion);
  const deseos = resp.filter(p=>p.respuesta!.deseo);

  const copiar = async (t:string, ok:string) => { try { await navigator.clipboard.writeText(t); avisar(ok); } catch { window.prompt("Copia el texto:", t); } };
  const resumenComida = () => [`Comida — ${vienen.length} personas confirmadas`, ...ordenDietas.map(([k,v])=>`• ${k}: ${v.length} (${v.join(", ")})`),
    ...alergias.map(([n,a])=>`• Alergia de ${n}: ${a}`)].join("\n");

  const titulo = (icono:string, t:string, extra?:React.ReactNode) => (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
      <span style={{ fontSize:17 }}>{icono}</span><span style={{ flex:1, fontSize:13, fontWeight:800, color:"#5c3d2e" }}>{t}</span>{extra}
    </div>);
  const boton = (t:string, f:()=>void) => <button onClick={f} style={{ background:"#fdf3ea", color:"#c9956a", border:"none", borderRadius:8, padding:"6px 10px", fontSize:10.5, fontWeight:800, cursor:"pointer", fontFamily:"inherit" }}>{t}</button>;
  const chipNombre = (n:string) => <span key={n} style={{ fontSize:10.5, background:"#fdf8f3", border:"1px solid #f0e2d4", color:"#a07855", borderRadius:20, padding:"2px 8px" }}>{n}</span>;

  if (!personas.length) return <Card style={{ textAlign:"center" as const, color:"#c4a882", fontSize:12, padding:28 }}>Todavía no hay invitaciones creadas. Créalas en «Invitaciones» y mándalas: las respuestas van a ir apareciendo acá.</Card>;

  return (
    <div>
      {/* Avance */}
      <Card style={{ marginBottom:12, padding:"14px 16px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, fontWeight:700, color:"#a07855", marginBottom:6 }}>
          <span>Respondieron {resp.length} de {personas.length}</span><span>{Math.round(resp.length/total*100)}%</span>
        </div>
        <div style={{ display:"flex", height:10, borderRadius:6, overflow:"hidden", background:"#f3e7dc" }}>
          <div style={{ width:`${vienen.length/total*100}%`, background:"#6aaa96" }}/>
          <div style={{ width:`${noVienen.length/total*100}%`, background:"#e07070" }}/>
        </div>
        <div style={{ display:"flex", gap:14, marginTop:8, fontSize:11, color:"#5c3d2e", flexWrap:"wrap" as const }}>
          <span><b style={{ color:"#6aaa96" }}>●</b> Vienen <b>{vienen.length}</b></span>
          <span><b style={{ color:"#e07070" }}>●</b> No vienen <b>{noVienen.length}</b></span>
          <span><b style={{ color:"#d8c6b4" }}>●</b> Faltan <b>{faltan.length}</b></span>
        </div>
      </Card>

      {/* Comida */}
      <Card style={{ marginBottom:12, padding:"14px 16px" }}>
        {titulo("🍽️", "Para la comida", vienen.length>0 && boton("Copiar resumen", ()=>copiar(resumenComida(), "✓ Resumen de comida copiado")))}
        {vienen.length===0 ? <div style={{ fontSize:11.5, color:"#c4a882" }}>Cuando confirmen, acá se suma qué come cada uno.</div> : <>
          {ordenDietas.map(([k,v])=>(
            <div key={k} style={{ padding:"8px 0", borderBottom:"1px solid #f6ede4" }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:12.5, fontWeight:700, color:"#5c3d2e", marginBottom:5 }}><span>{k}</span><span style={{ color:k==="Come de todo"?"#a07855":"#c46a6e" }}>{v.length}</span></div>
              {k!=="Come de todo" && <div style={{ display:"flex", gap:5, flexWrap:"wrap" as const }}>{v.map(chipNombre)}</div>}
            </div>
          ))}
          {alergias.length>0 && (
            <div style={{ marginTop:10, background:"#fdf0f0", borderRadius:9, padding:"9px 11px" }}>
              <div style={{ fontSize:11, fontWeight:800, color:"#c05050", marginBottom:4 }}>⚠️ Alergias</div>
              {alergias.map(([n,a])=><div key={n} style={{ fontSize:12, color:"#5c3d2e" }}><b>{n}:</b> {a}</div>)}
            </div>
          )}
        </>}
      </Card>

      {/* Canciones */}
      <Card style={{ marginBottom:12, padding:"14px 16px" }}>
        {titulo("🎵", `Canciones para bailar · ${canciones.length}`, canciones.length>0 && boton("Copiar lista", ()=>copiar(canciones.map(p=>`${p.respuesta!.cancion} (pidió ${p.para})`).join("\n"), "✓ Lista de canciones copiada")))}
        {canciones.length===0 ? <div style={{ fontSize:11.5, color:"#c4a882" }}>Todavía nadie pidió una canción.</div>
          : canciones.map(p=>(
            <div key={p.codigo} style={{ display:"flex", gap:8, padding:"6px 0", borderBottom:"1px solid #f6ede4", fontSize:12.5 }}>
              <span style={{ flex:1, color:"#5c3d2e", fontWeight:700 }}>{p.respuesta!.cancion}</span><span style={{ color:"#c4a882", fontSize:11 }}>{p.para}</span>
            </div>))}
      </Card>

      {/* Deseos */}
      <Card style={{ marginBottom:12, padding:"14px 16px", background:"#fffaf6" }}>
        {titulo("💌", `Deseos para los novios · ${deseos.length}`)}
        {deseos.length===0 ? <div style={{ fontSize:11.5, color:"#c4a882" }}>Acá van a aparecer los mensajes que les dejen.</div>
          : deseos.map(p=>(
            <div key={p.codigo} style={{ background:"#fff", border:"1px solid #f3e2d8", borderRadius:10, padding:"10px 12px", marginBottom:8 }}>
              <div style={{ fontSize:13, color:"#5c3d2e", fontStyle:"italic" as const, lineHeight:1.5 }}>“{p.respuesta!.deseo}”</div>
              <div style={{ fontSize:10.5, color:"#c46a6e", fontWeight:800, marginTop:5 }}>— {p.para} <span style={{ color:"#c4a882", fontWeight:600 }}>· {fechaCorta(p.respuesta!.fecha)}</span></div>
            </div>))}
      </Card>

      {/* Persona por persona */}
      <Card style={{ marginBottom:12, padding:"14px 16px" }}>
        {titulo("👥", "Persona por persona")}
        {resp.length===0 && <div style={{ fontSize:11.5, color:"#c4a882" }}>Nadie ha respondido todavía.</div>}
        {resp.map(p=>{ const r = p.respuesta!, ab = abierta===p.codigo; return (
          <div key={p.codigo} style={{ borderBottom:"1px solid #f6ede4" }}>
            <button onClick={()=>setAbierta(ab?null:p.codigo)} style={{ width:"100%", display:"flex", alignItems:"center", gap:9, background:"none", border:"none", padding:"9px 0", cursor:"pointer", fontFamily:"inherit", textAlign:"left" as const }}>
              <span style={{ width:26, height:26, borderRadius:"50%", background:r.asiste?"#6aaa96":"#e07070", color:"#fff", fontSize:12, fontWeight:900, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{r.asiste?"✓":"✕"}</span>
              <span style={{ flex:1, minWidth:0 }}>
                <span style={{ display:"block", fontSize:13, fontWeight:800, color:"#5c3d2e" }}>{p.para}</span>
                <span style={{ display:"block", fontSize:10.5, color:"#c4a882" }}>{r.asiste ? ((r.comida||[]).join(", ")||"Come de todo") : "No podrá venir"} · {fechaCorta(r.fecha)}</span>
              </span>
              <span style={{ fontSize:11, color:"#c9956a", transform:ab?"rotate(180deg)":"none" }}>▾</span>
            </button>
            {ab && (
              <div style={{ fontSize:12, color:"#5c3d2e", background:"#fdf8f3", borderRadius:9, padding:"9px 11px", marginBottom:9, lineHeight:1.6 }}>
                <div><b>Asiste:</b> {r.asiste?"Sí":"No"}</div>
                {r.asiste && <div><b>Comida:</b> {(r.comida||[]).join(", ")||"Come de todo"}</div>}
                {r.cancion && <div><b>Canción:</b> {r.cancion}</div>}
                {r.deseo && <div><b>Deseo:</b> “{r.deseo}”</div>}
                <div style={{ color:"#a07855", fontSize:11 }}>Respondió el {fechaCorta(r.fecha)}{p.vistas?` · abrió la invitación ${p.vistas} ${p.vistas===1?"vez":"veces"}`:""}</div>
              </div>
            )}
          </div>); })}
      </Card>

      {/* Faltan */}
      {faltan.length>0 && (
        <Card style={{ marginBottom:12, padding:"14px 16px" }}>
          {titulo("⏳", `Faltan por responder · ${faltan.length}`)}
          {(todasFaltan ? faltan : faltan.slice(0,6)).map(p=>(
            <div key={p.codigo} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 0", borderBottom:"1px solid #f6ede4" }}>
              <span style={{ flex:1, minWidth:0 }}>
                <span style={{ display:"block", fontSize:12.5, fontWeight:700, color:"#5c3d2e" }}>{p.para}</span>
                <span style={{ display:"block", fontSize:10.5, color:"#c4a882" }}>{(p.abierta||p.vistas) ? "La abrió pero no ha respondido" : p.enviada ? "Enviada, sin abrir" : "Todavía no se la mandan"}</span>
              </span>
              {(p.enviada || p.abierta || p.vistas) && <button onClick={()=>recordar(p)} style={{ background:"#25a35a", color:"#fff", border:"none", borderRadius:8, padding:"6px 10px", fontSize:10.5, fontWeight:800, cursor:"pointer", fontFamily:"inherit" }}>Recordar</button>}
            </div>
          ))}
          {faltan.length>6 && <button onClick={()=>setTodasFaltan(!todasFaltan)} style={{ width:"100%", background:"none", border:"none", color:"#c9956a", fontSize:11.5, fontWeight:800, padding:"9px 0 0", cursor:"pointer", fontFamily:"inherit" }}>{todasFaltan ? "Mostrar menos" : `Ver los ${faltan.length}`}</button>}
        </Card>
      )}
      {noVienen.length>0 && (
        <Card style={{ marginBottom:12, padding:"14px 16px" }}>
          {titulo("💔", `No podrán venir · ${noVienen.length}`)}
          <div style={{ display:"flex", gap:5, flexWrap:"wrap" as const }}>{noVienen.map(p=>chipNombre(p.para))}</div>
        </Card>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// LUNA DE MIEL DE LA BODA CIVIL — Florianópolis, 19 al 24 de diciembre de 2026
// El itinerario es fijo (el mismo del PDF de iCloud); solo se guarda qué ya se hizo o reservó.
// Montos para los dos, solo comida, Uber y entradas (hospedaje y vuelos ya están pagados).
// ════════════════════════════════════════════════════════════════
const REAL_A_CLP = 195;   // tipo de cambio usado (octubre 2026)
type LunaParada = { id:string; texto:string; detalle?:string };
type LunaDia = { id:string; fecha:string; dia:string; titulo:string; foto:string; relajo?:boolean; aviso?:string; paradas:LunaParada[]; gastos:[string,number][] };
const LUNA_DIAS: LunaDia[] = [
  { id:"d19", fecha:"19", dia:"Sábado", titulo:"Llegada y Lagoa da Conceição", foto:"lagoa",
    paradas:[
      { id:"d19a", texto:"Llegar sin apuro y descansar" },
      { id:"d19b", texto:"Atardecer en el mirador del Morro da Lagoa", detalle:"Gratis. La vista de la laguna y las dunas" },
      { id:"d19c", texto:"Caminata por la orilla y cena en la Lagoa", detalle:"Sushi o mariscos" },
    ], gastos:[["Uber aeropuerto",60],["Uber local",50],["Cena",250]] },
  { id:"d20", fecha:"20", dia:"Domingo", titulo:"Ilha do Campeche", foto:"campeche",
    aviso:"Del 15 al 25 de diciembre el barco cuesta R$ 250 por persona. Cupo diario limitado: reservar con tiempo (R$ 50 de abono).",
    paradas:[
      { id:"d20a", texto:"Barco desde Armação a la isla", detalle:"Agua turquesa, arena blanca y senderos con grabados rupestres" },
      { id:"d20b", texto:"Llevar agua, snacks y bloqueador", detalle:"En la isla hay poco y caro" },
      { id:"d20c", texto:"Almuerzo en Armação y atardecer en Praia do Campeche" },
    ], gastos:[["Barco (2)",500],["Uber",100],["Almuerzo",250],["Cena",280]] },
  { id:"d21", fecha:"21", dia:"Lunes", titulo:"Día de relajo en pareja", foto:"jurere", relajo:true,
    paradas:[
      { id:"d21a", texto:"Day spa para dos", detalle:"Estética Arlete, Pacote Vênus (R$ 665) · Zahra con ofurô (R$ 760) · Buddha Spa (R$ 694)" },
      { id:"d21b", texto:"Tarde de playa tranquila en Jurerê Internacional", detalle:"Agua calma, sin olas" },
      { id:"d21c", texto:"Ostras al atardecer en Santo Antônio de Lisboa", detalle:"La mejor puesta de sol de la isla" },
    ], gastos:[["Spa",700],["Uber",100],["Almuerzo liviano",120],["Cena",280]] },
  { id:"d22", fecha:"22", dia:"Martes", titulo:"Sur de la isla y dunas", foto:"dunas",
    paradas:[
      { id:"d22a", texto:"Ribeirão da Ilha: casas de colores y ostras", detalle:"Ostradamus (R$ 120–200 p/p) o la «Ostretação» de Porto do Contrato (16 sabores para dos, R$ 119)" },
      { id:"d22b", texto:"Sandboard en las Dunas da Joaquina", detalle:"R$ 30–50 la hora por tabla" },
      { id:"d22c", texto:"Atardecer en Praia Mole" },
    ], gastos:[["Almuerzo de ostras",300],["Sandboard",80],["Uber",140],["Cena",240]] },
  { id:"d23", fecha:"23", dia:"Miércoles", titulo:"Centro y despedida", foto:"ponte",
    paradas:[
      { id:"d23a", texto:"Mercado Público", detalle:"Bolinhos de bacalhau en el Box 32" },
      { id:"d23b", texto:"Ponte Hercílio Luz iluminada", detalle:"En diciembre el centro tiene decoración de Navidad" },
      { id:"d23c", texto:"Cena de despedida", detalle:"En el lugar que más les haya gustado" },
    ], gastos:[["Mercado",150],["Uber",80],["Cena",300]] },
  { id:"d24", fecha:"24", dia:"Jueves", titulo:"Vuelta a Chile", foto:"mercado",
    paradas:[ { id:"d24a", texto:"Desayuno tranquilo y Uber al aeropuerto", detalle:"Pedirlo con tiempo: cerca de Navidad sube la demanda" } ],
    gastos:[["Uber aeropuerto",70]] },
];
const LUNA_RESERVAS: LunaParada[] = [
  { id:"r-barco", texto:"Reservar el barco a Ilha do Campeche (domingo 20)", detalle:"Abono de R$ 50; las fechas de diciembre se llenan" },
  { id:"r-spa",   texto:"Reservar el day spa para dos (lunes 21)" },
  { id:"r-plata", texto:"Llevar unos R$ 300 en efectivo", detalle:"Lugares chicos piden Pix o efectivo" },
];
const LUNA_EXTRAS: [string,string][] = [
  ["Lagoinha do Leste","Una de las playas más lindas de la isla: unas 2 horas de sendero gratis desde Pântano do Sul."],
  ["Beto Carrero World","A unas 2 horas: ocupa el día entero y la entrada va aparte."],
  ["Para llevar","Bloqueador alto, gorro, zapatillas para el sendero y las dunas, y algo para la lluvia."],
];
const LUNA_CREDITOS = "Fotos de Wikimedia Commons: Ezarate (Lagoa, CC BY-SA 4.0) · Luluhgomes (Campeche, CC BY-SA 4.0) · Rafael B. Mattei (Jurerê, CC BY-SA 3.0) · Anderson Schmitt (dunas, CC BY-SA 3.0) · Ricardo G. Faraco (Ponte, CC BY 3.0) · Prefeitura de Florianópolis (Mercado, CC BY 2.0) · Rafael A. Rojas (Ribeirão, CC BY-SA 4.0) · Santo Antônio de Lisboa (CC BY 2.5).";
const reales = (n:number) => "R$ " + n.toLocaleString("es-CL");

function LunaCivil({ hechos, onToggle }: { hechos:string[]; onToggle:(id:string)=>void }) {
  const totalDia = (d:LunaDia) => d.gastos.reduce((s,g)=>s+g[1],0);
  const subtotal = LUNA_DIAS.reduce((s,d)=>s+totalDia(d),0);
  const conColchon = Math.round(subtotal*1.1/50)*50;
  const todas = [...LUNA_RESERVAS, ...LUNA_DIAS.flatMap(d=>d.paradas)];
  const listas = todas.filter(p=>hechos.includes(p.id)).length;

  const fila = (p:LunaParada, color="#c9956a") => {
    const ok = hechos.includes(p.id);
    return (
      <button key={p.id} onClick={()=>onToggle(p.id)}
        style={{ display:"flex", gap:10, alignItems:"flex-start", width:"100%", textAlign:"left" as const, background:"transparent", border:"none", padding:"7px 0", cursor:"pointer", fontFamily:"inherit" }}>
        <span style={{ width:20, height:20, borderRadius:6, flexShrink:0, marginTop:1, border:`1.5px solid ${ok?color:"#e0cbb6"}`, background:ok?color:"#fff", color:"#fff", fontSize:12, fontWeight:900, display:"flex", alignItems:"center", justifyContent:"center" }}>{ok?"✓":""}</span>
        <span style={{ flex:1 }}>
          <span style={{ display:"block", fontSize:13, fontWeight:700, color:ok?"#b8a493":"#5c3d2e", textDecoration:ok?"line-through":"none" }}>{p.texto}</span>
          {p.detalle && <span style={{ display:"block", fontSize:11, color:"#a07855", lineHeight:1.45, marginTop:1 }}>{p.detalle}</span>}
        </span>
      </button>
    );
  };

  return (
    <div>
      {/* Portada */}
      <div style={{ position:"relative" as const, borderRadius:16, overflow:"hidden", marginBottom:14, minHeight:190, background:"#3d6e78" }}>
        <img src="/luna/campeche.jpg" alt="Ilha do Campeche" style={{ position:"absolute" as const, inset:0, width:"100%", height:"100%", objectFit:"cover" as const }}/>
        <div style={{ position:"absolute" as const, inset:0, background:"linear-gradient(180deg,rgba(20,50,60,.05) 20%,rgba(20,40,50,.78))" }}/>
        <div style={{ position:"relative" as const, padding:"80px 18px 16px", color:"#fff" }}>
          <div style={{ fontSize:10, letterSpacing:"0.18em", fontWeight:700, opacity:.9 }}>LUNA DE MIEL · BODA CIVIL</div>
          <div style={{ fontSize:26, fontWeight:900, lineHeight:1.1, marginTop:2 }}>Florianópolis</div>
          <div style={{ fontSize:12, opacity:.92, marginTop:2 }}>Del sábado 19 al jueves 24 de diciembre de 2026</div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:14 }}>
        {[["Para los dos", "≈ "+fmt(conColchon*REAL_A_CLP), reales(conColchon)+" con 10% de colchón"],
          ["Tipo de cambio", "R$ 1 ≈ $"+REAL_A_CLP, "octubre 2026"],
          ["Avance", `${listas} de ${todas.length}`, "cosas hechas o reservadas"]].map(([t,v,s])=>(
          <Card key={t} style={{ padding:"11px 10px" }}>
            <div style={{ fontSize:9.5, fontWeight:700, color:"#a07855", letterSpacing:"0.05em" }}>{t.toUpperCase()}</div>
            <div style={{ fontSize:15, fontWeight:900, color:"#5c3d2e", marginTop:2 }}>{v}</div>
            <div style={{ fontSize:9.5, color:"#c4a882", marginTop:1, lineHeight:1.3 }}>{s}</div>
          </Card>
        ))}
      </div>

      <Card style={{ marginBottom:16, padding:"14px 16px", background:"#fff6ee", border:"1.5px solid #f0d2b4" }}>
        <div style={{ fontSize:12, fontWeight:800, color:"#c46a3a", marginBottom:4 }}>📌 Antes de viajar</div>
        {LUNA_RESERVAS.map(p=>fila(p,"#d9734e"))}
      </Card>

      {/* Día a día */}
      {LUNA_DIAS.map(d=>{
        const hechasDia = d.paradas.filter(p=>hechos.includes(p.id)).length;
        return (
          <Card key={d.id} style={{ padding:0, overflow:"hidden", marginBottom:14 }}>
            <div style={{ position:"relative" as const, height:150, background:"#e8d5c4" }}>
              <img src={`/luna/${d.foto}.jpg`} alt={d.titulo} loading="lazy" style={{ width:"100%", height:"100%", objectFit:"cover" as const, display:"block" }}/>
              <div style={{ position:"absolute" as const, inset:0, background:"linear-gradient(180deg,transparent 35%,rgba(30,20,15,.7))" }}/>
              <div style={{ position:"absolute" as const, left:14, bottom:10, right:14, display:"flex", alignItems:"flex-end", gap:10, color:"#fff" }}>
                <div style={{ fontSize:34, fontWeight:900, lineHeight:.9 }}>{d.fecha}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:9.5, letterSpacing:"0.14em", fontWeight:700, opacity:.9 }}>{d.dia.toUpperCase()}{d.relajo?" · 💆 RELAJO":""}</div>
                  <div style={{ fontSize:15, fontWeight:800, lineHeight:1.2 }}>{d.titulo}</div>
                </div>
                <div style={{ fontSize:10, fontWeight:800, background:"rgba(255,255,255,.22)", borderRadius:20, padding:"3px 9px" }}>{hechasDia}/{d.paradas.length}</div>
              </div>
            </div>
            <div style={{ padding:"8px 16px 14px" }}>
              {d.paradas.map(p=>fila(p, d.relajo?"#d9734e":"#c9956a"))}
              {d.aviso && <div style={{ fontSize:11, color:"#8c4820", background:"#fff3ea", borderLeft:"3px solid #d9734e", borderRadius:6, padding:"7px 10px", margin:"6px 0 4px", lineHeight:1.45 }}>{d.aviso}</div>}
              <div style={{ display:"flex", flexWrap:"wrap" as const, gap:6, marginTop:8, paddingTop:9, borderTop:"1px dashed #ecdccb", alignItems:"center" }}>
                {d.gastos.map(([n,m])=>(
                  <span key={n} style={{ fontSize:10, color:"#a07855", background:"#fdf8f3", borderRadius:20, padding:"3px 9px" }}>{n} <strong style={{ color:"#5c3d2e" }}>{reales(m)}</strong></span>
                ))}
                <span style={{ marginLeft:"auto", fontSize:11, fontWeight:800, color:"#c9956a" }}>{reales(totalDia(d))} · ~{fmt(Math.round(totalDia(d)*REAL_A_CLP/1000)*1000)}</span>
              </div>
            </div>
          </Card>
        );
      })}

      {/* Presupuesto */}
      <Card style={{ marginBottom:14 }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#8c4820", marginBottom:8, letterSpacing:"0.06em" }}>PRESUPUESTO PARA LOS DOS</div>
        {LUNA_DIAS.map(d=>(
          <div key={d.id} style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#5c3d2e", padding:"6px 0", borderBottom:"1px solid #f3e7dc" }}>
            <span>{d.dia.slice(0,3)} {d.fecha} · {d.titulo}</span>
            <span style={{ fontVariantNumeric:"tabular-nums", whiteSpace:"nowrap" as const, marginLeft:8 }}>{reales(totalDia(d))}</span>
          </div>
        ))}
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#a07855", padding:"7px 0" }}><span>Subtotal</span><span>{reales(subtotal)} · {fmt(subtotal*REAL_A_CLP)}</span></div>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:14, fontWeight:900, color:"#c9956a" }}><span>Con 10% de colchón</span><span>≈ {fmt(conColchon*REAL_A_CLP)}</span></div>
        <div style={{ fontSize:10, color:"#c4a882", marginTop:6 }}>Solo comida, Uber y entradas. Precios de la temporada 2025: para 2026 pueden subir un poco.</div>
      </Card>

      {/* Ribeirão y extras */}
      <Card style={{ padding:0, overflow:"hidden", marginBottom:14 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", height:110 }}>
          <img src="/luna/ribeirao.jpg" alt="Ribeirão da Ilha" loading="lazy" style={{ width:"100%", height:"100%", objectFit:"cover" as const }}/>
          <img src="/luna/santoantonio.jpg" alt="Santo Antônio de Lisboa" loading="lazy" style={{ width:"100%", height:"100%", objectFit:"cover" as const }}/>
        </div>
        <div style={{ padding:"12px 16px 14px" }}>
          <div style={{ fontSize:12, fontWeight:800, color:"#5c3d2e", marginBottom:6 }}>Si les sobra energía</div>
          {LUNA_EXTRAS.map(([t,x])=>(
            <div key={t} style={{ fontSize:11.5, color:"#a07855", lineHeight:1.5, marginBottom:5 }}><strong style={{ color:"#5c3d2e" }}>{t}:</strong> {x}</div>
          ))}
        </div>
      </Card>
      <div style={{ fontSize:9, color:"#c4a882", lineHeight:1.5, padding:"0 4px" }}>{LUNA_CREDITOS}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// APP
// ════════════════════════════════════════════════════════════════
export default function App() {
  const [acceso, setAcceso] = useState<null|"admin"|"fotos">(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("fotos")==="1") return null;
    return localStorage.getItem("boda_acceso") as any || null;
  });
  const [tab, setTab]     = useState("dashboard");
  const [sidebar, setSidebar] = useState(false);

  const [invitados,   setInvitados]   = useData<{invitados:Invitado[]}>("invitados",   {invitados:[]});
  const [proveedores, setProveedores] = useData<{proveedores:Proveedor[]}>("proveedores",{proveedores:PROVEEDORES_INICIALES});
  const [gastos,      setGastos]      = useData<{gastos:GastoExtra[]}>("gastos",        {gastos:[]});
  const [canciones,   setCanciones]   = useData<{canciones:Cancion[]}>("canciones",     {canciones:[]});
  const [regalos,     setRegalos]     = useData<{regalos:Regalo[]}>("regalos",          {regalos:[]});
  const [luna,        setLuna]        = useData<{items:LunaItem[]}>("luna",              {items:[]});
  const [mesasPosData,setMesasPosData]= useData<{mesas:MesaPos[]}>("mesaspos",           {mesas:[]});
  const [decoraciones,setDecoraciones]= useData<{items:DecoItem[]}>("decoraciones",       {items:[]});

  const login = (tipo:"admin"|"fotos") => {
    setAcceso(tipo);
    if (tipo==="admin") { localStorage.setItem("boda_acceso","admin"); initFCM(); }
    if (tipo==="fotos") setTab("fotos");
  };

  // Notificaciones en primer plano
  useEffect(() => {
    if (acceso !== "admin" || !messaging) return;
    const unsub = onMessage(messaging, payload => {
      const title = payload.notification?.title || "💍 Boda";
      const body  = payload.notification?.body  || "";
      alert(`${title}\n${body}`);
    });
    return unsub;
  }, [acceso]);
  const logout = () => { localStorage.removeItem("boda_acceso"); setAcceso(null); };

  if (!acceso) return <PantallaLogin onLogin={login}/>;

  if (acceso==="fotos") return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#fff5ee,#fde8d8)", padding:20 }}>
      <S/>
      <div style={{ maxWidth:480, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <img src="/pareja.jpg" alt="Boda" style={{ width:70, height:70, borderRadius:"50%", objectFit:"cover", border:"3px solid #c9956a" }}/>
          <div style={{ fontSize:18, color:"#5c3d2e", marginTop:10 }}>Diego & Camila 💍</div>
        </div>
        <Fotos esAdmin={false}/>
      </div>
    </div>
  );

  const TABS_MAIN = [
    { id:"dashboard",   icon:"💍", label:"Inicio" },
    { id:"invitados",   icon:"👥", label:"Invitados" },
    { id:"mesas",       icon:"🪑", label:"Mesas" },
    { id:"presupuesto", icon:"💰", label:"Presupuesto" },
  ];
  const SIDEBAR_ITEMS = [
    { id:"proveedores",  icon:"🤝", label:"Proveedores",   desc:"Fotógrafo, animador, etc." },
    { id:"decoraciones", icon:"🌸", label:"Decoraciones",  desc:"Lista de compras y referencias" },
    { id:"programa",     icon:"🎵", label:"Programa",      desc:"Canciones, juegos, actividades" },
    { id:"regalos",      icon:"🎁", label:"Regalos",       desc:"Lista de regalos" },
    { id:"civil",        icon:"💒", label:"Boda Civil",    desc:"Invitados, comida y gastos" },
    { id:"luna",         icon:"✈️", label:"Luna de Miel",  desc:"Viaje y actividades" },
    { id:"deptos",       icon:"🏢", label:"Departamentos", desc:"Proyectos en Quilicura / metro L3" },
    { id:"checklist",    icon:"✅", label:"Pendientes",    desc:"Tareas y cosas por hacer" },
    { id:"fotos",        icon:"📷", label:"Galería",       desc:"Fotos de la boda" },
    { id:"qr",           icon:"📱", label:"QR Invitados",  desc:"Código para subir fotos" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#fdf8f3", fontFamily:"Georgia,serif", display:"flex", flexDirection:"column", maxWidth:520, margin:"0 auto" }}>
      <S/>
      {/* Header */}
      <div style={{ background:"#fff", borderBottom:"1px solid #f0e0d0", padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0, boxShadow:"0 2px 12px rgba(180,130,100,.08)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <img src="/pareja.jpg" alt="Diego & Camila" style={{ width:38, height:38, borderRadius:"50%", objectFit:"cover", border:"2px solid #e8d5c4" }}/>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:"#5c3d2e" }}>Diego & Camila</div>
            <div style={{ fontSize:9, color:"#c4a882", letterSpacing:"0.06em" }}>💍 27 · NOV · 2027 · {diasFaltantes()}d</div>
          </div>
        </div>
        <button onClick={logout} style={{ background:"none", border:"1px solid #f0e0d0", borderRadius:8, padding:"6px 10px", fontSize:11, color:"#a07855", cursor:"pointer", fontFamily:"inherit" }}>Salir</button>
      </div>

      {/* Sidebar */}
      {sidebar && (
        <div style={{ position:"fixed", inset:0, zIndex:200 }} onClick={()=>setSidebar(false)}>
          <div style={{ position:"absolute", top:0, right:0, bottom:0, width:270, background:"#fff", borderLeft:"1px solid #f0e0d0", display:"flex", flexDirection:"column", animation:"slideInRight .2s ease", boxShadow:"-8px 0 32px rgba(180,130,100,.15)" }} onClick={e=>e.stopPropagation()}>
            <div style={{ padding:"20px 20px 14px", borderBottom:"1px solid #f0e0d0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#5c3d2e" }}>Más secciones</div>
              <button onClick={()=>setSidebar(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"#a07855", fontSize:18 }}>✕</button>
            </div>
            <div style={{ flex:1, overflowY:"auto", padding:"8px 0" }}>
              {SIDEBAR_ITEMS.map(s=>(
                <button key={s.id} onClick={()=>{setTab(s.id);setSidebar(false);}} style={{ width:"100%", background:tab===s.id?"#fdf0e8":"none", border:"none", cursor:"pointer", padding:"12px 20px", display:"flex", alignItems:"center", gap:12, borderLeft:tab===s.id?"3px solid #c9956a":"3px solid transparent", textAlign:"left", fontFamily:"inherit" }}>
                  <span style={{ fontSize:22 }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:tab===s.id?"#c9956a":"#5c3d2e" }}>{s.label}</div>
                    <div style={{ fontSize:10, color:"#a07855" }}>{s.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Contenido */}
      <div style={{ flex:1, overflow:"auto", padding:"16px 16px 84px" }}>
        {tab==="dashboard"   && <Dashboard invitados={invitados} proveedores={proveedores} gastos={gastos}/>}
        {tab==="invitados"   && <Invitados data={invitados} setData={setInvitados}/>}
        {tab==="mesas"       && <Mesas invitados={invitados} setInvitados={setInvitados} mesasData={mesasPosData} setMesasData={setMesasPosData}/>}
        {tab==="presupuesto" && <Presupuesto gastos={gastos} setGastos={setGastos} proveedores={proveedores} invitados={invitados}/>}
        {tab==="proveedores"  && <Proveedores data={proveedores} setData={setProveedores}/>}
        {tab==="decoraciones" && <Decoraciones data={decoraciones} setData={setDecoraciones}/>}
        {tab==="programa"     && <Programa canciones={canciones} setCanciones={setCanciones}/>}
        {tab==="regalos"     && <Regalos data={regalos} setData={setRegalos}/>}
        {tab==="civil"       && <BodaCivil/>}
        {tab==="luna"        && <LunaMiel data={luna} setData={setLuna}/>}
        {tab==="deptos"      && <Departamentos/>}
        {tab==="checklist"   && <CheckList/>}
        {tab==="fotos"       && <Fotos esAdmin={true}/>}
        {tab==="qr"          && <QRInvitados/>}
      </div>

      {/* Barra inferior */}
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:520, background:"#fff", borderTop:"1px solid #f0e0d0", display:"flex", zIndex:100, boxShadow:"0 -2px 12px rgba(180,130,100,.08)" }}>
        {TABS_MAIN.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1, background:"none", border:"none", cursor:"pointer", padding:"10px 2px 8px", display:"flex", flexDirection:"column", alignItems:"center", gap:3, borderTop:tab===t.id?"2px solid #c9956a":"2px solid transparent", fontFamily:"inherit" }}>
            <span style={{ fontSize:18 }}>{t.icon}</span>
            <span style={{ fontSize:9, fontWeight:700, color:tab===t.id?"#c9956a":"#a07855" }}>{t.label}</span>
          </button>
        ))}
        <button onClick={()=>setSidebar(true)} style={{ flex:1, background:"none", border:"none", cursor:"pointer", padding:"10px 2px 8px", display:"flex", flexDirection:"column", alignItems:"center", gap:3, borderTop:SIDEBAR_ITEMS.some(s=>s.id===tab)?"2px solid #c9956a":"2px solid transparent", fontFamily:"inherit" }}>
          <span style={{ fontSize:18, letterSpacing:1 }}>···</span>
          <span style={{ fontSize:9, fontWeight:700, color:SIDEBAR_ITEMS.some(s=>s.id===tab)?"#c9956a":"#a07855" }}>Más</span>
        </button>
      </div>
    </div>
  );
}
