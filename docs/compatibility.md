# Compatibility

Automated tests exercise the supported contract in desktop Chromium, Firefox,
and WebKit. These runs do not represent physical iPhone or Android devices.

| Target                                         | Status                      | Notes                                                         |
| ---------------------------------------------- | --------------------------- | ------------------------------------------------------------- |
| `input:text`, `tel`, `url`                     | Supported                   | UTF-16 position and native horizontal scrolling               |
| `input:search`                                 | Supported with caveats      | Native decorations vary by engine                             |
| `input:password`, `email`, `number`, date-like | Unsupported                 | Throws before the value is mirrored                           |
| `textarea`                                     | Supported                   | Soft/off wrapping, internal scroll, and two-dimensional scale |
| collapsed `Range`                              | Supported                   | Browser-native first                                          |
| non-collapsed `Range`                          | Supported                   | Explicit start/end edge required                              |
| `Selection`                                    | Supported                   | Focus edge by default; anchor is explicit                     |
| `contenteditable`                              | Supported with caveats      | Marker fallback is synchronous and may be observed            |
| Shadow DOM                                     | Supported with caveats      | Direct controls/ranges; selection discovery varies            |
| iframe                                         | Supported                   | Rect is relative to the iframe's viewport                     |
| rotated/skewed/3D controls                     | Outside the stable contract | Range behavior remains browser-native                         |
| vertical writing modes                         | Experimental                | Not a stable v1 promise                                       |

Output follows the same client-coordinate and zoom semantics as
`getBoundingClientRect()`. It is never multiplied by device-pixel ratio.
Visibility, occlusion, cross-frame conversion, selected-text geometry, and
floating collision handling are outside scope.
