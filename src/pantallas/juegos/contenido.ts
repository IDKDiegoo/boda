// ═══════════════════════════════════════════════════════════════════
// CONTENIDO DE LOS JUEGOS (24-oct-2026)
// Lo de la fiesta y lo de pareja que no es +18. Los retos y verdades picantes NO viven acá:
// están en la base (boda/juegos_pareja), que solo leen los novios.
// ═══════════════════════════════════════════════════════════════════

// ── IMPOSTOR: todos ven la palabra menos el impostor; cada uno da una pista y se vota ──
export const IMPOSTOR: Record<string, string[]> = {
  "De la boda": ["Torta", "Ramo", "Anillos", "Vals", "Velo", "Brindis", "Luna de miel", "Padrinos", "Altar", "Fotógrafo",
    "Cotillón", "Liga", "Smoking", "Despedida de soltero", "Invitación", "Mesa de dulces", "Pista de baile", "Libreta de familia",
    "Registro Civil", "Arroz", "Champaña", "Discurso", "Primer beso", "Corbata", "Tacos"],
  "Comida chilena": ["Completo", "Empanada de pino", "Sopaipilla", "Pastel de choclo", "Cazuela", "Humitas", "Charquicán",
    "Mote con huesillo", "Churrasco", "Chorrillana", "Anticucho", "Porotos con riendas", "Marraqueta", "Manjar", "Terremoto",
    "Piscola", "Choripán", "Curanto", "Leche asada", "Calzones rotos"],
  "Lugares de Chile": ["San Pedro de Atacama", "Isla de Pascua", "Valparaíso", "Torres del Paine", "Viña del Mar", "Pucón",
    "Chiloé", "La Serena", "Cajón del Maipo", "Costanera Center", "Cerro San Cristóbal", "Lampa", "Iquique", "Puerto Varas",
    "Valle del Elqui", "Mercado Central", "La Moneda", "Arica", "Punta Arenas", "Pichilemu"],
  "Cosas de la casa": ["Hervidor", "Control remoto", "Almohada", "Microondas", "Escoba", "Plancha", "Refrigerador", "Ducha",
    "Lavaloza", "Tostador", "Cortina", "Velador", "Alfombra", "Espejo", "Lavadora", "Sillón", "Ampolleta", "Basurero"],
  "Animales": ["Pingüino", "Cóndor", "Huemul", "Llama", "Perro", "Gato", "Jirafa", "Delfín", "Elefante", "Tiburón", "Loro",
    "Pudú", "Caballo", "Tortuga", "Mono", "Pulpo", "Murciélago", "Abeja"],
  "Profesiones": ["Doctor", "Profesor", "Bombero", "Carabinero", "Chef", "Piloto", "Dentista", "Camionero", "Peluquero",
    "Abogado", "Garzón", "Mecánico", "Veterinario", "Electricista", "Futbolista", "Cantante", "Panadero", "Jardinero"],
  "Deportes y juegos": ["Fútbol", "Tenis", "Natación", "Rayuela", "Ajedrez", "Básquetbol", "Surf", "Boxeo", "Ciclismo",
    "Cueca", "Trompo", "Volantín", "Emboque", "Esquí", "Pichanga", "Póker", "Dominó", "Karaoke"],
};

