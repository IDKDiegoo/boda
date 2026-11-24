import { planoInicial, problemas, puestos, capacidad, ocupados, sentarAutomatico, sentar, quitarInvitado, sentados, listaTexto, nuevoElemento } from "../src/pantallas/civil/plano.ts";
let mal = 0; const ok = (c: boolean, m: string) => { if (!c) mal++; console.log(c ? "✓" : "✗", m); };
const p = planoInicial();
ok(p.elementos.filter(e => e.tipo === "redonda").length === 5 && p.elementos.filter(e => e.tipo === "redonda").every(e => e.asientos.length === 7), "5 mesas redondas de 7");
ok(capacidad(p) === 41, "41 puestos (35 + 6 del mesón)");
ok(ocupados(p) === 6, "el mesón parte con los novios y los 4 padres");
const pr = problemas(p); ok(!pr.estrechos.length && !pr.fuera.length, "el plano de partida tiene pasos de 90 cm y nada se sale: " + JSON.stringify(pr));
// mesón principal: todas las sillas atrás (y menor), en cualquier rotación quedan del mismo lado
const m = p.elementos[0]; ok(puestos(m).every(q => q.y < m.y), "sillas del mesón todas del lado de atrás");
const m90 = { ...m, rot: 90 as const }; ok(puestos(m90).every(q => q.x > m.x), "girado 90°, las sillas giran con él");
// pegar dos mesas avisa
const junto = { ...p, elementos: [...p.elementos, nuevoElemento("redonda", "Mesa 6", 3.6, 5.6)] };
ok(problemas(junto).estrechos.length > 0, "una mesa encima de otra avisa paso estrecho");
ok(problemas({ ...p, elementos: [nuevoElemento("buffet", "x", 0.2, 5)] }).fuera.length === 1, "un mesón fuera del lugar avisa");
// sentar
const inv = Array.from({ length: 40 }, (_, i) => ({ id: i + 1 }));
const a = sentarAutomatico(p, inv); ok(ocupados(a) === 41 && sentados(a).size === 35, "automático llena las 35 sillas de las redondas");
ok(sentados(a).size === new Set([...sentados(a)]).size, "nadie repetido");
const r = a.elementos[1]; const b = sentar(a, r.id, 0, { inv: 40 });
ok(sentados(b).has(40) && b.elementos[1].asientos[0]?.inv === 40, "sentar a alguien a mano");
const c = sentar(b, a.elementos[2].id, 3, { inv: 40 });
ok(c.elementos[1].asientos[0] === null && c.elementos[2].asientos[3]?.inv === 40, "moverlo lo saca de su puesto anterior");
ok(!sentados(quitarInvitado(c, 40)).has(40), "quitar invitado");
ok(listaTexto(p, () => "").includes("*Novios y padres* (6/6)"), "lista para WhatsApp");
console.log(mal ? `${mal} problemas` : "todo bien"); process.exit(mal ? 1 : 0);
