import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/accessibility',
  globalSetup: './tests/accessibility/setup.mjs',
  fullyParallel: true,
  workers: 2,
  retries: 0,
  timeout: 30000,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'artifacts/a11y-report', open: 'never' }],
  ],
  outputDir: 'artifacts/a11y-results',
  use: {
    baseURL: 'http://127.0.0.1:4337',
    browserName: 'chromium',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'mobile-light',
      use: { viewport: { width: 320, height: 800 }, colorScheme: 'light' },
    },
    {
      name: 'desktop-dark',
      use: { viewport: { width: 1280, height: 900 }, colorScheme: 'dark' },
    },
    {
      name: 'mobile-dark',
      use: { viewport: { width: 320, height: 800 }, colorScheme: 'dark' },
    },
    {
      name: 'desktop-light',
      use: { viewport: { width: 1280, height: 900 }, colorScheme: 'light' },
    },
    {
      name: 'phone-light',
      use: { viewport: { width: 390, height: 844 }, colorScheme: 'light' },
    },
    {
      name: 'tablet-dark',
      use: { viewport: { width: 768, height: 900 }, colorScheme: 'dark' },
    },
  ],
})
