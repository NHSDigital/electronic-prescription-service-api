import Hapi from "@hapi/hapi"
import {fhir} from "@models"
import {BASE_PATH, ContentTypes} from "../util"
import {getStatusCode} from "../../utils/status-code"
import {trackerClient} from "../../services/communication/tracker"
import * as uuid from "uuid"
import {convertMomentToISODate, convertMomentToISODateTime} from "../../services/translation/common/dateTime"
import moment from "moment"

const CODEABLE_CONCEPT_PRESCRIPTION = fhir.createCodeableConcept(
  "http://snomed.info/sct",
  "16076005",
  "Prescription"
)
const CODEABLE_CONCEPT_DISPENSING_MEDICATION = fhir.createCodeableConcept(
  "http://snomed.info/sct",
  "373784005",
  "Dispensing medication"
)
const VALID_QUERY_PARAMS = ["identifier", "focus:identifier"]

const buildSandboxSuccessResponse = (prescriptionId: string): fhir.Task => {
  const repeatInformationExtension = {
    url: "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-RepeatInformation",
    extension:  [
      {
        url: "numberOfRepeatsAllowed",
        valueUnsignedInt: 6
      },
      {
        url: "numberOfRepeatsIssued",
        valueUnsignedInt: 3
      }
    ]
  }
  const lastIssueDispensedDate = convertMomentToISODate(moment.utc().subtract(1, "month"))
  const dispensingInformationExtension = {
    url: "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-DispensingInformation",
    extension: [
      {
        url: "dispenseStatus",
        valueCoding: fhir.createCoding(
          "https://fhir.nhs.uk/CodeSystem/EPS-task-business-status",
          "0002",
          "With Dispenser"
        )
      },
      {
        url: "dateLastDispensed",
        valueDate: lastIssueDispensedDate
      }
    ]
  }
  const dispensingReleaseInformationExtension = {
    url: "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-DispensingReleaseInformation",
    extension: [{
      url: "dateLastIssuedDispensed",
      valueDate: lastIssueDispensedDate
    }]
  }

  return {
    resourceType: "Task",
    id: uuid.v4(),
    extension: [
      repeatInformationExtension
    ],
    meta: {
      lastUpdated: convertMomentToISODateTime(moment.utc())
    },
    identifier: [
      fhir.createIdentifier("https://tools.ietf.org/html/rfc4122", uuid.v4())
    ],
    status: fhir.TaskStatus.IN_PROGRESS,
    businessStatus: fhir.createCodeableConcept(
      "https://fhir.nhs.uk/CodeSystem/EPS-task-business-status",
      "0002",
      "With Dispenser"
    ),
    intent: fhir.TaskIntent.ORDER,
    code: fhir.createCodeableConcept(
      "https://fhir.nhs.uk/CodeSystem/message-event",
      "prescription-order",
      "Prescription Order"
    ),
    focus: fhir.createIdentifierReference(
      fhir.createIdentifier("https://fhir.nhs.uk/Id/prescription-order-number", prescriptionId)
    ),
    for: fhir.createIdentifierReference(
      fhir.createIdentifier("https://fhir.nhs.uk/Id/nhs-number", "9912003489")
    ),
    requester: fhir.createIdentifierReference(
      fhir.createIdentifier("https://fhir.nhs.uk/Id/ods-organization-code", "C81007"),
      "VERNON STREET MEDICAL CTR"
    ),
    owner: fhir.createIdentifierReference(
      fhir.createIdentifier("https://fhir.nhs.uk/Id/ods-organization-code", "FA666"),
      "CROYDON PHARMACY"
    ),
    authoredOn: convertMomentToISODateTime(moment.utc().subtract(3, "month")),
    input: [{
      extension: [
        dispensingInformationExtension
      ],
      type: CODEABLE_CONCEPT_PRESCRIPTION,
      valueReference: fhir.createIdentifierReference(
        fhir.createIdentifier("https://tools.ietf.org/html/rfc4122", uuid.v4())
      )
    }],
    output: [{
      extension: [
        dispensingReleaseInformationExtension
      ],
      type: CODEABLE_CONCEPT_DISPENSING_MEDICATION,
      valueReference: fhir.createIdentifierReference(
        fhir.createIdentifier("https://tools.ietf.org/html/rfc4122", uuid.v4())
      )
    }]
  }
}

export const noValidQueryParameters: fhir.OperationOutcomeIssue = {
  severity: "error",
  code: fhir.IssueCodes.INVALID,
  diagnostics: `Query parameter must be one of: ${VALID_QUERY_PARAMS.join(", ")}.`
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
  const validQueryParamsFound = VALID_QUERY_PARAMS.filter(param => queryParams[param])
  if (validQueryParamsFound.length === 0) {
    return [noValidQueryParameters]
  }

  const duplicatedParams = validQueryParamsFound.some(param => queryParameterIsStringArray(queryParams[param]))
  if (duplicatedParams) {
    return [duplicateIdentifier]
  }

  if (validQueryParamsFound.includes("identifier") && validQueryParamsFound.includes("focus:identifier")) {
    return [duplicateIdentifier]
  }
  return []
}

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
      const spineResponse = await trackerClient.getPrescription(prescriptionIdentifier, request.logger)
      return responseToolkit
        .response({spineResponse})
        .code(200)
    }
  }
}]
