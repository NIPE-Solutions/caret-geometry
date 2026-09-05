# Guarantees and non-guarantees

For documented targets, output is a viewport-relative CSS-pixel caret rectangle. Measurement does not change the source value, focus, text selection, scroll position, or styles. Import has no DOM side effects. The package performs no network activity and retains no copied text.

Caret Geometry is not a text editor, selection-geometry API, floating-positioning engine, visibility detector, canvas-editor adapter, or cross-document coordinate converter. If an editor exposes authoritative caret coordinates, prefer that API.
