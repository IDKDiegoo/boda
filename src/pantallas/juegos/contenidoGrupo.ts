// ═══════════════════════════════════════════════════════════════════
// CONTENIDO DE LOS JUEGOS EN GRUPO (30-oct-2026): impostor (clásico y futbolero), mímica,
// pasapalabra y «¿quién es más probable?». Lo de la boda original sigue en contenido.ts.
// ═══════════════════════════════════════════════════════════════════
import { IMPOSTOR, MIMICA } from "./contenido";

// ── IMPOSTOR CLÁSICO: lo que ya había + temas nuevos ──
export const IMPOSTOR_CLASICO: Record<string, string[]> = {
  ...IMPOSTOR,
  "Películas y series": ["Titanic", "Harry Potter", "El Rey León", "Toy Story", "Shrek", "Frozen", "Star Wars", "Los Simpson",
    "La casa de papel", "Stranger Things", "El juego del calamar", "Avengers", "Spider-Man", "Jurassic Park", "Mi pobre angelito",
    "Rápido y furioso", "Piratas del Caribe", "Breaking Bad", "Friends", "El Chavo del 8", "31 minutos", "Coco", "Barbie", "Batman"],
  "Personajes": ["Pikachu", "Mario Bros", "Bob Esponja", "Homero Simpson", "Mickey Mouse", "Superman", "Batman", "La Mujer Maravilla",
    "Shrek", "Dora la exploradora", "Sherlock Holmes", "Drácula", "El Viejo Pascuero", "El Chapulín Colorado", "Cenicienta",
    "Goku", "Darth Vader", "Tarzán", "Pinocho", "Condorito", "Tulio Triviño", "Pac-Man", "Elsa", "Yoda"],
  "Países": ["Chile", "Argentina", "Brasil", "Perú", "México", "Estados Unidos", "Canadá", "España", "Francia", "Italia", "Alemania",
    "Japón", "China", "India", "Egipto", "Australia", "Rusia", "Grecia", "Marruecos", "Cuba", "Colombia", "Inglaterra", "Tailandia", "Islandia"],
  "Marcas": ["Coca-Cola", "McDonald's", "Apple", "Nike", "Adidas", "Samsung", "Netflix", "Google", "Lego", "IKEA", "Starbucks",
    "Toyota", "Ferrari", "Disney", "Zara", "Spotify", "Uber", "Mercado Libre", "WhatsApp", "Instagram", "Nintendo", "PlayStation"],
  "Música": ["Bad Bunny", "Shakira", "Karol G", "Michael Jackson", "Queen", "Los Prisioneros", "Mon Laferte", "Myriam Hernández",
    "Daddy Yankee", "Luis Miguel", "Taylor Swift", "The Beatles", "Chayanne", "Los Jaivas", "Violeta Parra", "Marc Anthony",
    "Soda Stereo", "Juan Gabriel", "Madonna", "Peso Pluma", "Ricky Martin", "Américo", "La Sonora de Tommy Rey"],
  "En la playa": ["Quitasol", "Bloqueador", "Toalla", "Castillo de arena", "Salvavidas", "Ola", "Gaviota", "Chalas", "Heladero",
    "Cooler", "Paleta", "Tabla de surf", "Cangrejo", "Medusa", "Traje de baño", "Mote con huesillo", "Lentes de sol", "Pelota de playa"],
  "Carrete": ["Piscola", "DJ", "Karaoke", "Resaca", "Hielo", "Previa", "Bailar", "Fonda", "Brindis", "Selfie", "Uber de vuelta",
    "Copete", "Cumbia", "Reggaetón", "Guardia", "Pista de baile", "Cotillón", "After", "Shot", "Choripán a las 5 AM"],
  "Objetos": ["Paraguas", "Mochila", "Llaves", "Billetera", "Audífonos", "Cargador", "Reloj", "Tijeras", "Linterna", "Candado",
    "Calculadora", "Termo", "Encendedor", "Peineta", "Cepillo de dientes", "Corchetera", "Control de la tele", "Espejo", "Vela"],
  "Trabajos": ["Astronauta", "Payaso", "Mago", "Detective", "Influencer", "Youtuber", "Cirujano", "Arquitecto", "Pastelero",
    "Taxista", "Salvavidas", "Árbitro", "Periodista", "Guardia", "Cartero", "Barista", "Bombero", "Piloto de Fórmula 1"],
};

