import {TrackerClient, WeirdJsonResponse} from "./index"
import pino from "pino"
import axios from "axios"

const SPINE_ENDPOINT = process.env.SPINE_URL
const SPINE_PRESCRIPTION_PATH = "nhs111itemsummary"
/* eslint-disable-next-line */
const SPINE_LINE_ITEM_PATH = "nhs111itemdetails"

export class LiveTrackerClient implements TrackerClient {
  async getPrescription(prescriptionId: string, logger: pino.Logger): Promise<WeirdJsonResponse> {
    const address = this.getItemSummaryUrl()

    const headers = {
      "Accept": "application/json",
      "Spine-From-Asid": "12-digits",
      "Spine-UserId": "12-digits",
      "Spine-RoleProfileId": "12-digits"
    }
    const queryParams = {prescriptionId}

    logger.info(`Attempting to send message to ${address} with prescriptionId: ${prescriptionId}`)
    try {
      const response = await axios.get<WeirdJsonResponse>(
        address,
        {
          headers: headers,
          params: queryParams
        }
      )
      return response.data
    } catch (error) {
      console.log(error)
      return error
    }
  }

  getItemSummaryUrl(): string {
    return `https://${SPINE_ENDPOINT}/${SPINE_PRESCRIPTION_PATH}`
  }
}

