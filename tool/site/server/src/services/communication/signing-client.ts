import Hapi from "@hapi/hapi"
import {Parameters} from "fhir/r4"
import {isLocal} from "../environment"
import {LiveSigningClient} from "./live-signing-client"
import {MockSigningClient} from "./mock-signing-client"

export interface SigningClient {
  uploadSignatureRequest(prepareResponses: Parameters[]): Promise<any>
  makeSignatureDownloadRequest(token: string): Promise<any>
}

export function getSigningClient(request: Hapi.Request, accessToken: string, authMethod: string): SigningClient {
  return isLocal()
    ? new MockSigningClient(request)
    : new LiveSigningClient(accessToken, authMethod)
}
