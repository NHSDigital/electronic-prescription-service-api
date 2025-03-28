import {fhir, processingErrors as errors} from "@models"
import {LosslessNumber} from "lossless-json"
import {getMessageHeader} from "./getResourcesOfType"
import {
  isBundle,
  isOrganization,
  isPractitionerRole,
  isReference
} from "../../../utils/type-guards"

export const UNKNOWN_GP_ODS_CODE = "V81999"

// TODO: Refactor to make name more specific and use resource getters below instead
export function getMessageId(identifier: Array<fhir.Identifier>, fhirPath: string): string {
  return getIdentifierValueForSystem(
    identifier,
    "https://tools.ietf.org/html/rfc4122",
    fhirPath
  )
}

export function identifyMessageType(bundle: fhir.Bundle): fhir.EventCodingCode {
  return getMessageHeader(bundle).eventCoding?.code
}

export function getBundleIdentifierValue(bundle: fhir.Bundle): string {
  return getMessageId([bundle.identifier], "Bundle.identifier")
}

export function getTaskIdentifierValue(task: fhir.Task): string {
  return getMessageId(task.identifier, "Task.identifier")
}

export function getClaimIdentifierValue(claim: fhir.Claim): string {
  return getMessageId(claim.identifier, "Claim.identifier")
}

export function onlyElement<T>(iterable: Iterable<T>, fhirPath: string, additionalContext?: string): T {
  if (!iterable) {
    throw new errors.InvalidValueError("Required field missing in onlyElement.", fhirPath)
  }
  const iterator = iterable[Symbol.iterator]()
  const first = iterator.next()
  if (first.done) {
    throw new errors.TooFewValuesError(`Too few values submitted. Expected 1 element${
      additionalContext ? " where " : ""
    }${
      additionalContext ? additionalContext : ""
    }.`, fhirPath)
  }
  const value = first.value
  if (!iterator.next().done) {
    throw new errors.TooManyValuesError(`Too many values submitted. Expected 1 element${
      additionalContext ? " where " : ""
    }${
      additionalContext ? additionalContext : ""
    }.`, fhirPath)
  }
  return value
}

export function onlyElementOrNull<T>(iterable: Iterable<T>, fhirPath: string, additionalContext?: string): T {
  if (!iterable) {
    return null
  }
  const iterator = iterable[Symbol.iterator]()
  const value = iterator.next().value
  if (!iterator.next().done) {
    throw new errors.TooManyValuesError(`Too many values submitted. Expected at most 1 element${
      additionalContext ? " where " : ""
    }${
      additionalContext ? additionalContext : ""
    }.`, fhirPath)
  }
  return value
}

export function getResourceForFullUrl(bundle: fhir.Bundle, resourceFullUrl: string): fhir.Resource {
  return onlyElement(
    bundle.entry.filter(entry => entry.fullUrl === resourceFullUrl),
    "Bundle.entry",
    `fullUrl == '${resourceFullUrl}'`
  ).resource
}

export function resolveReference<T extends fhir.Resource>(bundle: fhir.Bundle, reference: fhir.Reference<T>): T {
  return getResourceForFullUrl(bundle, reference.reference) as T
}

export function resolvePractitioner(
  bundle: fhir.Bundle, reference: fhir.Reference<fhir.Practitioner> | fhir.IdentifierReference<fhir.Practitioner>
): fhir.Practitioner {
  if (isReference(reference)) {
    return resolveReference(bundle, reference)
  } else {
    return {
      resourceType: "Practitioner",
      identifier: [reference.identifier],
      name: [{text: reference.display}]
    }
  }
}

export function resolveOrganization(bundle: fhir.Bundle, practitionerRole: fhir.PractitionerRole): fhir.Organization {
  const organization = practitionerRole.organization
  if (isReference(organization)) {
    return resolveReference(bundle, organization)
  } else {
    const location = practitionerRole.location
      .map(location => resolveReference(bundle, location))
      .map(location => location.address)
    return {
      resourceType: "Organization",
      identifier: [organization.identifier],
      //Will break for Primary Care
      type: [
        {
          "coding": [
            {
              "system": "https://fhir.nhs.uk/CodeSystem/organisation-role",
              "code": "197",
              "display": "NHS TRUST"
            }
          ]
        }
      ],
      name: organization.display,
      telecom: practitionerRole.telecom,
      address: location
    }
  }
}

export function resolveHealthcareService(
  bundle: fhir.Bundle, practitionerRole: fhir.PractitionerRole
): fhir.HealthcareService {
  const healthcareService = practitionerRole.healthcareService[0]
  if (isReference(healthcareService)) {
    return resolveReference(bundle, healthcareService)
  } else {
    return {
      resourceType: "HealthcareService",
      identifier: [healthcareService.identifier],
      name: healthcareService.display,
      telecom: practitionerRole.telecom,
      location: practitionerRole.location
    }
  }
}

