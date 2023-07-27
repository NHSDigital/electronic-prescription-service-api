import {HubResponse} from "./helpers"

import $ from "jquery"

const SIGNALR_URL = "PLACEHOLDER_REPLACED_BY_WEBPACK"
const SIGNALR_HUB_NAME = "signingHub"
const SIGNALR_METHOD_NAME = "requestToSign"

export async function sign(jwt: string): Promise<HubResponse> {
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
