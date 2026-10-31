import { useEffect, useState } from "react";
import { BarraJuego, Boton, Escenario, IconoJuego, confeti, vibrar } from "./comun";
import { barajar } from "./logica";
import { Sala, cambiar, jugadores } from "./sala";
import { Panel, Pildora, PropsJuego, Rotulo, VACIO, VolverSala, nombreDe } from "./uiGrupo";

// ═══════════════════════════════════════════════════════════════════
// ¿QUIÉN ES QUIÉN? (31-oct-2026): dos jugadores, cada uno con su tablero de 24 personajes en su
// teléfono y uno secreto. Por turnos se hacen preguntas de sí o no en voz alta y se bajan las caras
// que no calzan. El que adivina el personaje del otro gana; si arriesga y falla, pierde.
// ═══════════════════════════════════════════════════════════════════
type Pelo = "negro" | "cafe" | "rubio" | "colorin" | "canoso";
type Peinado = "corto" | "largo" | "rulos" | "tomate" | "pelado";
export type Personaje = { n: string; g: "h" | "m"; piel: 0 | 1 | 2 | 3; pelo: Pelo; peinado: Peinado; lentes?: boolean; gorro?: string; barba?: "barba" | "bigote"; aros?: boolean; pecas?: boolean; ropa: string };
const P = (n: string, g: "h" | "m", piel: 0 | 1 | 2 | 3, pelo: Pelo, peinado: Peinado, ropa: string, extra: Partial<Personaje> = {}): Personaje => ({ n, g, piel, pelo, peinado, ropa, ...extra });
export const PERSONAJES: Personaje[] = [
  P("Pedro", "h", 1, "negro", "corto", "#3b82f6", { lentes: true, barba: "barba" }),
  P("Tomás", "h", 0, "rubio", "corto", "#22c55e"),
  P("Matías", "h", 2, "negro", "rulos", "#f97316", { gorro: "#dc2626" }),
  P("Javier", "h", 1, "cafe", "corto", "#a855f7", { barba: "bigote" }),
  P("Rodrigo", "h", 0, "canoso", "pelado", "#0ea5e9", { lentes: true, barba: "barba" }),
  P("Felipe", "h", 1, "colorin", "corto", "#14b8a6", { pecas: true }),
  P("Andrés", "h", 2, "negro", "corto", "#eab308", { barba: "barba", gorro: "#2563eb" }),
  P("Claudio", "h", 0, "canoso", "corto", "#64748b", { lentes: true, barba: "bigote" }),
  P("Hernán", "h", 3, "negro", "pelado", "#ef4444"),
  P("Ignacio", "h", 1, "cafe", "largo", "#84cc16", { barba: "barba" }),
  P("Benjamín", "h", 0, "rubio", "rulos", "#ec4899", { lentes: true }),
  P("Óscar", "h", 2, "cafe", "corto", "#6366f1", { gorro: "#16a34a", pecas: true }),
  P("Camila", "m", 1, "cafe", "largo", "#f43f5e", { aros: true }),
  P("Valentina", "m", 0, "rubio", "largo", "#06b6d4", { lentes: true }),
  P("Josefa", "m", 2, "negro", "rulos", "#facc15", { aros: true }),
  P("Daniela", "m", 1, "colorin", "largo", "#10b981", { pecas: true }),
  P("Francisca", "m", 0, "canoso", "tomate", "#8b5cf6", { lentes: true, aros: true }),
  P("Paula", "m", 3, "negro", "tomate", "#f59e0b", { aros: true }),
  P("Carolina", "m", 1, "negro", "corto", "#0ea5e9", { lentes: true }),
  P("Antonia", "m", 0, "rubio", "tomate", "#22c55e", { gorro: "#db2777" }),
  P("Catalina", "m", 2, "cafe", "rulos", "#e11d48", { lentes: true, aros: true }),
  P("Fernanda", "m", 1, "cafe", "corto", "#7c3aed", { gorro: "#ca8a04" }),
  P("Javiera", "m", 0, "colorin", "rulos", "#0d9488", { aros: true, pecas: true }),
  P("Rocío", "m", 2, "rubio", "largo", "#2563eb", { gorro: "#7c3aed" }),
];
export const PREGUNTAS = ["¿Tiene lentes?", "¿Tiene barba o bigote?", "¿Usa gorro?", "¿Tiene el pelo largo?", "¿Tiene rulos?", "¿Es pelado?", "¿Es colorín?",
  "¿Es rubio o rubia?", "¿Tiene canas?", "¿Tiene aros?", "¿Tiene pecas?", "¿Es mujer?", "¿Tiene el pelo tomado?"];

