import pino from "pino"
import axios, {AxiosError} from "axios"
import {Agent} from "https"

export interface StatusCheckResponse {
  status: "pass" | "warn" | "error"
  timeout: "true" | "false"
  responseCode: number
  outcome?: string
  links?: string
}

export async function serviceHealthCheck(
  url: string,
  logger: pino.Logger,
  agent: Agent | undefined
): Promise<StatusCheckResponse> {
  try {
    const response = await axios.get<string>(url, {
      timeout: 20000,
      httpsAgent: agent
    })
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
