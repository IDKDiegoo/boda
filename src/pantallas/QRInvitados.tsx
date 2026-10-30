import { useState } from "react";
import { LEGADO, bodaActual, infoBoda } from "../base/firebase";
import { useData } from "../base/hooks";
import { MesaPos } from "../tipos";
import { Btn, Card, Title } from "../ui/base";

// ════════════════════════════════════════════════════════════════
// QR INVITADOS: el de las fotos (uno para todos) y uno por mesa (misión, bingo, fotos y juegos).
// ════════════════════════════════════════════════════════════════
const qr = (url: string, tam = 220) => `https://api.qrserver.com/v1/create-qr-code/?size=${tam}x${tam}&margin=0&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=5c3d2e`;
const conBoda = () => (bodaActual() && bodaActual() !== LEGADO ? `&b=${bodaActual()}` : "");
const urlMesa = (n: number) => `${window.location.origin}/?mesa=${n}${conBoda()}`;
const esc = (t: string) => String(t || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

function imprimirMesas(numeros: number[]) {
  const w = window.open("", "_blank"); if (!w) return;
  const pareja = esc(infoBoda().nombre || "");
  const tarjetas = numeros.map(n => `<div class="t"><div class="m">Mesa</div><div class="n">${n}</div><img src="${qr(urlMesa(n), 400)}" alt="QR mesa ${n}"><p>Escanéame: misión de la mesa, bingo, caza de fotos y juegos</p>${pareja ? `<div class="p">${pareja}</div>` : ""}</div>`).join("");
  w.document.write(`<html><head><title>QR por mesa</title><style>
    body{font-family:Georgia,serif;color:#5c3d2e;margin:0;padding:18px}
    .g{display:grid;grid-template-columns:repeat(2,1fr);gap:18px}
    .t{border:1.5px solid #e2c7ae;border-radius:18px;padding:18px 14px;text-align:center;page-break-inside:avoid}
    .m{font-size:12px;letter-spacing:.3em;text-transform:uppercase;color:#a07855}.n{font-size:54px;line-height:1;margin:2px 0 10px}
    img{width:62%;max-width:240px}p{font-size:13px;margin:10px 0 4px}.p{font-size:12px;color:#a07855;font-style:italic}
  </style></head><body><div class="g">${tarjetas}</div><script>window.onload=()=>setTimeout(()=>print(),400)</script></body></html>`);
  w.document.close();
}

export function QRInvitados() {
  const url = window.location.origin + "?fotos=1" + conBoda();
  const [pos] = useData<{ mesas: MesaPos[] }>("mesaspos", { mesas: [] });
  const delPlano = (pos.mesas || []).map(m => m.numero).filter(Boolean).sort((a, b) => a - b);
  const [cant, setCant] = useState(10);
  const numeros = delPlano.length ? delPlano : Array.from({ length: cant }, (_, i) => i + 1);
  const [ver, setVer] = useState<number | null>(null);
  return (
    <div style={{ animation: "fadeUp .3s ease", display: "flex", flexDirection: "column", gap: 16 }}>
      <Title icon="📱" title="QR para invitados"/>
      <Card style={{ textAlign: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#5c3d2e" }}>QR por mesa</div>
        <div style={{ fontSize: 13, color: "#a07855", margin: "6px auto 14px", maxWidth: 460, lineHeight: 1.5 }}>
          Uno en cada mesa. Al escanearlo, el invitado elige: la misión de su mesa, su cartón de bingo, la caza de fotos (y subirlas) o un juego en grupo como el impostor.
        </div>
        {delPlano.length
          ? <div style={{ fontSize: 12.5, color: "#a07855", marginBottom: 12 }}>Tomamos las {delPlano.length} mesas de tu plano de Mesas.</div>
          : <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: "#5c3d2e", marginBottom: 12 }}>¿Cuántas mesas?
              <input id="qr-cant-mesas" type="number" min={1} max={80} value={cant} onChange={e => setCant(Math.max(1, Math.min(80, Number(e.target.value) || 1)))}
                style={{ width: 70, padding: "7px 9px", borderRadius: 10, border: "1.5px solid #e8d5c4", background: "#fdf8f3", fontSize: 14 }}/></label>}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 14 }}>
          {numeros.map(n => <button key={n} onClick={() => setVer(ver === n ? null : n)} style={{ width: 42, height: 42, borderRadius: 12, cursor: "pointer", fontWeight: 700, fontSize: 15,
            border: `1.5px solid ${ver === n ? "#c9956a" : "#e8d5c4"}`, background: ver === n ? "#c9956a" : "#fdf8f3", color: ver === n ? "#fff" : "#5c3d2e" }}>{n}</button>)}
        </div>
        {ver !== null && <div style={{ background: "#fff", border: "8px solid #f5e8dc", borderRadius: 16, padding: 16, display: "inline-block", marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#5c3d2e", marginBottom: 8 }}>Mesa {ver}</div>
          <img src={qr(urlMesa(ver), 200)} alt={`QR de la mesa ${ver}`} style={{ width: 180, height: 180, display: "block" }}/>
          <a href={urlMesa(ver)} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#a07855", display: "block", marginTop: 8 }}>Probar cómo lo ve el invitado</a>
        </div>}
        <div><Btn onClick={() => imprimirMesas(numeros)}>Imprimir los {numeros.length} QR de mesa</Btn></div>
      </Card>
      <Card style={{ textAlign: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#5c3d2e" }}>QR de fotos</div>
        <div style={{ fontSize: 13, color: "#a07855", margin: "6px 0 16px" }}>Un solo QR para que cualquiera suba fotos a la galería</div>
        <div style={{ background: "#fff", border: "8px solid #f5e8dc", borderRadius: 16, padding: 20, display: "inline-block", marginBottom: 16 }}>
          <img src={qr(url, 200)} alt="QR para subir fotos" style={{ width: 200, height: 200, display: "block" }}/>
        </div>
        <div style={{ fontSize: 12, color: "#a07855", background: "#fdf8f3", padding: 12, borderRadius: 10, border: "1px solid #f0e0d0" }}>
          Los invitados solo pueden subir fotos y jugar. No ven ninguna otra sección.
        </div>
      </Card>
    </div>
  );
}
