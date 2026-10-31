import { useEffect, useMemo, useRef, useState } from "react";
import { BarraJuego, Boton, Escenario, IconoJuego, Opciones, confeti, vibrar } from "./comun";
import { BANCO, LETRAS_ROSCO, TEMAS_ROSCO, TemaRosco, anotarHistorial, armarRosco, cuatroDe, historial, palabrasPuzzle, pistaDe } from "./contenidoPasapalabra";
import { azarDe, barajar, desordenar, estadoAhorcado, jugarRosco, pausarRosco, puntajeRosco, seguirRosco } from "./logica";
import { Sala, anfitrion, cambiar, jugadores, useFaltan } from "./sala";
import { Avatar, Panel, Pildora, PropsJuego, Rotulo, VACIO, VolverSala, nombreDe } from "./uiGrupo";

// ═══════════════════════════════════════════════════════════════════
// PASAPALABRA v2 (31-oct-2026), como en la tele:
//   1. Pruebas para ganar segundos (cada concursante en su teléfono): Una de cuatro (+2 s por acierto),
//      Letras desordenadas (+3 s) y El ahorcado (+3 s).
//   2. El rosco: 85 s + lo ganado. Cada uno tiene su reloj: al pasar o fallar se detiene el suyo y
//      parte solo el del otro. El presentador (el que abrió la sala) ve las respuestas y marca.
// ═══════════════════════════════════════════════════════════════════
type Tema = TemaRosco;
type Nivel = 1 | 2 | 3;
const PRUEBAS: Record<string, { t: string; desc: string; seg: number; dur: number; icono: string }> = {
  cuatro: { t: "Una de cuatro", desc: "Una pregunta y cuatro opciones. Toca la correcta: cada acierto suma 2 segundos.", seg: 2, dur: 40, icono: "pregunta" },
  letras: { t: "Letras desordenadas", desc: "Arma la palabra tocando las letras en orden. Cada palabra suma 3 segundos.", seg: 3, dur: 45, icono: "barajar" },
  ahorcado: { t: "El ahorcado", desc: "Adivina la palabra letra por letra antes de 6 errores. Cada palabra suma 3 segundos.", seg: 3, dur: 60, icono: "equis" },
};
const NIVELES: [Nivel, string][] = [[1, "Fácil"], [2, "Normal"], [3, "Difícil"]];

// ── Opciones (sala de espera) ─────────────────────────────────────
export function ConfigRosco({ sala, cfg, poner, color }: { sala: Sala; cfg: any; poner: (c: any) => void; color: string }) {
  const js = jugadores(sala).filter(j => j.pid !== anfitrion(sala));
  const conc: string[] = (cfg.conc || []).filter((p: string) => sala.jug[p]);
  const toggle = (p: string) => poner({ conc: conc.includes(p) ? conc.filter(x => x !== p) : [...conc, p].slice(-2) });
  const pruebas: string[] = cfg.pruebas || [];
  return <>
    <div style={{ fontSize: 12.5, opacity: .85, marginBottom: 12, lineHeight: 1.45 }}>Tú eres el presentador: ves las respuestas y marcas si acertaron. Elige 1 o 2 concursantes.</div>
    <Rotulo>Concursantes</Rotulo>
    {js.length ? <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{js.map(j => <Pildora key={j.pid} on={conc.includes(j.pid)} color={color} onClick={() => toggle(j.pid)}>{j.n}</Pildora>)}</div>
      : <div style={{ fontSize: 13, opacity: .75 }}>Cuando alguien se una, aparece acá.</div>}
    <Rotulo style={{ marginTop: 14 }}>Tema</Rotulo>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{TEMAS_ROSCO.map(([id, l]) => <Pildora key={id} on={(cfg.tema || "general") === id} color={color} onClick={() => poner({ tema: id })}>{l}</Pildora>)}</div>
    <Rotulo style={{ marginTop: 14 }}>Dificultad</Rotulo>
    <Opciones valor={cfg.nivel || 2} opciones={NIVELES} onCambiar={v => poner({ nivel: v })}/>
    <Rotulo style={{ marginTop: 14 }}>Pruebas para ganar segundos</Rotulo>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {Object.entries(PRUEBAS).map(([id, p]) => <Pildora key={id} on={pruebas.includes(id)} color={color}
        onClick={() => poner({ pruebas: pruebas.includes(id) ? pruebas.filter(x => x !== id) : Object.keys(PRUEBAS).filter(x => x === id || pruebas.includes(x)) })}>{p.t}</Pildora>)}
    </div>
    <div style={{ fontSize: 12, opacity: .75, marginTop: 8, lineHeight: 1.45 }}>{pruebas.length ? "Lo que ganen en las pruebas se suma a su tiempo del rosco." : "Sin pruebas: van directo al rosco."}</div>
    <Rotulo style={{ marginTop: 14 }}>Tiempo base del rosco</Rotulo>
    <Opciones valor={cfg.base || 85} opciones={[[60, "60 s"], [85, "85 s (tele)"], [120, "120 s"]]} onCambiar={v => poner({ base: v })}/>
  </>;
}