// ── IMPOSTOR FUTBOLERO: equipos, jugadores, competencias, estadios, técnicos y la jerga de la pelota ──
export const IMPOSTOR_FUTBOL: Record<string, string[]> = {
  "Equipos del mundo": ["Real Madrid", "Barcelona", "Manchester United", "Manchester City", "Liverpool", "Chelsea", "Arsenal",
    "Bayern Múnich", "Borussia Dortmund", "Juventus", "Inter de Milán", "AC Milan", "PSG", "Atlético de Madrid", "Boca Juniors",
    "River Plate", "Flamengo", "Palmeiras", "Santos", "Ajax", "Benfica", "Porto", "Napoli", "Tottenham", "Inter Miami", "Al Nassr"],
  "Equipos chilenos": ["Colo-Colo", "Universidad de Chile", "Universidad Católica", "Cobreloa", "Palestino", "Unión Española",
    "Audax Italiano", "Everton", "Santiago Wanderers", "O'Higgins", "Huachipato", "Coquimbo Unido", "Deportes Iquique", "Cobresal",
    "Ñublense", "Deportes La Serena", "Rangers de Talca", "Deportes Temuco", "Magallanes", "Unión La Calera"],
  "Cracks del mundo": ["Messi", "Cristiano Ronaldo", "Neymar", "Mbappé", "Haaland", "Vinícius Júnior", "Lamine Yamal", "Bellingham",
    "Modric", "Salah", "Lewandowski", "Harry Kane", "De Bruyne", "Pelé", "Maradona", "Zidane", "Ronaldinho", "Ronaldo Nazário",
    "Beckenbauer", "Cruyff", "Iniesta", "Xavi", "Buffon", "Casillas", "Thierry Henry", "Kaká", "Ibrahimović", "Luis Suárez", "Benzema"],
  "Jugadores chilenos": ["Alexis Sánchez", "Arturo Vidal", "Claudio Bravo", "Gary Medel", "Charles Aránguiz", "Eduardo Vargas",
    "Mauricio Isla", "Jean Beausejour", "Marcelo Díaz", "Iván Zamorano", "Marcelo Salas", "Elías Figueroa", "Carlos Caszely",
    "Matías Fernández", "Humberto Suazo", "Jorge Valdivia", "Esteban Paredes", "Ben Brereton", "Erick Pulgar", "Darío Osorio"],
  "Competencias": ["Mundial", "Copa América", "Champions League", "Copa Libertadores", "Copa Sudamericana", "Premier League",
    "LaLiga", "Serie A", "Bundesliga", "Eurocopa", "Mundial de Clubes", "Copa del Rey", "Copa Chile", "Campeonato Nacional",
    "Juegos Olímpicos", "Supercopa", "Recopa Sudamericana", "Clasificatorias", "Ligue 1", "Copa Confederaciones"],
  "Estadios": ["Maracaná", "Santiago Bernabéu", "Camp Nou", "Old Trafford", "Anfield", "Wembley", "La Bombonera",
    "Monumental de River", "Estadio Nacional", "Monumental David Arellano", "San Siro", "Allianz Arena", "Estadio Azteca",
    "Parque de los Príncipes", "Metropolitano", "San Carlos de Apoquindo", "Estadio Centenario", "Signal Iduna Park"],
  "Técnicos": ["Guardiola", "Mourinho", "Ancelotti", "Klopp", "Simeone", "Bielsa", "Pellegrini", "Sampaoli", "Alex Ferguson",
    "Luis Enrique", "Scaloni", "Arteta", "Xabi Alonso", "Arsène Wenger", "Vicente del Bosque", "Ricardo Gareca", "Tite", "Hansi Flick"],
  "Jugadas y posiciones": ["Arquero", "Lateral", "Central", "Volante de contención", "Enganche", "Extremo", "Centrodelantero",
    "Falso nueve", "Chilena", "Rabona", "Caño", "Sombrerito", "Bicicleta", "Taquito", "Tiro libre", "Penal", "Córner", "Offside",
    "Tarjeta roja", "VAR", "Gol olímpico", "Autogol", "Hat-trick", "Pared", "Contragolpe", "Barrera", "Saque de banda", "Tiki-taka"],
  "Cosas del fútbol": ["Balón de Oro", "Brazalete de capitán", "Canilleras", "Chuteadores", "Silbato", "Banderín", "Camarín",
    "Banca", "Hinchada", "Bombo", "Bengala", "Camiseta", "Red del arco", "Travesaño", "Palo", "Pizarra táctica", "Álbum Panini",
    "Ola", "Tribuna", "Medio tiempo", "Alargue", "Definición a penales", "Fichaje", "Mercado de pases"],
};

/** Todos los temas juntos (para el «mezclar todo»). */
export const temasDe = (modo: string) => modo === "futbol" ? IMPOSTOR_FUTBOL : IMPOSTOR_CLASICO;

// ── MÍMICA: por tema ──
export const MIMICA_TEMAS: Record<string, string[]> = {
  "De la boda": MIMICA,
  "Fútbol": ["Celebrar como Cristiano", "Hacer una chilena", "Atajar un penal", "Sacar tarjeta roja", "Hacer la ola en el estadio",
    "Tirarse en el área", "Pedir VAR", "Hacer un caño", "Cabecear", "Patear un córner", "Levantar la copa", "Hincha llorando",
    "Barra cantando", "Árbitro corriendo", "Cambio de jugador", "Arquero volando", "Saque de banda", "Pelear con el árbitro",
    "Pegarle al palo", "Celebrar haciendo el avioncito", "Ponerse las canilleras", "Lesionarse y pedir camilla", "Hacer jueguitos",
    "Penal a lo Panenka", "Darse vuelta la camiseta al celebrar", "Entrenador gritando desde la banca"],
  "Películas": ["Titanic", "El Rey León", "Spider-Man", "Harry Potter", "Rocky", "Jurassic Park", "Toy Story", "Frozen",
    "Star Wars", "Matrix", "Shrek", "Tiburón", "El Padrino", "Piratas del Caribe", "Mi pobre angelito", "Avatar", "Karate Kid",
    "Superman", "La casa de papel", "El Chavo del 8", "Mamma Mia", "Buscando a Nemo", "King Kong", "El exorcista"],
  "Cosas de Chile": ["Bailar cueca", "Tomar mote con huesillo", "Jugar rayuela", "Encumbrar un volantín", "Hacer un asado",
    "Ir a la fonda", "Tomar once", "Esperar la micro", "Hacer la fila en el banco", "Temblor de 6 grados", "Comer un completo",
    "Pedir una piscola", "Ir a la playa en enero", "Pelear en el Transantiago", "Taco en la Costanera", "Hacer un brindis el 18",
    "Comprar en la feria", "Pedir la cuenta en una picada", "Bañarse en el mar helado", "Andar en el metro en hora punta", "Comer mote con huesillo",
    "Subir el cerro San Cristóbal", "Hacer cola para la Teletón", "Ver el Festival de Viña", "Elevar un volantín y que te lo corten", "Celebrar un gol de la Roja"],
  "Acciones": ["Cambiar una rueda", "Hacer la cama", "Pintar una pared", "Atrapar una mosca", "Bañar a un perro", "Lavarse los dientes", "Pelar una cebolla y llorar",
    "Pescar un pez grande", "Escalar una montaña", "Patinar en hielo", "Andar en monociclo", "Sacar la basura", "Buscar las llaves", "Hacer malabares",
    "Inflar un globo que revienta", "Tocar la batería", "Dirigir una orquesta", "Remar en un bote", "Esconderse de la suegra", "Despertar con la alarma"],
};

