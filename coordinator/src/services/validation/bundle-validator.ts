import * as fhir from "../../models/fhir/fhir-resources"
import {getExtensionForUrl, getExtensionForUrlOrNull} from "../translation/common"
import * as errors from "../../models/errors/validation-errors"
import {identifyMessageType, MessageType} from "../../routes/util"
import {getMedicationRequests} from "../translation/common/getResourcesOfType"
import * as LosslessJson from "lossless-json"

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

function verifyCancellationBundle(bundle: fhir.Bundle): Array<errors.ValidationError> {
  //TODO - implement cancellation-specific validation
  bundle
  return []
}

type medicationRequestValidator = {
  fieldName: string,
  fieldAccessor: (resource: fhir.MedicationRequest) => unknown
}

export function verifyPrescriptionBundle(bundle: fhir.Bundle): Array<errors.ValidationError> {
  const consistencyValidators: Array<medicationRequestValidator> = [
    {
      fieldName: "groupIdentifier",
      fieldAccessor: (medicationRequest) => medicationRequest.groupIdentifier
    },
    {
      fieldName: "category",
      fieldAccessor: (medicationRequest) => medicationRequest.category
    },
    {
      fieldName: "authoredOn",
      fieldAccessor: (medicationRequest) => medicationRequest.authoredOn
    },
    {
      fieldName: "subject",
      fieldAccessor: (medicationRequest) => medicationRequest.subject
    },
    {
      fieldName: "requester",
      fieldAccessor: (medicationRequest) => medicationRequest.requester
    },
    {
      fieldName: "dispenseRequest.performer",
      fieldAccessor: (medicationRequest) => medicationRequest.dispenseRequest.performer
    },
    {
      fieldName: "dispenseRequest.validityPeriod",
      fieldAccessor: (medicationRequest) => medicationRequest.dispenseRequest.validityPeriod
    },
    {
      fieldName: "dispenseRequest.expectedSupplyDuration",
      fieldAccessor: (medicationRequest) => medicationRequest.dispenseRequest.expectedSupplyDuration
    },
    {
      fieldName: 'dispenseRequest.extension("https://fhir.nhs.uk/R4/StructureDefinition/Extension-performerSiteType")',
      fieldAccessor:(medicationRequest) => getExtensionForUrl(
        medicationRequest.dispenseRequest.extension,
        "https://fhir.nhs.uk/R4/StructureDefinition/Extension-performerSiteType",
        "MedicationRequest.dispenseRequest" +
        '.extension("https://fhir.nhs.uk/R4/StructureDefinition/Extension-performerSiteType")'
      )
    },
    {
      fieldName: 'extension("https://fhir.nhs.uk/R4/StructureDefinition/Extension-DM-prescriptionType")',
      fieldAccessor: (medicationRequest) => getExtensionForUrl(
        medicationRequest.extension,
        "https://fhir.nhs.uk/R4/StructureDefinition/Extension-DM-prescriptionType",
        "MedicationRequest" +
        '.extension("https://fhir.nhs.uk/R4/StructureDefinition/Extension-DM-prescriptionType")'
      )
    },
    {
      fieldName: 'extension("https://fhir.nhs.uk/R4/StructureDefinition/Extension-DM-ResponsiblePractitioner")',
      fieldAccessor: (medicationRequest) => getExtensionForUrlOrNull(
        medicationRequest.extension,
        "https://fhir.nhs.uk/R4/StructureDefinition/Extension-DM-ResponsiblePractitioner",
        "MedicationRequest" +
        '.extension("https://fhir.nhs.uk/R4/StructureDefinition/Extension-DM-ResponsiblePractitioner")'
      )
    },
    {
      fieldName: 'extension("https://fhir.nhs.uk/R4/StructureDefinition/Extension-UKCore-MedicationRepeatInformation")',
      fieldAccessor: (medicationRequest) => getExtensionForUrlOrNull(
        medicationRequest.extension,
        "https://fhir.nhs.uk/R4/StructureDefinition/Extension-UKCore-MedicationRepeatInformation",
        "MedicationRequest" +
        '.extension("https://fhir.nhs.uk/R4/StructureDefinition/Extension-UKCore-MedicationRepeatInformation")'
      )
    }
  ]
  const medicationRequests = getMedicationRequests(bundle)

  return consistencyValidators.map(
    (validationCondition) => verifyValueIdenticalForAllMedicationRequests(
      medicationRequests,
      validationCondition.fieldName,
      validationCondition.fieldAccessor
    )
  ).filter(notEmpty)
}

function notEmpty<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

function verifyValueIdenticalForAllMedicationRequests<U>(
  medicationRequests: Array<fhir.MedicationRequest>,
  fieldName: string,
  fieldAccessor: (resource: fhir.MedicationRequest) => U
): errors.ValidationError | null {
  const fieldValues = medicationRequests.map(fieldAccessor)
  const serializedFieldValues = fieldValues.map(value => LosslessJson.stringify(value))
  const uniqueFieldValues = new Set(serializedFieldValues)
  return uniqueFieldValues.size === 1 ? null : new errors.MedicationRequestValueError(fieldName, [...uniqueFieldValues])
}

export function getMatchingEntries(bundle: fhir.Bundle, resourceType: string): Array<fhir.Resource> {
  return bundle.entry
    .map(entry => entry.resource)
    .filter(notEmpty)
    .filter(resource => resource.resourceType === resourceType)
}

function verifyMessageType(messageType: string): messageType is MessageType {
  return messageType === MessageType.PRESCRIPTION || messageType === MessageType.CANCELLATION
}
