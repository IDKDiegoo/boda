import { useState, useEffect, useRef } from "react";
import { uploadBytes, getDownloadURL, listAll, deleteObject } from "firebase/storage";
import { LEGADO, bodaActual, sref } from "../base/firebase";
import { Foto } from "../tipos";
import { Btn, Card, Title } from "../ui/base";

// ════════════════════════════════════════════════════════════════
// FOTOS
// ════════════════════════════════════════════════════════════════
export function Fotos({ esAdmin }: { esAdmin:boolean }) {
  const [fotos, setFotos]       = useState<Foto[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState("");
  const [preview, setPreview]   = useState<string|null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [cargando, setCargando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      const r = await listAll(sref("fotos-boda"));
      const urls = await Promise.all(r.items.map(async it=>({ url:await getDownloadURL(it), nombre:it.name })));
      setFotos(urls.reverse());
    } catch(e:any) {
      console.error(e);
      setProgreso(`❌ Error al cargar: ${e?.message||"sin acceso"}`);
      setTimeout(()=>setProgreso(""),5000);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { if (esAdmin) cargar(); }, [esAdmin]);

  const withTimeout = <T,>(p: Promise<T>, ms=30000): Promise<T> =>
    Promise.race([p, new Promise<T>((_,reject)=>setTimeout(()=>reject(new Error(`Tiempo agotado — revisa las reglas de Firebase Storage`)),ms))]);

  const comprimir = (file: File): Promise<Blob> => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 1280;
      const ratio = Math.min(MAX / img.naturalWidth, MAX / img.naturalHeight, 1);
      const w = Math.max(1, Math.round(img.naturalWidth * ratio));
      const h = Math.max(1, Math.round(img.naturalHeight * ratio));
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas no disponible")); return; }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(b => {
        if (b) {
          console.log(`Compresión: ${(file.size/1024/1024).toFixed(2)}MB → ${(b.size/1024/1024).toFixed(2)}MB (${w}x${h})`);
          resolve(b);
        } else {
          reject(new Error("toBlob falló"));
        }
      }, "image/jpeg", 0.78);
    };
    img.onerror = () => reject(new Error("No se pudo cargar la imagen"));
    img.src = URL.createObjectURL(file);
  });

  const subir = async (files:FileList|null) => {
    if (!files||!files.length) return;
    setSubiendo(true);
    try {
      let n=0;
      for (const f of Array.from(files)) {
        setProgreso(`Comprimiendo ${++n}/${files.length}...`);
        const blob = await comprimir(f);
        const orig = (f.size/1024/1024).toFixed(1);
        const comp = (blob.size/1024/1024).toFixed(1);
        setProgreso(`Subiendo ${n}/${files.length}... ${orig}MB → ${comp}MB`);
        const nombre = `${Date.now()}_${f.name.replace(/\.[^.]+$/, "")}.jpg`;
        await withTimeout(uploadBytes(sref(`fotos-boda/${nombre}`), blob, { contentType:"image/jpeg" }));
      }
      setProgreso("¡Fotos subidas! 🎉");
      if (esAdmin) await cargar();
      setTimeout(()=>setProgreso(""),3000);
    } catch(e:any) {
      setProgreso(`❌ ${e?.message||"No se pudo subir"}`);
      setTimeout(()=>setProgreso(""),6000);
    } finally {
      setSubiendo(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div style={{ animation:"fadeUp .3s ease" }}>
      <Title icon="📷" title={esAdmin?"Galería de fotos":"Subir fotos"}/>
      <Card style={{ marginBottom:16, textAlign:"center", border:"2px dashed #e8d5c4", background:"#fdf8f3" }}>
        <div style={{ fontSize:36, marginBottom:8 }}>📸</div>
        <div style={{ fontSize:14, color:"#5c3d2e", fontWeight:700, marginBottom:4 }}>{esAdmin?"Agregar fotos a la galería":"Comparte tus fotos de la boda"}</div>
        <div style={{ fontSize:12, color:"#a07855", marginBottom:16 }}>Selecciona una o varias fotos desde tu teléfono</div>
        <Btn color="#c9956a" onClick={()=>!subiendo&&fileRef.current?.click()}>{subiendo?progreso||"Subiendo...":"📁 Elegir fotos"}</Btn>
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={e=>subir(e.target.files)} style={{ display:"none" }} disabled={subiendo}/>
        {progreso && <div style={{ marginTop:12, fontSize:13, color:"#6aaa96", fontWeight:700 }}>{progreso}</div>}
      </Card>
      {esAdmin && (
        <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ fontSize:13, color:"#a07855" }}>{fotos.length} fotos</div>
            <button onClick={cargar} disabled={cargando} style={{ background:"none", border:"none", color:"#c9956a", fontSize:12, cursor:"pointer", fontFamily:"inherit", opacity:cargando?.5:1 }}>{cargando?"⏳ Cargando...":"🔄 Actualizar"}</button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }}>
            {fotos.map(f=>(
              <div key={f.nombre} style={{ position:"relative", borderRadius:10, overflow:"hidden", aspectRatio:"1", border:"2px solid #f0e0d0" }}>
                <img src={f.url} alt={f.nombre} onClick={()=>setPreview(f.url)} style={{ width:"100%", height:"100%", objectFit:"cover", cursor:"pointer", display:"block" }}/>
                <button
                  onClick={async()=>{
                    if (!window.confirm("¿Eliminar esta foto?")) return;
                    try {
                      await deleteObject(sref(`fotos-boda/${f.nombre}`));
                      setFotos(prev=>prev.filter(x=>x.nombre!==f.nombre));
                    } catch(e:any){ alert("Error al eliminar: "+e.message); }
                  }}
                  style={{ position:"absolute", top:4, right:4, background:"rgba(0,0,0,.55)", border:"none", borderRadius:6, color:"#fff", fontSize:13, cursor:"pointer", padding:"2px 6px", lineHeight:1.4 }}
                >🗑</button>
              </div>
            ))}
          </div>
          {fotos.length===0 && <div style={{ textAlign:"center", color:"#c4a882", padding:32 }}>Aún no hay fotos. ¡Comparte el QR!</div>}

          {/* QR integrado para admin */}
          <Card style={{ marginTop:16, textAlign:"center", background:"#fdf8f3" }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#5c3d2e", marginBottom:8 }}>📱 QR para invitados</div>
            <div style={{ fontSize:11, color:"#a07855", marginBottom:12 }}>Muestra este QR en la boda para que los invitados suban fotos</div>
            <div style={{ background:"#fff", border:"6px solid #f5e8dc", borderRadius:14, padding:16, display:"inline-block", marginBottom:10 }}>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.origin+"?fotos=1"+(bodaActual() && bodaActual()!==LEGADO ? `&b=${bodaActual()}` : ""))}&bgcolor=ffffff&color=5c3d2e`} alt="QR" style={{ width:180, height:180, display:"block" }}/>
            </div>
          </Card>
        </>
      )}
      {preview && (
        <div onClick={()=>setPreview(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.85)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <img src={preview} alt="preview" style={{ maxWidth:"100%", maxHeight:"90vh", borderRadius:12, objectFit:"contain" }}/>
        </div>
      )}
    </div>
  );
}
