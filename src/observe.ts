import {
  assertCaretRequest,
  getCaretRect,
  getContextElement,
  isSelection,
} from "./get-caret-rect";
import { tagName } from "./guards";
import type {
  CaretGeometryObserver,
  CaretOptions,
  CaretOptionsFor,
  CaretRect,
  CaretTarget,
  RangeCaretOptions,
  SelectionCaretOptions,
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

export function observeCaretGeometry<T extends CaretTarget>(
  target: T,
  callback: (rect: CaretRect | null) => void,
  options?: CaretOptionsFor<T>,
): CaretGeometryObserver;
export function observeCaretGeometry(
  target: CaretTarget,
  callback: (rect: CaretRect | null) => void,
  options?: CaretOptions,
): CaretGeometryObserver {
  assertCaretRequest(target, options);
  const element = getContextElement(target, options);
  const doc =
    element?.ownerDocument ?? (target as Range).startContainer?.ownerDocument;
  const view = doc?.defaultView;
  let frame = 0;
  let last: CaretRect | null | undefined;
  let disconnected = false;
  let composing = false;
  let compositionTarget: EventTarget | null = null;
  let mutations: MutationObserver | null = null;
  const selectionTarget = isSelection(target);
  const currentElement = () =>
    selectionTarget ? getContextElement(target, options) : element;
  const observeMutations = () => {
    const observedElement = currentElement();
    if (
      mutations &&
      observedElement instanceof (view?.HTMLElement ?? Object) &&
      (observedElement as HTMLElement).isContentEditable
    )
      mutations.observe(observedElement, {
        subtree: true,
        childList: true,
        characterData: true,
      });
  };
  const flush = () => {
    frame = 0;
    if (disconnected) return;
    const targetTag = tagName(target);
    const measurementOptions: CaretOptions | undefined =
      composing && targetTag !== "input" && targetTag !== "textarea"
        ? {
            ...(options as RangeCaretOptions | SelectionCaretOptions),
            markerFallback: "never",
          }
        : options;
    mutations?.disconnect();
    let next: CaretRect | null;
    try {
      next = getCaretRect(
        target,
        measurementOptions as CaretOptionsFor<CaretTarget>,
      );
    } finally {
      observeMutations();
    }
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
  const eventSource = selectionTarget ? doc : element;
  for (const event of events)
    eventSource?.addEventListener(event, update, {
      capture: selectionTarget,
      passive: true,
    });
  doc?.addEventListener("selectionchange", update);
  const compositionBelongsToTarget = (event: Event) => {
    if (!selectionTarget) return true;
    const context = currentElement();
    const eventTarget = event.target;
    const NodeConstructor = view?.Node;
    return (
      !!context &&
      !!NodeConstructor &&
      eventTarget instanceof NodeConstructor &&
      (eventTarget === context ||
        context.contains(eventTarget) ||
        eventTarget.contains(context))
    );
  };
  const startComposition = (event: Event) => {
    if (!compositionBelongsToTarget(event)) return;
    composing = true;
    compositionTarget = event.target;
    update();
  };
  const endComposition = (event: Event) => {
    if (selectionTarget && event.target !== compositionTarget) return;
    composing = false;
    compositionTarget = null;
    update();
  };
  eventSource?.addEventListener("compositionstart", startComposition, {
    capture: selectionTarget,
  });
  eventSource?.addEventListener("compositionend", endComposition, {
    capture: selectionTarget,
  });
  const MutationObserverConstructor = view?.MutationObserver;
  mutations =
    MutationObserverConstructor &&
    (selectionTarget ||
      (element instanceof (view?.HTMLElement ?? Object) &&
        (element as HTMLElement).isContentEditable))
      ? new MutationObserverConstructor(update)
      : null;
  observeMutations();
  const fonts = doc?.fonts;
  fonts?.addEventListener?.("loadingdone", update);
  update();
  return {
    update,
    disconnect() {
      if (disconnected) return;
      disconnected = true;
      if (frame && view) view.cancelAnimationFrame(frame);
      frame = 0;
      for (const event of events)
        eventSource?.removeEventListener(event, update, {
          capture: selectionTarget,
        });
      doc?.removeEventListener("selectionchange", update);
      eventSource?.removeEventListener("compositionstart", startComposition, {
        capture: selectionTarget,
      });
      eventSource?.removeEventListener("compositionend", endComposition, {
        capture: selectionTarget,
      });
      fonts?.removeEventListener?.("loadingdone", update);
      mutations?.disconnect();
    },
  };
}
