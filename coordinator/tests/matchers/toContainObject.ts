// jest.expect matcher for objects within arrays
// https://medium.com/@andrei.pfeiffer/jest-matching-objects-in-array-50fe2f4d6b98
export function toContainObject(
  this: jest.MatcherContext,
  received: unknown,
  argument: unknown
): jest.CustomMatcherResult {
  const pass = this.equals(received,
    expect.arrayContaining([
      expect.objectContaining(argument)
    ])
  )

  if (pass) {
    return {
      message: () => (`expected ${this.printReceived(received)} not to contain object ${this.printExpected(argument)}`),
      pass: true
    }
  } else {
    return {
      message: () => (`expected ${this.printReceived(received)} to contain object ${this.printExpected(argument)}`),
      pass: false
    }
  }
}
