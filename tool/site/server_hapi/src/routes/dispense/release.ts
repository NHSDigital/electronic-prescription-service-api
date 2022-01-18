import Hapi from "@hapi/hapi"
import {getSessionValue, setSessionValue} from "../../services/session"
import {Bundle, OperationOutcome, Parameters} from "fhir/r4"
import {getEpsClient} from "../../services/communication/eps-client"
import {getMedicationRequests} from "../../common/getResources"

export default [
  {
    method: "POST",
    path: "/dispense/release",
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const releaseRequest = request.payload as Parameters
      const accessToken = getSessionValue("access_token", request)
      const epsClient = getEpsClient(accessToken)
      const releaseResponse = await epsClient.makeReleaseRequest(releaseRequest)
      const releaseRequestHl7 = await epsClient.makeConvertRequest(releaseRequest)

      const sessionReleasedPrescriptionIds = getSessionValue("released_prescription_ids", request) ?? []
      const releasedPrescriptionIds: Array<string> = []
      if (isBundleOfBundles(releaseResponse.fhirResponse)) {
        const bundleEntries = releaseResponse.fhirResponse.entry
        if (bundleEntries) {
          for (const entry of bundleEntries) {
            const bundle = entry.resource as Bundle
            const firstMedicationRequest = getMedicationRequests(bundle)[0]
            const prescriptionId = firstMedicationRequest.groupIdentifier?.value ?? ""
            if (prescriptionId) {
              setSessionValue(`release_response_${prescriptionId}`, bundle, request)
              releasedPrescriptionIds.push(prescriptionId)
            }
          }
        }
      }
      sessionReleasedPrescriptionIds.concat(releasedPrescriptionIds)
      setSessionValue("released_prescription_ids", sessionReleasedPrescriptionIds, request)

      return responseToolkit.response({
        prescriptionIds: releasedPrescriptionIds,
        success: releaseResponse.statusCode === 200,
        request_xml: releaseRequestHl7,
        request: releaseRequest,
        response: releaseResponse.fhirResponse,
        response_xml: releaseResponse.spineResponse
      }).code(200)
    }
  },
  {
    method: "GET",
    path: "/dispense/release/{prescriptionId}",
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const prescriptionId = request.params.prescriptionId
      if (!prescriptionId) {
        return responseToolkit.response("Prescription id required in path").code(400)
      }
      const releaseResponse = getSessionValue(`release_response_${prescriptionId}`, request)
      return responseToolkit.response(releaseResponse).code(200)
    }
  }
]

function isBundleOfBundles(fhirResponse: Bundle | OperationOutcome): fhirResponse is Bundle {
  return !!(fhirResponse as Bundle)?.entry?.length
}
