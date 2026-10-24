import { useState, useEffect, lazy, Suspense } from "react";
import { onMessage } from "firebase/messaging";
import { diasFaltantes } from "./base/config";
import { initFCM, messaging } from "./base/firebase";
import { useData } from "./base/hooks";
import { Dashboard } from "./pantallas/Dashboard";
import { Invitados } from "./pantallas/Invitados";
import { PantallaLogin } from "./pantallas/Login";
import { PROVEEDORES_INICIALES, Proveedores } from "./pantallas/Proveedores";
import { Cancion, DecoItem, GastoExtra, Invitado, LunaItem, MesaPos, Proveedor, Regalo } from "./tipos";
import { S } from "./ui/base";

// Carga diferida: cada pantalla se descarga recién cuando se abre (antes bajaba todo de una).
const CheckList = lazy(() => import("./pantallas/CheckList").then(m => ({ default: m.CheckList })));
const Decoraciones = lazy(() => import("./pantallas/Decoraciones").then(m => ({ default: m.Decoraciones })));
const Departamentos = lazy(() => import("./pantallas/Departamentos").then(m => ({ default: m.Departamentos })));
const Fotos = lazy(() => import("./pantallas/Fotos").then(m => ({ default: m.Fotos })));
const Mesas = lazy(() => import("./pantallas/Mesas").then(m => ({ default: m.Mesas })));
const Presupuesto = lazy(() => import("./pantallas/Presupuesto").then(m => ({ default: m.Presupuesto })));
const Programa = lazy(() => import("./pantallas/Programa").then(m => ({ default: m.Programa })));
const Regalos = lazy(() => import("./pantallas/Regalos").then(m => ({ default: m.Regalos })));
const BodaCivil = lazy(() => import("./pantallas/civil/BodaCivil").then(m => ({ default: m.BodaCivil })));
const LunaMiel = lazy(() => import("./pantallas/luna/LunaMiel").then(m => ({ default: m.LunaMiel })));
const QRInvitados = lazy(() => import("./pantallas/QRInvitados").then(m => ({ default: m.QRInvitados })));
const Cargando = () => <div style={{ textAlign:"center", padding:40, color:"#c4a882", fontSize:13 }}>Cargando…</div>;

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
        <Suspense fallback={<Cargando/>}><Fotos esAdmin={false}/></Suspense>
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
        <Suspense fallback={<Cargando/>}>
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
        </Suspense>
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
