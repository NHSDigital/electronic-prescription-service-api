import pino from "pino"
import * as moxios from "moxios"
import axios from "axios"
import {LiveOdsClient} from "../../../src/services/communication/live-ods-client"
import {OdsOrganization, OdsOrganizationRoleExtension} from "../../../src/services/communication/ods-organization"
import * as fhir from "../../../src/models/fhir"

const odsClient = new LiveOdsClient()

const logger = pino()

beforeEach(() => {
  moxios.install(axios)
})

afterEach(() => {
  moxios.uninstall(axios)
})

test("Successful response containing all expected fields is mapped correctly", async () => {
  moxios.wait(() => {
    const request = moxios.requests.mostRecent()
    request.respondWith({
      status: 200,
      statusText: "OK",
      response: createExampleOdsResponse()
    })
  })

  const result = await odsClient.lookupOrganization("FTX40", logger)

  expect(result.resourceType).toEqual<string>("Organization")
  expect(result.identifier).toContainEqual<fhir.Identifier>(exampleIdentifier)
  expect(result.name).toEqual<string>(exampleName)
  expect(result.address).toContainEqual<fhir.Address>(exampleAddress)
  expect(result.telecom).toContainEqual<fhir.ContactPoint>(exampleTelecom)
  expect(result.type).toContainEqual<fhir.CodeableConcept>({
    coding: [{
      system: "https://fhir.nhs.uk/CodeSystem/organisation-role",
      code: "182",
      display: "PHARMACY"
    }]
  })
})

test("Successful response missing telecom is mapped correctly", async () => {
  const response = createExampleOdsResponse()
  delete response.telecom
  moxios.wait(() => {
    const request = moxios.requests.mostRecent()
    request.respondWith({
      status: 200,
      statusText: "OK",
      response: response
    })
  })

  const result = await odsClient.lookupOrganization("FTX40", logger)

  expect(result.telecom).toBeFalsy()
})

test("Successful response missing address is mapped correctly", async () => {
  const response = createExampleOdsResponse()
  delete response.address
  moxios.wait(() => {
    const request = moxios.requests.mostRecent()
    request.respondWith({
      status: 200,
      statusText: "OK",
      response: response
    })
  })

  const result = await odsClient.lookupOrganization("FTX40", logger)

  expect(result.address).toBeFalsy()
})

test("Successful response missing name is mapped correctly", async () => {
  const response = createExampleOdsResponse()
  delete response.name
  moxios.wait(() => {
    const request = moxios.requests.mostRecent()
    request.respondWith({
      status: 200,
      statusText: "OK",
      response: response
    })
  })

  const result = await odsClient.lookupOrganization("FTX40", logger)

  expect(result.name).toBeFalsy()
})

test("Primary role details are used when response contains primary and other roles", async () => {
  const response = createExampleOdsResponse()
  response.extension = [
    createExampleOrganizationRoleExtension("197", "NHS TRUST", true, "Active"),
    createExampleOrganizationRoleExtension("57", "FOUNDATION TRUST", false, "Active")
  ]
  moxios.wait(() => {
    const request = moxios.requests.mostRecent()
    request.respondWith({
      status: 200,
      statusText: "OK",
      response: response
    })
  })

  const result = await odsClient.lookupOrganization("FTX40", logger)

  expect(result.type).toContainEqual<fhir.CodeableConcept>({
    coding: [{
      system: "https://fhir.nhs.uk/CodeSystem/organisation-role",
      code: "197",
      display: "NHS TRUST"
    }]
  })
})

test("Active role details are used when response contains active and inactive roles", async () => {
  const response = createExampleOdsResponse()
  response.extension = [
    createExampleOrganizationRoleExtension("197", "NHS TRUST", true, "Active"),
    createExampleOrganizationRoleExtension("57", "FOUNDATION TRUST", true, "Inactive")
  ]
  moxios.wait(() => {
    const request = moxios.requests.mostRecent()
    request.respondWith({
      status: 200,
      statusText: "OK",
      response: response
    })
  })

  const result = await odsClient.lookupOrganization("FTX40", logger)

  expect(result.type).toContainEqual<fhir.CodeableConcept>({
    coding: [{
      system: "https://fhir.nhs.uk/CodeSystem/organisation-role",
      code: "197",
      display: "NHS TRUST"
    }]
  })
})

test("Returns null when response contains multiple active primary roles", async () => {
  const response = createExampleOdsResponse()
  response.extension = [
    createExampleOrganizationRoleExtension("197", "NHS TRUST", true, "Active"),
    createExampleOrganizationRoleExtension("57", "FOUNDATION TRUST", true, "Active")
  ]
  moxios.wait(() => {
    const request = moxios.requests.mostRecent()
    request.respondWith({
      status: 200,
      statusText: "OK",
      response: response
    })
  })

  const result = await odsClient.lookupOrganization("FTX40", logger)

  expect(result).toBeFalsy()
})

test("Returns null when response is not found", async () => {
  moxios.wait(() => {
    const request = moxios.requests.mostRecent()
    request.respondWith({
      status: 404,
      statusText: "Not Found"
    })
  })

  const result = await odsClient.lookupOrganization("FTX40", logger)

  expect(result).toBeFalsy()
})

function createExampleOdsResponse(): OdsOrganization {
  return {
    resourceType: "Organization",
    id: exampleId,
    extension: [
      createExampleOrganizationRoleExtension("182","PHARMACY",true,"Active")
    ],
    identifier: exampleIdentifier,
    name: exampleName,
    telecom: [
      exampleTelecom
    ],
    address: exampleAddress
  }
}

function createExampleOrganizationRoleExtension(
  organizationRoleCode: string,
  organizationRoleDesc: string,
  primaryRole: boolean,
  roleStatus: "Active" | "Inactive"
): OdsOrganizationRoleExtension {
  return {
    url: "https://fhir.nhs.uk/STU3/StructureDefinition/Extension-ODSAPI-OrganizationRole-1",
    extension: [
      {
        url: "role",
        valueCoding: {
          system: "https://directory.spineservices.nhs.uk/STU3/CodeSystem/ODSAPI-OrganizationRole-1",
          code: organizationRoleCode,
          display: organizationRoleDesc
        }
      },
      {
        url: "primaryRole",
        valueBoolean: primaryRole
      },
      {
        url: "status",
        valueString: roleStatus
      }
    ]
  }
}

const exampleId = "FTX40"
const exampleName = "HEALTHCARE AT HOME"
const exampleIdentifier = {
  system: "https://fhir.nhs.uk/Id/ods-organization-code",
  value: exampleId
}
const exampleAddress = {
  line: [
    "FIFTH AVENUE",
    "CENTRUM ONE HUNDRED"
  ],
  city: "BURTON-ON-TRENT",
  district: "STAFFORDSHIRE",
  postalCode: "DE14 2WS",
  country: "ENGLAND"
}
const exampleTelecom = {
  system: "phone",
  value: "0870 6001540"
}
