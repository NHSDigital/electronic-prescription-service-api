import Hapi from "@hapi/hapi"
import {spineClient} from "../../services/communication/spine-client"
import {BASE_PATH, ContentTypes} from "../util"
import {spine} from "@models"
import * as uuid from "uuid"

export default [{
  method: "GET",
  path: `${BASE_PATH}/Tracker`,
  handler: async (
    request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit
  ): Promise<Hapi.Lifecycle.ReturnValue> => {

    const trackerRequest: spine.TrackerRequest = {
      message_id: uuid.v4(),
      from_asid: process.env.TRACKER_FROM_ASID,
      to_asid: process.env.TRACKER_TO_ASID,
      prescription_id: request.query.prescriptionId as string,
      repeat_number: request.query.repeatNumber as string
    }

    const hl7v3Prescription = await spineClient.track(trackerRequest, request.logger)

    return responseToolkit
      .response(hl7v3Prescription)
      .code(200)
      .type(ContentTypes.XML)
  }
}]