/** Lo que se escribe al empezar: los roscos de cada concursante y, si hay pruebas, la primera. */
export function inicioRosco(sala: Sala, cfg: any): Record<string, any> {
  const conc: string[] = (cfg.conc || []).filter((p: string) => sala.jug[p]).slice(0, 2);
  const tema: Tema = BANCO[cfg.tema as Tema] ? cfg.tema : "general", nivel: Nivel = cfg.nivel || 2;
  // Lo de las últimas partidas en este teléfono no se repite (hasta que se acabe el banco).
  const reciente = historial(), usadas = new Set<string>(reciente);
  // Mapa {0: [...], 1: [...]}: Firestore no acepta una lista dentro de otra.
  const sel = Object.fromEntries(conc.map((_, i) => [String(i), armarRosco(tema, nivel, usadas)]));
  anotarHistorial(Object.values(sel).flat().map(k => BANCO[tema][k].r));
  const pruebas: string[] = (cfg.pruebas || []).filter((x: string) => PRUEBAS[x]);
  const bonus = Object.fromEntries(conc.map((_, i) => [String(i), 0]));
  const rosco = { tema, nivel, base: cfg.base || 85, conc, sel, est: conc.map(() => "-".repeat(25)), pos: conc.map(() => 0), turno: 0, desde: 0, bonus };
  return { est: "juego", cfg, v: {}, ron: pruebas.length
    ? { ...rosco, fase: "pruebas", rest: conc.map(() => 0), pr: { lista: pruebas, k: 0, t: 0, est: "espera" } }
    : { ...rosco, fase: "juego", rest: conc.map(() => (cfg.base || 85) * 1000) } };
}

// ── La sala ───────────────────────────────────────────────────────
export function RoscoSala(props: PropsJuego) {
  const r = props.sala.ron || VACIO;
  if (r.fase === "pruebas") return <Pruebas {...props}/>;
  return <ElRosco {...props}/>;
}

