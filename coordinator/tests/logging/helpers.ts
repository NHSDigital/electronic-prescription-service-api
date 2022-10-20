import Hapi from "@hapi/hapi"
import {fhir} from "@models"
import HapiPino from "hapi-pino"

const testIfValidPayload = (payload?: fhir.Resource): jest.It => {
  return payload ? test : test.skip
}

const configureLogging = async (server: Hapi.Server): Promise<void> => {
  await HapiPino.register(server, {
    // Redact Authorization headers, see https://getpino.io/#/docs/redaction
    redact: ["req.headers.authorization"],
    wrapSerializers: false
  })
}

type PrepareEndpointResponse = {
  PrepareEndpointResponse: {
    parameter: Array<fhir.Parameters>
  }
}

const isPrepareEndpointResponse = (logData: unknown): logData is PrepareEndpointResponse => {
  return typeof logData === "object" && "PrepareEndpointResponse" in logData
}

type AuditPayloadHash = {
  incomingMessageHash: string
}

const isAuditPayloadHash = (logData: unknown): logData is AuditPayloadHash => {
  return typeof logData === "object" && "incomingMessageHash" in logData
}

const expectPayloadHashAuditLog = (logs: Array<Hapi.RequestLog>): void => {
  let hasLoggedPayloadHash = false

  logs.forEach((log) => {
    if (isAuditPayloadHash(log.data)) {
      hasLoggedPayloadHash = true
      expect(log.data.incomingMessageHash).toHaveLength(64)
    }
  })

  expect(hasLoggedPayloadHash).toBe(true)
}

type ServerRequest = {
  method: "POST" | "GET"
  url: string
  headers: Hapi.Util.Dictionary<string>
  payload: fhir.Resource
}

const getPostRequestValidHeaders = (
  url: string,
  headers: Hapi.Util.Dictionary<string>,
  payload: fhir.Resource): ServerRequest => {
  return {
    method: "POST",
    url: url,
    headers: headers,
    payload: payload
  }
}

export {
  configureLogging,
  expectPayloadHashAuditLog,
  getPostRequestValidHeaders,
  isPrepareEndpointResponse,
  testIfValidPayload
}
