import { defineConfig, devices } from '@playwright/test'

const API_URL = 'http://localhost:3333'
const APP_URL = 'http://localhost:5173'

/**
 * Tests end-to-end contra el backend real (AdonisJS + SQLite).
 *
 * Se usa el backend en modo desarrollo (su CORS solo acepta orígenes en dev)
 * y su base de datos de desarrollo: cada test crea usuarios con emails únicos.
 * Si ya hay servidores levantados en esos puertos, se reutilizan.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: APP_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node ace migration:run && node ace serve',
      cwd: '../backend',
      url: API_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'npm run dev -- --port 5173 --strictPort',
      url: APP_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
})
