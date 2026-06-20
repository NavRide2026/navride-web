// lib/core/theme/navride_colors.dart
//
// Paleta oficial NavRide.
//
// Arquitectura visual producción:
//   • OEM premium dark UI
//   • Alto contraste outdoor
//   • Compatible sol directo / moto / coche
//   • Preparado para Rally Mode
//   • Colores centralizados
//   • Sin hardcodes repartidos por la app
//

import 'package:flutter/material.dart';

/// Paleta centralizada de NavRide.
///
/// REGLA:
/// Todos los colores visuales deben salir de aquí.
///
/// Evita:
///   • inconsistencias
///   • hardcodes
///   • duplicados
///   • tonos distintos entre pantallas
abstract final class NavRideColors {
  // ─────────────────────────────────────
  // BRAND
  // ─────────────────────────────────────

  /// Verde navegación OEM.
  static const Color navGreen = Color(0xFF35C759);

  /// CTA principal.
  static const Color ctaOrange = Color(0xFFFF5A1F);

  /// Azul navegación / tracking.
  static const Color navBlue = Color(0xFF007AFF);

  // ─────────────────────────────────────
  // RALLY COLORS
  // ─────────────────────────────────────

  /// Acción segura / fluida.
  static const Color rallySafe = Color(0xFFFFFFFF);

  /// Atención.
  static const Color rallyAttention = Color(0xFFFFD60A);

  /// Precaución.
  static const Color rallyWarning = Color(0xFFFF9500);

  /// Peligro / curva muy cerrada.
  static const Color rallyDanger = Color(0xFFFF3B30);

  // Compat legacy
  static const Color warningYellow = rallyAttention;

  static const Color alertOrange = rallyWarning;

  static const Color dangerRed = rallyDanger;

  static const Color accentYellow = rallyAttention;

  // ─────────────────────────────────────
  // SURFACES
  // ─────────────────────────────────────

  /// Fondo absoluto principal.
  static const Color primaryBackground = Color(0xFF000000);

  /// Fondo navegación.
  static const Color navigationBackground = Color(0xFF050608);

  /// Surface oscura OEM.
  static const Color surfaceDark = Color(0xFF1C1C1E);

  /// Surface paneles HUD.
  static const Color surfaceDarkSecondary = Color(0xFF101114);

  /// Cards.
  static const Color surfaceCard = Color(0xFF2C2C2E);

  /// Cards glass.
  static const Color surfaceCardGlass = Color(0xCC1C1C1E);

  /// Surface blur fuerte.
  static const Color surfaceDarkGlass = Color(0xE61C1C1E);

  /// Panel background compat.
  static const Color panelBackground = surfaceDark;

  // ─────────────────────────────────────
  // BORDERS
  // ─────────────────────────────────────

  static const Color borderGlass = Color(0x40FFFFFF);

  static const Color borderStrong = Color(0x66FFFFFF);

  static const Color divider = Color(0x1FFFFFFF);

  // ─────────────────────────────────────
  // TEXT
  // ─────────────────────────────────────

  static const Color textPrimary = Colors.white;

  static const Color textSecondary = Color(0xB3FFFFFF);

  static const Color textMuted = Color(0x80FFFFFF);

  static const Color textDisabled = Color(0x4DFFFFFF);

  // ─────────────────────────────────────
  // MAP OVERLAYS
  // ─────────────────────────────────────

  static const Color mapShadowTop = Color(0x38000000);

  static const Color mapShadowBottom = Color(0x59000000);

  static const Color mapOverlaySoft = Color(0x14000000);

  // ─────────────────────────────────────
  // GPS / SIGNAL
  // ─────────────────────────────────────

  static const Color gpsExcellent = navGreen;

  static const Color gpsMedium = rallyAttention;

  static const Color gpsPoor = rallyWarning;

  static const Color gpsLost = rallyDanger;

  // ─────────────────────────────────────
  // SPEED / OVERSPEED
  // ─────────────────────────────────────

  static const Color speedNormal = Colors.white;

  static const Color speedWarning = rallyWarning;

  static const Color speedDanger = rallyDanger;

  // ─────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────

  static Color withOpacity(
    Color color,
    double opacity,
  ) {
    return color.withValues(alpha: opacity);
  }
}