const marcadorBonus = (sala: Sala, r: any, yo: string, activo = -1) => (
  <div style={{ display: "grid", gridTemplateColumns: (r.conc || []).length > 1 ? "1fr 1fr" : "1fr", gap: 8, marginBottom: 12 }}>
    {(r.conc || []).map((p: string, i: number) => (
      <div key={p} style={{ borderRadius: 16, padding: "8px 10px", display: "flex", alignItems: "center", gap: 8, background: i === activo ? "rgba(255,209,102,.22)" : "rgba(255,255,255,.08)", border: i === activo ? "2px solid #ffd166" : "1px solid rgba(255,255,255,.16)" }}>
        <Avatar n={nombreDe(sala, p)} tam={30}/>
        <div style={{ minWidth: 0, flex: 1 }}><div style={{ fontWeight: 700, fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nombreDe(sala, p)}{p === yo ? " (tú)" : ""}</div>
          <div style={{ fontSize: 12, opacity: .9, fontVariantNumeric: "tabular-nums" }}>{r.base || 85} s <b style={{ color: "#8be0a8" }}>+ {r.bonus?.[i] || 0} s ganados</b></div></div>
      </div>))}
  </div>);

// ── 1. Pruebas ────────────────────────────────────────────────────
function Pruebas({ sala, yo, host, meta, onSalir }: PropsJuego) {
  const r = sala.ron || VACIO, pr = r.pr || {}, col = meta.color;
  const id: string = pr.lista?.[pr.k] || "cuatro", P = PRUEBAS[id];
  const conc: string[] = r.conc || [];
  const quien = conc[pr.t], soyYo = quien === yo, estaAca = !!sala.jug[quien];
  const faltan = useFaltan(pr.est === "juega" ? pr.fin : 0);
  const tema: Tema = BANCO[r.tema as Tema] ? r.tema : "general", nivel: Nivel = r.nivel || 2;
  const cerrado = useRef("");
  // Se acabó el tiempo: lo cierra el teléfono del concursante (o el anfitrión, si el concursante se fue).
  useEffect(() => {
    if (pr.est !== "juega" || faltan > 0 || !pr.fin) return;
    const clave = `${pr.k}-${pr.t}-${pr.fin}`; if (cerrado.current === clave) return;
    if (!(soyYo || (host && !estaAca))) return;
    cerrado.current = clave; vibrar([60, 40, 60]);
    cambiar(sala.id, { "ron.pr.est": "listo" });
  }, [pr.est, faltan, pr.fin, pr.k, pr.t, soyYo, host, estaAca, sala.id]);

  const partir = () => {
    const az = azarDe(`${sala.id}-${pr.k}-${pr.t}-${Date.now()}`);
    const items = id === "cuatro"
      ? barajar(cuatroDe(tema).map((q, i) => ({ q, i })).filter(({ q }) => Math.abs(q[5] - nivel) <= 1).map(x => x.i), az).slice(0, 30)
      : barajar(palabrasPuzzle(tema, nivel), az).slice(0, 25);
    vibrar(30);
    cambiar(sala.id, { "ron.pr.est": "juega", "ron.pr.fin": Date.now() + P.dur * 1000, "ron.pr.items": items, "ron.pr.i": 0, "ron.pr.ok": 0, "ron.pr.us": "", "ron.pr.ult": null });
  };
  const avanzar = () => {
    const sig = pr.t + 1 < conc.length ? { "ron.pr.t": pr.t + 1, "ron.pr.est": "espera" }
      : pr.k + 1 < (pr.lista || []).length ? { "ron.pr.k": pr.k + 1, "ron.pr.t": 0, "ron.pr.est": "espera" }
      : { "ron.fase": "juego", "ron.rest": conc.map((_, i) => ((r.base || 85) + (r.bonus?.[i] || 0)) * 1000), "ron.desde": 0, "ron.turno": 0 };
    cambiar(sala.id, sig);
  };
  const acierto = (extra: Record<string, any> = {}) => { vibrar(25); cambiar(sala.id, { "ron.pr.i": (pr.i || 0) + 1, "ron.pr.ok": (pr.ok || 0) + 1, [`ron.bonus.${pr.t}`]: (r.bonus?.[pr.t] || 0) + P.seg, "ron.pr.us": "", "ron.pr.ult": { i: pr.i, bien: true }, ...extra }); };
  const fallo = () => { vibrar([10, 30, 10]); cambiar(sala.id, { "ron.pr.i": (pr.i || 0) + 1, "ron.pr.us": "", "ron.pr.ult": { i: pr.i, bien: false } }); };

  const cabecera = (
    <>
      <BarraJuego titulo="Pasapalabra" onVolver={onSalir} derecha={<span style={{ fontSize: 12, background: "rgba(0,0,0,.22)", borderRadius: 20, padding: "5px 10px" }}>Prueba {pr.k + 1} de {(pr.lista || []).length}</span>}/>
      {marcadorBonus(sala, r, yo, pr.t)}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ width: 42, height: 42, borderRadius: 14, background: "rgba(255,255,255,.14)", display: "grid", placeItems: "center" }}><IconoJuego n={P.icono} tam={22}/></span>
        <div style={{ flex: 1 }}><div style={{ fontFamily: "var(--titulo)", fontSize: 26, fontWeight: 600, lineHeight: 1 }}>{P.t}</div>
          <div style={{ fontSize: 12.5, opacity: .8, marginTop: 3 }}>Juega {nombreDe(sala, quien)}{soyYo ? " (tú)" : ""}</div></div>
        {pr.est === "juega" && <div style={{ fontFamily: "var(--titulo)", fontSize: 38, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: faltan <= 10 ? "#ffb3b3" : "#fff" }}>{faltan}</div>}
      </div>
    </>);

  let cuerpo: React.ReactNode = null;
  if (pr.est === "espera") cuerpo = (
    <Panel style={{ textAlign: "center", padding: 22 }}>
      <div style={{ fontSize: 14.5, lineHeight: 1.5 }}>{P.desc}</div>
      <div style={{ fontSize: 12.5, opacity: .75, marginTop: 6 }}>Tienes {P.dur} segundos.</div>
      {soyYo ? <Boton color="#ffffff" claro style={{ width: "100%", marginTop: 16, color: col, padding: 17 }} onClick={partir}>¡Partir!</Boton>
        : <div style={{ marginTop: 14, fontWeight: 600 }}>Esperando que {nombreDe(sala, quien)} parta…</div>}
      {host && !soyYo && !estaAca && <Boton color="rgba(255,255,255,.14)" style={{ width: "100%", marginTop: 10 }} onClick={avanzar}>{nombreDe(sala, quien)} se fue: saltar</Boton>}
    </Panel>);
  else if (pr.est === "listo") cuerpo = (
    <Panel style={{ textAlign: "center", padding: 22 }}>
      <div style={{ fontFamily: "var(--titulo)", fontSize: 56, fontWeight: 700, lineHeight: 1 }}>+{(pr.ok || 0) * P.seg} s</div>
      <div style={{ fontSize: 13.5, opacity: .85, marginTop: 6 }}>{nombreDe(sala, quien)} acertó {pr.ok || 0} en «{P.t}».</div>
      {(soyYo || host) && <Boton color="#ffffff" claro style={{ width: "100%", marginTop: 16, color: col }} onClick={avanzar}>
        {pr.t + 1 < conc.length ? `Le toca a ${nombreDe(sala, conc[pr.t + 1])}` : pr.k + 1 < (pr.lista || []).length ? `Siguiente prueba: ${PRUEBAS[pr.lista[pr.k + 1]].t}` : "¡Al rosco!"}</Boton>}
    </Panel>);
  else if (id === "cuatro") cuerpo = <UnaDeCuatro sala={sala} pr={pr} tema={tema} soyYo={soyYo} host={host} onBien={acierto} onMal={fallo}/>;
  else if (id === "letras") cuerpo = <Letras sala={sala} pr={pr} tema={tema} soyYo={soyYo} host={host} onBien={acierto} onSaltar={fallo}/>;
  else cuerpo = <Ahorcado sala={sala} pr={pr} tema={tema} soyYo={soyYo} host={host} onBien={acierto} onMal={fallo}/>;

  return (
    <Escenario color={col} oscuro={meta.oscuro}>
      {cabecera}{cuerpo}
      {host && pr.est !== "listo" && <Boton color="rgba(255,255,255,.12)" style={{ width: "100%", marginTop: 12 }} onClick={() => cambiar(sala.id, { "ron.pr.est": "listo" })}>Terminar este turno</Boton>}
      {host && <Boton color="rgba(255,255,255,.12)" style={{ width: "100%", marginTop: 8 }} onClick={() => cambiar(sala.id, { "ron.fase": "juego", "ron.rest": conc.map((_, i) => ((r.base || 85) + (r.bonus?.[i] || 0)) * 1000), "ron.desde": 0, "ron.turno": 0 })}>Saltar las pruebas e ir al rosco</Boton>}
    </Escenario>
  );
}
type PropsPrueba = { sala: Sala; pr: any; tema: Tema; soyYo: boolean; host: boolean };
const Destello = ({ ult, i }: { ult: any; i: number }) => ult && ult.i === i - 1
  ? <div key={`u${i}`} style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: ult.bien ? "#8be0a8" : "#ff9aa8", marginBottom: 8, animation: "j-pop .35s ease" }}>{ult.bien ? "¡Correcto!" : "No era…"}</div> : null;

