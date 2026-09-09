/**
 * NavRide Route Compatibility Check — reglas puras (sin UI).
 * Misma semántica que `app/lib/gpx/editor/route_compatibility.dart`.
 *
 * No trata UNKNOWN como permitido.
 * Superficie ≠ permiso de acceso.
 */

import type { TransportMode } from "./routing.ts";

export type CompatibilityClass =
  | "COMPATIBLE"
  | "WARNING"
  | "RESTRICTED"
  | "INCOMPATIBLE"
  | "UNKNOWN";

export type CompatibilitySeverity =
  | "PROHIBITION"
  | "RESTRICTION"
  | "ADVISORY"
  | "UNKNOWN";

export type WayTags = Record<string, string>;

export type CompatibilityResult = {
  cls: CompatibilityClass;
  severity: CompatibilitySeverity;
  mode: TransportMode;
  reason: string;
  wayTypeLabel: string;
  surfaceLabel: string;
  accessLabel: string;
  /** Explicit OSM restriction, not inferred from surface. */
  explicitRestriction: boolean;
  permits: {
    moto: string;
    car: string;
    bike: string;
    walk: string;
  };
};

const DENY = new Set([
  "no",
  "military",
  "discouraged",
  "emergency",
]);
const PRIVATE = new Set(["private", "permit"]);
const CONDITIONAL = new Set([
  "destination",
  "customers",
  "agricultural",
  "forestry",
  "delivery",
]);
const ALLOW = new Set([
  "yes",
  "designated",
  "permissive",
]);

function t(tags: WayTags, key: string): string {
  return String(tags[key] ?? "").trim().toLowerCase();
}

function firstTag(tags: WayTags, keys: string[]): string {
  for (const k of keys) {
    const v = t(tags, k);
    if (v) return v;
  }
  return "";
}

function interpretAccess(raw: string): "deny" | "private" | "conditional" | "allow" | "none" {
  if (!raw) return "none";
  if (PRIVATE.has(raw)) return "private";
  if (DENY.has(raw)) return "deny";
  if (CONDITIONAL.has(raw)) return "conditional";
  if (ALLOW.has(raw)) return "allow";
  return "none";
}

function motorKeys(mode: TransportMode): string[] {
  if (mode === "moto") {
    return ["motorcycle", "access:motorcycle", "motor_vehicle", "vehicle", "access"];
  }
  if (mode === "car") {
    return ["motorcar", "motor_vehicle", "vehicle", "access"];
  }
  if (mode === "bike") return ["bicycle", "vehicle", "access"];
  return ["foot", "access"];
}

export function highwayTypeLabel(highway: string): string {
  return (
    {
      motorway: "Autopista",
      trunk: "Vía rápida",
      primary: "Carretera principal",
      secondary: "Carretera secundaria",
      tertiary: "Carretera local",
      unclassified: "Vía rural",
      residential: "Calle",
      living_street: "Calle residencial",
      service: "Vía de servicio",
      track: "Pista",
      path: "Sendero",
      footway: "Vía peatonal",
      pedestrian: "Zona peatonal",
      cycleway: "Carril bici",
      bridleway: "Camino de herradura",
      steps: "Escaleras",
      construction: "En obras",
    }[highway] ?? (highway ? highway : "Vía")
  );
}

export function surfaceLabelOf(surface: string): string {
  return (
    {
      asphalt: "Asfalto",
      paved: "Pavimentada",
      concrete: "Hormigón",
      gravel: "Grava",
      fine_gravel: "Grava fina",
      compacted: "Compactada",
      dirt: "Tierra",
      ground: "Tierra",
      earth: "Tierra",
      unpaved: "Sin pavimentar",
      grass: "Hierba",
      sand: "Arena",
      mud: "Barro",
      pebblestone: "Guijarros",
      sett: "Adoquín",
      paving_stones: "Losas",
    }[surface] ?? (surface ? surface : "—")
  );
}

function accessLabelOf(raw: string): string {
  if (!raw) return "Sin dato";
  if (raw === "yes" || raw === "permissive" || raw === "designated") return "Público";
  if (raw === "private" || raw === "permit") return "Privado";
  if (raw === "no") return "Prohibido";
  if (raw === "destination" || raw === "customers") return "Acceso limitado";
  if (raw === "agricultural" || raw === "forestry") return "Uso agrario / forestal";
  return raw;
}

function permitWord(raw: string, implied: "permitido" | "no" | "sin dato"): string {
  const a = interpretAccess(raw);
  if (a === "allow") return "Permitido";
  if (a === "private") return "Privado";
  if (a === "deny") return "No permitido";
  if (a === "conditional") return "Condicionado";
  if (implied === "permitido") return "Permitido";
  if (implied === "no") return "No permitido";
  return "Sin dato";
}

export function modeLabelEs(mode: TransportMode): string {
  return { walk: "Caminar", bike: "Bici", moto: "Moto", car: "Coche" }[mode];
}

