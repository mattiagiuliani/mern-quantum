import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    hookTimeout: 30000, // 30 seconds for beforeAll/afterAll
    testTimeout: 10000,  // 10 seconds for individual tests
  },
})
