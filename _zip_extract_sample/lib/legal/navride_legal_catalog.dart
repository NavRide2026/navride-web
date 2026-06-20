// lib/legal/navride_legal_catalog.dart
//
// Fuente única de verdad: titular legal, planes, precios y URLs públicas.
// Documentos legales y UI premium deben consumir exclusivamente este catálogo.

import '../core/constants/app_constants.dart';

/// Metadatos legales y comerciales NavRide — alineados con [PremiumRepository]
/// y Google Play Billing (`navride_adventure_monthly`).
abstract final class NavRideLegalCatalog {
  NavRideLegalCatalog._();

  static const String lastUpdated = '2026-05-30';

  static const String legalVersion = '1.0.0-oem';

  // ─── Responsable (LSSI / RGPD art. 13) ───────────────────────────────

  static const String holderName = 'Daniel Montero Mora';

  static const String holderTaxId = '47704767F';

  static const String holderAddress =
      'Carrer de Can Mollet, 5, 08100 Mollet del Vallès, Barcelona, España';

  static const String supportEmail = 'navride@outlook.com';

  static const String appName = 'NavRide';

  /// URL pública para Google Play Console — desplegada vía GitHub Pages
  /// (`.github/workflows/deploy-legal-pages.yml` desde `assets/legal/privacy_policy.html`).
  /// Dominio custom `navride.app` puede apuntar aquí cuando DNS esté operativo.
  static const String privacyPolicyPublicUrl =
      'https://web-navride.vercel.app/legal/politica-privacidad';

  // ─── Planes (nombres y límites = PremiumRepository / AppConstants) ───

  static const String planFreeName = 'Free';

  static const String planRiderName = 'Rider';

  static const String planPilotName = 'Pilot';

  /// Nombre comercial de la suscripción en Google Play.
  static const String subscriptionProductName = 'NavRide Adventure';

  static const String subscriptionSku = 'navride_adventure_monthly';

  static const int trialDays = AppConstants.freeTrialDays;

  static const int freeRecordingMaxMinutes = AppConstants.freeRecordingMaxMinutes;

  static const int riderMaxTracksPerMonth = AppConstants.riderMaxTracksPerMonth;

  static const double riderMaxTrackKm = AppConstants.riderMaxTrackKm;

  static const int riderMaxRallyHoursPerMonth = AppConstants.riderMaxRallyHoursPerMonth;

  /// Precio mensual suscripción Pilot vía Google Play (referencia UI/legal).
  static double get pilotSubscriptionPriceEur => AppConstants.pilotPrice;

  /// Precio referencia plan Rider (no vendido en la app actualmente).
  static const double riderReferencePriceEur = AppConstants.riderPrice;

  static String get pilotSubscriptionPriceLabel =>
      '${_formatEur(pilotSubscriptionPriceEur)} / mes';

  static String get riderReferencePriceLabel => '${_formatEur(riderReferencePriceEur)} / mes';

  static String get freePlanSummary =>
      'Prueba gratuita de $trialDays días de navegación GPX online. '
      'Al finalizar, la navegación requiere suscripción $planPilotName '
      'o plan compatible.';

  // ─── User guidance (Help, Welcome, Premium — P0 OEM) ───────────────

  static String get trialWelcomeNote =>
      'Al pulsar Empezar activas una prueba gratuita de $trialDays días '
      'con navegación GPX online. Cuando termine, necesitarás suscripción '
      '$planPilotName o un plan compatible para seguir navegando.';

  static String trialActiveLabel(DateTime endsAt) {
    final remaining = endsAt.difference(DateTime.now());
    if (remaining.isNegative) return trialExpiredLabel;
    final days = remaining.inDays;
    if (days >= 1) return 'Trial activo · $days d restantes';
    final hours = remaining.inHours.clamp(0, 47);
    return 'Trial activo · finaliza en $hours h';
  }

  static const String trialExpiredLabel =
      'Trial finalizado · activa Pilot para navegar';

