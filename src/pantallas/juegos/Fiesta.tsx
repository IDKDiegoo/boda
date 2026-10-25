import { useEffect, useRef, useState } from "react";
import { useData } from "../../base/hooks";
import { infoBoda } from "../../base/firebase";
import { AnilloTiempo, BarraJuego, Boton, CartaGiro, Escenario, IconoJuego, Opciones, confeti, guardarLocal, leerLista, leerLocal, useReloj, vibrar } from "./comun";
import { BINGO, CAZA_FOTOS, IMPOSTOR, MIMICA } from "./contenido";
import { barajar, carton, hayLinea, repartirImpostor, sacar } from "./logica";

// Juegos para la fiesta (v2), con un solo teléfono que se va pasando (o el del animador).

const PALETA = ["#6f6bd8", "#e0455f", "#3f9a6e", "#d08a3c", "#3c8ed0", "#b05fb5", "#c4605a", "#4aa3a0"];
const colorDe = (nombre: string) => PALETA[nombre.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % PALETA.length];
const Avatar = ({ n, tam = 44, style }: { n: string; tam?: number; style?: React.CSSProperties }) =>
  <span style={{ width: tam, height: tam, borderRadius: "50%", display: "grid", placeItems: "center", fontWeight: 700, fontSize: tam * .4, color: "#fff", background: colorDe(n), flexShrink: 0, ...style }}>{(n.trim()[0] || "?").toUpperCase()}</span>;

