import {
  createCaretVirtualElement,
  observeCaretGeometry,
} from "@nipe-solutions/caret-geometry";
import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
} from "@floating-ui/dom";

export function connectCaretPopup(
  textarea: HTMLTextAreaElement,
  popup: HTMLElement,
): (() => void) | null {
  const caret = createCaretVirtualElement(textarea);
  if (!caret) return null;

  const updatePosition = async () => {
    if (!caret.getCaretRect()) {
      popup.hidden = true;
      return;
    }
    popup.hidden = false;
    const { x, y } = await computePosition(caret, popup, {
      strategy: "fixed",
      placement: "bottom-start",
      middleware: [offset(6), flip(), shift({ padding: 8 })],
    });
    Object.assign(popup.style, { left: `${x}px`, top: `${y}px` });
  };

  const caretObserver = observeCaretGeometry(textarea, updatePosition);
  const stopLayout = autoUpdate(caret, popup, updatePosition);
  void updatePosition();

  return () => {
    caretObserver.disconnect();
    stopLayout();
  };
}
