// Invitación suelta (sin la app) para una pareja: node scripts/invitaciones/generar.mjs angeles-y-alejandro
//
// Usa LA MISMA invitación de la app (public/invitacion.html: sobre con relieve que se abre, flores que se
// mecen, íconos que se dibujan, itinerario en cinta, confirmación en 4 preguntas, música que suena en
// iPhone), con los datos de parejas/<slug>.json escritos de antemano y sin Firebase:
//  · nombres, monograma, colores y vista previa de WhatsApp quedan puestos en el HTML (WhatsApp no corre
//    JavaScript, y así el sobre no se alcanza a ver con otros nombres ni otro color);
//  · la confirmación se manda a un Google Forms de los novios (google.accion + google.campos) y queda
//    recordada en ese teléfono; sin formulario conectado, avisa que se habilita pronto.
// Sale public/inv/<slug>.html + .jpg (imagen del link). URL: https://boda-eight-psi.vercel.app/<slug>
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, "../..");
const BASE = process.env.BASE_URL || "https://boda-eight-psi.vercel.app";
const slug = process.argv[2];
if (!slug || !/^[a-z0-9-]+-y-[a-z0-9-]+$/.test(slug)) { console.error("Uso: node generar.mjs <ella-y-el>  (minúsculas, sin tildes)"); process.exit(1); }
const c = JSON.parse(readFileSync(join(AQUI, "parejas", slug + ".json"), "utf8"));
const esc = (t) => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const DIAS = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

let html = readFileSync(join(RAIZ, "public/invitacion.html"), "utf8");
const r = (a, b) => { if (!html.includes(a)) throw new Error("No encontré en invitacion.html: " + a.slice(0, 90)); html = html.split(a).join(b); };

const n1 = c.nombre1, n2 = c.nombre2, pareja = `${n1} & ${n2}`;
const inicial = (n) => n[0].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();   // monograma sin tilde: «A A», no «Á A»
const [Y, M, D] = c.fecha.split("-").map(Number), dia = new Date(Date.UTC(Y, M - 1, D, 12));
const cuando = `${DIAS[dia.getUTCDay()]} ${D} de ${MESES[M - 1]} de ${Y}`;
const og = `${BASE}/inv/${slug}.jpg`;

// ── Lo que se ve antes de que corra el JavaScript (y lo que lee WhatsApp) ──
r('<meta property="og:title" content="Diego &amp; Camila · ¡Nos casamos por el civil!">', `<meta property="og:title" content="${esc(pareja)} · ${esc(c.titulo)}">`);
r('<meta property="og:description" content="Viernes 18 de diciembre de 2026 · Lampa. Abre tu invitación y confírmanos.">', `<meta property="og:description" content="${esc(cuando)} · ${esc(c.lugarNombre)}. Abre tu invitación y confírmanos.">`);
r('<meta property="og:image" content="https://boda-eight-psi.vercel.app/pareja.jpg">', `<meta property="og:image" content="${og}">`);
r("<title>Diego &amp; Camila · Civil en Lampa</title>", `<title>${esc(pareja)}</title>`);
r('<span class="d" id="mono-1">D</span><span class="c" id="mono-2">C</span>', `<span class="d" id="mono-1">${esc(inicial(n1))}</span><span class="c" id="mono-2">${esc(inicial(n2))}</span>`);
r('<h1 class="nombres" id="nombres">Diego<span>&amp;</span>Camila</h1>', `<h1 class="nombres" id="nombres">${esc(n1)}<span>&amp;</span>${esc(n2)}</h1>`);
r('<p class="cap" id="titulo-inv">¡Nos casamos por el civil!</p>', `<p class="cap" id="titulo-inv">${esc(c.titulo)}</p>`);
r('<img src="/pareja.jpg" alt="Diego y Camila caminando de la mano por la playa" id="foto">', `<img src="${esc(c.foto || "")}" alt="Foto de ${esc(pareja)}" id="foto">`);
if (!c.foto) r('<svg class="decor" data-ramo="rosas" data-semilla="9"', '<svg class="decor" data-ramo="rosas" data-esquina="1" data-semilla="9"');   // sin foto, el ramo no tapa los nombres
r('<p class="cap" id="pie-nombres">Diego &amp; Camila</p>', `<p class="cap" id="pie-nombres">${esc(pareja)}</p>`);
const pal = c.paleta;
r('<meta name="theme-color" content="#7f8c6c">', `<meta name="theme-color" content="${pal[0]}">`);
r("</head>", `<style>:root{--salvia:${pal[0]};--salvia-2:${pal[1]};--salvia-osc:${pal[2]};--bosque:${pal[3]}}</style><script>window.__PALETA=${JSON.stringify(pal)}</script>\n</head>`);

