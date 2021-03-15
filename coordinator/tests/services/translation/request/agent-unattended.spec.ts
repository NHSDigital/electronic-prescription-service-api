import {odsClient} from "../../../../src/services/communication/ods-client"
import {createAuthorForUnattendedAccess} from "../../../../src/services/translation/request/agent-unattended"
import pino from "pino"
import * as fhir from "../../../../src/models/fhir"
import {FhirMessageProcessingError} from "../../../../src/models/errors/processing-errors"
import {toArray} from "../../../../src/services/translation/common"

const logger = pino()

jest.mock("../../../../src/services/communication/ods-client", () => ({
  odsClient: {
    lookupOrganization: jest.fn()
  }
}))

test("user details contain placeholder data", async () => {
  const mockLookupFunction = odsClient.lookupOrganization as jest.Mock
  mockLookupFunction.mockReturnValueOnce(new Promise((resolve) => resolve(mockOrganizationResponse)))

  const result = await createAuthorForUnattendedAccess("FTX40", logger)

  const agentPerson = result.AgentPerson
  expect(agentPerson.id._attributes.extension).toEqual("999999999999")
  expect(agentPerson.code._attributes.code).toEqual("R9999")
  expect(agentPerson.telecom[0]._attributes.value).toEqual("tel:01234567890")

  const agentPersonPerson = agentPerson.agentPerson
  expect(agentPersonPerson.id._attributes.extension).toEqual("G9999999")
  expect(toArray(agentPersonPerson.name.given)[0]._text).toEqual("Unattended")
  expect(toArray(agentPersonPerson.name.family)[0]._text).toEqual("Access")
})

test("organization details are populated from ODS response", async () => {
  const mockLookupFunction = odsClient.lookupOrganization as jest.Mock
  mockLookupFunction.mockReturnValueOnce(new Promise((resolve) => resolve(mockOrganizationResponse)))

  const result = await createAuthorForUnattendedAccess("FTX40", logger)

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
  mockLookupFunction.mockReturnValueOnce(new Promise((resolve) => resolve(null)))

  await expect(() =>
    createAuthorForUnattendedAccess("FTX40", logger)
  ).rejects.toThrow(FhirMessageProcessingError)
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
