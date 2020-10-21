import * as fhir from "../../models/fhir/fhir-resources"
import {getExtensionForUrl, getExtensionForUrlOrNull} from "../translation/common"
import * as errors from "../../models/errors/validation-errors"
import {identifyMessageType, MessageType} from "../../routes/util"
import {getMedicationRequests} from "../../services/translation/common/getResourcesOfType"
import * as LosslessJson from "lossless-json"

// Validate Status
export function getStatusCode(validation: Array<errors.ValidationError>): number {
  return validation.length > 0 ? 400 : 200
}

export function verifyBundle(bundle: unknown, requireSignature: boolean): Array<errors.ValidationError> {
  if (!verifyResourceTypeIsBundle(bundle)) {
    return [new errors.RequestNotBundleError()]
  }

  if (!verifyBundleContainsEntries(bundle)) {
    return [new errors.NoEntryInBundleError()]
  }

  const bundleValidationErrors = verifyCommonErrors(bundle, requireSignature)

  const messageHeaderError = verifyBundleContainsExactly(bundle, 1, "MessageHeader")
  if (messageHeaderError) {
    return [...bundleValidationErrors, messageHeaderError]
  }

  const messageType = identifyMessageType(bundle)
  if (!verifyMessageType(messageType)) {
    return [...bundleValidationErrors, new errors.MessageTypeError()]
  }

  const specificValidationErrors = messageType === MessageType.PRESCRIPTION
    ? verifyPrescriptionBundle(bundle)
    : verifyCancellationBundle(bundle)

  return [...bundleValidationErrors, ...specificValidationErrors]
}

function verifyCommonErrors(bundle: fhir.Bundle, requireSignature: boolean): Array<errors.ValidationError> {
  const bundleValidators = [
    verifyHasId,
    (bundle: fhir.Bundle) => verifyBundleContainsBetween(bundle, 1, 4, "MedicationRequest"),
    (bundle: fhir.Bundle) => verifyBundleContainsExactly(bundle, 1, "Patient"),
    (bundle: fhir.Bundle) => verifyBundleContainsAtLeast(bundle, 1, "PractitionerRole"),
    (bundle: fhir.Bundle) => verifyBundleContainsAtLeast(bundle, 1, "Practitioner"),
    (bundle: fhir.Bundle) => verifyBundleContainsAtLeast(bundle, 1, "Organization")
  ]
  if (requireSignature) {
    bundleValidators.push((bundle: fhir.Bundle) => verifyBundleContainsExactly(bundle, 1, "Provenance"))
  }
  return validate(bundle, ...bundleValidators)
}

function verifyCancellationBundle(bundle: fhir.Bundle): Array<errors.ValidationError> {
  //TODO - implement cancellation-specific validation
  bundle
  return []
}

