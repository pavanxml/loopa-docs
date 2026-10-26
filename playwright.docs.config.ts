import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e-docs",
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: "http://localhost:4173",
    ...devices["Desktop Chrome"],
    channel: process.env.PLAYWRIGHT_CHANNEL ?? "chrome",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run docs:preview",
    url: "http://localhost:4173/index.html",
    reuseExistingServer: false,
    timeout: 30000,
    env: { DOCS_PORT: "4173" },
  },
});
