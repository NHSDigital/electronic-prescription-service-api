import {HubResponse, start} from "./helpers"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).jQuery = jQuery;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).$ = jQuery

const SIGNALR_URL = `"http://localhost:"+prService.portNumber()+"/signalr"`
const SIGNALR_HUB_NAME = "signingHub"
const SIGNALR_METHOD_NAME = "requestToSign"

export async function sign(jwt: string): Promise<HubResponse> {
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

window.addEventListener("DOMContentLoaded", () => {
  start(sign)
})
