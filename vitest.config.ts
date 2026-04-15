import {defineConfig} from "vitest/config"

/**
 * Root Vitest configuration.
 *
 * Global options (reporters, coverage) defined here apply across all workspace
 * projects. Per-project environment, include patterns, aliases, and setup
 * files live in vitest.workspace.ts.
 */
export default defineConfig({
  test: {
    // Make describe/it/expect etc. available globally.
    globals: true,

    reporters: ["default", "junit"],
    outputFile: {
      junit: "junit.xml"
    },

    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "clover"],
      reportsDirectory: "coverage",
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        // Test files themselves are never included in coverage.
        "**/tests/**",
        "**/__tests__/**"
      ]
    }
  }
})
