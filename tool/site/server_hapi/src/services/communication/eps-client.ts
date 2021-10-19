import {MockEpsClient} from "./mock-eps-client"
import {LiveEpsClient} from "./live-eps-client"
import {Parameters} from "fhir/r4"

export interface EpsClient {
  makePrepareRequest(body: any): Promise<Parameters>
}

export function getEpsClient(useMock: boolean): EpsClient {
  return useMock
    ? new MockEpsClient()
    : new LiveEpsClient()
}

export function epsClientIsLive(client: EpsClient): client is LiveEpsClient {
  return (<LiveEpsClient>client).setAccessToken !== undefined
}
