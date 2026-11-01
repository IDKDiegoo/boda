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
  // 31-oct: más variedad (Ronaldo y Haaland se repetían)
  ["A", "Agüero", "«El Kun», goleador histórico del Manchester City", 2], ["A", "Aránguiz", "Charles, «el Príncipe», volante de la Roja bicampeona", 2], ["A", "Alargue", "Tiempo extra de 30 minutos", 1],
  ["B", "Brasil", "La selección con más Mundiales", 1], ["B", "Benzema", "Francés, Balón de Oro 2022", 2], ["B", "Bielsa", "«El Loco», técnico de Chile en el Mundial 2010", 2],
  ["C", "Cobreloa", "Club de Calama, «los Loínos»", 2], ["C", "Cabezazo", "Golpe a la pelota con la cabeza", 1], ["C", "Casillas", "Iker, arquero campeón del mundo con España", 2],
  ["D", "Dembélé", "Ousmane, francés Balón de Oro 2025", 3], ["D", "Di María", "«El Fideo», autor del gol de la final de la Copa América 2021", 3],
  ["E", "Everton", "Club de Viña del Mar, «los Ruleteros»", 2], ["E", "Expulsado", "El que ve la tarjeta roja", 1],
  ["F", "Francia", "Campeona del mundo en 1998 y 2018", 2], ["F", "Fútbol", "Deporte de once contra once", 1],
  ["G", "Guantes", "Los usa el arquero", 1], ["G", "Griezmann", "Francés campeón del mundo 2018, figura del Atlético de Madrid", 2],
  ["H", "Hincha", "Fanático de un club", 1], ["H", "Huachipato", "Club de Talcahuano, «los Acereros»", 2],
  ["I", "Italia", "La «Azzurra», cuatro veces campeona del mundo", 2], ["I", "Interior", "Volante que juega por dentro de la cancha", 2],
  ["J", "Juez", "Otra forma de decirle al árbitro", 1], ["J", "Jara", "Gonzalo, defensa central de la Roja bicampeona de América", 3],
  ["L", "Luis Suárez", "Uruguayo del tridente «MSN» del Barcelona", 2], ["L", "Lionel", "El nombre de Messi", 1],
  ["M", "Medel", "Gary, «el Pitbull»", 1], ["M", "Mbappé", "Delantero francés campeón del mundo a los 19 años", 2], ["M", "Modric", "Croata, Balón de Oro 2018", 2],
  ["N", "Neuer", "Manuel, arquero alemán campeón del mundo 2014", 2], ["Ñ", "Cañonazo", "Remate muy fuerte", 1, true],
  ["O", "Olimpia", "Club paraguayo, rival de Colo-Colo en la final de 1991", 2], ["O", "Orsai", "Así se pronuncia «offside» en Chile", 1],
  ["P", "Pase", "Entregar la pelota a un compañero", 1], ["P", "Pellegrini", "Manuel, «el Ingeniero», campeón de la Premier con el Manchester City", 2], ["P", "Pizarro", "David, volante chileno de la Roma y la Fiorentina", 3],
  ["Q", "Izquierda", "La pierna buena del zurdo", 1, true], ["Q", "Quilmes", "Club argentino conocido como «el Cervecero»", 3],
  ["R", "Rodri", "Volante español, Balón de Oro 2024", 2], ["R", "Remate", "Tiro al arco", 1], ["R", "Romário", "Brasileño, figura del Mundial 1994", 3],
  ["S", "Suazo", "Humberto, «Chupete»", 2], ["S", "Salah", "Egipcio goleador del Liverpool", 2], ["S", "Saque de banda", "Se hace con las manos desde la línea lateral", 1],
  ["T", "Travesaño", "El palo horizontal del arco", 1], ["T", "Ter Stegen", "Arquero alemán del Barcelona", 3],
  ["U", "Unión Española", "Club de Independencia, «los Hispanos»", 2],
  ["V", "Vinícius", "Brasileño del Real Madrid, «Vini Jr.»", 2], ["V", "Volea", "Patear la pelota antes de que toque el suelo", 2],
  ["X", "Xabi Alonso", "Español que hizo campeón invicto al Leverkusen y después dirigió al Real Madrid", 3], ["X", "Máximo", "El que hace más goles en un torneo es el … goleador", 1, true],
  ["Y", "Rayados", "Apodo del Monterrey de México", 3, true], ["Y", "Yerry Mina", "Defensa central colombiano", 3],
  ["Z", "Zaguero", "Defensa central", 1], ["Z", "Zlatan", "El nombre de Ibrahimović", 2],
]);

