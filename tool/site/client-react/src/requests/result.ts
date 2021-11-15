import {FhirResource} from "fhir/r4"

export function isResult(data: unknown): data is Result {
  const result = data as Result
  return typeof result.success === "boolean"
    && "request" in result
    && "request_xml" in result
    && "response" in result
    && "response_xml" in result
}

export interface Result {
  success: boolean
  request: FhirResource
  request_xml: string
  response: FhirResource
  response_xml: string
}
