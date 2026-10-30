import { useState } from "react";
import { BarraJuego, C, Escenario, EstilosJuego, IconoJuego, TarjetaJuego, vibrar } from "./comun";
import { MISIONES_MESA } from "./contenido";
import { Bingo, CazaFotos, Impostor, Mazo, Mimica, Trivia } from "./Fiesta";
import { Dados, Packs, Preferirias, Quiz } from "./Pareja";
import { VerdadReto } from "./VerdadReto";
import { EntrarConCodigo, NuevaSala, SalaJuego } from "./EnGrupo";
import { JuegoSala } from "./sala";

// ═══════════════════════════════════════════════════════════════════
// JUEGOS (v2, 25-oct-2026): para la fiesta (en grupo) y en pareja.
// ═══════════════════════════════════════════════════════════════════
type Juego = "" | "verdadreto" | "packs" | "preferirias" | "quiz" | "dados" | "impostor" | "misiones" | "mimica" | "bingo" | "caza" | "trivia"
  | "codigo" | "modo-impostor" | "futbolero" | `nueva-${JuegoSala}`;

export function Juegos({ adultos = true }: { adultos?: boolean }) {
  const [vista, setVista] = useState<"pareja" | "fiesta">("pareja");
  const [juego, setJuego] = useState<Juego>("");
  const volver = () => { setJuego(""); window.scrollTo({ top: 0 }); };
  const abrir = (j: Juego) => { setJuego(j); window.scrollTo({ top: 0 }); };
  // Sala en grupo: el código queda en la dirección (?sala=) para que al recargar se vuelva a entrar.
  const [sala, setSala] = useState(() => new URLSearchParams(window.location.search).get("sala") || "");
  const abrirSala = (c: string) => { setSala(c); window.history.replaceState(null, "", `?sala=${c}`); window.scrollTo({ top: 0 }); };
  const cerrarSala = () => { setSala(""); setJuego(""); window.history.replaceState(null, "", window.location.pathname); };

  if (sala) return <SalaJuego codigo={sala} onSalir={cerrarSala}/>;
  if (juego === "codigo") return <EntrarConCodigo onEntrar={abrirSala} onVolver={volver}/>;
  if (juego === "futbolero") return <NuevaSala juego="impostor" titulo="Impostor futbolero" cfg={{ modo: "futbol" }} onLista={abrirSala} onVolver={volver}/>;
  if (juego.startsWith("nueva-")) return <NuevaSala juego={juego.slice(6) as JuegoSala} onLista={abrirSala} onVolver={volver}/>;
  if (juego === "modo-impostor") return <ElegirModo onQR={() => abrir("nueva-impostor")} onUno={() => abrir("impostor")} onVolver={volver}/>;

  if (juego === "verdadreto" && adultos) return <VerdadReto onVolver={volver}/>;
  if (juego === "packs") return <Packs onVolver={volver}/>;
  if (juego === "preferirias") return <Preferirias onVolver={volver}/>;
  if (juego === "quiz") return <Quiz onVolver={volver}/>;
  if (juego === "dados") return <Dados onVolver={volver}/>;
  if (juego === "impostor") return <Impostor onVolver={volver}/>;
  if (juego === "misiones") return <Mazo titulo="Misiones por mesa" desc="Cada mesa saca una misión secreta y la tiene que cumplir antes de que termine la cena." cartas={MISIONES_MESA} clave="misiones" color="#c9956a" oscuro="#4a2a17" icono="diana" onVolver={volver}/>;
  if (juego === "mimica") return <Mimica onVolver={volver}/>;
  if (juego === "bingo") return <Bingo onVolver={volver}/>;
  if (juego === "caza") return <CazaFotos onVolver={volver}/>;
  if (juego === "trivia") return <Trivia onVolver={volver}/>;

  const pareja: [Juego, string, string, string, string, string?][] = [
    ...(adultos ? [["verdadreto", "Verdad o reto", "5 niveles, de suave a sin filtro. Si no cumples, tomas.", "fuego", "#a3284b", "+18"] as [Juego, string, string, string, string, string]] : []),
    ["packs", "Para conocerse", "Preguntas por pack: acercándonos, vida y sueños, tierno y tonto, temas difíciles", "charla", "#4f7fae"],
    ["preferirias", "¿Qué preferirías?", "Cada uno elige en secreto. ¿Coincidieron?", "balanza", "#7d5ca8"],
    ["quiz", "¿Cuánto me conoces?", "Uno responde, el otro adivina. Gana quien suma más", "cerebro", "#4f8a6b"],
    ["dados", "Dados del amor", "Tira los dados: una acción y un lugar", "dados", "#c0394f"],
  ];
  const fiesta: [Juego, string, string, string, string, string?][] = [
    ["modo-impostor", "El impostor", "Todos tienen la palabra menos uno. ¿Quién miente? Más de 20 temas", "mascara", "#4a3a6b", "QR"],
    ["futbolero", "Impostor futbolero", "Equipos, cracks, estadios, técnicos, jugadas… pura pelota", "pelota", "#2f7d4f", "QR"],
    ["nueva-mimica", "Mímica por equipos", "Dos equipos; el que actúa ve la palabra en su teléfono", "teatro", "#7d5ca8", "QR"],
    ["nueva-rosco", "Pasapalabra", "El rosco de la A a la Z, general o futbolero, con presentador", "rosco", "#2f6fb0", "QR"],
    ["nueva-probable", "¿Quién es más probable?", "Cada uno vota en secreto en su teléfono", "votar", "#c0394f", "QR"],
    ["mimica", "Mímica en un teléfono", "Estilo Heads Up: acierta todas las que puedas antes del tiempo", "teatro", "#5f4a8a"],
    ["misiones", "Misiones por mesa", "Una misión secreta para cada mesa durante la cena", "diana", "#c08552"],
    ["bingo", "Bingo de la boda", "«La novia llora», «alguien bota una copa»… y cartones para imprimir", "ticket", "#b5655a"],
    ["trivia", "Trivia de los novios", "Ustedes escriben las preguntas; las mesas compiten", "pregunta", "#4f8a6b"],
    ["caza", "Caza de fotos", "Misiones para que los invitados saquen fotos y las suban con el QR", "camara", "#4f7fae"],
  ];
  const lista = vista === "pareja" ? pareja : fiesta;

  return (
    <div>
      <EstilosJuego/>
      {/* Portada */}
      <div style={{ position: "relative", overflow: "hidden", borderRadius: 26, padding: "22px 20px", marginBottom: 16, color: "#fff",
        background: "radial-gradient(120% 120% at 0% 0%, #c47a8e 0%, #6b2c48 55%, #2c1424 100%)", boxShadow: "0 20px 40px -22px #2c1424" }}>
        <div aria-hidden="true" style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", right: -60, top: -70, background: "radial-gradient(circle, rgba(255,214,170,.45), transparent 65%)", animation: "j-flotar 10s ease-in-out infinite" }}/>
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ width: 54, height: 54, borderRadius: 18, background: "rgba(255,255,255,.16)", border: "1px solid rgba(255,255,255,.25)", display: "grid", placeItems: "center" }}><IconoJuego n="dados" tam={28}/></span>
          <div>
            <div style={{ fontFamily: "var(--titulo)", fontSize: 30, fontWeight: 600, lineHeight: 1 }}>Juegos</div>
            <div style={{ fontSize: 12.5, opacity: .85, marginTop: 4 }}>{pareja.length + fiesta.length} juegos para la fiesta y para ustedes dos</div>
          </div>
        </div>
        <div style={{ position: "relative", display: "flex", background: "rgba(0,0,0,.22)", borderRadius: 14, padding: 4, marginTop: 18 }}>
          {([["pareja", "En pareja", "corazones"], ["fiesta", "Para la fiesta", "copa"]] as const).map(([id, l, ic]) => { const on = vista === id; return (
            <button key={id} onClick={() => { vibrar(6); setVista(id); }} style={{ flex: 1, border: "none", borderRadius: 11, padding: "10px 6px", fontSize: 13.5, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: on ? "#fff" : "transparent", color: on ? "#6b2c48" : "rgba(255,255,255,.85)", transition: "all .25s ease" }}>
              <IconoJuego n={ic} tam={17}/>{l}</button>); })}
        </div>
      </div>
      {vista === "fiesta" && (
        <button onClick={() => abrir("codigo")} className="j-tile" style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, marginBottom: 12, cursor: "pointer", textAlign: "left",
          background: "#fffdfb", border: "1.5px dashed #d9b9a0", borderRadius: 18, padding: "12px 14px", color: "#5c3d2e" }}>
          <span style={{ width: 42, height: 42, borderRadius: 14, background: "#f7e6d7", display: "grid", placeItems: "center", color: "#8a4f6e" }}><IconoJuego n="qr" tam={22}/></span>
          <span style={{ flex: 1 }}><b style={{ fontSize: 15 }}>Unirme a una partida</b><span style={{ display: "block", fontSize: 12.5, color: C.suave }}>Alguien ya abrió un juego: escribe su código</span></span>
        </button>)}
      <div key={vista} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 330px), 1fr))", gap: 12 }}>
        {lista.map(([id, t, d, ic, col, et], k) => <TarjetaJuego key={id} indice={k} titulo={t} desc={d} icono={ic} color={col} etiqueta={et} onClick={() => abrir(id)}/>)}
      </div>
      <div style={{ fontSize: 11.5, color: C.suave, textAlign: "center", marginTop: 16, lineHeight: 1.5 }}>{vista === "fiesta"
        ? "Los juegos con QR se juegan cada uno en su teléfono: abres el juego y los demás escanean. En «QR para invitados» está el QR de cada mesa."
        : "Se juega con un solo teléfono. Nada de lo que pase en los juegos se guarda en la base."}</div>
    </div>
  );
}

