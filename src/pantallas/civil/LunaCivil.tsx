import { fmt } from "../../base/config";
import { Fotos } from "../Fotos";
import { Presupuesto } from "../Presupuesto";
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
export const LUNA_RESERVAS: LunaParada[] = [
  { id:"r-barco", texto:"Reservar el barco a Ilha do Campeche (domingo 20)", detalle:"Abono de R$ 50; las fechas de diciembre se llenan" },
  { id:"r-spa",   texto:"Reservar el day spa para dos (lunes 21)" },
  { id:"r-plata", texto:"Llevar unos R$ 300 en efectivo", detalle:"Lugares chicos piden Pix o efectivo" },
];
export const LUNA_EXTRAS: [string,string][] = [
  ["Lagoinha do Leste","Una de las playas más lindas de la isla: unas 2 horas de sendero gratis desde Pântano do Sul."],
  ["Beto Carrero World","A unas 2 horas: ocupa el día entero y la entrada va aparte."],
  ["Para llevar","Bloqueador alto, gorro, zapatillas para el sendero y las dunas, y algo para la lluvia."],
];
export const LUNA_CREDITOS = "Fotos de Wikimedia Commons: Ezarate (Lagoa, CC BY-SA 4.0) · Luluhgomes (Campeche, CC BY-SA 4.0) · Rafael B. Mattei (Jurerê, CC BY-SA 3.0) · Anderson Schmitt (dunas, CC BY-SA 3.0) · Ricardo G. Faraco (Ponte, CC BY 3.0) · Prefeitura de Florianópolis (Mercado, CC BY 2.0) · Rafael A. Rojas (Ribeirão, CC BY-SA 4.0) · Santo Antônio de Lisboa (CC BY 2.5).";
export const reales = (n:number) => "R$ " + n.toLocaleString("es-CL");

export function LunaCivil({ hechos, onToggle }: { hechos:string[]; onToggle:(id:string)=>void }) {
  const totalDia = (d:LunaDia) => d.gastos.reduce((s,g)=>s+g[1],0);
  const subtotal = LUNA_DIAS.reduce((s,d)=>s+totalDia(d),0);
  const conColchon = Math.round(subtotal*1.1/50)*50;
  const todas = [...LUNA_RESERVAS, ...LUNA_DIAS.flatMap(d=>d.paradas)];
  const listas = todas.filter(p=>hechos.includes(p.id)).length;

  const fila = (p:LunaParada, color="#c9956a") => {
    const ok = hechos.includes(p.id);
    return (
      <button key={p.id} onClick={()=>onToggle(p.id)}
        style={{ display:"flex", gap:10, alignItems:"flex-start", width:"100%", textAlign:"left" as const, background:"transparent", border:"none", padding:"7px 0", cursor:"pointer", fontFamily:"inherit" }}>
        <span style={{ width:20, height:20, borderRadius:6, flexShrink:0, marginTop:1, border:`1.5px solid ${ok?color:"#e0cbb6"}`, background:ok?color:"#fff", color:"#fff", fontSize:12, fontWeight:900, display:"flex", alignItems:"center", justifyContent:"center" }}>{ok?"✓":""}</span>
        <span style={{ flex:1 }}>
          <span style={{ display:"block", fontSize:13, fontWeight:700, color:ok?"#b8a493":"#5c3d2e", textDecoration:ok?"line-through":"none" }}>{p.texto}</span>
          {p.detalle && <span style={{ display:"block", fontSize:11, color:"#a07855", lineHeight:1.45, marginTop:1 }}>{p.detalle}</span>}
        </span>
      </button>
    );
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

      <Card style={{ marginBottom:16, padding:"14px 16px", background:"#fff6ee", border:"1.5px solid #f0d2b4" }}>
        <div style={{ fontSize:12, fontWeight:800, color:"#c46a3a", marginBottom:4 }}>📌 Antes de viajar</div>
        {LUNA_RESERVAS.map(p=>fila(p,"#d9734e"))}
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
            <span style={{ fontVariantNumeric:"tabular-nums", whiteSpace:"nowrap" as const, marginLeft:8 }}>{reales(totalDia(d))}</span>
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
