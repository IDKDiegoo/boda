// Genera la invitación de una pareja: node scripts/invitaciones/generar.mjs angeles-y-alejandro
// Lee parejas/<slug>.json, arma public/inv/<slug>.html (con nombres e imagen para WhatsApp ya puestos, porque
// WhatsApp no corre JavaScript) y saca la imagen de vista previa public/inv/<slug>.jpg con Playwright.
// La dirección queda en https://boda-eight-psi.vercel.app/<slug> (regla en vercel.json).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, "../..");
const BASE = process.env.BASE_URL || "https://boda-eight-psi.vercel.app";
const slug = process.argv[2];
if (!slug || !/^[a-z0-9-]+-y-[a-z0-9-]+$/.test(slug)) { console.error("Uso: node generar.mjs <ella-y-el>  (minúsculas, sin tildes)"); process.exit(1); }
const d = JSON.parse(readFileSync(join(AQUI, "parejas", slug + ".json"), "utf8"));
const at = s => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

const titulo = `${d.ella} & ${d.el} · Nos casamos`;
const descripcion = `${d.fechaLarga} · ${d.ceremonia.lugar}. Toca para abrir la invitación.`;
const html = readFileSync(join(AQUI, "plantilla.html"), "utf8")
  .replaceAll("__TITULO__", at(titulo)).replaceAll("__DESCRIPCION__", at(descripcion))
  .replaceAll("__OG_IMAGEN__", `${BASE}/inv/${slug}.jpg`)
  .replace("/*__DATOS__*/{}", JSON.stringify(d).replace(/</g, "\\u003c"));
mkdirSync(join(RAIZ, "public/inv"), { recursive: true });
writeFileSync(join(RAIZ, "public/inv", slug + ".html"), html);
console.log("✓ public/inv/" + slug + ".html");

// Imagen para WhatsApp (1200 × 630): el sobre cerrado con el sello.
if (process.env.SIN_IMAGEN) process.exit(0);
const { chromium } = await import("/Users/idk/copec-worker/node_modules/playwright/index.mjs");
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.goto("file://" + join(RAIZ, "public/inv", slug + ".html"));
await p.addStyleTag({ content: ".toca{display:none}.sello::before{display:none}.sobre{width:520px}.para{display:none}" });
await p.evaluate(() => { document.querySelector(".para").textContent = ""; });
await p.waitForTimeout(1500);
await p.screenshot({ path: join(RAIZ, "public/inv", slug + ".jpg"), type: "jpeg", quality: 86 });
await b.close();
console.log("✓ public/inv/" + slug + ".jpg");
