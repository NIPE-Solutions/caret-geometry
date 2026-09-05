import { UnsupportedCaretTargetError } from "./errors";
import {
  assertPosition,
  getDefaultTextControlPosition,
  isSupportedInputType,
  tagName,
} from "./guards";
import { measureTextControl } from "./mirror";
import { measureRange, rangeAtSelectionEdge } from "./range";
import type { CaretOptions, CaretRect, CaretTarget } from "./types";

function isRange(value: unknown): value is Range {
  return (
    !!value &&
    typeof (value as Range).cloneRange === "function" &&
    "startContainer" in (value as object)
  );
}
function isSelection(value: unknown): value is Selection {
  return (
    !!value &&
    typeof (value as Selection).getRangeAt === "function" &&
    "focusNode" in (value as object)
  );
}
function containingElement(node: Node | null): Element | null {
  return node?.nodeType === 1
    ? (node as Element)
    : (node?.parentElement ?? null);
}

export function getContextElement(target: CaretTarget): Element | undefined {
  if (tagName(target)) return target as Element;
  if (isRange(target))
    return containingElement(target.startContainer) ?? undefined;
  if (isSelection(target))
    return containingElement(target.focusNode) ?? undefined;
  return undefined;
}

export function getCaretRect(
  target: CaretTarget,
  options: CaretOptions = {},
): CaretRect | null {
  const tag = tagName(target);
  if (tag === "input" || tag === "textarea") {
    const control = target as HTMLInputElement | HTMLTextAreaElement;
    if (tag === "input")
      isSupportedInputType((control as HTMLInputElement).type, true);
    const position = options.position ?? getDefaultTextControlPosition(control);
    if (position === null) return null;
    assertPosition(position, control.value.length);
    return measureTextControl(control, position);
  }
  if (isRange(target))
    return measureRange(
      target,
      options.edge as "start" | "end" | undefined,
      options.markerFallback !== "never",
    );
  if (isSelection(target)) {
    const edge = options.edge === "anchor" ? "anchor" : "focus";
    const range = rangeAtSelectionEdge(target, edge);
    return range
      ? measureRange(range, undefined, options.markerFallback !== "never")
      : null;
  }
  if (tag) {
    const root = target as HTMLElement;
    if (!root.isContentEditable) throw new UnsupportedCaretTargetError();
    const selection = root.ownerDocument.getSelection();
    const endpoint = selection?.focusNode;
    if (
      !selection ||
      !endpoint ||
      !(endpoint === root || root.contains(endpoint))
    )
      return null;
    const range = rangeAtSelectionEdge(selection);
    return range
      ? measureRange(range, undefined, options.markerFallback !== "never")
      : null;
  }
  throw new UnsupportedCaretTargetError();
}
