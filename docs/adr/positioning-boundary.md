# Caret Geometry does not own floating positioning

## Context

A caret popup changes position for two independent reasons. The logical caret
can move while its editable element stays fixed, and the surrounding layout can
move while the logical caret stays unchanged.

## Decision

Caret Geometry owns caret measurement and caret-local invalidation. A
positioning layer owns environmental invalidation and placement. Both may call
one consumer-owned update function that reads the live virtual caret reference.

## Consequences

- The runtime remains zero-dependency and framework-independent.
- Applications may choose Floating UI, another compatible positioner, or simple
  custom DOM positioning.
- Caret Geometry does not duplicate collision, flip, shift, portal, or layout
  observation systems.
- `autoUpdate()` without caret observation can miss typing and selection moves.
- caret observation without environmental auto-update can miss page or modal
  scrolling.

## Integration model

```text
caret-local change ── Caret Geometry ──┐
                                      ├── updatePosition()
environment change ── positioner ─────┘
```

The positioner reads the same long-lived virtual reference on every update.
