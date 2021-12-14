import {odsClient} from "../../../../src/services/communication/ods-client"
import {createAuthorForUnattendedAccess} from "../../../../src/services/translation/request/agent-unattended"
import pino from "pino"
import {fhir, processingErrors as errors} from "@models"
import {toArray} from "../../../../src/services/translation/common"

const logger = pino()

jest.mock("../../../../src/services/communication/ods-client", () => ({
  odsClient: {
    lookupOrganization: jest.fn()
  }
}))

test("user details populated from header user information", async () => {
  const mockLookupFunction = odsClient.lookupOrganization as jest.Mock
  mockLookupFunction.mockReturnValueOnce(Promise.resolve(mockOrganizationResponse))

  const result = await createAuthorForUnattendedAccess("FTX40", undefined, logger)

  const agentPerson = result.AgentPerson
  expect(agentPerson.id._attributes.extension).toEqual("555254240100")
  expect(agentPerson.code._attributes.code).toEqual("S8000:G8000:R8003")
  expect(agentPerson.telecom[0]._attributes.value).toEqual("tel:08706001540")

  const agentPersonPerson = agentPerson.agentPerson
  expect(agentPersonPerson.id._attributes.extension).toEqual("555254239107")
  expect(toArray(agentPersonPerson.name)[0]._text).toEqual("USERQ RANDOM Mr")
})

test("organization details are populated from ODS response", async () => {
  const mockLookupFunction = odsClient.lookupOrganization as jest.Mock
  mockLookupFunction.mockReturnValueOnce(Promise.resolve(mockOrganizationResponse))

  const result = await createAuthorForUnattendedAccess("FTX40", undefined, logger)

  expect(mockLookupFunction).toHaveBeenCalledWith("FTX40", logger)
  const representedOrganization = result.AgentPerson.representedOrganization
  expect(representedOrganization.id._attributes.extension).toEqual("FTX40")
  expect(representedOrganization.name._text).toEqual("HEALTHCARE AT HOME")
  expect(representedOrganization.code._attributes.code).toEqual("999")
  expect(representedOrganization.telecom._attributes.value).toEqual("tel:08706001540")
  expect(representedOrganization.addr.postalCode._text).toEqual("DE14 2WS")
})

test("throws if organization not found in ODS", async () => {
  const mockLookupFunction = odsClient.lookupOrganization as jest.Mock
  mockLookupFunction.mockReturnValueOnce(Promise.resolve(null))

  await expect(() =>
    createAuthorForUnattendedAccess("FTX40", undefined, logger)
  ).rejects.toThrow(errors.FhirMessageProcessingError)
})

const mockOrganizationResponse: fhir.Organization = {
  resourceType: "Organization",
  identifier: [
    {
      system: "https://fhir.nhs.uk/Id/ods-organization-code",
      value: "FTX40"
    }
  ],
  type: [
    {
      coding: [
        {
          system: "https://fhir.nhs.uk/CodeSystem/organisation-role",
          code: "182",
          display: "PHARMACY"
        }
      ]
    }
  ],
  name: "HEALTHCARE AT HOME",
  telecom: [
    {
      system: "phone",
      value: "0870 6001540"
    }
  ],
  address: [
    {
      line: [
        "FIFTH AVENUE",
        "CENTRUM ONE HUNDRED"
      ],
      city: "BURTON-ON-TRENT",
      district: "STAFFORDSHIRE",
      postalCode: "DE14 2WS"
    }
  ]
}
