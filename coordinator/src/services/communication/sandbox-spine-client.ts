import {SpineRequest, SpineResponse} from "../../models/spine"
import * as hl7V3 from "../../models/hl7-v3"
import * as fhir from "../../models/fhir"
import * as sandboxResponses from "../../models/sandbox/responses"
import {SpineClient} from "./spine-client"

export class SandboxSpineClient implements SpineClient {
  async send(spineRequest: SpineRequest): Promise<SpineResponse<unknown>> {
    switch (spineRequest.interactionId) {
      case hl7V3.Hl7InteractionIdentifier.PARENT_PRESCRIPTION_URGENT._attributes.extension:
        return Promise.resolve({
          statusCode: 200,
          body: sandboxResponses.PARENT_PRESCRIPTION_URGENT
        })
      case hl7V3.Hl7InteractionIdentifier.CANCEL_REQUEST._attributes.extension:
        return Promise.resolve({
          statusCode: 200,
          body: sandboxResponses.CANCEL_REQUEST
        })
      case hl7V3.Hl7InteractionIdentifier.NOMINATED_PRESCRIPTION_RELEASE_REQUEST._attributes.extension:
        return Promise.resolve({
          statusCode: 200,
          body: sandboxResponses.NOMINATED_PRESCRIPTION_RELEASE_REQUEST
        })
      case hl7V3.Hl7InteractionIdentifier.DISPENSE_NOTIFICATION._attributes.extension:
        return Promise.resolve({
          statusCode: 200,
          // todo: replace with actual spine dispense notification response when able to get one
          body: sandboxResponses.NOMINATED_PRESCRIPTION_RELEASE_REQUEST
        })
      default:
        return Promise.resolve({
          statusCode: 400,
          body: notSupportedOperationOutcome
        })
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async poll(path: string): Promise<SpineResponse<fhir.OperationOutcome>> {
    return Promise.resolve({
      statusCode: 400,
      body: notSupportedOperationOutcome
    })
  }
}

const notSupportedOperationOutcome: fhir.OperationOutcome = {
  resourceType: "OperationOutcome",
  issue: [
    {
      code: "informational",
      severity: "information",
      details: {
        coding: [
          {
            code: "INTERACTION_NOT_SUPPORTED_BY_SANDBOX",
            display: "Interaction not supported by sandbox",
            system: "https://fhir.nhs.uk/R4/CodeSystem/Spine-ErrorOrWarningCode",
            version: "1"
          }
        ]
      }
    }
  ]
}
