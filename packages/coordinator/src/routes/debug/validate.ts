import {fhir} from "@models"
import {
  BASE_PATH,
  ContentTypes,
  externalValidator,
  handlerWrapper
} from "../util"
import {RouteDefMethods, Request, ResponseToolkit} from "@hapi/hapi"

export default [
  /*
    Validate a FHIR message using the external FHIR validator.
  */
  {
    method: "POST" as RouteDefMethods,
    path: `${BASE_PATH}/$validate`,
    handler: handlerWrapper(async (request: Request, responseToolkit: ResponseToolkit) => {
      const successfulResponse: fhir.OperationOutcome = {
        resourceType: "OperationOutcome",
        issue: [{
          severity: "information",
          code: fhir.IssueCodes.INFORMATIONAL
        }]
      }
      return responseToolkit.response(successfulResponse).code(200).type(ContentTypes.FHIR)
    }, [externalValidator])
  }
]
