import Hapi from "@hapi/hapi"
import {fhir} from "@models"
import {BASE_PATH, ContentTypes} from "./util"

interface lineItem {
  id: string,
  status: string
}

interface trackerResponse extends Partial<fhir.Task> {
  lineItem: Array<lineItem>
}

const sandboxSuccessResponse = (prescriptionId: string): trackerResponse => ({
  resourceType: "Task",
  groupIdentifier: fhir.createIdentifier("system", prescriptionId),
  status: fhir.TaskStatus.IN_PROGRESS,
  lineItem: [
    {
      id: "1",
      status: "status"
    },
    {
      id: "2",
      status: "status"
    },
    {
      id: "3",
      status: "status"
    }
  ]
})

const sandboxErrorResponse: fhir.OperationOutcomeIssue = {
  severity: "error",
  code: fhir.IssueCodes.INVALID,
  diagnostics: "Please query on prescription-id."
}

export default [{
  method: "GET",
  path: `${BASE_PATH}/$tracker`,
  handler: (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Hapi.Lifecycle.ReturnValue => {
    const queryParams = request.query
    if (queryParams["prescription-id"]) {
      const prescriptionId = queryParams["prescription-id"]
      return responseToolkit
        .response(sandboxSuccessResponse(prescriptionId as string))
        .code(200)
        .type(ContentTypes.FHIR)
    } else {
      return responseToolkit
        .response(sandboxErrorResponse)
        .code(400)
        .type(ContentTypes.FHIR)
    }
  }
}]
