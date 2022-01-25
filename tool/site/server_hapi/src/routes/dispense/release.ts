import Hapi from "@hapi/hapi"
import {getSessionValue, setSessionValue, appendToSessionValue} from "../../services/session"
import {Bundle, OperationOutcome, Parameters, CodeableConcept, Coding} from "fhir/r4"
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

      let withDispenser = false
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
      } else {
        const releaseFailure = releaseResponse.fhirResponse as OperationOutcome
        if (releaseFailure) {
          const details = releaseFailure.issue[0].details as CodeableConcept
          const coding = details.coding as Coding[]
          withDispenser = coding[0].code === "PRESCRIPTION_WITH_ANOTHER_DISPENSER"
        }
      }
      appendToSessionValue("released_prescription_ids", releasedPrescriptionIds, request)

      return responseToolkit.response({
        withDispenser,
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
