import {
  getContainedPractitionerRoleViaReference,
  getMedicationDispenses,
  getMedicationRequests,
  getPractitionerRoles
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
import {isReference} from "../../utils/type-guards"
import * as common from "../../../../models/fhir/common"

export function verifyBundle(
  bundle: fhir.Bundle,
  scope: string,
  accessTokenSDSUserID: string,
  accessTokenSDSRoleID: string
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

  const commonErrors = verifyCommonBundle(bundle, accessTokenSDSUserID, accessTokenSDSRoleID)

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

export function verifyCommonBundle(
  bundle: fhir.Bundle,
  accessTokenSDSUserID: string,
  accessTokenSDSRoleID: string
): Array<fhir.OperationOutcomeIssue> {
  const incorrectValueErrors: Array<fhir.OperationOutcomeIssue> = []
  const medicationRequests = getMedicationRequests(bundle)

  if (medicationRequests.some(medicationRequest => medicationRequest.intent === fhir.MedicationRequestIntent.PLAN
    || medicationRequest.intent === fhir.MedicationRequestIntent.REFLEX_ORDER
  )) {
    incorrectValueErrors.push(
      errors.createMedicationRequestIncorrectValueIssue(
        "intent",
        // eslint-disable-next-line max-len
        `${fhir.MedicationRequestIntent.ORDER}, ${fhir.MedicationRequestIntent.ORIGINAL_ORDER} or ${fhir.MedicationRequestIntent.INSTANCE_ORDER}`
      )
    )
  }

  if (resourceHasBothCodeableConceptAndReference(medicationRequests)) {
    incorrectValueErrors.push(
      errors.createMedicationFieldIssue("Request")
    )
  }

  const practitionerRoles = getPractitionerRoles(bundle)
  practitionerRoles.forEach(practitionerRole => {
    validatePractitionerRoleReferenceField(
      practitionerRole.practitioner, incorrectValueErrors, "practitionerRole.practitioner"
    )
    validatePractitionerRoleReferenceField(
      practitionerRole.organization, incorrectValueErrors, "practitionerRole.organization"
    )
    if (practitionerRole.healthcareService) {
      practitionerRole.healthcareService.forEach(
        (healthCareService, index) =>
          validatePractitionerRoleReferenceField(
            healthCareService, incorrectValueErrors, `practitionerRole.healthcareService[${index}]`
          )
      )
    }

    if (practitionerRole.practitioner && isReference(practitionerRole.practitioner)) {
      const practitioner = resolveReference(bundle, practitionerRole.practitioner)
      if (practitioner) {
        const bodySDSUserID = getIdentifierValueOrNullForSystem(
          practitioner.identifier,
          "https://fhir.nhs.uk/Id/sds-user-id",
          'Bundle.entry("Practitioner").identifier'
        )
        //Checks if the SDS User ID from the body of the message exists and matches the SDS User ID from the accessToken
        if (bodySDSUserID && bodySDSUserID !== accessTokenSDSUserID) {
          console.warn(
            // eslint-disable-next-line max-len
            `SDS Unique User ID does not match between access token and message body. Access Token: ${accessTokenSDSUserID} Body: ${bodySDSUserID}.`
          )
        }
      }
    }

    if (practitionerRole && practitionerRole.identifier) {
      const bodySDSRoleID = getIdentifierValueForSystem(
        practitionerRole.identifier,
        "https://fhir.nhs.uk/Id/sds-role-profile-id",
        'Bundle.entry("PractitionerRole").identifier'
      )
      if (bodySDSRoleID !== accessTokenSDSRoleID) {
        console.warn(
          // eslint-disable-next-line max-len
          `SDS Role ID does not match between access token and message body. Access Token: ${accessTokenSDSRoleID} Body: ${bodySDSRoleID}.`
        )
      }
    }
  })

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
    'extension("https://fhir.nhs.uk/StructureDefinition/Extension-DM-ResponsiblePractitioner")'
  ]
  const inconsistentValueErrors = fhirPaths
    .map((fhirPath) => verifyIdenticalForAllMedicationRequests(bundle, medicationRequests, fhirPath))
    .filter(isTruthy)
  allErrors.push(...inconsistentValueErrors)

  const prescriptionTypeExtension = getExtensionForUrlOrNull(
    medicationRequests[0].extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionType",
    'Entry("MedicationRequest").extension("https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionType")',
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
    } else if (prescriptionType.startsWith("1", 0)) {
      const prescriptionErrors = checkSecondaryCarePrescriptionResources(practitionerRole, organization)
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
    "bluh"
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
  organization: fhir.Organization,
): fhir.OperationOutcomeIssue {
  if (practitionerRole.healthcareService) {
    return errors.unexpectedField("practitionerRole.healthcareService")
  }

  if (!organization.partOf) {
    return errors.missingRequiredField("organization.partOf")
  }
}

function checkSecondaryCarePrescriptionResources(
  practitionerRole: fhir.PractitionerRole,
  organization: fhir.Organization,
): fhir.OperationOutcomeIssue {
  if (!practitionerRole.healthcareService) {
    return errors.missingRequiredField("practitionerRole.healthcareService")
  }

  if (organization.partOf) {
    return errors.unexpectedField("organization.partOf")
  }
}