// ── PASAPALABRA: roscos de 25 letras. `c` = «contiene» (si no, «empieza por»). ──
export type Letra = { l: string; d: string; r: string; c?: boolean };
const L = (l: string, r: string, d: string, c = false): Letra => ({ l, r, d, c });
export const ROSCOS: Record<"general" | "futbol", Letra[][]> = {
  general: [
    [L("A", "Anillo", "Joya circular que se ponen los novios en el dedo"), L("B", "Brindis", "Levantar las copas y decir unas palabras para celebrar"),
     L("C", "Cueca", "Baile nacional de Chile, con pañuelo"), L("D", "Domingo", "Último día de la semana"),
     L("E", "Empanada", "Masa rellena de pino que no falta para el 18"), L("F", "Fotógrafo", "Persona contratada para retratar la boda"),
     L("G", "Guitarra", "Instrumento de seis cuerdas"), L("H", "Hielo", "Agua en estado sólido"),
     L("I", "Iglesia", "Templo donde se celebran misas"), L("J", "Jirafa", "El animal con el cuello más largo"),
     L("L", "Luna", "Satélite natural de la Tierra"), L("M", "Marraqueta", "Pan chileno que se parte en cuatro"),
     L("N", "Novia", "Mujer que se casa"), L("Ñ", "Otoño", "Estación del año en que caen las hojas", true),
     L("O", "Oso", "Mamífero grande que hiberna en invierno"), L("P", "Pingüino", "Ave que no vuela y nada en aguas frías"),
     L("Q", "Queso", "Alimento que se hace cuajando la leche"), L("R", "Ramo", "Flores que la novia lanza a las solteras"),
     L("S", "Sol", "La estrella que ilumina la Tierra"), L("T", "Torta", "Pastel que cortan los novios"),
     L("U", "Uva", "Fruta con la que se hace el vino"), L("V", "Vals", "Baile con que los novios abren la fiesta"),
     L("X", "Taxi", "Auto con chofer que se paga por viaje", true), L("Y", "Yate", "Embarcación de lujo para pasear"),
     L("Z", "Zapato", "Calzado que se pone en el pie")],
    [L("A", "Abeja", "Insecto que hace miel"), L("B", "Ballena", "El mamífero más grande del planeta"),
     L("C", "Cordillera", "Cadena de montañas; la de los Andes recorre Chile"), L("D", "Delfín", "Mamífero marino muy inteligente que salta del agua"),
     L("E", "Estrella", "Punto de luz que brilla en el cielo de noche"), L("F", "Fuego", "Lo que se prende para hacer un asado"),
     L("G", "Gato", "Felino doméstico que maúlla"), L("H", "Helado", "Postre frío que se come en cono o en vasito"),
     L("I", "Isla", "Porción de tierra rodeada de agua"), L("J", "Jamón", "Fiambre que se saca de la pierna del cerdo"),
     L("L", "Limón", "Fruta ácida, clave en el pisco sour"), L("M", "Manjar", "Dulce de leche, a la chilena"),
     L("N", "Nariz", "Parte de la cara con la que se huele"), L("Ñ", "Ñandú", "Ave sudamericana que corre y no vuela, parecida al avestruz"),
     L("O", "Oveja", "Animal del que se saca la lana"), L("P", "Pisco", "Aguardiente de uva con el que se hace la piscola"),
     L("Q", "Quince", "Número que va después del catorce"), L("R", "Reloj", "Aparato que marca la hora"),
     L("S", "Sandía", "Fruta grande, verde por fuera y roja por dentro"), L("T", "Terremoto", "Sismo muy fuerte… y también un trago con helado de piña"),
     L("U", "Uña", "Lo que se corta y se pinta en la punta de los dedos"), L("V", "Volcán", "Montaña que puede hacer erupción, como el Villarrica"),
     L("X", "Saxofón", "Instrumento de viento, de metal, muy del jazz", true), L("Y", "Yogur", "Lácteo fermentado que se come con cuchara"),
     L("Z", "Zanahoria", "Verdura naranja que comen los conejos")],
    [L("A", "Avión", "Vehículo que vuela con pasajeros"), L("B", "Bicicleta", "Vehículo de dos ruedas que se mueve con pedales"),
     L("C", "Cóndor", "Ave que aparece en el escudo de Chile junto al huemul"), L("D", "Dado", "Cubo con puntos del uno al seis"),
     L("E", "Elefante", "Animal con trompa y colmillos de marfil"), L("F", "Frutilla", "Fruta roja con las semillas por fuera"),
     L("G", "Globo", "Bolsa de goma que se infla para los cumpleaños"), L("H", "Huemul", "Ciervo que aparece en el escudo de Chile"),
     L("I", "Invierno", "La estación más fría del año"), L("J", "Jardín", "Terreno con plantas y flores en una casa"),
     L("L", "Lápiz", "Sirve para escribir y tiene mina de grafito"), L("M", "Mote con huesillo", "Bebida chilena con trigo y duraznos deshidratados"),
     L("N", "Navidad", "Fiesta del 25 de diciembre"), L("Ñ", "Niño", "Persona de poca edad", true),
     L("O", "Ojo", "Órgano de la vista"), L("P", "Paraguas", "Se abre para no mojarse con la lluvia"),
     L("Q", "Quirquincho", "Armadillo andino con cuyo caparazón se hacía el charango"), L("R", "Rayuela", "Juego chileno de lanzar tejos a una línea"),
     L("S", "Sopaipilla", "Masa frita de zapallo que se come con pebre"), L("T", "Tren", "Vehículo que va sobre rieles"),
     L("U", "Universo", "Todo lo que existe: estrellas, planetas y galaxias"), L("V", "Violín", "Instrumento de cuerda que se toca con arco"),
     L("X", "Examen", "Prueba que se rinde en el colegio o la universidad", true), L("Y", "Yema", "Parte amarilla del huevo"),
     L("Z", "Zorro", "Animal astuto de cola larga y peluda")],
  ],
  futbol: [
    [L("A", "Arquero", "Único jugador que puede tomar la pelota con las manos"), L("B", "Bernabéu", "Apellido que lleva el estadio del Real Madrid"),
     L("C", "Colo-Colo", "Único club chileno campeón de la Copa Libertadores, en 1991"), L("D", "Delantero", "Jugador que juega más cerca del arco rival"),
     L("E", "Eurocopa", "Torneo de selecciones de Europa"), L("F", "Falta", "Infracción que cobra el árbitro"),
     L("G", "Gol", "Cuando la pelota entra completa al arco"), L("H", "Haaland", "Delantero noruego del Manchester City"),
     L("I", "Iniesta", "Español que hizo el gol de la final del Mundial 2010"), L("J", "Juventus", "Club de Turín conocido como la Vecchia Signora"),
     L("L", "Libertadores", "La copa más importante de clubes de Sudamérica"), L("M", "Maradona", "Argentino autor de «la mano de Dios»"),
     L("N", "Neymar", "Brasileño que jugó en el Barcelona y el PSG"), L("Ñ", "España", "Selección campeona del mundo en 2010", true),
     L("O", "Offside", "Fuera de juego, dicho en inglés"), L("P", "Penal", "Tiro desde los once metros"),
     L("Q", "Qatar", "País donde se jugó el Mundial 2022"), L("R", "Roja", "Así le dicen a la selección chilena"),
     L("S", "Salas", "Apellido de Marcelo, «el Matador», ídolo de la U y de River"), L("T", "Tarjeta", "Amarilla o roja, la saca el árbitro"),
     L("U", "Uruguay", "Selección campeona del primer Mundial, en 1930"), L("V", "VAR", "Sistema de video que ayuda al árbitro"),
     L("X", "México", "País del Estadio Azteca", true), L("Y", "Yamal", "Apellido de Lamine, el joven extremo del Barcelona"),
     L("Z", "Zamorano", "Iván, «Bam Bam», goleador del Real Madrid y del Inter")],
    [L("A", "Alexis", "Nombre de Sánchez, el goleador histórico de la selección chilena"), L("B", "Bravo", "Claudio, arquero y capitán de Chile campeón de América"),
     L("C", "Champions", "La Liga de Campeones de Europa, como se la conoce en inglés"), L("D", "Defensa", "Línea de jugadores que protege el arco propio"),
     L("E", "Empate", "Cuando el partido termina igualado"), L("F", "Figueroa", "Elías, considerado el mejor defensa chileno de la historia"),
     L("G", "Guardiola", "Técnico catalán del Manchester City"), L("H", "Hat-trick", "Tres goles de un mismo jugador en un partido"),
     L("I", "Inter", "Club de Milán donde Zamorano usó la camiseta «1+8»"), L("J", "Juez de línea", "Asistente del árbitro que levanta la bandera"),
     L("L", "Liverpool", "Club inglés cuya hinchada canta «You'll Never Walk Alone»"), L("M", "Messi", "Argentino ganador de ocho Balones de Oro"),
     L("N", "Nacional", "Estadio de Ñuñoa, el más grande de Chile"), L("Ñ", "Ñublense", "Club de Chillán"),
     L("O", "Olímpico", "Gol que se hace directo desde el córner"), L("P", "Pelé", "Brasileño, el único que ganó tres Mundiales como jugador"),
     L("Q", "Coquimbo Unido", "Club chileno conocido como «los piratas»", true), L("R", "Ronaldo", "Cristiano, el portugués máximo goleador de la Champions"),
     L("S", "Sudamericana", "Copa que ganó la U en 2011 con Sampaoli"), L("T", "Tiro libre", "Remate que se patea después de una falta, con barrera"),
     L("U", "Universidad Católica", "Club cruzado que juega en San Carlos de Apoquindo"), L("V", "Vidal", "Arturo, «el Rey», volante del Bayern y del Barcelona"),
     L("X", "Extremo", "Jugador que ataca pegado a la banda", true), L("Y", "Paraguay", "País de la selección «albirroja»", true),
     L("Z", "Zidane", "Francés que dio un cabezazo en la final del Mundial 2006")],
    [L("A", "Anfield", "Estadio del Liverpool"), L("B", "Barcelona", "Club donde Messi jugó la mayor parte de su carrera"),
     L("C", "Córner", "Tiro de esquina"), L("D", "Dortmund", "Borussia…, club alemán de la «Muralla Amarilla»"),
     L("E", "Estadio", "Recinto donde se juegan los partidos"), L("F", "Final", "El último partido de un torneo"),
     L("G", "Gary", "Nombre de Medel, «el Pitbull»"), L("H", "Hinchas", "Fanáticos de un equipo"),
     L("I", "Isla", "Mauricio, lateral derecho de la Roja bicampeona de América"), L("J", "Japón", "País que organizó el Mundial 2002 junto a Corea del Sur"),
     L("L", "Lewandowski", "Delantero polaco del Bayern y del Barcelona"), L("M", "Maracaná", "Estadio de Río de Janeiro"),
     L("N", "Nueve", "Número de camiseta del centrodelantero clásico"), L("Ñ", "Caño", "Pasar la pelota entre las piernas del rival", true),
     L("O", "Old Trafford", "Estadio del Manchester United"), L("P", "Palestino", "Club chileno con los colores de la bandera palestina"),
     L("Q", "Equipo", "Conjunto de once jugadores", true), L("R", "River", "Club argentino que juega el Superclásico contra Boca"),
     L("S", "Selección", "Equipo que representa a un país"), L("T", "Taquito", "Toque a la pelota con el talón"),
     L("U", "Uno", "Número de camiseta del arquero titular"), L("V", "Vargas", "Eduardo, «Turboman», goleador de la Copa América 2015"),
     L("X", "Expulsión", "Lo que pasa cuando un jugador ve la roja", true), L("Y", "Bayern", "Club alemán de Múnich", true),
     L("Z", "Zaga", "Otra forma de decirle a la defensa central")],
  ],
};

