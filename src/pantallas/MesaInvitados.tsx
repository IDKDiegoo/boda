import { Suspense, lazy, useState } from "react";
import { Cargando, Logo, S } from "../ui/base";
import { CartaGiro, EstilosJuego, IconoJuego, TarjetaJuego, Boton, confeti, guardarLocal, leerLista, vibrar } from "./juegos/comun";
import { MISIONES_MESA } from "./juegos/contenido";
import { EntrarConCodigo, JUEGOS_SALA, NuevaSala, SalaJuego } from "./juegos/EnGrupo";
import { JuegoSala } from "./juegos/sala";

const Bingo = lazy(() => import("./juegos/Fiesta").then(m => ({ default: m.Bingo })));
const CazaFotos = lazy(() => import("./juegos/Fiesta").then(m => ({ default: m.CazaFotos })));
const Fotos = lazy(() => import("./Fotos").then(m => ({ default: m.Fotos })));

// ═══════════════════════════════════════════════════════════════════
// QR DE LA MESA (30-oct-2026): cada mesa tiene su QR. Sin cuenta, el invitado elige:
// la misión de su mesa, su cartón de bingo, la caza de fotos o un juego en grupo.
// ═══════════════════════════════════════════════════════════════════

/** La misión de cada mesa es fija (todos los de la mesa ven la misma); se puede pedir otra. */
const misionDe = (mesa: number, salto: number) => MISIONES_MESA[((mesa - 1) * 7 + salto) % MISIONES_MESA.length];

type Vista = "" | "mision" | "bingo" | "caza" | "codigo" | `nueva-${JuegoSala}`;

export function MesaInvitados({ mesa }: { mesa: number }) {
  const [vista, setVista] = useState<Vista>("");
  const [sala, setSala] = useState(() => (new URLSearchParams(window.location.search).get("sala") || "").toUpperCase().slice(0, 5));
  const volver = () => { setVista(""); window.scrollTo({ top: 0 }); };
  const abrirSala = (c: string) => { setSala(c); window.history.replaceState(null, "", `${window.location.pathname}${window.location.search.replace(/([?&])sala=[^&]*/, "")}${window.location.search ? "&" : "?"}sala=${c}`); };
  const cerrarSala = () => { setSala(""); setVista(""); window.history.replaceState(null, "", window.location.pathname + window.location.search.replace(/[?&]sala=[^&]*/, "").replace(/^&/, "?")); };

  let cuerpo: React.ReactNode;
  if (sala) cuerpo = <SalaJuego codigo={sala} onSalir={cerrarSala}/>;
  else if (vista === "mision") cuerpo = <Mision mesa={mesa} onVolver={volver}/>;
  else if (vista === "bingo") cuerpo = <Bingo onVolver={volver} invitado/>;
  else if (vista === "caza") cuerpo = <CazaFotos onVolver={volver} pie={<div style={{ marginTop: 16, background: "#fffdfb", borderRadius: 22, padding: 4, color: "#5c3d2e" }}><Fotos esAdmin={false}/></div>}/>;
  else if (vista === "codigo") cuerpo = <EntrarConCodigo onEntrar={abrirSala} onVolver={volver}/>;
  else if (vista.startsWith("nueva-")) cuerpo = <NuevaSala juego={vista.slice(6) as JuegoSala} mesa={mesa} onLista={abrirSala} onVolver={volver}/>;
  else cuerpo = (
    <div>
      <EstilosJuego/>
      <div style={{ position: "relative", overflow: "hidden", borderRadius: 26, padding: "22px 20px", marginBottom: 16, color: "#fff",
        background: "radial-gradient(120% 120% at 0% 0%, #c47a8e 0%, #6b2c48 55%, #2c1424 100%)", boxShadow: "0 20px 40px -22px #2c1424" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ width: 58, height: 58, borderRadius: 18, background: "rgba(255,255,255,.16)", border: "1px solid rgba(255,255,255,.25)", display: "grid", placeItems: "center", fontFamily: "var(--titulo)", fontSize: 30, fontWeight: 700 }}>{mesa}</span>
          <div>
            <div style={{ fontSize: 11, letterSpacing: ".22em", textTransform: "uppercase", opacity: .8 }}>Bienvenidos a la</div>
            <div style={{ fontFamily: "var(--titulo)", fontSize: 32, fontWeight: 600, lineHeight: 1 }}>Mesa {mesa}</div>
          </div>
        </div>
        <div style={{ fontSize: 13, opacity: .85, marginTop: 12, lineHeight: 1.5 }}>Elige a qué quieres jugar. No necesitas cuenta ni descargar nada.</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 330px), 1fr))", gap: 12 }}>
        <TarjetaJuego indice={0} titulo={`La misión de la mesa ${mesa}`} desc="Una misión secreta para cumplir antes de que termine la cena" icono="diana" color="#c08552" onClick={() => setVista("mision")}/>
        <TarjetaJuego indice={1} titulo="Bingo de la boda" desc="Tu cartón: marca lo que va pasando. Línea completa gana" icono="ticket" color="#b5655a" onClick={() => setVista("bingo")}/>
        <TarjetaJuego indice={2} titulo="Caza de fotos" desc="Misiones para sacar fotos, y las subes al tiro desde acá" icono="camara" color="#4f7fae" onClick={() => setVista("caza")}/>
      </div>
      <div style={{ fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase", color: "#a07855", margin: "22px 4px 10px" }}>Juegos en grupo · cada uno con su teléfono</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 330px), 1fr))", gap: 12 }}>
        <TarjetaJuego indice={3} titulo="Unirme a una partida" desc="Alguien ya abrió un juego: escanea su QR o escribe el código" icono="qr" color="#8a4f6e" onClick={() => setVista("codigo")}/>
        {(Object.keys(JUEGOS_SALA) as JuegoSala[]).map((j, k) => { const m = JUEGOS_SALA[j]; return (
          <TarjetaJuego key={j} indice={4 + k} titulo={m.t} desc={m.desc} icono={m.icono} color={m.color} etiqueta="QR" onClick={() => setVista(`nueva-${j}`)}/>); })}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#fff5ee,#fde8d8)", padding: "16px 16px 40px" }}>
      <S/>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <Logo tam={34}/><div style={{ fontFamily: "var(--titulo)", fontSize: 21, fontWeight: 600, color: "#3b2a21" }}>My Wedding</div>
        </div>
        <Suspense fallback={<Cargando/>}>{cuerpo}</Suspense>
      </div>
    </div>
  );
}

