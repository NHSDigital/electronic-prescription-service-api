import {TrackerClient} from "."
import pino from "pino"
import axios from "axios"
import Hapi from "@hapi/hapi"
import {getAsid, getSdsRoleProfileId, getSdsUserUniqueId} from "../../../utils/headers"
import {spine} from "@models"
import {convertRawResponseToDetailTrackerResponse} from "../../translation/response/tracker/translation"

const SPINE_BASE_URL = process.env.SPINE_URL
const SPINE_PRESCRIPTION_SUMMARY_PATH = "nhs111itemsummary"
const SPINE_PRESCRIPTION_DETAIL_PATH = "nhs111itemdetails"

export class LiveTrackerClient implements TrackerClient {
  async getPrescriptionsByPatientId(
    patientId: string,
    businessStatus: string,
    earliestDate: string,
    latestDate: string,
    inboundHeaders: Hapi.Utils.Dictionary<string>,
    logger: pino.Logger
  ): Promise<spine.SummaryTrackerResponse> {
    const address = this.getPrescriptionSummaryUrl()
    const queryParams: Record<string, string> = {
      nhsNumber: patientId
    }
    if (businessStatus) {
      queryParams.prescriptionStatus = businessStatus
    }
    if (earliestDate) {
      queryParams.earliestDate = earliestDate
    }
    if (latestDate) {
      queryParams.latestDate = latestDate
    }
    return await LiveTrackerClient.makeTrackerRequest(inboundHeaders, address, queryParams, logger)
  }

  async getPrescriptionById(
    prescriptionId: string,
    inboundHeaders: Hapi.Utils.Dictionary<string>,
    logger: pino.Logger
  ): Promise<spine.DetailTrackerResponse> {
    const address = this.getPrescriptionDetailUrl()
    const queryParams = {
      prescriptionId: prescriptionId,
      issueNumber: "1"
    }
    const rawResponse = await LiveTrackerClient.makeTrackerRequest(inboundHeaders, address, queryParams, logger)
    return convertRawResponseToDetailTrackerResponse(rawResponse)
  }

  private static async makeTrackerRequest(
    inboundHeaders: Hapi.Utils.Dictionary<string>,
    address: string,
    queryParams: Record<string, string>,
    logger: pino.Logger
  ) {
    const outboundHeaders = {
      "Accept": "application/json",
      "Spine-From-Asid": getAsid(inboundHeaders),
      "Spine-UserId": getSdsUserUniqueId(inboundHeaders),
      "Spine-RoleProfileId": getSdsRoleProfileId(inboundHeaders)
    }

    logger.info(`Attempting to send message to ${address}`)
    try {
      const response = await axios.get(
        address,
        {
          headers: outboundHeaders,
          params: queryParams
        }
      )
      return response.data
    } catch (error) {
      logger.error(error)
      return error
    }
  }

  getPrescriptionSummaryUrl(): string {
    return `https://${SPINE_BASE_URL}/mm/${SPINE_PRESCRIPTION_SUMMARY_PATH}`
  }

  getPrescriptionDetailUrl(): string {
    return `https://${SPINE_BASE_URL}/mm/${SPINE_PRESCRIPTION_DETAIL_PATH}`
  }
}
