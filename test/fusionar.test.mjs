import { fusionarDoc } from "../src/base/fusionar.js";
let ok=0, mal=0;
const t=(n,r,e)=>{ const b=JSON.stringify(r)===JSON.stringify(e); b?ok++:mal++; console.log(`  ${b?"✓":"✗"} ${n}${b?"":`\n     esperado ${JSON.stringify(e)}\n     dio      ${JSON.stringify(r)}`}`); };
const base = { invitados:[{id:1,nombre:"Ana"},{id:2,nombre:"Beto"}], gastos:[{id:9,monto:100}], titulo:"Civil" };
// Camila agregó a Carla (ya está en el servidor); Diego, con la versión vieja, marca a Beto.
const servidor = { ...base, invitados:[...base.invitados,{id:3,nombre:"Carla"}] };
const diego = { ...base, invitados:[{id:1,nombre:"Ana"},{id:2,nombre:"Beto",confirmado:true}] };
t("no borra lo que agregó el otro", fusionarDoc(servidor, base, diego).invitados, [{id:1,nombre:"Ana"},{id:2,nombre:"Beto",confirmado:true},{id:3,nombre:"Carla"}]);
t("lo que no tocó queda como en el servidor", fusionarDoc({...servidor,gastos:[{id:9,monto:200}]}, base, diego).gastos, [{id:9,monto:200}]);
t("borrar uno", fusionarDoc(servidor, base, {...base, invitados:[{id:1,nombre:"Ana"}]}).invitados.map(x=>x.id), [1,3]);
t("agregar uno", fusionarDoc(servidor, base, {...base, invitados:[...base.invitados,{id:4,nombre:"Dani"}]}).invitados.map(x=>x.id), [1,2,3,4]);
t("campo simple cambiado", fusionarDoc(servidor, base, {...base, titulo:"Boda civil"}).titulo, "Boda civil");
t("campo nuevo", fusionarDoc(servidor, base, {...base, cronograma:[{id:1,hora:"13:00"}]}).cronograma, [{id:1,hora:"13:00"}]);
t("servidor vacío (documento nuevo)", fusionarDoc(null, {}, {invitados:[{id:1}]}), {invitados:[{id:1}]});
t("lista sin ids se reemplaza entera", fusionarDoc({tags:["a"]}, {tags:["a"]}, {tags:["a","b"]}).tags, ["a","b"]);
t("dos editan campos distintos del mismo", fusionarDoc({invitados:[{id:1,nombre:"Ana",mesa:3}]}, {invitados:[{id:1,nombre:"Ana",mesa:1}]}, {invitados:[{id:1,nombre:"Ana María",mesa:1}]}).invitados, [{id:1,nombre:"Ana María",mesa:3}]);
t("borrado por el otro no revive con un parche", fusionarDoc({invitados:[]}, {invitados:[{id:1,n:"a"}]}, {invitados:[{id:1,n:"b"}]}).invitados, []);
console.log(`\n${ok} ok, ${mal} mal`); if (mal) process.exit(1);
