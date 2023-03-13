export {}

declare global {
  namespace jest {
    // eslint-disable-next-line  @typescript-eslint/no-unused-vars
    interface Matchers<R, T> {
      toContainObject(expected: Record<string, unknown>): T;
    }
  }
}
