import { expect, it } from "vitest";
import { rectFromEdges } from "../../src/rect";

it("preserves fractional CSS pixels in a zero-width caret rect", () => {
  expect(rectFromEdges(12.25, 8.5, 21.75)).toEqual({
    x: 12.25,
    y: 8.5,
    top: 8.5,
    right: 12.25,
    bottom: 21.75,
    left: 12.25,
    width: 0,
    height: 13.25,
  });
});
