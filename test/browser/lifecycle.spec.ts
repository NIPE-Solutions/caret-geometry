import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/lab.html");
});

test("invalid observer requests throw before lifecycle setup", async ({
  page,
}) => {
  const errors = await page.evaluate(() => {
    const { observeCaretGeometry } = (window as any).__caretGeometry;
    const password = document.createElement("input");
    password.type = "password";
    password.value = "secret";
    const textarea = document.createElement("textarea");
    textarea.value = "short";
    const text = document.createTextNode("range");
    document.body.append(password, textarea, text);
    const range = document.createRange();
    range.setStart(text, 0);
    range.setEnd(text, text.length);

    const capture = (run: () => void) => {
      try {
        run();
        return null;
      } catch (error) {
        return (error as Error).name;
      }
    };

    return {
      password: capture(() => observeCaretGeometry(password, () => {})),
      position: capture(() =>
        observeCaretGeometry(textarea, () => {}, { position: 10 }),
      ),
      range: capture(() => observeCaretGeometry(range, () => {})),
    };
  });

  expect(errors).toEqual({
    password: "UnsupportedInputTypeError",
    position: "InvalidCaretPositionError",
    range: "TypeError",
  });
});

test("disconnect is idempotent and cancels a queued frame", async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const nextFrame = () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    const { observeCaretGeometry } = (window as any).__caretGeometry;
    const control = document.querySelector("textarea")!;
    let callbackCount = 0;
    let disconnectThrew = false;
    let updateAfterDisconnectThrew = false;
    const observer = observeCaretGeometry(control, () => callbackCount++);
    try {
      observer.disconnect();
      observer.disconnect();
    } catch {
      disconnectThrew = true;
    }
    try {
      observer.update();
    } catch {
      updateAfterDisconnectThrew = true;
    }
    await nextFrame();
    return {
      callbackCount,
      disconnectThrew,
      updateAfterDisconnectThrew,
    };
  });

  expect(result.callbackCount).toBe(0);
  expect(result.disconnectThrew).toBe(false);
  expect(result.updateAfterDisconnectThrew).toBe(false);
});

test("duplicate signals produce one callback for each changed frame", async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const nextFrame = () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    const { observeCaretGeometry } = (window as any).__caretGeometry;
    const control = document.querySelector("textarea")!;
    control.value = "one line of text";
    control.setSelectionRange(0, 0);
    const snapshots: unknown[] = [];
    const observer = observeCaretGeometry(control, (rect: unknown) =>
      snapshots.push(rect),
    );
    control.dispatchEvent(new Event("input"));
    control.dispatchEvent(new KeyboardEvent("keyup"));
    document.dispatchEvent(new Event("selectionchange"));
    await nextFrame();
    const afterInitial = snapshots.length;

    control.setSelectionRange(8, 8);
    control.dispatchEvent(new Event("input"));
    control.dispatchEvent(new KeyboardEvent("keyup"));
    document.dispatchEvent(new Event("selectionchange"));
    await nextFrame();
    observer.disconnect();
    return { afterInitial, total: snapshots.length };
  });

  expect(result.afterInitial).toBe(1);
  expect(result.total).toBe(2);
});

test("selection observation follows movement between editable roots", async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const nextFrame = () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    const { observeCaretGeometry } = (window as any).__caretGeometry;
    const first = document.createElement("div");
    const second = document.createElement("div");
    first.contentEditable = "true";
    second.contentEditable = "true";
    first.textContent = "first root";
    second.textContent = "second root";
    second.style.marginTop = "80px";
    document.body.append(first, second);

    const selection = getSelection()!;
    selection.setBaseAndExtent(first.firstChild!, 2, first.firstChild!, 2);
    const snapshots: Array<{ left: number; top: number } | null> = [];
    const observer = observeCaretGeometry(
      selection,
      (rect: { left: number; top: number } | null) => snapshots.push(rect),
    );
    await nextFrame();

    selection.setBaseAndExtent(second.firstChild!, 3, second.firstChild!, 3);
    document.dispatchEvent(new Event("selectionchange"));
    await nextFrame();
    observer.disconnect();
    return snapshots;
  });

  expect(result).toHaveLength(2);
  expect(result[0]).not.toBeNull();
  expect(result[1]).not.toBeNull();
  expect(result[1]!.top).toBeGreaterThan(result[0]!.top);
});

test("selection composition follows movement between editable roots", async ({
  page,
}) => {
  const insertions = await page.evaluate(async () => {
    const nextFrame = () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    const { observeCaretGeometry } = (window as any).__caretGeometry;
    const first = document.createElement("div");
    const second = document.createElement("div");
    first.contentEditable = "true";
    second.contentEditable = "true";
    first.append(document.createTextNode(""));
    second.append(document.createTextNode(""));
    document.body.append(first, second);

    const selection = getSelection()!;
    selection.setBaseAndExtent(first.firstChild!, 0, first.firstChild!, 0);
    const observer = observeCaretGeometry(selection, () => {});
    await nextFrame();

    selection.setBaseAndExtent(second.firstChild!, 0, second.firstChild!, 0);
    document.dispatchEvent(new Event("selectionchange"));
    await nextFrame();

    let markerInsertions = 0;
    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (
            node instanceof HTMLElement &&
            node.dataset.caretGeometryMarker !== undefined
          ) {
            markerInsertions++;
          }
        }
      }
    });
    mutations.observe(second, { childList: true, subtree: true });

    second.dispatchEvent(
      new CompositionEvent("compositionstart", { bubbles: true }),
    );
    document.dispatchEvent(new Event("selectionchange"));
    await nextFrame();

    observer.disconnect();
    mutations.disconnect();
    return markerInsertions;
  });

  expect(insertions).toBe(0);
});

