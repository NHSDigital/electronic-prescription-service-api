import {
  convertParentPrescription
} from "../../../../../src/services/translation/request/prescribe/parent-prescription"
import * as TestResources from "../../../../resources/test-resources"
import {clone} from "../../../../resources/test-helpers"
import {
  getMedicationRequests,
  getProvenances
} from "../../../../../src/services/translation/common/getResourcesOfType"
import requireActual = jest.requireActual
import {MomentFormatSpecification, MomentInput} from "moment"
import {onlyElement} from "../../../../../src/services/translation/common"
import {convertIsoDateTimeStringToHl7V3DateTime} from "../../../../../src/services/translation/common/dateTime"
import {hl7V3, fhir} from "@models"
import pino from "pino"

const logger = pino()

const actualMoment = requireActual("moment")
jest.mock("moment", () => ({
  utc: (input?: MomentInput, format?: MomentFormatSpecification) =>
    actualMoment.utc(input || "2020-12-18T12:34:34Z", format)
}))

describe("convertParentPrescription", () => {
  const cases = TestResources.specification.map(example => [
    example.description,
    example.fhirMessageSigned,
    example.hl7V3Message.PORX_IN020101SM31.ControlActEvent.subject.ParentPrescription as hl7V3.ParentPrescription
  ])

  test.each(cases)("accepts %s", (desc: string, input: fhir.Bundle) => {
    expect(() => convertParentPrescription(input, logger)).not.toThrow()
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
    const result = convertParentPrescription(prescription, logger)
    expect(result.effectiveTime._attributes.value).toEqual("20201201103500")
  })

  test("or is Provenance.signature.when if present", () => {
    const prescription = clone(TestResources.examplePrescription2.fhirMessageSigned)
    const provenance = onlyElement(getProvenances(prescription), "Bundle.entry.ofType(Provenance)")
    const signature = onlyElement(provenance.signature, "Provenance.signature")
    const expectedTime = convertIsoDateTimeStringToHl7V3DateTime(signature.when, "Provenance.signature.when")
    const result = convertParentPrescription(prescription, logger)
    expect(result.effectiveTime).toEqual(expectedTime)
  })

  test("or is now if not overridden", () => {
    const prescription = clone(TestResources.examplePrescription2.fhirMessageUnsigned)
    const result = convertParentPrescription(prescription, logger)
    expect(result.effectiveTime._attributes.value).toEqual("20201218123434")
  })
})
