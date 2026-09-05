# Architecture

`getCaretRect` classifies targets without global-realm `instanceof` checks. Form controls are measured in one lazily created, accessibility-hidden mirror per owner document. Computed typography and box properties are synchronized for each read; mirror scroll uses the browser's native semantics. Text is installed through text nodes and cleared in `finally`.

Range and editable targets prefer native collapsed Range rectangles, then neighboring glyph geometry, then an optional synchronous zero-width marker. Marker cleanup and anchor/focus restoration use `try/finally`. The fallback can be disabled with `markerFallback: 'never'` because its insertion is observable by a consumer `MutationObserver`.

Virtual elements recompute live, retain their last valid rectangle during temporary unavailability, and expose validity explicitly. Observers listen only to caret-local events, batch with `requestAnimationFrame`, and deduplicate unchanged results. Layout movement remains the positioning engine's responsibility.
