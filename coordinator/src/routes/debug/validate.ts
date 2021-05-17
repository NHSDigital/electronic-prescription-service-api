import Hapi from "@hapi/hapi"
import {fhir} from "@models"
import {
  BASE_PATH, contentTypes, externalValidator
} from "../util"

export default [
  /*
    Validate a FHIR message using the external FHIR validator.
  */
  {
    method: "POST",
    path: `${BASE_PATH}/$validate`,
    handler: externalValidator(async  (request, responseToolkit) => {
      const successfulResponse: fhir.OperationOutcome = {
        resourceType: "OperationOutcome",
        issue: [{
          severity: "information",
          code: fhir.IssueCodes.INFORMATIONAL
        }]
      }
      return responseToolkit.response(successfulResponse).code(200).type(contentTypes.fhir)
    })
  } as Hapi.ServerRoute
]
