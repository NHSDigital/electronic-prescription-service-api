import Hapi from "@hapi/hapi"
import {Parameters} from "fhir/r4"
import {isLocal} from "../environment"
import {getSessionValue} from "../session"
import {LiveSigningClient} from "./live-signing-client"
import {MockSigningClient} from "./mock-signing-client"
import {isDev} from "../environment"

export interface SigningClient {
  uploadSignatureRequest(prepareResponses: Parameters[]): Promise<any>
  makeSignatureDownloadRequest(token: string): Promise<any>
}

export function getSigningClient(request: Hapi.Request, accessToken: string, authMethod: string): SigningClient {
  return (isDev() && getSessionValue("use_signing_mock", request)) || isLocal()
    ? new MockSigningClient(request)
    : new LiveSigningClient(accessToken, authMethod)
}
