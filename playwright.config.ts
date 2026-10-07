import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end journey tests. Run against a production build:
 *   npm run build && npm run test:e2e
 * The webServer below starts `next start` with dev tools enabled (needed to read the
 * password-reset email from the local outbox) unless a server is already running.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npx next start -p 3000",
    url: "http://localhost:3000/api/health",
    reuseExistingServer: true,
    timeout: 120_000,
    env: { ENABLE_DEV_TOOLS: "true", CRON_SECRET: "test-cron-secret", RATE_LIMIT_MULTIPLIER: "100", NEXT_TELEMETRY_DISABLED: "1" },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1360, height: 900 } }, testIgnore: /mobile\.spec\.ts/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /mobile\.spec\.ts/ },
  ],
});
