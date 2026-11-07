// ═══════════════════════════════════════════════════════════════════
// Variantes del link de una invitación suelta (/Angeles-y-Alejandro, /angeles-y-alejandro/, /ángeles-y-alejandro):
// se pasan a la forma exacta (minúsculas, sin tildes, sin «/» final) y se redirige ahí. Sin esto caían en la app
// y pedían iniciar sesión en My Wedding. Si no existe esa invitación, se va al inicio.
// ═══════════════════════════════════════════════════════════════════
module.exports = async (req, res) => {
  let s = String(req.query.s || "");
  try { s = decodeURIComponent(s); } catch (e) {}
  const limpio = s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim().replace(/[\s_]+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  let existe = false;
  if (/^[a-z0-9-]+-y-[a-z0-9-]+$/.test(limpio)) {
    // ojo: la app responde 200 a cualquier ruta (index.html), así que se mira que sea de verdad una invitación
    try { const r = await fetch(`https://${host}/inv/${limpio}.html`); existe = r.ok && (await r.text()).includes("Invitación suelta (scripts/invitaciones/generar.mjs)"); } catch (e) {}
  }
  // se conserva lo que traía el link (?para=…) y se quitan los parámetros internos de la regla (s, slug)
  const params = new URLSearchParams(req.url.includes("?") ? req.url.slice(req.url.indexOf("?") + 1) : "");
  params.delete("s"); params.delete("slug");
  const q = params.toString() ? "?" + params.toString() : "";
  res.setHeader("Cache-Control", "public, s-maxage=300");
  res.writeHead(existe ? 308 : 302, { Location: existe ? `/${limpio}${q}` : "/" });
  res.end();
};
