import Hapi from "@hapi/hapi"
import * as fhir from "fhir/r4"
import {isLocal, isQa} from "../environment"
import {getSessionValue} from "../session"
import {LiveSigningClient} from "./live-signing-client"
import {MockSigningClient} from "./mock-signing-client"
import {isDev} from "../environment"
import {CONFIG} from "../../config"
import {Ping} from "../../routes/health/get-status"

export interface SignatureUploadResponse {
  token: string
  redirectUri: string
}

export interface SignatureDownloadResponse {
  signatures: Array<{ id: string, signature: string }>
  certificate: string
}

export interface SigningClient {
  // eslint-disable-next-line max-len
  uploadSignatureRequest(prepareResponses: Array<PrepareResponse>, signingOptions: string): Promise<SignatureUploadResponse>
  makeSignatureDownloadRequest(token: string): Promise<SignatureDownloadResponse>
  makePingRequest(): Promise<Ping>
}

export interface PrepareResponse {
  id: string
  response: fhir.Parameters
}

export function getSigningClient(request: Hapi.Request, accessToken: string): SigningClient {
  return (isDev(CONFIG.environment) && getSessionValue("use_signing_mock", request))
    || (isQa(CONFIG.environment) && getSessionValue("use_signing_mock", request))
    || isLocal(CONFIG.environment)
    ? new MockSigningClient(request)
    : new LiveSigningClient(request, accessToken)
}