// ── MISIONES POR MESA: cada mesa saca una y la tiene que cumplir antes del final de la cena ──
export const MISIONES_MESA = [
  "Sáquense una selfie con los novios donde todos salgan haciendo una cara fea.",
  "Consigan que el DJ ponga una canción que elija la mesa y bailen todos juntos.",
  "Inventen un grito de guerra para los novios y gritenlo cuando entren a la pista.",
  "Escriban en una servilleta el mejor consejo de matrimonio y entréguenselo a los novios.",
  "Hagan una fila de conga de la mesa por todo el salón.",
  "Brinden con otra mesa que no conozcan y aprendan el nombre de todos.",
  "Consigan que un garzón se saque una foto con la mesa.",
  "Sáquense una foto imitando la pose de los novios en su foto de compromiso.",
  "Uno de la mesa tiene que bailar un pie de cueca con alguien de otra mesa.",
  "Graben un video de 15 segundos deseándoles algo a los novios.",
  "Hagan una ola cuando los novios pasen por su mesa.",
  "Averigüen cómo se conocieron los novios, preguntándole a alguien que no sea de la familia.",
  "Junten 5 cosas rosadas de la mesa (o de lo que tengan encima) y sáquenles una foto.",
  "Consigan que la mamá de alguno de los novios se saque una foto con la mesa.",
  "Canten el coro de una canción romántica a los novios cuando pasen.",
  "Hagan una coreografía de 10 segundos y muéstrensela a los novios.",
  "Encuentren a la persona que vino de más lejos y sáquense una foto con ella.",
  "Hagan un brindis de 30 segundos por los novios, de pie, toda la mesa.",
  "Consigan la firma de 5 invitados de otras mesas en una servilleta.",
  "Imiten el primer baile de los novios cuando termine.",
  "Sáquense una foto en la que no se les vea la cara a ninguno.",
  "Busquen a alguien que se llame igual que alguien de su mesa.",
  "Dibujen a los novios en una servilleta y entréguenles el dibujo.",
  "Logren que los novios se den un beso frente a su mesa.",
  "Hagan una predicción para los novios en 10 años y léansela en voz alta.",
  "Que el más tímido de la mesa saque a bailar a alguien.",
  "Consigan un trago para los novios y llévenselo.",
  "Inventen un apodo para la pareja y que toda la mesa lo use el resto de la noche.",
  "Sáquense una foto de grupo saltando.",
  "Encuentren a alguien que se haya casado hace más de 30 años y pídanle un consejo.",
];

// ── CAZA DE FOTOS: misiones para sacar fotos y subirlas con el QR de la Galería ──
export const CAZA_FOTOS = [
  "Los novios riéndose a carcajadas", "Alguien llorando de emoción", "La torta antes de que la corten",
  "Un abuelo o abuela bailando", "Un brindis con todas las copas arriba", "Los zapatos más llamativos de la fiesta",
  "Alguien durmiendo o a punto de dormirse", "Un niño bailando", "El mejor paso de baile de la noche",
  "Los anillos de los novios", "Una selfie con alguien que acabas de conocer", "La mesa más desordenada",
  "Un beso de los novios", "El papá de alguno de los novios bailando", "Alguien con la corbata en la cabeza",
  "La mejor cara del cotillón", "El atardecer o la noche desde el lugar", "Tres generaciones juntas en una foto",
  "Los padrinos", "La mesa de dulces arrasada", "Alguien bailando solo", "Una foto borrosa a propósito",
  "La pareja con más años juntos", "El detalle de decoración que más te gustó",
];

// ── BINGO DE LA BODA: cada invitado marca lo que va pasando ──
export const BINGO = [
  "La novia llora en los votos", "El novio llora en los votos", "Alguien bota una copa", "Suena «Despacito»",
  "Alguien baila cueca", "El tío que cuenta el mismo chiste", "Alguien se saca los tacos", "Un niño corre por la pista",
  "Se corta la luz o la música", "Alguien pide la canción que ya sonó", "Hay un discurso de más de 5 minutos",
  "La mamá de la novia llora", "Alguien se equivoca de nombre", "Alguien baila arriba de una silla",
  "Se hace un trencito", "Suena una de reggaetón antiguo", "Alguien se pone la corbata en la cabeza",
  "Le tiran el ramo a alguien que no quería", "Alguien canta más fuerte que la música", "Un garzón baila",
  "Alguien se mancha la ropa", "Alguien se queda dormido", "Los novios se dan un beso largo",
  "Alguien saca fotos con flash al fotógrafo", "Suena «Tusa»", "Alguien llega tarde", "Alguien llora en el discurso",
  "Se pide «¡que se besen!»", "Alguien pierde un zapato", "Alguien hace el paso del robot",
  "Un brindis que nadie escucha", "Alguien se cae (sin lesiones)", "Suena una cumbia", "Alguien pide el WiFi",
  "Se arma una pichanga de baile entre familias", "La abuela baila mejor que todos", "Alguien graba todo en vertical",
  "Se acaba un trago antes de tiempo", "Alguien pregunta «¿y ustedes para cuándo?»", "Suena el «Mueve la colita»",
];

