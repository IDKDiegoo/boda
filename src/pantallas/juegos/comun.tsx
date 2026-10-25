import React from "react";

// Lo que comparten los juegos: guardar en el teléfono (ajustes, cartas ya salidas) y piezas de UI.
// 💰 Nada de esto escribe en la base: cada partida vive en el teléfono donde se juega.

export function leerLocal<T>(clave: string, defecto: T): T {
  try { const v = localStorage.getItem("juegos_" + clave); return v ? { ...defecto as any, ...JSON.parse(v) } : defecto; }
  catch { return defecto; }
}
export function leerLista(clave: string): string[] {
  try { const v = localStorage.getItem("juegos_" + clave); return v ? JSON.parse(v) : []; } catch { return []; }
}
export function guardarLocal(clave: string, valor: unknown) {
  try { localStorage.setItem("juegos_" + clave, JSON.stringify(valor)); } catch { /* sin espacio o modo privado */ }
}

export const C = {
  cafe: "#5c3d2e", dorado: "#c9956a", suave: "#a07855", crema: "#fdf8f3", borde: "#f0e0d0",
  vino: "#7a2440", vinoOscuro: "#3d0f20", rosa: "#e8a0b4",
};

export function Volver({ onClick, texto = "← Juegos" }: { onClick: () => void; texto?: string }) {
  return <button onClick={onClick} style={{ background: "none", border: "none", color: C.suave, fontSize: 13, cursor: "pointer", fontFamily: "inherit", padding: "4px 0", marginBottom: 12 }}>{texto}</button>;
}

/** Tarjeta grande del menú, con color propio. */
export function TarjetaJuego({ titulo, desc, icono, color, onClick, etiqueta }: { titulo: string; desc: string; icono: string; color: string; onClick: () => void; etiqueta?: string }) {
  return (
    <button onClick={onClick} style={{ width: "100%", textAlign: "left", border: "none", cursor: "pointer", fontFamily: "inherit",
      background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: "#fff", borderRadius: 18, padding: "18px 18px",
      display: "flex", alignItems: "center", gap: 14, boxShadow: `0 6px 18px ${color}40` }}>
      <span style={{ fontSize: 34, flexShrink: 0 }}>{icono}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 17, fontWeight: 700 }}>{titulo}</span>
          {etiqueta && <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".06em", background: "rgba(255,255,255,.22)", borderRadius: 20, padding: "2px 7px" }}>{etiqueta}</span>}
        </span>
        <span style={{ display: "block", fontSize: 12, opacity: .9, marginTop: 3, lineHeight: 1.35 }}>{desc}</span>
      </span>
    </button>
  );
}

/** La carta que se da vuelta con el texto del turno. */
export function Carta({ children, color = C.dorado, chico }: { children: React.ReactNode; color?: string; chico?: string }) {
  return (
    <div key={String(children)} style={{ background: "#fff", borderRadius: 20, padding: "28px 22px", minHeight: 180, display: "flex",
      flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", border: `2px solid ${color}55`,
      boxShadow: `0 10px 30px ${color}30`, animation: "fadeUp .35s ease" }}>
      {chico && <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".14em", color, marginBottom: 12, textTransform: "uppercase" }}>{chico}</div>}
      <div style={{ fontSize: 19, lineHeight: 1.45, color: C.cafe }}>{children}</div>
    </div>
  );
}

export function Boton({ children, onClick, color = C.dorado, claro, style, disabled }: { children: React.ReactNode; onClick?: () => void; color?: string; claro?: boolean; style?: React.CSSProperties; disabled?: boolean }) {
  return <button disabled={disabled} onClick={onClick} style={{ background: claro ? "#fff" : color, color: claro ? color : "#fff", border: `2px solid ${color}`,
    borderRadius: 14, padding: "13px 16px", fontSize: 14, fontWeight: 700, cursor: disabled ? "default" : "pointer", fontFamily: "inherit",
    opacity: disabled ? .5 : 1, ...style }}>{children}</button>;
}
