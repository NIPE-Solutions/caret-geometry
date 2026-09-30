import type { CaretOptions } from "./types";

export type CaretTargetKind =
  "text-control" | "range" | "selection" | "editable";

const ALLOWED_KEYS: Record<CaretTargetKind, ReadonlySet<string>> = {
  "text-control": new Set(["position"]),
  range: new Set(["edge", "markerFallback"]),
  selection: new Set(["edge", "markerFallback"]),
  editable: new Set(["edge", "markerFallback"]),
};

const ALLOWED_EDGES: Partial<Record<CaretTargetKind, ReadonlySet<string>>> = {
  range: new Set(["start", "end"]),
  selection: new Set(["anchor", "focus"]),
  editable: new Set(["anchor", "focus"]),
};

export function assertOptionsForTarget(
  kind: CaretTargetKind,
  options: CaretOptions | object,
): void {
  const values = options as Record<string, unknown>;
  for (const key of Object.keys(values)) {
    if (!ALLOWED_KEYS[kind].has(key)) {
      throw new TypeError(
        'Option "' + key + '" is not valid for ' + kind + " targets.",
      );
    }
  }

  const edge = values.edge;
  if (
    edge !== undefined &&
    (typeof edge !== "string" || !ALLOWED_EDGES[kind]?.has(edge))
  ) {
    throw new TypeError(
      'Edge "' + String(edge) + '" is not valid for ' + kind + " targets.",
    );
  }

  const markerFallback = values.markerFallback;
  if (
    markerFallback !== undefined &&
    markerFallback !== "auto" &&
    markerFallback !== "never"
  ) {
    throw new TypeError(
      'Marker fallback "' +
        String(markerFallback) +
        '" is not valid for ' +
        kind +
        " targets.",
    );
  }
}
