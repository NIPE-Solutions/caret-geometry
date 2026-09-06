import type { VirtualElement } from "@floating-ui/dom";
import { expect, test } from "vitest";
import type { CaretVirtualElement } from "../../src/index";

test("caret virtual elements are structurally compatible with Floating UI", () => {
  const acceptsFloatingReference: (reference: VirtualElement) => boolean = () =>
    true;
  const caret = null as CaretVirtualElement | null;
  if (caret) expect(acceptsFloatingReference(caret)).toBe(true);
  expect(caret).toBeNull();
});