  static String trialExplainerBody({
    required bool hasStartedTrial,
    required bool isTrialActive,
    required bool isTrialExpired,
    DateTime? trialEndsAt,
  }) {
    if (!hasStartedTrial) {
      return 'Al usar NavRide por primera vez obtienes $trialDays días de '
          'navegación GPX online sin coste. No se requiere tarjeta. Al terminar, '
          'activa $planPilotName para continuar navegando.';
    }
    if (isTrialActive && trialEndsAt != null) {
      return '${trialActiveLabel(trialEndsAt)}. Cuando finalice el trial, '
          'la navegación GPX requerirá suscripción $planPilotName o plan '
          '$planRiderName.';
    }
    if (isTrialExpired) {
      return 'Tu prueba gratuita ha finalizado. Activa $subscriptionProductName '
          'o un plan compatible para volver a navegar.';
    }
    return trialWelcomeNote;
  }

  static String get offlineDrawerSubtitleFree =>
      'Requiere Rider o Pilot · Prep corredor solo Pilot';

  static String get offlineDrawerSubtitleRider =>
      'Puedes añadir .mbtiles · Prep corredor solo Pilot';

  static String get offlineDrawerSubtitlePilot =>
      'Mapas .mbtiles y preparación offline de rutas';

  static String get offlineHelpText =>
      '$planPilotName: mapas offline (.mbtiles) y preparación de corredor '
      'para navegar sin red. $planRiderName: navegación GPX online; puede usar '
      '.mbtiles ya instalados, sin preparar corredor offline. $planFreeName: '
      'durante el trial, navegación online.';

  static String get approachVsNavigationHelp =>
      'Approach (ir hacia el track): calcula una ruta online hasta el inicio '
      'del GPX. Navegación GPX: sigue el track importado punto a punto; '
      'requiere plan activo tras el trial.';

  static String get rallyHelpShort =>
      'Modo Rally muestra el siguiente TRAMO con color según dificultad. '
      'Requiere plan $planPilotName (o $planRiderName con horas disponibles). '
      'Actívalo en el mapa con el botón Rally.';

  static String get aboutAppDescription =>
      'Navegación offroad con mapas online, tracks GPX, HUD y avisos por voz. '
      'Mapas y rutas offline disponibles con plan $planPilotName. '
      'Diseñada para uso en campo.';

  static String get welcomeGuideWhatIsNavRide =>
      '$appName es navegación offroad orientada a moto y trail: importas un '
      'track GPX, lo sigues en el mapa con HUD y puedes alternar al modo Rally '
      'para leer el tramo siguiente por dificultad.';

  static String get welcomeGuideGpx =>
      'Un GPX es un archivo con el trazado de una ruta (puntos GPS). '
      'Puedes importarlo desde el menú lateral o compartir un .gpx desde '
      'otra app con «Abrir con NavRide».';

  static String get welcomeGuideNavigate =>
      'Menú → Importar GPX → el track se dibuja en el mapa. Pulsa '
      '«Iniciar navegación» para elegir approach (hasta el inicio del track, '
      'requiere red) o navegación GPX directa. Durante la ruta usa el botón '
      'detener en la barra superior.';

  static String get welcomeGuideOffline =>
      'NavRide ofrece dos formas de mapas sin red: (1) importar archivos '
      '.mbtiles en Mapas offline; (2) con plan $planPilotName, preparar el '
      'corredor de una ruta favorita para cachear tiles a lo largo del track. '
      'La navegación online sigue disponible con conexión en todos los planes '
      'compatibles.';

  static String get welcomeGuidePlans =>
      '$planFreeName: trial de $trialDays días con navegación online. '
      '$planRiderName: navegación GPX online y rally limitado. '
      '$planPilotName ($subscriptionProductName): rally completo, preparación '
      'offline de corredor y mapas .mbtiles. Detalle en Premium.';

