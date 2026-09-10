import { markDocumentAnchors } from "./anchors.ts";
import { parseGpxDocument } from "./parse.ts";
import { serializeGpx } from "./serialize.ts";
import {
  addWaypoint,
  appendPoint,
  backToStart,
  closeWithRoute,
  cropDocument,
  deleteAnchor,
  deleteInBounds,
  deleteTrack,
  deleteWaypoint,
  duplicateTrack,
  insertAnchor,
  mergeTracks,
  moveAnchor,
  moveWaypoint,
  newDocument,
  renameTrack,
  reorderTrack,
  reverseDocument,
  reversePoints,
  rotateLoopStart,
  roundTripDocument,
  setTrackHidden,
  simplifyDocument,
  splitDocument,
  straightRoute,
  toPoint,
  updateWaypoint,
} from "./ops.ts";
import {
  canRedo,
  canUndo,
  createHistory,
  pushHistory,
  redo as redoHist,
  undo as undoHist,
  type HistoryState,
} from "./history.ts";
import type {
  GpxDocument,
  GpxPoint,
  MergeMode,
  SplitMode,
  TraceMode,
  TransportMode,
} from "./types.ts";
import { cloneDoc } from "./types.ts";
import type { LngLat } from "./geo.ts";

export function isStaleGeneration(generation: number, latest: number): boolean {
  return generation !== latest;
}

export class GpxEditorEngine {
  doc: GpxDocument;
  history: HistoryState;
  generation = 0;
  followRoads: TraceMode = "FOLLOW_WAYS";
  mode: TransportMode = "moto";

  constructor(doc?: GpxDocument) {
    this.doc = doc ?? newDocument();
    this.history = createHistory(this.doc);
  }

  bump(): number {
    this.generation += 1;
    return this.generation;
  }

  isStale(gen: number): boolean {
    return isStaleGeneration(gen, this.generation);
  }

  commit(next: GpxDocument): void {
    this.doc = next;
    this.history = pushHistory(this.history, this.doc);
  }

  loadXml(xml: string) {
    const parsed = parseGpxDocument(xml);
    if (!parsed.recoverable) return parsed;
    markDocumentAnchors(parsed.doc);
    this.doc = parsed.doc;
    this.history = createHistory(this.doc);
    this.generation = 0;
    return parsed;
  }

  reset(name = "Mi ruta"): void {
    this.doc = newDocument(name);
    this.history = createHistory(this.doc);
    this.generation = 0;
  }

  saveXml(): string {
    return serializeGpx(this.doc);
  }

  undo(): boolean {
    const r = undoHist(this.history);
    if (!r) return false;
    this.history = r.state;
    this.doc = r.doc;
    this.bump();
    return true;
  }

  redo(): boolean {
    const r = redoHist(this.history);
    if (!r) return false;
    this.history = r.state;
    this.doc = r.doc;
    this.bump();
    return true;
  }

  get canUndo(): boolean {
    return canUndo(this.history);
  }

  get canRedo(): boolean {
    return canRedo(this.history);
  }

  addClick(lat: number, lon: number, routed?: LngLat[]): void {
    const point: GpxPoint = { lat, lon, anchor: true, minZoom: 0 };
    const routedPts = routed?.map((ll) => toPoint(ll));
    this.commit(appendPoint(this.doc, point, routedPts));
    this.bump();
  }

  move(
    trackIndex: number,
    segmentIndex: number,
    pointIndex: number,
    dest: LngLat,
    prevRoute?: LngLat[],
    nextRoute?: LngLat[],
  ): void {
    this.commit(
      moveAnchor(
        this.doc,
        trackIndex,
        segmentIndex,
        pointIndex,
        toPoint(dest),
        prevRoute?.map((ll) => toPoint(ll)),
        nextRoute?.map((ll) => toPoint(ll)),
      ),
    );
    this.bump();
  }

