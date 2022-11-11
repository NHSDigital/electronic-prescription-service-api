export {}

declare global {
  namespace jest {
    interface Matchers<R, T> {
      toContainObject(expected: Record<string, unknown>): T;
    }
  }
}
