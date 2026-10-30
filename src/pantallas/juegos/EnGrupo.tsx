import { useEffect, useRef, useState } from "react";
import { LEGADO, bodaActual } from "../../base/firebase";
import { AnilloTiempo, BarraJuego, Boton, Escenario, IconoJuego, Opciones, confeti, vibrar } from "./comun";
import { IMPOSTOR_CLASICO, IMPOSTOR_FUTBOL, MIMICA_TEMAS, PROBABLE, ROSCOS } from "./contenidoGrupo";
import { armarEquipos, barajar, contarVotos, elegirPalabra, jugarRosco, puntajeRosco, repartirSala } from "./logica";
import { JuegoSala, Sala, anfitrion, cambiar, crearSala, jugadores, limpiarCodigo, miNombre, miPid, qrDe, salir, unirse, urlSala, useFaltan, useSala } from "./sala";

// ═══════════════════════════════════════════════════════════════════
// JUEGOS EN GRUPO (30-oct-2026): el que abre el juego muestra un QR, los demás se unen con su
// teléfono y cada uno ve lo suyo. El anfitrión (el que creó la sala) es el que avanza las rondas.
// ═══════════════════════════════════════════════════════════════════

type Meta = { t: string; color: string; oscuro: string; icono: string; min: number; desc: string; cfg: any };
export const JUEGOS_SALA: Record<JuegoSala, Meta> = {
  impostor: { t: "El impostor", color: "#6b55a0", oscuro: "#151024", icono: "mascara", min: 3, desc: "Todos tienen la palabra menos uno. ¿Quién miente?",
    cfg: { modo: "clasico", cat: "Todos", imp: 1, tiempo: 90, infiltrado: false } },
  mimica: { t: "Mímica por equipos", color: "#7d5ca8", oscuro: "#1d1430", icono: "teatro", min: 4, desc: "Dos equipos; el que actúa ve la palabra en su teléfono",
    cfg: { tiempo: 60, tema: "De la boda" } },
  rosco: { t: "Pasapalabra", color: "#2f6fb0", oscuro: "#0b1730", icono: "rosco", min: 2, desc: "El rosco de la A a la Z, con presentador y reloj",
    cfg: { tema: "general", seg: 150, conc: [] } },
  probable: { t: "¿Quién es más probable?", color: "#c0394f", oscuro: "#2e0d17", icono: "votar", min: 3, desc: "Cada uno vota en secreto. ¿Quién sale más votado?",
    cfg: { tragos: true } },
};

const PALETA = ["#6f6bd8", "#e0455f", "#3f9a6e", "#d08a3c", "#3c8ed0", "#b05fb5", "#c4605a", "#4aa3a0"];
const colorDe = (n: string) => PALETA[String(n).split("").reduce((a, c) => a + c.charCodeAt(0), 0) % PALETA.length];
export const Avatar = ({ n, tam = 44, style }: { n: string; tam?: number; style?: React.CSSProperties }) =>
  <span style={{ width: tam, height: tam, borderRadius: "50%", display: "grid", placeItems: "center", fontWeight: 700, fontSize: tam * .4, color: "#fff", background: colorDe(n), flexShrink: 0, ...style }}>{(String(n).trim()[0] || "?").toUpperCase()}</span>;
