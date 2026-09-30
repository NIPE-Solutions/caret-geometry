import { describe, expect, it } from "vitest";
import { observeCaretGeometry } from "../../src/observe";
import { assertOptionsForTarget } from "../../src/options";

describe("target-specific caret options", () => {
  it.each([
    ["text-control", { position: 2 }],
    ["range", { edge: "start", markerFallback: "never" }],
    ["selection", { edge: "anchor" }],
    ["editable", { edge: "focus", markerFallback: "auto" }],
  ] as const)("accepts %s options", (kind, options) => {
    expect(() => assertOptionsForTarget(kind, options)).not.toThrow();
  });

  it.each([
    ["text-control", { edge: "start" }],
    ["text-control", { markerFallback: "never" }],
    ["range", { position: 1 }],
    ["range", { edge: "focus" }],
    ["selection", { edge: "end" }],
    ["editable", { position: 1 }],
  ] as const)("rejects options that do not belong to %s", (kind, options) => {
    expect(() => assertOptionsForTarget(kind, options)).toThrow(TypeError);
  });

  it("rejects invalid observer options synchronously", () => {
    const range = {
      cloneRange() {},
      startContainer: { nodeType: 3, parentElement: null },
    } as unknown as Range;

    expect(() =>
      observeCaretGeometry(range, () => {}, {
        // @ts-expect-error Exercise the JavaScript runtime boundary.
        edge: "focus",
      }),
    ).toThrow(TypeError);
  });
});
