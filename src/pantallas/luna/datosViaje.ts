import { Card } from "../../ui/base";

// ════════════════════════════════════════════════════════════════
// LUNA DE MIEL
// ════════════════════════════════════════════════════════════════
export const CATS_LUNA = ["Vuelos","Alojamiento","Actividades","Comidas","Transporte","Seguro","Otro"];

export type Destino = "fln" | "bzc";
export type Ventana = "dic" | "ene";
export type ViajeConfig = {
  id: string; nombre: string; destino: string; fechaSalida: string; fechaRegreso: string;
  noches: number; personas: number; notas: string; creado: string;
};
export type ViajesData = { viajes: ViajeConfig[] };

export const DESTINOS = {
  fln: {
    nombre: "Florianópolis",
    pais: "Brasil",
    emoji: "🏝️",
    descripcion: "Isla tranquila, verano austral perfecto. Menos masivo, ideal para descanso total.",
    pros: ["Vuelo más corto (3h directa)","Más económica","Verano austral en enero","Playas tranquilas"],
    contras: ["Más enfocada en jóvenes / vida nocturna","Menos romántica que Búzios"],
    perfil: "Económica & Tranquila",
    colorPerfil: "#6aaa96",
  },
  bzc: {
    nombre: "Búzios",
    pais: "Brasil",
    emoji: "🌊",
    descripcion: "El 'St. Tropez de Brasil'. Agua cristalina, ambiente boutique. El destino de pareja por excelencia.",
    pros: ["Más romántica y boutique","Agua cristalina","Ambiente íntimo de pareja","Rua das Pedras al atardecer"],
    contras: ["Más cara","Requiere bus de 2.5h desde Río","Sin vuelo directo"],
    perfil: "Romántica & Premium",
    colorPerfil: "#c9956a",
  },
};

export const VENTANAS = {
  dic: {
    label: "20–27 Dic 2026",
    titulo: "Justo después de casarse",
    descripcion: "Sales el 20 de diciembre, un día después de la boda. Celebras Navidad en Brasil.",
    alerta: "Temporada ALTA — precios +50% en todo",
    alertaColor: "#e07070",
    icon: "🎄",
  },
  ene: {
    label: "10–17 Ene 2027",
    titulo: "Luna de miel relajada",
    descripcion: "Disfrutas las fiestas en Chile y sales en enero cuando bajan los precios.",
    alerta: "Precios normalizados — mejor relación calidad/precio",
    alertaColor: "#6aaa96",
    icon: "✨",
  },
};

