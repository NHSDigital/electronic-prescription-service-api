// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const element = (identifier: string) => document.getElementById(identifier)!

export interface HubResponse {
    certificate: string,
    status_code: number,
    status_string: string,
    message: string,
    timestamp: string,
    signatures: Array<Signature>,
    failed_signatures: Array<Signature>
  }

export interface Signature {
    id: string,
    signature: string
  }

export async function start(jwt: string, signFn: (jwt: string) => Promise<HubResponse>): Promise<void> {
  try {
    //showStatus("Signing in progress", "Communicating with Credential Management to generate a signature.")
    const hubResponse = await signFn(jwt)
    validateHubResponse(hubResponse)

  } catch (e) {
    console.log(e)
    showError(e.message)
  }
}

function validateHubResponse(hubResponse: HubResponse) {
  if (!hubResponse) {
    throw new TypeError("No response from Credential Management.")
  }

  if (hubResponse.status_code !== 0) {
    console.log(`Got error response from Credential Management: ${JSON.stringify(hubResponse)}`)
    throw new TypeError("Error response from Credential Management.")
  }

  if (!hubResponse.certificate || !hubResponse.signatures?.length) {
    console.log(`Got invalid response from Credential Management: ${JSON.stringify(hubResponse)}`)
    throw new TypeError("Invalid response from Credential Management.")
  }
}

export function showError(details?: string): void {
  element("status-container").style.display = "none"
  if (details) {
    element("error-details").innerText = `Error details: ${details}`
  }
  element("error-container").style.display = "block"
}
