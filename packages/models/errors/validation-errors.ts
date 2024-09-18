import * as LosslessJson from "lossless-json"
import * as fhir from "../fhir"

export const messageTypeIssue: fhir.OperationOutcomeIssue = {
  severity: "fatal",
  code: fhir.IssueCodes.VALUE,
  diagnostics: `MessageHeader.eventCoding.code must be one of: ${fhir.ACCEPTED_BUNDLE_TYPES.join(", ")}.`,
  expression: ["Bundle.entry.resource.ofType(MessageHeader).eventCoding.code"]
}

export function createUserRestrictedOnlyScopeIssue(featureName: string): fhir.OperationOutcomeIssue {
  return {
    severity: "fatal",
    code: fhir.IssueCodes.FORBIDDEN,
    diagnostics: `${featureName} functionality can only be accessed using the user-restricted access mode.`
  }
}

export function createMissingScopeIssue(featureName: string): fhir.OperationOutcomeIssue {
  return {
    severity: "fatal",
    code: fhir.IssueCodes.FORBIDDEN,
    diagnostics: `Your app does not have permission to access ${featureName.toLowerCase()} functionality.`
  }
}

export function createDisabledFeatureIssue(featureName: string): fhir.OperationOutcomeIssue {
  return {
    severity: "fatal",
    code: fhir.IssueCodes.NOT_SUPPORTED,
    diagnostics: `${featureName} functionality is disabled.`
  }
}

export function createMedicationRequestInconsistentValueIssue<T>(
  fieldName: string,
  uniqueFieldValues: Array<T>
): fhir.OperationOutcomeIssue {
  return {
    severity: "error",
    code: fhir.IssueCodes.VALUE,
    diagnostics: `Expected all MedicationRequests to have the same value for ${
      fieldName
    }. Received ${
      LosslessJson.stringify(uniqueFieldValues)
    }.`,
    expression: [`Bundle.entry.resource.ofType(MedicationRequest).${fieldName}`]
  }
}

export const medicationRequestDuplicateIdentifierIssue: fhir.OperationOutcomeIssue = {
  severity: "error",
  code: fhir.IssueCodes.VALUE,
  diagnostics: "Expected all MedicationRequests to have a different value for identifier.",
  expression: ["Bundle.entry.resource.ofType(MedicationRequest).identifier"]
}

export function createMedicationDispenseInconsistentValueIssue<T>(
  fieldName: string,
  uniqueFieldValues: Array<T>
): fhir.OperationOutcomeIssue {
  return {
    severity: "error",
    code: fhir.IssueCodes.VALUE,
    diagnostics: `Expected all MedicationDispenses to have the same value for ${
      fieldName
    }. Received ${
      LosslessJson.stringify(uniqueFieldValues)
    }.`,
    expression: [`Bundle.entry.resource.ofType(MedicationDispense).${fieldName}`]
  }
}

export function createMedicationDispenseMissingValueIssue(fieldName: string): fhir.OperationOutcomeIssue {
  return {
    severity: "error",
    code: fhir.IssueCodes.VALUE,
    diagnostics: `Expected MedicationDispense to have a value for ${fieldName}.`,
    expression: [`Bundle.entry.resource.ofType(MedicationDispense).${fieldName}`]
  }
}

export const medicationRequestNumberIssue: fhir.OperationOutcomeIssue = {
  severity: "error",
  code: fhir.IssueCodes.VALUE,
  diagnostics: `The Bundle must contain exactly one MedicationRequest if MessageHeader.eventCoding.code is '${
    fhir.EventCodingCode.CANCELLATION
  }'.`,
  expression: ["Bundle.entry.resource.ofType(MedicationRequest)"]
}

export function createMedicationRequestMissingValueIssue(fieldName: string): fhir.OperationOutcomeIssue {
  return {
    severity: "error",
    code: fhir.IssueCodes.VALUE,
    diagnostics: `Expected MedicationRequest to have a value for ${fieldName}.`,
    expression: [`Bundle.entry.resource.ofType(MedicationRequest).${fieldName}`]
  }
}

