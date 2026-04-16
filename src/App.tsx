import React, { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, listAll, deleteObject } from "firebase/storage";

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

// ── Constantes ──────────────────────────────────────────────────
const BODA_FECHA   = new Date("2027-11-27T19:00:00");
const ACCESO_PIN   = "2711";
const FOTOS_PIN    = "BODA27";

// ── Helpers ─────────────────────────────────────────────────────
const fmt = (n: number) => "$" + n.toLocaleString("es-CL");
const diasFaltantes = () => Math.ceil((BODA_FECHA.getTime() - Date.now()) / 86400000);

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
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    dragRef.current = { id:mesa.id, startX:clientX, startY:clientY, origX:mesa.x, origY:mesa.y, moved:false };
  };

  const moveDrag = (e:React.TouchEvent|React.MouseEvent) => {
    if (!dragRef.current||!roomRef.current) return;
    if ("touches" in e) e.preventDefault();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const dx = clientX - dragRef.current.startX;
    const dy = clientY - dragRef.current.startY;
    if (Math.abs(dx)>5||Math.abs(dy)>5) dragRef.current.moved = true;
    const roomW = roomRef.current.offsetWidth;
    const newX  = Math.max(TR, Math.min(roomW-TR, dragRef.current.origX+dx));
    const newY  = Math.max(TR, Math.min(RoomH-TR, dragRef.current.origY+dy));
    setLocalMesas(prev=>prev.map(m=>m.id===dragRef.current!.id?{...m,x:newX,y:newY}:m));
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
  const guardar = () => {
    if (!form.titulo) return;
    setCanciones({canciones:[...lista,{id:Date.now(),titulo:form.titulo!,artista:form.artista||"",momento:form.momento||"Baile general",link:form.link||""}]});
    setForm({momento:"Baile general"}); setShow(false);
  };
  const linkIcon = (url:string) => url.includes("spotify")?"🎧":url.includes("youtube")||url.includes("youtu.be")?"▶️":"🔗";
  const eliminar = (id:number) => setCanciones({canciones:lista.filter(c=>c.id!==id)});

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
                      <a href={c.link} target="_blank" rel="noreferrer" style={{ background:"#f5e8dc", border:"1px solid #e8d5c4", borderRadius:8, padding:"4px 10px", fontSize:16, textDecoration:"none", display:"flex", alignItems:"center" }}>{linkIcon(c.link)}</a>
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

function LunaMiel({ data, setData }: { data:{items:LunaItem[]}; setData:(d:any)=>void }) {
  const lista = data.items || [];
  const [form, setForm] = useState<Partial<LunaItem>>({ categoria:"Vuelos" });
  const [show, setShow] = useState(false);
  const total  = lista.reduce((s,i)=>s+i.monto,0);
  const pagado = lista.filter(i=>i.confirmado).reduce((s,i)=>s+i.monto,0);

  const guardar = () => {
    if (!form.descripcion) return;
    setData({items:[...lista,{id:Date.now(),categoria:form.categoria||"Otro",descripcion:form.descripcion!,monto:Number(form.monto)||0,confirmado:false,notas:form.notas||""}]});
    setForm({categoria:"Vuelos"}); setShow(false);
  };
  const toggle   = (id:number) => setData({items:lista.map(i=>i.id===id?{...i,confirmado:!i.confirmado}:i)});
  const eliminar = (id:number) => setData({items:lista.filter(i=>i.id!==id)});

  return (
    <div style={{ animation:"fadeUp .3s ease" }}>
      <Title icon="✈️" title="Luna de Miel"/>
      <Card style={{ background:"linear-gradient(135deg,#e8f4ff,#d8e8ff)", marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between" }}>
          <div><div style={{ fontSize:12, color:"#7090c0" }}>Total</div><div style={{ fontSize:24, fontWeight:700, color:"#4070b0" }}>{fmt(total)}</div></div>
          <div><div style={{ fontSize:12, color:"#7090c0" }}>Confirmado</div><div style={{ fontSize:24, fontWeight:700, color:"#6aaa96" }}>{fmt(pagado)}</div></div>
        </div>
      </Card>
      {show && (
        <Card style={{ marginBottom:16, border:"2px solid #e8d5c4" }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#5c3d2e", marginBottom:14 }}>Nuevo ítem</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <Sel value={form.categoria||"Vuelos"} onChange={v=>setForm({...form,categoria:v})} options={CATS_LUNA.map(c=>({value:c,label:c}))}/>
            <Inp value={form.descripcion||""} onChange={v=>setForm({...form,descripcion:v})} placeholder="Descripción"/>
            <Inp value={form.monto?.toString()||""} onChange={v=>setForm({...form,monto:Number(v)})} placeholder="Costo ($)" type="number"/>
            <Inp value={form.notas||""} onChange={v=>setForm({...form,notas:v})} placeholder="Notas (fechas, referencias, etc.)"/>
          </div>
          <div style={{ display:"flex", gap:8, marginTop:14 }}>
            <Btn onClick={guardar}>Guardar</Btn>
            <Btn onClick={()=>{setShow(false);setForm({categoria:"Vuelos"});}} outline>Cancelar</Btn>
          </div>
        </Card>
      )}
      {!show && <Btn onClick={()=>setShow(true)} style={{ marginBottom:16 }}>+ Agregar</Btn>}
      {CATS_LUNA.map(cat=>{
        const items = lista.filter(i=>i.categoria===cat);
        if (!items.length) return null;
        return (
          <div key={cat} style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#7090c0", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.08em" }}>{cat}</div>
            {items.map(i=>(
              <Card key={i.id} style={{ padding:14, marginBottom:8, background:i.confirmado?"#f0f8f4":"#fff" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#5c3d2e" }}>{i.descripcion}</div>
                    {i.notas && <div style={{ fontSize:11, color:"#a07855", marginTop:2 }}>{i.notas}</div>}
                    <div style={{ fontSize:14, fontWeight:700, color:"#4070b0", marginTop:4 }}>{fmt(i.monto)}</div>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={()=>toggle(i.id)} style={{ background:i.confirmado?"#e8f5ec":"none", border:`1px solid ${i.confirmado?"#6aaa96":"#e8d5c4"}`, borderRadius:6, padding:"4px 8px", fontSize:11, color:i.confirmado?"#6aaa96":"#a07855", cursor:"pointer", fontFamily:"inherit" }}>{i.confirmado?"✓":"Confirmar"}</button>
                    <button onClick={()=>eliminar(i.id)} style={{ background:"none", border:"none", color:"#e07070", cursor:"pointer", fontSize:14 }}>🗑</button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        );
      })}
      {lista.length===0 && <div style={{ textAlign:"center", color:"#c4a882", padding:32 }}>Agrega los planes para tu luna de miel ✈️</div>}
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

  const subir = async (files:FileList|null) => {
    if (!files||!files.length) return;
    setSubiendo(true);
    try {
      let n=0;
      for (const f of Array.from(files)) {
        setProgreso(`Subiendo ${++n}/${files.length}...`);
        await withTimeout(uploadBytes(ref(stor,`fotos-boda/${Date.now()}_${f.name}`), f));
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

  const login = (tipo:"admin"|"fotos") => {
    setAcceso(tipo);
    if (tipo==="admin") localStorage.setItem("boda_acceso","admin");
    if (tipo==="fotos") setTab("fotos");
  };
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
    { id:"proveedores", icon:"🤝", label:"Proveedores",  desc:"Fotógrafo, animador, etc." },
    { id:"programa",    icon:"🎵", label:"Programa",     desc:"Canciones, juegos, actividades" },
    { id:"regalos",     icon:"🎁", label:"Regalos",      desc:"Lista de regalos" },
    { id:"luna",        icon:"✈️", label:"Luna de Miel", desc:"Viaje y actividades" },
    { id:"fotos",       icon:"📷", label:"Galería",      desc:"Fotos de la boda" },
    { id:"qr",          icon:"📱", label:"QR Invitados", desc:"Código para subir fotos" },
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
        {tab==="proveedores" && <Proveedores data={proveedores} setData={setProveedores}/>}
        {tab==="programa"    && <Programa canciones={canciones} setCanciones={setCanciones}/>}
        {tab==="regalos"     && <Regalos data={regalos} setData={setRegalos}/>}
        {tab==="luna"        && <LunaMiel data={luna} setData={setLuna}/>}
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
