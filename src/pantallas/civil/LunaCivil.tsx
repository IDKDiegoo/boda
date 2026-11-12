import { useState } from "react";
import { fmt } from "../../base/config";
import { Card } from "../../ui/base";

// ════════════════════════════════════════════════════════════════
// LUNA DE MIEL DE LA BODA CIVIL — Florianópolis, 19 al 24 de diciembre de 2026
// El itinerario es fijo (el mismo del PDF de iCloud); solo se guarda qué ya se hizo o reservó.
// Montos para los dos, solo comida, Uber y entradas (hospedaje y vuelos ya están pagados).
// ════════════════════════════════════════════════════════════════
export const REAL_A_CLP = 195;   // tipo de cambio usado (octubre 2026)
export type LunaParada = { id:string; texto:string; detalle?:string };
export type LunaDia = { id:string; fecha:string; dia:string; titulo:string; foto:string; relajo?:boolean; aviso?:string; paradas:LunaParada[]; gastos:[string,number][] };
export const LUNA_DIAS: LunaDia[] = [
  { id:"d19", fecha:"19", dia:"Sábado", titulo:"Llegada y Lagoa da Conceição", foto:"lagoa",
    paradas:[
      { id:"d19a", texto:"Llegar sin apuro y descansar" },
      { id:"d19b", texto:"Atardecer en el mirador del Morro da Lagoa", detalle:"Gratis. La vista de la laguna y las dunas" },
      { id:"d19c", texto:"Caminata por la orilla y cena en la Lagoa", detalle:"Sushi o mariscos" },
    ], gastos:[["Uber aeropuerto",60],["Uber local",50],["Cena",250]] },
  { id:"d20", fecha:"20", dia:"Domingo", titulo:"Ilha do Campeche", foto:"campeche",
    aviso:"Del 15 al 25 de diciembre el barco cuesta R$ 250 por persona. Cupo diario limitado: reservar con tiempo (R$ 50 de abono).",
    paradas:[
      { id:"d20a", texto:"Barco desde Armação a la isla", detalle:"Agua turquesa, arena blanca y senderos con grabados rupestres" },
      { id:"d20b", texto:"Llevar agua, snacks y bloqueador", detalle:"En la isla hay poco y caro" },
      { id:"d20c", texto:"Almuerzo en Armação y atardecer en Praia do Campeche" },
    ], gastos:[["Barco (2)",500],["Uber",100],["Almuerzo",250],["Cena",280]] },
  { id:"d21", fecha:"21", dia:"Lunes", titulo:"Día de relajo en pareja", foto:"jurere", relajo:true,
    paradas:[
      { id:"d21a", texto:"Day spa para dos", detalle:"Estética Arlete, Pacote Vênus (R$ 665) · Zahra con ofurô (R$ 760) · Buddha Spa (R$ 694)" },
      { id:"d21b", texto:"Tarde de playa tranquila en Jurerê Internacional", detalle:"Agua calma, sin olas" },
      { id:"d21c", texto:"Ostras al atardecer en Santo Antônio de Lisboa", detalle:"La mejor puesta de sol de la isla" },
    ], gastos:[["Spa",700],["Uber",100],["Almuerzo liviano",120],["Cena",280]] },
  { id:"d22", fecha:"22", dia:"Martes", titulo:"Sur de la isla y dunas", foto:"dunas",
    paradas:[
      { id:"d22a", texto:"Ribeirão da Ilha: casas de colores y ostras", detalle:"Ostradamus (R$ 120–200 p/p) o la «Ostretação» de Porto do Contrato (16 sabores para dos, R$ 119)" },
      { id:"d22b", texto:"Sandboard en las Dunas da Joaquina", detalle:"R$ 30–50 la hora por tabla" },
      { id:"d22c", texto:"Atardecer en Praia Mole" },
    ], gastos:[["Almuerzo de ostras",300],["Sandboard",80],["Uber",140],["Cena",240]] },
  { id:"d23", fecha:"23", dia:"Miércoles", titulo:"Centro y despedida", foto:"ponte",
    paradas:[
      { id:"d23a", texto:"Mercado Público", detalle:"Bolinhos de bacalhau en el Box 32" },
      { id:"d23b", texto:"Ponte Hercílio Luz iluminada", detalle:"En diciembre el centro tiene decoración de Navidad" },
      { id:"d23c", texto:"Cena de despedida", detalle:"En el lugar que más les haya gustado" },
    ], gastos:[["Mercado",150],["Uber",80],["Cena",300]] },
  { id:"d24", fecha:"24", dia:"Jueves", titulo:"Vuelta a Chile", foto:"mercado",
    paradas:[ { id:"d24a", texto:"Desayuno tranquilo y Uber al aeropuerto", detalle:"Pedirlo con tiempo: cerca de Navidad sube la demanda" } ],
    gastos:[["Uber aeropuerto",70]] },
];
// Checklist para antes de viajar (11-nov-2026). Los ids «r-…» viejos se mantienen: ya hay cosas marcadas.
export type LunaCat = { id:string; titulo:string; icono:string; items:LunaParada[] };
export const LUNA_CHECKLIST: LunaCat[] = [
  { id:"doc", titulo:"Documentos", icono:"🪪", items:[
    { id:"c-carnet", texto:"Carnet de identidad vigente (o pasaporte)", detalle:"Con la cédula chilena vigente se entra a Brasil; que no esté vencida ni dañada" },
    { id:"c-pasajes", texto:"Pasajes de ida y vuelta", detalle:"En el teléfono y, por si acaso, una copia en PDF" },
    { id:"c-checkin", texto:"Hacer el check-in online de los vuelos", detalle:"Se abre unos días antes del vuelo; así eligen asientos juntos" },
    { id:"c-hospedaje", texto:"Reserva del hospedaje confirmada", detalle:"Dirección, hora de check-in y contacto a mano" },
    { id:"c-seguro", texto:"Seguro de viaje", detalle:"Revisar si la tarjeta con que pagaron los pasajes ya lo incluye" },
    { id:"c-copias", texto:"Foto de los documentos guardada en el teléfono" },
  ]},
  { id:"plata", titulo:"Plata", icono:"💵", items:[
    { id:"r-plata", texto:"Reales en efectivo (unos R$ 300)", detalle:"Lugares chicos piden Pix o efectivo" },
    { id:"c-tarjeta", texto:"Tarjeta habilitada para el extranjero", detalle:"Avisar al banco o activarla en la app, y revisar el cupo internacional" },
    { id:"c-tarjeta2", texto:"Una segunda tarjeta de respaldo", detalle:"Guardada aparte de la billetera" },
    { id:"c-pesos", texto:"Pesos chilenos para la vuelta", detalle:"Uber o estacionamiento al llegar a Santiago" },
  ]},
  { id:"reservas", titulo:"Reservas y tours", icono:"🎟️", items:[
    { id:"r-barco", texto:"Barco a Ilha do Campeche (domingo 20)", detalle:"Abono de R$ 50; las fechas de diciembre se llenan" },
    { id:"r-spa", texto:"Day spa para dos (lunes 21)" },
    { id:"c-traslado", texto:"Cómo llegar del aeropuerto al hospedaje", detalle:"Uber o transfer; tener la dirección escrita" },
    { id:"c-cena", texto:"Reservar la cena de despedida (miércoles 23)", detalle:"Cerca de Navidad los lugares se llenan" },
  ]},
  { id:"salud", titulo:"Salud", icono:"💊", items:[
    { id:"c-vacunas", texto:"Revisar las vacunas recomendadas para Brasil", detalle:"Consultar en un vacunatorio internacional con tiempo: la de fiebre amarilla hace efecto 10 días después" },
    { id:"c-botiquin", texto:"Botiquín chico", detalle:"Paracetamol, antialérgico, algo para el estómago y el mareo, curitas" },
    { id:"c-remedios", texto:"Remedios personales (con receta si es necesario)" },
    { id:"c-repelente", texto:"Repelente de mosquitos" },
  ]},
  { id:"maleta", titulo:"Maletas y ropa", icono:"🎒", items:[
    { id:"c-mochilas", texto:"Mochilas o maletas listas", detalle:"Revisar el equipaje que incluye el pasaje (peso y tamaño)" },
    { id:"c-mochila-dia", texto:"Mochila chica para los paseos", detalle:"Agua, snacks y bloqueador para la isla y los senderos" },
    { id:"c-playa", texto:"Ropa de playa", detalle:"Trajes de baño, pareo, chalas y toalla de playa" },
    { id:"c-ropa", texto:"Ropa liviana y un polerón para la noche" },
    { id:"c-lluvia", texto:"Algo para la lluvia", detalle:"En diciembre puede llover de repente" },
    { id:"c-zapatillas", texto:"Zapatillas para el sendero y las dunas" },
    { id:"c-sol", texto:"Bloqueador alto, gorro y lentes de sol" },
    { id:"c-cena-ropa", texto:"Una tenida linda para la cena de despedida" },
  ]},
  { id:"tec", titulo:"Teléfono y cargadores", icono:"🔌", items:[
    { id:"c-cargadores", texto:"Cargadores y batería externa" },
    { id:"c-adaptador", texto:"Adaptador de enchufe universal" },
    { id:"c-datos", texto:"Internet en Brasil", detalle:"Roaming, eSIM o chip local" },
    { id:"c-apps", texto:"Apps listas", detalle:"Uber, mapa de la isla descargado sin conexión y traductor" },
  ]},
  { id:"casa", titulo:"Antes de salir de la casa", icono:"🏠", items:[
    { id:"c-casa", texto:"Casa cerrada, cosas desenchufadas y la basura afuera" },
    { id:"c-encargos", texto:"Mascotas y plantas encargadas" },
    { id:"c-familia", texto:"Dejarle el itinerario a la familia", detalle:"Vuelos, hospedaje y un teléfono de contacto" },
  ]},
];
export type LunaPropio = { id:string; cat:string; texto:string };
export const LUNA_EXTRAS: [string,string][] = [
  ["Lagoinha do Leste","Una de las playas más lindas de la isla: unas 2 horas de sendero gratis desde Pântano do Sul."],
  ["Beto Carrero World","A unas 2 horas: ocupa el día entero y la entrada va aparte."],
];
export const LUNA_CREDITOS = "Fotos de Wikimedia Commons: Ezarate (Lagoa, CC BY-SA 4.0) · Luluhgomes (Campeche, CC BY-SA 4.0) · Rafael B. Mattei (Jurerê, CC BY-SA 3.0) · Anderson Schmitt (dunas, CC BY-SA 3.0) · Ricardo G. Faraco (Ponte, CC BY 3.0) · Prefeitura de Florianópolis (Mercado, CC BY 2.0) · Rafael A. Rojas (Ribeirão, CC BY-SA 4.0) · Santo Antônio de Lisboa (CC BY 2.5).";
export const reales = (n:number) => "R$ " + n.toLocaleString("es-CL");

