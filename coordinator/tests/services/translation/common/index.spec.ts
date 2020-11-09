import {
  convertIsoDateStringToHl7V3Date,
  convertIsoDateTimeStringToHl7V3DateTime,
  getIdentifierValueForSystem,
  getIdentifierValueOrNullForSystem,
  getNumericValueAsString,
  getResourceForFullUrl,
  wrapInOperationOutcome
} from "../../../../src/services/translation/common"
import * as TestResources from "../../../resources/test-resources"
import * as fhir from "../../../../src/models/fhir/fhir-resources"
import {Identifier} from "../../../../src/models/fhir/fhir-resources"
import {clone} from "../../../resources/test-helpers"
import {SpineDirectResponse} from "../../../../src/models/spine"
import * as LosslessJson from "lossless-json"
import {TooManyValuesError} from "../../../../src/models/errors/processing-errors"

test("getResourceForFullUrl returns correct resources", () => {
  const result = getResourceForFullUrl(
    TestResources.examplePrescription1.fhirMessageUnsigned,
    "urn:uuid:a54219b8-f741-4c47-b662-e4f8dfa49ab7"
  )
  expect((result as fhir.Resource).resourceType).toBe("MedicationRequest")
})

test("getResourceForFullUrl throws TooManyValuesUserFacingError when finding multiple resources", () => {
  const bundle2 = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
  bundle2.entry[1].fullUrl = bundle2.entry[0].fullUrl
  expect(() => getResourceForFullUrl(bundle2, bundle2.entry[0].fullUrl)).toThrow(TooManyValuesError)
})

describe("getIdentifierValueForSystem", () => {
  const identifierArray: Array<Identifier> = [
    {
      "system": "https://fhir.nhs.uk/Id/sds-role-profile-id",
      "value": "100112897984"
    },
    {
      "system": "https://fhir.nhs.uk/Id/prescription-order-item-number",
      "value": "a7b86f8d-1d81-fc28-e050-d20ae3a215f0"
    },
    {
      "system": "https://fhir.nhs.uk/Id/prescription-order-item-number",
      "value": "a7b86f8d-1d81-fc28-e050-d20ae3a215f0"
    }
  ]

  test("getIdentifierValueForSystem throws error for no value of system", () => {
    expect(() => getIdentifierValueForSystem(identifierArray, "bob", "fhirPath")).toThrow()
  })

  test("getIdentifierValueForSystem returns correct value for system", () => {
    const result = getIdentifierValueForSystem(
      identifierArray,
      "https://fhir.nhs.uk/Id/sds-role-profile-id",
      "fhirPath"
    )
    expect(result).toBe("100112897984")
  })

  test("getIdentifierValueForSystem throws error when finding multiple values for system", () => {
    expect(() =>
      getIdentifierValueForSystem(
        identifierArray,
        "https://fhir.nhs.uk/Id/prescription-order-item-number",
        "fhirPath"
      )
    ).toThrow()
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
      "value": "a7b86f8d-1d81-fc28-e050-d20ae3a215f0"
    },
    {
      "system": "https://fhir.nhs.uk/Id/prescription-order-item-number",
      "value": "a7b86f8d-1d81-fc28-e050-d20ae3a215f0"
    }
  ]

  test("getIdentifierValueForSystem throws error for no value of system", () => {
    const result = getIdentifierValueOrNullForSystem(identifierArray, "bob", "fhirPath")
    expect(result).toBe(undefined)
  })

  test("getIdentifierValueForSystem returns correct value for system", () => {
    const result = getIdentifierValueOrNullForSystem(
      identifierArray,
      "https://fhir.nhs.uk/Id/sds-role-profile-id",
      "fhirPath"
    )
    expect(result).toBe("100112897984")
  })

  test("getIdentifierValueForSystem throws error when finding multiple values for system", () => {
    expect(() =>
      getIdentifierValueOrNullForSystem(
        identifierArray,
        "https://fhir.nhs.uk/Id/prescription-order-item-number",
        "fhirPath"
      )
    ).toThrow()
  })
})

describe("wrapInOperationOutcome", () => {
  test("returns informational OperationOutcome for status code <= 299", () => {
    const spineResponse: SpineDirectResponse<string> = {statusCode: 299, body: "test"}
    const result = wrapInOperationOutcome(spineResponse)
    expect(result.issue[0].severity).toEqual("information")
    expect(result.issue[0].code).toEqual("informational")
  })

  test("returns error OperationOutcome for status code > 299", () => {
    const spineResponse: SpineDirectResponse<string> = {statusCode: 300, body: "test"}
    const result = wrapInOperationOutcome(spineResponse)
    expect(result.issue[0].severity).toEqual("error")
    expect(result.issue[0].code).toEqual("invalid")
  })
})

describe("date time conversion", () => {
  test("throws when no timezone present", () => {
    expect(() => {
      convertIsoDateTimeStringToHl7V3DateTime("2020-01-21T11:15:30.000", "fhirPath")
    }).toThrow()
  })

  test("returns UTC timestamp when zulu timezone present and local time is GMT", () => {
    const timestamp = convertIsoDateTimeStringToHl7V3DateTime("2020-02-01T23:05:05.000Z", "fhirPath")
    expect(timestamp._attributes.value).toEqual("20200201230505")
  })

  test("returns UTC timestamp when zulu timezone present and local time is BST", () => {
    const timestamp = convertIsoDateTimeStringToHl7V3DateTime("2020-07-01T01:15:00.000Z", "fhirPath")
    expect(timestamp._attributes.value).toEqual("20200701011500")
  })

  test("returns UTC timestamp when timezone present and local time is GMT", () => {
    const timestamp = convertIsoDateTimeStringToHl7V3DateTime("2020-01-15T02:30:30.000+02:00", "fhirPath")
    expect(timestamp._attributes.value).toEqual("20200115003030")
  })

  test("returns UTC timestamp when timezone present and local time is BST", () => {
    const timestamp = convertIsoDateTimeStringToHl7V3DateTime("2020-06-22T12:50:30.000+02:00", "fhirPath")
    expect(timestamp._attributes.value).toEqual("20200622105030")
  })
})

describe("date conversion", () => {
  test("throws when time present", () => {
    expect(() => {
      convertIsoDateStringToHl7V3Date("2020-01-21T11:15:30.000Z", "fhirPath")
    }).toThrow()
  })

  test("returns UTC timestamp when time not present", () => {
    const timestamp = convertIsoDateStringToHl7V3Date("2020-06-22", "fhirPath")
    expect(timestamp._attributes.value).toEqual("20200622")
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
