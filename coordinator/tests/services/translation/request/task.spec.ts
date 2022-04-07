import {
  getMessageIdFromTaskFocusIdentifier,
  getPrescriptionShortFormIdFromTaskGroupIdentifier
} from "../../../../src/services/translation/request/task"
import {fhir, hl7V3} from "@models"
import pino from "pino"
import {createAuthor} from "../../../../src/services/translation/request/return/return"

const logger = pino()

jest.mock("../../../../src/services/translation/request/return/return", () => ({
  createAuthor: jest.fn()
}))

test("author organization is looked up in ODS", async () => {
  const mockAuthorResponse = new hl7V3.Author()
  mockAuthorResponse.AgentPerson = new hl7V3.AgentPerson()
  const mockAuthorFunction = createAuthor as jest.Mock
  mockAuthorFunction.mockReturnValueOnce(Promise.resolve(mockAuthorResponse))

  const practitionerRole: fhir.PractitionerRole = {
    resourceType: "PractitionerRole",
    id: "requester",
    practitioner: {
      identifier: {
        system: "https://fhir.hl7.org.uk/Id/gphc-number",
        value: "7654321"
      },
      display: "Ms Lottie Maifeld"
    },
    organization: {
      identifier: {
        system: "https://fhir.nhs.uk/Id/ods-organization-code",
        value: "VNE51"
      },
      display: "The Pharmacy"
    },
    telecom: [
      {
        system: "phone",
        use: "work",
        value: "01234567890"
      }
    ]
  }

  const result = await createAuthor(
    practitionerRole,
    undefined,
    logger
  )
  expect(mockAuthorFunction).toHaveBeenCalledWith(practitionerRole, undefined, logger)
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
