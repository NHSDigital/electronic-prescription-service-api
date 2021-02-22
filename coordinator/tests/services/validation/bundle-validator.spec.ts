import * as validator from "../../../src/services/validation/bundle-validator"
import * as TestResources from "../../resources/test-resources"
import {clone} from "../../resources/test-helpers"
import * as errors from "../../../src/models/errors/validation-errors"
import {
  MedicationRequestIncorrectValueError,
  MedicationRequestMissingValueError,
  MedicationRequestNumberError
} from "../../../src/models/errors/validation-errors"
import {getMedicationRequests} from "../../../src/services/translation/common/getResourcesOfType"
import {getExtensionForUrl, isTruthy} from "../../../src/services/translation/common"
import * as fhir from "../../../src/models/fhir"

function validateValidationErrors (validationErrors: Array<errors.ValidationError>) {
  expect(validationErrors).toHaveLength(1)
  const validationError = validationErrors[0]
  expect(validationError.operationOutcomeCode).toEqual("value")
  expect(validationError.severity).toEqual("error")
}

describe("Bundle checks", () => {
  test("verifyBundle accepts bundle with required Resources", () => {
    expect(validator.verifyBundle(TestResources.examplePrescription1.fhirMessageUnsigned))
      .toEqual([])
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
    expect(validator.verifyBundle(bundle as fhir.Bundle))
      .toContainEqual(new errors.MessageTypeError())
  })
})

describe("verifyCommonBundle", () => {
  let bundle: fhir.Bundle
  let medicationRequests: Array<fhir.MedicationRequest>

  beforeEach(() => {
    bundle = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    medicationRequests = getMedicationRequests(bundle)
  })

  test("Should accept a prescription-order message where all MedicationRequests have intent order", () => {
    const validationErrors = validator.verifyCommonBundle(bundle)
    expect(validationErrors).toHaveLength(0)
  })

  test("Should reject a message where one MedicationRequest has intent plan", () => {
    medicationRequests[0].intent = "plan"
    const validationErrors = validator.verifyCommonBundle(bundle)
    expect(validationErrors).toHaveLength(1)
    expect(validationErrors[0]).toBeInstanceOf(MedicationRequestIncorrectValueError)
    expect(validationErrors[0].expression).toContainEqual("Bundle.entry.resource.ofType(MedicationRequest).intent")
  })

  test("Should reject a message where all MedicationRequests have intent plan", () => {
    medicationRequests.forEach(medicationRequest => medicationRequest.intent = "plan")
    const validationErrors = validator.verifyCommonBundle(bundle)
    expect(validationErrors).toHaveLength(1)
    expect(validationErrors[0]).toBeInstanceOf(MedicationRequestIncorrectValueError)
    expect(validationErrors[0].expression).toContainEqual("Bundle.entry.resource.ofType(MedicationRequest).intent")
  })
})

describe("verifyPrescriptionBundle status check", () => {
  let bundle: fhir.Bundle
  let medicationRequests: Array<fhir.MedicationRequest>

  beforeEach(() => {
    bundle = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    medicationRequests = getMedicationRequests(bundle)
  })

  test("Should accept a message where all MedicationRequests have status active", () => {
    const validationErrors = validator.verifyPrescriptionBundle(bundle)
    expect(validationErrors).toHaveLength(0)
  })

  test("Should reject a message where one MedicationRequest has status cancelled", () => {
    medicationRequests[0].status = fhir.MedicationRequestStatus.CANCELLED
    const validationErrors = validator.verifyPrescriptionBundle(bundle)
    expect(validationErrors).toHaveLength(1)
    expect(validationErrors[0]).toBeInstanceOf(MedicationRequestIncorrectValueError)
    expect(validationErrors[0].expression).toContainEqual("Bundle.entry.resource.ofType(MedicationRequest).status")
  })

  test("Should reject a message where all MedicationRequests have status cancelled", () => {
    medicationRequests.forEach(medicationRequest => medicationRequest.status = fhir.MedicationRequestStatus.CANCELLED)
    const validationErrors = validator.verifyPrescriptionBundle(bundle)
    expect(validationErrors).toHaveLength(1)
    expect(validationErrors[0]).toBeInstanceOf(MedicationRequestIncorrectValueError)
    expect(validationErrors[0].expression).toContainEqual("Bundle.entry.resource.ofType(MedicationRequest).status")
  })
})

