import {FhirResource} from "fhir/r4"

export function isApiResult(data: unknown): data is ApiResult {
  const result = data as ApiResult
  return typeof result.success === "boolean"
    && "request" in result
    && "response" in result
}

export interface ApiResult {
  success: boolean
  request: FhirResource
  request_xml?: string
  response: FhirResource
  response_xml?: string
}
