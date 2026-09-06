import { expect, test } from "@playwright/test";

async function relation(page: import("@playwright/test").Page, prefix: string) {
  return page.evaluate((name) => {
    const marker = document.querySelector<HTMLElement>(
      `#${name}-axis, #${name}-marker`,
    )!;
    const popup = document.querySelector<HTMLElement>(`#${name}-popup`)!;
    const caret = marker.getBoundingClientRect();
    const floating = popup.getBoundingClientRect();
    return { x: floating.left - caret.left, y: floating.top - caret.bottom };
  }, prefix);
}

test("hero composes caret-local and environmental updates", async ({
  page,
}) => {
  await page.goto("/");
  const textarea = page.locator("#hero-input");
  const marker = page.locator("#hero-axis");
  const popup = page.locator("#hero-popup");
  await expect(marker).toBeVisible();
  await expect(popup).toBeVisible();

  const beforeTyping = await marker.boundingBox();
  await textarea.press("ArrowLeft");
  await expect
    .poll(async () => (await marker.boundingBox())?.x)
    .not.toBe(beforeTyping?.x);

  const beforeScroll = await relation(page, "hero");
  await page.evaluate(() => window.scrollBy(0, 500));
  await expect
    .poll(async () => (await relation(page, "hero")).y)
    .toBeCloseTo(beforeScroll.y, 0);
});

test("nested scrolling and typography changes retain popup relation", async ({
  page,
}) => {
  await page.goto("/#stress");
  await page.locator("#stress-input").focus();
  const before = await page.locator("#stress-popup").boundingBox();
  await page
    .locator(".nested-scroll")
    .evaluate((node) => (node.scrollTop = 90));
  await expect
    .poll(async () => (await page.locator("#stress-popup").boundingBox())?.y)
    .not.toBe(before?.y);
  await expect
    .poll(async () => Math.abs((await relation(page, "stress")).y))
    .toBeLessThan(100);
  await page.locator("#stress-font").fill("24");
  await expect(page.locator("#stress-readout")).toContainText("h");
});

test("show-code controls are accessible and reveal compiled source", async ({
  page,
}) => {
  await page.goto("/");
  const toggle = page.locator(
    '[data-code-example="snapshot"] [data-code-toggle]',
  );
  expect(await toggle.getAttribute("aria-expanded")).toBe("false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#snapshot-code")).toBeVisible();
  await expect(page.locator("#snapshot-code code")).toContainText(
    "getCaretRect",
  );
  await expect(
    page.locator("#snapshot-code").getByRole("button", { name: "Copy" }),
  ).toBeVisible();
});

test("integration guide states both update responsibilities", async ({
  page,
}) => {
  await page.goto("/integrations/floating-ui.html");
  await expect(
    page.getByRole("heading", { name: "One update function" }),
  ).toBeVisible();
  await expect(page.locator("#floating-source")).toContainText("autoUpdate");
  await expect(page.locator("#floating-source")).toContainText(
    "caretObserver.disconnect",
  );
});