export function getIdentifierValueForSystem(
  identifiers: Array<fhir.Identifier>,
  system: string,
  fhirPath: string
): string {
  if (!identifiers) {
    throw new errors.InvalidValueError("Required field missing in getIdentifierValueForSystem.", fhirPath)
  }
  return onlyElement(
    identifiers.filter(identifier => identifier.system === system),
    fhirPath,
    `system == '${system}'`
  ).value
}

export function getIdentifierValueOrNullForSystem(
  identifiers: Array<fhir.Identifier>,
  system: string,
  fhirPath: string
): string {
  if (!identifiers) {
    return null
  }
  return onlyElementOrNull(
    identifiers.filter(identifier => identifier.system === system),
    fhirPath,
    `system == '${system}'`
  )?.value
}

export function getCodingForSystem(codings: Array<fhir.Coding>, system: string, fhirPath: string): fhir.Coding {
  return onlyElement(
    codings.filter(coding => coding.system === system),
    fhirPath,
    `system == '${system}'`
  )
}

export function getCodingForSystemOrNull(codings: Array<fhir.Coding>, system: string, fhirPath: string): fhir.Coding {
  return onlyElementOrNull(
    codings.filter(coding => coding.system === system),
    fhirPath,
    `system == '${system}'`
  )
}

export function getExtensionForUrl(extensions: Array<fhir.Extension>, url: string, fhirPath: string): fhir.Extension {
  return onlyElement(
    extensions?.filter(extension => extension.url === url),
    fhirPath,
    `url == '${url}'`
  )
}

export function getExtensionForUrlOrNull(
  extensions: Array<fhir.Extension>,
  url: string,
  fhirPath: string
): fhir.Extension {
  return onlyElementOrNull(
    extensions?.filter(extension => extension.url === url),
    fhirPath,
    `url == '${url}'`
  )
}

export function getCodeableConceptCodingForSystem(
  codeableConcepts: Array<fhir.CodeableConcept>,
  system: string,
  fhirPath: string
): fhir.Coding {
  if (!codeableConcepts) {
    throw new errors.InvalidValueError("Required field missing in getCodeableConceptCodingForSystem.", fhirPath)
  }
  const coding = codeableConcepts.flatMap(codeableConcept => codeableConcept.coding).filter(isTruthy)
  return getCodingForSystem(coding, system, fhirPath + ".coding")
}

export function getCodeableConceptCodingForSystemOrNull(
  codeableConcepts: Array<fhir.CodeableConcept>,
  system: string,
  fhirPath: string
): fhir.Coding {
  if (!codeableConcepts) {
    return null
  }
  const coding = codeableConcepts.flatMap(codeableConcept => codeableConcept.coding).filter(isTruthy)
  return getCodingForSystemOrNull(coding, system, fhirPath + ".coding")
}

export function toArray<T>(thing: T | Array<T>): Array<T> {
  return Array.isArray(thing) ? thing : [thing]
}

export const isTruthy = Boolean

export function getNumericValueAsString(numericValue: string | number | LosslessNumber): string {
  if (typeof numericValue === "number") {
    throw new TypeError(
      "Got a number but expected a LosslessNumber." +
      " Use LosslessJson.parse() instead of JSON.parse() or precision may be lost."
    )
  } else if (typeof numericValue === "string") {
    return numericValue
  } else {
    return numericValue.toString()
  }
}

function isStringParameter(parameter: fhir.Parameter): parameter is fhir.StringParameter {
  return (parameter as fhir.StringParameter).valueString !== undefined
}

export function isIdentifierParameter(parameter: fhir.Parameter): parameter is fhir.IdentifierParameter {
  return (parameter as fhir.IdentifierParameter).valueIdentifier !== undefined
}

function isResourceParameter<R extends fhir.Resource>(
  parameter: fhir.Parameter
): parameter is fhir.ResourceParameter<R> {
  return (parameter as fhir.ResourceParameter<R>).resource !== undefined
}

export function getStringParameterByName(
  parameters: Array<fhir.Parameter>,
  name: string
): fhir.StringParameter {
  return onlyElement(parameters.filter(isStringParameter).filter(parameter => parameter.name === name),
    "Parameters.parameter",
    `name == '${name}'`
  )
}

export function getIdentifierParameterByName(
  parameters: Array<fhir.Parameter>,
  name: string
): fhir.IdentifierParameter {
  return onlyElement(parameters.filter(isIdentifierParameter).filter(parameter => parameter.name === name),
    "Parameters.parameter",
    `name == '${name}'`
  )
}

export function getIdentifierParameterOrNullByName(
  parameters: Array<fhir.Parameter>,
  name: string
): fhir.IdentifierParameter {
  return onlyElementOrNull(parameters.filter(isIdentifierParameter).filter(parameter => parameter.name === name),
    "Parameters.parameter",
    `name == '${name}'`
  )
}

