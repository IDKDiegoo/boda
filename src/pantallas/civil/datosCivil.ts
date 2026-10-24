import { Fotos } from "../Fotos";

// ════════════════════════════════════════════════════════════════
// BODA CIVIL
// ════════════════════════════════════════════════════════════════
export type CivilInvitado = { id:number; nombre:string; confirmado:boolean; notas?:string; };
// `monto` = importe total del ítem (lo normal: "Decoración $50.000"). Los campos
// cantidad/precioPorUnidad quedan opcionales, solo para lo que sí se calcula por kg o
// por persona; los ítems viejos siguen funcionando porque el total cae a cantidad×precio.
// `listo` es el tilde: sirve para ir marcando lo que ya está comprado.
export type CivilGasto    = { id:number; categoria:string; descripcion:string; cantidad:number; unidad:string; precioPorUnidad:number; notas?:string; monto?:number; listo?:boolean; };
export type CivilItem     = { id:number; texto:string; listo:boolean; fotos?:string[] };    // decoración y tips
export type CivilHora     = { id:number; hora:string; actividad:string };                  // cronograma del día
export type CivilTarea    = { id:number; cuando:string; texto:string; listo:boolean; fotos?:string[] };  // checklist por plazo
export type CivilData     = { invitados:CivilInvitado[]; gastos:CivilGasto[]; deco?:CivilItem[]; cronograma?:CivilHora[]; tips?:CivilItem[]; tareas?:CivilTarea[]; lunaHechos?:string[] };
// Total de un ítem: si tiene monto, manda el monto; si no, cantidad × precio unitario.
export const totalGasto = (g:CivilGasto) => (g.monto != null && g.monto > 0) ? g.monto : (Number(g.cantidad)||0)*(Number(g.precioPorUnidad)||0);
// Comprime una imagen antes de subirla (las fotos del celular pesan varios MB).
export const comprimirImg = (file: File): Promise<Blob> => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => {
    const MAX = 1280;
    const r = Math.min(MAX/img.naturalWidth, MAX/img.naturalHeight, 1);
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(img.naturalWidth*r));
    c.height = Math.max(1, Math.round(img.naturalHeight*r));
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    c.toBlob(b => b ? resolve(b) : reject(new Error("No se pudo procesar la imagen")), "image/jpeg", 0.82);
    URL.revokeObjectURL(img.src);
  };
  img.onerror = () => reject(new Error("No se pudo cargar la imagen"));
  img.src = URL.createObjectURL(file);
});
export const PLAZOS_CIVIL = ["2 meses antes","1 mes antes","1 semana antes","2 días antes","El día anterior","El día"];

export const CATS_CIVIL  = ["Lugar","Carnes","Acompañamientos","Pan","Bebidas","Alcohol","Picoteo","Torta","Insumos","Desechables","Decoración","Servicios","Otro"];
export const UNIDS_CIVIL = ["kg","lt","unid","persona","porción","hora"];

export const CAT_ICON_CIVIL: Record<string,string> = {
  "Lugar":"🏡","Carnes":"🥩","Acompañamientos":"🥗","Pan":"🥖","Bebidas":"🥤","Alcohol":"🍷",
  "Picoteo":"🧀","Torta":"🎂","Insumos":"🔥","Desechables":"🧻","Decoración":"🎀","Servicios":"👨‍🍳","Otro":"📦"
};

// Sugerencia base (40 personas, Chile). Se carga con un botón y después se edita todo:
// textos, montos y cantidades. No pisa nada de lo que ya haya cargado.
export const SUG_GASTOS_CIVIL: {categoria:string; descripcion:string; monto:number; notas?:string}[] = [
  { categoria:"Carnes",          descripcion:"Carnes",                     monto:220000, notas:"20–21 kg" },
  { categoria:"Acompañamientos", descripcion:"Ensaladas y acompañamientos",monto:70000 },
  { categoria:"Pan",             descripcion:"Pan",                        monto:18000 },
  { categoria:"Bebidas",         descripcion:"Bebidas y agua",             monto:45000, notas:"Formato 3 L sale más barato" },
  { categoria:"Alcohol",         descripcion:"Cervezas, vinos y espumantes",monto:120000, notas:"El vino por caja tiene descuento" },
  { categoria:"Picoteo",         descripcion:"Picoteo",                    monto:45000 },
  { categoria:"Torta",           descripcion:"Torta",                      monto:80000 },
  { categoria:"Insumos",         descripcion:"Carbón e hielo",             monto:30000 },
  { categoria:"Desechables",     descripcion:"Desechables y servilletas",  monto:35000 },
  { categoria:"Decoración",      descripcion:"Decoración",                 monto:50000 },
];
export const SUG_DECO_CIVIL = [
  "Manteles de lino o color crudo",
  "Flores de estación en frascos de vidrio reciclados",
  "Guirnaldas de luces cálidas",
  "Caminos de mesa de yute",
  "Carteles de madera o acrílico",
  "Velas LED para la tarde",
  "Rincón de fotos con arco de madera y flores",
];
export const SUG_CRONO_CIVIL = [
  ["13:00","Recepción con jugos, bebidas y picoteo"],
  ["14:00","Comienza el asado"],
  ["15:00","Almuerzo"],
  ["16:30","Brindis y palabras"],
  ["17:00","Torta y café"],
  ["17:30","Fotos y juegos"],
  ["18:30","Música y baile"],
  ["20:00","Cierre"],
];
export const SUG_TIPS_CIVIL = [
  "Comprar la carne en carnicería mayorista o a un distribuidor",
  "Preferir bebidas en formato de 3 L",
  "Hacer nosotros el pebre y las ensaladas",
  "Arrendar la vajilla: suele lucir mejor que los desechables y la diferencia es poca",
  "Comprar el vino por caja, que tiene descuento",
];
export const SUG_TAREAS_CIVIL: [string,string][] = [
  ["2 meses antes","Reservar el lugar"],
  ["2 meses antes","Definir el menú"],
  ["2 meses antes","Hacer la lista de invitados"],
  ["1 mes antes","Comprar decoración"],
  ["1 mes antes","Encargar la torta"],
  ["1 mes antes","Confirmar asistencia"],
  ["1 semana antes","Comprar bebidas y productos no perecibles"],
  ["1 semana antes","Revisar mesas, sillas y parrilla"],
  ["2 días antes","Comprar la carne"],
  ["2 días antes","Comprar verduras y pan"],
  ["2 días antes","Preparar adobos y aliños"],
  ["El día anterior","Dejar todo organizado"],
  ["El día anterior","Enfriar las bebidas"],
  ["El día anterior","Preparar las mesas"],
];