// ── ¿QUIÉN ES MÁS PROBABLE…? Cada uno vota en su teléfono ──
export const PROBABLE = [
  "…que llegue tarde a su propia boda", "…que llore en el vals", "…que se quede dormido en la fiesta",
  "…que termine bailando arriba de una silla", "…que se case en Las Vegas", "…que olvide un aniversario",
  "…que sea el último en irse de la fiesta", "…que le pida reggaetón al DJ", "…que agarre el ramo", "…que pierda el celular esta noche",
  "…que se haga famoso en TikTok", "…que cante en el karaoke sin que nadie le pida", "…que termine la fiesta sin zapatos",
  "…que se coma el postre del lado", "…que dé la vuelta al mundo", "…que tenga más hijos", "…que se pierda aunque tenga GPS",
  "…que mande audios de cinco minutos", "…que sobreviva a un apocalipsis zombie", "…que adopte diez gatos",
  "…que se ría en un momento serio", "…que haga un discurso sin que se lo pidan", "…que mienta sobre su edad",
  "…que gaste todo el sueldo en una semana", "…que se quede dormido en la micro", "…que coma más torta",
  "…que diga «hoy no tomo» y termine bailando cueca", "…que le saque fotos a todo", "…que llore con los discursos",
  "…que se case primero (de los solteros)", "…que olvide el nombre de alguien hoy", "…que salga en las noticias",
  "…que gane un reality", "…que se haga millonario", "…que haga trampa en este juego", "…que se tire vestido a una piscina",
  "…que se lleve un centro de mesa", "…que pida «Mueve la colita»", "…que se duerma primero esta noche",
  "…que ande descalzo en la pista", "…que se ponga la corbata en la cabeza", "…que le cuente el final de una serie a todos",
  "…que se haga amigo del garzón", "…que llegue a la fiesta de mañana sin dormir", "…que se equivoque de mesa",
  "…que baile mejor que los novios", "…que se quede pegado en el celular en la fiesta", "…que se ponga a cantar rancheras",
  "…que arme una conga", "…que pida el último Uber", "…que se coma la última empanada", "…que termine dando consejos de amor",
  "…que llore viendo una película de Disney", "…que se olvide de su propio cumpleaños", "…que gane la lotería y no le cuente a nadie",
  "…que se pierda en un mall", "…que adopte un perro callejero esta semana", "…que se vaya a vivir a otro país", "…que escriba un libro",
  "…que se ría de su propio chiste antes de terminarlo", "…que llegue disfrazado a una fiesta que no era de disfraces", "…que hable dormido",
  "…que se haga un tatuaje del que se arrepienta", "…que conteste el teléfono en el cine", "…que se quede encerrado fuera de su casa",
  "…que confunda a los novios con otra pareja", "…que cante «Gracias a la vida» a todo pulmón", "…que se case con alguien que conoció en una boda",
  "…que bote el celular al inodoro", "…que se duerma en una reunión de trabajo", "…que pida comida a las 4 de la mañana",
  "…que se le olvide dónde estacionó", "…que tenga una cuenta secreta en TikTok", "…que haga un asado aunque llueva",
  "…que se coma un completo de un solo bocado", "…que lleve tupper a la boda", "…que haga el ridículo en la hora loca",
  "…que se ponga a llorar con el ramo", "…que le dé un consejo matrimonial a los novios sin estar casado", "…que se sepa todas las canciones del DJ",
  "…que mande el primer mensaje después de una pelea", "…que nunca devuelva lo que le prestan", "…que sea el primero en bailar",
  "…que termine con la corbata de otro", "…que pierda la apuesta de esta noche", "…que se ofrezca a pagar la cuenta y no tenga plata",
  "…que tenga un plan B para todo", "…que se emocione con el discurso de los padrinos",
];

