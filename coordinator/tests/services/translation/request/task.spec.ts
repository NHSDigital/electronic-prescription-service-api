import {
  getMessageIdFromTaskFocusIdentifier,
  getPrescriptionShortFormIdFromTaskGroupIdentifier
} from "../../../../src/services/translation/request/task"
import {hl7V3} from "@models"
import {createAuthor} from "../../../../src/services/translation/request/agent-unattended"
import {practitionerRoleTask, organization} from "../../../resources/test-data"

jest.mock("../../../../src/services/translation/request/agent-unattended", () => ({
  createAuthor: jest.fn()
}))

test("author organization is looked up in ODS", async () => {
  const mockAuthorResponse = new hl7V3.Author()
  mockAuthorResponse.AgentPerson = new hl7V3.AgentPerson()
  const mockAuthorFunction = createAuthor as jest.Mock
  mockAuthorFunction.mockReturnValueOnce(mockAuthorResponse)

  const result = createAuthor(
    practitionerRoleTask,
    organization
  )
  expect(mockAuthorFunction).toHaveBeenCalledWith(practitionerRoleTask, organization)
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