// ── MÍMICA: se actúa sin hablar; la mesa adivina antes de que se acabe el tiempo ──
export const MIMICA = [
  "Cortar la torta", "Tirar el ramo", "Bailar el vals", "Ponerse el anillo", "Primer beso", "Cambiar pañales",
  "Pedir matrimonio", "Ir al supermercado", "Lavar los platos", "Manejar en taco", "Hacer un asado", "Tomar el metro",
  "Sacarse una selfie", "Ir al gimnasio", "Pelear por el control remoto", "Roncar", "Planchar una camisa",
  "Bailar reggaetón", "Pasear al perro", "Hacer un brindis", "Llegar tarde a la boda", "Armar un mueble",
  "Cocinar un huevo", "Hacer yoga", "Ver una teleserie", "Esquiar", "Pescar", "Surfear", "Ordeñar una vaca",
  "Jugar a la pelota", "Dormir en la micro", "Pagar la cuenta", "Bailar cueca", "Ponerse lentes de contacto",
  "Despertar con resaca", "Abrir una champaña", "Vestirse de novia", "Hacerse el nudo de la corbata",
];

// ── PREGUNTAS PARA CONOCERSE, por pack (como las apps de pago, pero en la casa) ──
export const PACKS: { id: string; nombre: string; desc: string; color: string; preguntas: string[] }[] = [
  { id: "acercandonos", nombre: "Acercándonos", desc: "Para dejar las charlas de siempre y conversar de verdad", color: "#5b8fb9", preguntas: [
    "¿Cuál es tu recuerdo favorito de la infancia?", "¿Qué te hace sentir querido/a de verdad?",
    "¿Qué es lo que más te costó aprender de ti mismo/a?", "¿En qué momento te sentiste más orgulloso/a de ti?",
    "¿Qué te gustaría que la gente supiera de ti sin tener que decirlo?", "¿Qué cosa te da paz?",
    "¿A quién admiras y por qué?", "¿Qué es lo que más valoras en una amistad?", "¿Qué te quita el sueño últimamente?",
    "¿Qué canción te representa hoy?", "¿Qué te gustaría hacer más seguido solo/a?", "¿Qué te hace reír siempre?",
    "¿Qué hábito tuyo te gustaría cambiar?", "¿Cuál es el mejor consejo que te han dado?",
    "¿Qué día de tu vida repetirías tal cual?", "¿Qué te da miedo y casi nunca dices?",
    "¿Qué es lo que más te gusta de cómo nos tratamos?", "¿Qué te gustaría que hiciera cuando estás triste?",
    "¿Qué cosa pequeña te alegra el día?", "¿Qué aprendiste de la relación de tus papás?",
  ]},
  { id: "vida", nombre: "Vida y sueños", desc: "Metas, planes y dónde se ven en 10 años", color: "#7a9e7e", preguntas: [
    "¿Dónde te imaginas que vamos a vivir en 10 años?", "¿Cuántos hijos te imaginas? ¿O ninguno?",
    "¿Qué viaje tenemos que hacer sí o sí antes de los 40?", "¿Qué trabajo harías si la plata no importara?",
    "¿Qué te gustaría haber logrado a los 50?", "¿Casa o departamento? ¿Ciudad o campo?",
    "¿Qué tradición quieres que tengamos como familia?", "¿Cómo te imaginas un domingo perfecto cuando seamos viejitos?",
    "¿Qué sueño dejaste guardado y te gustaría retomar?", "¿Qué cosa nueva quieres aprender este año?",
    "¿Cómo te gustaría celebrar nuestro aniversario número 10?", "¿Qué mascota tendríamos?",
    "¿Qué tendría que pasar para que digas «lo logramos»?", "¿A qué edad te gustaría jubilar y qué harías?",
    "¿Qué le enseñarías sí o sí a un hijo?", "¿Qué país te gustaría conocer juntos y por qué?",
    "¿Qué te gustaría que dijeran de nosotros como pareja?", "¿Qué meta de plata tenemos que ponernos?",
  ]},
  { id: "tierno", nombre: "Tierno y tonto", desc: "Risas y cariño con preguntas bobas", color: "#d98aa0", preguntas: [
    "Si fuéramos un dúo famoso, ¿cuál seríamos?", "¿Qué animal sería yo y cuál serías tú?",
    "Si nuestra relación fuera una película, ¿cómo se llamaría?", "¿Cuál es la cosa más ridícula que has hecho por mí?",
    "¿Qué superpoder me darías?", "Si tuviéramos un programa de cocina, ¿qué plato nos haría famosos?",
    "¿Qué canción cantarías en un karaoke para conquistarme?", "¿Cuál es mi cara más chistosa?",
    "Si pudieras cambiar mi nombre, ¿cuál me pondrías?", "¿Qué sabor de helado sería nuestra relación?",
    "¿Qué emoji me representa?", "¿Cuál es el apodo más tonto que me pondrías?",
    "Si fuéramos personajes de dibujos animados, ¿quiénes seríamos?", "¿Qué haría yo en un apocalipsis zombie?",
    "¿Qué te gustaría que hiciéramos un día completo en pijama?", "¿Quién ganaría en una pelea de cosquillas?",
    "¿Qué serie veríamos 10 veces?", "¿Quién se perdería primero en un viaje?",
  ]},
  { id: "dificiles", nombre: "Temas difíciles", desc: "Lo importante, con calma y cariño", color: "#8e6fb0", preguntas: [
    "¿Cómo te gusta que arreglemos una pelea?", "¿Qué haces cuando te sientes poco valorado/a?",
    "¿Cómo vamos a repartir las cosas de la casa?", "¿Cómo manejamos la plata: todo junto o por separado?",
    "¿Qué límite con nuestras familias es importante para ti?", "¿Qué te molesta y no me has dicho?",
    "¿Qué necesitas de mí cuando estás estresado/a?", "¿Qué cosa no negociarías nunca en un matrimonio?",
    "¿Cómo te imaginas que vamos a criar a nuestros hijos?", "¿Qué hacemos si uno quiere mudarse por trabajo?",
    "¿Qué te da celos y cómo lo podemos manejar?", "¿Hay algo del pasado que todavía te pese?",
    "¿Qué significa para ti la fidelidad?", "¿Cómo quieres que nos apoyemos en lo espiritual?",
    "¿Qué hacemos el día que tengamos una crisis?", "¿Qué te gustaría que cambiara en cómo nos comunicamos?",
  ]},
];

