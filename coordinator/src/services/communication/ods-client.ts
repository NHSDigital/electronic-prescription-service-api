import {fhir} from "@models"
import pino from "pino"
import {SandboxOdsClient} from "./sandbox-ods-client"
import {LiveOdsClient} from "./live-ods-client"
import {StatusCheckResponse} from "../../utils/status"

export interface OdsClient {
  lookupOrganization(odsCode: string, logger: pino.Logger): Promise<fhir.Organization>
  getStatus(logger: pino.Logger): Promise<StatusCheckResponse>
}

function getOdsClient(liveMode: boolean): OdsClient {
  return liveMode
    ? new LiveOdsClient()
    : new SandboxOdsClient()
}

export const odsClient = getOdsClient(process.env.SANDBOX !== "1")
