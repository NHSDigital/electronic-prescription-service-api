import * as fhir from "../../../models/fhir/fhir-resources"
import {IdentifierReference, Organization} from "../../../models/fhir/fhir-resources"
import * as hl7 from "../../../models/hl7-v3/hl7-v3-people-places"
import * as codes from "../../../models/hl7-v3/hl7-v3-datatypes-codes"
import {InvalidValueError} from "../../../models/errors/processing-errors"
import {convertAddress, convertName} from "./common"
import {convertHL7V3DateStringToISODate} from "../common"
import * as uuid from "uuid"

export function createPatient(hl7Patient: hl7.Patient): fhir.Patient {
  return {
    resourceType: "Patient",
    id: uuid.v4.toString().toLowerCase(),
    identifier: createNhsNumberIdentifier(hl7Patient.id._attributes.extension),
    name: convertName(hl7Patient.patientPerson.name),
    gender: convertGender(hl7Patient.patientPerson.administrativeGenderCode),
    birthDate: convertHL7V3DateStringToISODate(hl7Patient.patientPerson.birthTime._attributes.value),
    address: convertAddress(hl7Patient.addr),
    generalPractitioner: createGeneralPractitioner(hl7Patient)
  }
}

function createNhsNumberIdentifier(nhsNumber: string): Array<fhir.PatientIdentifier> {
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
  ]
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

function createGeneralPractitioner(hl7Patient: hl7.Patient): Array<IdentifierReference<Organization>> {
  const hl7PatientCareProvision = hl7Patient.patientPerson.playedProviderPatient.subjectOf.patientCareProvision
  const hl7OdsCode = hl7PatientCareProvision.responsibleParty.healthCareProvider.id._attributes.extension
  return [{
    identifier: {
      "system": "https://fhir.nhs.uk/Id/ods-organization-code",
      "value": hl7OdsCode
    }}]
}