const PIEL = ["#f6d7c3", "#e9b994", "#c98d63", "#8d5a3b"];
const PELO: Record<Pelo, string> = { negro: "#2b2220", cafe: "#6b4423", rubio: "#e3c16f", colorin: "#c4512b", canoso: "#d4d4d8" };
const FONDOS = ["#fde68a", "#bfdbfe", "#fecaca", "#bbf7d0", "#ddd6fe", "#fed7aa", "#a5f3fc", "#fbcfe8"];

/** La cara dibujada de un personaje (SVG, sin imágenes). */
export function Cara({ p, i, tam = 64 }: { p: Personaje; i: number; tam?: number }) {
  const piel = PIEL[p.piel], pelo = PELO[p.pelo], oscuro = p.pelo === "canoso" ? "#a1a1aa" : pelo;
  const tapa = !!p.gorro;
  return (
    <svg width={tam} height={tam * 1.2} viewBox="0 0 100 120" aria-hidden="true" style={{ display: "block" }}>
      <rect width="100" height="120" rx="14" fill={FONDOS[i % FONDOS.length]}/>
      {p.peinado === "largo" && <path d="M22 50 C18 22 82 22 78 50 L84 100 C70 108 30 108 16 100 Z" fill={pelo}/>}
      {p.peinado === "rulos" && [[24, 40], [30, 28], [42, 21], [58, 21], [70, 28], [76, 40], [22, 54], [78, 54], [26, 66], [74, 66]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r="11" fill={pelo}/>)}
      {p.peinado === "tomate" && !tapa && <circle cx="50" cy="16" r="12" fill={pelo}/>}
      <path d="M8 120 C10 96 30 88 50 88 C70 88 90 96 92 120 Z" fill={p.ropa}/>
      <rect x="42" y="72" width="16" height="20" rx="6" fill={piel}/>
      <ellipse cx="26" cy="55" rx="5" ry="7" fill={piel}/><ellipse cx="74" cy="55" rx="5" ry="7" fill={piel}/>
      {p.aros && <><circle cx="26" cy="64" r="3" fill="#f5c542" stroke="#b8860b" strokeWidth="1"/><circle cx="74" cy="64" r="3" fill="#f5c542" stroke="#b8860b" strokeWidth="1"/></>}
      <ellipse cx="50" cy="52" rx="24" ry="28" fill={piel}/>
      {p.peinado === "corto" && !tapa && <path d="M26 48 C23 20 77 20 74 48 C70 34 60 30 50 31 C40 30 30 34 26 48 Z" fill={pelo}/>}
      {(p.peinado === "largo" || p.peinado === "tomate") && !tapa && <path d="M26 50 C22 20 78 20 74 50 C68 36 58 30 50 30 C42 30 32 36 26 50 Z" fill={pelo}/>}
      {p.peinado === "pelado" && !tapa && <><path d="M26 54 C25 44 28 40 31 38 L32 52 Z" fill={pelo}/><path d="M74 54 C75 44 72 40 69 38 L68 52 Z" fill={pelo}/></>}
      {tapa && <><path d="M25 42 C25 14 75 14 75 42 Z" fill={p.gorro}/><rect x="22" y="38" width="56" height="8" rx="4" fill={p.gorro} opacity=".85"/><circle cx="50" cy="15" r="5" fill={p.gorro}/></>}
      <path d="M38 47 h8 M54 47 h8" stroke={oscuro} strokeWidth="2.4" strokeLinecap="round"/>
      <circle cx="42" cy="54" r="2.8" fill="#1f1611"/><circle cx="58" cy="54" r="2.8" fill="#1f1611"/>
      {p.lentes && <g stroke="#1f2937" strokeWidth="2" fill="rgba(255,255,255,.18)"><circle cx="42" cy="54" r="7"/><circle cx="58" cy="54" r="7"/><path d="M49 54 h2" fill="none"/></g>}
      <path d="M50 57 C48 62 48 64 51 64" stroke="#00000055" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
      {p.pecas && [[36, 62], [39, 65], [33, 65], [64, 62], [61, 65], [67, 65]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r="1.1" fill="#a0522d"/>)}
      {p.barba === "barba" && <path d="M27 58 C29 84 71 84 73 58 C68 74 60 76 50 76 C40 76 32 74 27 58 Z" fill={oscuro}/>}
      {p.barba === "bigote" && <path d="M41 67 C45 64 49 65 50 66 C51 65 55 64 59 67 C55 68 52 68 50 67 C48 68 45 68 41 67 Z" fill={oscuro}/>}
      <path d={p.barba === "barba" ? "M44 70 Q50 73 56 70" : "M43 69 Q50 74 57 69"} stroke="#7f1d1d" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>);
}