// ── EL IMPOSTOR ──────────────────────────────────────────────────
type Jug = { nombre: string; palabra: string | null };
export function Impostor({ onVolver }: { onVolver: () => void }) {
  const [aj, setAj] = useState(() => leerLocal("imp", { nombres: "", categoria: "De la boda", impostores: 1, tiempo: 90 }));
  const [nuevo, setNuevo] = useState("");
  const [reparto, setReparto] = useState<Jug[] | null>(null);
  const [fase, setFase] = useState<"reparto" | "discusion" | "votar" | "final">("reparto");
  const [i, setI] = useState(0);
  const [mirando, setMirando] = useState(false);
  const [yaVio, setYaVio] = useState(false);
  const [parte, setParte] = useState("");
  const [votados, setVotados] = useState<string[]>([]);
  const reloj = useReloj(() => setFase("votar"));
  const cambiar = (p: any) => { const n = { ...aj, ...p }; setAj(n); guardarLocal("imp", n); };
  const jugadores: string[] = aj.nombres.split(/[\n,]/).map((x: string) => x.trim()).filter(Boolean);
  const col = "#4a3a6b";

  const agregar = () => { const n = nuevo.trim(); if (!n || jugadores.includes(n)) return; vibrar(8); cambiar({ nombres: [...jugadores, n].join("\n") }); setNuevo(""); };
  const quitar = (n: string) => cambiar({ nombres: jugadores.filter(x => x !== n).join("\n") });
  const empezar = () => {
    const lista = IMPOSTOR[aj.categoria] || IMPOSTOR["De la boda"];
    const r: Jug[] = repartirImpostor(jugadores, barajar(lista)[0], aj.impostores);
    setReparto(r); setI(0); setMirando(false); setYaVio(false); setFase("reparto"); setVotados([]);
    setParte(barajar(r.map(x => x.nombre))[0]); vibrar(14);
  };
  const imp = (reparto || []).filter(x => !x.palabra).map(x => x.nombre);
  const palabra = (reparto || []).find(x => x.palabra)?.palabra;

  // Armar la partida
  if (!reparto) return (
    <Escenario color="#6b55a0" oscuro="#151024">
      <BarraJuego titulo="El impostor" onVolver={onVolver}/>
      <div style={{ fontSize: 13.5, opacity: .85, lineHeight: 1.5, marginBottom: 16 }}>Todos ven la misma palabra menos el impostor. Cada uno dice una pista, sin ser obvio, y después se vota. El impostor gana si no lo pillan… o si adivina la palabra.</div>
      <div style={{ fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase", opacity: .7, marginBottom: 8 }}>Jugadores · {jugadores.length}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        {jugadores.map(n => (
          <span key={n} className="j-entrar" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 30, padding: "4px 6px 4px 4px" }}>
            <Avatar n={n} tam={28}/><span style={{ fontSize: 14, fontWeight: 600 }}>{n}</span>
            <button onClick={() => quitar(n)} aria-label={`Quitar a ${n}`} style={{ width: 24, height: 24, borderRadius: "50%", border: "none", background: "rgba(255,255,255,.16)", color: "#fff", cursor: "pointer", display: "grid", placeItems: "center" }}><IconoJuego n="equis" tam={13} grosor={2.4}/></button>
          </span>))}
      </div>
      <form onSubmit={e => { e.preventDefault(); agregar(); }} style={{ display: "flex", gap: 8 }}>
        <input id="imp-nuevo" value={nuevo} onChange={e => setNuevo(e.target.value)} placeholder="Nombre del jugador" aria-label="Nombre del jugador"
          style={{ flex: 1, minWidth: 0, background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.25)", borderRadius: 14, padding: "12px 14px", fontSize: 15, color: "#fff", outline: "none" }}/>
        <button type="submit" aria-label="Agregar jugador" style={{ width: 48, borderRadius: 14, border: "none", background: "#fff", color: col, cursor: "pointer", display: "grid", placeItems: "center" }}><IconoJuego n="mas" tam={22} grosor={2.4}/></button>
      </form>
      <div style={{ fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase", opacity: .7, margin: "20px 0 8px" }}>Tema de las palabras</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {Object.keys(IMPOSTOR).map(k => { const on = aj.categoria === k; return (
          <button key={k} onClick={() => { vibrar(6); cambiar({ categoria: k }); }} style={{ cursor: "pointer", borderRadius: 20, padding: "8px 13px", fontSize: 13, fontWeight: 600,
            background: on ? "#fff" : "rgba(255,255,255,.08)", color: on ? col : "#fff", border: "1px solid rgba(255,255,255,.22)" }}>{k}</button>); })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 18 }}>
        <div><div style={{ fontSize: 12, opacity: .75, marginBottom: 6 }}>Impostores</div><Opciones valor={aj.impostores} opciones={[[1, "1"], [2, "2"], [3, "3"]]} onCambiar={v => cambiar({ impostores: v })}/></div>
        <div><div style={{ fontSize: 12, opacity: .75, marginBottom: 6 }}>Tiempo para discutir</div><Opciones valor={aj.tiempo} opciones={[[60, "1'"], [90, "1½'"], [120, "2'"]]} onCambiar={v => cambiar({ tiempo: v })}/></div>
      </div>
      <Boton color="#ffffff" claro disabled={jugadores.length < 3} style={{ width: "100%", marginTop: 22, color: col, padding: 17 }} onClick={empezar}>
        {jugadores.length < 3 ? `Faltan ${3 - jugadores.length} jugador${3 - jugadores.length === 1 ? "" : "es"}` : `Repartir a ${jugadores.length} jugadores`}
      </Boton>
    </Escenario>
  );

  // Cada uno ve lo suyo manteniendo presionado (al soltar se tapa)
  if (fase === "reparto" && i < reparto.length) {
    const j = reparto[i];
    const ver = (v: boolean) => { if (v) { vibrar(12); setYaVio(true); } setMirando(v); };
    return (
      <Escenario color="#6b55a0" oscuro="#151024">
        <BarraJuego titulo="El impostor" onVolver={() => setReparto(null)} derecha={<span style={{ fontSize: 12, opacity: .8 }}>{i + 1} de {reparto.length}</span>}/>
        <div style={{ display: "flex", gap: 4, marginBottom: 22 }}>{reparto.map((_, k) => <span key={k} style={{ flex: 1, height: 4, borderRadius: 4, background: k < i ? "#fff" : k === i ? "rgba(255,255,255,.6)" : "rgba(255,255,255,.18)" }}/>)}</div>
        <div key={i} className="j-entrar" style={{ textAlign: "center" }}>
          <Avatar n={j.nombre} tam={76} style={{ margin: "0 auto", boxShadow: "0 0 0 4px rgba(255,255,255,.25)" }}/>
          <div style={{ fontSize: 12, letterSpacing: ".22em", textTransform: "uppercase", opacity: .7, marginTop: 14 }}>Pásale el teléfono a</div>
          <div style={{ fontFamily: "var(--titulo)", fontSize: 38, fontWeight: 600, lineHeight: 1.1 }}>{j.nombre}</div>
        </div>
        <div onPointerDown={() => ver(true)} onPointerUp={() => ver(false)} onPointerLeave={() => ver(false)} onPointerCancel={() => ver(false)} onContextMenu={e => e.preventDefault()}
          style={{ marginTop: 24, height: 230, borderRadius: 26, display: "grid", placeItems: "center", textAlign: "center", padding: 18, cursor: "pointer", userSelect: "none", WebkitUserSelect: "none", touchAction: "none",
            background: mirando ? (j.palabra ? "#fffdfb" : "linear-gradient(150deg,#e0455f,#8d1a3c)") : "rgba(255,255,255,.08)", color: mirando && j.palabra ? "#3b2a21" : "#fff",
            border: mirando ? "none" : "2px dashed rgba(255,255,255,.35)", transition: "background .25s ease, transform .2s", transform: mirando ? "scale(1.02)" : "none" }}>
          {mirando ? (j.palabra
            ? <div><div style={{ fontSize: 11, letterSpacing: ".24em", textTransform: "uppercase", color: col }}>Tu palabra</div><div style={{ fontFamily: "var(--titulo)", fontSize: 40, fontWeight: 600, marginTop: 6 }}>{j.palabra}</div></div>
            : <div><IconoJuego n="mascara" tam={52}/><div style={{ fontFamily: "var(--titulo)", fontSize: 34, fontWeight: 600, marginTop: 6 }}>Eres el impostor</div><div style={{ fontSize: 13, opacity: .85, marginTop: 4 }}>Escucha las pistas y haz como que sabes</div></div>)
            : <div style={{ display: "grid", placeItems: "center", gap: 10 }}><IconoJuego n="ojo" tam={40}/><div style={{ fontSize: 15, fontWeight: 600 }}>Mantén presionado para ver</div><div style={{ fontSize: 12.5, opacity: .7 }}>Suelta antes de pasar el teléfono</div></div>}
        </div>
        <Boton color="#ffffff" claro disabled={!yaVio || mirando} style={{ width: "100%", marginTop: 16, color: col }} onClick={() => { setYaVio(false); if (i + 1 < reparto.length) setI(i + 1); else { setFase("discusion"); reloj.partir(aj.tiempo); } }}>
          {i + 1 < reparto.length ? "Listo, siguiente jugador" : "Todos vieron: a discutir"}
        </Boton>
      </Escenario>
    );
  }

  // Discusión con reloj
  if (fase === "discusion") return (
    <Escenario color="#6b55a0" oscuro="#151024">
      <BarraJuego titulo="A discutir" onVolver={() => { reloj.parar(); setReparto(null); }}/>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 12, letterSpacing: ".22em", textTransform: "uppercase", opacity: .7 }}>Empieza</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 8 }}><Avatar n={parte} tam={40}/><span style={{ fontFamily: "var(--titulo)", fontSize: 32, fontWeight: 600 }}>{parte}</span></div>
        <div style={{ fontSize: 13.5, opacity: .8, marginTop: 8 }}>Cada uno dice una palabra, en orden. Después voten.</div>
        <div style={{ display: "grid", placeItems: "center", margin: "28px 0" }}><AnilloTiempo seg={reloj.seg} total={reloj.total} tam={190}/></div>
      </div>
      <Boton color="#ffffff" claro style={{ width: "100%", color: col }} onClick={() => { reloj.parar(); setFase("votar"); }}>Votar ahora</Boton>
    </Escenario>
  );

  // Votación: se toca al sospechoso y la carta dice si era
  if (fase === "votar") return (
    <Escenario color="#6b55a0" oscuro="#151024">
      <BarraJuego titulo="¿Quién es el impostor?" onVolver={() => setReparto(null)}/>
      <div style={{ fontSize: 13.5, opacity: .85, marginBottom: 14 }}>Toquen al más votado para descubrir si era.</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 10 }}>
        {reparto.map(j => { const ya = votados.includes(j.nombre), era = !j.palabra; return (
          <button key={j.nombre} disabled={ya} onClick={() => { setVotados(v => [...v, j.nombre]); if (era) { confeti(); vibrar([30, 40, 30]); } else vibrar(60); }}
            className="j-tile" style={{ border: "1px solid rgba(255,255,255,.2)", borderRadius: 20, padding: "14px 8px", cursor: ya ? "default" : "pointer", color: "#fff",
              background: ya ? (era ? "linear-gradient(150deg,#e0455f,#8d1a3c)" : "rgba(255,255,255,.04)") : "rgba(255,255,255,.1)", display: "grid", placeItems: "center", gap: 8, opacity: ya && !era ? .55 : 1 }}>
            <Avatar n={j.nombre} tam={48}/>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{j.nombre}</span>
            {ya && <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", animation: "j-pop .4s ease" }}>{era ? "¡IMPOSTOR!" : "INOCENTE"}</span>}
          </button>); })}
      </div>
      <Boton color="#ffffff" claro style={{ width: "100%", marginTop: 18, color: col }} onClick={() => setFase("final")}>Revelar todo</Boton>
    </Escenario>
  );

  return (
    <Escenario color="#6b55a0" oscuro="#151024">
      <BarraJuego titulo="Resultado" onVolver={() => setReparto(null)}/>
      <div className="j-entrar" style={{ textAlign: "center", padding: "20px 0" }}>
        <IconoJuego n="mascara" tam={56}/>
        <div style={{ fontSize: 12, letterSpacing: ".22em", textTransform: "uppercase", opacity: .7, marginTop: 12 }}>{imp.length > 1 ? "Los impostores eran" : "El impostor era"}</div>
        <div style={{ fontFamily: "var(--titulo)", fontSize: 40, fontWeight: 600 }}>{imp.join(" y ")}</div>
        <div style={{ marginTop: 18, background: "#fffdfb", color: "#3b2a21", borderRadius: 20, padding: "16px 18px", display: "inline-block" }}>
          <div style={{ fontSize: 11, letterSpacing: ".22em", textTransform: "uppercase", color: col }}>La palabra era</div>
          <div style={{ fontFamily: "var(--titulo)", fontSize: 32, fontWeight: 600 }}>{palabra}</div>
        </div>
      </div>
      <Boton color="#ffffff" claro style={{ width: "100%", marginTop: 14, color: col }} onClick={empezar}><IconoJuego n="barajar" tam={18}/>Otra ronda con los mismos</Boton>
      <Boton color="rgba(255,255,255,.18)" style={{ width: "100%", marginTop: 10 }} onClick={() => setReparto(null)}>Cambiar jugadores</Boton>
    </Escenario>
  );
}

