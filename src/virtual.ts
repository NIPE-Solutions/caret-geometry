import { getCaretRect, getContextElement } from "./get-caret-rect";
import type {
  CaretOptions,
  CaretOptionsFor,
  CaretTarget,
  CaretVirtualElement,
} from "./types";

export function createCaretVirtualElement<T extends CaretTarget>(
  target: T,
  options?: CaretOptionsFor<T>,
): CaretVirtualElement | null;
export function createCaretVirtualElement(
  target: CaretTarget,
  options?: CaretOptions,
): CaretVirtualElement | null {
  let last = getCaretRect(target, options);
  if (!last) return null;
  let valid = true;
  const contextElement = getContextElement(target, options);
  const virtual: CaretVirtualElement = {
    getBoundingClientRect() {
      const next = getCaretRect(target, options);
      valid = next !== null;
      if (next) last = next;
      return last!;
    },
    getClientRects() {
      return [this.getBoundingClientRect()];
    },
    getCaretRect() {
      const next = getCaretRect(target, options);
      valid = next !== null;
      if (next) last = next;
      return next;
    },
    isValid() {
      return valid;
    },
  };
  if (contextElement)
    Object.defineProperty(virtual, "contextElement", {
      value: contextElement,
      enumerable: true,
    });
  return virtual;
}
