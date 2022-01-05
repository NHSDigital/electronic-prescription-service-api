import * as uuid from "uuid"
import axios from "axios"
import {Parameters} from "fhir/r4"
import jwt from "jsonwebtoken"
import {SigningClient} from "./signing-client"

export class LiveSigningClient implements SigningClient {
  private accessToken: string
  private authMethod: string

  constructor(accessToken: string, authMethod: string) {
    this.accessToken = accessToken
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

    // patch for RSS support whilst requirements for local signing and RSS are different
    // todo: remove this logic once they are aligned
    let keyId: string | undefined
    let privateKey: string
    let issuer: string | undefined
    if (this.authMethod === "cis2") {
      keyId = process.env.DEMO_APP_KEY_ID
      issuer = process.env.DEMO_APP_CLIENT_ID
      privateKey = LiveSigningClient.getPrivateKey(process.env.DEMO_APP_PRIVATE_KEY ?? "")
    } else { // always 'simulated' (this will only support RSS Windows/IOS, smartcard simulated auth will fail as JWTs are different)
      keyId = process.env.DEMO_APP_REMOTE_SIGNING_KID
      issuer = process.env.DEMO_APP_REMOTE_SIGNING_ISSUER
      privateKey = LiveSigningClient.getPrivateKey(process.env.APP_JWT_PRIVATE_KEY ?? "")
    }

    const payload = {
      payloads: prepareResponses.map(pr => {
        return {
          id: uuid.v4(),
          payload: pr.parameter?.find(p => p.name === "digest")?.valueString
        }
      }),
      algorithm: prepareResponses[0].parameter?.find(p => p.name === "algorithm")?.valueString
    }

    const body = jwt.sign(payload, privateKey, {
      algorithm: "RS512",
      keyid: keyId,
      issuer,
      subject: process.env.APP_JWT_SUBJECT,
      audience: this.getBaseUrl(true),
      expiresIn: 600
    })

    return (await axios.post(url, body, {headers: headers})).data
  }

  async makeSignatureDownloadRequest(token: string): Promise<any> {
    const baseUrl = this.getBaseUrl()
    const url = `${baseUrl}/signatureresponse/${token}`
    const headers = {
      "Authorization": `Bearer ${this.accessToken}`,
      "x-request-id": uuid.v4(),
      "x-correlation-id": uuid.v4()
    }
    return (await axios.get(url, {
      headers: headers
    })).data
  }

  private static getPrivateKey(private_key_secret: string) {
    while (private_key_secret.length % 4 !== 0) {
      private_key_secret += "="
    }
    return Buffer.from(private_key_secret, "base64").toString("utf-8")
  }

  private getBaseUrl(isPublic = false) {
    if (process.env.SIGNING_URL) {
      const apigeeUrl = isPublic ? process.env.SIGNING_URL : `https://${process.env.APIGEE_DOMAIN_NAME}`
      if (!isPublic) {
        const apigeeBaseUrl = process.env.SIGNING_URL.split("/").pop()
        return `${apigeeUrl}/${apigeeBaseUrl}`
      }
      return this.authMethod === "simulated" && process.env.ENVIRONMENT === "int"
        ? `${apigeeUrl}/signing-service-no-smartcard`
        : `${apigeeUrl}/signing-service`
    }
    const apigeeUrl = isPublic ? `${process.env.PUBLIC_APIGEE_URL}` : `https://${process.env.APIGEE_DOMAIN_NAME}`
    return this.authMethod === "simulated" && process.env.ENVIRONMENT === "int"
      ? `${apigeeUrl}/signing-service-no-smartcard`
      : `${apigeeUrl}/signing-service`
  }
}
