import { normalizeCaretRect } from "./rect";
import type { CaretRect } from "./types";

interface MirrorState {
  host: HTMLDivElement;
  mirror: HTMLDivElement;
  before: Text;
  marker: HTMLSpanElement;
  after: Text;
}
const mirrors = new WeakMap<Document, MirrorState>();

const STYLE_PROPERTIES = [
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "font-stretch",
  "font-variant",
  "font-variant-ligatures",
  "font-feature-settings",
  "font-variation-settings",
  "font-kerning",
  "font-optical-sizing",
  "font-size-adjust",
  "font-synthesis",
  "line-height",
  "letter-spacing",
  "word-spacing",
  "text-transform",
  "text-indent",
  "text-align",
  "text-align-last",
  "tab-size",
  "direction",
  "unicode-bidi",
  "writing-mode",
  "word-break",
  "overflow-wrap",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "border-top-width",
  "border-right-width",
  "border-bottom-width",
  "border-left-width",
  "border-top-style",
  "border-right-style",
  "border-bottom-style",
  "border-left-style",
  "box-sizing",
  "scrollbar-gutter",
] as const;

function createMirror(doc: Document): MirrorState {
  const host = doc.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText =
    "position:fixed;left:-100000px;top:0;visibility:hidden;pointer-events:none;contain:strict;z-index:-2147483648";
  const root = host.attachShadow?.({ mode: "closed" }) ?? host;
  const mirror = doc.createElement("div");
  const before = doc.createTextNode("");
  const marker = doc.createElement("span");
  marker.textContent = "\u200b";
  marker.style.cssText = "display:inline;padding:0;margin:0;border:0";
  const after = doc.createTextNode("");
  mirror.append(before, marker, after);
  root.append(mirror);
  (doc.body ?? doc.documentElement).append(host);
  return { host, mirror, before, marker, after };
}

function stateFor(doc: Document): MirrorState {
  let state = mirrors.get(doc);
  if (!state || !state.host.isConnected) {
    state = createMirror(doc);
    mirrors.set(doc, state);
  }
  return state;
}

export function measureTextControl(
  control: HTMLInputElement | HTMLTextAreaElement,
  position: number,
): CaretRect | null {
  if (
    !control.isConnected ||
    control.offsetWidth === 0 ||
    control.offsetHeight === 0
  )
    return null;
  const doc = control.ownerDocument;
  const view = doc.defaultView;
  if (!view) return null;
  const state = stateFor(doc);
  const style = view.getComputedStyle(control);
  const { mirror, before, marker, after } = state;
  try {
    mirror.style.cssText = "";
    for (const property of STYLE_PROPERTIES)
      mirror.style.setProperty(property, style.getPropertyValue(property));
    mirror.style.position = "relative";
    mirror.style.width = `${control.offsetWidth}px`;
    mirror.style.height = `${control.offsetHeight}px`;
    mirror.style.overflow = "scroll";
    const wrap =
      control.localName === "textarea"
        ? (control as HTMLTextAreaElement).wrap
        : "off";
    mirror.style.whiteSpace =
      control.localName === "input" || wrap === "off" ? "pre" : "pre-wrap";
    mirror.style.overflowWrap =
      control.localName === "textarea" && wrap !== "off"
        ? "break-word"
        : "normal";
    before.data = control.value.slice(0, position);
    after.data =
      control.value.slice(position) ||
      (control.localName === "textarea" ? "\u200b" : "");
    mirror.scrollTop = control.scrollTop;
    mirror.scrollLeft = control.scrollLeft;
    const mirrorRect = mirror.getBoundingClientRect();
    const markerRect = marker.getBoundingClientRect();
    const sourceRect = control.getBoundingClientRect();
    const scaleX = control.offsetWidth
      ? sourceRect.width / control.offsetWidth
      : 1;
    const scaleY = control.offsetHeight
      ? sourceRect.height / control.offsetHeight
      : 1;
    const left = sourceRect.left + (markerRect.left - mirrorRect.left) * scaleX;
    const top = sourceRect.top + (markerRect.top - mirrorRect.top) * scaleY;
    return normalizeCaretRect({
      left,
      top,
      bottom: top + markerRect.height * scaleY,
      height: markerRect.height * scaleY,
    });
  } finally {
    before.data = "";
    after.data = "";
  }
}
