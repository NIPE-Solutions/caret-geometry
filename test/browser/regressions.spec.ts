import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/lab.html");
});

test("textarea internal scrolling changes geometry without changing source state", async ({
  page,
}) => {
  const result = await page.evaluate(() => {
    const { getCaretRect } = (window as any).__caretGeometry;
    const control = document.querySelector("textarea")!;
    control.style.cssText =
      "height:70px;width:220px;line-height:20px;overflow:auto";
    control.value = Array.from(
      { length: 12 },
      (_, index) => `line ${index}`,
    ).join("\n");
    const position = control.value.length;
    control.scrollTop = 0;
    const before = getCaretRect(control, { position });
    control.scrollTop = 80;
    const actualScroll = control.scrollTop;
    const after = getCaretRect(control, { position });
    return { before, after, actualScroll, retainedScroll: control.scrollTop };
  });
  expect(result.before).not.toBeNull();
  expect(result.after!.top - result.before!.top).toBeCloseTo(
    -result.actualScroll,
    0,
  );
  expect(result.retainedScroll).toBe(result.actualScroll);
});

test("page scrolling preserves getBoundingClientRect coordinate semantics", async ({
  page,
}) => {
  const result = await page.evaluate(() => {
    const { getCaretRect } = (window as any).__caretGeometry;
    const control = document.querySelector("textarea")!;
    document.body.style.minHeight = "2500px";
    const before = getCaretRect(control, { position: 2 });
    scrollTo(0, 300);
    const actualScroll = scrollY;
    const after = getCaretRect(control, { position: 2 });
    return { before, after, actualScroll };
  });
  expect(result.after!.top - result.before!.top).toBeCloseTo(
    -result.actualScroll,
    0,
  );
});

test("wrapping, final empty lines, tabs, trailing spaces and Unicode return finite carets", async ({
  page,
}) => {
  const fixtures = [
    "word word word    ",
    "line\n",
    "\n\n",
    "\talpha\tbeta",
    "A😀é漢字 العربية עברית",
  ];
  const results = await page.evaluate((values) => {
    const { getCaretRect } = (window as any).__caretGeometry;
    const control = document.querySelector("textarea")!;
    control.style.cssText =
      "width:150px;height:100px;white-space:pre-wrap;tab-size:7";
    return values.flatMap((value) => {
      control.value = value;
      return [0, Math.floor(value.length / 2), value.length].map((position) =>
        getCaretRect(control, { position }),
      );
    });
  }, fixtures);
  expect(results).toHaveLength(fixtures.length * 3);
  for (const rect of results) {
    expect(rect).not.toBeNull();
    expect(Number.isFinite(rect!.left)).toBe(true);
    expect(rect!.height).toBeGreaterThan(0);
  }
});

test("backward input selection follows selectionStart", async ({ page }) => {
  const result = await page.evaluate(() => {
    const { getCaretRect } = (window as any).__caretGeometry;
    const input = document.createElement("input");
    input.value = "selection direction";
    input.style.cssText = "font:16px monospace;width:260px;padding:8px";
    document.body.append(input);
    input.setSelectionRange(2, 12, "backward");
    return {
      implicit: getCaretRect(input),
      start: getCaretRect(input, { position: 2 }),
      end: getCaretRect(input, { position: 12 }),
    };
  });
  expect(result.implicit!.left).toBeCloseTo(result.start!.left, 4);
  expect(result.implicit!.left).not.toBeCloseTo(result.end!.left, 1);
});

test("non-collapsed Range requires an edge and explicit edges remain carets", async ({
  page,
}) => {
  const result = await page.evaluate(() => {
    const { getCaretRect } = (window as any).__caretGeometry;
    const editable = document.createElement("div");
    editable.contentEditable = "true";
    editable.style.cssText = "font:20px monospace;white-space:pre";
    editable.textContent = "abcdefghij";
    document.body.append(editable);
    const text = editable.firstChild!;
    const range = document.createRange();
    range.setStart(text, 1);
    range.setEnd(text, 7);
    let error = "";
    try {
      getCaretRect(range);
    } catch (reason) {
      error = String(reason);
    }
    return {
      error,
      start: getCaretRect(range, { edge: "start" }),
      end: getCaretRect(range, { edge: "end" }),
    };
  });
  expect(result.error).toContain("requires edge");
  expect(result.start!.width).toBe(0);
  expect(result.end!.left).toBeGreaterThan(result.start!.left);
});

test("virtual anchors avoid an initial origin rect and retain the last valid rect", async ({
  page,
}) => {
  const result = await page.evaluate(() => {
    const { createCaretVirtualElement } = (window as any).__caretGeometry;
    const detached = document.createElement("textarea");
    const absent = createCaretVirtualElement(detached, { position: 0 });
    const control = document.querySelector("textarea")!;
    const virtual = createCaretVirtualElement(control, { position: 2 });
    const before = virtual!.getBoundingClientRect();
    control.remove();
    const retained = virtual!.getBoundingClientRect();
    return {
      absent,
      before,
      retained,
      valid: virtual!.isValid(),
      contextIsControl: virtual!.contextElement === control,
    };
  });
  expect(result.absent).toBeNull();
  expect(result.retained).toEqual(result.before);
  expect(result.valid).toBe(false);
  expect(result.contextIsControl).toBe(true);
});

test("observer batches duplicate signals and emits null once when disconnected", async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const { observeCaretGeometry } = (window as any).__caretGeometry;
    const control = document.querySelector("textarea")!;
    const snapshots: unknown[] = [];
    const observer = observeCaretGeometry(control, (rect: unknown) =>
      snapshots.push(rect),
    );
    control.dispatchEvent(new Event("input"));
    control.dispatchEvent(new Event("keyup"));
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
    const afterInitial = snapshots.length;
    control.remove();
    observer.update();
    observer.update();
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
    const nulls = snapshots.filter((value) => value === null).length;
    observer.disconnect();
    observer.update();
    return { afterInitial, total: snapshots.length, nulls };
  });
  expect(result.afterInitial).toBe(1);
  expect(result.nulls).toBe(1);
  expect(result.total).toBe(2);
});

test("observer avoids marker mutation during active composition", async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const { observeCaretGeometry } = (window as any).__caretGeometry;
    const editable = document.createElement("div");
    editable.contentEditable = "true";
    editable.style.cssText = "min-height:24px;font:16px sans-serif";
    document.body.append(editable);
    const range = document.createRange();
    range.setStart(editable, 0);
    range.collapse(true);
    const selection = getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    let markerInsertions = 0;
    const mutations = new MutationObserver((records) => {
      for (const record of records)
        for (const node of record.addedNodes)
          if (
            node instanceof HTMLElement &&
            node.dataset.caretGeometryMarker !== undefined
          )
            markerInsertions++;
    });
    mutations.observe(editable, { childList: true, subtree: true });
    const observer = observeCaretGeometry(editable, () => {});
    editable.dispatchEvent(
      new CompositionEvent("compositionstart", { bubbles: true }),
    );
    observer.update();
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
    observer.disconnect();
    mutations.disconnect();
    return markerInsertions;
  });
  expect(result).toBe(0);
});