// ── ¿QUÉ PREFERIRÍAS? (en pareja) ──
export const PREFERIRIAS = [
  ["Una luna de miel en la playa", "Una luna de miel en la nieve"], ["Cocinar juntos todas las noches", "Salir a comer todos los fines de semana"],
  ["Vivir en la playa", "Vivir en el campo"], ["Un perro", "Un gato"], ["Leer mi mente un día", "Que yo lea la tuya un día"],
  ["Desayuno en la cama", "Cena a la luz de las velas"], ["Viajar por el mundo un año", "Comprar la casa propia"],
  ["Ver una película abrazados", "Salir a bailar"], ["Un viaje sorpresa", "Planificar todo juntos"],
  ["Pelear y reconciliarse al tiro", "No pelear pero quedarse con la duda"], ["Dormir abrazados", "Cada uno en su lado"],
  ["Masaje de pies", "Masaje de espalda"], ["Mensajes de buenos días", "Llamadas de buenas noches"],
  ["Una cita en un mirador", "Una cita en la casa con pijama"], ["Que te escriba una carta", "Que te cante una canción"],
  ["Celebrar el aniversario solos", "Celebrarlo con amigos"], ["Bañarse en una tina juntos", "Tomar sol juntos"],
  ["Besos lentos", "Besos sorpresa"], ["Que te despierte con besos", "Que te despierte con café"],
  ["Una noche en un hotel", "Un fin de semana en una cabaña"], ["Ser siempre el que propone", "Ser siempre el que acepta"],
  ["Ducharse juntos", "Bañarse en el mar de noche"], ["Una noche sin celulares", "Un día entero sin ropa en la casa"],
  ["Bailar lento en la cocina", "Cantar a gritos en el auto"], ["Hacer un tatuaje juntos", "Hacer un viaje en moto juntos"],
  ["Volver a nuestra primera cita", "Inventar una cita totalmente nueva"], ["Que me pongas una venda en los ojos", "Ponértela yo a ti"],
  ["Un abrazo de 10 minutos", "Diez besos de un minuto"], ["Que te sorprenda con lencería", "Que te sorprenda con un viaje"],
];