// ── MAZO CON CARTA QUE SE DA VUELTA: misiones por mesa ───────────
export function Mazo({ titulo, desc, cartas, clave, color, oscuro, icono, onVolver }: { titulo: string; desc: string; cartas: string[]; clave: string; color: string; oscuro?: string; icono: string; onVolver: () => void }) {
  const lista = cartas.map((texto, i) => ({ id: `${clave}${i}`, texto }));
  const [actual, setActual] = useState<string | null>(null);
  const [volteada, setVolteada] = useState(false);
  const [n, setN] = useState(0);
  const otra = () => { vibrar(10); setVolteada(false); setTimeout(() => { const r = sacar(lista, leerLista(clave)); guardarLocal(clave, r.usadas); setActual(r.carta?.texto || null); setN(x => x + 1); setTimeout(() => setVolteada(true), 60); }, actual ? 220 : 0); };
  return (
    <Escenario color={color} oscuro={oscuro}>
      <BarraJuego titulo={titulo} onVolver={onVolver} derecha={n ? <span style={{ fontSize: 12, opacity: .85, background: "rgba(0,0,0,.2)", borderRadius: 20, padding: "5px 10px" }}>Mesa {n}</span> : undefined}/>
      <div style={{ fontSize: 13.5, opacity: .85, marginBottom: 16, lineHeight: 1.5 }}>{desc}</div>
      <CartaGiro volteada={!!actual && volteada} color={color} icono={icono} etiqueta={actual ? `Misión para la mesa ${n}` : undefined} alto={300} onToque={!actual ? otra : undefined}>{actual || ""}</CartaGiro>
      <Boton color="#ffffff" claro style={{ width: "100%", marginTop: 16, color }} onClick={otra}><IconoJuego n="barajar" tam={18}/>{actual ? "Otra misión" : "Sacar la primera"}</Boton>
    </Escenario>
  );
}

