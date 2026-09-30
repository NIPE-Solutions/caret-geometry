# Browser QA

| Platform         | Automated coverage               | Manual coverage                  |
| ---------------- | -------------------------------- | -------------------------------- |
| Chromium desktop | Required Playwright matrix       | Not part of the release evidence |
| Firefox desktop  | Required Playwright matrix       | Not part of the release evidence |
| WebKit desktop   | Required Playwright matrix       | Not part of the release evidence |
| iPhone Safari    | No physical-device run performed | Not performed                    |
| Android Chrome   | No physical-device run performed | Not performed                    |

The automated matrix exercises inputs, textareas, RTL and internal scrolling,
wrap boundaries, trailing spaces, Unicode, contenteditable boundaries, shadow
trees, iframes, selection movement, and composition lifecycle behavior. WebKit
automation is not evidence from a physical iPhone or iPad.

No human screen-reader session was performed. The library does not render an
interface or change focus semantics, but applications remain responsible for
the accessibility of popups and other UI positioned from its geometry.

For application-specific qualification, use `/lab.html` to test the required
devices and browsers. Include keyboard appearance, zoom, orientation changes,
page and nested-container scrolling, typography, pointer selection, and IME
composition where those conditions apply.
