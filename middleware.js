// Invitaciones sueltas con dirección propia (10-nov-2026): en <ella-y-el>.vercel.app la página de inicio
// es la invitación. Corre solo en «/» (config.matcher) y antes que los archivos (un rewrite de
// vercel.json no alcanza: index.html gana). Para el resto de la app no hace nada.
export const config = { matcher: "/" };
export default function middleware(req) {
  const url = new URL(req.url);
  const m = url.hostname.match(/^([a-z0-9-]+-y-[a-z0-9-]+)\.vercel\.app$/);
  if (!m) return new Response(null, { headers: { "x-middleware-next": "1" } });
  url.pathname = `/inv/${m[1]}.html`;
  return new Response(null, { headers: { "x-middleware-rewrite": url.toString() } });
}
