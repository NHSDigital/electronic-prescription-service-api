import {Bundle, MedicationRequest, Resource} from "../model/fhir-resources"
import {getExtensionForUrl, getExtensionForUrlOrNull} from "../services/translation/common"
import * as errors from "../errors/errors"

// Validate Status
export function getStatusCode(validation: Array<errors.ValidationError>): number {
  return validation.length > 0 ? 400 : 200
}

export function verifyPrescriptionBundle(bundle: unknown, requireSignature: boolean): Array<errors.ValidationError> {
  if (!verifyResourceTypeIsBundle(bundle)) {
    return [new errors.RequestNotBundleError()]
  }

  if (!verifyBundleContainsEntries(bundle)) {
    return [new errors.NoEntryInBundleError()]
  }

  const bundleValidators = [
    verifyHasId,
    (bundle: Bundle) => verifyBundleContainsBetween(bundle, 1, 4, "MedicationRequest"),
    (bundle: Bundle) => verifyBundleContainsExactly(bundle, 1, "Patient"),
    (bundle: Bundle) => verifyBundleContainsAtLeast(bundle, 1, "PractitionerRole"),
    (bundle: Bundle) => verifyBundleContainsAtLeast(bundle, 1, "Practitioner"),
    (bundle: Bundle) => verifyBundleContainsAtLeast(bundle, 1, "Organization")
  ]
  if (requireSignature) {
    bundleValidators.push((bundle: Bundle) => verifyBundleContainsExactly(bundle, 1, "Provenance"))
  }
  const bundleValidationErrors = validate(bundle, ...bundleValidators)

  const medicationRequestConsistencyValidators = [
    (medicationRequests: Array<MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(
      medicationRequests,
      "groupIdentifier",
      (medicationRequest) => medicationRequest.groupIdentifier
    ),
    (medicationRequests: Array<MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(
      medicationRequests,
      "category",
      (medicationRequest) => medicationRequest.category
    ),
    (medicationRequests: Array<MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(
      medicationRequests,
      "authoredOn",
      (medicationRequest) => medicationRequest.authoredOn
    ),
    (medicationRequests: Array<MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(
      medicationRequests,
      "subject",
      (medicationRequest) => medicationRequest.subject
    ),
    (medicationRequests: Array<MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(
      medicationRequests,
      "requester",
      (medicationRequest) => medicationRequest.requester
    ),
    (medicationRequests: Array<MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(
      medicationRequests,
      "dispenseRequest.performer",
      (medicationRequest) => medicationRequest.dispenseRequest.performer
    ),
    (medicationRequests: Array<MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(
      medicationRequests,
      "dispenseRequest.validityPeriod",
      (medicationRequest) => medicationRequest.dispenseRequest.validityPeriod
    ),
    (medicationRequests: Array<MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(
      medicationRequests,
      "dispenseRequest.expectedSupplyDuration",
      (medicationRequest) => medicationRequest.dispenseRequest.expectedSupplyDuration
    ),
    (medicationRequests: Array<MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(
      medicationRequests,
      "dispenseRequest.extension (performer site type)",
      (medicationRequest) => getExtensionForUrl(
        medicationRequest.dispenseRequest.extension,
        "https://fhir.nhs.uk/R4/StructureDefinition/Extension-performerSiteType",
        "MedicationRequest.dispenseRequest.extension"
      )
    ),
    (medicationRequests: Array<MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(
      medicationRequests,
      "extension (prescription type)",
      (medicationRequest) => getExtensionForUrl(
        medicationRequest.extension,
        "https://fhir.nhs.uk/R4/StructureDefinition/Extension-prescriptionType",
        "MedicationRequest.extension"
      )
    ),
    (medicationRequests: Array<MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(
      medicationRequests,
      "extension (responsible practitioner)",
      (medicationRequest) => getExtensionForUrlOrNull(
        medicationRequest.extension,
        "https://fhir.nhs.uk/R4/StructureDefinition/Extension-DM-ResponsiblePractitioner",
        "MedicationRequest.extension"
      )
    )
  ]
  const medicationRequests = getMatchingEntries(bundle, "MedicationRequest") as Array<MedicationRequest>
  const medicationRequestConsistencyValidationErrors = validate(medicationRequests, ...medicationRequestConsistencyValidators)

  return [
    ...bundleValidationErrors,
    ...medicationRequestConsistencyValidationErrors
  ]
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
  medicationRequests: Array<MedicationRequest>,
  fieldName: string,
  fieldAccessor: (resource: MedicationRequest) => U
): errors.ValidationError | null {
  const fieldValues = medicationRequests.map(fieldAccessor)
  const serializedFieldValues = fieldValues.map(value => JSON.stringify(value))
  const uniqueFieldValues = new Set(serializedFieldValues)
  return uniqueFieldValues.size === 1 ? null : new errors.MedicationRequestValueError(fieldName, [...uniqueFieldValues])
}

function verifyHasId(bundle: Bundle): errors.ValidationError | null {
  return bundle.id !== undefined ? null : new errors.MissingIdError()
}

function verifyMessageIsResource(message: unknown): message is Resource {
  return (message as Resource)?.resourceType !== undefined
}

function verifyResourceTypeIsBundle(resource: unknown): resource is Bundle {
  return verifyMessageIsResource(resource)
        && resource.resourceType === "Bundle"
}

function verifyBundleContainsEntries(bundle: Bundle) {
  return bundle.entry !== undefined
}

export function getMatchingEntries(bundle: Bundle, resourceType: string): Array<Resource> {
  return bundle.entry
    .map(entry => entry.resource)
    .filter(notEmpty)
    .filter(resource => resource.resourceType === resourceType)
}

function verifyBundleContainsAtLeast(bundle: Bundle, number: number, resourceType: string): errors.ValidationError | null {
  const matchingEntries = getMatchingEntries(bundle, resourceType)
  if (matchingEntries.length < number) {
    return new errors.ContainsAtLeastError(number, resourceType)
  }
  return null
}

function verifyBundleContainsBetween(bundle: Bundle, min: number, max: number, resourceType: string): errors.ValidationError | null {
  const matchingEntries = getMatchingEntries(bundle, resourceType)
  if (matchingEntries.length < min || matchingEntries.length > max) {
    return new errors.ContainsBetweenError(min, max, resourceType)
  }
  return null
}

function verifyBundleContainsExactly(bundle: Bundle, number: number, resourceType: string): errors.ValidationError | null {
  const matchingEntries = getMatchingEntries(bundle, resourceType)
  if (matchingEntries.length !== number) {
    return new errors.ContainsExactlyError(number, resourceType)
  }
  return null
}
