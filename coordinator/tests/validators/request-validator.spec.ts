import * as validator from "../../src/validators/request-validator"
import {Bundle, MedicationRequest, Resource} from "../../src/model/fhir-resources"
import * as TestResources from "../resources/test-resources"
import {clone} from "../resources/test-helpers"
import * as errors from "../../errors/errors"

function validateValidationErrors (validationErrors: Array<errors.ValidationError>) {
  expect(validationErrors).toHaveLength(1)
  const validationError = validationErrors[0]
  expect(validationError.apiErrorCode).toEqual("INVALID_VALUE")
  expect(validationError.operationOutcomeCode).toEqual("value")
  expect(validationError.severity).toEqual("error")
}

describe("verifyPrescriptionBundle simple fail", () => {
  test("rejects null", () => {
    expect(validator.verifyPrescriptionBundle(null, false))
      .toEqual([new errors.RequestNotBundleError()])
  })

  test("rejects undefined", () => {
    expect(validator.verifyPrescriptionBundle(undefined, false))
      .toEqual([new errors.RequestNotBundleError()])
  })

  test("rejects object which is not a resource", () => {
    expect(validator.verifyPrescriptionBundle({}, false))
      .toEqual([new errors.RequestNotBundleError()])
  })

  test("rejects resource which is not a bundle", () => {
    const patient = {
      resourceType: "Patient"
    }
    expect(validator.verifyPrescriptionBundle(patient, false))
      .toEqual([new errors.RequestNotBundleError()])
  })

  test("rejects bundle without entries", () => {
    const bundle = {
      resourceType: "Bundle"
    }
    expect(validator.verifyPrescriptionBundle(bundle, false))
      .toEqual([new errors.NoEntryInBundleError()])
  })

  test("rejects bundle without id", () => {
    const bundle = {
      resourceType: "Bundle",
      entry: [] as Array<Resource>
    }
    expect(validator.verifyPrescriptionBundle(bundle, false))
      .toContainEqual(new errors.MissingIdError())
  })

  const semiPopulatedBundle = {
    resourceType: "Bundle",
    id: "test-bundle",
    entry: [] as Array<Resource>
  }

  const atLeastTestCases = [
    ["PractitionerRole", 1, false],
    ["Practitioner", 1, false],
    ["Organization", 1, false]
  ]

  test.each(atLeastTestCases)("rejects bundle without %p", (resource: string, requiredNumber: number, requiredSig: boolean) => {
    expect(validator.verifyPrescriptionBundle(semiPopulatedBundle, requiredSig))
      .toContainEqual(new errors.ContainsAtLeastError(requiredNumber, resource))
  })

  const betweenTestCases = [
    ["MedicationRequest", 1, 4, false]
  ]

  test.each(betweenTestCases)("rejects bundle without %p", (resource: string, min: number, max: number, requiredSig: boolean) => {
    expect(validator.verifyPrescriptionBundle(semiPopulatedBundle, requiredSig))
      .toContainEqual(new errors.ContainsBetweenError(min, max, resource))
  })

  const exactlyTestCases = [
    ["Patient", 1, false],
    ["Provenance", 1, true]
  ]

  test.each(exactlyTestCases)("rejects bundle without %p", (resource: string, requiredNumber: number, requiredSig: boolean) => {
    expect(validator.verifyPrescriptionBundle(semiPopulatedBundle, requiredSig))
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
    expect(validator.verifyPrescriptionBundle(bundle, false))
      .toContainEqual(new errors.ContainsExactlyError(1, "Patient"))
  })

  test("rejects bundle without Organization", () => {
    const bundle = {
      resourceType: "Bundle",
      id: "test-bundle",
      entry: [] as Array<Resource>
    }
    expect(validator.verifyPrescriptionBundle(bundle, false))
      .toContainEqual(new errors.ContainsAtLeastError(1, "Organization"))
  })

  test("rejects bundle without Provenance when requireSignature is true", () => {
    const bundle = {
      resourceType: "Bundle",
      entry: [] as Array<Resource>
    }
    expect(validator.verifyPrescriptionBundle(bundle, true))
      .toContainEqual(new errors.ContainsExactlyError(1, "Provenance"))
  })
})

describe("verifyPrescriptionBundle simple pass", () => {
  const validBundleWithoutSignature = TestResources.examplePrescription1.fhirMessageUnsigned

  test("verifyPrescriptionBundle accepts bundle with required Resources", () => {
    expect(validator.verifyPrescriptionBundle(validBundleWithoutSignature, false))
      .toEqual([])
  })

  const validBundleWithSignature = TestResources.examplePrescription1.fhirMessageSigned

  test("verifyPrescriptionBundle accepts bundle with required Resources when requireSignature is true", () => {
    expect(validator.verifyPrescriptionBundle(validBundleWithSignature, true))
      .toEqual([])
  })

  test("Should accept message where fields common to all MedicationRequests are identical", () => {
    expect(validator.verifyPrescriptionBundle(TestResources.examplePrescription1.fhirMessageUnsigned, false))
      .toEqual([])
  })
})

describe("verifyPrescriptionBundle throws INVALID_VALUE on MedicationRequest resources under certain conditions", () => {
  let bundle: Bundle
  let medicationRequests: Array<MedicationRequest>

  beforeEach(() => {
    bundle = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    medicationRequests = validator.getMatchingEntries(bundle, "MedicationRequest") as Array<MedicationRequest>
  })

  test("Should reject message where MedicationRequests have different authoredOn", () => {
    const defaultAuthoredOn = "2020-01-02T00:00:00.000Z"
    medicationRequests.forEach(medicationRequest => medicationRequest.authoredOn = defaultAuthoredOn)
    const differentAuthoredOn = "2020-01-01T00:00:00.000Z"
    medicationRequests[0].authoredOn = differentAuthoredOn

    const validationErrors = validator.verifyPrescriptionBundle(bundle, false)

    validateValidationErrors(validationErrors)
    expect(validationErrors).toContainEqual(new errors.MedicationRequestValueError("authoredOn", [`"${differentAuthoredOn}"`, `"${defaultAuthoredOn}"`]))
  })

  test("Should reject message where MedicationRequests have different dispenseRequest.performer", () => {
    const performer = {identifier: {system: "system", value: "value"}}
    const performerDiff = {identifier: {system: "system2", value: "value2"}}

    medicationRequests.forEach(medicationRequest => medicationRequest.dispenseRequest.performer = performer)
    medicationRequests[3].dispenseRequest.performer = performerDiff

    const validationErrors = validator.verifyPrescriptionBundle(bundle, false)

    validateValidationErrors(validationErrors)
    expect(validationErrors).toContainEqual(new errors.MedicationRequestValueError("dispenseRequest.performer", [`${JSON.stringify(performer)},${JSON.stringify(performerDiff)}`]))
  })

  test("Null should contribute to the count of unique values", () => {
    medicationRequests[0].groupIdentifier = null

    const validationErrors = validator.verifyPrescriptionBundle(bundle, false)

    validateValidationErrors(validationErrors)
  })

  test("Undefined should contribute to the count of unique values", () => {
    medicationRequests[0].groupIdentifier = undefined

    const validationErrors = validator.verifyPrescriptionBundle(bundle, false)

    validateValidationErrors(validationErrors)
  })
})
