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
import {onlyElement, toArray} from "../../../../../src/services/translation/common"
import {convertIsoDateTimeStringToHl7V3DateTime} from "../../../../../src/services/translation/common/dateTime"
import {hl7V3, fhir} from "@models"
import pino from "pino"
import {Interval, NumericValue, PrescriptionPertinentInformation2} from "../../../../../../models/hl7-v3"
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
    const prescription = clone(TestResources.specification[1].fhirMessageSigned)
    getMedicationRequests(prescription).forEach(medicationRequest => {
      medicationRequest.dispenseRequest.validityPeriod = {
        start: "2020-12-01T10:35:00Z"
      }
    })
    const result = convertParentPrescription(prescription, logger)
    expect(result.effectiveTime._attributes.value).toEqual("20201201103500")
  })

  test("or is Provenance.signature.when if present", () => {
    const prescription = clone(TestResources.specification[1].fhirMessageSigned)
    const provenance = onlyElement(getProvenances(prescription), "Bundle.entry.ofType(Provenance)")
    const signature = onlyElement(provenance.signature, "Provenance.signature")
    const expectedTime = convertIsoDateTimeStringToHl7V3DateTime(signature.when, "Provenance.signature.when")
    const result = convertParentPrescription(prescription, logger)
    expect(result.effectiveTime).toEqual(expectedTime)
  })

  test("or is now if not overridden", () => {
    const prescription = clone(TestResources.specification[1].fhirMessageUnsigned)
    const result = convertParentPrescription(prescription, logger)
    expect(result.effectiveTime._attributes.value).toEqual("20201218123434")
  })
})

describe("HL7V3 Parent prescription ERD", () => {
  const parentPrescription = getExampleRepeatDispensingParentPrescription()
  const getPrescriptionRepeatNumber = () : Interval<NumericValue> =>
    parentPrescription.pertinentInformation1.pertinentPrescription.repeatNumber
  const getPrescriptionPertinentInformation2 = () :PrescriptionPertinentInformation2 =>
    parentPrescription
      .pertinentInformation1
      .pertinentPrescription.pertinentInformation2 as PrescriptionPertinentInformation2
  const getLineItemRepeatNumber = () : Interval<NumericValue> =>
    getPrescriptionPertinentInformation2().pertinentLineItem.repeatNumber

  const prescriptionRepeatNumberHigh = getPrescriptionRepeatNumber().high._attributes.value
  const prescriptionRepeatNumberLow = getPrescriptionRepeatNumber().low._attributes.value
  const lineItemRepeatNumberHigh = getLineItemRepeatNumber().high._attributes.value
  const lineItemRepeatNumberLow = getLineItemRepeatNumber().low._attributes.value

  test("should have high number at perscription level ", () => {
    expect(prescriptionRepeatNumberHigh).toBe("6")
  })
  test("should have low number at perscription level ", () => {
    expect(prescriptionRepeatNumberLow).toBe("1")
  })

  test("should have high number at line level", () => {
    expect(lineItemRepeatNumberHigh).toBe("6")
  })
  test("should have low number at line level", () => {
    expect(lineItemRepeatNumberLow).toBe("1")
  })

})

function getExampleRepeatDispensingParentPrescription(): hl7V3.ParentPrescription {
  return toArray(
    TestResources.getExamplePrescriptionReleaseResponse("repeat_dispensing_release_success.xml").component
  )[0].ParentPrescription
}
