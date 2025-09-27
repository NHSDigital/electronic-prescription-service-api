import Hapi from "@hapi/hapi"
import {getSessionValue} from "../services/session"

export type PrescriptionId = {
  bundleId: string | undefined
  prescriptionId: string
}

export function getUtcEpochSeconds(): number {
  return Date.now() / 1000
}

export function getSessionPrescriptionIdsArray(request: Hapi.Request): Array<string> {
  return getSessionValue("prescription_ids", request).map((id: PrescriptionId) => id.prescriptionId)
}

export function getCorrelationId(request: Hapi.Request): string {
  const correlationId = request.headers["x-correlation-id"]
  return correlationId || crypto.randomUUID()
}