const Rotulo = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) =>
  <div style={{ fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase", opacity: .72, marginBottom: 8, ...style }}>{children}</div>;
const Pildora = ({ children, on, onClick, color }: { children: React.ReactNode; on: boolean; onClick: () => void; color: string }) =>
  <button onClick={() => { vibrar(6); onClick(); }} style={{ cursor: "pointer", borderRadius: 20, padding: "8px 13px", fontSize: 13, fontWeight: 600,
    background: on ? "#fff" : "rgba(255,255,255,.08)", color: on ? color : "#fff", border: "1px solid rgba(255,255,255,.22)" }}>{children}</button>;
const Panel = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) =>
  <div style={{ background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.18)", borderRadius: 20, padding: 14, ...style }}>{children}</div>;
const VACIO: any = {};   // referencia fija para cuando la sala aún no tiene ronda
const nombreDe = (s: Sala, pid: string) => s.jug?.[pid]?.n || "Alguien";

// ── Crear una sala / entrar con código ─────────────────────────────
export function NuevaSala({ juego, mesa, cfg, titulo, onLista, onVolver }: { juego: JuegoSala; mesa?: number | null; cfg?: any; titulo?: string; onLista: (codigo: string) => void; onVolver: () => void }) {
  const m = { ...JUEGOS_SALA[juego], ...(titulo ? { t: titulo } : {}) };
  const [nombre, setNombre] = useState(miNombre());
  const [error, setError] = useState(""); const [creando, setCreando] = useState(false);
  const crear = async () => {
    if (!nombre.trim()) { setError("Escribe tu nombre para que los demás te reconozcan."); return; }
    setCreando(true); setError("");
    try { onLista(await crearSala(bodaActual() || LEGADO, juego, nombre, { ...m.cfg, ...(cfg || {}) }, mesa)); }
    catch (e: any) { setError(e?.code === "permission-denied" ? "No se pudo crear la sala (sin permiso). Avísale a los novios." : "No se pudo crear la sala. Revisa tu internet."); setCreando(false); }
  };
  return (
    <Escenario color={m.color} oscuro={m.oscuro}>
      <BarraJuego titulo={m.t} onVolver={onVolver}/>
      <div className="j-entrar" style={{ textAlign: "center", padding: "12px 4px 4px" }}>
        <div style={{ width: 88, height: 88, borderRadius: "50%", margin: "0 auto", background: "rgba(255,255,255,.14)", display: "grid", placeItems: "center" }}><IconoJuego n={m.icono} tam={44}/></div>
        <div style={{ fontSize: 13.5, opacity: .85, lineHeight: 1.5, margin: "14px auto 20px", maxWidth: 360 }}>{m.desc}{/[.?!]$/.test(m.desc) ? "" : "."} Creas la sala, aparece un QR y los demás se unen desde su teléfono.</div>
      </div>
      <form onSubmit={e => { e.preventDefault(); crear(); }} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <label htmlFor="sala-nombre" style={{ fontSize: 12, opacity: .8 }}>Tu nombre</label>
        <input id="sala-nombre" className="j-campo" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Tío Pato" maxLength={24} autoComplete="given-name"/>
        {error && <div role="alert" style={{ fontSize: 13, background: "rgba(0,0,0,.25)", borderRadius: 12, padding: "9px 12px" }}>{error}</div>}
        <Boton color="#ffffff" claro disabled={creando} style={{ color: m.color, padding: 17, marginTop: 6 }}><IconoJuego n="qr" tam={19}/>{creando ? "Creando la sala…" : "Crear sala y mostrar QR"}</Boton>
      </form>
    </Escenario>
  );
}

export function EntrarConCodigo({ onEntrar, onVolver }: { onEntrar: (codigo: string) => void; onVolver: () => void }) {
  const [c, setC] = useState("");
  return (
    <Escenario color="#8a4f6e" oscuro="#24101c">
      <BarraJuego titulo="Unirse a una partida" onVolver={onVolver}/>
      <div style={{ fontSize: 13.5, opacity: .85, lineHeight: 1.5, marginBottom: 16 }}>Escanea el QR del que abrió el juego, o escribe el código de 5 letras que sale en su pantalla.</div>
      <form onSubmit={e => { e.preventDefault(); if (limpiarCodigo(c).length === 5) onEntrar(limpiarCodigo(c)); }} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <label htmlFor="sala-codigo" style={{ fontSize: 12, opacity: .8 }}>Código de la sala</label>
        <input id="sala-codigo" className="j-campo" value={c} onChange={e => setC(limpiarCodigo(e.target.value))} placeholder="ABC12" autoCapitalize="characters" autoComplete="off"
          style={{ fontSize: 30, letterSpacing: ".35em", textAlign: "center", fontWeight: 700, fontFamily: "var(--titulo)" }}/>
        <Boton color="#ffffff" claro disabled={c.length !== 5} style={{ color: "#8a4f6e", padding: 16 }}>Entrar</Boton>
      </form>
    </Escenario>
  );
}

// ── La sala: entrar, esperar y jugar ──────────────────────────────
export function SalaJuego({ codigo, onSalir }: { codigo: string; onSalir: () => void }) {
  const [sala, error] = useSala(codigo);
  const yo = miPid();
  const fuera = async () => { await salir(codigo); onSalir(); };
  if (sala === undefined || (error && !sala)) return (
    <Escenario color="#6b55a0" oscuro="#151024">
      <BarraJuego titulo="Sala de juego" onVolver={onSalir}/>
      <div style={{ display: "grid", placeItems: "center", minHeight: 300, textAlign: "center", gap: 14 }}>
        {error ? <div>{error}</div> : <><div style={{ animation: "j-latir 1.2s ease-in-out infinite" }}><IconoJuego n="dados" tam={48}/></div><div style={{ opacity: .8 }}>Entrando a la sala {codigo}…</div></>}
      </div>
    </Escenario>
  );
  if (sala === null) return (
    <Escenario color="#6b55a0" oscuro="#151024">
      <BarraJuego titulo="Sala de juego" onVolver={onSalir}/>
      <div className="j-entrar" style={{ textAlign: "center", padding: "40px 10px" }}>
        <IconoJuego n="pregunta" tam={52}/>
        <div style={{ fontFamily: "var(--titulo)", fontSize: 28, fontWeight: 600, marginTop: 12 }}>No encontramos la sala {codigo}</div>
        <div style={{ fontSize: 13.5, opacity: .8, marginTop: 8 }}>Revisa el código o pídele al que la abrió que la cree de nuevo. Las salas duran 12 horas.</div>
        <Boton color="#ffffff" claro style={{ width: "100%", marginTop: 22, color: "#6b55a0" }} onClick={onSalir}>Volver</Boton>
      </div>
    </Escenario>
  );
  const m = JUEGOS_SALA[sala.j];
  if (!sala.jug?.[yo]) return <Unirse sala={sala} meta={m} onSalir={onSalir}/>;
  const p: PropsJuego = { sala, yo, host: anfitrion(sala) === yo, meta: m, onSalir: fuera };
  if (sala.est === "lobby") return <Lobby {...p}/>;
  if (sala.j === "impostor") return <ImpostorSala {...p}/>;
  if (sala.j === "mimica") return <MimicaSala {...p}/>;
  if (sala.j === "rosco") return <RoscoSala {...p}/>;
  return <ProbableSala {...p}/>;
}
type PropsJuego = { sala: Sala; yo: string; host: boolean; meta: Meta; onSalir: () => void };

function Unirse({ sala, meta, onSalir }: { sala: Sala; meta: Meta; onSalir: () => void }) {
  const [nombre, setNombre] = useState(miNombre());
  const [error, setError] = useState(""); const [ent, setEnt] = useState(false);
  const lleno = Object.keys(sala.jug || {}).length >= 40;
  const entrar = async () => {
    if (!nombre.trim()) { setError("Escribe tu nombre."); return; }
    setEnt(true); setError("");
    try { await unirse(sala.id, nombre); vibrar(20); } catch { setError("No se pudo entrar. Revisa tu internet."); setEnt(false); }
  };
  return (
    <Escenario color={meta.color} oscuro={meta.oscuro}>
      <BarraJuego titulo={meta.t} onVolver={onSalir}/>
      <div className="j-entrar" style={{ textAlign: "center", padding: "6px 0 18px" }}>
        <IconoJuego n={meta.icono} tam={46}/>
        <div style={{ fontFamily: "var(--titulo)", fontSize: 28, fontWeight: 600, marginTop: 10 }}>Te invitaron a jugar</div>
        <div style={{ fontSize: 13.5, opacity: .8, marginTop: 4 }}>Sala {sala.id} · abierta por {nombreDe(sala, sala.host)}{sala.mesa ? ` · mesa ${sala.mesa}` : ""}</div>
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
          {jugadores(sala).slice(0, 12).map(j => <Avatar key={j.pid} n={j.n} tam={30}/>)}
        </div>
      </div>
      {lleno ? <Panel>La sala está llena (40 personas). Pídele a alguien que abra otra.</Panel> : (
        <form onSubmit={e => { e.preventDefault(); entrar(); }} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label htmlFor="unirse-nombre" style={{ fontSize: 12, opacity: .8 }}>Tu nombre</label>
          <input id="unirse-nombre" className="j-campo" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Prima Cata" maxLength={24} autoComplete="given-name"/>
          {error && <div role="alert" style={{ fontSize: 13, background: "rgba(0,0,0,.25)", borderRadius: 12, padding: "9px 12px" }}>{error}</div>}
          <Boton color="#ffffff" claro disabled={ent} style={{ color: meta.color, padding: 17, marginTop: 6 }}>{ent ? "Entrando…" : "Entrar a jugar"}</Boton>
        </form>)}
    </Escenario>
  );
}

/** Sala de espera: QR grande, quién va entrando y, para el anfitrión, cómo se juega. */
function Lobby({ sala, yo, host, meta, onSalir }: PropsJuego) {
  const js = jugadores(sala), jefe = anfitrion(sala);
  const [copiado, setCopiado] = useState(false);
  const url = urlSala(sala.id);
  const compartir = async () => {
    try { if ((navigator as any).share) { await (navigator as any).share({ title: meta.t, text: `Únete a «${meta.t}» con el código ${sala.id}`, url }); return; } } catch { return; }
    try { await navigator.clipboard.writeText(url); setCopiado(true); setTimeout(() => setCopiado(false), 1800); } catch { /* nada */ }
  };
  const cfg = { ...meta.cfg, ...(sala.cfg || {}) };
  const ponerCfg = (c: any) => cambiar(sala.id, { cfg: { ...cfg, ...c } });
  const minimo = sala.j === "rosco" ? 2 : meta.min;
  const empezar = () => { vibrar(20); cambiar(sala.id, inicioDe(sala, cfg)); };
  return (
    <Escenario color={meta.color} oscuro={meta.oscuro}>
      <BarraJuego titulo={meta.t} onVolver={onSalir} derecha={<span style={{ fontSize: 12, background: "rgba(0,0,0,.22)", borderRadius: 20, padding: "5px 10px" }}>{js.length} en la sala</span>}/>
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", alignItems: "start" }}>
        <div className="j-entrar" style={{ background: "#fffdfb", color: "#2c1424", borderRadius: 26, padding: "18px 16px", textAlign: "center", boxShadow: "0 20px 40px -24px rgba(0,0,0,.7)" }}>
          <div style={{ fontSize: 11, letterSpacing: ".22em", textTransform: "uppercase", color: meta.color, fontWeight: 700 }}>Escanea para unirte</div>
          <img src={qrDe(url, 260)} alt={`Código QR de la sala ${sala.id}`} width={220} height={220} style={{ display: "block", margin: "12px auto", width: "min(220px, 60vw)", height: "auto", aspectRatio: "1" }}/>
          <div style={{ fontSize: 12, color: "#8a6f62" }}>o entra a la app de la boda con el código</div>
          <div style={{ fontFamily: "var(--titulo)", fontSize: 44, fontWeight: 700, letterSpacing: ".18em", lineHeight: 1.1, marginTop: 4, color: meta.oscuro }}>{sala.id}</div>
          <button onClick={compartir} style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 7, border: `1px solid ${meta.color}44`, background: "transparent", color: meta.color, borderRadius: 30, padding: "8px 14px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            <IconoJuego n="compartir" tam={16}/>{copiado ? "Link copiado" : "Compartir link"}</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Panel>
            <Rotulo>Jugadores</Rotulo>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {js.map(j => (
                <span key={j.pid} className="j-entrar" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: j.pid === yo ? "rgba(255,255,255,.24)" : "rgba(255,255,255,.1)", borderRadius: 30, padding: "4px 11px 4px 4px" }}>
                  <Avatar n={j.n} tam={28}/><span style={{ fontSize: 14, fontWeight: 600 }}>{j.n}{j.pid === yo ? " (tú)" : ""}</span>
                  {j.pid === jefe && <span title="Anfitrión" style={{ opacity: .85 }}><IconoJuego n="corona" tam={15}/></span>}
                </span>))}
            </div>
            {js.length < minimo && <div style={{ fontSize: 12.5, opacity: .75, marginTop: 10 }}>Faltan {minimo - js.length} para poder jugar.</div>}
          </Panel>
          {host ? <>
            <Panel><ConfigJuego sala={sala} cfg={cfg} poner={ponerCfg} color={meta.color}/></Panel>
            <Boton color="#ffffff" claro disabled={js.length < minimo || (sala.j === "rosco" && !(cfg.conc || []).some((p: string) => sala.jug[p]))} style={{ color: meta.color, padding: 17 }} onClick={empezar}>
              <IconoJuego n="dados" tam={19}/>{js.length < minimo ? "Esperando jugadores…" : "¡Empezar!"}</Boton>
          </> : (
            <Panel style={{ textAlign: "center" }}>
              <div style={{ animation: "j-latir 1.6s ease-in-out infinite", display: "inline-block" }}><IconoJuego n="reloj" tam={30}/></div>
              <div style={{ fontWeight: 600, marginTop: 6 }}>Esperando que {nombreDe(sala, jefe)} empiece</div>
              <div style={{ fontSize: 12.5, opacity: .75, marginTop: 4 }}>Deja esta pantalla abierta: cuando parta, te aparece lo tuyo.</div>
            </Panel>)}
        </div>
      </div>
    </Escenario>
  );
}

