import Hapi from "@hapi/hapi"
import {SignatureDownloadResponse, SignatureUploadResponse, SigningClient} from "./signing-client"
import {CONFIG} from "../../config"
import {Ping} from "../../routes/health/get-status"
import {getSessionPrescriptionIdsArray} from "../../routes/util"
// add an extra line to keep gitsecrets happy

export class MockSigningClient implements SigningClient {
  private request: Hapi.Request

  constructor(request: Hapi.Request) {
    this.request = request
  }

  async uploadSignatureRequest(): Promise<SignatureUploadResponse> {
    const token = crypto.randomUUID()
    const response = {
      token,
      redirectUri: `${CONFIG.baseUrl}prescribe/send?token=${token}`
    }
    return Promise.resolve(response)
  }

  async makeSignatureDownloadRequest(): Promise<SignatureDownloadResponse> {
    const mockCertificate = ""
    const mockSignatures = getSessionPrescriptionIdsArray(this.request).map((id: string) => {
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