const CHILE = d([
  ["A", "Arica", "La ciudad más al norte de Chile, «la ciudad de la eterna primavera»", 2], ["A", "Alerce", "Árbol milenario del sur, de los más longevos del mundo", 2],
  ["B", "Bandera", "La de Chile tiene una estrella blanca", 1], ["B", "Bachelet", "Apellido de la primera mujer presidenta de Chile", 1],
  ["C", "Chillán", "Capital de la región de Ñuble", 2], ["C", "Curanto", "Comida chilota cocida en un hoyo con piedras calientes", 2],
  ["D", "Dieciocho", "Así se les dice a las Fiestas Patrias", 1], ["D", "Desierto florido", "Fenómeno de flores en Atacama cuando llueve más de lo normal", 2],
  ["E", "Elqui", "Valle del pisco y de los observatorios", 2], ["E", "Esmeralda", "Corbeta de Arturo Prat en el combate naval de Iquique", 2],
  ["F", "Fiestas Patrias", "Celebración del 18 y 19 de septiembre", 1], ["F", "Frutillar", "Pueblo junto al lago Llanquihue con su famoso teatro", 3],
  ["G", "Guagua", "Así se le dice a un bebé en Chile", 1], ["G", "Guanaco", "Camélido salvaje de la Patagonia", 2],
  ["H", "Humita", "Masa de choclo envuelta en hojas de choclo", 1], ["H", "Huaso", "Hombre de campo con manta, chupalla y espuelas", 1],
  ["I", "Isla de Pascua", "Territorio chileno en la Polinesia, con moáis", 1], ["I", "Iquique", "Ciudad de la Zofri y de la playa Cavancha", 2],
  ["J", "Jote", "Ave carroñera negra; también un pretendiente insistente", 2], ["J", "Juan Fernández", "Archipiélago de Robinson Crusoe", 2],
  ["L", "La Moneda", "Palacio de gobierno de Chile", 1], ["L", "Lolo", "Adolescente, en chileno", 1],
  ["M", "Moái", "Estatuas gigantes de Rapa Nui", 1], ["M", "Mote con huesillo", "La bebida chilena del verano", 1],
  ["N", "Nevados de Chillán", "Centro de esquí y termas del sur", 3], ["N", "Neruda", "Poeta de Isla Negra, premio Nobel 1971", 2],
  ["Ñ", "Ñuble", "La región más nueva de Chile, creada en 2018", 2], ["Ñ", "Viña del Mar", "Ciudad jardín, sede del Festival", 1, true],
  ["O", "Osorno", "Volcán del sur famoso por su forma de cono perfecto", 2], ["O", "O'Higgins", "Bernardo, el padre de la patria", 1],
  ["P", "Prat", "Héroe del combate naval de Iquique", 1], ["P", "Pudú", "El ciervo más pequeño del mundo, del sur de Chile", 2],
  ["Q", "Quintrala", "Catalina de los Ríos, temida terrateniente de la Colonia", 3], ["Q", "Quillay", "Árbol nativo cuya corteza hace espuma con agua", 3],
  ["R", "Rancagua", "Ciudad de la batalla de 1814 conocida como el desastre", 2], ["R", "Remolienda", "Fiesta muy animada, a la chilena", 3],
  ["S", "Santiago", "Capital de Chile", 1], ["S", "Salar de Atacama", "El salar más grande de Chile", 2],
  ["T", "Torres del Paine", "Parque nacional de Magallanes", 1], ["T", "Taco", "Atasco de autos, en chileno", 1],
  ["U", "Unidad de fomento", "La UF: se usa para arriendos y créditos", 2], ["U", "Uva", "Fruta del pisco y del vino", 1],
  ["V", "Valparaíso", "Puerto de los cerros y los ascensores", 1], ["V", "Vino", "Bebida cuya cepa emblemática en Chile es el carmenere", 2],
  ["X", "Exportación", "Lo que hace Chile con la mayor parte de su cobre", 2, true], ["X", "Taxi colectivo", "Auto con recorrido fijo que lleva a varios pasajeros", 2, true],
  ["Y", "Yungay", "Comuna de Ñuble, barrio de Santiago y batalla de 1839", 3], ["Y", "Playa", "Donde se veranea en enero", 1, true],
  ["Z", "Zapallo", "Verdura que va en las sopaipillas", 1], ["Z", "Zona Franca", "La de Iquique, conocida como Zofri", 2],
]);
const AMOR = d([
  ["A", "Altar", "Lugar al que llega la novia", 1], ["A", "Aniversario", "Celebración de cada año de casados", 1],
  ["B", "Beso", "Lo que piden los invitados al grito de «¡que se besen!»", 1], ["B", "Banquete", "La gran comida de la celebración", 2],
  ["C", "Cupido", "Dios del amor con arco y flecha", 1], ["C", "Corazón", "Símbolo del amor", 1],
  ["D", "Despedida de soltero", "La última fiesta antes de casarse", 1], ["D", "Damas de honor", "Las que acompañan a la novia", 1],
  ["E", "Enamorados", "Los que se celebran el 14 de febrero", 1], ["E", "Esposos", "Marido y mujer", 1],
  ["F", "Fidelidad", "Lo que se promete en los votos", 2], ["F", "Flores", "Van en el ramo y en los centros de mesa", 1],
  ["G", "Guirnalda", "Adorno de flores en forma de cordón", 2], ["G", "Garzón", "El que sirve en el banquete", 1],
  ["H", "Hora loca", "Momento de la fiesta con cotillón y disfraces", 1], ["H", "Himeneo", "Nombre poético y antiguo de la boda", 3],
  ["I", "Invitación", "Tarjeta que anuncia la boda", 1], ["I", "Ilusión", "Lo que se siente antes del gran día", 2],
  ["J", "Juramento", "Promesa solemne", 2], ["J", "Jardín", "Lugar al aire libre donde muchos se casan", 1],
  ["L", "Luna de miel", "El viaje después de la boda", 1], ["L", "Liga", "Prenda que el novio lanza a los solteros", 1],
  ["M", "Matrimonio", "Unión de dos personas ante la ley", 1], ["M", "Madrina", "La que acompaña y respalda a los novios", 1],
  ["N", "Novio", "Hombre que se casa", 1], ["N", "Nupcias", "Otra palabra para la boda", 2],
  ["Ñ", "Sueño", "Lo que se cumple el día de la boda", 1, true], ["Ñ", "Cariño", "Afecto y ternura", 1, true],
  ["O", "Orquídea", "Flor elegante para el ramo", 2], ["O", "Oro", "Las bodas de los 50 años", 1],
  ["P", "Padrinos", "Los que acompañan a los novios y firman como testigos", 1], ["P", "Pétalos", "Lo que tiran los niños antes de que entre la novia", 1],
  ["Q", "Química", "Cuando dos se atraen se dice que hay…", 2], ["Q", "Querer", "Amar a alguien", 1],
  ["R", "Romance", "Relación amorosa", 1], ["R", "Registro Civil", "Donde se firma el matrimonio", 1],
  ["S", "Smoking", "Traje elegante del novio", 1], ["S", "Suegra", "La mamá de tu pareja", 1],
  ["T", "Testigo", "Firma el acta del matrimonio", 1], ["T", "Tul", "Tela liviana del velo", 2],
  ["U", "Unión", "Lo que se celebra en una boda", 1], ["U", "Ujier", "En algunas bodas, el que acompaña a los invitados a su asiento", 3],
  ["V", "Velo", "Tela que cubre a la novia", 1], ["V", "Votos", "Las promesas que se dicen los novios", 1],
  ["X", "Éxito", "Lo que se le desea a todo matrimonio", 2, true], ["X", "Taxi", "Lo que piden los invitados al final de la fiesta", 1, true],
  ["Y", "Yerno", "El esposo de tu hija", 2], ["Y", "Playa", "Destino típico de luna de miel", 1, true],
  ["Z", "Zapatos", "Los de la novia, que a veces se saca para bailar", 1], ["Z", "Alianza", "Otra forma de llamar al anillo de matrimonio", 2, true],
]);
export type TemaRosco = "general" | "futbol" | "chile" | "amor" | "mezcla";
export const TEMAS_ROSCO: [TemaRosco, string][] = [["general", "General"], ["futbol", "Futbolero"], ["chile", "Chile"], ["amor", "Amor y boda"], ["mezcla", "Mezcla"]];
const GENERAL = [...deAntes(ROSCOS.general, [1, 1, 2]), ...GENERAL_NUEVAS], FUTBOL = [...deAntes(ROSCOS.futbol, [2, 2, 2]), ...FUTBOL_NUEVAS];
export const BANCO: Record<TemaRosco, Def[]> = { general: GENERAL, futbol: FUTBOL, chile: CHILE, amor: AMOR, mezcla: [...GENERAL, ...FUTBOL, ...CHILE, ...AMOR] };

