import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";
import { MARCA } from "../../base/config";
import { auth, db } from "../../base/firebase";
import { Logo, S } from "../../ui/base";

// ═══════════════════════════════════════════════════════════════════
// PANEL DEL SUPERADMIN (My Wedding): las parejas que compraron la app, qué módulos tiene cada
// una, sus cuentas y el estado. Crear cuentas, claves y suspender pasan por /api/admin (el
// servidor); los módulos y la ficha se guardan directo (las reglas solo dejan al superadmin).
// ═══════════════════════════════════════════════════════════════════

export const MODULOS: { id: string; nombre: string; desc: string }[] = [
  { id: "invitaciones", nombre: "💌 Invitaciones", desc: "Invitación con canción y colores, link por invitado y respuestas" },
  { id: "organizacion", nombre: "👥 Organización", desc: "Invitados, mesas, presupuesto, proveedores, checklist, programa, regalos" },
  { id: "fotos", nombre: "📷 Fotos", desc: "QR para que los invitados suban fotos y galería" },
  { id: "luna", nombre: "✈️ Luna de miel", desc: "Viaje, itinerario y presupuesto" },
  { id: "juegos", nombre: "🎲 Juegos", desc: "Para la fiesta y en pareja" },
  { id: "juegosAdultos", nombre: "🔥 Juegos +18", desc: "Verdad o reto picante (extra)" },
];
const PLANES: { nombre: string; modulos: string[] }[] = [
  { nombre: "Completo", modulos: MODULOS.map(m => m.id) },
  { nombre: "Solo invitaciones", modulos: ["invitaciones"] },
  { nombre: "Invitaciones + organización", modulos: ["invitaciones", "organizacion", "fotos"] },
];

type Boda = { id: string; nombre: string; fecha?: string; estado?: string; modulos?: Record<string, boolean>; legado?: boolean; creada?: string; notas?: string };
type Cuenta = { id: string; usuario: string; nombre?: string; bodaId?: string; rolBoda?: string };

const C = { cafe: "#5c3d2e", dorado: "#c9956a", suave: "#a07855", borde: "#f0e0d0", crema: "#fdf8f3" };
const inp: React.CSSProperties = { background: C.crema, border: `1.5px solid #e8d5c4`, borderRadius: 9, padding: "9px 12px", fontSize: 13, color: C.cafe, width: "100%", outline: "none", fontFamily: "inherit" };
const btn = (color = C.dorado, claro = false): React.CSSProperties => ({ background: claro ? "#fff" : color, color: claro ? color : "#fff", border: `1.5px solid ${color}`, borderRadius: 9, padding: "8px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" });

