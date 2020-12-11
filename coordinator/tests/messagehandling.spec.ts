import {Boom, boomify} from "@hapi/boom"
import {FhirMessageProcessingError} from "../src/models/errors/processing-errors"

describe("Message handling", () => {
  test("Boom messages are handled correctly", () => {
    const message = testFunction(new Boom("An Error"))
    expect(message).toBe("error was a boom")
  })

  test("FHIR messages are handled correctly", () => {
    const boom = boomify(new FhirMessageProcessingError("ex", "ec"))
    const message = testFunction(boom)
    expect(message).toBe("message was a FHIR error")
  })
})

function testFunction (error: any): string { // eslint-disable-line
  let message = ""
  if (error instanceof Boom) {
    message = "error was a boom"
    if (error instanceof FhirMessageProcessingError) {
      message = "message was a FHIR error"
    }
  }
  return message
}
