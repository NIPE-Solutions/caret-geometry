import { createCaretVirtualElement, observeCaretGeometry } from "../src/index";
const textarea = document.querySelector<HTMLTextAreaElement>("#hero-input")!;
const axis = document.querySelector<HTMLDivElement>("#hero-axis")!;
const output = axis.querySelector("output")!;
const popup = document.querySelector<HTMLDivElement>("#hero-popup")!;
textarea.setSelectionRange(textarea.value.length, textarea.value.length);
function render() {
  const virtual = createCaretVirtualElement(textarea);
  const rect = virtual?.getCaretRect();
  if (!rect) {
    axis.hidden = popup.hidden = true;
    return;
  }
  axis.hidden = popup.hidden = false;
  axis.style.transform = `translate(${rect.left}px,${rect.top}px)`;
  axis.style.height = `${rect.height}px`;
  popup.style.transform = `translate(${Math.min(rect.left, innerWidth - 170)}px,${rect.bottom + 10}px)`;
  output.textContent = `x ${rect.left.toFixed(1)}  y ${rect.top.toFixed(1)}  h ${rect.height.toFixed(1)}`;
}
observeCaretGeometry(textarea, render);
textarea.focus();
render();
