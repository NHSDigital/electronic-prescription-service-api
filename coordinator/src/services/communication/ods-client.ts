import {fhir} from "../../../../models/library"
import pino from "pino"
import {SandboxOdsClient} from "./sandbox-ods-client"
import {LiveOdsClient} from "./live-ods-client"

export interface OdsClient {
  lookupOrganization(odsCode: string, logger: pino.Logger): Promise<fhir.Organization>
}

function getOdsClient(liveMode: boolean): OdsClient {
  return liveMode
    ? new LiveOdsClient()
    : new SandboxOdsClient()
}

// todo: resolve egress issue
export const odsClient = getOdsClient(false/*process.env.SANDBOX !== "1"*/)
