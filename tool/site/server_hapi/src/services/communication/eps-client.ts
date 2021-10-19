import {MockEpsClient} from "./mock-eps-client"
import {LiveEpsClient} from "./live-eps-client"

export interface EpsClient {
  makePrepareRequest(body: any): Promise<any>
}

export function getEpsClient(useMock: boolean): EpsClient {
  return useMock
    ? new MockEpsClient()
    : new LiveEpsClient()
}

export function epsClientIsLive(client: EpsClient): client is LiveEpsClient {
  return (<LiveEpsClient>client).setAccessToken !== undefined
}
