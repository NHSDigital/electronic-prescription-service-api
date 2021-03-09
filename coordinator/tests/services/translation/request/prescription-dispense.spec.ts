import {
  getLineItemStatusCode,
  translateDispenseNotification
} from "../../../../src/services/translation/request/prescription/prescription-dispense"
import * as TestResources from "../../../resources/test-resources"
import requireActual = jest.requireActual
import {MomentFormatSpecification, MomentInput} from "moment"
import * as hl7V3 from "../../../../src/models/hl7-v3"
import * as fhir from "../../../../src/models/fhir"
import {toArray} from "../../../../src/services/translation/common"
import { clone } from "../../../resources/test-helpers"
import {
  getMedicationDispenses
} from "../../../../src/services/translation/common/getResourcesOfType"

const actualMoment = requireActual("moment")
jest.mock("moment", () => ({
  utc: (input?: MomentInput, format?: MomentFormatSpecification) =>
    actualMoment.utc(input || "2020-12-18T12:34:34Z", format)
}))

describe("convertPrescriptionDispense", () => {
  const cases = toArray(TestResources.examplePrescription3)
    .map((example: TestResources.ExamplePrescription) => [
      example.description,
      example.fhirMessageDispense,
      // eslint-disable-next-line max-len
      example.hl7V3MessageDispense.PORX_IN080101SM31.ControlActEvent.subject.DispenseNotification as hl7V3.DispenseNotification
    ])

  test.each(cases)("accepts %s", (desc: string, input: fhir.Bundle) => {
    expect(() => translateDispenseNotification(input)).not.toThrow()
  })
})

describe("getLineItemStatusCode", () => {
  const cases = [
    ["0001", "0001"],
    ["0002", "0002"],
    ["0003", "0003"],
    ["0004", "0004"],
    ["0005", "0005"],
    ["0006", "0006"],
    ["0007", "0007"]
  ]

  test.each(cases)(
    "when item status code is %p, getLineItemStatusCode returns prescription item status type code %p",
    (code: string, expected: string) => {
      const bundle = clone(TestResources.examplePrescription3.fhirMessageDispense)
      const fhirMedicationDispenses = getMedicationDispenses(bundle)
      expect(fhirMedicationDispenses.length).toBeGreaterThan(0)
      fhirMedicationDispenses.map(medicationDispense => { 
        setLineItemStatusCode(medicationDispense, code)
        medicationDispense.type.coding.forEach(coding => {
          const itemStatusCode = getLineItemStatusCode(coding)._attributes.code
          expect(itemStatusCode).toEqual(expected)
        })
      })
    }
  )
})

describe("getStatusCode", () => {
  const cases = [
    ["0001", "0001"],
    ["0002", "0002"],
    ["0003", "0003"],
    ["0004", "0004"],
    ["0005", "0005"],
    ["0006", "0006"],
    ["0007", "0007"]
  ]

  test.each(cases)(
    "when status code is %p, getStatusCode returns prescription item status type code %p",
    (code: string, expected: string) => {
      const bundle = clone(TestResources.examplePrescription3.fhirMessageDispense)
      const fhirMedicationDispenses = getMedicationDispenses(bundle)
      expect(fhirMedicationDispenses.length).toBeGreaterThan(0)
      fhirMedicationDispenses.map(medicationDispense => { 
        setStatusCode(medicationDispense, code)
        medicationDispense.type.coding.forEach(coding => {
          const itemStatusCode = getLineItemStatusCode(coding)._attributes.code
          expect(itemStatusCode).toEqual(expected)
        })
      })
    }
  )
})

function setLineItemStatusCode(
  medicationDispense: fhir.MedicationDispense,
  newDispenseStatusCodingCode: string
): void {
  medicationDispense.type.coding.forEach(coding => coding.code = newDispenseStatusCodingCode)
}

function setStatusCode(
  medicationDispense: fhir.MedicationDispense,
  newDispenseStatusCodingCode: string
): void {
  medicationDispense.type.coding.forEach(coding => coding.code = newDispenseStatusCodingCode)
}

