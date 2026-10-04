const GRADE_CLAMP = 0.45;
const PITCH_MIN = 48;
const PITCH_MAX = 72;
const CLEARANCE_MIN_M = 28;

export function clampCinematic(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function cinematicClearanceFromZoom(zoom: number): number {
  return clampCinematic(Math.pow(2, 18.6 - zoom) * 2.8, CLEARANCE_MIN_M, 160);
}

export function cinematicPitchFromGrade(grade: number): number {
  const g = clampCinematic(grade, -GRADE_CLAMP, GRADE_CLAMP);
  return clampCinematic(62 - g * 38, PITCH_MIN, PITCH_MAX);
}

export function cinematicCameraAltitudeM(
  terrainElevationM: number | null,
  zoom: number,
  grade = 0,
): number {
  const clearance = cinematicClearanceFromZoom(zoom);
  const elev =
    typeof terrainElevationM === "number" && Number.isFinite(terrainElevationM)
      ? terrainElevationM
      : 0;
  const extra = grade > 0.04 ? grade * 70 : grade < -0.04 ? Math.abs(grade) * 90 : 0;
  const alt = elev + clearance + extra;
  return Number.isFinite(alt) ? alt : clearance;
}
