# Architecture

`getCaretRect` classifies targets without global-realm `instanceof` checks. Form controls are measured in one lazily created, accessibility-hidden mirror per owner document. Computed typography and box properties are synchronized for each read; mirror scroll uses the browser's native semantics. Text is installed through text nodes and cleared in `finally`.

Range and editable targets prefer native collapsed Range rectangles, then neighboring glyph geometry, then an optional synchronous zero-width marker. Marker cleanup and anchor/focus restoration use `try/finally`. The fallback can be disabled with `markerFallback: 'never'` because its insertion is observable by a consumer `MutationObserver`.

Virtual elements recompute live, retain their last valid rectangle during temporary unavailability, and expose validity explicitly. Observers listen only to caret-local events, batch with `requestAnimationFrame`, and deduplicate unchanged results. Layout movement remains the positioning engine's responsibility.

## Positioning boundary

> Caret Geometry tracks the caret. Your positioning engine tracks the world
> around it.

| Responsibility                                                                     | Owner                     |
| ---------------------------------------------------------------------------------- | ------------------------- |
| Caret measurement                                                                  | Caret Geometry            |
| Caret-local invalidation (typing, selection, composition, internal control scroll) | Caret Geometry            |
| Environmental invalidation (page/ancestor scroll, resize, layout shift)            | Positioning layer         |
| Floating placement, collision, flip and shift                                      | Positioning layer         |
| Portal, dismissal, focus and application semantics                                 | Overlay/application layer |

The recommended composition creates one virtual caret reference and one update
function. `observeCaretGeometry()` and the positioner's environmental
auto-update both invoke that function. `contextElement` gives a positioner the
real editable element for scroll, clipping, and layout context; it does not
signal that typing moved the caret.

Floating UI is a development/docs integration dependency only. React Anchored
Layer is neither a runtime dependency nor currently a compatible virtual-anchor
consumer. The Caret Geometry package has zero runtime dependencies.

See [the positioning-boundary ADR](adr/positioning-boundary.md).