export function createMedicationRequestIncorrectValueIssue(
  fieldName: string,
  requiredFieldValue: string
): fhir.OperationOutcomeIssue {
  return {
    severity: "error",
    code: fhir.IssueCodes.VALUE,
    diagnostics: `MedicationRequest.${fieldName} must be ${requiredFieldValue}.`,
    expression: [`Bundle.entry.resource.ofType(MedicationRequest).${fieldName}`]
  }
}

export function createResourceTypeIssue(expectedResourceType: string): fhir.OperationOutcomeIssue {
  return {
    severity: "fatal",
    code: fhir.IssueCodes.VALUE,
    diagnostics: `Incorrect FHIR resource type. Expected ${expectedResourceType}.`
  }
}

export function createTaskIncorrectValueIssue(
  fieldName: string,
  ...allowedFieldValues: Array<string>
): fhir.OperationOutcomeIssue {
  return {
    severity: "error",
    code: fhir.IssueCodes.VALUE,
    diagnostics: `Task.${fieldName} must be one of: ${allowedFieldValues.map(v => "'" + v + "'").join(", ")}.`,
    expression: [`Task.${fieldName}`]
  }
}

export function createTaskCodingSystemIssue(
  fieldName: string,
  requiredSystem: string
): fhir.OperationOutcomeIssue {
  return {
    severity: "error",
    code: fhir.IssueCodes.VALUE,
    diagnostics: `Task.${fieldName} must have a system of '${requiredSystem}' and a value from that system.`,
    expression: [`Task.${fieldName}`]
  }
}

export function createMedicationFieldIssue(resource: "Request" | "Dispense"): fhir.OperationOutcomeIssue {
  return {
    severity: "error",
    code: fhir.IssueCodes.STRUCTURE,
    details: {
      coding: [{
        system: "https://fhir.nhs.uk/R4/CodeSystem/Spine-ErrorOrWarningCode",
        code: "CONFLICTING_VALUES",
        display: "Conflicting values have been specified in different fields"
      }]
    },
    diagnostics: `Medication${resource} cannot contain both medicationReference and medicationCodeableConcept fields.`
  }
}

export const unauthorisedActionIssue: fhir.OperationOutcomeIssue = {
  severity: "error",
  code: fhir.IssueCodes.FORBIDDEN,
  details: {
    coding: [
      {
        system: "https://fhir.nhs.uk/R4/CodeSystem/Spine-ErrorOrWarningCode",
        version: "1",
        code: "ACCESS_DENIED",
        display: "Access has been denied to process this request"
      }
    ]
  }
}

export const invalidHeaderOperationOutcome = (headers: Array<string>): fhir.OperationOutcomeIssue => ({
  severity: "error",
  code: fhir.IssueCodes.INVALID,
  details: {
    coding: [{
      system: "https://fhir.nhs.uk/R4/CodeSystem/Spine-ErrorOrWarningCode",
      code: "MISSING_OR_INVALID_HEADER",
      display: "There is a header missing or invalid"
    }]
  },
  diagnostics: `Invalid headers: ${headers}.`
})

export const fieldIsReferenceButShouldNotBe = (fhirPath: string): fhir.OperationOutcomeIssue => ({
  severity: "error",
  code: fhir.IssueCodes.INVALID,
  diagnostics: `${fhirPath} populated incorrectly. Please populate with Identifier and Display.`
})

export const fieldIsNotReferenceButShouldBe = (fhirPath: string): fhir.OperationOutcomeIssue => ({
  severity: "error",
  code: fhir.IssueCodes.INVALID,
  diagnostics: `${fhirPath} populated incorrectly. Please populate with Reference to resource within Bundle.`
})

export function createMissingQueryParameterIssue(requiredQueryParams: Array<string>): fhir.OperationOutcomeIssue {
  return {
    severity: "error",
    code: fhir.IssueCodes.INVALID,
    diagnostics: `At least one of the following query parameters must be provided: ${requiredQueryParams.join(", ")}.`
  }
}

