import {fhir, hl7V3} from "@models"
import {
  createNominatedReleaseRequest,
  createPatientReleaseRequest,
  translateReleaseRequest
} from "../../../../../src/services/translation/request/dispense/release"
import pino from "pino"
import {
  createAuthorForUnattendedAccess,
  createAuthorForAttendedAccess
} from "../../../../../src/services/translation/request/agent-unattended"

const logger = pino()

jest.mock("../../../../../src/services/translation/request/agent-unattended", () => ({
  createAuthorForUnattendedAccess: jest.fn(),
  createAuthorForAttendedAccess: jest.fn()
}))

describe("translateReleaseRequest", () => {
  const mockAuthorResponse = new hl7V3.Author()
  mockAuthorResponse.AgentPerson = new hl7V3.AgentPerson()
  const mockUnattendedAuthorFunction = createAuthorForUnattendedAccess as jest.Mock
  const mockAttendedAuthorFunction = createAuthorForAttendedAccess as jest.Mock

  test("translates release request without prescription ID to nominated release request", async () => {
    mockUnattendedAuthorFunction.mockReturnValueOnce(Promise.resolve(mockAuthorResponse))

    const parameters = new fhir.Parameters([
      {
        "name": "owner",
        "valueIdentifier": {
          "system": "https://fhir.nhs.uk/Id/ods-organization-code",
          "value": "FTX40"
        }
      }
    ])

    const translatedRelease = await translateReleaseRequest(parameters, logger)

    expect(mockUnattendedAuthorFunction).toHaveBeenCalledWith("FTX40", logger)
    expect(translatedRelease).toBeInstanceOf(hl7V3.NominatedPrescriptionReleaseRequestWrapper)
  })

  test("translates release request with prescription ID to patient release request", async () => {
    mockAttendedAuthorFunction.mockReturnValueOnce(Promise.resolve(mockAuthorResponse))

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
    },
    {
      "name": "agent",
      "valueIdentifier": {
        "system": "https://fhir.hl7.org.uk/Id/gphc-number",
        "value": "7654321"
      }
    }])

    const translatedRelease = await translateReleaseRequest(parameters, logger)

    expect(mockAttendedAuthorFunction).toHaveBeenCalledWith("7654321", "FTX40", logger)
    expect(translatedRelease).toBeInstanceOf(hl7V3.PatientPrescriptionReleaseRequestWrapper)
  })

  test("translated nominated release contains author details from ODS", async () => {
    mockUnattendedAuthorFunction.mockReturnValueOnce(Promise.resolve(mockAuthorResponse))

    const translatedRelease = await createNominatedReleaseRequest("FTX40", logger)

    expect(mockUnattendedAuthorFunction).toHaveBeenCalledWith("FTX40", logger)
    expect(translatedRelease.NominatedPrescriptionReleaseRequest.author).toEqual(mockAuthorResponse)
  })

  test("translated patient release contains prescription ID and author details from ODS", async () => {
    mockAttendedAuthorFunction.mockReturnValueOnce(Promise.resolve(mockAuthorResponse))

    const translatedRelease = await createPatientReleaseRequest("FTX40", "7654321", "18B064-A99968-4BCAA3", logger)

    expect(mockAttendedAuthorFunction).toHaveBeenCalledWith("7654321", "FTX40", logger)
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
