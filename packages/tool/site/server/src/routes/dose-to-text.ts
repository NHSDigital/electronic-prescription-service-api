import Hapi, {RouteDefMethods} from "@hapi/hapi"
import {getApigeeAccessTokenFromSession} from "../services/session"
import {getEpsClient} from "../services/communication/eps-client"
import * as fhir from "fhir/r4"

export interface DosageTranslation {
  identifier: Array<fhir.Identifier>
  dosageInstructionText: string
}
export type DosageTranslationArray = Array<DosageTranslation>
export default [
  {
    method: "POST" as RouteDefMethods,
    path: "/dose-to-text",
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const doseToTextRequest = request.payload as fhir.FhirResource
      const accessToken = getApigeeAccessTokenFromSession(request)
      const epsClient = getEpsClient(accessToken, request)
      const doseToTextResponse = await epsClient.makeDoseToTextRequest(doseToTextRequest)
      const epsResponse = doseToTextResponse.fhirResponse as DosageTranslationArray
      const doseToTextResults = epsResponse ?? []
      const success = doseToTextResponse.statusCode === 200
      return responseToolkit.response({
        success,
        results: doseToTextResults,
        request: doseToTextRequest,
        response: doseToTextResponse.fhirResponse
      }).code(200)
    }
  }
]
