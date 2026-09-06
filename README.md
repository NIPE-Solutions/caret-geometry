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

Rects use viewport-relative CSS pixels matching `getBoundingClientRect()` in the target's browsing context. Explicit text-control positions are UTF-16 string indices. Selection defaults to its focus endpoint; a backward input selection defaults to `selectionStart`.

## API

```ts
getCaretRect(target, options?): CaretRect | null
createCaretVirtualElement(target, options?): CaretVirtualElement | null
observeCaretGeometry(target, callback, options?): CaretGeometryObserver
```

Non-collapsed `Range` targets require `edge: 'start' | 'end'`. Unsupported input types throw `UnsupportedInputTypeError`; out-of-bounds positions throw `InvalidCaretPositionError`. Supported targets without current layout or a relevant selection return `null`.

Password inputs are deliberately unsupported and are rejected before their value is mirrored. See [compatibility](docs/compatibility.md), [security and privacy](docs/security-and-privacy.md), and the [architecture](docs/architecture.md).

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
