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

// ── El módulo: sin Firebase; los datos van escritos y la respuesta va al Google Forms ──
const ini = html.indexOf('  import { initializeApp }'), finDb = html.indexOf("const db = getFirestore(app);");
if (ini < 0 || finDb < 0) throw new Error("No encontré la conexión a Firebase en invitacion.html");
html = html.slice(0, ini) + "  const db = null;   // invitación suelta: sin base de datos" + html.slice(finDb + "const db = getFirestore(app);".length);
const corte = html.indexOf("  // My Wedding: el índice dice de qué boda es este link");
const cierre = html.lastIndexOf("</script>");
if (corte < 0 || cierre < corte) throw new Error("No encontré dónde cargar los datos en invitacion.html");
const datos = JSON.stringify(c).replace(/</g, "\\u003c");
html = html.slice(0, corte) + `
  // ═══ Invitación suelta (scripts/invitaciones/generar.mjs): datos escritos y confirmación por Google Forms ═══
  const cfg = ${datos};
  P = personalizar({ ...cfg, paleta: null }, false);   // los colores ya vienen puestos arriba (window.__PALETA)
  const I1 = "${inicial(n1)}", I2 = "${inicial(n2)}";
  txt("#mono-1", I1); txt("#mono-2", I2); txt("#pie-mono", I1 + "&" + I2);
  $("#lugar-nombre").textContent = cfg.lugarNombre; $("#lugar-dir").textContent = cfg.direccion;
  if (cfg.hora) $("#hora").textContent = cfg.hora;
  else { const h = $(".hora-grande"); h.textContent = "Hora por confirmar"; h.style.fontSize = "15px"; h.style.letterSpacing = ".18em"; h.style.textTransform = "uppercase"; }
  if (cfg.comoLlegar) $("#como-llegar").textContent = cfg.comoLlegar; else ocultar("#como-llegar", true);
  if (cfg.mensaje) $("#mensaje").textContent = cfg.mensaje;
  const sub = $("#limite")?.closest("p");
  if (cfg.limite) $("#limite").textContent = cfg.limite; else if (sub) sub.innerHTML = "Por favor, confirma<br>tu asistencia";
  const qCer = encodeURIComponent(cfg.lugarNombre + ", " + cfg.direccion);
  $("#mapa").href = "https://www.google.com/maps/search/?api=1&query=" + qCer;
  // La celebración es en otro lugar: dirección y su propio «Cómo llegar»
  if (cfg.celebracionLugar) {
    const t = $("#celebra-nota"), a = document.createElement("a");
    t.textContent = cfg.celebracionLugar; t.hidden = false; t.style.display = "";
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
