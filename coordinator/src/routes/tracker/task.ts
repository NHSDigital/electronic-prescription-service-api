import Hapi from "@hapi/hapi"
import {fhir, validationErrors} from "@models"
import {BASE_PATH, ContentTypes} from "../util"
import {getStatusCode} from "../../utils/status-code"
import {trackerClient} from "../../services/communication/tracker"
import {convertSpineResponseToFhir} from "../../services/communication/tracker/translation"
import {RequestHeaders} from "../../utils/headers"

const VALID_QUERY_PARAMS = ["identifier", "focus:identifier"]

export default [{
  method: "GET",
  path: `${BASE_PATH}/Task`,
  handler: async (
    request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit
  ): Promise<Hapi.Lifecycle.ReturnValue> => {
    const queryParams = request.query

    const issues = validateQueryParameters(queryParams)
    if (issues.length) {
      const response = fhir.createOperationOutcome(issues)
      const statusCode = getStatusCode(issues)
      return responseToolkit.response(response).code(statusCode).type(ContentTypes.FHIR)
    } else {
      const validatedParams = queryParams as { [key: string]: string }
      const prescriptionIdentifier = validatedParams["focus:identifier"] || validatedParams["identifier"]

      const spineResponse = await trackerClient.getPrescription(prescriptionIdentifier, request.headers, request.logger)
      if (request.headers[RequestHeaders.RAW_RESPONSE]) {
        return responseToolkit
          .response(spineResponse.toString())
          .code(200)
          .type(ContentTypes.JSON)
      } else {
        return responseToolkit
          .response(convertSpineResponseToFhir(spineResponse))
          .code(200)
          .type(ContentTypes.FHIR)
      }
    }
  }
}]

export const validateQueryParameters = (queryParams: Hapi.RequestQuery): Array<fhir.OperationOutcomeIssue> => {
  const validQueryParamsFound = VALID_QUERY_PARAMS.filter(param => queryParams[param])
  if (validQueryParamsFound.length === 0) {
    return [validationErrors.createMissingQueryParameterIssue(VALID_QUERY_PARAMS)]
  }

  const duplicatedParams = validQueryParamsFound.some(param => Array.isArray(queryParams[param]))
  if (duplicatedParams) {
    return [validationErrors.invalidQueryParameterCombinationIssue]
  }

  if (validQueryParamsFound.includes("identifier") && validQueryParamsFound.includes("focus:identifier")) {
    return [validationErrors.invalidQueryParameterCombinationIssue]
  }
  return []
}

