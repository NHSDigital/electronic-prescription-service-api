import {fhir} from "@models"
import {BASE_PATH, ContentTypes} from "../util"
import Hapi from "@hapi/hapi"
import {BaseLogger} from "pino"

interface EpsRequest extends Modify<Hapi.Request, {
  logger: BaseLogger
}>{}

type Modify<T, R> = Omit<T, keyof R> & R;

export default [
  /*
    Validate a FHIR message using the external FHIR validator.
  */
  {
    method: "POST",
    path: `${BASE_PATH}/$validate`,
    handler: async (request: EpsRequest, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      request.logger.info("Validate test logger in route!!!")
      logInFunction(request.logger)
      const successfulResponse: fhir.OperationOutcome = {
        resourceType: "OperationOutcome",
        issue: [{
          severity: "information",
          code: fhir.IssueCodes.INFORMATIONAL
        }]
      }
      return responseToolkit.response(successfulResponse).code(200).type(ContentTypes.FHIR)
    }
  }
]

function logInFunction(logger: BaseLogger) {
  logger.info("Validate test logger in route!!!")
}
