import Hapi from "@hapi/hapi";

export const routes = [
    /*
      Convert a FHIR prescription into the HL7 V3 signature elements to be signed by the prescriber.
    */
    {
        method: 'GET',
        path: '/Health',
        handler: (request: Hapi.Request, h: Hapi.ResponseToolkit): Hapi.ResponseObject => {
            return h.response("Coordinator is alive")
        }
    }
]
