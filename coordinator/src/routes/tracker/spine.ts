import Hapi from "@hapi/hapi"
import {spineClient} from "../../services/communication/spine-client"
import {BASE_PATH, ContentTypes, getPayload} from "../util"
import {spine} from "@models"

export default [{
  method: "POST",
  path: `${BASE_PATH}/Tracker`,
  handler: async (
    request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit
  ): Promise<Hapi.Lifecycle.ReturnValue> => {

    const trackerRequest = getPayload(request) as spine.TrackerRequest

    request.logger.info(`Received tracker request:\n${JSON.stringify(trackerRequest)}`)

    const hl7v3Prescription = await spineClient.track(trackerRequest, request.logger)

    return responseToolkit
      .response(hl7v3Prescription)
      .code(200)
      .type(ContentTypes.XML)
  }
}]
