import * as caretGeometry from "../src/index";
const { getCaretRect, observeCaretGeometry } = caretGeometry;
(
  window as typeof window & { __caretGeometry: typeof caretGeometry }
).__caretGeometry = caretGeometry;
const targets = [
  ...document.querySelectorAll<HTMLTextAreaElement | HTMLElement>(
    "textarea,[contenteditable]",
  ),
];
const marker = document.querySelector<HTMLDivElement>("#marker")!;
const output = document.querySelector<HTMLOutputElement>("#diagnostic")!;
let active = targets[0]!;
function render(rect = getCaretRect(active)) {
  marker.hidden = !rect;
  if (!rect) return;
  Object.assign(marker.style, {
    transform: `translate(${rect.left}px,${rect.top}px)`,
    height: `${rect.height}px`,
  });
  output.textContent = JSON.stringify(
    {
      target: active.localName,
      left: rect.left,
      top: rect.top,
      bottom: rect.bottom,
      scrollTop: active.scrollTop,
      direction: getComputedStyle(active).direction,
      lineHeight: getComputedStyle(active).lineHeight,
    },
    null,
    2,
  );
}
for (const target of targets) {
  target.addEventListener("focus", () => {
    active = target;
    render();
  });
  observeCaretGeometry(target, (rect) => {
    if (target === active) render(rect);
  });
}
render();
