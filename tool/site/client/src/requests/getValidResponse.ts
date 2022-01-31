import {AxiosResponse} from "axios"
import {OperationOutcome} from "fhir/r4"
import {UnhandledAxiosResponseError} from "./unhandledAxiosResponseError"

export function getResponseDataIfValid<T>(
  response: AxiosResponse<T | OperationOutcome>,
  typeGuard: (unknown: unknown) => unknown is T
): T {
  const responseData = response.data
  if (responseData && typeGuard(responseData)) {
    return responseData
  }

  throw new UnhandledAxiosResponseError("Unexpected response from server.", response)
}
