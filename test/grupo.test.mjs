// ── juegos en grupo ──
import assert from "node:assert/strict";
import { elegirPalabra, repartirSala, contarVotos, armarEquipos, siguientePendiente, jugarRosco, puntajeRosco, pausarRosco, seguirRosco, desordenar, estadoAhorcado } from "../src/pantallas/juegos/logica.js";
{
  const temas = { A: ["uno", "dos", "tres"], B: ["x"] };
  for (let i = 0; i < 30; i++) { const e = elegirPalabra(temas, "Todos"); assert.equal(e.cat, "A"); assert.notEqual(e.palabra, e.otra); }
  const r = repartirSala(["a", "b", "c", "d"], "torta", 1);
  assert.equal(r.imp.length, 1); assert.equal(r.pal[r.imp[0]], null);
  assert.equal(Object.values(r.pal).filter(x => x === "torta").length, 3); assert.equal(r.orden.length, 4);
  const inf = repartirSala(["a", "b", "c"], "torta", 3, "ramo");
  assert.equal(inf.imp.length, 1, "con 3 jugadores, máximo 1 impostor"); assert.equal(inf.pal[inf.imp[0]], "ramo");
  const v = contarVotos({ a: "b", c: "b", b: "a", d: "zz" }, ["a", "b", "c", "d"]);
  assert.deepEqual(v[0], { pid: "b", n: 2 }); assert.equal(v.length, 2);
  const eq = armarEquipos(["a", "b", "c", "d", "e"]);
  assert.equal(eq.cola.length, 5); assert.equal(Object.values(eq.eq).filter(x => x === "A").length, 3);
  for (let i = 1; i < eq.cola.length - 1; i++) assert.notEqual(eq.eq[eq.cola[i]], eq.eq[eq.cola[i - 1]], "turnos alternados");
  assert.equal(siguientePendiente("o-x-", 1), 3); assert.equal(siguientePendiente("o-xo", 1), 1); assert.equal(siguientePendiente("oxox", 0), -1);
  // rosco de 2 jugadores
  let ron = { est: ["---", "---"], pos: [0, 0], rest: [10000, 10000], turno: 0, desde: 1000, fase: "juego" };
  ron = jugarRosco(ron, "ok", 2000); assert.equal(ron.est[0], "o--"); assert.equal(ron.pos[0], 1); assert.equal(ron.turno, 0); assert.equal(ron.rest[0], 9000);
  ron = jugarRosco(ron, "pasa", 3000); assert.equal(ron.turno, 1); assert.equal(ron.pos[0], 2); assert.equal(ron.desde, 0, "al pasar se pausa todo hasta el play");
  assert.equal(ron.rest[0], 8000, "el reloj del que pasó queda detenido");
  ron = seguirRosco(ron, 3500);   // el presentador le da play al otro
  ron = jugarRosco(ron, "mal", 4000); assert.equal(ron.est[1], "x--"); assert.equal(ron.turno, 0); assert.equal(ron.rest[1], 9500); assert.equal(ron.desde, 0, "al fallar también se pausa");
  ron = seguirRosco(ron, 4000);
  const p = pausarRosco(ron, 5000); assert.equal(p.desde, 0); assert.equal(p.rest[0], 7000, "la pausa descuenta lo que corrió");
  ron = seguirRosco(p, 7000); assert.equal(ron.desde, 7000);
  ron = jugarRosco(ron, "ok", 7500); ron = jugarRosco(ron, "ok", 8000);
  assert.equal(ron.est[0], "ooo"); assert.equal(ron.turno, 1, "terminó el 0: le toca al 1");
  ron = { ...ron, desde: 9000 }; ron = jugarRosco(ron, "tiempo", 9500);
  assert.equal(ron.fase, "fin"); assert.deepEqual(puntajeRosco(ron.est[0]), { ok: 3, mal: 0 });
  // un solo jugador: pasapalabra sigue con él
  let solo = { est: ["--"], pos: [0], rest: [5000], turno: 0, desde: 100, fase: "juego" };
  solo = jugarRosco(solo, "pasa", 200); assert.equal(solo.turno, 0); assert.equal(solo.pos[0], 1); assert.equal(solo.desde, 0, "solo: pasapalabra pausa el reloj");
  solo = seguirRosco(solo, 300);
  solo = jugarRosco(solo, "ok", 300); solo = jugarRosco(solo, "mal", 400); assert.equal(solo.fase, "fin");
  const d = desordenar("ANILLO"); assert.equal(d.length, 6); assert.notEqual(d.join(""), "ANILLO"); assert.deepEqual([...d].sort(), [..."ANILLO"].sort());
  assert.deepEqual(desordenar("ANILLO"), desordenar("ANILLO"), "todos los teléfonos ven el mismo desorden");
  let a = estadoAhorcado("TORTA", "TXA"); assert.equal(a.vista.join(""), "T__TA"); assert.equal(a.errores, 1); assert.equal(a.resuelta, false);
  a = estadoAhorcado("TORTA", "TXAOR"); assert.equal(a.resuelta, true);
  console.log("juegos en grupo ok");
}
