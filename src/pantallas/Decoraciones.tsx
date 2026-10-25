import { useState, useRef } from "react";
import { uploadBytes, getDownloadURL } from "firebase/storage";
import { fmt } from "../base/config";
import { sref } from "../base/firebase";
import { getVideoInfo } from "../base/hooks";
import { DecoCheck, DecoItem } from "../tipos";
import { Btn, Card, Inp, Sel, Title } from "../ui/base";
import { Icono } from "../ui/iconos";

// ════════════════════════════════════════════════════════════════
// DECORACIONES
// ════════════════════════════════════════════════════════════════
export const CATS_DECO = ["Flores","Centros de mesa","Iluminación","Arcos y estructuras","Telas y manteles","Detalles","Otro"];

export function Decoraciones({ data, setData }: { data:{items:DecoItem[]}; setData:(d:any)=>void }) {
  const lista = data.items || [];
  const [show, setShow]     = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const [form, setForm]     = useState<Partial<DecoItem>>({ categoria:"Flores", cantidad:1, comprado:false });
  const [subiendo, setSubiendo] = useState(false);
  const [preview, setPreview]   = useState<string|null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const totalEst    = lista.reduce((s,i)=>s+i.precio*i.cantidad,0);
  const comprados   = lista.filter(i=>i.comprado).length;

  const comprimir = (file: File): Promise<Blob> => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 1080;
      const ratio = Math.min(MAX / img.naturalWidth, MAX / img.naturalHeight, 1);
      const w = Math.max(1, Math.round(img.naturalWidth * ratio));
      const h = Math.max(1, Math.round(img.naturalHeight * ratio));
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas no disponible")); return; }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(b => b ? resolve(b) : reject(new Error("toBlob falló")), "image/jpeg", 0.80);
    };
    img.onerror = () => reject(new Error("No se pudo cargar la imagen"));
    img.src = URL.createObjectURL(file);
  });

  const subirFoto = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setSubiendo(true);
    try {
      const blob  = await comprimir(files[0]);
      const nombre = `deco_${Date.now()}.jpg`;
      const r = sref(`decoraciones-boda/${nombre}`);
      await uploadBytes(r, blob, { contentType:"image/jpeg" });
      const url = await getDownloadURL(r);
      setForm(f => ({ ...f, foto: url }));
    } catch(e:any) { alert("Error al subir foto: " + e.message); }
    finally { setSubiendo(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const guardar = () => {
    if (!form.nombre) return;
    const item: DecoItem = {
      id:        editId ?? Date.now(),
      nombre:    form.nombre!,
      categoria: form.categoria || "Flores",
      cantidad:  Number(form.cantidad) || 1,
      precio:    Number(form.precio)   || 0,
      foto:      form.foto || "",
      videoUrl:  form.videoUrl || "",
      notas:     form.notas || "",
      comprado:  form.comprado || false,
    };
    if (editId !== null) {
      setData({ items: lista.map(i => i.id === editId ? item : i) });
    } else {
      setData({ items: [...lista, item] });
    }
    setForm({ categoria:"Flores", cantidad:1, comprado:false });
    setEditId(null); setShow(false);
  };

  const abrirEditar = (i: DecoItem) => {
    setForm({ ...i }); setEditId(i.id); setShow(true);
  };

  const eliminar = (id: number) => {
    if (!window.confirm("¿Eliminar este ítem?")) return;
    setData({ items: lista.filter(i => i.id !== id) });
  };

  const toggleComprado = (id: number) =>
    setData({ items: lista.map(i => i.id === id ? { ...i, comprado: !i.comprado } : i) });

  // ── Lo que se necesita para montar cada decoración ──
  const mapChecks = (itemId:number, fn:(cs:DecoCheck[])=>DecoCheck[]) =>
    setData({ items: lista.map(i => i.id === itemId ? { ...i, checks: fn(i.checks || []) } : i) });
  const addCheck    = (itemId:number) => mapChecks(itemId, cs => [...cs, { id:Date.now(), texto:"", listo:false }]);
  const toggleCheck = (itemId:number, cid:number) => mapChecks(itemId, cs => cs.map(c => c.id===cid ? {...c, listo:!c.listo} : c));
  const textoCheck  = (itemId:number, cid:number, t:string) => mapChecks(itemId, cs => cs.map(c => c.id===cid ? {...c, texto:t} : c));
  const delCheck    = (itemId:number, cid:number) => mapChecks(itemId, cs => cs.filter(c => c.id!==cid));

  return (
    <div style={{ animation:"fadeUp .3s ease" }}>
      <Title icon="🌸" title="Decoraciones"/>

      {/* Resumen */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
        <Card style={{ padding:14, textAlign:"center" }}>
          <div style={{ fontSize:22, fontWeight:700, color:"#c9956a" }}>{fmt(totalEst)}</div>
          <div style={{ fontSize:11, color:"#a07855" }}>Presupuesto estimado</div>
        </Card>
        <Card style={{ padding:14, textAlign:"center" }}>
          <div style={{ fontSize:22, fontWeight:700, color:"#6aaa96" }}>{comprados}/{lista.length}</div>
          <div style={{ fontSize:11, color:"#a07855" }}>Comprados</div>
        </Card>
      </div>

      {/* Formulario */}
      {show && (
        <Card style={{ marginBottom:16, border:"2px solid #e8d5c4" }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#5c3d2e", marginBottom:14 }}>
            {editId !== null ? "Editar ítem" : "Nuevo ítem"}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div>
              <div style={{ fontSize:10, color:"#a07855", fontWeight:600, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>Nombre *</div>
              <Inp value={form.nombre||""} onChange={v=>setForm({...form,nombre:v})} placeholder="Ej: Rosas blancas"/>
            </div>
            <div>
              <div style={{ fontSize:10, color:"#a07855", fontWeight:600, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>Categoría</div>
              <Sel value={form.categoria||"Flores"} onChange={v=>setForm({...form,categoria:v})} options={CATS_DECO.map(c=>({value:c,label:c}))}/>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              <div>
                <div style={{ fontSize:10, color:"#a07855", fontWeight:600, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>Cantidad</div>
                <Inp value={form.cantidad?.toString()||"1"} onChange={v=>setForm({...form,cantidad:Number(v)})} placeholder="1" type="number"/>
              </div>
              <div>
                <div style={{ fontSize:10, color:"#a07855", fontWeight:600, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>Precio aprox ($)</div>
                <Inp value={form.precio?.toString()||""} onChange={v=>setForm({...form,precio:Number(v)})} placeholder="0" type="number"/>
              </div>
            </div>
            <div>
              <div style={{ fontSize:10, color:"#a07855", fontWeight:600, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>Foto de referencia</div>
              {form.foto && (
                <div style={{ position:"relative", marginBottom:8 }}>
                  <img src={form.foto} alt="ref" style={{ width:"100%", maxHeight:180, objectFit:"cover", borderRadius:10, border:"1.5px solid #e8d5c4" }}/>
                  <button onClick={()=>setForm({...form,foto:""})} style={{ position:"absolute", top:6, right:6, background:"rgba(0,0,0,.55)", border:"none", borderRadius:6, color:"#fff", fontSize:12, cursor:"pointer", padding:"2px 7px" }}>✕</button>
                </div>
              )}
              <button onClick={()=>fileRef.current?.click()} disabled={subiendo}
                style={{ width:"100%", background:"#fdf8f3", border:"1.5px dashed #c9956a", borderRadius:9, padding:"10px", fontSize:12, color:"#c9956a", cursor:"pointer", fontFamily:"inherit", opacity:subiendo?.6:1 }}>
                {subiendo ? "Subiendo..." : form.foto ? "📷 Cambiar foto" : "📷 Agregar foto desde teléfono"}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={e=>subirFoto(e.target.files)} style={{ display:"none" }}/>
            </div>
            <div>
              <div style={{ fontSize:10, color:"#a07855", fontWeight:600, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>Link de YouTube o TikTok</div>
              <Inp value={form.videoUrl||""} onChange={v=>setForm({...form,videoUrl:v})} placeholder="https://youtu.be/... o tiktok.com/..."/>
            </div>
            <div>
              <div style={{ fontSize:10, color:"#a07855", fontWeight:600, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>Notas</div>
              <textarea value={form.notas||""} onChange={e=>setForm({...form,notas:e.target.value})} placeholder="Color, tamaño, dónde comprarlo..." rows={2}
                style={{ width:"100%", background:"#fdf8f3", border:"1.5px solid #e8d5c4", borderRadius:9, padding:"9px 12px", fontSize:12, color:"#5c3d2e", fontFamily:"inherit", outline:"none", resize:"none", boxSizing:"border-box" as any }}/>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <Btn onClick={guardar} style={{ flex:2 }}>💾 Guardar</Btn>
              <Btn outline onClick={()=>{ setShow(false); setEditId(null); setForm({ categoria:"Flores", cantidad:1, comprado:false }); }} style={{ flex:1 }}>Cancelar</Btn>
            </div>
          </div>
        </Card>
      )}

      {!show && <Btn onClick={()=>setShow(true)} style={{ marginBottom:16 }}>+ Agregar ítem</Btn>}

      {/* Lista por categoría */}
      {lista.length === 0 && (
        <div style={{ textAlign:"center", color:"#c4a882", padding:32 }}>Empieza a armar tu lista de decoraciones 🌸</div>
      )}

      {CATS_DECO.map(cat => {
        const items = lista.filter(i => i.categoria === cat);
        if (!items.length) return null;
        return (
          <div key={cat} style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#c9956a", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.08em" }}>{cat}</div>
            {items.map(item => {
              const vi = getVideoInfo(item.videoUrl || "");
              const opacidad = item.comprado ? 0.7 : 1;
              return (
                <Card key={item.id} style={{ marginBottom:10, opacity:opacidad, borderLeft:`3px solid ${item.comprado?"#6aaa96":"#e8d5c4"}` }}>
                  {/* Foto */}
                  {!!item.foto && (
                    <img src={item.foto} alt={item.nombre} onClick={()=>setPreview(item.foto as string)}
                      style={{ width:"100%", maxHeight:200, objectFit:"cover", borderRadius:10, marginBottom:10, cursor:"pointer", display:"block" }}/>
                  )}
                  {/* Video: YouTube con thumbnail */}
                  {vi && vi.tipo === "youtube" && vi.id && (
                    <a href={vi.url} target="_blank" rel="noreferrer" style={{ display:"block", position:"relative", marginBottom:10, borderRadius:10, overflow:"hidden", textDecoration:"none" }}>
                      <img src={`https://img.youtube.com/vi/${vi.id}/mqdefault.jpg`} alt="YouTube" style={{ width:"100%", display:"block", borderRadius:10 }}/>
                      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,.35)", borderRadius:10 }}>
                        <div style={{ width:48, height:48, background:"#ff0000", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <div style={{ width:0, height:0, borderTop:"10px solid transparent", borderBottom:"10px solid transparent", borderLeft:"18px solid #fff", marginLeft:4 }}/>
                        </div>
                      </div>
                      <div style={{ position:"absolute", bottom:8, left:10, fontSize:10, color:"#fff", fontWeight:700, background:"rgba(0,0,0,.5)", padding:"2px 6px", borderRadius:6 }}>Ver en YouTube ↗</div>
                    </a>
                  )}
                  {/* Video: TikTok u otro link */}
                  {vi && vi.tipo !== "youtube" && (
                    <a href={vi.url} target="_blank" rel="noreferrer"
                      style={{ display:"flex", alignItems:"center", gap:8, background:vi.tipo==="tiktok"?"#010101":"#f0f0f0", borderRadius:10, padding:"10px 14px", marginBottom:10, textDecoration:"none" }}>
                      <span style={{ fontSize:22 }}>{vi.tipo==="tiktok"?"🎵":"🔗"}</span>
                      <div>
                        <div style={{ fontSize:12, fontWeight:700, color:vi.tipo==="tiktok"?"#fff":"#333" }}>{vi.tipo==="tiktok"?"Ver en TikTok ↗":"Ver referencia ↗"}</div>
                        <div style={{ fontSize:10, color:vi.tipo==="tiktok"?"#aaa":"#888", marginTop:1 }}>Abre en Safari</div>
                      </div>
                    </a>
                  )}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"#5c3d2e", textDecoration:item.comprado?"line-through":"none", marginBottom:2 }}>{item.nombre}</div>
                      <div style={{ display:"flex", gap:8, flexWrap:"wrap" as any, alignItems:"center", marginBottom:4 }}>
                        {item.cantidad > 1 && <span style={{ fontSize:11, color:"#a07855" }}>×{item.cantidad}</span>}
                        {item.precio > 0 && <span style={{ fontSize:12, fontWeight:700, color:"#c9956a" }}>{fmt(item.precio * item.cantidad)}</span>}
                        {item.precio > 0 && item.cantidad > 1 && <span style={{ fontSize:10, color:"#c4a882" }}>({fmt(item.precio)} c/u)</span>}
                      </div>
                      {item.notas && <div style={{ fontSize:11, color:"#a07855" }}>{item.notas}</div>}
                    </div>
                    <div style={{ display:"flex", gap:5, flexShrink:0, marginLeft:8 }}>
                      <button onClick={()=>toggleComprado(item.id)}
                        style={{ background:item.comprado?"#e8f5ec":"none", border:`1px solid ${item.comprado?"#6aaa96":"#e8d5c4"}`, borderRadius:6, padding:"4px 7px", fontSize:11, color:item.comprado?"#6aaa96":"#a07855", cursor:"pointer", fontFamily:"inherit" }}>
                        {item.comprado?"✓":"Comprar"}
                      </button>
                      <button onClick={()=>abrirEditar(item)} style={{ background:"#fdf0e8", border:"none", borderRadius:6, padding:"4px 7px", fontSize:12, cursor:"pointer" }}><Icono n="lapiz" tam={16} style={{ color:"#a87447" }}/></button>
                      <button onClick={()=>eliminar(item.id)} style={{ background:"#fef2f2", border:"none", borderRadius:6, padding:"4px 7px", fontSize:12, cursor:"pointer" }}><Icono n="basura" tam={16} style={{ color:"#d48a8a" }}/></button>
                    </div>
                  </div>

                  {/* Lo que hace falta para montar esta decoración. Solo aparece si tiene checks;
                      el botón de agregar queda siempre, discreto. */}
                  {(() => {
                    const cs = item.checks || [];
                    const ok = cs.filter(c=>c.listo).length;
                    return (
                      <div style={{ marginTop:10, paddingTop:9, borderTop:"1px solid #f4e6d8" }}>
                        {cs.length > 0 && (
                          <>
                            <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:6 }}>
                              <span style={{ fontSize:10, fontWeight:800, color:"#a07855", letterSpacing:"0.04em" }}>QUÉ NECESITO</span>
                              <span style={{ fontSize:10, fontWeight:800, color:ok===cs.length?"#6aaa96":"#c9956a" }}>{ok}/{cs.length}</span>
                              <div style={{ flex:1, height:5, background:"#f4e6d8", borderRadius:3, overflow:"hidden" }}>
                                <div style={{ height:"100%", width:`${Math.round(ok/cs.length*100)}%`, background:ok===cs.length?"#6aaa96":"#c9956a", borderRadius:3, transition:"width .3s ease" }}/>
                              </div>
                            </div>
                            {cs.map(c=>(
                              <div key={c.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 0" }}>
                                <button onClick={()=>toggleCheck(item.id, c.id)}
                                  style={{ width:22, height:22, flexShrink:0, borderRadius:7, cursor:"pointer", background:c.listo?"#6aaa96":"#fff", border:`2px solid ${c.listo?"#6aaa96":"#e8d5c4"}`, color:"#fff", fontSize:12, fontWeight:900, lineHeight:1, fontFamily:"inherit", padding:0 }}>{c.listo?"✓":""}</button>
                                <input value={c.texto} onChange={e=>textoCheck(item.id, c.id, e.target.value)} placeholder="Ej: trípode, flores, cuadro…"
                                  style={{ flex:1, minWidth:0, border:"none", background:"transparent", fontSize:12, color:c.listo?"#c4a882":"#6b4423", textDecoration:c.listo?"line-through":"none", fontFamily:"inherit", outline:"none", padding:0 }}/>
                                <button onClick={()=>delCheck(item.id, c.id)}
                                  style={{ background:"none", border:"none", color:"#e0c0a0", fontSize:14, cursor:"pointer", padding:"0 2px", fontFamily:"inherit", flexShrink:0 }}>✕</button>
                              </div>
                            ))}
                          </>
                        )}
                        <button onClick={()=>addCheck(item.id)}
                          style={{ marginTop:cs.length?6:0, background:"none", border:"none", color:"#c9956a", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", padding:"3px 0" }}>
                          + Añadir check
                        </button>
                      </div>
                    );
                  })()}
                </Card>
              );
            })}
          </div>
        );
      })}

      {/* Preview foto */}
      {preview && (
        <div onClick={()=>setPreview(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.85)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <img src={preview} alt="preview" style={{ maxWidth:"100%", maxHeight:"90vh", borderRadius:12, objectFit:"contain" }}/>
        </div>
      )}
    </div>
  );
}
