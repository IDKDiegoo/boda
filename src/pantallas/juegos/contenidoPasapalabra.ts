// ═══════════════════════════════════════════════════════════════════
// PASAPALABRA v2 (31-oct-2026): definiciones por letra con nivel (1 fácil · 2 normal · 3 difícil),
// preguntas de «Una de cuatro» y palabras para los puzzles (letras desordenadas y ahorcado).
// Cada rosco se arma al azar: por cada letra se elige una definición del nivel pedido, así ninguna
// partida es igual. Reglas del programa: el rosco parte con 85 s + los segundos ganados en las pruebas.
// ═══════════════════════════════════════════════════════════════════
import { ROSCOS, Letra } from "./contenidoGrupo";

export type Def = Letra & { n: 1 | 2 | 3 };
export const LETRAS_ROSCO = "ABCDEFGHIJLMNÑOPQRSTUVXYZ".split("");
// [letra, respuesta, definición, nivel, contiene]
type F = [string, string, string, 1 | 2 | 3, boolean?];
const d = (l: F[]): Def[] => l.map(([l, r, df, n, c]) => ({ l, r, d: df, n, c: !!c }));

// Los 6 roscos de antes pasan al banco: los dos primeros generales son fáciles, el tercero normal.
const deAntes = (lista: Letra[][], niveles: (1 | 2 | 3)[]): Def[] => lista.flatMap((r, i) => r.map(x => ({ ...x, n: niveles[i] })));

