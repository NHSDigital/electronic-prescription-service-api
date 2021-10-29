import {MockEpsClient} from "./mock-eps-client"
import {LiveEpsClient} from "./live-eps-client"
import {Bundle, Parameters} from "fhir/r4"
import {isLocal} from "../environment"
import {OperationOutcome} from "fhir/r4"

export interface EpsClient {
  makeGetTrackerRequest(searchRequest: EpsSearchRequest): Promise<Bundle | OperationOutcome>
  makePrepareRequest(body: Bundle): Promise<Parameters>
  makeSendRequest(body: Bundle): Promise<EpsSendReponse>
  makeConvertRequest(body: unknown): Promise<string>
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getEpsClient(accessToken: string): EpsClient {
  return isLocal()
    ? new MockEpsClient()
    : new LiveEpsClient(accessToken)
}

export interface EpsSendReponse {
  statusCode: number,
  fhirResponse: OperationOutcome
  spineResponse: string
}

export interface EpsSearchRequest {
  prescriptionId: string
}
