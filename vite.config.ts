import react from '@vitejs/plugin-react'
import { configDefaults, defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    // Live API checks run separately (vitest.live.config.ts), never in CI.
    exclude: [...configDefaults.exclude, '**/*.live.test.ts'],
  },
})
