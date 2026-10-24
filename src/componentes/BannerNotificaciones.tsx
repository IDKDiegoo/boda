import React, { useState, useEffect } from "react";
import { app, initFCM } from "../base/firebase";
import { Card } from "../ui/base";

// ════════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════════
export function BannerNotificaciones() {
  const [estado, setEstado] = React.useState<"idle"|"cargando"|"listo"|"negado">("idle");
  const esPWA = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;

  React.useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") setEstado("listo");
    if (Notification.permission === "denied")  setEstado("negado");
  }, []);

  if (estado === "listo") return null;

  const activar = async () => {
    if (!esPWA) return;
    setEstado("cargando");
    await initFCM();
    const perm = ("Notification" in window) ? Notification.permission : "denied";
    setEstado(perm === "granted" ? "listo" : "negado");
  };

  if (!esPWA) return (
    <Card style={{border:"1px solid #c9956a",background:"#fdf0e8"}}>
      <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
        <span style={{fontSize:22,flexShrink:0}}>📲</span>
        <div>
          <div style={{fontSize:12,fontWeight:700,color:"#c9956a",marginBottom:4}}>Instala la app para activar notificaciones</div>
          <div style={{fontSize:11,color:"#a07855",lineHeight:1.6}}>En Safari: toca <strong>Compartir →</strong> luego <strong>"Añadir a pantalla de inicio"</strong> y abre la app desde el ícono.</div>
        </div>
      </div>
    </Card>
  );

  if (estado === "negado") return (
    <Card style={{border:"1px solid #f87171",background:"#fef2f2"}}>
      <div style={{fontSize:11,color:"#e8544a"}}>❌ Notificaciones bloqueadas. Ve a Configuración → Safari para activarlas.</div>
    </Card>
  );

  return (
    <button onClick={activar} disabled={estado==="cargando"}
      style={{width:"100%",background:"linear-gradient(135deg,#c9956a,#a07040)",border:"none",borderRadius:14,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",fontFamily:"inherit",opacity:estado==="cargando"?0.7:1,marginBottom:4}}>
      <span style={{fontSize:22}}>🔔</span>
      <div style={{textAlign:"left"}}>
        <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>Activar notificaciones</div>
        <div style={{fontSize:10,color:"#fde8d0",marginTop:2}}>Recibe avisos sobre tareas urgentes de la boda</div>
      </div>
    </button>
  );
}