// ── MÍMICA, estilo Heads Up ─────────────────────────────────────
export function Mimica({ onVolver }: { onVolver: () => void }) {
  const [aj, setAj] = useState(() => leerLocal("mimica", { tiempo: 60 }));
  const [fase, setFase] = useState<"inicio" | "cuenta" | "juego" | "fin">("inicio");
  const [cuenta, setCuenta] = useState(3);
  const [palabra, setPalabra] = useState("");
  const [ok, setOk] = useState<string[]>([]); const [pasadas, setPasadas] = useState<string[]>([]);
  const [flash, setFlash] = useState<"" | "bien" | "pasa">("");
  const reloj = useReloj(() => { setFase("fin"); });
  const lista = MIMICA.map((texto, i) => ({ id: `mim${i}`, texto }));
  const siguiente = () => { const r = sacar(lista, leerLista("mimica_usadas")); guardarLocal("mimica_usadas", r.usadas); setPalabra(r.carta?.texto || ""); };
  const partir = () => { setOk([]); setPasadas([]); setFase("cuenta"); setCuenta(3); vibrar(10);
    let c = 3; const t = setInterval(() => { c--; if (c <= 0) { clearInterval(t); siguiente(); setFase("juego"); reloj.partir(aj.tiempo); vibrar(30); } else { setCuenta(c); vibrar(10); } }, 800); };
  const marcar = (bien: boolean) => { if (fase !== "juego") return; (bien ? setOk : setPasadas)(l => [...l, palabra]); setFlash(bien ? "bien" : "pasa"); vibrar(bien ? 25 : [10, 30, 10]); setTimeout(() => setFlash(""), 350); siguiente(); };
  useEffect(() => { if (fase === "fin" && ok.length) confeti(); }, [fase, ok.length]);
  const col = "#7d5ca8";
  if (fase === "inicio") return (
    <Escenario color={col} oscuro="#1d1430">
      <BarraJuego titulo="Mímica" onVolver={onVolver}/>
      <div className="j-entrar" style={{ textAlign: "center", padding: "26px 6px" }}>
        <div style={{ width: 96, height: 96, borderRadius: "50%", margin: "0 auto", background: "rgba(255,255,255,.14)", display: "grid", placeItems: "center" }}><IconoJuego n="teatro" tam={48}/></div>
        <div style={{ fontFamily: "var(--titulo)", fontSize: 28, fontWeight: 600, marginTop: 16 }}>Actúa sin hablar</div>
        <div style={{ fontSize: 13.5, opacity: .85, marginTop: 8, lineHeight: 1.5 }}>Uno actúa y su equipo adivina. Toca la mitad derecha de la pantalla si acertaron y la izquierda para pasar. ¡Todas las que puedan antes del tiempo!</div>
        <div style={{ maxWidth: 300, margin: "22px auto 0" }}><Opciones valor={aj.tiempo} opciones={[[45, "45 s"], [60, "60 s"], [90, "90 s"]]} onCambiar={v => { const n = { tiempo: v }; setAj(n); guardarLocal("mimica", n); }}/></div>
        <Boton color="#ffffff" claro style={{ width: "100%", marginTop: 22, color: col, padding: 17 }} onClick={partir}>¡Partir!</Boton>
      </div>
    </Escenario>
  );
  if (fase === "cuenta") return (
    <Escenario color={col} oscuro="#1d1430"><div style={{ display: "grid", placeItems: "center", minHeight: 420 }}>
      <div key={cuenta} style={{ fontFamily: "var(--titulo)", fontSize: 140, fontWeight: 600, animation: "j-pop .7s ease" }}>{cuenta}</div></div></Escenario>
  );
  if (fase === "fin") return (
    <Escenario color={col} oscuro="#1d1430">
      <BarraJuego titulo="¡Tiempo!" onVolver={onVolver}/>
      <div className="j-entrar" style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "var(--titulo)", fontSize: 84, fontWeight: 600, lineHeight: 1 }}>{ok.length}</div>
        <div style={{ fontSize: 13, letterSpacing: ".2em", textTransform: "uppercase", opacity: .8 }}>acertadas</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, margin: "22px 0" }}>
        {ok.map((p, k) => <div key={"o" + k} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(63,154,110,.28)", borderRadius: 12, padding: "9px 12px" }}><IconoJuego n="check" tam={17} grosor={2.4}/>{p}</div>)}
        {pasadas.map((p, k) => <div key={"p" + k} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,.07)", borderRadius: 12, padding: "9px 12px", opacity: .7 }}><IconoJuego n="equis" tam={17} grosor={2.2}/>{p}</div>)}
      </div>
      <Boton color="#ffffff" claro style={{ width: "100%", color: col }} onClick={partir}>Otra ronda</Boton>
    </Escenario>
  );
  return (
    <div style={{ position: "relative", borderRadius: 28, overflow: "hidden", minHeight: "calc(100vh - 220px)", userSelect: "none", WebkitUserSelect: "none",
      background: flash === "bien" ? "#2f8a5c" : flash === "pasa" ? "#b73a4f" : "radial-gradient(130% 90% at 0% 0%, #7d5ca8, #1d1430 75%)", transition: "background .25s ease", color: "#fff" }}>
      <div style={{ position: "absolute", top: 14, left: 0, right: 0, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 16px", zIndex: 2, pointerEvents: "none" }}>
        <span style={{ fontSize: 13, fontWeight: 600, background: "rgba(0,0,0,.25)", borderRadius: 20, padding: "5px 11px" }}>✓ {ok.length}</span>
        <AnilloTiempo seg={reloj.seg} total={reloj.total} tam={74}/>
        <span style={{ fontSize: 13, fontWeight: 600, background: "rgba(0,0,0,.25)", borderRadius: 20, padding: "5px 11px" }}>Pasadas {pasadas.length}</span>
      </div>
      <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        <button onClick={() => marcar(false)} aria-label="Pasar" style={{ border: "none", background: "transparent", cursor: "pointer" }}/>
        <button onClick={() => marcar(true)} aria-label="Acertó" style={{ border: "none", background: "transparent", cursor: "pointer" }}/>
      </div>
      <div style={{ position: "relative", minHeight: "calc(100vh - 220px)", display: "grid", placeItems: "center", padding: "100px 20px 80px", textAlign: "center", pointerEvents: "none" }}>
        <div key={palabra} style={{ fontFamily: "var(--titulo)", fontSize: "clamp(40px, 11vw, 72px)", fontWeight: 600, lineHeight: 1.05, animation: "j-pop .35s ease" }}>{palabra}</div>
      </div>
      <div style={{ position: "absolute", bottom: 16, left: 0, right: 0, display: "flex", justifyContent: "space-between", padding: "0 18px", fontSize: 12.5, opacity: .8, pointerEvents: "none" }}>
        <span>← Pasar</span><span>Acertó →</span>
      </div>
    </div>
  );
}

// ── BINGO: el sello cae al marcar; línea completa = confeti ──────
export function Bingo({ onVolver }: { onVolver: () => void }) {
  const [c, setC] = useState<string[]>(() => { const g = leerLista("bingo_carton"); return g.length === 25 ? g : carton(BINGO); });
  const [m, setM] = useState<number[]>(() => leerLista("bingo_marcas").map(Number));
  const ya = useRef(hayLinea(m));
  const nuevo = () => { vibrar(10); const x = carton(BINGO); setC(x); setM([]); ya.current = false; guardarLocal("bingo_carton", x); guardarLocal("bingo_marcas", []); };
  const toggle = (i: number) => {
    if (i === 12) return; vibrar(12);
    const n = m.includes(i) ? m.filter(x => x !== i) : [...m, i]; setM(n); guardarLocal("bingo_marcas", n);
    const linea = hayLinea(n); if (linea && !ya.current) { confeti(); vibrar([40, 50, 40, 50, 80]); } ya.current = linea;
  };
  useEffect(() => { guardarLocal("bingo_carton", c); }, [c]);
  const linea = hayLinea(m);
  const col = "#b5655a";
  return (
    <Escenario color={col} oscuro="#2e1512">
      <BarraJuego titulo="Bingo de la boda" onVolver={onVolver} derecha={<span style={{ fontSize: 12, opacity: .85, background: "rgba(0,0,0,.2)", borderRadius: 20, padding: "5px 10px" }}>{m.length}/24</span>}/>
      {linea
        ? <div style={{ textAlign: "center", fontFamily: "var(--titulo)", fontSize: 34, fontWeight: 600, marginBottom: 10, animation: "j-pop .5s ease" }}>¡Bingo!</div>
        : <div style={{ fontSize: 13, opacity: .85, textAlign: "center", marginBottom: 12 }}>Marca lo que va pasando. Línea completa gana.</div>}
      <div style={{ background: "#fffdfb", borderRadius: 22, padding: 8, boxShadow: "0 18px 36px -18px rgba(0,0,0,.6)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 5 }}>
          {"BINGO".split("").map(l => <div key={l} style={{ textAlign: "center", fontFamily: "var(--titulo)", fontSize: 22, fontWeight: 700, color: col, padding: "2px 0" }}>{l}</div>)}
          {c.map((f, i) => { const on = i === 12 || m.includes(i); return (
            <button key={i} onClick={() => toggle(i)} style={{ position: "relative", aspectRatio: "1", fontSize: 9.5, lineHeight: 1.15, padding: 4, borderRadius: 10, cursor: "pointer", overflow: "hidden",
              background: i === 12 ? col : on ? "#fbeee9" : "#fdf8f3", color: i === 12 ? "#fff" : "#5c3d2e", border: `1px solid ${on ? col + "55" : "#f0e0d0"}`, fontWeight: 500 }}>
              {i === 12 ? <span style={{ display: "grid", placeItems: "center", gap: 2 }}><IconoJuego n="estrella" tam={18}/><span style={{ fontSize: 8.5, fontWeight: 700 }}>LIBRE</span></span> : f}
              {on && i !== 12 && <span aria-hidden="true" style={{ position: "absolute", inset: "14%", borderRadius: "50%", border: `3px solid ${col}cc`, background: `${col}22`, animation: "j-sello .35s cubic-bezier(.3,1.4,.5,1) both" }}/>}
            </button>); })}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
        <Boton color="rgba(255,255,255,.18)" onClick={nuevo}><IconoJuego n="barajar" tam={17}/>Cartón nuevo</Boton>
        <Boton color="#ffffff" claro style={{ color: col }} onClick={() => imprimirCartones(12)}><IconoJuego n="impresora" tam={17}/>Imprimir 12</Boton>
      </div>
    </Escenario>
  );
}
function imprimirCartones(n: number) {
  const w = window.open("", "_blank"); if (!w) return;
  const pareja = (infoBoda().nombre || "").replace(/</g, "&lt;");
  const celdas = (cc: string[]) => cc.map(f => `<td>${f.replace(/</g, "&lt;")}</td>`);
  const tablas = Array.from({ length: n }, () => { const cc = celdas(carton(BINGO)); return `<div class="c"><h2>Bingo de la boda${pareja ? " · " + pareja : ""}</h2><table><tr>${"BINGO".split("").map(l => `<th>${l}</th>`).join("")}</tr>${[0, 1, 2, 3, 4].map(r => `<tr>${cc.slice(r * 5, r * 5 + 5).join("")}</tr>`).join("")}</table></div>`; });
  w.document.write(`<html><head><title>Bingo de la boda</title><style>body{font-family:Georgia,serif;color:#5c3d2e}.c{page-break-inside:avoid;margin:0 auto 28px;max-width:520px}h2{text-align:center;font-weight:400;font-size:16px}table{width:100%;border-collapse:collapse;table-layout:fixed}th{font-size:22px;color:#b5655a;padding:4px}td{border:1.5px solid #c9956a;height:82px;text-align:center;font-size:11px;padding:4px}</style></head><body>${tablas.join("")}<script>print()</script></body></html>`);
  w.document.close();
}

// ── CAZA DE FOTOS: lista con anillo de avance ────────────────────
export function CazaFotos({ onVolver }: { onVolver: () => void }) {
  const [hechas, setHechas] = useState<string[]>(() => leerLista("caza"));
  const t = (x: string) => { vibrar(10); const n = hechas.includes(x) ? hechas.filter(y => y !== x) : [...hechas, x]; setHechas(n); guardarLocal("caza", n); if (n.length === CAZA_FOTOS.length) confeti(); };
  const col = "#4f7fae", f = hechas.length / CAZA_FOTOS.length, r = 34, L = 2 * Math.PI * r;
  return (
    <Escenario color={col} oscuro="#14233a">
      <BarraJuego titulo="Caza de fotos" onVolver={onVolver}/>
      <div style={{ display: "flex", alignItems: "center", gap: 16, background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.18)", borderRadius: 20, padding: 14, marginBottom: 14 }}>
        <svg width="84" height="84" style={{ transform: "rotate(-90deg)", flexShrink: 0 }} aria-hidden="true"><circle cx="42" cy="42" r={r} fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="8"/>
          <circle cx="42" cy="42" r={r} fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - f)} style={{ transition: "stroke-dashoffset .6s ease" }}/></svg>
        <div><div style={{ fontFamily: "var(--titulo)", fontSize: 30, fontWeight: 600, lineHeight: 1 }}>{hechas.length}<span style={{ fontSize: 18, opacity: .7 }}> / {CAZA_FOTOS.length}</span></div>
          <div style={{ fontSize: 12.5, opacity: .85, marginTop: 4, lineHeight: 1.4 }}>Muéstrales la lista a los invitados. Las fotos se suben con el QR de la Galería.</div></div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {CAZA_FOTOS.map(x => { const on = hechas.includes(x); return (
          <button key={x} onClick={() => t(x)} className="j-tile" style={{ display: "flex", gap: 12, alignItems: "center", textAlign: "left", cursor: "pointer", color: "#fff",
            background: on ? "rgba(255,255,255,.18)" : "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 14, padding: "12px 12px", fontSize: 14 }}>
            <span style={{ width: 26, height: 26, borderRadius: 9, flexShrink: 0, display: "grid", placeItems: "center", background: on ? "#fff" : "transparent", color: col, border: on ? "none" : "2px solid rgba(255,255,255,.4)", transition: "all .25s" }}>
              {on && <span style={{ animation: "j-pop .3s ease" }}><IconoJuego n="check" tam={16} grosor={2.6}/></span>}</span>
            <span style={{ textDecoration: on ? "line-through" : "none", opacity: on ? .7 : 1 }}>{x}</span>
          </button>); })}
      </div>
    </Escenario>
  );
}

// ── TRIVIA DE LOS NOVIOS: ustedes escriben; en la fiesta, modo presentador ──
type Pregunta = { id: number; p: string; r: string };
export function Trivia({ onVolver }: { onVolver: () => void }) {
  const [data, setData] = useData<{ preguntas: Pregunta[] }>("trivia", { preguntas: [] });
  const [p, setP] = useState(""); const [r, setR] = useState("");
  const [modo, setModo] = useState<"editar" | "jugar">("editar");
  const [k, setK] = useState(0); const [ver, setVer] = useState(false);
  const lista = data.preguntas || [];
  const agregar = () => { if (!p.trim() || !r.trim()) return; vibrar(8); setData({ preguntas: [...lista, { id: Date.now(), p: p.trim(), r: r.trim() }] }); setP(""); setR(""); };
  const col = "#4f8a6b";
  const campo: React.CSSProperties = { background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.25)", borderRadius: 14, padding: "12px 14px", fontSize: 15, color: "#fff", outline: "none", width: "100%" };
  if (modo === "jugar" && lista.length) {
    const q = lista[k % lista.length];
    return (
      <Escenario color={col} oscuro="#10261b">
        <BarraJuego titulo="Trivia de los novios" onVolver={() => setModo("editar")} derecha={<span style={{ fontSize: 12, opacity: .85, background: "rgba(0,0,0,.2)", borderRadius: 20, padding: "5px 10px" }}>{(k % lista.length) + 1}/{lista.length}</span>}/>
        <div key={q.id} className="j-entrar" style={{ background: "#fffdfb", color: "#3b2a21", borderRadius: 26, padding: "30px 22px", textAlign: "center", minHeight: 190, display: "grid", placeItems: "center" }}>
          <div style={{ fontFamily: "var(--titulo)", fontSize: 28, fontWeight: 600, lineHeight: 1.25 }}>{q.p}</div></div>
        <div style={{ marginTop: 14 }}>
          <CartaGiro volteada={ver} color={col} icono="pregunta" etiqueta="Respuesta" alto={150} onToque={() => { vibrar(14); setVer(true); }}>{q.r}</CartaGiro>
        </div>
        <Boton color="#ffffff" claro style={{ width: "100%", marginTop: 16, color: col }} onClick={() => { setVer(false); setTimeout(() => setK(k + 1), 200); }}>Siguiente pregunta</Boton>
      </Escenario>
    );
  }
  return (
    <Escenario color={col} oscuro="#10261b">
      <BarraJuego titulo="Trivia de los novios" onVolver={onVolver}/>
      <div style={{ fontSize: 13.5, opacity: .85, marginBottom: 14, lineHeight: 1.5 }}>Escriban preguntas sobre ustedes («¿dónde fue la primera cita?»). En la fiesta, el animador las lee y las mesas compiten.</div>
      <form onSubmit={e => { e.preventDefault(); agregar(); }} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input id="tr-p" value={p} onChange={e => setP(e.target.value)} placeholder="Pregunta" aria-label="Pregunta" style={campo}/>
        <input id="tr-r" value={r} onChange={e => setR(e.target.value)} placeholder="Respuesta" aria-label="Respuesta" style={campo}/>
        <Boton color="#ffffff" claro style={{ color: col }}><IconoJuego n="mas" tam={18} grosor={2.3}/>Agregar pregunta</Boton>
      </form>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 14 }}>
        {lista.map((q, i) => (
          <div key={q.id} className="j-entrar" style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 14, padding: "10px 12px", display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontFamily: "var(--titulo)", fontSize: 20, fontWeight: 600, opacity: .6, width: 22 }}>{i + 1}</span>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14 }}>{q.p}</div><div style={{ fontSize: 12.5, opacity: .75, marginTop: 2 }}>{q.r}</div></div>
            <button onClick={() => setData({ preguntas: lista.filter(x => x.id !== q.id) })} aria-label="Borrar pregunta" style={{ width: 32, height: 32, borderRadius: 10, border: "none", background: "rgba(255,255,255,.1)", color: "#fff", cursor: "pointer", display: "grid", placeItems: "center" }}><IconoJuego n="basura" tam={16}/></button>
          </div>))}
      </div>
      {lista.length > 0 && <Boton color="#ffffff" claro style={{ width: "100%", marginTop: 16, color: col, padding: 17 }} onClick={() => { setModo("jugar"); setK(0); setVer(false); }}>Jugar ({lista.length} preguntas)</Boton>}
    </Escenario>
  );
}
