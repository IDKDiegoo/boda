import { barajar, sacar, penitencia, conNombres, repartirImpostor, carton, hayLinea } from "../src/pantallas/juegos/logica.js";
let ok=0, mal=0;
const t=(n,r,e)=>{ const b=JSON.stringify(r)===JSON.stringify(e); b?ok++:mal++; console.log(`  ${b?"✓":"✗"} ${n}${b?"":`   esperado ${JSON.stringify(e)}, dio ${JSON.stringify(r)}`}`); };
const cartas=[1,2,3,4,5].map(i=>({id:"c"+i}));
let u=[], vistos=new Set();
for (let i=0;i<5;i++){ const r=sacar(cartas,u); u=r.usadas; vistos.add(r.carta.id); }
t("no repite hasta acabar el mazo", vistos.size, 5);
const r6=sacar(cartas,u); t("al acabarse vuelve a empezar", r6.usadas.length, 1);
t("mazo vacío", sacar([],[]).carta, null);
t("barajar no pierde ni duplica", barajar([1,2,3,4,5]).sort().join(), "1,2,3,4,5");
t("penitencia con alcohol (defecto)", penitencia("duro",{alcohol:true,bebida:"pisco"}), "Toma 1 corto de pisco");
t("penitencia plural", penitencia("sinfiltro",{alcohol:true}), "Toma 3 cortos");
t("penitencia con cantidad propia", penitencia("suave",{alcohol:true,cantidades:{suave:3},bebida:"cerveza"}), "Toma 3 sorbos de cerveza");
t("sin alcohol", penitencia("duro",{alcohol:false}), "Pierdes el punto y tu pareja elige tu castigo");
t("nombres", conNombres("{yo} besa a {tu}","Diego","Camila"), "Diego besa a Camila");
const rep=repartirImpostor(["A","B","C","D","E"],"Torta",1);
t("impostor: 1 sin palabra", rep.filter(x=>x.palabra===null).length, 1);
t("impostor: el resto la tiene", rep.filter(x=>x.palabra==="Torta").length, 4);
t("impostor: no más impostores que jugadores-2", repartirImpostor(["A","B","C"],"x",5).filter(x=>!x.palabra).length, 1);
const c=carton(Array.from({length:40},(_,i)=>"f"+i));
t("cartón 25 con centro libre", [c.length, c[12]], [25,"★ LIBRE"]);
t("cartón sin repetidos", new Set(c).size, 25);
t("línea con centro", hayLinea([10,11,13,14]), true);
t("diagonal", hayLinea([0,6,18,24]), true);
t("sin línea", hayLinea([0,1,2,3]), false);
console.log(`\n${ok} ok, ${mal} mal`); if (mal) process.exit(1);