  insert(trackIndex: number, segmentIndex: number, pointIndex: number, dest: LngLat): void {
    this.commit(insertAnchor(this.doc, trackIndex, segmentIndex, pointIndex, toPoint(dest)));
    this.bump();
  }

  removeAnchor(
    trackIndex: number,
    segmentIndex: number,
    pointIndex: number,
    reconnect?: LngLat[],
  ): void {
    this.commit(
      deleteAnchor(
        this.doc,
        trackIndex,
        segmentIndex,
        pointIndex,
        reconnect?.map((ll) => toPoint(ll)),
      ),
    );
    this.bump();
  }

  crop(start: number, end: number): void {
    this.commit(cropDocument(this.doc, start, end));
    this.bump();
  }

  split(pointIndex: number, mode: SplitMode): void {
    this.commit(splitDocument(this.doc, pointIndex, mode));
    this.bump();
  }

  merge(mode: MergeMode): void {
    this.commit(mergeTracks(this.doc, mode));
    this.bump();
  }

  reverse(): void {
    this.commit(reverseDocument(this.doc));
    this.bump();
  }

  roundTrip(): void {
    this.commit(roundTripDocument(this.doc));
    this.bump();
  }

  closeLoop(routed: LngLat[]): void {
    this.commit(closeWithRoute(this.doc, routed.map((ll) => toPoint(ll))));
    this.bump();
  }

  backToStart(routed: LngLat[]): void {
    this.commit(backToStart(this.doc, routed.map((ll) => toPoint(ll))));
    this.bump();
  }

  startLoopHere(pointIndex: number): void {
    this.commit(rotateLoopStart(this.doc, pointIndex));
    this.bump();
  }

  simplify(epsilonM: number): { before: number; after: number } {
    const r = simplifyDocument(this.doc, epsilonM);
    this.commit(r.doc);
    this.bump();
    return { before: r.before, after: r.after };
  }

  addWpt(lat: number, lon: number, name = "Waypoint"): void {
    this.commit(addWaypoint(this.doc, { lat, lon, name, desc: "" }));
    this.bump();
  }

  moveWpt(id: string, lat: number, lon: number): void {
    this.commit(moveWaypoint(this.doc, id, lat, lon));
    this.bump();
  }

  deleteWpt(id: string): void {
    this.commit(deleteWaypoint(this.doc, id));
    this.bump();
  }

  patchWpt(id: string, patch: { name?: string; desc?: string; sym?: string }): void {
    this.commit(updateWaypoint(this.doc, id, patch));
    this.bump();
  }

  deleteBounds(south: number, west: number, north: number, east: number): void {
    this.commit(deleteInBounds(this.doc, south, west, north, east));
    this.bump();
  }

  hideTrack(i: number, hidden: boolean): void {
    this.commit(setTrackHidden(this.doc, i, hidden));
    this.bump();
  }

  rename(i: number, name: string): void {
    this.commit(renameTrack(this.doc, i, name));
    this.bump();
  }

  duplicate(i: number): void {
    this.commit(duplicateTrack(this.doc, i));
    this.bump();
  }

  dropTrack(i: number): void {
    this.commit(deleteTrack(this.doc, i));
    this.bump();
  }

  reorder(from: number, to: number): void {
    this.commit(reorderTrack(this.doc, from, to));
    this.bump();
  }

  lastPoint(): GpxPoint | null {
    for (let t = this.doc.tracks.length - 1; t >= 0; t--) {
      const segs = this.doc.tracks[t].segments;
      for (let s = segs.length - 1; s >= 0; s--) {
        const pts = segs[s].points;
        if (pts.length) return pts[pts.length - 1];
      }
    }
    return null;
  }

  firstPoint(): GpxPoint | null {
    for (const t of this.doc.tracks) {
      for (const s of t.segments) {
        if (s.points.length) return s.points[0];
      }
    }
    return null;
  }

  snapshot(): GpxDocument {
    return cloneDoc(this.doc);
  }
}

export { straightRoute, reversePoints };
