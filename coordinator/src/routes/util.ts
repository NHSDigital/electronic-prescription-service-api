import { SpinePollableResponse, SpineDirectResponse, isPollable } from "../services/spine-communication";
import * as Hapi from "@hapi/hapi"

export function handlePollableResponse(spineResponse: SpineDirectResponse | SpinePollableResponse, responseToolkit: Hapi.ResponseToolkit): Hapi.ResponseObject {
    if (isPollable(spineResponse)) {
        return responseToolkit.response().code(spineResponse.statusCode).header('Content-Location', spineResponse.pollingUrl)
    } else {
        return responseToolkit.response(spineResponse.body).code(spineResponse.statusCode).header('Content-Type', 'multipart/mixed; boundary=----=_MIME-Boundary')
    }
}