import * as TestResources from "../../../resources/test-resources"
import {createPatient} from "../../../../src/services/translation/cancellation/cancellation-patient"
import {UNKNOWN_GP_ODS_CODE} from "../../../../src/services/translation/common"
import * as fhir from "../../../../src/models/fhir/fhir-resources"
import * as hl7 from "../../../../src/models/hl7-v3/hl7-v3-people-places"
import * as core from "../../../../src/models/hl7-v3/hl7-v3-datatypes-core"
import {clone} from "../../../resources/test-helpers"
import {getCancellationResponse} from "./test-helpers"

describe("createPatient", () => {
  const cancellationResponse = getCancellationResponse(TestResources.spineResponses.cancellationError)
  let hl7Patient:  hl7.Patient
  let fhirPatient: fhir.Patient

  beforeEach(() => {
    hl7Patient = clone(cancellationResponse.recordTarget.Patient)
    fhirPatient = createPatient(hl7Patient)
  })

  test("returned patient has an identifier block with correct NHS number", () => {
    expect(fhirPatient.identifier).not.toBeUndefined()
    const nhsNumber = fhirPatient.identifier[0].value
    expect(nhsNumber).toBe("9453740519")
  })

  test("returned patient has correct name use", () => {
    expect(fhirPatient.name).not.toBeUndefined()
    expect(fhirPatient.name[0].use).toBe("usual")
  })

  test("returned patient has correct family and given names, and prefix", () => {
    expect(fhirPatient.name).not.toBeUndefined()
    expect(fhirPatient.name[0].family).toBe("CORY")
    expect(fhirPatient.name[0].given[0]).toBe("ETTA")
    expect(fhirPatient.name[0].prefix[0]).toBe("MISS")
  })

  test("returned patient has correct gender", () => {
    expect(fhirPatient.gender).not.toBeUndefined()
    expect(fhirPatient.gender).toBe("female")
  })

  test("returned patient has correct birthdate", () => {
    expect(fhirPatient.birthDate).not.toBeUndefined()
    expect(fhirPatient.birthDate).toBe("1999-01-04")
  })

  test("returned patient has unknown gp code when passed nullFlavor of 'UNK", () => {
    const subjectOf = hl7Patient.patientPerson.playedProviderPatient.subjectOf
    subjectOf.patientCareProvision.responsibleParty.healthCareProvider.id = core.Null.UNKNOWN
    hl7Patient.patientPerson.playedProviderPatient.subjectOf = subjectOf

    fhirPatient = createPatient(hl7Patient)
    expect(fhirPatient.generalPractitioner).not.toBeUndefined()
    expect(fhirPatient.generalPractitioner[0].identifier.value).toBe(UNKNOWN_GP_ODS_CODE)
  })

  test("returned patient has correct GP", () => {
    expect(fhirPatient.generalPractitioner).not.toBeUndefined()
    expect(fhirPatient.generalPractitioner[0].identifier.value).toBe("B81001")
  })

  test("returned patient has correct address use", () => {
    expect(fhirPatient.address).not.toBeUndefined()
    expect(fhirPatient.address[0].use).toBe("home")
  })

  test("returned patient has correct address", () => {
    expect(fhirPatient.address[0].postalCode).toBe("NG10 1NP")
    expect(fhirPatient.address[0].line.length).toBe(3)
    expect(fhirPatient.address[0].line[0]).toBe("123 Dale Avenue")
    expect(fhirPatient.address[0].line[1]).toBe("Long Eaton")
    expect(fhirPatient.address[0].line[2]).toBe("Nottingham")
  })
})
