import * as uuid from "uuid"
import axios from "axios"
import {Parameters} from "fhir/r4"
import jwt from "jsonwebtoken"
import {SigningClient} from "./signing-client"
import {CONFIG} from "../../config"

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
      keyId = CONFIG.keyId
      issuer = CONFIG.clientId
      privateKey = LiveSigningClient.getPrivateKey(CONFIG.privateKey)
    } else { // always 'simulated' (this will only support RSS Windows/IOS, smartcard simulated auth will fail as JWTs are different)
      keyId = CONFIG.rssKeyId
      issuer = CONFIG.rssIssuer
      privateKey = LiveSigningClient.getPrivateKey(CONFIG.rssPrivateKey)
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
      subject: CONFIG.subject,
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
    const apigeeUrl = isPublic ? CONFIG.publicApigeeUrl : CONFIG.privateApigeeUrl
    return this.authMethod === "simulated" && CONFIG.environment === "int"
      ? `${apigeeUrl}/signing-service-no-smartcard`
      : `${apigeeUrl}/signing-service`
  }
}