export const invalidResponsiblePractitionerPractitionerReference: fhir.OperationOutcomeIssue = {
  severity: "error",
  code: fhir.IssueCodes.INVALID,
  diagnostics:
    "Responsible practitioner must be either a reference to a Practitioner resource or an identifier reference."
}

export const invalidQueryParameterCombinationIssue: fhir.OperationOutcomeIssue = {
  severity: "error",
  code: fhir.IssueCodes.INVALID,
  diagnostics: "Invalid combination of query parameters."
}

export function createInvalidSystemIssue(param: string, expectedSystem: string): fhir.OperationOutcomeIssue {
  return {
    severity: "error",
    code: fhir.IssueCodes.VALUE,
    diagnostics: expectedSystem
      ? `Query parameter ${param} must have system ${expectedSystem} if specified.`
      : `Query parameter ${param} must not have a system specified.`
  }
}

export const missingRequiredField = (fhirPath: string): fhir.OperationOutcomeIssue => ({
  severity: "error",
  code: fhir.IssueCodes.INVALID,
  diagnostics: `Required field ${fhirPath} is missing.`
})

export const missingRequiredParameter = (parameter: string): fhir.OperationOutcomeIssue => ({
  severity: "error",
  code: fhir.IssueCodes.INVALID,
  diagnostics: `Required parameter ${parameter} is missing.`
})

export const unexpectedField = (fhirPath: string): fhir.OperationOutcomeIssue => ({
  severity: "error",
  code: fhir.IssueCodes.INVALID,
  diagnostics: `Unexpected field of ${fhirPath}.`
})

export function createInvalidIdentifierIssue(
  resource: string,
  acceptedList: string
): fhir.OperationOutcomeIssue {
  return {
    severity: "error",
    code: fhir.IssueCodes.VALUE,

    diagnostics: `Bundle resource ${resource}.identifier expected exactly one professional code from ${acceptedList}.`
  }
}

export function createMissingEndorsementCode(): fhir.OperationOutcomeIssue {
  return {
    severity: "error",
    code: fhir.IssueCodes.INVALID,
    diagnostics: "The claim is missing the required endorsement code."
  }
}

export function createMissingReimbursementAuthority(): fhir.OperationOutcomeIssue {
  return {
    severity: "error",
    code: fhir.IssueCodes.INVALID,
    diagnostics: "The dispense notification is missing the reimbursement authority and it should be provided."
  }
}

export function createMissingODSCodeForReimbursementAuthority(): fhir.OperationOutcomeIssue {
  return {
    severity: "error",
    code: fhir.IssueCodes.INVALID,
    diagnostics: "The dispense notification is missing the ODS code " +
    "for reimbursement authority and it should be provided."
  }
}

export function createMissingDosageSequenceInstructions(): fhir.OperationOutcomeIssue {
  return {
    severity: "error",
    code: fhir.IssueCodes.INVALID,
    details: {
      coding: [{
        code: "MISSING_VALUE",
        display: "The request contains multiple dosage instruction " +
        "lines but no corresponding dosage sequence number."
      }]
    }
  }
}

export function invalidArrayLengthIssue(
  fhirPath: string,
  actualLength: number,
  expectedLength: number
): fhir.OperationOutcomeIssue {
  return {
    severity: "error",
    code: fhir.IssueCodes.INVALID,
    diagnostics: `Expected ${expectedLength} item(s) in ${fhirPath}, but received ${actualLength}.`
  }
}

export function createClaimInvalidValueIssue(
  fieldName: string,
  ...allowedFieldValues: Array<string>
): fhir.OperationOutcomeIssue {
  return {
    severity: "error",
    code: fhir.IssueCodes.VALUE,
    diagnostics: `Claim.${fieldName} must be one of: ${allowedFieldValues.map(v => "'" + v + "'").join(", ")}.`,
    expression: [`Claim.${fieldName}`]
  }
}
