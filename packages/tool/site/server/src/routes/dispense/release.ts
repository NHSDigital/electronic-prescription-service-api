import Hapi, {RouteDefMethods} from "@hapi/hapi"
import {
  getSessionValue,
  setSessionValue,
  appendToSessionValue,
  getApigeeAccessTokenFromSession
} from "../../services/session"
import {
  Bundle,
  OperationOutcome,
  Parameters,
  CodeableConcept,
  Coding,
  BundleEntry
} from "fhir/r4"
import {getEpsClient} from "../../services/communication/eps-client"
import {getMedicationRequests} from "../../common/getResources"

interface DispenserDetails {
  odsCode: string
  name: string
  tel: string
}

export default [
  {
    method: "POST" as RouteDefMethods,
    path: "/dispense/release",
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const releaseRequest = request.payload as Parameters
      const accessToken = getApigeeAccessTokenFromSession(request)
      const epsClient = getEpsClient(accessToken, request)
      const releaseResponse = await epsClient.makeReleaseRequest(releaseRequest)
      const releaseRequestHl7 = await epsClient.makeConvertRequest(releaseRequest)

      let withDispenser: DispenserDetails | undefined = undefined
      const releasedPrescriptionIds: Array<string> = []
      if (!responseIsError(releaseResponse.fhirResponse)) {
        let bundleEntries: Array<BundleEntry> = []
        const passedBundle = releaseResponse.fhirResponse.parameter
          ?.find(p => p.name === "passedPrescriptions")?.resource as Bundle
        if (passedBundle.entry) {
          bundleEntries = passedBundle.entry
        }
        const failedBundle = releaseResponse.fhirResponse.parameter
          ?.find(p => p.name === "failedPrescriptions")?.resource as Bundle
        if (failedBundle.entry) {
          bundleEntries = bundleEntries.concat(failedBundle.entry.filter(e => e.resource?.resourceType === "Bundle"))
        }
        for (const entry of bundleEntries) {
          const bundle = entry.resource as Bundle
          const firstMedicationRequest = getMedicationRequests(bundle)[0]
          const prescriptionId = firstMedicationRequest.groupIdentifier?.value ?? ""
          if (prescriptionId) {
            setSessionValue(`release_response_${prescriptionId}`, bundle, request)
            releasedPrescriptionIds.push(prescriptionId)
          }
        }
      } else {
        const releaseFailure: OperationOutcome = releaseResponse.fhirResponse
        withDispenser = handleResponseError(releaseFailure)
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
    method: "GET" as RouteDefMethods,
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

function responseIsError(response: Parameters | OperationOutcome)
: response is OperationOutcome {
  return !!(response as OperationOutcome).issue?.length
}

function handleResponseError(releaseFailure: OperationOutcome): (DispenserDetails | undefined) {
  if (!releaseFailure) return undefined
  const details = releaseFailure.issue[0].details as CodeableConcept
  if(!details) return undefined
  const coding = details.coding as Array<Coding>
  if(!coding || coding[0].code !== "PRESCRIPTION_WITH_ANOTHER_DISPENSER") return undefined
  const diagnosticsUnparsed = releaseFailure.issue[0].diagnostics
  if(!diagnosticsUnparsed) return undefined
  const diagnosticsParsed = JSON.parse(diagnosticsUnparsed) as DispenserDetails
  return diagnosticsParsed
}
