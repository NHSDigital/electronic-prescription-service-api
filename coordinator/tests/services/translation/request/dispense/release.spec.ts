import {fhir, hl7V3} from "@models"
import {
  createNominatedReleaseRequest,
  createPatientReleaseRequest,
  translateReleaseRequest
} from "../../../../../src/services/translation/request/dispense/release"
import pino from "pino"
import {createAuthorForUnattendedAccess} from "../../../../../src/services/translation/request/agent-unattended"

const logger = pino()

jest.mock("../../../../../src/services/translation/request/agent-unattended", () => ({
  createAuthorForUnattendedAccess: jest.fn()
}))

describe("translateReleaseRequest", () => {
  const mockAuthorResponse = new hl7V3.Author()
  mockAuthorResponse.AgentPerson = new hl7V3.AgentPerson()
  const mockAuthorFunction = createAuthorForUnattendedAccess as jest.Mock

  test("translates release request without prescription ID to nominated release request", async () => {
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
    expect(translatedRelease).toBeInstanceOf(hl7V3.NominatedPrescriptionReleaseRequestWrapper)
  })

  test("translates release request with prescription ID to patient release request", async () => {
    mockAuthorFunction.mockReturnValueOnce(Promise.resolve(mockAuthorResponse))

    const parameters = new fhir.Parameters([{
      "name": "owner",
      "valueIdentifier": {
        "system": "https://fhir.nhs.uk/Id/ods-organization-code",
        "value": "FTX40"
      }
    }, {
      "name": "group-identifier",
      "valueIdentifier": {
        "system": "https://fhir.nhs.uk/Id/prescription-order-number",
        "value": "18B064-A99968-4BCAA3"
      }
    }])

    const translatedRelease = await translateReleaseRequest(parameters, logger)

    expect(mockAuthorFunction).toHaveBeenCalledWith("FTX40", logger)
    expect(translatedRelease).toBeInstanceOf(hl7V3.PatientPrescriptionReleaseRequestWrapper)
  })

  test("translated nominated release contains author details from ODS", async () => {
    mockAuthorFunction.mockReturnValueOnce(Promise.resolve(mockAuthorResponse))

    const translatedRelease = await createNominatedReleaseRequest("FTX40", logger)

    expect(mockAuthorFunction).toHaveBeenCalledWith("FTX40", logger)
    expect(translatedRelease.NominatedPrescriptionReleaseRequest.author).toEqual(mockAuthorResponse)
  })

  test("translated patient release contains prescription ID and author details from ODS", async () => {
    mockAuthorFunction.mockReturnValueOnce(Promise.resolve(mockAuthorResponse))

    const translatedRelease = await createPatientReleaseRequest("FTX40", "18B064-A99968-4BCAA3", logger)

    expect(mockAuthorFunction).toHaveBeenCalledWith("FTX40", logger)
    expect(translatedRelease.PatientPrescriptionReleaseRequest.author).toEqual(mockAuthorResponse)
    expect(
      translatedRelease
        .PatientPrescriptionReleaseRequest
        .pertinentInformation
        .pertinentPrescriptionID
        .value
        ._attributes
        .extension
    ).toEqual("18B064-A99968-4BCAA3")
  })
})
