import { useEffect, useState } from "react";
import { EstadoGuardado, estadoGuardado, oirGuardado } from "../base/guardar";

/** Franja arriba cuando no hay señal: lo escrito queda en pantalla y se guarda solo al volver. */
export function AvisoGuardado() {
  const [e, setE] = useState<EstadoGuardado>(estadoGuardado());
  const [lento, setLento] = useState(false);
  useEffect(() => oirGuardado(setE), []);
  // «Guardando…» solo si tarda (un guardado normal no debe parpadear en pantalla).
  useEffect(() => { if (e !== "guardando") { setLento(false); return; } const t = setTimeout(() => setLento(true), 4000); return () => clearTimeout(t); }, [e]);
  if (e === "ok" || (e === "guardando" && !lento)) return null;
  const sin = e === "sin-conexion";
  return (
    <div role="status" style={{ position: "fixed", left: 12, right: 12, top: "calc(10px + env(safe-area-inset-top, 0px))", zIndex: 400, maxWidth: 520, margin: "0 auto",
      display: "flex", alignItems: "center", gap: 10, background: sin ? "#5c3d2e" : "#fff", color: sin ? "#fff" : "#5c3d2e",
      border: "1px solid #e8d5c4", borderRadius: 14, padding: "10px 14px", fontSize: 13, fontWeight: 600, boxShadow: "0 10px 30px -12px rgba(0,0,0,.4)", pointerEvents: "none" }}>
      <span style={{ width: 9, height: 9, borderRadius: "50%", flexShrink: 0, background: sin ? "#fbbf24" : "#c9a96e" }}/>
      {sin ? "Sin señal. Lo que escribiste queda acá y se guarda solo cuando vuelva." : "Guardando tus cambios…"}
    </div>
  );
}
