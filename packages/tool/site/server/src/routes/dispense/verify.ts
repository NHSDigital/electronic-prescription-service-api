import Hapi from "@hapi/hapi"
import {getApigeeAccessTokenFromSession} from "../../services/session"
import {getEpsClient} from "../../services/communication/eps-client"
import * as fhir from "fhir/r4"

export default [
  {
    method: "POST",
    path: "/dispense/verify",
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const verifyRequest = request.payload as fhir.Bundle
      const accessToken = getApigeeAccessTokenFromSession(request)
      const epsClient = getEpsClient(accessToken, request)
      const verifyResponse = await epsClient.makeVerifyRequest(verifyRequest)
      const parameters = verifyResponse.fhirResponse as fhir.Parameters
      const signatureResults = parameters.parameter ? parameters.parameter.map(p => {
        const result = (p.part?.find(p => p.name === "result")?.resource) as fhir.OperationOutcome
        return {
          name: p.name,
          success: result.issue[0]?.code === "informational"
        }
      }) : []
      const success = verifyResponse.statusCode === 200
      return responseToolkit.response({
        success,
        results: signatureResults,
        request: verifyRequest,
        response: verifyResponse.fhirResponse
      }).code(200)
    }
  }
]
