import {
  PathedResource,
  getBundleEntriesOfType,
  getContainedPractitionerRoleViaReference,
  getMedicationDispenses,
  getMedicationRequests,
  getPathedTelecoms
} from "../translation/common/getResourcesOfType"
import {applyFhirPath} from "./fhir-path"
import {getUniqueValues} from "../../utils/collections"
import {
  getExtensionForUrlOrNull,
  getIdentifierValueForSystem,
  getIdentifierValueOrNullForSystem,
  identifyMessageType,
  isTruthy,
  resolvePractitioner,
  resolveReference
} from "../translation/common"
import {fhir, processingErrors, validationErrors as errors} from "@models"
import {isRepeatDispensing} from "../translation/request"
import {validatePermittedAttendedDispenseMessage, validatePermittedPrescribeMessage} from "./scope-validator"
import {isIdentifierReference, isReference} from "../../utils/type-guards"
import * as common from "../../../../models/fhir/common"
import {PractitionerRole} from "../../../../models/fhir"
import pino from "pino"

export function verifyBundle(
  bundle: fhir.Bundle,
  scope: string,
  accessTokenSDSUserID: string,
  accessTokenSDSRoleID: string,
  logger: pino.Logger<never>
): Array<fhir.OperationOutcomeIssue> {
  if (bundle.resourceType !== "Bundle") {
    return [errors.createResourceTypeIssue("Bundle")]
  }

  const messageType = identifyMessageType(bundle)
  if (fhir.PRESCRIBE_BUNDLE_TYPES.includes(messageType)) {
    const permissionErrors = validatePermittedPrescribeMessage(scope)
    if (permissionErrors.length) {
      return permissionErrors
    }
  } else if (fhir.DISPENSE_BUNDLE_TYPES.includes(messageType)) {
    const permissionErrors = validatePermittedAttendedDispenseMessage(scope)
    if (permissionErrors.length) {
      return permissionErrors
    }
  } else {
    return [errors.messageTypeIssue]
  }

  const commonErrors = verifyCommonBundle(bundle, accessTokenSDSUserID, accessTokenSDSRoleID, logger)

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

function resourceHasBothCodeableConceptAndReference(
  resources: Array<fhir.MedicationRequest | fhir.MedicationDispense>
) {
  return resources.some(
    resource => resource.medicationCodeableConcept && resource.medicationReference
  )
}

function validatePractitionerRoleReferenceField<T extends fhir.Resource>(
  fieldToValidate: common.Reference<T> | common.IdentifierReference<T>,
  incorrectValueErrors: Array<fhir.OperationOutcomeIssue>,
  fhirPathToField: string
) {
  if (!isReference(fieldToValidate)) {
    incorrectValueErrors.push(errors.fieldIsNotReferenceButShouldBe(fhirPathToField))
  }
}

function validatePractitionerRolePractitionerField(
  fieldToValidate: common.Reference<fhir.Practitioner> | common.IdentifierReference<fhir.Practitioner>,
  incorrectValueErrors: Array<fhir.OperationOutcomeIssue>,
  fhirPathToField: string,
  isResponsibleParty: boolean
) {
  if (!isResponsibleParty) {
    return validatePractitionerRoleReferenceField(
      fieldToValidate, incorrectValueErrors, fhirPathToField
    )
  }

  const fieldIsReference = isReference(fieldToValidate)
  const fieldIsIdentifierReference = isIdentifierReference(fieldToValidate)
  // Should be reference XOR identity reference
  const isInvalid = fieldIsReference === fieldIsIdentifierReference
  if (isInvalid) {
    incorrectValueErrors.push(
      errors.invalidResponsiblePractitionerPractitionerReference
    )
  }
}

export function verifyCommonBundle(
  bundle: fhir.Bundle,
  accessTokenSDSUserID: string,
  accessTokenSDSRoleID: string,
  logger: pino.Logger<never>
): Array<fhir.OperationOutcomeIssue> {
  const incorrectValueErrors: Array<fhir.OperationOutcomeIssue> = []
  const medicationRequests = getMedicationRequests(bundle)

  validateMedicationRequests(medicationRequests, incorrectValueErrors)

  validateTelecoms(bundle, incorrectValueErrors)

  const responsiblePartyUrls = medicationRequests.map(request => {
    return getExtensionForUrlOrNull(
      request.extension,
      "https://fhir.nhs.uk/StructureDefinition/Extension-DM-ResponsiblePractitioner",
      "MedicationRequest.extension"
    ) as fhir.ReferenceExtension<PractitionerRole>
  }).filter(isTruthy).map(extension => extension.valueReference.reference)

  const practitionerRoles = getBundleEntriesOfType(bundle, "PractitionerRole")
  practitionerRoles.forEach(practitionerRole =>{
    const isResponsibleParty = responsiblePartyUrls.some(
      responsiblePartyUrl => responsiblePartyUrl === practitionerRole.fullUrl
    )

    validatePractitionerRole(
      bundle,
      practitionerRole.resource as fhir.PractitionerRole,
      isResponsibleParty,
      incorrectValueErrors,
      accessTokenSDSUserID,
      accessTokenSDSRoleID,
      logger
    )
  }
  )

  return incorrectValueErrors
}

function validateMedicationRequests(
  medicationRequests: Array<fhir.MedicationRequest>,
  incorrectValueErrors: Array<fhir.OperationOutcomeIssue>
) {
  const containsPlanOrReflex = medicationRequests.some(
    medicationRequest => isPlanOrReflex(medicationRequest.intent)
  )
  if (containsPlanOrReflex) {
    incorrectValueErrors.push(
      errors.createMedicationRequestIncorrectValueIssue(
        "intent",
        `${fhir.MedicationRequestIntent.ORDER}, `
        + `${fhir.MedicationRequestIntent.ORIGINAL_ORDER} or `
        + `${fhir.MedicationRequestIntent.INSTANCE_ORDER}`
      )
    )
  }

  if (resourceHasBothCodeableConceptAndReference(medicationRequests)) {
    incorrectValueErrors.push(
      errors.createMedicationFieldIssue("Request")
    )
  }
}

function validatePractitionerRole(
  bundle: fhir.Bundle,
  practitionerRole: fhir.PractitionerRole,
  isResponsibleParty: boolean,
  incorrectValueErrors: Array<fhir.OperationOutcomeIssue>,
  accessTokenSDSUserID: string,
  accessTokenSDSRoleID: string,
  logger: pino.Logger<never>
): void {
  if (practitionerRole.practitioner) {
    validatePractitionerRolePractitionerField(
      practitionerRole.practitioner, incorrectValueErrors, "practitionerRole.practitioner", isResponsibleParty
    )
  }
  validatePractitionerRoleReferenceField(
    practitionerRole.organization, incorrectValueErrors, "practitionerRole.organization"
  )
  practitionerRole.healthcareService?.forEach(
    (healthCareService, index) =>
      validatePractitionerRoleReferenceField(
        healthCareService, incorrectValueErrors, `practitionerRole.healthcareService[${index}]`
      )
  )

  const PractitionerRoleIsReference = practitionerRole.practitioner && isReference(practitionerRole.practitioner)
  if (PractitionerRoleIsReference) {
    const practitioner = resolveReference(
      bundle, practitionerRole.practitioner as fhir.Reference<PractitionerRole>
    )
    if (practitioner) {
      verifyPractitionerID(practitioner.identifier, accessTokenSDSUserID, logger)
    }
  }

  const hasPractitionerRoleIdentifier = practitionerRole && practitionerRole.identifier
  if (hasPractitionerRoleIdentifier) {
    verifyPractitionerRoleID(practitionerRole.identifier, accessTokenSDSRoleID, logger)
  }
}

function verifyPractitionerRoleID(
  identifier: Array<fhir.Identifier>,
  accessTokenSDSRoleID: string,
  logger: pino.Logger<never>): void{
  const bodySDSRoleID = getIdentifierValueForSystem(
    identifier,
    "https://fhir.nhs.uk/Id/sds-role-profile-id",
    'Bundle.entry("PractitionerRole").identifier'
  )
  if (bodySDSRoleID !== accessTokenSDSRoleID) {
    logger.warn(
      {accessTokenSDSRoleID, bodySDSRoleID},
      "SDS Role ID does not match between access token and message body"
    )
  }
}

function verifyPractitionerID(
  identifier: Array<fhir.Identifier>,
  accessTokenSDSUserID: string,
  logger: pino.Logger<never>
): void{
  const bodySDSUserID = getIdentifierValueOrNullForSystem(
    identifier,
    "https://fhir.nhs.uk/Id/sds-user-id",
    'Bundle.entry("Practitioner").identifier'
  )
  //Checks if the SDS User ID from the body of the message exists and matches the SDS User ID from the accessToken
  if (bodySDSUserID && bodySDSUserID !== accessTokenSDSUserID) {
    logger.warn(
      {accessTokenSDSUserID, bodySDSUserID},
      "SDS Unique User ID does not match between access token and message body"
    )
  }
}

function isPlanOrReflex(intent:fhir.MedicationRequestIntent):boolean {
  return (
    intent === fhir.MedicationRequestIntent.PLAN ||
    intent === fhir.MedicationRequestIntent.REFLEX_ORDER
  )
}

// HERE?
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
    'extension("https://fhir.nhs.uk/StructureDefinition/Extension-DM-ResponsiblePractitioner")'
  ]
  const inconsistentValueErrors = fhirPaths
    .map((fhirPath) => verifyIdenticalForAllMedicationRequests(bundle, medicationRequests, fhirPath))
    .filter(isTruthy)
  allErrors.push(...inconsistentValueErrors)

  const prescriptionTypeExtension = getExtensionForUrlOrNull(
    medicationRequests[0].extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionType",
    'Entry("MedicationRequest").extension("https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionType")'
  ) as fhir.CodingExtension
  const prescriptionType = prescriptionTypeExtension.valueCoding.code

  const practitionerRole = resolveReference(
    bundle,
    medicationRequests[0].requester
  )

  if (isReference(practitionerRole.organization)) {
    const organization = resolveReference(
      bundle,
      practitionerRole.organization
    )
    if (prescriptionType.startsWith("01", 0)) {
      const prescriptionErrors = checkPrimaryCarePrescriptionResources(practitionerRole, organization)
      if (prescriptionErrors) {
        allErrors.push(prescriptionErrors)
      }
    }
  } else {
    allErrors.push(errors.fieldIsNotReferenceButShouldBe("practitionerRole.organization"))
  }

  const practitioner = resolvePractitioner(
    bundle,
    practitionerRole.practitioner
  )
  const gmpCode = getIdentifierValueOrNullForSystem(
    practitioner.identifier,
    "https://fhir.hl7.org.uk/Id/gmp-number",
    "Practitioner.identifier"
  )
  if (gmpCode) {
    allErrors.push(
      errors.createInvalidIdentifierIssue(
        "Practitioner",
        "GMC|NMC|GPhC|HCPC|professional-code"
      )
    )
  }

  const repeatDispensingErrors =
    isRepeatDispensing(medicationRequests)
      ? verifyRepeatDispensingPrescription(bundle, medicationRequests)
      : []
  allErrors.push(...repeatDispensingErrors)

  if (medicationRequests.some(medicationRequest => medicationRequest.status !== "active")) {
    allErrors.push(errors.createMedicationRequestIncorrectValueIssue("status", "active"))
  }

  if (!allMedicationRequestsHaveUniqueIdentifier(medicationRequests)) {
    allErrors.push(errors.medicationRequestDuplicateIdentifierIssue)
  }

  medicationRequests.forEach(request => {
    const dosageInstruction = request.dosageInstruction

    if (dosageInstruction.length === 0) {
      allErrors.push(errors.missingRequiredField("dosageInstructions"))
    }

    if (dosageInstruction.length === 1) {
      return dosageInstruction[0].text
    }

    if (dosageInstruction.some(dosage => !dosage.sequence)) {
      allErrors.push(errors.createMissingDosageSequenceInstructions())
    }
  })

  return allErrors
}

