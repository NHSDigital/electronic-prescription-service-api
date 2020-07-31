import Hapi from "@hapi/hapi"

export default [
    {
        method: 'GET',
        path: '/_status',
        handler: (request: Hapi.Request, h: Hapi.ResponseToolkit): Hapi.ResponseObject => {
            return h.response("Coordinator is alive")
        }
    }
]