function getResourceParameterByName<R extends fhir.Resource>(
  parameters: fhir.Parameters,
  name: string,
  resourceTypeGuard: (body: unknown) => body is fhir.ResourceParameter<R>
): fhir.ResourceParameter<R> {
  const resourceParameters = parameters.parameter.filter(isResourceParameter)

  const resourceParameterWithCorrectName = resourceParameters.find(parameter => parameter.name === name)
  if (!resourceParameterWithCorrectName) {
    throw new errors.InvalidValueError(
      `Parameter with name ${name} not found`
    )
  }

  if (!resourceTypeGuard(resourceParameterWithCorrectName)) {
    throw new errors.InvalidValueError(
      `Parameter with name ${name} has wrong resourceType`
    )
  }

  return resourceParameterWithCorrectName
}

const isPractitionerRoleParameter = (
  resourceParameter: fhir.ResourceParameter<fhir.Resource>
): resourceParameter is fhir.ResourceParameter<fhir.PractitionerRole> => {
  return isPractitionerRole(resourceParameter.resource)
}

export function getAgentParameter(parameters: fhir.Parameters): fhir.ResourceParameter<fhir.PractitionerRole> {
  return getResourceParameterByName(
    parameters,
    "agent",
    isPractitionerRoleParameter
  )
}

const isOrganizationParameter = (
  resourceParameter: fhir.ResourceParameter<fhir.Resource>
): resourceParameter is fhir.ResourceParameter<fhir.Organization> => {
  return isOrganization(resourceParameter.resource)
}

export function getOwnerParameter(parameters: fhir.Parameters): fhir.ResourceParameter<fhir.Organization> {
  return getResourceParameterByName(
    parameters,
    "owner",
    isOrganizationParameter
  )
}

const isBundleParameter = (
  resourceParameter: fhir.ResourceParameter<fhir.Resource>
): resourceParameter is fhir.ResourceParameter<fhir.Bundle> => {
  return isBundle(resourceParameter.resource)
}

export function getBundleParameter(parameters: fhir.Parameters, name: string): fhir.ResourceParameter<fhir.Bundle> {
  return getResourceParameterByName(
    parameters,
    name,
    isBundleParameter
  )
}

export function getOwnerParameterOrNull(parameters: fhir.Parameters): fhir.ResourceParameter<fhir.Organization> {
  const resourceParameters = parameters.parameter.filter(isResourceParameter)
  const ownerParameter = resourceParameters.find(parameter => parameter.name === "owner")
  if (isOrganizationParameter(ownerParameter)) {
    return ownerParameter
  }

  return null
}

function followParametersReference<R extends fhir.Resource>(
  parameters: fhir.Parameters,
  reference: fhir.Reference<R>,
  resourceTypeGuard: (body: unknown) => body is R
): R {
  const [resourceType, resourceId] = reference.reference.split("/")
  const resourceParameters = parameters.parameter.filter(isResourceParameter)
  const resources = resourceParameters.map(parameter => parameter.resource)

  const resourcesWithCorrectResourceType = resources
    .filter(resourceTypeGuard)
  if (resourcesWithCorrectResourceType.length < 1) {
    throw new errors.InvalidValueError(
      `Parameter with resourceType ${resourceType} not found`
    )
  }

  const resourceWithCorrectId = resourcesWithCorrectResourceType
    .find(resource => resource.id === resourceId)
  if (!resourceWithCorrectId) {
    throw new errors.InvalidValueError(
      `Parameter of type ${resourceType} with id ${resourceId} not found`
    )
  }

  return resourceWithCorrectId
}

export function getOrganizationResourceFromParameters(
  parameters: fhir.Parameters,
  reference: fhir.Reference<fhir.Organization>
): fhir.Organization {
  return followParametersReference(parameters, reference, isOrganization)
}

export function getMedicationCoding(
  bundle: fhir.Bundle,
  resourceThatHasMedication: fhir.MedicationDispense | fhir.MedicationRequest
): fhir.Coding {
  const medicationSystem = "http://snomed.info/sct"

  const medicationRequestCodeableConcept = resourceThatHasMedication.medicationCodeableConcept
  if (medicationRequestCodeableConcept) {
    return getCodingForSystem(
      medicationRequestCodeableConcept.coding,
      medicationSystem,
      "MedicationRequest.medicationCodeableConcept.coding"
    )
  } else {
    const medicationResource = getResourceForFullUrl(
      bundle,
      resourceThatHasMedication.medicationReference.reference
    ) as fhir.Medication
    return getCodingForSystem(
      medicationResource.code.coding,
      medicationSystem,
      "Medication.code.coding"
    )
  }
}