function Mision({ mesa, onVolver }: { mesa: number; onVolver: () => void }) {
  const clave = `mision_mesa_${mesa}`;
  const [salto, setSalto] = useState(() => Number(leerLista(clave)[0] || 0));
  const [volteada, setVolteada] = useState(false);
  const [hecha, setHecha] = useState(() => leerLista(clave)[1] === "1");
  const guardar = (s: number, h: boolean) => guardarLocal(clave, [String(s), h ? "1" : "0"]);
  const otra = () => { vibrar(10); setVolteada(false); setHecha(false); setTimeout(() => { const s = salto + 1; setSalto(s); guardar(s, false); setVolteada(true); }, 260); };
  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 28, padding: "18px 16px 22px", color: "#fff", background: "radial-gradient(130% 90% at 0% 0%, #c08552 0%, #3a1f0f 75%)" }}>
      <EstilosJuego/>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <button onClick={onVolver} aria-label="Volver" style={{ width: 40, height: 40, borderRadius: 14, display: "grid", placeItems: "center", cursor: "pointer", background: "rgba(255,255,255,.14)", border: "1px solid rgba(255,255,255,.22)", color: "#fff" }}><IconoJuego n="volver" tam={19}/></button>
        <div style={{ fontFamily: "var(--titulo)", fontSize: 24, fontWeight: 600 }}>Misión de la mesa {mesa}</div>
      </div>
      <div style={{ fontSize: 13.5, opacity: .85, marginBottom: 16, lineHeight: 1.5 }}>Todos los de la mesa ven la misma misión. Cúmplanla antes de que termine la cena.</div>
      <CartaGiro volteada={volteada} color="#c08552" icono="diana" etiqueta={`Mesa ${mesa}`} alto={280} onToque={!volteada ? () => { vibrar(14); setVolteada(true); } : undefined}>{misionDe(mesa, salto)}</CartaGiro>
      {volteada && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
        <Boton color="rgba(255,255,255,.18)" onClick={otra}><IconoJuego n="barajar" tam={17}/>Otra misión</Boton>
        <Boton color="#ffffff" claro style={{ color: "#8a5a32" }} disabled={hecha} onClick={() => { setHecha(true); guardar(salto, true); confeti(); vibrar([30, 40, 30]); }}><IconoJuego n="check" tam={17} grosor={2.4}/>{hecha ? "¡Cumplida!" : "La cumplimos"}</Boton>
      </div>}
      {!volteada && <Boton color="#ffffff" claro style={{ width: "100%", marginTop: 16, color: "#8a5a32" }} onClick={() => { vibrar(14); setVolteada(true); }}>Ver la misión</Boton>}
    </div>
  );
}
