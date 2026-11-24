// ════════════════════════════════════════════════════════════════
// MESAS DE LA BODA CIVIL — plano visto desde arriba, en metros. Se arrastran las mesas y mesones,
// se toca una mesa para sentar a la gente. Se guarda al SOLTAR (no mientras se arrastra) para no
// gastar escrituras. La lógica está en plano.ts. NO es el de la boda grande (pantallas/Mesas.tsx).
// ════════════════════════════════════════════════════════════════
import React, { useMemo, useRef, useState } from "react";
import { CivilData } from "./datosCivil";
import { Card } from "../../ui/base";
import {
  ElemPlano, ETIQUETA, PASO_MIN, PlanoCivil, TipoElem, capacidad, huella, listaTexto, nuevoElemento, ocupados,
  planoInicial, problemas, puestos, sentados, sentar, sentarAutomatico,
} from "./plano";

const ESC = 100;   // 1 m = 100 unidades del SVG
const COLOR: Record<TipoElem, { f: string; b: string; t: string }> = {
  principal: { f: "#f3dcc8", b: "#c9956a", t: "#5c3d2e" },
  redonda:   { f: "#fdf8f3", b: "#c9956a", t: "#5c3d2e" },
  buffet:    { f: "#e3efd9", b: "#7fa66a", t: "#3f5f30" },
  bebidas:   { f: "#dceaf5", b: "#6a93b8", t: "#2f4f6e" },
  otro:      { f: "#eee8e2", b: "#a89a8c", t: "#5c4f44" },
};
const btn: React.CSSProperties = { background: "#fdf8f3", border: "1.5px solid #e8d5c4", color: "#a07855", borderRadius: 9, padding: "8px 10px", fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" };
const btnFuerte: React.CSSProperties = { ...btn, background: "#c9956a", borderColor: "#c9956a", color: "#fff" };
const iniciales = (s: string) => s.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() || "").join("");
const r2 = (n: number) => Math.round(n * 20) / 20;  // de a 5 cm
/** Campo que guarda al salir (no con cada letra, para no gastar una escritura por tecla). */
function AlSalir({ id, valor, alGuardar, ...resto }: { id: string; valor: string; alGuardar: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "id">) {
  return <input key={id + "|" + valor} id={id} defaultValue={valor} {...resto}
    onBlur={(ev) => { if (ev.target.value !== valor) alGuardar(ev.target.value); }}
    onKeyDown={(ev) => { if (ev.key === "Enter") (ev.target as HTMLInputElement).blur(); }}/>;
}

export function MesasCivil({ data, guardar }: { data: CivilData; guardar: (d: CivilData) => Promise<void> }) {
  const guardado = data.plano;
  const [borrador, setBorrador] = useState<PlanoCivil | null>(null);   // mientras se arrastra
  const [inicial] = useState(planoInicial);                             // fijo: si no, cada render traería ids nuevos
  const plano = borrador || guardado || inicial;
  const [sel, setSel] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");
  const svgRef = useRef<SVGSVGElement>(null);
  const arrastre = useRef<{ id: string; dx: number; dy: number; movio: boolean } | null>(null);

  const invitados = data.invitados || [];
  const nombre = (id: number) => invitados.find((i) => i.id === id)?.nombre || "";
  const sentadosSet = useMemo(() => sentados(plano), [plano]);
  const sinMesa = invitados.filter((i) => !sentadosSet.has(i.id));
  const prob = useMemo(() => problemas(plano), [plano]);
  const malos = new Set([...prob.fuera, ...prob.estrechos.flatMap((p) => [p.a, p.b])]);
  const elem = plano.elementos.find((e) => e.id === sel) || null;
  const nom = (id: string) => plano.elementos.find((e) => e.id === id)?.nombre || "";

  const guardarPlano = (p: PlanoCivil) => { setBorrador(null); guardar({ ...data, plano: p }); };
  const cambiarElem = (id: string, cambio: Partial<ElemPlano>) =>
    guardarPlano({ ...plano, elementos: plano.elementos.map((e) => (e.id === id ? { ...e, ...cambio } : e)) });
  const avisar = (t: string) => { setAviso(t); setTimeout(() => setAviso(""), 2500); };

  // ── Arrastrar ──
  const aMetros = (ev: React.PointerEvent) => {
    const svg = svgRef.current!; const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
    const q = pt.matrixTransform(svg.getScreenCTM()!.inverse()); return { x: q.x / ESC, y: q.y / ESC };
  };
  const bajar = (ev: React.PointerEvent, e: ElemPlano) => {
    ev.stopPropagation(); (ev.target as Element).setPointerCapture?.(ev.pointerId);
    const m = aMetros(ev); arrastre.current = { id: e.id, dx: m.x - e.x, dy: m.y - e.y, movio: false }; setSel(e.id);
  };
  const mover = (ev: React.PointerEvent) => {
    const a = arrastre.current; if (!a) return;
    const m = aMetros(ev), e = plano.elementos.find((x) => x.id === a.id)!;
    const x = r2(Math.min(Math.max(m.x - a.dx, 0), plano.ancho)), y = r2(Math.min(Math.max(m.y - a.dy, 0), plano.largo));
    if (x === e.x && y === e.y) return;
    a.movio = true; setBorrador({ ...plano, elementos: plano.elementos.map((z) => (z.id === a.id ? { ...z, x, y } : z)) });
  };
  const soltar = () => { const a = arrastre.current; arrastre.current = null; if (a?.movio && borrador) guardarPlano(borrador); };

  const agregar = (tipo: TipoElem) => {
    const n = plano.elementos.filter((e) => e.tipo === "redonda").length;
    const e = nuevoElemento(tipo, tipo === "redonda" ? `Mesa ${n + 1}` : ETIQUETA[tipo], plano.ancho / 2, plano.largo / 2);
    guardarPlano({ ...plano, elementos: [...plano.elementos, e] }); setSel(e.id);
  };
  const copiar = async () => {
    const t = `🪑 *Mesas boda civil*\n\n${listaTexto(plano, nombre)}${sinMesa.length ? `\n\n*Sin mesa (${sinMesa.length})*\n${sinMesa.map((i) => `• ${i.nombre}`).join("\n")}` : ""}`;
    try { await navigator.clipboard.writeText(t); avisar("Lista copiada: pégala en WhatsApp"); } catch { avisar("No se pudo copiar"); }
  };

  // ── Dibujo ──
  const dibujar = (e: ElemPlano) => {
    const c = COLOR[e.tipo], activo = e.id === sel, malo = malos.has(e.id);
    const borde = malo ? "#d9534f" : activo ? "#8a5a35" : c.b, grosor = activo || malo ? 5 : 3;
    const { w, h } = huella(e);
    const sillas = puestos(e).map((p, i) => {
      const a = e.asientos[i]; const n = a?.inv != null ? nombre(a.inv) : a?.texto || "";
      return (
        <g key={i}>
          <circle cx={p.x * ESC} cy={p.y * ESC} r={19} fill={n ? "#c9956a" : "#fff"} stroke="#c9956a" strokeWidth={2.5}/>
          {n && <text x={p.x * ESC} y={p.y * ESC + 6} textAnchor="middle" fontSize={17} fontWeight={800} fill="#fff" style={{ pointerEvents: "none" }}>{iniciales(n)}</text>}
        </g>
      );
    });
    const texto = e.tipo === "buffet" ? "Ensaladas y carne" : e.tipo === "bebidas" ? "Bebidas y picoteo" : e.nombre;
    const vertical = h > w;   // mesón parado: el texto va girado
    return (
      <g key={e.id} onPointerDown={(ev) => bajar(ev, e)} style={{ cursor: "grab", touchAction: "none" }}>
        {sillas}
        {e.tipo === "redonda"
          ? <circle cx={e.x * ESC} cy={e.y * ESC} r={(e.w / 2) * ESC} fill={c.f} stroke={borde} strokeWidth={grosor}/>
          : <rect x={(e.x - w / 2) * ESC} y={(e.y - h / 2) * ESC} width={w * ESC} height={h * ESC} rx={8} fill={c.f} stroke={borde} strokeWidth={grosor}/>}
        <text x={e.x * ESC} y={e.y * ESC} textAnchor="middle" dominantBaseline="middle" fontSize={e.tipo === "redonda" ? 26 : Math.min(24, (Math.max(w, h) * ESC - 16) / (texto.length * .58))} fontWeight={800} fill={c.t}
          transform={vertical ? `rotate(-90 ${e.x * ESC} ${e.y * ESC})` : undefined} style={{ pointerEvents: "none", userSelect: "none" }}>
          {texto}
        </text>
        {e.tipo === "redonda" && <text x={e.x * ESC} y={e.y * ESC + 30} textAnchor="middle" fontSize={18} fill="#a07855" style={{ pointerEvents: "none" }}>
          {e.asientos.filter((a) => a && (a.inv != null || a.texto)).length}/{e.asientos.length}</text>}
      </g>
    );
  };

  // reglas de metro cada 1 m
  const grilla: React.ReactNode[] = [];
  for (let x = 1; x < plano.ancho; x++) grilla.push(<line key={"x" + x} x1={x * ESC} y1={0} x2={x * ESC} y2={plano.largo * ESC} stroke="#efe4d8" strokeWidth={1.5}/>);
  for (let y = 1; y < plano.largo; y++) grilla.push(<line key={"y" + y} x1={0} y1={y * ESC} x2={plano.ancho * ESC} y2={y * ESC} stroke="#efe4d8" strokeWidth={1.5}/>);

  const cap = capacidad(plano), ocu = ocupados(plano);

  return (
    <div>
      {/* Resumen */}
      <Card style={{ background: "linear-gradient(135deg,#fff8f0,#fbefe4)", marginBottom: 12, padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <div><div style={{ fontSize: 10, color: "#a07855" }}>Puestos</div><div style={{ fontSize: 22, fontWeight: 700, color: "#5c3d2e" }}>{cap}</div></div>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 10, color: "#6aaa96" }}>Ocupados</div><div style={{ fontSize: 22, fontWeight: 700, color: "#6aaa96" }}>{ocu}</div></div>
          <div style={{ textAlign: "right" }}><div style={{ fontSize: 10, color: "#c9956a" }}>Invitados sin mesa</div><div style={{ fontSize: 22, fontWeight: 700, color: "#c9956a" }}>{sinMesa.length}</div></div>
        </div>
        {invitados.length > cap - 6 && <div style={{ fontSize: 11, color: "#b5523b", marginTop: 6 }}>Hay {invitados.length} invitados en la lista y {cap - 6} sillas en las mesas: falta espacio.</div>}
      </Card>

      {/* Plano */}
      <Card style={{ padding: 10, marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "#a07855", marginBottom: 6, lineHeight: 1.4 }}>
          Arrastra las mesas y mesones. Tócalos para sentar a la gente. Cada cuadro es 1 m.
        </div>
        <div style={{ overflowX: "auto" }}>
          <svg ref={svgRef} viewBox={`-30 -30 ${plano.ancho * ESC + 60} ${plano.largo * ESC + 60}`} onPointerMove={mover} onPointerUp={soltar} onPointerCancel={soltar}
            onPointerDown={() => setSel(null)} style={{ width: "100%", minWidth: 320, display: "block", touchAction: "none", userSelect: "none" }}>
            <rect x={0} y={0} width={plano.ancho * ESC} height={plano.largo * ESC} fill="#fffdf9" stroke="#c9b29a" strokeWidth={4} rx={6}/>
            {grilla}
            <text x={plano.ancho * ESC / 2} y={-8} textAnchor="middle" fontSize={16} fill="#a07855">{plano.ancho} m</text>
            <text x={-10} y={plano.largo * ESC / 2} textAnchor="middle" fontSize={16} fill="#a07855" transform={`rotate(-90 -10 ${plano.largo * ESC / 2})`}>{plano.largo} m</text>
            {plano.elementos.map(dibujar)}
          </svg>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          <button style={btn} onClick={() => agregar("redonda")}>+ Mesa redonda</button>
          <button style={btn} onClick={() => agregar("otro")}>+ Mesón</button>
          {!plano.elementos.some((e) => e.tipo === "buffet") && <button style={btn} onClick={() => agregar("buffet")}>+ Ensaladas y carne</button>}
          {!plano.elementos.some((e) => e.tipo === "bebidas") && <button style={btn} onClick={() => agregar("bebidas")}>+ Bebidas y picoteo</button>}
        </div>
      </Card>

      {/* Avisos de paso */}
      {(prob.estrechos.length > 0 || prob.fuera.length > 0) && (
        <Card style={{ background: "#fdf0ee", border: "1px solid #f0c8c0", padding: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#b5523b", marginBottom: 4 }}>Ojo con los pasillos</div>
          {prob.estrechos.map((p, i) => <div key={i} style={{ fontSize: 11.5, color: "#8a3f2e" }}>
            {nom(p.a)} y {nom(p.b)}: {p.paso <= 0 ? "se topan" : `quedan ${Math.round(p.paso * 100)} cm`} (mínimo {PASO_MIN * 100} cm para pasar con plato)</div>)}
          {prob.fuera.map((id) => <div key={id} style={{ fontSize: 11.5, color: "#8a3f2e" }}>{nom(id)} se sale del lugar</div>)}
        </Card>
      )}

      {/* Mesa elegida */}
      {elem && (
        <Card style={{ padding: 14, marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 10 }}>
            <AlSalir id="mesa-nombre" valor={elem.nombre} alGuardar={(v) => cambiarElem(elem.id, { nombre: v.trim() || elem.nombre })}
              style={{ flex: 1, boxSizing: "border-box", background: "#fdf8f3", border: "1.5px solid #e8d5c4", borderRadius: 9, padding: "8px 10px", fontSize: 14, fontWeight: 700, color: "#5c3d2e", fontFamily: "inherit", minWidth: 0 }}/>
            <button style={btn} onClick={() => setSel(null)}>Listo</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {elem.tipo !== "redonda" && <button style={btn} onClick={() => cambiarElem(elem.id, { rot: (((elem.rot + 90) % 360) as ElemPlano["rot"]) })}>↻ Girar</button>}
            {(elem.tipo === "redonda" || elem.tipo === "principal") && <>
              <button style={btn} onClick={() => elem.asientos.length > 1 && cambiarElem(elem.id, { asientos: elem.asientos.slice(0, -1) })}>− Silla</button>
              <button style={btn} onClick={() => cambiarElem(elem.id, { asientos: [...elem.asientos, null] })}>+ Silla</button>
            </>}
            {elem.tipo !== "redonda" && <>
              <button style={btn} onClick={() => elem.w > 1 && cambiarElem(elem.id, { w: r2(elem.w - 0.2) })}>− Largo</button>
              <button style={btn} onClick={() => cambiarElem(elem.id, { w: r2(elem.w + 0.2) })}>+ Largo</button>
              <span style={{ fontSize: 11, color: "#a07855", alignSelf: "center" }}>{elem.w.toFixed(1).replace(".", ",")} × {elem.h.toFixed(1).replace(".", ",")} m</span>
            </>}
            <button style={{ ...btn, color: "#b5523b", borderColor: "#f0c8c0", marginLeft: "auto" }}
              onClick={() => { guardarPlano({ ...plano, elementos: plano.elementos.filter((e) => e.id !== elem.id) }); setSel(null); }}>Quitar</button>
          </div>
          {elem.asientos.length > 0 ? (
            <div style={{ display: "grid", gap: 6 }}>
              {elem.asientos.map((a, i) => {
                const val = a?.inv != null && nombre(a.inv) ? `i${a.inv}` : a?.texto != null ? "t" : "";
                const libres = invitados.filter((x) => !sentadosSet.has(x.id) || x.id === a?.inv).sort((x, y) => Number(y.confirmado) - Number(x.confirmado));
                return (
                  <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ width: 22, fontSize: 11, color: "#a07855", textAlign: "right" }}>{i + 1}</span>
                    <select id={`puesto-${elem.id}-${i}`} value={val} onChange={(ev) => {
                      const v = ev.target.value;
                      guardarPlano(sentar(plano, elem.id, i, v === "" ? null : v === "t" ? { texto: "" } : { inv: Number(v.slice(1)) }));
                    }} style={{ flex: 1, minWidth: 0, background: "#fdf8f3", border: "1.5px solid #e8d5c4", borderRadius: 9, padding: "8px", fontSize: 13, color: "#5c3d2e", fontFamily: "inherit" }}>
                      <option value="">— libre —</option>
                      <option value="t">✏️ Escribir un nombre…</option>
                      {libres.map((x) => <option key={x.id} value={`i${x.id}`}>{x.nombre}{x.confirmado ? " ✓" : ""}</option>)}
                    </select>
                    {val === "t" && <AlSalir id={`texto-${elem.id}-${i}`} valor={a?.texto || ""} placeholder="Nombre" autoFocus={!a?.texto} alGuardar={(v) => guardarPlano(sentar(plano, elem.id, i, { texto: v.trim() }))}
                      style={{ flex: 1, minWidth: 0, boxSizing: "border-box", background: "#fff", border: "1.5px solid #e8d5c4", borderRadius: 9, padding: "8px", fontSize: 13, color: "#5c3d2e", fontFamily: "inherit" }}/>}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ fontSize: 11.5, color: "#a07855", lineHeight: 1.5 }}>
              {elem.tipo === "buffet" ? "Autoservicio: deja al menos 1,2 m libres por delante para la fila, y ojalá lejos del mesón de los novios para que la fila no les tape."
                : elem.tipo === "bebidas" ? "Bebidas y picoteo: conviene al lado opuesto de las ensaladas, así la gente no se junta toda en el mismo rincón."
                : "Mesón sin sillas."}
            </div>
          )}
        </Card>
      )}

      {/* Acciones */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        <button style={btnFuerte} onClick={() => { const antes = sinMesa.length; const p = sentarAutomatico(plano, [...invitados].sort((x, y) => Number(y.confirmado) - Number(x.confirmado))); guardarPlano(p); avisar(`Sentados ${antes - invitados.filter((i) => !sentados(p).has(i.id)).length} invitados`); }}
          disabled={!sinMesa.length}>Sentar a los que faltan</button>
        <button style={btn} onClick={copiar}>Copiar lista para WhatsApp</button>
        <label style={{ ...btn, display: "inline-flex", alignItems: "center", gap: 4 }}>Lugar
          <AlSalir id="lugar-ancho" type="number" min={4} max={40} valor={String(plano.ancho)} alGuardar={(v) => guardarPlano({ ...plano, ancho: Math.min(40, Math.max(4, Number(v) || 4)) })} style={{ width: 44, border: "1px solid #e8d5c4", borderRadius: 6, padding: 2, fontFamily: "inherit" }}/>
          ×<AlSalir id="lugar-largo" type="number" min={4} max={40} valor={String(plano.largo)} alGuardar={(v) => guardarPlano({ ...plano, largo: Math.min(40, Math.max(4, Number(v) || 4)) })} style={{ width: 44, border: "1px solid #e8d5c4", borderRadius: 6, padding: 2, fontFamily: "inherit" }}/> m
        </label>
      </div>
      {aviso && <div style={{ fontSize: 12, color: "#3f7a5e", fontWeight: 700, marginBottom: 10 }}>{aviso}</div>}

      {/* Sin mesa */}
      {sinMesa.length > 0 && (
        <Card style={{ padding: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#5c3d2e", marginBottom: 6 }}>Sin mesa ({sinMesa.length})</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {sinMesa.map((i) => <span key={i.id} style={{ fontSize: 11.5, background: i.confirmado ? "#e6f3ee" : "#fdf8f3", border: "1px solid #e8d5c4", borderRadius: 20, padding: "3px 9px", color: "#5c3d2e" }}>{i.nombre}</span>)}
          </div>
        </Card>
      )}
      {guardado && (
        <button style={{ ...btn, fontSize: 10.5, opacity: .8 }} onClick={() => { if (window.confirm("¿Volver al plano de partida? Se pierde dónde está sentada cada persona.")) { guardarPlano(planoInicial()); setSel(null); } }}>
          Volver al plano de partida
        </button>
      )}
    </div>
  );
}
