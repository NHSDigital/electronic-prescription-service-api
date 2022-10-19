export { }

declare global {
  namespace jest {
    interface Matchers<R> {
      toContainObject(expected: Record<string, unknown>): R;
    }
  }
}
