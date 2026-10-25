import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../base/firebase";
import { BarraJuego, Boton, CartaDeslizable, CartaGiro, Escenario, IconoJuego, confeti, guardarLocal, leerLista, leerLocal, vibrar } from "./comun";
import { CANTIDAD_DEFECTO, UNIDAD_DEFECTO, penitencia, sacar } from "./logica";

// ═══════════════════════════════════════════════════════════════════
// VERDAD O RETO EN PAREJA (v2) — 5 niveles, con penitencia de alcohol si no se cumple.
// La carta se da vuelta y se desliza: a la derecha «cumplió», a la izquierda «no lo hace».
// Las cartas vienen de la base (contenido/juegos_pareja: iguales para todas las parejas) y
// solo las pueden leer los novios: no van dentro del código de la página.
// ═══════════════════════════════════════════════════════════════════

type Nivel = { id: string; nombre: string; desc: string; orden: number };
type CartaJ = { id: string; nivel: string; texto: string };
type Datos = { niveles: Nivel[]; retos: CartaJ[]; verdades: CartaJ[] };
type Ajustes = { j1: string; j2: string; nivel: string; alcohol: boolean; bebida: string; cantidades: Record<string, number>; unidades: Record<string, string>; mayores: boolean };

const AJUSTES: Ajustes = { j1: "Diego", j2: "Camila", nivel: "suave", alcohol: true, bebida: "", cantidades: { ...CANTIDAD_DEFECTO }, unidades: { ...UNIDAD_DEFECTO }, mayores: false };
const LLAMAS: Record<string, number> = { suave: 1, caliente: 2, duro: 3, extremo: 4, sinfiltro: 5 };
const TONO: Record<string, string> = { suave: "#d4708f", caliente: "#d2445c", duro: "#b02647", extremo: "#8d1a3c", sinfiltro: "#5a1030" };
const BEBIDAS = ["Piscola", "Tequila", "Vino", "Cerveza", "Ron", "Jägermeister"];
const COL_VERDAD = "#6f6bd8", COL_RETO = "#e0455f";
let cache: Datos | null = null;

const ini = (n: string) => (n.trim()[0] || "?").toUpperCase();
function Llamas({ n, tam = 14, apagadas = true }: { n: number; tam?: number; apagadas?: boolean }) {
  return <span style={{ display: "inline-flex", gap: 2 }}>{[1, 2, 3, 4, 5].map(k => (k <= n || apagadas) &&
    <span key={k} style={{ opacity: k <= n ? 1 : .25, color: k <= n ? "#ffcf8a" : "#fff" }}><IconoJuego n="fuego" tam={tam} grosor={1.8}/></span>)}</span>;
}

