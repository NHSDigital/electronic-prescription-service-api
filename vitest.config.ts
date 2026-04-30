import {defineConfig} from "vitest/config"
import {fileURLToPath} from "node:url"
import {dirname, resolve} from "node:path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

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
    },
    projects: [
      {
        root: resolve(__dirname, "./packages/coordinator"),
        test: {
          name: "coordinator",
          globals: true,
          environment: "node",
          include: [
            "tests/**/*.test.ts",
            "tests/**/*.spec.ts",
            "tests/**/*.test.tsx",
            "tests/**/*.spec.tsx"
          ],
          setupFiles: [
            "./vitest/setEnvVars.js",
            "./tests/vitest.setup.ts"
          ],
          pool: "forks"
        },
        resolve: {
          alias: {
            "@models": resolve(__dirname, "packages/models")
          }
        }
      },
      {
        root: resolve(__dirname, "./packages/cdk"),
        test: {
          name: "cdk",
          environment: "node",
          include: ["tests/**/*.test.ts"],
          clearMocks: true
        }
      },
      {
        root: resolve(__dirname, "./packages/models"),
        test: {
          name: "models",
          globals: true,
          environment: "node",
          include: ["**/*.{test,spec}.{ts,tsx}"],
          exclude: ["**/node_modules/**", "**/dist/**"]
        }
      },
      {
        root: resolve(__dirname, "./packages/e2e-tests"),
        test: {
          name: "e2e-tests",
          globals: true,
          environment: "node",
          include: [
            "specs/**/*.{test,spec}.{ts,tsx}",
            "**/*.{test,spec}.{ts,tsx}"
          ],
          setupFiles: ["./vitest/setEnvVars.js"],
          pool: "forks"
        },
        resolve: {
          alias: {
            "@models": resolve(__dirname, "packages/models"),
            "@coordinator": resolve(__dirname, "packages/coordinator")
          }
        }
      },
      {
        root: resolve(__dirname, "./packages/tool/site/client"),
        test: {
          name: "client",
          globals: true,
          environment: "jsdom",
          include: ["tests/**/*.{test,spec}.{ts,tsx}"],
          setupFiles: ["./tests/vitest.setup.ts"],
          testTimeout: 30000
        }
      },
      {
        root: resolve(__dirname, "./packages/tool/e2e-tests"),
        test: {
          name: "tool-e2e-tests",
          globals: true,
          environment: "node",
          include: ["**/*.{test,spec}.{ts,tsx}"],
          testTimeout: 3600000,
          hookTimeout: 3600000,
          retry: 3,
          pool: "forks"
        }
      },
      {
        root: resolve(__dirname, "./packages/tool/site/server"),
        test: {
          name: "tool-site-server",
          globals: true,
          environment: "node",
          include: ["tests/**/*.{test,spec}.{ts,tsx}", "src/**/*.{test,spec}.{ts,tsx}"]
        }
      },
      {
        root: resolve(__dirname, "./packages/fhir-schema-generation"),
        test: {
          name: "fhir-schema-generation",
          globals: true,
          environment: "node",
          include: ["tests/**/*.{test,spec}.{ts,tsx}"],
          clearMocks: true
        }
      }
    ]
  }
})
