import { useState } from "react";
import { Boton, C, Carta, TarjetaJuego, Volver, guardarLocal, leerLista } from "./comun";
import { DADOS, PACKS, PREFERIRIAS, QUIZ } from "./contenido";
import { sacar } from "./logica";

// Juegos en pareja que no son +18: preguntas por pack, ¿qué preferirías?, ¿cuánto me conoces? y dados.

const conId = (l: string[], pre: string) => l.map((texto, i) => ({ id: `${pre}${i}`, texto }));

/** Un mazo que no repite (guarda en el teléfono qué ya salió). */
function useMazo(clave: string, cartas: { id: string; texto: string }[]) {
  const [actual, setActual] = useState<{ id: string; texto: string } | null>(null);
  const otra = () => { const r = sacar(cartas, leerLista(clave)); guardarLocal(clave, r.usadas); setActual(r.carta); };
  return { actual, otra };
}

export function Packs({ onVolver }: { onVolver: () => void }) {
  const [pack, setPack] = useState<string | null>(null);
  const p = PACKS.find(x => x.id === pack);
  if (!p) return (
    <div>
      <Volver onClick={onVolver}/>
      <div style={{ fontSize: 20, fontWeight: 700, color: C.cafe, textAlign: "center", marginBottom: 14 }}>Elige un pack</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {PACKS.map(x => <TarjetaJuego key={x.id} titulo={x.nombre} desc={x.desc} icono={{ acercandonos: "🫶", vida: "🌙", tierno: "🤪", dificiles: "🧩" }[x.id] || "💬"} color={x.color} onClick={() => setPack(x.id)}/>)}
      </div>
    </div>
  );
  return <Preguntas key={p.id} titulo={p.nombre} color={p.color} clave={`pack_${p.id}`} cartas={conId(p.preguntas, p.id)} onVolver={() => setPack(null)} volverTexto="← Packs"/>;
}

function Preguntas({ titulo, color, clave, cartas, onVolver, volverTexto, chico }: { titulo: string; color: string; clave: string; cartas: { id: string; texto: string }[]; onVolver: () => void; volverTexto?: string; chico?: string }) {
  const { actual, otra } = useMazo(clave, cartas);
  const [turno, setTurno] = useState(0);
  return (
    <div>
      <Volver onClick={onVolver} texto={volverTexto}/>
      <div style={{ fontSize: 20, fontWeight: 700, color: C.cafe, textAlign: "center" }}>{titulo}</div>
      <div style={{ fontSize: 12, color: C.suave, textAlign: "center", margin: "4px 0 14px" }}>Respondan los dos, por turnos. Sin apuro.</div>
      {actual ? <Carta color={color} chico={chico || `Responde ${turno % 2 === 0 ? "primero tú" : "tu pareja primero"}`}>{actual.texto}</Carta>
              : <Carta color={color}>Toca «Otra pregunta» para empezar</Carta>}
      <Boton color={color} style={{ width: "100%", marginTop: 14 }} onClick={() => { otra(); setTurno(t => t + 1); }}>{actual ? "Otra pregunta →" : "Empezar"}</Boton>
    </div>
  );
}

export function Preferirias({ onVolver }: { onVolver: () => void }) {
  const cartas = PREFERIRIAS.map(([a, b], i) => ({ id: `pr${i}`, texto: `${a}|${b}` }));
  const { actual, otra } = useMazo("preferirias", cartas);
  const [a, b] = (actual?.texto || "|").split("|");
  const col = "#8e6fb0";
  return (
    <div>
      <Volver onClick={onVolver}/>
      <div style={{ fontSize: 20, fontWeight: 700, color: C.cafe, textAlign: "center", marginBottom: 14 }}>¿Qué preferirías?</div>
      {actual ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, animation: "fadeUp .35s ease" }} key={actual.id}>
          <div style={{ background: col, color: "#fff", borderRadius: 18, padding: "22px 18px", fontSize: 18, textAlign: "center" }}>{a}</div>
          <div style={{ textAlign: "center", fontSize: 13, fontWeight: 800, color: col, letterSpacing: ".12em" }}>O</div>
          <div style={{ background: "#fff", color: col, border: `2px solid ${col}`, borderRadius: 18, padding: "22px 18px", fontSize: 18, textAlign: "center" }}>{b}</div>
          <div style={{ fontSize: 12, color: C.suave, textAlign: "center" }}>Los dos eligen a la cuenta de tres. ¿Coincidieron?</div>
        </div>
      ) : <Carta color={col}>Dos opciones, una sola respuesta</Carta>}
      <Boton color={col} style={{ width: "100%", marginTop: 14 }} onClick={otra}>{actual ? "Otra →" : "Empezar"}</Boton>
    </div>
  );
}