export function verifyRepeatDispensingPrescription(
  bundle: fhir.Bundle,
  medicationRequests: Array<fhir.MedicationRequest>
): Array<fhir.OperationOutcomeIssue> {
  const validationErrors = []

  const fhirPaths = ["dispenseRequest.numberOfRepeatsAllowed"]

  const firstMedicationRequest = medicationRequests[0]
  const repeatInformationExtension = getExtensionForUrlOrNull(
    firstMedicationRequest.extension,
    "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-MedicationRepeatInformation",
    "MedicationRequest.extension"
  )
  if(repeatInformationExtension && repeatInformationExtension.extension?.length) {
    fhirPaths.push(
      'extension("https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-MedicationRepeatInformation")')
  }

  const inconsistentValueErrors = fhirPaths
    .map((fhirPath) => verifyIdenticalForAllMedicationRequests(bundle, medicationRequests, fhirPath))
    .filter(isTruthy)
  validationErrors.push(...inconsistentValueErrors)

  if (!firstMedicationRequest.dispenseRequest.validityPeriod) {
    validationErrors.push(errors.createMedicationRequestMissingValueIssue("dispenseRequest.validityPeriod"))
  }

  if (!firstMedicationRequest.dispenseRequest.expectedSupplyDuration) {
    validationErrors.push(errors.createMedicationRequestMissingValueIssue("dispenseRequest.expectedSupplyDuration"))
  }

  return validationErrors
}

