import Hapi from "@hapi/hapi"
import {getSigningClient} from "../../services/communication/signing-client"
import {getEpsClient} from "../../services/communication/eps-client"
import {getSessionValue, setSessionValue} from "../../services/session"
import * as fhir from "fhir/r4"

export default [
  {
    method: "POST",
    path: "/sign/upload-signatures",
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const accessToken = getSessionValue("access_token", request)
      const epsClient = getEpsClient(accessToken, request)
      const signingClient = getSigningClient(request, accessToken)
      const prescriptionIds = getSessionValue("prescription_ids", request).map((id: { prescriptionId: string }) => id.prescriptionId)
      const successfulPreparePrescriptionIds = []
      for (const id of prescriptionIds) {
        const prepareRequest = getSessionValue(`prepare_request_${id}`, request)
        const prepareResponse = await epsClient.makePrepareRequest(prepareRequest)
        setSessionValue(`prepare_response_${id}`, prepareResponse, request)
        if (!prepareResponseIsError(prepareResponse)) {
          successfulPreparePrescriptionIds.push(id)
        }
      }
      const prepareResponses = successfulPreparePrescriptionIds.map((id: string) => {
        return {
          id: id,
          response: getSessionValue(`prepare_response_${id}`, request)
        }
      })
      const response = await signingClient.uploadSignatureRequest(prepareResponses)
      return responseToolkit.response(response).code(200)
    }
  }
]

function prepareResponseIsError(prepareResponse: fhir.Parameters | fhir.OperationOutcome)
: prepareResponse is fhir.OperationOutcome {
  return !!(prepareResponse as fhir.OperationOutcome).issue?.length
}
