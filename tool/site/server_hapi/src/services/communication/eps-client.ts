import {MockEpsClient} from "./mock-eps-client"
import {LiveEpsClient} from "./live-eps-client"
import {Bundle, Parameters, OperationOutcome} from "fhir/r4"
import {isLocal} from "../environment"

export interface EpsClient {
  makePrepareRequest(body: Bundle): Promise<Parameters>
  makeSendRequest(body: Bundle): Promise<OperationOutcome>
  makeConvertRequest(body: unknown): Promise<string>
}

export function getEpsClient(accessToken: string): EpsClient {
  return isLocal()
    ? new MockEpsClient()
    : new LiveEpsClient(accessToken)
}
