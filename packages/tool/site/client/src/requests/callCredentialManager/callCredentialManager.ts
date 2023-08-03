import {HubResponse} from "./helpers"

import $ from "jquery"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).jQuery = $;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).$ = $

const SIGNALR_HUB_NAME = "signingHub"
const SIGNALR_METHOD_NAME = "requestToSign"

export async function sign(jwt: string): Promise<HubResponse> {
  const SIGNALR_URL = "http://localhost:"+(window as any).prService.portNumber()+"/signalr"
  console.log("SignalR Url: " + SIGNALR_URL)
  console.log("JWT: " + jwt)
  const connection = $.hubConnection(SIGNALR_URL, {logging: true})
  if (connection.state !== SignalR.ConnectionState.Disconnected) {
    console.log(`Unexpected SignalR connection state ${connection.state}`)
    throw new Error("SignalR connection is already active.")
  }

  try {
    const proxy = connection.createHubProxy(SIGNALR_HUB_NAME)
    await connection.start({transport: "longPolling"})
    return await proxy.invoke(SIGNALR_METHOD_NAME, jwt)
  } finally {
    connection.stop()
  }
}
