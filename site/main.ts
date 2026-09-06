import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
} from "@floating-ui/dom";
import { createCaretVirtualElement, observeCaretGeometry } from "../src/index";
import floatingSource from "../examples/floating-ui.ts?raw";
import snapshotSource from "../examples/snapshot.ts?raw";
import { installCodeExamples } from "./show-code";

function connectDemo(
  target: HTMLTextAreaElement,
  marker: HTMLElement,
  popup: HTMLElement,
  readout: HTMLOutputElement,
) {
  const caret = createCaretVirtualElement(target);
  const update = async () => {
    const rect = caret?.getCaretRect() ?? null;
    marker.hidden = popup.hidden = !rect;
    if (!rect || !caret) return;
    Object.assign(marker.style, {
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      height: `${rect.height}px`,
    });
    readout.textContent = `x ${rect.x.toFixed(1)}  y ${rect.y.toFixed(1)}  h ${rect.height.toFixed(1)}  pos ${target.selectionStart}`;
    const position = await computePosition(caret, popup, {
      strategy: "fixed",
      placement: "bottom-start",
      middleware: [offset(8), flip(), shift({ padding: 8 })],
    });
    Object.assign(popup.style, {
      left: `${position.x}px`,
      top: `${position.y}px`,
    });
  };
  if (!caret) return;
  const caretObserver = observeCaretGeometry(target, update);
  const stopLayout = autoUpdate(caret, popup, update);
  window.addEventListener(
    "pagehide",
    () => {
      caretObserver.disconnect();
      stopLayout();
    },
    { once: true },
  );
  void update();
}

const textarea = document.querySelector<HTMLTextAreaElement>("#hero-input")!;
textarea.setSelectionRange(textarea.value.length, textarea.value.length);
connectDemo(
  textarea,
  document.querySelector("#hero-axis")!,
  document.querySelector("#hero-popup")!,
  document.querySelector("#hero-readout")!,
);

const stress = document.querySelector<HTMLTextAreaElement>("#stress-input")!;
stress.setSelectionRange(stress.value.length, stress.value.length);
connectDemo(
  stress,
  document.querySelector("#stress-marker")!,
  document.querySelector("#stress-popup")!,
  document.querySelector("#stress-readout")!,
);
document.querySelector("#stress-rtl")?.addEventListener("change", (event) => {
  stress.dir = (event.currentTarget as HTMLInputElement).checked
    ? "rtl"
    : "ltr";
  window.dispatchEvent(new Event("resize"));
});
document.querySelector("#stress-font")?.addEventListener("input", (event) => {
  stress.style.fontSize = `${(event.currentTarget as HTMLInputElement).value}px`;
  window.dispatchEvent(new Event("resize"));
});
document.querySelector("#stress-line")?.addEventListener("input", (event) => {
  stress.style.lineHeight = (event.currentTarget as HTMLInputElement).value;
  window.dispatchEvent(new Event("resize"));
});

installCodeExamples({ snapshot: snapshotSource, floating: floatingSource });
textarea.focus();