// ── «Celebra con nosotros» + «¡Prepárate!» (referencia de Donato Planner que eligió Diego, 7-nov):
//    mes en arco, día de la semana | día grande | hora, los novios dibujados, lugar y «Ver mapa»; abajo la
//    cuenta regresiva en una tarjeta de arco con dos puntos entre las cifras. Reemplaza la sección «Faltan».
const MES_CORTO = MESES[M - 1].toUpperCase(), DIA_SEM = DIAS[dia.getUTCDay()].toUpperCase();
const horaBonita = (h) => { const [a, b] = String(h).split(":").map(Number); return `${((a + 11) % 12) + 1}:${String(b || 0).padStart(2, "0")} ${a >= 12 ? "P.M." : "A.M."}`; };
const nuevaFecha = `<section class="faltan fc-seccion" aria-labelledby="t-faltan">
    <article class="tarjeta greige fc revela">
      <span class="filete" aria-hidden="true"></span>
      <span class="sello-pega"><img class="sello-img" data-sello="crema" alt=""></span>
      <h2 class="titulo fc-titulo">Celebra con nosotros</h2>
      <svg class="fc-mes" viewBox="0 0 220 56" aria-hidden="true"><path id="fc-arco" d="M40 52 Q110 8 180 52" fill="none"/><text><textPath href="#fc-arco" startOffset="50%" text-anchor="middle">${MES_CORTO}</textPath></text></svg>
      <div class="fc-fila"><span>${DIA_SEM}</span><b>${D}</b><span id="fc-hora">${c.hora ? horaBonita(c.hora) : "HORA POR<br>CONFIRMAR"}</span></div>
      ${c.noviosImagen ? `<img class="fc-novios-img" src="${esc(c.noviosImagen)}" alt="" aria-hidden="true">` : '<svg class="icono-linea fc-novios" aria-hidden="true"><use href="#i-novios"/></svg>'}
    </article>
    <article class="tarjeta greige arco fc-prepara revela">
      <span class="filete" aria-hidden="true"></span>
      <h2 class="titulo" id="t-faltan">¡Prepárate!</h2>
      <p class="cap fc-sub">Nos vemos dentro de</p>
      <div class="cuenta" role="timer" aria-live="off">
        <div><b id="dd">—</b><span>días</span></div><div><b id="hh">—</b><span>horas</span></div>
        <div><b id="mm">—</b><span>minutos</span></div><div><b id="ss">—</b><span>segundos</span></div>
      </div>
      <a class="boton" id="cal" target="_blank" rel="noopener" style="color:var(--salvia-osc)" href="#"><svg aria-hidden="true"><use href="#i-calendario"/></svg>Guardar en mi calendario</a>
    </article>
  </section>`;
