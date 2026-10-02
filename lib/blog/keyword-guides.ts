export type KeywordGuide = {
  slug: string;
  categorySlug: "guias-gpx" | "gps-moto" | "rutas-gpx";
  category: string;
  eyebrow: string;
  title: string;
  description: string;
  date: string;
  updatedDate: string;
  readTime: string;
  keywords: string[];
  intro: string;
  sections: Array<{
    id: string;
    heading: string;
    paragraphs: string[];
    bullets?: string[];
  }>;
  faqs: Array<{ question: string; answer: string }>;
  cta: { title: string; description: string; href: string; label: string };
};

export const KEYWORD_GUIDES: KeywordGuide[] = [
  {
    slug: "convertir-kml-a-gpx",
    categorySlug: "guias-gpx",
    category: "Guías GPX",
    eyebrow: "Conversión de archivos",
    title: "Convertir KML a GPX online: prepara una ruta de Google Earth para tu moto",
    description: "Guía para convertir KML o KMZ a GPX, revisar el trazado y preparar una ruta de Google Earth para navegarla en moto sin perder información importante.",
    date: "2026-09-29",
    updatedDate: "2026-09-29",
    readTime: "6 min de lectura",
    keywords: ["convertir kml a gpx", "convertir kmz a gpx online", "pasar ruta google earth a gpx moto", "kml a gpx online", "ruta google earth para gps moto"],
    intro: "KML es habitual en Google Earth y GPX es el formato más compatible con navegadores y aplicaciones de ruta. Convertir el archivo es sencillo, pero antes de usarlo en una moto conviene comprobar puntos, segmentos, altitud y continuidad para evitar sorpresas durante la salida.",
    sections: [
      {
        id: "diferencias-kml-gpx",
        heading: "KML, KMZ y GPX: qué cambia realmente",
        paragraphs: ["KML describe elementos geográficos como líneas, carpetas y marcadores. KMZ es, normalmente, un KML comprimido con recursos adicionales. GPX está pensado para intercambiar tracks, rutas y waypoints entre dispositivos GPS.", "La conversión no garantiza por sí sola que el resultado sea navegable: una línea dibujada puede atravesar una zona sin camino o perder estilos que solo existían en Google Earth."],
        bullets: ["Track: huella de puntos que conviene seguir sin recalcular.", "Ruta: lista de puntos entre los que una app puede recalcular.", "Waypoint: punto de interés, como una gasolinera o el inicio de una pista."]
      },
      {
        id: "pasos-conversion",
        heading: "Cómo pasar una ruta de Google Earth a GPX",
        paragraphs: ["Exporta la ruta desde Google Earth como KML o KMZ. Abre el archivo en una herramienta compatible, revisa que la línea y los marcadores estén presentes y exporta el resultado como GPX.", "Después carga el GPX en el Editor de NavRide para comprobar visualmente el orden de los puntos, la distancia y los posibles saltos. Conserva siempre una copia del archivo original."],
        bullets: ["Evita nombres duplicados de tracks y waypoints.", "Comprueba que el inicio y el final están en el lugar correcto.", "Divide recorridos muy largos en etapas manejables.", "No des por legal un camino solo porque aparezca en el mapa."]
      },
      {
        id: "errores-conversion",
        heading: "Errores frecuentes al convertir KMZ o KML a GPX",
        paragraphs: ["Los problemas más comunes son líneas fragmentadas, pérdida de marcadores, tracks invertidos y rutas recalculadas por carretera. También puede desaparecer información visual propia del KML, porque GPX no reproduce todos sus estilos.", "Antes de salir, prueba el archivo en el mismo teléfono y aplicación que usarás en la moto y guarda los mapas necesarios para trabajar sin cobertura."]
      }
    ],
    faqs: [
      { question: "¿Se puede convertir KMZ a GPX online?", answer: "Sí. Un KMZ suele contener un KML comprimido. La herramienta debe extraerlo, interpretar sus líneas y exportar tracks o waypoints en GPX. Revisa siempre el resultado antes de navegarlo." },
      { question: "¿Google Maps abre un GPX directamente?", answer: "No ofrece una experiencia nativa completa para seguir tracks GPX off-road. Para rutas de moto y pistas es preferible un visor o navegador diseñado para GPX." },
      { question: "¿La conversión comprueba si el camino es legal?", answer: "No. Convertir formatos solo transforma datos geográficos. La accesibilidad y legalidad deben verificarse con señalización, fuentes oficiales y normativa vigente." }
    ],
    cta: { title: "Revisa el GPX antes de llevarlo a la moto", description: "Abre el resultado en el editor de NavRide, inspecciona el trazado y corrige los segmentos necesarios.", href: "/editor-gpx", label: "Abrir Editor GPX" }
  },
  {
    slug: "visor-gpx-online",
    categorySlug: "guias-gpx",
    category: "Guías GPX",
    eyebrow: "Herramienta cartográfica",
    title: "Visor GPX online: cómo ver un track en el mapa antes de salir",
    description: "Aprende a usar un visor GPX online para revisar un track, sus waypoints, distancia y altitud antes de cargarlo en el navegador de tu moto.",
    date: "2026-09-29",
    updatedDate: "2026-09-29",
    readTime: "5 min de lectura",
    keywords: ["visor gpx online", "ver track gpx en mapa satelite", "abrir gpx online", "ver ruta gpx gratis", "reproductor de rutas gpx"],
    intro: "Un visor GPX online permite comprobar un recorrido sin instalar programas. Es útil para detectar desvíos, puntos aislados y etapas demasiado largas antes de depender del archivo en una zona sin cobertura.",
    sections: [
      {
        id: "que-revisar",
        heading: "Qué debes revisar al abrir un GPX online",
        paragraphs: ["No basta con ver una línea sobre el mapa. Comprueba dónde empieza, dónde termina, si tiene varios segmentos y si los waypoints importantes están incluidos."],
        bullets: ["Distancia total y sentido del recorrido.", "Saltos rectos entre puntos alejados.", "Desvíos involuntarios y bucles de grabación.", "Perfil de elevación y pendientes relevantes.", "Gasolineras, agua y puntos de salida alternativos."]
      },
      {
        id: "mapa-satelite",
        heading: "Ver un track GPX sobre mapa o imagen satelital",
        paragraphs: ["La vista satelital ayuda a entender el entorno, pero una imagen puede estar desactualizada y no confirma el derecho de paso. Contrasta el GPX con cartografía reciente, señalización y avisos oficiales.", "En zonas de montaña, descarga también un mapa offline: el visor web sirve para preparar la salida, pero la navegación no debería depender de la conexión móvil."]
      },
      {
        id: "privacidad-gpx",
        heading: "Privacidad al subir un archivo GPX",
        paragraphs: ["Un GPX grabado puede revelar la ubicación de tu casa, horarios y lugares frecuentes. Recorta el inicio y el final antes de compartirlo públicamente y revisa si la herramienta conserva o procesa el archivo en servidores externos."]
      }
    ],
    faqs: [
      { question: "¿Puedo abrir un GPX sin instalar nada?", answer: "Sí. Un visor GPX online puede representar el track directamente en el navegador. Para navegarlo durante una salida conviene usar una app preparada para GPS y mapas offline." },
      { question: "¿Un visor GPX modifica el archivo?", answer: "Un visor solo debería mostrarlo. Un editor permite además recortar, unir o reorganizar segmentos. Comprueba qué función ofrece cada herramienta antes de guardar." },
      { question: "¿Ver el camino en satélite significa que se puede circular?", answer: "No. La imagen no acredita acceso público ni permiso para vehículos. Verifica restricciones locales y respeta cualquier señal encontrada en ruta." }
    ],
    cta: { title: "Visualiza tu ruta en NavRide", description: "Carga el archivo y comprueba el trazado antes de comenzar la salida.", href: "/editor-gpx", label: "Ver mi GPX" }
  },
  {
    slug: "app-gps-moto-offline",
    categorySlug: "gps-moto",
    category: "GPS para moto",
    eyebrow: "Navegación sin cobertura",
    title: "App GPS para moto offline: qué necesita un navegador off-road",
    description: "Características que debe tener una app GPS para moto offline: mapas sin conexión, seguimiento GPX, interfaz legible, recuperación de ruta y consumo controlado.",
    date: "2026-09-29",
    updatedDate: "2026-09-29",
    readTime: "7 min de lectura",
    keywords: ["app gps moto offline", "mejor navegador gps moto sin conexion", "mapas offline moto trail", "mejor navegador off road", "app rutas gpx moto"],
    intro: "La mejor app GPS para moto offline no es necesariamente la que acumula más menús. En trail importa que el mapa siga disponible, que el track se lea de un vistazo y que un error de cobertura no interrumpa la navegación.",
    sections: [
      {
        id: "funciones-esenciales",
        heading: "Funciones esenciales de un navegador GPS de moto sin conexión",
        paragraphs: ["Para una salida remota necesitas descargar la cartografía antes de arrancar y conservar el posicionamiento GPS aunque no haya datos móviles. El track debe permanecer visible sin que la app lo sustituya silenciosamente por una ruta de carretera."],
        bullets: ["Mapas descargados y verificables antes de salir.", "Importación de tracks GPX y waypoints.", "Alerta clara al separarse del recorrido.", "HUD de alto contraste para sol, polvo y vibraciones.", "Recuperación después de bloquear la pantalla o cambiar de app.", "Consumo razonable de batería y control térmico."]
      },
      {
        id: "preparar-mapas-offline",
        heading: "Cómo preparar mapas offline para una ruta trail",
        paragraphs: ["Descarga una zona más amplia que la línea exacta del track para cubrir desvíos, repostajes y alternativas. Abre el mapa una vez en modo avión para comprobar que realmente está disponible.", "Lleva una copia del GPX y una opción de respaldo. Ninguna aplicación sustituye la planificación, la autonomía de combustible ni la capacidad de regresar por una ruta segura."]
      },
      {
        id: "elegir-app",
        heading: "Cómo elegir la mejor app de rutas GPX para tu moto",
        paragraphs: ["Prueba la interfaz con guantes y bajo luz intensa, comprueba que tu teléfono mantiene el GPS en segundo plano y revisa cómo informa la app cuando faltan mapas o datos viales. Evita decidir solo por capturas promocionales."],
        bullets: ["Para asfalto: prioriza cálculo de curvas y tráfico.", "Para trail: prioriza GPX, mapas offline y lectura rápida.", "Para expedición: añade redundancia, energía y archivos de respaldo."]
      }
    ],
    faqs: [
      { question: "¿El GPS del móvil funciona sin internet?", answer: "Sí. El receptor GPS obtiene la posición por satélite. Lo que suele faltar sin internet es el mapa, por eso debe descargarse previamente." },
      { question: "¿Una app offline recalcula una ruta?", answer: "Depende de si incluye datos de enrutamiento descargados. Para seguir un track GPX, lo importante es que conserve la huella original y muestre con claridad cualquier separación." },
      { question: "¿Qué mapa offline es mejor para moto trail?", answer: "El adecuado es el que cubre tu zona, muestra caminos relevantes y tiene licencia y fecha conocidas. Ningún mapa garantiza por sí solo que una pista sea transitable o legal." }
    ],
    cta: { title: "Conoce la navegación de NavRide", description: "Revisa las funciones enfocadas a GPX, trail y lectura rápida sobre la moto.", href: "/producto", label: "Ver NavRide" }
  },
  {
    slug: "alternativas-wikiloc-moto",
    categorySlug: "gps-moto",
    category: "GPS para moto",
    eyebrow: "Comparativa de aplicaciones",
    title: "Alternativas a Wikiloc para moto: GPX, mapas offline y navegación trail",
    description: "Compara qué buscar en alternativas a Wikiloc para moto cuando necesitas seguir tracks GPX, editar rutas y navegar sin conexión en pistas.",
    date: "2026-09-29",
    updatedDate: "2026-09-29",
    readTime: "7 min de lectura",
    keywords: ["alternativas a wikiloc para moto", "apps para seguir tracks gpx", "visor gpx mejor para moto", "seguir tracks sin conexion", "app rutas trail"],
    intro: "Wikiloc es una referencia para descubrir recorridos, pero no todas las personas buscan lo mismo. En moto trail puede ser más importante editar un GPX, mantener un HUD limpio o trabajar completamente sin cobertura que disponer de un catálogo social enorme.",
    sections: [
      {
        id: "criterios-comparacion",
        heading: "Cómo comparar alternativas a Wikiloc para moto",
        paragraphs: ["Separa el descubrimiento de rutas de la navegación. Una plataforma puede ser excelente para encontrar ideas y otra resultar más adecuada para preparar y seguir el archivo sobre el manillar."],
        bullets: ["Importación y exportación GPX sin bloquear el archivo.", "Mapas offline y funcionamiento en modo avión.", "Legibilidad con guantes y sol directo.", "Edición de segmentos y waypoints desde web o escritorio.", "Avisos al abandonar el track.", "Política de privacidad y control de rutas compartidas."]
      },
      {
        id: "tipos-alternativas",
        heading: "Tres tipos de alternativas: comunidad, cartografía y navegación",
        paragraphs: ["Las plataformas comunitarias destacan al descubrir rutas. Las aplicaciones cartográficas ofrecen muchas capas y configuraciones. Los navegadores especializados reducen la interfaz para seguir un track con menos distracciones.", "La mejor elección puede ser combinar servicios: obtener una ruta de una fuente autorizada, revisarla en un editor GPX y navegarla con una app offline." ]
      },
      {
        id: "seguridad-tracks",
        heading: "Un track popular no siempre está actualizado",
        paragraphs: ["Antes de seguir una ruta descargada revisa su fecha, procedencia y posibles restricciones. Los caminos cambian por obras, incendios, propiedad privada o protección ambiental. La señalización encontrada sobre el terreno prevalece sobre el archivo." ]
      }
    ],
    faqs: [
      { question: "¿Hay alternativas gratuitas a Wikiloc para seguir GPX?", answer: "Existen visores, editores y aplicaciones con modalidades gratuitas. Compara los límites de mapas offline, exportación y navegación antes de depender de ellas en una salida." },
      { question: "¿Puedo descargar un track de una plataforma y abrirlo en otra app?", answer: "Sí, si la plataforma permite exportarlo y tienes permiso para usarlo. GPX es un formato abierto y ampliamente compatible." },
      { question: "¿NavRide sustituye una comunidad de rutas?", answer: "NavRide se centra en preparar, visualizar y navegar GPX. Puede complementar las fuentes donde descubres recorridos, siempre respetando licencias y permisos." }
    ],
    cta: { title: "Prueba una ruta GPX en NavRide", description: "Carga tu propio archivo, revísalo y decide si el flujo encaja con tu forma de viajar.", href: "/editor-gpx", label: "Probar con un GPX" }
  },
  {
    slug: "pantalla-carplay-moto-trail",
    categorySlug: "gps-moto",
    category: "GPS para moto",
    eyebrow: "Pantallas y hardware",
    title: "Pantalla CarPlay para moto trail: Carpuride, Chigee y compatibilidad con apps",
    description: "Qué revisar antes de comprar una pantalla CarPlay o Android Auto para moto: brillo, agua, alimentación, control, compatibilidad y uso off-road.",
    date: "2026-09-29",
    updatedDate: "2026-09-29",
    readTime: "8 min de lectura",
    keywords: ["pantalla carplay moto trail", "carpuride w502 moto opiniones", "chigee aio 5 opiniones offroad", "android auto moto trail", "carplay para moto"],
    intro: "Las pantallas para moto con CarPlay o Android Auto mantienen el teléfono protegido y ofrecen una interfaz grande en el manillar. Para trail, sin embargo, no basta con que el producto anuncie compatibilidad: la app, el sistema de proyección y el hardware deben funcionar juntos.",
    sections: [
      {
        id: "que-comprobar",
        heading: "Qué comprobar en una pantalla CarPlay para moto",
        paragraphs: ["Revisa el brillo real, la respuesta con guantes, la resistencia al agua, el sistema de anclaje y la alimentación. En pistas, las vibraciones y los conectores importan tanto como la resolución."],
        bullets: ["Pantalla visible bajo sol directo.", "Protección frente a lluvia, polvo y lavado.", "Soporte rígido con tornillería segura.", "Arranque automático después de cortar contacto.", "Audio compatible con el intercomunicador.", "Actualizaciones y soporte del fabricante."]
      },
      {
        id: "carpuride-chigee",
        heading: "Carpuride W502 y Chigee AIO-5: diferencias que debes validar",
        paragraphs: ["Modelos como Carpuride W502 y Chigee AIO-5 compiten con tamaños, accesorios y funciones distintas. Las especificaciones pueden cambiar por versión y mercado, así que confirma en la ficha oficial el brillo, cámaras, sensores y compatibilidad antes de comprar.", "Las opiniones de otros usuarios son útiles para conocer vibraciones o reflejos, pero comprueba que hablan exactamente del mismo modelo y revisión de hardware." ]
      },
      {
        id: "compatibilidad-apps",
        heading: "CarPlay, Android Auto y las apps de navegación GPX",
        paragraphs: ["Que una app funcione en el teléfono no significa que tenga interfaz para CarPlay o Android Auto. Estos sistemas limitan las categorías y controles disponibles por seguridad.", "Si vas a utilizar NavRide u otra app GPX, confirma la compatibilidad publicada para tu plataforma. Como alternativa, un móvil rugerizado dedicado puede ejecutar la interfaz completa directamente." ]
      }
    ],
    faqs: [
      { question: "¿Todas las apps Android funcionan en una pantalla CarPlay para moto?", answer: "No. CarPlay y Android Auto solo muestran aplicaciones y funciones admitidas por cada plataforma. Una pantalla que duplica imagen tampoco equivale siempre a compatibilidad nativa." },
      { question: "¿Carpuride W502 sirve para off-road?", answer: "Puede utilizarse en moto, pero la idoneidad off-road depende del montaje, la alimentación, el sellado y las vibraciones de tu modelo concreto. Revisa especificaciones y garantía actuales." },
      { question: "¿Es mejor una pantalla o un móvil rugerizado?", answer: "La pantalla protege el teléfono principal y simplifica la integración; el móvil rugerizado ofrece acceso completo a las apps. La elección depende de compatibilidad, presupuesto y tipo de ruta." }
    ],
    cta: { title: "Comprueba el ecosistema de NavRide", description: "Consulta las funciones actuales de la app antes de elegir el hardware de navegación.", href: "/funciones", label: "Ver funciones" }
  },
  {
    slug: "rutas-moto-trail-espana",
    categorySlug: "rutas-gpx",
    category: "Rutas GPX",
    eyebrow: "Planificación de rutas",
    title: "Rutas en moto trail por España: cómo encontrar y revisar tracks GPX",
    description: "Guía para buscar rutas de moto trail en España, evaluar tracks GPX y preparar salidas por Madrid, Cataluña, Pirineos, TET o ACT con criterios responsables.",
    date: "2026-09-29",
    updatedDate: "2026-09-29",
    readTime: "9 min de lectura",
    keywords: ["rutas moto trail españa", "rutas gpx moto", "rutas trail faciles madrid", "rutas offroad cataluña gpx", "act españa gpx", "trans euro trail españa gpx", "transpirenaica en moto offroad gpx"],
    intro: "España reúne pistas secas, montaña húmeda, altiplanos y enlaces de carretera en distancias relativamente cortas. Esa variedad hace atractivo el trail, pero también obliga a revisar la procedencia, dificultad y legalidad de cada track GPX antes de salir.",
    sections: [
      {
        id: "elegir-ruta",
        heading: "Cómo elegir una ruta GPX de moto acorde a tu nivel",
        paragraphs: ["La distancia no mide por sí sola la dificultad. Valora el firme, desnivel, climatología, peso de la moto, autonomía y posibilidades de abandonar la ruta."],
        bullets: ["Iniciación: pistas anchas, secas y con salidas frecuentes a carretera.", "Nivel medio: piedra suelta, barro moderado y etapas más remotas.", "Avanzado: desnivel, pasos técnicos y menor margen de recuperación.", "Evita estrenar moto, neumáticos y navegación en una ruta aislada."]
      },
      {
        id: "zonas-busquedas",
        heading: "Madrid, Cataluña, Pirineos, TET y ACT: búsquedas que requieren contexto",
        paragraphs: ["Las búsquedas de rutas trail fáciles en Madrid o rutas off-road en Cataluña pueden devolver tracks antiguos. En espacios con normativa cambiante, consulta fuentes locales y verifica cada acceso.", "Para TET España descarga el track desde la fuente oficial del proyecto. Para ACT, Transpirenaica y otras travesías, respeta las condiciones de licencia y no presentes como oficial un archivo modificado por terceros." ]
      },
      {
        id: "revisar-track",
        heading: "Checklist antes de cargar el track en la moto",
        paragraphs: ["Abre el GPX en un visor o editor, divide jornadas demasiado largas y marca combustible y salidas alternativas. Comprueba de nuevo el archivo en modo avión."],
        bullets: ["Fecha y autoría del track.", "Restricciones estacionales e incendios.", "Zonas protegidas y propiedades privadas.", "Meteorología y estado reciente de pistas.", "Cobertura de mapas offline y batería.", "Plan alternativo y contacto de emergencia."]
      },
      {
        id: "uso-responsable",
        heading: "Circular de forma responsable",
        paragraphs: ["Un GPX no concede permiso de paso. Reduce velocidad cerca de personas, animales y viviendas; evita grupos numerosos; no abandones la traza; y obedece cierres y señalización aunque el track continúe.", "NavRide ayuda a visualizar y preparar archivos, pero no certifica que un tramo sea legal, transitable o seguro." ]
      }
    ],
    faqs: [
      { question: "¿Dónde descargar rutas GPX para moto en España?", answer: "Usa fuentes oficiales de proyectos, organizadores autorizados o comunidades con información reciente. Verifica licencia, fecha, restricciones y señalización antes de circular." },
      { question: "¿Qué hace que una ruta trail sea fácil?", answer: "Pistas anchas, firme estable, poco desnivel, longitud moderada, cobertura de salidas y ausencia de pasos técnicos. La lluvia puede cambiar por completo la dificultad." },
      { question: "¿Un track del TET o de la Transpirenaica siempre está abierto?", answer: "No. Puede haber cambios temporales o permanentes. Descarga versiones actuales y respeta cierres, avisos oficiales y señales sobre el terreno." }
    ],
    cta: { title: "Prepara tu próxima ruta GPX", description: "Visualiza el archivo, organiza las etapas y revisa los puntos importantes antes de arrancar.", href: "/editor-gpx", label: "Planificar en el Editor GPX" }
  }
];

export function getAllKeywordGuides(): KeywordGuide[] {
  return [...KEYWORD_GUIDES].sort((a, b) => b.date.localeCompare(a.date));
}

export function getKeywordGuide(categorySlug: string, slug: string): KeywordGuide | undefined {
  return KEYWORD_GUIDES.find((guide) => guide.categorySlug === categorySlug && guide.slug === slug);
}
