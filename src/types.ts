export interface CaretRect {
  readonly x: number;
  readonly y: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
}

export type CaretEdge = "start" | "end";
export type SelectionEdge = "anchor" | "focus";

export interface CaretOptions {
  readonly position?: number;
  readonly edge?: CaretEdge | SelectionEdge;
  readonly markerFallback?: "auto" | "never";
}

export type CaretTarget =
  HTMLInputElement | HTMLTextAreaElement | HTMLElement | Range | Selection;

export interface CaretVirtualElement {
  readonly contextElement?: Element;
  getBoundingClientRect(): CaretRect;
  /** Mutable array for structural compatibility with Floating UI VirtualElement. */
  getClientRects(): CaretRect[];
  getCaretRect(): CaretRect | null;
  isValid(): boolean;
}

export interface CaretGeometryObserver {
  update(): void;
  disconnect(): void;
}
