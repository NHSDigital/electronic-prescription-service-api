import {
  getAgentParameter,
  getIdentifierParameterByName,
  getIdentifierValueForSystem,
  getIdentifierValueOrNullForSystem,
  getMedicationCoding,
  getNumericValueAsString,
  getOrganizationResourceFromParameters,
  getOwnerParameter,
  getResourceForFullUrl,
  getStringParameterByName
} from "../../../../src/services/translation/common"
import * as TestResources from "../../../resources/test-resources"
import {clone} from "../../../resources/test-helpers"
import * as LosslessJson from "lossless-json"
import {fhir, processingErrors as errors} from "@models"
import {
  convertIsoDateStringToHl7V3Date,
  convertIsoDateTimeStringToHl7V3DateTime
} from "../../../../src/services/translation/common/dateTime"
import {getMedicationRequests} from "../../../../src/services/translation/common/getResourcesOfType"
import {convertResourceToBundleEntry} from "../../../../src/services/translation/response/common"
import * as testData from "../../../resources/test-data"
import {LosslessNumber} from "lossless-json"

const getTestStringParameter = (name: number, value: number): fhir.StringParameter => {
  return {
    name: `test${name}`, valueString: `value${value}`
  }
}
const getTestIdentifierParameter = (name: number, value: number): fhir.IdentifierParameter => {
  return {
    name: `test${name}`, valueIdentifier: {value: `value${value}`}
  }
}

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
  expect(() => getResourceForFullUrl(bundle2, bundle2.entry[0].fullUrl)).toThrow(errors.TooManyValuesError)
})

describe("getIdentifierValueForSystem", () => {
  const identifierArray: Array<fhir.Identifier> = [
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
  const identifierArray: Array<fhir.Identifier> = [
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
    const input = LosslessJson.parse(inputStr) as number | LosslessNumber
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

describe("getParameterByName", () => {
  const exampleParameters = new fhir.Parameters([
    getTestStringParameter(1, 1),
    getTestStringParameter(2, 2),
    getTestStringParameter(2, 3),
    getTestIdentifierParameter(3, 4),
    getTestIdentifierParameter(4, 5),
    getTestIdentifierParameter(4, 6)
  ])

  test("getStringParameterByName returns correct values", () => {
    const expected: fhir.StringParameter = {name: "test1", valueString: "value1"}
    const actual = getStringParameterByName(exampleParameters.parameter, "test1")
    expect(actual).toEqual(expected)
  })

  test("getStringParameterByName throws error when two parameters have the same name", () => {
    expect(() => getStringParameterByName(exampleParameters.parameter, "test2"))
      .toThrow("Too many values submitted. Expected 1 element where name == 'test2'.")
  })

  test("getStringParameterByName throws error when no parameters with name found", () => {
    expect(() => getStringParameterByName(exampleParameters.parameter, "notReal"))
      .toThrow("Too few values submitted. Expected 1 element where name == 'notReal'.")
  })

  test("getIdentifierParameterByName returns correct values", () => {
    const expected: fhir.IdentifierParameter = {name: "test3", valueIdentifier: {value: "value4"}}
    const actual = getIdentifierParameterByName(exampleParameters.parameter, "test3")
    expect(actual).toEqual(expected)
  })

  test("getIdentifierParameterByName throws error when two parameters have the same name", () => {
    expect(() => getIdentifierParameterByName(exampleParameters.parameter, "test4"))
      .toThrow("Too many values submitted. Expected 1 element where name == 'test4'.")
  })

  test("getIdentifierParameterByName throws error when no parameters with name found", () => {
    expect(() => getIdentifierParameterByName(exampleParameters.parameter, "notReal"))
      .toThrow("Too few values submitted. Expected 1 element where name == 'notReal'.")
  })
})

describe("getMedicationCodeableConceptCoding", () => {
  let bundle: fhir.Bundle
  let medicationRequest: fhir.MedicationRequest

  beforeEach(() => {
    bundle = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    medicationRequest = getMedicationRequests(bundle)[0]
  })

  test("medicationCodeableConcept", () => {
    const codeableConcept = getMedicationCoding(bundle, medicationRequest)
    expect(codeableConcept).toEqual(medicationRequest.medicationCodeableConcept.coding[0])
  })

  test("medicationReference", () => {
    const medicationResource: fhir.Medication = {
      resourceType: "Medication",
      id: "test",
      code: medicationRequest.medicationCodeableConcept
    }

    const bundleEntry = convertResourceToBundleEntry(medicationResource)
    bundle.entry.push(bundleEntry)

    delete medicationRequest.medicationCodeableConcept

    medicationRequest.medicationReference = {
      reference: "urn:uuid:test"
    }

    const codeableConcept = getMedicationCoding(bundle, medicationRequest)
    expect(codeableConcept).toEqual(medicationResource.code.coding[0])
  })
})

function createResourceParameter<R extends fhir.Resource>(name: string, resource: R): fhir.ResourceParameter<R> {
  return {name, resource}
}

function createParameters(parameters: Array<fhir.Parameter>): fhir.Parameters {
  return {
    resourceType: "Parameters",
    parameter: parameters
  }
}

describe("followParametersReference", () => {
  const testOrg: fhir.Organization = {resourceType: "Organization", id: "testId"}

  const testOtherResource: fhir.Resource = {resourceType: "Other"}

  test("picks the correct resource", () => {
    const parameters = createParameters([
      createResourceParameter("org", testOrg),
      createResourceParameter("other", testOtherResource)
    ])

    const reference: fhir.Reference<fhir.Organization> = {reference: "Organization/testId"}

    const result = getOrganizationResourceFromParameters(parameters, reference)
    expect(result).toBe(testOrg)
  })

  test("picks the correct id", () => {
    const testOrg1 = {...testOrg, id: "testId1"}
    const testOrg2 = {...testOrg, id: "testId2"}
    const parameters = createParameters([
      createResourceParameter("org1", testOrg1),
      createResourceParameter("org2", testOrg2)
    ])

    const reference: fhir.Reference<fhir.Organization> = {reference: "Organization/testId1"}

    const result = getOrganizationResourceFromParameters(parameters, reference)
    expect(result).toBe(testOrg1)
  })
})

describe("getResourceParameterByName", () => {
  test("getAgentParameter returns correct param", () => {
    const param2 = createResourceParameter("test2", {resourceType: "resource2"})
    const parameters = createParameters([
      testData.agentParameter,
      param2
    ])

    const result = getAgentParameter(parameters)

    expect(result).toBe(testData.agentParameter)
  })

  test("getAgentParameter throws when no param with correct name", () => {
    const param1 = createResourceParameter("test1", {resourceType: "resource1"})
    const param2 = createResourceParameter("test2", {resourceType: "resource2"})
    const parameters = createParameters([
      param1,
      param2
    ])

    expect(() => getAgentParameter(parameters)).toThrow()
  })

  test("getAgentParameter throws agent param is not PractitionerRole", () => {
    const param1 = createResourceParameter("agent", {resourceType: "resource1"})
    const param2 = createResourceParameter("test2", {resourceType: "resource2"})
    const parameters = createParameters([
      param1,
      param2
    ])

    expect(() => getAgentParameter(parameters)).toThrow()
  })

  test("getOwnerParameter", () => {
    const param2 = createResourceParameter("test2", {resourceType: "resource2"})
    const parameters = createParameters([
      testData.ownerParameter,
      param2
    ])

    const result = getOwnerParameter(parameters)

    expect(result).toBe(testData.ownerParameter)
  })
})
