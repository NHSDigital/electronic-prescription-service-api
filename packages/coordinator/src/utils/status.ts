import pino from "pino"
import axios, {AxiosError} from "axios"

export interface StatusCheckResponse {
  status: "pass" | "warn" | "error"
  timeout: "true" | "false"
  responseCode: number
  outcome?: string
  links?: string
}

export async function serviceHealthCheck(url: string, logger: pino.Logger): Promise<StatusCheckResponse> {
  try {
    const response = await axios.get<string>(url, {timeout: 20000})
    return {
      status: response.status === 200 ? "pass" : "error",
      timeout: "false",
      responseCode: response.status,
      outcome: response.data,
      links: url
    }
  } catch (error) {
    logger.error("Error calling external service for status check: " + error.message)
    const axiosError = error as AxiosError
    return {
      status: "error",
      timeout: axiosError.code === "ECONNABORTED" ? "true" : "false",
      responseCode: axiosError.response?.status,
      outcome: typeof axiosError.response?.data === "string"
        ? axiosError.response?.data
        : undefined,
      links: url
    }
  }
}
