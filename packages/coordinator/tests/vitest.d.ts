export {}

declare module "vitest" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Assertion<T = any> {
    toContainObject(expected: Record<string, unknown>): T;
  }

  interface AsymmetricMatchersContaining {
    toContainObject(expected: Record<string, unknown>): void;
  }
}
