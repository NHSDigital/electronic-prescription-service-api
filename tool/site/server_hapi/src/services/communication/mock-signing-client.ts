import Hapi from "@hapi/hapi"
import {Parameters} from "fhir/r4"
import {getSessionValue} from "../session"
import {SigningClient} from "./signing-client"

export class MockSigningClient implements SigningClient {
  private request: Hapi.Request

  constructor(request: Hapi.Request) {
    this.request = request
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async uploadSignatureRequest(prepareResponses: Parameters[]): Promise<any> {
    const basePathForRedirect = process.env.BASE_PATH === undefined
      ? "/"
      : `/${process.env.BASE_PATH}/`
    const response = {
      "redirectUri": `${basePathForRedirect}prescribe/send`
    }
    return await this.mockAxiosResponse(response)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async makeSignatureDownloadRequest(token: string): Promise<any> {
    const mockCertificate = ""
    const mockSignatures = getSessionValue("prescription_ids", this.request).map((id: string) => {
      return {
        id,
        signature: ""
      }
    })
    return await this.mockAxiosResponse({
      signatures: mockSignatures,
      certificate: mockCertificate
    })
  }

  private async mockAxiosResponse(body: unknown): Promise<any> {
    return Promise.resolve(body)
  }
}

