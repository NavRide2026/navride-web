export interface Author {
  name: string;
  role: string;
  avatar: string;
  bio: string;
}

export interface GpxStats {
  distanceKm?: number;
  elevationMeters?: number;
  terrain?: string;
  difficulty?: "Iniciación" | "Media" | "Avanzada" | "Experto";
  offlineReady?: boolean;
}

export interface ElevationStats {
  highPointMeters: number;
  lowPointMeters: number;
  ascentMeters: number;
  distanceKm: number;
  terrainBreakdown?: {
    label: string;
    percent: number;
    color: string;
  }[];
}

export interface BlogPost {
  slug: string;
  title: string;
  eyebrow: string;
  excerpt: string;
  image: string;
  date: string;
  updatedDate?: string;
  readTime: string;
  category: "Guías & Tutoriales" | "Rutas & Tracks GPX" | "Comparativas GPS" | "Técnica & Legalidad";
  categorySlug: "guias-gpx" | "rutas-gpx" | "comparativas-gps" | "tecnica-legalidad";
  tags: string[];
  featured?: boolean;
  author: Author;
  gpxStats?: GpxStats;
  elevationStats?: ElevationStats;
  seoKeywords: string[];
  metaDescription: string;
  content: {
    intro: string;
    sections: {
      id: string;
      heading: string;
      subheading?: string;
      body: string[];
      tipBox?: {
        title: string;
        text: string;
        type?: "info" | "warning" | "success";
      };
      tableData?: {
        headers: string[];
        rows: string[][];
      };
      steps?: {
        num: number;
        title: string;
        description: string;
      }[];
    }[];
    ctaBox: {
      title: string;
      description: string;
      buttonText: string;
      buttonHref: string;
      badgeText: string;
    };
  };
}

