import { useState } from "react";
import { C, TarjetaJuego } from "./comun";
import { MIMICA, MISIONES_MESA } from "./contenido";
import { Bingo, CazaFotos, Impostor, Mazo, Trivia } from "./Fiesta";
import { Dados, Packs, Preferirias, Quiz } from "./Pareja";
import { VerdadReto } from "./VerdadReto";

// ═══════════════════════════════════════════════════════════════════
// JUEGOS (24-oct-2026): para la fiesta (en grupo) y en pareja.
// ═══════════════════════════════════════════════════════════════════
type Juego = "" | "verdadreto" | "packs" | "preferirias" | "quiz" | "dados" | "impostor" | "misiones" | "mimica" | "bingo" | "caza" | "trivia";

export function Juegos() {
  const [vista, setVista] = useState<"pareja" | "fiesta">("pareja");
  const [juego, setJuego] = useState<Juego>("");
  const volver = () => setJuego("");

  if (juego === "verdadreto") return <VerdadReto onVolver={volver}/>;
  if (juego === "packs") return <Packs onVolver={volver}/>;
  if (juego === "preferirias") return <Preferirias onVolver={volver}/>;
  if (juego === "quiz") return <Quiz onVolver={volver}/>;
  if (juego === "dados") return <Dados onVolver={volver}/>;
  if (juego === "impostor") return <Impostor onVolver={volver}/>;
  if (juego === "misiones") return <Mazo titulo="Misiones por mesa 🎯" desc="Cada mesa saca una misión y la tiene que cumplir antes de que termine la cena." cartas={MISIONES_MESA} clave="misiones" color="#c9956a" onVolver={volver}/>;
  if (juego === "mimica") return <Mazo titulo="Mímica 🎭" desc="Actúa sin hablar. Tu equipo tiene 60 segundos para adivinar." cartas={MIMICA} clave="mimica" color="#8e6fb0" reloj={60} onVolver={volver}/>;
  if (juego === "bingo") return <Bingo onVolver={volver}/>;
  if (juego === "caza") return <CazaFotos onVolver={volver}/>;
  if (juego === "trivia") return <Trivia onVolver={volver}/>;

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, color: C.cafe, textAlign: "center", marginBottom: 14 }}>Juegos</div>
      <div style={{ display: "flex", background: "#fff", border: `1px solid ${C.borde}`, borderRadius: 14, padding: 4, marginBottom: 16 }}>
        {([["pareja", "💞 En pareja"], ["fiesta", "🎉 Para la fiesta"]] as const).map(([id, l]) => (
          <button key={id} onClick={() => setVista(id)} style={{ flex: 1, border: "none", borderRadius: 11, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            background: vista === id ? C.dorado : "transparent", color: vista === id ? "#fff" : C.suave }}>{l}</button>
        ))}
      </div>
      {vista === "pareja" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <TarjetaJuego titulo="Verdad o reto" desc="5 niveles, de suave a sin filtro. Si no cumples, tomas." icono="🔥" color={C.vino} etiqueta="+18" onClick={() => setJuego("verdadreto")}/>
          <TarjetaJuego titulo="Para conocerse" desc="Packs de preguntas: acercándonos, vida y sueños, tierno y tonto, temas difíciles" icono="💬" color="#5b8fb9" onClick={() => setJuego("packs")}/>
          <TarjetaJuego titulo="¿Qué preferirías?" desc="Dilemas para elegir a la cuenta de tres" icono="🤔" color="#8e6fb0" onClick={() => setJuego("preferirias")}/>
          <TarjetaJuego titulo="¿Cuánto me conoces?" desc="Uno responde en secreto, el otro adivina. Gana quien suma más" icono="🧠" color="#7a9e7e" onClick={() => setJuego("quiz")}/>
          <TarjetaJuego titulo="Dados del amor" desc="Un dado de acción y otro de lugar" icono="🎲" color="#c0394f" onClick={() => setJuego("dados")}/>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <TarjetaJuego titulo="El impostor" desc="Todos tienen la palabra menos uno. ¿Quién miente?" icono="🕵️" color="#5c3d2e" onClick={() => setJuego("impostor")}/>
          <TarjetaJuego titulo="Misiones por mesa" desc="Una misión secreta para cada mesa durante la cena" icono="🎯" color="#c9956a" onClick={() => setJuego("misiones")}/>
          <TarjetaJuego titulo="Bingo de la boda" desc="«La novia llora», «alguien bota una copa»… con cartones para imprimir" icono="🎟️" color="#b07d5b" onClick={() => setJuego("bingo")}/>
          <TarjetaJuego titulo="Trivia de los novios" desc="Ustedes escriben las preguntas; las mesas compiten" icono="❓" color="#7a9e7e" onClick={() => setJuego("trivia")}/>
          <TarjetaJuego titulo="Mímica" desc="Actuar sin hablar, con reloj de 60 segundos" icono="🎭" color="#8e6fb0" onClick={() => setJuego("mimica")}/>
          <TarjetaJuego titulo="Caza de fotos" desc="Misiones para que los invitados saquen fotos y las suban con el QR" icono="📸" color="#5b8fb9" onClick={() => setJuego("caza")}/>
        </div>
      )}
    </div>
  );
}