/** Opciones de cada juego (solo las ve el anfitrión, en la sala de espera). */
function ConfigJuego({ sala, cfg, poner, color }: { sala: Sala; cfg: any; poner: (c: any) => void; color: string }) {
  if (sala.j === "impostor") {
    const temas = cfg.modo === "futbol" ? IMPOSTOR_FUTBOL : IMPOSTOR_CLASICO;
    return <>
      <Rotulo>Modo</Rotulo>
      <Opciones valor={cfg.modo} opciones={[["clasico", "Clásico"], ["futbol", "Futbolero"]]} onCambiar={v => poner({ modo: v, cat: "Todos" })}/>
      <Rotulo style={{ marginTop: 14 }}>Tema</Rotulo>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {["Todos", ...Object.keys(temas)].map(k => <Pildora key={k} on={cfg.cat === k} color={color} onClick={() => poner({ cat: k })}>{k === "Todos" ? "Mezclar todo" : k}</Pildora>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
        <div><Rotulo>Impostores</Rotulo><Opciones valor={cfg.imp} opciones={[[1, "1"], [2, "2"], [3, "3"]]} onCambiar={v => poner({ imp: v })}/></div>
        <div><Rotulo>Para discutir</Rotulo><Opciones valor={cfg.tiempo} opciones={[[60, "1'"], [90, "1½'"], [150, "2½'"]]} onCambiar={v => poner({ tiempo: v })}/></div>
      </div>
      <Rotulo style={{ marginTop: 14 }}>Variante</Rotulo>
      <Opciones valor={cfg.infiltrado ? 1 : 0} opciones={[[0, "Impostor sin palabra"], [1, "Infiltrado"]]} onCambiar={v => poner({ infiltrado: !!v })}/>
      <div style={{ fontSize: 12, opacity: .75, marginTop: 8, lineHeight: 1.45 }}>{cfg.infiltrado
        ? "El infiltrado recibe OTRA palabra del mismo tema y no sabe que es el infiltrado. Más difícil y más divertido."
        : "El impostor no recibe palabra: solo ve el tema y tiene que disimular."}</div>
    </>;
  }
  if (sala.j === "mimica") return <>
    <Rotulo>Tema</Rotulo>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{Object.keys(MIMICA_TEMAS).map(k => <Pildora key={k} on={cfg.tema === k} color={color} onClick={() => poner({ tema: k })}>{k}</Pildora>)}</div>
    <Rotulo style={{ marginTop: 14 }}>Tiempo por turno</Rotulo>
    <Opciones valor={cfg.tiempo} opciones={[[45, "45 s"], [60, "60 s"], [90, "90 s"]]} onCambiar={v => poner({ tiempo: v })}/>
    <div style={{ fontSize: 12, opacity: .75, marginTop: 8 }}>Los equipos se arman solos al empezar.</div>
  </>;
  if (sala.j === "rosco") {
    const js = jugadores(sala).filter(j => j.pid !== anfitrion(sala));
    const conc: string[] = (cfg.conc || []).filter((p: string) => sala.jug[p]);
    const toggle = (p: string) => poner({ conc: conc.includes(p) ? conc.filter(x => x !== p) : [...conc, p].slice(-2) });
    return <>
      <div style={{ fontSize: 12.5, opacity: .85, marginBottom: 12, lineHeight: 1.45 }}>Tú eres el presentador: ves las respuestas y marcas si acertaron. Elige 1 o 2 concursantes.</div>
      <Rotulo>Concursantes</Rotulo>
      {js.length ? <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{js.map(j => <Pildora key={j.pid} on={conc.includes(j.pid)} color={color} onClick={() => toggle(j.pid)}>{j.n}</Pildora>)}</div>
        : <div style={{ fontSize: 13, opacity: .75 }}>Cuando alguien se una, aparece acá.</div>}
      <Rotulo style={{ marginTop: 14 }}>Rosco</Rotulo>
      <Opciones valor={cfg.tema} opciones={[["general", "General"], ["futbol", "Futbolero"]]} onCambiar={v => poner({ tema: v })}/>
      <Rotulo style={{ marginTop: 14 }}>Tiempo de cada uno</Rotulo>
      <Opciones valor={cfg.seg} opciones={[[120, "2'"], [150, "2½'"], [200, "3'20"]]} onCambiar={v => poner({ seg: v })}/>
    </>;
  }
  return <>
    <Rotulo>Penitencia</Rotulo>
    <Opciones valor={cfg.tragos ? 1 : 0} opciones={[[1, "El más votado toma"], [0, "Sin tragos"]]} onCambiar={v => poner({ tragos: !!v })}/>
  </>;
}

/** Lo que se escribe en la sala al empezar (o al pedir otra ronda). */
function inicioDe(sala: Sala, cfg: any): Record<string, any> {
  const ids = jugadores(sala).map(j => j.pid);
  if (sala.j === "impostor") {
    const e = elegirPalabra(cfg.modo === "futbol" ? IMPOSTOR_FUTBOL : IMPOSTOR_CLASICO, cfg.cat)!;
    const r = repartirSala(ids, e.palabra, cfg.imp, cfg.infiltrado ? e.otra : null);
    return { est: "juego", cfg, v: {}, ron: { n: (sala.ron?.n || 0) + 1, cat: e.cat, palabra: e.palabra, otra: cfg.infiltrado ? e.otra : null, ...r, fase: "ver", listo: {}, fin: 0 } };
  }
  if (sala.j === "mimica") {
    const { eq, cola } = armarEquipos(ids);
    return { est: "juego", cfg, v: {}, ron: { eq, cola, k: 0, fase: "espera", pts: { A: 0, B: 0 }, ok: [], pas: [], pal: "", fin: 0, usadas: [] } };
  }
  if (sala.j === "rosco") {
    const conc: string[] = (cfg.conc || []).filter((p: string) => sala.jug[p]).slice(0, 2);
    const roscos = barajar(ROSCOS[cfg.tema === "futbol" ? "futbol" : "general"].map((_, i) => i)).slice(0, conc.length);
    return { est: "juego", cfg, v: {}, ron: { tema: cfg.tema, conc, r: roscos, est: conc.map(() => "-".repeat(25)), pos: conc.map(() => 0),
      rest: conc.map(() => (cfg.seg || 150) * 1000), turno: 0, desde: 0, fase: "juego" } };
  }
  return { est: "juego", cfg, v: {}, ron: { orden: barajar(PROBABLE.map((_, i) => i)), k: 0, fase: "votar" } };
}

/** Barra de abajo del anfitrión: volver a la sala de espera. */
const VolverSala = ({ sala, host }: { sala: Sala; host: boolean }) => host
  ? <Boton color="rgba(255,255,255,.14)" style={{ width: "100%", marginTop: 10 }} onClick={() => cambiar(sala.id, { est: "lobby", ron: {}, v: {} })}>Volver a la sala de espera</Boton> : null;

// ── EL IMPOSTOR ───────────────────────────────────────────────────
function ImpostorSala({ sala, yo, host, meta, onSalir }: PropsJuego) {
  const r = sala.ron || VACIO, col = meta.color;
  const enRonda: string[] = Object.keys(r.pal || {}).filter(p => sala.jug[p]);
  const juego = yo in (r.pal || {});
  const mia: string | null = (r.pal || {})[yo] ?? null;
  const soyImp = (r.imp || []).includes(yo);
  const faltan = useFaltan(r.fase === "pistas" ? r.fin : 0);
  const listos = enRonda.filter(p => r.listo?.[p]).length;
  const votaron = enRonda.filter(p => sala.v?.[p]).length;
  const [mirando, setMirando] = useState(false);
  // El anfitrión avanza solo cuando todos vieron, se acaba el tiempo o todos votaron.
  useEffect(() => {
    if (!host) return;
    if (r.fase === "ver" && enRonda.length && listos >= enRonda.length) cambiar(sala.id, { "ron.fase": "pistas", "ron.fin": Date.now() + (sala.cfg?.tiempo || 90) * 1000 });
    else if (r.fase === "pistas" && r.fin && faltan === 0) { vibrar([60, 40, 60]); cambiar(sala.id, { "ron.fase": "votar" }); }
    else if (r.fase === "votar" && enRonda.length && votaron >= enRonda.length) cambiar(sala.id, { "ron.fase": "fin" });
  }, [host, r.fase, listos, votaron, faltan, enRonda.length, r.fin, sala.id, sala.cfg?.tiempo]);
  useEffect(() => { if (r.fase === "fin") vibrar([30, 40, 30]); }, [r.fase]);

  const derecha = <span style={{ fontSize: 12, background: "rgba(0,0,0,.22)", borderRadius: 20, padding: "5px 10px" }}>Ronda {r.n || 1} · {sala.id}</span>;
  const tarjeta = (alto: number) => (
    <div onPointerDown={() => { vibrar(12); setMirando(true); }} onPointerUp={() => setMirando(false)} onPointerLeave={() => setMirando(false)} onPointerCancel={() => setMirando(false)} onContextMenu={e => e.preventDefault()}
      style={{ height: alto, borderRadius: 26, display: "grid", placeItems: "center", textAlign: "center", padding: 18, cursor: "pointer", userSelect: "none", WebkitUserSelect: "none", touchAction: "none",
        background: mirando ? (mia ? "#fffdfb" : "linear-gradient(150deg,#e0455f,#8d1a3c)") : "rgba(255,255,255,.08)", color: mirando && mia ? "#3b2a21" : "#fff",
        border: mirando ? "none" : "2px dashed rgba(255,255,255,.35)", transition: "background .25s ease, transform .2s", transform: mirando ? "scale(1.02)" : "none" }}>
      {mirando ? (mia
        ? <div><div style={{ fontSize: 11, letterSpacing: ".24em", textTransform: "uppercase", color: col }}>Tu palabra · {r.cat}</div><div style={{ fontFamily: "var(--titulo)", fontSize: "clamp(30px, 9vw, 44px)", fontWeight: 600, marginTop: 6, lineHeight: 1.1 }}>{mia}</div></div>
        : <div><IconoJuego n="mascara" tam={50}/><div style={{ fontFamily: "var(--titulo)", fontSize: 32, fontWeight: 600, marginTop: 6 }}>Eres el impostor</div><div style={{ fontSize: 13, opacity: .9, marginTop: 4 }}>Tema: <b>{r.cat}</b>. Escucha y disimula.</div></div>)
        : <div style={{ display: "grid", placeItems: "center", gap: 10 }}><IconoJuego n="ojo" tam={38}/><div style={{ fontSize: 15, fontWeight: 600 }}>Mantén presionado para ver lo tuyo</div><div style={{ fontSize: 12.5, opacity: .7 }}>Que nadie mire tu pantalla</div></div>}
    </div>);

  if (!juego) return (
    <Escenario color={col} oscuro={meta.oscuro}>
      <BarraJuego titulo="El impostor" onVolver={onSalir} derecha={derecha}/>
      <Panel style={{ textAlign: "center", padding: 24 }}>Entraste con la ronda empezada. Te toca en la próxima: quédate mirando.</Panel>
      <VolverSala sala={sala} host={host}/>
    </Escenario>);

  if (r.fase === "ver") return (
    <Escenario color={col} oscuro={meta.oscuro}>
      <BarraJuego titulo="El impostor" onVolver={onSalir} derecha={derecha}/>
      {tarjeta(250)}
      <Boton color="#ffffff" claro disabled={!!r.listo?.[yo]} style={{ width: "100%", marginTop: 14, color: col }} onClick={() => cambiar(sala.id, { [`ron.listo.${yo}`]: true })}>
        {r.listo?.[yo] ? `Listo · esperando a ${enRonda.length - listos}` : "Ya vi lo mío"}</Boton>
      {host && <Boton color="rgba(255,255,255,.14)" style={{ width: "100%", marginTop: 10 }} onClick={() => cambiar(sala.id, { "ron.fase": "pistas", "ron.fin": Date.now() + (sala.cfg?.tiempo || 90) * 1000 })}>Partir sin esperar ({listos}/{enRonda.length})</Boton>}
    </Escenario>);

  if (r.fase === "pistas") {
    const orden: string[] = (r.orden || []).filter((p: string) => sala.jug[p]);
    return (
      <Escenario color={col} oscuro={meta.oscuro}>
        <BarraJuego titulo="Den sus pistas" onVolver={onSalir} derecha={derecha}/>
        <div style={{ display: "grid", placeItems: "center", margin: "4px 0 16px" }}><AnilloTiempo seg={faltan} total={sala.cfg?.tiempo || 90} tam={150}/></div>
        <Panel>
          <Rotulo>En este orden, una palabra cada uno</Rotulo>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {orden.map((p, k) => <div key={p} style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: p === yo ? 700 : 500 }}><span style={{ width: 20, opacity: .6, fontVariantNumeric: "tabular-nums" }}>{k + 1}</span><Avatar n={nombreDe(sala, p)} tam={28}/>{nombreDe(sala, p)}{p === yo ? " (tú)" : ""}</div>)}
          </div>
        </Panel>
        <div style={{ marginTop: 14 }}>{tarjeta(130)}</div>
        {host && <Boton color="#ffffff" claro style={{ width: "100%", marginTop: 14, color: col }} onClick={() => cambiar(sala.id, { "ron.fase": "votar" })}>Votar ahora</Boton>}
      </Escenario>);
  }

  if (r.fase === "votar") {
    const voto = sala.v?.[yo];
    return (
      <Escenario color={col} oscuro={meta.oscuro}>
        <BarraJuego titulo="¿Quién es el impostor?" onVolver={onSalir} derecha={<span style={{ fontSize: 12, background: "rgba(0,0,0,.22)", borderRadius: 20, padding: "5px 10px" }}>{votaron}/{enRonda.length} votaron</span>}/>
        <div style={{ fontSize: 13.5, opacity: .85, marginBottom: 14 }}>{voto ? `Votaste por ${nombreDe(sala, voto)}. Puedes cambiarlo hasta que voten todos.` : "Toca a quien creas que es el impostor. Tu voto es secreto."}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))", gap: 10 }}>
          {enRonda.filter(p => p !== yo).map(p => { const on = voto === p; return (
            <button key={p} onClick={() => { vibrar(14); cambiar(sala.id, { [`v.${yo}`]: p }); }} className="j-tile" style={{ border: on ? "2px solid #fff" : "1px solid rgba(255,255,255,.2)", borderRadius: 20, padding: "14px 8px", cursor: "pointer", color: on ? col : "#fff",
              background: on ? "#fff" : "rgba(255,255,255,.1)", display: "grid", placeItems: "center", gap: 8 }}>
              <Avatar n={nombreDe(sala, p)} tam={48}/><span style={{ fontSize: 14, fontWeight: 600 }}>{nombreDe(sala, p)}</span>
            </button>); })}
        </div>
        {host && <Boton color="#ffffff" claro style={{ width: "100%", marginTop: 18, color: col }} onClick={() => cambiar(sala.id, { "ron.fase": "fin" })}>Cerrar la votación</Boton>}
      </Escenario>);
  }

  // Resultado
  const conteo = contarVotos(sala.v, enRonda);
  const max = conteo[0]?.n || 0, top = conteo.filter(c => c.n === max);
  const pillado = max > 0 && top.length === 1 && (r.imp || []).includes(top[0].pid);
  return <ResultadoImpostor sala={sala} r={r} conteo={conteo} pillado={pillado} empate={top.length > 1} soyImp={soyImp} host={host} meta={meta} onSalir={onSalir}/>;
}
function ResultadoImpostor({ sala, r, conteo, pillado, empate, soyImp, host, meta, onSalir }: any) {
  const col = meta.color;
  useEffect(() => { if (pillado !== soyImp) confeti(); }, [pillado, soyImp]);
  const imps: string[] = r.imp || [];
  return (
    <Escenario color={col} oscuro={meta.oscuro}>
      <BarraJuego titulo="Resultado" onVolver={onSalir}/>
      <div className="j-entrar" style={{ textAlign: "center", padding: "6px 0 14px" }}>
        <div style={{ fontFamily: "var(--titulo)", fontSize: 38, fontWeight: 600, lineHeight: 1.1 }}>{pillado ? "¡Lo pillaron!" : empate ? "Empate: se salvó" : "¡Ganó el impostor!"}</div>
        <div style={{ fontSize: 12, letterSpacing: ".22em", textTransform: "uppercase", opacity: .75, marginTop: 14 }}>{imps.length > 1 ? "Los impostores eran" : "El impostor era"}</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap", marginTop: 8 }}>
          {imps.map(p => <div key={p} style={{ display: "grid", placeItems: "center", gap: 6 }}><Avatar n={nombreDe(sala, p)} tam={60} style={{ boxShadow: "0 0 0 4px #e0455f" }}/><b>{nombreDe(sala, p)}</b></div>)}
        </div>
        <div style={{ marginTop: 16, background: "#fffdfb", color: "#3b2a21", borderRadius: 20, padding: "14px 18px", display: "inline-block" }}>
          <div style={{ fontSize: 11, letterSpacing: ".22em", textTransform: "uppercase", color: col }}>La palabra era · {r.cat}</div>
          <div style={{ fontFamily: "var(--titulo)", fontSize: 32, fontWeight: 600 }}>{r.palabra}</div>
          {r.otra && <div style={{ fontSize: 13, color: "#8a6f62" }}>y el infiltrado tenía «{r.otra}»</div>}
        </div>
      </div>
      {conteo.length > 0 && <Panel>
        <Rotulo>Votos</Rotulo>
        {conteo.map((c: any) => <div key={c.pid} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <Avatar n={nombreDe(sala, c.pid)} tam={26}/><span style={{ width: 96, fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nombreDe(sala, c.pid)}</span>
          <div style={{ flex: 1, height: 10, borderRadius: 10, background: "rgba(255,255,255,.12)", overflow: "hidden" }}><div style={{ width: `${(c.n / conteo[0].n) * 100}%`, height: "100%", background: imps.includes(c.pid) ? "#ff8fa3" : "#fff", transformOrigin: "left", animation: "j-entrar .6s ease both" }}/></div>
          <b style={{ width: 18, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{c.n}</b></div>)}
      </Panel>}
      {host ? <>
        <Boton color="#ffffff" claro style={{ width: "100%", marginTop: 16, color: col }} onClick={() => cambiar(sala.id, inicioDe(sala, sala.cfg))}><IconoJuego n="barajar" tam={18}/>Otra ronda</Boton>
        <VolverSala sala={sala} host={host}/>
      </> : <div style={{ textAlign: "center", fontSize: 13, opacity: .75, marginTop: 16 }}>El anfitrión parte la próxima ronda.</div>}
    </Escenario>
  );
}

// ── MÍMICA POR EQUIPOS ────────────────────────────────────────────
function MimicaSala({ sala, yo, host, meta, onSalir }: PropsJuego) {
  const r = sala.ron || VACIO, col = meta.color;
  const cola: string[] = r.cola || [];
  const actor = cola.length ? cola[(r.k || 0) % cola.length] : "";
  const actorAca = !!sala.jug[actor];
  const eqActor = r.eq?.[actor] || "A";
  const miEq = r.eq?.[yo];
  const soyActor = actor === yo;
  const faltan = useFaltan(r.fase === "juega" ? r.fin : 0);
  const [flash, setFlash] = useState<"" | "bien" | "pasa">("");
  const cerrado = useRef("");
  const lista = MIMICA_TEMAS[sala.cfg?.tema] || MIMICA_TEMAS["De la boda"];
  const sacarPalabra = (usadas: number[]) => {
    let libres = lista.map((_, i) => i).filter(i => !usadas.includes(i));
    if (!libres.length) { libres = lista.map((_, i) => i); usadas = []; }
    const i = libres[Math.floor(Math.random() * libres.length)];
    return { pal: lista[i], usadas: [...usadas, i] };
  };
  // Se acabó el tiempo: suma el actor (o el anfitrión, si el actor se desconectó). Una sola vez por turno.
  useEffect(() => {
    if (r.fase !== "juega" || faltan > 0 || !r.fin) return;
    const quien = actorAca ? actor : anfitrion(sala);
    const clave = `${r.k}`;
    if (quien !== yo || cerrado.current === clave) return;
    cerrado.current = clave; vibrar([60, 40, 60]);
    cambiar(sala.id, { "ron.fase": "res", [`ron.pts.${eqActor}`]: (r.pts?.[eqActor] || 0) + (r.ok || []).length });
  }, [r.fase, faltan, r.fin, r.k, actor, actorAca, yo, sala, eqActor, r.pts, r.ok]);

  const partir = () => { const s = sacarPalabra(r.usadas || []); vibrar(30); cambiar(sala.id, { "ron.fase": "juega", "ron.fin": Date.now() + (sala.cfg?.tiempo || 60) * 1000, "ron.pal": s.pal, "ron.usadas": s.usadas, "ron.ok": [], "ron.pas": [] }); };
  const marcar = (bien: boolean) => {
    if (r.fase !== "juega" || faltan <= 0) return;
    const s = sacarPalabra(r.usadas || []);
    setFlash(bien ? "bien" : "pasa"); setTimeout(() => setFlash(""), 300); vibrar(bien ? 25 : [10, 30, 10]);
    cambiar(sala.id, { [bien ? "ron.ok" : "ron.pas"]: [...(r[bien ? "ok" : "pas"] || []), r.pal], "ron.pal": s.pal, "ron.usadas": s.usadas });
  };
  const siguiente = () => cambiar(sala.id, { "ron.k": (r.k || 0) + 1, "ron.fase": "espera", "ron.ok": [], "ron.pas": [], "ron.pal": "", "ron.fin": 0 });

  const equipo = (e: "A" | "B") => cola.filter(p => r.eq?.[p] === e && sala.jug[p]);
  const marcador = (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
      {(["A", "B"] as const).map(e => (
        <div key={e} style={{ borderRadius: 18, padding: "10px 12px", background: e === "A" ? "rgba(255,170,90,.22)" : "rgba(110,190,255,.22)", border: miEq === e ? "2px solid #fff" : "1px solid rgba(255,255,255,.18)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".12em" }}>EQUIPO {e}{miEq === e ? " · TÚ" : ""}</span>
            <span style={{ fontFamily: "var(--titulo)", fontSize: 30, fontWeight: 700, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{r.pts?.[e] || 0}</span>
          </div>
          <div style={{ fontSize: 11.5, opacity: .8, marginTop: 4, lineHeight: 1.35 }}>{equipo(e).map(p => nombreDe(sala, p)).join(", ") || "—"}</div>
        </div>))}
    </div>);

  if (r.fase === "final") {
    const a = r.pts?.A || 0, b = r.pts?.B || 0;
    return (
      <Escenario color={col} oscuro={meta.oscuro}>
        <BarraJuego titulo="Fin del juego" onVolver={onSalir}/>
        <div className="j-entrar" style={{ textAlign: "center", padding: "10px 0 18px" }}>
          <IconoJuego n="copa" tam={56}/>
          <div style={{ fontFamily: "var(--titulo)", fontSize: 40, fontWeight: 600 }}>{a === b ? "¡Empate!" : `Ganó el equipo ${a > b ? "A" : "B"}`}</div>
        </div>
        {marcador}<VolverSala sala={sala} host={host}/>
      </Escenario>);
  }

  if (r.fase === "juega" && soyActor) return (
    <div style={{ position: "relative", borderRadius: 28, overflow: "hidden", minHeight: "calc(100vh - 160px)", userSelect: "none", WebkitUserSelect: "none", color: "#fff",
      background: flash === "bien" ? "#2f8a5c" : flash === "pasa" ? "#b73a4f" : `radial-gradient(130% 90% at 0% 0%, ${col}, ${meta.oscuro} 75%)`, transition: "background .25s ease" }}>
      <div style={{ position: "absolute", top: 14, left: 0, right: 0, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 16px", zIndex: 2, pointerEvents: "none" }}>
        <span style={{ fontSize: 13, fontWeight: 600, background: "rgba(0,0,0,.25)", borderRadius: 20, padding: "5px 11px" }}>✓ {(r.ok || []).length}</span>
        <AnilloTiempo seg={faltan} total={sala.cfg?.tiempo || 60} tam={74}/>
        <span style={{ fontSize: 13, fontWeight: 600, background: "rgba(0,0,0,.25)", borderRadius: 20, padding: "5px 11px" }}>Pasadas {(r.pas || []).length}</span>
      </div>
      <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        <button onClick={() => marcar(false)} aria-label="Pasar" style={{ border: "none", background: "transparent", cursor: "pointer" }}/>
        <button onClick={() => marcar(true)} aria-label="Acertaron" style={{ border: "none", background: "transparent", cursor: "pointer" }}/>
      </div>
      <div style={{ position: "relative", minHeight: "calc(100vh - 160px)", display: "grid", placeItems: "center", padding: "100px 20px 80px", textAlign: "center", pointerEvents: "none" }}>
        <div><div style={{ fontSize: 12, letterSpacing: ".22em", textTransform: "uppercase", opacity: .75 }}>Actúa sin hablar</div>
          <div key={r.pal} style={{ fontFamily: "var(--titulo)", fontSize: "clamp(38px, 10vw, 68px)", fontWeight: 600, lineHeight: 1.05, animation: "j-pop .35s ease", marginTop: 8 }}>{r.pal}</div></div>
      </div>
      <div style={{ position: "absolute", bottom: 16, left: 0, right: 0, display: "flex", justifyContent: "space-between", padding: "0 18px", fontSize: 12.5, opacity: .8, pointerEvents: "none" }}>
        <span>← Pasar</span><span>Acertaron →</span>
      </div>
    </div>);

  return (
    <Escenario color={col} oscuro={meta.oscuro}>
      <BarraJuego titulo="Mímica por equipos" onVolver={onSalir} derecha={<span style={{ fontSize: 12, background: "rgba(0,0,0,.22)", borderRadius: 20, padding: "5px 10px" }}>Turno {(r.k || 0) + 1}</span>}/>
      {marcador}
      {r.fase === "espera" && (
        <div className="j-entrar" style={{ textAlign: "center", padding: "10px 0" }}>
          <Avatar n={nombreDe(sala, actor)} tam={78} style={{ margin: "0 auto", boxShadow: "0 0 0 4px rgba(255,255,255,.25)" }}/>
          <div style={{ fontSize: 12, letterSpacing: ".22em", textTransform: "uppercase", opacity: .75, marginTop: 14 }}>Actúa · equipo {eqActor}</div>
          <div style={{ fontFamily: "var(--titulo)", fontSize: 38, fontWeight: 600, lineHeight: 1.1 }}>{soyActor ? "¡Te toca a ti!" : nombreDe(sala, actor)}</div>
          <div style={{ fontSize: 13.5, opacity: .85, marginTop: 8 }}>{soyActor ? "Párate frente a tu equipo y aprieta partir. En tu pantalla sale la palabra." : miEq === eqActor ? "Prepárate para adivinar." : "Le toca al otro equipo: tú vas a ver la palabra para controlar."}</div>
          {soyActor && <Boton color="#ffffff" claro style={{ width: "100%", marginTop: 22, color: col, padding: 18 }} onClick={partir}>¡Partir!</Boton>}
          {host && !soyActor && <Boton color="rgba(255,255,255,.14)" style={{ width: "100%", marginTop: 14 }} onClick={siguiente}>Saltar a {nombreDe(sala, cola[((r.k || 0) + 1) % cola.length])}</Boton>}
        </div>)}
      {r.fase === "juega" && (
        <div className="j-entrar" style={{ textAlign: "center" }}>
          <div style={{ display: "grid", placeItems: "center", marginBottom: 12 }}><AnilloTiempo seg={faltan} total={sala.cfg?.tiempo || 60} tam={150}/></div>
          <div style={{ fontSize: 15 }}>Actúa <b>{nombreDe(sala, actor)}</b> · equipo {eqActor}</div>
          {miEq === eqActor
            ? <div style={{ fontFamily: "var(--titulo)", fontSize: 34, fontWeight: 600, marginTop: 8 }}>¡Adivinen!</div>
            : <Panel style={{ marginTop: 12 }}><Rotulo>La palabra (no la digas)</Rotulo><div style={{ fontFamily: "var(--titulo)", fontSize: 30, fontWeight: 600 }}>{r.pal}</div></Panel>}
          <div style={{ fontSize: 13, opacity: .8, marginTop: 12 }}>Llevan {(r.ok || []).length} acertadas</div>
        </div>)}
      {r.fase === "res" && (
        <div className="j-entrar">
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <div style={{ fontFamily: "var(--titulo)", fontSize: 64, fontWeight: 600, lineHeight: 1 }}>{(r.ok || []).length}</div>
            <div style={{ fontSize: 12.5, letterSpacing: ".2em", textTransform: "uppercase", opacity: .8 }}>para el equipo {eqActor}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
            {(r.ok || []).map((p: string, k: number) => <div key={"o" + k} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(63,154,110,.28)", borderRadius: 12, padding: "9px 12px" }}><IconoJuego n="check" tam={17} grosor={2.4}/>{p}</div>)}
            {(r.pas || []).map((p: string, k: number) => <div key={"p" + k} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,.07)", borderRadius: 12, padding: "9px 12px", opacity: .7 }}><IconoJuego n="equis" tam={17} grosor={2.2}/>{p}</div>)}
          </div>
          {(host || soyActor) && <Boton color="#ffffff" claro style={{ width: "100%", color: col }} onClick={siguiente}>Siguiente: {nombreDe(sala, cola[((r.k || 0) + 1) % cola.length])}</Boton>}
          {host && <Boton color="rgba(255,255,255,.14)" style={{ width: "100%", marginTop: 10 }} onClick={() => cambiar(sala.id, { "ron.fase": "final" })}>Terminar y ver quién ganó</Boton>}
        </div>)}
      {!actorAca && r.fase !== "res" && host && <Boton color="rgba(255,255,255,.14)" style={{ width: "100%", marginTop: 10 }} onClick={siguiente}>{nombreDe(sala, actor)} se fue: saltar turno</Boton>}
    </Escenario>
  );
}

// ── PASAPALABRA ───────────────────────────────────────────────────
const COLOR_LETRA: Record<string, string> = { "-": "#2f6fb0", o: "#2f9a5c", x: "#d23b4f" };
function Rosco({ est, pos, letras, tam, activo }: { est: string; pos: number; letras: string[]; tam: number; activo: boolean }) {
  const R = tam / 2 - tam * .07, b = tam * .105;
  return (
    <div style={{ position: "relative", width: tam, height: tam, margin: "0 auto", maxWidth: "100%" }}>
      {letras.map((l, i) => {
        const a = (-90 + (i * 360) / letras.length) * Math.PI / 180, x = tam / 2 + R * Math.cos(a) - b / 2, y = tam / 2 + R * Math.sin(a) - b / 2;
        const aca = activo && i === pos && est[i] === "-";
        return <span key={l} style={{ position: "absolute", left: x, top: y, width: b, height: b, borderRadius: "50%", display: "grid", placeItems: "center", fontWeight: 700, fontSize: b * .5,
          background: COLOR_LETRA[est[i]] || "#2f6fb0", color: "#fff", border: "2px solid rgba(255,255,255,.85)", transform: aca ? "scale(1.28)" : "none",
          boxShadow: aca ? "0 0 0 4px #ffd166, 0 0 18px #ffd166" : "0 2px 6px rgba(0,0,0,.35)", transition: "transform .25s ease, background .3s ease", zIndex: aca ? 2 : 1 }}>{l}</span>;
      })}
    </div>);
}
function RoscoSala({ sala, yo, host, meta, onSalir }: PropsJuego) {
  const r = sala.ron || VACIO, col = meta.color;
  const banco = ROSCOS[r.tema === "futbol" ? "futbol" : "general"];
  const conc: string[] = r.conc || [];
  const t = r.turno || 0;
  const rosco = banco[(r.r || [])[t]] || banco[0];
  const letra = rosco[(r.pos || [])[t] || 0];
  const letras = rosco.map(x => x.l);
  const restante = (r.rest || [])[t] || 0;
  const fin = r.desde ? r.desde + restante : 0;
  const faltan = useFaltan(fin);
  const seg = r.desde ? faltan : Math.ceil(restante / 1000);
  const presentador = host;
  const jugar = (acc: "ok" | "mal" | "pasa" | "tiempo") => { vibrar(acc === "ok" ? 25 : [10, 30, 10]); cambiar(sala.id, { ron: jugarRosco(r, acc, Date.now()) }); };
  useEffect(() => { if (presentador && r.fase === "juego" && r.desde && faltan === 0) cambiar(sala.id, { ron: jugarRosco(r, "tiempo", Date.now()) }); }, [presentador, faltan, r, sala.id]);
  useEffect(() => { if (r.fase === "fin") confeti(); }, [r.fase]);
  const tablero = (
    <div style={{ display: "grid", gridTemplateColumns: conc.length > 1 ? "1fr 1fr" : "1fr", gap: 8, marginBottom: 12 }}>
      {conc.map((p, i) => { const pj = puntajeRosco((r.est || [])[i] || ""); const s = i === t && r.desde ? faltan : Math.ceil(((r.rest || [])[i] || 0) / 1000); return (
        <div key={p} style={{ borderRadius: 16, padding: "8px 10px", background: i === t && r.fase === "juego" ? "rgba(255,209,102,.22)" : "rgba(255,255,255,.08)", border: i === t && r.fase === "juego" ? "2px solid #ffd166" : "1px solid rgba(255,255,255,.16)", display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar n={nombreDe(sala, p)} tam={30}/>
          <div style={{ minWidth: 0, flex: 1 }}><div style={{ fontWeight: 700, fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nombreDe(sala, p)}{p === yo ? " (tú)" : ""}</div>
            <div style={{ fontSize: 12, opacity: .85, fontVariantNumeric: "tabular-nums" }}><span style={{ color: "#8be0a8" }}>✓ {pj.ok}</span> · <span style={{ color: "#ff9aa8" }}>✗ {pj.mal}</span> · {Math.floor(s / 60)}:{String(s % 60).padStart(2, "0")}</div></div>
        </div>); })}
    </div>);

  if (r.fase === "fin") {
    const tabla = conc.map((p, i) => ({ p, ...puntajeRosco((r.est || [])[i] || "") })).sort((a, b) => b.ok - a.ok || a.mal - b.mal);
    return (
      <Escenario color={col} oscuro={meta.oscuro}>
        <BarraJuego titulo="Pasapalabra" onVolver={onSalir}/>
        <div className="j-entrar" style={{ textAlign: "center", padding: "6px 0 16px" }}>
          <IconoJuego n="copa" tam={54}/>
          <div style={{ fontFamily: "var(--titulo)", fontSize: 38, fontWeight: 600 }}>{tabla.length > 1 && tabla[0].ok === tabla[1].ok && tabla[0].mal === tabla[1].mal ? "¡Empate!" : `¡Ganó ${nombreDe(sala, tabla[0].p)}!`}</div>
          <div style={{ fontSize: 14, opacity: .85 }}>{tabla[0].ok} aciertos{tabla[0].ok === 25 ? " · ¡rosco completo!" : ""}</div>
        </div>
        {tablero}
        {host && <><Boton color="#ffffff" claro style={{ width: "100%", color: col }} onClick={() => cambiar(sala.id, inicioDe(sala, sala.cfg))}>Otro rosco</Boton><VolverSala sala={sala} host={host}/></>}
      </Escenario>);
  }

  return (
    <Escenario color={col} oscuro={meta.oscuro}>
      <BarraJuego titulo="Pasapalabra" onVolver={onSalir} derecha={<span style={{ fontSize: 12, background: "rgba(0,0,0,.22)", borderRadius: 20, padding: "5px 10px" }}>{presentador ? "Presentas tú" : sala.id}</span>}/>
      {tablero}
      <div style={{ position: "relative" }}>
        <Rosco est={(r.est || [])[t] || ""} pos={(r.pos || [])[t] || 0} letras={letras} tam={Math.min(340, typeof window !== "undefined" ? window.innerWidth - 56 : 320)} activo/>
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--titulo)", fontSize: 54, fontWeight: 700, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{seg}</div>
            <div style={{ fontSize: 11, letterSpacing: ".18em", textTransform: "uppercase", opacity: .75 }}>{r.desde ? "segundos" : "en pausa"}</div>
          </div>
        </div>
      </div>
      <div key={`${t}-${letra.l}`} className="j-entrar" style={{ background: "#fffdfb", color: "#1d2a44", borderRadius: 22, padding: "16px 18px", marginTop: 14 }}>
        <div style={{ fontSize: 11.5, letterSpacing: ".18em", textTransform: "uppercase", color: col, fontWeight: 700 }}>{letra.c ? "Contiene la" : "Empieza por"} {letra.l} · {nombreDe(sala, conc[t])}</div>
        <div style={{ fontSize: 19, lineHeight: 1.4, marginTop: 6, fontWeight: 500 }}>{letra.d}</div>
        {presentador && <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed #d8dde8", fontSize: 14 }}>Respuesta: <b style={{ fontSize: 18 }}>{letra.r}</b></div>}
      </div>
      {presentador ? (r.desde
        ? <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
            <Boton color="#2f9a5c" onClick={() => jugar("ok")}><IconoJuego n="check" tam={18} grosor={2.4}/>Bien</Boton>
            <Boton color="#d23b4f" onClick={() => jugar("mal")}><IconoJuego n="equis" tam={18} grosor={2.4}/>Mal</Boton>
            <Boton color="#ffffff" claro style={{ color: col }} onClick={() => jugar("pasa")}>Pasapalabra</Boton>
          </div>
        : <Boton color="#ffd166" style={{ width: "100%", marginTop: 12, color: "#2a2000", padding: 17 }} onClick={() => cambiar(sala.id, { "ron.desde": Date.now() })}>Partir el reloj de {nombreDe(sala, conc[t])}</Boton>)
        : <div style={{ textAlign: "center", fontSize: 13, opacity: .8, marginTop: 12 }}>{conc[t] === yo ? (r.desde ? "¡Responde en voz alta!" : "Prepárate: el presentador va a partir tu reloj.") : `Juega ${nombreDe(sala, conc[t])}.`}</div>}
      {host && <Boton color="rgba(255,255,255,.14)" style={{ width: "100%", marginTop: 10 }} onClick={() => cambiar(sala.id, { "ron.fase": "fin", "ron.desde": 0 })}>Terminar el rosco</Boton>}
    </Escenario>
  );
}

// ── ¿QUIÉN ES MÁS PROBABLE? ───────────────────────────────────────
function ProbableSala({ sala, yo, host, meta, onSalir }: PropsJuego) {
  const r = sala.ron || VACIO, col = meta.color;
  const js = jugadores(sala), ids = js.map(j => j.pid);
  const q = PROBABLE[(r.orden || [])[(r.k || 0) % PROBABLE.length] ?? 0];
  const votaron = ids.filter(p => sala.v?.[p]).length;
  const voto = sala.v?.[yo];
  useEffect(() => { if (host && r.fase === "votar" && ids.length && votaron >= ids.length) cambiar(sala.id, { "ron.fase": "res" }); }, [host, r.fase, votaron, ids.length, sala.id]);
  useEffect(() => { if (r.fase === "res") vibrar([20, 40, 20]); }, [r.fase]);
  const conteo = contarVotos(sala.v, ids);
  const max = conteo[0]?.n || 0, ganadores = conteo.filter(c => c.n === max);
  return (
    <Escenario color={col} oscuro={meta.oscuro}>
      <BarraJuego titulo="¿Quién es más probable?" onVolver={onSalir} derecha={<span style={{ fontSize: 12, background: "rgba(0,0,0,.22)", borderRadius: 20, padding: "5px 10px" }}>{(r.k || 0) + 1}</span>}/>
      <div key={r.k} className="j-entrar" style={{ background: "#fffdfb", color: "#3b1420", borderRadius: 26, padding: "24px 20px", textAlign: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 11.5, letterSpacing: ".2em", textTransform: "uppercase", color: col, fontWeight: 700 }}>¿Quién es más probable</div>
        <div style={{ fontFamily: "var(--titulo)", fontSize: 28, fontWeight: 600, lineHeight: 1.25, marginTop: 6 }}>{q}?</div>
      </div>
      {r.fase === "votar" ? <>
        <div style={{ fontSize: 13.5, opacity: .85, marginBottom: 12 }}>{voto ? `Votaste por ${nombreDe(sala, voto)} · ${votaron}/${ids.length} votaron` : "Toca a alguien. Nadie sabe quién votó por quién."}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 10 }}>
          {js.map(j => { const on = voto === j.pid; return (
            <button key={j.pid} onClick={() => { vibrar(14); cambiar(sala.id, { [`v.${yo}`]: j.pid }); }} className="j-tile" style={{ border: on ? "2px solid #fff" : "1px solid rgba(255,255,255,.2)", borderRadius: 20, padding: "14px 8px", cursor: "pointer",
              color: on ? col : "#fff", background: on ? "#fff" : "rgba(255,255,255,.1)", display: "grid", placeItems: "center", gap: 8 }}>
              <Avatar n={j.n} tam={46}/><span style={{ fontSize: 13.5, fontWeight: 600 }}>{j.n}{j.pid === yo ? " (tú)" : ""}</span>
            </button>); })}
        </div>
        {host && <Boton color="#ffffff" claro style={{ width: "100%", marginTop: 16, color: col }} onClick={() => cambiar(sala.id, { "ron.fase": "res" })}>Ver resultados</Boton>}
      </> : <>
        <div className="j-entrar" style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>{ganadores.map(g => <Avatar key={g.pid} n={nombreDe(sala, g.pid)} tam={64} style={{ boxShadow: "0 0 0 4px #fff" }}/>)}</div>
          <div style={{ fontFamily: "var(--titulo)", fontSize: 32, fontWeight: 600, marginTop: 10 }}>{max ? ganadores.map(g => nombreDe(sala, g.pid)).join(" y ") : "Nadie votó"}</div>
          {max > 0 && sala.cfg?.tragos && <div style={{ fontSize: 14, opacity: .9, marginTop: 4 }}>{ganadores.length > 1 ? "Toman" : "Toma"} un sorbo</div>}
        </div>
        <Panel>{conteo.map(c => <div key={c.pid} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <Avatar n={nombreDe(sala, c.pid)} tam={26}/><span style={{ width: 96, fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nombreDe(sala, c.pid)}</span>
          <div style={{ flex: 1, height: 10, borderRadius: 10, background: "rgba(255,255,255,.12)", overflow: "hidden" }}><div style={{ width: `${(c.n / max) * 100}%`, height: "100%", background: "#fff" }}/></div>
          <b style={{ width: 18, textAlign: "right" }}>{c.n}</b></div>)}</Panel>
        {host ? <>
          <Boton color="#ffffff" claro style={{ width: "100%", marginTop: 16, color: col }} onClick={() => cambiar(sala.id, { "ron.k": (r.k || 0) + 1, "ron.fase": "votar", v: {} })}>Siguiente pregunta</Boton>
          <VolverSala sala={sala} host={host}/>
        </> : <div style={{ textAlign: "center", fontSize: 13, opacity: .75, marginTop: 14 }}>El anfitrión pasa a la siguiente.</div>}
      </>}
    </Escenario>
  );
}