/** Arma un rosco: para cada letra, una definición del nivel pedido (o la más cercana). `evitar` = respuestas ya usadas. */
export function armarRosco(tema: TemaRosco, nivel: 1 | 2 | 3, evitar: Set<string> = new Set(), azar = Math.random): number[] {
  const banco = BANCO[tema] || BANCO.general;
  return LETRAS_ROSCO.map(l => {
    const deLetra = banco.map((x, i) => ({ x, i })).filter(({ x }) => x.l === l);
    // Primero lo del nivel pedido que no salió hace poco; si no hay, el nivel más cercano; si todo salió, se repite.
    for (const sinRepetir of [true, false]) for (const dist of [0, 1, 2]) {
      const ok = deLetra.filter(({ x }) => Math.abs(x.n - nivel) === dist && (!sinRepetir || !evitar.has(x.r)));
      if (ok.length) { const e = ok[Math.floor(azar() * ok.length)]; evitar.add(e.x.r); return e.i; }
    }
    return deLetra[0]?.i ?? 0;
  });
}
/** Lo que salió en las últimas partidas de este teléfono (para no repetir). */
const CLAVE_HIST = "mw_pasapalabra_salio";
export function historial(): Set<string> { try { return new Set(JSON.parse(localStorage.getItem(CLAVE_HIST) || "[]")); } catch { return new Set(); } }
export function anotarHistorial(usadas: string[]) {
  try { const l = Array.from(historial()).concat(Array.from(usadas)); localStorage.setItem(CLAVE_HIST, JSON.stringify(l.slice(-400))); } catch { /* sin almacenamiento: no pasa nada */ }
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
    ["¿Qué país ganó el Mundial 2010?", "España", "Países Bajos", "Alemania", "Uruguay", 1],
    ["¿Qué país ganó el Mundial 2018?", "Francia", "Croacia", "Bélgica", "Inglaterra", 1],
    ["¿Qué país ganó el Mundial 2014?", "Alemania", "Argentina", "Brasil", "Países Bajos", 1],
    ["¿En qué país se jugó el Mundial 2010?", "Sudáfrica", "Brasil", "Alemania", "Japón", 1],
    ["¿Cuánto dura cada tiempo de un partido?", "45 minutos", "40 minutos", "50 minutos", "30 minutos", 1],
    ["¿Qué número usaba Pelé en Brasil?", "10", "9", "7", "11", 1],
    ["¿En qué club juega Messi desde 2023?", "Inter Miami", "PSG", "Al Hilal", "Newell's", 1],
    ["¿A qué jugador le dicen «CR7»?", "Cristiano Ronaldo", "Ronaldinho", "Ronaldo Nazário", "Rivaldo", 1],
    ["¿De qué país es Haaland?", "Noruega", "Suecia", "Dinamarca", "Islandia", 1],
    ["¿Qué selección es «la Albiceleste»?", "Argentina", "Uruguay", "Paraguay", "Grecia", 1],
    ["¿Qué selección es «la Canarinha»?", "Brasil", "Colombia", "Ecuador", "Suecia", 1],
    ["¿Qué selección es «la Celeste»?", "Uruguay", "Argentina", "Italia", "Bolivia", 1],
    ["¿Cuál es el clásico del fútbol chileno?", "Colo-Colo contra la U", "Colo-Colo contra Cobreloa", "La U contra la Católica", "Everton contra Wanderers", 1],
    ["¿A qué jugador le dicen «el Kun»?", "Sergio Agüero", "Carlos Tévez", "Gonzalo Higuaín", "Mauro Icardi", 1],
    ["¿A qué jugador le dicen «el Pibe de Oro»?", "Maradona", "Messi", "Riquelme", "Batistuta", 1],
    ["¿A qué jugador le dicen «el Rey»?", "Arturo Vidal", "Alexis Sánchez", "Gary Medel", "Claudio Bravo", 1],
    ["¿A qué jugador le dicen «el Pitbull»?", "Gary Medel", "Arturo Vidal", "Gonzalo Jara", "Mauricio Isla", 1],
    ["¿A qué jugador le dicen «el Matador»?", "Marcelo Salas", "Iván Zamorano", "Humberto Suazo", "Esteban Paredes", 1],
    ["¿Qué club alemán ha ganado más Bundesligas?", "Bayern Múnich", "Borussia Dortmund", "Schalke 04", "Hamburgo", 1],
    ["¿Cuántos puntos da un partido ganado?", "3", "2", "1", "4", 1],
    ["¿Qué país organizó el Mundial 2026 junto a México y Canadá?", "Estados Unidos", "Brasil", "Colombia", "Cuba", 1],
    ["¿Cuántos cambios puede hacer hoy un equipo en un partido oficial?", "5", "3", "4", "6", 2],
    ["¿Qué club ganó la Champions League 2023?", "Manchester City", "Inter de Milán", "Real Madrid", "Bayern Múnich", 2],
    ["¿Qué club ganó la Champions League 2024?", "Real Madrid", "Borussia Dortmund", "PSG", "Bayern Múnich", 2],
    ["¿Quién ganó el Balón de Oro 2023?", "Lionel Messi", "Erling Haaland", "Kylian Mbappé", "Kevin De Bruyne", 2],
    ["¿En qué club saudí juega Cristiano Ronaldo?", "Al Nassr", "Al Hilal", "Al Ittihad", "Al Ahli", 2],
    ["¿De qué país es Luka Modric?", "Croacia", "Serbia", "Eslovenia", "Bosnia", 2],
    ["¿Qué club chileno es «el Chuncho»?", "Universidad de Chile", "Universidad Católica", "Colo-Colo", "Audax Italiano", 2],
    ["¿Quién pateó el penal que le dio a Chile la Copa América 2015?", "Alexis Sánchez", "Arturo Vidal", "Mauricio Isla", "Charles Aránguiz", 2],
    ["¿Qué arquero chileno le atajó un penal a Biglia en la final de 2016?", "Claudio Bravo", "Johnny Herrera", "Cristopher Toselli", "Gabriel Arias", 2],
    ["¿A qué jugador le dicen «la Joya»?", "Paulo Dybala", "Lautaro Martínez", "Julián Álvarez", "Enzo Fernández", 2],
    ["¿A qué jugador le dicen «el Fideo»?", "Ángel Di María", "Javier Mascherano", "Ezequiel Lavezzi", "Pablo Aimar", 2],
    ["¿A qué jugador le dicen «el Mago»?", "Jorge Valdivia", "Matías Fernández", "Marcelo Díaz", "David Pizarro", 2],
    ["¿A qué jugador le dicen «Chupete»?", "Humberto Suazo", "Esteban Paredes", "Eduardo Vargas", "Lucas Barrios", 2],
    ["¿A qué jugador le dicen «el Fenómeno»?", "Ronaldo Nazário", "Ronaldinho", "Romário", "Adriano", 2],
    ["¿Cuántos Mundiales ha ganado Argentina?", "3", "2", "4", "1", 2],
    ["¿Cuántos Mundiales ha ganado Francia?", "2", "1", "3", "4", 2],
    ["¿Quién dirigía a Argentina en el Mundial 2022?", "Lionel Scaloni", "Jorge Sampaoli", "Gerardo Martino", "Alejandro Sabella", 2],
    ["¿Qué club inglés es «los Diablos Rojos»?", "Manchester United", "Liverpool", "Arsenal", "Nottingham Forest", 2],
    ["¿Qué club ganó la Champions League 2025?", "PSG", "Inter de Milán", "Barcelona", "Arsenal", 3],
    ["¿Quién ganó el Balón de Oro 2025?", "Ousmane Dembélé", "Lamine Yamal", "Vitinha", "Mohamed Salah", 3],
    ["¿Contra quién jugó Colo-Colo la final de la Libertadores 1991?", "Olimpia", "Boca Juniors", "Nacional", "São Paulo", 3],
    ["¿Cuántos Mundiales jugó Chile entre 1930 y 2014?", "9", "7", "11", "8", 3],
    ["¿A qué jugador le dicen «la Saeta Rubia»?", "Alfredo Di Stéfano", "Ferenc Puskás", "Johan Cruyff", "Franz Beckenbauer", 3],
    ["¿Qué club argentino es «el Ciclón» de Boedo?", "San Lorenzo", "Racing", "Huracán", "Independiente", 3],
  ],
};

