// Boda DEMO de My Wedding (para el video de venta): pareja y datos ficticios.
const admin=require("/Users/idk/ARAINv3/node_modules/firebase-admin");
if (!process.env.FIRESTORE_EMULATOR_HOST) admin.initializeApp({credential:admin.credential.cert(require("/Users/idk/ARAINv3/bot/firebase-service-account.json"))});
else admin.initializeApp({projectId:"arain-database"});
const ID="demo-valentina-matias", B=`bodas/${ID}/datos`;
const nombres=["Javiera Soto","Tomás Muñoz","Catalina Rojas","Benjamín Díaz","Fernanda Contreras","Joaquín Silva","Antonia Morales","Vicente Sepúlveda","Isidora Fuentes","Martín Araya",
 "Florencia Castillo","Agustín Espinoza","Josefa Reyes","Lucas Valenzuela","Emilia Torres","Maximiliano Pizarro","Trinidad Vargas","Cristóbal Herrera","Amanda Núñez","Sebastián Carrasco",
 "Renata Gutiérrez","Ignacio Tapia","Sofía Riquelme","Diego Figueroa","Constanza Bravo","Felipe Lagos","Magdalena Vera","Nicolás Cáceres","Elena Paredes","Gaspar Jara","Rosa Medina","Héctor Medina"];
