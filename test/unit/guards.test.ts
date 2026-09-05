import { describe, expect, it } from "vitest";
import {
  InvalidCaretPositionError,
  UnsupportedInputTypeError,
} from "../../src/errors";
import {
  assertPosition,
  getDefaultTextControlPosition,
  isSupportedInputType,
} from "../../src/guards";

describe("text control validation", () => {
  it.each(["text", "search", "tel", "url"])(
    "supports input type '%s'",
    (type) => {
      expect(isSupportedInputType(type)).toBe(true);
    },
  );

  it.each(["password", "email", "number", "date"])(
    "rejects input type %s",
    (type) => {
      expect(() => isSupportedInputType(type, true)).toThrow(
        UnsupportedInputTypeError,
      );
    },
  );

  it("rejects explicit positions outside UTF-16 string bounds without exposing text", () => {
    const secret = "private-🔒";
    expect(() => assertPosition(secret.length + 1, secret.length)).toThrow(
      InvalidCaretPositionError,
    );
    try {
      assertPosition(-1, secret.length);
    } catch (error) {
      expect(String(error)).not.toContain(secret);
    }
  });

  it("uses selectionStart as the focus edge of a backward selection", () => {
    expect(
      getDefaultTextControlPosition({
        selectionStart: 2,
        selectionEnd: 7,
        selectionDirection: "backward",
      }),
    ).toBe(2);
    expect(
      getDefaultTextControlPosition({
        selectionStart: 2,
        selectionEnd: 7,
        selectionDirection: "forward",
      }),
    ).toBe(7);
    expect(
      getDefaultTextControlPosition({
        selectionStart: 2,
        selectionEnd: 7,
        selectionDirection: "none",
      }),
    ).toBe(7);
  });
});