const antes = html.length;
html = html.replace(/<section class="faltan"[\s\S]*?<\/section>/, nuevaFecha);
if (html.length === antes) throw new Error("No encontré la sección «Faltan» en invitacion.html");
r("</head>", `<style>
  .fc-seccion{gap:0;padding:0 4px}
  .fc{width:min(420px,100%);padding:58px 26px 70px;border-radius:26px;display:flex;flex-direction:column;align-items:center;gap:6px}
  .fc .sello-pega{left:50%;top:-30px;width:64px;height:64px;margin-left:-32px;transform:rotate(-8deg)}
  .fc-titulo{font-size:clamp(17px,4.6vw,21px);letter-spacing:.22em}
  .fc-mes{width:150px;height:40px;margin:4px 0 -10px;overflow:visible}
  .fc-mes text{font-family:var(--grabado);font-size:17px;letter-spacing:.18em;fill:var(--tinta)}
  .fc-fila{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;width:100%}
  .fc-fila span{font-family:var(--grabado);font-size:clamp(11px,3.2vw,14px);letter-spacing:.14em;line-height:1.35;padding:7px 0;border-top:.75px solid currentColor;border-bottom:.75px solid currentColor;opacity:.9}
  .fc-fila b{font-family:var(--grabado);font-weight:400;font-size:clamp(52px,14vw,68px);line-height:1;font-variant-numeric:lining-nums}
  .fc-novios{width:150px;height:150px;margin:4px 0 2px}
  .fc-novios-img{width:min(190px,52vw);height:auto;margin:6px 0 4px;opacity:.92}
  .fc-que{letter-spacing:.2em;font-size:13px}
  .fc-lugar{margin:2px 0 8px;font-family:var(--palo);font-size:13px;letter-spacing:.1em}
  .fc-prepara{width:min(440px,96%);margin-top:-40px;padding-bottom:34px;z-index:3}
  .fc-prepara .titulo{letter-spacing:.24em}
  .fc-sub{margin:6px 0 14px;letter-spacing:.24em;font-size:11px}
  .fc-prepara .cuenta{background:none;box-shadow:none;padding:6px 0 10px}
  .fc-prepara .cuenta div + div{border-left:0}
  .fc-prepara .cuenta div{position:relative}
  .fc-prepara .cuenta div + div::before{content:":";position:absolute;left:-.12em;top:0;font-family:var(--grabado);font-size:clamp(26px,7vw,38px);line-height:1;color:var(--salvia-osc);opacity:.6;transform:translateX(-50%)}
  .fc-prepara .cuenta b{font-weight:400}
  .fc-prepara .cuenta span{letter-spacing:.1em;font-size:9px}
  /* la fecha ya está en «Celebra con nosotros»: no se repite en la primera tarjeta */
  .principal #dia-semana,.principal #fecha-grande{display:none!important}
  /* monograma del sobre: dos letras anchas (A A) no deben tocar el borde de la solapa */
  .monograma-sobre span{font-size:clamp(100px,26vmin,176px)}
  .monograma-sobre .c{margin:.34em 0 0 -1.3em}
</style>\n</head>`);

// ── Sobre liso de papel con textura (sin flores), monograma grande en relieve y sellos de cera dorados;
//    fondo de tela tipo satín y papel moteado en la tarjeta greige (referencias Donato Planner, 7-nov) ──
r("Grabado.pintar(W, H, Grabado.mapaFlores(W, H, 7), c1)", "Grabado.pintar(W, H, window.__TEXTURA(W, H, 7), c1, { escala: 2.4, brillo: .05 })");
r("Grabado.pintar(Math.round(W * 1.44), Math.round(H * .56), Grabado.mapaFlores(Math.round(W * 1.44), Math.round(H * .56), 23), c2)",
  "Grabado.pintar(Math.round(W * 1.44), Math.round(H * .56), window.__TEXTURA(Math.round(W * 1.44), Math.round(H * .56), 23), c2, { escala: 2.4, brillo: .05 })");
