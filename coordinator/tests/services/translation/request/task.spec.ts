import {
  createAuthorFromTaskOwnerIdentifier,
  getMessageIdFromTaskFocusIdentifier,
  getPrescriptionShortFormIdFromTaskGroupIdentifier
} from "../../../../src/services/translation/request/task"
import * as hl7V3 from "../../../../src/models/hl7-v3"
import pino from "pino"
import {createAuthorForUnattendedAccess} from "../../../../src/services/translation/request/agent-unattended"
import {getMessageId} from "../../../../src/services/translation/common"

const logger = pino()

jest.mock("../../../../src/services/translation/request/agent-unattended", () => ({
  createAuthorForUnattendedAccess: jest.fn()
}))

test("message id is converted correctly", () => {
  const result = new hl7V3.GlobalIdentifier(getMessageId([{
    system: "https://tools.ietf.org/html/rfc4122",
    value: "78cac452-1780-4211-b4a9-4ccc4d02dcbd"
  }], "Task.identifier"))
  expect(result._attributes.root).toEqual("78CAC452-1780-4211-B4A9-4CCC4D02DCBD")
})

test("author organization is looked up in ODS", async () => {
  const mockAgentPerson = new hl7V3.AgentPerson()
  const mockAuthorResponse = new hl7V3.SendMessagePayloadAuthorAgentPerson(mockAgentPerson)
  const mockAuthorFunction = createAuthorForUnattendedAccess as jest.Mock
  mockAuthorFunction.mockReturnValueOnce(new Promise((resolve) => resolve(mockAuthorResponse)))
  const result = await createAuthorFromTaskOwnerIdentifier(
    {
      system: "https://fhir.nhs.uk/Id/ods-organization-code",
      value: "FTX40"
    },
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