// ── Palabras para los puzzles: las respuestas de una sola palabra del banco, más algunas de la boda ──
const EXTRA_PUZZLE = ["NOVIOS", "ANILLO", "BRINDIS", "PADRINOS", "VESTIDO", "INVITADOS", "CELEBRACION", "PROMESA", "TORTA", "CHAMPAÑA", "BAILE", "ALIANZA", "COMPROMISO", "LUNA DE MIEL"];
const sinTilde = (s: string) => s.split("Ñ").map(x => x.normalize("NFD").replace(/[\u0300-\u036f]/g, "")).join("Ñ");
/** Preguntas de «Una de cuatro» para un tema (los temas sin preguntas propias usan las generales). */
export const cuatroDe = (tema: TemaRosco): P[] => tema === "futbol" ? CUATRO.futbol : tema === "mezcla" ? [...CUATRO.general, ...CUATRO.futbol] : CUATRO.general;
export function palabrasPuzzle(tema: TemaRosco, nivel: 1 | 2 | 3): string[] {
  const base = (BANCO[tema] || BANCO.general).filter(x => Math.abs(x.n - nivel) <= 1).map(x => x.r);
  const todas = [...base, ...(tema !== "futbol" ? EXTRA_PUZZLE : [])]
    .map(p => sinTilde(p.toUpperCase()))
    .filter(p => /^[A-ZÑ]+$/.test(p) && p.length >= 4 && p.length <= (nivel === 1 ? 7 : nivel === 2 ? 9 : 12));
  return Array.from(new Set(todas));
}
/** La pista de cada palabra del puzzle: su definición en el banco (si la tiene). */
export function pistaDe(tema: TemaRosco, palabra: string): string {
  const x = (BANCO[tema] || BANCO.general).find(b => sinTilde(b.r.toUpperCase()) === palabra) || BANCO.mezcla.find(b => sinTilde(b.r.toUpperCase()) === palabra);
  return x ? x.d : "Tiene que ver con una boda";
}

