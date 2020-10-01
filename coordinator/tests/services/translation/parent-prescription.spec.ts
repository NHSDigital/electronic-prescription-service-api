import {convertParentPrescription} from "../../../src/services/translation/prescription/parent-prescription"
import * as TestResources from "../../resources/test-resources"
import {xmlTest} from "../../resources/test-helpers"
import {Bundle} from "../../../src/models/fhir/fhir-resources"
import {ParentPrescription} from "../../../src/models/hl7-v3/hl7-v3-prescriptions"

describe("convertParentPrescription", () => {
  const cases = TestResources.specification.map(example => [
    example.description,
    example.fhirMessageSigned,
    example.hl7V3Message.PORX_IN020101SM31.ControlActEvent.subject.ParentPrescription as ParentPrescription
  ])

  test.each(cases)("accepts %s", (desc: string, input: Bundle) => {
    expect(() => convertParentPrescription(input)).not.toThrow()
  })

  test.each(cases)("returns correct output for %s", (desc: string, input: Bundle, output: ParentPrescription) => {
    xmlTest(convertParentPrescription(input), output)()
  })
})
