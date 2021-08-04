import {getDispenseEnabled, getPrescribeEnabled} from "../../utils/feature-flags"
import {validationErrors as errors, fhir} from "@models"

const prescribingPermittedScopes = [
  "urn:nhsd:apim:user-nhs-id:aal3:electronic-prescription-service-api:prescribing"
]

const dispensingPermittedScopes = [
  "urn:nhsd:apim:user-nhs-id:aal3:electronic-prescription-service-api:dispensing",
  "urn:nhsd:apim:app:level3:electronic-prescription-service-api:dispensing"
]

export function validatePermittedPrescribeMessage(scope: string): Array<fhir.OperationOutcomeIssue> {
  if (!getPrescribeEnabled()) {
    return [errors.createDisabledFeatureIssue("Prescribing")]
  }

  if (!validateScope(scope, prescribingPermittedScopes)) {
    return [errors.incorrectScopeIssue]
  }

  return []
}

export function validatePermittedDispenseMessage(scope: string): Array<fhir.OperationOutcomeIssue> {
  if (!getDispenseEnabled()) {
    return [errors.createDisabledFeatureIssue("Dispensing")]
  }

  if (!validateScope(scope, dispensingPermittedScopes)) {
    return [errors.incorrectScopeIssue]
  }

  return []
}

function validateScope(scope: string, permittedScopes: Array<string>) {
  return scope.split(" ").find(s => permittedScopes.includes(s))
}
