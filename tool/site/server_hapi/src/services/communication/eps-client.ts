import {MockEpsClient} from "./mock-eps-client"
import {LiveEpsClient} from "./live-eps-client"
import {Bundle, Parameters} from "fhir/r4"
import {isLocal} from "../environment"

export interface EpsClient {
  makePrepareRequest(body: Bundle): Promise<Parameters>
  makeSendRequest(requestId: string, body: Bundle, getSpineResponse: boolean): Promise<unknown>
  makeConvertRequest(body: unknown): Promise<string>
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getEpsClient(accessToken: string): EpsClient {
  return isLocal()
    ? new MockEpsClient()
    : new LiveEpsClient(accessToken)
}
