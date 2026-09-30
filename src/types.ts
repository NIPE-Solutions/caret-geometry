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
export type MarkerFallback = "auto" | "never";

export interface TextControlCaretOptions {
  readonly position?: number;
  readonly edge?: never;
  readonly markerFallback?: never;
}

export interface RangeCaretOptions {
  readonly position?: never;
  readonly edge?: CaretEdge;
  readonly markerFallback?: MarkerFallback;
}

export interface SelectionCaretOptions {
  readonly position?: never;
  readonly edge?: SelectionEdge;
  readonly markerFallback?: MarkerFallback;
}

export type EditableCaretOptions = SelectionCaretOptions;
export type CaretOptions =
  TextControlCaretOptions | RangeCaretOptions | SelectionCaretOptions;

export type CaretTarget =
  HTMLInputElement | HTMLTextAreaElement | HTMLElement | Range | Selection;

export type CaretOptionsFor<T extends CaretTarget> = T extends
  HTMLInputElement | HTMLTextAreaElement
  ? TextControlCaretOptions
  : T extends Range
    ? RangeCaretOptions
    : T extends Selection
      ? SelectionCaretOptions
      : T extends HTMLElement
        ? EditableCaretOptions
        : never;

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