export function modeNounEs(mode: TransportMode): string {
  return {
    walk: "peatones",
    bike: "bicicletas",
    moto: "motocicletas",
    car: "coches",
  }[mode];
}

function result(
  cls: CompatibilityClass,
  mode: TransportMode,
  tags: WayTags,
  reason: string,
  explicit: boolean,
): CompatibilityResult {
  const hw = t(tags, "highway");
  const surface = t(tags, "surface");
  const access = firstTag(tags, ["access"]);
  const severity: CompatibilitySeverity =
    cls === "INCOMPATIBLE"
      ? "PROHIBITION"
      : cls === "RESTRICTED"
        ? "RESTRICTION"
        : cls === "WARNING"
          ? "ADVISORY"
          : cls === "UNKNOWN"
            ? "UNKNOWN"
            : "ADVISORY";
  return {
    cls,
    severity: cls === "COMPATIBLE" ? "ADVISORY" : severity,
    mode,
    reason,
    wayTypeLabel: highwayTypeLabel(hw),
    surfaceLabel: surfaceLabelOf(surface),
    accessLabel: accessLabelOf(access),
    explicitRestriction: explicit,
    permits: {
      moto: permitWord(
        firstTag(tags, ["motorcycle", "motor_vehicle", "vehicle", "access"]),
        motorImplied(tags, "moto"),
      ),
      car: permitWord(
        firstTag(tags, ["motorcar", "motor_vehicle", "vehicle", "access"]),
        motorImplied(tags, "car"),
      ),
      bike: permitWord(firstTag(tags, ["bicycle", "vehicle", "access"]), bikeImplied(tags)),
      walk: permitWord(firstTag(tags, ["foot", "access"]), walkImplied(tags)),
    },
  };
}

function motorImplied(tags: WayTags, mode: "moto" | "car"): "permitido" | "no" | "sin dato" {
  const hw = t(tags, "highway");
  if (
    hw === "footway" ||
    hw === "pedestrian" ||
    hw === "cycleway" ||
    hw === "steps" ||
    hw === "path" ||
    hw === "bridleway"
  ) {
    return "no";
  }
  if (hw === "track" || hw === "unclassified" || hw === "residential" || hw === "service") {
    return "permitido";
  }
  if (!hw) return "sin dato";
  return "permitido";
}

function bikeImplied(tags: WayTags): "permitido" | "no" | "sin dato" {
  const hw = t(tags, "highway");
  if (hw === "motorway" || hw === "motorway_link" || hw === "steps") return "no";
  if (!hw) return "sin dato";
  return "permitido";
}

function walkImplied(tags: WayTags): "permitido" | "no" | "sin dato" {
  const hw = t(tags, "highway");
  if (hw === "motorway" || hw === "motorway_link") return "no";
  if (!hw) return "sin dato";
  return "permitido";
}

/**
 * Clasifica un way OSM para un perfil. No usa geometría.
 */