const DEFAULT_AUTHOR: Author = {
  name: "Equipo NavRide",
  role: "Especialistas en Navegación Off-Road",
  avatar: "/brand/navride-favicon.svg",
  bio: "Probadores de sistemas cartográficos y rutas GPX para moto trail y aventura.",
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "como-abrir-seguir-archivo-gpx-movil-moto",
    title: "Abrir archivo GPX en el móvil: Guía paso a paso para moto trail",
    eyebrow: "Tutorial GPX",
    excerpt: "Aprende a importar, visualizar y navegar tracks GPX en Android y iPhone sin perderte, sin conexión a internet y evitando los errores más comunes en ruta.",
    image: "/blog/abrir-gpx-movil-moto.jpg",
    date: "2026-09-29",
    updatedDate: "2026-09-30",
    readTime: "8 min de lectura",
    category: "Guías & Tutoriales",
    categorySlug: "guias-gpx",
    tags: ["GPX", "Navegación", "Mapas Offline", "Android", "iPhone", "Tutorial"],
    featured: true,
    author: DEFAULT_AUTHOR,
    gpxStats: {
      terrain: "Pistas y carretera secundaria",
      difficulty: "Iniciación",
      offlineReady: true,
    },
    seoKeywords: [
      "abrir archivo gpx en el movil",
      "como seguir ruta gpx en moto",
      "ver track gpx android iphone",
      "app para abrir gpx gratis",
      "navegar track gpx sin conexion",
    ],
    metaDescription: "Guía paso a paso para abrir, visualizar y seguir archivos GPX en tu teléfono móvil mientras conduces en moto trail. Mapas offline, HUD y solución de errores.",
    content: {
      intro: "Has planeado tu salida de fin de semana, te han pasado un archivo con extensión .gpx por un grupo de WhatsApp o lo has descargado de internet... pero al pulsar sobre él, tu móvil intenta abrirlo como un documento de texto, con Google Maps o simplemente da error. No te preocupes: seguir un track GPX en moto es sumamente sencillo una vez que comprendes cómo funciona la cartografía digital.",
      sections: [
        {
          id: "que-es-un-archivo-gpx",
          heading: "1. ¿Qué es exactamente un archivo GPX y qué contiene?",
          subheading: "La diferencia fundamental entre Waypoints, Tracks y Rutas",
          body: [
            "Un archivo GPX (GPS Exchange Format) es un estándar abierto basado en XML que almacena coordenadas geográficas tridimensionales (latitud, longitud y altitud). A diferencia de las indicaciones convencionales de 'gire a la derecha en 200 metros', un archivo GPX contiene una serie continua de puntos que dibujan con precisión milimétrica por dónde debes pasar.",
            "Dentro de un GPX conviven tres conceptos esenciales que todo piloto trail debe dominar:",
            "• Waypoints (WPT): Puntos de interés específicos e independientes (gasolineras remotas, fuentes de agua, miradores, vados complicados o puntos de acampada).",
            "• Tracks (TRK): Una huella fija e inmutable compuesta por miles de puntos conectados cronológicamente. Es el camino exacto que alguien recorrió previamente sobre el terreno.",
            "• Routes (RTE): Una lista reducida de puntos clave donde el navegador calcula por su cuenta la carretera entre uno y otro. En conducción off-road, las rutas calculadas son peligrosas porque los navegadores intentan buscar el asfalto más cercano.",
          ],
          tipBox: {
            title: "Regla de oro para moto de campo",
            text: "Para off-road y pistas forestales, utiliza SIEMPRE el modo Track (recorrido grabado) y jamás una 'Route' calculada, ya que los algoritmos urbanos intentarán desviarte por asfalto.",
            type: "warning",
          },
        },
        {
          id: "por-que-google-maps-no-sirve",
          heading: "2. Por qué Google Maps o Waze no sirven para pistas de tierra",
          subheading: "Las limitaciones técnicas de las aplicaciones urbanas",
          body: [
            "La pregunta más frecuente de quienes se inician en el trail es: «¿Por qué no puedo abrir mi GPX directamente en Google Maps?». La respuesta técnica es contundente:",
            "1. Ausencia de caminos forestales: Google Maps depende de cartografía comercial indexada para turismos y furgonetas. La inmensa mayoría de pistas forestales, sendas y caminos rurales ni siquiera existen en su base de datos.",
            "2. Dependencia de cobertura móvil: Sin cobertura de red 4G/5G en zonas remotas de montaña, el mapa satelital deja de cargar las teselas de alta resolución, dejándote con una pantalla en blanco.",
            "3. Interfaz con sobrecarga cognitiva: La interfaz urbana está saturada de datos irrelevantes (restaurantes, tráfico, radares urbanos) y carece de un velocímetro legible o rumbo magnético optimizado para el manillar a 80 km/h.",
          ],
        },
        {
          id: "paso-a-paso-navride",
          heading: "3. Cómo importar y navegar tu GPX en NavRide paso a paso",
          subheading: "Flujo de trabajo optimizado para pilotos de aventura",
          body: [
            "NavRide fue diseñado desde cero para solucionar este problema con un flujo de trabajo de dos toques directo desde el teléfono:",
          ],
          steps: [
            {
              num: 1,
              title: "Descarga el archivo .gpx en tu teléfono",
              description: "Descárgalo desde el navegador, guárdalo desde WhatsApp/Telegram o sincronízalo desde tu almacenamiento en la nube.",
            },
            {
              num: 2,
              title: "Ábrelo directamente con NavRide",
              description: "Toca el archivo y pulsa «Abrir con NavRide». Si estás en la web o en la app, pulsa el botón «Importar GPX» y selecciónalo de tu almacenamiento.",
            },
            {
              num: 3,
              title: "Verifica el trazado y la altimetría",
              description: "Comprueba el punto de partida (WayPoint 1), la distancia total en kilómetros y el perfil de elevación para anticipar pendientes pronunciadas.",
            },
            {
              num: 4,
              title: "Activa el HUD y comienza la navegación",
              description: "Al iniciar, la pantalla entra en modo de alto contraste con tu posición GPS en tiempo real adherida al track, velocidad actual y distancia restante.",
            },
          ],
        },
        {
          id: "preparacion-movil-manillar",
          heading: "4. Equipamiento recomendado para llevar el móvil en el manillar",
          subheading: "Evita que las vibraciones rompan tu cámara o el sol apague el dispositivo",
          body: [
            "Navegar durante horas por pistas de tierra somete a cualquier smartphone a vibraciones extremas, polvo, agua y altas temperaturas:",
            "• Soporte con amortiguador de vibraciones: Las frecuencias de los motores monocilíndricos y bicilíndricos rompen los estabilizadores ópticos de cámara (OIS) en móviles de gama alta. Utiliza soportes con elastómeros absorbentes (tipo Quad Lock con antivibración o SP Connect).",
            "• Alimentación continua a 12V: La pantalla encendida y el chip GPS activo consumen batería rápidamente. Instala una toma estanca conectada tras contacto o lleva una powerbank de carga rápida en la bolsa sobre depósito.",
            "• Protección térmica: El sol directo en verano puede apagar el móvil por sobrecalentamiento. El HUD oscuro de NavRide con fondo negro puro (#050608) reduce drásticamente el consumo de pantalla OLED y la emisión de calor interno.",
          ],
          tipBox: {
            title: "Consejo pro de seguridad",
            text: "Descarga siempre el corredor de mapa offline antes de salir del garaje. Nunca confíes en que tendrás cobertura en los valles o pasos de montaña.",
            type: "info",
          },
        },
        {
          id: "solucion-errores-comunes",
          heading: "5. Solución de errores habituales en ruta",
          subheading: "Qué hacer si el track se ve al revés o pierdes la señal satelital",
          body: [
            "• Track invertido: Si la aplicación te indica que des la vuelta nada más empezar, el archivo se grabó en sentido contrario. En el editor de NavRide puedes usar el botón 'Invertir sentido' con un solo clic.",
            "• Pérdida temporal de señal en desfiladeros: En cañones profundos o gargantas rocosas, la visibilidad satelital disminuye. Mantén la marcha por la pista principal sin desviarte; en cuanto el horizonte se despeje, el chip GPS recuperará la adherencia al track.",
            "• Desvíos por cancelas ganaderas: Si encuentras una cancela cerrada pero sin candado, puedes abrirla, pasar y volver a cerrarla exactamente como la encontraste. Si tiene candado o señal de prohibición expresa, busca el desvío más próximo.",
          ],
        },
      ],
      ctaBox: {
        title: "¿Tienes un archivo GPX para probar?",
        description: "Comprueba cómo se visualiza tu recorrido en segundos con el visor y editor gratuito de NavRide.",
        buttonText: "Probar el Editor GPX ahora",
        buttonHref: "/editor-gpx",
        badgeText: "Herramienta Gratuita",
      },
    },
  },
  {
    slug: "tet-espana-gpx-guia-trans-euro-trail",
    title: "Trans Euro Trail España GPX: Track oficial, etapas y consejos",
    eyebrow: "Rutas & Aventura",
    excerpt: "Todo lo que necesitas saber para afrontar el TET en España: descarga oficial del track GPX, tramos recomendados por dificultad, legalidad de pistas y equipamiento.",
    image: "/blog/tet-espana-trail-oficial.jpg",
    date: "2026-09-28",
    updatedDate: "2026-09-30",
    readTime: "10 min de lectura",
    category: "Rutas & Tracks GPX",
    categorySlug: "rutas-gpx",
    tags: ["TET", "Trans Euro Trail", "Off-Road", "Maxi-Trail", "España", "Rutas GPX"],
    featured: true,
    author: DEFAULT_AUTHOR,
    gpxStats: {
      distanceKm: 8500,
      elevationMeters: 3200,
      terrain: "75% Pista no asfaltada / 25% Enlace rural",
      difficulty: "Media",
      offlineReady: true,
    },
    elevationStats: {
      highPointMeters: 2350,
      lowPointMeters: 10,
      ascentMeters: 14200,
      distanceKm: 8500,
      terrainBreakdown: [
        { label: "Pista forestal grava", percent: 55, color: "#FF8500" },
        { label: "Pista pedregosa rota", percent: 25, color: "#FF5A1F" },
        { label: "Asfalto rural secundario", percent: 20, color: "#8BEA00" },
      ],
    },
    seoKeywords: [
      "trans euro trail espana gpx",
      "tet espana track descargar",
      "tet espana tramo norte",
      "rutas trail espana gpx",
      "trans euro trail moto etapas",
    ],
    metaDescription: "Guía completa del Trans Euro Trail (TET) en España. Descarga los tracks GPX actualizados, tramos para principiantes y Maxi-Trail, y consejos de navegación offline.",
    content: {
      intro: "El Trans Euro Trail (TET) es el sueño de cualquier amante del mototurismo de aventura: más de 100.000 kilómetros de pistas no asfaltadas a lo largo de Europa impulsados por una comunidad altruista de 'Linesmen'. En España, el recorrido supera los 8.500 km atravesando desiertos, cordilleras y valles remotos. Afrontarlo con éxito requiere planificación milimétrica y la herramienta de navegación adecuada.",
      sections: [
        {
          id: "que-es-el-tet-espana",
          heading: "1. ¿Qué es el TET en España y cómo se divide?",
          subheading: "Una red viva de más de 8.500 km de pistas y enlaces",
          body: [
            "El trazado español del TET es uno de los más variados del continente europeo. Se estructura principalmente en dos grandes arterias conectadas por enlaces estratégicos:",
            "• Sección Norte: Desde la frontera con Francia recorriendo los Pirineos catalanes y aragoneses, la Cordillera Cantábrica y los Montes de León hasta Galicia. Pistas con vegetación densa, vados húmedos, raíces y pasos de piedra suelta.",
            "• Sección Centro-Sur: Atraviesa los sistemas Ibérico y Central, cruzando el altiplano de Teruel, las serranías manchegas, las sierras de Cazorla y Segura, y los desiertos de Almería y Granada hasta Tarifa.",
            "El firme oscila entre pistas compactadas de grava perfectas para cualquier Maxi-Trail cargada y tramos rotos con escalones rocosos donde se agradece una montura ligera.",
          ],
        },
        {
          id: "descarga-oficial-gpx",
          heading: "2. Dónde y cómo descargar el track GPX oficial sin riesgos",
          subheading: "Evita tracks obsoletos que pueden acarrear sanciones de miles de euros",
          body: [
            "Existe una advertencia fundamental que repite la organización oficial del TET: nunca descargues tracks del TET subidos por terceros a plataformas de intercambio libre como Wikiloc sin contrastar la fecha.",
            "¿Por qué? Porque las leyes de montes y los permisos de paso en España cambian constantemente. Un tramo que era legal en 2022 puede haber sido catalogado como parque natural protegido con multas de hasta 3.000 € por transitar con vehículo a motor.",
            "Descarga siempre el archivo desde la web oficial de transeurotrail.org y utiliza el editor web de NavRide para verificar los tramos y cargarlos a tu móvil.",
          ],
          tipBox: {
            title: "Aviso Legal y Código de Conducta TET",
            text: "El TET promueve el lema 'Respect the trail': respeta a caminantes, ciclistas y ganado; cede siempre el paso; no circules en grupos de más de 3-4 motos; y cierra todas las cancelas que abras para el pastoreo.",
            type: "warning",
          },
        },
        {
          id: "tramos-segun-experiencia",
          heading: "3. Tramos recomendados según tu montura y nivel",
          subheading: "Selecciona el sector adecuado para tu moto y tus neumáticos",
          body: [
            "No todos los tramos tienen la misma exigencia física ni técnica. Aquí tienes una clasificación orientativa con los aspectos críticos de cada región:",
          ],
          tableData: {
            headers: ["Zona / Tramo", "Dificultad", "Montura Ideal", "Aspecto Crítico"],
            rows: [
              ["Monegros y Altiplano Turolense", "Baja - Media", "Maxi-Trail (GS, Africa Twin, T7)", "Polvo fino en verano y arcilla pegajosa tras lluvia"],
              ["Pirineo Central y Valle de Arán", "Media - Alta", "Trail media / Enduro Trail", "Piedra suelta, niebla repentina y ventisqueros"],
              ["Serranía de Cuenca y Albarracín", "Media", "Cualquier Trail", "Navegación en laberintos de pistas cruzadas"],
              ["Sierra Nevada y Alpujarras", "Alta", "Trail ligera (CRF300, 701, PR7)", "Desniveles acusados, pistas aéreas y barrancos"],
            ],
          },
        },
        {
          id: "como-navegarlo-con-navride",
          heading: "4. Cómo configurar NavRide para el TET",
          subheading: "División del archivo maestro y optimización de recursos",
          body: [
            "El archivo completo del TET España pesa varios megabytes y contiene más de 40.000 puntos de track. Muchos navegadores antiguos se congelan o se vuelven lentos ante semejante volumen de datos.",
            "1. Abre el track en el Editor GPX de NavRide y divídelo en las etapas que vayas a realizar cada día (habitualmente entre 180 km y 280 km por jornada).",
            "2. En la app NavRide, descarga previamente el corredor de mapa offline de cada sección.",
            "3. Durante la marcha, el HUD te indicará la adherencia exacta al track para que no tomes una bifurcación errónea en pistas sin señalizar.",
          ],
        },
        {
          id: "equipamiento-imprescindible",
          heading: "5. Equipamiento y recambios para afrontar el TET",
          subheading: "La autonomía mecánica en zonas sin cobertura",
          body: [
            "Quedarte tirado en mitad de un altiplano a 40 km del pueblo más cercano exige autosuficiencia:",
            "• Neumáticos adecuados: Un neumático 50/50 como mínimo (MotoZ Tractionator, Michelin Anakee Wild, Mitas E-07+ o Continental TKC80). Los neumáticos de asfalto con ligero dibujo sufren cortes en piedras afiladas.",
            "• Kit de reparación de neumáticos: Si llevas cámara, desmontables reforzados, cámara delantera de 21 pulgadas (sirve provisionalmente para la trasera en emergencia) y bomba eléctrica compacta o cartuchos de CO2.",
            "• Herramientas específicas de tu moto: Llaves para desmontar ruedas, eslabón de cadena rápido, alambre y cinta americana de alta resistencia.",
          ],
        },
      ],
      ctaBox: {
        title: "¿Vas a recorrer el TET este fin de semana?",
        description: "Importa tu track en NavRide, comprueba la altimetría y navega sin temor a perder la cobertura en mitad del monte.",
        buttonText: "Abrir NavRide y Cargar Track",
        buttonHref: "/editor-gpx",
        badgeText: "Aventura 100% Offline",
      },
    },
  },
  {
    slug: "ruta-transpirenaica-offroad-moto-gpx",
    title: "Transpirenaica en moto off-road GPX: Etapas, pistas y puertos legales",
    eyebrow: "Rutas Míticas",
    excerpt: "Desde el Cabo de Creus en el Mediterráneo hasta Hondarribia en el Cantábrico: más de 900 km de pistas pirenaicas, puertos legendarios y tramos de paso restringido explicados.",
    image: "/blog/transpirenaica-offroad-pirineos.jpg",
    date: "2026-09-27",
    updatedDate: "2026-09-30",
    readTime: "11 min de lectura",
    category: "Rutas & Tracks GPX",
    categorySlug: "rutas-gpx",
    tags: ["Transpirenaica", "Pirineos", "Off-Road", "Rutas GPX", "Moto Trail", "Aventura"],
    featured: false,
    author: DEFAULT_AUTHOR,
    gpxStats: {
      distanceKm: 980,
      elevationMeters: 2450,
      terrain: "65% Pista de montaña / 35% Carretera rota",
      difficulty: "Media",
      offlineReady: true,
    },
    elevationStats: {
      highPointMeters: 2450,
      lowPointMeters: 0,
      ascentMeters: 18400,
      distanceKm: 980,
      terrainBreakdown: [
        { label: "Pistas alpinas de piedra", percent: 45, color: "#FF8500" },
        { label: "Pistas rápidas de grava", percent: 25, color: "#FF9D2E" },
        { label: "Puertos de asfalto y enlaces", percent: 30, color: "#8BEA00" },
      ],
    },
    seoKeywords: [
      "transpirenaica en moto offroad gpx",
      "transpirenaica moto etapas track",
      "ruta transpirenaica trail",
      "descargar track gpx pirineos moto",
      "pistas legales transpirenaica moto",
    ],
    metaDescription: "Guía completa para hacer la Transpirenaica en moto off-road: track GPX etapa a etapa, puertos míticos, combustible en zonas aisladas y mapas offline para NavRide.",
    content: {
      intro: "La Transpirenaica es la ruta reina de la península ibérica. Unir el mar Mediterráneo con el océano Cantábrico sorteando la cordillera más agreste de Europa occidental es una experiencia iniciática para cualquier piloto trail. Te detallamos cómo planificar las etapas, evitar pistas conflictivas y navegar el track sin sustos.",
      sections: [
        {
          id: "etapas-recomendadas",
          heading: "1. Reparto estratégico de etapas (De Este a Oeste)",
          subheading: "Por qué rodar desde el Mediterráneo hacia el Cantábrico",
          body: [
            "Rodar desde el amanecer en el Cap de Creus hacia la puesta de sol en el Cantábrico es la dirección más agradecida lumínicamente:",
            "• Etapa 1: Llançà / Roses a Camprodon o Ripoll (160 km) — Pistas rápidas de bienvenida con vistas a la Costa Brava y subida progresiva al Prepirineo.",
            "• Etapa 2: Ripoll a La Seu d'Urgell (180 km) — Subida a cotas altas, pasos de collado pedregosos, pista de la Collada de Tosses y pistas fronterizas.",
            "• Etapa 3: La Seu d'Urgell al Valle de Arán / Benasque (210 km) — El corazón de los Pirineos centrales con pistas míticas como la pista de Tor a Andorra y desniveles superiores a 2.000 metros.",
            "• Etapa 4: Benasque / Ainsa a Jaca (190 km) — Tierra de cañones, pistas rápidas entre valles deshabitados y cruce de los valles aragoneses de Tena y Hecho.",
            "• Etapa 5: Jaca a Hondarribia / San Sebastián (220 km) — Descenso verde navarro, pistas húmedas de bosque, paso por el Valle de Roncal y llegada al mar Cantábrico.",
          ],
        },
        {
          id: "pasos-miticos-pirenaicos",
          heading: "2. Puertos y pistas legendarias del recorrido",
          subheading: "Los puntos culminantes que todo motero recordará",
          body: [
            "A lo largo de los casi 1.000 kilómetros cruzarás lugares de belleza alpina sobrecogedora:",
            "• La Pista de Tor: Comunica el pueblo de Tor con la estación de esquí de Pal en Andorra. Famosa por su historia de contrabando, alcanza los 2.000 metros de altitud con firme pedregoso.",
            "• El Pic Negre (Andorra): Una subida opcional desde Sant Julià de Lòria hasta más de 2.600 metros de altitud, con la famosa furgoneta Volkswagen T1 oxidada en la cumbre.",
            "• Pistas de Guara y Sobrarbe: Valles desolados con pistas de grava blanca y vistas panorámicas hacia el Macizo de Monte Perdido.",
          ],
        },
        {
          id: "puntos-criticos-combustible",
          heading: "3. Puntos críticos de repostaje y pasos estrechos",
          subheading: "Planificación de combustible en zonas deshabitadas",
          body: [
            "En las etapas 2 y 3 cruzarás macizos donde no hay gasolineras durante más de 120 km. Si tu moto tiene depósito pequeño (menos de 10 litros), lleva botellas auxiliares homologadas o planifica desvíos hacia valles principales.",
            "En el Editor GPX de NavRide puedes colocar Waypoints personalizados en las gasolineras de Ripoll, Sort, Vielha, Castejón de Sos y Biescas para que el HUD te avise de su proximidad en ruta.",
          ],
        },
        {
          id: "legalidad-por-comunidades",
          heading: "4. Marco normativo: Cataluña, Aragón y Navarra",
          subheading: "Evita circular por pistas de acceso restringido ganadero",
          body: [
            "• Cataluña: La Ley de Acceso Motorizado al Medio Natural prohíbe circular por pistas de menos de 4 metros de anchura o señalizadas con limitación expresa. Velocidad máxima: 30 km/h.",
            "• Aragón: Regulación específica en pistas forestales de montaña. Algunas pistas de alta cota cierran por barro en primavera y por riesgo de aludes en otoño.",
            "• Navarra: Máxima protección en el Valle de Baztán y Selva de Irati. Muchas pistas están reservadas exclusivamente a vecinos y ganaderos.",
          ],
          tipBox: {
            title: "Atención a la señal R-100",
            text: "La señal circular con borde rojo y fondo blanco (prohibido el paso a toda clase de vehículos) debe respetarse escrupulosamente, incluso si tu archivo GPX marca que la ruta continúa por allí.",
            type: "warning",
          },
        },
      ],
      ctaBox: {
        title: "¿Quieres inspeccionar el track de la Transpirenaica?",
        description: "Carga la ruta en nuestro editor web interactivo, revisa los puertos de montaña y descárgalo listo para NavRide.",
        buttonText: "Ver Track en Editor GPX",
        buttonHref: "/editor-gpx",
        badgeText: "Track Completo",
      },
    },
  },
  {
    slug: "osmand-vs-calimoto-vs-navride-gps-moto",
    title: "OsmAnd vs Calimoto: Comparativa de aplicaciones GPS para moto",
    eyebrow: "Comparativas GPS",
    excerpt: "Analizamos a fondo los pros, contras, mapas offline, facilidad de uso y modo HUD de las tres aplicaciones de referencia para mototurismo y off-road en 2026.",
    image: "/blog/comparativa-apps-gps-moto.jpg",
    date: "2026-09-26",
    updatedDate: "2026-09-30",
    readTime: "9 min de lectura",
    category: "Comparativas GPS",
    categorySlug: "comparativas-gps",
    tags: ["OsmAnd", "Calimoto", "NavRide", "Comparativa", "Apps GPS", "Moto Trail"],
    featured: false,
    author: DEFAULT_AUTHOR,
    seoKeywords: [
      "osmand vs calimoto",
      "mejor app gps moto trail offline",
      "alternativas wikiloc para moto",
      "kurviger vs osmand",
      "navegador gps para moto con gpx",
    ],
    metaDescription: "Comparativa entre OsmAnd, Calimoto y NavRide. Descubre cuál es la mejor aplicación para seguir rutas GPX, curvas en carretera y pistas off-road en moto.",
    content: {
      intro: "El smartphone se ha consolidado definitivamente en el manillar de la moto. Sin embargo, encontrar la aplicación perfecta no es tarea sencilla: unas son ideales para trazar curvas en asfalto pero inútiles en el barro, mientras que otras son extremadamente potentes pero tan complejas que requieren un manual de 80 páginas solo para empezar a rodar.",
      sections: [
        {
          id: "tabla-comparativa-general",
          heading: "1. Tabla comparativa: Prestaciones frente a frente",
          subheading: "Análisis técnico bajo condiciones reales de conducción",
          body: [
            "Hemos enfrentado las soluciones más utilizadas bajo condiciones reales de conducción (guantes de moto, sol directo y ausencia total de cobertura de datos):",
          ],
          tableData: {
            headers: ["Característica", "OsmAnd", "Calimoto", "NavRide"],
            rows: [
              ["Especialidad principal", "Topografía y senderismo técnico", "Curvas automáticas en carretera", "Navegación GPX Off-road y Trail"],
              ["Soporte Off-Road / Pistas", "Sobresaliente", "Muy deficiente / Sin pistas", "Sobresaliente"],
              ["Mapas sin conexión (Offline)", "Excelente (Vectoriales)", "Bueno (Descarga por zonas)", "Excelente (Corredores y offline)"],
              ["Curva de aprendizaje", "Muy alta (Menús complejos)", "Muy baja (Muy intuitivo)", "Baja y directa al grano"],
              ["HUD limpio para manillar", "No (Pantalla sobrecargada)", "Parcial (Enfocado a curvas)", "Sí (Diseñado para no distraer)"],
              ["Editor GPX Web Integrado", "No (Requiere software externo)", "Básico en web", "Sí (Editor nativo en navegador)"],
            ],
          },
        },
        {
          id: "analisis-osmand",
          heading: "2. OsmAnd: El gigante cartográfico con barrera de entrada",
          subheading: "Potencia ilimitada a costa de una interfaz farragosa",
          body: [
            "OsmAnd es la referencia histórica para los usuarios más técnicos. Utiliza los datos de OpenStreetMap de forma exhaustiva, permitiendo superponer curvas de nivel topográficas, capas de relieve sombreado y millones de pistas.",
            "Su gran talón de Aquiles es la experiencia de usuario: configurar los perfiles de enrutamiento, evitar que recalcule y arruine un track importado o interactuar con sus menús llevando guantes de moto es una tarea frustrante para quien simplemente quiere encender la moto y seguir un recorrido.",
          ],
        },
        {
          id: "analisis-calimoto",
          heading: "3. Calimoto: La reina de las curvas en asfalto",
          subheading: "Excelente para salidas dominicales por carretera revirada",
          body: [
            "Calimoto revolucionó el mototurismo de carretera gracias a su algoritmo de cálculo de rutas sinuosas. Es brillante para salir un domingo por la mañana y pedirle una ruta circular de 200 km llena de curvas divertidas.",
            "Sin embargo, para el motero de Trail y Aventura se queda corta: no está pensada para pistas de tierra, no interpreta tramos técnicos de trialeras y su modelo de suscripción anual es de los más elevados del mercado.",
          ],
        },
        {
          id: "analisis-navride",
          heading: "4. NavRide: El equilibrio entre potencia off-road y sencillez",
          subheading: "Diseñado por y para moteros de aventura",
          body: [
            "NavRide nace precisamente para llenar el vacío que dejan las dos anteriores: ofrece la robustez cartográfica y el soporte offline de pistas que exige el off-road, pero con una interfaz oscura, limpia y con HUD legible de un solo vistazo.",
            "Además, su editor web integrado permite a cualquier piloto ajustar el track en el ordenador antes de subir a la moto, sin necesidad de pelear con conversiones de formatos complicados.",
          ],
        },
      ],
      ctaBox: {
        title: "¿Buscas una alternativa limpia y sin enredos?",
        description: "Conoce todas las funciones de NavRide y descubre cómo transformar tu teléfono en un navegador de rally trail.",
        buttonText: "Descubrir NavRide",
        buttonHref: "/producto",
        badgeText: "Recomendado Trail",
      },
    },
  },
  {
    slug: "movil-rugerizado-vs-garmin-zumo-gps-moto",
    title: "Móvil rugerizado para moto trail vs Garmin Zūmo XT2",
    eyebrow: "Hardware & Gadgets",
    excerpt: "Comparamos a fondo la durabilidad, visibilidad bajo el sol, vibraciones mecánicas y coste real entre un teléfono blindado rugerizado y un GPS dedicado tipo Garmin.",
    image: "/blog/movil-rugerizado-garmin-moto.jpg",
    date: "2026-09-25",
    updatedDate: "2026-09-30",
    readTime: "9 min de lectura",
    category: "Comparativas GPS",
    categorySlug: "comparativas-gps",
    tags: ["Garmin Zumo", "Móvil Rugerizado", "Carpuride", "Hardware", "GPS Moto", "Trail"],
    featured: false,
    author: DEFAULT_AUTHOR,
    seoKeywords: [
      "movil rugerizado para moto trail",
      "garmin zumo xt2 opiniones moto",
      "pantalla carpuride moto trail",
      "mejor movil barato para gps moto",
      "soporte antivibracion gps moto",
    ],
    metaDescription: "Análisis comparativo de hardware para moto trail: móvil rugerizado vs GPS Garmin Zūmo XT2. Brillo, calor, resistencia a caídas y presupuesto.",
    content: {
      intro: "La eterna discusión en los grupos moteros: ¿merece la pena gastarse más de 600 euros en un GPS dedicado tipo Garmin Zūmo XT2 o es más inteligente comprar un smartphone rugerizado de 180 euros con una app como NavRide? Destripamos ambos planteamientos con datos de laboratorio y barro real.",
      sections: [
        {
          id: "comparativa-hardware",
          heading: "1. Comparativa técnica directa",
          subheading: "Rendimiento, resistencia y coste económico",
          body: [
            "Pusimos a prueba ambos sistemas en salidas de enduro trail con lluvia, barro y sol abrasador:",
          ],
          tableData: {
            headers: ["Criterio", "Smartphone Rugerizado (ej. Ulefone)", "Garmin Zūmo XT2"],
            rows: [
              ["Precio aproximado", "160 € - 240 €", "550 € - 650 €"],
              ["Pantalla / Brillo", "6.5 pulgadas / 800 nits IPS", "6.0 pulgadas / 1.050 nits transflectivo"],
              ["Resistencia a caídas / IP68", "Extrema (certificación militar MIL-STD-810H)", "Excelente (carcasa reforzada)"],
              ["Ecosistema de apps", "Infinito (Android abierto, NavRide, radares)", "Cerrado (solo software Garmin)"],
              ["Batería autónoma", "10.000 mAh (hasta 2 días de ruta)", "2 a 3 horas (debe ir conectado a batería)"],
              ["Fluidez del mapa al moverlo", "Ultra rápida (procesador octa-core moderno)", "Moderada (procesador embebido)"],
            ],
          },
        },
        {
          id: "el-drama-del-ois",
          heading: "2. El drama de las vibraciones y el estabilizador óptico (OIS)",
          subheading: "Por qué no debes montar tu teléfono de uso diario en el manillar",
          body: [
            "Los smartphones modernos de gama alta incorporan estabilización óptica mecánica mediante imanes y resortes microscópicos. Las vibraciones armónicas de los motores monocilíndricos (690, 701, CRF) y bicilíndricos (T7, GS, Africa Twin) destruyen este mecanismo en pocos kilómetros.",
            "La solución no es dejar de navegar con móvil, sino dedicar un terminal exclusivo para la moto: bien un teléfono antiguo sin OIS o bien un rugerizado blindado.",
          ],
        },
        {
          id: "la-solucion-ganadora",
          heading: "3. Por qué el combo Móvil Rugerizado + NavRide está barriendo el mercado",
          subheading: "Autonomía de 10.000 mAh y actualizaciones constantes",
          body: [
            "Por el precio de un solo GPS dedicado, un motero puede adquirir un móvil rugerizado exclusivo para la moto, un soporte de manillar de calidad aeronáutica y una suscripción de por vida a software especializado.",
            "Si la pantalla se raya con una piedra en una trialera, sustituir el dispositivo no supone un descalabro económico. Y gracias al HUD de alto contraste de NavRide, la pantalla apenas se calienta incluso en días calurosos de verano.",
          ],
        },
      ],
      ctaBox: {
        title: "¿Quieres usar NavRide en tu teléfono o pantalla?",
        description: "NavRide está optimizada para pantallas táctiles y dispositivos rugerizados con Android.",
        buttonText: "Ver Planes y Compatibilidad",
        buttonHref: "/planes",
        badgeText: "Ahorro Inteligente",
      },
    },
  },
  {
    slug: "editor-gpx-online-unir-recortar-tracks",
    title: "Editor GPX online: Unir, recortar y limpiar tracks de moto",
    eyebrow: "Herramientas Web",
    excerpt: "Guía práctica para fusionar etapas de un viaje, recortar tramos de autopista aburridos y eliminar errores de GPS en tus rutas con el editor web gratuito de NavRide.",
    image: "/blog/editor-gpx-online-rutas.jpg",
    date: "2026-09-24",
    updatedDate: "2026-09-30",
    readTime: "7 min de lectura",
    category: "Guías & Tutoriales",
    categorySlug: "guias-gpx",
    tags: ["Editor GPX", "Herramientas", "Tracks", "Tutorial", "Cartografía"],
    featured: false,
    author: DEFAULT_AUTHOR,
    seoKeywords: [
      "editor gpx online gratis",
      "unir dos archivos gpx",
      "recortar track gpx online",
      "convertir kml a gpx moto",
      "modificar track gpx en navegador",
    ],
    metaDescription: "Aprende a editar, unir y recortar tus tracks GPX directamente desde el navegador web sin instalar BaseCamp ni programas pesados.",
    content: {
      intro: "Cuando descargas una ruta de internet o grabas una salida con tus compañeros, rara vez el archivo está listo para usarse directamente: contiene desvíos involuntarios en gasolineras, tramos de enlace tediosos o viene dividido en tres archivos diferentes que quieres consolidar en una sola jornada. Te enseñamos a limpiarlo en pocos clics.",
      sections: [
        {
          id: "los-problemas-comunes-de-los-gpx",
          heading: "1. Los problemas más frecuentes en los tracks descargados",
          subheading: "Defectos típicos que confunden a los navegadores en ruta",
          body: [
            "La mayoría de archivos GPX compartidos en foros o redes presentan defectos que confunden a los navegadores en plena marcha:",
            "• 'Efecto estrella' en paradas: Cuando te detienes a almorzar o repostar sin pausar la grabación, el GPS sigue registrando pequeñas fluctuaciones que crean un enredo de líneas ilegible sobre el mapa.",
            "• Puntos anómalos de altitud: Pérdidas puntuales de cobertura satelital que registran picos ficticios de 4.000 metros de altitud o velocidades irreales.",
            "• Trazados fragmentados: Rutas de un mismo día divididas en dos o más archivos porque el dispositivo se apagó o se guardaron por tramos separados.",
          ],
        },
        {
          id: "como-unir-dos-archivos-gpx",
          heading: "2. Cómo fusionar varios archivos GPX en una sola etapa",
          subheading: "Consolida jornadas completas en un único track",
          body: [
            "Con el Editor de Rutas de NavRide puedes arrastrar dos o más archivos GPX sobre el lienzo cartográfico. La herramienta detecta la continuidad de los puntos y te permite fusionarlos cronológicamente en un único track continuo y ordenado con su altimetría recalculada.",
          ],
          steps: [
            {
              num: 1,
              title: "Carga el primer archivo GPX en el Editor",
              description: "Arrastra el archivo o pulsa en 'Importar GPX' en la barra superior.",
            },
            {
              num: 2,
              title: "Añade el segundo archivo GPX",
              description: "Selecciona 'Añadir segmento a la ruta' para cargar la continuación.",
            },
            {
              num: 3,
              title: "Pulsa el botón 'Unir tramos'",
              description: "El editor conecta automáticamente el último punto del tramo 1 con el primero del tramo 2.",
            },
            {
              num: 4,
              title: "Exporta el archivo unificado",
              description: "Descarga el GPX listo para sincronizar con tu móvil o GPS.",
            },
          ],
        },
        {
          id: "como-recortar-tramos",
          heading: "3. Recortar enlaces urbanos y dejar solo la aventura",
          subheading: "Elimina kilómetros innecesarios de asfalto y autopista",
          body: [
            "Si sales desde una gran ciudad, no necesitas que el track off-road incluya 40 km de autopista aburrida. Con la herramienta de selección del editor, basta con marcar el punto kilométrico exacto donde comienza la pista de tierra y cortar el tramo inicial.",
            "De este modo, tu navegador arrancará la guía de navegación en el punto exacto donde empieza la diversión en el campo.",
          ],
        },
      ],
      ctaBox: {
        title: "¿Quieres editar tu próxima ruta ahora mismo?",
        description: "Entra a nuestro Editor de Rutas web. Sin registro obligatorio para probarlo y 100% compatible con todos los navegadores.",
        buttonText: "Abrir el Editor de Rutas NavRide",
        buttonHref: "/editor-gpx",
        badgeText: "Editor Web Gratis",
      },
    },
  },
  {
    slug: "legislacion-moto-campo-espana-caminos-legales",
    title: "Legislación moto de campo España 2026: Dónde circular legalmente",
    eyebrow: "Técnica & Legalidad",
    excerpt: "Todo sobre la Ley de Montes, la anchura mínima de 4 metros, restricciones por época de incendios y cómo rodar en moto trail sin infringir normativas medioambientales.",
    image: "/blog/legislacion-moto-campo-caminos.jpg",
    date: "2026-09-23",
    updatedDate: "2026-09-30",
    readTime: "12 min de lectura",
    category: "Técnica & Legalidad",
    categorySlug: "tecnica-legalidad",
    tags: ["Legislación", "Ley de Montes", "Medio Ambiente", "Multas", "Moto Campo", "Legalidad"],
    featured: false,
    author: DEFAULT_AUTHOR,
    seoKeywords: [
      "legislacion moto de campo espana",
      "por donde se puede circular en moto de campo",
      "ley de montes moto trail comunidades",
      "multas circular por caminos con moto",
      "anchura minima pistas forestales moto",
    ],
    metaDescription: "Guía jurídica completa sobre la normativa de motos de campo y trail en España: Ley de Montes, restricciones de verano, velocidad y permisos por comunidad autónoma.",
    content: {
      intro: "La afición por el trail y las motos de aventura no deja de crecer, pero la maraña legislativa en España genera una tremenda incertidumbre: lo que en una comunidad autónoma es perfectamente legal, a 20 kilómetros de distancia cruzando un límite provincial puede costarte una sanción de cuatro cifras. Analizamos la legislación vigente con claridad.",
      sections: [
        {
          id: "marco-general-estatal",
          heading: "1. El marco legal estatal: Ley de Montes 43/2003",
          subheading: "Principios jurídicos que rigen en toda España",
          body: [
            "La Ley de Montes estatal delega en las comunidades autónomas la regulación del tránsito con vehículos a motor por el medio natural. Sin embargo, establece principios universales:",
            "1. La circulación queda limitada a los caminos y pistas expresamente autorizados.",
            "2. Queda terminantemente prohibida la circulación campo a través o sobre lechos de ríos, barrancos y cortafuegos.",
            "3. La prioridad de paso es siempre para caminantes, jinetes, ciclistas y ganado.",
          ],
          tipBox: {
            title: "Concepto de Camino vs Sendero",
            text: "Un 'camino' es una vía de comunicación consolidada de anchura suficiente para el paso de vehículos agrícolas o forestales. Un 'sendero' es una senda peatonal estrecha. Como norma general, si por la vía no cabe un tractor o un 4x4 forestal, una moto no debe circular por ella.",
            type: "warning",
          },
        },
        {
          id: "resumen-por-comunidades",
          heading: "2. La regla del juego por Comunidades Autónomas",
          subheading: "Un mosaico regulatorio muy dispar",
          body: [
            "Las diferencias autonómicas son sustanciales y conviene conocerlas antes de planificar un viaje:",
            "• Cataluña: Exige una anchura mínima de 4 metros en pistas no asfaltadas fuera de la red viaria principal y prohíbe la circulación de grupos de más de 4 motos sin permiso previo.",
            "• Comunidad Valenciana: Prohibición casi total de circular por pistas de tierra en suelo forestal salvo residentes o autorizaciones expresas.",
            "• Castilla y León y Castilla-La Mancha: Mayor permisividad en caminos vecinales y pistas consolidadas, con rigurosa restricción en periodos de peligro alto de incendios.",
            "• Andalucía: Regulación por el Plan INFOCA. Las pistas en parques naturales y zonas de monte público requieren permisos previos expedidos por la Consejería de Medio Ambiente.",
          ],
        },
        {
          id: "requisitos-moto",
          heading: "3. Requisitos técnicos obligatorios en tu moto",
          subheading: "Los puntos clave que revisará el Seprona",
          body: [
            "Tener la moto en regla es la mejor garantía ante cualquier inspección:",
            "• Matrícula reglamentaria: Tamaño legal, iluminada y con una inclinación no superior a 30 grados respecto a la vertical.",
            "• Escape homologado: Con db-killer instalado. Los escapes de competición no homologados para vía pública son motivo inmediato de inmovilización.",
            "• Retrovisores y luces: Al menos el retrovisor izquierdo en motos de hasta 100 km/h y ambos en motos que superen esa velocidad.",
          ],
        },
        {
          id: "consejos-evitar-sanciones",
          heading: "4. Cómo protegerte y circular con tranquilidad",
          subheading: "Herramientas de verificación previa",
          body: [
            "Llevar siempre la documentación en regla (ITV en vigor, seguro obligatorio y matrícula visible) es el primer filtro en un control de agentes medioambientales o Seprona.",
            "El segundo filtro es la navegación: utilizar el editor de NavRide para verificar si tu track GPX atraviesa Parques Naturales o zonas de Especial Protección para las Aves (ZEPA) te ahorrará sorpresas desagradables.",
          ],
        },
      ],
      ctaBox: {
        title: "Planifica tus salidas con seguridad legal",
        description: "Verifica tus rutas GPX en NavRide antes de salir y rueda siempre por caminos autorizados.",
        buttonText: "Revisar Rutas en NavRide",
        buttonHref: "/editor-gpx",
        badgeText: "Trail Responsable",
      },
    },
  },
  {
    slug: "convertir-kml-a-gpx-moto",
    title: "Convertir KML a GPX: Pasa rutas de Google Earth a tu moto",
    eyebrow: "Conversión de Archivos",
    excerpt: "Guía completa para transformar archivos KML y KMZ de Google Earth en tracks GPX limpios y 100% compatibles con navegadores GPS y apps de moto trail.",
    image: "/blog/convertir-kml-kmz-a-gpx.jpg",
    date: "2026-09-22",
    updatedDate: "2026-09-30",
    readTime: "8 min de lectura",
    category: "Guías & Tutoriales",
    categorySlug: "guias-gpx",
    tags: ["KML", "KMZ", "GPX", "Google Earth", "Tutorial", "Conversión"],
    featured: false,
    author: DEFAULT_AUTHOR,
    seoKeywords: [
      "convertir kml a gpx",
      "convertir kmz a gpx online",
      "pasar ruta google earth a gpx moto",
      "kml a gpx online",
      "ruta google earth para gps moto",
    ],
    metaDescription: "Aprende a convertir rutas KML y KMZ de Google Earth a formato GPX para moto trail. Pasos sencillos, sin pérdida de waypoints y corrección de altimetría.",
    content: {
      intro: "Google Earth es una de las herramientas favoritas de los moteros de aventura para explorar pistas desde el sofá: su relieve en 3D y sus imágenes por satélite permiten descubrir collados y senderos increíbles. Sin embargo, cuando guardas tu trabajo, Google Earth genera un archivo .kml o .kmz que la mayoría de navegadores y apps GPS de moto no pueden interpretar directamente. Te enseñamos a convertirlo a GPX con total fidelidad.",
      sections: [
        {
          id: "diferencias-kml-gpx",
          heading: "1. KML vs GPX: ¿Por qué es necesario convertir?",
          subheading: "Formatos diseñados para propósitos completamente diferentes",
          body: [
            "KML (Keyhole Markup Language) fue creado para describir elementos visuales en pantalla: colores de líneas, carpetas, globos informativos y modelos 3D.",
            "GPX (GPS Exchange Format), en cambio, es el estándar universal de la navegación por satélite. Su estructura está estrictamente optimizada para almacenar coordenadas de latitud, longitud, altitud y marcas de tiempo que un procesador GPS puede leer en tiempo real.",
            "Al pasar de KML a GPX, la información se traduce al lenguaje que entienden tu teléfono, tu GPS de moto o las pantallas tipo Carpuride.",
          ],
        },
        {
          id: "pasos-conversion-kml-gpx",
          heading: "2. Paso a paso: Cómo convertir tu archivo a GPX",
          subheading: "Un proceso rápido y sin programas de pago",
          body: [
            "Sigue este flujo de trabajo para garantizar que el trazado mantenga su precisión original:",
          ],
          steps: [
            {
              num: 1,
              title: "Exporta tu trazado en Google Earth",
              description: "Haz clic derecho en la carpeta de tu ruta en Google Earth y selecciona 'Guardar lugar como...'. Elige formato KML o KMZ.",
            },
            {
              num: 2,
              title: "Abre el conversor en el Editor NavRide",
              description: "Accede al Editor GPX de NavRide y arrastra tu archivo KML/KMZ sobre la pantalla.",
            },
            {
              num: 3,
              title: "Revisa la continuidad de los puntos",
              description: "Comprueba que la línea no tenga cortes ni saltos rectos anómalos entre collados.",
            },
            {
              num: 4,
              title: "Descarga el archivo GPX limpio",
              description: "Pulsa 'Exportar GPX' para obtener el archivo listo para transferir al móvil.",
            },
          ],
        },
        {
          id: "errores-frecuentes-conversion",
          heading: "3. Errores habituales y cómo evitarlos",
          subheading: "Líneas rectas, falta de altitud y waypoints duplicados",
          body: [
            "• Dibujar rutas con muy pocos puntos: En Google Earth es fácil trazar una línea con solo 10 clics en un puerto de montaña de 20 km. En el GPS, eso se verá como líneas rectas que atraviesan barrancos. Asegúrate de que el track tenga suficientes puntos de soporte.",
            "• Ignorar la altimetría: Los KML planos no contienen elevación sobre el nivel del mar. Al pasarlo por NavRide, el motor cartográfico interpola las cotas DEM para que tengas la altimetría completa de la etapa.",
          ],
          tipBox: {
            title: "Comprobación sobre terreno",
            text: "Una pista que en la imagen satelital de Google Earth parece ancha y despejada puede estar cortada por un desprendimiento reciente o tener cancela con candado. Ten siempre un plan B.",
            type: "info",
          },
        },
      ],
      ctaBox: {
        title: "¿Tienes un archivo KML listo para convertir?",
        description: "Arrastra tu KML o KMZ en el Editor de NavRide y conviértelo a GPX al instante.",
        buttonText: "Abrir Conversor en Editor GPX",
        buttonHref: "/editor-gpx",
        badgeText: "Conversor Online",
      },
    },
  },
  {
    slug: "app-gps-moto-offline-navegacion",
    title: "App GPS moto offline: Navegación off-road sin cobertura ni datos",
    eyebrow: "Comparativas GPS",
    excerpt: "Guía de apps de navegación para moto trail que funcionan 100% sin conexión: mapas descargables, seguimiento de tracks GPX, consumo de batería y modo HUD.",
    image: "/blog/app-gps-offline-navegacion-moto.jpg",
    date: "2026-09-21",
    updatedDate: "2026-09-30",
    readTime: "9 min de lectura",
    category: "Comparativas GPS",
    categorySlug: "comparativas-gps",
    tags: ["Apps GPS", "Mapas Offline", "Moto Trail", "Navegación", "Android", "iPhone"],
    featured: false,
    author: DEFAULT_AUTHOR,
    seoKeywords: [
      "app gps moto offline",
      "mejor navegador gps moto sin conexion",
      "mapas offline moto trail",
      "mejor navegador off road",
      "app rutas gpx moto",
    ],
    metaDescription: "Descubre cuáles son las mejores aplicaciones GPS para moto offline en 2026. Sigue tracks GPX en pistas remotas sin cobertura 4G/5G y sin perderte.",
    content: {
      intro: "Cuando conduces por pistas forestales, valles profundos o cordilleras aisladas, la cobertura de telefonía móvil desaparece. Depender de aplicaciones que descargan teselas sobre la marcha es una receta segura para quedarte ciego en el cruce más comprometido del día. Analizamos qué características debe reunir una auténtica app GPS offline para moto.",
      sections: [
        {
          id: "por-que-mapas-offline",
          heading: "1. Por qué la navegación off-road exige mapas 100% desconectados",
          subheading: "El mito de la cobertura en la montaña",
          body: [
            "En áreas urbanas damos por sentada la conexión instantánea a internet. Sin embargo, en el 70% de las pistas del Trans Euro Trail o la Transpirenaica no hay señal suficiente ni para enviar un mensaje de texto.",
            "Una aplicación de navegación off-road profesional debe descargar la cartografía vectorial en el almacenamiento interno del dispositivo antes de salir, permitiendo hacer zoom, consultar curvas de nivel y seguir el track con total fluidez en modo avión.",
          ],
        },
        {
          id: "requisitos-app-trail",
          heading: "2. Requisitos indispensables de un navegador trail",
          subheading: "Lo que marca la diferencia sobre la moto",
          body: [
            "No cualquier app de senderismo sirve para rodar a 60 km/h por una pista pedregosa:",
          ],
          tableData: {
            headers: ["Requisito", "Importancia en Trail", "Razón Práctica"],
            rows: [
              ["Modo HUD de alto contraste", "Crítica", "Debe leerse bajo luz solar directa a través de la visera del casco"],
              ["Consumo de batería optimizado", "Alta", "Evita sobrecalentamiento del teléfono y parada térmica"],
              ["No recalcular tracks GPX", "Crítica", "El navegador no debe inventar atajos por asfalto"],
              ["Botones táctiles grandes", "Alta", "Permite interacción rápida con guantes de moto"],
            ],
          },
        },
        {
          id: "analisis-opciones-mercado",
          heading: "3. Opciones destacadas del mercado",
          subheading: "NavRide, OsmAnd, Locus Map y Gaia GPS",
          body: [
            "• NavRide: Diseñada específicamente para motos de campo y trail. Integra visor/editor web, mapas offline optimizados, HUD de navegación con fondo negro OLED y adherencia precisa al track.",
            "• OsmAnd: Muy completa para cartografía topográfica detallada, pero con una interfaz compleja que requiere pulsar múltiples submenús.",
            "• Locus Map: Extraordinaria para usuarios avanzados de Android, aunque exclusiva de ese sistema operativo y sin versión nativa iOS.",
          ],
        },
      ],
      ctaBox: {
        title: "Navega sin cobertura con NavRide",
        description: "Descarga tus mapas antes de arrancar y sigue tus tracks GPX sin depender de la red celular.",
        buttonText: "Conocer NavRide Offline",
        buttonHref: "/producto",
        badgeText: "100% Sin Conexión",
      },
    },
  },
  {
    slug: "pantalla-carplay-android-auto-moto",
    title: "Pantalla CarPlay moto trail: Carpuride vs Chigee para off-road",
    eyebrow: "Hardware & Pantallas",
    excerpt: "Analizamos si merece la pena instalar una pantalla satélite tipo Carpuride o Chigee en tu moto trail: brillo real al sol, resistencia al agua y compatibilidad con GPX.",
    image: "/blog/pantalla-carplay-chigee-carpuride.jpg",
    date: "2026-09-20",
    updatedDate: "2026-09-30",
    readTime: "9 min de lectura",
    category: "Comparativas GPS",
    categorySlug: "comparativas-gps",
    tags: ["CarPlay", "Android Auto", "Carpuride", "Chigee", "Hardware", "Moto Trail"],
    featured: false,
    author: DEFAULT_AUTHOR,
    seoKeywords: [
      "pantalla carplay moto trail",
      "carpuride w502 moto opiniones",
      "chigee aio 5 opiniones offroad",
      "android auto moto trail",
      "carplay para moto",
    ],
    metaDescription: "Análisis exhaustivo de pantallas CarPlay y Android Auto para moto de aventura. Carpuride W502 vs Chigee AIO-5: ventajas en off-road, montaje y compatibilidad GPX.",
    content: {
      intro: "Las pantallas auxiliares con CarPlay y Android Auto se han convertido en el accesorio de moda entre los usuarios de motos Maxi-Trail y de aventura. La promesa es muy atractiva: llevar una pantalla de 5 a 7 pulgadas resistente a la intemperie en la barra del manillar mientras tu valioso smartphone viaja a salvo de caídas y vibraciones dentro de tu chaqueta. Pero, ¿funcionan bien cuando te metes por pistas rotas?",
      sections: [
        {
          id: "carpuride-vs-chigee",
          heading: "1. Carpuride W502/W702 vs Chigee AIO-5: Comparativa técnica",
          subheading: "Los dos referentes del mercado frente a frente",
          body: [
            "Pusimos a prueba los dos modelos más populares del mercado en condiciones exigentes de polvo y pistas pedregosas:",
          ],
          tableData: {
            headers: ["Característica", "Carpuride W502 (5 pulgadas)", "Chigee AIO-5 Lite"],
            rows: [
              ["Precio aproximado", "140 € - 190 €", "350 € - 450 €"],
              ["Brillo de pantalla", "800 nits", "1.000 nits (Sensor automático)"],
              ["Cámaras delantera / trasera", "Opcional en modelos Pro", "Sí (Grabación continua Dashcam)"],
              ["Control por piña / mandos", "Opcional con mando remoto", "Sí (Mando de manillar nativo)"],
              ["Construcción y sellado", "Plástico ABS reforzado IP67", "Cuerpo de aluminio CNC IP68"],
            ],
          },
        },
        {
          id: "ventajas-desventajas-offroad",
          heading: "2. Ventajas y desventajas en conducción off-road",
          subheading: "Lo que los fabricantes no te cuentan en la publicidad",
          body: [
            "• Ventaja indiscutible: Tu teléfono principal no sufre las vibraciones asesinas del motor ni el impacto directo de piedras levantadas por la moto de delante.",
            "• Inconveniente crítico en pistas: Ni Apple CarPlay ni Android Auto fueron concebidos para el off-road. Sus políticas de seguridad restringen los botones en pantalla y muchas aplicaciones de senderismo o tracks no tienen versión homologada para proyectarse en la consola.",
            "• Temperatura del móvil en el bolsillo: Aunque el móvil no esté al sol, llevarlo en un bolsillo cerrado procesando la conexión WiFi de alta velocidad con la pantalla y el chip GPS puede provocar calentamiento.",
          ],
        },
        {
          id: "instalacion-electrica",
          heading: "3. Instalación eléctrica correcta en la moto",
          subheading: "Nunca conectes directamente a la batería sin relé o contacto",
          body: [
            "La pantalla tiene un transformador interno que reduce de 12V a 5V. Si lo conectas directo a los bornes de la batería, ese transformador consumirá unos miliamperios en reposo que descargarán la batería de tu moto en una o dos semanas de inactividad.",
            "Conéctalo siempre a una toma bajo llave (tras contacto) o utiliza un cable auxiliar de accesorios homologado por el fabricante de tu moto.",
          ],
        },
      ],
      ctaBox: {
        title: "Equipa tu moto con la mejor navegación",
        description: "Descubre cómo NavRide se adapta a tus dispositivos para ofrecer la experiencia off-road definitiva.",
        buttonText: "Ver Compatibilidad de NavRide",
        buttonHref: "/producto",
        badgeText: "Hardware Compatible",
      },
    },
  },
  {
    slug: "rutas-moto-trail-espana-tracks-gpx",
    title: "Rutas moto trail España: Dónde descargar los mejores tracks GPX",
    eyebrow: "Rutas & Tracks GPX",
    excerpt: "Guía exhaustiva para descubrir las mejores zonas de moto trail en España: Madrid, Guadalajara, Monegros, Pirineos, Cazorla y los mejores repositorios de tracks GPX verificados.",
    image: "/blog/rutas-moto-trail-espana-pistas.jpg",
    date: "2026-09-19",
    updatedDate: "2026-09-30",
    readTime: "11 min de lectura",
    category: "Rutas & Tracks GPX",
    categorySlug: "rutas-gpx",
    tags: ["Rutas Trail", "España", "Tracks GPX", "Madrid", "Pirineos", "Monegros"],
    featured: false,
    author: DEFAULT_AUTHOR,
    gpxStats: {
      distanceKm: 1200,
      elevationMeters: 2800,
      terrain: "Pistas variadas, grava, ramblas y caminos rurales",
      difficulty: "Media",
      offlineReady: true,
    },
    seoKeywords: [
      "rutas moto trail espana",
      "rutas gpx moto",
      "rutas trail faciles madrid",
      "rutas offroad cataluna gpx",
      "act espana gpx",
    ],
    metaDescription: "Descubre las mejores rutas en moto trail por España. Dónde descargar tracks GPX legales, zonas recomendadas para principiantes y cómo planificarlas con NavRide.",
    content: {
      intro: "España es considerada unánimemente la meca del mototurismo trail en el sur de Europa. La combinación de una orografía montañosa privilegiada, una baja densidad de población en grandes extensiones del interior y miles de kilómetros de pistas públicas la convierten en el paraíso de las dos ruedas. Sin embargo, no todas las pistas son transitables ni todos los tracks que circulan por internet son seguros o legales.",
      sections: [
        {
          id: "mejores-zonas-espana",
          heading: "1. Las grandes regiones trail de la Península",
          subheading: "De los desiertos de yeso a las cumbres alpinas",
          body: [
            "• El Altiplano Turolense y Maestrazgo: Pistas de grava roja interminables, pueblos medievales desiertos y una sensación de aislamiento difícil de igualar.",
            "• Monegros y Bardenas Reales (Navarra/Aragón): Terrenos desérticos de película con cañones de arcilla (atención extrema a la lluvia, que convierte el suelo en una pista de patinaje impenetrable).",
            "• Sierras de Cazorla, Segura y Las Villas (Jaén): Pistas forestales entre pinares gigantescos con pistas de grava compacta ideales para Maxi-Trail.",
            "• Sierra Norte de Guadalajara y Cuenca: Pistas entre robledales y pizarras con desniveles medios y pasos de vados de agua limpia.",
          ],
        },
        {
          id: "clasificacion-dificultad",
          heading: "2. Cómo evaluar la dificultad real de un track GPX",
          subheading: "No te fíes solo del kilometraje total",
          body: [
            "Una etapa de 150 km por pistas rápidas de grava puede completarse en 3 horas sin esfuerzo físico. En cambio, 40 km de una pista pirenaica con piedras escalonadas y roderas profundas de tractor pueden requerir 6 horas de esfuerzo extenuante.",
            "Revisa siempre en el Editor GPX de NavRide:",
            "1. El perfil altimétrico: Desniveles acumulados superiores a 2.000 metros en 100 km indican subidas y bajadas muy pronunciadas.",
            "2. El tipo de vía: Cruza el track con capas de satélite recientes para confirmar si la traza sigue siendo visible o si ha sido invadida por la maleza.",
          ],
        },
        {
          id: "checklist-salida",
          heading: "3. Checklist de verificación antes de arrancar",
          subheading: "El protocolo de seguridad de todo piloto precavido",
          body: [
            "• Cargar el track depurado en NavRide y verificar que los waypoints de inicio y fin son accesibles.",
            "• Descargar los mapas offline de todas las provincias que atraviesa la ruta.",
            "• Comprobar la presión de los neumáticos (en off-road suele bajarse entre 0.3 y 0.5 bar respecto a la presión de asfalto para ganar tracción y amortiguación).",
            "• Llevar agua suficiente (mínimo 2 litros en mochila de hidratación) y barritas energéticas.",
          ],
        },
      ],
      ctaBox: {
        title: "¿Preparando tu próxima expedición por España?",
        description: "Carga tus tracks en el editor de NavRide, organiza tus etapas y viaja con la seguridad de la navegación offline.",
        buttonText: "Explorar Editor de Rutas",
        buttonHref: "/editor-gpx",
        badgeText: "Rutas en España",
      },
    },
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getAllPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostsByCategory(categorySlug: string): BlogPost[] {
  return getAllPosts().filter((p) => p.categorySlug === categorySlug);
}

export function getRelatedPosts(currentSlug: string, limit = 3): BlogPost[] {
  const current = getPostBySlug(currentSlug);
  if (!current) {
    return getAllPosts().filter((p) => p.slug !== currentSlug).slice(0, limit);
  }
  const sameCategory = getAllPosts().filter(
    (p) => p.slug !== currentSlug && p.categorySlug === current.categorySlug
  );
  if (sameCategory.length >= limit) {
    return sameCategory.slice(0, limit);
  }
  const otherPosts = getAllPosts().filter(
    (p) => p.slug !== currentSlug && p.categorySlug !== current.categorySlug
  );
  return [...sameCategory, ...otherPosts].slice(0, limit);
}
