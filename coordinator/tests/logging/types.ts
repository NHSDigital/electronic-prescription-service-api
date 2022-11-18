import {fhir} from "@models"
import {PayloadIdentifiers} from "../../src/routes/logging"

// PayloadIdentifiersLog
type PayloadIdentifiersLog = {
  payloadIdentifiers: PayloadIdentifiers
}

const isPayloadIdentifiersLog = (logData: unknown): logData is PayloadIdentifiersLog => {
  return typeof logData === "object" && "payloadIdentifiers" in logData
}

// PrepareEndpointResponse
type PrepareEndpointResponse = {
  PrepareEndpointResponse: {
    parameter: Array<fhir.Parameters>
  }
}

const isPrepareEndpointResponse = (logData: unknown): logData is PrepareEndpointResponse => {
  return typeof logData === "object" && "PrepareEndpointResponse" in logData
}

// PayloadHashLog
type PayloadHashLog = {
  incomingMessageHash: string
}

const isAuditPayloadHash = (logData: unknown): logData is PayloadHashLog => {
  return typeof logData === "object" && "incomingMessageHash" in logData
}

export type {
  PayloadIdentifiersLog
}

export {
  isAuditPayloadHash,
  isPayloadIdentifiersLog,
  isPrepareEndpointResponse
}
