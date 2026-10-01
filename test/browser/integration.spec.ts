import { expect, test } from "@playwright/test";

for (const initialWidth of [320, 1440]) {
  test(`homepage fits 320px after loading at ${initialWidth}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: initialWidth, height: 1000 });
    await page.goto("/");
    const support = page.getByRole("region", {
      name: "Useful in your project?",
      exact: true,
    });
    await support.scrollIntoViewIfNeeded();
    await support
      .getByRole("link", { name: "Explore NIPE Open Source", exact: true })
      .focus();
    await page.setViewportSize({ width: 320, height: 1000 });
    await support.scrollIntoViewIfNeeded();
    await support
      .getByRole("link", { name: "Explore NIPE Open Source", exact: true })
      .focus();
    const layout = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(layout.viewport).toBe(320);
    expect(layout.scroll).toBeLessThanOrEqual(layout.viewport);
    if (process.env.CTA_SCREENSHOT_DIR) {
      await page.screenshot({
        path: `${process.env.CTA_SCREENSHOT_DIR}/homepage-${initialWidth}-to-320-${test.info().project.name}.png`,
        fullPage: true,
      });
    }
  });
}

for (const width of [1280, 390, 320]) {
  test(`homepage support links remain usable at ${width}px`, async ({
    page,
    browserName,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const support = page.getByRole("region", {
      name: "Useful in your project?",
    });
    await expect(support).toBeVisible();
    expect(
      await support.evaluate((node) => node.previousElementSibling?.id),
    ).toBe("stress");
    const star = support.getByRole("link", {
      name: "Star on GitHub",
      exact: true,
    });
    const explore = support.getByRole("link", {
      name: "Explore NIPE Open Source",
      exact: true,
    });
    await expect(star).toHaveAttribute(
      "href",
      "https://github.com/NIPE-Solutions/caret-geometry",
    );
    await expect(explore).toHaveAttribute(
      "href",
      "https://opensource.nipesolutions.com",
    );
    for (const link of [star, explore]) {
      const bounds = await link.boundingBox();
      expect(bounds!.height).toBeGreaterThanOrEqual(44);
      expect(bounds!.width).toBeGreaterThanOrEqual(44);
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
      expect(await link.evaluate((node) => node.tagName)).toBe("A");
    }
    await star.focus();
    // macOS Safari navigates native links with Option+Tab.
    const tab =
      browserName === "webkit" && process.platform === "darwin"
        ? "Alt+Tab"
        : "Tab";
    await page.keyboard.press(tab);
    await expect(explore).toBeFocused();
    await page.keyboard.press(`Shift+${tab}`);
    await expect(star).toBeFocused();
    expect(
      await star.evaluate((node) => getComputedStyle(node).outlineStyle),
    ).not.toBe("none");
    if (process.env.CTA_SCREENSHOT_DIR) {
      await support.screenshot({
        path: `${process.env.CTA_SCREENSHOT_DIR}/${test.info().project.name}-${width}.png`,
      });
    }
  });
}

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
    page.getByRole("region", { name: "Useful in your project?" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "One update function" }),
  ).toBeVisible();
  await expect(page.locator("#floating-source")).toContainText("autoUpdate");
  await expect(page.locator("#floating-source")).toContainText(
    "caretObserver.disconnect",
  );
});

test("hero describes caret movement and exposes the complete tab icon set", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByText(
      "Click, type, or use arrow keys—the anchor follows your caret.",
    ),
  ).toBeVisible();
  await expect(
    page.getByText("Type @ to anchor an interface to this caret."),
  ).toHaveCount(0);

  const metadata = await page.evaluate(() => ({
    icons: Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel="icon"]'),
    ).map(({ href, media, type }) => ({ href, media, type })),
    apple: document.querySelector<HTMLLinkElement>(
      'link[rel="apple-touch-icon"]',
    )?.href,
    manifest: document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
      ?.href,
  }));
  expect(metadata.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        href: expect.stringContaining("/favicon.svg"),
      }),
      expect.objectContaining({
        href: expect.stringContaining("/favicon.ico"),
      }),
    ]),
  );
  expect(metadata.apple).toContain("/apple-touch-icon.png");
  expect(metadata.manifest).toContain("/site.webmanifest");
});
