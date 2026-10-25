import { useRef, useState } from "react";
import { BarraJuego, Boton, CartaDeslizable, CartaGiro, Escenario, IconoJuego, confeti, guardarLocal, leerLista, leerLocal, vibrar } from "./comun";
import { DADOS, PACKS, PREFERIRIAS, QUIZ } from "./contenido";
import { sacar } from "./logica";

// Juegos en pareja que no son +18 (v2): mazo de preguntas por pack, ¿qué preferirías? en secreto,
// ¿cuánto me conoces? con marcador y dados en 3D.

type Carta = { id: string; texto: string };
const conId = (l: string[], pre: string): Carta[] => l.map((texto, i) => ({ id: `${pre}${i}`, texto }));
/** Los nombres de la pareja (los mismos que en verdad o reto). */
const nombres = (): [string, string] => { const a = leerLocal("vr_ajustes", { j1: "Diego", j2: "Camila" } as any); return [a.j1 || "Jugador 1", a.j2 || "Jugador 2"]; };
const COL1 = "#6f6bd8", COL2 = "#e0455f";
const Avatar = ({ n, col, tam = 36, brillo }: { n: string; col: string; tam?: number; brillo?: boolean }) =>
  <span style={{ width: tam, height: tam, borderRadius: "50%", display: "grid", placeItems: "center", fontWeight: 700, fontSize: tam * .4, background: col, flexShrink: 0, boxShadow: brillo ? "0 0 0 3px rgba(255,255,255,.6)" : "none", transition: "box-shadow .3s" }}>{(n.trim()[0] || "?").toUpperCase()}</span>;

/** Un mazo que no repite (guarda en el teléfono qué ya salió). */
function useMazo(clave: string, cartas: Carta[]) {
  const [actual, setActual] = useState<Carta | null>(null);
  const [vistas, setVistas] = useState(() => leerLista(clave).length % (cartas.length || 1));
  const otra = () => { const r = sacar(cartas, leerLista(clave)); guardarLocal(clave, r.usadas); setActual(r.carta); setVistas(r.usadas.length); };
  return { actual, otra, vistas, total: cartas.length };
}

