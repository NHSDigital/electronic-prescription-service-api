import {fhir, spine} from "@models"

export const notSupportedOperationOutcome: fhir.OperationOutcome = {
  resourceType: "OperationOutcome",
  issue: [
    {
      code: fhir.IssueCodes.INFORMATIONAL,
      severity: "information",
      details: {
        coding: [
          {
            code: "INTERACTION_NOT_SUPPORTED_BY_MTLS_CLIENT",
            display: "Interaction not supported by mtls client",
            system: "https://fhir.nhs.uk/R4/CodeSystem/Spine-ErrorOrWarningCode",
            version: "1"
          }
        ]
      }
    }
  ]
}

export const timeoutOperationOutcome: fhir.OperationOutcome = {
  resourceType: "OperationOutcome",
  issue: [
    {
      code: fhir.IssueCodes.EXCEPTION,
      severity: "error",
      details: {
        coding: [
          {
            code: "TIMEOUT",
            display: "Timeout waiting for response",
            system: "https://fhir.nhs.uk/R4/CodeSystem/Spine-ErrorOrWarningCode",
            version: "1"
          }
        ]
      }
    }
  ]
}
export function notSupportedOperationOutcomePromise(): Promise<spine.SpineResponse<fhir.OperationOutcome>> {
  return Promise.resolve({
    statusCode: 400,
    body: notSupportedOperationOutcome
  })
}
