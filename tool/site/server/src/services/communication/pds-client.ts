import {OperationOutcome, Patient} from "fhir/r4"
import axios, {AxiosRequestHeaders, AxiosResponse} from "axios"
import {CONFIG} from "../../config"
import {Ping} from "../../routes/health/get-status"
import * as uuid from "uuid"
import {isInt} from "../environment"

class PdsClient {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async makeGetPatientRequest(nhsNumber: string): Promise<Patient | OperationOutcome> {
    return (await this.makeApiCall<Patient | OperationOutcome>(`Patient/9000000009`)).data
  }

  async makePingRequest(): Promise<Ping> {
    const url = `${this.getBaseUrl()}/${this.getBasePath()}/_ping`
    return (await axios.get<Ping>(url)).data
  }

  protected async makeApiCall<T>(
    path: string
  ): Promise<AxiosResponse<T>> {
    const url = `${this.getBaseUrl()}/${this.getBasePath()}/${path}`
    return axios.request({
      url,
      method: "GET",
      headers: this.getHeaders(uuid.v4())
    })
  }

  protected getHeaders(requestId: string | undefined): AxiosRequestHeaders {
    return {
      "x-request-id": requestId ?? uuid.v4()
    }
  }

  protected getBaseUrl() {
    return "https://sandbox.api.service.nhs.uk"
  }

  protected getBasePath() {
    return `personal-demographics/FHIR/R4`
  }
}

// // Note derived classes cannot be in separate files due to circular reference issues with typescript
// // See these GitHub issues: https://github.com/Microsoft/TypeScript/issues/20361, #4149, #10712
class SandboxPdsClient extends PdsClient {
  constructor() {
    super()
  }
}

class LivePdsClient extends PdsClient {
  private accessToken: string

  constructor(accessToken: string) {
    super()
    this.accessToken = accessToken
  }

  async makeGetPatientRequest(nhsNumber: string): Promise<Patient | OperationOutcome> {
    return (await this.makeApiCall<Patient | OperationOutcome>(`Patient/${nhsNumber}`)).data
  }

  protected override getHeaders(requestId: string | undefined): AxiosRequestHeaders {
    return {
      "Authorization": `Bearer ${this.accessToken}`,
      "x-request-id": requestId ?? uuid.v4()
    }
  }

  protected override getBaseUrl() {
    return CONFIG.privateApigeeUrl
  }
}

export function getPdsClient(accessToken: string): PdsClient {
  return isInt(CONFIG.environment)
    ? new LivePdsClient(accessToken)
    : new SandboxPdsClient()
}
