import Hapi from "@hapi/hapi"
import {fhir} from "@models"
import {BASE_PATH, ContentTypes} from "../util"
import {getStatusCode} from "../../utils/status-code"

const validQueryParams = ["identifier", "focus:identifier"]

const sandboxSuccessResponse = (prescriptionId: string): Partial<fhir.Task> => {
  const medicationDescription = fhir.createCodeableConcept(
    "http://snomed.info/sct",
    "16076005",
    "Prescription"
  )
  const medicationIdentifier = fhir.createIdentifierReference(fhir.createIdentifier(
    "https://tools.ietf.org/html/rfc4122",
    "ee86a018-779c-4809-999f-a9d89cdfd30f"
  ))
  const medicationStatus: Array<fhir.ExtensionExtension<fhir.CodeableConceptExtension>> = [{
    url: "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-DispensingInformation",
    extension: [{
      url: "dispenseStatus",
      valueCodeableConcept: fhir.createCodeableConcept(
        "https://fhir.nhs.uk/CodeSystem/EPS-task-business-status",
        "0002",
        "With Dispenser"
      )
    }]
  }]

  return {
    resourceType: "Task",
    businessStatus: fhir.createCodeableConcept(
      "https://fhir.nhs.uk/CodeSystem/EPS-task-business-status",
      "0002",
      "With Dispenser"
    ),
    focus: fhir.createIdentifierReference(fhir.createIdentifier(
      "https://fhir.nhs.uk/Id/prescription-order-number",
      prescriptionId
    )),
    input: [{
      extension: medicationStatus,
      type: medicationDescription,
      valueReference: medicationIdentifier
    }]
  }
}

export const noValidQueryParameters: fhir.OperationOutcomeIssue = {
  severity: "error",
  code: fhir.IssueCodes.INVALID,
  diagnostics: `Query parameter must be one of: ${validQueryParams.join(", ")}.`
}

export const duplicateIdentifier: fhir.OperationOutcomeIssue = {
  severity: "error",
  code: fhir.IssueCodes.INVALID,
  diagnostics: "Invalid combination of query parameters."
}

const queryParameterIsStringArray = (queryParam: string | Array<string>): queryParam is Array<string> => {
  return Array.isArray(queryParam)
}

export const validateQueryParameters = (queryParams: Hapi.RequestQuery): Array<fhir.OperationOutcomeIssue> => {
  const validQueryParamsFound = validQueryParams.filter(param => queryParams[param])
  if (validQueryParamsFound.length === 0) {
    return [noValidQueryParameters]
  }

  const errorList: Array<fhir.OperationOutcomeIssue> = []
  validQueryParamsFound.forEach(param => {
    if (queryParameterIsStringArray(queryParams[param])) {
      errorList.push(duplicateIdentifier)
    }
  })

  if (validQueryParamsFound.includes("identifier") && validQueryParamsFound.includes("focus:identifier")) {
    errorList.push(duplicateIdentifier)
  }
  return errorList
}

export default [{
  method: "GET",
  path: `${BASE_PATH}/Task`,
  handler: (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Hapi.Lifecycle.ReturnValue => {
    const queryParams = request.query

    const issues = validateQueryParameters(queryParams)
    if (issues.length) {
      const response = fhir.createOperationOutcome(issues)
      const statusCode = getStatusCode(issues)
      return responseToolkit.response(response).code(statusCode).type(ContentTypes.FHIR)
    } else {
      const validatedParams = queryParams as { [key: string]: string }
      const prescriptionIdentifier = validatedParams["focus:identifier"] || validatedParams["identifier"]
      return responseToolkit
        .response(sandboxSuccessResponse(prescriptionIdentifier))
        .code(200)
        .type(ContentTypes.FHIR)
    }
  }
}]