r('Grabado.sello(180, "#e9e3d5", 31), Grabado.sello(180, c3, 31)', 'Grabado.sello(180, "#a08356", 31), Grabado.sello(180, "#a08356", 31)');
r('specularConstant=".12" specularExponent="30"', 'specularConstant=".32" specularExponent="18"');   // brillo de metal envejecido, como el sello de la referencia
r("window.Grabado = (() => {", `// Relieve de papel con grano (en vez de flores): ruido fino + manchas suaves, como cartulina texturizada
window.__TEXTURA = (W, H, s) => \`<defs>
  <filter id="tf\${s}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" seed="\${s}"/><feColorMatrix values="1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 1"/></filter>
  <filter id="tm\${s}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".012" numOctaves="3" seed="\${s + 5}"/><feColorMatrix values="1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 1"/></filter></defs>
  <rect width="\${W}" height="\${H}" fill="#7a7a7a"/><rect width="\${W}" height="\${H}" filter="url(#tm\${s})" opacity=".35"/><rect width="\${W}" height="\${H}" filter="url(#tf\${s})" opacity=".55"/>\`;
window.Grabado = (() => {`);
r("</head>", `<style>
  /* monograma igual al de la referencia (A P de Donato Planner): romana fina, alta y angosta, la segunda letra
     montada abajo a la derecha sobre la pierna de la primera; clara y en relieve sobre el papel */
  .monograma-sobre{display:block;top:6.5%;width:.86em;height:1.2em;font-size:clamp(170px,48vmin,300px);line-height:1}
  .monograma-sobre span{position:absolute;font-family:"Cormorant Garamond",var(--grabado);font-weight:300;font-size:1em;line-height:1;padding:0;margin:0!important;transform-origin:0 0;transform:scaleX(.74);
    background:none;-webkit-background-clip:border-box;background-clip:border-box;filter:none;color:color-mix(in srgb,var(--salvia-2) 55%,#f3efe2 45%);
    text-shadow:-1px -1px 0 rgba(255,255,255,.3),2px 3px 2px rgba(25,32,16,.38),5px 9px 14px rgba(25,32,16,.28)}
  .monograma-sobre .d{left:0;top:-.06em}
  .monograma-sobre .c{left:.27em;top:.36em}
  /* trama de lino en el sobre y en todas las tarjetas (más realista, como la referencia) */
  .sobre{background:var(--salvia) url(/inv/texturas/lino.jpg) 0 0/384px 384px!important;background-blend-mode:soft-light!important}
  .solapa{background:var(--salvia-2) url(/inv/texturas/lino.jpg) 0 0/384px 384px!important;background-blend-mode:soft-light!important}
  .tarjeta::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:url(/inv/texturas/lino.jpg) 0 0/384px 384px;mix-blend-mode:soft-light;opacity:.8}
  /* sin flores decorativas (no les gustaron) */
  .decor{display:none!important}
  .toca{background:rgba(40,50,28,.28)}
  .sello-img{background:radial-gradient(circle at 38% 32%,#d9bd8a,#b39261 45%,#684a13 100%)}
  /* fondo de tela (se pinta una vez, abajo) */
  #tela{position:fixed;inset:0;z-index:0;pointer-events:none;background:#f3f1ec url(/inv/texturas/tela.jpg) center/cover no-repeat}
  /* papel moteado tipo piedra para las tarjetas greige */
  .tarjeta.greige,.fc{background-color:#d8d2c3;background-image:url(/inv/texturas/papel.jpg)!important;background-size:512px 512px}
</style>
</head>`);
r("</body>", `<div id="tela" aria-hidden="true"></div>\n</body>`);   // fondo de tela (texturas.py)

