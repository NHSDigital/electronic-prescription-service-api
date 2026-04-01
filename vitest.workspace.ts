import {fileURLToPath} from "url"
import {dirname, resolve} from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Vitest workspace — one inline project config per testable package.
 *
 * Packages excluded intentionally:
 *   - packages/bdd-tests        : runs via cucumber-js
 *
*/
export default [
  // ─── coordinator ────────────────────────────────────────────────────────────
  // Node environment, CommonJS TypeScript, path alias for @models,
  // environment variables injected via setEnvVars.js, custom matcher extension
  // via vitest setup file. Thread pool capped at 2 to avoid OOM errors (matching
  // the previous maxWorkers/workerIdleMemoryLimit settings).
  // The --max-old-space-size=4096 flag previously set via NODE_OPTIONS must
  // still be passed in the test script; it cannot live in the Vitest config.
  {
    root: "./packages/coordinator",
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
      pool: "forks",
      poolOptions: {
        forks: {maxForks: 1, minForks: 1}
      }
    },
    resolve: {
      alias: {
        "@models": resolve(__dirname, "packages/models")
      }
    }
  },

  // ─── cdk ────────────────────────────────────────────────────────────────────
  // Node environment, TypeScript with ESM-style output; mocks cleared between
  // tests to match previous clearMocks: true.
  {
    root: "./packages/cdk",
    test: {
      name: "cdk",
      environment: "node",
      include: ["tests/**/*.test.ts"],
      clearMocks: true
    }
  },

  // ─── models ─────────────────────────────────────────────────────────────────
  // Node environment, minimal config — no path aliases or setup files needed.
  {
    test: {
      name: "models",
      root: "./packages/models",
      globals: true,
      environment: "node",
      include: ["**/*.{test,spec}.{ts,tsx}"],
      exclude: ["**/node_modules/**", "**/dist/**"]
    }
  },

  // ─── e2e-tests (pact) ─────────────────────────────────────────────────────
  {
    root: "./packages/e2e-tests",
    test: {
      name: "e2e-tests",
      globals: true,
      environment: "node",
      include: [
        "specs/**/*.{test,spec}.{ts,tsx}",
        "**/*.{test,spec}.{ts,tsx}"
      ],
      setupFiles: ["./vitest/setEnvVars.js"],
      pool: "forks",
      poolOptions: {
        forks: {maxForks: 1, minForks: 1}
      }
    },
    resolve: {
      alias: {
        "@models": resolve(__dirname, "packages/models"),
        "@coordinator": resolve(__dirname, "packages/coordinator")
      }
    }
  },

  // ─── client (EPSAT) ─────────────────────────────────────────────────────────
  // jsdom environment for React component tests. Vite's CSS pipeline handles
  // stylesheet imports natively in jsdom mode without needing identity-obj-proxy.
  {
    root: "./packages/tool/site/client",
    test: {
      name: "client",
      globals: true,
      environment: "jsdom",
      include: ["tests/**/*.{test,spec}.{ts,tsx}"],
      setupFiles: ["./tests/vitest.setup.ts"]
    }
  },

  // ─── tool e2e tests (selenium) ────────────────────────────────────────────
  {
    test: {
      name: "tool-e2e-tests",
      root: "./packages/tool/e2e-tests",
      globals: true,
      environment: "node",
      include: ["**/*.{test,spec}.{ts,tsx}"],
      retry: 3,
      pool: "forks",
      poolOptions: {
        forks: {maxForks: 1, minForks: 1}
      }
    }
  },

  // ─── tool site server ─────────────────────────────────────────────────────
  {
    test: {
      name: "tool-site-server",
      root: "./packages/tool/site/server",
      globals: true,
      environment: "node",
      include: ["tests/**/*.{test,spec}.{ts,tsx}", "src/**/*.{test,spec}.{ts,tsx}"],
      passWithNoTests: true
    }
  },

  // ─── fhir schema generation ────────────────────────────────────────────────
  {
    root: "./packages/fhir-schema-generation",
    test: {
      name: "fhir-schema-generation",
      globals: true,
      environment: "node",
      include: ["tests/**/*.{test,spec}.{ts,tsx}"],
      clearMocks: true
    }
  }
]
