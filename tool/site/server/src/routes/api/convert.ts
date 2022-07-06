import Hapi from "@hapi/hapi"
import * as fhir from "fhir/r4"
import {getEpsClient} from "../../services/communication/eps-client"
import {getApigeeAccessTokenFromSession} from "../../services/session"

export default [
  {
    method: "POST",
    path: "/api/convert",
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const bundle = request.payload as fhir.FhirResource

      const accessToken = getApigeeAccessTokenFromSession(request)
      const epsClient = getEpsClient(accessToken, request)

      request.logger.debug(`Received FHIR Bundle with Bundle.id: ${bundle.id}. Sending to Convert.`)
      const convertedBundle = await epsClient.makeConvertRequest(bundle)
      request.logger.debug(`Converted ${bundle.id}`)

      return responseToolkit.response(convertedBundle).code(200)
    }
  }
]
