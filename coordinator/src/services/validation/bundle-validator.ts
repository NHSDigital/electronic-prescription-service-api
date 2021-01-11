import * as fhir from "../../models/fhir/fhir-resources"
import * as errors from "../../models/errors/validation-errors"
import {identifyMessageType, MessageType} from "../../routes/util"
import {getMedicationRequests} from "../translation/common/getResourcesOfType"
import {applyFhirPath} from "./fhir-path"
import {getUniqueValues} from "./util"
import {CourseOfTherapyTypeCode, getCourseOfTherapyTypeCode} from "../translation/prescription/course-of-therapy-type"
import {getExtensionForUrlOrNull, isTruthy} from "../translation/common"
import {MedicationRequestIncorrectValueError} from "../../models/errors/validation-errors"

// Validate Status
export function getStatusCode(validation: Array<errors.ValidationError>): number {
  return validation.length > 0 ? 400 : 200
}

export function verifyBundle(bundle: fhir.Bundle): Array<errors.ValidationError> {
  const messageType = identifyMessageType(bundle)
  if (!verifyMessageType(messageType)) {
    return [new errors.MessageTypeError()]
  }

  const commonErrors = verifyCommonBundle(bundle)

  const messageTypeSpecificErrors = messageType === MessageType.PRESCRIPTION
    ? verifyPrescriptionBundle(bundle)
    : verifyCancellationBundle(bundle)

  return [
    ...commonErrors,
    ...messageTypeSpecificErrors
  ]
}

function verifyMessageType(messageType: string): messageType is MessageType {
  return messageType === MessageType.PRESCRIPTION || messageType === MessageType.CANCELLATION
}

export function verifyCommonBundle(bundle: fhir.Bundle): Array<errors.ValidationError> {
  const incorrectValueErrors = []

  const medicationRequests = getMedicationRequests(bundle)
  if (medicationRequests.some(medicationRequest => medicationRequest.intent !== "order")) {
    incorrectValueErrors.push(new MedicationRequestIncorrectValueError("intent", "order"))
  }

  return incorrectValueErrors
}

export function verifyPrescriptionBundle(bundle: fhir.Bundle): Array<errors.ValidationError> {
  const medicationRequests = getMedicationRequests(bundle)

  const incorrectValueErrors = []
  if (medicationRequests.some(medicationRequest => medicationRequest.status !== "active")) {
    incorrectValueErrors.push(new MedicationRequestIncorrectValueError("status", "active"))
  }

  const fhirPaths = [
    "groupIdentifier",
    "category",
    "authoredOn",
    "subject",
    "requester",
    "dispenseRequest.performer",
    "dispenseRequest.validityPeriod",
    "dispenseRequest.expectedSupplyDuration",
    'dispenseRequest.extension("https://fhir.nhs.uk/R4/StructureDefinition/Extension-performerSiteType")',
    'extension("https://fhir.nhs.uk/R4/StructureDefinition/Extension-DM-prescriptionType")',
    'extension("https://fhir.nhs.uk/R4/StructureDefinition/Extension-DM-ResponsiblePractitioner")',
    'extension("https://fhir.nhs.uk/R4/StructureDefinition/Extension-UKCore-MedicationRepeatInformation")'
  ]
  const inconsistentValueErrors = fhirPaths
    .map((fhirPath) => verifyIdenticalForAllMedicationRequests(bundle, medicationRequests, fhirPath))
    .filter(isTruthy)

  const courseOfTherapyTypeCode = getCourseOfTherapyTypeCode(medicationRequests)
  const isRepeatDispensing = courseOfTherapyTypeCode === CourseOfTherapyTypeCode.CONTINUOUS_REPEAT_DISPENSING
  const repeatDispensingErrors = isRepeatDispensing ? verifyRepeatDispensingPrescription(medicationRequests) : []

  return [
    ...incorrectValueErrors,
    ...inconsistentValueErrors,
    ...repeatDispensingErrors
  ]
}

export function verifyRepeatDispensingPrescription(
  medicationRequests: Array<fhir.MedicationRequest>
): Array<errors.ValidationError> {
  const validationErrors = []

  const firstMedicationRequest = medicationRequests[0]
  if (!firstMedicationRequest.dispenseRequest.validityPeriod) {
    validationErrors.push(new errors.MedicationRequestMissingValueError("dispenseRequest.validityPeriod"))
  }

  if (!firstMedicationRequest.dispenseRequest.expectedSupplyDuration) {
    validationErrors.push(new errors.MedicationRequestMissingValueError("dispenseRequest.expectedSupplyDuration"))
  }

  if (!getExtensionForUrlOrNull(
    firstMedicationRequest.extension,
    "https://fhir.nhs.uk/R4/StructureDefinition/Extension-UKCore-MedicationRepeatInformation",
    "MedicationRequest.extension"
  )) {
    validationErrors.push(new errors.MedicationRequestMissingValueError(
      'extension("https://fhir.nhs.uk/R4/StructureDefinition/Extension-UKCore-MedicationRepeatInformation")'
    ))
  }

  return validationErrors
}

export function verifyCancellationBundle(bundle: fhir.Bundle): Array<errors.ValidationError> {
  const validationErrors = []

  const medicationRequests = getMedicationRequests(bundle)
  if (medicationRequests.length != 1) {
    validationErrors.push(new errors.MedicationRequestNumberError())
  }

  if (medicationRequests.some(medicationRequest => medicationRequest.status !== "cancelled")) {
    validationErrors.push(new MedicationRequestIncorrectValueError("status", "cancelled"))
  }

  if (medicationRequests.some(medicationRequest => !medicationRequest.statusReason)) {
    validationErrors.push(new errors.MedicationRequestMissingValueError("statusReason"))
  }

  return validationErrors
}

function verifyIdenticalForAllMedicationRequests(
  bundle: fhir.Bundle,
  medicationRequests: Array<fhir.MedicationRequest>,
  fhirPath: string
) {
  const allFieldValues = applyFhirPath(bundle, medicationRequests, fhirPath)
  const uniqueFieldValues = getUniqueValues(allFieldValues)
  if (uniqueFieldValues.length > 1) {
    return new errors.MedicationRequestInconsistentValueError(fhirPath, uniqueFieldValues)
  }
  return null
}
