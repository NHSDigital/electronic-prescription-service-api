import * as fhir from "../../../models/fhir/fhir-resources"
import {SpineCancellationResponse} from "../../../models/hl7-v3/hl7-v3-spine-response"
import {Patient} from "../../../models/hl7-v3/hl7-v3-people-places"
import * as codes from "../../../models/hl7-v3/hl7-v3-datatypes-codes"
import {InvalidValueError} from "../../../models/errors/processing-errors"
import moment from "moment"
import {IdentifierReference, Organization} from "../../../models/fhir/fhir-resources"
import * as core from "../../../models/hl7-v3/hl7-v3-datatypes-core"
import {toArray} from "../common"

export function createPatient(message: SpineCancellationResponse): fhir.Patient {
  const patient = {resourceType: "Patient"} as fhir.Patient
  const actEvent = message["hl7:PORX_IN050101UK31"]["hl7:ControlActEvent"]
  const cancellationResponse = actEvent["hl7:subject"].CancellationResponse
  const hl7Patient = cancellationResponse.recordTarget.Patient

  patient.identifier = createNhsNumberIdentifier(hl7Patient)

  const hl7Name = toArray(hl7Patient.patientPerson.name)
  patient.name = createName(hl7Name)

  const hl7Gender = hl7Patient.patientPerson.administrativeGenderCode
  patient.gender = convertGender(hl7Gender)

  const hl7BirthDate = hl7Patient.patientPerson.birthTime._attributes.value
  patient.birthDate = convertHL7V3DateStringToISODate(hl7BirthDate)

  const hl7Address = toArray(hl7Patient.addr)
  patient.address = createAddress(hl7Address)

  patient.generalPractitioner = createGeneralPractitioner(hl7Patient)

  return patient
}

function createNhsNumberIdentifier(patient: Patient) {
  const nhsNumber = patient.id._attributes.extension
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

//TODO multiple GPs?
function createGeneralPractitioner(patient: Patient): Array<IdentifierReference<Organization>> {
  const hl7PatientCareProvision = patient.patientPerson.playedProviderPatient.subjectOf.patientCareProvision
  const hl7OdsCode = hl7PatientCareProvision.responsibleParty.healthCareProvider.id._attributes.extension
  return [{identifier: {
    "system": "https://fhir.nhs.uk/Id/ods-organization-code",
    "value": hl7OdsCode
  }}]
}

function convertNameUse(hl7NameUse: string): string {
  switch (hl7NameUse) {
  //TODO NameUse.USUAL could be either "usual" or "official", how do we tell?
  case core.NameUse.USUAL:
  //case "usual":
    return "official"
  //TODO NameUse.PREFERRED could be either "temp" or "anonymous", how do we tell?
  case core.NameUse.ALIAS:
  //case "anonymous":
    return "temp"
  case core.NameUse.PREFERRED:
    return "nickname"
  case core.NameUse.PREVIOUS:
    return "old"
  case core.NameUse.PREVIOUS_MAIDEN:
    return "maiden"
  default:
    throw new InvalidValueError(`Unhandled name use '${hl7NameUse}'.`)
  }
}

function createName(hl7Name: Array<core.Name>) {
  return hl7Name.map(name => ({
    use: convertNameUse(name._attributes.use),
    family: name.family._text,
    given: toArray(name.given).map(given => given._text),
    prefix: toArray(name.prefix).map(prefix => prefix._text)
  }))
}

function convertAddressUse(fhirAddressUse: string): string {
  switch (fhirAddressUse) {
  case core.AddressUse.HOME:
    return "home"
  case core.AddressUse.WORK:
    return "work"
  case core.AddressUse.TEMPORARY:
    return "temp"
  case core.AddressUse.POSTAL:
    return "billing"
  case undefined:
    return undefined
  default:
    throw new InvalidValueError(`Unhandled address use '${fhirAddressUse}'.`)
  }
}

function createAddress(hl7Address: Array<core.Address>) {
  return hl7Address.map(address => ({
    use: convertAddressUse(address._attributes.use),
    line: address.streetAddressLine.map(addressLine => addressLine._text),
    postalCode: address.postalCode._text
  }))
}
