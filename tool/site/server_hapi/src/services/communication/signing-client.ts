import * as uuid from "uuid"
import axios from "axios"

export class SigningClient {
  private accessToken = ""
  private authMethod = "cis2"

  setAccessToken(accessToken: string): void {
    this.accessToken = accessToken
  }

  setAuthMethod(authMethod: string): void {
    this.authMethod = authMethod
  }

  async makeSignatureDownloadRequest(token: string): Promise<any> {
    const apigeeUrl = `https://${process.env.APIGEE_DOMAIN_NAME}`
    const baseUrl = this.authMethod === "simulated" && process.env.ENVIRONMENT === "int"
      ? `${apigeeUrl}/signing-service-no-smartcard`
      : `${apigeeUrl}/signing-service`
    const url = `${baseUrl}/${token}`
    const headers = {
      "Authorization": `Bearer ${this.accessToken}`,
      "Content-Type": "text/plain",
      "x-request-id": uuid.v4(),
      "x-correlation-id": uuid.v4()
    }
    return (await axios.get(url, {
      headers: headers
    })).data 
  }
}

export const signingClient = new SigningClient()