import Hapi from "@hapi/hapi"

export default [
  {
    method: "POST",
    path: "/prescribe/edit",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
        const requestBundles = JSON.parse(request.payload.toString())
        const shortPrescriptionIds: Array<string> = requestBundles.map((bundle: any) => getMedicationRequests(bundle)[0].groupIdentifier.value)
        return h.response({
            shortPrescriptionIds
        }).code(200)
    }
  }
]

function getMedicationRequests(bundle: any): Array<any> {
  return getResourcesOfType<any>(bundle, "MedicationRequest")
}

function getResourcesOfType<T extends any>(bundle: any, resourceType: string): Array<T> {
  return bundle.entry
    .map((entry: { resource: any }) => entry.resource)
    .filter((resource: { resourceType: string }) => resource.resourceType === resourceType) as Array<T>
}