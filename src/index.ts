export { getCaretRect } from "./get-caret-rect";
export { createCaretVirtualElement } from "./virtual";
export { observeCaretGeometry } from "./observe";
export {
  InvalidCaretPositionError,
  UnsupportedCaretTargetError,
  UnsupportedInputTypeError,
} from "./errors";
export type {
  CaretEdge,
  CaretGeometryObserver,
  CaretOptions,
  CaretOptionsFor,
  CaretRect,
  CaretTarget,
  CaretVirtualElement,
  EditableCaretOptions,
  MarkerFallback,
  RangeCaretOptions,
  SelectionEdge,
  SelectionCaretOptions,
  TextControlCaretOptions,
} from "./types";
