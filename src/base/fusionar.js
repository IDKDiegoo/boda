/**
 * GUARDAR SIN PISAR A NADIE (24-oct-2026)
 *
 * 🔴 Cada cambio subía el documento ENTERO tal como lo tenía ese teléfono. Si Diego y Camila
 * editaban a la vez (uno agrega un invitado, la otra marca una tarea), el que guardaba segundo
 * borraba lo del primero sin que nadie se enterara. Ahora se calcula QUÉ cambió en este teléfono
 * (de `antes` a `despues`) y solo eso se aplica sobre lo que hay en el servidor en ese momento.
 *
 * · Listas de objetos con `id` (invitados, gastos, tareas…): agregados, borrados y los campos
 *   tocados de cada uno.
 * · Cualquier otro campo: si cambió acá, se sube; si no, queda lo del servidor.
 * Igual a src/datos/fusionarLista.js del SaaS. Pruebas: node test/fusionar.test.mjs
 */
const canon = (v) => JSON.stringify(v, (_, x) =>
  x && typeof x === "object" && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort()) : x);
const idDe = (x) => String(x && x.id);
const conIds = (l) => Array.isArray(l) && l.every((x) => x && typeof x === "object" && x.id != null && x.id !== "");

export function cambiosDeLista(antes = [], despues = []) {
  const A = new Map((antes || []).map((x) => [idDe(x), x]));
  const D = new Map((despues || []).map((x) => [idDe(x), x]));
  const nuevos = [], borrados = [], parches = [];
  for (const [k, d] of D) {
    const a = A.get(k);
    if (!a) { nuevos.push(d); continue; }
    const p = {};
    for (const f of new Set([...Object.keys(a), ...Object.keys(d)])) {
      if (canon(a[f]) !== canon(d[f])) p[f] = f in d ? d[f] : null;
    }
    if (Object.keys(p).length) parches.push([k, p]);
  }
  for (const k of A.keys()) if (!D.has(k)) borrados.push(k);
  return { nuevos, borrados, parches };
}

export function aplicarCambios(servidor = [], c) {
  const P = new Map(c.parches), B = new Set(c.borrados);
  const out = (servidor || []).filter((x) => !B.has(idDe(x)))
    .map((x) => { const p = P.get(idDe(x)); return p ? { ...x, ...p } : x; });
  const usados = new Set(out.map(idDe));
  for (const n of c.nuevos) if (!usados.has(idDe(n))) { out.push(n); usados.add(idDe(n)); }
  return out;
}

/** El documento que hay que dejar en el servidor: lo de allá + lo que cambió acá. */
export function fusionarDoc(servidor, antes, despues) {
  const S = servidor || {}, A = antes || {}, D = despues || {};
  const out = { ...S };
  for (const k of new Set([...Object.keys(A), ...Object.keys(D)])) {
    if (canon(A[k]) === canon(D[k])) continue;                         // acá no se tocó
    if (!(k in D)) { delete out[k]; continue; }
    if (conIds(A[k] || []) && conIds(D[k]) && (S[k] == null || conIds(S[k])))
      out[k] = aplicarCambios(S[k] || [], cambiosDeLista(A[k] || [], D[k]));
    else out[k] = D[k];
  }
  return out;
}
