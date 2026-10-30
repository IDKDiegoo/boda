import React, { useState, useEffect, lazy, Suspense } from "react";
import { onMessage } from "firebase/messaging";
import { DOMINIO_USUARIOS, EMAIL_NOVIOS, diasFaltantes, fechaCorta, fijarFecha } from "./base/config";
import { InfoBoda, LEGADO, auth, db, fijarBoda, fijarInfo, infoBoda, messaging } from "./base/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useData } from "./base/hooks";
import { Dashboard } from "./pantallas/Dashboard";
import { Invitados } from "./pantallas/Invitados";
import { PantallaLogin } from "./pantallas/Login";
import { PROVEEDORES_INICIALES, Proveedores } from "./pantallas/Proveedores";
import { Cancion, DecoItem, GastoExtra, Invitado, LunaItem, MesaPos, Proveedor, Regalo } from "./tipos";
import { Cargando, Logo, S } from "./ui/base";
import { Icono } from "./ui/iconos";

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
const Juegos = lazy(() => import("./pantallas/juegos/Juegos").then(m => ({ default: m.Juegos })));
const PanelAdmin = lazy(() => import("./pantallas/admin/PanelAdmin").then(m => ({ default: m.PanelAdmin })));
const MesaInvitados = lazy(() => import("./pantallas/MesaInvitados").then(m => ({ default: m.MesaInvitados })));
const SalaJuego = lazy(() => import("./pantallas/juegos/EnGrupo").then(m => ({ default: m.SalaJuego })));

// ════════════════════════════════════════════════════════════════
// APP
// ════════════════════════════════════════════════════════════════
/** Mientras se revisa la sesión: el logo latiendo (en vez de un «Cargando…» suelto). */
const Bienvenida = () => (
  <div style={{ minHeight:"100vh", display:"grid", placeItems:"center", background:"linear-gradient(160deg,#fff5ee,#fde8d8)" }}>
    <S/><div style={{ animation:"latido 1.6s ease-in-out infinite" }}><Logo tam={84}/></div>
  </div>
);

/** ¿Pantalla de computador? (menú lateral en vez de la barra de abajo) */
function useEsPC() {
  const q = "(min-width: 960px)";
  const [pc, setPc] = useState(() => typeof window !== "undefined" && window.matchMedia(q).matches);
  useEffect(() => { const m = window.matchMedia(q); const f = () => setPc(m.matches); m.addEventListener("change", f); return () => m.removeEventListener("change", f); }, []);
  return pc;
}

type Sesion = { uid:string; usuario:string; rol:"novios"|"superadmin"; bodaId?:string };

/** Carga la ficha de una boda y la deja como la actual (datos, nombre, fecha, módulos). */
async function abrirBoda(id: string): Promise<InfoBoda|null> {
  const s = await getDoc(doc(db, "bodas", id)).catch(() => null);
  if (!s || !s.exists()) return null;
  const i = { id, ...(s.data() as any) } as InfoBoda;
  fijarBoda(id); fijarInfo(i); fijarFecha(i.fecha);
  return i;
}

