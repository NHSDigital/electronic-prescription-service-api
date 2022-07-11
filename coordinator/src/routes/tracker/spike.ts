import Hapi from "@hapi/hapi"
import {spineClient} from "../../services/communication/spine-client"
import {BASE_PATH, ContentTypes} from "../util"

export default [{
  method: "POST",
  path: `${BASE_PATH}/Tracker`,
  handler: async (
    request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit
  ): Promise<Hapi.Lifecycle.ReturnValue> => {
    const spineResponse = await spineClient.track(request.payload.toString(), request.logger)
    return responseToolkit
      .response(spineResponse)
      .code(200)
      .type(ContentTypes.XML)
  }
}]
