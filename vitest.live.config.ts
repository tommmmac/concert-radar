import { defineConfig } from 'vitest/config'

// Live checks against the real APIs (`npm run test:live`), run daily by
// .github/workflows/api-health.yml. Kept out of `npm test` (see
// vite.config.ts) — they need real keys, spend quota, and can fail for
// reasons outside this repo.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.live.test.ts'],
    testTimeout: 30_000,
    // A single network blip shouldn't send a failure email; a real API
    // change fails every attempt.
    retry: 2,
  },
})