/** El impostor: con QR (cada uno en su teléfono) o pasando un solo teléfono. */
function ElegirModo({ onQR, onUno, onVolver }: { onQR: () => void; onUno: () => void; onVolver: () => void }) {
  const op = (icono: string, titulo: string, desc: string, onClick: () => void, rec?: boolean) => (
    <button onClick={() => { vibrar(8); onClick(); }} className="j-tile j-entrar" style={{ width: "100%", textAlign: "left", cursor: "pointer", display: "flex", gap: 14, alignItems: "center",
      background: rec ? "#fff" : "rgba(255,255,255,.1)", color: rec ? "#4a3a6b" : "#fff", border: rec ? "none" : "1px solid rgba(255,255,255,.22)", borderRadius: 22, padding: "18px 16px" }}>
      <span style={{ width: 50, height: 50, borderRadius: 16, display: "grid", placeItems: "center", background: rec ? "#efe9fa" : "rgba(255,255,255,.14)", flexShrink: 0 }}><IconoJuego n={icono} tam={26}/></span>
      <span><b style={{ fontSize: 16.5 }}>{titulo}</b>{rec && <span style={{ marginLeft: 8, fontSize: 10.5, fontWeight: 700, letterSpacing: ".12em", background: "#4a3a6b", color: "#fff", borderRadius: 20, padding: "2px 8px" }}>RECOMENDADO</span>}
        <span style={{ display: "block", fontSize: 13, opacity: .8, marginTop: 3, lineHeight: 1.4 }}>{desc}</span></span>
    </button>);
  return (
    <Escenario color="#6b55a0" oscuro="#151024">
      <BarraJuego titulo="El impostor" onVolver={onVolver}/>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {op("qr", "Cada uno con su teléfono", "Muestras un QR, todos se unen y cada uno ve su palabra y vota en su pantalla.", onQR, true)}
        {op("usuario", "Un solo teléfono", "Se va pasando el teléfono para ver la palabra, como antes.", onUno)}
      </div>
    </Escenario>
  );
}
