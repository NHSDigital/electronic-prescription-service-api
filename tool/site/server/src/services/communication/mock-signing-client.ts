import Hapi from "@hapi/hapi"
import {getSessionValue} from "../session"
import {SigningClient} from "./signing-client"
import * as uuid from "uuid"
import {CONFIG} from "../../config"
import {Ping} from "../../routes/health/get-status"

export class MockSigningClient implements SigningClient {
  private request: Hapi.Request

  constructor(request: Hapi.Request) {
    this.request = request
  }

  async uploadSignatureRequest(): Promise<any> {
    const response = {
      redirectUri: `${CONFIG.baseUrl}prescribe/send?token=${uuid.v4()}`
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

  async makePingRequest(): Promise<Ping> {
    return Promise.resolve({
      commitId: "",
      releaseId: "",
      revision: "",
      version: "mock"
    })
  }
}