export function VerdadReto({ onVolver }: { onVolver: () => void }) {
  const [datos, setDatos] = useState<Datos | null>(cache);
  const [error, setError] = useState("");
  const [aj, setAj] = useState<Ajustes>(() => leerLocal("vr_ajustes", AJUSTES));
  const [jugando, setJugando] = useState(false);
  const [turno, setTurno] = useState(0);                       // 0 = j1, 1 = j2
  const [carta, setCarta] = useState<{ tipo: "verdad" | "reto"; c: CartaJ } | null>(null);
  const [volteada, setVolteada] = useState(false);
  const [puntos, setPuntos] = useState<[number, number]>([0, 0]);
  const [castigo, setCastigo] = useState(false);
  const [editarTragos, setEditarTragos] = useState(false);
  const [punto, setPunto] = useState(0);                       // para la animación del +1

  useEffect(() => {
    if (cache) return;
    getDoc(doc(db, "contenido", "juegos_pareja"))
      .then(s => { if (!s.exists()) { setError("Todavía no hay cartas cargadas."); return; } cache = s.data() as Datos; setDatos(cache); })
      .catch(() => setError("No se pudieron cargar las cartas. Revisa tu conexión."));
  }, []);
  const cambiar = (p: Partial<Ajustes>) => { const n = { ...aj, ...p }; setAj(n); guardarLocal("vr_ajustes", n); };

  const niveles = (datos?.niveles || []).slice().sort((a, b) => a.orden - b.orden);
  const nivel = niveles.find(n => n.id === aj.nivel) || niveles[0];
  const tono = TONO[nivel?.id || "suave"] || "#a3284b";
  const yo = (turno === 0 ? aj.j1 : aj.j2) || (turno === 0 ? "Jugador 1" : "Jugador 2");

  const pedir = (tipo: "verdad" | "reto") => {
    if (!datos || !nivel) return;
    const mazo = (tipo === "reto" ? datos.retos : datos.verdades).filter(c => c.nivel === nivel.id);
    const clave = `vr_usadas_${tipo}_${nivel.id}`;
    const r = sacar(mazo, leerLista(clave));
    guardarLocal(clave, r.usadas);
    if (r.carta) { vibrar(14); setVolteada(false); setCarta({ tipo, c: r.carta }); setTimeout(() => setVolteada(true), 120); }
  };
  const siguiente = () => { setCastigo(false); setCarta(null); setVolteada(false); setTurno(t => 1 - t); };
  const cumplio = () => {
    setPuntos(p => (turno === 0 ? [p[0] + 1, p[1]] : [p[0], p[1] + 1])); setPunto(x => x + 1);
    confeti(window.innerWidth / 2, window.innerHeight * .45); vibrar([20, 30, 20]); setTimeout(siguiente, 650);
  };
  const noCumple = () => { vibrar(40); setCastigo(true); };

  if (error) return <Escenario color="#a3284b"><BarraJuego titulo="Verdad o reto" onVolver={onVolver}/><div style={{ opacity: .9 }}>{error}</div></Escenario>;
  if (!datos) return <Escenario color="#a3284b"><BarraJuego titulo="Verdad o reto" onVolver={onVolver}/><div style={{ display: "grid", placeItems: "center", padding: 60, animation: "j-latir 1.2s infinite" }}><IconoJuego n="fuego" tam={48}/></div></Escenario>;

  // ── Antes de jugar: los dos confirman que son adultos ──
  if (!aj.mayores) return (
    <Escenario color="#a3284b">
      <BarraJuego titulo="Verdad o reto" onVolver={onVolver}/>
      <div className="j-entrar" style={{ textAlign: "center", padding: "30px 8px" }}>
        <div style={{ width: 96, height: 96, borderRadius: "50%", margin: "0 auto", background: "rgba(255,255,255,.14)", border: "1px solid rgba(255,255,255,.25)", display: "grid", placeItems: "center", fontFamily: "var(--titulo)", fontSize: 38, fontWeight: 600 }}>18+</div>
        <div style={{ fontFamily: "var(--titulo)", fontSize: 30, fontWeight: 600, marginTop: 18 }}>Solo para adultos</div>
        <div style={{ fontSize: 14, opacity: .85, marginTop: 10, lineHeight: 1.55, maxWidth: 340, marginInline: "auto" }}>
          Este juego tiene contenido sexual. Es para jugar entre los dos, cuando ambos quieran. Cualquiera puede no hacer un reto: paga la penitencia y se sigue.
        </div>
        <Boton color="#ffffff" claro style={{ marginTop: 26, width: "100%", maxWidth: 360, color: "#8d1a3c" }} onClick={() => cambiar({ mayores: true })}>Somos mayores de 18 y queremos jugar</Boton>
      </div>
    </Escenario>
  );

  // ── Ajustes y elección de nivel ──
  if (!jugando) return (
    <Escenario color={tono} oscuro="#22091a">
      <BarraJuego titulo="Verdad o reto" onVolver={onVolver} derecha={<span style={{ fontSize: 11.5, opacity: .8, whiteSpace: "nowrap" }}>{datos.retos.length} retos · {datos.verdades.length} verdades</span>}/>
      {/* Jugadores */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {(["j1", "j2"] as const).map((k, i) => (
          <label key={k} style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 18, padding: "8px 10px" }}>
            <span style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", fontWeight: 700, background: i ? COL_RETO : COL_VERDAD }}>{ini(aj[k] || "?")}</span>
            <input id={`vr-${k}`} value={aj[k]} onChange={e => cambiar({ [k]: e.target.value } as any)} placeholder={i ? "Jugador 2" : "Jugador 1"} aria-label={i ? "Nombre del jugador 2" : "Nombre del jugador 1"}
              style={{ minWidth: 0, width: "100%", background: "transparent", border: "none", color: "#fff", fontSize: 15, fontWeight: 600, outline: "none", boxShadow: "none" }}/>
          </label>
        ))}
      </div>
      {/* Niveles */}
      <div style={{ fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase", opacity: .7, margin: "22px 4px 10px" }}>Elige la intensidad</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {niveles.map((n, k) => { const act = n.id === aj.nivel; return (
          <button key={n.id} onClick={() => { vibrar(8); cambiar({ nivel: n.id }); }} className="j-tile j-entrar" style={{ animationDelay: `${k * .04}s`, display: "flex", alignItems: "center", gap: 14, textAlign: "left", cursor: "pointer",
            background: act ? `linear-gradient(120deg, ${TONO[n.id]}, ${TONO[n.id]}99)` : "rgba(255,255,255,.07)", color: "#fff",
            border: `1.5px solid ${act ? "rgba(255,255,255,.6)" : "rgba(255,255,255,.14)"}`, borderRadius: 18, padding: "14px 16px", boxShadow: act ? `0 10px 26px -12px ${TONO[n.id]}` : "none" }}>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontFamily: "var(--titulo)", fontSize: 22, fontWeight: 600 }}>{n.nombre}</span><Llamas n={LLAMAS[n.id] || 1}/></span>
              <span style={{ display: "block", fontSize: 12.5, opacity: .8, marginTop: 2 }}>{n.desc}</span>
            </span>
            {aj.alcohol && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, opacity: .9, whiteSpace: "nowrap", background: "rgba(0,0,0,.2)", borderRadius: 20, padding: "4px 9px" }}>
              <IconoJuego n="trago" tam={14}/>{aj.cantidades[n.id] ?? CANTIDAD_DEFECTO[n.id as keyof typeof CANTIDAD_DEFECTO]}</span>}
            <span style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid rgba(255,255,255,.7)", display: "grid", placeItems: "center", flexShrink: 0 }}>{act && <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#fff" }}/>}</span>
          </button>); })}
      </div>
      {/* Penitencia */}
      <div style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.16)", borderRadius: 20, padding: 16, marginTop: 14 }}>
        <button onClick={() => { vibrar(6); cambiar({ alcohol: !aj.alcohol }); }} role="switch" aria-checked={aj.alcohol} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", color: "#fff", cursor: "pointer", textAlign: "left", padding: 0 }}>
          <span style={{ width: 40, height: 40, borderRadius: 13, background: "rgba(255,255,255,.14)", display: "grid", placeItems: "center" }}><IconoJuego n="trago" tam={21}/></span>
          <span style={{ flex: 1 }}><span style={{ display: "block", fontSize: 15, fontWeight: 600 }}>Estamos tomando</span>
            <span style={{ display: "block", fontSize: 12, opacity: .75, marginTop: 2 }}>{aj.alcohol ? "Quien no cumple, toma según el nivel" : "Sin alcohol: quien no cumple, su pareja elige el castigo"}</span></span>
          <span style={{ width: 50, height: 30, borderRadius: 30, background: aj.alcohol ? "#5fd39a" : "rgba(255,255,255,.25)", position: "relative", transition: "background .25s", flexShrink: 0 }}>
            <span style={{ position: "absolute", top: 3, left: aj.alcohol ? 23 : 3, width: 24, height: 24, borderRadius: "50%", background: "#fff", transition: "left .25s cubic-bezier(.3,1.3,.5,1)", boxShadow: "0 2px 6px rgba(0,0,0,.25)" }}/>
          </span>
        </button>
        {aj.alcohol && <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
            {BEBIDAS.map(b => { const on = aj.bebida.toLowerCase() === b.toLowerCase(); return (
              <button key={b} onClick={() => { vibrar(6); cambiar({ bebida: on ? "" : b }); }} style={{ borderRadius: 20, padding: "7px 13px", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                background: on ? "#fff" : "rgba(255,255,255,.1)", color: on ? "#8d1a3c" : "#fff", border: "1px solid rgba(255,255,255,.25)" }}>{b}</button>); })}
          </div>
          <input id="vr-bebida" value={aj.bebida} onChange={e => cambiar({ bebida: e.target.value })} placeholder="u otra cosa…" aria-label="Qué están tomando"
            style={{ marginTop: 10, width: "100%", background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.25)", borderRadius: 12, padding: "10px 12px", fontSize: 14, color: "#fff", outline: "none" }}/>
          <button onClick={() => setEditarTragos(v => !v)} style={{ marginTop: 10, background: "none", border: "none", color: "#ffd5b0", fontSize: 12.5, fontWeight: 600, cursor: "pointer", padding: 0 }}>
            {editarTragos ? "Listo ▲" : "Cambiar cuánto se toma en cada nivel ▼"}
          </button>
          {editarTragos && <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
            {niveles.map(n => (
              <div key={n.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ flex: 1, fontSize: 13.5 }}>{n.nombre}</span>
                <button aria-label={`Menos en ${n.nombre}`} onClick={() => cambiar({ cantidades: { ...aj.cantidades, [n.id]: Math.max(1, (aj.cantidades[n.id] ?? 1) - 1) } })} style={pasoBtn}>−</button>
                <span style={{ width: 22, textAlign: "center", fontWeight: 700 }}>{aj.cantidades[n.id] ?? 1}</span>
                <button aria-label={`Más en ${n.nombre}`} onClick={() => cambiar({ cantidades: { ...aj.cantidades, [n.id]: Math.min(10, (aj.cantidades[n.id] ?? 1) + 1) } })} style={pasoBtn}>+</button>
                <select id={`vr-uni-${n.id}`} value={aj.unidades[n.id] || "trago"} onChange={e => cambiar({ unidades: { ...aj.unidades, [n.id]: e.target.value } })}
                  style={{ background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.25)", color: "#fff", borderRadius: 10, padding: "6px 8px", fontSize: 13 }}>
                  {["sorbo", "trago", "corto", "vaso", "fondo"].map(u => <option key={u} value={u} style={{ color: "#3b2a21" }}>{u}{(aj.cantidades[n.id] ?? 1) === 1 ? "" : "s"}</option>)}
                </select>
              </div>
            ))}
          </div>}
        </>}
      </div>
      <Boton color="#ffffff" claro style={{ width: "100%", marginTop: 16, fontSize: 16, padding: 17, color: tono }} onClick={() => { setJugando(true); setTurno(0); setPuntos([0, 0]); setCarta(null); }}>
        Jugar en {nivel?.nombre} <Llamas n={LLAMAS[nivel?.id] || 1} apagadas={false}/>
      </Boton>
    </Escenario>
  );

  // ── La partida ──
  const pen = penitencia(nivel.id, aj);
  const colCarta = carta?.tipo === "reto" ? COL_RETO : COL_VERDAD;
  return (
    <Escenario color={tono} oscuro="#22091a">
      <BarraJuego titulo={nivel.nombre} onVolver={() => setJugando(false)} derecha={<Llamas n={LLAMAS[nivel.id] || 1} tam={15}/>}/>
      {/* Marcador */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        {[0, 1].map(i => { const act = turno === i, nom = (i ? aj.j2 : aj.j1) || `Jugador ${i + 1}`; return (
          <div key={i} style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, flexDirection: i ? "row-reverse" : "row", padding: "8px 10px", borderRadius: 18, transition: "all .35s ease",
            background: act ? "rgba(255,255,255,.16)" : "transparent", border: `1px solid ${act ? "rgba(255,255,255,.35)" : "transparent"}`, opacity: act ? 1 : .6 }}>
            <span style={{ width: 40, height: 40, borderRadius: "50%", display: "grid", placeItems: "center", fontWeight: 700, background: i ? COL_RETO : COL_VERDAD,
              boxShadow: act ? "0 0 0 3px rgba(255,255,255,.55)" : "none", transition: "box-shadow .3s" }}>{ini(nom)}</span>
            <span style={{ minWidth: 0, textAlign: i ? "right" : "left" }}>
              <span style={{ display: "block", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nom}</span>
              <span key={act ? punto : 0} style={{ display: "block", fontFamily: "var(--titulo)", fontSize: 24, fontWeight: 600, lineHeight: 1, animation: act && punto ? "j-pop .5s ease" : "none" }}>{puntos[i]}</span>
            </span>
          </div>); })}
      </div>

      {!carta ? (
        <div className="j-entrar">
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <div style={{ fontSize: 11, letterSpacing: ".24em", textTransform: "uppercase", opacity: .7 }}>Le toca a</div>
            <div style={{ fontFamily: "var(--titulo)", fontSize: 40, fontWeight: 600, lineHeight: 1.1 }}>{yo}</div>
            <div style={{ fontSize: 13, opacity: .75, marginTop: 4 }}>¿Verdad o reto?</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {([["verdad", "Verdad", "charla", COL_VERDAD], ["reto", "Reto", "fuego", COL_RETO]] as const).map(([t, l, ic, col]) => (
              <button key={t} onClick={() => pedir(t)} className="j-tile" style={{ position: "relative", overflow: "hidden", border: "none", cursor: "pointer", color: "#fff", borderRadius: 24, padding: "30px 10px 26px",
                background: `linear-gradient(160deg, ${col}, ${col}b0)`, boxShadow: `0 16px 30px -14px ${col}`, display: "grid", placeItems: "center", gap: 12 }}>
                <span aria-hidden="true" style={{ position: "absolute", right: -30, top: -30, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,.14)" }}/>
                <span style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,.2)", display: "grid", placeItems: "center" }}><IconoJuego n={ic} tam={32}/></span>
                <span style={{ fontFamily: "var(--titulo)", fontSize: 28, fontWeight: 600 }}>{l}</span>
              </button>))}
          </div>
        </div>
      ) : (
        <div>
          <CartaDeslizable key={carta.c.id} onDerecha={cumplio} onIzquierda={noCumple} textoDerecha="CUMPLIÓ" textoIzquierda="NO LO HACE" activa={volteada && !castigo}>
            <CartaGiro volteada={volteada} color={colCarta} icono={carta.tipo === "reto" ? "fuego" : "charla"} etiqueta={`${carta.tipo === "reto" ? "Reto" : "Verdad"} · ${yo}`} alto={330}>
              {carta.c.texto}
            </CartaGiro>
          </CartaDeslizable>
          <div style={{ textAlign: "center", fontSize: 12, opacity: .7, margin: "12px 0" }}>Desliza → si cumplió · ← si no lo hace</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Boton color="#ffffff" claro style={{ color: "#b02647" }} onClick={noCumple}><IconoJuego n="equis" tam={18} grosor={2.4}/>No lo hace</Boton>
            <Boton color="#3f9a6e" onClick={cumplio}><IconoJuego n="check" tam={18} grosor={2.4}/>Cumplió</Boton>
          </div>
          <button onClick={() => pedir(carta.tipo)} style={{ display: "flex", alignItems: "center", gap: 6, margin: "14px auto 0", background: "none", border: "none", color: "rgba(255,255,255,.8)", fontSize: 13, cursor: "pointer" }}>
            <IconoJuego n="barajar" tam={16}/>Otra carta</button>
        </div>
      )}

      {/* Niveles en la partida */}
      <div style={{ display: "flex", gap: 6, marginTop: 22, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
        {niveles.map(n => { const on = n.id === nivel.id; return (
          <button key={n.id} onClick={() => { vibrar(6); cambiar({ nivel: n.id }); setCarta(null); }} style={{ flexShrink: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            background: on ? "#fff" : "rgba(255,255,255,.1)", color: on ? TONO[n.id] : "#fff", border: "1px solid rgba(255,255,255,.25)", borderRadius: 20, padding: "7px 12px", fontSize: 12.5, fontWeight: 600 }}>{n.nombre}</button>); })}
      </div>

      {/* Penitencia: el vaso se llena */}
      {castigo && (
        <div onClick={siguiente} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(20,5,12,.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", animation: "velo .2s ease" }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 620, margin: "0 auto", background: `linear-gradient(180deg, ${tono}, #22091a)`, color: "#fff",
            borderRadius: "28px 28px 0 0", padding: "26px 22px calc(26px + env(safe-area-inset-bottom, 0px))", textAlign: "center", animation: "j-subir .35s cubic-bezier(.2,.8,.3,1)" }}>
            {aj.alcohol ? (
              <svg width="96" height="120" viewBox="0 0 48 60" aria-hidden="true" style={{ display: "block", margin: "0 auto", animation: "j-temblar .5s ease 2" }}>
                <defs><clipPath id="vaso"><path d="M8 6h32l-3.5 46a4 4 0 0 1-4 3.6h-17a4 4 0 0 1-4-3.6z"/></clipPath></defs>
                <g clipPath="url(#vaso)"><rect x="0" y="16" width="48" height="44" fill="#f4b860" style={{ transformOrigin: "24px 60px", animation: "j-llenar 1.1s cubic-bezier(.2,.8,.3,1) both" }}/>
                  <rect x="0" y="16" width="48" height="4" fill="#fff6e0" opacity=".7" style={{ transformOrigin: "24px 60px", animation: "j-llenar 1.1s cubic-bezier(.2,.8,.3,1) both" }}/></g>
                <path d="M8 6h32l-3.5 46a4 4 0 0 1-4 3.6h-17a4 4 0 0 1-4-3.6z" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinejoin="round"/>
              </svg>
            ) : <div style={{ fontFamily: "var(--titulo)", fontSize: 60 }}>😏</div>}
            <div style={{ fontSize: 12, letterSpacing: ".24em", textTransform: "uppercase", opacity: .75, marginTop: 14 }}>Penitencia para {yo}</div>
            <div style={{ fontFamily: "var(--titulo)", fontSize: 32, fontWeight: 600, lineHeight: 1.15, marginTop: 6 }}>{pen}</div>
            <Boton color="#ffffff" claro style={{ width: "100%", marginTop: 22, color: tono }} onClick={siguiente}>Listo, siguiente turno</Boton>
          </div>
        </div>
      )}
    </Escenario>
  );
}
const pasoBtn: React.CSSProperties = { width: 32, height: 32, borderRadius: 10, border: "1px solid rgba(255,255,255,.3)", background: "rgba(255,255,255,.1)", color: "#fff", fontSize: 18, cursor: "pointer", lineHeight: 1 };
