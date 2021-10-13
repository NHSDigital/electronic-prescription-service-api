import Hapi from "@hapi/hapi"
import getMedicationRequests from "@coordinator"

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