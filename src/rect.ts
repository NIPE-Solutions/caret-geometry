import type { CaretRect } from "./types";

export function rectFromEdges(
  left: number,
  top: number,
  bottom: number,
): CaretRect {
  return {
    x: left,
    y: top,
    top,
    right: left,
    bottom,
    left,
    width: 0,
    height: Math.max(0, bottom - top),
  };
}

export function normalizeCaretRect(
  rect: Pick<DOMRectReadOnly, "left" | "top" | "bottom" | "height">,
): CaretRect {
  const height = rect.height || Math.max(0, rect.bottom - rect.top);
  return rectFromEdges(rect.left, rect.top, rect.top + height);
}

export function isUsableRect(
  rect: Pick<DOMRectReadOnly, "left" | "top" | "width" | "height">,
): boolean {
  return (
    Number.isFinite(rect.left) && Number.isFinite(rect.top) && rect.height > 0
  );
}
