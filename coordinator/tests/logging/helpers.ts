import Hapi from "@hapi/hapi"
import {fhir} from "@models"
import HapiPino from "hapi-pino"

import {PayloadIdentifiers} from "../../src/routes/logging"
import {isAuditPayloadHash, isPayloadIdentifiersLog, PayloadIdentifiersLog} from "./types"

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

const hasAuditTag = (log: Hapi.RequestLog): boolean => {
  return log.tags.includes("audit")
}

const expectPayloadAuditLogs = (logs: Array<Hapi.RequestLog>): void => {
  let hasLoggedPayloadHash = false

  logs.forEach((log) => {
    // Check that payload hash is logged with an audit log
    if (isAuditPayloadHash(log.data)) {
      hasLoggedPayloadHash = true
      expect(hasAuditTag(log)).toBeTruthy()
      expect(log.data.incomingMessageHash).toHaveLength(64)
    }
  })

  expect(hasLoggedPayloadHash).toBeTruthy()
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

const getPayloadIdentifiersFromLogs = (logs: Array<Hapi.RequestLog>): Array<PayloadIdentifiers> => {
  return logs
    .filter(log => isPayloadIdentifiersLog(log.data))
    .map(log => (log.data as PayloadIdentifiersLog).payloadIdentifiers)
}

export {
  configureLogging,
  expectPayloadAuditLogs,
  getPostRequestValidHeaders,
  getPayloadIdentifiersFromLogs,
  testIfValidPayload
}
