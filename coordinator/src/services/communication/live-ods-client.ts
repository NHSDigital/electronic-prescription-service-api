import axios from "axios"
import pino from "pino"
import {fhir} from "@models"
import {OdsClient} from "./ods-client"
import {convertToOrganization, OdsOrganization} from "./ods-organization"
import {serviceHealthCheck, StatusCheckResponse} from "../../utils/status"

const HEALTHCHECK_ODS_CODE = "X26" //Using the ODS code for NHS Digital

export class LiveOdsClient implements OdsClient {
  async lookupOrganization(odsCode: string, logger: pino.Logger): Promise<fhir.Organization> {
    logger.info(`Performing ODS lookup for code ${odsCode}`)
    const url = `https://${process.env.ODS_URL}/STU3/Organization/${odsCode}`
    try {
      const result = await axios.get<OdsOrganization>(url)
      if (result.status !== 200) {
        logger.error(`Failed ODS lookup for path ${url}. StatusCode: ${result.status}`)
        return null
      }
      return convertToOrganization(result.data)
    } catch (error) {
      logger.error(`Failed ODS lookup for path ${url}. Error: ${error}`)
      return null
    }
  }

  async getStatus(logger: pino.Logger): Promise<StatusCheckResponse> {
    return serviceHealthCheck(`https://${process.env.ODS_URL}/STU3/Organization/${HEALTHCHECK_ODS_CODE}`, logger)
  }
}