describe("MedicationRequest consistency checks", () => {
  let bundle: fhir.Bundle
  let medicationRequests: Array<fhir.MedicationRequest>

  beforeEach(() => {
    bundle = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    medicationRequests = getMedicationRequests(bundle)
  })

  test("Should reject message where MedicationRequests have different authoredOn", () => {
    const defaultAuthoredOn = "2020-01-02T00:00:00.000Z"
    medicationRequests.forEach(medicationRequest => medicationRequest.authoredOn = defaultAuthoredOn)
    const differentAuthoredOn = "2020-01-01T00:00:00.000Z"
    medicationRequests[0].authoredOn = differentAuthoredOn

    const validationErrors = validator.verifyPrescriptionBundle(bundle)

    validateValidationErrors(validationErrors)
    expect(
      validationErrors
    ).toContainEqual(
      new errors.MedicationRequestInconsistentValueError(
        "authoredOn",
        [differentAuthoredOn, defaultAuthoredOn]
      )
    )
  })

  test("Should reject message where MedicationRequests have different dispenseRequest.performer", () => {
    const performerExtension: fhir.ReferenceExtension<fhir.PractitionerRole> = {
      valueReference: {reference: ""},
      url: ""
    }
    const performer: fhir.Performer  = {
      identifier: {
        system: "system",
        value: "value"
      },
      extension: [performerExtension]
    }
    const performerDiff: fhir.Performer = {
      identifier: {
        system: "system2",
        value: "value2"
      },
      extension: [performerExtension]
    }

    medicationRequests.forEach(medicationRequest => medicationRequest.dispenseRequest.performer = performer)
    medicationRequests[3].dispenseRequest.performer = performerDiff

    const validationErrors = validator.verifyPrescriptionBundle(bundle)

    validateValidationErrors(validationErrors)
    expect(
      validationErrors
    ).toContainEqual(
      new errors.MedicationRequestInconsistentValueError(
        "dispenseRequest.performer",
        [performer, performerDiff]
      )
    )
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

  test("Should reject message where 2 or more medication requests share an identifier", () => {
    const identifier: Array<fhir.Identifier> = [
      {
        "system": "https://fhir.nhs.uk/Id/prescription-order-item-number",
        "value": "a54219b8-f741-4c47-b662-e4f8dfa49ab5"
      }
    ]

    medicationRequests.forEach(medicationRequest => medicationRequest.identifier = identifier)

    const validationErrors = validator.verifyPrescriptionBundle(bundle)

    validateValidationErrors(validationErrors)
    expect(
      validationErrors
    ).toContainEqual(
      new errors.MedicationRequestDuplicateValueError(
        [identifier]
      )
    )
  })
})

describe("verifyRepeatDispensingPrescription", () => {
  let bundle: fhir.Bundle
  let medicationRequests: Array<fhir.MedicationRequest>
  let firstMedicationRequest: fhir.MedicationRequest

  beforeEach(() => {
    bundle = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    medicationRequests = getMedicationRequests(bundle)
    medicationRequests.forEach(
      req => req.courseOfTherapyType.coding[0].code = fhir.CourseOfTherapyTypeCode.CONTINUOUS_REPEAT_DISPENSING
    )
    firstMedicationRequest = medicationRequests[0]
  })

  test("Acute prescription gets no additional errors added", () => {
    medicationRequests.forEach(
      req => {
        req.courseOfTherapyType.coding[0].code = fhir.CourseOfTherapyTypeCode.ACUTE
        delete req.dispenseRequest.validityPeriod
        delete req.dispenseRequest.expectedSupplyDuration
      }
    )

    const returnedErrors = validator.verifyPrescriptionBundle(bundle)
    expect(returnedErrors.length).toBe(0)
  })

  test("Repeat prescription with no dispenseRequest.validityPeriod adds an error", () => {
    delete firstMedicationRequest.dispenseRequest.validityPeriod
    const returnedErrors = validator.verifyRepeatDispensingPrescription(medicationRequests)
    expect(returnedErrors.length).toBe(1)
  })

  test("Repeat prescription with no dispenseRequest.expectedSupplyDuration adds an error", () => {
    delete firstMedicationRequest.dispenseRequest.expectedSupplyDuration
    const returnedErrors = validator.verifyRepeatDispensingPrescription(medicationRequests)
    expect(returnedErrors.length).toBe(1)
  })

  test("Repeat prescription with no extension adds an error", () => {
    const extensionToRemove = getExtensionForUrl(
      firstMedicationRequest.extension,
      "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-MedicationRepeatInformation",
      "bluh"
    )
    firstMedicationRequest.extension.remove(extensionToRemove as fhir.RepeatInformationExtension)
    const returnedErrors = validator.verifyRepeatDispensingPrescription(medicationRequests)
    expect(returnedErrors.length).toBe(1)
  })
})

describe("verifyCancellationBundle", () => {
  let bundle: fhir.Bundle

  beforeEach(() => {
    const cancelExample = TestResources.specification.map(s => s.fhirMessageCancel).filter(isTruthy)[0]
    bundle = clone(cancelExample)
  })

  test("accepts a valid cancel request", () => {
    const returnedErrors = validator.verifyCancellationBundle(bundle)
    expect(returnedErrors.length).toBe(0)
  })

  test("returns an error when passed more than 1 MedicationRequest", () => {
    const medicationRequestEntry = bundle.entry.filter(entry => entry.resource.resourceType === "MedicationRequest")[0]
    bundle.entry.push(medicationRequestEntry)
    const returnedErrors = validator.verifyCancellationBundle(bundle)
    expect(returnedErrors.length).toBe(1)
    expect(returnedErrors[0]).toBeInstanceOf(MedicationRequestNumberError)
  })

  test("returns an error when status is not cancelled", () => {
    const medicationRequest = getMedicationRequests(bundle)[0]
    medicationRequest.status = fhir.MedicationRequestStatus.ACTIVE
    const returnedErrors = validator.verifyCancellationBundle(bundle)
    expect(returnedErrors.length).toBe(1)
    expect(returnedErrors[0]).toBeInstanceOf(MedicationRequestIncorrectValueError)
    expect(returnedErrors[0].expression).toContainEqual("Bundle.entry.resource.ofType(MedicationRequest).status")
  })

  test("returns an error when MedicationRequest doesn't have a statusReason", () => {
    const medicationRequest = getMedicationRequests(bundle)[0]
    delete medicationRequest.statusReason
    const returnedErrors = validator.verifyCancellationBundle(bundle)
    expect(returnedErrors.length).toBe(1)
    expect(returnedErrors[0]).toBeInstanceOf(MedicationRequestMissingValueError)
    expect(returnedErrors[0].expression).toContainEqual("Bundle.entry.resource.ofType(MedicationRequest).statusReason")
  })
})
