import React from "react";
import { initFCM } from "../base/firebase";
import { Card } from "../ui/base";
import { Icono } from "../ui/iconos";

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

  // Las instrucciones de «Añadir a pantalla de inicio» son del iPhone: en el computador no se muestran.
  const esIphone = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (!esPWA && !esIphone) return null;
  if (!esPWA) return (
    <Card style={{border:"1px solid #ecd3bd",background:"linear-gradient(135deg,#fdf3ea,#fbe9dc)",marginBottom:16}}>
      <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
        <span style={{width:36,height:36,borderRadius:11,background:"#fff",display:"grid",placeItems:"center",color:"#a87447",flexShrink:0}}><Icono n="campana" tam={19}/></span>
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
      <span style={{width:36,height:36,borderRadius:11,background:"rgba(255,255,255,.2)",display:"grid",placeItems:"center",color:"#fff",flexShrink:0}}><Icono n="campana" tam={19}/></span>
      <div style={{textAlign:"left"}}>
        <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>Activar notificaciones</div>
        <div style={{fontSize:10,color:"#fde8d0",marginTop:2}}>Recibe avisos sobre tareas urgentes de la boda</div>
      </div>
    </button>
  );
}
