# Caret Geometry

Caret geometry for the web.

Reliable viewport coordinates for carets in inputs, textareas and editable DOM.

[![CI](https://github.com/NIPE-Solutions/caret-geometry/actions/workflows/ci.yml/badge.svg)](https://github.com/NIPE-Solutions/caret-geometry/actions/workflows/ci.yml)

```bash
npm install @nipe-solutions/caret-geometry
```

```ts
import { getCaretRect } from "@nipe-solutions/caret-geometry";

const rect = getCaretRect(textarea);
```

## Positioning floating UI

Caret Geometry resolves the virtual caret reference. Your positioning engine
places the popup.

```ts
const caret = createCaretVirtualElement(textarea);
if (!caret) return;

const update = () => computePosition(caret, popup);
const caretObserver = observeCaretGeometry(textarea, update);
const stopLayout = autoUpdate(caret, popup, update);

// cleanup
caretObserver.disconnect();
stopLayout();
```

`observeCaretGeometry()` invalidates when the caret itself changes, such as
typing, selection movement, composition, or internal textarea scrolling. A
positioner’s auto-update mechanism invalidates when the surrounding layout
changes, such as page/ancestor scrolling, resizing, or layout shift. Both feed
one positioning function. See the [complete, compiling Floating UI example](examples/floating-ui.ts)
and [integration guide](https://caret-geometry.nipesolutions.com/integrations/floating-ui.html).

Rects use viewport-relative CSS pixels matching `getBoundingClientRect()` in the target's browsing context. Explicit text-control positions are UTF-16 string indices. Selection defaults to its focus endpoint; a backward input selection defaults to `selectionStart`.

## API

```ts
getCaretRect(target, options?): CaretRect | null
createCaretVirtualElement(target, options?): CaretVirtualElement | null
observeCaretGeometry(target, callback, options?): CaretGeometryObserver
```

Non-collapsed `Range` targets require `edge: 'start' | 'end'`. Unsupported input types throw `UnsupportedInputTypeError`; out-of-bounds positions throw `InvalidCaretPositionError`. Supported targets without current layout or a relevant selection return `null`.

Password inputs are deliberately unsupported and are rejected before their value is mirrored. See [compatibility](docs/compatibility.md), [security and privacy](docs/security-and-privacy.md), and the [architecture](docs/architecture.md).

Caret Geometry deliberately does not own collision detection, flip/shift,
portal rendering, overlay semantics, or environmental layout tracking. It
remains framework-independent, positioning-engine-independent, and has zero
runtime dependencies.

Current status: **ALPHA READY**. See [release readiness](docs/release-readiness.md) for the evidence and remaining stable-release gates.

Part of [NIPE Open Source](https://opensource.nipesolutions.com) in Browser Primitives.

## Development

```bash
npm install
npm run dev
npm run test:unit
npm run test:browser
npm run benchmark
npm run package:verify
npm run docs:build
npm run check
npm run release:dry-run
```

MIT © NIPE Solutions
