import { BANCO, LETRAS_ROSCO, armarRosco, palabrasPuzzle, CUATRO } from "../src/pantallas/juegos/contenidoPasapalabra";
let mal = 0;
const sin = (s: string) => s.toUpperCase().replace(/Ñ/g, "\u0001").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\u0001/g, "Ñ");
for (const t of ["general", "futbol"] as const) {
  const faltan = LETRAS_ROSCO.filter(l => !BANCO[t].some(x => x.l === l));
  const malas = BANCO[t].filter(x => x.c ? !sin(x.r).includes(x.l) : !sin(x.r).startsWith(x.l));
  if (faltan.length || malas.length) mal++;
  console.log(t, "definiciones", BANCO[t].length, "| faltan:", faltan.join(",") || "ninguna", "| no calzan con su letra:", malas.map(x => x.l + ":" + x.r).join(" ") || "ninguna");
  for (const n of [1, 2, 3] as const) { const r = armarRosco(t, n); const rep = r.length - new Set(r).size; if (rep || r.length !== 25) mal++; console.log("  nivel", n, "niveles usados", r.map(i => BANCO[t][i].n).join(""), "| palabras para puzzles", palabrasPuzzle(t, n).length); }
  const q = CUATRO[t]; const dup = q.filter(x => new Set(x.slice(1, 5)).size !== 4); if (dup.length) mal++;
  console.log("  una de cuatro:", q.length, "preguntas (fácil/normal/difícil", [1, 2, 3].map(n => q.filter(x => x[5] === n).length).join("/") + ")");
}
console.log(mal ? `${mal} problemas` : "todo bien"); process.exit(mal ? 1 : 0);