// Presupuestos reales por combinación (pareja, 7 noches)
export const PRESUPUESTOS: Record<Destino, Record<Ventana, {
  vuelos: { min:number; max:number; aerolinea:string; nota:string; links:{label:string;url:string}[] };
  hotel:  { min:number; max:number; tipo:string; recomendado:string; nota:string; links:{label:string;url:string}[] };
  transfer?: { min:number; max:number; nota:string };
  comida: { min:number; max:number; nota:string };
  actividades: { min:number; max:number; nota:string };
  seguro: { min:number; max:number; nota:string };
  incluido: string[];
  noIncluido: string[];
}>> = {
  fln: {
    dic: {
      vuelos:      { min:900000, max:1300000, aerolinea:"LATAM / JetSMART / SKY", nota:"Temporada alta Navidad — comprar en oct 2026", links:[{label:"LATAM",url:"https://www.latamairlines.com/cl/es"},{label:"JetSMART",url:"https://jetsmart.com/cl/es"},{label:"SKY",url:"https://www.skyairline.com/chile"},{label:"Comparar en KAYAK",url:"https://www.kayak.cl/vuelos/Santiago-de-Chile-Aeropuerto-Internacional-Comodoro-Arturo-Merino-Benitez-SCL/Florianopolis-Hercilio-Luz-FLN"}] },
      hotel:       { min:450000, max:700000, tipo:"Pousada boutique 4★", recomendado:"Pousada Villa Rossa o similar", nota:"7 noches. Precio sube 40% en diciembre", links:[{label:"Booking.com Floripa",url:"https://www.booking.com/searchresults.html?ss=Florian%C3%B3polis"},{label:"Airbnb Floripa",url:"https://www.airbnb.cl/s/Florian%C3%B3polis--Brasil/homes"}] },
      comida:      { min:250000, max:320000, nota:"~$36.000/día pareja. Restaurantes frente al mar incluidos" },
      actividades: { min:80000,  max:120000, nota:"Paseo en barco (~$50.000), playas, alquiler bicicleta" },
      seguro:      { min:60000,  max:90000,  nota:"Recomendado: Assist Card o Heymondo con cancelación" },
      incluido:    ["1 maleta bodega 23kg c/u (LATAM Light)","Equipaje de mano 8kg","Check-in online","Desayuno en hotel (pousada boutique)","Wi-Fi en hotel","Piscina"],
      noIncluido:  ["Selección de asiento (LATAM Light: $8-20 USD)","Vuelos de conexión domésticos en Brasil","Excursiones","Cenas en restaurante","Transporte local entre playas"],
    },
    ene: {
      vuelos:      { min:600000, max:900000, aerolinea:"LATAM / JetSMART / SKY", nota:"Mejores precios del año. Comprar en ago-sep 2026", links:[{label:"LATAM",url:"https://www.latamairlines.com/cl/es"},{label:"JetSMART",url:"https://jetsmart.com/cl/es"},{label:"SKY",url:"https://www.skyairline.com/chile"},{label:"Comparar en KAYAK",url:"https://www.kayak.cl/vuelos/Santiago-de-Chile-Aeropuerto-Internacional-Comodoro-Arturo-Merino-Benitez-SCL/Florianopolis-Hercilio-Luz-FLN"}] },
      hotel:       { min:350000, max:530000, tipo:"Pousada boutique 4★", recomendado:"Pousada Villa Rossa o similar", nota:"7 noches. Enero es temporada baja brasileña para turistas internacionales", links:[{label:"Booking.com Floripa",url:"https://www.booking.com/searchresults.html?ss=Florian%C3%B3polis"},{label:"Airbnb Floripa",url:"https://www.airbnb.cl/s/Florian%C3%B3polis--Brasil/homes"}] },
      comida:      { min:220000, max:290000, nota:"~$32.000/día pareja" },
      actividades: { min:70000,  max:100000, nota:"Paseo en barco, snorkeling Lagoa da Conceição, playas" },
      seguro:      { min:60000,  max:90000,  nota:"Recomendado: Assist Card o Heymondo con cancelación" },
      incluido:    ["1 maleta bodega 23kg c/u (LATAM Light)","Equipaje de mano 8kg","Desayuno en pousada","Wi-Fi hotel","Piscina"],
      noIncluido:  ["Selección de asiento","Cenas","Transporte local","Excursiones premium"],
    },
  },
  bzc: {
    dic: {
      vuelos:      { min:1000000, max:1400000, aerolinea:"LATAM vía GIG (Río de Janeiro)", nota:"Temporada alta — vuela a Río, luego bus a Búzios", links:[{label:"LATAM a Río",url:"https://www.latamairlines.com/cl/es"},{label:"SKY a Río",url:"https://www.skyairline.com/chile"},{label:"KAYAK SCL→RIO",url:"https://www.kayak.cl/vuelos/Santiago-de-Chile-Aeropuerto-Internacional-Comodoro-Arturo-Merino-Benitez-SCL/Rio-de-Janeiro-RIO"}] },
      hotel:       { min:700000, max:1100000, tipo:"Hotel boutique 4-5★", recomendado:"Insólito Boutique & Spa", nota:"7 noches. Diciembre es alta temporada en Búzios", links:[{label:"Insólito Hotel",url:"https://www.booking.com/hotel/br/insolito-boutique.html"},{label:"Casas Brancas",url:"https://www.booking.com/hotel/br/casas-brancas-boutique-spa.html"},{label:"Booking Búzios",url:"https://www.booking.com/searchresults.html?ss=B%C3%BAzios"}] },
      transfer:    { min:100000, max:160000, nota:"Bus/transfer privado GIG→Búzios x2. ~2.5h de viaje" },
      comida:      { min:280000, max:360000, nota:"~$40.000/día pareja. Restaurantes frente al mar en Rua das Pedras" },
      actividades: { min:80000,  max:130000, nota:"Escuna por las playas, snorkeling, Rua das Pedras" },
      seguro:      { min:60000,  max:90000,  nota:"Imprescindible para luna de miel. Assist Card con cancelación" },
      incluido:    ["Desayuno en hotel boutique","Piscina con vista al mar","Wi-Fi","Playa privada (Insólito)","Spa acceso (Insólito)"],
      noIncluido:  ["Maleta bodega (agregar online: ~$35-45 USD c/u)","Selección asiento","Transfer aeropuerto","Cenas","Excursiones","Bebidas en hotel"],
    },
    ene: {
      vuelos:      { min:700000, max:1000000, aerolinea:"LATAM vía GIG (Río de Janeiro)", nota:"Post fiestas — los mejores precios del año. Comprar ago-sep 2026", links:[{label:"LATAM a Río",url:"https://www.latamairlines.com/cl/es"},{label:"JetSMART a Río",url:"https://jetsmart.com/cl/es"},{label:"KAYAK SCL→RIO",url:"https://www.kayak.cl/vuelos/Santiago-de-Chile-Aeropuerto-Internacional-Comodoro-Arturo-Merino-Benitez-SCL/Rio-de-Janeiro-RIO"}] },
      hotel:       { min:500000, max:800000, tipo:"Hotel boutique 4★", recomendado:"Insólito Boutique & Spa", nota:"7 noches. Enero tiene mejor disponibilidad y precios que diciembre", links:[{label:"Insólito Hotel",url:"https://www.booking.com/hotel/br/insolito-boutique.html"},{label:"Casas Brancas",url:"https://www.booking.com/hotel/br/casas-brancas-boutique-spa.html"},{label:"Booking Búzios",url:"https://www.booking.com/searchresults.html?ss=B%C3%BAzios"}] },
      transfer:    { min:100000, max:160000, nota:"Bus/transfer privado GIG→Búzios x2. Reservar con anticipación" },
      comida:      { min:250000, max:320000, nota:"~$36.000/día pareja" },
      actividades: { min:70000,  max:110000, nota:"Escuna, snorkeling, paseo a caballo por las playas" },
      seguro:      { min:60000,  max:90000,  nota:"Assist Card o Heymondo. Para luna de miel es imprescindible" },
      incluido:    ["Desayuno en hotel","Piscina","Wi-Fi","Playa privada (Insólito)"],
      noIncluido:  ["Maleta bodega (agregar online)","Selección asiento","Transfer GIG→Búzios","Cenas","Excursiones"],
    },
  },
};