// ── Monograma propio de la pareja (imagen: tinta = blanco con transparencia), pintado como relieve ──
if (c.monogramaImagen) {
  r(`<div class="monograma-sobre" aria-hidden="true"><span class="d" id="mono-1">${esc(inicial(n1))}</span><span class="c" id="mono-2">${esc(inicial(n2))}</span></div>`,
    `<div class="monograma-sobre mono-img" aria-hidden="true"><i></i></div>`);
  r('<div class="mono" aria-hidden="true" id="pie-mono">D&amp;C</div>', '<div class="mono mono-pie" aria-hidden="true" id="pie-mono"><i></i></div>');
  r("</head>", `<style>
  .monograma-sobre.mono-img{display:block;width:min(52vw,280px);height:auto;aspect-ratio:${c.monogramaProporcion || 1.068};top:6%;font-size:16px;
    filter:drop-shadow(-1px -1px 0 rgba(255,255,255,.3)) drop-shadow(2px 3px 2px rgba(25,32,16,.42)) drop-shadow(5px 9px 12px rgba(25,32,16,.25))}
  .mono-img i,.mono-pie i{display:block;width:100%;height:100%;-webkit-mask:url(${c.monogramaImagen}) center/contain no-repeat;mask:url(${c.monogramaImagen}) center/contain no-repeat}
  .mono-img i{background:color-mix(in srgb,var(--salvia-2) 50%,#f3efe2 50%)}
  .mono-pie{width:150px;aspect-ratio:${c.monogramaProporcion || 1.068};margin:0 auto}
  .mono-pie i{background:var(--salvia-osc)}
</style>\n</head>`);
}
// ── Itinerario vertical con dibujos (referencia de la pareja): dibujo | línea con punto | hora y actividad ──
if (c.itinerarioVertical?.length) {
  const carpeta = `/inv/${slug}/`;
  r('<section class="itinerario" id="itinerario"', `<section class="itin-v" aria-labelledby="t-itin-v">
    <article class="tarjeta crema itin-tarjeta revela">
      <span class="filete" aria-hidden="true"></span>
      <h2 class="titulo" id="t-itin-v">Itinerario</h2>
      <ol class="itin-lista">${c.itinerarioVertical.map((x, i) => `
        <li style="--i:${i}"><img src="${carpeta}${esc(x.imagen)}.png" alt="" aria-hidden="true"><i class="itin-punto"></i><div><time>${esc(x.hora)}</time><span>${esc(x.actividad)}</span></div></li>`).join("")}
      </ol>
    </article>
  </section>
  <section class="itinerario" id="itinerario"`);
  r("</head>", `<style>
  .itin-tarjeta{padding:54px 18px 46px;display:flex;flex-direction:column;align-items:center;gap:26px}
  .itin-lista{list-style:none;margin:0;padding:0;width:100%;display:flex;flex-direction:column;gap:26px;position:relative}
  .itin-lista::before{content:"";position:absolute;left:calc(46% + 8px);top:14px;bottom:30px;width:1px;background:color-mix(in srgb,var(--salvia-osc) 55%,transparent)}
  .itin-lista li{display:grid;grid-template-columns:46% 17px 1fr;align-items:center;column-gap:12px;text-align:left}
  .itin-lista img{width:100%;max-width:170px;max-height:112px;object-fit:contain;justify-self:end}
  .itin-punto{width:7px;height:7px;border-radius:50%;background:var(--salvia-osc);justify-self:center;position:relative;z-index:1}
  .itin-lista time{display:block;font-family:"Cormorant Garamond",serif;font-weight:600;font-size:clamp(24px,6.6vw,30px);line-height:1.05;color:var(--salvia-osc);font-variant-numeric:lining-nums}
  .itin-lista span{display:block;font-family:var(--grabado);font-size:clamp(11px,3.1vw,13.5px);letter-spacing:.16em;text-transform:uppercase;line-height:1.4;margin-top:3px}
  .anima-itin .itin-lista li{opacity:0;transform:translateY(16px);transition:opacity .8s ease calc(var(--i) * .18s),transform .8s cubic-bezier(.2,.7,.2,1) calc(var(--i) * .18s)}
  .anima-itin.visto .itin-lista li{opacity:1;transform:none}
  @media (prefers-reduced-motion:reduce){.anima-itin .itin-lista li{opacity:1;transform:none}}
</style>\n</head>`);
}