// ── Opciones y comienzo ───────────────────────────────────────────
export function ConfigQuien({ sala, cfg, poner, color }: { sala: Sala; cfg: any; poner: (c: any) => void; color: string }) {
  const js = jugadores(sala);
  const conc: string[] = (cfg.conc || []).filter((p: string) => sala.jug[p]);
  const toggle = (p: string) => poner({ conc: conc.includes(p) ? conc.filter(x => x !== p) : [...conc, p].slice(-2) });
  return <>
    <div style={{ fontSize: 12.5, opacity: .85, marginBottom: 12, lineHeight: 1.45 }}>Elige a los 2 que juegan (puedes ser tú). Los demás miran los tableros desde su teléfono.</div>
    <Rotulo>Jugadores</Rotulo>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{js.map(j => <Pildora key={j.pid} on={conc.includes(j.pid)} color={color} onClick={() => toggle(j.pid)}>{j.n}</Pildora>)}</div>
    {conc.length < 2 && <div style={{ fontSize: 12, opacity: .75, marginTop: 8 }}>Faltan {2 - conc.length} por elegir.</div>}
  </>;
}
export function inicioQuien(sala: Sala, cfg: any): Record<string, any> {
  const conc: string[] = (cfg.conc || []).filter((p: string) => sala.jug[p]).slice(0, 2);
  const [a, b] = barajar(PERSONAJES.map((_, i) => i));
  return { est: "juego", cfg, v: {}, ron: { conc, sec: [a, b], turno: Math.random() < .5 ? 0 : 1, fase: "juego", gan: null, desc: { [conc[0]]: [], [conc[1]]: [] }, n: (sala.ron?.n || 0) + 1 } };
}

