import { useEffect, useRef, useState } from "react";
import { useData } from "../../base/hooks";
import { Boton, C, Carta, Volver, guardarLocal, leerLista, leerLocal } from "./comun";
import { BINGO, CAZA_FOTOS, IMPOSTOR } from "./contenido";
import { barajar, carton, hayLinea, repartirImpostor, sacar } from "./logica";

// Juegos para la fiesta, con un solo teléfono que se va pasando (o el del animador).

// ── IMPOSTOR ─────────────────────────────────────────────────────
export function Impostor({ onVolver }: { onVolver: () => void }) {
  const [aj, setAj] = useState(() => leerLocal("imp", { nombres: "", categoria: "De la boda", impostores: 1 }));
  const [reparto, setReparto] = useState<{ nombre: string; palabra: string | null }[] | null>(null);
  const [i, setI] = useState(0);
  const [viendo, setViendo] = useState(false);
  const [parte, setParte] = useState("");
  const [revelar, setRevelar] = useState(false);
  const cambiar = (p: any) => { const n = { ...aj, ...p }; setAj(n); guardarLocal("imp", n); };
  const jugadores = aj.nombres.split(/[\n,]/).map((x: string) => x.trim()).filter(Boolean);
  const col = "#5c3d2e";

  const empezar = () => {
    const lista = IMPOSTOR[aj.categoria] || IMPOSTOR["De la boda"];
    const palabra = barajar(lista)[0];
    const r: { nombre: string; palabra: string | null }[] = repartirImpostor(jugadores, palabra, aj.impostores);
    setReparto(r); setI(0); setViendo(false); setRevelar(false);
    setParte(barajar(r.map(x => x.nombre))[0]);
  };

  if (!reparto) return (
    <div>
      <Volver onClick={onVolver}/>
      <div style={{ fontSize: 20, fontWeight: 700, color: C.cafe, textAlign: "center" }}>El impostor 🕵️</div>
      <div style={{ fontSize: 12, color: C.suave, textAlign: "center", margin: "6px 0 14px", lineHeight: 1.45 }}>
        Todos ven la misma palabra menos el impostor. Por turnos, cada uno dice UNA palabra relacionada, sin ser obvio.
        Después se vota quién es. El impostor gana si no lo pillan… o si adivina la palabra.
      </div>
      <textarea id="imp-nombres" value={aj.nombres} onChange={e => cambiar({ nombres: e.target.value })} rows={5} placeholder={"Nombres de los jugadores, uno por línea\nDiego\nCamila\nTía Gladys…"}
        style={{ width: "100%", background: "#fff", border: `1.5px solid ${C.borde}`, borderRadius: 12, padding: 12, fontSize: 14, color: C.cafe, fontFamily: "inherit", outline: "none", resize: "vertical" }}/>
      <div style={{ fontSize: 12, color: C.suave, margin: "12px 0 6px" }}>Tema de las palabras</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {Object.keys(IMPOSTOR).map(k => (
          <button key={k} onClick={() => cambiar({ categoria: k })} style={{ fontFamily: "inherit", cursor: "pointer", borderRadius: 20, padding: "6px 12px", fontSize: 12, fontWeight: 700,
            background: aj.categoria === k ? col : "#fff", color: aj.categoria === k ? "#fff" : C.cafe, border: `1.5px solid ${C.borde}` }}>{k}</button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
        <span style={{ fontSize: 13, color: C.cafe, flex: 1 }}>Impostores</span>
        {[1, 2, 3].map(n => (
          <button key={n} onClick={() => cambiar({ impostores: n })} style={{ width: 40, height: 40, borderRadius: 12, fontFamily: "inherit", fontWeight: 800, cursor: "pointer",
            background: aj.impostores === n ? col : "#fff", color: aj.impostores === n ? "#fff" : C.cafe, border: `1.5px solid ${C.borde}` }}>{n}</button>
        ))}
      </div>
      <Boton color={col} style={{ width: "100%", marginTop: 16 }} disabled={jugadores.length < 3} onClick={empezar}>
        {jugadores.length < 3 ? "Se necesitan al menos 3 jugadores" : `Repartir a ${jugadores.length} jugadores`}
      </Boton>
    </div>
  );

  // Pasar el teléfono: cada uno ve lo suyo y lo tapa.
  if (i < reparto.length) {
    const j = reparto[i];
    return (
      <div>
        <Volver onClick={() => setReparto(null)} texto="← Volver a armar"/>
        <div style={{ textAlign: "center", fontSize: 12, color: C.suave }}>Jugador {i + 1} de {reparto.length}</div>
        <div style={{ textAlign: "center", fontSize: 24, fontWeight: 700, color: C.cafe, margin: "6px 0 16px" }}>Pásale el teléfono a {j.nombre}</div>
        {viendo ? (
          <Carta color={j.palabra ? C.dorado : "#c0394f"} chico={j.palabra ? "Tu palabra" : "Eres"}>
            <span style={{ fontSize: 28, fontWeight: 700 }}>{j.palabra || "EL IMPOSTOR 🕵️"}</span>
            {!j.palabra && <span style={{ display: "block", fontSize: 13, color: C.suave, marginTop: 8 }}>Escucha las pistas y haz como que sabes</span>}
          </Carta>
        ) : <Carta color={C.dorado}>Toca para ver tu palabra.<br/><span style={{ fontSize: 13, color: C.suave }}>Que nadie más mire 👀</span></Carta>}
        <Boton color={col} style={{ width: "100%", marginTop: 14 }} onClick={() => { if (!viendo) setViendo(true); else { setViendo(false); setI(i + 1); } }}>
          {viendo ? "Listo, tapar y pasar →" : "Ver mi palabra"}
        </Boton>
      </div>
    );
  }
  const imp = reparto.filter(x => !x.palabra).map(x => x.nombre);
  const palabra = reparto.find(x => x.palabra)?.palabra;
  return (
    <div>
      <Volver onClick={() => setReparto(null)} texto="← Nueva ronda"/>
      <Carta color={C.dorado} chico="Empieza">
        <span style={{ fontSize: 26, fontWeight: 700 }}>{parte}</span>
        <span style={{ display: "block", fontSize: 13, color: C.suave, marginTop: 8 }}>Cada uno dice una palabra, en orden. Después voten.</span>
      </Carta>
      {revelar ? (
        <div style={{ marginTop: 14, background: "#fff", borderRadius: 16, padding: 16, textAlign: "center", border: "2px solid #c0394f55" }}>
          <div style={{ fontSize: 12, color: C.suave }}>{imp.length > 1 ? "Los impostores eran" : "El impostor era"}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#c0394f" }}>{imp.join(" y ")}</div>
          <div style={{ fontSize: 13, color: C.cafe, marginTop: 8 }}>La palabra: <b>{palabra}</b></div>
        </div>
      ) : <Boton color="#c0394f" style={{ width: "100%", marginTop: 14 }} onClick={() => setRevelar(true)}>Ya votamos: mostrar al impostor</Boton>}
      <Boton color={col} claro style={{ width: "100%", marginTop: 10 }} onClick={empezar}>Otra ronda con los mismos</Boton>
    </div>
  );
}

// ── MAZO SIMPLE: misiones por mesa y mímica (con reloj) ──────────
export function Mazo({ titulo, desc, cartas, clave, color, reloj, onVolver }: { titulo: string; desc: string; cartas: string[]; clave: string; color: string; reloj?: number; onVolver: () => void }) {
  const lista = cartas.map((texto, i) => ({ id: `${clave}${i}`, texto }));
  const [actual, setActual] = useState<string | null>(null);
  const [seg, setSeg] = useState(0);
  const t = useRef<any>(null);
  useEffect(() => () => clearInterval(t.current), []);
  const otra = () => {
    const r = sacar(lista, leerLista(clave)); guardarLocal(clave, r.usadas); setActual(r.carta?.texto || null);
    if (reloj) { clearInterval(t.current); setSeg(reloj); t.current = setInterval(() => setSeg(s => { if (s <= 1) { clearInterval(t.current); return 0; } return s - 1; }), 1000); }
  };
  return (
    <div>
      <Volver onClick={onVolver}/>
      <div style={{ fontSize: 20, fontWeight: 700, color: C.cafe, textAlign: "center" }}>{titulo}</div>
      <div style={{ fontSize: 12, color: C.suave, textAlign: "center", margin: "4px 0 14px", lineHeight: 1.4 }}>{desc}</div>
      <Carta color={color}>{actual || "Toca el botón para sacar una"}</Carta>
      {reloj && actual && <div style={{ textAlign: "center", fontSize: 40, fontWeight: 700, color: seg ? color : "#c0394f", marginTop: 10, fontVariantNumeric: "tabular-nums" }}>{seg ? `${seg}s` : "¡Tiempo!"}</div>}
      <Boton color={color} style={{ width: "100%", marginTop: 14 }} onClick={otra}>{actual ? "Otra →" : "Sacar"}</Boton>
    </div>
  );
}

// ── BINGO: cartones para imprimir o para jugar en el teléfono ────
export function Bingo({ onVolver }: { onVolver: () => void }) {
  const [c, setC] = useState<string[]>(() => { const g = leerLista("bingo_carton"); return g.length === 25 ? g : carton(BINGO); });
  const [m, setM] = useState<number[]>(() => leerLista("bingo_marcas").map(Number));
  const nuevo = () => { const x = carton(BINGO); setC(x); setM([]); guardarLocal("bingo_carton", x); guardarLocal("bingo_marcas", []); };
  const toggle = (i: number) => { if (i === 12) return; const n = m.includes(i) ? m.filter(x => x !== i) : [...m, i]; setM(n); guardarLocal("bingo_marcas", n); };
  useEffect(() => { guardarLocal("bingo_carton", c); }, [c]);
  const linea = hayLinea(m);
  const col = "#c9956a";
  return (
    <div>
      <Volver onClick={onVolver}/>
      <div style={{ fontSize: 20, fontWeight: 700, color: C.cafe, textAlign: "center" }}>Bingo de la boda</div>
      <div style={{ fontSize: 12, color: C.suave, textAlign: "center", margin: "4px 0 12px" }}>Marca lo que va pasando. ¡Línea completa gana!</div>
      {linea && <div style={{ textAlign: "center", fontSize: 18, fontWeight: 800, color: "#4f8a5b", marginBottom: 8 }}>🎉 ¡BINGO! 🎉</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 4 }}>
        {c.map((f, i) => {
          const on = i === 12 || m.includes(i);
          return <button key={i} onClick={() => toggle(i)} style={{ aspectRatio: "1", fontFamily: "inherit", fontSize: 9.5, lineHeight: 1.15, padding: 3, borderRadius: 8, cursor: "pointer",
            background: on ? col : "#fff", color: on ? "#fff" : C.cafe, border: `1.5px solid ${on ? col : C.borde}`, fontWeight: on ? 700 : 400, overflow: "hidden" }}>{f}</button>;
        })}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <Boton color={col} claro style={{ flex: 1 }} onClick={nuevo}>Cartón nuevo</Boton>
        <Boton color={col} style={{ flex: 1 }} onClick={() => imprimirCartones(12)}>Imprimir 12 cartones</Boton>
      </div>
    </div>
  );
}
function imprimirCartones(n: number) {
  const w = window.open("", "_blank"); if (!w) return;
  const celdas = (cc: string[]) => cc.map(f => `<td>${f.replace(/</g, "&lt;")}</td>`);
  const tablas = Array.from({ length: n }, () => { const cc = celdas(carton(BINGO)); return `<div class="c"><h2>Bingo de la boda · Diego & Camila</h2><table>${[0, 1, 2, 3, 4].map(r => `<tr>${cc.slice(r * 5, r * 5 + 5).join("")}</tr>`).join("")}</table></div>`; });
  w.document.write(`<html><head><title>Bingo de la boda</title><style>body{font-family:Georgia,serif;color:#5c3d2e}.c{page-break-inside:avoid;margin:0 auto 28px;max-width:520px}h2{text-align:center;font-weight:400;font-size:16px}table{width:100%;border-collapse:collapse;table-layout:fixed}td{border:1.5px solid #c9956a;height:82px;text-align:center;font-size:11px;padding:4px}</style></head><body>${tablas.join("")}<script>print()</script></body></html>`);
  w.document.close();
}

// ── CAZA DE FOTOS: lista para marcar; las fotos se suben con el QR de la Galería ──
export function CazaFotos({ onVolver }: { onVolver: () => void }) {
  const [hechas, setHechas] = useState<string[]>(() => leerLista("caza"));
  const t = (x: string) => { const n = hechas.includes(x) ? hechas.filter(y => y !== x) : [...hechas, x]; setHechas(n); guardarLocal("caza", n); };
  return (
    <div>
      <Volver onClick={onVolver}/>
      <div style={{ fontSize: 20, fontWeight: 700, color: C.cafe, textAlign: "center" }}>Caza de fotos 📸</div>
      <div style={{ fontSize: 12, color: C.suave, textAlign: "center", margin: "4px 0 14px", lineHeight: 1.4 }}>
        Muéstrales esta lista a los invitados (o proyéctala). Las fotos se suben con el QR de la Galería. {hechas.length} de {CAZA_FOTOS.length}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {CAZA_FOTOS.map(x => (
          <button key={x} onClick={() => t(x)} style={{ display: "flex", gap: 10, alignItems: "center", textAlign: "left", fontFamily: "inherit", cursor: "pointer", background: "#fff",
            border: `1.5px solid ${hechas.includes(x) ? "#4f8a5b" : C.borde}`, borderRadius: 12, padding: "11px 12px", fontSize: 14, color: C.cafe }}>
            <span style={{ fontSize: 18 }}>{hechas.includes(x) ? "✅" : "⬜️"}</span><span style={{ textDecoration: hechas.includes(x) ? "line-through" : "none", opacity: hechas.includes(x) ? .6 : 1 }}>{x}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── TRIVIA DE LOS NOVIOS: las preguntas las escriben ustedes; en la fiesta, modo presentador ──
type Pregunta = { id: number; p: string; r: string };
export function Trivia({ onVolver }: { onVolver: () => void }) {
  const [data, setData] = useData<{ preguntas: Pregunta[] }>("trivia", { preguntas: [] });
  const [p, setP] = useState(""); const [r, setR] = useState("");
  const [modo, setModo] = useState<"editar" | "jugar">("editar");
  const [k, setK] = useState(0); const [ver, setVer] = useState(false);
  const lista = data.preguntas || [];
  const agregar = () => { if (!p.trim() || !r.trim()) return; setData({ preguntas: [...lista, { id: Date.now(), p: p.trim(), r: r.trim() }] }); setP(""); setR(""); };
  const col = "#7a9e7e";
  if (modo === "jugar" && lista.length) {
    const q = lista[k % lista.length];
    return (
      <div>
        <Volver onClick={() => setModo("editar")} texto="← Editar preguntas"/>
        <div style={{ textAlign: "center", fontSize: 12, color: C.suave, marginBottom: 10 }}>Pregunta {(k % lista.length) + 1} de {lista.length}</div>
        <Carta color={col} chico="¿Cuánto conocen a los novios?">{q.p}</Carta>
        {ver ? <div style={{ marginTop: 12, textAlign: "center", fontSize: 20, fontWeight: 700, color: col, animation: "fadeUp .3s" }}>{q.r}</div>
             : <Boton color={col} claro style={{ width: "100%", marginTop: 12 }} onClick={() => setVer(true)}>Mostrar respuesta</Boton>}
        <Boton color={col} style={{ width: "100%", marginTop: 10 }} onClick={() => { setK(k + 1); setVer(false); }}>Siguiente →</Boton>
      </div>
    );
  }
  return (
    <div>
      <Volver onClick={onVolver}/>
      <div style={{ fontSize: 20, fontWeight: 700, color: C.cafe, textAlign: "center" }}>Trivia de los novios</div>
      <div style={{ fontSize: 12, color: C.suave, textAlign: "center", margin: "4px 0 14px", lineHeight: 1.4 }}>
        Escriban preguntas sobre ustedes («¿dónde fue la primera cita?»). En la fiesta, el animador las lee y las mesas compiten.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input id="tr-p" value={p} onChange={e => setP(e.target.value)} placeholder="Pregunta" style={{ background: "#fff", border: `1.5px solid ${C.borde}`, borderRadius: 10, padding: "10px 12px", fontSize: 14, fontFamily: "inherit", color: C.cafe }}/>
        <input id="tr-r" value={r} onChange={e => setR(e.target.value)} placeholder="Respuesta" style={{ background: "#fff", border: `1.5px solid ${C.borde}`, borderRadius: 10, padding: "10px 12px", fontSize: 14, fontFamily: "inherit", color: C.cafe }}/>
        <Boton color={col} onClick={agregar}>Agregar pregunta</Boton>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 14 }}>
        {lista.map((q, i) => (
          <div key={q.id} style={{ background: "#fff", border: `1px solid ${C.borde}`, borderRadius: 12, padding: "10px 12px", display: "flex", gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, color: C.cafe }}>{i + 1}. {q.p}</div><div style={{ fontSize: 12, color: col, fontWeight: 700 }}>{q.r}</div></div>
            <button onClick={() => setData({ preguntas: lista.filter(x => x.id !== q.id) })} style={{ background: "none", border: "none", color: "#c0394f", cursor: "pointer", fontSize: 16 }}>✕</button>
          </div>
        ))}
      </div>
      {lista.length > 0 && <Boton color={col} style={{ width: "100%", marginTop: 14 }} onClick={() => { setModo("jugar"); setK(0); setVer(false); }}>Jugar ({lista.length} preguntas)</Boton>}
    </div>
  );
}