// ── LA PISTA: un concepto y 5 pistas de más vaga a más clara. Con la 1ª pista se ganan 5 s, con la 5ª, 1 s. ──
export const PISTAS: Record<"general" | "futbol", [string, string[]][]> = {
  general: [
    ["Torta", ["Se hace con harina", "Puede tener varios pisos", "A veces lleva velas", "Los novios la cortan juntos", "El pastel de la boda"]],
    ["Pingüino", ["Es un ave", "No vuela", "Nada muy bien", "Es blanco y negro", "Vive en la Antártica"]],
    ["Valparaíso", ["Es una ciudad chilena", "Tiene puerto", "Es Patrimonio de la Humanidad", "Es famosa por sus ascensores", "Allí está el Congreso"]],
    ["Guitarra", ["Es un instrumento", "Tiene caja de resonancia", "Puede ser eléctrica o acústica", "Tiene seis cuerdas", "Acompaña la cueca en las fondas"]],
    ["Luna", ["Está en el cielo", "Cambia de forma", "Provoca las mareas", "Neil Armstrong la pisó", "Es el satélite de la Tierra"]],
    ["Empanada", ["Es una comida", "Puede ir al horno o frita", "Lleva masa", "Viene rellena de pino", "Infaltable para el 18"]],
    ["Harry Potter", ["Es un personaje", "Usa lentes", "Tiene una cicatriz", "Estudia en Hogwarts", "El niño mago"]],
    ["Reloj", ["Lo usamos todos los días", "Puede ir en la muñeca", "Tiene manecillas o pantalla", "Marca el tiempo", "Da la hora"]],
    ["Café", ["Es una bebida", "Se toma caliente o frío", "Tiene cafeína", "Colombia y Brasil lo producen", "Expreso, capuchino, cortado"]],
    ["Bicicleta", ["Es un medio de transporte", "No usa motor", "Tiene cadena", "Tiene dos ruedas", "Se pedalea"]],
    ["Paraguas", ["Se lleva en la mano", "Se abre y se cierra", "Tiene varillas", "Se usa en invierno", "Protege de la lluvia"]],
    ["Isla de Pascua", ["Es parte de Chile", "Está en medio del Pacífico", "Se llega en avión desde Santiago", "Se llama Rapa Nui", "Tiene moáis"]],
    ["Anillo", ["Es una joya", "Es redondo", "Puede tener una piedra", "Va en el dedo", "Se intercambia en la boda"]],
    ["Semáforo", ["Está en la calle", "Tiene luces", "Cambia de color", "Rojo, amarillo y verde", "Ordena el tránsito"]],
    ["Volcán", ["Es una formación natural", "Chile tiene muchísimos", "Puede estar dormido", "Tiene cráter", "Hace erupción"]],
    ["Chocolate", ["Es un dulce", "Se derrite con el calor", "Viene del cacao", "Puede ser blanco, de leche o amargo", "En Pascua viene con forma de huevo"]],
    ["Avión", ["Es un medio de transporte", "Tiene alas", "Tiene piloto", "Despega y aterriza", "Vuela con pasajeros"]],
    ["Cumpleaños", ["Es una celebración", "Pasa una vez al año", "Hay regalos", "Se canta una canción", "Se soplan las velas"]],
    ["Sandía", ["Es una fruta", "Es de verano", "Tiene pepas", "Por fuera es verde", "Por dentro es roja"]],
    ["Celular", ["Lo llevas en el bolsillo", "Tiene batería", "Tiene cámara", "Tiene WhatsApp", "Sirve para llamar"]],
    ["Cueca", ["Es un baile", "Se baila en pareja", "Lleva pañuelo", "Se zapatea", "Es el baile nacional de Chile"]],
    ["Luna de miel", ["Es un viaje", "Suele ser a un lugar romántico", "Se hace una sola vez", "Va justo después de una celebración", "El viaje de los recién casados"]],
  ],
  futbol: [
    ["Messi", ["Es un jugador", "Es zurdo", "Jugó muchos años en España", "Ganó el Mundial 2022", "Argentino, «la Pulga»"]],
    ["Colo-Colo", ["Es un club", "Es de Santiago", "Es el más popular de Chile", "Juega en el Monumental", "Campeón de la Libertadores 1991"]],
    ["Penal", ["Es una jugada", "Se cobra por una falta", "Es dentro del área", "Es un mano a mano con el arquero", "Se patea desde los once metros"]],
    ["Mundial", ["Es un torneo", "Se juega cada cuatro años", "Lo juegan selecciones", "Brasil lo ganó cinco veces", "La Copa del Mundo"]],
    ["Arquero", ["Es una posición", "Usa guantes", "Puede usar las manos", "Se viste distinto al resto", "Cuida el arco"]],
    ["Alexis Sánchez", ["Es un jugador chileno", "Nació en Tocopilla", "Jugó en el Barcelona y el Arsenal", "Le dicen «el Niño Maravilla»", "Máximo goleador de la Roja"]],
    ["Maracaná", ["Es un estadio", "Está en Sudamérica", "Allí se jugaron dos finales de Mundial", "Está en Río de Janeiro", "El del Maracanazo"]],
    ["Tarjeta roja", ["La lleva el árbitro", "Es de un color", "Viene después de dos amarillas", "Te deja con uno menos", "Expulsión"]],
    ["Real Madrid", ["Es un club", "Es español", "Viste de blanco", "Juega en el Bernabéu", "El que más Champions tiene"]],
    ["Offside", ["Es una regla", "La marca el juez de línea", "Tiene que ver con el último defensa", "Se revisa con el VAR", "Fuera de juego"]],
    ["Copa América", ["Es un torneo", "Es de selecciones", "Es el más antiguo de su tipo", "Chile lo ganó en 2015 y 2016", "Lo juega Sudamérica"]],
    ["Zamorano", ["Es un jugador chileno", "Fue delantero", "Jugó en el Real Madrid", "Usó la camiseta «1+8» en el Inter", "«Bam Bam»"]],
    ["Chilena", ["Es una jugada", "Es acrobática", "Se patea de espaldas", "Con los pies por sobre la cabeza", "Lleva el nombre de nuestro país"]],
    ["Bombonera", ["Es un estadio", "Está en Buenos Aires", "Está en el barrio de La Boca", "Dicen que «no tiembla, late»", "La casa de Boca Juniors"]],
    ["VAR", ["Es una tecnología", "Llegó al fútbol hace pocos años", "Usa cámaras", "Revisa las jugadas polémicas", "El árbitro va a mirar la pantalla"]],
    ["Claudio Bravo", ["Es un jugador chileno", "Fue capitán", "Jugó en el Barcelona y el Manchester City", "Atajó penales en finales de Copa América", "El arquero de la Roja bicampeona"]],
    ["Pelé", ["Es un jugador", "Es brasileño", "Usaba la 10", "Ganó tres Mundiales", "«O Rei»"]],
    ["Champions League", ["Es un torneo", "Es de clubes", "Se juega en Europa", "Tiene un himno famoso", "La Liga de Campeones"]],
    ["Arturo Vidal", ["Es un jugador chileno", "Es volante", "Jugó en el Bayern, la Juventus y el Barcelona", "Es famoso por su mohicano", "«El Rey»"]],
    ["Estadio Nacional", ["Es un estadio", "Está en Santiago", "Está en Ñuñoa", "Allí se jugó la final del Mundial 62", "El más grande de Chile"]],
    ["Balón de Oro", ["Es un premio", "Es individual", "Lo entrega una revista francesa", "Messi tiene ocho", "Al mejor jugador del año"]],
    ["Córner", ["Es una jugada", "Se cobra cuando la pelota sale por la línea de fondo", "La última en tocarla fue un defensor", "Se patea desde una esquina", "Tiro de esquina"]],
    ["Barcelona", ["Es un club", "Es español", "Viste azul y grana", "Juega en el Camp Nou", "El club de Messi"]],
    ["Boca Juniors", ["Es un club", "Es argentino", "Viste azul y amarillo", "Su clásico es contra River", "Juega en la Bombonera"]],
    ["Hat-trick", ["Es una hazaña", "La hace un solo jugador", "Se lleva la pelota a la casa", "Son goles en un mismo partido", "Tres goles"]],
    ["Cristiano Ronaldo", ["Es un jugador", "Es portugués", "Jugó en el Manchester United y el Real Madrid", "Celebra con un salto y un grito", "«CR7»"]],
  ],
};
export const pistasDe = (tema: TemaRosco) => tema === "futbol" ? PISTAS.futbol : tema === "mezcla" ? [...PISTAS.general, ...PISTAS.futbol] : PISTAS.general;
/** Palabras con su definición para «Palabras cruzadas» y «La memoria» (palabras de 5 a 10 letras). */
export function palabrasConDef(tema: TemaRosco, nivel: 1 | 2 | 3): string[] {
  return palabrasPuzzle(tema, nivel).filter(p => p.length >= 5 && p.length <= 10);
}
