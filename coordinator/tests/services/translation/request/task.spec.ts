import {
  createAuthorFromTaskOwnerIdentifier,
  getMessageIdFromTaskFocusIdentifier,
  getPrescriptionShortFormIdFromTaskGroupIdentifier
} from "../../../../src/services/translation/request/task"
import {hl7V3} from "@models"
import pino from "pino"
import {createAuthorForUnattendedAccess} from "../../../../src/services/translation/request/agent-unattended"

const logger = pino()

jest.mock("../../../../src/services/translation/request/agent-unattended", () => ({
  createAuthorForUnattendedAccess: jest.fn()
}))

test("author organization is looked up in ODS", async () => {
  const mockAuthorResponse = new hl7V3.Author()
  mockAuthorResponse.AgentPerson = new hl7V3.AgentPerson()
  const mockAuthorFunction = createAuthorForUnattendedAccess as jest.Mock
  mockAuthorFunction.mockReturnValueOnce(Promise.resolve(mockAuthorResponse))
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
