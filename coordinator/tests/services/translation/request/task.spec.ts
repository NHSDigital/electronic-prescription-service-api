import {
  createAuthorFromProvenanceAgentExtension,
  getMessageIdFromTaskFocusIdentifier,
  getPrescriptionShortFormIdFromTaskGroupIdentifier
} from "../../../../src/services/translation/request/task"
import {hl7V3, fhir} from "@models"
import pino from "pino"
import {
  createAuthorForAttendedAccess,
  createAuthorForUnattendedAccess
} from "../../../../src/services/translation/request/agent-unattended"
import {TaskIntent, TaskStatus} from "../../../../../models/fhir"

const logger = pino()

jest.mock("../../../../src/services/translation/request/agent-unattended", () => ({
  createAuthorForUnattendedAccess: jest.fn()
}))
jest.mock("../../../../src/services/translation/request/agent-unattended", () => ({
  createAuthorForAttendedAccess: jest.fn()
}))

test("author organization is looked up in ODS - attended", async () => {
  const mockAuthorResponse = new hl7V3.Author()
  mockAuthorResponse.AgentPerson = new hl7V3.AgentPerson()
  const mockAuthorFunction = createAuthorForAttendedAccess as jest.Mock
  mockAuthorFunction.mockReturnValueOnce(Promise.resolve(mockAuthorResponse))
  const result = await createAuthorFromProvenanceAgentExtension(
    exampleTask,
    logger
  )
  expect(mockAuthorFunction).toHaveBeenCalledWith("7654321", "FTX40", logger)
  expect(result).toEqual(mockAuthorResponse)
})

test("author organization is looked up in ODS - unattended", async () => {
  const mockAuthorResponse = new hl7V3.Author()
  mockAuthorResponse.AgentPerson = new hl7V3.AgentPerson()
  const mockAuthorFunction = createAuthorForUnattendedAccess as jest.Mock
  mockAuthorFunction.mockReturnValueOnce(Promise.resolve(mockAuthorResponse))
  const result = await createAuthorFromProvenanceAgentExtension(
    exampleTask,
    logger
  )
  expect(mockAuthorFunction).toHaveBeenCalledWith("FTX40", logger)
  expect(result).toEqual(mockAuthorResponse)
})

test("short form id is extracted correctly", () => {
  const result = getPrescriptionShortFormIdFromTaskGroupIdentifier({
    system: "https://fhir.nhs.uk/Id/prescription-order-number",
    value: "88AF6C-C81007-00001C"
  })
  expect(result).toEqual("88AF6C-C81007-00001C")
})

test("referenced message id is extracted correctly", () => {
  const result = getMessageIdFromTaskFocusIdentifier({
    system: "https://tools.ietf.org/html/rfc4122",
    value: "d72bd9c8-b8d6-4c69-90ee-9ad7f177877b"
  })
  expect(result).toEqual("d72bd9c8-b8d6-4c69-90ee-9ad7f177877b")
})

const exampleTask: fhir.Task = {
  "resourceType": "Task",
  "id": "6a2624a2-321b-470e-91a6-8ae7a065e2f0",
  "extension":  [
    {
      "url": "https://fhir.nhs.uk/StructureDefinition/Extension-Provenance-agent",
      "valueReference": {
        "identifier": {
          "system": "https://fhir.hl7.org.uk/Id/gphc-number",
          "value": "7654321"
        }
      }
    }
  ],
  "identifier":  [
    {
      "system": "https://tools.ietf.org/html/rfc4122",
      "value": "5ac84c11-db8b-44da-8fcf-8980b3d13596"
    }
  ],
  "status": TaskStatus.IN_PROGRESS,
  "intent": TaskIntent.ORDER,
  "groupIdentifier": {
    "system": "https://fhir.nhs.uk/Id/prescription-order-number",
    "value": "C2782B-A99968-4E4E9Z"
  },
  "code": {
    "coding":  [
      {
        "system": "http://hl7.org/fhir/CodeSystem/task-code",
        "code": "abort",
        "display": "Mark the focal resource as no longer active"
      }
    ]
  },
  "focus": {
    "type": "Bundle",
    "identifier": {
      "system": "https://tools.ietf.org/html/rfc4122",
      "value": "602159ee-1678-41ec-a100-7b3dd04c1d84"
    }
  },
  "for": {
    "identifier": {
      "system": "https://fhir.nhs.uk/Id/nhs-number",
      "value": "9990548609"
    }
  },
  "authoredOn": "2020-12-21T17:03:20-00:00",
  "owner": {
    "identifier": {
      "system": "https://fhir.nhs.uk/Id/ods-organization-code",
      "value": "FTX40"
    }
  },
  "reasonCode": {
    "coding":  [
      {
        "system": "https://fhir.nhs.uk/CodeSystem/EPS-task-dispense-withdraw-reason",
        "code": "DA",
        "display": "Dosage Amendments"
      }
    ]
  }
}
