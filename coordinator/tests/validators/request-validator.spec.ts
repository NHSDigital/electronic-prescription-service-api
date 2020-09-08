import * as validator from "../../src/validators/request-validator"
import {Bundle, MedicationRequest, Resource} from "../../src/model/fhir-resources"
import * as TestResources from "../resources/test-resources"
import {clone} from "../resources/test-helpers"
import {ValidationError} from "../../src/validators/request-validator"

const resourceNotABundleError = [{
  message: "ResourceType must be 'Bundle' on request",
  operationOutcomeCode: "value",
  apiErrorCode: "INCORRECT_RESOURCETYPE",
  severity: "fatal"
}]

function containAtLeastError(resource: string, numberOfResources: number) {
  return {
    message: `Bundle must contain at least ${numberOfResources} resource(s) of type ${resource}`,
    operationOutcomeCode: "value",
    apiErrorCode: "MISSING_FIELD",
    severity: "error"
  }
}

function containBetweenError(resource: string, minNumberOfResources: number, maxNumberOfResources: number) {
  return {
    message: `Bundle must contain between ${minNumberOfResources} and ${maxNumberOfResources} resource(s) of type ${resource}`,
    operationOutcomeCode: "value",
    apiErrorCode: "MISSING_FIELD",
    severity: "error"
  }
}

function containExactlyError(resource: string, numberOfResources: number) {
  return {
    message: `Bundle must contain exactly ${numberOfResources} resource(s) of type ${resource}`,
    operationOutcomeCode: "value",
    apiErrorCode: "MISSING_FIELD",
    severity: "error"
  }
}

function validateValidationErrors (validationErrors: Array<ValidationError>) {
  expect(validationErrors).toHaveLength(1)
  const validationError = validationErrors[0]
  expect(validationError.apiErrorCode).toEqual("INVALID_VALUE")
  expect(validationError.operationOutcomeCode).toEqual("value")
  expect(validationError.severity).toEqual("error")
}

describe("verifyPrescriptionBundle simple fail", () => {
  test("rejects null", () => {
    expect(validator.verifyPrescriptionBundle(null, false))
      .toEqual(resourceNotABundleError)
  })

  test("rejects undefined", () => {
    expect(validator.verifyPrescriptionBundle(undefined, false))
      .toEqual(resourceNotABundleError)
  })

  test("rejects object which is not a resource", () => {
    expect(validator.verifyPrescriptionBundle({}, false))
      .toEqual(resourceNotABundleError)
  })

  test("rejects resource which is not a bundle", () => {
    const patient = {
      resourceType: "Patient"
    }
    expect(validator.verifyPrescriptionBundle(patient, false))
      .toEqual(resourceNotABundleError)
  })

  test("rejects bundle without entries", () => {
    const bundle = {
      resourceType: "Bundle"
    }
    expect(validator.verifyPrescriptionBundle(bundle, false))
      .toEqual([{
        message: "ResourceType Bundle must contain 'entry' field",
        operationOutcomeCode: "value",
        apiErrorCode: "MISSING_FIELD",
        severity: "fatal"
      }])
  })

  test("rejects bundle without id", () => {
    const bundle = {
      resourceType: "Bundle",
      entry: [] as Array<Resource>
    }
    expect(validator.verifyPrescriptionBundle(bundle, false))
      .toContainEqual({
        message: "ResourceType Bundle must contain 'id' field",
        operationOutcomeCode: "value",
        apiErrorCode: "MISSING_FIELD",
        severity: "error"
      })
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
      .toContainEqual(containAtLeastError(resource, requiredNumber))
  })

  const betweenTestCases = [
    ["MedicationRequest", 1, 4, false]
  ]

  test.each(betweenTestCases)("rejects bundle without %p", (resource: string, min: number, max: number, requiredSig: boolean) => {
    expect(validator.verifyPrescriptionBundle(semiPopulatedBundle, requiredSig))
      .toContainEqual(containBetweenError(resource, min, max))
  })

  const exactlyTestCases = [
    ["Patient", 1, false],
    ["Provenance", 1, true]
  ]

  test.each(exactlyTestCases)("rejects bundle without %p", (resource: string, requiredNumber: number, requiredSig: boolean) => {
    expect(validator.verifyPrescriptionBundle(semiPopulatedBundle, requiredSig))
      .toContainEqual(containExactlyError(resource, requiredNumber))
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
      .toContainEqual(containExactlyError("Patient", 1))
  })

  test("rejects bundle without Organization", () => {
    const bundle = {
      resourceType: "Bundle",
      id: "test-bundle",
      entry: [] as Array<Resource>
    }
    expect(validator.verifyPrescriptionBundle(bundle, false))
      .toContainEqual(containAtLeastError("Organization", 1))
  })

  test("rejects bundle without Provenance when requireSignature is true", () => {
    const bundle = {
      resourceType: "Bundle",
      entry: [] as Array<Resource>
    }
    expect(validator.verifyPrescriptionBundle(bundle, true))
      .toContainEqual(containExactlyError("Provenance", 1))
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
    medicationRequests.forEach(medicationRequest => medicationRequest.authoredOn = "2020-01-02T00:00:00.000Z")
    medicationRequests[0].authoredOn = "2020-01-01T00:00:00.000Z"

    const validationErrors = validator.verifyPrescriptionBundle(bundle, false)

    validateValidationErrors(validationErrors)
    expect(validationErrors[0].message).toEqual("Expected all MedicationRequests to have the same value for authoredOn. Received \"2020-01-01T00:00:00.000Z\",\"2020-01-02T00:00:00.000Z\".")
  })

  test("Should reject message where MedicationRequests have different dispenseRequest.performer", () => {
    const performer = {identifier: {system: "system", value: "value"}}
    const performerDiff = {identifier: {system: "system2", value: "value2"}}

    medicationRequests.forEach(medicationRequest => medicationRequest.dispenseRequest.performer = performer)
    medicationRequests[3].dispenseRequest.performer = performerDiff

    const validationErrors = validator.verifyPrescriptionBundle(bundle, false)

    validateValidationErrors(validationErrors)
    expect(validationErrors[0].message).toEqual(`Expected all MedicationRequests to have the same value for dispenseRequest.performer. Received ${JSON.stringify(performer)},${JSON.stringify(performerDiff)}.`)
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
