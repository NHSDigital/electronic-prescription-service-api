type MatcherContext = {
  equals: (received: unknown, expected: unknown) => boolean
  printReceived: (received: unknown) => string
  printExpected: (expected: unknown) => string
}

type MatcherResult = {
  message: () => string
  pass: boolean
}

export function toContainObject(
  this: MatcherContext,
  received: unknown,
  argument: unknown
): MatcherResult {
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
