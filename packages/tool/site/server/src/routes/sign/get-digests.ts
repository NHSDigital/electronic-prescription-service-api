import Hapi from "@hapi/hapi"
import {getEpsClient} from "../../services/communication/eps-client"
import {getApigeeAccessTokenFromSession, getSessionValue, setSessionValue} from "../../services/session"
import * as fhir from "fhir/r4"
import {getSessionPrescriptionIdsArray} from "../util"
import {base64Encode} from "../helpers"

export default [
  {
    method: "GET",
    path: "/sign/get-digests",
    handler: async (request: Hapi.Request): Promise<string> => {
      const accessToken = getApigeeAccessTokenFromSession(request)
      const epsClient = getEpsClient(accessToken, request)
      const prescriptionIds = getSessionPrescriptionIdsArray(request)
      const prepareResponses = []
      for (const id of prescriptionIds) {
        const prepareRequest = getSessionValue(`prepare_request_${id}`, request)
        const prepareResponse = await epsClient.makePrepareRequest(prepareRequest)
        setSessionValue(`prepare_response_${id}`, prepareResponse, request)
        if (!prepareResponseIsError(prepareResponse)) {
          prepareResponses.push({
            id: id,
            response: prepareResponse
          })
        }
      }
      const payload = {
        payloads: prepareResponses.map(pr => {
          return {
            id: pr.id,
            payload: pr.response.parameter?.find(p => p.name === "digest")?.valueString
          }
        }),
        algorithm: prepareResponses[0].response.parameter?.find(p => p.name === "algorithm")?.valueString,
        requestType: 1,
        version: 1,
        flags: 0
      }

      return base64Encode(JSON.stringify(payload))
    }
  }
]

function prepareResponseIsError(prepareResponse: fhir.Parameters | fhir.OperationOutcome): prepareResponse is fhir.OperationOutcome {
  return !!(prepareResponse as fhir.OperationOutcome).issue?.length
}