export function Quiz({ onVolver }: { onVolver: () => void }) {
  const cartas = conId(QUIZ, "q");
  const { actual, otra } = useMazo("quiz", cartas);
  const [n, setN] = useState(0);
  const [puntos, setPuntos] = useState([0, 0]);
  const quien = n % 2;                          // quién adivina en esta ronda
  const col = "#5b8fb9";
  const anotar = (bien: boolean) => { if (bien) setPuntos(p => quien === 0 ? [p[0] + 1, p[1]] : [p[0], p[1] + 1]); setN(x => x + 1); otra(); };
  return (
    <div>
      <Volver onClick={onVolver}/>
      <div style={{ fontSize: 20, fontWeight: 700, color: C.cafe, textAlign: "center" }}>¿Cuánto me conoces?</div>
      <div style={{ fontSize: 12, color: C.suave, textAlign: "center", margin: "4px 0 14px", lineHeight: 1.4 }}>
        Uno anota su respuesta en secreto; el otro trata de adivinarla. Después se cambian.
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 18, fontSize: 13, color: C.cafe, marginBottom: 12 }}>
        <span style={{ fontWeight: quien === 0 ? 800 : 400 }}>Jugador 1: {puntos[0]}</span><span style={{ fontWeight: quien === 1 ? 800 : 400 }}>Jugador 2: {puntos[1]}</span>
      </div>
      {actual ? <Carta color={col} chico={`Adivina el jugador ${quien + 1}`}>{actual.texto}</Carta> : <Carta color={col}>¿Quién conoce más al otro?</Carta>}
      {actual ? (
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <Boton color="#4f8a5b" style={{ flex: 1 }} onClick={() => anotar(true)}>✓ Acertó</Boton>
          <Boton color={col} claro style={{ flex: 1 }} onClick={() => anotar(false)}>✗ No le achuntó</Boton>
        </div>
      ) : <Boton color={col} style={{ width: "100%", marginTop: 14 }} onClick={otra}>Empezar</Boton>}
    </div>
  );
}

export function Dados({ onVolver }: { onVolver: () => void }) {
  const [nivel, setNivel] = useState<keyof typeof DADOS>("suave");
  const [tiro, setTiro] = useState<[string, string] | null>(null);
  const [girando, setGirando] = useState(false);
  const col = { suave: "#c76b8a", caliente: "#c0394f", picante: "#7a1534" }[nivel];
  const tirar = () => {
    setGirando(true);
    const d = DADOS[nivel];
    let k = 0;
    const id = setInterval(() => {
      setTiro([d.acciones[Math.floor(Math.random() * d.acciones.length)], d.lugares[Math.floor(Math.random() * d.lugares.length)]]);
      if (++k > 9) { clearInterval(id); setGirando(false); }
    }, 80);
  };
  return (
    <div>
      <Volver onClick={onVolver}/>
      <div style={{ fontSize: 20, fontWeight: 700, color: C.cafe, textAlign: "center", marginBottom: 12 }}>Dados del amor 🎲</div>
      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 14 }}>
        {(Object.keys(DADOS) as (keyof typeof DADOS)[]).map(n => (
          <button key={n} onClick={() => { setNivel(n); setTiro(null); }} style={{ fontFamily: "inherit", cursor: "pointer", borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 700,
            background: n === nivel ? col : "#fff", color: n === nivel ? "#fff" : C.cafe, border: `1.5px solid ${col}66`, textTransform: "capitalize" }}>{n}</button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        {[0, 1].map(i => (
          <div key={i} style={{ flex: 1, aspectRatio: "1", background: "#fff", border: `2px solid ${col}55`, borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center",
            textAlign: "center", padding: 10, fontSize: 17, fontWeight: 700, color: col, boxShadow: `0 8px 22px ${col}25`, transform: girando ? `rotate(${i ? -6 : 6}deg)` : "none", transition: "transform .08s" }}>
            {tiro ? tiro[i] : (i ? "¿dónde?" : "¿qué?")}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: C.suave, textAlign: "center", marginTop: 10 }}>Durante 30 segundos. Después le toca a tu pareja.</div>
      <Boton color={col} style={{ width: "100%", marginTop: 14 }} onClick={tirar} disabled={girando}>Tirar los dados</Boton>
    </div>
  );
}
