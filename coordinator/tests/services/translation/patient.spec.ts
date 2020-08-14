import {convertPatient} from "../../../src/services/translation/patient"
import {Bundle, Patient} from "../../../src/model/fhir-resources"
import {clone} from "../../resources/test-helpers"
import * as TestResources from "../../resources/test-resources"
import {getResourcesOfType} from "../../../src/services/translation/common"
import {Address, Name} from "../../../src/model/hl7-v3-datatypes-core"
import {SexCode} from "../../../src/model/hl7-v3-datatypes-codes"

describe("convertPatient", () => {
  let bundle: Bundle
  let fhirPatient: Patient
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const convertAddressFn = (value: never) => {
    return new Address()
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const convertNameFn = (value: never) => {
    return new Name()
  }
  const convertGenderFn = (value: string) => {
    return new SexCode(value)
  }

  beforeEach(() => {
    bundle = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    fhirPatient = getResourcesOfType(bundle, new Patient())[0]
  })

  test("Throws TypeError when passed multiple copies of identifier", () => {
    fhirPatient.identifier.push(fhirPatient.identifier[0])
    expect(() => convertPatient(bundle, fhirPatient)).toThrow(TypeError)
  })

  test("ID gets put in correct field", () => {
    const idValue = "exampleId"
    fhirPatient.identifier[0].value = idValue

    const actual = convertPatient(bundle, fhirPatient).id._attributes.extension

    expect(actual).toBe(idValue)
  })

  test("address gets passed through the convertAddress function", () => {
    const mockConvertAddress = jest.fn(convertAddressFn)
    const addressValue = {use: "example"}
    fhirPatient.address = [addressValue]

    convertPatient(bundle, fhirPatient, mockConvertAddress)

    expect(mockConvertAddress.mock.calls.length).toBe(1)
    expect(mockConvertAddress.mock.calls[0][0]).toEqual(addressValue)
  })

  test("name gets passed through convertName function", () => {
    const mockConvertAddress = jest.fn(convertAddressFn)
    const mockConvertName = jest.fn(convertNameFn)
    const nameValue = {use: "example"}
    fhirPatient.name = [nameValue]

    convertPatient(bundle, fhirPatient, mockConvertAddress, mockConvertName)

    expect(mockConvertName.mock.calls.length).toBe(1)
    expect(mockConvertName.mock.calls[0][0]).toEqual(nameValue)
  })

  test("gender gets passed through convertGender function", () => {
    const mockConvertAddress = jest.fn(convertAddressFn)
    const mockConvertName = jest.fn(convertNameFn)
    const mockConvertGender = jest.fn(convertGenderFn)
    const genderValue = "male"
    fhirPatient.gender = genderValue

    convertPatient(bundle, fhirPatient, mockConvertAddress, mockConvertName, mockConvertGender)

    expect(mockConvertGender.mock.calls.length).toBe(1)
    expect(mockConvertGender.mock.calls[0][0]).toEqual(genderValue)
  })
})
