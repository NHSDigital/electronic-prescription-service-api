import Hapi from "@hapi/hapi";

export default [
    {
        method: 'GET',
        path: '/Health',
        handler: (request: Hapi.Request, h: Hapi.ResponseToolkit): Hapi.ResponseObject => {
            return h.response("Coordinator is alive")
        }
    }
]
