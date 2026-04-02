import {defineConfig} from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    clearMocks: true,
    include: [
      "**/tests/**/*.test.ts",
      "**/__tests__/**/*.test.js?(x)",
      "**/__tests__/**/*.test.ts?(x)"
    ],
    coverage: {
      enabled: true,
      provider: "v8",
      reportsDirectory: "coverage",
      reporter: ["lcov", "text", "clover"]
    }
  }
})