const GENERAL_NUEVAS = d([
  ["A", "Atacama", "Desierto no polar más árido del mundo", 2], ["A", "Arrebol", "Color rojo de las nubes iluminadas por el sol", 3], ["A", "Antártica", "Continente donde está la base chilena Presidente Eduardo Frei", 2],
  ["A", "Aconcagua", "La montaña más alta de América", 2], ["A", "Anfitrión", "Persona que recibe invitados en su casa", 2],
  ["B", "Bucólico", "Relativo a la vida tranquila del campo", 3], ["B", "Bauxita", "Mineral del que se obtiene el aluminio", 3], ["B", "Bitácora", "Cuaderno donde se anota el diario de navegación", 3],
  ["B", "Biobío", "Río chileno que da nombre a una región, con capital en Concepción", 2], ["B", "Boda", "Celebración de un matrimonio", 1],
  ["C", "Copihue", "Flor nacional de Chile", 2], ["C", "Cenit", "Punto del cielo justo sobre la cabeza del observador", 3], ["C", "Chañarcillo", "Mineral de plata descubierto en 1832 cerca de Copiapó", 3],
  ["C", "Camaleón", "Reptil que cambia de color", 1], ["C", "Constelación", "Grupo de estrellas que forma una figura, como Orión", 2],
  ["D", "Dédalo", "Laberinto; por el arquitecto mitológico que lo construyó", 3], ["D", "Diaguitas", "Pueblo originario del Norte Chico, famoso por su cerámica", 3], ["D", "Dromedario", "Camello de una sola joroba", 2],
  ["D", "Diccionario", "Libro que explica el significado de las palabras", 1], ["D", "Dinosaurio", "Reptil gigante que se extinguió hace 66 millones de años", 1],
  ["E", "Efímero", "Que dura muy poco", 3], ["E", "Esdrújula", "Palabra que se acentúa en la antepenúltima sílaba", 2], ["E", "Ecuador", "Línea imaginaria que divide la Tierra en dos hemisferios", 2],
  ["E", "Eclipse", "Cuando un astro tapa a otro, como la Luna al Sol", 2], ["E", "Escoba", "Se usa para barrer", 1],
  ["F", "Fiordo", "Brazo de mar entre montañas, típico de la Patagonia", 2], ["F", "Filatelia", "Afición a coleccionar sellos de correo", 3], ["F", "Fósforo", "Elemento químico de símbolo P", 3],
  ["F", "Flamenco", "Ave rosada que se para en una pata; también un baile español", 2], ["F", "Fonda", "Lugar donde se celebra el 18 con cueca y empanadas", 1],
  ["G", "Gabriela", "Nombre de Mistral, la primera latinoamericana en ganar el Nobel de Literatura", 2], ["G", "Glaciar", "Masa de hielo que avanza lentamente, como el Grey", 2], ["G", "Galvanizar", "Recubrir un metal con zinc para protegerlo", 3],
  ["G", "Girasol", "Flor amarilla que se mueve siguiendo al sol", 1], ["G", "Gótico", "Estilo de catedrales con arcos en punta, como Notre Dame", 3],
  ["H", "Hidalgo", "Persona de la baja nobleza, como don Quijote", 3], ["H", "Hemiciclo", "Sala con forma de medio círculo, como la del Congreso", 3], ["H", "Huaso", "Hombre de campo chileno con manta y chupalla", 1],
  ["H", "Hipopótamo", "Animal africano enorme que pasa el día en el agua", 1], ["H", "Huracán", "Tormenta tropical con vientos muy fuertes", 2],
  ["I", "Inca", "Imperio que llegó por el sur hasta el río Maule", 2], ["I", "Iquique", "Ciudad frente a la cual fue el combate naval de 1879", 2], ["I", "Idiosincrasia", "Rasgos propios de una persona o de un pueblo", 3],
  ["I", "Iglú", "Casa de hielo de los inuit", 1], ["I", "Incógnito", "Que no quiere ser reconocido", 3],
  ["J", "Júpiter", "El planeta más grande del sistema solar", 2], ["J", "Jaguar", "El felino más grande de América", 2], ["J", "Juan Fernández", "Archipiélago donde vivió el náufrago que inspiró a Robinson Crusoe", 3],
  ["J", "Jardinero", "El que cuida las plantas y el pasto", 1], ["J", "Jeroglífico", "Escritura con dibujos de los antiguos egipcios", 2],
  ["L", "Lapislázuli", "Piedra azul, piedra nacional de Chile", 3], ["L", "Lautaro", "Toqui mapuche que derrotó a Pedro de Valdivia", 2], ["L", "Longevo", "Que vive muchos años", 3],
  ["L", "León", "El rey de la selva", 1], ["L", "Litio", "Metal liviano de las baterías, abundante en el salar de Atacama", 2],
  ["M", "Mapudungun", "Lengua del pueblo mapuche", 2], ["M", "Meteorito", "Roca del espacio que cae a la Tierra", 2], ["M", "Magallanes", "Navegante que cruzó en 1520 el estrecho que hoy lleva su nombre", 2],
  ["M", "Mariposa", "Insecto que antes fue oruga", 1], ["M", "Melancolía", "Tristeza vaga y tranquila", 3],
  ["N", "Neruda", "Poeta chileno, premio Nobel de Literatura en 1971", 2], ["N", "Nimbo", "Nube gris que trae lluvia", 3], ["N", "Neófito", "Persona recién iniciada en algo", 3],
  ["N", "Naranja", "Fruta y color a la vez", 1], ["N", "Nostalgia", "Pena por algo que ya pasó o que está lejos", 2],
  ["Ñ", "Ñuñoa", "Comuna de Santiago donde está el Estadio Nacional", 2], ["Ñ", "Pañuelo", "Lo que se agita al bailar cueca", 1, true], ["Ñ", "Albañil", "Obrero que construye con ladrillos", 2, true],
  ["Ñ", "Hazaña", "Acción heroica o muy difícil", 3, true], ["Ñ", "Cigüeña", "Ave que, según el cuento, trae a los bebés", 2, true], ["Ñ", "Araña", "Animal de ocho patas que teje telas", 1, true],
  ["O", "Ornitorrinco", "Mamífero que pone huevos y tiene pico de pato", 2], ["O", "Oasis", "Lugar con agua y vegetación en medio del desierto", 2], ["O", "Obsoleto", "Anticuado, que ya no se usa", 3],
  ["O", "Orquesta", "Conjunto grande de músicos con director", 1], ["O", "Ópalo", "Piedra preciosa de reflejos de colores", 3],
  ["P", "Patagonia", "Región austral que comparten Chile y Argentina", 2], ["P", "Pehuén", "Araucaria, en mapudungun", 3], ["P", "Políglota", "Que habla varios idiomas", 3],
  ["P", "Pebre", "Salsa chilena de tomate, cebolla, cilantro y ají", 1], ["P", "Pirámide", "Construcción de los faraones en Egipto", 1],
  ["Q", "Quetzal", "Ave sagrada de los mayas, de plumas verdes", 3], ["Q", "Quijote", "Caballero andante creado por Cervantes", 2], ["Q", "Quimera", "Ilusión imposible de cumplir", 3],
  ["Q", "Quinoa", "Semilla andina muy nutritiva", 2], ["Q", "Quesillo", "Queso fresco y blando, típico de Chile", 1],
  ["R", "Rapa Nui", "Nombre polinésico de Isla de Pascua", 2], ["R", "Rúbrica", "Trazo que acompaña a la firma", 3], ["R", "Rinoceronte", "Animal grande con uno o dos cuernos en la nariz", 1],
  ["R", "Recóndito", "Muy escondido, apartado", 3], ["R", "Rascacielos", "Edificio altísimo", 1],
  ["S", "Salitre", "El «oro blanco» del norte chileno a fines del siglo XIX", 2], ["S", "Sinónimo", "Palabra que significa lo mismo que otra", 2], ["S", "Sextante", "Instrumento para medir la altura de los astros al navegar", 3],
  ["S", "Sirena", "Mujer con cola de pez", 1], ["S", "Sismógrafo", "Aparato que registra los temblores", 2],
  ["T", "Tsunami", "Ola gigante causada por un terremoto en el mar", 2], ["T", "Tritón", "Semidiós marino, hijo de Poseidón", 3], ["T", "Taimado", "En Chile, persona enojada que no quiere hablar", 3],
  ["T", "Tortuga", "Animal lento que lleva su casa a cuestas", 1], ["T", "Telescopio", "Instrumento para mirar los astros", 1],
  ["U", "Utopía", "Lugar o sociedad ideal que no existe", 3], ["U", "Unicornio", "Caballo mitológico con un cuerno", 1], ["U", "Ubicuo", "Que está en todas partes a la vez", 3],
  ["U", "Urraca", "Ave que, según se dice, roba cosas brillantes", 2], ["U", "Uniforme", "Ropa igual para todos los de un colegio o equipo", 1],
  ["V", "Valdivia", "Conquistador que fundó Santiago en 1541", 2], ["V", "Vertiginoso", "Muy rápido, que da vértigo", 3], ["V", "Vicuña", "Camélido andino de lana finísima", 2],
  ["V", "Velero", "Barco que se mueve con el viento", 1], ["V", "Vendimia", "Cosecha de la uva", 2],
  ["X", "Xilófono", "Instrumento de placas que se golpean con baquetas", 2], ["X", "Oxígeno", "Gas que respiramos", 1, true], ["X", "Exhausto", "Muy, muy cansado", 3, true],
  ["X", "Boxeo", "Deporte de golpes con guantes", 1, true], ["X", "Éxtasis", "Estado de alegría o admiración extrema", 3, true],
  ["Y", "Yunque", "Bloque de hierro sobre el que se forja el metal", 3], ["Y", "Yaganes", "Pueblo canoero del extremo sur de Chile", 3], ["Y", "Yeso", "Mineral blanco que se usa para enlucir paredes", 2],
  ["Y", "Yoga", "Práctica de posturas y respiración que viene de la India", 1], ["Y", "Yacimiento", "Lugar donde hay minerales o restos arqueológicos", 2],
  ["Z", "Zafiro", "Piedra preciosa azul", 2], ["Z", "Zigzag", "Línea quebrada en ángulos alternos", 2], ["Z", "Zalamero", "Que halaga de manera exagerada", 3],
  ["Z", "Zoológico", "Lugar donde se exhiben animales", 1], ["Z", "Zodiaco", "Las doce constelaciones de los signos", 2],
]);

