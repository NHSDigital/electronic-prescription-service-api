import * as TestResources from "../../../resources/test-resources"
import {readXml} from "../../../../src/services/serialisation/xml"
import {createPatient} from "../../../../src/services/translation/cancellation/cancellation-patient"
import {SPINE_CANCELLATION_ERROR_RESPONSE_REGEX} from "../../../../src/services/translation/spine-response"

describe("createPatient", () => {
  const actualError = TestResources.spineResponses.cancellationError
  const cancelResponse = SPINE_CANCELLATION_ERROR_RESPONSE_REGEX.exec(actualError.response.body)[0]
  const parsedMsg = readXml(cancelResponse)
  const actEvent = parsedMsg["hl7:PORX_IN050101UK31"]["hl7:ControlActEvent"]
  const cancellationResponse = actEvent["hl7:subject"].CancellationResponse
  const patient = createPatient(cancellationResponse.recordTarget.Patient)

  test("returned patient has an identifier block with correct NHS number", () => {
    expect(patient.identifier).not.toBeUndefined()
    const nhsNumber = patient.identifier[0].value
    expect(nhsNumber).toBe("9453740519")
  })

  test("returned patient has correct name use", () => {
    expect(patient.name).not.toBeUndefined()
    expect(patient.name[0].use).toBe("usual")
  })

  test("returned patient has correct family and given names, and prefix", () => {
    expect(patient.name).not.toBeUndefined()
    expect(patient.name[0].family).toBe("CORY")
    expect(patient.name[0].given[0]).toBe("ETTA")
    expect(patient.name[0].prefix[0]).toBe("MISS")
  })

  test("returned patient has correct gender", () => {
    expect(patient.gender).not.toBeUndefined()
    expect(patient.gender).toBe("female")
  })

  test("returned patient has correct birthdate", () => {
    expect(patient.birthDate).not.toBeUndefined()
    expect(patient.birthDate).toBe("1999-01-04")
  })

  test("returned patient has correct GP", () => {
    expect(patient.generalPractitioner).not.toBeUndefined()
    expect(patient.generalPractitioner[0].identifier.value).toBe("B81001")
  })

  test("returned patient has correct address use", () => {
    expect(patient.address).not.toBeUndefined()
    expect(patient.address[0].use).toBe("home")
  })

  test("returned patient has correct address", () => {
    expect(patient.address[0].postalCode).toBe("NG10 1NP")
    expect(patient.address[0].line.length).toBe(3)
    expect(patient.address[0].line[0]).toBe("123 Dale Avenue")
    expect(patient.address[0].line[1]).toBe("Long Eaton")
    expect(patient.address[0].line[2]).toBe("Nottingham")
  })
})
