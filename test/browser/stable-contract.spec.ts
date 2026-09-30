import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/lab.html");
});

test("RTL internal scrolling returns finite geometry without changing scroll state", async ({
  page,
}) => {
  const result = await page.evaluate(() => {
    const { getCaretRect } = (window as any).__caretGeometry;
    const input = document.createElement("input");
    input.dir = "rtl";
    input.value = "עברית عربية עברית عربية עברית عربية";
    input.style.cssText =
      "display:block;width:150px;padding:8px;font:18px monospace";
    document.body.append(input);
    const position = Math.floor(input.value.length / 2);
    const initialScroll = input.scrollLeft;
    const before = getCaretRect(input, { position });
    input.scrollLeft = -input.scrollWidth;
    if (input.scrollLeft === initialScroll)
      input.scrollLeft = input.scrollWidth;
    const actualScroll = input.scrollLeft;
    const after = getCaretRect(input, { position });
    return {
      before,
      after,
      initialScroll,
      actualScroll,
      retainedScroll: input.scrollLeft,
    };
  });

  expectFiniteRect(result.before);
  expectFiniteRect(result.after);
  expect(result.actualScroll).not.toBe(result.initialScroll);
  expect(Math.abs(result.after!.left - result.before!.left)).toBeGreaterThan(1);
  expect(result.retainedScroll).toBe(result.actualScroll);
});

test("scaled textarea geometry remains in the transformed viewport box", async ({
  page,
}) => {
  const result = await page.evaluate(() => {
    const { getCaretRect } = (window as any).__caretGeometry;
    const baseline = document.createElement("textarea");
    const control = document.createElement("textarea");
    baseline.value = "first line\nsecond line";
    control.value = "first line\nsecond line";
    baseline.style.cssText =
      "display:block;width:240px;height:100px;padding:8px;font:16px/20px monospace";
    control.style.cssText =
      "display:block;width:240px;height:100px;padding:8px;font:16px/20px monospace;transform:scale(1.5);transform-origin:top left";
    document.body.append(baseline, control);
    return {
      baselineFirst: getCaretRect(baseline, { position: 2 }),
      baselineSecond: getCaretRect(baseline, { position: 15 }),
      first: getCaretRect(control, { position: 2 }),
      second: getCaretRect(control, { position: 15 }),
      control: control.getBoundingClientRect().toJSON(),
    };
  });

  expectFiniteRect(result.baselineFirst);
  expectFiniteRect(result.baselineSecond);
  expectFiniteRect(result.first);
  expectFiniteRect(result.second);
  expect(result.first!.left).toBeGreaterThanOrEqual(result.control.left - 1);
  expect(result.first!.left).toBeLessThanOrEqual(result.control.right + 1);
  const baselineLineHeight =
    result.baselineSecond!.top - result.baselineFirst!.top;
  const scaledLineHeight = result.second!.top - result.first!.top;
  expect(scaledLineHeight / baselineLineHeight).toBeCloseTo(1.5, 1);
});

test("search input decorations do not prevent ordered caret coordinates", async ({
  page,
}) => {
  const result = await page.evaluate(() => {
    const { getCaretRect } = (window as any).__caretGeometry;
    const input = document.createElement("input");
    input.type = "search";
    input.value = "caret search";
    input.style.cssText =
      "display:block;width:280px;padding:8px;font:18px sans-serif";
    document.body.append(input);
    return {
      start: getCaretRect(input, { position: 0 }),
      end: getCaretRect(input, { position: input.value.length }),
    };
  });

  expectFiniteRect(result.start);
  expectFiniteRect(result.end);
  expect(result.end!.left).toBeGreaterThan(result.start!.left);
});

test("editable roots resolve only selections contained by that root", async ({
  page,
}) => {
  const result = await page.evaluate(() => {
    const { getCaretRect } = (window as any).__caretGeometry;
    const outer = document.createElement("div");
    outer.contentEditable = "true";
    outer.style.cssText = "font:18px sans-serif;min-height:30px";
    const inner = document.createElement("span");
    inner.textContent = "nested editable text";
    outer.append(inner);
    const outside = document.createTextNode("outside text");
    document.body.append(outer, outside);

    const selection = getSelection()!;
    selection.setBaseAndExtent(inner.firstChild!, 4, inner.firstChild!, 4);
    const contained = getCaretRect(outer);
    selection.setBaseAndExtent(outside, 2, outside, 2);
    const excluded = getCaretRect(outer);
    return { contained, excluded };
  });

  expectFiniteRect(result.contained);
  expect(result.excluded).toBeNull();
});

test("shadow and iframe controls use their owner-document viewport", async ({
  page,
}) => {
  const result = await page.evaluate(() => {
    const { getCaretRect } = (window as any).__caretGeometry;
    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "open" });
    const shadowInput = document.createElement("input");
    shadowInput.value = "shadow";
    shadowInput.style.cssText = "width:220px;padding:8px;font:16px monospace";
    shadow.append(shadowInput);
    document.body.append(host);

    const frame = document.createElement("iframe");
    document.body.append(frame);
    const foreign = frame.contentDocument!.createElement("textarea");
    foreign.value = "frame";
    foreign.style.cssText =
      "display:block;width:220px;height:80px;margin:24px;padding:8px;font:16px monospace";
    frame.contentDocument!.body.append(foreign);

    return {
      shadow: getCaretRect(shadowInput, { position: 3 }),
      shadowControl: shadowInput.getBoundingClientRect().toJSON(),
      frame: getCaretRect(foreign, { position: 3 }),
      frameControl: foreign.getBoundingClientRect().toJSON(),
    };
  });

  expectFiniteRect(result.shadow);
  expectFiniteRect(result.frame);
  expect(result.shadow!.left).toBeGreaterThanOrEqual(
    result.shadowControl.left - 1,
  );
  expect(result.shadow!.left).toBeLessThanOrEqual(
    result.shadowControl.right + 1,
  );
  expect(result.frame!.left).toBeGreaterThanOrEqual(
    result.frameControl.left - 1,
  );
  expect(result.frame!.left).toBeLessThanOrEqual(result.frameControl.right + 1);
});

function expectFiniteRect(
  rect: {
    left: number;
    top: number;
    bottom: number;
    height: number;
  } | null,
): void {
  expect(rect).not.toBeNull();
  for (const value of [rect!.left, rect!.top, rect!.bottom, rect!.height]) {
    expect(Number.isFinite(value)).toBe(true);
  }
  expect(rect!.height).toBeGreaterThan(0);
}