const FUTBOL_NUEVAS = d([
  ["A", "Árbitro", "El que dirige el partido", 1], ["A", "Ajax", "Club de Ámsterdam, cuna del «fútbol total»", 3],
  ["B", "Balón", "La pelota", 1], ["B", "Bombonera", "Estadio de Boca Juniors", 2], ["B", "Beckenbauer", "El «Káiser» alemán", 3],
  ["C", "Capitán", "El que lleva el brazalete", 1], ["C", "Cruyff", "Holandés símbolo del fútbol total", 3], ["C", "Caszely", "Delantero de Colo-Colo de los 70, «el Rey del metro cuadrado»", 3],
  ["D", "Di Stéfano", "La «Saeta Rubia» del Real Madrid", 3], ["D", "Derbi", "Partido entre dos rivales de la misma ciudad", 2],
  ["E", "Entrenador", "El que dirige al equipo desde la banca", 1], ["E", "Eusébio", "La «Pantera Negra» de Portugal y el Benfica", 3],
  ["F", "Fair play", "Juego limpio, dicho en inglés", 2], ["F", "Fichaje", "Contratación de un jugador nuevo", 1],
  ["G", "Garrincha", "Brasileño de piernas chuecas, figura del Mundial de Chile 1962", 3], ["G", "Galería", "En Chile, la tribuna popular del estadio", 1],
  ["H", "Hinchada", "Los que alientan desde la tribuna", 1], ["H", "Henry", "Thierry, máximo goleador histórico del Arsenal", 3],
  ["I", "Ibrahimović", "Sueco que jugó en Ajax, Juventus, Inter, Barcelona, Milan y PSG", 3], ["I", "Ida", "El primer partido de una llave", 1],
  ["J", "Juninho", "Brasileño famoso por sus tiros libres en el Lyon", 3], ["J", "Jugada", "Acción armada entre varios jugadores", 1],
  ["L", "Lateral", "Defensa que juega por la banda", 1], ["L", "Líbero", "Defensa que juega detrás de la línea de zagueros", 2], ["L", "Livingstone", "Sergio, «el Sapo», arquero histórico de la Católica", 3],
  ["M", "Mundial", "El campeonato del mundo de selecciones", 1], ["M", "Maracanazo", "La victoria de Uruguay sobre Brasil en la final de 1950", 3],
  ["N", "Nazário", "Apellido de Ronaldo, «el Fenómeno»", 3], ["N", "Nacional", "Club de Montevideo, el gran rival de Peñarol", 2],
  ["Ñ", "Peñarol", "Club uruguayo cinco veces campeón de la Libertadores", 3, true], ["Ñ", "Muñequera", "Banda elástica que algunos usan en la muñeca", 2, true],
  ["O", "Once", "Jugadores de un equipo en cancha", 1], ["O", "O'Higgins", "Club de Rancagua, «el Capo de Provincia»", 2],
  ["P", "Portería", "Otra forma de decirle al arco", 1], ["P", "Panenka", "Penal picado al medio, por el checo que lo hizo en 1976", 3],
  ["Q", "Iquique", "Deportes …, «los Dragones Celestes»", 3, true], ["Q", "Querétaro", "Ciudad mexicana con un club llamado igual, «los Gallos Blancos»", 3],
  ["R", "Rival", "El equipo contrario", 1], ["R", "Rivaldo", "Brasileño, Balón de Oro 1999", 3],
  ["S", "Silbato", "Lo que hace sonar el árbitro", 1], ["S", "Sampaoli", "Técnico de Chile campeón de América 2015", 2], ["S", "Sócrates", "Médico y capitán de Brasil en el Mundial 1982", 3],
  ["T", "Tribuna", "Las gradas del estadio", 1], ["T", "Totti", "Capitán eterno de la Roma", 3], ["T", "Tiqui-taca", "Juego de toque corto y posesión del Barcelona de Guardiola", 2],
  ["U", "Universidad de Chile", "El «Ballet Azul» de los años 60", 3], ["U", "Uniforme", "Camiseta, short y medias del equipo", 1],
  ["V", "Victoria", "Ganar el partido", 1], ["V", "Valdivia", "Jorge, «el Mago», volante de Colo-Colo y la Roja", 2], ["V", "Van Basten", "Holandés tres veces Balón de Oro", 3],
  ["X", "Xavi", "Volante del Barcelona, campeón del mundo en 2010", 2],
  ["Y", "Uruguay", "Selección conocida como «la Celeste»", 1, true], ["Y", "Yashin", "Lev, el único arquero que ganó el Balón de Oro", 3],
  ["Z", "Zurdo", "Jugador que patea con la izquierda", 1], ["Z", "Zico", "El «Pelé blanco» brasileño", 3], ["Z", "Zagallo", "Campeón del mundo como jugador y como técnico con Brasil", 3],
]);

