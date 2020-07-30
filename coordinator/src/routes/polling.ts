import { Request } from "@hapi/hapi"
import Hapi from "@hapi/hapi"
import { isPollable, defaultRequestHandler } from "../services/spine-communication"

export default [{
        method: 'GET',
        path: '/_poll/{poll_path}',
        handler: async (request: Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
            const spineResponse = await defaultRequestHandler.poll(request.params.poll_path)

            if (isPollable(spineResponse)) {
                return responseToolkit.response().code(spineResponse.statusCode).header('Content-Location', spineResponse.pollingUrl)
            } else {
                return responseToolkit.response(spineResponse.body).code(spineResponse.statusCode).header('Content-Type', 'multipart/mixed; boundary=----=_MIME-Boundary')
            }
        }
    }]