function UnaDeCuatro({ sala, pr, tema, soyYo, host, onBien, onMal }: PropsPrueba & { onBien: () => void; onMal: () => void }) {
  const qi = (pr.items || [])[pr.i || 0];
  const q = cuatroDe(tema)[qi];
  const opciones = useMemo(() => q ? barajar(q.slice(1, 5) as string[], azarDe(`${sala.id}-${qi}`)) : [], [q, qi, sala.id]);
  if (!q) return <Panel>Se acabaron las preguntas.</Panel>;
  return (
    <div>
      <Destello ult={pr.ult} i={pr.i || 0}/>
      <div key={qi} className="j-entrar" style={{ background: "#fffdfb", color: "#1d2a44", borderRadius: 22, padding: "18px 18px", fontSize: 19, fontWeight: 600, lineHeight: 1.4, textAlign: "center" }}>{q[0]}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
        {opciones.map(o => (
          <button key={o} disabled={!soyYo} onClick={() => (o === q[1] ? onBien() : onMal())} className="j-tile"
            style={{ minHeight: 64, borderRadius: 16, border: host && o === q[1] ? "2px solid #8be0a8" : "1px solid rgba(255,255,255,.25)", background: "rgba(255,255,255,.12)", color: "#fff", fontSize: 15, fontWeight: 600, padding: "10px 8px", cursor: soyYo ? "pointer" : "default" }}>{o}</button>))}
      </div>
      {!soyYo && <div style={{ textAlign: "center", fontSize: 12.5, opacity: .75, marginTop: 10 }}>Responde en su teléfono{host ? " · la correcta tiene borde verde" : ""}.</div>}
    </div>);
}

