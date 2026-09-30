# Guarantees and non-guarantees

For documented targets, output is a viewport-relative CSS-pixel caret
rectangle in the target's browsing context. Measurement does not change the
source value, focus, text selection, scroll position, or styles. Temporary
marker fallback restores the original text node and selection before returning.

Observer callbacks are frame-batched and deduplicate unchanged geometry.
Disconnect is idempotent and permanently stops owned listeners and pending
frames. Virtual elements retain their last valid rectangle during temporary
measurement gaps while exposing validity separately.

Import has no DOM side effects. The package performs no network activity,
retains no copied text, and has no runtime dependencies.

Caret Geometry is not a text editor, selected-text geometry API,
floating-positioning engine, visibility detector, canvas-editor adapter, or
cross-document coordinate converter. It does not certify behavior on physical
devices or with assistive technology. If an editor exposes authoritative caret
coordinates, prefer that API.
