import Hapi from "@hapi/hapi"
import {Parameters} from "fhir/r4"
import {isLocal, isSandbox} from "../environment"
import {getSessionValue} from "../session"
import {LiveSigningClient} from "./live-signing-client"
import {MockSigningClient} from "./mock-signing-client"
import {isDev} from "../environment"
import {CONFIG} from "../../config"
import {Ping} from "../../routes/health/get-status"

export interface SigningClient {
  uploadSignatureRequest(prepareResponses: Parameters[]): Promise<any>
  makeSignatureDownloadRequest(token: string): Promise<any>
  makePingRequest(): Promise<Ping>
}

export function getSigningClient(request: Hapi.Request, accessToken: string): SigningClient {
  return (isDev(CONFIG.environment) && getSessionValue("use_signing_mock", request))
    || isLocal(CONFIG.environment)
    || isSandbox(CONFIG.environment)
    ? new MockSigningClient(request)
    : new LiveSigningClient(request, accessToken)
}