// ── PARA CONOCERSE ──────────────────────────────────────────────
const ICONO_PACK: Record<string, string> = { acercandonos: "corazones", vida: "estrella", tierno: "charla", dificiles: "balanza" };
export function Packs({ onVolver }: { onVolver: () => void }) {
  const [pack, setPack] = useState<string | null>(null);
  const p = PACKS.find(x => x.id === pack);
  if (!p) return (
    <Escenario color="#4f7fae" oscuro="#14233a">
      <BarraJuego titulo="Para conocerse" onVolver={onVolver}/>
      <div style={{ fontSize: 13.5, opacity: .85, marginBottom: 16, lineHeight: 1.5 }}>Elijan un pack. Cada carta es una pregunta para responder los dos, por turnos.</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {PACKS.map((x, k) => (
          <button key={x.id} onClick={() => { vibrar(); setPack(x.id); }} className="j-tile j-entrar" style={{ animationDelay: `${k * .06}s`, position: "relative", overflow: "hidden", textAlign: "left", border: "1px solid rgba(255,255,255,.25)", cursor: "pointer",
            color: "#fff", borderRadius: 22, padding: "16px 14px", minHeight: 170, display: "flex", flexDirection: "column", justifyContent: "space-between",
            background: `linear-gradient(155deg, ${x.color}, ${x.color}99)`, boxShadow: `0 14px 26px -14px ${x.color}` }}>
            <span aria-hidden="true" style={{ position: "absolute", right: -26, bottom: -26, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,.14)" }}/>
            <span style={{ position: "relative", width: 46, height: 46, borderRadius: 15, background: "rgba(255,255,255,.2)", display: "grid", placeItems: "center" }}><IconoJuego n={ICONO_PACK[x.id] || "charla"} tam={24}/></span>
            <span style={{ position: "relative" }}>
              <span style={{ display: "block", fontFamily: "var(--titulo)", fontSize: 21, fontWeight: 600, lineHeight: 1.05 }}>{x.nombre}</span>
              <span style={{ display: "block", fontSize: 11.5, opacity: .9, marginTop: 6, lineHeight: 1.35 }}>{x.desc}</span>
              <span style={{ display: "block", fontSize: 10.5, opacity: .75, marginTop: 8, letterSpacing: ".1em" }}>{x.preguntas.length} PREGUNTAS</span>
            </span>
          </button>))}
      </div>
    </Escenario>
  );
  return <MazoPreguntas key={p.id} titulo={p.nombre} color={p.color} icono={ICONO_PACK[p.id] || "charla"} clave={`pack_${p.id}`} cartas={conId(p.preguntas, p.id)} onVolver={() => setPack(null)}/>;
}

function MazoPreguntas({ titulo, color, icono, clave, cartas, onVolver }: { titulo: string; color: string; icono: string; clave: string; cartas: Carta[]; onVolver: () => void }) {
  const { actual, otra, vistas, total } = useMazo(clave, cartas);
  const [volteada, setVolteada] = useState(false);
  const [n1, n2] = nombres(); const [turno, setTurno] = useState(0);
  const sacarOtra = () => { vibrar(10); setVolteada(false); setTimeout(() => { otra(); setTurno(t => 1 - t); setTimeout(() => setVolteada(true), 60); }, actual ? 200 : 0); };
  return (
    <Escenario color={color} oscuro="#171f30">
      <BarraJuego titulo={titulo} onVolver={onVolver} derecha={<span style={{ fontSize: 12, opacity: .85, background: "rgba(0,0,0,.2)", borderRadius: 20, padding: "5px 10px", fontVariantNumeric: "lining-nums" }}>{vistas}/{total}</span>}/>
      <div style={{ height: 4, borderRadius: 4, background: "rgba(255,255,255,.18)", marginBottom: 18, overflow: "hidden" }}><div style={{ width: `${(vistas / total) * 100}%`, height: "100%", background: "#fff", transition: "width .5s ease" }}/></div>
      {/* El mazo: dos cartas de fondo y la de arriba */}
      <div style={{ position: "relative", paddingTop: 14 }}>
        {[2, 1].map(k => <div key={k} aria-hidden="true" style={{ position: "absolute", left: k * 10, right: k * 10, top: 14 - k * 7, height: 320, borderRadius: 26, background: `${color}`, opacity: .35 + (2 - k) * .2, transform: `rotate(${k === 2 ? -3 : 2}deg)` }}/>)}
        <CartaDeslizable key={actual?.id || "inicio"} onDerecha={sacarOtra} onIzquierda={sacarOtra} textoDerecha="SIGUIENTE" textoIzquierda="SIGUIENTE" colorDerecha={color} colorIzquierda={color} activa={!!actual && volteada}>
          <CartaGiro volteada={!!actual && volteada} color={color} icono={icono} etiqueta={actual ? `Responde primero ${turno ? n2 : n1}` : undefined} alto={320} onToque={!actual ? sacarOtra : undefined}>
            {actual?.texto || ""}
          </CartaGiro>
        </CartaDeslizable>
      </div>
      <div style={{ textAlign: "center", fontSize: 12, opacity: .75, margin: "16px 0 12px" }}>{actual ? "Desliza la carta o toca «Otra pregunta»" : "Toca la carta para empezar"}</div>
      <Boton color="#ffffff" claro style={{ width: "100%", color }} onClick={sacarOtra}><IconoJuego n="barajar" tam={18}/>{actual ? "Otra pregunta" : "Empezar"}</Boton>
    </Escenario>
  );
}

// ── ¿QUÉ PREFERIRÍAS? (cada uno elige en secreto) ───────────────
export function Preferirias({ onVolver }: { onVolver: () => void }) {
  const cartas = PREFERIRIAS.map(([a, b], i) => ({ id: `pr${i}`, texto: `${a}|${b}` }));
  const { actual, otra } = useMazo("preferirias", cartas);
  const [n1, n2] = nombres();
  const [fase, setFase] = useState<"j1" | "pasar" | "j2" | "ver">("j1");
  const [elec, setElec] = useState<[number, number]>([-1, -1]);
  const [coinc, setCoinc] = useState(() => leerLocal("pref_coinc", { si: 0, de: 0 }));
  const [a, b] = (actual?.texto || "|").split("|");
  const col = "#7d5ca8";
  const nueva = () => { otra(); setFase("j1"); setElec([-1, -1]); vibrar(10); };
  const elegir = (k: number) => {
    vibrar(14);
    if (fase === "j1") { setElec([k, -1]); setFase("pasar"); return; }
    const e: [number, number] = [elec[0], k]; setElec(e); setFase("ver");
    const n = { si: coinc.si + (e[0] === e[1] ? 1 : 0), de: coinc.de + 1 }; setCoinc(n); guardarLocal("pref_coinc", n);
    if (e[0] === e[1]) setTimeout(() => confeti(window.innerWidth / 2, window.innerHeight * .4), 250);
  };
  const Opcion = ({ k, texto, colA }: { k: number; texto: string; colA: string }) => {
    const elegida1 = fase === "ver" && elec[0] === k, elegida2 = fase === "ver" && elec[1] === k;
    return (
      <button disabled={fase === "pasar" || fase === "ver"} onClick={() => elegir(k)} className="j-tile j-entrar" style={{ position: "relative", width: "100%", minHeight: 150, border: "none", cursor: fase === "ver" ? "default" : "pointer", borderRadius: 26,
        padding: "22px 18px", color: "#fff", background: `linear-gradient(150deg, ${colA}, ${colA}aa)`, boxShadow: `0 14px 28px -14px ${colA}`, display: "grid", placeItems: "center", textAlign: "center",
        opacity: fase === "ver" && !elegida1 && !elegida2 ? .45 : 1, transition: "opacity .4s ease, transform .2s" }}>
        <span style={{ fontFamily: "var(--titulo)", fontSize: 25, fontWeight: 600, lineHeight: 1.2 }}>{texto}</span>
        {fase === "ver" && (elegida1 || elegida2) && <span style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 4 }}>
          {elegida1 && <span style={{ animation: "j-pop .4s ease both" }}><Avatar n={n1} col={COL1} tam={30} brillo/></span>}
          {elegida2 && <span style={{ animation: "j-pop .4s .12s ease both" }}><Avatar n={n2} col={COL2} tam={30} brillo/></span>}</span>}
      </button>
    );
  };
  return (
    <Escenario color={col} oscuro="#1d1430">
      <BarraJuego titulo="¿Qué preferirías?" onVolver={onVolver} derecha={coinc.de ? <span style={{ fontSize: 12, opacity: .85, background: "rgba(0,0,0,.2)", borderRadius: 20, padding: "5px 10px", whiteSpace: "nowrap" }}>{coinc.si}/{coinc.de} coincidencias</span> : undefined}/>
      {!actual ? (
        <div className="j-entrar" style={{ textAlign: "center", padding: "40px 10px" }}>
          <div style={{ width: 90, height: 90, borderRadius: "50%", margin: "0 auto", background: "rgba(255,255,255,.14)", display: "grid", placeItems: "center" }}><IconoJuego n="balanza" tam={44}/></div>
          <div style={{ fontFamily: "var(--titulo)", fontSize: 26, fontWeight: 600, marginTop: 16 }}>Dos opciones, una sola respuesta</div>
          <div style={{ fontSize: 13.5, opacity: .85, marginTop: 8, lineHeight: 1.5 }}>Primero elige {n1} sin que {n2} vea. Después le pasa el teléfono. Al final se revela si coincidieron.</div>
          <Boton color="#ffffff" claro style={{ width: "100%", marginTop: 24, color: col }} onClick={nueva}>Empezar</Boton>
        </div>
      ) : fase === "pasar" ? (
        <div className="j-entrar" style={{ textAlign: "center", padding: "50px 10px" }}>
          <Avatar n={n2} col={COL2} tam={80}/>
          <div style={{ fontFamily: "var(--titulo)", fontSize: 30, fontWeight: 600, marginTop: 18 }}>Pásale el teléfono a {n2}</div>
          <div style={{ fontSize: 13.5, opacity: .8, marginTop: 6 }}>{n1} ya eligió. ¡Que no mire!</div>
          <Boton color="#ffffff" claro style={{ width: "100%", marginTop: 26, color: col }} onClick={() => { vibrar(); setFase("j2"); }}>Soy {n2}, mostrar</Boton>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 14 }}>
            {fase === "ver"
              ? <span style={{ fontFamily: "var(--titulo)", fontSize: 28, fontWeight: 600, animation: "j-pop .5s ease" }}>{elec[0] === elec[1] ? "¡Coinciden!" : "No coincidieron"}</span>
              : <><Avatar n={fase === "j1" ? n1 : n2} col={fase === "j1" ? COL1 : COL2} tam={32}/><span style={{ fontSize: 15, fontWeight: 600 }}>Elige {fase === "j1" ? n1 : n2}</span></>}
          </div>
          <div key={actual.id} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Opcion k={0} texto={a} colA="#9a6fd0"/>
            <div style={{ textAlign: "center", fontFamily: "var(--titulo)", fontSize: 22, fontStyle: "italic", opacity: .8 }}>o</div>
            <Opcion k={1} texto={b} colA="#d06f9a"/>
          </div>
          {fase === "ver" && <Boton color="#ffffff" claro style={{ width: "100%", marginTop: 18, color: col }} onClick={nueva}>Siguiente dilema</Boton>}
        </div>
      )}
    </Escenario>
  );
}