// ── ¿CUÁNTO ME CONOCES? Uno responde en secreto (lo anota o lo dice al oído del otro jugador) y la pareja adivina ──
export const QUIZ = [
  "¿Cuál es mi comida favorita?", "¿Qué haría yo con un millón de dólares?", "¿Cuál es mi miedo más grande?",
  "¿Qué es lo primero que hago al despertar?", "¿Cuál es mi película favorita?", "¿Qué me hace enojar más rápido?",
  "¿A qué lugar del mundo me iría mañana?", "¿Cuál es mi canción para cantar fuerte en el auto?",
  "¿Qué es lo que más me gusta de ti?", "¿Cuál fue mi primer trabajo?", "¿Qué pido siempre en un restorán?",
  "¿Qué superpoder elegiría?", "¿Cuál es mi recuerdo favorito de los dos?", "¿Cuál es mi color favorito?",
  "¿Qué no soporto que me hagan?", "¿A qué edad di mi primer beso?", "¿Qué haría en un día libre sin ti?",
  "¿Cuál es mi postre favorito?", "¿Qué famoso me parece atractivo?", "¿Qué me da más vergüenza?",
  "¿Cuál es mi mayor sueño?", "¿Qué animal me da miedo?", "¿Qué cosa siempre se me olvida?",
  "¿Cuál es mi lugar favorito para besarte?", "¿Qué prenda tuya me gusta más?", "¿Qué fue lo primero que pensé de ti?",
  "¿Cuál es mi trago favorito?", "¿Qué serie vería otra vez completa?", "¿Cuál es mi manía más rara?",
  "¿Qué te regalaría si tuviera que elegir ahora?",
];

// ── DADOS DEL AMOR: un dado de acción, otro de lugar, por intensidad ──
export const DADOS: Record<string, { acciones: string[]; lugares: string[] }> = {
  suave: { acciones: ["Besa", "Acaricia", "Masajea", "Sopla", "Haz cosquillas en", "Susurra algo en"],
           lugares: ["la mano", "la frente", "la mejilla", "los hombros", "la oreja", "el pelo"] },
  caliente: { acciones: ["Besa", "Muerde suave", "Lame", "Acaricia", "Masajea", "Pasa un hielo por"],
              lugares: ["el cuello", "los labios", "la espalda", "el ombligo", "el muslo", "la nuca"] },
  picante: { acciones: ["Besa", "Muerde", "Lame", "Acaricia lento", "Masajea con aceite", "Desviste"],
             lugares: ["el pecho", "el abdomen", "la parte interna del muslo", "la espalda baja", "donde tu pareja elija", "donde tú quieras"] },
};
