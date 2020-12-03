import * as fhir from "../../../models/fhir/fhir-resources"
import {IdentifierReference, Organization} from "../../../models/fhir/fhir-resources"
import * as hl7 from "../../../models/hl7-v3/hl7-v3-people-places"
import * as codes from "../../../models/hl7-v3/hl7-v3-datatypes-codes"
import {InvalidValueError} from "../../../models/errors/processing-errors"
import moment from "moment"
import {convertAddress, convertName} from "./common"

export function createPatient(hl7Patient: hl7.Patient): fhir.Patient {
  const patient = {resourceType: "Patient"} as fhir.Patient

  patient.identifier = createNhsNumberIdentifier(hl7Patient.id._attributes.extension)

  patient.name = convertName(hl7Patient.patientPerson.name)

  patient.gender = convertGender(hl7Patient.patientPerson.administrativeGenderCode)

  patient.birthDate = convertHL7V3DateStringToISODate(hl7Patient.patientPerson.birthTime._attributes.value)

  patient.address = convertAddress(hl7Patient.addr)

  const hl7PatientCareProvision = hl7Patient.patientPerson.playedProviderPatient.subjectOf.patientCareProvision
  const hl7OdsCode = hl7PatientCareProvision.responsibleParty.healthCareProvider.id._attributes.extension
  patient.generalPractitioner = createGeneralPractitioner(hl7OdsCode)

  return patient
}

function createNhsNumberIdentifier(nhsNumber: string) {
  return [
    {
      extension:  [
        {
          url: "https://fhir.nhs.uk/R4/StructureDefinition/Extension-UKCore-NHSNumberVerificationStatus",
          valueCodeableConcept: {
            coding:  [
              {
                system: "https://fhir.nhs.uk/R4/CodeSystem/UKCore-NHSNumberVerificationStatus",
                code: "01",
                display: "Number present and verified"
              }
            ]
          }
        }
      ],
      system: "https://fhir.nhs.uk/Id/nhs-number",
      value: nhsNumber
    }
  ] as Array<fhir.Identifier>
}

export function convertGender(hl7Gender: codes.SexCode): string {
  switch (hl7Gender._attributes.code) {
  case codes.SexCode.MALE._attributes.code:
    return "male"
  case codes.SexCode.FEMALE._attributes.code:
    return "female"
  case codes.SexCode.INDETERMINATE._attributes.code:
    return "other"
  case codes.SexCode.UNKNOWN._attributes.code:
    return "unknown"
  default:
    throw new InvalidValueError(`Unhandled gender '${hl7Gender}'.`)
  }
}

function convertHL7V3DateToMoment(hl7Date: string) {
  return moment(hl7Date, "YYYYMMDD")
}

function convertMomentToISODate(moment: moment.Moment): string {
  return moment.format("YYYY-MM-DD")
}

function convertHL7V3DateStringToISODate(hl7Date: string): string {
  const dateTimeMoment = convertHL7V3DateToMoment(hl7Date)
  return convertMomentToISODate(dateTimeMoment)
}

function createGeneralPractitioner(hl7OdsCode: string): Array<IdentifierReference<Organization>> {
  return [{
    identifier: {
      "system": "https://fhir.nhs.uk/Id/ods-organization-code",
      "value": hl7OdsCode
    }}]
}