export function verifyPrescriptionBundle(bundle: fhir.Bundle): Array<errors.ValidationError> {
  const medicationRequestConsistencyValidators = [
    (medicationRequests: Array<fhir.MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(
      medicationRequests,
      "groupIdentifier",
      (medicationRequest) => medicationRequest.groupIdentifier
    ),
    (medicationRequests: Array<fhir.MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(
      medicationRequests,
      "category",
      (medicationRequest) => medicationRequest.category
    ),
    (medicationRequests: Array<fhir.MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(
      medicationRequests,
      "authoredOn",
      (medicationRequest) => medicationRequest.authoredOn
    ),
    (medicationRequests: Array<fhir.MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(
      medicationRequests,
      "subject",
      (medicationRequest) => medicationRequest.subject
    ),
    (medicationRequests: Array<fhir.MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(
      medicationRequests,
      "requester",
      (medicationRequest) => medicationRequest.requester
    ),
    (medicationRequests: Array<fhir.MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(
      medicationRequests,
      "dispenseRequest.performer",
      (medicationRequest) => medicationRequest.dispenseRequest.performer
    ),
    (medicationRequests: Array<fhir.MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(
      medicationRequests,
      "dispenseRequest.validityPeriod",
      (medicationRequest) => medicationRequest.dispenseRequest.validityPeriod
    ),
    (medicationRequests: Array<fhir.MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(
      medicationRequests,
      "dispenseRequest.expectedSupplyDuration",
      (medicationRequest) => medicationRequest.dispenseRequest.expectedSupplyDuration
    ),
    (medicationRequests: Array<fhir.MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(
      medicationRequests,
      "dispenseRequest.extension (performer site type)",
      (medicationRequest) => getExtensionForUrl(
        medicationRequest.dispenseRequest.extension,
        "https://fhir.nhs.uk/R4/StructureDefinition/Extension-performerSiteType",
        "MedicationRequest.dispenseRequest.extension"
      )
    ),
    (medicationRequests: Array<fhir.MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(
      medicationRequests,
      "extension (prescription type)",
      (medicationRequest) => getExtensionForUrl(
        medicationRequest.extension,
        "https://fhir.nhs.uk/R4/StructureDefinition/Extension-DM-prescriptionType",
        "MedicationRequest.extension"
      )
    ),
    (medicationRequests: Array<fhir.MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(
      medicationRequests,
      "extension (responsible practitioner)",
      (medicationRequest) => getExtensionForUrlOrNull(
        medicationRequest.extension,
        "https://fhir.nhs.uk/R4/StructureDefinition/Extension-DM-ResponsiblePractitioner",
        "MedicationRequest.extension"
      )
    ),
    (medicationRequests: Array<fhir.MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(
      medicationRequests,
      "extension (repeat information)",
      (medicationRequest) => getExtensionForUrlOrNull(
        medicationRequest.extension,
        "https://fhir.nhs.uk/R4/StructureDefinition/Extension-UKCore-MedicationRepeatInformation",
        "MedicationRequest.extension"
      )
    )
  ]
  const medicationRequests = getMedicationRequests(bundle)

  return validate(medicationRequests, ...medicationRequestConsistencyValidators)
}

function notEmpty<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

type Validator<T> = (input: T) => errors.ValidationError | null

// Validate
function validate<T>(input: T, ...validators: Array<Validator<T>>): Array<errors.ValidationError> {
  return validators.map(v => v(input))
    .filter(notEmpty)
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

function verifyHasId(bundle: fhir.Bundle): errors.ValidationError | null {
  return bundle.id !== undefined ? null : new errors.MissingIdError()
}

function verifyMessageIsResource(message: unknown): message is fhir.Resource {
  return (message as fhir.Resource)?.resourceType !== undefined
}

function verifyResourceTypeIsBundle(resource: unknown): resource is fhir.Bundle {
  return verifyMessageIsResource(resource)
    && resource.resourceType === "Bundle"
}

function verifyBundleContainsEntries(bundle: fhir.Bundle) {
  return bundle.entry !== undefined
}

export function getMatchingEntries(bundle: fhir.Bundle, resourceType: string): Array<fhir.Resource> {
  return bundle.entry
    .map(entry => entry.resource)
    .filter(notEmpty)
    .filter(resource => resource.resourceType === resourceType)
}

function verifyBundleContainsAtLeast(
  bundle: fhir.Bundle,
  number: number,
  resourceType: string
): errors.ValidationError | null {
  const matchingEntries = getMatchingEntries(bundle, resourceType)
  if (matchingEntries.length < number) {
    return new errors.ContainsAtLeastError(number, resourceType)
  }
  return null
}

function verifyBundleContainsBetween(
  bundle: fhir.Bundle,
  min: number,
  max: number,
  resourceType: string
): errors.ValidationError | null {
  const matchingEntries = getMatchingEntries(bundle, resourceType)
  if (matchingEntries.length < min || matchingEntries.length > max) {
    return new errors.ContainsBetweenError(min, max, resourceType)
  }
  return null
}

function verifyBundleContainsExactly(
  bundle: fhir.Bundle,
  number: number,
  resourceType: string
): errors.ValidationError | null {
  const matchingEntries = getMatchingEntries(bundle, resourceType)
  if (matchingEntries.length !== number) {
    return new errors.ContainsExactlyError(number, resourceType)
  }
  return null
}

function verifyMessageType(messageType: string): messageType is MessageType {
  return messageType === MessageType.PRESCRIPTION || messageType === MessageType.CANCELLATION
}
