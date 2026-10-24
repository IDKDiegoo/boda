import React, { useState, useEffect, useRef } from "react";
import { Invitado, MesaPos } from "../tipos";
import { Badge, Btn, Card, Title } from "../ui/base";

// ════════════════════════════════════════════════════════════════
// MESAS
// ════════════════════════════════════════════════════════════════
export function Mesas({ invitados, setInvitados, mesasData, setMesasData }: {
  invitados:{invitados:Invitado[]}; setInvitados:(d:any)=>void;
  mesasData:{mesas:MesaPos[]}; setMesasData:(d:any)=>void;
}) {
  const lista  = invitados.invitados || [];
  const [localMesas, setLocalMesas] = useState<MesaPos[]>([]);
  const [seleccionada, setSeleccionada] = useState<number|null>(null);
  const dragRef = useRef<{id:number;startX:number;startY:number;origX:number;origY:number;moved:boolean}|null>(null);
  const roomRef = useRef<HTMLDivElement>(null);

  const TR      = 36;
  const cols    = 3;
  const spacing = 110;
  const RoomH   = Math.max(320, 60 + Math.ceil((localMesas.length + 1) / cols) * spacing + TR);
  const [formaAgregar, setFormaAgregar] = useState<"circular"|"rectangular"|"cuadrada">("circular");

  useEffect(() => { setLocalMesas(mesasData.mesas || []); }, [mesasData]);

  const sinMesa    = lista.filter(i=>!i.mesa||i.mesa===0);
  const invDeMesa  = (num:number) => lista.filter(i=>i.mesa===num);
  const mesaActual = localMesas.find(m=>m.numero===seleccionada);

  const cambiarForma = (id:number, forma:"circular"|"rectangular"|"cuadrada") => {
    const nuevas = localMesas.map(m=>m.id===id?{...m,forma}:m);
    setLocalMesas(nuevas);
    setMesasData({ mesas: nuevas });
  };

  const addMesa = () => {
    const nums    = localMesas.map(m=>m.numero);
    const next    = nums.length ? Math.max(...nums)+1 : 1;
    const idx     = localMesas.length;
    const col     = idx % cols;
    const row     = Math.floor(idx / cols);
    const x       = 60 + col * spacing;
    const y       = 60 + row * spacing;
    const nuevo: MesaPos = { id:Date.now(), numero:next, x, y, forma:formaAgregar };
    const nuevas  = [...localMesas, nuevo];
    setLocalMesas(nuevas);
    setMesasData({ mesas: nuevas });
  };

  const eliminarMesa = (num:number) => {
    setInvitados({ invitados: lista.map(i=>i.mesa===num?{...i,mesa:0}:i) });
    const nuevas = localMesas.filter(m=>m.numero!==num);
    setLocalMesas(nuevas);
    setMesasData({ mesas: nuevas });
    setSeleccionada(null);
  };

  const toggleInvitado = (invId:number, mesaNum:number) => {
    const inv = lista.find(i=>i.id===invId);
    if (!inv) return;
    const newMesa = inv.mesa===mesaNum ? 0 : mesaNum;
    setInvitados({ invitados: lista.map(i=>i.id===invId?{...i,mesa:newMesa}:i) });
  };

  // ── Drag (touch + mouse) ───────────────────────────────────────
  const startDrag = (e:React.TouchEvent|React.MouseEvent, mesa:MesaPos) => {
    e.stopPropagation();
    const touch = "touches" in e ? e.touches[0] : null;
    if ("touches" in e && !touch) return;
    const clientX = touch ? touch.clientX : (e as React.MouseEvent).clientX;
    const clientY = touch ? touch.clientY : (e as React.MouseEvent).clientY;
    dragRef.current = { id:mesa.id, startX:clientX, startY:clientY, origX:mesa.x, origY:mesa.y, moved:false };
  };

  const moveDrag = (e:React.TouchEvent|React.MouseEvent) => {
    if (!dragRef.current||!roomRef.current) return;
    const touch = "touches" in e ? e.touches[0] : null;
    if ("touches" in e && !touch) return;
    if ("touches" in e) e.preventDefault();
    const clientX = touch ? touch.clientX : (e as React.MouseEvent).clientX;
    const clientY = touch ? touch.clientY : (e as React.MouseEvent).clientY;
    const drag = dragRef.current;
    const dx = clientX - drag.startX;
    const dy = clientY - drag.startY;
    if (Math.abs(dx)>5||Math.abs(dy)>5) drag.moved = true;
    const roomW = roomRef.current.offsetWidth;
    const newX  = Math.max(TR, Math.min(roomW-TR, drag.origX+dx));
    const newY  = Math.max(TR, Math.min(RoomH-TR, drag.origY+dy));
    const dragId = drag.id;
    setLocalMesas(prev=>prev.map(m=>m.id===dragId?{...m,x:newX,y:newY}:m));
  };

  const endDrag = (mesa:MesaPos) => {
    if (!dragRef.current) return;
    if (!dragRef.current.moved) {
      setSeleccionada(prev=>prev===mesa.numero?null:mesa.numero);
    } else {
      setMesasData({ mesas: localMesas });
    }
    dragRef.current = null;
  };

  return (
    <div style={{ animation:"fadeUp .3s ease" }}>
      <Title icon="🪑" title="Plano de Mesas"/>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:14 }}>
        {[
          {l:"Mesas",     v:localMesas.length,          c:"#c9956a"},
          {l:"Asignados", v:lista.length-sinMesa.length, c:"#6aaa96"},
          {l:"Sin mesa",  v:sinMesa.length,              c:"#e07070"},
        ].map(s=>(
          <Card key={s.l} style={{ padding:12, textAlign:"center" }}>
            <div style={{ fontSize:20, fontWeight:700, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:10, color:"#a07855" }}>{s.l}</div>
          </Card>
        ))}
      </div>

      {/* Sala — plano visual */}
      <Card style={{ padding:8, marginBottom:14 }}>
        <div style={{ marginBottom:8 }}>
          <div style={{ fontSize:11, color:"#a07855", marginBottom:8 }}>Arrastra las mesas · Toca para asignar invitados</div>
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            {([["circular","⬤ Redonda"],["rectangular","▬ Rectangular"],["cuadrada","■ Cuadrada"]] as const).map(([f,l])=>(
              <button key={f} onClick={()=>setFormaAgregar(f)} style={{ flex:1, background:formaAgregar===f?"#c9956a":"#f5e8dc", border:`2px solid ${formaAgregar===f?"#c9956a":"#e8d5c4"}`, borderRadius:8, padding:"6px 4px", fontSize:10, fontWeight:700, color:formaAgregar===f?"#fff":"#a07855", cursor:"pointer", fontFamily:"inherit" }}>{l}</button>
            ))}
            <Btn onClick={addMesa} style={{ padding:"6px 14px", fontSize:12, whiteSpace:"nowrap" }}>+ Agregar</Btn>
          </div>
        </div>
        <div
          ref={roomRef}
          onTouchMove={moveDrag as any}
          onMouseMove={moveDrag as any}
          onTouchEnd={()=>{ if(dragRef.current) setMesasData({mesas:localMesas}); dragRef.current=null; }}
          onMouseUp={()=>{ if(dragRef.current) setMesasData({mesas:localMesas}); dragRef.current=null; }}
          style={{
            width:"100%", height:RoomH,
            background:"#fdf8f3",
            backgroundImage:"radial-gradient(#e8d5c4 1px, transparent 1px)",
            backgroundSize:"22px 22px",
            border:"2px solid #e8d5c4", borderRadius:12,
            position:"relative", overflow:"hidden",
            touchAction:"none", userSelect:"none",
          }}
        >
          {/* Etiqueta entrada */}
          <div style={{ position:"absolute", bottom:6, left:"50%", transform:"translateX(-50%)", fontSize:9, color:"#c4a882", background:"#fff", border:"1px solid #e8d5c4", borderRadius:4, padding:"2px 8px" }}>🚪 ENTRADA</div>

          {localMesas.map(mesa=>{
            const inv    = invDeMesa(mesa.numero);
            const isSel  = seleccionada===mesa.numero;
            const isDrag = dragRef.current?.id===mesa.id;
            const forma  = mesa.forma || "circular";
            const W = forma==="rectangular" ? TR*2+20 : TR*2;
            const H = forma==="rectangular" ? TR*1.2  : TR*2;
            const radius = forma==="circular" ? "50%" : forma==="cuadrada" ? "10px" : "8px";
            const bgSel  = "linear-gradient(135deg,#c9956a,#a07040)";
            return (
              <div
                key={mesa.id}
                onTouchStart={e=>startDrag(e,mesa)}
                onMouseDown={e=>startDrag(e,mesa)}
                onTouchEnd={()=>endDrag(mesa)}
                onMouseUp={()=>endDrag(mesa)}
                style={{
                  position:"absolute",
                  left:mesa.x-W/2, top:mesa.y-H/2,
                  width:W, height:H,
                  borderRadius:radius,
                  background:isSel?bgSel:"#fff",
                  border:`3px solid ${isSel?"#a07040":"#e8d5c4"}`,
                  display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                  cursor:"grab", touchAction:"none",
                  boxShadow: isDrag?"0 8px 24px rgba(180,130,100,.5)":isSel?"0 4px 16px rgba(180,130,100,.3)":"0 2px 8px rgba(180,130,100,.15)",
                  zIndex:isDrag?10:isSel?5:1,
                  transition: isDrag?"none":"box-shadow .15s",
                }}
              >
                <div style={{ fontSize:15, fontWeight:800, color:isSel?"#fff":"#5c3d2e", lineHeight:1 }}>{mesa.numero}</div>
                <div style={{ fontSize:9, color:isSel?"#ffe8d4":"#a07855", marginTop:2 }}>{inv.length} pers.</div>
                {inv.length>0 && (
                  <div style={{ position:"absolute", top:-6, right:-6, width:16, height:16, borderRadius:"50%", background:"#6aaa96", border:"2px solid #fff", fontSize:8, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>{inv.length}</div>
                )}
              </div>
            );
          })}
          {localMesas.length===0 && (
            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", color:"#c4a882", fontSize:13, flexDirection:"column", gap:8 }}>
              <span style={{ fontSize:32 }}>🪑</span>
              <span>Toca "+ Mesa" para agregar</span>
            </div>
          )}
        </div>
      </Card>

      {/* Panel de la mesa seleccionada */}
      {seleccionada!==null && mesaActual && (
        <Card style={{ border:"2px solid #c9956a", marginBottom:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:"#5c3d2e" }}>Mesa {seleccionada}</div>
              <div style={{ fontSize:11, color:"#a07855" }}>{invDeMesa(seleccionada).length} personas asignadas</div>
            </div>
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              <button onClick={()=>eliminarMesa(seleccionada)} style={{ background:"none", border:"none", color:"#e07070", cursor:"pointer", fontSize:12, fontFamily:"inherit" }}>🗑 Eliminar</button>
              <button onClick={()=>setSeleccionada(null)} style={{ background:"none", border:"none", color:"#a07855", cursor:"pointer", fontSize:18 }}>✕</button>
            </div>
          </div>
          {/* Cambiar forma */}
          <div style={{ display:"flex", gap:5, marginBottom:12 }}>
            {([["circular","⬤"],["rectangular","▬"],["cuadrada","■"]] as const).map(([f,l])=>(
              <button key={f} onClick={()=>cambiarForma(mesaActual.id,f)} style={{ flex:1, background:(mesaActual.forma||"circular")===f?"#c9956a":"#f5e8dc", border:`1.5px solid ${(mesaActual.forma||"circular")===f?"#c9956a":"#e8d5c4"}`, borderRadius:7, padding:"5px 4px", fontSize:12, color:(mesaActual.forma||"circular")===f?"#fff":"#a07855", cursor:"pointer", fontFamily:"inherit" }}>{l}</button>
            ))}
          </div>
          <div style={{ fontSize:11, color:"#a07855", marginBottom:10 }}>Toca un invitado para asignar / quitar:</div>
          <div style={{ display:"flex", flexDirection:"column", gap:5, maxHeight:260, overflowY:"auto" }}>
            {lista.map(inv=>{
              const enEsta   = inv.mesa===seleccionada;
              const enOtra   = inv.mesa&&inv.mesa!==seleccionada;
              return (
                <div
                  key={inv.id}
                  onClick={()=>{ if(!enOtra) toggleInvitado(inv.id, seleccionada); }}
                  style={{
                    display:"flex", justifyContent:"space-between", alignItems:"center",
                    padding:"8px 12px", borderRadius:9,
                    background: enEsta?"#f5e8dc":"#fdf8f3",
                    border:`1px solid ${enEsta?"#c9956a":"#f0e0d0"}`,
                    cursor: enOtra?"default":"pointer",
                    opacity: enOtra?.4:1,
                  }}
                >
                  <span style={{ fontSize:12, color:"#5c3d2e" }}>{inv.tipo==="adulto"?"👤":"👶"} {inv.nombre}</span>
                  {enEsta && <span style={{ fontSize:11, color:"#c9956a", fontWeight:700 }}>✓ Aquí</span>}
                  {enOtra && <span style={{ fontSize:10, color:"#a07855" }}>Mesa {inv.mesa}</span>}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Resumen por mesa */}
      {localMesas.length>0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#5c3d2e", marginBottom:4 }}>Resumen</div>
          {localMesas.slice().sort((a,b)=>a.numero-b.numero).map(m=>{
            const inv = invDeMesa(m.numero);
            return (
              <div key={m.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:"#fff", borderRadius:10, border:"1px solid #f0e0d0" }}>
                <span style={{ fontSize:13, fontWeight:700, color:"#5c3d2e" }}>Mesa {m.numero}</span>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  <Badge text={`${inv.length} personas`} color="#c9956a"/>
                  <button onClick={()=>setSeleccionada(m.numero)} style={{ background:"none", border:"1px solid #e8d5c4", borderRadius:6, padding:"3px 8px", fontSize:11, color:"#a07855", cursor:"pointer", fontFamily:"inherit" }}>Ver</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
