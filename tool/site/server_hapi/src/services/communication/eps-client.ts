import {MockEpsClient} from "./mock-eps-client"
import {LiveEpsClient} from "./live-eps-client"
import {isLocal} from "../environment"

export interface EpsClient {
  makePrepareRequest(body: any): Promise<any>
}

function getEpsClient(useMock: boolean): EpsClient {
  return useMock
    ? new MockEpsClient()
    : new LiveEpsClient()
}

export const epsClient = getEpsClient(isLocal())

export function epsClientIsLive(client: EpsClient): client is LiveEpsClient {
  return (<LiveEpsClient>client).setAccessToken !== undefined
}