export function classifyWay(tags: WayTags, mode: TransportMode): CompatibilityResult {
  const hw = t(tags, "highway");
  const construction = t(tags, "construction") || (hw === "construction" ? "yes" : "");
  const footway = t(tags, "footway");

  if (construction && construction !== "no") {
    return result(
      "INCOMPATIBLE",
      mode,
      tags,
      "Según la información cartográfica disponible, esta vía está en obras o cerrada.",
      true,
    );
  }

  const chain = motorKeys(mode);
  const explicit = firstTag(tags, chain);
  const accessKind = interpretAccess(explicit);

  if (accessKind === "deny") {
    return result(
      "INCOMPATIBLE",
      mode,
      tags,
      denyReason(mode, explicit, chain[0]),
      true,
    );
  }
  if (accessKind === "private") {
    return result(
      "RESTRICTED",
      mode,
      tags,
      "⚠ Acceso privado. Según la cartografía, no es una vía pública. Mantener el tramo solo si tienes autorización.",
      true,
    );
  }
  if (accessKind === "conditional") {
    return result(
      "RESTRICTED",
      mode,
      tags,
      "Acceso condicionado. Según la cartografía, el paso puede depender de permiso, destino o uso específico.",
      true,
    );
  }

  if (hw === "steps") {
    if (mode === "walk") {
      return result(
        "WARNING",
        mode,
        tags,
        "Según la cartografía, este tramo son escaleras.",
        true,
      );
    }
    return result(
      "INCOMPATIBLE",
      mode,
      tags,
      "Según la información cartográfica disponible, este tramo son escaleras. No es válido para " +
        modeLabelEs(mode) +
        ".",
      true,
    );
  }

  if (hw === "cycleway" && (mode === "moto" || mode === "car")) {
    if (accessKind === "allow") {
      return result("WARNING", mode, tags, "Carril bici con permiso excepcional para este modo.", false);
    }
    return result(
      "INCOMPATIBLE",
      mode,
      tags,
      "Según la información cartográfica disponible, es una vía exclusivamente ciclista. Acceso de vehículos a motor no permitido.",
      false,
    );
  }

  if ((hw === "footway" || hw === "pedestrian") && (mode === "moto" || mode === "car")) {
    if (accessKind === "allow") {
      return result("WARNING", mode, tags, "Vía peatonal con permiso excepcional para este modo.", false);
    }
    return result(
      "INCOMPATIBLE",
      mode,
      tags,
      "Según la información cartográfica disponible, es un sendero o vía peatonal. Acceso de vehículos a motor no permitido.",
      false,
    );
  }

  if (hw === "bridleway" && (mode === "moto" || mode === "car")) {
    return result(
      "INCOMPATIBLE",
      mode,
      tags,
      "Según la cartografía, es un camino de herradura. Acceso de vehículos a motor no permitido.",
      false,
    );
  }

  if (hw === "path" && (mode === "moto" || mode === "car")) {
    if (accessKind === "allow") {
      return surfaceWarningOrOk(mode, tags, "Sendero con acceso de vehículos indicado.");
    }
    return result(
      "INCOMPATIBLE",
      mode,
      tags,
      "Según la información cartográfica disponible, es un sendero. Acceso de vehículos a motor no permitido.",
      false,
    );
  }

  if (
    (hw === "corridor" || hw === "platform" || hw === "elevator") &&
    (mode === "moto" || mode === "car")
  ) {
    return result(
      "INCOMPATIBLE",
      mode,
      tags,
      "Según la cartografía, este tramo es peatonal (pasillo, andén o similar). Acceso de vehículos a motor no permitido.",
      false,
    );
  }

  if (t(tags, "motorroad") === "yes" && (mode === "walk" || mode === "bike")) {
    return result(
      "INCOMPATIBLE",
      mode,
      tags,
      "Según la cartografía, es una vía exclusiva para vehículos a motor.",
      true,
    );
  }

  if ((hw === "motorway" || hw === "motorway_link") && (mode === "walk" || mode === "bike")) {
    if (accessKind === "allow") {
      return result("WARNING", mode, tags, "Autopista con permiso excepcional para este modo.", false);
    }
    return result(
      "INCOMPATIBLE",
      mode,
      tags,
      "Según la cartografía, las autopistas no son válidas para " + modeLabelEs(mode) + ".",
      false,
    );
  }

  if (footway === "steps" && mode !== "walk") {
    return result(
      "INCOMPATIBLE",
      mode,
      tags,
      "Según la cartografía, este tramo incluye escaleras.",
      true,
    );
  }

  if (!hw) {
    return result(
      "UNKNOWN",
      mode,
      tags,
      "Según la información cartográfica disponible, no hay tipo de vía suficiente para determinarlo.",
      false,
    );
  }

  // Superficie nunca prohíbe por sí sola.
  return surfaceWarningOrOk(mode, tags, "");
}

function denyReason(mode: TransportMode, value: string, key: string): string {
  if (mode === "moto" || mode === "car") {
    return "Vehículos a motor no permitidos según los datos cartográficos disponibles.";
  }
  if (mode === "bike") {
    return "Según la cartografía, el acceso en bicicleta no está permitido.";
  }
  return "Según la cartografía, el acceso peatonal no está permitido.";
}

function surfaceWarningOrOk(
  mode: TransportMode,
  tags: WayTags,
  prefix: string,
): CompatibilityResult {
  const surface = t(tags, "surface");
  const tracktype = t(tags, "tracktype");
  const rough =
    surface === "sand" ||
    surface === "mud" ||
    surface === "scree" ||
    tracktype === "grade5";
  if (rough && (mode === "moto" || mode === "car")) {
    return result(
      "WARNING",
      mode,
      tags,
      (prefix ? prefix + " " : "") +
        "La superficie puede ser exigente (" +
        surfaceLabelOf(surface || tracktype) +
        "). El acceso no está prohibido por ese motivo.",
      false,
    );
  }
  const oneway = t(tags, "oneway");
  if (oneway === "yes" || oneway === "-1") {
    return result(
      "WARNING",
      mode,
      tags,
      (prefix ? prefix + " " : "") +
        "Vía de sentido único según la cartografía. Comprueba el sentido real.",
      false,
    );
  }
  const barrier = t(tags, "barrier");
  if (barrier && barrier !== "no") {
    return result(
      "WARNING",
      mode,
      tags,
      (prefix ? prefix + " " : "") +
        "Hay una barrera u obstáculo indicado. El acceso no está prohibido solo por ese motivo.",
      false,
    );
  }
  const hw = t(tags, "highway");
  const msg =
    prefix ||
    (hw === "track"
      ? "Pista. El tipo o la superficie no implican prohibición de acceso."
      : "Según la información cartográfica disponible, no hay una prohibición explícita para " +
        modeLabelEs(mode) +
        ".");
  return result("COMPATIBLE", mode, tags, msg, false);
}

export function isBlocking(cls: CompatibilityClass): boolean {
  return cls === "INCOMPATIBLE" || cls === "RESTRICTED";
}

export function isPreferredSnapTarget(cls: CompatibilityClass): boolean {
  return cls === "COMPATIBLE" || cls === "WARNING";
}