test("selection composition ends after the selection is cleared", async ({
  page,
}) => {
  const insertions = await page.evaluate(async () => {
    const nextFrame = () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    const { observeCaretGeometry } = (window as any).__caretGeometry;
    const editable = document.createElement("div");
    editable.contentEditable = "true";
    const text = document.createTextNode("");
    editable.append(text);
    document.body.append(editable);

    const selection = getSelection()!;
    selection.setBaseAndExtent(text, 0, text, 0);
    const observer = observeCaretGeometry(selection, () => {});
    await nextFrame();

    editable.dispatchEvent(
      new CompositionEvent("compositionstart", { bubbles: true }),
    );
    selection.removeAllRanges();
    editable.dispatchEvent(
      new CompositionEvent("compositionend", { bubbles: true }),
    );
    selection.setBaseAndExtent(text, 0, text, 0);

    let markerInsertions = 0;
    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (
            node instanceof HTMLElement &&
            node.dataset.caretGeometryMarker !== undefined
          ) {
            markerInsertions++;
          }
        }
      }
    });
    mutations.observe(editable, { childList: true, subtree: true });

    document.dispatchEvent(new Event("selectionchange"));
    await nextFrame();

    observer.disconnect();
    mutations.disconnect();
    return markerInsertions;
  });

  expect(insertions).toBeGreaterThan(0);
});

test("virtual elements reject detached starts and retain the last valid rect", async ({
  page,
}) => {
  const result = await page.evaluate(() => {
    const { createCaretVirtualElement } = (window as any).__caretGeometry;
    const detached = document.createElement("textarea");
    detached.value = "detached";
    const absent = createCaretVirtualElement(detached, { position: 2 });

    const control = document.createElement("textarea");
    control.value = "attached";
    control.style.cssText = "width:220px;height:80px;font:16px monospace";
    document.body.append(control);
    const virtual = createCaretVirtualElement(control, { position: 3 })!;
    const before = virtual.getBoundingClientRect();
    control.remove();
    const retained = virtual.getBoundingClientRect();
    return {
      absent,
      before,
      retained,
      valid: virtual.isValid(),
    };
  });

  expect(result.absent).toBeNull();
  expect(result.retained).toEqual(result.before);
  expect(result.valid).toBe(false);
});

test("composition suppresses marker fallback until composition ends", async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const nextFrame = () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    const { observeCaretGeometry } = (window as any).__caretGeometry;
    const editable = document.createElement("div");
    editable.contentEditable = "true";
    editable.style.cssText = "min-height:24px;font:16px sans-serif";
    const text = document.createTextNode("");
    editable.append(text);
    document.body.append(editable);
    const selection = getSelection()!;
    selection.setBaseAndExtent(text, 0, text, 0);

    let insertions = 0;
    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (
            node instanceof HTMLElement &&
            node.dataset.caretGeometryMarker !== undefined
          ) {
            insertions++;
          }
        }
      }
    });
    mutations.observe(editable, { childList: true, subtree: true });

    const observer = observeCaretGeometry(editable, () => {});
    editable.dispatchEvent(
      new CompositionEvent("compositionstart", { bubbles: true }),
    );
    await nextFrame();
    const during = insertions;
    editable.dispatchEvent(
      new CompositionEvent("compositionend", { bubbles: true }),
    );
    await nextFrame();
    const after = insertions;

    observer.disconnect();
    mutations.disconnect();
    return { during, after };
  });

  expect(result.during).toBe(0);
  expect(result.after).toBeGreaterThan(0);
});

test("marker fallback does not keep an idle observer scheduled", async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const nextFrame = () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    const { observeCaretGeometry } = (window as any).__caretGeometry;
    const editable = document.createElement("div");
    editable.contentEditable = "true";
    editable.style.cssText = "min-height:24px;font:16px sans-serif";
    const text = document.createTextNode("");
    editable.append(text);
    document.body.append(editable);
    getSelection()!.setBaseAndExtent(text, 0, text, 0);

    let markerInsertions = 0;
    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (
            node instanceof HTMLElement &&
            node.dataset.caretGeometryMarker !== undefined
          ) {
            markerInsertions++;
          }
        }
      }
    });
    mutations.observe(editable, { childList: true, subtree: true });

    const observer = observeCaretGeometry(editable, () => {});
    // Firefox delivers the selection restoration event in a later task.
    await nextFrame();
    await nextFrame();
    await nextFrame();
    const settled = markerInsertions;
    await nextFrame();
    await nextFrame();

    observer.disconnect();
    mutations.disconnect();
    return { settled, final: markerInsertions };
  });

  expect(result.settled).toBeGreaterThan(0);
  expect(result.final).toBe(result.settled);
});
