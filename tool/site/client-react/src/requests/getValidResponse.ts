import {AxiosResponse} from "axios"
import {OperationOutcome} from "fhir/r4"
import {isOperationOutcome} from "../fhir/typeGuards"

export function getResponseDataIfValid<T>(
  response: AxiosResponse<T | OperationOutcome>,
  typeGuard: (unknown: unknown) => unknown is T
): T {
  const responseData = response.data
  if (!responseData) {
    throw new Error("Empty response from server")
  }

  if (typeGuard(responseData)) {
    return responseData
  }

  console.log(responseData)

  if (isOperationOutcome(responseData)) {
    throw new Error(responseData.issue[0].diagnostics)
  }

  throw new Error("Unknown error")
}
