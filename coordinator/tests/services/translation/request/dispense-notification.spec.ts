import {
  convertDispenseNotification
} from "../../../../src/services/translation/request/dispensation/dispense-notification"
import * as TestResources from "../../../resources/test-resources"
import requireActual = jest.requireActual
import {MomentFormatSpecification, MomentInput} from "moment"
import * as hl7V3 from "../../../../src/models/hl7-v3"
import * as fhir from "../../../../src/models/fhir"
import {toArray} from "../../../../src/services/translation/common"

const actualMoment = requireActual("moment")
jest.mock("moment", () => ({
  utc: (input?: MomentInput, format?: MomentFormatSpecification) =>
    actualMoment.utc(input || "2020-12-18T12:34:34Z", format)
}))

describe("convertDispenseNotification", () => {
  const cases = toArray(TestResources.examplePrescription3)
    .map((example: TestResources.ExamplePrescription) => [
      example.description,
      example.fhirMessageSigned,
      // eslint-disable-next-line max-len
      example.hl7V3MessageDispense.PORX_RM024001UK31.ControlActEvent.subject.DispenseNotification as hl7V3.DispenseNotification
    ])

  test.each(cases)("accepts %s", (desc: string, input: fhir.Bundle) => {
    expect(() => convertDispenseNotification(input)).not.toThrow()
  })
})
