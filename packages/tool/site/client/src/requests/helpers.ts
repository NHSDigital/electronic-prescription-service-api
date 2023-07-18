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

export function getToken(queryString: URLSearchParams): string {
  const token = queryString.get("token")

  if (!token) {
    throw new TypeError("Token not present in query string.")
  }

  return token
}

export function getState(queryString: URLSearchParams): string | null {
  return queryString.get("state")
}

export function getQueryString(): URLSearchParams {
  const queryString = window.location.search
  if (!queryString) {
    throw new TypeError("Empty query string.")
  }

  return new URLSearchParams(queryString)
}

export async function start(signFn: (jwt: string) => Promise<HubResponse>): Promise<void> {
  try {
    //showStatus("Signing in progress", "Downloading the signature request from the Signing Service.")
    const queryString = getQueryString()
    const token = getToken(queryString)
    const signatureRequest = await retrieveSignatureRequestFromServer(token)

    //showStatus("Signing in progress", "Communicating with Credential Management to generate a signature.")
    const hubResponse = await signFn(signatureRequest)
    validateHubResponse(hubResponse)

    //showStatus("Signing in progress", "Uploading the signature to the Signing Service.")
    const redirectUrl = await sendResponseToProvider(hubResponse, token)

    //showStatus("Signing complete", "Sending you back to the calling application.")
    const state = getState(queryString)
    window.location.href = state ? `${redirectUrl}&state=${state}` : redirectUrl
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

async function retrieveSignatureRequestFromServer(token: string): Promise<string> {
  const response = await fetch(`./client/signaturerequest/${token}`, {
    headers: {
      "X-CSRF-Token": getCSRFTokenFromCookie()
    }
  })
  if (response.status !== 200) {
    console.error(`Got unexpected response from Signing Service: ${response.status}`)
    throw new Error("Failed to retrieve signature request from Signing Service.")
  }
  const responseText = await response.text()
  if (!responseText) {
    throw new Error("Failed to parse response from Signing Service.")
  }
  return responseText
}

function getCSRFTokenFromCookie(): string {
  const cookies = getCookies()
  const crumb = cookies.get("crumb")

  if (!crumb) {
    throw new Error("Could not find CSRF token")
  }

  return crumb
}

function getCookies(): Map<string, string> {
  try {
    return new Map(document.cookie.split(";").map(cookie => {
      const cookieKey = cookie.split("=")[0].trim()
      const cookieValue = cookie.split("=")[1].trim()

      return [cookieKey, cookieValue]
    }))
  } catch(e) {
    console.error("Could not read cookies")
    console.error(e)
    return new Map()
  }
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const element = (identifier: string) => document.getElementById(identifier)!

export function showError(details?: string): void {
  element("status-container").style.display = "none"
  if (details) {
    element("error-details").innerText = `Error details: ${details}`
  }
  element("error-container").style.display = "block"
}

export async function sendResponseToProvider(hubResponse: HubResponse, token: string): Promise<string> {
  const response = await fetch(
    `./client/signatureresponse/${token}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": getCSRFTokenFromCookie()
      },
      body: JSON.stringify({
        "signatures": hubResponse.signatures,
        "certificate": hubResponse.certificate
      })
    }
  )

  if (response.status !== 200) {
    console.error(`Got unexpected response from Signing Service: ${response.status}`)
    throw new Error("Failed to upload signature to Signing Service.")
  }

  const responseJson = await response.json()
  if (!responseJson) {
    throw new Error("Failed to parse response from Signing Service.")
  }

  return responseJson.redirectUri
}
