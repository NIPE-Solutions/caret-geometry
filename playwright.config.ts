import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "test/browser",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1",
    url: "http://127.0.0.1:4183",
    reuseExistingServer: false,
  },
  use: { baseURL: "http://127.0.0.1:4183" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { browserName: "firefox" } },
    { name: "webkit", use: { browserName: "webkit" } },
  ],
});
