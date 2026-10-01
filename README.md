# Caret Geometry

Place an autocomplete menu, mention picker, or editor popup next to the text caret. Caret Geometry measures carets in inputs, textareas, and editable DOM, returning viewport coordinates you can use directly or pass to a positioning library.

Browsers expose selection geometry for DOM ranges, but not a caret rectangle for an input or textarea. This package bridges that gap and provides one API for text controls, Range, Selection, and contenteditable roots. It has no framework or runtime dependencies.

[Interactive lab](https://caret-geometry.nipesolutions.com/lab.html) · [Website and API](https://caret-geometry.nipesolutions.com) · [npm](https://www.npmjs.com/package/@nipe-solutions/caret-geometry)

[![Quality](https://github.com/NIPE-Solutions/caret-geometry/actions/workflows/quality.yml/badge.svg)](https://github.com/NIPE-Solutions/caret-geometry/actions/workflows/quality.yml)
[![Browsers](https://github.com/NIPE-Solutions/caret-geometry/actions/workflows/browsers.yml/badge.svg)](https://github.com/NIPE-Solutions/caret-geometry/actions/workflows/browsers.yml)

## Measure and follow a textarea caret

```bash
npm install @nipe-solutions/caret-geometry
```

The package includes TypeScript declarations and ESM/CommonJS entry points. Add a textarea and a small positioning marker to your page:

```html
<textarea id="message" rows="4">Try typing here</textarea>
<div id="caret-marker" hidden style="position: fixed; pointer-events: none">
  Caret is here
</div>
```

Run this in your browser entry point after the elements exist:

```ts
import {
  getCaretRect,
  observeCaretGeometry,
} from "@nipe-solutions/caret-geometry";

function followCaret(textarea: HTMLTextAreaElement, marker: HTMLElement) {
  const update = () => {
    const rect = getCaretRect(textarea);
    marker.hidden = rect === null;
    if (!rect) return;
    marker.style.left = `${rect.left}px`;
    marker.style.top = `${rect.bottom + 6}px`;
  };

  const observer = observeCaretGeometry(textarea, update);
  window.addEventListener("scroll", update, true);
  window.addEventListener("resize", update);
  update();

  return () => {
    observer.disconnect();
    window.removeEventListener("scroll", update, true);
    window.removeEventListener("resize", update);
    marker.hidden = true;
  };
}

const textarea = document.querySelector<HTMLTextAreaElement>("#message");
const marker = document.querySelector<HTMLElement>("#caret-marker");
if (!textarea || !marker) throw new Error("Missing caret demo elements");

const stopFollowing = followCaret(textarea, marker);
window.addEventListener("pagehide", stopFollowing, { once: true });
```

The observer handles typing, selection changes, composition, and internal control scrolling. The window listeners handle page/ancestor scrolling and window resizing in this basic example. Call the returned cleanup when removing the UI in a long-lived app. Programmatic selection or value changes may need an explicit observer `update()` call.

Rects are viewport-relative CSS pixels, like `getBoundingClientRect()`, in the target's browsing context. A control inside an iframe returns coordinates for that iframe's viewport. Text-control positions use UTF-16 string indices.

## Let a positioning engine place the popup

The marker example does not avoid viewport edges or clipping. For a real menu, use a positioning engine for offset, flip/shift, and layout tracking. With [Floating UI](https://floating-ui.com/docs/getting-started), install the optional integration dependency:

```bash
npm install @floating-ui/dom
```

```ts
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

  let active = true;
  let latestRequest = 0;
  popup.style.position = "fixed";
  const update = async () => {
    const request = ++latestRequest;
    if (!active) return;
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
    if (!active || request !== latestRequest) return;
    if (!caret.getCaretRect()) {
      popup.hidden = true;
      return;
    }
    Object.assign(popup.style, { left: `${x}px`, top: `${y}px` });
  };

  const observer = observeCaretGeometry(textarea, update);
  const stopLayout = autoUpdate(caret, popup, update);

  return () => {
    active = false;
    observer.disconnect();
    stopLayout();
    popup.hidden = true;
  };
}
```

Call `connectCaretPopup()` with your mounted textarea and popup, then call its returned function before unmounting; `null` means the target could not currently be measured. The caret observer follows text/selection changes. `autoUpdate()` follows surrounding layout changes. The [integration guide](https://caret-geometry.nipesolutions.com/integrations/floating-ui.html) and [example module](examples/floating-ui.ts) cover the same boundary.

## Choose the smallest tool that covers your target

If you only measure an existing DOM Range, native Range geometry may be enough. A control-only caret library can suit an input/textarea-only application. Choose Caret Geometry when you need a consistent contract across controls and editable DOM, explicit caret positions, or an observer and virtual reference for floating UI.

It measures the caret; your app owns suggestions, selection handling, popup rendering, keyboard interaction, and accessibility. It does not supply a menu component or a complete editor.

## API and boundaries

- `getCaretRect(target, options?)` returns a `CaretRect` or `null`.
- `createCaretVirtualElement(target, options?)` returns a live positioning reference or `null`.
- `observeCaretGeometry(target, callback, options?)` returns an observer with `update()` and `disconnect()`.

Supported controls are text, tel, url, search, and textarea; search has browser-specific decoration caveats. Non-collapsed Range targets require `edge: "start" | "end"`. Selection defaults to its focus endpoint; a backward input selection defaults to `selectionStart`. Unsupported inputs throw `UnsupportedInputTypeError`; out-of-bounds positions throw `InvalidCaretPositionError`. Supported targets without layout or a relevant selection return `null`.

Password controls are rejected before their value is read. Other supported text-control values are measured synchronously in a hidden mirror and cleared before the call returns. The library does not log, transmit, or persist field text. Editable-DOM measurement can use a synchronous marker fallback that MutationObservers may observe. See [security and privacy](docs/security-and-privacy.md) and [architecture](docs/architecture.md).

Rotated/skewed/3D controls are outside the stable contract, and vertical writing modes are experimental. Automated desktop Chromium, Firefox, and WebKit coverage does not establish physical-device or screen-reader certification. The [compatibility matrix](docs/compatibility.md), [browser notes](docs/browser-notes.md), and [release evidence](docs/release-readiness.md) document those limits.

## Develop locally

```bash
npm ci
npm run dev
```

`npm run check` runs formatting, lint, types, tests, the package build and consumer verification, workflow checks, and the site build. Run `npm run test:browser` for the browser matrix and `npm run benchmark` for measurements.

[MIT](LICENSE) © NIPE Solutions · [NIPE Open Source](https://opensource.nipesolutions.com)
