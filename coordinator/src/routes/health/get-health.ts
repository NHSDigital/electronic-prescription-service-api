import Hapi from "@hapi/hapi";

export default [
    {
        method: 'GET',
        path: '/Health',
        handler: (request: Hapi.Request, h: Hapi.ResponseToolkit): Hapi.ResponseObject => {
            if (process.env.CLIENT_CERT !== undefined && process.env.CLIENT_CERT.length > 0) {
                return h.response("Coordinator is alive and we have secrets")
            }

            return h.response("Coordinator is alive")
        }
    }
]
