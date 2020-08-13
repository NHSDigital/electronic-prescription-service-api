import {
  convertIsoStringToDateTime,
  getIdentifierValueForSystem,
  getIdentifierValueOrNullForSystem,
  getResourceForFullUrl,
  getResourcesOfType,
  wrapInOperationOutcome
} from "../../../src/services/translation/common"
import * as TestResources from "../../resources/test-resources"
import * as fhir from "../../../src/model/fhir-resources"
import {Identifier, MedicationRequest} from "../../../src/model/fhir-resources"
import {clone} from "../../resources/test-helpers"
import {SpineDirectResponse} from "../../../src/services/spine-communication"

test("getResourcesOfType returns correct resources", () => {
  const result = getResourcesOfType(TestResources.examplePrescription1.fhirMessageUnsigned, new MedicationRequest())
  expect(result).toBeInstanceOf(Array)
  expect(result).toHaveLength(4)
  result.map(x => expect((x as fhir.Resource).resourceType).toBe("MedicationRequest"))
})

test("getResourceForFullUrl returns correct resources", () => {
  const result = getResourceForFullUrl(TestResources.examplePrescription1.fhirMessageUnsigned, "urn:uuid:A7B86F8D-1D81-FC28-E050-D20AE3A215F0")
  expect((result as fhir.Resource).resourceType).toBe("MedicationRequest")
})

test("getResourceForFullUrl throws error when finding multiple resources", () => {
  const bundle2 = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
  bundle2.entry[1].fullUrl = bundle2.entry[0].fullUrl
  expect(() => getResourceForFullUrl(bundle2, bundle2.entry[0].fullUrl)).toThrow(TypeError)
})

describe("getIdentifierValueForSystem", () => {
  const identifierArray: Array<Identifier> = [
    {
      "system": "https://fhir.nhs.uk/Id/sds-role-profile-id",
      "value": "100112897984"
    },
    {
      "system": "https://fhir.nhs.uk/Id/prescription-order-item-number",
      "value": "A7B86F8D-1D81-FC28-E050-D20AE3A215F0"
    },
    {
      "system": "https://fhir.nhs.uk/Id/prescription-order-item-number",
      "value": "A7B86F8D-1D81-FC28-E050-D20AE3A215F0"
    }
  ]

  test("getIdentifierValueForSystem throws error for no value of system", () => {
    expect(() => getIdentifierValueForSystem(identifierArray, "bob")).toThrow()
  })

  test("getIdentifierValueForSystem returns correct value for system", () => {
    const result = getIdentifierValueForSystem(identifierArray, "https://fhir.nhs.uk/Id/sds-role-profile-id")
    expect(result).toBe("100112897984")
  })

  test("getIdentifierValueForSystem throws error when finding multiple values for system", () => {
    expect(() => getIdentifierValueForSystem(identifierArray, "https://fhir.nhs.uk/Id/prescription-order-item-number")).toThrow()
  })
})

describe("getIdentifierValueOrNullForSystem", () => {
  const identifierArray: Array<Identifier> = [
    {
      "system": "https://fhir.nhs.uk/Id/sds-role-profile-id",
      "value": "100112897984"
    },
    {
      "system": "https://fhir.nhs.uk/Id/prescription-order-item-number",
      "value": "A7B86F8D-1D81-FC28-E050-D20AE3A215F0"
    },
    {
      "system": "https://fhir.nhs.uk/Id/prescription-order-item-number",
      "value": "A7B86F8D-1D81-FC28-E050-D20AE3A215F0"
    }
  ]

  test("getIdentifierValueForSystem throws error for no value of system", () => {
    const result = getIdentifierValueOrNullForSystem(identifierArray, "bob")
    expect(result).toBe(undefined)
  })

  test("getIdentifierValueForSystem returns correct value for system", () => {
    const result = getIdentifierValueOrNullForSystem(identifierArray, "https://fhir.nhs.uk/Id/sds-role-profile-id")
    expect(result).toBe("100112897984")
  })

  test("getIdentifierValueForSystem throws error when finding multiple values for system", () => {
    expect(() => getIdentifierValueOrNullForSystem(identifierArray, "https://fhir.nhs.uk/Id/prescription-order-item-number")).toThrow()
  })
})

describe("wrapInOperationOutcome", () => {
  test("returns informational OperationOutcome for status code <= 299", () => {
    const spineResponse: SpineDirectResponse = {statusCode: 299, body: "test"}
    const result = wrapInOperationOutcome(spineResponse)
    expect(result.issue[0].severity).toEqual("information")
    expect(result.issue[0].code).toEqual("informational")
  })

  test("returns error OperationOutcome for status code > 299", () => {
    const spineResponse: SpineDirectResponse = {statusCode: 300, body: "test"}
    const result = wrapInOperationOutcome(spineResponse)
    expect(result.issue[0].severity).toEqual("error")
    expect(result.issue[0].code).toEqual("invalid")
  })
})

describe("date time conversion returns UTC timestamp", () => {
  test("when no timezone present and local time is GMT", () => {
    const timestamp = convertIsoStringToDateTime("2020-01-21T11:15:30.000")
    expect(timestamp._attributes.value).toEqual("20200121111530")
  })

  //This one is ambiguous. Should we assume UTC or local time when no timezone is present? The FHIR spec mandates the
  //inclusion of a timezone when hours and minutes are specified, so we shouldn't receive messages like this anyway.
  test("when no timezone present and local time is BST", () => {
    const timestamp = convertIsoStringToDateTime("2020-06-05T15:45:00.000")
    expect(timestamp._attributes.value).toEqual("20200605154500")
  })

  test("when zulu timezone present and local time is GMT", () => {
    const timestamp = convertIsoStringToDateTime("2020-02-01T23:05:05.000Z")
    expect(timestamp._attributes.value).toEqual("20200201230505")
  })

  test("when zulu timezone present and local time is BST", () => {
    const timestamp = convertIsoStringToDateTime("2020-07-01T01:15:00.000Z")
    expect(timestamp._attributes.value).toEqual("20200701011500")
  })

  test("when timezone present and local time is GMT", () => {
    const timestamp = convertIsoStringToDateTime("2020-01-15T02:30:30.000+02:00")
    expect(timestamp._attributes.value).toEqual("20200115003030")
  })

  test("when timezone present and local time is BST", () => {
    const timestamp = convertIsoStringToDateTime("2020-06-22T12:50:30.000+02:00")
    expect(timestamp._attributes.value).toEqual("20200622105030")
  })
})