export const ITINERARIO_FLN = [
  { dia:"Día 1", plan:"Llegada FLN → check-in → atardecer en Lagoa da Conceição" },
  { dia:"Día 2", plan:"Playa Ferradura — la más cristalina y tranquila de la isla" },
  { dia:"Día 3", plan:"Paseo en barco por las playas del norte" },
  { dia:"Día 4", plan:"Día relax total — spa, piscina, sin agenda" },
  { dia:"Día 5", plan:"Jurerê Internacional — zona más boutique de la isla" },
  { dia:"Día 6", plan:"Cena romántica frente al mar. Última noche" },
  { dia:"Día 7", plan:"Checkout → vuelo de regreso a SCL" },
];

export const ITINERARIO_BZC = [
  { dia:"Día 1", plan:"Llegada GIG → transfer 2.5h → check-in Búzios → descanso" },
  { dia:"Día 2", plan:"Playa João Fernandes — agua cristalina, snorkeling natural" },
  { dia:"Día 3", plan:"Escuna por las 27 playas de la península" },
  { dia:"Día 4", plan:"Día en el hotel — spa, playa privada, relax total" },
  { dia:"Día 5", plan:"Playa Ferradurinha — la más pintoresca de Búzios" },
  { dia:"Día 6", plan:"Atardecer en Rua das Pedras + cena romántica frente al mar" },
  { dia:"Día 7", plan:"Checkout → transfer GIG → vuelo de regreso" },
];

export type Paquete = {
  id: string; destino: string; ventana: string; aerolinea: string; hotel: string;
  categoria_hotel: string; pension: string; fecha_salida: string; fecha_regreso: string;
  noches: number; precio_persona: number|null; precio_pareja: number|null;
  ahorro_vs_separado: number|null; incluye: string[]; no_incluye: string[];
  fuente: string; url: string; es_oferta: boolean; disponible: boolean; notas: string;
};
export type PaquetesData = {
  paquetes: Paquete[]; resumen: string; mejor_opcion: string|null;
  fecha_consulta: string; error?: boolean;
};
