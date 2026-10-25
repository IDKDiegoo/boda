import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../base/firebase";
import { Boton, C, Carta, Volver, guardarLocal, leerLista, leerLocal } from "./comun";
import { CANTIDAD_DEFECTO, UNIDAD_DEFECTO, penitencia, sacar } from "./logica";

// ═══════════════════════════════════════════════════════════════════
// VERDAD O RETO EN PAREJA — 5 niveles, con penitencia de alcohol si no se cumple.
// Las cartas vienen de la base (contenido/juegos_pareja: iguales para todas las parejas) y
// solo las pueden leer los novios: no van dentro del código de la página.
// ═══════════════════════════════════════════════════════════════════

type Nivel = { id: string; nombre: string; desc: string; orden: number };
type CartaJ = { id: string; nivel: string; texto: string };
type Datos = { niveles: Nivel[]; retos: CartaJ[]; verdades: CartaJ[] };
type Ajustes = { j1: string; j2: string; nivel: string; alcohol: boolean; bebida: string; cantidades: Record<string, number>; unidades: Record<string, string>; mayores: boolean };

const AJUSTES: Ajustes = { j1: "Diego", j2: "Camila", nivel: "suave", alcohol: true, bebida: "", cantidades: { ...CANTIDAD_DEFECTO }, unidades: { ...UNIDAD_DEFECTO }, mayores: false };
const ICONO: Record<string, string> = { suave: "💗", caliente: "🔥", duro: "😈", extremo: "💥", sinfiltro: "🖤" };
const TONO: Record<string, string> = { suave: "#c76b8a", caliente: "#c0394f", duro: "#9b1f3f", extremo: "#7a1534", sinfiltro: "#3d0f20" };
let cache: Datos | null = null;

