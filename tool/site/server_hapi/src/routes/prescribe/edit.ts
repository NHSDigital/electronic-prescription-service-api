import Hapi from "@hapi/hapi"
import {getSessionValue, setSessionValue} from "../../services/session"

export default [
  {
    method: "POST",
    path: "/prescribe/edit",
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const prepareBundles = Array.from(getPayload(request) as any[])
      const prescriptionIds: Array<string> = []
      prepareBundles.forEach((prepareBundle: any) => {
        const prescriptionId = getMedicationRequests(prepareBundle)[0].groupIdentifier.value
        prescriptionIds.push(prescriptionId)
        setSessionValue(`prepare_request_${prescriptionId}`, prepareBundle, request)
      })
      setSessionValue("prescription_ids", prescriptionIds, request)
      const first_bundle = prepareBundles[0]
      const first_bundle_id = prescriptionIds[0]
      setSessionValue("prescription_id", first_bundle_id, request)
      return responseToolkit.response({
        "bundle": first_bundle,
        "errors": []
        // todo: make a $validate call against ?sandbox? for non-authed users to provide validation errors against test-pack/individual prescription
      }).code(200)
    }
  },
  {
    method: "GET",
    path: "/prescribe/edit",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const shortPrescriptionId = request.query["prescription_id"]
      setSessionValue("prescription_id", shortPrescriptionId, request)
      const bundle = getSessionValue(`prepare_request_${shortPrescriptionId}`, request)
      return h.response({
        "bundle": bundle
      }).code(200)
    }
  }
]

function getPayload(request: Hapi.Request): unknown {
  request.logger.info("Parsing request payload")
  if (Buffer.isBuffer(request.payload)) {
    return JSON.parse(request.payload.toString())
  } else if (typeof request.payload === "string") {
    return JSON.parse(request.payload)
  } else {
    return {}
  }
}

function getMedicationRequests(bundle: any): Array<any> {
  return getResourcesOfType<any>(bundle, "MedicationRequest")
}

function getResourcesOfType<T extends any>(bundle: any, resourceType: string): Array<T> {
  return bundle.entry
    .map((entry: { resource: any }) => entry.resource)
    .filter((resource: { resourceType: string }) => resource.resourceType === resourceType) as Array<T>
}