// ── ¿CUÁNTO ME CONOCES? ─────────────────────────────────────────
export function Quiz({ onVolver }: { onVolver: () => void }) {
  const { actual, otra } = useMazo("quiz", conId(QUIZ, "q"));
  const [n1, n2] = nombres();
  const [ronda, setRonda] = useState(0);
  const [puntos, setPuntos] = useState<[number, number]>([0, 0]);
  const [volteada, setVolteada] = useState(false);
  const quien = ronda % 2;                          // quién adivina
  const responde = quien ? n1 : n2, adivina = quien ? n2 : n1;
  const col = "#4f8a6b";
  const nueva = () => { setVolteada(false); setTimeout(() => { otra(); setTimeout(() => setVolteada(true), 60); }, actual ? 180 : 0); };
  const anotar = (bien: boolean) => {
    if (bien) { setPuntos(p => quien === 0 ? [p[0] + 1, p[1]] : [p[0], p[1] + 1]); confeti(window.innerWidth / 2, window.innerHeight * .45, ["#bff0d4", "#ffffff", "#7fd1a6"]); vibrar([16, 30, 16]); } else vibrar(40);
    setRonda(r => r + 1); nueva();
  };
  const max = Math.max(5, puntos[0], puntos[1]);
  return (
    <Escenario color={col} oscuro="#10261b">
      <BarraJuego titulo="¿Cuánto me conoces?" onVolver={onVolver}/>
      {/* Carrera de puntos */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
        {[0, 1].map(i => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, opacity: quien === i ? 1 : .7 }}>
            <Avatar n={i ? n2 : n1} col={i ? COL2 : COL1} tam={30} brillo={quien === i}/>
            <div style={{ flex: 1, height: 12, borderRadius: 12, background: "rgba(255,255,255,.15)", overflow: "hidden" }}>
              <div style={{ width: `${(puntos[i] / max) * 100}%`, height: "100%", borderRadius: 12, background: i ? COL2 : COL1, transition: "width .6s cubic-bezier(.3,1.3,.5,1)" }}/></div>
            <span style={{ fontFamily: "var(--titulo)", fontSize: 22, fontWeight: 600, width: 26, textAlign: "right" }}>{puntos[i]}</span>
          </div>))}
      </div>
      <CartaGiro volteada={!!actual && volteada} color={col} icono="cerebro" etiqueta={actual ? `${responde} responde en secreto · ${adivina} adivina` : undefined} alto={290} onToque={!actual ? nueva : undefined}>
        {actual?.texto || ""}
      </CartaGiro>
      {actual ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
          <Boton color="#ffffff" claro style={{ color: "#a03050" }} onClick={() => anotar(false)}><IconoJuego n="equis" tam={18} grosor={2.4}/>No le achuntó</Boton>
          <Boton color="#3f9a6e" onClick={() => anotar(true)}><IconoJuego n="check" tam={18} grosor={2.4}/>Acertó</Boton>
        </div>
      ) : <Boton color="#ffffff" claro style={{ width: "100%", marginTop: 16, color: col }} onClick={nueva}>Empezar</Boton>}
      <div style={{ fontSize: 12, opacity: .75, textAlign: "center", marginTop: 12, lineHeight: 1.45 }}>Quien responde lo anota o se lo dice al oído a un tercero. Después se cambian.</div>
    </Escenario>
  );
}

