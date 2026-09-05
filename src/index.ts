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
  CaretRect,
  CaretTarget,
  CaretVirtualElement,
  SelectionEdge,
} from "./types";