// ── La partida ────────────────────────────────────────────────────
export function QuienSala({ sala, yo, host, meta, onSalir }: PropsJuego) {
  const r = sala.ron || VACIO, col = meta.color;
  const conc: string[] = r.conc || [];
  const yoIdx = conc.indexOf(yo), juego = yoIdx >= 0;
  const otro = juego ? 1 - yoIdx : -1;
  const turnoDe = conc[r.turno || 0], miTurno = turnoDe === yo;
  const [arriesgar, setArriesgar] = useState(false);
  const [verSecreto, setVerSecreto] = useState(false);
  const [mirar, setMirar] = useState(0);   // espectadores: qué tablero ven
  useEffect(() => { if (r.fase === "fin") { vibrar([30, 40, 30]); if (r.gan === yo || !juego) confeti(); } }, [r.fase, r.gan, yo, juego]);
  useEffect(() => { setArriesgar(false); }, [r.turno, r.n]);

  const desc: number[] = juego ? (r.desc?.[yo] || []) : (r.desc?.[conc[mirar]] || []);
  const tocar = (i: number) => {
    if (!juego || r.fase !== "juego") return;
    if (arriesgar) {
      vibrar(30);
      const acerto = i === r.sec[otro];
      cambiar(sala.id, { "ron.fase": "fin", "ron.gan": acerto ? yo : conc[otro], "ron.porque": acerto ? "acerto" : "fallo", "ron.arriesgo": { pid: yo, i } });
      return;
    }
    vibrar(8);
    cambiar(sala.id, { [`ron.desc.${yo}`]: desc.includes(i) ? desc.filter(x => x !== i) : [...desc, i] });
  };
  const quedan = (pid: string) => PERSONAJES.length - (r.desc?.[pid] || []).length;

  const tablero = (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))", gap: 6 }}>
      {PERSONAJES.map((p, i) => { const abajo = desc.includes(i); return (
        <button key={p.n} onClick={() => tocar(i)} disabled={!juego || r.fase !== "juego"} aria-label={`${p.n}${abajo ? " (descartado)" : ""}`}
          style={{ padding: 3, borderRadius: 12, border: arriesgar && !abajo ? "2px solid #ffd166" : "1px solid rgba(255,255,255,.18)", background: "rgba(255,255,255,.08)", cursor: juego ? "pointer" : "default",
            opacity: abajo ? .25 : 1, filter: abajo ? "grayscale(1)" : "none", transform: abajo ? "scale(.94)" : "none", transition: "all .25s ease", color: "#fff" }}>
          <div style={{ borderRadius: 9, overflow: "hidden" }}><Cara p={p} i={i} tam={62}/></div>
          <div style={{ fontSize: 11.5, fontWeight: 700, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.n}</div>
        </button>); })}
    </div>);

  if (r.fase === "fin") {
    const ganador = r.gan, arr = r.arriesgo || {};
    return (
      <Escenario color={col} oscuro={meta.oscuro}>
        <BarraJuego titulo="¿Quién es quién?" onVolver={onSalir}/>
        <div className="j-entrar" style={{ textAlign: "center", padding: "4px 0 14px" }}>
          <IconoJuego n="corona" tam={50}/>
          <div style={{ fontFamily: "var(--titulo)", fontSize: 36, fontWeight: 600, lineHeight: 1.1 }}>{ganador === yo ? "¡Ganaste!" : `Ganó ${nombreDe(sala, ganador)}`}</div>
          <div style={{ fontSize: 13.5, opacity: .85, marginTop: 6 }}>{r.porque === "acerto"
            ? `${nombreDe(sala, arr.pid)} adivinó: era ${PERSONAJES[arr.i]?.n}.`
            : `${nombreDe(sala, arr.pid)} arriesgó con ${PERSONAJES[arr.i]?.n} y no era.`}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {conc.map((p, k) => <Panel key={p} style={{ textAlign: "center" }}>
            <Rotulo style={{ marginBottom: 6 }}>El de {nombreDe(sala, p)}</Rotulo>
            <div style={{ width: 96, margin: "0 auto", borderRadius: 12, overflow: "hidden" }}><Cara p={PERSONAJES[r.sec[k]]} i={r.sec[k]} tam={96}/></div>
            <div style={{ fontWeight: 700, marginTop: 6 }}>{PERSONAJES[r.sec[k]]?.n}</div>
          </Panel>)}
        </div>
        {host && <><Boton color="#ffffff" claro style={{ width: "100%", marginTop: 16, color: col }} onClick={() => cambiar(sala.id, inicioQuien(sala, sala.cfg))}><IconoJuego n="barajar" tam={18}/>Revancha</Boton><VolverSala sala={sala} host={host}/></>}
      </Escenario>);
  }

  const secreto = juego ? PERSONAJES[r.sec[yoIdx]] : null;
  return (
    <Escenario color={col} oscuro={meta.oscuro}>
      <BarraJuego titulo="¿Quién es quién?" onVolver={onSalir} derecha={<span style={{ fontSize: 12, background: "rgba(0,0,0,.22)", borderRadius: 20, padding: "5px 10px" }}>Quedan {juego ? quedan(yo) : quedan(conc[mirar])}</span>}/>
      {juego && secreto && (
        <div onClick={() => setVerSecreto(v => !v)} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(0,0,0,.22)", border: "1px solid rgba(255,255,255,.18)", borderRadius: 18, padding: 10, marginBottom: 12, cursor: "pointer" }}>
          <div style={{ width: 58, borderRadius: 10, overflow: "hidden", filter: verSecreto ? "none" : "blur(9px)", transition: "filter .3s" }}><Cara p={secreto} i={r.sec[yoIdx]} tam={58}/></div>
          <div style={{ flex: 1 }}><Rotulo style={{ marginBottom: 2 }}>Tu personaje secreto</Rotulo>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{verSecreto ? secreto.n : "Toca para verlo (que nadie mire)"}</div>
            {verSecreto && !miTurno && <div style={{ fontSize: 12, opacity: .8, marginTop: 2 }}>Responde con la verdad mirando su cara.</div>}</div>
        </div>)}
      <Panel style={{ marginBottom: 12, background: miTurno ? "rgba(255,209,102,.2)" : undefined, borderColor: miTurno ? "#ffd166" : undefined }}>
        {miTurno ? <>
          <div style={{ fontWeight: 700, fontSize: 15.5 }}>{arriesgar ? "Toca al que crees que es. Si fallas, pierdes." : "Tu turno: haz UNA pregunta de sí o no en voz alta"}</div>
          {!arriesgar && <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>{PREGUNTAS.slice(0, 8).map(q => <span key={q} style={{ fontSize: 11.5, background: "rgba(255,255,255,.12)", borderRadius: 20, padding: "4px 9px" }}>{q}</span>)}</div>}
          <div style={{ fontSize: 12.5, opacity: .8, marginTop: 8 }}>Con la respuesta, toca las caras que ya no sirven para bajarlas.</div>
        </> : juego ? <div style={{ fontWeight: 600 }}>Pregunta {nombreDe(sala, turnoDe)}. Respóndele con la verdad.</div>
          : <><div style={{ fontWeight: 600 }}>{nombreDe(sala, conc[0])} contra {nombreDe(sala, conc[1])} · pregunta {nombreDe(sala, turnoDe)}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>{conc.map((p, k) => <Pildora key={p} on={mirar === k} color={col} onClick={() => setMirar(k)}>Tablero de {nombreDe(sala, p)}</Pildora>)}</div></>}
      </Panel>
      {tablero}
      {miTurno && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }}>
        <Boton color={arriesgar ? "#ffd166" : "rgba(255,255,255,.16)"} style={{ color: arriesgar ? "#2a2000" : "#fff" }} onClick={() => setArriesgar(a => !a)}>{arriesgar ? "Mejor no" : "¡Ya sé quién es!"}</Boton>
        <Boton color="#ffffff" claro style={{ color: col }} onClick={() => { setArriesgar(false); cambiar(sala.id, { "ron.turno": 1 - (r.turno || 0) }); }}>Terminé mi turno</Boton>
      </div>}
      {host && !juego && <VolverSala sala={sala} host={host}/>}
    </Escenario>
  );
}
