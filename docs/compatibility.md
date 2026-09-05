# Compatibility

| Target                                         | Status                         | Notes                                              |
| ---------------------------------------------- | ------------------------------ | -------------------------------------------------- |
| `input:text`, `tel`, `url`                     | Supported                      | UTF-16 position; horizontal scrolling              |
| `input:search`                                 | Supported with caveats         | Native decorations can change usable area          |
| `input:password`, `email`, `number`, date-like | Unsupported                    | Explicit error                                     |
| `textarea`                                     | Supported                      | Soft/off wrapping and internal scroll              |
| collapsed `Range`                              | Supported                      | Browser-native first                               |
| non-collapsed `Range`                          | Supported                      | Explicit start/end edge required                   |
| `Selection`                                    | Supported                      | Focus edge by default                              |
| `contenteditable`                              | Supported with caveats         | Marker fallback may be observable                  |
| Shadow DOM                                     | Supported with caveats         | Direct controls/ranges; selection discovery varies |
| iframe                                         | Supported                      | Rect is relative to the iframe viewport            |
| rotated/skewed/3D controls                     | Unsupported in stable contract | Range behavior remains browser-native              |
| vertical writing modes                         | Experimental                   | Not a stable v1 promise                            |

Output follows the same client-coordinate and zoom semantics as `getBoundingClientRect()`. It is never multiplied by device-pixel ratio. Visibility, occlusion, cross-frame conversion, selected-text geometry, and floating collision handling are outside scope.
