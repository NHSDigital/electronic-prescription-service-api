import * as validator from "../../src/validators/request-validator"
import * as fhir from "../../src/model/fhir-resources"
import * as TestResources from "../resources/test-resources"
import {clone} from "../resources/test-helpers"
import * as errors from "../../src/errors/errors"

function validateValidationErrors (validationErrors: Array<errors.ValidationError>) {
  expect(validationErrors).toHaveLength(1)
  const validationError = validationErrors[0]
  expect(validationError.apiErrorCode).toEqual("INVALID_VALUE")
  expect(validationError.operationOutcomeCode).toEqual("value")
  expect(validationError.severity).toEqual("error")
}

describe("verifyBundle simple fail", () => {
  test("rejects null", () => {
    expect(validator.verifyBundle(null, false))
      .toEqual([new errors.RequestNotBundleError()])
  })

  test("rejects undefined", () => {
    expect(validator.verifyBundle(undefined, false))
      .toEqual([new errors.RequestNotBundleError()])
  })

  test("rejects object which is not a resource", () => {
    expect(validator.verifyBundle({}, false))
      .toEqual([new errors.RequestNotBundleError()])
  })

  test("rejects resource which is not a bundle", () => {
    const patient = {
      resourceType: "Patient"
    }
    expect(validator.verifyBundle(patient, false))
      .toEqual([new errors.RequestNotBundleError()])
  })

  test("rejects bundle without entries", () => {
    const bundle = {
      resourceType: "Bundle"
    }
    expect(validator.verifyBundle(bundle, false))
      .toEqual([new errors.NoEntryInBundleError()])
  })

  test("rejects bundle without id", () => {
    const bundle = {
      resourceType: "Bundle",
      entry: [] as Array<fhir.Resource>
    }
    expect(validator.verifyBundle(bundle, false))
      .toContainEqual(new errors.MissingIdError())
  })

  const semiPopulatedBundle = {
    resourceType: "Bundle",
    id: "test-bundle",
    entry: [] as Array<fhir.Resource>
  }

  const atLeastTestCases = [
    ["PractitionerRole", 1, false],
    ["Practitioner", 1, false],
    ["Organization", 1, false]
  ]

  test.each(atLeastTestCases)("rejects bundle without %p", (resource: string, requiredNumber: number, requiredSig: boolean) => {
    expect(validator.verifyBundle(semiPopulatedBundle as fhir.Bundle, requiredSig))
      .toContainEqual(new errors.ContainsAtLeastError(requiredNumber, resource))
  })

  const betweenTestCases = [
    ["MedicationRequest", 1, 4, false]
  ]

  test.each(betweenTestCases)("rejects bundle without %p", (resource: string, min: number, max: number, requiredSig: boolean) => {
    expect(validator.verifyBundle(semiPopulatedBundle as fhir.Bundle, requiredSig))
      .toContainEqual(new errors.ContainsBetweenError(min, max, resource))
  })

  const exactlyTestCases = [
    ["Patient", 1, false],
    ["Provenance", 1, true],
    ["MessageHeader", 1, false]
  ]

  test.each(exactlyTestCases)("rejects bundle without %p", (resource: string, requiredNumber: number, requiredSig: boolean) => {
    expect(validator.verifyBundle(semiPopulatedBundle as fhir.Bundle, requiredSig))
      .toContainEqual(new errors.ContainsExactlyError(requiredNumber, resource))
  })

  test("rejects bundle with two Patients", () => {
    const bundle = {
      resourceType: "Bundle",
      id: "test-bundle",
      entry: [
        {
          resource: {
            resourceType: "Patient"
          }
        },
        {
          resource: {
            resourceType: "Patient"
          }
        }
      ]
    }
    expect(validator.verifyBundle(bundle as fhir.Bundle, false))
      .toContainEqual(new errors.ContainsExactlyError(1, "Patient"))
  })

  test("rejects bundle with unusual bundle type", () => {
    const messageHeader: fhir.MessageHeader = {
      resourceType: "MessageHeader",
      eventCoding: {
        system: undefined,
        code: "garbage-message-type"
      },
      focus: undefined, sender: undefined, source: undefined
    }
    const bundle: fhir.Bundle = {
      resourceType: "Bundle",
      id: "test-bundle",
      entry: [
        {
          resource: messageHeader
        }
      ]
    }
    expect(validator.verifyBundle(bundle as fhir.Bundle, false))
      .toContainEqual(new errors.MessageTypeError())
  })
})

describe("verifyBundle simple pass", () => {
  test("verifyPrescriptionBundle accepts bundle with required Resources", () => {
    expect(validator.verifyBundle(TestResources.examplePrescription1.fhirMessageUnsigned, false))
      .toEqual([])
  })

  test("verifyPrescriptionBundle accepts bundle with required Resources when requireSignature is true", () => {
    expect(validator.verifyBundle(TestResources.examplePrescription1.fhirMessageSigned, true))
      .toEqual([])
  })
})

describe("verifyPrescriptionBundle throws INVALID_VALUE on MedicationRequest resources under certain conditions", () => {
  let bundle: fhir.Bundle
  let medicationRequests: Array<fhir.MedicationRequest>

  beforeEach(() => {
    bundle = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    medicationRequests = validator.getMatchingEntries(bundle, "MedicationRequest") as Array<fhir.MedicationRequest>
  })

  test("Should reject message where MedicationRequests have different authoredOn", () => {
    const defaultAuthoredOn = "2020-01-02T00:00:00.000Z"
    medicationRequests.forEach(medicationRequest => medicationRequest.authoredOn = defaultAuthoredOn)
    const differentAuthoredOn = "2020-01-01T00:00:00.000Z"
    medicationRequests[0].authoredOn = differentAuthoredOn

    const validationErrors = validator.verifyPrescriptionBundle(bundle)

    validateValidationErrors(validationErrors)
    expect(validationErrors).toContainEqual(new errors.MedicationRequestValueError("authoredOn", [`"${differentAuthoredOn}"`, `"${defaultAuthoredOn}"`]))
  })

  test("Should reject message where MedicationRequests have different dispenseRequest.performer", () => {
    const performer = {identifier: {system: "system", value: "value"}}
    const performerDiff = {identifier: {system: "system2", value: "value2"}}

    medicationRequests.forEach(medicationRequest => medicationRequest.dispenseRequest.performer = performer)
    medicationRequests[3].dispenseRequest.performer = performerDiff

    const validationErrors = validator.verifyPrescriptionBundle(bundle)

    validateValidationErrors(validationErrors)
    expect(validationErrors).toContainEqual(new errors.MedicationRequestValueError("dispenseRequest.performer", [`${JSON.stringify(performer)},${JSON.stringify(performerDiff)}`]))
  })

  test("Null should contribute to the count of unique values", () => {
    medicationRequests[0].groupIdentifier = null

    const validationErrors = validator.verifyPrescriptionBundle(bundle)

    validateValidationErrors(validationErrors)
  })

  test("Undefined should contribute to the count of unique values", () => {
    medicationRequests[0].groupIdentifier = undefined

    const validationErrors = validator.verifyPrescriptionBundle(bundle)

    validateValidationErrors(validationErrors)
  })
})