export function LunaCivil({ hechos, onToggle, propios, onPropios }: { hechos:string[]; onToggle:(id:string)=>void; propios:LunaPropio[]; onPropios:(l:LunaPropio[])=>void }) {
  const [ocultarListo, setOcultarListo] = useState(false);
  const [nuevo, setNuevo] = useState(""); const [nuevaCat, setNuevaCat] = useState("maleta");
  const checklist = LUNA_CHECKLIST.map(c => ({ ...c, items: [...c.items, ...propios.filter(p => p.cat === c.id)] }));
  const itemsCheck = checklist.flatMap(c => c.items);
  const listosCheck = itemsCheck.filter(p => hechos.includes(p.id)).length;
  const agregar = () => { const t = nuevo.trim(); if (!t) return; onPropios([...propios, { id: "p-" + Date.now(), cat: nuevaCat, texto: t }]); setNuevo(""); };
  const totalDia = (d:LunaDia) => d.gastos.reduce((s,g)=>s+g[1],0);
  const subtotal = LUNA_DIAS.reduce((s,d)=>s+totalDia(d),0);
  const conColchon = Math.round(subtotal*1.1/50)*50;
  const todas = [...itemsCheck, ...LUNA_DIAS.flatMap(d=>d.paradas)];
  const listas = todas.filter(p=>hechos.includes(p.id)).length;

  const fila = (p:LunaParada, color="#c9956a", borrar?:()=>void) => {
    const ok = hechos.includes(p.id);
    const boton = (
      <button key={p.id} onClick={()=>onToggle(p.id)}
        style={{ display:"flex", gap:10, alignItems:"flex-start", width:"100%", textAlign:"left" as const, background:"transparent", border:"none", padding:"7px 0", cursor:"pointer", fontFamily:"inherit" }}>
        <span style={{ width:20, height:20, borderRadius:6, flexShrink:0, marginTop:1, border:`1.5px solid ${ok?color:"#e0cbb6"}`, background:ok?color:"#fff", color:"#fff", fontSize:12, fontWeight:900, display:"flex", alignItems:"center", justifyContent:"center" }}>{ok?"✓":""}</span>
        <span style={{ flex:1 }}>
          <span style={{ display:"block", fontSize:13, fontWeight:700, color:ok?"#b8a493":"#5c3d2e", textDecoration:ok?"line-through":"none" }}>{p.texto}</span>
          {p.detalle && <span style={{ display:"block", fontSize:11, color:"#a07855", lineHeight:1.45, marginTop:1 }}>{p.detalle}</span>}
        </span>
      </button>
    );
    if (!borrar) return boton;
    return <div key={p.id} style={{ display:"flex", alignItems:"flex-start", gap:4 }}>{boton}
      <button onClick={borrar} aria-label={`Quitar «${p.texto}»`} style={{ background:"none", border:"none", color:"#d8b9a0", fontSize:16, cursor:"pointer", padding:"6px 2px", fontFamily:"inherit" }}>×</button></div>;
  };

  return (
    <div>
      {/* Portada */}
      <div style={{ position:"relative" as const, borderRadius:16, overflow:"hidden", marginBottom:14, minHeight:190, background:"#3d6e78" }}>
        <img src="/luna/campeche.jpg" alt="Ilha do Campeche" style={{ position:"absolute" as const, inset:0, width:"100%", height:"100%", objectFit:"cover" as const }}/>
        <div style={{ position:"absolute" as const, inset:0, background:"linear-gradient(180deg,rgba(20,50,60,.05) 20%,rgba(20,40,50,.78))" }}/>
        <div style={{ position:"relative" as const, padding:"80px 18px 16px", color:"#fff" }}>
          <div style={{ fontSize:10, letterSpacing:"0.18em", fontWeight:700, opacity:.9 }}>LUNA DE MIEL · BODA CIVIL</div>
          <div style={{ fontSize:26, fontWeight:900, lineHeight:1.1, marginTop:2 }}>Florianópolis</div>
          <div style={{ fontSize:12, opacity:.92, marginTop:2 }}>Del sábado 19 al jueves 24 de diciembre de 2026</div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:14 }}>
        {[["Para los dos", "≈ "+fmt(conColchon*REAL_A_CLP), reales(conColchon)+" con 10% de colchón"],
          ["Tipo de cambio", "R$ 1 ≈ $"+REAL_A_CLP, "octubre 2026"],
          ["Avance", `${listas} de ${todas.length}`, "cosas hechas o reservadas"]].map(([t,v,s])=>(
          <Card key={t} style={{ padding:"11px 10px" }}>
            <div style={{ fontSize:9.5, fontWeight:700, color:"#a07855", letterSpacing:"0.05em" }}>{t.toUpperCase()}</div>
            <div style={{ fontSize:15, fontWeight:900, color:"#5c3d2e", marginTop:2 }}>{v}</div>
            <div style={{ fontSize:9.5, color:"#c4a882", marginTop:1, lineHeight:1.3 }}>{s}</div>
          </Card>
        ))}
      </div>

      {/* Checklist para viajar */}
      <Card style={{ marginBottom:16, padding:"14px 16px", background:"#fff6ee", border:"1.5px solid #f0d2b4" }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
          <div style={{ fontSize:14, fontWeight:900, color:"#c46a3a", flex:1 }}>🧳 Checklist para viajar</div>
          <div style={{ fontSize:12, fontWeight:800, color:"#8c4820" }}>{listosCheck} de {itemsCheck.length}</div>
        </div>
        <div style={{ height:7, background:"#f6dfcc", borderRadius:9, margin:"8px 0 4px", overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${itemsCheck.length ? listosCheck/itemsCheck.length*100 : 0}%`, background:"#d9734e", borderRadius:9, transition:"width .3s" }}/>
        </div>
        <button onClick={()=>setOcultarListo(v=>!v)} style={{ background:"none", border:"none", color:"#a07855", fontSize:11, fontWeight:700, cursor:"pointer", padding:"4px 0", fontFamily:"inherit" }}>
          {ocultarListo ? "Mostrar también lo listo" : "Ocultar lo que ya está listo"}</button>
        {checklist.map(c => {
          const listos = c.items.filter(p=>hechos.includes(p.id)).length;
          const ver = ocultarListo ? c.items.filter(p=>!hechos.includes(p.id)) : c.items;
          return (
            <div key={c.id} style={{ marginTop:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, fontWeight:800, color:"#8c4820", letterSpacing:"0.06em", borderBottom:"1px solid #f0d2b4", paddingBottom:4 }}>
                <span>{c.icono}</span><span style={{ flex:1 }}>{c.titulo.toUpperCase()}</span>
                <span style={{ color: listos===c.items.length ? "#3f8f5f" : "#c4a882" }}>{listos===c.items.length ? "✓ listo" : `${listos}/${c.items.length}`}</span>
              </div>
              {ver.map(p => fila(p, "#d9734e", p.id.startsWith("p-") ? () => onPropios(propios.filter(x=>x.id!==p.id)) : undefined))}
              {ocultarListo && !ver.length && <div style={{ fontSize:11, color:"#3f8f5f", padding:"6px 0" }}>Todo listo acá.</div>}
            </div>
          );
        })}
        <form onSubmit={e=>{ e.preventDefault(); agregar(); }} style={{ display:"flex", flexWrap:"wrap" as const, gap:6, marginTop:14, paddingTop:12, borderTop:"1px dashed #f0d2b4" }}>
          <input id="luna-nuevo" value={nuevo} onChange={e=>setNuevo(e.target.value)} placeholder="Agregar algo más, ej: lentes de contacto"
            style={{ flex:"1 1 180px", minWidth:0, border:"1.5px solid #f0d2b4", borderRadius:9, padding:"9px 11px", fontSize:16, background:"#fff", color:"#5c3d2e", fontFamily:"inherit", outline:"none" }}/>
          <select id="luna-cat" value={nuevaCat} onChange={e=>setNuevaCat(e.target.value)} aria-label="Categoría"
            style={{ border:"1.5px solid #f0d2b4", borderRadius:9, padding:"9px 8px", fontSize:14, background:"#fff", color:"#5c3d2e", fontFamily:"inherit" }}>
            {LUNA_CHECKLIST.map(c=><option key={c.id} value={c.id}>{c.icono} {c.titulo}</option>)}
          </select>
          <button type="submit" disabled={!nuevo.trim()} style={{ background:"#d9734e", color:"#fff", border:"none", borderRadius:9, padding:"9px 14px", fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"inherit", opacity:nuevo.trim()?1:.5 }}>Agregar</button>
        </form>
      </Card>

      {/* Día a día */}
      {LUNA_DIAS.map(d=>{
        const hechasDia = d.paradas.filter(p=>hechos.includes(p.id)).length;
        return (
          <Card key={d.id} style={{ padding:0, overflow:"hidden", marginBottom:14 }}>
            <div style={{ position:"relative" as const, height:150, background:"#e8d5c4" }}>
              <img src={`/luna/${d.foto}.jpg`} alt={d.titulo} loading="lazy" style={{ width:"100%", height:"100%", objectFit:"cover" as const, display:"block" }}/>
              <div style={{ position:"absolute" as const, inset:0, background:"linear-gradient(180deg,transparent 35%,rgba(30,20,15,.7))" }}/>
              <div style={{ position:"absolute" as const, left:14, bottom:10, right:14, display:"flex", alignItems:"flex-end", gap:10, color:"#fff" }}>
                <div style={{ fontSize:34, fontWeight:900, lineHeight:.9 }}>{d.fecha}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:9.5, letterSpacing:"0.14em", fontWeight:700, opacity:.9 }}>{d.dia.toUpperCase()}{d.relajo?" · 💆 RELAJO":""}</div>
                  <div style={{ fontSize:15, fontWeight:800, lineHeight:1.2 }}>{d.titulo}</div>
                </div>
                <div style={{ fontSize:10, fontWeight:800, background:"rgba(255,255,255,.22)", borderRadius:20, padding:"3px 9px" }}>{hechasDia}/{d.paradas.length}</div>
              </div>
            </div>
            <div style={{ padding:"8px 16px 14px" }}>
              {d.paradas.map(p=>fila(p, d.relajo?"#d9734e":"#c9956a"))}
              {d.aviso && <div style={{ fontSize:11, color:"#8c4820", background:"#fff3ea", borderLeft:"3px solid #d9734e", borderRadius:6, padding:"7px 10px", margin:"6px 0 4px", lineHeight:1.45 }}>{d.aviso}</div>}
              <div style={{ display:"flex", flexWrap:"wrap" as const, gap:6, marginTop:8, paddingTop:9, borderTop:"1px dashed #ecdccb", alignItems:"center" }}>
                {d.gastos.map(([n,m])=>(
                  <span key={n} style={{ fontSize:10, color:"#a07855", background:"#fdf8f3", borderRadius:20, padding:"3px 9px" }}>{n} <strong style={{ color:"#5c3d2e" }}>{reales(m)}</strong></span>
                ))}
                <span style={{ marginLeft:"auto", fontSize:11, fontWeight:800, color:"#c9956a" }}>{reales(totalDia(d))} · ~{fmt(Math.round(totalDia(d)*REAL_A_CLP/1000)*1000)}</span>
              </div>
            </div>
          </Card>
        );
      })}

      {/* Presupuesto */}
      <Card style={{ marginBottom:14 }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#8c4820", marginBottom:8, letterSpacing:"0.06em" }}>PRESUPUESTO PARA LOS DOS</div>
        {LUNA_DIAS.map(d=>(
          <div key={d.id} style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#5c3d2e", padding:"6px 0", borderBottom:"1px solid #f3e7dc" }}>
            <span>{d.dia.slice(0,3)} {d.fecha} · {d.titulo}</span>
            <span style={{ fontVariantNumeric:"lining-nums tabular-nums", whiteSpace:"nowrap" as const, marginLeft:8 }}>{reales(totalDia(d))}</span>
          </div>
        ))}
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#a07855", padding:"7px 0" }}><span>Subtotal</span><span>{reales(subtotal)} · {fmt(subtotal*REAL_A_CLP)}</span></div>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:14, fontWeight:900, color:"#c9956a" }}><span>Con 10% de colchón</span><span>≈ {fmt(conColchon*REAL_A_CLP)}</span></div>
        <div style={{ fontSize:10, color:"#c4a882", marginTop:6 }}>Solo comida, Uber y entradas. Precios de la temporada 2025: para 2026 pueden subir un poco.</div>
      </Card>

      {/* Ribeirão y extras */}
      <Card style={{ padding:0, overflow:"hidden", marginBottom:14 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", height:110 }}>
          <img src="/luna/ribeirao.jpg" alt="Ribeirão da Ilha" loading="lazy" style={{ width:"100%", height:"100%", objectFit:"cover" as const }}/>
          <img src="/luna/santoantonio.jpg" alt="Santo Antônio de Lisboa" loading="lazy" style={{ width:"100%", height:"100%", objectFit:"cover" as const }}/>
        </div>
        <div style={{ padding:"12px 16px 14px" }}>
          <div style={{ fontSize:12, fontWeight:800, color:"#5c3d2e", marginBottom:6 }}>Si les sobra energía</div>
          {LUNA_EXTRAS.map(([t,x])=>(
            <div key={t} style={{ fontSize:11.5, color:"#a07855", lineHeight:1.5, marginBottom:5 }}><strong style={{ color:"#5c3d2e" }}>{t}:</strong> {x}</div>
          ))}
        </div>
      </Card>
      <div style={{ fontSize:9, color:"#c4a882", lineHeight:1.5, padding:"0 4px" }}>{LUNA_CREDITOS}</div>
    </div>
  );
}
