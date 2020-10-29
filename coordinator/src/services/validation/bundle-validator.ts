import * as fhir from "../../models/fhir/fhir-resources"
import {Bundle, MedicationRequest} from "../../models/fhir/fhir-resources"
import * as errors from "../../models/errors/validation-errors"
import {identifyMessageType, MessageType} from "../../routes/util"
import {getMedicationRequests} from "../translation/common/getResourcesOfType"
import * as LosslessJson from "lossless-json"
import {applyFhirPath} from "./fhir-path"
import {getUniqueValues} from "./util"

// Validate Status
export function getStatusCode(validation: Array<errors.ValidationError>): number {
  return validation.length > 0 ? 400 : 200
}

export function verifyBundle(bundle: fhir.Bundle): Array<errors.ValidationError> {
  const messageType = identifyMessageType(bundle)
  if (!verifyMessageType(messageType)) {
    return [new errors.MessageTypeError()]
  }

  return messageType === MessageType.PRESCRIPTION
    ? verifyPrescriptionBundle(bundle)
    : verifyCancellationBundle(bundle)
}

function verifyMessageType(messageType: string): messageType is MessageType {
  return messageType === MessageType.PRESCRIPTION || messageType === MessageType.CANCELLATION
}

export function verifyPrescriptionBundle(bundle: fhir.Bundle): Array<errors.ValidationError> {
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
    'extension("https://fhir.nhs.uk/R4/StructureDefinition/Extension-prescriptionType")',
    'extension("https://fhir.nhs.uk/R4/StructureDefinition/Extension-DM-ResponsiblePractitioner")',
    'extension("https://fhir.nhs.uk/R4/StructureDefinition/Extension-UKCore-MedicationRepeatInformation")'
  ]
  const medicationRequests = getMedicationRequests(bundle)
  return fhirPaths
    .map((fhirPath) => verifyIdenticalForAllMedicationRequests(bundle, medicationRequests, fhirPath))
    .filter(Boolean)
}

function verifyCancellationBundle(bundle: fhir.Bundle): Array<errors.ValidationError> {
  //TODO - implement cancellation-specific validation
  bundle
  return []
}

function verifyIdenticalForAllMedicationRequests(
  bundle: Bundle,
  medicationRequests: Array<MedicationRequest>,
  fhirPath: string
) {
  const allFieldValues = applyFhirPath(bundle, medicationRequests, fhirPath)
  const uniqueFieldValues = getUniqueValues(allFieldValues)
  if (uniqueFieldValues.length > 1) {
    const uniqueFieldValuesStr = LosslessJson.stringify(uniqueFieldValues)
    return new errors.MedicationRequestValueError(fhirPath, uniqueFieldValuesStr)
  }
  return null
}