// ── DADOS DEL AMOR (3D) ─────────────────────────────────────────
// Cada dado es un cubo con 6 caras; al tirarlo da varias vueltas y cae en la cara elegida.
const CARAS_ROT = ["rotateX(0deg) rotateY(0deg)", "rotateY(-90deg)", "rotateY(-180deg)", "rotateY(90deg)", "rotateX(-90deg)", "rotateX(90deg)"];
const CARAS_POS = (m: number) => [`translateZ(${m}px)`, `rotateY(90deg) translateZ(${m}px)`, `rotateY(180deg) translateZ(${m}px)`, `rotateY(-90deg) translateZ(${m}px)`, `rotateX(90deg) translateZ(${m}px)`, `rotateX(-90deg) translateZ(${m}px)`];
function Dado({ caras, cara, vueltas, color, tam = 128 }: { caras: string[]; cara: number; vueltas: number; color: string; tam?: number }) {
  const m = tam / 2;
  return (
    <div style={{ width: tam, height: tam, perspective: 700 }}>
      <div style={{ width: "100%", height: "100%", position: "relative", transformStyle: "preserve-3d", transition: "transform 1.2s cubic-bezier(.2,.9,.25,1.08)",
        transform: `rotateX(${vueltas * 360}deg) rotateY(${vueltas * 720}deg) ${CARAS_ROT[cara]}` }}>
        {CARAS_POS(m).map((t, i) => (
          <div key={i} style={{ position: "absolute", inset: 0, transform: t, borderRadius: 22, background: `linear-gradient(145deg, #ffffff, #f3e6ef)`, color, border: `2px solid ${color}33`,
            display: "grid", placeItems: "center", textAlign: "center", padding: 10, fontFamily: "var(--titulo)", fontSize: 19, fontWeight: 600, lineHeight: 1.1,
            boxShadow: "inset 0 -6px 14px rgba(0,0,0,.08)", backfaceVisibility: "hidden" }}>{caras[i % caras.length]}</div>))}
      </div>
    </div>
  );
}
export function Dados({ onVolver }: { onVolver: () => void }) {
  const [nivel, setNivel] = useState<keyof typeof DADOS>("suave");
  const [caras, setCaras] = useState<[number, number]>([0, 0]);
  const [vueltas, setVueltas] = useState(0);
  const [listo, setListo] = useState(false);
  const girando = useRef(false);
  const col = ({ suave: "#d4708f", caliente: "#d2445c", picante: "#8d1a3c" } as Record<string, string>)[nivel] || "#d2445c";
  const d = DADOS[nivel];
  const tirar = () => {
    if (girando.current) return; girando.current = true; setListo(false); vibrar([10, 40, 10, 40, 10]);
    setCaras([Math.floor(Math.random() * 6), Math.floor(Math.random() * 6)]); setVueltas(v => v + 2);
    setTimeout(() => { girando.current = false; setListo(true); vibrar(30); }, 1250);
  };
  return (
    <Escenario color={col} oscuro="#22091a">
      <BarraJuego titulo="Dados del amor" onVolver={onVolver}/>
      <div style={{ display: "flex", background: "rgba(0,0,0,.22)", borderRadius: 14, padding: 4, gap: 4, marginBottom: 26 }}>
        {(Object.keys(DADOS) as (keyof typeof DADOS)[]).map(n => { const on = n === nivel; return (
          <button key={n} onClick={() => { vibrar(6); setNivel(n); setListo(false); }} style={{ flex: 1, border: "none", borderRadius: 11, padding: "9px 6px", fontSize: 13, fontWeight: 600, cursor: "pointer", textTransform: "capitalize",
            background: on ? "#fff" : "transparent", color: on ? col : "rgba(255,255,255,.85)", transition: "all .25s" }}>{n}</button>); })}
      </div>
      <div onClick={tirar} style={{ display: "flex", justifyContent: "center", gap: 26, padding: "20px 0 10px", cursor: "pointer" }}>
        <Dado caras={d.acciones} cara={caras[0]} vueltas={vueltas} color={col}/>
        <Dado caras={d.lugares} cara={caras[1]} vueltas={vueltas + 1} color={col}/>
      </div>
      <div style={{ minHeight: 86, textAlign: "center", marginTop: 18 }}>
        {listo ? <div className="j-entrar">
            <div style={{ fontSize: 11, letterSpacing: ".24em", textTransform: "uppercase", opacity: .75 }}>Durante 30 segundos</div>
            <div style={{ fontFamily: "var(--titulo)", fontSize: 30, fontWeight: 600, marginTop: 6 }}>{d.acciones[caras[0]]} {d.lugares[caras[1]]}</div>
          </div>
          : <div style={{ fontSize: 13.5, opacity: .8, paddingTop: 16 }}>Toca los dados para tirarlos</div>}
      </div>
      <Boton color="#ffffff" claro style={{ width: "100%", color: col }} onClick={tirar}><IconoJuego n="dados" tam={20}/>Tirar los dados</Boton>
    </Escenario>
  );
}
