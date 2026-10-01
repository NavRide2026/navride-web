import { HISTORY_CAP } from "@/lib/route-studio/track-style";
import type { Segment } from "./editor-types";

function cloneSegments(segments: Segment[]): Segment[] {
  return JSON.parse(JSON.stringify(segments)) as Segment[];
}

export class EditorHistory {
  private entries: Segment[][];
  private index = 0;

  constructor(initial: Segment[]) {
    this.entries = [cloneSegments(initial)];
  }

  get currentIndex(): number {
    return this.index;
  }

  get length(): number {
    return this.entries.length;
  }

  push(segments: Segment[]): void {
    const trimmed = this.entries.slice(0, this.index + 1);
    let next = [...trimmed, cloneSegments(segments)];
    if (next.length > HISTORY_CAP) {
      next = next.slice(next.length - HISTORY_CAP);
    }
    this.entries = next;
    this.index = next.length - 1;
  }

  undo(): Segment[] {
    this.index = Math.max(0, this.index - 1);
    return cloneSegments(this.entries[this.index]);
  }

  redo(): Segment[] {
    this.index = Math.min(this.entries.length - 1, this.index + 1);
    return cloneSegments(this.entries[this.index]);
  }

  reset(segments: Segment[]): void {
    this.entries = [cloneSegments(segments)];
    this.index = 0;
  }
}
