# Real-browser QA

| Platform         | Automation                     | Manual status                           |
| ---------------- | ------------------------------ | --------------------------------------- |
| Chromium desktop | Playwright passing locally     | Manual pending                          |
| Firefox desktop  | Playwright passing locally     | Manual pending                          |
| WebKit desktop   | Playwright passing in Linux CI | Manual pending                          |
| iPhone Safari    | —                              | Manual pending — stable release blocker |
| Android Chrome   | —                              | Manual pending — stable release blocker |

For each platform, calibrate input, textarea, RTL, internal scroll, wrap boundaries, trailing spaces, emoji, contenteditable boundaries, pointer movement, and IME composition using `/lab.html`. Record device, OS, and browser versions. Do not promote to stable until both mobile rows are verified.

For the floating-popup integration, also verify typing, arrow/pointer caret
movement, textarea internal scroll, page and nested-container scroll, keyboard
open/close, and orientation changes. Confirm the cyan caret marker and orange
positioned popup remain associated. These mobile scenarios remain **Manual
pending** until recorded on physical devices.
