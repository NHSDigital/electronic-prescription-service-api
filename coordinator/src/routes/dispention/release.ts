import * as fhir from "../../models/fhir/fhir-resources"
import * as Hapi from "@hapi/hapi"
import {basePath, externalFHIRValidation, getPayload, toFhirError} from "../util"
import {ResourceTypeError} from "../../models/errors/validation-errors"

const bundle1Id = "eff31db2-a914-44a9-b89d-1a33f6de727e"
const genericBundle1: fhir.Bundle = {
  resourceType: "Bundle",
  type: "message",
  id: bundle1Id,
  identifier: {
    value: bundle1Id
  }
}

const bundle2Id = "f6f2fd4a-0f5a-4cee-82a0-e6d08d64c2b4"
const genericBundle2: fhir.Bundle = {
  resourceType: "Bundle",
  type: "message",
  id: bundle2Id,
  identifier: {
    value: bundle2Id
  }
}

export default [
  /*
    Send a dispense release request to SPINE
  */
  {
    method: "POST",
    path: `${basePath}/Task/$release`,
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) => {
      const fhirValidatorResponse = await externalFHIRValidation(request)
      if (fhirValidatorResponse.issue.length > 0) {
        return responseToolkit.response(fhirValidatorResponse).code(400)
      }

      const requestPayload = getPayload(request) as fhir.Resource

      if (requestPayload.resourceType !== "Parameters") {
        return responseToolkit
          .response(toFhirError([new ResourceTypeError("Parameters")]))
          .code(400)
      }

      request.logger.info("Sandbox release response")
      const messageId = "d5a20db9-6d76-4aeb-a190-9a85843b01bf"
      const sandboxResponse: fhir.Bundle = {
        resourceType: "Bundle",
        type: "searchset",
        total: 2,
        id: messageId,
        identifier: {
          value: messageId
        },
        entry: [
          {resource: genericBundle1, fullUrl: `urn:uuid:${bundle1Id}`},
          {resource: genericBundle2, fullUrl: `urn:uuid:${bundle2Id}`}
        ]
      }
      return responseToolkit.response(sandboxResponse)
    }

  } as Hapi.ServerRoute
]
