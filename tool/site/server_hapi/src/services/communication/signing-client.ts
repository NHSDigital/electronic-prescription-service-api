import * as uuid from "uuid"
import axios from "axios"
import {Parameters} from "fhir/r4"
import jwt from "jsonwebtoken"

export class SigningClient {
  private accessToken = ""
  private authMethod = "cis2"

  setAccessToken(accessToken: string): void {
    this.accessToken = accessToken
  }

  setAuthMethod(authMethod: string): void {
    this.authMethod = authMethod
  }

  async uploadSignatureRequest(prepareResponses: Parameters[]): Promise<any> {
    const baseUrl = this.getBaseUrl()
    const url = `${baseUrl}/signaturerequest`
    const headers = {
      "Authorization": `Bearer ${this.accessToken}`,
      "Content-Type": "text/plain",
      "x-request-id": uuid.v4(),
      "x-correlation-id": uuid.v4()
    }
    const privateKey = process.env.APP_JWT_PRIVATE_KEY ?? ""
    const payload = {
      sub: process.env.APP_JWT_SUBJECT,
      iss: process.env.APP_JWT_ISSUER,
      aud: baseUrl,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 10),
      payloads: prepareResponses.map(pr => {
        return {
          id: uuid.v4(),
          payload: pr.parameter?.find(p => p.name === "digest")?.valueString
        }
      }),
      algorithm: prepareResponses[0].parameter?.find(p => p.name === "algorithm")?.valueString
    }
    const body = await jwt.sign(payload, privateKey, {algorithm: "RS512", keyid: process.env.APP_JWT_KID})
    return (await axios.post(url, {
      headers: headers,
      body
    })).data
  }

  async makeSignatureDownloadRequest(token: string): Promise<any> {
    const baseUrl = this.getBaseUrl()
    const url = `${baseUrl}/${token}`
    const headers = {
      "Authorization": `Bearer ${this.accessToken}`,
      "x-request-id": uuid.v4(),
      "x-correlation-id": uuid.v4()
    }
    return (await axios.get(url, {
      headers: headers
    })).data
  }

  private getBaseUrl() {
    const apigeeUrl = `https://${process.env.APIGEE_DOMAIN_NAME}`
    const baseUrl = this.authMethod === "simulated" && process.env.ENVIRONMENT === "int"
      ? `${apigeeUrl}/signing-service-no-smartcard`
      : `${apigeeUrl}/signing-service`
    return baseUrl
  }
}

