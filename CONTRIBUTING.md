# Contributing

Install with `npm ci`, then run:

```bash
npm run check
npm run test:browser
```

Geometry changes must include a browser regression that fails before the fix
and passes in Chromium, Firefox, and WebKit. Browser-specific workarounds must
be documented in [`docs/browser-notes.md`](docs/browser-notes.md) with an
associated test and a removal criterion. Public API changes must include type
tests and documentation.

Keep commits focused and explain observable behavior in the pull request. Use
only synthetic text in issues and fixtures. Never submit passwords, tokens,
private messages, customer content, or other sensitive field values.

Maintainers publish from a GitHub release after the protected quality and
browser checks pass. Do not publish a locally built tarball.
