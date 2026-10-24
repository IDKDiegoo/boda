

// ── Tipos ────────────────────────────────────────────────────────
export type Invitado  = { id:number; nombre:string; tipo:"adulto"|"niño"; mesa:number; confirmado:"si"|"no"|"pendiente"; dieta?:string; notas?:string; };
export type Proveedor = { id:number; categoria:string; nombre:string; descripcion:string; costo:number; extras:{desc:string;monto:number}[]; estado:"confirmado"|"pendiente"|"descartado"; contacto?:string; notas?:string; };
export type GastoExtra= { id:number; nombre:string; categoria:string; monto:number; pagado:boolean; };
export type Cancion   = { id:number; titulo:string; artista:string; momento:string; link?:string; };
export type Regalo    = { id:number; nombre:string; precio:number; prioridad:"alta"|"media"|"baja"; recibido:boolean; link?:string; };
export type LunaItem  = { id:number; categoria:string; descripcion:string; monto:number; confirmado:boolean; notas?:string; };
export type MesaPos   = { id:number; numero:number; x:number; y:number; forma:"circular"|"rectangular"|"cuadrada"; };
export type Foto      = { url:string; nombre:string; };
// `checks` = lo que hace falta para montar ESA decoración (trípode, cuadro, flores…).
// Se agregan a mano, los que cada una necesite.
export type DecoCheck = { id:number; texto:string; listo:boolean };
export type DecoItem  = { id:number; nombre:string; categoria:string; cantidad:number; precio:number; foto?:string; videoUrl?:string; notas?:string; comprado:boolean; checks?:DecoCheck[]; };
