import { expect, test } from "@playwright/test";

test("textarea positions are viewport-relative and move across lines", async ({
  page,
}) => {
  await page.goto("/lab.html");
  const result = await page.evaluate(async () => {
    const { getCaretRect } = (window as any).__caretGeometry;
    const textarea = document.querySelector("textarea")!;
    textarea.value = "first line\nsecond line";
    const first = getCaretRect(textarea, { position: 2 });
    const second = getCaretRect(textarea, { position: 15 });
    return {
      first,
      second,
      element: textarea.getBoundingClientRect().toJSON(),
    };
  });
  expect(result.first).not.toBeNull();
  expect(result.first!.left).toBeGreaterThan(result.element.left);
  expect(result.first!.top).toBeGreaterThanOrEqual(result.element.top);
  expect(result.second!.top).toBeGreaterThan(result.first!.top);
});

test("measurement preserves source state and rejects passwords before mirroring", async ({
  page,
}) => {
  await page.goto("/lab.html");
  const state = await page.evaluate(async () => {
    const api = (window as any).__caretGeometry;
    const textarea = document.querySelector("textarea")!;
    textarea.value = "private fixture\nwith scroll";
    textarea.setSelectionRange(2, 8, "backward");
    textarea.scrollTop = 4;
    const before = [
      textarea.value,
      textarea.selectionStart,
      textarea.selectionEnd,
      textarea.selectionDirection,
      textarea.scrollTop,
    ];
    api.getCaretRect(textarea);
    const password = document.createElement("input");
    password.type = "password";
    password.value = "never mirror this";
    document.body.append(password);
    let message = "";
    try {
      api.getCaretRect(password);
    } catch (error) {
      message = String(error);
    }
    return {
      before,
      after: [
        textarea.value,
        textarea.selectionStart,
        textarea.selectionEnd,
        textarea.selectionDirection,
        textarea.scrollTop,
      ],
      message,
      markers: document.querySelectorAll("[data-caret-geometry-marker]").length,
    };
  });
  expect(state.after).toEqual(state.before);
  expect(state.message).not.toContain("never mirror this");
  expect(state.markers).toBe(0);
});

test("Range, Selection focus, contenteditable, shadow controls and iframe realms resolve", async ({
  page,
}) => {
  await page.goto("/lab.html");
  const values = await page.evaluate(async () => {
    const { getCaretRect } = (window as any).__caretGeometry;
    const editable = document.querySelector("[contenteditable]")!;
    const text = editable.firstChild!;
    const range = document.createRange();
    range.setStart(text, 3);
    range.collapse(true);
    const selection = getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "open" });
    const input = document.createElement("input");
    input.value = "shadow";
    shadow.append(input);
    document.body.append(host);
    const frame = document.createElement("iframe");
    document.body.append(frame);
    const foreign = frame.contentDocument!.createElement("textarea");
    foreign.value = "frame";
    frame.contentDocument!.body.append(foreign);
    return [
      getCaretRect(range),
      getCaretRect(selection),
      getCaretRect(editable as HTMLElement),
      getCaretRect(input, { position: 2 }),
      getCaretRect(foreign, { position: 2 }),
    ].map(Boolean);
  });
  expect(values).toEqual([true, true, true, true, true]);
});
