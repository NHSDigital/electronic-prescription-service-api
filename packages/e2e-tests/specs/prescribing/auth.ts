import {InteractionObject} from "@pact-foundation/pact"

export const createUnauthorisedInteraction = (desc: string, path: string): InteractionObject => {
  return {
    state: "is not authenticated",
    uponReceiving: desc,
    withRequest: {
      headers: {
        "Content-Type": "application/fhir+json; fhirVersion=4.0"
      },
      method: "POST",
      path: path,
      body: {}
    },
    willRespondWith: {
      headers: {
        "Content-Type": "application/json"
      },
      body: {
        resourceType: "OperationOutcome",
        issue: [
          {
            severity: "error",
            code: "forbidden",
            details: {
              coding: [
                {
                  system: "https://fhir.nhs.uk/R4/CodeSystem/Spine-ErrorOrWarningCode",
                  version: "1",
                  code: "ACCESS_DENIED",
                  display: "Access Denied - Unauthorised"
                }
              ]
            },
            diagnostics: "Invalid access token"
          }
        ]
      },
      status: 401
    }
  }
}
