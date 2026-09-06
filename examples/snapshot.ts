import { getCaretRect } from "@nipe-solutions/caret-geometry";

const textarea = document.querySelector<HTMLTextAreaElement>("textarea");
const indicator = document.querySelector<HTMLElement>("[data-indicator]");

if (textarea && indicator) {
  const rect = getCaretRect(textarea);
  if (rect) {
    indicator.style.left = `${rect.left}px`;
    indicator.style.top = `${rect.top}px`;
    indicator.style.height = `${rect.height}px`;
  }
}
