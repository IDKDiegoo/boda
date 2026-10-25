import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { MARCA, correoDe } from "../base/config";
import { auth, initFCM } from "../base/firebase";
import { Btn, Card, Inp, S } from "../ui/base";

// ════════════════════════════════════════════════════════════════
// LOGIN — usuario y contraseña (como en el SaaS de ARAIN)
// La cuenta decide a qué boda entra (o al panel, si es superadmin): lo revisan Firebase y las
// reglas de la base, no la página.
// ════════════════════════════════════════════════════════════════
export function PantallaLogin({ onEntrar }: { onEntrar:()=>void }) {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [err, setErr] = useState("");
  const [entrando, setEntrando] = useState(false);
  const intentar = async () => {
    if (!usuario.trim() || !clave || entrando) return;
    setEntrando(true); setErr("");
    try {
      await signInWithEmailAndPassword(auth, correoDe(usuario), clave);
      onEntrar();
      initFCM();
    } catch (e:any) {
      setErr(e?.code === "auth/too-many-requests" ? "Demasiados intentos. Espera un rato y vuelve a probar."
           : e?.code === "auth/user-disabled" ? "Esta cuenta está suspendida. Escríbenos para reactivarla."
           : "Usuario o contraseña incorrectos");
      setClave("");
    } finally { setEntrando(false); }
  };
  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#fff5ee 0%,#fde8d8 50%,#f8d5c2 100%)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
      <S/>
      <img src="/mywedding-logo.jpg" alt={MARCA} style={{ width:"min(300px, 80vw)", height:"auto", borderRadius:24, mixBlendMode:"multiply", animation:"fadeUp .6s ease" }}/>
      <div style={{ fontSize:13, color:"#a07855", letterSpacing:".04em", margin:"4px 0 26px", textAlign:"center", animation:"fadeUp .7s ease" }}>Organiza tu boda, de la invitación a la fiesta</div>
      <Card style={{ width:"100%", maxWidth:340, animation:"fadeUp .7s ease" }}>
        <form onSubmit={e=>{ e.preventDefault(); intentar(); }} style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <Inp value={usuario} onChange={v=>{setUsuario(v);setErr("");}} placeholder="Usuario"/>
          <Inp value={clave} onChange={v=>{setClave(v);setErr("");}} placeholder="Contraseña" type="password"/>
          {err && <div style={{ color:"#e07070", fontSize:12, textAlign:"center" }}>{err}</div>}
          <Btn style={{ width:"100%", marginTop:4 }}>{entrando ? "Entrando…" : "Entrar →"}</Btn>
        </form>
      </Card>
    </div>
  );
}
