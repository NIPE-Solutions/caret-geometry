import { UnsupportedCaretTargetError } from "./errors";
import {
  assertPosition,
  getDefaultTextControlPosition,
  isSupportedInputType,
  tagName,
} from "./guards";
import { measureTextControl } from "./mirror";
import { assertOptionsForTarget } from "./options";
import { assertRangeEdge, measureRange, rangeAtSelectionEdge } from "./range";
import type {
  CaretOptions,
  CaretOptionsFor,
  CaretRect,
  CaretTarget,
} from "./types";

function isRange(value: unknown): value is Range {
  return (
    !!value &&
    typeof (value as Range).cloneRange === "function" &&
    "startContainer" in (value as object)
  );
}
export function isSelection(value: unknown): value is Selection {
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

export function assertCaretOptionsForTarget(
  target: CaretTarget,
  options: CaretOptions = {},
): void {
  const tag = tagName(target);
  if (tag === "input" || tag === "textarea") {
    assertOptionsForTarget("text-control", options);
    return;
  }
  if (isRange(target)) {
    assertOptionsForTarget("range", options);
    return;
  }
  if (isSelection(target)) {
    assertOptionsForTarget("selection", options);
    return;
  }
  if (tag) {
    if (!(target as HTMLElement).isContentEditable)
      throw new UnsupportedCaretTargetError();
    assertOptionsForTarget("editable", options);
    return;
  }
  throw new UnsupportedCaretTargetError();
}

export function assertCaretRequest(
  target: CaretTarget,
  options: CaretOptions = {},
): void {
  assertCaretOptionsForTarget(target, options);
  const tag = tagName(target);
  if (tag === "input" || tag === "textarea") {
    const control = target as HTMLInputElement | HTMLTextAreaElement;
    if (tag === "input")
      isSupportedInputType((control as HTMLInputElement).type, true);
    const position = options.position ?? getDefaultTextControlPosition(control);
    if (position !== null) assertPosition(position, control.value.length);
    return;
  }
  if (isRange(target)) {
    assertRangeEdge(target, options.edge as "start" | "end" | undefined);
  }
}

export function getContextElement(
  target: CaretTarget,
  options: CaretOptions = {},
): Element | undefined {
  if (tagName(target)) return target as Element;
  if (isRange(target)) {
    const endpoint =
      options.edge === "end" ? target.endContainer : target.startContainer;
    return containingElement(endpoint) ?? undefined;
  }
  if (isSelection(target)) {
    const endpoint =
      options.edge === "anchor" ? target.anchorNode : target.focusNode;
    return containingElement(endpoint) ?? undefined;
  }
  return undefined;
}

export function getCaretRect<T extends CaretTarget>(
  target: T,
  options?: CaretOptionsFor<T>,
): CaretRect | null;
export function getCaretRect(
  target: CaretTarget,
  options: CaretOptions = {},
): CaretRect | null {
  assertCaretRequest(target, options);
  const tag = tagName(target);
  if (tag === "input" || tag === "textarea") {
    const control = target as HTMLInputElement | HTMLTextAreaElement;
    const position = options.position ?? getDefaultTextControlPosition(control);
    if (position === null) return null;
    return measureTextControl(control, position);
  }
  if (isRange(target)) {
    return measureRange(
      target,
      options.edge as "start" | "end" | undefined,
      options.markerFallback !== "never",
    );
  }
  if (isSelection(target)) {
    const edge = options.edge === "anchor" ? "anchor" : "focus";
    const range = rangeAtSelectionEdge(target, edge);
    return range
      ? measureRange(range, undefined, options.markerFallback !== "never")
      : null;
  }
  if (tag) {
    const root = target as HTMLElement;
    const selection = root.ownerDocument.getSelection();
    const edge = options.edge === "anchor" ? "anchor" : "focus";
    const endpoint =
      edge === "anchor" ? selection?.anchorNode : selection?.focusNode;
    if (
      !selection ||
      !endpoint ||
      !(endpoint === root || root.contains(endpoint))
    )
      return null;
    const range = rangeAtSelectionEdge(selection, edge);
    return range
      ? measureRange(range, undefined, options.markerFallback !== "never")
      : null;
  }
  throw new UnsupportedCaretTargetError();
}