export default function App() {
  // undefined = todavía no se sabe si hay sesión · null = sin sesión
  const [ses, setSes] = useState<Sesion|null|undefined>(undefined);
  const [boda, setBoda] = useState<InfoBoda|null>(null);
  const [aviso, setAviso] = useState("");
  // El QR de los invitados: ?fotos=1 (boda original) o ?fotos=1&b={boda}. Solo deja subir fotos.
  const qs = new URLSearchParams(window.location.search);
  const qrFotos = qs.get("fotos")==="1" ? (qs.get("b") || LEGADO) : "";
  // El QR de cada mesa (?mesa=5&b={boda}) y el de una partida en grupo (?sala=ABC12): sin cuenta.
  const qrMesa = Number(qs.get("mesa")) || 0;
  const qrSala = (qs.get("sala") || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);

  useEffect(() => onAuthStateChanged(auth, async u => {
    if (!u) { setSes(null); setBoda(null); return; }
    const t = await u.getIdTokenResult(true).catch(() => null);     // permisos frescos (los pone el servidor)
    const c: any = t?.claims || {};
    const usuario = String(u.email || "").replace(DOMINIO_USUARIOS, "");
    if (c.rolBoda === "superadmin") { setSes({ uid:u.uid, usuario, rol:"superadmin" }); return; }
    const bodaId = c.bodaId || (u.email===EMAIL_NOVIOS ? LEGADO : "");
    if (!bodaId) { setAviso("Esta cuenta no tiene una boda asignada."); await signOut(auth); return; }
    const i = await abrirBoda(bodaId);
    if (!i) { setAviso("No encontramos tu boda. Escríbenos para revisarlo."); await signOut(auth); return; }
    if (i.estado === "suspendida") { setAviso("Tu cuenta está suspendida. Escríbenos para reactivarla."); await signOut(auth); return; }
    setBoda(i); setSes({ uid:u.uid, usuario, rol:"novios", bodaId });
  }), []);
  const salir = () => { localStorage.removeItem("boda_acceso"); fijarBoda(""); setBoda(null); signOut(auth); };

  if (qrMesa) { fijarBoda(qs.get("b") || LEGADO); return <Suspense fallback={<Bienvenida/>}><MesaInvitados mesa={qrMesa}/></Suspense>; }
  if (qrSala) return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#fff5ee,#fde8d8)", padding:"16px 16px 40px" }}>
      <S/>
      <div style={{ maxWidth:760, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}><Logo tam={34}/><div style={{ fontFamily:"var(--titulo)", fontSize:21, fontWeight:600, color:"#3b2a21" }}>My Wedding</div></div>
        <Suspense fallback={<Cargando/>}><SalaJuego codigo={qrSala} onSalir={() => { window.location.href = "/"; }}/></Suspense>
      </div>
    </div>
  );
  if (qrFotos) { fijarBoda(qrFotos); return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#fff5ee,#fde8d8)", padding:20 }}>
      <S/>
      <div style={{ maxWidth:480, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          {qrFotos===LEGADO ? <img src="/pareja.jpg" alt="Boda" style={{ width:70, height:70, borderRadius:"50%", objectFit:"cover", border:"3px solid #c9956a" }}/> : <Logo tam={70}/>}
          <div style={{ fontSize:18, color:"#5c3d2e", marginTop:10 }}>{qrFotos===LEGADO ? "Diego & Camila 💍" : "Comparte tus fotos de la boda 💍"}</div>
        </div>
        <Suspense fallback={<Cargando/>}><Fotos esAdmin={false}/></Suspense>
      </div>
    </div>
  ); }
  if (ses===undefined) return <Bienvenida/>;
  if (!ses) return <>{aviso && <div style={{ position:"fixed", top:12, left:12, right:12, zIndex:10, background:"#fff", border:"1px solid #e8a0a0", color:"#a04040", borderRadius:12, padding:"10px 14px", fontSize:13, textAlign:"center", fontFamily:"Georgia,serif" }}>{aviso}</div>}<PantallaLogin onEntrar={()=>setAviso("")}/></>;
  // Superadmin: su panel; al «entrar» a una boda la ve como los novios (modo soporte).
  if (ses.rol==="superadmin" && !boda) return <Suspense fallback={<Cargando/>}><PanelAdmin usuario={ses.usuario} onSalir={salir}
    onEntrar={async id => { const i = await abrirBoda(id); if (i) setBoda(i); }}/></Suspense>;
  if (!boda) return <Bienvenida/>;
  return <Panel key={boda.id} soporte={ses.rol==="superadmin"} onSalir={ses.rol==="superadmin" ? () => { fijarBoda(""); setBoda(null); } : salir}/>;
}

// El panel de los novios. Va aparte para que sus datos se pidan recién con la sesión abierta
// (antes de entrar, las reglas de la base no dejan leer nada).
function Panel({ onSalir, soporte }: { onSalir:()=>void; soporte?:boolean }) {
  // Módulos que compró esta pareja (la boda original los tiene todos)
  const info = infoBoda();
  const mod = (m:string) => !!info.legado || !!(info.modulos||{})[m];
  const MODULO: Record<string,string> = { dashboard:"organizacion", invitados:"organizacion", mesas:"organizacion", presupuesto:"organizacion",
    proveedores:"organizacion", decoraciones:"organizacion", programa:"organizacion", regalos:"organizacion", checklist:"organizacion",
    civil:"invitaciones", luna:"luna", deptos:"_legado", juegos:"juegos", fotos:"fotos", qr:"fotos" };
  const visible = (id:string) => MODULO[id]==="_legado" ? !!info.legado : mod(MODULO[id]);
  const esPC = useEsPC();
  const [tab, setTab]     = useState(() => ["dashboard","civil","fotos","juegos","luna"].find(visible) || "dashboard");
  const [sidebar, setSidebar] = useState(false);

  const [invitados,   setInvitados]   = useData<{invitados:Invitado[]}>("invitados",   {invitados:[]});
  const [proveedores, setProveedores] = useData<{proveedores:Proveedor[]}>("proveedores",{proveedores:PROVEEDORES_INICIALES});
  const [gastos,      setGastos]      = useData<{gastos:GastoExtra[]}>("gastos",        {gastos:[]});
  const [canciones,   setCanciones]   = useData<{canciones:Cancion[]}>("canciones",     {canciones:[]});
  const [regalos,     setRegalos]     = useData<{regalos:Regalo[]}>("regalos",          {regalos:[]});
  const [luna,        setLuna]        = useData<{items:LunaItem[]}>("luna",              {items:[]});
  const [mesasPosData,setMesasPosData]= useData<{mesas:MesaPos[]}>("mesaspos",           {mesas:[]});
  const [decoraciones,setDecoraciones]= useData<{items:DecoItem[]}>("decoraciones",       {items:[]});

  // Notificaciones en primer plano
  useEffect(() => {
    if (!messaging) return;
    const unsub = onMessage(messaging, payload => {
      const title = payload.notification?.title || "💍 Boda";
      const body  = payload.notification?.body  || "";
      alert(`${title}\n${body}`);
    });
    return unsub;
  }, []);
  const logout = onSalir;

  const TODOS_MAIN = [
    { id:"dashboard",   icon:"inicio",      label:"Inicio" },
    { id:"invitados",   icon:"invitados",   label:"Invitados" },
    { id:"mesas",       icon:"mesas",       label:"Mesas" },
    { id:"presupuesto", icon:"presupuesto", label:"Presupuesto" },
  ];
  const TODOS_SIDEBAR = [
    { id:"civil",        icon:"invitaciones", label:info.legado ? "Boda Civil" : "Invitaciones", desc:info.legado ? "Invitados, comida y gastos" : "Diseño, links por invitado y respuestas" },
    { id:"proveedores",  icon:"proveedores",  label:"Proveedores",   desc:"Fotógrafo, animador, etc." },
    { id:"checklist",    icon:"pendientes",   label:"Pendientes",    desc:"Tareas y cosas por hacer" },
    { id:"programa",     icon:"musica",       label:"Programa",      desc:"Canciones, juegos, actividades" },
    { id:"decoraciones", icon:"decoraciones", label:"Decoraciones",  desc:"Lista de compras y referencias" },
    { id:"regalos",      icon:"regalos",      label:"Regalos",       desc:"Lista de regalos" },
    { id:"luna",         icon:"luna",         label:"Luna de Miel",  desc:"Viaje y actividades" },
    { id:"juegos",       icon:"juegos",       label:"Juegos",        desc:"Para la fiesta y en pareja" },
    { id:"fotos",        icon:"galeria",      label:"Galería",       desc:"Fotos de la boda" },
    { id:"qr",           icon:"qr",           label:"QR Invitados",  desc:"Código para subir fotos" },
    { id:"deptos",       icon:"deptos",       label:"Departamentos", desc:"Proyectos en Quilicura / metro L3" },
  ];
  // Sin el módulo de organización, la barra de abajo muestra lo que sí tiene.
  const conAcceso = [...TODOS_MAIN, ...TODOS_SIDEBAR].filter(t => visible(t.id));
  const TABS_MAIN = mod("organizacion") ? TODOS_MAIN : conAcceso.slice(0, 4);
  const SIDEBAR_ITEMS = conAcceso.filter(t => !TABS_MAIN.some(m => m.id===t.id)) as typeof TODOS_SIDEBAR;
  const ir = (id:string) => { setTab(id); setSidebar(false); window.scrollTo({ top:0, behavior:"smooth" }); };
  const actual = conAcceso.find(t => t.id===tab);
  const enMas = SIDEBAR_ITEMS.some(s=>s.id===tab);

  const pantalla = (
    <div key={tab} className="mw-pantalla">
      <Suspense fallback={<Cargando/>}>
        {!visible(tab) ? <div style={{ textAlign:"center", color:"#a07855", fontSize:13, padding:40 }}>Esta sección no está incluida en tu plan.</div> : <>
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
        {tab==="juegos"      && <Juegos adultos={mod("juegosAdultos")}/>}
        {tab==="fotos"       && <Fotos esAdmin={true}/>}
        {tab==="qr"          && <QRInvitados/>}
        </>}
      </Suspense>
    </div>
  );

  // ── Computador: menú lateral fijo + contenido ancho ──
  if (esPC) return (
    <div style={{ minHeight:"100vh", background:"var(--crema)", display:"grid", gridTemplateColumns:"272px 1fr" }}>
      <S/>
      <aside style={{ position:"sticky", top:0, height:"100vh", background:"var(--papel)", borderRight:"1px solid var(--borde)", display:"flex", flexDirection:"column", padding:"22px 14px 16px", gap:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"0 8px" }}>
          <Logo tam={34}/>
          <div style={{ fontFamily:"var(--titulo)", fontSize:22, fontWeight:600, color:"var(--tinta)" }}>My Wedding</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:11, background:"linear-gradient(135deg,#fbf1e8,#f5e3d3)", border:"1px solid #f0dcc9", borderRadius:14, padding:"12px 12px" }}>
          <div style={{ minWidth:0 }}>
            <div style={{ fontFamily:"var(--titulo)", fontSize:18, fontWeight:600, color:"var(--tinta)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{info.nombre}</div>
            <div style={{ fontSize:11, color:"var(--suave)", letterSpacing:".04em" }}>{fechaCorta()} · {diasFaltantes()} días</div>
          </div>
        </div>
        <nav style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:2, margin:"0 -4px", padding:"0 4px" }}>
          {conAcceso.map((t, k) => { const act = tab===t.id; const corte = k===TABS_MAIN.length && mod("organizacion"); return (
            <React.Fragment key={t.id}>
              {corte && <div style={{ height:1, background:"var(--borde)", margin:"8px 10px" }}/>}
              <button onClick={()=>ir(t.id)} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:11, border:"none", cursor:"pointer", textAlign:"left",
                background:act ? "linear-gradient(90deg,#f7e6d7,#fbf1e8)" : "transparent", color:act ? "var(--dorado-osc)" : "var(--cafe)", fontSize:14, fontWeight:act?600:500, position:"relative" }}>
                {act && <span style={{ position:"absolute", left:0, top:8, bottom:8, width:3, borderRadius:3, background:"var(--dorado)" }}/>}
                <Icono n={t.icon} tam={19}/>{t.label}
              </button>
            </React.Fragment>); })}
        </nav>
        <button onClick={logout} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:11, border:"1px solid var(--borde)", background:"transparent", color:"var(--suave)", fontSize:13, cursor:"pointer" }}>
          <Icono n={soporte ? "volver" : "salir"} tam={17}/>{soporte ? "Volver al panel" : "Cerrar sesión"}
        </button>
      </aside>
      <main style={{ minWidth:0 }}>
        {soporte && <div style={{ background:"var(--cafe)", color:"#fff", fontSize:12, textAlign:"center", padding:"7px 10px" }}>Modo soporte: estás viendo la boda de {info.nombre} como superadmin</div>}
        <div style={{ maxWidth:1040, margin:"0 auto", padding:"30px 36px 60px" }}>{pantalla}</div>
      </main>
    </div>
  );

  // ── Celular ──
  return (
    <div style={{ minHeight:"100vh", background:"var(--crema)", display:"flex", flexDirection:"column", maxWidth:620, margin:"0 auto" }}>
      <S/>
      {/* Encabezado */}
      <header style={{ position:"sticky", top:0, zIndex:100, background:"rgba(255,253,251,.86)", backdropFilter:"saturate(1.4) blur(14px)", WebkitBackdropFilter:"saturate(1.4) blur(14px)",
        borderBottom:"1px solid var(--borde)", padding:"10px 16px", paddingTop:"calc(10px + env(safe-area-inset-top, 0px))", display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
          <Logo tam={38}/>
          <div style={{ minWidth:0 }}>
            <div style={{ fontFamily:"var(--titulo)", fontSize:19, fontWeight:600, color:"var(--tinta)", lineHeight:1.1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{info.nombre}</div>
            <div style={{ fontSize:10, color:"var(--tenue)", letterSpacing:".08em", marginTop:2 }}>{fechaCorta()} · {diasFaltantes()} días</div>
          </div>
        </div>
        <button onClick={logout} aria-label={soporte ? "Volver al panel" : "Cerrar sesión"} style={{ width:38, height:38, display:"grid", placeItems:"center", flexShrink:0, background:"transparent", border:"1px solid var(--borde)", borderRadius:11, color:"var(--suave)", cursor:"pointer" }}>
          <Icono n={soporte ? "volver" : "salir"} tam={18}/>
        </button>
      </header>
      {soporte && <div style={{ background:"var(--cafe)", color:"#fff", fontSize:11, textAlign:"center", padding:"6px 10px" }}>Modo soporte: estás viendo la boda de {info.nombre} como superadmin</div>}

      {/* Más secciones: hoja que sube desde abajo */}
      {sidebar && (
        <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(59,42,33,.32)", animation:"velo .2s ease" }} onClick={()=>setSidebar(false)}>
          <div onClick={e=>e.stopPropagation()} style={{ position:"absolute", left:0, right:0, bottom:0, maxWidth:620, margin:"0 auto", background:"var(--papel)", borderRadius:"24px 24px 0 0",
            padding:"10px 16px calc(20px + env(safe-area-inset-bottom, 0px))", animation:"subir .28s cubic-bezier(.2,.8,.3,1)", boxShadow:"0 -12px 40px rgba(59,42,33,.18)", maxHeight:"82vh", overflowY:"auto" }}>
            <div style={{ width:40, height:4, borderRadius:4, background:"#e8d5c4", margin:"0 auto 14px" }}/>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14, padding:"0 4px" }}>
              <div style={{ fontFamily:"var(--titulo)", fontSize:22, fontWeight:600, color:"var(--tinta)" }}>Más secciones</div>
              <button onClick={()=>setSidebar(false)} aria-label="Cerrar" style={{ width:34, height:34, display:"grid", placeItems:"center", background:"#f8efe7", border:"none", borderRadius:10, color:"var(--suave)", cursor:"pointer" }}><Icono n="cerrar" tam={16}/></button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
              {SIDEBAR_ITEMS.map(s=>{ const act = tab===s.id; return (
                <button key={s.id} onClick={()=>ir(s.id)} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, padding:"16px 6px 12px", borderRadius:16, cursor:"pointer",
                  background:act ? "linear-gradient(135deg,#f7e6d7,#fbf1e8)" : "#fdf8f3", border:`1px solid ${act ? "#ecd3bd" : "var(--borde)"}`, color:act ? "var(--dorado-osc)" : "var(--cafe)" }}>
                  <span style={{ width:44, height:44, borderRadius:14, display:"grid", placeItems:"center", background:"#fff", border:"1px solid var(--borde)", color:"var(--dorado-osc)" }}><Icono n={s.icon} tam={22}/></span>
                  <span style={{ fontSize:12, fontWeight:600, textAlign:"center", lineHeight:1.2 }}>{s.label}</span>
                </button>); })}
            </div>
          </div>
        </div>
      )}

      {/* Contenido */}
      <div style={{ flex:1, padding:"18px 16px calc(96px + env(safe-area-inset-bottom, 0px))" }}>{pantalla}</div>

      {/* Barra inferior */}
      <nav style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:620, zIndex:100,
        background:"rgba(255,253,251,.92)", backdropFilter:"saturate(1.4) blur(14px)", WebkitBackdropFilter:"saturate(1.4) blur(14px)", borderTop:"1px solid var(--borde)",
        display:"flex", padding:"6px 6px calc(6px + env(safe-area-inset-bottom, 0px))" }}>
        {[...TABS_MAIN, ...(SIDEBAR_ITEMS.length ? [{ id:"__mas", icon:"menu", label:"Más" }] : [])].map(t=>{ const act = t.id==="__mas" ? (enMas || sidebar) : tab===t.id; return (
          <button key={t.id} onClick={()=> t.id==="__mas" ? setSidebar(true) : ir(t.id)} aria-label={t.label}
            style={{ flex:1, background:"none", border:"none", cursor:"pointer", padding:"6px 2px 4px", display:"flex", flexDirection:"column", alignItems:"center", gap:3, color:act ? "var(--dorado-osc)" : "#b59a80" }}>
            <span style={{ width:46, height:30, borderRadius:12, display:"grid", placeItems:"center", background:act ? "#f7e6d7" : "transparent", transition:"background-color .25s ease" }}><Icono n={t.icon} tam={21} grosor={act ? 2 : 1.7}/></span>
            <span style={{ fontSize:10.5, fontWeight:act ? 600 : 500 }}>{t.id==="__mas" && enMas && actual ? actual.label : t.label}</span>
          </button>); })}
      </nav>
    </div>
  );
}
