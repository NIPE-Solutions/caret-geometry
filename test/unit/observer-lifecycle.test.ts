import { expect, it } from "vitest";
import { observeCaretGeometry } from "../../src/observe";

it("disconnects a queued observer exactly once and remains inert", () => {
  let scheduled: FrameRequestCallback | undefined;
  let cancelCount = 0;
  let callbackCount = 0;
  const view = {
    requestAnimationFrame(callback: FrameRequestCallback) {
      scheduled = callback;
      return 7;
    },
    cancelAnimationFrame(id: number) {
      expect(id).toBe(7);
      cancelCount++;
    },
  };
  const document = {
    defaultView: view,
    addEventListener() {},
    removeEventListener() {},
  };
  const target = {
    nodeType: 1,
    tagName: "TEXTAREA",
    value: "",
    selectionStart: 0,
    selectionEnd: 0,
    selectionDirection: "none",
    ownerDocument: document,
    isContentEditable: false,
    addEventListener() {},
    removeEventListener() {},
  };

  const observer = observeCaretGeometry(
    target as unknown as HTMLTextAreaElement,
    () => callbackCount++,
  );
  expect(scheduled).toBeTypeOf("function");

  expect(() => observer.disconnect()).not.toThrow();
  expect(() => observer.disconnect()).not.toThrow();
  expect(() => observer.update()).not.toThrow();
  scheduled!(0);

  expect(cancelCount).toBe(1);
  expect(callbackCount).toBe(0);
});
