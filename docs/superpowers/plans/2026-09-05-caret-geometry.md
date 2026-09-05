# Caret Geometry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an alpha-quality caret geometry library, browser test suite, documentation/calibration site, and automated release/deployment configuration.

**Architecture:** Form controls use a per-document isolated mirror; DOM targets use native collapsed ranges plus conservative fallback. The public facade adds live virtual anchors and an event-driven, animation-frame-batched observer.

**Tech Stack:** TypeScript, tsup, Vitest, Playwright, Vite, ESLint, Prettier, GitHub Actions, Vercel

**Spec:** `docs/superpowers/specs/2026-09-05-caret-geometry-design.md`

## Global Constraints

- Package name: `@nipe-solutions/caret-geometry`; initial version: `0.1.0-alpha.0`.
- Zero runtime dependencies and no import-time DOM side effects.
- Public rectangles are viewport-relative CSS pixels in the target browsing context.
- Password inputs are rejected before reading their values.
- Text, selection, focus, scroll, and source styles are never mutated.
- Stable release remains blocked pending real-device mobile QA.

---

### Task 1: Package foundation and validation

**Files:** Create package/tooling configs, `src/types.ts`, `src/errors.ts`, `src/guards.ts`, and unit tests.

**Interfaces:** Produces public target, options, rect, and error types plus realm-safe target classification.

- [ ] Write unit tests for target classification, supported input types, UTF-16 bounds, and backward focus selection.
- [ ] Run tests and confirm failures are caused by missing behavior.
- [ ] Implement the minimal types, errors, and guards.
- [ ] Run unit tests and type checking.

### Task 2: Range and Selection geometry

**Files:** Create `src/range.ts`, `src/rect.ts`; add unit and Playwright tests.

**Interfaces:** Produces `getRangeCaretRect(range, edge, markerFallback)` and endpoint conversion helpers.

- [ ] Write failing tests for collapsed ranges, explicit non-collapsed edges, focus endpoints, and unavailable layout.
- [ ] Verify the expected failures.
- [ ] Implement native rect selection, neighbor inference, and atomic marker cleanup/restoration.
- [ ] Run focused Chromium tests, then the cross-browser file.

### Task 3: Input and textarea mirror

**Files:** Create `src/mirror.ts`, `src/text-control.ts`; add browser fixtures/tests.

**Interfaces:** Produces `getTextControlCaretRect(control, position)` using a weak per-document host.

- [ ] Write failing geometry and invariance tests for padding, borders, wrapping, empty lines, spaces, tabs, scrolling, alignment, RTL, and privacy cleanup.
- [ ] Verify representative red failures.
- [ ] Implement the isolated reusable mirror and viewport coordinate mapping.
- [ ] Run Chromium, Firefox, and WebKit tests with tolerances based on invariants.

### Task 4: Public dispatch and editable roots

**Files:** Create `src/get-caret-rect.ts`, `src/index.ts`; extend browser tests.

**Interfaces:** Produces overloaded `getCaretRect(target, options?)` and the complete public export boundary.

- [ ] Write failing API tests for every target category and error/null semantics.
- [ ] Verify failures.
- [ ] Implement realm-aware dispatch and editable-root containment validation.
- [ ] Run unit, browser, type, and SSR import tests.

### Task 5: Virtual anchors and observation

**Files:** Create `src/virtual.ts`, `src/observe.ts`; add unit/browser tests.

**Interfaces:** Produces `createCaretVirtualElement` and `observeCaretGeometry`.

- [ ] Write failing tests for no initial `0,0`, last-valid retention, context elements, batching, deduplication, null transitions, composition, update, and disconnect.
- [ ] Verify failures.
- [ ] Implement live anchors and scoped event listeners/observers without polling.
- [ ] Run focused and full tests.

### Task 6: Documentation and calibration website

**Files:** Create `site/`, documentation pages, examples, and integration checks.

**Interfaces:** Consumes public exports only; produces the public docs site.

- [ ] Write docs/example export validation tests.
- [ ] Verify failures.
- [ ] Build the live hero, calibration lab, mention/slash/Floating UI examples, guides, matrices, legal links, and responsive accessible styling.
- [ ] Build and visually inspect the site at desktop and mobile widths.

### Task 7: Quality, packaging, and release automation

**Files:** Create CI/release workflows, benchmark/package scripts, issue templates, security policy, and remaining maintainer docs.

**Interfaces:** Produces actual commands for `check`, browser QA, benchmark, pack verification, docs, and release dry run.

- [ ] Add failing artifact/export/package assertions.
- [ ] Implement packaging and CI/release workflows with minimal permissions and npm provenance.
- [ ] Run the full quality gate, pack and inspect the tarball, and record measured sizes/performance.

### Task 8: Repository and hosting integration

**Files:** Create Vercel configuration and repository metadata.

**Interfaces:** Produces the GitHub repository, Vercel project/deployment, custom-domain attachment, and GoDaddy DNS record.

- [ ] Push validated source to `NIPE-Solutions/caret-geometry`.
- [ ] Deploy the site to Vercel and attach `caret-geometry.nipesolutions.com`.
- [ ] Apply the exact required DNS record in GoDaddy and verify resolution/TLS.
- [ ] Configure npm trusted publishing; publish only when the alpha quality gate and account authority are satisfied.
