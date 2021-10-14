import Hapi from "@hapi/hapi"

export default [
  {
    method: "POST",
    path: "/prescribe/edit",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const prepareBundles = Array.from(getPayload(request) as any[])
      const prescriptionIds: Array<string> = []
      prepareBundles.forEach((prepareBundle: any) => {
        const prescriptionId = getMedicationRequests(prepareBundle)[0].groupIdentifier.value
        prescriptionIds.push(prescriptionId)
        request.yar.set(`prepare_request_${prescriptionId}`, prepareBundle)
      })
      request.yar.set("prescription_ids", prescriptionIds) // yar doesn't like arrays ?
      const first_bundle = prepareBundles[0] // lossless-json to json ?
      const first_bundle_id = prescriptionIds[0]
      request.yar.set("prescription_id", first_bundle_id)
      return h.response({
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
      const bundle = request.yar.get(`prepare_request_${shortPrescriptionId}`)
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
