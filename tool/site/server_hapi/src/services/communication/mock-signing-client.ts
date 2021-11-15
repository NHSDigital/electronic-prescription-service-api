import Hapi from "@hapi/hapi"
import {getSessionValue} from "../session"
import {SigningClient} from "./signing-client"

export class MockSigningClient implements SigningClient {
  private request: Hapi.Request

  constructor(request: Hapi.Request) {
    this.request = request
  }

  async uploadSignatureRequest(): Promise<any> {
    const basePathForRedirect = process.env.BASE_PATH === undefined
      ? "/"
      : `/${process.env.BASE_PATH}/`
    const response = {
      "redirectUri": `${basePathForRedirect}prescribe/send`
    }
    return Promise.resolve(response)
  }

  async makeSignatureDownloadRequest(): Promise<any> {
    const mockCertificate = ""
    const mockSignatures = getSessionValue("prescription_ids", this.request).map((id: string) => {
      return {
        id,
        signature: ""
      }
    })
    return Promise.resolve({
      signatures: mockSignatures,
      certificate: mockCertificate
    })
  }
}