function Letras({ sala, pr, tema, soyYo, host, onBien, onSaltar }: PropsPrueba & { onBien: () => void; onSaltar: () => void }) {
  const palabra: string = (pr.items || [])[pr.i || 0] || "";
  const fichas = useMemo(() => desordenar(palabra, `${sala.id}-${palabra}`), [palabra, sala.id]);
  const [toc, setToc] = useState<number[]>([]);
  const [mal, setMal] = useState(false);
  useEffect(() => { setToc([]); }, [palabra]);
  useEffect(() => {
    if (!soyYo || toc.length !== palabra.length || !palabra) return;
    if (toc.map(k => fichas[k]).join("") === palabra) onBien();
    else { setMal(true); vibrar([10, 30, 10]); setTimeout(() => { setMal(false); setToc([]); }, 500); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toc]);
  if (!palabra) return <Panel>Se acabaron las palabras.</Panel>;
  const armada = toc.map(k => fichas[k]);
  return (
    <div>
      <Destello ult={pr.ult} i={pr.i || 0}/>
      <Panel style={{ textAlign: "center" }}><Rotulo style={{ marginBottom: 4 }}>Pista</Rotulo><div style={{ fontSize: 15.5, lineHeight: 1.4 }}>{pistaDe(tema, palabra)}</div></Panel>
      <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 5, margin: "16px 0", animation: mal ? "j-temblar .25s ease 2" : "none" }}>
        {palabra.split("").map((_, k) => <span key={k} style={{ width: 34, height: 42, borderRadius: 9, display: "grid", placeItems: "center", fontSize: 20, fontWeight: 800,
          background: armada[k] ? (mal ? "#d23b4f" : "#fffdfb") : "rgba(255,255,255,.08)", color: "#1d2a44", border: "1px solid rgba(255,255,255,.25)" }}>{soyYo ? armada[k] || "" : ""}</span>)}
      </div>
      <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 7 }}>
        {fichas.map((c, k) => { const usada = toc.includes(k); return (
          <button key={k} disabled={!soyYo || usada} onClick={() => { vibrar(8); setToc(t => [...t, k]); }} className="j-tile"
            style={{ width: 46, height: 50, borderRadius: 12, fontSize: 22, fontWeight: 800, cursor: soyYo ? "pointer" : "default", border: "none",
              background: usada ? "rgba(255,255,255,.08)" : "#ffd166", color: usada ? "transparent" : "#2a2000", boxShadow: usada ? "none" : "0 4px 0 #b8860b" }}>{c}</button>); })}
      </div>
      {soyYo ? <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }}>
          <Boton color="rgba(255,255,255,.14)" onClick={() => setToc([])}>Borrar</Boton>
          <Boton color="rgba(255,255,255,.14)" onClick={onSaltar}>Saltar palabra</Boton>
        </div>
        : <div style={{ textAlign: "center", fontSize: 12.5, opacity: .8, marginTop: 12 }}>{host ? <>Respuesta: <b>{palabra}</b></> : "Lo está armando en su teléfono."}</div>}
    </div>);
}

