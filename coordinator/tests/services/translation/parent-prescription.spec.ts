import {convertParentPrescription} from "../../../src/services/translation/prescription/parent-prescription"
import * as TestResources from "../../resources/test-resources"
import {Bundle} from "../../../src/models/fhir/fhir-resources"
import {ParentPrescription} from "../../../src/models/hl7-v3/hl7-v3-prescriptions"
import {clone} from "../../resources/test-helpers"
import {getMedicationRequests} from "../../../src/services/translation/common/getResourcesOfType"
import requireActual = jest.requireActual
import {MomentInput} from "moment"

const actualMoment = requireActual("moment")
jest.mock("moment", () => ({
  utc: (input?: MomentInput) => actualMoment.utc(input || "2020-12-18T12:34:34Z")
}))

describe("convertParentPrescription", () => {
  const cases = TestResources.specification.map(example => [
    example.description,
    example.fhirMessageSigned,
    example.hl7V3Message.PORX_IN020101SM31.ControlActEvent.subject.ParentPrescription as ParentPrescription
  ])

  test.each(cases)("accepts %s", (desc: string, input: Bundle) => {
    expect(() => convertParentPrescription(input)).not.toThrow()
  })
})

describe("effectiveTime", () => {
  test("is MedicationRequest.dispenseRequest.validityPeriod.start if present", () => {
    const prescription = clone(TestResources.examplePrescription2.fhirMessageSigned)
    getMedicationRequests(prescription).forEach(medicationRequest => {
      medicationRequest.dispenseRequest.validityPeriod = {
        start: "2020-12-01T10:35:00Z"
      }
    })
    const result = convertParentPrescription(prescription)
    expect(result.effectiveTime._attributes.value).toEqual("20201201103500")
  })

  test("or is Provenance.signature.when if present", () => {
    const prescription = clone(TestResources.examplePrescription2.fhirMessageSigned)
    const result = convertParentPrescription(prescription)
    expect(result.effectiveTime._attributes.value).toEqual("20200902113800")
  })

  test("or is now if not overridden", () => {
    const prescription = clone(TestResources.examplePrescription2.fhirMessageUnsigned)
    const result = convertParentPrescription(prescription)
    expect(result.effectiveTime._attributes.value).toEqual("20201218123434")
  })
})
