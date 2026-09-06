export function installCodeExamples(sources: Record<string, string>): void {
  for (const root of document.querySelectorAll<HTMLElement>(
    "[data-code-example]",
  )) {
    const source = sources[root.dataset.codeExample ?? ""];
    const toggle = root.querySelector<HTMLButtonElement>("[data-code-toggle]");
    const region = root.querySelector<HTMLElement>("[data-code-region]");
    const code = region?.querySelector<HTMLElement>("code");
    const copy = root.querySelector<HTMLButtonElement>("[data-copy]");
    if (!source || !toggle || !region || !code || !copy) continue;
    code.textContent = source.trim();
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      toggle.textContent = open ? "Hide code" : "Show code";
      region.hidden = !open;
    });
    copy.addEventListener("click", async () => {
      await navigator.clipboard.writeText(source.trim());
      copy.textContent = "Copied";
      window.setTimeout(() => (copy.textContent = "Copy"), 1500);
    });
  }
}