export function verifyCancellationBundle(bundle: fhir.Bundle): Array<fhir.OperationOutcomeIssue> {
  const validationErrors = []

  const medicationRequests = getMedicationRequests(bundle)
  if (medicationRequests.length !== 1) {
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
    "whenHandedOver",
    "subject.identifier.value",
    'extension("https://fhir.nhs.uk/StructureDefinition/Extension-EPS-RepeatInformation")'
  ]

  const inconsistentValueErrors = fhirPaths
    .map((fhirPath) => verifyIdenticalForAllMedicationDispenses(bundle, medicationDispenses, fhirPath))
    .filter(isTruthy)
  allErrors.push(...inconsistentValueErrors)

  const practitionerRoleReferences = medicationDispenses.flatMap(m => m.performer.map(p => p.actor))
  const uniquePractitionerRoles = getUniqueValues(practitionerRoleReferences)
  if (uniquePractitionerRoles.length > 1) {
    allErrors.push(
      errors.createMedicationDispenseInconsistentValueIssue(
        "performer",
        uniquePractitionerRoles
      )
    )
  }

  if (medicationDispenses.some(medicationDispense => medicationDispense.performer.length === 0)) {
    allErrors.push(errors.createMedicationDispenseMissingValueIssue("performer.ofType(PractitionerRole)"))
  }

  if (resourceHasBothCodeableConceptAndReference(medicationDispenses)) {
    allErrors.push(
      errors.createMedicationFieldIssue("Dispense")
    )
  }

  const practitionerRole = getContainedPractitionerRoleViaReference(
    medicationDispenses[0],
    medicationDispenses[0].performer[0].actor.reference
  )
  if (practitionerRole.practitioner && isReference(practitionerRole.practitioner)) {
    allErrors.push(
      errors.fieldIsReferenceButShouldNotBe('Bundle.entry("PractitionerRole").practitioner')
    )
  }

  const organizationRef = practitionerRole.organization
  if (!isReference(organizationRef)) {
    throw new processingErrors.InvalidValueError(
      "fhirContainedPractitionerRole.organization should be a Reference",
      'resource("MedicationDispense").contained("organization")'
    )
  }

  const fhirOrganisation = resolveReference(bundle, organizationRef)

  const BSAExtension = getExtensionForUrlOrNull(
    fhirOrganisation.extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-ODS-OrganisationRelationships",
    "Organization.extension"
  )
  if (!BSAExtension){
    allErrors.push(
      errors.createMissingReimbursementAuthority()
    )
    return allErrors
  }

  const commissionedByExtension = getExtensionForUrlOrNull(
    BSAExtension.extension,
    "reimbursementAuthority",
    "Organization.extension[0].extension[0]"
  ) as fhir.IdentifierExtension

  if (!commissionedByExtension){
    allErrors.push(
      errors.createMissingODSCodeForReimbursementAuthority()
    )
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

export function verifyIdenticalForAllMedicationRequests(
  bundle: fhir.Bundle,
  medicationRequests: Array<fhir.MedicationRequest>,
  fhirPath: string
): fhir.OperationOutcomeIssue {
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

function checkPrimaryCarePrescriptionResources(
  practitionerRole: fhir.PractitionerRole,
  organization: fhir.Organization
): fhir.OperationOutcomeIssue {
  if (practitionerRole.healthcareService) {
    return errors.unexpectedField("practitionerRole.healthcareService")
  }

  if (!organization.partOf) {
    return errors.missingRequiredField("organization.partOf")
  }
}

function validateTelecoms(bundle: fhir.Bundle, incorrectValueErrors: Array<fhir.OperationOutcomeIssue>) {
  const telecoms = getPathedTelecoms(bundle)

  const validateTelecom = (resource: PathedResource<fhir.ContactPoint>) => {
    if(!resource.resource.value){
      incorrectValueErrors.push(errors.missingRequiredField(`${resource.path}.value`))
    }
    if(!resource.resource.use){
      incorrectValueErrors.push(errors.missingRequiredField(`${resource.path}.use`))
    }
  }

  telecoms.forEach(validateTelecom)
}
