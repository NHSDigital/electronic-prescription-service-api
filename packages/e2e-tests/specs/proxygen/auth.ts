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
        "Content-Type": "text/plain"
      },
      status: 401
    }
  }
}