const TECLADO = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");
function Ahorcado({ sala, pr, tema, soyYo, host, onBien, onMal }: PropsPrueba & { onBien: () => void; onMal: () => void }) {
  const palabra: string = (pr.items || [])[pr.i || 0] || "";
  const us: string = pr.us || "";
  const e = estadoAhorcado(palabra, us);
  if (!palabra) return <Panel>Se acabaron las palabras.</Panel>;
  const probar = (c: string) => {
    if (!soyYo || us.includes(c)) return;
    const n = estadoAhorcado(palabra, us + c);
    if (n.resuelta) onBien();
    else if (n.errores >= 6) onMal();
    else { vibrar(palabra.includes(c) ? 10 : [10, 30, 10]); cambiar(sala.id, { "ron.pr.us": us + c }); }
  };
  return (
    <div>
      <Destello ult={pr.ult} i={pr.i || 0}/>
      <Panel style={{ textAlign: "center" }}><Rotulo style={{ marginBottom: 4 }}>Pista</Rotulo><div style={{ fontSize: 15.5, lineHeight: 1.4 }}>{pistaDe(tema, palabra)}</div></Panel>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 14, margin: "16px 0" }}>
        <svg width="64" height="74" viewBox="0 0 64 74" aria-label={`${e.errores} de 6 errores`} style={{ flexShrink: 0 }}>
          <path d="M6 70h30M14 70V6h28v8" stroke="#ffffff88" strokeWidth="3" fill="none" strokeLinecap="round"/>
          {e.errores > 0 && <circle cx="42" cy="21" r="7" stroke="#fff" strokeWidth="3" fill="none"/>}
          {e.errores > 1 && <path d="M42 28v18" stroke="#fff" strokeWidth="3"/>}
          {e.errores > 2 && <path d="M42 33l-9 7" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>}
          {e.errores > 3 && <path d="M42 33l9 7" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>}
          {e.errores > 4 && <path d="M42 46l-8 11" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>}
          {e.errores > 5 && <path d="M42 46l8 11" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>}
        </svg>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center" }}>
          {e.vista.map((c, k) => <span key={k} style={{ width: 26, borderBottom: "3px solid #fff", textAlign: "center", fontSize: 22, fontWeight: 800, paddingBottom: 2 }}>{c === "_" ? (host && !soyYo ? <span style={{ opacity: .35 }}>{palabra[k]}</span> : "") : c}</span>)}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: 5 }}>
        {TECLADO.map(c => { const u = us.includes(c), esta = palabra.includes(c); return (
          <button key={c} disabled={!soyYo || u} onClick={() => probar(c)} style={{ height: 40, borderRadius: 9, border: "none", fontWeight: 800, fontSize: 15, cursor: soyYo && !u ? "pointer" : "default",
            background: u ? (esta ? "#2f9a5c" : "rgba(255,255,255,.06)") : "rgba(255,255,255,.16)", color: u && !esta ? "rgba(255,255,255,.3)" : "#fff" }}>{c}</button>); })}
      </div>
      {soyYo && <Boton color="rgba(255,255,255,.14)" style={{ width: "100%", marginTop: 12 }} onClick={onMal}>Saltar palabra</Boton>}
    </div>);
}