// ── PISTA PARA EL IMPOSTOR (31-oct-2026): una palabra que lo orienta sin regalarle la respuesta ──
// (si una palabra no tiene, se le muestra la temática)
const P_ = (texto: string): Record<string, string> => Object.fromEntries(texto.trim().split("\n").flatMap(l => l.split(";")).map(x => x.trim()).filter(Boolean).map(x => x.split(":").map(y => y.trim()) as [string, string]));
export const PISTAS_IMPOSTOR: Record<string, string> = P_(`
Torta: Pisos; Ramo: Lanzar; Anillos: Dedo; Vals: Baile; Velo: Cabeza; Brindis: Copas; Luna de miel: Viaje; Padrinos: Testigos; Altar: Iglesia; Fotógrafo: Recuerdos
Cotillón: Gorritos; Liga: Pierna; Smoking: Elegante; Despedida de soltero: Amigos; Invitación: Sobre; Mesa de dulces: Postres; Pista de baile: Luces; Libreta de familia: Documento
Registro Civil: Firma; Arroz: Grano; Champaña: Burbujas; Discurso: Palabras; Primer beso: Labios; Corbata: Cuello; Tacos: Pies
Completo: Palta; Empanada de pino: Horno; Sopaipilla: Zapallo; Pastel de choclo: Greda; Cazuela: Caldo; Humitas: Hoja; Charquicán: Guiso; Mote con huesillo: Verano; Churrasco: Pan
Chorrillana: Papas fritas; Anticucho: Palito; Porotos con riendas: Tallarines; Marraqueta: Panadería; Manjar: Dulce; Terremoto: Helado; Piscola: Vaso; Choripán: Parrilla; Curanto: Chiloé
Leche asada: Postre; Calzones rotos: Azúcar flor
San Pedro de Atacama: Desierto; Isla de Pascua: Polinesia; Valparaíso: Cerros; Torres del Paine: Patagonia; Viña del Mar: Festival; Pucón: Volcán; Chiloé: Palafitos; La Serena: Faro
Cajón del Maipo: Río; Costanera Center: Torre; Cerro San Cristóbal: Funicular; Lampa: Norte de Santiago; Iquique: Zofri; Puerto Varas: Lago; Valle del Elqui: Estrellas; Mercado Central: Mariscos
La Moneda: Presidente; Arica: Morro; Punta Arenas: Estrecho; Pichilemu: Olas
Hervidor: Agua; Control remoto: Pilas; Almohada: Cama; Microondas: Calentar; Escoba: Barrer; Plancha: Ropa; Refrigerador: Frío; Ducha: Baño; Lavaloza: Cocina; Tostador: Pan; Cortina: Ventana
Velador: Noche; Alfombra: Piso; Espejo: Reflejo; Lavadora: Centrifugar; Sillón: Living; Ampolleta: Luz; Basurero: Bolsa
Pingüino: Hielo; Cóndor: Escudo; Huemul: Ciervo; Llama: Altiplano; Perro: Ladrido; Gato: Bigotes; Jirafa: Cuello; Delfín: Mar; Elefante: Trompa; Tiburón: Aleta; Loro: Habla; Pudú: Chiquitito
Caballo: Galope; Tortuga: Caparazón; Mono: Plátano; Pulpo: Tentáculos; Murciélago: Cueva; Abeja: Miel
Doctor: Receta; Profesor: Pizarra; Bombero: Sirena; Carabinero: Verde; Chef: Gorro; Piloto: Cabina; Dentista: Muelas; Camionero: Carretera; Peluquero: Tijeras; Abogado: Juicio; Garzón: Bandeja
Mecánico: Taller; Veterinario: Mascotas; Electricista: Cables; Futbolista: Cancha; Cantante: Micrófono; Panadero: Harina; Jardinero: Pasto
Fútbol: Pelota; Tenis: Raqueta; Natación: Piscina; Rayuela: Tejo; Ajedrez: Tablero; Básquetbol: Canasta; Surf: Tabla; Boxeo: Guantes; Ciclismo: Pedales; Cueca: Pañuelo; Trompo: Cordel
Volantín: Hilo; Emboque: Palito y bola; Esquí: Nieve; Pichanga: Amigos; Póker: Cartas; Dominó: Fichas; Karaoke: Cantar
Titanic: Barco; Harry Potter: Magia; El Rey León: Sabana; Toy Story: Juguetes; Shrek: Ogro; Frozen: Nieve; Star Wars: Galaxia; Los Simpson: Amarillo; La casa de papel: Atraco
Stranger Things: Monstruo; El juego del calamar: Corea; Avengers: Superhéroes; Spider-Man: Telaraña; Jurassic Park: Dinosaurios; Mi pobre angelito: Navidad; Rápido y furioso: Autos
Piratas del Caribe: Tesoro; Breaking Bad: Químico; Friends: Café; El Chavo del 8: Barril; 31 minutos: Títeres; Coco: México; Barbie: Rosado; Batman: Murciélago
Pikachu: Pokémon; Mario Bros: Hongos; Bob Esponja: Fondo del mar; Homero Simpson: Donas; Mickey Mouse: Orejas; Superman: Capa; La Mujer Maravilla: Lazo; Dora la exploradora: Mochila
Sherlock Holmes: Lupa; Drácula: Colmillos; El Viejo Pascuero: Regalos; El Chapulín Colorado: Antenas; Cenicienta: Zapato; Goku: Esferas; Darth Vader: Casco; Tarzán: Selva; Pinocho: Nariz
Condorito: Pelotillehue; Tulio Triviño: Noticias; Pac-Man: Fantasmas; Elsa: Reina; Yoda: Verde
Chile: Cordillera; Argentina: Asado; Brasil: Samba; Perú: Ceviche; México: Tacos; Estados Unidos: Hamburguesa; Canadá: Arce; España: Paella; Francia: Torre; Italia: Pizza; Alemania: Cerveza
Japón: Sushi; China: Muralla; India: Curry; Egipto: Pirámides; Australia: Canguro; Rusia: Frío; Grecia: Olimpo; Marruecos: Desierto; Cuba: Habano; Colombia: Café; Inglaterra: Té; Tailandia: Elefantes; Islandia: Volcanes
Coca-Cola: Bebida; McDonald's: Papas fritas; Apple: Manzana; Nike: Zapatillas; Adidas: Tres rayas; Samsung: Celular; Netflix: Series; Google: Buscar; Lego: Bloques; IKEA: Muebles; Starbucks: Café
Toyota: Autos; Ferrari: Rojo; Disney: Castillo; Zara: Ropa; Spotify: Música; Uber: Viaje; Mercado Libre: Envío; WhatsApp: Mensajes; Instagram: Fotos; Nintendo: Consola; PlayStation: Control
Bad Bunny: Puerto Rico; Shakira: Caderas; Karol G: Colombia; Michael Jackson: Moonwalk; Queen: Rock; Los Prisioneros: San Miguel; Mon Laferte: Viña; Myriam Hernández: Baladas; Daddy Yankee: Gasolina
Luis Miguel: Boleros; Taylor Swift: Estadios; The Beatles: Liverpool; Chayanne: Baile; Los Jaivas: Andes; Violeta Parra: Folclor; Marc Anthony: Salsa; Soda Stereo: Argentina; Juan Gabriel: Mexicano
Madonna: Pop; Peso Pluma: Corridos; Ricky Martin: Menudo; Américo: Cumbia; La Sonora de Tommy Rey: Año Nuevo
Quitasol: Sombra; Bloqueador: Piel; Toalla: Secar; Castillo de arena: Balde; Salvavidas: Rescate; Ola: Espuma; Gaviota: Ave; Chalas: Pies; Heladero: Carrito; Cooler: Hielo; Paleta: Madera
Tabla de surf: Olas; Cangrejo: Pinzas; Medusa: Picadura; Traje de baño: Agua; Lentes de sol: Ojos; Pelota de playa: Inflable
DJ: Música; Resaca: Mañana; Hielo: Frío; Previa: Antes; Bailar: Pista; Fonda: Septiembre; Selfie: Celular; Uber de vuelta: Madrugada; Copete: Trago; Cumbia: Baile; Reggaetón: Perreo
Guardia: Puerta; After: Tarde; Shot: Pequeño; Choripán a las 5 AM: Hambre
Paraguas: Lluvia; Mochila: Espalda; Llaves: Puerta; Billetera: Plata; Audífonos: Oídos; Cargador: Batería; Reloj: Hora; Tijeras: Cortar; Linterna: Oscuridad; Candado: Cerrar; Calculadora: Números
Termo: Agua caliente; Encendedor: Fuego; Peineta: Pelo; Cepillo de dientes: Pasta; Corchetera: Papeles; Control de la tele: Sillón; Vela: Cumpleaños
Astronauta: Espacio; Payaso: Circo; Mago: Conejo; Detective: Pistas; Influencer: Seguidores; Youtuber: Videos; Cirujano: Quirófano; Arquitecto: Planos; Pastelero: Tortas; Taxista: Taxímetro
Árbitro: Silbato; Periodista: Noticias; Cartero: Cartas; Barista: Café; Piloto de Fórmula 1: Velocidad
Real Madrid: Blanco; Barcelona: Cataluña; Manchester United: Diablos; Manchester City: Celeste; Liverpool: Anfield; Chelsea: Londres; Arsenal: Cañón; Bayern Múnich: Alemania; Borussia Dortmund: Amarillo
Juventus: Turín; Inter de Milán: Nerazzurri; AC Milan: Rossoneri; PSG: París; Atlético de Madrid: Colchoneros; Boca Juniors: Bombonera; River Plate: Millonarios; Flamengo: Río de Janeiro; Palmeiras: Verde
Santos: Pelé; Ajax: Ámsterdam; Benfica: Lisboa; Porto: Dragones; Napoli: Maradona; Tottenham: Gallo; Inter Miami: Rosado; Al Nassr: Arabia
Colo-Colo: Cacique; Universidad de Chile: Azul; Universidad Católica: Cruzados; Cobreloa: Calama; Palestino: Tricolor; Unión Española: Santa Laura; Audax Italiano: Itálicos; Everton: Viña
Santiago Wanderers: Puerto; O'Higgins: Rancagua; Huachipato: Acero; Coquimbo Unido: Piratas; Deportes Iquique: Dragones; Cobresal: Minería; Ñublense: Chillán; Deportes La Serena: Papayeros
Rangers de Talca: Rojinegro; Deportes Temuco: Araucanía; Magallanes: Academia; Unión La Calera: Cementeros
Messi: Rosario; Cristiano Ronaldo: Portugal; Neymar: Brasil; Mbappé: Francia; Haaland: Noruega; Vinícius Júnior: Baile; Lamine Yamal: Joven; Bellingham: Inglaterra; Modric: Croacia; Salah: Egipto
Lewandowski: Polonia; Harry Kane: Tottenham; De Bruyne: Bélgica; Pelé: Rey; Maradona: Mano; Zidane: Cabezazo; Ronaldinho: Sonrisa; Ronaldo Nazário: Fenómeno; Beckenbauer: Káiser; Cruyff: Holanda
Iniesta: Mundial 2010; Xavi: Pases; Buffon: Italia; Casillas: Portero; Thierry Henry: Arsenal; Kaká: Milan; Ibrahimović: Suecia; Luis Suárez: Uruguay; Benzema: Lyon
Alexis Sánchez: Tocopilla; Arturo Vidal: Mohicano; Claudio Bravo: Guantes; Gary Medel: Pitbull; Charles Aránguiz: Príncipe; Eduardo Vargas: Turboman; Mauricio Isla: Lateral; Jean Beausejour: Zurdo
Marcelo Díaz: Carepato; Iván Zamorano: Bam Bam; Marcelo Salas: Matador; Elías Figueroa: Defensa; Carlos Caszely: Metro cuadrado; Matías Fernández: Tiro libre; Humberto Suazo: Chupete
Jorge Valdivia: Mago; Esteban Paredes: Goleador; Ben Brereton: Inglaterra; Erick Pulgar: Volante; Darío Osorio: Joven
Mundial: Cada cuatro años; Copa América: Sudamérica; Champions League: Himno; Copa Libertadores: Gloria eterna; Copa Sudamericana: Segunda copa; Premier League: Inglaterra; LaLiga: España
Serie A: Italia; Bundesliga: Alemania; Eurocopa: Europa; Mundial de Clubes: Campeones continentales; Copa del Rey: España; Copa Chile: Eliminación directa; Campeonato Nacional: Torneo; Juegos Olímpicos: Medalla; Supercopa: Campeones
Recopa Sudamericana: Dos partidos; Clasificatorias: Eliminatorias; Ligue 1: Francia; Copa Confederaciones: Ensayo
Maracaná: Río de Janeiro; Santiago Bernabéu: Madrid; Camp Nou: Barcelona; Old Trafford: Teatro de los sueños; Anfield: Liverpool; Wembley: Londres; La Bombonera: Boca; Monumental de River: Núñez
Estadio Nacional: Ñuñoa; Monumental David Arellano: Macul; San Siro: Milán; Allianz Arena: Múnich; Estadio Azteca: México; Parque de los Príncipes: París; Metropolitano: Atlético
San Carlos de Apoquindo: Las Condes; Estadio Centenario: Montevideo; Signal Iduna Park: Muralla amarilla
Guardiola: Calvo; Mourinho: Special One; Ancelotti: Ceja; Klopp: Liverpool; Simeone: Cholo; Bielsa: Loco; Pellegrini: Ingeniero; Sampaoli: Copa América 2015; Alex Ferguson: Manchester
Luis Enrique: Asturias; Scaloni: Argentina; Arteta: Arsenal; Xabi Alonso: Leverkusen; Arsène Wenger: Francés; Vicente del Bosque: Bigote; Ricardo Gareca: Perú; Tite: Brasil; Hansi Flick: Alemania
Arquero: Manos; Lateral: Banda; Central: Defensa; Volante de contención: Recuperar; Enganche: Diez; Extremo: Punta; Centrodelantero: Nueve; Falso nueve: Engaño; Chilena: Acrobacia
Rabona: Piernas cruzadas; Caño: Entre las piernas; Sombrerito: Por arriba; Bicicleta: Pedalear; Taquito: Talón; Tiro libre: Barrera; Penal: Once metros; Córner: Esquina; Offside: Línea
Tarjeta roja: Expulsión; VAR: Pantalla; Gol olímpico: Directo; Autogol: Propio; Hat-trick: Tres; Pared: Rebote; Contragolpe: Rápido; Barrera: Muro; Saque de banda: Con las manos; Tiki-taka: Toque
Balón de Oro: Premio; Brazalete de capitán: Brazo; Canilleras: Piernas; Chuteadores: Estoperoles; Silbato: Árbitro; Banderín: Esquina; Camarín: Vestirse; Banca: Suplentes; Hinchada: Cánticos
Bombo: Tambor; Bengala: Humo; Camiseta: Número; Red del arco: Malla; Travesaño: Arriba; Palo: Poste; Pizarra táctica: Técnico; Álbum Panini: Láminas; Tribuna: Asientos
Medio tiempo: Descanso; Alargue: Extra; Definición a penales: Suspenso; Fichaje: Contrato; Mercado de pases: Verano
`);
/** La ayuda que ve el impostor: una pista (o la temática, si la palabra no tiene pista). */
export const pistaImpostor = (palabra: string, tema: string) => PISTAS_IMPOSTOR[palabra] || tema;