  static String get welcomeGuideBetaFeedback =>
      'Estás en beta cerrada. Si algo falla, anota la ruta, el momento y '
      'captura de pantalla. Contacta al equipo beta con la versión instalada '
      '($appName 0.9.0 beta) y el modelo de tu dispositivo.';

  static String get offlineMapsSheetIntro =>
      'NavRide sí tiene mapas offline — de dos maneras: importa zonas .mbtiles '
      'para cubrir una región, o con plan $planPilotName prepara el corredor '
      'de una ruta favorita (Rutas guardadas → Favoritos → Preparar offline). '
      'Los tiles del corredor se reutilizan al navegar sin red en esa ruta.';

  static String get recordingVoiceOnlyHelp =>
      'La grabación de rutas por voz estará disponible en una fase futura. '
      'En esta beta importa un GPX existente para navegar.';

  static String get riderPlanSummary =>
      '${riderReferencePriceLabel} · hasta $riderMaxTracksPerMonth tracks/mes '
      '(máx. ${riderMaxTrackKm.toInt()} km c/u), rally hasta '
      '$riderMaxRallyHoursPerMonth h/mes.';

  /// Texto breve para consentimiento boot (P0 L-04).
  static String get bootConsentGpsNotice =>
      '$appName utiliza GPS para navegación. La precisión puede variar según '
      'cobertura, túneles y hardware. Eres responsable de tu conducción: la app '
      'es una ayuda y no sustituye las señales de tráfico ni tu criterio.';

  /// Resumen suscripción en consentimiento inicial (OMEGA-L-04).
  static String get bootConsentSubscriptionNotice =>
      'Prueba gratuita de $trialDays días. Después, la navegación requiere la '
      'suscripción $subscriptionProductName ($pilotSubscriptionPriceLabel) vía '
      'Google Play, con renovación automática hasta cancelación en Play Store.';

  /// Resumen eliminación datos en consentimiento inicial (OMEGA-L-04).
  static String get bootConsentDataNotice =>
      'Tus rutas y preferencias se almacenan en el dispositivo. Puedes exportar '
      'o eliminar tus datos en Ajustes → Datos.';

  /// P1 Q-003 — Política OSRM Release Candidate.
  static const String osrmNetworkPolicyRc =
      'Enrutado OSRM (approach y adherencia GPX) solo se activa si la compilación '
      'incluye NAVRIDE_ONLINE=true. En RC/Release por defecto no se envían '
      'coordenadas a servidores OSRM externos. Servidor público de referencia: '
      'router.project-osrm.org (Open Source Routing Machine).';

  /// P1 F-04 — Limitación perfil driving en adherencia GPX.
  static const String gpxDrivingAdherenceLimitation =
      'La adherencia automática de GPX usa el perfil «driving» de OSRM (red '
      'viaria para vehículos). En trails, huellas forestales o senderos offroad '
      'la geometría puede no ajustarse a la vía real.';

  static const String gpxDrivingAdherenceShort =
      'Adherencia vía carretera (perfil driving)';

  static String get pilotPlanSummary =>
      '${pilotSubscriptionPriceLabel} · desbloqueo total: navegación, rally, '
      'mapas offline y herramientas GPX. Suscripción $subscriptionProductName '
      'en Google Play.';

  // ─── Google Play Billing (texto paywall) ─────────────────────────────

  static const String playBillingDisclosure =
      'La suscripción $subscriptionProductName se renueva automáticamente cada mes '
      'al precio indicado en Google Play hasta que la canceles. '
      'Puedes gestionar o cancelar la suscripción en cualquier momento desde '
      'Google Play → Pagos y suscripciones → Suscripciones. '
      'El acceso Pilot se mantiene hasta el final del periodo ya pagado. '
      'Los pagos los procesa Google; NavRide no almacena datos de tarjeta.';

  static String _formatEur(double value) {
    final whole = value.truncate();
    final cents = ((value - whole) * 100).round();
    return '$whole,${cents.toString().padLeft(2, '0')} €';
  }
}
