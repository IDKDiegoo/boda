import { Boton, vibrar } from "./comun";
import { JuegoSala, Sala, cambiar } from "./sala";

// Piezas que comparten todos los juegos en grupo (salas con QR).
export type Meta = { t: string; color: string; oscuro: string; icono: string; min: number; desc: string; cfg: any };
export type PropsJuego = { sala: Sala; yo: string; host: boolean; meta: Meta; onSalir: () => void };
export type { JuegoSala };

const PALETA = ["#6f6bd8", "#e0455f", "#3f9a6e", "#d08a3c", "#3c8ed0", "#b05fb5", "#c4605a", "#4aa3a0"];
const colorDe = (n: string) => PALETA[String(n).split("").reduce((a, c) => a + c.charCodeAt(0), 0) % PALETA.length];
export const Avatar = ({ n, tam = 44, style }: { n: string; tam?: number; style?: React.CSSProperties }) =>
  <span style={{ width: tam, height: tam, borderRadius: "50%", display: "grid", placeItems: "center", fontWeight: 700, fontSize: tam * .4, color: "#fff", background: colorDe(n), flexShrink: 0, ...style }}>{(String(n).trim()[0] || "?").toUpperCase()}</span>;
export const Rotulo = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) =>
  <div style={{ fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase", opacity: .72, marginBottom: 8, ...style }}>{children}</div>;
export const Pildora = ({ children, on, onClick, color }: { children: React.ReactNode; on: boolean; onClick: () => void; color: string }) =>
  <button onClick={() => { vibrar(6); onClick(); }} style={{ cursor: "pointer", borderRadius: 20, padding: "8px 13px", fontSize: 13, fontWeight: 600,
    background: on ? "#fff" : "rgba(255,255,255,.08)", color: on ? color : "#fff", border: "1px solid rgba(255,255,255,.22)" }}>{children}</button>;
export const Panel = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) =>
  <div style={{ background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.18)", borderRadius: 20, padding: 14, ...style }}>{children}</div>;
export const VACIO: any = {};   // referencia fija para cuando la sala aún no tiene ronda
export const nombreDe = (s: Sala, pid: string) => s.jug?.[pid]?.n || "Alguien";

/** Barra de abajo del anfitrión: volver a la sala de espera. */
export const VolverSala = ({ sala, host }: { sala: Sala; host: boolean }) => host
  ? <Boton color="rgba(255,255,255,.14)" style={{ width: "100%", marginTop: 10 }} onClick={() => cambiar(sala.id, { est: "lobby", ron: {}, v: {} })}>Volver a la sala de espera</Boton> : null;

