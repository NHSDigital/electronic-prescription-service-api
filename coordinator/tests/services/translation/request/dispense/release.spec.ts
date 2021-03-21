import * as fhir from "@models/fhir"
import {translateReleaseRequest} from "../../../../../src/services/translation/request/dispense/release"
import pino from "pino"
import * as hl7V3 from "../../../../../src/models/hl7-v3"
import {createAuthorForUnattendedAccess} from "../../../../../src/services/translation/request/agent-unattended"

const logger = pino()

jest.mock("../../../../../src/services/translation/request/agent-unattended", () => ({
  createAuthorForUnattendedAccess: jest.fn()
}))

describe("translateReleaseRequest", () => {
  test("translated release contains author details from ODS", async () => {
    const mockAuthorResponse = new hl7V3.Author()
    mockAuthorResponse.AgentPerson = new hl7V3.AgentPerson()
    const mockAuthorFunction = createAuthorForUnattendedAccess as jest.Mock
    mockAuthorFunction.mockReturnValueOnce(Promise.resolve(mockAuthorResponse))
    const parameters = new fhir.Parameters([{
      "name": "owner",
      "valueIdentifier": {
        "system": "https://fhir.nhs.uk/Id/ods-organization-code",
        "value": "FTX40"
      }
    }])

    const translatedRelease = await translateReleaseRequest(parameters, logger)

    expect(mockAuthorFunction).toHaveBeenCalledWith("FTX40", logger)
    expect(translatedRelease.NominatedPrescriptionReleaseRequest.author).toEqual(mockAuthorResponse)
  })
})
