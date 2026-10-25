import { LEGADO, bodaActual } from "../base/firebase";
import { Card, Title } from "../ui/base";

// ════════════════════════════════════════════════════════════════
// QR INVITADOS
// ════════════════════════════════════════════════════════════════
export function QRInvitados() {
  const url = window.location.origin + "?fotos=1" + (bodaActual() && bodaActual()!==LEGADO ? `&b=${bodaActual()}` : "");
  return (
    <div style={{ animation:"fadeUp .3s ease" }}>
      <Title icon="📱" title="QR para invitados"/>
      <Card style={{ textAlign:"center" }}>
        <div style={{ fontSize:13, color:"#a07855", marginBottom:16 }}>Muestra este QR en la boda para que los invitados suban fotos</div>
        <div style={{ background:"#fff", border:"8px solid #f5e8dc", borderRadius:16, padding:20, display:"inline-block", marginBottom:16 }}>
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=5c3d2e`} alt="QR" style={{ width:200, height:200, display:"block" }}/>
        </div>
        <div style={{ fontSize:12, color:"#a07855", background:"#fdf8f3", padding:12, borderRadius:10, border:"1px solid #f0e0d0" }}>
          Los invitados solo podrán subir fotos. Sin acceso a ninguna otra sección.
        </div>
      </Card>
    </div>
  );
}
