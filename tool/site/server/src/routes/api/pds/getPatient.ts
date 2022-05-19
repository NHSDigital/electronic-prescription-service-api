import Hapi from "@hapi/hapi"
import {OperationOutcome} from "fhir/r4"
import {getPdsClient} from "../../../services/communication/pds-client"
import {getSessionValue} from "../../../services/session"

export default [
  {
    method: "GET",
    path: "/api/patient/{id}",
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const accessToken = getSessionValue("access_token", request)
      const pdsClient = getPdsClient(accessToken)
      const patientResponse = await pdsClient.makeGetPatientRequest(request.params.id)
      return responseToolkit.response({
        success: !isError(patientResponse),
        response: patientResponse
      }).code(200)
    }
  }
]

function isError(response: unknown): response is OperationOutcome {
  return (response as OperationOutcome).issue !== undefined
}