// ── 2. El rosco ───────────────────────────────────────────────────
const COLOR_LETRA: Record<string, string> = { "-": "#2f6fb0", o: "#2f9a5c", x: "#d23b4f" };
function Rueda({ est, pos, tam, activo }: { est: string; pos: number; tam: number; activo: boolean }) {
  const R = tam / 2 - tam * .07, b = tam * .105;
  return (
    <div style={{ position: "relative", width: tam, height: tam, margin: "0 auto", maxWidth: "100%" }}>
      {LETRAS_ROSCO.map((l, i) => {
        const a = (-90 + (i * 360) / LETRAS_ROSCO.length) * Math.PI / 180, x = tam / 2 + R * Math.cos(a) - b / 2, y = tam / 2 + R * Math.sin(a) - b / 2;
        const aca = activo && i === pos && est[i] === "-";
        return <span key={l} style={{ position: "absolute", left: x, top: y, width: b, height: b, borderRadius: "50%", display: "grid", placeItems: "center", fontWeight: 700, fontSize: b * .5,
          background: COLOR_LETRA[est[i]] || "#2f6fb0", color: "#fff", border: "2px solid rgba(255,255,255,.85)", transform: aca ? "scale(1.28)" : "none",
          boxShadow: aca ? "0 0 0 4px #ffd166, 0 0 18px #ffd166" : "0 2px 6px rgba(0,0,0,.35)", transition: "transform .25s ease, background .3s ease", zIndex: aca ? 2 : 1 }}>{l}</span>;
      })}
    </div>);
}
function ElRosco({ sala, yo, host, meta, onSalir }: PropsJuego) {
  const r = sala.ron || VACIO, col = meta.color;
  const banco = BANCO[r.tema as Tema] || BANCO.general;
  const conc: string[] = r.conc || [];
  const t = r.turno || 0;
  const letra = banco[((r.sel || {})[t] || [])[(r.pos || [])[t] || 0]] || banco[0];
  const restante = (r.rest || [])[t] || 0;
  const faltan = useFaltan(r.desde ? r.desde + restante : 0);
  const seg = r.desde ? faltan : Math.ceil(restante / 1000);
  const empezado = (r.est || []).some((e: string) => /[ox]/.test(e)) || (r.rest || []).some((x: number, i: number) => x < ((r.base || 85) + (r.bonus?.[i] || 0)) * 1000);
  const jugar = (acc: "ok" | "mal" | "pasa" | "tiempo") => { vibrar(acc === "ok" ? 25 : [10, 30, 10]); cambiar(sala.id, { ron: jugarRosco(r, acc, Date.now()) }); };
  useEffect(() => { if (host && r.fase === "juego" && r.desde && faltan === 0) cambiar(sala.id, { ron: jugarRosco(r, "tiempo", Date.now()) }); }, [host, faltan, r, sala.id]);
  useEffect(() => { if (r.fase === "fin") confeti(); }, [r.fase]);
  const tablero = (
    <div style={{ display: "grid", gridTemplateColumns: conc.length > 1 ? "1fr 1fr" : "1fr", gap: 8, marginBottom: 12 }}>
      {conc.map((p, i) => { const pj = puntajeRosco((r.est || [])[i] || ""); const s = i === t && r.desde ? faltan : Math.ceil(((r.rest || [])[i] || 0) / 1000); const juega = i === t && r.fase === "juego"; return (
        <div key={p} style={{ borderRadius: 16, padding: "8px 10px", background: juega ? "rgba(255,209,102,.22)" : "rgba(255,255,255,.08)", border: juega ? "2px solid #ffd166" : "1px solid rgba(255,255,255,.16)", display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar n={nombreDe(sala, p)} tam={30}/>
          <div style={{ minWidth: 0, flex: 1 }}><div style={{ fontWeight: 700, fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nombreDe(sala, p)}{p === yo ? " (tú)" : ""}</div>
            <div style={{ fontSize: 12, opacity: .85, fontVariantNumeric: "tabular-nums" }}><span style={{ color: "#8be0a8" }}>✓ {pj.ok}</span> · <span style={{ color: "#ff9aa8" }}>✗ {pj.mal}</span> · {Math.floor(s / 60)}:{String(s % 60).padStart(2, "0")}{juega && !r.desde ? " · en pausa" : ""}</div></div>
        </div>); })}
    </div>);

  if (r.fase === "fin") {
    const tabla = conc.map((p, i) => ({ p, ...puntajeRosco((r.est || [])[i] || "") })).sort((a, b) => b.ok - a.ok || a.mal - b.mal);
    return (
      <Escenario color={col} oscuro={meta.oscuro}>
        <BarraJuego titulo="Pasapalabra" onVolver={onSalir}/>
        <div className="j-entrar" style={{ textAlign: "center", padding: "6px 0 16px" }}>
          <IconoJuego n="corona" tam={54}/>
          <div style={{ fontFamily: "var(--titulo)", fontSize: 38, fontWeight: 600 }}>{tabla.length > 1 && tabla[0].ok === tabla[1].ok && tabla[0].mal === tabla[1].mal ? "¡Empate!" : `¡Ganó ${nombreDe(sala, tabla[0].p)}!`}</div>
          <div style={{ fontSize: 14, opacity: .85 }}>{tabla[0].ok} aciertos{tabla[0].ok === 25 ? " · ¡rosco completo!" : ""}</div>
        </div>
        {tablero}
        {host && <><Boton color="#ffffff" claro style={{ width: "100%", color: col }} onClick={() => cambiar(sala.id, inicioRosco(sala, sala.cfg))}>Otra partida</Boton><VolverSala sala={sala} host={host}/></>}
      </Escenario>);
  }

  return (
    <Escenario color={col} oscuro={meta.oscuro}>
      <BarraJuego titulo="Pasapalabra" onVolver={onSalir} derecha={<span style={{ fontSize: 12, background: "rgba(0,0,0,.22)", borderRadius: 20, padding: "5px 10px" }}>{host ? "Presentas tú" : sala.id}</span>}/>
      {tablero}
      <div style={{ position: "relative" }}>
        <Rueda est={(r.est || [])[t] || ""} pos={(r.pos || [])[t] || 0} tam={Math.min(340, typeof window !== "undefined" ? window.innerWidth - 56 : 320)} activo/>
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--titulo)", fontSize: 54, fontWeight: 700, lineHeight: 1, fontVariantNumeric: "tabular-nums", color: r.desde && seg <= 10 ? "#ffb3b3" : "#fff" }}>{seg}</div>
            <div style={{ fontSize: 11, letterSpacing: ".18em", textTransform: "uppercase", opacity: .75 }}>{r.desde ? "segundos" : "en pausa"}</div>
          </div>
        </div>
      </div>
      <div key={`${t}-${letra.l}`} className="j-entrar" style={{ background: "#fffdfb", color: "#1d2a44", borderRadius: 22, padding: "16px 18px", marginTop: 14 }}>
        <div style={{ fontSize: 11.5, letterSpacing: ".18em", textTransform: "uppercase", color: col, fontWeight: 700 }}>{letra.c ? "Contiene la" : "Empieza por"} {letra.l} · {nombreDe(sala, conc[t])}</div>
        <div style={{ fontSize: 19, lineHeight: 1.4, marginTop: 6, fontWeight: 500 }}>{letra.d}</div>
        {host && <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed #d8dde8", fontSize: 14 }}>Respuesta: <b style={{ fontSize: 18 }}>{letra.r}</b></div>}
      </div>
      {host ? (r.desde
        ? <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
              <Boton color="#2f9a5c" onClick={() => jugar("ok")}><IconoJuego n="check" tam={18} grosor={2.4}/>Bien</Boton>
              <Boton color="#d23b4f" onClick={() => jugar("mal")}><IconoJuego n="equis" tam={18} grosor={2.4}/>Mal</Boton>
              <Boton color="#ffffff" claro style={{ color: col }} onClick={() => jugar("pasa")}>Pasapalabra</Boton>
            </div>
            <Boton color="rgba(255,255,255,.12)" style={{ width: "100%", marginTop: 8 }} onClick={() => cambiar(sala.id, { ron: pausarRosco(r, Date.now()) })}><IconoJuego n="reloj" tam={16}/>Pausa</Boton>
          </>
        : <Boton color="#ffd166" style={{ width: "100%", marginTop: 12, color: "#2a2000", padding: 17 }} onClick={() => cambiar(sala.id, { ron: seguirRosco(r, Date.now()) })}>
            {empezado ? `Seguir: juega ${nombreDe(sala, conc[t])}` : `Partir el rosco de ${nombreDe(sala, conc[t])}`}</Boton>)
        : <div style={{ textAlign: "center", fontSize: 13, opacity: .8, marginTop: 12 }}>{conc[t] === yo ? (r.desde ? "¡Responde en voz alta!" : "Prepárate: el presentador va a partir tu reloj.") : `Juega ${nombreDe(sala, conc[t])}.`}</div>}
      {host && <Boton color="rgba(255,255,255,.12)" style={{ width: "100%", marginTop: 10 }} onClick={() => cambiar(sala.id, { "ron.fase": "fin", "ron.desde": 0 })}>Terminar el rosco</Boton>}
    </Escenario>
  );
}