async function api(cuerpo: object) {
  const token = await auth.currentUser?.getIdToken();
  const r = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(cuerpo) });
  const d = await r.json().catch(() => ({ error: "El servidor no respondió bien." }));
  if (!r.ok) throw new Error(d.error || "No se pudo hacer.");
  return d;
}
const fechaTxt = (f?: string) => { if (!f) return "Sin fecha"; const d = new Date(f); return isNaN(d.getTime()) ? f : d.toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" }); };

export function PanelAdmin({ usuario, onSalir, onEntrar }: { usuario: string; onSalir: () => void; onEntrar: (id: string) => void }) {
  const [bodas, setBodas] = useState<Boda[]>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [nueva, setNueva] = useState(false);
  const [aviso, setAviso] = useState<{ t: string; ok: boolean } | null>(null);
  const [busca, setBusca] = useState("");
  useEffect(() => {
    const a = onSnapshot(collection(db, "bodas"), s => setBodas(s.docs.map(d => ({ id: d.id, ...(d.data() as any) }))), () => setAviso({ t: "No se pudieron leer las bodas.", ok: false }));
    const b = onSnapshot(collection(db, "usuarios_boda"), s => setCuentas(s.docs.map(d => ({ id: d.id, ...(d.data() as any) }))), () => {});
    return () => { a(); b(); };
  }, []);
  const avisar = (t: string, ok = true) => { setAviso({ t, ok }); setTimeout(() => setAviso(null), 5000); };
  const lista = bodas.filter(b => !busca || `${b.nombre} ${b.id}`.toLowerCase().includes(busca.toLowerCase()))
    .sort((a, b) => (a.legado ? -1 : b.legado ? 1 : String(b.creada || "").localeCompare(String(a.creada || ""))));
  const activas = bodas.filter(b => b.estado !== "suspendida").length;

  return (
    <div style={{ minHeight: "100vh", background: C.crema, fontFamily: "Georgia,serif", maxWidth: 720, margin: "0 auto", paddingBottom: 40 }}>
      <S/>
      <div style={{ background: "#fff", borderBottom: `1px solid ${C.borde}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, zIndex: 5 }}>
        <Logo tam={38}/>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.cafe }}>{MARCA} · Panel</div>
          <div style={{ fontSize: 10, color: C.suave }}>Superadmin · {usuario}</div>
        </div>
        <button onClick={onSalir} style={btn(C.suave, true)}>Salir</button>
      </div>

      {aviso && <div style={{ margin: "12px 16px 0", background: aviso.ok ? "#eef6ef" : "#fbeeee", border: `1px solid ${aviso.ok ? "#9cc5a3" : "#e0a0a0"}`, color: aviso.ok ? "#2f6b3c" : "#a04040", borderRadius: 10, padding: "10px 12px", fontSize: 13 }}>{aviso.t}</div>}

      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {[["Bodas", bodas.length], ["Activas", activas], ["Suspendidas", bodas.length - activas]].map(([l, v]) => (
            <div key={l as string} style={{ background: "#fff", border: `1px solid ${C.borde}`, borderRadius: 14, padding: "12px 14px" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: C.cafe, fontVariantNumeric: "tabular-nums" }}>{v}</div>
              <div style={{ fontSize: 11, color: C.suave }}>{l}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <input id="adm-busca" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar pareja…" style={inp}/>
          <button onClick={() => setNueva(v => !v)} style={{ ...btn(), whiteSpace: "nowrap" }}>{nueva ? "Cerrar" : "+ Nueva boda"}</button>
        </div>

        {nueva && <NuevaBoda onLista={(id, nombre) => { setNueva(false); avisar(`✓ Boda de ${nombre} creada (${id}). Ya pueden entrar con sus usuarios.`); }} onError={t => avisar(t, false)}/>}

        {lista.map(b => <FichaBoda key={b.id} b={b} cuentas={cuentas.filter(c => c.bodaId === b.id)} avisar={avisar} onEntrar={() => onEntrar(b.id)}/>)}
        {!lista.length && <div style={{ textAlign: "center", color: C.suave, fontSize: 13, padding: 30 }}>No hay bodas que coincidan.</div>}
      </div>
    </div>
  );
}

function NuevaBoda({ onLista, onError }: { onLista: (id: string, nombre: string) => void; onError: (t: string) => void }) {
  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState("");
  const [mods, setMods] = useState<string[]>(PLANES[0].modulos);
  const [us, setUs] = useState([{ usuario: "", clave: "", nombre: "" }, { usuario: "", clave: "", nombre: "" }]);
  const [enviando, setEnviando] = useState(false);
  const crear = async () => {
    setEnviando(true);
    try {
      const r = await api({ accion: "crearBoda", nombre, fecha: fecha ? `${fecha}T19:00:00` : "", modulos: Object.fromEntries(mods.map(m => [m, true])), usuarios: us.filter(u => u.usuario.trim()) });
      onLista(r.id, nombre);
    } catch (e: any) { onError(e.message); } finally { setEnviando(false); }
  };
  return (
    <div style={{ background: "#fff", border: `2px solid ${C.dorado}55`, borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.cafe }}>Nueva boda</div>
      <input id="nb-nombre" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre de la pareja (ej: Ana & Beto)" style={inp}/>
      <label style={{ fontSize: 12, color: C.suave }}>Fecha de la boda
        <input id="nb-fecha" type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={{ ...inp, marginTop: 4 }}/></label>
      <div style={{ fontSize: 12, color: C.suave }}>Plan</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {PLANES.map(p => <button key={p.nombre} onClick={() => setMods(p.modulos)} style={btn(C.dorado, JSON.stringify([...mods].sort()) !== JSON.stringify([...p.modulos].sort()))}>{p.nombre}</button>)}
      </div>
      <Modulos activos={Object.fromEntries(mods.map(m => [m, true]))} onCambiar={(m, v) => setMods(v ? [...mods, m] : mods.filter(x => x !== m))}/>
      <div style={{ fontSize: 12, color: C.suave }}>Usuarios de la pareja (el segundo es opcional)</div>
      {us.map((u, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          <input id={`nb-u${i}`} value={u.usuario} onChange={e => setUs(us.map((x, j) => j === i ? { ...x, usuario: e.target.value.trim().toLowerCase() } : x))} placeholder="usuario" style={inp} autoCapitalize="none"/>
          <input id={`nb-c${i}`} value={u.clave} onChange={e => setUs(us.map((x, j) => j === i ? { ...x, clave: e.target.value } : x))} placeholder="clave (6+)" style={inp}/>
          <input id={`nb-n${i}`} value={u.nombre} onChange={e => setUs(us.map((x, j) => j === i ? { ...x, nombre: e.target.value } : x))} placeholder="nombre" style={inp}/>
        </div>
      ))}
      <button disabled={enviando || !nombre.trim() || !us[0].usuario} onClick={crear} style={{ ...btn(), padding: "11px", opacity: enviando || !nombre.trim() || !us[0].usuario ? .5 : 1 }}>{enviando ? "Creando…" : "Crear boda y usuarios"}</button>
    </div>
  );
}

function Modulos({ activos, onCambiar, deshabilitado }: { activos: Record<string, boolean>; onCambiar: (m: string, v: boolean) => void; deshabilitado?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {MODULOS.map(m => (
        <label key={m.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: deshabilitado ? "default" : "pointer", opacity: deshabilitado ? .6 : 1 }}>
          <input type="checkbox" checked={!!activos[m.id]} disabled={deshabilitado} onChange={e => onCambiar(m.id, e.target.checked)} style={{ width: 18, height: 18, marginTop: 1, accentColor: C.dorado }}/>
          <span><span style={{ fontSize: 13, fontWeight: 700, color: C.cafe }}>{m.nombre}</span><span style={{ display: "block", fontSize: 11, color: C.suave }}>{m.desc}</span></span>
        </label>
      ))}
    </div>
  );
}

function FichaBoda({ b, cuentas, avisar, onEntrar }: { b: Boda; cuentas: Cuenta[]; avisar: (t: string, ok?: boolean) => void; onEntrar: () => void }) {
  const [abierta, setAbierta] = useState(false);
  const [clave, setClave] = useState<Record<string, string>>({});
  const [nu, setNu] = useState({ usuario: "", clave: "", nombre: "" });
  const [ocupado, setOcupado] = useState("");
  const susp = b.estado === "suspendida";
  const mods = b.modulos || {};
  const hacer = async (que: string, f: () => Promise<any>, ok: string) => { setOcupado(que); try { await f(); avisar(ok); } catch (e: any) { avisar(e.message, false); } finally { setOcupado(""); } };
  const cambiarModulo = (m: string, v: boolean) => hacer("mod", () => setDoc(doc(db, "bodas", b.id), { modulos: { ...mods, [m]: v } }, { merge: true }), `✓ ${b.nombre}: ${MODULOS.find(x => x.id === m)?.nombre} ${v ? "activado" : "desactivado"}`);
  return (
    <div style={{ background: "#fff", border: `1px solid ${susp ? "#e0a0a0" : C.borde}`, borderRadius: 16, overflow: "hidden" }}>
      <button onClick={() => setAbierta(v => !v)} style={{ width: "100%", background: "none", border: "none", textAlign: "left", padding: "14px 16px", cursor: "pointer", fontFamily: "inherit", display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.cafe }}>{b.nombre}</span>
            {b.legado && <span style={{ fontSize: 9, fontWeight: 800, color: C.dorado, border: `1px solid ${C.dorado}66`, borderRadius: 20, padding: "1px 7px" }}>ORIGINAL</span>}
            <span style={{ fontSize: 9, fontWeight: 800, borderRadius: 20, padding: "1px 7px", color: susp ? "#a04040" : "#2f6b3c", background: susp ? "#fbeeee" : "#eef6ef" }}>{susp ? "SUSPENDIDA" : "ACTIVA"}</span>
          </div>
          <div style={{ fontSize: 11, color: C.suave, marginTop: 2 }}>{fechaTxt(b.fecha)} · {cuentas.length} usuario{cuentas.length === 1 ? "" : "s"} · {MODULOS.filter(m => mods[m.id]).length} módulos</div>
        </div>
        <span style={{ color: C.suave }}>{abierta ? "▲" : "▼"}</span>
      </button>
      {abierta && (
        <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 12, borderTop: `1px solid ${C.borde}` }}>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <button onClick={onEntrar} style={btn()}>Entrar a su app (soporte)</button>
            {!b.legado && <button disabled={!!ocupado} onClick={() => hacer("est", () => api({ accion: "estado", bodaId: b.id, estado: susp ? "activa" : "suspendida" }), susp ? `✓ ${b.nombre} reactivada` : `✓ ${b.nombre} suspendida: sus cuentas ya no pueden entrar`)} style={btn(susp ? "#2f6b3c" : "#a04040", true)}>{susp ? "Reactivar" : "Suspender"}</button>}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.cafe }}>Módulos</div>
          {b.legado ? <div style={{ fontSize: 12, color: C.suave }}>La boda original tiene todo incluido.</div> : <Modulos activos={mods} onCambiar={cambiarModulo} deshabilitado={ocupado === "mod"}/>}
          <div style={{ fontSize: 12, fontWeight: 700, color: C.cafe }}>Usuarios</div>
          {cuentas.map(c => (
            <div key={c.id} style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", background: C.crema, borderRadius: 10, padding: "8px 10px" }}>
              <span style={{ flex: 1, minWidth: 120, fontSize: 13, color: C.cafe }}><b>{c.usuario}</b>{c.nombre && c.nombre !== c.usuario ? ` · ${c.nombre}` : ""}</span>
              <input id={`cl-${c.id}`} value={clave[c.id] || ""} onChange={e => setClave({ ...clave, [c.id]: e.target.value })} placeholder="clave nueva" style={{ ...inp, width: 120, padding: "6px 9px" }}/>
              <button disabled={(clave[c.id] || "").length < 6 || !!ocupado} onClick={() => hacer("cl" + c.id, () => api({ accion: "cambiarClave", uid: c.id, clave: clave[c.id] }), `✓ Clave de ${c.usuario} cambiada`).then(() => setClave({ ...clave, [c.id]: "" }))} style={{ ...btn(), opacity: (clave[c.id] || "").length < 6 ? .5 : 1 }}>Cambiar</button>
              {!b.legado && <button disabled={!!ocupado} onClick={() => { if (window.confirm(`¿Borrar el usuario ${c.usuario}? Ya no podrá entrar.`)) hacer("del" + c.id, () => api({ accion: "borrarUsuario", uid: c.id }), `✓ Usuario ${c.usuario} borrado`); }} style={btn("#a04040", true)}>Borrar</button>}
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 6 }}>
            <input id={`nu-u-${b.id}`} value={nu.usuario} onChange={e => setNu({ ...nu, usuario: e.target.value.trim().toLowerCase() })} placeholder="usuario nuevo" style={inp} autoCapitalize="none"/>
            <input id={`nu-c-${b.id}`} value={nu.clave} onChange={e => setNu({ ...nu, clave: e.target.value })} placeholder="clave (6+)" style={inp}/>
            <input id={`nu-n-${b.id}`} value={nu.nombre} onChange={e => setNu({ ...nu, nombre: e.target.value })} placeholder="nombre" style={inp}/>
            <button disabled={!nu.usuario || nu.clave.length < 6 || !!ocupado} onClick={() => hacer("nu", () => api({ accion: "crearUsuario", bodaId: b.id, ...nu }), `✓ Usuario ${nu.usuario} creado`).then(() => setNu({ usuario: "", clave: "", nombre: "" }))} style={{ ...btn(), opacity: !nu.usuario || nu.clave.length < 6 ? .5 : 1 }}>Agregar</button>
          </div>
        </div>
      )}
    </div>
  );
}
