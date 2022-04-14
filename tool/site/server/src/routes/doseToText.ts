import Hapi from "@hapi/hapi"
import {getSessionValue} from "../services/session"
import {getEpsClient} from "../services/communication/eps-client"
import * as fhir from "fhir/r4"

interface DosageTranslation{
    identifier: Array<fhir.Identifier>
    dosageInstructionText: string
}
export default [
    {
      method: "POST",
      path: "/doseToText",
      handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
        const doseToTextRequest = request.payload as fhir.Bundle
        const accessToken = getSessionValue("access_token", request)
        const epsClient = getEpsClient(accessToken, request)
        const doseToTextResponse = await epsClient.makeDoseToTextRequest(doseToTextRequest)
        const epsResponse = doseToTextResponse.fhirResponse as Array<DosageTranslation> 
        const signatureResults = epsResponse ? epsResponse.map(p => {
          const result = (p.part?.find(p => p.name === "result")?.resource) as fhir.OperationOutcome
          return {
            name: p.name,
            success: result.issue[0]?.code === "informational"
          }
        }) : []
        const success = doseToTextResponse.statusCode === 200
        return responseToolkit.response({
          success,
          results: signatureResults,
          request: doseToTextRequest,
          response: doseToTextResponse.fhirResponse
        }).code(200)
      }
    }
  ]
