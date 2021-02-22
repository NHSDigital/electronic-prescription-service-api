import * as errors from "../../models/errors/validation-errors"
import {MedicationRequestIncorrectValueError} from "../../models/errors/validation-errors"
import {identifyMessageType} from "../../routes/util"
import {getMedicationRequests} from "../translation/common/getResourcesOfType"
import {applyFhirPath} from "./fhir-path"
import {getUniqueValues} from "./util"
import {getCourseOfTherapyTypeCode} from "../translation/request/course-of-therapy-type"
import {getExtensionForUrlOrNull, getIdentifierValueForSystem, isTruthy} from "../translation/common"
import * as fhir from "../../models/fhir"

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

  let messageTypeSpecificErrors
  switch (messageType) {
    case fhir.EventCodingCode.PRESCRIPTION:
      messageTypeSpecificErrors = verifyPrescriptionBundle(bundle)
      break
    case fhir.EventCodingCode.CANCELLATION:
      messageTypeSpecificErrors = verifyCancellationBundle(bundle)
      break
    case fhir.EventCodingCode.DISPENSE:
      messageTypeSpecificErrors = verifyDispenseBundle(bundle)
      break
  }

  return [
    ...commonErrors,
    ...messageTypeSpecificErrors
  ]
}

function verifyMessageType(messageType: string): messageType is fhir.EventCodingCode {
  return messageType === fhir.EventCodingCode.PRESCRIPTION ||
    messageType === fhir.EventCodingCode.CANCELLATION ||
    messageType === fhir.EventCodingCode.DISPENSE
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

  const allErrors: Array<errors.ValidationError> = []

  const fhirPaths = [
    "groupIdentifier",
    "category",
    "authoredOn",
    "subject",
    "requester",
    "dispenseRequest.performer",
    "dispenseRequest.validityPeriod",
    "dispenseRequest.expectedSupplyDuration",
    'dispenseRequest.extension("https://fhir.nhs.uk/StructureDefinition/Extension-DM-PerformerSiteType")',
    'extension("https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionType")',
    'extension("https://fhir.nhs.uk/StructureDefinition/Extension-DM-ResponsiblePractitioner")',
    'extension("https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-MedicationRepeatInformation")'
  ]
  const inconsistentValueErrors = fhirPaths
    .map((fhirPath) => verifyIdenticalForAllMedicationRequests(bundle, medicationRequests, fhirPath))
    .filter(isTruthy)
  allErrors.push(...inconsistentValueErrors)

  const courseOfTherapyTypeCode = getCourseOfTherapyTypeCode(medicationRequests)
  const isRepeatDispensing = courseOfTherapyTypeCode === fhir.CourseOfTherapyTypeCode.CONTINUOUS_REPEAT_DISPENSING
  const repeatDispensingErrors = isRepeatDispensing ? verifyRepeatDispensingPrescription(medicationRequests) : []
  allErrors.push(...repeatDispensingErrors)

  if (medicationRequests.some(medicationRequest => medicationRequest.status !== "active")) {
    allErrors.push(new MedicationRequestIncorrectValueError("status", "active"))
  }

  if(!allMedicationRequestsHaveUniqueIdentifier(medicationRequests)){
    allErrors.push(new errors.MedicationRequestDuplicateValueError())
  }

  return allErrors
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
    "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-MedicationRepeatInformation",
    "MedicationRequest.extension"
  )) {
    validationErrors.push(new errors.MedicationRequestMissingValueError(
      'extension("https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-MedicationRepeatInformation")'
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

function verifyDispenseBundle(bundle: fhir.Bundle): Array<errors.ValidationError> {
  bundle
  return []
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

function allMedicationRequestsHaveUniqueIdentifier(
  medicationRequests: Array<fhir.MedicationRequest>
) {
  const allIdentifiers = medicationRequests.map(
    request => getIdentifierValueForSystem(
      request.identifier, "https://fhir.nhs.uk/Id/prescription-order-item-number", "MedicationRequest.identifier.value")
  )
  const uniqueIdentifiers = getUniqueValues(allIdentifiers)
  return uniqueIdentifiers.length === medicationRequests.length
}
