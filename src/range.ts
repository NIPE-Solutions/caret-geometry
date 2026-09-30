import { isUsableRect, normalizeCaretRect } from "./rect";
import type { CaretEdge, CaretRect } from "./types";

export function assertRangeEdge(range: Range, edge?: CaretEdge): void {
  if (!range.collapsed && !edge)
    throw new TypeError(
      'A non-collapsed Range requires edge: "start" or "end".',
    );
}

export function collapseRange(range: Range, edge?: CaretEdge): Range {
  assertRangeEdge(range, edge);
  const result = range.cloneRange();
  result.collapse(edge === "start");
  return result;
}

function nativeRect(range: Range): CaretRect | null {
  const rects = range.getClientRects();
  const rect = rects.length ? rects[0]! : range.getBoundingClientRect();
  return isUsableRect(rect) ? normalizeCaretRect(rect) : null;
}

function neighboringRect(range: Range): CaretRect | null {
  const node = range.startContainer;
  if (node.nodeType !== 3) return null;
  const length = node.textContent?.length ?? 0;
  const probe = range.cloneRange();
  if (range.startOffset < length) probe.setEnd(node, range.startOffset + 1);
  else if (range.startOffset > 0) probe.setStart(node, range.startOffset - 1);
  else return null;
  const rects = probe.getClientRects();
  const rect = rects[range.startOffset < length ? 0 : rects.length - 1];
  if (!rect || !isUsableRect(rect)) return null;
  const left = range.startOffset < length ? rect.left : rect.right;
  return normalizeCaretRect({
    left,
    top: rect.top,
    bottom: rect.bottom,
    height: rect.height,
  });
}

function markerRect(range: Range): CaretRect | null {
  const doc = range.startContainer.ownerDocument;
  if (!doc || !range.startContainer.isConnected) return null;
  const container = range.startContainer;
  const textSnapshot =
    container.nodeType === 3
      ? { node: container as Text, data: container.textContent ?? "" }
      : null;
  const marker = doc.createElement("span");
  marker.setAttribute("aria-hidden", "true");
  marker.dataset.caretGeometryMarker = "";
  marker.textContent = "\u200b";
  marker.style.cssText =
    "display:inline;padding:0;margin:0;border:0;line-height:inherit";
  const selection = doc.getSelection();
  const anchorNode = selection?.anchorNode ?? null;
  const anchorOffset = selection?.anchorOffset ?? 0;
  const focusNode = selection?.focusNode ?? null;
  const focusOffset = selection?.focusOffset ?? 0;
  let splitSibling: ChildNode | null = null;
  try {
    range.insertNode(marker);
    if (textSnapshot) splitSibling = marker.nextSibling;
    const rect = marker.getBoundingClientRect();
    return isUsableRect(rect) ? normalizeCaretRect(rect) : null;
  } finally {
    marker.remove();
    if (textSnapshot) {
      splitSibling?.remove();
      textSnapshot.node.data = textSnapshot.data;
    }
    if (selection && anchorNode && focusNode) {
      try {
        selection.setBaseAndExtent(
          anchorNode,
          anchorOffset,
          focusNode,
          focusOffset,
        );
      } catch {
        /* detached during measurement */
      }
    }
  }
}

export function measureRange(
  range: Range,
  edge?: CaretEdge,
  allowMarker = true,
): CaretRect | null {
  const caret = collapseRange(range, edge);
  return (
    nativeRect(caret) ??
    neighboringRect(caret) ??
    (allowMarker ? markerRect(caret) : null)
  );
}

export function rangeAtSelectionEdge(
  selection: Selection,
  edge: "anchor" | "focus" = "focus",
): Range | null {
  const node = edge === "focus" ? selection.focusNode : selection.anchorNode;
  const offset =
    edge === "focus" ? selection.focusOffset : selection.anchorOffset;
  if (!node) return null;
  const range = node.ownerDocument?.createRange();
  if (!range) return null;
  try {
    range.setStart(node, offset);
    range.collapse(true);
    return range;
  } catch {
    return null;
  }
}
