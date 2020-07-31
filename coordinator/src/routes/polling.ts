import { Request } from "@hapi/hapi";
import Hapi from "@hapi/hapi";
import { defaultRequestHandler } from "../services/spine-communication";
import { handlePollableResponse } from "./util";

export default [{
        method: 'GET',
        path: '/_poll/{poll_path}',
        handler: async (request: Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
            const spineResponse = await defaultRequestHandler.poll(request.params.poll_path)
            return handlePollableResponse(spineResponse, responseToolkit)
        }
    }]