// Ceremonia: dibujo propio (la iglesia a lápiz) en vez del arco
if (c.ceremoniaImagen) {
  r('<svg class="icono-linea" aria-hidden="true"><use href="#i-arco"/></svg>', `<img class="cer-img" src="${esc(c.ceremoniaImagen)}" alt="" aria-hidden="true">`);
  r("</head>", `<style>.cer-img{width:min(230px,60vw);height:auto;margin:-6px auto 2px;display:block}</style>\n</head>`);
}

// Nombres en letra manuscrita fina (tipo firma), con «y» en vez de «&»
if (c.letraNombres) {
  r("</head>", `<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(c.letraNombres).replace(/%20/g, "+")}&display=swap" rel="stylesheet">
<style>
  .principal .nombres{font-family:"${c.letraNombres}",var(--mano);font-weight:400;text-transform:none;letter-spacing:0;font-size:clamp(70px,20vw,104px);line-height:.92;margin-block:18px 10px}
  .principal .nombres span{font-size:.55em;margin-block:-.05em .02em}
</style>\n</head>`);
}
// Nota de «solo adultos» en la confirmación (lo lee todo el que responde)
if (c.notaAdultos) r("</head>", `<style>
  .nota-adultos{max-width:30ch;margin:4px auto 6px;font-family:"Cormorant Garamond",serif;font-style:italic;font-size:17px;line-height:1.45;color:var(--salvia-osc);display:flex;flex-direction:column;align-items:center;gap:8px}
  .nota-adultos::before{content:"";width:46px;height:1px;background:currentColor;opacity:.5}
</style>\n</head>`);

