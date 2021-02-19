import {ExampleSpineResponse} from "../../../resources/test-resources"
import {SPINE_CANCELLATION_ERROR_RESPONSE_REGEX} from "../../../../src/services/translation/response"
import {readXml} from "../../../../src/services/serialisation/xml"
import {CancellationResponse} from "../../../../src/models/hl7-v3/hl7-v3-spine-response"

export function hasCorrectISOFormat(timestamp: string): boolean {
  const ISOTimestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+\d{2}:\d{2}$/
  return ISOTimestampRegex.test(timestamp)
}

export function getCancellationResponse(actualError: ExampleSpineResponse): CancellationResponse {
  const cancelResponse = SPINE_CANCELLATION_ERROR_RESPONSE_REGEX.exec(actualError.response.body)[0]
  const parsedMsg = readXml(cancelResponse)
  const actEvent = parsedMsg["hl7:PORX_IN050101UK31"]["hl7:ControlActEvent"]
  return actEvent["hl7:subject"].CancellationResponse
}
