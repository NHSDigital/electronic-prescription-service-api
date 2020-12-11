import * as validator from "../../../src/services/validation/bundle-validator"
import * as fhir from "../../../src/models/fhir/fhir-resources"
import * as TestResources from "../../resources/test-resources"
import {clone} from "../../resources/test-helpers"
import * as errors from "../../../src/models/errors/validation-errors"
import {getMedicationRequests} from "../../../src/services/translation/common/getResourcesOfType"
import {CourseOfTherapyTypeCode} from "../../../src/services/translation/prescription/course-of-therapy-type"
import {getExtensionForUrl} from "../../../src/services/translation/common"
import {RepeatInformationExtension} from "../../../src/models/fhir/fhir-resources"

function validateValidationErrors (validationErrors: Array<errors.ValidationError>) {
  expect(validationErrors).toHaveLength(1)
  const validationError = validationErrors[0]
  expect(validationError.operationOutcomeCode).toEqual("value")
  expect(validationError.severity).toEqual("error")
}

describe("Bundle checks", () => {
  test("verifyPrescriptionBundle accepts bundle with required Resources", () => {
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

describe("MedicationRequest checks", () => {
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
      new errors.MedicationRequestValueError(
        "authoredOn",
        [differentAuthoredOn, defaultAuthoredOn]
      )
    )
  })

  test("Should reject message where MedicationRequests have different dispenseRequest.performer", () => {
    const performerExtension = {valueReference: {}, url: {}} as fhir.ReferenceExtension<fhir.PractitionerRole>
    const performer = {
      identifier: {
        system: "system",
        value: "value"
      },
      extension: [performerExtension]
    } as fhir.Performer
    const performerDiff = {
      identifier: {
        system: "system2",
        value: "value2"
      },
      extension: [performerExtension]
    } as fhir.Performer

    medicationRequests.forEach(medicationRequest => medicationRequest.dispenseRequest.performer = performer)
    medicationRequests[3].dispenseRequest.performer = performerDiff

    const validationErrors = validator.verifyPrescriptionBundle(bundle)

    validateValidationErrors(validationErrors)
    expect(
      validationErrors
    ).toContainEqual(
      new errors.MedicationRequestValueError(
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
})

describe("verifyRepeatDispensingPrescription", () => {
  let bundle: fhir.Bundle
  let medicationRequests: Array<fhir.MedicationRequest>
  let firstMedicationRequest: fhir.MedicationRequest

  beforeEach(() => {
    bundle = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    medicationRequests = getMedicationRequests(bundle)
    medicationRequests.forEach(
      req => req.courseOfTherapyType.coding[0].code = CourseOfTherapyTypeCode.CONTINUOUS_REPEAT_DISPENSING
    )
    firstMedicationRequest = medicationRequests[0]
  })

  test("Acute prescription gets no additional errors added", () => {
    medicationRequests.forEach(
      req => {
        req.courseOfTherapyType.coding[0].code = CourseOfTherapyTypeCode.ACUTE
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
      "https://fhir.nhs.uk/R4/StructureDefinition/Extension-UKCore-MedicationRepeatInformation",
      "bluh"
    )
    firstMedicationRequest.extension.remove(extensionToRemove as RepeatInformationExtension)
    const returnedErrors = validator.verifyRepeatDispensingPrescription(medicationRequests)
    expect(returnedErrors.length).toBe(1)
  })
})

describe("verifyCancellationBundle", () => {
  let bundle: fhir.Bundle

  beforeEach(() => {
    bundle = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
  })

  test("returns an error when passed more than 1 MedicationRequest", () => {
    const returnedErrors = validator.verifyCancellationBundle(bundle)
    expect(returnedErrors.length).toBeGreaterThan(0)
  })

  test("returns an error when MedicationRequest doesn't have a statusReason", () => {
    const medicationRequestEntries = bundle.entry.filter((x) => x.resource.resourceType === "MedicationRequest")
    medicationRequestEntries.slice(1).forEach(x => bundle.entry.remove(x))
    delete (medicationRequestEntries[0].resource as fhir.MedicationRequest).statusReason
    const returnedErrors = validator.verifyCancellationBundle(bundle)
    expect(returnedErrors.length).toBeGreaterThan(0)
  })
})
