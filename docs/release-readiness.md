# Release readiness

## Classification: ALPHA READY

Version `0.1.0-alpha.0` is suitable for public experimental use. The API and browser behavior may still change before beta.

Evidence recorded on 2026-09-06:

- 11 unit checks pass.
- 33 real-browser checks pass in Linux CI: 11 each in Chromium, Firefox, and WebKit.
- The same 22 Chromium/Firefox checks pass locally.
- Packed ESM and CommonJS consumer installations pass from the actual tarball.
- SSR imports have no DOM side effects.
- The tarball has zero runtime dependencies and excludes tests, website, fixtures, and coverage output.
- The public calibration site is deployed through Vercel with a verified GoDaddy CNAME.

Beta requires a broader exactness corpus for RTL, search decorations, transforms, nested editable boundaries, and typography. Stable remains blocked by manual iPhone Safari and Android Chrome validation, real-device IME calibration, and resolution of any severe geometry regressions found during alpha.
