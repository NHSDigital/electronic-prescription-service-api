import {getDispenseEnabled, getPrescribeEnabled} from "../../utils/feature-flags"
import {validationErrors as errors, fhir} from "@models"

export const PRESCRIBING_USER_SCOPE = "urn:nhsd:apim:user-nhs-id:aal3:electronic-prescription-service-api:prescribing"
export const PRESCRIBING_APP_SCOPE = "urn:nhsd:apim:app:level3:electronic-prescription-service-api:prescribing"
export const DISPENSING_USER_SCOPE = "urn:nhsd:apim:user-nhs-id:aal3:electronic-prescription-service-api:dispensing"
export const DISPENSING_APP_SCOPE = "urn:nhsd:apim:app:level3:electronic-prescription-service-api:dispensing"

export function validatePermittedPrescribeMessage(scope: string): Array<fhir.OperationOutcomeIssue> {
  if (!getPrescribeEnabled()) {
    return [errors.createDisabledFeatureIssue("Prescribing")]
  }

  if (!validateScope(scope, [PRESCRIBING_USER_SCOPE])) {
    if (validateScope(scope, [PRESCRIBING_APP_SCOPE])) {
      return [errors.createUserRestrictedOnlyScopeIssue("Prescribing")]
    }
    return [errors.createMissingScopeIssue("Prescribing")]
  }

  return []
}

export function validatePermittedDispenseMessage(scope: string): Array<fhir.OperationOutcomeIssue> {
  if (!getDispenseEnabled()) {
    return [errors.createDisabledFeatureIssue("Dispensing")]
  }

  if (!validateScope(scope, [DISPENSING_USER_SCOPE, DISPENSING_APP_SCOPE])) {
    return [errors.createMissingScopeIssue("Dispensing")]
  }

  return []
}

function validateScope(scope: string, permittedScopes: Array<string>) {
  return scope.split(" ").find(s => permittedScopes.includes(s))
}
