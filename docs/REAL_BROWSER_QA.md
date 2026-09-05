# Real-browser QA

| Platform         | Automation | Manual status                           |
| ---------------- | ---------: | --------------------------------------- |
| Chromium desktop | Playwright | Manual pending                          |
| Firefox desktop  | Playwright | Manual pending                          |
| WebKit desktop   | Playwright | Manual pending                          |
| iPhone Safari    |          — | Manual pending — stable release blocker |
| Android Chrome   |          — | Manual pending — stable release blocker |

For each platform, calibrate input, textarea, RTL, internal scroll, wrap boundaries, trailing spaces, emoji, contenteditable boundaries, pointer movement, and IME composition using `/lab.html`. Record device, OS, and browser versions. Do not promote to stable until both mobile rows are verified.
