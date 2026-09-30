# Changelog

## 1.0.0 — 2026-09-30

- Define the stable geometry contract for text controls, Range, Selection,
  editable roots, shadow trees, and iframe-local viewport coordinates.
- Add target-specific TypeScript options and matching runtime validation.
- Make marker fallback transactional so temporary DOM changes cannot alter the
  original text node or selection.
- Guarantee idempotent observer teardown, frame batching, composition safety,
  and last-valid virtual geometry during temporary measurement gaps.
- Expand automated Chromium, Firefox, and WebKit coverage for RTL scrolling,
  scaled controls, search decorations, nested editables, and lifecycle cases.
- Verify the exact package inventory through installed ESM, CommonJS,
  server-import, and NodeNext TypeScript consumers.
- Protect npm publication with an immutable checksummed artifact, trusted
  publishing, provenance, and the `latest` distribution tag.
- Validation covers automated desktop engines only; no physical iPhone,
  Android, or human screen-reader run was performed.

## 0.1.0-alpha.0 — 2026-09-06

- Add viewport-relative caret rectangles for supported inputs and textareas.
- Add native-first Range, Selection focus-edge, and contenteditable geometry.
- Add Floating UI-compatible virtual anchors without a runtime dependency.
- Add event-driven, batched geometry observation with composition-safe fallback behavior.
- Add Chromium, Firefox, and WebKit browser regression coverage.
- Add the documentation and real-browser calibration site.
