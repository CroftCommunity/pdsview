import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

// The remote dev container ships a Chromium at a fixed path whose revision may
// not match the one @playwright/test pins; CI installs its own matching build.
const containerChromium = '/opt/pw-browsers/chromium';
const executablePath =
  !process.env.CI && existsSync(containerChromium) ? containerChromium : undefined;

export default defineConfig({
  testDir: 'test/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    launchOptions: executablePath ? { executablePath } : {},
  },
  webServer: {
    command: 'node scripts/serve-dist.mjs 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
});