// ── El módulo: sin Firebase; los datos van escritos y la respuesta va al Google Forms ──
const ini = html.indexOf('  import { initializeApp }'), finDb = html.indexOf("const db = getFirestore(app);");
if (ini < 0 || finDb < 0) throw new Error("No encontré la conexión a Firebase en invitacion.html");
html = html.slice(0, ini) + "  const db = null;   // invitación suelta: sin base de datos" + html.slice(finDb + "const db = getFirestore(app);".length);
const corte = html.indexOf("  // My Wedding: el índice dice de qué boda es este link");
const cierre = html.indexOf("</script>", corte);   // el fin del módulo (después hay más scripts nuestros)
if (corte < 0 || cierre < corte) throw new Error("No encontré dónde cargar los datos en invitacion.html");
const datos = JSON.stringify(c).replace(/</g, "\\u003c");
html = html.slice(0, corte) + `
  // ═══ Invitación suelta (scripts/invitaciones/generar.mjs): datos escritos y confirmación por Google Forms ═══
  const cfg = ${datos};
  P = personalizar({ ...cfg, paleta: null }, false);   // los colores ya vienen puestos arriba (window.__PALETA)
  const I1 = "${inicial(n1)}", I2 = "${inicial(n2)}";
  txt("#mono-1", I1); txt("#mono-2", I2);
  if (cfg.monogramaImagen) $("#pie-mono").innerHTML = "<i></i>"; else txt("#pie-mono", I1 + "&" + I2);
  // Itinerario vertical: los hitos aparecen de a uno al llegar
  const iv = document.querySelector(".itin-v");
  if (iv && "IntersectionObserver" in window) { iv.classList.add("anima-itin"); new IntersectionObserver((es, o) => es.forEach((e) => { if (e.isIntersecting) { iv.classList.add("visto"); o.disconnect(); } }), { threshold: .2 }).observe(iv); }
  // Regalos: texto en párrafos y botón a la lista
  if (cfg.regalos) { const t = $("#regalos-texto"); t.style.whiteSpace = "pre-line"; t.textContent = cfg.regalos; }
  if (cfg.regalosLink) { const a = document.createElement("a"); a.className = "boton"; a.href = cfg.regalosLink; a.target = "_blank"; a.rel = "noopener"; a.style.marginTop = "14px";
    a.innerHTML = '<svg aria-hidden="true"><use href="#i-regalo"/></svg>' + (cfg.regalosBoton || "Ver lista de regalos"); $("#regalos-texto").after(a); }
  // Nombres largos (ALEJANDRO): se achican hasta caber dentro del filete de la tarjeta, en cualquier pantalla
  const ajustarNombres = () => {
    const h = $("#nombres"); if (!h) return; h.style.fontSize = "";
    const tarjeta = h.closest(".tarjeta"), filete = tarjeta?.querySelector(".filete");
    const caja = (filete || tarjeta).getBoundingClientRect(), margen = 22;
    let t = parseFloat(getComputedStyle(h).fontSize), n = 0;
    const ancho = () => { const rg = document.createRange(); rg.selectNodeContents(h); return Math.max(...[...rg.getClientRects()].map((x) => x.width), h.scrollWidth > h.clientWidth ? h.scrollWidth : 0); };
    while (n++ < 40 && (ancho() > caja.width - 2 * margen) && t > 18) { t -= 1.5; h.style.fontSize = t + "px"; }
  };
  ajustarNombres(); document.fonts?.ready.then(ajustarNombres); addEventListener("resize", ajustarNombres);
  $("#lugar-nombre").textContent = cfg.lugarNombre; $("#lugar-dir").textContent = cfg.direccion;
  if (cfg.hora) $("#hora").textContent = cfg.hora;
  else { const h = $(".hora-grande"); h.textContent = "Hora por confirmar"; h.style.fontSize = "15px"; h.style.letterSpacing = ".18em"; h.style.textTransform = "uppercase"; }
  if (cfg.comoLlegar) $("#como-llegar").textContent = cfg.comoLlegar; else ocultar("#como-llegar", true);
  if (cfg.mensaje) $("#mensaje").textContent = cfg.mensaje;
  const sub = $("#limite")?.closest("p");
  if (cfg.limite) $("#limite").textContent = cfg.limite; else if (sub) sub.innerHTML = "Por favor, confirma<br>tu asistencia";
  if (cfg.notaAdultos && sub) { const n = document.createElement("p"); n.className = "nota-adultos"; n.textContent = cfg.notaAdultos; sub.after(n); }
  if (cfg.letraNombres) { const y = $("#nombres span"); if (y) y.textContent = "y"; }
  const qCer = encodeURIComponent(cfg.lugarNombre + ", " + cfg.direccion);
  $("#mapa").href = "https://www.google.com/maps/search/?api=1&query=" + qCer;
  // La celebración es en otro lugar: dirección y su propio «Cómo llegar»
  if (cfg.celebracionLugar) {
    const t = $("#celebra-nota"), a = document.createElement("a");
    t.textContent = cfg.celebracionLugar; t.hidden = false; t.style.display = "";
    if (cfg.celebracionHora) { const h = document.createElement("p"); h.className = "hora-grande cel-hora"; h.innerHTML = "<span>" + cfg.celebracionHora + "</span> hrs"; $("#celebra").before(h); }
    a.className = "boton"; a.target = "_blank"; a.rel = "noopener"; a.style.marginTop = "8px";
    a.href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(cfg.celebracionLugar);
    a.innerHTML = '<svg aria-hidden="true"><use href="#i-ubicacion"/></svg>Cómo llegar'; t.after(a);
  }
  // Calendario: con hora, el evento; sin hora, el día completo
  const d0 = cfg.fecha.replace(/-/g, ""), sig = new Date(Date.UTC(${Y}, ${M - 1}, ${D + 1})).toISOString().slice(0, 10).replace(/-/g, "");
  const utc = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\\.\\d{3}/, "");
  const fechas = cfg.hora && P.diaHora ? utc(P.diaHora) + "%2F" + utc(new Date(P.diaHora.getTime() + 7 * 3600e3)) : d0 + "%2F" + sig;
  $("#cal").hidden = false;
  $("#cal").href = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent("Matrimonio de " + cfg.nombre1 + " y " + cfg.nombre2) + "&dates=" + fechas + "&location=" + qCer;
  if (!cfg.hora) window.__inv.fijarMeta?.(Date.parse(cfg.fecha + "T00:00:00-03:00"));
  if (cfg.programa?.length) window.__inv.pintarPrograma(cfg.programa); else ocultar("#itinerario", true);
  if (cfg.musicaArchivo) prepararAudio(cfg.musicaArchivo, cfg.musicaInicio);

  // Para quién es: ?para=Familia Pérez (si no viene, se pregunta el nombre antes de confirmar)
  const para = (new URLSearchParams(location.search).get("para") || "").trim().slice(0, 80);
  const ponerNombre = (t) => document.querySelectorAll("[data-para]").forEach((e) => { e.textContent = t; });
  ponerNombre(para || "ti");
  const g = cfg.google || {}, conectado = !!(g.accion && g.campos);
  let nombre = para;
  if (!para) {
    const caja = document.createElement("input");
    caja.className = "campo"; caja.id = "tu-nombre"; caja.placeholder = "Tu nombre y apellido"; caja.autocomplete = "name";
    caja.style.cssText = "margin:10px auto 0;max-width:260px;text-align:center";
    $("#confirmar").before(caja);
    // antes de abrir las preguntas, el nombre (para saber quién confirma)
    document.addEventListener("click", (ev) => {
      if (!ev.target.closest?.("#confirmar")) return;
      nombre = caja.value.trim();
      if (!nombre) { ev.stopImmediatePropagation(); ev.preventDefault(); caja.focus(); caja.style.borderColor = "#b4533f"; nota("Escribe tu nombre para confirmar."); }
      else { nota(""); ponerNombre(nombre); }
    }, true);
  }
  const CLAVE = "inv-" + cfg.slug + "-" + (para || "");
  try { const ya = JSON.parse(localStorage.getItem(CLAVE) || "null"); if (ya) window.__inv.mostrarRespuesta(ya); } catch (e) {}
  nota(conectado ? "Tu respuesta les llega directo a " + cfg.nombre1 + " y " + cfg.nombre2 + "." : "");
  window.__inv.guardar = async (rsp) => {
    if (!conectado) { nota("La confirmación se habilita muy pronto. ¡Gracias por tu paciencia!"); return; }
    nota("Enviando tu respuesta…");
    const v = { nombre: nombre || para || "Sin nombre", asiste: rsp.asiste ? "Sí" : "No", comida: (rsp.comida || []).join(", "), cancion: rsp.cancion || "", deseo: rsp.deseo || "" };
    const cuerpo = new URLSearchParams();
    for (const [k, entrada] of Object.entries(g.campos)) if (entrada && v[k] != null) cuerpo.append(entrada, v[k]);
    try {
      await fetch(g.accion, { method: "POST", mode: "no-cors", body: cuerpo });   // Google Forms no responde CORS: se manda igual
      try { localStorage.setItem(CLAVE, JSON.stringify({ ...rsp, fecha: new Date().toISOString() })); } catch (e) {}
      nota("✓ Respuesta enviada. ¡Gracias!");
    } catch (e) { nota("No se pudo enviar. Revisa tu conexión y vuelve a intentarlo."); }
  };
` + html.slice(cierre);

mkdirSync(join(RAIZ, "public/inv"), { recursive: true });
writeFileSync(join(RAIZ, "public/inv", slug + ".html"), html);
console.log("✓ public/inv/" + slug + ".html");

// Imagen del link (1200 × 630): el sobre cerrado, ya con su relieve pintado.
if (process.env.SIN_IMAGEN) process.exit(0);
const { chromium } = await import("/Users/idk/copec-worker/node_modules/playwright/index.mjs");
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.goto(`http://localhost:${process.env.PUERTO || 4190}/inv/${slug}.html`);
await p.waitForTimeout(3500);
await p.screenshot({ path: join(RAIZ, "public/inv", slug + ".jpg"), type: "jpeg", quality: 86 });
await b.close();
console.log("✓ public/inv/" + slug + ".jpg");
