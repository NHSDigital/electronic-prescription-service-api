import {convertPatient} from "../../../../src/services/translation/request/patient"
import {clone} from "../../../resources/test-helpers"
import * as TestResources from "../../../resources/test-resources"
import {getPatient} from "../../../../src/services/translation/common/getResourcesOfType"
import {fhir, processingErrors as errors} from "@models"
import {UNKNOWN_GP_ODS_CODE} from "../../../../src/services/translation/common"
import pino from "pino"

const logger = pino()

describe("convertPatient", () => {
  let bundle: fhir.Bundle
  let fhirPatient: fhir.Patient

  beforeEach(() => {
    bundle = clone(TestResources.specification[0].fhirMessageUnsigned)
    fhirPatient = getPatient(bundle)
  })

  test("Throws TooManyValuesUserFacingError when passed multiple copies of identifier", () => {
    fhirPatient.identifier.push(fhirPatient.identifier[0])
    expect(() => convertPatient(bundle, fhirPatient, logger)).toThrow(errors.TooManyValuesError)
  })

  test("ID gets put in correct field", () => {
    const idValue = "exampleId"
    fhirPatient.identifier[0].value = idValue

    const actual = convertPatient(bundle, fhirPatient, logger).id._attributes.extension

    expect(actual).toBe(idValue)
  })

  test("If there is a patient.telecom, it gets put in the right place", () => {
    fhirPatient.telecom = [{use: "home", value: "0123456789"}]

    const actual = convertPatient(bundle, fhirPatient, logger).telecom[0]._attributes

    expect(actual).toEqual({use: "HP", value: "tel:0123456789"})
  })

  test("If there isn't a patient.telecom, leave it off", () => {
    delete fhirPatient.telecom

    const actual = convertPatient(bundle, fhirPatient, logger).telecom

    expect(actual).toEqual(undefined)
  })

  test("If the GP has ID 'V81999' make the Id have nullFlavor 'UNK'", () => {
    fhirPatient.generalPractitioner = createGpWithIdValue(UNKNOWN_GP_ODS_CODE)

    const patientsubjectOf = convertPatient(bundle, fhirPatient, logger).patientPerson.playedProviderPatient.subjectOf
    const actual = patientsubjectOf.patientCareProvision.responsibleParty.healthCareProvider.id._attributes

    expect(actual).toEqual({nullFlavor: "UNK"})
  })

  test("If the GP ID is not 'V81999' make the Id the value", () => {
    const idValue = "testValue"
    fhirPatient.generalPractitioner = createGpWithIdValue(idValue)

    const patientsubjectOf = convertPatient(bundle, fhirPatient, logger).patientPerson.playedProviderPatient.subjectOf
    const actual = patientsubjectOf.patientCareProvision.responsibleParty.healthCareProvider.id._attributes

    expect(actual).toEqual({extension: idValue, root: "1.2.826.0.1285.0.1.10"})
  })

  test("If the GP code is missing, then the Id should have nullFlavor 'UNK'", () => {
    const newBundle = clone(TestResources.specification[0].fhirMessageUnsigned)
    const fhirPatient = getPatient(newBundle)
    delete fhirPatient.generalPractitioner

    const patientsubjectOf = convertPatient(bundle, fhirPatient, logger).patientPerson.playedProviderPatient.subjectOf
    const actual = patientsubjectOf.patientCareProvision.responsibleParty.healthCareProvider.id._attributes

    expect(actual).toEqual({nullFlavor: "UNK"})
  })

  test("If the GP code is empty, then the Id should have nullFlavor 'UNK'", () => {
    const newBundle = clone(TestResources.specification[0].fhirMessageUnsigned)
    const fhirPatient = getPatient(newBundle)
    fhirPatient.generalPractitioner = []

    const patientsubjectOf = convertPatient(bundle, fhirPatient, logger).patientPerson.playedProviderPatient.subjectOf
    const actual = patientsubjectOf.patientCareProvision.responsibleParty.healthCareProvider.id._attributes

    expect(actual).toEqual({nullFlavor: "UNK"})
  })
  function createGpWithIdValue(idValue: string) {
    return [
      {
        identifier: {
          system: "https://fhir.nhs.uk/Id/ods-organization-code",
          value: idValue
        }
      }
    ]
  }
})
