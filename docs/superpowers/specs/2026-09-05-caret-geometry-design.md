# Caret Geometry Design

## Scope

Build `@nipe-solutions/caret-geometry`, a framework-independent browser primitive that resolves viewport-relative CSS-pixel caret rectangles for supported text controls, `Range`, `Selection`, and editable roots. It does not provide selection geometry, popup placement, editor behavior, or framework adapters.

## Public API

- `getCaretRect(target, options?)` returns `CaretRect | null`.
- Text controls accept a UTF-16 `position`; omitted positions follow the focus edge (`selectionStart` for backward selections, otherwise `selectionEnd`).
- Non-collapsed ranges require `edge: 'start' | 'end'`; collapsed ranges need no edge.
- Selections default to `focus` and may explicitly select `anchor`.
- `createCaretVirtualElement` returns `null` without an initial valid rect, then keeps its last valid rect and exposes `getCaretRect()` and `isValid()`.
- `observeCaretGeometry` batches event-driven updates, deduplicates rectangles, and returns `{ update, disconnect }`.

## Architecture

Text controls use one lazy, isolated mirror host per owner `Document`. Computed text and box styles are copied on every measurement for safe invalidation. Source text is assigned only through text nodes and cleared synchronously in `finally`; password inputs are rejected before value access. Mirror scroll positions reproduce the source control's browser-native scroll semantics.

DOM targets use a collapsed native `Range`. Selection endpoints are converted to collapsed ranges without confusing focus with ordered range end. Native rects are preferred; degenerate positions use neighboring rect inference, then a synchronous marker fallback when enabled. Marker cleanup and selection restoration are atomic. During composition, invasive fallback is disabled.

All target classification is tag/realm aware through `ownerDocument`; no import-time DOM access occurs. Coordinates always match the target browsing context's `getBoundingClientRect()` coordinate system and preserve fractional CSS pixels.

## Errors and unavailable state

Unsupported target kinds and input types throw concise typed errors. Invalid explicit positions throw `InvalidCaretPositionError`. Disconnected, unlaid-out, or selection-less supported targets return `null`. Errors never include source text.

## Compatibility policy

Stable v1 support is horizontal writing mode without rotation, skew, or 3D transforms. Translation and axis-aligned scaling are covered where browser output can be mapped reliably. `password` is unsupported; `search` is supported with caveats around native decorations. Shadow-root text controls work by direct reference; editable roots in shadow trees should use explicit Range/Selection where document selection discovery differs. Iframe coordinates remain relative to the iframe viewport.

## Website and operations

The documentation site is a Vite application whose hero and calibration lab invoke the local package implementation. Visual language uses text baselines, a live caret axis, and restrained coordinate annotation. It includes guides, API, compatibility, security/privacy, browser notes, legal links, and real-browser QA status.

GitHub Actions run formatting, lint/type checks, unit tests, Playwright Chromium/Firefox/WebKit tests, build, package verification, size checks, and docs build. A release workflow uses npm trusted publishing with provenance on version tags. Vercel hosts the site; `caret-geometry.nipesolutions.com` is attached after deployment, and GoDaddy receives the exact DNS record Vercel requests.

## Release status

The first releasable version is `0.1.0-alpha.0`. Stable status is blocked until iPhone Safari and Android Chrome manual QA are completed and recorded.
