import {TrackerClient} from "."
import pino from "pino"
import axios from "axios"
import Hapi from "@hapi/hapi"
import {getAsid, getSdsRoleProfileId, getSdsUserUniqueId} from "../../../utils/headers"
import {TrackerSpineResponse} from "./spine-model"

const SPINE_ENDPOINT = process.env.SPINE_URL
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
const SPINE_PRESCRIPTION_PATH = "nhs111itemsummary"
const SPINE_LINE_ITEM_PATH = "nhs111itemdetails"

export class LiveTrackerClient implements TrackerClient {
  async getPrescription(
    prescriptionId: string,
    inboundHeaders: Hapi.Util.Dictionary<string>,
    logger: pino.Logger
  ): Promise<TrackerSpineResponse> {
    const address = this.getItemDetailUrl()

    const outboundHeaders = {
      "Accept": "application/json",
      "Spine-From-Asid": getAsid(inboundHeaders),
      "Spine-UserId": getSdsUserUniqueId(inboundHeaders),
      "Spine-RoleProfileId": getSdsRoleProfileId(inboundHeaders)
    }
    const queryParams = {
      prescriptionId: prescriptionId,
      issueNumber: "1"
    }

    logger.info(`Attempting to send message to ${address} with prescriptionId: ${prescriptionId}`)
    try {
      const response = await axios.get<TrackerSpineResponse>(
        address,
        {
          headers: outboundHeaders,
          params: queryParams
        }
      )
      return response.data
    } catch (error) {
      console.log(error)
      return error
    }
  }

  getItemDetailUrl(): string {
    return `https://${SPINE_ENDPOINT}/mm/${SPINE_LINE_ITEM_PATH}`
  }
}

