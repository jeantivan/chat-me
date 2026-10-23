import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60000,
  fullyParallel: false,
  retries: 0,
  workers: 1,
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "node ../server/dist/index.js",
      port: 3001,
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
      env: {
        PORT: "3001",
        DATABASE_URL: "postgres://postgres:postgres@localhost:5434/chat_me",
        REDIS_URL: "redis://localhost:6379",
      },
    },
    {
      command: "pnpm dev",
      port: 5173,
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
  ],
});
