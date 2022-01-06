import {SandboxEpsClient} from "./sandbox-eps-client"
import {LiveEpsClient} from "./live-eps-client"
import {Bundle, Claim, FhirResource, OperationOutcome, Parameters} from "fhir/r4"
import {isLocal} from "../environment"

export interface EpsClient {
  makeGetTrackerRequest(query: Record<string, string>): Promise<Bundle | OperationOutcome>
  makePrepareRequest(body: Bundle): Promise<Parameters | OperationOutcome>
  makeSendRequest(body: Bundle): Promise<EpsResponse<OperationOutcome>>
  makeReleaseRequest(body: Parameters): Promise<EpsResponse<Bundle | OperationOutcome>>
  makeClaimRequest(body: Claim): Promise<EpsResponse<OperationOutcome>>
  makeValidateRequest(body: FhirResource): Promise<EpsResponse<OperationOutcome>>
  makeConvertRequest(body: FhirResource): Promise<string>
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getEpsClient(accessToken: string): EpsClient {
  return isLocal()
    ? new SandboxEpsClient()
    : new LiveEpsClient(accessToken)
}

export interface EpsResponse<T> {
  statusCode: number,
  fhirResponse: T
  spineResponse: string
}

export function asString(response: string | OperationOutcome): string {
  return typeof response === "string" ? response : JSON.stringify(response, null, 2)
}
