import {
  getIdentifierValueForSystem,
  getIdentifierValueOrNullForSystem,
  getNumericValueAsString,
  getResourceForFullUrl,
  getResourcesOfType,
  wrapInOperationOutcome
} from "../../../src/services/translation/common"
import * as TestResources from "../../resources/test-resources"
import * as fhir from "../../../src/model/fhir-resources"
import {Identifier, MedicationRequest} from "../../../src/model/fhir-resources"
import {clone} from "../../resources/test-helpers"
import {SpineDirectResponse} from "../../../src/services/spine-communication"
import * as LosslessJson from "lossless-json"

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

describe("getNumericValueAsString preserves numeric precision", () => {
  test.each([
    ["20", "20"],
    ["20.00", "20.00"],
    ["1.1", "1.1"],
    ["\"20\"", "20"],
    ["\"20.00\"", "20.00"]
  ])("when input is %s", (inputStr: string, expectedOutput: string) => {
    const input = LosslessJson.parse(inputStr)
    const actualOutput = getNumericValueAsString(input)
    expect(actualOutput).toEqual(expectedOutput)
  })

  test("or an exception is thrown", () => {
    expect(() => {
      const input = JSON.parse("20.00")
      getNumericValueAsString(input)
    }).toThrow()
  })
})
