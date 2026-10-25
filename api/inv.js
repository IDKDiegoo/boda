// ═══════════════════════════════════════════════════════════════════
// /i/{codigo} → la invitación, ya con los datos de SU pareja (My Wedding).
// La página (public/invitacion.html) se personaliza sola en el navegador, pero eso llega un
// instante tarde para dos cosas: el sobre (mostraba la «D C» de Diego y Camila) y la vista previa
// de WhatsApp (título y foto del link), que no ejecuta JavaScript. Por eso acá se reemplazan antes
// de mandarla. Los links de la boda original no están en el índice: salen tal cual.
// ═══════════════════════════════════════════════════════════════════
const admin = require("firebase-admin");
const app = () => { if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SA_JSON || "{}")) }); return admin; };
const esc = (t) => String(t || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const DIAS = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

module.exports = async (req, res) => {
  const codigo = String(req.query.codigo || "").replace(/[^A-Za-z0-9_-]/g, "");
  const muestra = String(req.query.b || "").replace(/[^a-z0-9-]/g, "");      // /m/{boda}: «Ver muestra» desde la app
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  let html;
  try { html = await (await fetch(`https://${host}/invitacion.html`)).text(); }
  catch (e) { res.status(502).send("No se pudo cargar la invitación."); return; }
  try {
    const db = app().firestore();
    const ix = codigo ? await db.doc(`invitaciones/${codigo}`).get() : null;
    const bodaId = ix && ix.exists ? ix.data().bodaId : (!codigo && muestra ? muestra : null);
    if (bodaId) {
      const c = (await db.doc(`bodas/${bodaId}/datos/invitacion`).get()).data() || {};
      const n1 = String(c.nombre1 || "Nosotros").trim(), n2 = String(c.nombre2 || "").trim();
      const pareja = n2 ? `${n1} & ${n2}` : n1;
      const m = String(c.fecha || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
      const d = m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12)) : null;
      const cuando = d ? `${DIAS[d.getUTCDay()]} ${+m[3]} de ${MESES[d.getUTCMonth()]} de ${m[1]}` : "";
      const donde = String(c.ciudad || c.lugarNombre || "").trim();
      const titulo = String(c.titulo || "¡Nos casamos!").trim();
      const r = (a, b) => { html = html.split(a).join(b); };
      r('<meta property="og:title" content="Diego &amp; Camila · ¡Nos casamos por el civil!">', `<meta property="og:title" content="${esc(pareja)} · ${esc(titulo)}">`);
      r('<meta property="og:description" content="Viernes 18 de diciembre de 2026 · Lampa. Abre tu invitación y confírmanos.">',
        `<meta property="og:description" content="${esc([cuando, donde].filter(Boolean).join(" · "))}${cuando || donde ? ". " : ""}Abre tu invitación y confírmanos.">`);
      r('<meta property="og:image" content="https://boda-eight-psi.vercel.app/pareja.jpg">', c.foto ? `<meta property="og:image" content="${esc(c.foto)}">` : `<meta property="og:image" content="https://${host}/mywedding-icono-512.png">`);
      r("<title>Diego &amp; Camila · Civil en Lampa</title>", `<title>${esc(pareja)}</title>`);
      r('<span class="d" id="mono-1">D</span><span class="c" id="mono-2">C</span>', `<span class="d" id="mono-1">${esc(n1[0] || "")}</span><span class="c" id="mono-2">${esc((n2 || " ")[0])}</span>`);
      r('<h1 class="nombres" id="nombres">Diego<span>&amp;</span>Camila</h1>', `<h1 class="nombres" id="nombres">${esc(n1)}${n2 ? `<span>&amp;</span>${esc(n2)}` : ""}</h1>`);
      r('<p class="cap" id="titulo-inv">¡Nos casamos por el civil!</p>', `<p class="cap" id="titulo-inv">${esc(titulo)}</p>`);
      r('<img src="/pareja.jpg" alt="Diego y Camila caminando de la mano por la playa" id="foto">', `<img src="${esc(c.foto || "")}" alt="Foto de ${esc(pareja)}" id="foto">`);
      r('<p class="cap" id="pie-nombres">Diego &amp; Camila</p>', `<p class="cap" id="pie-nombres">${esc(pareja)}</p>`);
      // Colores de la pareja desde el principio: sin ellos el sobre se alcanza a pintar verde
      const PAL = { rosa:["#b98a8f","#c49aa0","#8f5f66","#5e3a40"], azul:["#7d8fa8","#8c9db4","#566a85","#36465c"], terracota:["#b8806a","#c4917c","#8e5a45","#5c3a2c"],
        champana:["#b59a6a","#c2aa7d","#8a7148","#5a4a2e"], burdeo:["#8e4a57","#9c5c68","#6a2f3c","#45202a"], negro:["#6e6e6e","#808080","#3d3d3d","#1f1f1f"] };
      const pal = PAL[c.paleta];
      if (pal) r('<meta name="theme-color" content="#7f8c6c">', `<meta name="theme-color" content="${pal[0]}">`);
      if (pal) r("</head>", `<style>:root{--salvia:${pal[0]};--salvia-2:${pal[1]};--salvia-osc:${pal[2]};--bosque:${pal[3]}}</style><script>window.__PALETA=${JSON.stringify(pal)}</script>\n</head>`);
    }
  } catch (e) { console.error("inv", e.message); }   // si falla la base, igual se manda la página (se personaliza en el navegador)
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  res.status(200).send(html);
};