export function VerdadReto({ onVolver }: { onVolver: () => void }) {
  const [datos, setDatos] = useState<Datos | null>(cache);
  const [error, setError] = useState("");
  const [aj, setAj] = useState<Ajustes>(() => leerLocal("vr_ajustes", AJUSTES));
  const [jugando, setJugando] = useState(false);
  const [turno, setTurno] = useState(0);                       // 0 = j1, 1 = j2
  const [carta, setCarta] = useState<{ tipo: "verdad" | "reto"; c: CartaJ } | null>(null);
  const [puntos, setPuntos] = useState<[number, number]>([0, 0]);
  const [resultado, setResultado] = useState<"" | "cumplio" | "no">("");
  const [editarTragos, setEditarTragos] = useState(false);

  useEffect(() => {
    if (cache) return;
    getDoc(doc(db, "contenido", "juegos_pareja"))
      .then(s => { if (!s.exists()) { setError("Todavía no hay cartas cargadas."); return; } cache = s.data() as Datos; setDatos(cache); })
      .catch(() => setError("No se pudieron cargar las cartas. Revisa tu conexión."));
  }, []);
  const cambiar = (p: Partial<Ajustes>) => { const n = { ...aj, ...p }; setAj(n); guardarLocal("vr_ajustes", n); };

  const niveles = (datos?.niveles || []).slice().sort((a, b) => a.orden - b.orden);
  const nivel = niveles.find(n => n.id === aj.nivel) || niveles[0];
  const tono = TONO[nivel?.id || "suave"] || C.vino;
  const yo = turno === 0 ? aj.j1 : aj.j2;

  const pedir = (tipo: "verdad" | "reto") => {
    if (!datos || !nivel) return;
    const mazo = (tipo === "reto" ? datos.retos : datos.verdades).filter(c => c.nivel === nivel.id);
    const clave = `vr_usadas_${tipo}_${nivel.id}`;
    const r = sacar(mazo, leerLista(clave));
    guardarLocal(clave, r.usadas);
    if (r.carta) { setCarta({ tipo, c: r.carta }); setResultado(""); }
  };
  const cerrar = (cumplio: boolean) => {
    setResultado(cumplio ? "cumplio" : "no");
    if (cumplio) setPuntos(p => (turno === 0 ? [p[0] + 1, p[1]] : [p[0], p[1] + 1]));
  };
  const siguiente = () => { setCarta(null); setResultado(""); setTurno(t => 1 - t); };

  const fondo = { background: `linear-gradient(170deg, ${C.vinoOscuro}, ${tono})`, borderRadius: 20, padding: 18, color: "#fff", margin: "-4px -4px 0" } as const;

  if (error) return <div><Volver onClick={onVolver}/><div style={{ color: C.suave, fontSize: 13 }}>{error}</div></div>;
  if (!datos) return <div><Volver onClick={onVolver}/><div style={{ color: C.suave, fontSize: 13, textAlign: "center", padding: 30 }}>Cargando cartas…</div></div>;

  // ── Antes de jugar: los dos confirman que son adultos ──
  if (!aj.mayores) return (
    <div>
      <Volver onClick={onVolver}/>
      <div style={{ ...fondo, textAlign: "center", padding: "30px 22px" }}>
        <div style={{ fontSize: 40 }}>🔞</div>
        <div style={{ fontSize: 20, fontWeight: 700, marginTop: 10 }}>Solo para adultos</div>
        <div style={{ fontSize: 13, opacity: .85, marginTop: 10, lineHeight: 1.5 }}>
          Este juego tiene contenido sexual. Es para jugar entre los dos, cuando ambos quieran.
          Cualquiera puede no hacer un reto: paga la penitencia y se sigue.
        </div>
        <Boton color="#fff" claro style={{ marginTop: 20, width: "100%", color: C.vino }} onClick={() => cambiar({ mayores: true })}>Somos mayores de 18 y queremos jugar</Boton>
      </div>
    </div>
  );

  // ── Ajustes y elección de nivel ──
  if (!jugando) return (
    <div>
      <Volver onClick={onVolver}/>
      <div style={fondo}>
        <div style={{ fontSize: 22, fontWeight: 700, textAlign: "center" }}>Verdad o reto 🔥</div>
        <div style={{ fontSize: 12, opacity: .8, textAlign: "center", marginTop: 4 }}>{datos.retos.length} retos · {datos.verdades.length} verdades</div>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          {(["j1", "j2"] as const).map(k => (
            <input key={k} id={`vr-${k}`} value={aj[k]} onChange={e => cambiar({ [k]: e.target.value } as any)} placeholder={k === "j1" ? "Jugador 1" : "Jugador 2"}
              style={{ flex: 1, minWidth: 0, background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.3)", borderRadius: 10, padding: "10px 12px", color: "#fff", fontSize: 14, fontFamily: "inherit", outline: "none" }}/>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
        {niveles.map(n => {
          const act = n.id === aj.nivel;
          return (
            <button key={n.id} onClick={() => cambiar({ nivel: n.id })} style={{ display: "flex", alignItems: "center", gap: 14, textAlign: "left", fontFamily: "inherit", cursor: "pointer",
              background: act ? `linear-gradient(135deg, ${TONO[n.id]}, ${C.vinoOscuro})` : "#fff", color: act ? "#fff" : C.cafe,
              border: `2px solid ${act ? TONO[n.id] : C.borde}`, borderRadius: 16, padding: "14px 16px" }}>
              <span style={{ fontSize: 28 }}>{ICONO[n.id] || "❤️"}</span>
              <span style={{ flex: 1 }}>
                <span style={{ display: "block", fontSize: 16, fontWeight: 700 }}>{n.nombre}</span>
                <span style={{ display: "block", fontSize: 12, opacity: .8 }}>{n.desc}</span>
              </span>
              {aj.alcohol && <span style={{ fontSize: 11, opacity: .85, whiteSpace: "nowrap" }}>🥃 {aj.cantidades[n.id] ?? CANTIDAD_DEFECTO[n.id as keyof typeof CANTIDAD_DEFECTO]}</span>}
            </button>
          );
        })}
      </div>

      {/* Penitencia */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 16, marginTop: 14, border: `1px solid ${C.borde}` }}>
        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <input id="vr-alcohol" type="checkbox" checked={aj.alcohol} onChange={e => cambiar({ alcohol: e.target.checked })} style={{ width: 20, height: 20, accentColor: C.vino }}/>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.cafe }}>Estamos tomando 🥃</span>
        </label>
        <div style={{ fontSize: 12, color: C.suave, marginTop: 6, lineHeight: 1.4 }}>
          {aj.alcohol ? "Si alguien no cumple la verdad o el reto, toma según el nivel." : "Sin alcohol: quien no cumple pierde el punto y su pareja le elige un castigo."}
        </div>
        {aj.alcohol && <>
          <input id="vr-bebida" value={aj.bebida} onChange={e => cambiar({ bebida: e.target.value })} placeholder="¿Qué están tomando? (piscola, tequila, vino…)"
            style={{ marginTop: 10, width: "100%", background: C.crema, border: `1.5px solid ${C.borde}`, borderRadius: 9, padding: "9px 12px", fontSize: 13, color: C.cafe, fontFamily: "inherit", outline: "none" }}/>
          <button onClick={() => setEditarTragos(v => !v)} style={{ marginTop: 8, background: "none", border: "none", color: C.vino, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
            {editarTragos ? "Listo ▲" : "Cambiar cuánto se toma en cada nivel ▼"}
          </button>
          {editarTragos && <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
            {niveles.map(n => (
              <div key={n.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ flex: 1, fontSize: 13, color: C.cafe }}>{ICONO[n.id]} {n.nombre}</span>
                <input id={`vr-cant-${n.id}`} type="number" min={1} max={10} value={aj.cantidades[n.id] ?? 1}
                  onChange={e => cambiar({ cantidades: { ...aj.cantidades, [n.id]: Math.max(1, Number(e.target.value) || 1) } })}
                  style={{ width: 54, background: C.crema, border: `1.5px solid ${C.borde}`, borderRadius: 8, padding: "6px 8px", fontSize: 13, textAlign: "center", fontFamily: "inherit" }}/>
                <select id={`vr-uni-${n.id}`} value={aj.unidades[n.id] || "trago"} onChange={e => cambiar({ unidades: { ...aj.unidades, [n.id]: e.target.value } })}
                  style={{ background: C.crema, border: `1.5px solid ${C.borde}`, borderRadius: 8, padding: "6px 8px", fontSize: 13, fontFamily: "inherit" }}>
                  {["sorbo", "trago", "corto", "vaso", "fondo"].map(u => <option key={u} value={u}>{u}{(aj.cantidades[n.id] ?? 1) === 1 ? "" : "s"}</option>)}
                </select>
              </div>
            ))}
          </div>}
        </>}
      </div>

      <Boton color={tono} style={{ width: "100%", marginTop: 16, fontSize: 16, padding: "15px" }} onClick={() => { setJugando(true); setTurno(0); setPuntos([0, 0]); setCarta(null); }}>
        Jugar en {nivel?.nombre} {ICONO[nivel?.id || ""]}
      </Boton>
    </div>
  );

  // ── La partida ──
  const pen = penitencia(nivel.id, aj);
  return (
    <div>
      <Volver onClick={() => setJugando(false)} texto="← Cambiar nivel o ajustes"/>
      <div style={fondo}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
          <span style={{ background: "rgba(255,255,255,.16)", borderRadius: 20, padding: "4px 10px", fontWeight: 700 }}>{ICONO[nivel.id]} {nivel.nombre}</span>
          <span style={{ opacity: .85 }}>{aj.j1} {puntos[0]} · {puntos[1]} {aj.j2}</span>
        </div>
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <div style={{ fontSize: 12, opacity: .75, letterSpacing: ".12em", textTransform: "uppercase" }}>Le toca a</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 2 }}>{yo || "—"}</div>
        </div>
      </div>

      {!carta ? (
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <Boton color={tono} claro style={{ flex: 1, padding: "26px 10px", fontSize: 18 }} onClick={() => pedir("verdad")}>Verdad</Boton>
          <Boton color={tono} style={{ flex: 1, padding: "26px 10px", fontSize: 18 }} onClick={() => pedir("reto")}>Reto</Boton>
        </div>
      ) : (
        <div style={{ marginTop: 16 }}>
          <Carta color={tono} chico={carta.tipo === "verdad" ? "Verdad" : "Reto"}>{carta.c.texto}</Carta>
          {resultado === "" && (
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <Boton color="#4f8a5b" style={{ flex: 1 }} onClick={() => cerrar(true)}>✓ Cumplió</Boton>
              <Boton color={tono} claro style={{ flex: 1 }} onClick={() => cerrar(false)}>✗ No lo hace</Boton>
            </div>
          )}
          {resultado === "no" && (
            <div style={{ marginTop: 14, background: `${tono}12`, border: `2px solid ${tono}55`, borderRadius: 16, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 30 }}>{aj.alcohol ? "🥃" : "😏"}</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: tono, marginTop: 4 }}>{yo}: {pen}</div>
            </div>
          )}
          {resultado !== "" && <Boton color={tono} style={{ width: "100%", marginTop: 12 }} onClick={siguiente}>Siguiente turno →</Boton>}
          {resultado === "" && <button onClick={() => pedir(carta.tipo)} style={{ display: "block", margin: "10px auto 0", background: "none", border: "none", color: C.suave, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Otra carta</button>}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginTop: 18, overflowX: "auto", paddingBottom: 4 }}>
        {niveles.map(n => (
          <button key={n.id} onClick={() => { cambiar({ nivel: n.id }); setCarta(null); setResultado(""); }} style={{ flexShrink: 0, fontFamily: "inherit", cursor: "pointer",
            background: n.id === nivel.id ? TONO[n.id] : "#fff", color: n.id === nivel.id ? "#fff" : C.cafe, border: `1.5px solid ${TONO[n.id]}66`,
            borderRadius: 20, padding: "6px 12px", fontSize: 12, fontWeight: 700 }}>{ICONO[n.id]} {n.nombre}</button>
        ))}
      </div>
    </div>
  );
}
