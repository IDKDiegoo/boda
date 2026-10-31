import assert from "node:assert/strict";
import { RUTAS, rutaDe, tabDeRuta, subRuta, conParametro } from "../src/base/rutas.js";
assert.equal(rutaDe("mesas"), "/mesas"); assert.equal(rutaDe("juegos", "impostor"), "/juegos/impostor"); assert.equal(rutaDe("nada"), "/inicio");
assert.equal(tabDeRuta("/mesas"), "mesas"); assert.equal(tabDeRuta("/juegos/impostor?x=1"), "juegos"); assert.equal(tabDeRuta("/"), null); assert.equal(tabDeRuta("/i/ABC"), null);
assert.equal(tabDeRuta("/Luna-De-Miel"), "luna");
assert.deepEqual(subRuta("/juegos/nueva-rosco"), ["nueva-rosco"]);
for (const [id, r] of Object.entries(RUTAS)) { assert.equal(tabDeRuta("/" + r), id); assert.notEqual(r, "i"); assert.notEqual(r, "api"); assert.notEqual(r, "m"); }
assert.equal(conParametro("https://x.cl/?mesa=2&b=demo", "ver", "bingo"), "/?mesa=2&b=demo&ver=bingo");
assert.equal(conParametro("https://x.cl/?mesa=2&ver=bingo", "ver", ""), "/?mesa=2");
console.log("rutas ok");
