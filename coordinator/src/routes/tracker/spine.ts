import Hapi from "@hapi/hapi"
import {spine} from "@models"
import {spineClient} from "../../services/communication/spine-client"
import {writeXmlStringPretty} from "../../services/serialisation/xml"
import {BASE_PATH, ContentTypes, getPayload} from "../util"

export default [{
  method: "POST",
  path: `${BASE_PATH}/Tracker`,
  handler: async (
    request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit
  ): Promise<Hapi.Lifecycle.ReturnValue> => {
    const trackerRequest = getPayload(request) as spine.TrackerRequest

    request.logger.info(`Received tracker request:\n${JSON.stringify(trackerRequest)}`)

    const hl7v3Prescription = await spineClient.track(trackerRequest, request.logger)
    const response = hl7v3Prescription ? writeXmlStringPretty(hl7v3Prescription) : ""
    const statusCode = hl7v3Prescription ? 200 : 400

    return responseToolkit
      .response(response)
      .code(statusCode)
      .type(ContentTypes.XML)
  }
}]
