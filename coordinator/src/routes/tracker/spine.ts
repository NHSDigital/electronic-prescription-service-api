import Hapi from "@hapi/hapi"
import {spine} from "@models"
import {extractHl7v3PrescriptionFromMessage} from "../../services/communication/tracker-response-parser"
import {spineClient} from "../../services/communication/spine-client"
import {writeXmlStringPretty} from "../../services/serialisation/xml"
import {BASE_PATH, ContentTypes, getPayload} from "../util"

export default [{
  method: "POST",
  path: `${BASE_PATH}/Tracker`,
  handler: async (
    request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit
  ): Promise<Hapi.Lifecycle.ReturnValue> => {
    const trackerRequest = getPayload(request) as spine.GetPrescriptionMetadataRequest
    request.logger.info(`Tracker - Received request:\n${JSON.stringify(trackerRequest)}`)
    const response = await spineClient.track(trackerRequest, request.logger)
    request.logger.info(`Tracker - Received response:\n${response.body}`)
    const hl7v3Prescription = extractHl7v3PrescriptionFromMessage(response.body, request.logger)
    const xmlPrescription = hl7v3Prescription ? writeXmlStringPretty(hl7v3Prescription) : ""

    return responseToolkit
      .response(xmlPrescription)
      .code(response.statusCode)
      .type(ContentTypes.XML)
  }
}]