export const BANCO: Record<"general" | "futbol", Def[]> = {
  general: [...deAntes(ROSCOS.general, [1, 1, 2]), ...GENERAL_NUEVAS],
  futbol: [...deAntes(ROSCOS.futbol, [2, 2, 2]), ...FUTBOL_NUEVAS],
};

/** Arma un rosco: para cada letra, una definición del nivel pedido (o la más cercana). `evitar` = respuestas ya usadas. */
export function armarRosco(tema: "general" | "futbol", nivel: 1 | 2 | 3, evitar: Set<string> = new Set(), azar = Math.random): number[] {
  const banco = BANCO[tema];
  return LETRAS_ROSCO.map(l => {
    const deLetra = banco.map((x, i) => ({ x, i })).filter(({ x }) => x.l === l);
    for (const dist of [0, 1, 2]) {
      const ok = deLetra.filter(({ x }) => Math.abs(x.n - nivel) === dist && !evitar.has(x.r));
      if (ok.length) { const e = ok[Math.floor(azar() * ok.length)]; evitar.add(e.x.r); return e.i; }
    }
    return deLetra[0]?.i ?? 0;
  });
}

// ── UNA DE CUATRO: [pregunta, correcta, incorrecta, incorrecta, incorrecta, nivel] ──
type P = [string, string, string, string, string, 1 | 2 | 3];
export const CUATRO: Record<"general" | "futbol", P[]> = {
  general: [
    ["¿Qué planeta es conocido como el planeta rojo?", "Marte", "Venus", "Júpiter", "Mercurio", 1],
    ["¿Quién pintó la Mona Lisa?", "Leonardo da Vinci", "Miguel Ángel", "Rafael", "Botticelli", 1],
    ["¿Cuál es el océano más grande?", "Pacífico", "Atlántico", "Índico", "Ártico", 1],
    ["¿Cuál es la principal exportación de Chile?", "Cobre", "Litio", "Salitre", "Hierro", 1],
    ["¿Cuál es el animal terrestre más rápido?", "Guepardo", "León", "Antílope", "Caballo", 1],
    ["¿Qué país tiene forma de bota?", "Italia", "Grecia", "Portugal", "Croacia", 1],
    ["¿Cuántos jugadores tiene un equipo de básquetbol en cancha?", "5", "6", "7", "4", 1],
    ["¿En qué continente está Egipto?", "África", "Asia", "Europa", "Oceanía", 1],
    ["¿Cuántos lados tiene un hexágono?", "6", "5", "8", "7", 1],
    ["¿Quién formuló la teoría de la relatividad?", "Albert Einstein", "Isaac Newton", "Galileo Galilei", "Nikola Tesla", 1],
    ["¿En qué año llegó Colón a América?", "1492", "1498", "1500", "1485", 1],
    ["¿Cuál es el país más grande del mundo?", "Rusia", "Canadá", "China", "Estados Unidos", 1],
    ["¿Cuál es el planeta más cercano al Sol?", "Mercurio", "Venus", "Marte", "Tierra", 1],
    ["¿Quién escribió «Don Quijote de la Mancha»?", "Miguel de Cervantes", "Lope de Vega", "Francisco de Quevedo", "Calderón de la Barca", 1],
    ["¿Qué idioma se habla oficialmente en Brasil?", "Portugués", "Español", "Inglés", "Francés", 1],
    ["¿En qué país están las pirámides de Giza?", "Egipto", "México", "Perú", "Sudán", 1],
    ["¿Qué pueblo construyó Machu Picchu?", "Los incas", "Los mayas", "Los aztecas", "Los diaguitas", 1],
    ["¿Qué cerro de Santiago tiene una Virgen en la cima?", "San Cristóbal", "Santa Lucía", "Manquehue", "El Plomo", 1],
    ["¿Cuántos años de casados son las bodas de oro?", "50", "25", "40", "60", 1],
    ["¿En qué país nació el tango?", "Argentina", "España", "Cuba", "Colombia", 1],
    ["¿Cuál es la capital de Australia?", "Canberra", "Sídney", "Melbourne", "Perth", 2],
    ["¿En qué año llegó el ser humano a la Luna?", "1969", "1965", "1972", "1959", 2],
    ["¿Cuántos huesos tiene el cuerpo humano adulto?", "206", "186", "226", "256", 2],
    ["¿Quién escribió «Cien años de soledad»?", "Gabriel García Márquez", "Mario Vargas Llosa", "Julio Cortázar", "Isabel Allende", 2],
    ["¿Cuántas regiones tiene Chile?", "16", "15", "13", "18", 2],
    ["¿En qué año fue el terremoto de Valdivia, el más fuerte registrado?", "1960", "1939", "1985", "2010", 2],
    ["¿Qué idioma tiene más hablantes nativos?", "Chino mandarín", "Inglés", "Español", "Hindi", 2],
    ["¿Cuál es la montaña más alta de América?", "Aconcagua", "Ojos del Salado", "Denali", "Chimborazo", 2],
    ["¿Cuál es el hueso más largo del cuerpo?", "Fémur", "Tibia", "Húmero", "Peroné", 2],
    ["¿Qué gas absorben las plantas para la fotosíntesis?", "Dióxido de carbono", "Oxígeno", "Nitrógeno", "Hidrógeno", 2],
    ["¿Quién compuso «Gracias a la vida»?", "Violeta Parra", "Víctor Jara", "Mercedes Sosa", "Margot Loyola", 2],
    ["¿Cuál es la moneda de Japón?", "Yen", "Won", "Yuan", "Rupia", 2],
    ["¿Qué instrumento tiene 88 teclas?", "Piano", "Órgano", "Acordeón", "Clavecín", 2],
    ["¿Cuál es la capital de Canadá?", "Ottawa", "Toronto", "Montreal", "Vancouver", 2],
    ["¿Qué vitamina produce la piel con el sol?", "D", "C", "A", "B12", 2],
    ["¿Qué país le regaló la Estatua de la Libertad a Estados Unidos?", "Francia", "Inglaterra", "España", "Italia", 2],
    ["¿Cuántos minutos tiene un día?", "1.440", "1.240", "1.400", "1.640", 2],
    ["¿Qué descubrió Alexander Fleming?", "La penicilina", "La insulina", "Los rayos X", "La vacuna de la viruela", 2],
    ["¿Cuál es el símbolo químico del oro?", "Au", "Ag", "Or", "Go", 2],
    ["¿Cuál es la ciudad más austral de Chile continental?", "Punta Arenas", "Puerto Natales", "Puerto Montt", "Coyhaique", 2],
    ["¿Qué animal es el símbolo de la WWF?", "El panda", "El tigre", "El koala", "El elefante", 2],
    ["¿Cuál es el órgano más grande del cuerpo humano?", "La piel", "El hígado", "El intestino", "El pulmón", 2],
    ["¿En qué año terminó la Segunda Guerra Mundial?", "1945", "1944", "1939", "1950", 2],
    ["¿Qué compositor siguió componiendo después de quedar sordo?", "Beethoven", "Mozart", "Bach", "Chopin", 2],
    ["¿Cuántos jugadores tiene un equipo de vóleibol en cancha?", "6", "5", "7", "9", 2],
    ["¿Qué es un sommelier?", "Un experto en vinos", "Un chef de postres", "Un barista", "Un garzón jefe", 2],
    ["¿Cuántos años de casados son las bodas de plata?", "25", "50", "10", "15", 2],
    ["¿Quién fue la primera mujer en ganar el Nobel de Literatura en Latinoamérica?", "Gabriela Mistral", "Isabel Allende", "Violeta Parra", "Alfonsina Storni", 2],
    ["¿Quién fue el primero en usar el título de Presidente de Chile?", "Manuel Blanco Encalada", "Bernardo O'Higgins", "José Miguel Carrera", "Diego Portales", 3],
    ["¿Cuál es el río más largo de Chile?", "Loa", "Biobío", "Maipo", "Maule", 3],
    ["¿Cuántos corazones tiene un pulpo?", "3", "1", "2", "8", 3],
    ["¿Cerca de qué localidad está el observatorio ALMA?", "San Pedro de Atacama", "La Serena", "Antofagasta", "Vicuña", 3],
    ["¿Qué país tiene más habitantes hoy?", "India", "China", "Estados Unidos", "Indonesia", 3],
    ["¿Cuál es la capital de Nueva Zelanda?", "Wellington", "Auckland", "Christchurch", "Queenstown", 3],
    ["¿Cuál es el lago más grande que está completamente en Chile?", "Llanquihue", "Ranco", "Villarrica", "Rapel", 3],
    ["¿Qué poeta chileno escribió «Altazor»?", "Vicente Huidobro", "Pablo Neruda", "Nicanor Parra", "Gonzalo Rojas", 3],
    ["¿Cuál es aproximadamente la velocidad de la luz?", "300.000 km/s", "30.000 km/s", "3.000 km/s", "3.000.000 km/s", 3],
    ["¿Qué planeta tiene más lunas conocidas?", "Saturno", "Júpiter", "Urano", "Neptuno", 3],
    ["¿Cuántos años de casados son las bodas de papel?", "1", "5", "10", "2", 3],
    ["¿Qué toqui mapuche derrotó a Pedro de Valdivia en Tucapel?", "Lautaro", "Caupolicán", "Galvarino", "Colo Colo", 3],
    ["¿En qué año se fundó Santiago?", "1541", "1536", "1550", "1810", 3],
    ["¿Cuál es la piedra nacional de Chile?", "Lapislázuli", "Cuarzo", "Jade", "Ópalo", 3],
  ],
  futbol: [
    ["¿Qué país ganó el Mundial 2022?", "Argentina", "Francia", "Croacia", "Brasil", 1],
    ["¿Cuántas Copas América ha ganado Chile?", "2", "1", "3", "0", 1],
    ["¿En qué año organizó Chile el Mundial?", "1962", "1958", "1970", "1950", 1],
    ["¿Qué club ganó la Copa Libertadores 1991?", "Colo-Colo", "Olimpia", "Boca Juniors", "São Paulo", 1],
    ["¿Cuántos Mundiales ha ganado Brasil?", "5", "4", "6", "3", 1],
    ["¿A qué jugador le dicen «la Pulga»?", "Messi", "Neymar", "Agüero", "Di María", 1],
    ["¿En qué país se jugó el Mundial 2014?", "Brasil", "Sudáfrica", "Alemania", "Rusia", 1],
    ["¿Qué club tiene más Champions League?", "Real Madrid", "Milan", "Bayern Múnich", "Liverpool", 1],
    ["¿Qué club chileno es «el Cacique»?", "Colo-Colo", "Universidad de Chile", "Universidad Católica", "Cobreloa", 1],
    ["¿Contra quién jugó Chile la final de la Copa América 2015?", "Argentina", "Brasil", "Perú", "Uruguay", 1],
    ["¿Cuál es el estadio de Colo-Colo?", "Monumental David Arellano", "Estadio Nacional", "San Carlos de Apoquindo", "Santa Laura", 1],
    ["¿Quién es el máximo goleador histórico de la Roja?", "Alexis Sánchez", "Marcelo Salas", "Iván Zamorano", "Eduardo Vargas", 2],
    ["¿Qué lugar sacó Chile en el Mundial de 1962?", "Tercero", "Segundo", "Cuarto", "Quinto", 2],
    ["¿Qué selección es «la Naranja Mecánica»?", "Países Bajos", "Bélgica", "Costa de Marfil", "Irlanda", 2],
    ["¿De qué ciudad es Cobreloa?", "Calama", "Antofagasta", "Copiapó", "Iquique", 2],
    ["¿En qué año ganó la U la Copa Sudamericana?", "2011", "2009", "2013", "2015", 2],
    ["¿Qué selección ganó el primer Mundial?", "Uruguay", "Argentina", "Italia", "Brasil", 2],
    ["¿Qué chileno jugó en el Real Madrid y en el Inter?", "Iván Zamorano", "Marcelo Salas", "Arturo Vidal", "Gary Medel", 2],
    ["¿Cuántos Mundiales ha ganado Alemania?", "4", "3", "5", "2", 2],
    ["¿Quién era el técnico de Chile en el Mundial 2010?", "Marcelo Bielsa", "Jorge Sampaoli", "Nelson Acosta", "Claudio Borghi", 2],
    ["¿Qué significa la sigla VAR?", "Video Assistant Referee", "Video Árbitro Remoto", "Verificación Automática de Reglas", "Visión Asistida del Réferi", 2],
    ["¿Quién dirigía a Chile en la Copa América Centenario 2016?", "Juan Antonio Pizzi", "Jorge Sampaoli", "Marcelo Bielsa", "Reinaldo Rueda", 3],
    ["¿Quién ganó el Balón de Oro 2024?", "Rodri", "Vinícius Júnior", "Jude Bellingham", "Erling Haaland", 3],
    ["¿Quién tiene más goles en la historia de los Mundiales?", "Miroslav Klose", "Ronaldo Nazário", "Lionel Messi", "Pelé", 3],
    ["¿Dónde se jugará el Mundial 2030?", "España, Portugal y Marruecos", "Argentina, Uruguay y Paraguay", "Arabia Saudita", "Estados Unidos y México", 3],
    ["¿Qué club chileno llegó primero a una final de Libertadores?", "Colo-Colo (1973)", "Unión Española (1975)", "Cobreloa (1981)", "Universidad Católica (1993)", 3],
    ["¿Cuántas Libertadores ha ganado Peñarol?", "5", "3", "4", "7", 3],
    ["¿Qué arquero es el único que ha ganado el Balón de Oro?", "Lev Yashin", "Gianluigi Buffon", "Iker Casillas", "Manuel Neuer", 3],
    ["¿Qué jugador brasileño fue la gran figura del Mundial de Chile 1962?", "Garrincha", "Pelé", "Zico", "Romário", 3],
  ],
};

