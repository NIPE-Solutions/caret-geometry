# Release readiness

## Classification: stable

Version `1.0.0` defines the supported public API and browser contract. Changes
outside that contract remain possible and are documented in
[`compatibility.md`](compatibility.md).

Evidence recorded for the stable release:

- 27 unit tests cover validation, geometry primitives, fallback restoration,
  observer teardown, and public type integration.
- The 93-case browser matrix covers Chromium, Firefox, and WebKit. It includes
  text controls, Range, Selection, editable roots, shadow trees, iframes, RTL
  scrolling, scaled controls, search controls, observer lifecycle, and site
  integration behavior.
- Automated Chromium, Firefox, and WebKit coverage was performed, and all
  three engines remain required pull-request and release gates.
- The packed artifact is installed into isolated ESM, CommonJS, and NodeNext
  TypeScript consumers. A DOM-free server import is checked separately.
- The eight-file package inventory is exact, has zero runtime dependencies,
  and is checked against compressed and unpacked size budgets.
- Publication reuses the verified checksummed tarball and requires npm trusted
  publishing with provenance.

The release does not claim device or assistive-technology certification. No
physical iPhone or Android run was performed. No human screen-reader session
was performed. Consumers serving those environments should test their own
interaction, viewport, keyboard, zoom, and accessibility requirements.

Browser-specific behavior and geometry outside the supported contract remain
listed in [`compatibility.md`](compatibility.md) and
[`browser-notes.md`](browser-notes.md).
