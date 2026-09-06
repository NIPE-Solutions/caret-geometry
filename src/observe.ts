import { getCaretRect, getContextElement } from "./get-caret-rect";
import type {
  CaretGeometryObserver,
  CaretOptions,
  CaretRect,
  CaretTarget,
} from "./types";

function equal(a: CaretRect | null, b: CaretRect | null): boolean {
  if (a === b) return true;
  return (
    !!a &&
    !!b &&
    ["left", "top", "right", "bottom", "width", "height"].every(
      (key) =>
        Math.abs(a[key as keyof CaretRect] - b[key as keyof CaretRect]) < 0.01,
    )
  );
}

export function observeCaretGeometry(
  target: CaretTarget,
  callback: (rect: CaretRect | null) => void,
  options?: CaretOptions,
): CaretGeometryObserver {
  const element = getContextElement(target);
  const doc =
    element?.ownerDocument ?? (target as Range).startContainer?.ownerDocument;
  const view = doc?.defaultView;
  let frame = 0;
  let last: CaretRect | null | undefined;
  let disconnected = false;
  let composing = false;
  const flush = () => {
    frame = 0;
    if (disconnected) return;
    const measurementOptions = composing
      ? { ...options, markerFallback: "never" as const }
      : options;
    const next = getCaretRect(target, measurementOptions);
    if (last === undefined || !equal(last, next)) {
      last = next;
      callback(next);
    }
  };
  const update = () => {
    if (!disconnected && !frame && view)
      frame = view.requestAnimationFrame(flush);
  };
  const events = [
    "input",
    "select",
    "click",
    "pointerup",
    "keyup",
    "scroll",
    "focus",
    "blur",
    "compositionupdate",
  ];
  for (const event of events)
    element?.addEventListener(event, update, { passive: true });
  doc?.addEventListener("selectionchange", update);
  const startComposition = () => {
    composing = true;
    update();
  };
  const endComposition = () => {
    composing = false;
    update();
  };
  element?.addEventListener("compositionstart", startComposition);
  element?.addEventListener("compositionend", endComposition);
  const MutationObserverConstructor = view?.MutationObserver;
  const mutations =
    MutationObserverConstructor &&
    element instanceof (view?.HTMLElement ?? Object) &&
    (element as HTMLElement).isContentEditable
      ? new MutationObserverConstructor(update)
      : null;
  if (mutations && element)
    mutations.observe(element, {
      subtree: true,
      childList: true,
      characterData: true,
    });
  const fonts = doc?.fonts;
  fonts?.addEventListener?.("loadingdone", update);
  update();
  return {
    update,
    disconnect() {
      disconnected = true;
      if (frame && view) view.cancelAnimationFrame(frame);
      for (const event of events) element?.removeEventListener(event, update);
      doc?.removeEventListener("selectionchange", update);
      element?.removeEventListener("compositionstart", startComposition);
      element?.removeEventListener("compositionend", endComposition);
      fonts?.removeEventListener?.("loadingdone", update);
      mutations?.disconnect();
    },
  };
}
