import {
  getMedicationDispenses,
  getMedicationRequests
} from "../translation/common/getResourcesOfType"
import {applyFhirPath} from "./fhir-path"
import {getUniqueValues, groupBy} from "./util"
import {
  getExtensionForUrlOrNull,
  getIdentifierValueForSystem,
  identifyMessageType,
  isTruthy
} from "../translation/common"
import {fhir, validationErrors as errors} from "@models"
import {getOrganisationPerformer} from "../translation/request/dispense/dispense-notification"
import {isRepeatDispensing} from "../translation/request"

export function verifyBundle(bundle: fhir.Bundle): Array<fhir.OperationOutcomeIssue> {
  if (bundle.resourceType !== "Bundle") {
    return [errors.createResourceTypeIssue("Bundle")]
  }

  const messageType = identifyMessageType(bundle)
  if (!verifyMessageType(messageType)) {
    return [errors.messageTypeIssue]
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

export function verifyCommonBundle(bundle: fhir.Bundle): Array<fhir.OperationOutcomeIssue> {
  const incorrectValueErrors = []

  const medicationRequests = getMedicationRequests(bundle)
  if (medicationRequests.some(medicationRequest => medicationRequest.intent !== fhir.MedicationRequestIntent.ORDER)) {
    incorrectValueErrors.push(
      errors.createMedicationRequestIncorrectValueIssue("intent", fhir.MedicationRequestIntent.ORDER)
    )
  }

  return incorrectValueErrors
}

export function verifyPrescriptionBundle(bundle: fhir.Bundle): Array<fhir.OperationOutcomeIssue> {
  const medicationRequests = getMedicationRequests(bundle)

  const allErrors: Array<fhir.OperationOutcomeIssue> = []

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

  const repeatDispensingErrors =
    isRepeatDispensing(medicationRequests)
    ? verifyRepeatDispensingPrescription(medicationRequests)
    : []
  allErrors.push(...repeatDispensingErrors)

  if (medicationRequests.some(medicationRequest => medicationRequest.status !== "active")) {
    allErrors.push(errors.createMedicationRequestIncorrectValueIssue("status", "active"))
  }

  if (!allMedicationRequestsHaveUniqueIdentifier(medicationRequests)){
    allErrors.push(errors.medicationRequestDuplicateIdentifierIssue)
  }

  return allErrors
}

export function verifyRepeatDispensingPrescription(
  medicationRequests: Array<fhir.MedicationRequest>
): Array<fhir.OperationOutcomeIssue> {
  const validationErrors = []

  const firstMedicationRequest = medicationRequests[0]
  if (!firstMedicationRequest.dispenseRequest.validityPeriod) {
    validationErrors.push(errors.createMedicationRequestMissingValueIssue("dispenseRequest.validityPeriod"))
  }

  if (!firstMedicationRequest.dispenseRequest.expectedSupplyDuration) {
    validationErrors.push(errors.createMedicationRequestMissingValueIssue("dispenseRequest.expectedSupplyDuration"))
  }

  if (!getExtensionForUrlOrNull(
    firstMedicationRequest.extension,
    "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-MedicationRepeatInformation",
    "MedicationRequest.extension"
  )) {
    validationErrors.push(errors.createMedicationRequestMissingValueIssue(
      'extension("https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-MedicationRepeatInformation")'
    ))
  }

  return validationErrors
}

export function verifyCancellationBundle(bundle: fhir.Bundle): Array<fhir.OperationOutcomeIssue> {
  const validationErrors = []

  const medicationRequests = getMedicationRequests(bundle)
  if (medicationRequests.length != 1) {
    validationErrors.push(errors.medicationRequestNumberIssue)
  }

  if (medicationRequests.some(medicationRequest => medicationRequest.status !== "cancelled")) {
    validationErrors.push(errors.createMedicationRequestIncorrectValueIssue("status", "cancelled"))
  }

  if (medicationRequests.some(medicationRequest => !medicationRequest.statusReason)) {
    validationErrors.push(errors.createMedicationRequestMissingValueIssue("statusReason"))
  }

  return validationErrors
}

export function verifyDispenseBundle(bundle: fhir.Bundle): Array<fhir.OperationOutcomeIssue> {
  const medicationDispenses = getMedicationDispenses(bundle)

  const allErrors = []

  const fhirPaths = [
    "whenPrepared",
    "subject.identifier.value",
    'extension("https://fhir.nhs.uk/StructureDefinition/Extension-EPS-TaskBusinessStatus")'
  ]

  const inconsistentValueErrors = fhirPaths
    .map((fhirPath) => verifyIdenticalForAllMedicationDispenses(bundle, medicationDispenses, fhirPath))
    .filter(isTruthy)
  allErrors.push(...inconsistentValueErrors)

  const performersByType = groupBy(medicationDispenses.flatMap(m => m.performer.map(p => p.actor)), actor => actor.type)
  performersByType.forEach((key, index, values) => {
    const uniqueFieldValues = getUniqueValues(values[index])
    if (uniqueFieldValues.length > 1) {
      allErrors.push(
        errors.createMedicationDispenseInconsistentValueIssue(
          "performer",
          uniqueFieldValues)
      )
    }
  })

  if (medicationDispenses.some(medicationDispense => !getOrganisationPerformer(medicationDispense))) {
    allErrors.push(errors.createMedicationDispenseMissingValueIssue("performer.actor.ofType(Organization)"))
  }

  return allErrors
}

function verifyIdenticalForAllMedicationDispenses(
  bundle: fhir.Bundle,
  medicationDispenses: Array<fhir.MedicationDispense>,
  fhirPath: string
) {
  const allFieldValues = applyFhirPath(bundle, medicationDispenses, fhirPath)
  const uniqueFieldValues = getUniqueValues(allFieldValues)
  if (uniqueFieldValues.length > 1) {
    return errors.createMedicationDispenseInconsistentValueIssue(fhirPath, uniqueFieldValues)
  }
  return null
}

function verifyIdenticalForAllMedicationRequests(
  bundle: fhir.Bundle,
  medicationRequests: Array<fhir.MedicationRequest>,
  fhirPath: string
) {
  const allFieldValues = applyFhirPath(bundle, medicationRequests, fhirPath)
  const uniqueFieldValues = getUniqueValues(allFieldValues)
  if (uniqueFieldValues.length > 1) {
    return errors.createMedicationRequestInconsistentValueIssue(fhirPath, uniqueFieldValues)
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