// ── Palabras para los puzzles: las respuestas de una sola palabra del banco, más algunas de la boda ──
const EXTRA_PUZZLE = ["NOVIOS", "ANILLO", "BRINDIS", "PADRINOS", "VESTIDO", "INVITADOS", "CELEBRACION", "PROMESA", "TORTA", "CHAMPAÑA", "BAILE", "ALIANZA", "COMPROMISO", "LUNA DE MIEL"];
const sinTilde = (s: string) => s.split("Ñ").map(x => x.normalize("NFD").replace(/[\u0300-\u036f]/g, "")).join("Ñ");
export function palabrasPuzzle(tema: "general" | "futbol", nivel: 1 | 2 | 3): string[] {
  const base = BANCO[tema].filter(x => Math.abs(x.n - nivel) <= 1).map(x => x.r);
  const todas = [...base, ...(tema === "general" ? EXTRA_PUZZLE : [])]
    .map(p => sinTilde(p.toUpperCase()))
    .filter(p => /^[A-ZÑ]+$/.test(p) && p.length >= 4 && p.length <= (nivel === 1 ? 7 : nivel === 2 ? 9 : 12));
  return Array.from(new Set(todas));
}
/** La pista de cada palabra del puzzle: su definición en el banco (si la tiene). */
export function pistaDe(tema: "general" | "futbol", palabra: string): string {
  const x = BANCO[tema].find(b => sinTilde(b.r.toUpperCase()) === palabra);
  return x ? x.d : tema === "general" ? "Tiene que ver con una boda" : "";
}
