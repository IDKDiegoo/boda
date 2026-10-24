import { useState } from "react";
import { ACCESO_PIN, FOTOS_PIN } from "../base/config";
import { Btn, Card, Inp, S } from "../ui/base";

// ════════════════════════════════════════════════════════════════
// LOGIN
// ════════════════════════════════════════════════════════════════
export function PantallaLogin({ onLogin }: { onLogin:(tipo:"admin"|"fotos")=>void }) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const intentar = () => {
    if (pin === ACCESO_PIN) { onLogin("admin"); return; }
    if (pin.toUpperCase() === FOTOS_PIN) { onLogin("fotos"); return; }
    setErr("Código incorrecto"); setPin("");
  };
  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#fff5ee 0%,#fde8d8 50%,#f8d5c2 100%)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
      <S/>
      <div style={{ animation:"float 3s ease-in-out infinite", marginBottom:24 }}>
        <img src="/pareja.jpg" alt="Boda" style={{ width:100, height:100, borderRadius:"50%", objectFit:"cover", border:"4px solid #c9956a", boxShadow:"0 8px 32px rgba(201,149,106,.3)" }}/>
      </div>
      <div style={{ textAlign:"center", marginBottom:32, animation:"fadeUp .6s ease" }}>
        <div style={{ fontSize:12, letterSpacing:"0.2em", color:"#c9956a", marginBottom:8, textTransform:"uppercase" }}>💍 27 · Noviembre · 2027 💍</div>
        <h1 style={{ fontSize:32, color:"#5c3d2e", fontWeight:400, marginBottom:4 }}>Diego & Camila</h1>
        <div style={{ fontSize:14, color:"#a07855" }}>Nuestra boda</div>
      </div>
      <Card style={{ width:"100%", maxWidth:340, animation:"fadeUp .7s ease" }}>
        <div style={{ fontSize:13, color:"#a07855", marginBottom:16, textAlign:"center" }}>Ingresa tu código de acceso</div>
        <Inp value={pin} onChange={v=>{setPin(v);setErr("");}} placeholder="Código..." type="password"/>
        {err && <div style={{ color:"#e07070", fontSize:12, marginTop:8, textAlign:"center" }}>{err}</div>}
        <Btn onClick={intentar} style={{ width:"100%", marginTop:14 }}>Entrar →</Btn>
        <div style={{ fontSize:11, color:"#c4a882", marginTop:14, textAlign:"center" }}>Invitados: usa el código del QR para subir fotos</div>
      </Card>
    </div>
  );
}