let n=0; const id=()=>Date.now()+(++n);
(async()=>{ const db=admin.firestore(), auth=admin.auth();
  await db.doc(`bodas/${ID}`).set({nombre:"Valentina & Matías",fecha:"2027-03-20T18:30:00",estado:"activa",demo:true,creada:new Date().toISOString(),
    modulos:{organizacion:true,invitaciones:true,fotos:true,luna:true,juegos:true,juegosAdultos:false},notas:"Cuenta demo para videos y ventas (datos ficticios)"});
  const inv=nombres.map((x,i)=>({id:i+1,nombre:x,tipo:i===31?"niño":"adulto",mesa:(i%6)+1,confirmado:i<20?"si":i<26?"pendiente":"no",...(i%7===0?{dieta:"Vegetariana"}:{})}));
  await db.doc(`${B}/invitados`).set({invitados:inv});
  await db.doc(`${B}/mesaspos`).set({mesas:[1,2,3,4,5,6].map(k=>({id:k,numero:k,x:60+((k-1)%3)*110,y:80+Math.floor((k-1)/3)*130,forma:"circular"}))});
  await db.doc(`${B}/proveedores`).set({proveedores:[
    {id:id(),categoria:"Lugar",nombre:"Casona Los Almendros",descripcion:"Salón y jardín para 120 personas, Pirque",costo:3200000,extras:[{desc:"Hora extra",monto:180000}],estado:"confirmado",contacto:"+56 9 1234 5678"},
    {id:id(),categoria:"Catering",nombre:"Banquetería Sabores del Valle",descripcion:"Cóctel + cena 3 tiempos + bar abierto",costo:4800000,extras:[],estado:"confirmado"},
    {id:id(),categoria:"Fotografía",nombre:"Luz de Tarde Fotografía",descripcion:"Cobertura completa + sesión pre boda",costo:950000,extras:[{desc:"Álbum impreso",monto:150000}],estado:"confirmado"},
    {id:id(),categoria:"Música",nombre:"DJ Andrés Beat",descripcion:"Sonido, iluminación y 6 horas de música",costo:650000,extras:[],estado:"pendiente"},
    {id:id(),categoria:"Decoración",nombre:"Flores de Campo",descripcion:"Arco floral, centros de mesa y ramo",costo:780000,extras:[],estado:"pendiente"}]});
  await db.doc(`${B}/gastos`).set({gastos:[
    {id:id(),nombre:"Vestido de novia",categoria:"Vestuario",monto:890000,pagado:true},{id:id(),nombre:"Traje del novio",categoria:"Vestuario",monto:420000,pagado:true},
    {id:id(),nombre:"Anillos",categoria:"Otro",monto:560000,pagado:true},{id:id(),nombre:"Torta 3 pisos",categoria:"Torta",monto:240000,pagado:false},
    {id:id(),nombre:"Recuerdos para invitados",categoria:"Recuerdos",monto:150000,pagado:false},{id:id(),nombre:"Transporte invitados",categoria:"Transporte",monto:300000,pagado:false}]});
  await db.doc(`${B}/canciones`).set({canciones:[
    {id:id(),titulo:"Perfect",artista:"Ed Sheeran",momento:"Primer baile"},{id:id(),titulo:"A Thousand Years",artista:"Christina Perri",momento:"Entrada novios"},
    {id:id(),titulo:"Vivir mi vida",artista:"Marc Anthony",momento:"Baile general"},{id:id(),titulo:"La Bamba",artista:"Los Lobos",momento:"Baile general"}]});
  await db.doc(`${B}/regalos`).set({regalos:[
    {id:id(),nombre:"Batidora planetaria",precio:189990,prioridad:"alta",recibido:false},{id:id(),nombre:"Juego de sábanas king",precio:59990,prioridad:"media",recibido:true},
    {id:id(),nombre:"Cafetera espresso",precio:129990,prioridad:"alta",recibido:false},{id:id(),nombre:"Set de copas",precio:34990,prioridad:"baja",recibido:false}]});
  await db.doc(`${B}/checklist`).set({tareas:[
    {id:id(),titulo:"Reservar el lugar",categoria:"Matrimonio",hecho:true,prioridad:"alta"},{id:id(),titulo:"Contratar fotógrafo",categoria:"Fotografía",hecho:true,prioridad:"alta"},
    {id:id(),titulo:"Prueba de vestido",categoria:"Vestimenta",hecho:false,prioridad:"media",fecha:"2026-12-10"},{id:id(),titulo:"Degustación del menú",categoria:"Catering",hecho:false,prioridad:"alta",fecha:"2027-01-15"},
    {id:id(),titulo:"Mandar las invitaciones",categoria:"Matrimonio",hecho:false,prioridad:"alta",fecha:"2027-01-20"},{id:id(),titulo:"Elegir canciones del baile",categoria:"Música",hecho:false,prioridad:"baja"}]});
  await db.doc(`${B}/decoraciones`).set({items:[
    {id:id(),nombre:"Arco de flores blancas",categoria:"Arcos y estructuras",cantidad:1,precio:180000,comprado:false},{id:id(),nombre:"Velas flotantes",categoria:"Iluminación",cantidad:60,precio:1200,comprado:true},
    {id:id(),nombre:"Centros de mesa eucalipto",categoria:"Centros de mesa",cantidad:6,precio:25000,comprado:false}]});
  await db.doc(`${B}/luna`).set({items:[
    {id:id(),categoria:"Vuelos",descripcion:"Santiago – Punta Cana ida y vuelta",monto:1450000,confirmado:true},{id:id(),categoria:"Alojamiento",descripcion:"Resort todo incluido, 7 noches",monto:2100000,confirmado:false}]});
  await db.doc(`${B}/civil`).set({invitados:inv.map(i=>({id:i.id,nombre:i.nombre,confirmado:i.confirmado==="si"})),gastos:[]});
  await db.doc(`${B}/invitacion`).set({lugarNombre:"Casona Los Almendros",direccion:"Camino El Principal 2350, Pirque",comoLlegar:"A 40 minutos de Santiago por Av. Concha y Toro. Hay estacionamiento.",
    mapsUrl:"https://maps.google.com/?q=Pirque",hora:"18:30",limite:"2027-02-20",mensaje:"Queremos que nos acompañes en el día más importante de nuestras vidas.",
    programa:[{hora:"18:30",actividad:"Ceremonia",icono:"anillos"},{hora:"19:30",actividad:"Cóctel",icono:"copas"},{hora:"21:00",actividad:"Cena",icono:"plato"},{hora:"23:00",actividad:"Fiesta",icono:"musica"}],musicaUrl:"",musicaInicio:""});
  const L="abcdefghijkmnpqrstuvwxyz23456789"; const cod=()=>Array.from({length:7},()=>L[Math.floor(Math.random()*L.length)]).join("");
  const batch=db.batch();
  inv.slice(0,24).forEach((i,k)=>{ const c=cod(); const r=k<14?{asiste:true,fecha:new Date().toISOString(),...(k%3===0?{cancion:"Despacito",deseo:"¡Que sean muy felices!"}:{})}:k<17?{asiste:false,fecha:new Date().toISOString(),deseo:"Los queremos, no podremos ir 💛"}:null;
    batch.set(db.doc(`${B}/invitacion/invitados/${c}`),{para:i.nombre,invitadoId:i.id,enviada:k<20,vistas:k<18?1+k%3:0,...(r?{respuesta:r}:{})});
    batch.set(db.doc(`invitaciones/${c}`),{bodaId:ID}); });
  await batch.commit();
  // la cuenta demo
  const email="demo@mywedding.invalid"; let u=await auth.getUserByEmail(email).catch(()=>null);
  if (u) await auth.updateUser(u.uid,{password:"MyWedding2026"}); else u=await auth.createUser({email,password:"MyWedding2026",displayName:"Demo"});
  await auth.setCustomUserClaims(u.uid,{bodaId:ID,rolBoda:"novios"});
  await db.doc(`usuarios_boda/${u.uid}`).set({usuario:"demo",nombre:"Demo (Valentina & Matías)",email,bodaId:ID,rolBoda:"novios",creado:new Date().toISOString()});
  console.log("✓ demo lista:",ID,"·",inv.length,"invitados · 24 invitaciones"); process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
